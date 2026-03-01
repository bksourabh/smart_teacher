"""
Streaming version of SoulEngine that yields module results as they complete.
Inspired by opensoulai's streaming architecture for progressive UI updates.
"""
import asyncio
import json
import time
from pathlib import Path
from typing import AsyncGenerator

from app.engine.manas import ManasModule
from app.engine.buddhi import BuddhiModule
from app.engine.sanskaras import SanskarasModule
from app.engine.synthesizer import Synthesizer
from app.models.schemas import ManaOutput, BuddhiOutput, SanskaraOutput, SynthesisOutput, TrainerConsultationNeeded
from app.config import settings
from app.services.claude_client import claude_client, TokenUsageData
from app.services.learning_service import learning_service


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event message."""
    payload = json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


def _usage_dict(usage: TokenUsageData) -> dict:
    """Convert TokenUsageData to a dict for SSE payloads."""
    return {
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_read_input_tokens": usage.cache_read_input_tokens,
        "cache_creation_input_tokens": usage.cache_creation_input_tokens,
        "total_tokens": usage.input_tokens + usage.output_tokens,
    }


class StreamingSoulEngine:
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

    async def stream(self, message: str) -> AsyncGenerator[str, None]:
        """
        Stream soul responses as SSE events.

        Yields events in order:
          - event: start        — processing begun
          - event: manas        — Manas module output (as it completes)
          - event: buddhi       — Buddhi module output (as it completes)
          - event: sanskaras    — Sanskaras module output (as it completes)
          - event: confidence   — weighted confidence computed
          - event: synthesis    — Atman synthesis (final)
          - event: done         — stream complete (includes token_usage)
          - event: needs_trainer — if trainer consultation triggered
          - event: error        — on error
        """
        start = time.time()
        total_usage = TokenUsageData()

        yield _sse_event("start", {"message": message, "timestamp": start})

        if settings.combined_mode:
            # Combined mode: single call for all 3 faculties
            async for event in self._stream_combined(message, start, total_usage):
                yield event
            return

        # Standard mode: stream each faculty as it completes
        queue: asyncio.Queue = asyncio.Queue()

        async def run_module(name: str, coro):
            try:
                result, usage = await coro
                await queue.put((name, result, usage, None))
            except Exception as e:
                await queue.put((name, None, TokenUsageData(), str(e)))

        # Launch all three modules concurrently
        tasks = [
            asyncio.create_task(run_module("manas", self.manas.process(message))),
            asyncio.create_task(run_module("buddhi", self.buddhi.process(message))),
            asyncio.create_task(run_module("sanskaras", self.sanskaras.process(message))),
        ]

        # Collect results as they arrive (streaming)
        results = {}
        for _ in range(3):
            name, result, usage, error = await queue.get()
            if error:
                yield _sse_event("error", {"module": name, "error": error})
                for t in tasks:
                    t.cancel()
                return

            results[name] = result
            total_usage = total_usage + usage

            # Emit each module result as it completes
            if name == "manas":
                yield _sse_event("manas", {
                    "response": result.response,
                    "confidence": result.confidence,
                    "valence": result.valence,
                    "module": "manas",
                })
            elif name == "buddhi":
                yield _sse_event("buddhi", {
                    "response": result.response,
                    "confidence": result.confidence,
                    "reasoning_chain": result.reasoning_chain,
                    "module": "buddhi",
                })
            elif name == "sanskaras":
                yield _sse_event("sanskaras", {
                    "response": result.response,
                    "confidence": result.confidence,
                    "activated_habits": result.activated_habits,
                    "module": "sanskaras",
                })

        manas_out = results["manas"]
        buddhi_out = results["buddhi"]
        sanskaras_out = results["sanskaras"]

        # Compute weighted confidence
        weighted_confidence = (
            settings.weight_manas * manas_out.confidence
            + settings.weight_buddhi * buddhi_out.confidence
            + settings.weight_sanskaras * sanskaras_out.confidence
        )

        yield _sse_event("confidence", {
            "weighted": weighted_confidence,
            "threshold": settings.confidence_threshold,
            "learning_mode": settings.learning_mode_enabled,
        })

        # Check if trainer consultation needed
        if (
            settings.learning_mode_enabled
            and weighted_confidence < settings.confidence_threshold
        ):
            try:
                trainer_needed, trainer_usage = await self._create_trainer_consultation(
                    message, manas_out, buddhi_out, sanskaras_out
                )
                total_usage = total_usage + trainer_usage
                elapsed_ms = int((time.time() - start) * 1000)
                yield _sse_event("needs_trainer", {
                    "learning_id": trainer_needed.learning_id,
                    "trigger_summary": trainer_needed.trigger_summary,
                    "question_context": trainer_needed.question_context,
                    "elapsed_ms": elapsed_ms,
                })
            except Exception as e:
                yield _sse_event("error", {"error": str(e)})

            yield _sse_event("done", {
                "elapsed_ms": int((time.time() - start) * 1000),
                "token_usage": _usage_dict(total_usage),
            })
            return

        # Synthesize (Atman integrates all three)
        try:
            synthesis_out, synthesis_usage = await self.synthesizer.process(
                user_message=message,
                manas=manas_out,
                buddhi=buddhi_out,
                sanskaras=sanskaras_out,
            )
            total_usage = total_usage + synthesis_usage
        except Exception as e:
            yield _sse_event("error", {"error": str(e)})
            return

        elapsed_ms = int((time.time() - start) * 1000)

        yield _sse_event("synthesis", {
            "response": synthesis_out.response,
            "weights": synthesis_out.weights,
            "mode": "autonomous",
            "elapsed_ms": elapsed_ms,
        })

        yield _sse_event("done", {
            "elapsed_ms": elapsed_ms,
            "token_usage": _usage_dict(total_usage),
        })

    async def _stream_combined(
        self, message: str, start: float, total_usage: TokenUsageData
    ) -> AsyncGenerator[str, None]:
        """Combined mode: single call for all 3 faculties, then synthesis."""
        try:
            data, usage = await claude_client.complete_json(
                system_prompt=self.combined_prompt,
                user_message=message,
                model=settings.faculty_model,
                max_tokens=800,
            )
            total_usage = total_usage + usage
        except Exception as e:
            yield _sse_event("error", {"error": str(e)})
            return

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

        # Emit all three at once
        yield _sse_event("manas", {
            "response": manas_out.response,
            "confidence": manas_out.confidence,
            "valence": manas_out.valence,
            "module": "manas",
        })
        yield _sse_event("buddhi", {
            "response": buddhi_out.response,
            "confidence": buddhi_out.confidence,
            "reasoning_chain": buddhi_out.reasoning_chain,
            "module": "buddhi",
        })
        yield _sse_event("sanskaras", {
            "response": sanskaras_out.response,
            "confidence": sanskaras_out.confidence,
            "activated_habits": sanskaras_out.activated_habits,
            "module": "sanskaras",
        })

        # Compute weighted confidence
        weighted_confidence = (
            settings.weight_manas * manas_out.confidence
            + settings.weight_buddhi * buddhi_out.confidence
            + settings.weight_sanskaras * sanskaras_out.confidence
        )

        yield _sse_event("confidence", {
            "weighted": weighted_confidence,
            "threshold": settings.confidence_threshold,
            "learning_mode": settings.learning_mode_enabled,
        })

        # Check trainer
        if (
            settings.learning_mode_enabled
            and weighted_confidence < settings.confidence_threshold
        ):
            try:
                trainer_needed, trainer_usage = await self._create_trainer_consultation(
                    message, manas_out, buddhi_out, sanskaras_out
                )
                total_usage = total_usage + trainer_usage
                elapsed_ms = int((time.time() - start) * 1000)
                yield _sse_event("needs_trainer", {
                    "learning_id": trainer_needed.learning_id,
                    "trigger_summary": trainer_needed.trigger_summary,
                    "question_context": trainer_needed.question_context,
                    "elapsed_ms": elapsed_ms,
                })
            except Exception as e:
                yield _sse_event("error", {"error": str(e)})

            yield _sse_event("done", {
                "elapsed_ms": int((time.time() - start) * 1000),
                "token_usage": _usage_dict(total_usage),
            })
            return

        # Synthesize
        try:
            synthesis_out, synthesis_usage = await self.synthesizer.process(
                user_message=message,
                manas=manas_out,
                buddhi=buddhi_out,
                sanskaras=sanskaras_out,
            )
            total_usage = total_usage + synthesis_usage
        except Exception as e:
            yield _sse_event("error", {"error": str(e)})
            return

        elapsed_ms = int((time.time() - start) * 1000)

        yield _sse_event("synthesis", {
            "response": synthesis_out.response,
            "weights": synthesis_out.weights,
            "mode": "autonomous",
            "elapsed_ms": elapsed_ms,
        })

        yield _sse_event("done", {
            "elapsed_ms": elapsed_ms,
            "token_usage": _usage_dict(total_usage),
        })

    async def _create_trainer_consultation(
        self, message, manas_out, buddhi_out, sanskaras_out
    ) -> tuple[TrainerConsultationNeeded, TokenUsageData]:
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


streaming_soul_engine = StreamingSoulEngine()
