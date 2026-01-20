"""Batch processing service for running simulations on multiple patient JSON files"""
import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, List, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class BatchJobStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed
    total_files: int
    processed_files: int
    current_file: Optional[str] = None
    results: List[dict] = []
    errors: List[dict] = []
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class BatchJob:
    """Represents a batch processing job"""
    
    def __init__(self, job_id: str, input_dir: str, output_dir: str, template_id: str):
        self.job_id = job_id
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.template_id = template_id
        
        self.status = "pending"
        self.total_files = 0
        self.processed_files = 0
        self.current_file: Optional[str] = None
        self.results: List[dict] = []
        self.errors: List[dict] = []
        self.started_at: Optional[str] = None
        self.completed_at: Optional[str] = None
        self._cancelled = False
    
    def get_status(self) -> BatchJobStatus:
        return BatchJobStatus(
            job_id=self.job_id,
            status=self.status,
            total_files=self.total_files,
            processed_files=self.processed_files,
            current_file=self.current_file,
            results=self.results,
            errors=self.errors,
            started_at=self.started_at,
            completed_at=self.completed_at
        )
    
    def cancel(self):
        self._cancelled = True
        self.status = "cancelled"


class BatchProcessor:
    """Handles batch processing of patient JSON files"""
    
    def __init__(self):
        self.jobs: dict[str, BatchJob] = {}
    
    def create_job(
        self,
        job_id: str,
        input_dir: str,
        output_dir: str,
        template_id: str
    ) -> BatchJob:
        """Create a new batch job"""
        job = BatchJob(job_id, input_dir, output_dir, template_id)
        self.jobs[job_id] = job
        return job
    
    def get_job(self, job_id: str) -> Optional[BatchJob]:
        return self.jobs.get(job_id)
    
    def list_json_files(self, directory: Path) -> List[Path]:
        """List all JSON files in a directory"""
        if not directory.exists():
            return []
        return sorted(directory.glob("*.json"))
    
    async def process_job(
        self,
        job: BatchJob,
        simulate_func
    ) -> AsyncGenerator[dict, None]:
        """Process a batch job, yielding status updates"""
        job.status = "running"
        job.started_at = datetime.utcnow().isoformat() + "Z"
        
        # Get list of JSON files
        json_files = self.list_json_files(job.input_dir)
        job.total_files = len(json_files)
        
        if job.total_files == 0:
            job.status = "completed"
            job.completed_at = datetime.utcnow().isoformat() + "Z"
            yield {"event": "completed", "message": "No JSON files found"}
            return
        
        # Create output directory
        job.output_dir.mkdir(parents=True, exist_ok=True)
        
        yield {
            "event": "started",
            "total_files": job.total_files,
            "input_dir": str(job.input_dir)
        }
        
        for i, json_file in enumerate(json_files):
            if job._cancelled:
                yield {"event": "cancelled"}
                return
            
            job.current_file = json_file.name
            job.processed_files = i
            
            yield {
                "event": "processing",
                "file": json_file.name,
                "progress": i / job.total_files * 100
            }
            
            try:
                # Read patient data
                with open(json_file, "r", encoding="utf-8") as f:
                    patient_data = json.load(f)
                
                # Run simulation
                result = await simulate_func(patient_data, job.template_id)
                
                # Save result
                output_file = job.output_dir / f"{json_file.stem}_result.json"
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                
                job.results.append({
                    "file": json_file.name,
                    "status": "success",
                    "output": str(output_file)
                })
                
                yield {
                    "event": "file_completed",
                    "file": json_file.name,
                    "status": "success"
                }
                
            except Exception as e:
                logger.exception(f"Error processing {json_file.name}")
                job.errors.append({
                    "file": json_file.name,
                    "error": str(e)
                })
                
                yield {
                    "event": "file_error",
                    "file": json_file.name,
                    "error": str(e)
                }
        
        job.processed_files = job.total_files
        job.current_file = None
        job.status = "completed"
        job.completed_at = datetime.utcnow().isoformat() + "Z"
        
        yield {
            "event": "completed",
            "total": job.total_files,
            "success": len(job.results),
            "failed": len(job.errors)
        }


# Global instance
batch_processor = BatchProcessor()
