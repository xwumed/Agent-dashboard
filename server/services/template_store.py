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
    # Summary stats
    agent_count: Optional[int] = 0
    model_summary: Optional[str] = None
    input_summary: Optional[str] = None


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
                        updated_at=data["updated_at"],
                        agent_count=data.get("agent_count", 0),
                        model_summary=data.get("model_summary"),
                        input_summary=data.get("input_summary")
                    ))
            except (json.JSONDecodeError, KeyError) as e:
                # logger.warning(f"Skipping corrupt template {file}: {e}")
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
        
        # Calculate summaries from topology
        agent_nodes = topology.get("nodes", [])
        agent_count = len(agent_nodes)
        
        global_settings = topology.get("globalSettings") or {}
        # Handle case where globalSettings might be aliased in pydantic but we are dict access
        if "global_settings" in topology and not global_settings:
             global_settings = topology["global_settings"]
             
        model_summary = global_settings.get("model", "gpt-4o")
        
        input_nodes = topology.get("inputNodes") or topology.get("input_nodes", [])
        input_count = len(input_nodes)
        
        if input_count == 0:
            input_summary = "No Inputs"
        elif input_count == 1:
            input_summary = "1 Input"
        else:
            input_summary = f"{input_count} Inputs"
        
        # Refine input summary if possible (e.g. check for files)
        file_inputs = [n for n in input_nodes if n.get("inputType") == "file" or n.get("filepath")]
        if file_inputs:
            input_summary += f" ({len(file_inputs)} Files)"

        template = Template(
            id=template_id,
            name=name,
            description=description,
            topology=topology,
            created_at=created_at,
            updated_at=now,
            agent_count=agent_count,
            model_summary=model_summary,
            input_summary=input_summary
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
