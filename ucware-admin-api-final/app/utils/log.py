# 📄 app/utils/log.py

from datetime import datetime
from zoneinfo import ZoneInfo

def log_command(user: str, action: str, detail: str = ""):
    """관리자 명령 실행 로그 기록 (단순 터미널 출력용)"""
    now = datetime.now(ZoneInfo("Asia/Seoul")).isoformat()
    log_line = f"[LOG] [{now}] USER={user} ACTION={action} DETAIL={detail}"
    print(log_line, flush=True)