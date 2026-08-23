'use strict';
/* Aufruf:  node messen.js <strategie-datei> [archiv]
 * Misst eine Strategie und legt das Protokoll unter protokolle/<key>-<datum>.json ab.
 * Das Protokoll ist die einzige Quelle fuer das Scoreboard und fuer die App. */
var fs = require('fs'), path = require('path'), os = require('os');
var M = require('./messmaschine.js');

var datei = process.argv[2];
if (!datei) { console.error('Aufruf: node messen.js strategien/<name>.js [archiv]'); process.exit(2); }
var archiv = process.argv[3] || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
/* Strategien aus dem App-Datenordner kennen den Quellpfad nicht - sie laden quant.js
 * ueber STOCK_DASHBOARD_QUELLE. Hier wird er gesetzt, bevor die Datei geladen wird. */
if (!process.env.STOCK_DASHBOARD_QUELLE) process.env.STOCK_DASHBOARD_QUELLE = path.resolve(__dirname, '..', '..');
var S = require(path.resolve(datei));

/* Ein anderes als das echte Archiv macht das Ergebnis zu etwas anderem - meist zu
 * einem Nullversuch. Das muss am Dateinamen sichtbar sein und darf die App nie
 * erreichen. */
var echtesArchiv = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
var fremdesArchiv = path.resolve(archiv) !== path.resolve(echtesArchiv);
console.log('Messe ' + S.key + ' auf ' + archiv);
if (fremdesArchiv) console.log('ACHTUNG: fremdes Archiv - das Ergebnis ist KEIN Befund ueber den Markt.');
var r = M.messe(S, archiv);
if (r.verweigert) { console.log('VERWEIGERT: ' + r.grund); process.exit(3); }

var ordner = path.join(__dirname, 'protokolle');
if (!fs.existsSync(ordner)) fs.mkdirSync(ordner);
var ziel = path.join(ordner, S.key + '-' + r.gemessenAm.slice(0, 10) +
  (fremdesArchiv ? '-fremdarchiv' : '') + '.json');
r.archiv = { pfad: archiv, echtesArchiv: !fremdesArchiv };
// Die Signalfunktion laesst sich nicht serialisieren; ihr Quelltext schon - so bleibt nachvollziehbar, WAS gemessen wurde
r.strategie.quelle = fs.readFileSync(path.resolve(datei), 'utf8');
fs.writeFileSync(ziel, JSON.stringify(r, null, 1));
/* Zweite Kopie in den Datenordner der App: von dort liest das Scoreboard. Das Repo
 * behaelt seine Kopie als Studienarchiv. Beide sind byteweise gleich. */
var appOrdner = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'protokolle');
if (fremdesArchiv) {
  console.log('Keine Kopie in den Datenordner - das Scoreboard zeigt nur Messungen am echten Archiv.');
} else {
  try { fs.mkdirSync(appOrdner, { recursive: true }); fs.writeFileSync(path.join(appOrdner, path.basename(ziel)), JSON.stringify(r, null, 1)); }
  catch (e) { console.log('Hinweis: Kopie in den Datenordner nicht moeglich (' + e.message + ')'); }
}

function pp(x, d) { return x == null ? '–' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d) + ' Pp'); }
console.log('\n' + S.key + '  (' + r.universum.werte + ' Werte, ' + r.universum.handelstage + ' Handelstage, Schnitt ' + r.universum.schnittTag + ')');
r.ergebnisse.forEach(function (e, i) {
  var b = e.bestaetigung, u = r.entscheidungen.filter(function (x) { return x.regel === 'Urteil Variante ' + i; })[0];
  console.log('  Variante ' + i + ': ' + e.signale + ' Signale');
  console.log('    Entdeckung   roh ' + pp(e.entdeckung.roh.tagesmittel) + '  Ueberschuss ' + pp(e.entdeckung.ueberschuss.tagesmittel) + ' (t ' + (e.entdeckung.ueberschuss.t || 0).toFixed(2) + ')');
  console.log('    Bestaetigung roh ' + pp(b.roh.tagesmittel) + '  Ueberschuss ' + pp(b.ueberschuss.tagesmittel) + ' (t ' + (b.ueberschuss.t || 0).toFixed(2) + ', MDE ' + pp(b.ueberschuss.mde) + ')');
  console.log('    je Signal (handelbar): ' + pp(b.ueberschuss.jeSignal) + '  netto nach Spanne: ' + pp(e.nettoJeSignalBestaetigung));
  console.log('    URTEIL: ' + u.ergebnis.urteil.toUpperCase() + (u.ergebnis.aussicht ? '  (bis t=2 mit 80 %: ' + u.ergebnis.aussicht.tage80.toLocaleString('de') + ' Tage)' : ''));
  console.log('    ' + u.begruendung);
});
if (r.warnungen.length) { console.log('\n  WARNUNGEN:'); r.warnungen.forEach(function (w) { console.log('   [' + w.kennung + '] ' + w.text); }); }
console.log('\nProtokoll: ' + ziel);
