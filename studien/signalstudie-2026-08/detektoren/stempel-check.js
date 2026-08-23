var fs=require('fs');var S='C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
['AAPL','NVDA','TSLA'].forEach(function(sym){['60m','15m','1m'].forEach(function(iv){
 var f=S+'bars_'+iv+'_'+sym+'.json'; if(!fs.existsSync(f)){console.log(sym,iv,'fehlt');return;}
 var j=JSON.parse(fs.readFileSync(f,'utf8')); var b=j.series; var st=b.filter(function(x){return x[0]%60000!==0;});
 var last=b.slice(-8).map(function(x){return new Date(x[0]).toISOString().slice(5,19)+'/v'+x[2];});
 console.log(sym,iv,'n',b.length,'stempel',st.length,'fetchedAt',j.fetchedAt?new Date(j.fetchedAt).toISOString():'-','letzte',last.join(' '));
});});
