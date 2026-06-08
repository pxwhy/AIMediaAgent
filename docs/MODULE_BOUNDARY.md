# 模块边界

## 业务主线

```text
Account -> RawContent -> PublishDraft -> PublishTask -> PublishResult -> WorkMetric
```

## Collector

只负责采集，不生成、不发布。

输入：

```text
source, category, url
```

输出：

```text
RawContent
```

## Agent

只负责判断、生成和复盘建议，不碰浏览器、不碰 Cookie。

输入：

```text
RawContent, AccountProfile
```

输出：

```text
PublishDraft, ReviewResult, SchedulePlan
```

## Draft

负责人机协作和审核。

输入：

```text
PublishDraft
```

输出：

```text
Approved PublishDraft
```

## Publisher

只消费发布任务，负责平台执行和结果回写。

输入：

```text
PublishTask
```

输出：

```text
PublishResult
```

## Analytics

只做数据复盘，不修改发布任务。

输入：

```text
PublishResult, WorkMetric
```

输出：

```text
AccountReport, TopicInsight
```

