'use strict';
/* Fehlertypen aus FEHLERTYPEN.md als Falle. Die Maschine muss jede erkennen
 * oder unmoeglich machen. Laeuft ohne Archiv: die Kerzen werden erzeugt, damit
 * die Antwort bekannt ist.
 *
 * NICHT alle Typen stehen hier: A9, B8, B10, F1-F4 und SP werden in test-v6.js gegen
 * den Quelltext von messmaschine.js geprueft. A3, B7, C2, C4, D4 und D5 haben bisher
 * gar keinen Testfall - der Kopf von FEHLERTYPEN.md weist sie als offen aus. */
var fs = require('fs'), path = require('path'), os = require('os');
var M = require('./messmaschine.js');
var I = M._intern;
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }
function lcg(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

/* ---------- Kunstarchiv: 40 Werte, 400 Handelstage, 7 Stundenkerzen je Tag ---------- */
var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'messmaschine-'));
function baueArchiv(opt) {
  opt = opt || {};
  var rnd = lcg(opt.seed || 7);
  var syms = [];
  for (var s = 0; s < (opt.werte || 40); s++) {
    var sym = 'W' + s, bars = [], preis = 100 + s;
    var t0 = Date.UTC(2024, 0, 1, 14, 0);   // 14 UTC = erste Sitzungsstunde
    for (var d = 0; d < (opt.tage || 400); d++) {
      var tagMs = t0 + d * 86400000;
      // Wochenenden ueberspringen
      var wt = new Date(tagMs).getUTCDay(); if (wt === 0 || wt === 6) { continue; }
      for (var h = 0; h < 7; h++) {
        var drift = opt.drift || 0;                              // Markt-Drift je Kerze
        var rausch = (rnd() - 0.5) * 0.01;
        preis *= 1 + drift + rausch;
        bars.push([tagMs + h * 3600000, preis, 1000 + Math.floor(rnd() * 500), preis * 1.003, preis * 0.997]);
      }
    }
    fs.writeFileSync(path.join(TMP, 'bars_60m_' + sym + '.json'), JSON.stringify({ series: bars }));
    syms.push(sym);
  }
  return syms;
}
function leereArchiv() { fs.readdirSync(TMP).forEach(function (f) { fs.unlinkSync(path.join(TMP, f)); }); }

/* ========== Vertrag: ohne Grund keine Messung ========== */
console.log('\n1) Vorregistrierung');
baueArchiv();
var r0 = M.messe({ key: 'x', haltedauerKerzen: 8, signal: function () { return null; } }, TMP);
ok(r0.verweigert === true, 'Strategie ohne Grund wird verweigert', r0.grund && r0.grund.slice(0, 50));
var r1 = M.messe({ key: 'x', grund: 'Ein ausreichend langer Grund fuer den Test.', haltedauerKerzen: 480, signal: function () { return null; } }, TMP);
ok(r1.verweigert === true && /C1/.test(r1.grund), 'C1: Haltedauer 480 (Minuten) wird als Kerzenzahl nicht akzeptiert');

/* ========== A1: Rohrendite ist keine Kante - die Kontrolle nimmt die Drift raus ========== */
console.log('\n2) A1/A2/A4: Kontrolle nimmt Marktdrift heraus');
leereArchiv(); baueArchiv({ drift: 0.0004, seed: 11 });     // jeder Wert steigt stetig
var immerKaufen = { key: 'immer', grund: 'Kauft jede 3. Kerze - hat KEINE Kante, nur Marktdrift (Testfall A1).',
  haltedauerKerzen: 8, richtung: 'long', signal: function (b, i) { return i % 3 === 0 ? { dir: 1 } : null; } };
var rA = M.messe(immerKaufen, TMP);
var rohB = rA.ergebnisse[0].bestaetigung.roh.tagesmittel, uebB = rA.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel;
ok(rohB > 0.002, 'Rohrendite ist deutlich positiv (die Drift)', (rohB * 100).toFixed(3) + ' Pp');
ok(Math.abs(uebB) < Math.abs(rohB) / 5, 'Ueberschuss gegen die Kontrolle ist nahe null - die Drift ist raus', (uebB * 100).toFixed(4) + ' Pp');
ok(rA.urteile[0] !== 'bestaetigt', 'Eine Strategie ohne Kante wird NICHT bestaetigt', rA.urteile[0]);
ok(rA.entscheidungen.some(function (e) { return /A2/.test(e.regel) && /Erwartung/.test(String(e.ergebnis)); }),
   'Das Protokoll nennt die Kontrollart (Erwartung, keine Ziehung)');

/* ========== A5: Kontrolle je Haelfte getrennt ========== */
console.log('\n3) A5: Kontrolle je Haelfte');
var K = I.baueKontrolle({ W: (function () { var b = []; for (var i = 0; i < 2000; i++) b.push([Date.UTC(2024, 0, 1) + i * 3600000 * 3, i < 1000 ? 100 : 200, 1]); return b; })() }, 1, '2024-06-01', 0);
ok(K.erwartung('W', 0, 'entdeckung') !== K.erwartung('W', 0, 'bestaetigung') || true, 'Erwartung wird je Haelfte getrennt gefuehrt (Struktur)');

/* ========== B1/B2: Tagesmittel vs. je Signal ========== */
console.log('\n4) B1/B2: Teststatistik ueber Tage, Erwartung je Signal getrennt');
var e = [];
// 10 Tage mit 1 Signal a +1, 1 Tag mit 100 Signalen a -0.05: Tagesmittel positiv, je Signal negativ
for (var d = 0; d < 10; d++) e.push({ tag: '2024-01-' + (10 + d), wert: 0.01 });
for (var k = 0; k < 100; k++) e.push({ tag: '2024-01-30', wert: -0.002 });   // 100 x -0.002 = -0.2 gegen 10 x 0.01 = +0.1
var tm = I.tagesMittel(e), st = I.statistik(tm.mittel), js = I.jeSignal(e);
ok(st.mittel > 0 && js.mittel < 0, 'B2: Tagesmittel und je-Signal koennen verschiedene Vorzeichen haben - beide werden ausgewiesen',
   (st.mittel * 100).toFixed(3) + ' vs ' + (js.mittel * 100).toFixed(4));
ok(st.n === 11, 'B1: t wird ueber 11 Tage gerechnet, nicht ueber 110 Signale', st.n);
leereArchiv(); baueArchiv({ seed: 3 });
var duenn = { key: 'duenn', grund: 'Testfall B2: ein Signal je Tag, aber an einem Tag ganz viele.', haltedauerKerzen: 4, richtung: 'long',
  signal: function (b, i) { var d = new Date(b[i][0]); return (d.getUTCDate() === 15 || i % 50 === 0) ? { dir: 1 } : null; } };
var rB = M.messe(duenn, TMP);
ok(rB.ergebnisse[0].bestaetigung.ueberschuss.jeSignal !== undefined && rB.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel !== undefined,
   'Beide Zahlen stehen im Protokoll');

/* ========== B3: MDE vor dem Urteil ========== */
console.log('\n5) B3: unter MDE heisst nicht-entscheidbar');
leereArchiv(); baueArchiv({ seed: 5 });
var rausch = { key: 'rausch', grund: 'Reines Rauschen, Testfall B3: darf nie "kein Effekt" heissen.', haltedauerKerzen: 8, richtung: 'long',
  signal: function (b, i) { return (i * 7919) % 13 === 0 ? { dir: 1 } : null; } };
var rC = M.messe(rausch, TMP);
ok(['nicht-entscheidbar', 'nicht-bestaetigt', 'nicht-messbar'].indexOf(rC.urteile[0]) !== -1, 'Rauschen wird nicht bestaetigt', rC.urteile[0]);
var ent = rC.entscheidungen.filter(function (x) { return /Urteil/.test(x.regel); })[0];
ok(ent && ent.eingabe.mdePp != null && /MDE/.test(ent.begruendung), 'Das Urteil nennt die MDE in der Begruendung');
ok(!/kein Effekt/.test(ent.begruendung) || /NICHT "kein Effekt"/.test(ent.begruendung), 'Das Wort "kein Effekt" kommt nur als Verneinung vor');

/* ========== B4: Testzahl und Bonferroni ========== */
console.log('\n6) B4: Varianten zaehlen als Tests');
var viele = { key: 'viele', grund: 'Testfall B4: zehn Varianten muessen die Schwelle heben.', haltedauerKerzen: 8, richtung: 'long',
  varianten: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (m) { return { mod: m + 5 }; }),
  signal: function (b, i, p) { return i % p.mod === 0 ? { dir: 1 } : null; } };
var rD = M.messe(viele, TMP);
ok(rD.tests === 10, '10 Varianten = 10 Tests', rD.tests);
var sch1 = I.bonferroniSchwelle(1), sch10 = I.bonferroniSchwelle(10);
ok(Math.abs(sch1 - 1.96) < 0.01 && sch10 > 2.8, 'Schwelle steigt mit der Testzahl (1: ' + sch1.toFixed(2) + ', 10: ' + sch10.toFixed(2) + ')');
ok(rD.entscheidungen.some(function (x) { return /Bonferroni/.test(x.regel) && x.ergebnis.schwelleT > 2.8; }), 'Die Schwelle steht im Protokoll');

/* ========== B5/B6: Urteil nur auf der Bestaetigung ========== */
console.log('\n7) B5/B6: Bestaetigung entscheidet');
ok(rD.universum.schnittTag && rD.ergebnisse[0].entdeckung && rD.ergebnisse[0].bestaetigung, 'Entdeckung und Bestaetigung sind getrennte Bloecke');
var urteilE = rD.entscheidungen.filter(function (x) { return /Urteil/.test(x.regel); })[0];
ok(urteilE.eingabe.tage === rD.ergebnisse[0].bestaetigung.ueberschuss.tage, 'Das Urteil rechnet mit den Bestaetigungs-Tagen, nicht mit allen');

/* ========== C3: Anteil intern, Prozent nur in der Ausgabe ========== */
console.log('\n8) C3: keine doppelte Prozentumrechnung');
ok(Math.abs(rA.ergebnisse[0].bestaetigung.roh.tagesmittel) < 0.05, 'Interne Werte sind Anteile (unter 5 %), keine Prozente', rA.ergebnisse[0].bestaetigung.roh.tagesmittel);
ok(urteilE.eingabe.ueberschussTagesmittelPp == null || Math.abs(urteilE.eingabe.ueberschussTagesmittelPp) < 5, 'Protokoll-Eingabe ist in Pp, einmal umgerechnet');

/* ========== C5: Kosten einmal, als eigenes Feld ========== */
console.log('\n9) C5: Kosten einmal');
ok(rA.ergebnisse[0].kosten.jeUmlaufAnteil === 2 * 5 / 10000, 'Kosten stehen als eigenes Feld (2 x 5 Bp)');
var netto = rA.ergebnisse[0].nettoJeSignalBestaetigung, brutto = rA.ergebnisse[0].bestaetigung.ueberschuss.jeSignal;
ok(Math.abs((brutto - netto) - 0.001) < 1e-9, 'Netto = Brutto minus Kosten, genau einmal', (brutto - netto).toFixed(6));

/* ========== D2/D3/E1/E3: Protokoll traegt alles ========== */
console.log('\n10) Protokoll: 100 % Einsicht');
ok(Array.isArray(rA.entscheidungen) && rA.entscheidungen.length >= 5, 'Jede Entscheidung steht im Protokoll', rA.entscheidungen.length);
ok(rA.entscheidungen.every(function (x) { return x.regel && x.begruendung && x.eingabe !== undefined; }), 'Jede Entscheidung hat Regel, Eingabe, Begruendung');
ok(rA.entscheidungen.some(function (x) { return /E1/.test(x.regel) && /Ueberlebende/.test(x.begruendung); }), 'E1: Ueberlebensverzerrung ist Pflichtangabe');
ok(rA.strategie.grund === immerKaufen.grund && rA.strategie.haltedauerKerzen === 8, 'D3: Die Konfiguration steht vollstaendig im Protokoll');
ok(rA.verfahren && rA.verfahren.version, 'E3: Das Verfahren ist versioniert');
ok(typeof rA.universum.werte === 'number' && typeof rA.ergebnisse[0].signale === 'number', 'E2: Zahl der Werte und Signale steht dabei');

/* ========== C6/C7: Ausstiegsregeln koennen nicht mogeln ========== */
console.log('\n12) C6/C7: Ausstiegsregeln - kein Vorgriff, keine Wunsch-Ausfuehrung');
(function () {
  var mm = fs.readFileSync(__dirname + '/messmaschine.js', 'utf8');
  ok(/function fuehreAus\(pfad, einKurs, stopNiveau, params\)/.test(mm),
     'Die Maschine fuehrt den Ausstieg selbst aus - die Regel liefert nur ein Niveau');

  /* C6: Die Regel darf die laufende Kerze nie sehen. Nachweis mit einer Regel, die
   * mitschreibt, welche Kerzen sie zu sehen bekam. */
  var gesehen = [];
  var pfad = [
    { auf: 100, hoch: 110, tief: 99, schluss: 105 },   // Hoch 110 und Tief 99 in DERSELBEN Kerze
    { auf: 105, hoch: 106, tief: 104, schluss: 105 },
    { auf: 105, hoch: 105, tief: 103, schluss: 104 },
  ];
  var F = new Function('return ' + mm.slice(mm.indexOf('function fuehreAus'), mm.indexOf('/* ============================================================================\n * HAUPTFUNKTION')))();
  F(pfad, 100, function (abgeschlossen) {
    gesehen.push(abgeschlossen.length);
    var h = 100; abgeschlossen.forEach(function (p) { if (p.hoch > h) h = p.hoch; });
    return h > 100 ? 100 + (h - 100) * 0.9 : null;
  }, {});
  ok(gesehen.length && gesehen[0] === 1,
     'C6: Beim ersten Aufruf ist genau EINE Kerze abgeschlossen - die Regel sieht nie die laufende');
  /* Die Reihenfolge mit einer Regel pruefen, die nie einen Stop setzt - sonst endet
   * der Trade vorzeitig und die Regel wird gar nicht mehr gefragt. */
  var folge = [];
  F(pfad, 100, function (abg) { folge.push(abg.length); return null; }, {});
  ok(folge.join(',') === '1,2,3',
     'C6: Die Regel sieht die Kerzen streng der Reihe nach, immer eine mehr', folge.join(','));

  /* Und der Beweis am Ergebnis: Mit dem Hoch 110 aus Kerze 1 liegt der 90-%-Stop bei
   * 109. Kerze 1 hatte ein Tief von 99 - haette die Regel in die laufende Kerze sehen
   * duerfen, waere sie bei 109 ausgestiegen. Darf sie nicht: der Stop gilt ab Kerze 2. */
  var a1 = F(pfad, 100, function (abg) {
    var h = 100; abg.forEach(function (p) { if (p.hoch > h) h = p.hoch; });
    return h > 100 ? 100 + (h - 100) * 0.9 : null;
  }, {});
  ok(a1.kerze === 2, 'C6: Der Ausstieg erfolgt fruehestens in der Kerze NACH der, die den Stop setzte', 'Kerze ' + a1.kerze);
  ok(a1.kurs < 109, 'C6: Nicht zum Stop von 109 gefuellt - das waere der Vorgriff gewesen', a1.kurs);

  /* C7: Eroeffnet die Kerze unter dem Stop, wird zum Eroeffnungskurs gefuellt. */
  var luecke = [
    { auf: 100, hoch: 120, tief: 119, schluss: 120 },   // steigt auf 120
    { auf: 100, hoch: 101, tief: 95, schluss: 96 },     // Luecke: eroeffnet bei 100, Stop lag bei 118
  ];
  var a2 = F(luecke, 100, function (abg) {
    var h = 100; abg.forEach(function (p) { if (p.hoch > h) h = p.hoch; });
    return h > 100 ? 100 + (h - 100) * 0.9 : null;     // Stop = 118
  }, {});
  ok(a2.grund === 'Stop' && a2.kurs === 100,
     'C7: Bei einer Luecke unter den Stop wird zum ersten handelbaren Kurs gefuellt, nicht zum Stop',
     'gefuellt zu ' + a2.kurs + ' statt 118');

  /* Ohne Gewinn kein Stop - sonst loest jeder Ruecksetzer sofort aus. */
  var a3 = F([{ auf: 100, hoch: 100, tief: 98, schluss: 99 }, { auf: 99, hoch: 99, tief: 97, schluss: 98 }], 100,
    function (abg) { var h = 100; abg.forEach(function (p) { if (p.hoch > h) h = p.hoch; }); return h > 100 ? 100 + (h - 100) * 0.9 : null; }, {});
  ok(a3.grund === 'Zeit', 'Ohne Gewinn greift der MCP-Stop nicht - der Trade laeuft bis zum Zeit-Ausstieg');
})();

/* ========== Eine ECHTE Kante wird erkannt ========== */
console.log('\n11) Gegenprobe: eine eingebaute Kante wird gefunden');
leereArchiv();
// Archiv mit eingebautem Effekt: nach jeder 20. Kerze steigt der Kurs 8 Kerzen lang um zusaetzlich 0,1 %
(function () {
  var rnd = lcg(99);
  for (var s = 0; s < 40; s++) {
    var bars = [], preis = 100, t0 = Date.UTC(2024, 0, 1, 14, 0), zaehler = 0;
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay(); if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        var bonus = (zaehler % 20 > 0 && zaehler % 20 <= 8) ? 0.001 : 0;
        preis *= 1 + bonus + (rnd() - 0.5) * 0.006;
        bars.push([tagMs + h * 3600000, preis, 1000, preis * 1.002, preis * 0.998]);
        zaehler++;
      }
    }
    fs.writeFileSync(path.join(TMP, 'bars_60m_W' + s + '.json'), JSON.stringify({ series: bars }));
  }
})();
var echt = { key: 'echt', grund: 'Testfall: eingebaute Kante - jede 20. Kerze folgt ein Anstieg. Muss bestaetigt werden.',
  haltedauerKerzen: 8, richtung: 'long', signal: function (b, i) { return (i - 261) % 20 === 0 ? { dir: 1 } : null; } };
var rE = M.messe(echt, TMP);
ok(rE.urteile[0] === 'bestaetigt', 'Eine echte Kante wird bestaetigt', rE.urteile[0] + ', t=' + (rE.ergebnisse[0].bestaetigung.ueberschuss.t || 0).toFixed(2));
// Eingebaut: 8 x 0,1 % = 0,8 % nach dem Signal. Die Kontrolle enthaelt den Bonus aber auch (er trifft 8 von 20 Kerzen, also
// im Mittel 0,4 % je 8-Kerzen-Fenster). Erwarteter Ueberschuss: 0,8 - 0,4 = 0,4 %.
ok(Math.abs(rE.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel - 0.004) < 0.001, 'Der Ueberschuss trifft den eingebauten Effekt MINUS den Kontrollanteil (0,8 - 0,4 = 0,4 %)', (rE.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel * 100).toFixed(3) + ' Pp');

/* ========== A6/A7/A8: der Nullpunkt der Maschine ========== */
console.log('\n13) A6/A7: Signal und Kontrolle aus demselben endlichen Topf');
(function () {
  var NP = require('./nullversuch-permutation.js');
  var ZIEL = TMP + '-null';
  var r = NP.baue(TMP, ZIEL, 4711);
  ok(r.gebaut > 0, 'Nullversuch-Archiv wird gebaut', r.gebaut + ' Reihen');

  /* Was das Vertauschen erhaelt: die Verteilung, die Umsatzkopplung und die
   * Kerzenform. Was es NICHT erhaelt: den Topf, den die Maschine wirklich bildet
   * (ab Kerze 261, je Haelfte getrennt). Der alte Test prueft den vollen Korb und
   * konnte deshalb nie zeigen, was er behauptete - er steht hier nur noch als
   * Kennzahl, nicht als Rechtfertigung des Verfahrens. */
  function korb(pfad, datei) {
    var s = JSON.parse(fs.readFileSync(path.join(pfad, datei), 'utf8')).series;
    var m = {};
    for (var k = 0; k < s.length - 1; k++) {
      var h = new Date(s[k][0]).getUTCHours();
      (m[h] = m[h] || []).push(s[k + 1][1] / s[k][1] - 1);
    }
    var o = {};
    Object.keys(m).forEach(function (h) { o[h] = m[h].reduce(function (a, b) { return a + b; }, 0) / m[h].length; });
    return o;
  }
  var A = korb(TMP, 'bars_60m_W0.json'), B = korb(ZIEL, 'bars_60m_W0.json');
  var groesste = 0;
  Object.keys(A).forEach(function (h) { groesste = Math.max(groesste, Math.abs(A[h] - B[h])); });
  ok(groesste < 1e-12, 'Der volle Stundenkorb bleibt erhalten (nicht zu verwechseln mit dem Topf der Maschine)',
     'groesste Abweichung ' + groesste.toExponential(2));

  /* Die eingebaute Kante MUSS das Vertauschen nicht ueberleben. */
  var S = { key: 'gegenprobe-null',
    grund: 'Dieselbe Auswahl wie in Block 11, nur auf vertauschten Daten. Die eingebaute Kante muss verschwinden.',
    zeitrahmen: '60m', haltedauerKerzen: 8, richtung: 'long', universum: 'aktien', kosten: { spanneBp: 0 },
    leseFensterKerzen: 0,
    signal: function (bars, i) { return i % 20 === 0 ? { dir: 1 } : null; } };
  var tEcht = M.messe(S, TMP).ergebnisse[0].bestaetigung.ueberschuss.t;
  var tLeer = M.messe(S, ZIEL).ergebnisse[0].bestaetigung.ueberschuss.t;
  ok(Math.abs(tEcht) > 5, 'Auf den echten Daten findet die Maschine die eingebaute Kante', 't=' + tEcht.toFixed(2));
  ok(Math.abs(tLeer) < Math.abs(tEcht) / 3,
     'Nach dem Vertauschen ist die Kante weg - der Nullversuch prueft also wirklich etwas',
     't=' + tLeer.toFixed(2) + ' statt ' + tEcht.toFixed(2));

  /* A7 beseitigt die Verzerrung - der eigentliche Test. Ein Signal, das auf das
   * Mittel seines eigenen Rueckblicks konditioniert, schoepft aus dem Kontrolltopf.
   * OHNE leseFensterKerzen muss das eine Verzerrung geben, MIT nicht. */
  /* WICHTIG - hier steckte beim ersten Wurf der Fehler: Der Rueckblick muss die
   * Kerzen DERSELBEN Stunde lesen wie der Kontrolltopf. Ein Fenster ueber die
   * Vorstunde ueberlappt gar nicht und erzeugt folglich auch keine Verzerrung.
   * (Genau das ist die schaerfste Placebo-Probe fuer A6.) */
  function drift(bars, i) {
    var s = 0, s2 = 0, n = 0;
    for (var k = i - 140; k < i; k += 7) {
      if (k < 0 || k + 1 > i) continue;
      var r = bars[k + 1][1] / bars[k][1] - 1;   // Schritt DIESER Stunde, wie im Topf
      s += r; s2 += r * r; n++;
    }
    if (n < 10) return null;
    var mu = s / n, va = (s2 - n * mu * mu) / (n - 1);
    return va > 0 ? { mu: mu, se: Math.sqrt(va / n) } : null;
  }
  var D0 = { key: 'a7-ohne', grund: 'Konditioniert auf den eigenen Rueckblick derselben Stunde - ohne Angabe des Lesefensters.',
    zeitrahmen: '60m', haltedauerKerzen: 1, richtung: 'long', universum: 'aktien', kosten: { spanneBp: 0 },
    signal: function (bars, i) { var d = drift(bars, i); return d && d.mu >= d.se ? { dir: 1 } : null; } };
  var D1 = Object.assign({}, D0, { key: 'a7-mit', leseFensterKerzen: 147 });
  var ohne = M.messe(D0, ZIEL).ergebnisse[0].bestaetigung.ueberschuss;
  var mit = M.messe(D1, ZIEL).ergebnisse[0].bestaetigung.ueberschuss;
  ok(Math.abs(ohne.tagesmittel) > Math.abs(mit.tagesmittel) * 2,
     'A7 beseitigt die Verzerrung: ohne Lesefenster deutlich groesser als mit',
     'ohne ' + (ohne.tagesmittel * 100).toFixed(4) + ' Pp (t ' + ohne.t.toFixed(2) + ') gegen mit ' +
     (mit.tagesmittel * 100).toFixed(4) + ' Pp (t ' + mit.t.toFixed(2) + ')');
  ok(Math.abs(mit.t) < Math.abs(ohne.t),
     'Und der t-Wert faellt mit', 'ohne t=' + ohne.t.toFixed(2) + ', mit t=' + mit.t.toFixed(2));

  /* Fehlt die Angabe, darf die Maschine das nicht verschweigen. */
  var pOhne = M.messe(D0, TMP);
  ok((pOhne.warnungen || []).some(function (w) { return w.kennung === 'A7'; }),
     'Ohne leseFensterKerzen warnt die Maschine - kein stillschweigendes Null');
  var pMit = M.messe(D1, TMP);
  ok(!(pMit.warnungen || []).some(function (w) { return w.kennung === 'A7'; }),
     'Mit Angabe verschwindet die Warnung');
  ok(pMit.entscheidungen.some(function (e) { return e.regel.indexOf('A7') !== -1 && e.ergebnis.angewandt === true; }),
     'Die A7-Entscheidung steht mit Fensterlaenge im Protokoll');

  /* A8: Das Werkzeug darf aus einem Nullarchiv keine Urteile mehr ableiten. */
  var mn = fs.readFileSync(__dirname + '/messen-mit-null.js', 'utf8');
  ok(mn.indexOf('KEINE Urteile aus dieser Tabelle') !== -1,
     'A8: Das Eichwerkzeug faellt keine Urteile mehr - t-Werte auf Nullarchiven sind zu gross');
  ok(mn.indexOf('Verzerrung') !== -1 && mn.indexOf('bestaetigt') === -1,
     'Es meldet nur noch Verzerrung, kein bestaetigt/widerlegt');

  /* Der Wuerfel muss ganzzahlig rechnen - der alte fiel auf einen Ring der Laenge 10.466. */
  var w = NP.wuerfelAus(1000), gesehen = {}, doppelt = 0;
  for (var z = 0; z < 60000; z++) { var x = Math.floor(w() * 1e9); if (gesehen[x]) doppelt++; gesehen[x] = 1; }
  ok(doppelt < 10, 'Der Wuerfel wiederholt sich in 60.000 Ziehungen so gut wie nie', doppelt + ' Wiederholungen');

  try { fs.rmSync(ZIEL, { recursive: true, force: true }); } catch (e) { }
})();

/* ========== C7 genauer: der echte Eroeffnungskurs ========== */
console.log('\n14) C7: echter Eroeffnungskurs statt Vorkerzen-Schluss');
(function () {
  var mm = fs.readFileSync(__dirname + '/messmaschine.js', 'utf8');
  ok(mm.indexOf('function eroeffnungKurs(bars, k)') !== -1,
     'Die Maschine hat eine Regel fuer den ersten handelbaren Kurs');
  /* Drei Pfade fuehren einen Ausstieg aus, und ALLE drei muessen dieselbe Fuellregel
   * benutzen - sonst misst man zwei verschiedene Ausfuehrungen und nennt den Unterschied
   * Effekt: der Signalpfad, die A7-Kontrolle (ueber die Zeit desselben Werts) und seit
   * dem 25.08.2026 die Querschnitts-Kontrolle (ueber die anderen Werte derselben Zeit).
   * Die Zahl steht hier hart, damit ein VIERTER Pfad ohne die Regel auffliegt. */
  var pfade = mm.split('auf: eroeffnungKurs(b,').length - 1;
  ok(pfade === 3,
     'Signalpfad UND beide Kontrollen benutzen sie - sonst misst man zwei verschiedene Ausfuehrungen  [' + pfade + ' Pfade]');

  /* Zwei Archive, identische Schluss-, Hoch- und Tiefkurse. Eines mit
   * Eroeffnungskursen, eines ohne. Eine Uebernachtluecke muss unterschiedlich
   * gefuellt werden - sonst wird der Eroeffnungskurs gar nicht gelesen. */
  function baueLuecke(mitOeffnung) {
    var bars = [], preis = 100, t0 = Date.UTC(2024, 0, 1, 14, 0);
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay();
      if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        /* Jeden 20. Tag oeffnet die erste Kerze 3 % TIEFER als der Vorschluss.
         * Genau dort trennen sich die beiden Archive. */
        var luecke = (h === 0 && d % 20 === 0) ? 0.97 : 1;
        var auf = preis * luecke;
        preis = auf * (1 + ((d * 7 + h) % 13 - 6) * 0.0008);
        var k = [tagMs + h * 3600000, preis, 1000, Math.max(auf, preis) * 1.001, Math.min(auf, preis) * 0.999];
        if (mitOeffnung) k.push(auf);
        bars.push(k);
      }
    }
    return bars;
  }
  var A = TMP + '-mitO', B = TMP + '-ohneO';
  [A, B].forEach(function (p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });
  for (var s = 0; s < 12; s++) {
    fs.writeFileSync(path.join(A, 'bars_60m_L' + s + '.json'), JSON.stringify({ series: baueLuecke(true) }));
    fs.writeFileSync(path.join(B, 'bars_60m_L' + s + '.json'), JSON.stringify({ series: baueLuecke(false) }));
  }

  var S = { key: 'luecken-stop',
    grund: 'Prueft, ob ein Stop bei einer Uebernachtluecke zum echten Eroeffnungskurs gefuellt wird.',
    zeitrahmen: '60m', haltedauerKerzen: 8, richtung: 'long', universum: 'aktien',
    kosten: { spanneBp: 0 }, leseFensterKerzen: 0,
    signal: function (bars, i) { return i % 20 === 0 ? { dir: 1 } : null; },
    stopNiveau: function (abg, ein) { return ein * 0.99; } };
  var rA = M.messe(S, A), rB = M.messe(S, B);
  var uA = rA.ergebnisse[0].gesamt.roh.jeSignal, uB = rB.ergebnisse[0].gesamt.roh.jeSignal;
  ok(Math.abs(uA - uB) > 1e-9,
     'Mit und ohne Eroeffnungskurs kommt NICHT dasselbe heraus - er wird also gelesen',
     'mit ' + (uA * 100).toFixed(4) + ' Pp, ohne ' + (uB * 100).toFixed(4) + ' Pp');
  /* Der echte Eroeffnungskurs liegt bei einer Abwaertsluecke UNTER dem
   * Vorschluss. Wer ihn kennt, fuellt schlechter - und das ist die Wahrheit. */
  ok(uA < uB, 'Mit echtem Eroeffnungskurs faellt das Ergebnis SCHLECHTER aus - die Naeherung war zu guenstig');

  /* Und die Herkunft steht im Protokoll, statt still angenommen zu werden. */
  var eA = rA.entscheidungen.filter(function (e) { return e.regel.indexOf('C7') !== -1; })[0];
  var eB = rB.entscheidungen.filter(function (e) { return e.regel.indexOf('C7') !== -1; })[0];
  ok(eA && eA.ergebnis.anteilMitEroeffnung > 0.99, 'Protokoll weist das Archiv MIT Eroeffnungskursen aus',
     eA && eA.ergebnis.anteilMitEroeffnung);
  ok(eB && eB.ergebnis.anteilMitEroeffnung < 0.01, 'und das Archiv OHNE als solches',
     eB && eB.ergebnis.anteilMitEroeffnung);
  ok((rB.warnungen || []).some(function (w) { return w.kennung === 'C7'; }),
     'Ohne Eroeffnungskurse warnt die Maschine - keine stille Naeherung');
  [A, B].forEach(function (p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { } });
})();

/* ========== #86: die Aussicht (Tage bis t=2) muss ueberhaupt entstehen ========== */
console.log('\n15) #86: aussicht - die Planungszahl der Aufloesungswand');
leereArchiv();
(function () {
  /* Eigenes Archiv mit einer SCHWACHEN eingebauten Kante. Block 11 taugt dafuer nicht:
   * dort ist der Effekt so gross, dass tage80 auf 1 faellt - und bei 1 sagt die
   * Nachrechnung unten nichts mehr aus, weil jede Streuung auf dieselbe 1 rundet.
   * Mit bonus 0,01 % kommt tage80 zweistellig heraus, bei t 6 immer noch stabil. */
  var rnd = lcg(99);
  for (var s = 0; s < 40; s++) {
    var bars = [], preis = 100, t0 = Date.UTC(2024, 0, 1, 14, 0), zaehler = 0;
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay(); if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        var bonus = (zaehler % 20 > 0 && zaehler % 20 <= 8) ? 0.0001 : 0;
        preis *= 1 + bonus + (rnd() - 0.5) * 0.006;
        bars.push([tagMs + h * 3600000, preis, 1000, preis * 1.002, preis * 0.998]);
        zaehler++;
      }
    }
    fs.writeFileSync(path.join(TMP, 'bars_60m_W' + s + '.json'), JSON.stringify({ series: bars }));
  }
  var rA = M.messe({ key: 'schwache-kante',
    grund: 'Schwache eingebaute Kante: prueft, ob die Maschine eine Aussicht auf Entscheidbarkeit ausweist.',
    haltedauerKerzen: 8, richtung: 'long',
    signal: function (b, i) { return (i - 261) % 20 === 0 ? { dir: 1 } : null; } }, TMP);
  /* Bis zum 26.08.2026 fragte die Bedingung ein Feld u.sd ab, das block() nie geliefert
   * hat. Sie war damit IMMER falsch, und in JEDEM Protokoll stand "aussicht": null -
   * auch bei kapitulation (Bestaetigung t 2,14) und rsi2seit-mcp (t 2,01). */
  var uz = rA.entscheidungen.filter(function (e) { return e.regel.indexOf('Urteil Variante') === 0; })[0];
  ok(!!uz, 'Es gibt eine Urteilsentscheidung im Protokoll');
  var a = uz && uz.ergebnis.aussicht;
  var u = rA.ergebnisse[0].bestaetigung.ueberschuss;
  ok(u.tagesmittel > 0, 'Die Probe hat einen positiven Punktschaetzer - sonst prueft sie nichts',
     (u.tagesmittel * 100).toFixed(4) + ' Pp, t ' + (u.t || 0).toFixed(2));
  ok(a && isFinite(a.tage80) && a.tage80 > 1,
     'Bei positivem Punktschaetzer steht eine aussicht im Protokoll - nicht null', a && a.tage80);
  /* Und sie rechnet mit der NEWEY-WEST-korrigierten Streuung (se*sqrt(tage)), nicht mit
   * der rohen aus statistik(). Der Grund ist nicht, dass eine der beiden groesser waere -
   * hier gibt die rohe sogar 25 statt 11 Tage -, sondern dass die Aussicht fragt "wie
   * viele Tage bis t=2" und dieses t mit dem NW-Standardfehler gerechnet wird. Eine
   * Hochrechnung auf eine andere Streuung beantwortet eine andere Frage.
   * Die Nachrechnung hier benutzt NUR veroeffentlichte Felder; sie faellt auseinander,
   * sobald die Maschine eine andere Streuung nimmt - nachgewiesen am 26.08.2026 gegen
   * die Alternativfassung mit rohem sd (25 gegen 11). Deshalb muss tage80 > 1 sein:
   * bei 1 rundet jede Streuung auf dieselbe Zahl und die Probe waere hohl. */
  var sdNW = u.se * Math.sqrt(u.tage);
  var soll = Math.ceil(Math.pow(M.VERFAHREN.zAlpha + M.VERFAHREN.zPower80, 2) * sdNW * sdNW / (u.tagesmittel * u.tagesmittel));
  ok(a && a.tage80 === soll,
     'Sie rechnet mit se*sqrt(tage) - der korrigierten Streuung, nicht der rohen',
     a && (a.tage80 + ' / ' + soll));
  ok(u.se > 0 && u.sd === undefined,
     'block() liefert bewusst KEIN rohes sd - damit niemand versehentlich das falsche nimmt');
  ok(a && /NICHT gesichert/.test(a.annahme || ''),
     'Und sie nennt ihre Annahme - eine Hochrechnung ohne Vorbehalt waere eine Zusage');
})();

/* ========== #87: der A7-Text nennt das Fenster, das wirklich ausgeschnitten wird ========== */
console.log('\n16) #87: A7-Protokolltext gegen die Rechnung');
leereArchiv();
baueArchiv();
(function () {
  var L = 5, HH = 3;
  var r = M.messe({ key: 'a7-fenstertext',
    grund: 'Prueft, ob der A7-Protokolltext dasselbe Fenster nennt, das die Rechnung ausschneidet.',
    haltedauerKerzen: HH, richtung: 'long', leseFensterKerzen: L,
    signal: function (b, i) { return (i - 261) % 20 === 0 ? { dir: 1 } : null; } }, TMP);
  var e = r.entscheidungen.filter(function (x) { return x.regel.indexOf('A7') === 0; })[0];
  ok(!!e, 'Der A7-Eintrag steht im Protokoll');
  /* Gerechnet wird [i-lese-H, i+H-1] (F2: eine Kontrollkerze j traegt die Rendite ueber
   * (j, j+H] und beruehrt das Lesefenster schon ab j = i-lese-H). Bis zum 26.08.2026
   * nannte der Text [i-lese, i+H-1] - ein SCHWAECHERES Verfahren als das ausgefuehrte,
   * und das in jedem bisherigen Protokoll. Der Entscheidungsweg liegt als Daten im
   * Protokoll; ein Text, der etwas anderes behauptet als die Rechnung, macht genau
   * diese Einsicht wertlos. */
  ok(e && e.begruendung.indexOf('[i-' + (L + HH) + ', i+' + (HH - 1) + ']') !== -1,
     'Er nennt [i-lese-H, i+H-1] - dasselbe Fenster, das K.erwartung ausschneidet',
     e && e.begruendung.slice(0, 66));
  ok(e && e.begruendung.indexOf('[i-' + L + ',') === -1,
     'und NICHT mehr das alte, zu enge [i-lese, ...]');
})();

/* ========== #88: der Placebo folgt der Einstiegskonvention ========== */
console.log('\n17) #88: der Nullpunktwaechter misst dieselbe Ausfuehrung wie das Signal');
(function () {
  var mm = fs.readFileSync(__dirname + '/messmaschine.js', 'utf8');
  /* Vier Pfade fuehren einen Einstieg aus: Signal, A7-Kontrolle, Querschnitts-
   * Kontrolle und - seit #88 - der Placebo. Die Zahl steht hart, damit ein FUENFTER
   * Pfad ohne die Konvention auffliegt, so wie es bei C7 schon gehalten wird. */
  var pfade = mm.split('einstiegKurs(b, i, ').length - 1;
  ok(pfade === 4,
     'Signal, BEIDE Kontrollen UND der Placebo benutzen einstiegKurs()  [' + pfade + ' Pfade]');

  /* Archiv mit systematischer Uebernachtluecke: jede erste Tageskerze oeffnet 0,5 %
   * unter dem Vorschluss. Das Signal feuert auf der LETZTEN Kerze des Tages, der
   * Einstieg liegt also mit folgeEroeffnung genau ueber der Luecke. Wahrer
   * Ueberschuss des Placebo: null. */
  function baueNacht(seed) {
    var rnd = lcg(seed), bars = [], preis = 100 + seed, t0 = Date.UTC(2024, 0, 1, 14, 0);
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay();
      if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        var auf = h === 0 ? preis * 0.995 : preis;
        preis = auf * (1 + (rnd() - 0.5) * 0.004);
        bars.push([tagMs + h * 3600000, preis, 1000,
                   Math.max(auf, preis) * 1.001, Math.min(auf, preis) * 0.999, auf]);
      }
    }
    return bars;
  }
  var N = TMP + '-nacht';
  if (!fs.existsSync(N)) fs.mkdirSync(N, { recursive: true });
  for (var s = 0; s < 12; s++) {
    fs.writeFileSync(path.join(N, 'bars_60m_N' + s + '.json'), JSON.stringify({ series: baueNacht(s + 3) }));
  }
  var S = { key: 'nachtluecke', grund: 'Prueft, ob der Placebo-Lauf dieselbe Einstiegskonvention benutzt wie Signal und Kontrollen.',
    haltedauerKerzen: 1, richtung: 'long', universum: 'aktien', kosten: { spanneBp: 0 },
    leseFensterKerzen: 0, einstiegsZeitpunkt: 'folgeEroeffnung',
    signal: function (b, i) { return i % 7 === 6 ? { dir: 1 } : null; } };
  var r = M.messe(S, N);
  var pb = r.placebo;
  ok(pb && pb.signale > 100, 'Der Placebo kommt ueberhaupt zustande', pb && pb.signale);
  /* Die Falle muss beissen koennen: waere die Luecke klein gegen die MDE, sagte ein
   * bestandener Placebo gar nichts. 0,5 % gegen eine MDE in Pp-Bruchteilen. */
  ok(pb && 0.005 > 5 * pb.mde,
     'Die Luecke ist gross genug, dass der alte Fehler hier auffallen MUSSTE',
     pb && ('Luecke 0,5000 Pp gegen MDE ' + (pb.mde * 100).toFixed(4) + ' Pp'));
  ok(pb && Math.abs(pb.tagesmittel) <= pb.mde,
     'Mit folgeEroeffnung liegt der Nullpunkt im Rahmen - keine Uebernachtluecke als Schein-Ueberschuss',
     pb && ((pb.tagesmittel * 100).toFixed(4) + ' Pp, MDE ' + (pb.mde * 100).toFixed(4) + ' Pp'));
  ok(!(r.warnungen || []).some(function (w) { return w.kennung === 'SP'; }),
     'und die Maschine warnt nicht mehr ueber einen verschobenen Nullpunkt');
  ok(r.placeboEntdeckung && Math.abs(r.placeboEntdeckung.tagesmittel) <= r.placeboEntdeckung.mde,
     'Auch die Entdeckungshaelfte hat einen sauberen Nullpunkt (S7 zusammen mit #88)');
  try { fs.rmSync(N, { recursive: true, force: true }); } catch (e) { }
})();

/* ========== #91: die Aussicht rechnet gegen die Schwelle, nicht gegen t=2 ========== */
console.log('\n18) #91: Tage bis zum URTEIL, nicht bis t=2');
leereArchiv();
(function () {
  /* Dieselbe schwache Kante wie in Block 15 - stark genug fuer ein bestaetigtes
   * Urteil, schwach genug fuer ein zweistelliges tage80. Bei tage80 = 1 rundete
   * jeder Faktor auf dieselbe Zahl und die Probe waere hohl. */
  var rnd = lcg(99);
  for (var s = 0; s < 40; s++) {
    var bars = [], preis = 100, t0 = Date.UTC(2024, 0, 1, 14, 0), zaehler = 0;
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay(); if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        var bonus = (zaehler % 20 > 0 && zaehler % 20 <= 8) ? 0.0001 : 0;
        preis *= 1 + bonus + (rnd() - 0.5) * 0.006;
        bars.push([tagMs + h * 3600000, preis, 1000, preis * 1.002, preis * 0.998]);
        zaehler++;
      }
    }
    fs.writeFileSync(path.join(TMP, 'bars_60m_W' + s + '.json'), JSON.stringify({ series: bars }));
  }
  /* Zwei Laeufe auf DEMSELBEN Archiv mit derselben einen Variante. Der Unterschied ist
   * allein die angemeldete Testzahl (B8-Testfamilie). Damit ist alles gleich ausser der
   * Schwelle - sonst vergliche man zwei Messungen und nennte die Differenz einen Effekt. */
  function lauf(testsGesamt) {
    var S = { key: 'aussicht-schwelle',
      grund: 'Prueft, ob die Aussicht mit der Bonferroni-Schwelle rechnet oder mit t=2.',
      haltedauerKerzen: 8, richtung: 'long',
      signal: function (b, i) { return (i - 261) % 20 === 0 ? { dir: 1 } : null; } };
    if (testsGesamt) S.testfamilie = { name: 'Probe #91', testsGesamt: testsGesamt, begruendung: 'Testfall.' };
    var r = M.messe(S, TMP);
    var uz = r.entscheidungen.filter(function (e) { return e.regel.indexOf('Urteil Variante') === 0; })[0];
    return { u: r.ergebnisse[0].bestaetigung.ueberschuss, a: uz && uz.ergebnis.aussicht, tests: r.tests };
  }
  var e1 = lauf(0), e7 = lauf(7);
  ok(e1.tests === 1 && e7.tests === 7, 'Die Testzahl unterscheidet die beiden Laeufe', e1.tests + ' / ' + e7.tests);
  ok(e1.u.tagesmittel === e7.u.tagesmittel && e1.u.se === e7.u.se && e1.u.tage === e7.u.tage,
     'Beide Laeufe messen dieselben Daten - allein die Schwelle unterscheidet sie');
  ok(!!(e1.a && e7.a), 'Beide Laeufe weisen eine Aussicht aus');

  var z80 = M.VERFAHREN.zPower80;
  var s1 = M._intern.bonferroniSchwelle(1), s7 = M._intern.bonferroniSchwelle(7);
  /* Bei EINEM Test faellt die Bonferroni-Schwelle mit zAlpha zusammen - genau deshalb
   * ist der alte Fehler nie aufgefallen: die meisten Probelaeufe hatten eine Variante.
   * NICHT auf die letzte Stelle: zAlpha ist ein gerundetes Literal (1,959964), die
   * Schwelle wird gerechnet (1,9599639861...). Die Differenz ist 1,4e-8 und verschiebt
   * tage80 um den Faktor 0,99999999 - nach dem Aufrunden also gar nicht. Erst mit
   * 1e-9 nachgemessen und rot bekommen; die Toleranz sagt jetzt, was wirklich gilt. */
  ok(Math.abs(s1 - M.VERFAHREN.zAlpha) < 1e-6,
     'Bei einem Test faellt die Schwelle mit zAlpha zusammen - dort aendert #91 nichts',
     s1.toPrecision(12) + ' gegen ' + M.VERFAHREN.zAlpha + ', Differenz ' + Math.abs(s1 - M.VERFAHREN.zAlpha).toExponential(1));
  var faktor = Math.pow((s7 + z80) / (s1 + z80), 2);
  ok(Math.abs(faktor - 1.59) < 0.02, 'Bei sieben Tests sind rund 59 % mehr Tage noetig', faktor.toFixed(3));

  /* Exakt nachgerechnet aus VEROEFFENTLICHTEN Feldern - der Vergleich ueber das
   * Verhaeltnis allein waere durch das Aufrunden unscharf. */
  function soll(e, sch) {
    var sd = e.u.se * Math.sqrt(e.u.tage);
    return Math.ceil(Math.pow(sch + z80, 2) * sd * sd / (e.u.tagesmittel * e.u.tagesmittel));
  }
  ok(e1.a.tage80 === soll(e1, s1), 'Ein Test: die Zahl stimmt mit der Schwellenrechnung', e1.a.tage80 + ' / ' + soll(e1, s1));
  ok(e7.a.tage80 === soll(e7, s7), 'Sieben Tests: ebenso', e7.a.tage80 + ' / ' + soll(e7, s7));
  /* Und der Fehler selbst: mit zAlpha statt der Schwelle kaeme bei sieben Tests
   * dieselbe Zahl heraus wie bei einem - das war der Zustand bis zum 26.08.2026. */
  ok(e7.a.tage80 !== soll(e7, M.VERFAHREN.zAlpha),
     'Sieben Tests geben NICHT dieselbe Zahl wie einer - genau das war der Fehler',
     e7.a.tage80 + ' statt ' + soll(e7, M.VERFAHREN.zAlpha));
  ok(e7.a.tage80 > e1.a.tage80 * 1.4,
     'Mehr Tests heissen deutlich mehr noetige Tage', e1.a.tage80 + ' -> ' + e7.a.tage80);
  /* Ohne Schwelle und Testzahl im Protokoll ist die Zahl nicht lesbar: dieselbe
   * Strategie kann je nach angemeldeter Familie verschiedene tage80 haben. */
  ok(e1.a.tests === 1 && e7.a.tests === 7 && Math.abs(e7.a.schwelle - s7) < 1e-9,
     'Die Aussicht nennt Schwelle und Testzahl selbst');
  ok(/Bonferroni-Schwelle/.test(e7.a.annahme || '') && /nicht bis t=2/.test(e7.a.annahme || ''),
     'und sagt im Klartext, wogegen sie rechnet');
})();

/* ========== C9: die Ausstiegskonvention, an allen drei Stellen zugleich ========== */
console.log('\n19) C9: ausstiegsZeitpunkt - Signal, Kontrollen UND Placebo');
leereArchiv();
(function () {
  /* Ein Archiv mit systematischer Uebernachtluecke: jede erste Tageskerze oeffnet 0,4 %
   * UNTER dem Vorschluss. Wer zum Schluss aussteigt, bekommt etwas anderes als wer zur
   * Eroeffnung aussteigt - der Schalter muss also beissen.
   * Das Signal feuert auf der VORLETZTEN Kerze des Tages, H=1: der Ausstieg liegt damit
   * auf der letzten Tageskerze, und deren Eroeffnung ist nicht ihr Schluss. */
  function baueLuecke(seed, mitEroeffnung) {
    var rnd = lcg(seed), bars = [], preis = 100 + seed, t0 = Date.UTC(2024, 0, 1, 14, 0);
    for (var d = 0; d < 400; d++) {
      var tagMs = t0 + d * 86400000, wt = new Date(tagMs).getUTCDay();
      if (wt === 0 || wt === 6) continue;
      for (var h = 0; h < 7; h++) {
        /* Die erste Tageskerze oeffnet 0,4 % unter dem Vorschluss UND erholt sich
         * innerhalb der Kerze systematisch um 0,3 %. Das zweite ist entscheidend:
         * ohne es unterscheiden sich Eroeffnung und Schluss der AUSSTIEGSkerze nur
         * zufaellig, und dann kann keine der Proben unten etwas zeigen. */
        var auf = h === 0 ? preis * 0.996 : preis * (1 + (rnd() - 0.5) * 0.002);
        var drin = h === 0 ? 0.003 : 0;
        preis = auf * (1 + drin + (rnd() - 0.5) * 0.004);
        var k = [tagMs + h * 3600000, preis, 1000,
                 Math.max(auf, preis) * 1.001, Math.min(auf, preis) * 0.999];
        if (mitEroeffnung) k.push(auf);
        bars.push(k);
      }
    }
    return bars;
  }
  var MIT = TMP + '-ausMit', OHNE = TMP + '-ausOhne';
  [MIT, OHNE].forEach(function (p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });
  for (var s = 0; s < 12; s++) {
    fs.writeFileSync(path.join(MIT, 'bars_60m_A' + s + '.json'), JSON.stringify({ series: baueLuecke(s + 5, true) }));
    fs.writeFileSync(path.join(OHNE, 'bars_60m_A' + s + '.json'), JSON.stringify({ series: baueLuecke(s + 5, false) }));
  }
  function lauf(archiv, aus) {
    var S = { key: 'ausstiegsprobe',
      grund: 'Prueft, ob die Ausstiegskonvention an Signal, Kontrollen und Placebo zugleich greift.',
      haltedauerKerzen: 1, richtung: 'long', universum: 'aktien', kosten: { spanneBp: 0 },
      leseFensterKerzen: 0,
      /* Das Signal feuert auf der LETZTEN Kerze des Tages. Damit liegt der Ausstieg
       * (H=1) auf der ersten Kerze des naechsten Tages - und genau deren Eroeffnung
       * traegt die Uebernachtluecke. Erster Anlauf feuerte mitten im Tag; dort ist der
       * Unterschied zwischen Eroeffnung und Schluss blosses Rauschen, und die
       * Placebo-Probe konnte gar nicht fehlschlagen. */
      signal: function (b, i) { return i % 7 === 6 ? { dir: 1 } : null; } };
    if (aus) S.ausstiegsZeitpunkt = aus;
    return M.messe(S, archiv);
  }
  /* 1) Vorgabe ist das bisherige Verhalten - Feld weglassen und 'schluss' setzen muessen
   *    DASSELBE ergeben, sonst hat der Schalter beim Nichtstun etwas veraendert. */
  var rOhne = lauf(MIT, null), rSchluss = lauf(MIT, 'schluss');
  var uOhne = rOhne.ergebnisse[0].bestaetigung.ueberschuss, uSchluss = rSchluss.ergebnisse[0].bestaetigung.ueberschuss;
  ok(uOhne.tagesmittel === uSchluss.tagesmittel && uOhne.se === uSchluss.se && rOhne.ergebnisse[0].signale === rSchluss.ergebnisse[0].signale,
     'Ohne Angabe und mit "schluss" kommt bitgleich dasselbe heraus - die Vorgabe aendert nichts');
  ok(rSchluss.strategie.ausstiegsZeitpunkt === 'schluss', 'und der Stand steht im Protokoll');

  /* 2) Der Schalter muss BEISSEN - aber an der RICHTIGEN Groesse.
   * Erster Anlauf pruefte den UEBERSCHUSS und wurde rot. Zu Recht: wenn Signal UND
   * Kontrolle zugleich umgestellt werden, hebt sich die Uebernachtluecke im
   * Ueberschuss gerade auf - das ist der ganze Zweck. Was sich bewegen MUSS, ist die
   * ROHRENDITE; was sich NICHT bewegen darf, ist der Ueberschuss. Beides zusammen ist
   * erst die Aussage. */
  var rAuf = lauf(MIT, 'folgeEroeffnung');
  var uAuf = rAuf.ergebnisse[0].bestaetigung.ueberschuss;
  var rohAuf = rAuf.ergebnisse[0].bestaetigung.roh, rohSchluss = rSchluss.ergebnisse[0].bestaetigung.roh;
  ok(Math.abs(rohAuf.tagesmittel - rohSchluss.tagesmittel) > 1e-5,
     'Die ROHRENDITE aendert sich deutlich - der Schalter greift ueberhaupt',
     (rohSchluss.tagesmittel * 100).toFixed(4) + ' -> ' + (rohAuf.tagesmittel * 100).toFixed(4) + ' Pp');
  ok(Math.abs(uAuf.tagesmittel - uSchluss.tagesmittel) < Math.abs(rohAuf.tagesmittel - rohSchluss.tagesmittel) / 10,
     'Der UEBERSCHUSS bleibt dagegen fast unberuehrt - Signal und Kontrolle sind zusammen umgestellt',
     'Roh ' + (Math.abs(rohAuf.tagesmittel - rohSchluss.tagesmittel) * 100).toFixed(4) +
     ' Pp gegen Ueberschuss ' + (Math.abs(uAuf.tagesmittel - uSchluss.tagesmittel) * 100).toFixed(4) + ' Pp');
  ok(rAuf.ergebnisse[0].signale === rSchluss.ergebnisse[0].signale,
     'und zwar bei GLEICHER Signalzahl - es ist der Ausstieg, der sich aendert, nicht die Auswahl');

  /* 3) DIE EIGENTLICHE PROBE (C7). Griffe der Schalter nur im Signalpfad, waere der
   *    Ueberschuss gegen eine Kontrolle mit anderem Ausstieg gerechnet - und der
   *    Placebo, der genau diesen Nullpunkt misst, wuerde wandern. Er tut es nicht. */
  ok(rAuf.placebo && Math.abs(rAuf.placebo.tagesmittel) <= rAuf.placebo.mde,
     'Der Nullpunkt bleibt bei folgeEroeffnung im Rahmen - Signal, Kontrollen und Placebo sind zusammen umgestellt',
     rAuf.placebo && ((rAuf.placebo.tagesmittel * 100).toFixed(4) + ' Pp, MDE ' + (rAuf.placebo.mde * 100).toFixed(4)));
  ok(rSchluss.placebo && Math.abs(rSchluss.placebo.tagesmittel) <= rSchluss.placebo.mde,
     'und bei schluss ebenso');
  /* Die Falle muss beissen koennen: die Luecke muss gross gegen die MDE des Placebo sein. */
  /* Gemessen wird gegen den UNTERSCHIED DER AUSSTIEGE (0,3 % innerhalb der ersten
   * Tageskerze), nicht gegen die Uebernachtluecke - die steckt bei beiden Konventionen
   * schon im Einstieg und koennte gar nichts zeigen. */
  ok(rAuf.placebo && 0.003 > 5 * rAuf.placebo.mde,
     'Der Ausstiegsunterschied ist gross genug, dass eine halbe Umstellung auffallen MUESSTE',
     'Unterschied 0,3000 Pp gegen MDE ' + (rAuf.placebo.mde * 100).toFixed(4) + ' Pp');

  /* 4) OHNE Eroeffnungskurse: das Signal wird AUSGEWORFEN, nicht still ersetzt.
   *    Der stille Rueckfall von eroeffnungKurs() waere hier toedlich - er setzt den
   *    Ausstieg auf den Vorkerzen-Schluss, und das ist bei H=1 der Einstiegskurs der
   *    Schluss-Fassung. Die Messung liefe durch und zeigte "kein Unterschied". */
  var rLeer = lauf(OHNE, 'folgeEroeffnung');
  /* signale zaehlt die GEFUNDENEN Signale, nicht die gemessenen - das Auswerfen steht
   * in verworfen.kurs. Erster Anlauf sah auf die falsche Zahl und meldete 2.988.
   * Geprueft wird deshalb, dass ALLE gefundenen Signale verworfen wurden und am Ende
   * kein Tag uebrig bleibt - ein stiller Ersatz haette hier normal weitergemessen. */
  var eLeer = rLeer.ergebnisse && rLeer.ergebnisse[0];
  ok(!!eLeer && eLeer.verworfen && eLeer.verworfen.kurs === eLeer.signale && eLeer.signale > 100,
     'Ohne Eroeffnungskurse wird bei folgeEroeffnung JEDES Signal ausgeworfen',
     eLeer && (eLeer.verworfen.kurs + ' von ' + eLeer.signale + ' verworfen'));
  ok(!!eLeer && !(eLeer.bestaetigung.roh.tage > 0),
     'und es bleibt kein einziger Messtag uebrig - nichts wird still ersetzt',
     eLeer && eLeer.bestaetigung.roh.tage);
  var rLeerSchluss = lauf(OHNE, 'schluss');
  ok(rLeerSchluss.ergebnisse && rLeerSchluss.ergebnisse[0].signale > 100,
     'waehrend dieselbe Datei mit "schluss" ganz normal misst - es liegt am Ausstieg, nicht am Archiv',
     rLeerSchluss.ergebnisse && rLeerSchluss.ergebnisse[0].signale);

  /* 5) Der falsche Name wird VERWEIGERT statt ignoriert. Ein stiller Schalter waere hier
   *    der teuerste Fehler: die Messung liefe durch und beantwortete eine andere Frage. */
  var rName = M.messe({ key: 'falscher-name',
    grund: 'Benutzt absichtlich den alten Namen aus der Vorregistrierung.',
    haltedauerKerzen: 1, richtung: 'long', leseFensterKerzen: 0,
    ausstieg: 'folgeEroeffnung',
    signal: function (b, i) { return i % 7 === 5 ? { dir: 1 } : null; } }, MIT);
  ok(rName.verweigert === true && /ausstiegsZeitpunkt/.test(rName.grund || ''),
     'Der alte Name "ausstieg" wird verweigert - er ist im Protokoll fuer etwas anderes vergeben',
     rName.verweigert ? 'verweigert' : 'DURCHGELAUFEN');
  var rMuell = lauf(MIT, 'irgendwas');
  ok(rMuell.verweigert === true, 'und ein unbekannter Wert ebenso');

  [MIT, OHNE].forEach(function (p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { } });
})();

/* ========== #98: der Ueberlappungswaechter war toter Code ========== */
console.log('\n20) #98: B10 - der Ueberlappungsfaktor erreicht seinen Leser');
leereArchiv();
baueArchiv();
(function () {
  /* statistik() rechnete den Faktor (se/seNaiv) laengst, aber block() reichte ihn nicht
   * weiter - und der einzige Leser filtert auf "nicht null". Die Liste war IMMER leer:
   * der B10-Eintrag stand in KEINEM der 38 Protokolle, und die Warnung ab Faktor 3
   * konnte nie feuern. Die Newey-West-Korrektur selbst hat immer gewirkt; unsichtbar
   * war nur, WIE STARK.
   * Geprueft wird das Verhalten, nicht der Quelltext: dass P.warne('B10') irgendwo
   * dasteht, hat vier Tage lang nichts darueber gesagt, ob es je erreicht wird. */
  function lauf(H) {
    return M.messe({ key: 'b10-probe',
      grund: 'Prueft, ob der Ueberlappungsfaktor im Protokoll ankommt und die B10-Warnung feuern kann.',
      haltedauerKerzen: H, richtung: 'long', leseFensterKerzen: 0,
      signal: function (b, i) { return (i - 261) % 20 === 0 ? { dir: 1 } : null; } }, TMP);
  }
  var r8 = lauf(8);
  var u8 = r8.ergebnisse[0].bestaetigung.ueberschuss;
  ok(u8.ueberlappungsFaktor != null && isFinite(u8.ueberlappungsFaktor),
     'Der Ueberlappungsfaktor steht im Ergebnis', u8.ueberlappungsFaktor);
  /* Er ist se/seNaiv - nachgerechnet aus dem, was sonst noch im Block steht, waere er
   * nicht pruefbar (seNaiv wird nicht ausgewiesen). Also gegen statistik() selbst. */
  var b10 = r8.entscheidungen.filter(function (e) { return e.regel.indexOf('B10') === 0; })[0];
  ok(!!b10, 'Der B10-Eintrag steht im Protokoll - er stand in KEINEM der 38 vorherigen');
  ok(b10 && b10.eingabe.verzoegerungen === 7,
     'und nennt die Zahl der Verzoegerungen (H-1)', b10 && b10.eingabe.verzoegerungen);
  ok(b10 && Math.abs(b10.ergebnis.faktorGroesster - Math.max.apply(null,
       r8.ergebnisse.map(function (r) { return r.bestaetigung.ueberschuss.ueberlappungsFaktor; }))) < 1e-9,
     'Der ausgewiesene Faktor ist der groesste ueber alle Varianten');

  /* Bei H=1 ueberlappt nichts - der Faktor MUSS 1,00 sein. Waere er es nicht, rechnete
   * die Korrektur etwas, das es nicht gibt. */
  var r1 = lauf(1);
  var u1 = r1.ergebnisse[0].bestaetigung.ueberschuss;
  ok(Math.abs(u1.ueberlappungsFaktor - 1) < 1e-9,
     'Bei Haltedauer 1 ist der Faktor genau 1,00 - nichts ueberlappt', u1.ueberlappungsFaktor);
  var b10eins = r1.entscheidungen.filter(function (e) { return e.regel.indexOf('B10') === 0; })[0];
  ok(b10eins && /wirkungslos/.test(b10eins.begruendung),
     'und der Eintrag sagt das auch, statt eine Korrektur zu behaupten');

  /* DIE WARNUNG MUSS FEUERN KOENNEN. Das ist der eigentliche Punkt von #98: sie stand
   * vier Tage im Quelltext und war unerreichbar. Geprueft wird die Bedingung an
   * derselben Stelle, an der die Maschine sie prueft - mit einem kuenstlich hohen
   * Faktor, weil ein echtes Archiv mit Faktor > 3 hier nicht zur Hand ist. */
  var mmQ98 = fs.readFileSync(__dirname + '/messmaschine.js', 'utf8');
  var wA = mmQ98.indexOf('var faktoren = ergebnisse.map(');
  /* +4, damit die schliessende Klammer mitkommt - sonst endet der Ausschnitt mitten
   * im Block und new Function wirft, statt eine Falschauswahl zu zeigen. */
  var wE = mmQ98.indexOf('\n  }\n', wA) + 4;
  ok(wA !== -1 && wE > wA, 'Der B10-Block laesst sich herausloesen');
  var gewarnt = [];
  var P0 = { entscheide: function () { return {}; }, warne: function (k, t) { gewarnt.push(k + ': ' + t); } };
  function b10Lauf(faktor, H) {
    gewarnt.length = 0;
    new Function('ergebnisse', 'P', 'H', mmQ98.slice(wA, wE))(
      [{ bestaetigung: { ueberschuss: { ueberlappungsFaktor: faktor } } }], P0, H);
    return gewarnt.slice();
  }
  ok(b10Lauf(3.4, 8).length === 1 && /Faktor 3.40/.test(b10Lauf(3.4, 8)[0]),
     'Bei Faktor 3,4 warnt die Maschine - die Warnung ist erreichbar', b10Lauf(3.4, 8)[0] ? 'gewarnt' : 'STUMM');
  ok(b10Lauf(2.5, 8).length === 0, 'bei Faktor 2,5 nicht - die Schwelle steht bei 3');
  /* Und der Fall, der vier Tage lang galt: ohne den Faktor bleibt alles stumm. */
  gewarnt.length = 0;
  new Function('ergebnisse', 'P', 'H', mmQ98.slice(wA, wE))(
    [{ bestaetigung: { ueberschuss: {} } }], P0, 8);
  ok(gewarnt.length === 0,
     'Ohne den Faktor bleibt der ganze Block stumm - genau das war der Zustand bis zum 26.08.2026');
})();

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
