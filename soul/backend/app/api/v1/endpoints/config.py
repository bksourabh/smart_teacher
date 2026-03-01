from fastapi import APIRouter
from app.models.schemas import ConfigUpdate, ConfigResponse
from app.config import settings

router = APIRouter()


def _build_config_response() -> ConfigResponse:
    return ConfigResponse(
        weight_manas=settings.weight_manas,
        weight_buddhi=settings.weight_buddhi,
        weight_sanskaras=settings.weight_sanskaras,
        claude_model=settings.claude_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
        faculty_model=settings.faculty_model,
        synthesis_model=settings.synthesis_model,
        faculty_max_tokens=settings.faculty_max_tokens,
        synthesis_max_tokens=settings.synthesis_max_tokens,
        combined_mode=settings.combined_mode,
        learning_mode_enabled=settings.learning_mode_enabled,
        confidence_threshold=settings.confidence_threshold,
    )


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    return _build_config_response()


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
    if data.faculty_model is not None:
        settings.faculty_model = data.faculty_model
    if data.synthesis_model is not None:
        settings.synthesis_model = data.synthesis_model
    if data.faculty_max_tokens is not None:
        settings.faculty_max_tokens = data.faculty_max_tokens
    if data.synthesis_max_tokens is not None:
        settings.synthesis_max_tokens = data.synthesis_max_tokens
    if data.combined_mode is not None:
        settings.combined_mode = data.combined_mode
    if data.learning_mode_enabled is not None:
        settings.learning_mode_enabled = data.learning_mode_enabled
    if data.confidence_threshold is not None:
        settings.confidence_threshold = data.confidence_threshold

    return _build_config_response()
