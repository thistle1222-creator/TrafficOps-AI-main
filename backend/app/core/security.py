from __future__ import annotations

import base64
import json

from app.models.schemas import Role, User


def issue_demo_token(user: User) -> str:
    payload = {"officer_id": user.officer_id, "name": user.name, "role": user.role.value}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def officer_name_for(role: Role) -> str:
    return {
        Role.duty_officer: "Officer A. Rao",
        Role.zone_commander: "Officer R. Kumar",
        Role.control_room_admin: "Officer N. Iyer",
    }[role]
