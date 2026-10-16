import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Activity,
  History,
  CheckSquare,
  Square,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Terminal,
  Zap,
} from 'lucide-react';
import type {
  DemoInfoResponse,
  FindingResponse,
  HealthResponse,
  RegressionResponse,
  RunResponse,
  RunSummaryResponse,
  ScenarioDefinition,
  ScenarioResult,
} from '../../types/api';
import { api } from '../../lib/api';
import { FindingDetailDrawer } from '../../components/testing/FindingDetailDrawer';
import { RunHistoryView } from '../../components/testing/RunHistoryView';

export const DashboardPage: React.FC = () => {
  // Backend & Metadata State
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [demoInfo, setDemoInfo] = useState<DemoInfoResponse | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [verifyFailures, setVerifyFailures] = useState(true);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionMessage, setExecutionMessage] = useState('Ready for execution');
  const [runError, setRunError] = useState<string | null>(null);

  // Results & History State
  const [currentRun, setCurrentRun] = useState<RunResponse | null>(null);
  const [runsHistory, setRunsHistory] = useState<RunSummaryResponse[]>([]);
  const [findingsHistory, setFindingsHistory] = useState<FindingResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Inspection Drawer State
  const [selectedFinding, setSelectedFinding] = useState<FindingResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<ScenarioResult | null>(null);

  // Navigation tab inside testing lab
  const [activeTab, setActiveTab] = useState<'workspace' | 'findings' | 'history'>('workspace');

  // Load initial backend metadata
  const loadInitialData = useCallback(async () => {
    try {
      setRunError(null);
      const [h, d, s] = await Promise.all([
        api.checkHealth(),
        api.getDemoInfo(),
        api.getScenarios(),
      ]);
      setHealth(h);
      setDemoInfo(d);
      setScenarios(s.scenarios);
      setSelectedScenarioIds(s.scenarios.map((sc) => sc.scenario_id));
    } catch (err: any) {
      setRunError(err.message || 'Failed to connect to BugSentinel backend.');
    }

    // Load recent history and findings
    try {
      setIsLoadingHistory(true);
      const [runs, findings] = await Promise.all([
        api.getRuns(20),
        api.getFindings(undefined, 30),
      ]);
      setRunsHistory(runs);
      setFindingsHistory(findings);

      // Auto-load most recent run if available
      if (runs.length > 0) {
        const latest = await api.getRunDetails(runs[0].run_id);
        setCurrentRun((prev) => prev || latest);
      }
    } catch {
      // Historical data loading handled gracefully
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Toggle scenario selection
  const toggleScenario = (id: string) => {
    if (selectedScenarioIds.includes(id)) {
      if (selectedScenarioIds.length > 1) {
        setSelectedScenarioIds(selectedScenarioIds.filter((s) => s !== id));
      }
    } else {
      setSelectedScenarioIds([...selectedScenarioIds, id]);
    }
  };

  // Run Tests Handler
  const handleRunTests = async () => {
    if (selectedScenarioIds.length === 0 || isRunning) return;

    setIsRunning(true);
    setRunError(null);
    setExecutionMessage('Launching Playwright Chromium engine...');

    const messages = [
      '[01/04] Launching Playwright Chromium engine...',
      '[02/04] Navigating to ShopDemo target application...',
      '[03/04] Executing user interactions & assertions...',
      '[04/04] Evaluating bounded retry policy & saving evidence...',
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setExecutionMessage(messages[msgIdx]);
    }, 1600);

    try {
      const response = await api.createRun({
        target_id: 'shopdemo',
        scenario_ids: selectedScenarioIds,
        verify_failures: verifyFailures,
      });

      clearInterval(interval);
      setExecutionMessage('Run completed successfully.');
      setCurrentRun(response);
      setActiveTab('workspace');

      // Refresh history & findings
      const [runs, findings] = await Promise.all([
        api.getRuns(20),
        api.getFindings(undefined, 30),
      ]);
      setRunsHistory(runs);
      setFindingsHistory(findings);

      // If a bug finding was detected, auto-open the drawer for immediate inspection
      if (response.findings.length > 0) {
        setSelectedFinding(response.findings[0]);
      }
    } catch (err: any) {
      clearInterval(interval);
      setRunError(err.message || 'Execution failed due to an error.');
    } finally {
      setIsRunning(false);
    }
  };

  // Select historical run
  const handleSelectRun = async (runId: string) => {
    try {
      setIsRunning(true);
      const runData = await api.getRunDetails(runId);
      setCurrentRun(runData);
      setActiveTab('workspace');
    } catch (err: any) {
      setRunError(`Failed to load run ${runId}: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Regression completed callback
  const handleRegressionCompleted = async (_reg: RegressionResponse) => {
    const [runs, findings] = await Promise.all([
      api.getRuns(20),
      api.getFindings(undefined, 30),
    ]);
    setRunsHistory(runs);
    setFindingsHistory(findings);
  };

  const isOnline = health?.status === 'ok';
  const latestFinding = currentRun?.findings && currentRun.findings.length > 0 ? currentRun.findings[0] : null;

  return (
    <div className="dashboard-page-container">
      {/* Architectural Workspace Header */}
      <header className="dashboard-command-header">
        <div className="container command-header-container">
          <div className="command-title-block">
            <div className="command-breadcrumb font-mono">
              <span>BUGSENTINEL AI</span>
              <span className="breadcrumb-slash">/</span>
              <span>OPERATIONAL LAB</span>
              <span className="breadcrumb-slash">/</span>
              <span className="text-cyan">SHOPDEMO TARGET</span>
            </div>

            <h1 className="command-main-heading">Testing Workspace</h1>
            <p className="command-sub-heading">
              Execute real browser tests, verify unexpected behavior with bounded retries, and inspect forensic evidence.
            </p>
          </div>

          {/* Engine & Target Telemetry Strip */}
          <div className="command-telemetry-strip">
            <div className={`status-pill ${isOnline ? 'pill-online' : 'pill-offline'}`}>
              <span className="status-dot" />
              <span>{isOnline ? 'Backend Online' : 'Backend Offline'}</span>
              <span className="font-mono text-2xs text-muted">v0.1.0</span>
            </div>

            <div className="status-pill pill-target">
              <span className="status-dot-cyan" />
              <span>Target: ShopDemo</span>
              <a
                href={demoInfo?.target_url || 'http://127.0.0.1:8000/demo/'}
                target="_blank"
                rel="noopener noreferrer"
                className="target-external-link"
                title="Open ShopDemo in new browser tab"
              >
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="status-pill pill-engine font-mono">
              <Terminal size={12} className="text-muted" />
              <span className="text-2xs text-muted">Chromium 156.0 Headless</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout Container */}
      <main className="container dashboard-main-content">
        {/* Navigation Tabs */}
        <nav className="dashboard-tabs-nav" aria-label="Testing Lab Views">
          <button
            className={`dash-tab-btn ${activeTab === 'workspace' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <Activity size={16} />
            <span>Active Run & Workspace</span>
          </button>

          <button
            className={`dash-tab-btn ${activeTab === 'findings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('findings')}
          >
            <ShieldAlert size={16} />
            <span>Detected Findings</span>
            {findingsHistory.length > 0 && (
              <span className="tab-counter font-mono counter-fail">{findingsHistory.length}</span>
            )}
          </button>

          <button
            className={`dash-tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>Run History</span>
            <span className="tab-counter font-mono">{runsHistory.length}</span>
          </button>
        </nav>

        {/* Global Connection / Execution Alert Banner */}
        {runError && (
          <div className="dashboard-alert-banner alert-error" role="alert">
            <AlertCircle size={20} className="shrink-0 text-fail" />
            <div className="alert-content">
              <strong>Execution Alert:</strong> {runError}
            </div>
            <button className="btn btn-secondary btn-xs" onClick={loadInitialData}>
              Retry Connection
            </button>
          </div>
        )}

        {/* TAB 1: OPERATIONAL WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="workspace-tab-layout">
            {/* Command Deck Grid: Left Configuration (65%) vs Right Target Cockpit (35%) */}
            <div className="workspace-command-deck">
              {/* Left Column: Scenario Configuration & Run Trigger */}
              <div className="deck-main-panel surface-card">
                <div className="panel-top-bar">
                  <div className="panel-title-group">
                    <Zap size={16} className="text-cyan" />
                    <h2 className="panel-heading">Execution Scenario Configuration</h2>
                    <span className="font-mono text-2xs text-muted">({scenarios.length} available)</span>
                  </div>

                  <div className="panel-options-group">
                    <label className="bounded-retry-toggle" title="Perform bounded rerun on assertion failure">
                      <input
                        type="checkbox"
                        checked={verifyFailures}
                        onChange={(e) => setVerifyFailures(e.target.checked)}
                        disabled={isRunning}
                      />
                      <span className="toggle-label-text font-mono text-xs">
                        Bounded Retry (Max 2 Attempts)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Scenario Selection Rows */}
                <div className="scenarios-list-layout">
                  {scenarios.map((s) => {
                    const isChecked = selectedScenarioIds.includes(s.scenario_id);
                    const isDefect = s.scenario_id === 'invalid_email_is_rejected';

                    return (
                      <div
                        key={s.scenario_id}
                        className={`scenario-row-item ${isChecked ? 'is-selected' : ''} ${isDefect ? 'is-defect-target' : ''}`}
                        onClick={() => !isRunning && toggleScenario(s.scenario_id)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            if (!isRunning) {
                              toggleScenario(s.scenario_id);
                            }
                          }
                        }}
                      >
                        <div className="scenario-checkbox-col">
                          {isChecked ? (
                            <CheckSquare size={18} className="text-cyan" />
                          ) : (
                            <Square size={18} className="text-muted" />
                          )}
                        </div>

                        <div className="scenario-info-col">
                          <div className="scenario-meta-row">
                            <span className="scenario-id-tag font-mono">{s.scenario_id}</span>
                            {isDefect && (
                              <span className="badge badge-fail badge-xs font-mono">
                                DELIBERATE DEFECT DETECTED IN SHOPDEMO
                              </span>
                            )}
                          </div>

                          <h3 className="scenario-title">{s.title}</h3>
                          <p className="scenario-description">{s.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Execution Deck */}
                <div className="deck-action-footer">
                  <div className="action-telemetry-col">
                    {isRunning ? (
                      <div className="running-telemetry-active">
                        <span className="active-spinner spin-slow" />
                        <span className="telemetry-msg font-mono text-cyan">{executionMessage}</span>
                      </div>
                    ) : (
                      <div className="selection-counter-text font-mono text-xs text-muted">
                        <span className="text-cyan font-bold">{selectedScenarioIds.length}</span> of {scenarios.length} scenarios armed for real Chromium execution.
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-cyan btn-run-command"
                    onClick={handleRunTests}
                    disabled={isRunning || selectedScenarioIds.length === 0}
                  >
                    {isRunning ? (
                      <>
                        <RotateCcw size={17} className="spin-slow" />
                        <span>Running Tests...</span>
                      </>
                    ) : (
                      <>
                        <Play size={17} />
                        <span>Run Tests Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Controlled Target Cockpit & Live Run Summary */}
              <div className="deck-side-panel">
                {/* Controlled Target Info Card */}
                <div className="target-cockpit-card surface-card">
                  <div className="cockpit-card-header">
                    <span className="font-mono text-2xs font-bold text-muted">CONTROLLED TARGET ENVIRONMENT</span>
                    <span className="status-dot-cyan" />
                  </div>

                  <div className="target-card-body">
                    <div className="target-title-line">
                      <span className="target-app-name font-bold">ShopDemo Store</span>
                      <a
                        href={demoInfo?.target_url || 'http://127.0.0.1:8000/demo/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-xs"
                      >
                        <span>Open Target</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="target-url-text font-mono text-xs text-muted">
                      {demoInfo?.target_url || 'http://127.0.0.1:8000/demo/'}
                    </div>

                    <div className="defect-cockpit-indicator">
                      <div className="indicator-header">
                        <span className="defect-badge-pulse" />
                        <span className="font-mono text-2xs font-bold text-fail">EMAIL FORMAT DEFECT: ACTIVE</span>
                      </div>
                      <p className="text-2xs text-secondary mt-1">
                        Form accepts invalid email string without regex check. BugSentinel verifies this assertion mismatch autonomously.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Integrated Run Summary Metrics Cockpit */}
                {currentRun ? (
                  <div className="run-metrics-cockpit surface-deck">
                    <div className="cockpit-header">
                      <span className="font-mono text-2xs text-muted">LATEST RUN SUMMARY</span>
                      <span className="font-mono text-2xs text-cyan">{currentRun.run_id}</span>
                    </div>

                    <div className="cockpit-stat-hero">
                      <div className="hero-stat-block">
                        <div className="stat-ratio font-mono">
                          <span className="text-pass">{currentRun.passed_count}</span>
                          <span className="text-muted"> / </span>
                          <span>{currentRun.total_tests}</span>
                        </div>
                        <span className="stat-sub font-mono text-2xs text-muted">SCENARIOS PASSED</span>
                      </div>

                      {currentRun.failed_count > 0 && (
                        <div className="hero-stat-block text-right">
                          <div className="stat-failed font-mono text-fail">
                            {currentRun.failed_count} DEFECT
                          </div>
                          <span className="stat-sub font-mono text-2xs text-fail">REPRODUCIBLE</span>
                        </div>
                      )}
                    </div>

                    <div className="cockpit-meta-grid font-mono text-xs">
                      <div className="meta-cell">
                        <span className="text-muted text-2xs">DURATION:</span>
                        <span>{currentRun.duration_ms} ms</span>
                      </div>
                      <div className="meta-cell">
                        <span className="text-muted text-2xs">FLAKY RETRIES:</span>
                        <span className={currentRun.flaky_count > 0 ? 'text-warn' : 'text-muted'}>
                          {currentRun.flaky_count}
                        </span>
                      </div>
                    </div>

                    {latestFinding && (
                      <button
                        className="btn btn-cyan btn-xs w-full mt-3"
                        onClick={() => {
                          setSelectedFinding(latestFinding);
                          setSelectedResult(null);
                        }}
                      >
                        <ShieldAlert size={12} />
                        <span>Inspect Defect Evidence Dossier</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="run-metrics-cockpit empty-cockpit surface-deck">
                    <div className="cockpit-header">
                      <span className="font-mono text-2xs text-muted">ENGINE READY</span>
                      <span className="font-mono text-2xs text-pass">IDLE</span>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      Click <strong>Run Tests Now</strong> to launch Playwright Chromium against ShopDemo and capture assertion results.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Defect Evidence Spotlight (when findings exist in the current run) */}
            {latestFinding && (
              <div className="evidence-spotlight-banner surface-card">
                <div className="spotlight-header">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-fail" />
                    <span className="font-mono text-xs font-bold text-fail">AUTONOMOUS BUG DETECTED:</span>
                    <span className="font-bold text-sm text-primary">{latestFinding.title}</span>
                  </div>
                  <span className="badge badge-fail font-mono text-xs">{latestFinding.classification}</span>
                </div>

                <div className="spotlight-body">
                  <div className="spotlight-behavior-col">
                    <div className="behavior-item">
                      <span className="font-mono text-2xs text-muted uppercase">Expected:</span>
                      <span className="text-xs text-secondary">{latestFinding.expected_behavior}</span>
                    </div>
                    <div className="behavior-item text-fail">
                      <span className="font-mono text-2xs text-fail uppercase">Observed:</span>
                      <span className="text-xs">{latestFinding.actual_behavior}</span>
                    </div>
                  </div>

                  <div className="spotlight-action-col">
                    <button
                      className="btn btn-cyan btn-sm"
                      onClick={() => {
                        setSelectedFinding(latestFinding);
                        setSelectedResult(null);
                      }}
                    >
                      <Eye size={13} />
                      <span>Inspect Screenshots & Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table Panel */}
            {currentRun && (
              <div className="results-panel surface-card">
                <div className="results-panel-header">
                  <div className="panel-title-with-badge">
                    <Activity size={17} className="text-cyan" />
                    <h3 className="text-base font-bold">Execution Telemetry & Assertion Proof ({currentRun.results.length} Scenarios)</h3>
                  </div>

                  <span className="font-mono text-xs text-muted">
                    Execution Completed: {currentRun.completed_at ? new Date(currentRun.completed_at).toLocaleTimeString() : 'In Progress'}
                  </span>
                </div>

                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>SCENARIO</th>
                        <th>STATUS</th>
                        <th>CLASSIFICATION</th>
                        <th>ATTEMPTS</th>
                        <th>DURATION</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRun.results.map((res) => {
                        const isPass = res.status === 'PASS';
                        const matchingFinding = currentRun.findings.find(
                          (f) => f.scenario_id === res.scenario_id
                        );

                        return (
                          <tr key={res.scenario_id} className={`result-row ${!isPass ? 'row-failed' : ''}`}>
                            <td>
                              <div className="scenario-col">
                                <span className="scenario-title-text font-semibold">
                                  {res.title}
                                </span>
                                <span className="scenario-id-text font-mono text-muted text-xs">
                                  {res.scenario_id}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${isPass ? 'badge-pass' : 'badge-fail'}`}>
                                {isPass ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                                <span>{res.status}</span>
                              </span>
                            </td>
                            <td>
                              {res.classification ? (
                                <span className={`badge ${res.classification === 'REPRODUCIBLE_FAILURE' ? 'badge-fail' : 'badge-warning'} font-mono text-xs`}>
                                  {res.classification}
                                </span>
                              ) : (
                                <span className="text-muted text-xs font-mono">—</span>
                              )}
                            </td>
                            <td className="font-mono text-xs">
                              {res.attempts.length} attempt{res.attempts.length === 1 ? '' : 's'}
                              {res.attempts.length > 1 && !isPass && (
                                <span className="text-2xs text-fail block">Verified Reproducible</span>
                              )}
                            </td>
                            <td className="font-mono text-xs text-muted">
                              {res.duration_ms} ms
                            </td>
                            <td>
                              <button
                                className={`btn btn-xs ${matchingFinding ? 'btn-cyan' : 'btn-secondary'}`}
                                onClick={() => {
                                  setSelectedResult(res);
                                  setSelectedFinding(matchingFinding || null);
                                }}
                              >
                                <Eye size={12} />
                                <span>{matchingFinding ? 'Inspect Proof' : 'View Logs'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETECTED FINDINGS */}
        {activeTab === 'findings' && (
          <div className="findings-tab-layout">
            <div className="findings-view-header">
              <div>
                <h2 className="text-2xl font-bold">Detected Bug Findings</h2>
                <p className="text-sm text-secondary">
                  Documented failure assertions confirmed by bounded retry verification in SQLite.
                </p>
              </div>
            </div>

            {findingsHistory.length === 0 ? (
              <div className="empty-state-card surface-card">
                <ShieldCheck size={36} className="text-pass" />
                <h3 className="text-lg font-bold mt-2">No bug findings recorded yet</h3>
                <p className="text-muted text-sm max-w-md text-center mt-1">
                  Run tests with the deliberate email defect scenario enabled to observe BugSentinel's autonomous detection.
                </p>
                <button className="btn btn-cyan btn-sm mt-4" onClick={() => setActiveTab('workspace')}>
                  Back to Workspace
                </button>
              </div>
            ) : (
              <div className="findings-cards-grid">
                {findingsHistory.map((f) => (
                  <div
                    key={f.finding_id}
                    className="finding-card surface-card"
                    onClick={() => {
                      setSelectedFinding(f);
                      setSelectedResult(null);
                    }}
                  >
                    <div className="finding-card-top">
                      <span className="badge badge-fail font-mono">{f.classification}</span>
                      <span className="badge badge-severity-medium">SEVERITY: {f.severity}</span>
                      <span className="font-mono text-xs text-muted">{f.finding_id}</span>
                    </div>

                    <h3 className="finding-card-title">{f.title}</h3>
                    <p className="finding-card-desc">{f.description}</p>

                    <div className="finding-card-behavior">
                      <div className="b-line text-xs">
                        <strong className="text-muted font-mono">EXPECTED:</strong> {f.expected_behavior}
                      </div>
                      <div className="b-line text-xs text-fail">
                        <strong className="font-mono">OBSERVED:</strong> {f.actual_behavior}
                      </div>
                    </div>

                    <div className="finding-card-footer">
                      <span className="font-mono text-xs text-muted">
                        Run: {f.run_id}
                      </span>
                      <button className="btn btn-cyan btn-xs">
                        <span>Inspect Evidence Dossier</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RUN HISTORY */}
        {activeTab === 'history' && (
          <RunHistoryView
            runs={runsHistory}
            activeRunId={currentRun?.run_id}
            onSelectRun={handleSelectRun}
            isLoading={isLoadingHistory}
          />
        )}
      </main>

      {/* Finding & Evidence Drawer */}
      {(selectedFinding || selectedResult) && (
        <FindingDetailDrawer
          finding={selectedFinding}
          scenarioResult={selectedResult}
          onClose={() => {
            setSelectedFinding(null);
            setSelectedResult(null);
          }}
          onRegressionCompleted={handleRegressionCompleted}
        />
      )}
    </div>
  );
};
