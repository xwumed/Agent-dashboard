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
                request.api_endpoint,
                request.global_model,
                request.global_temperature,
                request.global_max_tokens,
                request.global_reasoning_effort,
                request.global_thinking,
                request.endpoint_configs
            ):
                event_count += 1
                logger.info(f"Streaming event: {event['type']} {event.get('nodeId', '')}")
                yield json.dumps(event) + "\n"

            logger.info(f"Simulation complete, streamed {event_count} events")

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    # Handle non-streaming request
    if request.stream is False:
        logger.info(f"Running synchronous simulation for topology: {request.topology.name}")
        final_result = None
        error_msg = None
        
        try:
            async for event in execute_simulation_stream(
                request.topology,
                request.api_key,
                request.api_endpoint,
                request.global_model,
                request.global_temperature,
                request.global_max_tokens,
                request.global_reasoning_effort,
                request.global_thinking,
                request.endpoint_configs
            ):
                if event["type"] == "complete":
                    # Format as SimulationResponse (success=True)
                    final_result = {
                        "success": True,
                        "results": event["results"],
                        "executionOrder": event["executionOrder"],
                        "masterTask": event.get("masterTask"),
                        "outputFiles": event.get("outputFiles", []),
                        "debugLogs": event.get("debugLogs", [])
                    }
                elif event["type"] == "error":
                     error_msg = event.get("error", "Unknown error")
            
            if final_result:
                return final_result
            else:
                return {
                    "success": False, 
                    "error": error_msg or "Simulation finished without valid result",
                    "results": {}
                }
                
        except Exception as e:
            logger.error(f"Sync simulation error: {e}")
            return {"success": False, "error": str(e), "results": {}}

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


@router.post("/test-connection")
async def test_connection(request: dict):
    """
    POST /api/test-connection
    Test if the API connection is working with the provided credentials.
    Can test a single model or multiple models.
    """
    from openai import AsyncOpenAI
    import asyncio
    
    api_key = request.get("apiKey")
    api_endpoint = request.get("apiEndpoint")
    models = request.get("models", [])  # List of models to test
    model = request.get("model")  # Single model (backward compatible)
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")
    
    # If single model provided, convert to list
    if model and not models:
        models = [model]
    
    if not models:
        raise HTTPException(status_code=400, detail="At least one model is required")
    
    # Configure client
    client_kwargs = {"api_key": api_key}
    if api_endpoint and api_endpoint != "https://api.openai.com":
        # Ensure endpoint ends with /v1 or similar
        base_url = api_endpoint
        if not base_url.endswith('/v1') and not base_url.endswith('/v1/'):
            base_url = f"{base_url}/v1" if not base_url.endswith('/') else f"{base_url}v1"
        client_kwargs["base_url"] = base_url
    
    client = AsyncOpenAI(**client_kwargs)
    
    async def test_single_model(model_name: str) -> dict:
        """Test a single model and return result"""
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Say 'OK' in one word."}],
                max_tokens=10
            )
            output = response.choices[0].message.content if response.choices else None
            return {
                "model": model_name,
                "success": True,
                "response": output
            }
        except Exception as e:
            return {
                "model": model_name,
                "success": False,
                "error": str(e)
            }
    
    # Test all models concurrently
    results = await asyncio.gather(*[test_single_model(m) for m in models])
    
    # Summary
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    return {
        "success": len(failed) == 0,
        "total": len(models),
        "successCount": len(successful),
        "failedCount": len(failed),
        "results": results,
        "message": f"{len(successful)}/{len(models)} models available"
    }


@router.post("/list-models")
async def list_models(request: dict):
    """
    POST /api/list-models
    Get list of available models from an API endpoint.
    Works with OpenAI-compatible APIs (including local LLM servers).
    """
    from openai import AsyncOpenAI
    
    api_key = request.get("apiKey", "EMPTY")
    api_endpoint = request.get("apiEndpoint")
    
    if not api_endpoint:
        raise HTTPException(status_code=400, detail="API endpoint is required")
    
    try:
        # Configure client
        base_url = api_endpoint
        if not base_url.endswith('/v1') and not base_url.endswith('/v1/'):
            base_url = f"{base_url}/v1" if not base_url.endswith('/') else f"{base_url}v1"
        
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Get list of models
        models_response = await client.models.list()
        
        # Extract model IDs
        all_model_ids = [model.id for model in models_response.data]
        
        # Return all models regardless of endpoint type
        # Users can filter manually if needed, or we can trust them to know what they want
        model_ids = all_model_ids
        
        return {
            "success": True,
            "models": model_ids,
            "count": len(model_ids),
            "message": f"Found {len(model_ids)} models"
        }
        
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        return {
            "success": False,
            "models": [],
            "count": 0,
            "error": str(e),
            "message": f"Failed to list models: {str(e)}"
        }
