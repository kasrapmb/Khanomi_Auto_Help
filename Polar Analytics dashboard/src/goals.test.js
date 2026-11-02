import test from "node:test";
import assert from "node:assert/strict";
import { defaultGoals, validGoals, evaluateGoals } from "./goals.js";
const row = (date, gross) => ({
  date,
  orders: 1,
  gross,
  refunds: 0,
  cogs: 10,
  advertising: 5,
  shipping: 2,
  fees: 1,
  operating: 2,
});
test("monthly goal prorates across month boundaries and counts dates once", () => {
  const result = evaluateGoals(
    [row("2026-10-31", 100), row("2026-10-31", 100), row("2026-11-01", 100)],
    [],
    { ...defaultGoals, monthlyRevenue: 3100 },
  );
  assert.ok(Math.abs(result.target - (100 + 3100 / 30)) < 1e-8);
  assert.equal(result.summary.revenue, 300);
});
test("margin and revenue decline rules respond to actual financial values", () => {
  const result = evaluateGoals(
    [row("2026-11-01", 25)],
    [row("2026-10-31", 100)],
    { ...defaultGoals, marginFloor: 30 },
  );
  assert.equal(
    result.rules.find((rule) => rule.id === "margin").triggered,
    true,
  );
  assert.equal(
    result.rules.find((rule) => rule.id === "revenue").triggered,
    true,
  );
});
test("missing baseline and empty selection do not create false decline alerts", () => {
  const result = evaluateGoals([], []);
  assert.equal(result.progress, 0);
  assert.ok(result.rules.every((rule) => !rule.triggered));
});
test("stored goals reject invalid types, non-finite and out-of-range values", () => {
  assert.ok(validGoals(defaultGoals));
  for (const value of [
    null,
    {},
    { ...defaultGoals, monthlyRevenue: "400000" },
    { ...defaultGoals, marginFloor: 101 },
    { ...defaultGoals, declineLimit: -1 },
    { ...defaultGoals, monthlyRevenue: Infinity },
  ])
    assert.ok(!validGoals(value));
});
