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
 *          node kuerzelwechsel.js --luecken voll/panel   -> v2.2: schreibt NUR luecken-trennungen.json (siehe unten)
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

/* ---------- v2.2 (Auftrag Nr. 67, 03.10.2026): Luecken-Trennungen ---------- */
/* REGEL (PM, 03.10.2026): jede Luecke > K.LUECKE_TRENN_TAGE KALENDERtage zwischen zwei aufeinanderfolgenden Tageszeilen einer
 * Reihe beginnt eine neue Reihe - ohne Beleg-Bedingung. Die Liste entsteht VOR dem Bau aus dem vorhandenen Panel (v2.1) und ist
 * eine reine Funktion davon (kein Zeitstempel), damit die Symboltabelle in allen Bau-Teilen gleich ist.
 * NAMEN: die frueheste Notierung behaelt das Kuerzel; neue Abschnitte bekommen je Basis-Kuerzel die naechste freie Nummer in der
 * Reihenfolge ihres ersten Tages (SYM~2, SYM~3, ...). Eine ~2-Reihe, die v2.1 schon fuehrt, BEHAELT ihren Namen (es wird
 * weitergezaehlt): kein v2.1-Name zeigt in v2.2 auf Zeilen, die er vorher nicht hatte - dafuer sind die Nummern bei den Kuerzeln
 * mit vorhandener ~2-Reihe nicht chronologisch (GIG in Zeitfolge: GIG, GIG~3, GIG~2, GIG~4). */
var LUECKEN_DATEI = path.join(__dirname, 'luecken-trennungen.json');
var LUECKEN_KENNUNG = 'querschnitt-pruefstand-2026-09-13/luecken-trennungen/v1';
var KURZLUECKE_AB_TAGE = 30;                                 // 30..LUECKE_TRENN_TAGE: nur gezaehlt, nie getrennt
function basisVon(name) { return String(name).replace(/~\d+$/, ''); }

/** Luecken des vorhandenen Panels (Ordner mit _stand.json und Jahresbloecken) als Trennliste. */
function lueckenSammeln(panelOrdner, kennung) {
  var P = require('./paneldaten.js'), kal = K.kalender();
  var panel = P.ladePanel(null, { ordner: panelOrdner, kennung: kennung || K.PANEL_KENNUNG }), sym = panel.stand.symbole, n = sym.length;
  var ms = kal.tage.map(function (t) { return Date.parse(t + 'T00:00:00Z'); });
  var letzter = new Int32Array(n).fill(-1), zeilen = new Int32Array(n), roh = [], kurz = 0, maxTag = -1, gesamt = 0;
  Object.keys(panel.jahre).sort().forEach(function (j) {
    var b = panel.jahre[j];
    for (var i = 0; i < b.n; i++) {
      var s = b.sym[i], t = b.tag[i];
      if (letzter[s] >= 0) {
        if (t <= letzter[s]) throw new Error('Reihe ' + sym[s].reihe + ': Tage nicht aufsteigend (' + kal.tage[t] + ')');
        var d = Math.round((ms[t] - ms[letzter[s]]) / 86400000);
        if (d > K.LUECKE_TRENN_TAGE) roh.push({ s: s, vor: letzter[s], tag: t, tage: d, zeilenVor: zeilen[s] });
        else if (d >= KURZLUECKE_AB_TAGE) kurz++;
      }
      letzter[s] = t; zeilen[s]++; gesamt++; if (t > maxTag) maxTag = t;
    }
  });
  /* hoechste in v2.1 vergebene Nummer je Basis-Kuerzel (ohne Suffix = 1) */
  var nr = {};
  sym.forEach(function (x) { var m = /~(\d+)$/.exec(x.reihe), b = basisVon(x.reihe); nr[b] = Math.max(nr[b] || 1, m ? +m[1] : 1); });
  roh.sort(function (a, b) {
    var ra = sym[a.s].reihe, rb = sym[b.s].reihe, ba = basisVon(ra), bb = basisVon(rb);
    return ba < bb ? -1 : ba > bb ? 1 : a.tag - b.tag || (ra < rb ? -1 : ra > rb ? 1 : 0);
  });
  var vorAbschnitt = {}, wechseln = 0, basen = {}, ab3 = {};
  var tr = roh.map(function (x) {
    var r = sym[x.s].reihe, b = basisVon(r), k = ++nr[b], name = b + '~' + k;
    var e = { reihe: r, basis: b, bauReihe: sym[x.s].vorgaenger || r, letzterVor: kal.tage[x.vor], tag: kal.tage[x.tag], tage: x.tage,
      zeilenVor: x.zeilenVor, zeilenNach: zeilen[x.s] - x.zeilenVor, vorAbschnitt: vorAbschnitt[r] || r, nachfolger: name };
    if (!vorAbschnitt[r]) wechseln += e.zeilenNach;              // je Reihe einmal: alle Zeilen ab der ERSTEN Luecke wechseln
    vorAbschnitt[r] = name; basen[b] = 1;
    if (k >= 3) (ab3[b] = ab3[b] || []).push(name);
    return e;
  });
  return { kennung: LUECKEN_KENNUNG, entschiedenAus: panelOrdner, panelKennung: panel.stand.kennung, panelStand: panel.stand.stand, panelZeilen: gesamt,
    schwelleKalendertage: K.LUECKE_TRENN_TAGE, bisTag: kal.tage[maxTag],
    zaehler: { luecken: tr.length, reihen: Object.keys(vorAbschnitt).length, basisKuerzel: Object.keys(basen).length, zeilenWechseln: wechseln,
      kurzluecken: kurz, nummerAb3: ab3 },
    trennungen: tr };
}

/** Trennliste fuer den Bau (paneldaten.js --luecken). Fehlt sie oder passt sie nicht zur Konfiguration: Abbruch. */
function lueckenLaden() {
  if (!fs.existsSync(LUECKEN_DATEI)) throw new Error('luecken-trennungen.json fehlt - erst `node kuerzelwechsel.js --luecken voll/panel`');
  var j = JSON.parse(fs.readFileSync(LUECKEN_DATEI, 'utf8'));
  if (j.kennung !== LUECKEN_KENNUNG || j.schwelleKalendertage !== K.LUECKE_TRENN_TAGE || !Array.isArray(j.trennungen) || !j.bisTag)
    throw new Error('luecken-trennungen.json passt nicht zur Konfiguration (Kennung, Schwelle ' + K.LUECKE_TRENN_TAGE + ' oder bisTag)');
  return j;
}

/** REIHENTAFEL (Auftrag §1.3, Auskunft statt Urteil): je Basis-Kuerzel mit mehr als einem Abschnitt die Abschnitte in Zeitfolge -
 *  Reihenname, erster/letzter Tag, Zeilenzahl, womit der Abschnitt beginnt, Fall und Beleg des Trockenlaufs (luecken-kandidaten.json),
 *  "dasselbe Papier wie der Vorgaenger: ja / nein / unbekannt". symbole = Eintraege aus _stand.json, jeSym[idx] = {von, bis, n}. */
function reihenAbschnitte(symbole, jeSym, kal, panelKennung) {
  var KAND = {}, kandDa = false;
  try { JSON.parse(fs.readFileSync(path.join(__dirname, 'luecken-kandidaten.json'), 'utf8')).kandidaten.forEach(function (k) { KAND[k.reihe + '@' + k.ersterNach] = k; }); kandDa = true; }
  catch (e) { kandDa = false; }
  var PAPIER = { I: 'nein', II: 'nein', III: 'ja', IV: 'unbekannt' }, EMITTENT = { I: 'unbekannt', II: 'ja', III: 'ja', IV: 'unbekannt' };
  var je = {}, z = { basisKuerzel: 0, abschnitte: 0, beginn: {}, faelle: {}, dasselbePapier: {} };
  symbole.forEach(function (r, i) {
    var q = jeSym[i] || null, b = basisVon(r.reihe);
    var e = { reihe: r.reihe, von: q ? kal.tage[q.von] : null, bis: q ? kal.tage[q.bis] : null, zeilen: q ? q.n : 0, lebend: r.lebend, ende_grund: r.ende_grund, ende_datum: r.ende_datum };
    if (r.luecke) {
      var k = KAND[r.luecke.reiheV21 + '@' + r.luecke.tag] || null;
      e.beginn = 'luecke'; e.reiheV21 = r.luecke.reiheV21; e.letzterTagVor = r.luecke.letzterVor; e.lueckeKalendertage = r.luecke.tage;
      e.fall = k ? k.fall : null; e.beleg = k ? k.belege : null; e.belegText = k ? k.fallGrund : (kandDa ? 'nicht im Trockenlauf' : 'luecken-kandidaten.json fehlt');
      e.dasselbePapierWieVorgaenger = k ? PAPIER[k.fall] : 'unbekannt'; e.derselbeEmittentWieVorgaenger = k ? EMITTENT[k.fall] : 'unbekannt';
      e.quellen = k ? { polygon: k.polygon, cusip: k.cusip, yahoo: k.yahoo, nameChanges: k.nameChanges, endeSaetze: k.endeSaetze, anfangSaetze: k.anfangSaetze } : null;
    } else if (r.kuerzelwechsel && r.kuerzelwechsel.nachfolger === r.reihe) {
      var w = r.kuerzelwechsel;
      e.beginn = 'kuerzelwechsel'; e.reiheV21 = r.reihe; e.letzterTagVor = w.letzterVor; e.lueckeHandelstage = w.luecke; e.fall = null;
      e.beleg = ['name_changes Regel ' + w.regel + ': ' + w.old_symbol + '->' + w.new_symbol + ' ' + w.datum]; e.belegText = 'v2.1: Kuerzelwechsel mit Luecke >= ' + K.WECHSEL_MIN_LUECKE_TAGE + ' Handelstagen';
      e.dasselbePapierWieVorgaenger = 'nein'; e.derselbeEmittentWieVorgaenger = 'nein'; e.quellen = null;
    } else if (/~\d+$/.test(r.reihe)) {
      e.beginn = 'archiv-zweite-reihe'; e.reiheV21 = r.reihe; e.fall = null; e.beleg = ['_lebenszeit.json: wiederverwendet / zweiteReihe']; e.belegText = 'Archiv fuehrt die zweite Firma als eigene Reihe';
      e.dasselbePapierWieVorgaenger = 'nein'; e.derselbeEmittentWieVorgaenger = 'nein'; e.quellen = null;
    } else { e.beginn = 'reihenanfang'; e.reiheV21 = r.reihe; }
    (je[b] = je[b] || []).push(e);
  });
  var aus = {};
  Object.keys(je).sort().forEach(function (b) {
    if (je[b].length < 2) return;
    je[b].sort(function (x, y) { return (x.von || '9') < (y.von || '9') ? -1 : (x.von || '9') > (y.von || '9') ? 1 : (x.reihe < y.reihe ? -1 : 1); });
    je[b].forEach(function (e, i) {
      e.nr = i + 1; e.vorgaenger = i ? je[b][i - 1].reihe : null;
      z.abschnitte++; z.beginn[e.beginn] = (z.beginn[e.beginn] || 0) + 1;
      if (e.beginn === 'luecke') { z.faelle[e.fall] = (z.faelle[e.fall] || 0) + 1; }
      if (i) z.dasselbePapier[e.dasselbePapierWieVorgaenger] = (z.dasselbePapier[e.dasselbePapierWieVorgaenger] || 0) + 1;
    });
    aus[b] = je[b]; z.basisKuerzel++;
  });
  return { kennung: 'querschnitt-pruefstand-2026-09-13/reihen-abschnitte/v1', panel: panelKennung,
    regel: 'Jede Luecke > ' + K.LUECKE_TRENN_TAGE + ' Kalendertage zwischen zwei aufeinanderfolgenden Tageszeilen beginnt eine neue Reihe (ohne Beleg-Bedingung). Fall/Beleg sind AUSKUNFT aus dem Trockenlauf Nr. 64 (luecken-kandidaten.json), kein Urteil: I = anderer Emittent oder neues Papier belegt, II = derselbe Emittent, neues Papier, III = dasselbe Papier, IV = kein Beleg.',
    felder: 'je Basis-Kuerzel die Abschnitte in Zeitfolge: reihe, von, bis, zeilen, beginn (reihenanfang | luecke | kuerzelwechsel | archiv-zweite-reihe), vorgaenger (Abschnitt davor), reiheV21 (Reihe, zu der die Zeilen in v2.1 gehoerten), fall, beleg, dasselbePapierWieVorgaenger, derselbeEmittentWieVorgaenger, quellen (Polygon-Inhaber mit cik NACH der Luecke, CUSIP beidseits, Yahoo-Beginn, name_changes) - fuer die Bilanz-Zuordnung der getrennten Reihen.',
    zaehler: z, kuerzel: aus };
}

var NUR_LUECKEN = require.main === module && process.argv.indexOf('--luecken') !== -1;
if (NUR_LUECKEN) {
  /* node kuerzelwechsel.js --luecken voll/panel   -> schreibt luecken-trennungen.json (und NICHT die Kuerzelwechsel-Kandidaten) */
  var LT = lueckenSammeln(process.argv[process.argv.indexOf('--luecken') + 1]);
  fs.writeFileSync(LUECKEN_DATEI + '.tmp', JSON.stringify(LT, null, 1)); fs.renameSync(LUECKEN_DATEI + '.tmp', LUECKEN_DATEI);
  process.stdout.write('Luecken > ' + K.LUECKE_TRENN_TAGE + ' Kalendertage: ' + JSON.stringify(LT.zaehler) + ' bis ' + LT.bisTag + ' -> ' + LUECKEN_DATEI + '\n');
}

if (require.main === module && !NUR_LUECKEN) {
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

module.exports = { sammeln: sammeln, laden: laden, diagnose: diagnose, entscheiden: entscheiden, DATEI: DATEI, datumAus: datumAus,
  lueckenSammeln: lueckenSammeln, lueckenLaden: lueckenLaden, reihenAbschnitte: reihenAbschnitte, basisVon: basisVon, LUECKEN_DATEI: LUECKEN_DATEI };
