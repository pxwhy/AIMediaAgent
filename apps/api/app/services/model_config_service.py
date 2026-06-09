"""
实现逻辑：
1. 管理页面保存的模型配置，模型调用不再读取 .env 中的模型字段。
2. API Key 只允许写入和覆盖，读取时只暴露是否已配置。
3. 将数据库配置转换为 Agent 公用 LLMConfig，供测试模型和后续 Agent 复用。
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import ModelProvider, ModelSetting
from app.schemas.core import ModelConfigUpdate
from packages.agent.llm_client import generate_text_from_prompt
from packages.agent.model_config import LLMConfig, validate_llm_config


def get_or_create_model_setting(db: Session) -> ModelSetting:
    setting = db.scalar(select(ModelSetting).order_by(ModelSetting.id.asc()))
    if setting:
        return setting

    setting = ModelSetting()
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def get_model_config(db: Session) -> dict:
    setting = get_or_create_model_setting(db)
    return _read_model_config(setting)


def update_model_config(db: Session, payload: ModelConfigUpdate) -> dict:
    setting = get_or_create_model_setting(db)
    provider = payload.provider if payload.provider in {"deepseek", "other"} else "deepseek"
    setting.provider = ModelProvider(provider)
    setting.deepseek_base_url = payload.deepseek_base_url.strip() or "https://api.deepseek.com"
    setting.deepseek_model = payload.deepseek_model.strip() or "deepseek-chat"
    setting.other_base_url = payload.other_base_url.strip()
    setting.other_model = payload.other_model.strip()
    setting.temperature = str(_clamp_temperature(payload.temperature))
    setting.timeout_seconds = max(5, min(payload.timeout_seconds, 300))

    if payload.deepseek_api_key.strip():
        setting.deepseek_api_key = payload.deepseek_api_key.strip()
    if payload.other_api_key.strip():
        setting.other_api_key = payload.other_api_key.strip()

    db.commit()
    db.refresh(setting)
    return _read_model_config(setting)


def test_model(db: Session, prompt: str) -> dict:
    config = llm_config_from_db(db)
    return generate_text_from_prompt(prompt, config)


def llm_config_from_db(db: Session) -> LLMConfig:
    setting = get_or_create_model_setting(db)
    provider = setting.provider.value if hasattr(setting.provider, "value") else str(setting.provider)
    if provider == "other":
        config = LLMConfig(
            provider="other",
            api_key=setting.other_api_key,
            base_url=setting.other_base_url,
            model=setting.other_model,
            temperature=float(setting.temperature or "0.7"),
            timeout_seconds=setting.timeout_seconds,
        )
    else:
        config = LLMConfig(
            provider="deepseek",
            api_key=setting.deepseek_api_key,
            base_url=setting.deepseek_base_url,
            model=setting.deepseek_model,
            temperature=float(setting.temperature or "0.7"),
            timeout_seconds=setting.timeout_seconds,
        )
    validate_llm_config(config)
    return config


def _read_model_config(setting: ModelSetting) -> dict:
    return {
        "provider": setting.provider.value if hasattr(setting.provider, "value") else str(setting.provider),
        "deepseek_base_url": setting.deepseek_base_url,
        "deepseek_model": setting.deepseek_model,
        "deepseek_api_key_configured": bool(setting.deepseek_api_key),
        "other_base_url": setting.other_base_url,
        "other_model": setting.other_model,
        "other_api_key_configured": bool(setting.other_api_key),
        "temperature": float(setting.temperature or "0.7"),
        "timeout_seconds": setting.timeout_seconds,
    }


def _clamp_temperature(value: float) -> float:
    return max(0, min(float(value), 2))
