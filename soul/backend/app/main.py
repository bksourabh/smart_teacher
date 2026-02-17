from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.database import init_db
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
