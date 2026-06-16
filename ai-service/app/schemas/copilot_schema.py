from typing import Any

from pydantic import BaseModel, Field


class CopilotChatRequest(BaseModel):
    company_id: str
    user_id: str
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class RecommendedAction(BaseModel):
    type: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CopilotChatResponse(BaseModel):
    answer: str
    recommended_actions: list[RecommendedAction] = Field(default_factory=list)
    raw_model_output: str | None = None