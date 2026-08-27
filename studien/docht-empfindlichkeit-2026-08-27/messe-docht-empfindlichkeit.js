'use strict';
/* Docht-Empfindlichkeitsmessung (Auftrag PM 27.08., an die Mess-Sitzung):
 * Hebt sich der Phantom-Docht-Effekt im Ueberschuss auf?
 *
 * ANORDNUNG (vor dem Lauf festgeschrieben, Commit zaehlt):
 * - Drei Stop-Strategien: kapitulation, rsi2seit-mcp, t1-zwangsglattstellung.
 * - GEPAARTER Vergleich auf DEMSELBEN Archivstand und DERSELBEN Maschine (1.5.0):
 *   Arm A = archiv60m unveraendert; Arm B = identische Kopie, aus der jede Kerze
 *   mit Umsatz === 0 entfernt ist (je Reihe gezaehlt). Ein Vergleich gegen die
 *   abgelegten 26.08.-Protokolle waere DREIFACH konfundiert (Archiv gewachsen,
 *   Maschine 1.2.0 -> 1.5.0, Ausschluss) und ist nur nachrichtlicher Kontext.
 * - KEIN Kanten-Urteil. Reine Empfindlichkeitsmessung.
 *
 * MASSSTAB (vorab; Praezisierung 27.08. ~01:30 VOR dem Lauf, auf QS-Warnung):
 *   je Strategie, ueber alle Varianten, Block bestaetigung.ueberschuss:
 *   "hebt sich auf"        := kein TRAGENDER Urteilswechsel A->B
 *                             UND |tagesmittel_B - tagesmittel_A| < delta80_A je Variante
 *   "hebt sich NICHT auf"  := mindestens ein TRAGENDER Urteilswechsel A->B
 *                             ODER |Delta| >= delta80_A in irgendeiner Variante
 *   TRAGEND heisst: der Wechsel geht mit |Delta| >= delta80_A der Variante einher ODER
 *   der Abstand zur gewechselten Urteilsgrenze betrug in Arm A mehr als 0,01 Pp.
 *   Grund (QS-Messung 27.08.): rsi2seit-mcp Var 3 kippt an 0,0001-Pp-Margen zweimal
 *   am Tag in beide Richtungen - ein Etiketten-Wechsel dort ist Rauschen, kein Signal.
 *   Reine Rand-Wechsel werden als "Randrauschen" berichtet, begruenden aber kein
 *   "hebt sich nicht auf".
 *   Zusatz (Mechanik, nachrichtlich): Anteil Stop-Ausstiege je Arm, entfernte
 *   Kerzen je Reihe, Placebo-t beider Arme.
 *
 * HYGIENE:
 * - messen.js wird NICHT benutzt (ueberschreibt Protokolle gleichen Datums und
 *   schreibt fest in den Datenordner). Dieser Treiber ruft die Maschine direkt
 *   und schreibt nur in diesen Studienordner + Scratch.
 * - Vor jeder Archiv-Beruehrung fragt er den Wachhund; Exit 2 = Sperre = Abbruch.
 * - Jeder Messlauf laeuft in einem frischen Node-Prozess (4-GB-Heap-Falle).
 *
 * Aufrufe:
 *   node messe-docht-empfindlichkeit.js               (alles: Wachhund -> Kopie -> 6 Laeufe -> Vergleich)
 *   node messe-docht-empfindlichkeit.js --einzel <key> <A|B>   (intern, ein Messlauf)
 *   node messe-docht-empfindlichkeit.js --vergleich   (nur Auswertung vorhandener JSONs)
 */
var fs = require('fs'), path = require('path'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SCRATCH = process.env.DOCHT_SCRATCH ||
  'C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/2267001b-6289-4367-91ad-6ce34f2043ab/scratchpad/archiv60m-ohne-nullumsatz';
var HIER = __dirname;

var STRATEGIEN = {
  'kapitulation':           REPO + '/studien/messmaschine/strategien/kapitulation.js',
  'rsi2seit-mcp':           REPO + '/studien/messmaschine/strategien/rsi2seit-mcp.js',
  't1-zwangsglattstellung': REPO + '/studien/messmaschine/strategien/t1-zwangsglattstellung.js'
};

function wachhundOk() {
  /* Nur archiv60m - dieser Treiber liest 1d nie; der Nachlader wechselt nachts
   * nahtlos von 60m auf 1d, eine globale Pruefung wuerde dann grundlos sperren. */
  var r = cp.spawnSync(process.execPath, [REPO + '/tools/archiv-wachhund.js', 'archiv60m'], { encoding: 'utf8', timeout: 300000 });
  console.log('[Wachhund archiv60m] Exit ' + r.status);
  if (r.stdout) console.log(r.stdout.split('\n').slice(-6).join('\n'));
  if (r.status === 2) { console.error('ABBRUCH: Wachhund meldet Sperre (Exit 2) - nicht auf den Archiven messen.'); return false; }
  if (r.status !== 0) { console.error('ABBRUCH: Wachhund Exit ' + r.status + ' - erst klaeren, dann messen.'); return false; }
  return true;
}

function baueKopieOhneNullumsatz() {
  if (!fs.existsSync(SCRATCH)) fs.mkdirSync(SCRATCH, { recursive: true });
  var dateien = fs.readdirSync(ARCHIV60M).filter(function (f) { return f.indexOf('bars_60m_') === 0 && f.slice(-5) === '.json'; });
  var zaehlung = { reihen: 0, kerzen: 0, entfernt: 0, jeReihe: {} };
  dateien.forEach(function (f, i) {
    var j = JSON.parse(fs.readFileSync(path.join(ARCHIV60M, f), 'utf8'));
    var vorher = j.series.length;
    j.series = j.series.filter(function (z) { return z[2] !== 0; }); /* format: [zeit, schluss, umsatz, hoch, tief, eroeffnung] */
    var raus = vorher - j.series.length;
    zaehlung.reihen++; zaehlung.kerzen += vorher; zaehlung.entfernt += raus;
    if (raus > 0) zaehlung.jeReihe[j.sym || f] = raus;
    fs.writeFileSync(path.join(SCRATCH, f), JSON.stringify(j));
    if ((i + 1) % 500 === 0) console.log('  Kopie: ' + (i + 1) + '/' + dateien.length);
  });
  fs.writeFileSync(HIER + '/ausschluss-zaehlung.json', JSON.stringify(zaehlung, null, 1));
  console.log('[Kopie] ' + zaehlung.reihen + ' Reihen, ' + zaehlung.entfernt + ' von ' + zaehlung.kerzen +
    ' Kerzen entfernt (' + (100 * zaehlung.entfernt / zaehlung.kerzen).toFixed(3) + ' %)');
  return zaehlung;
}

function einzelLauf(key, arm) {
  process.env.STOCK_DASHBOARD_QUELLE = REPO;
  var M = require(REPO + '/studien/messmaschine/messmaschine.js');
  var S = require(STRATEGIEN[key]);
  var archiv = arm === 'A' ? ARCHIV60M : SCRATCH;
  console.log('[' + key + ' / Arm ' + arm + '] Archiv: ' + archiv + '  Maschine ' + M.VERFAHREN.version);
  var r = M.messe(S, archiv);
  if (r && r.verweigert) { console.error('VERWEIGERT: ' + r.grund); process.exit(4); }
  fs.writeFileSync(HIER + '/' + key + '-' + arm + '.json', JSON.stringify(r, null, 1));
  console.log('  bestesUrteil: ' + r.bestesUrteil + '  Placebo t ' + (r.placebo ? r.placebo.t.toFixed(3) : '-'));
}

function urteilVon(prot, i) {
  var e = (prot.entscheidungen || []).filter(function (x) { return x.regel === 'Urteil Variante ' + i; })[0];
  return e ? { urteil: e.ergebnis.urteil, delta80: e.ergebnis.delta80 } : null;
}
function stopAnteil(prot) {
  var s = 0, n = 0;
  (prot.ergebnisse || []).forEach(function (e) {
    if (e.ausstieg && e.ausstieg.anteile) { s += (e.ausstieg.anteile.stop || 0); n++; }
  });
  return n ? s / n : null;
}
function pp(x) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(4)); }

function vergleich() {
  var gesamt = { massstab: 'siehe Kopf dieses Treibers (Commit vor dem Lauf)', strategien: {}, gemessenAm: new Date().toISOString() };
  Object.keys(STRATEGIEN).forEach(function (key) {
    var pa = HIER + '/' + key + '-A.json', pb = HIER + '/' + key + '-B.json';
    if (!fs.existsSync(pa) || !fs.existsSync(pb)) { console.log(key + ': Laeufe fehlen'); return; }
    var A = JSON.parse(fs.readFileSync(pa, 'utf8')), B = JSON.parse(fs.readFileSync(pb, 'utf8'));
    var schwelleA = (function () {
      var e = (A.entscheidungen || []).filter(function (x) { return x.regel === 'B4 Bonferroni'; })[0];
      return e ? e.ergebnis.schwelleT : 1.96;
    })();
    var wechsel = [], grosse = [], rand = [], zeilen = [];
    A.ergebnisse.forEach(function (ea, i) {
      var eb = B.ergebnisse[i]; if (!eb) return;
      var ua = urteilVon(A, i), ub = urteilVon(B, i);
      var ba = ea.bestaetigung.ueberschuss, bb = eb.bestaetigung.ueberschuss;
      var d = (bb.tagesmittel != null && ba.tagesmittel != null) ? bb.tagesmittel - ba.tagesmittel : null;
      var g = d != null && ua && ua.delta80 != null && Math.abs(d) >= ua.delta80;
      var w = ua && ub && ua.urteil !== ub.urteil;
      /* TRAGEND (Praezisierung ~01:30): Abstand von Arm A zur naechsten Urteilsgrenze in Pp */
      var marge = null;
      if (w && ba.tagesmittel != null) {
        var bMDE = ba.mde != null ? Math.abs(Math.abs(ba.tagesmittel) - ba.mde) : Infinity;
        var seA = (ba.t && ba.tagesmittel) ? Math.abs(ba.tagesmittel / ba.t) : null;
        var bT = seA != null ? Math.abs(Math.abs(ba.t) - schwelleA) * seA : Infinity;
        marge = Math.min(bMDE, bT);
      }
      var tragend = w && (g || (marge != null && marge > 0.0001)); /* 0,01 Pp */
      if (tragend) wechsel.push(i); else if (w) rand.push(i);
      if (g) grosse.push(i);
      zeilen.push({ variante: i, urteilA: ua && ua.urteil, urteilB: ub && ub.urteil, wechselTragend: !!tragend,
        wechselRand: !!(w && !tragend), margeA: marge,
        tagesmittelA: ba.tagesmittel, tagesmittelB: bb.tagesmittel, delta: d, delta80A: ua && ua.delta80,
        tA: ba.t, tB: bb.t, signaleA: ba.signale, signaleB: bb.signale });
      console.log(key + ' Var' + i + ': ' + (ua && ua.urteil) + ' -> ' + (ub && ub.urteil) +
        (tragend ? '  *** URTEILSWECHSEL (tragend) ***' : (w ? '  (Randrauschen, Marge ' + pp(marge) + ' Pp)' : '')) +
        '   Ueberschuss ' + pp(ba.tagesmittel) + ' -> ' + pp(bb.tagesmittel) + '  Delta ' + pp(d) +
        ' (delta80_A ' + pp(ua && ua.delta80) + (g ? '  *** GROSS ***' : '') + ')' +
        '   Signale ' + ba.signale + ' -> ' + bb.signale);
    });
    var urteilStrategie = (wechsel.length || grosse.length) ? 'hebt sich NICHT auf' : 'hebt sich auf';
    if (!wechsel.length && grosse.length) urteilStrategie += ' (Groesse, Urteile heute unberuehrt)';
    if (rand.length) urteilStrategie += '   [Randrauschen-Wechsel ohne Wertung: Var ' + rand.join(',') + ']';
    console.log(key + ' => ' + urteilStrategie + '   Placebo t A ' + (A.placebo ? A.placebo.t.toFixed(2) : '-') +
      ' / B ' + (B.placebo ? B.placebo.t.toFixed(2) : '-') +
      '   Stop-Anteil A ' + (stopAnteil(A) != null ? (100 * stopAnteil(A)).toFixed(2) + ' %' : '-') +
      ' / B ' + (stopAnteil(B) != null ? (100 * stopAnteil(B)).toFixed(2) + ' %' : '-'));
    gesamt.strategien[key] = { urteil: urteilStrategie, wechselVarianten: wechsel, grosseVarianten: grosse,
      bestesUrteilA: A.bestesUrteil, bestesUrteilB: B.bestesUrteil,
      placeboTA: A.placebo && A.placebo.t, placeboTB: B.placebo && B.placebo.t,
      stopAnteilA: stopAnteil(A), stopAnteilB: stopAnteil(B), varianten: zeilen };
  });
  fs.writeFileSync(HIER + '/vergleich.json', JSON.stringify(gesamt, null, 1));
  console.log('\nvergleich.json geschrieben.');
}

/* ---------------- Ablauf ---------------- */
var args = process.argv.slice(2);
if (args[0] === '--einzel') { einzelLauf(args[1], args[2]); process.exit(0); }
if (args[0] === '--vergleich') { vergleich(); process.exit(0); }

/* Die Strategien im Kind-Prozess filtern ueber wertpapierart.js; ohne Klassifizierung
 * laesst das ALLES durch (still). Gemessen 27.08.: kein Aufrufer prueft es - hier schon. */
var WPGUARD = require(REPO + '/studien/messmaschine/strategien/wertpapierart.js');
if (!WPGUARD.klassifizierungDa()) { console.error('ABBRUCH: wertpapierarten.json fehlt oder unbrauchbar - Universum waere ungefiltert.'); process.exit(2); }
if (!wachhundOk()) process.exit(2);
console.log('\n[1/3] Gefilterte Kopie bauen (Umsatz === 0 raus) ...');
baueKopieOhneNullumsatz();
console.log('\n[2/3] Sechs Messlaeufe, je eigener Prozess ...');
var jobs = [];
Object.keys(STRATEGIEN).forEach(function (key) { jobs.push([key, 'A'], [key, 'B']); });
for (var j = 0; j < jobs.length; j++) {
  var job = jobs[j];
  console.log('\n----- [' + (j + 1) + '/' + jobs.length + '] ' + job[0] + ' Arm ' + job[1] + ' -----');
  var r = cp.spawnSync(process.execPath, ['--max-old-space-size=4096', __filename, '--einzel', job[0], job[1]],
    { encoding: 'utf8', stdio: 'inherit', timeout: 3600000 });
  if (r.status !== 0) { console.error('Messlauf gescheitert (Exit ' + r.status + ') - Abbruch, Teilstand bleibt liegen.'); process.exit(3); }
}
console.log('\n[3/3] Vergleich ...');
vergleich();
