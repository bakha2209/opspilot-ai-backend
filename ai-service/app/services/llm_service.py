import httpx
import json
from collections.abc import AsyncGenerator
from app.core.config import settings


class LlmTimeoutError(RuntimeError):
    pass


class LlmService:
    async def generate(
        self,
        prompt: str,
        *,
        max_tokens: int | None = None,
        json_output: bool = False,
    ) -> str:
        if settings.LLM_PROVIDER == "ollama":
            return await self._generate_with_ollama(
                prompt,
                max_tokens=max_tokens,
                json_output=json_output,
            )

        raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")

    async def _generate_with_ollama(
        self,
        prompt: str,
        *,
        max_tokens: int | None,
        json_output: bool,
    ) -> str:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "think": False,
            "options": {
                "temperature": 0.1,
                "num_predict": max_tokens
                or settings.OLLAMA_RESPONSE_MAX_TOKENS,
            },
        }

        if json_output:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(
                timeout=settings.OLLAMA_REQUEST_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as exc:
            raise LlmTimeoutError(
                "The local AI model did not respond before the timeout."
            ) from exc

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
            "think": False,
            "options": {
                "temperature": 0.1,
                "num_predict": settings.OLLAMA_RESPONSE_MAX_TOKENS,
            },
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.OLLAMA_REQUEST_TIMEOUT_SECONDS
            ) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line:
                            continue

                        data = json.loads(line)
                        token = data.get("response", "")

                        if token:
                            yield token
        except httpx.TimeoutException as exc:
            raise LlmTimeoutError(
                "The local AI model did not respond before the timeout."
            ) from exc
