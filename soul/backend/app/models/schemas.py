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


class ChatResponse(BaseModel):
    manas: ManaOutput
    buddhi: BuddhiOutput
    sanskaras: SanskaraOutput
    synthesis: SynthesisOutput
    elapsed_ms: int


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


class ConfigResponse(BaseModel):
    weight_manas: float
    weight_buddhi: float
    weight_sanskaras: float
    claude_model: str
    temperature: float
    max_tokens: int


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
