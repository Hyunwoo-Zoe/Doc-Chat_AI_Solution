# Dockerfile
# UCWARE Admin API 컨테이너 이미지 정의
#
# 기능
# ----
# - Python 3.11 기반 FastAPI(Admin API) 실행 환경 구성
# - 빌드 스테이지에서 모든 의존성 설치 후 런타임 이미지에 반영
# - OCR/문서 처리 라이브러리(tesseract, poppler-utils 등) 포함
#
# 의도
# ----
# - 운영/테스트 환경에서 일관된 실행 환경 제공
# - 개발자는 docker-compose.yml과 함께 쉽게 기동 가능

# ───────────────────────────── 빌드 스테이지 ─────────────────────────────
FROM python:3.11-slim AS builder

# 필수 빌드 도구 및 PDF/OCR 패키지 설치
# - gcc, build-essential : Python C 확장 빌드용
# - libmagic1           : 파일 포맷 감지
# - libgl1              : 이미지 처리(OpenGL)
# - tesseract-ocr       : OCR (pytesseract)
# - poppler-utils       : PDF 텍스트 추출(pdftotext 등)
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    libmagic1 \
    libgl1 \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 복사 및 패키지 설치
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# ───────────────────────────── 런타임 스테이지 ─────────────────────────────
FROM python:3.11-slim

# builder 스테이지에서 설치한 Python 패키지 복사
COPY --from=builder /root/.local /root/.local

# PATH 갱신 및 Python 출력 버퍼링 해제
ENV PATH=/root/.local/bin:$PATH PYTHONUNBUFFERED=1

# 작업 디렉토리 설정
WORKDIR /app

# 전체 소스 코드 복사
COPY . .

# FastAPI(Admin API) 포트 노출
EXPOSE 8001

# ───────────────────────────── 실행 명령 ─────────────────────────────
# uvicorn으로 관리자 API 실행 (기본: 0.0.0.0:8001)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
