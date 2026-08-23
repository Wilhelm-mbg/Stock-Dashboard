'use strict';
/* MESSEN GEGEN DEN EIGENEN NULLPUNKT.
 *
 * Am 23.08.2026 hat sich herausgestellt, dass die Maschine nicht bei null anfaengt.
 * Auf vertauschten Daten - dieselben Renditen, nur die Reihenfolge gewuerfelt, also
 * garantiert ohne Vorhersagbarkeit - kam
 *     T1 als BESTAETIGT   durch (t = +2,97)
 *     T3 als WIDERLEGT    durch (t = -8,07)
 * Die Ursache ist eine endliche Ueberschneidung zwischen Signal und Kontrolle
 * (Fehlertyp A6). Ihr Vorzeichen haengt an der Bauart des Signals, ihre Groesse an
 * Fensterlaenge und Topfgroesse. Sie laesst sich deshalb nicht einmal ausrechnen
 * und pauschal abziehen - sie muss JE STRATEGIE gemessen werden.
 *
 * Dieses Programm tut genau das:
 *   1. Die Strategie einmal am echten Archiv messen.
 *   2. Dieselbe Strategie an M vertauschten Archiven messen (verschiedene Saaten).
 *   3. Das Urteil NICHT gegen null faellen, sondern gegen die Verteilung aus
 *      Schritt 2. Verzerrung abziehen, Streuung aus dem Nullversuch nehmen.
 *
 * Der letzte Punkt ist der wichtigere: Der analytische Standardfehler unterstellt,
 * dass Tage unabhaengig sind. Der Nullversuch unterstellt gar nichts - er zeigt,
 * wie weit dieselbe Rechnung auf Daten ohne Effekt schwankt. Wo beide auseinander-
 * gehen, gilt der Nullversuch.
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
console.log('Messe ' + S.key + ' gegen ' + anzahl + ' Nullversuche.\n');

/* --- 1) Die echte Messung --- */
var echt = M.messe(S, echtesArchiv);
if (echt.verweigert) { console.log('VERWEIGERT: ' + echt.grund); process.exit(3); }
var nV = echt.ergebnisse.length;

/* --- 2) Die Nullversuche --- */
var nullOrdner = path.join(os.tmpdir(), 'md-nullversuch-' + process.pid);
var nullWerte = [];                       // [variante][lauf] = Tagesmittel des Ueberschusses
for (var v = 0; v < nV; v++) nullWerte.push([]);

process.stdout.write('Nullversuche: ');
for (var lauf = 0; lauf < anzahl; lauf++) {
  N.baue(echtesArchiv, nullOrdner, 1000 + lauf * 7919);   // teilerfremde Schrittweite
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

/* --- 3) Urteil gegen den Nullpunkt --- */
function statistik(a) {
  var n = a.length;
  if (n < 3) return null;
  var mu = a.reduce(function (x, y) { return x + y; }, 0) / n;
  var va = a.reduce(function (x, y) { return x + (y - mu) * (y - mu); }, 0) / (n - 1);
  return { n: n, mittel: mu, sd: Math.sqrt(va) };
}
function pp(x, d) { return x == null || !isFinite(x) ? '   –   ' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d)); }

var schwelle = echt.entscheidungen.filter(function (e) { return e.regel.indexOf('Bonferroni') !== -1; })
  .map(function (e) { return e.ergebnis.schwelleT; })[0];
if (!(schwelle > 0)) { console.error('Bonferroni-Schwelle nicht im Protokoll gefunden - Abbruch statt Ersatzwert.'); process.exit(4); }

console.log(S.key + '  (' + echt.universum.werte + ' Werte, ' + echt.universum.handelstage + ' Handelstage)');
console.log('Bonferroni-Schwelle fuer |t|: ' + schwelle.toFixed(2) + ' bei ' + echt.tests + ' Test(s)\n');
console.log('Var  Signale   echt Pp   Null-Mittel        benutzter Fehler   korrigiert   t(Null)   Rang   Urteil');

var berichte = [];
for (var q = 0; q < nV; q++) {
  var e = echt.ergebnisse[q];
  var u2 = e.bestaetigung.ueberschuss;
  var st = statistik(nullWerte[q]);
  var korrigiert = st ? u2.tagesmittel - st.mittel : null;
  /* Verzerrung: der Nullversuch ist dafuer das richtige Werkzeug, er misst sie direkt.
   * Streuung: NICHT. Das Vertauschen zerstoert die Volatilitaets-Cluster, also hat ein
   * Signal, das geclusterte Tage auswaehlt, in Wirklichkeit weniger unabhaengige
   * Beobachtungen als hier unterstellt. Deshalb gilt der GROESSERE der beiden Fehler.
   * In die vorsichtige Richtung zu irren ist hier die ganze Uebung. */
  var seAnalytisch = u2.se != null && isFinite(u2.se) ? u2.se : null;
  var se = st ? Math.max(st.sd, seAnalytisch || 0) : null;
  var seHerkunft = !st ? '-' : (seAnalytisch != null && seAnalytisch > st.sd ? 'analytisch' : 'Nullversuch');
  var tNull = se > 0 ? korrigiert / se : null;
  /* Empirischer Rang: wie viele Nullversuche lagen mindestens so hoch wie die echte
   * Messung? Ein Rang von 0 bedeutet, dass kein einziger Nullversuch mithielt. */
  var rang = st ? nullWerte[q].filter(function (x) { return Math.abs(x - st.mittel) >= Math.abs(korrigiert); }).length : null;
  var urteil;
  if (!st) urteil = 'nicht-messbar';
  else if (tNull == null) urteil = 'nicht-messbar';
  else if (Math.abs(tNull) < schwelle) urteil = 'nicht-entscheidbar';
  else if (tNull > 0) urteil = 'BESTAETIGT';
  else urteil = 'widerlegt';

  console.log(String(q).padStart(3) + '  ' + String(e.signale).padStart(7) + '  ' +
    pp(u2.tagesmittel).padStart(8) + '  ' + pp(st && st.mittel).padStart(11) + '  ' +
    (pp(se) + ' (' + seHerkunft + ')').padStart(20) + '  ' + pp(korrigiert).padStart(11) + '  ' +
    (tNull == null ? '   –  ' : tNull.toFixed(2).padStart(6)) + '  ' +
    (rang == null ? ' – ' : (rang + '/' + st.n).padStart(5)) + '   ' + urteil);

  berichte.push({ variante: q, params: e.params, signale: e.signale,
    echtTagesmittelPp: u2.tagesmittel * 100,
    nullMittelPp: st ? st.mittel * 100 : null, nullStreuungPp: st ? st.sd * 100 : null,
    analytischeSePp: seAnalytisch != null ? seAnalytisch * 100 : null,
    benutzterFehlerPp: se != null ? se * 100 : null, fehlerHerkunft: seHerkunft,
    korrigiertPp: korrigiert != null ? korrigiert * 100 : null, tGegenNull: tNull,
    rangUnterNullversuchen: rang, laeufe: st ? st.n : 0, urteil: urteil,
    urteilOhneNullpunkt: echt.urteile[q] });
}

console.log('\nLesehilfe:');
console.log('  "Null-Mittel"    = was dieselbe Rechnung auf Daten OHNE Effekt liefert. Das ist die Verzerrung.');
console.log('  "benutzter Fehler" = der GROESSERE aus Nullversuch-Streuung und analytischem Fehler.');
console.log('                     Das Vertauschen zerstoert Volatilitaets-Cluster, seine Streuung ist also zu klein');
console.log('                     fuer Signale, die geclusterte Tage auswaehlen. Im Zweifel der groessere Wert.');
console.log('  "Rang"           = Nullversuche, die mindestens so weit vom Nullpunkt abwichen wie die echte Messung.');

/* Vergleich mit dem Urteil ohne Nullpunkt - das ist der eigentliche Zweck. */
var geaendert = berichte.filter(function (b) {
  return String(b.urteil).toLowerCase() !== String(b.urteilOhneNullpunkt).toLowerCase();
});
if (geaendert.length) {
  console.log('\nDURCH DEN NULLPUNKT GEAENDERT:');
  geaendert.forEach(function (b) {
    console.log('  Variante ' + b.variante + ': "' + b.urteilOhneNullpunkt + '" -> "' + b.urteil + '"');
  });
} else {
  console.log('\nKein Urteil aendert sich durch den Nullpunkt.');
}

var ziel = path.join(__dirname, 'protokolle', S.key + '-nullpunkt-' + echt.gemessenAm.slice(0, 10) + '.json');
fs.writeFileSync(ziel, JSON.stringify({
  verfahren: 'nullpunkt-permutation/1.0.0', strategie: S.key, gemessenAm: echt.gemessenAm,
  laeufe: anzahl, schwelleT: schwelle, tests: echt.tests,
  hinweis: 'Die Renditen sind echt, nur ihre Reihenfolge ist innerhalb jeder UTC-Stunde vertauscht. ' +
           'In dieser Reihe kann die Vergangenheit die Zukunft nicht vorhersagen.',
  varianten: berichte,
}, null, 1));
console.log('\nProtokoll: ' + ziel);
