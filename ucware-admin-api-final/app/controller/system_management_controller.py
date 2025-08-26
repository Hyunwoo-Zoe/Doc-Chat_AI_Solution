
"""system_management_controller.py
시스템 전체 관리 API 엔드포인트 모듈.

기능
----
- 전체 벡터 + 캐시 데이터 일괄 삭제 (/system/all)

의도
----
관리자가 긴급 상황이나 리셋이 필요할 때,
VectorDB와 Redis Cache의 모든 데이터를 한 번에 정리할 수 있도록 제공한다.
"""

from fastapi import APIRouter, Depends
from app.cache.cache_db import get_cache_db
from app.vectordb.vector_db import get_vector_db

router = APIRouter(prefix="/system", tags=["system-management"])

# ───────────────────────────── 전체 삭제 ─────────────────────────────
@router.delete("/all")
async def delete_all_data(
    cache = Depends(get_cache_db),
    vector = Depends(get_vector_db)
):
    """VectorDB와 Cache 데이터를 전부 삭제한다.

    Returns:
        dict: 삭제 결과
            - message: 상태 메시지
            - deleted_vectors: 삭제된 벡터 개수
            - deleted_cache_entries: 삭제된 캐시 항목 개수
    """
    # 📌 Vector 삭제
    deleted_vectors = vector.delete_all_vectors()

    # 📌 Cache 삭제
    deleted_cache_count = cache.delete_all_summaries()

    return {
        "message": "All vector and cache data deleted",
        "deleted_vectors": deleted_vectors,
        "deleted_cache_entries": deleted_cache_count
    }
