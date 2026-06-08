"""
实现逻辑：
1. 集中管理 API 服务配置。
2. 支持通过环境变量覆盖数据库、模型和运行参数。
3. MVP 默认使用本地 SQLite，降低启动成本。
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AIMediaAgent"
    database_url: str = "sqlite:///./aimedia_agent.db"
    default_model_provider: str = "deepseek"
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

