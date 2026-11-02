import React, { useState } from "react";
import { defaultGoals, evaluateGoals, validGoals } from "./goals.js";
const key = "polar-demo-goals-v1";
const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
function load() {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return validGoals(value) ? value : defaultGoals;
  } catch {
    return defaultGoals;
  }
}
export default function GoalsAlerts({ rows, previousRows, channel }) {
  const [goals, setGoals] = useState(load);
  const [draft, setDraft] = useState(goals);
  const [message, setMessage] = useState("");
  const result = evaluateGoals(rows, previousRows, goals);
  function save(event) {
    event.preventDefault();
    const value = Object.fromEntries(
      Object.entries(draft).map(([name, number]) => [name, Number(number)]),
    );
    if (!validGoals(value)) {
      setMessage(
        "Enter a positive revenue target and percentages between 0 and 100.",
      );
      return;
    }
    setGoals(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setMessage("Goals saved in this browser.");
    } catch {
      setMessage(
        "Goals applied for this session. Browser storage is unavailable.",
      );
    }
  }
  return (
    <section className="goals-layout">
      <article className="panel goals-panel">
        <div className="panel-heading">
          <div>
            <h2>Revenue goal</h2>
            <p>Target for {channel.toLowerCase()} · selected period</p>
          </div>
          <span className="margin-badge">Local goal</span>
        </div>
        <div className="goal-body">
          <div className="goal-amount">
            <strong>{currency(result.summary.revenue)}</strong>
            <span>of {currency(result.target)} prorated target</span>
          </div>
          <progress
            aria-label="Revenue goal progress"
            max="100"
            value={Math.min(result.progress, 100)}
          />
          <p>
            {result.progress.toFixed(1)}% achieved ·{" "}
            {result.summary.revenue >= result.target
              ? "Target reached"
              : currency(result.target - result.summary.revenue) + " remaining"}
          </p>
          <p className="muted">
            A monthly target is divided by the actual number of days in each
            calendar month, then summed for the selected days. The target
            applies to the current channel selection.
          </p>
        </div>
      </article>
      <article className="panel goals-panel">
        <div className="panel-heading">
          <div>
            <h2>Goal & alert settings</h2>
            <p>Saved on this device; no messages are sent.</p>
          </div>
        </div>
        <form onSubmit={save} className="goal-form">
          <label>
            Monthly net revenue target (USD)
            <input
              aria-label="Monthly net revenue target"
              type="number"
              min="1"
              step="any"
              required
              value={draft.monthlyRevenue}
              onChange={(e) =>
                setDraft({ ...draft, monthlyRevenue: e.target.value })
              }
            />
          </label>
          <div className="goal-fields">
            <label>
              Minimum profit margin (%)
              <input
                aria-label="Minimum profit margin"
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={draft.marginFloor}
                onChange={(e) =>
                  setDraft({ ...draft, marginFloor: e.target.value })
                }
              />
            </label>
            <label>
              Revenue decline limit (%)
              <input
                aria-label="Revenue decline limit"
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={draft.declineLimit}
                onChange={(e) =>
                  setDraft({ ...draft, declineLimit: e.target.value })
                }
              />
            </label>
          </div>
          <button className="button primary" type="submit">
            Save goals
          </button>
          <p role="status">{message}</p>
        </form>
      </article>
      <article className="panel alerts-panel">
        <div className="panel-heading">
          <div>
            <h2>Metric checks</h2>
            <p>
              Deterministic threshold rules evaluated on the selected demo data.
            </p>
          </div>
        </div>
        <div className="rule-list">
          {result.rules.map((rule) => (
            <div className="rule-row" key={rule.id}>
              <div>
                <strong>{rule.label}</strong>
                <p>{rule.detail}</p>
              </div>
              <span
                className={rule.triggered ? "rule-warning" : "margin-badge"}
              >
                {rule.triggered ? "Needs attention" : "Within limits"}
              </span>
            </div>
          ))}
        </div>
        <p className="pnl-note">
          These local checks are not Polar's anomaly detection, forecasting,
          Slack integration, or email delivery.
        </p>
      </article>
    </section>
  );
}
