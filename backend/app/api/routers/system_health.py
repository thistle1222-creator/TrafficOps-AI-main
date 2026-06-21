from fastapi import APIRouter

from app.models.schemas import DiagnosticsResult
from app.services.store import store

router = APIRouter(prefix="/system-health", tags=["system-health"])


@router.get("")
def system_health() -> dict:
    degraded = store.degraded
    return {
        "model": {
            "version": "TrafficBERT v3.1",
            "lastTrainingDate": "2026-06-01",
            "uptime": 99.97 if not degraded else 98.41,
            "avgInferenceLatencyMs": 42 if not degraded else 68,
        },
        "sources": [
            {"name": "Traffic Signal Network", "status": "Connected", "detail": "142/150 signals reporting"},
            {"name": "Weather API", "status": "Connected" if not degraded else "Delayed", "detail": "Last sync: 90s ago - using cached data" if degraded else "Live"},
            {"name": "CCTV Feed Network", "status": "Partial", "detail": "142/150 cameras online"},
            {"name": "GPS Unit Tracking", "status": "Connected", "detail": "127 units active"},
            {"name": "Historical Database", "status": "Connected", "detail": "Read/write available"},
        ],
        "degraded": degraded,
    }


@router.post("/diagnostics", response_model=DiagnosticsResult)
def diagnostics() -> DiagnosticsResult:
    checks = [
        "Pinging signal network",
        "Verifying model checksum",
        "Testing data pipelines",
        "Checking weather sync",
        "Validating GPS telemetry",
    ]
    if store.degraded:
        return DiagnosticsResult(status="degraded", checks=checks, affected_sources=["Weather API"])
    return DiagnosticsResult(status="nominal", checks=checks)
