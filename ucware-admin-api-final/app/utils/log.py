
"""log.py
관리자 명령 로그 유틸리티.

기능
----
- 관리자 API 동작/자동화 작업 실행 내역을 단순히 터미널에 출력.
- 추후 파일/DB 로깅 시스템으로 확장 가능.

의도
----
개발/운영 단계에서 최소한의 실행 이력을 확인할 수 있도록,
stdout 기반 로그를 남기기 위해 사용한다.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

def log_command(user: str, action: str, detail: str = ""):
    """관리자 명령 실행 로그 기록 (터미널 출력).

    Args:
        user (str): 명령 실행 주체 (ex. "system", "admin").
        action (str): 수행된 동작 이름.
        detail (str, optional): 부가 정보 (삭제된 개수 등).

    Returns:
        None
    """
    now = datetime.now(ZoneInfo("Asia/Seoul")).isoformat()
    log_line = f"[LOG] [{now}] USER={user} ACTION={action} DETAIL={detail}"
    print(log_line, flush=True)
