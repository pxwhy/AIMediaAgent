# AI Coding Rules

## 通用规则

- 业务代码文件顶部必须写“实现逻辑”注释。
- 优先中文注释和中文回复。
- 新需求编码前先确认方案。
- 不把采集、Agent、发布逻辑写进同一个服务。
- 不在 H5 前端保存敏感 API Key 或 Cookie。

## 后端规则

- API 路由只处理请求响应。
- 业务逻辑放 `services/`。
- 数据模型放 `models/`。
- Pydantic schema 放 `schemas/`。
- Worker 任务不能直接依赖前端状态。

## 前端规则

- H5 只调用 API，不直接读写本地文件。
- 页面以业务流程为主，不做营销式首页。
- 复杂状态后续放 Pinia。
- API 调用统一放 `src/api/`。

## 自动化发布规则

- 平台登录态只在账号模块管理。
- 发布器只消费 `PublishTask`。
- 发布失败必须记录原因。
- 不能实现绕验证码、绕风控、异常规避逻辑。

## AI/Agent 规则

- Agent 输出草稿、评分、建议。
- Agent 不读取 Cookie。
- Agent 不直接调用发布器。
- 模型调用必须有 timeout、错误处理和日志。

