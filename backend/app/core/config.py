from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List, Optional, Union
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "LocalReach AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production-use-32-char-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "mysql+aiomysql://localreach:localreach_pass@localhost:3306/localreach_db"
    SYNC_DATABASE_URL: str = "mysql+pymysql://localreach:localreach_pass@localhost:3306/localreach_db"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Claude AI
    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = ""

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "LocalReach AI <noreply@localreach.ai>"

    # Encryption
    FIELD_ENCRYPTION_KEY: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Scraping
    SCRAPING_MAX_CONCURRENT: int = 3
    SCRAPING_DELAY_SECONDS: int = 2

    # Rate limiting
    MAX_WHATSAPP_MESSAGES_PER_DAY: int = 50
    WHATSAPP_DELAY_BETWEEN_MESSAGES: int = 10

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
