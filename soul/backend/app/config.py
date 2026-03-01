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

    # Per-call token limits (right-sized for each call type)
    faculty_max_tokens: int = Field(default=300, description="Max tokens for faculty module calls (JSON output)")
    synthesis_max_tokens: int = Field(default=512, description="Max tokens for synthesis call (prose output)")

    # Model tiers (use cheaper models for faculty, better models for synthesis)
    faculty_model: str = Field(default="claude-haiku-4-5-20251001", description="Model for faculty module calls")
    synthesis_model: str = Field(default="claude-sonnet-4-5-20250929", description="Model for synthesis call")

    # Combined mode (single call replaces 3 faculty calls)
    combined_mode: bool = Field(default=False, description="Use single combined call for all faculties")

    # Learning mode
    learning_mode_enabled: bool = Field(default=False, description="Enable trainer learning mode")
    confidence_threshold: float = Field(default=0.4, description="Below this, soul asks for trainer help")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
