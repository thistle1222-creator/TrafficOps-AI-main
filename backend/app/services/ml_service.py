from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from joblib import load
from sklearn.exceptions import NotFittedError
from xgboost import XGBClassifier

from app.models.schemas import MLStatus, MLPredictRequest, MLPredictionResult, RiskResult, Severity, RiskFactor

LOGGER = logging.getLogger(__name__)


@dataclass
class MLModelArtifacts:
    model_path: Path
    label_encoders_path: Path
    category_map_path: Path
    feature_columns_path: Path


class MLService:
    def __init__(self, artifacts: MLModelArtifacts):
        self.artifacts = artifacts
        self.model: XGBClassifier | None = None
        self.encoders: dict[str, Any] = {}
        self.event_category_map: dict[str, str] = {}
        self.feature_columns: list[str] = []
        self.status: MLStatus = MLStatus(
            status="unavailable",
            modelUsed=None,
            modelPath=str(self.artifacts.model_path),
            loaded=False,
            errors=[],
            featureColumns=[],
        )

    def load(self) -> None:
        self.status.errors.clear()
        self.status.featureColumns = []
        try:
            self.feature_columns = self._load_feature_columns()
            self.encoders = self._load_encoders()
            self.event_category_map = self._load_event_category_map()
            self.model = self._load_model()
            self.status.status = "loaded"
            self.status.loaded = True
            self.status.modelUsed = "xgboost-priority-model"
            self.status.featureColumns = list(self.feature_columns)
            LOGGER.info("ML model loaded successfully from %s", self.artifacts.model_path)
        except Exception as exc:
            self.status.status = "error"
            self.status.loaded = False
            error_msg = str(exc)
            self.status.errors.append(error_msg)
            LOGGER.exception("Failed to load ML model artifacts: %s", error_msg)
            self.model = None

    def status_info(self) -> MLStatus:
        return self.status

    def predict(self, payload: MLPredictRequest) -> MLPredictionResult:
        if not self.model or not self.status.loaded:
            raise RuntimeError("ML model is not loaded")

        try:
            x = self._preprocess(payload)
            proba = self.model.predict_proba(x)[0]
            score = int(round(float(proba[1]) * 100))
            predicted = self.model.predict(x)[0]
            label = "High" if int(predicted) == 1 else "Normal"
            return MLPredictionResult(
                predictedPriority=label,
                confidenceScore=score,
                riskScore=score,
                modelUsed=self.status.modelUsed or "xgboost-priority-model",
                message="Prediction completed successfully.",
            )
        except Exception as exc:
            LOGGER.exception("Error during ML prediction: %s", exc)
            raise

    def _normalize_str(self, value: str | None) -> str | None:
        """Strip and lowercase string values to match training preprocessing."""
        if value is None:
            return None
        return value.strip().lower()

    def _normalize_feature_value(self, feature: str, value: Any) -> Any:
        """Normalize feature value, mapping unsupported values to 'unknown'."""
        if not isinstance(value, str) or feature not in self.encoders:
            return value

        encoder = self.encoders[feature]
        normalized_lower = value.lower() if value else value

        classes = getattr(encoder, "classes_", None)
        if classes is None:
            return normalized_lower

        # Try exact match first
        if normalized_lower in classes:
            return normalized_lower

        # Try case-insensitive match
        class_map = {str(c).lower(): str(c) for c in classes}
        if normalized_lower in class_map:
            return class_map[normalized_lower]

        # If value not found in classes, check if 'unknown' exists as fallback
        if "unknown" in class_map:
            return "unknown"
        if "unknown" in classes:
            return "unknown"

        # If no 'unknown' exists, return the normalized value and let encoder handle it
        return normalized_lower

    def _encode_feature(self, feature: str, value: Any) -> Any:
        """Encode feature, gracefully handling unsupported values by mapping to 'unknown'."""
        if feature not in self.encoders:
            return value

        encoder = self.encoders[feature]
        normalized_value = self._normalize_feature_value(feature, value)

        try:
            encoded_value = encoder.transform([normalized_value])[0]
        except Exception:
            # If encoding fails for the normalized value, try 'unknown' as fallback
            try:
                encoded_value = encoder.transform(["unknown"])[0]
                LOGGER.warning(
                    "Feature '%s' value '%s' not recognized; using 'unknown' as fallback.",
                    feature,
                    value,
                )
            except Exception as exc:
                # If 'unknown' also fails, log and use a default encoding (0.0)
                LOGGER.warning(
                    "Could not encode feature '%s' even with 'unknown' fallback: %s",
                    feature,
                    exc,
                )
                encoded_value = 0.0

        return encoded_value

    def _preprocess(self, payload: MLPredictRequest) -> np.ndarray:
        event_type = self._normalize_str(payload.event_type.value)
        event_cause = self._normalize_str(payload.event_cause)
        authenticated = self._normalize_str(payload.authenticated or "yes")
        veh_type = self._normalize_str(payload.veh_type or "Unknown")
        corridor = self._normalize_str(payload.corridor or "Unknown")
        police_station = self._normalize_str(payload.police_station or "Unknown")
        zone = self._normalize_str(payload.zone)
        junction = self._normalize_str(payload.junction)
        direction = self._normalize_str(payload.direction.value)

        data = {
            "event_type": event_type,
            "latitude": payload.latitude if payload.latitude is not None else 0.0,
            "longitude": payload.longitude if payload.longitude is not None else 0.0,
            "endlatitude": payload.endlatitude if payload.endlatitude is not None else 0.0,
            "endlongitude": payload.endlongitude if payload.endlongitude is not None else 0.0,
            "event_cause": event_cause,
            "requires_road_closure": 1 if payload.requiresClosure else 0,
            "authenticated": authenticated,
            "veh_type": veh_type,
            "corridor": corridor,
            "police_station": police_station,
            "zone": zone,
            "junction": junction,
            "hour_of_day": payload.hour,
            "day_of_week": payload.day_of_week,
            "month": payload.month if payload.month is not None else 0,
            "is_weekend": payload.weekend,
            "is_peak_hour": payload.hour in {8, 9, 10, 17, 18, 19, 20},
            "is_night": payload.hour >= 20 or payload.hour <= 5,
            "event_category": self._map_event_category(event_cause),
            "is_crowd_event": event_cause in {"public_event", "procession", "protest", "vip_movement"},
            "is_road_closure": payload.requiresClosure,
        }

        encoded_features: list[Any] = []
        for feature in self.feature_columns:
            value = data.get(feature, 0)
            encoded_features.append(self._encode_feature(feature, value))

        array = np.array([encoded_features], dtype=float)
        return array

    def _map_event_category(self, cause: str | None) -> str:
        normalized = self._normalize_str(cause) or ""
        normalized = normalized.replace(" ", "_")
        return self.event_category_map.get(normalized, "others")

    def _load_feature_columns(self) -> list[str]:
        text = Path(self.artifacts.feature_columns_path).read_text(encoding="utf-8")
        return json.loads(text)

    def _load_encoders(self) -> dict[str, Any]:
        try:
            return load(self.artifacts.label_encoders_path)
        except Exception as exc:
            raise RuntimeError(f"Unable to load label encoders: {exc}") from exc

    def _load_event_category_map(self) -> dict[str, str]:
        try:
            data = load(self.artifacts.category_map_path)
            if not isinstance(data, dict):
                raise TypeError("event_category_map is not a dict")
            return data
        except Exception as exc:
            raise RuntimeError(f"Unable to load event category map: {exc}") from exc

    def _load_model(self) -> XGBClassifier:
        try:
            model = load(self.artifacts.model_path)
            if not hasattr(model, "predict_proba"):
                raise TypeError("Loaded model does not support predict_proba")
            return model
        except Exception as exc:
            raise RuntimeError(f"Unable to load XGBoost model: {exc}") from exc
