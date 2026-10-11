'use strict';
/* DER LAEUFER der Pruefstrasse (FORM.md; Auftrag Nr. 110 §2).
 *   node pruefstrasse/laeufer.js --pruefen <kennung>              Form, test.js, Siegel 1 moeglich?  (Rueckgabe 0 = gueltig)
 *   node pruefstrasse/laeufer.js --kandidat <kennung> [--trocken]  ein Kandidat durch die Strasse (--trocken: nur Zaehlungen)
 *   node pruefstrasse/laeufer.js --naechster [--trocken]           der aelteste gueltige Kandidat der Warteschlange
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
  if (fs.readFileSync(path.join(ordner, 'REGEL.md'), 'utf8').trim().length < 200) fehler.push('REGEL.md zu kurz (Prosa mit Fundstellen)');
  try {
    regel = require(path.join(ordner, 'regel.js'));
    (SCHNITTSTELLE[kand.form] || []).forEach(function (f) { if (regel[f] == null) fehler.push('regel.js ohne ' + f + ' (Form ' + kand.form + ')'); });
    if (kand.form === 'tag' && kand.daten && kand.daten !== 'panel' && kand.daten !== 'trendkanal-tage') fehler.push('daten muss panel | trendkanal-tage sein');
  } catch (e) { fehler.push('regel.js laedt nicht: ' + e.message); }
  return { kennung: kennung, ordner: ordner, kand: kand, regel: regel, fehler: fehler };
}
/** --pruefen: Form, test.js (eigener Prozess), Siegel 1. */
function pruefen(kennung, opt) {
  opt = opt || {};
  var L = ladeKandidat(kennung), bericht = { kennung: kennung, form: L.fehler, test: null, siegel1: null, gueltig: false };
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
function naechster() {
  if (!fs.existsSync(K.WARTESCHLANGE)) return null;
  var liste = fs.readdirSync(K.WARTESCHLANGE).filter(function (d) { return fs.existsSync(path.join(K.WARTESCHLANGE, d, 'kandidat.json')); })
    .map(function (d) { var k = null; try { k = liesJson(path.join(K.WARTESCHLANGE, d, 'kandidat.json')); } catch (e) { k = {}; } return { kennung: d, datum: String(k.datum || '9999') }; })
    .sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : (a.kennung < b.kennung ? -1 : 1); });
  for (var i = 0; i < liste.length; i++) {
    var k = liste[i].kennung;
    if (fs.existsSync(path.join(K.ERLEDIGT, k, 'ergebnis.json'))) continue;
    if (pruefen(k).gueltig) return k;
  }
  return null;
}

/* ---------- Register (§6) ---------- */
function register() { return fs.existsSync(K.REGISTER) ? liesJson(K.REGISTER) : { kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 }; }
/* Zahl fuer den Bericht - ein leeres Register (erster Lauf, Trockenlauf) hat noch keine Erwartung (PM 11.10.: Trockenlauf stuerzte an .toFixed). */
function zufallText(Rg) { return typeof Rg.zufallErwartet === 'number' ? Rg.zufallErwartet.toFixed(1) : '–'; }
function registerEintragen(Rg, kennung, form, konf, datum) {
  Rg.konfigurationen = Rg.konfigurationen.filter(function (e) { return e.kennung !== kennung; });
  konf.forEach(function (k) { Rg.konfigurationen.push({ kennung: kennung, form: form, key: k.key, urteil: k.urteil, datum: datum }); });
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
    else if (kand.form === 'korb') E = require('./adapter/korb.js').lauf(regel, kand, { pruefzeit: pruefzeit, siegelPfad: siegelPfad, pruefung: pruefzeit ? { von: '2023-01-03' } : null });
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
function urteile(E, P, Rg) {
  var konf = E.konfigurationen, fehler = [];
  if (E.verstoesse > 0) fehler.push('Blick nach vorn: ' + E.verstoesse + ' Verstoesse (' + (E.beispiele || []).slice(0, 3).join(', ') + ')');
  /* Gegenprobe "Signal um 20 Tage verschoben": zeigt eine Konfiguration mit Wirkung (netto > 0, t >= 2) dieselbe Wirkung auch verschoben,
   * sitzt sie nicht in der Regel, sondern im Messgeraet (Kalender, Zelle, Daten) - unabhaengig davon, ob Tor 1 oder Placebo sie schon kippen. */
  konf.forEach(function (k) { var e = k.entdeckung && k.entdeckung.uNetto; if (e && e.mittel > 0 && e.t >= K.KANDIDAT_T && k.versatz && k.versatz.wirkt) fehler.push(k.key + ': das um ' + K.VERSATZ_TAGE + ' Tage verschobene Signal wirkt ebenso (netto ' + de(k.versatz.uNetto.mittel) + ', t ' + de(k.versatz.uNetto.t, 2) + ')'); });
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
      k.urteil = z.belegt ? 'belegt-Vorschlag' : (netto != null && netto <= 0 && (pr.uNetto ? pr.uNetto.t <= -K.KANDIDAT_T : true)) ? 'nein' : 'nicht entscheidbar';
    });
    var belegt = zeilen.filter(function (z) { return z.belegt; });
    if (belegt.length) { urteil = 'belegt-Vorschlag'; grund = belegt.map(function (z) { return z.key; }).join(', ') + ' bestehen Holm ueber ' + konf.length + ' Konfigurationen (einseitig 5 %), gleiche Richtung, netto > 0' + (belegt.every(function (z) { return z.holmRegister; }) ? '; auch Holm ueber das Register (' + Rg.gesamt + ')' : '; NICHT Holm ueber das Register (' + Rg.gesamt + ')'); }
    else if (zeilen.every(function (z) { return z.netto != null && z.netto <= 0; })) { urteil = 'nein'; grund = 'alle ' + zeilen.length + ' Kandidaten in der Pruefung netto <= 0'; }
    else { urteil = 'nicht entscheidbar'; grund = 'Pruefung ohne Holm-Treffer (p ' + zeilen.map(function (z) { return z.key + ' ' + z.p.toFixed(3); }).join(', ') + ')'; }
  } else if (konf.every(function (k) { return k.urteil === 'nein'; })) { urteil = 'nein'; grund = 'jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)'; }
  else { urteil = 'nicht entscheidbar'; grund = 'kein Kandidat (' + konf.filter(function (k) { return k.urteil === 'nein'; }).length + ' von ' + konf.length + ' ausgeschlossen, Rest unter der Aufloesung)'; }
  return { urteil: urteil, grund: grund, kandidaten: kandidaten.length, fehler: fehler };
}

/* ---------- Berichte ---------- */
function zeileTag(k) {
  var e = k.entdeckung, u = e.uNetto;
  return '| ' + k.key + ' | ' + k.richtung + ' ' + k.haltedauer + ' T | ' + e.nTage + ' | ' + ganz(e.nTr) + ' | ' + de(e.uBrutto.mittel) + ' | ' + de(u.mittel) + ' | ' + de(u.t, 2) + ' | ' + de(u.se) + ' | ' + de(k.mde80) + ' | ' +
    (k.tor1 ? 'ja' : 'nein') + ' | ' + (k.placebo.verstoss ? 'VERSTOSS' : de(k.placebo.uBrutto.mittel) + ' (t ' + de(k.placebo.uBrutto.t, 2) + ')') + ' | ' + de(k.versatz.uNetto.mittel) + ' (t ' + de(k.versatz.uNetto.t, 2) + ')' + ' | ' +
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
  tag: '| Konf | Richtung, H | Ent Tage | Trades | u brutto | u netto | t | se HH | MDE80 | Tor 1 | Placebo | verschoben 20 T | Einstieg +1 T | Δ alle−lebend | Abgaenge | Urteil | Pruefung Tage / netto / t |',
  korb: '| Konf | Fenster | Buch / SPY | Abstand p. a. | Median 63 | vorn | Rang gegen 200 Zufallsbuecher | Rueckschlag | Reihenenden | Urteil | Pruefung Median / Rang |',
  minute: '| Konf | Signale | brutto je Signal | Huerde | netto je Signal | t | MDE | delta80 | Maschine | Urteil | Pruefung netto / t |',
};
function ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, trocken) {
  var konf = E.konfigurationen, o = [];
  o.push('# ' + kand.titel + ' — ' + (trocken ? 'TROCKENLAUF (nur Zaehlungen)' : '**' + U.urteil + '**'));
  o.push('');
  o.push('**Kurzfassung.** Kandidat `' + kand.kennung + '` (Form ' + kand.form + ', ' + konf.length + ' Konfigurationen, vorab festgelegt), gemessen ' + datumDe(E.stand) + ' auf ' + E.quelle + ' (' + (E.kennungTafel || E.archiv || '') + ').' +
    (trocken ? ' Trockenlauf: keine Urteile.' : ' **Urteil: ' + U.urteil + '** — ' + U.grund + '. Kandidaten nach der Entdeckung: ' + U.kandidaten + '.') +
    ' Register: ' + Rg.gesamt + ' Konfigurationen bisher insgesamt geprueft, ' + zufallText(Rg) + ' Zufallstreffer (t ≥ 2) zu erwarten.' +
    ' Erwartung vorab: ' + kand.erwartung.groesse + ' (' + kand.erwartung.richtung + ').');
  o.push('');
  o.push('Siegel 1 (Kandidatenordner) `' + (siegel1 ? siegel1.commit.slice(0, 12) : '–') + '`' + (siegel2 ? ', Siegel 2 (KANDIDATEN.json) `' + siegel2.commit.slice(0, 12) + '`' : ', kein Siegel 2 (keine Pruefung)') +
    '. Entdeckung bis ' + (E.schnitt ? 'vor ' + E.schnitt : K.ENTDECKUNG_BIS) + ', Pruefung ab ' + (E.form === 'minute' ? K.MINUTE.sperreAb : K.SPERRE_AB) + ' nur fuer Kandidaten. Kriterien: netto > 0, t ≥ ' + K.KANDIDAT_T +
    ' (Kandidaten-Kriterium), Tor 1 (Entdeckung ≥ ' + K.TOR1_FAKTOR + ' × projizierte Bestaetigungs-MDE), kein Placebo-Verstoss (|Placebo| > ' + K.PLACEBO_T + ' se und > ¼ Huerde); MDE80 = ' + K.MDE_FAKTOR + ' × se ist die Aufloesung, kein Kriterium.');
  o.push('');
  o.push('## Konfigurationen');
  o.push('');
  o.push(KOPF[kand.form]); o.push(KOPF[kand.form].replace(/[^|]+/g, '---'));
  konf.forEach(function (k) { o.push(kand.form === 'tag' ? zeileTag(k) : kand.form === 'korb' ? zeileKorb(k) : zeileMinute(k)); });
  o.push('');
  o.push('Alle Groessen in Pp' + (kand.form === 'korb' ? ' p. a. bzw. $' : ' je Trade/Signal (Tagesmittel), se Hansen-Hodrick') + '. ' + (kand.form === 'tag' ? 'Gegenproben: Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung; verschoben = dasselbe Signal 20 Handelstage spaeter (wirkt es, ist das Messgeraet verdaechtig); Einstieg +1 T bei festem Ausstieg; Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige).' : kand.form === 'korb' ? 'Placebo = 200 Zufallsbuecher derselben Zielzahl aus denselben zulaessigen Werten (Nr. 100); Startphasen = 63 Starttage; Reihenenden getrennt nach Grund. Die Gegenproben "Signal verschoben" und "alle gegen lebend" sind fuer diese Form nicht abbildbar (die Zielfunktion lehnt veraltete Kurse ab; Reihenenden buchen nach der Hauptregel).' : 'Zahlen der Messmaschine (Bestaetigungshaelfte ihres Schnitts B5); Placebo und Kontrolle A7 der Maschine im Protokoll.'));
  o.push('');
  o.push('## Zaehler und Quelle');
  o.push('');
  o.push('`' + JSON.stringify(E.zaehler || {}) + '`' + (E.verstoesse != null ? ' — Verstoesse gegen „kein Blick nach vorn": ' + E.verstoesse : '') + (E.ms ? ' — Laufzeit ' + JSON.stringify(E.ms) : ''));
  o.push('Quelle: ' + E.quelle + (E.reihen ? ', ' + E.reihen + ' Reihen, letzter Tag ' + E.letzterTag : '') + (E.korb ? ', Korb ' + E.korb : '') + '. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.');
  return o.join('\n') + '\n';
}
function belegstandAbsatz(kand, E, U, Rg, siegel1, siegel2) {
  var konf = E.konfigurationen, beste = konf.slice().sort(function (a, b) { return (bNetto(b) || -1e9) - (bNetto(a) || -1e9); })[0];
  function bNetto(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.mittel : e.buch ? e.buch.startphasen.median : e.nettoJeSignalPp; }
  function bT(k) { var e = k.entdeckung; return e.uNetto ? e.uNetto.t : e.buch ? null : e.t; }
  return '- ' + datumDe(E.stand) + ' — **' + kand.titel + '** (`' + kand.kennung + '`, Form ' + kand.form + ', ' + konf.length + ' Konfigurationen): **' + U.urteil + '** — ' + U.grund + '. ' +
    'Beste Entdeckungszeile ' + beste.key + ': netto ' + de(bNetto(beste), kand.form === 'korb' ? 2 : 4) + (bT(beste) != null ? ' (t ' + de(bT(beste), 2) + ')' : '') + ', MDE80 ' + de(beste.mde80) + '. ' +
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
  var P1 = pruefen(kennung);
  if (!P1.gueltig) { log('ABBRUCH: Kandidat ungueltig: ' + P1.form.join('; ')); return { urteil: null, abbruch: P1.form }; }
  log('Form gueltig, test.js gruen (' + P1.test.letzteZeile + ')');
  var siegel1 = P1.siegel1; log('Siegel 1: Kandidatenordner in Commit ' + siegel1.commit + ', nichts Ungesichertes');
  var L = ladeKandidat(kennung), kand = L.kand;
  log('Entdeckung bis ' + (kand.form === 'minute' ? 'vor ' + K.MINUTE.sperreAb : K.ENTDECKUNG_BIS) + ' ueber ' + kand.konfigurationen.length + ' Konfigurationen (Form ' + kand.form + ', Adapter ' + kand.form + ', Quelle ' + (kand.daten || (kand.form === 'tag' ? 'panel' : kand.form === 'korb' ? 'panel' : '60m-archiv')) + ')');
  var E = messenImKind(kennung, 'entdeckung', path.join(aus, 'ergebnis-entdeckung.json'), log);
  if (E.konfigurationen.length !== kand.konfigurationen.length) throw new Error('Adapter lieferte ' + E.konfigurationen.length + ' statt ' + kand.konfigurationen.length + ' Konfigurationen');
  log('Entdeckung fertig: ' + JSON.stringify(E.zaehler || {}).slice(0, 400) + (E.verstoesse != null ? ' | Verstoesse ' + E.verstoesse : ''));
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
  var U = urteile(E, P, registerEintragen(JSON.parse(JSON.stringify(Rg)), kennung, kand.form, E.konfigurationen, E.stand));
  log('URTEIL: ' + U.urteil + ' - ' + U.grund);
  Rg = registerEintragen(Rg, kennung, kand.form, E.konfigurationen, E.stand); schreibeJson(K.REGISTER, Rg);
  log('Register: ' + Rg.gesamt + ' Konfigurationen insgesamt, ' + Rg.zufallErwartet.toFixed(2) + ' Zufallstreffer erwartet');
  var ergebnis = { kennung: kennung, form: kand.form, titel: kand.titel, stand: E.stand, urteil: U.urteil, grund: U.grund, kandidaten: U.kandidaten, messgeraetFehler: U.fehler,
    siegel1: siegel1, siegel2: siegel2, register: { gesamt: Rg.gesamt, zufallErwartet: Rg.zufallErwartet }, entdeckung: E, pruefung: P };
  schreibeJson(path.join(aus, 'ergebnis.json'), ergebnis);
  fs.writeFileSync(path.join(aus, 'ERGEBNIS.md'), ergebnisMarkdown(kand, E, U, Rg, siegel1, siegel2, false));
  var absatz = belegstandAbsatz(kand, E, U, Rg, siegel1, siegel2);
  fs.writeFileSync(path.join(aus, 'belegstand-eintrag.md'), absatz + '\n');
  /* Belegstand: nur anhaengen unter der festen Ueberschrift, der Kopf bleibt unberuehrt */
  var bs = path.join(K.REPO, 'wiki', 'belegstand.md'), text = fs.readFileSync(bs, 'utf8'), ueber = '## Prüfstraße (automatisch gemessen)';
  if (text.indexOf(ueber) === -1) text = text.replace(/\s*$/, '\n\n' + ueber + '\n\nJeder Absatz hier stammt vom Läufer (`pruefstrasse/laeufer.js`), nicht von einer Sitzung; Zahlen und Urteil stehen in `pruefstrasse/erledigt/<kennung>/`. Ein `belegt-Vorschlag` ist ein Vorschlag an den PM (zweiter unabhängiger Lauf bleibt Menschensache), kein Beleg.\n');
  text = text.replace(/\s*$/, '\n' + absatz + '\n');
  fs.writeFileSync(bs, text);
  var lg = path.join(K.REPO, 'wiki', 'log.md'), hhmm = new Date().toISOString().slice(11, 16);
  fs.appendFileSync(lg, '- ' + datumDe(E.stand) + ' (Prüfstraße, ' + hhmm + ' UTC) — **' + kennung + ': ' + U.urteil + '** (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten; Register ' + Rg.gesamt + '). Ordner `pruefstrasse/erledigt/' + kennung + '/`.\n');
  var pfade = [relAus + '/ERGEBNIS.md', relAus + '/ergebnis.json', relAus + '/belegstand-eintrag.md', relAus + '/LAUF.log', 'pruefstrasse/register.json', 'wiki/belegstand.md', 'wiki/log.md'];
  if (P) pfade.push(relAus + '/ergebnis-pruefung.json');
  if (U.urteil === 'belegt-Vorschlag') {
    fs.appendFileSync(K.VORSCHLAEGE, (fs.existsSync(K.VORSCHLAEGE) ? '' : '# Vorschlaege der Pruefstrasse an den PM (zweiter unabhaengiger Lauf ist Menschensache)\n\n') + absatz + '\n');
    pfade.push('pruefstrasse/VORSCHLAEGE.md');
    log('belegt-Vorschlag in pruefstrasse/VORSCHLAEGE.md eingetragen');
  }
  log('ENDE ' + U.urteil + ' - Belegstand und Log angehaengt, Commit folgt');
  var h3 = commit(pfade, 'Pruefstrasse: ' + kennung + ' - ' + U.urteil + ' (' + E.konfigurationen.length + ' Konfigurationen, ' + U.kandidaten + ' Kandidaten)');
  console.log(jetzt() + '  Commit ' + h3);
  return { urteil: U.urteil, grund: U.grund, commit: h3, siegel1: siegel1.commit, siegel2: siegel2.commit };
}

module.exports = { ladeKandidat: ladeKandidat, pruefen: pruefen, naechster: naechster, laufe: laufe, messen: messen, urteile: urteile, holm: holm, register: register,
  registerEintragen: registerEintragen, ergebnisMarkdown: ergebnisMarkdown, belegstandAbsatz: belegstandAbsatz, URTEILE: URTEILE, PFLICHT: PFLICHT };

if (require.main === module) {
  var a = process.argv.slice(2), arg = function (n) { var i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; }, trocken = a.indexOf('--trocken') !== -1;
  try {
    if (a.indexOf('--pruefen') !== -1) { var B = pruefen(arg('--pruefen')); console.log(JSON.stringify(B, null, 1)); process.exit(B.gueltig ? 0 : 1); }
    else if (a.indexOf('--messen') !== -1) { messen(arg('--messen'), arg('--phase'), arg('--aus')); console.log('fertig ' + arg('--phase')); }
    else if (a.indexOf('--kandidat') !== -1) { var r = laufe(arg('--kandidat'), { trocken: trocken }); console.log(JSON.stringify(r)); process.exit(r.abbruch ? 1 : 0); }
    else if (a.indexOf('--naechster') !== -1) { var n = naechster(); if (!n) { console.log('Warteschlange: kein gueltiger Kandidat'); process.exit(0); } var r2 = laufe(n, { trocken: trocken }); console.log(JSON.stringify(r2)); process.exit(r2.abbruch ? 1 : 0); }
    else { console.log('--pruefen <kennung> | --kandidat <kennung> [--trocken] | --naechster [--trocken]'); process.exit(2); }
  } catch (e) { console.error(e.stack || e.message); process.exit(1); }
}
