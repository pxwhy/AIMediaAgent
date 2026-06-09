"""
实现逻辑：
1. 提供 MVP 阶段通用 CRUD 服务，路由层只负责请求响应。
2. 创建和展示账号时按平台和 UID 去重，重复登录更新账号登录态。
3. 删除账号采用禁用状态，同 UID 重复记录一起隐藏，避免破坏历史关联。
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import Account, AccountStatus, PublishDraft, PublishTask, RawContent
from app.schemas.core import (
    AccountCreate,
    PublishDraftCreate,
    PublishTaskCreate,
    RawContentCreate,
)


def create_account(db: Session, payload: AccountCreate) -> Account:
    account = get_account_by_platform_uid(db, payload.platform, payload.uid)
    if account:
        data = payload.model_dump()
        for key, value in data.items():
            setattr(account, key, value)
        account.status = AccountStatus.ACTIVE
        db.commit()
        db.refresh(account)
        return account

    account = Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_account_by_platform_uid(db: Session, platform: str, uid: str) -> Account | None:
    if not platform or not uid:
        return None
    return db.scalar(
        select(Account)
        .where(Account.platform == platform, Account.uid == uid)
        .order_by(Account.id.desc())
    )


def list_accounts(db: Session) -> list[Account]:
    accounts = list(
        db.scalars(
            select(Account)
            .where(Account.status != AccountStatus.DISABLED)
            .order_by(Account.id.desc())
        ).all()
    )
    deduped: list[Account] = []
    seen_keys: set[tuple[str, str]] = set()
    for account in accounts:
        if not account.uid:
            deduped.append(account)
            continue
        key = (account.platform, account.uid)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(account)
    return deduped


def delete_account(db: Session, account_id: int) -> bool:
    account = db.get(Account, account_id)
    if not account:
        return False
    accounts = [account]
    if account.uid:
        accounts = list(
            db.scalars(
                select(Account).where(
                    Account.platform == account.platform,
                    Account.uid == account.uid,
                )
            ).all()
        )
    for item in accounts:
        item.status = AccountStatus.DISABLED
    db.commit()
    return True


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
