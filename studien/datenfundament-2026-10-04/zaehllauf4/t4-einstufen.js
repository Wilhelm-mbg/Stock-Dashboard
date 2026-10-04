'use strict';
/* T2, Schritt 3 - KOPIE von studien/verschwundene-gruende-2026-09-12/einstufen.js fuer den Trockenlauf (Auftrag Nr. 79).
 *
 * Das Original und seine Tafel bleiben unangetastet. Die Einstufungslogik (ms, tage, imFenster, leer, fenster, akz,
 * urteil) ist WOERTLICH uebernommen - test.js vergleicht den Quelltext dieser Funktionen mit dem Original. Geaendert
 * ist nur der Rahmen:
 *   - gelesen werden die Arbeitsdateien DIESES Ordners (t2-verschwundene.json mit dem letzten MINUTENTAG als Anker,
 *     t2-edgar-zuordnung.json), nicht die der Originalstudie;
 *   - Einreichungen je Firma: erst der Cache dieses Ordners (edgar/cik), dann der der Originalstudie (nur lesen);
 *   - die Zeilen-Zusammenstellung aus main() steht als Funktion stufeEin(), damit t2-edgar.js sie fuer den zweiten
 *     Durchgang benutzen kann;
 *   - geschrieben wird t2-gruende-neu.json in DIESEN Ordner, je Zeile mit dem alten Stand daneben.
 *
 * ERSTER TREFFER GEWINNT - die Kategorien und ihre Reihenfolge sind die des Originals (siehe dort).
 */
// RAHMEN: KOPIE von ../t2-einstufen.js fuer den ZWEITEN Trockenlauf der Gruende-Tafel (Auftrag Nr. 86, Teil 4, Nachtrag 5.1).
// RAHMEN: Das Original aus Nr. 79 bleibt unveraendert. Jede Zeile, die hier anders ist, traegt eine Marke am Zeilenende:
// RAHMEN:   R-a  Firma = Polygon-CIK (hoechstens 45 Tage vom Anker), Volltextsuche nur ohne sie (die Zuordnung selbst steht in t4-edgar.js)
// RAHMEN:   R-b  Vollzug: ein 8-K 2.01 zaehlt nur hoechstens 30 Tage vor oder nach dem Anker
// RAHMEN:   R-c  Formular 25/25-NSE ohne 8-K 3.01 -> 'abgemeldet-anlass-offen' statt 'freiwillig', und nur von der Firma aus R-a
// RAHMEN:   RAHMEN  Pfade, Dateinamen, Zusatzfelder ohne Einfluss auf den Grund
// RAHMEN: test.js haelt die geaenderten Zeilen fest (jede ohne Marke ist ein Fehler). Es entsteht KEINE Tafel.
// RAHMEN3: KOPIE von ../phase2/t4-einstufen.js fuer den DRITTEN Zaehllauf der Gruende-Tafel (Auftrag Nr. 90). Das Original aus Nr. 86 bleibt unveraendert.
// RAHMEN3: Jede Zeile, die hier anders ist als dort, traegt am Zeilenende eine Marke: V1 V2 V3 V3b V5i V5iii V7 V8 (die Regel des Auftrags) oder RAHMEN3.
// RAHMEN3: Rangfolge mit Zeilennummern: REGEL-ZAEHLLAUF3.md. test.js haelt die geaenderten Zeilen fest. Der Lauf selbst steht in lauf.js. Es entsteht KEINE Tafel.
// RAHMEN4: KOPIE von ../zaehllauf3/t4-einstufen.js fuer den VIERTEN Zaehllauf (Auftrag Nr. 92). Der dritte Lauf bleibt unveraendert.
// RAHMEN4: Jede Zeile, die hier anders ist als dort, traegt am Zeilenende eine Marke: V9 E1 E2 E3 E4 E5 E7 (die Aenderung des Auftrags) oder RAHMEN4.
// RAHMEN4: E6 (Namensprobe der Suchfirma) steht in t4-edgar.js. Rangfolge mit Zeilennummern: REGEL-ZAEHLLAUF4.md. Es entsteht KEINE Tafel.
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');   // RAHMEN
var Z3 = require('./z3.js');   // RAHMEN3
var W = require('./wortlaut.js');   // V2

var SUB_EIGEN = path.join(__dirname, 'edgar', 'cik');
var SUB_ALT = path.join(G.GRUENDE, 'edgar', 'cik');
var SUB_NR79 = path.join(G.HIER, 'edgar', 'cik');   // RAHMEN
var VOLLZUG_TAGE = 30;   // R-b
var TAG = 86400000;
var VOR = 550, NACH = 300;                       // Fenster um den letzten Balken, in Tagen
var ENDSIGNAL = /^(25|25-NSE|25\/A|15|15-12B|15-12G|15-15D)$/;
var FUSIONSBELEG = /^(DEFM14A|PREM14A|SC 14D9|SC 13E3|S-4)$/;
var V3_VOR = 180, V3_NACH = 30;   // V3
var NAH_TAGE = 30, TAGE_501 = 5;   // V2
var MANTEL_KURS = 8;   // V5i
var AUSGESETZT_TAGE = 90;   // V5iii
var ALLE_AN = { V1: 1, V2: 1, V3: 1, V3b: 1, V5i: 1, V5iii: 1, V7: 1, V8: 1, V9: 1, E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1, E7: 1 };   // RAHMEN4
var E3_FRUEH_AB = 31, E5_TAGE = 30;   // E3 E5
var REGEL_JE_BELEG = { 'zwilling-im-archiv': 'Z', 'edgar-8K-3.01-unklar': 11,   // RAHMEN4
  'q-kuerzel': 0, 'q-kuerzel+edgar-8K-1.03': 0, 'alpaca-name_changes': 1, 'alpaca-cash_mergers': 2, 'alpaca-stock_and_cash_mergers': 2, 'alpaca-stock_mergers': 3, 'edgar-8K-1.03': 4,   // RAHMEN4
  'edgar-8K-2.01+prospekt': 5, 'alpaca-redemptions': 6, 'edgar-mantel+abmeldung': 7, 'alpaca-worthless_removals': 8, 'edgar-mantel+8K-3.01': 9, 'ausgesetzt': 10, 'edgar-8K-3.01-vollzug': 11, 'edgar-8K-3.01-ruege': 11,   // RAHMEN3
  'edgar-8K-3.01-eigener-entschluss': 11, 'edgar-8K-3.01+prospekt': 11, 'edgar-8K-3.01+5.01': 11, 'edgar-8K-3.01': 11, 'edgar-8K-3.01-ruege-frueh+25-NSE': 12, 'edgar-formular25': 13, 'edgar-formular15': 14,   // RAHMEN3
  'edgar-ohne-signal': 15, 'massnahme-passt-nicht': 15, 'nichts': 15, 'bigdata': 15 };   // RAHMEN3

function ms(iso) { return Date.parse(iso + 'T00:00:00Z'); }
function tage(a, b) { return Math.round((ms(a) - ms(b)) / TAG); }
/* Eine Kapitalmassnahme, die den Handel beendet, liegt NIE lange nach dem letzten
 * Balken - Median 1 bis 2 Tage (Probe ueber alle 4.996 Reihen). Nach hinten daher
 * hart 30 Tage, wie es die Pruefliste des Auftrags verlangt; nach vorn grosszuegig,
 * weil ein Kuerzel schon Wochen vor dem Vollzug ausgesetzt sein kann. */
function imFenster(ex, letzterBalken, vor) { var d = tage(ex, letzterBalken); return d >= -vor && d <= 30; }

function leer() { return { endsignal: null, i301: null, i103: null, i201: null, fusionsbeleg: null, f25: null, f15: null }; }

/* Die Einreichungen im Fenster, je Sorte die dem letzten Balken naechste. */
function fenster(S, letzterBalken) {
  var a = leer();
  if (!S || !S.einreichungen) return a;
  function naeher(alt, e) { return !alt || Math.abs(tage(e.d, letzterBalken)) < Math.abs(tage(alt.d, letzterBalken)) ? { d: e.d, a: e.a, f: e.f } : alt; }
  S.einreichungen.forEach(function (e) {
    var dt = tage(e.d, letzterBalken);
    if (dt < -VOR || dt > NACH) return;
    if (ENDSIGNAL.test(e.f)) { a.endsignal = naeher(a.endsignal, e); if (/^25/.test(e.f)) a.f25 = naeher(a.f25, e); else a.f15 = naeher(a.f15, e); }
    if (FUSIONSBELEG.test(e.f)) a.fusionsbeleg = naeher(a.fusionsbeleg, e);
    if (/^8-K/.test(e.f)) {
      var it = ',' + (e.it || '') + ',';
      if (it.indexOf(',3.01,') >= 0) a.i301 = naeher(a.i301, e);
      if (it.indexOf(',1.03,') >= 0) a.i103 = naeher(a.i103, e);
      if (it.indexOf(',2.01,') >= 0) a.i201 = naeher(a.i201, e);
    }
  });
  return a;
}

function akz(x) { return x ? 'EDGAR:' + x.a + ' (' + x.f + ' ' + x.d + ')' : null; }

/* Zusatzfenster des dritten Laufs - fenster() selbst bleibt wortgleich mit dem Original. */   // RAHMEN3
function fensterV(S, letzterBalken) {   // V3
  var a = { i301v3: null, i301frueh: [], i301frueh4: [], fusionNah: null, f25nse: null };   // E3
  if (!S || !S.einreichungen) return a;   // V3
  function naeher(alt, e) { return !alt || Math.abs(tage(e.d, letzterBalken)) < Math.abs(tage(alt.d, letzterBalken)) ? { d: e.d, a: e.a, f: e.f } : alt; }   // V3
  S.einreichungen.forEach(function (e) {   // V3
    var dt = tage(e.d, letzterBalken), ist301 = /^8-K/.test(e.f) && (',' + (e.it || '') + ',').indexOf(',3.01,') >= 0;   // V3
    if (ist301 && dt >= -V3_VOR && dt <= V3_NACH) a.i301v3 = naeher(a.i301v3, e);   // V3
    if (ist301 && dt >= -VOR && dt < -V3_VOR) a.i301frueh.push({ d: e.d, a: e.a, f: e.f });   // V3b
    if (ist301 && dt >= -VOR && dt <= -E3_FRUEH_AB) a.i301frueh4.push({ d: e.d, a: e.a, f: e.f });   // E3
    if (FUSIONSBELEG.test(e.f) && dt >= -V3_VOR && dt <= V3_NACH) a.fusionNah = naeher(a.fusionNah, e);   // V2
    if (e.f === '25-NSE' && Math.abs(dt) <= NAH_TAGE) a.f25nse = naeher(a.f25nse, e);   // V3b
  });   // V3
  a.i301frueh.sort(function (x, y) { return x.d < y.d ? 1 : x.d > y.d ? -1 : 0; });   // V3b
  a.i301frueh4.sort(function (x, y) { return x.d < y.d ? 1 : x.d > y.d ? -1 : 0; });   // E3
  return a;   // V3
}   // V3
/* E1: Insolvenz-Kuerzel - fuenf Zeichen mit Q am Ende oder genau das alte Kuerzel plus Q (ohne E1: wie im dritten Lauf). */   // E1
function qKuerzel(neu, basis, O) {   // E1
  var s = String(neu);   // E1
  if (!O.E1) return /^[A-Z]{2,4}Q$/.test(s);   // E1
  return /^[A-Z]{4}Q$/.test(s) || s.replace(/\./g, '-') === basis + 'Q';   // E1
}   // E1
/* E3/E2: die dem Anker naechste fruehe Ruege einer Liste (vom naechsten zum fernsten; Wortlaut ruege) - { d, w } oder null. */   // E3
function fruehRuege(liste, O) {   // E3
  for (var k = 0; k < liste.length; k++) { var w = wortlautVon(liste[k], O); if (w.klasse === 'ruege') return { d: liste[k], w: w }; }   // E3
  return null;   // E3
}   // E3
/* Punkt 5.01 im selben 8-K wie das 3.01 oder in einem 8-K hoechstens fuenf Kalendertage davor oder danach. */   // V2
function hat501(S, d301) {   // V2
  var best = null;   // V2
  ((S && S.einreichungen) || []).forEach(function (e) {   // V2
    if (!/^8-K/.test(e.f) || (',' + (e.it || '') + ',').indexOf(',5.01,') < 0) return;   // V2
    if (e.a === d301.a) best = { d: e.d, a: e.a, f: e.f };   // V2
    else if (!best && Math.abs(tage(e.d, d301.d)) <= TAGE_501) best = { d: e.d, a: e.a, f: e.f };   // V2
  });   // V2
  return best;   // V2
}   // V2
/* V8: die dem Anker naechste Ende-Massnahme dieser Art(en), in der die Reihe die ABGEBENDE Seite ist und die im Fenster der Regel liegt. */   // V8
function endeFuer(R, O, arten, vor, passt) {   // V8
  if (!O.V8) return R.massnahmeEnde;   // V8
  var best = null;   // V8
  (R.endeMassnahmen || []).forEach(function (m) {   // V8
    if (m.rolle !== 'abgebend' || arten.indexOf(m.art) === -1 || !imFenster(m.ex, R.letzterBalken, vor) || (passt && !passt(m))) return;   // V8
    if (!best || Math.abs(tage(m.ex, R.letzterBalken)) < Math.abs(tage(best.ex, R.letzterBalken))) best = m;   // V8
  });   // V8
  return best;   // V8
}   // V8
function qVon(E) { return 'alpaca-massnahmen:' + (E && E.id ? E.id : '-'); }   // V8
/* V2: Klasse des Wortlauts einer Meldung. O.text(akzession) liefert { text } aus dem Cache, { fehlt } oder null (noch nicht geholt -> O.bedarf). */   // V2
function wortlautVon(d, O) {   // V2
  var t = O.text ? O.text(d.a) : null;   // V2
  if (!t) {   // V2
    var e = ((O._S && O._S.einreichungen) || []).filter(function (x) { return x.a === d.a; })[0];   // V2
    if (O.bedarf) O.bedarf[d.a] = (e && e.c) || (O._S && O._S.cik) || null;   // V2
    return { klasse: 'nichts', auszug: '', stand: 'text-fehlt' };   // V2
  }   // V2
  if (t.fehlt || !t.text) return { klasse: 'nichts', auszug: '', stand: 'nicht-zu-holen' };   // V2
  if (!t._k) { t._k = W.klasse(t.text); t._k.stand = t._k.abschnitt ? 'abschnitt' : 'abschnitt-nicht-gefunden'; }   // V2
  return t._k;   // V2
}   // V2
function mitWortlaut(u, w, S, R) {   // V2
  u.wortlaut = w ? w.klasse : null; u.wortlaut_auszug = w ? w.auszug : null; u.wortlaut_stand = w ? w.stand : null; u.wortlaut_treffer = (w && w.treffer) || null;   // V2
  u.emittent_formular25 = akz(emittent25(S, R.letzterBalken));   // V2
  return u;   // V2
}   // V2
/* V5 iii: kein Polygon-Eintrag hoechstens 45 Tage am Anker, aber ein Polygon-Abgangsdatum oder eine Ende-Massnahme (V8: abgebende Seite) mehr als 90 Tage danach.   // V5iii
 * Ausnahme: der spaetere Polygon-Eintrag traegt eine andere CIK als die bestimmte Firma UND sein Name passt nicht zu ihr -> Kuerzel neu vergeben, nicht ausgesetzt. */   // V5iii
function ausgesetzt(R, S, bestaetigt, O) {   // V5iii
  if (R.polygonFirma) return null;   // V5iii
  var danach = null, mass = null;   // V5iii
  (R.polygonEintraege || []).forEach(function (p) { if (p.bis && tage(p.bis, R.letzterBalken) > AUSGESETZT_TAGE && (!danach || p.bis < danach.bis)) danach = p; });   // V5iii
  (O.V8 ? (R.endeMassnahmen || []).filter(function (m) { return m.rolle === 'abgebend'; }) : (R.massnahmeEnde ? [R.massnahmeEnde] : [])).forEach(function (m) {   // V5iii V8
    if (m.ex && tage(m.ex, R.letzterBalken) > AUSGESETZT_TAGE && (!mass || m.ex < mass.ex)) mass = m;   // V5iii
  });   // V5iii
  if (!danach && !mass) return null;   // V5iii
  var neuVergeben = !!(danach && bestaetigt && S && S.cik && danach.cik !== S.cik && (S.ciks || []).indexOf(danach.cik) === -1   // V5iii
    && !Z3.nameAehnlich(danach.name, S.name) && !(S.frueher || []).some(function (n) { return Z3.nameAehnlich(danach.name, n); }));   // V5iii
  return { ja: !neuVergeben, kuerzel_neu_vergeben: neuVergeben ? 1 : 0, polygonAbgang: danach ? danach.bis : null, polygonName: danach ? danach.name : null, polygonCik: danach ? danach.cik : null,   // V5iii
    tageNachAnker: danach ? tage(danach.bis, R.letzterBalken) : null, massnahmeDanach: mass ? mass.art + ' ' + mass.ex + (mass.neuesKuerzel ? ' -> ' + mass.neuesKuerzel : '') : null,   // V5iii
    quelle: danach ? 'polygon:' + danach.bis : qVon(mass) };   // V5iii
}   // V5iii
/* V1: zwei Auszuege zusammen lesen - Vereinigung der Einreichungen (je Akzession einmal), Name und SIC vom ersten. */   // V1
function vereinige(S1, S2) {   // V1
  if (!S1 || S1.fehlt) return (S2 && !S2.fehlt) ? S2 : S1;   // V1
  if (!S2 || S2.fehlt) return S1;   // V1
  var je = {}, e = [];   // V1
  [S1, S2].forEach(function (S) { (S.einreichungen || []).forEach(function (x) { if (je[x.a]) return; je[x.a] = 1; e.push({ f: x.f, d: x.d, a: x.a, it: x.it, c: S.cik }); }); });   // V1
  return { cik: S1.cik, ciks: [S1.cik, S2.cik], name: S1.name, sic: S1.sic, tickers: S1.tickers, frueher: (S1.frueher || []).concat([S2.name]).concat(S2.frueher || []), einreichungen: e, vereinigt: 1 };   // V1
}   // V1

function urteil(R, E, f, S, bestaetigt, hatBalken, lebendAb, firmaAusRa, v, O) {   // RAHMEN3
  var q = 'alpaca-massnahmen:' + (E && E.id ? E.id : '-');
  /* Z (V9) Zwilling im Archiv: eine andere Reihe traegt dieselben Kurse weiter (Bedingungen a, b, c - z4-panel.js, zwilling.js). Vor allem anderen. */   // V9
  if (O.V9 && R.zwilling && R.zwilling.ok) {   // V9
    return { grund: 'umbenennung-ticker', datum: R.zwilling.ende, quelle: 'panel-v22:' + R.zwilling.name, beleg: 'zwilling-im-archiv', preis_je_aktie: null,   // V9
      nachfolger: R.zwilling.name, nachfolger_im_archiv: 1, zwilling: R.zwilling.name, doppelt: true };   // V9
  }   // V9
  /* 1 Umbenennung: das Massnahmen-Archiv nennt das neue Kuerzel; es muss im Archiv
   *   Balken haben, die NACH dem letzten Balken dieser Reihe liegen. Sonst ist die
   *   "Umbenennung" nur eine Buchung ohne Nachfolger und zaehlt nicht. */
  /* 0 Das Q am Ende. Die Boerse haengt einem Kuerzel ein Q an, wenn die Gesellschaft
   *   im Insolvenzverfahren steht (ACOR->ACORQ, AMRS->AMRSQ, APPH->APPHQ, WE->WEWKQ).
   *   Im Massnahmen-Archiv steht das als "name_changes" - also als Umbenennung. Ohne
   *   diese Regel wuerden 153 Insolvenzen als harmloser Kuerzelwechsel gezaehlt, und
   *   zwar genau die, die den Ertrag einer Delisting-Regel nach unten ziehen. */
  E = endeFuer(R, O, ['name_changes'], 60, function (m) { return m.neuesKuerzel && qKuerzel(m.neuesKuerzel, R.basis, O) && String(m.neuesKuerzel) !== R.basis; }); q = qVon(E);   // V8 E1
  if (E && E.art === 'name_changes' && E.neuesKuerzel && qKuerzel(E.neuesKuerzel, R.basis, O)   // E1
      && String(E.neuesKuerzel) !== R.basis && imFenster(E.ex, R.letzterBalken, 60)) {
    var i103imFenster = f.i103 && imFenster(f.i103.d, R.letzterBalken, 550);
    return { grund: 'insolvenz', datum: i103imFenster ? f.i103.d : E.ex, quelle: i103imFenster ? akz(f.i103) : q,
      beleg: i103imFenster ? 'q-kuerzel+edgar-8K-1.03' : 'q-kuerzel', preis_je_aktie: null, nachfolger: E.neuesKuerzel };
  }
  E = endeFuer(R, O, ['name_changes'], 60, function (m) { return m.neuesKuerzel && String(m.neuesKuerzel).replace(/\./g, '-') !== R.basis; }); q = qVon(E);   // V8
  if (E && E.art === 'name_changes' && imFenster(E.ex, R.letzterBalken, 60)) {
    var neu = E.neuesKuerzel ? String(E.neuesKuerzel).replace(/\./g, '-') : null;
    /* 991 von 1.520 Nachfolgern haben im Archiv KEINE Balken - fast durchweg Kuerzel
     * auf -F/-Y, also der Gang an den Freiverkehr (AAMC->AAMCF, ABB->ABBNY, AAU->AAUAF).
     * Das ist trotzdem eine Umbenennung und kein Todesfall: der Aktionaer behielt ein
     * handelbares Papier. Die Unterscheidung "im Archiv / nicht im Archiv" wird als
     * Feld mitgefuehrt, damit eine spaetere Studie sie trennen kann, ohne zu raten. */
    if (neu && neu !== R.basis) {
      return { grund: 'umbenennung-ticker', datum: E.ex, quelle: q, beleg: 'alpaca-name_changes', preis_je_aktie: null,
        nachfolger: E.neuesKuerzel, nachfolger_im_archiv: (hatBalken[neu] && hatBalken[neu] > ms(R.letzterBalken)) ? 1 : 0 };
    }
  }
  E = endeFuer(R, O, ['cash_mergers', 'stock_and_cash_mergers'], 90); q = qVon(E);   // V8
  if (E && (E.art === 'cash_mergers' || E.art === 'stock_and_cash_mergers') && imFenster(E.ex, R.letzterBalken, 90)) {
    return { grund: 'uebernahme', datum: E.ex, quelle: q, beleg: 'alpaca-' + E.art, preis_je_aktie: (E.art === 'cash_mergers' ? E.rate : null),
      edgar_beleg: akz(f.i201) || akz(f.fusionsbeleg) || akz(f.f25) };
  }
  E = endeFuer(R, O, ['stock_mergers'], 90); q = qVon(E);   // V8
  if (E && E.art === 'stock_mergers' && imFenster(E.ex, R.letzterBalken, 90)) {
    return { grund: 'fusion-aktientausch', datum: E.ex, quelle: q, beleg: 'alpaca-stock_mergers', preis_je_aktie: null, edgar_beleg: akz(f.i201) || akz(f.f25) };
  }
  if (f.i103) return { grund: 'insolvenz', datum: f.i103.d, quelle: akz(f.i103), beleg: 'edgar-8K-1.03', preis_je_aktie: null };
  /* Der Vollzug ist ein Ereignis, kein Formular: auch hier hoechstens 30 Tage nach dem
   * letzten Balken. Ein 2.01 drei Monate spaeter gehoert zu einem anderen Vorgang. */
  if (f.i201 && f.fusionsbeleg && imFenster(f.i201.d, R.letzterBalken, VOLLZUG_TAGE)) {   // R-b
    return { grund: 'uebernahme', datum: f.i201.d, quelle: akz(f.i201), beleg: 'edgar-8K-2.01+prospekt', preis_je_aktie: null, zusatz: akz(f.fusionsbeleg) };
  }
  E = endeFuer(R, O, ['redemptions'], 90); q = qVon(E);   // V8
  if (E && E.art === 'redemptions' && imFenster(E.ex, R.letzterBalken, 90)) {
    var mantel = S && /acquisition (corp|co\b|company|holdings)/i.test(S.name || '');
    return { grund: mantel ? 'spac-ende' : 'freiwillig', datum: E.ex, quelle: q, beleg: 'alpaca-redemptions', preis_je_aktie: null };
  }
  if (S && /acquisition (corp|co\b|company|holdings)/i.test(S.name || '') && (f.f15 || f.f25) && !f.i201) {
    return { grund: 'spac-ende', datum: (f.f25 || f.f15).d, quelle: akz(f.f25 || f.f15), beleg: 'edgar-mantel+abmeldung', preis_je_aktie: null };
  }
  E = endeFuer(R, O, ['worthless_removals'], 180); q = qVon(E);   // V8
  if (E && E.art === 'worthless_removals' && imFenster(E.ex, R.letzterBalken, 180)) {
    return { grund: f.i301 ? 'zwangs-delisting' : 'insolvenz', datum: E.ex, quelle: q, beleg: 'alpaca-worthless_removals', preis_je_aktie: null };
  }
  var d301 = O.V3 ? v.i301v3 : f.i301;   // V3
  /* 9 (V5 i) Mantelgesellschaft am Treuhandwert: SIC 6770 laut EDGAR, letzter Kurs mindestens 8,00 $, ein 8-K 3.01 nach V3. */   // V5i
  /*   E2: Mantel = SIC 6770 ODER Mantel-Name (EDGAR, frueherer Name, Polygon-Name am Anker); dazu ein 8-K 3.01 nach V3 (jeder Wortlaut) ODER eine fruehe Ruege + 25-NSE am Anker. E7: roher Kurs. */   // E2
  var kurs9 = O.E7 ? R.letzterKursRoh : R.letzterKursArchiv, pn9 = O.E2 ? Z3.polygonAmAnker(R) : null, mn9 = O.E2 ? Z3.mantelName(S, pn9 && pn9.name) : null;   // E2 E7
  var frueh = O.E3 ? v.i301frueh4 : v.i301frueh;   // E3
  if (O.V5i && bestaetigt && S && (S.sic === '6770' || !!mn9) && kurs9 != null && kurs9 >= MANTEL_KURS) {   // E2 E7
    var merkmal9 = S.sic === '6770' ? 'sic-6770' : 'name-' + mn9;   // E2
    if (d301) return mitWortlaut({ grund: 'spac-ende', datum: d301.d, quelle: akz(d301), beleg: 'edgar-mantel+8K-3.01', preis_je_aktie: null, mantel_merkmal: merkmal9, mantel_weg: '8K-3.01-v3' }, wortlautVon(d301, O), S, R);   // E2
    var fr9 = (O.E2 && O.V3b && v.f25nse) ? fruehRuege(frueh, O) : null;   // E2
    if (fr9) return mitWortlaut({ grund: 'spac-ende', datum: v.f25nse.d, quelle: akz(fr9.d), beleg: 'edgar-mantel+8K-3.01', preis_je_aktie: null, zusatz: akz(v.f25nse), mantel_merkmal: merkmal9, mantel_weg: 'ruege-frueh+25-NSE' }, fr9.w, S, R);   // E2
  }   // E2
  /* 10 (V5 iii) ausgesetzter Wert. */   // V5iii
  var aus = O.V5iii ? ausgesetzt(R, S, bestaetigt, O) : null;   // V5iii
  if (aus && aus.ja) return mitWortlaut({ grund: 'ausgesetzt', datum: null, quelle: aus.quelle, beleg: 'ausgesetzt', preis_je_aktie: null, ausgesetzt: aus }, d301 ? wortlautVon(d301, O) : null, S, R);   // V5iii
  /* 11 (V2) 8-K 3.01 im Fenster nach V3: der Wortlaut des Abschnitts entscheidet (fuenf Zeilen der Tabelle des Auftrags). */   // V2
  if (d301) {   // V2
    var w = O.V2 ? wortlautVon(d301, O) : null, nah = Math.abs(tage(d301.d, R.letzterBalken)) <= NAH_TAGE, p501 = hat501(S, d301), u11;   // V2
    if (!O.V2) u11 = { grund: 'zwangs-delisting', beleg: 'edgar-8K-3.01' };   // V2
    else if (w.klasse === 'vollzug' && nah) u11 = { grund: 'uebernahme', beleg: 'edgar-8K-3.01-vollzug', v2_zeile: 1 };   // V2
    else if (w.klasse === 'ruege' && (nah || !O.E3)) u11 = { grund: 'zwangs-delisting', beleg: 'edgar-8K-3.01-ruege', v2_zeile: 2 };   // E3
    else if (w.klasse === 'ruege') u11 = null;   // E3: Ruege 31 bis 180 Tage vor dem Anker - Regel 11 greift nicht, weiter zu Regel 12
    else if (w.klasse === 'eigener-entschluss') u11 = { grund: 'freiwillig', beleg: 'edgar-8K-3.01-eigener-entschluss', v2_zeile: 3 };   // V2
    else if (nah && (v.fusionNah || p501)) u11 = { grund: 'uebernahme', beleg: v.fusionNah ? 'edgar-8K-3.01+prospekt' : 'edgar-8K-3.01+5.01', v2_zeile: 4, zusatz: akz(v.fusionNah || p501) };   // V2
    else u11 = O.E4 ? { grund: 'abgemeldet-anlass-offen', beleg: 'edgar-8K-3.01-unklar', v2_zeile: 5, wortlaut_unklar: 1 } : { grund: 'zwangs-delisting', beleg: 'edgar-8K-3.01', v2_zeile: 5, wortlaut_unklar: 1 };   // E4
    if (u11) {   // E3
      u11.datum = d301.d; u11.quelle = akz(d301); u11.preis_je_aktie = null;   // E3
      return O.V2 ? mitWortlaut(u11, w, S, R) : u11;   // E3
    }   // E3
  }   // V2
  /* 12 (V3b) fruehe Ruege (8-K 3.01 zwischen 550 und 181 Tagen vor dem Anker, Wortlaut ruege) + Formular 25-NSE der Boerse hoechstens 30 Tage am Anker. */   // V3b
  /*   E3: jede Ruege 31 bis 550 Tage vor dem Anker (die naechste); ohne E3 wie im dritten Lauf 181 bis 550. */   // E3
  if (O.V3b && v.f25nse) {   // V3b
    for (var k = 0; k < frueh.length; k++) {   // E3
      var wf = wortlautVon(frueh[k], O);   // E3
      if (wf.klasse === 'ruege') return mitWortlaut({ grund: 'zwangs-delisting', datum: v.f25nse.d, quelle: akz(frueh[k]), beleg: 'edgar-8K-3.01-ruege-frueh+25-NSE', preis_je_aktie: null, zusatz: akz(v.f25nse) }, wf, S, R);   // E3
    }   // V3b
  }   // V3b
  /*   E5: Formular 25 ohne Abmelde-Meldung nur hoechstens 30 Tage vor oder nach dem Anker. */   // E5
  if (f.f25 && (firmaAusRa || O.V7) && (!O.E5 || Math.abs(tage(f.f25.d, R.letzterBalken)) <= E5_TAGE)) return { grund: 'abgemeldet-anlass-offen', datum: f.f25.d, quelle: akz(f.f25), beleg: 'edgar-formular25', preis_je_aktie: null };   // V7 E5
  if (f.f15) return { grund: 'freiwillig', datum: f.f15.d, quelle: akz(f.f15), beleg: 'edgar-formular15', preis_je_aktie: null, formular25_ohne_aussenanker: akz(f.f25) };   // R-c
  E = R.massnahmeEnde;   // V8
  return { grund: 'unbekannt', datum: null, quelle: null, beleg: bestaetigt ? 'edgar-ohne-signal' : (E ? 'massnahme-passt-nicht' : 'nichts'), preis_je_aktie: null, formular25_ohne_aussenanker: akz(f.f25) };   // R-c
}

/** Eine Zeile der Tafel - der Rumpf der Schleife aus main() des Originals, unveraendert in der Logik.
 *  R: Reihe aus t2-verschwundene.json, z: Zuordnung Kuerzel->CIK, S: Einreichungen dieser CIK (oder null). */
function stufeEin(R, z, S, hatBalken, lebendAb, bdFunde, O) {   // RAHMEN3
  z = z || {};
  if (S && S.fehlt) S = null;
  O = Object.assign({ _S: S }, O || ALLE_AN);   // RAHMEN3
  var f = fenster(S, R.letzterBalken);
  var bestaetigt = !!(S && (z.sicherheit === 'stark' || f.endsignal || f.i301 || f.i103 || f.i201));
  if (!bestaetigt) { f = leer(); }
  var v = fensterV(bestaetigt ? S : null, R.letzterBalken);   // V3
  var E = R.massnahmeEnde;
  var u = urteil(R, E, f, S, bestaetigt, hatBalken, lebendAb, z.weg === 'polygon-cik', v, O);   // RAHMEN3
  if (u.grund === 'unbekannt' && bdFunde && bdFunde[R.reihe]) {
    var b = bdFunde[R.reihe];
    u = { grund: b.grund, datum: b.datum, quelle: b.quelle, beleg: 'bigdata', preis_je_aktie: (b.preis_je_aktie == null ? null : b.preis_je_aktie),
      nachfolger: b.nachfolger || null, belegtext: b.text || null };
  }
  u.reihe = R.reihe; u.ordner = R.ordner; u.art = R.art; u.gruppe = R.gruppe;
  u.letzter_balken = R.letzterBalken;
  u.letzter_kurs_archiv = R.letzterKursArchiv;
  u.cik = bestaetigt ? z.cik : null;
  u.firma = bestaetigt && S ? S.name : null;
  u.zuordnungsweg = z.weg || null;
  u.sic = bestaetigt && S ? (S.sic || null) : null;   // RAHMEN
  u.signale = { i301: akz(f.i301), i103: akz(f.i103), i201: akz(f.i201), fusionsbeleg: akz(f.fusionsbeleg), f25: akz(f.f25), f15: akz(f.f15), f25_emittent: bestaetigt ? akz(emittent25(S, R.letzterBalken)) : null,   // RAHMEN3
    i301v3: akz(v.i301v3), i301v3_tage: v.i301v3 ? tage(v.i301v3.d, R.letzterBalken) : null, fusion_nah: akz(v.fusionNah), f25nse: akz(v.f25nse), i301frueh: v.i301frueh.length, i501: v.i301v3 ? akz(hat501(S, v.i301v3)) : null };   // RAHMEN3
  u.regel = REGEL_JE_BELEG[u.beleg] === undefined ? null : REGEL_JE_BELEG[u.beleg];   // RAHMEN3
  u.namensprobe = z.namensprobe || null; u.zweit = z.zweit || null;   // V1
  var ap = (O.V5iii && u.regel >= 11) ? ausgesetzt(R, S, bestaetigt, O) : null;   // V5iii
  if (ap && !ap.ja) u.kuerzel_neu_vergeben = ap;   // V5iii
  u.letzter_kurs_roh = R.letzterKursRoh == null ? null : R.letzterKursRoh; u.letzter_kurs_roh_quelle = R.letzterKursRohQuelle || null;   // E7
  u.signale.i301frueh4 = v.i301frueh4.length;   // RAHMEN4
  var kursA = (O.E7 && R.letzterKursRoh > 0) ? R.letzterKursRoh : R.letzterKursArchiv;   // E7
  u.aufschlag_pp = (u.preis_je_aktie != null && kursA > 0)   // E7
    ? Math.round(((u.preis_je_aktie - kursA) / kursA) * 1000000) / 10000 : null;   // E7
  return u;
}

// RAHMEN: Formular 25 des EMITTENTEN (Typ '25'; '25-NSE' reicht die Boerse ein) im Fenster, das dem Anker naechste - nur Auskunft fuer die Gruppenliste.
function emittent25(S, letzterBalken) {   // RAHMEN
  var best = null;   // RAHMEN
  ((S && S.einreichungen) || []).forEach(function (e) {   // RAHMEN
    var dt = tage(e.d, letzterBalken);   // RAHMEN
    if (e.f !== '25' || dt < -VOR || dt > NACH) return;   // RAHMEN
    if (!best || Math.abs(dt) < Math.abs(tage(best.d, letzterBalken))) best = { d: e.d, a: e.a, f: e.f };   // RAHMEN
  });   // RAHMEN
  return best;   // RAHMEN
}   // RAHMEN

/** Einreichungen einer CIK: eigener Cache vor dem der Originalstudie. */
var subCache = {};
function sub(cik) {
  if (subCache[cik] !== undefined) return subCache[cik];
  var aus = null;
  [SUB_EIGEN, SUB_NR79, SUB_ALT].some(function (d) {   // RAHMEN
    var p = path.join(d, cik + '.json');
    if (!fs.existsSync(p)) return false;
    try { aus = JSON.parse(fs.readFileSync(p, 'utf8')); return true; } catch (e) { return false; }
  });
  return (subCache[cik] = aus);
}
function hatBalkenKarte() {
  /* Kuerzel, die heute noch Balken liefern - wie im Original aus den Tagesbalken der Lebenszeit-Tafel (nicht geaendert:
   * das Feld speist nur die Auskunft `nachfolger_im_archiv`, nicht den Grund). */
  var lz = G.lebenszeit().werte, hatBalken = {};
  Object.keys(lz).forEach(function (r) { if (lz[r] && lz[r].balken > 0) hatBalken[r.replace(/~2$/, '')] = lz[r].letzter; });
  return hatBalken;
}
function bigdataFunde() {
  try { return JSON.parse(fs.readFileSync(path.join(G.GRUENDE, 'bigdata-ergebnis.json'), 'utf8')).funde || {}; } catch (e) { return {}; }
}

function main() { require('./lauf.js').main(); }   // RAHMEN3

var REGELN = { V1: 'Firma = Polygon-CIK nur mit Namensprobe, sonst Volltextsuche; zweiter Registrant mit dem Polygon-Namen wird mitgelesen', V2: '8-K 3.01: der Wortlaut des Abschnitts entscheidet',   // RAHMEN3
  V3: '8-K 3.01 fuer die Regeln 9 und 11 nur ' + V3_VOR + ' Tage vor bis ' + V3_NACH + ' Tage nach dem Anker', V3b: 'fruehe Ruege + Formular 25-NSE am Anker', V5i: 'Mantel (SIC 6770, Kurs >= ' + MANTEL_KURS + ') mit 8-K 3.01 -> spac-ende',   // RAHMEN3
  V5iii: 'ausgesetzter Wert', V7: 'Formular 25 der nach V1 bestimmten Firma, gleich auf welchem Weg', V8: 'Ende-Massnahme am Anker (abgebende Seite) statt der juengsten der Datei', 'R-b': '8-K 2.01 nur hoechstens ' + VOLLZUG_TAGE + ' Tage am Anker (unveraendert)' };   // RAHMEN3
module.exports = { fenster: fenster, urteil: urteil, stufeEin: stufeEin, sub: sub, hatBalkenKarte: hatBalkenKarte, bigdataFunde: bigdataFunde, VOR: VOR, NACH: NACH, ms: ms, tage: tage, imFenster: imFenster, emittent25: emittent25, VOLLZUG_TAGE: VOLLZUG_TAGE, REGELN: REGELN,   // RAHMEN3
  fensterV: fensterV, hat501: hat501, endeFuer: endeFuer, ausgesetzt: ausgesetzt, vereinige: vereinige, wortlautVon: wortlautVon, ALLE_AN: ALLE_AN, REGEL_JE_BELEG: REGEL_JE_BELEG, V3_VOR: V3_VOR, V3_NACH: V3_NACH, NAH_TAGE: NAH_TAGE, TAGE_501: TAGE_501, MANTEL_KURS: MANTEL_KURS, AUSGESETZT_TAGE: AUSGESETZT_TAGE };   // RAHMEN3
Object.assign(REGELN, { V9: 'Zwilling im Archiv (Panel v2.2: a drei letzte Tage gleich, b 45 von 60 bzw. 75 %, c fuenf Handelstage Nachlauf) -> umbenennung-ticker, vor allem anderen', E1: 'Insolvenz-Kuerzel: fuenf Zeichen mit Q oder altes Kuerzel plus Q',   // RAHMEN4
  E2: 'Mantel = SIC 6770 oder Mantel-Name, roher Kurs >= ' + MANTEL_KURS + '; 8-K 3.01 nach V3 oder fruehe Ruege + 25-NSE -> spac-ende (Regel 9)', E3: 'Ruege in Regel 11 nur hoechstens 30 Tage am Anker; Regel 12: Ruege ' + E3_FRUEH_AB + ' bis ' + VOR + ' Tage davor',   // RAHMEN4
  E4: 'unklarer Wortlaut (Regel 11, Zeile 5) -> abgemeldet-anlass-offen', E5: 'Formular 25 ohne Abmelde-Meldung nur hoechstens ' + E5_TAGE + ' Tage am Anker', E6: 'Namensprobe auch fuer die Suchfirma (t4-edgar.js)', E7: 'Kursgrenzen am rohen letzten Kurs' });   // RAHMEN4
Object.assign(module.exports, { qKuerzel: qKuerzel, fruehRuege: fruehRuege, E3_FRUEH_AB: E3_FRUEH_AB, E5_TAGE: E5_TAGE });   // RAHMEN4
if (require.main === module) main();
