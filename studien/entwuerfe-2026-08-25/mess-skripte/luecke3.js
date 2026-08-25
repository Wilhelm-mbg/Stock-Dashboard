'use strict';
/* Schichtung nach TAGESLETZTER KERZE statt nach Position 6. */
var fs=require('fs'), path=require('path');
var intervall=process.argv[2]||'60m';
var limit=parseInt(process.argv[3]||'0',10);
var VORLAUF=parseInt(process.argv[4]||'261',10);
var dir='E:/Markt-Dashboard-Archiv/archiv'+intervall;
var dateien=fs.readdirSync(dir).filter(f=>f.indexOf('bars_'+intervall+'_')===0);
if(limit>0) dateien=dateien.slice(0,limit);
function reiheKaputt(bars){var maxKurs=0;for(var i=0;i<bars.length;i++){var c=bars[i][1];if(c>maxKurs)maxKurs=c;if(i>0){var v=bars[i-1][1];if(v>0&&c>0){var r=c/v-1;if(r>4||r<-0.8)return 1;}}}if(maxKurs>100000)return 1;return 0;}
var G={};  // schluessel -> stats
var kerzenProTag={}; // Zahl der Kerzen je (sym,tag) -> Histogramm
var zellQ={};        // schluessel -> tag -> [sum,n]
var rohQ={};         // schluessel -> [[tag,g]]
var symbole=0, ohneOpen=0, stempel=0, kaputt=0, kurz=0;
function add(k,tg,g,bit){
  var z=G[k]||(G[k]={n:0,sum:0,sq:0,bit:0,tage:{}});
  z.n++; z.sum+=g; z.sq+=g*g; if(bit)z.bit++;
  var t=z.tage[tg]||(z.tage[tg]=[0,0]); t[0]+=g; t[1]++;
  var zq=zellQ[k]||(zellQ[k]={}); var c=zq[tg]||(zq[tg]=[0,0]); c[0]+=g; c[1]++;
  (rohQ[k]||(rohQ[k]=[])).push([tg,g]);
}
dateien.forEach(function(f){
  var j; try{ j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); }catch(e){ kurz++; return; }
  if(!j||!Array.isArray(j.series)||j.series.length<VORLAUF+3){ kurz++; return; }
  var b=j.series;
  if(reiheKaputt(b)){ kaputt++; return; }
  var ende=b.length, lb=b[ende-1];
  if((lb[2]===0||lb[2]==null)&&lb[3]===lb[1]&&lb[4]===lb[1]&&lb.length>5&&lb[5]===lb[1]){ende--;stempel++;}
  symbole++;
  var POS=new Int16Array(ende), letzter=null, k=0, proTag=[];
  for(var i=0;i<ende;i++){var d=new Date(b[i][0]);var tag=d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
    if(tag!==letzter){letzter=tag;k=0;proTag.push(1);}else{k++;proTag[proTag.length-1]++;} POS[i]=k;}
  proTag.forEach(function(c){kerzenProTag[c]=(kerzenProTag[c]||0)+1;});
  for(var i=VORLAUF;i<ende-1;i++){
    var c=b[i][1]; if(!(c>0)) continue;
    var hatO=(b[i+1].length>5&&typeof b[i+1][5]==='number'&&isFinite(b[i+1][5])&&b[i+1][5]>0);
    if(!hatO){ ohneOpen++; continue; }
    var o=b[i+1][5], g=o/c-1; if(!isFinite(g)) continue;
    var letzteDesTages = (POS[i+1]===0);
    var tg=new Date(b[i][0]).toISOString().slice(0,10);
    add(letzteDesTages?'GRENZE':'INNEN', tg, g, o===c);
    add(letzteDesTages?('GRENZE_P'+POS[i]):('INNEN_P'+POS[i]), tg, g, o===c);
  }
});
function stat(k){
  var z=G[k]; if(!z) return null;
  var mu=z.sum/z.n, sd=Math.sqrt((z.sq-z.n*mu*mu)/(z.n-1));
  var tage=Object.keys(z.tage), tm=tage.map(t=>z.tage[t][0]/z.tage[t][1]);
  var n=tm.length, m2=tm.reduce((a,b)=>a+b,0)/n, sd2=Math.sqrt(tm.reduce((a,b)=>a+(b-m2)*(b-m2),0)/(n-1));
  var se=sd2/Math.sqrt(n);
  // Querschnittsresiduum
  var s=0,q=0,nr=0; (rohQ[k]||[]).forEach(function(r){var c=zellQ[k][r[0]]; if(!c||c[1]<5)return; var e=r[1]-c[0]/c[1]; s+=e;q+=e*e;nr++;});
  var muR=nr?s/nr:null, sdR=nr>1?Math.sqrt((q-nr*muR*muR)/(nr-1)):null;
  return {faelle:z.n, mittelPp:+(mu*100).toFixed(6), sdPp:+(sd*100).toFixed(4), bitgenau:+(z.bit/z.n).toFixed(4),
    tage:n, jeTag:+(z.n/n).toFixed(1), tagesmittelPp:+(m2*100).toFixed(6), sdTagesmittelPp:+(sd2*100).toFixed(4),
    sePp:+(se*100).toFixed(6), t:+(m2/se).toFixed(2), mdePp:+(2*se*100).toFixed(5), delta80Pp:+(2.8016*se*100).toFixed(5),
    qsResiduumSdPp: sdR!=null?+(sdR*100).toFixed(4):null};
}
var out={intervall:intervall,symbole:symbole,kaputt:kaputt,kurz:kurz,letzteKerzeStempel:stempel,ohneOpen:ohneOpen,
  kerzenProTagHistogramm:kerzenProTag, schichten:{}};
Object.keys(G).sort().forEach(function(k){ out.schichten[k]=stat(k); });
console.log(JSON.stringify(out,null,1));
