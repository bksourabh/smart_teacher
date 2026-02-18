from app.engine.base_module import BaseModule
from app.models.schemas import SanskaraOutput
from app.services.habit_service import habit_service


class SanskarasModule(BaseModule):
    def __init__(self):
        super().__init__("sanskaras.txt")

    async def process(self, user_message: str, **kwargs) -> SanskaraOutput:
        try:
            # Retrieve relevant habits
            habits = await habit_service.find_relevant_habits(user_message, limit=5)

            # Build context with activated habits
            habits_context = ""
            if habits:
                habit_lines = []
                for h in habits:
                    habit_lines.append(
                        f"- {h.name} (category: {h.category}, weight: {h.effective_weight:.1f}, "
                        f"valence: {h.valence:+.1f}): {h.description}"
                    )
                habits_context = (
                    "\n\nActivated habits from experience:\n" + "\n".join(habit_lines)
                )

            learnings_ctx = await self.build_learnings_context(user_message, "sanskaras")
            augmented_message = user_message + habits_context + learnings_ctx
            data = await self.call_claude_json(augmented_message)

            return SanskaraOutput(
                response=data.get("response", ""),
                confidence=max(0.0, min(1.0, data.get("confidence", 0.5))),
                activated_habits=data.get("activated_habits", []),
            )
        except Exception as e:
            return SanskaraOutput(
                response=f"Sanskaras encountered static: {e}",
                confidence=0.1,
                activated_habits=[],
            )
