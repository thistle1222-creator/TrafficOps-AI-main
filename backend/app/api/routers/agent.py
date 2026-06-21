from fastapi import APIRouter

from app.models.schemas import AgentChatRequest, AgentChatResponse
from app.services.gemini_agent import GeminiTrafficAgent
from app.services.store import store

router = APIRouter(prefix="/agent", tags=["agent"])
agent = GeminiTrafficAgent()


@router.post("/chat", response_model=AgentChatResponse)
async def chat(payload: AgentChatRequest) -> AgentChatResponse:
    context = {
        **payload.context,
        "active_events": [event.model_dump() for event in store.snapshot().events[:8]],
        "degraded": store.degraded,
    }
    response = await agent.chat(payload.message, context)
    store.log(kind="system", type="Recommendation", message=f"Copilot response: {response.response[:160]}", actor="AI Agent")
    return response


@router.get("/processes")
def processes() -> list[dict]:
    return [
        {"id": "AGT-204", "type": "Weather correlation", "status": "Running", "duration": "00:18", "confidence": 91},
        {"id": "AGT-198", "type": "Risk classification", "status": "Complete", "duration": "00:07", "confidence": 96},
        {"id": "AGT-177", "type": "Resource planner", "status": "Running", "duration": "00:24", "confidence": 88},
    ]
