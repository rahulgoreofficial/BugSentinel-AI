import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Activity,
  Layers,
  Lock,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export const BrowserTestingVisual: React.FC = () => {
  return (
    <div className="hero-visual-wrapper" aria-label="BugSentinel AI Autonomous Browser Testing Visualization">
      {/* Layer 1: Atmospheric Radial Glow & Geometric Diagnostics */}
      <div className="visual-glow-backdrop" />
      <div className="visual-diagnostic-grid" />

      {/* Layer 2: Substantial Floating 3D Browser Chassis */}
      <div className="browser-frame-container">
        {/* Browser Top Toolbar */}
        <div className="browser-header">
          <div className="window-dots">
            <span className="dot dot-close" />
            <span className="dot dot-minimize" />
            <span className="dot dot-maximize" />
          </div>

          <div className="browser-url-bar">
            <Lock className="url-icon-lock" size={12} />
            <span className="url-protocol">http://127.0.0.1:8000/</span>
            <span className="url-path">demo/checkout</span>
          </div>

          <div className="browser-badge-status">
            <span className="status-live-indicator" />
            <span className="status-text font-mono">CHROMIUM 156.0 • HEADLESS</span>
          </div>
        </div>

        {/* Browser Viewport with Real ShopDemo Target & Assertion Telemetry */}
        <div className="browser-viewport">
          {/* Active Diagnostic Traversing Scanline */}
          <div className="viewport-scanline" />

          {/* Left Viewport: ShopDemo Target Application Preview */}
          <div className="viewport-demo-content">
            <div className="demo-header-strip">
              <div className="demo-brand-block">
                <span className="demo-logo-glyph">⚡</span>
                <span className="demo-brand-name">ShopDemo Store</span>
              </div>
              <span className="demo-target-tag font-mono">TARGET APP</span>
            </div>

            <div className="demo-form-simulation">
              <div className="sim-field">
                <span className="sim-label">Customer Name</span>
                <div className="sim-input filled">BugHunter QA</div>
              </div>

              {/* Deliberate Defect Highlight Field */}
              <div className="sim-field has-defect-focus">
                <div className="defect-callout">
                  <span className="defect-callout-pulse" />
                  <span className="defect-callout-text font-mono">ASSERTION MISMATCH DETECTED</span>
                </div>
                <span className="sim-label defect-label">Email Address</span>
                <div className="sim-input defect-input font-mono">
                  <span>not-an-email</span>
                  <AlertTriangle className="input-warn-icon" size={13} />
                </div>
              </div>

              <div className="sim-field">
                <span className="sim-label">Shipping Address</span>
                <div className="sim-input filled">100 QA Verification Lane</div>
              </div>

              {/* Simulated Defective False-Success Notice */}
              <div className="sim-status-box defective-success">
                <div className="sim-status-indicator" />
                <span className="text-2xs font-mono">Order #ORD-705285 confirmed for BugHunter QA (not-an-email).</span>
              </div>
            </div>
          </div>

          {/* Right Viewport: Compact Execution & Assertion Telemetry */}
          <div className="viewport-telemetry-panel">
            <div className="telemetry-header">
              <Activity size={13} className="text-cyan" />
              <span className="font-mono">TEST EXECUTION SEQUENCE</span>
            </div>

            <div className="telemetry-steps">
              {/* Step 01 */}
              <div className="step-item step-pass">
                <div className="step-index font-mono">01</div>
                <div className="step-content">
                  <div className="step-title">Open application</div>
                  <div className="step-meta font-mono">200 OK • 12ms</div>
                </div>
                <CheckCircle2 size={14} className="step-icon text-pass" />
              </div>

              {/* Step 02 */}
              <div className="step-item step-pass">
                <div className="step-index font-mono">02</div>
                <div className="step-content">
                  <div className="step-title">Execute checkout</div>
                  <div className="step-meta font-mono">Filled fields • Click #place-order</div>
                </div>
                <CheckCircle2 size={14} className="step-icon text-pass" />
              </div>

              {/* Step 03: Failing Step */}
              <div className="step-item step-fail">
                <div className="step-index font-mono">03</div>
                <div className="step-content">
                  <div className="step-title">Verify expected behavior</div>
                  <div className="step-meta text-fail font-mono">Rejected assertion: invalid email accepted</div>
                </div>
                <ShieldAlert size={14} className="step-icon text-fail" />
              </div>

              {/* Step 04: Bounded Evidence Capture */}
              <div className="step-item step-active">
                <div className="step-index font-mono">04</div>
                <div className="step-content">
                  <div className="step-title">Capture evidence</div>
                  <div className="step-meta text-cyan font-mono">PNG artifact saved • Logs recorded</div>
                </div>
                <Camera size={13} className="step-icon text-cyan" />
              </div>
            </div>

            {/* Evidence Card Snippet */}
            <div className="telemetry-evidence-card">
              <div className="evidence-card-top">
                <Terminal size={12} className="text-cyan" />
                <span className="font-mono text-2xs font-bold text-cyan">EVIDENCE ARTIFACT READY</span>
              </div>
              <div className="evidence-filename font-mono">
                invalid_email_attempt_2.png
              </div>
              <div className="evidence-badge-repro font-mono">
                REPRODUCIBLE_FAILURE [CONFIRMED]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 4: Connected Purposeful Diagnostic Nodes */}
      <div className="satellite-node node-left">
        <div className="node-icon-box">
          <Layers size={14} className="text-cyan" />
        </div>
        <div className="node-info">
          <span className="node-title font-mono">BOUNDED RETRY</span>
          <span className="node-sub font-mono">Attempt 1 ➔ Attempt 2 Verified</span>
        </div>
      </div>

      <div className="satellite-node node-right">
        <div className="node-icon-box box-red">
          <RefreshCw size={13} className="text-fail spin-slow" />
        </div>
        <div className="node-info">
          <span className="node-title font-mono">EVIDENCE BUNDLE</span>
          <span className="node-sub font-mono">Screenshot & Log Proof Stored</span>
        </div>
      </div>
    </div>
  );
};
