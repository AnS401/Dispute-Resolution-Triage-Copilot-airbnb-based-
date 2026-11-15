import React from "react";

export default function FooterBar({ analyzing, analysisDone, onAnalyze }) {
  return (
    <div className="footer-bar">
      <button
        className="btn btn-primary"
        onClick={onAnalyze}
        disabled={analyzing}
        aria-busy={analyzing}
      >
        {analyzing ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Analyzing…
          </>
        ) : analysisDone ? (
          "Re-analyze"
        ) : (
          "Analyze case"
        )}
      </button>

      <button className="btn" disabled={analyzing}>
        Escalate
      </button>

      <button className="btn" disabled={analyzing}>
        Mark resolved
      </button>

      {analysisDone && !analyzing && (
        <span className="footer-status">Analysis complete</span>
      )}
    </div>
  );
}
