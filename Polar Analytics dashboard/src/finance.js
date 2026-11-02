export const channels = ["Direct", "Google Ads", "Meta Ads", "Email"];
export const data = Array.from({ length: 60 }, (_, i) =>
  channels.map((channel, c) => {
    const orders = 18 + ((i * 7 + c * 13) % 30),
      gross = orders * (79 + c * 11),
      refunds = Math.round(gross * (0.022 + (i % 4) * 0.004));
    return {
      date: new Date(Date.UTC(2026, 8, 3 + i)).toISOString().slice(0, 10),
      channel,
      orders,
      gross,
      refunds,
      cogs: Math.round(gross * 0.31),
      advertising:
        c === 1 || c === 2 ? Math.round(gross * (0.19 + c * 0.02)) : 0,
      shipping: orders * 5,
      fees: Math.round(gross * 0.029),
      operating: orders * 4,
    };
  }),
).flat();
export function selectData(
  rows,
  days = 30,
  channel = "All channels",
  previous = false,
) {
  const end = new Date("2026-11-01T00:00:00Z");
  end.setUTCDate(end.getUTCDate() - (previous ? days : 0));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return rows.filter(
    (r) =>
      r.date >= start.toISOString().slice(0, 10) &&
      r.date <= end.toISOString().slice(0, 10) &&
      (channel === "All channels" || r.channel === channel),
  );
}
export function summarize(rows) {
  const result = rows.reduce(
    (a, r) => {
      for (const key of [
        "orders",
        "gross",
        "refunds",
        "cogs",
        "advertising",
        "shipping",
        "fees",
        "operating",
      ])
        a[key] += r[key];
      return a;
    },
    {
      orders: 0,
      gross: 0,
      refunds: 0,
      cogs: 0,
      advertising: 0,
      shipping: 0,
      fees: 0,
      operating: 0,
    },
  );
  result.revenue = result.gross - result.refunds;
  result.grossProfit = result.revenue - result.cogs;
  result.contribution =
    result.grossProfit - result.advertising - result.shipping - result.fees;
  result.profit = result.contribution - result.operating;
  result.margin = result.revenue ? (result.profit / result.revenue) * 100 : 0;
  result.aov = result.orders ? result.revenue / result.orders : 0;
  result.mer = result.advertising ? result.revenue / result.advertising : 0;
  return result;
}
export function daily(rows) {
  return [...new Set(rows.map((r) => r.date))]
    .sort()
    .map((date) => ({
      date,
      ...summarize(rows.filter((r) => r.date === date)),
    }));
}
export function csv(rows) {
  const keys = [
    "date",
    "channel",
    "orders",
    "gross",
    "refunds",
    "cogs",
    "advertising",
    "shipping",
    "fees",
    "operating",
  ];
  return [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => '"' + String(r[k]).replaceAll('"', '""') + '"').join(","),
    ),
  ].join("\r\n");
}
export function change(current, prior) {
  return prior ? ((current - prior) / Math.abs(prior)) * 100 : null;
}
