'use strict';
/* ZAEHLLAUF 4, Schritt 5 - Auswertung (Auftrag Nr. 92, Abschnitt 2). Nur zaehlen - KEINE Tafel.
 *
 * KOPIE von ../zaehllauf3/t4-auswerten.js: die Hilfsregeln (vergleiche, tvIn, zahl, jeFeld, sortiert, istKipp) sind
 * woertlich uebernommen, main() ist fuer den vierten Lauf neu: Zwillinge (V9), Matrix Lauf 3 -> Lauf 4 und alte Tafel ->
 * Lauf 4, Kipp-Faelle je Ursache (V9 E1 E2 E3 E4 E5 E6, je eine aus), Totalverlust Haupt / streng mit Klasse 1-3, die
 * Leseliste des PM (z4-leseliste.md) und die Nachzaehlung der Zahlen des PM (Auftrag und wiki/datenquellen.md).
 *
 * Aufruf:  node t4-auswerten.js
 * Liest:   z4-gruende-neu.json, z4-verschwundene.json, z4-panel.json, z4-edgar-zuordnung.json, ../zaehllauf3/z3-gruende-neu.json,
 *          ../phase2/t4-panelklasse.json, Massnahmen-Archiv auf E: (nur lesen, nur fuer die Leseliste)
 * Schreibt: z4-zahlen.json, z4-zwillinge.json, z4-matrix.json, z4-kippfaelle.json, z4-totalverlust.json, z4-nachzaehlung.json,
 *           z4-leseliste.md (und z4-leseliste-rest.json, wenn es mehr als 60 Zeilen sind)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');

var NEUER_GRUND = 'abgemeldet-anlass-offen';
var GRUENDE = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', NEUER_GRUND, 'ausgesetzt', 'unbekannt'];
var HAUPT = ['insolvenz', 'zwangs-delisting'], STRENG = HAUPT.concat(['unbekannt', 'freiwillig', NEUER_GRUND, 'ausgesetzt']);   // V4
var URSACHEN = ['V9', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
var LESELISTE_GRUENDE = ['insolvenz', 'zwangs-delisting', 'freiwillig', NEUER_GRUND, 'ausgesetzt', 'unbekannt'];
var LESELISTE_MAX = 60;

/** Reine Regel (wie im zweiten Lauf): "kippt" = Grund vorher weder "unbekannt" noch gleich dem neuen; freiwillig ->
 *  abgemeldet-anlass-offen ist eine Umbenennung, kein Kipp-Fall. */
function vergleiche(alt, neu) {
  if (!alt) return 'neu';
  if (alt.grund === neu.grund) return (alt.datum === neu.datum && alt.quelle === neu.quelle) ? 'gleich' : 'gleicher-grund-anderer-beleg';
  if (alt.grund === 'unbekannt') return 'unbekannt-bekommt-grund';
  if (alt.grund === 'freiwillig' && neu.grund === NEUER_GRUND) return 'umbenannt-R-c';
  return neu.grund === 'unbekannt' ? 'kippt-verliert-grund' : 'kippt';
}
function tvIn(grund, liste) { return !!(grund && liste.indexOf(grund) !== -1); }
function zahl(l, f) { return l.filter(f).length; }
function jeFeld(l, f) { return l.reduce(function (a, z) { var k = String(f(z)); a[k] = (a[k] || 0) + 1; return a; }, {}); }
function sortiert(o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a] || (a < b ? -1 : 1); }).map(function (k) { return [k, o[k]]; }); }
function istKipp(v) { return v === 'kippt' || v === 'kippt-verliert-grund'; }

/** Reine Regel: Matrix Grund vorher (Zeile) -> Grund jetzt (Spalte). */
function matrix(l, vorher) {
  var m = {};
  l.forEach(function (u) { var v = vorher(u) || '(keine Zeile)'; m[v] = m[v] || {}; m[v][u.grund] = (m[v][u.grund] || 0) + 1; });
  return m;
}
/** Reine Regel: Ursachen eines Kipp-Falls - die Aenderungen, ohne die die Zeile ihren Grund des dritten Laufs behielte
 *  (oder wenigstens einen anderen Grund haette). Keine einzelne -> 'zusammen'. */
function ursachen(u) {
  var l = URSACHEN.filter(function (k) { return u.ohne && u.ohne[k]; });
  return l.length ? l : ['zusammen'];
}
function kurzAuszug(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function zelle(s) { return String(s == null ? '' : s).replace(/\|/g, '/').replace(/\r?\n/g, ' '); }

function main() {
  var N = G.json(path.join(__dirname, 'z4-gruende-neu.json')), V = G.json(path.join(__dirname, 'z4-verschwundene.json'));
  var PN = G.json(path.join(__dirname, 'z4-panel.json')), PK = G.json(path.join(Z3.P2, 't4-panelklasse.json'));
  var Zu = G.json(path.join(__dirname, 'z4-edgar-zuordnung.json')).zuordnung;
  var L3 = G.json(path.join(Z3.Z3ORDNER, 'z3-gruende-neu.json')), l3je = {};
  L3.reihen.forEach(function (x) { l3je[x.reihe] = x; });
  var Rje = {}; V.reihen.forEach(function (R) { Rje[R.reihe] = R; });
  var l = N.reihen;
  function k123(u) { var p = PK.je[u.reihe]; return !!(p && p.k123 > 0); }
  l.forEach(function (u) { u._k = k123(u); });
  var Z = { kennung: Z3.KENNUNG, stand: new Date().toISOString(), n: l.length, offen: N.offen, zaehler: N.zaehler, jeRegel: N.jeRegel, belegarten: N.belegarten, andererGrundOhneAenderung: N.andererGrundOhneAenderung,
    gegenprobeLauf3: { gleich: N.gegenprobeLauf3.gleich, anders: N.gegenprobeLauf3.anders }, durchgang2Ausloeser: { geprueft: N.durchgang2Ausloeser.geprueft, anders: N.durchgang2Ausloeser.anders },
    panel: PN.zaehler, universum: V.zaehler4, edgar: N.edgar };

  /* ---- 1 Zwillinge ---- */
  var zw = l.filter(function (u) { return u.beleg === 'zwilling-im-archiv'; });
  var paare = zw.map(function (u) { var w = u.zwilling_info; return { reihe: u.reihe, zwilling: u.zwilling, ende: w.ende, anker: u.letzter_balken, gleicheTage: w.bGleich + '/' + w.bTage, nachlaufTage: w.cTage, doppelteZeilen: w.doppelte, zeilen: w.zeilen,
    letzterKursRoh: u.letzter_kurs_roh, klasse123: u._k ? 1 : 0, grundLauf3: u.lauf3 ? u.lauf3.grund : null, grundAlteTafel: u.alt ? u.alt.grund : null }; });
  var nurA = l.filter(function (u) { return (u.zwilling_kandidaten || []).length; });
  var scheiternB = [], scheiternC = [], gleichesEnde = [];
  nurA.forEach(function (u) {
    if (u.beleg === 'zwilling-im-archiv' && u.zwilling_info) return;
    var weiter = u.zwilling_kandidaten.filter(function (k) { return k.cTage >= 1; });
    if (!weiter.length) { gleichesEnde.push(u.reihe + ' = ' + u.zwilling_kandidaten.map(function (k) { return k.name; }).join(',')); return; }
    weiter.forEach(function (k) {
      if (k.ok) return;
      var t = u.reihe + ' -> ' + k.name + ' (' + k.b + ', noetig ' + k.bNoetig + ', Nachlauf ' + k.cTage + ' Tage)';
      if (!(Number(k.b.split('/')[0]) >= k.bNoetig)) scheiternB.push(t);
      if (k.cTage < 5) scheiternC.push(t);
    });
  });
  var zwInV9aus = zw.filter(function (u) { return u.ohne && u.ohne.V9; });
  var schwach = paare.filter(function (p) { return Number(p.gleicheTage.split('/')[1]) === 60; }).map(function (p) { return Number(p.gleicheTage.split('/')[0]); }).sort(function (a, b) { return a - b; });
  Z.zwillinge = { anzahl: zw.length, mitKlasse123: zahl(zw, function (u) { return u._k; }), doppelteZeilen: zw.reduce(function (s, u) { return s + u.zwilling_info.doppelte; }, 0),
    zeilenDerReihen: zw.reduce(function (s, u) { return s + u.zwilling_info.zeilen; }, 0),
    nurBedingungA: { reihenMitKandidat: nurA.length, davonNachlaufMind1: PN.zaehler.mitAWeiter, nurGleichesEnde: gleichesEnde.length, gleichesEndeListe: gleichesEnde,
      doppelteZeilenNurA: nurA.reduce(function (s, u) { var w = u.zwilling_kandidaten.filter(function (k) { return k.cTage >= 1; }).sort(function (a, b) { return b.doppelte - a.doppelte; })[0]; return s + (w ? w.doppelte : 0); }, 0),
      mitKlasse123: zahl(nurA, function (u) { return u._k && u.zwilling_kandidaten.some(function (k) { return k.cTage >= 1; }); }) },
    scheiternAnB: scheiternB, scheiternAnC: scheiternC, schwaechsteGleicheTageBei60: schwach.slice(0, 8),
    jeGrundLauf3: jeFeld(zw, function (u) { return u.lauf3 ? u.lauf3.grund : '-'; }), jeGrundLauf3Klasse123: jeFeld(zw.filter(function (u) { return u._k; }), function (u) { return u.lauf3 ? u.lauf3.grund : '-'; }),
    jeGrundAlteTafel: jeFeld(zw, function (u) { return u.alt ? u.alt.grund : '-'; }),
    andererGrundAlsUmbenennungLauf3: zahl(zw, function (u) { return u.lauf3 && u.lauf3.grund !== 'umbenennung-ticker'; }),
    totalverlustHauptLauf3: zw.filter(function (u) { return u.lauf3 && tvIn(u.lauf3.grund, HAUPT); }).map(function (u) { return u.reihe + (u._k ? '*' : ''); }),
    totalverlustHauptAlteTafel: zw.filter(function (u) { return u.alt && tvIn(u.alt.grund, HAUPT); }).map(function (u) { return u.reihe + (u._k ? '*' : ''); }),
    nurStrengAlteTafel: zahl(zw, function (u) { return u.alt && tvIn(u.alt.grund, STRENG) && !tvIn(u.alt.grund, HAUPT); }),
    ohnePanelZeile: PN.zaehler.ohnePanelReihe + PN.zaehler.ohneZeilen, zuKurzFuerA: PN.zaehler.zuKurzFuerA, verhNurMitToleranz: PN.zaehler.verhNurMitToleranz,
    zwillingNichtLebend: zw.filter(function (u) { var k = ((PN.je[u.reihe] || {}).kandidaten || []).filter(function (x) { return x.name === u.zwilling; })[0]; return k && !k.cLebend; }).map(function (u) { return u.reihe + '->' + u.zwilling; }),
    ohneV9andererGrund: zwInV9aus.length };
  Z3.schreibe('z4-zwillinge.json', { stand: Z.stand, regel: PN.regel, hinweis: '* = Klasse 1-3', zahlen: Z.zwillinge, paare: paare });

  /* ---- 2 Matrix und Kipp-Faelle ---- */
  var mL3 = matrix(l, function (u) { return u.lauf3 && u.lauf3.grund; }), mAlt = matrix(l, function (u) { return u.alt && u.alt.grund; });
  var kipp = [], jeUrsache = {}, jeUrsacheK = {};
  l.forEach(function (u) {
    if (!u.lauf3 || u.lauf3.grund === u.grund) return;
    var urs = ursachen(u);
    urs.forEach(function (k) { jeUrsache[k] = (jeUrsache[k] || 0) + 1; if (u._k) jeUrsacheK[k] = (jeUrsacheK[k] || 0) + 1; });
    kipp.push({ reihe: u.reihe, von: u.lauf3.grund + ' / ' + u.lauf3.beleg, nach: u.grund + ' / ' + u.beleg, ursache: urs.join('+'), art: vergleiche(u.lauf3, u), klasse123: u._k ? 1 : 0 });
  });
  Z.matrix = { andersAlsLauf3: kipp.length, jeUrsache: jeUrsache, jeUrsacheKlasse123: jeUrsacheK, jeArt: jeFeld(kipp, function (x) { return x.art; }),
    jeUebergang: sortiert(jeFeld(kipp, function (x) { return x.von.split(' / ')[0] + ' -> ' + x.nach.split(' / ')[0]; })).slice(0, 25),
    gegenAlteTafel: jeFeld(l, function (u) { return vergleiche(u.alt, u); }) };
  Z3.schreibe('z4-matrix.json', { stand: Z.stand, hinweis: 'Grund vorher (Zeile) -> Grund im vierten Lauf (Spalte). Keine Tafel.', lauf3: mL3, alteTafel: mAlt });
  Z3.schreibe('z4-kippfaelle.json', { stand: Z.stand, regel: 'jede Zeile mit anderem Grund als im dritten Lauf; Ursache = die Aenderung(en), ohne die der Grund ein anderer waere (je eine aus)', faelle: kipp });

  /* ---- 3 Totalverlust ---- */
  function tv(liste) {
    var drin = l.filter(function (u) { return tvIn(u.grund, liste); });
    function gegen(f) {
      var rein = l.filter(function (u) { return tvIn(u.grund, liste) && !tvIn(f(u), liste); }), raus = l.filter(function (u) { return !tvIn(u.grund, liste) && tvIn(f(u), liste); });
      return { rein: rein.length, reinKlasse123: rein.filter(function (u) { return u._k; }).map(function (u) { return u.reihe; }), raus: raus.length, rausKlasse123: raus.filter(function (u) { return u._k; }).map(function (u) { return u.reihe; }),
        rausJeNeuemGrund: jeFeld(raus, function (u) { return u.grund; }) };
    }
    return { bestand: drin.length, klasse123: drin.filter(function (u) { return u._k; }).map(function (u) { return u.reihe + ' (' + u.grund + ')'; }), jeGrund: jeFeld(drin, function (u) { return u.grund; }),
      gegenLauf3: gegen(function (u) { return u.lauf3 && u.lauf3.grund; }), gegenAlteTafel: gegen(function (u) { return u.alt && u.alt.grund; }),
      lauf3Bestand: zahl(l, function (u) { return u.lauf3 && tvIn(u.lauf3.grund, liste); }), alteTafelBestand: zahl(l, function (u) { return u.alt && tvIn(u.alt.grund, liste); }) };
  }
  Z.totalverlust = { haupt: tv(HAUPT), streng: tv(STRENG), listen: { haupt: HAUPT, streng: STRENG } };
  Z3.schreibe('z4-totalverlust.json', { stand: Z.stand, zahlen: Z.totalverlust,
    hauptReihen: l.filter(function (u) { return tvIn(u.grund, HAUPT); }).map(function (u) { return u.reihe; }), strengReihen: l.filter(function (u) { return tvIn(u.grund, STRENG); }).map(function (u) { return u.reihe; }) });

  /* ---- 4 Leseliste ---- */
  var ED = require('./t4-edgar.js');
  function massnahmenUm(R) {
    var o = R.ordner.replace(/~2$/, ''), s = [];
    [G.MASSN, Z3.MASSN_NACHTRAG].forEach(function (d) { var j = Z3.lies(path.join(d, o + '.json')); ((j && j.saetze) || []).forEach(function (x) { s.push(x); }); });
    var je = {}, aus = [];
    s.forEach(function (x) {
      var tag = x.ex_date || x.process_date || x.effective_date || x.payable_date || x.record_date;
      if (!tag || Math.abs(G.tageZwischen(R.letzterBalken, tag)) > 30) return;
      var k = (x.id || '') + '|' + x._art + '|' + tag; if (je[k]) return; je[k] = 1;
      var was = x.new_symbol || x.acquirer_symbol || (x.rate != null ? 'Betrag ' + x.rate : '') || (x.cash != null ? 'bar ' + x.cash : '') || (x.new_rate != null ? x.new_rate + ':' + x.old_rate : '');
      aus.push(x._art + ' ' + tag + (was ? ' ' + was : ''));
    });
    return aus.sort();
  }
  function einreichungenUm(u) {
    var z = Zu[u.reihe]; if (!z || !z.cik) return { vor: [], nach: [] };
    var R = Rje[u.reihe], von = G.tagPlus(R.letzterBalken, -4000), bis = G.tagPlus(R.letzterBalken, 4000);
    var S = ED.lokal(z.cik, von, bis).S || ED.lokal(z.cik, G.tagPlus(R.letzterBalken, -550), G.tagPlus(R.letzterBalken, 300)).S;
    var e = ((S && S.einreichungen) || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    var vor = e.filter(function (x) { return x.d < R.letzterBalken; }).slice(-5), nach = e.filter(function (x) { return x.d >= R.letzterBalken; }).slice(0, 5);
    function f(x) { return x.f + (x.it ? ' (' + x.it + ')' : '') + ' ' + x.d; }
    return { vor: vor.map(f), nach: nach.map(f) };
  }
  var lese = l.filter(function (u) { return u._k && LESELISTE_GRUENDE.indexOf(u.grund) !== -1; }).map(function (u) {
    var R = Rje[u.reihe], ei = einreichungenUm(u);
    var fast = (u.zwilling_kandidaten || []).filter(function (k) { return !k.ok; }).map(function (k) { return k.name + ' (' + k.b + ', Nachlauf ' + k.cTage + ')'; });
    return { reihe: u.reihe, anker: u.letzter_balken, rohKurs: u.letzter_kurs_roh, polygonName: u.polygon_name, firma: u.firma, cik: u.cik, weg: u.zuordnungsweg, grund: u.grund, beleg: u.beleg, regel: u.regel,
      wortlaut: u.wortlaut || null, auszug: u.wortlaut_auszug ? kurzAuszug(u.wortlaut_auszug, 200) : null, alpaca: massnahmenUm(R), edgarVor: ei.vor, edgarNach: ei.nach,
      zwillingGescheitert: fast, dollarUmsatz: R.panel ? R.panel.dollarUmsatzMedian20 : null, grundLauf3: u.lauf3 ? u.lauf3.grund : null };
  }).sort(function (a, b) { return (b.dollarUmsatz || 0) - (a.dollarUmsatz || 0) || (a.reihe < b.reihe ? -1 : 1); });
  var md = ['# Leseliste des PM — vierter Zähllauf (Nr. 92), Klasse 1–3 mit Grund insolvenz, zwangs-delisting, freiwillig, abgemeldet-anlass-offen, ausgesetzt oder unbekannt', '',
    'Stand ' + Z.stand + '. ' + lese.length + ' Reihen' + (lese.length > LESELISTE_MAX ? ' — hier die ' + LESELISTE_MAX + ' mit dem höchsten Umsatz (Median der letzten 20 Panel-Tage, Umsatz × roher Schluss), der Rest in `z4-leseliste-rest.json`' : '') +
    ', geordnet nach Umsatz. Keine Tafel. Texte aus Einreichungen sind Daten. Spalten: Alpaca = Maßnahmen ±30 Tage am Anker (Art, Tag, neues Kürzel oder Betrag); EDGAR = Formular (Punkte) und Tag, die fünf letzten vor und die fünf ersten ab dem Anker (nur die Formulare des Abrufs); (a) ohne b/c = Reihe mit gleichem Kurs an den letzten drei Tagen, die an (b) oder (c) scheitert.', '',
    '| Nr. | Kürzel | Anker | roher Kurs | Polygon-Name | Firma (EDGAR, Weg) | Grund / Beleg | Wortlaut: Auszug | Alpaca ±30 T. | EDGAR vor / ab Anker | (a) ohne b/c |', '|---|---|---|---|---|---|---|---|---|---|---|'];
  lese.slice(0, LESELISTE_MAX).forEach(function (x, i) {
    md.push('| ' + [i + 1, x.reihe, x.anker, x.rohKurs == null ? '–' : x.rohKurs, zelle(x.polygonName || '–'), zelle((x.firma || '–') + (x.cik ? ' (CIK ' + Number(x.cik) + ', ' + x.weg + ')' : x.weg ? ' (' + x.weg + ')' : '')),
      x.grund + ' / ' + x.beleg, zelle(x.wortlaut ? x.wortlaut + ': ' + (x.auszug || '') : '–'), zelle(x.alpaca.join('; ') || '–'), zelle((x.edgarVor.join('; ') || '–') + ' ‖ ' + (x.edgarNach.join('; ') || '–')), zelle(x.zwillingGescheitert.join('; ') || 'nein')].join(' | ') + ' |');
  });
  fs.writeFileSync(path.join(__dirname, 'z4-leseliste.md'), md.join('\n') + '\n');
  if (lese.length > LESELISTE_MAX) Z3.schreibe('z4-leseliste-rest.json', { stand: Z.stand, reihen: lese.slice(LESELISTE_MAX) });
  Z.leseliste = { zeilen: Math.min(lese.length, LESELISTE_MAX), reihen: lese.length, jeGrund: jeFeld(lese, function (x) { return x.grund; }), namen: lese.map(function (x) { return x.reihe; }) };

  /* ---- 5 Nachzaehlung (Zahlen des PM) ---- */
  Z3.schreibe('z4-zahlen.json', Z);
  require('./nachzaehlen.js').main(N, L3, V, PN, Z);
  console.log(JSON.stringify({ zwillinge: [Z.zwillinge.anzahl, Z.zwillinge.mitKlasse123, Z.zwillinge.doppelteZeilen], nurA: Z.zwillinge.nurBedingungA.davonNachlaufMind1, matrix: Z.matrix.andersAlsLauf3, jeUrsache: Z.matrix.jeUrsache,
    haupt: [Z.totalverlust.haupt.bestand, Z.totalverlust.haupt.klasse123.length], streng: [Z.totalverlust.streng.bestand, Z.totalverlust.streng.klasse123.length], leseliste: Z.leseliste.reihen }));
}

module.exports = { vergleiche: vergleiche, tvIn: tvIn, matrix: matrix, ursachen: ursachen, kurzAuszug: kurzAuszug, HAUPT: HAUPT, STRENG: STRENG, URSACHEN: URSACHEN, LESELISTE_GRUENDE: LESELISTE_GRUENDE, GRUENDE: GRUENDE };
if (require.main === module) main();
