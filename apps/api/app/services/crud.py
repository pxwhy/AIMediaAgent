"""
实现逻辑：
1. 提供 MVP 阶段通用 CRUD 服务，路由层只负责请求响应。
2. 创建账号、采集内容、草稿和发布任务时统一写库。
3. 后续模块复杂后再拆成独立 service。
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import Account, PublishDraft, PublishTask, RawContent
from app.schemas.core import (
    AccountCreate,
    PublishDraftCreate,
    PublishTaskCreate,
    RawContentCreate,
)


def create_account(db: Session, payload: AccountCreate) -> Account:
    account = Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def list_accounts(db: Session) -> list[Account]:
    return list(db.scalars(select(Account).order_by(Account.id.desc())).all())


def create_raw_content(db: Session, payload: RawContentCreate) -> RawContent:
    raw_content = RawContent(**payload.model_dump())
    db.add(raw_content)
    db.commit()
    db.refresh(raw_content)
    return raw_content


def get_raw_content_by_source_url(db: Session, source_url: str) -> RawContent | None:
    if not source_url:
        return None
    return db.scalar(select(RawContent).where(RawContent.source_url == source_url))


def list_raw_contents(db: Session) -> list[RawContent]:
    return list(db.scalars(select(RawContent).order_by(RawContent.id.desc())).all())


def delete_raw_content(db: Session, raw_content_id: int) -> bool:
    raw_content = db.get(RawContent, raw_content_id)
    if not raw_content:
        return False
    db.delete(raw_content)
    db.commit()
    return True


def create_publish_draft(db: Session, payload: PublishDraftCreate) -> PublishDraft:
    draft = PublishDraft(**payload.model_dump())
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def list_publish_drafts(db: Session) -> list[PublishDraft]:
    return list(db.scalars(select(PublishDraft).order_by(PublishDraft.id.desc())).all())


def create_publish_task(db: Session, payload: PublishTaskCreate) -> PublishTask:
    task = PublishTask(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_publish_tasks(db: Session) -> list[PublishTask]:
    return list(db.scalars(select(PublishTask).order_by(PublishTask.id.desc())).all())
