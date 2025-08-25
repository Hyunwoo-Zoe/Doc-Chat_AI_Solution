#!/bin/bash

# ────────────────────────────────
# Next.js dev 서버 재시작 스크립트
# 포트를 인자로 받아 해당 포트를 종료 후 dev 서버 백그라운드 실행
# 사용법: ./restart-next-dev.sh [PORT]
# 기본 포트: 3000
# ────────────────────────────────

PORT=${1:-3000}  # 인자로 포트 번호 받기, 없으면 3000

echo "🔍 Checking if port $PORT is in use..."

PID=$(sudo netstat -tulpn 2>/dev/null | grep ":$PORT" | awk '{print $7}' | cut -d'/' -f1)

if [ -n "$PID" ]; then
  echo "⚠ Port $PORT is in use by PID $PID. Killing it..."
  sudo kill -9 $PID
  echo "✅ Process $PID has been terminated."
else
  echo "✅ Port $PORT is free."
fi

echo "🚀 Starting Next.js dev server on port $PORT (background)..."
nohup env PORT=$PORT npm run dev > dev_$PORT.log 2>&1 &

echo "📂 Logs are being written to dev_$PORT.log"
echo "🌐 Access the server at: http://localhost:$PORT"

