"""Failure verification and reproducibility classification service for BugSentinel AI.

Executes bounded verification reruns for failing assertions and classifies outcomes as
PASS, REPRODUCIBLE_FAILURE, POTENTIALLY_FLAKY, or ERROR.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Optional

from backend.app.config import settings
from backend.app.schemas import FindingClassification, ScenarioAttempt, ScenarioResult, TestStatus
from backend.app.services.browser_engine import BrowserEngine, browser_engine

logger = logging.getLogger("bugsentinel.verifier")


class Verifier:
    """Orchestrates initial execution and bounded verification of test scenarios."""

    def __init__(self, engine: Optional[BrowserEngine] = None) -> None:
        self.engine = engine or browser_engine

    def verify_scenario(
        self,
        scenario_id: str,
        scenario_title: str,
        target_url: str,
        run_id: str,
        verify_failures: bool = True,
        artifacts_dir: Optional[Path] = None,
    ) -> ScenarioResult:
        """
        Execute scenario and perform bounded verification if an assertion failure occurs.

        Max attempts: 2 (Initial + 1 Verification).
        """
        active_artifacts_dir = artifacts_dir or settings.ARTIFACTS_DIR
        attempts: List[ScenarioAttempt] = []

        # Attempt 1: Initial execution
        attempt1, exp1, act1 = self.engine.execute_attempt(
            scenario_id=scenario_id,
            target_url=target_url,
            run_id=run_id,
            attempt_number=1,
            artifacts_dir=active_artifacts_dir,
        )
        attempts.append(attempt1)

        expected_behavior = exp1 or "Expected application behavior as defined in scenario."
        actual_behavior = act1 or ("Passed without error." if attempt1.status == TestStatus.PASS else attempt1.error_message)

        # 1. Successful on first try
        if attempt1.status == TestStatus.PASS:
            return ScenarioResult(
                scenario_id=scenario_id,
                title=scenario_title,
                status=TestStatus.PASS,
                classification=None,
                duration_ms=attempt1.duration_ms,
                attempts=attempts,
                error_message=None,
                expected_behavior=expected_behavior,
                actual_behavior=actual_behavior,
            )

        # 2. Infrastructure / engine runtime error on first try
        if attempt1.status == TestStatus.ERROR:
            return ScenarioResult(
                scenario_id=scenario_id,
                title=scenario_title,
                status=TestStatus.ERROR,
                classification=FindingClassification.ERROR,
                duration_ms=attempt1.duration_ms,
                attempts=attempts,
                error_message=attempt1.error_message,
                expected_behavior=expected_behavior,
                actual_behavior=actual_behavior,
            )

        # 3. Application assertion failure (TestStatus.FAIL)
        # Check if verification reruns are disabled
        if not verify_failures:
            return ScenarioResult(
                scenario_id=scenario_id,
                title=scenario_title,
                status=TestStatus.FAIL,
                classification=FindingClassification.REPRODUCIBLE_FAILURE,
                duration_ms=attempt1.duration_ms,
                attempts=attempts,
                error_message=attempt1.error_message,
                expected_behavior=expected_behavior,
                actual_behavior=actual_behavior,
            )

        # Perform Attempt 2: Bounded verification retry
        logger.info(
            "Scenario '%s' failed assertion on attempt 1. Running verification attempt 2...",
            scenario_id,
        )
        attempt2, exp2, act2 = self.engine.execute_attempt(
            scenario_id=scenario_id,
            target_url=target_url,
            run_id=run_id,
            attempt_number=2,
            artifacts_dir=active_artifacts_dir,
        )
        attempts.append(attempt2)

        total_duration = attempt1.duration_ms + attempt2.duration_ms

        if attempt2.status == TestStatus.FAIL:
            # Assertion failed on both attempts -> Confirmed reproducible failure!
            classification = FindingClassification.REPRODUCIBLE_FAILURE
            status = TestStatus.FAIL
            final_actual = act2 or act1
        elif attempt2.status == TestStatus.PASS:
            # Failed first time but passed second time -> Potentially flaky
            classification = FindingClassification.POTENTIALLY_FLAKY
            status = TestStatus.FAIL
            final_actual = f"Intermittent: Failed on attempt 1 ({act1}), but passed on verification attempt 2."
        else:
            # Attempt 2 encountered an infrastructure error
            classification = FindingClassification.ERROR
            status = TestStatus.ERROR
            final_actual = f"First attempt failed ({act1}), but verification attempt crashed: {attempt2.error_message}"

        return ScenarioResult(
            scenario_id=scenario_id,
            title=scenario_title,
            status=status,
            classification=classification,
            duration_ms=total_duration,
            attempts=attempts,
            error_message=attempt1.error_message,
            expected_behavior=expected_behavior,
            actual_behavior=final_actual,
        )


verifier = Verifier()
