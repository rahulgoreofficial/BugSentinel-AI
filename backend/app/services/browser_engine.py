"""Playwright-based browser automation engine for BugSentinel AI.

Executes deterministic browser test scenarios against the ShopDemo target.
Captures screenshots on failure, records console messages, and measures timings.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, TimeoutError as PlaywrightTimeoutError, sync_playwright

from backend.app.config import settings
from backend.app.schemas import ScenarioAttempt, TestStatus

logger = logging.getLogger("bugsentinel.browser_engine")


class BrowserEngine:
    """Manages Playwright lifecycle and executes browser-level test interactions."""

    def __init__(self, headless: Optional[bool] = None, timeout_ms: Optional[int] = None) -> None:
        self.headless = headless if headless is not None else settings.HEADLESS
        self.timeout_ms = timeout_ms if timeout_ms is not None else settings.DEFAULT_TIMEOUT_MS

    def execute_attempt(
        self,
        scenario_id: str,
        target_url: str,
        run_id: str,
        attempt_number: int,
        artifacts_dir: Path,
    ) -> Tuple[ScenarioAttempt, Optional[str], Optional[str]]:
        """
        Execute a single attempt for a scenario using a fresh browser context.

        Returns:
            Tuple of:
            - ScenarioAttempt model
            - expected_behavior string
            - actual_behavior string
        """
        logs: List[str] = []
        screenshot_url: Optional[str] = None
        start_time = time.perf_counter()
        status = TestStatus.PASS
        error_msg: Optional[str] = None
        expected_behavior = ""
        actual_behavior = ""

        # Ensure run artifact directory exists
        run_artifact_dir = artifacts_dir / run_id
        run_artifact_dir.mkdir(parents=True, exist_ok=True)

        # Pre-populate expected behavior from scenario definition if available
        from backend.app.services.planner import planner
        scenario_def = planner.get_scenario(scenario_id)
        if scenario_def:
            expected_behavior = scenario_def.expected_behavior

        try:
            with sync_playwright() as p:
                browser: Browser = p.chromium.launch(
                    headless=self.headless,
                    args=["--no-sandbox", "--disable-dev-shm-usage"],
                )
                try:
                    context: BrowserContext = browser.new_context(
                        viewport={"width": 1280, "height": 800}
                    )
                    page: Page = context.new_page()
                    page.set_default_timeout(self.timeout_ms)

                    # Attach console and error listeners
                    page.on(
                        "console",
                        lambda msg: logs.append(f"[console.{msg.type}] {msg.text}"),
                    )
                    page.on(
                        "pageerror",
                        lambda exc: logs.append(f"[pageerror] {str(exc)}"),
                    )

                    logs.append(f"[info] Navigating to target: {target_url}")
                    page.goto(target_url, wait_until="networkidle")

                    # Dispatch scenario
                    if scenario_id == "homepage_loads":
                        exp, act = self._run_homepage_loads(page, logs)
                        expected_behavior, actual_behavior = exp, act
                    elif scenario_id == "valid_checkout_succeeds":
                        exp, act = self._run_valid_checkout(page, logs)
                        expected_behavior, actual_behavior = exp, act
                    elif scenario_id == "invalid_email_is_rejected":
                        exp, act = self._run_invalid_email_scenario(page, logs)
                        expected_behavior, actual_behavior = exp, act
                    else:
                        raise ValueError(f"Unknown scenario ID: {scenario_id}")

                except AssertionError as ae:
                    # Application logic defect detected
                    status = TestStatus.FAIL
                    error_msg = str(ae)
                    actual_behavior = error_msg
                    logs.append(f"[assertion_failed] {error_msg}")

                    # Capture failure screenshot
                    screenshot_filename = f"{scenario_id}_attempt_{attempt_number}.png"
                    screenshot_path = run_artifact_dir / screenshot_filename
                    try:
                        page.screenshot(path=str(screenshot_path), full_page=True)
                        screenshot_url = f"/artifacts/{run_id}/{screenshot_filename}"
                        logs.append(f"[artifact] Screenshot saved: {screenshot_url}")
                    except Exception as s_err:
                        logs.append(f"[warn] Screenshot capture failed: {s_err}")

                except (PlaywrightTimeoutError, Exception) as infra_err:
                    # Infrastructure, timeout, or unexpected runtime crash
                    status = TestStatus.ERROR
                    error_msg = f"{type(infra_err).__name__}: {str(infra_err)}"
                    actual_behavior = error_msg
                    logs.append(f"[error] Engine failure: {error_msg}")

                    # Attempt screenshot even on error if page is still alive
                    try:
                        screenshot_filename = f"{scenario_id}_error_attempt_{attempt_number}.png"
                        screenshot_path = run_artifact_dir / screenshot_filename
                        page.screenshot(path=str(screenshot_path), full_page=True)
                        screenshot_url = f"/artifacts/{run_id}/{screenshot_filename}"
                    except Exception:
                        pass
                finally:
                    try:
                        browser.close()
                    except Exception as c_err:
                        logs.append(f"[warn] Error closing browser: {c_err}")

        except Exception as startup_err:
            status = TestStatus.ERROR
            error_msg = f"Browser startup error: {str(startup_err)}"
            logs.append(f"[fatal] {error_msg}")

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        attempt = ScenarioAttempt(
            attempt_number=attempt_number,
            status=status,
            duration_ms=duration_ms,
            error_message=error_msg,
            screenshot_url=screenshot_url,
            logs=logs,
        )

        return attempt, expected_behavior, actual_behavior

    def _run_homepage_loads(self, page: Page, logs: List[str]) -> Tuple[str, str]:
        """Verify homepage loads and critical UI controls exist."""
        expected = "ShopDemo heading is visible and catalog products are displayed."

        heading_locator = page.locator("#shopdemo-heading")
        heading_locator.wait_for(state="visible", timeout=5000)
        heading_text = heading_locator.inner_text().strip()

        if "ShopDemo" not in heading_text:
            actual = f"ShopDemo heading missing or incorrect. Found: '{heading_text}'"
            raise AssertionError(actual)

        products = page.locator(".product-card")
        product_count = products.count()
        if product_count < 1:
            actual = f"Expected at least 1 product card, but found {product_count}."
            raise AssertionError(actual)

        checkout_form = page.locator("#checkout-form")
        if not checkout_form.is_visible():
            actual = "Checkout form is not visible on homepage."
            raise AssertionError(actual)

        actual = f"ShopDemo loaded successfully with heading '{heading_text}' and {product_count} products."
        logs.append(f"[verify] {actual}")
        return expected, actual

    def _run_valid_checkout(self, page: Page, logs: List[str]) -> Tuple[str, str]:
        """Verify standard checkout succeeds with valid input."""
        expected = "Checkout form submits and displays 'Order placed successfully' confirmation."

        page.fill("#customer-name", "Alex Morgan")
        page.fill("#email", "alex.morgan@example.com")
        page.fill("#address", "742 Evergreen Terrace, Springfield")

        logs.append("[action] Filled checkout fields with valid customer details.")
        page.click("#place-order")

        # Wait for status element to update
        status_locator = page.locator("#status")
        status_locator.wait_for(state="visible", timeout=5000)

        # Check status text
        status_text = status_locator.inner_text().strip()
        has_success_class = "status-success" in (status_locator.get_attribute("class") or "")

        if not has_success_class or "Order placed successfully" not in status_text:
            actual = f"Order confirmation failed. Status box text: '{status_text}', class: '{status_locator.get_attribute('class')}'"
            raise AssertionError(actual)

        actual = f"Order completed successfully. Status: '{status_text}'"
        logs.append(f"[verify] {actual}")
        return expected, actual

    def _run_invalid_email_scenario(self, page: Page, logs: List[str]) -> Tuple[str, str]:
        """
        Verify checkout form validation rejects invalid email address.
        
        Deliberate defect expectation:
        The buggy ShopDemo accepts 'not-an-email' and displays success.
        The test asserts that success MUST NOT occur and an error MUST be shown.
        Because the bug is present, this assertion will FAIL, detecting the bug!
        """
        expected = "Checkout should reject invalid email 'not-an-email' and display validation error."

        page.fill("#customer-name", "BugHunter QA")
        page.fill("#email", "not-an-email")
        page.fill("#address", "100 QA Verification Lane")

        logs.append("[action] Filled form with invalid email 'not-an-email'.")
        page.click("#place-order")

        # Allow DOM update
        page.wait_for_timeout(400)

        status_locator = page.locator("#status")
        status_text = status_locator.inner_text().strip()
        status_class = status_locator.get_attribute("class") or ""

        # Check if the application accepted the invalid email
        is_success = "status-success" in status_class or "Order placed successfully" in status_text

        if is_success:
            actual = (
                f"Checkout accepted invalid email 'not-an-email' and incorrectly displayed: "
                f"'{status_text}'"
            )
            logs.append(f"[defect_detected] {actual}")
            raise AssertionError(actual)

        # If it reached here, the form correctly rejected it
        actual = f"Application properly rejected invalid email. Status: '{status_text}'"
        logs.append(f"[verify] {actual}")
        return expected, actual


browser_engine = BrowserEngine()
