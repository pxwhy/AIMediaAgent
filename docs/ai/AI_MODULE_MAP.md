# AI 模块地图

## 后端 `apps/api`

### 入口与路由

```text
app/main.py                     FastAPI 应用入口
app/api/v1/router.py            当前统一业务路由，集中暴露账号、模型、Agent、Skills、采集、发布、复盘等接口
app/db/session.py               数据库会话管理
app/core/config.py              本地配置与环境配置入口
```

### 数据模型

```text
app/models/core_models.py       当前核心 SQLAlchemy 模型，包含账号、作品、草稿、发布、模型、Agent、复盘、肖像等
app/schemas/core.py             当前核心 Pydantic schema
```

### 业务服务

```text
app/services/crud.py                    基础账号、素材、草稿、发布任务 CRUD，含账号去重逻辑
app/services/login_session_service.py   登录会话创建、确认、登录态写入
app/services/account_work_service.py    头条号作品同步、作品去重、作品清洗
app/services/model_config_service.py    模型配置增删改查、默认模型、模型测试
app/services/agent_setting_service.py   Agent 配置管理、默认 Agent、Skill 绑定
app/services/skill_setting_service.py   Skill 配置管理、本地 Skills 目录扫描
app/services/account_review_service.py  账号复盘 prompt 组装、模型调用、结果解析、历史记录
app/services/account_profile_service.py 账号肖像 prompt 组装、模型调用、结果解析、历史记录
app/services/content_selection_service.py 素材智能筛选、结果解析
app/services/publish_service.py         发布草稿生成、发布任务创建、打开编辑器、自动发布、诊断读取
```

### 关联包

```text
packages.collector                     采集器来源列表、热点预览、详情抓取
packages.publisher.toutiao_*           头条号发布自动化 worker
packages.publisher.xiaohongshu_*       小红书发布自动化 worker
packages.accounts.toutiao_works_worker 头条号作品同步 worker
```

## 前端 `apps/web`

```text
src/App.vue                 当前主工作台页面，集中承载账号、采集、发布、模型、Agent、Skills、复盘、肖像、智能筛选
src/api/client.ts           前端 API 客户端和数据类型定义
src/styles.css              全局样式和工作台布局样式
```

前端当前仍以单页工作台为主，复杂状态已经开始分页化、弹框化，后续可继续拆分页面组件与状态层。

## Worker / 自动化

```text
apps/worker/main.py         Worker 占位入口
data/browser_states/        平台登录态本地存储目录
data/publish_runs/          自动发布诊断目录，存放日志、截图、返回结果
```

## 文档目录

```text
docs/ai/                    AI 协作文档、接口契约、测试清单、风险说明
docs/MODULE_BOUNDARY.md     模块边界
docs/MVP_ROADMAP.md         当前阶段路线与后续规划
AGENTS.md                   仓库级 AI 协作执行约束
```

## 当前模块关系

```text
Account
  -> LoginSession / AccountWork
  -> AccountReviewReport
  -> AccountProfileReport

CollectorSource
  -> CollectorItem
  -> RawContent

RawContent
  -> ContentSelectionResult
  -> PublishDraft

PublishDraft
  -> PublishTask
  -> PublishResult / Diagnostics

AgentConfig
  -> ModelConfig
  -> Local Skills / SkillConfig
```
