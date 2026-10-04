'use strict';
/* ZAEHLLAUF 3 - Nachzaehlung der Zahlen, auf denen der Auftrag baut (Auftrag Nr. 90, Abschnitt 6 und Abschnitt 5), und
 * vier Zusatzproben am fertigen Lauf. Nur lesen. Gezaehlt wird an den Arbeitsdateien des ZWEITEN Laufs
 * (../phase2/t4-gruende-neu.json, t4-verschwundene.json) und an den Ende-Massnahmen beider Ordner, wie sie
 * t4-universum.js in z3-verschwundene.json abgelegt hat (dieselben Dateien, jeder Satz mit Rolle).
 *
 * Aufruf:  node nachzaehlen.js      Schreibt: z3-nachzaehlung.json
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var E = require('./t4-einstufen.js');
var W = require('./wortlaut.js');

var FENSTER = { name_changes: 60, cash_mergers: 90, stock_and_cash_mergers: 90, stock_mergers: 90, redemptions: 90, worthless_removals: 180 };
function drin(m, anker) { return !!(m && m.ex && FENSTER[m.art] && E.imFenster(m.ex, anker, FENSTER[m.art])); }
function abst(m, anker) { return Math.abs(E.tage(m.ex, anker)); }
function jeFeld(l, f) { return l.reduce(function (a, z) { var k = String(f(z)); a[k] = (a[k] || 0) + 1; return a; }, {}); }
function datumAus(akz) { var m = /(\d{4}-\d{2}-\d{2})\)$/.exec(akz || ''); return m ? m[1] : null; }

function main() {
  var ED = require('./t4-edgar.js');
  var V3 = G.json(path.join(Z3.HIER, 'z3-verschwundene.json')).reihen, N2 = G.json(path.join(Z3.P2, 't4-gruende-neu.json')).reihen, V2 = G.json(path.join(Z3.P2, 't4-verschwundene.json')).reihen;
  var je2 = {}, jeV2 = {}; N2.forEach(function (z) { je2[z.reihe] = z; }); V2.forEach(function (r) { jeV2[r.reihe] = r; });
  var aus = { stand: new Date().toISOString() };

  /* ---- Abschnitt 6, erster Punkt: Ende-Massnahme ---- */
  var nurFrueher = [], andereArt = [], rollen = { abgebend: 0, aufnehmend: 0, fremd: 0, ohnePunktGleichsetzung: [] }, nachtragAmAnker = [], nachtragSpaet = [];
  V3.forEach(function (R) {
    var j = R.massnahmeEnde, a = R.letzterBalken, alle = R.endeMassnahmen || [], imF = alle.filter(function (m) { return drin(m, a) && !(j && m.id === j.id); });
    var naechste = imF.slice().sort(function (x, y) { return abst(x, a) - abst(y, a); })[0] || null;
    if (j && !drin(j, a) && naechste) nurFrueher.push({ reihe: R.reihe, juengste: j.art + ' ' + j.ex, frueher: naechste.art + ' ' + naechste.ex, rolle: naechste.rolle, lauf2: je2[R.reihe].grund });
    if (j && drin(j, a)) {
      var naeher = imF.filter(function (m) { return m.art !== j.art && abst(m, a) < abst(j, a); }).sort(function (x, y) { return abst(x, a) - abst(y, a); })[0];
      if (naeher) andereArt.push({ reihe: R.reihe, juengste: j.art, naeher: naeher.art, rolle: naeher.rolle });
      if (/_mergers$/.test(j.art)) {
        var jm = alle.filter(function (m) { return m.id === j.id; })[0], ro = jm ? jm.rolle : 'fremd';
        rollen[ro]++;
        if (ro === 'abgebend' && /[.-]/.test(R.basis)) rollen.ohnePunktGleichsetzung.push(R.reihe);
      }
    }
    alle.forEach(function (m) { if (m.woher !== 'nachtrag') return; (drin(m, a) ? nachtragAmAnker : nachtragSpaet).push(R.reihe + ' ' + m.art + ' ' + m.ex + ' (' + m.rolle + ', ' + E.tage(m.ex, a) + ' Tage nach dem Anker)'); });
  });
  aus.endeMassnahme = { juengsteAusserhalbFruehereImFenster: { zeilen: nurFrueher.length, davonAbgebend: nurFrueher.filter(function (x) { return x.rolle === 'abgebend'; }).length, jeArt: jeFeld(nurFrueher, function (x) { return x.frueher.split(' ')[0]; }), jeGrundLauf2: jeFeld(nurFrueher, function (x) { return x.lauf2; }),
    zwangsDelisting: nurFrueher.filter(function (x) { return x.lauf2 === 'zwangs-delisting'; }).map(function (x) { return x.reihe; }), abgemeldet: nurFrueher.filter(function (x) { return x.lauf2 === 'abgemeldet-anlass-offen'; }).map(function (x) { return x.reihe; }),
    unbekannt: nurFrueher.filter(function (x) { return x.lauf2 === 'unbekannt'; }).map(function (x) { return x.reihe; }), nichtAbgebend: nurFrueher.filter(function (x) { return x.rolle !== 'abgebend'; }).map(function (x) { return x.reihe + ' (' + x.frueher + ', ' + x.rolle + ')'; }) },
    andereArtNaeher: { zeilen: andereArt.length, davonAbgebend: andereArt.filter(function (x) { return x.rolle === 'abgebend'; }).length, paare: jeFeld(andereArt, function (x) { return x.naeher + ' vor ' + x.juengste; }) },
    rolleInUebernahmeSaetzenImFenster: rollen, nachtrag: { amAnker: nachtragAmAnker, spaet: nachtragSpaet } };

  /* ---- Abschnitt 6, Punkte 2 bis 5: am zweiten Lauf ---- */
  var z301 = N2.filter(function (z) { return z.beleg === 'edgar-8K-3.01'; });
  function lage(z) { var d = G.tageZwischen(z.letzter_balken, z.datum); return d < -180 ? 'mehr als 180 Tage davor' : d < -30 ? '180 bis 31 Tage davor' : d <= 30 ? 'hoechstens 30 Tage' : 'mehr als 30 Tage danach'; }
  var alteV2 = z301.filter(function (z) { return Math.abs(G.tageZwischen(z.letzter_balken, z.datum)) <= 30 && z.signale.fusionsbeleg; });
  var mantel = z301.filter(function (z) { return z.sic === '6770'; }), e25 = z301.filter(function (z) { return z.signale.f25_emittent; });
  aus.lauf2 = { zeilen: N2.length, jeGrund: jeFeld(N2, function (z) { return z.grund; }), mitPolygonFirma: N2.filter(function (z) { return z.polygon_firma; }).length,
    zwangsDelistingUeber301: { zeilen: z301.length, lage: jeFeld(z301, lage) },
    alteFassungV2: { zeilen: alteV2.length, lageDesFusionsbelegs: jeFeld(alteV2, function (z) { var d = G.tageZwischen(z.letzter_balken, datumAus(z.signale.fusionsbeleg)); return d > 30 ? 'mehr als 30 Tage danach' : d >= -180 ? '180 davor bis 30 danach' : d >= -365 ? '365 bis 181 davor' : 'noch frueher'; }),
      letzterKursUnter1: alteV2.filter(function (z) { return z.letzter_kurs_archiv != null && z.letzter_kurs_archiv < 1; }).length },
    sic6770Ueber301: { zeilen: mantel.length, band: jeFeld(mantel, function (z) { return Z3.band(z.letzter_kurs_archiv); }), unter8: mantel.filter(function (z) { return !(z.letzter_kurs_archiv >= 8); }).map(function (z) { return z.reihe + ' ' + z.letzter_kurs_archiv; }) },
    spacEndeJeBand: jeFeld(N2.filter(function (z) { return z.grund === 'spac-ende'; }), function (z) { return Z3.band(z.letzter_kurs_archiv); }),
    zwangsUeber301MitEmittent25: { zeilen: e25.length, band: jeFeld(e25, function (z) { return Z3.band(z.letzter_kurs_archiv); }) },
    gruppen: { mantelMit301: N2.filter(function (z) { return z.sic === '6770' && z.signale.i301; }).length, emittent25Mit301: N2.filter(function (z) { return z.signale.i301 && z.signale.f25_emittent; }).length,
      ausgesetzt: N2.filter(function (z) { if (z.polygon_firma || /^alpaca-|^q-kuerzel/.test(z.beleg || '')) return false; var R = jeV2[z.reihe], d = (R.polygon || []).filter(function (b) { return G.tageZwischen(z.letzter_balken, b) > 90; })[0], m = R.massnahmeEnde;
        return !!(d || (m && m.ex && G.tageZwischen(z.letzter_balken, m.ex) > 90)); }).length } };
  /* Namensprobe des zweiten Laufs (alte Polygon-Liste) und die "99" */
  var probe = { passt: 0, frueher: 0, kuerzel: 0, nichts: 0, 'ohne-auszug': 0 }, alteFirmaPolygonName = 0, davonNichts = 0;
  N2.forEach(function (z) {
    if (z.zuordnungsweg !== 'polygon-cik' || !z.cik || !z.polygon_firma) return;
    var p = Z3.namensprobe(ED.lokal(z.cik, G.tagPlus(z.letzter_balken, -550), G.tagPlus(z.letzter_balken, 300)).S, z.polygon_firma.name, z.reihe.replace(/~2$/, ''));
    probe[p]++;
    if (z.alt && z.alt.cik && z.alt.cik !== z.cik && Z3.nameAehnlich(z.alt.firma, z.polygon_firma.name)) { alteFirmaPolygonName++; if (p === 'nichts') davonNichts++; }
  });
  aus.lauf2.namensprobe = probe; aus.lauf2.alteFirmaTraegtPolygonNamen = { zeilen: alteFirmaPolygonName, davonNichtsPasst: davonNichts };

  /* ---- Zusatzproben am dritten Lauf (berichten, nicht beheben) ---- */
  var N3 = G.json(path.join(Z3.HIER, 'z3-gruende-neu.json'));
  function abschnittVon(akz) { var t = Z3.lies(path.join(Z3.HIER, 'edgar', 'texte', akz + '.json')); return t && t.text ? W.abschnitt(t.text) : { gefunden: false, text: '' }; }
  var eigen = N3.reihen.filter(function (z) { return z.regel === 11 && z.wortlaut === 'eigener-entschluss'; });
  var insolvenzWort = eigen.filter(function (z) { var t = z.wortlaut_treffer.eigen; return t.every(function (x) { return /^voluntar/.test(x); }) && /voluntary petition|chapter (?:7|11)|bankruptcy/i.test(abschnittVon(/^EDGAR:(\S+)/.exec(z.quelle)[1]).text); });
  var q = N3.reihen.filter(function (z) { return z.regel === 0 && z.letzter_kurs_archiv >= 5; });
  var ohneAbschnitt = N3.reihen.filter(function (z) { return z.wortlaut_stand === 'abschnitt-nicht-gefunden'; });
  var f25fern = N3.reihen.filter(function (z) { return z.regel === 13 && Math.abs(G.tageZwischen(z.letzter_balken, z.datum)) > 30; });
  aus.zusatz = { eigenerEntschlussNurUeberVoluntaryMitInsolvenzwort: { von: eigen.length, zeilen: insolvenzWort.length, reihen: insolvenzWort.map(function (z) { return z.reihe + ' (' + z.band + ')'; }) },
    qKuerzelMitKursAb5: q.map(function (z) { return z.reihe + ' -> ' + z.nachfolger + ' (' + z.letzter_kurs_archiv + ', ' + z.beleg + ')'; }),
    abschnittNichtGefunden: ohneAbschnitt.map(function (z) { var t = Z3.lies(path.join(Z3.HIER, 'edgar', 'texte', /^EDGAR:(\S+)/.exec(z.quelle)[1] + '.json')), i = t.text.search(/3\.01/); return z.reihe + ' [' + (i < 0 ? 'kein 3.01 im Hauptdokument' : t.text.slice(Math.max(0, i - 25), i + 30).replace(/\s+/g, ' ')) + ']'; }),
    eichprobeA_nichtVollzug: N3.eichprobe.a.reihen.filter(function (x) { return x.klasse !== 'vollzug'; }).map(function (x) { return x.reihe + ' ' + x.klasse; }),
    eichprobeA_ruege: N3.eichprobe.a.reihen.filter(function (x) { return x.klasse === 'ruege'; }).map(function (x) { return x.reihe + ': ' + x.auszug.slice(0, 220); }),
    eichprobeB_nichtRuege: N3.eichprobe.b.reihen.filter(function (x) { return x.klasse !== 'ruege'; }).map(function (x) { return x.reihe + ' ' + x.klasse; }),
    formular25MehrAls30TageVomAnker: { zeilen: f25fern.length, mitKlasse123: null, mehrAls180: f25fern.filter(function (z) { return Math.abs(G.tageZwischen(z.letzter_balken, z.datum)) > 180; }).length },
    ruegeWeiterAls30TageVorAnker: N3.reihen.filter(function (z) { return z.beleg === 'edgar-8K-3.01-ruege' && G.tageZwischen(z.letzter_balken, z.datum) < -30; }).length };
  Z3.schreibe('z3-nachzaehlung.json', aus);
  console.log(JSON.stringify(aus));
}
if (require.main === module) main();
