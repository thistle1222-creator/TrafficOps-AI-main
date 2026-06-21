from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.models.schemas import AgentChatResponse


class GeminiTrafficAgent:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def chat(self, message: str, context: dict) -> AgentChatResponse:
        if not self.settings.gemini_api_key:
            return self._fallback(message)

        prompt = self._build_prompt(message, context)
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.gemini_model}:generateContent?key={self.settings.gemini_api_key}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.25}}
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(url, json=payload)
                res.raise_for_status()
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return AgentChatResponse(response=text, provider="gemini", actions=self._actions_for(message))
        except Exception:
            fallback = self._fallback(message)
            fallback.response = f"{fallback.response}\n\nGemini is configured but unavailable, so I used local operational logic."
            return fallback

    def _build_prompt(self, message: str, context: dict) -> str:
        return f"""
You are TrafficOps AI, an operational assistant for a Bengaluru traffic command center prototype.
Be concise, specific, and action-oriented. Mention uncertainty when data is simulated.
Never claim to be an official government system.

Current context:
{context}

Officer request:
{message}
""".strip()

    def _fallback(self, message: str) -> AgentChatResponse:
        lower = message.lower()
        if "silk board" in lower:
            text = "Silk Board is a priority watch zone. Recommend two patrol units, ORR diversion readiness, and a 30-minute reassessment."
        elif "risk" in lower or "score" in lower:
            text = "Risk is computed from cause, duration, road closure, peak-hour pressure, and weekend adjustment. Scores above 86 should be treated as critical."
        elif "weather" in lower or "rain" in lower:
            text = "Weather-sensitive routing should increase monitoring near underpasses, ORR corridors, and known waterlogging points."
        elif "resource" in lower or "unit" in lower or "officer" in lower:
            text = "Prioritize units for critical zones first, keep one central reserve available, and avoid assigning the same patrol to distant east-west incidents."
        else:
            text = "Agent recommendation: monitor active high-risk zones, acknowledge unassigned alerts, and dispatch the closest available unit before escalation."
        return AgentChatResponse(response=text, provider="fallback", actions=self._actions_for(message))

    def _actions_for(self, message: str) -> list[str]:
        lower = message.lower()
        actions: list[str] = []
        if "dispatch" in lower or "unit" in lower:
            actions.append("review_unit_assignment")
        if "critical" in lower or "risk" in lower:
            actions.append("inspect_explainability_factors")
        if "simulate" in lower or "trigger" in lower:
            actions.append("open_event_simulator")
        return actions
