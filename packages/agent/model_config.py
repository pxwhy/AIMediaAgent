"""
实现逻辑：
1. 定义 Agent 公用模型配置，默认模型固定为 DeepSeek。
2. 兼容 other 这种 OpenAI-compatible 模型配置，配置来源只允许页面保存的数据库配置。
3. 在真正调用模型前完成必要字段校验，避免业务层散落 Key 和 Base URL 判断。
"""

from dataclasses import dataclass
from typing import Literal


ModelProvider = Literal["deepseek", "other"]


@dataclass(frozen=True)
class LLMConfig:
    provider: ModelProvider
    api_key: str
    base_url: str
    model: str
    temperature: float = 0.7
    timeout_seconds: float = 60


def validate_llm_config(config: LLMConfig) -> None:
    if not config.api_key:
        raise ValueError(f"{config.provider} API Key 未配置")
    if not config.base_url:
        raise ValueError(f"{config.provider} Base URL 未配置")
    if not config.model:
        raise ValueError(f"{config.provider} 模型名称未配置")
