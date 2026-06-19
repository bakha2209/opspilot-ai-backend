from typing import Any

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: str
    content: str


class CopilotChatRequest(BaseModel):
    company_id: str
    user_id: str
    message: str
    context: dict[str, Any] = Field(default_factory=dict)
    conversation_id: str | None = None
    history: list[ChatHistoryItem] = Field(default_factory=list)


class RecommendedAction(BaseModel):
    type: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CopilotChatResponse(BaseModel):
    answer: str
    recommended_actions: list[RecommendedAction] = Field(default_factory=list)
    raw_model_output: str | None = None
