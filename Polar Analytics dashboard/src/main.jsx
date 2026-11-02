import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  LayoutDashboard,
  ChartNoAxesCombined,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CalendarDays,
  SlidersHorizontal,
  Search,
  Plus,
  HelpCircle,
  Layers,
  Check,
  PanelLeftClose,
  Menu,
  X,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Percent,
} from "lucide-react";
import {
  data,
  channels,
  selectData,
  summarize,
  daily,
  csv,
  change,
} from "./finance.js";
import "./styles.css";
import ReportBuilder from "./ReportBuilder.jsx";
import GoalsAlerts from "./GoalsAlerts.jsx";
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const num = (n) => new Intl.NumberFormat("en-US").format(n);
const short = (n) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : money(n));
function Trend({ value, inverse = false }) {
  if (value === null) return <span className="muted">No prior data</span>;
  const good = inverse ? value <= 0 : value >= 0;
  return (
    <span className={"trend " + (good ? "positive" : "negative")}>
      {value >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{" "}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
function App() {
  const [view, setView] = useState("Overview"),
    [days, setDays] = useState(30),
    [channel, setChannel] = useState("All channels"),
    [tab, setTab] = useState("Revenue"),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(""),
    [notice, setNotice] = useState(""),
    [help, setHelp] = useState(false);
  const rows = selectData(data, days, channel),
    s = summarize(rows),
    p = summarize(selectData(data, days, channel, true)),
    series = daily(rows);
  const notify = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(""), 3500);
  };
  const navigate = (name) => {
    setView(name);
    setMobile(false);
  };
  const exportCSV = () => {
    const blob = new Blob([csv(rows)], { type: "text/csv;charset=utf-8;" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${days}d-${channel.toLowerCase().replaceAll(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Your financial report has been exported.");
  };
  const kpis = [
    ["Net revenue", money(s.revenue), "revenue", Wallet],
    ["Net profit", money(s.profit), "profit", TrendingUp],
    ["Profit margin", s.margin.toFixed(1) + "%", "margin", Percent],
    ["Orders", num(s.orders), "orders", ShoppingBag],
  ];
  const metric = tab === "Revenue" ? "revenue" : "profit",
    max = Math.max(...series.map((r) => r[metric])) * 1.2;
  const points = series
    .map(
      (r, i) =>
        `${(i / (series.length - 1)) * 720},${180 - (r[metric] / max) * 160}`,
    )
    .join(" ");
  const channelRows = channels
    .map((name) => ({
      name,
      ...summarize(rows.filter((r) => r.channel === name)),
    }))
    .filter(
      (r) => r.orders && r.name.toLowerCase().includes(search.toLowerCase()),
    );
  const pnl = [
    ["Gross sales", s.gross, "Income"],
    ["Refunds", -s.refunds, "Deduction"],
    ["Net revenue", s.revenue, "Subtotal"],
    ["Cost of goods sold", -s.cogs, "Cost"],
    ["Gross profit", s.grossProfit, "Subtotal"],
    ["Advertising", -s.advertising, "Cost"],
    ["Shipping & fulfillment", -s.shipping, "Cost"],
    ["Payment processing", -s.fees, "Cost"],
    ["Contribution profit", s.contribution, "Subtotal"],
    ["Operating expenses", -s.operating, "Cost"],
    ["Net profit", s.profit, "Total"],
  ];
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Overview");
          }}
        >
          <span className="brand-icon">p</span>polar
          <span className="brand-dot">.</span>
        </a>
        <button
          className="workspace"
          onClick={() =>
            notify("You are viewing the Northstar demo workspace.")
          }
        >
          <span className="store-icon">N</span>
          <span>
            Northstar Store<small>Demo workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            ["Overview", LayoutDashboard],
            ["Profit & loss", ChartNoAxesCombined],
            ["Reports", FileText],
            ["Goals & alerts", TrendingUp],
          ].map(([name, Icon]) => (
            <button
              key={name}
              className={view === name ? "nav active" : "nav"}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Overview" && <span className="nav-pill">4</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label second-label">YOUR DASHBOARDS</div>
        <button className="nav" onClick={() => navigate("Overview")}>
          <BarChart3 size={18} />
          Executive summary
        </button>
        <button
          className="nav"
          onClick={() => {
            navigate("Profit & loss");
            notify("Profitability dashboard opened.");
          }}
        >
          <Layers size={18} />
          Profitability
        </button>
        <div className="sidebar-bottom">
          <div className="upgrade">
            <span className="sparkle">✧</span>
            <strong>Your data. One clear picture.</strong>
            <p>Explore revenue, costs, and growth in one place.</p>
            <button onClick={() => setHelp(true)}>
              Explore this demo <ArrowRight size={14} />
            </button>
          </div>
          <button className="nav" onClick={() => setHelp(true)}>
            <HelpCircle size={18} />
            Help & resources
          </button>
          <div className="profile">
            <div className="avatar">JD</div>
            <span>
              Jamie Davis<small>Workspace admin</small>
            </span>
            <span className="status-dot" />
          </div>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <main>
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={19} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <span className="sync">
              <i />
              Demo data · Nov 1, 2026
            </span>
            <button
              className="icon-button"
              aria-label="Help"
              onClick={() => setHelp(true)}
            >
              <HelpCircle size={18} />
            </button>
            <div className="avatar small">JD</div>
          </div>
        </header>
        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">YOUR BUSINESS, AT A GLANCE</div>
              <h1>
                {view === "Overview"
                  ? "Business overview"
                  : view === "Profit & loss"
                    ? "Profit & loss"
                    : view === "Goals & alerts"
                      ? "Goals & alerts"
                      : "Management reports"}
              </h1>
              <p>
                {view === "Overview"
                  ? "A clear picture of your performance. Better decisions start here."
                  : view === "Profit & loss"
                    ? "Understand every dollar, from your first sale to your bottom line."
                    : "Turn your performance into a report you can act on."}
              </p>
            </div>
            <button className="button export" onClick={exportCSV}>
              <Download size={16} />
              Export report
            </button>
          </div>
          <div className="toolbar">
            <div className="filters">
              <label className="select-wrap">
                <CalendarDays size={15} />
                <select
                  aria-label="Date range"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </label>
              <span className="vs">vs. previous period</span>
              <label className="select-wrap">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Channel filter"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option>All channels</option>
                  {channels.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <span className="currency">
              Currency: <strong>USD</strong>
            </span>
          </div>
          <section className="kpi-grid" aria-label="Key performance indicators">
            {kpis.map(([name, value, key, Icon]) => (
              <article className="kpi" key={name}>
                <div className="kpi-top">
                  <span>{name}</span>
                  <Icon size={17} />
                </div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-bottom">
                  <Trend value={change(s[key], p[key])} />
                  <span>vs. previous {days} days</span>
                </div>
                <div className="mini-bars" aria-hidden="true">
                  {Array.from({ length: 22 }, (_, i) => (
                    <i
                      key={i}
                      style={{
                        height: 8 + ((i * 13 + name.length * 5) % 24),
                        opacity: 0.25 + i / 32,
                      }}
                    />
                  ))}
                </div>
              </article>
            ))}
          </section>
          {view === "Overview" ? (
            <>
              <section className="main-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Performance over time</h2>
                      <p>Keep an eye on the bigger picture.</p>
                    </div>
                    <div className="segmented">
                      {["Revenue", "Profit"].map((t) => (
                        <button
                          key={t}
                          className={t === tab ? "selected" : ""}
                          onClick={() => setTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-summary">
                    <strong>{money(s[metric])}</strong>
                    <Trend value={change(s[metric], p[metric])} />
                    <span>this period</span>
                  </div>
                  <div className="chart">
                    <div className="y-axis">
                      {[1, 0.75, 0.5, 0.25, 0].map((m, i) => (
                        <span key={i}>{short(max * m)}</span>
                      ))}
                    </div>
                    <div className="plot">
                      <svg
                        viewBox="0 0 720 200"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={`${tab} by day for selected period`}
                      >
                        <defs>
                          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="#7958ed"
                              stopOpacity=".18"
                            />
                            <stop
                              offset="100%"
                              stopColor="#7958ed"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        {[20, 60, 100, 140, 180].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="720"
                            y2={y}
                            stroke="#eeedf3"
                            strokeDasharray="4 5"
                          />
                        ))}
                        <polygon
                          points={`0,200 ${points} 720,200`}
                          fill="url(#area)"
                        />
                        <polyline
                          points={points}
                          fill="none"
                          stroke="#7c5bea"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                        />
                        {series.map((r, i) => (
                          <circle
                            key={r.date}
                            cx={(i / (series.length - 1)) * 720}
                            cy={180 - (r[metric] / max) * 160}
                            r="5"
                            className="chart-point"
                          >
                            <title>
                              {r.date}: {money(r[metric])}
                            </title>
                          </circle>
                        ))}
                      </svg>
                      <div className="x-axis">
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                          <span key={i}>
                            {new Date(
                              series[Math.round(f * (series.length - 1))].date +
                                "T00:00:00Z",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="chart-footer">
                    <span>
                      <i />
                      {tab === "Revenue" ? "Net revenue" : "Net profit"}
                    </span>
                    <span>Daily · {days} days</span>
                  </div>
                </article>
                <article className="panel breakdown">
                  <div className="panel-heading">
                    <div>
                      <h2>Where your revenue goes</h2>
                      <p>Every dollar, accounted for.</p>
                    </div>
                  </div>
                  <div className="donut-wrap">
                    <div
                      className="donut"
                      style={{
                        background: `conic-gradient(#7958ed 0 ${(s.profit / s.revenue) * 100}%, #c0aff8 ${(s.profit / s.revenue) * 100}% ${((s.profit + s.cogs) / s.revenue) * 100}%, #e0d7fb ${((s.profit + s.cogs) / s.revenue) * 100}% ${((s.profit + s.cogs + s.advertising) / s.revenue) * 100}%,#eceaf2 0)`,
                      }}
                    >
                      <div>
                        <span>Net profit</span>
                        <strong>
                          {s.margin.toFixed(1)}
                          <small>%</small>
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="breakdown-legend">
                    {[
                      ["Net profit", s.profit, "#7958ed"],
                      ["Cost of goods", s.cogs, "#c0aff8"],
                      ["Ad spend", s.advertising, "#e0d7fb"],
                      [
                        "Other expenses",
                        s.shipping + s.fees + s.operating,
                        "#eceaf2",
                      ],
                    ].map(([name, v, color]) => (
                      <div key={name}>
                        <span>
                          <i style={{ background: color }} />
                          {name}
                        </span>
                        <strong>{money(v)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Channel performance</h2>
                    <p>See what’s driving profitable growth.</p>
                  </div>
                  <label className="search">
                    <Search size={15} />
                    <input
                      placeholder="Search channels…"
                      aria-label="Search channels"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th>Net revenue</th>
                        <th>Orders</th>
                        <th>Ad spend</th>
                        <th>Net profit</th>
                        <th>Profit margin</th>
                        <th>Revenue share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelRows.map((r, i) => (
                        <tr key={r.name}>
                          <td>
                            <span
                              className={
                                "channel-icon c" + channels.indexOf(r.name)
                              }
                            >
                              {r.name === "Google Ads"
                                ? "G"
                                : r.name === "Meta Ads"
                                  ? "∞"
                                  : r.name === "Email"
                                    ? "@"
                                    : "↗"}
                            </span>
                            <strong>{r.name}</strong>
                          </td>
                          <td>{money(r.revenue)}</td>
                          <td>{num(r.orders)}</td>
                          <td>{money(r.advertising)}</td>
                          <td>{money(r.profit)}</td>
                          <td>
                            <span className="margin-badge">
                              {r.margin.toFixed(1)}%
                            </span>
                          </td>
                          <td>
                            <div className="share">
                              <span
                                style={{
                                  width: (r.revenue / s.revenue) * 100 + "%",
                                }}
                              />
                            </div>
                            <small>
                              {((r.revenue / s.revenue) * 100).toFixed(1)}%
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {!search && (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>{money(s.revenue)}</td>
                          <td>{num(s.orders)}</td>
                          <td>{money(s.advertising)}</td>
                          <td>{money(s.profit)}</td>
                          <td>{s.margin.toFixed(1)}%</td>
                          <td>100%</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {channelRows.length === 0 && (
                    <div className="empty">No channels match “{search}”.</div>
                  )}
                </div>
              </section>
            </>
          ) : view === "Profit & loss" ? (
            <section className="panel pnl">
              <div className="panel-heading">
                <div>
                  <h2>Income statement</h2>
                  <p>
                    Selected {days}-day period · {channel}
                  </p>
                </div>
                <span className="margin-badge">Accrual-style demo</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>% of revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnl.map(([name, value, type]) => (
                      <tr
                        key={name}
                        className={
                          type === "Total"
                            ? "total-row"
                            : type === "Subtotal"
                              ? "subtotal"
                              : ""
                        }
                      >
                        <td>{name}</td>
                        <td>
                          <span className="account-type">{type}</span>
                        </td>
                        <td>
                          {value < 0 ? "(" + money(-value) + ")" : money(value)}
                        </td>
                        <td>
                          {((Math.abs(value) / s.revenue) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="pnl-note">
                Net revenue = gross sales − refunds. Net profit = net revenue −
                product costs − advertising − shipping − fees − operating
                expenses.
              </p>
            </section>
          ) : view === "Goals & alerts" ? (
            <GoalsAlerts
              rows={rows}
              previousRows={selectData(data, days, channel, true)}
              channel={channel}
            />
          ) : (
            <>
              <ReportBuilder rows={rows} days={days} channel={channel} />
              <section className="report-grid">
                {[
                  [
                    "Executive summary",
                    "Revenue, profitability, and order performance in one clear snapshot.",
                    "Overview",
                  ],
                  [
                    "Profit & loss statement",
                    "A complete breakdown of income, expenses, and your bottom line.",
                    "Profit & loss",
                  ],
                  [
                    "Detailed financial export",
                    "All selected daily channel records, ready for your spreadsheet.",
                    "export",
                  ],
                ].map(([title, desc, target], i) => (
                  <article className="panel report-card" key={title}>
                    <div className="report-icon">
                      <FileText size={24} />
                    </div>
                    <span className="eyebrow">
                      {i === 2 ? "CSV EXPORT" : "MANAGEMENT REPORT"}
                    </span>
                    <h2>{title}</h2>
                    <p>{desc}</p>
                    <div className="report-meta">
                      <span>{days} days</span>
                      <span>{channel}</span>
                    </div>
                    <button
                      className="button"
                      onClick={() =>
                        target === "export" ? exportCSV() : navigate(target)
                      }
                    >
                      {target === "export" ? "Download CSV" : "Open report"}
                      <ArrowRight size={15} />
                    </button>
                  </article>
                ))}
              </section>
            </>
          )}
          <footer>
            <span>
              Independent Polar-inspired dashboard · Synthetic demo data
            </span>
            <span>
              <i className="green-dot" />
              All calculations run locally
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close"
              aria-label="Close help"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <div className="report-icon">
              <BarChart3 size={25} />
            </div>
            <h2 id="help-title">A clearer view of your business</h2>
            <p>
              This independent demonstration uses deterministic synthetic data.
              It is not connected to Polar Analytics, your store, or live
              financial systems.
            </p>
            <ul>
              <li>
                Change the period and channel to recalculate every report.
              </li>
              <li>Switch between revenue and profit in the chart.</li>
              <li>Review the income statement to reconcile your costs.</li>
              <li>Export the filtered underlying records as CSV.</li>
            </ul>
            <button className="button primary" onClick={() => setHelp(false)}>
              Explore dashboard <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
