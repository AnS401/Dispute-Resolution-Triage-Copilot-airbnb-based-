import React from "react";

export default function CaseHeader({ activeCase }) {
  return (
    <div className="case-header">
      <div className="case-header-top">
        <h3>{activeCase.title}</h3>
        <span className={`status-badge ${activeCase.badge}`}>
          {activeCase.badgeLabel}
        </span>
      </div>
      <div className="meta-row">
        <span className="meta-item">
          Case <span>{activeCase.id}</span>
        </span>
        <span className="meta-item">
          Type <span>{activeCase.disputeType}</span>
        </span>
        <span className="meta-item">
          Amount <span>{activeCase.amount}</span>
        </span>
        <span className="meta-item">
          Open <span>{activeCase.daysOpen} days</span>
        </span>
      </div>
    </div>
  );
}
