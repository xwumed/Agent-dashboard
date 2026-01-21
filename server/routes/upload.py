from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from pathlib import Path
from typing import List, Optional
import time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Base directory for uploads
UPLOAD_DIR = Path(__file__).parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    directory: Optional[str] = None
):
    """
    Upload one or more files.
    If 'directory' mode is implied by client structure, files are saved there.
    Returns list of saved file paths.
    """
    saved_paths = []
    
    try:
        # Create a unique batch directory for this upload session to avoid collisions
        timestamp = int(time.time())
        session_dir = UPLOAD_DIR / str(timestamp)
        session_dir.mkdir(exist_ok=True)

        for file in files:
            if not file.filename:
                continue
                
            # Sanitize filename
            filename = os.path.basename(file.filename)
            file_path = session_dir / filename
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Return absolute path or relative? Absolute for backend usage.
            saved_paths.append(str(file_path.absolute()))
            
        return {
            "saved_paths": saved_paths,
            "directory": str(session_dir.absolute())
        }

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
