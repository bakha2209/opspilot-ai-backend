import httpx

from app.core.config import settings


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

        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        return data.get("response", "")