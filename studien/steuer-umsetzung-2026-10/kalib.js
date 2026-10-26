'use strict';
// Eicht Streuung (sigma) und Umschlag (u) des Buchmodells an den berichteten Zahlen:
// 156 Verkaeufe / 173 Kaeufe in 20 Umschichtungen, gezahlte Kosten 3.092 $ bei 20 Bp je Seite.
const M = require('./modell.js');
const PR = require('./parameter.json');
const fw = PR.fenster.f1;
function bau(sigma, u) {
  const P = JSON.parse(JSON.stringify(PR.gemeinsam));
  P.buch.sigmaQuartal = sigma; P.buch.umschlagWert = u; P.trials = 40;
  const F = fw2F(fw);
  return { P, F };
}
function fw2F(f) {
  return { von: f.von, bis: f.bis, startUSD: PR.startUSD, fx: { anker: f.fx.map(a => ({ t: M.datum(a.datum), kurs: a.kurs })) },
    buchPfad: f.buchPfad, buchGesamt: f.buchGesamt, buchEichung: 0, etf: {} };
}
const out = [];
for (const sigma of [0.3, 0.4, 0.5]) for (const u of [0.25, 0.3, 0.35, 0.4]) {
  const { P, F } = bau(sigma, u);
  const W = M.fensterVorbereiten(P, F, 40);
  const r = M.rechneSzenario(W, { steuer: false });
  out.push({ sigma, u, kostenUSD: Math.round(r.a.kostenUSD), verk: +r.a.verkaeufe.toFixed(0), kaeufe: +r.a.kaeufe.toFixed(0) });
}
console.table(out);
