from typing import Any

from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    name: str = Field(..., examples=["get_low_stock_products"])
    arguments: dict[str, Any] = Field(default_factory=dict)


class ToolDecision(BaseModel):
    needs_tool: bool
    tool_calls: list[ToolCall] = Field(default_factory=list)


class ToolResult(BaseModel):
    tool_name: str
    data: dict[str, Any]