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
    gitL(['add', '-A']); gitL(['commit', '-q', '-m', 'Basis']); var basis = gitL(['rev-parse', 'HEAD']);
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
  /* MARKE-B */
  /* MARKE-ENDE */
  if (C.LR) fs.rmSync(C.LR, { recursive: true, force: true });

};
