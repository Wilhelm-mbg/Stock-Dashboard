'use strict';
/* Vorab-Rechnung des PM (04.10.2026): Rueckblick ueber fuenf Jahre mit einem Korb wie in der App.
 * Regel: REGEL-KORB148.md in diesem Ordner (vor jeder Zahl festgelegt). Eigener Nachspieler des PM - ruft wie verlangt die
 * Funktionen der App (mfhandel.js); Tagesablauf, Ausschuettungen, Reihenende und Massstab sind eigener Code.
 * Nur lesen (Panel, alpaca-massnahmen). Schreibt ergebnis-korb148.json in diesen Ordner.
 *   node --max-old-space-size=6144 studien/massstab-rueckblick-2026-10-04/pm-korb148/pm-korb148.js
 * Reihenfolge am Tag: (1) Ausschuettungen fuer ueber Nacht gehaltene Positionen, (2) Reihenenden ausbuchen,
 * (3) Handel zur Eroeffnung (wenn Ausfuehrungstag), (4) Bewertung zum Schluss. */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..', '..');
const Q = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
const PR = require(path.join(Q, 'pruefstand.js')), K = require(path.join(Q, 'konfig.js'));
const MH = require(path.join(REPO, 'mfhandel.js'));
const KONFIG = MH.buchKonfig();
/* N_KORB: 148 war die Zahl im Siegel c0d3f30 - ein Zaehlfehler des PM (sein Zaehlskript liess 39 Reihen mit Kursen vor 1973 aus).
 * Die App fuehrt 187 Werte (REGEL-KORB148.md, Nachtrag 1). Aufruf ohne Angabe rechnet den berichtigten Korb 187;
 * `node ... pm-korb148.js 148` rechnet den ersten Lauf nach (schreibt dann ergebnis-korb148.json). */
const VON = '2021-09-16', BIS = '2026-09-15', KOSTEN_BP = 20, START = 100000, N_KORB = Number(process.argv[2] || 187), PHASEN = 63;
if (N_KORB !== 148 && N_KORB !== 187) throw new Error('Nur die beiden festgelegten Koerbe (187 berichtigt, 148 erster Lauf) werden gerechnet');
const KORREKTUREN = N_KORB === 187 ? [{ nr: 1, was: 'Korbgroesse 187 statt 148', ursache: 'Zaehlfehler des PM vor dem ersten Lauf: sein Zaehlskript verlangte eine erste Kerze nach 1973 und liess 39 der 187 Reihen der App aus (Zielzahl der App ist 19, nicht 15).', regel: 'REGEL-KORB148.md Nachtrag 1, festgelegt vor dem berichtigten Lauf', ersterLauf: 'ergebnis-korb148.json (bleibt stehen)' }] : [];
const MASSNAHMEN = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen/';
const T975 = [null, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080];

const t0 = Date.now();
const T = PR.Tafel(path.join(Q, 'voll-v22')), g = T.g, SYM = T.stand.symbole;
const TV = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(x => { TV[x] = true; });
/* Zeilen je Reihe, nach Tag sortiert */
const anz = new Int32Array(T.nSym); for (let r = 0; r < g.n; r++) anz[g.sym[r]]++;
const zeilen = new Array(T.nSym); for (let s = 0; s < T.nSym; s++) zeilen[s] = new Int32Array(anz[s]);
const fuell = new Int32Array(T.nSym); for (let r = 0; r < g.n; r++) { const s = g.sym[r]; zeilen[s][fuell[s]++] = r; }
for (let s = 0; s < T.nSym; s++) { const a = zeilen[s]; for (let i = 1; i < a.length; i++) if (g.tag[a[i]] < g.tag[a[i - 1]]) throw new Error('Zeilen der Reihe ' + T.symName[s] + ' sind nicht nach Tag sortiert'); }
const tage = []; for (let t = 0; t <= T.maxTag; t++) if (T.tagVon[t] >= 0) tage.push(t);
const iso = t => T.kal.tage[t];
const MSC = new Float64Array(T.maxTag + 1); for (let t = 0; t <= T.maxTag; t++) MSC[t] = Date.parse(iso(t) + 'T00:00:00Z');
const pos0 = tage.findIndex(t => iso(t) >= VON), posEnde = tage.findIndex(t => iso(t) === BIS);
if (pos0 < 1 || iso(tage[pos0]) !== VON || posEnde < 0) throw new Error('Fenster nicht gefunden');
function posBis(s, t) { const a = zeilen[s]; let lo = 0, hi = a.length - 1, res = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (g.tag[a[m]] <= t) { res = m; lo = m + 1; } else hi = m - 1; } return res; }
const sSPY = T.symIdx.SPY;
if (!SYM[sSPY].referenz) throw new Error('SPY ist keine Referenzreihe');

/* Ausschuettungen je Kuerzel-Ordner */
const DIV = {}; let ohneDatei = 0;
function divFuer(s) {
  const o = SYM[s].ordner || T.symName[s];
  if (DIV[o] !== undefined) return DIV[o];
  let m = null; try { m = JSON.parse(fs.readFileSync(MASSNAHMEN + o + '.json', 'utf8')); } catch (e) { m = null; }
  if (!m) { ohneDatei++; return (DIV[o] = null); }
  const map = {}; (m.saetze || []).forEach(x => { if (x._art === 'cash_dividends' && x.ex_date && x.rate > 0) map[x.ex_date] = (map[x.ex_date] || 0) + Number(x.rate); });
  return (DIV[o] = map);
}

/* Zielliste am Stichtag; nKorb = 0: breiter Korb (alle), sonst die nKorb umsatzstaerksten zulaessigen Werte */
const zielCache = {};
function zielAm(posStichtag, nKorb) {
  const key = posStichtag + '|' + nKorb; if (zielCache[key]) return zielCache[key];
  const t = tage[posStichtag], now = MSC[t], roh = {};
  for (let s = 0; s < T.nSym; s++) {
    if (SYM[s].referenz) continue;
    const p = posBis(s, t); if (p < 252) continue;                       /* momentumZiel verlangt 253 Zeilen */
    const a = zeilen[s]; if (now - MSC[g.tag[a[p]]] > 7 * 86400000) continue;   /* veraltet: wirft momentumZiel ohnehin hinaus */
    const r = new Array(253);
    for (let i = p - 252; i <= p; i++) { const z = a[i], k = g.bSchluss[z]; r[i - (p - 252)] = [MSC[g.tag[z]], k, k > 0 ? g.umsatz[z] / k : 0]; }
    roh[T.symName[s]] = r;
  }
  const voll = MH.momentumZiel(roh, { nowMs: now });
  let z = voll, korb = null;
  if (nKorb && !voll.zuWenig) {
    const top = voll.rangfolge.slice().sort((x, y) => y.umsatz - x.umsatz || (x.sym < y.sym ? -1 : 1)).slice(0, nKorb);
    const roh2 = {}; top.forEach(p => { roh2[p.sym] = roh[p.sym]; });
    z = MH.momentumZiel(roh2, { nowMs: now });
    korb = top.map(p => p.sym);
    if (z.korb.zulaessig !== Math.min(nKorb, voll.korb.zulaessig)) throw new Error('KLINKE: Korb hat ' + z.korb.zulaessig + ' statt ' + nKorb + ' zulaessige Werte');
  }
  if (z.ziel.indexOf('SPY') >= 0) throw new Error('KLINKE: SPY im Ziel');
  return (zielCache[key] = { ziel: z.ziel, zuWenig: !!z.zuWenig, zulaessig: z.korb.zulaessig, zulaessigVoll: voll.korb.zulaessig, korb: korb,
    kleinsterUmsatz: korb ? Math.min.apply(null, voll.rangfolge.filter(p => korb.indexOf(p.sym) >= 0).map(p => p.umsatz)) : null });
}

function spiele(versatz, nKorb) {
  const a0 = pos0 + versatz, k = KOSTEN_BP / 10000;
  const buch = { cash: START, positionen: [], trades: [] };
  let naechste = a0, kosten = 0, divBuch = 0, nDiv = 0, zuWenig = 0;
  const enden = [], perioden = [], werte = [];
  const zS = T.zeileVon(sSPY, tage[a0]); let spyStueck = START / g.bEroeffnung[zS];
  const spyKursStueck = START / g.bEroeffnung[zS], divSPY = divFuer(sSPY) || {};
  let letzterWert = START, letzterSpy = START, bargeldSumme = 0, nTage = 0, maxGewicht = 0;
  for (let d = a0; d <= posEnde; d++) {
    const t = tage[d], tagIso = iso(t);
    /* (1) Ausschuettungen: Positionen, die ueber Nacht gehalten wurden */
    buch.positionen.forEach(p => {
      const s = T.symIdx[p.sym], dm = divFuer(s); if (!dm || !dm[tagIso]) return;
      const pp = posBis(s, tage[d - 1]); if (pp < 0) return;
      const z = zeilen[s][pp]; if (!(g.rohSchluss[z] > 0)) return;
      const cash = p.stueck * g.bSchluss[z] * dm[tagIso] / g.rohSchluss[z];
      buch.cash += cash; divBuch += cash; nDiv++;
    });
    if (d > a0 && divSPY[tagIso]) { const z = T.zeileVon(sSPY, t); spyStueck += spyStueck * divSPY[tagIso] / g.bSchluss[z]; }
    /* (2) Reihenende: erster Handelstag nach der letzten Zeile */
    for (let i = buch.positionen.length - 1; i >= 0; i--) {
      const p = buch.positionen[i], s = T.symIdx[p.sym], a = zeilen[s], lz = a[a.length - 1];
      if (g.tag[lz] < t) {
        const grund = T.endeGrund[s] || null, total = !!(grund && TV[grund]);
        if (!total) buch.cash += p.stueck * g.bSchluss[lz];
        enden.push({ reihe: p.sym, tag: tagIso, grund: grund, totalverlust: total });
        buch.positionen.splice(i, 1);
      }
    }
    /* (3) Handel zur Eroeffnung */
    if (d === naechste) {
      const ziel = zielAm(d - 1, nKorb);
      if (ziel.zuWenig) { zuWenig++; naechste = d + 1; }
      else {
        const preise = {}, brauche = {};
        ziel.ziel.forEach(x => { brauche[x] = 1; }); buch.positionen.forEach(p => { brauche[p.sym] = 1; });
        Object.keys(brauche).forEach(nm => { const z = T.zeileVon(T.symIdx[nm], t); if (z >= 0 && g.bEroeffnung[z] > 0) preise[nm] = g.bEroeffnung[z]; });
        const plan = MH.planeUmschichtung(ziel.ziel, buch, preise);
        plan.verkaufen.forEach(o => { const p = buch.positionen.find(x => x.sym === o.sym); if (p) kosten += p.stueck * o.kurs * k; });
        buch.trades = [];
        MH.fuehreAus(buch, plan, MSC[t], KOSTEN_BP);
        buch.trades = [];
        plan.kaufen.forEach(o => { if (o.stueck > 0) kosten += o.stueck * o.kurs * k; });
        if (perioden.length) { const pr = perioden[perioden.length - 1]; pr.buchEnde = letzterWert; pr.spyEnde = letzterSpy; }
        perioden.push({ ausfuehrung: tagIso, zulaessig: ziel.zulaessig, zulaessigVoll: ziel.zulaessigVoll, zielzahl: ziel.ziel.length, positionen: buch.positionen.length,
          buchStart: perioden.length ? letzterWert : START, spyStart: perioden.length ? letzterSpy : START, ohneKurs: plan.fehltKurs.length,
          gehalten: buch.positionen.map(p => p.sym).sort() });
        naechste = d + KONFIG.halten;
      }
    }
    /* (4) Bewertung zum Schluss; fehlt die Zeile, gilt der letzte Schlusskurs */
    let wert = buch.cash, groesste = 0;
    buch.positionen.forEach(p => { const s = T.symIdx[p.sym], w = p.stueck * g.bSchluss[zeilen[s][posBis(s, t)]]; wert += w; if (w > groesste) groesste = w; });
    const zSp = T.zeileVon(sSPY, t), spyWert = spyStueck * g.bSchluss[zSp];
    werte.push([tagIso, wert, spyWert, spyKursStueck * g.bSchluss[zSp]]);
    letzterWert = wert; letzterSpy = spyWert; bargeldSumme += buch.cash / wert; nTage++;
    if (groesste / wert > maxGewicht) maxGewicht = groesste / wert;
  }
  const pr = perioden[perioden.length - 1]; pr.buchEnde = letzterWert; pr.spyEnde = letzterSpy;
  perioden.forEach(p => { p.buch = (p.buchEnde / p.buchStart - 1) * 100; p.spy = (p.spyEnde / p.spyStart - 1) * 100; p.abstand = p.buch - p.spy; });
  const jahre = (Date.parse(BIS) - Date.parse(iso(tage[a0]))) / (365.25 * 86400000);
  const pa = x => (Math.pow(x, 1 / jahre) - 1) * 100;
  const dd = idx => { let hoch = -Infinity, m = 0; werte.forEach(w => { if (w[idx] > hoch) hoch = w[idx]; const r = w[idx] / hoch - 1; if (r < m) m = r; }); return m * 100; };
  return { versatz: versatz, start: iso(tage[a0]), jahre: jahre, buchEnde: letzterWert, spyEnde: letzterSpy, buchGesamt: (letzterWert / START - 1) * 100, spyGesamt: (letzterSpy / START - 1) * 100,
    buchPa: pa(letzterWert / START), spyPa: pa(letzterSpy / START), abstandPa: pa(letzterWert / START) - pa(letzterSpy / START), schlaegt: letzterWert > letzterSpy,
    rueckschlagBuch: dd(1), rueckschlagSpy: dd(2), umschichtungen: perioden.length, kosten: kosten, ausschuettungenBuch: divBuch, ausschuettungenZahl: nDiv,
    reihenenden: enden, zuWenigTage: zuWenig, bargeldMittel: bargeldSumme / nTage * 100, groesstesGewicht: maxGewicht * 100, perioden: perioden, werte: werte };
}

function median(a) { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
function kalenderjahre(werte) { const aus = []; let vb = START, vs = START, jahr = null, lb = START, ls = START;
  werte.forEach((w, i) => { const j = w[0].slice(0, 4); if (jahr !== null && j !== jahr) { aus.push({ jahr: jahr, buch: (lb / vb - 1) * 100, spy: (ls / vs - 1) * 100 }); vb = lb; vs = ls; } jahr = j; lb = w[1]; ls = w[2]; if (i === werte.length - 1) aus.push({ jahr: jahr, buch: (lb / vb - 1) * 100, spy: (ls / vs - 1) * 100 }); });
  return aus; }
const f = (x, n) => (x >= 0 ? '+' : '') + x.toFixed(n == null ? 2 : n);

/* ---- Selbstpruefung: der breite Korb muss die bekannte Zahl treffen ---- */
const breit = spiele(0, 0);
console.log('Selbstpruefung breiter Korb (k = 0): Buch ' + f(breit.buchGesamt) + ' % gegen SPY ' + f(breit.spyGesamt) + ' %, Abstand ' + f(breit.abstandPa) + ' Pp p. a. (Soll: +65,3 / +81,2 / -2,05)');
if (Math.abs(breit.buchGesamt - 65.32) > 0.05 || Math.abs(breit.spyGesamt - 81.19) > 0.02) throw new Error('Selbstpruefung verfehlt - kein Lauf');

/* ---- Der eine Lauf: Korb 148 ---- */
const H = spiele(0, N_KORB);
const phasen = []; for (let k = 0; k < PHASEN; k++) { const e = k === 0 ? H : spiele(k, N_KORB); phasen.push({ k: k, start: e.start, buchGesamt: e.buchGesamt, spyGesamt: e.spyGesamt, buchPa: e.buchPa, spyPa: e.spyPa, abstandPa: e.abstandPa, schlaegt: e.schlaegt, rueckschlagBuch: e.rueckschlagBuch, zuWenigTage: e.zuWenigTage }); }
const ab = phasen.map(p => p.abstandPa);
const x = H.perioden.map(p => p.abstand), n = x.length, mittel = x.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(x.reduce((a, b) => a + (b - mittel) * (b - mittel), 0) / (n - 1)), se = sd / Math.sqrt(n), tw = T975[n - 1];
const KJ = kalenderjahre(H.werte);
/* nachrichtlich: wie viele Werte der App-Liste stehen am letzten Stichtag im Korb? (Liste aus der Kopie des App-Bestands, nur Namen) */
let ueberdeckung = null;
try {
  const S = path.join(process.env.APPDATA || '', 'markt-dashboard', 'store'), namen = {};
  fs.readdirSync(S).filter(fn => /^mf_tagesdaten_teil_\d+\.json$/.test(fn)).forEach(fn => { const j = JSON.parse(fs.readFileSync(path.join(S, fn), 'utf8')); Object.keys(j.roh || {}).forEach(nm => { namen[nm] = 1; }); });
  const app = Object.keys(namen), letzter = H.perioden[H.perioden.length - 1];
  const korb = zielAm(tage.findIndex(t => iso(t) === letzter.ausfuehrung) - 1, N_KORB).korb;
  ueberdeckung = { appWerte: app.length, imKorb: app.filter(nm => korb.indexOf(nm) >= 0).length, stichtagVor: letzter.ausfuehrung };
} catch (e) { ueberdeckung = { fehler: e.message }; }

const E = { kennung: 'massstab-rueckblick-2026-10-04/pm-korb' + N_KORB + '/v1', art: 'Vorab-Rechnung des PM - eine Rechnung, ohne unabhaengige Gegenprobe', erzeugt: new Date().toISOString(),
  panelKennung: T.stand.kennung, fenster: { von: VON, bis: BIS }, korb: N_KORB, kostenBpJeSeite: KOSTEN_BP, konfigBuch: KONFIG,
  selbstpruefungBreiterKorb: { buchGesamt: breit.buchGesamt, spyGesamt: breit.spyGesamt, abstandPa: breit.abstandPa },
  haupt: { schlaegt: H.schlaegt, buchGesamt: H.buchGesamt, spyGesamt: H.spyGesamt, buchPa: H.buchPa, spyPa: H.spyPa, abstandPa: H.abstandPa, buchEnde: H.buchEnde, spyEnde: H.spyEnde,
    rueckschlagBuch: H.rueckschlagBuch, rueckschlagSpy: H.rueckschlagSpy, umschichtungen: H.umschichtungen, kosten: H.kosten, ausschuettungenBuch: H.ausschuettungenBuch,
    ausschuettungenZahl: H.ausschuettungenZahl, zuWenigTage: H.zuWenigTage, bargeldMittel: H.bargeldMittel, groesstesGewicht: H.groesstesGewicht, reihenenden: H.reihenenden },
  kalenderjahre: KJ, perioden: H.perioden,
  zufallsbereich: { startphasen: { phasen: phasen, minimum: Math.min.apply(null, ab), median: median(ab), maximum: Math.max.apply(null, ab), vorDemMarkt: phasen.filter(p => p.schlaegt).length, anzahl: PHASEN,
      rueckschlagBuchVon: Math.min.apply(null, phasen.map(p => p.rueckschlagBuch)), rueckschlagBuchBis: Math.max.apply(null, phasen.map(p => p.rueckschlagBuch)) },
    periodenstreuung: { n: n, mittel: mittel, standardabweichung: sd, standardfehler: se, tWert: tw, band95: [mittel - tw * se, mittel + tw * se], periodenVorn: x.filter(v => v > 0).length } },
  nachrichtlich: { ueberdeckungMitAppListe: ueberdeckung, ordnerOhneMassnahmenDatei: ohneDatei }, korrekturen: KORREKTUREN, laufzeitSekunden: Math.round((Date.now() - t0) / 100) / 10 };
fs.writeFileSync(path.join(__dirname, 'ergebnis-korb' + N_KORB + '.json'), JSON.stringify(E, null, 1));

console.log('KORB ' + N_KORB + ', k = 0 (Start ' + H.start + '): schlaegt den Markt: ' + (H.schlaegt ? 'JA' : 'NEIN') + ' - Buch ' + f(H.buchGesamt, 1) + ' % (' + f(H.buchPa) + ' % p. a.), SPY ' + f(H.spyGesamt, 1) + ' % (' + f(H.spyPa) + ' % p. a.), Abstand ' + f(H.abstandPa) + ' Pp p. a.');
console.log('Startphasen: ' + E.zufallsbereich.startphasen.vorDemMarkt + ' von ' + PHASEN + ' vor dem Markt, Abstand ' + f(E.zufallsbereich.startphasen.minimum) + ' / ' + f(E.zufallsbereich.startphasen.median) + ' / ' + f(E.zufallsbereich.startphasen.maximum) + ' Pp p. a. (Minimum / Median / Maximum)');
console.log('Periodenstreuung: ' + n + ' Perioden, Mittel ' + f(mittel) + ' Pp, Standardfehler ' + se.toFixed(2) + ', Band ' + f(mittel - tw * se) + ' bis ' + f(mittel + tw * se) + ', vor dem Markt ' + E.zufallsbereich.periodenstreuung.periodenVorn);
console.log('Rueckschlag Buch ' + f(H.rueckschlagBuch, 1) + ' % (Phasen ' + f(E.zufallsbereich.startphasen.rueckschlagBuchVon, 1) + ' bis ' + f(E.zufallsbereich.startphasen.rueckschlagBuchBis, 1) + ') / SPY ' + f(H.rueckschlagSpy, 1) + ' % | Kosten ' + H.kosten.toFixed(0) + ' $ | Ausschuettungen ' + H.ausschuettungenBuch.toFixed(0) + ' $ (' + H.ausschuettungenZahl + ') | Reihenenden ' + H.reihenenden.length + ' | Bargeld ' + H.bargeldMittel.toFixed(2) + ' % | groesstes Gewicht ' + H.groesstesGewicht.toFixed(1) + ' % | zuWenig ' + H.zuWenigTage);
KJ.forEach(j => console.log('  ' + j.jahr + ': Buch ' + f(j.buch, 1) + ' %  SPY ' + f(j.spy, 1) + ' %'));
H.perioden.forEach(p => console.log('  ' + p.ausfuehrung + ' Korb ' + p.zulaessig + ' von ' + p.zulaessigVoll + ', Ziel ' + p.zielzahl + ', gehalten ' + p.positionen + ' | Buch ' + f(p.buch) + ' % SPY ' + f(p.spy) + ' % | ' + p.gehalten.join(' ')));
console.log('Ueberdeckung mit der App-Liste: ' + JSON.stringify(ueberdeckung) + ' | Laufzeit ' + E.laufzeitSekunden + ' s');
