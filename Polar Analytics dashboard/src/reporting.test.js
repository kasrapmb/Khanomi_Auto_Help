import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, parseSavedReports, reportCSV } from "./reporting.js";

const base = {
  refunds: 0,
  cogs: 0,
  advertising: 0,
  shipping: 0,
  fees: 0,
  operating: 0,
};
const rows = [
  {
    ...base,
    date: "2026-10-01",
    channel: "Direct",
    gross: 100,
    orders: 1,
    cogs: 25,
    shipping: 5,
    fees: 2,
    operating: 8,
  },
  {
    ...base,
    date: "2026-10-01",
    channel: "Meta Ads",
    gross: 300,
    orders: 3,
    refunds: 20,
    cogs: 80,
    advertising: 40,
    shipping: 10,
    fees: 6,
    operating: 14,
  },
  {
    ...base,
    date: "2026-10-02",
    channel: "Direct",
    gross: 500,
    orders: 2,
    refunds: 10,
    cogs: 100,
    shipping: 10,
    fees: 5,
    operating: 15,
  },
];

test("groups by channel and reconciles profit and contribution to underlying records", () => {
  const report = buildReport(rows, { metric: "profit", dimension: "channel" });
  assert.deepEqual(
    report.groups.map((row) => [row.group, row.value]),
    [
      ["Direct", 420],
      ["Meta Ads", 130],
    ],
  );
  assert.equal(report.total, 550);
  assert.equal(
    report.groups.reduce((total, row) => total + row.value, 0),
    report.total,
  );
  assert.equal(buildReport(rows, { metric: "contribution" }).total, 587);
});

test("groups by date and computes weighted ratios from totals, not means or sums", () => {
  const report = buildReport(rows, {
    metric: "aov",
    dimension: "date",
    sortBy: "group",
    direction: "asc",
  });
  assert.deepEqual(
    report.groups.map((row) => [row.group, row.value]),
    [
      ["2026-10-01", 95],
      ["2026-10-02", 245],
    ],
  );
  assert.equal(report.total, 870 / 6);
  assert.notEqual(report.total, (95 + 245) / 2);
  assert.equal(buildReport(rows, { metric: "mer" }).total, 870 / 40);
  assert.equal(
    buildReport(
      rows.filter((row) => row.channel === "Direct"),
      { metric: "mer" },
    ).total,
    0,
  );
});

test("sorts by metric or dimension without mutating inputs and respects filtered rows", () => {
  const before = JSON.stringify(rows);
  assert.deepEqual(
    buildReport(rows, { sortBy: "value", direction: "asc" }).groups.map(
      (row) => row.group,
    ),
    ["Meta Ads", "Direct"],
  );
  assert.deepEqual(
    buildReport(rows, { sortBy: "group", direction: "desc" }).groups.map(
      (row) => row.group,
    ),
    ["Meta Ads", "Direct"],
  );
  const filtered = buildReport(
    rows.filter((row) => row.channel === "Meta Ads"),
    { metric: "orders" },
  );
  assert.equal(filtered.groups.length, 1);
  assert.equal(filtered.total, 3);
  assert.equal(filtered.recordCount, 1);
  assert.equal(JSON.stringify(rows), before);
});

test("CSV preserves sort order, escapes quotes/newlines, and neutralizes spreadsheet formulas", () => {
  const malicious = [{ ...rows[0], channel: '=HYPERLINK("bad")\nnext' }];
  const csv = reportCSV(buildReport(malicious));
  assert.equal(
    csv,
    '"Channel","Net revenue"\r\n"\'=HYPERLINK(""bad"")\nnext","100"\r\n"Total","100"',
  );
  assert.ok(
    reportCSV(buildReport(rows, { sortBy: "group", direction: "asc" })).indexOf(
      '"Direct"',
    ) <
      reportCSV(
        buildReport(rows, { sortBy: "group", direction: "asc" }),
      ).indexOf('"Meta Ads"'),
  );
  assert.ok(
    reportCSV(buildReport([{ ...rows[0], gross: -100 }])).includes('"-100"'),
  );
});

test("empty reports stay finite and unsupported report options fail explicitly", () => {
  assert.deepEqual(buildReport([]).groups, []);
  assert.equal(buildReport([], { metric: "aov" }).total, 0);
  assert.equal(buildReport([], { metric: "mer" }).total, 0);
  for (const options of [
    { metric: "__proto__" },
    { dimension: "unknown" },
    { direction: "sideways" },
    { sortBy: "random" },
  ])
    assert.throws(() => buildReport(rows, options));
});

test("saved configurations ignore corrupt, oversized, invalid, and duplicate storage entries", () => {
  const good = {
    id: "first",
    name: " Revenue by channel ",
    metric: "revenue",
    dimension: "channel",
    sortBy: "value",
    direction: "desc",
    injected: true,
  };
  const parsed = parseSavedReports(
    JSON.stringify([
      good,
      { ...good, name: "Duplicate" },
      { ...good, id: "bad", metric: "__proto__" },
      null,
      { ...good, id: "empty", name: " " },
    ]),
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Revenue by channel");
  assert.equal(Object.hasOwn(parsed[0], "injected"), false);
  for (const raw of [null, "not-json", "{}", "[", " ".repeat(100001)])
    assert.deepEqual(parseSavedReports(raw), []);
});
