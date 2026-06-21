from fastapi import APIRouter

from app.models.schemas import AppSnapshot
from app.services.store import store

router = APIRouter(prefix="/state", tags=["state"])


@router.get("", response_model=AppSnapshot)
def snapshot() -> AppSnapshot:
    return store.snapshot()
