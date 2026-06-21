from __future__ import annotations

import random
import threading
from collections import deque
from typing import Any

from app.models.schemas import (
    ActivityEntry,
    AppSnapshot,
    Counters,
    DisruptionEvent,
    EventCreate,
    EventStatus,
    Settings,
    User,
)
from app.services.risk_engine import ZONES, build_event, now_ms


class TrafficOpsStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.user: User | None = None
        self.events: deque[DisruptionEvent] = deque(maxlen=500)
        self.activity: deque[ActivityEntry] = deque(maxlen=500)
        self.degraded = False
        self.settings = Settings()
        self.counters = Counters()
        self.recent_shockwave: dict[str, Any] | None = None
        self._seed()

    def _seed(self) -> None:
        for i in range(8):
            event = build_event("auto")
            event.ts -= i * 180_000
            self.events.appendleft(event)
        self.log(
            kind="system",
            type="System",
            message="TrafficOps AI online - agent monitoring 15 zones.",
            actor="System",
        )

    def snapshot(self) -> AppSnapshot:
        with self._lock:
            return AppSnapshot(
                user=self.user,
                events=list(self.events),
                activity=list(self.activity),
                degraded=self.degraded,
                settings=self.settings,
                counters=self.counters,
                recentShockwave=self.recent_shockwave,
            )

    def set_user(self, user: User) -> None:
        with self._lock:
            self.user = user
            self.log(kind="human", type="Action", message=f"{user.name} signed in as {user.role.value}", actor=user.name)

    def log(self, **payload: Any) -> ActivityEntry:
        entry = ActivityEntry(
            id=f"LOG-{now_ms()}-{random.randint(1000, 9999)}",
            ts=now_ms(),
            **payload,
        )
        self.activity.appendleft(entry)
        return entry

    def inject_event(self, source: str = "auto", overrides: EventCreate | None = None, actor: User | None = None) -> DisruptionEvent:
        with self._lock:
            event = build_event(source, overrides)
            self.events.appendleft(event)
            self.recent_shockwave = {"zone": event.zone, "ts": event.ts}
            self.counters.detected += 1
            self.counters.predictions += 1
            self.counters.decisions += 1
            location = f"{event.zone} · {event.junction}"
            if source == "manual":
                self.log(
                    kind="human",
                    type="Action",
                    location=location,
                    message=f"Admin-triggered simulation: {event.cause} ({event.severity.value}, score {event.score})",
                    confidence=random.randint(80, 98),
                    actor=self._actor_label(actor),
                )
            else:
                self.log(
                    kind="system",
                    type="Detection",
                    location=location,
                    message=f"{event.cause} detected - risk {event.score} ({event.severity.value})",
                    confidence=random.randint(80, 98),
                    actor="AI Agent",
                )
            return event

    def acknowledge(self, event_id: str, actor: User | None = None) -> DisruptionEvent:
        with self._lock:
            event = self._find_event(event_id)
            event.acknowledged = True
            if event.status == EventStatus.unassigned:
                event.status = EventStatus.dispatched
            self.log(
                kind="human",
                type="Action",
                location=f"{event.zone} · {event.junction}",
                message=f"Acknowledged alert {event.id} ({event.cause})",
                actor=self._actor_label(actor),
            )
            return event

    def assign_unit(self, event_id: str, unit: str, actor: User | None = None) -> DisruptionEvent:
        with self._lock:
            event = self._find_event(event_id)
            event.assignedUnit = unit
            event.status = EventStatus.dispatched
            self.log(
                kind="human",
                type="Action",
                location=f"{event.zone} · {event.junction}",
                message=f"Assigned {unit} to {event.id}",
                actor=self._actor_label(actor),
            )
            return event

    def set_status(self, event_id: str, status: EventStatus, actor: User | None = None) -> DisruptionEvent:
        with self._lock:
            event = self._find_event(event_id)
            event.status = status
            self.log(
                kind="human",
                type="Action",
                location=f"{event.zone} · {event.junction}",
                message=f"Status changed to {status.value} for {event.id}",
                actor=self._actor_label(actor),
            )
            return event

    def update_settings(self, patch: dict[str, Any], actor: User | None = None) -> Settings:
        with self._lock:
            data = self.settings.model_dump()
            for key, value in patch.items():
                if key in data:
                    old = data[key]
                    data[key] = value
                    self.log(
                        kind="human",
                        type="Action",
                        message=f'Setting "{key}" changed: {old} -> {value}',
                        actor=self._actor_label(actor),
                    )
            self.settings = Settings(**data)
            self.degraded = self.settings.degradedMode
            return self.settings

    def set_degraded(self, on: bool, actor: User | None = None) -> None:
        with self._lock:
            self.degraded = on
            self.settings.degradedMode = on
            self.log(
                kind="human",
                type="Action",
                message="Degraded mode simulation enabled" if on else "Connections restored - nominal mode",
                actor=self._actor_label(actor),
            )

    def zone_rollup(self) -> list[dict[str, Any]]:
        with self._lock:
            rollup = []
            for zone in ZONES:
                zone_events = [event for event in self.events if event.zone == zone and event.status != EventStatus.resolved]
                top = max([event.score for event in zone_events], default=random.randint(18, 48))
                rollup.append(
                    {
                        "zone": zone,
                        "risk": top,
                        "severity": max(zone_events, key=lambda event: event.score).severity.value if zone_events else "Normal",
                        "activeIncidents": len(zone_events),
                        "density": min(99, max(20, top + random.randint(-8, 12))),
                    }
                )
            return rollup

    def _find_event(self, event_id: str) -> DisruptionEvent:
        for event in self.events:
            if event.id == event_id:
                return event
        raise KeyError(event_id)

    def _actor_label(self, actor: User | None) -> str:
        actor = actor or self.user
        return f"{actor.name} ({actor.role.value})" if actor else "Officer"


store = TrafficOpsStore()
