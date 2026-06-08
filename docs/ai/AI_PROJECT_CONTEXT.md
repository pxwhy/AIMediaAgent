# AI Project Context

## 项目定位

AIMediaAgent 是 AIMedia 的轻量重写版本，目标是构建一个内容运营工作台。

核心链路：

```text
数据采集 -> Agent 草稿 -> 人工审核 -> 平台发布 -> 数据复盘
```

## 技术形态

```text
FastAPI API
Vue3 H5 管理端
Tauri 桌面壳
Python Worker
Playwright 平台发布
SQLite 起步
```

## 当前阶段

当前处于 MVP 骨架阶段：

- API 已有核心数据模型和 CRUD。
- H5 已有仪表盘首屏。
- Worker 有入口占位。
- Desktop 目录仅保留 Tauri 规划。
- Collector、Agent、Publisher 有模块边界样例。

## 项目原则

- H5 是主界面，桌面端只是壳。
- 耗时任务放 Worker，不阻塞 API 和 H5。
- Agent 不直接发布。
- Publisher 不生成内容。
- Collector 只采集，不做内容决策。

