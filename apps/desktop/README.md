# Desktop

桌面端建议使用 Tauri。

## 设计

```text
Tauri
  -> 启动本地 API
  -> 启动 Worker
  -> 打开 H5 管理端
```

MVP 阶段先保留目录和说明，等 H5/API 稳定后再执行 Tauri 初始化。

## 后续命令

```bash
npm create tauri-app@latest apps/desktop
```

桌面端不要承载业务逻辑，只做：

- 窗口管理
- 托盘
- 本地启动器
- 本地配置

