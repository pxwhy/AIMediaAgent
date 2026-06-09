# AI 数据模型

## Account

平台账号，保存登录态关联关系与运营限制。

关键字段：

```text
platform
nickname
uid
status
session_data
daily_publish_limit
```

说明：

- 按 `platform + uid` 去重。
- 删除账号时当前偏向软删除/禁用，不直接破坏历史链路。

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

## AccountWork

从平台同步回来的账号作品。

关键字段：

```text
account_id
platform_work_id
title
content
cover_url
published_at
metrics
```

说明：

- 当前主要用于头条号作品同步、复盘输入、账号肖像输入。

## RawContent

采集到的原始素材。

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
published_at
```

说明：

- 以 `source_url` 作为重要去重依据。
- 是智能筛选、草稿生成、发布任务的共同上游。

## ContentSelectionRun

一次素材智能筛选记录，筛选结果会落库，刷新页面后仍可查看历史。

关键字段：

```text
id
account_id
profile_report_id
review_report_id
agent_id
agent_name
model_config_id
provider
model
basis
targets
candidates_count
recommended_count
raw_report
usage
created_at
```

## ContentSelectionItem

一次筛选中单条素材的判断结果。

关键字段：

```text
run_id
raw_content_id
selected
score
reason
risk
suggested_angle
suggested_title
data_limits
```

## PublishDraft

发布草稿，可由素材快速生成，也可人工调整。

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

发布执行单元。

关键字段：

```text
draft_id
platform
status
scheduled_at
created_at
updated_at
```

状态重点：

```text
pending
publishing
published
failed
canceled
```

## PublishResult / PublishTaskDiagnostics

发布结果与诊断信息。

`PublishResult` 关键字段：

```text
task_id
success
platform_url
error_message
raw_response
published_at
```

`PublishTaskDiagnostics` 关键字段：

```text
task_id
status
run_dir
logs
screenshots
result
```

说明：

- 诊断数据来自本地 `data/publish_runs/`。
- 主要用于自动发布问题定位，而不是用户侧长期展示数据。

## ModelConfig

模型配置。

关键字段：

```text
name
provider
base_url
model
api_key
temperature
timeout_seconds
is_default
enabled
```

## AgentConfig

Agent 配置。

关键字段：

```text
name
agent_type
model_config_id
system_prompt
user_prompt_template
skill_ids
skill_paths
enabled
is_default
```

## SkillConfig / LocalSkill

Skill 配置与本地 Skill 文件。

`SkillConfig` 关键字段：

```text
name
skill_type
description
content
enabled
```

`LocalSkill` 关键字段：

```text
name
description
relative_path
path
content
```

## AccountReviewReport

账号复盘结果。

关键字段：

```text
account_id
agent_id
agent_name
model_config_id
provider
model
report
raw_report
works_count
usage
created_at
```

## AccountProfileReport

账号肖像结果。

关键字段：

```text
account_id
review_report_id
agent_id
agent_name
model_config_id
provider
model
profile
raw_report
works_count
usage
created_at
```

## 核心状态流

### 登录与账号

```text
LoginSession.opened
  -> LoginSession.confirming
  -> LoginSession.completed / failed
  -> Account 可用
```

### 采集与发布

```text
CollectorItem
  -> RawContent
  -> ContentSelectionResult
  -> PublishDraft.pending / generated
  -> PublishTask.pending
  -> PublishTask.publishing
  -> PublishTask.published / failed / canceled
  -> PublishResult / PublishTaskDiagnostics
```

### 复盘与肖像

```text
AccountWork / PublishResult
  -> AccountReviewReport
  -> AccountProfileReport
  -> 反哺智能筛选与选题判断
```
