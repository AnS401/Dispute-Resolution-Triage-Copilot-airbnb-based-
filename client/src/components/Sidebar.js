import React from "react";

export default function Sidebar({ cases, activeCase, onSelect, analyzing }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Case queue</h2>
        <p>{cases.length} open disputes</p>
      </div>
      <div className="sidebar-list">
        {cases.map((c) => (
          <div
            key={c.id}
            className={[
              "case-item",
              activeCase && activeCase.id === c.id ? "active" : "",
              analyzing ? "disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelect(c)}
            role="button"
            tabIndex={analyzing ? -1 : 0}
            onKeyDown={(e) => e.key === "Enter" && !analyzing && onSelect(c)}
            aria-pressed={activeCase && activeCase.id === c.id}
            aria-label={`Case ${c.id}: ${c.title}`}
          >
            <span className={`case-tag ${c.tag}`}>{c.tagLabel}</span>
            <div className="case-item-title">{c.title}</div>
            <div className="case-item-sub">
              {c.id} · {c.daysOpen}d open
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
