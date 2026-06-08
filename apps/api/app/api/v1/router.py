"""
实现逻辑：
1. 注册 MVP 阶段的账号、采集内容、草稿和发布任务接口。
2. 每类资源先提供创建和列表查询，满足 H5 管理端首屏联调。
3. 后续再按模块拆分成独立路由文件。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.core_models import PublishTaskStatus
from app.schemas.core import (
    AccountCreate,
    AccountRead,
    CollectorImportRequest,
    CollectorItemRead,
    CollectorPreviewRequest,
    CollectorSourceRead,
    DraftFromRawContentCreate,
    LoginSessionCreate,
    LoginSessionRead,
    PublishDraftCreate,
    PublishDraftRead,
    PublishTaskCreate,
    PublishTaskRead,
    PublishTaskStatusUpdate,
    RawContentCreate,
    RawContentRead,
)
from app.services import crud
from app.services import login_session_service
from app.services import publish_service
from packages.collector import service as collector_service

api_router = APIRouter()


@api_router.post("/accounts", response_model=AccountRead)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db, payload)


@api_router.get("/accounts", response_model=list[AccountRead])
def list_accounts(db: Session = Depends(get_db)):
    return crud.list_accounts(db)


@api_router.post("/raw-contents", response_model=RawContentRead)
def create_raw_content(payload: RawContentCreate, db: Session = Depends(get_db)):
    return crud.create_raw_content(db, payload)


@api_router.get("/raw-contents", response_model=list[RawContentRead])
def list_raw_contents(db: Session = Depends(get_db)):
    return crud.list_raw_contents(db)


@api_router.delete("/raw-contents/{raw_content_id}", response_model=dict[str, bool])
def delete_raw_content(raw_content_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_raw_content(db, raw_content_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="采集内容不存在")
    return {"deleted": True}


@api_router.get("/collector/sources", response_model=list[CollectorSourceRead])
def list_collector_sources():
    return collector_service.list_sources()


@api_router.post("/collector/preview", response_model=list[CollectorItemRead])
def preview_collector_items(payload: CollectorPreviewRequest):
    try:
        return collector_service.preview(
            source=payload.source,
            category=payload.category,
            limit=payload.limit,
            with_detail=payload.with_detail,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.post("/collector/import", response_model=RawContentRead)
def import_collector_item(payload: CollectorImportRequest, db: Session = Depends(get_db)):
    existing = crud.get_raw_content_by_source_url(db, payload.url)
    if existing:
        return existing

    try:
        item = collector_service.fetch_detail(
            source=payload.source,
            category=payload.category,
            title=payload.title,
            url=payload.url,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    return crud.create_raw_content(
        db,
        RawContentCreate(
            source=item.source,
            category=item.category,
            title=item.title,
            content=item.content or item.summary or item.title,
            source_url=item.url,
            images=item.images,
            metrics={"raw": item.raw, "published_at": item.published_at.isoformat() if item.published_at else ""},
        ),
    )


@api_router.post("/drafts", response_model=PublishDraftRead)
def create_publish_draft(payload: PublishDraftCreate, db: Session = Depends(get_db)):
    return crud.create_publish_draft(db, payload)


@api_router.post("/drafts/from-raw-content", response_model=PublishDraftRead)
def create_publish_draft_from_raw_content(
    payload: DraftFromRawContentCreate, db: Session = Depends(get_db)
):
    try:
        return publish_service.create_draft_from_raw_content(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.get("/drafts", response_model=list[PublishDraftRead])
def list_publish_drafts(db: Session = Depends(get_db)):
    return crud.list_publish_drafts(db)


@api_router.post("/publish-tasks", response_model=PublishTaskRead)
def create_publish_task(payload: PublishTaskCreate, db: Session = Depends(get_db)):
    try:
        return publish_service.create_publish_task(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.get("/publish-tasks", response_model=list[PublishTaskRead])
def list_publish_tasks(db: Session = Depends(get_db)):
    return crud.list_publish_tasks(db)


@api_router.post("/publish-tasks/{task_id}/open-editor", response_model=PublishTaskRead)
def open_publish_editor(task_id: int, db: Session = Depends(get_db)):
    try:
        return publish_service.open_publish_editor(db, task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.post("/publish-tasks/{task_id}/auto-publish", response_model=PublishTaskRead)
def auto_publish_task(task_id: int, db: Session = Depends(get_db)):
    try:
        return publish_service.auto_publish_toutiao(db, task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.post("/publish-tasks/{task_id}/mark-published", response_model=PublishTaskRead)
def mark_publish_task_published(task_id: int, db: Session = Depends(get_db)):
    try:
        return publish_service.update_publish_task_status(
            db, task_id, PublishTaskStatus.PUBLISHED
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.post("/publish-tasks/{task_id}/mark-failed", response_model=PublishTaskRead)
def mark_publish_task_failed(
    task_id: int,
    payload: PublishTaskStatusUpdate | None = None,
    db: Session = Depends(get_db),
):
    try:
        return publish_service.update_publish_task_status(
            db,
            task_id,
            PublishTaskStatus.FAILED,
            error_message=payload.error_message if payload else "",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.post("/publish-tasks/{task_id}/cancel", response_model=PublishTaskRead)
def cancel_publish_task(task_id: int, db: Session = Depends(get_db)):
    try:
        return publish_service.update_publish_task_status(
            db, task_id, PublishTaskStatus.CANCELED
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.delete("/publish-tasks/{task_id}", response_model=dict[str, bool])
def delete_publish_task(task_id: int, db: Session = Depends(get_db)):
    deleted = publish_service.delete_publish_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="发布任务不存在")
    return {"deleted": True}


@api_router.post("/login-sessions", response_model=LoginSessionRead)
def create_login_session(payload: LoginSessionCreate, db: Session = Depends(get_db)):
    return login_session_service.create_login_session(db, payload)


@api_router.get("/login-sessions/{session_id}", response_model=LoginSessionRead)
def get_login_session(session_id: str, db: Session = Depends(get_db)):
    session = login_session_service.get_login_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="登录会话不存在")
    return session


@api_router.post("/login-sessions/{session_id}/confirm", response_model=LoginSessionRead)
def confirm_login_session(session_id: str, db: Session = Depends(get_db)):
    try:
        return login_session_service.confirm_login_session(db, session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
