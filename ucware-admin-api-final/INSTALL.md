
# UCWARE Admin API - 설치 및 운영 가이드

## 📌 프로젝트 개요

UCWARE Admin API는 **관리자 전용 벡터·캐시 관리 서버**입니다. Chroma(Vector DB)와 Redis(Cache)를 직접 제어하여, 웹 UI(Next.js)와 연동해 리소스 점검·정리·로그 조회 기능을 제공합니다.

### 🌟 주요 특징
- **📊 Vector 관리**: 통계 조회, 존재 확인, 날짜별 조회, 미사용 정리, 개별/전체 삭제, 삭제 로그 관리
- **🧠 Cache 관리**: 요약본 조회, 메타데이터 조회, TTL 정리, 삭제 로그, 요약 요청 로그 관리
- **🧹 시스템 관리**: Vector + Cache 전체 데이터 삭제
- **🕓 자동 정리 스케줄러**: 매일 새벽 3시에 Redis 기준으로 미사용 벡터 자동 삭제
- **🛡 내부 전용 API**: 인증/방화벽 설정을 통해 관리자만 접근 가능하도록 설계

---

## 🏗️ 아키텍처 개요

```
[Admin UI] → [Admin API (FastAPI:8001)]
                    │
                    ├─ Redis (Cache/Logs:6379)
                    └─ Chroma (VectorDB:9000)
```

※ 매일 03:00: Redis 기준으로 미사용 벡터 자동 정리

---

## 🛠️ 설치 가이드

### 📌 1. 시스템 요구 사항

- Ubuntu 20.04+ 또는 호환 리눅스 배포판
- Python 3.11 이상 (로컬 실행 시)
- Docker 24+ / Docker Compose v2 (권장)
- Redis 7+
- Chroma (Vector DB, HTTP 서버)

### 📦 2. 시스템 패키지 설치 (로컬 실행 시)

```bash
sudo apt update
sudo apt install -y \
    redis-server \
    tesseract-ocr \
    poppler-utils
```

#### Redis 상태 확인 및 실행
```bash
sudo systemctl enable redis
sudo systemctl start redis
sudo systemctl status redis
```

### 🐍 3. Python 가상환경 설정 (권장)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 📚 4. Python 패키지 설치

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### ⚙️ 5. 환경 변수 설정

#### 자동 설정 (권장)
```bash
./setup_env.sh
```
- 실행 시 `.env` 파일 생성
- LLM Provider(OpenAI/HuggingFace) 선택
- OpenAI / Tavily API Key 입력 가능

#### 수동 설정 (직접 작성)
`.env` 예시:
```env
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
```

---

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone <REPO_URL>
cd ucware-admin-api
```

### 2. 환경 설정
```bash
./setup_env.sh
```

### 3. 실행 방법

#### 🌐 Docker Compose 실행 (권장)
```bash
docker compose up -d
```
- Admin API → http://localhost:8001/docs
- Redis → localhost:6379
- Chroma → http://localhost:8000

#### 🌐 로컬 직접 실행
```bash
./run_admin_api.sh
```
- 기본 포트: 8001
- 로그 파일: admin_api.log

---

## 🧪 기능 확인

### ✅ 벡터 통계 조회
```bash
curl http://localhost:8001/vector/statistics
```

응답 예시:
```json
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
```

### ✅ 캐시 삭제 로그 조회
```bash
curl "http://localhost:8001/cache/deletion-log?date=2025-08-26"
```

### ✅ 전체 데이터 삭제
```bash
curl -X DELETE http://localhost:8001/system/all
```

---

## 📋 API 엔드포인트 목록

### Vector 관리
- `GET /vector/statistics` - 전체 벡터 통계 조회
- `GET /vector/exists/{vector_id}` - 특정 벡터 존재 확인
- `GET /vector/by-date` - 날짜별 벡터 조회
- `DELETE /vector/unused` - 미사용 벡터 정리
- `DELETE /vector/{vector_id}` - 개별 벡터 삭제
- `DELETE /vector/all` - 전체 벡터 삭제
- `GET /vector/deletion-log` - 삭제 로그 조회

### Cache 관리
- `GET /cache/summary/{vector_id}` - 요약본 조회
- `GET /cache/metadata/{vector_id}` - 메타데이터 조회
- `DELETE /cache/cleanup-ttl` - TTL 기반 정리
- `GET /cache/deletion-log` - 삭제 로그 조회
- `GET /cache/request-log` - 요약 요청 로그 조회

### 시스템 관리
- `DELETE /system/all` - Vector + Cache 전체 데이터 삭제

---

## 📎 참고사항

- `start_services.sh` / `stop_services.sh`는 개발 편의용 스크립트입니다.
  - 운영 환경에서는 Docker Compose 또는 k8s 환경에서 Redis/Chroma를 관리하는 것을 추천드립니다.

- Admin API(8001)는 내부 관리자 전용 API입니다.
  - 외부 노출 시 반드시 인증/방화벽 설정이 필요합니다.

---

## ✅ 체크리스트

- [ ] Redis 실행 확인
- [ ] Chroma 실행 확인  
- [ ] .env 생성 완료
- [ ] Python 의존성 설치 / Docker Compose 실행
- [ ] Admin API /docs 정상 접속
- [ ] Vector/Cache API 호출 정상 응답

---

## 🤝 인수인계 시 확인사항

### 필수 확인
1. `.env` 파일 생성 및 API 키 설정
2. Docker Compose로 전체 서비스 정상 실행
3. API 문서(`/docs`) 접속 확인
4. Vector 통계 API 호출 테스트
5. 자동 정리 스케줄러 동작 확인 (매일 새벽 3시)

### 주의사항
1. `/system/all` API는 모든 데이터를 삭제하므로 주의
2. Redis TTL 설정 확인 (기본 7일)
3. 운영 환경에서는 반드시 인증 미들웨어 추가
4. 로그 파일(`admin_api.log`) 주기적 관리 필요