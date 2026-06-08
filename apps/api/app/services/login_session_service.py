"""
实现逻辑：
1. 创建平台登录会话并启动独立 Playwright 登录 worker。
2. 用户确认登录后通知 worker 保存浏览器 storage_state。
3. 根据 worker 输出创建账号并回写登录会话状态。
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.core_models import Account, LoginSession, LoginSessionStatus
from app.schemas.core import LoginSessionCreate

PROJECT_ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = PROJECT_ROOT / "data"
LOGIN_SESSION_DIR = DATA_DIR / "login_sessions"
BROWSER_STATE_DIR = DATA_DIR / "browser_states"

PLATFORM_LOGIN_URLS = {
    "toutiao": "https://mp.toutiao.com/profile_v4/index",
    "baijiahao": "https://baijiahao.baidu.com/",
    "weixin": "https://mp.weixin.qq.com/",
    "qiehao": "https://om.qq.com/main/creation/article",
    "xiaohongshu": "https://www.xiaohongshu.com/explore",
}


def create_login_session(db: Session, payload: LoginSessionCreate) -> LoginSession:
    LOGIN_SESSION_DIR.mkdir(parents=True, exist_ok=True)
    BROWSER_STATE_DIR.mkdir(parents=True, exist_ok=True)

    session_id = uuid4().hex
    platform = payload.platform
    login_url = PLATFORM_LOGIN_URLS.get(platform, PLATFORM_LOGIN_URLS["toutiao"])
    state_path = BROWSER_STATE_DIR / f"{platform}_{session_id}.json"

    session = LoginSession(
        id=session_id,
        platform=platform,
        status=LoginSessionStatus.OPENED,
        login_url=login_url,
        state_path=str(state_path),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    _start_login_worker(session)
    return session


def get_login_session(db: Session, session_id: str) -> LoginSession | None:
    return db.get(LoginSession, session_id)


def confirm_login_session(db: Session, session_id: str) -> LoginSession:
    session = db.get(LoginSession, session_id)
    if not session:
        raise ValueError("登录会话不存在")

    session.status = LoginSessionStatus.CONFIRMING
    db.commit()

    session_dir = LOGIN_SESSION_DIR / session.id
    confirm_file = session_dir / "confirm"
    result_file = session_dir / "result.json"
    confirm_file.touch()

    deadline = time.time() + 20
    while time.time() < deadline:
        if result_file.exists():
            return _complete_login_session(db, session, result_file)
        time.sleep(0.5)

    session.error_message = "等待浏览器保存登录态超时，请确认登录页仍然打开"
    session.status = LoginSessionStatus.FAILED
    db.commit()
    db.refresh(session)
    return session


def _start_login_worker(session: LoginSession) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{PROJECT_ROOT}:{PROJECT_ROOT / 'apps/api'}"

    subprocess.Popen(
        [
            sys.executable,
            "-m",
            "packages.accounts.login_worker",
            "--session-id",
            session.id,
            "--platform",
            session.platform,
            "--login-url",
            session.login_url,
            "--state-path",
            session.state_path,
            "--session-dir",
            str(LOGIN_SESSION_DIR / session.id),
        ],
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=open(LOGIN_SESSION_DIR / f"{session.id}.log", "w", encoding="utf-8"),
        stderr=subprocess.STDOUT,
    )


def _complete_login_session(
    db: Session, session: LoginSession, result_file: Path
) -> LoginSession:
    result = json.loads(result_file.read_text(encoding="utf-8"))
    if not result.get("success"):
        session.status = LoginSessionStatus.FAILED
        session.error_message = result.get("error_message", "登录确认失败")
        db.commit()
        db.refresh(session)
        return session

    account_info = result.get("account", {})
    account = Account(
        platform=session.platform,
        nickname=account_info.get("nickname") or f"{session.platform}账号",
        uid=account_info.get("uid") or f"{session.platform}_{session.id[:8]}",
        session_data={
            "storage_state_path": session.state_path,
            "login_session_id": session.id,
            "login_at": result.get("login_at"),
        },
    )
    db.add(account)
    db.flush()

    session.account_id = account.id
    session.status = LoginSessionStatus.COMPLETED
    session.error_message = ""
    db.commit()
    db.refresh(session)
    return session
