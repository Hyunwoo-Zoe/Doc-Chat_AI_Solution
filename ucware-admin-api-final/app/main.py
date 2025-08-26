
"""main.py
UCWARE Admin API 진입점.

기능
----
- FastAPI 앱 생성 및 lifespan 관리
- CORS 미들웨어 설정
- 관리자용 컨트롤러(router) 등록
- 백그라운드 정리 스케줄러 실행

의도
----
관리자 전용 API 서버의 메인 엔트리로,
Vector/Cache/System 관리용 라우터와 스케줄러를 통합한다.
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import os
from fastapi.middleware.cors import CORSMiddleware
from app.background.cleanup_scheduler import register_cleanup_task

from app.controller import (
    cache_management_controller,
    vector_management_controller,
    system_management_controller
)

# ────────────────────────────── Lifespan ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan 훅.

    동작
    ----
    - 앱 시작 시 cleanup_job 백그라운드 태스크 실행
    - 앱 종료 시 해당 태스크 취소
    """
    print("[DEBUG] main.py 시작됨", flush=True)
    task = None
    try:
        from app.background.cleanup_scheduler import cleanup_job
        task = asyncio.create_task(cleanup_job())  # 🔥 직접 task 등록
        print("[LIFESPAN] 백그라운드 작업 등록 완료", flush=True)
    except Exception as e:
        print(f"[LIFESPAN] 백그라운드 작업 등록 중 오류: {e}", flush=True)
    yield
    if task:
        task.cancel()
        print("[LIFESPAN] 종료 시 백그라운드 작업 취소 완료", flush=True)

# ────────────────────────────── FastAPI 앱 ─────────────────────────────
app = FastAPI(title="UCWARE Admin API", lifespan=lifespan)

# ────────────────────────────── CORS 설정 ─────────────────────────────
origins = os.getenv("ADMIN_UI_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────── Router 등록 ─────────────────────────────
app.include_router(cache_management_controller.router)
app.include_router(vector_management_controller.router)
app.include_router(system_management_controller.router)
