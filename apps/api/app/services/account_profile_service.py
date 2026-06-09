"""
实现逻辑：
1. 读取账号基础信息、已同步作品和可选复盘报告，整理成账号肖像鉴定输入。
2. 调用账号肖像 Agent；Agent 决定使用哪个模型、提示词和本地 Codex Skills，模型配置不读取 .env。
3. 模型必须返回固定 JSON，后端校验成结构化账号肖像并保存历史，供智能筛选和页面查看。
"""

import json
import re

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import Account, AccountProfileReport, AccountReviewReport, AccountStatus
from app.schemas.core import AccountProfileReport as AccountProfileSchema
from app.services.account_work_service import list_account_works
from app.services.agent_setting_service import resolve_agent
from app.services.model_config_service import llm_config_from_db
from app.services.skill_setting_service import list_local_skills_by_paths
from packages.agent.llm_client import generate_text


def generate_account_profile(
    db: Session,
    account_id: int,
    review_report_id: int | None = None,
    agent_id: int | None = None,
    model_config_id: int | None = None,
) -> dict:
    account = db.get(Account, account_id)
    if not account or account.status == AccountStatus.DISABLED:
        raise ValueError("账号不存在")

    works = list_account_works(db, account_id)
    review = _resolve_review_report(db, account_id, review_report_id)
    if not works and not review:
        raise ValueError("请先同步作品或生成复盘报告")

    agent = resolve_agent(db, agent_id, agent_type="account_profile")
    resolved_model_config_id = agent.model_config_id or model_config_id
    config = llm_config_from_db(db, model_config_id=resolved_model_config_id)
    skills = list_local_skills_by_paths(agent.skill_paths or [])
    prompt = _build_profile_prompt(account, works[:30], review, agent.user_prompt_template, skills)
    result = generate_text(
        [
            {"role": "system", "content": agent.system_prompt},
            {"role": "user", "content": prompt},
        ],
        config,
    )
    profile = _parse_profile_report(result["content"])
    row = AccountProfileReport(
        account_id=account.id,
        review_report_id=review.id if review else None,
        agent_id=agent.id,
        model_config_id=resolved_model_config_id,
        provider=result["provider"],
        model=result["model"],
        profile=profile.model_dump(),
        raw_report=result["content"],
        works_count=len(works),
        usage=result["usage"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _read_profile_row(row, agent_name=agent.name)


def list_account_profiles(db: Session, account_id: int | None = None) -> list[dict]:
    statement = select(AccountProfileReport).order_by(AccountProfileReport.created_at.desc())
    if account_id:
        statement = statement.where(AccountProfileReport.account_id == account_id)
    return [_read_profile_row(row) for row in db.scalars(statement)]


def delete_account_profile(db: Session, profile_id: int) -> bool:
    profile = db.get(AccountProfileReport, profile_id)
    if not profile:
        return False
    db.delete(profile)
    db.commit()
    return True


def _resolve_review_report(
    db: Session,
    account_id: int,
    review_report_id: int | None,
) -> AccountReviewReport | None:
    if review_report_id:
        review = db.get(AccountReviewReport, review_report_id)
        if not review or review.account_id != account_id:
            raise ValueError("复盘报告不存在")
        return review
    return db.scalar(
        select(AccountReviewReport)
        .where(AccountReviewReport.account_id == account_id)
        .order_by(AccountReviewReport.created_at.desc())
    )


def _build_profile_prompt(
    account: Account,
    works: list,
    review: AccountReviewReport | None,
    user_prompt_template: str,
    skills: list,
) -> str:
    work_lines = []
    for index, work in enumerate(works, start=1):
        metrics = work.metrics or {}
        content = (work.content or "").strip()
        if len(content) > 500:
            content = content[:500] + "..."
        work_lines.append(
            "\n".join(
                [
                    f"{index}. 标题：{work.title}",
                    f"状态：{work.status or '-'}",
                    f"阅读/播放：{metrics.get('views', '-')}",
                    f"点赞：{metrics.get('likes', '-')}",
                    f"评论：{metrics.get('comments', '-')}",
                    f"正文摘要：{content or '-'}",
                ]
            )
        )

    review_text = json.dumps(review.report, ensure_ascii=False) if review else "无"
    skills_text = _build_skills_text(skills)
    return f"""
账号平台：{account.platform}
账号昵称：{account.nickname or '-'}
账号 UID：{account.uid or '-'}

最近作品数据：

{chr(10).join(work_lines) or '无'}

可参考复盘报告：

{review_text}

{skills_text}

{user_prompt_template}

请严格按照下面的 JSON schema 输出，不要输出 Markdown，不要包裹代码块，不要添加解释文字。
缺失信息用空字符串或空数组，不要编造数据。
priority 只能使用 high、medium、low。

{{
  "summary": "",
  "positioning": "",
  "audience_profile": "",
  "content_tracks": [],
  "title_style": [],
  "source_preferences": [
    {{
      "source": "",
      "category": "",
      "reason": "",
      "keywords": [],
      "priority": "medium"
    }}
  ],
  "forbidden_topics": [],
  "risk_boundaries": [],
  "topic_keywords": [],
  "publishing_advice": [],
  "data_limits": []
}}
""".strip()


def _build_skills_text(skills: list) -> str:
    if not skills:
        return ""
    blocks = []
    for skill in skills:
        blocks.append(
            "\n".join(
                [
                    f"Skill：{skill['name']}",
                    f"Description：{skill['description']}",
                    "Instructions：",
                    skill["content"],
                ]
            )
        )
    return "下面是该 Agent 绑定的 Skills，请在账号肖像鉴定时遵守：\n\n" + "\n\n".join(blocks)


def _parse_profile_report(content: str) -> AccountProfileSchema:
    raw = content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.S)
        if not match:
            raise RuntimeError("模型返回不是有效 JSON，请调整 Agent 或 Skills 后重试")
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError as e:
            raise RuntimeError("模型返回 JSON 解析失败，请调整 Agent 或 Skills 后重试") from e
    try:
        return AccountProfileSchema.model_validate(data)
    except ValidationError as e:
        raise RuntimeError(f"模型返回结构不符合账号肖像 Schema：{e}") from e


def _read_profile_row(row: AccountProfileReport, agent_name: str | None = None) -> dict:
    return {
        "id": row.id,
        "account_id": row.account_id,
        "review_report_id": row.review_report_id,
        "agent_id": row.agent_id,
        "agent_name": agent_name or "",
        "model_config_id": row.model_config_id,
        "provider": row.provider,
        "model": row.model,
        "profile": row.profile,
        "raw_report": row.raw_report,
        "works_count": row.works_count,
        "usage": row.usage,
        "created_at": row.created_at,
    }
