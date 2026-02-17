from fastapi import APIRouter
from app.models.schemas import ConfigUpdate, ConfigResponse
from app.config import settings

router = APIRouter()


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    return ConfigResponse(
        weight_manas=settings.weight_manas,
        weight_buddhi=settings.weight_buddhi,
        weight_sanskaras=settings.weight_sanskaras,
        claude_model=settings.claude_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )


@router.put("/config", response_model=ConfigResponse)
async def update_config(data: ConfigUpdate):
    if data.weight_manas is not None:
        settings.weight_manas = data.weight_manas
    if data.weight_buddhi is not None:
        settings.weight_buddhi = data.weight_buddhi
    if data.weight_sanskaras is not None:
        settings.weight_sanskaras = data.weight_sanskaras
    if data.claude_model is not None:
        settings.claude_model = data.claude_model
    if data.temperature is not None:
        settings.temperature = data.temperature
    if data.max_tokens is not None:
        settings.max_tokens = data.max_tokens

    return ConfigResponse(
        weight_manas=settings.weight_manas,
        weight_buddhi=settings.weight_buddhi,
        weight_sanskaras=settings.weight_sanskaras,
        claude_model=settings.claude_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )
