const fs=require('fs');
const ST='C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
const j=JSON.parse(fs.readFileSync(ST+'bars_1m_AAPL.json','utf8'));
// Bars außerhalb 13:30-20:00 UTC? und Bars mit Laenge != 5 (Quelle-Marker)
let outside=0, len={}; const hours={};
for (const b of j.series){ len[b.length]=(len[b.length]||0)+1; const m=new Date(b[0]).getUTCHours()*60+new Date(b[0]).getUTCMinutes(); if(m<810||m>=1200) outside++; }
console.log('ausserhalb Sitzung:',outside,'Laengen:',JSON.stringify(len));
console.log('Beispiel Bar mit 6 Feldern:', JSON.stringify(j.series.find(b=>b.length>5)));
