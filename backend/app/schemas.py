"""Pydantic schemas and models for BugSentinel AI API contracts."""

from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class TestStatus(str, Enum):
    """Execution status of an individual test attempt."""

    __test__ = False  # Prevent pytest from treating this enum as a test class
    PASS = "PASS"
    FAIL = "FAIL"
    ERROR = "ERROR"


class FindingClassification(str, Enum):
    """Reproducibility classification of a test failure."""

    REPRODUCIBLE_FAILURE = "REPRODUCIBLE_FAILURE"
    POTENTIALLY_FLAKY = "POTENTIALLY_FLAKY"
    ERROR = "ERROR"


class SeverityLevel(str, Enum):
    """Severity classification for detected bug findings."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RunStatus(str, Enum):
    """Overall test execution run status."""

    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# --- Health & Info Schemas ---


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., examples=["ok"])
    app: str = Field(..., examples=["BugSentinel AI"])
    version: str = Field(..., examples=["0.1.0"])


class DemoInfoResponse(BaseModel):
    """Details about the local demo target application."""

    target_id: str = "shopdemo"
    target_name: str = "ShopDemo E-Commerce Application"
    target_url: str
    available_scenarios: List[str]
    defect_explanation: str
    configured: bool
    browser_ready: bool


# --- Scenario Schemas ---


class ScenarioDefinition(BaseModel):
    """Definition of a registered test scenario."""

    scenario_id: str
    title: str
    description: str
    category: str
    expected_behavior: str
    default_enabled: bool = True
    target_id: str = "shopdemo"


class ScenarioListResponse(BaseModel):
    """List of all registered test scenarios."""

    scenarios: List[ScenarioDefinition]


# --- Run Execution Schemas ---


class RunCreateRequest(BaseModel):
    """Request payload to initiate a test run."""

    target_id: str = Field(default="shopdemo", description="Target application identifier")
    scenario_ids: Optional[List[str]] = Field(
        default=None,
        description="List of scenario IDs to run. Defaults to all registered scenarios.",
    )
    verify_failures: bool = Field(
        default=True,
        description="Whether to perform an immediate verification rerun on assertion failures.",
    )


class ScenarioAttempt(BaseModel):
    """Details of a single attempt for a test scenario."""

    attempt_number: int
    status: TestStatus
    duration_ms: int
    error_message: Optional[str] = None
    screenshot_url: Optional[str] = None
    logs: List[str] = Field(default_factory=list)


class ScenarioResult(BaseModel):
    """Consolidated result of a scenario across attempts."""

    scenario_id: str
    title: str
    status: TestStatus
    classification: Optional[FindingClassification] = None
    duration_ms: int
    attempts: List[ScenarioAttempt] = Field(default_factory=list)
    error_message: Optional[str] = None
    expected_behavior: str
    actual_behavior: Optional[str] = None


class FindingResponse(BaseModel):
    """Structured bug finding with evidence."""

    finding_id: str
    run_id: str
    scenario_id: str
    title: str
    description: str
    severity: SeverityLevel
    classification: FindingClassification
    expected_behavior: str
    actual_behavior: str
    first_attempt_status: TestStatus = TestStatus.FAIL
    verification_attempt_status: Optional[TestStatus] = None
    reproducible: bool
    screenshot_url: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    created_at: str


class RunResponse(BaseModel):
    """Full details of a test run, including results and findings."""

    run_id: str
    status: RunStatus
    target_id: str
    started_at: str
    completed_at: Optional[str] = None
    duration_ms: int
    total_tests: int
    passed_count: int
    failed_count: int
    flaky_count: int
    error_count: int
    results: List[ScenarioResult] = Field(default_factory=list)
    findings: List[FindingResponse] = Field(default_factory=list)


class RunSummaryResponse(BaseModel):
    """High-level summary of a test run for history listings."""

    run_id: str
    status: RunStatus
    target_id: str
    started_at: str
    completed_at: Optional[str] = None
    duration_ms: int
    total_tests: int
    passed_count: int
    failed_count: int
    flaky_count: int
    error_count: int


class RegressionResponse(BaseModel):
    """Response from executing a regression retest against an existing finding."""

    original_finding_id: str
    scenario_id: str
    regression_run: RunResponse
    defect_resolved: bool
    message: str
