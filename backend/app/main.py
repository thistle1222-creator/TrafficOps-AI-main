from __future__ import annotations

import asyncio
import json
import random
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.api.routers import activity, advisory, agent, auth, events, forecast, settings, state, system_health
from app.core.config import get_settings
from app.services.store import store
from app.api.routers import ml
from app.api.routers.ml import init_service_from_settings


async def auto_inject_loop() -> None:
    cfg = get_settings()
    while cfg.auto_inject_events:
        await asyncio.sleep(random.randint(25, 45))
        store.inject_event("auto")


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(auto_inject_loop())
    # initialize ML service if available
    try:
        app.state.ml_service = init_service_from_settings()
        # attach to router module-level variable so endpoints can access it
        ml.service = app.state.ml_service
    except Exception:
        # initialization failures are already logged inside the service
        app.state.ml_service = None
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


cfg = get_settings()
app = FastAPI(title=cfg.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=cfg.api_prefix)
app.include_router(state.router, prefix=cfg.api_prefix)
app.include_router(events.router, prefix=cfg.api_prefix)
app.include_router(agent.router, prefix=cfg.api_prefix)
app.include_router(settings.router, prefix=cfg.api_prefix)
app.include_router(system_health.router, prefix=cfg.api_prefix)
app.include_router(forecast.router, prefix=cfg.api_prefix)
app.include_router(advisory.router, prefix=cfg.api_prefix)
app.include_router(activity.router, prefix=cfg.api_prefix)
app.include_router(ml.router, prefix=cfg.api_prefix)


@app.get("/")
def root() -> dict:
    return {"service": cfg.app_name, "status": "online", "docs": "/docs"}


@app.get("/api/stream")
async def stream():
    async def event_source():
        last_seen = None
        while True:
            snapshot = store.snapshot()
            current = snapshot.events[0].id if snapshot.events else None
            if current != last_seen:
                last_seen = current
                yield f"data: {json.dumps(snapshot.model_dump(mode='json'))}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(event_source(), media_type="text/event-stream")
