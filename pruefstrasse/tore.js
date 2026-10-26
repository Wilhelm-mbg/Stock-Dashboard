'use strict';
/* TORE UND STATISTIK der Pruefstrasse, Stufe 2a (Auftrag Nr. 121-2a, FORM.md §5): Machbarkeitstor vor dem Lauf, Kandidatenkriterium in der
 * t-Verteilung mit Korrektur ueber das Register, Groessenaussage, Vorwaerts-Bedarf, Wiedervorlage-Datum, Register-Zahlen. Reine Rechnung ohne
 * Daten: die Streuung kommt aus pruefstrasse/streuung.json (einmal aus VERSIEGELTEN Protokollen gefittet, nie aus dem Kandidaten selbst).
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

var STREUUNG = path.join(K.HIER, 'streuung.json');
var ERWARTUNGEN_ALT = path.join(K.HIER, 'erwartungen-alt.json');

/* ---------- t-Verteilung (dieselbe Rechnung wie adapter/tag.js tVerteilung, hier ohne die Studienmodule) ---------- */
function lnGamma(z) {
  var g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  var x = z, y = z, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); var ser = 1.000000000190015;
  for (var j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
function betaCf(x, a, b) {
  var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; var h = d;
  for (var m = 1; m <= 300; m++) {
    var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
    var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break;
  }
  return h;
}
function betaInc(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betaCf(x, a, b) / a : 1 - bt * betaCf(1 - x, b, a) / b;
}
/** P(T <= t), df > 0. */
function tVerteilung(t, df) {
  if (!(df > 0) || t !== t) return NaN;
  var x = df / (df + t * t), ib = betaInc(x, df / 2, 0.5);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}
/** Einseitiger p-Wert P(T_df >= t). */
function pEinseitig(t, df) { return 1 - tVerteilung(t, df); }
/** Quantil: t mit P(T_df <= t) = q (Bisektion, 1e-10). */
function tQuantil(q, df) {
  if (!(q > 0 && q < 1) || !(df > 0)) return NaN;
  var lo = -1e3, hi = 1e3;
  for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (tVerteilung(m, df) < q) lo = m; else hi = m; if (hi - lo < 1e-10) break; }
  return (lo + hi) / 2;
}
/** Freiheitsgrade wie der Adapter (momente): df = n_eff - 1, n_eff = Signaltage / H, mindestens 1. */
function dfAus(nTage, H) { return Math.max(1, nTage / Math.max(1, H) - 1); }

/* ---------- Kandidatenkriterium (B1): p_E <= min(P(T_df >= KANDIDAT_T), REGISTER_ALPHA / m) ---------- */
/** Schwelle je Konfiguration: df, m, beide p-Schwellen, die wirksame t-Schwelle und welche greift; nachrichtlich mit m + extern. */
function kandidatSchwelle(df, m, mExtern) {
  var mm = Math.max(1, m + K.REGISTER_M_EXTERN), pT = pEinseitig(K.KANDIDAT_T, df), pB = K.REGISTER_ALPHA / mm, p = Math.min(pT, pB);
  var t = Math.max(K.KANDIDAT_T, tQuantil(1 - pB, df));
  var aus = { df: df, m: mm, pT: pT, pBonferroni: pB, p: p, t: t, greift: pB < pT ? 'Korrektur ueber ' + mm + ' Tests (' + K.REGISTER_ALPHA + ' / m)' : 't >= ' + K.KANDIDAT_T };
  var ext = mExtern == null ? K.REGISTER_M_EXTERN_NACHRICHTLICH : mExtern;
  if (ext > 0) { var pE = K.REGISTER_ALPHA / (mm + ext); aus.nachrichtlichExtern = { mGesamt: mm + ext, p: Math.min(pT, pE), t: Math.max(K.KANDIDAT_T, tQuantil(1 - pE, df)) }; }
  return aus;
}
/** Kandidat (Entdeckung): netto > 0 und t >= wirksame Schwelle (gleichbedeutend p_E <= p). */
function istKandidat(netto, t, schwelle) { return netto > 0 && t != null && t >= schwelle.t; }

/* ---------- Streuungstabelle ---------- */
var _S = null;
function streuung(datei) {
  if (!datei && _S) return _S;
  var p = datei || STREUUNG;
  if (!fs.existsSync(p)) throw new Error('streuung.json fehlt (' + p + ') - Machbarkeitstor nicht rechenbar');
  var S = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!datei) _S = S;
  return S;
}
/** Geschaetzter Standardfehler (Pp je Trade, Tagesmittel, HH) aus Zaehlungen: H, n_T (Signaltage), d (Trades je Signaltag), modus topf|zeit. */
function seGeschaetzt(H, nT, d, modus, S) {
  S = S || streuung();
  var k = S.koeffizienten, z = modus === 'zeit' ? 1 : 0, dd = Math.max(1, d || 1);
  if (!(H >= 1) || !(nT >= 1)) return NaN;
  return Math.exp(k.alpha + k.gamma * Math.log(H) - k.b * Math.log(nT) + (1 - z) * k.delta * Math.log(dd) + z * (k.zeta + k.gammaZ * Math.log(H)));
}

/* ---------- Machbarkeitstor (A3, Audit B V1) ---------- */
/** Bedingung (t_krit(df, m) + Z_POWER80) * se_geschaetzt <= nettoPp fuer n Signaltage; liefert die Zahlen. */
function machbarBei(n, z) {
  /* Auflage QS 23.10.: mit z.seE (gemessene se einer Vormessung, Nachmessung --grund-daten) se_E x Wurzel(n_E / n) statt STREUUNG_FAKTOR x Tabelle */
  var df = dfAus(n, z.H), s = kandidatSchwelle(df, z.m), se = z.seE != null ? z.seE * Math.sqrt((z.nE || n) / n) : (z.seFaktor != null ? z.seFaktor : K.STREUUNG_FAKTOR) * seGeschaetzt(z.H, n, z.d, z.modus, z.S), links = (s.t + K.Z_POWER80) * se;
  return { n: n, df: df, schwelle: s, se: se, links: links, ok: links <= z.nettoPp };
}
/** Kleinste Zahl Signaltage, bei der die Bedingung f(n) haelt (exponentielle Suche, dann Bisektion; null ueber 10 Mio). */
function kleinstesN(f, ab) {
  var lo = Math.max(2, ab || 2);
  if (f(lo)) return lo;
  var hi = lo * 2; while (!f(hi)) { lo = hi; hi *= 2; if (hi > 1e7) return null; }
  while (hi - lo > 1) { var m = Math.floor((lo + hi) / 2); if (f(m)) hi = m; else lo = m; }
  return hi;
}
/** z = { H, nT, d, modus, nettoPp, m, signaltageJeJahr? }: messbar | nicht messbar mit "braeuchte n Signaltage". */
function machbarkeit(z) {
  var r = machbarBei(z.nT, z);
  var braeuchte = r.ok ? z.nT : kleinstesN(function (n) { return machbarBei(n, z).ok; }, z.nT);
  return { messbar: r.ok, nT: z.nT, H: z.H, d: z.d, modus: z.modus, nettoPp: z.nettoPp, m: r.schwelle.m, df: r.df, tKrit: r.schwelle.t, greift: r.schwelle.greift,
    seGeschaetzt: r.se, links: r.links, braeuchteSignaltage: braeuchte,
    braeuchteJahre: (braeuchte != null && z.signaltageJeJahr > 0) ? braeuchte / z.signaltageJeJahr : null,
    seFaktor: z.seFaktor != null ? z.seFaktor : K.STREUUNG_FAKTOR,
    regel: '(t_krit + ' + K.Z_POWER80 + ') * ' + (z.seFaktor != null ? z.seFaktor : K.STREUUNG_FAKTOR) + ' * se_geschaetzt <= nettoPp, t_krit = max(' + K.KANDIDAT_T + ', t_(1 - ' + K.REGISTER_ALPHA + '/m; df)), df = n_T/H - 1, se aus streuung.json' };
}

/* ---------- Vorwaerts-Bedarf (C2) und Wiedervorlage (C4) ---------- */
/** se bei n Signaltagen: mit z.seE/z.nE die GEMESSENE se der Entdeckung hochgerechnet (se_E x Wurzel(n_E / n), Nachbesserung QS 23.10.), sonst die Tabelle. */
function seBei(z, n) { return z.seE != null ? z.seE * Math.sqrt((z.nE || z.nT) / n) : (z.seFaktor != null ? z.seFaktor : 1) * seGeschaetzt(z.H, n, z.d, z.modus, z.S); }
/** nBedarf: kleinste Zahl Vorwaerts-Signaltage mit MDE80_vorwaerts = (t_(0,95; df) + Z_POWER80) * se(n) <= nettoPp, mindestens MIN_TAGE; se(n) aus der
 *  gemessenen se der Entdeckung (z.seE, z.nE), ersatzweise aus der Tabelle. */
function nBedarf(z) {
  var f = function (n) { var df = dfAus(n, z.H); return (tQuantil(1 - K.HOLM_ALPHA, df) + K.Z_POWER80) * seBei(z, n) <= z.nettoPp; };
  var n = z.nettoPp > 0 ? kleinstesN(f, 2) : null;
  return n == null ? null : Math.max(K.MIN_TAGE, n);
}
/** Datum (JJJJ-MM-TT) ab einem Startdatum plus Jahre (Kalenderjahre zu 365,25 Tagen). */
function datumPlusJahre(datum, jahre) { var ms = Date.parse(datum + 'T00:00:00Z') + jahre * 365.25 * 86400000; return new Date(ms).toISOString().slice(0, 10); }
/** Wiedervorlage (nicht entscheidbar): Datum, an dem die Nachmessung das eigene Tor bestuende: (t_krit(df, m) + Z_POWER80) * se(n) <= nettoPp (Nachbesserung
 *  QS 23.10.: derselbe Faktor wie das Machbarkeitstor statt MDE_FAKTOR 2,80); se(n) aus der gemessenen se der Entdeckung (z.seE), ersatzweise Tabelle;
 *  Datenzuwachs signaltageJeJahr (n_T / Handelstage * 252). z = { H, nT, d, modus, nettoPp, m, signaltageJeJahr, ab (Panel-Ende), seE? }. */
function wiedervorlage(z) {
  var f = function (n) { return (kandidatSchwelle(dfAus(n, z.H), z.m || 1).t + K.Z_POWER80) * seBei(z, n) <= z.nettoPp; };
  var n = z.nettoPp > 0 ? kleinstesN(f, 2) : null, q = z.seE != null ? 'Entdeckung' : 'Tabelle';
  if (n == null) return { nNoetig: null, jahre: null, datum: null, seQuelle: q, text: 'nie (keine positive Behauptung)' };
  n = Math.max(K.MIN_TAGE, n);
  var jahre = n <= z.nT ? 0 : (z.signaltageJeJahr > 0 ? (n - z.nT) / z.signaltageJeJahr : null);
  return { nNoetig: n, jahre: jahre, datum: jahre == null ? null : datumPlusJahre(z.ab, jahre), seQuelle: q, text: null };
}

/* ---------- Groessenaussage (A4, Audit B V2) ---------- */
/** obere 95-%-Grenze brutto < bruttoPp -> Zusatz; "im gemessenen Fenster" Pflicht, wenn die Quelle ein anderes Fenster misst. */
function groessenAussage(obereBrutto, bruttoPp, fensterWieQuelle) {
  if (!(bruttoPp > 0) || obereBrutto == null || !(obereBrutto < bruttoPp)) return null;
  return 'Literaturgroesse ausgeschlossen' + (fensterWieQuelle === true ? '' : ' (im gemessenen Fenster)');
}

/* ---------- Erwartung (A2) ---------- */
/** nettoPp/bruttoPp je Konfiguration: aus kandidat.json erwartung (Zahl oder { key: Zahl }) oder fuer die sieben alten Kandidaten aus
 *  erwartungen-alt.json. brutto fehlt -> netto + Kassa-Huerde der Klasse 1. Liefert null, wenn keine Zahl da ist. */
function erwartungFuer(kand, key, alt) {
  var e = kand.erwartung || {}, quelle = 'kandidat.json erwartung';
  function je(v) { return v != null && typeof v === 'object' ? v[key] : v; }
  var netto = je(e.nettoPp), brutto = je(e.bruttoPp), fenster = e.fensterWieQuelle;
  if (netto == null) {
    var A = alt === undefined ? erwartungenAlt() : alt, a = A && A.kandidaten && A.kandidaten[kand.kennung];
    if (a) { var z = (a.konfigurationen && a.konfigurationen[key]) || a; netto = z.nettoPp; brutto = z.bruttoPp; fenster = a.fensterWieQuelle; quelle = 'pruefstrasse/erwartungen-alt.json (' + (a.quelle || '') + ')'; }
  }
  if (!(typeof netto === 'number' && isFinite(netto))) return null;
  /* Entscheid PM 23.10. (QS 2b N3): nettoPp ist die Behauptung nach der Kostenregel; fehlt bruttoPp, ist brutto = netto + Huerde der Kostenregel zur Eroeffnung
   * in der teuersten Klasse der Konfiguration (klassen; ohne klassen Klasse 2 = Index 1, die Klasse des frueheren Kassa-Ersatzes) */
  var h1 = typeof brutto === 'number' ? 0 : huerdeKostenregel(kand, key);
  return { nettoPp: netto, bruttoPp: typeof brutto === 'number' ? brutto : netto + h1, bruttoAusNetto: typeof brutto !== 'number', fensterWieQuelle: fenster === true, quelle: quelle };
}
/** Huerde der Kostenregel (Eroeffnung + IBKR Fixed, Position K.POSITION_USD, Median-Kurs der Klasse) fuer den brutto-Ersatz (QS 2b N3). */
function huerdeKostenregel(kand, key) {
  var c = (kand.konfigurationen || []).filter(function (x) { return x && x.key === key; })[0], kl = c && Array.isArray(c.klassen) && c.klassen.length ? Math.min.apply(null, c.klassen) : 1;
  return require('./kosten.js').huerdeUmlauf(kl, 'eroeffnung', K.POSITION_USD, null).gesamtPp;
}
/** Kassa-Huerde der Umsatzklasse 1 (50-250 Mio $, Trendkanal-/Minutenstudie) - bis QS 2b der Ersatz fuer ein fehlendes bruttoPp, jetzt nur nachrichtlich. */
function kassaHuerdeKlasse1() { return require(path.join(K.TRENDKANAL_STUDIE, 'konfig.js')).KLASSEN[1].huerde; }
function erwartungenAlt() { return fs.existsSync(ERWARTUNGEN_ALT) ? JSON.parse(fs.readFileSync(ERWARTUNGEN_ALT, 'utf8')) : null; }

/* ---------- Register (B2, Audit B V7) ---------- */
/** Gewicht eines Eintrags im Test-Zaehler m: "nicht messbar" 0, sonst zaehlt (Vorgabe 1; Nachmessung mit --grund-daten 2). */
function gewicht(e) { return e.urteil === 'nicht messbar' ? 0 : (e.zaehlt == null ? 1 : e.zaehlt); }
/** m = Summe der Gewichte der Eintraege ausser der Kennung `ohne` (die laufende ersetzt ihre alten Zeilen). */
function registerM(Rg, ohne) { return (Rg.konfigurationen || []).reduce(function (s, e) { return s + (e.kennung === ohne ? 0 : gewicht(e)); }, 0); }
/** Zwei Zahlen: Kandidaten unter der Null (je Eintrag P(Kandidat | Null) = min(P(T_df >= 3), alpha/m) mit df des Eintrags und dem heutigen m)
 *  und belegt-Vorschlag unter der Null (je Eintrag P(Kandidat | Null) * HOLM_ALPHA - die Vorwaertsmessung ist unabhaengig, Holm einseitig 5 %
 *  laesst je Konfiguration hoechstens 5 % durch). Eintraege ohne df (alte Zeilen ohne Zaehlung) rechnen mit df = 30 (Rechnung genannt). */
function registerZahlen(Rg) {
  var m = registerM(Rg, null), zk = 0, zb = 0, ohneDf = 0, kennungen = {};
  (Rg.konfigurationen || []).forEach(function (e) {
    kennungen[e.kennung] = true;
    var g = gewicht(e); if (!g) return;
    var df = e.df; if (!(df > 0)) { df = 30; ohneDf++; }
    var p = kandidatSchwelle(df, m, 0).p * g;
    zk += p; zb += p * K.HOLM_ALPHA;
  });
  return { m: m, eintraege: (Rg.konfigurationen || []).length, regeln: Object.keys(kennungen).length, zufallKandidat: zk, zufallBelegt: zb, ohneDf: ohneDf,
    rechnung: 'Kandidat unter der Null je Eintrag = min(P(T_df >= ' + K.KANDIDAT_T + '), ' + K.REGISTER_ALPHA + '/m) mit df des Eintrags und m = ' + m + ', summiert; belegt-Vorschlag unter der Null = dieselbe Summe x ' + K.HOLM_ALPHA + ' (Vorwaerts-Holm einseitig, unabhaengige Daten)' + (ohneDf ? '; ' + ohneDf + ' Eintraege ohne df mit df = 30' : '') };
}

/* ---------- Kalender-Hausregel (C3) ---------- */
function hausregelMarke(bewertung, nBed, nBest) {
  if (bewertung !== 'zeit') return null;
  if ((nBed != null && nBed < K.HAUSREGEL_KALENDER_TAGE) || (nBest != null && nBest < K.HAUSREGEL_KALENDER_TAGE)) return 'nicht muehlenfaehig (Hausregel CLAUDE.md)';
  return null;
}

/* ---------- Korb-Form (Nr. 125a, FORM.md §5 Korb): Perioden statt Signaltage ---------- */
/** Vollstaendige, nicht ueberlappende 63-Tage-Perioden in einem Zeitraum von `handelstage` Panel-Handelstagen ab dem ersten Ausfuehrungstag:
 *  Umschichtungen an Tag 0, 63, 126, ...; eine Periode ist vollstaendig, wenn die naechste Umschichtung noch im Zeitraum liegt (wie korb.js perioden ohne `angebrochen`). */
function korbPerioden(handelstage) { return handelstage >= 1 ? Math.floor((handelstage - 1) / K.KORB.periodeTage) : 0; }
/** Standardfehler des mittleren Abstands p. a. bei n Perioden: se_pa(n) = sd_q * Wurzel(periodenJeJahr) / Wurzel(n). */
function korbSePa(sdQ, n) { return sdQ * Math.sqrt(K.KORB.periodenJeJahr) / Math.sqrt(n); }
/** MDE80_korb(n) = (t_krit(df = n - 1, m) + 0,8416) * se_pa(n) * faktor (Machbarkeitstor: faktor = STREUUNG_FAKTOR 1,4 wie die Tag-Form). */
function korbMde80(n, sdQ, m, faktor) {
  var df = Math.max(1, n - 1), s = kandidatSchwelle(df, m), se = korbSePa(sdQ, n), f = faktor == null ? K.STREUUNG_FAKTOR : faktor;
  return { n: n, df: df, tKrit: s.t, greift: s.greift, m: s.m, sePa: se, faktor: f, mde80: (s.t + K.Z_POWER80) * se * f };
}
/** Machbarkeitstor Korb (vor dem Lauf, ohne Renditen): z = { nPerioden, sdQ (streuung.json korb.sdQ), nettoPp, m } -> messbar | nicht messbar mit
 *  "braeuchte n Perioden (= n / 4 Jahre)". Unter KORB.minPerioden nie messbar. */
function korbMachbarkeit(z) {
  var r = korbMde80(z.nPerioden, z.sdQ, z.m, z.faktor), ok = function (n) { return n >= K.KORB.minPerioden && korbMde80(n, z.sdQ, z.m, z.faktor).mde80 <= z.nettoPp; };
  var messbar = z.nettoPp > 0 && ok(z.nPerioden), braeuchte = messbar ? z.nPerioden : (z.nettoPp > 0 ? kleinstesN(ok, Math.max(2, z.nPerioden)) : null);
  return Object.assign(r, { messbar: messbar, nettoPp: z.nettoPp, nPerioden: z.nPerioden, sdQ: z.sdQ, braeuchtePerioden: braeuchte,
    braeuchteJahre: braeuchte == null ? null : braeuchte / K.KORB.periodenJeJahr,
    regel: 'MDE80_korb(n) = (t_krit(df = n - 1, m) + ' + K.Z_POWER80 + ') * sd_q * Wurzel(' + K.KORB.periodenJeJahr + ') / Wurzel(n) * ' + (z.faktor == null ? K.STREUUNG_FAKTOR : z.faktor) + ' <= nettoPp (p. a.), t_krit = max(' + K.KANDIDAT_T + ', t_(1 - ' + K.REGISTER_ALPHA + '/m; df)), mindestens ' + K.KORB.minPerioden + ' Perioden, sd_q aus pruefstrasse/streuung.json korb' });
}
/** nBedarf Korb (Vormerkung): kleinste Zahl VOLLSTAENDIGER Vorwaerts-Perioden mit (t_(0,95; n - 1) + 0,8416) * sd_E * Wurzel(4) / Wurzel(n) <= nettoPp, mindestens
 *  KORB.minPerioden - sd_E = GEMESSENE Streuung der Perioden-Abstaende der Entdeckung (nicht die Tabelle), Form wie nBedarf der Tag-Form. */
function korbNBedarf(z) {
  if (!(z.nettoPp > 0) || !(z.sdE > 0)) return null;
  var f = function (n) { return (tQuantil(1 - K.HOLM_ALPHA, Math.max(1, n - 1)) + K.Z_POWER80) * korbSePa(z.sdE, n) <= z.nettoPp; };
  var n = kleinstesN(f, 2);
  return n == null ? null : Math.max(K.KORB.minPerioden, n);
}
/** Einseitiger t-Test auf Perioden-Abstaenden (Pp je Periode): H1 Mittel > 0. p = P(T_df >= t), obere 95-%-Grenze einseitig = Mittel + t_0,95 * se. */
function korbTTest(x) {
  var n = x.length; if (n < 2) return { n: n, mittel: n ? x[0] : null, sd: null, se: null, t: null, df: null, p: null, obere95: null };
  var m = x.reduce(function (s, v) { return s + v; }, 0) / n, sd = Math.sqrt(x.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (n - 1)), se = sd / Math.sqrt(n), df = n - 1;
  var t = se > 0 ? m / se : (m > 0 ? Infinity : m < 0 ? -Infinity : 0);
  return { n: n, mittel: m, sd: sd, se: se, t: t, df: df, p: isFinite(t) ? pEinseitig(t, df) : (t > 0 ? 0 : 1), obere95: m + tQuantil(0.95, df) * se, mittelPa: m * K.KORB.periodenJeJahr };
}
/** Vorwaerts-Familie (Entscheid PM 26.10. zu Zweitleser 21): Zahl der Register-Eintraege, die JE vorgemerkt wurden (Status vorgemerkt | bestaetigt |
 *  abgelehnt | offen) - Holm rechnet mit dieser Familiengroesse, nicht nur mit den am Tag faelligen. Alle Formen. */
function mVorwaerts(Rg) { return (Rg.konfigurationen || []).filter(function (e) { return ['vorgemerkt', 'bestaetigt', 'abgelehnt', 'offen'].indexOf(e.status) !== -1; }).length; }

/* ---------- Holm p-basiert (einseitig) ---------- */
/** mFamilie (Nr. 125a, Entscheid 21): Groesse der Familie, falls groesser als die Liste - die nicht gelisteten Mitglieder zaehlen wie p = 1 (Holm bleibt gueltig). */
function holm(pListe, alpha, mFamilie) {
  var m = Math.max(pListe.length, mFamilie || 0), idx = pListe.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return a.p - b.p; });
  var bestanden = new Array(pListe.length).fill(false), schwelle = new Array(pListe.length).fill(null), weiter = true;
  idx.forEach(function (e, k) { var s = alpha / (m - k); schwelle[e.i] = s; if (weiter && e.p != null && e.p <= s) bestanden[e.i] = true; else weiter = false; });
  return { bestanden: bestanden, schwelle: schwelle, m: m };
}

module.exports = { korbPerioden: korbPerioden, korbSePa: korbSePa, korbMde80: korbMde80, korbMachbarkeit: korbMachbarkeit, korbNBedarf: korbNBedarf, korbTTest: korbTTest, mVorwaerts: mVorwaerts, tVerteilung: tVerteilung, pEinseitig: pEinseitig, tQuantil: tQuantil, dfAus: dfAus, kandidatSchwelle: kandidatSchwelle, istKandidat: istKandidat,
  streuung: streuung, seGeschaetzt: seGeschaetzt, machbarkeit: machbarkeit, nBedarf: nBedarf, wiedervorlage: wiedervorlage, datumPlusJahre: datumPlusJahre,
  groessenAussage: groessenAussage, erwartungFuer: erwartungFuer, erwartungenAlt: erwartungenAlt, gewicht: gewicht, registerM: registerM, registerZahlen: registerZahlen,
  hausregelMarke: hausregelMarke, holm: holm, kassaHuerdeKlasse1: kassaHuerdeKlasse1, huerdeKostenregel: huerdeKostenregel, STREUUNG: STREUUNG, ERWARTUNGEN_ALT: ERWARTUNGEN_ALT };
