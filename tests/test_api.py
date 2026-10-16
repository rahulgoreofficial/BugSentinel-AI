"""API contract and error handling tests."""

import pytest
from fastapi.testclient import TestClient

from backend.app.database import init_db, save_finding, save_run
from backend.app.main import app

client = TestClient(app)


def test_get_runs_empty(tmp_path, monkeypatch):
    """When no runs exist, endpoint returns empty list."""
    temp_db = tmp_path / "api_test.sqlite3"
    init_db(temp_db)
    monkeypatch.setattr("backend.app.database.settings.DB_PATH", temp_db)

    response = client.get("/api/v1/runs")
    assert response.status_code == 200
    assert response.json() == []


def test_get_run_404_for_unknown_id():
    """Requesting non-existent run ID returns 404."""
    response = client.get("/api/v1/runs/run_does_not_exist_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_get_finding_404_for_unknown_id():
    """Requesting non-existent finding ID returns 404."""
    response = client.get("/api/v1/findings/fnd_does_not_exist_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_regression_404_for_unknown_finding():
    """Triggering regression for non-existent finding returns 404."""
    response = client.post("/api/v1/findings/fnd_unknown/regression")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_create_run_rejects_unknown_target():
    """Reject requests targeting unauthorized or unknown applications."""
    response = client.post(
        "/api/v1/runs",
        json={"target_id": "malicious_or_external_site", "scenario_ids": ["homepage_loads"]},
    )
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]


def test_create_run_rejects_unknown_scenario():
    """Reject requests specifying invalid scenario IDs."""
    response = client.post(
        "/api/v1/runs",
        json={"target_id": "shopdemo", "scenario_ids": ["invalid_scenario_id_xyz"]},
    )
    assert response.status_code == 400
    assert "Unknown scenario IDs requested" in response.json()["detail"]
