import httpx

from app.core.config import settings


class BackendClient:
    def __init__(self):
        self.base_url = settings.NEST_BACKEND_BASE_URL.rstrip("/")
        self.api_key = settings.AI_INTERNAL_API_KEY

    async def call_tool(self, tool_name: str, company_id: str, arguments: dict):
        if tool_name == "get_dashboard_summary":
            return await self._post("/api/v1/internal/ai/dashboard-summary", company_id, arguments)

        if tool_name == "get_low_stock_products":
            return await self._post("/api/v1/internal/ai/low-stock", company_id, arguments)

        if tool_name == "get_pending_reorders":
            return await self._post("/api/v1/internal/ai/pending-reorders", company_id, arguments)

        if tool_name == "get_recent_stock_movements":
            return await self._post("/api/v1/internal/ai/recent-stock-movements", company_id, arguments)
        
        if tool_name == "create_reorder_request":
            return await self._post(
                "/api/v1/internal/ai/actions/create-reorder",
                company_id,
                arguments,
    )

        raise ValueError(f"Unknown tool: {tool_name}")

    async def _post(self, path: str, company_id: str, body: dict):
        url = f"{self.base_url}{path}"

        payload = {
            "companyId": company_id,
            **body,
        }

        headers = {
            "x-ai-internal-key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()