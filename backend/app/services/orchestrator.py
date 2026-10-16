"""Test run orchestration service for BugSentinel AI.

Coordinates scenario planning, browser execution, failure verification,
finding generation, and SQLite persistence.
"""

from __future__ import annotations

from datetime import datetime, timezone
import logging
from pathlib import Path
from typing import List, Optional
import uuid

from backend.app.config import settings
from backend.app.database import save_finding, save_run
from backend.app.schemas import (
    FindingClassification,
    FindingResponse,
    RunCreateRequest,
    RunResponse,
    RunStatus,
    ScenarioResult,
    TestStatus,
)
from backend.app.services.planner import planner
from backend.app.services.report_service import report_service
from backend.app.services.verifier import verifier

logger = logging.getLogger("bugsentinel.orchestrator")


class Orchestrator:
    """Orchestrates end-to-end test execution workflow."""

    def execute_run(
        self,
        request: RunCreateRequest,
        db_path: Optional[Path | str] = None,
        custom_target_url: Optional[str] = None,
        custom_artifacts_dir: Optional[Path] = None,
    ) -> RunResponse:
        """
        Execute an end-to-end test run against the target application.

        Steps:
        1. Validate target and scenarios.
        2. Create run record in SQLite.
        3. Execute each scenario with bounded verification.
        4. Generate structured findings and execution log.
        5. Persist final results and return RunResponse.
        """
        # Validate target application
        if request.target_id.lower() != "shopdemo":
            raise ValueError(
                f"Target '{request.target_id}' is not supported. BugSentinel AI Phase 1 supports 'shopdemo'."
            )

        # Validate scenarios
        scenario_ids = request.scenario_ids or planner.get_default_scenario_ids()
        scenario_definitions = planner.validate_scenario_ids(scenario_ids)

        target_url = custom_target_url or settings.demo_url
        artifacts_dir = custom_artifacts_dir or settings.ARTIFACTS_DIR

        run_id = f"run_{uuid.uuid4().hex[:8]}"
        start_time_iso = datetime.now(timezone.utc).isoformat()

        # Initial run record (persisted to SQLite)
        initial_run_dict = {
            "run_id": run_id,
            "target_id": request.target_id,
            "status": RunStatus.RUNNING.value,
            "started_at": start_time_iso,
            "completed_at": None,
            "duration_ms": 0,
            "total_tests": len(scenario_definitions),
            "passed_count": 0,
            "failed_count": 0,
            "flaky_count": 0,
            "error_count": 0,
            "result_json": "{}",
        }
        save_run(initial_run_dict, db_path=db_path)

        results: List[ScenarioResult] = []

        # Execute scenarios
        for s_def in scenario_definitions:
            res = verifier.verify_scenario(
                scenario_id=s_def.scenario_id,
                scenario_title=s_def.title,
                target_url=target_url,
                run_id=run_id,
                verify_failures=request.verify_failures,
                artifacts_dir=artifacts_dir,
            )
            results.append(res)

        # Calculate metrics
        completed_time_iso = datetime.now(timezone.utc).isoformat()
        total_duration_ms = sum(r.duration_ms for r in results)
        passed_count = sum(1 for r in results if r.status == TestStatus.PASS)
        failed_count = sum(1 for r in results if r.status == TestStatus.FAIL)
        flaky_count = sum(
            1 for r in results if r.classification == FindingClassification.POTENTIALLY_FLAKY
        )
        error_count = sum(1 for r in results if r.status == TestStatus.ERROR)

        # Generate findings for detected defects
        findings = report_service.generate_findings(run_id=run_id, results=results)

        # Write run execution.log artifact
        report_service.write_execution_log(
            run_id=run_id,
            results=results,
            artifacts_dir=artifacts_dir,
        )

        final_run_response = RunResponse(
            run_id=run_id,
            status=RunStatus.COMPLETED,
            target_id=request.target_id,
            started_at=start_time_iso,
            completed_at=completed_time_iso,
            duration_ms=total_duration_ms,
            total_tests=len(results),
            passed_count=passed_count,
            failed_count=failed_count,
            flaky_count=flaky_count,
            error_count=error_count,
            results=results,
            findings=findings,
        )

        # Persist completed run and findings
        save_run(final_run_response.model_dump(), db_path=db_path)
        for f in findings:
            save_finding(f.model_dump(), db_path=db_path)

        return final_run_response


orchestrator = Orchestrator()
