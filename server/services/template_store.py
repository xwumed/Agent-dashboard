"""Template storage service for persisting user-defined topologies"""
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class TemplateMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str


class Template(TemplateMetadata):
    topology: dict


class TemplateStore:
    """File-based template storage using JSON files"""
    
    def __init__(self, storage_dir: Optional[Path] = None):
        if storage_dir is None:
            storage_dir = Path(__file__).parent.parent / "data" / "templates"
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_path(self, template_id: str) -> Path:
        return self.storage_dir / f"{template_id}.json"
    
    def list_templates(self) -> list[TemplateMetadata]:
        """List all available templates (metadata only)"""
        templates = []
        for file in self.storage_dir.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    templates.append(TemplateMetadata(
                        id=data["id"],
                        name=data["name"],
                        description=data.get("description"),
                        created_at=data["created_at"],
                        updated_at=data["updated_at"]
                    ))
            except (json.JSONDecodeError, KeyError):
                continue
        return sorted(templates, key=lambda t: t.updated_at, reverse=True)
    
    def get_template(self, template_id: str) -> Optional[Template]:
        """Get a specific template by ID"""
        path = self._get_path(template_id)
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return Template(**data)
        except (json.JSONDecodeError, KeyError):
            return None
    
    def save_template(
        self,
        name: str,
        topology: dict,
        description: Optional[str] = None,
        template_id: Optional[str] = None
    ) -> Template:
        """Save or update a template"""
        now = datetime.utcnow().isoformat() + "Z"
        
        if template_id:
            existing = self.get_template(template_id)
            if existing:
                created_at = existing.created_at
            else:
                created_at = now
        else:
            template_id = str(uuid4())[:8]
            created_at = now
        
        template = Template(
            id=template_id,
            name=name,
            description=description,
            topology=topology,
            created_at=created_at,
            updated_at=now
        )
        
        path = self._get_path(template_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(template.model_dump(), f, indent=2, ensure_ascii=False)
        
        return template
    
    def delete_template(self, template_id: str) -> bool:
        """Delete a template by ID"""
        path = self._get_path(template_id)
        if path.exists():
            path.unlink()
            return True
        return False


# Global instance
template_store = TemplateStore()
