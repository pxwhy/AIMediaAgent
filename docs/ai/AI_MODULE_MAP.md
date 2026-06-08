# AI Module Map

## apps/api

FastAPI 后端。

```text
app/main.py             应用入口
app/core/config.py      配置
app/db/session.py       数据库连接
app/models/             SQLAlchemy 模型
app/schemas/            Pydantic schema
app/services/           业务服务
app/api/v1/             API 路由
```

## apps/web

Vue3 H5 管理端。

```text
src/App.vue             当前仪表盘首屏
src/api/client.ts       API 客户端
src/styles.css          全局样式
```

## apps/worker

后台任务入口。

```text
main.py                 Worker 启动入口
```

## apps/desktop

Tauri 桌面端壳规划目录。

## packages

业务模块包。

```text
accounts/               账号模块
collector/              数据采集模块
agent/                  Agent 模块
drafts/                 草稿审核模块
publisher/              平台发布模块
scheduler/              调度模块
analytics/              数据复盘模块
settings/               系统配置模块
shared/                 共享契约
```

