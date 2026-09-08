'use strict';
/* TEST - Positivkontrolle und Sperrklinken des Messgeraets (VORREGISTRIERUNG §7, §11, §14, Nachtraege 1-2).
 *
 *   node test.js            alle Pruefungen; Rueckgabewert 1, wenn eine FEHLT
 *
 * Jede Zeile der Ausgabe ist 'OK ...', 'FEHLT ...' oder 'UEBERSPRUNGEN ...'. Geprueft wird der GRUND, nicht nur das
 * Ergebnis (wiki/fehlerformen.md): neben der Zahl aus der Zelle steht der Zaehler oder die Signalmenge, die sie erklaert.
 *
 * KUNST-REIHEN: eigener Zufall mit Saat (mulberry32), Tageskerzen auf ECHTEN Kalendertagen (K.kalender()): Irrfahrt P
 * (log-normal je Tag) plus unabhaengiges Mikrorauschen auf Eroeffnung und Schluss - KEINE Gerade. Das Mikrorauschen ist
 * kein Schmuck: ohne unabhaengiges Rauschen koennte die Gegenprobe "geteilter Kurs" den Scheineffekt nicht erzeugen.
 *
 * ARCHIV: nur lesen. AAPL 2024/2025 fuer die Kanal-Gleichheit; Yahoo-Kreuzprobe ueber die Pilot-Tagesdateien, wenn
 * vorhanden, sonst an AAPL 2024 allein. Das Mini-Archiv fuer die Fortsetzbarkeit liegt im Kratzordner
 * (MD_TEST_KRATZ oder os.tmpdir()/trendkanal-tage-test) - drei Jahresdateien werden dorthin KOPIERT, nie veraendert.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');
var K = require('./konfig.js');
var C = require('./kanaele.js');
var M = require('./messen.js');
var A = require('./auswerten.js');
var T = require('./tagesbalken.js');
var KP = require('./kreuzprobe.js');
var Q = require(path.join(K.REPO, 'quant.js'));
var Liquide = require(path.join(K.REPO, 'liquide.js'));

var KRATZ = process.env.MD_TEST_KRATZ || path.join(os.tmpdir(), 'trendkanal-tage-test');
fs.mkdirSync(KRATZ, { recursive: true });

/* ---------- Buchfuehrung ---------- */
var ERG = { ok: 0, fehlt: 0, ueber: 0 };
function ok(txt) { ERG.ok++; console.log('OK    ' + txt); }
function fehlt(txt) { ERG.fehlt++; console.log('FEHLT ' + txt); }
function ueber(txt) { ERG.ueber++; console.log('UEBERSPRUNGEN ' + txt); }
function pruefe(bed, txt) { if (bed) ok(txt); else fehlt(txt); return !!bed; }
function abschnitt(nr, name, fn) {
  console.log('\n== ' + nr + '. ' + name);
  var t0 = Date.now();
  try { fn(); } catch (e) { fehlt(nr + ' Ausnahme: ' + (e && e.stack || e)); }
  console.log('   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
}
function f4(x) { return (x === x && x != null) ? (+x).toFixed(4) : String(x); }
function f2(x) { return (x === x && x != null) ? (+x).toFixed(2) : String(x); }
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
function sd(a) { if (a.length < 2) return NaN; var m = mittel(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
function rngNeu(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function r4(x) { return Math.round(x * 10000) / 10000; }

/* ---------- Kunst-Reihen als Tagesdateien ---------- */
var KAL = K.kalender(), N_TAGE = KAL.tage.length;
/** Kunst-Tagesdatei: Irrfahrt mit Tagesstreuung sigma, Mikrorauschen sN auf O und C, Umsatz fuer die Klasse 50-250.
 *  o: {von, bis (Kalenderindex, ausschliesslich), start, sigma, sN, vol, lebend, reihe, drift} */
function kunstDatei(o) {
  var rng = rngNeu(o.saat), P = o.start || 100, D = { kennung: K.KONFIG_KENNUNG, reihe: o.reihe, ordner: o.reihe, lebend: o.lebend == null ? 1 : o.lebend, art: 'CS', gruppe: 'kunst', ende: null,
    massnahmenDatei: false, quelleJeJahr: {}, ausgelassen: [], verworfen: {}, tageOhneKalender: 0, tag: [], o: [], h: [], l: [], c1: [], c2: [], c3: [], v: [], nReg: [], roh: [], flags: [] };
  /* sN 0,7 %: Mikrorauschen von Schluss und Eroeffnung gegen den "wahren" Kurs (Uebernachtluecke, letzter Druck). Gemessen mit der
   * Sonde vom 08.09.: bei 0,4 % ist der Scheineffekt der E1-Gegenprobe in Tageskerzen zu klein, um sicher zu erscheinen (t -1,7),
   * bei 0,7 % erscheint er (t -4,8) - der Wert steht hier, damit die Gegenprobe rot werden KANN. */
  var sig = o.sigma == null ? 0.02 : o.sigma, sN = o.sN == null ? 0.007 : o.sN, vol = o.vol == null ? 1e6 : o.vol, drift = o.drift || 0;
  for (var t = o.von; t < o.bis; t++) {
    var eroeff = P * (1 + sN * gauss(rng));
    P = P * Math.exp(drift + sig * gauss(rng));
    var schluss = P * (1 + sN * gauss(rng));
    var hoch = Math.max(eroeff, schluss) * (1 + Math.abs(sig * gauss(rng)) / 2), tief = Math.min(eroeff, schluss) * (1 - Math.abs(sig * gauss(rng)) / 2);
    D.tag.push(t); D.o.push(r4(eroeff)); D.h.push(r4(hoch)); D.l.push(r4(tief)); D.c1.push(r4(schluss)); D.c2.push(r4(schluss)); D.c3.push(r4(schluss));
    D.v.push(Math.round(vol * (0.5 + rng()))); D.nReg.push(390); D.roh.push(1); D.flags.push(0);
  }
  return D;
}
function schreibeSatz(ordner, dateien, pilot) {
  fs.rmSync(ordner, { recursive: true, force: true }); fs.mkdirSync(ordner, { recursive: true });
  dateien.forEach(function (D) { fs.writeFileSync(path.join(ordner, D.reihe + '.json'), JSON.stringify(D)); });
  fs.writeFileSync(path.join(ordner, '_fortschritt.json'), JSON.stringify({ kennung: K.KONFIG_KENNUNG, pilot: !!pilot, reihen: dateien.length, beendet: 'vollstaendig' }));
}
function kopiereDatei(D) { var k = JSON.parse(JSON.stringify(D)); return k; }
/** Kunst-Satz A: N Reihen ueber das ganze Fenster plus SPY-Kunst. */
function kunstSatz(N, saat, von, bis) {
  var dateien = [kunstDatei({ reihe: 'SPY', saat: saat, von: von, bis: bis, start: 200, sigma: 0.01, sN: 0.001, vol: 1e8 })];
  for (var i = 0; i < N; i++) dateien.push(kunstDatei({ reihe: 'KUNST' + String(i).padStart(2, '0'), saat: saat + 7 * (i + 1), von: von, bis: bis, start: 50 + 100 * ((i * 37) % 11) / 11 }));
  return dateien;
}
/** K2/E2-Long-Signale einer Tagesdatei wie messeReihe (Klasse ab Tag 20, Cooldown 5), Rueckgabe [{i, ePos}]. */
function k2e2Signale(D) {
  var S = M.reiheAusDatei(D, 'c1', N_TAGE), aus = [], letzt = null;
  for (var i = 0; i < S.n; i++) {
    if (S.klasse[i] < 0 || i + 1 >= S.n) continue;
    var lin = C.k2Am(S, i); if (!lin || !lin.ausgebaut) continue;
    if (C.e2Signal(lin, S.c[i]) !== 1) continue;
    if (letzt != null && S.tag[i] - letzt < K.COOLDOWN_TAGE) continue;
    letzt = S.tag[i]; aus.push({ i: i, ePos: i + 1 });
  }
  return { S: S, signale: aus };
}
function zelleMittel(sp, art, kf, dirIdx, a) {
  var z = A.tagesreihe(sp, art, kf, dirIdx, a, 'alle', null), n = 0, sr = 0, su = 0; z.forEach(function (x) { n += x.n; sr += x.sr; su += x.su; });
  return { n: n, roh: n ? sr / n : NaN, u: n ? su / n : NaN, tage: z.length };
}
function messeSatz(ordnerTage, ordnerAus) {
  fs.rmSync(ordnerAus, { recursive: true, force: true });
  var F = M.lauf({ aus: ordnerAus, tage: [ordnerTage], schluss: 'c1', reihen: null });
  var sp = M.Speicher.lade(path.join(ordnerAus, '_zellen.bin'), N_TAGE, F.zellenStand);
  return { F: F, sp: sp };
}

/* ---------- AAPL aus dem Archiv (nur lesen) ---------- */
var AAPL = null;
function aapl() {
  if (AAPL) return AAPL;
  var pilotDatei = path.join(K.HIER, 'tage-pilot', 'AAPL.json');
  var D;
  if (fs.existsSync(pilotDatei)) { D = JSON.parse(fs.readFileSync(pilotDatei, 'utf8')); AAPL = { D: D, quelle: 'tage-pilot/AAPL.json' }; return AAPL; }
  var R = K.L.reihen().filter(function (r) { return r.reihe === 'AAPL'; })[0];
  D = { kennung: K.KONFIG_KENNUNG, reihe: 'AAPL', lebend: 1, tag: [], o: [], h: [], l: [], c1: [], c2: [], c3: [], v: [], nReg: [], roh: [], flags: [] };
  [2024, 2025].forEach(function (j) { var g = T.ladeJahrTage(R, j); if (!g.ok) throw new Error('AAPL/' + j + ': ' + g.grund); g.tage.forEach(function (x) { var idx = KAL.idx[x.tag]; if (idx == null) return; D.tag.push(idx); D.o.push(x.o); D.h.push(x.h); D.l.push(x.l); D.c1.push(x.c1); D.c2.push(x.c2); D.c3.push(x.c3); D.v.push(x.v); D.nReg.push(x.nReg); D.roh.push(g.rohFaktor(x.t0)); D.flags.push(x.flags); }); });
  AAPL = { D: D, quelle: 'Archiv AAPL 2024+2025' };
  return AAPL;
}

var SATZ = {};   // gemeinsame Kunst-Saetze

/* ====================================================================================== */
abschnitt(0, 'Selbstpruefung der Hilfen: Zellenlayout, Normalquantil, Kennung', function () {
  var rng = rngNeu(11), fehler = 0, gesehen = new Map();
  for (var q = 0; q < 3000; q++) {
    var art = Math.floor(rng() * K.ARTEN.length), kf = Math.floor(rng() * K.N_KONF), d = Math.floor(rng() * 2), a = Math.floor(rng() * K.N_A), t = Math.floor(rng() * N_TAGE), k = Math.floor(rng() * K.N_K), l = Math.floor(rng() * 2);
    var idx = K.zelle(N_TAGE, art, kf, d, a, t, k, l), tupel = [art, kf, d, a, t, k, l].join('/');
    /* zwei verschiedene Tupel auf derselben Zelle waeren der Fehler; dasselbe Tupel zweimal gezogen ist Zufall */
    if (idx < 0 || idx >= K.zellenZahl(N_TAGE) || (gesehen.has(idx) && gesehen.get(idx) !== tupel)) fehler++; gesehen.set(idx, tupel);
    /* Rueckrechnung */
    var r = idx, l2 = r % 2; r = (r - l2) / 2; var k2 = r % K.N_K; r = (r - k2) / K.N_K; var t2 = r % N_TAGE; r = (r - t2) / N_TAGE; var a2 = r % K.N_A; r = (r - a2) / K.N_A; var d2 = r % 2; r = (r - d2) / 2; var kf2 = r % K.N_KONF; var art2 = (r - kf2) / K.N_KONF;
    if (l2 !== l || k2 !== k || t2 !== t || a2 !== a || d2 !== d || kf2 !== kf || art2 !== art) fehler++;
  }
  pruefe(fehler === 0, '0a Zelle ist injektiv und rueckrechenbar (3000 Stichproben, ' + fehler + ' Fehler); Zellen ' + K.zellenZahl(N_TAGE) + ', Felder ' + K.FELDER.length);
  var tf = 0; for (var q2 = 0; q2 < 2000; q2++) { var t3 = Math.floor(rng() * N_TAGE), d3 = 1 + Math.floor(rng() * K.POT_MAX_DAUER), k3 = Math.floor(rng() * 4), l3 = Math.floor(rng() * 2); var i3 = K.topfZelle(N_TAGE, t3, d3, k3, l3); if (i3 < 0 || i3 >= K.topfZahl(N_TAGE)) tf++; }
  pruefe(tf === 0 && K.topfZelle(N_TAGE, N_TAGE - 1, K.POT_MAX_DAUER, 3, 1) === K.topfZahl(N_TAGE) - 1, '0b Topfzelle im Bereich, letzte Zelle = topfZahl-1');
  A.selbsttestQuantil();
  pruefe(Math.abs(A.zBonf(1) - 1.96) < 0.002 && Math.abs(A.zBonf(5) - 2.576) < 0.002 && Math.abs(A.zBonf(10) - 2.807) < 0.002, '0c z_Bonf(1/5/10) = ' + f2(A.zBonf(1)) + ' / ' + f2(A.zBonf(5)) + ' / ' + f2(A.zBonf(10)));
  pruefe(K.N_KONFIG_GESAMT === 64 && K.LINIEN.length === 4 && K.AUSSTIEGE.length === 4 && K.KONFIG_KENNUNG.indexOf('4x2x2x4') !== -1, '0d Familie 64 Konfigurationen (4 Linien x 2 Einstiege x 2 Richtungen x 4 Ausstiege), Kennung ' + K.KONFIG_KENNUNG);
  pruefe(KAL.tage.length === 2680 && KAL.bestaetigungAb === '2023-02-07' && KAL.nBes === 894 && KAL.tage[0] === '2016-01-04' && KAL.tage[2679] === '2026-08-31', '0e Kalender 2.680 Tage 2016-01-04..2026-08-31, Bestaetigung ab 2023-02-07 (894 Tage) - wie registriert');
});

/* ====================================================================================== */
abschnitt(1, 'KANAELE = App-Funktionen an echten Tageskerzen (AAPL)', function () {
  var D = aapl().D, S = M.reiheAusDatei(D, 'c1', N_TAGE), bars = C.barsVon(S);
  pruefe(S.n >= 400, '1a AAPL Tageskerzen: ' + S.n + ' Tage aus ' + aapl().quelle);
  /* K1 gegen Q.kanalSegmente auf demselben Fenster, Feld fuer Feld */
  var abw = 0, gepr = 0, ausgebaut = 0, rng = rngNeu(3);
  for (var q = 0; q < 60; q++) {
    var i = K.K1.fenster - 1 + Math.floor(rng() * (S.n - K.K1.fenster));
    var mein = C.k1Am(S, i), seg = Q.kanalSegmente(bars.slice(i - K.K1.fenster + 1, i + 1)), s = seg.length ? seg[seg.length - 1] : null;
    gepr++;
    if (!mein && (!s || s.bis !== K.K1.fenster - 1)) continue;
    if (!mein || !s) { abw++; continue; }
    if (mein.oben !== s.oben || mein.unten !== s.unten || mein.steigung !== s.steigung || mein.richtung !== s.trend || mein.guete !== s.guete || mein.n !== s.n || mein.bO !== s.beruehrungenOben || mein.bU !== s.beruehrungenUnten) abw++;
    if (mein.ausgebaut !== (s.guete >= 50 && s.n >= 20 && Math.min(s.beruehrungenOben, s.beruehrungenUnten) >= 3)) abw++;
    if (mein.ausgebaut) ausgebaut++;
  }
  pruefe(gepr === 60 && abw === 0 && ausgebaut > 0, '1b K1 = letzter Abschnitt von Q.kanalSegmente(250 Tage): ' + gepr + ' Tage geprueft, ' + abw + ' Abweichungen (oben/unten/steigung/trend/guete/n/Beruehrungen/ausgebaut), ' + ausgebaut + ' ausgebaut');
  /* K2 gegen Q.channelFit: Gerade gleich, Linien +-2 sd (Nachtrag 1) */
  var closes = Array.from(S.c), abw2 = 0, gepr2 = 0, linienGleichQuantil = 0;
  for (var q2 = 0; q2 < 200; q2++) {
    var i2 = 39 + Math.floor(rng() * (S.n - 39)), g = C.regression(S.c, i2, 40), f = Q.channelFit(closes, 40, i2);
    if (!g || !f) continue; gepr2++;
    if (Math.abs(g.b - f.b) > 1e-9 || Math.abs(g.sd - f.sd) > 1e-9 || Math.abs(g.mid - f.mid) > 1e-9 || Math.round(g.r2 * 1000) / 1000 !== f.r2 || Math.round(g.t * 10) / 10 !== f.t) abw2++;
    var lin = C.k2Am(S, i2); if (lin && Math.abs(lin.oben - f.upper) < 1e-9) linienGleichQuantil++;
    if (lin && (Math.abs(lin.oben - (g.mid + 2 * g.sd)) > 1e-9 || Math.abs(lin.unten - (g.mid - 2 * g.sd)) > 1e-9)) abw2++;
  }
  pruefe(gepr2 >= 150 && abw2 === 0, '1c K2: Steigung, sd, Mitte, R2 (3 Stellen), t (1 Stelle) = Q.channelFit an ' + gepr2 + ' Tagen (' + abw2 + ' Abweichungen); Linien bei mitte +-2 sd, nicht an den Quantilen der App (' + linienGleichQuantil + ' zufaellig gleiche)');
  /* K3 gegen Q.donchianSignal */
  var abw3 = 0, gepr3 = 0;
  [20, 55].forEach(function (N) {
    var D3 = C.k3Reihe(S, N);
    for (var q3 = 0; q3 < 100; q3++) {
      var i3 = N + Math.ceil(N / 2) + Math.floor(rng() * (S.n - N - Math.ceil(N / 2))), lin3 = C.k3Am(S, i3, D3), ds = Q.donchianSignal(bars.slice(0, i3 + 1), N, 0);
      gepr3++; if (!lin3 || lin3.oben !== ds.hoch || lin3.unten !== ds.tief) abw3++;
    }
  });
  pruefe(gepr3 === 200 && abw3 === 0, '1d K3: oben/unten = hoch/tief aus Q.donchianSignal(bars[0..i], N) fuer N = 20 und 55 (' + gepr3 + ' Tage, ' + abw3 + ' Abweichungen)');
  /* Kein Feld eines spaeteren Tages: Linie am Tag i ist gleich, ob bars[0..i] oder die ganze Reihe uebergeben wird */
  var Skurz = C.reiheAus({ tag: D.tag.slice(0, 300), o: D.o.slice(0, 300), h: D.h.slice(0, 300), l: D.l.slice(0, 300), c: D.c1.slice(0, 300), v: D.v.slice(0, 300) }, N_TAGE);
  var l1 = C.k1Am(S, 299), l1k = C.k1Am(Skurz, 299), l2 = C.k2Am(S, 299), l2k = C.k2Am(Skurz, 299), l3 = C.k3Am(S, 299, C.k3Reihe(S, 20)), l3k = C.k3Am(Skurz, 299, C.k3Reihe(Skurz, 20));
  pruefe(JSON.stringify(l1) === JSON.stringify(l1k) && JSON.stringify(l2) === JSON.stringify(l2k) && JSON.stringify(l3) === JSON.stringify(l3k), '1e Praefix-Probe: Linien am Tag 299 identisch mit ganzer Reihe und mit bars[0..299] (K1/K2/K3-20) - kein Blick nach vorn');
});

/* ====================================================================================== */
abschnitt(2, 'KLASSEN, HUERDEN, KALENDER gegen kosten.js, liquide.js, wiki/kosten.md', function () {
  var kostenJs = fs.readFileSync(path.join(K.REPO, 'kosten.js'), 'utf8');
  var block = (kostenJs.match(/UMSATZ_KLASSEN = \[[\s\S]*?\];/) || [''])[0], zeilen = [], re = /name: '([^']+)',\s*von: ([0-9.e]+),\s*bis: ([0-9.e]+|Infinity)/g, m;
  while ((m = re.exec(block))) zeilen.push({ name: m[1], von: m[2] === 'Infinity' ? Infinity : parseFloat(m[2]), bis: m[3] === 'Infinity' ? Infinity : parseFloat(m[3]) });
  var gleich = zeilen.length === K.KLASSEN.length && K.KLASSEN.every(function (k, i) { return zeilen[i].name === k.name && zeilen[i].von === k.von && zeilen[i].bis === k.bis; });
  pruefe(gleich, '2a K.KLASSEN-Grenzen = kosten.js UMSATZ_KLASSEN (' + zeilen.map(function (z) { return z.name + ' ' + z.von + '-' + z.bis; }).join(', ') + ')');
  pruefe(K.klasseIndex(4.99e6) === -1 && K.klasseIndex(NaN) === -1 && K.klasseIndex(5e6) === 0 && K.klasseIndex(50e6) === 1 && K.klasseIndex(250e6) === 2 && K.klasseIndex(1e9) === 3, '2b klasseIndex: -1 unter 5 Mio $ und bei NaN, Grenzen zur oberen Klasse');
  var probe = [[0, 10, 100], [1, 20, 100], [2, 30, 100], [3, 40, 100], [4, 1000, 1]];
  pruefe(Liquide.medianUmsatz(probe, 3, 4) === 3000 && K.UMSATZ_FENSTER === Liquide.KORB.fenster, '2c Klasse aus Liquide.medianUmsatz (sortiert[n>>1], Fenster ' + K.UMSATZ_FENSTER + ' = KORB.fenster ' + Liquide.KORB.fenster + '); Tag d nimmt d-20..d-1');
  /* Klasse je Tag in reiheAusDatei nimmt die 20 VORTAGE: Tag 20 hat Klasse, Tag 19 nicht; Aenderung am Tag selbst wirkt nicht */
  var D = kunstDatei({ reihe: 'KL', saat: 5, von: 0, bis: 60, vol: 1e6 }); D.v[20] = 1;                 // Tag 20 selbst ohne Umsatz -> Klasse am Tag 20 unveraendert
  var S = M.reiheAusDatei(D, 'c1', N_TAGE);
  pruefe(S.klasse[19] === -1 && S.klasse[20] === 1 && S.klasse[21] === 1, '2d reiheAusDatei: Klasse ab Tag 20 (Klasse ' + S.klasse[20] + ' = 50-250), Tag 19 ohne; Umsatz des Tages selbst zaehlt nicht');
  var wiki = fs.readFileSync(path.join(K.REPO, 'wiki', 'kosten.md'), 'utf8');
  var fehl = [];
  K.KLASSEN.forEach(function (k) {
    var re = new RegExp('\\|\\s*\\*\\*' + k.name.replace('-', '[-–]') + '\\*\\*\\s*\\|\\s*[0-9,]+\\s*\\|\\s*\\*\\*([0-9],[0-9]+)\\*\\*');
    var m = wiki.match(re); if (!m || Math.abs(parseFloat(m[1].replace(',', '.')) - k.huerde) > 1e-9) fehl.push(k.name + (m ? ' ' + m[1] : ' nicht gefunden'));
  });
  pruefe(fehl.length === 0, '2e Huerden = wiki/kosten.md "K ab 2021 (massgeblich)": ' + K.KLASSEN.map(function (k) { return k.name + ' ' + f4(k.huerde); }).join(', ') + (fehl.length ? ' - FEHL ' + fehl.join('; ') : ''));
  var fakt = [];
  K.KLASSEN.forEach(function (k) { var re = new RegExp('\\|\\s*' + k.name.replace('-', '[-–]') + '\\s*\\|\\s*[0-9,]+\\s*\\|\\s*\\*\\*[0-9,]+\\*\\*\\s*\\|\\s*[0-9,]+\\s*\\|\\s*([0-9],[0-9]+)\\s*×'); var m = wiki.match(re); if (!m || Math.abs(parseFloat(m[1].replace(',', '.')) - k.eroeffnungFaktor) > 1e-9) fakt.push(k.name); });
  pruefe(fakt.length === 0, '2f Eroeffnungsfaktoren = wiki/kosten.md "Eroeffnung/Mitte": ' + K.KLASSEN.map(function (k) { return k.eroeffnungFaktor; }).join(' / ') + (fakt.length ? ' - FEHL ' + fakt.join(', ') : ''));
  pruefe(K.BAND_PP === K.KLASSEN[3].huerde && K.JEDE_KLASSE_ZU === 0.0449, '2g Placebo-Schranke und "in jeder Klasse zu" = Huerde ab1000 (' + f4(K.BAND_PP) + ')');
  pruefe(K.SCHLUSS_WAHL === 'c1' && K.KREUZPROBE.gleichstand[0] === 'p95', '2h Schluss-Wahl c1 (Nachtrag 2), Gleichstand nach P95');
});

/* ====================================================================================== */
abschnitt(3, 'TAGESKERZEN gegen Yahoo an 20 Werten (§1.2, Nachtrag 2)', function () {
  var tp = path.join(K.HIER, 'tage-pilot'), tk = path.join(K.HIER, 'tage-kreuz');
  if (fs.existsSync(tp) && fs.existsSync(tk)) {
    var E = KP.lauf({ tage: [tp, tk], aus: null });
    pruefe(E.werte >= 20 && E.gesamt.tage > 30000, '3a Kreuzprobe ueber ' + E.werte + ' Werte, ' + E.gesamt.tage + ' Tage (Spruenge ' + E.gesamt.spruenge + ', 16:00-Kerze fehlt ' + E.gesamt.c16fehlt + ')');
    pruefe(E.wahl.kandidat === K.SCHLUSS_WAHL && E.wahl.toleranzSchluss && E.wahl.toleranzEroeffnung, '3b Wahl nach Regel = ' + E.wahl.kandidat + ' (konfig ' + K.SCHLUSS_WAHL + '): Schluss Median ' + f4(E.wahl.median) + ' P95 ' + f4(E.wahl.p95) + ' Pp, Eroeffnung Median ' + f4(E.gepoolt.o.median) + ' P95 ' + f4(E.gepoolt.o.p95) + ' - Toleranz Median <= 0,03, P95 <= 0,30');
    pruefe(E.gepoolt.c3.median > E.gepoolt.c1.median || E.gepoolt.c3.p95 > E.gepoolt.c1.p95, '3c der 15:59-Schluss (c3) liegt weiter vom amtlichen Schluss als c1 (Median ' + f4(E.gepoolt.c3.median) + ', P95 ' + f4(E.gepoolt.c3.p95) + ')');
  } else {
    var g = T.ladeJahrTage(K.L.reihen().filter(function (r) { return r.reihe === 'AAPL'; })[0], 2024), Y = KP.yahooTage('AAPL'), dO = [], dC = [];
    g.tage.forEach(function (x) { var y = Y[x.tag]; if (!y) return; dO.push(Math.abs(x.o / y[5] - 1) * 100); dC.push(Math.abs(x.c1 / y[1] - 1) * 100); });
    var kO = KP.kennzahlen(dO), kC = KP.kennzahlen(dC);
    pruefe(dO.length > 240 && kO.median <= 0.03 && kO.p95 <= 0.30 && kC.median <= 0.03 && kC.p95 <= 0.30, '3 (verkuerzt, ohne Pilot-Ordner) AAPL 2024 gegen Yahoo: O Median ' + f4(kO.median) + ' P95 ' + f4(kO.p95) + ', c1 Median ' + f4(kC.median) + ' P95 ' + f4(kC.p95) + ' (' + dO.length + ' Tage)');
  }
});

/* ====================================================================================== */
abschnitt(4, 'UEBERLAPPUNGS-BEWEIS (§7): naiv zu klein, Hansen-Hodrick trifft (Simulation ohne Kante)', function () {
  /* Zwei Welten. (A) Tagesrenditen mit GEMEINSAMEM Faktor (Markt 1 %/Tag) plus Eigenrauschen 2 %: die Tagesmittel ueberlappender
   * H-Tage-Fenster teilen den Faktor, Nachbartage korrelieren - hier MUSS die naive Rechnung zu klein sein (Erwartung
   * sqrt(2,67/(H+1,67)) bei ~2,4 Trades je Tag) und Hansen-Hodrick treffen. (B) nur Eigenrauschen, jeden Tag andere Reihen:
   * kaum Ueberlappungs-Korrelation, naiv ~ HH ~ wahr - nachrichtlich, weil die Topf-relative Hauptgroesse dieser Welt naeher
   * ist als Welt A; nTage/H bleibt die konservative Schranke, die realisierte Zahl steht im Bericht (n_eff HH). */
  var R = 400, N = 30, TAGE = 900, rng = rngNeu(2026);
  function welt(H, markt) {
    var mittelwerte = [], qNaiv = [], qHH = [], qNW = [], qBlock = [], hh0 = 0;
    for (var r = 0; r < R; r++) {
      var m = new Float64Array(TAGE + H); if (markt) for (var t0 = 0; t0 < TAGE + H; t0++) m[t0] = 0.01 * gauss(rng);
      var ret = new Array(N); for (var s = 0; s < N; s++) { ret[s] = new Float64Array(TAGE + H); for (var t = 0; t < TAGE + H; t++) ret[s][t] = m[t] + 0.02 * gauss(rng); }
      var paare = [];
      for (var t2 = 0; t2 < TAGE; t2++) {
        var su = 0, n = 0;
        for (var s2 = 0; s2 < N; s2++) { if (rng() < 0.08) { var x = 0; for (var k = 0; k < H; k++) x += ret[s2][t2 + k]; su += x * 100; n++; } }
        if (n) paare.push({ t: t2, x: su / n });
      }
      var mo = A.momente(paare, H);
      mittelwerte.push(mo.mittel); qNaiv.push(mo.seNaiv); if (mo.seHH != null) qHH.push(mo.seHH); else hh0++; qNW.push(mo.seNW); qBlock.push(mo.seBlock);
    }
    var wahr = sd(mittelwerte);
    return { wahr: wahr, naiv: mittel(qNaiv) / wahr, hh: mittel(qHH) / wahr, nw: mittel(qNW) / wahr, block: mittel(qBlock) / wahr, hh0: hh0 };
  }
  [5, 10, 20].forEach(function (H) {
    var a = welt(H, true), soll = Math.sqrt(2.67 / (H + 1.67));
    pruefe(a.naiv < soll + 0.1 && a.naiv < 0.8, '4a H=' + H + ' mit Marktfaktor: naive Tagesrechnung/wahr = ' + f2(a.naiv) + ' (erwartet ~' + f2(soll) + ', Schranke ' + f2(soll + 0.1) + ') - zu klein bei ueberlappenden Fenstern');
    pruefe(a.hh > 0.88 && a.hh < 1.12 && a.hh0 === 0, '4b H=' + H + ' mit Marktfaktor: Hansen-Hodrick/wahr = ' + f2(a.hh) + ' (in [0,88; 1,12], ' + a.hh0 + ' mal HH<=0) - trifft die Wahrheit aus ' + R + ' Wiederholungen (wahr ' + f4(a.wahr) + ' Pp)');
    pruefe(a.block > a.naiv && a.block < 1.0 && a.nw < a.hh, '4c H=' + H + ' mit Marktfaktor: Block-H/wahr = ' + f2(a.block) + ' und Newey-West/wahr = ' + f2(a.nw) + ' liegen zwischen naiv und HH, beide zu tief - deshalb nicht primaer');
    var b = welt(H, false);
    pruefe(b.hh > 0.88 && b.hh < 1.12, '4d H=' + H + ' nur Eigenrauschen (jeden Tag andere Reihen): Hansen-Hodrick/wahr = ' + f2(b.hh) + ' trifft ebenfalls; naiv/wahr ' + f2(b.naiv) + ' (nachrichtlich: die Ueberlappung kostet hier wenig)');
  });
});

/* ====================================================================================== */
abschnitt(5, 'POSITIVKONTROLLE (§11e): gepflanzte Kante in der Ausstiegs-Eroeffnung wird in Groesse und Richtung wiedergefunden', function () {
  var VON = KAL.idx['2021-01-04'], BIS = N_TAGE, NREIHEN = 40, DELTA = 0.02;
  var satz = kunstSatz(NREIHEN, 101, VON, BIS); SATZ.a = satz;
  var ordA = path.join(KRATZ, 'tage-a'), ausA = path.join(KRATZ, 'mess-a');
  schreibeSatz(ordA, satz, true);
  /* Signale K2/E2 long je Reihe (eigene Nachrechnung), Pflanzung nur, wo die Ausstiegs-Eroeffnung keinen anderen Trade derselben Regel beruehrt */
  var gepflanzt = 0, signaleGesamt = 0, uebersprungen = 0, satzB = satz.map(kopiereDatei);
  satzB.forEach(function (D, di) {
    if (D.reihe === 'SPY') return;
    var sg = k2e2Signale(D), belegt = new Set();
    sg.signale.forEach(function (s) { belegt.add(s.ePos); belegt.add(s.ePos + 5); belegt.add(s.ePos + 10); belegt.add(s.ePos + 20); });
    signaleGesamt += sg.signale.length;
    var geplant = new Set();
    sg.signale.forEach(function (s) {
      var ex = s.ePos + 5; if (ex >= D.tag.length) return;
      var stoert = false; sg.signale.forEach(function (o) { if (o === s) return; if (o.ePos === ex || o.ePos + 5 === ex || o.ePos + 10 === ex || o.ePos + 20 === ex) stoert = true; });
      if (stoert || geplant.has(ex)) { uebersprungen++; return; }
      geplant.add(ex);
    });
    geplant.forEach(function (ex) { D.o[ex] = r4(D.o[ex] * (1 + DELTA)); if (D.h[ex] < D.o[ex]) D.h[ex] = D.o[ex]; gepflanzt++; });
  });
  var ordB = path.join(KRATZ, 'tage-b'), ausB = path.join(KRATZ, 'mess-b');
  schreibeSatz(ordB, satzB, true);
  pruefe(signaleGesamt >= 300 && gepflanzt >= 0.5 * signaleGesamt, '5a Kunst-Satz: ' + NREIHEN + ' Reihen ab 2021, ' + signaleGesamt + ' K2/E2-Long-Signale (eigene Nachrechnung), ' + gepflanzt + ' Ausstiegs-Eroeffnungen gepflanzt (+' + (DELTA * 100) + ' %), ' + uebersprungen + ' uebersprungen (Ausstieg beruehrt anderen Trade)');
  var mA = messeSatz(ordA, ausA), mB = messeSatz(ordB, ausB);
  SATZ.mA = mA;
  var kf = K.konfIndex(1, 1);
  var sigA = 0, sigB = 0; Object.keys(mA.F.signale).forEach(function (r) { sigA += mA.F.signale[r].sig[kf * 2]; }); Object.keys(mB.F.signale).forEach(function (r) { sigB += mB.F.signale[r].sig[kf * 2]; });
  pruefe(sigA === signaleGesamt && sigB === sigA, '5b messen.js zaehlt K2/E2 long: ' + sigA + ' = eigene Nachrechnung ' + signaleGesamt + '; nach der Pflanzung unveraendert ' + sigB + ' (Signale rechnen auf Schluessen)');
  var zA = zelleMittel(mA.sp, 0, kf, 0, 0), zB = zelleMittel(mB.sp, 0, kf, 0, 0);
  var anteil = gepflanzt / zA.n, sollRoh = 100 * DELTA * anteil;
  pruefe(zA.n === zB.n && zA.n > 0 && Math.abs((zB.roh - zA.roh) - sollRoh) < 0.05 * sollRoh + 0.01, '5c Roh-Mittel H5 steigt um ' + f4(zB.roh - zA.roh) + ' Pp bei Soll ' + f4(sollRoh) + ' (= 100·delta·Anteil gepflanzt ' + f2(anteil) + '; n ' + zA.n + ' Trades, ohne Pflanzung ' + f4(zA.roh) + ')');
  var dU = zB.u - zA.u, dR = zB.roh - zA.roh;
  pruefe(dU > 0.88 * dR && dU <= 1.0 * dR + 1e-9, '5d Ueberschuss gegen den Topf steigt um ' + f4(dU) + ' Pp = ' + f2(dU / dR) + ' x roh (erwartet 1 - 1/N_zulaessig ~ ' + f2(1 - 1 / NREIHEN) + ': die gepflanzte Reihe ist selbst im Topf)');
  var z10A = zelleMittel(mA.sp, 0, kf, 0, 1), z10B = zelleMittel(mB.sp, 0, kf, 0, 1), z20A = zelleMittel(mA.sp, 0, kf, 0, 2), z20B = zelleMittel(mB.sp, 0, kf, 0, 2);
  pruefe(Math.abs(z10B.roh - z10A.roh) < 0.02 && Math.abs(z20B.roh - z20A.roh) < 0.02, '5e Gegenprobe: die Pflanzung sitzt nur in der H5-Ausstiegskerze - H10 ' + f4(z10B.roh - z10A.roh) + ', H20 ' + f4(z20B.roh - z20A.roh) + ' Pp Aenderung');
  var kurz = zelleMittel(mA.sp, 0, K.konfIndex(1, 1), 1, 0);
  pruefe(Math.abs(zA.roh) < 0.3 && Math.abs(zA.u) < 0.3, '5f ohne Pflanzung nahe null: roh ' + f4(zA.roh) + ', Ueberschuss ' + f4(zA.u) + ' Pp (n ' + zA.n + '; Short-Seite n ' + kurz.n + ')');
});

/* ====================================================================================== */
abschnitt(6, 'PLACEBO NULL auf Zufallsreihen, Bestaetigung kann ablehnen, Kontrollen der Auswertung', function () {
  if (!SATZ.mA) { fehlt('6 kein Lauf aus Pruefung 5'); return; }
  var E = A.auswerte(SATZ.mA.sp, SATZ.mA.F, KAL), Z = SATZ.mA.F.zaehler;
  var gefallen = E.kontrollen.filter(function (k) { return k.placebo.nTage > 0 && !(Math.abs(k.placebo.t) < 3); });
  pruefe(E.kontrollen.length === 8 && gefallen.length === 0, '6a Placebo A gepoolt je (Einstieg, Ausstieg): |t| < 3 ueberall - ' + E.kontrollen.map(function (k) { return k.einstieg + '/' + k.ausstieg + ' ' + f4(k.placebo.mittel) + ' (t ' + f2(k.placebo.t) + ', n ' + k.placebo.nSig + ')'; }).join('; '));
  var kandT = E.konf.map(function (c) { var t = c.alle.ent.uNetto.t; return t == null ? 0 : Math.abs(t); }), ueber3 = kandT.filter(function (t) { return t > 3; }).length, ueber4 = kandT.filter(function (t) { return t > 4; }).length;
  var kandBrutto = E.konf.filter(function (c) { return c.alle.ent.uBrutto.t != null && Math.abs(c.alle.ent.uBrutto.t) > 3; }).length;
  pruefe(ueber4 === 0 && kandBrutto <= 3, '6b Kandidaten auf Zufallsreihen: Ueberschuss brutto |t| > 3 bei ' + kandBrutto + ' von 64 (netto > 4 bei ' + ueber4 + ', > 3 bei ' + ueber3 + ' - netto ist wegen der Huerde negativ)');
  pruefe(Z.e1Abgelehnt > 0 && Z.e1Abgelehnt < Z.e1Kandidaten, '6c Bestaetigung kann ablehnen: ' + Z.e1Abgelehnt + ' von ' + Z.e1Kandidaten + ' E1-Kandidaten abgelehnt (' + (100 * Z.e1Abgelehnt / Z.e1Kandidaten).toFixed(0) + ' %)');
  pruefe(Z.cooldown > 0 && Z.placeboAGezogen === Z.signale && Z.placeboBGezogen + Z.placeboBOhnePartner === Z.signale, '6d Zaehler: Cooldown ' + Z.cooldown + ', Placebo A gezogen ' + Z.placeboAGezogen + ' = Signale ' + Z.signale + ', Placebo B ' + Z.placeboBGezogen + ' + ohne Partner ' + Z.placeboBOhnePartner + ' = Signale');
  var eins = E.konf.filter(function (c) { return c.einstieg === 'E1' && c.richtung === 'long' && c.ausstieg === 'H5'; });
  pruefe(eins.every(function (c) { return c.alle.bes.nTage > 0 && c.alle.ent.nTage > 0 && c.nEffB > 0 && c.alle.bes.uNetto.seHH != null; }), '6e jede E1/long/H5-Konfiguration hat Entdeckungs- und Bestaetigungstage, n_eff und HH-se (' + eins.map(function (c) { return c.linie + ' ' + c.alle.bes.nTage + 'T/' + f2(c.nEffB); }).join(', ') + ')');
  /* Tor 1 ist ein Ranking ohne Signifikanzanspruch: auf 64 Zufallskonfigurationen eines kleinen Satzes kann eine durchrutschen;
   * belegt oder handelbar darf keine werden. */
  pruefe(E.zahlen.k1 <= 2 && E.zahlen.handelbar === 0 && E.zahlen.urteile.belegt === 0, '6f auf Zufallsreihen: Tor 1 bei ' + E.zahlen.k1 + ' von 64 (<= 2 erlaubt), belegt ' + E.zahlen.urteile.belegt + ', handelbar ' + E.zahlen.handelbar);
  /* Regime: SPY-Kunst ueber/unter EMA200 beide besetzt; Regime-Variante hat weniger Trades als alle */
  var rt = SATZ.mA.F.regimeTage, cR = E.konf[0], unbekanntSoll = KAL.idx['2021-01-04'] + K.EMA_N;   // Tage vor dem Kunst-Satz plus EMA-Vorlauf
  pruefe(rt.ueber > 0 && rt.unter > 0 && rt.unbekannt === unbekanntSoll && cR.alle.regime.bes.nSig <= cR.alle.bes.nSig && cR.alle.regime.bes.nSig > 0, '6g Regime aus SPY-EMA200: ' + rt.ueber + ' ueber, ' + rt.unter + ' unter, ' + rt.unbekannt + ' unbekannt (= ' + KAL.idx['2021-01-04'] + ' Tage vor dem Satz + Vorlauf ' + K.EMA_N + '); Regime-Variante ' + cR.alle.regime.bes.nSig + ' <= alle ' + cR.alle.bes.nSig + ' Trades');
  /* Bericht: Pilot-Name */
  var md = A.markdown(E, SATZ.mA.F, [{ ordner: 'kunst', reihen: 40, dateien: 41, pilot: true, beendet: 'vollstaendig', schluss: 'c1' }], KAL, true);
  pruefe(/^# PILOT-ERGEBNIS/.test(md) && md.indexOf('Nichts hier ist ein Befund') !== -1 && md.indexOf('## 3. Kandidatentafel') !== -1, '6h Bericht auf Kunstdaten heisst PILOT-ERGEBNIS und traegt die Warnung');
});

/* ====================================================================================== */
abschnitt(7, 'GEGENPROBE GETEILTER KURS (§4): Signalkurs als Einstieg erzeugt den Scheineffekt, richtiger Einstieg nicht', function () {
  if (!SATZ.a) { fehlt('7 kein Kunst-Satz'); return; }
  /* Gepaart je Trade: d = r(FALSCH) - r(RICHTIG); das Vorzeichen und der gepaarte t-Wert sind die Pruefung, nicht eine feste Groesse
   * (Sonde 08.09.: bei sN 0,7 % E2 +0,29 Pp (t 9), E1 mit Bestaetigungsschluss -0,14 (t -5); der Signalschluss c_i waere fuer E1
   * die falsche Gegenprobe - dort dominiert die Bestaetigungs-Auslese und die Differenz wird positiv). */
  /* Eigener, groesserer Satz (120 Reihen, ganzes Fenster; nur K2/K3, kein K1 - billig): der E1-Effekt ist in Tageskerzen klein
   * (~ -0,1 Pp) und braucht einige tausend Trades, damit das Vorzeichen sicher erscheint. */
  var richtigE2 = [], dE2 = [], richtigE1 = [], dE1 = [], satz7 = [];
  for (var s7 = 0; s7 < 120; s7++) satz7.push(kunstDatei({ reihe: 'G' + s7, saat: 900 + 13 * s7, von: 0, bis: N_TAGE, start: 40 + 120 * ((s7 * 31) % 17) / 17 }));
  satz7.forEach(function (D) {
    var S = M.reiheAusDatei(D, 'c1', N_TAGE), D20 = C.k3Reihe(S, 20), letztE2 = null, letztE1 = null;
    for (var i = 0; i < S.n - 7; i++) {
      if (S.klasse[i] < 0) continue;
      var lin = C.k2Am(S, i);
      if (lin && lin.ausgebaut && C.e2Signal(lin, S.c[i]) === 1 && (letztE2 == null || S.tag[i] - letztE2 >= 5)) {
        letztE2 = S.tag[i]; var r2 = (S.o[i + 6] - S.o[i + 1]) / S.o[i + 1] * 100; richtigE2.push(r2); dE2.push((S.o[i + 6] - S.c[i]) / S.c[i] * 100 - r2);
      }
      var l3 = C.k3Am(S, i, D20);
      if (l3 && C.e1Signal(l3, S.c[i]) === 1 && C.e1Bestaetigt(l3, i, S.c[i + 1], 1, D20) && (letztE1 == null || S.tag[i] - letztE1 >= 5)) {
        letztE1 = S.tag[i]; var r1 = (S.o[i + 7] - S.o[i + 2]) / S.o[i + 2] * 100; richtigE1.push(r1); dE1.push((S.o[i + 7] - S.c[i + 1]) / S.c[i + 1] * 100 - r1);
      }
    }
  });
  function tPaar(d) { return mittel(d) / (sd(d) / Math.sqrt(d.length)); }
  var mR2 = mittel(richtigE2), mR1 = mittel(richtigE1), m2 = mittel(dE2), t2 = tPaar(dE2), m1 = mittel(dE1), t1 = tPaar(dE1);
  pruefe(dE2.length >= 200 && m2 > 0 && t2 > 3, '7a E2 (Ruecklauf, n ' + dE2.length + '): Einstieg zum Signalschluss statt Eroeffnung i+1 hebt den Ertrag um ' + f4(m2) + ' Pp (gepaartes t ' + f2(t2) + ') - Scheineffekt positiv, wie behauptet');
  pruefe(dE1.length >= 100 && m1 < 0 && t1 < -3, '7b E1 (Ausbruch, n ' + dE1.length + '): Einstieg zum Bestaetigungsschluss statt Eroeffnung i+2 senkt den Ertrag um ' + f4(m1) + ' Pp (gepaartes t ' + f2(t1) + ') - Scheineffekt negativ');
  pruefe(Math.abs(mR2) < 0.4 && Math.abs(mR1) < 0.4, '7c RICHTIG nahe null auf Zufallsreihen: E2 ' + f4(mR2) + ', E1 ' + f4(mR1) + ' Pp');
});

/* ====================================================================================== */
abschnitt(8, 'DELISTING-AUSSTIEG, ZENSUR, MASSNAHMENFENSTER, KLASSE < 5 Mio $ (§2, §5)', function () {
  var VON = KAL.idx['2024-01-02'], ENDE = KAL.idx['2025-06-02'];
  var tot = kunstDatei({ reihe: 'TOT', saat: 77, von: VON, bis: ENDE, lebend: 0 }), St = M.reiheAusDatei(tot, 'c1', N_TAGE);
  var e = C.ertragLong(St, St.n - 3, C.festAusstieg(St, St.n - 3, 5), St.lebend);
  pruefe(e && e.delist && e.ausPos === St.n - 1 && Math.abs(e.r - (St.c[St.n - 1] - St.o[St.n - 3]) / St.o[St.n - 3] * 100) < 1e-9 && e.dauer === 2, '8a nicht lebende Reihe endet vor dem Ausstieg: Ausstieg = letzter Schluss (delist, Dauer ' + (e && e.dauer) + ', r ' + f4(e && e.r) + ' Pp)');
  var leb = kunstDatei({ reihe: 'LEB', saat: 78, von: VON, bis: N_TAGE, lebend: 1 }), Sl = M.reiheAusDatei(leb, 'c1', N_TAGE);
  pruefe(C.ertragLong(Sl, Sl.n - 3, C.festAusstieg(Sl, Sl.n - 3, 5), Sl.lebend) === null && C.ertragLong(Sl, Sl.n - 8, C.festAusstieg(Sl, Sl.n - 8, 5), Sl.lebend) !== null, '8b lebende Reihe am Fensterende: kein Ausstieg = keine Beobachtung (zensiert), fruehere Trades beobachtet');
  /* Topf mit derselben Regel: Delisting-Rendite fuer alle Dauern jenseits des Endes */
  var sp = new M.Speicher(N_TAGE), Z = M.leererZaehler(); M.topfUndListen([St, Sl], sp, N_TAGE, Z);
  var p = St.n - 3, tag = St.tag[p], k = St.klasse[p], i5 = K.topfZelle(N_TAGE, tag, 5, k, 0), i40 = K.topfZelle(N_TAGE, tag, 40, k, 0), i1 = K.topfZelle(N_TAGE, tag, 1, k, 0);
  pruefe(sp.tn[i5] === 1 && Math.abs(sp.ts[i5] - e.r) < 1e-9 && sp.tn[i40] === 1 && Math.abs(sp.ts[i40] - e.r) < 1e-9 && sp.tn[i1] === 1 && Math.abs(sp.ts[i1] - (St.o[p + 1] - St.o[p]) / St.o[p] * 100) < 1e-9, '8c Topf folgt der Delisting-Regel: Dauer 1 = naechste Eroeffnung, Dauer 5 und 40 = letzter Schluss (' + f4(sp.ts[i5]) + ' Pp)');
  var iL = K.topfZelle(N_TAGE, Sl.tag[Sl.n - 3], 5, Sl.klasse[Sl.n - 3], 1);
  pruefe(sp.tn[iL] === 0, '8d Topf der lebenden Reihe am Fensterende: zensiert, keine Zelle (n ' + sp.tn[iL] + ')');
  /* Massnahmenfenster: Signaltag und Einstiegstag gesperrt; Klasse < 5 Mio $: nichts */
  var mass = kunstDatei({ reihe: 'MASS', saat: 79, von: VON, bis: N_TAGE }); for (var q = 0; q < mass.tag.length; q++) mass.flags[q] = K.FLAG.massnahmen;
  var Sm = M.reiheAusDatei(mass, 'c1', N_TAGE), spm = new M.Speicher(N_TAGE), Zm = M.leererZaehler(); var lm = M.topfUndListen([Sm], spm, N_TAGE, Zm);
  var stm = M.messeReihe(Sm, 0, { nTage: N_TAGE, sp: spm, Z: Zm, reihen: [Sm], spy: Sl, regime: new Int8Array(N_TAGE).fill(-1), zul: lm.zul, zulK: lm.zulK });
  pruefe(Zm.reihenTageZulaessig === 0 && Zm.reihenTageMassnahmen === Sm.n - K.UMSATZ_FENSTER && Zm.reihenTageOhneKlasse === K.UMSATZ_FENSTER && stm.signale.every(function (x) { return x === 0; }), '8e Massnahmenfenster an jedem Tag: 0 zulaessige Reihen-Tage, ' + Zm.reihenTageMassnahmen + ' im Fenster gezaehlt (+ ' + Zm.reihenTageOhneKlasse + ' Vorlauftage ohne Klasse), 0 Signale');
  var duenn = kunstDatei({ reihe: 'DUENN', saat: 80, von: VON, bis: N_TAGE, vol: 1000 }), Sd = M.reiheAusDatei(duenn, 'c1', N_TAGE);
  var ohneKlasse = 0; for (var q2 = 0; q2 < Sd.n; q2++) if (Sd.klasse[q2] < 0) ohneKlasse++;
  pruefe(ohneKlasse === Sd.n, '8f Umsatz unter 5 Mio $ an jedem Tag: ' + ohneKlasse + ' von ' + Sd.n + ' Tagen ohne Klasse - wird nicht gewertet');
  /* Cooldown und Kanalbruch */
  var b = C.bruchAusstieg(Sl, 60, 61, 1, { art: 'K2', oben: 1e9, unten: 1e-9, steigung: 0 }, null, 60);
  pruefe(!b.gebrochen && b.pos >= 0 && Sl.tag[b.pos] - Sl.tag[61] >= 60 && Sl.tag[b.pos] - Sl.tag[61] <= 61, '8g Kanalbruch ohne Bruch: Kappung am Tag e+60 (Dauer ' + (Sl.tag[b.pos] - Sl.tag[61]) + ')');
  var b2 = C.bruchAusstieg(Sl, 60, 61, 1, { art: 'K2', oben: 1e9, unten: 1e9, steigung: 0 }, null, 60);
  pruefe(b2.gebrochen && b2.bruchPos === 61 && b2.pos === 62, '8h Kanalbruch am Einstiegstag (Schluss unter der Linie): Ausstieg zur Eroeffnung des Folgetags (pos ' + b2.pos + ')');
});

/* ====================================================================================== */
abschnitt(9, 'FORTSETZBARKEIT der Aggregation (tagesbalken.js) in Kindprozessen auf einem Mini-Archiv', function () {
  var mini = path.join(KRATZ, 'archiv'), roh = path.join(mini, 'alpaca1m');
  fs.rmSync(mini, { recursive: true, force: true }); fs.mkdirSync(path.join(mini, 'alpaca1m-bereinigt'), { recursive: true }); fs.mkdirSync(path.join(mini, 'alpaca-massnahmen'), { recursive: true });
  var quelle = K.ORTE.roh(), lz = JSON.parse(fs.readFileSync(path.join(quelle, '_lebenszeit.json'), 'utf8')), sy = JSON.parse(fs.readFileSync(path.join(quelle, '_symbole.json'), 'utf8'));
  var syms = ['SPY', 'AAPL', 'MSFT'], werte = {};
  syms.forEach(function (s) { fs.mkdirSync(path.join(roh, s), { recursive: true }); fs.copyFileSync(path.join(quelle, s, '2024.json'), path.join(roh, s, '2024.json')); var e = JSON.parse(JSON.stringify(lz.werte[s])); e.jahre = [2024]; werte[s] = e; var mp = path.join(K.ORTE.massnahmen(), s + '.json'); if (fs.existsSync(mp)) fs.copyFileSync(mp, path.join(mini, 'alpaca-massnahmen', s + '.json')); });
  fs.writeFileSync(path.join(roh, '_lebenszeit.json'), JSON.stringify({ stand: lz.stand, werte: werte }));
  fs.writeFileSync(path.join(roh, '_symbole.json'), JSON.stringify({ stand: sy.stand, gruppe: { SPY: 'etf', AAPL: 'universum', MSFT: 'universum' }, ordner: {} }));
  fs.copyFileSync(path.join(quelle, '_kalender.json'), path.join(roh, '_kalender.json'));
  var env = Object.assign({}, process.env, { MD_ALPACA_WURZEL: mini }), skript = path.join(K.HIER, 'tagesbalken.js');
  function lauf(args) { var r = cp.spawnSync(process.execPath, [skript].concat(args), { env: env, encoding: 'utf8', timeout: 120000 }); return { status: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
  var tA = path.join(KRATZ, 't-a'), tC = path.join(KRATZ, 't-c'), tD = path.join(KRATZ, 't-d');
  [tA, tC, tD].forEach(function (d) { fs.rmSync(d, { recursive: true, force: true }); });
  var ra = lauf(['--aus', tA, '--max', '1']), Fa = fs.existsSync(path.join(tA, '_fortschritt.json')) ? JSON.parse(fs.readFileSync(path.join(tA, '_fortschritt.json'), 'utf8')) : null;
  pruefe(ra.status === 0 && Fa && Fa.reihen === 1 && Fa.beendet === 'max erreicht' && fs.existsSync(path.join(tA, 'SPY.json')) && !fs.existsSync(path.join(tA, 'AAPL.json')), '9a Lauf (a) --max 1: eine Reihe (SPY zuerst), beendet "' + (Fa && Fa.beendet) + '", Rueckgabe ' + ra.status);
  var rb = lauf(['--aus', tA]), Fb = JSON.parse(fs.readFileSync(path.join(tA, '_fortschritt.json'), 'utf8'));
  pruefe(rb.status === 0 && Fb.reihen === 3 && Fb.beendet === 'vollstaendig' && /FORTSETZUNG: 1 Reihen erledigt/.test(rb.out) && Fb.begonnen === Fa.begonnen, '9b Lauf (b) Fortsetzung: protokolliert FORTSETZUNG mit 1 erledigten, danach ' + Fb.reihen + ' Reihen, beendet "' + Fb.beendet + '", Beginn-Stempel behalten');
  var rc = lauf(['--aus', tC]), gleich = syms.every(function (s) { return fs.readFileSync(path.join(tA, s + '.json')).equals(fs.readFileSync(path.join(tC, s + '.json'))); });
  pruefe(rc.status === 0 && gleich, '9c Lauf (c) am Stueck: alle drei Tagesdateien byteidentisch mit (a)+(b)');
  var D = JSON.parse(fs.readFileSync(path.join(tC, 'AAPL.json'), 'utf8'));
  pruefe(D.tag.length === 252 && D.kennung === K.KONFIG_KENNUNG && D.quelleJeJahr['2024'] === 'roh' && D.o[0] === 187.17 && D.c1[0] === 185.51 && D.c2[0] === 185.6 && D.c3[0] === 185.525 && D.v[0] === 76174064, '9d AAPL/2024 Tagesdatei: 252 Tage, 2024-01-02 O 187,17 / C1 185,51 / C2 185,60 / C3 185,525 / V 76.174.064 (Formatprobe §0.1)');
  fs.mkdirSync(tD, { recursive: true }); fs.writeFileSync(path.join(tD, '_fortschritt.json'), JSON.stringify({ kennung: 'fremd/v0', erledigt: {} }));
  var rd = lauf(['--aus', tD]);
  pruefe(rd.status === 4 && /anderen Konfiguration/.test(rd.out), '9e fremde Kennung im Ausgabeordner: Abbruch mit Rueckgabe 4');
  var re = lauf(['--aus', tD, '--neu']);
  pruefe(re.status === 0 && /NEU: vorhandener Fortschritt/.test(re.out), '9f --neu ueberschreibt und sagt es');
  /* messen.js verweigert fremde Kennung und fehlendes SPY */
  var tE = path.join(KRATZ, 't-e'); fs.rmSync(tE, { recursive: true, force: true }); fs.mkdirSync(tE); fs.copyFileSync(path.join(tC, 'AAPL.json'), path.join(tE, 'AAPL.json'));
  var rm = cp.spawnSync(process.execPath, [path.join(K.HIER, 'messen.js'), '--aus', path.join(KRATZ, 'mess-e'), '--tage', tE], { env: env, encoding: 'utf8', timeout: 120000 });
  pruefe(rm.status === 3 && /SPY\.json fehlt/.test((rm.stdout || '') + (rm.stderr || '')), '9g messen.js ohne SPY.json: Abbruch mit Rueckgabe 3 (keine Marktreihe)');
});

/* ====================================================================================== */
abschnitt(10, 'SPERRKLINKEN: kein Netz, kein Schluessel, kein Schreiben ins Archiv, kein Yahoo als Messbasis', function () {
  var dateien = ['konfig.js', 'kanaele.js', 'tagesbalken.js', 'messen.js', 'auswerten.js', 'kreuzprobe.js'].map(function (n) { return { n: n, q: fs.readFileSync(path.join(K.HIER, n), 'utf8') }; });
  var netz = dateien.filter(function (d) { return /require\(['"](https?|net|dgram)['"]\)|fetch\(/.test(d.q); });
  pruefe(netz.length === 0, '10a kein Netzmodul, kein fetch in ' + dateien.length + ' Dateien' + (netz.length ? ' - ' + netz.map(function (d) { return d.n; }).join(', ') : ''));
  var schluessel = dateien.filter(function (d) { return /ALPACA_KEY|ALPACA_SECRET|APCA[-_]API|process\.env\.[A-Z_]*(KEY|SECRET|TOKEN)/.test(d.q); });
  pruefe(schluessel.length === 0, '10b kein Schluessel-Zugriff');
  var schreiben = dateien.filter(function (d) { return /writeFileSync\([^)]*(ORTE\.|archivWurzel|Markt-Dashboard-Archiv)/.test(d.q); });
  pruefe(schreiben.length === 0, '10c kein writeFileSync auf das Archiv (Orte/Archivwurzel)');
  var yahooMess = /archiv1d/.test(dateien.filter(function (d) { return d.n === 'messen.js' || d.n === 'kanaele.js' || d.n === 'tagesbalken.js'; }).map(function (d) { return d.q; }).join(''));
  pruefe(!yahooMess, '10d archiv1d (Yahoo) kommt in messen/kanaele/tagesbalken nicht vor - nur in kreuzprobe.js');
  pruefe(/pilot \? 'PILOT-ERGEBNIS' : 'ERGEBNIS'/.test(dateien[4].q) && /beendet !== 'vollstaendig'/.test(dateien[4].q), '10e auswerten.js nennt die Datei nach der Herkunft (pilot oder unvollstaendig -> PILOT-ERGEBNIS)');
  var nacht = fs.readFileSync(path.join(K.HIER, 'nacht.cmd'), 'utf8');
  pruefe(/startet NICHTS von selbst/.test(nacht) && /tagesbalken\.js/.test(nacht) && /messen\.js/.test(nacht), '10f nacht.cmd ruft tagesbalken.js und messen.js und startet nichts von selbst');
});

console.log('\n' + ERG.ok + ' OK, ' + ERG.fehlt + ' FEHLT, ' + ERG.ueber + ' UEBERSPRUNGEN');
process.exitCode = ERG.fehlt ? 1 : 0;
