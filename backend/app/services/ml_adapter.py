from __future__ import annotations

from typing import Protocol

from app.models.schemas import RiskInput, RiskResult
from app.services.risk_engine import compute_rule_based_risk


class RiskModel(Protocol):
    def predict(self, payload: RiskInput) -> RiskResult:
        ...


class RuleBasedRiskModel:
    def predict(self, payload: RiskInput) -> RiskResult:
        return compute_rule_based_risk(payload)


class MLRiskModelAdapter:
    """Drop-in boundary for the future ML folder.

    When you provide the trained model folder, load it here and return the same
    RiskResult shape. The API routes will not need to change.
    """

    def __init__(self, model_path: str):
        self.model_path = model_path
        self._model = None

    def load(self) -> None:
        # Future hook: load joblib/pickle/sklearn pipeline from self.model_path.
        # Keep the backend functional until the ML artifact is available.
        self._model = None

    def predict(self, payload: RiskInput) -> RiskResult:
        result = compute_rule_based_risk(payload)
        result.model_used = "ml-adapter-fallback"
        return result
