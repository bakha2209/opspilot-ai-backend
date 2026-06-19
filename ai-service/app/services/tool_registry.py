AVAILABLE_TOOLS = [
    {
        "name": "get_dashboard_summary",
        "description": "Get dashboard KPI summary including product count, warehouse count, low stock count, pending reorder count, and unread notification count.",
        "arguments": {},
    },
    {
        "name": "get_low_stock_products",
        "description": "Get inventory items where quantity is below or equal to safety stock.",
        "arguments": {},
    },
    {
        "name": "get_pending_reorders",
        "description": "Get pending reorder requests for the current company.",
        "arguments": {},
    },
    {
        "name": "get_recent_stock_movements",
        "description": "Get recent stock movement history.",
        "arguments": {
            "limit": "number, optional"
        },
    },
]