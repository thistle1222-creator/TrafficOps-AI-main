from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "TrafficOps AI Backend"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"
    ml_model_path: str | None = None
    auto_inject_events: bool = True


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS")
    return Settings(
        cors_origins=[x.strip() for x in origins.split(",")] if origins else Settings().cors_origins,
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        ml_model_path=os.getenv("ML_MODEL_PATH"),
        auto_inject_events=os.getenv("AUTO_INJECT_EVENTS", "true").lower() == "true",
    )
