"""Batch processing API routes"""
import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from ..services.batch_processor import batch_processor, BatchJobStatus

logger = logging.getLogger(__name__)

router = APIRouter()


class BatchJobRequest(BaseModel):
    input_dir: str  # 输入目录路径（包含 patient JSON 文件）
    output_dir: Optional[str] = None  # 输出目录路径（默认为 input_dir/results）
    template_id: str  # 使用的模板 ID


class BatchJobResponse(BaseModel):
    job_id: str
    message: str


@router.post("/batch/start")
async def start_batch_job(request: BatchJobRequest) -> BatchJobResponse:
    """POST /api/batch/start - Start a batch processing job"""
    
    input_path = Path(request.input_dir)
    if not input_path.exists():
        raise HTTPException(status_code=400, detail=f"Input directory not found: {request.input_dir}")
    
    if not input_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {request.input_dir}")
    
    # Default output directory
    output_dir = request.output_dir or str(input_path / "results")
    
    job_id = str(uuid.uuid4())[:8]
    job = batch_processor.create_job(
        job_id=job_id,
        input_dir=request.input_dir,
        output_dir=output_dir,
        template_id=request.template_id
    )
    
    # Count files
    json_files = list(input_path.glob("*.json"))
    
    logger.info(f"Created batch job {job_id}: {len(json_files)} files in {request.input_dir}")
    
    return BatchJobResponse(
        job_id=job_id,
        message=f"Batch job created with {len(json_files)} JSON files"
    )


@router.get("/batch/{job_id}/status")
async def get_batch_status(job_id: str) -> BatchJobStatus:
    """GET /api/batch/{job_id}/status - Get batch job status"""
    job = batch_processor.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.get_status()


@router.post("/batch/{job_id}/cancel")
async def cancel_batch_job(job_id: str) -> dict:
    """POST /api/batch/{job_id}/cancel - Cancel a running batch job"""
    job = batch_processor.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.cancel()
    return {"success": True, "message": "Job cancelled"}


@router.get("/batch/{job_id}/stream")
async def stream_batch_progress(job_id: str):
    """GET /api/batch/{job_id}/stream - Stream batch job progress as NDJSON"""
    job = batch_processor.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    async def mock_simulate(patient_data: dict, template_id: str) -> dict:
        """Mock simulation function - to be replaced with actual orchestrator"""
        # In production, this would call the actual simulation orchestrator
        # For now, return a placeholder result
        import asyncio
        await asyncio.sleep(1)  # Simulate processing time
        return {
            "patient_id": patient_data.get("patient_id", "unknown"),
            "template_id": template_id,
            "status": "simulated",
            "recommendation": "This is a placeholder result. Connect to actual orchestrator for real results."
        }
    
    async def event_generator():
        async for event in batch_processor.process_job(job, mock_simulate):
            yield json.dumps(event, ensure_ascii=False) + "\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson"
    )


@router.get("/batch/jobs")
async def list_batch_jobs() -> list[BatchJobStatus]:
    """GET /api/batch/jobs - List all batch jobs"""
    return [job.get_status() for job in batch_processor.jobs.values()]
