import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  FolderOpen,
  Grid2X2,
  Layers,
  Menu,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import {
  categories,
  colors,
  columns,
  csvContent,
  dateLabel,
  defaultFilters,
  filterRows,
  groupRows,
  money,
  number,
  orders,
  percent,
  readSavedView,
  regions,
  shortMoney,
  sortRows,
  statuses,
  summarize,
  VIEW_KEY,
} from "./data.js";

function Logo({ small = false }) {
  return (
    <span className={`sigma-logo ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
function Dialog({ children, label, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    el.querySelector("[data-autofocus]")?.focus();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
const initialView = () => readSavedView();
export default function App() {
  const [saved, setSaved] = useState(initialView);
  const [filters, setFilters] = useState(
    () => readSavedView()?.filters || { ...defaultFilters },
  );
  const [sort, setSort] = useState(
    () => readSavedView()?.sort || { key: "date", direction: "desc" },
  );
  const [visibleKeys, setVisibleKeys] = useState(
    () => readSavedView()?.columns || columns.map((column) => column.key),
  );
  const [pageView, setPageView] = useState("Overview");
  const [group, setGroup] = useState("none");
  const [groupExpanded, setGroupExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selection, setSelection] = useState([]);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [viewName, setViewName] = useState("My revenue view");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [exploreGroup, setExploreGroup] = useState("region");
  const [exploreMetric, setExploreMetric] = useState("revenue");
  const [noteOpen, setNoteOpen] = useState(false);
  const searchRef = useRef(null);
  const filtered = useMemo(() => filterRows(orders, filters), [filters]);
  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort]);
  const totals = useMemo(() => summarize(filtered), [filtered]);
  const fields = columns.filter((column) => visibleKeys.includes(column.key));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedRows = sorted.filter((row) => selection.includes(row.id));
  const selectedTotal = summarize(selectedRows);
  const groups = useMemo(
    () => (group === "none" ? [] : groupRows(sorted, group)),
    [sorted, group],
  );
  const activeFilters = Object.keys(defaultFilters).filter(
    (key) => filters[key] !== defaultFilters[key],
  );
  const isSaved =
    saved &&
    JSON.stringify({ filters, sort, columns: visibleKeys }) ===
      JSON.stringify({
        filters: saved.filters,
        sort: saved.sort,
        columns: saved.columns,
      });
  useEffect(() => {
    setPage(1);
    setSelection([]);
    setGroupExpanded({});
  }, [filters, group]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !detail &&
        !saving &&
        !noteOpen
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detail, saving, noteOpen]);
  const filter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const navigate = (view) => {
    setPageView(view);
    setMobileNav(false);
  };
  const changeSort = (key) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };
  const exportCsv = () => {
    const rows = selectedRows.length ? selectedRows : sorted;
    const url = URL.createObjectURL(
      new Blob([csvContent(rows, fields)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigma-${selectedRows.length ? "selected" : "filtered"}-orders.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`Exported ${rows.length} ${rows.length === 1 ? "row" : "rows"}`);
  };
  const saveView = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    const view = { name: viewName.trim(), filters, sort, columns: visibleKeys };
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(view));
      setSaved(view);
      setSaving(false);
      setToast("View saved in this browser");
    } catch {
      setSaveError("View could not be saved: browser storage is unavailable.");
    }
  };
  const clearFilters = () => setFilters({ ...defaultFilters });
  const pageSelected =
    pageRows.length > 0 && pageRows.every((row) => selection.includes(row.id));
  const togglePage = () =>
    setSelection((current) =>
      pageSelected
        ? current.filter((id) => !pageRows.some((row) => row.id === id))
        : [...new Set([...current, ...pageRows.map((row) => row.id)])],
    );
  const toggleRow = (id) =>
    setSelection((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  const display = (row, column) =>
    column.type === "money" ? (
      money(row[column.key])
    ) : column.type === "percent" ? (
      <span className="margin-cell">
        <i style={{ width: `${row.margin * 85}px` }} />
        {percent(row.margin)}
      </span>
    ) : column.type === "date" ? (
      dateLabel(row.date)
    ) : column.type === "status" ? (
      <span className={`status-pill ${row.status.toLowerCase()}`}>
        <i />
        {row.status}
      </span>
    ) : column.key === "id" ? (
      <button className="order-link" onClick={() => setDetail(row)}>
        {row.id}
        <ArrowUpRight size={11} />
      </button>
    ) : (
      row[column.key]
    );
  const rowElement = (row) => (
    <tr
      key={row.id}
      className={selection.includes(row.id) ? "row-selected" : ""}
    >
      <td className="check-cell">
        <input
          type="checkbox"
          aria-label={`Select ${row.id}`}
          checked={selection.includes(row.id)}
          onChange={() => toggleRow(row.id)}
        />
      </td>
      {fields.map((column) => (
        <td
          key={column.key}
          className={`${column.type === "money" || column.type === "percent" ? "numeric" : ""} col-${column.key}`}
        >
          {display(row, column)}
        </td>
      ))}
      {!visibleKeys.includes("id") && (
        <td>
          <button
            className="icon-button"
            aria-label={`Open ${row.id} details`}
            onClick={() => setDetail(row)}
          >
            <ArrowUpRight size={13} />
          </button>
        </td>
      )}
    </tr>
  );
  return (
    <div className="workbook-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <Logo />
          <span>
            sigma<span className="brand-period">.</span>
          </span>
          <span className="study-tag">STUDY</span>
          <button
            className="icon-button mobile-only"
            aria-label="Close sidebar"
            onClick={() => setMobileNav(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace-picker">
          <span className="workspace-avatar">K</span>
          <div>
            <strong>Khanomi workspace</strong>
            <span>Analytics team</span>
          </div>
          <ChevronDown size={13} />
        </div>
        <button
          className="sidebar-search"
          onClick={() => {
            setMobileNav(false);
            searchRef.current?.focus();
          }}
        >
          <Search size={14} />
          Search workbook<kbd>⌘ K</kbd>
        </button>
        <div className="sidebar-heading">WORKSPACE</div>
        <button className="nav-item" onClick={() => navigate("Overview")}>
          <Grid2X2 size={16} />
          Home
        </button>
        <button
          className="nav-item active"
          onClick={() => navigate("Overview")}
        >
          <FolderOpen size={16} />
          Workbooks<span>1</span>
        </button>
        <button className="nav-item" onClick={() => setNoteOpen(true)}>
          <Database size={16} />
          Data sources
          <span className="source-dot" />
        </button>
        <div className="sidebar-heading workbook-heading">
          THIS WORKBOOK<span>3 pages</span>
        </div>
        {[
          ["Overview", BarChart3],
          ["Orders", Table2],
          ["Explore", Layers],
        ].map(([name, Icon], i) => (
          <button
            key={name}
            className={`workbook-page ${pageView === name ? "selected" : ""}`}
            onClick={() => navigate(name)}
          >
            <span className="page-number">0{i + 1}</span>
            <Icon size={15} />
            <span>
              {name === "Overview"
                ? "Sales overview"
                : name === "Orders"
                  ? "Order explorer"
                  : "Explore data"}
            </span>
            {pageView === name && <span className="page-active-dot" />}
          </button>
        ))}
        <div className="sidebar-heading">SAVED VIEW</div>
        {saved ? (
          <button
            className="saved-view"
            onClick={() => {
              setFilters({ ...saved.filters });
              setSort({ ...saved.sort });
              setVisibleKeys([...saved.columns]);
              setGroup("none");
              navigate("Orders");
            }}
          >
            <FileSpreadsheet size={15} />
            <span>{saved.name}</span>
          </button>
        ) : (
          <div className="no-saved-view">
            Save your filters and columns
            <br />
            to pick up where you left off.
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="data-status">
            <span className="source-dot" />
            <span>Sample dataset ready</span>
            <span>240 rows</span>
          </div>
          <div className="user-profile">
            <span className="user-avatar">K</span>
            <div>
              <strong>kasrapmb</strong>
              <span>Local workspace</span>
            </div>
            <span className="profile-badge">K</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={18} />
            </button>
            <FolderOpen size={14} />
            <span>Workbooks</span>
            <ChevronRight size={12} />
            <strong>Revenue operations</strong>
            <span className="workbook-version">v1</span>
          </div>
          <div className="top-actions">
            <span className="local-badge">
              <span className="source-dot" />
              Local study
            </span>
            <button
              className="secondary-button save-top"
              onClick={() => {
                setSaveError("");
                setSaving(true);
              }}
            >
              <Save size={13} />
              Save view
            </button>
            <span className="user-avatar tiny">K</span>
          </div>
        </header>
        <div className="workbook-top">
          <div className="workbook-eyebrow">
            <span>WORKBOOK</span>
            <span className="eyebrow-divider" />
            SALES & FINANCE
          </div>
          <div className="title-row">
            <div className="workbook-title-icon">
              <FileSpreadsheet size={23} />
            </div>
            <div>
              <h1>
                Revenue operations<span className="title-dot">.</span>
              </h1>
              <p>
                A clearer view of every order, every region, and every
                opportunity.
              </p>
            </div>
            <button
              className="icon-button info-button"
              aria-label="About this workbook"
              onClick={() => setNoteOpen(true)}
            >
              <BookOpen size={17} />
            </button>
          </div>
          <div className="workbook-meta">
            <span className="user-avatar micro">K</span>
            <span>
              Created by <strong>kasrapmb</strong>
            </span>
            <span className="meta-dot">·</span>
            <Database size={12} />
            <span>Demo commerce dataset</span>
            <span className="meta-dot">·</span>
            <span className="dataset-tag">SYNTHETIC DATA</span>
          </div>
        </div>
        <div className="page-tabs">
          {["Overview", "Orders", "Explore"].map((view) => (
            <button
              className={pageView === view ? "selected" : ""}
              key={view}
              onClick={() => navigate(view)}
            >
              {view === "Overview" ? (
                <BarChart3 size={14} />
              ) : view === "Orders" ? (
                <Table2 size={14} />
              ) : (
                <Layers size={14} />
              )}
              {view === "Overview"
                ? "Sales overview"
                : view === "Orders"
                  ? "Order explorer"
                  : "Explore data"}
            </button>
          ))}
          <span className="view-save-state">
            {isSaved ? (
              <>
                <Check size={12} />
                Saved view
              </>
            ) : (
              "Workbook preview"
            )}
          </span>
        </div>
        <div className="content-area">
          <section className="filter-bar" aria-label="Workbook filters">
            <span className="filter-label">
              <SlidersHorizontal size={14} />
              Controls
            </span>
            <label>
              <span>Region</span>
              <select
                aria-label="Filter region"
                value={filters.region}
                onChange={(event) => filter("region", event.target.value)}
              >
                {["All regions", ...regions].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Category</span>
              <select
                aria-label="Filter category"
                value={filters.category}
                onChange={(event) => filter("category", event.target.value)}
              >
                {["All categories", ...categories].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                aria-label="Filter status"
                value={filters.status}
                onChange={(event) => filter("status", event.target.value)}
              >
                {["All statuses", ...statuses].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="period-filter">
              <span>Date range</span>
              <select
                aria-label="Filter date range"
                value={filters.period}
                onChange={(event) => filter("period", event.target.value)}
              >
                {["All dates", "Last 30 days", "Last 90 days"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            {activeFilters.length > 0 && (
              <button className="clear-button" onClick={clearFilters}>
                <X size={12} />
                Reset
              </button>
            )}
          </section>
          <section className="metrics" aria-label="Filtered dataset totals">
            {[
              [
                "Revenue",
                money(totals.revenue),
                "revenue",
                "All order amounts, after discounts",
              ],
              [
                "Gross profit",
                money(totals.profit),
                "profit",
                `${percent(totals.margin)} weighted margin`,
              ],
              [
                "Total orders",
                number(totals.count),
                "orders",
                `${number(totals.quantity)} units across all orders`,
              ],
              [
                "Average order value",
                money(totals.average),
                "average",
                "Revenue ÷ number of orders",
              ],
            ].map(([name, value, key, description], i) => (
              <article className="metric-card" key={key}>
                <div>
                  <span>{name}</span>
                  <span className={`metric-marker marker-${i}`} />
                </div>
                <strong data-testid={`metric-${key}`}>{value}</strong>
                <span className="metric-caption">{description}</span>
              </article>
            ))}
          </section>
          {pageView === "Overview" && (
            <div className="chart-grid">
              <RevenueChart rows={filtered} />
              <RegionChart
                rows={filtered}
                selected={filters.region}
                onSelect={(value) =>
                  filter(
                    "region",
                    filters.region === value ? "All regions" : value,
                  )
                }
              />
            </div>
          )}
          {pageView === "Explore" && (
            <Explore
              rows={filtered}
              group={exploreGroup}
              metric={exploreMetric}
              setGroup={setExploreGroup}
              setMetric={setExploreMetric}
              onDrill={(name) => {
                if (
                  exploreGroup === "region" ||
                  exploreGroup === "category" ||
                  exploreGroup === "status"
                )
                  filter(exploreGroup, name);
                else filter("search", name);
                setPageView("Orders");
              }}
            />
          )}
          <section className="table-card">
            <div className="table-title">
              <span className="table-icon">
                <Table2 size={17} />
              </span>
              <div>
                <h2>
                  {pageView === "Explore"
                    ? "Source orders"
                    : "Order-level detail"}
                </h2>
                <p>From the big picture to the individual transaction.</p>
              </div>
              <span className="row-count">{number(filtered.length)} rows</span>
              <button
                className="secondary-button export-button"
                onClick={exportCsv}
                disabled={!sorted.length}
              >
                <Download size={13} />
                Export CSV
              </button>
            </div>
            <div className="table-toolbar">
              <div className="table-search">
                <Search size={14} />
                <input
                  ref={searchRef}
                  aria-label="Search orders"
                  placeholder="Search orders, customers, products..."
                  value={filters.search}
                  onChange={(event) => filter("search", event.target.value)}
                />
              </div>
              <div className="table-tools">
                <label className="group-control">
                  <Layers size={13} />
                  <span>Group by</span>
                  <select
                    aria-label="Group rows by"
                    value={group}
                    onChange={(event) => setGroup(event.target.value)}
                  >
                    {[
                      ["none", "None"],
                      ["region", "Region"],
                      ["category", "Category"],
                      ["status", "Status"],
                      ["customer", "Customer"],
                    ].map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <details className="columns-menu">
                  <summary>
                    <Columns3 size={13} />
                    Columns<span>{fields.length}</span>
                  </summary>
                  <div className="columns-popover">
                    <strong>Visible columns</strong>
                    {columns.map((column) => (
                      <label key={column.key}>
                        <input
                          type="checkbox"
                          checked={visibleKeys.includes(column.key)}
                          disabled={
                            visibleKeys.length === 1 &&
                            visibleKeys.includes(column.key)
                          }
                          onChange={() =>
                            setVisibleKeys((current) =>
                              current.includes(column.key)
                                ? current.filter((key) => key !== column.key)
                                : [...current, column.key],
                            )
                          }
                        />
                        {column.label}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            </div>
            {selectedRows.length > 0 && (
              <div className="selection-strip" role="status">
                <CheckCircle2 size={14} />
                <strong>{selectedRows.length} selected</strong>
                <span>Revenue {money(selectedTotal.revenue)}</span>
                <button onClick={exportCsv}>
                  Export selected
                  <Download size={12} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Clear selection"
                  onClick={() => setSelection([])}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="table-scroll">
              <table aria-label="Orders table">
                <thead>
                  <tr>
                    <th className="check-cell">
                      <input
                        type="checkbox"
                        aria-label="Select current page"
                        checked={pageSelected}
                        onChange={togglePage}
                        disabled={!pageRows.length || group !== "none"}
                      />
                    </th>
                    {fields.map((column) => (
                      <th
                        key={column.key}
                        className={
                          column.type === "money" || column.type === "percent"
                            ? "numeric"
                            : ""
                        }
                        aria-sort={
                          sort.key === column.key
                            ? sort.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button onClick={() => changeSort(column.key)}>
                          <span>
                            {column.type === "money"
                              ? "#"
                              : column.type === "date"
                                ? "◷"
                                : column.type === "percent"
                                  ? "%"
                                  : "Aa"}
                          </span>
                          {column.label}
                          {sort.key === column.key ? (
                            sort.direction === "asc" ? (
                              <ArrowUp size={11} />
                            ) : (
                              <ArrowDown size={11} />
                            )
                          ) : (
                            <ArrowDownUp size={10} className="sort-hint" />
                          )}
                        </button>
                      </th>
                    ))}
                    {!visibleKeys.includes("id") && <th>Details</th>}
                  </tr>
                </thead>
                <tbody>
                  {!sorted.length ? (
                    <tr>
                      <td
                        colSpan={
                          fields.length + (visibleKeys.includes("id") ? 1 : 2)
                        }
                      >
                        <div className="table-empty">
                          <Filter size={24} />
                          <strong>No matching orders</strong>
                          <span>Try a different filter or search term.</span>
                          <button
                            className="secondary-button"
                            onClick={clearFilters}
                          >
                            Reset filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : group === "none" ? (
                    pageRows.map(rowElement)
                  ) : (
                    groups.map((item) => (
                      <React.Fragment key={item.name}>
                        <tr className="group-row">
                          <td
                            colSpan={
                              fields.length +
                              (visibleKeys.includes("id") ? 1 : 2)
                            }
                          >
                            <button
                              aria-expanded={Boolean(groupExpanded[item.name])}
                              onClick={() =>
                                setGroupExpanded((current) => ({
                                  ...current,
                                  [item.name]: !current[item.name],
                                }))
                              }
                            >
                              <ChevronRight
                                size={13}
                                className={
                                  groupExpanded[item.name] ? "expanded" : ""
                                }
                              />
                              <strong>{item.name}</strong>
                              <span>{item.count} orders</span>
                              <span className="group-revenue">
                                Revenue <b>{money(item.revenue)}</b>
                              </span>
                              <span className="group-profit">
                                Gross profit {money(item.profit)}
                              </span>
                            </button>
                          </td>
                        </tr>
                        {groupExpanded[item.name] && item.rows.map(rowElement)}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
                {sorted.length > 0 && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={
                          fields.length + (visibleKeys.includes("id") ? 1 : 2)
                        }
                      >
                        <div className="table-totals">
                          <span>
                            Σ &nbsp; Filtered totals · {number(totals.count)}{" "}
                            orders
                          </span>
                          <strong>
                            {money(totals.revenue)} <small>revenue</small>
                          </strong>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="table-pagination">
              <div>
                <span className="source-dot" />
                {group === "none"
                  ? `${sorted.length ? (currentPage - 1) * pageSize + 1 : 0}–${Math.min(currentPage * pageSize, sorted.length)} of ${number(sorted.length)} rows`
                  : `${groups.length} groups · ${number(sorted.length)} rows`}
                <span className="pagination-divider" />
                Calculated from sample data
              </div>
              {group === "none" && (
                <div className="pagination-controls">
                  <label>
                    Rows
                    <select
                      aria-label="Rows per page"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      {[15, 25, 50].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="icon-button"
                    aria-label="Previous page"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Next page"
                    disabled={currentPage === pageCount}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>
          <div className="workbook-footer">
            <span>
              <Logo small />
              An independent Sigma-inspired analytics study
            </span>
            <span>
              <Database size={11} />
              240 synthetic orders · USD · Browser only
            </span>
          </div>
        </div>
        <footer className="bottom-bar">
          <div>
            <span className="source-dot" />
            Sample data
            <span className="bottom-separator" />
            No external connection
          </div>
          <div>
            {activeFilters.length
              ? `${activeFilters.length} active controls`
              : "All data visible"}
            <span className="bottom-separator" />
            {fields.length} columns
          </div>
        </footer>
      </main>
      {detail && (
        <OrderDetail
          row={detail}
          onClose={() => setDetail(null)}
          onCustomer={() => {
            setFilters({ ...defaultFilters, search: detail.customer });
            setDetail(null);
            setPageView("Orders");
          }}
        />
      )}
      {saving && (
        <Dialog
          label="Save workbook view"
          onClose={() => setSaving(false)}
          className="save-dialog"
        >
          <form onSubmit={saveView}>
            <div className="dialog-heading">
              <span className="dialog-icon">
                <Save size={20} />
              </span>
              <button
                className="icon-button"
                type="button"
                aria-label="Close save view"
                onClick={() => setSaving(false)}
              >
                <X size={18} />
              </button>
            </div>
            <h2>Make this view yours.</h2>
            <p>
              Keep your current filters, sort order and visible columns in this
              browser.
            </p>
            <label>
              View name
              <input
                data-autofocus
                aria-label="View name"
                maxLength={80}
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
                required
              />
            </label>
            <div className="save-preview">
              <Filter size={14} />
              {activeFilters.length} filters
              <Columns3 size={14} />
              {fields.length} columns
            </div>
            {saveError && (
              <p className="save-error" role="alert">
                {saveError}
              </p>
            )}
            <button
              className="primary-button"
              type="submit"
              disabled={!viewName.trim()}
            >
              <Check size={14} />
              Save view
            </button>
          </form>
        </Dialog>
      )}
      {noteOpen && (
        <Dialog
          label="About the dataset"
          onClose={() => setNoteOpen(false)}
          className="about-dialog"
        >
          <div className="dialog-heading">
            <Database size={21} />
            <button
              className="icon-button"
              aria-label="Close dataset information"
              onClick={() => setNoteOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <h2>Good questions start with clear data.</h2>
          <p>
            This independent study uses 240 deterministic, fictional orders
            generated in the browser. It is not connected to Sigma or a
            warehouse.
          </p>
          <dl>
            <div>
              <dt>Source</dt>
              <dd>src/data.js</dd>
            </div>
            <div>
              <dt>Date window</dt>
              <dd>May–November 2026</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>USD</dd>
            </div>
            <div>
              <dt>Calculation</dt>
              <dd>Gross profit = revenue − cost</dd>
            </div>
            <div>
              <dt>Statuses</dt>
              <dd>All statuses are included unless filtered</dd>
            </div>
            <div>
              <dt>Relative dates</dt>
              <dd>Anchored to the newest sample order</dd>
            </div>
          </dl>
          <p className="about-note">
            Revenue includes refunded rows as recorded order amounts. For
            completed-order revenue, select Status → Completed. This is a study
            metric, not an accounting ledger.
          </p>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function RevenueChart({ rows }) {
  const months = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    months.set(key, (months.get(key) || 0) + row.revenue);
  }
  const items = [...months].toSorted((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(1, ...items.map((item) => item[1]));
  const w = 680,
    h = 170,
    base = 135;
  const points = items.map((item, i) => [
    48 + (i / Math.max(1, items.length - 1)) * (w - 78),
    base - (item[1] / max) * 105,
  ]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <article className="chart-card revenue-chart">
      <div className="chart-heading">
        <div>
          <h2>Revenue over time</h2>
          <p>Monthly order revenue · filtered data</p>
        </div>
        <span className="chart-legend">
          <i />
          Revenue
        </span>
      </div>
      {items.length ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Monthly revenue chart"
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6275df" stopOpacity=".2" />
              <stop offset="100%" stopColor="#6275df" stopOpacity=".01" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((value) => (
            <g key={value}>
              <line
                x1="48"
                y1={base - value * 105}
                x2={w - 20}
                y2={base - value * 105}
                stroke="#e9ecf3"
                strokeDasharray="3 4"
              />
              <text
                x="0"
                y={base - value * 105 + 4}
                fontSize="9"
                fill="#959bad"
              >
                {shortMoney(max * value)}
              </text>
            </g>
          ))}
          <path
            d={`${path} L${points.at(-1)[0]},${base} L${points[0][0]},${base} Z`}
            fill="url(#revenue-fill)"
          />
          <path
            d={path}
            fill="none"
            stroke="#6574da"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {points.map(([x, y], i) => (
            <g key={items[i][0]}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#fff"
                stroke="#6574da"
                strokeWidth="2"
              >
                <title>
                  {items[i][0]}: {money(items[i][1])}
                </title>
              </circle>
              <text
                x={x}
                y="160"
                textAnchor="middle"
                fontSize="10"
                fill="#8a91a4"
              >
                {new Intl.DateTimeFormat("en", {
                  month: "short",
                  timeZone: "UTC",
                }).format(new Date(items[i][0] + "-01T12:00:00Z"))}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <div className="chart-empty">No data for the current controls</div>
      )}
    </article>
  );
}
function RegionChart({ rows, selected, onSelect }) {
  const groups = groupRows(rows, "region");
  const max = Math.max(1, ...groups.map((item) => item.revenue));
  return (
    <article className="chart-card region-chart">
      <div className="chart-heading">
        <div>
          <h2>Revenue by region</h2>
          <p>Click a region to drill into its orders</p>
        </div>
        <ArrowUpRight size={15} />
      </div>
      <div className="region-bars">
        {regions.map((name, i) => {
          const item = groups.find((item) => item.name === name);
          return (
            <button
              key={name}
              aria-label={`Filter to ${name}`}
              aria-pressed={selected === name}
              onClick={() => onSelect(name)}
            >
              <span>
                <i style={{ background: colors[i] }} />
                {name}
              </span>
              <strong>{shortMoney(item?.revenue || 0)}</strong>
              <span className="region-track">
                <i
                  style={{
                    width: `${((item?.revenue || 0) / max) * 100}%`,
                    background: colors[i],
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
function Explore({ rows, group, metric, setGroup, setMetric, onDrill }) {
  const groups = groupRows(rows, group).toSorted(
    (a, b) => b[metric] - a[metric],
  );
  const max = Math.max(1, ...groups.map((item) => item[metric]));
  return (
    <section className="explore-card">
      <div className="explore-header">
        <div className="explore-title">
          <Layers size={19} />
          <div>
            <h2>Ask a different question.</h2>
            <p>
              Build a grouped summary. Select a result to see its source orders.
            </p>
          </div>
        </div>
        <div className="explore-selects">
          <label>
            Group by
            <select
              aria-label="Explore group"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              {[
                ["region", "Region"],
                ["category", "Category"],
                ["status", "Status"],
                ["customer", "Customer"],
              ].map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Measure
            <select
              aria-label="Explore measure"
              value={metric}
              onChange={(event) => setMetric(event.target.value)}
            >
              {[
                ["revenue", "Revenue"],
                ["profit", "Gross profit"],
                ["count", "Order count"],
              ].map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="explore-results">
        {groups.length ? (
          groups.map((item, i) => (
            <button
              key={item.name}
              onClick={() => onDrill(item.name)}
              aria-label={`Drill into ${item.name}`}
            >
              <span className="explore-rank">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong>{item.name}</strong>
              <span className="explore-bar">
                <i
                  style={{
                    width: `${(item[metric] / max) * 100}%`,
                    background: colors[i % colors.length],
                  }}
                />
              </span>
              <b>
                {metric === "count" ? number(item.count) : money(item[metric])}
              </b>
              <ArrowUpRight size={13} />
            </button>
          ))
        ) : (
          <div className="chart-empty">
            No groups match the current controls.
          </div>
        )}
      </div>
    </section>
  );
}
function OrderDetail({ row, onClose, onCustomer }) {
  return (
    <Dialog
      label={`${row.id} details`}
      onClose={onClose}
      className="detail-dialog"
    >
      <div className="detail-heading">
        <span className="table-icon">
          <FileSpreadsheet size={19} />
        </span>
        <span>ORDER DETAILS</span>
        <button
          className="icon-button"
          aria-label="Close order details"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="detail-content">
        <div className="detail-eyebrow">TRANSACTION RECORD</div>
        <h2>{row.id}</h2>
        <span className={`status-pill ${row.status.toLowerCase()}`}>
          <i />
          {row.status}
        </span>
        <div className="detail-revenue">
          <span>Order revenue</span>
          <strong>{money(row.revenue)}</strong>
          <small>After {percent(row.discount)} discount</small>
        </div>
        <h3>Customer & ownership</h3>
        <dl>
          <div>
            <dt>Customer</dt>
            <dd>{row.customer}</dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>{row.region}</dd>
          </div>
          <div>
            <dt>Order date</dt>
            <dd>{row.date}</dd>
          </div>
          <div>
            <dt>Account owner</dt>
            <dd>
              <span className="owner-initial">{row.owner[0]}</span>
              {row.owner}
            </dd>
          </div>
        </dl>
        <h3>Line item</h3>
        <div className="line-item">
          <span className="line-item-icon">
            <Layers size={19} />
          </span>
          <div>
            <strong>{row.product}</strong>
            <span>
              {row.category} · {row.quantity} × {money(row.unitPrice)}
            </span>
          </div>
          <b>{money(row.gross)}</b>
        </div>
        <dl className="calculation">
          <div>
            <dt>Gross amount</dt>
            <dd>{money(row.gross)}</dd>
          </div>
          <div>
            <dt>Discount</dt>
            <dd>−{money(row.gross - row.revenue)}</dd>
          </div>
          <div className="calculation-total">
            <dt>Revenue</dt>
            <dd data-testid="detail-revenue">{money(row.revenue)}</dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd data-testid="detail-cost">{money(row.cost)}</dd>
          </div>
          <div className="calculation-total profit-total">
            <dt>Gross profit</dt>
            <dd data-testid="detail-profit">{money(row.profit)}</dd>
          </div>
          <div>
            <dt>Gross margin</dt>
            <dd>{percent(row.margin)}</dd>
          </div>
        </dl>
        <button className="primary-button customer-drill" onClick={onCustomer}>
          View all orders for this customer
          <ArrowRight size={14} />
        </button>
        <div className="detail-footnote">
          <Database size={13} />
          <span>
            Fictional sample record. Amounts reflect the generated dataset,
            including records marked refunded.
          </span>
        </div>
      </div>
    </Dialog>
  );
}
