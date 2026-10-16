"""Scenario and target application metadata routes for BugSentinel AI."""

from __future__ import annotations

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas import DemoInfoResponse, ScenarioListResponse
from backend.app.services.planner import planner

router = APIRouter(prefix="/api/v1", tags=["Scenarios & Demo"])


def check_browser_readiness() -> bool:
    """Verify that Playwright chromium executable is available on the host."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # Check executable path without needing a long-running instance
            executable = p.chromium.executable_path
            return bool(executable)
    except Exception:
        return False


@router.get("/scenarios", response_model=ScenarioListResponse)
def list_scenarios() -> ScenarioListResponse:
    """Return all registered, deterministic test scenarios."""
    return ScenarioListResponse(scenarios=planner.list_scenarios())


@router.get("/demo", response_model=DemoInfoResponse)
def get_demo_info() -> DemoInfoResponse:
    """Return status and configuration details for the local ShopDemo target."""
    demo_configured = (
        settings.DEMO_SITE_DIR.exists()
        and (settings.DEMO_SITE_DIR / "index.html").exists()
        and (settings.DEMO_SITE_DIR / "app.js").exists()
    )

    browser_ready = check_browser_readiness()

    explanation = (
        "The ShopDemo store contains an intentional email-validation defect. "
        "During checkout, an invalid email format such as 'not-an-email' is accepted "
        "and erroneously displays 'Order placed successfully!'. "
        "BugSentinel AI automatically detects this assertion failure, captures a screenshot, "
        "reruns a bounded verification to confirm reproducibility, and files a structured finding."
    )

    return DemoInfoResponse(
        target_id="shopdemo",
        target_name="ShopDemo E-Commerce Store",
        target_url=settings.demo_url,
        available_scenarios=[s.scenario_id for s in planner.list_scenarios()],
        defect_explanation=explanation,
        configured=demo_configured,
        browser_ready=browser_ready,
    )
