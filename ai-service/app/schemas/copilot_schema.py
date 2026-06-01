from typing import Any, Literal

from pydantic import BaseModel, Field


class CopilotChatRequest(BaseModel):
    company_id: str = Field(..., examples=["company-uuid"])
    user_id: str = Field(..., examples=["user-uuid"])
    message: str = Field(..., examples=["Which products should I reorder first?"])
    context: dict[str, Any] = Field(default_factory=dict)


class RecommendedAction(BaseModel):
    type: Literal[
        "VIEW_LOW_STOCK",
        "CREATE_REORDER_REQUEST",
        "APPROVE_REORDER_REQUEST",
        "VIEW_STOCK_MOVEMENTS",
        "NO_ACTION",
    ]
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CopilotChatResponse(BaseModel):
    answer: str
    recommended_actions: list[RecommendedAction] = Field(default_factory=list)
    raw_model_output: str | None = None