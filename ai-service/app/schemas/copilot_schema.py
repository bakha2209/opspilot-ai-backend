from typing import Any

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: str
    content: str


class PendingAction(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    confirmation_message: str


class CopilotChatRequest(BaseModel):
    company_id: str
    user_id: str
    message: str
    context: dict[str, Any] = Field(default_factory=dict)
    conversation_id: str | None = None
    history: list[ChatHistoryItem] = Field(default_factory=list)

    # Used only after user confirms an action
    confirmed_action: PendingAction | None = None


class RecommendedAction(BaseModel):
    type: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CopilotChatResponse(BaseModel):
    answer: str
    recommended_actions: list[RecommendedAction] = Field(default_factory=list)
    pending_action: PendingAction | None = None
    raw_model_output: str | None = None
