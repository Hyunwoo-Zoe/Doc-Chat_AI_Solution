
import os
import redis
from functools import lru_cache
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import json
from zoneinfo import ZoneInfo

class RedisCacheDB:
    def __init__(
        self,
        host: str = os.getenv("REDIS_HOST", "localhost"),
        port: int = int(os.getenv("REDIS_PORT", "6379")),
        db: int = int(os.getenv("REDIS_DB", "0")),
        ttl_days: int = int(os.getenv("REDIS_TTL_DAYS", "7"))
    ):
        self.r = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.ttl_days = ttl_days
        
    def _get_date_key(self, date: datetime = None) -> str:
        """날짜를 기준으로 HSET key 생성"""
        if date is None:
            date = datetime.now(ZoneInfo("Asia/Seoul"))
        return f"pdf:summaries:{date.strftime('%Y-%m-%d')}"
    
    def _get_metadata_key(self, file_id: str) -> str:
        """파일 메타데이터용 key"""
        return f"pdf:metadata:{file_id}"

    def get_metadata(self, fid: str) -> Optional[dict]:
        raw = self.r.get(self._get_metadata_key(fid))
        if raw:
            return json.loads(raw)
        return None

    def get_summaries_by_date(self, date: datetime) -> Dict[str, str]:
        """특정 날짜의 모든 요약본 조회"""
        date_key = self._get_date_key(date)
        return self.r.hgetall(date_key)

    def get_summary_count_by_date(self, date: datetime) -> int:
        """특정 날짜의 요약본 개수 조회"""
        date_key = self._get_date_key(date)
        return self.r.hlen(date_key)

    def delete_pdf(self, fid: str) -> bool:
        metadata_key = self._get_metadata_key(fid)
        metadata = self.r.get(metadata_key)
        deleted = False

        if metadata:
            meta = json.loads(metadata)
            date_key = f"pdf:summaries:{meta['date']}"
            deleted = bool(self.r.hdel(date_key, fid))
            self.r.delete(metadata_key)
        else:
        # 메타데이터가 없으면 최근 날짜 중 찾아서 삭제
            for i in range(self.ttl_days):
                date = datetime.now(ZoneInfo("Asia/Seoul")) - timedelta(days=i)
                date_key = self._get_date_key(date)
                if self.r.hexists(date_key, fid):
                    deleted = bool(self.r.hdel(date_key, fid))
                    break

    # ✅ 삭제 성공했으면 무조건 로그 남기기
        if deleted:
            self._log_cache_deletion(fid)

        return deleted

    def get_all_file_ids(self) -> List[str]:
        """현재 저장된 모든 file_id 조회"""
        file_ids = []
        pattern = "pdf:summaries:*"
        
        for key in self.r.scan_iter(match=pattern):
            file_ids.extend(self.r.hkeys(key))
        
        return list(set(file_ids))  # 중복 제거

    def cleanup_expired_summaries(self):
        """수동으로 만료된 요약본 정리 (백업용)"""
        cutoff_date = datetime.now(ZoneInfo("Asia/Seoul")) - timedelta(days=self.ttl_days)
        
        # TTL이 지난 날짜의 key들 삭제
        for i in range(30):  # 최대 30일 전까지 확인
            check_date = cutoff_date - timedelta(days=i)
            date_key = self._get_date_key(check_date)
            
            if self.r.exists(date_key):
                self.r.delete(date_key)
                print(f"Deleted expired summaries for {check_date.strftime('%Y-%m-%d')}")

    def get_statistics(self) -> Dict:
        try:
            mem_info = self.r.info('memory')
            used_memory_bytes = mem_info.get('used_memory', 0)
            max_memory_bytes = mem_info.get('maxmemory', 0)

            bytes_to_mb = 1024 * 1024
            used_memory_mb = round(used_memory_bytes / bytes_to_mb, 2)
            max_memory_mb = round(max_memory_bytes / bytes_to_mb, 2) if max_memory_bytes > 0 else 0

            total_summaries = 0
            for key in self.r.scan_iter(match="pdf:summaries:*"):
                total_summaries += self.r.hlen(key)

            return {
                "used_memory_bytes": used_memory_bytes,
                "used_memory_mb": used_memory_mb,
                "max_memory_bytes": max_memory_bytes,
                "max_memory_mb": max_memory_mb,
                "total_summaries": total_summaries,
            }
        except Exception as e:
            print(f"❌ Error getting cache statistics: {e}")
            return {
                "used_memory_bytes": 0, "used_memory_mb": 0,
                "max_memory_bytes": 0, "max_memory_mb": 0,
                "total_summaries": 0,
            }

    def _log_cache_deletion(self, file_id: str):
        now = datetime.now(ZoneInfo("Asia/Seoul"))
        date_str = now.strftime('%Y-%m-%d')
        date_key = f"cache:deleted:{date_str}"
        entry = f"{file_id}|{now.isoformat()}"
        self.r.rpush(date_key, entry)
        print(f"[LOG] Deleted cache entry for {file_id} → {date_key} / {entry}")

    def delete_all_summaries(self) -> int:
        deleted_count = 0
        for key in self.r.scan_iter(match="pdf:summaries:*"):
            file_ids = self.r.hkeys(key)
            for fid in file_ids:
                self._log_cache_deletion(fid)
            
            deleted_count += self.r.hlen(key)
            self.r.delete(key)

        for key in self.r.scan_iter(match="pdf:metadata:*"):
            self.r.delete(key)
            
        return deleted_count

    def get_summary_logs(self, date: str) -> list[dict]:
        key = f"log:{date}"
        logs = self.r.hgetall(key)
        result = []
        for _, raw in logs.items():
            try:
                data = json.loads(raw)
                result.append({
                    "file_id": data.get("file_id", ""),
                    "query": data.get("query", ""),
                    "lang": data.get("lang", ""),
                    "timestamp": data.get("time", ""),
                })
            except Exception as e:
                continue  # skip malformed log
        return result

    
    def get_pdf(self, file_id: str) -> Optional[str]:
        for i in range(self.ttl_days):
            date = datetime.now(ZoneInfo("Asia/Seoul")) - timedelta(days=i)
            date_key = self._get_date_key(date)
        
            summary_data = self.r.hget(date_key, file_id)
            if summary_data:
                return summary_data
        return None

@lru_cache(maxsize=1)
def get_cache_db() -> "RedisCacheDB":
    return RedisCacheDB()

