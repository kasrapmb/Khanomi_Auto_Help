import test from "node:test";
import assert from "node:assert/strict";
import {demoData,parseCSV,loadCSV,interpret,analyze,format,resultCSV} from "../src/analytics.js";
const rows=demoData();
test("demo dataset is present and numeric",()=>{
 assert.equal(rows.length,480);
 assert.ok(rows.every(r=>Number.isFinite(r.revenue)&&r.date&&r.region));
});
test("CSV handles BOM, quoted commas and quotes",()=>{
 const csv='\uFEFFdate,revenue,product\n"2026-01-01","1,250","A ""large"", product"\n';
 const data=loadCSV(csv);
 assert.equal(data.rows.length,1);
 assert.equal(data.rows[0].product,'A "large", product');
 assert.equal(data.rows[0].revenue,1250);
});
test("CSV requires date and revenue",()=>{
 assert.throws(()=>loadCSV("category,profit\nfoo,5"),/date/);
});
test("revenue by region sums to total",()=>{
 const result=analyze(rows,"total revenue by region");
 assert.equal(result.chart,"bar");
 assert.equal(result.groups.reduce((n,v)=>n+v.value,0),result.total);
 assert.equal(result.groups.length,4);
});
test("monthly sales produces ordered chronology",()=>{
 const result=analyze(rows,"monthly sales trend");
 assert.equal(result.chart,"line");
 assert.equal(result.groups.length,24);
 assert.deepEqual(result.groups.map(x=>x.name),[...result.groups.map(x=>x.name)].sort());
});
test("top 5 products are ranked and limited",()=>{
 const r=analyze(rows,"top 5 products by revenue");
 assert.equal(r.groups.length,5);
 assert.ok(r.groups.every((x,i)=>i===0||r.groups[i-1].value>=x.value));
});
test("why question computes change descriptively",()=>{
 const r=analyze(rows,"why did revenue change?");
 assert.equal(r.chart,"line");
 assert.match(r.description,/descriptive/i);
 assert.equal(r.groups.length,24);
});
test("orders and profit use their own metrics",()=>{
 assert.equal(analyze(rows,"orders by channel").metric,"orders");
 assert.equal(analyze(rows,"profit by category").metric,"profit");
});
test("Persian region questions are recognized",()=>{
 const r=analyze(rows,"فروش بر اساس منطقه");
 assert.equal(r.query.dimension,"region");
});
test("empty question fails safely",()=>assert.match(analyze(rows,"").error,/question/i));
test("no profit column reports unsupported metric",()=>{
 const data=loadCSV("date,revenue\n2026-01-01,12");
 assert.match(analyze(data.rows,"profit").error,/profit/i);
});
test("export output contains proper labels",()=>{
 const csv=resultCSV([{name:'A "special"',value:100}]);
 assert.match(csv,/""special""/);
});

test("unrelated natural language is rejected instead of fabricated",()=>{
 const result=analyze(rows,"What is the weather tomorrow?");
 assert.match(result.error,/unsupported/i);
});
