export const regions = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Middle East",
];
export const categories = ["Software", "Hardware", "Services"];
export const statuses = ["Completed", "Processing", "Refunded"];
export const colors = ["#5269df", "#8e80dd", "#54b3aa", "#e8ad65"];
const customers = [
  "Acme Studio",
  "Orbit Systems",
  "Northstar Labs",
  "Meridian Co.",
  "Aperture Group",
  "Vertex Digital",
  "Atlas Works",
  "Lumen Partners",
  "Cloudline Inc.",
  "Pioneer Supply",
  "Nova Collective",
  "Evergreen Tech",
];
const products = [
  { name: "Analytics workspace", category: "Software", price: 840 },
  { name: "Data connector", category: "Software", price: 360 },
  { name: "Edge gateway", category: "Hardware", price: 1250 },
  { name: "Workstation kit", category: "Hardware", price: 680 },
  { name: "Implementation", category: "Services", price: 1950 },
  { name: "Training session", category: "Services", price: 420 },
];
export const orders = Array.from({ length: 240 }, (_, i) => {
  const product = products[(i * 7 + Math.floor(i / 5)) % products.length];
  const quantity = 1 + ((i * 13) % 9);
  const discount = [0, 0.05, 0.1, 0.15][i % 4];
  const gross = product.price * quantity;
  const revenue = Math.round(gross * (1 - discount));
  const cost = Math.round(gross * (0.39 + (i % 8) * 0.035));
  const date = new Date(Date.UTC(2026, 10, 1) - ((i * 11) % 180) * 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    id: `ORD-${10481 + i}`,
    customer: customers[(i * 5) % customers.length],
    date,
    region: regions[(i + Math.floor(i / 7)) % regions.length],
    category: product.category,
    product: product.name,
    quantity,
    unitPrice: product.price,
    discount,
    gross,
    revenue,
    cost,
    profit: revenue - cost,
    margin: (revenue - cost) / revenue,
    status:
      i % 19 === 0 ? "Refunded" : i % 7 === 0 ? "Processing" : "Completed",
    owner: ["Kasra", "Maya", "Alex", "Nina"][i % 4],
  };
});
export const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const number = (value) => new Intl.NumberFormat("en-US").format(value);
export const percent = (value) => `${(value * 100).toFixed(1)}%`;
export const shortMoney = (value) =>
  Math.abs(value) >= 1000000
    ? `$${(value / 1000000).toFixed(2)}M`
    : Math.abs(value) >= 1000
      ? `$${(value / 1000).toFixed(1)}K`
      : money(value);
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(new Date(value + "T12:00:00Z"));
export function summarize(rows) {
  const total = rows.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.revenue,
      cost: sum.cost + row.cost,
      quantity: sum.quantity + row.quantity,
    }),
    { revenue: 0, cost: 0, quantity: 0 },
  );
  return {
    ...total,
    count: rows.length,
    profit: total.revenue - total.cost,
    margin: total.revenue ? (total.revenue - total.cost) / total.revenue : 0,
    average: rows.length ? total.revenue / rows.length : 0,
  };
}
export function groupRows(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups].map(([name, items]) => ({
    name,
    rows: items,
    ...summarize(items),
  }));
}
export const defaultFilters = {
  region: "All regions",
  category: "All categories",
  status: "All statuses",
  period: "All dates",
  search: "",
};
export function filterRows(rows, filters) {
  const days =
    filters.period === "Last 30 days"
      ? 30
      : filters.period === "Last 90 days"
        ? 90
        : Infinity;
  const end = Math.max(
    ...rows.map((row) => new Date(row.date + "T12:00:00Z").getTime()),
  );
  const cutoff = end - (days - 1) * 86400000;
  return rows.filter(
    (row) =>
      (filters.region === "All regions" || row.region === filters.region) &&
      (filters.category === "All categories" ||
        row.category === filters.category) &&
      (filters.status === "All statuses" || row.status === filters.status) &&
      new Date(row.date + "T12:00:00Z").getTime() >= cutoff &&
      `${row.id} ${row.customer} ${row.product} ${row.owner}`
        .toLowerCase()
        .includes(filters.search.toLowerCase()),
  );
}
export function sortRows(rows, sort) {
  return rows.toSorted((a, b) => {
    const x = a[sort.key],
      y = b[sort.key];
    const compare =
      typeof x === "number" ? x - y : String(x).localeCompare(String(y));
    return sort.direction === "asc" ? compare : -compare;
  });
}
export const columns = [
  { key: "id", label: "Order ID", type: "text" },
  { key: "date", label: "Order date", type: "date" },
  { key: "customer", label: "Customer", type: "text" },
  { key: "region", label: "Region", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "revenue", label: "Revenue", type: "money" },
  { key: "profit", label: "Gross profit", type: "money" },
  { key: "margin", label: "Margin", type: "percent" },
  { key: "status", label: "Status", type: "status" },
];
export function csvContent(rows, fields) {
  const escape = (value) => {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text))
      text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\ufeff" +
    [
      fields.map((field) => escape(field.label)).join(","),
      ...rows.map((row) =>
        fields.map((field) => escape(row[field.key])).join(","),
      ),
    ].join("\r\n")
  );
}
export const VIEW_KEY = "sigma-analytics-study-view-v1";
export function readSavedView() {
  try {
    const value = JSON.parse(localStorage.getItem(VIEW_KEY));
    if (
      !value ||
      typeof value.name !== "string" ||
      !value.name.trim() ||
      !value.filters ||
      typeof value.filters.search !== "string"
    )
      return null;
    for (const [key, allowed] of Object.entries({
      region: ["All regions", ...regions],
      category: ["All categories", ...categories],
      status: ["All statuses", ...statuses],
      period: ["All dates", "Last 30 days", "Last 90 days"],
    }))
      if (!allowed.includes(value.filters[key])) return null;
    if (
      !value.sort ||
      !columns.some((column) => column.key === value.sort.key) ||
      !["asc", "desc"].includes(value.sort.direction)
    )
      return null;
    if (
      !Array.isArray(value.columns) ||
      !value.columns.length ||
      new Set(value.columns).size !== value.columns.length ||
      !value.columns.every((key) =>
        columns.some((column) => column.key === key),
      )
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
