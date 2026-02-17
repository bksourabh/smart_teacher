from abc import ABC, abstractmethod
from pathlib import Path

from app.services.claude_client import claude_client


class BaseModule(ABC):
    def __init__(self, prompt_file: str):
        prompt_path = Path(__file__).parent / "prompts" / prompt_file
        self.system_prompt = prompt_path.read_text()

    @abstractmethod
    async def process(self, user_message: str, **kwargs) -> dict:
        pass

    async def call_claude_json(self, user_message: str) -> dict:
        return await claude_client.complete_json(
            system_prompt=self.system_prompt,
            user_message=user_message,
        )

    async def call_claude(self, user_message: str) -> str:
        return await claude_client.complete(
            system_prompt=self.system_prompt,
            user_message=user_message,
        )
