from fastapi import FastAPI

from app.core.config import settings
from app.schemas.copilot_schema import CopilotChatRequest, CopilotChatResponse
from app.services.copilot_service import CopilotService

app = FastAPI(title=settings.APP_NAME)

copilot_service = CopilotService()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
    }


@app.post(f"{settings.API_PREFIX}/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat(request: CopilotChatRequest):
    return await copilot_service.chat(request)