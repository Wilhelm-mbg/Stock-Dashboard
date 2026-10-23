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
};
