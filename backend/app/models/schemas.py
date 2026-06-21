from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class Role(str, Enum):
    duty_officer = "Duty Officer"
    zone_commander = "Zone Commander"
    control_room_admin = "Control Room Admin"


class Severity(str, Enum):
    normal = "Normal"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class EventStatus(str, Enum):
    unassigned = "Unassigned"
    dispatched = "Dispatched"
    on_scene = "On Scene"
    resolved = "Resolved"


class Direction(str, Enum):
    inbound = "Inbound"
    outbound = "Outbound"
    both = "Both"


class EventType(str, Enum):
    planned = "Planned"
    unplanned = "Unplanned"


class User(BaseModel):
    officer_id: str = Field(..., min_length=1)
    name: str = "Officer R. Kumar"
    role: Role


class LoginRequest(BaseModel):
    officer_id: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    role: Role


class LoginResponse(BaseModel):
    user: User
    token: str


class RiskFactor(BaseModel):
    label: str
    value: float


class RiskInput(BaseModel):
    event_type: EventType | None = None
    event_cause: str = Field(..., alias="cause")
    zone: str
    junction: str | None = None
    direction: Direction = Direction.both
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    weekend: bool
    event_duration_min: int = Field(..., ge=15, le=240, alias="durationMin")
    requires_road_closure: bool = Field(False, alias="requiresClosure")

    model_config = {"populate_by_name": True}


class RiskResult(BaseModel):
    score: int
    severity: Severity
    factors: list[RiskFactor]
    recommendation: str
    model_used: str


<<<<<<< HEAD
class MLPredictRequest(BaseModel):
    event_type: EventType = EventType.unplanned
    event_cause: str = Field(..., alias="cause")
    zone: str
    junction: str
    direction: Direction = Direction.both
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    weekend: bool
    durationMin: int = Field(..., ge=15, le=240, alias="durationMin")
    requiresClosure: bool = Field(False, alias="requiresClosure")
    latitude: float | None = None
    longitude: float | None = None
    endlatitude: float | None = None
    endlongitude: float | None = None
    authenticated: str | None = None
    veh_type: str | None = None
    corridor: str | None = None
    police_station: str | None = None
    month: int | None = None
    event_category: str | None = None
    is_crowd_event: bool | None = None
    is_road_closure: bool | None = None

    model_config = {"populate_by_name": True}


class MLPredictionResult(BaseModel):
    predictedPriority: str
    confidenceScore: int
    riskScore: int
    modelUsed: str
    message: str | None = None


class MLStatus(BaseModel):
    status: Literal["loaded", "error", "unavailable"]
    modelUsed: str | None = None
    modelPath: str | None = None
    loaded: bool = False
    errors: list[str] = Field(default_factory=list)
    featureColumns: list[str] = Field(default_factory=list)


=======
>>>>>>> 507eb113578c8e59877a9e421dfc5428083ad34a
class DisruptionEvent(BaseModel):
    id: str
    ts: int
    type: EventType
    cause: str
    zone: str
    junction: str
    direction: Direction
    durationMin: int
    requiresClosure: bool
    hour: int
    isWeekend: bool
    score: int
    severity: Severity
    factors: list[RiskFactor]
    recommendation: str
    status: EventStatus = EventStatus.unassigned
    assignedUnit: str | None = None
    acknowledged: bool = False
    source: Literal["auto", "manual", "ml"] = "auto"


class EventCreate(BaseModel):
    cause: str | None = None
    zone: str | None = None
    junction: str | None = None
    direction: Direction | None = None
    durationMin: int | None = Field(None, ge=15, le=240)
    requiresClosure: bool | None = None
    hour: int | None = Field(None, ge=0, le=23)
    isWeekend: bool | None = None
    severity: Severity | None = None


class ActivityEntry(BaseModel):
    id: str
    ts: int
    kind: Literal["system", "human"]
    type: Literal["Alert", "Detection", "Recommendation", "System", "Action"]
    location: str | None = None
    message: str
    confidence: int | None = None
    actor: str | None = None


class AssignUnitRequest(BaseModel):
    unit: str
    actor: User | None = None


class StatusRequest(BaseModel):
    status: EventStatus
    actor: User | None = None


class ActorRequest(BaseModel):
    actor: User | None = None


class DegradedModeRequest(BaseModel):
    on: bool
    actor: User | None = None


class Settings(BaseModel):
    criticalThreshold: int = 86
    highThreshold: int = 66
    soundAlerts: bool = True
    autoAck: bool = False
    smsDispatch: bool = True
    whatsapp: bool = False
    heatmapInterval: int = 5
    alertInterval: int = 5
    weatherInterval: int = 60
    autonomousMode: bool = True
    confidenceThreshold: int = 75
    maxConcurrent: int = 12
    degradedMode: bool = False


class SettingsPatch(BaseModel):
    patch: dict[str, Any]
    actor: User | None = None


class Counters(BaseModel):
    detected: int = 12847
    predictions: int = 5612
    decisions: int = 248


class AppSnapshot(BaseModel):
    user: User | None = None
    events: list[DisruptionEvent]
    activity: list[ActivityEntry]
    degraded: bool
    settings: Settings
    counters: Counters
    recentShockwave: dict[str, Any] | None = None


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)
    actor: User | None = None


class AgentChatResponse(BaseModel):
    response: str
    provider: Literal["gemini", "fallback"]
    actions: list[str] = Field(default_factory=list)


class DiagnosticsResult(BaseModel):
    status: Literal["nominal", "degraded"]
    checks: list[str]
    affected_sources: list[str] = Field(default_factory=list)


class ForecastPoint(BaseModel):
    label: str
    risk: int


class ZoneForecast(BaseModel):
    zone: str
    currentRisk: int
    predictedRisk: int
    trend: Literal["up", "down", "stable"]
    recommendation: str


class PublicAdvisory(BaseModel):
    lastUpdated: int
    advisories: list[str]
    zones: list[dict[str, Any]]
