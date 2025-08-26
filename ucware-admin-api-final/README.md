
# UCWARE Admin API - 프로젝트 이관 문서

## 📌 프로젝트 개요

UCWARE Admin API는 **관리자 전용 벡터 및 캐시 관리 서버**입니다. PDF 요약 서비스의 Vector DB(Chroma)와 Cache(Redis)를 효율적으로 관리하기 위해 개발되었습니다.

### 핵심 기능
- **Vector DB 관리**: PDF 문서의 벡터 데이터 저장/조회/삭제
- **Cache 관리**: 요약 결과 캐싱 및 TTL 기반 자동 정리
- **로그 관리**: 모든 삭제 작업 및 요청에 대한 로그 추적
- **자동화**: 매일 새벽 3시 미사용 데이터 자동 정리

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│   Admin UI      │  (Next.js - 관리자 웹 인터페이스)
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Admin API     │  (FastAPI:8001 - 이 프로젝트)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌────────┐
│Redis │  │Chroma  │
│:6379 │  │:9000   │
└──────┘  └────────┘
```

### 구성 요소
| 컴포넌트 | 역할 | 포트 | 비고 |
|---------|------|------|------|
| Admin API | 관리 기능 제공 | 8001 | FastAPI 기반 |
| Redis | 캐시 저장소 & 로그 | 6379 | TTL 기반 자동 만료 |
| Chroma | Vector DB | 9000 | PDF 벡터 저장 |
| Admin UI | 웹 인터페이스 | 3000 | Next.js (별도 프로젝트) |

---

## 🚀 설치 및 실행 가이드

### 1. 사전 요구사항
- Docker & Docker Compose
- Python 3.9+ (로컬 실행 시)
- Git

### 2. 프로젝트 클론
```bash
git clone <REPO_URL>
cd ucware-admin-api
```

### 3. 환경 설정

#### 방법 1: 자동 설정 (권장)
```bash
./setup_env.sh
```
스크립트 실행 시 다음 항목들을 입력하게 됩니다:
- LLM Provider 선택 (OpenAI 또는 HuggingFace)
- OpenAI API Key
- Tavily API Key (검색 기능용)

#### 방법 2: 수동 설정
`.env` 파일을 직접 생성:
```env
# LLM 설정
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here

# 외부 서비스
TAVILY_API_KEY=your_key_here

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# Chroma 설정  
CHROMA_HOST=localhost
CHROMA_PORT=9000
```

### 4. 실행 방법

#### 🐳 Docker Compose 실행 (권장)
```bash
# 전체 서비스 실행
docker compose up -d

# 로그 확인
docker compose logs -f admin-api

# 종료
docker compose down
```

#### 💻 로컬 개발 환경
```bash
# Redis와 Chroma 먼저 실행
./start_services.sh

# Admin API 실행
./run_admin_api.sh

# 종료
./stop_services.sh
```

### 5. 접속 확인
- **API 문서**: http://localhost:8001/docs

---

## 📋 주요 API 엔드포인트

### Vector 관리 API

| 메서드 | 경로 | 설명 | 예시 |
|--------|------|------|------|
| GET | `/vector/statistics` | 전체 벡터 통계 조회 | 총 개수, 컬렉션별 분포 |
| GET | `/vector/exists/{vector_id}` | 특정 벡터 존재 확인 | ID로 벡터 존재 여부 체크 |
| GET | `/vector/by-date` | 날짜별 벡터 조회 | 특정 날짜의 모든 벡터 |
| DELETE | `/vector/unused` | 미사용 벡터 정리 | Redis에 없는 벡터 삭제 |
| DELETE | `/vector/{vector_id}` | 개별 벡터 삭제 | 특정 ID 벡터 제거 |
| DELETE | `/vector/all` | 전체 벡터 삭제 | 모든 벡터 데이터 초기화 |
| GET | `/vector/deletion-log` | 삭제 로그 조회 | 벡터 삭제 이력 확인 |

### Cache 관리 API

| 메서드 | 경로 | 설명 | 예시 |
|--------|------|------|------|
| GET | `/cache/summary/{vector_id}` | 요약본 조회 | 캐시된 PDF 요약 내용 |
| GET | `/cache/metadata/{vector_id}` | 메타데이터 조회 | 파일명, 생성시간 등 |
| DELETE | `/cache/cleanup-ttl` | TTL 기반 정리 | 만료된 캐시 삭제 |
| GET | `/cache/deletion-log` | 삭제 로그 조회 | 캐시 삭제 이력 |
| GET | `/cache/request-log` | 요청 로그 조회 | 요약 요청 이력 |

### 시스템 관리 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| DELETE | `/system/all` | 전체 데이터 초기화 (Vector + Cache) |

---

## 🔧 주요 기능 상세

### 1. 자동 정리 스케줄러
- **실행 시간**: 매일 새벽 3시
- **동작 방식**: 
  1. Redis에서 모든 vector_id 수집
  2. Chroma에서 Redis에 없는 vector 식별
  3. 미사용 vector 자동 삭제
  4. 삭제 로그 기록

### 2. 로그 시스템
모든 삭제 작업은 Redis에 로그로 기록됩니다:
- `vector_deletion_log:{date}` - 벡터 삭제 로그
- `cache_deletion_log:{date}` - 캐시 삭제 로그
- `summary_request_log:{date}` - 요약 요청 로그

### 3. 데이터 구조

#### Redis 키 패턴
```
pdf_summary:{vector_id}        # PDF 요약 결과
pdf_metadata:{vector_id}       # 메타데이터
vector_deletion_log:{date}     # 삭제 로그
```

#### Chroma 컬렉션
```
pdf_vectors                    # PDF 문서 벡터 저장
```

---

## 🧪 기능 테스트

### 기본 동작 확인
```bash
# 1. 벡터 통계 확인
curl http://localhost:8001/vector/statistics

# 2. 특정 날짜 삭제 로그 조회
curl "http://localhost:8001/cache/deletion-log?date=2025-08-26"

# 3. 미사용 벡터 정리
curl -X DELETE http://localhost:8001/vector/unused
```

---

## ⚠️ 주의사항

### 보안
1. **Admin API는 내부 네트워크에서만 접근 가능하도록 설정**
2. 운영 환경에서는 반드시 인증 미들웨어 추가
3. 방화벽으로 8001 포트 외부 접근 차단

### 운영
1. `start_services.sh`, `stop_services.sh`는 개발용 스크립트
2. 운영 환경에서는 Docker Compose 또는 Kubernetes 사용
3. 로그 파일(`admin_api.log`) 주기적 관리 필요

### 데이터 관리
1. `/system/all` API는 모든 데이터를 삭제하므로 주의
2. 자동 정리 스케줄러 시간대 조정 필요 시 코드 수정
3. Redis TTL 설정 확인 (기본 7일)

---

## 📁 프로젝트 구조

```
ucware-admin-api/
├── app/
│   ├── api/           # API 라우터
│   ├── core/          # 핵심 설정
│   ├── services/      # 비즈니스 로직
│   └── utils/         # 유틸리티
├── scripts/           # 실행 스크립트
├── docker-compose.yml # Docker 설정
├── Dockerfile        # API 이미지 빌드
├── requirements.txt  # Python 패키지
└── .env             # 환경 변수 (생성 필요)
```

---

## 🤝 인수인계 체크리스트

### 필수 확인 사항
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] Docker Compose로 전체 서비스 정상 실행
- [ ] Vector 통계 API 호출 테스트
- [ ] Cache 조회 API 호출 테스트
- [ ] 자동 정리 스케줄러 동작 확인

### 권장 사항
- [ ] 운영 환경 인증 미들웨어 구현
- [ ] 로그 로테이션 설정
- [ ] 모니터링 시스템 연동
- [ ] 백업 정책 수립

---

## 📞 문의사항

프로젝트 관련 문의사항이 있으시면 다음 내용과 함께 연락 부탁드립니다:
- 에러 로그 (`docker compose logs admin-api`)
- 환경 설정 (`.env` 파일 내용 - API 키 제외)
- 실행 환경 (Docker 버전, OS 등)