'use strict';
/*
 * Vorwärtstest-Rechner (Simulation, keine Anlageberatung).
 * Frage: Wie lange muss ein Buch gegen den S&P 500 laufen, bevor man einen
 * wahren Vorsprung von null trennen kann? Keine Abhängigkeiten, CommonJS.
 *
 *   node rechner.js            Tabellen auf Deutsch
 *   node rechner.js --json     schreibt ergebnis.json neben diese Datei
 *   node rechner.js --szenario=hoch   Quantiltabellen für ein anderes Szenario
 *
 * Einheiten: Überrendite mu und Tracking Error TE in Prozentpunkten (Pp) p. a.;
 * Dauer in Monaten (T) bzw. Jahren. Monatsschritt: Mittel mu/12, SD TE/sqrt(12),
 * Monate unabhängig (keine Volatilitätscluster; fette Ränder nur über t4).
 *
 * Mühle (CLAUDE.md): MDE vor dem Urteil. Die MDE hängt nur an Dauer und TE, nicht
 * am Ergebnis. Formel: MDE_pa = (z_{1-a} + z_{0,8}) * TE / sqrt(T/12), TE bekannt
 * angenommen (mit geschätztem TE und wenigen Monaten fällt sie etwas größer aus).
 *
 * Anytime-valid Konfidenzfolge (Normal-Mischung, mSPRT-Grenze, Robbins; Howard et al.):
 * Beobachtungen X_i ~ N(theta, s^2), Summe S_n. Mischung über theta ~ N(0, rho^2 s^2).
 * Mit v = n (Varianz in s-Einheiten) gilt |S_n - n*theta| / s < u(n) für alle n zugleich
 * mit Wahrscheinlichkeit >= 1-alpha, wobei
 *     u(n) = sqrt( (n*rho^2 + 1) / rho^2 * ln( (n*rho^2 + 1) / alpha^2 ) )
 * (= sqrt(2 (n rho^2+1)/rho^2 * ln( sqrt(n rho^2+1)/alpha ))), Radius am Mittel:
 * r(n) = s * u(n) / n. rho^2 wird für einen Zielhorizont n* gewählt:
 *     rho^2 = ( -2 ln(alpha) + ln(-2 ln(alpha) + 1) ) / n*.
 * Die Folge ist zweiseitig zum Niveau alpha; die untere Grenze allein hält damit
 * höchstens alpha Fehlerwahrscheinlichkeit (konservativ, einseitig wäre knapper).
 *
 * Rückblick: Perioden = 63 Handelstage = 0,25 Jahr; TE_pa = SD_Periode * sqrt(4),
 * SE_pa = SE_Periode * 4 (Mittel je Periode * 4 = p. a.).
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- Konstanten
// Tracking-Error-Szenarien (Pp p. a.). Die Eingabe kommt später aus der Recherche.
const TE_SZENARIEN = { niedrig: 13, mittel: 17, hoch: 21 };   // aus tracking-error.md (öffentliche Daten); Rückblick-Szenarien kommen aus dem JSON
const MU_LISTE = [7, 4, 2];                 // wahre Überrendite (Pp p. a.)
const T_MONATE = [3, 6, 12, 24, 36, 60];
const T_TRENN = [3, 6, 12, 24, 60];
const ALPHA = 0.05;
const MACHT = 0.8;
const RUECKBLICK_DATEI = path.join(__dirname, '..', 'momentum-korb-2026-10-04', 'ergebnis.json');
const BEOBACHTET = { 'A-187': 7.3, 'B-187': 8.3 };  // Vorgabe des Auftrags (Pp p. a.)
const PRIOR_SD = 3;                                 // Pp p. a.
const VOL = { buch: [35, 45], sp: 17, korr: 0.75 }; // % p. a.

// ---------------------------------------------------------------- Normalverteilung
function erf(x) {
  const ax = Math.abs(x);
  let r;
  if (ax < 3) {
    // positive Reihe: erf = 2/sqrt(pi) e^{-x^2} sum 2^n x^(2n+1) / (1*3*...*(2n+1))
    let term = ax, sum = ax;
    for (let n = 1; n < 200; n++) {
      term *= 2 * ax * ax / (2 * n + 1);
      sum += term;
      if (term < 1e-17 * sum) break;
    }
    r = 2 / Math.sqrt(Math.PI) * Math.exp(-ax * ax) * sum;
  } else {
    r = 1 - erfcKettenbruch(ax);
  }
  return x < 0 ? -r : r;
}
// erfc(x) für x >= 3 per Kettenbruch (modifizierter Lentz)
function erfcKettenbruch(x) {
  const tiny = 1e-300;
  let f = x, C = x, D = 0;
  for (let n = 1; n < 500; n++) {
    const a = n / 2;
    D = x + a * D; if (D === 0) D = tiny;
    C = x + a / C; if (C === 0) C = tiny;
    D = 1 / D;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return Math.exp(-x * x) / (f * Math.sqrt(Math.PI));
}
function cdf(z) {
  if (z === Infinity) return 1;
  if (z === -Infinity) return 0;
  const x = z / Math.SQRT2;
  if (Math.abs(x) >= 3) {
    const t = erfcKettenbruch(Math.abs(x)) / 2;
    return x < 0 ? t : 1 - t;
  }
  return 0.5 * (1 + erf(x));
}
function dichte(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

// Quantil: Acklam-Näherung, danach zwei Halley-Schritte gegen die genaue CDF
function quantil(p) {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    return NaN;
  }
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00];
  const plow = 0.02425;
  let x;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - plow) {
    const q = p - 0.5, r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  for (let i = 0; i < 2; i++) {
    const e = cdf(x) - p;
    const u = e / dichte(x);
    x -= u / (1 + x * u / 2);
  }
  return x;
}

// ---------------------------------------------------------------- Zufall (Seed-PRNG)
function rng(seed) {
  let s = (seed >>> 0) || 1;
  let reserve = null;
  function u() {            // mulberry32, Wert in (0,1)
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const v = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return v === 0 ? 1 / 4294967296 : v;
  }
  function z() {            // Box-Muller mit Reserve
    if (reserve !== null) { const r = reserve; reserve = null; return r; }
    const r = Math.sqrt(-2 * Math.log(u())), w = 2 * Math.PI * u();
    reserve = r * Math.sin(w);
    return r * Math.cos(w);
  }
  function t4() {           // t mit 4 FG, auf Varianz 1 skaliert (Var(t4) = 2)
    const v = -2 * Math.log(u() * u());   // Chi-Quadrat(4)
    return z() / Math.sqrt(v / 4) / Math.SQRT2;
  }
  return { u, z, t4 };
}
function quantilVonSortiert(arr, p) {
  const pos = p * (arr.length - 1), lo = Math.floor(pos), hi = Math.ceil(pos);
  return arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
}

// ---------------------------------------------------------------- (2) MDE, (3) Dauer, Trennschärfe
function zAlpha(alpha, einseitig) { return quantil(1 - (einseitig ? alpha : alpha / 2)); }

// Kleinste nachweisbare Überrendite (Pp p. a.) nach tMonate bei Tracking Error te
function mde(tMonate, te, o) {
  o = o || {};
  const alpha = o.alpha == null ? ALPHA : o.alpha, macht = o.macht == null ? MACHT : o.macht;
  const einseitig = o.einseitig !== false;
  return (zAlpha(alpha, einseitig) + quantil(macht)) * te / Math.sqrt(tMonate / 12);
}
// Nötige Dauer (Jahre), um wahres mu mit Trennschärfe macht von null zu trennen
function dauerJahre(mu, te, o) {
  o = o || {};
  const alpha = o.alpha == null ? ALPHA : o.alpha, macht = o.macht == null ? MACHT : o.macht;
  const einseitig = o.einseitig !== false;
  const f = (zAlpha(alpha, einseitig) + quantil(macht)) * te / mu;
  return f * f;
}
// Trennschärfe (0..1) nach tMonate bei wahrem mu
function trennschaerfe(mu, te, tMonate, o) {
  o = o || {};
  const alpha = o.alpha == null ? ALPHA : o.alpha;
  const einseitig = o.einseitig !== false;
  const d = mu * Math.sqrt(tMonate / 12) / te;
  const z = zAlpha(alpha, einseitig);
  return einseitig ? cdf(d - z) : cdf(d - z) + cdf(-d - z);
}

// ---------------------------------------------------------------- (4) Verteilung des Abstands
// Geschlossen (Normal): Abstand nach n Monaten ~ N(mu*n/12, TE^2*n/12)
function verteilungAbstandExakt(mu, te, nMonate) {
  const m = mu * nMonate / 12, s = te * Math.sqrt(nMonate / 12);
  const q = {};
  for (const p of [5, 25, 50, 75, 95]) q[p] = m + s * quantil(p / 100);
  return { mittel: m, sd: s, quantile: q, pNegativ: cdf(-m / s) };
}
// Monte Carlo; verteilung 'normal' oder 't4' (gleiche Varianz je Monat)
function verteilungAbstandMC(mu, te, nMonate, o) {
  o = o || {};
  const pfade = o.pfade || 40000, r = rng(o.seed == null ? 1 : o.seed);
  const t = o.verteilung === 't4';
  const sm = te / Math.sqrt(12), mm = mu / 12;
  const x = new Float64Array(pfade);
  let neg = 0, sum = 0;
  for (let i = 0; i < pfade; i++) {
    let s = 0;
    for (let k = 0; k < nMonate; k++) s += mm + sm * (t ? r.t4() : r.z());
    x[i] = s; sum += s;
    if (s < 0) neg++;
  }
  x.sort();
  const q = {};
  for (const p of [5, 25, 50, 75, 95]) q[p] = quantilVonSortiert(x, p / 100);
  return { mittel: sum / pfade, quantile: q, pNegativ: neg / pfade, pfade };
}

// ---------------------------------------------------------------- (5) Abbruchbausteine
// Erstpassage einer Brownschen Bewegung mit Drift m, Vol sigma, Zeit T (Jahre) unter -L
// (stetige Überwachung); diskrete Überwachung: L um 0,5826*sigma*sqrt(dt) erhöhen.
function minTreffer(m, sigma, T, L) {
  const s = sigma * Math.sqrt(T);
  return cdf((-L - m * T) / s) + Math.exp(-2 * m * L / (sigma * sigma)) * cdf((-L + m * T) / s);
}
// Geschlossen, monatlich überwacht (Broadie-Glasserman-Korrektur)
function rueckstandWkeitExakt(mu, te, nMonate, x) {
  return minTreffer(mu, te, nMonate / 12, x + 0.5826 * te * Math.sqrt(1 / 12));
}
// Monte Carlo: P(kumulativer Abstand erreicht irgendwann in den ersten n Monaten <= -x Pp)
// Ergebnis: matrix[i][j] zu nListe[i], xListe[j]
function rueckstandTabelle(mu, te, nListe, xListe, o) {
  o = o || {};
  const pfade = o.pfade || 20000, r = rng(o.seed == null ? 7 : o.seed);
  const nMax = Math.max.apply(null, nListe), sm = te / Math.sqrt(12), mm = mu / 12;
  const treffer = nListe.map(() => xListe.map(() => 0));
  const minBei = new Float64Array(nListe.length);
  for (let i = 0; i < pfade; i++) {
    let s = 0, mn = 0, idx = 0;
    for (let k = 1; k <= nMax; k++) {
      s += mm + sm * r.z();
      if (s < mn) mn = s;
      if (k === nListe[idx]) { minBei[idx++] = mn; }
    }
    for (let a = 0; a < nListe.length; a++)
      for (let b = 0; b < xListe.length; b++) if (minBei[a] <= -xListe[b]) treffer[a][b]++;
  }
  return treffer.map(zeile => zeile.map(v => v / pfade));
}
function rueckstandWkeit(mu, te, nMonate, x, o) {
  return rueckstandTabelle(mu, te, [nMonate], [x], o)[0][0];
}
// Drawdown-Stopp: P(Buch fällt irgendwann in n Monaten um >= d % vom Höchststand).
// sigma, muBuch in % p. a. (muBuch arithmetisch; log-Drift = mu - sigma^2/2), d in %.
// Tägliche Schritte (21 je Monat) per Voreinstellung. matrix[i][j] zu nListe[i], dListe[j]
function drawdownTabelle(sigma, muBuch, nListe, dListe, o) {
  o = o || {};
  const pfade = o.pfade || 10000, schritte = o.schritteProMonat || 21;
  const r = rng(o.seed == null ? 11 : o.seed);
  const sg = sigma / 100, dt = 1 / (12 * schritte);
  const drift = (muBuch / 100 - sg * sg / 2) * dt, vol = sg * Math.sqrt(dt);
  const nMax = Math.max.apply(null, nListe);
  const schwellen = dListe.map(d => -Math.log(1 - d / 100));
  const treffer = nListe.map(() => dListe.map(() => 0));
  const ddBei = new Float64Array(nListe.length);
  for (let i = 0; i < pfade; i++) {
    let lv = 0, peak = 0, dd = 0, idx = 0;
    for (let k = 1; k <= nMax; k++) {
      for (let j = 0; j < schritte; j++) {
        lv += drift + vol * r.z();
        if (lv > peak) peak = lv;
        else if (peak - lv > dd) dd = peak - lv;
      }
      if (k === nListe[idx]) ddBei[idx++] = dd;
    }
    for (let a = 0; a < nListe.length; a++)
      for (let b = 0; b < dListe.length; b++) if (ddBei[a] >= schwellen[b]) treffer[a][b]++;
  }
  return treffer.map(zeile => zeile.map(v => v / pfade));
}
function drawdownWkeit(sigma, muBuch, nMonate, d, o) {
  return drawdownTabelle(sigma, muBuch, [nMonate], [d], o)[0][0];
}
// Untergrenze für den Drawdown: Fall vom Start (stetig), exakt
function fallVomStartExakt(sigma, muBuch, nMonate, d) {
  const sg = sigma / 100, m = muBuch / 100 - sg * sg / 2;
  return minTreffer(m, sg, nMonate / 12, -Math.log(1 - d / 100));
}
// Tracking Error (% p. a.) aus Einzelvolatilitäten und Korrelation
function teAusVol(volBuch, volSp, korr) {
  return Math.sqrt(volBuch * volBuch + volSp * volSp - 2 * korr * volBuch * volSp);
}

// ---------------------------------------------------------------- (6) Sequentielle Tests
// Wald-SPRT auf dem kumulierten Abstand S_n (Pp), H0: mu0, H1: mu1, Monatsschritte.
function sprtGrenzen(mu1, te, o) {
  o = o || {};
  const alpha = o.alpha == null ? ALPHA : o.alpha, beta = o.beta == null ? 1 - MACHT : o.beta;
  const mu0 = o.mu0 || 0;
  const lnA = Math.log((1 - beta) / alpha), lnB = Math.log(beta / (1 - alpha));
  const sm2 = te * te / 12, delta = (mu1 - mu0) / 12;
  const proMonat = delta * delta / (2 * sm2);           // E[LLR-Schritt | H1] = -E[... | H0]
  return {
    lnA, lnB,
    // Grenzen auf S_n: S_n >= achseOben + n*steigung  => H1 ; <= achseUnten + n*steigung => H0
    achseOben: sm2 * lnA / delta, achseUnten: sm2 * lnB / delta, steigung: (mu0 + mu1) / 24,
    obere: n => sm2 * lnA / delta + n * (mu0 + mu1) / 24,
    untere: n => sm2 * lnB / delta + n * (mu0 + mu1) / 24,
    // Waldsche Näherung der erwarteten Dauer in Monaten (ohne Überschuss)
    erwarteteDauerH1: ((1 - beta) * lnA + beta * lnB) / proMonat,
    erwarteteDauerH0: (alpha * lnA + (1 - alpha) * lnB) / -proMonat,
    proMonat
  };
}
// Monte Carlo unter wahrem muWahr: Anteil H1/H0/offen, Dauer in Monaten
function sprtMC(muWahr, mu1, te, o) {
  o = o || {};
  const g = sprtGrenzen(mu1, te, o), pfade = o.pfade || 4000, maxM = o.maxMonate || 1200;
  const r = rng(o.seed == null ? 21 : o.seed);
  const sm = te / Math.sqrt(12), mm = muWahr / 12;
  let h1 = 0, h0 = 0, offen = 0;
  const dauern = new Float64Array(pfade);
  for (let i = 0; i < pfade; i++) {
    let s = 0, n = 0, ende = 0;
    while (n < maxM) {
      n++; s += mm + sm * r.z();
      if (s >= g.obere(n)) { ende = 1; break; }
      if (s <= g.untere(n)) { ende = 2; break; }
    }
    if (ende === 1) h1++; else if (ende === 2) h0++; else offen++;
    dauern[i] = n;
  }
  dauern.sort();
  let sum = 0; for (let i = 0; i < pfade; i++) sum += dauern[i];
  return {
    anteilH1: h1 / pfade, anteilH0: h0 / pfade, anteilOffen: offen / pfade,
    mittlereDauer: sum / pfade, medianDauer: quantilVonSortiert(dauern, 0.5),
    q90Dauer: quantilVonSortiert(dauern, 0.9), maxMonate: maxM, pfade
  };
}

// Konfidenzfolge (Normal-Mischung, siehe Kopf). Radius am Monatsmittel (Pp je Monat).
function csRho2(nStern, alpha) {
  const l = -2 * Math.log(alpha);
  return (l + Math.log(l + 1)) / nStern;
}
function csRadius(n, te, o) {
  o = o || {};
  const alpha = o.alpha == null ? ALPHA : o.alpha;
  const rho2 = o.rho2 || csRho2(o.nStern || 36, alpha);
  const sm = te / Math.sqrt(12);
  const u = Math.sqrt((n * rho2 + 1) / rho2 * Math.log((n * rho2 + 1) / (alpha * alpha)));
  return sm * u / n;
}
// Radius in Pp p. a.
function csRadiusPa(n, te, o) { return 12 * csRadius(n, te, o); }
// Deterministisch: erster Monat, ab dem die untere Grenze bei wahrem mu (Pp p. a.) ohne
// Rauschen über 0 liegt (mu/12 > r(n)); null, wenn bis maxMonate nicht erreicht
function csZeitDeterministisch(mu, te, o) {
  o = o || {};
  const maxM = o.maxMonate || 1200;
  for (let n = 1; n <= maxM; n++) if (mu / 12 > csRadius(n, te, o)) return n;
  return null;
}
// Monte Carlo: Monat, in dem die untere Grenze erstmals über 0 liegt
function csMC(muWahr, te, o) {
  o = o || {};
  const pfade = o.pfade || 3000, maxM = o.maxMonate || 600;
  const r = rng(o.seed == null ? 31 : o.seed);
  const sm = te / Math.sqrt(12), mm = muWahr / 12;
  const rad = new Float64Array(maxM + 1);
  for (let n = 1; n <= maxM; n++) rad[n] = csRadius(n, te, o);
  const zeiten = [];
  for (let i = 0; i < pfade; i++) {
    let s = 0;
    for (let n = 1; n <= maxM; n++) {
      s += mm + sm * r.z();
      if (s / n - rad[n] > 0) { zeiten.push(n); break; }
    }
  }
  zeiten.sort((a, b) => a - b);
  const anteil = zeiten.length / pfade;
  const q = p => (zeiten.length && p <= anteil) ? zeiten[Math.min(zeiten.length - 1, Math.ceil(p * pfade) - 1)] : null;
  return { anteilErreicht: anteil, medianMonate: q(0.5), q25Monate: q(0.25), q75Monate: q(0.75),
    maxMonate: maxM, pfade };
}

// ---------------------------------------------------------------- Rückblick
// Liest je Lauf die Perioden-Abstände (Pp je 63 Handelstage); TE_pa = SD*sqrt(4)
function rueckblickLesen(datei) {
  datei = datei || RUECKBLICK_DATEI;
  const j = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const aus = {};
  for (const name of ['A-187', 'B-187']) {
    const lauf = j.laeufe && j.laeufe[name];
    if (!lauf) throw new Error('Lauf fehlt: ' + name);
    const a = lauf.perioden.map(p => p.abstand);
    const n = a.length, mittel = a.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(a.reduce((s, v) => s + (v - mittel) * (v - mittel), 0) / (n - 1));
    const ps = lauf.zufallsbereich && lauf.zufallsbereich.periodenstreuung;
    aus[name] = {
      n, mittelPeriode: mittel, sdPeriode: sd, sePeriode: sd / Math.sqrt(n),
      tePa: sd * 2, mittelPa: mittel * 4, sePa: sd / Math.sqrt(n) * 4,
      sdPeriodeDatei: ps ? ps.standardabweichung : null,
      sePeriodeDatei: ps ? ps.standardfehler : null,
      herkunft: 'abgeleitet aus ' + path.basename(path.dirname(datei)) + '/' + path.basename(datei) +
        ' laeufe.' + name + '.perioden[].abstand (n=' + n + ' Perioden zu 63 Handelstagen); ' +
        'SD_Periode aus den Abständen, TE_pa = SD*sqrt(4), SE_pa = SD/sqrt(n)*4'
    };
  }
  const A = aus['A-187'], B = aus['B-187'];
  const sd2 = ((A.n - 1) * A.sdPeriode * A.sdPeriode + (B.n - 1) * B.sdPeriode * B.sdPeriode) / (A.n + B.n - 2);
  aus.gepoolt = { n: A.n + B.n, sdPeriode: Math.sqrt(sd2), tePa: Math.sqrt(sd2) * 2,
    herkunft: 'gepoolte Varianz aus A-187 und B-187 (Freiheitsgrade A.n-1, B.n-1), TE_pa = SD*sqrt(4)' };
  return aus;
}
// Zufallsunsicherheit des Rückblicks: wahrer Vorsprung gegeben beobachtet (Pp p. a.)
// mit Standardfehler se; Schrumpfung gegen Prior N(priorMittel, priorSd^2) -> Posterior.
function rueckblickZufallsunsicherheit(beobachtet, se, priorSd, priorMittel) {
  priorSd = priorSd == null ? PRIOR_SD : priorSd;
  priorMittel = priorMittel || 0;
  const w = priorSd * priorSd / (priorSd * priorSd + se * se);   // Gewicht auf die Beobachtung
  const mittel = priorMittel + w * (beobachtet - priorMittel);
  const sd = Math.sqrt(1 / (1 / (priorSd * priorSd) + 1 / (se * se)));
  const z = beobachtet / se;
  return {
    beobachtet, se, priorSd, priorMittel,
    z, pEinseitigNull: 1 - cdf(z),                              // Rohbefund gegen mu = 0
    konfidenz95: [beobachtet - quantil(0.975) * se, beobachtet + quantil(0.975) * se],
    gewichtBeobachtung: w,
    posteriorMittel: mittel, posteriorSd: sd,
    posterior90: [mittel + quantil(0.05) * sd, mittel + quantil(0.95) * sd],
    pPositiv: 1 - cdf((0 - mittel) / sd),
    pUeber2: 1 - cdf((2 - mittel) / sd),
    pUeber4: 1 - cdf((4 - mittel) / sd)
  };
}
// Zwei disjunkte Fenster, Beobachtung mit Inverse-Varianz-Gewicht zusammengelegt
function rueckblickKombiniert(beobA, seA, beobB, seB) {
  const wa = 1 / (seA * seA), wb = 1 / (seB * seB);
  return { beobachtet: (wa * beobA + wb * beobB) / (wa + wb), se: Math.sqrt(1 / (wa + wb)) };
}

// ---------------------------------------------------------------- Gesamtrechnung
function szenarienBauen(o) {
  o = o || {};
  const s = {};
  for (const k of Object.keys(o.teSzenarien || TE_SZENARIEN)) s[k] = { te: (o.teSzenarien || TE_SZENARIEN)[k], herkunft: 'Voreinstellung' };
  let rb = null;
  try { rb = rueckblickLesen(o.rueckblickDatei); } catch (e) { rb = null; s._warnung = 'Rückblick nicht lesbar: ' + e.message; }
  if (rb) {
    s['rückblick-A'] = { te: rb['A-187'].tePa, herkunft: rb['A-187'].herkunft };
    s['rückblick-B'] = { te: rb['B-187'].tePa, herkunft: rb['B-187'].herkunft };
    s['rückblick'] = { te: rb.gepoolt.tePa, herkunft: rb.gepoolt.herkunft };
  }
  return { szenarien: s, rueckblick: rb };
}

function berechneAlles(o) {
  o = o || {};
  const schnell = !!o.schnell, f = schnell ? 0.1 : 1;
  const sb = szenarienBauen(o);
  const sz = sb.szenarien, namen = Object.keys(sz).filter(k => k[0] !== '_');
  const R = { eingaben: { alpha: ALPHA, macht: MACHT, szenarien: sz, muListe: MU_LISTE, tMonate: T_MONATE,
    beobachtet: BEOBACHTET, priorSd: PRIOR_SD, vol: VOL, schnell }, mde: {}, dauer: {}, trennschaerfe: {},
    verteilung: {}, rueckstand: {}, drawdown: {}, sprt: {}, cs: {}, rueckblick: {} };
  for (const k of namen) {
    const te = sz[k].te;
    R.mde[k] = { einseitig: {}, zweiseitig: {} };
    for (const t of T_MONATE) {
      R.mde[k].einseitig[t] = mde(t, te, { einseitig: true });
      R.mde[k].zweiseitig[t] = mde(t, te, { einseitig: false });
    }
    R.dauer[k] = {};
    R.trennschaerfe[k] = {};
    for (const mu of MU_LISTE) {
      const e = dauerJahre(mu, te, { einseitig: true }), z = dauerJahre(mu, te, { einseitig: false });
      R.dauer[k][mu] = { einseitigJahre: e, einseitigMonate: e * 12, zweiseitigJahre: z, zweiseitigMonate: z * 12 };
      R.trennschaerfe[k][mu] = {};
      for (const t of T_TRENN) R.trennschaerfe[k][mu][t] = trennschaerfe(mu, te, t);
    }
    // (4) Verteilung des Abstands
    R.verteilung[k] = {};
    for (const mu of [7, 0, -2]) {
      R.verteilung[k][mu] = {};
      for (const n of [3, 6, 12, 24]) {
        R.verteilung[k][mu][n] = {
          normal: verteilungAbstandExakt(mu, te, n),
          t4: verteilungAbstandMC(mu, te, n, { verteilung: 't4', pfade: Math.round(40000 * f) || 4000, seed: 5 })
        };
      }
    }
    // (5) Rückstand
    R.rueckstand[k] = {};
    for (const mu of [7, 0, -2]) {
      R.rueckstand[k][mu] = { n: [6, 12, 24], x: [5, 10, 20],
        wkeit: rueckstandTabelle(mu, te, [6, 12, 24], [5, 10, 20], { pfade: Math.round(20000 * f) || 2000 }) };
    }
    // (6) Sequentiell
    const g = sprtGrenzen(7, te);
    R.sprt[k] = { grenzen: { lnA: g.lnA, lnB: g.lnB, achseOben: g.achseOben, achseUnten: g.achseUnten,
      steigung: g.steigung, erwarteteDauerH1: g.erwarteteDauerH1, erwarteteDauerH0: g.erwarteteDauerH0 },
      h0: sprtMC(0, 7, te, { pfade: Math.round(4000 * f) || 400 }),
      h1: sprtMC(7, 7, te, { pfade: Math.round(4000 * f) || 400 }) };
    R.cs[k] = { nStern: 36, rho2: csRho2(36, ALPHA), deterministischMonate: csZeitDeterministisch(7, te, { maxMonate: 1200 }),
      mc: csMC(7, te, { pfade: Math.round(3000 * f) || 300, maxMonate: 600 }) };
  }
  // Drawdown (unabhängig von Szenarien)
  for (const sg of VOL.buch) {
    R.drawdown[sg] = {};
    for (const mb of [0, 8, 15]) {
      R.drawdown[sg][mb] = { n: [12, 24, 60], d: [20, 30, 40],
        wkeit: drawdownTabelle(sg, mb, [12, 24, 60], [20, 30, 40], { pfade: Math.round(10000 * f) || 1000 }) };
    }
  }
  R.eingaben.teAusVol = {};
  for (const sg of VOL.buch) R.eingaben.teAusVol[sg] = teAusVol(sg, VOL.sp, VOL.korr);
  // Rückblick: Zufallsunsicherheit
  if (sb.rueckblick) {
    for (const lauf of ['A-187', 'B-187']) {
      const rb = sb.rueckblick[lauf];
      R.rueckblick[lauf] = { daten: rb, schrumpfung: {} };
      for (const ps of [2, 3, 5, 10])
        R.rueckblick[lauf].schrumpfung[ps] = rueckblickZufallsunsicherheit(BEOBACHTET[lauf], rb.sePa, ps, 0);
    }
    const kb = rueckblickKombiniert(BEOBACHTET['A-187'], sb.rueckblick['A-187'].sePa, BEOBACHTET['B-187'], sb.rueckblick['B-187'].sePa);
    R.rueckblick.kombiniert = { eingabe: kb, schrumpfung: {} };
    for (const ps of [2, 3, 5, 10]) R.rueckblick.kombiniert.schrumpfung[ps] = rueckblickZufallsunsicherheit(kb.beobachtet, kb.se, ps, 0);
  }
  return R;
}

// ---------------------------------------------------------------- Ausgabe
function de(x, d) {
  if (x == null || Number.isNaN(x)) return '-';
  return Number(x).toFixed(d == null ? 2 : d).replace('.', ',');
}
function proz(x, d) { return de(x * 100, d == null ? 1 : d) + ' %'; }
function tabelle(kopf, zeilen) {
  const alle = [kopf].concat(zeilen);
  const w = kopf.map((_, i) => Math.max.apply(null, alle.map(z => String(z[i]).length)));
  const fmt = z => z.map((c, i) => i === 0 ? String(c).padEnd(w[i]) : String(c).padStart(w[i])).join('  ');
  return [fmt(kopf), w.map(n => '-'.repeat(n)).join('  ')].concat(zeilen.map(fmt)).join('\n');
}
function drucken(R, szenarioDetail) {
  const out = [];
  const p = s => out.push(s == null ? '' : s);
  const namen = Object.keys(R.eingaben.szenarien).filter(k => k[0] !== '_');
  p('VORWÄRTSTEST-RECHNER - Simulation, keine Anlageberatung');
  p('Sicherheit 5 % (ein- und zweiseitig), Trennschärfe 80 %, Monate unabhängig.');
  if (R.eingaben.szenarien._warnung) p('WARNUNG: ' + R.eingaben.szenarien._warnung);
  p();
  p('0. Szenarien (TE in % p. a.)');
  p(tabelle(['Szenario', 'TE', 'Herkunft'], namen.map(k => [k, de(R.eingaben.szenarien[k].te, 1), R.eingaben.szenarien[k].herkunft.slice(0, 70)])));
  p('Zum Vergleich TE aus Volatilitäten (Buch-Vol / S&P ' + R.eingaben.vol.sp + ' % / Korr. ' + de(R.eingaben.vol.korr) + '): ' +
    R.eingaben.vol.buch.map(v => v + ' % -> ' + de(R.eingaben.teAusVol[v], 1) + ' %').join(', '));
  p();
  p('1. Kleinste nachweisbare Überrendite (MDE, Pp p. a.) nach T Monaten');
  for (const seite of ['einseitig', 'zweiseitig']) {
    p('  ' + seite);
    p(tabelle(['Szenario'].concat(T_MONATE.map(t => t + ' M')), namen.map(k => [k].concat(T_MONATE.map(t => de(R.mde[k][seite][t], 1))))));
  }
  p();
  p('2. Nötige Dauer für wahres mu (80 % Trennschärfe), Jahre (Monate)');
  for (const seite of ['einseitig', 'zweiseitig']) {
    p('  ' + seite);
    p(tabelle(['Szenario'].concat(MU_LISTE.map(m => 'mu +' + m)), namen.map(k => [k].concat(MU_LISTE.map(m =>
      de(R.dauer[k][m][seite + 'Jahre'], 1) + ' (' + de(R.dauer[k][m][seite + 'Monate'], 0) + ')')))));
  }
  p();
  p('3. Trennschärfe (einseitig 5 %) nach T Monaten');
  const zeilen3 = [];
  for (const k of namen) for (const m of MU_LISTE) zeilen3.push([k + ' mu +' + m].concat(T_TRENN.map(t => proz(R.trennschaerfe[k][m][t], 0))));
  p(tabelle(['Fall'].concat(T_TRENN.map(t => t + ' M')), zeilen3));
  p();
  p('4. Abstand (Buch minus S&P) nach n Monaten: P(Abstand < 0), Normal | t4 (MC)');
  const zeilen4 = [];
  for (const k of namen) for (const m of [7, 0, -2]) zeilen4.push([k + ' mu ' + (m > 0 ? '+' : '') + m].concat([3, 6, 12, 24].map(n =>
    proz(R.verteilung[k][m][n].normal.pNegativ, 0) + ' | ' + proz(R.verteilung[k][m][n].t4.pNegativ, 0))));
  p(tabelle(['Fall', '3 M', '6 M', '12 M', '24 M'], zeilen4));
  const kd = R.verteilung[szenarioDetail] ? szenarioDetail : 'mittel';
  p();
  p('   Quantile 5/25/50/75/95 % des Abstands (Pp), Szenario ' + kd + ' (Normal; darunter t4)');
  const zeilen4b = [];
  for (const m of [7, 0, -2]) for (const n of [3, 6, 12, 24]) for (const art of ['normal', 't4']) {
    const v = R.verteilung[kd][m][n][art];
    zeilen4b.push(['mu ' + (m > 0 ? '+' : '') + m + ' n=' + n + ' ' + art].concat([5, 25, 50, 75, 95].map(q => de(v.quantile[q], 1))));
  }
  p(tabelle(['Fall', 'q5', 'q25', 'q50', 'q75', 'q95'], zeilen4b));
  p();
  p('5a. P(kumulativer Rückstand erreicht irgendwann <= -x Pp binnen n Monaten), Monatsschritte');
  const zeilen5 = [];
  for (const k of namen) for (const m of [7, 0, -2]) {
    const r = R.rueckstand[k][m];
    const zl = [k + ' mu ' + (m > 0 ? '+' : '') + m];
    r.wkeit.forEach(zeile => zeile.forEach(v => zl.push(proz(v, 0))));
    zeilen5.push(zl);
  }
  const kopf5 = ['Fall'];
  [6, 12, 24].forEach(n => [5, 10, 20].forEach(x => kopf5.push(n + 'M/-' + x)));
  p(tabelle(kopf5, zeilen5));
  p();
  p('5b. Drawdown-Stopp: P(Fall vom Höchststand >= d %), tägliche Schritte');
  const zeilen5b = [];
  for (const sg of R.eingaben.vol.buch) for (const mb of [0, 8, 15]) {
    const r = R.drawdown[sg][mb];
    const zl = ['Vol ' + sg + ' mu ' + mb];
    r.wkeit.forEach(zeile => zeile.forEach(v => zl.push(proz(v, 0))));
    zeilen5b.push(zl);
  }
  const kopf5b = ['Fall'];
  [12, 24, 60].forEach(n => [20, 30, 40].forEach(d => kopf5b.push(n + 'M/' + d + '%')));
  p(tabelle(kopf5b, zeilen5b));
  p();
  p('6a. Wald-SPRT H0 mu=0 gegen H1 mu=7 (alpha 5 %, beta 20 %), Monatsschritte');
  p(tabelle(['Szenario', 'obere Gr. (Pp)', 'untere Gr. (Pp)', 'Steig. Pp/M', 'E[N|H1] Wald', 'E[N|H0] Wald', 'MC H1: Med/Mittel', 'MC H1: Anteil H1', 'MC H0: Med/Mittel', 'MC H0: Anteil H1', 'offen H0/H1'],
    namen.map(k => { const s = R.sprt[k], g = s.grenzen; return [k, de(g.achseOben, 1), de(g.achseUnten, 1), de(g.steigung, 3),
      de(g.erwarteteDauerH1, 0), de(g.erwarteteDauerH0, 0), de(s.h1.medianDauer, 0) + '/' + de(s.h1.mittlereDauer, 0),
      proz(s.h1.anteilH1, 0), de(s.h0.medianDauer, 0) + '/' + de(s.h0.mittlereDauer, 0), proz(s.h0.anteilH1, 1),
      proz(s.h0.anteilOffen, 0) + '/' + proz(s.h1.anteilOffen, 0)]; })));
  p('   Dauern in Monaten; bei "offen" ist die Dauer bei ' + 1200 + ' Monaten abgeschnitten.');
  p();
  p('6b. Konfidenzfolge (Normal-Mischung, rho^2 für n*=36), wahr mu=+7: Monat, in dem die untere Grenze erstmals über 0 liegt');
  p(tabelle(['Szenario', 'ohne Rauschen (M)', 'MC Median (M)', 'MC q25..q75', 'Anteil erreicht (600 M)'],
    namen.map(k => { const c = R.cs[k], m = c.mc; return [k, c.deterministischMonate == null ? '>1200' : String(c.deterministischMonate),
      m.medianMonate == null ? '>' + m.maxMonate : String(m.medianMonate),
      (m.q25Monate == null ? '-' : m.q25Monate) + '..' + (m.q75Monate == null ? '-' : m.q75Monate), proz(m.anteilErreicht, 0)]; })));
  p();
  p('7. Rückblick: Zufallsunsicherheit (Pp p. a.)');
  if (R.rueckblick['A-187']) {
    for (const lauf of ['A-187', 'B-187']) {
      const d = R.rueckblick[lauf].daten;
      p('  ' + lauf + ': beobachtet +' + de(BEOBACHTET[lauf], 1) + ', SE p. a. ' + de(d.sePa, 1) + ' (SD/Periode ' + de(d.sdPeriode, 2) + ', n=' + d.n + ', TE_pa ' + de(d.tePa, 1) + ')');
    }
    const zeilen7 = [];
    for (const lauf of ['A-187', 'B-187', 'kombiniert']) {
      const bl = R.rueckblick[lauf];
      for (const ps of [2, 3, 5, 10]) {
        const s = bl.schrumpfung[ps];
        zeilen7.push([lauf, 'Prior-SD ' + ps, de(s.beobachtet, 1) + '±' + de(s.se, 1), de(s.gewichtBeobachtung, 2),
          de(s.posteriorMittel, 2), de(s.posteriorSd, 2), '[' + de(s.posterior90[0], 1) + '; ' + de(s.posterior90[1], 1) + ']', proz(s.pPositiv, 0), proz(s.pUeber2, 0), proz(s.pUeber4, 0)]);
      }
    }
    p(tabelle(['Lauf', 'Prior', 'beob.±SE', 'Gew.', 'Post.-Mittel', 'Post.-SD', '90 %-Intervall', 'P(>0)', 'P(>2)', 'P(>4)'], zeilen7));
    p('  Herkunft: ' + R.rueckblick['A-187'].daten.herkunft);
    p('  Beobachtete Werte (+7,3 / +8,3) sind Vorgabe des Auftrags; "kombiniert" = Inverse-Varianz der disjunkten Fenster A und B.');
  } else p('  (Rückblick-Datei nicht lesbar)');
  p();
  p('Alles Simulation, keine Anlageberatung.');
  return out.join('\n');
}

function cli(argv) {
  const json = argv.includes('--json');
  const sz = (argv.find(a => a.startsWith('--szenario=')) || '').slice(11);
  const R = berechneAlles({ schnell: argv.includes('--schnell') });
  if (json) {
    fs.writeFileSync(path.join(__dirname, 'ergebnis.json'), JSON.stringify(R, null, 1) + '\n');
    console.log('ergebnis.json geschrieben.');
  } else console.log(drucken(R, sz));
}

module.exports = {
  TE_SZENARIEN, MU_LISTE, T_MONATE, ALPHA, MACHT,
  erf, cdf, dichte, quantil, rng,
  mde, dauerJahre, trennschaerfe,
  verteilungAbstandExakt, verteilungAbstandMC,
  minTreffer, rueckstandWkeitExakt, rueckstandTabelle, rueckstandWkeit,
  drawdownTabelle, drawdownWkeit, fallVomStartExakt, teAusVol,
  sprtGrenzen, sprtMC, csRho2, csRadius, csRadiusPa, csZeitDeterministisch, csMC,
  rueckblickLesen, rueckblickZufallsunsicherheit, rueckblickKombiniert,
  szenarienBauen, berechneAlles, drucken
};

if (require.main === module) cli(process.argv.slice(2));
