import test from "node:test";import assert from "node:assert/strict";import{demoRows,summarize,groupBy,csvReport}from "../src/finance.js";
const rows=demoRows();
test("demo data covers 365 days",()=>assert.equal(rows.length,365));
test("financial reconciliation",()=>{const s=summarize(rows);assert.equal(s.net,s.gross-s.discount-s.refund);assert.equal(s.profit,s.net-s.cogs-s.shipping-s.fees-s.ads-s.overhead)});
test("channel totals reconcile",()=>{const s=summarize(rows),g=groupBy(rows,"channel");assert.equal(g.reduce((a,b)=>a+b.net,0),s.net);assert.equal(g.reduce((a,b)=>a+b.profit,0),s.profit)});
test("custom costs lower profit",()=>{const a=summarize(rows),b=summarize(rows,5);assert.ok(b.profit<a.profit);assert.ok(Math.abs((a.profit-b.profit)-a.net*.05)<.01)});
test("month groups sorted chronologically",()=>{const g=groupBy(rows,"month");assert.deepEqual(g.map(x=>x.name),[...g.map(x=>x.name)].sort())});
test("empty range does not divide by zero",()=>{const s=summarize([]);assert.equal(s.margin,0);assert.equal(s.aov,0)});
test("CSV contains finance headers",()=>assert.match(csvReport(groupBy(rows,"channel")),/profit/));
