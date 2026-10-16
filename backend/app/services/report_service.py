"""Report and finding generation service for BugSentinel AI.

Translates scenario execution results into structured bug findings with associated
evidence (screenshots, execution logs, reproduction verification).
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
from typing import List, Optional
import uuid

from backend.app.config import settings
from backend.app.schemas import (
    FindingClassification,
    FindingResponse,
    ScenarioResult,
    SeverityLevel,
    TestStatus,
)

logger = logging.getLogger("bugsentinel.report_service")


class ReportService:
    """Creates structured findings, saves execution logs, and manages test artifacts."""

    def determine_severity(self, scenario_id: str, classification: FindingClassification) -> SeverityLevel:
        """Assign rational severity levels based on business impact."""
        if classification == FindingClassification.POTENTIALLY_FLAKY:
            return SeverityLevel.LOW

        if scenario_id == "valid_checkout_succeeds":
            # Core revenue path failure
            return SeverityLevel.CRITICAL

        if scenario_id == "invalid_email_is_rejected":
            # Email validation defect accepts invalid customer contact info
            return SeverityLevel.MEDIUM

        if scenario_id == "homepage_loads":
            # Site completely unavailable
            return SeverityLevel.CRITICAL

        return SeverityLevel.MEDIUM

    def generate_findings(
        self,
        run_id: str,
        results: List[ScenarioResult],
    ) -> List[FindingResponse]:
        """
        Extract bug findings from scenario results.
        Only generates findings for confirmed application assertion failures or flaky behavior,
        not for environmental infrastructure errors.
        """
        findings: List[FindingResponse] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for res in results:
            # We create findings for assertion failures (reproducible or flaky)
            if res.classification in (
                FindingClassification.REPRODUCIBLE_FAILURE,
                FindingClassification.POTENTIALLY_FLAKY,
            ):
                finding_id = f"fnd_{uuid.uuid4().hex[:8]}"
                first_attempt = res.attempts[0] if res.attempts else None
                verif_attempt = res.attempts[1] if len(res.attempts) > 1 else None

                # Find best screenshot URL (prefer verification attempt if available, else first)
                screenshot_url = None
                if verif_attempt and verif_attempt.screenshot_url:
                    screenshot_url = verif_attempt.screenshot_url
                elif first_attempt and first_attempt.screenshot_url:
                    screenshot_url = first_attempt.screenshot_url

                # Consolidate logs across attempts
                combined_logs: List[str] = []
                for att in res.attempts:
                    combined_logs.append(f"--- Attempt {att.attempt_number} Logs ---")
                    combined_logs.extend(att.logs)

                reproducible = res.classification == FindingClassification.REPRODUCIBLE_FAILURE
                severity = self.determine_severity(res.scenario_id, res.classification)

                title = f"Defect in {res.title}"
                if res.scenario_id == "invalid_email_is_rejected":
                    title = "Checkout accepts invalid email address format"
                    description = (
                        "The application fails to validate the email format during checkout. "
                        "When an invalid string such as 'not-an-email' is provided, the order is accepted "
                        "and success confirmation is returned instead of displaying a field error."
                    )
                else:
                    description = (
                        f"Expected application behavior was not observed during testing of '{res.title}'. "
                        f"Expected: {res.expected_behavior}. Actual: {res.actual_behavior}."
                    )

                finding = FindingResponse(
                    finding_id=finding_id,
                    run_id=run_id,
                    scenario_id=res.scenario_id,
                    title=title,
                    description=description,
                    severity=severity,
                    classification=res.classification,
                    expected_behavior=res.expected_behavior,
                    actual_behavior=res.actual_behavior or "Unexpected behavior observed.",
                    first_attempt_status=first_attempt.status if first_attempt else TestStatus.FAIL,
                    verification_attempt_status=verif_attempt.status if verif_attempt else None,
                    reproducible=reproducible,
                    screenshot_url=screenshot_url,
                    logs=combined_logs,
                    created_at=now_iso,
                )
                findings.append(finding)

        return findings

    def write_execution_log(
        self,
        run_id: str,
        results: List[ScenarioResult],
        artifacts_dir: Optional[Path] = None,
    ) -> Path:
        """Write execution.log inside run's artifact directory."""
        target_dir = (artifacts_dir or settings.ARTIFACTS_DIR) / run_id
        target_dir.mkdir(parents=True, exist_ok=True)
        log_file = target_dir / "execution.log"

        lines: List[str] = [
            f"============================================================",
            f"BugSentinel AI Test Run Log - Run ID: {run_id}",
            f"Generated: {datetime.now(timezone.utc).isoformat()}",
            f"============================================================",
            "",
        ]

        for res in results:
            lines.append(f"SCENARIO: {res.scenario_id} [{res.title}]")
            lines.append(f"STATUS: {res.status.value} | CLASSIFICATION: {res.classification.value if res.classification else 'NONE'}")
            lines.append(f"DURATION: {res.duration_ms} ms | ATTEMPTS: {len(res.attempts)}")
            lines.append(f"EXPECTED: {res.expected_behavior}")
            lines.append(f"ACTUAL:   {res.actual_behavior}")
            lines.append("LOGS:")
            for att in res.attempts:
                lines.append(f"  [Attempt {att.attempt_number} (status={att.status.value}, duration={att.duration_ms}ms)]")
                for entry in att.logs:
                    lines.append(f"    {entry}")
                if att.screenshot_url:
                    lines.append(f"    [screenshot] {att.screenshot_url}")
            lines.append("-" * 60)

        log_file.write_text("\n".join(lines), encoding="utf-8")
        return log_file


report_service = ReportService()
