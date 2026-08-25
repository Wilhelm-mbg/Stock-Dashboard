'use strict';
/* Positionsweise Luecke + Querschnitts-Residuum. Voller Durchlauf. */
var fs=require('fs'), path=require('path');
var intervall=process.argv[2]||'60m';
var limit=parseInt(process.argv[3]||'0',10);
var VORLAUF=parseInt(process.argv[4]||'261',10);
var dir='E:/Markt-Dashboard-Archiv/archiv'+intervall;
var dateien=fs.readdirSync(dir).filter(f=>f.indexOf('bars_'+intervall+'_')===0);
if(limit>0) dateien=dateien.slice(0,limit);
function reiheKaputt(bars){var maxKurs=0;for(var i=0;i<bars.length;i++){var c=bars[i][1];if(c>maxKurs)maxKurs=c;if(i>0){var v=bars[i-1][1];if(v>0&&c>0){var r=c/v-1;if(r>4||r<-0.8)return 1;}}}if(maxKurs>100000)return 1;return 0;}
/* Stempel: NUR die letzte Kerze der Reihe, wenn sie o=h=l=c und Volumen 0 hat.
 * (Auf 1d ist o=h=l=c mit Volumen 0 auch ein echter Handelsstillstand - deshalb
 * nicht pauschal ueber die ganze Reihe filtern.) */
var perPos={};   // pos -> {n,sum,sq,bit,ohneOpen, tage:{tag:[sum,n]}}
var zell={};     // pos -> tag -> [sum,n]  (fuer Querschnittsmittel)
var roh=[];      // pos6-Faelle fuer Residuum: {pos,tag,g}
var sammlePos=parseInt(process.argv[5]||'6',10);
var verworfenKaputt=0, verworfenKurz=0, symbole=0, letzteStempel=0;
dateien.forEach(function(f){
  var j; try{ j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); }catch(e){ verworfenKurz++; return; }
  if(!j||!Array.isArray(j.series)||j.series.length<VORLAUF+3){ verworfenKurz++; return; }
  var b=j.series;
  if(reiheKaputt(b)){ verworfenKaputt++; return; }
  var ende=b.length;
  var lb=b[ende-1];
  if((lb[2]===0||lb[2]==null)&&lb[3]===lb[1]&&lb[4]===lb[1]&&lb.length>5&&lb[5]===lb[1]){ende--;letzteStempel++;}
  symbole++;
  var POS=new Int16Array(ende), letzter=null, k=0;
  for(var i=0;i<ende;i++){var d=new Date(b[i][0]);var tag=d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
    if(tag!==letzter){letzter=tag;k=0;}else{k++;} POS[i]=k;}
  for(var i=VORLAUF;i<ende-1;i++){
    var c=b[i][1];
    if(!(c>0)) continue;
    var p=POS[i];
    var z=perPos[p]||(perPos[p]={n:0,sum:0,sq:0,bit:0,ohneOpen:0,tage:{}});
    var hatO=(b[i+1].length>5&&typeof b[i+1][5]==='number'&&isFinite(b[i+1][5])&&b[i+1][5]>0);
    if(!hatO){ z.ohneOpen++; continue; }
    var o=b[i+1][5];
    var g=o/c-1;
    if(!isFinite(g)) continue;
    z.n++; z.sum+=g; z.sq+=g*g; if(o===c) z.bit++;
    var tg=new Date(b[i][0]).toISOString().slice(0,10);
    var t=z.tage[tg]||(z.tage[tg]=[0,0]); t[0]+=g; t[1]++;
    if(p===sammlePos){ var zz=zell[tg]||(zell[tg]=[0,0]); zz[0]+=g; zz[1]++; roh.push([tg,g]); }
  }
});
var out={intervall:intervall,symbole:symbole,verworfenKaputt:verworfenKaputt,verworfenKurz:verworfenKurz,
  letzteKerzeStempel:letzteStempel,vorlauf:VORLAUF,positionen:{}};
Object.keys(perPos).sort((a,b)=>a-b).forEach(function(p){
  var z=perPos[p];
  if(!z.n) return;
  var mu=z.sum/z.n, va=(z.sq-z.n*mu*mu)/(z.n-1), sd=Math.sqrt(va);
  var tage=Object.keys(z.tage);
  var tm=tage.map(t=>z.tage[t][0]/z.tage[t][1]);
  var n=tm.length, m2=tm.reduce((a,b)=>a+b,0)/n;
  var v2=tm.reduce((a,b)=>a+(b-m2)*(b-m2),0)/(n-1), sd2=Math.sqrt(v2);
  var se=sd2/Math.sqrt(n);
  out.positionen[p]={faelle:z.n, ohneOpen:z.ohneOpen, mittelPp:+(mu*100).toFixed(6), sdPp:+(sd*100).toFixed(4),
    bitgenauAnteil:+(z.bit/z.n).toFixed(4), tage:n, symboleJeTag:+(z.n/n).toFixed(1),
    tagesmittelPp:+(m2*100).toFixed(6), sdTagesmittelPp:+(sd2*100).toFixed(4),
    sePp:+(se*100).toFixed(6), t:+(m2/se).toFixed(2), mdePp:+(2*se*100).toFixed(5),
    delta80Pp:+((1.959964+0.8416212)*se*100).toFixed(5)};
});
/* Querschnitts-Residuum an der gesammelten Position */
if(roh.length){
  var s=0,q=0,n=0;
  roh.forEach(function(r){ var z=zell[r[0]]; if(!z||z[1]<5) return; var m=z[0]/z[1]; var e=r[1]-m; s+=e; q+=e*e; n++; });
  var mu=s/n, sd=Math.sqrt((q-n*mu*mu)/(n-1));
  out.querschnittResiduum={position:sammlePos, faelle:n, mittelPp:+(mu*100).toFixed(6), sdPp:+(sd*100).toFixed(4)};
}
console.log(JSON.stringify(out,null,1));
