import React, { useMemo } from "react";

function parseRiskLevel(text) {
  const match = text.match(/\*\*Platform risk:\*\*\s*(HIGH|MEDIUM|LOW)/i);
  return match ? match[1].toUpperCase() : null;
}

function parseEscalation(text) {
  const match = text.match(/\*\*Escalation flag:\*\*\s*(YES|NO)/i);
  return match ? match[1].toUpperCase() : null;
}

function countPolicyViolations(text) {
  const section = text.match(/\*\*Policy violations detected:\*\*([\s\S]*?)\*\*Evidence/i);
  if (!section) return 0;
  const bullets = section[1].match(/^[-•]\s+/gm);
  return bullets ? bullets.length : 0;
}

function riskClass(level) {
  if (level === "HIGH") return "high";
  if (level === "MEDIUM") return "med";
  if (level === "LOW") return "low";
  return "neutral";
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^([-•])\s+/gm, "<br />• ")
    .replace(/^(\d+\.\s)/gm, "<br />$1")
    .replace(/\n{2,}/g, "<br /><br />")
    .replace(/\n/g, "<br />");
}

export default function AnalysisBlock({
  analysisText,
  analyzing,
  analysisDone,
  error,
}) {
  const risk = useMemo(() => parseRiskLevel(analysisText), [analysisText]);
  const escalation = useMemo(() => parseEscalation(analysisText), [analysisText]);
  const violationCount = useMemo(() => countPolicyViolations(analysisText), [analysisText]);

  const showRiskCards = analysisDone && risk;

  return (
    <div className="analysis-block">
      <div className="analysis-block-header">
        <h4>AI triage analysis</h4>
        <span className="ai-badge">Copilot</span>
        {analyzing && <div className="spinner" aria-label="Analyzing..." />}
      </div>

      <div className="analysis-body">
        {!analysisText && !error && !analyzing && (
          <p className="analysis-placeholder">
            Click "Analyze case" to generate a triage report. The copilot will
            assess policy violations, evidence gaps, risk level, and recommend a
            specific resolution path for this case.
          </p>
        )}

        {error && (
          <div className="analysis-error" role="alert">
            <span>⚠</span>
            <span>
              <strong>Error:</strong> {error}
              <br />
              Make sure the backend server is running on port 3001 and your{" "}
              <code>.env</code> file contains a valid{" "}
              <code>ANTHROPIC_API_KEY</code>.
            </span>
          </div>
        )}

        {analysisText && (
          <div
            className="analysis-stream"
            dangerouslySetInnerHTML={{
              __html:
                renderMarkdown(analysisText) +
                (analyzing ? '<span class="cursor" aria-hidden="true"></span>' : ""),
            }}
          />
        )}

        {showRiskCards && (
          <div className="risk-cards" aria-label="Case risk summary">
            <div className="risk-card">
              <div className="risk-card-label">Platform risk</div>
              <div className={`risk-card-value ${riskClass(risk)}`}>{risk}</div>
            </div>
            <div className="risk-card">
              <div className="risk-card-label">Policy violations</div>
              <div className="risk-card-value neutral">{violationCount}</div>
            </div>
            <div className="risk-card">
              <div className="risk-card-label">Escalate</div>
              <div
                className={`risk-card-value ${
                  escalation === "YES" ? "high" : "low"
                }`}
              >
                {escalation || "—"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
