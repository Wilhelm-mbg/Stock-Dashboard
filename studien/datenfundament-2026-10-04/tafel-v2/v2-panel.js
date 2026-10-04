'use strict';
/* TAFEL v2, Schritt 1 - Zwillinge mit B1 am Tages-Panel v2.2 (Auftrag Nr. 92, Schritt 2). NUR LESEN.
 * Nach ../zaehllauf4/z4-panel.js: dieselbe Abschnittswahl (Lesart 3 des vierten Laufs: unter den Abschnitten des Ordners und dem
 * gleichen Namens der, dessen letzter Tag dem Anker am naechsten liegt, bei Gleichstand der spaetere), dieselbe Kandidatensuche;
 * je Kandidat wird (b) zweimal geprueft - ohne und mit dem B1-Zusatz (zwilling-v2.js). Das Panel wird NICHT ganz geladen, sondern
 * Jahresdatei fuer Jahresdatei gelesen (panel-jahresweise.js - dort der Grund). Der rohe letzte Kurs (E7) kommt unveraendert aus
 * ../zaehllauf4/z4-verschwundene.json.
 *
 * Gegenprobe im Lauf: ohne B1 muss jede Reihe denselben Abschnitt, dieselben Kandidaten (gleiche Tage, Nachlauf, Urteil) und
 * denselben Zwilling haben wie in ../zaehllauf4/z4-panel.json.
 *
 * Aufruf:  node --max-old-space-size=6144 v2-panel.js
 * Schreibt: v2-panel.json (Arbeitsdatei, keine Tafel)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var ZV = require('./zwilling-v2.js');
var PJ = require('./panel-jahresweise.js');
var ZW = ZV.ZW;
var Z4 = path.join(G.HIER, 'zaehllauf4');
var V22 = path.join(G.PRUEFSTAND, 'voll-v22'), KENNUNG_V22 = 'querschnitt-pruefstand-2026-09-13/panel/v2.2';

function schreibe(name, obj) { var p = path.join(__dirname, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }

function main() {
  var t0 = Date.now();
  var V = G.json(path.join(Z4, 'z4-verschwundene.json'));
  var P4 = G.json(path.join(Z4, 'z4-panel.json')).je;
  var st = PJ.stand(V22);
  if (st.kennung !== KENNUNG_V22) throw new Error('voll-v22 traegt ' + st.kennung);
  var sym = st.symbole, tage = st.tage, info = PJ.uebersicht(V22, KENNUNG_V22, st);
  var zeilen = 0; info.forEach(function (x) { zeilen += x.n; });
  console.log('Panel v2.2 jahresweise:', zeilen, 'Zeilen,', sym.length, 'Reihen, Ende', tage[st.letzterVollTagIdx], '(' + Math.round((Date.now() - t0) / 1000) + ' s)');

  var jeOrdner = {}, symIdx = {};
  sym.forEach(function (s, i) { symIdx[s.reihe] = i; if (!s.referenz) (jeOrdner[s.ordner] = jeOrdner[s.ordner] || []).push(i); });
  var tagIdx = {}; tage.forEach(function (t, i) { tagIdx[t] = i; });
  function tagNah(iso) { if (tagIdx[iso] !== undefined) return tagIdx[iso]; var best = -1; for (var i = 0; i < tage.length; i++) if (tage[i] <= iso) best = i; return best; }

  var Z = { reihen: V.reihen.length, ohneZeilen: 0, zuKurzFuerA: 0, mitA: 0, mitAWeiter: 0, zwillingOhneB1: 0, zwillingMitB1: 0, neuDurchB1: [], andererZwillingDurchB1: [],
    gegenprobe: { abschnittGleich: 0, abschnittAnders: [], zwillingGleich: 0, zwillingAnders: [], kandidatenGleich: 0, kandidatenAnders: [] } };
  var je = {}, dVon = {}, dListe = [];
  V.reihen.forEach(function (R) {
    var l = (jeOrdner[R.ordner] || []).slice();
    if (symIdx[R.reihe] !== undefined && l.indexOf(symIdx[R.reihe]) === -1 && !sym[symIdx[R.reihe]].referenz) l.push(symIdx[R.reihe]);
    var anker = tagNah(R.letzterBalken), best = -1, bestD = Infinity, bestEnde = -1;
    l.forEach(function (s) {
      if (!info[s].n) return;
      var ende = info[s].letzter, d = Math.abs(ende - anker);
      if (d < bestD || (d === bestD && ende > bestEnde)) { best = s; bestD = d; bestEnde = ende; }
    });
    if (best < 0) { Z.ohneZeilen++; je[R.reihe] = { panelReihe: l.length ? sym[l[0]].reihe : null, zeilen: 0, kandidaten: [], zwilling: null, zwillingB1: null }; return; }
    var x = info[best];
    je[R.reihe] = { panelReihe: sym[best].reihe, zeilen: x.n, ersterTag: tage[x.erster], bis: tage[x.letzter], kandidaten: [], zwilling: null, zwillingB1: null };
    if (x.n < ZW.A_TAGE) { Z.zuKurzFuerA++; return; }
    (dVon[best] = dVon[best] || []).push(R.reihe);
    if (dVon[best].length === 1) dListe.push(best);
  });
  var PR = PJ.probe(V22, KENNUNG_V22, dListe, info, st);
  Object.keys(PR.kand).forEach(function (d) {
    var kand = PR.kand[d];
    var w0 = ZV.waehle(kand, false), w1 = ZV.waehle(kand, true);
    dVon[d].forEach(function (rn) {
      var e = je[rn];
      e.kandidaten = kand.map(function (k) {
        var p = k.p;
        return { name: k.name, ok: p.ok, okB1: p.okB1, bGleich: p.bGleich, bGleichB1: p.bGleichB1, bTage: p.bTage, bNoetig: p.bNoetig, cTage: p.cTage, gleichesEnde: p.gleichesEnde,
          aExakt: p.aExakt, doppelte: k.doppelte, cLetzter: k.cLetzter, b1: p.b1 };
      });
      e.zwilling = w0 ? w0.name : null; e.zwillingB1 = w1 ? w1.name : null;
      Z.mitA++;
      if (kand.some(function (k) { return k.p.cTage >= 1; })) Z.mitAWeiter++;
      if (w0) Z.zwillingOhneB1++;
      if (w1) Z.zwillingMitB1++;
      if (w1 && !w0) Z.neuDurchB1.push(rn + ' -> ' + w1.name + ' (' + w1.p.bGleich + '+' + (w1.p.bGleichB1 - w1.p.bGleich) + '/' + w1.p.bTage + ', Verhaeltnis ' + (w1.p.b1 && w1.p.b1.verhaeltnis) + ')');
      if (w1 && w0 && w1.name !== w0.name) Z.andererZwillingDurchB1.push(rn + ': ' + w0.name + ' -> ' + w1.name);
    });
  });
  /* Gegenprobe gegen den vierten Lauf (ohne B1) */
  V.reihen.forEach(function (R) {
    var a = je[R.reihe], b = P4[R.reihe] || {};
    if (a.panelReihe === (b.panelReihe || null) && a.zeilen === (b.zeilen || 0) && (a.bis || null) === (b.bis || null)) Z.gegenprobe.abschnittGleich++; else Z.gegenprobe.abschnittAnders.push(R.reihe);
    if ((a.zwilling || null) === (b.zwilling || null)) Z.gegenprobe.zwillingGleich++; else Z.gegenprobe.zwillingAnders.push(R.reihe);
    function sig(l) { return (l || []).map(function (k) { return [k.name, k.bGleich, k.bTage, k.bNoetig, k.cTage, k.ok, k.aExakt, k.doppelte, k.gleichesEnde].join(':'); }).sort().join(','); }
    if (sig(a.kandidaten) === sig(b.kandidaten)) Z.gegenprobe.kandidatenGleich++; else Z.gegenprobe.kandidatenAnders.push(R.reihe);
  });
  schreibe('v2-panel.json', { kennung: 'datenfundament-2026-10-04/tafel-v2 (Arbeitsdatei, keine Tafel)', stand: new Date().toISOString(), panel: st.kennung, panelEnde: tage[st.letzterVollTagIdx],
    gelesen: 'jahresweise (panel-jahresweise.js), Kalender aus _stand.json',
    regel: { a: ZW.A_TAGE + ' letzte Tage: roher Schluss gleich, Verhaeltnis Eroeffnung/Schluss gleich (Toleranz ' + ZW.VERH_TOL + ' relativ)',
      b: ZW.B_MIN + ' von ' + ZW.B_FENSTER + ', kuerzer: ' + (ZW.B_ANTEIL * 100) + ' %; B1: ungleiche Tage zaehlen mit, wenn das Verhaeltnis der rohen Schluesse dort fest ist (Abweichung <= ' + ZV.B1_TOL + ')',
      c: ZW.C_MIN + ' Panel-Zeilen nach dem letzten Tag' },
    speicherSpitzeMB: PJ.spitzeMB(), zaehler: Z, je: je });
  console.log(JSON.stringify(Z));
  console.log('fertig in', Math.round((Date.now() - t0) / 1000), 's, Speicher hoechstens', PJ.spitzeMB(), 'MB');
}

if (require.main === module) main();
