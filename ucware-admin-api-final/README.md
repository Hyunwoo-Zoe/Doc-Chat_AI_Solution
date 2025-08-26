
# UCWARE Admin API

UCWARE Admin API는 관리자 전용 벡터·캐시 관리 서버입니다.
Chroma(Vector DB)와 Redis(Cache)를 직접 제어하여, 웹 UI(Next.js)와 연동해 리소스 점검·정리·로그 조회 기능을 제공합니다.

🌟 주요 특징

📊 Vector 관리: 통계 조회, 존재 확인, 날짜별 조회, 미사용 정리, 개별/전체 삭제, 삭제 로그 관리

🧠 Cache 관리: 요약본 조회, 메타데이터 조회, TTL 정리, 삭제 로그, 요약 요청 로그 관리

🧹 시스템 관리: Vector + Cache 전체 데이터 삭제

🕓 자동 정리 스케줄러: 매일 새벽 3시에 Redis 기준으로 미사용 벡터 자동 삭제

🛡 내부 전용 API: 인증/방화벽 설정을 통해 관리자만 접근 가능하도록 설계

🏗 아키텍처 개요
[Admin UI] → [Admin API (FastAPI:8001)]
                   │
                   ├─ Redis (Cache/Logs:6379)
                   └─ Chroma (VectorDB:9000)

※ 매일 03:00: Redis 기준으로 미사용 벡터 자동 정리

🚀 빠른 시작
1. 저장소 클론
git clone <REPO_URL>
cd ucware-admin-api

2. 환경 설정
./setup_env.sh


.env 파일 자동 생성

LLM Provider(OpenAI/HuggingFace) 선택 가능

API Key(OpenAI, Tavily) 입력

3. 실행 방법

Docker Compose (권장)

docker compose up -d


Admin API → http://localhost:8001/docs

Redis → localhost:6379

Chroma → http://localhost:8000

로컬 직접 실행

./run_admin_api.sh


기본 포트: 8001

로그 파일: admin_api.log

🧪 기능 확인
✅ 벡터 통계 조회
curl http://localhost:8001/vector/statistics

✅ 캐시 삭제 로그 조회
curl "http://localhost:8001/cache/deletion-log?date=2025-08-26"

✅ 전체 데이터 삭제
curl -X DELETE http://localhost:8001/system/all

📎 참고사항

start_services.sh / stop_services.sh → 개발 편의용 스크립트
(운영 환경에서는 Docker Compose 또는 k8s 사용 권장)

Admin API(8001)는 내부 관리자 전용 API
→ 외부 노출 시 반드시 인증/방화벽으로 보호 필요

✅ 체크리스트

 Redis 실행 확인

 Chroma 실행 확인

 .env 생성 완료

 Docker Compose 또는 로컬 실행 완료

 /docs 접속 정상

 Vector/Cache API 호출 정상