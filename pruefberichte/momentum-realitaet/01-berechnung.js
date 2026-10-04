const fs=require('fs');
const L=(t)=>{const r=JSON.parse(fs.readFileSync('c_'+t+'.json')).chart.result[0];const ts=r.timestamp;const adj=r.indicators.adjclose?r.indicators.adjclose[0].adjclose:r.indicators.quote[0].close;const cl=r.indicators.quote[0].close;const m=new Map();ts.forEach((x,i)=>{const d=new Date(x*1000).toISOString().slice(0,10);if(adj[i]!=null)m.set(d,{adj:adj[i],cl:cl[i]})});return {m,meta:r.meta,div:r.events&&r.events.dividends?Object.keys(r.events.dividends).length:0}};
const T=['SPY','QMOM','MTUM','SPMO','PDP','IUMO.L','QDVA.DE','IWMO.L','IS3R.DE','XDEM.DE','XDEM.SW','FTMO.L','FTGM.DE'];
const W={A:['2017-01-03','2021-09-15'],B:['2021-09-15','2026-09-15']};
const fx=L('EURUSD');
const out=[];const rows=[];
function win(S,a,b,key){ // base = close on a, end = close on b (exact dates must exist else nearest earlier)
 const ds=[...S.keys()].sort();const first=ds[0];
 if(first>a) {return null}
 const pick=d=>{let x=null;for(const k of ds){if(k<=d)x=k;else break}return x};
 const d0=pick(a),d1=pick(b);const v=ds.filter(k=>k>=d0&&k<=d1);
 let pk=-1,mdd=0,pkd,trd,mpk;for(const k of v){const p=S.get(k)[key];if(p>pk){pk=p;pkd=k}const dd=p/pk-1;if(dd<mdd){mdd=dd;trd=k;mpk=pkd}}
 return {d0,d1,n:v.length,tr:S.get(d1)[key]/S.get(d0)[key]-1,mdd,peak:mpk,trough:trd};
}
for(const t of T){let D;try{D=L(t)}catch(e){continue}
 const S=D.m;const first=[...S.keys()].sort()[0];
 for(const w of ['A','B']){const [a,b]=W[w];const r=win(S,a,b,'adj');const rp=win(S,a,b,'cl');
  const cur=D.meta.currency;
  rows.push({t,cur,first,div:D.div,w,...(r||{}),price_only:rp?rp.tr:null});}
}
// SPY in EUR
const spy=L('SPY').m;const eur=new Map();for(const [d,v] of spy){const f=fx.m.get(d);if(f)eur.set(d,{adj:v.adj/f.cl,cl:v.cl/f.cl})}
for(const w of ['A','B']){const [a,b]=W[w];const r=win(eur,a,b,'adj');rows.push({t:'SPY_in_EUR',cur:'EUR(umgerechnet)',first:'',div:0,w,...r,price_only:null})}
const fxr=w=>{const [a,b]=W[w];const p=d=>{let x;for(const k of [...fx.m.keys()].sort()){if(k<=d)x=k;else break}return fx.m.get(x).cl};return p(b)/p(a)-1};
rows.push({t:'EURUSD_Veraenderung',w:'A',tr:fxr('A')},{t:'EURUSD_Veraenderung',w:'B',tr:fxr('B')});
fs.writeFileSync('ergebnis.json',JSON.stringify(rows,null,1));
const csv=['ticker,waehrung,erster_kurstag_in_daten,dividendenereignisse_yahoo,fenster,basis_datum,end_datum,handelstage,gesamtertrag_adj_pct,nur_kurs_pct,max_drawdown_pct,dd_hoch,dd_tief'];
for(const r of rows){if(r.d0)csv.push([r.t,r.cur,r.first,r.div,r.w,r.d0,r.d1,r.n,(r.tr*100).toFixed(2),r.price_only==null?'':(r.price_only*100).toFixed(2),(r.mdd*100).toFixed(2),r.peak,r.trough].join(','));else console.log('no',r.t,r.w,r.tr)}
fs.writeFileSync('ergebnis.csv',csv.join('\n'));console.log(csv.join('\n'));console.log(rows.filter(r=>r.t=='EURUSD_Veraenderung'))
