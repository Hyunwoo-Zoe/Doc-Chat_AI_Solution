
"""cache_management_controller.py
캐시 관리 API 엔드포인트 모듈.

기능
----
- 캐시 통계 조회 (/cache/statistics)
- 날짜별 요약본 조회 (/cache/summaries/{date})
- 만료 요약본 정리 (/cache/cleanup)
- 특정/전체 요약본 삭제 (/cache/summary/{file_id}, /cache/all)
- 삭제 로그 조회/삭제 (/cache/deletion-log)
- 캐시 메타데이터 조회 (/cache/metadata/{file_id})
- 캐시 존재 여부 확인 (/cache/check/{file_id})
- 요약 요청 로그 조회 (/cache/summary-log)

의도
----
관리자가 Redis 캐시 상태를 점검하고, 필요 시 불필요한 요약본/로그를 삭제할 수 있도록
FastAPI 기반 REST 엔드포인트를 제공한다.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.cache.cache_db import get_cache_db
from fastapi import Query
import json

router = APIRouter(prefix="/cache", tags=["cache-management"])

# ───────────────────────────── 캐시 통계 ─────────────────────────────
@router.get("/statistics")
async def get_cache_statistics(cache = Depends(get_cache_db)):
    """Redis 메모리·요약본 통계를 반환한다."""
    return cache.get_statistics()
    
# ───────────────────────────── 요약본 조회 ─────────────────────────────
@router.get("/summaries/{date}")
async def get_summaries_by_date(
    date: str,
    cache = Depends(get_cache_db)
):
    """특정 날짜의 모든 요약본 조회."""
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        summaries = cache.get_summaries_by_date(date_obj)
        return {
            "date": date,
            "count": len(summaries),
            "file_ids": list(summaries.keys())
        }
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

# ───────────────────────────── 요약본 삭제 ─────────────────────────────
@router.delete("/cleanup")
async def cleanup_expired(cache = Depends(get_cache_db)):
    """만료된 요약본을 수동 정리한다."""
    cache.cleanup_expired_summaries()
    return {"message": "Cleanup completed"}

@router.delete("/summary/{file_id}")
async def delete_specific_summary(
    file_id: str,
    cache = Depends(get_cache_db)
):
    """특정 file_id에 해당하는 요약본 삭제."""
    success = cache.delete_pdf(file_id)
    return {
        "file_id": file_id,
        "deleted": success
    }

@router.delete("/all")
async def delete_all_cache(cache = Depends(get_cache_db)):
    """모든 요약본 및 메타데이터 삭제."""
    deleted = cache.delete_all_summaries()
    return {
        "message": "All cache summaries deleted",
        "deleted_count": deleted
    }

# ───────────────────────────── 삭제 로그 ─────────────────────────────
@router.get("/deletion-log")
async def get_cache_deletion_log(
    date: str = Query(..., description="YYYY-MM-DD 형식의 날짜"),
    cache = Depends(get_cache_db)
):
    """특정 날짜의 삭제 로그 조회."""
    key = f"cache:deleted:{date}"
    logs = cache.r.lrange(key, 0, -1)
    return {
        "date": date,
        "deleted_file_ids": [entry.split("|")[0] for entry in logs],
        "raw_entries": logs
    }

@router.delete("/deletion-log")
async def delete_cache_log(
    date: str = Query(..., description="YYYY-MM-DD 형식의 날짜"),
    cache = Depends(get_cache_db)
):
    """특정 날짜의 삭제 로그를 제거한다."""
    key = f"cache:deleted:{date}"
    deleted = cache.r.delete(key)
    return {
        "date": date,
        "deleted": bool(deleted)
    }

# ───────────────────────────── 메타데이터 ─────────────────────────────
@router.get("/metadata/{file_id}")
async def get_cache_metadata(
    file_id: str,
    cache = Depends(get_cache_db)
):
    """특정 file_id의 메타데이터 조회."""
    key = f"pdf:metadata:{file_id}"
    metadata = cache.r.get(key)
    if metadata:
        return {
            "file_id": file_id,
            "metadata": json.loads(metadata)
        }
    else:
        return {
            "file_id": file_id,
            "metadata": None,
            "message": "Metadata not found"
        }

# ───────────────────────────── 존재 여부 ─────────────────────────────
@router.get("/check/{file_id}")
async def check_cache_existence(file_id: str, cache = Depends(get_cache_db)):
    """특정 file_id의 캐시 존재 여부 확인."""
    exists = file_id in cache.get_all_file_ids()
    return {
        "file_id": file_id,
        "exists": exists
    }

# ───────────────────────────── 요약 요청 로그 ─────────────────────────────
@router.get("/summary-log")
async def get_summary_log(
    date: str = Query(..., description="YYYY-MM-DD 형식의 날짜"),
    cache = Depends(get_cache_db)
):
    """특정 날짜의 요약 요청 로그 조회."""
    key = f"log:{date}"
    raw_logs = cache.r.hgetall(key)

    parsed_logs = [
        {
            "timestamp": ts,
            **json.loads(log_json)
        }
        for ts, log_json in raw_logs.items()
    ]

    return {
        "date": date,
        "log_count": len(parsed_logs),
        "logs": parsed_logs,
    }
