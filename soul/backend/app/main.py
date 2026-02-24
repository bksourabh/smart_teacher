from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.models.database import init_db
import app.models.learning_model  # noqa: F401 — register table before init_db
from app.api.v1.router import api_router
from app.seed.seed_data import seed_habits_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_habits_if_empty()
    yield


app = FastAPI(
    title="Soul AI",
    description="AI assistant modeled on Hindu spiritual philosophy",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Serve the web UI static files if the build exists
_web_dist = Path(__file__).parent.parent.parent.parent / "frontend" / "web" / "dist"
if _web_dist.exists():
    app.mount("/", StaticFiles(directory=str(_web_dist), html=True), name="web-ui")
