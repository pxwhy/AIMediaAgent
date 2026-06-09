"""
实现逻辑：
1. 以账号为入口同步平台后台作品数据，当前第一版支持头条号。
2. 复用账号保存的浏览器登录态启动平台 worker，并把返回作品按平台作品 ID 去重写入。
3. 对前端提供作品列表和同步结果，不让页面直接理解 worker 运行目录。
"""

import json
import os
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import Account, AccountStatus, AccountWork


PROJECT_ROOT = Path(__file__).resolve().parents[4]
WORK_SYNC_RUN_DIR = PROJECT_ROOT / "data" / "work_sync_runs"
NAVIGATION_TITLES = {
    "全部",
    "文章",
    "作品管理",
    "收益数据",
    "功能实验室",
    "西瓜视频",
    "微头条",
    "问答",
    "草稿箱",
    "状态",
    "创作权益",
}


def list_account_works(db: Session, account_id: int) -> list[AccountWork]:
    account = db.get(Account, account_id)
    if not account or account.status == AccountStatus.DISABLED:
        raise ValueError("账号不存在")
    works = list(
        db.scalars(
            select(AccountWork)
            .where(AccountWork.account_id == account_id)
            .order_by(AccountWork.published_at.desc().nullslast(), AccountWork.id.desc())
        )
    )
    return [work for work in works if _is_valid_work(work.title, work.url, work.status, work.metrics)]


def sync_account_works(db: Session, account_id: int) -> dict:
    account = db.get(Account, account_id)
    if not account or account.status == AccountStatus.DISABLED:
        raise ValueError("账号不存在")
    if account.platform != "toutiao":
        raise ValueError(f"当前暂不支持同步 {account.platform} 作品")

    state_path = account.session_data.get("storage_state_path")
    if not state_path or not Path(state_path).exists():
        raise ValueError("账号登录态不存在，请重新登录账号")

    result_file = _run_toutiao_sync_worker(account_id=account.id, state_path=state_path)
    result = json.loads(result_file.read_text(encoding="utf-8"))
    if not result.get("success"):
        raise ValueError(result.get("error_message", "作品同步失败"))

    works = result.get("works", [])
    synced_count = 0
    for item in works:
        if _upsert_account_work(db, account, item):
            synced_count += 1
    _delete_invalid_works(db, account)

    db.commit()
    return {
        "account_id": account.id,
        "platform": account.platform,
        "synced_count": synced_count,
        "total_count": len(works),
        "message": result.get("message", ""),
    }


def _run_toutiao_sync_worker(account_id: int, state_path: str) -> Path:
    run_dir = WORK_SYNC_RUN_DIR / str(account_id)
    run_dir.mkdir(parents=True, exist_ok=True)
    result_file = run_dir / "result.json"
    if result_file.exists():
        result_file.unlink()

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{PROJECT_ROOT}:{PROJECT_ROOT / 'apps/api'}"
    command = [
        sys.executable,
        "-m",
        "packages.accounts.toutiao_works_worker",
        "--state-path",
        state_path,
        "--result-file",
        str(result_file),
    ]
    process = subprocess.Popen(
        command,
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=open(run_dir / "worker.log", "w", encoding="utf-8"),
        stderr=subprocess.STDOUT,
    )

    deadline = time.time() + 120
    while time.time() < deadline:
        if result_file.exists():
            return result_file
        if process.poll() is not None:
            break
        time.sleep(0.5)

    if not result_file.exists():
        result_file.write_text(
            json.dumps({"success": False, "error_message": "同步作品超时"}, ensure_ascii=False),
            encoding="utf-8",
        )
    return result_file


def _upsert_account_work(db: Session, account: Account, item: dict) -> bool:
    title = (item.get("title") or "").strip()
    url = (item.get("url") or "").strip()
    platform_work_id = (item.get("platform_work_id") or _work_id_from_url(url)).strip()
    metrics = item.get("metrics") or {}
    status = (item.get("status") or "").strip()
    if not _is_valid_work(title, url, status, metrics):
        return False

    existing = _find_existing_work(db, account.platform, platform_work_id, url)
    work = existing or AccountWork(account_id=account.id, platform=account.platform)
    work.account_id = account.id
    work.platform = account.platform
    work.platform_work_id = platform_work_id or url or title
    work.title = title[:255]
    work.content = (item.get("content") or "").strip()
    work.url = url
    work.status = status[:50]
    work.metrics = metrics
    work.raw = item.get("raw") or item
    work.published_at = _parse_datetime(item.get("published_at"))
    work.synced_at = datetime.now(UTC)
    db.add(work)
    return True


def _delete_invalid_works(db: Session, account: Account) -> None:
    works = list(
        db.scalars(
            select(AccountWork).where(
                AccountWork.account_id == account.id,
                AccountWork.platform == account.platform,
            )
        )
    )
    for work in works:
        if not _is_valid_work(work.title, work.url, work.status, work.metrics):
            db.delete(work)


def _is_valid_work(title: str, url: str, status: str, metrics: dict) -> bool:
    title = (title or "").strip()
    if not title or title in NAVIGATION_TITLES:
        return False
    return (url or "").startswith(("http://", "https://"))


def _work_id_from_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    return parts[-1] if parts else url


def _find_existing_work(
    db: Session, platform: str, platform_work_id: str, url: str
) -> AccountWork | None:
    if platform_work_id:
        existing = db.scalar(
            select(AccountWork).where(
                AccountWork.platform == platform,
                AccountWork.platform_work_id == platform_work_id,
            )
        )
        if existing:
            return existing
    if url:
        return db.scalar(
            select(AccountWork).where(
                AccountWork.platform == platform,
                AccountWork.url == url,
            )
        )
    return None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
