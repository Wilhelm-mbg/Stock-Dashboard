var fs=require('fs'),Q=require('../../../quant.js');
var S='C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var tot=0,first=0,raster=0,m390=0,wknd=0,stempel=0,sigAufStempel=0,sigAn390=0;
['AAPL','MSFT','NVDA'].forEach(function(sym){
 var b=JSON.parse(fs.readFileSync(S+'bars_5m_'+sym+'.json','utf8')).series;
 b.forEach(function(x){ var d=new Date(x[0]); if(d.getUTCDay()===0||d.getUTCDay()===6)wknd++; if(x[0]%300000!==0)raster++; if(Q.minutenSeitOeffnung(x[0])>=390)m390++; if(x[2]===0&&x[3]===x[4])stempel++; });
 for(var i=29;i<b.length;i++){ var s=Q.donchianSignal(b.slice(i-29,i+1),20,15).signal; if(!s)continue; tot++;
   var m=Q.minutenSeitOeffnung(b[i][0]); if(m<5)first++; if(b[i][0]%300000!==0)sigAufStempel++; if(m>=390)sigAn390++; }
});
console.log(JSON.stringify({signale:tot,ersteKerze:first,anteil:(first/tot).toFixed(3),barsAusserRaster:raster,barsM390:m390,wochenende:wknd,stempelBars:stempel,sigAufStempel:sigAufStempel,sigAn390:sigAn390}));
