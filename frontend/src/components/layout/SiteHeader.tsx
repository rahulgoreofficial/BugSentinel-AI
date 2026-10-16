import React, { useState } from 'react';
import { ShieldCheck, Menu, X, ArrowRight, ExternalLink } from 'lucide-react';

interface SiteHeaderProps {
  onOpenDashboard: () => void;
  onNavigateLanding?: () => void;
  activeView?: string;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  onOpenDashboard,
  onNavigateLanding,
  activeView = 'landing',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo & Wordmark */}
        <div
          className="brand-logo-area"
          onClick={onNavigateLanding}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-glyph">
            <ShieldCheck size={20} className="glyph-icon" />
            <span className="glyph-pulse" />
          </div>
          <div className="brand-text">
            <span className="brand-name">BUGSENTINEL</span>
            <span className="brand-badge">AI</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <a
            href="#workflow"
            className="nav-link"
            onClick={(e) => {
              if (activeView !== 'landing' && onNavigateLanding) {
                e.preventDefault();
                onNavigateLanding();
                setTimeout(() => {
                  document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          >
            Workflow
          </a>
          <a
            href="#capabilities"
            className="nav-link"
            onClick={(e) => {
              if (activeView !== 'landing' && onNavigateLanding) {
                e.preventDefault();
                onNavigateLanding();
                setTimeout(() => {
                  document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          >
            Capabilities
          </a>
          <a
            href="http://127.0.0.1:8000/demo/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link nav-link-external"
            title="Open ShopDemo Application under test in a new tab"
          >
            <span>ShopDemo Target</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link nav-link-external"
            title="Open FastAPI Swagger Documentation"
          >
            <span>API Docs</span>
            <ExternalLink size={12} />
          </a>
        </nav>

        {/* Header Right Action */}
        <div className="header-actions">
          <button
            className={`btn ${activeView === 'dashboard' ? 'btn-secondary' : 'btn-cyan'} header-cta-btn`}
            onClick={onOpenDashboard}
          >
            <span>{activeView === 'dashboard' ? 'In Testing Lab' : 'Launch Testing Lab'}</span>
            <ArrowRight size={15} />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown">
          <div className="container mobile-dropdown-inner">
            <a
              href="#workflow"
              className="mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                if (activeView !== 'landing' && onNavigateLanding) onNavigateLanding();
              }}
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              className="mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                if (activeView !== 'landing' && onNavigateLanding) onNavigateLanding();
              }}
            >
              Capabilities
            </a>
            <a
              href="http://127.0.0.1:8000/demo/"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-link"
            >
              ShopDemo Target App ↗
            </a>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-link"
            >
              API Swagger Docs ↗
            </a>
            <button
              className="btn btn-cyan btn-full-width"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDashboard();
              }}
            >
              <span>Launch Testing Lab</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
