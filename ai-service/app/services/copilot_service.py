import json

from app.prompts.copilot_prompt import build_copilot_prompt
from app.schemas.copilot_schema import (
    CopilotChatRequest,
    CopilotChatResponse,
    RecommendedAction,
)
from app.services.llm_service import LlmService


class CopilotService:
    def __init__(self):
        self.llm_service = LlmService()

    async def chat(self, request: CopilotChatRequest) -> CopilotChatResponse:
        prompt = build_copilot_prompt(request.message, request.context)
        raw_output = await self.llm_service.generate(prompt)
        return self._parse_response(raw_output)

    def _parse_response(self, raw_output: str) -> CopilotChatResponse:
        try:
            cleaned = raw_output.strip()

            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned.replace("```", "").strip()

            parsed = json.loads(cleaned)

            actions = [
                RecommendedAction(
                    type=action.get("type", "NO_ACTION"),
                    label=action.get("label", "No action"),
                    payload=action.get("payload", {}),
                )
                for action in parsed.get("recommended_actions", [])
            ]

            return CopilotChatResponse(
                answer=parsed.get("answer", "No answer generated."),
                recommended_actions=actions,
                raw_model_output=raw_output,
            )
        except Exception:
            return CopilotChatResponse(
                answer=raw_output.strip() or "AI response was empty.",
                recommended_actions=[
                    RecommendedAction(
                        type="NO_ACTION",
                        label="No safe action detected",
                        payload={},
                    )
                ],
                raw_model_output=raw_output,
            )