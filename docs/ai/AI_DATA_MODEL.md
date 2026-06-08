# AI Data Model

## Account

平台账号。

关键字段：

```text
platform
nickname
uid
status
session_data
daily_publish_limit
```

## RawContent

采集到的原始内容。

关键字段：

```text
source
category
title
content
source_url
images
metrics
status
```

## PublishDraft

Agent 生成或人工编辑的发布草稿。

关键字段：

```text
raw_content_id
account_id
title
content
images
status
agent_notes
risk_score
```

## PublishTask

发布任务。

关键字段：

```text
draft_id
platform
status
scheduled_at
```

## PublishResult

发布结果。

关键字段：

```text
task_id
success
platform_url
error_message
raw_response
published_at
```

## SystemLog

系统日志。

关键字段：

```text
module
level
message
context
created_at
```

## LoginSession

平台登录会话。

关键字段：

```text
id
platform
status
login_url
state_path
account_id
error_message
created_at
updated_at
```

## 状态流

```text
RawContent.collected
  -> PublishDraft.pending
  -> PublishDraft.generated
  -> PublishDraft.approved
  -> PublishTask.pending
  -> PublishTask.publishing
  -> PublishTask.published / failed
  -> PublishResult
```

登录状态流：

```text
LoginSession.opened
  -> LoginSession.confirming
  -> LoginSession.completed / failed
  -> Account
```
