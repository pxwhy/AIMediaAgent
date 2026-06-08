"""
实现逻辑：
1. 提供 Agent 模块样例，把 RawContent 转成 PublishDraft。
2. MVP 后续在这里接入 DeepSeek/OpenAI/Hermes。
3. Agent 只输出草稿，不直接创建发布任务。
"""

from packages.shared.contracts import PublishDraftContract, RawContentContract


def generate_sample_draft(raw: RawContentContract) -> PublishDraftContract:
    return PublishDraftContract(
        title=f"{raw.title}，到底透露了什么？",
        content=f"{raw.title}\n\n{raw.content}\n\n这是一版示例 Agent 草稿。",
        images=raw.images,
        agent_notes={"source": raw.source, "category": raw.category},
        risk_score=10,
    )

