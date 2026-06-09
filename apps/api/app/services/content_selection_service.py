"""
实现逻辑：
1. 读取用户勾选的采集内容，整理标题、正文摘要、来源、图片和采集指标作为挑选输入。
2. 调用素材挑选 Agent；Agent 决定使用哪个模型、提示词和本地 Codex Skills，模型配置不读取 .env。
3. 模型必须返回固定 JSON，后端校验成结构化挑选结果，供素材库页面稳定展示。
"""

import json
import re
from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.core_models import ContentSelectionItem, ContentSelectionRun, RawContent
from app.schemas.core import ContentSelectionItemRead
from app.services.agent_setting_service import resolve_agent
from app.services.model_config_service import llm_config_from_db
from app.services.skill_setting_service import list_local_skills_by_paths
from packages.agent.llm_client import generate_text


class _SelectionPayload(BaseModel):
    results: list[ContentSelectionItemRead] = []


def select_collected_content(
    db: Session,
    raw_content_ids: list[int],
    agent_id: int | None = None,
    model_config_id: int | None = None,
    account_id: int | None = None,
    profile_report_id: int | None = None,
    review_report_id: int | None = None,
    basis: str = "",
    targets: str = "",
) -> dict:
    ids = _normalize_ids(raw_content_ids)
    if not ids:
        raise ValueError("请选择采集内容")

    contents = _list_raw_contents(db, ids)
    if not contents:
        raise ValueError("请选择有效的采集内容")

    agent = resolve_agent(db, agent_id, agent_type="content_selection")
    resolved_model_config_id = agent.model_config_id or model_config_id
    config = llm_config_from_db(db, model_config_id=resolved_model_config_id)
    skills = list_local_skills_by_paths(agent.skill_paths or [])
    prompt = _build_selection_prompt(contents, agent.user_prompt_template, skills)
    result = generate_text(
        [
            {"role": "system", "content": agent.system_prompt},
            {"role": "user", "content": prompt},
        ],
        config,
    )
    payload = _parse_selection_report(result["content"], ids)
    run = _create_selection_run(
        db,
        payload=payload,
        agent_id=agent.id,
        agent_name=agent.name,
        model_config_id=resolved_model_config_id,
        provider=result["provider"],
        model=result["model"],
        raw_report=result["content"],
        usage=result["usage"],
        account_id=account_id,
        profile_report_id=profile_report_id,
        review_report_id=review_report_id,
        basis=basis,
        targets=targets,
    )
    return _serialize_run(run)


def list_selection_runs(db: Session, account_id: int | None = None) -> list[dict]:
    statement = (
        select(ContentSelectionRun)
        .options(selectinload(ContentSelectionRun.items))
        .order_by(desc(ContentSelectionRun.created_at))
    )
    if account_id:
        statement = statement.where(ContentSelectionRun.account_id == account_id)
    return [_serialize_run(run) for run in db.scalars(statement)]


def get_selection_run(db: Session, run_id: int) -> dict | None:
    run = db.scalar(
        select(ContentSelectionRun)
        .where(ContentSelectionRun.id == run_id)
        .options(selectinload(ContentSelectionRun.items))
    )
    return _serialize_run(run) if run else None


def delete_selection_run(db: Session, run_id: int) -> bool:
    run = db.get(ContentSelectionRun, run_id)
    if not run:
        return False
    db.delete(run)
    db.commit()
    return True


def _create_selection_run(
    db: Session,
    payload: _SelectionPayload,
    agent_id: int | None,
    agent_name: str,
    model_config_id: int | None,
    provider: str,
    model: str,
    raw_report: str,
    usage: dict,
    account_id: int | None,
    profile_report_id: int | None,
    review_report_id: int | None,
    basis: str,
    targets: str,
) -> ContentSelectionRun:
    run = ContentSelectionRun(
        account_id=account_id,
        profile_report_id=profile_report_id,
        review_report_id=review_report_id,
        agent_id=agent_id,
        agent_name=agent_name,
        model_config_id=model_config_id,
        provider=provider,
        model=model,
        basis=basis,
        targets=targets,
        candidates_count=len(payload.results),
        recommended_count=sum(1 for item in payload.results if item.selected),
        raw_report=raw_report,
        usage=usage,
    )
    db.add(run)
    db.flush()
    for item in payload.results:
        db.add(
            ContentSelectionItem(
                run_id=run.id,
                raw_content_id=item.raw_content_id,
                selected=1 if item.selected else 0,
                score=item.score,
                reason=item.reason,
                risk=item.risk,
                suggested_angle=item.suggested_angle,
                suggested_title=item.suggested_title,
                data_limits=item.data_limits,
            )
        )
    db.commit()
    db.refresh(run)
    return run


def _serialize_run(run: ContentSelectionRun) -> dict:
    items = sorted(run.items, key=lambda item: item.id)
    return {
        "id": run.id,
        "account_id": run.account_id,
        "profile_report_id": run.profile_report_id,
        "review_report_id": run.review_report_id,
        "agent_id": run.agent_id,
        "agent_name": run.agent_name,
        "model_config_id": run.model_config_id,
        "provider": run.provider,
        "model": run.model,
        "basis": run.basis,
        "targets": run.targets,
        "candidates_count": run.candidates_count,
        "recommended_count": run.recommended_count,
        "results": [
            {
                "raw_content_id": item.raw_content_id,
                "selected": bool(item.selected),
                "score": item.score,
                "reason": item.reason,
                "risk": item.risk,
                "suggested_angle": item.suggested_angle,
                "suggested_title": item.suggested_title,
                "data_limits": item.data_limits or [],
            }
            for item in items
        ],
        "raw_report": run.raw_report,
        "usage": run.usage or {},
        "created_at": run.created_at,
    }


def _normalize_ids(raw_content_ids: list[int]) -> list[int]:
    clean_ids = []
    for raw_content_id in raw_content_ids or []:
        try:
            value = int(raw_content_id)
        except (TypeError, ValueError):
            continue
        if value > 0 and value not in clean_ids:
            clean_ids.append(value)
    return clean_ids


def _list_raw_contents(db: Session, ids: list[int]) -> list[RawContent]:
    rows = list(db.scalars(select(RawContent).where(RawContent.id.in_(ids))))
    row_map = {row.id: row for row in rows}
    return [row_map[raw_content_id] for raw_content_id in ids if raw_content_id in row_map]


def _build_selection_prompt(contents: list[RawContent], user_prompt_template: str, skills: list) -> str:
    content_lines = []
    for index, content in enumerate(contents, start=1):
        body = (content.content or "").strip()
        if len(body) > 900:
            body = body[:900] + "..."
        metrics = content.metrics or {}
        content_lines.append(
            "\n".join(
                [
                    f"{index}. raw_content_id：{content.id}",
                    f"来源：{content.source}",
                    f"分类：{content.category or '-'}",
                    f"标题：{content.title}",
                    f"链接：{content.source_url or '-'}",
                    f"状态：{content.status or '-'}",
                    f"图片数：{len(content.images or [])}",
                    f"指标：{json.dumps(metrics, ensure_ascii=False)}",
                    f"正文摘要：{body or '-'}",
                ]
            )
        )

    skills_text = _build_skills_text(skills)
    return f"""
下面是待挑选的采集内容：

{chr(10).join(content_lines)}

{skills_text}

{user_prompt_template}

请严格按照下面的 JSON schema 输出，不要输出 Markdown，不要包裹代码块，不要添加解释文字。
必须为每个 raw_content_id 返回一条结果；缺失信息写入 data_limits，不要编造数据。
selected 表示是否建议进入后续创作流程；score 为 0-100 的整数；risk 只能使用 high、medium、low。

{{
  "results": [
    {{
      "raw_content_id": 0,
      "selected": false,
      "score": 0,
      "reason": "",
      "risk": "medium",
      "suggested_angle": "",
      "suggested_title": "",
      "data_limits": []
    }}
  ]
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
    return "下面是该 Agent 绑定的 Skills，请在挑选时遵守：\n\n" + "\n\n".join(blocks)


def _parse_selection_report(content: str, expected_ids: list[int]) -> _SelectionPayload:
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
        payload = _SelectionPayload.model_validate(data)
    except ValidationError as e:
        raise RuntimeError(f"模型返回结构不符合素材挑选 Schema：{e}") from e
    return _normalize_payload(payload, expected_ids)


def _normalize_payload(payload: _SelectionPayload, expected_ids: list[int]) -> _SelectionPayload:
    item_map: dict[int, ContentSelectionItemRead] = {}
    for item in payload.results:
        if item.raw_content_id not in expected_ids:
            continue
        normalized = item.model_dump()
        normalized["score"] = _clamp_score(normalized.get("score"))
        normalized["risk"] = _normalize_risk(normalized.get("risk"))
        item_map[item.raw_content_id] = ContentSelectionItemRead.model_validate(normalized)

    results = []
    for raw_content_id in expected_ids:
        results.append(
            item_map.get(
                raw_content_id,
                ContentSelectionItemRead(
                    raw_content_id=raw_content_id,
                    selected=False,
                    score=0,
                    reason="模型未返回该素材的判断",
                    risk="medium",
                    data_limits=["missing_model_result"],
                ),
            )
        )
    return _SelectionPayload(results=results)


def _clamp_score(value: Any) -> int:
    try:
        score = int(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(score, 100))


def _normalize_risk(value: Any) -> str:
    risk = str(value or "medium").lower()
    return risk if risk in {"high", "medium", "low"} else "medium"
