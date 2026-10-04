'use strict';
/* T2, Schritt 4 - Auswertung des Trockenlaufs: Matrix Grund alt -> Grund neu, Kipp-Faelle, neue Reihen. Nur zaehlen.
 *
 * Aufruf:  node t2-auswerten.js
 * Liest:   t2-gruende-neu.json, t2-edgar-zuordnung.json, die alte Tafel (nur lesen)
 * Schreibt: t2-zahlen.json, t2-matrix.json, t2-kippfaelle.json, t2-neue-reihen.json, teile/t2.md
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

var HAUPT = ['insolvenz', 'zwangs-delisting'], STRENG = ['insolvenz', 'zwangs-delisting', 'unbekannt', 'freiwillig'];
var GRUENDE = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', 'unbekannt'];

/** Reine Regel (Klaerung 3): "kippt" = alter Grund weder "unbekannt" noch gleich dem neuen. */
function vergleiche(alt, neu) {
  if (!alt) return 'neu';
  if (alt.grund === neu.grund) return (alt.datum === neu.datum && alt.quelle === neu.quelle) ? 'gleich' : 'gleicher-grund-anderer-beleg';
  if (alt.grund === 'unbekannt') return 'unbekannt-bekommt-grund';
  return neu.grund === 'unbekannt' ? 'kippt-verliert-grund' : 'kippt';
}

function main() {
  var N = G.json(path.join(G.HIER, 't2-gruende-neu.json')), E = G.json(path.join(G.HIER, 't2-edgar-zuordnung.json'));
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json'));
  var zeilen = N.reihen;
  zeilen.forEach(function (z) { z.vergleich = vergleiche(z.alt, z); });
  var anker = zeilen.filter(function (z) { return !z.neu; }), neue = zeilen.filter(function (z) { return z.neu; });

  var matrix = {};
  anker.forEach(function (z) { var a = z.alt.grund; matrix[a] = matrix[a] || {}; matrix[a][z.grund] = (matrix[a][z.grund] || 0) + 1; });
  function zahl(l, f) { return l.filter(f).length; }
  function jeGrund(l) { return l.reduce(function (a, z) { a[z.grund] = (a[z.grund] || 0) + 1; return a; }, {}); }
  function tv(l, liste) { return { kommtHinzu: zahl(l, function (z) { return liste.indexOf(z.grund) !== -1 && !(z.alt && liste.indexOf(z.alt.grund) !== -1); }),
    faelltWeg: zahl(l, function (z) { return z.alt && liste.indexOf(z.alt.grund) !== -1 && liste.indexOf(z.grund) === -1; }) }; }

  var Z = { stand: new Date().toISOString(), alteTafel: { kennung: T.kennung, zeilen: T.n }, eingestuft: zeilen.length, offen: N.offen,
    ankerGeaendert: { zeilen: anker.length, ueber90Tage: zahl(anker, function (z) { return z.anker_diff_tage > 90; }),
      ueber90_altUnbekannt: zahl(anker, function (z) { return z.anker_diff_tage > 90 && z.alt.grund === 'unbekannt'; }),
      ueber90_altBelegNichtsOderPasstNicht: zahl(anker, function (z) { return z.anker_diff_tage > 90 && (z.alt.beleg === 'nichts' || z.alt.beleg === 'massnahme-passt-nicht'); }),
      altUnbekannt: zahl(anker, function (z) { return z.alt.grund === 'unbekannt'; }),
      vergleich: anker.reduce(function (a, z) { a[z.vergleich] = (a[z.vergleich] || 0) + 1; return a; }, {}),
      altJeGrund: anker.reduce(function (a, z) { a[z.alt.grund] = (a[z.alt.grund] || 0) + 1; return a; }, {}), neuJeGrund: jeGrund(anker),
      firmaAnders: zahl(anker, function (z) { return (z.alt.cik || null) !== (z.cik || null); }),
      firmaAnders_beideBelegt: zahl(anker, function (z) { return z.alt.cik && z.cik && z.alt.cik !== z.cik; }),
      totalverlustHaupt: tv(anker, HAUPT), totalverlustStreng: tv(anker, STRENG) },
    neueReihen: { beiX: {} }, edgar: E.summe, edgarFehler: (E.fehler || []).length };
  [0, 5, 10, 20].forEach(function (x) {
    var l = neue.filter(function (z) { return z.lebend_ab_x == null || z.lebend_ab_x > x; });
    Z.neueReihen.beiX[x] = { reihen: l.length, jeGrund: jeGrund(l), totalverlustHaupt: zahl(l, function (z) { return HAUPT.indexOf(z.grund) !== -1; }), totalverlustStreng: zahl(l, function (z) { return STRENG.indexOf(z.grund) !== -1; }) };
  });
  /* neue Tafel im Ganzen (X = 10): alte Zeilen mit unveraendertem Anker + neu eingestufte + neue Reihen */
  var x10 = neue.filter(function (z) { return z.lebend_ab_x == null || z.lebend_ab_x > G.X_TROCKENLAUF; });
  var ganz = {}; T.reihen.forEach(function (r) { ganz[r.grund] = (ganz[r.grund] || 0) + 1; });
  var ganzNeu = Object.assign({}, ganz);
  anker.forEach(function (z) { ganzNeu[z.alt.grund]--; ganzNeu[z.grund] = (ganzNeu[z.grund] || 0) + 1; });
  x10.forEach(function (z) { ganzNeu[z.grund] = (ganzNeu[z.grund] || 0) + 1; });
  Z.tafelImGanzen = { alt: ganz, neuBeiX10: ganzNeu, zeilenAlt: T.n, zeilenNeuBeiX10: T.n + x10.length };

  /* ---- Pruefsteine von aussen: stimmt die Firma, liegt der Beleg am Reihenende? ----
   * (1) Polygon fuehrt je abgegangenem Kuerzel eine CIK. Wo ein Polygon-Eintrag hoechstens 45 Tage vom Anker liegt, ist
   *     das ein Aussenanker fuer die Zuordnung Kuerzel -> Firma, die hier aus der Volltextsuche geschaetzt wird.
   * (2) Ein Beleg, der das ENDE der Notierung erklaeren soll, muss am Ende liegen: Tage zwischen Belegdatum und Anker. */
  var poly = G.polygon().je;
  function polyCik(basis, anker) {
    var l = poly[basis] || poly[basis.replace(/-/g, '.')] || [], best = null;
    l.forEach(function (p) { if (!p.bis || !p.cik) return; var d = Math.abs(G.tageZwischen(anker, p.bis)); if (d <= 45 && (!best || d < best.d)) best = { cik: p.cik, d: d, name: p.name }; });
    return best;
  }
  function firmaPruefen(liste, ankerVon, cikVon, basisVon) {
    var a = { zeilen: liste.length, mitPolygonCik: 0, firmaBestaetigt: 0, stimmt: 0, widerspricht: 0, ohneFirma: 0, widerspruch: [] };
    liste.forEach(function (z) {
      var p = polyCik(basisVon(z), ankerVon(z)); if (!p) return;
      a.mitPolygonCik++;
      var c = cikVon(z);
      if (!c) { a.ohneFirma++; return; }
      a.firmaBestaetigt++;
      if (c === p.cik) a.stimmt++; else { a.widerspricht++; a.widerspruch.push({ reihe: z.reihe, grund: z.grund, beleg: z.beleg, firma: z.firma, polygon: p.name }); }
    });
    return a;
  }
  function belegAbstand(liste, ankerVon, beleg) {
    var l = liste.filter(function (z) { return z.beleg === beleg && z.datum; }), a = { zeilen: l.length, mehrAls30TageVorAnker: 0, mehrAls180TageVorAnker: 0, innerhalb30: 0, mehrAls30TageNach: 0 };
    l.forEach(function (z) { var d = G.tageZwischen(ankerVon(z), z.datum); if (d < -180) a.mehrAls180TageVorAnker++; if (d < -30) a.mehrAls30TageVorAnker++; else if (d > 30) a.mehrAls30TageNach++; else a.innerhalb30++; });
    return a;
  }
  function basisVonReihe(z) { return z.reihe.replace(/~2$/, ''); }
  var nurX10 = zeilen.filter(function (z) { return !z.neu || z.lebend_ab_x == null || z.lebend_ab_x > G.X_TROCKENLAUF; });
  var altZeilen = anker.map(function (z) { return { reihe: z.reihe, grund: z.alt.grund, beleg: z.alt.beleg, firma: z.alt.firma, cik: z.alt.cik, datum: z.alt.datum, ankerAlt: z.letzter_balken_alt, ankerNeu: z.letzter_balken }; });
  Z.pruefsteine = {
    hinweis: 'Aussenanker Polygon-CIK (Eintrag hoechstens 45 Tage vom Anker) und Lage des Belegs zum Anker. "alteTafelGanz" misst die Logik selbst, unabhaengig vom Ankerfehler.',
    firma: {
      trockenlaufNeu: firmaPruefen(nurX10, function (z) { return z.letzter_balken; }, function (z) { return z.cik; }, basisVonReihe),
      dieselbenZeilenAlt: firmaPruefen(altZeilen, function (z) { return z.ankerNeu; }, function (z) { return z.cik; }, basisVonReihe),
      alteTafelGanz: firmaPruefen(T.reihen, function (z) { return z.letzter_balken; }, function (z) { return z.cik; }, basisVonReihe) },
    belegLage: {
      trockenlaufNeu: { 'edgar-8K-2.01+prospekt': belegAbstand(nurX10, function (z) { return z.letzter_balken; }, 'edgar-8K-2.01+prospekt'), 'edgar-8K-3.01': belegAbstand(nurX10, function (z) { return z.letzter_balken; }, 'edgar-8K-3.01'),
        'edgar-8K-1.03': belegAbstand(nurX10, function (z) { return z.letzter_balken; }, 'edgar-8K-1.03'), 'edgar-formular25': belegAbstand(nurX10, function (z) { return z.letzter_balken; }, 'edgar-formular25') },
      alteTafelGanz: { 'edgar-8K-2.01+prospekt': belegAbstand(T.reihen, function (z) { return z.letzter_balken; }, 'edgar-8K-2.01+prospekt'), 'edgar-8K-3.01': belegAbstand(T.reihen, function (z) { return z.letzter_balken; }, 'edgar-8K-3.01'),
        'edgar-8K-1.03': belegAbstand(T.reihen, function (z) { return z.letzter_balken; }, 'edgar-8K-1.03'), 'edgar-formular25': belegAbstand(T.reihen, function (z) { return z.letzter_balken; }, 'edgar-formular25') } } };
  ['trockenlaufNeu', 'dieselbenZeilenAlt', 'alteTafelGanz'].forEach(function (k) { var f = Z.pruefsteine.firma[k]; f.widerspruchListe = f.widerspruch.length > 60 ? f.widerspruch.length + ' Faelle (nicht gelistet)' : f.widerspruch; delete f.widerspruch; });
  /* je Kipp-Fall ein Zeichen, ob der neue Beleg am Reihenende liegt und ob die Firma zu Polygon passt */
  zeilen.forEach(function (z) {
    var p = polyCik(basisVonReihe(z), z.letzter_balken);
    z.firmaZuPolygon = !p ? 'kein Aussenanker' : !z.cik ? 'ohne Firma' : z.cik === p.cik ? 'passt' : 'WIDERSPRICHT (' + p.name + ')';
    z.belegTageZumAnker = z.datum ? G.tageZwischen(z.letzter_balken, z.datum) : null;
  });

  function kurzAlt(z) { return { grund: z.alt.grund, datum: z.alt.datum, beleg: z.alt.beleg, quelle: z.alt.quelle, firma: z.alt.firma, cik: z.alt.cik }; }
  function kurzNeu(z) { return { grund: z.grund, datum: z.datum, beleg: z.beleg, quelle: z.quelle, firma: z.firma, cik: z.cik }; }
  function fall(z) { return { reihe: z.reihe, ankerAlt: z.letzter_balken_alt, ankerNeu: z.letzter_balken, ankerDiffTage: z.anker_diff_tage, vergleich: z.vergleich, alt: kurzAlt(z), neu: kurzNeu(z),
    firmaZuPolygon: z.firmaZuPolygon, belegTageZumAnker: z.belegTageZumAnker }; }
  var kipp = anker.filter(function (z) { return z.vergleich === 'kippt' || z.vergleich === 'kippt-verliert-grund'; }).map(fall);
  var bekommt = anker.filter(function (z) { return z.vergleich === 'unbekannt-bekommt-grund'; }).map(fall);
  G.schreibe('t2-zahlen.json', Z);
  G.schreibe('t2-matrix.json', { stand: Z.stand, hinweis: 'Zeilen der alten Tafel, deren Anker sich um mehr als 3 Tage aendert: Grund alt (Zeile) -> Grund neu (Spalte).', matrix: matrix,
    alle: anker.map(fall) });
  G.schreibe('t2-kippfaelle.json', { stand: Z.stand, regel: 'kippt = alter Grund weder unbekannt noch gleich dem neuen', kippt: kipp, unbekanntBekommtGrund: bekommt });
  G.schreibe('t2-neue-reihen.json', { stand: Z.stand, hinweis: 'Reihen, die der alten Tafel fehlen. lebendAbX: kleinstes X, bei dem die Reihe als lebend gilt (null = bei keinem).',
    reihen: neue.map(function (z) { return { reihe: z.reihe, anker: z.letzter_balken, lebendAbX: z.lebend_ab_x, neu: kurzNeu(z), letzterKurs: z.letzter_kurs_archiv, preisJeAktie: z.preis_je_aktie, nachfolger: z.nachfolger || null }; }) });

  /* ---- Textteil ---- */
  var M = [];
  M.push('### T2 - Matrix Grund alt (Zeile) -> Grund neu (Spalte), ' + anker.length + ' Zeilen mit geaendertem Anker', '');
  M.push('| alt \\ neu | ' + GRUENDE.join(' | ') + ' | Summe |', '|---|' + GRUENDE.map(function () { return '---'; }).join('|') + '|---|');
  GRUENDE.forEach(function (a) { var r = matrix[a] || {}, s = 0; var zl = GRUENDE.map(function (n) { s += r[n] || 0; return r[n] ? (a === n ? String(r[n]) : '**' + r[n] + '**') : '.'; }); if (s) M.push('| ' + a + ' | ' + zl.join(' | ') + ' | ' + s + ' |'); });
  function kz(f) { return '| ' + [f.reihe, f.ankerAlt + ' -> ' + f.ankerNeu, f.alt.grund + ' (' + f.alt.beleg + ', ' + (f.alt.datum || '-') + ')', (f.alt.quelle || '-').replace(/^EDGAR:/, ''), f.neu.grund + ' (' + f.neu.beleg + ', ' + (f.neu.datum || '-') + ')', (f.neu.quelle || '-').replace(/^EDGAR:/, ''), (f.alt.firma || '-') + (f.alt.cik !== f.neu.cik ? ' -> ' + (f.neu.firma || '-') : ''),
    (f.belegTageZumAnker == null ? '-' : (f.belegTageZumAnker > 0 ? '+' : '') + f.belegTageZumAnker) + ' / ' + f.firmaZuPolygon].join(' | ') + ' |'; }
  var kk = '| Reihe | Anker alt -> neu | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | neuer Beleg: Tage zum Anker / Firma zu Polygon |\n|---|---|---|---|---|---|---|---|';
  M.push('', '### T2 - alle ' + kipp.length + ' Kipp-Faelle (alter Grund belegt, neuer Grund ein anderer)', '', kk);
  kipp.forEach(function (f) { M.push(kz(f)); });
  M.push('', '### T2 - "unbekannt" bekommt einen Grund (alle ' + bekommt.length + ')', '', kk);
  bekommt.forEach(function (f) { M.push(kz(f)); });
  var alleF = anker.map(fall);
  M.push('', '### T2 - die 30 Zeilen mit der groessten Ankerverschiebung', '', kk);
  alleF.slice().sort(function (p, q) { return q.ankerDiffTage - p.ankerDiffTage || (p.reihe < q.reihe ? -1 : 1); }).slice(0, 30).forEach(function (f) { M.push(kz(f)); });
  M.push('', '### T2 - 20 zufaellig gezogene Zeilen mit geaendertem Anker (Saat `t2-anker`)', '', kk);
  G.ziehe(alleF, 20, 't2-anker', function (f) { return f.reihe; }).forEach(function (f) { M.push(kz(f)); });
  M.push('', '### T2 - die neu hinzukommenden Reihen (alle ' + neue.length + ' bei X = 0; `lebend ab X` nennt, ab welchem X die Reihe als lebend gilt und entfaellt)', '',
    '| Reihe | letzter Minutentag | lebend ab X | Grund | Beleg | Datum | Quelle | Firma |', '|---|---|---|---|---|---|---|---|');
  neue.forEach(function (z) { M.push('| ' + [z.reihe, z.letzter_balken, z.lebend_ab_x == null ? '-' : z.lebend_ab_x, z.grund, z.beleg, z.datum || '-', (z.quelle || '-').replace(/^EDGAR:/, ''), z.firma || '-'].join(' | ') + ' |'); });
  fs.writeFileSync(path.join(G.HIER, 'teile', 't2.md'), M.join('\n') + '\n');

  console.log(JSON.stringify(Z.ankerGeaendert));
  console.log('Matrix:', JSON.stringify(matrix));
  console.log('neu:', JSON.stringify(Z.neueReihen));
  console.log('Tafel im Ganzen:', JSON.stringify(Z.tafelImGanzen));
  console.log('Kipp:', kipp.length, 'bekommt Grund:', bekommt.length);
  console.log('Pruefsteine Firma:', JSON.stringify(Z.pruefsteine.firma, function (k, v) { return k === 'widerspruchListe' ? undefined : v; }));
  console.log('Pruefsteine Beleglage:', JSON.stringify(Z.pruefsteine.belegLage));
  var kq = { passt: 0, widerspricht: 0, ohne: 0, belegFern: 0 };
  kipp.forEach(function (f) { if (/^passt/.test(f.firmaZuPolygon)) kq.passt++; else if (/^WIDER/.test(f.firmaZuPolygon)) kq.widerspricht++; else kq.ohne++; if (f.belegTageZumAnker != null && Math.abs(f.belegTageZumAnker) > 30) kq.belegFern++; });
  Z.kippGuete = kq; G.schreibe('t2-zahlen.json', Z);
  console.log('Kipp-Guete:', JSON.stringify(kq));
}

module.exports = { vergleiche: vergleiche };
if (require.main === module) main();
