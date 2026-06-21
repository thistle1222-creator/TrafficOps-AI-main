from fastapi import APIRouter, HTTPException

from app.models.schemas import ActorRequest, AssignUnitRequest, DisruptionEvent, EventCreate, RiskInput, RiskResult, StatusRequest
from app.services.ml_adapter import MLRiskModelAdapter, RuleBasedRiskModel
from app.services.risk_engine import UNITS, compute_rule_based_risk
from app.services.store import store

router = APIRouter(prefix="/events", tags=["events"])
risk_model = RuleBasedRiskModel()


@router.get("", response_model=list[DisruptionEvent])
def list_events() -> list[DisruptionEvent]:
    return store.snapshot().events


@router.post("/simulate", response_model=DisruptionEvent)
def simulate(payload: EventCreate) -> DisruptionEvent:
    return store.inject_event("manual", payload)


@router.post("/auto-inject", response_model=DisruptionEvent)
def auto_inject() -> DisruptionEvent:
    return store.inject_event("auto")


@router.post("/risk", response_model=RiskResult)
def score_risk(payload: RiskInput) -> RiskResult:
    return risk_model.predict(payload)


@router.post("/{event_id}/acknowledge", response_model=DisruptionEvent)
def acknowledge(event_id: str, payload: ActorRequest) -> DisruptionEvent:
    try:
        return store.acknowledge(event_id, payload.actor)
    except KeyError:
        raise HTTPException(status_code=404, detail="Event not found") from None


@router.post("/{event_id}/assign", response_model=DisruptionEvent)
def assign(event_id: str, payload: AssignUnitRequest) -> DisruptionEvent:
    try:
        return store.assign_unit(event_id, payload.unit, payload.actor)
    except KeyError:
        raise HTTPException(status_code=404, detail="Event not found") from None


@router.post("/{event_id}/status", response_model=DisruptionEvent)
def set_status(event_id: str, payload: StatusRequest) -> DisruptionEvent:
    try:
        return store.set_status(event_id, payload.status, payload.actor)
    except KeyError:
        raise HTTPException(status_code=404, detail="Event not found") from None


@router.get("/units", response_model=list[str])
def units() -> list[str]:
    return UNITS
