from fastapi import APIRouter

from app.models.schemas import DegradedModeRequest, Settings, SettingsPatch
from app.services.store import store

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=Settings)
def get_settings() -> Settings:
    return store.settings


@router.patch("", response_model=Settings)
def update_settings(payload: SettingsPatch) -> Settings:
    return store.update_settings(payload.patch, payload.actor)


@router.post("/degraded", response_model=Settings)
def set_degraded(payload: DegradedModeRequest) -> Settings:
    store.set_degraded(payload.on, payload.actor)
    return store.settings
