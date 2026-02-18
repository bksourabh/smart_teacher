from abc import ABC, abstractmethod
from pathlib import Path

from app.services.claude_client import claude_client
from app.services.learning_service import learning_service


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

    async def build_learnings_context(self, message: str, module_name: str) -> str:
        """Retrieve relevant active learnings and format as prompt context."""
        learnings = await learning_service.find_relevant_learnings(message, modules=module_name)
        if not learnings:
            return ""

        lines = []
        for l in learnings:
            lines.append(f"- [{l.trigger_summary}]: {l.application_note}")
            await learning_service.increment_applied(l.id)

        return "\n\nGuidance from trainer (apply these learnings):\n" + "\n".join(lines)
