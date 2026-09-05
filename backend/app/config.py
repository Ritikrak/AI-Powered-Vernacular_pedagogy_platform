from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Vernacular Classroom API"
    database_url: str = "sqlite:///./vernacular.db"
    secret_key: str = "change-this-in-production"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    upload_dir: str = "uploads"
    google_api_key: str = ""
    openai_api_key: str = ""
    openai_translation_model: str = "gpt-4o-mini"
    openai_tts_model: str = "gpt-4o-mini-tts"
    openai_tts_voice: str = "alloy"
    deepgram_api_key: str = ""
    deepgram_model: str = "nova-3"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
