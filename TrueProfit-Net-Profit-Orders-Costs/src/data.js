export const STORES = ["Shopify", "Amazon"];
export const END_DATE = "2026-11-01";
export const START_DATE = "2026-09-03";
export const EXPENSE_KEY = "trueprofit-study-expenses-v1";
const dayMs = 86400000;
const products = [
  {
    name: "Everyday tote",
    category: "Accessories",
    price: 4800,
    cost: 1450,
    color: "#8caea1",
    initial: "ET",
  },
  {
    name: "Studio headphones",
    category: "Electronics",
    price: 14900,
    cost: 5800,
    color: "#a39db9",
    initial: "SH",
  },
  {
    name: "Essential crewneck",
    category: "Apparel",
    price: 7200,
    cost: 2380,
    color: "#b7aa95",
    initial: "EC",
  },
  {
    name: "Ceramic pour-over set",
    category: "Home & living",
    price: 8900,
    cost: 3100,
    color: "#b09b8d",
    initial: "CP",
  },
  {
    name: "Daily hydration bottle",
    category: "Accessories",
    price: 3600,
    cost: 980,
    color: "#8fa7bd",
    initial: "DB",
  },
  {
    name: "Desk essentials kit",
    category: "Home & living",
    price: 6400,
    cost: 1850,
    color: "#a6b48b",
    initial: "DK",
  },
];
export const dateOffset = (date, days) =>
  new Date(new Date(date + "T12:00:00Z").getTime() + days * dayMs)
    .toISOString()
    .slice(0, 10);
const customers = [
  "Jordan Lee",
  "Taylor Morgan",
  "Alex Chen",
  "Riley Park",
  "Casey Rivera",
  "Sam Wilson",
  "Jamie Brooks",
  "Avery Stone",
  "Morgan Reed",
  "Quinn Davis",
];
export const baseOrders = Array.from({ length: 180 }, (_, i) => {
  const day = Math.floor(i / 3),
    date = dateOffset(END_DATE, -day),
    store = STORES[(day + (i % 3)) % 2],
    product = products[(i * 7 + day) % products.length];
  const quantity = 1 + (i % 3),
    gross = product.price * quantity,
    discount = Math.round(gross * [0, 0.05, 0.1][i % 3]);
  const refund =
    i % 23 === 0
      ? gross - discount
      : i % 17 === 0
        ? Math.round((gross - discount) * 0.25)
        : 0;
  const shippingCollected =
    refund === gross - discount ? 0 : quantity === 1 ? 495 : 0;
  const revenue = gross - discount - refund + shippingCollected;
  const paymentFees =
    Math.round(
      (gross - discount + shippingCollected) *
        (store === "Shopify" ? 0.029 : 0.035),
    ) + 30;
  return {
    id: `TP-${20841 + i}`,
    date,
    store,
    customer: customers[i % customers.length],
    product: product.name,
    category: product.category,
    color: product.color,
    initial: product.initial,
    quantity,
    gross,
    discount,
    refund,
    shippingCollected,
    revenue,
    cogs: product.cost * quantity,
    shippingCost: 475 + quantity * 110,
    paymentFees,
    fulfillment: 125 + quantity * 45,
    tax: Math.round((gross - discount - refund) * 0.07),
    status:
      refund === gross - discount
        ? "Refunded"
        : refund
          ? "Partially refunded"
          : "Paid",
  };
});
export const dailyCosts = Array.from({ length: 60 }, (_, day) =>
  STORES.map((store, s) => ({
    date: dateOffset(END_DATE, -day),
    store,
    ads: 2350 + ((day * 17 + s * 23) % 45) * 85,
    operating: 380 + ((day + s) % 7) * 65,
  })),
).flat();
function allocate(amount, rows, field, target) {
  if (!rows.length) return;
  const per = Math.floor(amount / rows.length),
    remainder = amount % rows.length;
  rows.forEach((row, index) => {
    target.get(row.id)[field] += per + (index < remainder ? 1 : 0);
  });
}
export function enrichOrders(expenses = []) {
  const target = new Map(
    baseOrders.map((row) => [
      row.id,
      { ...row, ads: 0, operating: 0, customExpense: 0 },
    ]),
  );
  for (const cost of dailyCosts) {
    const rows = baseOrders.filter(
      (row) => row.date === cost.date && row.store === cost.store,
    );
    allocate(cost.ads, rows, "ads", target);
    allocate(cost.operating, rows, "operating", target);
  }
  for (const expense of expenses) {
    const rows = baseOrders.filter(
      (row) =>
        row.date === expense.date &&
        (expense.store === "All stores" || row.store === expense.store),
    );
    allocate(expense.amount, rows, "customExpense", target);
  }
  return [...target.values()].map((row) => {
    const totalCosts =
      row.cogs +
      row.shippingCost +
      row.paymentFees +
      row.fulfillment +
      row.ads +
      row.operating +
      row.customExpense;
    return { ...row, totalCosts, netProfit: row.revenue - totalCosts };
  });
}
export function aggregate(rows) {
  const keys = [
    "gross",
    "discount",
    "refund",
    "shippingCollected",
    "revenue",
    "cogs",
    "shippingCost",
    "paymentFees",
    "fulfillment",
    "ads",
    "operating",
    "customExpense",
    "netProfit",
    "totalCosts",
    "quantity",
    "tax",
  ];
  const totals = Object.fromEntries(
    keys.map((key) => [key, rows.reduce((sum, row) => sum + row[key], 0)]),
  );
  return {
    ...totals,
    count: rows.length,
    margin: totals.revenue ? totals.netProfit / totals.revenue : 0,
    aov: rows.length ? totals.revenue / rows.length : 0,
    roas: totals.ads ? totals.revenue / totals.ads : 0,
  };
}
export function filterOrders(rows, { start, end, store }) {
  return rows.filter(
    (row) =>
      row.date >= start &&
      row.date <= end &&
      (store === "All stores" || row.store === store),
  );
}
export const currency = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const compact = (cents) =>
  Math.abs(cents) >= 100000
    ? `$${(cents / 100000).toFixed(1)}k`
    : currency(cents);
export const percent = (value) => `${(value * 100).toFixed(1)}%`;
export const dateLabel = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(new Date(date + "T12:00:00Z"));
export const costFields = [
  { key: "cogs", name: "Cost of goods", color: "#4a8070" },
  { key: "ads", name: "Advertising", color: "#98b3a7" },
  { key: "shippingCost", name: "Shipping", color: "#aebbad" },
  { key: "paymentFees", name: "Transaction fees", color: "#d4b98d" },
  { key: "fulfillment", name: "Fulfillment", color: "#b2a3be" },
  { key: "operating", name: "Base operating costs", color: "#91a9bf" },
  { key: "customExpense", name: "Added expenses", color: "#bdd0ba" },
];
export function groupProducts(rows) {
  return products
    .map((product) => {
      const items = rows.filter((row) => row.product === product.name);
      return { ...product, ...aggregate(items) };
    })
    .filter((product) => product.count > 0)
    .toSorted((a, b) => b.netProfit - a.netProfit);
}
export function readExpenses() {
  try {
    const value = JSON.parse(localStorage.getItem(EXPENSE_KEY));
    if (
      Array.isArray(value) &&
      new Set(value.map((item) => item.id)).size === value.length &&
      value.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          item.name.trim() &&
          Number.isSafeInteger(item.amount) &&
          item.amount > 0 &&
          item.amount <= 100000000 &&
          ["Operations", "Software", "Salaries", "Other"].includes(
            item.category,
          ) &&
          ["All stores", ...STORES].includes(item.store) &&
          typeof item.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          baseOrders.some((row) => row.date === item.date),
      )
    )
      return value;
  } catch {}
  return [];
}
export const csvFields = [
  ["id", "Order ID"],
  ["date", "Date"],
  ["store", "Store"],
  ["customer", "Customer"],
  ["product", "Product"],
  ["status", "Status"],
  ["revenue", "Revenue USD"],
  ["cogs", "COGS USD"],
  ["shippingCost", "Shipping USD"],
  ["paymentFees", "Fees USD"],
  ["fulfillment", "Fulfillment USD"],
  ["ads", "Ads USD"],
  ["operating", "Base overhead USD"],
  ["customExpense", "Added expenses USD"],
  ["totalCosts", "Total costs USD"],
  ["netProfit", "Net profit USD"],
];
export function csvContent(rows) {
  const escape = (value) => '"' + String(value).replaceAll('"', '""') + '"';
  return (
    "\ufeff" +
    [
      csvFields.map(([, label]) => escape(label)).join(","),
      ...rows.map((row) =>
        csvFields
          .map(([key], index) =>
            escape(
              index >= 6
                ? (row[key] / 100).toFixed(2)
                : /^[\s]*[=+\-@]/.test(String(row[key]))
                  ? "'" + row[key]
                  : row[key],
            ),
          )
          .join(","),
      ),
    ].join("\r\n")
  );
}
