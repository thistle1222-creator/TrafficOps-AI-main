from fastapi import APIRouter

from app.models.schemas import ActivityEntry
from app.services.store import store

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", response_model=list[ActivityEntry])
def activity(kind: str | None = None) -> list[ActivityEntry]:
    entries = store.snapshot().activity
    if kind and kind.lower() != "all":
        entries = [entry for entry in entries if entry.type.lower() == kind.lower() or entry.kind.lower() == kind.lower()]
    return entries
