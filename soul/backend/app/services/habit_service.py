from sqlalchemy import select
from app.models.database import async_session
from app.models.habit_model import Habit


class HabitService:
    async def find_relevant_habits(self, message: str, limit: int = 5) -> list[Habit]:
        """Find habits whose keywords match words in the message."""
        words = set(message.lower().split())

        async with async_session() as session:
            result = await session.execute(select(Habit))
            all_habits = result.scalars().all()

        # Score each habit by keyword overlap
        scored = []
        for habit in all_habits:
            keywords = set(k.strip().lower() for k in habit.keywords.split(",") if k.strip())
            overlap = len(words & keywords)
            if overlap > 0:
                scored.append((habit.effective_weight * overlap, habit))

        # Sort by score descending, return top N
        scored.sort(key=lambda x: x[0], reverse=True)
        return [h for _, h in scored[:limit]]

    async def get_all(self, category: str | None = None, min_weight: float = 0.0) -> list[Habit]:
        async with async_session() as session:
            query = select(Habit)
            if category:
                query = query.where(Habit.category == category)
            result = await session.execute(query)
            habits = result.scalars().all()
        return [h for h in habits if h.effective_weight >= min_weight]

    async def create(self, **kwargs) -> Habit:
        habit = Habit(**kwargs)
        async with async_session() as session:
            session.add(habit)
            await session.commit()
            await session.refresh(habit)
        return habit

    async def reinforce(self, habit_id: int) -> Habit | None:
        async with async_session() as session:
            habit = await session.get(Habit, habit_id)
            if habit is None:
                return None
            habit.repetition_count += 1
            await session.commit()
            await session.refresh(habit)
        return habit

    async def count(self) -> int:
        async with async_session() as session:
            result = await session.execute(select(Habit))
            return len(result.scalars().all())


habit_service = HabitService()
