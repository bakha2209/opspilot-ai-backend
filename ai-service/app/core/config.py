from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "OpsPilot AI Service"
    API_PREFIX: str = "/api/v1"

    # Local Ollama default
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    class Config:
        env_file = ".env"


settings = Settings()