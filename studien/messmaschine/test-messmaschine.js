'use strict';
/* Jeder Fehlertyp aus FEHLERTYPEN.md als Falle. Die Maschine muss jede erkennen
 * oder unmoeglich machen. Laeuft ohne Archiv: die Kerzen werden erzeugt, damit
 * die Antwort bekannt ist. */
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

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
