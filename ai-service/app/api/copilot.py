from fastapi import APIRouter

from app.schemas.copilot_schema import CopilotChatRequest, CopilotChatResponse
from app.services.copilot_service import CopilotService

router = APIRouter(prefix="/copilot", tags=["Copilot"])

copilot_service = CopilotService()


@router.post("/chat", response_model=CopilotChatResponse)
async def chat(request: CopilotChatRequest):
    return await copilot_service.chat(request)