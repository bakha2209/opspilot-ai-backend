import httpx
import json
from collections.abc import AsyncGenerator
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

    async def stream(self, prompt: str) -> AsyncGenerator[str, None]:
        if settings.LLM_PROVIDER == "ollama":
            async for chunk in self._stream_with_ollama(prompt):
                yield chunk
            return

        raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")

    async def _stream_with_ollama(self, prompt: str) -> AsyncGenerator[str, None]:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    data = json.loads(line)
                    token = data.get("response", "")

                    if token:
                        yield token
