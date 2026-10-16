"""Test run execution and history retrieval routes for BugSentinel AI."""

from __future__ import annotations

import logging
from typing import List
from fastapi import APIRouter, HTTPException, Query

from backend.app.database import get_run, list_runs
from backend.app.schemas import RunCreateRequest, RunResponse, RunSummaryResponse
from backend.app.services.orchestrator import orchestrator

logger = logging.getLogger("bugsentinel.api.runs")
router = APIRouter(prefix="/api/v1", tags=["Runs"])


@router.post("/runs", response_model=RunResponse)
def create_run(request: RunCreateRequest) -> RunResponse:
    """
    Trigger a real automated browser test run.
    
    Executes specified scenarios via Playwright against the target application,
    verifies failures, collects screenshots and logs, and persists results.
    """
    try:
        run_response = orchestrator.execute_run(request)
        return run_response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        logger.exception("Unexpected error executing run: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Test run execution failed due to an internal error: {str(exc)}",
        )


@router.get("/runs", response_model=List[RunSummaryResponse])
def get_run_history(limit: int = Query(50, ge=1, le=100)) -> List[RunSummaryResponse]:
    """Retrieve historical test runs ordered by most recent first."""
    rows = list_runs(limit=limit)
    return [RunSummaryResponse(**r) for r in rows]


@router.get("/runs/{run_id}", response_model=RunResponse)
def get_run_details(run_id: str) -> RunResponse:
    """Retrieve complete results, scenario details, and findings for a specific run."""
    run_dict = get_run(run_id)
    if not run_dict:
        raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found.")
    return RunResponse(**run_dict)
