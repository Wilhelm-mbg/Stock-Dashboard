'use strict';
/* KERNPRUEFUNG der Panel-Reparatur (18.09.2026, Auftrag §3): Panel v1 gegen v2.
 *
 *  1. Die 17 Sprungtage (|Rendite| > 100 % in Klassen 1-3, diagnose-spruenge-teil4.json): sechs Artefakte muessen weg
 *     sein (|r| < 20 %), sieben echte BITGLEICH bleiben, vier weitere werden eingeordnet.
 *  2. Alle Tage mit |Rendite| > 50 % in Klassen 1-3 im v2-Panel, je Zeile mit maschinellem Hinweis (Split am Tag,
 *     MASSNAHME_NAH, letzter Tag, Nachfolger) - der Grund im Klartext steht in der Uebergabe.
 *  3. Vollvergleich: welche Zeilen (Reihe, Tag) haben sich in rendite / faktor / rohSchluss / marken / klasse geaendert,
 *     wie viele Reihen sind betroffen, wie viele Zeilen sind neu (S~2) - alles andere muss bitgleich sein.
 *
 * Aufruf: node --max-old-space-size=8192 pruefung-spruenge-v2.js [--v1 voll/panel-v1] [--v2 voll/panel]
 * Schreibt pruefung-spruenge-v2.json. NUR LESEN.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');

var A = { v1: 'voll/panel-v1', v2: 'voll/panel' };
for (var i = 2; i < process.argv.length; i++) { if (process.argv[i] === '--v1') A.v1 = process.argv[++i]; else if (process.argv[i] === '--v2') A.v2 = process.argv[++i]; }

var kal = K.kalender();
var DS = JSON.parse(fs.readFileSync(path.join(__dirname, 'diagnose-spruenge-teil4.json'), 'utf8'));
var ARTEFAKTE = { 'GE|2021-08-02': 'Rueckwaerts 1:8', 'HRI|2016-07-01': 'Zusammenlegung 1:15 (Quelle: unter HTZ, nicht reparierbar)', 'DD|2019-06-03': 'Rueckwaerts 10000:4725',
  'OVV|2020-01-27': 'Zusammenlegung 1:5 (Quelle: kein Split-Satz, nicht reparierbar)', 'AMC|2023-08-24': 'Rueckwaerts 1:10', 'HCP|2021-12-09': 'Kuerzel neu vergeben (HashiCorp)' };
var ECHTE = { 'GME|2021-01-27': 1, 'GME|2021-02-24': 1, 'AMC|2021-01-27': 1, 'AMC|2021-06-02': 1, 'CAR|2021-11-02': 1, 'VKTX|2024-02-27': 1, 'MRNA|2026-08-19': 1 };

function lade(ordner, kennung) {
  var p = P.ladePanel(null, { ordner: ordner, kennung: kennung });
  var name = p.stand.symbole.map(function (s) { return s.reihe; }), idx = {}; name.forEach(function (n, i) { idx[n] = i; });
  return { p: p, name: name, idx: idx, stand: p.stand };
}
var V1 = lade(A.v1, K.PANEL_KENNUNG_V1), V2 = lade(A.v2, K.PANEL_KENNUNG);
process.stdout.write('v1 ' + V1.stand.zeilen + ' Zeilen, ' + V1.name.length + ' Reihen | v2 ' + V2.stand.zeilen + ' Zeilen, ' + V2.name.length + ' Reihen\n');

/** Zeile (reihe, tag) in einem Panel: {jahr, i} oder null; bei v2 auch der Nachfolger S~2. */
function finde(V, reihe, tag) {
  var kandidaten = [reihe, reihe + '~2', reihe + '~3'];
  for (var c = 0; c < kandidaten.length; c++) {
    var s = V.idx[kandidaten[c]]; if (s === undefined) continue;
    var b = V.p.jahre[+tag.slice(0, 4)]; if (!b) continue;
    var ti = kal.idx[tag];
    for (var i = 0; i < b.n; i++) if (b.tag[i] === ti && b.sym[i] === s) return { b: b, i: i, reihe: kandidaten[c] };
  }
  return null;
}
function zeile(z) { return z ? { reihe: z.reihe, rendite: z.b.rendite[z.i], roh: z.b.rohSchluss[z.i], faktor: z.b.faktor[z.i], marken: z.b.marken[z.i], klasse: z.b.klasse[z.i] } : null; }

/* ---------- 1. Die 17 Sprungtage ---------- */
var sprung = DS.sprungtage.top40.filter(function (s) { return Math.abs(s.rendite) > 100; });
var tafel = [], fehler = [];
sprung.forEach(function (s) {
  var key = s.kuerzel + '|' + s.tag, a = zeile(finde(V1, s.kuerzel, s.tag)), b = zeile(finde(V2, s.kuerzel, s.tag));
  var art = ARTEFAKTE[key] ? 'Artefakt' : ECHTE[key] ? 'echt' : 'weitere';
  var urteil = null;
  if (art === 'Artefakt') urteil = (b && Math.abs(b.rendite) < 20) ? 'weg' : (b && !(b.rendite === b.rendite)) ? 'weg (keine Rendite: Reihenanfang)' : 'BLEIBT';
  if (art === 'echt') urteil = (a && b && a.rendite === b.rendite && a.roh === b.roh && a.faktor === b.faktor && a.marken === b.marken && a.klasse === b.klasse) ? 'bitgleich' : 'GEAENDERT';
  if (art === 'Artefakt' && urteil === 'BLEIBT') fehler.push(key + ' bleibt: ' + (b ? b.rendite.toFixed(1) : 'fehlt'));
  if (art === 'echt' && urteil !== 'bitgleich') fehler.push(key + ' geaendert');
  tafel.push({ tag: s.tag, reihe: s.kuerzel, klasse: s.klasse, art: art, grund: ARTEFAKTE[key] || null, v1: a, v2: b, urteil: urteil });
});
process.stdout.write('\n== 17 Sprungtage vorher/nachher ==\n');
tafel.forEach(function (t) { process.stdout.write('  ' + t.tag + ' ' + t.reihe + ' K' + t.klasse + ' ' + t.art + ': v1 ' + (t.v1 ? t.v1.rendite.toFixed(2) : '-') + ' % -> v2 ' + (t.v2 ? (t.v2.reihe !== t.reihe ? t.v2.reihe + ' ' : '') + t.v2.rendite.toFixed(2) : 'fehlt') + ' % (faktor ' + (t.v2 ? t.v2.faktor.toFixed(4) : '-') + ', marken ' + (t.v2 ? t.v2.marken : '-') + ') ' + (t.urteil || '') + '\n'); });

/* ---------- 3. Vollvergleich (Merge-Join je Jahr ueber (tag, Name)) ---------- */
var map12 = new Int32Array(V1.name.length); for (var m = 0; m < V1.name.length; m++) map12[m] = V2.idx[V1.name[m]] === undefined ? -1 : V2.idx[V1.name[m]];
var voll = { gemeinsam: 0, nurV1: 0, nurV2: 0, renditeAnders: 0, faktorAnders: 0, rohAnders: 0, markenAnders: 0, klasseAnders: 0, reihenMitRenditeAnders: {}, reihenMitFaktorAnders: {}, nurV2Reihen: {}, nurV1Reihen: {} };
Object.keys(V2.p.jahre).forEach(function (j) {
  var a = V1.p.jahre[j], b = V2.p.jahre[j]; if (!a) { voll.nurV2 += b.n; return; }
  var ia = 0, ib = 0;
  while (ia < a.n || ib < b.n) {
    var ka = ia < a.n ? a.tag[ia] * 100000 + map12[a.sym[ia]] : Infinity, kb = ib < b.n ? b.tag[ib] * 100000 + b.sym[ib] : Infinity;
    if (ia < a.n && map12[a.sym[ia]] < 0) { voll.nurV1++; voll.nurV1Reihen[V1.name[a.sym[ia]]] = 1; ia++; continue; }
    if (ka === kb) {
      voll.gemeinsam++;
      if (!(a.rendite[ia] === b.rendite[ib]) && !(a.rendite[ia] !== a.rendite[ia] && b.rendite[ib] !== b.rendite[ib])) { voll.renditeAnders++; voll.reihenMitRenditeAnders[V2.name[b.sym[ib]]] = (voll.reihenMitRenditeAnders[V2.name[b.sym[ib]]] || 0) + 1; }
      if (a.faktor[ia] !== b.faktor[ib]) { voll.faktorAnders++; voll.reihenMitFaktorAnders[V2.name[b.sym[ib]]] = 1; }
      if (a.rohSchluss[ia] !== b.rohSchluss[ib]) voll.rohAnders++;
      if (a.marken[ia] !== b.marken[ib]) voll.markenAnders++;
      if (a.klasse[ia] !== b.klasse[ib]) voll.klasseAnders++;
      ia++; ib++;
    } else if (ka < kb) { voll.nurV1++; voll.nurV1Reihen[V1.name[a.sym[ia]]] = 1; ia++; }
    else { voll.nurV2++; voll.nurV2Reihen[V2.name[b.sym[ib]]] = (voll.nurV2Reihen[V2.name[b.sym[ib]]] || 0) + 1; ib++; }
  }
});
voll.reihenMitRenditeAndersN = Object.keys(voll.reihenMitRenditeAnders).length;
voll.reihenMitFaktorAndersN = Object.keys(voll.reihenMitFaktorAnders).length;
voll.nurV2ReihenN = Object.keys(voll.nurV2Reihen).length; voll.nurV1ReihenN = Object.keys(voll.nurV1Reihen).length;
process.stdout.write('\n== Vollvergleich ==\n  gemeinsame Zeilen ' + voll.gemeinsam + ' | nur v1 ' + voll.nurV1 + ' (' + voll.nurV1ReihenN + ' Reihen) | nur v2 ' + voll.nurV2 + ' (' + voll.nurV2ReihenN + ' Reihen, Nachfolger)\n' +
  '  rendite anders ' + voll.renditeAnders + ' Zeilen in ' + voll.reihenMitRenditeAndersN + ' Reihen | faktor anders ' + voll.faktorAnders + ' in ' + voll.reihenMitFaktorAndersN + ' Reihen | roh anders ' + voll.rohAnders + ' | marken anders ' + voll.markenAnders + ' | klasse anders ' + voll.klasseAnders + '\n');

/* ---------- 2. Alle |r| > 50 % in Klassen 1-3 (v2) mit Hinweis; dazu dieselbe Zahl in v1 ---------- */
function liste(V, mitHinweis) {
  var aus = [];
  Object.keys(V.p.jahre).forEach(function (j) {
    var b = V.p.jahre[j];
    for (var i = 0; i < b.n; i++) {
      if (b.klasse[i] < 1 || !(Math.abs(b.rendite[i]) > 50)) continue;
      var e = { tag: kal.tage[b.tag[i]], reihe: V.name[b.sym[i]], klasse: b.klasse[i], rendite: b.rendite[i], faktor: b.faktor[i], marken: b.marken[i] };
      if (mitHinweis) {
        var h = [];
        /* Split am Tag: faktor der Vorzeile (gleiche Reihe, vorheriger Tag im Block) ungleich */
        var v = -1; for (var q = i - 1; q >= Math.max(0, i - 20000); q--) if (b.sym[q] === b.sym[i]) { v = q; break; }
        if (v >= 0 && b.faktor[v] !== b.faktor[i]) h.push('Split am Tag (faktor ' + b.faktor[v].toFixed(4) + ' -> ' + b.faktor[i].toFixed(4) + ')');
        if (b.marken[i] & K.M_MASSNAHME_NAH) h.push('MASSNAHME_NAH');
        if (b.marken[i] & K.M_LETZTER_TAG) h.push('letzter Tag');
        if (b.marken[i] & K.M_STEMPEL_TAG) h.push('Stempeltag');
        if (/~[23]$/.test(e.reihe)) h.push('Nachfolger-Reihe');
        var z1 = finde(V1, e.reihe.replace(/~[23]$/, ''), e.tag); e.v1 = z1 ? z1.b.rendite[z1.i] : null;
        e.hinweis = h.join('; ');
      }
      aus.push(e);
    }
  });
  aus.sort(function (x, y) { return Math.abs(y.rendite) - Math.abs(x.rendite); });
  return aus;
}
var l2 = liste(V2, true), l1 = liste(V1, false);
process.stdout.write('\n== |Rendite| > 50 % in Klassen 1-3: v1 ' + l1.length + ' Tage, v2 ' + l2.length + ' Tage ==\n');
l2.forEach(function (e) { process.stdout.write('  ' + e.tag + ' ' + e.reihe + ' K' + e.klasse + ' ' + e.rendite.toFixed(1) + ' % (v1 ' + (e.v1 == null ? '-' : e.v1.toFixed(1)) + ') ' + e.hinweis + '\n'); });

var out = { kennung: 'querschnitt-pruefstand-2026-09-13/panel/v2/pruefung-spruenge', stand: new Date().toISOString(), v1: A.v1, v2: A.v2,
  zeilen: { v1: V1.stand.zeilen, v2: V2.stand.zeilen }, reihen: { v1: V1.name.length, v2: V2.name.length }, kuerzelwechsel: V2.stand.kuerzelwechsel || null,
  sprungtage: tafel, fehler: fehler, vollvergleich: voll, ueber50: { v1: l1.length, v2: l2.length, v2Liste: l2, v1Liste: l1 } };
fs.writeFileSync(path.join(__dirname, 'pruefung-spruenge-v2.json'), JSON.stringify(out, null, 1));
process.stdout.write('\nKernpruefung: ' + (fehler.length ? 'FEHLER ' + fehler.join(' | ') : 'sechs Artefakte weg oder als nicht reparierbar ausgewiesen, sieben echte bitgleich') + '\n-> pruefung-spruenge-v2.json\n');
