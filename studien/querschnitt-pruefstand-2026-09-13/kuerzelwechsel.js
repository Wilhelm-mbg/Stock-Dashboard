'use strict';
/* KUERZELWECHSEL - Kandidatentafel fuer wiederverwendete Kuerzel (Panel-Reparatur 18.09.2026, Auftrag §1.2/§2).
 *
 * BEFUND: Das Archiv fuehrt je Kuerzel EINE Reihe. Tritt eine Firma vom Kuerzel ab (HCP -> PEAK 2019) und
 * bekommt spaeter eine andere Firma dasselbe Kuerzel (HashiCorp als HCP ab 2021-12-09), liegen ZWEI Firmen in
 * einer Reihe, und das Panel rechnet am Wechseltag eine "Rendite" von der einen zur anderen (+138 %).
 * Die _lebenszeit.json des Archivs kennt nur drei solche Faelle (~2-Reihen); die Kuerzelwechsel-Tafel der
 * Grundstudie (verschwundene-gruende.json) beschreibt das ENDE einer Reihe, nicht ihre Wiedervergabe.
 *
 * QUELLE der Kandidaten: die Saetze `name_changes` der Massnahmendatei alpaca-massnahmen/<SYM>.json.
 *   Regel A: old_symbol == S, new_symbol != S am Datum D  -> die Firma verlaesst das Kuerzel; Balken von S
 *            ab D gehoeren einer ANDEREN Firma.
 *   Regel B: new_symbol == S, old_symbol != S am Datum D  -> eine Firma kommt auf das Kuerzel; hat S schon
 *            Balken VOR D, sind das entweder die vorherige Firma (Luecke davor: BBBY 2023..2025) oder die
 *            zusammengefuehrte Vorgeschichte derselben Firma (keine Luecke: ECA -> OVV 2020-01-27).
 * Die ENTSCHEIDUNG faellt in paneldaten.js an den Tagen der Reihe (Luecke vor dem ersten Tag ab D, siehe
 * K.WECHSEL_MIN_LUECKE_TAGE); dieses Skript liefert nur die deterministische KANDIDATENLISTE, damit die
 * Symboltabelle (Reihe S und Nachfolge-Reihe S~2) in allen sechs Teilen gleich ist.
 *
 * Aufruf:  node kuerzelwechsel.js            -> schreibt kuerzelwechsel-kandidaten.json (Repo)
 *          node kuerzelwechsel.js --diagnose voll   -> dazu je Kandidat die Luecke im vorhandenen Panel (nur Anzeige)
 *
 * NUR LESEN auf E:. Keine Sperre, kein Netz.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var LP = require('./lesen-panel.js');

var DATEI = path.join(__dirname, 'kuerzelwechsel-kandidaten.json');

function datumAus(s) { return s.process_date || s.ex_date || s.effective_date || null; }

/** Kandidaten je Reihe des Universums: [{reihe, basis, wechsel: [{regel, datum, old_symbol, new_symbol, id}]}] */
function sammeln() {
  var R = LP.reihen(), aus = [], z = { reihen: R.length, dateiFehlt: 0, ohneDatum: 0, regelA: 0, regelB: 0, kandidaten: 0 };
  R.forEach(function (r) {
    var basis = r.reihe.replace(/~2$/, '');
    var p = path.join(K.ORTE.massnahmen(), r.ordner.replace(/~2$/, '') + '.json');
    var j = null;
    try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { z.dateiFehlt++; return; }
    var w = [];
    (j.saetze || []).forEach(function (s) {
      if (s._art !== 'name_changes') return;
      var alt = String(s.old_symbol || ''), neu = String(s.new_symbol || ''), d = datumAus(s);
      if (!d) { z.ohneDatum++; return; }
      if (alt === basis && neu !== basis) { w.push({ regel: 'A', datum: d, old_symbol: alt, new_symbol: neu, id: s.id || null }); z.regelA++; }
      else if (neu === basis && alt !== basis) { w.push({ regel: 'B', datum: d, old_symbol: alt, new_symbol: neu, id: s.id || null }); z.regelB++; }
    });
    if (!w.length) return;
    w.sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });
    aus.push({ reihe: r.reihe, basis: basis, ordner: r.ordner, wechsel: w });
    z.kandidaten++;
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  return { kennung: 'querschnitt-pruefstand-2026-09-13/kuerzelwechsel/v1', stand: new Date().toISOString(),
    quelle: 'alpaca-massnahmen/<SYM>.json, Saetze name_changes (Regel A: old_symbol == S; Regel B: new_symbol == S)',
    zaehler: z, kandidaten: aus };
}

/** Kandidaten UND entschiedene Trennungen lesen (fuer paneldaten.js). Fehlt die Entscheidung, ist das ein Abbruch -
 *  nicht still ohne Trennung bauen. */
function laden() {
  if (!fs.existsSync(DATEI)) throw new Error('kuerzelwechsel-kandidaten.json fehlt - erst `node kuerzelwechsel.js --entscheiden <panelordner>` laufen lassen');
  var j = JSON.parse(fs.readFileSync(DATEI, 'utf8'));
  if (!j.trennungen) throw new Error('kuerzelwechsel-kandidaten.json ohne `trennungen` - erst `node kuerzelwechsel.js --entscheiden <panelordner>`');
  var karte = {}; (j.kandidaten || []).forEach(function (k) { karte[k.reihe] = k; });
  var tr = {}; j.trennungen.forEach(function (t) { tr[t.reihe] = t; });
  return { karte: karte, trennungen: tr, kennung: j.kennung, entschiedenAus: j.entschiedenAus || null, n: (j.kandidaten || []).length };
}

/** ENTSCHEIDUNG je Kandidat an den Tagen des vorhandenen Panels: Trennung am ersten Tag ab dem Wechseldatum, wenn die
 *  Reihe Tage davor UND danach hat und die Luecke dazwischen >= K.WECHSEL_MIN_LUECKE_TAGE ist. Je Reihe hoechstens eine
 *  Trennung (die frueheste); weitere qualifizierte Wechsel derselben Reihe werden gezaehlt und gelistet, nicht gebaut. */
function entscheiden(zeilen) {
  var je = {}, aus = [], weitere = [], nichtGetrennt = [];
  zeilen.forEach(function (x) {
    var q = x.tageVor > 0 && x.tageAb > 0 && x.luecke != null && x.luecke >= K.WECHSEL_MIN_LUECKE_TAGE;
    if (!q) { if (x.tageVor > 0 && x.tageAb > 0 && x.luecke != null && x.luecke >= 20) nichtGetrennt.push(x); return; }
    if (je[x.reihe]) { if (je[x.reihe].tag !== x.ersterAb) weitere.push(x); return; }
    je[x.reihe] = { reihe: x.reihe, basis: x.reihe.replace(/~2$/, ''), regel: x.regel, datum: x.datum, old_symbol: x.old_symbol, new_symbol: x.new_symbol,
      tag: x.ersterAb, letzterVor: x.letzterVor, luecke: x.luecke, tageVor: x.tageVor, tageAb: x.tageAb };
    aus.push(je[x.reihe]);
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  return { trennungen: aus, weitereWechselDerselbenReihe: weitere, luecke20bis59NichtGetrennt: nichtGetrennt };
}

/* ---------- Diagnose am vorhandenen Panel: wo liegt die Luecke je Kandidat? ---------- */
function diagnose(aus, tafel, kennung) {
  var P = require('./paneldaten.js'), kal = K.kalender();
  /* `aus` ist ein Panelordner (voll/panel oder voll/panel-v1); die Kennung des v1-Panels ist K.PANEL_KENNUNG_V1. */
  var panel = P.ladePanel(null, { ordner: aus, kennung: kennung || K.PANEL_KENNUNG }), idx = {};
  panel.stand.symbole.forEach(function (s, i) { idx[s.reihe] = i; });
  /* Tage je Reihe einsammeln (nur fuer Kandidaten) */
  var will = {}; tafel.kandidaten.forEach(function (k) { if (idx[k.reihe] !== undefined) will[idx[k.reihe]] = k.reihe; });
  var tage = {};
  Object.keys(panel.jahre).forEach(function (j) {
    var b = panel.jahre[j];
    for (var i = 0; i < b.n; i++) { var r = will[b.sym[i]]; if (r) (tage[r] = tage[r] || []).push(b.tag[i]); }
  });
  var zeilen = [];
  tafel.kandidaten.forEach(function (k) {
    var t = (tage[k.reihe] || []).sort(function (a, b) { return a - b; });
    k.wechsel.forEach(function (w) {
      var dIdx = kal.idx[w.datum]; if (dIdx === undefined) { for (var q = 0; q < kal.tage.length; q++) if (kal.tage[q] >= w.datum) { dIdx = q; break; } }
      var vor = null, ab = null;
      for (var i = 0; i < t.length; i++) { if (dIdx !== undefined && t[i] < dIdx) vor = t[i]; else if (ab === null) { ab = t[i]; break; } }
      var luecke = (vor != null && ab != null) ? ab - vor - 1 : null;
      zeilen.push({ reihe: k.reihe, regel: w.regel, datum: w.datum, old_symbol: w.old_symbol, new_symbol: w.new_symbol,
        tageVor: t.filter(function (x) { return dIdx !== undefined && x < dIdx; }).length, tageAb: t.filter(function (x) { return dIdx !== undefined && x >= dIdx; }).length,
        letzterVor: vor == null ? null : kal.tage[vor], ersterAb: ab == null ? null : kal.tage[ab], luecke: luecke });
    });
  });
  return zeilen;
}

if (require.main === module) {
  var a = { diagnose: null, entscheiden: null, kennung: null };
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--diagnose') a.diagnose = process.argv[++i];
    else if (process.argv[i] === '--entscheiden') a.entscheiden = process.argv[++i];
    else if (process.argv[i] === '--kennung') a.kennung = process.argv[++i];
  }
  var t = sammeln();
  if (a.entscheiden) {
    /* Entscheidung am vorhandenen Panel (v1: eigener Ordner und eigene Kennung); Ergebnis in die Kandidatendatei. */
    var zE = diagnose(a.entscheiden, t, a.kennung);
    var E = entscheiden(zE);
    t.entschiedenAus = a.entscheiden; t.minLuecke = K.WECHSEL_MIN_LUECKE_TAGE;
    t.trennungen = E.trennungen; t.weitereWechselDerselbenReihe = E.weitereWechselDerselbenReihe; t.luecke20bis59NichtGetrennt = E.luecke20bis59NichtGetrennt;
    process.stdout.write('Trennungen: ' + E.trennungen.length + ' (weitere derselben Reihe: ' + E.weitereWechselDerselbenReihe.length + ', Luecke 20-59 nicht getrennt: ' + E.luecke20bis59NichtGetrennt.length + ')\n');
    E.trennungen.forEach(function (x) { process.stdout.write('  ' + x.reihe + ' ' + x.regel + ' ' + x.old_symbol + '->' + x.new_symbol + ' (' + x.datum + ') Trennung ' + x.tag + ', davor bis ' + x.letzterVor + ', Luecke ' + x.luecke + '\n'); });
  }
  fs.writeFileSync(DATEI, JSON.stringify(t, null, 1));
  process.stdout.write('Kandidaten: ' + JSON.stringify(t.zaehler) + ' -> ' + DATEI + '\n');
  if (a.diagnose) {
    var z = diagnose(a.diagnose, t, a.kennung);
    var out = path.join(__dirname, 'kuerzelwechsel-diagnose.json');
    fs.writeFileSync(out, JSON.stringify({ stand: new Date().toISOString(), aus: a.diagnose, n: z.length, zeilen: z }, null, 1));
    var mitVor = z.filter(function (x) { return x.tageVor > 0 && x.tageAb > 0; });
    process.stdout.write('Wechsel mit Tagen davor UND danach: ' + mitVor.length + ' von ' + z.length + '\n');
    var hist = {}; mitVor.forEach(function (x) { var b = x.luecke == null ? 'null' : x.luecke === 0 ? '0' : x.luecke < 5 ? '1-4' : x.luecke < 20 ? '5-19' : x.luecke < 60 ? '20-59' : x.luecke < 250 ? '60-249' : '250+'; hist[x.regel + ':' + b] = (hist[x.regel + ':' + b] || 0) + 1; });
    process.stdout.write('Luecken-Histogramm (Regel:Luecke in Handelstagen): ' + JSON.stringify(hist) + '\n');
    mitVor.sort(function (x, y) { return (y.luecke || 0) - (x.luecke || 0); });
    mitVor.forEach(function (x) { process.stdout.write('  ' + x.reihe + ' ' + x.regel + ' ' + x.datum + ' ' + x.old_symbol + '->' + x.new_symbol + ' vor ' + x.tageVor + ' (bis ' + x.letzterVor + ') ab ' + x.tageAb + ' (ab ' + x.ersterAb + ') Luecke ' + x.luecke + '\n'); });
    process.stdout.write('-> ' + out + '\n');
  }
}

module.exports = { sammeln: sammeln, laden: laden, diagnose: diagnose, entscheiden: entscheiden, DATEI: DATEI, datumAus: datumAus };
