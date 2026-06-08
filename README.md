# AIMediaAgent

AIMediaAgent 是 AIMedia 的轻量重写版本，采用 H5 管理端 + 桌面壳 + API + Worker 的结构。

## 目标

- 数据采集负责发现内容机会。
- Agent 负责选题、生成、审核和复盘建议。
- 平台发布负责稳定执行发布任务。
- H5 是主界面，桌面端只做本地壳和启动器。

## 技术栈

- Backend: FastAPI, SQLAlchemy, SQLite
- Web: Vue 3, Vite, Pinia
- Desktop: Tauri
- Worker: Python worker
- Browser Automation: Playwright

## MVP 范围

- 账号管理
- 热点采集
- Agent 生成草稿
- 人工审核
- 头条号发布
- 发布结果保存
- 基础日志

## 目录

```text
apps/
  api/        FastAPI 后端
  web/        H5 管理端
  desktop/    Tauri 桌面壳
  worker/     后台任务入口
packages/
  accounts/   账号模块
  collector/  数据采集模块
  agent/      Agent 模块
  drafts/     草稿审核模块
  publisher/  平台发布模块
  scheduler/  调度模块
  analytics/  数据复盘模块
  settings/   系统配置模块
  shared/     共享类型和工具
docs/         设计文档
```

