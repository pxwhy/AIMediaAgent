"""
实现逻辑：
1. 提供发布管理的业务操作：素材转草稿、任务状态流转、打开平台编辑页。
2. 发布执行只消费草稿和账号登录态，不直接参与采集和 Agent 生成。
3. 头条号支持人工确认编辑页和明确触发的单任务自动发布，小红书仅支持人工确认发布页。
"""

import json
import os
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.core_models import (
    Account,
    DraftStatus,
    PublishDraft,
    PublishResult,
    PublishTask,
    PublishTaskStatus,
    RawContent,
)
from app.schemas.core import DraftFromRawContentCreate, PublishTaskCreate


PROJECT_ROOT = Path(__file__).resolve().parents[4]
PUBLISH_RUN_DIR = PROJECT_ROOT / "data" / "publish_runs"


def create_draft_from_raw_content(
    db: Session, payload: DraftFromRawContentCreate
) -> PublishDraft:
    raw_content = db.get(RawContent, payload.raw_content_id)
    if not raw_content:
        raise ValueError("采集内容不存在")

    account = db.get(Account, payload.account_id) if payload.account_id else None
    if payload.account_id and not account:
        raise ValueError("发布账号不存在")

    draft = PublishDraft(
        raw_content_id=raw_content.id,
        account_id=account.id if account else None,
        title=payload.title or raw_content.title,
        content=payload.content or raw_content.content,
        images=payload.images if payload.images is not None else raw_content.images,
        status=DraftStatus.GENERATED,
        agent_notes={"source_url": raw_content.source_url, "source": raw_content.source},
        risk_score=0,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def create_publish_task(db: Session, payload: PublishTaskCreate) -> PublishTask:
    draft = db.get(PublishDraft, payload.draft_id)
    if not draft:
        raise ValueError("发布草稿不存在")

    task = PublishTask(
        draft_id=payload.draft_id,
        platform=payload.platform,
        scheduled_at=payload.scheduled_at,
        status=PublishTaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_publish_task_status(
    db: Session, task_id: int, status: PublishTaskStatus, error_message: str = ""
) -> PublishTask:
    task = db.get(PublishTask, task_id)
    if not task:
        raise ValueError("发布任务不存在")

    task.status = status
    if status in {PublishTaskStatus.PUBLISHED, PublishTaskStatus.FAILED}:
        result = task.result or PublishResult(task_id=task.id)
        result.success = 1 if status == PublishTaskStatus.PUBLISHED else 0
        result.error_message = error_message
        result.published_at = datetime.now(UTC) if status == PublishTaskStatus.PUBLISHED else None
        db.add(result)
    if status == PublishTaskStatus.PUBLISHED and task.draft:
        task.draft.status = DraftStatus.APPROVED
        if task.draft.raw_content:
            task.draft.raw_content.published_at = datetime.now(UTC)
    db.commit()
    db.refresh(task)
    return task


def delete_publish_task(db: Session, task_id: int) -> bool:
    task = db.get(PublishTask, task_id)
    if not task:
        return False
    if task.result:
        db.delete(task.result)
    db.delete(task)
    db.commit()
    return True


def open_publish_editor(db: Session, task_id: int) -> PublishTask:
    task = db.get(PublishTask, task_id)
    if not task:
        raise ValueError("发布任务不存在")
    if task.platform == "toutiao":
        return _run_publish_flow(db, task_id, worker="toutiao", auto_publish=False)
    if task.platform == "xiaohongshu":
        return _run_publish_flow(db, task_id, worker="xiaohongshu", auto_publish=False)
    raise ValueError(f"当前不支持 {task.platform} 发布")


def open_toutiao_editor(db: Session, task_id: int) -> PublishTask:
    return _run_publish_flow(db, task_id, worker="toutiao", auto_publish=False)


def auto_publish_toutiao(db: Session, task_id: int) -> PublishTask:
    task = db.get(PublishTask, task_id)
    if not task:
        raise ValueError("发布任务不存在")
    if task.platform == "toutiao":
        return _run_publish_flow(db, task_id, worker="toutiao", auto_publish=True)
    if task.platform == "xiaohongshu":
        return _run_publish_flow(db, task_id, worker="xiaohongshu", auto_publish=True)
    raise ValueError(f"当前不支持 {task.platform} 自动发布")


def _run_publish_flow(db: Session, task_id: int, worker: str, auto_publish: bool) -> PublishTask:
    task = db.get(PublishTask, task_id)
    if not task:
        raise ValueError("发布任务不存在")
    if worker == "toutiao" and task.platform != "toutiao":
        raise ValueError("当前仅支持头条号发布")
    if worker == "xiaohongshu" and task.platform != "xiaohongshu":
        raise ValueError("当前仅支持小红书发布")
    if task.status in {
        PublishTaskStatus.PUBLISHED,
        PublishTaskStatus.FAILED,
        PublishTaskStatus.CANCELED,
    }:
        raise ValueError("当前任务状态不允许再次发布")

    draft = task.draft
    if not draft or not draft.account:
        raise ValueError("发布任务缺少草稿或账号")
    if worker == "xiaohongshu" and not draft.images:
        raise ValueError("小红书图片发布至少需要 1 张图片")

    state_path = draft.account.session_data.get("storage_state_path")
    if not state_path or not Path(state_path).exists():
        raise ValueError("账号登录态不存在，请重新登录账号")

    task.status = PublishTaskStatus.PUBLISHING
    db.commit()
    db.refresh(task)

    result_file = _run_editor_worker(
        worker=worker,
        state_path=state_path,
        title=draft.title,
        content=draft.content,
        images=draft.images,
        task_id=task.id,
        auto_publish=auto_publish,
    )
    result = json.loads(result_file.read_text(encoding="utf-8"))
    if result.get("success"):
        _upsert_publish_result(
            db,
            task,
            success=auto_publish,
            platform_url=result.get("platform_url", ""),
            error_message=result.get("message", "已打开编辑页，等待人工发布"),
            raw_response=result,
        )
        task.status = PublishTaskStatus.PUBLISHED if auto_publish else PublishTaskStatus.PUBLISHING
        if auto_publish and task.draft:
            task.draft.status = DraftStatus.APPROVED
            if task.draft.raw_content:
                task.draft.raw_content.published_at = datetime.now(UTC)
    else:
        _upsert_publish_result(
            db,
            task,
            success=False,
            error_message=result.get("error_message", "打开发布页失败"),
            raw_response=result,
        )
        task.status = PublishTaskStatus.FAILED

    db.commit()
    db.refresh(task)
    return task


def _run_editor_worker(
    worker: str,
    state_path: str,
    title: str,
    content: str,
    images: list[str],
    task_id: int,
    auto_publish: bool,
) -> Path:
    run_dir = PUBLISH_RUN_DIR / str(task_id)
    run_dir.mkdir(parents=True, exist_ok=True)
    result_file = run_dir / "result.json"
    if result_file.exists():
        result_file.unlink()
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{PROJECT_ROOT}:{PROJECT_ROOT / 'apps/api'}"
    module_name = {
        "toutiao": "packages.publisher.toutiao_editor_worker",
        "xiaohongshu": "packages.publisher.xiaohongshu_editor_worker",
    }[worker]

    command = [
        sys.executable,
        "-m",
        module_name,
        "--state-path",
        state_path,
        "--title",
        title,
        "--content",
        content,
        "--images-json",
        json.dumps(images or [], ensure_ascii=False),
        "--result-file",
        str(result_file),
    ]
    if auto_publish:
        command.append("--auto-publish")

    process = subprocess.Popen(
        command,
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=open(run_dir / "worker.log", "w", encoding="utf-8"),
        stderr=subprocess.STDOUT,
    )

    deadline = time.time() + (150 if auto_publish else 90)
    while time.time() < deadline:
        if result_file.exists():
            return result_file
        if process.poll() is not None:
            break
        time.sleep(0.5)

    if not result_file.exists():
        result_file.write_text(
            json.dumps({"success": False, "error_message": "打开发布编辑页超时"}, ensure_ascii=False),
            encoding="utf-8",
        )
    return result_file


def _upsert_publish_result(
    db: Session,
    task: PublishTask,
    success: bool,
    platform_url: str = "",
    error_message: str = "",
    raw_response: dict | None = None,
) -> None:
    result = task.result or PublishResult(task_id=task.id)
    result.success = 1 if success else 0
    result.platform_url = platform_url
    result.error_message = error_message
    result.raw_response = raw_response or {}
    result.published_at = datetime.now(UTC) if success else None
    db.add(result)
