'use strict';
// Tests für rechner.js: node test.js, Exit-Code != 0 bei Fehler. Eigenes Mini-Assert.
const R = require('./rechner.js');

let ok = 0, fehler = 0;
function pruefe(name, bed, info) {
  if (bed) ok++; else { fehler++; console.error('FEHLER: ' + name + (info !== undefined ? '  (' + info + ')' : '')); }
}
function nahe(name, ist, soll, tol) {
  pruefe(name, Math.abs(ist - soll) <= tol, 'ist ' + ist + ', soll ' + soll + ', Toleranz ' + tol);
}

// --- Normalverteilung
nahe('z(0,975)', R.quantil(0.975), 1.95996, 1e-5);
nahe('z(0,8)', R.quantil(0.8), 0.84162, 1e-5);
nahe('z(0,95)', R.quantil(0.95), 1.64485, 1e-5);
nahe('z(0,5)', R.quantil(0.5), 0, 1e-12);
nahe('z(0,001)', R.quantil(0.001), -3.090232, 1e-6);
nahe('z(1e-8)', R.quantil(1e-8), -5.612001, 1e-5);
nahe('cdf(0)', R.cdf(0), 0.5, 1e-15);
nahe('cdf(1,96)', R.cdf(1.96), 0.9750021, 1e-7);
nahe('cdf(-4)', R.cdf(-4), 3.167124e-5, 1e-10);
nahe('cdf(-6)', R.cdf(-6), 9.865876e-10, 1e-14);
nahe('erf(0,5)', R.erf(0.5), 0.5204998778, 1e-10);
nahe('erf(-2)', R.erf(-2), -0.9953222650, 1e-10);
for (const p of [1e-6, 0.01, 0.1, 0.3, 0.7, 0.9, 0.999, 1 - 1e-7])
  nahe('Quantil-CDF-Rundreise ' + p, R.cdf(R.quantil(p)), p, 1e-12 + p * 1e-9);
// Symmetrie und Stetigkeit an der Nahtstelle der CDF (|x| = 3)
nahe('cdf Symmetrie', R.cdf(-2.5) + R.cdf(2.5), 1, 1e-14);
nahe('cdf Naht', R.cdf(-4.242640686), R.cdf(-4.242640688), 1e-12);

// --- MDE (Formel)
const zE = R.quantil(0.95), zZ = R.quantil(0.975), zB = R.quantil(0.8);
nahe('MDE einseitig 12 M, TE 20', R.mde(12, 20), (zE + zB) * 20, 1e-12);
nahe('MDE einseitig 12 M, TE 20 (Zahl)', R.mde(12, 20), 49.7295, 0.001);
nahe('MDE zweiseitig 12 M, TE 20', R.mde(12, 20, { einseitig: false }), (zZ + zB) * 20, 1e-12);
nahe('MDE skaliert mit 1/sqrt(T)', R.mde(48, 20), R.mde(12, 20) / 2, 1e-12);
nahe('MDE skaliert mit TE', R.mde(24, 40), 2 * R.mde(24, 20), 1e-12);
pruefe('MDE zweiseitig > einseitig', R.mde(12, 20, { einseitig: false }) > R.mde(12, 20));
// Dauer und MDE sind Umkehrungen
nahe('Dauer: mde(T, TE) = mu', R.mde(R.dauerJahre(7, 20) * 12, 20), 7, 1e-10);
nahe('Dauer zweiseitig: mde = mu', R.mde(R.dauerJahre(4, 35, { einseitig: false }) * 12, 35, { einseitig: false }), 4, 1e-10);
nahe('Dauer ~ 1/mu^2', R.dauerJahre(2, 20), R.dauerJahre(4, 20) * 4, 1e-10);
nahe('Dauer mu=7, TE=20 (Hand)', R.dauerJahre(7, 20), Math.pow((zE + zB) * 20 / 7, 2), 1e-12);
// Trennschärfe
nahe('Trennschärfe bei Dauer = 80 %', R.trennschaerfe(7, 20, R.dauerJahre(7, 20) * 12), 0.8, 1e-10);
nahe('Trennschärfe bei mu=0 = alpha', R.trennschaerfe(0, 20, 24), 0.05, 1e-10);
nahe('Trennschärfe zweiseitig mu=0 = alpha', R.trennschaerfe(0, 20, 24, { einseitig: false }), 0.05, 1e-10);
pruefe('Trennschärfe steigt mit T', R.trennschaerfe(7, 20, 6) < R.trennschaerfe(7, 20, 24));
pruefe('Trennschärfe fällt mit TE', R.trennschaerfe(7, 10, 12) > R.trennschaerfe(7, 35, 12));

// --- (4) Verteilung des Abstands: MC gegen Formel
{
  const mu = 7, te = 20, n = 12;
  const ex = R.verteilungAbstandExakt(mu, te, n);
  const mc = R.verteilungAbstandMC(mu, te, n, { pfade: 60000, seed: 42 });
  nahe('Abstand Mittel exakt', ex.mittel, 7, 1e-12);
  nahe('Abstand SD exakt', ex.sd, 20, 1e-12);
  nahe('Abstand P<0 exakt', ex.pNegativ, R.cdf(-7 / 20), 1e-12);
  nahe('Abstand P<0 MC', mc.pNegativ, ex.pNegativ, 0.006);
  nahe('Abstand Median MC', mc.quantile[50], ex.quantile[50], 0.35);
  nahe('Abstand q5 MC', mc.quantile[5], ex.quantile[5], 0.5);
  nahe('Abstand q95 MC', mc.quantile[95], ex.quantile[95], 0.5);
  // t4 hat dieselbe Varianz; bei n=1 fettere Ränder (q5 weniger weit außen, q1 weiter)
  const t1 = R.verteilungAbstandMC(0, 20, 1, { verteilung: 't4', pfade: 80000, seed: 3 });
  const n1 = R.verteilungAbstandExakt(0, 20, 1);
  pruefe('t4 n=1: q25 enger als Normal', Math.abs(t1.quantile[25]) < Math.abs(n1.quantile[25]));
  nahe('t4 n=1: q95 nahe Normal (Varianz gleich skaliert)', t1.quantile[95], n1.quantile[95], 1.2);
  const t24 = R.verteilungAbstandMC(0, 20, 24, { verteilung: 't4', pfade: 40000, seed: 4 });
  const n24 = R.verteilungAbstandExakt(0, 20, 24);
  nahe('t4 n=24: q95 nahe Normal', t24.quantile[95], n24.quantile[95], 1.0);
  // PRNG: gleicher Seed, gleiche Folge; Varianz von t4 = 1
  const a = R.rng(5), b = R.rng(5);
  pruefe('PRNG deterministisch', a.z() === b.z() && a.u() === b.u());
  const r = R.rng(9); let s = 0, s2 = 0; const N = 200000;
  for (let i = 0; i < N; i++) { const v = r.t4(); s += v; s2 += v * v; }
  nahe('t4 Mittel 0', s / N, 0, 0.02);
  nahe('t4 Varianz 1', s2 / N, 1, 0.08);
  const r2 = R.rng(10); s = 0; s2 = 0;
  for (let i = 0; i < N; i++) { const v = r2.z(); s += v; s2 += v * v; }
  nahe('Normal Mittel 0', s / N, 0, 0.01);
  nahe('Normal Varianz 1', s2 / N, 1, 0.015);
}

// --- (5) Rückstand und Drawdown
{
  for (const [mu, te, n, x] of [[7, 20, 24, 10], [0, 20, 12, 10], [-2, 35, 24, 20], [7, 10, 12, 5]]) {
    const ex = R.rueckstandWkeitExakt(mu, te, n, x);
    const mc = R.rueckstandWkeit(mu, te, n, x, { pfade: 40000, seed: 17 });
    nahe('Rückstand MC gegen Formel mu=' + mu + ' te=' + te + ' n=' + n + ' x=' + x, mc, ex, 0.012);
  }
  pruefe('Rückstand: stetig > monatlich', R.minTreffer(7, 20, 2, 10) > R.rueckstandWkeit(7, 20, 24, 10, { pfade: 20000, seed: 2 }) - 0.01);
  nahe('minTreffer ohne Drift = 2*Phi(-L/s)', R.minTreffer(0, 20, 1, 10), 2 * R.cdf(-10 / 20), 1e-12);
  const tab = R.rueckstandTabelle(0, 20, [6, 12, 24], [5, 10, 20], { pfade: 10000, seed: 8 });
  pruefe('Rückstand wächst mit n', tab[0][1] < tab[1][1] && tab[1][1] < tab[2][1]);
  pruefe('Rückstand fällt mit x', tab[1][0] > tab[1][1] && tab[1][1] > tab[1][2]);
  pruefe('Rückstand fällt mit mu', R.rueckstandWkeit(7, 20, 24, 10, { pfade: 10000, seed: 8 }) < tab[2][1]);
  // Drawdown >= Fall vom Start (Untergrenze), täglich überwacht
  for (const [sg, mb, n, d] of [[35, 8, 24, 30], [45, 0, 12, 20], [35, 15, 60, 40]]) {
    const unter = R.fallVomStartExakt(sg, mb, n, d);
    const mc = R.drawdownWkeit(sg, mb, n, d, { pfade: 8000, seed: 23 });
    pruefe('Drawdown >= Fall vom Start ' + sg + '/' + mb + '/' + n + '/' + d, mc >= unter - 0.015, mc + ' vs ' + unter);
  }
  const dd = R.drawdownTabelle(35, 8, [12, 60], [20, 40], { pfade: 6000, seed: 5 });
  pruefe('Drawdown wächst mit n', dd[0][0] < dd[1][0] && dd[0][1] < dd[1][1]);
  pruefe('Drawdown fällt mit d', dd[0][0] > dd[0][1] && dd[1][0] > dd[1][1]);
  pruefe('Drawdown wächst mit Vol', R.drawdownWkeit(45, 8, 24, 30, { pfade: 6000, seed: 5 }) > R.drawdownWkeit(35, 8, 24, 30, { pfade: 6000, seed: 5 }));
  nahe('TE aus Vol 35/17/0,75', R.teAusVol(35, 17, 0.75), Math.sqrt(1225 + 289 - 892.5), 1e-12);
}

// --- (6) SPRT
{
  const g = R.sprtGrenzen(7, 10);
  nahe('SPRT lnA = ln(16)', g.lnA, Math.log(16), 1e-12);
  nahe('SPRT lnB = ln(0,2/0,95)', g.lnB, Math.log(0.2 / 0.95), 1e-12);
  pruefe('SPRT obere Grenze > 0 > untere', g.obere(0) > 0 && g.untere(0) < 0);
  nahe('SPRT Steigung = mu1/24', g.steigung, 7 / 24, 1e-12);
  const h1 = R.sprtMC(7, 7, 10, { pfade: 4000, seed: 3, maxMonate: 1200 });
  const h0 = R.sprtMC(0, 7, 10, { pfade: 4000, seed: 4, maxMonate: 1200 });
  pruefe('SPRT Fehler 1. Art <= ~alpha', h0.anteilH1 <= 0.05 + 0.015, h0.anteilH1);
  pruefe('SPRT Fehler 2. Art <= ~beta', h1.anteilH1 >= 0.8 - 0.03, h1.anteilH1);
  nahe('SPRT E[N|H1] MC gegen Wald', h1.mittlereDauer, g.erwarteteDauerH1, 0.12 * g.erwarteteDauerH1);
  nahe('SPRT E[N|H0] MC gegen Wald', h0.mittlereDauer, g.erwarteteDauerH0, 0.12 * g.erwarteteDauerH0);
  pruefe('SPRT nichts offen bei TE 10', h1.anteilOffen === 0 && h0.anteilOffen === 0);
}

// --- (6b) Konfidenzfolge
{
  const a = 0.05;
  nahe('rho2-Formel', R.csRho2(36, a), (-2 * Math.log(a) + Math.log(-2 * Math.log(a) + 1)) / 36, 1e-14);
  pruefe('Radius fällt mit n', R.csRadius(12, 20) > R.csRadius(48, 20) && R.csRadius(48, 20) > R.csRadius(240, 20));
  // Radius gegen Handrechnung (Formel aus dem Kopf)
  const rho2 = R.csRho2(36, a), n = 24, sm = 20 / Math.sqrt(12);
  const u = Math.sqrt((n * rho2 + 1) / rho2 * Math.log((n * rho2 + 1) / (a * a)));
  nahe('Radius Handrechnung', R.csRadius(n, 20), sm * u / n, 1e-12);
  // Anytime-Gültigkeit: unter mu=0 liegt die untere Grenze höchstens mit ~alpha je über 0
  const h0 = R.csMC(0, 20, { pfade: 4000, seed: 12, maxMonate: 240 });
  pruefe('CS unter H0: Anteil "untere Grenze > 0" <= alpha', h0.anteilErreicht <= 0.05, h0.anteilErreicht);
  // Breiter als der feste Test: Radius am Zielhorizont > z(0,975)*sm/sqrt(n)
  pruefe('CS breiter als fester Test', R.csRadius(36, 20) > R.quantil(0.975) * 20 / Math.sqrt(12) / Math.sqrt(36));
  const z = R.csZeitDeterministisch(7, 10, { maxMonate: 1200 });
  pruefe('CS Zeit ohne Rauschen vorhanden (TE 10)', z !== null && z > 0, z);
  const mc = R.csMC(7, 10, { pfade: 2000, seed: 13, maxMonate: 600 });
  pruefe('CS Median-Zeit vorhanden (TE 10)', mc.medianMonate !== null, JSON.stringify(mc));
  nahe('CS Median-Zeit nahe der Zeit ohne Rauschen', mc.medianMonate, z, 0.35 * z);
  pruefe('CS Zeit wächst mit TE', R.csZeitDeterministisch(7, 20, { maxMonate: 1200 }) > z);
  pruefe('CS Zeit fällt mit mu', R.csZeitDeterministisch(14, 10) < z);
}

// --- Rückblick
{
  const rb = R.rueckblickLesen();
  nahe('A: SD aus Perioden = Datei', rb['A-187'].sdPeriode, rb['A-187'].sdPeriodeDatei, 1e-9);
  nahe('B: SD aus Perioden = Datei', rb['B-187'].sdPeriode, rb['B-187'].sdPeriodeDatei, 1e-9);
  nahe('A: SE = SD/sqrt(n)', rb['A-187'].sePeriode, rb['A-187'].sePeriodeDatei, 1e-9);
  nahe('TE_pa = SD*sqrt(4)', rb['A-187'].tePa, rb['A-187'].sdPeriode * 2, 1e-12);
  nahe('SE_pa = SE*4', rb['B-187'].sePa, rb['B-187'].sePeriode * 4, 1e-12);
  pruefe('Herkunft gesetzt', /abgeleitet/.test(rb['A-187'].herkunft));
  pruefe('gepoolt zwischen A und B', rb.gepoolt.tePa > rb['A-187'].tePa && rb.gepoolt.tePa < rb['B-187'].tePa);

  // Schrumpfung gegen Handrechnung: Prior-SD 3, SE 4 -> Gewicht 9/25
  const s = R.rueckblickZufallsunsicherheit(7.3, 4, 3, 0);
  nahe('Gewicht', s.gewichtBeobachtung, 9 / 25, 1e-12);
  nahe('Posterior-Mittel', s.posteriorMittel, 7.3 * 9 / 25, 1e-12);
  nahe('Posterior-SD', s.posteriorSd, Math.sqrt(1 / (1 / 9 + 1 / 16)), 1e-12);
  nahe('P(>0) posterior', s.pPositiv, R.cdf(s.posteriorMittel / s.posteriorSd), 1e-12);
  nahe('z roh', s.z, 7.3 / 4, 1e-12);
  const k = R.rueckblickZufallsunsicherheit(7.3, 1e-6, 3, 0);
  nahe('SE -> 0: Posterior = Beobachtung', k.posteriorMittel, 7.3, 1e-6);
  const k2 = R.rueckblickZufallsunsicherheit(7.3, 1e6, 3, 0);
  nahe('SE -> unendlich: Posterior = Prior', k2.posteriorMittel, 0, 1e-6);
  const s5 = R.rueckblickZufallsunsicherheit(7.3, 4, 3, 5);
  nahe('Prior-Mittel 5 wirkt', s5.posteriorMittel, 5 + 9 / 25 * 2.3, 1e-12);
  const kb = R.rueckblickKombiniert(7.3, 11, 8.3, 20);
  pruefe('Kombination: SE kleiner als beide', kb.se < 11 && kb.se < 20);
  pruefe('Kombination: Mittel zwischen beiden', kb.beobachtet > 7.3 && kb.beobachtet < 8.3);
}

// --- Gesamtrechnung (schnell) und Ausgabe
{
  const A = R.berechneAlles({ schnell: true });
  const namen = Object.keys(A.eingaben.szenarien).filter(k => k[0] !== '_');
  pruefe('Szenarien enthalten niedrig/mittel/hoch/rückblick', ['niedrig', 'mittel', 'hoch', 'rückblick'].every(k => namen.includes(k)), namen.join(','));
  nahe('MDE-Tabelle mittel 12 M', A.mde.mittel.einseitig[12], R.mde(12, R.TE_SZENARIEN.mittel), 1e-12);
  const text = R.drucken(A, 'mittel');
  pruefe('Ausgabe deutsch mit Dezimalkomma', /MDE/.test(text) && /\d,\d/.test(text));
  pruefe('Ausgabe nennt Simulation', /keine Anlageberatung/.test(text));
  pruefe('Ausgabe ohne NaN', !/NaN/.test(text));
  JSON.stringify(A);
}

console.log(ok + ' Zusicherungen ok, ' + fehler + ' Fehler.');
process.exit(fehler ? 1 : 0);
