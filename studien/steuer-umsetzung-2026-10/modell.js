'use strict';
/*
 * Steuer-Umsetzungsmodell (Auftrag "Steuer-Umsetzung 2026-10"), UNABHAENGIG von der
 * lokalen Steuerrechnung des Projekts (Auftrag Nr. 82). Keine Abhaengigkeiten.
 *
 * MODELLRECHNUNG, KEINE STEUER- ODER ANLAGEBERATUNG. Vereinfachungen siehe
 * pruefberichte/2026-10-steuer-umsetzung.md, Abschnitt "Grenzen".
 *
 * Gerechnet wird in EUR. Drei Vermoegen aus demselben Startkapital:
 *   (a) Einzelaktienbuch (USD-Aktien im deutschen Depot, Positionen als Lose, Aktienverlusttopf,
 *       Dividenden mit US-Quellensteuer und Anrechnung, Waehrung ueber den Euro-Kurs je Los)
 *   (b) thesaurierender UCITS-Momentum-ETF   (c) thesaurierender UCITS-S&P-500-ETF
 *       (Teilfreistellung, Vorabpauschale mit amtlichem Basiszins, Gewinn minus Vorabpauschalen)
 * Zeit: Segmente zwischen Umschichtungstagen (alle 3 Monate), Jahreswechseln und Ende.
 * Renditen kommen als Kalenderjahres-Logrenditen ("Pfadform") und werden mit einer Verschiebung
 * so geeicht, dass die Rechnung OHNE Steuer die vorgegebene Gesamtrendite trifft.
 */

const TAG = 86400000;

function datum(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function plusMonate(ms, n) { const t = new Date(ms); return Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + n, t.getUTCDate()); }
function jahrVon(ms) { return new Date(ms).getUTCFullYear(); }

/* ---------- Steuersatz ---------- */
// Abgeltungsteuer 25 % zzgl. 5,5 % Soli darauf = 26,375 %. Mit Kirchensteuersatz k (0,08 / 0,09)
// mindert sich die Bemessung: Steuer = 25 % / (1 + 0,25 k); Soli = 5,5 % davon; KiSt = k davon.
function steuersatz(kirche) {
  const k = kirche || 0;
  const est = 0.25 / (1 + 0.25 * k);
  return est * (1 + 0.055 + k);
}

/* ---------- Zufall (gemeinsame Zufallszahlen fuer alle Szenarien) ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(rnd) {
  let u = 0; while (u === 0) u = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

/* ---------- Zeitraster ---------- */
function raster(von, bis, umschichtMonate) {
  const v = datum(von), b = datum(bis);
  const rebal = new Set(), jw = new Set();
  for (let k = 0; ; k++) { const t = plusMonate(v, k * umschichtMonate); if (t >= b) break; rebal.add(t); }
  for (let y = jahrVon(v) + 1; y <= jahrVon(b); y++) { const t = Date.UTC(y, 0, 1); if (t > v && t < b) jw.add(t); }
  const pts = [...new Set([v, b, ...rebal, ...jw])].sort((x, y) => x - y);
  const segs = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const t0 = pts[i], t1 = pts[i + 1];
    segs.push({ t0, t1, jahr: jahrVon(t0), tage: (t1 - t0) / TAG, jahresEnde: jw.has(t1), rebal: rebal.has(t1), ende: t1 === b });
  }
  const spanTage = {};
  for (const s of segs) spanTage[s.jahr] = (spanTage[s.jahr] || 0) + s.tage;
  return { von: v, bis: b, segs, spanTage, jahre: (b - v) / TAG / 365.25 };
}

/* ---------- Renditepfade ---------- */
// serie: { jahr: Gesamtrendite im Fenster-Teil des Kalenderjahres, z. B. 0.0688 }
function logPfad(serie) { const o = {}; for (const y of Object.keys(serie)) o[y] = Math.log(1 + serie[y]); return o; }
function segLog(R, logJahr, seg, verschiebung) {
  return (logJahr[seg.jahr] || 0) * seg.tage / R.spanTage[seg.jahr] + (verschiebung || 0) * seg.tage / 365.25;
}
// EUR je USD-Kurs (Dollar je Euro) an einem Tag, log-linear zwischen Ankern
function fxKurs(R, anker, ms) {
  const a = anker;
  if (ms <= a[0].t) return a[0].kurs;
  for (let i = 0; i + 1 < a.length; i++) {
    if (ms <= a[i + 1].t) {
      const f = (ms - a[i].t) / (a[i + 1].t - a[i].t);
      return Math.exp(Math.log(a[i].kurs) * (1 - f) + Math.log(a[i + 1].kurs) * f);
    }
  }
  return a[a.length - 1].kurs;
}

/* ---------- Steuerkonto (ein Jahr, Aktientopf getrennt) ---------- */
function Konto(P, satz) {
  this.P = P; this.satz = satz;
  this.vortrag = 0;            // Aktienverlusttopf aus Vorjahren
  this.jahr = null; this.neuesJahr(null);
  this.gezahlt = 0; this.summe = 0;
}
Konto.prototype.neuesJahr = function (y) {
  this.jahr = y; this.aktienNetto = 0; this.div = 0; this.quelle = 0; this.fonds = 0; this.gezahltJahr = 0;
};
Konto.prototype.jahresWechsel = function (y) {
  // Verlusttopf fortschreiben (Verluste aus Aktien nur mit Aktiengewinnen verrechenbar)
  if (this.aktienNetto >= 0) this.vortrag = Math.max(0, this.vortrag - this.aktienNetto);
  else this.vortrag += -this.aktienNetto;
  this.neuesJahr(y);
};
Konto.prototype.freibetrag = function () {
  const f = this.P.freibetrag; return f[this.jahr] != null ? f[this.jahr] : f.standard;
};
Konto.prototype.schuld = function () {
  const aktien = Math.max(0, this.aktienNetto - this.vortrag);
  const fonds = Math.max(0, this.fonds);
  const basis = Math.max(0, aktien + this.div + fonds - this.freibetrag());
  const roh = basis * this.satz;
  const kapital = aktien + this.div + fonds;
  const divAnteil = kapital > 0 ? this.div / kapital : 0;
  const anrechnung = Math.min(this.quelle, roh * divAnteil);
  return roh - anrechnung;
};
// Faelligkeit jetzt: Gesamtschuld des laufenden Jahres minus schon Gezahltes (negativ = Erstattung)
Konto.prototype.faellig = function () {
  const f = this.schuld() - this.gezahltJahr;
  this.gezahltJahr += f; this.gezahlt += f;
  return f;
};

/* ---------- Eingangsdaten ---------- */
function eurStart(F) { return F.startUSD / F.fx.anker[0].kurs; }

/* ---------- (a) Einzelaktienbuch ---------- */
function simBuchMitEnde(P, F, R, Z, opt) {
  const o = Object.assign({ steuer: true, kirche: 0, umschlag: P.buch.umschlagWert, kostenBp: P.buch.kostenBp,
    fxBp: P.buch.devisenBp, fxFaktor: 1, verschiebung: 0, _ohneVerkauf: false }, opt || {});
  const satz = o.steuer ? steuersatz(o.kirche) : 0;
  const konto = new Konto(o.steuer ? P : Object.assign({}, P, { freibetrag: { standard: 0 } }), satz);
  const cs = (o.kostenBp + o.fxBp) / 10000;
  const N = P.buch.positionen, sigma = P.buch.sigmaQuartal, whtSatz = P.dividende.quellensteuerUS;
  const q = P.buch.dividendenrendite;
  const logJ = logPfad(F.buchPfad);
  const anker = F.fx.anker.map(x => ({ t: x.t, kurs: x.kurs }));
  anker[anker.length - 1].kurs *= o.fxFaktor;
  const fx = ms => fxKurs(R, anker, ms);
  const K0 = eurStart(F);
  let kostenEUR = 0, verkaeufe = 0, kaeufe = 0, umsatzEUR = 0, rebalZahl = 0;
  let pos = [], kasse = 0; const vorEnde = {};
  const kaufen = (betrag, t, slot) => {
    const f = fx(t);
    kostenEUR += betrag * cs; umsatzEUR += betrag; kaeufe++;
    return { v: betrag * (1 - cs) * f, b: betrag, hist: [], slot };
  };
  for (let i = 0; i < N; i++) pos.push(kaufen(K0 / N, R.von, i));
  rebalZahl++;
  konto.neuesJahr(jahrVon(R.von));
  for (let si = 0; si < R.segs.length; si++) {
    const sg = R.segs[si];
    if (jahrVon(sg.t0) !== konto.jahr) konto.jahresWechsel(jahrVon(sg.t0));
    const gl = segLog(R, logJ, sg, o.verschiebung + F.buchEichung);
    const Gp = Math.exp(gl) - q * sg.tage / 365.25;
    const f1 = fx(sg.t1);
    const sd = sigma * Math.sqrt(sg.tage / 91.31);
    const wsum = pos.reduce((s, p) => s + p.v, 0);
    const raw = pos.map(p => sd * Z.idio[si][p.slot]);
    const mw = pos.reduce((s, p, i) => s + p.v / wsum * raw[i], 0);
    for (let i = 0; i < pos.length; i++) {
      const rel = raw[i] - mw;
      pos[i].v *= Math.max(0.05, Gp + rel);
      pos[i].hist.push(rel); if (pos[i].hist.length > 4) pos[i].hist.shift();
    }
    const divEUR = q * sg.tage / 365.25 * wsum / f1, wht = divEUR * whtSatz;
    konto.div += divEUR; konto.quelle += wht;
    kasse += divEUR - wht - konto.faellig();
    if (!(sg.rebal || sg.ende)) continue;
    if (sg.ende && o._ohneVerkauf) {
      const markt = pos.reduce((s, p) => s + p.v / f1, 0) + kasse;
      return { endOhneVerkauf: markt, steuerGezahlt: konto.gezahlt, kostenEUR, kaeufe, verkaeufe, rebalZahl, umsatzEUR,
        jahre: R.jahre, latent: pos.reduce((s, p) => s + Math.max(0, p.v / f1 * (1 - cs) - p.b), 0) };
    }
    if (sg.ende) { vorEnde.kosten = kostenEUR; vorEnde.verk = verkaeufe; vorEnde.kaeufe = kaeufe; }
    const Vtot = pos.reduce((s, p) => s + p.v / f1, 0);
    const ziel = sg.ende ? Infinity : o.umschlag * Vtot;
    const idx = pos.map((p, i) => ({ i, s: p.hist.reduce((a, b) => a + b, 0) + P.buch.auswahlRauschen * sigma * Z.sel[si][p.slot] }))
      .sort((x, y) => x.s - y.s);
    const raus = []; let verk = 0;
    for (const e of idx) {
      if (!sg.ende && verk >= ziel) break;
      if (!sg.ende && raus.length >= pos.length - 1) break;
      raus.push(e.i); verk += pos[e.i].v / f1;
    }
    let erloes = 0;
    for (const i of raus) {
      const brutto = pos[i].v / f1, kost = brutto * cs;
      kostenEUR += kost; umsatzEUR += brutto; verkaeufe++;
      konto.aktienNetto += brutto - kost - pos[i].b;
      erloes += brutto - kost;
    }
    kasse += erloes - konto.faellig();
    const slots = raus.map(i => pos[i].slot);
    pos = pos.filter((_, i) => !raus.includes(i));
    if (sg.ende) {
      return { endMitVerkauf: kasse, steuerGezahlt: konto.gezahlt, kostenEUR, kaeufe, verkaeufe, rebalZahl, umsatzEUR, jahre: R.jahre, vorEnde };
    }
    rebalZahl++;
    if (raus.length) {
      const je = kasse / raus.length;
      for (const sl of slots) pos.push(kaufen(je, sg.t1, sl));
      kasse = 0;
    }
  }
  throw new Error('Raster endet nicht mit "ende"');
}

/* ---------- (b)/(c) thesaurierender ETF ---------- */
function simEtf(P, F, R, etf, opt) {
  const o = Object.assign({ steuer: true, kirche: 0, fxFaktor: 1, verschiebung: 0, ohneVerkauf: false }, opt || {});
  const satz = o.steuer ? steuersatz(o.kirche) : 0;
  const konto = new Konto(o.steuer ? P : Object.assign({}, P, { freibetrag: { standard: 0 } }), satz);
  const logJ = logPfad(etf.pfad);
  const anker = F.fx.anker.map(x => ({ t: x.t, kurs: x.kurs }));
  anker[anker.length - 1].kurs *= o.fxFaktor;
  const fx = ms => fxKurs(R, anker, ms);
  const K0 = eurStart(F), cE = etf.kaufBp / 10000, cV = etf.verkaufBp / 10000;
  const tf = P.etf.teilfreistellung;
  let V = K0 * (1 - cE), basis = K0, vpSumme = 0, Vjahr = V, vpGezahlt = 0;
  let kaufMonat = new Date(R.von).getUTCMonth(); // 0-basiert
  let erstesJahr = true;
  konto.neuesJahr(jahrVon(R.von));
  for (const sg of R.segs) {
    if (jahrVon(sg.t0) !== konto.jahr) {
      // Jahreswechsel: Vorabpauschale fuer das Vorjahr, gezogen im neuen Jahr
      const y = konto.jahr;
      const monate = erstesJahr ? 12 - kaufMonat : 12;
      const bz = P.etf.basiszins[y] != null ? P.etf.basiszins[y] : 0;
      const vpRoh = Math.max(0, Math.min(V - Vjahr, 0.7 * Math.max(0, bz) * Vjahr * monate / 12));
      konto.jahresWechsel(jahrVon(sg.t0));
      konto.fonds += vpRoh * (1 - tf);
      const tax = konto.faellig();
      vpSumme += vpRoh; vpGezahlt += tax;
      if (tax > 0) { const fr = tax / V; V -= tax; basis *= 1 - fr; vpSumme *= 1 - fr; }
      Vjahr = V; erstesJahr = false;
    }
    const f0 = fx(sg.t0), f1 = fx(sg.t1);
    const gl = segLog(R, logJ, sg, o.verschiebung) - (etf.ter + etf.fondsQuellensteuer) * sg.tage / 365.25;
    V *= Math.exp(gl) * (f0 / f1);
  }
  const markt = V;
  const verk = V * (1 - cV);
  const gewinn = verk - basis - vpSumme;
  konto.fonds += Math.max(0, gewinn) * (1 - tf);
  const tax = konto.faellig();
  return { endMitVerkauf: verk - tax, endOhneVerkauf: markt, steuerGezahlt: konto.gezahlt, vpSteuer: vpGezahlt, latent: Math.max(0, gewinn) * (1 - tf) * satz, jahre: R.jahre };
}

/* ---------- Eichung: Rendite OHNE Steuer trifft das vorgegebene Ergebnis ---------- */
function bisekt(fn, lo, hi, ziel, iter) {
  for (let i = 0; i < (iter || 60); i++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) < ziel) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function zufall(R, trials, seed, nMax) {
  const rnd = mulberry32(seed), out = [];
  for (let m = 0; m < trials; m++) {
    const idio = [], sel = [];
    for (let s = 0; s < R.segs.length; s++) {
      const a = [], b = [];
      for (let k = 0; k < nMax; k++) { a.push(normal(rnd)); b.push(normal(rnd)); }
      idio.push(a); sel.push(b);
    }
    out.push({ idio, sel });
  }
  return out;
}

function mittel(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function quantil(a, p) { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

// Bereitet ein Fenster vor: Raster, Zufall, Eichung von Buch und ETF-Pfaden
function fensterVorbereiten(P, F, trials) {
  const R = raster(F.von, F.bis, P.buch.umschichtMonate);
  const Z = zufall(R, trials || P.trials, P.seed, P.buch.positionen);
  const F2 = Object.assign({}, F, { buchEichung: 0 });
  // Buch: Eichung auf Gesamtertrag (Ziel) ohne Steuer, mit Kosten 20 Bp
  const K0 = eurStart(F2);
    const fxEnd = F.fx.anker[F.fx.anker.length - 1].kurs;
  // Ohne Steuer ist das Buchergebnis in EUR; Ziel in USD: endUSD = (1+Gesamt) * startUSD -> EUR: / fxEnd
  const zielEUR = F.startUSD * (1 + F.buchGesamt) / fxEnd;
  const lauf = e => mittel(Z.map(z => simBuchMitEnde(P, Object.assign({}, F2, { buchEichung: e }), R, z, { steuer: false }).endMitVerkauf));
  F2.buchEichung = bisekt(lauf, -0.5, 0.8, zielEUR, 40);
  const etfe = {};
  for (const k of Object.keys(F.etf)) {
    const e = F.etf[k];
    const roh = Object.assign({}, e);
    // Eichung ohne Steuer und ohne Handelskosten. zielArt 'brutto': Ziel gilt vor TER und Fondssteuer
    // (z. B. S&P-500-Gesamtertrag); 'nettoFonds': Ziel ist die veroeffentlichte Fondsrendite (nach TER).
    // basis 'EUR': Ziel schon in Euro (Euro-Kurs steckt drin); sonst Dollar.
    const cal = Object.assign({}, e, { kaufBp: 0, verkaufBp: 0 });
    if (e.zielArt !== 'nettoFonds') { cal.ter = 0; cal.fondsQuellensteuer = 0; }
    const zielE = e.basis === 'EUR' ? eurStart(F2) * (1 + e.gesamt) : F.startUSD * (1 + e.gesamt) / fxEnd;
    const fnE = v => simEtf(P, F2, R, cal, { steuer: false, verschiebung: v }).endMitVerkauf;
    roh.verschiebung = bisekt(fnE, -0.5, 0.8, zielE, 50);
    etfe[k] = roh;
  }
  return { P, F: F2, R, Z, etf: etfe };
}

// Ein Szenario: liefert Endvermoegen (a)/(b)/(c)
function rechneSzenario(W, opt) {
  const o = Object.assign({}, opt || {});
  const { P, F, R, Z, etf } = W;
  const res = {};
  const mitV = Z.map(z => simBuchMitEnde(P, F, R, z, o));
  const ohneV = Z.map(z => simBuchMitEnde(P, F, R, z, Object.assign({}, o, { _ohneVerkauf: true })));
  res.a = {
    endMitVerkauf: mittel(mitV.map(r => r.endMitVerkauf)),
    p10: quantil(mitV.map(r => r.endMitVerkauf), 0.1), p90: quantil(mitV.map(r => r.endMitVerkauf), 0.9),
    endOhneVerkauf: mittel(ohneV.map(r => r.endOhneVerkauf)),
    steuer: mittel(mitV.map(r => r.steuerGezahlt)),
    kostenUSD: mittel(mitV.map(r => r.vorEnde.kosten)) * (F.fx.anker[0].kurs + F.fx.anker[F.fx.anker.length - 1].kurs) / 2, // ohne Schlussverkauf, grob in USD
    kaeufe: mittel(mitV.map(r => r.vorEnde.kaeufe)), verkaeufe: mittel(mitV.map(r => r.vorEnde.verk)),
    umsatzJahrAnteil: mittel(mitV.map(r => r.umsatzEUR)) / eurStart(F) / R.jahre
  };
  for (const k of Object.keys(etf)) {
    const r = simEtf(P, F, R, etf[k], Object.assign({}, o, { verschiebung: etf[k].verschiebung }));
    res[k] = { endMitVerkauf: r.endMitVerkauf, endOhneVerkauf: r.endOhneVerkauf, steuer: r.steuerGezahlt, vpSteuer: r.vpSteuer, latent: r.latent };
  }
  return res;
}

// Vorsprung vor Steuern, den (a) braucht: Verschiebung d (p. a., log), so dass (a) nach Steuer = ETF nach Steuer
function schwelle(W, etfName, opt) {
  const { P, F, R, Z, etf } = W;
  const ziel = rechneSzenario(W, opt)[etfName].endMitVerkauf;
  const o = Object.assign({}, opt || {});
  const fn = d => mittel(Z.map(z => simBuchMitEnde(P, F, R, z, Object.assign({}, o, { verschiebung: d })).endMitVerkauf));
  const d = bisekt(fn, -0.3, 0.6, ziel, 40);
  const vor = x => mittel(Z.map(z => simBuchMitEnde(P, F, R, z, Object.assign({}, o, { steuer: false, verschiebung: x })).endMitVerkauf));
  const K0 = eurStart(F);
  const cagr = e => Math.pow(e / K0, 1 / R.jahre) - 1;
  const buchVor = cagr(vor(d)), buchVorIst = cagr(vor(0));
  const etfVor = cagr(simEtf(P, F, R, etf[etfName], { steuer: false, verschiebung: etf[etfName].verschiebung, fxFaktor: o.fxFaktor || 1 }).endMitVerkauf);
  return { verschiebung: d, buchVorSteuerNoetig: buchVor, buchVorSteuerIst: buchVorIst, etfVorSteuer: etfVor,
    vorsprungNoetig: buchVor - etfVor, vorsprungIst: buchVorIst - etfVor };
}

module.exports = { steuersatz, raster, datum, simBuchMitEnde, simEtf, Konto, fensterVorbereiten, rechneSzenario, schwelle,
  eurStart, fxKurs, mittel, bisekt, logPfad, segLog };
