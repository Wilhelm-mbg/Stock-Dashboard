'use strict';
/* Pruefbericht "Live gegen Messung" - Ergebnis-Drift, Teil 1: Ereignis-Quelle, Zeitpunkt, Signal und Auswahl.
 *
 * Soll ist die GEMESSENE Regel: studien/vorregistrierung-2026-10-04-ergebnis-drift/ (VORREGISTRIERUNG.md A2-A5, Teil C 1;
 * zehntel.js, konfig.js, ereignisse.js) mit den Bausteinen der Machbarkeit studien/ergebnis-drift-ereignis-2026-10-04/
 * (zeit.js, ueberraschung.js, zuordnung.js). Ist ist die App: drift.js, driftui.js (mische), main.js (earnings-fetch),
 * mfdepot.js (Drift.heute im Takt), mfhandel.js (driftAbgleich).
 *
 * Jeder Test druckt ueber Z.zeile GENAU EINE Zeile: Abweichung (true) oder kein Unterschied (false).
 * Nur Kunstdaten, feste Uhr (kein Date.now), kein Netz, keine echten Kurse. Alle Zeiten werden in UTC gebaut; New Yorker
 * Ortszeit rechnet zeit.js der Machbarkeit mit Intl und fester Zone America/New_York - nichts haengt an der Zone der Maschine.
 *
 * Vertrag: module.exports = function (Z) -> [{ nr, titel, lauf }]; Z.WURZEL = Repo-Wurzel (PRUEF_WURZEL-faehig),
 * Z.zeile(abweichung, text). Selbstlauf: node pruefberichte/live-gegen-messung-drift/teil-1-ereignis-signal.tests.js [Nr]
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');
var fs = require('fs');

module.exports = function (Z) {
  var W = Z.WURZEL;
  var MB = path.join(W, 'studien', 'ergebnis-drift-ereignis-2026-10-04');
  var VR = path.join(W, 'studien', 'vorregistrierung-2026-10-04-ergebnis-drift');
  var Dr = require(path.join(W, 'drift.js'));
  var MH = require(path.join(W, 'mfhandel.js'));
  var Zt = require(path.join(MB, 'zeit.js'));
  var UE = require(path.join(MB, 'ueberraschung.js'));
  var MK = require(path.join(MB, 'konfig.js'));
  var ZH = require(path.join(VR, 'zehntel.js'));
  var KV = require(path.join(VR, 'konfig.js'));
  var LESART = JSON.parse(fs.readFileSync(path.join(MB, 'zeitpruefung.json'), 'utf8')).lesart;   /* 'utc' */
  var PK = null;
  function pruefstandKonfig() { return PK || (PK = require(path.join(W, 'studien', 'querschnitt-pruefstand-2026-09-13', 'konfig.js'))); }

  /* ---------------- Hilfen ---------------- */
  var TAG = 86400000;
  /** n Werktage ab vonIso (Mo-Fr), ohne die Tage in frei. */
  function werktage(vonIso, n, frei) {
    var aus = [], t = Date.parse(vonIso + 'T00:00:00Z');
    while (aus.length < n) {
      var d = new Date(t), w = d.getUTCDay(), iso = d.toISOString().slice(0, 10);
      if (w !== 0 && w !== 6 && !(frei && frei.indexOf(iso) !== -1)) aus.push(iso);
      t += TAG;
    }
    return aus;
  }
  /** Tagesbalken wie bei Yahoo gestempelt (13:30 UTC, New Yorker Tag derselbe). */
  function balkenT(iso) { return Date.parse(iso + 'T13:30:00Z'); }
  /** Kursreihe der App: [[t, schluss, stueck]] - die App-Reihe kennt KEINE Eroeffnung. */
  function reihe(tage, kurs, stueck) {
    return tage.map(function (iso, i) { return [balkenT(iso), typeof kurs === 'function' ? kurs(i) : (kurs || 100), stueck == null ? 3e6 : stueck]; });
  }
  /** Kalender in der Form des Pruefstands (zeit.js): {tage, idx, close}; ohne close gilt 16:00 als Schluss. */
  function kal(tage) { var idx = {}; tage.forEach(function (t, i) { idx[t] = i; }); return { tage: tage, idx: idx, close: {} }; }
  /** Einstiegstag der Messung: Annahmezeit (SEC-Text, UTC) -> New York -> erster Handelstag, an dessen Eroeffnung sie bekannt war. */
  function messE(isoUtc, K) { var ny = Zt.nyZeit(isoUtc, LESART); return ny ? Zt.einstiegstag(ny, K, MK.HANDELSBEGINN_SEK) : -1; }
  /** Reaktionstag der App fuer denselben Stempel auf derselben Reihe. */
  function appR(isoUtc, tage) { var r = Dr.reaktionstag(isoUtc, Dr.datumIndex(reihe(tage))); return r == null ? -1 : r; }
  function tagName(tage, i) { if (i < 0 || i >= tage.length) return 'keiner'; var w = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(tage[i] + 'T12:00:00Z').getUTCDay()]; return w + ' ' + tage[i]; }

  /** Ereignisse fuer zuordnen() (App) und zuteilen() (Messung) aus derselben Liste [tag, wert]; nach Tag sortiert (stabil). */
  function evsAus(liste) {
    return liste.map(function (x, k) { return { sym: x[2] || ('S' + k), i: x[0], mi: x[0], ueb: x[1], t: 0, k: k }; })
      .sort(function (a, b) { return a.mi - b.mi; });
  }
  function appKlasse(evs, ziel, opts) {
    var r = Dr.zuordnen(evs, opts).filter(function (p) { return p.e === ziel; })[0];
    return r ? (r.richtung > 0 ? 'oben/kaufen' : 'unten/verkaufen') : 'kein Signal';
  }
  /** Beide Seiten auf dieselbe Einteilung bringen: oben / unten / keins (Mitte und "kein Signal" handeln beide nicht). */
  function norm(k) { return /^oben/.test(k) ? 'oben' : /^unten/.test(k) ? 'unten' : 'keins'; }
  function anders(a, m) { return norm(a) !== norm(m); }
  function messKlasse(liste, idx, opt) {
    var tag = Int32Array.from(liste.map(function (x) { return x[0]; })), wert = Float64Array.from(liste.map(function (x) { return x[1]; }));
    var aus = ZH.zuteilen(tag, wert, Object.assign({ abTag: 0, fenster: KV.VERGLEICH_TAGE, mindestens: KV.VERGLEICH_MINDESTENS, anteil: KV.ANTEIL }, opt || {}));
    var c = aus[idx];
    return c === ZH.OBEN ? 'oben/kaufen' : c === ZH.UNTEN ? 'unten' : c === ZH.MITTE ? 'Mitte' : c === ZH.KEIN_SIGNAL ? 'kein Signal' : 'vor Fenster';
  }

  /** Kunstwelt fuer Drift.heute: 260 Werktage ab 01.12.2025 (Ende 2026-11-..); Vorlauf-Ereignisse auf P0..P3 verteilt,
   *  Ziel-Ereignisse je eigenes Kuerzel. termin: ISO-Stempel 12:00 UTC (vorboerslich, in der App derselbe Tag). */
  var WELT_TAGE = werktage('2025-06-02', 260);
  function welt(prior, ziele, o) {
    o = o || {};
    var tage = WELT_TAGE, kurse = {}, termine = {};
    ['P0', 'P1', 'P2', 'P3'].forEach(function (s) { kurse[s] = reihe(tage); termine[s] = []; });
    prior.forEach(function (x, k) { termine['P' + (k % 4)].push([tage[x[0]] + 'T12:00:00.000Z', 1, 1, x[1]]); });
    ziele.forEach(function (z) {
      var von = z.ab || 0;
      kurse[z.sym] = reihe(tage.slice(von), z.kurs, z.stueck).map(function (b) { return b; });
      termine[z.sym] = (termine[z.sym] || []).concat([[z.termin || (tage[z.tag] + 'T12:00:00.000Z'), 1, 1, z.wert]]);
    });
    var kursMap = {}, termMap = {};
    (o.reihenfolge || Object.keys(kurse)).forEach(function (s) { kursMap[s] = kurse[s]; termMap[s] = termine[s]; });
    return { kurse: kursMap, termine: termMap, markt: reihe(o.marktTage || tage), tage: tage };
  }
  function offenVon(h, sym) { return h.offen.filter(function (x) { return x.sym === sym; }); }

  return [
    /* ======================= Quelle ======================= */
    { nr: 'E1', titel: 'Quelle der Ueberraschung: Yahoo-Konsens in % gegen Zeitreihen-SUE aus der Tafel', lauf: async function () {
      /* Zwei Firmen, je acht Quartale Nettoergebnis (D0 = juengstes) und eine Konsens-Ueberraschung wie earningsHistory sie liefert. */
      var X = { netto: [80, 95, 90, 85, 100, 95, 90, 85], surprisePercentRaw: 0.25 };    /* schlaegt den Konsens, faellt gegen das Vorjahr */
      var Y = { netto: [120, 95, 90, 85, 100, 95, 90, 85], surprisePercentRaw: -0.08 };  /* verfehlt den Konsens, steigt gegen das Vorjahr */
      var jetzt = Date.UTC(2026, 6, 31, 12, 0), termin = Date.UTC(2026, 6, 28, 20, 5), qEnde = Date.UTC(2026, 5, 30);
      function app(f) {   /* main.js:246-256: ueberraschung = surprisePercent.raw * 100, dann drift.js paareAktuell */
        var p = Dr.paareAktuell([{ quartalsEndeMs: qEnde, ueberraschung: f.surprisePercentRaw * 100, ist: 1, schaetzung: 1 }], termin, 120, jetzt);
        return p ? p.ueberraschung : null;
      }
      function mess(f) { var u = UE.ausZeile({ quartale: { netto: f.netto } }); return u.wert; }
      var aX = app(X), aY = app(Y), mX = mess(X), mY = mess(Y);
      var abw = (aX > aY) !== (mX > mY);
      Z.zeile(abw, 'App-Wert (Konsens-%): X ' + aX + ' / Y ' + aY + ' -> X vor Y; Messung (SUE netto D0-D4 / sd): X ' + mX.toFixed(2) +
        ' / Y ' + mY.toFixed(2) + ' -> ' + (mX > mY ? 'X vor Y' : 'Y vor X') + ' - dieselbe Meldung landet im anderen Ende der Rangfolge');
    } },

    /* ======================= Zeitpunkt ======================= */
    { nr: 'E2', titel: 'Meldung waehrend des Handels: App derselbe Tag (Schluss), Messung naechster Tag (Eroeffnung)', lauf: async function () {
      var so = werktage('2026-07-06', 10), wi = werktage('2026-12-07', 10);
      var KS = kal(so), KW = kal(wi);
      /* Di 14.07.2026 14:00 UTC = 10:00 EDT; Di 08.12.2026 19:30 UTC = 14:30 EST */
      var f1 = '2026-07-14T14:00:00.000Z', f2 = '2026-12-08T19:30:00.000Z';
      var a1 = appR(f1, so), m1 = messE(f1, KS), a2 = appR(f2, wi), m2 = messE(f2, KW);
      /* Ueber die ganze Handelszeit: wie viele Minuten weichen im Tagesindex ab? */
      function zaehle(tage, K, iso, vonUtcMin, bisUtcMin) {
        var n = 0, abw = 0;
        for (var m = vonUtcMin; m < bisUtcMin; m++) {
          var s = iso + 'T' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + ':00.000Z';
          n++; if (appR(s, tage) !== messE(s, K)) abw++;
        }
        return abw + '/' + n;
      }
      var zs = zaehle(so, KS, '2026-07-14', 13 * 60 + 30, 20 * 60);   /* 09:30-16:00 EDT */
      var zw = zaehle(wi, KW, '2026-12-08', 14 * 60 + 30, 21 * 60);   /* 09:30-16:00 EST */
      var abw = a1 !== m1 || a2 !== m2;
      Z.zeile(abw, '10:00 EDT: App ' + tagName(so, a1) + ' (Schluss), Messung ' + tagName(so, m1) + ' (Eroeffnung); 14:30 EST: App ' +
        tagName(wi, a2) + ', Messung ' + tagName(wi, m2) + '; Handelsminuten mit anderem Einstiegstag: Sommer ' + zs + ', Winter ' + zw +
        ' (im Winter stimmt nur 15:00-16:00 EST, weil die App ab 20:00 UTC "nach Schluss" sagt)');
    } },

    { nr: 'E3', titel: 'Einstiegskurs: App rechnet ab dem SCHLUSS des Reaktionstags, Messung kauft zur EROEFFNUNG des Einstiegstags', lauf: async function () {
      /* Vorboerslich 07:00 EDT (11:00 UTC) am Tag D: beide waehlen D - die App aber dessen Schluss. Kunstkurs: Eroeffnung D 100, Schluss D 108. */
      var tage = WELT_TAGE, D = 250, eroeffnung = {}, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 60), k]);
      var w = welt(prior, [{ sym: 'ZZ', tag: D, wert: 1000, termin: tage[D] + 'T11:00:00.000Z', kurs: function (i) { return i >= D ? 108 : 100; } }]);
      eroeffnung[D] = 100;   /* die Messung liest die Eroeffnung des Einstiegstags (A4); die App-Reihe hat dieses Feld nicht */
      var h = Dr.heute(w.kurse, w.termine, w.markt);
      var o = offenVon(h, 'ZZ')[0];
      var mE = messE(tage[D] + 'T11:00:00.000Z', kal(tage));
      var abw = !!o && o.einstieg !== eroeffnung[mE];
      Z.zeile(abw, 'Meldung 07:00 EDT am ' + tage[D] + ': Messung kauft zur Eroeffnung ' + tagName(tage, mE) + ' = ' + eroeffnung[mE] +
        '; App Drift.heute: einstieg = ' + (o ? o.einstieg : 'kein Signal') + ' (Schluss desselben Tags, b[r][1]) - der Kurssprung des ' +
        'Meldetags (+8 %) liegt in der Messung im Ertrag, in der App davor');
    } },

    { nr: 'E4', titel: 'Stempel ohne Uhrzeit (04:00/05:00 UTC): App immer einen Tag spaeter, Messung kennt die Annahmezeit', lauf: async function () {
      var tage = werktage('2026-07-06', 10), K = kal(tage);
      var yahoo = '2026-07-14T04:00:00.000Z';                 /* nur Datum (Mitternacht EDT) */
      var secVor = '2026-07-14T11:00:00.000Z';                /* dieselbe Meldung laut SEC: 07:00 EDT, vorboerslich */
      var secNach = '2026-07-14T20:30:00.000Z';               /* Gegenfall: 16:30 EDT, nach Schluss */
      var a = appR(yahoo, tage), mV = messE(secVor, K), mN = messE(secNach, K);
      Z.zeile(a !== mV, 'Yahoo-Stempel ' + yahoo + ' -> App ' + tagName(tage, a) + '; Messung mit SEC-Annahme 07:00 EDT -> ' +
        tagName(tage, mV) + ' (einen Handelstag frueher), mit 16:30 EDT -> ' + tagName(tage, mN) +
        ' (gleich) - die App kann die beiden Faelle nicht unterscheiden (drift.js:76-78, rund 60 % der Stempel)');
    } },

    { nr: 'E5', titel: 'Meldung am Wochenende/Feiertag mit Uhrzeit ab 20:00 UTC: App zaehlt den Folgetag doppelt', lauf: async function () {
      var tage = werktage('2026-06-29', 15, ['2026-07-03']), K = kal(tage);   /* Fr 03.07.2026 boersenfrei */
      var sa = '2026-07-11T21:30:00.000Z', fei = '2026-07-03T21:00:00.000Z';
      var aS = appR(sa, tage), mS = messE(sa, K), aF = appR(fei, tage), mF = messE(fei, K);
      Z.zeile(aS !== mS || aF !== mF, 'Sa 11.07. 17:30 EDT: App ' + tagName(tage, aS) + ', Messung ' + tagName(tage, mS) +
        '; Feiertag Fr 03.07. 17:00 EDT: App ' + tagName(tage, aF) + ', Messung ' + tagName(tage, mF) +
        ' - drift.js:55-59 springt erst auf den naechsten Handelstag und zaehlt dann wegen der Uhrzeit noch einen dazu (:78)');
    } },

    { nr: 'E6', titel: 'Gegenprobe Sommer-/Winterzeit: ausserhalb der Handelszeit gleicher Einstiegstag', lauf: async function () {
      var abw = 0, n = 0, bsp = '';
      [['2026-07-06', '2026-07-14'], ['2026-12-07', '2026-12-08'], ['2026-03-02', '2026-03-10'], ['2026-10-26', '2026-11-03']].forEach(function (f) {
        var tage = werktage(f[0], 10), K = kal(tage);
        for (var m = 0; m < 24 * 60; m++) {
          var hh = Math.floor(m / 60), mm = m % 60;
          if ((hh === 4 || hh === 5) && mm === 0) continue;   /* Stempel ohne Uhrzeit: E4 */
          var s = f[1] + 'T' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':00.000Z';
          var ny = Zt.nyZeit(s, LESART);
          if (ny.datum in K.idx && ny.sek >= MK.HANDELSBEGINN_SEK && ny.sek < 16 * 3600) continue;   /* im Handel: E2 */
          n++;
          if (appR(s, tage) !== messE(s, K)) { abw++; if (!bsp) bsp = s; }
        }
      });
      Z.zeile(abw > 0, abw + ' von ' + n + ' Minuten ausserhalb der New Yorker Handelszeit (Sommer, Winter, Woche nach beiden Umstellungen) ' +
        'mit anderem Einstiegstag' + (bsp ? ', z. B. ' + bsp : '') + ' - die feste Grenze 20:00 UTC trifft vor- und nachboerslich in beiden Zeiten');
    } },

    { nr: 'E7', titel: 'Spaeter Einstieg: das Drift-Buch kauft Signale bis 5 Handelstage nach dem Einstiegstag', lauf: async function () {
      /* Messung A7: an jedem Tag nur Meldungen mit Einstiegstag HEUTE. App: mfhandel.js driftAbgleich, maxAlterTage 5. */
      var buch = { cash: 100000, positionen: [], trades: [] }, jetzt = Date.UTC(2026, 6, 20, 20, 30);
      var heute = { offen: [{ sym: 'ALT', richtung: 'kaufen', seitTagen: 4, ueberraschung: 30 }], faellig: [], halten: 60 };
      var g = MH.driftAbgleich(buch, heute, { ALT: 100 }, jetzt, {});
      Z.zeile(g.eroeffnet > 0, 'Signal mit seitTagen 4: App eroeffnet ' + g.eroeffnet + ' Position(en) zum heutigen Kurs; Messung haette ' +
        'nur am Einstiegstag zur Eroeffnung gekauft und die Meldung danach nicht mehr (Buch A7)');
    } },

    /* ======================= Signal ======================= */
    { nr: 'E8', titel: 'Fuenftel statt Zehntel: anteil 0,20 (App) gegen 0,10 (Messung)', lauf: async function () {
      var liste = [];
      for (var k = 0; k < 250; k++) liste.push([1 + (k % 62), k]);   /* 250 Vergleichswerte 0..249 in E-62..E-1 */
      liste.push([63, 212, 'ZIEL']);                                   /* 85. Perzentil */
      var evs = evsAus(liste), ziel = evs.filter(function (e) { return e.sym === 'ZIEL'; })[0];
      var app = appKlasse(evs, ziel), app10 = appKlasse(evs, ziel, { anteil: 0.1 }), mess = messKlasse(liste, liste.length - 1);
      Z.zeile(anders(app, mess), 'Wert am 85. Perzentil: App (STANDARD anteil ' + Dr.STANDARD.anteil + ') ' + app + ', Messung (ANTEIL ' + KV.ANTEIL +
        ') ' + mess + '; App mit anteil 0,1: ' + app10 + ' - die Haelfte der App-Kaeufe liegt zwischen 80. und 90. Perzentil');
    } },

    { nr: 'E9', titel: 'Mindestzahl der Vergleichsmenge: 40 (App) gegen 200 (Messung)', lauf: async function () {
      var liste = [];
      for (var k = 0; k < 100; k++) liste.push([1 + (k % 62), k]);
      liste.push([63, 150, 'ZIEL']);
      var evs = evsAus(liste), ziel = evs.filter(function (e) { return e.sym === 'ZIEL'; })[0];
      var app = appKlasse(evs, ziel), mess = messKlasse(liste, liste.length - 1);
      Z.zeile(anders(app, mess), '100 Vergleichswerte, Ziel ueber allen: App ' + app + ' (minVergleich ' + Dr.STANDARD.minVergleich + '), Messung ' +
        mess + ' (mindestens ' + KV.VERGLEICH_MINDESTENS + ')');
    } },

    { nr: 'E10', titel: 'Fensterlaenge der Vergleichsmenge: 120 (App) gegen 63 Handelstage (Messung)', lauf: async function () {
      var E = 200, liste = [];
      for (var k = 0; k < 250; k++) liste.push([E - 63 + (k % 63), k]);       /* juengste 63 Tage: 0..249 */
      for (var j = 0; j < 400; j++) liste.push([E - 120 + (j % 57), -1000]); /* E-120..E-64: niedrige Werte, nur im App-Fenster */
      liste.push([E, 200, 'ZIEL']);
      var evs = evsAus(liste), ziel = evs.filter(function (e) { return e.sym === 'ZIEL'; })[0];
      var app = appKlasse(evs, ziel, { anteil: 0.1 }), app63 = appKlasse(evs, ziel, { anteil: 0.1, fenster: 63 });
      var mess = messKlasse(liste, liste.length - 1);
      Z.zeile(anders(app, mess), 'gleicher Anteil 0,1, Wert 200 bei 250 Werten 0..249 in den letzten 63 Tagen und 400 alten bei -1000: App (Fenster ' +
        Dr.STANDARD.fenster + ') ' + app + ', Messung (63) ' + mess + '; App mit Fenster 63: ' + app63);
    } },

    { nr: 'E11', titel: 'Ereignisse desselben Tags in der Vergleichsmenge: Ergebnis haengt an der Reihenfolge der Kuerzel', lauf: async function () {
      var D = 230, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var ziele = [{ sym: 'AAA', tag: D, wert: 1000 }, { sym: 'BBB', tag: D, wert: 159.5 }];
      var w1 = welt(prior, ziele, { reihenfolge: ['P0', 'P1', 'P2', 'P3', 'AAA', 'BBB'] });
      var w2 = welt(prior, ziele, { reihenfolge: ['P0', 'P1', 'P2', 'P3', 'BBB', 'AAA'] });
      var b1 = offenVon(Dr.heute(w1.kurse, w1.termine, w1.markt), 'BBB')[0], b2 = offenVon(Dr.heute(w2.kurse, w2.termine, w2.markt), 'BBB')[0];
      /* Messung: dieselben Kunstdaten, beide Reihenfolgen; Anteil, Fenster und Mindestzahl der App, damit nur die Tagesregel verglichen wird */
      var l1 = prior.concat([[D, 1000], [D, 159.5]]), l2 = prior.concat([[D, 159.5], [D, 1000]]);
      var wieApp = { anteil: Dr.STANDARD.anteil, fenster: Dr.STANDARD.fenster, mindestens: Dr.STANDARD.minVergleich };
      var m1 = messKlasse(l1, l1.length - 1, wieApp), m2 = messKlasse(l2, l2.length - 2, wieApp);
      var abw = !!b1 !== !!b2;
      Z.zeile(abw, 'BBB (Wert 159,5) am selben Tag wie AAA (1000): App ' + (b1 ? b1.richtung : 'kein Signal') + ' bei Reihenfolge AAA,BBB, ' +
        (b2 ? b2.richtung : 'kein Signal') + ' bei BBB,AAA; Messung (Tag selbst nie in der Vergleichsmenge, Teil C 1) ' + m1 + ' / ' + m2);
    } },

    { nr: 'E12', titel: 'Gleichstand: App zaehlt nur strikt kleinere Werte, Messung nimmt Wert >= Perzentil', lauf: async function () {
      var liste = [];
      for (var k = 0; k < 200; k++) liste.push([1 + (k % 62), 2.5]);   /* Kunstfall: alle Vergleichswerte gleich */
      liste.push([63, 2.5, 'ZIEL']);
      var evs = evsAus(liste), ziel = evs.filter(function (e) { return e.sym === 'ZIEL'; })[0];
      var app = appKlasse(evs, ziel), app10 = appKlasse(evs, ziel, { anteil: 0.1, fenster: 63, minVergleich: 200 }), mess = messKlasse(liste, liste.length - 1);
      Z.zeile(anders(app, mess), 'Wert gleich allen 200 Vergleichswerten: App ' + app + ' (auch mit anteil 0,1/Fenster 63/min 200: ' + app10 + '), Messung ' +
        mess + ' - bei Gleichstand landet die App am unteren Ende, die Messung oben');
    } },

    { nr: 'E13', titel: 'Rangregel ohne Gleichstand: Anteil strikt kleiner gegen Perzentil mit linearer Interpolation', lauf: async function () {
      var oben = [], unten = [];
      for (var k = 0; k < 200; k++) { oben.push([1 + (k % 62), k]); unten.push([1 + (k % 62), k]); }
      oben.push([63, 179.05, 'ZIEL']); unten.push([63, 19.95, 'ZIEL']);
      var gleich = { anteil: 0.1, fenster: 63, minVergleich: 200 };   /* alles andere gleichgestellt */
      var eo = evsAus(oben), eu = evsAus(unten);
      var aO = appKlasse(eo, eo.filter(function (e) { return e.sym === 'ZIEL'; })[0], gleich), mO = messKlasse(oben, 200);
      var aU = appKlasse(eu, eu.filter(function (e) { return e.sym === 'ZIEL'; })[0], gleich), mU = messKlasse(unten, 200);
      Z.zeile(anders(aO, mO) || anders(aU, mU), 'Werte 0..199, Ziel 179,05 (Messung p90 = 179,1): App ' + aO + ', Messung ' + mO +
        '; Ziel 19,95 (p10 = 19,9): App ' + aU + ', Messung ' + mU + ' - Randfaelle kippen auch bei gleichem Anteil, Fenster und Mindestzahl');
    } },

    /* ======================= Auswahl ======================= */
    { nr: 'E14', titel: 'Short-Seite: die App verkauft das untere Fuenftel leer, die Messung handelt nur das oberste Zehntel', lauf: async function () {
      var D = 255, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var w = welt(prior, [{ sym: 'TIEF', tag: D, wert: -50 }]);
      var h = Dr.heute(w.kurse, w.termine, w.markt), o = offenVon(h, 'TIEF')[0];
      var buch = { cash: 100000, positionen: [], trades: [] };
      var g = MH.driftAbgleich(buch, { offen: o ? [o] : [], faellig: [], halten: 60 }, { TIEF: 100 }, Date.UTC(2026, 4, 29, 20, 30), {});
      var tr = buch.trades.filter(function (t) { return t.sym === 'TIEF'; })[0];
      Z.zeile(!!tr && tr.art === 'leerverkauf', 'unterstes Ende: Drift.heute ' + (o ? o.richtung : 'kein Signal') + ', driftAbgleich bucht ' +
        (tr ? tr.art : 'nichts') + ' (' + g.eroeffnet + ' eroeffnet); Messung: das unterste Zehntel geht nur in die Groesse A ein, ' +
        'das Buch kauft nur oben (A7)');
    } },

    { nr: 'E15', titel: 'Universum: App ohne Umsatzklassen, Messung nur Klassen 50-250 / 250-1000 / ab1000 Mio $', lauf: async function () {
      var PS = pruefstandKonfig();
      var D = 255, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var klein = welt(prior, [{ sym: 'KLEIN', tag: D, wert: 1000, kurs: 20, stueck: 500000 }]);      /* 10 Mio $ je Tag */
      var gross = welt(prior, [{ sym: 'KLEIN', tag: D, wert: 1000, kurs: 20, stueck: 500000000 }]);   /* 10 Mrd $ je Tag */
      var oK = offenVon(Dr.heute(klein.kurse, klein.termine, klein.markt), 'KLEIN')[0];
      var oG = offenVon(Dr.heute(gross.kurse, gross.termine, gross.markt), 'KLEIN')[0];
      var kl = PS.klasseIndex(20 * 500000);
      var drin = KV.KLASSEN_HAUPT.indexOf(kl) !== -1;
      Z.zeile(!!oK && !drin, 'Wert mit 10 Mio $ Tagesumsatz: App ' + (oK ? oK.richtung : 'kein Signal') + ' (mit 10 Mrd $: ' + (oG ? oG.richtung : 'kein Signal') +
        ' - die Umsatzspalte wird nicht gelesen); Messung: Klasse ' + (kl >= 0 ? PS.KLASSEN[kl].name : 'keine') + ' -> ' + (drin ? 'im' : 'nicht im') +
        ' Universum; die App-Vergleichsmenge sind nur die Werte des Mittelfrist-Bestands mit Terminen');
    } },

    { nr: 'E16', titel: 'Mindestlaenge: App 100 Balken der GANZEN Reihe, Messung 250 Vortage am Stichtag', lauf: async function () {
      var PS = pruefstandKonfig();
      var D = 255, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var w = welt(prior, [{ sym: 'JUNG', tag: D, wert: 1000, ab: 110 }]);   /* Reihe beginnt am Weltag 110: 150 Balken, Ereignis an Stelle 145 */
      var o = offenVon(Dr.heute(w.kurse, w.termine, w.markt), 'JUNG')[0];
      var vortage = D - 110;
      Z.zeile(!!o && vortage < PS.MIN_VORTAGE, 'Ereignis nach ' + vortage + ' Balken Vorlauf (Reihe gesamt ' + w.kurse.JUNG.length + '): App ' +
        (o ? o.richtung : 'kein Signal') + ' (Grenze b.length >= 100, drift.js:100), Messung: nicht im Universum (MIN_VORTAGE ' + PS.MIN_VORTAGE + ')');
    } },

    { nr: 'E17', titel: 'Gegenprobe Termine in der Zukunft: weder App noch Messung bilden ein Signal', lauf: async function () {
      var D = 255, prior = [], tage = WELT_TAGE;
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var spaeter = new Date(Date.parse(tage[tage.length - 1] + 'T12:00:00Z') + 3 * TAG).toISOString();
      var w = welt(prior, [{ sym: 'ZUK', tag: D, wert: 1000, termin: spaeter }, { sym: 'ABEND', tag: D, wert: 1000, termin: tage[tage.length - 1] + 'T20:30:00.000Z' }]);
      var h = Dr.heute(w.kurse, w.termine, w.markt);
      var jetzt = Date.parse(tage[tage.length - 1] + 'T21:00:00Z');
      var p = Dr.paareAktuell([{ quartalsEndeMs: Date.parse(tage[tage.length - 1] + 'T00:00:00Z') - 40 * TAG, ueberraschung: 12 }], Date.parse(spaeter), 120, jetzt);
      var n = offenVon(h, 'ZUK').length + offenVon(h, 'ABEND').length;
      Z.zeile(n > 0 || p !== null, 'Termin 3 Tage nach dem letzten Balken mit Zahlen und Termin am letzten Tag 16:30 EDT: App ' + n +
        ' Signale, paareAktuell ' + (p === null ? 'null' : 'Paar') + '; Messung: Einstieg erst zur naechsten Eroeffnung, die es noch nicht gibt');
    } },

    { nr: 'E18', titel: 'Doppelte Termine: mische erkennt Dubletten nur am UTC-Datum - eine Meldung wird zwei Ereignisse', lauf: async function () {
      var src = fs.readFileSync(path.join(W, 'driftui.js'), 'utf8');
      var a = src.indexOf('function mische('), b = src.indexOf('\n  }\n', a);
      if (a < 0 || b < 0) throw new Error('mische() in driftui.js nicht gefunden');
      var mische = new Function(src.slice(a, b + 4) + '\nreturn mische;')();   // eslint-disable-line no-new-func
      /* Dieselbe Meldung (Di, 16:05 EDT): tiefer Kalender mit Meldezeit, frischer Teil mit dem Telefonat 20:00 EDT = 00:00 UTC Mi */
      var tage = WELT_TAGE, D = 254;
      var alt = [[tage[D] + 'T20:05:00.000Z', 1.0, 1.25, 25]];
      var neu = [[tage[D + 1] + 'T00:00:00.000Z', 1.0, 1.25, 25]];
      var liste = mische(alt, neu);
      var prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var w = welt(prior, []);
      w.kurse.DOP = reihe(tage); w.termine.DOP = liste;
      var evs = Dr.ereignisse(w.kurse, w.termine, w.markt, { zukunftNoetig: false }).filter(function (e) { return e.sym === 'DOP'; });
      var h = offenVon(Dr.heute(w.kurse, w.termine, w.markt), 'DOP');
      Z.zeile(evs.length > 1, 'zwei Stempel derselben Meldung -> mische behaelt ' + liste.length + ' Eintraege, ereignisse() liefert ' + evs.length +
        ' Ereignisse am Tag ' + evs.map(function (e) { return e.mi; }).join('/') + ', Drift.heute ' + h.length + ' Zeilen; Messung: eine Hauptmeldung je ' +
        'Tafelzeile (zuordnung.js Regel 5) und je Reihe und Tag hoechstens ein Ereignis (ereignisse.js:93-95)');
    } },

    { nr: 'E19', titel: 'Markt-Index-Abbildung: fehlt der juengste Tag in der SPY-Reihe, faellt das Ereignis heraus', lauf: async function () {
      var D = 259, prior = [];
      for (var k = 0; k < 200; k++) prior.push([D - 1 - (k % 100), k]);
      var voll = welt(prior, [{ sym: 'NEU', tag: D, wert: 1000 }]);
      var alt = welt(prior, [{ sym: 'NEU', tag: D, wert: 1000 }], { marktTage: WELT_TAGE.slice(0, D) });   /* drift_markt einen Tag hinter dem Bestand */
      var oV = offenVon(Dr.heute(voll.kurse, voll.termine, voll.markt), 'NEU')[0];
      var oA = offenVon(Dr.heute(alt.kurse, alt.termine, alt.markt), 'NEU')[0];
      Z.zeile(!!oV !== !!oA, 'vorboersliche Meldung am juengsten Kurstag: mit gleich langer SPY-Reihe ' + (oV ? oV.richtung : 'kein Signal') +
        ', mit einer SPY-Reihe einen Tag aelter (drift_markt, bis 20 h zwischengespeichert) ' + (oA ? oA.richtung : 'kein Signal') +
        ' (drift.js:109-111); Messung: ein Kalender (Panel) fuer Ereignis und Vergleichsmenge');
    } }
  ];
};

if (require.main === module) {
  var Z = {
    WURZEL: process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..'),
    zeile: null
  };
  var nur = process.argv[2];
  var tests = module.exports(Z);
  (async function () {
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (nur && t.nr !== nur) continue;
      var n = 0;
      Z.zeile = function (abw, text) { n++; console.log(t.nr + ' ' + (abw ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + text); };
      try { await t.lauf(); } catch (e) { console.log(t.nr + ' FEHLER: ' + (e && e.stack || e)); process.exitCode = 1; continue; }
      if (n !== 1) { console.log(t.nr + ' FEHLER: ' + n + ' Zeilen statt genau einer'); process.exitCode = 1; }
    }
  })();
}
