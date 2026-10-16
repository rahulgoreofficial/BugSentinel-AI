"""Main entrypoint for BugSentinel AI FastAPI application."""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes_findings import router as findings_router
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_runs import router as runs_router
from backend.app.api.routes_scenarios import router as scenarios_router
from backend.app.config import settings
from backend.app.database import init_db

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bugsentinel")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing BugSentinel AI backend services...")
    settings.ensure_directories()
    init_db()
    logger.info("SQLite database verified at: %s", settings.DB_PATH)
    logger.info("ShopDemo static target mounted from: %s", settings.DEMO_SITE_DIR)
    logger.info("Artifacts directory active at: %s", settings.ARTIFACTS_DIR)
    logger.info("BugSentinel AI backend ready.")
    yield
    logger.info("Shutting down BugSentinel AI backend.")


# Ensure directories exist prior to StaticFiles mount
settings.ensure_directories()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware for local Phase 2 frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router)
app.include_router(scenarios_router)
app.include_router(runs_router)
app.include_router(findings_router)

# Mount local ShopDemo testing target
if settings.DEMO_SITE_DIR.exists():
    app.mount(
        "/demo",
        StaticFiles(directory=str(settings.DEMO_SITE_DIR), html=True),
        name="demo",
    )

# Mount artifacts directory for safe screenshot & log retrieval
app.mount(
    "/artifacts",
    StaticFiles(directory=str(settings.ARTIFACTS_DIR)),
    name="artifacts",
)


@app.get("/", tags=["Root"])
def root_redirect():
    """Root endpoint welcoming visitors and linking to docs and demo."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "demo": "/demo/",
        "health": "/api/health",
        "description": settings.APP_DESCRIPTION,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
