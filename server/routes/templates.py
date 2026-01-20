"""Template API routes"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..services.template_store import template_store, Template, TemplateMetadata

logger = logging.getLogger(__name__)

router = APIRouter()


class SaveTemplateRequest(BaseModel):
    name: str
    topology: dict
    description: Optional[str] = None
    id: Optional[str] = None


@router.get("/templates")
async def list_templates() -> list[TemplateMetadata]:
    """GET /api/templates - List all available templates"""
    return template_store.list_templates()


@router.get("/templates/{template_id}")
async def get_template(template_id: str) -> Template:
    """GET /api/templates/{id} - Get a specific template"""
    template = template_store.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/templates")
async def save_template(request: SaveTemplateRequest) -> Template:
    """POST /api/templates - Save or update a template"""
    logger.info(f"Saving template: {request.name}")
    return template_store.save_template(
        name=request.name,
        topology=request.topology,
        description=request.description,
        template_id=request.id
    )

class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.put("/templates/{template_id}")
async def update_template(template_id: str, request: UpdateTemplateRequest) -> Template:
    """PUT /api/templates/{id} - Update template metadata"""
    existing = template_store.get_template(template_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update with new values or keep existing
    return template_store.save_template(
        name=request.name or existing.name,
        topology=existing.topology,
        description=request.description if request.description is not None else existing.description,
        template_id=template_id
    )


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str) -> dict:
    """DELETE /api/templates/{id} - Delete a template"""
    if template_store.delete_template(template_id):
        return {"success": True, "message": "Template deleted"}
    raise HTTPException(status_code=404, detail="Template not found")

