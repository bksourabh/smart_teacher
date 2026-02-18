from sqlalchemy import select
from app.models.database import async_session
from app.models.learning_model import Learning


class LearningService:
    async def find_relevant_learnings(
        self, message: str, modules: str | None = None, limit: int = 5
    ) -> list[Learning]:
        """Find active learnings whose keywords match words in the message."""
        words = set(message.lower().split())

        async with async_session() as session:
            query = select(Learning).where(Learning.status == "active")
            result = await session.execute(query)
            all_learnings = result.scalars().all()

        scored = []
        for learning in all_learnings:
            # Filter by module if specified
            if modules and learning.modules_informed != "all":
                informed = set(m.strip() for m in learning.modules_informed.split(","))
                if modules not in informed:
                    continue

            keywords = set(k.strip().lower() for k in learning.keywords.split(",") if k.strip())
            overlap = len(words & keywords)
            if overlap > 0:
                scored.append((overlap * learning.confidence_boost, learning))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [l for _, l in scored[:limit]]

    async def create_pending(
        self, question_context: str, trigger_summary: str, keywords: str
    ) -> Learning:
        learning = Learning(
            question_context=question_context,
            trigger_summary=trigger_summary,
            keywords=keywords,
            status="pending",
        )
        async with async_session() as session:
            session.add(learning)
            await session.commit()
            await session.refresh(learning)
        return learning

    async def activate_learning(
        self,
        learning_id: int,
        guidance: str,
        application_note: str,
        modules_informed: str = "all",
        confidence_boost: float = 0.5,
    ) -> Learning | None:
        async with async_session() as session:
            learning = await session.get(Learning, learning_id)
            if learning is None:
                return None
            learning.guidance = guidance
            learning.application_note = application_note
            learning.modules_informed = modules_informed
            learning.confidence_boost = confidence_boost
            learning.status = "active"
            await session.commit()
            await session.refresh(learning)
        return learning

    async def get_pending(self) -> list[Learning]:
        async with async_session() as session:
            result = await session.execute(
                select(Learning).where(Learning.status == "pending")
            )
            return list(result.scalars().all())

    async def get_all_active(self) -> list[Learning]:
        async with async_session() as session:
            result = await session.execute(
                select(Learning).where(Learning.status == "active")
            )
            return list(result.scalars().all())

    async def get_by_id(self, learning_id: int) -> Learning | None:
        async with async_session() as session:
            return await session.get(Learning, learning_id)

    async def increment_applied(self, learning_id: int) -> None:
        async with async_session() as session:
            learning = await session.get(Learning, learning_id)
            if learning:
                learning.times_applied += 1
                await session.commit()

    async def supersede(self, learning_id: int) -> Learning | None:
        async with async_session() as session:
            learning = await session.get(Learning, learning_id)
            if learning is None:
                return None
            learning.status = "superseded"
            await session.commit()
            await session.refresh(learning)
        return learning

    async def update_learning(
        self, learning_id: int, **kwargs
    ) -> Learning | None:
        async with async_session() as session:
            learning = await session.get(Learning, learning_id)
            if learning is None:
                return None
            for key, value in kwargs.items():
                if hasattr(learning, key):
                    setattr(learning, key, value)
            await session.commit()
            await session.refresh(learning)
        return learning

    async def create_active(
        self,
        question_context: str,
        trigger_summary: str,
        keywords: str,
        guidance: str,
        application_note: str,
        modules_informed: str = "all",
        confidence_boost: float = 0.5,
    ) -> Learning:
        """Directly create an active learning (proactive teaching)."""
        learning = Learning(
            question_context=question_context,
            trigger_summary=trigger_summary,
            keywords=keywords,
            guidance=guidance,
            application_note=application_note,
            modules_informed=modules_informed,
            confidence_boost=confidence_boost,
            status="active",
        )
        async with async_session() as session:
            session.add(learning)
            await session.commit()
            await session.refresh(learning)
        return learning


learning_service = LearningService()
