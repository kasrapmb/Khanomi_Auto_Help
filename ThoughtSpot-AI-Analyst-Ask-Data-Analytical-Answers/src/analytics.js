
const metricNames = {revenue:"Revenue",profit:"Profit",orders:"Orders",quantity:"Units sold"};
const aliases = {
 date:["date","order date","orderdate","transaction date","تاریخ"],
 revenue:["revenue","sales","amount","total sales","فروش","درآمد"],
 profit:["profit","net profit","سود"],
 orders:["orders","order count","سفارش"],
 quantity:["quantity","units","تعداد"],
 region:["region","area","منطقه"],
 category:["category","دسته"],
 product:["product","product name","محصول"],
 channel:["channel","source","کانال"]
};
const norm=s=>String(s??"").trim().toLowerCase().replace(/[\u200c\u200f]/g," ").replace(/[_-]+/g," ").replace(/\s+/g," ");
const asNumber=s=>{const v=Number(String(s??"").replace(/[$,\s]/g,""));return Number.isFinite(v)?v:NaN};
export const format=(n,metric="revenue")=>new Intl.NumberFormat("en-US",metric==="revenue"||metric==="profit"?{style:"currency",currency:"USD",maximumFractionDigits:0}:{maximumFractionDigits:0}).format(n);
export const metrics=metricNames;
export function parseCSV(content){
 const lines=[],row=[];let field="",quoted=false;const text=String(content).replace(/^\uFEFF/,"");
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++}else if(ch==='"')quoted=false;else field+=ch}
  else if(ch==='"')quoted=true;else if(ch===','){row.push(field);field=""}
  else if(ch==='\n'){row.push(field.replace(/\r$/,""));lines.push([...row]);row.length=0;field=""}
  else field+=ch;
 }
 if(quoted)throw Error("Unclosed quote in CSV");
 if(field||row.length){row.push(field.replace(/\r$/,""));lines.push([...row])}
 return lines.filter(line=>line.some(c=>c.trim()));
}
export function loadCSV(csv){
 const lines=parseCSV(csv);if(lines.length<2)throw Error("Expected CSV headers and at least one record");
 const header=lines.shift().map(norm),positions={};
 Object.entries(aliases).forEach(([name,opts])=>{const p=header.findIndex(h=>opts.includes(h));if(p>=0)positions[name]=p});
 for(const required of ["date","revenue"])if(!(required in positions))throw Error("Missing required column: "+required+" (expected date and revenue/sales)");
 const result=[];let skipped=0;
 for(const fields of lines){const get=key=>positions[key]===undefined?"":String(fields[positions[key]]??"").trim();
  const date=new Date(get("date")),revenue=asNumber(get("revenue"));
  if(!Number.isFinite(date.getTime())||!Number.isFinite(revenue)){skipped++;continue}
  const profit=asNumber(get("profit")),orders=asNumber(get("orders")),quantity=asNumber(get("quantity"));
  result.push({date:date.toISOString().slice(0,10),revenue,profit:positions.profit===undefined||!Number.isFinite(profit)?null:profit,
   orders:positions.orders===undefined||!Number.isFinite(orders)?1:orders,
   quantity:positions.quantity===undefined||!Number.isFinite(quantity)?1:quantity,
   region:get("region")||"Unknown",category:get("category")||"Unknown",product:get("product")||"Unknown",channel:get("channel")||"Unknown"});
 }
 if(!result.length)throw Error("No valid CSV rows");
 return {rows:result,skipped,columns:Object.keys(positions)};
}
export function demoData(){
 const regions=["West","East","South","Central"],cats=["Electronics","Furniture","Office Supplies","Apparel"];
 const goods=[["Headphones","Webcam","Laptop Stand"],["Desk Chair","Bookshelf","Standing Desk"],["Notebook","Printer Paper","Organizer"],["Sneakers","Jacket","T-shirt"]];
 const channels=["Organic Search","Paid Search","Social Ads","Email"],rows=[];
 for(let i=0;i<480;i++){const month=Math.floor(i/20),base=new Date(Date.UTC(2025,0,1));
 base.setUTCMonth(month);base.setUTCDate(i%20+1);
 const ci=(i*7+month)%4,region=regions[(i*3+Math.floor(i/10))%4],quantity=1+(i*7%5);
 const revenue=Math.round((105+i*31%270+month*4)*quantity*(region==="West"?1.18:1));
 rows.push({date:base.toISOString().slice(0,10),region,category:cats[ci],product:goods[ci][(i+Math.floor(i/9))%3],
 channel:channels[(i*3+Math.floor(i/6))%4],revenue,profit:Math.round(revenue*(.16+i*13%13/100)),orders:1,quantity});
 }return rows;
}
const any=(q,a)=>a.some(w=>q.includes(w));
export function interpret(question){
 const q=norm(question);
 const metric=any(q,["profit","سود"])?"profit":any(q,["order","سفارش"])?"orders":any(q,["quantity","units","تعداد کالا"])?"quantity":"revenue";
 let dimension=null;
 const terms=[["region",["region","منطقه"]],["category",["category","categories","دسته"]],["product",["product","item","محصول"]],["channel",["channel","source","کانال"]]];
 for(const [d,words] of terms)if(any(q,words)){dimension=d;break}
 if(any(q,["monthly","month","trend","over time","ماه","روند"]))dimension="month";
 if(any(q,["yearly","year","سالانه"]))dimension="year";
 const top=q.match(/(?:top|best|برتر)\s*(\d{1,2})/);
 const filter={};
 const values={region:["West","East","South","Central"],category:["Electronics","Furniture","Office Supplies","Apparel"],product:["Headphones","Webcam","Laptop Stand","Desk Chair","Bookshelf","Standing Desk","Notebook","Printer Paper","Organizer","Sneakers","Jacket","T-shirt"],channel:["Organic Search","Paid Search","Social Ads","Email"]};
 for(const [d,choices] of Object.entries(values)){const found=choices.find(v=>q.includes(norm(v)));if(found)filter[d]=found}
 if(any(q,["last year","سال گذشته","پارسال"]))filter.year=new Date().getUTCFullYear()-1;
 const recognized=any(q,["revenue","sales","profit","order","quantity","units","فروش","درآمد","سود","سفارش","region","category","product","channel","month","year","trend","منطقه","دسته","محصول","کانال","ماه","روند"]);return {metric,dimension,top:top?Math.min(20,Number(top[1])):null,why:any(q,["why","چرا","reason","علت"]),filter,q,recognized};
}
const sum=(rows,metric)=>rows.reduce((n,r)=>n+(Number(r[metric])||0),0);
export function analyze(rows,question){
 if(!String(question??"").trim())return{error:"Please enter a question."};
 const query=interpret(question);if(!query.recognized)return{error:"Unsupported question. Ask about revenue, profit, orders or units by a category, region, product, channel, month or year."};const selected=rows.filter(r=>Object.entries(query.filter).every(([key,v])=>key==="year"?r.date.startsWith(String(v)):r[key]===v));
 if(!selected.length)return{error:"No matching rows. Try a different filter or question."};
 const {metric,dimension}=query;if(metric==="profit"&&!selected.some(r=>r.profit!==null))return{error:"No profit field. Upload a CSV with a profit column."};
 const total=sum(selected,metric),label=metricNames[metric],data=new Map(),dateMin=selected.map(r=>r.date).sort()[0],dateMax=selected.map(r=>r.date).sort().at(-1);
 const summary=label+" totals "+format(total,metric)+" across "+selected.length.toLocaleString()+" records ("+dateMin+" to "+dateMax+").";
 let dim=dimension;
 if(query.why)dim="month";
 if(dim){for(const r of selected){const key=dim==="month"?r.date.slice(0,7):dim==="year"?r.date.slice(0,4):r[dim];data.set(key,(data.get(key)||0)+(Number(r[metric])||0))}}
 let groups=[...data].map(([name,value])=>({name,value}));
 if(["month","year"].includes(dim))groups.sort((a,b)=>a.name.localeCompare(b.name));else groups.sort((a,b)=>b.value-a.value);
 if(query.top&&!query.why)groups=groups.slice(0,query.top);
 let description="",title=dim?label+" by "+dim:"Total "+label.toLowerCase();
 if(query.why){
  const a=groups.at(-2),b=groups.at(-1);
  if(!a||!b)return{error:"At least two different months are required for change analysis."};
  const change=a.value?((b.value-a.value)/Math.abs(a.value)*100):null;
  title="What changed in "+label.toLowerCase()+"?";
  description=label+" changed from "+format(a.value,metric)+" in "+a.name+" to "+format(b.value,metric)+" in "+b.name+(change===null?".":(" ("+(change>0?"+":"")+change.toFixed(1)+"%)."))+" This is descriptive, not a proven cause. Break down by region or category to investigate.";
 }else if(groups.length){
  if(["month","year"].includes(dim)){const a=groups.at(-2),b=groups.at(-1);description="Latest period "+b.name+": "+format(b.value,metric)+(a&&a.value?" ("+((b.value-a.value)/Math.abs(a.value)*100).toFixed(1)+"% vs previous).":".");}
  else description=groups[0].name+" leads with "+format(groups[0].value,metric)+(total>0?" ("+(groups[0].value/total*100).toFixed(1)+"% of total).":".");
 }
 const method="Filtered "+selected.length+" rows. "+(dim?"Grouped by "+dim+" and ":"")+"Summed "+metric+". "+(query.top?"Limited to top "+query.top+". ":"")+(query.why?"Compared the latest two months; causality is not inferred.":"");
 return{query,title,summary,description,groups,chart:dim?(["month","year"].includes(dim)?"line":"bar"):"kpi",metric,total,method,records:selected.length};
}
export function resultCSV(groups){return "Group,Value\r\n"+groups.map(r=>'"'+String(r.name).replace(/"/g,'""')+'",'+r.value).join("\r\n")}
