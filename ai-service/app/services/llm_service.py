import httpx

from app.core.config import settings


class LlmConnectionError(Exception):
    pass


class LlmService:
    async def generate(self, prompt: str) -> str:
        if settings.LLM_PROVIDER == "ollama":
            return await self._generate_with_ollama(prompt)

        raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")

    async def _generate_with_ollama(self, prompt: str) -> str:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as exc:
            raise LlmConnectionError(
                f"Ollama is not reachable at {settings.OLLAMA_BASE_URL}. "
                "Start Ollama or update OLLAMA_BASE_URL."
            ) from exc

        return data.get("response", "")
