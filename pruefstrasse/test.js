'use strict';
/* Tests der Pruefstrasse (Auftrag Nr. 110 §3): Form, Sperre, Register, Gegenproben (Kunst-Kandidat mit Blick nach vorn -> Messgeraet-
 * Fehler; eingepflanzter Effekt -> Kandidat; zeitfester Effekt -> verschobenes Signal wirkt -> Messgeraet-Fehler), additive Optionen der
 * Instrumente bitgleich, und die KALIBRIERUNG der drei Adapter gegen bekannte Ergebnisse (schreibt pruefstrasse/kalibrierung.json).
 *   node pruefstrasse/test.js            alles (Kalibrierung laeuft tag ~1 min, korb ~10 s, minute ~5 min)
 *   node pruefstrasse/test.js --schnell  ohne die Adapterlaeufe; prueft die abgelegte kalibrierung.json gegen das Soll
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var SG = require('./siegel.js');
var TF = require('./tafel.js');
var A = require('./adapter/tag.js');
var LF = require('./laeufer.js');
var SCHNELL = process.argv.indexOf('--schnell') !== -1;
var fails = 0, n = 0;
function ok(c, name, extra) { n++; console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }
function nahe(a, b, tol) { return a != null && b != null && Math.abs(a - b) <= tol; }
var SCRATCH = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pruefstrasse-test-'));

/* ---------- Kunstwelt: Handelstage 2021-01-04 .. 2023-12-29, 40 Reihen Zufallspfad ---------- */
function werktage(von, bis) { var t = [], d = new Date(von + 'T00:00:00Z'); while (d.toISOString().slice(0, 10) <= bis) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) t.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); } return t; }
var TAGE = werktage('2021-01-04', '2023-12-29');
var rng = A.mulberry32(A.fnv('pruefstrasse-kunst-1'));
function gauss() { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function kunstReihen(effekt) {
  var reihen = [];
  for (var r = 0; r < 40; r++) {
    var sp = { reihe: 'K' + r, tag: [], o: [], h: [], l: [], c: [], v: [] }, p = 50 + 50 * rng();
    for (var i = 0; i < TAGE.length; i++) {
      var o = p * (1 + 0.004 * gauss()), c = o * (1 + 0.012 * gauss() + (effekt ? effekt(r, i) : 0));
      sp.tag.push(i); sp.o.push(o); sp.c.push(c); sp.h.push(Math.max(o, c) * (1 + 0.004 * rng())); sp.l.push(Math.min(o, c) * (1 - 0.004 * rng())); sp.v.push(1e6);
      p = c;
    }
    reihen.push(sp);
  }
  var spy = { reihe: 'SPY', tag: [], o: [], h: [], l: [], c: [], v: [] }, q = 400;
  for (var j = 0; j < TAGE.length; j++) { spy.tag.push(j); spy.o.push(q); spy.c.push(q * (1 + 0.005 * gauss())); spy.h.push(q * 1.01); spy.l.push(q * 0.99); spy.v.push(1e8); q = spy.c[j]; }
  reihen.push(spy);
  return reihen;
}
var KAND = { kennung: 'kunst', form: 'tag', konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }, { key: 'H10', richtung: 'long', haltedauer: 10 }], params: {} };
var zufallSignal = { signal: function (sicht, i) { return (A.fnv(sicht.reihe + '|' + i) % 25) === 0 ? { dir: 1 } : null; } };

console.log('1) Form (FORM.md §1-§4)');
var L0 = LF.ladeKandidat('gibt-es-nicht');
ok(L0.fehler.length === 1 && /Ordner fehlt/.test(L0.fehler[0]), 'fehlender Kandidat wird als ungueltig gemeldet', L0.fehler[0]);
var P1 = LF.pruefen('donchian20-ausbruch-long', { ohneSiegel: true });
ok(P1.form.length === 0 && P1.test && P1.test.status === 0, 'donchian20-ausbruch-long: Form gueltig, test.js gruen', P1.form.join('; ') || P1.test.letzteZeile);
var tmpK = path.join(K.WARTESCHLANGE, 'kunst-ungueltig-tmp');
try {
  fs.mkdirSync(tmpK, { recursive: true });
  fs.writeFileSync(path.join(tmpK, 'kandidat.json'), JSON.stringify({ kennung: 'kunst-ungueltig-tmp', form: 'tag', titel: 'x', konfigurationen: [{ key: 'a', richtung: 'long', haltedauer: 99 }] }));
  fs.writeFileSync(path.join(tmpK, 'regel.js'), 'module.exports = {};'); fs.writeFileSync(path.join(tmpK, 'test.js'), 'process.exit(0);'); fs.writeFileSync(path.join(tmpK, 'REGEL.md'), 'kurz');
  var L1 = LF.ladeKandidat('kunst-ungueltig-tmp');
  ok(L1.fehler.some(function (f) { return /ohne quelle/.test(f); }) && L1.fehler.some(function (f) { return /haltedauer/.test(f); }) && L1.fehler.some(function (f) { return /REGEL.md zu kurz/.test(f); }) && L1.fehler.some(function (f) { return /ohne signal/.test(f); }),
    'Pflichtfelder, Haltedauer, REGEL.md und Schnittstelle werden einzeln gemeldet', L1.fehler.length + ' Fehler');
  ok(LF.naechster() !== 'kunst-ungueltig-tmp', '--naechster ueberspringt den ungueltigen Kandidaten');
} finally { fs.rmSync(tmpK, { recursive: true, force: true }); }

console.log('2) Sperre (Nr. 109): ohne Siegel keine Pruefzeit');
var reihen0 = kunstReihen(null), T0 = TF.kunstTafel(reihen0, TAGE), sperrIdx = TF.sperrIndex(TAGE);
ok(T0.gesperrt && T0.maxTag === sperrIdx && TAGE[sperrIdx] === '2022-12-30', 'Kunsttafel ohne Siegel endet am letzten Tag vor 2023', TAGE[T0.maxTag]);
ok(TF.kunstTafel(reihen0, TAGE, { offen: true }).maxTag === TAGE.length - 1, 'mit Siegel bis zum Ende');
var e1 = null; try { TF.oeffne({ quelle: 'panel', pruefzeit: true, ohneSpeicherpruefung: true }); } catch (e) { e1 = e; }
ok(e1 && e1.sperre && /kein Siegel/.test(e1.message), 'Pruefzeit ohne Siegel-Pfad: Sperre wirft VOR dem Lesen', e1 && e1.message);
/* PM 11.10.2026: die Probe lief vorher gegen pruefstrasse/test.js selbst und war nur rot, solange diese Datei im Arbeitsbaum
 * ungesichert war (Testmarken-Falle). Jetzt gegen eine eigens angelegte, nie committete Datei - unabhaengig vom Arbeitsbaum. */
var tmpS = path.join(K.REPO, 'pruefstrasse', 'ungesichert-tmp.json'); fs.writeFileSync(tmpS, '{}');
var e2 = null; try { require('./paneltafel.js').oeffne({ pruefzeit: true, siegelPfad: 'pruefstrasse/ungesichert-tmp.json', ohneSpeicherpruefung: true }); } catch (e) { e2 = e; }
ok(e2 && e2.sperre, 'Paneltafel: Siegel auf einer veraenderten/ungesicherten Datei scheitert', e2 && e2.message.slice(0, 80));
var e3 = null; try { SG.pruefeSiegel(K.REPO, 'pruefstrasse/ungesichert-tmp.json'); } catch (e) { e3 = e; } finally { fs.unlinkSync(tmpS); }
ok(e3 && e3.sperre && /keinem Commit/.test(e3.message), 'Siegel 2 auf einer Datei ohne Commit: SPERRE', e3 && e3.message);
var s1 = SG.pruefeSiegel(K.REPO, 'pruefstrasse/FORM.md');
ok(/^[0-9a-f]{40}$/.test(s1.commit) && s1.sha256.length === 64, 'Siegel 2 auf FORM.md (committet) liefert Commit und Pruefsumme', s1.commit.slice(0, 7));
var e4 = null; try { SG.siegel1(K.REPO, 'pruefstrasse/gibt-es-nicht'); } catch (e) { e4 = e; }
ok(e4 && e4.sperre, 'Siegel 1 auf einem fehlenden Ordner: SPERRE');
var E0 = A.lauf(zufallSignal, KAND, { tafel: T0 });
ok(E0.konfigurationen.every(function (k) { return k.entdeckung.nTr > 0; }) && E0.konfigurationen.every(function (k) { return !k.pruefung; }) && E0.letzterTag === '2022-12-30', 'gesperrte Tafel: Entdeckung rechnet, Pruefung gibt es nicht', E0.konfigurationen[0].entdeckung.nTr + ' Trades');

console.log('3) Gegenproben und Urteile (FORM §5)');
var Rg0 = { kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 };
var U0 = LF.urteile(E0, null, Rg0);
ok(U0.urteil === 'nicht entscheidbar' || U0.urteil === 'nein', 'Zufallssignal ohne Effekt: kein Kandidat, kein Messgeraet-Fehler', U0.urteil + ' - ' + U0.grund);
ok(E0.verstoesse === 0, 'Zufallssignal: keine Verstoesse');
var vorn = { signal: function (sicht, i) { var c1 = sicht.c(i + 1); return c1 > sicht.c(i) ? { dir: 1 } : null; } };
var Ev = A.lauf(vorn, KAND, { tafel: T0 }), Uv = LF.urteile(Ev, null, Rg0);
ok(Ev.verstoesse > 1000 && Uv.urteil === 'Messgeraet-Fehler', 'Kunst-Kandidat mit Blick nach vorn: Verstoesse gezaehlt, Urteil Messgeraet-Fehler', Ev.verstoesse + ' / ' + Uv.urteil);
/* Positivkontrolle: Effekt nur am Tag nach dem Signal (Einstiegstag ePos = i+1: Eroeffnung -> Schluss +2 %) */
var Tp = TF.kunstTafel(kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.02 : 0; }), TAGE);
var Ep = A.lauf(zufallSignal, KAND, { tafel: Tp }), Up = LF.urteile(Ep, null, Rg0);
ok(Ep.konfigurationen[0].kandidat && Ep.konfigurationen[0].entdeckung.uNetto.t > 5, 'eingepflanzter Effekt (+2 % am Einstiegstag): H5 wird Kandidat', 'netto ' + Ep.konfigurationen[0].entdeckung.uNetto.mittel.toFixed(3) + ' t ' + Ep.konfigurationen[0].entdeckung.uNetto.t.toFixed(1));
ok(Up.urteil !== 'Messgeraet-Fehler' && Up.kandidaten >= 1, 'Positivkontrolle: Kandidat, kein Messgeraet-Fehler', Up.urteil + ' ' + Up.grund);
ok(Ep.konfigurationen[0].placebo.verstoss === false && Math.abs(Ep.konfigurationen[0].placebo.uBrutto.mittel) < 0.5, 'Placebo (anderer Wert, gleicher Tag) sieht den Effekt nicht', Ep.konfigurationen[0].placebo.uBrutto.mittel.toFixed(3));
ok(Ep.konfigurationen[0].spaet.uNetto.mittel < Ep.konfigurationen[0].entdeckung.uNetto.mittel / 3, 'Einstieg einen Tag spaeter verfehlt den Effekt', Ep.konfigurationen[0].spaet.uNetto.mittel.toFixed(3));
/* Zeitfester Effekt in zehn Reihen (jeder 20. Kalendertag +3 %), Signal in genau diesen Reihen am Vortag -> das um 20 Tage verschobene
 * Signal trifft denselben Kalender und wirkt ebenso: Messgeraet-Fehler (ein Markteffekt aller Reihen wuerde dagegen im Topf verschwinden) */
var zeitfest = { signal: function (sicht, i) { return parseInt(sicht.reihe.slice(1), 10) < 10 && (i % 20) === 19 ? { dir: 1 } : null; } };
var Tz = TF.kunstTafel(kunstReihen(function (r, i) { return r < 10 && (i % 20) === 0 ? 0.03 : 0; }), TAGE);
var Ez = A.lauf(zeitfest, KAND, { tafel: Tz }), Uz = LF.urteile(Ez, null, Rg0);
ok(Ez.konfigurationen[0].entdeckung.uNetto.mittel > 1 && Ez.konfigurationen[0].entdeckung.uNetto.t >= 2 && Ez.konfigurationen[0].versatz.wirkt === true && Uz.urteil === 'Messgeraet-Fehler', 'zeitfester Effekt: verschobenes Signal wirkt -> Messgeraet-Fehler', Uz.urteil + ' / netto ' + Ez.konfigurationen[0].entdeckung.uNetto.mittel.toFixed(2) + ' verschoben ' + Ez.konfigurationen[0].versatz.uNetto.mittel.toFixed(2));
/* Die Zelle: Topf derselben Klasse am selben Tag - ein Effekt, der ALLE Reihen trifft, verschwindet gegen den Topf */
var Ta = TF.kunstTafel(kunstReihen(function (r, i) { return (A.fnv('T|' + (i - 1)) % 10) === 0 ? 0.02 : 0; }), TAGE);
var Ea = A.lauf(zufallSignal, KAND, { tafel: Ta });
ok(Math.abs(Ea.konfigurationen[0].entdeckung.uBrutto.mittel) < 0.3 && Ea.konfigurationen[0].entdeckung.roh.mittel > 0.3, 'Markttag-Effekt steckt im Topf: roh positiv, Ueberschuss gegen den Topf ~ null', 'u ' + Ea.konfigurationen[0].entdeckung.uBrutto.mittel.toFixed(3) + ' roh ' + Ea.konfigurationen[0].entdeckung.roh.mittel.toFixed(3));
/* Holm */
var H = LF.holm([0.001, 0.03, 0.2], 3, 0.05);
ok(H.bestanden[0] && !H.bestanden[1] && !H.bestanden[2] && nahe(H.schwelle[0], 0.05 / 3, 1e-12) && nahe(H.schwelle[1], 0.025, 1e-12), 'Holm: 0,001 besteht alpha/3, 0,03 verfehlt alpha/2, danach Abbruch');
var H2 = LF.holm([0.001, 0.02], 2, 0.05);
ok(H2.bestanden[0] && H2.bestanden[1], 'Holm: 0,001 und 0,02 bestehen bei m = 2 (0,025 / 0,05)');

console.log('4) Register (§6)');
var Rg = LF.registerEintragen({ kennung: 'x', konfigurationen: [], gesamt: 0 }, 'a', 'tag', [{ key: 'H5', urteil: 'nein' }, { key: 'H10', urteil: 'nicht entscheidbar' }], '2026-10-11T00:00:00Z');
Rg = LF.registerEintragen(Rg, 'b', 'korb', [{ key: 'k', urteil: 'nicht entscheidbar' }], '2026-10-11T00:00:00Z');
ok(Rg.gesamt === 3 && nahe(Rg.zufallErwartet, 3 * K.ZUFALL_JE_KONFIGURATION, 1e-12), 'Register zaehlt jede Konfiguration (3) und nennt die Zufallserwartung', Rg.zufallErwartet.toFixed(4));
Rg = LF.registerEintragen(Rg, 'a', 'tag', [{ key: 'H5', urteil: 'nein' }], '2026-10-11T00:00:00Z');
ok(Rg.gesamt === 2, 'derselbe Kandidat noch einmal ersetzt seine Zeilen statt sie zu verdoppeln', Rg.gesamt);
ok(nahe(K.ZUFALL_JE_KONFIGURATION, 1 - A.phi(2), 2e-4), 'Zufallserwartung = P(t >= 2) einseitig', (1 - A.phi(2)).toFixed(5));

console.log('5) Additive Optionen der Instrumente: ohne Umgebungsvariable wie bisher');
function kind(code, env) { return cp.spawnSync(process.execPath, ['-e', code], { cwd: K.REPO, encoding: 'utf8', env: Object.assign({}, process.env, env || {}) }).stdout.trim(); }
var ohne = {}; ['PRUEFSTRASSE_MASSNAHMEN', 'PRUEFSTRASSE_WERTPAPIERARTEN', 'RUECKBLICK_PANEL'].forEach(function (k) { ohne[k] = ''; });
var rb = kind("var R=require('./studien/massstab-rueckblick-2026-10-04/rueckblick.js');console.log(R.MASSNAHMEN_ORDNER)", ohne);
ok(rb === 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen', 'rueckblick.js: Vorgabe unveraendert E:/Markt-Dashboard-Archiv/alpaca-massnahmen', rb);
var kb = kind("var S=require('./studien/momentum-korb-2026-10-04/korb.js');console.log(S.MASSNAHMEN_ORDNER)", ohne);
ok(kb === 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen', 'korb.js: Vorgabe unveraendert', kb);
var kb2 = kind("var S=require('./studien/momentum-korb-2026-10-04/korb.js');console.log(S.MASSNAHMEN_ORDNER)", { PRUEFSTRASSE_MASSNAHMEN: '/srv/spiegel/alpaca-massnahmen' });
ok(kb2 === '/srv/spiegel/alpaca-massnahmen', 'korb.js: PRUEFSTRASSE_MASSNAHMEN wird uebernommen', kb2);
var quelle = fs.readFileSync(path.join(K.REPO, 'studien', 'momentum-korb-2026-10-04', 'korb.js'), 'utf8');
ok(quelle.split('(Q.zielfunktion || MH.momentumZiel)').length === 3 && quelle.indexOf('MH.momentumZiel(roh') === -1, 'korb.js: beide Zielaufrufe nehmen Q.zielfunktion, sonst momentumZiel (alte Laeufe ohne das Feld unveraendert)');
var M = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'));
var arch = path.join(SCRATCH, 'archiv'); fs.mkdirSync(arch);
var bars = []; for (var b = 0; b < 400; b++) bars.push([Date.UTC(2024, 0, 2, 14, 30) + b * 3600000 * 7, 100 + Math.sin(b / 7), 1000, 101, 99, 100]);
fs.writeFileSync(path.join(arch, 'bars_60m_KUNST.json'), JSON.stringify({ series: bars }));
var U1 = M._intern.baueKontrolle ? null : null;
var lade = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'))._intern;
ok(U1 === null && typeof lade.baueKontrolle === 'function', 'Messmaschine laedt (intern erreichbar)');
var quelleM = fs.readFileSync(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'), 'utf8');
ok(/function ladeUniversum\(archivPfad, intervall, filter, fenster\)/.test(quelleM) && /optionen\.vonMs != null \|\| optionen\.bisMs != null\) \? \{ vonMs: optionen\.vonMs, bisMs: optionen\.bisMs \} : null/.test(quelleM), 'messmaschine.js: Fenster nur mit optionen.vonMs/bisMs, sonst null (alter Aufruf)');
var wp = fs.readFileSync(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'wertpapierart.js'), 'utf8');
ok(/process\.env\.PRUEFSTRASSE_WERTPAPIERARTEN \|\| path\.join\(os\.homedir\(\), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten\.json'\)/.test(wp), 'wertpapierart.js: Vorgabepfad unveraendert, Variable davor');

console.log('6) Kalibrierung der Adapter gegen bekannte Ergebnisse (Auftrag §3)');
var KAL = path.join(K.HIER, 'kalibrierung.json'), SOLL = {
  tag: { quelle: 'Trendkanal-Studie ERGEBNIS.md Zeile K3-20 E1 long H5 (Bestaetigung ab 07.02.2023)', entNTage: 1735, entNTr: 100692, entUBrutto: -0.2556, entUNetto: -0.3830, entT: -3.13, besNTage: 886, besNTr: 49624, besUBrutto: -0.2221, besUNetto: -0.3396, besT: -3.14 },
  korb: { quelle: 'Nr. 96 (studien/momentum-korb-v23-2026-10-04/ERGEBNIS.md), Regel K, Panel v2.3', 'A-187': 259238.74, 'B-187': 250123.14, spyA: 215535.73, spyB: 181193.87 },
  minute: { quelle: 'Markt-Dashboard-Daten/protokolle/rsi2seit-2026-08-26.json', bruttoJeSignalPp: 0.02054524106238242, huerdePp: 0.1, nettoJeSignalPp: -0.07945475893761758, werte: 2874, handelstage: 730, schnittTag: '2025-03-12' },
};
function adapterLauf(name, args, zeit) {
  var r = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(K.HIER, 'adapter', name + '.js')].concat(args), { cwd: K.REPO, encoding: 'utf8', timeout: zeit, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(name + ' Kalibrierungslauf gescheitert: ' + String(r.stderr).slice(0, 600));
  return r.stdout;
}
var Kal = fs.existsSync(KAL) ? JSON.parse(fs.readFileSync(KAL, 'utf8')) : { stand: null, tag: null, korb: null, minute: null };
if (!SCHNELL) {
  var tagAus = path.join(SCRATCH, 'tag.json'); adapterLauf('tag', ['--kalibrierung', tagAus], 900000);
  var Et = JSON.parse(fs.readFileSync(tagAus, 'utf8')), h5 = Et.konfigurationen.filter(function (k) { return k.key === 'H5'; })[0];
  Kal.tag = { entNTage: h5.entdeckung.nTage, entNTr: h5.entdeckung.nTr, entUBrutto: h5.entdeckung.uBrutto.mittel, entUNetto: h5.entdeckung.uNetto.mittel, entT: h5.entdeckung.uNetto.t,
    besNTage: h5.pruefung.nTage, besNTr: h5.pruefung.nTr, besUBrutto: h5.pruefung.uBrutto.mittel, besUNetto: h5.pruefung.uNetto.mittel, besT: h5.pruefung.uNetto.t, reihen: Et.reihen, verstoesse: Et.verstoesse, ms: Et.ms };
  var Ek = JSON.parse(adapterLauf('korb', ['--kalibrierung'], 900000).trim().split(' ms ')[0]);
  Kal.korb = { 'A-187': Ek['A-187'].buchEnde, 'B-187': Ek['B-187'].buchEnde, spyA: Ek['A-187'].spyEnde, spyB: Ek['B-187'].spyEnde };
  var minAus = path.join(SCRATCH, 'minute.json'); adapterLauf('minute', ['--kalibrierung', minAus], 1800000);
  var Em = JSON.parse(fs.readFileSync(minAus, 'utf8'));
  Kal.minute = { bruttoJeSignalPp: Em.zahlen.bruttoJeSignalPp, huerdePp: Em.zahlen.huerdePp, nettoJeSignalPp: Em.zahlen.nettoJeSignalPp, werte: Em.zahlen.universum.werte, handelstage: Em.zahlen.universum.handelstage, schnittTag: Em.schnittTag, signale: Em.zahlen.signale, t: Em.zahlen.t };
  Kal.stand = new Date().toISOString(); Kal.soll = SOLL;
  fs.writeFileSync(KAL, JSON.stringify(Kal, null, 1) + '\n');
}
ok(Kal.tag && Kal.korb && Kal.minute, 'kalibrierung.json liegt vor (ohne --schnell neu gerechnet)', Kal.stand);
if (Kal.tag) {
  var t = Kal.tag, s = SOLL.tag;
  ok(t.entNTage === s.entNTage && t.entNTr === s.entNTr && t.besNTage === s.besNTage && t.besNTr === s.besNTr, 'tag: Trades und Signaltage der Trendkanal-Zeile exakt (' + s.entNTr + ' / ' + s.besNTr + ')', t.entNTr + ' / ' + t.besNTr);
  ok(nahe(t.entUBrutto, s.entUBrutto, 5e-5) && nahe(t.entUNetto, s.entUNetto, 5e-5) && nahe(t.besUBrutto, s.besUBrutto, 5e-5) && nahe(t.besUNetto, s.besUNetto, 5e-5), 'tag: Ueberschuss brutto/netto in der Rundung der Studie (4 Stellen)', t.entUNetto.toFixed(4) + ' / ' + t.besUNetto.toFixed(4));
  ok(nahe(t.entT, s.entT, 5e-3) && nahe(t.besT, s.besT, 5e-3), 'tag: t Hansen-Hodrick in der Rundung der Studie (2 Stellen)', t.entT.toFixed(2) + ' / ' + t.besT.toFixed(2));
  ok(t.verstoesse === 0, 'tag: kein Blick nach vorn im Kalibrierungslauf');
}
if (Kal.korb) {
  var c = Kal.korb, sk = SOLL.korb;
  ok(Math.round(c['A-187'] * 100) === Math.round(sk['A-187'] * 100) && Math.round(c['B-187'] * 100) === Math.round(sk['B-187'] * 100), 'korb: A-187 und B-187 mit Regel K auf den Cent (259.238,74 / 250.123,14 $)', c['A-187'].toFixed(2) + ' / ' + c['B-187'].toFixed(2));
  ok(Math.round(c.spyA * 100) === Math.round(sk.spyA * 100) && Math.round(c.spyB * 100) === Math.round(sk.spyB * 100), 'korb: S&P 500 auf den Cent');
}
if (Kal.minute) {
  var m = Kal.minute, sm = SOLL.minute;
  /* Das 60m-Archiv LEBT (die App sammelt; am 03.09. wurden alle Dateien neu geschrieben): die 2.874 Werte des Protokolls sind heute
   * 2.892 - die Auswahl vom 26.08. laesst sich nicht wiederherstellen, deshalb nur eine Spanne fuer die Werte und 0,005 Pp fuer die
   * Ertraege; Handelstage, Schnitt und Huerde muessen exakt treffen. Die Abweichung steht in der Uebergabe. */
  ok(m.werte >= sm.werte && m.werte <= sm.werte + 40 && m.handelstage === sm.handelstage && m.schnittTag === sm.schnittTag, 'minute: Handelstage und Schnitt des Protokolls exakt (730 / 2025-03-12), Werte 2874..2914 (Archiv lebt)', m.werte + ' / ' + m.handelstage + ' / ' + m.schnittTag);
  ok(nahe(m.huerdePp, sm.huerdePp, 1e-9), 'minute: Huerde 0,10 Pp je Umlauf', m.huerdePp);
  ok(nahe(m.bruttoJeSignalPp, sm.bruttoJeSignalPp, 5e-3) && nahe(m.nettoJeSignalPp, sm.nettoJeSignalPp, 5e-3) && m.nettoJeSignalPp < 0 && m.bruttoJeSignalPp > 0, 'minute: brutto und netto je Signal wie im Protokoll (+0,0205 / −0,0795 Pp, Toleranz 0,005; Vorzeichen gleich)', m.bruttoJeSignalPp.toFixed(4) + ' / ' + m.nettoJeSignalPp.toFixed(4));
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
console.log('\n' + n + ' Pruefungen, ' + (fails ? fails + ' ROT' : 'ALLE TESTS GRUEN'));
process.exit(fails ? 1 : 0);
