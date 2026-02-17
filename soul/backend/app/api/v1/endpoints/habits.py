from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import HabitCreate, HabitResponse
from app.services.habit_service import habit_service
from app.seed.seed_data import seed_habits_if_empty

router = APIRouter()


def habit_to_response(habit) -> HabitResponse:
    return HabitResponse(
        id=habit.id,
        name=habit.name,
        description=habit.description,
        category=habit.category,
        keywords=habit.keywords,
        base_weight=habit.base_weight,
        repetition_count=habit.repetition_count,
        effective_weight=habit.effective_weight,
        valence=habit.valence,
    )


@router.get("/habits", response_model=list[HabitResponse])
async def list_habits(
    category: str | None = Query(None),
    min_weight: float = Query(0.0, ge=0.0),
):
    habits = await habit_service.get_all(category=category, min_weight=min_weight)
    return [habit_to_response(h) for h in habits]


@router.post("/habits", response_model=HabitResponse, status_code=201)
async def create_habit(data: HabitCreate):
    habit = await habit_service.create(**data.model_dump())
    return habit_to_response(habit)


@router.post("/habits/seed", response_model=dict)
async def seed_habits():
    await seed_habits_if_empty(force=True)
    count = await habit_service.count()
    return {"message": "Habits seeded", "count": count}


@router.put("/habits/{habit_id}/reinforce", response_model=HabitResponse)
async def reinforce_habit(habit_id: int):
    habit = await habit_service.reinforce(habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit_to_response(habit)
