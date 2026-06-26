from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./dev.db"
    SECRET_KEY: str = "dev-secret-change-in-production-minimum-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Derived paths
    @property
    def MODEL_DIR(self) -> Path:
        p = Path(__file__).resolve().parent.parent.parent.parent / "models"
        p.mkdir(exist_ok=True)
        return p

    @property
    def DATA_DIR(self) -> Path:
        p = Path(__file__).resolve().parent.parent.parent.parent / "data"
        p.mkdir(exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
