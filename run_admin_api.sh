#!/bin/bash
# run_admin_api.sh

PORT=8001

if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
  echo "[ℹ️] .env의 환경 변수를 불러왔습니다"
else
  echo "❌ .env 파일이 없습니다. 먼저 setup_env.sh를 실행해주세요."
  exit 1
fi

echo "[🚀] 관리자 FastAPI 서버를 포트 $PORT 에서 실행 중..."
nohup uvicorn app.main:app --host 0.0.0.0 --port $PORT > admin_api.log 2>&1 &

sleep 5

if lsof -i :$PORT | grep LISTEN; then
  echo "✅ 관리자 API 서버가 포트 $PORT 에서 정상적으로 실행되었습니다."
else
  echo "❌ 관리자 API 서버가 포트 $PORT 에서 실행되지 않았습니다."
  exit 1
fi

echo "🎉 관리자 API 실행 완료!"