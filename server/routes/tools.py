"""Tool API routes"""
import logging
from fastapi import APIRouter
from typing import List

from ..tools.registry import AVAILABLE_TOOLS, ToolDefinition

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/tools")
async def list_tools() -> List[dict]:
    """GET /api/tools - List all available tools"""
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "requiresApiKey": t.requires_api_key,
        }
        for t in AVAILABLE_TOOLS
    ]


@router.get("/tools/categories")
async def list_categories() -> List[str]:
    """GET /api/tools/categories - List all tool categories"""
    return list(set(t.category for t in AVAILABLE_TOOLS))
