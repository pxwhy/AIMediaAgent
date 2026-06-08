# AI Desktop Flow

## 桌面端定位

桌面端使用 Tauri，只作为 H5 和本地服务的壳。

桌面端不承载业务逻辑。

## 启动流程

```text
用户双击桌面端
  -> 检查本地 API 是否启动
  -> 启动 API
  -> 启动 Worker
  -> 打开 H5 窗口
  -> 用户在 H5 操作
```

## 开发阶段

当前用脚本模拟桌面端启动：

```bash
scripts/start_dev.sh
```

访问：

```text
API: http://127.0.0.1:8010
H5 : http://127.0.0.1:5173
```

停止：

```bash
scripts/stop_dev.sh
```

## 后续 Tauri 职责

- 窗口管理
- 托盘
- 启动本地服务
- 打开 H5
- 保存本地配置

## 禁止事项

- 不在 Tauri 里写采集逻辑。
- 不在 Tauri 里写发布逻辑。
- 不在 Tauri 里写 Agent 调用逻辑。

