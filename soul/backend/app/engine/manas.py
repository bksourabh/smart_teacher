from app.engine.base_module import BaseModule
from app.models.schemas import ManaOutput


class ManasModule(BaseModule):
    def __init__(self):
        super().__init__("manas.txt")

    async def process(self, user_message: str, **kwargs) -> ManaOutput:
        try:
            learnings_ctx = await self.build_learnings_context(user_message, "manas")
            augmented = user_message + learnings_ctx
            data = await self.call_claude_json(augmented)
            return ManaOutput(
                response=data.get("response", ""),
                confidence=max(0.0, min(1.0, data.get("confidence", 0.5))),
                valence=max(-1.0, min(1.0, data.get("valence", 0.0))),
            )
        except Exception as e:
            return ManaOutput(
                response=f"Manas encountered turbulence: {e}",
                confidence=0.1,
                valence=0.0,
            )
