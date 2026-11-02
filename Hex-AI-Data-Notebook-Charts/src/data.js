export const regions = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Middle East",
];
export const categories = ["Software", "Hardware", "Services"];
export const orders = Array.from({ length: 240 }, (_, i) => {
  const quantity = 1 + (i % 6),
    price = [4200, 8900, 13500, 6800, 19500, 3600][(i + Math.floor(i / 7)) % 6];
  const revenue = Math.round(quantity * price * (1 - (i % 4) * 0.03));
  const cost = Math.round(quantity * price * (0.36 + (i % 7) * 0.04));
  return {
    order_id: `HX-${10401 + i}`,
    order_date: new Date(Date.UTC(2026, 9, 31) - ((i * 11) % 180) * 86400000)
      .toISOString()
      .slice(0, 10),
    region: regions[(i + Math.floor(i / 9)) % 4],
    category: categories[(i + Math.floor(i / 5)) % 3],
    channel: ["Direct", "Organic", "Paid search", "Partner"][i % 4],
    quantity,
    revenue_cents: revenue,
    cost_cents: cost,
  };
});
export const schema = [
  ["order_id", "TEXT"],
  ["order_date", "TEXT"],
  ["region", "TEXT"],
  ["category", "TEXT"],
  ["channel", "TEXT"],
  ["quantity", "INTEGER"],
  ["revenue_cents", "INTEGER"],
  ["cost_cents", "INTEGER"],
];
const where = "WHERE (:region = 'All regions' OR region = :region)";
export const queries = {
  monthly: `SELECT\n  substr(order_date, 1, 7) AS month,\n  COUNT(*) AS orders,\n  ROUND(SUM(revenue_cents) / 100.0, 2) AS revenue,\n  ROUND(SUM(revenue_cents - cost_cents) / 100.0, 2) AS gross_profit\nFROM orders\n${where}\nGROUP BY month\nORDER BY month;`,
  region: `SELECT\n  region,\n  COUNT(*) AS orders,\n  ROUND(SUM(revenue_cents) / 100.0, 2) AS revenue,\n  ROUND(SUM(revenue_cents - cost_cents) / 100.0, 2) AS gross_profit\nFROM orders\n${where}\nGROUP BY region\nORDER BY revenue DESC;`,
  products: `SELECT\n  category,\n  SUM(quantity) AS units,\n  COUNT(*) AS orders,\n  ROUND(SUM(revenue_cents) / 100.0, 2) AS revenue,\n  ROUND(SUM(revenue_cents - cost_cents) / 100.0, 2) AS gross_profit\nFROM orders\n${where}\nGROUP BY category\nORDER BY gross_profit DESC;`,
  recent: `SELECT order_id, order_date, region, category, channel,\n  quantity,\n  ROUND(revenue_cents / 100.0, 2) AS revenue\nFROM orders\n${where}\nORDER BY order_date DESC, order_id\nLIMIT 20;`,
};
export const PREF_KEY = "hex-data-notebook-study-v1";
export const defaultNote =
  "A closer look at the numbers behind our growth. Explore revenue trends, compare regions, and follow every chart back to its source data.";
export function readNotebook() {
  try {
    const value = JSON.parse(localStorage.getItem(PREF_KEY));
    if (
      value &&
      typeof value.query === "string" &&
      value.query.length <= 10000 &&
      typeof value.note === "string" &&
      value.note.length <= 4000 &&
      ["All regions", ...regions].includes(value.region) &&
      ["bar", "line"].includes(value.chartType)
    )
      return value;
  } catch {}
  return {
    query: queries.monthly,
    note: defaultNote,
    region: "All regions",
    chartType: "bar",
  };
}
export function suggestQuery(question) {
  const text = question.toLowerCase().trim();
  if (/region|geograph|منطقه/.test(text))
    return { id: "region", title: "Revenue by region", sql: queries.region };
  if (/product|categor|محصول|دسته/.test(text))
    return {
      id: "products",
      title: "Category performance",
      sql: queries.products,
    };
  if (/recent|latest|last.*order|اخیر|جدیدترین/.test(text))
    return { id: "recent", title: "Recent orders", sql: queries.recent };
  if (/month|trend|time|revenue|ماه|روند|درآمد/.test(text))
    return { id: "monthly", title: "Monthly revenue", sql: queries.monthly };
  return null;
}
export const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
export function formatValue(value, column) {
  if (value === null) return "NULL";
  if (typeof value !== "number") return String(value);
  if (/_cents$/i.test(column)) return money(value / 100);
  if (/revenue|profit|cost|sales|amount/i.test(column)) return money(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    value,
  );
}
export function csvContent(columns, rows) {
  const escape = (value) => {
    let text = value === null ? "" : String(value);
    if (typeof value === "string" && /^\s*[=+\-@]/.test(text))
      text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\ufeff" +
    [
      columns.map(escape).join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ].join("\r\n")
  );
}
