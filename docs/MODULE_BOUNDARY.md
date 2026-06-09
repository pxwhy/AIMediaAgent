# 模块边界

## 主业务链路

```text
LoginSession -> Account -> AccountWork
RawContent -> ContentSelectionRun -> ContentSelectionItem
RawContent -> PublishDraft -> PublishTask -> PublishResult
AccountWork / PublishResult -> AccountReviewReport -> AccountProfileReport
```

## Account

职责：

- 管理平台账号、登录态关联、账号级限制。

不负责：

- 不负责模型推理。
- 不负责发布页面操作。

## Collector

职责：

- 拉取来源、分类、热点预览和详情内容。
- 把可用内容转成 `RawContent`。

不负责：

- 不决定是否发布。
- 不负责生成文案。

## Content Selection

职责：

- 基于素材、复盘、账号肖像和挑选 Agent，给出“选/不选”的判断。

不负责：

- 不直接导入平台。
- 不直接创建发布动作。

## Agent

职责：

- 生成复盘、肖像、筛选建议等结构化结果。
- 组合模型配置、系统提示词、用户提示词、Skills。

不负责：

- 不读取 Cookie。
- 不操作浏览器。
- 不直接发布。

## Skills

职责：

- 提供可复用的 prompt 片段、输出约束、局部规则。

不负责：

- 不直接访问账号登录态。
- 不直接驱动发布器。
- 不直接改数据库数据。

## Draft

职责：

- 承接素材到发布任务之间的人机协作编辑。

不负责：

- 不处理平台页面交互。

## Publisher

职责：

- 只消费 `PublishTask`。
- 打开平台编辑页、执行自动发布、记录结果和诊断。

不负责：

- 不做选题判断。
- 不调用模型生成内容。

## Analytics

职责：

- 基于账号作品和发布结果做复盘和账号肖像。

不负责：

- 不直接修改发布任务状态。
- 不直接执行采集器。
