import React from 'react';
import { Globe, RefreshCw, Camera } from 'lucide-react';

export const CapabilityStrip: React.FC = () => {
  return (
    <div className="capability-strip-container">
      <div className="container">
        <div className="capability-strip-row">
          <div className="capability-item">
            <div className="capability-icon-wrap">
              <Globe size={18} className="text-cyan" />
            </div>
            <div className="capability-info">
              <span className="capability-label">REAL BROWSER TESTING</span>
              <span className="capability-detail">Headless Chromium automation with locator waits & DOM assertions</span>
            </div>
          </div>

          <div className="capability-separator" />

          <div className="capability-item">
            <div className="capability-icon-wrap">
              <RefreshCw size={18} className="text-blue" />
            </div>
            <div className="capability-info">
              <span className="capability-label">FAILURE VERIFICATION</span>
              <span className="capability-detail">Bounded 2-attempt policy isolating reproducible bugs from flaky tests</span>
            </div>
          </div>

          <div className="capability-separator" />

          <div className="capability-item">
            <div className="capability-icon-wrap">
              <Camera size={18} className="text-cyan" />
            </div>
            <div className="capability-info">
              <span className="capability-label">EVIDENCE CAPTURE</span>
              <span className="capability-detail">Full-page PNG failure screenshots, console logs & diagnostic timelines</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
