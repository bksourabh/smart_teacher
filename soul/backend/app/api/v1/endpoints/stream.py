"""
Server-Sent Events streaming endpoint for Soul AI.
Inspired by opensoulai's streaming architecture — streams module results
progressively so the UI can render each faculty as it completes.
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.engine.streaming_engine import streaming_soul_engine

router = APIRouter()


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream soul responses as Server-Sent Events.

    Events emitted:
      start       — processing started
      manas       — Manas (Mind) output ready
      buddhi      — Buddhi (Intellect) output ready
      sanskaras   — Sanskaras (Habits) output ready
      confidence  — weighted confidence computed
      synthesis   — Atman synthesis complete (final response)
      needs_trainer — trainer consultation needed (learning mode)
      done        — stream complete
      error       — on processing error
    """
    return StreamingResponse(
        streaming_soul_engine.stream(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
