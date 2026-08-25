'use strict';
var fs=require('fs'), path=require('path');
var intervall=process.argv[2]||'60m';
var dir='E:/Markt-Dashboard-Archiv/archiv'+intervall;
var limit=parseInt(process.argv[3]||'0',10);
var dateien=fs.readdirSync(dir).filter(f=>f.indexOf('bars_'+intervall+'_')===0);
if(limit>0) dateien=dateien.slice(0,limit);
var nDat=0, nKerzen=0, mitOpen=0, ohneOpen=0;
var posHist={}, tageProSym=[];
var minMs=Infinity,maxMs=-Infinity;
var stempel=0, symMitStempel=0;
var tageSatz=new Set();
var kaputt=0;
function reiheKaputt(bars){var maxKurs=0;for(var i=0;i<bars.length;i++){var c=bars[i][1];if(c>maxKurs)maxKurs=c;if(i>0){var v=bars[i-1][1];if(v>0&&c>0){var r=c/v-1;if(r>4||r<-0.8)return 1;}}}if(maxKurs>100000)return 1;return 0;}
dateien.forEach(function(f){
  var j; try{ j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); }catch(e){ return; }
  if(!j||!Array.isArray(j.series)||!j.series.length) return;
  var b=j.series; nDat++;
  if(reiheKaputt(b)) kaputt++;
  nKerzen+=b.length;
  if(b[0][0]<minMs)minMs=b[0][0];
  if(b[b.length-1][0]>maxMs)maxMs=b[b.length-1][0];
  var letzter=null,k=0,tage=0, hatStempel=0;
  for(var i=0;i<b.length;i++){
    var bb=b[i];
    if(bb.length>5&&typeof bb[5]==='number'&&isFinite(bb[5])&&bb[5]>0) mitOpen++; else ohneOpen++;
    var d=new Date(bb[0]);
    var tag=d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
    if(tag!==letzter){letzter=tag;k=0;tage++;tageSatz.add(tag);}else{k++;}
    posHist[k]=(posHist[k]||0)+1;
    if((bb[2]===0||bb[2]==null)&&bb[3]===bb[1]&&bb[4]===bb[1]&&bb[5]===bb[1]){stempel++;hatStempel=1;}
  }
  if(hatStempel)symMitStempel++;
  tageProSym.push(tage);
});
tageProSym.sort((a,b)=>a-b);
console.log(JSON.stringify({intervall:intervall,dateien:dateien.length,gelesen:nDat,kaputteReihen:kaputt,kerzen:nKerzen,
  mitOpen:mitOpen,ohneOpen:ohneOpen,anteilOpen:mitOpen/(mitOpen+ohneOpen),
  von:new Date(minMs).toISOString(),bis:new Date(maxMs).toISOString(),
  verschiedeneKalendertage:tageSatz.size,
  tageProSymMedian:tageProSym[Math.floor(tageProSym.length/2)],
  tageProSymMax:tageProSym[tageProSym.length-1],
  posHist:posHist, stempelKerzen:stempel, symbolMitStempel:symMitStempel},null,1));
