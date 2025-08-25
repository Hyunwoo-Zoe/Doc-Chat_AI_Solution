# app/vectordb/vector_db.py
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

LLM_PROVIDER        = os.getenv("LLM_PROVIDER", "openai")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")

_PERSIST_DIR    = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# ──────────────────── Embedding 선택 ────────────────────────────
def _get_embedding_model():
    if LLM_PROVIDER.lower() == "hf":
        return HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return OpenAIEmbeddings(model=EMBEDDING_MODEL_NAME)

# ──────────────────── VectorDB 클래스 ───────────────────────────
class VectorDB:
    def __init__(self) -> None:
        self.embeddings = _get_embedding_model()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )

        self._lock   = threading.RLock()
        self._client = None                       # lazy 연결

    # ------------- Chroma client (lazy) ------------------------
    @property
    def client(self) -> chromadb.HttpClient | None:
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
        return file_id

    def _get_vectorstore(self, file_id_or_col: str) -> Chroma:
        """file_id 또는 이미 collection_name 이 들어와도 동작."""
        if self.client is None:
            raise RuntimeError("Chroma client not available")
        return Chroma(
            client=self.client,
            collection_name=file_id_or_col,
            embedding_function=self.embeddings
        )

    def has_chunks(self, file_id: str) -> bool:
        try:
            return self.client.get_collection(self._get_collection_name(file_id)).count() > 0  # type: ignore
        except Exception:
            return False

    def delete_document(self, file_id: str) -> bool:
        try:
            with self._lock:
                self.client.delete_collection(self._get_collection_name(file_id))  # type: ignore
            #self._log_vector_deletion(file_id)
            return True
        except Exception as e:
            print(f"[VectorDB.delete_document] ❌ {e}")
            return False

    def list_stored_documents(self) -> List[str]:
        try:
            return [c.name for c in self.client.list_collections()]  # type: ignore
        except Exception as e:
            print(f"[VectorDB.list_stored_documents] ❌ {e}")
            return []

    # ------------- 유지보수/모니터링 -----------------------
    # app/vectordb/vector_db.py
    # app/vectordb/vector_db.py의 cleanup_unused_vectors 메서드 수정

    def cleanup_unused_vectors(self, cache) -> List[str]:
        deleted: List[str] = []
    
        # 현재 저장된 모든 벡터 document 목록
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
            # 캐시 조회에 실패했다고 해서 벡터를 삭제하면 안됨
            # 캐시 시스템에 일시적인 문제가 있을 수 있음
                continue
    
        print(f"[cleanup_unused_vectors] 삭제 완료. 총 {len(deleted)}개 삭제됨")
        return deleted

    def is_chroma_alive(self) -> bool:
        try:
            self.client.heartbeat()         # type: ignore
            return True
        except Exception:
            return False

    def delete_all_vectors(self) -> int:
        cnt = 0
        for fid in self.list_stored_documents():
            if self.delete_document(fid):
                cnt += 1
        return cnt

    def get_vectors_by_date(self, date_str: str) -> List[str]:
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
        total = 0
        for root, _, files in os.walk(path):
            for fn in files:
                fp = os.path.join(root, fn)
                if os.path.isfile(fp):
                    total += os.path.getsize(fp)
        return total

    def _log_vector_deletion(self, file_id: str):
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
    return VectorDB()

