import asyncio
import time
from pathlib import Path

from app.engine.manas import ManasModule
from app.engine.buddhi import BuddhiModule
from app.engine.sanskaras import SanskarasModule
from app.engine.synthesizer import Synthesizer
from app.models.schemas import (
    ChatResponse, ManaOutput, BuddhiOutput, SanskaraOutput,
    SynthesisOutput, TokenUsage, TrainerConsultationNeeded,
)
from app.config import settings
from app.services.claude_client import claude_client, TokenUsageData
from app.services.learning_service import learning_service


def _to_token_usage(data: TokenUsageData) -> TokenUsage:
    """Convert internal TokenUsageData to API schema."""
    return TokenUsage(
        input_tokens=data.input_tokens,
        output_tokens=data.output_tokens,
        cache_read_input_tokens=data.cache_read_input_tokens,
        cache_creation_input_tokens=data.cache_creation_input_tokens,
        total_tokens=data.input_tokens + data.output_tokens,
    )


class SoulEngine:
    def __init__(self):
        self.manas = ManasModule()
        self.buddhi = BuddhiModule()
        self.sanskaras = SanskarasModule()
        self.synthesizer = Synthesizer()
        self._combined_prompt: str | None = None

    @property
    def combined_prompt(self) -> str:
        if self._combined_prompt is None:
            path = Path(__file__).parent / "prompts" / "combined.txt"
            self._combined_prompt = path.read_text()
        return self._combined_prompt

    async def process(self, message: str) -> ChatResponse:
        start = time.time()
        total_usage = TokenUsageData()

        if settings.combined_mode:
            manas_out, buddhi_out, sanskaras_out, usage = await self._process_combined(message)
            total_usage = total_usage + usage
        else:
            # Run all three modules in parallel
            results = await asyncio.gather(
                self.manas.process(message),
                self.buddhi.process(message),
                self.sanskaras.process(message),
            )
            manas_out, manas_usage = results[0]
            buddhi_out, buddhi_usage = results[1]
            sanskaras_out, sanskaras_usage = results[2]
            total_usage = total_usage + manas_usage + buddhi_usage + sanskaras_usage

        # Compute weighted aggregate confidence
        weighted_confidence = (
            settings.weight_manas * manas_out.confidence
            + settings.weight_buddhi * buddhi_out.confidence
            + settings.weight_sanskaras * sanskaras_out.confidence
        )

        # If learning mode is on and confidence is below threshold, ask for trainer
        if (
            settings.learning_mode_enabled
            and weighted_confidence < settings.confidence_threshold
        ):
            trainer_needed, trainer_usage = await self._create_trainer_consultation(
                message, manas_out, buddhi_out, sanskaras_out
            )
            total_usage = total_usage + trainer_usage
            elapsed_ms = int((time.time() - start) * 1000)

            return ChatResponse(
                manas=manas_out,
                buddhi=buddhi_out,
                sanskaras=sanskaras_out,
                synthesis=SynthesisOutput(
                    response="I'm not sure how to respond to this yet. I need guidance from my trainer.",
                    weights={
                        "manas": settings.weight_manas,
                        "buddhi": settings.weight_buddhi,
                        "sanskaras": settings.weight_sanskaras,
                    },
                ),
                elapsed_ms=elapsed_ms,
                mode="needs_trainer",
                trainer_needed=trainer_needed,
                token_usage=_to_token_usage(total_usage),
            )

        # Normal path: synthesize
        synthesis_out, synthesis_usage = await self.synthesizer.process(
            user_message=message,
            manas=manas_out,
            buddhi=buddhi_out,
            sanskaras=sanskaras_out,
        )
        total_usage = total_usage + synthesis_usage

        elapsed_ms = int((time.time() - start) * 1000)

        return ChatResponse(
            manas=manas_out,
            buddhi=buddhi_out,
            sanskaras=sanskaras_out,
            synthesis=synthesis_out,
            elapsed_ms=elapsed_ms,
            mode="autonomous",
            token_usage=_to_token_usage(total_usage),
        )

    async def _process_combined(self, message: str):
        """Single API call for all three faculties."""
        data, usage = await claude_client.complete_json(
            system_prompt=self.combined_prompt,
            user_message=message,
            model=settings.faculty_model,
            max_tokens=800,  # Combined output for all 3 faculties
        )

        manas_data = data.get("manas", {})
        buddhi_data = data.get("buddhi", {})
        sanskaras_data = data.get("sanskaras", {})

        manas_out = ManaOutput(
            response=manas_data.get("response", ""),
            confidence=max(0.0, min(1.0, manas_data.get("confidence", 0.5))),
            valence=max(-1.0, min(1.0, manas_data.get("valence", 0.0))),
        )
        buddhi_out = BuddhiOutput(
            response=buddhi_data.get("response", ""),
            confidence=max(0.0, min(1.0, buddhi_data.get("confidence", 0.5))),
            reasoning_chain=buddhi_data.get("reasoning_chain", []),
        )
        sanskaras_out = SanskaraOutput(
            response=sanskaras_data.get("response", ""),
            confidence=max(0.0, min(1.0, sanskaras_data.get("confidence", 0.5))),
            activated_habits=sanskaras_data.get("activated_habits", []),
        )

        return manas_out, buddhi_out, sanskaras_out, usage

    async def _create_trainer_consultation(
        self, message, manas_out, buddhi_out, sanskaras_out
    ) -> tuple[TrainerConsultationNeeded, TokenUsageData]:
        """Formulate a question for the trainer and create a pending learning."""
        usage = TokenUsageData()
        try:
            question_data, usage = await claude_client.complete_json(
                system_prompt=(
                    "You help a young soul formulate questions for its trainer. "
                    "Given a user message and the soul's uncertain module outputs, "
                    "create a concise question and extract keywords. "
                    "Respond in JSON: {\"trigger_summary\": \"...\", \"keywords\": \"comma,separated,words\"}"
                ),
                user_message=(
                    f"User said: \"{message}\"\n"
                    f"Manas felt: {manas_out.response}\n"
                    f"Buddhi thought: {buddhi_out.response}\n"
                    f"Sanskaras recalled: {sanskaras_out.response}\n"
                    f"The soul is uncertain. What should it ask the trainer?"
                ),
                max_tokens=256,
                temperature=0.3,
            )
            trigger_summary = question_data.get("trigger_summary", f"How should I respond to: {message}")
            keywords = question_data.get("keywords", ",".join(message.lower().split()[:5]))
        except Exception:
            trigger_summary = f"How should I respond to: {message}"
            keywords = ",".join(message.lower().split()[:5])

        learning = await learning_service.create_pending(
            question_context=message,
            trigger_summary=trigger_summary,
            keywords=keywords,
        )

        return TrainerConsultationNeeded(
            learning_id=learning.id,
            trigger_summary=trigger_summary,
            question_context=message,
        ), usage


soul_engine = SoulEngine()
