import json
import re
from collections.abc import AsyncGenerator
from app.core.config import settings
from app.prompts.copilot_prompt import build_copilot_prompt
from app.prompts.tool_decision_prompt import build_tool_decision_prompt
from app.schemas.copilot_schema import (
    CopilotChatRequest,
    CopilotChatResponse,
    PendingAction,
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
        tool_results = await self._execute_tools(request)

        prompt = build_copilot_prompt(
            message=request.message,
            context=request.context,
            tool_results=tool_results,
            action_confirmed=request.confirmed_action is not None,
        )

        raw_output = await self.llm_service.generate(
            prompt,
            max_tokens=settings.OLLAMA_RESPONSE_MAX_TOKENS,
            json_output=True,
        )

        return self._parse_response(raw_output)

    async def _decide_tools(
        self,
        message: str,
        history: list[dict] | None = None,
        confirmed_action: dict | None = None,
    ) -> ToolDecision:
        prompt = build_tool_decision_prompt(message, history, confirmed_action)
        raw_output = await self.llm_service.generate(
            prompt,
            max_tokens=settings.OLLAMA_TOOL_MAX_TOKENS,
            json_output=True,
        )

        try:
            cleaned = self._clean_json_output(raw_output)
            parsed = json.loads(cleaned)
            return ToolDecision(**parsed)
        except Exception:
            return ToolDecision(
                needs_tool=False,
                tool_calls=[],
            )

    async def _execute_tools(self, request: CopilotChatRequest) -> list[dict]:
        if request.confirmed_action is not None:
            action = request.confirmed_action

            if action.tool_name != "create_reorder_request":
                raise ValueError(f"Unsupported confirmed action: {action.tool_name}")

            result = await self.backend_client.call_tool(
                action.tool_name,
                request.company_id,
                action.arguments,
            )
            return [{"tool_name": action.tool_name, "data": result}]

        tool_decision = await self._decide_tools(
            request.message,
            [item.model_dump() for item in request.history],
        )
        tool_results = []

        if not tool_decision.needs_tool:
            return tool_results

        for tool_call in tool_decision.tool_calls:
            # Write tools must only be executed from the confirmed_action branch above.
            if tool_call.name == "create_reorder_request":
                continue

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

        return tool_results

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
            pending_action_data = parsed.get("pending_action")
            pending_action = (
                PendingAction(**pending_action_data)
                if pending_action_data
                else None
            )

            return CopilotChatResponse(
                answer=parsed.get("answer", "No answer generated."),
                recommended_actions=actions,
                pending_action=pending_action,
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
        cleaned = re.sub(
            r"<think>.*?</think>",
            "",
            raw_output,
            flags=re.DOTALL | re.IGNORECASE,
        ).strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "").strip()

        object_start = cleaned.find("{")
        if object_start >= 0:
            try:
                _, end = json.JSONDecoder().raw_decode(cleaned[object_start:])
                return cleaned[object_start : object_start + end]
            except json.JSONDecodeError:
                pass

        return cleaned

    async def chat_stream(
        self, request: CopilotChatRequest
    ) -> AsyncGenerator[str, None]:
        tool_results = await self._execute_tools(request)

        prompt = build_copilot_prompt(
            message=request.message,
            context=request.context,
            tool_results=tool_results,
            action_confirmed=request.confirmed_action is not None,
        )

        async for token in self.llm_service.stream(prompt):
            yield token
