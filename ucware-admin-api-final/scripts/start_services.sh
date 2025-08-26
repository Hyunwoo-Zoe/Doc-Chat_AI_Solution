
#!/bin/bash

"""start_services.sh
Redis + Chroma 수동 실행 스크립트.

기능
----
1. Redis 서버 실행 및 연결 확인
2. Chroma 서버 실행 (포트 9000)
3. 상태 점검 (ping/heartbeat)

의도
----
- docker-compose 환경을 쓰지 않고도
  개발자가 Redis/Chroma를 단독 실행할 수 있도록 지원한다.
- 포트/경로 변경 시 이 스크립트를 수정해 바로 적용 가능.
"""

# ───────────────────────────── Redis 실행 ─────────────────────────────
echo "[1] Redis 서버 수동 실행"
redis-server --daemonize yes   # 백그라운드에서 Redis 실행 (--daemonize yes)

sleep 1
echo "[2] Redis 연결 확인"
redis-cli ping || echo "❌ Redis 연결 실패"  # PING 응답 없으면 오류 메시지 출력

# ───────────────────────────── Chroma 실행 ─────────────────────────────
echo "[3] Chroma 서버 실행 (포트 9000)"

# ⚠️ --no-auth, --no-telemetry 옵션은 필요 시만 사용 (운영 환경 보안 고려)
#nohup chroma run --path ./chroma_db --host 0.0.0.0 --port 9000 --no-auth --no-telemetry > chroma.log 2>&1 &

mkdir -p ./chroma_db  # 데이터 디렉토리 없으면 생성
sleep 1

# 백그라운드 실행, 로그는 chroma.log에 기록
nohup chroma run --path ./chroma_db --host 0.0.0.0 --port 9000 > chroma.log 2>&1 &

# 개발자가 포그라운드 실행 원할 때는 아래 사용
# chroma run --path ./chroma_db --host 0.0.0.0 --port 9000

sleep 2
echo "[4] Chroma 상태 확인"
curl -s http://localhost:9000/api/v2/heartbeat || echo "❌ Chroma 연결 실패"

# ───────────────────────────── 완료 ─────────────────────────────
echo "[✔] Redis & Chroma 실행 완료"

