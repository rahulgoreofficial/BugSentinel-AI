import React from 'react';
import { ShieldCheck, SearchCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ProductValueSectionProps {
  onOpenDashboard: () => void;
}

export const ProductValueSection: React.FC<ProductValueSectionProps> = ({ onOpenDashboard }) => {
  return (
    <section className="product-value-section">
      <div className="container">
        <div className="value-deck-card surface-deck">
          <div className="value-grid-layout">
            {/* Left Column: Conceptual Value */}
            <div className="value-text-col">
              <div className="section-eyebrow">
                <span className="eyebrow-dot" />
                <span className="font-mono">FORENSIC PRECISION</span>
              </div>

              <h2 className="value-heading">
                More than a failure status.
                <br />
                <span className="text-cyan">Evidence you can investigate.</span>
              </h2>

              <p className="value-paragraph">
                Conventional test runners output a red exit code and leave developers digging through thousands of lines of logs. BugSentinel AI automates the investigation: it captures full-page browser screenshots at the exact instant of assertion failure, verifies whether the defect is reproducible or flaked, and delivers a complete evidence dossier.
              </p>

              <div className="value-points-list">
                <div className="value-point-item">
                  <CheckCircle2 size={16} className="text-pass shrink-0" />
                  <span>
                    <strong>Side-by-side behavioral comparison:</strong> Clearly distinguishes what the application was expected to do versus what actually happened in the DOM.
                  </span>
                </div>

                <div className="value-point-item">
                  <CheckCircle2 size={16} className="text-pass shrink-0" />
                  <span>
                    <strong>Bounded 2-attempt verification:</strong> Stops phantom issues from polluting team sprints by validating failure reproducibility immediately.
                  </span>
                </div>

                <div className="value-point-item">
                  <CheckCircle2 size={16} className="text-pass shrink-0" />
                  <span>
                    <strong>Closed-loop regression retesting:</strong> Retests individual failed scenarios against fixed code with a single click, linking findings directly to resolution runs.
                  </span>
                </div>
              </div>

              <div className="value-action-row">
                <button className="btn btn-cyan btn-md" onClick={onOpenDashboard}>
                  <span>Try It in the Testing Lab</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Right Column: Architectural Comparison Graphic */}
            <div className="value-graphic-col">
              <div className="comparison-card conventional-approach">
                <div className="comparison-header">
                  <span className="comparison-label font-mono">CONVENTIONAL TEST RUNNER</span>
                  <span className="status-badge-fail font-mono">EXIT CODE 1</span>
                </div>
                <div className="comparison-body font-mono text-xs">
                  <p className="text-fail">FAIL: test_checkout.py::test_invalid_email</p>
                  <p className="text-muted">AssertionError: Expected False, got True</p>
                  <p className="text-muted">Process finished with exit code 1</p>
                  <div className="comparison-note text-2xs text-muted">No screenshot. No verification. Is it reproducible?</div>
                </div>
              </div>

              <div className="comparison-arrow">
                <span className="font-mono text-cyan text-xs">VS</span>
              </div>

              <div className="comparison-card sentinel-approach">
                <div className="comparison-header">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-cyan" />
                    <span className="comparison-label font-mono text-cyan">BUGSENTINEL FORENSIC FINDING</span>
                  </div>
                  <span className="status-badge-repro font-mono">REPRODUCIBLE [2/2]</span>
                </div>
                <div className="comparison-body">
                  <div className="sentinel-mini-row font-mono text-xs">
                    <span className="text-muted">Scenario:</span> invalid_email_is_rejected
                  </div>
                  <div className="sentinel-mini-row font-mono text-xs">
                    <span className="text-muted">Expected:</span> Form rejects invalid email
                  </div>
                  <div className="sentinel-mini-row font-mono text-xs text-fail">
                    <span>Actual:</span> False order #ORD-705285 confirmed
                  </div>
                  <div className="sentinel-evidence-pill">
                    <SearchCheck size={12} className="text-cyan" />
                    <span className="font-mono text-2xs text-cyan">Full-page PNG Screenshot & Browser Console Captured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
