/** Polar-inspired finance calculations: standalone, deterministic, demo-only. */
export const channels=["Paid Social","Paid Search","Email","Organic"];
export const dimensions={channel:"Marketing channel",month:"Month",week:"Week"};
export const measureLabels={net:"Net revenue",gross:"Gross sales",profit:"Modeled net profit",contribution:"Contribution profit",ads:"Ad spend",orders:"Orders",margin:"Profit margin",aov:"Average order value",cogs:"COGS"};
export const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
export const pct=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(n)+"%";
const required=["gross","discount","refund","cogs","shipping","fees","ads","overhead","orders"];
const z=s=>Number.isFinite(Number(s))?Number(s):0;
function ymd(d){return d.toISOString().slice(0,10)}
export function demoRows(){
 const rows=[];const start=Date.UTC(2025,10,1);
 for(let i=0;i<365;i++){const d=new Date(start+i*86400000),channel=channels[i%4],weekly=[.91,.94,1.01,1.06,1.15,1.23,1.11][i%7],season=1+.17*Math.sin(i/23),orders=Math.round((37+i*.065)*weekly*season),gross=Math.round(orders*(83+Math.sin(i/9)*7)),discount=Math.round(gross*.042),refund=Math.round(gross*(.021+(i%17===0?.035:0))),cogs=Math.round(gross*.36),shipping=Math.round(orders*5.7),fees=Math.round(gross*.028),ads=channel==="Organic"?0:Math.round(gross*(channel==="Email"?.035:.20)),overhead=Math.round(gross*.07);rows.push({date:ymd(d),channel,orders,gross,discount,refund,cogs,shipping,fees,ads,overhead})}
 return rows;
}
export function summarize(rows,extraRate=0){
 if(!Number.isFinite(Number(extraRate))||Number(extraRate)<0||Number(extraRate)>100)throw Error("Invalid cost scenario percent");
 const s=Object.fromEntries(required.map(k=>[k,0]));
 for(const row of rows)for(const k of required)s[k]+=z(row[k]);
 s.net=s.gross-s.discount-s.refund;s.grossProfit=s.net-s.cogs;s.contribution=s.grossProfit-s.shipping-s.fees-s.ads;
 s.extra=s.net*Number(extraRate)/100;s.profit=s.contribution-s.overhead-s.extra;s.margin=s.net?s.profit/s.net*100:0;
 s.aov=s.orders?s.net/s.orders:0;s.mer=s.ads?s.net/s.ads:0;
 return s;
}
export function selectPeriod(rows,days=30,channel="All channels"){
 if(!Number.isInteger(days)||days<1)throw Error("Invalid period");
 const filtered=rows.filter(r=>channel==="All channels"||r.channel===channel).sort((a,b)=>a.date.localeCompare(b.date));
 const dates=[...new Set(rows.map(r=>r.date))].sort();
 const currentDates=new Set(dates.slice(-days)),previousDates=new Set(dates.slice(-days*2,-days));
 return {current:filtered.filter(r=>currentDates.has(r.date)),previous:filtered.filter(r=>previousDates.has(r.date)),from:[...currentDates][0]||"",to:dates.at(-1)||""};
}
function weekLabel(date){
 const d=new Date(date+"T00:00:00Z"),day=d.getUTCDay();d.setUTCDate(d.getUTCDate()-((day+6)%7));
 return ymd(d);
}
export function groupBy(rows,dimension="channel",extraRate=0){
 if(!["channel","month","week","day"].includes(dimension))throw Error("Unsupported report breakdown");
 const groups=new Map();
 for(const r of rows){const name=dimension==="month"?r.date.slice(0,7):dimension==="week"?weekLabel(r.date):dimension==="day"?r.date:r.channel;
  if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r)}
 return [...groups].map(([name,r])=>({name,...summarize(r,extraRate)})).sort((a,b)=>dimension==="channel"?b.net-a.net:a.name.localeCompare(b.name));
}
export function comparison(current,previous,metric="net"){
 const a=z(current[metric]),b=z(previous[metric]);return b===0?null:(a-b)/Math.abs(b)*100;
}
export function insights(current,previous,channelGroups){
 const growth=comparison(current,previous,"net"),out=[];
 out.push({title:"Revenue momentum",value:growth===null?"No baseline":(growth>0?"+":"")+pct(growth),detail:growth===null?"A previous comparable period is not available.":"Change against the immediately preceding period."});
 out.push({title:"Modeled profit margin",value:pct(current.margin),detail:"Net profit divided by net revenue, using demo cost assumptions."});
 const top=[...channelGroups].filter(g=>g.profit>0).sort((a,b)=>b.profit-a.profit)[0];
 if(top)out.push({title:"Best profitable channel",value:top.name,detail:money(top.profit)+" in modeled profit; an observational ranking only."});
 else out.push({title:"Channel risk",value:"No profitable channel",detail:"No channel has positive modeled profit in this selection."});
 return out;
}
const safeCSV=v=>{let s=String(v??"");if(typeof v==="string"&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
export function csvReport(groups,fields=["name","gross","net","cogs","ads","overhead","extra","profit","margin","orders"]){
 const allowed=["name",...required,"net","grossProfit","contribution","extra","profit","margin","aov","mer"];
 if(!fields.every(f=>allowed.includes(f)))throw Error("Unsupported report export field");
 return [fields.map(safeCSV).join(","),...groups.map(r=>fields.map(k=>safeCSV(r[k])).join(","))].join("\r\n");
}
