import React, { useState, useRef } from "react";
import CASES from "./cases";
import Sidebar from "./components/Sidebar";
import CaseHeader from "./components/CaseHeader";
import ComplaintCard from "./components/ComplaintCard";
import AnalysisBlock from "./components/AnalysisBlock";
import FooterBar from "./components/FooterBar";
import EmptyState from "./components/EmptyState";
import "./App.css";

function App() {
  const [activeCase, setActiveCase] = useState(null);
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  function handleSelectCase(c) {
    if (analyzing) return;
    if (abortRef.current) abortRef.current.abort();
    setActiveCase(c);
    setAnalysisText("");
    setAnalysisDone(false);
    setError(null);
  }

  async function handleAnalyze() {
    if (!activeCase || analyzing) return;
    setAnalyzing(true);
    setAnalysisText("");
    setAnalysisDone(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          caseId: activeCase.id,
          disputeType: activeCase.disputeType,
          amount: activeCase.amount,
          daysOpen: activeCase.daysOpen,
          policies: activeCase.policies,
          complaint: activeCase.complaint,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Server error — check that the backend is running.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            setAnalysisDone(true);
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setAnalysisText((prev) => prev + parsed.text);
            }
          } catch (parseErr) {
            if (parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#FF5A5F"/>
            </svg>
            <span className="app-logo-text">Dispute Resolution Copilot</span>
            <span className="app-logo-badge">Portfolio demo</span>
          </div>
          <div className="app-header-meta">
            <span>Trust &amp; Safety · Internal tool concept</span>
          </div>
        </div>
      </header>

      <div className="workspace">
        <Sidebar
          cases={CASES}
          activeCase={activeCase}
          onSelect={handleSelectCase}
          analyzing={analyzing}
        />

        <main className="main-panel">
          {!activeCase ? (
            <EmptyState />
          ) : (
            <>
              <CaseHeader activeCase={activeCase} />
              <div className="content-area">
                <ComplaintCard complaint={activeCase.complaint} policies={activeCase.policies} />
                <AnalysisBlock
                  analysisText={analysisText}
                  analyzing={analyzing}
                  analysisDone={analysisDone}
                  error={error}
                />
              </div>
              <FooterBar
                analyzing={analyzing}
                analysisDone={analysisDone}
                onAnalyze={handleAnalyze}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
