"""
实现逻辑：
1. 管理页面配置的 Skills，第一版 Skill 作为可复用 prompt 片段。
2. 支持从项目 skills 目录扫描 Codex 风格 SKILL.md，先给前端读取展示。
3. 默认不自动创建 Skill 内容，避免用户误以为系统内置了不可控能力。
"""

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core_models import SkillSetting, SkillType
from app.schemas.core import SkillConfigUpdate


PROJECT_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SKILLS_ROOT = PROJECT_ROOT / "skills"


def local_skills_root() -> Path:
    DEFAULT_SKILLS_ROOT.mkdir(parents=True, exist_ok=True)
    return DEFAULT_SKILLS_ROOT


def list_local_skills() -> dict:
    root = local_skills_root()
    skills = []
    for path in sorted(root.glob("**/SKILL.md")):
        skill = _read_local_skill(path)
        if skill["name"] and skill["description"]:
            skills.append(skill)
    return {"root": str(root), "skills": skills}


def list_local_skills_by_paths(skill_paths: list[str]) -> list[dict]:
    root = local_skills_root()
    skills = []
    for skill_path in _normalize_skill_paths(skill_paths):
        path = (root / skill_path / "SKILL.md").resolve()
        if not path.is_relative_to(root.resolve()) or not path.exists():
            continue
        skill = _read_local_skill(path)
        if skill["name"] and skill["description"]:
            skills.append(skill)
    return skills


def list_skill_configs(db: Session) -> list[dict]:
    skills = list(db.scalars(select(SkillSetting).order_by(SkillSetting.id.asc())))
    return [_read_skill_config(skill) for skill in skills]


def create_skill_config(db: Session, payload: SkillConfigUpdate) -> dict:
    skill = SkillSetting()
    _apply_payload(skill, payload)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return _read_skill_config(skill)


def update_skill_config(db: Session, skill_id: int, payload: SkillConfigUpdate) -> dict:
    skill = db.get(SkillSetting, skill_id)
    if not skill:
        raise ValueError("Skill 不存在")
    _apply_payload(skill, payload)
    db.commit()
    db.refresh(skill)
    return _read_skill_config(skill)


def delete_skill_config(db: Session, skill_id: int) -> bool:
    skill = db.get(SkillSetting, skill_id)
    if not skill:
        return False
    db.delete(skill)
    db.commit()
    return True


def list_enabled_skills_by_ids(db: Session, skill_ids: list[int]) -> list[SkillSetting]:
    clean_ids = [int(skill_id) for skill_id in skill_ids if int(skill_id) > 0]
    if not clean_ids:
        return []
    skills = list(
        db.scalars(
            select(SkillSetting)
            .where(SkillSetting.id.in_(clean_ids), SkillSetting.enabled == 1)
            .order_by(SkillSetting.id.asc())
        )
    )
    order = {skill_id: index for index, skill_id in enumerate(clean_ids)}
    return sorted(skills, key=lambda skill: order.get(skill.id, len(order)))


def _apply_payload(skill: SkillSetting, payload: SkillConfigUpdate) -> None:
    try:
        skill_type = SkillType(payload.skill_type)
    except ValueError as e:
        raise ValueError("暂不支持该 Skill 类型") from e
    skill.name = payload.name.strip()
    if not skill.name:
        raise ValueError("请填写 Skill 名称")
    skill.skill_type = skill_type
    skill.description = payload.description.strip()
    skill.content = payload.content.strip()
    if not skill.content:
        raise ValueError("请填写 Skill 内容")
    skill.enabled = 1 if payload.enabled else 0


def _read_skill_config(skill: SkillSetting) -> dict:
    return {
        "id": skill.id,
        "name": skill.name,
        "skill_type": skill.skill_type.value if hasattr(skill.skill_type, "value") else str(skill.skill_type),
        "description": skill.description,
        "content": skill.content,
        "enabled": bool(skill.enabled),
    }


def _read_local_skill(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    metadata, body = _split_frontmatter(raw)
    return {
        "name": metadata.get("name") or path.parent.name,
        "description": metadata.get("description", ""),
        "path": str(path),
        "relative_path": str(path.parent.relative_to(local_skills_root())),
        "content": body.strip(),
    }


def _normalize_skill_paths(skill_paths: list[str]) -> list[str]:
    clean_paths = []
    for skill_path in skill_paths or []:
        value = str(skill_path).strip().strip("/")
        if not value or value.startswith(".") or ".." in Path(value).parts:
            continue
        if value not in clean_paths:
            clean_paths.append(value)
    return clean_paths


def _split_frontmatter(raw: str) -> tuple[dict[str, str], str]:
    text = raw.lstrip("\ufeff")
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end == -1:
        return {}, text
    frontmatter = text[4:end]
    body = text[end + len("\n---") :].lstrip("\n")
    metadata: dict[str, str] = {}
    for line in frontmatter.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"').strip("'")
    return metadata, body
