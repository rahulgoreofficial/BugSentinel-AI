"""Tests for API health and target demo metadata endpoints."""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns 200 with accurate metadata."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "BugSentinel AI"
    assert data["version"] == "0.1.0"


def test_root_endpoint():
    """Verify root endpoint returns basic links and welcome payload."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "BugSentinel AI"
    assert "demo" in data
    assert "docs" in data


def test_demo_info_endpoint():
    """Verify demo information endpoint provides defect explanation and scenarios."""
    response = client.get("/api/v1/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["target_id"] == "shopdemo"
    assert "email-validation defect" in data["defect_explanation"]
    assert "homepage_loads" in data["available_scenarios"]
    assert "invalid_email_is_rejected" in data["available_scenarios"]
    assert data["configured"] is True
