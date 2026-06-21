from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_state_endpoint_returns_seeded_events():
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert len(data["events"]) >= 1
    assert data["counters"]["detected"] >= 12847


def test_agent_chat_fallback_without_key():
    response = client.post("/api/agent/chat", json={"message": "What is the Silk Board risk?"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] in {"fallback", "gemini"}
    assert "Silk Board" in data["response"]
