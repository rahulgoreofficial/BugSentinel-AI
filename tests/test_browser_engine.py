"""End-to-end Playwright browser integration tests against the local ShopDemo target."""

from pathlib import Path
import pytest

from backend.app.config import settings
from backend.app.database import get_finding, get_run, init_db
from backend.app.schemas import FindingClassification, RunCreateRequest, TestStatus
from backend.app.services.browser_engine import browser_engine
from backend.app.services.orchestrator import orchestrator


@pytest.fixture
def target_url() -> str:
    """Return local file URI for ShopDemo index.html."""
    html_path = settings.DEMO_SITE_DIR / "index.html"
    assert html_path.exists(), f"ShopDemo HTML not found at {html_path}"
    return html_path.resolve().as_uri()


def test_homepage_loads_scenario(target_url, tmp_path):
    """Verify homepage_loads scenario executes in real Chromium and passes."""
    attempt, exp, act = browser_engine.execute_attempt(
        scenario_id="homepage_loads",
        target_url=target_url,
        run_id="test_run_hp",
        attempt_number=1,
        artifacts_dir=tmp_path,
    )

    assert attempt.status == TestStatus.PASS
    assert attempt.duration_ms > 0
    assert "ShopDemo" in act
    assert any("[verify]" in log for log in attempt.logs)


def test_valid_checkout_scenario(target_url, tmp_path):
    """Verify valid_checkout_succeeds completes the form and passes."""
    attempt, exp, act = browser_engine.execute_attempt(
        scenario_id="valid_checkout_succeeds",
        target_url=target_url,
        run_id="test_run_co",
        attempt_number=1,
        artifacts_dir=tmp_path,
    )

    assert attempt.status == TestStatus.PASS
    assert "Order placed successfully" in act


def test_invalid_email_defect_detection_and_screenshot(target_url, tmp_path):
    """Verify invalid_email_is_rejected catches the deliberate defect and saves screenshot."""
    run_id = "test_run_defect"
    attempt, exp, act = browser_engine.execute_attempt(
        scenario_id="invalid_email_is_rejected",
        target_url=target_url,
        run_id=run_id,
        attempt_number=1,
        artifacts_dir=tmp_path,
    )

    assert attempt.status == TestStatus.FAIL
    assert "Checkout accepted invalid email 'not-an-email'" in attempt.error_message
    assert attempt.screenshot_url is not None
    assert f"/artifacts/{run_id}/" in attempt.screenshot_url

    # Verify screenshot file exists on disk
    expected_screenshot_file = tmp_path / run_id / "invalid_email_is_rejected_attempt_1.png"
    assert expected_screenshot_file.exists()
    assert expected_screenshot_file.stat().st_size > 5000  # Valid non-empty PNG


def test_full_orchestrated_run_with_verification_and_persistence(target_url, tmp_path):
    """
    Execute full end-to-end run covering:
    - Planning
    - Browser execution of all 3 scenarios
    - Bounded verification rerun of failing scenario
    - Reproducibility classification
    - Structured finding generation
    - Artifact log creation
    - SQLite persistence
    """
    db_file = tmp_path / "e2e_test.sqlite3"
    init_db(db_file)

    req = RunCreateRequest(
        target_id="shopdemo",
        scenario_ids=["homepage_loads", "valid_checkout_succeeds", "invalid_email_is_rejected"],
        verify_failures=True,
    )

    run_response = orchestrator.execute_run(
        request=req,
        db_path=db_file,
        custom_target_url=target_url,
        custom_artifacts_dir=tmp_path,
    )

    assert run_response.status.value == "COMPLETED"
    assert run_response.total_tests == 3
    assert run_response.passed_count == 2
    assert run_response.failed_count == 1
    assert run_response.flaky_count == 0
    assert run_response.error_count == 0

    # Verify findings
    assert len(run_response.findings) == 1
    finding = run_response.findings[0]
    assert finding.scenario_id == "invalid_email_is_rejected"
    assert finding.classification == FindingClassification.REPRODUCIBLE_FAILURE
    assert finding.reproducible is True
    assert finding.screenshot_url is not None

    # Verify execution log artifact
    log_file = tmp_path / run_response.run_id / "execution.log"
    assert log_file.exists()
    assert "REPRODUCIBLE_FAILURE" in log_file.read_text(encoding="utf-8")

    # Verify SQLite persistence
    persisted_run = get_run(run_response.run_id, db_path=db_file)
    assert persisted_run is not None
    assert persisted_run["run_id"] == run_response.run_id
    assert persisted_run["passed_count"] == 2
    assert persisted_run["failed_count"] == 1

    persisted_finding = get_finding(finding.finding_id, db_path=db_file)
    assert persisted_finding is not None
    assert persisted_finding["finding_id"] == finding.finding_id
    assert persisted_finding["reproducible"] is True
