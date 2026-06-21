from fastapi import APIRouter

from app.models.schemas import PublicAdvisory
from app.services.risk_engine import now_ms
from app.services.store import store

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.get("", response_model=PublicAdvisory)
def advisory() -> PublicAdvisory:
    zones = store.zone_rollup()
    high_zones = [zone for zone in zones if zone["risk"] >= 66][:5]
    advisories = [
        f"Heavy congestion expected near {zone['zone']}. Consider alternate routes and allow extra travel time."
        for zone in high_zones
    ]
    if not advisories:
        advisories = ["Traffic is broadly stable across monitored Bengaluru corridors. Continue to follow local advisories."]
    return PublicAdvisory(lastUpdated=now_ms(), advisories=advisories, zones=zones)
