"""
File browser API for navigating local filesystem.
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter()

class BrowseRequest(BaseModel):
    path: Optional[str] = None

class FileItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: Optional[int] = None

class BrowseResponse(BaseModel):
    current_path: str
    parent_path: Optional[str]
    items: List[FileItem]

@router.post("/api/browse", response_model=BrowseResponse)
async def browse_directory(request: BrowseRequest):
    """
    Browse a directory and return its contents.
    If no path provided, returns common starting locations.
    """
    try:
        # Default to user's home directory if no path specified
        if not request.path:
            path = Path.home()
        else:
            path = Path(request.path)
        
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {request.path}")
        
        # If it's a file, return parent directory
        if path.is_file():
            path = path.parent
        
        # Get parent path
        parent_path = str(path.parent) if path.parent != path else None
        
        # List directory contents
        items: List[FileItem] = []
        try:
            for item in sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                try:
                    # Skip hidden files and system files
                    if item.name.startswith('.') or item.name.startswith('$'):
                        continue
                    
                    is_dir = item.is_dir()
                    size = None
                    
                    # Only get size for JSON files
                    if not is_dir and item.suffix.lower() == '.json':
                        try:
                            size = item.stat().st_size
                        except:
                            pass
                    
                    # Only include directories and JSON files
                    if is_dir or item.suffix.lower() == '.json':
                        items.append(FileItem(
                            name=item.name,
                            path=str(item.absolute()),
                            is_dir=is_dir,
                            size=size
                        ))
                except PermissionError:
                    continue
                except Exception:
                    continue
                    
        except PermissionError:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        return BrowseResponse(
            current_path=str(path.absolute()),
            parent_path=parent_path,
            items=items
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drives")
async def list_drives():
    """
    List available drives (Windows) or root paths.
    """
    drives = []
    
    if os.name == 'nt':  # Windows
        import string
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            if os.path.exists(drive):
                drives.append({"name": f"{letter}:", "path": drive})
    else:  # Unix-like
        drives.append({"name": "/", "path": "/"})
        # Add home directory
        drives.append({"name": "Home", "path": str(Path.home())})
    
    return {"drives": drives}
