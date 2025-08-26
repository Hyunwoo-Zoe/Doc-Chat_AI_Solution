
"""summary_dto.py
요약 요청 DTO 정의.

기능
----
- PDF 요약 요청 시 필요한 데이터 구조를 Pydantic 모델로 정의.
- FastAPI 라우터에서 요청 바디 유효성 검증에 사용.

필드
----
- file_id: 파일 고유 식별자
- pdf_url: 원본 PDF URL
- query: 사용자가 요청한 질문/쿼리
- lang: 요약/응답 언어 (예: "ko", "en")
"""

from pydantic import BaseModel, HttpUrl

class SummaryRequestDTO(BaseModel):
    """PDF 요약 요청 DTO.

    Attributes:
        file_id (str): 파일 고유 식별자.
        pdf_url (HttpUrl): PDF 파일의 URL.
        query (str): 질의·요약 요청 문장.
        lang (str): 응답 언어 코드 (예: "ko", "en").
    """
    file_id: str
    pdf_url: HttpUrl
    query: str
    lang: str
