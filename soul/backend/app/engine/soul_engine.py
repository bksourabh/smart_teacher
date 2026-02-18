import asyncio
import time

from app.engine.manas import ManasModule
from app.engine.buddhi import BuddhiModule
from app.engine.sanskaras import SanskarasModule
from app.engine.synthesizer import Synthesizer
from app.models.schemas import ChatResponse, SynthesisOutput, TrainerConsultationNeeded
from app.config import settings
from app.services.claude_client import claude_client
from app.services.learning_service import learning_service


class SoulEngine:
    def __init__(self):
        self.manas = ManasModule()
        self.buddhi = BuddhiModule()
        self.sanskaras = SanskarasModule()
        self.synthesizer = Synthesizer()

    async def process(self, message: str) -> ChatResponse:
        start = time.time()

        # Run all three modules in parallel
        manas_out, buddhi_out, sanskaras_out = await asyncio.gather(
            self.manas.process(message),
            self.buddhi.process(message),
            self.sanskaras.process(message),
        )

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
            trainer_needed = await self._create_trainer_consultation(
                message, manas_out, buddhi_out, sanskaras_out
            )
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
            )

        # Normal path: synthesize
        synthesis_out = await self.synthesizer.process(
            user_message=message,
            manas=manas_out,
            buddhi=buddhi_out,
            sanskaras=sanskaras_out,
        )

        elapsed_ms = int((time.time() - start) * 1000)

        return ChatResponse(
            manas=manas_out,
            buddhi=buddhi_out,
            sanskaras=sanskaras_out,
            synthesis=synthesis_out,
            elapsed_ms=elapsed_ms,
            mode="autonomous",
        )

    async def _create_trainer_consultation(
        self, message, manas_out, buddhi_out, sanskaras_out
    ) -> TrainerConsultationNeeded:
        """Formulate a question for the trainer and create a pending learning."""
        # Use a lightweight Claude call to formulate the question
        try:
            question_data = await claude_client.complete_json(
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
        )


soul_engine = SoulEngine()
