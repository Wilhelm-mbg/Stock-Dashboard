'use strict';
/* ================= Tiefensuche und Zucht (Nacht-/Wochenendstunden) =================
 *
 * Stufe E des Struktur-Plans, Block 7: WOERTLICH aus depot.js umgezogen (eine
 * dokumentierte Abweichung: die Frage, ob gerade eine Messung laeuft, kommt als
 * messungLaeuft() herein statt als drei fremde Zustandsvariablen). Die Tiefensuche
 * durchkaemmt das ARCHIV nach Kandidaten - sie handelt nichts; ihr bester Fund muss
 * im regulaeren Walk-Forward dieselben Huerden nehmen wie jeder andere.
 *
 * Der Laeufer-Zustand (tiefRunning/tiefStartAt) wohnt HIER und ist nur ueber die
 * kleine API erreichbar (laeuft/startAt/abwuergen): der Haenger-Waechter in depot.js
 * muss ihn lesen UND freigeben koennen - ein blanker Export wuerde den Wert kopieren
 * und der Waechter griffe ins Leere. handelBrauchtRechenzeit und minutenBisOeffnung
 * bleiben beim Handelsmodul (der Autopilot-Ring braucht sie selbst) und kommen per
 * verkabeln. Q, Archiv, Messfenster und BTPool sind global. */
(function () {
  var Q = window.Quant;
  var warmlaufBars = window.Messfenster.warmlaufBars;
  var mapSpan = window.Messfenster.mapSpan;
  var tagesGrenze = window.Messfenster.tagesGrenze;
  var sliceMap = window.Messfenster.sliceMap;
  var btIntraday = window.BTPool.btIntraday;
  var btIntradayMulti = window.BTPool.btIntradayMulti;
  /* Von depot.js hereingereicht (verkabeln). */
  var holeDepot = null, pilotLogAdd = null, renderPilot = null, autoOptCfg = null,
      messUniversum = null, labCommonOpts = null, kandidatBauen = null, zOf = null,
      save = null, handelBrauchtRechenzeit = null, minutenBisOeffnung = null,
      messungLaeuft = null;
  var D = null;

  /* ================= Tiefensuche (nutzt die brachliegenden Nacht-/Wochenendstunden) ====
   * Mehr Rechnen auf denselben Daten schafft kein Wissen - TIEFER suchen schon. Nach der
   * Nacht-Messung durchkaemmt die Tiefensuche auf dem ARCHIV (kein einziger Netzabruf)
   * einen viel breiteren Parameterraum, als die 15-Minuten-Messung es kann. Der beste Fund
   * tritt in der naechsten Nacht als markierter Kandidat im regulaeren Walk-Forward an und
   * muss dieselben Huerden nehmen wie alle anderen. Tagsueber laeuft sie nie: CPU und
   * Yahoo-Limits gehoeren dann dem Live-Scanner. */
  var tiefRunning = false, tiefStartAt = 0;
  /** Messbasis NUR aus dem Archiv bauen - fuer Rechenlaeufe ohne Netzlast. */
  async function ladeArchivDaten(intervals) {
    var data = {};
    var syms = messUniversum();
    for (var ii = 0; ii < intervals.length; ii++) {
      var iv = intervals[ii], mapA = {};
      for (var si = 0; si < syms.length; si++) {
        var serie = await window.Archiv.serie(iv, syms[si]);
        if (serie && serie.length > 200) mapA[syms[si]] = serie;
      }
      data[iv] = mapA;
    }
    return { intervals: intervals, data: data };
  }
  /* ================= Zucht: Population ueber Naechte hinweg =================
   * Bisher hiess es "Tiefensuche", tat aber nichts Zuechterisches: Jede Nacht lief
   * dasselbe feste Raster, unabhaengig davon, was die Nacht davor herausgefunden hatte.
   * Neu ist genug Wissen fuer genau EINEN weiteren Handelstag - der Rest war Wiederholung.
   * Jetzt gibt es eine Population: Kandidaten, die sich out-of-sample bewaehrt haben,
   * ueberleben die Nacht und bekommen Nachkommen, die sich in ein bis zwei Achsen von
   * ihnen unterscheiden. Dazu kommt frisches Blut aus dem systematischen Raster, damit
   * die Suche nicht in einem lokalen Optimum versauert. Was schon einmal gerechnet wurde,
   * wird nicht wieder gerechnet - das ist der eigentliche Gewinn an Erkenntnis je Nacht. */
  var ZUCHT_ACHSEN = {
    period:     [9, 14, 20, 30, 50],
    confirmBps: [5, 15, 30],
    lineType:   ['ema', 'vwap'],
    profile:    ['atm21_b', 'atm60_b', 'otm3_30b'],
    scalpSL:    [10, 15, 20, 30, 45, 'auto'],
    scalpHold:  [15, 30, 60, 120, 240, 390],
    channel:    [true, false]
  };
  /* Wie oft eine Achse mutiert, richtet sich nach ihrer GEMESSENEN Wirkung
   * (15m-Archiv, 20.08.2026, Spannweite der Rendite ueber die Achse):
   * scalpSL 6,73 Pp | scalpHold 5,06 | lineType 4,03 | confirmBps 2,23 | period 0,18.
   * An einer wirkungslosen Achse zu drehen kostet eine Nacht und bringt nichts. */
  var ZUCHT_GEWICHT = [['scalpSL', 7], ['scalpHold', 5], ['channel', 5], ['lineType', 4], ['confirmBps', 2], ['profile', 2], ['period', 1]];
  var ZUCHT_UEBERLEBENDE = 12;     // Groesse der Population
  var ZUCHT_KINDER = 40;           // Nachkommen je Elternteil und Gruppe
  var ZUCHT_ZIEL = 480;            // Kombinationen je Basis/Zeitrahmen und Nacht
  var ZUCHT_GESEHEN_MAX = 40000;   // Gedaechtnis: so viele gepruefte Kombinationen

  /** Kanal wirkt nur beim Wellenreiter - ueberall sonst auf false setzen, damit
   *  scheinbar verschiedene Kandidaten als das erkannt werden, was sie sind: dieselben. */
  function zuchtNormal(k) {
    if (k.basis !== 'wave') k.channel = false;
    return k;
  }
  function zuchtKey(k) {
    return [k.basis, k.interval, k.period, k.confirmBps, k.lineType, k.profile, k.scalpSL, k.scalpHold, k.channel].join('|');
  }
  function zuchtWuerfel(liste) { return liste[Math.floor(Math.random() * liste.length)]; }
  function zuchtAchse() {
    var summe = 0, i;
    for (i = 0; i < ZUCHT_GEWICHT.length; i++) summe += ZUCHT_GEWICHT[i][1];
    var t = Math.random() * summe;
    for (i = 0; i < ZUCHT_GEWICHT.length; i++) { t -= ZUCHT_GEWICHT[i][1]; if (t <= 0) return ZUCHT_GEWICHT[i][0]; }
    return ZUCHT_GEWICHT[0][0];
  }
  function zuchtKopie(k) {
    return { basis: k.basis, interval: k.interval, period: k.period, confirmBps: k.confirmBps,
      lineType: k.lineType, profile: k.profile, scalpSL: k.scalpSL, scalpHold: k.scalpHold,
      channel: k.channel };
  }
  /** Nachkomme: wie der Elternteil, aber in ein bis zwei Achsen verschoben. */
  function zuchtMutiere(k) {
    var m = zuchtKopie(k);
    var n = Math.random() < 0.7 ? 1 : 2;      // meist kleine Schritte, manchmal groessere
    for (var i = 0; i < n; i++) {
      var a = zuchtAchse();
      if (a === 'channel' && m.basis !== 'wave') a = 'scalpSL';   // dort waere es wirkungslos
      m[a] = zuchtWuerfel(ZUCHT_ACHSEN[a]);
    }
    return zuchtNormal(m);
  }
  /** Voellig frischer Kandidat - gegen Inzucht und lokale Optima. */
  function zuchtZufall(basis, interval) {
    return { basis: basis, interval: interval,
      period: zuchtWuerfel(ZUCHT_ACHSEN.period), confirmBps: zuchtWuerfel(ZUCHT_ACHSEN.confirmBps),
      lineType: zuchtWuerfel(ZUCHT_ACHSEN.lineType), profile: zuchtWuerfel(ZUCHT_ACHSEN.profile),
      scalpSL: zuchtWuerfel(ZUCHT_ACHSEN.scalpSL), scalpHold: zuchtWuerfel(ZUCHT_ACHSEN.scalpHold),
      channel: basis === 'wave' ? zuchtWuerfel(ZUCHT_ACHSEN.channel) : false };
  }
  /* Gleichmaessige, IMMER GLEICHE Stichprobe: jeder n-te Wert der sortierten Liste.
   * Eine zufaellige Auswahl haette die Vergleichbarkeit zweier Naechte zerstoert -
   * und genau darauf beruht die Regel, dass ein Fund zweimal bestaetigt sein muss. */
  var ZUCHT_WERTE = 16;
  function zuchtStichprobe(m) {
    var syms = Object.keys(m).sort();
    if (syms.length <= ZUCHT_WERTE) return m;
    var schritt = syms.length / ZUCHT_WERTE, out = {};
    for (var i5 = 0; i5 < ZUCHT_WERTE; i5++) {
      var sy5 = syms[Math.floor(i5 * schritt)];
      if (sy5) out[sy5] = m[sy5];
    }
    return Object.keys(out).length >= 3 ? out : m;
  }
  function zuchtStand(a) {
    if (!a.zucht) a.zucht = { gen: 0, ueberlebende: [], gesehen: [] };
    if (!a.zucht.gesehen) a.zucht.gesehen = [];
    if (!a.zucht.ueberlebende) a.zucht.ueberlebende = [];
    return a.zucht;
  }

  var tiefFortschritt = null;   // Live-Stand fuer die Oberflaeche (sonst Blackbox)
  async function tiefensuche(opts) {
    opts = opts || {};
    var unbegrenzt = !!opts.unbegrenzt;      // Analyselauf: rechnet zu Ende, egal wie lange
    var a = autoOptCfg();
    /* Ob gerade eine Messung laeuft, weiss nur das Handelsmodul - hereingereicht
     * als eine Frage statt dreier Zustaende (Stufe E). */
    if (tiefRunning || messungLaeuft()) return;
    if (!window.Archiv) {
      /* Dieser Waechter stand VOR dem ersten Protokolleintrag und vor tiefRunning:
       * fehlte das Kursarchiv, kehrte die ganze Nacht um, ohne eine Zeile zu
       * hinterlassen. Auch der Haenge-Waechter griff nicht (tiefRunning war nie
       * gesetzt), a.lastTief blieb alt, und die Anzeige zeigte den Stand der letzten
       * gelungenen Nacht - ohne Hinweis, dass seither nichts mehr gerechnet wurde. */
      pilotLogAdd('Tiefensuche uebersprungen: das Kursarchiv ist nicht geladen.');
      return;
    }
    tiefRunning = true;
    tiefStartAt = Date.now();
    tiefFortschritt = null;
    var t0 = Date.now();
    try {
      pilotLogAdd('Tiefensuche gestartet: breite Parametersuche auf dem Archiv (ohne Netzabrufe).');
      renderPilot();
      var ivs = ['15m', '60m'];                    // die Richtung, die die Daten zeigen
      var ld = await ladeArchivDaten(ivs);
      // Basen: die zwei besten unterschiedlichen Grund-Setups des letzten Rankings + Pullback
      var basenSet = {};
      var basen = [];
      ((D.central || {}).ranking || []).forEach(function (r) {
        var b = { breakout: 'breakout_lauf', breakout_lauf: 'breakout_lauf', orb: 'orb',
          reversion: 'reversion', reversion_lang: 'reversion', wave: 'wave', wave_lang: 'wave',
          pullback: 'pullback', ki: null, entdeckt: null }[r.modeKey];
        if (b && !basenSet[b] && basen.length < 2) { basenSet[b] = 1; basen.push(b); }
      });
      if (!basenSet.pullback && basen.length < 3) basen.push('pullback');
      if (!basen.length) basen = ['reversion', 'pullback'];
      var PER = [14, 30], CONF = [5, 15], LT = ['ema', 'vwap'];
      var SL = [10, 15, 20, 30, 'auto'], HOLD = [60, 120, 240, 390], CHAN = [true, false];
      var PROF = ['atm21_b', 'atm60_b', D.intraday.profile || 'otm3_14'];
      PROF = PROF.filter(function (v, i2, arr) { return arr.indexOf(v) === i2; });
      var funde = [], geprueft = 0;
      var GESAMT_MS = unbegrenzt ? Infinity : 22 * 60000;   // Puffer unter dem 25-Minuten-Deckel
      var gruppenGesamt = basen.length * ivs.length, gruppenFertig = 0;
      var msJeKombiSchnitt = 0, kombisGesamtBisher = 0;      // gemessene Geschwindigkeit
      /** Restzeit aus dem, was bisher tatsaechlich gebraucht wurde - keine Schaetzung ins Blaue. */
      function restText(offenHier, kombisJeGruppe) {
        if (!msJeKombiSchnitt) return '';
        var offenSpaeter = Math.max(0, gruppenGesamt - gruppenFertig - 1) * kombisJeGruppe;
        var ms = (offenHier + offenSpaeter) * msJeKombiSchnitt;
        var min = ms / 60000;
        return ' · noch ca. ' + (min >= 60 ? (min / 60).toFixed(1) + ' Std' : Math.max(1, Math.round(min)) + ' Min');
      }
      // Population und Gedaechtnis dieser Zuchtlinie laden
      var zStand = zuchtStand(a);
      var gesehenSet = {};
      zStand.gesehen.forEach(function (g) { gesehenSet[g] = 1; });
      var nachwuchs = [], zufallProGruppe = [];
      pilotLogAdd('Zucht Generation ' + (zStand.gen + 1) + ': ' + zStand.ueberlebende.length +
        ' Ueberlebende aus der Vornacht, ' + zStand.gesehen.length + ' Kombinationen bereits geprueft (werden nicht wiederholt).' +
        (unbegrenzt ? ' Analyselauf – rechnet vollstaendig durch, ohne Zeitlimit.' : ''));
      for (var bi = 0; bi < basen.length; bi++) {
        for (var vi = 0; vi < ivs.length; vi++) {
          var iv2 = ivs[vi];
          var map = ld.data[iv2];
          if (!map || Object.keys(map).length < 3) continue;
          var span = mapSpan(map);
          var cut = tagesGrenze(map, 0.7);
          if (!cut) continue;
          var trainMapVoll = sliceMap(map, span[0], cut, 0);
          var testMapVoll = sliceMap(map, cut, span[1], warmlaufBars(iv2));
          var trainMap = zuchtStichprobe(trainMapVoll);   // Suchen auf der Stichprobe …
          var testMapAlle = testMapVoll;                  // … Urteil auf allen Werten
          var common = labCommonOpts(D.intraday, iv2);
          var basisJetzt = basen[bi];
          // 1) Nachkommen der Ueberlebenden dieser Basis/dieses Zeitrahmens
          var kombis = [], gesehenNeu = {};
          function zuchtNimm(k) {
            zuchtNormal(k);
            var sl3 = zuchtKey(k);
            if (gesehenNeu[sl3] || gesehenSet[sl3]) return false;   // nichts zweimal rechnen
            gesehenNeu[sl3] = 1; kombis.push(k); return true;
          }
          var eltern = zStand.ueberlebende.filter(function (u) {
            return u.k && u.k.basis === basisJetzt && u.k.interval === iv2;
          }).slice(0, 6);
          eltern.forEach(function (el) {
            zuchtNimm(zuchtKopie(el.k));                            // Elternteil selbst mitlaufen lassen
            for (var mv = 0; mv < ZUCHT_KINDER; mv++) zuchtNimm(zuchtMutiere(el.k));
          });
          var ausZucht = kombis.length;
          // 2) Systematisches Raster - aber nur, was noch nie gerechnet wurde
          var raster = [];
          PER.forEach(function (p) { CONF.forEach(function (c) { LT.forEach(function (lt) { PROF.forEach(function (pr) {
            var chanListe = basisJetzt === 'wave' ? CHAN : [false];
            SL.forEach(function (sl2) { HOLD.forEach(function (h2) { chanListe.forEach(function (ch2) {
              raster.push({ basis: basisJetzt, interval: iv2, period: p, confirmBps: c, lineType: lt,
                profile: pr, scalpSL: sl2, scalpHold: h2, channel: ch2 });
            }); }); });
          }); }); }); });
          for (var rz = raster.length - 1; rz > 0; rz--) {          // mischen, damit nicht immer dieselbe Ecke zuerst drankommt
            var rj = Math.floor(Math.random() * (rz + 1)), rt = raster[rz]; raster[rz] = raster[rj]; raster[rj] = rt;
          }
          for (var rk = 0; rk < raster.length && kombis.length < ZUCHT_ZIEL; rk++) zuchtNimm(raster[rk]);
          var ausRaster = kombis.length - ausZucht;
          // 3) Frisches Blut, falls Raster und Zucht schon erschoepft sind
          var versuche = 0;
          while (kombis.length < Math.min(ZUCHT_ZIEL, 60) && versuche++ < 2000) zuchtNimm(zuchtZufall(basisJetzt, iv2));
          var ausZufall = kombis.length - ausZucht - ausRaster;
          if (!kombis.length) { pilotLogAdd('Zucht: ' + basisJetzt + ' · ' + iv2 + ' – alles Erreichbare bereits geprueft.'); continue; }
          Object.keys(gesehenNeu).forEach(function (g2) { gesehenSet[g2] = 1; });
          var schrittNr = (bi * ivs.length + vi) + 1, schritteGesamt = basen.length * ivs.length;
          pilotLogAdd('Zucht Gen ' + (zStand.gen + 1) + ' – Schritt ' + schrittNr + '/' + schritteGesamt + ': ' + basisJetzt + ' · ' + iv2 +
            ' · ' + kombis.length + ' Kombinationen (' + ausZucht + ' aus ' + eltern.length + ' Eltern, ' +
            ausRaster + ' neu aus dem Raster' + (ausZufall ? ', ' + ausZufall + ' zufaellig' : '') + ') · gesucht auf ' +
            Object.keys(trainMap).length + ' Werten, geurteilt auf ' + Object.keys(testMapAlle).length + ' …');
          renderPilot();
          // Jede Gruppe bekommt ihren fairen Anteil an der verbleibenden Zeit.
          var restGruppen = Math.max(1, gruppenGesamt - gruppenFertig);
          var anteilMs = unbegrenzt ? Infinity : Math.max(30000, (GESAMT_MS - (Date.now() - t0)) / restGruppen);
          // Nach Signal-Schluessel gruppieren; die Reihenfolge der Ergebnisse bleibt erhalten
          var buendel = {}, reihenfolge = [];
          kombis.forEach(function (k, ki3) {
            var sk = [k.basis, k.period, k.confirmBps, k.lineType, k.channel].join('|');
            if (!buendel[sk]) { buendel[sk] = []; reihenfolge.push(sk); }
            buendel[sk].push({ k: k, idx: ki3 });
          });
          var trainRes = new Array(kombis.length), BLOCK = 3, tBlock = Date.now(), abgeschnitten = 0, fertigN = 0;
          for (var kb = 0; kb < reihenfolge.length; kb += BLOCK) {
            var gruppenTeil = reihenfolge.slice(kb, kb + BLOCK);
            await Promise.all(gruppenTeil.map(function (sk2) {
              var eintraege = buendel[sk2];
              var k0 = eintraege[0].k;
              var kk0 = kandidatBauen(k0);
              var basisOpts = Object.assign({}, common, kk0.opts,
                { period: k0.period, confirmBps: k0.confirmBps, zThr: zOf(k0.confirmBps), lineType: k0.lineType });
              // Was sich je Variante unterscheidet: Not-Stop, Haltedauer, Schein-Profil
              var varianten = eintraege.map(function (e) {
                var kkv = kandidatBauen(e.k);
                return { sl: kkv.opts.sl, maxHoldMin: kkv.opts.maxHoldMin,
                  otmPct: kkv.opts.otmPct, expiryDays: kkv.opts.expiryDays, ratio: kkv.opts.ratio };
              });
              return btIntradayMulti(trainMap, basisOpts, varianten).then(function (rs) {
                (rs || []).forEach(function (r3, ri) { trainRes[eintraege[ri].idx] = r3; });
                fertigN += eintraege.length;
              });
            }));
            var mitTrades = trainRes.filter(function (r0) { return r0 && !r0.error && r0.summary && r0.summary.nTrades >= 10; }).length;
            fertigN = Math.min(fertigN, kombis.length);
            tiefFortschritt = { basis: basen[bi], iv: iv2, fertig: fertigN, gesamt: kombis.length,
              schritt: schrittNr, schritte: schritteGesamt, brauchbar: mitTrades, at: Date.now() };
            var msJeKombi = (Date.now() - tBlock) / Math.max(1, fertigN);
            msJeKombiSchnitt = kombisGesamtBisher
              ? (msJeKombiSchnitt * kombisGesamtBisher + msJeKombi * fertigN) / (kombisGesamtBisher + fertigN)
              : msJeKombi;
            pilotLogAdd('… ' + fertigN + '/' + kombis.length + ' gerechnet (' + mitTrades + ' mit genug Trades, ' +
              Math.round((Date.now() - tBlock) / 1000) + ' s' + restText(kombis.length - fertigN, kombis.length) + ')');
            renderPilot();
            await new Promise(function (r0) { setTimeout(r0, 0); });   // Renderer atmen lassen
            if (!unbegrenzt && Date.now() - tBlock > anteilMs && fertigN < kombis.length) {
              abgeschnitten = kombis.length - fertigN;
              kombis = kombis.slice(0, fertigN);      // nur Gerechnetes darf in die Auswertung
              pilotLogAdd('… Zeitanteil dieser Gruppe erreicht: ' + fertigN + ' gerechnet, ' +
                abgeschnitten + ' uebersprungen (kommen in einer der naechsten Naechte dran).');
              break;
            }
          }
          geprueft += kombis.length;
          // die 3 besten Trainings-Kombis je Basis/Zeitrahmen out-of-sample gegenpruefen
          var kandT = [];
          kombis.forEach(function (k, ki2) {
            var r2 = trainRes[ki2];
            if (!r2 || r2.error || r2.summary.nTrades < 10) return;
            kandT.push({ k: k, train: r2.summary });
          });
          kandT.sort(function (x, y) { return y.train.retPct - x.train.retPct; });
          // Wie gut waere der Beste dieser Gruppe rein zufaellig geworden?
          var zpG = Q.bestOfN(kandT.map(function (x) { return x.train.retPct; }));
          if (zpG) {
            pilotLogAdd('   Zufallsprobe ' + basisJetzt + '/' + iv2 + ': Bester ' + zpG.bester + ' %, Zufallslatte ' +
              zpG.zufallsMedian + ' % (95 %: ' + zpG.zufallsP95 + ') aus ' + zpG.n + ' Versuchen – ' +
              (zpG.ueberzufaellig ? 'ueberzufaellig' : 'im Rahmen des Zufalls'));
            zufallProGruppe.push({ basis: basisJetzt, iv: iv2, probe: zpG });
          }
          for (var ti2 = 0; ti2 < Math.min(6, kandT.length); ti2++) {
            var kk2 = kandidatBauen(kandT[ti2].k);
            var rv = await btIntraday(testMapAlle, Object.assign({}, labCommonOpts(D.intraday, iv2), kk2.opts,
              { period: kandT[ti2].k.period, confirmBps: kandT[ti2].k.confirmBps, zThr: zOf(kandT[ti2].k.confirmBps), lineType: kandT[ti2].k.lineType }));
            if (rv && !rv.error) {
              var fund = { k: kandT[ti2].k, name: kk2.name, trainRet: kandT[ti2].train.retPct, trainN: kandT[ti2].train.nTrades,
                testRet: rv.summary.retPct, testN: rv.summary.nTrades, pf: rv.summary.profitFactor };
              funde.push(fund);
              // Nur wer sich auf UNGESEHENEN Daten behauptet, darf sich fortpflanzen.
              // Nach der Trainings-Rendite zu zuechten hiesse, Ueberanpassung zu zuechten.
              if (fund.testRet > 0 && fund.testN >= 15) {
                nachwuchs.push({ k: zuchtKopie(fund.k), testRet: fund.testRet, testN: fund.testN,
                  trainRet: fund.trainRet, gen: zStand.gen + 1, at: Date.now() });
              }
            }
          }
          gruppenFertig++;
          kombisGesamtBisher += kombis.length;
          var boerseDraengt = !unbegrenzt && handelBrauchtRechenzeit() && minutenBisOeffnung() < 90;
          if (boerseDraengt || (!unbegrenzt && Date.now() - t0 > GESAMT_MS + 3 * 60000)) {
            pilotLogAdd('Zucht: ' + (boerseDraengt ? 'Boerse oeffnet gleich und der Handel laeuft – Zwischenstand gespeichert.'
                                                   : 'Zeitbudget erreicht – Zwischenstand gespeichert.'));
            bi = basen.length; break;
          }
        }
      }
      funde.sort(function (x, y) { return y.testRet - x.testRet; });
      /* ---- Generationswechsel ----
       * Auslese nach der UNGESEHENEN Rendite, nicht nach der Trainings-Rendite: wer nach
       * dem Training zuechtet, zuechtet Ueberanpassung. Alte Ueberlebende treten dabei
       * gegen den Nachwuchs an; nur die besten ZUCHT_UEBERLEBENDE bleiben, und je Basis
       * hoechstens vier, damit nicht eine einzige Linie die ganze Population besetzt. */
      var alleU = zStand.ueberlebende.concat(nachwuchs);
      var gesehenU = {}, gefiltert = [];
      alleU.sort(function (x, y) { return (y.testRet || 0) - (x.testRet || 0); });
      var proBasis = {};
      alleU.forEach(function (u) {
        if (!u || !u.k) return;
        var sl4 = zuchtKey(u.k);
        if (gesehenU[sl4]) return;
        var bkey = u.k.basis + '|' + u.k.interval;
        if ((proBasis[bkey] || 0) >= 4) return;
        gesehenU[sl4] = 1; proBasis[bkey] = (proBasis[bkey] || 0) + 1;
        gefiltert.push(u);
      });
      var vorher = zStand.ueberlebende.length;
      zStand.ueberlebende = gefiltert.slice(0, ZUCHT_UEBERLEBENDE);
      zStand.gen = zStand.gen + 1;
      // Gedaechtnis fortschreiben; aelteste Eintraege fallen heraus, wenn es zu gross wird
      var gesAlle = Object.keys(gesehenSet);
      zStand.gesehen = gesAlle.length > ZUCHT_GESEHEN_MAX ? gesAlle.slice(gesAlle.length - ZUCHT_GESEHEN_MAX) : gesAlle;
      var neuDrin = zStand.ueberlebende.filter(function (u) { return u.gen === zStand.gen; }).length;
      pilotLogAdd('Generation ' + zStand.gen + ' abgeschlossen: ' + nachwuchs.length + ' Nachkommen haben sich ungesehen behauptet, ' +
        neuDrin + ' davon in die Population aufgenommen (Population ' + vorher + ' -> ' + zStand.ueberlebende.length +
        ', Gedaechtnis ' + zStand.gesehen.length + ' Kombinationen).');
      var zpGesamt = Q.bestOfN(funde.map(function (f) { return f.testRet; }));
      if (zpGesamt) {
        pilotLogAdd('Zufallsprobe (ungesehene Daten): Bester ' + zpGesamt.bester + ' %, Zufallslatte ' + zpGesamt.zufallsMedian +
          ' % aus ' + zpGesamt.n + ' Endkandidaten – ' + (zpGesamt.ueberzufaellig
            ? 'schlaegt 95 % der Zufallslaeufe (p ' + zpGesamt.pWert + ').'
            : 'NICHT ueberzufaellig (p ' + zpGesamt.pWert + ') – der Vorsprung erklaert sich durch die Zahl der Versuche.'));
      }
      a.tiefensuche = { at: Date.now(), geprueft: geprueft, dauerMin: Math.round((Date.now() - t0) / 6000) / 10, top: funde.slice(0, 5),
        generation: zStand.gen, population: zStand.ueberlebende.length, gedaechtnis: zStand.gesehen.length,
        zufallsprobe: zpGesamt, zufallProGruppe: zufallProGruppe };
      var bester = funde[0];
      // Positiv UND genug Trades reicht nicht mehr: Wer aus tausenden Versuchen
      // ausgewaehlt wurde, muss besser sein als der beste Zufallsversuch. Sonst
      // zuechten wir Rauschen und nennen es Fortschritt.
      var zufallOk = !zpGesamt || zpGesamt.ueberzufaellig;
      if (bester && bester.testRet > 0 && bester.testN >= 15 && zufallOk) {
        var ek = kandidatBauen(bester.k);
        ek.quelle = 'tiefensuche';
        a.entdeckt = ek;
        pilotLogAdd('Tiefensuche-Fund: ' + ek.name + ' (Training ' + bester.trainRet + ' %, ungesehen +' + bester.testRet + ' % bei ' + bester.testN + ' Trades) – tritt in der nächsten Nacht-Messung an.');
      } else {
        a.entdeckt = null;
        pilotLogAdd('Zucht fertig: ' + geprueft + ' Kombinationen, kein Fund. ' +
          (bester && bester.testRet > 0 && !zufallOk
            ? 'Der Beste war zwar positiv (' + bester.testRet + ' %), lag aber innerhalb dessen, was ' + (zpGesamt ? zpGesamt.n : '') +
              ' Zufallsversuche von selbst hergeben. Kein Fund ist besser als ein erfundener.'
            : 'Keiner war out-of-sample positiv. Ehrliches Ergebnis.'));
      }
      a.lastTief = Date.now();
      await save();
      renderPilot();
    } catch (e) {
      pilotLogAdd('Tiefensuche-Fehler: ' + (e && e.message ? e.message : e));
      a.lastTief = Date.now();
    } finally {
      tiefRunning = false; tiefStartAt = 0;
    }
  }


  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (Depot-Reset weist D neu zu). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  function verkabeln(deps) {
    holeDepot = deps.depot;
    pilotLogAdd = deps.pilotLogAdd;
    renderPilot = deps.renderPilot;
    autoOptCfg = deps.autoOptCfg;
    messUniversum = deps.messUniversum;
    labCommonOpts = deps.labCommonOpts;
    kandidatBauen = deps.kandidatBauen;
    zOf = deps.zOf;
    save = deps.save;
    handelBrauchtRechenzeit = deps.handelBrauchtRechenzeit;
    minutenBisOeffnung = deps.minutenBisOeffnung;
    messungLaeuft = deps.messungLaeuft;
  }

  window.Zucht = {
    verkabeln: verkabeln,
    tiefensuche: mitFrischemD(tiefensuche),
    laeuft: function () { return tiefRunning; },
    startAt: function () { return tiefStartAt; },
    /* Nur fuer den Haenger-Waechter: Zustand freigeben, wenn die Suche haengt. */
    abwuergen: function () { tiefRunning = false; }
  };
  /* Testgriffe: ziehen mit dem Block um (test-v6 liest sie von hier). */
  if (typeof window !== 'undefined') {
    window.__tiefensuche = function (o) { return window.Zucht.tiefensuche(o || { unbegrenzt: true }); };
    window.__ladeArchivDaten = ladeArchivDaten;
  }
})();
