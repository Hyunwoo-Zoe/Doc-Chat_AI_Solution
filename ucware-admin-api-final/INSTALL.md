
# INSTALL.md

🛠️ 설치 가이드: UCWARE Admin API

이 문서는 UCWARE Admin API 프로젝트를 설치하고 실행하기 위한 전체 환경 설정 방법을 안내합니다.

📌 1. 시스템 요구 사항

Ubuntu 20.04+ 또는 호환 리눅스 배포판

Python 3.11 이상 (로컬 실행 시)

Docker 24+ / Docker Compose v2 (권장)

Redis 7+

Chroma (Vector DB, HTTP 서버)

📦 2. 시스템 패키지 설치 (로컬 실행 시)
sudo apt update
sudo apt install -y \
    redis-server \
    tesseract-ocr \
    poppler-utils

🔍 Redis 상태 확인 및 실행
sudo systemctl enable redis
sudo systemctl start redis
sudo systemctl status redis

🐍 3. Python 가상환경 설정 (권장)
python3 -m venv .venv
source .venv/bin/activate

📚 4. Python 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt

⚙️ 5. 환경 변수 설정
자동 설정 (권장)
./setup_env.sh


실행 시 .env 파일 생성

LLM Provider(OpenAI/HuggingFace) 선택

OpenAI / Tavily API Key 입력 가능

수동 설정 (직접 작성)

.env 예시:

CHROMA_HOST=localhost
CHROMA_PORT=9000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_TTL_DAYS=7
LLM_PROVIDER=openai
EMBEDDING_MODEL_NAME=text-embedding-3-large
LLM_MODEL_NAME=gpt-3.5-turbo
OPENAI_API_KEY=sk-xxxx
TAVILY_API_KEY=tvly-xxxx
ADMIN_UI_ORIGINS=http://localhost:3000

🚀 6. 서버 실행
🌐 Docker Compose 실행 (권장)
docker compose up -d


Admin API: http://localhost:8001/docs

Redis: localhost:6379

Chroma: http://localhost:8000

🌐 로컬 직접 실행 (uvicorn)
./run_admin_api.sh


기본 포트는 8001, 로그는 admin_api.log에 기록됩니다.

🧪 7. 테스트 및 확인
✅ Admin API 상태 확인
curl http://localhost:8001/vector/statistics


응답 예시:

{
  "count": 0,
  "file_ids": [],
  "disk_estimate": {
    "base_path": "./chroma_db",
    "disk_usage_bytes": 0,
    "disk_usage_mb": 0.0,
    "status": "calculated"
  }
}

✅ 캐시 삭제 로그 조회
curl "http://localhost:8001/cache/deletion-log?date=2025-08-26"

✅ 전체 삭제 실행
curl -X DELETE http://localhost:8001/system/all

📎 참고사항

start_services.sh / stop_services.sh는 개발 편의용 스크립트입니다.
운영 환경에서는 Docker Compose 또는 k8s 환경에서 Redis/Chroma를 관리하는 것을 추천드립니다.

Admin API(8001)는 내부 관리자 전용 API입니다.
외부 노출 시 반드시 인증/방화벽 설정이 필요합니다.

✅ 요약 체크리스트

 1. Redis 실행 확인
 2. Chroma 실행 확인
 3. .env 생성 완료
 4. Python 의존성 설치 / Docker Compose 실행
 5. Admin API /docs 정상 접속
 6. Vector/Cache API 호출 정상 응답
