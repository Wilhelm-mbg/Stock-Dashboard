'use strict';
/* Tests Nr. 125a (Korb-Form: Machbarkeitstor, Register-Korrektur, Vormerkung, --vorwaerts Korb, Live = Messung, Eichung Korb, B2-Schnittstelle), aufgerufen aus
 * pruefstrasse/test.js (gleiche Zaehlung) oder allein: node pruefstrasse/test-125a.js. Deterministisch, ohne Panel-Renditen: Kunsttafel 300 Reihen x 600 Tage
 * (adapter/korb.js kunstTafel). Jede Pruefung laeuft in probe(): eine Ausnahme ist ROT mit Meldung. Laeufer-Teile im Temp-Repo mit Stub-Messer.
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');

function tests(C) {
  var ok = C.ok, K = C.K, LF = C.LF, cp = C.cp;
  function probe(name, fn) { var r; try { r = fn(); } catch (e) { ok(false, name, 'Ausnahme: ' + String(e && e.message || e).slice(0, 220)); return; } ok(!!r[0], name, r[1]); }
  function lade(p) { try { return require(p); } catch (e) { return { _fehler: e }; } }
  var TO = require('./tore.js'), KA = lade('./adapter/korb.js'), KK = lade('./adapter/korb-kosten.js'), KO = require('./kosten.js');
  var hatKA = !KA._fehler && typeof KA.kunstTafel === 'function';

  /* ---------- Kunstwelt: 300 Reihen x 600 Tage; K0..K19 mit eingesaetem Vorsprung (+0,1 % je Tag); Kunst-Regel waehlt K0..K19 (preisfrei) ---------- */
  var W = hatKA ? KA.kunstTafel({ reihen: 300, tage: 600, seed: 'kunst-125a', drift: function (r) { return r < 20 ? 0.001 : 0; } }) : null;
  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }
  function kunstZiel(roh, o, waehle) {
    var p = [];
    Object.keys(roh).forEach(function (s) { var r = roh[s], i = r.length - 1; if (i < 21) return; p.push({ sym: s, staerke: -(+s.slice(1)), umsatz: r[i][1] * r[i][2] }); });
    if (p.length < 30) return { ziel: [], rangfolge: [], korb: { zulaessig: p.length, geprueft: Object.keys(roh).length }, zuWenig: true, uebersprungen: [], verworfen: [] };
    p.sort(function (a, b) { return b.staerke - a.staerke; });
    var n = o.anzahl || 20, z = waehle ? waehle(p, n) : p.slice(0, n).map(function (x) { return x.sym; });
    return { ziel: z, rangfolge: p, korb: { zulaessig: p.length, geprueft: Object.keys(roh).length }, zuWenig: false, uebersprungen: [], verworfen: [] };
  }
  var spur = { minNow: Infinity };
  var REGEL = {
    zielfunktion: function (roh, o) { return kunstZiel(roh, o); },
    placeboZiel: function (roh, o) { if (o.nowMs < spur.minNow) spur.minNow = o.nowMs; return kunstZiel(roh, o, function (p, n) { return p.map(function (x) { return { s: x.sym, h: hash(o.placeboWort + '|' + o.nowMs + '|' + x.sym) }; }).sort(function (a, b) { return a.h - b.h; }).slice(0, n).map(function (x) { return x.s; }); }); }
  };
  var KAND = { kennung: 'kunst-korb-125a', form: 'korb', titel: 'Kunst Korb', quelle: 'Kunst', autor: 'test', datum: '2026-10-26', erwartung: { groesse: 'gross', richtung: 'positiv', nettoPp: 60 }, konfigurationen: [{ key: 'K20', anzahl: 20 }], params: {} };

  console.log('125a) Korb-Form: Live = Messung, Machbarkeitstor, Register-Korrektur, Vormerkung, --vorwaerts Korb, Eichung, B2');
  /* ---------- K: Live = Messung (Zweitleser 7) ---------- */
  probe('K-1: korb-kosten ruft das ORIGINAL mfhandel.js fuehreAus mit opts.kostenRegel; 40 Kunstfaelle bitgleich zur Kopie fuehreAusK (Nr. 122 rechnen.js) in Bargeld, Positionen, Trades, Plan und k', function () {
    var q = fs.readFileSync(path.join(K.HIER, 'adapter', 'korb-kosten.js'), 'utf8'), huelle = q.slice(q.indexOf('function huelle('), q.indexOf('function mitKosten('));
    var quelleOk = /KS\.ECHT\.fuehreAus\(buch, plan, nowMs, [^)]*\{ kostenRegel: KF\.regel/.test(huelle) && !/fuehreAusK\(/.test(huelle);
    /* die ORIGINALE (kleinst.js haengt beim Laden Huellen an MH.planeUmschichtung/fuehreAus - ECHT haelt die Funktionen der App) */
    var MH = KA.KS.ECHT, RN = require(path.join(K.REPO, 'studien', 'momentum-wiedervorlage-2026-10-23', 'rechnen.js'));
    var namen = ['A', 'B', 'C', 'D', 'E', 'F'], KL = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 3 }, Cx = { T: { symIdx: { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 } }, tagVonMs: new Map([[5000, 7]]),
      klasse: function (s) { return { index: KL[namen[s]], unter5: false }; }, roh: function (s, d, kurs) { return kurs * (1 + 0.37 * s); } };
    var gleich = 0, n = 0, mitRegel = 0;
    if (typeof MH.fuehreAus !== 'function' || !/opts\.kostenRegel/.test(String(MH.fuehreAus))) throw new Error('kleinst.js ECHT.fuehreAus ist nicht das mfhandel.js mit opts.kostenRegel (Nr. 126)');
    for (var i = 0; i < 40; i++) {
      var mk = function () {
        var pos = [], cash = 3000 + 997 * i;
        namen.slice(0, 3).forEach(function (s, j) { if ((i + j) % 2) pos.push({ sym: s, stueck: 10 + i + j, einstand: 40 + j, seit: 1 }); });
        var buch = { cash: cash, positionen: pos, trades: [] }, preise = {}; namen.forEach(function (s, j) { preise[s] = 20 + 7 * j + i % 5; });
        var plan = MH.planeUmschichtung(namen.slice(2 + i % 3), buch, preise, { kleinstAnteil: i % 2 ? 0.05 : 0 });
        return { buch: buch, plan: plan };
      };
      var a = mk(), b = mk(), logA = [], logB = [];
      RN.fuehreAusK(a.buch, a.plan, 5000, KK.kostenFunktion('regel', Cx), { kleinstAnteil: i % 2 ? 0.05 : 0 }, logA);
      MH.fuehreAus(b.buch, b.plan, 5000, 20, { kostenRegel: KK.regelFunktion(Cx), kleinstAnteil: i % 2 ? 0.05 : 0, protokoll: logB });
      var kern = function (t) { return { t: t.t, sym: t.sym, art: t.art, stueck: t.stueck, kurs: t.kurs, pnl: t.pnl }; };
      var g = a.buch.cash === b.buch.cash && JSON.stringify(a.buch.positionen) === JSON.stringify(b.buch.positionen) && JSON.stringify(a.buch.trades.map(kern)) === JSON.stringify(b.buch.trades.map(kern)) &&
        JSON.stringify(a.plan) === JSON.stringify(b.plan) && JSON.stringify(logA.map(function (x) { return [x.art, x.wert, x.k]; })) === JSON.stringify(logB.map(function (x) { return [x.art, x.wert, x.k]; }));
      n++; if (g) gleich++; if (b.buch.trades.some(function (x) { return x.kostenSpanne != null; })) mitRegel++;
    }
    var seiteOk = 0, seiteN = 0;
    [0, 1, 2, 3, 4, 'index'].forEach(function (kl) { ['kauf', 'verkauf'].forEach(function (s) { [0, 50, 999.5, 5263.16, 1e5].forEach(function (w) { [0, 3.2, 170.87].forEach(function (k) { var x = KO.seite(kl, 'eroeffnung', s, w, k, 'fixed'); seiteN++; if (x.spanne + x.gebuehr === KK.anteilSeite(kl, 'eroeffnung', s, w, k, 'fixed')) seiteOk++; }); }); }); });
    return [quelleOk && gleich === n && mitRegel > 30 && seiteOk === seiteN, 'Quelle ' + quelleOk + ', bitgleich ' + gleich + ' von ' + n + ' (' + mitRegel + ' mit Kostenregel-Trades), kosten.seite = anteilSeite ' + seiteOk + ' von ' + seiteN];
  });
  probe('K-4: Laufzeit-Spion - der Korb-Lauf mit Kostenregel ruft das ORIGINAL fuehreAus (kleinst.js ECHT = mfhandel.js) mit opts.kostenRegel, nie die Kopie fuehreAusK', function () {
    var E = KA.KS.ECHT, alt = E.fuehreAus, altK = KK.fuehreAusK, aufrufe = 0, mitRegel = 0, kopie = 0, V = KA.vorbereiten({ tafel: W.T }), F = KA.fenster(V.T, V.Q, '2021-03-01', V.T.kal.tage[V.T.maxTag]);
    E.fuehreAus = function (b, p, ms, bp, o) { aufrufe++; if (o && typeof o.kostenRegel === 'function') mitRegel++; return alt.apply(this, arguments); };
    KK.fuehreAusK = function () { kopie++; return altK.apply(this, arguments); };
    try { KA.KK.mitKosten(KA.KS, V, 'regel', function () { return KA.laufK0(V, F, REGEL.zielfunktion, null, 'k4'); }); } finally { E.fuehreAus = alt; KK.fuehreAusK = altK; }
    var kopf = /NUR REFERENZ FUER TEST A\.3, NICHT IM LAUF BENUTZT/.test(fs.readFileSync(path.join(K.HIER, 'adapter', 'korb-kosten.js'), 'utf8'));
    return [aufrufe > 0 && mitRegel === aufrufe && kopie === 0 && kopf,'Original ' + aufrufe + ' Aufrufe (' + mitRegel + ' mit kostenRegel), Kopie ' + kopie + ', Kopfkommentar ' + kopf];
  });
  probe('K-2: Kapital (Entscheid 19): kapitalUsd 10.000 skaliert nur die Gebuehr (Stueck und Wert x 0,1), die Spanne bleibt; ohne Kapital ziffergleich zu anteilSeite', function () {
    var Cx = { T: { symIdx: { A: 0 } }, tagVonMs: new Map([[1, 0]]), klasse: function () { return { index: 1 }; }, roh: function (s, d, k) { return k; } };
    var r0 = KK.regelFunktion(Cx)({ sym: 'A', seite: 'kauf', stueck: 100, kurs: 52.63, nowMs: 1 }), r1 = KK.regelFunktion(Cx, { kapitalUsd: 10000, start: 100000 })({ sym: 'A', seite: 'kauf', stueck: 100, kurs: 52.63, nowMs: 1 });
    var soll1 = KO.ibkrGebuehr('fixed', 'kauf', 10, 52.63) / 526.3;
    return [r0.spanne + r0.gebuehr === KK.anteilSeite(1, 'eroeffnung', 'kauf', 5263, 52.63, 'fixed') && r1.spanne === r0.spanne && Math.abs(r1.gebuehr - soll1) < 1e-15 && r1.gebuehr > r0.gebuehr,
      'Gebuehr 100.000-Buch ' + (r0.gebuehr * 1e4).toFixed(3) + ' Bp, 10.000-Buch ' + (r1.gebuehr * 1e4).toFixed(3) + ' Bp (Mindestgebuehr 1 $)'];
  });
  probe('K-3: Parameterabgleich Live = Messung: Geraet der Pruefstrasse = App-Buch nach Nr. 126 bis auf die begruendeten Ausnahmen (Kapital, Reihenende)', function () {
    var P = KA.parameterAbgleich();
    return [P.gleich && P.ausnahmen.map(function (a) { return a.feld; }).sort().join() === 'kapitalUsd,reihenende' && P.liste.length >= 14, P.liste.length + ' Felder, Ausnahmen ' + P.ausnahmen.map(function (a) { return a.feld; }).join(',')];
  });

  /* ---------- A: Machbarkeitstor ---------- */
  probe('A-1: Tor Korb - MDE80_korb(n) = (t_krit(n-1, m) + 0,8416) x 4 x sd_q / Wurzel(n) x 1,4 (QS F1: vorher Faktor 2 zu klein); 38 Perioden: MDE80 22,07, netto 1,2 nicht messbar (~12.857 Perioden ≈ 3.214 Jahre), netto 40 messbar, unter 8 Perioden nie', function () {
    var a = TO.korbMachbarkeit({ nPerioden: 38, sdQ: 6.3247, nettoPp: 1.2, m: 14 }), b = TO.korbMachbarkeit({ nPerioden: 38, sdQ: 6.3247, nettoPp: 40, m: 14 }), c = TO.korbMachbarkeit({ nPerioden: 6, sdQ: 1, nettoPp: 1000, m: 1 });
    var hand = (Math.max(3, TO.tQuantil(1 - 0.05 / 14, 37)) + 0.8416) * 4 * 6.3247 / Math.sqrt(38) * 1.4, nb = a.braeuchtePerioden;
    var grenze = TO.korbMde80(nb, 6.3247, 14).mde80 <= 1.2 && TO.korbMde80(nb - 1, 6.3247, 14).mde80 > 1.2;
    return [!a.messbar && Math.abs(a.mde80 - hand) < 1e-12 && Math.abs(a.mde80 - 22.07) < 0.01 && Math.abs(nb / 4 - 3214) < 2 && grenze && a.braeuchteJahre === nb / 4 && b.messbar && !c.messbar && TO.korbPerioden(1) === 0 && TO.korbPerioden(64) === 1 && TO.korbPerioden(2437) === 38,
      'MDE80 ' + a.mde80.toFixed(2) + ' Pp p. a., braeuchte ' + nb + ' Perioden = ' + a.braeuchteJahre + ' Jahre; netto 40 messbar ' + b.messbar];
  });
  probe('A-2: streuung.json Korb-Block (sd_q mit Quelle Nr. 96/100/122, Einheit Perioden, 4 je Jahr, Momentum nachrichtlich); streuung-fit.js erhaelt den Block', function () {
    var S = TO.streuung().korb, fit = fs.readFileSync(path.join(K.HIER, 'streuung-fit.js'), 'utf8');
    return [S && S.sdQ > 3 && S.sdQ < 30 && /Nr\. 96/.test(S.quelle) && /Nr\. 100/.test(S.quelle) && /Nr\. 122/.test(S.quelle) && S.periodenJeJahr === 4 && S.periodeTage === 63 && S.nachrichtlich.momentum187Qqq.sd > S.sdQ && /altJ\.korb/.test(fit),
      'sd_q ' + (S && S.sdQ) + ', Momentum ' + (S && S.nachrichtlich.momentum187Qqq.sd)];
  });
  probe('A-3: Perioden der Kunsttafel = korbPerioden(Handelstage) (Zaehlung ohne Rendite passt zum Rechner); Zaehlung liest nur den Kalender', function () {
    var V = KA.vorbereiten({ tafel: W.T }), F = KA.fenster(V.T, V.Q, '2021-03-01', V.T.kal.tage[V.T.maxTag]);
    var e = KA.KK.mitKosten(KA.KS, V, 'regel', function () { return KA.laufK0(V, F, REGEL.zielfunktion, null, 'a3'); }), per = KA.perioden(e.L, W.qqq);
    var tage = V.T.kal.tage.filter(function (t) { return t >= '2021-03-01'; }), Z = KA.zaehle(KAND, { kalender: { tage: tage, kennung: 'kunst' }, entdeckung: { von: '2021-03-01' } });
    return [per.length === TO.korbPerioden(tage.length) && Z.perioden === per.length && Z.ohneRenditen && per[0].von === '2021-03-01', 'Perioden Lauf ' + per.length + ', Zaehlung ' + Z.perioden + ' (' + Z.TE + ' Tage)'];
  });

  /* ---------- B.1: Register-Korrektur ---------- */
  probe('B-1: Register-Korrektur - Rang-p = Rang / (B + 1) <= min(p(Rang 0,95), 0,05 / m); B waechst mit m (m 14 -> 281: bester Rang besteht), zu kleines B (200 bei m 14) faellt durch', function () {
    var buch = { abstandPa: 5, startphasen: { median: 3, vorDemMarkt: 60, anzahl: 63 } }, bue = function (B) { var a = []; for (var i = 0; i < B; i++) a.push({ abstandPa: -1 + i / B, schlaegt: false }); return a; };
    var u1 = KA.urteil(buch, bue(K.korbBuecher(14)), 14), u2 = KA.urteil(buch, bue(200), 14), u3 = KA.urteil(buch, bue(200), 1);
    return [K.korbBuecher(14) === 281 && u1.kandidat && u1.pEinseitig === 1 / 282 && !u2.kandidat && /Register-Schwelle/.test(u2.gruende.join()) && u3.kandidat && Math.abs(u2.pSchwelle - 0.05 / 14) < 1e-15,
      'm 14 B 281: p ' + u1.pEinseitig.toFixed(5) + ' <= ' + u1.pSchwelle.toFixed(5) + '; B 200: p ' + u2.pEinseitig.toFixed(5) + ' -> ' + u2.gruende.join('; ')];
  });

  /* ---------- Laeufer im Temp-Repo: Tor nicht messbar, Vormerkung, --vorwaerts ---------- */
  var LR = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pruefstrasse-125a-')), gitL = function (args) { var r = cp.spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false'].concat(args), { cwd: LR, encoding: 'utf8' }); if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr); return r.stdout.trim(); };
  var ortL = null, basis = null;
  try {
    gitL(['init', '-q']); gitL(['config', 'user.name', 'test']); gitL(['config', 'user.email', 'test@example.invalid']); fs.mkdirSync(path.join(LR, 'wiki')); fs.mkdirSync(path.join(LR, 'pruefstrasse', 'erledigt'), { recursive: true });
    fs.writeFileSync(path.join(LR, 'wiki', 'belegstand.md'), '# Belegstand\n'); fs.writeFileSync(path.join(LR, 'wiki', 'log.md'), '# Log\n'); fs.writeFileSync(path.join(LR, 'pruefstrasse', 'register.json'), JSON.stringify({ kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 }));
    gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Basis']); basis = gitL(['rev-parse', 'HEAD']);
    ortL = { repo: LR, erledigt: path.join(LR, 'pruefstrasse', 'erledigt'), register: path.join(LR, 'pruefstrasse', 'register.json') };
  } catch (e) { ok(false, 'Temp-Repo fuer die Laeufer-Proben', String(e.message).slice(0, 200)); }
  var VK = hatKA ? KA.vorbereiten({ tafel: W.T }) : null, tageK = hatKA ? VK.Q.ptage.map(function (d) { return String(VK.T.kal.tage[d]); }) : [];
  function stubs(kand, aufrufe, opt) {
    opt = opt || {};
    return { pruefer: function () { return { gueltig: true, form: [], test: { letzteZeile: 'kunst' }, siegel1: { commit: basis } }; }, lade: function () { return { kand: kand, versatzGrund: null }; }, ort: ortL,
      messer: function (kn, phase, aus, log, extra) {
        aufrufe.push({ phase: phase, extra: extra });
        var E = phase === 'zaehlung' ? KA.zaehle(kand, { kalender: { tage: opt.kalenderTage || tageK, kennung: 'kunst' }, entdeckung: { von: tageK[0] } })
          : KA.lauf(REGEL, kand, { tafel: W.T, qqq: W.qqq, bisPanelende: true, entdeckung: { von: '2021-03-01' }, placeboBuecher: 40, registerM: extra && extra.m, kostenBpJeSeite: 'regel', massstab: 'nasdaq100-steuer', kapitalUsd: K.KORB.kapitalUsd, placebo: 'persistent' });
        E.kennung = kn; E.form = 'korb'; E.phase = phase; E.stand = '2026-10-26T12:00:00.000Z'; E.konfigurationenSoll = kand.konfigurationen.length;
        fs.writeFileSync(aus, JSON.stringify(E)); return JSON.parse(JSON.stringify(E));
      } };
  }
  if (ortL && hatKA) {
    probe('A-4: Laeufer - Korb mit netto 1,2: Machbarkeitstor vor dem Lauf "nicht messbar" (38 Perioden, braeuchte ~3.200 ≈ 800 Jahre), kein Entdeckungslauf, Register zaehlt 0, Protokoll mit Korb-Tafel', function () {
      var kalender = []; for (var i = 0; i < 2437; i++) kalender.push('2099-' + String(100000 + i));      /* 2.437 Handelstage = 38 Perioden, alle nach dem Fensterstart */
      var kn = 'kunst-korb-nm', auf = [], k1 = JSON.parse(JSON.stringify(KAND)); k1.kennung = kn; k1.erwartung.nettoPp = 1.2;
      var r = LF.laufe(kn, stubs(k1, auf, { kalenderTage: kalender }));
      var Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), e = Rg.konfigurationen.filter(function (x) { return x.kennung === kn; })[0], md = fs.readFileSync(path.join(ortL.erledigt, kn, 'ERGEBNIS.md'), 'utf8');
      return [r.urteil === 'nicht messbar' && auf.map(function (a) { return a.phase; }).join() === 'zaehlung' && e && e.zaehlt === 0 && e.einheit === 'Perioden' && e.braeuchteSignaltage > 1000 && /Korb-Form, Nr\. 125a/.test(md) && /MDE80_korb/.test(md),
        'Urteil ' + r.urteil + ', Aufrufe ' + auf.map(function (a) { return a.phase; }).join() + ', braeuchte ' + (e && e.braeuchteSignaltage) + ' Perioden'];
    });
    var aufV = [], stV = stubs(KAND, aufV), regV = null;
    probe('B-2: Laeufer - Korb-Kandidat (Kunst-Vorsprung, Tor messbar) wird VORGEMERKT: keine Pruefzeit, Register mit Stichtag-Grundlage, nBedarf aus der GEMESSENEN Streuung der Entdeckung, B und Wort festgeschrieben', function () {
      var r = LF.laufe(KAND.kennung, stV), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), e = Rg.konfigurationen.filter(function (x) { return x.kennung === KAND.kennung; })[0];
      var E = JSON.parse(fs.readFileSync(path.join(ortL.erledigt, KAND.kennung, 'ergebnis.json'), 'utf8')), sdE = E.entdeckung.konfigurationen[0].entdeckung.perioden.tTest.sd;
      var md = fs.readFileSync(path.join(ortL.erledigt, KAND.kennung, 'ERGEBNIS.md'), 'utf8'); regV = e;
      return [auf(aufV) === 'zaehlung,entdeckung' && e && e.status === 'vorgemerkt' && e.einheit === 'Perioden' && e.nBedarf === TO.korbNBedarf({ sdE: sdE, nettoPp: 60, mV: 1 }) && e.korbFest.q != null && e.korbFest.placebo === 'persistent' && e.korbFest && e.korbFest.B === 40 && e.korbFest.wortBasis === KAND.kennung && e.nStand === 0 && e.stichtag === null && /Vorwaertsblick erst bei nBedarf/.test(md) && !E.pruefung,
        'Aufrufe ' + auf(aufV) + ', ' + JSON.stringify({ status: e && e.status, nBedarf: e && e.nBedarf, sdE: sdE && sdE.toFixed(2), B: e && e.korbFest && e.korbFest.B, urteil: r.urteil })];
      function auf(a) { return a.map(function (x) { return x.phase; }).join(); }
    });
    var vmd = path.join(LR, 'pruefstrasse', 'VORWAERTS.md'), vsl = path.join(LR, 'pruefstrasse', 'VORSCHLAEGE.md'), ortV = { repo: LR, erledigt: ortL.erledigt, register: ortL.register, vorwaertsMd: vmd, vorschlaege: vsl }, still = function () {};
    var messAufrufe = 0, mVor = function (kn, phase, aus, log, extra) { var r = LF.vorwaertsKindKorb(REGEL, KAND, Object.assign({}, extra, { V: VK, qqq: W.qqq })); if (r.messung) messAufrufe++; return JSON.parse(JSON.stringify(r)); };
    probe('B-3: --vorwaerts Korb zaehlt OHNE Renditen (Stichtag hinter dem Panel-Ende: 0 Perioden), schreibt nur nStand/nBedarf/Datum/Satz, zweiter Lauf idempotent (kein Commit)', function () {
      var h0 = gitL(['rev-parse', 'HEAD']), r1 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), h1 = gitL(['rev-parse', 'HEAD']), r2 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), h2 = gitL(['rev-parse', 'HEAD']);
      var vj = JSON.parse(fs.readFileSync(path.join(ortL.erledigt, KAND.kennung, 'vorwaerts.json'), 'utf8')), j0 = vj.je[0], md = fs.readFileSync(vmd, 'utf8');
      var ohneRendite = !/mittel|abstand|buchEnde|rang/i.test(JSON.stringify(vj.je));
      return [r1.geaendert && h1 !== h0 && !r2.geaendert && h2 === h1 && j0.nStand === 0 && j0.einheit === 'Perioden' && j0.satz === 'Vorwaertsblick erst bei nBedarf' && ohneRendite && /Vorwaertsblick erst bei nBedarf/.test(md) && messAufrufe === 0,
        'Lauf 1 ' + (r1.geschrieben || []).join(',') + ' | Lauf 2 geaendert ' + r2.geaendert + ' | je ' + JSON.stringify(j0).slice(0, 160)];
    });
    var iS = tageK.indexOf('2022-03-01'), s2 = tageK[iS - 1];
    probe('B-4: Stichtag-Leck: Kurse VOR dem Stichtag veraendert (preisfreie Kunst-Regel) -> Vorwaertsmessung bitgleich; Buch startet am Stichtag, erste Periode ab dem Stichtag, kein Trade davor; Zufallsbuecher ranken erst ab dem Tag vor dem Stichtag', function () {
      var auftrag = { siegel2Datum: s2, eintraege: [{ key: 'K20', nBedarf: 2, status: 'vorgemerkt', korbFest: { B: 30, wortBasis: KAND.kennung, kapitalUsd: 10000 } }], qqq: W.qqq };
      spur.minNow = Infinity;
      var r1 = LF.vorwaertsKindKorb(REGEL, KAND, Object.assign({ V: KA.vorbereiten({ tafel: W.T }) }, auftrag)), minNow = spur.minNow;
      var W2 = KA.kunstTafel({ reihen: 300, tage: 600, seed: 'kunst-125a', drift: function (r) { return r < 20 ? 0.001 : 0; }, aendere: function (r, i, z) { if (i < iS) { z.b *= 1.3; z.bo *= 0.7; z.roh *= 1.3; } } });   /* nur Kurse: der Umsatz der 20 Vortage bestimmt (ex ante) die Kostenklasse */
      var r2 = LF.vorwaertsKindKorb(REGEL, KAND, Object.assign({ V: KA.vorbereiten({ tafel: W2.T }) }, auftrag, { qqq: W2.qqq }));
      var m1 = r1.messung && r1.messung[0].korb, m2 = r2.messung && r2.messung[0].korb, Vx = KA.vorbereiten({ tafel: W.T });
      var gleich = m1 && m2 && JSON.stringify(m1.abstaende) === JSON.stringify(m2.abstaende) && m1.buch.buchEnde === m2.buch.buchEnde && m1.nachSteuer.abstandNachSteuerPa === m2.nachSteuer.abstandNachSteuerPa && m1.rang.besser === m2.rang.besser;
      return [r1.stichtag === tageK[iS] && gleich && m1.erstePeriode === tageK[iS] && m1.buch.ersterTradeMs === m1.buch.stichtagMs && minNow === Vx.Q.ms[Vx.Q.ptage[iS - 1]] && m1.n === r1.je[0].nStand,
        'Stichtag ' + r1.stichtag + ', Perioden ' + (m1 && m1.n) + ' / Stand ' + r1.je[0].nStand + ', Buch ' + (m1 && m1.buch.buchEnde.toFixed(2)) + ' = ' + (m2 && m2.buch.buchEnde.toFixed(2)) + ', fruehester Rangtag ' + new Date(minNow).toISOString().slice(0, 10)];
    });
    probe('B-5: Zaehlen bis nBedarf ohne Messung (vorwaertsMessung gesperrt), ab nBedarf genau EINE Messung; B Zufallsbuecher ueber denselben Zeitraum, Rang nachrichtlich; nach Steuer ueber App-Massstab.nachSteuer', function () {
      var orig = KA.vorwaertsMessung, r0;
      KA.vorwaertsMessung = function () { throw new Error('Rendite gelesen'); };
      try { r0 = LF.vorwaertsKindKorb(REGEL, KAND, { V: VK, qqq: W.qqq, siegel2Datum: s2, eintraege: [{ key: 'K20', nBedarf: 100, status: 'vorgemerkt', korbFest: { B: 30, wortBasis: 'w' } }] }); } finally { KA.vorwaertsMessung = orig; }
      var r1 = LF.vorwaertsKindKorb(REGEL, KAND, { V: VK, qqq: W.qqq, siegel2Datum: s2, eintraege: [{ key: 'K20', nBedarf: 2, status: 'vorgemerkt', korbFest: { B: 30, wortBasis: 'w' } }] }), m = r1.messung && r1.messung[0].korb;
      return [r0.messung === null && r0.faellig.length === 0 && r0.je[0].nStand === TO.korbPerioden(tageK.length - iS) && r1.messung.length === 1 && m.rang.B === 30 && /nachrichtlich/.test(m.rang.hinweis) && /Massstab\.nachSteuer/.test(m.nachSteuer.rechnung) && m.nachSteuer.abstandNachSteuerPa != null,
        'nStand ' + r0.je[0].nStand + ' ohne Rendite; Messung: n ' + (m && m.n) + ', t ' + (m && m.tTest.t.toFixed(2)) + ', nach Steuer ' + (m && m.nachSteuer.abstandNachSteuerPa.toFixed(2)) + ' Pp p. a., Rang-p ' + (m && m.rang.pRang.toFixed(3))];
    });
    probe('B-6: Live = Messung - ein abweichender Geraete-Parameter (Regel K 0 statt 0,05) ist ein MESSGERAET-Abbruch VOR jeder Rendite', function () {
      var mess = KA.parameterMessung(); mess.kleinstAnteil = 0; var e = null, gelesen = false, R2 = { zielfunktion: function () { gelesen = true; return {}; }, placeboZiel: function () { gelesen = true; return {}; } };
      try { KA.vorwaertsMessung(R2, KAND, { V: VK, qqq: W.qqq, siegel2Datum: s2, B: 5, wortBasis: 'w', parameter: { mess: mess } }); } catch (x) { e = x; }
      return [e && /^MESSGERAET: Live = Messung verletzt - kleinstAnteil/.test(e.message) && !gelesen, e ? e.message.slice(0, 120) : 'kein Abbruch'];
    });
    probe('B-7: Rueckweg bei Abbruch (Korb): Register, vorwaerts.json, VORWAERTS.md zurueckgestellt, Index sauber, Marke mit Fehler liegt, naechster Lauf abgelehnt', function () {
      var Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')); Rg.konfigurationen.forEach(function (e) { if (e.kennung === KAND.kennung) { e.siegel2Datum = s2; e.nBedarf = 2; e.korbFest.B = 20; } });
      fs.writeFileSync(ortL.register, JSON.stringify(Rg, null, 1) + '\n'); gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Testaufbau: Stichtag in der Kunsttafel']);
      var vorReg = fs.readFileSync(ortL.register, 'utf8'), vorVj = fs.readFileSync(path.join(ortL.erledigt, KAND.kennung, 'vorwaerts.json'), 'utf8'), bs = path.join(LR, 'wiki', 'belegstand.md'), bsText = fs.readFileSync(bs, 'utf8'), fehler = null, zweit = null;
      fs.unlinkSync(bs);
      try { LF.vorwaerts({ ort: ortV, messer: mVor, log: still }); } catch (e) { fehler = e; }
      fs.writeFileSync(bs, bsText);
      var mk = path.join(LR, 'pruefstrasse', LF.VORWAERTS_MARKE), mkJ = fs.existsSync(mk) ? JSON.parse(fs.readFileSync(mk, 'utf8')) : null;
      try { LF.vorwaerts({ ort: ortV, messer: mVor, log: still }); } catch (e) { zweit = e; }
      var gut = fehler && /VORWAERTS abgebrochen/.test(fehler.message) && fs.readFileSync(ortL.register, 'utf8') === vorReg && fs.readFileSync(path.join(ortL.erledigt, KAND.kennung, 'vorwaerts.json'), 'utf8') === vorVj && mkJ && mkJ.fehler && zweit && /liegt/.test(zweit.message) && gitL(['diff', '--cached', '--name-only']) === '';
      if (fs.existsSync(mk)) fs.unlinkSync(mk);
      return [gut, (fehler && fehler.message.slice(0, 100)) + ' | zweiter: ' + (zweit && zweit.message.slice(0, 50))];
    });
    probe('B-8: --vorwaerts Korb misst bei Erreichen des Bedarfs GENAU EINMAL (Holm ueber die Vorwaerts-Familie, Statuswechsel, Belegstand-Absatz mit Perioden), danach kein zweiter Blick', function () {
      messAufrufe = 0;
      var r1 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), e = Rg.konfigurationen.filter(function (x) { return x.kennung === KAND.kennung; })[0];
      var bs = fs.readFileSync(path.join(LR, 'wiki', 'belegstand.md'), 'utf8'), n1 = messAufrufe, r2 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still });
      return [r1.statuswechsel.length === 1 && n1 === 1 && ['bestaetigt', 'abgelehnt', 'offen'].indexOf(e.status) !== -1 && e.vorwaerts && e.vorwaerts.form === 'korb' && e.vorwaerts.holmM === TO.mVorwaerts(Rg) && e.vorwaerts.n >= 2 && /vollstaendige Perioden ab Stichtag/.test(bs) && !r2.geaendert && messAufrufe === 1,
        'Status ' + e.status + ', Urteil ' + e.urteil + ', n ' + (e.vorwaerts && e.vorwaerts.n) + ', p ' + (e.vorwaerts && e.vorwaerts.p != null ? e.vorwaerts.p.toFixed(4) : '–') + ', Familie ' + (e.vorwaerts && e.vorwaerts.holmM) + ', zweiter Lauf Messungen ' + (messAufrufe - n1)];
    });
  } else ok(false, 'Laeufer-Proben Korb (A-4, B-2 .. B-8)', hatKA ? 'Temp-Repo fehlt' : 'adapter/korb.js ohne Nr. 125a (' + String(KA._fehler && KA._fehler.message || 'kunstTafel fehlt').slice(0, 80) + ')');
  probe('B-9: Urteil Korb vorwaerts - nein nur mit oberer 95-%-Grenze < 0 UND Rang-p >= 0,5 (n >= 8); unter 8 Perioden nie; belegt braucht Holm, Mittel > 0, nach Steuer > 0', function () {
    var f = function (M) { return { kennung: 'x', eintrag: { key: 'k' }, m: { form: 'korb', korb: M }, p: M.tTest.p }; }, H = { bestanden: [false], schwelle: [0.05], m: 1 }, ERL = fs.mkdtempSync(path.join(require('os').tmpdir(), 'korb-u-'));
    var a = LF.korbVorwaertsUrteil(f({ n: 10, tTest: { mittel: -2, obere95: -0.5, p: 0.99 }, nachSteuer: {}, rang: { pRang: 0.7 } }), H, 0, ERL, '2026-10-26T00:00:00Z').urteil;
    var b = LF.korbVorwaertsUrteil(f({ n: 10, tTest: { mittel: -2, obere95: -0.5, p: 0.99 }, nachSteuer: {}, rang: { pRang: 0.3 } }), H, 0, ERL, '2026-10-26T00:00:00Z').urteil;
    var c = LF.korbVorwaertsUrteil(f({ n: 7, tTest: { mittel: -2, obere95: -0.5, p: 0.99 }, nachSteuer: {}, rang: { pRang: 0.9 } }), H, 0, ERL, '2026-10-26T00:00:00Z').urteil;
    fs.writeFileSync(path.join(ERL, 'x'), ''); fs.mkdirSync(path.join(ERL, 'x2')); fs.writeFileSync(path.join(ERL, 'x2', 'KANDIDATEN.json'), JSON.stringify({ kandidaten: [{ key: 'k', netto: 3 }] }));
    var g = function (ns) { var z = f({ n: 12, tTest: { mittel: 2, obere95: 4, p: 0.001 }, nachSteuer: { abstandNachSteuerPa: ns }, rang: { pRang: 0.01 } }); z.kennung = 'x2'; return LF.korbVorwaertsUrteil(z, { bestanden: [true], schwelle: [0.05], m: 1 }, 0, ERL, '2026-10-26T00:00:00Z').urteil; };
    var d = g(1.5), e = g(-0.2);
    fs.rmSync(ERL, { recursive: true, force: true });
    return [a === 'nein' && b === 'nicht entscheidbar' && c === 'nicht entscheidbar' && d === 'belegt-Vorschlag' && e === 'nicht entscheidbar', [a, b, c, d, e].join(' / ')];
  });
  probe('B-10: Holm-Familie (Entscheid 21) = alle je vorgemerkten des Registers (mVorwaerts), auch fuer die Tag-Form: p 0,02 allein faellig bei Familie 3 -> Schwelle 0,0167, nicht bestanden', function () {
    var H = TO.holm([0.02], 0.05, 3), Rg = { konfigurationen: [{ status: 'vorgemerkt' }, { status: 'bestaetigt' }, { status: 'abgelehnt' }, { status: 'offen' }, {}, { urteil: 'nein' }] }, q = fs.readFileSync(path.join(K.HIER, 'laeufer.js'), 'utf8');
    return [!H.bestanden[0] && Math.abs(H.schwelle[0] - 0.05 / 3) < 1e-15 && H.m === 3 && TO.mVorwaerts(Rg) === 4 && /TO\.holm\(faellige\.map\(function \(f\) \{ return f\.p; \}\), K\.HOLM_ALPHA, TO\.mVorwaerts\(Rg\)\)/.test(q), 'Schwelle ' + H.schwelle[0].toFixed(4) + ', mVorwaerts ' + TO.mVorwaerts(Rg)];
  });

  /* ---------- B2: Schnittstelle Halte-Band (Patch mfhandel.js wartet auf Freigabe) ---------- */
  probe('B2-1: ohne halteBand kein Umbau (bitgleich); halteBand braucht anzahl; fehlt mfhandel.zielMitBand, lauter Abbruch "B2 NICHT FREIGEGEBEN"; mit dem echten zielMitBand (B2 angewandt) laeuft jede Umschichtung durch das Band', function () {
    var MH = KA.MH, V = KA.vorbereiten({ tafel: W.T }), F = KA.fenster(V.T, V.Q, '2021-03-01', V.T.kal.tage[V.T.maxTag]), echt = MH.zielMitBand;
    var lauf = function (kand) { return KA.KK.mitBand(MH, KA.KK.bandOpts(kand), function () { return KA.laufK0(V, F, REGEL.zielfunktion, null, 'b2').kz.buchEnde; }); };
    var ohne = lauf(KAND), mitLeer = lauf(Object.assign({}, KAND, { params: { anderes: 1 } })), e = null, gesehen = [];
    var ohneAnzahl = null; try { KA.KK.bandOpts({ konfigurationen: [{ key: 'k' }], params: { halteBand: 40 } }); } catch (x) { ohneAnzahl = x; }
    delete MH.zielMitBand;
    try { lauf(Object.assign({}, KAND, { params: { halteBand: 40 } })); } catch (x) { e = x; } finally { MH.zielMitBand = echt; }
    MH.zielMitBand = function (rang, buch, o) { gesehen.push(o.halteBand); return echt(rang, buch, o); };
    try { lauf(Object.assign({}, KAND, { params: { halteBand: 40 } })); } finally { MH.zielMitBand = echt; }
    return [typeof echt === 'function' && ohne === mitLeer && e && /B2 NICHT FREIGEGEBEN/.test(e.message) && ohneAnzahl && /braucht konfigurationen\[0\]\.anzahl/.test(ohneAnzahl.message) && gesehen.length > 0 && gesehen.every(function (x) { return x === 40; }), 'ohne Band ' + ohne.toFixed(2) + ' = ' + mitLeer.toFixed(2) + '; ohne zielMitBand: ' + (e && e.message.slice(0, 40)) + '; Band-Aufrufe ' + gesehen.length];
  });

  /* ---------- B2 in mfhandel.js (Freigabe PM 26.10., Patch mfhandel-b2.patch; Proben aus b2/test-b2.js) ---------- */
  var MF = require(path.join(K.REPO, 'mfhandel.js')), PLANE = (KA.KS && KA.KS.ECHT && KA.KS.ECHT.planeUmschichtung) || MF.planeUmschichtung, T0 = Date.UTC(2025, 0, 2), TAGMS = 86400000, JETZT = T0 + 259 * TAGMS;
  function rohB2(nWerte, seed) { var m = {}; for (var w = 0; w < nWerte; w++) { var r = [], p = 50 + (w * 7919 + seed) % 100; for (var i = 0; i < 260; i++) { p *= 1 + ((((w + 3) * (i + 11) * 2654435761 + seed) >>> 0) % 2001 - 1000) / 50000 + (w % 9) * 0.0002; r.push([T0 + i * TAGMS, p, 3e6 + (w % 13) * 1e6]); } m['W' + w] = r; } return m; }
  probe('B2-a: mfhandel.js ohne die neuen opts zeichengleich zum Stand vor B2 (git 1376d8e): momentumZiel und planeUmschichtung in 60 Kunstfaellen', function () {
    var d = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mfhandel-alt-')), g = cp.spawnSync('git', ['show', '1376d8e:mfhandel.js'], { cwd: K.REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    if (g.status !== 0) throw new Error('git show: ' + g.stderr);
    fs.writeFileSync(path.join(d, 'mfhandel.js'), g.stdout); ['momentum.js', 'liquide.js'].forEach(function (x) { fs.copyFileSync(path.join(K.REPO, x), path.join(d, x)); });
    var ALT = require(path.join(d, 'mfhandel.js')), gleich = 0;
    for (var s = 0; s < 60; s++) {
      var roh = rohB2(120 + s, s), o = { nowMs: JETZT }, a = ALT.momentumZiel(roh, o), b = MF.momentumZiel(roh, o);
      var buch = { cash: 1000 * s, positionen: a.ziel.slice(0, 5).map(function (x, i) { return { sym: x, stueck: 10 + i, einstand: 40 }; }).concat([{ sym: 'W' + (s + 100), stueck: 3, einstand: 9 }]) }, preise = {};
      Object.keys(roh).forEach(function (k) { preise[k] = roh[k][259][1]; });
      var pa = ALT.planeUmschichtung(a.ziel, buch, preise, { kleinstAnteil: s % 2 ? 0.05 : 0 }), pb = PLANE(b.ziel, buch, preise, { kleinstAnteil: s % 2 ? 0.05 : 0 });
      if (JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(pa) === JSON.stringify(pb)) gleich++;
    }
    fs.rmSync(d, { recursive: true, force: true });
    return [gleich === 60 && typeof MF.zielMitBand === 'function', gleich + ' von 60'];
  });
  probe('B2-b: anzahl 20 bei korb 100 -> 20 Plaetze (ohne anzahl 10 % = 10)', function () {
    var roh = rohB2(100, 7), a = MF.momentumZiel(roh, { nowMs: JETZT, anzahl: 20, minWerte: 50 }), b = MF.momentumZiel(roh, { nowMs: JETZT, minWerte: 50 });
    return [a.ziel.length === 20 && a.anzahl === 20 && b.ziel.length === 10 && b.anzahl === undefined && a.ziel.slice(0, 10).join() === b.ziel.join(), 'mit anzahl ' + a.ziel.length + ', ohne ' + b.ziel.length];
  });
  probe('B2-c: Halte-Band 40 - Rang 35 bleibt, Rang 45 geht, Zielzahl 20; planeUmschichtung verkauft R45 und haelt R35', function () {
    var rang = []; for (var i = 1; i <= 60; i++) rang.push('R' + i);
    var buch = { cash: 10000, positionen: [{ sym: 'R35', stueck: 10, einstand: 50 }, { sym: 'R45', stueck: 10, einstand: 50 }] }, preise = {}; rang.forEach(function (s) { preise[s] = 50; });
    var z = MF.zielMitBand(rang, buch, { anzahl: 20, halteBand: 40 }), p = PLANE(rang, buch, preise, { anzahl: 20, halteBand: 40, kleinstAnteil: 0.05 });
    return [z.length === 20 && z[0] === 'R35' && z.indexOf('R45') === -1 && z.indexOf('R19') !== -1 && z.indexOf('R20') === -1 && p.halten.join() === 'R35' && p.verkaufen.map(function (x) { return x.sym; }).join() === 'R45' && p.kaufen.length === 19,
      'Ziel ' + z.slice(0, 3).join(',') + '... (' + z.length + '), halten ' + p.halten.join(',') + ', verkaufen ' + p.verkaufen.map(function (x) { return x.sym; }).join(',') + ', kaufen ' + p.kaufen.length];
  });
  probe('B2-d: Band ohne Bestand = die ersten anzahl; mehr Gehaltene im Band als anzahl -> die besten anzahl; momentumZiel mit halteBand liefert die Rangliste bis zum Band', function () {
    var rang = []; for (var i = 1; i <= 60; i++) rang.push('R' + i);
    var a = MF.zielMitBand(rang, { positionen: [] }, { anzahl: 5, halteBand: 10 }), b = MF.zielMitBand(rang, { positionen: ['R9', 'R3', 'R7', 'R8', 'R6', 'R10', 'R50'].map(function (s) { return { sym: s }; }) }, { anzahl: 5, halteBand: 10 });
    var m = MF.momentumZiel(rohB2(100, 3), { nowMs: JETZT, anzahl: 20, halteBand: 40, minWerte: 50 });
    return [a.join() === 'R1,R2,R3,R4,R5' && b.join() === 'R3,R6,R7,R8,R9' && m.ziel.length === 40 && m.anzahl === 20, 'leer ' + a.join() + ' | voll ' + b.join() + ' | Rangliste ' + m.ziel.length];
  });

  /* ---------- QS F5: Zufallsbuecher mit gleichem Umschlag ---------- */
  probe('F5-1: persistenter Zufallsrang - q vor dem Rangvergleich aus dem Umschlag des Kandidaten kalibriert, Umschlag Zufall im Mittel innerhalb 3 Pp am Kandidaten; Rang nach UND vor Kosten ausgewiesen; Vorgabe (ohne placebo) unveraendert', function () {
    var RM = { zielfunktion: function (roh, o) { var p = []; Object.keys(roh).forEach(function (s) { var r = roh[s], i = r.length - 1; if (i < 151) return; p.push({ sym: s, staerke: r[i][1] / r[i - 150][1] - 1, umsatz: r[i][1] * r[i][2] }); }); if (p.length < 30) return { ziel: [], rangfolge: [], korb: { zulaessig: p.length, geprueft: Object.keys(roh).length }, zuWenig: true }; p.sort(function (a, b) { return b.staerke - a.staerke || (a.sym < b.sym ? -1 : 1); }); return { ziel: p.slice(0, o.anzahl || 20).map(function (x) { return x.sym; }), rangfolge: p, korb: { zulaessig: p.length, geprueft: Object.keys(roh).length }, zuWenig: false, uebersprungen: [], verworfen: [] }; }, placeboZiel: REGEL.placeboZiel };
    var KM = { kennung: 'kunst-momentum-f5', form: 'korb', konfigurationen: [{ key: 'M20', anzahl: 20 }], params: {} };
    var o = { tafel: W.T, qqq: W.qqq, bisPanelende: true, entdeckung: { von: '2021-09-01' }, placeboBuecher: 30, registerM: 1, kostenBpJeSeite: 'regel', massstab: 'SPY', kapitalUsd: 10000 };
    var e = KA.lauf(RM, KM, Object.assign({ placebo: 'persistent' }, o)).konfigurationen[0].entdeckung, P = e.placebo, e0 = KA.lauf(RM, KM, o).konfigurationen[0].entdeckung;
    var w0 = KA.zufallsWert('w', 'K1', Date.UTC(2022, 0, 3), 0), w0b = KA.zufallsWert('w', 'K1', Date.UTC(2022, 6, 3), 0), w1 = KA.zufallsWert('w', 'K1', Date.UTC(2022, 0, 3), 1), w1b = KA.zufallsWert('w', 'K1', Date.UTC(2022, 6, 3), 1);
    return [P && P.q >= 0 && P.q <= 1 && P.innerhalb3Pp && P.rangVorKosten && P.rangVorKosten.von === 31 && P.rangNachKosten.rang === e.rang && e0.placebo === null && w0 === w0b && w1 !== w1b,
      'q ' + (P && P.q.toFixed(3)) + ' (' + (P && P.qQuelle) + '), Umschlag Kandidat ' + (P && (100 * P.umschlagKandidat).toFixed(1)) + ' %, Zufall ' + (P && (100 * P.umschlagZufall).toFixed(1)) + ' %, Rang nach Kosten ' + e.rang + ' / vor Kosten ' + (P && P.rangVorKosten.rang) + ' von 31'];
  });

  /* ---------- C: Eichung Korb ---------- */
  probe('C-1: Eichung Korb an der Kunsttafel - Form des Blocks (gepaart, Einsaat, Null, Rang, Aufloesung), Einsaat +2 Pp gepaart wiedergefunden, schreibt nur eichung.json/EICHUNG.md', function () {
    var aus = fs.mkdtempSync(path.join(require('os').tmpdir(), 'korb-eich-')); fs.writeFileSync(path.join(aus, 'eichung.json'), JSON.stringify({ kennung: 'pruefstrasse/eichung/v1', laeufe: [] }));
    var J = LF.eichungKorb({ V: KA.vorbereiten({ tafel: W.T }), von: tageK[300], bis: W.T.kal.tage[W.T.maxTag], korb: null, seeds: 4, referenz: 12, aus: aus, repo: aus, log: function () {} });
    var Jd = JSON.parse(fs.readFileSync(path.join(aus, 'eichung.json'), 'utf8')), md = fs.readFileSync(path.join(aus, 'EICHUNG.md'), 'utf8');
    fs.rmSync(aus, { recursive: true, force: true });
    var e = J.ergebnis;
    return [Jd.korb && Jd.laeufe && e.geraetepaar.n === 5 && e.geraetepaar.maxDelta < 1e-9 && e.geraetepaar.bestanden && e.einsaatRest.n === 4 && Math.abs(e.einsaatRest.mittel) <= 0.1 && e.einsaatRest.bestanden && e.null.nachrichtlich && e.rang.n === 4 && J.aufloesung.sdReferenz > 0 && J.laufzeitMs > 0 && /Korb-Form \(Nr\. 125a\)/.test(md) && /Aufloesung zuerst/.test(md),
      'Geraetepaar max ' + e.geraetepaar.maxDelta + ' (' + e.geraetepaar.n + '), Einsaat-Rest ' + e.einsaatRest.mittel.toFixed(3) + ' ± ' + e.einsaatRest.sd.toFixed(3) + ', gepaart ' + e.gepaart.mittel.toFixed(3) + ', Null ' + e.null.mittel.toFixed(2) + ' ± ' + e.null.seMittel.toFixed(2) + ', Urteil ' + J.urteil + ', ' + J.msJeLauf + ' ms je Lauf'];
  });
  probe('C-2: pruefstrasse/eichung.json traegt den Korb-Block (Form, Alter <= ' + 60 + ' Tage sonst Warnung) - der PM faehrt node pruefstrasse/laeufer.js --eichung --nur korb', function () {
    var J = JSON.parse(fs.readFileSync(path.join(K.HIER, 'eichung.json'), 'utf8')), k = J.korb;
    if (!k) return [false, 'Korb-Block fehlt (node pruefstrasse/laeufer.js --eichung --nur korb)'];
    var alter = (Date.now() - Date.parse(k.stand)) / 86400000;
    if (alter > 60) console.log('  WARNUNG: Eichung Korb ist ' + Math.floor(alter) + ' Tage alt');
    return [k.kennung === 'pruefstrasse/eichung/korb/v1' && k.ergebnis && k.ergebnis.geraetepaar && k.ergebnis.einsaatRest && k.ergebnis.gepaart && k.ergebnis.null && k.ergebnis.rang && typeof k.bestanden === 'boolean' && k.laufzeitMs > 0 && Array.isArray(k.laeufe) && k.gesperrt === true, 'Stand ' + k.stand + ', ' + k.urteil + ', ' + (k.laufzeitMs / 1000).toFixed(0) + ' s'];
  });

  /* ---------- D: FORM.md ---------- */
  probe('D-1: FORM.md - "Korb: Vorwaerts noch nicht gebaut" gestrichen; Korb-Machbarkeitstor, Korb-Vorwaerts, Zwischenstand, Eichung Korb, Umsatzschwelle 100 Mio $ und halteBand stehen drin', function () {
    var f = fs.readFileSync(path.join(K.HIER, 'FORM.md'), 'utf8');
    return [!/Vorwärts noch nicht gebaut/.test(f) && /Machbarkeitstor Korb/.test(f) && /Vorwärtsbestätigung Korb/.test(f) && /Zwischenstand/.test(f) && /Eichung Korb/.test(f) && /100 Mio \$/.test(f) && /halteBand/.test(f), 'FORM.md ' + f.length + ' Zeichen'];
  });
  try { fs.rmSync(LR, { recursive: true, force: true }); } catch (e) { /* Temp */ }
}
module.exports = tests;

if (require.main === module) {
  var n = 0, rot = 0;
  tests({ ok: function (c, name, extra) { n++; console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) rot++; }, K: require('./konfig.js'), LF: require('./laeufer.js'), cp: require('child_process') });
  console.log('\n' + n + ' Pruefungen, ' + (rot ? rot + ' ROT' : 'ALLE GRUEN'));
  process.exit(rot ? 1 : 0);
}
