"""Bug finding and regression retesting routes for BugSentinel AI."""

from __future__ import annotations

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.database import get_finding, list_findings
from backend.app.schemas import FindingResponse, RegressionResponse
from backend.app.services.regression_service import regression_service

logger = logging.getLogger("bugsentinel.api.findings")
router = APIRouter(prefix="/api/v1", tags=["Findings & Regression"])


@router.get("/findings", response_model=List[FindingResponse])
def get_findings(
    run_id: Optional[str] = Query(None, description="Filter findings by specific run ID"),
    limit: int = Query(50, ge=1, le=100),
) -> List[FindingResponse]:
    """Retrieve persisted bug findings with evidence and logs."""
    rows = list_findings(run_id=run_id, limit=limit)
    return [FindingResponse(**r) for r in rows]


@router.get("/findings/{finding_id}", response_model=FindingResponse)
def get_finding_by_id(finding_id: str) -> FindingResponse:
    """Retrieve details and evidence for a specific bug finding."""
    finding_dict = get_finding(finding_id)
    if not finding_dict:
        raise HTTPException(
            status_code=404,
            detail=f"Bug finding with ID '{finding_id}' not found.",
        )
    return FindingResponse(**finding_dict)


@router.post("/findings/{finding_id}/regression", response_model=RegressionResponse)
def run_regression_test(finding_id: str) -> RegressionResponse:
    """
    Rerun the scenario that caused a specific finding to verify if the defect has been resolved.
    """
    try:
        regression_result = regression_service.run_regression_for_finding(finding_id)
        return regression_result
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as exc:
        logger.exception("Error executing regression test for finding '%s': %s", finding_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Regression retest failed due to an internal error: {str(exc)}",
        )
