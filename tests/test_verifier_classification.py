"""Unit tests for bounded failure verification, reproducibility classification, and reporting."""

from pathlib import Path
from unittest.mock import MagicMock

from backend.app.schemas import FindingClassification, ScenarioAttempt, TestStatus
from backend.app.services.report_service import report_service
from backend.app.services.verifier import Verifier


def test_verifier_passes_on_first_try(tmp_path):
    """When attempt 1 passes, no verification retry is executed."""
    mock_engine = MagicMock()
    mock_engine.execute_attempt.return_value = (
        ScenarioAttempt(
            attempt_number=1,
            status=TestStatus.PASS,
            duration_ms=100,
            error_message=None,
            logs=["ok"],
        ),
        "Expected heading visible",
        "Heading visible",
    )

    v = Verifier(engine=mock_engine)
    result = v.verify_scenario(
        scenario_id="homepage_loads",
        scenario_title="Homepage Loads",
        target_url="http://test",
        run_id="run_1",
        verify_failures=True,
        artifacts_dir=tmp_path,
    )

    assert result.status == TestStatus.PASS
    assert result.classification is None
    assert len(result.attempts) == 1
    assert mock_engine.execute_attempt.call_count == 1


def test_verifier_classifies_reproducible_failure(tmp_path):
    """When attempt 1 fails and attempt 2 also fails, classify as REPRODUCIBLE_FAILURE."""
    mock_engine = MagicMock()
    mock_engine.execute_attempt.side_effect = [
        (
            ScenarioAttempt(
                attempt_number=1,
                status=TestStatus.FAIL,
                duration_ms=150,
                error_message="Accepted invalid email",
                logs=["attempt 1 fail"],
            ),
            "Reject email",
            "Accepted email",
        ),
        (
            ScenarioAttempt(
                attempt_number=2,
                status=TestStatus.FAIL,
                duration_ms=160,
                error_message="Accepted invalid email",
                logs=["attempt 2 fail"],
            ),
            "Reject email",
            "Accepted email",
        ),
    ]

    v = Verifier(engine=mock_engine)
    result = v.verify_scenario(
        scenario_id="invalid_email_is_rejected",
        scenario_title="Reject Invalid Email",
        target_url="http://test",
        run_id="run_2",
        verify_failures=True,
        artifacts_dir=tmp_path,
    )

    assert result.status == TestStatus.FAIL
    assert result.classification == FindingClassification.REPRODUCIBLE_FAILURE
    assert len(result.attempts) == 2
    assert mock_engine.execute_attempt.call_count == 2


def test_verifier_classifies_flaky_test(tmp_path):
    """When attempt 1 fails but attempt 2 passes, classify as POTENTIALLY_FLAKY."""
    mock_engine = MagicMock()
    mock_engine.execute_attempt.side_effect = [
        (
            ScenarioAttempt(
                attempt_number=1,
                status=TestStatus.FAIL,
                duration_ms=150,
                error_message="Transient mismatch",
                logs=["attempt 1 fail"],
            ),
            "Expected A",
            "Actual B",
        ),
        (
            ScenarioAttempt(
                attempt_number=2,
                status=TestStatus.PASS,
                duration_ms=120,
                error_message=None,
                logs=["attempt 2 pass"],
            ),
            "Expected A",
            "Actual A",
        ),
    ]

    v = Verifier(engine=mock_engine)
    result = v.verify_scenario(
        scenario_id="valid_checkout_succeeds",
        scenario_title="Valid Checkout",
        target_url="http://test",
        run_id="run_3",
        verify_failures=True,
        artifacts_dir=tmp_path,
    )

    assert result.classification == FindingClassification.POTENTIALLY_FLAKY
    assert len(result.attempts) == 2
    assert "Intermittent" in result.actual_behavior


def test_verifier_handles_engine_error(tmp_path):
    """Infrastructure/engine errors are classified as ERROR without mistaking them for application bugs."""
    mock_engine = MagicMock()
    mock_engine.execute_attempt.return_value = (
        ScenarioAttempt(
            attempt_number=1,
            status=TestStatus.ERROR,
            duration_ms=50,
            error_message="Browser crash / connection refused",
            logs=["crash"],
        ),
        "Expected behavior",
        "Connection refused",
    )

    v = Verifier(engine=mock_engine)
    result = v.verify_scenario(
        scenario_id="homepage_loads",
        scenario_title="Homepage Loads",
        target_url="http://test",
        run_id="run_4",
        verify_failures=True,
        artifacts_dir=tmp_path,
    )

    assert result.status == TestStatus.ERROR
    assert result.classification == FindingClassification.ERROR
    assert len(result.attempts) == 1


def test_report_service_generates_finding_and_log(tmp_path):
    """Report service converts failing scenario results into structured findings and logs."""
    from backend.app.schemas import ScenarioResult

    res = ScenarioResult(
        scenario_id="invalid_email_is_rejected",
        title="Verify Checkout Rejects Invalid Email Address",
        status=TestStatus.FAIL,
        classification=FindingClassification.REPRODUCIBLE_FAILURE,
        duration_ms=300,
        attempts=[
            ScenarioAttempt(
                attempt_number=1,
                status=TestStatus.FAIL,
                duration_ms=150,
                error_message="Accepted invalid email",
                screenshot_url="/artifacts/run_5/invalid_email_attempt_1.png",
                logs=["log1"],
            ),
            ScenarioAttempt(
                attempt_number=2,
                status=TestStatus.FAIL,
                duration_ms=150,
                error_message="Accepted invalid email",
                screenshot_url="/artifacts/run_5/invalid_email_attempt_2.png",
                logs=["log2"],
            ),
        ],
        error_message="Accepted invalid email",
        expected_behavior="Should reject invalid email",
        actual_behavior="Accepted invalid email",
    )

    findings = report_service.generate_findings("run_5", [res])
    assert len(findings) == 1
    finding = findings[0]
    assert finding.scenario_id == "invalid_email_is_rejected"
    assert finding.reproducible is True
    assert finding.screenshot_url == "/artifacts/run_5/invalid_email_attempt_2.png"
    assert finding.severity.value == "MEDIUM"

    log_path = report_service.write_execution_log("run_5", [res], artifacts_dir=tmp_path)
    assert log_path.exists()
    content = log_path.read_text(encoding="utf-8")
    assert "BugSentinel AI Test Run Log" in content
    assert "REPRODUCIBLE_FAILURE" in content
