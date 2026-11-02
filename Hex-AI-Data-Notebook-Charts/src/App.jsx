import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  Download,
  FileText,
  FolderOpen,
  History,
  Layers,
  Menu,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Square,
  Table2,
  Terminal,
  Text,
  Waypoints,
  X,
} from "lucide-react";
import {
  csvContent,
  defaultNote,
  formatValue,
  money,
  orders,
  PREF_KEY,
  queries,
  readNotebook,
  regions,
  schema,
  suggestQuery,
} from "./data.js";
import { runSql } from "./runner.js";
import ResultChart from "./chart.jsx";
import { downloadFile, ResultTable } from "./ui.jsx";

const timeLabel = (value) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(new Date(value));
export default function App() {
  const [initial] = useState(readNotebook);
  const [query, setQuery] = useState(initial.query),
    [note, setNote] = useState(initial.note),
    [region, setRegion] = useState(initial.region),
    [chartType, setChartType] = useState(initial.chartType);
  const [mode, setMode] = useState("Notebook"),
    [mobileNav, setMobileNav] = useState(false),
    [panel, setPanel] = useState("Helper"),
    [helperOpen, setHelperOpen] = useState(false);
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("idle"),
    [error, setError] = useState("");
  const [xAxis, setXAxis] = useState("month"),
    [yAxis, setYAxis] = useState("revenue"),
    [editingNote, setEditingNote] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [question, setQuestion] = useState(""),
    [suggestion, setSuggestion] = useState(null),
    [reply, setReply] = useState(""),
    [asked, setAsked] = useState(""),
    [history, setHistory] = useState([]),
    [toast, setToast] = useState("");
  const sequence = useRef(0),
    controller = useRef(null),
    mounted = useRef(false),
    editorRef = useRef(null),
    helperRef = useRef(null);
  const dirty = Boolean(
    result &&
      (result.query.trim() !== query.trim() || result.region !== region),
  );
  async function execute(
    sql = query,
    parameter = region,
    suggestionTitle = null,
  ) {
    controller.current?.abort();
    const id = ++sequence.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setStatus("running");
    setError("");
    const started = performance.now();
    try {
      const response = await runSql(sql, parameter, { signal: abort.signal });
      if (!mounted.current || id !== sequence.current) return null;
      const duration = performance.now() - started,
        at = Date.now(),
        numeric = response.columns.filter((column, index) =>
          response.rows.some(
            (row) =>
              typeof row[index] === "number" && Number.isFinite(row[index]),
          ),
        );
      const output = {
        ...response,
        query: sql,
        region: parameter,
        duration,
        at,
        runId: id,
      };
      setResult(output);
      setStatus("success");
      setXAxis((current) =>
        response.columns.includes(current)
          ? current
          : response.columns[0] || "",
      );
      setYAxis((current) =>
        numeric.includes(current)
          ? current
          : numeric.includes("revenue")
            ? "revenue"
            : numeric[0] || "",
      );
      setHistory((current) =>
        [
          {
            id,
            query: sql,
            region: parameter,
            status: "success",
            count: response.rows.length,
            duration,
            at,
          },
          ...current,
        ].slice(0, 8),
      );
      if (suggestionTitle) {
        const revenueIndex = response.columns.indexOf("revenue");
        const first = response.rows[0];
        setReply(
          `${suggestionTitle} returned ${response.rows.length} rows.${first ? ` First result: ${String(first[0])}${revenueIndex >= 0 ? " · " + money(first[revenueIndex]) : ""}.` : ""} This comes from the executed local SQL template, not an AI model.`,
        );
      }
      return output;
    } catch (failure) {
      if (!mounted.current || id !== sequence.current) return null;
      const cancelled = failure.name === "AbortError";
      setStatus(cancelled ? "cancelled" : "error");
      setError(
        cancelled
          ? "Query cancelled. The last successful result is retained."
          : failure.message,
      );
      setHistory((current) =>
        [
          {
            id,
            query: sql,
            region: parameter,
            status: cancelled ? "cancelled" : "error",
            error: failure.message,
            at: Date.now(),
          },
          ...current,
        ].slice(0, 8),
      );
      return null;
    } finally {
      if (mounted.current && id === sequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    execute(initial.query, initial.region);
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        PREF_KEY,
        JSON.stringify({ query, note, region, chartType }),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [query, note, region, chartType]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!busy) execute(query, region);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setHelperOpen(true);
        setPanel("Helper");
        requestAnimationFrame(() => helperRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query, region, busy]);
  const navigate = (next) => {
    setMode(next);
    setMobileNav(false);
  };
  const scrollToCell = (id) => {
    navigate("Notebook");
    requestAnimationFrame(() =>
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const ask = (text) => {
    if (!text.trim()) return;
    setAsked(text.trim());
    setQuestion("");
    const proposed = suggestQuery(text);
    setSuggestion(proposed);
    setReply(
      proposed
        ? "I prepared a local SQL template. Review it below, then run it to see an answer from the sample data."
        : "This helper supports monthly revenue, revenue by region, category performance, and recent orders. It uses local templates; no AI model is connected.",
    );
  };
  const runSuggestion = () => {
    if (!suggestion || busy) return;
    setQuery(suggestion.sql);
    setMode("Notebook");
    execute(suggestion.sql, region, suggestion.title);
  };
  const exportNotebook = () => {
    downloadFile(
      "hex-revenue-notebook.json",
      JSON.stringify(
        {
          format: "hex-study-v1",
          query,
          note,
          region,
          chartType,
          xAxis,
          yAxis,
        },
        null,
        2,
      ),
      "application/json",
    );
    setToast("Notebook configuration exported");
  };
  const sourceRows = useMemo(
    () =>
      orders.filter((row) => region === "All regions" || row.region === region),
    [region],
  );
  const sourceResult = useMemo(
    () => ({
      columns: schema.map(([name]) => name),
      rows: sourceRows.map((row) => schema.map(([name]) => row[name])),
      runId: "source-" + region,
    }),
    [sourceRows, region],
  );
  const columns = result?.columns || [],
    revenueIndex = columns.indexOf("revenue"),
    profitIndex = columns.indexOf("gross_profit"),
    numericIndex = columns.indexOf(yAxis);
  const sumAt = (index) =>
    index < 0
      ? 0
      : (result?.rows || []).reduce(
          (sum, row) => sum + (typeof row[index] === "number" ? row[index] : 0),
          0,
        );
  const resultTitle =
    suggestion && result && suggestion.sql === result.query
      ? suggestion.title
      : result?.columns.includes("month")
        ? "Revenue by month"
        : result?.columns.includes("region")
          ? "Revenue by region"
          : "Query result visualization";
  const datasetTotals = orders.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.revenue_cents,
      units: sum.units + row.quantity,
    }),
    { revenue: 0, units: 0 },
  );
  const statusLabel = busy
    ? "Running"
    : status === "error"
      ? "Query error"
      : status === "cancelled"
        ? "Cancelled"
        : dirty
          ? "Needs run"
          : result
            ? "Up to date"
            : "Ready";
  const helperPanel = (
    <aside className={`helper-panel ${helperOpen ? "mobile-open" : ""}`}>
      <div className="helper-top">
        <span className="helper-symbol">
          <Sparkles size={16} />
        </span>
        <strong>Think with your data.</strong>
        <button
          className="icon-button mobile-only"
          aria-label="Close helper"
          onClick={() => setHelperOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="helper-tabs">
        <button
          className={panel === "Helper" ? "selected" : ""}
          onClick={() => setPanel("Helper")}
        >
          <MessageSquare size={12} />
          Helper
        </button>
        <button
          className={panel === "Runs" ? "selected" : ""}
          onClick={() => setPanel("Runs")}
        >
          <History size={12} />
          Runs<span>{history.length}</span>
        </button>
      </div>
      {panel === "Helper" ? (
        <div className="helper-body">
          <div className="helper-disclosure">
            <span className="template-dot" />
            <strong>Local query helper</strong>
            <span>Template-based · no LLM connected</span>
          </div>
          <div className="helper-welcome">
            <span className="helper-orb">
              <Sparkles size={23} />
            </span>
            <h3>
              A good question
              <br />
              is a good start.
            </h3>
            <p>
              Turn a supported question into real SQL, then follow the answer
              back to its data.
            </p>
          </div>
          <div className="suggestion-list">
            {[
              "How is revenue trending monthly?",
              "Which region has the most revenue?",
              "Show category performance",
              "Show recent orders",
            ].map((text) => (
              <button key={text} onClick={() => ask(text)}>
                {text}
                <ArrowUpRight size={11} />
              </button>
            ))}
          </div>
          {asked && (
            <div className="conversation">
              <div className="question-bubble">
                <span className="mini-avatar">K</span>
                <p>{asked}</p>
              </div>
              <div className="helper-reply">
                <Sparkles size={13} />
                <p data-testid="helper-reply">{reply}</p>
              </div>
              {suggestion && (
                <div className="query-suggestion">
                  <div>
                    <Code2 size={12} />
                    <strong>{suggestion.title}</strong>
                  </div>
                  <pre>{suggestion.sql}</pre>
                  <button
                    className="primary-button"
                    aria-label="Run suggested query"
                    disabled={busy}
                    onClick={runSuggestion}
                  >
                    <Play size={11} />
                    {busy ? "Running..." : "Run suggested query"}
                  </button>
                </div>
              )}
            </div>
          )}
          <form
            className="helper-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <textarea
              ref={helperRef}
              aria-label="Ask local data helper"
              placeholder="Ask about regions, months, categories..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div>
              <span>Local templates only</span>
              <button
                aria-label="Submit helper question"
                disabled={!question.trim()}
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
          <div className="helper-footnote">
            No messages leave this browser. Unsupported questions do not produce
            invented answers.
          </div>
        </div>
      ) : (
        <div className="run-history">
          <div className="history-label">LAST 8 RUNS · THIS SESSION</div>
          {history.length ? (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setQuery(item.query);
                  setRegion(item.region);
                  setMode("Notebook");
                  setToast("Query restored. Run it to update the result.");
                }}
              >
                <span className={`run-history-status ${item.status}`}>
                  {item.status === "success" ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Terminal size={13} />
                  )}
                </span>
                <span>
                  <strong>
                    {item.status === "success"
                      ? `${item.count} rows`
                      : "Query " + item.status}
                  </strong>
                  <small>
                    {item.region} · {timeLabel(item.at)}
                  </small>
                  <code>{item.query.replaceAll("\n", " ").slice(0, 95)}</code>
                </span>
                <RotateCcw size={11} />
              </button>
            ))
          ) : (
            <div className="history-empty">Run a query to start a history.</div>
          )}
        </div>
      )}
    </aside>
  );
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="top-left">
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={18} />
          </button>
          <button
            className="brand"
            aria-label="Open notebook"
            onClick={() => navigate("Notebook")}
          >
            <span className="hex-symbol" />
            hex<span className="brand-period">.</span>
          </button>
          <span className="top-divider" />
          <span className="workspace-name">Khanomi workspace</span>
          <ChevronRight size={11} />
          <strong>Revenue intelligence</strong>
          <span className="study-label">STUDY</span>
        </div>
        <div className="top-actions">
          <span className={`save-state ${storageError ? "unsaved" : ""}`}>
            <Check size={11} />
            {storageError ? "Not saved" : "Saved locally"}
          </span>
          <button
            className="secondary-button export-notebook"
            onClick={exportNotebook}
          >
            <Download size={12} />
            Export
          </button>
          <button
            className="run-button"
            aria-label="Run analysis"
            disabled={busy}
            onClick={() => execute(query, region)}
          >
            <Play size={12} />
            {busy ? "Running..." : "Run analysis"}
          </button>
          <span className="profile-avatar">K</span>
        </div>
      </header>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-title">
          <span className="project-icon">
            <BookOpen size={17} />
          </span>
          <div>
            <strong>Revenue intelligence</strong>
            <span>Growth analytics · Local study</span>
          </div>
          <button
            className="icon-button mobile-only"
            aria-label="Close sidebar"
            onClick={() => setMobileNav(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="sidebar-heading">WORKSPACE</div>
        {[
          ["Notebook", BookOpen],
          ["App preview", BarChart3],
          ["Data", Database],
        ].map(([name, Icon]) => (
          <button
            className={`nav-item ${mode === name ? "selected" : ""}`}
            key={name}
            onClick={() => navigate(name)}
          >
            <Icon size={15} />
            <span>{name}</span>
            {name === "Data" && <span className="nav-count">1</span>}
          </button>
        ))}
        <div className="sidebar-heading">
          PROJECT CELLS<span>3</span>
        </div>
        {[
          ["note-cell", "01", "Introduction", Text],
          ["sql-cell", "02", "Revenue query", Code2],
          ["chart-cell", "03", "Visualization", BarChart3],
        ].map(([id, number, title, Icon]) => (
          <button
            className="cell-nav"
            key={id}
            onClick={() => scrollToCell(id)}
          >
            <span>{number}</span>
            <Icon size={13} />
            <span>{title}</span>
          </button>
        ))}
        <div className="sidebar-heading">DATA SOURCES</div>
        <button className="source-item" onClick={() => navigate("Data")}>
          <span className="source-icon">
            <Database size={14} />
          </span>
          <span>
            <strong>orders</strong>
            <small>240 rows · 8 columns</small>
          </span>
          <span className="source-dot" />
        </button>
        <div className="sidebar-note">
          <span>
            <Waypoints size={15} />
            Every insight has a source.
          </span>
          <p>
            Real local SQL. Visible transformations. A clear path from question
            to chart.
          </p>
        </div>
        <div className="sidebar-bottom">
          <div className="runtime-label">
            <span className="source-dot" />
            SQLite / WASM<span>LOCAL</span>
          </div>
          <div className="profile">
            <span className="profile-avatar">K</span>
            <div>
              <strong>kasrapmb</strong>
              <span>Independent workspace</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <div className="workspace-tabs">
          <div>
            {[
              ["Notebook", BookOpen],
              ["App preview", BarChart3],
              ["Data", Database],
            ].map(([name, Icon]) => (
              <button
                className={mode === name ? "selected" : ""}
                key={name}
                onClick={() => navigate(name)}
              >
                <Icon size={13} />
                {name}
              </button>
            ))}
          </div>
          <span className="workspace-mode-label">
            {mode === "Data"
              ? "Read-only sample source"
              : mode === "App preview"
                ? "A presentation of your last successful result"
                : "A little structure. A lot of possibility."}
          </span>
          <button
            className="icon-button helper-launch"
            aria-label="Open local helper"
            onClick={() => {
              setHelperOpen((value) => !value);
              setPanel("Helper");
            }}
          >
            <Sparkles size={16} />
          </button>
        </div>
        <div className="workbench">
          <div className="notebook-area">
            <section className="project-heading">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                GROWTH ANALYTICS
              </div>
              <h1>
                {mode === "Data"
                  ? "A closer look at the source."
                  : mode === "App preview"
                    ? "Revenue insights."
                    : "Good questions. Clear answers."}
              </h1>
              <p>
                {mode === "Data"
                  ? "A small, transparent dataset to explore. No warehouse connection required."
                  : mode === "App preview"
                    ? "Your latest successful analysis, ready to read."
                    : "Explore the story behind your revenue, one thoughtful cell at a time."}
              </p>
              <div className="project-meta">
                <span className="mini-avatar">K</span>
                <span>
                  Created by <strong>kasrapmb</strong>
                </span>
                <span>·</span>
                <span>
                  <Database size={11} />
                  Sample commerce data
                </span>
                <span className="project-data-label">240 ORDERS</span>
              </div>
            </section>
            <section className="parameters" aria-label="Notebook parameters">
              <span>
                <Settings2 size={13} />
                Parameters
              </span>
              <label>
                Region
                <select
                  aria-label="Region parameter"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                >
                  {["All regions", ...regions].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <span className="parameter-note">
                {mode === "Data"
                  ? "Filters the source preview"
                  : dirty
                    ? "Changed · run to apply"
                    : "Bound as :region when you run"}
              </span>
            </section>
            {storageError && (
              <div className="storage-warning" role="alert">
                Notebook changes are not saved: browser storage is unavailable.
              </div>
            )}
            {mode === "Data" ? (
              <section className="data-source-card">
                <div className="source-card-heading">
                  <span className="source-icon">
                    <Database size={19} />
                  </span>
                  <div>
                    <h2>orders</h2>
                    <p>Deterministic fictional records · May–October 2026</p>
                  </div>
                  <span>{sourceRows.length} rows</span>
                </div>
                <div className="source-schema">
                  {schema.map(([name, type]) => (
                    <span key={name}>
                      <strong>{name}</strong>
                      <code>{type}</code>
                    </span>
                  ))}
                </div>
                <ResultTable
                  result={sourceResult}
                  label="Source orders"
                  source
                />
                <div className="source-definition">
                  <strong>Source notes</strong>
                  <p>
                    Amounts are integer cents. Revenue is after a sample
                    discount; gross profit is revenue minus recorded product
                    cost. This dataset is fictional and has no external
                    connection.
                  </p>
                </div>
              </section>
            ) : (
              <>
                {mode === "Notebook" && (
                  <section className="text-cell" id="note-cell">
                    <div className="cell-gutter">01</div>
                    <div className="text-cell-head">
                      <span>
                        <Text size={12} />
                        TEXT
                      </span>
                      <button onClick={() => setEditingNote((value) => !value)}>
                        {editingNote ? "Done" : "Edit note"}
                      </button>
                    </div>
                    <h2>Behind the revenue.</h2>
                    {editingNote ? (
                      <textarea
                        className="note-editor"
                        aria-label="Notebook introduction"
                        maxLength={4000}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                      />
                    ) : (
                      <p>
                        {note || "Add a note to give your analysis context."}
                      </p>
                    )}
                  </section>
                )}
                <div className="analysis-metrics">
                  <div>
                    <span>Result rows</span>
                    <strong data-testid="result-row-count">
                      {result ? result.rows.length : "—"}
                    </strong>
                    <small>
                      {result?.truncated
                        ? "Capped at 500"
                        : "From the last successful query"}
                    </small>
                  </div>
                  <div>
                    <span>
                      {revenueIndex >= 0
                        ? "Total revenue"
                        : numericIndex >= 0
                          ? `Sum of ${yAxis}`
                          : "Result columns"}
                    </span>
                    <strong data-testid="result-sum">
                      {!result
                        ? "—"
                        : revenueIndex >= 0
                          ? money(sumAt(revenueIndex))
                          : numericIndex >= 0
                            ? formatValue(sumAt(numericIndex), yAxis)
                            : columns.length}
                    </strong>
                    <small>
                      {result
                        ? "Computed from returned rows"
                        : "Run an analysis to begin"}
                    </small>
                  </div>
                  <div>
                    <span>
                      {profitIndex >= 0 ? "Gross profit" : "Query runtime"}
                    </span>
                    <strong data-testid="result-profit">
                      {!result
                        ? "—"
                        : profitIndex >= 0
                          ? money(sumAt(profitIndex))
                          : (result.duration / 1000).toFixed(2) + "s"}
                    </strong>
                    <small>
                      {result
                        ? profitIndex >= 0
                          ? "Revenue minus product costs"
                          : "Includes local worker initialization"
                        : "Local SQLite engine"}
                    </small>
                  </div>
                </div>
                {mode === "Notebook" && (
                  <section className="query-cell" id="sql-cell">
                    <div className="cell-gutter">02</div>
                    <div className="cell-heading">
                      <div>
                        <span className="cell-type">
                          <Code2 size={13} />
                          SQL
                        </span>
                        <strong>Revenue query</strong>
                        <span className="cell-source">
                          <Database size={10} />
                          orders
                        </span>
                      </div>
                      <div>
                        <span
                          className={`cell-status ${status}`}
                          data-testid="query-status"
                          data-status={status}
                        >
                          {busy ? (
                            <span className="spinner" />
                          ) : status === "success" && !dirty ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <span className="status-dot" />
                          )}
                          {statusLabel}
                        </span>
                        {busy ? (
                          <button
                            className="cell-run cancel"
                            aria-label="Cancel query"
                            onClick={() => controller.current?.abort()}
                          >
                            <Square size={10} />
                            Cancel
                          </button>
                        ) : (
                          <button
                            className="cell-run"
                            aria-label="Run SQL cell"
                            onClick={() => execute(query, region)}
                          >
                            <Play size={10} />
                            Run
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="query-editor-wrap">
                      <div className="line-numbers" aria-hidden="true">
                        {query.split("\n").map((_, index) => (
                          <span key={index}>{index + 1}</span>
                        ))}
                      </div>
                      <textarea
                        ref={editorRef}
                        spellCheck={false}
                        aria-label="SQL query"
                        value={query}
                        maxLength={10000}
                        onChange={(event) => setQuery(event.target.value)}
                        rows={Math.max(
                          8,
                          Math.min(15, query.split("\n").length),
                        )}
                      />
                    </div>
                    <div className="query-editor-footer">
                      <span>
                        <Terminal size={11} />
                        Read-only SELECT · SQLite
                      </span>
                      <span>
                        <kbd>⌘</kbd>
                        <kbd>↵</kbd> to run
                      </span>
                    </div>
                    {error && (
                      <div
                        className={`query-error ${status === "cancelled" ? "cancelled" : ""}`}
                        role={status === "error" ? "alert" : "status"}
                      >
                        <Terminal size={13} />
                        <span>
                          {error}
                          {result &&
                            status !== "cancelled" &&
                            " Showing the last successful result below."}
                        </span>
                      </div>
                    )}
                    {result && (
                      <div
                        className={`result-provenance ${dirty ? "stale" : ""}`}
                      >
                        <span>
                          {dirty
                            ? "Draft or parameters changed — showing the last successful result."
                            : "Result from executed SQL"}
                          <Check size={10} />
                        </span>
                        <span>
                          {result.region} · {timeLabel(result.at)} ·{" "}
                          {(result.duration / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}
                    <ResultTable result={result} label="Query result" />
                  </section>
                )}
                {mode === "App preview" && error && (
                  <div className="preview-notice">
                    Latest run: {status}. This preview retains the last
                    successful result.
                  </div>
                )}
                {mode === "App preview" && dirty && (
                  <div className="preview-notice">
                    Draft or parameters changed. Run analysis to update this
                    preview.
                  </div>
                )}
                <section className="chart-cell" id="chart-cell">
                  <div className="cell-gutter">03</div>
                  <div className="cell-heading">
                    <div>
                      <span className="cell-type chart">
                        <BarChart3 size={13} />
                        CHART
                      </span>
                      <strong>{resultTitle}</strong>
                    </div>
                    <span className="dependency-label">
                      <Waypoints size={11} />
                      From revenue query
                    </span>
                  </div>
                  <ResultChart
                    result={result}
                    xAxis={xAxis}
                    yAxis={yAxis}
                    onX={setXAxis}
                    onY={setYAxis}
                    type={chartType}
                    onType={setChartType}
                  />
                </section>
                {mode === "App preview" && (
                  <section className="preview-table">
                    <div className="preview-table-title">
                      <Table2 size={14} />
                      <h2>The data behind the view</h2>
                    </div>
                    <ResultTable result={result} label="Query result" />
                  </section>
                )}
              </>
            )}
            <footer className="notebook-footer">
              <span>
                <span className="hex-symbol" />
                Independent Hex-inspired study
              </span>
              <span>Local data. Visible logic.</span>
            </footer>
          </div>
          {helperPanel}
        </div>
      </main>
      {helperOpen && (
        <button
          className="helper-scrim"
          aria-label="Dismiss helper panel"
          onClick={() => setHelperOpen(false)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}
    </div>
  );
}
