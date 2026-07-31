import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.copilot_schema import CopilotChatRequest, CopilotChatResponse
from app.services.copilot_service import CopilotService
from app.services.llm_service import LlmTimeoutError

router = APIRouter(prefix="/copilot", tags=["Copilot"])

copilot_service = CopilotService()


@router.post("/chat", response_model=CopilotChatResponse)
async def chat(request: CopilotChatRequest):
    try:
        return await copilot_service.chat(request)
    except LlmTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="An internal Copilot dependency is unavailable.",
        ) from exc


@router.post("/chat/stream")
async def chat_stream(request: CopilotChatRequest):
    async def event_generator():
        async for token in copilot_service.chat_stream(request):
            yield f"data: {token}\n\n"

        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
