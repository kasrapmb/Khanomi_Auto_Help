export function baseline(values) {
  if(values.length<2) throw new Error('At least two historical samples required');
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  const deviation=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
  return {mean,deviation};
}
export function detect(values, sensitivity=3) {
  return values.flatMap((actual,i)=>{
    if(i<24)return [];
    const {mean,deviation}=baseline(values.slice(i-24,i));
    const scale=Math.max(deviation, Math.abs(mean)*0.015,0.001);
    const score=Math.abs(actual-mean)/scale;
    return score>=sensitivity?[{index:i,actual,expected:mean,score,delta:(actual-mean)/mean*100,lower:mean-sensitivity*scale,upper:mean+sensitivity*scale}]:[];
  });
}
export const metrics=[
 {id:'revenue',name:'Revenue',unit:'$',base:12400,dimension:'US / paid search',event:49,factor:.54},
 {id:'checkout',name:'Checkout conversion',unit:'%',base:3.8,dimension:'US / mobile',event:49,factor:.56},
 {id:'latency',name:'API latency',unit:'ms',base:185,dimension:'checkout-service / us-east',event:49,factor:2.9},
 {id:'orders',name:'Orders',unit:'',base:286,dimension:'US / paid search',event:50,factor:.58},
 {id:'spend',name:'Ad spend',unit:'$',base:4200,dimension:'Meta / EU',event:57,factor:1.15},
 {id:'errors',name:'Payment errors',unit:'',base:19,dimension:'gateway-b / mobile',event:49,factor:4.1}
];
export function series(metric){return Array.from({length:72},(_,i)=>Math.max(.1,metric.base*(1+Math.sin(i*1.8)*.025+Math.cos(i*.7)*.018)*(i>=metric.event&&i<metric.event+4?metric.factor:1)));}
export function incidents(threshold=3){return metrics.map(m=>{const points=series(m),events=detect(points,threshold);const event=events.find(e=>e.index===m.event);return event?{...m,...event,points,severity:event.score>=10?'Critical':'Warning',id:m.id}:null;}).filter(Boolean).sort((a,b)=>b.score-a.score);}
export function related(selected,all){return all.filter(m=>m.id!==selected.id&&Math.abs(m.index-selected.index)<=2).map(m=>({...m,lag:m.index-selected.index}));}
export function csv(rows){return 'Metric,Segment,Severity,Actual,Expected,Deviation percent\n'+rows.map(r=>[r.name,r.dimension,r.severity,r.actual.toFixed(2),r.expected.toFixed(2),r.delta.toFixed(1)].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');}
