import { summarize, change } from "./finance.js";

export const defaultGoals = {
  monthlyRevenue: 400000,
  marginFloor: 35,
  declineLimit: 5,
};
export function validGoals(value) {
  return (
    value &&
    Number.isFinite(value.monthlyRevenue) &&
    value.monthlyRevenue > 0 &&
    Number.isFinite(value.marginFloor) &&
    value.marginFloor >= 0 &&
    value.marginFloor <= 100 &&
    Number.isFinite(value.declineLimit) &&
    value.declineLimit >= 0 &&
    value.declineLimit <= 100
  );
}
export function evaluateGoals(rows, previousRows, goals = defaultGoals) {
  const summary = summarize(rows),
    previous = summarize(previousRows);
  const dates = [...new Set(rows.map((row) => row.date))];
  // Each distinct selected day contributes its share of that calendar month's target.
  const target = dates.reduce((sum, date) => {
    const day = new Date(date + "T00:00:00Z");
    const monthDays = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return sum + goals.monthlyRevenue / monthDays;
  }, 0);
  const revenueChange = change(summary.revenue, previous.revenue);
  const rules = [
    {
      id: "margin",
      label: "Profit margin",
      triggered: rows.length > 0 && summary.margin < goals.marginFloor,
      detail: `${summary.margin.toFixed(1)}% actual · ${goals.marginFloor}% minimum`,
    },
    {
      id: "revenue",
      label: "Revenue decline",
      triggered: revenueChange !== null && revenueChange < -goals.declineLimit,
      detail:
        revenueChange === null
          ? "No previous revenue to compare"
          : `${revenueChange.toFixed(1)}% change · alert below −${goals.declineLimit}%`,
    },
    {
      id: "goal",
      label: "Revenue target",
      triggered: target > 0 && summary.revenue < target,
      detail:
        target > 0
          ? `${((summary.revenue / target) * 100).toFixed(1)}% of prorated target`
          : "No selected days",
    },
  ];
  return {
    summary,
    target,
    progress: target ? (summary.revenue / target) * 100 : 0,
    rules,
  };
}
