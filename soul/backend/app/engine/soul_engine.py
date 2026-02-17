import asyncio
import time

from app.engine.manas import ManasModule
from app.engine.buddhi import BuddhiModule
from app.engine.sanskaras import SanskarasModule
from app.engine.synthesizer import Synthesizer
from app.models.schemas import ChatResponse


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

        # Synthesize
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
        )


soul_engine = SoulEngine()
