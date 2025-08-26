
#!/bin/bash
"""setup_env.sh
Python 패키지 설치 + .env 환경 변수 파일 생성 스크립트.

기능
----
1. Redis 서버 설치
2. Python 가상환경 생성 및 의존성 설치
3. LLM Provider 선택 (OpenAI / HuggingFace)
4. API Key 입력 및 .env 파일 생성

의도
----
- 새 환경에서 UCWARE Admin API를 한 번에 세팅 가능하도록 지원.
- 사내/타 부서 이관 시 별도 문서 없이도 환경 변수를 손쉽게 구성할 수 있음.
"""

# ───────────────────────────── Redis 설치 ─────────────────────────────
echo "[1] 시스템 패키지 설치"
sudo apt update
sudo apt install -y redis-server

# ───────────────────────────── Python 환경 ─────────────────────────────
echo "[2] Python 가상환경 생성 및 활성화"
python3 -m venv .venv
source .venv/bin/activate

echo "[3] pip 패키지 설치"
pip install --upgrade pip
pip install -r requirements.txt

# ───────────────────────────── LLM Provider 선택 ─────────────────────────────
echo "🤖 사용할 LLM/Embedding Provider를 선택하세요:"
echo "1. openai"
echo "2. hf (HuggingFace)"
read -p "선택 [1/2]: " PROVIDER_CHOICE

echo "🔑 Tavily API Key를 입력하세요: "
read -r TAVILY_API_KEY

if [ "$PROVIDER_CHOICE" == "2" ]; then
    # HuggingFace 모델 기본값 설정
    LLM_PROVIDER="hf"
    EMBEDDING_MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
    LLM_MODEL_NAME="google/gemma-7b-it"
    OPENAI_API_KEY=""
else
    # OpenAI 모델 기본값 설정
    LLM_PROVIDER="openai"
    EMBEDDING_MODEL_NAME="text-embedding-ada-002"
    LLM_MODEL_NAME="gpt-3.5-turbo"

    echo -n "🔑 OpenAI API Key를 입력하세요: "
    read -r OPENAI_API_KEY
fi

# ───────────────────────────── .env 생성 ─────────────────────────────
echo "[4] .env 파일 생성"
cat > .env <<EOF
CHROMA_HOST=localhost        # Chroma 서버 호스트
CHROMA_PORT=9000             # Chroma 포트
REDIS_HOST=localhost         # Redis 호스트
REDIS_PORT=6379              # Redis 포트
REDIS_DB=0                   # Redis DB index
REDIS_TTL=604800             # Redis 캐시 TTL(초) = 7일
LLM_PROVIDER=$LLM_PROVIDER   # LLM Provider (openai/hf)
EMBEDDING_MODEL_NAME=$EMBEDDING_MODEL_NAME
LLM_MODEL_NAME=$LLM_MODEL_NAME
OPENAI_API_KEY="$OPENAI_API_KEY"
TAVILY_API_KEY="$TAVILY_API_KEY"
EOF

# ───────────────────────────── 완료 ─────────────────────────────
echo "[✔] .env 생성 완료"
