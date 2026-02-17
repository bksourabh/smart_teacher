from app.engine.base_module import BaseModule
from app.models.schemas import BuddhiOutput


class BuddhiModule(BaseModule):
    def __init__(self):
        super().__init__("buddhi.txt")

    async def process(self, user_message: str, **kwargs) -> BuddhiOutput:
        try:
            data = await self.call_claude_json(user_message)
            return BuddhiOutput(
                response=data.get("response", ""),
                confidence=max(0.0, min(1.0, data.get("confidence", 0.5))),
                reasoning_chain=data.get("reasoning_chain", []),
            )
        except Exception as e:
            return BuddhiOutput(
                response=f"Buddhi encountered confusion: {e}",
                confidence=0.1,
                reasoning_chain=[],
            )
