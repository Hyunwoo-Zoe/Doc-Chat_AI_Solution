# app/infra/llm_engine.py
"""llm_engine.py
LLM 기반 Q&A 및 Map-Reduce 요약기.

갱신된 ``LlmChainIF`` 인터페이스를 구현::

    class LlmChainIF(Protocol):
        async def execute(self, prompt: str) -> str: ...
        async def summarize(self, docs: List[TextChunk]) -> str: ...

* **execute(prompt)** – 완전히 포맷된 프롬프트 문자열을 받아
  LLM 응답을 반환합니다.
* **summarize(docs)** – 주어진 텍스트 청크들에 대해
  LangChain의 ``map_reduce`` 방식으로 요약을 수행합니다.
"""


from __future__ import annotations

from typing import List
import re
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document

from app.infra.llm_factory import get_llm_instance
from app.domain.interfaces import LlmChainIF, TextChunk

# ───────────────────── 프롬프트 템플릿 정의 ─────────────────────

MAP_PROMPT = """
You are a helpful assistant that summarizes the following text.

{text}

Please summarize the text in a concise manner.

"""

COMBINE_PROMPT = """
You are a helpful assistant that combines the following summaries.

{text}

Please combine the summaries in a concise manner.

"""

# ───────────────────── LLM 엔진 구현체 ─────────────────────

class LlmEngine(LlmChainIF):
    """LlmChainIF 구현체로, LLM 기반 Q&A 및 요약 기능을 제공한다.

    Attributes:
        llm: LangChain LLM 실행 객체 (OpenAI 또는 HuggingFace 기반).
        map_prompt: 개별 문단 요약에 사용할 프롬프트 템플릿.
        combine_prompt: 통합 요약에 사용할 프롬프트 템플릿.
        _qa_chain: prompt → LLM → 출력 문자열 파서 체인.
        _summ_chain: 문서 리스트에 대한 map-reduce 요약 체인.
    """
    def __init__(self, *, temperature: float = 0.7):
        # Shared LLM instance
        self.llm = get_llm_instance(temperature=temperature)
        self.map_prompt = MAP_PROMPT
        self.combine_prompt = COMBINE_PROMPT
        
        # Qwen 모델인 경우 추론 과정을 출력하지 않는 /no_think를 프롬프트에에 추가
        if "qwen" in self.llm.model_name.lower():
            self.map_prompt += "/no_think"
            self.combine_prompt += "/no_think"
        
        # map_reduce langchain 방식 요약 프롬프트 설정
        self.map_prompt = PromptTemplate(template=self.map_prompt, input_variables=["text"])
        self.combine_prompt = PromptTemplate(template=self.combine_prompt, input_variables=["text"])

        # LangChain Runnable 체인을 구성: 입력 문자열 그대로 전달 → LLM 실행 → 문자열로 파싱
        self._qa_chain = (
            RunnablePassthrough()
            | self.llm
            | StrOutputParser()
        )

        # docs(list[str]) → map‑reduce → str (for *summarize*)
        self._summ_chain = load_summarize_chain(
            self.llm,
            chain_type="map_reduce",
            return_intermediate_steps=False,
            map_prompt=self.map_prompt,
            combine_prompt=self.combine_prompt,
        )

    # ------------------------------------------------------------------
    # LlmChainIF implementation
    # ------------------------------------------------------------------
    async def execute(self, prompt: str, think: bool = False) -> str:  # noqa: D401
        """LLM call with a fully‑formatted *prompt* string.

        Args:
            prompt: 완성된 프롬프트 문자열.
            think: /no_think 명령어 생략 여부.(Qwen 모델 한정, Qwen 모델은 /no_think 명령어를 통해 추론 과정을 출력하지 않게 할 수 있음)

        Returns:
            LLM 응답 문자열 (후처리 포함).
        """
        if not think and "qwen" in self.llm.model_name.lower():
            prompt = prompt + "/no_think"
        result = (await self._qa_chain.ainvoke(prompt)).strip()
        
        # </think> 태그 내부 내용 제거 (Qwen 모델의 추론 부분)
        if "</think>" in result:
            result = re.sub(r'<think>.*?</think>', '', result, flags=re.DOTALL).strip()
        return result


    async def summarize(self, docs: List[TextChunk]) -> str:  # noqa: D401
        """High‑level summary using map‑reduce over *docs*.

        Args:
            docs: TextChunk 문자열 리스트.

        Returns:
            요약 문자열 결과값.
        """
        lc_docs = [Document(page_content=t) for t in docs]
        # ``ainvoke`` returns the final summary string when
        # ``return_intermediate_steps=False``.
        result = await self._summ_chain.ainvoke({"input_documents": lc_docs})
        
        # Qwen 모델의 추론 부분 제거
        if "</think>" in result["output_text"]:
            result["output_text"] = re.sub(r'<think>.*?</think>', '', result["output_text"], flags=re.DOTALL).strip()
        return str(result["output_text"]).strip()

