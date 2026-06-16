from fastapi import FastAPI

from app.api.copilot import router as copilot_router
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

app.include_router(copilot_router, prefix=settings.API_PREFIX)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
    }