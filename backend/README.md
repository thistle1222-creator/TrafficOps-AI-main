# TrafficOps AI Backend

FastAPI backend for the TrafficOps AI frontend. It provides real API contracts for:

- Login and role-aware officer sessions
- Live disruption event simulation
- Risk scoring with explainability factors
- Alert acknowledgement, assignment, and status workflow
- Incident/activity audit logs
- Forecast, public advisory, heatmap rollups, and system health
- Gemini-powered AI copilot with local fallback
- Future ML model integration through `app/services/ml_adapter.py`

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

API docs open at:

```text
http://127.0.0.1:8000/docs
```

## Gemini API Key

Set this in `.env` when you are ready:

```text
GEMINI_API_KEY=your_key_here
```

Without the key, `/api/agent/chat` still works using deterministic local operational responses.

## Main Endpoints

```text
POST /api/auth/login
GET  /api/state
GET  /api/events
POST /api/events/simulate
POST /api/events/risk
POST /api/events/{event_id}/acknowledge
POST /api/events/{event_id}/assign
POST /api/events/{event_id}/status
POST /api/agent/chat
GET  /api/system-health
POST /api/system-health/diagnostics
GET  /api/forecast/timeline
GET  /api/forecast/zones
GET  /api/advisory
PATCH /api/settings
GET  /api/activity
GET  /api/stream
```

## Frontend Connection

The frontend currently uses local React state. Add this base URL to the frontend environment:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Then use the sample adapter in `frontend-api-client.ts` to replace local calls gradually.

## ML Integration Plan

When the ML folder is available:

1. Put the trained model path in `ML_MODEL_PATH`.
2. Load the sklearn/joblib pipeline inside `MLRiskModelAdapter.load()`.
3. Convert `RiskInput` into your model feature vector.
4. Return the same `RiskResult` shape: `score`, `severity`, `factors`, `recommendation`, and `model_used`.

The API routes already depend on the adapter boundary, so the frontend contract can stay stable.
