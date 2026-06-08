# AI API Contracts

## Health

```http
GET /health
```

返回：

```json
{"status":"ok"}
```

## Accounts

```http
POST /api/v1/accounts
GET /api/v1/accounts
```

创建字段：

```json
{
  "platform": "toutiao",
  "nickname": "账号昵称",
  "uid": "平台 UID",
  "session_data": {},
  "daily_publish_limit": 5
}
```

## Raw Contents

```http
POST /api/v1/raw-contents
GET /api/v1/raw-contents
```

创建字段：

```json
{
  "source": "ithome",
  "category": "科技",
  "title": "标题",
  "content": "正文",
  "source_url": "https://example.com",
  "images": [],
  "metrics": {}
}
```

## Drafts

```http
POST /api/v1/drafts
GET /api/v1/drafts
```

创建字段：

```json
{
  "raw_content_id": 1,
  "account_id": 1,
  "title": "草稿标题",
  "content": "草稿正文",
  "images": [],
  "agent_notes": {},
  "risk_score": 10
}
```

## Publish Tasks

```http
POST /api/v1/publish-tasks
GET /api/v1/publish-tasks
```

创建字段：

```json
{
  "draft_id": 1,
  "platform": "toutiao",
  "scheduled_at": null
}
```

## Login Sessions

```http
POST /api/v1/login-sessions
GET  /api/v1/login-sessions/{session_id}
POST /api/v1/login-sessions/{session_id}/confirm
```

创建字段：

```json
{
  "platform": "toutiao"
}
```

流程：

```text
创建登录会话
  -> Playwright 打开平台登录页
  -> 用户手动登录
  -> 调用 confirm
  -> 保存 storage_state
  -> 创建 Account
```

约束：

- 不绕验证码。
- 不自动模拟异常登录。
- 登录态文件只保存在本地 `data/browser_states/`。
