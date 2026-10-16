"""Regression testing service for BugSentinel AI.

Enables targeted re-execution of previously identified defective scenarios
to verify whether application fixes successfully resolved the bug.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from backend.app.database import get_finding
from backend.app.schemas import RegressionResponse, RunCreateRequest
from backend.app.services.orchestrator import orchestrator

logger = logging.getLogger("bugsentinel.regression_service")


class RegressionService:
    """Executes regression verification runs linked to prior findings."""

    def run_regression_for_finding(
        self,
        finding_id: str,
        db_path: Optional[Path | str] = None,
        custom_target_url: Optional[str] = None,
        custom_artifacts_dir: Optional[Path] = None,
    ) -> RegressionResponse:
        """
        Locate original finding, extract its scenario ID, and execute a fresh regression test.
        """
        finding = get_finding(finding_id, db_path=db_path)
        if not finding:
            raise KeyError(f"Finding with ID '{finding_id}' not found.")

        scenario_id = finding["scenario_id"]
        logger.info(
            "Executing regression test for finding '%s' (Scenario: '%s')...",
            finding_id,
            scenario_id,
        )

        # Trigger fresh test run for this scenario
        request = RunCreateRequest(
            target_id="shopdemo",
            scenario_ids=[scenario_id],
            verify_failures=True,
        )

        regression_run = orchestrator.execute_run(
            request=request,
            db_path=db_path,
            custom_target_url=custom_target_url,
            custom_artifacts_dir=custom_artifacts_dir,
        )

        is_resolved = regression_run.passed_count > 0 and regression_run.failed_count == 0

        if is_resolved:
            msg = (
                f"Regression SUCCESS: Defect reported in finding '{finding_id}' "
                f"has been VERIFIED AS RESOLVED. Scenario '{scenario_id}' passed all assertions."
            )
        else:
            msg = (
                f"Regression FAILED: Defect reported in finding '{finding_id}' "
                f"is STILL REPRODUCIBLE. Scenario '{scenario_id}' failed assertion."
            )

        return RegressionResponse(
            original_finding_id=finding_id,
            scenario_id=scenario_id,
            regression_run=regression_run,
            defect_resolved=is_resolved,
            message=msg,
        )


regression_service = RegressionService()
