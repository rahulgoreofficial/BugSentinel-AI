"""Tests for SQLite persistence layer, run history, and finding storage."""

from datetime import datetime, timezone
import json
import pytest

from backend.app.database import (
    get_finding,
    get_run,
    init_db,
    list_findings,
    list_runs,
    save_finding,
    save_run,
)


@pytest.fixture
def temp_db(tmp_path):
    """Provide a fresh, isolated SQLite database for testing."""
    db_file = tmp_path / "test_bugsentinel.sqlite3"
    init_db(db_file)
    return db_file


def test_init_db_creates_tables(temp_db):
    """Verify tables exist and queries execute without error."""
    runs = list_runs(db_path=temp_db)
    assert runs == []
    findings = list_findings(db_path=temp_db)
    assert findings == []


def test_save_and_retrieve_run(temp_db):
    """Verify run record serialization and retrieval."""
    run_id = "run_test_123"
    now_iso = datetime.now(timezone.utc).isoformat()
    run_payload = {
        "run_id": run_id,
        "target_id": "shopdemo",
        "status": "COMPLETED",
        "started_at": now_iso,
        "completed_at": now_iso,
        "duration_ms": 1250,
        "total_tests": 2,
        "passed_count": 1,
        "failed_count": 1,
        "flaky_count": 0,
        "error_count": 0,
        "results": [
            {
                "scenario_id": "homepage_loads",
                "title": "Homepage Loads",
                "status": "PASS",
                "duration_ms": 500,
                "attempts": [],
                "expected_behavior": "Loads",
                "actual_behavior": "Loaded",
            }
        ],
        "findings": [],
    }

    save_run(run_payload, db_path=temp_db)

    retrieved = get_run(run_id, db_path=temp_db)
    assert retrieved is not None
    assert retrieved["run_id"] == run_id
    assert retrieved["status"] == "COMPLETED"
    assert retrieved["passed_count"] == 1
    assert retrieved["failed_count"] == 1

    summary_list = list_runs(limit=10, db_path=temp_db)
    assert len(summary_list) == 1
    assert summary_list[0]["run_id"] == run_id


def test_save_and_retrieve_finding(temp_db):
    """Verify bug finding serialization, evidence fields, and retrieval."""
    run_id = "run_finding_demo"
    # Create parent run first
    now_iso = datetime.now(timezone.utc).isoformat()
    save_run(
        {
            "run_id": run_id,
            "target_id": "shopdemo",
            "status": "COMPLETED",
            "started_at": now_iso,
            "total_tests": 1,
            "passed_count": 0,
            "failed_count": 1,
            "flaky_count": 0,
            "error_count": 0,
            "result_json": json.dumps({"run_id": run_id}),
        },
        db_path=temp_db,
    )

    finding_id = "fnd_test_456"
    finding_data = {
        "finding_id": finding_id,
        "run_id": run_id,
        "scenario_id": "invalid_email_is_rejected",
        "title": "Checkout accepts invalid email",
        "description": "Validation defect detected during checkout.",
        "severity": "MEDIUM",
        "classification": "REPRODUCIBLE_FAILURE",
        "expected_behavior": "Rejects invalid email",
        "actual_behavior": "Accepted invalid email",
        "first_attempt_status": "FAIL",
        "verification_attempt_status": "FAIL",
        "reproducible": True,
        "screenshot_url": f"/artifacts/{run_id}/attempt_1.png",
        "logs": ["[console.warn] defect active", "[assertion_failed] mismatch"],
        "created_at": now_iso,
    }

    save_finding(finding_data, db_path=temp_db)

    retrieved = get_finding(finding_id, db_path=temp_db)
    assert retrieved is not None
    assert retrieved["finding_id"] == finding_id
    assert retrieved["scenario_id"] == "invalid_email_is_rejected"
    assert retrieved["reproducible"] is True
    assert len(retrieved["logs"]) == 2
    assert retrieved["screenshot_url"] == f"/artifacts/{run_id}/attempt_1.png"

    # Filter by run_id
    filtered = list_findings(run_id=run_id, db_path=temp_db)
    assert len(filtered) == 1
    assert filtered[0]["finding_id"] == finding_id

    # Filter with non-matching run_id
    empty_list = list_findings(run_id="run_non_existent", db_path=temp_db)
    assert empty_list == []
