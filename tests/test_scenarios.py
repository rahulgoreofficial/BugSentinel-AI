"""Tests for scenario planning, validation, and registry endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.planner import planner

client = TestClient(app)


def test_planner_lists_registered_scenarios():
    """Verify planner returns all expected Phase 1 scenarios."""
    scenarios = planner.list_scenarios()
    scenario_ids = [s.scenario_id for s in scenarios]

    assert "homepage_loads" in scenario_ids
    assert "valid_checkout_succeeds" in scenario_ids
    assert "invalid_email_is_rejected" in scenario_ids
    assert len(scenarios) >= 3


def test_planner_validate_scenario_ids_success():
    """Verify valid scenario IDs are resolved cleanly."""
    valid_ids = ["homepage_loads", "valid_checkout_succeeds"]
    defs = planner.validate_scenario_ids(valid_ids)
    assert len(defs) == 2
    assert defs[0].scenario_id == "homepage_loads"
    assert defs[1].scenario_id == "valid_checkout_succeeds"


def test_planner_validate_scenario_ids_unknown_raises():
    """Verify unknown scenario IDs raise a clear ValueError."""
    with pytest.raises(ValueError, match="Unknown scenario IDs requested"):
        planner.validate_scenario_ids(["unknown_scenario_xyz", "homepage_loads"])


def test_api_scenarios_endpoint():
    """Verify GET /api/v1/scenarios matches the internal planner registry."""
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) >= 3
    ids = [s["scenario_id"] for s in data["scenarios"]]
    assert "invalid_email_is_rejected" in ids
