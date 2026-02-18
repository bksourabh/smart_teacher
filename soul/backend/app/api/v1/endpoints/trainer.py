from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    LearningResponse,
    TrainerGuidanceRequest,
    TrainerLearningCreate,
    TrainerLearningUpdate,
)
from app.services.learning_service import learning_service

router = APIRouter(prefix="/trainer")


def _to_response(learning) -> LearningResponse:
    return LearningResponse(
        id=learning.id,
        trigger_summary=learning.trigger_summary,
        question_context=learning.question_context,
        guidance=learning.guidance,
        application_note=learning.application_note,
        modules_informed=learning.modules_informed,
        keywords=learning.keywords,
        confidence_boost=learning.confidence_boost,
        times_applied=learning.times_applied,
        status=learning.status,
    )


@router.get("/pending", response_model=list[LearningResponse])
async def list_pending():
    """List all questions awaiting trainer guidance."""
    learnings = await learning_service.get_pending()
    return [_to_response(l) for l in learnings]


@router.get("/learnings", response_model=list[LearningResponse])
async def list_active_learnings():
    """List all active learnings."""
    learnings = await learning_service.get_all_active()
    return [_to_response(l) for l in learnings]


@router.post("/respond/{learning_id}", response_model=LearningResponse)
async def respond_to_pending(learning_id: int, data: TrainerGuidanceRequest):
    """Provide guidance for a pending learning."""
    learning = await learning_service.get_by_id(learning_id)
    if learning is None:
        raise HTTPException(status_code=404, detail="Learning not found")
    if learning.status != "pending":
        raise HTTPException(status_code=400, detail=f"Learning is not pending (status: {learning.status})")

    updated = await learning_service.activate_learning(
        learning_id=learning_id,
        guidance=data.guidance,
        application_note=data.application_note,
        modules_informed=data.modules_informed,
        confidence_boost=data.confidence_boost,
    )
    return _to_response(updated)


@router.post("/learnings", response_model=LearningResponse, status_code=201)
async def create_learning(data: TrainerLearningCreate):
    """Proactively teach the soul something."""
    learning = await learning_service.create_active(
        trigger_summary=data.trigger_summary,
        question_context=data.question_context,
        keywords=data.keywords,
        guidance=data.guidance,
        application_note=data.application_note,
        modules_informed=data.modules_informed,
        confidence_boost=data.confidence_boost,
    )
    return _to_response(learning)


@router.put("/learnings/{learning_id}", response_model=LearningResponse)
async def update_learning(learning_id: int, data: TrainerLearningUpdate):
    """Update an existing learning."""
    learning = await learning_service.get_by_id(learning_id)
    if learning is None:
        raise HTTPException(status_code=404, detail="Learning not found")

    updates = data.model_dump(exclude_none=True)
    if not updates:
        return _to_response(learning)

    updated = await learning_service.update_learning(learning_id, **updates)
    return _to_response(updated)


@router.delete("/learnings/{learning_id}", response_model=LearningResponse)
async def supersede_learning(learning_id: int):
    """Supersede (soft-delete) a learning."""
    learning = await learning_service.supersede(learning_id)
    if learning is None:
        raise HTTPException(status_code=404, detail="Learning not found")
    return _to_response(learning)
