import React from 'react';
import { ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

interface FinalCallToActionProps {
  onOpenDashboard: () => void;
}

export const FinalCallToAction: React.FC<FinalCallToActionProps> = ({ onOpenDashboard }) => {
  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="final-cta-card surface-deck">
          <div className="cta-glow-backdrop" />
          
          <div className="cta-content-inner">
            <div className="cta-eyebrow">
              <ShieldCheck size={14} className="text-cyan" />
              <span className="font-mono">TESTING WORKSPACE READY</span>
            </div>

            <h2 className="cta-headline">
              Every failure tells a story.
              <br />
              <span className="text-cyan">Find the evidence.</span>
            </h2>

            <p className="cta-description">
              Start with a controlled browser-testing run against ShopDemo and inspect real-time results, reproducibility classifications, and screenshot artifacts inside BugSentinel AI.
            </p>

            <div className="cta-buttons-row">
              <button className="btn btn-cyan btn-lg" onClick={onOpenDashboard}>
                <span>Launch Testing Lab</span>
                <ArrowRight size={17} />
              </button>

              <a
                href="http://127.0.0.1:8000/demo/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <span>Inspect Target App</span>
                <Terminal size={15} className="text-muted" />
              </a>
            </div>

            <div className="cta-meta-strip font-mono text-2xs text-muted">
              Connected Target: http://127.0.0.1:8000/demo/ • SQLite Persistence • Chromium Headless
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
