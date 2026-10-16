import React from 'react';
import {
  FileCode2,
  PlayCircle,
  Repeat2,
  FileCheck2,
  CheckCircle,
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  number: string;
  name: string;
  icon: React.ReactNode;
  subtitle: string;
  description: string;
  badge: string;
}

const pipelineNodes: WorkflowNode[] = [
  {
    id: 'plan',
    number: '01',
    name: 'PLAN',
    icon: <FileCode2 size={18} className="text-cyan" />,
    subtitle: 'Scenario Registry',
    description: 'Validates test requirements into deterministic automation plans, rejecting arbitrary command execution.',
    badge: 'Validated Plan',
  },
  {
    id: 'execute',
    number: '02',
    name: 'EXECUTE',
    icon: <PlayCircle size={18} className="text-blue" />,
    subtitle: 'Chromium Engine',
    description: 'Drives headless Playwright against ShopDemo, executing synthetic user interactions with stable locators.',
    badge: 'Real DOM Actions',
  },
  {
    id: 'verify',
    number: '03',
    name: 'VERIFY',
    icon: <Repeat2 size={18} className="text-warn" />,
    subtitle: 'Bounded Retry',
    description: 'Executes an immediate second attempt on failure to distinguish genuine bugs from transient flakiness.',
    badge: 'Max 2 Attempts',
  },
  {
    id: 'report',
    number: '04',
    name: 'REPORT',
    icon: <FileCheck2 size={18} className="text-fail" />,
    subtitle: 'Evidence Bundle',
    description: 'Compiles expected vs actual behavior, full-page PNG screenshots, and synchronized console streams.',
    badge: 'Visual Artifacts',
  },
  {
    id: 'regress',
    number: '05',
    name: 'REGRESS',
    icon: <CheckCircle size={18} className="text-pass" />,
    subtitle: 'Targeted Retesting',
    description: 'Re-runs the exact defect scenario after a bug fix to confirm resolution and update SQLite records.',
    badge: 'Verified Fixes',
  },
];

export const WorkflowSection: React.FC = () => {
  return (
    <section id="workflow" className="workflow-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            <span className="font-mono">AUTONOMOUS LIFECYCLE</span>
          </div>
          <h2 className="section-title">From execution to evidence.</h2>
          <p className="section-subtitle">
            Follow every browser test from its initial DOM action to verified, reproducible photographic evidence.
          </p>
        </div>

        {/* Connected Architectural Pipeline */}
        <div className="workflow-pipeline-wrapper">
          <div className="pipeline-track-line" />

          <div className="workflow-nodes-container">
            {pipelineNodes.map((node) => (
              <div key={node.id} className="pipeline-node-item">
                <div className="node-marker-wrapper">
                  <div className="node-marker-ring">
                    {node.icon}
                  </div>
                  <span className="node-number font-mono">{node.number}</span>
                </div>

                <div className="node-content-block surface-card">
                  <div className="node-header">
                    <span className="node-badge font-mono">{node.badge}</span>
                  </div>
                  <h3 className="node-title font-mono">{node.name}</h3>
                  <span className="node-subtitle">{node.subtitle}</span>
                  <p className="node-desc">{node.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
