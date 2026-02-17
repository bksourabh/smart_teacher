from fastapi import APIRouter

from app.api.v1.endpoints import health, chat, habits, config

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(habits.router, tags=["habits"])
api_router.include_router(config.router, tags=["config"])
