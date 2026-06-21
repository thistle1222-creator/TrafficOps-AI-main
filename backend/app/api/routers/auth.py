from fastapi import APIRouter

from app.core.security import issue_demo_token, officer_name_for
from app.models.schemas import LoginRequest, LoginResponse, User
from app.services.store import store

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    user = User(officer_id=payload.officer_id, name=officer_name_for(payload.role), role=payload.role)
    store.set_user(user)
    return LoginResponse(user=user, token=issue_demo_token(user))
