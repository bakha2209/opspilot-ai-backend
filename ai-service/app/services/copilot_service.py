import json

from app.schemas.copilot_schema import (
    CopilotChatRequest,
    CopilotChatResponse,
    RecommendedAction,
)
from app.services.llm_service import LlmConnectionError, LlmService


class CopilotService:
    def __init__(self):
        self.llm_service = LlmService()

    async def chat(self, request: CopilotChatRequest) -> CopilotChatResponse:
        prompt = self._build_prompt(request)
        try:
            raw_output = await self.llm_service.generate(prompt)
        except LlmConnectionError as error:
            return CopilotChatResponse(
                answer=str(error),
                recommended_actions=[
                    RecommendedAction(
                        type="NO_ACTION",
                        label="LLM service unavailable",
                        payload={},
                    )
                ],
                raw_model_output=None,
            )

        return self._parse_response(raw_output)

    def _build_prompt(self, request: CopilotChatRequest) -> str:
        return f"""
You are OpsPilot AI, an operations copilot for a B2B SaaS inventory system.

Your job:
- Analyze inventory, stock movement, notifications, and reorder context.
- Answer clearly and professionally.
- Recommend safe backend actions only when useful.
- Do not invent product IDs or warehouse IDs.
- Use only the provided context.

User message:
{request.message}

System context JSON:
{json.dumps(request.context, ensure_ascii=False, indent=2)}

Return ONLY valid JSON with this shape:
{{
  "answer": "string",
  "recommended_actions": [
    {{
      "type": "VIEW_LOW_STOCK | CREATE_REORDER_REQUEST | APPROVE_REORDER_REQUEST | VIEW_STOCK_MOVEMENTS | NO_ACTION",
      "label": "string",
      "payload": {{}}
    }}
  ]
}}
"""

    def _parse_response(self, raw_output: str) -> CopilotChatResponse:
        try:
            parsed = json.loads(raw_output)

            actions = [
                RecommendedAction(
                    type=action.get("type", "NO_ACTION"),
                    label=action.get("label", "No action"),
                    payload=action.get("payload", {}),
                )
                for action in parsed.get("recommended_actions", [])
            ]

            return CopilotChatResponse(
                answer=parsed.get("answer", "I could not generate a proper answer."),
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
