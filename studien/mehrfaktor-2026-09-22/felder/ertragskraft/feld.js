'use strict';
/* FELD 6 der Mehrfaktor-Studie: Ertragskraft (Auftrag Nr. 54, 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md §4 Zeile 6 in der
 * Fassung mit Nachtrag §11 (1)). Rolle: Signal, Gewicht 1.
 *
 * Rohgroesse je Symbol am Signaltag t (juengstes 10-K/10-Q mit filed strikt vor t, Aktualitaets-Tor 456 Tage - beides macht
 * der Leser hinter sicht.fundamentalAm):
 *
 *   ((roh.umsatz - roh.umsatzkosten) * 4 / roh.qtrs) / roh.vermoegen
 *
 * Bruttogewinn DES FILINGS auf Jahresrate (10-K: qtrs 4 => Faktor 1; 10-Q: qtrs 1 => Faktor 4) durch das Vermoegen am
 * Stichtag D0 (Bestand). Hoeher = besser (Novy-Marx 2013, gross profitability). Verhaeltnis, keine Einheit.
 * Warum roh statt summe4q: die Tafel bildet 4-Quartals-Summen nur fuer umsatz/netto/operativ, nicht fuer umsatzkosten
 * (Nachtrag §11 (1)); Saisonalitaet der x4-Werte ist eine bekannte Grenze, kein Fehler.
 *
 * null (nie 0), wenn: keine Panelzeile am Signaltag; kein Filing; umsatz, umsatzkosten oder vermoegen nicht ausgewiesen;
 * vermoegen <= 0; qtrs weder 1 noch 4. Negativer Bruttogewinn ist ein Wert.
 *
 * Zaehler (nur zaehlen, nie einen Wert aendern): je Lesetag+Symbol genau einmal, getrennt nach "Signaltag = Lesetag"
 * (Hauptlauf und gleichtaegige Kontrollen) und "Lesetag verschoben" (Placebo Versatz); Null-Gruende, Sektor der Filings ohne
 * umsatzkosten, qtrs-Anteil je Jahr, Rohwerte fuer Quantile je qtrs. Ausgabe als eine JSON-Zeile "ZAEHLER ertragskraft ..." beim
 * Prozessende (die Maschine ruft werte mehrfach: Hauptlauf + Kontrollen).
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/ertragskraft/feld.js
 *
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var gesehen = Object.create(null);          /* "lesetag|sym" -> true: jedes Paar zaehlt einmal, egal wie oft die Maschine fragt */
var Z = { aufrufe: 0, paare: 0, haupt: { n: 0, wert: 0, exaktNull: 0, negativ: 0, grund: {}, qtrsJeJahr: {}, sektorOhneUmsatzkosten: {}, sektorMitWert: {}, werte: { q1: [], q4: [] }, werteJeSektor: {} },
  versatz: { n: 0, wert: 0, grund: {} } };

function zahl(x) { return (typeof x === 'number' && isFinite(x)) ? x : null; }
function plus(o, k) { o[k] = (o[k] || 0) + 1; }

module.exports = {
  feld: 'ertragskraft',
  definition: '((roh.umsatz - roh.umsatzkosten) * 4 / roh.qtrs) / roh.vermoegen des juengsten Filings (filed < Signaltag): Bruttogewinn des Filings auf Jahresrate durch Vermoegen D0, Verhaeltnis, hoeher = besser; null wenn umsatz/umsatzkosten/vermoegen fehlt, vermoegen <= 0 oder qtrs nicht 1/4',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {
    Z.aufrufe++;
    var lese = sicht.iso, schl = lese + '|' + sym, neu = !gesehen[schl];
    if (neu) { gesehen[schl] = true; Z.paare++; }
    var K = (sicht.periode && sicht.periode.iso !== lese) ? Z.versatz : Z.haupt;
    if (neu) K.n++;
    var z = sicht.zeileAm(sym);
    if (z < 0) { if (neu) plus(K.grund, 'keineZeile'); return null; }
    var f = sicht.fundamentalAm(sym, lese);                       /* genau ein Bilanzzugriff, Tag = Lesetag der Sicht */
    if (!f || !f.roh) { if (neu) plus(K.grund, 'keinFiling'); return null; }
    var r = f.roh, u = zahl(r.umsatz), k = zahl(r.umsatzkosten), v = zahl(r.vermoegen), q = zahl(r.qtrs);
    if (neu && K === Z.haupt && k === null) plus(K.sektorOhneUmsatzkosten, f.sektor || '(ohne)');
    var grund = (u === null) ? 'umsatzNull' : (k === null) ? 'umsatzkostenNull' : (v === null) ? 'vermoegenNull'
      : (v <= 0) ? 'vermoegenNichtPositiv' : (q !== 1 && q !== 4) ? 'qtrs' + q : null;
    if (grund) { if (neu) plus(K.grund, grund); return null; }
    var w = ((u - k) * 4 / q) / v;
    if (!isFinite(w)) { if (neu) plus(K.grund, 'nichtEndlich'); return null; }
    if (neu) {
      K.wert++;
      if (K === Z.haupt) {
        var sek = f.sektor || '(ohne)';
        plus(K.sektorMitWert, sek);
        (K.werteJeSektor[sek] = K.werteJeSektor[sek] || []).push(w);
        if (w === 0) K.exaktNull++; else if (w < 0) K.negativ++;
        var j = lese.slice(0, 4); K.qtrsJeJahr[j] = K.qtrsJeJahr[j] || { q1: 0, q4: 0 }; K.qtrsJeJahr[j][q === 1 ? 'q1' : 'q4']++;
        K.werte[q === 1 ? 'q1' : 'q4'].push(w);
      }
    }
    return w;
  },
};

process.on('exit', function () {
  function quantile(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; }), o = { n: s.length };
    [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99].forEach(function (p) { o['p' + Math.round(p * 100)] = +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(4); });
    o.min = +s[0].toFixed(4); o.max = +s[s.length - 1].toFixed(4);
    return o;
  }
  var h = Z.haupt, jeSektor = {};
  Object.keys(h.werteJeSektor).forEach(function (s) { var qs = quantile(h.werteJeSektor[s]); jeSektor[s] = { n: qs.n, p10: qs.p10, p50: qs.p50, p90: qs.p90 }; });
  var aus = { aufrufe: Z.aufrufe, paare: Z.paare,
    haupt: { n: h.n, wert: h.wert, exaktNull: h.exaktNull, negativ: h.negativ, grund: h.grund, qtrsJeJahr: h.qtrsJeJahr, sektorOhneUmsatzkosten: h.sektorOhneUmsatzkosten, sektorMitWert: h.sektorMitWert,
      quantile: { q1: quantile(h.werte.q1), q4: quantile(h.werte.q4) }, quantileJeSektor: jeSektor },
    versatz: { n: Z.versatz.n, wert: Z.versatz.wert, grund: Z.versatz.grund } };
  process.stdout.write('ZAEHLER ertragskraft ' + JSON.stringify(aus) + '\n');
});
