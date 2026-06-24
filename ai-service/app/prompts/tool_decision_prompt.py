import json

from app.services.tool_registry import AVAILABLE_TOOLS


def build_tool_decision_prompt(
    message: str,
    history: list[dict] | None = None,
    confirmed_action: dict | None = None,
) -> str:
    return f"""
You are an AI routing agent for OpsPilot AI.

You decide whether the user request needs backend data or an action tool.

Available tools:
{json.dumps(AVAILABLE_TOOLS, ensure_ascii=False, indent=2)}

Safety rules:
- For read-only questions, use read tools.
- For create_reorder_request, call it ONLY if confirmed_action is provided.
- If user asks to create something but confirmed_action is null, do NOT call create_reorder_request yet.
- If the requested product is described relatively (for example "lowest stock"),
  call get_low_stock_products so the final response can identify it and ask for confirmation.
- If required IDs are missing, use read tools first to find relevant product/warehouse IDs.
- Never invent IDs.
- If uncertain, do not call action tools.

Confirmed action:
{json.dumps(confirmed_action, ensure_ascii=False, indent=2)}

Recent conversation history:
{json.dumps(history or [], ensure_ascii=False, indent=2)}

User message:
{message}

Return ONLY valid JSON with this exact shape:
{{
  "needs_tool": true,
  "tool_calls": [
    {{
      "name": "tool_name",
      "arguments": {{}}
    }}
  ]
}}

If no backend data/tool is needed:
{{
  "needs_tool": false,
  "tool_calls": []
}}
"""
