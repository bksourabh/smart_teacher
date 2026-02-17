from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    anthropic_api_key: str = Field(default="", description="Anthropic API key")
    claude_model: str = Field(default="claude-sonnet-4-5-20250929", description="Claude model to use")
    database_url: str = Field(default="sqlite+aiosqlite:///./soul.db", description="Database URL")

    # Module weights (must sum to 1.0)
    weight_manas: float = Field(default=0.35, description="Mind module weight")
    weight_buddhi: float = Field(default=0.40, description="Intellect module weight")
    weight_sanskaras: float = Field(default=0.25, description="Habits module weight")

    # Claude parameters
    max_tokens: int = Field(default=1024, description="Max tokens per Claude call")
    temperature: float = Field(default=0.7, description="Temperature for Claude calls")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
