from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.engine.soul_engine import soul_engine

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    return await soul_engine.process(request.message)
