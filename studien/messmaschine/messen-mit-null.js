'use strict';
/* EICHUNG: LIEFERT DIE MASCHINE AUF DATEN OHNE EFFEKT AUCH NICHTS?
 *
 * ROLLENWECHSEL AM 23.08.2026. Dieses Werkzeug hat den Fehlertyp A6 gefunden - die
 * Kontrolle enthielt Kerzen, die das Signal gelesen hatte. Danach zog es die dort
 * gemessene Verzerrung von der echten Messung ab. Das war der Umweg, und er hat
 * selbst Schaden angerichtet:
 *
 *   Bei rsi2seit schaetzte es +0,027 Pp Verzerrung. A7 zeigt, dass dort praktisch
 *   keine ist (+0,0241 roh gegen +0,0277 mit A7). Der Abzug drueckte den Wert auf
 *   -0,003 und stuetzte die Aussage "der ganze Ueberschuss war das Messgeraet" -
 *   die damit falsch war. Ein Verzerrungsschaetzer mit eigenem Fehler ist selbst
 *   eine Fehlerquelle.
 *
 * Seit A7 ist die Verzerrung nicht mehr geschaetzt, sondern unmoeglich: Die
 * Kontrolle laesst das Lesefenster des Signals aus, der Erwartungswert des
 * Ueberschusses ist unter der Nullhypothese exakt null. Dieses Werkzeug PRUEFT das
 * nur noch nach. Es faellt keine Urteile mehr.
 *
 * WARUM ES KEINE URTEILE MEHR FAELLT (Fehlertyp A8). Der Nullversuch wuerfelt jedes
 * Symbol EINZELN und zerstoert damit den Gleichlauf der Werte: In Wirklichkeit
 * bewegen sich an einem Markttag fast alle gemeinsam, dort nicht. Ein Tagesmittel
 * ueber 190 Werte streut deshalb viel weniger, der Standardfehler bricht auf rund
 * 45 % ein, und t-Werte sind systematisch zu gross. Genau das - und nicht eine
 * Verzerrung - hat am 23.08.2026 das "t1 BESTAETIGT (t = 2,97)" erzeugt: Der
 * Punktschaetzer war dort +0,0946 Pp gegen +0,0933 Pp auf den echten Daten.
 * Ein Nullarchiv taugt fuer VERZERRUNG, nie fuer SIGNIFIKANZ.
 *
 * Aufruf:  node messen-mit-null.js <strategie-datei> [anzahl=30] [archiv]
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var M = require('./messmaschine.js');
var N = require('./nullversuch-permutation.js');

var datei = process.argv[2];
if (!datei) { console.error('Aufruf: node messen-mit-null.js strategien/<name>.js [anzahl] [archiv]'); process.exit(2); }
var anzahl = parseInt(process.argv[3], 10) || 30;
var echtesArchiv = process.argv[4] ||
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');

var S = require(path.resolve(datei));
console.log('Eichung von ' + S.key + ' an ' + anzahl + ' Nullversuchen.');
console.log('Geprueft wird, ob der Ueberschuss auf Daten OHNE Effekt bei null liegt.\n');

var echt = M.messe(S, echtesArchiv);
if (echt.verweigert) { console.log('VERWEIGERT: ' + echt.grund); process.exit(3); }
var nV = echt.ergebnisse.length;

var a7 = echt.entscheidungen.filter(function (e) { return e.regel.indexOf('A7') !== -1; })[0];
var a7Aktiv = a7 && a7.ergebnis && a7.ergebnis.angewandt;
console.log('A7 (Kontrolle ohne Lesefenster): ' +
  (a7Aktiv ? 'aktiv, ' + a7.ergebnis.fensterKerzen + ' Kerzen' :
   'NICHT AKTIV - die Strategie gibt kein leseFensterKerzen an. Genau dann ist eine Verzerrung zu erwarten.') + '\n');

var nullOrdner = path.join(os.tmpdir(), 'md-eichung-' + process.pid);
var nullWerte = [];
for (var v = 0; v < nV; v++) nullWerte.push([]);

process.stdout.write('Nullversuche: ');
for (var lauf = 0; lauf < anzahl; lauf++) {
  N.baue(echtesArchiv, nullOrdner, 1000 + lauf * 7919);
  var r = M.messe(S, nullOrdner);
  if (r.verweigert) { console.log('\nNullversuch verweigert: ' + r.grund); process.exit(3); }
  for (var w = 0; w < nV; w++) {
    var u = r.ergebnisse[w].bestaetigung.ueberschuss;
    if (u && isFinite(u.tagesmittel)) nullWerte[w].push(u.tagesmittel);
  }
  process.stdout.write((lauf + 1) % 10 === 0 ? String(lauf + 1) : '.');
}
console.log('\n');
try { fs.rmSync(nullOrdner, { recursive: true, force: true }); } catch (e) { /* Aufraeumen ist Kuer */ }

function statistik(a) {
  var n = a.length;
  if (n < 3) return null;
  var mu = a.reduce(function (x, y) { return x + y; }, 0) / n;
  var va = a.reduce(function (x, y) { return x + (y - mu) * (y - mu); }, 0) / (n - 1);
  return { n: n, mittel: mu, sd: Math.sqrt(va), se: Math.sqrt(va / n) };
}
function pp(x, d) { return x == null || !isFinite(x) ? '   –   ' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d)); }

console.log(S.key + '  (' + echt.universum.werte + ' Werte, ' + echt.universum.handelstage + ' Handelstage)');
console.log('Var  Signale   Verzerrung Pp   ihr Fehler   t(Verzerrung)   Eichung   echte Messung Pp (Urteil)');

var berichte = [], durchgefallen = 0;
for (var q = 0; q < nV; q++) {
  var e = echt.ergebnisse[q];
  var u2 = e.bestaetigung.ueberschuss;
  var st = statistik(nullWerte[q]);
  /* Die Frage ist NICHT "ist die Verzerrung gross", sondern "ist sie von null zu
   * unterscheiden". Dafuer zaehlt der Fehler des Mittelwerts ueber die Laeufe. */
  var tVerz = st && st.se > 0 ? st.mittel / st.se : null;
  /* Und die zweite Frage, die genauso wichtig ist: ist sie klein gegen das, was
   * die echte Messung aufloesen kann? Eine Verzerrung unter einem Zehntel der MDE
   * kann kein Urteil kippen. */
  var gegenMde = (st && u2.mde > 0) ? Math.abs(st.mittel) / u2.mde : null;
  var bestanden = st && (Math.abs(tVerz) < 3 || (gegenMde != null && gegenMde < 0.1));
  if (!bestanden) durchgefallen++;

  console.log(String(q).padStart(3) + '  ' + String(e.signale).padStart(7) + '  ' +
    pp(st && st.mittel).padStart(13) + '  ' + pp(st && st.se).padStart(11) + '  ' +
    (tVerz == null ? '   –  ' : tVerz.toFixed(2).padStart(13)) + '   ' +
    (bestanden ? 'in Ordnung' : 'DURCHGEFALLEN').padEnd(13) + '  ' +
    pp(u2.tagesmittel) + ' (' + echt.urteile[q] + ')');

  berichte.push({ variante: q, params: e.params, signale: e.signale,
    verzerrungPp: st ? st.mittel * 100 : null, verzerrungFehlerPp: st ? st.se * 100 : null,
    tVerzerrung: tVerz, verzerrungGegenMde: gegenMde, bestanden: !!bestanden, laeufe: st ? st.n : 0,
    echtTagesmittelPp: u2.tagesmittel * 100, echtT: u2.t, echtMdePp: u2.mde * 100, urteil: echt.urteile[q] });
}

console.log('\nLesehilfe:');
console.log('  "Verzerrung"  = was die Maschine auf Daten OHNE Effekt findet. Sollwert: null.');
console.log('  "Eichung"     = in Ordnung, wenn die Verzerrung von null nicht zu unterscheiden ist');
console.log('                  (|t| < 3) ODER unter einem Zehntel der MDE liegt, also kein Urteil kippen kann.');
console.log('  KEINE Urteile aus dieser Tabelle. Die t-Werte auf Nullarchiven sind zu gross (Fehlertyp A8),');
console.log('  weil jedes Symbol einzeln gewuerfelt wird und der Gleichlauf der Werte fehlt.');
console.log(durchgefallen
  ? '\n' + durchgefallen + ' von ' + nV + ' Varianten DURCHGEFALLEN - die Maschine hat hier einen Nullpunkt ungleich null.'
  : '\nAlle ' + nV + ' Varianten in Ordnung - die Maschine faengt bei null an.');

var ziel = path.join(__dirname, 'protokolle', S.key + '-eichung-' + echt.gemessenAm.slice(0, 10) + '.json');
fs.writeFileSync(ziel, JSON.stringify({
  verfahren: 'eichung-permutation/2.0.0', strategie: S.key, gemessenAm: echt.gemessenAm,
  laeufe: anzahl, a7Aktiv: !!a7Aktiv, a7Fenster: a7Aktiv ? a7.ergebnis.fensterKerzen : null,
  hinweis: 'Eichung, KEIN Befund ueber den Markt. Die Renditen sind echt, nur ihre Reihenfolge ist ' +
           'innerhalb jeder UTC-Stunde vertauscht. t-Werte auf Nullarchiven sind systematisch zu gross (A8).',
  varianten: berichte,
}, null, 1));
console.log('\nProtokoll: ' + ziel);
process.exit(durchgefallen ? 1 : 0);
