
"""cleanup_scheduler.py
Chroma/Redis 리소스 정리 스케줄러.

설계 포인트
===========
1. Chroma 서버 기동 대기:
   - 서비스 시작 시 Chroma가 준비될 때까지 연결을 반복 시도.
   - /docs 엔드포인트가 200 OK일 때까지 대기.

2. 자동 정리 작업:
   - 매일 새벽 3시에 VectorDB와 Redis를 동기화.
   - Redis에 없는 file_id는 VectorDB에서 제거.
   - 정리 결과는 log_command를 통해 기록.

환경 변수
---------
- CHROMA_URL: Chroma 서버 엔드포인트 (기본: http://localhost:9000)
"""

import aiohttp
import asyncio
from datetime import datetime, timedelta
from app.vectordb.vector_db import get_vector_db
from app.cache.cache_db import get_cache_db
from zoneinfo import ZoneInfo 
from app.utils.log import log_command
import os

CHROMA_URL = os.getenv("CHROMA_URL", "http://localhost:9000")

print("[DEBUG] cleanup_scheduler 모듈이 로딩되었습니다", flush=True)

# ────────────────────────────────
# 1. Chroma가 뜰 때까지 대기
# ────────────────────────────────
async def wait_for_chroma():
    """Chroma 서버가 준비될 때까지 /docs 엔드포인트를 폴링한다.

    Returns:
        None: 200 OK 응답 시 반환.
    """
    while True:
        try:
            print("[DEBUG] 🕓 Chroma 연결 시도 중...", flush=True)
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{CHROMA_URL}/docs") as resp:
                    print(f"[DEBUG] 📡 Chroma 응답 코드: {resp.status}", flush=True)
                    if resp.status == 200:
                        print("[DEBUG] ✅ Chroma 서버 연결 성공!", flush=True)
                        return
        except Exception as e:
            print(f"[DEBUG] ❌ Chroma 연결 예외 발생: {e}", flush=True)
        await asyncio.sleep(1)

# ────────────────────────────────
# 2. 매일 새벽 3시 자동 정리 잡
# ────────────────────────────────
async def cleanup_job():
    """VectorDB와 Redis를 매일 새벽 3시에 정리한다.

    절차
    ----
    1. Chroma 준비 확인 (wait_for_chroma).
    2. 다음 3시까지 대기.
    3. VectorDB의 불필요한 벡터를 삭제하고 로그 기록.
    """
    print("[DEBUG] 🚀 cleanup_job 시작됨", flush=True)
    await wait_for_chroma()
    print("[DEBUG] 🔓 Chroma 확인 완료, 계속 진행", flush=True)

    while True:
        # 다음 3시까지 대기 시간 계산
        now = datetime.now(ZoneInfo("Asia/Seoul"))
        tomorrow_3am = (now + timedelta(days=1)).replace(
            hour=3, minute=0, second=0, microsecond=0
        )
        wait_sec = (tomorrow_3am - now).total_seconds()
        print(f"[DEBUG] ⏳ 다음 정리까지 대기: {int(wait_sec)}초 (예정 시각: {tomorrow_3am})", flush=True)

        await asyncio.sleep(wait_sec)

        try:
            print("[DEBUG] 🧪 정리 전 연결 확인 중...", flush=True)
            vdb = get_vector_db()
            cache = get_cache_db()

            # 디버깅: 현재 vector 목록 및 Redis 키 출력
            vector_ids = vdb.list_stored_documents()
            print(f"[DEBUG] 📦 현재 VectorDB에 저장된 file_id 수: {len(vector_ids)}", flush=True)
            print(f"[DEBUG] 📦 VectorDB file_ids: {vector_ids}", flush=True)

            used_ids = cache.get_all_file_ids()
            print(f"[DEBUG] 📌 Redis에 남아 있는 file_id 수: {len(used_ids)}", flush=True)
            print(f"[DEBUG] 📌 Redis file_ids: {used_ids}", flush=True)

            # Redis 기준으로 미사용 벡터 정리 실행
            deleted = vdb.cleanup_unused_vectors(cache)
            log_command(user="system", action="AutoCleanup @03:00", detail=f"deleted={deleted}")
        
        except Exception as e:
            print(f"[Cleanup @03:00] ❌ 예외 발생: {e}", flush=True)

# ────────────────────────────────
# 3. FastAPI lifespan에서 호출할 task 등록 함수
# ────────────────────────────────
async def register_cleanup_task() -> asyncio.Task:
    """FastAPI lifespan에서 cleanup_job을 task로 등록한다.

    Returns:
        asyncio.Task | None: 성공 시 task, 실패 시 None.
    """
    print("[DEBUG] register_cleanup_task() 진입", flush=True)
    try:
        return asyncio.create_task(cleanup_job())
    except Exception as e:
        print(f"[register_cleanup_task] cleanup_job 실행 중 예외 발생: {e}", flush=True)
        return None

