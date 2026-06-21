from __future__ import annotations

import random
import time
from datetime import datetime
from itertools import count

from app.models.schemas import (
    Direction,
    DisruptionEvent,
    EventCreate,
    EventType,
    RiskFactor,
    RiskInput,
    RiskResult,
    Severity,
)

ZONES = [
    "Silk Board",
    "KR Puram",
    "Indiranagar",
    "Marathahalli",
    "Hebbal",
    "MG Road",
    "Yeshwantpur",
    "Yelahanka",
    "Peenya",
    "Banashankari",
    "Rajajinagar",
    "Koramangala",
    "Jayanagar",
    "Electronic City",
    "Whitefield",
]

CAUSE_BASE = {
    "Accident": 45,
    "Fire Department Response": 50,
    "VIP Movement": 35,
    "Protest": 40,
    "Waterlogging": 30,
    "Signal Failure": 25,
    "Tree Fall": 28,
    "Vehicle Breakdown": 15,
    "Public Gathering": 20,
    "Stray Animal Crossing": 10,
    "Road Repair": 20,
    "Political Rally": 42,
}

JUNCTIONS = {
    "Silk Board": ["Silk Board Junction", "Madiwala Signal", "BTM Layout"],
    "KR Puram": ["KR Puram Bridge", "Tin Factory", "Hoodi Junction"],
    "Indiranagar": ["100ft Road", "CMH Road", "Old Madras Road"],
    "Marathahalli": ["Marathahalli Bridge", "Outer Ring Road", "Kundalahalli Gate"],
    "Hebbal": ["Hebbal Flyover", "Esteem Mall Jn", "Mekhri Circle"],
    "MG Road": ["Trinity Circle", "Brigade Road Jn", "Anil Kumble Circle"],
    "Yeshwantpur": ["Yeshwantpur Circle", "Goraguntepalya", "Mathikere"],
    "Yelahanka": ["Yelahanka Gate", "Air Force Jn", "Doddaballapur Road"],
    "Peenya": ["Peenya Junction", "8th Mile", "Jalahalli Cross"],
    "Banashankari": ["Banashankari Bus Stand", "Devegowda Petrol Pump", "BSK 3rd Stage"],
    "Rajajinagar": ["Navrang Circle", "Industrial Town", "ESI"],
    "Koramangala": ["Sony World Jn", "Forum Mall", "80ft Road"],
    "Jayanagar": ["Jayanagar 4th Block", "South End Circle", "Ashoka Pillar"],
    "Electronic City": ["E-City Toll", "Hosur Road", "Bommanahalli"],
    "Whitefield": ["ITPL Main Gate", "Hope Farm Jn", "Varthur Kodi"],
}

UNITS = [
    "Unit 14 - Silk Board Patrol",
    "Unit 22 - KR Puram Bike Squad",
    "Unit 09 - Indiranagar Mobile",
    "Unit 31 - Hebbal Highway",
    "Unit 47 - Whitefield Patrol",
    "Unit 18 - MG Road Foot Patrol",
    "Unit 26 - E-City Response",
    "Unit 12 - Central Reserve",
]

_ids = count(1001)


def now_ms() -> int:
    return int(time.time() * 1000)


def severity_from_score(score: int) -> Severity:
    if score >= 86:
        return Severity.critical
    if score >= 66:
        return Severity.high
    if score >= 41:
        return Severity.medium
    return Severity.normal


def event_type_for(cause: str) -> EventType:
    if cause in {"VIP Movement", "Road Repair", "Political Rally", "Public Gathering"}:
        return EventType.planned
    return EventType.unplanned


def recommendation_for(cause: str, severity: Severity) -> str:
    if severity == Severity.critical:
        return f"Immediate dispatch: 3+ units, divert traffic, alert hospitals for {cause}."
    if severity == Severity.high:
        return f"Dispatch 2 units, prepare diversion plan for {cause}."
    if severity == Severity.medium:
        return "Dispatch 1 patrol, monitor for escalation."
    return "Log and monitor - no dispatch required."


def compute_rule_based_risk(payload: RiskInput) -> RiskResult:
    base = CAUSE_BASE.get(payload.event_cause, 20)
    duration_factor = round((payload.event_duration_min / 60) * 8, 1)
    closure_factor = 25 if payload.requires_road_closure else 0
    peak_factor = 15 if payload.hour in {8, 9, 10, 17, 18, 19, 20} else 0
    weekend_factor = -10 if payload.weekend else 0
    score = max(0, min(100, round(base + duration_factor + closure_factor + peak_factor + weekend_factor)))
    factors = [
        RiskFactor(label=f"Cause: {payload.event_cause}", value=base),
        RiskFactor(label=f"Duration: {payload.event_duration_min}min", value=duration_factor),
    ]
    if closure_factor:
        factors.append(RiskFactor(label="Road closure required", value=closure_factor))
    if peak_factor:
        factors.append(RiskFactor(label=f"Peak hour: {payload.hour:02d}:00", value=peak_factor))
    if weekend_factor:
        factors.append(RiskFactor(label="Weekend adjustment", value=weekend_factor))
    severity = severity_from_score(score)
    return RiskResult(
        score=score,
        severity=severity,
        factors=factors,
        recommendation=recommendation_for(payload.event_cause, severity),
        model_used="rule-engine-v1",
    )


def build_event(source: str = "auto", overrides: EventCreate | None = None) -> DisruptionEvent:
    overrides = overrides or EventCreate()
    current = datetime.now()
    zone = overrides.zone or random.choice(ZONES)
    cause = overrides.cause or random.choice(list(CAUSE_BASE.keys()))
    junction = overrides.junction or random.choice(JUNCTIONS[zone])
    hour = overrides.hour if overrides.hour is not None else current.hour
    weekend = overrides.isWeekend if overrides.isWeekend is not None else current.weekday() >= 5
    duration = overrides.durationMin or random.randint(15, 240)
    closure = overrides.requiresClosure if overrides.requiresClosure is not None else random.random() < 0.35
    direction = overrides.direction or random.choice(list(Direction))
    risk = compute_rule_based_risk(
        RiskInput(
            cause=cause,
            zone=zone,
            junction=junction,
            direction=direction,
            hour=hour,
            day_of_week=current.weekday(),
            weekend=weekend,
            durationMin=duration,
            requiresClosure=closure,
        )
    )
    severity = overrides.severity or risk.severity
    return DisruptionEvent(
        id=f"EVT-{next(_ids):X}",
        ts=now_ms(),
        type=event_type_for(cause),
        cause=cause,
        zone=zone,
        junction=junction,
        direction=direction,
        durationMin=duration,
        requiresClosure=closure,
        hour=hour,
        isWeekend=weekend,
        score=risk.score,
        severity=severity,
        factors=risk.factors,
        recommendation=recommendation_for(cause, severity),
        source=source,  # type: ignore[arg-type]
    )
