'use strict';
/* T6 - Umstellung und Verlaengerung: zaehlen, nichts aendern.
 *  (a) alle Stellen in studien/<ordner>/<datei>.js, die das Panel v2.1 (voll/) fest als Vorgabe tragen;
 *  (b) der Leser der Bilanz-Tafel (fundamental-lesen.js, kennt nur ~2) gegen die Reihen des Panels v2.2;
 *  (c) wie weit die Minuten ueber das Panel-Ende (15.09.2026) hinausreichen, und was eine Verlaengerung kostet.
 *
 * Aufruf:  node --max-old-space-size=6144 t6-umstellung.js
 * Schreibt: t6-zahlen.json, t6a-voll-stellen.json, t6b-bilanz-leser.json, t6c-minuten-nach-panel.json, teile/t6.md
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

/* ---------- (a) ---------- */
/* Suchmuster (Klaerung 7): 'voll' als eigenes Wort in einem Pfadausdruck. Jeder Treffer ist angesehen; die Einordnung
 * steht hier als Tafel, damit sie nachpruefbar ist. art: 'panel' = liest das Panel v2.1; 'eigen' = eigener Ausgabeordner
 * der Studie, der zufaellig voll heisst; 'text' = Kommentar/Meldung/anderes Wort. urteil nur fuer art 'panel'. */
var MUSTER = /['"]voll['"]|\/voll\/|['"]voll\/|voll\/panel/;
var EINORDNUNG = {
  'mehrfaktor-2026-09-22/zelle.js': { art: 'panel', urteil: 'Werkzeug - umstellen', grund: 'KONST.PANEL der Mehrfaktor-Maschine; die gemessene Studie (23.09.) bleibt, ein neuer Lauf braucht v2.2 und einen neuen Pin (B14 trifft heute den v2-Pin exakt)' },
  'fundamental-machbarkeit-2026-09-16/bauen.js': { art: 'panel', urteil: 'Werkzeug - umstellen, aber nicht nur der Pfad', grund: 'Bau der Bilanz-Tafel: kursAm() sucht den Kurs ueber T.symIdx[Leser-Reihe]; in v2.2 liegen die Zeilen nach einer Luecke unter ~2/~3/~4 - ohne Abschnitts-Zuordnung findet der Waechter fuer diese Zeitraeume keinen Kurs' },
  'fundamental-machbarkeit-2026-09-16/test-fundamental.js': { art: 'panel', urteil: 'Werkzeug - mit bauen.js umstellen', grund: 'Pruefung derselben Tafel' },
  'nachrichten-stimmung-tage-2026-09-19/vorpruefung.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Nachrichten-Stimmung, gemessen 03.10.2026 auf v2.1' },
  'nachrichten-stimmung-tage-2026-09-19/messen.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Nachrichten-Stimmung, gemessen 03.10.2026 auf v2.1' },
  'nachrichten-stimmung-tage-2026-09-19/test-messen.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Test derselben Messung' },
  'nachrichten-stimmung-machbarkeit-2026-09-19/mde-vorpruefung.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Machbarkeits-Vorpruefung, abgeschlossen' },
  'gdelt-abdeckung-2026-09-19/namenskarte.js': { art: 'panel', urteil: 'abgeschlossen - bleibt (bei Neulauf umstellen)', grund: 'Namenskarte der GDELT-Abdeckung aus den Panel-Kuerzeln; Zeile 19 ist der eigene Ordner' },
  'gdelt-abdeckung-2026-09-19/gkg-zaehlen.js': { art: 'eigen' }, 'gdelt-abdeckung-2026-09-19/auswerten.js': { art: 'eigen' }, 'gdelt-abdeckung-2026-09-19/test.js': { art: 'eigen' },
  'querschnitt-pruefstand-2026-09-13/bericht.js': { art: 'panel', urteil: 'Werkzeug - umstellen', grund: 'Vorgabe --aus voll; besser: ohne Vorgabe abbrechen wie kontrollen.js/teil3.js/teil4.js' },
  'querschnitt-pruefstand-2026-09-13/test.js': { art: 'panel', urteil: 'Werkzeug - umstellen', grund: 'Vorgabe aus: voll; die Pruefzahl REGRESSION23_ERWARTET hat schon den v2.2-Schluessel' },
  'querschnitt-pruefstand-2026-09-13/diagnose-placebo-teil4.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Diagnose zu Teil 4 (18.09.), Vorgabe voll' },
  'querschnitt-pruefstand-2026-09-13/diagnose-spruenge-teil4.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Diagnose zu Teil 4, Vorgabe voll' },
  'querschnitt-pruefstand-2026-09-13/bericht-teil3.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'liest voll/teil3/teil3-tage.json der gemessenen Teil-3-Studie' },
  'querschnitt-pruefstand-2026-09-13/luecken-trockenlauf.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Trockenlauf zu v2.2, misst absichtlich v2.1' },
  'querschnitt-pruefstand-2026-09-13/pruefung-spruenge-v2.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Vergleich v1 gegen v2.1' },
  'querschnitt-pruefstand-2026-09-13/pruefung-v22.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Kernpruefung v2.1 gegen v2.2: voll ist hier die Vergleichsbasis' },
  'querschnitt-pruefstand-2026-09-13/vergleich-v2.js': { art: 'panel', urteil: 'abgeschlossen - bleibt', grund: 'Vergleich v1/v2.1, liest voll/kontrollen-v2.json' },
  'querschnitt-pruefstand-2026-09-13/kuerzelwechsel.js': { art: 'text' }, 'querschnitt-pruefstand-2026-09-13/paneldaten.js': { art: 'text' },
  'querschnitt-pruefstand-2026-09-13/test-teil3.js': { art: 'text' },
  '63-supertrend/detektoren.js': { art: 'text' }, 'kapitulation-neu-2026-10-03/zaehlen.js': { art: 'text' }, 'gdelt-abdeckung-2026-09-19/namenskarte.js#eigen': { art: 'eigen' },
  'nachrichten-stimmung-tage-2026-09-19/messen.js#text': { art: 'text' }
};
function sucheVoll() {
  var wurzel = path.join(G.REPO, 'studien'), treffer = [], dateien = 0;
  fs.readdirSync(wurzel).forEach(function (o) {
    var d = path.join(wurzel, o);
    if (o === path.basename(G.HIER)) return;                  // dieser Ordner zaehlt nicht mit
    var st; try { st = fs.statSync(d); } catch (e) { return; }
    if (!st.isDirectory()) return;
    fs.readdirSync(d).forEach(function (f) {
      if (f.slice(-3) !== '.js') return;
      var p = path.join(d, f), s; try { s = fs.statSync(p); } catch (e) { return; }
      if (!s.isFile() || s.size > 5000000) return;            // keine Datendateien
      dateien++;
      fs.readFileSync(p, 'utf8').split('\n').forEach(function (z, i) {
        if (!MUSTER.test(z)) return;
        var kommentar = /^\s*(\/\*|\*|\/\/)/.test(z);
        treffer.push({ datei: o + '/' + f, zeile: i + 1, text: z.trim().slice(0, 160), kommentar: kommentar });
      });
    });
  });
  return { dateien: dateien, treffer: treffer };
}

/* ---------- (b) ---------- */
function bilanzLeser() {
  var F = require(path.join(G.FUNDAMENTAL, 'fundamental-lesen.js'));
  var t = F.oeffne();                                          // Standardordner fundamentaltafel/, nur lesen
  var st22 = G.json(path.join(G.PRUEFSTAND, 'voll-v22', 'panel', '_stand.json'));
  var RA = G.json(path.join(G.PRUEFSTAND, 'voll-v22', 'reihen-abschnitte.json'));
  var abschnitt = {};                                          // Panel-Reihe v2.2 -> Abschnitt (nur Kuerzel mit mehreren Abschnitten)
  Object.keys(RA.kuerzel).forEach(function (b) { RA.kuerzel[b].forEach(function (s, k) { abschnitt[s.reihe] = { basis: b, s: s, k: k, alle: RA.kuerzel[b] }; }); });
  function filingsIn(cik, von, bis) { var l = cik ? (t.alleFilings ? null : null) : null; void l; return 0; }
  void filingsIn;
  var jeCikFilings = function (sym, von, bis) { var l = t.alleFilings(sym), n = 0; for (var i = 0; i < l.length; i++) if (l[i].filed >= von && l[i].filed <= bis) n++; return n; };
  var aus = [], Z = { tafel: t.kennung, reihenV22: 0, mitFirma: 0, keineFirma: 0, keineFirmaObwohlV21Eine: 0, andereAlsV21: 0, gleichV21: 0, beideOhne: 0,
    jeEndung: {}, abschnitte: { gesamt: 0, mitPolygonCik: 0, firmaWiderspricht: 0, firmaWiderspricht_mitFilingsImAbschnitt: 0, firmaPasst: 0, ohneFirma: 0,
      paareNichtDasselbePapier: 0, paareNichtDasselbePapier_gleicheCik: 0, paareNichtDasselbePapier_gleicheCik_beideMitFilings: 0 } };
  st22.symbole.forEach(function (s) {
    if (s.referenz) return;
    Z.reihenV22++;
    var a = abschnitt[s.reihe], v21 = a ? a.s.reiheV21 : s.reihe;
    var c22 = t.cikVon(s.reihe), c21 = t.cikVon(v21);
    var endung = (/~(\d+)$/.exec(s.reihe) || [])[1] || '-';
    var e = Z.jeEndung[endung] || (Z.jeEndung[endung] = { reihen: 0, keineFirma: 0, firmaDesBasisKuerzels: 0, eigeneZuordnung: 0 });
    e.reihen++;
    var eigen = !!t.meta.reihen[s.reihe];
    if (c22) { Z.mitFirma++; if (eigen) e.eigeneZuordnung++; else e.firmaDesBasisKuerzels++; } else { Z.keineFirma++; e.keineFirma++; }
    var klasse = !c22 && c21 ? 'keine (v2.1 hatte eine)' : !c22 ? 'keine (auch v2.1 nicht)' : c21 && c22 !== c21 ? 'andere als v2.1' : 'wie v2.1';
    if (klasse === 'keine (v2.1 hatte eine)') Z.keineFirmaObwohlV21Eine++; else if (klasse === 'keine (auch v2.1 nicht)') Z.beideOhne++; else if (klasse === 'andere als v2.1') Z.andereAlsV21++; else Z.gleichV21++;
    if (!a && klasse === 'wie v2.1') return;                   // einteilige Reihe, unveraendert: nicht in die Liste
    var z = { reihe: s.reihe, reiheV21: v21, cikV22: c22, cikV21: c21, urteil: klasse, abschnittNr: a ? a.s.nr : null, von: a ? a.s.von : null, bis: a ? a.s.bis : null,
      beginn: a ? a.s.beginn : null, dasselbePapier: a ? (a.s.dasselbePapierWieVorgaenger || null) : null };
    if (a) {
      Z.abschnitte.gesamt++;
      var pc = ((a.s.quellen && a.s.quellen.polygon) || []).map(function (p) { return p.cik ? Number(p.cik) : null; }).filter(Boolean);
      /* der Polygon-Inhaber steht am Abschnitt NACH der Luecke; fuer den Abschnitt davor zaehlt der Eintrag des Nachfolgers nicht */
      z.polygonCik = pc.length ? pc : null;
      z.filingsImAbschnitt = c22 ? jeCikFilings(s.reihe, a.s.von, a.s.bis) : 0;
      if (!c22) Z.abschnitte.ohneFirma++;
      if (pc.length) {
        Z.abschnitte.mitPolygonCik++;
        if (c22 && pc.indexOf(Number(c22)) === -1) { Z.abschnitte.firmaWiderspricht++; z.widerspricht = 1; if (z.filingsImAbschnitt > 0) Z.abschnitte.firmaWiderspricht_mitFilingsImAbschnitt++; }
        else if (c22) Z.abschnitte.firmaPasst++;
      }
    }
    aus.push(z);
  });
  /* Paare aufeinanderfolgender Abschnitte, die ausdruecklich NICHT dasselbe Papier sind, aber dieselbe Firma bekommen */
  var jeReihe = {}; aus.forEach(function (z) { jeReihe[z.reihe] = z; });
  var paare = [];
  Object.keys(RA.kuerzel).forEach(function (b) {
    RA.kuerzel[b].forEach(function (s) {
      if (s.dasselbePapierWieVorgaenger !== 'nein' || !s.vorgaenger) return;
      Z.abschnitte.paareNichtDasselbePapier++;
      var x = jeReihe[s.vorgaenger], y = jeReihe[s.reihe];
      var em = s.derselbeEmittentWieVorgaenger || 'unbekannt';
      Z.abschnitte.paareJeEmittent = Z.abschnitte.paareJeEmittent || {};
      Z.abschnitte.paareJeEmittent[em] = (Z.abschnitte.paareJeEmittent[em] || 0) + 1;
      if (x && y && x.cikV22 && y.cikV22 && x.cikV22 === y.cikV22) {
        Z.abschnitte.paareNichtDasselbePapier_gleicheCik++;
        var beide = x.filingsImAbschnitt > 0 && y.filingsImAbschnitt > 0;
        if (beide) Z.abschnitte.paareNichtDasselbePapier_gleicheCik_beideMitFilings++;
        if (em === 'nein') { Z.abschnitte.andererEmittent_gleicheCik = (Z.abschnitte.andererEmittent_gleicheCik || 0) + 1; if (beide) Z.abschnitte.andererEmittent_gleicheCik_beideMitFilings = (Z.abschnitte.andererEmittent_gleicheCik_beideMitFilings || 0) + 1; }
        paare.push({ basis: b, vor: x.reihe, nach: y.reihe, cik: x.cikV22, derselbeEmittent: em, filingsVor: x.filingsImAbschnitt, filingsNach: y.filingsImAbschnitt, vorBis: x.bis, nachVon: y.von });
      }
    });
  });
  return { zahlen: Z, reihen: aus, paare: paare };
}

/* ---------- (c) ---------- */
function minutenNachPanel() {
  var R = G.reihen(), kal = R.kal, panelEnde = '2026-09-15';
  var st = G.json(path.join(G.PRUEFSTAND, 'voll-v22', 'panel', '_stand.json'));
  panelEnde = st.letzterVollTag;
  var i0 = kal.hIdx(panelEnde), i1 = kal.hIdx(R.ende), tage = [];
  var veraltet = {}; try { G.json(path.join(G.HIER, 't1-leser-veraltet.json')).reihen.forEach(function (v) { veraltet[v.reihe] = v.leserEnde; }); } catch (e) { veraltet = {}; }
  var lebendPanel = R.reihen.filter(function (r) { return r.letzterMinutentag > panelEnde; }).length;
  for (var i = i0; i < i1; i++) {
    var tag = kal.tage[i];
    tage.push({ tag: tag, handelstagNachPanelEnde: i - i0 + 1,
      reihenMitMinutenBisMindestens: R.reihen.filter(function (r) { return r.letzterMinutentag >= tag; }).length,
      davonImLeserSichtbar: R.reihen.filter(function (r) { return r.letzterMinutentag >= tag && !(veraltet[r.reihe] && veraltet[r.reihe] < tag); }).length,
      letzterMinutentagGenauHier: R.reihen.filter(function (r) { return r.letzterMinutentag === tag; }).length });
  }
  /* Aufwand: Dateien und Bytes des Jahres 2026 (nur die muessten fuer eine Verlaengerung neu gelesen werden) gegen alles */
  var man = G.manifest(), b26 = 0, n26 = 0, bAlle = 0, nAlle = 0, k26 = 0;
  R.reihen.forEach(function (r) { (man.jeOrdner[r.ordner] || []).forEach(function (e) { bAlle += e.bytes; nAlle++; if (e.jahr === 2026) { b26 += e.bytes; n26++; k26 += e.kerzen; } }); });
  var lauf = { teile: 4, sekundenJeTeil: 8100, prozessSekunden: 32333, dateien: 45107, gb: 122.8, quelle: 'PANEL-V22.md §4 (Vollbau 03.10.2026, Platte E: als Engpass)' };
  return { panelEnde: panelEnde, archivEnde: R.ende, handelstageDazwischen: i1 - i0, reihenMitMinutenNachPanelEnde: lebendPanel, tage: tage,
    aufwand: { dateienAlle: nAlle, gbAlle: Math.round(bAlle / 1e8) / 10, dateien2026: n26, gb2026: Math.round(b26 / 1e8) / 10, kerzen2026: k26,
      anteil2026: Math.round(1000 * b26 / bAlle) / 1000, vollbau: lauf,
      schaetzungNur2026Minuten: Math.round(lauf.sekundenJeTeil * (b26 / bAlle) / 60),
      neueZeilenGeschaetzt: tage.reduce(function (a, t) { return a + t.reihenMitMinutenBisMindestens; }, 0),
      panelMbHeute: 910, zeilenHeute: st.zeilen } };
}

function main() {
  var a = sucheVoll();
  a.treffer.forEach(function (t) {
    var e = EINORDNUNG[t.datei] || null;
    /* zwei Dateien tragen Treffer verschiedener Art: der eigene Ordner bzw. ein anderes Wort */
    if (t.datei === 'gdelt-abdeckung-2026-09-19/namenskarte.js' && !/Tafel\(/.test(t.text)) e = { art: /TICKERS/.test(t.text) ? 'eigen' : 'text' };
    if (t.datei === 'nachrichten-stimmung-tage-2026-09-19/messen.js' && !/Tafel\(/.test(t.text)) e = { art: 'text' };
    if (t.kommentar && e && e.art === 'panel') e = { art: 'text' };
    t.art = e ? e.art : 'NICHT EINGEORDNET'; t.urteil = e && e.urteil ? e.urteil : null; t.grund = e && e.grund ? e.grund : null;
  });
  var panel = a.treffer.filter(function (t) { return t.art === 'panel'; });
  var b = bilanzLeser();
  var c = minutenNachPanel();
  var Z = { stand: new Date().toISOString(),
    a: { dateienDurchsucht: a.dateien, treffer: a.treffer.length, jeArt: a.treffer.reduce(function (x, t) { x[t.art] = (x[t.art] || 0) + 1; return x; }, {}),
      stellenPanelV21: panel.length, dateienPanelV21: Object.keys(panel.reduce(function (x, t) { x[t.datei] = 1; return x; }, {})).length,
      jeUrteil: panel.reduce(function (x, t) { var k = t.urteil.split(' - ')[0]; x[k] = (x[k] || 0) + 1; return x; }, {}) },
    b: b.zahlen, c: { panelEnde: c.panelEnde, archivEnde: c.archivEnde, handelstageDazwischen: c.handelstageDazwischen, reihenMitMinutenNachPanelEnde: c.reihenMitMinutenNachPanelEnde, aufwand: c.aufwand } };
  G.schreibe('t6-zahlen.json', Z);
  G.schreibe('t6a-voll-stellen.json', { stand: Z.stand, muster: String(MUSTER), treffer: a.treffer });
  G.schreibe('t6b-bilanz-leser.json', { stand: Z.stand, hinweis: 'Nur Reihen mit mehreren Abschnitten oder geaenderter Zuordnung. cikV22 = was fundamental-lesen.js fuer den v2.2-Namen findet; polygonCik = Inhaber des Kuerzels nach der Luecke laut reihen-abschnitte.json.', zahlen: b.zahlen, reihen: b.reihen, paare: b.paare });
  G.schreibe('t6c-minuten-nach-panel.json', c);
  var M = [];
  M.push('### T6a - Stellen mit Panel v2.1 als fester Vorgabe', '', '| Datei | Zeile | Urteil | Begruendung |', '|---|---|---|---|');
  panel.forEach(function (t) { M.push('| `' + t.datei + '` | ' + t.zeile + ' | ' + t.urteil + ' | ' + t.grund + ' |'); });
  M.push('', '### T6b - Abschnitte, deren Firma laut Polygon-Inhaber nicht passt (alle)', '', '| Panel-Reihe v2.2 | Abschnitt | von | bis | CIK des Lesers | CIK laut Polygon | Filings des Lesers im Abschnitt |', '|---|---|---|---|---|---|---|');
  b.reihen.filter(function (z) { return z.widerspricht; }).sort(function (x, y) { return y.filingsImAbschnitt - x.filingsImAbschnitt || (x.reihe < y.reihe ? -1 : 1); }).forEach(function (z) { M.push('| ' + [z.reihe, z.abschnittNr, z.von, z.bis, z.cikV22, z.polygonCik.join('/'), z.filingsImAbschnitt].join(' | ') + ' |'); });
  M.push('', '### T6b - Reihen ohne Firma (alle)', '', b.reihen.filter(function (z) { return z.urteil === 'keine (v2.1 hatte eine)'; }).map(function (z) { return z.reihe + ' (v2.1: ' + z.reiheV21 + ', CIK ' + z.cikV21 + ')'; }).join(', '));
  M.push('', '### T6c - Minuten nach dem Panel-Ende', '', '| Handelstag | Nr. | Aktienreihen mit Minuten bis mindestens hier | davon im Leser sichtbar | Reihen, die genau hier enden |', '|---|---|---|---|---|');
  c.tage.forEach(function (t) { M.push('| ' + [t.tag, t.handelstagNachPanelEnde, t.reihenMitMinutenBisMindestens, t.davonImLeserSichtbar, t.letzterMinutentagGenauHier].join(' | ') + ' |'); });
  fs.writeFileSync(path.join(G.HIER, 'teile', 't6.md'), M.join('\n') + '\n');
  console.log('T6a:', JSON.stringify(Z.a));
  console.log('  nicht eingeordnet:', a.treffer.filter(function (t) { return t.art === 'NICHT EINGEORDNET'; }).map(function (t) { return t.datei + ':' + t.zeile; }).join(' ') || 'keine');
  console.log('T6b:', JSON.stringify(Z.b));
  console.log('T6c:', JSON.stringify(Z.c));
  console.log('  Tage:', c.tage.map(function (t) { return t.tag.slice(5) + ':' + t.reihenMitMinutenBisMindestens + '/' + t.davonImLeserSichtbar; }).join(' '));
}

module.exports = { MUSTER: MUSTER };
if (require.main === module) main();
