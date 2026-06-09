"""
实现逻辑：
1. 管理页面配置的 Agent 列表，支持账号复盘、素材挑选和账号肖像 Agent。
2. Agent 绑定模型配置、提示词和本地 Codex Skills；未绑定模型时使用全局默认模型。
3. 首次访问时自动创建默认账号复盘和素材挑选 Agent，保证页面可直接选择。
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import AgentSetting, AgentType, ModelSetting, SkillSetting
from app.schemas.core import AgentConfigUpdate
from app.services.skill_setting_service import list_local_skills_by_paths


DEFAULT_ACCOUNT_REVIEW_SYSTEM_PROMPT = (
    "你是一个中文自媒体运营复盘 Agent，擅长从作品数据中提炼内容方向、标题规律和下一步选题建议。"
)

DEFAULT_ACCOUNT_REVIEW_USER_PROMPT = """
请基于这些作品做一份中文复盘报告，要求：
1. 先总结账号当前内容表现和整体方向。
2. 找出表现较好的作品，并解释可能原因。
3. 分析标题规律、内容结构和受众兴趣点。
4. 指出当前内容存在的问题或数据短板。
5. 给出 5 个下一步选题建议，每个建议附带推荐标题方向。
6. 给出 3 条可执行优化建议。

输出要结构清晰，避免空泛套话。
""".strip()

DEFAULT_CONTENT_SELECTION_SYSTEM_PROMPT = (
    "你是一个中文自媒体素材挑选 Agent，擅长判断采集内容是否适合进入创作和发布流程。"
)

DEFAULT_CONTENT_SELECTION_USER_PROMPT = """
请根据采集内容的选题价值、账号适配度、时效性、风险和可改写空间做素材挑选。
优先选择具备讨论度、信息增量、可解释性和可持续创作角度的内容。
不要自动选择风险高、信息不足、标题党明显或无法形成有效观点的内容。
""".strip()

DEFAULT_ACCOUNT_PROFILE_SYSTEM_PROMPT = (
    "你是一个中文自媒体账号肖像鉴定 Agent，擅长基于作品和复盘报告提炼长期稳定的账号画像。"
)

DEFAULT_ACCOUNT_PROFILE_USER_PROMPT = """
请基于账号作品和复盘信息生成账号肖像。
重点提炼长期稳定的账号定位、目标受众、内容赛道、标题风格、适合采集的数据源方向、禁止内容方向和风险边界。
结论要能指导后续智能筛选和内容创作，不要只复述单次复盘。
""".strip()


def list_agent_configs(db: Session) -> list[dict]:
    ensure_default_agents(db)
    agents = list(db.scalars(select(AgentSetting).order_by(AgentSetting.id.asc())))
    return [_read_agent_config(db, agent) for agent in agents]


def create_agent_config(db: Session, payload: AgentConfigUpdate) -> dict:
    agent = AgentSetting()
    _apply_payload(agent, payload)
    db.add(agent)
    db.flush()
    if payload.is_default or not _default_agent(db, agent.agent_type):
        _set_default(db, agent)
    db.commit()
    db.refresh(agent)
    return _read_agent_config(db, agent)


def update_agent_config(db: Session, agent_id: int, payload: AgentConfigUpdate) -> dict:
    agent = db.get(AgentSetting, agent_id)
    if not agent:
        raise ValueError("Agent 不存在")
    _apply_payload(agent, payload)
    if payload.is_default:
        _set_default(db, agent)
    db.commit()
    db.refresh(agent)
    return _read_agent_config(db, agent)


def delete_agent_config(db: Session, agent_id: int) -> bool:
    agent = db.get(AgentSetting, agent_id)
    if not agent:
        return False
    was_default = bool(agent.is_default)
    agent_type = agent.agent_type
    db.delete(agent)
    db.commit()
    if was_default:
        fallback = db.scalar(
            select(AgentSetting)
            .where(AgentSetting.agent_type == agent_type)
            .order_by(AgentSetting.id.asc())
        )
        if fallback:
            _set_default(db, fallback)
            db.commit()
    return True


def set_default_agent_config(db: Session, agent_id: int) -> dict:
    agent = db.get(AgentSetting, agent_id)
    if not agent:
        raise ValueError("Agent 不存在")
    _set_default(db, agent)
    db.commit()
    db.refresh(agent)
    return _read_agent_config(db, agent)


def resolve_agent(db: Session, agent_id: int | None, agent_type: str = "account_review") -> AgentSetting:
    ensure_default_agents(db)
    agent = db.get(AgentSetting, agent_id) if agent_id else _default_agent(db, AgentType(agent_type))
    if not agent:
        raise ValueError("请先在 Agent 页面配置 Agent")
    if not agent.enabled:
        raise ValueError("该 Agent 已禁用")
    return agent


def ensure_default_agents(db: Session) -> None:
    _ensure_default_agent(
        db,
        agent_type=AgentType.ACCOUNT_REVIEW,
        name="账号复盘默认 Agent",
        system_prompt=DEFAULT_ACCOUNT_REVIEW_SYSTEM_PROMPT,
        user_prompt=DEFAULT_ACCOUNT_REVIEW_USER_PROMPT,
        skill_paths=["review/account-review"],
    )
    _ensure_default_agent(
        db,
        agent_type=AgentType.CONTENT_SELECTION,
        name="素材挑选默认 Agent",
        system_prompt=DEFAULT_CONTENT_SELECTION_SYSTEM_PROMPT,
        user_prompt=DEFAULT_CONTENT_SELECTION_USER_PROMPT,
        skill_paths=[
            "selection/news-value",
            "selection/account-fit",
            "selection/risk-check",
            "selection/title-angle",
        ],
    )
    _ensure_default_agent(
        db,
        agent_type=AgentType.ACCOUNT_PROFILE,
        name="账号肖像默认 Agent",
        system_prompt=DEFAULT_ACCOUNT_PROFILE_SYSTEM_PROMPT,
        user_prompt=DEFAULT_ACCOUNT_PROFILE_USER_PROMPT,
        skill_paths=[],
    )


def _apply_payload(agent: AgentSetting, payload: AgentConfigUpdate) -> None:
    try:
        agent_type = AgentType(payload.agent_type)
    except ValueError as e:
        raise ValueError("暂不支持该 Agent 类型") from e
    agent.name = payload.name.strip() or _default_name(agent_type)
    agent.agent_type = agent_type
    agent.model_config_id = payload.model_config_id or None
    agent.system_prompt = payload.system_prompt.strip() or _default_system_prompt(agent_type)
    agent.user_prompt_template = payload.user_prompt_template.strip() or _default_user_prompt(agent_type)
    agent.skill_ids = _normalize_skill_ids(payload.skill_ids)
    agent.skill_paths = _normalize_skill_paths(payload.skill_paths)
    agent.enabled = 1 if payload.enabled else 0
    agent.is_default = 1 if payload.is_default else 0


def _read_agent_config(db: Session, agent: AgentSetting) -> dict:
    model_name = "全局默认模型"
    if agent.model_config_id:
        model = db.get(ModelSetting, agent.model_config_id)
        model_name = model.name if model else "模型已删除"
    skill_ids = _normalize_skill_ids(agent.skill_ids or [])
    skill_paths = _normalize_skill_paths(agent.skill_paths or [])
    skill_names = _local_skill_names(skill_paths)
    return {
        "id": agent.id,
        "name": agent.name,
        "agent_type": _agent_type_value(agent),
        "model_config_id": agent.model_config_id,
        "model_config_name": model_name,
        "system_prompt": agent.system_prompt or _default_system_prompt(agent.agent_type),
        "user_prompt_template": agent.user_prompt_template or _default_user_prompt(agent.agent_type),
        "skill_ids": skill_ids,
        "skill_paths": skill_paths,
        "skill_names": skill_names,
        "enabled": bool(agent.enabled),
        "is_default": bool(agent.is_default),
    }


def _set_default(db: Session, agent: AgentSetting) -> None:
    for item in db.scalars(select(AgentSetting).where(AgentSetting.agent_type == agent.agent_type)):
        item.is_default = 1 if item.id == agent.id else 0


def _default_agent(db: Session, agent_type: AgentType) -> AgentSetting | None:
    return db.scalar(
        select(AgentSetting)
        .where(AgentSetting.agent_type == agent_type, AgentSetting.is_default == 1)
        .order_by(AgentSetting.id.asc())
    )


def _agent_type_value(agent: AgentSetting) -> str:
    return agent.agent_type.value if hasattr(agent.agent_type, "value") else str(agent.agent_type)


def _normalize_skill_ids(skill_ids: list[int]) -> list[int]:
    clean_ids = []
    for skill_id in skill_ids or []:
        try:
            value = int(skill_id)
        except (TypeError, ValueError):
            continue
        if value > 0 and value not in clean_ids:
            clean_ids.append(value)
    return clean_ids


def _skill_names(db: Session, skill_ids: list[int]) -> list[str]:
    if not skill_ids:
        return []
    skills = list(db.scalars(select(SkillSetting).where(SkillSetting.id.in_(skill_ids))))
    names = {skill.id: skill.name for skill in skills}
    return [names[skill_id] for skill_id in skill_ids if skill_id in names]


def _normalize_skill_paths(skill_paths: list[str]) -> list[str]:
    clean_paths = []
    for skill_path in skill_paths or []:
        value = str(skill_path).strip().strip("/")
        if not value or value.startswith(".") or ".." in value.split("/"):
            continue
        if value not in clean_paths:
            clean_paths.append(value)
    return clean_paths


def _local_skill_names(skill_paths: list[str]) -> list[str]:
    return [skill["name"] for skill in list_local_skills_by_paths(skill_paths)]


def _ensure_default_agent(
    db: Session,
    agent_type: AgentType,
    name: str,
    system_prompt: str,
    user_prompt: str,
    skill_paths: list[str],
) -> None:
    existing = db.scalar(select(AgentSetting).where(AgentSetting.agent_type == agent_type).limit(1))
    if existing:
        if not _default_agent(db, agent_type):
            existing.is_default = 1
            db.commit()
        if agent_type == AgentType.CONTENT_SELECTION and not existing.skill_paths:
            existing.skill_paths = skill_paths
            db.commit()
        return

    model = db.scalar(select(ModelSetting).where(ModelSetting.is_default == 1).order_by(ModelSetting.id.asc()))
    agent = AgentSetting(
        name=name,
        agent_type=agent_type,
        model_config_id=model.id if model else None,
        system_prompt=system_prompt,
        user_prompt_template=user_prompt,
        skill_paths=skill_paths,
        enabled=1,
        is_default=1,
    )
    db.add(agent)
    db.commit()


def _default_name(agent_type: AgentType) -> str:
    if agent_type == AgentType.CONTENT_SELECTION:
        return "素材挑选默认 Agent"
    if agent_type == AgentType.ACCOUNT_PROFILE:
        return "账号肖像默认 Agent"
    return "账号复盘默认 Agent"


def _default_system_prompt(agent_type: AgentType) -> str:
    if agent_type == AgentType.CONTENT_SELECTION:
        return DEFAULT_CONTENT_SELECTION_SYSTEM_PROMPT
    if agent_type == AgentType.ACCOUNT_PROFILE:
        return DEFAULT_ACCOUNT_PROFILE_SYSTEM_PROMPT
    return DEFAULT_ACCOUNT_REVIEW_SYSTEM_PROMPT


def _default_user_prompt(agent_type: AgentType) -> str:
    if agent_type == AgentType.CONTENT_SELECTION:
        return DEFAULT_CONTENT_SELECTION_USER_PROMPT
    if agent_type == AgentType.ACCOUNT_PROFILE:
        return DEFAULT_ACCOUNT_PROFILE_USER_PROMPT
    return DEFAULT_ACCOUNT_REVIEW_USER_PROMPT
