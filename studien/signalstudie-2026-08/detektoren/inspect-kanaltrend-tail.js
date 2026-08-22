var fs = require('fs');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
['60m','15m','5m'].forEach(function (IV) {
  ['AAPL','MSFT','NVDA'].forEach(function (sym) {
    var f = STORE + 'bars_' + IV + '_' + sym + '.json';
    if (!fs.existsSync(f)) { console.log(IV, sym, 'FEHLT'); return; }
    var d = JSON.parse(fs.readFileSync(f, 'utf8'));
    var b = d.series, n = b.length;
    var ivMs = { '60m': 3600000, '15m': 900000, '5m': 300000 }[IV];
    var stempel = [], stempelIdx = [];
    for (var i = 0; i < n; i++) {
      var x = b[i];
      var offRaster = (x[0] % 60000) !== 0;   // Sekunden != 0
      var vol0 = !x[2];
      var flach = x[3] === x[4] && x[3] === x[1];
      if (offRaster || (vol0 && flach)) { stempel.push(new Date(x[0]).toISOString().slice(0,19) + (offRaster?'*':'') + ' v=' + x[2]); stempelIdx.push(i); }
    }
    console.log(IV, sym, 'n=' + n, 'erste=' + new Date(b[0][0]).toISOString().slice(0,10), 'letzte=' + new Date(b[n-1][0]).toISOString().slice(0,19),
      'updatedAt=' + (d.updatedAt ? new Date(d.updatedAt).toISOString().slice(0,16) : '?'),
      'Stempel=' + stempel.length, 'Indizes=' + (stempelIdx.length ? stempelIdx[0] + '..' + stempelIdx[stempelIdx.length-1] : '-'),
      'letzte Kerze Stempel? ' + (stempelIdx.indexOf(n-1) >= 0));
    if (stempel.length) console.log('   ', stempel.slice(0, 8).join(' | '), stempel.length > 8 ? ' ... (+' + (stempel.length-8) + ')' : '');
  });
});
