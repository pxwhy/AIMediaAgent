"""
实现逻辑：
1. 管理页面保存的多模型配置，模型调用不再读取 .env 中的模型字段。
2. API Key 只允许写入和覆盖，读取列表时只暴露是否已配置。
3. 支持按指定模型测试；后续 Agent 可传 model_config_id，未传时使用全局默认模型兜底。
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import ModelProvider, ModelSetting
from app.schemas.core import ModelConfigUpdate
from packages.agent.llm_client import generate_text_from_prompt
from packages.agent.model_config import LLMConfig, validate_llm_config


def list_model_configs(db: Session) -> list[dict]:
    _migrate_legacy_setting(db)
    settings = list(db.scalars(select(ModelSetting).order_by(ModelSetting.id.asc())))
    return [_read_model_config(setting) for setting in settings]


def create_model_config(db: Session, payload: ModelConfigUpdate) -> dict:
    setting = ModelSetting()
    _apply_payload(setting, payload, replace_key=True)
    db.add(setting)
    db.flush()
    if payload.is_default or not _default_setting(db):
        _set_default(db, setting)
    db.commit()
    db.refresh(setting)
    return _read_model_config(setting)


def update_model_config(db: Session, model_config_id: int, payload: ModelConfigUpdate) -> dict:
    setting = db.get(ModelSetting, model_config_id)
    if not setting:
        raise ValueError("模型配置不存在")

    _apply_payload(setting, payload, replace_key=False)
    if payload.is_default:
        _set_default(db, setting)
    db.commit()
    db.refresh(setting)
    return _read_model_config(setting)


def delete_model_config(db: Session, model_config_id: int) -> bool:
    setting = db.get(ModelSetting, model_config_id)
    if not setting:
        return False
    was_default = bool(setting.is_default)
    db.delete(setting)
    db.commit()
    if was_default:
        fallback = db.scalar(select(ModelSetting).order_by(ModelSetting.id.asc()))
        if fallback:
            _set_default(db, fallback)
            db.commit()
    return True


def set_default_model_config(db: Session, model_config_id: int) -> dict:
    setting = db.get(ModelSetting, model_config_id)
    if not setting:
        raise ValueError("模型配置不存在")
    _set_default(db, setting)
    db.commit()
    db.refresh(setting)
    return _read_model_config(setting)


def test_model(db: Session, prompt: str, model_config_id: int | None = None) -> dict:
    config = llm_config_from_db(db, model_config_id=model_config_id)
    return generate_text_from_prompt(prompt, config)


def llm_config_from_db(db: Session, model_config_id: int | None = None) -> LLMConfig:
    _migrate_legacy_setting(db)
    setting = db.get(ModelSetting, model_config_id) if model_config_id else _default_setting(db)
    if not setting:
        raise ValueError("请先在模型页面配置模型")

    config = LLMConfig(
        provider=_provider_value(setting),
        api_key=setting.api_key,
        base_url=setting.base_url,
        model=setting.model,
        temperature=float(setting.temperature or "0.7"),
        timeout_seconds=setting.timeout_seconds,
    )
    validate_llm_config(config)
    return config


def _apply_payload(setting: ModelSetting, payload: ModelConfigUpdate, replace_key: bool) -> None:
    provider = payload.provider if payload.provider in {"deepseek", "other"} else "deepseek"
    setting.name = payload.name.strip() or ("DeepSeek" if provider == "deepseek" else "其他模型")
    setting.provider = ModelProvider(provider)
    setting.base_url = payload.base_url.strip() or _default_base_url(provider)
    setting.model = payload.model.strip() or _default_model(provider)
    setting.temperature = str(_clamp_temperature(payload.temperature))
    setting.timeout_seconds = max(5, min(payload.timeout_seconds, 300))
    if replace_key or payload.api_key.strip():
        setting.api_key = payload.api_key.strip()

    # 继续同步旧字段，方便已有代码和旧库观察，不作为新逻辑来源。
    if provider == "deepseek":
        setting.deepseek_api_key = setting.api_key
        setting.deepseek_base_url = setting.base_url
        setting.deepseek_model = setting.model
    else:
        setting.other_api_key = setting.api_key
        setting.other_base_url = setting.base_url
        setting.other_model = setting.model


def _read_model_config(setting: ModelSetting) -> dict:
    return {
        "id": setting.id,
        "name": setting.name,
        "provider": _provider_value(setting),
        "base_url": setting.base_url,
        "model": setting.model,
        "api_key_configured": bool(setting.api_key),
        "temperature": float(setting.temperature or "0.7"),
        "timeout_seconds": setting.timeout_seconds,
        "is_default": bool(setting.is_default),
    }


def _set_default(db: Session, setting: ModelSetting) -> None:
    for item in db.scalars(select(ModelSetting)):
        item.is_default = 1 if item.id == setting.id else 0


def _default_setting(db: Session) -> ModelSetting | None:
    return db.scalar(select(ModelSetting).where(ModelSetting.is_default == 1).order_by(ModelSetting.id.asc()))


def _migrate_legacy_setting(db: Session) -> None:
    settings = list(db.scalars(select(ModelSetting).order_by(ModelSetting.id.asc())))
    changed = False
    for index, setting in enumerate(settings):
        provider = _provider_value(setting)
        if not setting.name:
            setting.name = "默认模型" if index == 0 else f"模型 {setting.id}"
            changed = True
        if not setting.base_url:
            setting.base_url = (
                setting.other_base_url if provider == "other" else setting.deepseek_base_url
            ) or _default_base_url(provider)
            changed = True
        if not setting.model:
            setting.model = (
                setting.other_model if provider == "other" else setting.deepseek_model
            ) or _default_model(provider)
            changed = True
        if not setting.api_key:
            setting.api_key = setting.other_api_key if provider == "other" else setting.deepseek_api_key
            changed = True
    if settings and not any(setting.is_default for setting in settings):
        settings[0].is_default = 1
        changed = True
    if changed:
        db.commit()


def _provider_value(setting: ModelSetting) -> str:
    return setting.provider.value if hasattr(setting.provider, "value") else str(setting.provider)


def _default_base_url(provider: str) -> str:
    return "https://api.deepseek.com" if provider == "deepseek" else ""


def _default_model(provider: str) -> str:
    return "deepseek-chat" if provider == "deepseek" else ""


def _clamp_temperature(value: float) -> float:
    return max(0, min(float(value), 2))
