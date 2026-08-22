var fs=require('fs');var Q=require('../../../quant.js');
var bars=JSON.parse(fs.readFileSync('C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/bars_60m_AAPL.json','utf8')).series.slice(-800);
var st=bars.filter(function(b){return b[0]%60000!==0;});
console.log('slice(-800): Stempel-Kerzen',st.length, st.map(function(b){return new Date(b[0]).toISOString().slice(5,19)+' v='+b[2]+' H=L=C:'+(b[3]===b[4]&&b[4]===b[1]);}).join(' | '));
['2026-08-21T16:35:00Z','2026-08-21T17:35:00Z','2026-08-21T18:35:00Z','2026-08-21T19:35:00Z','2026-08-21T20:20:00Z'].forEach(function(t){
  var now=Date.parse(t); var sb=Q.fertigeBars(bars,60,now); var l=sb[sb.length-1];
  var s=Q.einstiegSignal(sb,sb.length-1,{ENTRY:'kapitulation',LINE:'ema',period:20,confirmBps:15,ZTHR:2.0,MINQ:0,CHAN:false,MTF:false,TREND:false});
  // Volumenschnitt der 50 Vorkerzen mit/ohne Stempel
  var w=sb.slice(-51,-1); var n0=w.filter(function(b){return !b[2];}).length;
  console.log('now',t.slice(5,16),'letzte fertige Kerze',new Date(l[0]).toISOString().slice(5,19),'vol',l[2],'-> Volumenbedingung moeglich:',l[2]>0,'| Nullvolumen-Kerzen im 50er-Schnitt:',n0,'| signal',JSON.stringify(s));
});
