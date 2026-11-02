import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Save,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  buildReport,
  DIMENSIONS,
  METRICS,
  parseSavedReports,
  reportCSV,
  REPORT_STORAGE_KEY,
} from "./reporting.js";

const defaultConfig = {
  metric: "revenue",
  dimension: "channel",
  sortBy: "value",
  direction: "desc",
};
function readSaved() {
  try {
    return parseSavedReports(window.localStorage.getItem(REPORT_STORAGE_KEY));
  } catch {
    return [];
  }
}
function formatValue(value, metric) {
  const type = METRICS[metric].format;
  if (type === "ratio") return value.toFixed(2) + "×";
  return new Intl.NumberFormat(
    "en-US",
    type === "currency"
      ? { style: "currency", currency: "USD", maximumFractionDigits: 2 }
      : { maximumFractionDigits: 0 },
  ).format(value);
}

export default function ReportBuilder({ rows, days, channel }) {
  const [config, setConfig] = useState(defaultConfig);
  const [saved, setSaved] = useState(readSaved);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [message, setMessage] = useState("");
  const report = useMemo(() => buildReport(rows, config), [rows, config]);
  const updateConfig = (key, value) =>
    setConfig((previous) => ({ ...previous, [key]: value }));
  const persist = (next) => {
    setSaved(next);
    try {
      window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      setMessage(
        "Browser storage is unavailable. Changes are kept only in this session.",
      );
      return false;
    }
  };
  const save = (event) => {
    event.preventDefault();
    const title = name.trim();
    if (!title) {
      setMessage("Enter a report name before saving.");
      return;
    }
    if (saved.length >= 50) {
      setMessage(
        "You can save up to 50 reports. Delete a report to make room.",
      );
      return;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `report-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (persist([...saved, { id, name: title, ...config }]))
      setMessage(`Saved “${title}” in this browser.`);
    setName("");
  };
  const rename = (event) => {
    event.preventDefault();
    const title = renameText.trim();
    if (!title) {
      setMessage("The report name cannot be empty.");
      return;
    }
    if (
      persist(
        saved.map((item) =>
          item.id === renaming ? { ...item, name: title } : item,
        ),
      )
    )
      setMessage("Report renamed.");
    setRenaming(null);
  };
  const sort = (sortBy) =>
    setConfig((previous) => ({
      ...previous,
      sortBy,
      direction:
        previous.sortBy === sortBy && previous.direction === "asc"
          ? "desc"
          : "asc",
    }));
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([reportCSV(report)], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `management-report-${config.metric}-by-${config.dimension}-${days}d.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Report CSV exported with the current filters and sort order.");
  };
  const SortIcon = config.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <section
      className="report-builder"
      aria-label="Custom management report builder"
    >
      <article className="panel report-builder-panel">
        <div className="panel-heading">
          <div>
            <h2>Build a management report</h2>
            <p>
              Choose a metric and dimension. Reports use the current date and
              channel filters.
            </p>
          </div>
          <button className="button" onClick={download}>
            <Download size={15} />
            Export custom report
          </button>
        </div>
        <div className="report-builder-controls">
          <label>
            Metric
            <select
              aria-label="Report metric"
              value={config.metric}
              onChange={(event) => updateConfig("metric", event.target.value)}
            >
              {Object.entries(METRICS).map(([value, details]) => (
                <option key={value} value={value}>
                  {details.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Group by
            <select
              aria-label="Report dimension"
              value={config.dimension}
              onChange={(event) =>
                updateConfig("dimension", event.target.value)
              }
            >
              {Object.entries(DIMENSIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="report-builder-context">
            <span>Current scope</span>
            <strong>
              {days} days · {channel}
            </strong>
            <small>{report.recordCount} underlying records</small>
          </div>
        </div>
        <div className="table-scroll">
          <table aria-label="Custom report results">
            <thead>
              <tr>
                <th
                  aria-sort={
                    config.sortBy === "group"
                      ? config.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    className="report-sort-button"
                    onClick={() => sort("group")}
                  >
                    {DIMENSIONS[config.dimension]}
                    {config.sortBy === "group" && <SortIcon size={12} />}
                  </button>
                </th>
                <th
                  aria-sort={
                    config.sortBy === "value"
                      ? config.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    className="report-sort-button"
                    onClick={() => sort("value")}
                  >
                    {METRICS[config.metric].label}
                    {config.sortBy === "value" && <SortIcon size={12} />}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {report.groups.map((row) => (
                <tr key={row.group}>
                  <td>{row.group}</td>
                  <td>{formatValue(row.value, config.metric)}</td>
                </tr>
              ))}
            </tbody>
            {report.groups.length > 0 && (
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{formatValue(report.total, config.metric)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          {!report.groups.length && (
            <p className="empty">No records match the current filters.</p>
          )}
        </div>
        <p className="report-builder-note">
          AOV and marketing efficiency are recomputed from the underlying
          totals. Marketing efficiency = net revenue ÷ ad spend; zero ad spend
          is displayed as 0× in this demo. Saved reports store the metric,
          grouping, and sort order; they always use the current global filters.
        </p>
      </article>
      <aside
        className="panel saved-reports-panel"
        aria-label="Saved report configurations"
      >
        <div className="panel-heading">
          <div>
            <h2>Saved reports</h2>
            <p>Keep useful views in this browser.</p>
          </div>
          <FileText size={18} />
        </div>
        <form className="report-save-form" onSubmit={save}>
          <label htmlFor="report-name">Report name</label>
          <div>
            <input
              id="report-name"
              maxLength={80}
              placeholder="e.g. Revenue by channel"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button className="button" type="submit">
              <Save size={14} />
              Save report
            </button>
          </div>
        </form>
        <div className="saved-report-list">
          {saved.length === 0 && (
            <p className="report-builder-note">
              No saved reports yet. Choose a metric and grouping, then give your
              report a name.
            </p>
          )}
          {saved.map((item) => (
            <div className="saved-report-item" key={item.id}>
              {renaming === item.id ? (
                <form className="report-rename-form" onSubmit={rename}>
                  <input
                    aria-label="New report name"
                    maxLength={80}
                    value={renameText}
                    onChange={(event) => setRenameText(event.target.value)}
                    autoFocus
                  />
                  <button
                    className="icon-button"
                    type="submit"
                    aria-label="Confirm report rename"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Cancel report rename"
                    onClick={() => setRenaming(null)}
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    className="saved-report-load"
                    onClick={() => {
                      const { metric, dimension, sortBy, direction } = item;
                      setConfig({ metric, dimension, sortBy, direction });
                      setMessage(
                        `Loaded “${item.name}” using the current filters.`,
                      );
                    }}
                  >
                    <strong>{item.name}</strong>
                    <small>
                      {METRICS[item.metric].label} by{" "}
                      {DIMENSIONS[item.dimension].toLowerCase()}
                    </small>
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Rename ${item.name}`}
                    onClick={() => {
                      setRenaming(item.id);
                      setRenameText(item.name);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => {
                      if (
                        persist(saved.filter((report) => report.id !== item.id))
                      )
                        setMessage(`Deleted “${item.name}”.`);
                      if (renaming === item.id) setRenaming(null);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="report-builder-note">
          Stored locally on this device. No account sync, scheduled delivery, or
          server storage.
        </p>
      </aside>
      <p className="report-builder-status" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
