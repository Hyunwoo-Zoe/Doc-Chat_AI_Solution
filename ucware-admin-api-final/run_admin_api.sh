
#!/bin/bash
"""run_admin_api.sh
UCWARE Admin API 실행 스크립트.

기능
----
1. `.env` 파일에서 환경 변수 로딩
2. FastAPI(Uvicorn) 서버를 포트 8001에서 실행
3. 실행 여부 확인 후 로그 출력

의도
----
- 개발/운영 환경에서 관리자 API를 간단히 실행할 수 있도록 지원.
- 로그는 admin_api.log에 기록되며, nohup을 사용해 백그라운드 실행됨.
"""

PORT=8001

# ───────────────────────────── 환경 변수 로딩 ─────────────────────────────
if [ -f .env ]; then
  # .env 파일의 모든 변수를 export
  set -o allexport
  source .env
  set +o allexport
  echo "[ℹ️] .env의 환경 변수를 불러왔습니다"
else
  echo "❌ .env 파일이 없습니다. 먼저 setup_env.sh를 실행해주세요."
  exit 1
fi

# ───────────────────────────── 서버 실행 ─────────────────────────────
echo "[🚀] 관리자 FastAPI 서버를 포트 $PORT 에서 실행 중..."

# nohup: 백그라운드 실행, 로그는 admin_api.log에 기록
nohup uvicorn app.main:app --host 0.0.0.0 --port $PORT > admin_api.log 2>&1 &

sleep 5

# ───────────────────────────── 실행 확인 ─────────────────────────────
if lsof -i :$PORT | grep LISTEN; then
  echo "✅ 관리자 API 서버가 포트 $PORT 에서 정상적으로 실행되었습니다."
else
  echo "❌ 관리자 API 서버가 포트 $PORT 에서 실행되지 않았습니다."
  exit 1
fi

# ───────────────────────────── 완료 ─────────────────────────────
echo "🎉 관리자 API 실행 완료!"
