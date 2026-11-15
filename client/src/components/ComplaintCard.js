import React from "react";

export default function ComplaintCard({ complaint, policies }) {
  return (
    <div className="complaint-card">
      <h4>Guest / host complaint</h4>
      <p className="complaint-text">{complaint}</p>
      <div className="policy-pills">
        {policies.map((p) => (
          <span key={p} className="policy-pill">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
