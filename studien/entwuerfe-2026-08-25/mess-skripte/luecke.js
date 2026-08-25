'use strict';
var fs=require('fs'), path=require('path');
var intervall=process.argv[2]||'60m';
var limit=parseInt(process.argv[3]||'0',10);
var VORLAUF=parseInt(process.argv[4]||'261',10);
var dir='E:/Markt-Dashboard-Archiv/archiv'+intervall;
var dateien=fs.readdirSync(dir).filter(f=>f.indexOf('bars_'+intervall+'_')===0);
if(limit>0) dateien=dateien.slice(0,limit);
function reiheKaputt(bars){var maxKurs=0;for(var i=0;i<bars.length;i++){var c=bars[i][1];if(c>maxKurs)maxKurs=c;if(i>0){var v=bars[i-1][1];if(v>0&&c>0){var r=c/v-1;if(r>4||r<-0.8)return 1;}}}if(maxKurs>100000)return 1;return 0;}
function istStempel(b){return (b[2]===0||b[2]==null)&&b[3]===b[1]&&b[4]===b[1]&&b.length>5&&b[5]===b[1];}
var perPos={};   // pos -> {n,sum,sq,bit, tage:{tag:[sum,n]}}
var verworfen=0, symbole=0, stempelUeber=0;
dateien.forEach(function(f){
  var j; try{ j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); }catch(e){ verworfen++; return; }
  if(!j||!Array.isArray(j.series)||j.series.length<VORLAUF+3){ verworfen++; return; }
  var b=j.series;
  if(reiheKaputt(b)){ verworfen++; return; }
  symbole++;
  // Sitzungsposition
  var POS=new Int16Array(b.length), letzter=null, k=0;
  for(var i=0;i<b.length;i++){var d=new Date(b[i][0]);var tag=d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
    if(tag!==letzter){letzter=tag;k=0;}else{k++;} POS[i]=k;}
  for(var i=VORLAUF;i<b.length-1;i++){
    if(istStempel(b[i])||istStempel(b[i+1])){stempelUeber++;continue;}
    var c=b[i][1], o=(b[i+1].length>5&&b[i+1][5]>0)?b[i+1][5]:null;
    if(!(c>0)||o==null) continue;
    var g=o/c-1;
    if(!isFinite(g)) continue;
    var p=POS[i];
    var z=perPos[p]||(perPos[p]={n:0,sum:0,sq:0,bit:0,tage:{}});
    z.n++; z.sum+=g; z.sq+=g*g; if(o===c) z.bit++;
    var tg=new Date(b[i][0]).toISOString().slice(0,10);
    var t=z.tage[tg]||(z.tage[tg]=[0,0]); t[0]+=g; t[1]++;
  }
});
var out={intervall:intervall,symbole:symbole,verworfen:verworfen,stempelUebersprungen:stempelUeber,vorlauf:VORLAUF,positionen:{}};
Object.keys(perPos).sort((a,b)=>a-b).forEach(function(p){
  var z=perPos[p];
  var mu=z.sum/z.n, va=(z.sq-z.n*mu*mu)/(z.n-1), sd=Math.sqrt(va);
  var tage=Object.keys(z.tage);
  var tm=tage.map(t=>z.tage[t][0]/z.tage[t][1]);
  var n=tm.length, m2=tm.reduce((a,b)=>a+b,0)/n;
  var v2=tm.reduce((a,b)=>a+(b-m2)*(b-m2),0)/(n-1), sd2=Math.sqrt(v2);
  var se=sd2/Math.sqrt(n);
  var jeTag=z.n/n;
  out.positionen[p]={faelle:z.n, mittelPp:mu*100, sdPp:sd*100, bitgenauAnteil:z.bit/z.n,
    tage:n, signaleJeTag:jeTag, tagesmittelPp:m2*100, sdTagesmittelPp:sd2*100,
    sePp:se*100, t:m2/se, mdePp:2*se*100, delta80Pp:(1.959964+0.8416212)*se*100};
});
console.log(JSON.stringify(out,null,1));
