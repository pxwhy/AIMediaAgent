"""
实现逻辑：
1. 读取指定账号已同步作品，整理标题、正文和互动指标作为复盘输入。
2. 调用页面配置的指定 Agent；Agent 决定使用哪个模型、提示词和本地 Codex Skills，模型配置不读取 .env。
3. 模型必须返回固定 JSON，后端校验成结构化复盘报告，供前端稳定展示。
"""

import json
import re

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import Account, AccountReviewReport, AccountStatus
from app.schemas.core import ReviewReport
from app.services.agent_setting_service import resolve_agent
from app.services.account_work_service import list_account_works
from app.services.model_config_service import llm_config_from_db
from app.services.skill_setting_service import list_local_skills_by_paths
from packages.agent.llm_client import generate_text


def generate_account_review(
    db: Session,
    account_id: int,
    agent_id: int | None = None,
    model_config_id: int | None = None,
) -> dict:
    account = db.get(Account, account_id)
    if not account or account.status == AccountStatus.DISABLED:
        raise ValueError("账号不存在")

    works = list_account_works(db, account_id)
    if not works:
        raise ValueError("该账号暂无同步作品，请先同步作品")

    agent = resolve_agent(db, agent_id, agent_type="account_review")
    resolved_model_config_id = agent.model_config_id or model_config_id
    config = llm_config_from_db(db, model_config_id=resolved_model_config_id)
    skills = list_local_skills_by_paths(agent.skill_paths or [])
    prompt = _build_review_prompt(account, works[:30], agent.user_prompt_template, skills)
    result = generate_text(
        [
            {
                "role": "system",
                "content": agent.system_prompt,
            },
            {"role": "user", "content": prompt},
        ],
        config,
    )
    report = _parse_review_report(result["content"])
    payload = {
        "account_id": account.id,
        "agent_id": agent.id,
        "agent_name": agent.name,
        "model_config_id": resolved_model_config_id,
        "provider": result["provider"],
        "model": result["model"],
        "report": report.model_dump(),
        "raw_report": result["content"],
        "works_count": len(works),
        "usage": result["usage"],
    }
    report_row = AccountReviewReport(
        account_id=payload["account_id"],
        agent_id=payload["agent_id"],
        model_config_id=payload["model_config_id"],
        provider=payload["provider"],
        model=payload["model"],
        report=payload["report"],
        raw_report=payload["raw_report"],
        works_count=payload["works_count"],
        usage=payload["usage"],
    )
    db.add(report_row)
    db.commit()
    db.refresh(report_row)
    return _read_report_row(report_row, agent_name=agent.name)


def list_account_review_reports(db: Session, account_id: int | None = None) -> list[dict]:
    statement = select(AccountReviewReport).order_by(AccountReviewReport.created_at.desc())
    if account_id:
        statement = statement.where(AccountReviewReport.account_id == account_id)
    return [_read_report_row(row) for row in db.scalars(statement)]


def delete_account_review_report(db: Session, report_id: int) -> bool:
    report = db.get(AccountReviewReport, report_id)
    if not report:
        return False
    db.delete(report)
    db.commit()
    return True


def _build_review_prompt(account: Account, works: list, user_prompt_template: str, skills: list) -> str:
    work_lines = []
    for index, work in enumerate(works, start=1):
        metrics = work.metrics or {}
        content = (work.content or "").strip()
        if len(content) > 600:
            content = content[:600] + "..."
        work_lines.append(
            "\n".join(
                [
                    f"{index}. 标题：{work.title}",
                    f"状态：{work.status or '-'}",
                    f"阅读/播放：{metrics.get('views', '-')}",
                    f"点赞：{metrics.get('likes', '-')}",
                    f"评论：{metrics.get('comments', '-')}",
                    f"收藏：{metrics.get('favorites', '-')}",
                    f"分享：{metrics.get('shares', '-')}",
                    f"正文摘要：{content or '-'}",
                ]
            )
        )

    works_text = "\n\n".join(work_lines)
    skills_text = _build_skills_text(skills)
    return f"""
账号平台：{account.platform}
账号昵称：{account.nickname or '-'}
账号 UID：{account.uid or '-'}

下面是该账号最近同步的作品数据：

{works_text}

{skills_text}

{user_prompt_template}

请严格按照下面的 JSON schema 输出，不要输出 Markdown，不要包裹代码块，不要添加解释文字。
缺失信息用空字符串或空数组，不要编造数据。
priority 只能使用 high、medium、low。

{{
  "summary": "",
  "positioning": {{
    "current_direction": "",
    "strengths": [],
    "risks": []
  }},
  "top_works": [
    {{
      "title": "",
      "reason": "",
      "evidence": ""
    }}
  ],
  "title_analysis": {{
    "patterns": [],
    "problems": [],
    "formulas": []
  }},
  "content_structure": {{
    "strengths": [],
    "problems": [],
    "template": ""
  }},
  "audience": {{
    "profile": "",
    "interests": [],
    "unmet_needs": []
  }},
  "topic_suggestions": [
    {{
      "topic": "",
      "title_direction": "",
      "reason": "",
      "angle": "",
      "metric": ""
    }}
  ],
  "actions": [
    {{
      "action": "",
      "priority": "medium",
      "metric": "",
      "cycle": ""
    }}
  ],
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
    return "下面是该 Agent 绑定的 Skills，请在复盘时遵守：\n\n" + "\n\n".join(blocks)


def _parse_review_report(content: str) -> ReviewReport:
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
        return ReviewReport.model_validate(data)
    except ValidationError as e:
        raise RuntimeError(f"模型返回结构不符合复盘 Schema：{e}") from e


def _read_report_row(row: AccountReviewReport, agent_name: str | None = None) -> dict:
    return {
        "id": row.id,
        "account_id": row.account_id,
        "agent_id": row.agent_id,
        "agent_name": agent_name or "",
        "model_config_id": row.model_config_id,
        "provider": row.provider,
        "model": row.model,
        "report": row.report,
        "raw_report": row.raw_report,
        "works_count": row.works_count,
        "usage": row.usage,
        "created_at": row.created_at,
    }
