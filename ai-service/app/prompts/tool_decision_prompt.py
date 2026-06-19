import json

from app.services.tool_registry import AVAILABLE_TOOLS


def build_tool_decision_prompt(message: str) -> str:
    return f"""
You are an AI routing agent for OpsPilot AI.

Decide whether the user request needs backend data.

Available tools:
{json.dumps(AVAILABLE_TOOLS, ensure_ascii=False, indent=2)}

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

If no backend data is needed:
{{
  "needs_tool": false,
  "tool_calls": []
}}
"""