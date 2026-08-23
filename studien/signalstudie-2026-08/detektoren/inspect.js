const fs=require('fs');
const ST='C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
for (const f of ['bars_5m_AAPL.json','bars_1m_AAPL.json','bars_15m_AAPL.json']) {
  let j; try { j=JSON.parse(fs.readFileSync(ST+f,'utf8')); } catch(e){ console.log(f,'FEHLT',e.message); continue; }
  console.log(f, 'keys', Object.keys(j), 'n', j.series.length, 'len0', j.series[0].length, 'sample', JSON.stringify(j.series[0]));
  // erster Bar je UTC-Tag
  const days={};
  for (const b of j.series){ const d=new Date(b[0]).toISOString().slice(0,10); if(!days[d]) days[d]={first:b[0],n:0,last:b[0]}; days[d].n++; days[d].last=b[0]; }
  const ks=Object.keys(days).sort();
  const cnt={};
  ks.forEach(d=>{ const hm=new Date(days[d].first).toISOString().slice(11,16); cnt[hm]=(cnt[hm]||0)+1; });
  console.log(' Tage',ks.length, ks[0],'..',ks[ks.length-1],' Erster-Bar-Uhrzeit (UTC) Verteilung:',JSON.stringify(cnt));
  // Tage deren erster Bar nicht 13:30 ist
  const odd=ks.filter(d=>!['13:30','14:30'].includes(new Date(days[d].first).toISOString().slice(11,16))).slice(0,8);
  console.log(' abweichende Tage:', odd.map(d=>d+'@'+new Date(days[d].first).toISOString().slice(11,16)+' n='+days[d].n+' last='+new Date(days[d].last).toISOString().slice(11,16)).join(', '));
  // Wochentage
  const wd={}; ks.forEach(d=>{const w=new Date(d).getUTCDay(); wd[w]=(wd[w]||0)+1;}); console.log(' Wochentage',JSON.stringify(wd));
}
