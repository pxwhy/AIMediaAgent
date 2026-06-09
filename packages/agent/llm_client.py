"""
实现逻辑：
1. 提供 Agent 公用 LLM 调用入口，DeepSeek 和其他模型都按 OpenAI-compatible 协议调用。
2. 规范化模型展示名和 Base URL，并统一 timeout、temperature 和错误处理。
3. 返回正文和 token 用量，供草稿生成、复盘分析等 Agent 能力复用。
"""

import re
from typing import Any

import httpx

from packages.agent.model_config import LLMConfig


Message = dict[str, str]


def generate_text(messages: list[Message], config: LLMConfig) -> dict[str, Any]:
    if not messages:
        raise ValueError("模型消息不能为空")

    url = chat_completions_url(config.base_url)
    model = normalize_model_name(config.model)
    payload = {
        "model": model,
        "messages": messages,
        "temperature": config.temperature,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=config.timeout_seconds, trust_env=False) as client:
            response = client.post(url, json=payload, headers=headers)
        if response.is_error:
            raise RuntimeError(f"{response.status_code} {response.text}")
        data = response.json()
    except Exception as e:
        raise RuntimeError(f"模型调用失败：{e}") from e

    choices = data.get("choices") or []
    message = choices[0].get("message", {}) if choices else {}
    usage = data.get("usage") or {}
    return {
        "content": message.get("content") or "",
        "provider": config.provider,
        "model": model,
        "usage": {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        },
    }


def generate_text_from_prompt(prompt: str, config: LLMConfig) -> dict[str, Any]:
    return generate_text([{"role": "user", "content": prompt}], config)


def normalize_model_name(model: str) -> str:
    return re.sub(r"\[[^\]]+\]$", "", model.strip())


def chat_completions_url(base_url: str) -> str:
    normalized = base_url.strip().rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    if normalized.endswith("/v1"):
        return f"{normalized}/chat/completions"
    return f"{normalized}/chat/completions"
