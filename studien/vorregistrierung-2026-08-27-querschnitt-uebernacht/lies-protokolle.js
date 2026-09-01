'use strict';
/* Liest die Messmaschinen-Protokolle der Uebernacht-Familie und druckt je Lauf die
 * Groessen, an denen die vorregistrierten Entscheidungsregeln haengen. Nur lesend. */
var fs = require('fs'), path = require('path');
var ORDNER = path.join(__dirname, '..', 'messmaschine', 'protokolle');
var TAG = process.argv[2] || new Date().toISOString().slice(0, 10);
var KEYS = ['glockendruck-nacht-n', 'glockendruck-nacht-t', 'nachtstoss-umkehr-n', 'nachtstoss-umkehr-t',
  'abgabedruck-nacht-n', 'abgabedruck-nacht-t', 'nachtstoss-umkehr-n-regime', 'abgabedruck-nacht-n-regime'];

function pp(x, d) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d)); }

KEYS.forEach(function (k) {
  var f = path.join(ORDNER, k + '-' + TAG + '.json');
  if (!fs.existsSync(f)) { console.log(k + ': KEIN PROTOKOLL (' + f + ')'); return; }
  var r = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log('\n== ' + k + '  (Version ' + r.verfahren.version + ', Tests ' + r.tests + ', Universum ' +
    r.universum.werte + ' Werte, Schnitt ' + r.universum.schnittTag + ')');
  r.ergebnisse.forEach(function (e, vi) {
    var u = e.bestaetigung.ueberschuss, ur = null;
    r.entscheidungen.forEach(function (x) { if (x.regel === 'Urteil Variante ' + vi) ur = x; });
    var d80 = ur && ur.eingabe ? ur.eingabe.delta80Pp : null;
    console.log(' V' + vi + ' ' + JSON.stringify(e.params) + '  Signale ' + e.signale +
      '  verworfen ' + JSON.stringify(e.verworfen));
    console.log('   Entdeckung: roh ' + pp(e.entdeckung.roh.tagesmittel) + '  Ueberschuss ' +
      pp(e.entdeckung.ueberschuss.tagesmittel) + ' (t ' + (e.entdeckung.ueberschuss.t || 0).toFixed(2) +
      ', Tage ' + e.entdeckung.ueberschuss.tage + ')');
    console.log('   Bestaetigung: roh ' + pp(e.bestaetigung.roh.tagesmittel) + '  UEBERSCHUSS ' + pp(u.tagesmittel) +
      '  se ' + pp(u.se) + '  t ' + (u.t == null ? '-' : u.t.toFixed(2)) + '  Tage ' + u.tage +
      '  Signale ' + u.signale + '  MDE ' + pp(u.mde) + '  delta80 ' + (d80 == null ? '-' : ((d80 >= 0 ? '+' : '') + d80.toFixed(4))));
    console.log('   jeSignal ' + pp(u.jeSignal) + '  anteilPositiv ' + (u.anteilPositiv == null ? '-' : (100 * u.anteilPositiv).toFixed(1) + ' %') +
      '  Einstiegsluecke zentriert ' + pp(e.einstiegsluecke && e.einstiegsluecke.zentriert));
    var q = e.querschnitt && e.querschnitt.bestaetigung;
    if (q && q.a7 && q.qs) {
      console.log('   gepaart (Maschine, alle Werte): A7 ' + pp(q.a7.tagesmittel) + ' (se ' + pp(q.a7.se) + ')  QS ' +
        pp(q.qs.tagesmittel) + ' (se ' + pp(q.qs.se) + ', t ' + (q.qs.t == null ? '-' : q.qs.t.toFixed(2)) + ', Tage ' + q.qs.tage + ')');
    }
    console.log('   URTEIL der Maschine: ' + (ur ? ur.ergebnis.urteil : '-'));
  });
  if (r.placebo) {
    console.log('   PLACEBO Bestaetigung: ' + pp(r.placebo.tagesmittel) + ' Pp  t ' + r.placebo.t.toFixed(2) +
      '  MDE ' + pp(r.placebo.mde) + '  Signale ' + r.placebo.signale +
      '  bestanden: ' + (Math.abs(r.placebo.tagesmittel) <= r.placebo.mde));
  } else { console.log('   PLACEBO: keiner zustande gekommen'); }
  if (r.placeboEntdeckung) {
    console.log('   Placebo Entdeckung: ' + pp(r.placeboEntdeckung.tagesmittel) + ' Pp  t ' + r.placeboEntdeckung.t.toFixed(2));
  }
  var warn = (r.warnungen || []).map(function (w) { return w.kennung; });
  console.log('   Warnungen: ' + (warn.length ? warn.join(', ') : 'keine'));
});
