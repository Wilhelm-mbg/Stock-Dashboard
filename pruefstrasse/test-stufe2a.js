'use strict';
/* Tests der Stufe 2a (Auftrag Nr. 121-2a), aufgerufen aus pruefstrasse/test.js (gleiche Zaehlung, gleiche Kunstwelt). Jede Pruefung laeuft in
 * probe(): eine Ausnahme ist ROT mit Meldung (Rot-vor-Gruen: vor dem Bau scheitern die Pruefungen an fehlenden Funktionen, nicht am Absturz).
 * Deterministisch, ohne Panel-Renditen. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');

module.exports = function (C) {
  var ok = C.ok, K = C.K, TF = C.TF, A = C.A, LF = C.LF, TAGE = C.TAGE;
  function probe(name, fn) { var r; try { r = fn(); } catch (e) { ok(false, name, 'Ausnahme: ' + String(e && e.message || e).slice(0, 200)); return; } ok(!!r[0], name, r[1]); }

  console.log('0) Eichfenster (Nr. 121-2a Schritt 0): feste Grenze der Kalibrierung, unabhaengig vom Entdeckungsende');
  probe('0a: konfig.json eichung = 2016-01-04 .. 2022-12-30, Schnitt = naechster Kalendertag (2022-12-31)', function () {
    return [K.EICHUNG && K.EICHUNG.von === '2016-01-04' && K.EICHUNG.bis === '2022-12-30' && K.EICHUNG.schnitt === '2022-12-31' && K.SPERRE_AB === undefined, JSON.stringify(K.EICHUNG) + ' SPERRE_AB ' + K.SPERRE_AB];
  });
  probe('0b: gesperrte Kunsttafel endet am Eichfenster-Ende, erster Tag danach wie mit der alten Sperre 2023-01-01 (Kunst- und Panel-Kalender)', function () {
    var T = TF.kunstTafel(C.kunstReihen(null), TAGE), alt = A.indexAb(T, '2023-01-01'), neu = A.indexAb(T, K.EICHUNG.schnitt);
    var st = path.join(K.PANEL, 'panel', '_stand.json'), pan = 'Panel-Kalender fehlt (uebersprungen)', panOk = true;
    if (fs.existsSync(st)) { var tg = JSON.parse(fs.readFileSync(st, 'utf8')).tage, f = { tage: tg }; panOk = A.indexAb(f, '2023-01-01') === A.indexAb(f, K.EICHUNG.schnitt) && tg[A.indexAb(f, K.EICHUNG.schnitt) - 1] === K.EICHUNG.bis; pan = 'Panel ' + tg[A.indexAb(f, K.EICHUNG.schnitt)]; }
    return [T.gesperrt && TAGE[T.maxTag] === K.EICHUNG.bis && alt === neu && TF.sperrIndex(TAGE) === neu - 1 && panOk, TAGE[T.maxTag] + ' / ' + TAGE[neu] + ' / ' + pan];
  });
  probe('0c: Adapter ohne schnitt rechnet auf dem Eichfenster bitgleich zum alten Schnitt 2023-01-01 (u brutto/netto, t, se, Placebo)', function () {
    var T = TF.kunstTafel(C.kunstReihen(null), TAGE), E1 = A.lauf(C.zufallSignal, C.KAND, { tafel: T }), E2 = A.lauf(C.zufallSignal, C.KAND, { tafel: T, schnitt: '2023-01-01' });
    var z = function (E) { return JSON.stringify(E.konfigurationen.map(function (k) { return [k.entdeckung.uBrutto, k.entdeckung.uNetto, k.placebo.uBrutto, k.versatz.uBrutto]; })); };
    return [E1.schnitt === E2.schnitt && z(E1) === z(E2) && E1.schnitt === '2023-01-02', E1.schnitt + ' / gleich ' + (z(E1) === z(E2))];
  });
  probe('0d: Minute-Stichtag minute.eichungBis = 2026-08-24 (Fundstelle rsi2seit-2026-08-26.json universum.bis), die Kalibrierung liest ihn', function () {
    var q = fs.readFileSync(path.join(K.HIER, 'adapter', 'minute.js'), 'utf8'), prot = path.join(require('os').homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'protokolle', 'rsi2seit-2026-08-26.json'), pb = null;
    if (fs.existsSync(prot)) pb = JSON.parse(fs.readFileSync(prot, 'utf8')).universum.bis;
    return [K.MINUTE.eichungBis === '2026-08-24' && /messe\(regel, K\.MINUTE\.von, K\.MINUTE\.eichungBis\)/.test(q) && (pb == null || pb === K.MINUTE.eichungBis), K.MINUTE.eichungBis + ' / Protokoll ' + (pb || 'nicht da')];
  });
  console.log('A) Tor 1 raus, Machbarkeitstor vor dem Lauf, Groessenaussage (Nr. 121-2a)');
  var TO = null; try { TO = require('./tore.js'); } catch (e) { TO = null; }
  C.TO = TO;
  probe('A-1: streuung.json - Form (Modell, Koeffizienten, b = 0,5 wirksam, 13 + 39 Stuetzstellen mit Faktor (48 feste H minus 9 mit Datenfehler)) und Monotonie (se faellt mit n_T, steigt mit H, beide Modi)', function () {
    var S = TO.streuung(), k = S.koeffizienten, mono = true, nP = S.stuetzstellen.filter(function (x) { return x.quelle === 'pruefstrasse'; }).length, nT = S.stuetzstellen.filter(function (x) { return x.quelle === 'trendkanal' && x.periode === 'ent'; }).length;
    ['topf', 'zeit'].forEach(function (md) { [1, 5, 20].forEach(function (H) { var a = TO.seGeschaetzt(H, 50, 40, md), b = TO.seGeschaetzt(H, 500, 40, md), c = TO.seGeschaetzt(H, 5000, 40, md); if (!(a > b && b > c)) mono = false; }); if (!(TO.seGeschaetzt(1, 500, 40, md) < TO.seGeschaetzt(5, 500, 40, md) && TO.seGeschaetzt(5, 500, 40, md) < TO.seGeschaetzt(20, 500, 40, md))) mono = false; });
    var form = ['alpha', 'gamma', 'b', 'delta', 'zeta', 'gammaZ'].every(function (f) { return typeof k[f] === 'number'; }) && k.b === 0.5 && S.bFrei && typeof S.bFrei.koeffizienten.b === 'number' && S.aH && S.aH.topf.H5 > 0;
    return [form && mono && nP === 13 && nT === 39 && S.ausgeschlossen.length === 12 && S.stuetzstellen.every(function (x) { return x.faktor > 0; }), 'b ' + k.b + ' (frei ' + S.bFrei.koeffizienten.b.toFixed(3) + '), Stuetzstellen ' + nP + ' + ' + nT + ' (+ Teilzeitraeume ' + (S.stuetzstellen.length - nP - nT) + '), Faktor Median ' + S.faktorSeIstZuGeschaetzt.alle.median.toFixed(2)];
  });
  probe('A-2: Machbarkeitstor (Zahl): Monatswende-artig (H4, 80 Signaltage, zeit, netto 0,48, m 14) nicht messbar mit "braeuchte n"; Umkehr-artig (H1, 1.484, topf, netto 0,26) messbar', function () {
    var a = TO.machbarkeit({ H: 4, nT: 80, d: 794, modus: 'zeit', nettoPp: 0.48, m: 14, signaltageJeJahr: 12 }), b = TO.machbarkeit({ H: 1, nT: 1484, d: 13, modus: 'topf', nettoPp: 0.26, m: 14, signaltageJeJahr: 212 });
    return [!a.messbar && a.braeuchteSignaltage > 80 && a.braeuchteJahre > 5 && b.messbar && b.links <= 0.26 && a.links > 0.48, 'MW: (' + a.tKrit.toFixed(2) + ' + 0,84) x ' + a.seGeschaetzt.toFixed(3) + ' = ' + a.links.toFixed(3) + ', braeuchte ' + a.braeuchteSignaltage + ' (' + a.braeuchteJahre.toFixed(0) + ' J.) | Umkehr ' + b.links.toFixed(3)];
  });
  probe('A-3: Groessenaussage mit/ohne Zusatz "im gemessenen Fenster" (obere 95-%-Grenze brutto < bruttoPp)', function () {
    var a = TO.groessenAussage(0.1, 0.3, false), b = TO.groessenAussage(0.1, 0.3, true), c = TO.groessenAussage(0.5, 0.3, true), d = TO.groessenAussage(null, 0.3, true);
    return [a === 'Literaturgroesse ausgeschlossen (im gemessenen Fenster)' && b === 'Literaturgroesse ausgeschlossen' && c === null && d === null, a + ' | ' + b];
  });
  probe('A-4: Groessenbehauptung - --pruefen verlangt erwartung.nettoPp fuer neue tag-Kandidaten; die sieben alten lesen erwartungen-alt.json (jede Konfiguration, brutto > netto)', function () {
    var tmp = 'kunst-ohne-netto-tmp-' + process.pid, ord = path.join(K.WARTESCHLANGE, tmp), f1, f2, alt = true;
    try {
      fs.mkdirSync(ord, { recursive: true });
      var kd = { kennung: tmp, form: 'tag', titel: 'x', quelle: 'q', autor: 'a', datum: '2026-10-23', erwartung: { groesse: '0,2 Pp', richtung: 'positiv' }, konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }] };
      fs.writeFileSync(path.join(ord, 'kandidat.json'), JSON.stringify(kd)); fs.writeFileSync(path.join(ord, 'regel.js'), 'module.exports = { signal: function () { return null; } };'); fs.writeFileSync(path.join(ord, 'test.js'), 'process.exit(0);'); fs.writeFileSync(path.join(ord, 'REGEL.md'), new Array(30).join('Prosa mit Fundstelle. '));
      f1 = LF.ladeKandidat(tmp).fehler.filter(function (x) { return /nettoPp/.test(x); });
      kd.erwartung.nettoPp = 0.2; fs.writeFileSync(path.join(ord, 'kandidat.json'), JSON.stringify(kd)); f2 = LF.ladeKandidat(tmp).fehler.filter(function (x) { return /nettoPp/.test(x); });
    } finally { fs.rmSync(ord, { recursive: true, force: true }); }
    fs.readdirSync(K.ERLEDIGT).forEach(function (kn) { var kd2 = JSON.parse(fs.readFileSync(path.join(K.WARTESCHLANGE, kn, 'kandidat.json'), 'utf8')); kd2.konfigurationen.forEach(function (c) { var e = TO.erwartungFuer(kd2, c.key); if (!e || !(e.bruttoPp > e.nettoPp) || !/erwartungen-alt/.test(e.quelle)) alt = false; }); });
    return [f1.length === 1 && f2.length === 0 && alt, (f1[0] || '–').slice(0, 90) + ' | alte vollstaendig ' + alt];
  });
  var regelZ = { signal: function (sicht, i) { return (A.fnv(sicht.reihe + '|' + i) % 25) === 0 ? { dir: 1 } : null; } };
  C.regelZ = regelZ;
  probe('A-5: Trockenzaehlung ohne Renditen (adapter/tag.js zaehle): liest keine Rendite (ertragLong gesperrt), Signaltage ~ Entdeckung der Messung', function () {
    var KC = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js')), orig = KC.ertragLong, T = TF.kunstTafel(C.kunstReihen(null), TAGE), Z;
    KC.ertragLong = function () { throw new Error('Rendite gelesen'); };
    try { Z = A.zaehle(T, regelZ, C.KAND, {}); } finally { KC.ertragLong = orig; }
    var E = A.lauf(regelZ, C.KAND, { tafel: T }), h5 = Z.konfigurationen[0], e5 = E.konfigurationen[0].entdeckung;
    return [Z.ohneRenditen && h5.nT > 100 && Math.abs(h5.nT - e5.nTage) <= 3 && h5.nTr >= e5.nTr && h5.d > 0 && Z.TE > 400, 'n_T ' + h5.nT + ' gegen ' + e5.nTage + ', Trades ' + h5.nTr + ' gegen ' + e5.nTr + ', TE ' + Z.TE];
  });
  probe('A-6: Tor 1 ist kein Kriterium mehr (nie in den Gruenden), bleibt nachrichtlich (tor1Schwelle, 11,31 x se)', function () {
    var T = TF.kunstTafel(C.kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.004 : 0; }), TAGE), E = A.lauf(regelZ, C.KAND, { tafel: T }), k = E.konfigurationen[0];
    return [E.konfigurationen.every(function (x) { return x.gruende.indexOf('Tor 1') === -1 && x.tor1Schwelle != null; }) && Math.abs(k.tor1FaktorSe - 11.31) < 0.02, 't ' + k.entdeckung.uNetto.t.toFixed(2) + ', Tor-1-Faktor ' + k.tor1FaktorSe.toFixed(2) + ', Gruende ' + JSON.stringify(k.gruende)];
  });
  /* Laeufer im Temp-Repo mit Stub-Messer: nicht messbar -> kein Entdeckungslauf; messbar -> Lauf nur der messbaren Konfigurationen */
  var LR = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pruefstrasse-2a-')), gitL = function (args) { var r = C.cp.spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false'].concat(args), { cwd: LR, encoding: 'utf8' }); if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr); return r.stdout.trim(); };
  C.LR = LR; C.gitL = gitL;
  try {
    gitL(['init', '-q']); gitL(['config', 'user.name', 'test']); gitL(['config', 'user.email', 'test@example.invalid']); fs.mkdirSync(path.join(LR, 'wiki')); fs.mkdirSync(path.join(LR, 'pruefstrasse', 'erledigt'), { recursive: true });
    fs.writeFileSync(path.join(LR, 'wiki', 'belegstand.md'), '# Belegstand\n'); fs.writeFileSync(path.join(LR, 'wiki', 'log.md'), '# Log\n'); fs.writeFileSync(path.join(LR, 'pruefstrasse', 'register.json'), JSON.stringify({ kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 }));
    gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Basis']); var basis = gitL(['rev-parse', 'HEAD']); C.basis = basis;
    var ortL = { repo: LR, erledigt: path.join(LR, 'pruefstrasse', 'erledigt'), register: path.join(LR, 'pruefstrasse', 'register.json') };
    C.ortL = ortL;
    var TL = TF.kunstTafel(C.kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.02 : 0; }), TAGE, { offen: true });
    C.TL = TL;
    var stubs = function (kand, aufrufe) {
      return { pruefer: function () { return { gueltig: true, form: [], test: { letzteZeile: 'kunst' }, siegel1: { commit: basis } }; }, lade: function () { return { kand: kand, versatzGrund: null }; }, ort: ortL,
        messer: function (kn, phase, aus, log, extra) {
          aufrufe.push({ phase: phase, extra: extra });
          var kf = JSON.parse(JSON.stringify(kand)); if (extra && extra.nur) kf.konfigurationen = kf.konfigurationen.filter(function (c) { return extra.nur.indexOf(c.key) !== -1; });
          var E = phase === 'zaehlung' ? A.zaehle(TL, regelZ, kf, {}) : A.lauf(regelZ, kf, { tafel: TL, schnitt: 'panelende', registerM: extra && extra.m });
          E.kennung = kn; E.form = 'tag'; E.phase = phase; E.stand = '2026-10-23T12:00:00.000Z'; E.konfigurationenSoll = kand.konfigurationen.length;
          fs.writeFileSync(aus, JSON.stringify(E)); return JSON.parse(JSON.stringify(E));
        } };
    };
    C.stubs = stubs;
    var kandNM = { kennung: 'kunst-nm2a', form: 'tag', titel: 'Kunst nicht messbar', quelle: 'q', autor: 'a', datum: '2026-10-23', erwartung: { groesse: 'winzig', richtung: 'positiv', nettoPp: 0.001 }, konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }, { key: 'H10', richtung: 'long', haltedauer: 10 }], params: {} };
    var auf1 = [];
    probe('A-7: Laeufer: keine Konfiguration messbar -> nur Trockenzaehlung, kein Entdeckungslauf, kein Siegel 2, Urteil "nicht messbar", Register-Eintraege mit Gewicht 0 (zaehlt nicht als Test)', function () {
      var r = LF.laufe('kunst-nm2a', stubs(kandNM, auf1)), erg = JSON.parse(fs.readFileSync(path.join(ortL.erledigt, 'kunst-nm2a', 'ergebnis.json'), 'utf8')), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8'));
      var md = fs.readFileSync(path.join(ortL.erledigt, 'kunst-nm2a', 'ERGEBNIS.md'), 'utf8');
      return [r.urteil === 'nicht messbar' && auf1.length === 1 && auf1[0].phase === 'zaehlung' && erg.urteil === 'nicht messbar' && erg.siegel2 === null && Rg.konfigurationen.length === 2 && Rg.konfigurationen.every(function (e) { return e.urteil === 'nicht messbar' && e.zaehlt === 0; }) && TO.registerM(Rg, null) === 0 && /braeuchte/.test(md) && /nicht messbar/.test(gitL(['log', '-1', '--format=%s'])),
        'Aufrufe ' + auf1.map(function (a) { return a.phase; }).join(',') + ', m ' + TO.registerM(Rg, null) + ', ' + r.grund.slice(0, 110)];
    });
    var kandM = JSON.parse(JSON.stringify(kandNM)); kandM.kennung = 'kunst-m2a'; kandM.titel = 'Kunst messbar'; kandM.erwartung.nettoPp = { H5: 3, H10: 0.001 }; var auf2 = [];
    C.kandM = kandM;
    probe('A-8: Laeufer: eine von zwei Konfigurationen messbar -> Entdeckung nur dieser (extra.nur), die andere "nicht messbar" im Register (Gewicht 0), Groessenaussage im Protokoll', function () {
      var r = LF.laufe('kunst-m2a', stubs(kandM, auf2)), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), z = Rg.konfigurationen.filter(function (e) { return e.kennung === 'kunst-m2a'; });
      var md = fs.readFileSync(path.join(ortL.erledigt, 'kunst-m2a', 'ERGEBNIS.md'), 'utf8');
      var h10 = z.filter(function (e) { return e.key === 'H10'; })[0], h5 = z.filter(function (e) { return e.key === 'H5'; })[0];
      C.erstLauf = r;
      return [auf2.length >= 2 && auf2[1].phase === 'entdeckung' && JSON.stringify(auf2[1].extra.nur) === '["H5"]' && h10 && h10.urteil === 'nicht messbar' && h10.zaehlt === 0 && h5 && h5.urteil !== 'nicht messbar' && /Machbarkeitstor/.test(md) && /Groessenaussage/.test(md),
        'Aufrufe ' + auf2.map(function (a) { return a.phase + (a.extra && a.extra.nur ? '[' + a.extra.nur + ']' : ''); }).join(',') + ', H5 ' + (h5 && h5.urteil) + ', Urteil ' + r.urteil];
    });
  } catch (e) { ok(false, 'A-7/A-8: Temp-Repo des Laeufers', 'Ausnahme: ' + String(e.message).slice(0, 200)); }

  console.log('B) Kandidat t >= 3 mit Korrektur ueber alle bisherigen Tests, in der t-Verteilung; Register mit zwei Zahlen (Nr. 121-2a)');
  var TO = C.TO;
  probe('B-1: t-Quantil und P(T >= 3) in der t-Verteilung (df 9: t_0,975 = 2,262, P(T >= 3) = 0,0075; df 53: 0,0020)', function () {
    var q = TO.tQuantil(0.975, 9), p9 = TO.pEinseitig(3, 9), p53 = TO.pEinseitig(3, 53);
    return [Math.abs(q - 2.2622) < 1e-3 && Math.abs(p9 - 0.0075) < 3e-4 && Math.abs(p53 - 0.0020) < 2e-4 && K.KANDIDAT_T === 3 && K.REGISTER_ALPHA === 0.05 && K.REGISTER_M_EXTERN === 0, 't ' + q.toFixed(4) + ', P9 ' + p9.toFixed(5) + ', P53 ' + p53.toFixed(5)];
  });
  probe('B-2: Kandidatenschwelle - df 9 / m 14: Korrektur greift (t = 3,46 einseitig, p 0,05/14; der Ueberschlag des Zweitlesers ~3,7 entspricht p 0,0025); df 53 / m 14: t >= 3 greift; df 9 / m 60 und df 53 / m 60: Korrektur (Zahlen in der Zeile)', function () {
    var a = TO.kandidatSchwelle(9, 14), b = TO.kandidatSchwelle(53, 14), c = TO.kandidatSchwelle(9, 60), d = TO.kandidatSchwelle(53, 60);
    var gut = /Korrektur/.test(a.greift) && a.t > 3.4 && a.t < 3.5 && /^t >= 3/.test(b.greift) && b.t === 3 && /Korrektur/.test(c.greift) && c.t > a.t && /Korrektur/.test(d.greift) && d.t > 3 && d.t < c.t && a.nachrichtlichExtern && a.nachrichtlichExtern.mGesamt === 3414 && a.nachrichtlichExtern.t > 5;
    return [gut, 'df9/m14 ' + a.t.toFixed(2) + ' | df53/m14 ' + b.t.toFixed(2) + ' | df9/m60 ' + c.t.toFixed(2) + ' | df53/m60 ' + d.t.toFixed(2) + ' | extern m 3.414 df 9: ' + a.nachrichtlichExtern.t.toFixed(2)];
  });
  probe('B-3: Adapter wendet die Schwelle an: t 3,2 bei df ~85 wird mit m 2 Kandidat, mit m 200 nicht; Grund nennt die Schwelle', function () {
    var T = TF.kunstTafel(C.kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.0059 : 0; }), TAGE);
    var E2 = A.lauf(C.regelZ, C.KAND, { tafel: T, registerM: 2 }), E60 = A.lauf(C.regelZ, C.KAND, { tafel: T, registerM: 200 }), k2 = E2.konfigurationen[0], k60 = E60.konfigurationen[0], t = k2.entdeckung.uNetto.t;
    return [t > k2.schwelle.t && t < k60.schwelle.t && k2.kandidat && !k60.kandidat && k60.gruende.some(function (g) { return /^t < 3,/.test(g); }) && k2.schwelle.m === 2 && k60.schwelle.m === 200, 't ' + t.toFixed(2) + ' df ' + k2.schwelle.df.toFixed(0) + ', Schwelle m 2 ' + k2.schwelle.t.toFixed(2) + ' / m 200 ' + k60.schwelle.t.toFixed(2) + ', Gruende ' + JSON.stringify(k60.gruende)];
  });
  probe('B-4: Register - m zaehlt Gewichte ("nicht messbar" 0, --grund-daten 2), zwei Zahlen aus df je Eintrag (Kandidat unter der Null; belegt-Vorschlag = x 0,05), Regeln neben Konfigurationen', function () {
    var Rg = { konfigurationen: [{ kennung: 'a', key: 'H1', urteil: 'nein', df: 9 }, { kennung: 'a', key: 'H2', urteil: 'nicht entscheidbar', df: 53 }, { kennung: 'b', key: 'H5', urteil: 'nicht messbar', zaehlt: 0, df: 9 }, { kennung: 'c', key: 'H5', urteil: 'nicht entscheidbar', zaehlt: 2, df: 53 }] };
    var Z = TO.registerZahlen(Rg), m = 4, p9 = Math.min(TO.pEinseitig(3, 9), 0.05 / m), p53 = Math.min(TO.pEinseitig(3, 53), 0.05 / m), soll = p9 + p53 + 2 * p53;
    var R2 = LF.registerEintragen({ konfigurationen: [], gesamt: 0 }, 'x', 'tag', [{ key: 'H5', urteil: 'nein', register: { df: 30 } }], '2026-10-23T00:00:00Z');
    return [Z.m === 4 && Z.regeln === 3 && Z.eintraege === 4 && Math.abs(Z.zufallKandidat - soll) < 1e-12 && Math.abs(Z.zufallBelegt - soll * 0.05) < 1e-12 && TO.registerM(Rg, 'c') === 2 && R2.m === 1 && typeof R2.zufallKandidat === 'number' && typeof R2.zufallBelegt === 'number' && R2.regeln === 1 && /df des Eintrags/.test(R2.zufallRechnung),
      'm ' + Z.m + ', Kandidat unter Null ' + Z.zufallKandidat.toFixed(5) + ' (Soll ' + soll.toFixed(5) + '), belegt ' + Z.zufallBelegt.toFixed(6)];
  });
  probe('B-5: register.json - alle 13 alten Eintraege tragen df (aus ihrem Protokoll), m = 13, zwei Zufallszahlen stehen', function () {
    var Rg = JSON.parse(fs.readFileSync(K.REGISTER, 'utf8')), mitDf = Rg.konfigurationen.filter(function (e) { return e.df > 0; }).length;
    return [Rg.konfigurationen.length >= 13 && mitDf === Rg.konfigurationen.length && Rg.m === TO.registerM(Rg, null) && typeof Rg.zufallKandidat === 'number' && typeof Rg.zufallBelegt === 'number', 'Eintraege ' + Rg.konfigurationen.length + ', mit df ' + mitDf + ', m ' + Rg.m + ', Kandidat unter Null ' + (Rg.zufallKandidat || 0).toFixed(4) + ', belegt ' + (Rg.zufallBelegt || 0).toFixed(5)];
  });
  /* MARKE-B */

  console.log('C) Entdeckung bis zum Panel-Ende, Vorwaertsbestaetigung mit einem Blick, Hausregel, Wiedervorlage, --grund-daten (Nr. 121-2a)');
  probe('C-1: ENTDECKUNG_BIS = panelende; Kandidatenlaeufe oeffnen die Tafel bis zum Panel-Ende (bisPanelende), die Eichfenster-Sperre bleibt Vorgabe', function () {
    var q = fs.readFileSync(path.join(K.HIER, 'laeufer.js'), 'utf8'), qt = fs.readFileSync(path.join(K.HIER, 'tafel.js'), 'utf8');
    var E = A.lauf(C.regelZ, C.KAND, { tafel: C.TL, schnitt: 'panelende' });
    return [K.ENTDECKUNG_BIS === 'panelende' && /phase === 'entdeckung'\) E = require\('\.\/adapter\/tag\.js'\)\.lauf\(regel, kand, \{ quelle: kand\.daten \|\| 'panel', bisPanelende: true, schnitt: 'panelende'/.test(q) && /offen = !!siegel \|\| !!opt\.bisPanelende/.test(qt) && E.schnitt === null && E.letzterTag === TAGE[TAGE.length - 1] && E.konfigurationen.every(function (k) { return !k.pruefung; }) && Math.abs(E.konfigurationen[0].tor1FaktorSe - 11.31) < 0.02,
      'Entdeckung bis ' + E.entdeckungBis + ', letzter Tag ' + E.letzterTag + ', Tor-1-Faktor nachrichtlich ' + E.konfigurationen[0].tor1FaktorSe.toFixed(2)];
  });
  probe('C-2: Stichtag = erster Handelstag des Panels NACH dem Commit-Tag von KANDIDATEN.json (Freitag -> Montag; Tag selbst nie)', function () {
    var i1 = LF.stichtagNach(TAGE, '2022-06-10'), i2 = LF.stichtagNach(TAGE, '2022-06-11'), i3 = LF.stichtagNach(TAGE, '2030-01-01');
    return [TAGE[i1] === '2022-06-13' && TAGE[i2] === '2022-06-13' && i3 === -1, TAGE[i1] + ' / ' + TAGE[i2] + ' / ' + i3];
  });
  var regelV = C.regelZ, kandV = { kennung: 'kunst-v2a', form: 'tag', titel: 'Kunst vorwaerts', quelle: 'q', autor: 'a', datum: '2026-10-23', erwartung: { groesse: 'gross', richtung: 'positiv', nettoPp: 3 }, konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }], params: {} };
  probe('C-3: Stichtag-Leck: die Vorwaertsmessung nimmt keinen Tag vor dem Stichtag (Kurse vor dem Stichtag veraendert -> Messung bitgleich, alle Einstiege ab Stichtag)', function () {
    var auftrag = { siegel2Datum: '2022-06-10', eintraege: [{ key: 'H5', nBedarf: 30, status: 'vorgemerkt' }] };
    var iS = LF.stichtagNach(TAGE, '2022-06-10'), reihen1 = C.kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.02 : 0; }), reihen2 = JSON.parse(JSON.stringify(reihen1));
    var r1 = LF.vorwaertsKind(TF.kunstTafel(reihen1, TAGE, { offen: true }), regelV, kandV, auftrag);
    reihen2.forEach(function (sp) { for (var i = 0; i < iS; i++) { sp.o[i] *= 1.3; sp.c[i] *= 0.7; } });
    var T2 = TF.kunstTafel(reihen2, TAGE, { offen: true }), r2 = LF.vorwaertsKind(T2, regelV, kandV, auftrag);
    var p1 = r1.messung && r1.messung[0].pruefung, p2 = r2.messung && r2.messung[0].pruefung;
    return [r1.stichtag === '2022-06-13' && p1 && JSON.stringify(p1.uNetto) === JSON.stringify(p2.uNetto) && JSON.stringify(p1.uBrutto) === JSON.stringify(p2.uBrutto) && r1.je[0].ersterTag >= r1.stichtag && p1.nTage <= r1.je[0].nStand,
      'Stichtag ' + r1.stichtag + ', erster Signaltag ' + r1.je[0].ersterTag + ', n ' + (p1 && p1.nTage) + ' / ' + r1.je[0].nStand + ', netto ' + (p1 && p1.uNetto.mittel.toFixed(4)) + ' = ' + (p2 && p2.uNetto.mittel.toFixed(4))];
  });
  probe('C-4: Zaehlen ohne Renditen bis zum Bedarf (ertragLong gesperrt, keine Messung), ab Bedarf genau eine Messung', function () {
    var KC = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js')), orig = KC.ertragLong, r0;
    KC.ertragLong = function () { throw new Error('Rendite gelesen'); };
    try { r0 = LF.vorwaertsKind(C.TL, regelV, kandV, { siegel2Datum: '2022-06-10', eintraege: [{ key: 'H5', nBedarf: 100000, status: 'vorgemerkt' }] }); } finally { KC.ertragLong = orig; }
    var r1 = LF.vorwaertsKind(C.TL, regelV, kandV, { siegel2Datum: '2022-06-10', eintraege: [{ key: 'H5', nBedarf: 50, status: 'vorgemerkt' }] });
    return [r0.messung === null && r0.faellig.length === 0 && r0.je[0].nStand > 50 && r1.messung && r1.messung.length === 1 && r1.faellig.join() === 'H5', 'nStand ' + r0.je[0].nStand + ' ohne Rendite; faellig ' + r1.faellig.join(',')];
  });
  probe('C-5: Holm p-basiert (einseitig, alpha / (m - k)): p 0,01 / 0,04 / 0,03 -> nur der kleinste besteht', function () {
    var H = C.TO.holm([0.01, 0.04, 0.03], 0.05);
    return [H.bestanden.join() === 'true,false,false' && Math.abs(H.schwelle[0] - 0.05 / 3) < 1e-12 && Math.abs(H.schwelle[2] - 0.025) < 1e-12, JSON.stringify(H)];
  });
  probe('C-6: Kalender-Hausregel-Marke (zeit und Bedarf oder Bestaetigung < 1.000 Signaltage), Wiedervorlage-Datum aus streuung.json', function () {
    var a = C.TO.hausregelMarke('zeit', 500, null), b = C.TO.hausregelMarke('topf', 500, null), c = C.TO.hausregelMarke('zeit', 1500, 1200), d = C.TO.hausregelMarke('zeit', 1500, 40);
    var w = C.TO.wiedervorlage({ H: 4, nT: 80, d: 794, modus: 'zeit', nettoPp: 0.48, signaltageJeJahr: 12, ab: '2026-09-15' }), w2 = C.TO.wiedervorlage({ H: 1, nT: 1484, d: 13, modus: 'topf', nettoPp: 0.26, signaltageJeJahr: 212, ab: '2026-09-15' });
    return [a === 'nicht muehlenfaehig (Hausregel CLAUDE.md)' && b === null && c === null && d === a && w.datum > '2030-01-01' && w.nNoetig > 80 && w2.jahre === 0 && w2.datum === '2026-09-15', 'Monatswende-artig ab ' + w.datum + ' (' + w.nNoetig + ' Signaltage), Umkehr-artig ' + w2.datum];
  });
  /* Laeufer + --vorwaerts im Temp-Repo des Teils A */
  if (C.ortL) {
    var ortL = C.ortL, LR = C.LR, gitL = C.gitL;
    var auf3 = [], st = C.stubs(kandV, auf3), messerAlt = st.messer;
    st.messer = function (kn, phase, aus, log, extra) { var E = messerAlt(kn, phase, aus, log, extra); if (phase === 'entdeckung') { E.konfigurationen.forEach(function (k) { k.versatz.verstoss = false; k.versatz.wirkt = false; }); fs.writeFileSync(aus, JSON.stringify(E)); } return E; };
    probe('C-7: Laeufer: Kandidat der Entdeckung (bis Panel-Ende) -> keine Pruefzeit, Status vorgemerkt im Register (Siegel-2-Datum, Bedarf, Stand 0), Protokoll mit Vorwaerts-Satz', function () {
      var r = LF.laufe('kunst-v2a', st), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), e = Rg.konfigurationen.filter(function (x) { return x.kennung === 'kunst-v2a'; })[0];
      var md = fs.readFileSync(path.join(ortL.erledigt, 'kunst-v2a', 'ERGEBNIS.md'), 'utf8'), heute = new Date().toISOString().slice(0, 10);
      return [auf3.map(function (a) { return a.phase; }).join() === 'zaehlung,entdeckung' && e && e.status === 'vorgemerkt' && e.siegel2Datum === heute && e.nBedarf >= K.MIN_TAGE && e.nStand === 0 && e.stichtag === null && /Die Vorwaertsmessung prueft die Umsetzung; eine Kante von/.test(md) && /vorgemerkt/.test(r.grund),
        'Aufrufe ' + auf3.map(function (a) { return a.phase; }).join(',') + ', ' + JSON.stringify({ status: e && e.status, s2: e && e.siegel2Datum, nBedarf: e && e.nBedarf })];
    });
    var vmd = path.join(LR, 'pruefstrasse', 'VORWAERTS.md'), vsl = path.join(LR, 'pruefstrasse', 'VORSCHLAEGE.md'), ortV = { repo: LR, erledigt: ortL.erledigt, register: ortL.register, vorwaertsMd: vmd, vorschlaege: vsl };
    var mVor = function (kn, phase, aus, log, extra) { return JSON.parse(JSON.stringify(LF.vorwaertsKind(C.TL, regelV, kandV, extra))); }, still = function () {};
    probe('C-8: --vorwaerts idempotent: Stichtag hinter dem Panel-Ende -> 0 Signaltage, erster Lauf schreibt und committet, zweiter Lauf schreibt nichts und committet nicht', function () {
      var h0 = gitL(['rev-parse', 'HEAD']), r1 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), h1 = gitL(['rev-parse', 'HEAD']), r2 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), h2 = gitL(['rev-parse', 'HEAD']);
      var vj = JSON.parse(fs.readFileSync(path.join(ortL.erledigt, 'kunst-v2a', 'vorwaerts.json'), 'utf8'));
      return [r1.geaendert && h1 !== h0 && !r2.geaendert && r2.commit === null && h2 === h1 && vj.je[0].nStand === 0 && vj.stichtag === null && fs.existsSync(vmd) && gitL(['status', '--porcelain']) === '', 'Lauf 1 ' + r1.geschrieben.join(',') + ' | Lauf 2 geaendert ' + r2.geaendert];
    });
    probe('C-9: Rueckweg bei Abbruch: Register, vorwaerts.json, VORWAERTS.md zurueckgestellt, Index sauber, Marke mit Fehler liegt, naechster Lauf abgelehnt', function () {
      var Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')); Rg.konfigurationen.forEach(function (e) { if (e.kennung === 'kunst-v2a') { e.siegel2Datum = '2022-06-10'; e.nBedarf = 40; } });
      fs.writeFileSync(ortL.register, JSON.stringify(Rg, null, 1) + '\n'); gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Testaufbau: Stichtag in der Tafel']);
      var vorReg = fs.readFileSync(ortL.register, 'utf8'), vorVj = fs.readFileSync(path.join(ortL.erledigt, 'kunst-v2a', 'vorwaerts.json'), 'utf8'), bs = path.join(LR, 'wiki', 'belegstand.md'), bsText = fs.readFileSync(bs, 'utf8'), fehler = null;
      fs.unlinkSync(bs);                                                         /* Statuswechsel scheitert am Belegstand-Anhang, NACH dem Schreiben von Register und vorwaerts.json */
      try { LF.vorwaerts({ ort: ortV, messer: mVor, log: still }); } catch (e) { fehler = e; }
      fs.writeFileSync(bs, bsText);
      var mk = path.join(LR, 'pruefstrasse', LF.VORWAERTS_MARKE), mkJ = fs.existsSync(mk) ? JSON.parse(fs.readFileSync(mk, 'utf8')) : null, zweit = null;
      try { LF.vorwaerts({ ort: ortV, messer: mVor, log: still }); } catch (e) { zweit = e; }
      var gut = fehler && /VORWAERTS abgebrochen/.test(fehler.message) && fs.readFileSync(ortL.register, 'utf8') === vorReg && fs.readFileSync(path.join(ortL.erledigt, 'kunst-v2a', 'vorwaerts.json'), 'utf8') === vorVj && mkJ && mkJ.fehler && zweit && /liegt/.test(zweit.message) && gitL(['diff', '--cached', '--name-only']) === '';
      if (fs.existsSync(mk)) fs.unlinkSync(mk);
      return [gut, (fehler && fehler.message.slice(0, 120)) + ' | zweiter: ' + (zweit && zweit.message.slice(0, 60))];
    });
    probe('C-10: --vorwaerts misst bei Erreichen des Bedarfs GENAU EINMAL (Holm ueber die faelligen, Statuswechsel, Belegstand-Absatz), danach kein zweiter Blick', function () {
      var r1 = LF.vorwaerts({ ort: ortV, messer: mVor, log: still }), Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), e = Rg.konfigurationen.filter(function (x) { return x.kennung === 'kunst-v2a'; })[0];
      var bs = fs.readFileSync(path.join(LR, 'wiki', 'belegstand.md'), 'utf8'), aufrufe = 0, mZ = function (kn, ph, aus, log, extra) { aufrufe++; return mVor(kn, ph, aus, log, extra); };
      var r2 = LF.vorwaerts({ ort: ortV, messer: mZ, log: still });
      return [r1.statuswechsel.length === 1 && ['bestaetigt', 'abgelehnt', 'offen'].indexOf(e.status) !== -1 && e.vorwaerts && e.vorwaerts.holmM === 1 && e.vorwaerts.nTage >= 30 && /\*\*Vorwaertsmessung\*\* `kunst-v2a` H5/.test(bs) && !r2.geaendert && aufrufe === 0 && (e.urteil !== 'belegt-Vorschlag' || fs.existsSync(vsl)),
        'Status ' + e.status + ', Urteil ' + e.urteil + ', n ' + (e.vorwaerts && e.vorwaerts.nTage) + ', p ' + (e.vorwaerts && e.vorwaerts.p.toFixed(5)) + ', zweiter Lauf Messer-Aufrufe ' + aufrufe];
    });
    probe('C-12: Stichtag-Herkunft: siegel2Datum = Commit-Zeitpunkt von KANDIDATEN.json (UTC), nicht die Systemuhr; ohne Commit-Zeit Abbruch statt "heute"', function () {
      fs.writeFileSync(path.join(LR, 'stichtag-probe.txt'), 'x\n'); gitL(['add', '--', 'stichtag-probe.txt']);
      var r = C.cp.spawnSync('git', ['commit', '-q', '-m', 'Commit mit Datum', '--', 'stichtag-probe.txt'], { cwd: LR, encoding: 'utf8', env: Object.assign({}, process.env, { GIT_COMMITTER_DATE: '2026-01-15T22:30:00-05:00', GIT_AUTHOR_DATE: '2026-01-15T22:30:00-05:00' }) });
      var h = gitL(['rev-parse', 'HEAD']), E = A.lauf(C.regelZ, kandV, { tafel: C.TL, schnitt: 'panelende' }), k = E.konfigurationen.filter(function (x) { return x.kandidat; });
      LF.vormerken(kandV, E, k, { commit: h }, LR, function () {});
      var e2 = null; try { LF.vormerken(kandV, E, k, { commit: 'deadbeef' }, LR, function () {}); } catch (e) { e2 = e; }
      var d = k[0].vorwaerts.siegel2Datum, iS = LF.stichtagNach(['2026-01-15', '2026-01-16', '2026-01-19'], d);
      return [r.status === 0 && d === '2026-01-16' && iS === 2 && e2 && /Commit-Zeit/.test(e2.message), 'Commit 22:30 New York = ' + d + ' UTC -> Stichtag-Index ' + iS + ' (2026-01-19); ohne Commit: ' + (e2 && e2.message.slice(0, 70))];
    });
    probe('C-11: --grund-daten: Wiedervorlage ohne Messgeraet-Korrektur, Register zaehlt die Kennung danach doppelt (m), "nicht messbar" bleibt 0', function () {
      var ws = path.join(LR, 'pruefstrasse', 'warteschlange', 'kunst-m2a'); fs.mkdirSync(ws, { recursive: true }); fs.writeFileSync(path.join(ws, 'kandidat.json'), JSON.stringify(C.kandM));
      gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Kandidatenordner']); var cK = gitL(['rev-parse', 'HEAD']);
      var ef = path.join(ortL.erledigt, 'kunst-m2a', 'ergebnis.json'), eg = JSON.parse(fs.readFileSync(ef, 'utf8')); eg.siegel1 = { commit: cK }; fs.writeFileSync(ef, JSON.stringify(eg)); gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Siegel 1 im Testprotokoll']);
      var ortG = { repo: LR, erledigt: ortL.erledigt, warteschlange: path.join(LR, 'pruefstrasse', 'warteschlange'), register: ortL.register }, eKurz = null;
      try { LF.nachmessungPruefen('kunst-m2a', 'kurz', null, ortG, 'daten'); } catch (e) { eKurz = e; }
      var NM = LF.nachmessungPruefen('kunst-m2a', 'Panel bis 2027-06 fortgeschrieben (Nr. 123), rund 190 neue Handelstage', null, ortG, 'daten');
      var m0 = C.TO.registerM(JSON.parse(fs.readFileSync(ortL.register, 'utf8')), null), auf = [], st2 = C.stubs(C.kandM, auf); st2.ort = ortL;
      LF.laufe('kunst-m2a', Object.assign(st2, { nachmessung: Object.assign(NM, { marke: null }) }));
      var Rg = JSON.parse(fs.readFileSync(ortL.register, 'utf8')), z = Rg.konfigurationen.filter(function (x) { return x.kennung === 'kunst-m2a'; }), m1 = C.TO.registerM(Rg, null);
      var h5 = z.filter(function (x) { return x.key === 'H5'; })[0], h10 = z.filter(function (x) { return x.key === 'H10'; })[0], md = fs.readFileSync(path.join(ortL.erledigt, 'kunst-m2a', 'ERGEBNIS.md'), 'utf8');
      return [eKurz && /grund-daten/.test(eKurz.message) && NM.art === 'daten' && NM.zaehlt === 2 && h5.zaehlt === 2 && h10.zaehlt === 0 && m1 === m0 + 1 && /zaehlt im Register 2-fach/i.test(md), 'm ' + m0 + ' -> ' + m1 + ', H5 zaehlt ' + h5.zaehlt + ', H10 ' + h10.zaehlt];
    });
  }

  console.log('D) Eichung an bekanntem Effekt und Zufallssignal (Nr. 121-2a)');
  probe('D-1: Einsaat trifft NUR die Signalfenster: gleicher Seed mit/ohne +0,30 -> u brutto genau +0,30, Placebo, Verschiebung, Ein-/Ausstieg +1 T und Topf bitgleich (beide Modi)', function () {
    var T = TF.kunstTafel(C.kunstReihen(null), TAGE), gut = true, txt = [];
    [['marktweit', 'zeit'], ['querschnitt', 'topf']].forEach(function (dm) {
      var kand = { kennung: 'eichung-test', form: 'tag', bewertung: dm[1], konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }], params: {} };
      var R = LF.eichRegel(dm[0], 7), E0 = A.lauf(R, kand, { tafel: T }), E3 = A.lauf(R, kand, { tafel: T, einsaat: 0.30 }), a = E0.konfigurationen[0], b = E3.konfigurationen[0];
      var d = b.entdeckung.uBrutto.mittel - a.entdeckung.uBrutto.mittel, gleich = JSON.stringify([a.placebo, a.versatz, a.spaet, a.zeitTopf && a.zeitTopf.topfMittel]) === JSON.stringify([b.placebo, b.versatz, b.spaet, b.zeitTopf && b.zeitTopf.topfMittel]);
      if (!(Math.abs(d - 0.30) < 1e-9 && gleich && a.entdeckung.nTage > 20)) gut = false;
      txt.push(dm[0] + ' Differenz ' + d.toFixed(10) + ', Gegenproben gleich ' + gleich + ', ' + a.entdeckung.nTage + ' Signaltage');
    });
    return [gut, txt.join(' | ')];
  });
  probe('D-2: Kriterien statistisch: Einsaat 0,30 +- Streuung besteht, Mittel 0,15 nicht; Zufall: Anteil |t| > 2 hoechstens 15 % (1 von 10 besteht, 2 von 10 nicht; PM 23.10.)', function () {
    var B = LF.eichungBewerten, e1 = B([0.25, 0.32, 0.29, 0.35, 0.28, 0.31, 0.27, 0.33, 0.30, 0.30], [], 0.30), e2 = B([0.15, 0.14, 0.16, 0.15, 0.13, 0.17, 0.15, 0.16, 0.14, 0.15], [], 0.30);
    var z1 = B([0.01, -0.02, 0.03, 0, -0.01, 0.02, -0.03, 0.01, 0, -0.01], [0.3, -1, 2.1, 0.5, -0.2, 1, -1.5, 0.1, 0, -0.4], 0), z2 = B([0.01, -0.02, 0.03, 0, -0.01, 0.02, -0.03, 0.01, 0, -0.01], [2.3, -2.1, 0.2, 0.5, -0.4, 1, -0.5, 0.1, 0, -0.4], 0);
    return [e1.bestanden && !e2.bestanden && z1.bestanden && z1.tUeber2 === 1 && !z2.bestanden && z2.tUeber2 === 2 && LF.EICHUNG.zufallAnteilMax === 0.15 && LF.EICHUNG.dichteMarkt === 0.1 && LF.EICHUNG.seeds === 30, 'e1 ' + e1.mittel.toFixed(3) + ' se ' + e1.seMittel.toFixed(3) + ' | e2 ' + e2.mittel.toFixed(3) + ' | z1 ' + z1.tUeber2 + ' | z2 ' + z2.tUeber2];
  });
  probe('D-2b: marktweit (Seeds teilen den Marktpfad, PM 23.10.): |Mittel| <= 2 x mittlere se JE LAUF statt se_Mittel; Einsaat Spanne + 2 x se je Lauf; se_Mittel nur nachrichtlich', function () {
    var B = LF.eichungBewerten, w = [], t = [], se = [];
    for (var i = 0; i < 30; i++) { w.push(-0.16 + (i % 2 ? 0.4 : -0.4)); se.push(0.5); t.push(w[i] / 0.5); }
    var z = B(w, t, 0, { seJeLauf: se, marktpfad: true }), zAlt = B(w, t, 0), e = B(w.map(function (x) { return x + 0.46; }), t, 0.30, { seJeLauf: se, marktpfad: true }), e2 = B(w.map(function (x) { return x + 0.66; }), t, 0.30, { seJeLauf: se, marktpfad: true });
    var zu = B(w.map(function (x) { return x - 1.0; }), t, 0, { seJeLauf: se, marktpfad: true });
    return [z.bestanden && !zAlt.bestanden && z.kriterium === 'marktpfad' && Math.abs(z.seJeLaufMittel - 0.5) < 1e-12 && z.innerhalb2seMittel === false && /nicht unabhaengig/.test(z.hinweis) && e.bestanden && !e2.bestanden && !zu.bestanden,
      'Zufall -0,16: se je Lauf ' + z.seJeLaufMittel + ' -> ' + z.bestanden + ' (alt se_Mittel ' + zAlt.seMittel.toFixed(3) + ' -> ' + zAlt.bestanden + '); Einsaat 0,30 ' + e.bestanden + ', 0,50 ' + e2.bestanden + '; Zufall -1,16 ' + zu.bestanden];
  });
  probe('D-3: --eichung schreibt ausschliesslich EICHUNG.md und eichung.json (Kunstlauf in einen Temp-Ordner; Waechter erkennt fremde Pfade)', function () {
    var dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pruefstrasse-eichung-')), J;
    try { J = LF.eichung({ tafel: TF.kunstTafel(C.kunstReihen(null), TAGE), seeds: 2, aus: dir, log: function () {} }); var da = fs.readdirSync(dir).sort().join(','); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    var fr = LF.fremdGeschrieben([' M pruefstrasse/a.js'], [' M pruefstrasse/a.js', '?? pruefstrasse/EICHUNG.md', '?? pruefstrasse/x.json'], ['pruefstrasse/EICHUNG.md', 'pruefstrasse/eichung.json']);
    /* Fehlalarm 23.10.: erste Statuszeile vorher ohne fuehrenden Leerraum (getrimmt), nachher mit - darf NICHT als fremd gelten */
    var fr2 = LF.fremdGeschrieben(['M pruefstrasse/FORM.md', ' M pruefstrasse/a.js'], [' M pruefstrasse/EICHUNG.md', ' M pruefstrasse/FORM.md', ' M pruefstrasse/a.js'], ['pruefstrasse/EICHUNG.md', 'pruefstrasse/eichung.json']);
    return [da === 'EICHUNG.md,eichung.json' && J.laeufe.length === 8 && J.ergebnis.marktweit && J.ergebnis.querschnitt && fr.length === 1 && /x\.json/.test(fr[0]) && fr2.length === 0 && J.waechter === 'sauber', 'Dateien ' + da + ', Laeufe ' + J.laeufe.length + ', fremd erkannt: ' + fr.join(',') + ', Fehlalarm-Fall: ' + (fr2.join(',') || 'keiner')];
  });
  probe('D-4: pruefstrasse/eichung.json - Form (Datum, Panel, Eichfenster, Seeds, Ergebnis je Dichte, Laufzeit) und Alter (> 60 Tage nur Warnung)', function () {
    var f = path.join(K.HIER, 'eichung.json');
    if (!fs.existsSync(f)) return [false, 'eichung.json fehlt - der PM faehrt node pruefstrasse/laeufer.js --eichung'];
    var J = JSON.parse(fs.readFileSync(f, 'utf8')), alter = (Date.now() - Date.parse(J.datum + 'T00:00:00Z')) / 86400000;
    var form = /^\d{4}-\d{2}-\d{2}$/.test(J.datum) && J.panelKennung && J.eichfenster && J.eichfenster.bis === K.EICHUNG.bis && J.seeds && J.ergebnis.marktweit && J.ergebnis.querschnitt && typeof J.bestanden === 'boolean' && J.laufzeitMs > 0 && J.laeufe.length === 4 * (J.seeds.einsaat[1] - J.seeds.einsaat[0] + 1) && J.einstellungen.dichteMarkt === LF.EICHUNG.dichteMarkt && J.waechter === 'sauber' && J.ergebnis.marktweit.zufall.kriterium === 'marktpfad' && J.ergebnis.querschnitt.zufall.kriterium === 'unabhaengig' && J.ergebnis.marktweit.zufall.seJeLaufMittel > 0 && fs.existsSync(path.join(K.HIER, 'EICHUNG.md'));
    if (alter > LF.EICHUNG.alterWarnTage) console.log('  WARNUNG eichung.json ist ' + alter.toFixed(0) + ' Tage alt (> ' + LF.EICHUNG.alterWarnTage + ') - vor der naechsten Freigabe neu eichen');
    return [form, 'Datum ' + J.datum + ' (' + alter.toFixed(0) + ' Tage), bestanden ' + J.bestanden + ', ' + (J.laufzeitMs / 1000).toFixed(0) + ' s'];
  });
  /* MARKE-ENDE */
  if (C.LR) fs.rmSync(C.LR, { recursive: true, force: true });

};
