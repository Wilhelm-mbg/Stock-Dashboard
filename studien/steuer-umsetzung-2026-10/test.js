'use strict';
// Tests des Steuer-Umsetzungsmodells: Handrechnungen gegen den Code. Aufruf: node test.js
const M = require('./modell.js');
let ok = 0, fehl = 0;
function ist(name, bed, info) { if (bed) ok++; else { fehl++; console.log('FEHLER: ' + name + (info ? ' -> ' + info : '')); } }
function nah(name, a, b, tol) { ist(name, Math.abs(a - b) <= (tol == null ? 1e-6 : tol) * Math.max(1, Math.abs(b)), a + ' != ' + b); }

const tau = 0.26375;

/* Steuersatz */
nah('Satz ohne Kirche', M.steuersatz(0), 0.26375, 1e-9);
nah('Satz KiSt 8 %', M.steuersatz(0.08), 0.2782, 1e-3);
nah('Satz KiSt 9 %', M.steuersatz(0.09), 0.2799, 1e-3);

/* Konto */
const PK = { freibetrag: { standard: 1000, 2022: 801 } };
{
  const k = new M.Konto(PK, tau); k.neuesJahr(2024);
  k.aktienNetto = 10000;
  nah('Gewinn 10000, Pauschbetrag 1000', k.faellig(), 9000 * tau, 1e-9);
  k.aktienNetto = 0; // Gewinn weg -> Erstattung
  nah('Erstattung wenn Gewinn verschwindet', k.faellig(), -9000 * tau, 1e-9);
}
{
  const k = new M.Konto({ freibetrag: { standard: 0 } }, tau); k.neuesJahr(2023);
  k.aktienNetto = -5000; k.jahresWechsel(2024);
  ist('Verlustvortrag 5000', k.vortrag === 5000);
  k.aktienNetto = 8000;
  nah('Gewinn 8000 nach Vortrag 5000', k.faellig(), 3000 * tau, 1e-9);
  k.jahresWechsel(2025);
  ist('Vortrag verbraucht', k.vortrag === 0);
}
{
  const k = new M.Konto({ freibetrag: { standard: 0 } }, tau); k.neuesJahr(2024);
  k.div = 1000; k.quelle = 150;
  nah('Dividende 1000, QSt 150 angerechnet', k.faellig(), 1000 * tau - 150, 1e-9);
  const k2 = new M.Konto({ freibetrag: { standard: 2000 } }, tau); k2.neuesJahr(2024);
  k2.div = 1000; k2.quelle = 150;
  nah('Dividende unter Pauschbetrag: keine Steuer, QSt verfaellt', k2.faellig(), 0, 1e-9);
  const k3 = new M.Konto({ freibetrag: { standard: 0 } }, tau); k3.neuesJahr(2024);
  k3.aktienNetto = -3000; k3.div = 1000; k3.quelle = 150;
  nah('Aktienverlust mindert Dividende nicht', k3.faellig(), 1000 * tau - 150, 1e-9);
}

/* Raster */
{
  const R = M.raster('2021-09-16', '2026-09-15', 3);
  const reb = R.segs.filter(s => s.rebal).length + 1;
  ist('20 Umschichtungen inkl. Erstkauf in 5 Jahren', reb === 20, String(reb));
  nah('Jahre', R.jahre, 5, 1e-3);
  ist('Segmente enden im Jahreswechsel oder Umschichtung', R.segs.every(s => s.jahresEnde || s.rebal || s.ende));
  const R2 = M.raster('2017-01-04', '2021-09-15', 3);
  ist('19 Umschichtungen im alten Fenster', R2.segs.filter(s => s.rebal).length + 1 === 19, String(R2.segs.filter(s => s.rebal).length + 1));
}

/* Gemeinsame Bausteine fuer Modelltests */
function P0(extra) {
  return Object.assign({
    seed: 7, trials: 20,
    freibetrag: { standard: 1000 },
    buch: { positionen: 10, sigmaQuartal: 0, auswahlRauschen: 0, umschlagWert: 0, kostenBp: 0, devisenBp: 0, dividendenrendite: 0, umschichtMonate: 3 },
    dividende: { quellensteuerUS: 0.15 },
    etf: { teilfreistellung: 0.3, basiszins: { 2023: 0.0255, 2024: 0.0229 } }
  }, extra || {});
}
function F0(over) {
  return Object.assign({
    von: '2023-01-02', bis: '2024-12-30', startUSD: 100000,
    fx: { anker: [{ t: M.datum('2023-01-02'), kurs: 1 }, { t: M.datum('2024-12-30'), kurs: 1 }] },
    buchPfad: { 2023: 0.10, 2024: 0.10 }, buchGesamt: 0.21, buchEichung: 0,
    etf: { c: { pfad: { 2023: 0.10, 2024: 0.10 }, ter: 0, fondsQuellensteuer: 0, kaufBp: 0, verkaufBp: 0, gesamt: 0.21 } }
  }, over || {});
}

/* Buch: Kaufen und Halten ohne Kosten, ohne Rauschen, ohne Dividende */
{
  const P = P0(), F = F0();
  const R = M.raster(F.von, F.bis, 3);
  const Z = [{ idio: R.segs.map(() => Array(10).fill(0)), sel: R.segs.map(() => Array(10).fill(0)) }];
  const r = M.simBuchMitEnde(P, F, R, Z[0], {});
  // Gesamtertrag laut Pfad: je Jahr-Anteil exp(log(1.1)*tage/span) -> Produkt 1.21
  const wert = 100000 * 1.21;
  nah('Kaufen+Halten brutto 21 %', r.endMitVerkauf, wert - (wert - 100000 - 1000) * tau, 1e-6);
  ist('keine Verkaeufe ausser Schluss', r.verkaeufe === 10, String(r.verkaeufe));
  const rn = M.simBuchMitEnde(P, F, R, Z[0], { steuer: false });
  nah('ohne Steuer = Marktwert', rn.endMitVerkauf, wert, 1e-6);
  const ro = M.simBuchMitEnde(P, F, R, Z[0], { _ohneVerkauf: true });
  nah('ohne Verkauf = Marktwert', ro.endOhneVerkauf, wert, 1e-6);
}
/* Buch: Kosten 20 Bp je Seite wirken bei Kauf und Verkauf */
{
  const P = P0({ buch: { positionen: 10, sigmaQuartal: 0, auswahlRauschen: 0, umschlagWert: 0, kostenBp: 20, devisenBp: 0, dividendenrendite: 0, umschichtMonate: 3 } });
  const F = F0(), R = M.raster(F.von, F.bis, 3);
  const Z = { idio: R.segs.map(() => Array(10).fill(0)), sel: R.segs.map(() => Array(10).fill(0)) };
  const r = M.simBuchMitEnde(P, F, R, Z, { steuer: false });
  nah('Kosten beidseitig', r.endMitVerkauf, 100000 * 0.998 * 1.21 * 0.998, 1e-9);
}
/* Buch: Verlust -> keine Steuer */
{
  const P = P0(), F = F0({ buchPfad: { 2023: -0.1, 2024: -0.1 } });
  const R = M.raster(F.von, F.bis, 3);
  const Z = { idio: R.segs.map(() => Array(10).fill(0)), sel: R.segs.map(() => Array(10).fill(0)) };
  const r = M.simBuchMitEnde(P, F, R, Z, {});
  nah('Verlust: keine Steuer', r.steuerGezahlt, 0, 1e-9);
  nah('Verlust: Endwert', r.endMitVerkauf, 100000 * 0.81, 1e-6);
}
/* Buch: Euro-Kurs. Dollar steigt 0 %, Euro-Kurs sinkt von 1.25 auf 1.00 -> EUR-Gewinn groesser */
{
  const P = P0(); const t0 = M.datum('2023-01-02'), t1 = M.datum('2024-12-30');
  const F = F0({ buchPfad: { 2023: 0, 2024: 0 }, fx: { anker: [{ t: t0, kurs: 1.25 }, { t: t1, kurs: 1.0 }] } });
  const R = M.raster(F.von, F.bis, 3);
  const Z = { idio: R.segs.map(() => Array(10).fill(0)), sel: R.segs.map(() => Array(10).fill(0)) };
  const r = M.simBuchMitEnde(P, F, R, Z, {});
  const K0 = 100000 / 1.25, ende = 100000 / 1.0;
  nah('Waehrungsgewinn wird besteuert', r.endMitVerkauf, ende - (ende - K0 - 1000) * tau, 1e-6);
}
/* Buch: Dividenden mit Quellensteuer, ohne Kursgewinn */
{
  const P = P0({ buch: { positionen: 10, sigmaQuartal: 0, auswahlRauschen: 0, umschlagWert: 0, kostenBp: 0, devisenBp: 0, dividendenrendite: 0.02, umschichtMonate: 3 },
    freibetrag: { standard: 0 } });
  // Gesamtrendite = Dividendenrendite exakt: Pfad so, dass Kursteil null ist
  const F = F0({ buchPfad: { 2023: 0, 2024: 0 } });
  const R = M.raster(F.von, F.bis, 3);
  const Z = { idio: R.segs.map(() => Array(10).fill(0)), sel: R.segs.map(() => Array(10).fill(0)) };
  const r = M.simBuchMitEnde(P, F, R, Z, { verschiebung: 0 });
  // Gesamt 0 und Dividende 2 % p. a. bedeutet Kurs minus 2 % p. a.; deutsche Steuer auf Dividende: 26,375 % - 15 % = 11,375 %, Zahlung nur bei Gewinn
  ist('Dividendenlauf liefert Zahl', isFinite(r.endMitVerkauf) && r.steuerGezahlt > 0, JSON.stringify(r));
  const divBrutto = 100000 * 0.02 * R.jahre; // grob (Kursteil sinkt leicht)
  ist('Steuer auf Dividende nahe 11,375 % der Dividende', r.steuerGezahlt > 0.09 * divBrutto && r.steuerGezahlt < 0.12 * divBrutto, r.steuerGezahlt + ' vs ' + divBrutto);
}

/* ETF */
{
  const P = P0(), F = F0(), R = M.raster(F.von, F.bis, 3);
  const e = F.etf.c; e.verschiebung = 0;
  const r = M.simEtf(P, F, R, e, { steuer: false });
  nah('ETF brutto', r.endMitVerkauf, 121000, 1e-6);
  // Vorabpauschale 2023: Jan-Wert 100000, 70 % * 2,55 % * 100000 = 1785, Wertzuwachs 10000 -> 1785; TF 30 % -> 1249,5; Pauschbetrag 1000 -> 249,5*tau
  const rs = M.simEtf(P, F, R, e, { steuer: true });
  const vp1 = (1785 * 0.7 - 1000) * tau;
  nah('Vorabpauschale-Steuer 2023', rs.vpSteuer > 0 ? vp1 : 0, vp1, 1e-9);
  // 2024: Wert Jan 2024 ~ 110000 - vp1 (pro rata) , BZ 2,29 % -> 0,7*0,0229*V
  ist('Vorabpauschalesteuer gezahlt (2023 + 2024 wird nicht mehr faellig)', Math.abs(rs.vpSteuer - vp1) < 1e-6, rs.vpSteuer + ' vs ' + vp1);
  // Verkauf Ende: V * (1 - vp1/110000) ; Basis 100000*(1-fr); VP-Summe 1785*(1-fr)
  const fr = vp1 / 110000.0000001;
  const V = 121000 * (1 - fr), basis = 100000 * (1 - fr), vps = 1785 * (1 - fr);
  const gew = V - basis - vps;
  // Der Pauschbetrag 2024 ist durch die Vorabpauschale (Zufluss Januar 2024, 1249,5 nach Teilfreistellung) schon verbraucht
  const steuer = Math.max(0, gew * 0.7) * tau;
  nah('ETF Endwert nach Steuer', rs.endMitVerkauf, V - steuer, 1e-4);
}
{
  const P = P0({ etf: { teilfreistellung: 0.3, basiszins: {} } }), F = F0(), R = M.raster(F.von, F.bis, 3);
  const e = F.etf.c; e.verschiebung = 0;
  const rs = M.simEtf(P, F, R, e, { steuer: true });
  nah('ETF ohne Basiszins: nur Verkaufssteuer', rs.endMitVerkauf, 121000 - Math.max(0, 21000 * 0.7 - 1000) * tau, 1e-9);
  const rk = M.simEtf(P, F, R, e, { steuer: true, kirche: 0.09 });
  ist('Kirchensteuer verteuert', rk.endMitVerkauf < rs.endMitVerkauf);
}
{ // TER und Fonds-Quellensteuer wirken
  const P = P0(), F = F0(), R = M.raster(F.von, F.bis, 3);
  const e = Object.assign({}, F.etf.c, { ter: 0.0020, fondsQuellensteuer: 0.0015, verschiebung: 0 });
  const r = M.simEtf(P, F, R, e, { steuer: false });
  nah('TER+QSt', r.endMitVerkauf, 121000 * Math.exp(-0.0035 * R.jahre), 1e-4);
}

/* Eichung und Gesamtablauf */
{
  const P = P0({ trials: 12, buch: { positionen: 12, sigmaQuartal: 0.2, auswahlRauschen: 1, umschlagWert: 0.25, kostenBp: 20, devisenBp: 0, dividendenrendite: 0.015, umschichtMonate: 3 } });
  const F = F0({ von: '2021-09-16', bis: '2026-09-15', buchPfad: { 2021: -0.1, 2022: -0.3, 2023: 0.1, 2024: 0.7, 2025: 0.6, 2026: 0.4 }, buchGesamt: 1.5,
    fx: { anker: [{ t: M.datum('2021-09-16'), kurs: 1.18 }, { t: M.datum('2026-09-15'), kurs: 1.15 }] },
    etf: { c: { pfad: { 2021: 0.07, 2022: -0.18, 2023: 0.26, 2024: 0.25, 2025: 0.18, 2026: 0.12 }, ter: 0.0007, fondsQuellensteuer: 0.002, kaufBp: 0, verkaufBp: 0, gesamt: 0.81, zielArt: 'nettoFonds' },
    d: { pfad: { 2021: 0.07, 2022: -0.18, 2023: 0.26, 2024: 0.25, 2025: 0.18, 2026: 0.12 }, ter: 0.0007, fondsQuellensteuer: 0.002, kaufBp: 0, verkaufBp: 0, gesamt: 0.81, zielArt: 'brutto' } } });
  P.etf.basiszins = { 2021: -0.0045, 2022: -0.0005, 2023: 0.0255, 2024: 0.0229, 2025: 0.0253 };
  const W = M.fensterVorbereiten(P, F, 12);
  const roh = M.rechneSzenario(W, { steuer: false });
  nah('Eichung Buch ohne Steuer = Vorgabe', roh.a.endMitVerkauf, 100000 * 2.5 / 1.15, 2e-3);
  nah('Eichung ETF ohne Steuer = Vorgabe', roh.c.endMitVerkauf, 100000 * 1.81 / 1.15, 2e-3);
  nah('Eichung brutto: nach TER und Fondssteuer darunter', roh.d.endMitVerkauf, 100000 * 1.81 / 1.15 * Math.exp(-0.0027 * W.R.jahre), 2e-3);
  const mit = M.rechneSzenario(W, {});
  ist('Steuer senkt Buch', mit.a.endMitVerkauf < roh.a.endMitVerkauf);
  ist('Steuer senkt ETF', mit.c.endMitVerkauf < roh.c.endMitVerkauf);
  ist('ohne Verkauf >= mit Verkauf (Buch)', mit.a.endOhneVerkauf >= mit.a.endMitVerkauf);
  const kirche = M.rechneSzenario(W, { kirche: 0.09 });
  ist('Kirchensteuer senkt Buch', kirche.a.endMitVerkauf < mit.a.endMitVerkauf);
  const s = M.schwelle(W, 'c', {});
  ist('Schwelle: Buch braucht mehr als der ETF vor Steuern', s.vorsprungNoetig > 0, JSON.stringify(s));
  // Gegenprobe: mit der Verschiebung trifft das Buch das ETF-Ergebnis
  const chk = M.mittel(W.Z.map(z => M.simBuchMitEnde(W.P, W.F, W.R, z, { verschiebung: s.verschiebung }).endMitVerkauf));
  nah('Schwelle trifft ETF-Endwert', chk, mit.c.endMitVerkauf, 1e-4);
}

console.log(`test.js: ${ok} Zusicherungen ok, ${fehl} Fehler`);
process.exit(fehl ? 1 : 0);
