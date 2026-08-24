'use strict';
/* Aufruf:  node messen.js <strategie-datei> [archiv]
 * Misst eine Strategie und legt das Protokoll unter protokolle/<key>-<datum>.json ab.
 * Das Protokoll ist die einzige Quelle fuer das Scoreboard und fuer die App. */
var fs = require('fs'), path = require('path'), os = require('os');
var M = require('./messmaschine.js');

var datei = process.argv[2];
if (!datei) { console.error('Aufruf: node messen.js strategien/<name>.js [archiv]'); process.exit(2); }

/* WELCHES ARCHIV IST DAS ECHTE?
 *
 * Bis hierher stand das fest verdrahtet: der Store der App unter %APPDATA%. Das war
 * richtig, solange es nur den einen gab. Inzwischen liegt die Datenbasis woanders -
 * das 60m-Archiv wird rund 1,5 GB gross und hat auf der Systemplatte nichts verloren.
 * tools/yahoo-60m-holen.js hat dafuer laengst eine Konvention; hier wird dieselbe
 * benutzt, statt einen zweiten Pfad danebenzustellen:
 *   1. Umgebungsvariable MD_ARCHIV60M
 *   2. Zeigerdatei <Datenordner>/archiv60m-pfad.txt (eine Zeile, der Pfad)
 *   3. Rueckfall: der Store der App - damit bleibt alles beim Alten, solange
 *      niemand etwas eingerichtet hat.
 *
 * Der Riegel behaelt seine Zaehne: "fremd" heisst weiterhin "nicht das bezeichnete
 * Archiv", und eine Messung darauf kommt nicht ins Scoreboard. Nur ZEIGT der Riegel
 * jetzt dorthin, wo die Daten wirklich liegen. Ohne das haette der Knopf in der App
 * das kleine Archiv gemessen, und eine Messung auf dem grossen waere als Fremdbefund
 * eingestuft worden und nie in der App angekommen - eine Sackgasse mit Stempel. */
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
function bezeichnetesArchiv() {
  if (process.env.MD_ARCHIV60M) return process.env.MD_ARCHIV60M;
  try {
    var p = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^\uFEFF/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei: Rueckfall */ }
  return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
}
var archiv = process.argv[3] || bezeichnetesArchiv();
/* Strategien aus dem App-Datenordner kennen den Quellpfad nicht - sie laden quant.js
 * ueber STOCK_DASHBOARD_QUELLE. Hier wird er gesetzt, bevor die Datei geladen wird. */
if (!process.env.STOCK_DASHBOARD_QUELLE) process.env.STOCK_DASHBOARD_QUELLE = path.resolve(__dirname, '..', '..');
var S = require(path.resolve(datei));

/* Ein anderes als das echte Archiv macht das Ergebnis zu etwas anderem - meist zu
 * einem Nullversuch. Das muss am Dateinamen sichtbar sein und darf die App nie
 * erreichen. */
var echtesArchiv = bezeichnetesArchiv();
var fremdesArchiv = path.resolve(archiv) !== path.resolve(echtesArchiv);
console.log('Messe ' + S.key + ' auf ' + archiv);
if (fremdesArchiv) console.log('ACHTUNG: fremdes Archiv - das Ergebnis ist KEIN Befund ueber den Markt.');
var r = M.messe(S, archiv);
if (r.verweigert) { console.log('VERWEIGERT: ' + r.grund); process.exit(3); }

/* Der Zielordner ist ueberschreibbar, weil die App die Maschine jetzt selbst starten
 * kann (Reiter "Messung"). Im ausgelieferten Paket liegt messen.js im Programmordner -
 * dort neben sich selbst zu schreiben geht nicht, und es waere auch der falsche Ort.
 * Ohne die Variable bleibt alles wie bisher: protokolle/ neben dem Skript. */
var ordner = process.env.MESSMASCHINE_PROTOKOLLE || path.join(__dirname, 'protokolle');
if (!fs.existsSync(ordner)) fs.mkdirSync(ordner, { recursive: true });
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
