'use strict';
/* Auswertung der Modul-Zaehler von felder/fue/feld.js bzw. feld-marktwert.js zusammen mit der Zelle der Maschine
 * (Auftrag Nr. 57 §1a.6, §1b: Abdeckung je Sektor, Klasse und Jahr; Null-Gruende; qtrs; ausgewiesene Nullen; Quantile;
 * Sektormix des Dezils oben). Aufruf aus studien/mehrfaktor-2026-09-22:
 *
 *   node --max-old-space-size=6144 zelle.js --feld felder/fue/feld.js 2> <stderr-datei>     (Zaehlerzeile "ZAEHLER-FUE {...}")
 *   node felder/fue/zaehler-auswerten.js --zelle zellen/fue.json --zaehler <stderr-datei> --marke ZAEHLER-FUE
 *   (nachrichtliche Zelle: zellen/fue-marktwert.json, Marke ZAEHLER-FUE-MARKTWERT)
 *
 * Nur Zaehlen und Quantile der Rohwerte - keine Statistik, kein Rang fuer eine Messung. Das "Dezil oben" unten ist ein
 * NACHGEBILDETER Ausschnitt fuer den Sektormix (oberste 10 % der Ausweiser je Signaltag nach Rohwert, Gleichstaende
 * ignoriert); das Dezil der Messung bildet die Maschine selbst. Schreibt Markdown auf stdout.
 */
var fs = require('fs');
var A = {}, argv = process.argv.slice(2);
for (var ai = 0; ai < argv.length; ai += 2) A[argv[ai].replace(/^--/, '')] = argv[ai + 1];
var zelle = JSON.parse(fs.readFileSync(A.zelle, 'utf8')), marke = A.marke || 'ZAEHLER-FUE';
var zeilen = fs.readFileSync(A.zaehler, 'utf8').split('\n').filter(function (l) { return l.indexOf(marke + ' ') === 0; });
if (zeilen.length !== 1) throw new Error('Zaehlerzeile "' + marke + '" nicht genau einmal in ' + A.zaehler + ': ' + zeilen.length);
var Z = JSON.parse(zeilen[0].slice(marke.length + 1));

var tage = zelle.signaltage, tagSet = {}, wertVon = {};
tage.forEach(function (s) { tagSet[s.tag] = 1; wertVon[s.tag] = s.werte; });
var E = [], fremdeTage = {}, fremdeSymbole = 0;
Object.keys(Z.karte).forEach(function (k) {
  var p = k.indexOf('|'), tag = k.slice(0, p), sym = k.slice(p + 1);
  if (!tagSet[tag]) { fremdeTage[tag] = (fremdeTage[tag] || 0) + 1; return; }
  /* Placebo Versatz liest mit dem ALTEN Universum am Tag t + 21; faellt der auf den naechsten Signaltag, stehen Symbole
   * in der Karte, die dort nicht Universumsmitglied sind - die gehoeren nicht in die Abdeckung der Zelle. */
  if (!(sym in wertVon[tag])) { fremdeSymbole++; return; }
  var t = Z.karte[k].split('|');
  E.push({ tag: tag, jahr: tag.slice(0, 4), sym: sym, grund: t[0], sektor: t[1] || '(kein Filing)', klasse: t[2], form: t[3], qtrs: t[4], fue0: t[5] === 'fue0', fb: t[6] });
});
/* Abgleich Zaehler <-> Zelle: je Signaltag gleiche Symbole, "wert" genau dort, wo die Zelle einen Wert traegt */
var abw = 0, symbolTage = 0, karteOhneZelle = 0;
tage.forEach(function (s) { symbolTage += Object.keys(s.werte).length; });
E.forEach(function (e) { var w = wertVon[e.tag]; if (!(e.sym in w)) { karteOhneZelle++; return; } if ((w[e.sym] !== null) !== (e.grund === 'wert')) abw++; });

function pz(x) { return (100 * x).toFixed(1) + ' %'; }
function tab(kopf, zeilen) { console.log('| ' + kopf.join(' | ') + ' |'); console.log('|' + kopf.map(function (k, i) { return i ? '---:' : '---'; }).join('|') + '|'); zeilen.forEach(function (z) { console.log('| ' + z.join(' | ') + ' |'); }); console.log(''); }
function zaehl(liste, key) { var o = {}; liste.forEach(function (e) { var k = key(e); o[k] = (o[k] || 0) + 1; }); return o; }
function quantil(sorted, p) { if (!sorted.length) return NaN; var x = p * (sorted.length - 1), i = Math.floor(x), f = x - i; return i + 1 < sorted.length ? sorted[i] * (1 - f) + sorted[i + 1] * f : sorted[i]; }
function f4(x) { return (x === x) ? x.toFixed(4) : '—'; }

console.log('### Zaehler des Moduls `' + Z.feld + '` (aus der Zaehlerzeile, ausgewertet mit zaehler-auswerten.js)\n');
console.log('**Alle Aufrufe der Maschine (Hauptlauf + Kontrollen):** ' + Z.aufrufe + ' Aufrufe; Gruende: ' +
  Object.keys(Z.gruende).sort().map(function (g) { return g + ' ' + Z.gruende[g]; }).join(', ') + '. Tage ausserhalb der ' +
  tage.length + ' Signaltage in der Karte (Placebo Versatz): ' + Object.keys(fremdeTage).length + ' Tage, ' +
  Object.keys(fremdeTage).reduce(function (a, t) { return a + fremdeTage[t]; }, 0) + ' Symbol-Tage.\n');
console.log('**Abgleich mit der Zelle:** Symbol-Tage der Zelle ' + symbolTage + ', Karteneintraege im Zellen-Universum ' + E.length +
  ' (Eintraege ausserhalb des Universums des Tags, Placebo Versatz mit t + 21 = naechster Signaltag: ' + fremdeSymbole +
  ', ausgeschlossen), ohne Zellenwert ' + karteOhneZelle + ', Widersprueche (Wert/kein Wert) ' + abw + '.\n');

/* Null-Gruende ueber die Signaltage */
var gr = zaehl(E, function (e) { return e.grund; });
console.log('**Null-Gruende ueber die ' + tage.length + ' Signaltage (je Symbol-Tag einmal):**\n');
tab(['Grund', 'Symbol-Tage', 'Anteil'], Object.keys(gr).sort(function (a, b) { return gr[b] - gr[a]; }).map(function (g) { return [g, gr[g], pz(gr[g] / E.length)]; }));

/* Klassen: Rohwert der Panelspalte -> Name der Maschine (Paarung nach Groesse) */
var kg = zelle.abdeckung.gesamt, namen = Object.keys(kg).filter(function (k) { return k !== 'gesamt'; }).sort(function (a, b) { return kg[b].n - kg[a].n; });
var kr = zaehl(E, function (e) { return e.klasse; }), roh = Object.keys(kr).sort(function (a, b) { return kr[b] - kr[a]; });
var klName = {}; roh.forEach(function (r, i) { klName[r] = namen[i] || ('klasse ' + r); });
console.log('**Klassen** (Panelspalte `klasse` -> Name der Maschine, gepaart nach Groesse; Zahlen muessen mit der Abdeckungstafel der Maschine uebereinstimmen): ' +
  roh.map(function (r) { return r + ' -> ' + klName[r] + ' (' + kr[r] + ' Symbol-Tage, Maschine ' + (kg[klName[r]] ? kg[klName[r]].n : '?') + ')'; }).join('; ') + '\n');

/* Abdeckung je Sektor (Symbol-Tage mit Filing) */
var mitF = E.filter(function (e) { return e.grund !== 'keinFiling' && e.grund !== 'keineZeile'; });
var werte = E.filter(function (e) { return e.grund === 'wert'; });
var sekN = zaehl(mitF, function (e) { return e.sektor; }), sekW = zaehl(werte, function (e) { return e.sektor; });
var sektoren = Object.keys(sekN).sort(function (a, b) { return sekN[b] - sekN[a]; });
console.log('**Abdeckung je Sektor** (Symbol-Tage mit Filing; "mit Wert" = die Zelle traegt eine Zahl; letzte Spalte = Anteil des Sektors an allen Ausweisern):\n');
tab(['Sektor', 'mit Filing', 'mit Wert', 'Anteil', 'an Ausweisern'], sektoren.map(function (s) { return [s, sekN[s], sekW[s] || 0, pz((sekW[s] || 0) / sekN[s]), pz((sekW[s] || 0) / werte.length)]; })
  .concat([['**alle mit Filing**', mitF.length, werte.length, pz(werte.length / mitF.length), '100 %'], ['(kein Filing / Tor)', gr.keinFiling || 0, 0, '—', '—'], ['(keine Panelzeile)', gr.keineZeile || 0, 0, '—', '—']]));

/* Sektor x Jahr und Sektor x Klasse: Anteil mit Wert unter den Symbol-Tagen mit Filing */
var jahre = Object.keys(zaehl(E, function (e) { return e.jahr; })).sort();
function kreuz(titel, spalten, keyFn) {
  console.log('**' + titel + '** (Anteil mit Wert unter den Symbol-Tagen mit Filing; in Klammern die Ausweiser):\n');
  tab(['Sektor'].concat(spalten), sektoren.map(function (s) {
    return [s].concat(spalten.map(function (sp) { var n = 0, m = 0; mitF.forEach(function (e) { if (e.sektor === s && keyFn(e) === sp) { n++; if (e.grund === 'wert') m++; } }); return n ? pz(m / n) + ' (' + m + ')' : '—'; }));
  }).concat([['**alle**'].concat(spalten.map(function (sp) { var n = 0, m = 0; mitF.forEach(function (e) { if (keyFn(e) === sp) { n++; if (e.grund === 'wert') m++; } }); return n ? pz(m / n) + ' (' + m + ')' : '—'; }))]));
}
kreuz('Sektor x Jahr', jahre, function (e) { return e.jahr; });
kreuz('Sektor x Klasse', roh.map(function (r) { return klName[r]; }), function (e) { return klName[e.klasse]; });

/* Form, qtrs, ausgewiesene Nullen, Ausweichtags */
var fo = zaehl(werte, function (e) { return e.form + ' (qtrs ' + e.qtrs + ')'; });
console.log('**Filing-Form und qtrs unter den Ausweisern:** ' + Object.keys(fo).sort().map(function (k) { return k + ' ' + fo[k] + ' (' + pz(fo[k] / werte.length) + ')'; }).join('; ') + '.\n');
var n0 = werte.filter(function (e) { return e.fue0; }), s0 = {}; n0.forEach(function (e) { s0[e.sym] = 1; });
console.log('**Ausgewiesenes F&E = 0 (Wert 0, kein null):** ' + n0.length + ' Symbol-Tage, ' + Object.keys(s0).length + ' Symbole' + (n0.length ? ' (' + Object.keys(s0).slice(0, 12).join(', ') + (Object.keys(s0).length > 12 ? ', …' : '') + ')' : '') + '.\n');
if (werte.length && werte[0].fb !== undefined && werte.some(function (e) { return e.fb !== ''; })) {
  var fb = zaehl(werte, function (e) { return e.fb; }), fbName = { 0: 'dei-Deckblatt', 1: 'CommonStockSharesOutstanding', 2: 'gewichtet basic', 3: 'gewichtet verwaessert', 4: 'Issued' };
  console.log('**Aktienzahl-Tag unter den Ausweisern (`marken.aktienFallback`):** ' + Object.keys(fb).sort().map(function (k) { return k + ' = ' + (fbName[k] || '?') + ' ' + fb[k] + ' (' + pz(fb[k] / werte.length) + ')'; }).join('; ') + '.\n');
}

/* Verteilung der Rohwerte je Jahr */
console.log('**Verteilung der Rohwerte je Jahr** (alle Symbol-Tage mit Wert; nichts gekappt):\n');
var vz = [], alle = [];
jahre.forEach(function (j) {
  var v = []; tage.forEach(function (s) { if (s.tag.slice(0, 4) !== j) return; Object.keys(s.werte).forEach(function (sym) { if (s.werte[sym] !== null) v.push(s.werte[sym]); }); });
  v.sort(function (a, b) { return a - b; }); alle = alle.concat(v);
  var ue1 = v.filter(function (x) { return x > 1; }).length, neg = v.filter(function (x) { return x < 0; }).length;
  vz.push([j, v.length, f4(quantil(v, 0.05)), f4(quantil(v, 0.25)), f4(quantil(v, 0.5)), f4(quantil(v, 0.75)), f4(quantil(v, 0.95)), f4(v.length ? v[v.length - 1] : NaN), ue1 + ' (' + pz(v.length ? ue1 / v.length : 0) + ')', neg]);
});
alle.sort(function (a, b) { return a - b; });
vz.push(['**alle**', alle.length, f4(quantil(alle, 0.05)), f4(quantil(alle, 0.25)), f4(quantil(alle, 0.5)), f4(quantil(alle, 0.75)), f4(quantil(alle, 0.95)), f4(alle.length ? alle[alle.length - 1] : NaN), alle.filter(function (x) { return x > 1; }).length + ' (' + pz(alle.length ? alle.filter(function (x) { return x > 1; }).length / alle.length : 0) + ')', alle.filter(function (x) { return x < 0; }).length]);
tab(['Jahr', 'n', 'Q05', 'Q25', 'Median', 'Q75', 'Q95', 'Max', '> 1', '< 0'], vz);

/* Dezil oben, nachgebildet: oberste 10 % der Ausweiser je Signaltag nach Rohwert (Gleichstaende ignoriert) */
var sekVon = {}; E.forEach(function (e) { sekVon[e.tag + '|' + e.sym] = e.sektor; });
var dez = [], groessen = [], grenzen = {}, ausweiser = [];
tage.forEach(function (s) {
  var v = Object.keys(s.werte).filter(function (sym) { return s.werte[sym] !== null; }).map(function (sym) { return { sym: sym, w: s.werte[sym] }; });
  v.sort(function (a, b) { return b.w - a.w; }); ausweiser.push(v.length);
  var k = Math.round(v.length / 10); if (!k) return; var top = v.slice(0, k); groessen.push(k);
  var j = s.tag.slice(0, 4); (grenzen[j] = grenzen[j] || []).push(top[k - 1].w);
  top.forEach(function (e) { dez.push({ tag: s.tag, sym: e.sym, w: e.w, sektor: sekVon[s.tag + '|' + e.sym] || '?' }); });
});
var dS = zaehl(dez, function (e) { return e.sektor; }), aS = zaehl(werte, function (e) { return e.sektor; });
console.log('**Dezil oben, nachgebildet** (oberste 10 % der Ausweiser je Signaltag nach Rohwert, Gleichstaende ignoriert - nur fuer den Sektormix; das Dezil der Messung bildet die Maschine): Ausweiser je Signaltag min/median/max ' +
  Math.min.apply(null, ausweiser) + '/' + quantil(ausweiser.slice().sort(function (a, b) { return a - b; }), 0.5) + '/' + Math.max.apply(null, ausweiser) + '; Mitglieder je Signaltag min/max ' + Math.min.apply(null, groessen) + '/' + Math.max.apply(null, groessen) +
  '; Mitglieder mit Rohwert > 1: ' + pz(dez.filter(function (e) { return e.w > 1; }).length / dez.length) + '.\n');
tab(['Sektor', 'Dezil oben (Mitglied-Tage)', 'Anteil im Dezil', 'Anteil unter allen Ausweisern'], Object.keys(dS).sort(function (a, b) { return dS[b] - dS[a]; }).map(function (s) { return [s, dS[s], pz(dS[s] / dez.length), pz((aS[s] || 0) / werte.length)]; }));
console.log('**Untere Grenze des Dezils oben je Jahr** (kleinster Rohwert im nachgebildeten Dezil, Median ueber die Signaltage des Jahres):\n');
tab(['Jahr', 'Grenze (Median)', 'min', 'max'], Object.keys(grenzen).sort().map(function (j) { var v = grenzen[j].slice().sort(function (a, b) { return a - b; }); return [j, f4(quantil(v, 0.5)), f4(v[0]), f4(v[v.length - 1])]; }));
