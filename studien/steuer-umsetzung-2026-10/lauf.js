'use strict';
// Lauf: Endvermoegen (a)/(b)/(c) nach Steuern, Gewinnschwellen, Empfindlichkeiten fuer beide Fenster.
// MODELLRECHNUNG, KEINE STEUER- ODER ANLAGEBERATUNG. Schreibt ergebnis.json.
const fs = require('fs');
const path = require('path');
const M = require('./modell.js');
const PR = require('./parameter.json');

const trials = Number(process.env.TRIALS || PR.gemeinsam.trials);

function jahreFenster(f) { return (M.datum(f.bis) - M.datum(f.von)) / 86400000 / 365.25; }
function baue(fk, bVar) {
  const f = PR.fenster[fk];
  const P = JSON.parse(JSON.stringify(PR.gemeinsam)); P.trials = trials;
  const k = PR.kosten;
  const mom = JSON.parse(JSON.stringify(f.momentum));
  if (bVar && bVar.gleichSP) { mom.gesamt = f.spy.gesamt; mom.pfad = f.spy.pfad; }
  const F = {
    von: f.von, bis: f.bis, startUSD: PR.startUSD, buchPfad: f.buchPfad, buchGesamt: f.buchGesamt, buchEichung: 0,
    fx: { anker: f.fx.map(a => ({ t: M.datum(a.datum), kurs: a.kurs })) },
    etf: {
      b: { pfad: mom.pfad, gesamt: bVar ? (1 + mom.gesamt) * Math.exp(bVar.delta * jahreFenster(f)) - 1 : mom.gesamt, zielArt: mom.zielArt, basis: mom.basis, ter: k.terMomentum,
        fondsQuellensteuer: P.dividende.quellensteuerUS * mom.dividendenrendite, kaufBp: k.etfKaufBp, verkaufBp: k.etfVerkaufBp },
      c: { pfad: f.spy.pfad, gesamt: f.spy.gesamt, zielArt: f.spy.zielArt || 'brutto', basis: f.spy.basis || 'USD', ter: k.terSP500,
        fondsQuellensteuer: P.dividende.quellensteuerUS * f.spy.dividendenrendite, kaufBp: k.etfKaufBp, verkaufBp: k.etfVerkaufBp }
    }
  };
  return { P, F };
}

function zeile(W, opt, mitSchwelle) {
  const r = M.rechneSzenario(W, opt);
  const K0 = M.eurStart(W.F), J = W.R.jahre;
  const cagr = e => Math.pow(e / K0, 1 / J) - 1;
  const o = { startEUR: K0 };
  for (const k of ['a', 'b', 'c']) {
    o[k] = { endMitVerkauf: r[k].endMitVerkauf, endOhneVerkauf: r[k].endOhneVerkauf, steuer: r[k].steuer,
      pa: cagr(r[k].endMitVerkauf) };
    if (k === 'a') { o.a.p10 = r.a.p10; o.a.p90 = r.a.p90; o.a.kostenUSD = r.a.kostenUSD; o.a.verkaeufe = r.a.verkaeufe; o.a.kaeufe = r.a.kaeufe; }
    else { o[k].vpSteuer = r[k].vpSteuer; }
  }
  if (mitSchwelle) {
    o.schwelleB = M.schwelle(W, 'b', opt);
    o.schwelleC = M.schwelle(W, 'c', opt);
  }
  return o;
}

function sens(P) {
  const u = P.buch.umschlagWert;
  return [
    ['Basis', {}],
    ['Umschlag halb', { umschlag: u / 2 }],
    ['Umschlag doppelt', { umschlag: u * 2 }],
    ['Kosten 10 Bp je Seite', { kostenBp: 10 }],
    ['Kosten 20 Bp je Seite (Basis)', { kostenBp: 20 }],
    ['Kosten 40 Bp je Seite', { kostenBp: 40 }],
    ['Devisenaufschlag Bank 35 Bp je Seite zusätzlich', { fxBp: 35 }],
    ['Kirchensteuer 8 %', { kirche: 0.08 }],
    ['Kirchensteuer 9 %', { kirche: 0.09 }],
    ['Euro-Dollar-Endkurs −10 % (Dollar stärker)', { fxFaktor: 0.9 }],
    ['Euro-Dollar-Endkurs +10 % (Dollar schwächer)', { fxFaktor: 1.1 }]
  ];
}

const aus = { stand: PR.stand, trials, fenster: {} };
for (const fk of Object.keys(PR.fenster)) {
  const { P, F } = baue(fk);
  const t0 = Date.now();
  const W = M.fensterVorbereiten(P, F, trials);
  const fe = { von: PR.fenster[fk].von, bis: PR.fenster[fk].bis, jahre: W.R.jahre, buchEichung: W.F.buchEichung,
    etfVerschiebung: { b: W.etf.b.verschiebung, c: W.etf.c.verschiebung }, basis: zeile(W, {}, true), sens: [] };
  for (const [name, opt] of sens(P)) fe.sens.push(Object.assign({ name }, zeile(W, opt, true)));
  // Annahmen zum Momentum-ETF (b): gemessen / gleich S&P 500 vor TER / +-2 Pp p. a.
  fe.bVarianten = [];
  for (const bv of [{ name: 'IUMO gemessen (Basis)', delta: 0 }, { name: 'Momentum-ETF −2 Pp p. a. gegen Basis', delta: -0.02 },
    { name: 'Momentum-ETF +2 Pp p. a. gegen Basis', delta: 0.02 }, { name: 'Momentum-ETF = S&P-500-Fonds (Aufschlag 0)', delta: 0, gleichSP: true }]) {
    const b2 = baue(fk, bv); const W2 = M.fensterVorbereiten(b2.P, b2.F, trials);
    const z = zeile(W2, {}, false); z.schwelleB = M.schwelle(W2, 'b', {}); fe.bVarianten.push(Object.assign({ name: bv.name }, z));
  }
  // gleiche Rechnung ohne Steuer (Vorsteuer-Rendite nach Kosten) als Referenz
  fe.vorSteuer = zeile(W, { steuer: false }, false);
  // Probe: Verhalten des Buchmodells gegen die berichteten Zahlen (nur Fenster 1)
  fe.sekunden = (Date.now() - t0) / 1000;
  aus.fenster[fk] = fe;
  console.error(fk, 'fertig in', fe.sekunden, 's');
}
fs.writeFileSync(path.join(__dirname, 'ergebnis.json'), JSON.stringify(aus, null, 1));
console.log('ergebnis.json geschrieben');
