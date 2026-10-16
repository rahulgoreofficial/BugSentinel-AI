import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Layers,
} from 'lucide-react';
import type { FindingResponse, RegressionResponse, ScenarioResult } from '../../types/api';
import { api } from '../../lib/api';
import { ScreenshotModal } from './ScreenshotModal';

interface FindingDetailDrawerProps {
  finding?: FindingResponse | null;
  scenarioResult?: ScenarioResult | null;
  onClose: () => void;
  onRegressionCompleted?: (regression: RegressionResponse) => void;
}

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({
  finding,
  scenarioResult,
  onClose,
  onRegressionCompleted,
}) => {
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [retesting, setRetesting] = useState(false);
  const [regressionResult, setRegressionResult] = useState<RegressionResponse | null>(null);
  const [regressionError, setRegressionError] = useState<string | null>(null);

  if (!finding && !scenarioResult) return null;

  const scenarioId = finding?.scenario_id || scenarioResult?.scenario_id || 'unknown';
  const title = finding?.title || scenarioResult?.title || 'Scenario Details';
  const expected = finding?.expected_behavior || scenarioResult?.expected_behavior || 'N/A';
  const actual = finding?.actual_behavior || scenarioResult?.actual_behavior || scenarioResult?.error_message || 'N/A';
  const severity = finding?.severity || 'MEDIUM';
  const classification = finding?.classification || scenarioResult?.classification || 'NONE';
  const screenshotRelative = finding?.screenshot_url || scenarioResult?.attempts.find(a => a.screenshot_url)?.screenshot_url;
  const screenshotFullUrl = api.getArtifactUrl(screenshotRelative);

  const logs = finding?.logs && finding.logs.length > 0
    ? finding.logs
    : scenarioResult?.attempts.flatMap(a => [
        `--- Attempt ${a.attempt_number} (status=${a.status}, duration=${a.duration_ms}ms) ---`,
        ...a.logs,
      ]) || [];

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleRunRegression = async () => {
    if (!finding?.finding_id) return;
    setRetesting(true);
    setRegressionError(null);
    setRegressionResult(null);

    try {
      const result = await api.runRegression(finding.finding_id);
      setRegressionResult(result);
      if (onRegressionCompleted) {
        onRegressionCompleted(result);
      }
    } catch (err: any) {
      setRegressionError(err.message || 'Regression retest failed');
    } finally {
      setRetesting(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}>
        <div className="finding-drawer-content" onClick={(e) => e.stopPropagation()}>
          {/* Drawer Header */}
          <div className="drawer-header">
            <div className="drawer-title-area">
              <div className="drawer-badges-row">
                <span className={`badge ${classification === 'REPRODUCIBLE_FAILURE' ? 'badge-fail' : classification === 'POTENTIALLY_FLAKY' ? 'badge-warning' : 'badge-info'}`}>
                  {classification}
                </span>
                {finding && (
                  <span className={`badge badge-severity-${severity.toLowerCase()}`}>
                    SEVERITY: {severity}
                  </span>
                )}
                <span className="drawer-scenario-id font-mono">{scenarioId}</span>
              </div>
              <h2 className="drawer-title">{title}</h2>
            </div>

            <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="drawer-scroll-body">
            {/* Behavior Comparison: Expected vs Actual */}
            <div className="behavior-comparison-grid">
              <div className="behavior-box expected-box">
                <div className="behavior-header text-pass">
                  <CheckCircle2 size={15} />
                  <span>EXPECTED BEHAVIOR</span>
                </div>
                <div className="behavior-body">{expected}</div>
              </div>

              <div className="behavior-box actual-box">
                <div className="behavior-header text-fail">
                  <ShieldAlert size={15} />
                  <span>ACTUAL BEHAVIOR OBSERVED</span>
                </div>
                <div className="behavior-body">{actual}</div>
              </div>
            </div>

            {/* Regression Retest Action Section */}
            {finding && (
              <div className="regression-action-card surface-card">
                <div className="regression-card-header">
                  <div className="reg-title-wrap">
                    <RefreshCw size={16} className={`text-cyan ${retesting ? 'spin-slow' : ''}`} />
                    <span className="font-semibold">Regression Retest Validation</span>
                  </div>
                  <button
                    className="btn btn-cyan btn-sm"
                    onClick={handleRunRegression}
                    disabled={retesting}
                  >
                    {retesting ? (
                      <>
                        <RefreshCw size={13} className="spin-slow" />
                        <span>Retesting in Chromium...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} />
                        <span>Rerun Scenario Now</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="reg-desc text-xs text-muted">
                  Executes the exact scenario again via Playwright to verify if a code fix in ShopDemo resolved this bug.
                </p>

                {regressionResult && (
                  <div className={`regression-feedback ${regressionResult.defect_resolved ? 'feedback-resolved' : 'feedback-unresolved'}`}>
                    <div className="feedback-status-row">
                      {regressionResult.defect_resolved ? (
                        <>
                          <CheckCircle2 size={16} className="text-pass" />
                          <strong className="text-pass">DEFECT RESOLVED</strong>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} className="text-fail" />
                          <strong className="text-fail">DEFECT STILL PRESENT</strong>
                        </>
                      )}
                    </div>
                    <div className="feedback-message">{regressionResult.message}</div>
                    <div className="feedback-meta font-mono text-xs">
                      Regression Run: {regressionResult.regression_run.run_id} • Passed: {regressionResult.regression_run.passed_count} • Failed: {regressionResult.regression_run.failed_count}
                    </div>
                  </div>
                )}

                {regressionError && (
                  <div className="regression-feedback feedback-error text-fail text-xs">
                    {regressionError}
                  </div>
                )}
              </div>
            )}

            {/* Visual Screenshot Evidence */}
            <div className="evidence-section">
              <div className="section-title-row">
                <div className="title-with-icon">
                  <Camera size={16} className="text-cyan" />
                  <h3>Failure Screenshot Artifact</h3>
                </div>
                {screenshotFullUrl && (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => setScreenshotModalOpen(true)}
                  >
                    <Maximize2 size={12} />
                    <span>Fullscreen Zoom</span>
                  </button>
                )}
              </div>

              {screenshotFullUrl ? (
                <div
                  className="screenshot-preview-container"
                  onClick={() => setScreenshotModalOpen(true)}
                  title="Click to view full-resolution screenshot"
                >
                  <img
                    src={screenshotFullUrl}
                    alt="Defect visual evidence"
                    className="screenshot-preview-img"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="screenshot-preview-overlay">
                    <Maximize2 size={24} className="text-cyan" />
                    <span>Click to zoom high-resolution capture</span>
                  </div>
                </div>
              ) : (
                <div className="empty-artifact-box">
                  <Camera size={24} className="text-muted" />
                  <span>No visual screenshot artifact generated for this test.</span>
                </div>
              )}
            </div>

            {/* Execution Attempt Breakdown */}
            {scenarioResult?.attempts && scenarioResult.attempts.length > 0 && (
              <div className="attempts-breakdown-section">
                <div className="title-with-icon">
                  <Layers size={16} className="text-blue" />
                  <h3>Bounded Execution Attempts ({scenarioResult.attempts.length}/2)</h3>
                </div>

                <div className="attempts-list">
                  {scenarioResult.attempts.map((att) => (
                    <div key={att.attempt_number} className="attempt-card surface-card">
                      <div className="attempt-card-top">
                        <span className="font-mono text-xs font-semibold">
                          Attempt #{att.attempt_number}
                        </span>
                        <span className={`badge ${att.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                          {att.status}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {att.duration_ms} ms
                        </span>
                      </div>
                      {att.error_message && (
                        <div className="attempt-err font-mono text-xs text-fail">
                          {att.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Logs */}
            <div className="logs-section">
              <div className="section-title-row">
                <div className="title-with-icon">
                  <Terminal size={16} className="text-cyan" />
                  <h3>Browser Execution & Console Stream</h3>
                </div>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={handleCopyLogs}
                  disabled={logs.length === 0}
                >
                  {copiedLogs ? (
                    <>
                      <Check size={12} className="text-pass" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Logs</span>
                    </>
                  )}
                </button>
              </div>

              <div className="logs-viewer-container font-mono">
                {logs.length > 0 ? (
                  logs.map((line, idx) => (
                    <div
                      key={idx}
                      className={`log-line ${
                        line.includes('[defect_detected]') || line.includes('[assertion_failed]')
                          ? 'log-error'
                          : line.includes('[console.warning]') || line.includes('[warn]')
                          ? 'log-warn'
                          : line.includes('[verify]')
                          ? 'log-success'
                          : ''
                      }`}
                    >
                      <span className="log-line-num">{idx + 1}</span>
                      <span className="log-line-text">{line}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted text-xs p-3">No console logs recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Screenshot Modal */}
      {screenshotModalOpen && screenshotFullUrl && (
        <ScreenshotModal
          imageUrl={screenshotFullUrl}
          title={title}
          onClose={() => setScreenshotModalOpen(false)}
        />
      )}
    </>
  );
};
