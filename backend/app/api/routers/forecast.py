from __future__ import annotations

import random

from fastapi import APIRouter

from app.models.schemas import ForecastPoint, ZoneForecast
from app.services.risk_engine import ZONES
from app.services.store import store

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/timeline", response_model=list[ForecastPoint])
def timeline(range_hours: int = 6) -> list[ForecastPoint]:
    active = store.snapshot().events
    base = max([event.score for event in active[:5]], default=45)
    labels = ["Now", "+2H", "+6H", "+12H", "+24H"]
    points = []
    for idx, label in enumerate(labels):
        if label == "+24H" and range_hours < 24:
            continue
        risk = max(10, min(100, base + random.randint(-8, 12) - idx * 3))
        points.append(ForecastPoint(label=label, risk=risk))
    return points


@router.get("/zones", response_model=list[ZoneForecast])
def zone_forecast() -> list[ZoneForecast]:
    rollup = store.zone_rollup()
    rows = []
    for item in rollup:
        current = item["risk"]
        predicted = max(5, min(100, current + random.randint(-12, 15)))
        trend = "up" if predicted > current + 4 else "down" if predicted < current - 4 else "stable"
        rows.append(
            ZoneForecast(
                zone=item["zone"],
                currentRisk=current,
                predictedRisk=predicted,
                trend=trend,
                recommendation="Pre-position officers" if predicted >= 66 else "Monitor",
            )
        )
    return rows


@router.get("/tomorrow")
def predicted_events_tomorrow() -> list[dict]:
    return [
        {"zone": "MG Road", "cause": "Public Gathering", "window": "18:00-21:00", "risk": 72},
        {"zone": "Silk Board", "cause": "Road Repair", "window": "08:00-10:30", "risk": 68},
        {"zone": "Whitefield", "cause": "VIP Movement", "window": "16:30-18:30", "risk": 77},
    ]
