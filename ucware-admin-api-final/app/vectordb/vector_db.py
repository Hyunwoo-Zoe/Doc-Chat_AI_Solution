
"""vector_db.py
Chroma 기반 VectorDB 어댑터 모듈.

기능
----
- 문서 벡터화/저장/조회/삭제
- 캐시와 동기화된 미사용 벡터 정리
- 날짜 기반 조회 및 디스크 사용량 추정

설계 포인트
===========
1. Embedding 선택:
   - LLM_PROVIDER 환경 변수에 따라 OpenAI/HuggingFace Embeddings 선택.

2. 저장 구조:
   - file_id별 collection 분리.
   - LangChain Chroma VectorStore 사용.

3. 유지보수:
   - 캐시에 없는 벡터 정리(cleanup_unused_vectors).
   - 삭제/정리 이벤트 Redis 로그 기록.

환경 변수
---------
- CHROMA_HOST, CHROMA_PORT: Chroma 서버 연결 정보
- LLM_PROVIDER: "openai" 또는 "hf"
- EMBEDDING_MODEL_NAME: 임베딩 모델 이름
- CHROMA_PERSIST_DIR: Chroma DB 저장 디렉토리
"""

from __future__ import annotations

import os
import threading
from datetime import datetime
from functools import lru_cache
from typing import List, Union

import chromadb
from chromadb.config import Settings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from zoneinfo import ZoneInfo

from app.cache.cache_db import get_cache_db

# ─────────────────────── 환경 설정 ──────────────────────────────
CHUNK_SIZE      = 500
CHUNK_OVERLAP   = 50
_BATCH_SIZE     = 500

CHROMA_HOST     = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT     = int(os.getenv("CHROMA_PORT", "9000"))

LLM_PROVIDER         = os.getenv("LLM_PROVIDER", "openai")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")

_PERSIST_DIR    = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# ──────────────────── Embedding 선택 ────────────────────────────
def _get_embedding_model():
    """환경 변수 기반으로 임베딩 모델(OpenAI/HuggingFace)을 선택."""
    if LLM_PROVIDER.lower() == "hf":
        return HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return OpenAIEmbeddings(model=EMBEDDING_MODEL_NAME)

# ──────────────────── VectorDB 클래스 ───────────────────────────
class VectorDB:
    """Chroma VectorDB 어댑터."""

    def __init__(self) -> None:
        self.embeddings = _get_embedding_model()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )
        self._lock   = threading.RLock()
        self._client = None   # lazy 연결

    # ------------- Chroma client (lazy) ------------------------
    @property
    def client(self) -> chromadb.HttpClient | None:
        """Chroma HttpClient를 lazy-initialization 방식으로 연결."""
        if self._client is None:
            try:
                print(f"[VectorDB] Connecting → {CHROMA_HOST}:{CHROMA_PORT}")
                self._client = chromadb.HttpClient(
                    host=CHROMA_HOST,
                    port=CHROMA_PORT,
                )
                print("[VectorDB] ✅ Chroma connection OK")
            except Exception as e:
                print(f"[VectorDB] ❌ Chroma connect failed: {e}")
                self._client = None
        return self._client

    # ------------- 내부 헬퍼 -------------------------------
    def _get_collection_name(self, file_id: str) -> str:
        """file_id → collection_name 매핑."""
        return file_id

    def _get_vectorstore(self, file_id_or_col: str) -> Chroma:
        """file_id 또는 collection_name을 받아 Chroma VectorStore 반환."""
        if self.client is None:
            raise RuntimeError("Chroma client not available")
        return Chroma(
            client=self.client,
            collection_name=file_id_or_col,
            embedding_function=self.embeddings
        )

    # ------------- 기본 동작 -------------------------------
    def has_chunks(self, file_id: str) -> bool:
        """특정 file_id collection이 비어 있지 않은지 확인."""
        try:
            return self.client.get_collection(self._get_collection_name(file_id)).count() > 0  # type: ignore
        except Exception:
            return False

    def delete_document(self, file_id: str) -> bool:
        """특정 file_id의 collection 삭제."""
        try:
            with self._lock:
                self.client.delete_collection(self._get_collection_name(file_id))  # type: ignore
            return True
        except Exception as e:
            print(f"[VectorDB.delete_document] ❌ {e}")
            return False

    def list_stored_documents(self) -> List[str]:
        """현재 저장된 모든 collection(file_id) 목록 조회."""
        try:
            return [c.name for c in self.client.list_collections()]  # type: ignore
        except Exception as e:
            print(f"[VectorDB.list_stored_documents] ❌ {e}")
            return []

    # ------------- 유지보수/모니터링 -----------------------
    def cleanup_unused_vectors(self, cache) -> List[str]:
        """캐시에 없는 벡터들을 삭제."""
        deleted: List[str] = []
    
        vector_file_ids = self.list_stored_documents()
        print(f"[cleanup_unused_vectors] 전체 벡터 수: {len(vector_file_ids)}")
    
        for fid in vector_file_ids:
            try:
                # 캐시에서 PDF 정보 조회
                in_cache = cache.get_pdf(fid)
            
                # 캐시에 없으면 벡터 삭제
                if in_cache is None:
                    print(f"[cleanup_unused_vectors] 캐시에 없음, 삭제 예정: {fid}")
                    try:
                        if self.delete_document(fid):
                            deleted.append(fid)
                            print(f"[cleanup_unused_vectors] 삭제 성공: {fid}")
                        else:
                            print(f"[cleanup_unused_vectors] 삭제 실패: {fid}")
                    except Exception as e:
                        print(f"[cleanup_unused_vectors] delete_document 예외: {fid} → {e}")
                else:
                    print(f"[cleanup_unused_vectors] 캐시에 존재, 유지: {fid}")
                
            except Exception as e:
                # cache.get_pdf()에서 예외가 발생한 경우
                print(f"[cleanup_unused_vectors] cache.get_pdf 예외: {fid} → {e}")
                # 캐시 장애 가능성 → 삭제하지 않고 skip
                continue
    
        print(f"[cleanup_unused_vectors] 삭제 완료. 총 {len(deleted)}개 삭제됨")
        return deleted

    def is_chroma_alive(self) -> bool:
        """Chroma 서버가 응답하는지 확인."""
        try:
            self.client.heartbeat()         # type: ignore
            return True
        except Exception:
            return False

    def delete_all_vectors(self) -> int:
        """모든 collection(file_id) 삭제. 삭제 개수 반환."""
        cnt = 0
        for fid in self.list_stored_documents():
            if self.delete_document(fid):
                cnt += 1
        return cnt

    def get_vectors_by_date(self, date_str: str) -> List[str]:
        """메타데이터의 date 값이 특정 날짜인 벡터 목록 반환."""
        matches = set()
        for fid in self.list_stored_documents():
            try:
                docs = self._get_vectorstore(fid).similarity_search("dummy", k=1)
                if any(d.metadata.get("date") == date_str for d in docs):
                    matches.add(fid)
            except Exception:
                pass
        return list(matches)

    def get_memory_estimate(self) -> dict:
        """Chroma 저장 디렉토리 사용량 추정."""
        path = _PERSIST_DIR
        if not os.path.exists(path):
            return {
                "base_path": path,
                "disk_usage_bytes": -1,
                "disk_usage_mb": -1.0,
                "status": "path_not_found",
            }
        try:
            total_size_bytes = self._get_directory_size(path)
            total_size_mb = total_size_bytes / (1024 * 1024)
            
            return {
                "base_path": path,
                "disk_usage_bytes": total_size_bytes,
                "disk_usage_mb": round(total_size_mb, 2),
                "status": "calculated",
            }
        except Exception as e:
            print(f"[VectorDB] ❌ Failed to calculate disk usage: {e}")
            return {
                "base_path": path,
                "disk_usage_bytes": -1,
                "disk_usage_mb": -1.0,
                "status": f"error: {e}",
            }

    # ------------- 내부 유틸 ------------------------------
    def _get_directory_size(self, path: str) -> int:
        """디렉토리 크기를 재귀적으로 계산."""
        total = 0
        for root, _, files in os.walk(path):
            for fn in files:
                fp = os.path.join(root, fn)
                if os.path.isfile(fp):
                    total += os.path.getsize(fp)
        return total

    def _log_vector_deletion(self, file_id: str):
        """Redis에 vector 삭제 로그 기록."""
        try:
            r = get_cache_db().r
            now = datetime.now(ZoneInfo("Asia/Seoul"))
            key = f"vector:deleted:{now:%Y-%m-%d}"
            r.rpush(key, f"{file_id}|{now.isoformat()}")
        except Exception:
            pass

# ────────────────── 싱글턴 getter ───────────────────────────────
@lru_cache(maxsize=1)
def get_vector_db() -> "VectorDB":
    """VectorDB 싱글턴 반환."""
    return VectorDB()


