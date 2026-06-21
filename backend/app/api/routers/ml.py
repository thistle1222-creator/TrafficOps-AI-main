from fastapi import APIRouter, HTTPException
from pathlib import Path
from app.core.config import get_settings
from app.services.ml_service import MLModelArtifacts, MLService
from app.models.schemas import MLPredictRequest, MLPredictionResult, MLStatus

router = APIRouter(prefix="/ml", tags=["ml"])

# We'll lazily instantiate the service during app startup via main.lifespan
service: MLService | None = None


@router.get("/status", response_model=MLStatus)
def status() -> MLStatus:
    if service is None:
        raise HTTPException(status_code=503, detail="ML service not initialized")
    return service.status_info()


@router.post("/predict-priority", response_model=MLPredictionResult)
def predict_priority(payload: MLPredictRequest) -> MLPredictionResult:
    if service is None or not service.status.loaded:
        raise HTTPException(status_code=503, detail="ML model not available")
    try:
        return service.predict(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _find_artifact_root() -> Path:
    current = Path(__file__).resolve().parent
    while current != current.parent:
        candidate = current / "model_artifacts"
        if candidate.exists():
            return current
        current = current.parent
    raise FileNotFoundError("Could not locate model_artifacts folder in parent directories")


def init_service_from_settings() -> MLService:
    cfg = get_settings()
    if cfg.ml_model_path:
        base = Path(cfg.ml_model_path)
    else:
        root = _find_artifact_root()
        base = root / "model_artifacts"
    artifacts = MLModelArtifacts(
        model_path=base / "xgboost_priority_model.pkl",
        label_encoders_path=base / "label_encoders.pkl",
        category_map_path=base / "event_category_map.pkl",
        feature_columns_path=base / "feature_columns.json",
    )
    svc = MLService(artifacts)
    svc.load()
    return svc
