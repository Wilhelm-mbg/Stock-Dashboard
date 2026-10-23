'use strict';
/* DER LAEUFER der Pruefstrasse (FORM.md; Auftrag Nr. 110 §2).
 *   node pruefstrasse/laeufer.js --pruefen <kennung>              Form, test.js, Siegel 1 moeglich?  (Rueckgabe 0 = gueltig)
 *   node pruefstrasse/laeufer.js --kandidat <kennung> [--trocken]  ein Kandidat durch die Strasse (--trocken: nur Zaehlungen)
 *   node pruefstrasse/laeufer.js --naechster [--trocken]           der aelteste gueltige Kandidat der Warteschlange
 *   node pruefstrasse/laeufer.js --nachmessen <kennung> --grund "<Text>" --korrektur <commit>   NUR PM (Nr. 121-1): ein Urteil nach einer
 *        belegten Korrektur des Messgeraets ersetzen - alte Ausgabe nach erledigt/<kennung>/v<n>-<datum>/, Lauf wie --kandidat, Register ersetzt
 *   node pruefstrasse/laeufer.js --nachmessen <kennung> --grund-daten "<Text>"   NUR PM (Nr. 121-2a): Wiedervorlage mit mehr Daten (zaehlt im Register doppelt)
 *   node pruefstrasse/laeufer.js --eichung          NUR PM (Nr. 121-2a): Eichung an Einsaat und Zufall (schreibt nur EICHUNG.md, eichung.json)
 *   node pruefstrasse/laeufer.js --vorwaerts        Vorwaertsbestaetigung (Nr. 121-2a, nachtlauftauglich, idempotent): Signaltage nach dem Stichtag zaehlen
 *        (ohne Renditen); erst wenn der vorregistrierte Bedarf erreicht ist, EINE Messung je Konfiguration, Holm p-basiert ueber alle faelligen
 *   node pruefstrasse/laeufer.js --messen <kennung> --phase zaehlung|entdeckung|pruefung|vorwaerts --aus <datei> [--extra <datei>]   (intern: Kindprozess)
 * Ablauf je Kandidat (Form tag seit Nr. 121-2a), jeder Schritt mit Zeile in erledigt/<kennung>/LAUF.log: Siegel 1 - Machbarkeitstor (Trockenzaehlung
 * ohne Renditen) - Entdeckung der messbaren Konfigurationen bis zum Panel-Ende (ENTDECKUNG_BIS 'panelende'; die Lesesperre gilt nur noch als
 * Eichfenster-Grenze K.EICHUNG) - Gegenproben - Kandidatenliste KANDIDATEN.json committet (Siegel 2) - Kandidaten 'vorgemerkt' fuer die
 * Vorwaertsmessung (keine Pruefzeit mehr; korb/minute wie bisher mit Pruefung ab dem Eichfenster-Ende bzw. minute.sperreAb) - Urteil - Register - ERGEBNIS.md, ergebnis.json, belegstand-eintrag.md - Anhang an
 * wiki/belegstand.md unter "## Pruefstrasse (automatisch gemessen)" und eine Zeile in wiki/log.md, ein Commit auf dem aktuellen Zweig.
 * Kein Push. Der Kopf des Belegstands wird nie angefasst. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var SG = require('./siegel.js');
var TO = require('./tore.js');

/* Nr. 121-2a: "nicht messbar" = das Machbarkeitstor vor dem Lauf (FORM.md §5) - kein Entdeckungslauf, Register-Eintrag mit Gewicht 0 */
var URTEILE = ['belegt-Vorschlag', 'nicht entscheidbar', 'nein', 'Messgeraet-Fehler', 'nicht messbar'];
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
  else if (kand.form === 'tag') erwartungFehler(kand).forEach(function (f) { fehler.push(f); });
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
/** Nr. 121-2a A2: Groessenbehauptung je Konfiguration - erwartung.nettoPp (Pflicht; Zahl oder { key: Zahl }, Pp je Trade nach Kosten),
 *  erwartung.bruttoPp (optional, sonst netto + Kassa-Huerde Klasse 1), erwartung.fensterWieQuelle (optional, true = die Quelle misst dasselbe Fenster).
 *  Die sieben vor dem 23.10.2026 gemessenen Kandidaten lesen ihre Zahl aus pruefstrasse/erwartungen-alt.json (Ordner unveraendert). */
function erwartungFehler(kand) {
  var e = kand.erwartung, f = [], zahl = function (v) { return typeof v === 'number' && isFinite(v); };
  ['nettoPp', 'bruttoPp'].forEach(function (feld) {
    var v = e[feld]; if (v == null) return;
    if (typeof v === 'object') { (kand.konfigurationen || []).forEach(function (c) { if (!zahl(v[c.key])) f.push('erwartung.' + feld + ' ohne Zahl fuer ' + c.key); }); }
    else if (!zahl(v)) f.push('erwartung.' + feld + ' muss eine Zahl (Pp je Trade) oder { key: Zahl } sein');
  });
  if (e.fensterWieQuelle != null && typeof e.fensterWieQuelle !== 'boolean') f.push('erwartung.fensterWieQuelle muss true | false sein');
  if (!f.length) (kand.konfigurationen || []).forEach(function (c) { if (c && c.key && !TO.erwartungFuer(kand, c.key)) f.push('erwartung.nettoPp fehlt fuer ' + c.key + ' (Pflicht seit Nr. 121-2a: behauptete Kante je Trade nach Kosten in Pp, FORM.md §2)'); });
  return f;
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
  /* Nr. 123: beide Panel-Ordner nennen (Kennung, bau, letzter voller Tag) - `panel` fuer Kandidaten/Vorwaerts, `panelEichung` fuer die gesperrte Tafel */
  bericht.panel = {};
  [['panel', K.PANEL], ['panelEichung', K.PANEL_EICHUNG]].forEach(function (p) {
    try {
      var st = liesJson(path.join(p[1], 'panel', '_stand.json'));
      bericht.panel[p[0]] = { ordner: rel(p[1]), kennung: st.kennung, bau: st.bau || null, letzterVollTag: st.letzterVollTag || null };
      if (st.kennung !== K.PANEL_KENNUNG) bericht.form.push(p[0] + ': Kennung ' + st.kennung + ' statt ' + K.PANEL_KENNUNG);
    } catch (e) { bericht.form.push(p[0] + ' nicht lesbar (' + rel(p[1]) + '): ' + e.message.slice(0, 120)); }
  });
  /* Nr. 121-2b B.1: die Marktreihe QQQ (pruefstrasse/daten/qqq-tage.json) - Kennung/Datum falsch = Fehler, aelter als 60 Tage = Warnung */
  try { var DQ = require('./daten/qqq.js'), PQ = DQ.pruefe(DQ.lade()); PQ.fehler.forEach(function (f) { bericht.form.push(f); }); bericht.warnungen = PQ.warnungen; }
  catch (e) { bericht.form.push(e.message); }
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
function register(pfad) { var p = pfad || K.REGISTER; return fs.existsSync(p) ? liesJson(p) : { kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 }; }
/* Zahl fuer den Bericht - ein leeres Register (erster Lauf, Trockenlauf) hat noch keine Erwartung (PM 11.10.: Trockenlauf stuerzte an .toFixed). */
function zufallText(Rg) {
  if (typeof Rg.zufallKandidat === 'number') return 'm = ' + Rg.m + ' gezaehlte Tests (' + Rg.regeln + ' Regeln), unter der Null erwartet ' + Rg.zufallKandidat.toFixed(3).replace('.', ',') + ' Kandidaten und ' + Rg.zufallBelegt.toFixed(4).replace('.', ',') + ' belegt-Vorschlaege (aus df je Eintrag; nachrichtlich t >= 2: ' + (typeof Rg.zufallErwartet === 'number' ? Rg.zufallErwartet.toFixed(1) : '–') + ')';
  return typeof Rg.zufallErwartet === 'number' ? Rg.zufallErwartet.toFixed(1) + ' Zufallstreffer (t ≥ 2)' : '–';
}
function registerEintragen(Rg, kennung, form, konf, datum, bewertung, zusatz) {
  Rg.konfigurationen = Rg.konfigurationen.filter(function (e) { return e.kennung !== kennung; });   /* ersetzt, nie doppelt (auch bei Nachmessung) */
  /* k.register (Nr. 121-2a): weitere Felder je Konfiguration (zaehlt, df, status, nBedarf, ...) */
  konf.forEach(function (k) { var e = { kennung: kennung, form: form, key: k.key, urteil: k.urteil, datum: datum }; if (bewertung) e.bewertung = bewertung; if (zusatz) Object.keys(zusatz).forEach(function (f) { e[f] = zusatz[f]; }); if (k.register) Object.keys(k.register).forEach(function (f) { e[f] = k.register[f]; }); Rg.konfigurationen.push(e); });
  Rg.gesamt = Rg.konfigurationen.length; Rg.zufallErwartet = Rg.gesamt * K.ZUFALL_JE_KONFIGURATION; Rg.stand = datum;
  /* Nr. 121-2a B2 (Audit B V7): m (Gewichte), Regeln, zwei Zufallszahlen aus df je Eintrag; zufallErwartet (t >= 2 je Konfiguration) bleibt nachrichtlich */
  var Z = TO.registerZahlen(Rg); Rg.m = Z.m; Rg.regeln = Z.regeln; Rg.zufallKandidat = Z.zufallKandidat; Rg.zufallBelegt = Z.zufallBelegt; Rg.zufallRechnung = Z.rechnung;
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
/** Ein Adapterlauf. phase: 'zaehlung' (tag, Nr. 121-2a: Trockenzaehlung ohne Renditen fuer das Machbarkeitstor, Tafel bis zum Panel-Ende),
 *  'entdeckung', 'pruefung' (korb/minute; tag seit Nr. 121-2a nicht mehr - die Bestaetigung ist vorwaerts). extra = { nur: [keys] (nur diese
 *  Konfigurationen messen - die messbaren), m (Testzahl fuer das Kandidatenkriterium), tafel (Tests) }. */
function messen(kennung, phase, ausDatei, extra) {
  extra = extra || {};
  var L = ladeKandidat(kennung);
  if (L.fehler.length) throw new Error('Kandidat ungueltig: ' + L.fehler.join('; '));
  var kand = L.kand, regel = L.regel, pruefzeit = phase === 'pruefung', siegelPfad = 'pruefstrasse/erledigt/' + kennung + '/KANDIDATEN.json';
  var keys = pruefzeit ? liesJson(path.join(K.ERLEDIGT, kennung, 'KANDIDATEN.json')).kandidaten.map(function (x) { return x.key; }) : null;
  if (extra.nur) { kand = JSON.parse(JSON.stringify(kand)); kand.konfigurationen = kand.konfigurationen.filter(function (c) { return extra.nur.indexOf(c.key) !== -1; }); }
  panelSperre();
  var E;
  try {
    if (kand.form === 'tag' && phase === 'zaehlung') { var AT = require('./adapter/tag.js'), TFz = extra.tafel || require('./tafel.js').oeffne({ quelle: kand.daten || 'panel', bisPanelende: true }); E = AT.zaehle(TFz, regel, kand, {}); E.quelle = TFz.quelle; E.kennungTafel = TFz.kennung; }
    else if (kand.form === 'tag' && phase === 'entdeckung') E = require('./adapter/tag.js').lauf(regel, kand, { quelle: kand.daten || 'panel', bisPanelende: true, schnitt: 'panelende', registerM: extra.m, tafel: extra.tafel });
    else if (kand.form === 'tag' && phase === 'vorwaerts') { var TFv = extra.tafel || require('./tafel.js').oeffne({ quelle: kand.daten || 'panel', pruefzeit: true, siegelPfad: siegelPfad }); E = vorwaertsKind(TFv, regel, kand, extra); }
    else if (kand.form === 'tag') E = require('./adapter/tag.js').lauf(regel, kand, { quelle: kand.daten || 'panel', pruefzeit: pruefzeit, siegelPfad: siegelPfad, pruefung: keys, tafel: extra.tafel, registerM: extra.m });
    else if (kand.form === 'korb') { var mK = (register().gesamt || 0) + 1; E = require('./adapter/korb.js').lauf(regel, kand, { pruefzeit: pruefzeit, siegelPfad: siegelPfad, pruefung: pruefzeit ? { von: '2023-01-03' } : null, placeboBuecher: K.korbBuecher(mK), registerM: mK, kostenBpJeSeite: K.KORB.kostenRegel, massstab: K.KORB.massstab }); }   /* Nr. 121-2b: Kostenregel + Nasdaq-100 nach Steuer */
    else E = require('./adapter/minute.js').lauf(regel, kand, { pruefzeit: pruefzeit, siegelPfad: siegelPfad });
  } finally { try { if (+fs.readFileSync(SPERRDATEI, 'utf8') === process.pid) fs.unlinkSync(SPERRDATEI); } catch (e) { /* Sperre ist Komfort */ } }
  E.kennung = kennung; E.form = kand.form; E.phase = phase; E.stand = jetzt(); E.konfigurationenSoll = kand.konfigurationen.length;
  if (ausDatei) schreibeJson(ausDatei, E);
  return E;
}
function messenImKind(kennung, phase, ausDatei, log, extra) {
  var args = ['--max-old-space-size=6144', __filename, '--messen', kennung, '--phase', phase, '--aus', ausDatei];
  if (extra && Object.keys(extra).length) { var xd = ausDatei + '.extra.json'; schreibeJson(xd, extra); args.push('--extra', xd); }
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
  else if (kandidaten.length && !P && E.vorgemerkt) { urteil = 'nicht entscheidbar'; grund = 'Kandidaten vorgemerkt fuer die Vorwaertsmessung (ein vorregistrierter Blick ab dem Stichtag nach Siegel 2): ' + kandidaten.map(function (k) { return k.key + ' (Bedarf ' + ganz(k.vorwaerts && k.vorwaerts.nBedarf) + ' Signaltage)'; }).join(', '); }
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
  var e = k.entdeckung, b = e.buch, ns = e.nachSteuer;
  /* Nr. 121-2b: mit Massstab Nasdaq-100 nach Steuer stehen Buch/ETF, Abstand, Median und vorn nach Steuer; vor Steuern (Buch / SPY in $) in Klammern */
  if (ns) return '| ' + k.key + ' | ' + e.fenster.von + '–' + e.fenster.bis + ' | nach Steuer ' + de(ns.k0.buchB, 2) + ' / Nasdaq-ETF ' + de(ns.k0.nasdaqB, 2) + ' % p. a. (vor Steuern ' + ganz(b.buchEnde) + ' $ / SPY ' + ganz(b.spyEnde) + ' $) | ' + de(ns.k0.buchB - ns.k0.nasdaqB, 2) + ' | ' + de(ns.median.abstandNasdaqB, 2) + ' | ' + ns.vornGegenNasdaqB + ' von ' + ns.phasen + ' | ' +
    e.rang + ' von ' + e.von + ' (vor Steuern; Median ' + de(e.zufall.median, 2) + ', P95 ' + de(e.zufall.p95, 2) + ') | ' + de(b.rueckschlagBuch, 1) + ' % | ' + JSON.stringify(b.abgaenge) + ' | ' + k.urteil +
    (k.pruefung && k.pruefung.buch ? ' | ' + de(k.pruefung.nachSteuer ? k.pruefung.nachSteuer.median.abstandNasdaqB : k.pruefung.buch.startphasen.median, 2) + ' / Rang ' + k.pruefung.rang + (k.belegt ? ' Holm ja' : '') : '') + ' |';
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
  korb: '| Konf | Fenster | Buch / Massstab | Abstand p. a. | Median 63 | vorn | Rang gegen 200 Zufallsbuecher | Rueckschlag | Reihenenden | Urteil | Pruefung Median / Rang |',
  minute: '| Konf | Signale | brutto je Signal | Huerde | netto je Signal | t | MDE | delta80 | Maschine | Urteil | Pruefung netto / t |',
};
function ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, trocken, nachmessung) {
  var konf = E.konfigurationen, o = [];
  o.push('# ' + kand.titel + ' — ' + (trocken ? 'TROCKENLAUF (nur Zaehlungen)' : '**' + U.urteil + '**'));
  o.push('');
  if (nachmessung) { o.push(nachmessungAbsatz(nachmessung, E)); o.push(''); }
  o.push('**Kurzfassung.** Kandidat `' + kand.kennung + '` (Form ' + kand.form + modusText(kand, E) + ', ' + konf.length + ' Konfigurationen, vorab festgelegt), gemessen ' + datumDe(E.stand) + ' auf ' + E.quelle + ' (' + (E.kennungTafel || E.archiv || '') + ').' +
    (trocken ? ' Trockenlauf: keine Urteile.' : ' **Urteil: ' + U.urteil + '** — ' + U.grund + '. Kandidaten nach der Entdeckung: ' + U.kandidaten + '.') +
    ' Register: ' + Rg.gesamt + ' Konfigurationen bisher insgesamt eingetragen, ' + zufallText(Rg) + '.' +
    ' Erwartung vorab: ' + kand.erwartung.groesse + ' (' + kand.erwartung.richtung + ').');
  o.push('');
  o.push('Siegel 1 (Kandidatenordner) `' + (siegel1 ? siegel1.commit.slice(0, 12) : '–') + '`' + (siegel2 ? ', Siegel 2 (KANDIDATEN.json) `' + siegel2.commit.slice(0, 12) + '`' : ', kein Siegel 2 (keine Pruefung)') +
    '. Entdeckung bis ' + (E.schnitt ? 'vor ' + E.schnitt : K.ENTDECKUNG_BIS) + ', Pruefung ab ' + (E.form === 'minute' ? K.MINUTE.sperreAb : K.EICHUNG.schnitt) + ' nur fuer Kandidaten. Kriterien (Nr. 121-2a): netto > 0 und p_E ≤ min(P(T_df ≥ ' + K.KANDIDAT_T + '), ' + K.REGISTER_ALPHA + '/m) in der t-Verteilung (df = n_eff − 1, m = Register + Konfigurationen des Laufs' + (E.registerM != null ? ' = ' + E.registerM : '') + '; Schwelle je Konfiguration im Abschnitt Messgeraet), Tor 1 nur nachrichtlich (' + K.TOR1_FAKTOR + ' × projizierte Bestaetigungs-MDE' + (kand.form === 'tag' ? ' = netto ≥ 11,31 × se, zum Vergleich mit Messungen vor dem 23.10.2026' : '') + '), kein Placebo-Verstoss (|Placebo| > ' + K.PLACEBO_T + ' se und > ¼ Huerde); das verschobene Signal mit derselben Schranke zweiseitig (sonst Messgeraet-Fehler); MDE80 = ' + K.MDE_FAKTOR + ' × se ist die Aufloesung, kein Kriterium.');
  o.push('');
  o.push('## Konfigurationen');
  o.push('');
  var versatz = E.versatzTage || K.VERSATZ_TAGE, kopf = kand.form === 'tag' ? KOPF.tag.replace('verschoben 20 T', 'verschoben ' + versatz + ' T') : KOPF[kand.form];
  o.push(kopf); o.push(kopf.replace(/[^|]+/g, '---'));
  konf.forEach(function (k) { o.push(kand.form === 'tag' ? zeileTag(k) : kand.form === 'korb' ? zeileKorb(k) : zeileMinute(k)); });
  o.push('');
  var zeit = kand.form === 'tag' && E.bewertung === 'zeit';
  o.push('Alle Groessen in Pp' + (kand.form === 'korb' ? ' p. a. bzw. $' : ' je Trade/Signal (Tagesmittel), se Hansen-Hodrick') + '. ' + (kand.form === 'tag' ? 'Gegenproben: ' + (zeit ? 'Placebo "anderer Wert gleicher Klasse am selben Tag" entfaellt im Modus zeit (traefe dieselbe Zelle); Placebo ist hier das verschobene Signal' : 'Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung') + '; verschoben = dasselbe Signal ' + versatz + ' Handelstage spaeter (zeigt es einen Ausschlag in eine der beiden Richtungen, ist das Messgeraet verdaechtig; Fenster mit Ueberschneidung eines Signalfensters der Reihe gezaehlt, nicht gewertet); Ein-/Ausstieg +1 T = Einstieg und Ausstieg einen Handelstag spaeter (gleiche Haltedauer); Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige / zensiert = Reihe endet nur an der Sperre).' : kand.form === 'korb' ? 'Placebo = ' + (E.placeboBuecher || 200) + ' Zufallsbuecher derselben Zielzahl aus denselben zulaessigen Werten (Nr. 100; B = max(200, 20 m + 1), m = ' + (E.registerM != null ? E.registerM : '–') + ', p-Boden ' + (E.pBoden != null ? E.pBoden.toFixed(4).replace('.', ',') : '–') + '); Startphasen = 63 Starttage; Reihenenden getrennt nach Grund. Die Gegenproben "Signal verschoben" und "alle gegen lebend" sind fuer diese Form nicht abbildbar (die Zielfunktion lehnt veraltete Kurse ab; Reihenenden buchen nach der Hauptregel).' : 'Zahlen der Messmaschine (Bestaetigungshaelfte ihres Schnitts B5); Placebo und Kontrolle A7 der Maschine im Protokoll.'));
  if (kand.form === 'tag' && E.machbarkeit) { o.push(''); o.push(machbarkeitMarkdown(E.machbarkeit)); }
  if (kand.form === 'tag') vorwaertsMarkdown(E).forEach(function (z) { o.push(z); });
  if (kand.form === 'tag') {
    var gs = groessenText(E);
    o.push(''); o.push('**Groessenaussage (Nr. 121-2a, Audit B V2).** ' + (gs ? gs + '.' : 'keine: bei keiner Konfiguration liegt die obere 95-%-Grenze brutto unter der behaupteten Groesse brutto' + ((E.konfigurationen || []).some(function (k) { return k.erwartung; }) ? ' (' + E.konfigurationen.map(function (k) { return k.key + ' obere ' + de(k.entdeckung.uBrutto.obere, 3) + ' gegen ' + (k.erwartung ? de(k.erwartung.bruttoPp, 2) : '–'); }).join(', ') + ')' : '') + '.') + ' Der Zusatz „im gemessenen Fenster" steht, wenn die Quelle ein anderes Fenster misst (erwartung.fensterWieQuelle nicht true).');
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
  o.push('Quelle: ' + E.quelle + (E.panelBau ? ' (Panel-Stand ' + E.panelBau + ')' : '') + (E.reihen ? ', ' + E.reihen + ' Reihen, letzter Tag ' + E.letzterTag : '') + (E.korb ? ', Korb ' + E.korb : '') + '. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.');
  return o.join('\n') + '\n';
}
/** Nr. 121-1 (Auftrag Teil E): Zahlen des Messgeraets je Konfiguration, alle als Text neben der Tabelle (Tag-Form). */
function messgeraetDetails(kand, E) {
  var o = [''], konf = E.konfigurationen, Z = E.zaehler || {}, pz = function (x) { return x == null || x !== x ? '–' : (100 * x).toFixed(1).replace('.', ',') + ' %'; };
  o.push('## Messgeraet (Nr. 121-1)');
  o.push('');
  konf.forEach(function (k) {
    var e = k.entdeckung, se = e.uNetto.se, v = k.versatz || {}, ub = v.ueberlappung || {}, eo = e.uNettoEroeffnung;
    var sw = k.schwelle;
    var z = '- **' + k.key + '.** ' + (sw ? 'Kandidatenschwelle t ≥ ' + de(sw.t, 2) + ' (df ' + de(sw.df, 0) + ', m ' + sw.m + '; P(T ≥ ' + K.KANDIDAT_T + ') = ' + de(sw.pT, 5) + ', ' + K.REGISTER_ALPHA + '/m = ' + de(sw.pBonferroni, 5) + '; greift: ' + sw.greift + (sw.nachrichtlichExtern ? '; nachrichtlich mit den ~' + K.REGISTER_M_EXTERN_NACHRICHTLICH + ' Tests der Signalstudie 2026-08: m_gesamt ' + sw.nachrichtlichExtern.mGesamt + ' → t ≥ ' + de(sw.nachrichtlichExtern.t, 2) : '') + '). ' : '') + 'Tor 1 verlangt netto ≥ ' + de(k.tor1FaktorSe, 2) + ' × se = ' + de(k.tor1Schwelle, 2) + ' Pp; MDE80 = ' + K.MDE_FAKTOR.toFixed(2).replace('.', ',') + ' × se = ' + de(k.mde80, 2) + ' Pp (se ' + de(se) + '; Tor 1 seit 23.10.2026 nur nachrichtlich).' +
      ' Urteil auf der Kostenregel (Nr. 121-2b: Spanne zur Eroeffnung + IBKR ' + K.KOSTEN.modell + ', Position ' + ganz(Math.round(K.POSITION_USD)) + ' $, Pp je Umlauf): Huerde je Trade ' + de(e.kKand) + (e.nKosten ? ', Trades je Kostenklasse 1-5 ' + e.nKosten.map(ganz).join(' / ') + ' (Klasse 5 vorlaeufig, 11 Symbole, 95-%-Band 0,012-0,036)' : '') + '. Nachrichtlich: Kassa-Netto ' + de(e.uNettoKassa && e.uNettoKassa.mittel) + ' (t ' + de(e.uNettoKassa && e.uNettoKassa.t, 2) + ', Kassa-Huerde ' + de(e.kKandKassa) + '), Eroeffnungsspanne ohne Gebuehr ' + de(eo && eo.mittel) + ' (t ' + de(eo && eo.t, 2) + ', Huerde ' + de(e.kKandEroeffnung) + ').' +
      ' Verschoben: brutto ' + de(v.uBrutto && v.uBrutto.mittel) + ' (t ' + de(v.uBrutto && v.uBrutto.t, 2) + '), Schranke zweiseitig ' + K.PLACEBO_T + ' se und ' + de(v.schranke && v.schranke.mindestPp) + ' Pp' + (v.verstoss ? ' — **VERSTOSS**' : '') + '; Ueberschneidung mit einem Signalfenster ' + ganz(ub.n) + ' von ' + ganz(ub.von) + ' (' + pz(ub.anteil) + '), nicht gewertet.' +
      ' Abgaenge: ' + (e.abgaenge || []).map(function (a) { return a.gruppe + ' ' + a.n; }).join(', ') + ' (zensiert = Reihe endet nur an der Sperre, kein Abgang).';
    var zt = k.zeitTopf;
    if (zt && zt.art === 'lokal') z += ' **Lokaler Topf:** R = ' + zt.R + ' Handelstage, HH-Lag ' + zt.hhLag + ', Topf-n je Trade Median ' + zt.topfN.median + ', Min ' + zt.topfN.min + ', Anteil n = 1 ' + pz(zt.topfN.anteilN1) + ' (mindestens ' + zt.nMin + '), topfFehlt ' + ganz(zt.topfFehlt) + ', randFehlt ' + ganz(zt.randFehlt) + ' (Signal naeher als R am Anfang/Ende seiner Reihe, Randregel), Topf-Starttage wegen Massnahme ausgeschlossen ' + ganz(zt.topfMassnahme) + ' (Topf ohne Klassenfilter, Nachbesserung 4), randFehlt ' + ganz(zt.randFehlt) + ' (Signal naeher als R am Anfang/Ende seiner Reihe, Randregel), randFehlt ' + ganz(zt.randFehlt) + ' (Signal naeher als R am Anfang/Ende seiner Reihe, Randregel), Topf-Mittel ' + de(zt.topfMittel) + '; nachrichtlich (kein Urteil): gegen den globalen Topf ohne Ausschluss netto ' + de(zt.global.uNetto.mittel) + ' (t ' + de(zt.global.uNetto.t, 2) + '), R = 2 H netto ' + de(zt.sensitivitaet.R2H.uNetto.mittel) + ' (t ' + de(zt.sensitivitaet.R2H.uNetto.t, 2) + '), R = 8 H netto ' + de(zt.sensitivitaet.R8H.uNetto.mittel) + ' (t ' + de(zt.sensitivitaet.R8H.uNetto.t, 2) + '); Zufallsplan-Rang: ' + zt.zufallsplanRang + '. Topf-Starttage relativ zum Signal (Abstand:Anzahl): ' + (zt.histogramm || []).map(function (h) { return h[0] + ':' + h[1]; }).join(' ') + '.';
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
  var vorsatz = nachmessung ? '**Nachmessung ' + nachmessung.n + '** (ersetzt den Absatz vom ' + datumDe(nachmessung.alt.stand) + ', Grund: ' + nachmessung.grund + (nachmessung.art === 'daten' ? ', Wiedervorlage mit mehr Daten, zaehlt ' + nachmessung.zaehlt + '-fach' : ', Korrektur `' + nachmessung.korrektur.slice(0, 7) + '`') + (nachmessung.blickePruefzeit > 0 ? '; ' + (nachmessung.blickePruefzeit + 1) + '. Blick auf die Pruefzeit' : '') + ') ' : '';
  var konf = E.konfigurationen, beste = konf.slice().sort(function (a, b) { return (bNetto(b) || -1e9) - (bNetto(a) || -1e9); })[0];
  function bNetto(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.mittel : e.buch ? e.buch.startphasen.median : e.nettoJeSignalPp; }
  function bT(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.t : e.buch ? null : e.t; }
  return '- ' + datumDe(E.stand) + ' — ' + vorsatz + '**' + kand.titel + '** (`' + kand.kennung + '`, Form ' + kand.form + modusText(kand, E) + ', ' + konf.length + ' Konfigurationen): **' + U.urteil + '** — ' + U.grund + '. ' +
    'Beste Entdeckungszeile ' + beste.key + ': netto ' + de(bNetto(beste), kand.form === 'korb' ? 2 : 4) + (bT(beste) != null ? ' (t ' + de(bT(beste), 2) + ')' : '') +
    (beste.tor1FaktorSe != null ? '; Tor 1 verlangt netto ≥ ' + de(beste.tor1FaktorSe, 2) + ' × se = ' + de(beste.tor1Schwelle, 2) + ' Pp; MDE80 = ' + K.MDE_FAKTOR.toFixed(2).replace('.', ',') + ' × se = ' + de(beste.mde80, 2) + ' Pp' : ', MDE80 ' + de(beste.mde80)) + '. ' +
    (beste.entdeckung && beste.entdeckung.kKandSpanne != null ? 'Huerde ' + de(beste.entdeckung.kKand, 3) + ' Pp je Umlauf (Kostenregel Nr. 121-2b: Spanne zur Eroeffnung ' + de(beste.entdeckung.kKandSpanne, 3) + ' + IBKR ' + K.KOSTEN.modell + ' ' + de(beste.entdeckung.kKandGebuehr, 3) + ' bei ' + ganz(Math.round(K.POSITION_USD)) + ' $; Klasse 5 vorlaeufig, 11 Symbole, 95-%-Band 0,012-0,036; Kassa-Huerde nachrichtlich ' + de(beste.entdeckung.kKandKassa, 3) + '). ' : '') +
    (kand.form === 'korb' && E.massstab ? 'Massstab ' + (/Nasdaq/.test(E.massstab) ? 'Nasdaq-100 nach Steuer (seit 23.10.2026; vorher S&P 500)' : E.massstab) + '. ' : '') +
    (E.vorbehalt ? '**' + E.vorbehalt + '** ' : '') + 'Register: ' + Rg.gesamt + ' Konfigurationen bisher, ' + zufallText(Rg) + '. Ordner `pruefstrasse/erledigt/' + kand.kennung + '/`, Siegel 1 `' + siegel1.commit.slice(0, 7) + '`' + (siegel2 ? ', Siegel 2 `' + siegel2.commit.slice(0, 7) + '`' : '') + '. Quelle ' + E.quelle + '.';
}

/* ---------- Git (ein Befehl, nur genannte Pfade) ---------- */
function commit(pfade, nachricht, repo) {
  var R = repo || K.REPO;
  var add = SG.git(R, ['add', '--'].concat(pfade));
  if (add.status !== 0) throw new Error('git add scheitert: ' + add.stderr.toString('utf8'));
  var c = SG.git(R, ['commit', '-q', '-m', nachricht + '\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>', '--'].concat(pfade));
  if (c.status !== 0) throw new Error('git commit scheitert: ' + c.stderr.toString('utf8') + c.stdout.toString('utf8'));
  return SG.aus(SG.git(R, ['rev-parse', 'HEAD']));
}

/* ---------- Machbarkeitstor (Nr. 121-2a A3, FORM.md §5) ---------- */
/** Aus der Trockenzaehlung Zl (adapter/tag.js zaehle, ohne Renditen) je Konfiguration: geschaetzter Standardfehler (streuung.json), Kandidatenschwelle
 *  t_krit(df, m), Bedingung (t_krit + 0,8416) * se_geschaetzt <= nettoPp und mindestens MIN_TAGE Signaltage. m fuer das Tor = Register (Gewichte, ohne
 *  die eigene Kennung) + alle Konfigurationen des Kandidaten; mLauf = Register + die messbaren (fuer das Kandidatenkriterium nach der Entdeckung). */
function machbarkeitsPhase(kand, Zl, Rg, NM) {
  var mVor = TO.registerM(Rg, kand.kennung), m = mVor + kand.konfigurationen.length, modus = kand.bewertung || 'topf';
  var je = kand.konfigurationen.map(function (c) {
    var z = (Zl.konfigurationen || []).filter(function (x) { return x.key === c.key; })[0] || { nT: 0, nTr: 0, d: null };
    var er = TO.erwartungFuer(kand, c.key), sj = Zl.TE > 0 ? z.nT / Zl.TE * 252 : null;
    var basis = { key: c.key, H: c.haltedauer, nT: z.nT, nTr: z.nTr, d: z.d, modus: modus, erwartung: er, signaltageJeJahr: sj };
    if (!er) return Object.assign(basis, { messbar: false, grund: 'keine Groessenbehauptung (erwartung.nettoPp)' });
    if (!(z.nT >= 2)) return Object.assign(basis, { messbar: false, grund: 'weniger als 2 Signaltage in der Trockenzaehlung', braeuchteSignaltage: null });
    /* Auflage QS 23.10.: Nachmessung mit --grund-daten -> gemessene se der Vormessung (ergebnis.json, skaliert ueber die Signaltage) statt 1,4 x Tabelle */
    var va = NM && NM.art === 'daten' ? ((NM.alt && NM.alt.konf) || []).filter(function (x) { return x.key === c.key && x.se > 0 && x.nTage > 0; })[0] : null;
    var M = TO.machbarkeit(Object.assign({ H: c.haltedauer, nT: z.nT, d: z.d, modus: modus, nettoPp: er.nettoPp, m: m, signaltageJeJahr: sj }, va ? { seE: va.se, nE: va.nTage } : {}));
    M.seQuelle = va ? 'Vormessung' : 'Tabelle x ' + K.STREUUNG_FAKTOR;
    if (M.messbar && z.nT < K.MIN_TAGE) { M.messbar = false; M.grund = 'unter ' + K.MIN_TAGE + ' Signaltagen'; }
    if (M.braeuchteSignaltage != null && M.braeuchteSignaltage < K.MIN_TAGE) M.braeuchteSignaltage = K.MIN_TAGE;
    M.braeuchteJahre = (M.braeuchteSignaltage != null && sj > 0) ? M.braeuchteSignaltage / sj : null;
    return Object.assign(basis, M);
  });
  var messbar = je.filter(function (x) { return x.messbar; }).map(function (x) { return x.key; });
  return { je: je, messbar: messbar, mVor: mVor, mTor: m, mLauf: mVor + messbar.length, bewertung: modus, panelEnde: Zl.letzterTag, TE: Zl.TE, ohneRenditen: !!Zl.ohneRenditen,
    regel: '(t_krit + ' + K.Z_POWER80 + ') x se_geschaetzt <= nettoPp, t_krit = max(' + K.KANDIDAT_T + ', t_(1 - ' + K.REGISTER_ALPHA + '/m; df = n_T/H - 1)), m = ' + m + ' (Register ' + mVor + ' + ' + kand.konfigurationen.length + ' Konfigurationen), se aus pruefstrasse/streuung.json (Fit aus versiegelten Messungen), mindestens ' + K.MIN_TAGE + ' Signaltage' };
}
function jahreText(j) { return j == null ? '–' : j < 0.05 ? '0' : j > 999 ? '> 999' : j.toFixed(1).replace('.', ','); }
/** Abschnitt "Machbarkeitstor" fuer ERGEBNIS.md (beide Faelle). */
function machbarkeitMarkdown(MB) {
  var o = ['## Machbarkeitstor (vor dem Lauf, Trockenzaehlung ohne Renditen; Nr. 121-2a)', '', 'Regel: ' + MB.regel + '. Zaehlung bis zum Panel-Ende ' + (MB.panelEnde || '–') + ', ' + ganz(MB.TE) + ' Handelstage.', '',
    '| Konf | H | Signaltage | Trades je Signaltag | Behauptung netto (brutto) | se geschaetzt | df | m | t_krit | (t_krit + 0,84) × se | messbar | braeuchte Signaltage (≈ Jahre) |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  MB.je.forEach(function (x) {
    var er = x.erwartung;
    o.push('| ' + x.key + ' | ' + x.H + ' | ' + ganz(x.nT) + ' | ' + (x.d == null ? '–' : x.d.toFixed(1).replace('.', ',')) + ' | ' + (er ? de(er.nettoPp, 2) + ' (' + de(er.bruttoPp, 2) + ')' : '–') + ' | ' + de(x.seGeschaetzt) + ' | ' + de(x.df, 1) + ' | ' + (x.m || '–') + ' | ' + de(x.tKrit, 2) + ' | ' + de(x.links, 3) + ' | ' + (x.messbar ? 'ja' : '**nein**' + (x.grund ? ' (' + x.grund + ')' : '')) + ' | ' + (x.messbar ? '–' : ganz(x.braeuchteSignaltage) + ' (' + jahreText(x.braeuchteJahre) + ')') + ' |');
  });
  o.push(''); o.push('Quelle der Behauptung: ' + MB.je.map(function (x) { return x.key + ' ' + (x.erwartung ? x.erwartung.quelle : '–'); }).join('; ') + '.');
  return o.join('\n');
}
/** Groessenaussage (A4) je Konfiguration nach der Entdeckung: obere 95-%-Grenze brutto < bruttoPp. */
function groessenAussagen(kand, E) {
  (E.konfigurationen || []).forEach(function (k) {
    var er = TO.erwartungFuer(kand, k.key), ob = k.entdeckung && k.entdeckung.uBrutto ? k.entdeckung.uBrutto.obere : null;
    k.erwartung = er; k.groessenAussage = er ? TO.groessenAussage(ob, er.bruttoPp, er.fensterWieQuelle) : null;
  });
}
function groessenText(E) { return (E.konfigurationen || []).filter(function (k) { return k.groessenAussage; }).map(function (k) { return k.key + ': ' + k.groessenAussage + ' (obere 95-%-Grenze brutto ' + de(k.entdeckung.uBrutto.obere, 3) + ' < ' + de(k.erwartung.bruttoPp, 2) + ' Pp)'; }).join('; '); }
/** Abschluss "nicht messbar" (keine Konfiguration besteht das Machbarkeitstor): kein Entdeckungslauf, kein Siegel 2, Register-Eintraege mit Gewicht 0. */
function nichtMessbarAbschluss(kennung, kand, MB, Zl, Rg, siegel1, aus, relAus, log, NM, ort) {
  var REPO = ort.repo || K.REPO, REG = ort.register || K.REGISTER, stand = jetzt();
  var konf = MB.je.map(function (x) { return { key: x.key, urteil: 'nicht messbar', register: { zaehlt: 0, braeuchteSignaltage: x.braeuchteSignaltage, nT: x.nT, H: x.H } }; });
  var U = { urteil: 'nicht messbar', kandidaten: 0, fehler: [], grund: 'Machbarkeitstor: keine Konfiguration mit diesen Daten messbar (' + MB.je.map(function (x) { return x.key + ' hat ' + ganz(x.nT) + ' Signaltage, braeuchte ' + ganz(x.braeuchteSignaltage) + ' (≈ ' + jahreText(x.braeuchteJahre) + ' Jahre)'; }).join('; ') + '); kein Entdeckungslauf, zaehlt nicht als Test' };
  var zusatz = NM ? { nachmessung: NM.n, ersetzt: NM.alt.stand } : null;
  Rg = registerEintragen(Rg, kennung, kand.form, konf, stand, kand.bewertung || 'topf', zusatz); schreibeJson(REG, Rg);
  log('URTEIL: nicht messbar - ' + U.grund);
  var ergebnis = { kennung: kennung, form: kand.form, titel: kand.titel, stand: stand, urteil: U.urteil, grund: U.grund, kandidaten: 0, messgeraetFehler: [], siegel1: siegel1, siegel2: null,
    register: { gesamt: Rg.gesamt, zufallErwartet: Rg.zufallErwartet }, machbarkeit: MB, zaehlung: Zl, entdeckung: null, pruefung: null, nachmessung: NM };
  schreibeJson(path.join(aus, 'ergebnis.json'), ergebnis);
  var md = '# ' + kand.titel + ' — **nicht messbar**\n\n' + (NM ? nachmessungAbsatz(NM, { konfigurationen: [], stand: stand }) + '\n\n' : '') + '**Kurzfassung.** Kandidat `' + kennung + '` (Form ' + kand.form + modusText(kand, null) + ', ' + kand.konfigurationen.length + ' Konfigurationen), geprueft ' + datumDe(stand) + ': **nicht messbar mit diesen Daten** — ' + U.grund + '. Register: ' + Rg.gesamt + ' Eintraege. Erwartung vorab: ' + kand.erwartung.groesse + '.\n\n' + machbarkeitMarkdown(MB) + '\n\nSiegel 1 `' + siegel1.commit.slice(0, 12) + '`. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.\n';
  fs.writeFileSync(path.join(aus, 'ERGEBNIS.md'), md);
  var absatz = '- ' + datumDe(stand) + ' — ' + (NM ? '**Nachmessung ' + NM.n + '** ' : '') + '**' + kand.titel + '** (`' + kennung + '`, Form ' + kand.form + modusText(kand, null) + ', ' + kand.konfigurationen.length + ' Konfigurationen): **nicht messbar** — ' + U.grund + '. Ordner `pruefstrasse/erledigt/' + kennung + '/`, Siegel 1 `' + siegel1.commit.slice(0, 7) + '`.';
  fs.writeFileSync(path.join(aus, 'belegstand-eintrag.md'), absatz + '\n');
  wikiAnhaengen(REPO, absatz, '- ' + datumDe(stand) + ' (Prüfstraße, ' + new Date().toISOString().slice(11, 16) + ' UTC) — **' + kennung + ': nicht messbar** (' + kand.konfigurationen.length + ' Konfigurationen; Register ' + Rg.gesamt + '). Ordner `pruefstrasse/erledigt/' + kennung + '/`.');
  var regRel = path.relative(REPO, REG).replace(/\\/g, '/');
  var pfade = NM ? [relAus, regRel, 'wiki/belegstand.md', 'wiki/log.md'] : [relAus + '/ERGEBNIS.md', relAus + '/ergebnis.json', relAus + '/belegstand-eintrag.md', relAus + '/LAUF.log', relAus + '/zaehlung.json', regRel, 'wiki/belegstand.md', 'wiki/log.md'];
  log('ENDE nicht messbar - Belegstand und Log angehaengt, Commit folgt');
  if (NM && NM.marke && fs.existsSync(NM.marke)) fs.unlinkSync(NM.marke);
  var h = commit(pfade, 'Pruefstrasse: ' + kennung + ' - ' + (NM ? 'Nachmessung ' + NM.n + ': ' : '') + 'nicht messbar (' + kand.konfigurationen.length + ' Konfigurationen, Machbarkeitstor)', REPO);
  return { urteil: 'nicht messbar', grund: U.grund, commit: h, siegel1: siegel1.commit, siegel2: null };
}
/** Belegstand-Absatz unter der festen Ueberschrift und Zeile in wiki/log.md anhaengen (Kopf bleibt unberuehrt). */
function wikiAnhaengen(REPO, absatz, logZeile) {
  var bs = path.join(REPO, 'wiki', 'belegstand.md'), text = fs.readFileSync(bs, 'utf8'), ueber = '## Prüfstraße (automatisch gemessen)';
  if (text.indexOf(ueber) === -1) text = text.replace(/\s*$/, function () { return '\n\n' + ueber + '\n\nJeder Absatz hier stammt vom Läufer (`pruefstrasse/laeufer.js`), nicht von einer Sitzung; Zahlen und Urteil stehen in `pruefstrasse/erledigt/<kennung>/`. Ein `belegt-Vorschlag` ist ein Vorschlag an den PM (zweiter unabhängiger Lauf bleibt Menschensache), kein Beleg.\n'; });
  text = text.replace(/\s*$/, function () { return '\n' + absatz + '\n'; });
  fs.writeFileSync(bs, text);
  fs.appendFileSync(path.join(REPO, 'wiki', 'log.md'), logZeile + '\n');
}

/* ---------- Der Lauf ---------- */
/** opt = { trocken, nachmessung, ort: { repo, erledigt, register } (Tests: Temp-Repo), messer (Tests: statt messenImKind), pruefer, lade (Tests) } */
function laufe(kennung, opt) {
  opt = opt || {};
  var ort = opt.ort || {}, REPO = ort.repo || K.REPO, REG = ort.register || K.REGISTER, messer = opt.messer || messenImKind;
  var aus = path.join(ort.erledigt || K.ERLEDIGT, kennung); fs.mkdirSync(aus, { recursive: true });
  var relAus = path.relative(REPO, aus).replace(/\\/g, '/');
  var logDatei = path.join(aus, 'LAUF.log');
  function log(t) { var z = jetzt() + '  ' + t; fs.appendFileSync(logDatei, z + '\n'); console.log(z); }
  log('START ' + kennung + (opt.trocken ? ' (trocken)' : '') + ' auf Zweig ' + SG.aus(SG.git(REPO, ['rev-parse', '--abbrev-ref', 'HEAD'])));
  var P1 = (opt.pruefer || pruefen)(kennung, { nachmessung: !!opt.nachmessung });
  if (!P1.gueltig) { log('ABBRUCH: Kandidat ungueltig: ' + P1.form.join('; ')); return { urteil: null, abbruch: P1.form }; }
  log('Form gueltig, test.js gruen (' + P1.test.letzteZeile + ')');
  var siegel1 = P1.siegel1; log('Siegel 1: Kandidatenordner in Commit ' + siegel1.commit + ', nichts Ungesichertes');
  var L = opt.lade ? opt.lade(kennung) : ladeKandidat(kennung), kand = L.kand, Rg = register(REG);
  /* Nr. 121-2a A3: Machbarkeitstor VOR dem Lauf (Form tag): Trockenzaehlung ohne Renditen, se aus streuung.json, je Konfiguration messbar | nicht messbar */
  var MB = null, Zl = null, nur = null;
  if (kand.form === 'tag' && !opt.trocken) {
    log('Machbarkeitstor: Trockenzaehlung ohne Renditen bis zum Panel-Ende (Signaltage, Trades, Trades je Signaltag)');
    Zl = messer(kennung, 'zaehlung', path.join(aus, 'zaehlung.json'), log, {});
    MB = machbarkeitsPhase(kand, Zl, Rg, opt.nachmessung || null);
    MB.je.forEach(function (x) { log('  ' + x.key + ': ' + ganz(x.nT) + ' Signaltage, se geschaetzt ' + de(x.seGeschaetzt) + ', (t_krit ' + de(x.tKrit, 2) + ' + 0,84) x se = ' + de(x.links, 3) + ' gegen netto ' + (x.erwartung ? de(x.erwartung.nettoPp, 2) : '–') + ' -> ' + (x.messbar ? 'messbar' : 'NICHT messbar, braeuchte ' + ganz(x.braeuchteSignaltage) + ' Signaltage (' + jahreText(x.braeuchteJahre) + ' Jahre)')); });
    if (!MB.messbar.length) return nichtMessbarAbschluss(kennung, kand, MB, Zl, Rg, siegel1, aus, relAus, log, opt.nachmessung || null, ort);
    nur = MB.messbar.length < kand.konfigurationen.length ? MB.messbar : null;
  }
  log('Entdeckung bis ' + (kand.form === 'minute' ? 'vor ' + K.MINUTE.sperreAb : kand.form === 'tag' ? 'zum Panel-Ende' + (MB ? ' ' + MB.panelEnde : '') : K.EICHUNG.bis) + ' ueber ' + (nur ? nur.length + ' von ' : '') + kand.konfigurationen.length + ' Konfigurationen (Form ' + kand.form + ', Adapter ' + kand.form + ', Quelle ' + (kand.daten || (kand.form === 'tag' ? 'panel' : kand.form === 'korb' ? 'panel' : '60m-archiv')) + modusText(kand, null) + ')');
  var E = messer(kennung, 'entdeckung', path.join(aus, 'ergebnis-entdeckung.json'), log, MB ? { nur: nur, m: MB.mLauf } : {});
  var soll = nur ? nur.length : kand.konfigurationen.length;
  if (E.konfigurationen.length !== soll) throw new Error('Adapter lieferte ' + E.konfigurationen.length + ' statt ' + soll + ' Konfigurationen');
  if (MB) { E.machbarkeit = MB; E.nichtMessbar = MB.je.filter(function (x) { return !x.messbar; }); }
  if (kand.form === 'tag') { groessenAussagen(kand, E); wiedervorlagen(kand, E); }
  if (kand.form === 'tag') { E.versatzGrund = L.versatzGrund || null; if (kand.versatzTage != null) log('Verschiebungs-Gegenprobe: Versatz ' + E.versatzTage + ' Handelstage statt Vorgabe ' + K.VERSATZ_TAGE + ', Grund (REGEL.md "Versatz"): ' + E.versatzGrund); }
  log('Entdeckung fertig: ' + JSON.stringify(E.zaehler || {}).slice(0, 400) + (E.verstoesse != null ? ' | Verstoesse ' + E.verstoesse : ''));
  if (E.signalAnteil && E.signalAnteil.tage > 0) log('Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel ' + (100 * E.signalAnteil.mittel).toFixed(1) + ' %, max ' + (100 * E.signalAnteil.max).toFixed(1) + ' %, ' + E.signalAnteil.tageUeber50 + ' von ' + E.signalAnteil.tage + ' Signaltagen ueber 50 %' + modusText(kand, E));
  (E.warnungen || []).forEach(function (w) { log('WARNUNG: ' + w); });
  E.konfigurationen.forEach(function (k) { var e = k.entdeckung; log('  ' + k.key + ': ' + (e.uNetto ? 'Tage ' + e.nTage + ', Trades ' + e.nTr + ', netto ' + de(e.uNetto.mittel) + ', t ' + de(e.uNetto.t, 2) : e.buch ? 'Median ' + de(e.buch.startphasen.median, 2) + ', Rang ' + e.rang + '/' + e.von : 'Signale ' + e.signale + ', netto ' + de(e.nettoJeSignalPp) + ', t ' + de(e.t, 2)) + (opt.trocken ? '' : ' -> ' + k.urteil + (k.gruende && k.gruende.length ? ' (' + k.gruende.join(', ') + ')' : ''))); });
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
    regel: 'FORM.md §5 (Nr. 121-2a): netto > 0, p_E <= min(P(T_df >= ' + K.KANDIDAT_T + '), ' + K.REGISTER_ALPHA + '/m), m = ' + (E.registerM != null ? E.registerM : E.konfigurationen.length) + ', kein Placebo-Verstoss, mindestens ' + K.MIN_TAGE + ' Signaltage (Tor 1 nur nachrichtlich)', messgeraetFehler: U0.fehler,
    kandidaten: kandidaten.map(function (k) { var e = k.entdeckung; return { key: k.key, netto: e.uNetto ? e.uNetto.mittel : e.buch ? e.buch.startphasen.median : e.nettoJeSignalPp, t: e.uNetto ? e.uNetto.t : e.t, df: k.df != null ? k.df : null, tSchwelle: k.schwelle ? k.schwelle.t : null, tor1Schwelle: k.tor1Schwelle || null }; }) });
  var h2 = commit([relAus + '/KANDIDATEN.json', relAus + '/ergebnis-entdeckung.json'], 'Pruefstrasse: ' + kennung + ' - Kandidatenliste (Siegel 2), ' + kandidaten.length + ' von ' + E.konfigurationen.length, REPO);
  var siegel2 = SG.pruefeSiegel(REPO, relAus + '/KANDIDATEN.json');
  log('Siegel 2: KANDIDATEN.json committet in ' + h2 + ' (Blob ' + siegel2.blob.slice(0, 12) + ')');
  var P = null;
  if (kand.form === 'tag' && kandidaten.length && !U0.fehler.length) vormerken(kand, E, kandidaten, siegel2, REPO, log);
  else if (kandidaten.length && !U0.fehler.length) {
    log('Pruefung ab ' + (kand.form === 'minute' ? K.MINUTE.sperreAb : K.EICHUNG.schnitt) + ' fuer ' + kandidaten.map(function (k) { return k.key; }).join(', ') + ' (Daten erst jetzt lesbar)');
    P = messer(kennung, 'pruefung', path.join(aus, 'ergebnis-pruefung.json'), log, MB ? { m: MB.mLauf } : {});
    log('Pruefung fertig' + (P.verstoesse != null ? ', Verstoesse ' + P.verstoesse : ''));
  } else log(kandidaten.length ? 'Keine Pruefung: Messgeraet-Fehler' : 'Keine Pruefung: kein Kandidat');
  var NM = opt.nachmessung || null, zusatz = NM ? { nachmessung: NM.n, ersetzt: NM.alt.stand } : null;
  if (NM && NM.art === 'daten') zusatz.zaehlt = NM.zaehlt;            /* Nr. 121-2a C4: Wiedervorlage mit mehr Daten zaehlt doppelt */
  /* Register: gemessene Konfigurationen und (Nr. 121-2a) die vor dem Lauf als nicht messbar ausgewiesenen (Gewicht 0) */
  var regKonf = E.konfigurationen.concat((E.nichtMessbar || []).map(function (x) { return { key: x.key, urteil: 'nicht messbar', register: { zaehlt: 0, braeuchteSignaltage: x.braeuchteSignaltage, nT: x.nT, H: x.H } }; }));
  var U = urteile(E, P, registerEintragen(JSON.parse(JSON.stringify(Rg)), kennung, kand.form, regKonf, E.stand, E.bewertung, zusatz));
  var gT = kand.form === 'tag' ? groessenText(E) : '';
  if (gT) U.grund += '; ' + gT;
  if (NM && U.urteil === 'belegt-Vorschlag') U.grund += ' - nach Nachmessung: zweiter unabhaengiger Lauf durch den PM Pflicht';
  log('URTEIL: ' + U.urteil + ' - ' + U.grund);
  E.konfigurationen.forEach(function (k) { if (k.wiedervorlage && k.wiedervorlage.datum) k.register = Object.assign(k.register || {}, { wiedervorlage: k.wiedervorlage.datum }); });
  E.konfigurationen.forEach(function (k) { var df = k.df != null ? k.df : (k.entdeckung && k.entdeckung.uNetto && k.entdeckung.uNetto.nEff != null ? Math.max(1, k.entdeckung.uNetto.nEff - 1) : null); k.register = Object.assign(k.register || {}, df != null ? { df: df } : {}, k.groessenAussage ? { groesse: k.groessenAussage } : {}); });
  regKonf = E.konfigurationen.concat(regKonf.slice(E.konfigurationen.length));
  Rg = registerEintragen(Rg, kennung, kand.form, regKonf, E.stand, E.bewertung, zusatz); schreibeJson(REG, Rg);
  log('Register: ' + Rg.gesamt + ' Konfigurationen insgesamt, ' + Rg.zufallErwartet.toFixed(2) + ' Zufallstreffer erwartet');
  var ergebnis = { kennung: kennung, form: kand.form, titel: kand.titel, stand: E.stand, urteil: U.urteil, grund: U.grund, kandidaten: U.kandidaten, messgeraetFehler: U.fehler,
    siegel1: siegel1, siegel2: siegel2, register: { gesamt: Rg.gesamt, zufallErwartet: Rg.zufallErwartet }, entdeckung: E, pruefung: P, nachmessung: NM, vorbehalt: E.vorbehalt || null };
  schreibeJson(path.join(aus, 'ergebnis.json'), ergebnis);
  fs.writeFileSync(path.join(aus, 'ERGEBNIS.md'), ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, false, NM));
  var absatz = belegstandAbsatz(kand, E, U, Rg, siegel1, siegel2, NM);
  fs.writeFileSync(path.join(aus, 'belegstand-eintrag.md'), absatz + '\n');
  /* Belegstand: nur anhaengen unter der festen Ueberschrift, der Kopf bleibt unberuehrt */
  wikiAnhaengen(REPO, absatz, '- ' + datumDe(E.stand) + ' (Prüfstraße, ' + new Date().toISOString().slice(11, 16) + ' UTC) — ' + (NM ? 'Nachmessung ' + NM.n + ' ' : '') + '**' + kennung + ': ' + U.urteil + '** (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten; Register ' + Rg.gesamt + '). Ordner `pruefstrasse/erledigt/' + kennung + '/`.');
  var regRel = path.relative(REPO, REG).replace(/\\/g, '/');
  var pfade = [relAus + '/ERGEBNIS.md', relAus + '/ergebnis.json', relAus + '/belegstand-eintrag.md', relAus + '/LAUF.log', regRel, 'wiki/belegstand.md', 'wiki/log.md'];
  if (P) pfade.push(relAus + '/ergebnis-pruefung.json');
  if (Zl) pfade.push(relAus + '/zaehlung.json');
  if (NM) pfade = [relAus].concat(pfade.filter(function (x) { return x.indexOf(relAus + '/') !== 0; }));   /* Nachmessung: der ganze Ordner (Verschiebung nach v<n> und neue Dateien) */
  if (U.urteil === 'belegt-Vorschlag') {
    fs.appendFileSync(K.VORSCHLAEGE, (fs.existsSync(K.VORSCHLAEGE) ? '' : '# Vorschlaege der Pruefstrasse an den PM (zweiter unabhaengiger Lauf ist Menschensache)\n\n') + absatz + '\n');
    pfade.push('pruefstrasse/VORSCHLAEGE.md');
    log('belegt-Vorschlag in pruefstrasse/VORSCHLAEGE.md eingetragen');
  }
  log('ENDE ' + U.urteil + ' - Belegstand und Log angehaengt, Commit folgt');
  if (NM && NM.marke && fs.existsSync(NM.marke)) fs.unlinkSync(NM.marke);       /* Marke nie in den Commit (Ordner-Pfadspezifikation); bei Fehler schreibt nachmessen sie neu */
  var h3 = commit(pfade, 'Pruefstrasse: ' + kennung + ' - ' + (NM ? 'Nachmessung ' + NM.n + ': ' : '') + U.urteil + ' (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten)', REPO);
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
function nachmessungPruefen(kennung, grund, korrektur, ort, art) {
  ort = ort || {};
  if (art === 'daten') return nachmessungDatenPruefen(kennung, grund, ort);
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
  if (NM.art === 'daten') return '**Nachmessung ' + NM.n + ' (Wiedervorlage mit mehr Daten, --grund-daten)** (' + datumDe(E.stand || new Date().toISOString()) + '), Grund: ' + grundSatz + '. Ersetzt v' + NM.n + ' vom ' + datumDe(NM.alt.stand) + ' (Urteil ' + NM.alt.urteil + ', Ordner `' + NM.alt.ordner + '/`). **Zaehlt im Register ' + NM.zaehlt + '-fach** (zweiter Blick auf dieselbe Regel, bewusst konservativ). Vergleich (Entdeckung, alt -> neu): ' + zeilen.join('; ') + '.';
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
  var ort = opt.ort || {}, lauf = opt.lauf || laufe, NM = nachmessungPruefen(kennung, grund, korrektur, ort, opt.art), repo = NM.repo;
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

/* ---------- Vorwaertsbestaetigung (Nr. 121-2a C2, FORM.md §5) ----------
 * Ein Kandidat der Entdeckung (bis zum Panel-Ende) wird je Konfiguration 'vorgemerkt': Stichtag = erster Handelstag des Panels NACH dem Commit-Tag von
 * KANDIDATEN.json (Siegel 2, UTC), vorregistrierter Bedarf nBedarf = Signaltage, bei denen MDE80_vorwaerts = (t_0,95(df) + 0,8416) x se_geschaetzt <= nettoPp
 * waere (streuung.json). --vorwaerts zaehlt die Signaltage ab dem Stichtag OHNE Renditen (nur Einstiege, deren Fenster ganz in der Tafel liegt) und misst
 * erst bei nStand >= nBedarf genau EINMAL (Topf nur aus Vorwaertsdaten: lokaler Topf bzw. Tageszelle ab dem Stichtag; topfFehlt verringert die gemessenen
 * Signaltage und steht im Protokoll); Holm p-basiert ueber alle an diesem Tag faelligen Konfigurationen, einseitig 5 %, t-Verteilung. Danach kein
 * zweiter Blick - Wiedervorlage nur ueber --nachmessen --grund-daten (zaehlt doppelt). */
var VORWAERTS_MARKE = 'VORWAERTS-LAEUFT.json';
/** Kandidaten nach Siegel 2 vormerken (Form tag): Felder fuer Register und Protokoll. */
function vormerken(kand, E, kandidaten, siegel2, REPO, log) {
  /* Nachbesserung 23.10. (PM): siegel2Datum kommt AUSSCHLIESSLICH aus dem Commit-Zeitpunkt von KANDIDATEN.json (Committer-Zeit, nach UTC), der Stichtag
   * danach aus dem Panel-Kalender (vorwaertsKind / stichtagNach) - nie aus der Systemuhr. Ohne lesbare Commit-Zeit bricht der Lauf ab. */
  var ci = SG.aus(SG.git(REPO, ['show', '-s', '--format=%cI', siegel2.commit])), ms = ci ? Date.parse(ci) : NaN, modus = kand.bewertung || 'topf';
  if (!(ms === ms)) throw new Error('VORMERKEN: Commit-Zeit von KANDIDATEN.json (' + String(siegel2.commit).slice(0, 12) + ') nicht lesbar - kein Stichtag ohne Commit');
  var datum = new Date(ms).toISOString().slice(0, 10);
  E.vorgemerkt = true;
  kandidaten.forEach(function (k) {
    var e = k.entdeckung, er = k.erwartung || TO.erwartungFuer(kand, k.key), sj = E.TE > 0 ? e.nTage / E.TE * 252 : null;
    var nB = er ? TO.nBedarf({ H: k.haltedauer, d: e.tradesJeTag, modus: modus, nettoPp: er.nettoPp, seE: e.uNetto.se, nE: e.nTage }) : null, jahre = nB != null && sj > 0 ? nB / sj : null;
    var marke = TO.hausregelMarke(modus, nB, null);
    k.urteil = 'nicht entscheidbar'; k.status = 'vorgemerkt';
    k.vorwaerts = { status: 'vorgemerkt', siegel2Datum: datum, stichtag: null, nBedarf: nB, nStand: 0, jahre: jahre, datumGeschaetzt: jahre != null ? TO.datumPlusJahre(datum, jahre) : null, signaltageJeJahr: sj, nettoPp: er ? er.nettoPp : null, marke: marke };
    k.register = Object.assign(k.register || {}, { status: 'vorgemerkt', siegel2Datum: datum, stichtag: null, nBedarf: nB, nStand: 0, H: k.haltedauer, d: e.tradesJeTag }, marke ? { marke: marke } : {});
    log('  ' + k.key + ': vorgemerkt - Stichtag = erster Handelstag nach ' + datum + ', Bedarf ' + ganz(nB) + ' Vorwaerts-Signaltage (≈ ' + jahreText(jahre) + ' Jahre)' + (marke ? ', ' + marke : ''));
  });
}
/** Wiedervorlage (C4) je nicht entscheidbarer Konfiguration ohne Vormerkung: Datum, an dem MDE80 <= nettoPp waere (Datenzuwachs aus der Entdeckung). */
function wiedervorlagen(kand, E) {
  var modus = kand.bewertung || 'topf';
  (E.konfigurationen || []).forEach(function (k) {
    if (k.urteil !== 'nicht entscheidbar' || k.kandidat) return;
    var e = k.entdeckung, er = k.erwartung || TO.erwartungFuer(kand, k.key);
    if (!er || !(e.nTage > 0)) return;
    k.wiedervorlage = TO.wiedervorlage({ H: k.haltedauer, nT: e.nTage, d: e.tradesJeTag, modus: modus, nettoPp: er.nettoPp, m: E.registerM != null ? E.registerM : E.konfigurationen.length, signaltageJeJahr: E.TE > 0 ? e.nTage / E.TE * 252 : null, ab: E.letzterTag, seE: e.uNetto.se, nE: e.nTage });
  });
}
function vorwaertsMarkdown(E) {
  var o = [], konf = E.konfigurationen || [], vor = konf.filter(function (k) { return k.vorwaerts; }), wv = konf.filter(function (k) { return k.wiedervorlage; });
  if (vor.length) {
    o.push(''); o.push('## Vorwaertsbestaetigung (ein vorregistrierter Blick, Nr. 121-2a)'); o.push('');
    vor.forEach(function (k) { var v = k.vorwaerts; o.push('- **' + k.key + '** vorgemerkt: Stichtag = erster Handelstag des Panels nach dem Commit von KANDIDATEN.json (' + v.siegel2Datum + '); vorregistrierter Bedarf **' + ganz(v.nBedarf) + ' Signaltage** (MDE80_vorwaerts = (t_0,95 + 0,84) × se der Entdeckung, hochgerechnet, ≤ ' + de(v.nettoPp, 2) + ' Pp), geschaetzt erreicht ' + (v.datumGeschaetzt || '–') + '. Die Vorwaertsmessung prueft die Umsetzung; eine Kante von ' + de(v.nettoPp, 2) + ' Pp braucht ' + ganz(v.nBedarf) + ' Signaltage ≈ ' + jahreText(v.jahre) + ' Jahre.' + (v.marke ? ' **' + v.marke + '**: auch ein belegt-Vorschlag geht nicht in die Muehle.' : '')); });
    o.push('Panel endet am ' + (E.letzterTag || '–') + ': bis zur Panel-Fortschreibung (Auftrag Nr. 123) ist die Vorwaertsmessung leer (0 Signaltage). `laeufer.js --vorwaerts` zaehlt ohne Renditen und misst genau einmal, wenn der Bedarf erreicht ist.');
  }
  if (wv.length) { o.push(''); o.push('**Wiedervorlage (nicht entscheidbar, Nr. 121-2a):** ' + wv.map(function (k) { var w = k.wiedervorlage; return k.key + (w.datum ? ' ab ≈ ' + w.datum + ' ((t_krit + 0,84) × se der Entdeckung, hochgerechnet, ≤ nettoPp bei ' + ganz(w.nNoetig) + ' Signaltagen, ≈ ' + jahreText(w.jahre) + ' Jahre Datenzuwachs)' : ' nie (' + (w.text || 'kein Datenzuwachs') + ')'); }).join('; ') + '. Einziger Weg: `laeufer.js --nachmessen <kennung> --grund-daten "<Text>"` - zaehlt im Register doppelt.'); }
  return o;
}
/** Nachbesserung QS 23.10. (Leck in gleicheRichtung): Vorzeichen der Entdeckung aus der VERSIEGELTEN Kandidatenliste erledigt/<k>/KANDIDATEN.json (Siegel 2),
 *  ersatzweise ergebnis.json - nie aus einer Neurechnung der Tage vor dem Stichtag. 1 | -1 | null (Konfiguration nicht gelistet). */
function richtungAusSiegel(ERL, kennung, key) {
  var f = path.join(ERL, kennung, 'KANDIDATEN.json'), z = null;
  if (fs.existsSync(f)) z = (liesJson(f).kandidaten || []).filter(function (x) { return x.key === key; })[0];
  if (!z) { var g = path.join(ERL, kennung, 'ergebnis.json'); if (fs.existsSync(g)) { var k = ((liesJson(g).entdeckung || {}).konfigurationen || []).filter(function (x) { return x.key === key; })[0]; if (k) z = { netto: k.entdeckung.uNetto.mittel }; } }
  return z && z.netto != null && z.netto !== 0 ? Math.sign(z.netto) : null;
}
/** Index des ersten Tages der Tafel nach dem Datum (Stichtag), -1 ohne. */
function stichtagNach(tage, datum) { for (var t = 0; t < tage.length; t++) if (tage[t] > datum) return t; return -1; }
/** Kindprozess-Teil von --vorwaerts (eine Kennung): zaehlen ohne Renditen, faellige Konfigurationen genau einmal messen. auftrag = { siegel2Datum, eintraege: [{ key, nBedarf, status }] }. */
function vorwaertsKind(TF, regel, kand, auftrag) {
  var A = require('./adapter/tag.js'), iS = stichtagNach(TF.tage, auftrag.siegel2Datum), stichtag = iS >= 0 ? TF.tage[iS] : null, keys = auftrag.eintraege.map(function (e) { return e.key; });
  var Z = (iS >= 0 && iS <= TF.maxTag) ? A.zaehle(TF, regel, kand, { von: iS, vollesFenster: true, nurKeys: keys }) : null;
  var je = auftrag.eintraege.map(function (e) { var z = Z ? Z.konfigurationen.filter(function (x) { return x.key === e.key; })[0] : null; return { key: e.key, nBedarf: e.nBedarf, nStand: z ? z.nT : 0, ersterTag: z ? z.ersterTag : null, letzterTag: z ? z.letzterTag : null }; });
  var faellig = je.filter(function (x, i) { return auftrag.eintraege[i].status === 'vorgemerkt' && x.nBedarf != null && x.nStand >= x.nBedarf; }).map(function (x) { return x.key; });
  var messung = null;
  if (faellig.length) {
    var kf = JSON.parse(JSON.stringify(kand)); kf.konfigurationen = kf.konfigurationen.filter(function (c) { return faellig.indexOf(c.key) !== -1; });
    var E = A.lauf(regel, kf, { tafel: TF, schnitt: stichtag, pruefung: faellig });
    messung = E.konfigurationen.map(function (k) { return { key: k.key, haltedauer: k.haltedauer, pruefung: k.pruefung, topfFehlt: E.zaehler ? E.zaehler.topfFehlt : null }; });
  }
  return { kennung: kand.kennung, stichtag: stichtag, panelEnde: TF.tage[TF.maxTag], je: je, faellig: faellig, messung: messung, ohneRenditenGezaehlt: true, quelle: TF.quelle, kennungTafel: TF.kennung, bauTafel: TF.bau || null };
}
/** --vorwaerts (Nachtlauf, nur PM-/Nachtbetrieb): alle vorgemerkten Konfigurationen; idempotent (schreibt und committet nur bei geaendertem Inhalt).
 *  Rueckweg wie bei der Nachmessung: Marke pruefstrasse/VORWAERTS-LAEUFT.json vor dem Schreiben; scheitert ein Schritt, werden register.json, VORWAERTS.md,
 *  VORSCHLAEGE.md, belegstand/log und die vorwaerts.json der Kennungen auf den Stand davor gesetzt, der Index nur fuer die eigenen Pfade zurueckgesetzt
 *  (wenn sie vorher nicht gestaged waren), und die Marke bleibt mit `fehler` liegen. opt = { ort: { repo, erledigt, register, vorwaertsMd, vorschlaege },
 *  messer, log } nur fuer Tests. */
function vorwaerts(opt) {
  opt = opt || {};
  var ort = opt.ort || {}, REPO = ort.repo || K.REPO, ERL = ort.erledigt || K.ERLEDIGT, REG = ort.register || K.REGISTER, VMD = ort.vorwaertsMd || K.VORWAERTS, VOR = ort.vorschlaege || K.VORSCHLAEGE;
  var messer = opt.messer || messenImKind, log = opt.log || function (t) { console.log(jetzt() + '  ' + t); }, rel = function (p) { return path.relative(REPO, p).replace(/\\/g, '/'); };
  var marke = path.join(path.dirname(REG), VORWAERTS_MARKE);
  if (fs.existsSync(marke)) throw new Error('VORWAERTS abgelehnt: ' + VORWAERTS_MARKE + ' liegt (laufender oder abgebrochener Lauf) - erst aufraeumen (PM)');
  var Rg = register(REG), vor = Rg.konfigurationen.filter(function (e) { return e.status === 'vorgemerkt'; });
  if (!vor.length) { log('Vorwaerts: keine vorgemerkte Konfiguration - nichts zu tun'); return { geaendert: false, commit: null, statuswechsel: [] }; }
  var kennungen = []; vor.forEach(function (e) { if (kennungen.indexOf(e.kennung) === -1) kennungen.push(e.kennung); });
  var dateien = [REG, VMD, VOR, path.join(REPO, 'wiki', 'belegstand.md'), path.join(REPO, 'wiki', 'log.md')].concat(kennungen.map(function (k) { return path.join(ERL, k, 'vorwaerts.json'); }));
  var vorher = dateien.map(function (a) { return { abs: a, rel: rel(a), text: fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : null, gestaged: (SG.aus(SG.git(REPO, ['diff', '--cached', '--name-only', '--', rel(a)])) || '') !== '' }; });
  var M = { zeit: jetzt(), kennungen: kennungen, head: SG.aus(SG.git(REPO, ['rev-parse', 'HEAD'])) };
  schreibeJson(marke, M);
  try {
    var heute = jetzt(), faellige = [], aenderung = [], wechsel = [];
    kennungen.forEach(function (kn) {
      var eint = Rg.konfigurationen.filter(function (e) { return e.kennung === kn && e.status === 'vorgemerkt'; });
      var aus = path.join(require('os').tmpdir(), 'pruefstrasse-vorwaerts-' + process.pid + '-' + kn + '.json');
      var r = messer(kn, 'vorwaerts', aus, log, { siegel2Datum: eint[0].siegel2Datum, eintraege: eint.map(function (e) { return { key: e.key, nBedarf: e.nBedarf, status: e.status }; }) });
      try { if (fs.existsSync(aus)) fs.unlinkSync(aus); } catch (e) { /* Temp */ }
      r.je.forEach(function (x) { var e = eint.filter(function (y) { return y.key === x.key; })[0]; e.nStand = x.nStand; e.stichtag = r.stichtag; });
      (r.messung || []).forEach(function (m) { var e = eint.filter(function (y) { return y.key === m.key; })[0]; faellige.push({ kennung: kn, eintrag: e, m: m, p: m.pruefung && m.pruefung.pEinseitig != null ? m.pruefung.pEinseitig : 1 }); });
      log('Vorwaerts ' + kn + ': Stichtag ' + (r.stichtag || '–') + ', Panel-Ende ' + r.panelEnde + (r.bauTafel ? ' (bau ' + r.bauTafel + ')' : '') + ', ' + r.je.map(function (x) { return x.key + ' ' + x.nStand + ' von ' + ganz(x.nBedarf); }).join(', ') + (r.faellig.length ? ', faellig: ' + r.faellig.join(', ') : ''));
      r._eint = eint; aenderung.push(r);
    });
    /* Holm p-basiert ueber ALLE an diesem Tag faelligen Konfigurationen (einseitig 5 %, p aus der t-Verteilung mit df = n_eff - 1) */
    if (faellige.length) {
      var Hm = TO.holm(faellige.map(function (f) { return f.p; }), K.HOLM_ALPHA);
      faellige.forEach(function (f, i) {
        var pr = f.m.pruefung || {}, u = pr.uNetto || {}, nT = pr.nTage || 0, e = f.eintrag, urteil;
        if (nT < K.MIN_TAGE) urteil = 'nicht entscheidbar';                                               /* B V9: MIN_TAGE auch in der Bestaetigung */
        else if (Hm.bestanden[i] && u.mittel > 0 && richtungAusSiegel(ERL, f.kennung, e.key) === Math.sign(u.mittel)) urteil = 'belegt-Vorschlag';   /* Richtung aus Siegel 2 */
        else if (u.obere != null && u.obere < 0) urteil = 'nein';
        else urteil = 'nicht entscheidbar';
        var status = urteil === 'belegt-Vorschlag' ? 'bestaetigt' : urteil === 'nein' ? 'abgelehnt' : 'offen';
        e.urteil = urteil; e.status = status; e.vorwaertsDatum = heute.slice(0, 10);
        e.vorwaerts = { nTage: nT, netto: u.mittel, t: u.t, p: f.p, holmSchwelle: Hm.schwelle[i], holmM: faellige.length, df: pr.df, obere: u.obere, topfFehlt: f.m.topfFehlt };
        var mk = TO.hausregelMarke(e.bewertung, e.nBedarf, nT); if (mk) e.marke = mk;
        wechsel.push({ kennung: f.kennung, key: e.key, urteil: urteil, status: status, e: e });
      });
    }
    var geschrieben = [];
    aenderung.forEach(function (r) {
      var inhalt = { kennung: r.kennung, stichtag: r.stichtag, panelEnde: r.panelEnde, je: r._eint.map(function (e) { var x = r.je.filter(function (y) { return y.key === e.key; })[0] || {}; return { key: e.key, nBedarf: e.nBedarf, nStand: e.nStand, ersterTag: x.ersterTag || null, letzterTag: x.letzterTag || null, status: e.status, urteil: e.urteil, vorwaerts: e.vorwaerts || null }; }), messung: r.messung };
      var f = path.join(ERL, r.kennung, 'vorwaerts.json'), alt = fs.existsSync(f) ? liesJson(f) : null;
      if (alt) delete alt.stand;
      if (JSON.stringify(alt) !== JSON.stringify(inhalt)) { inhalt.stand = heute; fs.mkdirSync(path.dirname(f), { recursive: true }); schreibeJson(f, inhalt); geschrieben.push(rel(f)); }
    });
    var Z = TO.registerZahlen(Rg); Rg.m = Z.m; Rg.regeln = Z.regeln; Rg.zufallKandidat = Z.zufallKandidat; Rg.zufallBelegt = Z.zufallBelegt; Rg.zufallRechnung = Z.rechnung;
    var regText = JSON.stringify(Rg, null, 1) + '\n', regAlt = vorher[0].text;
    if (regAlt === null || JSON.stringify(JSON.parse(regAlt).konfigurationen) !== JSON.stringify(Rg.konfigurationen)) { if (wechsel.length) Rg.stand = heute; fs.writeFileSync(REG, JSON.stringify(Rg, null, 1) + '\n'); geschrieben.push(rel(REG)); }
    var md = vorwaertsTafel(Rg);
    if (vorher[1].text !== md) { fs.writeFileSync(VMD, md); geschrieben.push(rel(VMD)); }
    wechsel.forEach(function (w) {
      var v = w.e.vorwaerts, absatz = '- ' + datumDe(heute) + ' — **Vorwaertsmessung** `' + w.kennung + '` ' + w.key + ': **' + w.urteil + '** (Status ' + w.status + ') — ' + ganz(v.nTage) + ' Signaltage ab Stichtag ' + w.e.stichtag + ' (Bedarf ' + ganz(w.e.nBedarf) + '), netto ' + de(v.netto) + ', t ' + de(v.t, 2) + ', p einseitig ' + de(v.p, 4) + ' gegen Holm-Schwelle ' + de(v.holmSchwelle, 4) + ' (' + v.holmM + ' faellige Konfigurationen). Ein Blick, kein zweiter.' + (w.e.marke ? ' **' + w.e.marke + '**.' : '') + ' Ordner `pruefstrasse/erledigt/' + w.kennung + '/`.';
      wikiAnhaengen(REPO, absatz, '- ' + datumDe(heute) + ' (Prüfstraße, ' + heute.slice(11, 16) + ' UTC) — Vorwaerts **' + w.kennung + ' ' + w.key + ': ' + w.urteil + '** (' + w.status + ').');
      if (w.urteil === 'belegt-Vorschlag') { fs.appendFileSync(VOR, (fs.existsSync(VOR) ? '' : '# Vorschlaege der Pruefstrasse an den PM (zweiter unabhaengiger Lauf ist Menschensache)\n\n') + absatz + '\n'); if (geschrieben.indexOf(rel(VOR)) === -1) geschrieben.push(rel(VOR)); }
    });
    if (wechsel.length) geschrieben.push('wiki/belegstand.md', 'wiki/log.md');
    var h = null;
    if (geschrieben.length) h = commit(geschrieben, 'Pruefstrasse: Vorwaerts ' + datumDe(heute) + ' - ' + (wechsel.length ? wechsel.map(function (w) { return w.kennung + ' ' + w.key + ' ' + w.urteil; }).join(', ') : 'Stand ' + kennungen.length + ' Kennungen, kein Statuswechsel'), REPO);
    log('Vorwaerts: ' + (geschrieben.length ? 'geaendert (' + geschrieben.join(', ') + '), Commit ' + (h || '').slice(0, 7) : 'unveraendert - kein Commit'));
    if (fs.existsSync(marke)) fs.unlinkSync(marke);
    return { geaendert: geschrieben.length > 0, commit: h, statuswechsel: wechsel.map(function (w) { return { kennung: w.kennung, key: w.key, urteil: w.urteil, status: w.status }; }), geschrieben: geschrieben };
  } catch (fehler) {
    var notizen = [];
    vorher.forEach(function (v) {
      var jetztT = fs.existsSync(v.abs) ? fs.readFileSync(v.abs, 'utf8') : null;
      if (jetztT !== v.text) { if (v.text == null) fs.unlinkSync(v.abs); else fs.writeFileSync(v.abs, v.text); }
      if (!v.gestaged) SG.git(REPO, ['restore', '--staged', '--', v.rel]);
    });
    var headNach = SG.aus(SG.git(REPO, ['rev-parse', 'HEAD']));
    if (headNach !== M.head) notizen.push('HEAD bewegt (' + String(M.head).slice(0, 7) + ' -> ' + String(headNach).slice(0, 7) + '): der PM entscheidet');
    M.fehler = String(fehler && fehler.message || fehler).slice(0, 600); M.abgebrochen = jetzt(); M.notizen = notizen; schreibeJson(marke, M);
    throw new Error('VORWAERTS abgebrochen, zurueckgestellt, Marke liegt (' + rel(marke) + '): ' + M.fehler);
  }
}
/** pruefstrasse/VORWAERTS.md: alle Konfigurationen mit Vorwaerts-Status (ohne Zeitstempel, damit unveraenderte Laeufe nichts schreiben). */
function vorwaertsTafel(Rg) {
  var z = Rg.konfigurationen.filter(function (e) { return e.status; });
  var o = ['# Vorwaertsbestaetigung der Pruefstrasse (Nr. 121-2a)', '', 'Geschrieben von `laeufer.js --vorwaerts`. Ein vorregistrierter Blick je Konfiguration: Stichtag = erster Handelstag nach Siegel 2, gezaehlt ohne Renditen, gemessen genau einmal bei Erreichen des Bedarfs. Simulation mit virtuellem Kapital, keine Anlageberatung.', '',
    '| Kennung | Konf | Status | Siegel 2 | Stichtag | Bedarf | Stand | Urteil | Vorwaerts netto / t / p | Marke |', '|---|---|---|---|---|---|---|---|---|---|'];
  z.forEach(function (e) { var v = e.vorwaerts; o.push('| ' + e.kennung + ' | ' + e.key + ' | ' + e.status + ' | ' + (e.siegel2Datum || '–') + ' | ' + (e.stichtag || '–') + ' | ' + ganz(e.nBedarf) + ' | ' + ganz(e.nStand) + ' | ' + e.urteil + ' | ' + (v ? de(v.netto) + ' / ' + de(v.t, 2) + ' / ' + de(v.p, 4) : '–') + ' | ' + (e.marke || '–') + ' |'); });
  if (!z.length) o.push('| – | – | – | – | – | – | – | – | – | – |');
  return o.join('\n') + '\n';
}
/** --nachmessen --grund-daten (C4): Wiedervorlage einer Regel mit mehr Daten - kein Messgeraet-Fehler noetig, Kandidatenordner unveraendert seit Siegel 1
 *  der Vormessung, Register zaehlt die Kennung danach (alte Zahl + 1)-fach. */
function nachmessungDatenPruefen(kennung, grund, ort) {
  var repo = ort.repo || K.REPO, erl = path.join(ort.erledigt || K.ERLEDIGT, kennung), ordnerAbs = path.join(ort.warteschlange || K.WARTESCHLANGE, kennung), fehler = [];
  var ordnerRel = path.relative(repo, ordnerAbs).replace(/\\/g, '/');
  if (!/^[a-z0-9-]+$/.test(String(kennung))) fehler.push('Kennung nur [a-z0-9-]');
  if (!grund || String(grund).trim().length < 20) fehler.push('--grund-daten fehlt oder ist kuerzer als 20 Zeichen (welche neuen Daten, bis wann)');
  var altPfad = path.join(erl, 'ergebnis.json');
  if (!fs.existsSync(altPfad)) fehler.push('kein erledigtes Protokoll: ' + path.relative(repo, altPfad).replace(/\\/g, '/') + ' fehlt');
  if (fehler.length) throw new Error('NACHMESSUNG abgelehnt: ' + fehler.join('; '));
  var alt = liesJson(altPfad);
  if (!alt.siegel1 || !alt.siegel1.commit) throw new Error('NACHMESSUNG abgelehnt: ergebnis.json ohne siegel1');
  var s1 = SG.siegel1(repo, ordnerRel);
  var baumAlt = SG.aus(SG.git(repo, ['rev-parse', alt.siegel1.commit + ':' + ordnerRel])), baumNeu = SG.aus(SG.git(repo, ['rev-parse', s1.commit + ':' + ordnerRel]));
  if (!baumAlt || baumAlt !== baumNeu) throw new Error('NACHMESSUNG abgelehnt: der Kandidatenordner hat sich seit Siegel 1 der Vormessung veraendert - die Regel wird nie nachgemessen');
  var vorher = fs.readdirSync(erl).filter(function (d) { return /^v\d+-\d{4}-\d{2}-\d{2}$/.test(d) && fs.statSync(path.join(erl, d)).isDirectory(); });
  var n = vorher.length + 1, ziel = 'v' + n + '-' + String(alt.stand || '').slice(0, 10);
  var Rg = register(ort.register), altZ = Rg.konfigurationen.filter(function (e) { return e.kennung === kennung; }).reduce(function (s, e) { return Math.max(s, e.zaehlt == null ? 1 : e.zaehlt); }, 1);
  var konf = ((alt.entdeckung && alt.entdeckung.konfigurationen) || []).map(function (k) { var e = k.entdeckung || {}; return { key: k.key, netto: e.uNetto ? e.uNetto.mittel : null, t: e.uNetto ? e.uNetto.t : null, se: e.uNetto ? e.uNetto.se : null, nTage: e.nTage || null, urteil: k.urteil }; });
  return { art: 'daten', zaehlt: altZ + 1, n: n, grund: String(grund).trim(), korrektur: null, korrekturTitel: null, korrekturDateien: [], vormessungCommit: null, repo: repo, ziel: ziel, erledigt: erl, blickePruefzeit: 0,
    alt: { stand: alt.stand, urteil: alt.urteil, grund: alt.grund, ordner: path.relative(repo, path.join(erl, ziel)).replace(/\\/g, '/'), konf: konf, pruefungGelesen: alt.pruefung != null, siegel1: alt.siegel1.commit } };
}

/* ---------- Eichung an bekanntem Effekt und Zufallssignal (Nr. 121-2a D, FORM.md §5; nur PM, vor jeder Freigabe) ----------
 * Echte Daten, Tafel gesperrt am EICHFENSTER (K.EICHUNG), H = 5. Zufallsregel (Seed) in zwei Dichten: marktweit (ein Signaltag je ~21 Handelstage fuer
 * alle Reihen, Modus zeit) und Querschnitt (~1 % der Reihen je Tag, Modus topf). Einsaat +0,30 Pp brutto auf die Rendite Eroeffnung(Einstieg) ->
 * Eroeffnung(Ausstieg) NUR der Signalfenster (adapter/tag.js messe opt.einsaat: nicht Placebo-, nicht Verschiebungs-, nicht Topf-Fenster), im Speicher.
 * EICHUNG.seeds Seeds Einsaat + Zufall je Dichte (30, PM 23.10.). Kriterien statistisch: Einsaat - Mittel innerhalb +- 2 se_Mittel um 0,30 UND zwischen
 * 0,20 und 0,40; Zufall - Mittel innerhalb +- 2 se_Mittel um 0, Anteil |t| > 2 hoechstens 15 % (Binomial 5 %, n 30: P(> 4) ~ 1,6 %). Schreibt AUSSCHLIESSLICH
 * pruefstrasse/EICHUNG.md und pruefstrasse/eichung.json; der Code prueft danach, dass unter pruefstrasse/ nichts anderes entstanden ist. */
/* Entscheid PM 23.10. (Nachbesserung): marktweit ein Signaltag je 10 Handelstage (vorher 21), 30 Seeds Einsaat + 30 Seeds Zufall je Dichte (vorher 10),
 * Zufall: Anteil |t| > 2 hoechstens 15 % (vorher 3 von 10). Laufzeitziel <= 10 min, sonst 20 Seeds. */
/* Nachbesserung QS 23.10.: 100 Zufall-Seeds je Dichte; die 30 Einsaat-Seeds minus 0,30 (die Einsaat ist exakt additiv) sind weitere Nullstichproben im Pool.
 * randRegel: der lokale Topf zaehlt nur Signale mit R Tafeltagen beidseitig in der Reihe (adapter/tag.js). */
var EICHUNG = { einsaatPp: 0.30, H: 5, seeds: 30, seedsZufall: 100, dichteMarkt: 1 / 10, dichteQuer: 0.01, seedEinsaat: 1, seedZufall: 101, zufallAnteilMax: 0.15, alterWarnTage: 60, randRegel: true };
function eichRegel(art, seed) {
  var p = art === 'marktweit' ? EICHUNG.dichteMarkt : EICHUNG.dichteQuer, A = require('./adapter/tag.js');
  return { signal: art === 'marktweit'
    ? function (sicht, i) { return A.mulberry32(A.fnv('eichung-markt|' + seed + '|' + sicht.tag(i)))() < p ? { dir: 1 } : null; }
    : function (sicht, i) { return A.mulberry32(A.fnv('eichung-quer|' + seed + '|' + sicht.reihe + '|' + sicht.tag(i)))() < p ? { dir: 1 } : null; } };
}
/** Kriterien einer Zehnerreihe (Werte = u brutto der Schaetzungen, t = t-Werte). */
/* Kriterium (Nachbesserung QS 23.10., beide Dichten): auf dem festen Marktpfad sind die Zufallsplaene unabhaengige Ziehungen; fuer ein fehlerfreies Geraet ist
 * der Erwartungswert ueber Plaene null, se_Mittel = sd / Wurzel(n) ist der richtige Massstab fuer einen Geraeteversatz (QS: sd ueber 130 Seeds 0,58 ~ mittlere se
 * je Lauf 0,54, keine versteckte gemeinsame Komponente). Die kurzzeitige Variante "2 x mittlere se je Lauf" (Nachbesserung 2) ist zurueckgenommen. */
function eichungBewerten(werte, tWerte, soll, opt) {
  opt = opt || {};
  var n = werte.length, m = werte.reduce(function (s, x) { return s + x; }, 0) / n, sd = Math.sqrt(werte.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (n - 1)), se = sd / Math.sqrt(n);
  var innen = Math.abs(m - soll) <= 2 * se, aus = { n: n, mittel: m, sd: sd, seMittel: se, t: se > 0 ? (m - soll) / se : null, soll: soll, kriterium: 'se_Mittel', innerhalb2se: innen };
  if (soll > 0) { aus.spanneOk = m >= 0.20 && m <= 0.40; aus.bestanden = innen && aus.spanneOk; }
  else { aus.tUeber2 = tWerte.filter(function (t) { return Math.abs(t) > 2; }).length; aus.anteilTUeber2 = aus.tUeber2 / n; aus.bestanden = innen && aus.anteilTUeber2 <= EICHUNG.zufallAnteilMax; }
  return aus;
}
/** Welche Pfade unter pruefstrasse/ hat ein Lauf neu veraendert (git status vorher/nachher), ausser den erlaubten? */
/* Nachbesserung 23.10.: Vergleich ueber den PFAD jeder Zeile (Status-Kuerzel abgetrennt), nicht ueber die rohe Zeile - SG.aus schnitt den fuehrenden
 * Leerraum der ersten Zeile ab (" M x" -> "M x"), dadurch galt eine vorher schon geaenderte Datei als neu geschrieben (Fehlalarm im Lauf 23.10. 14:2x). */
function pfadAus(z) { var m = /^\s*[MADRCU?!T ]{1,2}\s+(.*)$/.exec(z); return (m ? m[1] : z).replace(/"/g, '').replace(/^.* -> /, ''); }
function fremdGeschrieben(vor, nach, erlaubt) {
  var vorZ = {}; vor.forEach(function (z) { vorZ[pfadAus(z)] = z.replace(/^\s+/, ''); });
  return nach.filter(function (z) { var p = pfadAus(z); return erlaubt.indexOf(p) === -1 && vorZ[p] !== z.replace(/^\s+/, ''); });
}
function statusZeilen(repo) { var r = SG.git(repo, ['status', '--porcelain', '--untracked-files=all', '--', 'pruefstrasse']); return r.status === 0 ? r.stdout.toString('utf8').split('\n').filter(function (z) { return z.trim(); }) : []; }
/** --eichung. opt = { tafel (Tests: Kunsttafel), seeds, aus (Ordner, Vorgabe pruefstrasse/), repo, log } */
function eichung(opt) {
  opt = opt || {};
  var REPO = opt.repo || K.REPO, ausOrd = opt.aus || K.HIER, seeds = opt.seeds || EICHUNG.seeds, log = opt.log || function (t) { console.log(jetzt() + '  ' + t); }, A = require('./adapter/tag.js');
  var erlaubt = [path.relative(REPO, path.join(ausOrd, 'EICHUNG.md')).replace(/\\/g, '/'), path.relative(REPO, path.join(ausOrd, 'eichung.json')).replace(/\\/g, '/')];
  var vor = statusZeilen(REPO), t0 = Date.now();
  var TF = opt.tafel || require('./tafel.js').oeffne({ quelle: 'panel' });                  /* ohne Siegel: gesperrt am Eichfenster */
  var tLesen = Date.now() - t0, zeilen = [], ergebnis = {};
  log('Eichung: Tafel ' + TF.quelle + ' (' + TF.kennung + '), ' + TF.reihen.length + ' Reihen, bis ' + TF.tage[TF.maxTag] + (TF.gesperrt ? ' (gesperrt am Eichfenster)' : '') + ', gelesen in ' + tLesen + ' ms');
  [['marktweit', 'zeit'], ['querschnitt', 'topf']].forEach(function (dm) {
    var art = dm[0], modus = dm[1], reihen = { einsaat: [], zufall: [] };
    ['einsaat', 'zufall'].forEach(function (typ) {
      for (var s = 0; s < (typ === 'einsaat' ? seeds : (opt.seedsZufall || EICHUNG.seedsZufall)); s++) {
        var seed = (typ === 'einsaat' ? EICHUNG.seedEinsaat : EICHUNG.seedZufall) + s, ts = Date.now();
        var kand = { kennung: 'eichung-' + art + '-' + typ + '-' + seed, form: 'tag', bewertung: modus, konfigurationen: [{ key: 'H' + EICHUNG.H, richtung: 'long', haltedauer: EICHUNG.H }], params: {} };
        var E = A.lauf(eichRegel(art, seed), kand, { tafel: TF, einsaat: typ === 'einsaat' ? EICHUNG.einsaatPp : 0 }), k = E.konfigurationen[0], e = k.entdeckung;
        var z = { art: art, modus: modus, typ: typ, seed: seed, uBrutto: e.uBrutto.mittel, se: e.uBrutto.se, t: e.uBrutto.t, uNetto: e.uNetto.mittel, nTage: e.nTage, nTr: e.nTr, signalAnteil: E.signalAnteil ? E.signalAnteil.mittel : null, ms: Date.now() - ts };
        reihen[typ].push(z); zeilen.push(z);
        log('  ' + art + ' ' + typ + ' Seed ' + seed + ': u brutto ' + de(z.uBrutto) + ' (se ' + de(z.se) + ', t ' + de(z.t, 2) + '), ' + z.nTage + ' Signaltage, ' + z.nTr + ' Trades, ' + z.ms + ' ms');
      }
    });
  });
  var A2 = eichungAuswerten(zeilen); ergebnis = A2.ergebnis; var urteilText = A2.urteil;
  var ms = Date.now() - t0, bestanden = A2.bestanden;
  var J = { kennung: 'pruefstrasse/eichung/v1', stand: jetzt(), datum: jetzt().slice(0, 10), panelKennung: TF.kennung, panelBau: TF.bau || null, panelOrdner: TF.panelOrdner || null, quelle: TF.quelle, eichfenster: { von: K.EICHUNG.von, bis: K.EICHUNG.bis, letzterTag: TF.tage[TF.maxTag], gesperrt: !!TF.gesperrt },
    einstellungen: EICHUNG, seeds: { einsaat: [EICHUNG.seedEinsaat, EICHUNG.seedEinsaat + seeds - 1], zufall: [EICHUNG.seedZufall, EICHUNG.seedZufall + (opt.seedsZufall || EICHUNG.seedsZufall) - 1] }, ergebnis: ergebnis, bestanden: bestanden, urteil: urteilText, laufzeitMs: ms, lesenMs: tLesen, laeufe: zeilen };
  schreibeJson(path.join(ausOrd, 'eichung.json'), J);
  fs.writeFileSync(path.join(ausOrd, 'EICHUNG.md'), eichungMarkdown(J));
  return eichungWaechter(J, vor, REPO, ausOrd, erlaubt, log);
}
/** Ergebnis je Dichte aus den gespeicherten Einzellaeufen (art, typ, uBrutto, se, t); marktweit mit dem Marktpfad-Kriterium. */
function eichungAuswerten(zeilen) {
  var ergebnis = {};
  [['marktweit', 'zeit'], ['querschnitt', 'topf']].forEach(function (dm) {
    var art = dm[0], z = function (typ) { return zeilen.filter(function (x) { return x.art === art && x.typ === typ; }); };
    var ze = z('einsaat'), zz = z('zufall');
    /* Nullpool = Zufall-Seeds + Einsaat-Seeds minus 0,30 (t neu gegen 0: (u - 0,30) / se je Lauf) */
    var pool = zz.map(function (x) { return { u: x.uBrutto, t: x.t }; }).concat(ze.map(function (x) { return { u: x.uBrutto - EICHUNG.einsaatPp, t: x.se > 0 ? (x.uBrutto - EICHUNG.einsaatPp) / x.se : null }; }));
    var mw = function (a, f) { return a.length ? a.reduce(function (s, x) { return s + f(x); }, 0) / a.length : null; };
    /* Nachbesserung 5: verglichen wird BRUTTO (Geraeteversatz); netto und die mittlere Huerde stehen nachrichtlich daneben (unter der Null ist netto = -Huerde) */
    var nachr = { bruttoZufall: mw(zz, function (x) { return x.uBrutto; }), nettoZufall: mw(zz, function (x) { return x.uNetto; }), bruttoEinsaat: mw(ze, function (x) { return x.uBrutto; }), nettoEinsaat: mw(ze, function (x) { return x.uNetto; }) };
    nachr.huerde = nachr.bruttoZufall != null && nachr.nettoZufall != null ? nachr.bruttoZufall - nachr.nettoZufall : null;
    ergebnis[art] = { modus: dm[1], groesse: 'u brutto', nachrichtlich: nachr, einsaat: eichungBewerten(ze.map(function (x) { return x.uBrutto; }), ze.map(function (x) { return x.t; }), EICHUNG.einsaatPp),
      zufall: eichungBewerten(pool.map(function (x) { return x.u; }), pool.map(function (x) { return x.t; }), 0), poolAus: { zufall: zz.length, einsaatMinus030: ze.length } };
  });
  ['marktweit', 'querschnitt'].forEach(function (a) { ergebnis[a].bestanden = ergebnis[a].einsaat.bestanden && ergebnis[a].zufall.bestanden; });
  var alle = ergebnis.marktweit.bestanden && ergebnis.querschnitt.bestanden;
  /* Abschluss Nr. 121-2a: Urteil je Dichte; marktweit dicht (1/10) nicht bestanden -> Vorbehalt im Protokoll fuer zeit-Plaene mit Abstand < ZEIT_DICHTE_WARNUNG */
  var urteil = alle ? 'bestanden' : (ergebnis.querschnitt.bestanden && !ergebnis.marktweit.bestanden)
    ? 'bestanden fuer Querschnitt und marktweit ab Abstand >= ' + K.ZEIT_DICHTE_WARNUNG + ' Tage; NICHT bestanden fuer dichte marktweite Plaene (Dichte ' + (EICHUNG.dichteMarkt === 0.1 ? '1/10' : EICHUNG.dichteMarkt) + ')'
    : 'NICHT bestanden';
  return { ergebnis: ergebnis, bestanden: alle, urteil: urteil };
}
function eichungWaechter(J, vor, REPO, ausOrd, erlaubt, log) {
  var fremd = fremdGeschrieben(vor, statusZeilen(REPO), erlaubt);
  if (fremd.length) { J.waechter = 'fremd: ' + fremd.join(', '); schreibeJson(path.join(ausOrd, 'eichung.json'), J); throw new Error('EICHUNG: hat ausser EICHUNG.md/eichung.json geschrieben: ' + fremd.join(', ')); }
  J.waechter = 'sauber'; schreibeJson(path.join(ausOrd, 'eichung.json'), J);
  log('Eichung ' + (J.bestanden ? 'bestanden' : 'NICHT bestanden') + ' in ' + (J.laufzeitMs / 1000).toFixed(0) + ' s - ' + erlaubt.join(', '));
  return J;
}
/** --eichung-bewerten (PM): die gespeicherten Einzellaeufe aus eichung.json nach dem geltenden Kriterium neu bewerten - kein neuer Lauf. */
function eichungNeuBewerten(opt) {
  opt = opt || {};
  var REPO = opt.repo || K.REPO, ausOrd = opt.aus || K.HIER, log = opt.log || function (t) { console.log(jetzt() + '  ' + t); };
  var erlaubt = [path.relative(REPO, path.join(ausOrd, 'EICHUNG.md')).replace(/\\/g, '/'), path.relative(REPO, path.join(ausOrd, 'eichung.json')).replace(/\\/g, '/')], vor = statusZeilen(REPO);
  var J = liesJson(path.join(ausOrd, 'eichung.json'));
  if (!J.laeufe || !J.laeufe.every(function (z) { return z.se != null && z.t != null; })) throw new Error('EICHUNG: eichung.json ohne se/t je Lauf - neu eichen (--eichung)');
  var A2 = eichungAuswerten(J.laeufe), alt = { bestanden: J.bestanden, ergebnis: J.ergebnis };
  J.ergebnis = A2.ergebnis; J.bestanden = A2.bestanden; J.urteil = A2.urteil; J.neuBewertet = { stand: jetzt(), grund: opt.grund || 'Neubewertung der gespeicherten Laeufe nach dem geltenden Kriterium', vorher: { bestanden: alt.bestanden } };
  schreibeJson(path.join(ausOrd, 'eichung.json'), J);
  fs.writeFileSync(path.join(ausOrd, 'EICHUNG.md'), eichungMarkdown(J));
  return eichungWaechter(J, vor, REPO, ausOrd, erlaubt, log);
}
function eichungMarkdown(J) {
  var ergebnis = J.ergebnis, bestanden = J.bestanden, zeilen = J.laeufe, ms = J.laufzeitMs, tLesen = J.lesenMs, E1 = J.einstellungen || EICHUNG;
  var o = ['# Eichung der Pruefstrasse (Nr. 121-2a) — ' + (J.urteil ? '**' + J.urteil + '**' : bestanden ? '**bestanden**' : '**NICHT bestanden**'), '',
    (J.urteil && !bestanden && ergebnis.querschnitt.bestanden ? 'Je Dichte: Querschnitt **bestanden**, marktweit 1/10 **nicht bestanden** (Nullpunkt brutto ' + de(ergebnis.marktweit.zufall.mittel, 3) + ' ± ' + de(ergebnis.marktweit.zufall.seMittel, 3) + ' Pp, Ursache offen, Nr. 124). Marktweit ab Abstand ≥ ' + K.ZEIT_DICHTE_WARNUNG + ' Handelstage: kein Versatz gefunden — Beleg QS 23.10. Dichte 1/21, 60 Seeds +0,011 ± 0,090 Pp, und Bau 1/21, 10 Seeds +0,009 ± 0,21 (geringe Trennschärfe: ein Versatz unter ≈ 0,18 Pp ist damit nicht ausgeschlossen). Protokolle im Modus zeit mit dichterem Plan tragen den Vorbehalt „Messgerät unter Vorbehalt: dichter Plan" (`konfig.js` `ZEIT_DICHTE_WARNUNG`).' : ''), '',
    'Datum ' + J.datum + ', Panel `' + J.panelKennung + '`' + (J.panelBau ? ' bau `' + J.panelBau + '`' : '') + (J.panelOrdner ? ' (' + J.panelOrdner + ')' : '') + ' (' + J.quelle + '), Eichfenster ' + K.EICHUNG.von + ' … ' + K.EICHUNG.bis + ' (letzter gelesener Tag ' + J.eichfenster.letzterTag + '), H = ' + E1.H + ', marktweit ein Signaltag je ' + Math.round(1 / E1.dichteMarkt) + ' Handelstage, Querschnitt ' + (100 * E1.dichteQuer).toFixed(0) + ' % der Reihen je Tag, Einsaat +' + E1.einsaatPp.toFixed(2).replace('.', ',') + ' Pp brutto nur auf die Signalfenster (im Speicher), Seeds Einsaat ' + J.seeds.einsaat.join('–') + ', Zufall ' + J.seeds.zufall.join('–') + '. Laufzeit ' + (ms / 1000).toFixed(0) + ' s (davon Lesen ' + (tLesen / 1000).toFixed(0) + ' s).' + (J.neuBewertet ? ' **Neu bewertet** ' + J.neuBewertet.stand.slice(0, 16).replace('T', ' ') + ' UTC aus den gespeicherten Läufen (kein neuer Lauf): ' + J.neuBewertet.grund + '; vorher bestanden: ' + J.neuBewertet.vorher.bestanden + '.' : ''), '',
    '| Dichte | Modus | Reihe | n | Mittel u brutto | sd | se_Mittel | t gegen Soll | Soll | innerhalb ± 2 se_Mittel | weiteres Kriterium | bestanden |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  ['marktweit', 'querschnitt'].forEach(function (a) { ['einsaat', 'zufall'].forEach(function (typ) { var b = ergebnis[a][typ]; o.push('| ' + a + ' | ' + ergebnis[a].modus + ' | ' + (typ === 'zufall' && ergebnis[a].poolAus ? 'Nullpool (' + ergebnis[a].poolAus.zufall + ' Zufall + ' + ergebnis[a].poolAus.einsaatMinus030 + ' Einsaat − 0,30)' : typ) + ' | ' + b.n + ' | ' + de(b.mittel) + ' | ' + de(b.sd) + ' | ' + de(b.seMittel) + ' | ' + de(b.t, 2) + ' | ' + de(b.soll, 2) + ' | ' + (b.innerhalb2se ? 'ja' : 'nein') + ' | ' + (typ === 'einsaat' ? 'Mittel in 0,20 … 0,40: ' + (b.spanneOk ? 'ja' : 'nein') : '|t| > 2: ' + b.tUeber2 + ' von ' + b.n + ' = ' + (100 * b.anteilTUeber2).toFixed(0) + ' % (höchstens 15 %)') + ' | ' + (b.bestanden ? 'ja' : '**nein**') + ' |'); }); });
  o.push(''); o.push('Verglichen wird **u brutto** (Geräteversatz, Nachbesserung 5); nachrichtlich netto und mittlere Hürde: ' + ['marktweit', 'querschnitt'].map(function (a) { var n = ergebnis[a].nachrichtlich || {}; return a + ' Zufall brutto ' + de(n.bruttoZufall) + ' / netto ' + de(n.nettoZufall) + ', Einsaat brutto ' + de(n.bruttoEinsaat) + ' / netto ' + de(n.nettoEinsaat) + ', mittlere Hürde ' + de(n.huerde); }).join('; ') + '.');
  o.push(''); o.push('Einzelläufe: ' + zeilen.map(function (z) { return z.art.slice(0, 5) + '/' + z.typ.slice(0, 3) + '/' + z.seed + ' ' + de(z.uBrutto, 3) + ' (t ' + de(z.t, 1) + ', ' + z.nTage + ' T)'; }).join('; ') + '.');
  o.push(''); o.push('Kriterien (FORM.md §5, Nachbesserung QS 23.10., beide Dichten): Nullpool = ' + (J.seeds.zufall[1] - J.seeds.zufall[0] + 1) + ' Zufall-Seeds + die Einsaat-Seeds minus 0,30 (Einsaat exakt additiv) — |Mittel| ≤ 2 · se_Mittel und Anteil |t| > 2 ≤ 15 %; Einsaat — Mittel innerhalb ± 2 · se_Mittel um 0,30 und zwischen 0,20 und 0,40. Auf dem festen Marktpfad sind die Zufallspläne unabhängige Ziehungen, se_Mittel ist der Maßstab für einen Geräteversatz. Lokaler Topf mit Randregel (Signal braucht R Tafeltage beidseitig in seiner Reihe). Die Eichung fährt der PM vor jeder Freigabe (`node pruefstrasse/laeufer.js --eichung`, Neubewertung gespeicherter Läufe: `--eichung-bewerten`); `test.js` prüft Form und Alter (> ' + EICHUNG.alterWarnTage + ' Tage: Warnung). Simulation mit virtuellem Kapital, keine Anlageberatung.');
  return o.join('\n') + '\n';
}

module.exports = { richtungAusSiegel: richtungAusSiegel, eichungNeuBewerten: eichungNeuBewerten, eichungAuswerten: eichungAuswerten, eichung: eichung, eichRegel: eichRegel, eichungBewerten: eichungBewerten, fremdGeschrieben: fremdGeschrieben, EICHUNG: EICHUNG, vorwaerts: vorwaerts, vorwaertsKind: vorwaertsKind, vormerken: vormerken, wiedervorlagen: wiedervorlagen, machbarkeitsPhase: machbarkeitsPhase, stichtagNach: stichtagNach, VORWAERTS_MARKE: VORWAERTS_MARKE, ladeKandidat: ladeKandidat, pruefen: pruefen, naechster: naechster, laufe: laufe, messen: messen, urteile: urteile, holm: holm, register: register,
  registerEintragen: registerEintragen, ergebnisMarkdown: ergebnisMarkdown, belegstandAbsatz: belegstandAbsatz, messgeraetDetails: messgeraetDetails, URTEILE: URTEILE, PFLICHT: PFLICHT,
  nachmessungPruefen: nachmessungPruefen, nachmessungVerschieben: nachmessungVerschieben, nachmessSperre: nachmessSperre, NACHMESS_MARKE: NACHMESS_MARKE, nachmessungAbsatz: nachmessungAbsatz, nachmessen: nachmessen, obereGrenze: obereGrenze, versatzAbschnitt: versatzAbschnitt };

if (require.main === module) {
  var a = process.argv.slice(2), arg = function (n) { var i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; }, trocken = a.indexOf('--trocken') !== -1;
  try {
    if (a.indexOf('--pruefen') !== -1) { var B = pruefen(arg('--pruefen')); console.log(JSON.stringify(B, null, 1)); process.exit(B.gueltig ? 0 : 1); }
    else if (a.indexOf('--messen') !== -1) { var xd = arg('--extra'), ex = xd ? liesJson(xd) : null; if (xd) fs.unlinkSync(xd); messen(arg('--messen'), arg('--phase'), arg('--aus'), ex); console.log('fertig ' + arg('--phase')); }
    else if (a.indexOf('--kandidat') !== -1) { var r = laufe(arg('--kandidat'), { trocken: trocken }); console.log(JSON.stringify(r)); process.exit(r.abbruch ? 1 : 0); }
    else if (a.indexOf('--nachmessen') !== -1) { var rN = a.indexOf('--grund-daten') !== -1 ? nachmessen(arg('--nachmessen'), arg('--grund-daten'), null, { art: 'daten' }) : nachmessen(arg('--nachmessen'), arg('--grund'), arg('--korrektur')); console.log(JSON.stringify(rN)); process.exit(rN.abbruch ? 1 : 0); }
    else if (a.indexOf('--eichung-bewerten') !== -1) { var J2 = eichungNeuBewerten({}); process.exit(J2.bestanden ? 0 : 1); }
    else if (a.indexOf('--eichung') !== -1) { var J = eichung({}); process.exit(J.bestanden ? 0 : 1); }
    else if (a.indexOf('--vorwaerts') !== -1) { var rV = vorwaerts({}); console.log(JSON.stringify({ geaendert: rV.geaendert, commit: rV.commit, statuswechsel: rV.statuswechsel })); process.exit(0); }
    else if (a.indexOf('--naechster') !== -1) { var n = naechster(); if (!n) { console.log('Warteschlange: kein gueltiger Kandidat'); process.exit(0); } var r2 = laufe(n, { trocken: trocken }); console.log(JSON.stringify(r2)); process.exit(r2.abbruch ? 1 : 0); }
    else { console.log('--pruefen <kennung> | --kandidat <kennung> [--trocken] | --naechster [--trocken] | --vorwaerts | --nachmessen <kennung> --grund "<Text>" --korrektur <commit> | --nachmessen <kennung> --grund-daten "<Text>" (nur PM)'); process.exit(2); }
  } catch (e) { console.error(e.stack || e.message); process.exit(1); }
}
