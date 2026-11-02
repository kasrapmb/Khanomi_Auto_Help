
import {analyze,demoData,loadCSV,format,resultCSV} from "./analytics.js";
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let rows=demoData(),datasetName="Retail Sales · Demo",history=[],lastResult=null,view="chart";
const examples=["Total revenue by region","Monthly sales trend","Top 5 products by revenue","Profit by category","Why did revenue change?","Orders by channel"];
const toCSV=()=>"date,region,category,product,channel,revenue,profit,orders,quantity\n"+rows.map(r=>[r.date,r.region,r.category,r.product,r.channel,r.revenue,r.profit??"",r.orders,r.quantity].map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(",")).join("\n");
function download(name,content){const blob=new Blob([content],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
const axisValue=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(0)+"k":Math.round(n).toString();
function chartHTML(result){
 if(result.chart==="kpi")return '<div class="total-result"><span>Calculated from selected dataset</span><strong>'+escape(format(result.total,result.metric))+'</strong></div>';
 const values=result.groups;
 if(!values.length)return '<div class="empty-chart">No group results.</div>';
 const W=760,H=320,left=65,right=26,top=23,bottom=65;
 const max=Math.max(...values.map(d=>d.value),1)*1.16;
 const ymin=Math.min(0,...values.map(d=>d.value));
 const maxY=max>ymin?max:ymin+1;
 const y=value=>top+(maxY-value)/(maxY-ymin)*(H-top-bottom);
 const graphH=H-top-bottom,graphW=W-left-right;
 const grid=[0,1,2,3,4].map(i=>{const v=ymin+(maxY-ymin)*i/4,yp=y(v);return '<line x1="'+left+'" x2="'+(W-right)+'" y1="'+yp+'" y2="'+yp+'" stroke="#e9edf3"/><text x="'+(left-14)+'" y="'+(yp+4)+'" text-anchor="end" class="axis-label">'+escape(axisValue(v))+'</text>'}).join("");
 const showEvery=Math.max(1,Math.ceil(values.length/10));
 const xlabels=values.map((d,i)=>{if(i%showEvery!==0&&i!==values.length-1)return "";const x=left+graphW*(i+.5)/values.length;const label=d.name.length>13?d.name.slice(0,12)+"…":d.name;return '<text x="'+x+'" y="'+(H-bottom+18)+'" text-anchor="middle" class="axis-label">'+escape(label)+'</text>'}).join("");
 let marks="";
 if(result.chart==="bar"){
  const gap=graphW/values.length,width=Math.min(48,gap*.68);
  marks=values.map((d,i)=>{const x=left+gap*i+(gap-width)/2,yp=y(Math.max(d.value,0)),height=Math.max(1,Math.abs(y(d.value)-y(0)));return '<rect x="'+x+'" y="'+yp+'" width="'+width+'" height="'+height+'" rx="5" fill="#577ce8"><title>'+escape(d.name)+": "+escape(format(d.value,result.metric))+'</title></rect>'}).join("");
 }else{
  const points=values.map((d,i)=>[left+graphW*(i+.5)/values.length,y(d.value)]);
  marks='<polyline points="'+points.map(p=>p.join(",")).join(" ")+'" fill="none" stroke="#547be9" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
  marks+=points.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" stroke="#fff" stroke-width="2" fill="#547be9"><title>'+escape(values[i].name)+": "+escape(format(values[i].value,result.metric))+'</title></circle>').join("");
 }
 return '<div class="chart-shell"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+escape(result.title)+' chart">'+grid+marks+xlabels+'</svg></div>';
}
function dataTable(groups,metric){return '<div class="table-scroll"><table><thead><tr><th>Dimension</th><th>'+escape(metric[0].toUpperCase()+metric.slice(1))+'</th></tr></thead><tbody>'+groups.map(r=>'<tr><td>'+escape(r.name)+'</td><td>'+escape(format(r.value,metric))+'</td></tr>').join("")+'</tbody></table></div>'}
function renderAnswer(result,question){
 const holder=$("messages");
 const bubble=document.createElement("article");bubble.className="question-message";bubble.innerHTML='<div class="user-avatar">Y</div><div><div class="message-author">You <span>just now</span></div><p>'+escape(question)+'</p></div>';holder.appendChild(bubble);
 const card=document.createElement("article");card.className="answer-message";
 const allFilters=Object.entries(result.query?.filter??{}).map(([k,v])=>'<span class="token">'+escape(k)+" = "+escape(v)+'</span>').join("");
 if(result.error){card.innerHTML='<div class="agent-head"><span class="agent-avatar">✦</span><strong>Analyst</strong></div><div class="error-answer">'+escape(result.error)+'</div>';holder.appendChild(card);card.scrollIntoView({block:"nearest",behavior:"smooth"});return}
 card.innerHTML='<div class="agent-head"><span class="agent-avatar">✦</span><strong>Analyst</strong><span class="answer-note">Computed from your data</span></div>'+
 '<div class="answer-body"><h3>'+escape(result.title)+'</h3><p class="answer-summary">'+escape(result.summary)+'</p>'+
 '<div class="tokens"><span class="token">'+escape(result.metric)+'</span>'+(result.query.dimension?'<span class="token">by '+escape(result.query.dimension)+'</span>':"")+allFilters+'</div>'+
 '<div class="result-panel"><div class="result-toolbar"><strong>Result</strong><div><button data-role="chart" class="result-tab '+(view==="chart"?"active":"")+'">Chart</button><button data-role="table" class="result-tab '+(view==="table"?"active":"")+'">Table</button><button data-role="export" class="small-action">↓ CSV</button></div></div><div class="result-display">'+(view==="chart"?chartHTML(result):dataTable(result.groups,result.metric))+'</div></div>'+
 (result.description?'<div class="insight"><span>✦ Insight</span><p>'+escape(result.description)+'</p></div>':"")+
 '<details class="method"><summary>How this answer was calculated</summary><p>'+escape(result.method)+'</p><p>No remote AI model or external data was used. Results come from deterministic aggregations of the current dataset.</p></details>'+
 '<div class="answer-actions"><button data-role="followup">Ask a follow-up</button><button data-role="save">Save answer</button></div></div>';
 holder.appendChild(card);
 function display(type){view=type;card.querySelector(".result-display").innerHTML=type==="chart"?chartHTML(result):dataTable(result.groups,result.metric);card.querySelectorAll(".result-tab").forEach(b=>b.classList.toggle("active",b.dataset.role===type))}
 card.querySelector('[data-role="chart"]').onclick=()=>display("chart");
 card.querySelector('[data-role="table"]').onclick=()=>display("table");
 card.querySelector('[data-role="export"]').onclick=()=>download("thoughtspot-analysis.csv",resultCSV(result.groups));
 card.querySelector('[data-role="followup"]').onclick=()=>{$("question").value="";$("question").focus();$("hint").textContent="Try another breakdown (e.g. revenue by category). Each question is recalculated on the active dataset."};
 card.querySelector('[data-role="save"]').onclick=()=>{const saved=JSON.parse(localStorage.getItem("insightlab-saved")||"[]");saved.unshift({question,title:result.title,summary:result.summary,at:new Date().toISOString()});localStorage.setItem("insightlab-saved",JSON.stringify(saved.slice(0,30)));showToast("Answer saved in this browser")};
 card.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function ask(question){const q=String(question||"").trim();if(!q)return;let interpreted=q;const prior=lastResult?.query;if(prior&&/^(and\b|what about\b|also\b|by\b|همچنین|حالا)/i.test(q)){if(!/(revenue|sales|profit|orders?|quantity|units|فروش|درآمد|سود|سفارش)/i.test(q))interpreted=prior.metric+" "+interpreted;if(prior.dimension&&!/(region|category|product|channel|month|year|trend|منطقه|دسته|محصول|کانال|ماه|سال|روند)/i.test(q))interpreted+=" by "+prior.dimension;}const result=analyze(rows,interpreted);lastResult=result;renderAnswer(result,q);history.push(q);$("question").value="";$("welcome").hidden=true;$("hint").textContent="Results are computed locally; use Chart / Table or export CSV."+ (interpreted!==q?" Follow-up interpreted as: "+interpreted:"")}
function refreshMeta(){ $("dataset-title").textContent=datasetName;$("dataset-status").textContent=rows.length.toLocaleString()+" rows · local";$("data-badge").textContent=datasetName; }
function resetConversation(){$("messages").innerHTML="";history=[];lastResult=null;$("welcome").hidden=false;$("hint").textContent="Supported: revenue, profit, orders, quantity, region, product, category, channel, monthly, yearly and why changes."}
$("question-form").addEventListener("submit",e=>{e.preventDefault();ask($("question").value)});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("question").focus();}if(e.key==="Escape")$("saved-panel").hidden=true});
$("question").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask($("question").value)}});
document.querySelectorAll("[data-example]").forEach(btn=>btn.addEventListener("click",()=>ask(btn.dataset.example)));
$("new-chat").addEventListener("click",resetConversation);
$("upload-trigger").onclick=()=>$("file").click();
$("file").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5e6)throw Error("CSV larger than 5 MB; choose a smaller file");const parsed=loadCSV(await f.text());rows=parsed.rows;datasetName=f.name;resetConversation();refreshMeta();showToast("Loaded "+rows.length+" rows"+(parsed.skipped?" (skipped "+parsed.skipped+" invalid rows)":""))}catch(err){showToast(err.message)}e.target.value=""});
$("demo-reset").onclick=()=>{rows=demoData();datasetName="Retail Sales · Demo";resetConversation();refreshMeta();showToast("Demo dataset restored")};
$("download-data").onclick=()=>download("retail-demo-data.csv",toCSV());
$("saved-toggle").onclick=()=>{const saved=JSON.parse(localStorage.getItem("insightlab-saved")||"[]");const panel=$("saved-panel");panel.hidden=!panel.hidden;panel.innerHTML='<h3>Saved answers</h3>'+(saved.length?saved.map(x=>'<div class="saved-item"><strong>'+escape(x.title)+'</strong><p>'+escape(x.question)+'</p><small>'+escape(x.at.slice(0,10))+'</small></div>').join(""):'<p class="muted">No answers saved yet.</p>')};

refreshMeta();
