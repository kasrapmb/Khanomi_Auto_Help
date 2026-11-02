import test from "node:test";
import assert from "node:assert/strict";
import { data, selectData, summarize, daily, csv, change } from "./finance.js";
test("profit reconciles revenue and every cost, excluding refunded revenue", () => {
  const s = summarize([
    {
      orders: 2,
      gross: 200,
      refunds: 20,
      cogs: 50,
      advertising: 30,
      shipping: 10,
      fees: 5,
      operating: 15,
    },
  ]);
  assert.equal(s.revenue, 180);
  assert.equal(s.profit, 70);
  assert.equal(s.margin, (70 / 180) * 100);
  assert.equal(s.aov, 90);
});
test("date periods are disjoint, complete, and channel filtering applies", () => {
  const now = selectData(data, 30),
    before = selectData(data, 30, "All channels", true);
  assert.equal(now.length, 120);
  assert.equal(before.length, 120);
  assert.equal(now[0].date, "2026-10-03");
  assert.equal(now.at(-1).date, "2026-11-01");
  assert.equal(before.at(-1).date, "2026-10-02");
  assert.ok(
    selectData(data, 7, "Meta Ads").every((r) => r.channel === "Meta Ads"),
  );
  assert.equal(selectData(data, 7, "Meta Ads").length, 7);
});
test("daily and channel aggregates reconcile with total", () => {
  const rows = selectData(data, 7);
  assert.equal(
    daily(rows).reduce((a, r) => a + r.profit, 0),
    summarize(rows).profit,
  );
  assert.equal(daily(rows).length, 7);
});
test("empty datasets avoid non-finite KPI values", () => {
  const s = summarize([]);
  assert.equal(s.margin, 0);
  assert.equal(s.aov, 0);
  assert.equal(s.mer, 0);
  assert.equal(change(20, 0), null);
});
test("CSV escapes fields and exports exactly the selected rows", () => {
  const rows = selectData(data, 7, "Email");
  const result = csv(rows);
  assert.equal(result.split("\r\n").length, 8);
  assert.ok(result.includes('"Email"'));
  assert.ok(csv([{ ...rows[0], channel: 'A"B' }]).includes('"A""B"'));
});
