
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.vectordb.vector_db import get_vector_db, VectorDB
from app.cache.cache_db import get_cache_db
from fastapi import HTTPException
router = APIRouter(prefix="/vector", tags=["vector-management"])

@router.get("/statistics")
async def vector_statistics(vdb: VectorDB = Depends(get_vector_db)):
    try:
        file_ids = vdb.list_stored_documents()
        disk_info = vdb.get_memory_estimate()
        return {
            "count": len(file_ids),
            "file_ids": file_ids,
            "disk_estimate": disk_info
        }
    except Exception as e:
        return {"error": f"VectorDB 조회 중 오류: {e}"}

@router.get("/check/{file_id}")
async def check_vector_exists(file_id: str, vdb: VectorDB = Depends(get_vector_db)):
    return {
        "file_id": file_id,
        "exists": file_id in vdb.list_stored_documents()
    }

@router.delete("/cleanup-unused")
async def cleanup_unused_vectors(
    vdb: VectorDB = Depends(get_vector_db),
    cache = Depends(get_cache_db)
):
    """캐시에 없는 벡터들을 찾아서 삭제"""
    try:
        # cleanup 실행
        deleted = vdb.cleanup_unused_vectors(cache)
        
        # 삭제된 벡터들에 대해 로그 기록
        for file_id in deleted:
            vdb._log_vector_deletion(file_id)
        
        return {
            "success": True,
            "deleted_count": len(deleted),
            "deleted_file_ids": deleted,
            "message": f"{len(deleted)}개의 미사용 벡터가 삭제되었습니다."
        }
    except Exception as e:
        print(f"[API] cleanup-unused 예외: {e}")
        # 에러가 발생해도 부분적으로 삭제된 것이 있을 수 있음
        return {
            "success": False,
            "deleted_count": 0,
            "deleted_file_ids": [],
            "error": f"정리 도중 오류 발생: {str(e)}",
            "message": "벡터 정리 중 오류가 발생했습니다."
        }
        
@router.get("/cleanup-log")
async def get_cleanup_log(
    date: str = Query(..., description="YYYY-MM-DD 형식의 날짜"),
    cache = Depends(get_cache_db)
):
    # 🔐 날짜 형식 검증
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식은 YYYY-MM-DD이어야 합니다.")

    # ✅ Redis 로그 조회
    key = f"vector:deleted:{date}"
    logs = cache.r.lrange(key, 0, -1)

    return {
        "date": date,
        "deleted_file_ids": [entry.split("|")[0] for entry in logs],
        "raw_entries": logs
    }

@router.delete("/delete/{file_id}")
async def delete_vector(
    file_id: str,
    vdb: VectorDB = Depends(get_vector_db)
):
    """특정 file_id의 벡터를 강제로 삭제"""
    success = vdb.delete_document(file_id)
    if success:
        vdb._log_vector_deletion(file_id)  # ✅ 여기 추가해줘야 로그에 찍힘
    return {
        "file_id": file_id,
        "deleted": success
    }

@router.delete("/all")
async def delete_all_vectors(vector: VectorDB = Depends(get_vector_db)):
    file_ids = vector.list_stored_documents()
    deleted_count = 0

    for fid in file_ids:
        if vector.delete_document(fid):
            deleted_count += 1

    return {
        "message": "All vectors deleted",
        "deleted_count": deleted_count
    }

@router.delete("/cleanup-log")
async def delete_vector_log(
    date: str = Query(..., description="YYYY-MM-DD 형식의 날짜"),
    cache = Depends(get_cache_db)
):
    key = f"vector:deleted:{date}"
    deleted = cache.r.delete(key)
    return {
        "date": date,
        "deleted": bool(deleted)
    }

@router.get("/by-date")
async def get_vectors_by_date(
    date: str = Query(..., description="YYYY-MM-DD"),
    vdb: VectorDB = Depends(get_vector_db)
):
    # 🔐 날짜 형식 검증
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식은 YYYY-MM-DD이어야 합니다.")

    try:
        print(f"[DEBUG] get_vectors_by_date() 호출됨, date = {date}")
        file_ids = vdb.get_vectors_by_date(date)
        return {
            "date": date,
            "count": len(file_ids),
            "file_ids": file_ids
        }
    except Exception as e:
        return {"error": f"벡터 날짜별 조회 중 오류: {e}"}