import json
from collections.abc import AsyncGenerator
from urllib import request
from app.prompts.copilot_prompt import build_copilot_prompt
from app.prompts.tool_decision_prompt import build_tool_decision_prompt
from app.schemas.copilot_schema import (
    CopilotChatRequest,
    CopilotChatResponse,
    RecommendedAction,
)
from app.schemas.tool_schema import ToolDecision
from app.services.backend_client import BackendClient
from app.services.llm_service import LlmService


class CopilotService:
    def __init__(self):
        self.llm_service = LlmService()
        self.backend_client = BackendClient()

    async def chat(self, request: CopilotChatRequest) -> CopilotChatResponse:
        tool_results = []

        tool_decision = await self._decide_tools(request.message)

        if tool_decision.needs_tool:
            for tool_call in tool_decision.tool_calls:
                result = await self.backend_client.call_tool(
                    tool_call.name,
                    request.company_id,
                    tool_call.arguments,
                )

                tool_results.append(
                    {
                        "tool_name": tool_call.name,
                        "data": result,
                    }
                )

        prompt = build_copilot_prompt(
            message=request.message,
            context=request.context,
            tool_results=tool_results,
        )

        raw_output = await self.llm_service.generate(prompt)

        return self._parse_response(raw_output)

    async def _decide_tools(self, message: str) -> ToolDecision:
        prompt = build_tool_decision_prompt(message)
        raw_output = await self.llm_service.generate(prompt)

        try:
            cleaned = self._clean_json_output(raw_output)
            parsed = json.loads(cleaned)
            return ToolDecision(**parsed)
        except Exception:
            return ToolDecision(
                needs_tool=False,
                tool_calls=[],
            )

    def _parse_response(self, raw_output: str) -> CopilotChatResponse:
        try:
            cleaned = self._clean_json_output(raw_output)
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

    def _clean_json_output(self, raw_output: str) -> str:
        cleaned = raw_output.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "").strip()

        return cleaned

    async def chat_stream(
        self, request: CopilotChatRequest
    ) -> AsyncGenerator[str, None]:
        tool_results = []

        tool_decision = await self._decide_tools(request.message)

        if tool_decision.needs_tool:
            for tool_call in tool_decision.tool_calls:
                result = await self.backend_client.call_tool(
                    tool_call.name,
                    request.company_id,
                    tool_call.arguments,
                )

                tool_results.append(
                    {
                        "tool_name": tool_call.name,
                        "data": result,
                    }
                )

        prompt = build_copilot_prompt(
            message=request.message,
            context=request.context,
            tool_results=tool_results,
        )

        async for token in self.llm_service.stream(prompt):
            yield token
