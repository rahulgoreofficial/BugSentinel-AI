"""Test planner and scenario registry for BugSentinel AI.

Defines deterministic test scenarios for the ShopDemo testing target.
Provides validation and metadata for the execution engine.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from backend.app.schemas import ScenarioDefinition


class TestPlanner:
    """Registry and planner for deterministic web application test scenarios."""

    def __init__(self) -> None:
        self._registry: Dict[str, ScenarioDefinition] = {
            "homepage_loads": ScenarioDefinition(
                scenario_id="homepage_loads",
                title="Verify ShopDemo Homepage & Controls",
                description="Checks that the ShopDemo store loads successfully and key UI elements are visible.",
                category="smoke",
                expected_behavior="ShopDemo heading is visible and catalog products are rendered.",
                default_enabled=True,
                target_id="shopdemo",
            ),
            "valid_checkout_succeeds": ScenarioDefinition(
                scenario_id="valid_checkout_succeeds",
                title="Verify Checkout with Valid Customer Data",
                description="Submits the checkout form with valid name, email, and address, expecting successful order confirmation.",
                category="functional",
                expected_behavior="Checkout completes and displays order confirmation with 'Order placed successfully'.",
                default_enabled=True,
                target_id="shopdemo",
            ),
            "invalid_email_is_rejected": ScenarioDefinition(
                scenario_id="invalid_email_is_rejected",
                title="Verify Checkout Rejects Invalid Email Address",
                description="Attempts checkout with an invalid email format ('not-an-email'), expecting form validation error.",
                category="validation",
                expected_behavior="Checkout rejects the invalid email and does NOT display a success message.",
                default_enabled=True,
                target_id="shopdemo",
            ),
        }

    def list_scenarios(self) -> List[ScenarioDefinition]:
        """Return all available scenarios in registered order."""
        return list(self._registry.values())

    def get_scenario(self, scenario_id: str) -> Optional[ScenarioDefinition]:
        """Retrieve a scenario definition by ID."""
        return self._registry.get(scenario_id)

    def validate_scenario_ids(self, scenario_ids: List[str]) -> List[ScenarioDefinition]:
        """Validate a list of scenario IDs, raising ValueError if any are unknown."""
        validated: List[ScenarioDefinition] = []
        unknown: List[str] = []

        for sid in scenario_ids:
            if sid in self._registry:
                validated.append(self._registry[sid])
            else:
                unknown.append(sid)

        if unknown:
            raise ValueError(f"Unknown scenario IDs requested: {', '.join(unknown)}")

        return validated

    def get_default_scenario_ids(self) -> List[str]:
        """Return IDs of scenarios enabled by default."""
        return [s.scenario_id for s in self._registry.values() if s.default_enabled]


planner = TestPlanner()
