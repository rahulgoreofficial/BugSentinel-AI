import React from 'react';
import {
  Globe,
  ShieldAlert,
  Camera,
  Database,
  FileSearch,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export const FeatureShowcase: React.FC = () => {
  return (
    <section id="features" className="capabilities-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            <span className="font-mono">CORE CAPABILITIES</span>
          </div>
          <h2 className="section-title">Built for evidence developers can trust.</h2>
          <p className="section-subtitle">
            Engineered with real Playwright browser automation, bounded failure verification, and persistent artifacts.
          </p>
        </div>

        {/* Varied Asymmetrical Bento Grid */}
        <div className="capabilities-bento-grid">
          {/* Card 1: Browser Automation with Real Locator Code Snippet */}
          <div className="bento-card bento-span-2 surface-card">
            <div className="bento-header">
              <div className="bento-icon-box">
                <Globe size={22} className="text-cyan" />
              </div>
              <span className="bento-badge font-mono">REAL PLAYWRIGHT CHROMIUM</span>
            </div>

            <div className="bento-body">
              <h3 className="bento-title">Automated Browser Testing</h3>
              <p className="bento-desc">
                No simulated DOM mocks or artificial delays. BugSentinel AI drives genuine headless Chromium,
                executing form entries, button triggers, and route navigations against live applications.
              </p>

              {/* Technical Code / Locator Snippet */}
              <div className="tech-snippet-box font-mono">
                <div className="snippet-bar">
                  <Terminal size={12} className="text-muted" />
                  <span className="text-2xs text-muted">engine/browser_engine.py</span>
                </div>
                <div className="snippet-line"><span className="token-fn">page.fill</span>(<span className="token-str">"#email"</span>, <span className="token-str">"not-an-email"</span>)</div>
                <div className="snippet-line"><span className="token-fn">page.click</span>(<span className="token-str">"#place-order"</span>)</div>
                <div className="snippet-line snippet-assert-fail">
                  <span className="token-comment">// Deliberate defect detected:</span>
                  <br />
                  <span className="token-fail">AssertionError: Expected rejection, but found: 'Order placed successfully!'</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bounded Failure Verification with Classification Pills */}
          <div className="bento-card surface-card">
            <div className="bento-header">
              <div className="bento-icon-box">
                <ShieldAlert size={22} className="text-fail" />
              </div>
              <span className="bento-badge font-mono">BOUNDED 2-RETRY POLICY</span>
            </div>

            <div className="bento-body">
              <h3 className="bento-title">Failure Verification</h3>
              <p className="bento-desc">
                Eliminates flakiness by triggering an immediate verification rerun before filing an issue.
              </p>

              <div className="classification-pills">
                <div className="class-pill pill-repro">
                  <span className="pill-dot dot-fail" />
                  <span className="font-mono">REPRODUCIBLE_FAILURE</span>
                </div>
                <div className="class-pill pill-flaky">
                  <span className="pill-dot dot-warn" />
                  <span className="font-mono">POTENTIALLY_FLAKY</span>
                </div>
                <div className="class-pill pill-error">
                  <span className="pill-dot dot-error" />
                  <span className="font-mono">INFRASTRUCTURE_ERROR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Evidence Capture with Real PNG Artifact Preview */}
          <div className="bento-card surface-card">
            <div className="bento-header">
              <div className="bento-icon-box">
                <Camera size={22} className="text-cyan" />
              </div>
              <span className="bento-badge font-mono">PROOF ARTIFACTS</span>
            </div>

            <div className="bento-body">
              <h3 className="bento-title">Evidence Collection</h3>
              <p className="bento-desc">
                High-resolution full-page PNG captures at the exact point of assertion failure with synchronized console logs.
              </p>

              <div className="evidence-visual-preview">
                <div className="evidence-preview-header">
                  <FileSearch size={13} className="text-cyan" />
                  <span className="font-mono text-2xs">invalid_email_attempt_2.png (124 KB)</span>
                </div>
                <div className="evidence-preview-mock">
                  <span className="mock-badge-defect font-mono">DEFECT CAPTURED: #status</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Regression Testing & SQLite Persistence */}
          <div className="bento-card bento-span-2 surface-card">
            <div className="bento-header">
              <div className="bento-icon-box">
                <Database size={22} className="text-blue" />
              </div>
              <span className="bento-badge font-mono">TARGETED RETESTING & HISTORY</span>
            </div>

            <div className="bento-body">
              <h3 className="bento-title">Regression Testing</h3>
              <p className="bento-desc">
                Every test run and finding is persisted to SQLite (`bugsentinel.sqlite3`).
                When developers submit fixes, the One-Click Regression action reruns the exact scenario and confirms resolution.
              </p>

              <div className="regression-flow-strip">
                <div className="flow-step">
                  <span className="flow-title font-mono">1. Original Finding</span>
                  <span className="flow-sub font-mono">#fnd_5662e3a7 [FAIL]</span>
                </div>
                <span className="flow-arrow">➔</span>
                <div className="flow-step">
                  <span className="flow-title font-mono">2. Developer Fix</span>
                  <span className="flow-sub font-mono">Email validation enabled</span>
                </div>
                <span className="flow-arrow">➔</span>
                <div className="flow-step active-flow">
                  <span className="flow-title font-mono">3. Regression Retest</span>
                  <span className="flow-sub text-pass font-mono">
                    <CheckCircle2 size={11} className="inline mr-1" />
                    VERIFIED RESOLVED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
