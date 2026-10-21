'use strict';
/* DER LAEUFER der Pruefstrasse (FORM.md; Auftrag Nr. 110 §2).
 *   node pruefstrasse/laeufer.js --pruefen <kennung>              Form, test.js, Siegel 1 moeglich?  (Rueckgabe 0 = gueltig)
 *   node pruefstrasse/laeufer.js --kandidat <kennung> [--trocken]  ein Kandidat durch die Strasse (--trocken: nur Zaehlungen)
 *   node pruefstrasse/laeufer.js --naechster [--trocken]           der aelteste gueltige Kandidat der Warteschlange
 *   node pruefstrasse/laeufer.js --nachmessen <kennung> --grund "<Text>" --korrektur <commit>   NUR PM (Nr. 121-1): ein Urteil nach einer
 *        belegten Korrektur des Messgeraets ersetzen - alte Ausgabe nach erledigt/<kennung>/v<n>-<datum>/, Lauf wie --kandidat, Register ersetzt
 *   node pruefstrasse/laeufer.js --messen <kennung> --phase entdeckung|pruefung --aus <datei>   (intern: ein Adapterlauf im Kindprozess)
 * Ablauf je Kandidat, jeder Schritt mit Zeile in erledigt/<kennung>/LAUF.log: Siegel 1 - Entdeckung (alle Konfigurationen, bis
 * ENTDECKUNG_BIS) - Gegenproben - Kandidatenliste KANDIDATEN.json committet (Siegel 2) - Pruefung ab SPERRE_AB nur fuer Kandidaten
 * (Daten erst nach Siegel 2 lesbar) - Urteil - Register - ERGEBNIS.md, ergebnis.json, belegstand-eintrag.md - Anhang an
 * wiki/belegstand.md unter "## Pruefstrasse (automatisch gemessen)" und eine Zeile in wiki/log.md, ein Commit auf dem aktuellen Zweig.
 * Kein Push. Der Kopf des Belegstands wird nie angefasst. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var SG = require('./siegel.js');

var URTEILE = ['belegt-Vorschlag', 'nicht entscheidbar', 'nein', 'Messgeraet-Fehler'];
var PFLICHT = ['kennung', 'form', 'titel', 'quelle', 'erwartung', 'konfigurationen', 'autor', 'datum'];
var SCHNITTSTELLE = { tag: ['signal'], korb: ['zielfunktion', 'placeboZiel'], minute: ['key', 'grund', 'zeitrahmen', 'haltedauerKerzen', 'signal'] };
var BEWERTUNGEN = ['topf', 'zeit'];          /* Tag-Form, Nr. 118 (FORM.md §3): Vorgabe topf; der Adapter prueft dasselbe (adapter/tag.js BEWERTUNGEN) */

function jetzt() { return new Date().toISOString(); }
function rel(p) { return path.relative(K.REPO, p).replace(/\\/g, '/'); }
function liesJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function schreibeJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 1) + '\n'); }
function de(x, n) { return x == null || x !== x ? '–' : (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(n == null ? 4 : n).replace('.', ','); }
function ganz(x) { return x == null ? '–' : String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function datumDe(iso) { var p = iso.slice(0, 10).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

/* ---------- Form pruefen (FORM.md §1-§4) ---------- */
function ladeKandidat(kennung) {
  var ordner = path.join(K.WARTESCHLANGE, kennung), fehler = [], kand = null, regel = null;
  if (!/^[a-z0-9-]+$/.test(kennung)) fehler.push('Kennung nur [a-z0-9-]');
  if (!fs.existsSync(ordner)) return { kennung: kennung, ordner: ordner, fehler: ['Ordner fehlt: ' + rel(ordner)] };
  ['kandidat.json', 'REGEL.md', 'regel.js', 'test.js'].forEach(function (f) { if (!fs.existsSync(path.join(ordner, f))) fehler.push(f + ' fehlt'); });
  if (fehler.length) return { kennung: kennung, ordner: ordner, fehler: fehler };
  try { kand = liesJson(path.join(ordner, 'kandidat.json')); } catch (e) { return { kennung: kennung, ordner: ordner, fehler: ['kandidat.json unlesbar: ' + e.message] }; }
  PFLICHT.forEach(function (f) { if (kand[f] == null || kand[f] === '') fehler.push('kandidat.json ohne ' + f); });
  if (kand.kennung !== kennung) fehler.push('kennung ' + kand.kennung + ' passt nicht zum Ordner ' + kennung);
  if (K.FORMEN.indexOf(kand.form) === -1) fehler.push('form muss tag | korb | minute sein');
  if (!Array.isArray(kand.konfigurationen) || !kand.konfigurationen.length) fehler.push('konfigurationen leer');
  else {
    var keys = {};
    kand.konfigurationen.forEach(function (c, i) {
      if (!c || !c.key) fehler.push('Konfiguration ' + i + ' ohne key'); else if (keys[c.key]) fehler.push('key doppelt: ' + c.key); else keys[c.key] = true;
      if (kand.form === 'tag') { if (c.richtung !== 'long' && c.richtung !== 'short') fehler.push(c.key + ': richtung long|short'); if (!(c.haltedauer >= 1 && c.haltedauer <= 60)) fehler.push(c.key + ': haltedauer 1..60'); }
    });
  }
  if (!kand.erwartung || !kand.erwartung.groesse || !kand.erwartung.richtung) fehler.push('erwartung braucht groesse und richtung');
  if (kand.bewertung != null) {
    if (kand.form !== 'tag') fehler.push('bewertung gibt es nur in der Form tag');
    else if (BEWERTUNGEN.indexOf(kand.bewertung) === -1) fehler.push('bewertung muss topf | zeit sein (' + JSON.stringify(kand.bewertung) + ')');
  }
  var regelText = fs.readFileSync(path.join(ordner, 'REGEL.md'), 'utf8'), versatzGrund = null;
  if (regelText.trim().length < 200) fehler.push('REGEL.md zu kurz (Prosa mit Fundstellen)');
  /* Nachlieferung Nr. 118: versatzTage (Verschiebungs-Gegenprobe) ganze Zahl 5..60; gesetzt nur mit Begruendung in REGEL.md unter einer Ueberschrift "Versatz" */
  if (kand.versatzTage != null) {
    var v = kand.versatzTage;
    if (kand.form !== 'tag') fehler.push('versatzTage gibt es nur in der Form tag');
    else if (!(Number.isInteger(v) && v >= 5 && v <= 60)) fehler.push('versatzTage muss eine ganze Zahl 5..60 sein (' + JSON.stringify(v) + ')');
    versatzGrund = versatzAbschnitt(regelText);
    if (!versatzGrund) fehler.push('versatzTage gesetzt, aber REGEL.md ohne Ueberschrift "Versatz" mit Begruendung (mindestens 20 Zeichen)');
  }
  /* Nr. 121-1: topfRadius (Modus zeit, lokaler Topf) ganze Zahl in Handelstagen, fuer JEDE Konfiguration 2 H .. 12 H; gesetzt nur mit Begruendung in
   * REGEL.md unter einer Ueberschrift "Topfradius"; Vorgabe 4 H braucht keinen Absatz (adapter/tag.js topfRadiusVon prueft dasselbe) */
  var topfRadiusGrund = null;
  if (kand.topfRadius != null) {
    var r = kand.topfRadius;
    if (kand.form !== 'tag' || kand.bewertung !== 'zeit') fehler.push('topfRadius gibt es nur in der Form tag mit bewertung zeit');
    else (kand.konfigurationen || []).forEach(function (c) {
      var lo = K.TOPF_RADIUS.min * c.haltedauer, hi = K.TOPF_RADIUS.max * c.haltedauer;
      if (!(Number.isInteger(r) && r >= lo && r <= hi)) fehler.push('topfRadius muss eine ganze Zahl ' + lo + '..' + hi + ' sein (' + K.TOPF_RADIUS.min + ' H .. ' + K.TOPF_RADIUS.max + ' H fuer ' + c.key + ', H = ' + c.haltedauer + '; ' + JSON.stringify(r) + ')');
    });
    topfRadiusGrund = versatzAbschnitt(regelText, 'Topfradius');
    if (!topfRadiusGrund) fehler.push('topfRadius gesetzt, aber REGEL.md ohne Ueberschrift "Topfradius" mit Begruendung (mindestens 20 Zeichen)');
  }
  /* A9 (Nr. 121-1): der Korb-Adapter misst genau eine Konfiguration (adapter/korb.js liest konfigurationen[0]) */
  if (kand.form === 'korb' && Array.isArray(kand.konfigurationen) && kand.konfigurationen.length !== 1) fehler.push('korb: genau eine Konfiguration (FORM.md §2), nicht ' + kand.konfigurationen.length);
  try {
    regel = require(path.join(ordner, 'regel.js'));
    (SCHNITTSTELLE[kand.form] || []).forEach(function (f) { if (regel[f] == null) fehler.push('regel.js ohne ' + f + ' (Form ' + kand.form + ')'); });
    if (kand.form === 'tag' && kand.daten && kand.daten !== 'panel' && kand.daten !== 'trendkanal-tage') fehler.push('daten muss panel | trendkanal-tage sein');
  } catch (e) { fehler.push('regel.js laedt nicht: ' + e.message); }
  return { kennung: kennung, ordner: ordner, kand: kand, regel: regel, fehler: fehler, versatzGrund: versatzGrund, topfRadiusGrund: topfRadiusGrund };
}
/** Text unter der Markdown-Ueberschrift "Versatz" (oder name, Nr. 121-1: "Topfradius") bis zur naechsten Ueberschrift, Leerraum zusammengezogen,
 *  hoechstens 400 Zeichen; null, wenn es sie nicht gibt oder weniger als 20 Zeichen folgen. */
function versatzAbschnitt(text, name) {
  var kopf = name || 'Versatz';
  if (!/^[A-Za-z]+$/.test(kopf)) throw new Error('Abschnittsname nur Buchstaben');
  var m = new RegExp('^#{1,6}[ \\t]*' + kopf + '\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,6}[ \\t]|$(?![\\s\\S]))', 'm').exec(text.replace(/\r\n/g, '\n'));
  if (!m) return null;
  var t = m[1].replace(/\s+/g, ' ').trim();
  return t.length >= 20 ? (t.length > 400 ? t.slice(0, 397) + '...' : t) : null;
}
/** --pruefen: Form, test.js (eigener Prozess), Siegel 1. */
function pruefen(kennung, opt) {
  opt = opt || {};
  var L = ladeKandidat(kennung), bericht = { kennung: kennung, form: L.fehler, test: null, siegel1: null, gueltig: false };
  var sperre = opt.nachmessung ? null : nachmessSperre(kennung);
  if (sperre) bericht.form.push(sperre);
  if (!L.fehler.length) {
    var t = cp.spawnSync(process.execPath, [path.join(L.ordner, 'test.js')], { cwd: K.REPO, encoding: 'utf8', timeout: 300000 });
    bericht.test = { status: t.status, letzteZeile: String(t.stdout || '').trim().split('\n').pop(), fehler: String(t.stderr || '').slice(0, 500) };
    if (t.status !== 0) bericht.form.push('test.js rot (Status ' + t.status + ')');
    try { bericht.siegel1 = SG.siegel1(K.REPO, rel(L.ordner)); } catch (e) { bericht.siegel1 = { fehler: e.message }; if (!opt.ohneSiegel) bericht.form.push(e.message); }
  }
  bericht.gueltig = bericht.form.length === 0;
  return bericht;
}
/** --naechster: aeltester (datum, dann Kennung) gueltiger Kandidat, der noch kein ergebnis.json hat. */
function naechster(ort) {
  ort = ort || {};
  var WS = ort.warteschlange || K.WARTESCHLANGE, ERL = ort.erledigt || K.ERLEDIGT;
  if (!fs.existsSync(WS)) return null;
  var liste = fs.readdirSync(WS).filter(function (d) { return fs.existsSync(path.join(WS, d, 'kandidat.json')); })
    .map(function (d) { var k = null; try { k = liesJson(path.join(WS, d, 'kandidat.json')); } catch (e) { k = {}; } return { kennung: d, datum: String(k.datum || '9999') }; })
    .sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : (a.kennung < b.kennung ? -1 : 1); });
  for (var i = 0; i < liste.length; i++) {
    var k = liste[i].kennung;
    if (fs.existsSync(path.join(ERL, k, 'ergebnis.json'))) continue;
    /* Nachbesserung QS F1: nachgemessen (v<n>-<datum>/ergebnis.json) oder Nachmessung laeuft/abgebrochen (Marke) -> nie als frischer Kandidat */
    if (nachmessSperre(k, ort)) { console.log('naechster: ' + k + ' uebersprungen - ' + nachmessSperre(k, ort)); continue; }
    if (pruefen(k).gueltig) return k;
  }
  return null;
}

/* ---------- Register (§6) ---------- */
function register() { return fs.existsSync(K.REGISTER) ? liesJson(K.REGISTER) : { kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 }; }
/* Zahl fuer den Bericht - ein leeres Register (erster Lauf, Trockenlauf) hat noch keine Erwartung (PM 11.10.: Trockenlauf stuerzte an .toFixed). */
function zufallText(Rg) { return typeof Rg.zufallErwartet === 'number' ? Rg.zufallErwartet.toFixed(1) : '–'; }
function registerEintragen(Rg, kennung, form, konf, datum, bewertung, zusatz) {
  Rg.konfigurationen = Rg.konfigurationen.filter(function (e) { return e.kennung !== kennung; });   /* ersetzt, nie doppelt (auch bei Nachmessung) */
  konf.forEach(function (k) { var e = { kennung: kennung, form: form, key: k.key, urteil: k.urteil, datum: datum }; if (bewertung) e.bewertung = bewertung; if (zusatz) Object.keys(zusatz).forEach(function (f) { e[f] = zusatz[f]; }); Rg.konfigurationen.push(e); });
  Rg.gesamt = Rg.konfigurationen.length; Rg.zufallErwartet = Rg.gesamt * K.ZUFALL_JE_KONFIGURATION; Rg.stand = datum;
  return Rg;
}

/* ---------- Holm (einseitig, alpha ueber m) ---------- */
function holm(pListe, m, alpha) {
  var idx = pListe.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return a.p - b.p; });
  var bestanden = new Array(pListe.length).fill(false), schwelle = new Array(pListe.length).fill(null), weiter = true;
  idx.forEach(function (e, k) { var s = alpha / (m - k); schwelle[e.i] = s; if (weiter && e.p != null && e.p <= s) bestanden[e.i] = true; else weiter = false; });
  return { bestanden: bestanden, schwelle: schwelle };
}

/* ---------- Ein Adapterlauf im Kindprozess (--messen) ---------- */
var SPERRDATEI = path.join(K.HIER, '.panel.lock');
function panelSperre() {
  for (var v = 0; v < 360; v++) {
    if (fs.existsSync(SPERRDATEI)) {
      var pid = +fs.readFileSync(SPERRDATEI, 'utf8'), lebt = false;
      try { process.kill(pid, 0); lebt = pid !== process.pid; } catch (e) { lebt = false; }
      if (lebt) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10000); continue; }
    }
    fs.writeFileSync(SPERRDATEI, String(process.pid)); return;
  }
  throw new Error('ein anderer Panel-Prozess haelt ' + rel(SPERRDATEI) + ' seit einer Stunde');
}
function messen(kennung, phase, ausDatei, extra) {
  var L = ladeKandidat(kennung);
  if (L.fehler.length) throw new Error('Kandidat ungueltig: ' + L.fehler.join('; '));
  var kand = L.kand, regel = L.regel, pruefzeit = phase === 'pruefung', siegelPfad = 'pruefstrasse/erledigt/' + kennung + '/KANDIDATEN.json';
  var keys = pruefzeit ? liesJson(path.join(K.ERLEDIGT, kennung, 'KANDIDATEN.json')).kandidaten.map(function (x) { return x.key; }) : null;
  panelSperre();
  var E;
  try {
    if (kand.form === 'tag') E = require('./adapter/tag.js').lauf(regel, kand, { quelle: kand.daten || 'panel', pruefzeit: pruefzeit, siegelPfad: siegelPfad, pruefung: keys, tafel: extra && extra.tafel });
    else if (kand.form === 'korb') { var mK = (register().gesamt || 0) + 1; E = require('./adapter/korb.js').lauf(regel, kand, { pruefzeit: pruefzeit, siegelPfad: siegelPfad, pruefung: pruefzeit ? { von: '2023-01-03' } : null, placeboBuecher: K.korbBuecher(mK), registerM: mK }); }
    else E = require('./adapter/minute.js').lauf(regel, kand, { pruefzeit: pruefzeit, siegelPfad: siegelPfad });
  } finally { try { if (+fs.readFileSync(SPERRDATEI, 'utf8') === process.pid) fs.unlinkSync(SPERRDATEI); } catch (e) { /* Sperre ist Komfort */ } }
  E.kennung = kennung; E.form = kand.form; E.phase = phase; E.stand = jetzt(); E.konfigurationenSoll = kand.konfigurationen.length;
  if (ausDatei) schreibeJson(ausDatei, E);
  return E;
}
function messenImKind(kennung, phase, ausDatei, log) {
  var args = ['--max-old-space-size=6144', __filename, '--messen', kennung, '--phase', phase, '--aus', ausDatei];
  var r = cp.spawnSync(process.execPath, args, { cwd: K.REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 6 * 3600 * 1000 });
  String(r.stdout || '').trim().split('\n').filter(Boolean).slice(-5).forEach(function (z) { log('  [' + phase + '] ' + z.slice(0, 300)); });
  if (r.status !== 0) throw new Error('Adapterlauf ' + phase + ' gescheitert (Status ' + r.status + '): ' + String(r.stderr || '').trim().split('\n').slice(0, 4).join(' | ').slice(0, 800));
  return liesJson(ausDatei);
}

/* ---------- Urteil (FORM §5) ---------- */
/** A15 (Nr. 121-1): obere 95-%-Grenze netto der Pruefung - tag: uNetto.obere; minute: netto + 1,96 |netto / t|; korb: keine (null, nie "nein" aus der Pruefung). */
function obereGrenze(pr) {
  if (!pr) return null;
  if (pr.uNetto) return pr.uNetto.obere != null ? pr.uNetto.obere : null;
  if (pr.nettoJeSignalPp != null && pr.t) return pr.nettoJeSignalPp + 1.96 * Math.abs(pr.nettoJeSignalPp / pr.t);
  return null;
}
function urteile(E, P, Rg) {
  var konf = E.konfigurationen, fehler = [];
  if (E.verstoesse > 0) fehler.push('Blick nach vorn: ' + E.verstoesse + ' Verstoesse (' + (E.beispiele || []).slice(0, 3).join(', ') + ')');
  /* Gegenprobe "Signal um versatzTage verschoben" (A3, Nr. 121-1: zweiseitig, beide Modi, dieselbe Regel wie der Placebo "anderer Wert"): zeigt das
   * verschobene Signal einen Ausschlag (|u brutto| > 2 se und > 1/4 Huerde, adapter/tag.js versatz.verstoss) - in welche Richtung auch immer, und
   * unabhaengig vom Signal selbst -, sitzt die Wirkung im Messgeraet (Kalender, Topf, Zelle, Daten), nicht in der Regel. Verschobene Fenster, die ein
   * Signalfenster derselben Reihe schneiden, sind dabei nicht gewertet (B-V5). Alte ergebnis-Dateien ohne `verstoss` lesen `wirkt`. */
  konf.forEach(function (k) {
    var v = k.versatz; if (!v || !(v.verstoss != null ? v.verstoss : v.wirkt)) return;
    var u = v.uBrutto || v.uNetto;
    fehler.push(k.key + ': das um ' + (E.versatzTage || K.VERSATZ_TAGE) + ' Tage verschobene Signal zeigt einen Ausschlag (brutto ' + de(u.mittel) + ', t ' + de(u.t, 2) + '; Schranke ' + K.PLACEBO_T + ' se und ' + de(v.schranke ? v.schranke.mindestPp : null) + ' Pp, zweiseitig)');
  });
  var kandidaten = konf.filter(function (k) { return k.kandidat; });
  var urteil, grund;
  if (fehler.length) { urteil = 'Messgeraet-Fehler'; grund = fehler.join('; '); }
  else if (kandidaten.length && !P) { urteil = 'nicht entscheidbar'; grund = 'Kandidaten ohne Pruefung: ' + kandidaten.map(function (k) { return k.key; }).join(', '); }
  else if (P) {
    var zeilen = kandidaten.map(function (k) { var p = (P.konfigurationen.filter(function (x) { return x.key === k.key; })[0] || {}).pruefung; return { key: k.key, p: p && p.pEinseitig != null ? p.pEinseitig : 1, pr: p }; });
    var H1 = holm(zeilen.map(function (z) { return z.p; }), konf.length, K.HOLM_ALPHA), H2 = holm(zeilen.map(function (z) { return z.p; }), Math.max(konf.length, Rg.gesamt), K.HOLM_ALPHA);
    zeilen.forEach(function (z, i) {
      var pr = z.pr || {}, netto = pr.uNetto ? pr.uNetto.mittel : (pr.buch ? pr.buch.startphasen.median : pr.nettoJeSignalPp);
      z.holm = H1.bestanden[i]; z.holmSchwelle = H1.schwelle[i]; z.holmRegister = H2.bestanden[i]; z.belegt = z.holm && pr.gleicheRichtung !== false && netto > 0;
      z.netto = netto;
      var k = konf.filter(function (x) { return x.key === z.key; })[0]; k.pruefung = pr; k.holm = z.holm; k.holmSchwelle = z.holmSchwelle; k.holmRegister = z.holmRegister; k.belegt = z.belegt;
      var ob = obereGrenze(pr); k.obereGrenzePruefung = ob;
      k.urteil = z.belegt ? 'belegt-Vorschlag' : (ob != null && ob < 0) ? 'nein' : 'nicht entscheidbar';
    });
    var belegt = zeilen.filter(function (z) { return z.belegt; });
    if (belegt.length) { urteil = 'belegt-Vorschlag'; grund = belegt.map(function (z) { return z.key; }).join(', ') + ' bestehen Holm ueber ' + konf.length + ' Konfigurationen (einseitig 5 %), gleiche Richtung, netto > 0' + (belegt.every(function (z) { return z.holmRegister; }) ? '; auch Holm ueber das Register (' + Rg.gesamt + ')' : '; NICHT Holm ueber das Register (' + Rg.gesamt + ')'); }
    else if (konf.every(function (k) { return k.urteil === 'nein'; })) { urteil = 'nein'; grund = 'jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0, Entdeckung bzw. Pruefung)'; }
    else { urteil = 'nicht entscheidbar'; grund = 'Pruefung ohne Holm-Treffer (p ' + zeilen.map(function (z) { return z.key + ' ' + z.p.toFixed(3); }).join(', ') + ')'; }
  } else if (konf.every(function (k) { return k.urteil === 'nein'; })) { urteil = 'nein'; grund = 'jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)'; }
  else { urteil = 'nicht entscheidbar'; grund = 'kein Kandidat (' + konf.filter(function (k) { return k.urteil === 'nein'; }).length + ' von ' + konf.length + ' ausgeschlossen, Rest unter der Aufloesung)'; }
  return { urteil: urteil, grund: grund, kandidaten: kandidaten.length, fehler: fehler };
}

/* ---------- Berichte ---------- */
function zeileTag(k) {
  var e = k.entdeckung, u = e.uNetto;
  return '| ' + k.key + ' | ' + k.richtung + ' ' + k.haltedauer + ' T | ' + e.nTage + ' | ' + ganz(e.nTr) + ' | ' + de(e.uBrutto.mittel) + ' | ' + de(u.mittel) + ' | ' + de(u.t, 2) + ' | ' + de(u.se) + ' | ' + de(k.mde80) + ' | ' +
    (k.tor1 ? 'ja' : 'nein') + ' | ' + (k.placebo.verstoss ? 'VERSTOSS' : k.placebo.entfaellt ? 'entfaellt (zeit)' : de(k.placebo.uBrutto.mittel) + ' (t ' + de(k.placebo.uBrutto.t, 2) + ')') + ' | ' + de(k.versatz.uNetto.mittel) + ' (t ' + de(k.versatz.uNetto.t, 2) + ')' + ' | ' +
    de(k.spaet.uNetto.mittel) + ' | ' + de(k.lebend.deltaAlleLebend) + ' | ' + e.abgaenge.map(function (a) { return a.gruppe.slice(0, 4) + ' ' + a.n; }).join(', ') + ' | ' + k.urteil +
    (k.pruefung ? ' | ' + k.pruefung.nTage + ' / ' + de(k.pruefung.uNetto.mittel) + ' / ' + de(k.pruefung.uNetto.t, 2) + (k.belegt ? ' Holm ja' : '') : '') + ' |';
}
function zeileKorb(k) {
  var e = k.entdeckung, b = e.buch;
  return '| ' + k.key + ' | ' + e.fenster.von + '–' + e.fenster.bis + ' | ' + ganz(b.buchEnde) + ' $ / ' + ganz(b.spyEnde) + ' $ | ' + de(b.abstandPa, 2) + ' | ' + de(b.startphasen.median, 2) + ' | ' + b.startphasen.vorDemMarkt + ' von ' + b.startphasen.anzahl + ' | ' +
    e.rang + ' von ' + e.von + ' (Median ' + de(e.zufall.median, 2) + ', P95 ' + de(e.zufall.p95, 2) + ') | ' + de(b.rueckschlagBuch, 1) + ' % | ' + JSON.stringify(b.abgaenge) + ' | ' + k.urteil +
    (k.pruefung && k.pruefung.buch ? ' | ' + de(k.pruefung.buch.startphasen.median, 2) + ' / Rang ' + k.pruefung.rang + (k.belegt ? ' Holm ja' : '') : '') + ' |';
}
function zeileMinute(k) {
  var e = k.entdeckung;
  return '| ' + k.key + ' | ' + ganz(e.signale) + ' | ' + de(e.bruttoJeSignalPp) + ' | ' + de(e.huerdePp, 2) + ' | ' + de(e.nettoJeSignalPp) + ' | ' + de(e.t, 2) + ' | ' + de(e.mdePp) + ' | ' + de(e.delta80Pp) + ' | ' + (e.urteilMaschine || '–') + ' | ' + k.urteil +
    (k.pruefung ? ' | ' + de(k.pruefung.nettoJeSignalPp) + ' / ' + de(k.pruefung.t, 2) + (k.belegt ? ' Holm ja' : '') : '') + ' |';
}
var KOPF = {
  tag: '| Konf | Richtung, H | Ent Tage | Trades | u brutto | u netto | t | se HH | MDE80 | Tor 1 | Placebo | verschoben 20 T | Ein-/Ausstieg +1 T | Δ alle−lebend | Abgaenge | Urteil | Pruefung Tage / netto / t |',
  korb: '| Konf | Fenster | Buch / SPY | Abstand p. a. | Median 63 | vorn | Rang gegen 200 Zufallsbuecher | Rueckschlag | Reihenenden | Urteil | Pruefung Median / Rang |',
  minute: '| Konf | Signale | brutto je Signal | Huerde | netto je Signal | t | MDE | delta80 | Maschine | Urteil | Pruefung netto / t |',
};
function ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, trocken, nachmessung) {
  var konf = E.konfigurationen, o = [];
  o.push('# ' + kand.titel + ' — ' + (trocken ? 'TROCKENLAUF (nur Zaehlungen)' : '**' + U.urteil + '**'));
  o.push('');
  if (nachmessung) { o.push(nachmessungAbsatz(nachmessung, E)); o.push(''); }
  o.push('**Kurzfassung.** Kandidat `' + kand.kennung + '` (Form ' + kand.form + modusText(kand, E) + ', ' + konf.length + ' Konfigurationen, vorab festgelegt), gemessen ' + datumDe(E.stand) + ' auf ' + E.quelle + ' (' + (E.kennungTafel || E.archiv || '') + ').' +
    (trocken ? ' Trockenlauf: keine Urteile.' : ' **Urteil: ' + U.urteil + '** — ' + U.grund + '. Kandidaten nach der Entdeckung: ' + U.kandidaten + '.') +
    ' Register: ' + Rg.gesamt + ' Konfigurationen bisher insgesamt geprueft, ' + zufallText(Rg) + ' Zufallstreffer (t ≥ 2) zu erwarten.' +
    ' Erwartung vorab: ' + kand.erwartung.groesse + ' (' + kand.erwartung.richtung + ').');
  o.push('');
  o.push('Siegel 1 (Kandidatenordner) `' + (siegel1 ? siegel1.commit.slice(0, 12) : '–') + '`' + (siegel2 ? ', Siegel 2 (KANDIDATEN.json) `' + siegel2.commit.slice(0, 12) + '`' : ', kein Siegel 2 (keine Pruefung)') +
    '. Entdeckung bis ' + (E.schnitt ? 'vor ' + E.schnitt : K.ENTDECKUNG_BIS) + ', Pruefung ab ' + (E.form === 'minute' ? K.MINUTE.sperreAb : K.SPERRE_AB) + ' nur fuer Kandidaten. Kriterien: netto > 0, t ≥ ' + K.KANDIDAT_T +
    ' (Kandidaten-Kriterium), Tor 1 (Entdeckung ≥ ' + K.TOR1_FAKTOR + ' × projizierte Bestaetigungs-MDE' + (kand.form === 'tag' ? ', gesperrt = netto ≥ 11,31 × se' : '') + '), kein Placebo-Verstoss (|Placebo| > ' + K.PLACEBO_T + ' se und > ¼ Huerde); das verschobene Signal mit derselben Schranke zweiseitig (sonst Messgeraet-Fehler); MDE80 = ' + K.MDE_FAKTOR + ' × se ist die Aufloesung, kein Kriterium.');
  o.push('');
  o.push('## Konfigurationen');
  o.push('');
  var versatz = E.versatzTage || K.VERSATZ_TAGE, kopf = kand.form === 'tag' ? KOPF.tag.replace('verschoben 20 T', 'verschoben ' + versatz + ' T') : KOPF[kand.form];
  o.push(kopf); o.push(kopf.replace(/[^|]+/g, '---'));
  konf.forEach(function (k) { o.push(kand.form === 'tag' ? zeileTag(k) : kand.form === 'korb' ? zeileKorb(k) : zeileMinute(k)); });
  o.push('');
  var zeit = kand.form === 'tag' && E.bewertung === 'zeit';
  o.push('Alle Groessen in Pp' + (kand.form === 'korb' ? ' p. a. bzw. $' : ' je Trade/Signal (Tagesmittel), se Hansen-Hodrick') + '. ' + (kand.form === 'tag' ? 'Gegenproben: ' + (zeit ? 'Placebo "anderer Wert gleicher Klasse am selben Tag" entfaellt im Modus zeit (traefe dieselbe Zelle); Placebo ist hier das verschobene Signal' : 'Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung') + '; verschoben = dasselbe Signal ' + versatz + ' Handelstage spaeter (zeigt es einen Ausschlag in eine der beiden Richtungen, ist das Messgeraet verdaechtig; Fenster mit Ueberschneidung eines Signalfensters der Reihe gezaehlt, nicht gewertet); Ein-/Ausstieg +1 T = Einstieg und Ausstieg einen Handelstag spaeter (gleiche Haltedauer); Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige / zensiert = Reihe endet nur an der Sperre).' : kand.form === 'korb' ? 'Placebo = ' + (E.placeboBuecher || 200) + ' Zufallsbuecher derselben Zielzahl aus denselben zulaessigen Werten (Nr. 100; B = max(200, 20 m + 1), m = ' + (E.registerM != null ? E.registerM : '–') + ', p-Boden ' + (E.pBoden != null ? E.pBoden.toFixed(4).replace('.', ',') : '–') + '); Startphasen = 63 Starttage; Reihenenden getrennt nach Grund. Die Gegenproben "Signal verschoben" und "alle gegen lebend" sind fuer diese Form nicht abbildbar (die Zielfunktion lehnt veraltete Kurse ab; Reihenenden buchen nach der Hauptregel).' : 'Zahlen der Messmaschine (Bestaetigungshaelfte ihres Schnitts B5); Placebo und Kontrolle A7 der Maschine im Protokoll.'));
  if (kand.form === 'tag') {
    /* Nr. 118: Bewertungsmodus, Signaltage als Cluster, Anteil der Reihen mit Signal am Signaltag, Versatz der Verschiebung, Warnungen des Adapters */
    var SA = E.signalAnteil, pz = function (x) { return x == null ? '–' : (100 * x).toFixed(0) + ' %'; }, jeTag = function (x) { return x == null ? '–' : x.toFixed(1).replace('.', ','); };
    o.push('');
    o.push('**Bewertung ' + (E.bewertung || 'topf') + '.** ' + (E.bewertungDetail || '') + (SA && SA.tage > 0 ? ' Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): im Mittel ' + pz(SA.mittel) + ', hoechstens ' + pz(SA.max) + ' (' + SA.tageUeber50 + ' von ' + SA.tage + ' Signaltagen ueber 50 %).' : '') +
      ' Verschiebungs-Gegenprobe: Versatz ' + versatz + ' Handelstage' + (kand.versatzTage != null ? ', Grund: ' + (E.versatzGrund || 'siehe REGEL.md, Abschnitt "Versatz"') : ' (Vorgabe)') + '.');
    o.push('Signaltage und Trades (Entdeckung): ' + konf.map(function (k) { var e = k.entdeckung; return k.key + ' ' + e.nTage + ' Signaltage / ' + ganz(e.nTr) + ' Trades (' + jeTag(e.tradesJeTag) + ' je Signaltag)' + (zeit && k.versatz && k.versatz.ueberlappung && k.versatz.ueberlappung.anteil != null ? ', verschobene Fenster mit Ueberschneidung eines Signalfensters ' + pz(k.versatz.ueberlappung.anteil) : ''); }).join('; ') +
      '. Die Aufloesung (se Hansen-Hodrick ueber die Tagesreihe, Lag = Haltedauer) haengt an der Zahl der Signaltage, nicht an der Zahl der Trades' + (zeit ? ' - bei einer marktweiten Regel ist jeder Signaltag ein Cluster, die effektive Zahl ist die Zahl der Ereignisfenster' : '') + '.');
    (E.warnungen || []).forEach(function (w) { o.push('**WARNUNG:** ' + w); });
    messgeraetDetails(kand, E).forEach(function (z) { o.push(z); });
  }
  o.push('');
  o.push('## Zaehler und Quelle');
  o.push('');
  o.push('`' + JSON.stringify(E.zaehler || {}) + '`' + (E.verstoesse != null ? ' — Verstoesse gegen „kein Blick nach vorn": ' + E.verstoesse : '') + (E.ms ? ' — Laufzeit ' + JSON.stringify(E.ms) : ''));
  o.push('Quelle: ' + E.quelle + (E.reihen ? ', ' + E.reihen + ' Reihen, letzter Tag ' + E.letzterTag : '') + (E.korb ? ', Korb ' + E.korb : '') + '. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.');
  return o.join('\n') + '\n';
}
/** Nr. 121-1 (Auftrag Teil E): Zahlen des Messgeraets je Konfiguration, alle als Text neben der Tabelle (Tag-Form). */
function messgeraetDetails(kand, E) {
  var o = [''], konf = E.konfigurationen, Z = E.zaehler || {}, pz = function (x) { return x == null || x !== x ? '–' : (100 * x).toFixed(1).replace('.', ',') + ' %'; };
  o.push('## Messgeraet (Nr. 121-1)');
  o.push('');
  konf.forEach(function (k) {
    var e = k.entdeckung, se = e.uNetto.se, v = k.versatz || {}, ub = v.ueberlappung || {}, eo = e.uNettoEroeffnung;
    var z = '- **' + k.key + '.** Tor 1 verlangt netto ≥ ' + de(k.tor1FaktorSe, 2) + ' × se = ' + de(k.tor1Schwelle, 2) + ' Pp; MDE80 = ' + K.MDE_FAKTOR.toFixed(2).replace('.', ',') + ' × se = ' + de(k.mde80, 2) + ' Pp (se ' + de(se) + ').' +
      ' Netto mit Eroeffnungshuerde (nachrichtlich, Huerde × 2,68 / 2,46 / 2,07 / 1,81 je Klasse, Minutenstudie; Urteil auf der Kassa-Huerde): ' + de(eo && eo.mittel) + ' (t ' + de(eo && eo.t, 2) + ', Huerde je Trade ' + de(e.kKandEroeffnung) + ' statt ' + de(e.kKand) + ').' +
      ' Verschoben: brutto ' + de(v.uBrutto && v.uBrutto.mittel) + ' (t ' + de(v.uBrutto && v.uBrutto.t, 2) + '), Schranke zweiseitig ' + K.PLACEBO_T + ' se und ' + de(v.schranke && v.schranke.mindestPp) + ' Pp' + (v.verstoss ? ' — **VERSTOSS**' : '') + '; Ueberschneidung mit einem Signalfenster ' + ganz(ub.n) + ' von ' + ganz(ub.von) + ' (' + pz(ub.anteil) + '), nicht gewertet.' +
      ' Abgaenge: ' + (e.abgaenge || []).map(function (a) { return a.gruppe + ' ' + a.n; }).join(', ') + ' (zensiert = Reihe endet nur an der Sperre, kein Abgang).';
    var zt = k.zeitTopf;
    if (zt && zt.art === 'lokal') z += ' **Lokaler Topf:** R = ' + zt.R + ' Handelstage, HH-Lag ' + zt.hhLag + ', Topf-n je Trade Median ' + zt.topfN.median + ', Min ' + zt.topfN.min + ', Anteil n = 1 ' + pz(zt.topfN.anteilN1) + ' (mindestens ' + zt.nMin + '), topfFehlt ' + ganz(zt.topfFehlt) + ', Topf-Mittel ' + de(zt.topfMittel) + '; nachrichtlich (kein Urteil): gegen den globalen Topf ohne Ausschluss netto ' + de(zt.global.uNetto.mittel) + ' (t ' + de(zt.global.uNetto.t, 2) + '), R = 2 H netto ' + de(zt.sensitivitaet.R2H.uNetto.mittel) + ' (t ' + de(zt.sensitivitaet.R2H.uNetto.t, 2) + '), R = 8 H netto ' + de(zt.sensitivitaet.R8H.uNetto.mittel) + ' (t ' + de(zt.sensitivitaet.R8H.uNetto.t, 2) + '); Zufallsplan-Rang: ' + zt.zufallsplanRang + '. Topf-Starttage relativ zum Signal (Abstand:Anzahl): ' + (zt.histogramm || []).map(function (h) { return h[0] + ':' + h[1]; }).join(' ') + '.';
    if (k.pruefung) z += ' Pruefung: n_eff ' + de(k.pruefung.nEff, 1) + ', df ' + de(k.pruefung.df, 1) + ', p einseitig (t-Verteilung) ' + de(k.pruefung.pEinseitig) + ' (Phi: ' + de(k.pruefung.pEinseitigNormal) + ').';
    o.push(z);
  });
  var zeilen = (Z.ohneKlasse || 0) + (Z.zeilenJeKlasse || []).reduce(function (s, x) { return s + x; }, 0);
  if (zeilen > 0 && Z.zeilenJeKlasse) {
    var uni = konf.map(function (k) { var kl = k.klassen || [0, 1, 2, 3], n = 0; kl.forEach(function (c) { n += Z.zeilenJeKlasse[c] || 0; }); return k.key + ' ' + pz(n / zeilen); }).join(', ');
    o.push('- **Ohne Klasse:** ' + pz(Z.ohneKlasse / zeilen) + ' der Zeilen, ' + ganz(Z.reihenOhneKlasse) + ' von ' + ganz(Z.reihen) + ' Reihen nie mit Klasse — Median-Dollarumsatz unter 5 Mio $ (dort gibt es keine Kassa-Huerde) oder Anlaufzeit (die Klasse braucht 40 von 60 Vortagen); Universum mit den Klassen der Konfiguration: ' + uni + ' der Zeilen.');
  }
  if (Z.cooldown != null) o.push('- **Cooldown** (' + K.COOLDOWN_TAGE + ' Handelstage je Richtung, vor dem Klassenfilter wie in der Referenz): ' + ganz(Z.cooldown) + ' Signale gesperrt, davon ' + ganz(Z.cooldownDurchOhneKlasse) + ' durch ein nicht gebuchtes Signal (Klasse ohne Konfiguration).');
  return o;
}
/** ", Bewertung topf|zeit" fuer Kurzfassung, Belegstand-Zeile und Log (Tag-Form, Nr. 118); andere Formen leer. */
function modusText(kand, E) { return kand.form === 'tag' ? ', Bewertung ' + ((E && E.bewertung) || kand.bewertung || 'topf') : ''; }
function belegstandAbsatz(kand, E, U, Rg, siegel1, siegel2, nachmessung) {
  var vorsatz = nachmessung ? '**Nachmessung ' + nachmessung.n + '** (ersetzt den Absatz vom ' + datumDe(nachmessung.alt.stand) + ', Grund: ' + nachmessung.grund + ', Korrektur `' + nachmessung.korrektur.slice(0, 7) + '`' + (nachmessung.blickePruefzeit > 0 ? '; ' + (nachmessung.blickePruefzeit + 1) + '. Blick auf die Pruefzeit' : '') + ') ' : '';
  var konf = E.konfigurationen, beste = konf.slice().sort(function (a, b) { return (bNetto(b) || -1e9) - (bNetto(a) || -1e9); })[0];
  function bNetto(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.mittel : e.buch ? e.buch.startphasen.median : e.nettoJeSignalPp; }
  function bT(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.t : e.buch ? null : e.t; }
  return '- ' + datumDe(E.stand) + ' — ' + vorsatz + '**' + kand.titel + '** (`' + kand.kennung + '`, Form ' + kand.form + modusText(kand, E) + ', ' + konf.length + ' Konfigurationen): **' + U.urteil + '** — ' + U.grund + '. ' +
    'Beste Entdeckungszeile ' + beste.key + ': netto ' + de(bNetto(beste), kand.form === 'korb' ? 2 : 4) + (bT(beste) != null ? ' (t ' + de(bT(beste), 2) + ')' : '') +
    (beste.tor1FaktorSe != null ? '; Tor 1 verlangt netto ≥ ' + de(beste.tor1FaktorSe, 2) + ' × se = ' + de(beste.tor1Schwelle, 2) + ' Pp; MDE80 = ' + K.MDE_FAKTOR.toFixed(2).replace('.', ',') + ' × se = ' + de(beste.mde80, 2) + ' Pp' : ', MDE80 ' + de(beste.mde80)) + '. ' +
    'Register: ' + Rg.gesamt + ' Konfigurationen bisher, ' + zufallText(Rg) + ' Zufallstreffer erwartet. Ordner `pruefstrasse/erledigt/' + kand.kennung + '/`, Siegel 1 `' + siegel1.commit.slice(0, 7) + '`' + (siegel2 ? ', Siegel 2 `' + siegel2.commit.slice(0, 7) + '`' : '') + '. Quelle ' + E.quelle + '.';
}

/* ---------- Git (ein Befehl, nur genannte Pfade) ---------- */
function commit(pfade, nachricht) {
  var add = SG.git(K.REPO, ['add', '--'].concat(pfade));
  if (add.status !== 0) throw new Error('git add scheitert: ' + add.stderr.toString('utf8'));
  var c = SG.git(K.REPO, ['commit', '-q', '-m', nachricht + '\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>', '--'].concat(pfade));
  if (c.status !== 0) throw new Error('git commit scheitert: ' + c.stderr.toString('utf8') + c.stdout.toString('utf8'));
  return SG.aus(SG.git(K.REPO, ['rev-parse', 'HEAD']));
}

/* ---------- Der Lauf ---------- */
function laufe(kennung, opt) {
  opt = opt || {};
  var aus = path.join(K.ERLEDIGT, kennung); fs.mkdirSync(aus, { recursive: true });
  var logDatei = path.join(aus, 'LAUF.log');
  function log(t) { var z = jetzt() + '  ' + t; fs.appendFileSync(logDatei, z + '\n'); console.log(z); }
  log('START ' + kennung + (opt.trocken ? ' (trocken)' : '') + ' auf Zweig ' + SG.aus(SG.git(K.REPO, ['rev-parse', '--abbrev-ref', 'HEAD'])));
  var P1 = pruefen(kennung, { nachmessung: !!opt.nachmessung });
  if (!P1.gueltig) { log('ABBRUCH: Kandidat ungueltig: ' + P1.form.join('; ')); return { urteil: null, abbruch: P1.form }; }
  log('Form gueltig, test.js gruen (' + P1.test.letzteZeile + ')');
  var siegel1 = P1.siegel1; log('Siegel 1: Kandidatenordner in Commit ' + siegel1.commit + ', nichts Ungesichertes');
  var L = ladeKandidat(kennung), kand = L.kand;
  log('Entdeckung bis ' + (kand.form === 'minute' ? 'vor ' + K.MINUTE.sperreAb : K.ENTDECKUNG_BIS) + ' ueber ' + kand.konfigurationen.length + ' Konfigurationen (Form ' + kand.form + ', Adapter ' + kand.form + ', Quelle ' + (kand.daten || (kand.form === 'tag' ? 'panel' : kand.form === 'korb' ? 'panel' : '60m-archiv')) + modusText(kand, null) + ')');
  var E = messenImKind(kennung, 'entdeckung', path.join(aus, 'ergebnis-entdeckung.json'), log);
  if (E.konfigurationen.length !== kand.konfigurationen.length) throw new Error('Adapter lieferte ' + E.konfigurationen.length + ' statt ' + kand.konfigurationen.length + ' Konfigurationen');
  if (kand.form === 'tag') { E.versatzGrund = L.versatzGrund || null; if (kand.versatzTage != null) log('Verschiebungs-Gegenprobe: Versatz ' + E.versatzTage + ' Handelstage statt Vorgabe ' + K.VERSATZ_TAGE + ', Grund (REGEL.md "Versatz"): ' + E.versatzGrund); }
  log('Entdeckung fertig: ' + JSON.stringify(E.zaehler || {}).slice(0, 400) + (E.verstoesse != null ? ' | Verstoesse ' + E.verstoesse : ''));
  if (E.signalAnteil && E.signalAnteil.tage > 0) log('Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel ' + (100 * E.signalAnteil.mittel).toFixed(1) + ' %, max ' + (100 * E.signalAnteil.max).toFixed(1) + ' %, ' + E.signalAnteil.tageUeber50 + ' von ' + E.signalAnteil.tage + ' Signaltagen ueber 50 %' + modusText(kand, E));
  (E.warnungen || []).forEach(function (w) { log('WARNUNG: ' + w); });
  E.konfigurationen.forEach(function (k) { var e = k.entdeckung; log('  ' + k.key + ': ' + (e.uNetto ? 'Tage ' + e.nTage + ', Trades ' + e.nTr + ', netto ' + de(e.uNetto.mittel) + ', t ' + de(e.uNetto.t, 2) : e.buch ? 'Median ' + de(e.buch.startphasen.median, 2) + ', Rang ' + e.rang + '/' + e.von : 'Signale ' + e.signale + ', netto ' + de(e.nettoJeSignalPp) + ', t ' + de(e.t, 2)) + (opt.trocken ? '' : ' -> ' + k.urteil + (k.gruende && k.gruende.length ? ' (' + k.gruende.join(', ') + ')' : ''))); });
  var Rg = register();
  if (opt.trocken) {
    var T = { kennung: kennung, trocken: true, stand: E.stand, konfigurationen: E.konfigurationen.length, zaehler: E.zaehler, verstoesse: E.verstoesse, trades: E.konfigurationen.map(function (k) { return { key: k.key, nTage: k.entdeckung.nTage, nTr: k.entdeckung.nTr, signale: k.entdeckung.signale }; }) };
    schreibeJson(path.join(aus, 'TROCKEN.json'), T);
    fs.writeFileSync(path.join(aus, 'ERGEBNIS-TROCKEN.md'), ergebnisMarkdown(kand, E, { urteil: '–', grund: '', kandidaten: 0 }, Rg, siegel1, null, true));
    log('TROCKEN: nur Zaehlungen geschrieben (TROCKEN.json, ERGEBNIS-TROCKEN.md), kein Urteil, kein Siegel 2, kein Wiki-Eintrag');
    return { trocken: true, zaehler: E.zaehler };
  }
  /* Gegenproben und Kandidatenliste */
  var U0 = urteile(E, null, Rg);
  var kandidaten = E.konfigurationen.filter(function (k) { return k.kandidat; });
  log('Gegenproben: ' + (U0.fehler.length ? 'FEHLER - ' + U0.fehler.join('; ') : 'ohne Befund') + '; Kandidaten ' + kandidaten.length + ' von ' + E.konfigurationen.length);
  var sum = SG.sha256(fs.readFileSync(path.join(aus, 'ergebnis-entdeckung.json')));
  schreibeJson(path.join(aus, 'KANDIDATEN.json'), { kennung: kennung, stand: E.stand, ergebnisEntdeckungSha256: sum, konfigurationen: E.konfigurationen.length,
    regel: 'FORM.md §5: netto > 0, t >= ' + K.KANDIDAT_T + ', Tor 1, kein Placebo-Verstoss', messgeraetFehler: U0.fehler,
    kandidaten: kandidaten.map(function (k) { var e = k.entdeckung; return { key: k.key, netto: e.uNetto ? e.uNetto.mittel : e.buch ? e.buch.startphasen.median : e.nettoJeSignalPp, t: e.uNetto ? e.uNetto.t : e.t, tor1Schwelle: k.tor1Schwelle || null }; }) });
  var relAus = 'pruefstrasse/erledigt/' + kennung;
  var h2 = commit([relAus + '/KANDIDATEN.json', relAus + '/ergebnis-entdeckung.json'], 'Pruefstrasse: ' + kennung + ' - Kandidatenliste (Siegel 2), ' + kandidaten.length + ' von ' + E.konfigurationen.length);
  var siegel2 = SG.pruefeSiegel(K.REPO, relAus + '/KANDIDATEN.json');
  log('Siegel 2: KANDIDATEN.json committet in ' + h2 + ' (Blob ' + siegel2.blob.slice(0, 12) + ')');
  var P = null;
  if (kandidaten.length && !U0.fehler.length) {
    log('Pruefung ab ' + (kand.form === 'minute' ? K.MINUTE.sperreAb : K.SPERRE_AB) + ' fuer ' + kandidaten.map(function (k) { return k.key; }).join(', ') + ' (Daten erst jetzt lesbar)');
    P = messenImKind(kennung, 'pruefung', path.join(aus, 'ergebnis-pruefung.json'), log);
    log('Pruefung fertig' + (P.verstoesse != null ? ', Verstoesse ' + P.verstoesse : ''));
  } else log(kandidaten.length ? 'Keine Pruefung: Messgeraet-Fehler' : 'Keine Pruefung: kein Kandidat');
  var NM = opt.nachmessung || null, zusatz = NM ? { nachmessung: NM.n, ersetzt: NM.alt.stand } : null;
  var U = urteile(E, P, registerEintragen(JSON.parse(JSON.stringify(Rg)), kennung, kand.form, E.konfigurationen, E.stand, E.bewertung, zusatz));
  if (NM && U.urteil === 'belegt-Vorschlag') U.grund += ' - nach Nachmessung: zweiter unabhaengiger Lauf durch den PM Pflicht';
  log('URTEIL: ' + U.urteil + ' - ' + U.grund);
  Rg = registerEintragen(Rg, kennung, kand.form, E.konfigurationen, E.stand, E.bewertung, zusatz); schreibeJson(K.REGISTER, Rg);
  log('Register: ' + Rg.gesamt + ' Konfigurationen insgesamt, ' + Rg.zufallErwartet.toFixed(2) + ' Zufallstreffer erwartet');
  var ergebnis = { kennung: kennung, form: kand.form, titel: kand.titel, stand: E.stand, urteil: U.urteil, grund: U.grund, kandidaten: U.kandidaten, messgeraetFehler: U.fehler,
    siegel1: siegel1, siegel2: siegel2, register: { gesamt: Rg.gesamt, zufallErwartet: Rg.zufallErwartet }, entdeckung: E, pruefung: P, nachmessung: NM };
  schreibeJson(path.join(aus, 'ergebnis.json'), ergebnis);
  fs.writeFileSync(path.join(aus, 'ERGEBNIS.md'), ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, false, NM));
  var absatz = belegstandAbsatz(kand, E, U, Rg, siegel1, siegel2, NM);
  fs.writeFileSync(path.join(aus, 'belegstand-eintrag.md'), absatz + '\n');
  /* Belegstand: nur anhaengen unter der festen Ueberschrift, der Kopf bleibt unberuehrt */
  var bs = path.join(K.REPO, 'wiki', 'belegstand.md'), text = fs.readFileSync(bs, 'utf8'), ueber = '## Prüfstraße (automatisch gemessen)';
  if (text.indexOf(ueber) === -1) text = text.replace(/\s*$/, '\n\n' + ueber + '\n\nJeder Absatz hier stammt vom Läufer (`pruefstrasse/laeufer.js`), nicht von einer Sitzung; Zahlen und Urteil stehen in `pruefstrasse/erledigt/<kennung>/`. Ein `belegt-Vorschlag` ist ein Vorschlag an den PM (zweiter unabhängiger Lauf bleibt Menschensache), kein Beleg.\n');
  text = text.replace(/\s*$/, '\n' + absatz + '\n');
  fs.writeFileSync(bs, text);
  var lg = path.join(K.REPO, 'wiki', 'log.md'), hhmm = new Date().toISOString().slice(11, 16);
  fs.appendFileSync(lg, '- ' + datumDe(E.stand) + ' (Prüfstraße, ' + hhmm + ' UTC) — ' + (NM ? 'Nachmessung ' + NM.n + ' ' : '') + '**' + kennung + ': ' + U.urteil + '** (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten; Register ' + Rg.gesamt + '). Ordner `pruefstrasse/erledigt/' + kennung + '/`.\n');
  var pfade = [relAus + '/ERGEBNIS.md', relAus + '/ergebnis.json', relAus + '/belegstand-eintrag.md', relAus + '/LAUF.log', 'pruefstrasse/register.json', 'wiki/belegstand.md', 'wiki/log.md'];
  if (P) pfade.push(relAus + '/ergebnis-pruefung.json');
  if (NM) pfade = [relAus].concat(pfade.filter(function (x) { return x.indexOf(relAus + '/') !== 0; }));   /* Nachmessung: der ganze Ordner (Verschiebung nach v<n> und neue Dateien) */
  if (U.urteil === 'belegt-Vorschlag') {
    fs.appendFileSync(K.VORSCHLAEGE, (fs.existsSync(K.VORSCHLAEGE) ? '' : '# Vorschlaege der Pruefstrasse an den PM (zweiter unabhaengiger Lauf ist Menschensache)\n\n') + absatz + '\n');
    pfade.push('pruefstrasse/VORSCHLAEGE.md');
    log('belegt-Vorschlag in pruefstrasse/VORSCHLAEGE.md eingetragen');
  }
  log('ENDE ' + U.urteil + ' - Belegstand und Log angehaengt, Commit folgt');
  if (NM && NM.marke && fs.existsSync(NM.marke)) fs.unlinkSync(NM.marke);       /* Marke nie in den Commit (Ordner-Pfadspezifikation); bei Fehler schreibt nachmessen sie neu */
  var h3 = commit(pfade, 'Pruefstrasse: ' + kennung + ' - ' + (NM ? 'Nachmessung ' + NM.n + ': ' : '') + U.urteil + ' (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten)');
  console.log(jetzt() + '  Commit ' + h3);
  return { urteil: U.urteil, grund: U.grund, commit: h3, siegel1: siegel1.commit, siegel2: siegel2.commit };
}

/* ---------- Nachmessung (Nr. 121-1, Auftrag Teil C; nur PM, nie der Nachtlauf) ----------
 * Die REGEL wird nie nachgemessen, nur das Geraet: Voraussetzung ist ein erledigtes Protokoll, ein unveraenderter Kandidatenordner (gleicher Baum
 * wie im Commit von ergebnis.json.siegel1) und ein belegter Messgeraet-Fehler mit dem Commit seiner Korrektur (--korrektur, Vorfahr von HEAD).
 * Die alte Ausgabe wandert nach erledigt/<kennung>/v<n>-<datum der alten Messung>/ (Dateien verschoben, der Abschlusscommit nimmt den ganzen Ordner
 * - git sieht die Umbenennung); das Register ERSETZT die Zeilen der Kennung (Feld nachmessung, ersetzt); der alte Belegstand-Absatz bleibt
 * unveraendert stehen (append-only), der neue nennt, wen er ersetzt. ort = { repo, erledigt, warteschlange } nur fuer Tests (Temp-Repo). */
var NACHMESS_DATEIEN = ['ERGEBNIS.md', 'ergebnis.json', 'ergebnis-entdeckung.json', 'ergebnis-pruefung.json', 'KANDIDATEN.json', 'LAUF.log', 'belegstand-eintrag.md', 'ERGEBNIS-TROCKEN.md', 'TROCKEN.json'];
function nachmessungPruefen(kennung, grund, korrektur, ort) {
  ort = ort || {};
  var repo = ort.repo || K.REPO, erl = path.join(ort.erledigt || K.ERLEDIGT, kennung), ordnerAbs = path.join(ort.warteschlange || K.WARTESCHLANGE, kennung);
  var ordnerRel = path.relative(repo, ordnerAbs).replace(/\\/g, '/'), fehler = [];
  if (!/^[a-z0-9-]+$/.test(String(kennung))) fehler.push('Kennung nur [a-z0-9-]');
  if (!grund || String(grund).trim().length < 20) fehler.push('--grund fehlt oder ist kuerzer als 20 Zeichen (belegter Messgeraet-Fehler)');
  if (!korrektur || !/^[0-9a-f]{7,40}$/.test(String(korrektur))) fehler.push('--korrektur <commit> fehlt (Commit der Korrektur des Messgeraets)');
  var altPfad = path.join(erl, 'ergebnis.json');
  if (!fs.existsSync(altPfad)) fehler.push('kein erledigtes Protokoll: ' + path.relative(repo, altPfad).replace(/\\/g, '/') + ' fehlt');
  if (fehler.length) throw new Error('NACHMESSUNG abgelehnt: ' + fehler.join('; '));
  var alt = liesJson(altPfad), korr = SG.aus(SG.git(repo, ['rev-parse', '--verify', '--quiet', korrektur + '^{commit}']));
  if (!korr) throw new Error('NACHMESSUNG abgelehnt: --korrektur ' + korrektur + ' ist kein Commit');
  if (SG.git(repo, ['merge-base', '--is-ancestor', korr, 'HEAD']).status !== 0) throw new Error('NACHMESSUNG abgelehnt: Korrektur ' + korr.slice(0, 7) + ' liegt nicht auf dem aktuellen Zweig');
  /* Nachbesserung QS F2: die Korrektur liegt NACH der Vormessung (Nachfahre des Ergebnis-Commits = letzter Commit von erledigt/<k>/ergebnis.json,
   * ersatzweise Siegel 2) und ist ein Messgeraet-Commit (aendert eine Datei unter pruefstrasse/ ausserhalb erledigt/ und warteschlange/) */
  var ergRel = path.relative(repo, altPfad).replace(/\\/g, '/'), ergCommit = SG.aus(SG.git(repo, ['log', '-1', '--format=%H', '--', ergRel])) || (alt.siegel2 && alt.siegel2.commit) || '';
  if (!/^[0-9a-f]{40}$/.test(ergCommit)) throw new Error('NACHMESSUNG abgelehnt: Commit der Vormessung (' + ergRel + ') nicht gefunden');
  if (korr === ergCommit || SG.git(repo, ['merge-base', '--is-ancestor', ergCommit, korr]).status !== 0) throw new Error('NACHMESSUNG abgelehnt: Korrektur ' + korr.slice(0, 7) + ' liegt nicht nach der Vormessung (kein Nachfahre von ' + ergCommit.slice(0, 7) + ') - ein Messgeraet-Fehler wird nach dem Urteil korrigiert');
  var geaendert = (SG.aus(SG.git(repo, ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', korr])) || '').split('\n').filter(function (f) { return /^pruefstrasse\//.test(f) && !/^pruefstrasse\/(erledigt|warteschlange)\//.test(f); });
  if (!geaendert.length) throw new Error('NACHMESSUNG abgelehnt: Korrektur ' + korr.slice(0, 7) + ' aendert keine Datei des Messgeraets (pruefstrasse/ ausserhalb erledigt/ und warteschlange/) - ein Kandidaten- oder Ergebnis-Commit ist keine Korrektur');
  var korrTitel = SG.aus(SG.git(repo, ['log', '-1', '--format=%s', korr])) || '';
  if (!alt.siegel1 || !alt.siegel1.commit) throw new Error('NACHMESSUNG abgelehnt: ergebnis.json ohne siegel1');
  var s1 = SG.siegel1(repo, ordnerRel);                                           /* wirft bei Ungesichertem */
  var baumAlt = SG.aus(SG.git(repo, ['rev-parse', alt.siegel1.commit + ':' + ordnerRel])), baumNeu = SG.aus(SG.git(repo, ['rev-parse', s1.commit + ':' + ordnerRel]));
  if (!baumAlt || baumAlt !== baumNeu) throw new Error('NACHMESSUNG abgelehnt: der Kandidatenordner hat sich seit Siegel 1 der Vormessung (' + alt.siegel1.commit.slice(0, 7) + ') veraendert - die Regel wird nie nachgemessen, nur das Geraet');
  var vorher = fs.readdirSync(erl).filter(function (d) { return /^v\d+-\d{4}-\d{2}-\d{2}$/.test(d) && fs.statSync(path.join(erl, d)).isDirectory(); });
  var n = vorher.length + 1, ziel = 'v' + n + '-' + String(alt.stand || '').slice(0, 10);
  var blicke = (alt.pruefung != null ? 1 : 0) + vorher.filter(function (d) { var f = path.join(erl, d, 'ergebnis.json'); return fs.existsSync(f) && liesJson(f).pruefung != null; }).length;
  var konf = ((alt.entdeckung && alt.entdeckung.konfigurationen) || []).map(function (k) { var e = k.entdeckung || {}; return { key: k.key, netto: e.uNetto ? e.uNetto.mittel : null, t: e.uNetto ? e.uNetto.t : null, urteil: k.urteil }; });
  return { n: n, grund: String(grund).trim(), korrektur: korr, korrekturTitel: korrTitel, korrekturDateien: geaendert, vormessungCommit: ergCommit, repo: repo, ziel: ziel, erledigt: erl, blickePruefzeit: blicke,
    alt: { stand: alt.stand, urteil: alt.urteil, grund: alt.grund, ordner: path.relative(repo, path.join(erl, ziel)).replace(/\\/g, '/'), konf: konf, pruefungGelesen: alt.pruefung != null, siegel1: alt.siegel1.commit } };
}
/** Alte Ausgabe nach erledigt/<kennung>/<ziel>/ verschieben (nur die bekannten Ausgabedateien; ergebnis.json zuletzt geprueft). */
function nachmessungVerschieben(NM) {
  var zielAbs = path.join(NM.erledigt, NM.ziel);
  if (fs.existsSync(zielAbs)) throw new Error('NACHMESSUNG: ' + NM.ziel + ' gibt es schon');
  fs.mkdirSync(zielAbs);
  var bewegt = [];
  NACHMESS_DATEIEN.forEach(function (f) { var q = path.join(NM.erledigt, f); if (fs.existsSync(q)) { fs.renameSync(q, path.join(zielAbs, f)); bewegt.push(f); } });
  NM.verschoben = bewegt;
  return NM;
}
/** Kopfabsatz der ERGEBNIS.md einer Nachmessung: Grund, wen sie ersetzt, was sich geaendert hat, Vergleich je Konfiguration (alt -> neu). */
function nachmessungAbsatz(NM, E) {
  var neu = {}; (E.konfigurationen || []).forEach(function (k) { var e = k.entdeckung || {}; neu[k.key] = { netto: e.uNetto ? e.uNetto.mittel : null, t: e.uNetto ? e.uNetto.t : null, urteil: k.urteil }; });
  var zeilen = NM.alt.konf.map(function (a) { var b = neu[a.key] || {}; return a.key + ': netto ' + de(a.netto) + ' / t ' + de(a.t, 2) + ' (' + a.urteil + ') -> ' + de(b.netto) + ' / t ' + de(b.t, 2) + ' (' + (b.urteil || '–') + ')'; });
  var grundSatz = NM.grund.replace(/[.\s]+$/, '');
  return '**Nachmessung ' + NM.n + '** (' + datumDe(E.stand || new Date().toISOString()) + '), Grund: ' + grundSatz + '. Korrektur `' + NM.korrektur.slice(0, 12) + '`' + (NM.korrekturTitel ? ' („' + NM.korrekturTitel + '")' : '') + '. Ersetzt v' + (NM.n) + ' vom ' + datumDe(NM.alt.stand) + ' (Urteil ' + NM.alt.urteil + ', Ordner `' + NM.alt.ordner + '/`).' +
    ' Was sich geaendert hat: das Messgeraet laut Korrektur-Commit (' + ((NM.korrekturDateien || []).slice(0, 6).join(', ') || '–') + ((NM.korrekturDateien || []).length > 6 ? ', ...' : '') + '); die Regel (Siegel 1 `' + NM.alt.siegel1.slice(0, 7) + '`) ist unveraendert.' +
    (NM.blickePruefzeit > 0 ? ' **' + (NM.blickePruefzeit + 1) + '. Blick auf die Pruefzeit** (die Vormessung hat sie gelesen).' : ' Die Vormessung hat die Pruefzeit nicht gelesen (kein Kandidat) - die Nachmessung verbraucht kein Holdout.') +
    ' Vergleich (Entdeckung, alt -> neu): ' + zeilen.join('; ') + '.';
}
/** --nachmessen: pruefen, verschieben, Lauf wie --kandidat. */
/** Sperre durch Nachmessung (Nachbesserung QS F1): Text, wenn unter erledigt/<k>/ eine Marke NACHMESSUNG-LAEUFT.json oder irgendein v<n>-<datum>/ergebnis.json
 *  liegt - dann misst weder --naechster noch --kandidat den Kandidaten als frischen; nur --nachmessen (oder der PM nach Aufraeumen). Sonst null. */
var NACHMESS_MARKE = 'NACHMESSUNG-LAEUFT.json';
function nachmessSperre(kennung, ort) {
  var erl = path.join((ort && ort.erledigt) || K.ERLEDIGT, kennung);
  if (!fs.existsSync(erl)) return null;
  if (fs.existsSync(path.join(erl, NACHMESS_MARKE))) { var m = {}; try { m = liesJson(path.join(erl, NACHMESS_MARKE)); } catch (e) { m = {}; } return 'Nachmessung ' + (m.fehler ? 'ABGEBROCHEN (' + String(m.fehler).slice(0, 160) + ')' : 'laeuft') + ' - Marke ' + NACHMESS_MARKE + ' liegt, nur der PM raeumt auf'; }
  var v = fs.readdirSync(erl).filter(function (d) { return /^v\d+-/.test(d) && fs.existsSync(path.join(erl, d, 'ergebnis.json')); });
  return v.length ? 'nachgemessen (' + v.join(', ') + ') - nur --nachmessen misst ihn wieder' : null;
}
/** --nachmessen: pruefen, Marke schreiben, verschieben, Lauf wie --kandidat. Rueckweg (QS F1): scheitert irgendein Schritt nach dem Verschieben, werden
 *  die Teilausgaben des Laufs entfernt, die alte Ausgabe zurueckgestellt, der Index NUR fuer die eigenen Pfade zurueckgesetzt (erledigt/<k>/, Register,
 *  Belegstand, Log - nur wenn sie vorher nicht gestaged waren), Register/Belegstand/Log auf den Stand davor gesetzt (nur wenn der Lauf sie bloss
 *  ergaenzt hat), und die Marke bleibt mit `fehler` liegen. opt = { ort, lauf } nur fuer Tests (Temp-Repo, simulierter Lauf). */
function nachmessen(kennung, grund, korrektur, opt) {
  opt = opt || {};
  var ort = opt.ort || {}, lauf = opt.lauf || laufe, NM = nachmessungPruefen(kennung, grund, korrektur, ort), repo = NM.repo;
  var marke = path.join(NM.erledigt, NACHMESS_MARKE);
  if (fs.existsSync(marke)) throw new Error('NACHMESSUNG abgelehnt: ' + NACHMESS_MARKE + ' liegt schon (laufende oder abgebrochene Nachmessung) - erst aufraeumen');
  var relErl = path.relative(repo, NM.erledigt).replace(/\\/g, '/');
  var weitere = (opt.weiterePfade || ['pruefstrasse/register.json', 'wiki/belegstand.md', 'wiki/log.md', 'pruefstrasse/VORSCHLAEGE.md']);
  var vorher = weitere.map(function (r) { var a = path.join(repo, r); return { rel: r, abs: a, text: fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : null, gestaged: (SG.aus(SG.git(repo, ['diff', '--cached', '--name-only', '--', r])) || '') !== '' }; });
  var erlGestaged = (SG.aus(SG.git(repo, ['diff', '--cached', '--name-only', '--', relErl])) || '') !== '', headVor = SG.aus(SG.git(repo, ['rev-parse', 'HEAD']));
  var M = { kennung: kennung, n: NM.n, grund: NM.grund, korrektur: NM.korrektur, ziel: NM.ziel, zeit: jetzt(), head: headVor };
  schreibeJson(marke, M); NM.marke = marke;
  try {
    nachmessungVerschieben(NM);
    console.log(jetzt() + '  Nachmessung ' + NM.n + ' von ' + kennung + ': alte Ausgabe nach ' + NM.alt.ordner + '/ (' + NM.verschoben.join(', ') + '), Marke ' + NACHMESS_MARKE);
    var r = lauf(kennung, { nachmessung: NM });
    if (!r || r.abbruch) throw new Error('Lauf abgebrochen: ' + JSON.stringify(r && r.abbruch));
    if (fs.existsSync(marke)) fs.unlinkSync(marke);
    return r;
  } catch (fehler) {
    var log = null; try { log = fs.readFileSync(path.join(NM.erledigt, 'LAUF.log'), 'utf8').split('\n').slice(-12).join('\n'); } catch (e) { log = null; }
    var zielAbs = path.join(NM.erledigt, NM.ziel), notizen = [];
    NACHMESS_DATEIEN.forEach(function (f) { var q = path.join(NM.erledigt, f); if (fs.existsSync(q)) fs.unlinkSync(q); });                    /* Teilausgaben des Laufs */
    (NM.verschoben || []).forEach(function (f) { var q = path.join(zielAbs, f); if (fs.existsSync(q)) fs.renameSync(q, path.join(NM.erledigt, f)); });
    if (fs.existsSync(zielAbs) && !fs.readdirSync(zielAbs).length) fs.rmdirSync(zielAbs);
    if (!erlGestaged) SG.git(repo, ['restore', '--staged', '--', relErl]);
    vorher.forEach(function (v) {
      var jetztText = fs.existsSync(v.abs) ? fs.readFileSync(v.abs, 'utf8') : null;
      if (jetztText !== v.text) {
        if (v.text != null && jetztText != null && (jetztText.indexOf(v.text.replace(/\s*$/, '')) === 0 || v.rel === 'pruefstrasse/register.json')) fs.writeFileSync(v.abs, v.text);
        else notizen.push(v.rel + ' veraendert, nicht zurueckgesetzt');
      }
      if (!v.gestaged) SG.git(repo, ['restore', '--staged', '--', v.rel]);
    });
    var headNach = SG.aus(SG.git(repo, ['rev-parse', 'HEAD']));
    if (headNach !== headVor) notizen.push('HEAD bewegt (' + headVor.slice(0, 7) + ' -> ' + headNach.slice(0, 7) + ', vermutlich Siegel-2-Commit der neuen KANDIDATEN.json): der Arbeitsbaum traegt wieder die alte Ausgabe, der PM entscheidet');
    M.fehler = String(fehler && fehler.message || fehler).slice(0, 600); M.abgebrochen = jetzt(); M.notizen = notizen; M.logEnde = log; schreibeJson(marke, M);
    throw new Error('NACHMESSUNG abgebrochen, zurueckgestellt, Marke liegt (' + path.relative(repo, marke).replace(/\\/g, '/') + '): ' + M.fehler + (notizen.length ? ' | ' + notizen.join('; ') : ''));
  }
}

module.exports = { ladeKandidat: ladeKandidat, pruefen: pruefen, naechster: naechster, laufe: laufe, messen: messen, urteile: urteile, holm: holm, register: register,
  registerEintragen: registerEintragen, ergebnisMarkdown: ergebnisMarkdown, belegstandAbsatz: belegstandAbsatz, messgeraetDetails: messgeraetDetails, URTEILE: URTEILE, PFLICHT: PFLICHT,
  nachmessungPruefen: nachmessungPruefen, nachmessungVerschieben: nachmessungVerschieben, nachmessSperre: nachmessSperre, NACHMESS_MARKE: NACHMESS_MARKE, nachmessungAbsatz: nachmessungAbsatz, nachmessen: nachmessen, obereGrenze: obereGrenze, versatzAbschnitt: versatzAbschnitt };

if (require.main === module) {
  var a = process.argv.slice(2), arg = function (n) { var i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; }, trocken = a.indexOf('--trocken') !== -1;
  try {
    if (a.indexOf('--pruefen') !== -1) { var B = pruefen(arg('--pruefen')); console.log(JSON.stringify(B, null, 1)); process.exit(B.gueltig ? 0 : 1); }
    else if (a.indexOf('--messen') !== -1) { messen(arg('--messen'), arg('--phase'), arg('--aus')); console.log('fertig ' + arg('--phase')); }
    else if (a.indexOf('--kandidat') !== -1) { var r = laufe(arg('--kandidat'), { trocken: trocken }); console.log(JSON.stringify(r)); process.exit(r.abbruch ? 1 : 0); }
    else if (a.indexOf('--nachmessen') !== -1) { var rN = nachmessen(arg('--nachmessen'), arg('--grund'), arg('--korrektur')); console.log(JSON.stringify(rN)); process.exit(rN.abbruch ? 1 : 0); }
    else if (a.indexOf('--naechster') !== -1) { var n = naechster(); if (!n) { console.log('Warteschlange: kein gueltiger Kandidat'); process.exit(0); } var r2 = laufe(n, { trocken: trocken }); console.log(JSON.stringify(r2)); process.exit(r2.abbruch ? 1 : 0); }
    else { console.log('--pruefen <kennung> | --kandidat <kennung> [--trocken] | --naechster [--trocken] | --nachmessen <kennung> --grund "<Text>" --korrektur <commit> (nur PM)'); process.exit(2); }
  } catch (e) { console.error(e.stack || e.message); process.exit(1); }
}
