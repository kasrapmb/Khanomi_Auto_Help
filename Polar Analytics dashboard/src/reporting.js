import { summarize } from "./finance.js";

export const REPORT_STORAGE_KEY = "polar-demo.management-reports.v1";
export const METRICS = {
  revenue: { label: "Net revenue", format: "currency" },
  profit: { label: "Net profit", format: "currency" },
  contribution: { label: "Contribution profit", format: "currency" },
  orders: { label: "Orders", format: "number" },
  aov: { label: "Average order value", format: "currency" },
  mer: { label: "Marketing efficiency ratio", format: "ratio" },
};
export const DIMENSIONS = { date: "Date", channel: "Channel" };

function validateOptions(metric, dimension, sortBy, direction) {
  if (!Object.hasOwn(METRICS, metric)) throw new Error("Unknown report metric");
  if (!Object.hasOwn(DIMENSIONS, dimension))
    throw new Error("Unknown report dimension");
  if (!["group", "value"].includes(sortBy))
    throw new Error("Unknown sort column");
  if (!["asc", "desc"].includes(direction))
    throw new Error("Unknown sort direction");
}

/** Ratios are recomputed from underlying records, never added or averaged. */
export function buildReport(
  rows,
  {
    metric = "revenue",
    dimension = "channel",
    sortBy = "value",
    direction = "desc",
  } = {},
) {
  validateOptions(metric, dimension, sortBy, direction);
  const buckets = new Map();
  for (const row of rows) {
    const key = String(row[dimension] ?? "Unknown");
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const groups = Array.from(buckets, ([group, records]) => {
    const summary = summarize(records);
    return { group, value: summary[metric], summary };
  });
  const sign = direction === "asc" ? 1 : -1;
  groups.sort((a, b) => {
    const comparison =
      sortBy === "group"
        ? a.group.localeCompare(b.group, "en")
        : a.value - b.value;
    return comparison * sign || a.group.localeCompare(b.group, "en");
  });
  const summary = summarize(rows);
  return {
    metric,
    dimension,
    groups,
    total: summary[metric],
    summary,
    recordCount: rows.length,
  };
}

function csvCell(value) {
  // Spreadsheet apps may execute formulas even in quoted CSV fields.
  let text = String(value);
  if (typeof value !== "number" && /^[\s]*[=+\-@]/u.test(text))
    text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function reportCSV(report) {
  const lines = [
    [DIMENSIONS[report.dimension], METRICS[report.metric].label],
    ...report.groups.map((row) => [row.group, row.value]),
    ["Total", report.total],
  ];
  return lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** Ignore malformed, obsolete, or excessive local data instead of trusting it. */
export function parseSavedReports(raw) {
  try {
    if (typeof raw !== "string" || raw.length > 100_000) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed
      .slice(0, 50)
      .filter((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          typeof item.id !== "string" ||
          !item.id ||
          item.id.length > 100 ||
          seen.has(item.id)
        )
          return false;
        if (
          typeof item.name !== "string" ||
          !item.name.trim() ||
          item.name.length > 80
        )
          return false;
        try {
          validateOptions(
            item.metric,
            item.dimension,
            item.sortBy,
            item.direction,
          );
        } catch {
          return false;
        }
        seen.add(item.id);
        return true;
      })
      .map(({ id, name, metric, dimension, sortBy, direction }) => ({
        id,
        name: name.trim(),
        metric,
        dimension,
        sortBy,
        direction,
      }));
  } catch {
    return [];
  }
}
