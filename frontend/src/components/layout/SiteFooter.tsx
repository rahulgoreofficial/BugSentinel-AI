import React from 'react';
import { ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-left">
          <div className="footer-brand">
            <ShieldCheck size={18} className="text-cyan" />
            <span className="footer-brand-name">BugSentinel AI</span>
            <span className="footer-version-tag">v0.1.0 • Phase 2</span>
          </div>
          <p className="footer-desc">
            AI-assisted autonomous browser testing, failure verification, and evidence-based bug reporting.
          </p>
        </div>

        <div className="footer-meta-block">
          <div className="meta-item">
            <Cpu size={14} className="text-muted" />
            <span>Playwright Chromium 156.0 Headless Engine</span>
          </div>
          <div className="meta-item">
            <Terminal size={14} className="text-muted" />
            <span>FastAPI Backend • SQLite Data Persistence</span>
          </div>
          <div className="footer-copyright">
            © 2026 BugSentinel AI. Built for Google Antigravity Hackathon.
          </div>
        </div>
      </div>
    </footer>
  );
};
