from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "OpsPilot AI Service"
    API_PREFIX: str = "/api/v1"

    # Local Ollama default
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_REQUEST_TIMEOUT_SECONDS: float = 90
    OLLAMA_TOOL_MAX_TOKENS: int = 96
    OLLAMA_RESPONSE_MAX_TOKENS: int = 256

    NEST_BACKEND_BASE_URL: str = "http://localhost:4000"
    AI_INTERNAL_API_KEY: str = "dev-ai-internal-key"

    class Config:
        env_file = ".env"


settings = Settings()
