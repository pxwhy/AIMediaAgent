"""
实现逻辑：
1. 提供 Agent 公用 LLM 调用入口，屏蔽 DeepSeek 和其他兼容模型的差异。
2. 使用 httpx 直连 OpenAI-compatible Chat Completions API，并统一 timeout、temperature 和错误处理。
3. 返回正文和 token 用量，供草稿生成、复盘分析等 Agent 能力复用。
"""

from typing import Any

import httpx

from packages.agent.model_config import LLMConfig


Message = dict[str, str]


def generate_text(messages: list[Message], config: LLMConfig) -> dict[str, Any]:
    if not messages:
        raise ValueError("模型消息不能为空")

    base_url = config.base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": config.temperature,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
    }
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=config.timeout_seconds)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        raise RuntimeError(f"模型调用失败：{e}") from e

    choices = data.get("choices") or []
    message = choices[0].get("message", {}) if choices else {}
    usage = data.get("usage") or {}
    return {
        "content": message.get("content") or "",
        "provider": config.provider,
        "model": config.model,
        "usage": {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        },
    }


def generate_text_from_prompt(prompt: str, config: LLMConfig) -> dict[str, Any]:
    return generate_text([{"role": "user", "content": prompt}], config)
