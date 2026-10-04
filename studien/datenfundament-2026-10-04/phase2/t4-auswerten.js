'use strict';
/* TEIL 4, Schritt 4 - Auswertung des ZWEITEN Trockenlaufs der Gruende-Tafel (Auftrag Nr. 86). Nur zaehlen - KEINE Tafel.
 *
 * KOPIE von ../t2-auswerten.js, erweitert: Matrix Grund alt -> Grund neu ueber ALLE Zeilen der alten Tafel, jeder Kipp-Fall
 * mit beiden Belegen und seiner Ursache, neue Reihen, die zwei Aussenpruefungen, alle Reihen mit geaenderter
 * Totalverlust-Eigenschaft (mit Klasse 1-3 in den letzten 250 Panel-Zeilen ja/nein), drei Gruppen als Liste.
 *
 * Aufruf:  node t4-auswerten.js
 * Liest:   t4-gruende-neu.json, t4-edgar-zuordnung.json, t4-panelklasse.json, die alte Tafel (nur lesen)
 * Schreibt: t4-zahlen.json, t4-matrix.json, t4-kippfaelle.json, t4-neue-reihen.json, t4-totalverlust.json, t4-gruppen.json,
 *           t4-polygon-namen.json, t4-anhang.md
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');

var NEUER_GRUND = 'abgemeldet-anlass-offen';
var GRUENDE = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', NEUER_GRUND, 'unbekannt'];
var EDGAR_BELEGE = ['edgar-8K-3.01', 'edgar-8K-2.01+prospekt', 'edgar-8K-1.03', 'q-kuerzel+edgar-8K-1.03', 'edgar-formular25', 'edgar-formular15', 'edgar-mantel+abmeldung'];

/** Reine Regel: Vergleich einer alten Zeile mit der neuen. "kippt" = alter Grund weder "unbekannt" noch gleich dem neuen.
 *  Die reine Umbenennung durch R-c (freiwillig -> abgemeldet-anlass-offen) ist eine eigene Sorte, kein Kipp-Fall. */
function vergleiche(alt, neu) {
  if (!alt) return 'neu';
  if (alt.grund === neu.grund) return (alt.datum === neu.datum && alt.quelle === neu.quelle) ? 'gleich' : 'gleicher-grund-anderer-beleg';
  if (alt.grund === 'unbekannt') return 'unbekannt-bekommt-grund';
  if (alt.grund === 'freiwillig' && neu.grund === NEUER_GRUND) return 'umbenannt-R-c';
  return neu.grund === 'unbekannt' ? 'kippt-verliert-grund' : 'kippt';
}
/** Reine Regel: woran haengt der Unterschied? Mehrere Ursachen moeglich; leer = "Datenstand" (EDGAR heute statt 12.09.,
 *  aeltere Einreichungsdateien, zweiter Durchgang). */
function ursachen(z) {
  var u = [], a = z.alt;
  if (!a) return u;
  if (z.anker_diff_tage != null && Math.abs(z.anker_diff_tage) > G.ANKER_SCHWELLE_TAGE) u.push('Anker');
  if ((a.cik || null) !== (z.cik || null) && z.zuordnungsweg === 'polygon-cik') u.push('R-a');
  if (a.beleg === 'edgar-8K-2.01+prospekt' && a.datum && Math.abs(G.tageZwischen(z.letzter_balken, a.datum)) > 30) u.push('R-b');
  if (a.beleg === 'edgar-formular25' && a.grund === 'freiwillig') u.push('R-c');
  return u;
}
function tvIn(grund, liste) { return !!(grund && liste.indexOf(grund) !== -1); }
/** Namen grob vergleichen: gleiches erstes tragendes Wort oder einer Anfang des anderen (nur Plausibilitaet, kein Urteil). */
function nameKern(s) {
  return String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\b(THE|INC|INCORPORATED|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|PLC|LLC|LP|NV|SA|AG|SE|HOLDINGS?|GROUP|COMMON|STOCK|SHARES?|ORDINARY|CLASS|A|B|C|NEW|DE|MD|NY|CA|TRUST|AMERICAN|DEPOSITARY|ADS|ADR|EACH|REPRESENTING|PAR|VALUE|OF|AND)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function nameAehnlich(a, b) {
  var x = nameKern(a), y = nameKern(b);
  if (!x || !y) return false;
  if (x === y || x.indexOf(y) === 0 || y.indexOf(x) === 0) return true;
  var p = x.split(' ')[0], q = y.split(' ')[0];
  if (p.length >= 4 && p === q) return true;
  return x.replace(/ /g, '').slice(0, 6) === y.replace(/ /g, '').slice(0, 6);
}

function main() {
  var N = G.json(path.join(P.HIER, 't4-gruende-neu.json')), E = G.json(path.join(P.HIER, 't4-edgar-zuordnung.json'));
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')), PK = G.json(path.join(P.HIER, 't4-panelklasse.json'));
  var HAUPT = PK.listen.haupt, STRENG = PK.listen.streng, STRENG_MIT = STRENG.concat([NEUER_GRUND]);
  var zeilen = N.reihen, altJe = {};
  T.reihen.forEach(function (r) { altJe[r.reihe] = r; });
  zeilen.forEach(function (z) {
    z.vergleich = vergleiche(z.alt, z); z.ursachen = ursachen(z);
    var pk = PK.je[z.reihe] || { k123: 0, k23: 0, zeilen: 0 };
    z.k123 = pk.k123; z.k23 = pk.k23; z.panelZeilen = pk.zeilen;
  });
  var alte = zeilen.filter(function (z) { return !z.neu; }), neue = zeilen.filter(function (z) { return z.neu; });
  function zahl(l, f) { return l.filter(f).length; }
  function jeFeld(l, f) { return l.reduce(function (a, z) { var k = String(f(z)); a[k] = (a[k] || 0) + 1; return a; }, {}); }

  /* ---- Matrix ueber alle Zeilen der alten Tafel ---- */
  var matrix = {};
  alte.forEach(function (z) { var a = z.alt.grund; matrix[a] = matrix[a] || {}; matrix[a][z.grund] = (matrix[a][z.grund] || 0) + 1; });
  var kippF = function (z) { return z.vergleich === 'kippt' || z.vergleich === 'kippt-verliert-grund'; };
  var kipp = alte.filter(kippF);

  var Z = { stand: new Date().toISOString(), kennung: P.KENNUNG_GRUENDE, regeln: N.regeln, alteTafel: { kennung: T.kennung, zeilen: T.n }, eingestuft: zeilen.length, offen: N.offen,
    alteZeilen: { zeilen: alte.length, inDerNeuenEinstufungFehlend: T.n - alte.length, vergleich: jeFeld(alte, function (z) { return z.vergleich; }),
      ankerWechseltUeber3Tage: zahl(alte, function (z) { return Math.abs(z.anker_diff_tage) > G.ANKER_SCHWELLE_TAGE; }),
      firmaAnders: zahl(alte, function (z) { return (z.alt.cik || null) !== (z.cik || null); }),
      firmaAnders_beideBelegt: zahl(alte, function (z) { return z.alt.cik && z.cik && z.alt.cik !== z.cik; }),
      firmaNeuBelegt: zahl(alte, function (z) { return !z.alt.cik && z.cik; }), firmaNichtMehrBelegt: zahl(alte, function (z) { return z.alt.cik && !z.cik; }) },
    kipp: { gesamt: kipp.length, verliertGrund: zahl(kipp, function (z) { return z.vergleich === 'kippt-verliert-grund'; }),
      mitKlasse123: zahl(kipp, function (z) { return z.k123 > 0; }),
      jeUrsache: jeFeld(kipp, function (z) { return z.ursachen.length ? z.ursachen.join('+') : 'Datenstand'; }),
      ohneAnkerwechsel: zahl(kipp, function (z) { return z.ursachen.indexOf('Anker') === -1; }),
      stroeme: jeFeld(kipp, function (z) { return z.alt.grund + ' -> ' + z.grund; }) },
    umbenanntRc: zahl(alte, function (z) { return z.vergleich === 'umbenannt-R-c'; }),
    unbekanntBekommtGrund: jeFeld(alte.filter(function (z) { return z.vergleich === 'unbekannt-bekommt-grund'; }), function (z) { return z.grund; }),
    neueReihen: { reihen: neue.length, jeGrund: jeFeld(neue, function (z) { return z.grund; }) },
    zuordnungswege: { neu: jeFeld(zeilen, function (z) { return z.zuordnungsweg; }), alt: jeFeld(T.reihen, function (z) { return z.zuordnungsweg; }) },
    belegarten: { neu: jeFeld(zeilen, function (z) { return z.beleg; }), alt: jeFeld(T.reihen, function (z) { return z.beleg; }) },
    edgar: E.summe, edgarFehler: (E.fehler || []).length };
  var ganzAlt = jeFeld(T.reihen, function (r) { return r.grund; }), ganzNeu = jeFeld(zeilen, function (z) { return z.grund; });
  Z.tafelImGanzen = { alt: ganzAlt, neu: ganzNeu, zeilenAlt: T.n, zeilenNeu: zeilen.length };

  /* ---- R-c: Formular 25 einer Firma OHNE Aussenanker (zaehlt nicht) - bei der anderen Lesart waere es der neue Grund ---- */
  var f25ohne = zeilen.filter(function (z) { return z.formular25_ohne_aussenanker; });
  Z.rC = { formular25VonPolygonFirma: zahl(zeilen, function (z) { return z.grund === NEUER_GRUND; }),
    formular25OhneAussenanker: { zeilen: f25ohne.length, davonJetzt: jeFeld(f25ohne, function (z) { return z.grund + ' (' + z.beleg + ')'; }), davonAltFreiwillig: zahl(f25ohne, function (z) { return z.alt && z.alt.grund === 'freiwillig'; }) },
    hinweis: 'Lesart des Auftrags: "nur von der Firma aus (R-a)" = nur von der Polygon-CIK. Zaehlte das Formular 25 auch von einer Firma aus der Volltextsuche, bekaemen diese Zeilen den neuen Grund.' };

  /* ---- Aussenpruefung 1: Firma gegen Polygon-CIK ---- */
  var poly = G.polygon().je;
  function polyCik(basis, anker) {
    var l = poly[basis] || poly[basis.replace(/-/g, '.')] || [], best = null;
    l.forEach(function (p) { if (!p.bis || !p.cik) return; var d = Math.abs(G.tageZwischen(anker, p.bis)); if (d <= 45 && (!best || d < best.d)) best = { cik: p.cik, d: d, name: p.name }; });
    return best;
  }
  function firmaPruefen(liste) {
    var a = { zeilen: liste.length, mitPolygonCik: 0, firmaBestaetigt: 0, stimmt: 0, widerspricht: 0, ohneFirma: 0 };
    liste.forEach(function (z) {
      var p = polyCik(z.reihe.replace(/~2$/, ''), z.letzter_balken); if (!p) return;
      a.mitPolygonCik++;
      if (!z.cik) { a.ohneFirma++; return; }
      a.firmaBestaetigt++;
      if (z.cik === p.cik) a.stimmt++; else a.widerspricht++;
    });
    return a;
  }
  /* unabhaengige Gegenprobe der Polygon-CIK selbst: passt der Name, den EDGAR zu dieser CIK fuehrt, zum Polygon-Namen? */
  var ED = require('./t4-edgar.js'), namen = { zeilen: 0, namePasst: 0, nurFruehererNamePasst: 0, nurKuerzelPasst: 0, nichtsPasst: 0, liste: [] };
  zeilen.forEach(function (z) {
    if (z.zuordnungsweg !== 'polygon-cik' || !z.cik || !z.polygon_firma) return;
    var S = ED.lokal(z.cik, G.tagPlus(z.letzter_balken, -550), G.tagPlus(z.letzter_balken, 300)).S; if (!S || S.fehlt) return;
    namen.zeilen++;
    var basis = z.reihe.replace(/~2$/, ''), tk = (S.tickers || []).map(function (t) { return String(t).toUpperCase().replace(/\./g, '-'); });
    if (nameAehnlich(S.name, z.polygon_firma.name)) namen.namePasst++;
    else if ((S.frueher || []).some(function (f) { return nameAehnlich(f, z.polygon_firma.name); })) namen.nurFruehererNamePasst++;
    else if (tk.indexOf(basis) !== -1) namen.nurKuerzelPasst++;
    else { namen.nichtsPasst++; namen.liste.push({ reihe: z.reihe, cik: z.cik, polygon: z.polygon_firma.name, edgar: S.name, frueher: (S.frueher || []).slice(0, 4), grund: z.grund, beleg: z.beleg, k123: z.k123 }); }
  });
  /* ---- Hinweise je Zeile: woran man einen falschen neuen Grund erkennen koennte (nur Auskunft, kein Urteil) ----
   *  polygon-name-passt-nicht     der Name, den EDGAR zur Polygon-CIK fuehrt, hat mit dem Polygon-Namen nichts gemein
   *  alte-firma-traegt-polygon-namen  die ALTE Firma (Volltextsuche) heisst wie der Polygon-Eintrag, hat aber eine andere CIK
   *  3.01-mit-fusionsbeleg / 3.01-mit-5.01   das 8-K 3.01 steht neben einem Fusionsprospekt bzw. traegt selbst Punkt 5.01
   *                               (Kontrollwechsel): die Abmeldung beim Vollzug einer Uebernahme, kein Zwangs-Delisting
   *  beleg-fern-vom-anker         der neue Beleg liegt mehr als 30 Tage vom Anker */
  var nichtsPasst = {}; namen.liste.forEach(function (x) { nichtsPasst[x.reihe] = 1; });
  zeilen.forEach(function (z) {
    var h = [];
    if (nichtsPasst[z.reihe]) h.push('polygon-name-passt-nicht');
    if (z.alt && z.alt.cik && z.cik && z.alt.cik !== z.cik && z.polygon_firma && nameAehnlich(z.alt.firma, z.polygon_firma.name)) h.push('alte-firma-traegt-polygon-namen');
    if (z.beleg === 'edgar-8K-3.01') {
      if (z.signale && z.signale.fusionsbeleg) h.push('3.01-mit-fusionsbeleg');
      var S3 = z.cik ? ED.lokal(z.cik, G.tagPlus(z.letzter_balken, -550), G.tagPlus(z.letzter_balken, 300)).S : null;
      var akz = /^EDGAR:(\S+)/.exec(z.quelle || ''), e3 = S3 && akz ? (S3.einreichungen || []).filter(function (e) { return e.a === akz[1]; })[0] : null;
      if (e3 && (',' + (e3.it || '') + ',').indexOf(',5.01,') >= 0) h.push('3.01-mit-5.01');
    }
    if (z.datum && Math.abs(G.tageZwischen(z.letzter_balken, z.datum)) > 30) h.push('beleg-fern-vom-anker');
    z.hinweise = h;
  });
  var zd = zeilen.filter(function (z) { return z.beleg === 'edgar-8K-3.01'; });
  Z.hinweise = { erklaerung: 'Auskunft je Zeile, kein Urteil - siehe PHASE2A.md Teil 4',
    polygonNamePasstNicht: zahl(zeilen, function (z) { return z.hinweise.indexOf('polygon-name-passt-nicht') !== -1; }),
    alteFirmaTraegtPolygonNamen: zahl(zeilen, function (z) { return z.hinweise.indexOf('alte-firma-traegt-polygon-namen') !== -1; }),
    zwangsDelistingPer301: { zeilen: zd.length, mitFusionsbeleg: zahl(zd, function (z) { return z.hinweise.indexOf('3.01-mit-fusionsbeleg') !== -1; }), mit501: zahl(zd, function (z) { return z.hinweise.indexOf('3.01-mit-5.01') !== -1; }),
      mitFusionsbelegOder501: zahl(zd, function (z) { return z.hinweise.indexOf('3.01-mit-fusionsbeleg') !== -1 || z.hinweise.indexOf('3.01-mit-5.01') !== -1; }),
      fernVomAnker: zahl(zd, function (z) { return z.hinweise.indexOf('beleg-fern-vom-anker') !== -1; }),
      ohneHinweis: zahl(zd, function (z) { return z.hinweise.length === 0; }) },
    alteTafel301MitFusionsbelegNichtPruefbar: 'die alte Tafel fuehrt die Signale nicht je Zeile' };

  /* ---- Aussenpruefung 2: Lage des Belegs zum Anker, je Belegart ---- */
  function belegAbstand(liste, beleg) {
    var l = liste.filter(function (z) { return z.beleg === beleg && z.datum; }), a = { zeilen: l.length, innerhalb30: 0, mehrAls30TageVorAnker: 0, mehrAls180TageVorAnker: 0, mehrAls30TageNach: 0 };
    l.forEach(function (z) { var d = G.tageZwischen(z.letzter_balken, z.datum); if (d < -180) a.mehrAls180TageVorAnker++; if (d < -30) a.mehrAls30TageVorAnker++; else if (d > 30) a.mehrAls30TageNach++; else a.innerhalb30++; });
    a.anteilInnerhalb30 = a.zeilen ? Math.round(1000 * a.innerhalb30 / a.zeilen) / 1000 : null;
    return a;
  }
  var lage = { neu: {}, alt: {} };
  EDGAR_BELEGE.forEach(function (b) { lage.neu[b] = belegAbstand(zeilen, b); lage.alt[b] = belegAbstand(T.reihen, b); });
  Z.pruefsteine = {
    firma: { alteTafelGanz: firmaPruefen(T.reihen), trockenlaufNeu: firmaPruefen(zeilen),
      hinweis: 'Nach R-a IST die Firma die Polygon-CIK, wo es eine gibt - die Pruefung besteht dort von selbst. Unabhaengig ist nur noch die Gegenprobe "polygonCikGegenEdgarName".' },
    polygonCikGegenEdgarName: { zeilen: namen.zeilen, namePasst: namen.namePasst, nurFruehererNamePasst: namen.nurFruehererNamePasst, nurKuerzelPasst: namen.nurKuerzelPasst, nichtsPasst: namen.nichtsPasst,
      hinweis: 'grober Namensvergleich (erstes tragendes Wort / Anfang); "nichtsPasst" ist eine Leseliste (t4-polygon-namen.json), kein Urteil' },
    belegLage: lage };

  /* ---- Totalverlust-Eigenschaft: alt gegen neu, mit Klasse 1-3 ja/nein ---- */
  function tvZeile(z, richtung) { return { reihe: z.reihe, anker: z.letzter_balken, richtung: richtung, neuInTafel: z.neu ? 1 : 0, klasse123: z.k123 > 0 ? 'ja' : 'nein', k123: z.k123, k23: z.k23,
    alt: z.alt ? { grund: z.alt.grund, beleg: z.alt.beleg, datum: z.alt.datum, quelle: z.alt.quelle, firma: z.alt.firma } : null,
    neu: { grund: z.grund, beleg: z.beleg, datum: z.datum, quelle: z.quelle, firma: z.firma }, ursachen: z.ursachen, hinweise: z.hinweise }; }
  function tvListe(liste) {
    var a = [];
    zeilen.forEach(function (z) { var v = tvIn(z.alt ? z.alt.grund : null, liste), n = tvIn(z.grund, liste); if (v !== n) a.push(tvZeile(z, n ? 'kommt-hinzu' : 'faellt-weg')); });
    return a;
  }
  function tvZahl(a) { function c(f) { return a.filter(f).length; } return { geaendert: a.length, kommtHinzu: c(function (x) { return x.richtung === 'kommt-hinzu'; }), faelltWeg: c(function (x) { return x.richtung === 'faellt-weg'; }),
    mitKlasse123: c(function (x) { return x.k123 > 0; }), kommtHinzuKlasse123: c(function (x) { return x.richtung === 'kommt-hinzu' && x.k123 > 0; }), faelltWegKlasse123: c(function (x) { return x.richtung === 'faellt-weg' && x.k123 > 0; }),
    mitKlasse23: c(function (x) { return x.k23 > 0; }), davonNeueReihen: c(function (x) { return x.neuInTafel; }), davonAlteZeilen: c(function (x) { return !x.neuInTafel; }),
    kommtHinzuMitHinweis: c(function (x) { return x.richtung === 'kommt-hinzu' && x.hinweise.length > 0; }), kommtHinzuOhneHinweis: c(function (x) { return x.richtung === 'kommt-hinzu' && x.hinweise.length === 0; }),
    kommtHinzuJeHinweis: a.filter(function (x) { return x.richtung === 'kommt-hinzu'; }).reduce(function (m, x) { x.hinweise.forEach(function (h) { m[h] = (m[h] || 0) + 1; }); return m; }, {}),
    faelltWegJeNeuemGrund: a.filter(function (x) { return x.richtung === 'faellt-weg'; }).reduce(function (m, x) { m[x.neu.grund] = (m[x.neu.grund] || 0) + 1; return m; }, {}),
    faelltWegMitHinweis: c(function (x) { return x.richtung === 'faellt-weg' && x.hinweise.length > 0; }) }; }
  var tvH = tvListe(HAUPT), tvS1 = tvListe(STRENG_MIT), tvS2 = tvListe(STRENG);
  Z.totalverlust = { listen: { haupt: HAUPT, streng: STRENG, strengMitNeuemGrund: STRENG_MIT }, haupt: tvZahl(tvH), strengNeuerGrundWieFreiwillig: tvZahl(tvS1), strengNeuerGrundKeinTotalverlust: tvZahl(tvS2),
    hinweis: 'haupt = Insolvenz, Zwangs-Delisting. Der neue Grund abgemeldet-anlass-offen steht in keiner Liste des Pruefstands; "streng" ist deshalb in zwei Lesarten gezaehlt (wie freiwillig / kein Totalverlust).' };
  tvH.sort(function (a, b) { return b.k123 - a.k123 || b.k23 - a.k23 || (a.reihe < b.reihe ? -1 : 1); });

  /* ---- drei Gruppen, nur als Liste ---- */
  function gz(z) { return { reihe: z.reihe, anker: z.letzter_balken, grund: z.grund, beleg: z.beleg, firma: z.firma, sic: z.sic, i301: z.signale.i301, f25_emittent: z.signale.f25_emittent, f15: z.signale.f15, k123: z.k123 }; }
  var mantel = zeilen.filter(function (z) { return z.sic === '6770' && z.signale && z.signale.i301; });
  var freiw = zeilen.filter(function (z) { return z.signale && z.signale.i301 && z.signale.f25_emittent; });
  var polyBis = G.polygon().je, massnJe = {};
  G.json(path.join(P.HIER, 't4-verschwundene.json')).reihen.forEach(function (R) { massnJe[R.reihe] = R.massnahmeEnde || null; });
  var ausgesetzt = zeilen.filter(function (z) {
    /* Handel endet, das Kuerzel bleibt gelistet: kein Abgang in der Naehe des Ankers, aber (A) ein Polygon-Abgangsdatum oder
     * (B) eine Ende-Massnahme der Quelle mehr als 90 Tage NACH dem letzten Minutentag */
    if (z.polygon_firma) return false;
    if (z.beleg && /^alpaca-|^q-kuerzel/.test(z.beleg)) return false;
    var basis = z.reihe.replace(/~2$/, ''), l = (polyBis[basis] || polyBis[basis.replace(/-/g, '.')] || []).map(function (p) { return p.bis; }).filter(Boolean).sort();
    var danach = l.filter(function (b) { return G.tageZwischen(z.letzter_balken, b) > 90; })[0] || null;
    var m = massnJe[z.reihe], mTage = m && m.ex ? G.tageZwischen(z.letzter_balken, m.ex) : null;
    if (!danach && !(mTage > 90)) return false;
    z.polygonDanach = danach; z.tageBisPolygon = danach ? G.tageZwischen(z.letzter_balken, danach) : null;
    z.massnahmeDanach = mTage > 90 ? m.art + ' ' + m.ex + (m.neuesKuerzel ? ' -> ' + m.neuesKuerzel : '') : null;
    return true;
  });
  var Gr = { stand: Z.stand, hinweis: 'Drei Gruppen NUR als Liste, ohne Entscheid (Auftrag Teil 4). Die Buchung entscheidet der PM.',
    mantelSic6770Mit8K301: { regel: 'SIC 6770 (Blank Check) laut EDGAR UND ein 8-K Punkt 3.01 im Fenster (550 Tage vor bis 300 nach dem Anker)', zahl: mantel.length, jeGrund: jeFeld(mantel, function (z) { return z.grund; }),
      mitKlasse123: zahl(mantel, function (z) { return z.k123 > 0; }), reihen: mantel.map(gz) },
    freiwilligMit8K301: { regel: '8-K Punkt 3.01 UND ein Formular 25 des EMITTENTEN (Formulartyp 25; 25-NSE reicht die Boerse ein) im selben Fenster - soweit aus den Formularen erkennbar', zahl: freiw.length,
      jeGrund: jeFeld(freiw, function (z) { return z.grund; }), mitFormular15: zahl(freiw, function (z) { return z.signale.f15; }), mitKlasse123: zahl(freiw, function (z) { return z.k123 > 0; }), reihen: freiw.map(gz) },
    ausgesetzt: { regel: 'kein Polygon-Eintrag hoechstens 45 Tage am Anker und keine Massnahme der Quelle als Beleg, aber ein Polygon-Abgangsdatum ODER eine Ende-Massnahme der Quelle mehr als 90 Tage NACH dem letzten Minutentag - der Handel endet, das Kuerzel bleibt gelistet (Muster YNDX)',
      zahl: ausgesetzt.length, jeGrund: jeFeld(ausgesetzt, function (z) { return z.grund; }), mitKlasse123: zahl(ausgesetzt, function (z) { return z.k123 > 0; }), yndxDabei: ausgesetzt.some(function (z) { return z.reihe === 'YNDX'; }),
      reihen: ausgesetzt.map(function (z) { var o = gz(z); o.polygonAbgang = z.polygonDanach; o.tageNachAnker = z.tageBisPolygon; o.massnahmeDanach = z.massnahmeDanach; return o; }) } };
  Z.gruppen = { mantelSic6770Mit8K301: { zahl: mantel.length, jeGrund: Gr.mantelSic6770Mit8K301.jeGrund, mitKlasse123: Gr.mantelSic6770Mit8K301.mitKlasse123 },
    freiwilligMit8K301: { zahl: freiw.length, jeGrund: Gr.freiwilligMit8K301.jeGrund, mitKlasse123: Gr.freiwilligMit8K301.mitKlasse123 },
    ausgesetzt: { zahl: ausgesetzt.length, jeGrund: Gr.ausgesetzt.jeGrund, mitKlasse123: Gr.ausgesetzt.mitKlasse123, yndxDabei: Gr.ausgesetzt.yndxDabei } };

  /* ---- Dateien ---- */
  function kurzAlt(z) { return { grund: z.alt.grund, datum: z.alt.datum, beleg: z.alt.beleg, quelle: z.alt.quelle, firma: z.alt.firma, cik: z.alt.cik, weg: z.alt.zuordnungsweg }; }
  function kurzNeu(z) { return { grund: z.grund, datum: z.datum, beleg: z.beleg, quelle: z.quelle, firma: z.firma, cik: z.cik, weg: z.zuordnungsweg }; }
  function fall(z) { return { reihe: z.reihe, ankerAlt: z.letzter_balken_alt, ankerNeu: z.letzter_balken, ankerDiffTage: z.anker_diff_tage, vergleich: z.vergleich, ursachen: z.ursachen, alt: kurzAlt(z), neu: kurzNeu(z),
    belegTageZumAnker: z.datum ? G.tageZwischen(z.letzter_balken, z.datum) : null, k123: z.k123, k23: z.k23, hinweise: z.hinweise }; }
  var kippFaelle = kipp.map(fall).sort(function (a, b) { return b.k123 - a.k123 || b.k23 - a.k23 || (a.reihe < b.reihe ? -1 : 1); });
  var bekommt = alte.filter(function (z) { return z.vergleich === 'unbekannt-bekommt-grund'; }).map(fall);
  P.schreibe('t4-zahlen.json', Z);
  P.schreibe('t4-matrix.json', { stand: Z.stand, hinweis: 'ALLE ' + alte.length + ' Zeilen der alten Tafel: Grund alt (Zeile) -> Grund neu (Spalte). Keine Tafel.', matrix: matrix });
  P.schreibe('t4-kippfaelle.json', { stand: Z.stand, regel: 'kippt = alter Grund weder unbekannt noch gleich dem neuen; freiwillig -> abgemeldet-anlass-offen (R-c) ist eine Umbenennung und steht unter umbenanntRc',
    sortierung: 'nach Zeilen in Klasse 1-3 unter den letzten 250 Panel-Zeilen (k123), dann k23, dann Name', kippt: kippFaelle, unbekanntBekommtGrund: bekommt,
    umbenanntRc: alte.filter(function (z) { return z.vergleich === 'umbenannt-R-c'; }).map(function (z) { return { reihe: z.reihe, anker: z.letzter_balken, altQuelle: z.alt.quelle, neuQuelle: z.quelle, firmaAlt: z.alt.firma, firmaNeu: z.firma, k123: z.k123 }; }) });
  P.schreibe('t4-neue-reihen.json', { stand: Z.stand, hinweis: 'Reihen, die der alten Tafel fehlen (nach Teil 1 nicht lebend).',
    reihen: neue.map(function (z) { return { reihe: z.reihe, anker: z.letzter_balken, neu: kurzNeu(z), letzterKurs: z.letzter_kurs_archiv, preisJeAktie: z.preis_je_aktie, nachfolger: z.nachfolger || null, k123: z.k123 }; }) });
  P.schreibe('t4-totalverlust.json', { stand: Z.stand, hinweis: Z.totalverlust.hinweis, listen: Z.totalverlust.listen, zahlen: { haupt: Z.totalverlust.haupt, strengNeuerGrundWieFreiwillig: Z.totalverlust.strengNeuerGrundWieFreiwillig, strengNeuerGrundKeinTotalverlust: Z.totalverlust.strengNeuerGrundKeinTotalverlust },
    haupt: tvH, strengNeuerGrundWieFreiwillig: tvS1.map(function (x) { return { reihe: x.reihe, richtung: x.richtung, klasse123: x.klasse123, alt: x.alt ? x.alt.grund : null, neu: x.neu.grund }; }),
    strengNeuerGrundKeinTotalverlust: tvS2.map(function (x) { return { reihe: x.reihe, richtung: x.richtung, klasse123: x.klasse123, alt: x.alt ? x.alt.grund : null, neu: x.neu.grund }; }) });
  P.schreibe('t4-gruppen.json', Gr);
  P.schreibe('t4-polygon-namen.json', { stand: Z.stand, hinweis: Z.pruefsteine.polygonCikGegenEdgarName.hinweis, zahlen: Z.pruefsteine.polygonCikGegenEdgarName, nichtsPasst: namen.liste });

  /* ---- Textteil ---- */
  var M = [];
  M.push('# Anhang zu PHASE2A.md, Teil 4 (erzeugt von t4-auswerten.js, Stand ' + Z.stand + ')', '');
  M.push('## Matrix Grund alt (Zeile) -> Grund neu (Spalte), alle ' + alte.length + ' Zeilen der alten Tafel', '');
  M.push('| alt \\ neu | ' + GRUENDE.join(' | ') + ' | Summe |', '|---|' + GRUENDE.map(function () { return '---'; }).join('|') + '|---|');
  GRUENDE.forEach(function (a) { var r = matrix[a] || {}, s = 0; var zl = GRUENDE.map(function (n) { s += r[n] || 0; return r[n] ? (a === n ? String(r[n]) : '**' + r[n] + '**') : '.'; }); if (s) M.push('| ' + a + ' | ' + zl.join(' | ') + ' | ' + s + ' |'); });
  M.push('| *neue Reihen* | ' + GRUENDE.map(function (n) { return Z.neueReihen.jeGrund[n] || '.'; }).join(' | ') + ' | ' + neue.length + ' |');
  function kz(f) { return '| ' + [f.reihe, f.ankerAlt === f.ankerNeu ? f.ankerNeu : f.ankerAlt + ' -> ' + f.ankerNeu, f.alt.grund + ' (' + f.alt.beleg + ', ' + (f.alt.datum || '-') + ')', (f.alt.quelle || '-').replace(/^EDGAR:/, ''),
    f.neu.grund + ' (' + f.neu.beleg + ', ' + (f.neu.datum || '-') + ')', (f.neu.quelle || '-').replace(/^EDGAR:/, ''), (f.alt.firma || '-') + (f.alt.cik !== f.neu.cik ? ' -> ' + (f.neu.firma || '-') : ''),
    (f.ursachen.join('+') || 'Datenstand'), f.hinweise.join(', ') || '-', f.belegTageZumAnker == null ? '-' : (f.belegTageZumAnker > 0 ? '+' : '') + f.belegTageZumAnker, f.k123].join(' | ') + ' |'; }
  var kk = '| Reihe | Anker (alt -> neu) | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | Ursache | Hinweise | neuer Beleg: Tage zum Anker | Zeilen K1-3 (letzte 250) |\n|---|---|---|---|---|---|---|---|---|---|---|';
  M.push('', '## Die 30 groessten Kipp-Faelle (von ' + kippFaelle.length + '; "gross" = meiste Zeilen in Klasse 1-3 unter den letzten 250 Panel-Zeilen)', '', kk);
  kippFaelle.slice(0, 30).forEach(function (f) { M.push(kz(f)); });
  M.push('', '## 20 zufaellig gezogene Kipp-Faelle (Saat `t4-kipp`)', '', kk);
  G.ziehe(kippFaelle, 20, 't4-kipp', function (f) { return f.reihe; }).forEach(function (f) { M.push(kz(f)); });
  M.push('', '## Geaenderte Totalverlust-Eigenschaft (Insolvenz, Zwangs-Delisting) mit Klasse 1-3: alle ' + tvH.filter(function (x) { return x.k123 > 0; }).length + ' Reihen', '',
    '| Reihe | Anker | Richtung | alt (Grund, Beleg, Datum, Firma) | neu (Grund, Beleg, Datum, Firma) | Ursache | Hinweise | Zeilen K1-3 | Zeilen K2-3 |', '|---|---|---|---|---|---|---|---|---|');
  tvH.filter(function (x) { return x.k123 > 0; }).forEach(function (x) { M.push('| ' + [x.reihe, x.anker, x.richtung, x.alt ? x.alt.grund + ' (' + x.alt.beleg + ', ' + (x.alt.datum || '-') + ', ' + (x.alt.firma || '-') + ')' : '(neu in der Tafel)',
    x.neu.grund + ' (' + x.neu.beleg + ', ' + (x.neu.datum || '-') + ', ' + (x.neu.firma || '-') + ')', x.ursachen.join('+') || (x.alt ? 'Datenstand' : '-'), x.hinweise.join(', ') || '-', x.k123, x.k23].join(' | ') + ' |'); });
  fs.writeFileSync(path.join(P.HIER, 't4-anhang.md'), M.join('\n') + '\n');

  console.log('alte Zeilen:', JSON.stringify(Z.alteZeilen));
  console.log('Kipp:', JSON.stringify(Z.kipp));
  console.log('umbenannt R-c:', Z.umbenanntRc, '| unbekannt bekommt Grund:', JSON.stringify(Z.unbekanntBekommtGrund), '| neue Reihen:', JSON.stringify(Z.neueReihen));
  console.log('Matrix:', JSON.stringify(matrix));
  console.log('Tafel im Ganzen:', JSON.stringify(Z.tafelImGanzen));
  console.log('R-c:', JSON.stringify(Z.rC.formular25OhneAussenanker), 'neuer Grund', Z.rC.formular25VonPolygonFirma);
  console.log('Firma:', JSON.stringify(Z.pruefsteine.firma.alteTafelGanz), JSON.stringify(Z.pruefsteine.firma.trockenlaufNeu), '| Namen:', JSON.stringify({ z: namen.zeilen, name: namen.namePasst, frueher: namen.nurFruehererNamePasst, kuerzel: namen.nurKuerzelPasst, nichts: namen.nichtsPasst }));
  EDGAR_BELEGE.forEach(function (b) { console.log('Lage ' + b + ': alt', JSON.stringify(lage.alt[b]), '| neu', JSON.stringify(lage.neu[b])); });
  console.log('Totalverlust haupt:', JSON.stringify(Z.totalverlust.haupt));
  console.log('Totalverlust streng (neuer Grund wie freiwillig):', JSON.stringify(Z.totalverlust.strengNeuerGrundWieFreiwillig));
  console.log('Totalverlust streng (neuer Grund kein TV):', JSON.stringify(Z.totalverlust.strengNeuerGrundKeinTotalverlust));
  console.log('Gruppen:', JSON.stringify(Z.gruppen));
}

module.exports = { vergleiche: vergleiche, ursachen: ursachen, tvIn: tvIn, nameAehnlich: nameAehnlich, NEUER_GRUND: NEUER_GRUND };
if (require.main === module) main();
