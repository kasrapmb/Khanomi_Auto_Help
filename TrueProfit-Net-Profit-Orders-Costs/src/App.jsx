import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Store,
  Target,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import {
  aggregate,
  baseOrders,
  compact,
  costFields,
  csvContent,
  currency,
  dateLabel,
  dateOffset,
  END_DATE,
  enrichOrders,
  EXPENSE_KEY,
  filterOrders,
  groupProducts,
  percent,
  readExpenses,
  START_DATE,
  STORES,
} from "./data.js";

function Brand() {
  return (
    <span className="brand-mark">
      <span />
      <span />
      <span />
    </span>
  );
}
function Modal({ label, onClose, children, className = "" }) {
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
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
const initialRange = {
  start: dateOffset(END_DATE, -29),
  end: END_DATE,
  store: "All stores",
};
export default function App() {
  const [view, setView] = useState("Overview");
  const [range, setRange] = useState(initialRange);
  const [period, setPeriod] = useState("Last 30 days");
  const [expenses, setExpenses] = useState(readExpenses);
  const [storageError, setStorageError] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [metric, setMetric] = useState("netProfit");
  const [mobileNav, setMobileNav] = useState(false);
  const [about, setAbout] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef(null);
  const allRows = useMemo(() => enrichOrders(expenses), [expenses]);
  const rows = useMemo(() => filterOrders(allRows, range), [allRows, range]);
  const totals = useMemo(() => aggregate(rows), [rows]);
  const products = useMemo(() => groupProducts(rows), [rows]);
  const selected = allRows.find((row) => row.id === selectedId);
  const invalidRange = range.start > range.end;
  const days =
    Math.round((new Date(range.end) - new Date(range.start)) / 86400000) + 1;
  const previousRange = {
    ...range,
    start: dateOffset(range.start, -days),
    end: dateOffset(range.start, -1),
  };
  const previous =
    previousRange.start >= START_DATE && previousRange.end <= END_DATE
      ? aggregate(filterOrders(allRows, previousRange))
      : null;
  const tableRows = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (status === "All statuses" || row.status === status) &&
            `${row.id} ${row.customer} ${row.product}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .toSorted((a, b) => {
          const comparison =
            typeof a[sort.key] === "number"
              ? a[sort.key] - b[sort.key]
              : String(a[sort.key]).localeCompare(String(b[sort.key]));
          return sort.direction === "asc" ? comparison : -comparison;
        }),
    [rows, search, status, sort],
  );
  const pageCount = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = tableRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const visibleExpenses = expenses.filter(
    (expense) =>
      expense.date >= range.start &&
      expense.date <= range.end &&
      (range.store === "All stores" ||
        expense.store === "All stores" ||
        expense.store === range.store),
  );
  useEffect(() => {
    try {
      localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [expenses]);
  useEffect(() => {
    setPage(1);
  }, [range, search, status, pageSize]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (e) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !selectedId &&
        !addingExpense &&
        !about
      ) {
        e.preventDefault();
        setView("Orders");
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, addingExpense, about]);
  const navigate = (next) => {
    setView(next);
    setMobileNav(false);
  };
  const choosePeriod = (value) => {
    setPeriod(value);
    if (value !== "Custom range") {
      const length =
        value === "Last 7 days" ? 7 : value === "Last 30 days" ? 30 : 60;
      setRange((current) => ({
        ...current,
        start: dateOffset(END_DATE, 1 - length),
        end: END_DATE,
      }));
    }
  };
  const addExpense = (expense) => {
    setExpenses((current) => [
      ...current,
      { ...expense, id: crypto.randomUUID() },
    ]);
    setAddingExpense(false);
    setToast("Expense added and allocated to its orders");
  };
  const changeSort = (key) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };
  const exportOrders = () => {
    const url = URL.createObjectURL(
      new Blob([csvContent(tableRows)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "trueprofit-filtered-orders.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`Exported ${tableRows.length} orders`);
  };
  const variation = (key) => {
    if (!previous || previous[key] === 0) return null;
    return (totals[key] - previous[key]) / Math.abs(previous[key]);
  };
  const card = (label, key, Icon, description, primary = false) => {
    const change = variation(key);
    return (
      <article className={`metric-card ${primary ? "profit-card" : ""}`}>
        <div className="metric-label">
          <span className="metric-symbol">
            <Icon size={16} />
          </span>
          {label}
          {primary && <span className="live-label">LIVE DEMO</span>}
        </div>
        <strong
          data-testid={`metric-${key}`}
          className={totals[key] < 0 ? "negative" : ""}
        >
          {key === "count" ? totals[key] : currency(totals[key])}
        </strong>
        <div className="metric-bottom">
          {change !== null ? (
            <span
              className={`change-pill ${(key === "totalCosts" ? change <= 0 : change >= 0) ? "up" : "down"}`}
            >
              {change >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDown size={12} />
              )}{" "}
              {percent(Math.abs(change))}
            </span>
          ) : (
            <span className="no-comparison">—</span>
          )}
          <span>{description}</span>
        </div>
        {primary && (
          <svg
            className="metric-sparkline"
            viewBox="0 0 100 30"
            aria-hidden="true"
          >
            <path
              d={sparkline(rows)}
              fill="none"
              stroke="#4e9d78"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </article>
    );
  };
  const orderTable = (
    <section className="table-card">
      <div className="section-heading">
        <span className="section-icon">
          <Receipt size={17} />
        </span>
        <div>
          <h2>
            {view === "Overview"
              ? "Your orders, with the full picture."
              : "Order profitability"}
          </h2>
          <p>
            Revenue is only the beginning. See what each order leaves behind.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={exportOrders}
          disabled={!tableRows.length}
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
            placeholder="Search order, customer or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </div>
        <label>
          Status
          <select
            aria-label="Order status filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["All statuses", "Paid", "Partially refunded", "Refunded"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <span className="table-count">{tableRows.length} orders</span>
      </div>
      <div className="table-scroll">
        <table aria-label="Order profitability table">
          <thead>
            <tr>
              {[
                ["id", "Order"],
                ["date", "Date"],
                ["customer", "Customer"],
                ["store", "Store"],
                ["revenue", "Revenue"],
                ["totalCosts", "Total costs"],
                ["netProfit", "Net profit"],
                ["status", "Status"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className={
                    ["revenue", "totalCosts", "netProfit"].includes(key)
                      ? "numeric"
                      : ""
                  }
                  aria-sort={
                    sort.key === key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button onClick={() => changeSort(key)}>
                    {label}
                    {sort.key === key ? (
                      sort.direction === "asc" ? (
                        <ArrowUp size={10} />
                      ) : (
                        <ArrowDown size={10} />
                      )
                    ) : (
                      <ArrowDownUp size={10} />
                    )}
                  </button>
                </th>
              ))}
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      className="order-link"
                      onClick={() => setSelectedId(row.id)}
                    >
                      {row.id}
                    </button>
                  </td>
                  <td>{dateLabel(row.date)}</td>
                  <td className="customer-name">{row.customer}</td>
                  <td>
                    <span className={`store-pill ${row.store.toLowerCase()}`}>
                      <span>{row.store === "Shopify" ? "S" : "a"}</span>
                      {row.store}
                    </span>
                  </td>
                  <td className="numeric">{currency(row.revenue)}</td>
                  <td className="numeric costs-cell">
                    {currency(row.totalCosts)}
                  </td>
                  <td
                    className={`numeric profit-cell ${row.netProfit < 0 ? "negative" : ""}`}
                  >
                    {currency(row.netProfit)}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${row.status === "Paid" ? "paid" : "refunded"}`}
                    >
                      <i />
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Open ${row.id} details`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <Search size={25} />
                    <h3>No matching orders</h3>
                    <p>Try a different search, status, store or date range.</p>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setSearch("");
                        setStatus("All statuses");
                        setRange(initialRange);
                        setPeriod("Last 30 days");
                      }}
                    >
                      Reset all controls
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span>
          Showing {tableRows.length ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, tableRows.length)} of{" "}
          {tableRows.length} orders
          <span className="pagination-note">
            {" "}
            · Search and status affect this table only
          </span>
        </span>
        <div>
          <label>
            Rows
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            {currentPage}/{pageCount}
          </span>
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={currentPage === pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <Brand />
          <strong>
            trueprofit<span>.</span>
          </strong>
          <button
            className="icon-button mobile-only"
            aria-label="Close sidebar"
            onClick={() => setMobileNav(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="workspace-card">
          <span className="workspace-avatar">K</span>
          <div>
            <strong>Khanomi commerce</strong>
            <span>Independent study</span>
          </div>
          <ChevronDown size={13} />
        </div>
        <div className="sidebar-heading">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {[
            ["Overview", LayoutDashboard],
            ["Orders", ShoppingBag],
            ["Costs", Wallet],
            ["Products", Package],
          ].map(([name, Icon]) => (
            <button
              className={`nav-item ${view === name ? "active" : ""}`}
              key={name}
              onClick={() => navigate(name)}
            >
              <Icon size={17} />
              <span>{name}</span>
              {name === "Orders" && <span className="nav-count">180</span>}
              {view === name && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-heading stores-heading">
          DEMO STORES<span>2</span>
        </div>
        {STORES.map((store) => (
          <button
            className="store-nav"
            key={store}
            onClick={() => {
              setRange((current) => ({ ...current, store }));
              setMobileNav(false);
            }}
          >
            <span className={`store-icon ${store.toLowerCase()}`}>
              {store === "Shopify" ? "S" : "a"}
            </span>
            <span>{store}</span>
            <span className="connected-dot" />
          </button>
        ))}
        <div className="sidebar-insight">
          <span>
            <TrendingUp size={16} />A little more clarity.
          </span>
          <p>
            Understand your numbers.
            <br />
            Build a more profitable store.
          </p>
          <button onClick={() => setAbout(true)}>
            How this demo works
            <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button className="help-button" onClick={() => setAbout(true)}>
            <HelpCircle size={15} />
            Data & calculations
          </button>
          <div className="profile">
            <span className="profile-avatar">K</span>
            <div>
              <strong>kasrapmb</strong>
              <span>Local workspace</span>
            </div>
            <span className="profile-tag">K</span>
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
            <span>Khanomi commerce</span>
            <ChevronRight size={12} />
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <span className="demo-badge">
              <i />
              Synthetic data
            </span>
            <button
              className="icon-button"
              aria-label="About calculations"
              onClick={() => setAbout(true)}
            >
              <HelpCircle size={17} />
            </button>
            <span className="profile-avatar small">K</span>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">LESS GUESSWORK. MORE GROWTH.</div>
              <h1>
                {view === "Overview"
                  ? "Know what you really earn."
                  : view === "Orders"
                    ? "Every order. Every dollar."
                    : view === "Costs"
                      ? "See where your money goes."
                      : "Find your profit drivers."}
              </h1>
              <p>
                {view === "Overview"
                  ? "Your sales, costs, and true profit — all in one clear view."
                  : view === "Orders"
                    ? "Follow the numbers from checkout to your bottom line."
                    : view === "Costs"
                      ? "Make every expense visible. Make better decisions."
                      : "Look beyond bestsellers. Discover what earns its place."}
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setAddingExpense(true)}
            >
              <Plus size={14} />
              Add expense
            </button>
          </section>
          <div className="global-controls">
            <span className="controls-label">
              <Store size={14} />
              Store
            </span>
            <select
              aria-label="Store filter"
              value={range.store}
              onChange={(e) =>
                setRange((current) => ({ ...current, store: e.target.value }))
              }
            >
              {["All stores", ...STORES].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <span className="control-divider" />
            <label className="period-control">
              <span>Date range</span>
              <select
                aria-label="Date range"
                value={period}
                onChange={(e) => choosePeriod(e.target.value)}
              >
                {[
                  "Last 7 days",
                  "Last 30 days",
                  "Last 60 days",
                  "Custom range",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            {period === "Custom range" ? (
              <div className="custom-dates">
                <input
                  type="date"
                  aria-label="Start date"
                  min={START_DATE}
                  max={END_DATE}
                  value={range.start}
                  onChange={(e) =>
                    setRange((current) => ({
                      ...current,
                      start: e.target.value || START_DATE,
                    }))
                  }
                />
                <ArrowRight size={11} />
                <input
                  type="date"
                  aria-label="End date"
                  min={START_DATE}
                  max={END_DATE}
                  value={range.end}
                  onChange={(e) =>
                    setRange((current) => ({
                      ...current,
                      end: e.target.value || END_DATE,
                    }))
                  }
                />
              </div>
            ) : (
              <span className="date-caption">
                {dateLabel(range.start)} – {dateLabel(range.end)}, 2026
              </span>
            )}
            <span className="controls-currency">USD</span>
          </div>
          {invalidRange && (
            <div className="warning" role="alert">
              Start date must be on or before end date.
            </div>
          )}
          {storageError && (
            <div className="warning" role="alert">
              Expenses are not saved: browser storage is unavailable. Changes
              will be lost after closing this page.
            </div>
          )}
          <section className="metrics" aria-label="Profitability totals">
            {card(
              "Net profit",
              "netProfit",
              TrendingUp,
              `${percent(totals.margin)} net margin`,
              true,
            )}
            {card(
              "Total revenue",
              "revenue",
              CircleDollarSign,
              "vs. previous equal period",
            )}
            {card(
              "Total costs",
              "totalCosts",
              Wallet,
              "vs. previous equal period",
            )}
            {card(
              "Orders",
              "count",
              ShoppingBag,
              `AOV ${currency(totals.aov)}`,
            )}
          </section>
          {view === "Overview" && (
            <>
              <div className="analytics-grid">
                <TrendChart
                  rows={rows}
                  metric={metric}
                  onMetric={setMetric}
                  totals={totals}
                />
                <ProfitStatement
                  totals={totals}
                  onCosts={() => navigate("Costs")}
                />
              </div>
              <div className="insight-strip">
                <span className="insight-icon">
                  <Target size={17} />
                </span>
                <div>
                  <strong>Your numbers, in context.</strong>
                  <p>
                    {totals.ads
                      ? `${totals.roas.toFixed(2)}× revenue per advertising dollar`
                      : "No advertising costs in this selection"}{" "}
                    · {percent(totals.margin)} net margin · {totals.quantity}{" "}
                    units sold
                  </p>
                </div>
                <button onClick={() => navigate("Products")}>
                  Explore products
                  <ArrowRight size={13} />
                </button>
              </div>
              {orderTable}
            </>
          )}
          {view === "Orders" && orderTable}
          {view === "Costs" && (
            <>
              <div className="costs-grid">
                <CostBreakdown totals={totals} />
                <ProfitStatement totals={totals} onCosts={null} />
              </div>
              <section className="expense-card">
                <div className="section-heading">
                  <span className="section-icon">
                    <FileText size={17} />
                  </span>
                  <div>
                    <h2>Added expenses</h2>
                    <p>
                      One-time costs allocated to eligible orders on their
                      expense date.
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setAddingExpense(true)}
                  >
                    <Plus size={13} />
                    Add expense
                  </button>
                </div>
                {visibleExpenses.length ? (
                  <div className="table-scroll">
                    <table aria-label="Added expenses">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Store</th>
                          <th className="numeric">Full amount</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {visibleExpenses.map((expense) => (
                          <tr key={expense.id}>
                            <td className="customer-name">{expense.name}</td>
                            <td>{dateLabel(expense.date)}</td>
                            <td>{expense.category}</td>
                            <td>{expense.store}</td>
                            <td className="numeric">
                              {currency(expense.amount)}
                            </td>
                            <td>
                              <button
                                className="icon-button delete-button"
                                aria-label={`Delete expense ${expense.name}`}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete ${expense.name}? This cannot be undone.`,
                                    )
                                  ) {
                                    setExpenses((current) =>
                                      current.filter(
                                        (item) => item.id !== expense.id,
                                      ),
                                    );
                                    setToast("Expense removed");
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="expenses-empty">
                    <span>
                      <Receipt size={25} />
                    </span>
                    <h3>Nothing slipping through the cracks.</h3>
                    <p>
                      Add software, salaries or other operational costs to make
                      your profit picture more complete.
                    </p>
                    <button
                      className="secondary-button"
                      onClick={() => setAddingExpense(true)}
                    >
                      <Plus size={12} />
                      Add your first expense
                    </button>
                  </div>
                )}
                <div className="expense-note">
                  <CheckCircle2 size={12} />
                  {storageError
                    ? "Changes are not saved"
                    : "Saved in this browser"}
                  <span>
                    {" "}
                    · All-store expenses are split across eligible orders.
                    Listed amounts are before store allocation.
                  </span>
                </div>
              </section>
            </>
          )}
          {view === "Products" && (
            <section className="products-card">
              <div className="section-heading">
                <span className="section-icon">
                  <Package size={17} />
                </span>
                <div>
                  <h2>Products that make a difference</h2>
                  <p>
                    Ranked by net profit, including allocated advertising and
                    overhead.
                  </p>
                </div>
                <span className="subtle-label">{products.length} products</span>
              </div>
              <div className="table-scroll">
                <table aria-label="Product profitability">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="numeric">Units</th>
                      <th className="numeric">Revenue</th>
                      <th className="numeric">All costs</th>
                      <th className="numeric">Net profit</th>
                      <th className="numeric">Net margin</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, i) => (
                      <tr key={product.name}>
                        <td>
                          <div className="product-name">
                            <span className="product-rank">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                              className="product-initial"
                              style={{
                                background: product.color + "25",
                                color: product.color,
                              }}
                            >
                              {product.initial}
                            </span>
                            <span>
                              <strong>{product.name}</strong>
                              <small>{product.category}</small>
                            </span>
                          </div>
                        </td>
                        <td className="numeric">{product.quantity}</td>
                        <td className="numeric">{currency(product.revenue)}</td>
                        <td className="numeric costs-cell">
                          {currency(product.totalCosts)}
                        </td>
                        <td
                          className={`numeric profit-cell ${product.netProfit < 0 ? "negative" : ""}`}
                        >
                          {currency(product.netProfit)}
                        </td>
                        <td className="numeric">{percent(product.margin)}</td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`View orders for ${product.name}`}
                            onClick={() => {
                              setSearch(product.name);
                              setStatus("All statuses");
                              navigate("Orders");
                            }}
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              <Brand />
              Independent TrueProfit-inspired study
            </span>
            <span>Sample orders · USD · Tax excluded from profit</span>
            <button onClick={() => setAbout(true)}>
              See calculation notes
              <ArrowUpRight size={10} />
            </button>
          </footer>
        </div>
      </main>
      {addingExpense && (
        <ExpenseForm
          onClose={() => setAddingExpense(false)}
          onSave={addExpense}
        />
      )}
      {selected && (
        <OrderDetail row={selected} onClose={() => setSelectedId(null)} />
      )}
      {about && (
        <Modal
          label="Calculation notes"
          onClose={() => setAbout(false)}
          className="about-dialog"
        >
          <div className="dialog-top">
            <span className="section-icon">
              <BarChart3 size={20} />
            </span>
            <button
              className="icon-button"
              aria-label="Close calculation notes"
              onClick={() => setAbout(false)}
            >
              <X size={18} />
            </button>
          </div>
          <h2>A transparent profit picture.</h2>
          <p>
            This independent study uses 180 fictional orders across two demo
            stores. It is not connected to TrueProfit or a live store.
          </p>
          <dl>
            <div>
              <dt>Revenue</dt>
              <dd>Gross sales − discounts − refunds + shipping collected</dd>
            </div>
            <div>
              <dt>Net profit</dt>
              <dd>Revenue − all seven cost categories</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>Pass-through amount, excluded from revenue and profit</dd>
            </div>
            <div>
              <dt>Allocation</dt>
              <dd>
                Daily ads and base overhead split by date/store; added costs by
                their expense date/store
              </dd>
            </div>
            <div>
              <dt>Refunds</dt>
              <dd>
                Costs remain; no stock recovery or fee reversal is assumed
              </dd>
            </div>
            <div>
              <dt>Comparisons</dt>
              <dd>
                Previous equal-length period, only when fully present in the
                sample
              </dd>
            </div>
          </dl>
          <p className="allocation-note">
            All calculations use integer cents. Allocation remainders are
            assigned deterministically so every cent reconciles. Relative dates
            end on November 1, 2026, the latest sample date.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
function sparkline(rows) {
  const groups = new Map();
  for (const row of rows)
    groups.set(row.date, (groups.get(row.date) || 0) + row.netProfit);
  const values = [...groups]
    .toSorted((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => value);
  const min = Math.min(0, ...values),
    max = Math.max(1, ...values);
  return values
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${(index / Math.max(1, values.length - 1)) * 100},${27 - ((value - min) / Math.max(1, max - min)) * 24}`,
    )
    .join(" ");
}
function TrendChart({ rows, metric, onMetric, totals }) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.date)) groups.set(row.date, []);
    groups.get(row.date).push(row);
  }
  const series = [...groups]
    .toSorted((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, ...aggregate(items) }));
  const values = series.map((item) => item[metric]),
    min = Math.min(0, ...values),
    max = Math.max(1, ...values),
    span = Math.max(1, max - min),
    w = 680,
    h = 218,
    base = 177;
  const points = values.map((value, i) => [
    50 + (i / Math.max(1, values.length - 1)) * 600,
    base - ((value - min) / span) * 140,
  ]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const label = {
    netProfit: "Net profit",
    revenue: "Revenue",
    totalCosts: "Total costs",
  }[metric];
  return (
    <article className="trend-card">
      <div className="chart-heading">
        <div>
          <span className="chart-eyebrow">PROFITABILITY OVER TIME</span>
          <h2>Watch your bottom line grow.</h2>
        </div>
        <div className="metric-switch">
          {[
            ["netProfit", "Profit"],
            ["revenue", "Revenue"],
            ["totalCosts", "Costs"],
          ].map(([key, name]) => (
            <button
              key={key}
              className={metric === key ? "selected" : ""}
              aria-pressed={metric === key}
              onClick={() => onMetric(key)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="trend-summary">
        <strong data-testid="trend-total">{currency(totals[metric])}</strong>
        <span>
          <i />
          {label} · daily totals
        </span>
      </div>
      {series.length ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`Daily ${label.toLowerCase()} chart`}
        >
          <defs>
            <linearGradient id="profit-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65a58a" stopOpacity=".22" />
              <stop offset="100%" stopColor="#65a58a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((fraction) => (
            <g key={fraction}>
              <line
                x1="50"
                y1={base - fraction * 140}
                x2="650"
                y2={base - fraction * 140}
                stroke="#e8eeeb"
                strokeDasharray="3 5"
              />
              <text
                x="0"
                y={base - fraction * 140 + 4}
                fontSize="10"
                fill="#8b9c95"
              >
                {compact(min + fraction * span)}
              </text>
            </g>
          ))}
          <path
            d={`${path} L${points.at(-1)[0]},${base} L${points[0][0]},${base} Z`}
            fill="url(#profit-area)"
          />
          <path
            d={path}
            fill="none"
            stroke="#579b7c"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {points.map(([x, y], i) => (
            <g key={series[i].date}>
              <circle
                cx={x}
                cy={y}
                r="3"
                fill="#fff"
                stroke="#579b7c"
                strokeWidth="1.4"
              >
                <title>
                  {series[i].date}: {currency(series[i][metric])}
                </title>
              </circle>
              {(i === 0 ||
                i === series.length - 1 ||
                i % Math.max(1, Math.floor(series.length / 5)) === 0) && (
                <text
                  x={x}
                  y="205"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#889c92"
                >
                  {dateLabel(series[i].date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      ) : (
        <div className="chart-empty">No orders in this date range.</div>
      )}
      <div className="chart-bottom">
        <span>
          <span className="connected-dot" />
          Calculated from the selected orders
        </span>
        <span>{rows.length} orders</span>
      </div>
    </article>
  );
}
function ProfitStatement({ totals, onCosts }) {
  return (
    <article className="statement-card">
      <div className="statement-heading">
        <span className="section-icon">
          <FileText size={17} />
        </span>
        <div>
          <h2>From revenue to profit</h2>
          <p>Every cost, accounted for.</p>
        </div>
      </div>
      <div className="statement-revenue">
        <span>Revenue</span>
        <strong>{currency(totals.revenue)}</strong>
      </div>
      <div className="statement-costs">
        {costFields.map((field) => (
          <div key={field.key}>
            <span>
              <i style={{ background: field.color }} />
              {field.name}
            </span>
            <span>−{currency(totals[field.key])}</span>
          </div>
        ))}
      </div>
      <div
        className={`statement-profit ${totals.netProfit < 0 ? "negative" : ""}`}
      >
        <div>
          <strong>Net profit</strong>
          <span>{percent(totals.margin)} of revenue</span>
        </div>
        <b data-testid="statement-net">{currency(totals.netProfit)}</b>
      </div>
      {onCosts && (
        <button className="statement-link" onClick={onCosts}>
          Explore your costs
          <ArrowRight size={13} />
        </button>
      )}
    </article>
  );
}
function CostBreakdown({ totals }) {
  let accumulated = 0;
  return (
    <article className="cost-breakdown">
      <div className="chart-heading">
        <div>
          <span className="chart-eyebrow">THE COST OF DOING BUSINESS</span>
          <h2>Make the invisible visible.</h2>
        </div>
      </div>
      <div className="donut-wrap">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label="Cost distribution chart"
        >
          <circle
            cx="90"
            cy="90"
            r="67"
            fill="none"
            stroke="#edf2ef"
            strokeWidth="21"
          />
          {costFields.map((field) => {
            const share = totals.totalCosts
              ? totals[field.key] / totals.totalCosts
              : 0;
            const offset = accumulated;
            accumulated += share;
            return (
              <circle
                key={field.key}
                cx="90"
                cy="90"
                r="67"
                fill="none"
                stroke={field.color}
                strokeWidth="21"
                strokeDasharray={`${share * 421} 421`}
                strokeDashoffset={-offset * 421}
                transform="rotate(-90 90 90)"
              >
                <title>
                  {field.name}: {currency(totals[field.key])}
                </title>
              </circle>
            );
          })}
        </svg>
        <div>
          <span>Total costs</span>
          <strong>{currency(totals.totalCosts)}</strong>
          <small>
            {totals.revenue ? percent(totals.totalCosts / totals.revenue) : "—"}{" "}
            of revenue
          </small>
        </div>
      </div>
      <div className="cost-legend">
        {costFields.map((field) => (
          <div key={field.key}>
            <span>
              <i style={{ background: field.color }} />
              {field.name}
            </span>
            <span>
              {totals.totalCosts
                ? percent(totals[field.key] / totals.totalCosts)
                : "0.0%"}
            </span>
            <strong>{currency(totals[field.key])}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
function ExpenseForm({ onClose, onSave }) {
  const [name, setName] = useState(""),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(END_DATE),
    [store, setStore] = useState("All stores"),
    [category, setCategory] = useState("Operations");
  const valid =
    name.trim() &&
    Number(amount) > 0 &&
    Number(amount) <= 1000000 &&
    date >= START_DATE &&
    date <= END_DATE;
  return (
    <Modal
      label="Add operating expense"
      onClose={onClose}
      className="expense-dialog"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid)
            onSave({
              name: name.trim(),
              amount: Math.round(Number(amount) * 100),
              date,
              store,
              category,
            });
        }}
      >
        <div className="dialog-top">
          <span className="section-icon">
            <Wallet size={21} />
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Close add expense"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <h2>Every cost counts.</h2>
        <p>Add an expense to see its impact on your true profit.</p>
        <label>
          Expense name
          <input
            data-autofocus
            aria-label="Expense name"
            required
            maxLength={120}
            placeholder="e.g. Monthly design software"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Amount (USD)
            <input
              aria-label="Expense amount"
              type="number"
              step="0.01"
              min="0.01"
              max="1000000"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Expense date
            <input
              aria-label="Expense date"
              type="date"
              min={START_DATE}
              max={END_DATE}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Store
            <select
              aria-label="Expense store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            >
              {["All stores", ...STORES].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              aria-label="Expense category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Operations", "Software", "Salaries", "Other"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="allocation-info">
          <CheckCircle2 size={14} />
          <span>
            Allocated across orders on this date and store. All-store expenses
            are divided across all eligible orders, preserving every cent.
          </span>
        </div>
        <button className="primary-button" disabled={!valid} type="submit">
          <Plus size={14} />
          Add expense
        </button>
      </form>
    </Modal>
  );
}
function OrderDetail({ row, onClose }) {
  return (
    <Modal
      label={`${row.id} profitability`}
      onClose={onClose}
      className="detail-dialog"
    >
      <div className="detail-top">
        <span className="section-icon">
          <Receipt size={18} />
        </span>
        <span>ORDER PROFITABILITY</span>
        <button
          className="icon-button"
          aria-label="Close order profitability"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="detail-body">
        <span className="detail-eyebrow">FOLLOW EVERY DOLLAR</span>
        <h2>{row.id}</h2>
        <div className="detail-meta">
          <span>{row.customer}</span>
          <span>·</span>
          <span>{dateLabel(row.date)}</span>
          <span className="detail-store">{row.store}</span>
        </div>
        <div className={`order-profit-hero ${row.netProfit < 0 ? "loss" : ""}`}>
          <span>Net profit</span>
          <strong data-testid="detail-profit">{currency(row.netProfit)}</strong>
          <small>
            {row.revenue ? percent(row.netProfit / row.revenue) : "—"} net
            margin
          </small>
        </div>
        <div className="detail-product">
          <span
            className="product-initial"
            style={{ background: row.color + "25", color: row.color }}
          >
            {row.initial}
          </span>
          <div>
            <strong>{row.product}</strong>
            <span>
              {row.quantity} × {currency(row.gross / row.quantity)}
            </span>
          </div>
          <span
            className={`status-pill ${row.status === "Paid" ? "paid" : "refunded"}`}
          >
            {row.status}
          </span>
        </div>
        <h3>Sales breakdown</h3>
        <dl>
          <div>
            <dt>Gross sales</dt>
            <dd>{currency(row.gross)}</dd>
          </div>
          <div>
            <dt>Discounts</dt>
            <dd>−{currency(row.discount)}</dd>
          </div>
          <div>
            <dt>Refunds</dt>
            <dd>−{currency(row.refund)}</dd>
          </div>
          <div>
            <dt>Shipping collected</dt>
            <dd>{currency(row.shippingCollected)}</dd>
          </div>
          <div className="detail-total">
            <dt>Revenue, excluding tax</dt>
            <dd data-testid="detail-revenue">{currency(row.revenue)}</dd>
          </div>
        </dl>
        <h3>Costs & allocations</h3>
        <dl>
          {costFields.map((field) => (
            <div key={field.key}>
              <dt>
                <i style={{ background: field.color }} />
                {field.name}
              </dt>
              <dd>{currency(row[field.key])}</dd>
            </div>
          ))}
          <div className="detail-total">
            <dt>Total costs</dt>
            <dd data-testid="detail-costs">{currency(row.totalCosts)}</dd>
          </div>
          <div className="detail-final">
            <dt>Net profit</dt>
            <dd>{currency(row.netProfit)}</dd>
          </div>
        </dl>
        <div className="detail-note">
          <HelpCircle size={14} />
          <span>
            Tax of {currency(row.tax)} is pass-through and excluded from profit.
            Refunded orders retain their recorded costs; no fee recovery or
            restock is assumed.
          </span>
        </div>
      </div>
    </Modal>
  );
}
