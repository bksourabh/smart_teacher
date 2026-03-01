from pydantic import BaseModel, Field
from typing import Optional


# --- Request Models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    category: str = Field(..., min_length=1, max_length=50)
    keywords: str = ""
    base_weight: float = Field(default=1.0, ge=0.0)
    valence: float = Field(default=0.0, ge=-1.0, le=1.0)


class ConfigUpdate(BaseModel):
    weight_manas: Optional[float] = Field(None, ge=0.0, le=1.0)
    weight_buddhi: Optional[float] = Field(None, ge=0.0, le=1.0)
    weight_sanskaras: Optional[float] = Field(None, ge=0.0, le=1.0)
    claude_model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=100, le=4096)
    faculty_model: Optional[str] = None
    synthesis_model: Optional[str] = None
    faculty_max_tokens: Optional[int] = Field(None, ge=100, le=2048)
    synthesis_max_tokens: Optional[int] = Field(None, ge=100, le=2048)
    combined_mode: Optional[bool] = None
    learning_mode_enabled: Optional[bool] = None
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)


class TrainerGuidanceRequest(BaseModel):
    guidance: str = Field(..., min_length=1)
    application_note: str = Field(..., min_length=1)
    modules_informed: str = Field(default="all")
    confidence_boost: float = Field(default=0.5, ge=0.0, le=1.0)


class TrainerLearningCreate(BaseModel):
    trigger_summary: str = Field(..., min_length=1)
    question_context: str = ""
    keywords: str = Field(..., min_length=1)
    guidance: str = Field(..., min_length=1)
    application_note: str = Field(..., min_length=1)
    modules_informed: str = Field(default="all")
    confidence_boost: float = Field(default=0.5, ge=0.0, le=1.0)


class TrainerLearningUpdate(BaseModel):
    guidance: Optional[str] = None
    application_note: Optional[str] = None
    modules_informed: Optional[str] = None
    confidence_boost: Optional[float] = Field(None, ge=0.0, le=1.0)
    keywords: Optional[str] = None


# --- Response Models ---

class ModuleOutput(BaseModel):
    module: str
    response: str
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: dict = {}


class ManaOutput(ModuleOutput):
    module: str = "manas"
    valence: float = Field(default=0.0, ge=-1.0, le=1.0)


class BuddhiOutput(ModuleOutput):
    module: str = "buddhi"
    reasoning_chain: list[str] = []


class SanskaraOutput(ModuleOutput):
    module: str = "sanskaras"
    activated_habits: list[dict] = []


class SynthesisOutput(BaseModel):
    response: str
    weights: dict[str, float]


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: int = 0
    cache_creation_input_tokens: int = 0
    total_tokens: int = 0


class TrainerConsultationNeeded(BaseModel):
    learning_id: int
    trigger_summary: str
    question_context: str


class ChatResponse(BaseModel):
    manas: ManaOutput
    buddhi: BuddhiOutput
    sanskaras: SanskaraOutput
    synthesis: SynthesisOutput
    elapsed_ms: int
    mode: str = "autonomous"
    trainer_needed: Optional[TrainerConsultationNeeded] = None
    token_usage: Optional[TokenUsage] = None


class HabitResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    keywords: str
    base_weight: float
    repetition_count: int
    effective_weight: float
    valence: float


class LearningResponse(BaseModel):
    id: int
    trigger_summary: str
    question_context: str
    guidance: str
    application_note: str
    modules_informed: str
    keywords: str
    confidence_boost: float
    times_applied: int
    status: str


class ConfigResponse(BaseModel):
    weight_manas: float
    weight_buddhi: float
    weight_sanskaras: float
    claude_model: str
    temperature: float
    max_tokens: int
    faculty_model: str
    synthesis_model: str
    faculty_max_tokens: int
    synthesis_max_tokens: int
    combined_mode: bool
    learning_mode_enabled: bool
    confidence_threshold: float


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
