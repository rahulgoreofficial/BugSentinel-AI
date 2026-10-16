import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import type { RunSummaryResponse } from '../../types/api';

interface RunHistoryViewProps {
  runs: RunSummaryResponse[];
  activeRunId?: string | null;
  onSelectRun: (runId: string) => void;
  isLoading?: boolean;
}

export const RunHistoryView: React.FC<RunHistoryViewProps> = ({
  runs,
  activeRunId,
  onSelectRun,
  isLoading = false,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="run-history-container surface-card">
      <div className="history-header">
        <div className="history-title-wrap">
          <History size={18} className="text-cyan" />
          <h3 className="history-title">Persistent Execution History</h3>
          <span className="history-count font-mono">{runs.length} runs</span>
        </div>
        <span className="text-xs text-muted">Stored in SQLite (`bugsentinel.sqlite3`)</span>
      </div>

      {isLoading ? (
        <div className="history-loading-box">
          <span className="history-spinner spin-slow" />
          <span className="text-xs text-muted">Fetching historical runs from database...</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="history-empty-box">
          <History size={24} className="text-muted" />
          <p className="empty-title">No test runs recorded yet</p>
          <p className="empty-desc">Click "Run Tests" above to execute your first automated browser test.</p>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>RUN ID</th>
                <th>TIMESTAMP</th>
                <th>STATUS</th>
                <th>RESULTS</th>
                <th>DURATION</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const isSelected = r.run_id === activeRunId;
                return (
                  <tr
                    key={r.run_id}
                    className={`history-row ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => onSelectRun(r.run_id)}
                  >
                    <td className="font-mono text-cyan font-semibold">
                      {r.run_id}
                    </td>
                    <td className="text-secondary text-xs">
                      {formatTime(r.started_at)}
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'COMPLETED' ? 'badge-pass' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="history-counts-strip font-mono text-xs">
                        <span className="count-pass" title="Passed tests">
                          ✓ {r.passed_count}
                        </span>
                        <span className="count-fail" title="Failed tests">
                          ✗ {r.failed_count}
                        </span>
                        {r.flaky_count > 0 && (
                          <span className="count-flaky" title="Flaky tests">
                            ⚠ {r.flaky_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {r.duration_ms} ms
                    </td>
                    <td>
                      <button
                        className={`btn btn-xs ${isSelected ? 'btn-cyan' : 'btn-secondary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRun(r.run_id);
                        }}
                      >
                        <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                        <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
