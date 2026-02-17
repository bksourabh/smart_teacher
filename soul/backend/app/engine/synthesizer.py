from app.engine.base_module import BaseModule
from app.models.schemas import ManaOutput, BuddhiOutput, SanskaraOutput, SynthesisOutput
from app.config import settings


class Synthesizer(BaseModule):
    def __init__(self):
        super().__init__("synthesizer.txt")

    async def process(
        self,
        user_message: str,
        manas: ManaOutput,
        buddhi: BuddhiOutput,
        sanskaras: SanskaraOutput,
        **kwargs,
    ) -> SynthesisOutput:
        weights = {
            "manas": settings.weight_manas,
            "buddhi": settings.weight_buddhi,
            "sanskaras": settings.weight_sanskaras,
        }

        synthesis_prompt = f"""The user said: "{user_message}"

Here are the three faculty responses:

**Manas (Mind)** [weight: {weights['manas']:.0%}, confidence: {manas.confidence:.2f}, valence: {manas.valence:+.2f}]:
{manas.response}

**Buddhi (Intellect)** [weight: {weights['buddhi']:.0%}, confidence: {buddhi.confidence:.2f}]:
{buddhi.response}
Reasoning: {' → '.join(buddhi.reasoning_chain) if buddhi.reasoning_chain else 'N/A'}

**Sanskaras (Habits)** [weight: {weights['sanskaras']:.0%}, confidence: {sanskaras.confidence:.2f}]:
{sanskaras.response}
Activated habits: {', '.join(h.get('name', '') for h in sanskaras.activated_habits) if sanskaras.activated_habits else 'None'}

Synthesize these into a unified, wise response. Honor all three voices proportional to their weights."""

        try:
            response_text = await self.call_claude(synthesis_prompt)
            return SynthesisOutput(response=response_text, weights=weights)
        except Exception as e:
            return SynthesisOutput(
                response=f"The soul struggles to integrate: {e}",
                weights=weights,
            )
