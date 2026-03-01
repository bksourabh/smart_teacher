from app.engine.base_module import BaseModule
from app.models.schemas import BuddhiOutput
from app.services.claude_client import TokenUsageData


class BuddhiModule(BaseModule):
    def __init__(self):
        super().__init__("buddhi.txt")

    async def process(self, user_message: str, **kwargs) -> tuple[BuddhiOutput, TokenUsageData]:
        try:
            learnings_ctx = await self.build_learnings_context(user_message, "buddhi")
            augmented = user_message + learnings_ctx
            data, usage = await self.call_claude_json(augmented)
            return BuddhiOutput(
                response=data.get("response", ""),
                confidence=max(0.0, min(1.0, data.get("confidence", 0.5))),
                reasoning_chain=data.get("reasoning_chain", []),
            ), usage
        except Exception as e:
            return BuddhiOutput(
                response=f"Buddhi encountered confusion: {e}",
                confidence=0.1,
                reasoning_chain=[],
            ), TokenUsageData()
