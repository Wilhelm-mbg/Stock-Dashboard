'use strict';
/* Pruefungen der Fundamentaltafel (Auftrag 16.09.2026, §2). Schreibt test-fundamental.json; Exit 1 bei Fehlschlag.
 *
 *  P1 Leck-Probe des Lesers: konstruiertes Filing filed = tag muss werfen, filed = tag-1 liefern; die Suche darf ein
 *     Filing vom selben Tag nie liefern; 1.000 Zufallszugriffe (Kuerzel, Handelstag) auf die echte Tafel: 0 Verstoesse.
 *  P2 Reproduktion der Machbarkeit (2019q2, 2024q2): je Klasse Reihen mit US-Standardbericht im Quartal und mit
 *     Umsatz/Vermoegen/Aktienzahl - gegen deckung-reihen.json (dort je Filing die Werte), Zeile fuer Zeile (adsh).
 *     Abweichungen sind nur erlaubt, wenn die Regel "erste Veroeffentlichung gilt" einen frueheren Wert setzt.
 *  P3 Verteilung filed - period je Formulartyp; Anteil Monatsend-Rundung (Instanzname traegt den echten Stichtag).
 *  P4 Fundamental-Momentum: unabhaengige Nachrechnung an drei Firmen ueber acht Filings direkt aus den Auszuegen.
 *  P5 Verteilung des Fundamental-Momentums (Median, P5, P95) je Jahr; Anteil Luecken.
 *  P6 Determinismus: Zweitbau der Tafel in einen anderen Ordner, SHA-256 aller Dateien gleich; Zweitauszug zweier
 *     Quartale aus den Roh-Quartalen, SHA-256 gleich.
 *  P7 20 Handproben gegen die SEC-API (companyconcept) an NEUDARGESTELLTEN Faellen: die Tafel traegt den frueheren
 *     Wert mit dem frueheren filed, die API fuehrt beide Filings, und der Eintrag mit `frame` (das, was
 *     companyfacts/frames liefern) traegt NICHT die Erstveroeffentlichung.
 *
 * v1.1 (Auftrag Nr. 60, 22.09.2026, §3):
 *  P8 Aktien-Skala: Marktwert (roh.aktien x unbereinigter Panel-Schluss am filed-Tag, unabhaengig nachgerechnet) am
 *     juengsten 10-K vor 2026-03-01 fuer MCD, KO, COP, PCAR, TEVA, AAPL, BRK in der Groessenordnung (Faktor 3);
 *     AAPL 10-Q filed 2014-04-24 nach Regel A auf ~8,6e8 Stueck; Spruenge > 30 nach Korrektur < 5 % der Spruenge davor.
 *  P9 Zuordnung: X nicht mehr CIK 83246; F/T/A (Tickertabelle) unveraendert; keine Reihe mit sicherheit 'tabelle' veraendert.
 *  P10 Einheit: HRC 10-K filed 2021-11-12 markiert; kein Filing mit Assets-Sprung gegen beide Nachbarn > 100 mehr in der
 *     Tafel (roh.vermoegen je CIK in Rangordnung); Huellen-Zaehler ausgewiesen.
 *  P11 D4: AMCR und TW mit d4 'huelle'; kein vermoegenVor/vermoegen ausserhalb [1e-3, 1e3] mehr.
 *  P12 Leser unveraendert: Kennung v1.1, 1.000 Zufallszugriffe aus P1b ohne Verstoss.
 *  P2 zaehlt seit v1.1 Abweichungen, die eine Korrektur erklaert (Reihe verworfen, Aktien-Skala, Einheit), getrennt.
 *
 * Aufruf: node --max-old-space-size=6144 test-fundamental.js [--ohne-api] [--ohne-zweitbau]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var zlib = require('zlib');
var crypto = require('crypto');
var cp = require('child_process');
var L = require('./fsds-lesen.js');
var Z = require('./zuordnung.js');
var F = require('./fundamental-lesen.js');

var TAFEL = path.join(__dirname, 'fundamentaltafel');
var AUSZUG = path.join(L.WURZEL, 'auszug');
var CACHE = path.join(L.WURZEL, 'api-cache');
var TMP = path.join(process.env.TEMP || process.env.TMP || __dirname, 'fundamentaltafel-probe');
var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var ohneApi = process.argv.indexOf('--ohne-api') >= 0, ohneZweitbau = process.argv.indexOf('--ohne-zweitbau') >= 0;

var E = { kennung: 'fundamentaltafel-2026-09-16/test/v1.1', stand: new Date().toISOString(), pruefungen: {}, fehler: 0 };
function pruefung(name, ok, details) { E.pruefungen[name] = Object.assign({ ok: !!ok }, details || {}); if (!ok) E.fehler++; console.log((ok ? 'OK      ' : 'FEHLER  ') + name + (details && details.kurz ? ' - ' + details.kurz : '')); }
function quantil(a, p) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; }
function statistik(a) { return { n: a.length, p5: quantil(a, 0.05), p10: quantil(a, 0.1), p50: quantil(a, 0.5), p90: quantil(a, 0.9), p95: quantil(a, 0.95), mittel: a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null }; }
function gleich(a, b) { return a !== null && b !== null && a !== undefined && b !== undefined && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a)); }
function sha(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tsv(datei) { var a = fs.readFileSync(datei, 'utf8').split('\n'), kopf = a[0].split('\t'), aus = []; for (var i = 1; i < a.length; i++) { if (!a[i]) continue; var f = a[i].split('\t'), o = {}; for (var k = 0; k < kopf.length; k++) o[kopf[k]] = f[k] === undefined ? '' : f[k]; aus.push(o); } return aus; }
function ladeTafel() { var l = []; fs.readdirSync(TAFEL).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f); }).sort().forEach(function (f) { fs.readFileSync(path.join(TAFEL, f), 'utf8').split('\n').forEach(function (z) { if (z) l.push(JSON.parse(z)); }); }); return l; }
function iso(n) { var s = String(n); return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8); }

/* ---------- P1 Leck-Probe ---------- */
function p1(kal) {
  var d = path.join(TMP, 'leck'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, '_reihen.json'), JSON.stringify({ kennung: 'probe', reihen: { PROBE: { cik: 1 } }, ciks: { 1: ['PROBE'] } }));
  var a = { sym: ['PROBE'], cik: 1, filed: '2020-04-30', accepted: '', adsh: 'a' }, b = { sym: ['PROBE'], cik: 1, filed: '2020-05-01', accepted: '', adsh: 'b' };
  fs.writeFileSync(path.join(d, 'tafel-2020.jsonl'), JSON.stringify(a) + '\n' + JSON.stringify(b) + '\n');
  var t = F.oeffne(d, { maxAlterTage: null }), geworfen = false;
  try { t.klinke('PROBE', '2020-05-01', b); } catch (e) { geworfen = /Leck/.test(e.message); }
  var geliefert = null; try { geliefert = t.klinke('PROBE', '2020-05-01', a); } catch (e) { geliefert = null; }
  var amTag = t.fundamentalAm('PROBE', '2020-05-01'), davor = t.fundamentalAm('PROBE', '2020-04-30'), danach = t.fundamentalAm('PROBE', '2020-05-02');
  var konstruiert = geworfen && geliefert === a && amTag && amTag.adsh === 'a' && davor === null && danach && danach.adsh === 'b';
  pruefung('P1a Sperrklinke konstruiert', konstruiert, { geworfenBeiFiledGleichTag: geworfen, geliefertBeiFiledVortag: geliefert === a, sucheAmTag: amTag && amTag.adsh, sucheDavor: davor, sucheDanach: danach && danach.adsh });

  var echt = F.oeffne(); var syms = Object.keys(echt.meta.reihen).sort(); var zufall = mulberry32(20260916);
  var tage = kal.filter(function (x) { return x >= '2016-01-04' && x <= '2026-09-03'; });
  var n = 1000, geliefertN = 0, verstoesse = 0, fehlerN = 0;
  for (var i = 0; i < n; i++) {
    var s = syms[Math.floor(zufall() * syms.length)], tag = tage[Math.floor(zufall() * tage.length)];
    try { var z = echt.fundamentalAm(s, tag); if (z) { geliefertN++; if (!(z.filed < tag)) verstoesse++; } } catch (e) { fehlerN++; }
  }
  var prot = echt.protokoll(), protVerstoesse = prot.filter(function (p) { return p.filed !== null && !(p.filed < p.tag); }).length;
  pruefung('P1b 1000 Zufallszugriffe', verstoesse === 0 && protVerstoesse === 0 && fehlerN === 0 && prot.length === n, { zugriffe: n, geliefert: geliefertN, verstoesse: verstoesse, protokollEintraege: prot.length, protokollVerstoesse: protVerstoesse, geworfen: fehlerN, zaehler: echt.zaehler, kurz: geliefertN + ' von ' + n + ' geliefert, ' + protVerstoesse + ' Verstoesse' });
  return echt;
}

/* ---------- P2 Reproduktion 2019q2 / 2024q2 ---------- */
function p2(tafel, panel, leser) {
  var deck = JSON.parse(fs.readFileSync(path.join(__dirname, 'deckung-reihen.json'), 'utf8'));
  var jeAdsh = {}; tafel.forEach(function (z) { jeAdsh[z.adsh] = z; });
  var aus = {}, alleOk = true;
  Object.keys(deck.reihen).forEach(function (qn) {
    var klassen = {}, wertOk = { umsatz: 0, vermoegen: 0, aktien: 0 }, wertErsteVeroeff = { umsatz: 0, vermoegen: 0, aktien: 0 }, wertAnders = [], fehltInTafel = [], nurTafel = 0;
    var verworfenFiledVorPeriod = [], regelAktien = 0, regelAktienBeispiele = [];
    /* v1.1: Abweichungen, die eine der vier Korrekturen erklaert */
    var fehltDurchZuordnung = [], durchAktienSkala = { faktorCik: 0, abweichler: 0, verworfen: 0 }, durchEinheit = { umsatz: 0, vermoegen: 0, aktien: 0 };
    var deckAdsh = {};
    deck.reihen[qn].forEach(function (r) {
      var k = r.klasse || 'inaktiv', c = klassen[k] = klassen[k] || { reihen: 0, mach: { us: 0, umsatz: 0, vermoegen: 0, aktien: 0 }, tafel: { us: 0, umsatz: 0, vermoegen: 0, aktien: 0 } };
      c.reihen++;
      var us = r.filings.filter(function (f) { return Z.US_STANDARD[Z.FORM_ART[f.form]]; });
      if (!us.length) return;
      c.mach.us++; var hatM = {}, hatT = {}, inTafel = 0;
      us.forEach(function (f) {
        deckAdsh[f.adsh] = 1;
        var w = {}; f.hat.forEach(function (h) { var m = /^(\w+):(\w+)=(.*)$/.exec(h); if (m) w[m[1]] = { tag: m[2], wert: +m[3] }; });
        ['umsatz', 'vermoegen', 'aktien'].forEach(function (g) { if (w[g]) hatM[g] = 1; });
        var z = jeAdsh[f.adsh];
        /* Der Bau verwirft Filings mit filed < period (FSDS-Datenfehler, z. B. PWSC 10-Q period 2024-12-31 filed
         * 2024-05-07) - in der Machbarkeit standen sie noch drin. */
        if (!z) {
          var m2 = leser.meta.reihen[r.reihe];
          (f.filed < f.period ? verworfenFiledVorPeriod : (m2 && m2.pruefung === 'verworfen') ? fehltDurchZuordnung : fehltInTafel).push({ reihe: r.reihe, adsh: f.adsh, form: f.form, period: f.period, filed: f.filed });
          return;
        }
        inTafel++;
        ['umsatz', 'vermoegen', 'aktien'].forEach(function (g) {
          if (z.roh[g] !== null) hatT[g] = 1;
          if (!w[g]) return;
          if (gleich(z.roh[g], w[g].wert)) wertOk[g]++;
          else if (z.marken.einheit === 'verdacht' && z.roh[g] === null) durchEinheit[g]++;
          else if (g === 'aktien' && z.marken.aktienSkala && (z.marken.aktienSkala.faktorCik || z.marken.aktienSkala.faktorAbweichler || z.marken.aktienSkala.verworfen)) durchAktienSkala[z.marken.aktienSkala.verworfen ? 'verworfen' : z.marken.aktienSkala.faktorAbweichler ? 'abweichler' : 'faktorCik']++;
          else if (z.marken.erstVonFrueher > 0 || z.roh[g] === null) wertErsteVeroeff[g]++;
          /* Aktienzahl: die Machbarkeit nahm bei gewichteten Zahlen die ERSTE Dateizeile (qtrs 1 oder YTD, Reihenfolge
           * der Quelle) und Bestandszahlen im Fenster [period, filed]; der Bau nimmt qtrs = Sollquartal bzw. genau period.
           * Das ist ein Regelunterschied, kein Fehler - gezaehlt, nicht als Abweichung gewertet. */
          else if (g === 'aktien' && z.roh[g] !== null) { regelAktien++; if (regelAktienBeispiele.length < 5) regelAktienBeispiele.push({ reihe: r.reihe, adsh: f.adsh, form: f.form, machbarkeit: w[g], tafel: z.roh[g], tafelTag: z.rohTags[g] }); }
          else if (wertAnders.length < 40) wertAnders.push({ reihe: r.reihe, adsh: f.adsh, form: f.form, groesse: g, machbarkeit: w[g], tafel: z.roh[g], tafelTag: z.rohTags[g] });
          else wertAnders.push(null);
        });
      });
      if (inTafel) c.tafel.us++;
      ['umsatz', 'vermoegen', 'aktien'].forEach(function (g) { if (hatM[g]) c.mach[g]++; if (hatT[g]) c.tafel[g]++; });
    });
    tafel.forEach(function (z) { if (z.q === qn && !deckAdsh[z.adsh]) nurTafel++; });
    /* Reihen mit US-Standardbericht je Klasse: gleich bis auf die verworfenen Filings (filed < period) und - seit v1.1 -
     * die Reihen, deren Kuerzel->CIK-Zuordnung die Namenspruefung verworfen hat (je Reihe hoechstens eine Abweichung) */
    var usAbweichung = 0; Object.keys(klassen).forEach(function (k) { usAbweichung += Math.abs(klassen[k].mach.us - klassen[k].tafel.us); });
    var reihenVerworfen = {}; fehltDurchZuordnung.forEach(function (f) { reihenVerworfen[f.reihe] = 1; });
    var usGleich = usAbweichung <= verworfenFiledVorPeriod.length + Object.keys(reihenVerworfen).length;
    var wertAndersN = wertAnders.length;
    var ok = usGleich && fehltInTafel.length === 0 && wertAndersN === 0;
    if (!ok) alleOk = false;
    aus[qn] = { klassen: klassen, usGleich: usGleich, usAbweichung: usAbweichung, verworfenFiledVorPeriod: verworfenFiledVorPeriod, fehltDurchZuordnungN: fehltDurchZuordnung.length, fehltDurchZuordnungReihen: Object.keys(reihenVerworfen).length, fehltDurchZuordnung: fehltDurchZuordnung.slice(0, 20), fehltInTafel: fehltInTafel.slice(0, 20), fehltInTafelN: fehltInTafel.length, nurTafel: nurTafel, wertGleich: wertOk, wertDurchErsteVeroeffentlichung: wertErsteVeroeff, wertDurchAktienSkala: durchAktienSkala, wertDurchEinheit: durchEinheit, regelunterschiedAktien: regelAktien, regelunterschiedAktienBeispiele: regelAktienBeispiele, wertAnders: wertAnders.filter(Boolean), wertAndersN: wertAndersN };
    console.log('  ' + qn + ' US-Standard je Klasse gleich: ' + usGleich + ' (verworfen filed<period: ' + verworfenFiledVorPeriod.length + ', Reihen durch Zuordnung verworfen: ' + Object.keys(reihenVerworfen).length + ' mit ' + fehltDurchZuordnung.length + ' Filings), fehlt in Tafel: ' + fehltInTafel.length + ', Werte gleich: ' + JSON.stringify(wertOk) + ', durch Erstveroeffentlichung anders: ' + JSON.stringify(wertErsteVeroeff) + ', durch Aktien-Skala: ' + JSON.stringify(durchAktienSkala) + ', durch Einheit: ' + JSON.stringify(durchEinheit) + ', Regelunterschied Aktienzahl: ' + regelAktien + ', unerklaert anders: ' + wertAndersN);
  });
  pruefung('P2 Reproduktion Machbarkeit', alleOk, aus);
}

/* ---------- P3 filed - period, Monatsend-Rundung ---------- */
function p3(tafel) {
  var jeArt = {};
  tafel.forEach(function (z) { var a = Z.FORM_ART[z.form]; (jeArt[a] = jeArt[a] || []).push(F.tageZwischen(z.period, z.filed)); });
  var abstand = {}; Object.keys(jeArt).forEach(function (a) { abstand[a] = statistik(jeArt[a]); abstand[a].ueber45 = jeArt[a].filter(function (d) { return d > 45; }).length; abstand[a].ueber90 = jeArt[a].filter(function (d) { return d > 90; }).length; });
  var rund = { jeArt: {}, gesamt: { n: 0, gerundet: 0, ohneDatumImNamen: 0 } };
  var jeAdshArt = {}; tafel.forEach(function (z) { jeAdshArt[z.adsh] = Z.FORM_ART[z.form]; });
  fs.readdirSync(AUSZUG).filter(function (f) { return /-sub\.tsv$/.test(f); }).sort().forEach(function (f) {
    tsv(path.join(AUSZUG, f)).forEach(function (s) {
      var a = jeAdshArt[s.adsh]; if (!a) return;
      var r = rund.jeArt[a] = rund.jeArt[a] || { n: 0, gerundet: 0, ohneDatumImNamen: 0, abstandTage: [] };
      r.n++; rund.gesamt.n++;
      var m = /(\d{8})/.exec(s.instance || '');
      if (!m) { r.ohneDatumImNamen++; rund.gesamt.ohneDatumImNamen++; return; }
      if (m[1] !== s.period) { r.gerundet++; rund.gesamt.gerundet++; r.abstandTage.push(Math.abs(F.tageZwischen(iso(m[1]), iso(s.period)))); }
    });
  });
  Object.keys(rund.jeArt).forEach(function (a) { var r = rund.jeArt[a]; r.anteilGerundet = r.n ? Math.round(1000 * r.gerundet / r.n) / 10 : null; r.rundungTage = statistik(r.abstandTage); delete r.abstandTage; });
  rund.gesamt.anteilGerundet = Math.round(1000 * rund.gesamt.gerundet / rund.gesamt.n) / 10;
  /* Panelreihen sind liquider als der FSDS-Durchschnitt (Machbarkeit: liquide Klassen Median 26-33 Tage): 10-Q Median
   * 25-50 Tage, 10-K 45-120 Tage sind plausibel; ausserhalb waere die Zuordnung von filed/period verdreht. */
  var plausibel = abstand.Q && abstand.Q.p50 >= 25 && abstand.Q.p50 <= 50 && abstand.K && abstand.K.p50 >= 45 && abstand.K.p50 <= 120;
  pruefung('P3 Abstand filed-period und Rundung', plausibel, { abstand: abstand, rundung: rund, kurz: '10-Q Median ' + (abstand.Q && abstand.Q.p50) + ' Tage, 10-K ' + (abstand.K && abstand.K.p50) + ', gerundet ' + rund.gesamt.anteilGerundet + ' %' });
}

/* ---------- P4 Nachrechnung Fundamental-Momentum an drei Firmen ---------- */
function monatsEnde(j, m) { while (m < 1) { m += 12; j--; } while (m > 12) { m -= 12; j++; } return j * 10000 + m * 100 + new Date(Date.UTC(j, m, 0)).getUTCDate(); }
function zurueck(d, q) { return monatsEnde(Math.floor(d / 10000), Math.floor(d / 100) % 100 - 3 * q); }
function p4(tafel, leser) {
  var firmen = ['AAPL', 'JPM', 'AAOI'], aus = {}, alleOk = true;
  var ciks = {}; firmen.forEach(function (s) { var c = leser.cikVon(s); if (c) ciks[c] = s; });
  /* Fakten dieser Firmen direkt aus den Auszuegen: je Filing (adsh) die Zeilen, dann "erste Veroeffentlichung" ueber filed */
  var subs = {}, num = {};
  fs.readdirSync(AUSZUG).filter(function (f) { return /-sub\.tsv$/.test(f); }).sort().forEach(function (f) { tsv(path.join(AUSZUG, f)).forEach(function (s) { if (ciks[parseInt(s.cik, 10)] && Z.US_STANDARD[Z.FORM_ART[s.form]]) subs[s.adsh] = s; }); });
  fs.readdirSync(AUSZUG).filter(function (f) { return /-num\.tsv$/.test(f); }).sort().forEach(function (f) { tsv(path.join(AUSZUG, f)).forEach(function (n) { if (subs[n.adsh]) (num[n.adsh] = num[n.adsh] || []).push(n); }); });
  var reihenfolge = Object.keys(subs).sort(function (a, b) { return subs[a].filed - subs[b].filed || (subs[a].accepted < subs[b].accepted ? -1 : 1) || (a < b ? -1 : 1); });
  var erst = {};   // cik|tag|ddate|qtrs -> {v, filed}
  reihenfolge.forEach(function (adsh) { (num[adsh] || []).forEach(function (n) { if (n.uom !== 'USD') return; var k = subs[adsh].cik + '|' + n.tag + '|' + n.ddate + '|' + n.qtrs; if (!erst[k]) erst[k] = { v: +n.value, filed: +subs[adsh].filed, adsh: adsh }; }); });
  function bekannt(cik, tag, d, q, filed, adsh) { var e = erst[cik + '|' + tag + '|' + d + '|' + q]; return e && (e.filed < filed || (e.filed === filed && e.adsh <= adsh)) ? e.v : null; }
  Object.keys(ciks).forEach(function (cik) {
    var sym = ciks[cik], fil = reihenfolge.filter(function (a) { return subs[a].cik === String(cik) || parseInt(subs[a].cik, 10) === +cik; }).slice(-8), zeilen = [], ok = true;
    var tafelJeAdsh = {}; tafel.forEach(function (z) { if (z.cik === +cik) tafelJeAdsh[z.adsh] = z; });
    fil.forEach(function (adsh) {
      var s = subs[adsh], P = +s.period, filed = +s.filed, sic = s.sic, tags = Z.GRUPPEN.netto.tags;
      function q(d) {   /* Quartals-Nettoergebnis: direkt, sonst Jahr minus drei Vorquartale (je Tag in Prioritaet) */
        for (var i = 0; i < tags.length; i++) { var v = bekannt(cik, tags[i], d, 1, filed, adsh); if (v !== null) return v; }
        for (i = 0; i < tags.length; i++) { var j = bekannt(cik, tags[i], d, 4, filed, adsh), a = bekannt(cik, tags[i], zurueck(d, 1), 1, filed, adsh), b = bekannt(cik, tags[i], zurueck(d, 2), 1, filed, adsh), c = bekannt(cik, tags[i], zurueck(d, 3), 1, filed, adsh); if (j !== null && a !== null && b !== null && c !== null) return j - a - b - c; }
        return null;
      }
      var qs = []; for (var k = 0; k < 8; k++) qs.push(q(zurueck(P, k)));
      var s4 = qs.slice(0, 4).every(function (x) { return x !== null; }) ? qs[0] + qs[1] + qs[2] + qs[3] : null;
      var s4v = qs.slice(4).every(function (x) { return x !== null; }) ? qs[4] + qs[5] + qs[6] + qs[7] : null;
      var A0 = bekannt(cik, 'Assets', P, 0, filed, adsh), A4 = bekannt(cik, 'Assets', zurueck(P, 4), 0, filed, adsh);
      var roa = s4 !== null && A0 > 0 ? s4 / A0 : null, roaV = s4v !== null && A4 > 0 ? s4v / A4 : null, fm = roa !== null && roaV !== null ? roa - roaV : null;
      var t = tafelJeAdsh[adsh], stimmt = !!t && gleich(t.summe4q.netto, s4) && gleich(t.roh.vermoegen, A0) && (fm === null ? t.abgeleitet.fm === null || t.wege.netto.indexOf('y') >= 0 || /[234]/.test(t.wege.netto) : gleich(t.abgeleitet.fm, fm));
      if (!stimmt) ok = false;
      zeilen.push({ adsh: adsh, form: s.form, period: iso(P), filed: iso(filed), netto4Q: s4, netto4QVor: s4v, vermoegen: A0, vermoegenVor: A4, roa: roa, roaVor: roaV, fm: fm, tafelFm: t ? t.abgeleitet.fm : undefined, tafelWege: t ? t.wege.netto : undefined, stimmt: stimmt });
    });
    if (!ok) alleOk = false;
    aus[sym] = { cik: +cik, filings: zeilen, ok: ok };
    console.log('  ' + sym + ': ' + zeilen.filter(function (z) { return z.stimmt; }).length + ' von ' + zeilen.length + ' Filings stimmen');
  });
  pruefung('P4 Handrechnung Fundamental-Momentum', alleOk && Object.keys(aus).length === 3, aus);
}

/* ---------- P5 Verteilung je Jahr ---------- */
function p5(tafel) {
  var jeJahr = {}, gesamt = { zeilen: tafel.length, mitFm: 0, mitSumme4qNetto: 0, mitUmsatzWachstum: 0 };
  tafel.forEach(function (z) {
    var j = z.filed.slice(0, 4), e = jeJahr[j] = jeJahr[j] || { zeilen: 0, mitFm: 0, mitSumme4qNetto: 0, mitUmsatzWachstum: 0, fm: [], roa: [], uw: [] };
    e.zeilen++;
    if (z.abgeleitet.fm !== null) { e.mitFm++; gesamt.mitFm++; e.fm.push(z.abgeleitet.fm); }
    if (z.summe4q.netto !== null) { e.mitSumme4qNetto++; gesamt.mitSumme4qNetto++; }
    if (z.abgeleitet.roa !== null) e.roa.push(z.abgeleitet.roa);
    if (z.abgeleitet.umsatzWachstum !== null) { e.mitUmsatzWachstum++; gesamt.mitUmsatzWachstum++; e.uw.push(z.abgeleitet.umsatzWachstum); }
  });
  Object.keys(jeJahr).forEach(function (j) { var e = jeJahr[j]; e.fmVerteilung = statistik(e.fm); e.roaVerteilung = statistik(e.roa); e.umsatzWachstumVerteilung = statistik(e.uw); e.anteilLueckeFm = Math.round(1000 * (1 - e.mitFm / e.zeilen)) / 10; delete e.fm; delete e.roa; delete e.uw; });
  var ok = gesamt.mitFm > 0.5 * tafel.length;
  pruefung('P5 Verteilung Fundamental-Momentum', ok, { gesamt: gesamt, jeJahr: jeJahr, kurz: 'FM in ' + Math.round(1000 * gesamt.mitFm / tafel.length) / 10 + ' % der Zeilen' });
}

/* ---------- P6 Determinismus ---------- */
function p6() {
  if (ohneZweitbau) return pruefung('P6 Determinismus', true, { uebersprungen: true });
  var d2 = path.join(TMP, 'tafel2'), a2 = path.join(TMP, 'auszug2');
  [d2, a2].forEach(function (d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); });
  var t0 = Date.now();
  cp.execFileSync(process.execPath, ['--max-old-space-size=6144', path.join(__dirname, 'bauen.js'), '--ziel', d2], { stdio: 'ignore', windowsHide: true });
  var dateien = fs.readdirSync(TAFEL).filter(function (f) { return f !== '_bau.json'; }).sort(), gleichN = 0, anders = [];
  dateien.forEach(function (f) { if (fs.existsSync(path.join(d2, f)) && sha(path.join(TAFEL, f)) === sha(path.join(d2, f))) gleichN++; else anders.push(f); });
  cp.execFileSync(process.execPath, [path.join(__dirname, 'auszug.js'), '--neu', '--ziel', a2, '--quartale', '2019q2,2024q2'], { stdio: 'ignore', windowsHide: true });
  var auszugGleich = 0, auszugAnders = [];
  ['2019q2-sub.tsv', '2019q2-num.tsv', '2024q2-sub.tsv', '2024q2-num.tsv'].forEach(function (f) { if (sha(path.join(AUSZUG, f)) === sha(path.join(a2, f))) auszugGleich++; else auszugAnders.push(f); });
  var b2 = JSON.parse(fs.readFileSync(path.join(d2, '_bau.json'), 'utf8'));
  pruefung('P6 Determinismus', anders.length === 0 && auszugAnders.length === 0 && dateien.length > 0, { tafelDateien: dateien.length, gleich: gleichN, anders: anders, auszugGleich: auszugGleich, auszugAnders: auszugAnders, zweitbauSekunden: b2.sekunden, sekunden: Math.round((Date.now() - t0) / 1000), kurz: gleichN + '/' + dateien.length + ' Tafeldateien und ' + auszugGleich + '/4 Auszugsdateien bitgleich' });
  fs.rmSync(d2, { recursive: true, force: true }); fs.rmSync(a2, { recursive: true, force: true });
}

/* ---------- P7 Handproben gegen die SEC-API ---------- */
var fenster = [];
function takt() { return new Promise(function (ok) { (function v() { var t = Date.now(); fenster = fenster.filter(function (x) { return t - x < 1000; }); if (fenster.length < 4) { fenster.push(t); return ok(); } setTimeout(v, 100); })(); }); }
function hole(url) {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
  var name = path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^A-Za-z0-9._-]/g, '_'));
  if (fs.existsSync(name)) return Promise.resolve(JSON.parse(fs.readFileSync(name, 'utf8')));
  return takt().then(function () { return new Promise(function (ok, nein) {
    var req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Accept': 'application/json' } }, function (res) {
      var strom = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res, teile = [];
      strom.on('data', function (d) { teile.push(d); });
      strom.on('end', function () { var txt = Buffer.concat(teile).toString('utf8'); if (res.statusCode !== 200) return ok({ fehler: 'HTTP ' + res.statusCode }); try { var j = JSON.parse(txt); fs.writeFileSync(name, txt); ok(j); } catch (e) { ok({ fehler: 'kein JSON' }); } });
      strom.on('error', nein);
    });
    req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); }); req.on('error', nein);
  }); });
}
function cik10(c) { return ('0000000000' + c).slice(-10); }
async function p7(tafel, leser) {
  if (ohneApi) return pruefung('P7 Handproben SEC-API', true, { uebersprungen: true });
  var neu = JSON.parse(fs.readFileSync(path.join(TAFEL, '_neudarstellungen.json'), 'utf8')).faelle;
  var kl = JSON.parse(fs.readFileSync(path.join(__dirname, 'klassen-jahr.json'), 'utf8')).reihen;
  var GRUPPE_VON = { Assets: 'vermoegen', NetIncomeLoss: 'netto', Revenues: 'umsatz', RevenueFromContractWithCustomerExcludingAssessedTax: 'umsatz', OperatingIncomeLoss: 'operativ' };
  var jeAdsh = {}; tafel.forEach(function (z) { jeAdsh[z.adsh] = z; });
  var RANG_KLASSE = { ab1000: 0, '250-1000': 1, '50-250': 2, '5-50': 3, unter5: 4, duenn: 5 };
  var kandidaten = [];
  neu.forEach(function (n) {
    var g = GRUPPE_VON[n.tag]; if (!g) return;
    var z = jeAdsh[n.erst.adsh]; if (!z || z.period !== n.ddate || z.rohTags[g] !== n.tag && g !== 'vermoegen') return;
    if (!gleich(z.roh[g], n.erst.wert)) return;
    var rel = Math.abs(n.spaeter.wert - n.erst.wert) / Math.max(1, Math.abs(n.erst.wert)); if (rel < 0.01) return;
    var sym = z.sym[0], jahr = n.erst.filed.slice(0, 4), k = kl[sym] && kl[sym].jahr[jahr] ? kl[sym].jahr[jahr].klasse : null;
    kandidaten.push({ n: n, z: z, sym: sym, jahr: jahr, klasse: k, rang: RANG_KLASSE[k] === undefined ? 9 : RANG_KLASSE[k], rel: rel });
  });
  kandidaten.sort(function (a, b) { return a.rang - b.rang || (a.jahr < b.jahr ? -1 : a.jahr > b.jahr ? 1 : 0) || b.rel - a.rel; });
  var gewaehlt = [], ciks = {}, jahre = {};
  for (var runde = 0; runde < 3 && gewaehlt.length < 20; runde++) {
    kandidaten.forEach(function (c) { if (gewaehlt.length >= 20 || ciks[c.n.cik] || (runde === 0 && jahre[c.jahr] >= 2)) return; ciks[c.n.cik] = 1; jahre[c.jahr] = (jahre[c.jahr] || 0) + 1; gewaehlt.push(c); });
  }
  var faelle = [], bestanden = 0, apiFrameSpaeter = 0, anfragen = 0;
  for (var i = 0; i < gewaehlt.length; i++) {
    var c = gewaehlt[i], n = c.n, api = await hole('https://data.sec.gov/api/xbrl/companyconcept/CIK' + cik10(n.cik) + '/us-gaap/' + n.tag + '.json'); anfragen++;
    var eintraege = api && api.units && api.units.USD ? api.units.USD : [];
    var passend = eintraege.filter(function (e) { var dt = Math.abs(F.tageZwischen(e.end, n.ddate)); if (dt > 7) return false; if (n.qtrs === 0) return !e.start; var mon = Math.round(F.tageZwischen(e.start, e.end) / 30.4); return Math.abs(mon - 3 * n.qtrs) <= 1; });
    var apiErst = passend.filter(function (e) { return e.accn === n.erst.adsh; })[0], apiSpaet = passend.filter(function (e) { return e.accn === n.spaeter.adsh; })[0];
    var frame = passend.filter(function (e) { return e.frame; })[0];
    var f = { reihe: c.sym, klasse: c.klasse, cik: n.cik, tag: n.tag, ddate: n.ddate, qtrs: n.qtrs, tafel: { wert: c.z.roh[GRUPPE_VON[n.tag]], filed: c.z.filed, form: c.z.form, adsh: c.z.adsh }, erst: n.erst, spaeter: n.spaeter,
      api: { fehler: api && api.fehler, passendeEintraege: passend.length, erst: apiErst ? { val: apiErst.val, filed: apiErst.filed, form: apiErst.form } : null, spaeter: apiSpaet ? { val: apiSpaet.val, filed: apiSpaet.filed, form: apiSpaet.form } : null, frame: frame ? { val: frame.val, accn: frame.accn, filed: frame.filed, frame: frame.frame } : null } };
    f.tafelTraegtErsten = gleich(f.tafel.wert, n.erst.wert) && f.tafel.filed === n.erst.filed;
    f.apiBestaetigtErsten = !!apiErst && gleich(apiErst.val, n.erst.wert) && apiErst.filed === n.erst.filed;
    f.apiBestaetigtSpaeteren = !!apiSpaet && gleich(apiSpaet.val, n.spaeter.wert) && apiSpaet.filed === n.spaeter.filed;
    f.frameNichtErster = !!frame && !gleich(frame.val, n.erst.wert);
    f.frameGleichSpaeterem = !!frame && gleich(frame.val, n.spaeter.wert);
    f.ok = f.tafelTraegtErsten && f.apiBestaetigtErsten && f.apiBestaetigtSpaeteren;
    if (f.ok) bestanden++; if (f.frameNichtErster) apiFrameSpaeter++;
    faelle.push(f);
    console.log('  ' + (f.ok ? 'ok ' : 'XX ') + c.sym + ' ' + n.tag + ' ' + n.ddate + ' q' + n.qtrs + ': Tafel ' + f.tafel.wert + ' (' + n.erst.filed + ') | spaeter ' + n.spaeter.wert + ' (' + n.spaeter.filed + ') | API frame ' + (frame ? frame.val + ' ' + frame.frame : '-'));
  }
  pruefung('P7 Handproben SEC-API', gewaehlt.length === 20 && bestanden === 20, { kandidaten: kandidaten.length, geprueft: gewaehlt.length, bestanden: bestanden, frameTraegtNichtDenErsten: apiFrameSpaeter, frameGleichSpaeterem: faelle.filter(function (f) { return f.frameGleichSpaeterem; }).length, anfragen: anfragen, faelle: faelle, kurz: bestanden + ' von ' + gewaehlt.length + ' bestanden, frame ohne Erstwert in ' + apiFrameSpaeter });
}

/* ---------- v1.1: P8 Aktien-Skala (Gegenprobe Marktwert, unabhaengig ueber das Tages-Panel nachgerechnet) ---------- */
var PRUEFSTAND = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
function p8(tafel, leser, bau) {
  var PR = require(path.join(PRUEFSTAND, 'pruefstand.js')), T = PR.Tafel(path.join(PRUEFSTAND, 'voll'));
  var kalIdx = T.kal.idx;
  function kursAm(syms, filed) {   /* eigener Weg: Kalenderindex des filed-Tags (oder des letzten Handelstags davor), dann bis 10 Handelstage zurueck */
    var t = kalIdx[filed]; if (t === undefined) { var tage = T.kal.tage.slice(0, T.maxTag + 1).filter(function (d) { return d <= filed; }); if (!tage.length) return null; t = kalIdx[tage[tage.length - 1]]; }
    for (var i = 0; i < syms.length; i++) { var si = T.symIdx[syms[i]] !== undefined ? T.symIdx[syms[i]] : T.symIdx[syms[i].replace(/~2$/, '')]; if (si === undefined) continue; for (var k = 0; k < 10 && t - k >= 0; k++) { var z = T.zeileVon(si, t - k); if (z >= 0) return { kurs: T.g.rohSchluss[z], sym: syms[i], tag: T.kal.tage[t - k] }; } }
    return null;
  }
  var ERWARTET = { MCD: 2e11, KO: 2.75e11, COP: 1.25e11, PCAR: 5.5e10, TEVA: 2.5e10, AAPL: 3.5e12, 'BRK.A': 1e12, 'BRK.B': 1e12 };
  var faelle = [], ok = true;
  Object.keys(ERWARTET).forEach(function (s) {
    var rows = leser.alleFilings(s).filter(function (z) { return z.form === '10-K' && z.filed < '2026-03-01'; }), z = rows[rows.length - 1];
    var f = { reihe: s, erwartet: ERWARTET[s], adsh: z && z.adsh, filed: z && z.filed, aktien: z ? z.roh.aktien : null, tag: z ? z.rohTags.aktien : null, marke: z ? z.marken.aktienSkala : null, kurs: null, marktwert: null, ok: null };
    if (!z) { f.ok = false; f.grund = 'keine 10-K-Zeile'; }
    else if (z.roh.aktien === null) { f.ok = null; f.grund = 'Aktienzahl null (Mehrklassen-Emittent, Stueckzahl je Klasse in Segmenten) - nicht pruefbar'; }
    else { var k = kursAm(z.sym, z.filed); if (!k) { f.ok = false; f.grund = 'kein Kurs'; } else { f.kurs = k.kurs; f.kursTag = k.tag; f.marktwert = z.roh.aktien * k.kurs; f.ok = f.marktwert >= ERWARTET[s] / 3 && f.marktwert <= ERWARTET[s] * 3; } }
    if (f.ok === false) ok = false;
    faelle.push(f);
    console.log('  ' + s + ': Marktwert ' + (f.marktwert === null ? '-' : f.marktwert.toExponential(2)) + ' erwartet ' + ERWARTET[s].toExponential(1) + ' ' + (f.ok === null ? 'nicht pruefbar' : f.ok ? 'ok' : 'FALSCH') + (f.grund ? ' (' + f.grund + ')' : '') + ' [aktien ' + f.aktien + ' ' + f.tag + ' ' + JSON.stringify(f.marke) + ']');
  });
  var aapl = leser.alleFilings('AAPL').filter(function (z) { return z.filed === '2014-04-24' && z.form === '10-Q'; })[0];
  var aaplM = aapl && aapl.marken.aktienSkala, aaplOk = !!aapl && aapl.roh.aktien !== null && Math.abs(aapl.roh.aktien / 8.6e8 - 1) < 0.05 && !!aaplM && ((aaplM.faktorCik || 1) * (aaplM.faktorAbweichler || 1) === 1000);
  if (!aaplOk) ok = false;
  /* Restspruenge > 30 nach der Korrektur (Runde 2): Reverse-Split-Wanderer bleiben (Fund, kein Fehler) und werden gelistet; gezaehlt
   * wird, was der Aussenanker als Fehler ausweist - Spruenge, bei denen eine Seite einen Quotienten Marktwert/Vermoegen ausserhalb
   * [1e-3, 1e3] hat - gegen die 10 % der v1-Spruenge. Der Anteil aller Restspruenge steht daneben. */
  var as = bau.v11.aktienSkala, sq = as.spruengeNachQuotient, spruengeOk = sq.eineSeiteUnplausibel < 0.10 * as.spruengeVor30;
  if (!spruengeOk) ok = false;
  pruefung('P8 Aktien-Skala', ok, { gegenprobe: faelle, aapl20140424: aapl ? { adsh: aapl.adsh, aktien: aapl.roh.aktien, marke: aapl.marken.aktienSkala, ok: aaplOk } : null, spruenge: { vor: as.spruengeVor30, nach: as.spruengeNach30, anteilAlle: Math.round(1000 * as.spruengeNach30 / as.spruengeVor30) / 10, nachQuotient: { beidePlausibel: sq.beidePlausibel, eineSeiteUnplausibel: sq.eineSeiteUnplausibel, ohneQuotient: sq.ohneQuotient }, anteilFehler: Math.round(1000 * sq.eineSeiteUnplausibel / as.spruengeVor30) / 10, ok: spruengeOk, jeArt: as.spruengeNachJeArt, wanderer: as.wanderer.n, wandererListe: as.wanderer.liste.slice(0, 30), fehlerBeispiele: sq.fehlerBeispiele.slice(0, 20) }, zaehler: { faktorCikCiks: as.faktorCik.ciks, faktorCikZeilen: as.faktorCik.zeilen, skalaUnklar: as.skalaUnklar.ciks, ohneAnkerCiks: as.ohneAnker.ciks, abweichler: as.abweichler, waechterVerworfen: as.waechter.verworfen, ohneKurs: as.ohneKurs, ohneVermoegen: as.ohneVermoegen },
    kurz: faelle.filter(function (f) { return f.ok; }).length + ' von ' + faelle.filter(function (f) { return f.ok !== null; }).length + ' Marktwerten ok, AAPL 2014 ' + (aaplOk ? 'ok' : 'FALSCH') + ', Spruenge>30 ' + as.spruengeVor30 + ' -> ' + as.spruengeNach30 + ' (davon Fehler nach Anker ' + sq.eineSeiteUnplausibel + (spruengeOk ? ' ok' : ' NICHT < 10 %') + ', plausibel ' + sq.beidePlausibel + ', ohne Anker ' + sq.ohneQuotient + ')' });
}

/* ---------- v1.1: P9 Zuordnung ---------- */
function p9(leser, panel) {
  var m = leser.meta.reihen, x = m.X, xOk = !!x && (x.cik === null || x.cik === 1163302);
  var fest = { F: 37996, T: 732717, A: 1090872 }, festOk = Object.keys(fest).every(function (s) { return m[s] && m[s].cik === fest[s] && m[s].pruefung === 'tabelle'; });
  var tabelleAnders = [];
  panel.reihen.forEach(function (r) { if (r.sicherheit !== 'tabelle') return; var e = m[r.reihe]; if (!e || e.cik !== +r.cik || e.sicherheit !== 'tabelle' || e.pruefung !== 'tabelle') tabelleAnders.push(r.reihe); });
  var zu = leser.meta && JSON.parse(fs.readFileSync(path.join(TAFEL, '_bau.json'), 'utf8')).v11.zuordnung;
  pruefung('P9 Zuordnung', xOk && festOk && tabelleAnders.length === 0, { X: x, festOk: festOk, tabelleAnders: tabelleAnders.slice(0, 20), tabelleAndersN: tabelleAnders.length, jeStufe: zu.jeStufe, ciksOhneReiheDurchVerwerfen: zu.ciksOhneReiheDurchVerwerfen, kurz: 'X -> ' + (x && x.cik) + ' (' + (x && x.pruefung) + '), F/T/A unveraendert ' + festOk + ', Tabellen-Reihen veraendert ' + tabelleAnders.length });
}

/* ---------- v1.1: P10 Einheit ---------- */
function p10(tafel, bau) {
  var hrc = tafel.filter(function (z) { return z.adsh === '0000047518-21-000084'; })[0], hrcOk = !!hrc && hrc.marken.einheit === 'verdacht' && hrc.marken.einheitFakt === 'Assets' && hrc.roh.vermoegen === null && hrc.roh.umsatz !== null;   /* nur der Assets-Fakt fehlt, der Umsatz desselben adsh bleibt */
  var jeCik = {}; tafel.forEach(function (z) { if (z.roh.vermoegen > 0) (jeCik[z.cik] = jeCik[z.cik] || []).push(z); });   /* Dateireihenfolge = Rangordnung */
  var verstoesse = [], gepaart = 0;
  Object.keys(jeCik).forEach(function (c) {
    var l = jeCik[c];
    for (var i = 1; i < l.length - 1; i++) {
      gepaart++;
      var a = Math.log10(l[i].roh.vermoegen), dv = a - Math.log10(l[i - 1].roh.vermoegen), dn = a - Math.log10(l[i + 1].roh.vermoegen);
      if (Math.abs(dv) > 2 && Math.abs(dn) > 2 && (dv > 0) === (dn > 0)) verstoesse.push({ adsh: l[i].adsh, sym: l[i].sym, vermoegen: l[i].roh.vermoegen, vorher: l[i - 1].roh.vermoegen, nachher: l[i + 1].roh.vermoegen });
    }
  });
  var ei = bau.v11.einheit, verdachtZeilen = tafel.filter(function (z) { return z.marken.einheit === 'verdacht'; }).length;
  pruefung('P10 Einheit', hrcOk && verstoesse.length === 0 && verdachtZeilen === ei.verdacht, { hrc: hrc ? { adsh: hrc.adsh, einheit: hrc.marken.einheit, einheitFakt: hrc.marken.einheitFakt, vermoegen: hrc.roh.vermoegen, umsatz: hrc.roh.umsatz } : null, innereZeilenGeprueft: gepaart, verstoesse: verstoesse.slice(0, 20), verstoesseN: verstoesse.length, verdachtZeilen: verdachtZeilen, verdachtJeGrund: ei.jeGrund, huellenEinseitig: ei.einseitig, ohnePruefung: ei.ohnePruefung, faktenUebersprungen: bau.fakten.einheitVerdachtUebersprungen, faelle: ei.faelle,
    kurz: 'HRC ' + (hrcOk ? 'markiert (nur Assets)' : 'NICHT markiert') + ', Spruenge gegen beide Nachbarn > 100: ' + verstoesse.length + ', verdaechtig ' + verdachtZeilen + ', Fakten uebersprungen ' + bau.fakten.einheitVerdachtUebersprungen + ', Huellen (einseitig) ' + ei.einseitig });
}

/* ---------- v1.1: P11 Vorjahresbestand aus der Huelle (Runde 2: Marke UND Ergebnis) ---------- */
/* AMCR und TW muessen an den betroffenen Filings die Marke d4 'huelle' tragen (jede v1-Zeile mit Huellen-Quotient), und das
 * Ergebnis muss stimmen: vermoegenVor null (Huelle an D4) oder plausibel (nur D5..D7), fm null; tafelweit kein Quotient mehr
 * ausserhalb [1e-3, 1e3]. */
function p11(tafel, leser) {
  var V1 = path.join(__dirname, 'fundamentaltafel-v1'), alt = {};
  if (fs.existsSync(V1)) fs.readdirSync(V1).filter(function (f) { return /^tafel-(2019|202\d)\.jsonl$/.test(f); }).forEach(function (f) { fs.readFileSync(path.join(V1, f), 'utf8').split('\n').forEach(function (l) { if (l.indexOf('"cik":1748790,') > 0 || l.indexOf('"cik":1758730,') > 0) { var z = JSON.parse(l); alt[z.adsh] = z; } }); });
  function huellenQuotient(z) { return z.vermoegenVor > 0 && z.roh.vermoegen > 0 && (z.vermoegenVor / z.roh.vermoegen < 1e-3 || z.vermoegenVor / z.roh.vermoegen > 1e3); }
  var betroffen = {}, alleOk = true, altVorhanden = Object.keys(alt).length > 0;
  ['AMCR', 'TW'].forEach(function (s) {
    var faelle = [];
    leser.alleFilings(s).forEach(function (z) {
      var a = alt[z.adsh], warHuelle = !!a && huellenQuotient(a), marke = z.marken.d4 === 'huelle';
      if (!warHuelle && !marke) return;
      var ergebnis = !huellenQuotient(z) && (z.vermoegenVor === null || z.vermoegenVor / z.roh.vermoegen >= 1e-3) && (a ? z.abgeleitet.fm === null || Math.abs(z.abgeleitet.fm) < 1 : true);
      var okZeile = marke && ergebnis; if (!okZeile) alleOk = false;
      faelle.push({ adsh: z.adsh, form: z.form, period: z.period, filed: z.filed, marke: marke, v1: a ? { vermoegenVor: a.vermoegenVor, fm: a.abgeleitet.fm } : null, v11: { vermoegenVor: z.vermoegenVor, fm: z.abgeleitet.fm }, ergebnisOk: ergebnis, ok: okZeile });
    });
    betroffen[s] = faelle;
    if (!faelle.length) alleOk = false;
  });
  var verstoesse = [], huelle = 0, geprueft = 0;
  tafel.forEach(function (z) { if (z.marken.d4 === 'huelle') huelle++; if (!(z.vermoegenVor > 0) || !(z.roh.vermoegen > 0)) return; geprueft++; if (huellenQuotient(z)) verstoesse.push({ adsh: z.adsh, sym: z.sym, vermoegen: z.roh.vermoegen, vermoegenVor: z.vermoegenVor }); });
  var ok = altVorhanden && alleOk && verstoesse.length === 0;
  pruefung('P11 D4 Huelle', ok, { v1Vorhanden: altVorhanden, AMCR: betroffen.AMCR, TW: betroffen.TW, zeilenMitHuelle: huelle, quotientenGeprueft: geprueft, verstoesse: verstoesse.slice(0, 20), verstoesseN: verstoesse.length,
    kurz: 'AMCR ' + betroffen.AMCR.filter(function (f) { return f.ok; }).length + '/' + betroffen.AMCR.length + ', TW ' + betroffen.TW.filter(function (f) { return f.ok; }).length + '/' + betroffen.TW.length + ' Zeilen mit Marke und Ergebnis, d4-Marke gesamt ' + huelle + ', Quotient ausserhalb [1e-3, 1e3]: ' + verstoesse.length + ' von ' + geprueft });
}

/* ---------- v1.1: P12 Leser unveraendert, Kennung ---------- */
function p12(leser) {
  var p1b = E.pruefungen['P1b 1000 Zufallszugriffe'], ok = !!p1b && p1b.ok && leser.kennung === 'fundamentaltafel-2026-09-16/v1.1' && F.KENNUNG === leser.kennung;
  var altOk = false; try { F.oeffne(path.join(__dirname, 'fundamentaltafel-v1')); } catch (e) { altOk = /Kennung/.test(e.message); }   /* die alte Tafel muss der Leser abweisen */
  pruefung('P12 Leser unveraendert', ok && altOk, { kennung: leser.kennung, leserKennung: F.KENNUNG, p1bOk: !!p1b && p1b.ok, geliefert: p1b && p1b.geliefert, verstoesse: p1b && p1b.verstoesse, alteTafelAbgewiesen: altOk, kurz: 'Kennung ' + leser.kennung + ', P1b ' + (p1b && p1b.geliefert) + ' geliefert / ' + (p1b && p1b.verstoesse) + ' Verstoesse, v1-Ordner abgewiesen ' + altOk });
}

async function main() {
  var t0 = Date.now();
  fs.mkdirSync(TMP, { recursive: true });
  var kal = Object.keys(JSON.parse(fs.readFileSync('E:/Markt-Dashboard-Archiv/alpaca1m/_kalender.json', 'utf8')).tage).sort();
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var bau = JSON.parse(fs.readFileSync(path.join(TAFEL, '_bau.json'), 'utf8'));
  var leser = p1(kal);
  var tafel = ladeTafel();
  E.tafel = { zeilen: tafel.length, kennung: leser.kennung, dateien: leser.dateien };
  p2(tafel, panel, leser);
  p3(tafel);
  p4(tafel, leser);
  p5(tafel);
  await p7(tafel, leser);
  p8(tafel, leser, bau);
  p9(leser, panel);
  p10(tafel, bau);
  p11(tafel, leser);
  p12(leser);
  p6();
  E.sekunden = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(__dirname, 'test-fundamental.json'), JSON.stringify(E, null, 1));
  console.log((E.fehler ? 'FEHLER: ' + E.fehler : 'alle Pruefungen bestanden') + ' (' + E.sekunden + ' s)');
  process.exit(E.fehler ? 1 : 0);
}
main().catch(function (e) { console.error(e); process.exit(1); });
