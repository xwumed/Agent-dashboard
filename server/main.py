"""Agent Dashboard Python Backend - FastAPI Server"""
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from .routes.simulation import router as simulation_router
from .routes.templates import router as templates_router
from .routes.tools import router as tools_router
from .routes.batch import router as batch_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
CLIENT_DIST_DIR = BASE_DIR / "client" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Agent Dashboard Python backend starting up...")
    yield
    logger.info("Agent Dashboard Python backend shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Agent Dashboard API",
    description="Visual multi-agent orchestration platform with Python backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(simulation_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(tools_router, prefix="/api")
app.include_router(batch_router, prefix="/api")


# Serve static files if client build exists
if CLIENT_DIST_DIR.exists():
    # Mount static files
    app.mount("/assets", StaticFiles(directory=CLIENT_DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA fallback - serve index.html for all non-API routes"""
        # Check if file exists in dist
        file_path = CLIENT_DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html (SPA routing)
        return FileResponse(CLIENT_DIST_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.getenv("PORT", 3006))
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
