#!/bin/bash
# stop_services.sh: chroma, uvicorn(FastAPI), redis-server 종료

echo "🛑 Chroma 서버 종료 중..."
CHROMA_PIDS=$(lsof -i :9000 -t)
if [ -n "$CHROMA_PIDS" ]; then
  echo "$CHROMA_PIDS" | xargs kill
  echo "✔ Chroma (PID $CHROMA_PIDS) 종료 완료"
else
  echo "⚠️  Chroma 서버가 실행 중이지 않습니다."
fi

read -p "🌐 종료할 api포트 번호를 공백으로 구분해서 입력하세요 (예: 8000 8001 8002): " PORTS

for PORT in $PORTS; do
  echo "🛑 포트 $PORT에서 실행 중인 서버 종료 시도 중..."

  FASTAPI_PIDS=$(lsof -i :$PORT -t)

  if [ -n "$FASTAPI_PIDS" ]; then
    echo "$FASTAPI_PIDS" | xargs kill
    echo "✔ Fastapi 포트 $PORT의 프로세스(PID: $FASTAPI_PIDS) 종료 완료"
  else
    echo "⚠️  Fastapi 포트 $PORT에서 실행 중인 프로세스가 없습니다."
  fi
done

echo "✅ 모든 지정된 포트 종료 작업 완료"

echo "🛑 Redis 서버 종료 중..."
REDIS_PIDS=$(lsof -i :6379 -t)
if [ -n "$REDIS_PIDS" ]; then
  echo "$REDIS_PIDS" | xargs kill
  echo "✔ Redis (PID $REDIS_PIDS) 종료 완료"
else
  echo "⚠️  Redis 서버가 실행 중이지 않습니다."
fi

echo "✅ 모든 서버 종료 완료"

