import json
from dataclasses import dataclass, field

from anthropic import AsyncAnthropic

from app.config import settings


@dataclass
class TokenUsageData:
    """Token usage from a single API call."""
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: int = 0
    cache_creation_input_tokens: int = 0

    def __add__(self, other: "TokenUsageData") -> "TokenUsageData":
        return TokenUsageData(
            input_tokens=self.input_tokens + other.input_tokens,
            output_tokens=self.output_tokens + other.output_tokens,
            cache_read_input_tokens=self.cache_read_input_tokens + other.cache_read_input_tokens,
            cache_creation_input_tokens=self.cache_creation_input_tokens + other.cache_creation_input_tokens,
        )


@dataclass
class CompletionResult:
    """Result from a Claude API call, including text and token usage."""
    text: str
    usage: TokenUsageData = field(default_factory=TokenUsageData)


class ClaudeClient:
    def __init__(self):
        self._client: AsyncAnthropic | None = None

    @property
    def client(self) -> AsyncAnthropic:
        if self._client is None:
            self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        return self._client

    def _build_system(self, system_prompt: str) -> list[dict]:
        """Build system prompt with cache_control for Anthropic prompt caching."""
        return [{
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},
        }]

    def _extract_usage(self, response) -> TokenUsageData:
        """Extract token usage from an API response."""
        usage = response.usage
        return TokenUsageData(
            input_tokens=getattr(usage, "input_tokens", 0),
            output_tokens=getattr(usage, "output_tokens", 0),
            cache_read_input_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
            cache_creation_input_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
        )

    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> CompletionResult:
        response = await self.client.messages.create(
            model=model or settings.claude_model,
            max_tokens=max_tokens or settings.max_tokens,
            temperature=temperature or settings.temperature,
            system=self._build_system(system_prompt),
            messages=[{"role": "user", "content": user_message}],
        )
        return CompletionResult(
            text=response.content[0].text,
            usage=self._extract_usage(response),
        )

    async def complete_json(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> tuple[dict, TokenUsageData]:
        """Return (parsed_json, token_usage) tuple."""
        result = await self.complete(
            system_prompt=system_prompt,
            user_message=user_message,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        text = result.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])
        return json.loads(text), result.usage


claude_client = ClaudeClient()
