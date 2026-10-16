/**
 * BugSentinel AI Frontend API Types
 * Strictly mirrors Phase 1 Pydantic backend models.
 */

export type TestStatus = 'PASS' | 'FAIL' | 'ERROR';

export type FindingClassification =
  | 'REPRODUCIBLE_FAILURE'
  | 'POTENTIALLY_FLAKY'
  | 'ERROR';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export interface DemoInfoResponse {
  target_id: string;
  target_name: string;
  target_url: string;
  available_scenarios: string[];
  defect_explanation: string;
  configured: boolean;
  browser_ready: boolean;
}

export interface ScenarioDefinition {
  scenario_id: string;
  title: string;
  description: string;
  category: string;
  expected_behavior: string;
  default_enabled: boolean;
  target_id: string;
}

export interface ScenarioListResponse {
  scenarios: ScenarioDefinition[];
}

export interface RunCreateRequest {
  target_id: string;
  scenario_ids?: string[];
  verify_failures?: boolean;
}

export interface ScenarioAttempt {
  attempt_number: number;
  status: TestStatus;
  duration_ms: number;
  error_message?: string | null;
  screenshot_url?: string | null;
  logs: string[];
}

export interface ScenarioResult {
  scenario_id: string;
  title: string;
  status: TestStatus;
  classification?: FindingClassification | null;
  duration_ms: number;
  attempts: ScenarioAttempt[];
  error_message?: string | null;
  expected_behavior: string;
  actual_behavior?: string | null;
}

export interface FindingResponse {
  finding_id: string;
  run_id: string;
  scenario_id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  classification: FindingClassification;
  expected_behavior: string;
  actual_behavior: string;
  first_attempt_status: TestStatus;
  verification_attempt_status?: TestStatus | null;
  reproducible: boolean;
  screenshot_url?: string | null;
  logs: string[];
  created_at: string;
}

export interface RunResponse {
  run_id: string;
  status: RunStatus;
  target_id: string;
  started_at: string;
  completed_at?: string | null;
  duration_ms: number;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  flaky_count: number;
  error_count: number;
  results: ScenarioResult[];
  findings: FindingResponse[];
}

export interface RunSummaryResponse {
  run_id: string;
  status: RunStatus;
  target_id: string;
  started_at: string;
  completed_at?: string | null;
  duration_ms: number;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  flaky_count: number;
  error_count: number;
}

export interface RegressionResponse {
  original_finding_id: string;
  scenario_id: string;
  regression_run: RunResponse;
  defect_resolved: boolean;
  message: string;
}
