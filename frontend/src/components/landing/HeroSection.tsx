import React from 'react';
import { ArrowRight, ChevronRight, Activity, ShieldCheck, Camera } from 'lucide-react';
import { BrowserTestingVisual } from './BrowserTestingVisual';

interface HeroSectionProps {
  onOpenDashboard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDashboard }) => {
  const scrollToWorkflow = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Left Column: Asymmetrical Editorial Typography & Core Actions */}
        <div className="hero-content-col">
          <div className="hero-eyebrow">
            <span className="eyebrow-ping" />
            <span className="font-mono">AUTONOMOUS WEB TESTING</span>
          </div>

          <h1 className="hero-headline">
            Find the bug.
            <br />
            <span className="hero-headline-highlight">Prove the failure.</span>
          </h1>

          <p className="hero-description">
            Automate browser testing, verify suspicious failures, and inspect the evidence behind every finding.
          </p>

          <div className="hero-actions-row">
            <button className="btn btn-cyan btn-lg" onClick={onOpenDashboard}>
              <span>Launch Testing Lab</span>
              <ArrowRight size={17} />
            </button>

            <button className="btn btn-secondary btn-lg" onClick={scrollToWorkflow}>
              <span>Explore the workflow</span>
              <ChevronRight size={16} className="text-cyan" />
            </button>
          </div>

          {/* Restrained Line of Capabilities */}
          <div className="hero-capabilities-strip">
            <div className="capability-tag">
              <Activity size={14} className="text-cyan" />
              <span className="font-mono">REAL BROWSER TESTING</span>
            </div>
            <span className="capability-separator">•</span>
            <div className="capability-tag">
              <ShieldCheck size={14} className="text-pass" />
              <span className="font-mono">FAILURE VERIFICATION</span>
            </div>
            <span className="capability-separator">•</span>
            <div className="capability-tag">
              <Camera size={14} className="text-blue" />
              <span className="font-mono">EVIDENCE CAPTURE</span>
            </div>
          </div>
        </div>

        {/* Right Column: 55-65% Visual Column for Custom Browser Testing Artwork */}
        <div className="hero-visual-col">
          <BrowserTestingVisual />
        </div>
      </div>
    </section>
  );
};
