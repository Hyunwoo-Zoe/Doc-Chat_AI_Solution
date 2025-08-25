#!/usr/bin/env bash
# ⇢ Qwen-30B-GPTQ 를 vLLM(OpenAI 호환)으로 띄우는 스크립트
set -euo pipefail

###############################################################################
# 0. 사용자 입력 (기본값: GPU 0 / 포트 12000)
###############################################################################
read -p "🖥️  Qwen을 돌릴 GPU 번호(쉼표로 여러 개 가능, 기본 0): " GPU_VLLM
GPU_VLLM=${GPU_VLLM:-0}

read -p "🌐 OpenAI 호환 포트 번호(기본 12000): " PORT_VLLM
PORT_VLLM=${PORT_VLLM:-12000}

###############################################################################
# 1. 경로 및 변수
###############################################################################
MODEL_NAME="Qwen/Qwen3-30B-A3B-GPTQ-Int4"
BASE_DIR="$HOME/vllm-data-storage"
VENV_DIR="$BASE_DIR/vllm-venv"
HF_CACHE="$BASE_DIR/huggingface-cache"
VLLM_CACHE="$BASE_DIR/vllm-cache"
LOG_FILE="vllm.log"

mkdir -p "$BASE_DIR" "$HF_CACHE" "$VLLM_CACHE"

###############################################################################
# 2. Python 가상환경
###############################################################################
[[ -d "$VENV_DIR" ]] || python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
VENV_PY="$VENV_DIR/bin/python"
echo "[vLLM venv] $($VENV_PY -V)"

###############################################################################
# 3. vLLM 설치(없으면)
###############################################################################
if ! $VENV_PY - <<'PY' 2>/dev/null
import importlib, sys; sys.exit(0 if importlib.util.find_spec("vllm") else 1)
PY
then
  echo "[vLLM] 패키지 설치 중…"
  $VENV_PY -m pip install --upgrade pip wheel
  $VENV_PY -m pip install "vllm[serve]==0.4.2"
fi

###############################################################################
# 4. HF 토큰 입력
###############################################################################
if [[ -z "${HUGGING_FACE_HUB_TOKEN:-}" ]]; then
  read -s -p "🔑  HUGGING_FACE_HUB_TOKEN: " HUGGING_FACE_HUB_TOKEN; echo
  export HUGGING_FACE_HUB_TOKEN
fi
export HF_HOME="$HF_CACHE" VLLM_CACHE_ROOT="$VLLM_CACHE"

###############################################################################
# 5. 서버 기동
###############################################################################
export CUDA_VISIBLE_DEVICES="$GPU_VLLM"

echo -e "\n[🚀] vLLM(Qwen) → GPU $GPU_VLLM / PORT $PORT_VLLM"
nohup $VENV_PY -m vllm.entrypoints.openai.api_server \
      --model "$MODEL_NAME" \
      --enable_expert_parallel \
      --trust-remote-code \
      --host 0.0.0.0 \
      --port "$PORT_VLLM"  > "$LOG_FILE" 2>&1 &

PID=$!
printf "[⌛] PID %s – 로딩 중…\n" "$PID"

for _ in {1..150}; do
  sleep 2
  lsof -i :"$PORT_VLLM" &>/dev/null && { echo "✅ Ready! tail -f $LOG_FILE"; exit 0; }
done
echo "❌ 300초 내에 시작되지 않았습니다. tail -f $LOG_FILE 로 확인하세요."
exit 1

