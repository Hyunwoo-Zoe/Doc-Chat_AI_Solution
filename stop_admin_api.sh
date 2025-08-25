#!/bin/bash
# 관리자 FastAPI 서버 종료 스크립트

PORT=8001

echo "🛑 관리자 FastAPI 서버 종료 시도 중 (포트: $PORT)..."

# 1. 해당 포트를 LISTEN 중인 PID 조회
PID=$(lsof -t -i:$PORT)

if [ -z "$PID" ]; then
  echo "⚠️ 포트 $PORT에서 실행 중인 프로세스가 없습니다."
  exit 0
fi

# 2. 종료
kill $PID
sleep 2

# 3. 확인
if lsof -i:$PORT | grep LISTEN > /dev/null; then
  echo "❌ 종료 실패: 포트 $PORT에서 아직 프로세스가 실행 중입니다."
  exit 1
else
  echo "✅ 관리자 FastAPI 서버가 정상적으로 종료되었습니다."
fi
