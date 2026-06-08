"""
实现逻辑：
1. 创建 FastAPI 应用并注册 API 路由。
2. 启动时初始化本地数据库表，方便 MVP 阶段快速运行。
3. 提供健康检查接口，供 H5 和桌面壳判断后端状态。
"""

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.db.session import init_db


def create_app() -> FastAPI:
    app = FastAPI(title="AIMediaAgent API", version="0.1.0")

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()

