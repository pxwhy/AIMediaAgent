# AI API 契约

本文档只记录当前项目里已经存在、且前端实际在调用的接口分组。

## 健康检查

```http
GET /health
```

返回：

```json
{"status":"ok"}
```

## 账号与登录会话

```http
POST   /api/v1/accounts
GET    /api/v1/accounts
DELETE /api/v1/accounts/{account_id}

POST   /api/v1/login-sessions
GET    /api/v1/login-sessions/{session_id}
POST   /api/v1/login-sessions/{session_id}/confirm
```

说明：

- `POST /accounts` 创建账号时按 `platform + uid` 去重。
- 前端“批量删除账号”当前通过多次调用单个删除接口完成，不是独立批量接口。
- 登录确认成功后会落本地登录态，并创建或更新账号。

## 账号作品

```http
POST /api/v1/accounts/{account_id}/sync-works
GET  /api/v1/accounts/{account_id}/works
```

说明：

- 当前只支持头条号作品同步。
- 会尽量同步标题、正文、发布时间、平台作品 ID 等信息。
- 服务端会按平台作品 ID 去重，并过滤掉无效栏目项。

## 模型配置

```http
GET    /api/v1/models/configs
POST   /api/v1/models/configs
PUT    /api/v1/models/configs/{model_config_id}
DELETE /api/v1/models/configs/{model_config_id}
POST   /api/v1/models/configs/{model_config_id}/set-default
POST   /api/v1/models/test
```

字段重点：

```json
{
  "name": "默认模型",
  "provider": "deepseek",
  "base_url": "https://api.deepseek.com",
  "model": "deepseek-chat",
  "api_key": "sk-***",
  "temperature": 0.7,
  "timeout_seconds": 60,
  "is_default": true
}
```

说明：

- 当前前端支持 DeepSeek 和 OpenAI-compatible 两类配置。
- `POST /models/test` 返回模型输出内容和 usage。
- Base URL 配置错误会直接返回失败，不能伪装成功。

## Agent 配置

```http
GET    /api/v1/agents/configs
POST   /api/v1/agents/configs
PUT    /api/v1/agents/configs/{agent_id}
DELETE /api/v1/agents/configs/{agent_id}
POST   /api/v1/agents/configs/{agent_id}/set-default
```

字段重点：

```json
{
  "name": "默认复盘 Agent",
  "agent_type": "account_review",
  "model_config_id": 1,
  "skill_ids": [],
  "skill_paths": ["review/summary/SKILL.md"],
  "system_prompt": "...",
  "user_prompt_template": "...",
  "enabled": true,
  "is_default": true
}
```

说明：

- 当前使用的 `agent_type` 包括：`account_review`、`account_profile`、`content_selection`。
- Agent 可绑定本地 Skills 路径。

## Skills

```http
GET    /api/v1/skills/configs
POST   /api/v1/skills/configs
PUT    /api/v1/skills/configs/{skill_id}
DELETE /api/v1/skills/configs/{skill_id}

GET    /api/v1/skills/local
POST   /api/v1/skills/local/reload
```

说明：

- `skills/local` 读取固定目录下的 `SKILL.md`。
- 本地 Skills 主要用于 Agent prompt 拼装，不直接参与账号或发布执行。

## 账号复盘

```http
POST   /api/v1/agents/account-review
GET    /api/v1/agents/account-review/reports
DELETE /api/v1/agents/account-review/reports/{report_id}
```

请求重点：

```json
{
  "account_id": 1,
  "agent_id": 2,
  "model_config_id": null
}
```

返回重点：

- `report.summary`
- `report.positioning`
- `report.top_works`
- `report.title_analysis`
- `report.content_structure`
- `report.audience`
- `report.topic_suggestions`
- `report.actions`
- `raw_report`

## 账号肖像

```http
POST   /api/v1/agents/account-profile
GET    /api/v1/agents/account-profile/reports
DELETE /api/v1/agents/account-profile/reports/{profile_id}
```

请求重点：

```json
{
  "account_id": 1,
  "review_report_id": 10,
  "agent_id": 3,
  "model_config_id": null
}
```

返回重点：

- `profile.summary`
- `profile.positioning`
- `profile.audience_profile`
- `profile.content_tracks`
- `profile.title_style`
- `profile.source_preferences`
- `profile.topic_keywords`
- `profile.publishing_advice`
- `raw_report`

## 素材智能筛选

```http
POST /api/v1/agents/content-selection
```

请求重点：

```json
{
  "raw_content_ids": [1, 2, 3],
  "agent_id": 4,
  "model_config_id": null,
  "account_id": 1,
  "profile_report_id": 2,
  "review_report_id": 3,
  "basis": "账号肖像",
  "targets": "IT之家/首页"
}
```

返回重点：

- `id`
- `basis`
- `targets`
- `candidates_count`
- `recommended_count`
- 每条素材的 `selected`
- `score`
- `reason`
- `risk`
- `suggested_angle`
- `suggested_title`
- `data_limits`

```http
GET    /api/v1/agents/content-selections
GET    /api/v1/agents/content-selections/{run_id}
DELETE /api/v1/agents/content-selections/{run_id}
```

用于读取和删除已落库的智能筛选历史。

## 采集与素材库

```http
GET    /api/v1/collector/sources
POST   /api/v1/collector/preview
POST   /api/v1/collector/import

POST   /api/v1/raw-contents
GET    /api/v1/raw-contents
DELETE /api/v1/raw-contents/{raw_content_id}
```

说明：

- `collector/preview` 用于热点预览。
- `collector/import` 会优先按 `source_url` 去重。
- `raw-contents` 是进入发布、筛选、复盘链路前的统一素材库。

## 草稿与发布

```http
POST /api/v1/drafts
POST /api/v1/drafts/from-raw-content
GET  /api/v1/drafts

POST   /api/v1/publish-tasks
GET    /api/v1/publish-tasks
GET    /api/v1/publish-tasks/{task_id}/diagnostics
POST   /api/v1/publish-tasks/{task_id}/open-editor
POST   /api/v1/publish-tasks/{task_id}/auto-publish
POST   /api/v1/publish-tasks/{task_id}/mark-published
POST   /api/v1/publish-tasks/{task_id}/mark-failed
POST   /api/v1/publish-tasks/{task_id}/cancel
DELETE /api/v1/publish-tasks/{task_id}
```

说明：

- 当前平台包括头条号、小红书。
- `open-editor` 负责打开平台编辑页。
- `auto-publish` 负责执行自动发布。
- `diagnostics` 返回运行目录、日志、截图、平台返回、错误信息。
- 发布失败必须写入错误原因，供前端详情弹框查看。
