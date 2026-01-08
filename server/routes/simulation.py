"""Simulation API routes"""
import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime

from ..models import SimulationRequest
from ..services.orchestrator import execute_simulation_stream

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/simulate")
async def simulate(request: SimulationRequest):
    """
    POST /api/simulate
    Run a simulation with the given topology (streaming NDJSON response)
    """
    # Validate request
    if not request.topology:
        raise HTTPException(status_code=400, detail="Topology is required")

    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    if not request.topology.nodes or len(request.topology.nodes) == 0:
        raise HTTPException(status_code=400, detail="Topology must contain at least one node")

    async def event_generator():
        """Generate NDJSON stream of simulation events"""
        try:
            logger.info(
                f"Starting simulation stream for topology: {request.topology.name} "
                f"with {len(request.topology.nodes)} nodes"
            )
            event_count = 0

            async for event in execute_simulation_stream(
                request.topology,
                request.api_key,
                request.api_endpoint
            ):
                event_count += 1
                logger.info(f"Streaming event: {event['type']} {event.get('nodeId', '')}")
                yield json.dumps(event) + "\n"

            logger.info(f"Simulation complete, streamed {event_count} events")

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/health")
async def health():
    """
    GET /api/health
    Health check endpoint
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}
