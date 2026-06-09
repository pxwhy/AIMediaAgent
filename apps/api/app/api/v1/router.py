"""
实现逻辑：
1. 注册 MVP 阶段的账号、账号作品、多模型配置、Agent 配置、Skill 配置、采集内容、草稿和发布任务接口。
2. 每类资源提供创建、列表、删除、作品同步、Agent 复盘、Skill 注入、指定模型测试和发布诊断能力，满足 H5 管理端联调。
3. 账号删除采用禁用状态，后续再按模块拆分成独立路由文件。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.core_models import PublishTaskStatus
from app.schemas.core import (
    AccountCreate,
    AgentConfigRead,
    AgentConfigUpdate,
    AccountProfileRead,
    AccountProfileReportRead,
    AccountProfileRequest,
    AccountRead,
    AccountReviewRead,
    AccountReviewReportRead,
    AccountReviewRequest,
    AccountWorkRead,
    AccountWorkSyncRead,
    CollectorImportRequest,
    CollectorItemRead,
    CollectorPreviewRequest,
    CollectorSourceRead,
    ContentSelectionRead,
    ContentSelectionRequest,
    DraftFromRawContentCreate,
    LoginSessionCreate,
    LoginSessionRead,
    LocalSkillListRead,
    ModelConfigRead,
    ModelConfigUpdate,
    ModelTestRead,
    ModelTestRequest,
    PublishDraftCreate,
    PublishDraftRead,
    PublishTaskDiagnosticRead,
    PublishTaskCreate,
    PublishTaskRead,
    PublishTaskStatusUpdate,
    RawContentCreate,
    RawContentRead,
    SkillConfigRead,
    SkillConfigUpdate,
)
from app.services import crud
from app.services import agent_setting_service
from app.services import account_profile_service
from app.services import account_work_service
from app.services import account_review_service
from app.services import content_selection_service
from app.services import login_session_service
from app.services import model_config_service
from app.services import publish_service
from app.services import skill_setting_service
from packages.collector import service as collector_service

api_router = APIRouter()


@api_router.post("/accounts", response_model=AccountRead)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db, payload)


@api_router.get("/accounts", response_model=list[AccountRead])
def list_accounts(db: Session = Depends(get_db)):
    return crud.list_accounts(db)


@api_router.delete("/accounts/{account_id}", response_model=dict[str, bool])
def delete_account(account_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_account(db, account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="账号不存在")
    return {"deleted": True}


@api_router.post("/accounts/{account_id}/sync-works", response_model=AccountWorkSyncRead)
def sync_account_works(account_id: int, db: Session = Depends(get_db)):
    try:
        return account_work_service.sync_account_works(db, account_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.get("/accounts/{account_id}/works", response_model=list[AccountWorkRead])
def list_account_works(account_id: int, db: Session = Depends(get_db)):
    try:
        return account_work_service.list_account_works(db, account_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.get("/models/configs", response_model=list[ModelConfigRead])
def list_model_configs(db: Session = Depends(get_db)):
    return model_config_service.list_model_configs(db)


@api_router.post("/models/configs", response_model=ModelConfigRead)
def create_model_config(payload: ModelConfigUpdate, db: Session = Depends(get_db)):
    return model_config_service.create_model_config(db, payload)


@api_router.put("/models/configs/{model_config_id}", response_model=ModelConfigRead)
def update_model_config(
    model_config_id: int, payload: ModelConfigUpdate, db: Session = Depends(get_db)
):
    try:
        return model_config_service.update_model_config(db, model_config_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.delete("/models/configs/{model_config_id}", response_model=dict[str, bool])
def delete_model_config(model_config_id: int, db: Session = Depends(get_db)):
    deleted = model_config_service.delete_model_config(db, model_config_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="模型配置不存在")
    return {"deleted": True}


@api_router.post("/models/configs/{model_config_id}/set-default", response_model=ModelConfigRead)
def set_default_model_config(model_config_id: int, db: Session = Depends(get_db)):
    try:
        return model_config_service.set_default_model_config(db, model_config_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.post("/models/test", response_model=ModelTestRead)
def test_model(payload: ModelTestRequest, db: Session = Depends(get_db)):
    try:
        result = model_config_service.test_model(db, payload.prompt, payload.model_config_id)
        return {
            "provider": result["provider"],
            "model": result["model"],
            "content": result["content"],
            "usage": result["usage"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@api_router.get("/agents/configs", response_model=list[AgentConfigRead])
def list_agent_configs(db: Session = Depends(get_db)):
    return agent_setting_service.list_agent_configs(db)


@api_router.post("/agents/configs", response_model=AgentConfigRead)
def create_agent_config(payload: AgentConfigUpdate, db: Session = Depends(get_db)):
    try:
        return agent_setting_service.create_agent_config(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.put("/agents/configs/{agent_id}", response_model=AgentConfigRead)
def update_agent_config(agent_id: int, payload: AgentConfigUpdate, db: Session = Depends(get_db)):
    try:
        return agent_setting_service.update_agent_config(db, agent_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.delete("/agents/configs/{agent_id}", response_model=dict[str, bool])
def delete_agent_config(agent_id: int, db: Session = Depends(get_db)):
    deleted = agent_setting_service.delete_agent_config(db, agent_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agent 不存在")
    return {"deleted": True}


@api_router.post("/agents/configs/{agent_id}/set-default", response_model=AgentConfigRead)
def set_default_agent_config(agent_id: int, db: Session = Depends(get_db)):
    try:
        return agent_setting_service.set_default_agent_config(db, agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@api_router.get("/skills/configs", response_model=list[SkillConfigRead])
def list_skill_configs(db: Session = Depends(get_db)):
    return skill_setting_service.list_skill_configs(db)


@api_router.get("/skills/local", response_model=LocalSkillListRead)
def list_local_skills():
    return skill_setting_service.list_local_skills()


@api_router.post("/skills/local/reload", response_model=LocalSkillListRead)
def reload_local_skills():
    return skill_setting_service.list_local_skills()


@api_router.post("/skills/configs", response_model=SkillConfigRead)
def create_skill_config(payload: SkillConfigUpdate, db: Session = Depends(get_db)):
    try:
        return skill_setting_service.create_skill_config(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.put("/skills/configs/{skill_id}", response_model=SkillConfigRead)
def update_skill_config(skill_id: int, payload: SkillConfigUpdate, db: Session = Depends(get_db)):
    try:
        return skill_setting_service.update_skill_config(db, skill_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@api_router.delete("/skills/configs/{skill_id}", response_model=dict[str, bool])
def delete_skill_config(skill_id: int, db: Session = Depends(get_db)):
    deleted = skill_setting_service.delete_skill_config(db, skill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill 不存在")
    return {"deleted": True}


@api_router.post("/agents/account-review", response_model=AccountReviewRead)
def generate_account_review(payload: AccountReviewRequest, db: Session = Depends(get_db)):
    try:
        return account_review_service.generate_account_review(
            db,
            account_id=payload.account_id,
            agent_id=payload.agent_id,
            model_config_id=payload.model_config_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@api_router.get("/agents/account-review/reports", response_model=list[AccountReviewReportRead])
def list_account_review_reports(account_id: int | None = None, db: Session = Depends(get_db)):
    return account_review_service.list_account_review_reports(db, account_id=account_id)


@api_router.delete("/agents/account-review/reports/{report_id}", response_model=dict[str, bool])
def delete_account_review_report(report_id: int, db: Session = Depends(get_db)):
    deleted = account_review_service.delete_account_review_report(db, report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="复盘记录不存在")
    return {"deleted": True}


@api_router.post("/agents/account-profile", response_model=AccountProfileRead)
def generate_account_profile(payload: AccountProfileRequest, db: Session = Depends(get_db)):
    try:
        return account_profile_service.generate_account_profile(
            db,
            account_id=payload.account_id,
            review_report_id=payload.review_report_id,
            agent_id=payload.agent_id,
            model_config_id=payload.model_config_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@api_router.get("/agents/account-profile/reports", response_model=list[AccountProfileReportRead])
def list_account_profiles(account_id: int | None = None, db: Session = Depends(get_db)):
    return account_profile_service.list_account_profiles(db, account_id=account_id)


@api_router.delete("/agents/account-profile/reports/{profile_id}", response_model=dict[str, bool])
def delete_account_profile(profile_id: int, db: Session = Depends(get_db)):
    deleted = account_profile_service.delete_account_profile(db, profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="账号肖像记录不存在")
    return {"deleted": True}


@api_router.post("/agents/content-selection", response_model=ContentSelectionRead)
def select_collected_content(payload: ContentSelectionRequest, db: Session = Depends(get_db)):
    try:
        return content_selection_service.select_collected_content(
            db,
            raw_content_ids=payload.raw_content_ids,
            agent_id=payload.agent_id,
            model_config_id=payload.model_config_id,
            account_id=payload.account_id,
            profile_report_id=payload.profile_report_id,
            review_report_id=payload.review_report_id,
            basis=payload.basis,
            targets=payload.targets,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@api_router.get("/agents/content-selections", response_model=list[ContentSelectionRead])
def list_content_selections(account_id: int | None = None, db: Session = Depends(get_db)):
    return content_selection_service.list_selection_runs(db, account_id=account_id)


@api_router.get("/agents/content-selections/{run_id}", response_model=ContentSelectionRead)
def get_content_selection(run_id: int, db: Session = Depends(get_db)):
    result = content_selection_service.get_selection_run(db, run_id)
    if not result:
        raise HTTPException(status_code=404, detail="智能筛选记录不存在")
    return result


@api_router.delete("/agents/content-selections/{run_id}", response_model=dict[str, bool])
def delete_content_selection(run_id: int, db: Session = Depends(get_db)):
    deleted = content_selection_service.delete_selection_run(db, run_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="智能筛选记录不存在")
    return {"deleted": True}


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


@api_router.get("/publish-tasks/{task_id}/diagnostics", response_model=PublishTaskDiagnosticRead)
def get_publish_task_diagnostics(task_id: int, db: Session = Depends(get_db)):
    try:
        return publish_service.get_publish_task_diagnostics(db, task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


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
