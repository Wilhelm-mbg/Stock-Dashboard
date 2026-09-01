'use strict';
/* MONATS-MOMENTUM MESSEN - nicht ueberlappend, mit Kosten je Gefaess, Placebo, Positiv-
 * kontrolle und Pruefung der Ueberlebensverzerrung. Werkzeug zur VORREGISTRIERUNG.md in
 * diesem Ordner; gebaut NACH deren Commit (22a0eff) und committet, BEVOR es auf Ertraege
 * laeuft.
 *
 * WAS ES TUT. Dieselbe Anordnung wie die Eichung vom 25.08. (studien/momentum-
 * nichtueberlappend/messen.js): Depot auf festem Kalender, alle 63 Handelstage
 * Umschichtung in das staerkste Zehntel nach der Rendite t-252..t-21, Vergleich gegen den
 * gleichgewichteten Mittelwert aller zulaessigen Werte derselben Periode. Phase 0, Schnitt
 * 2006-08-14, Urteil nur auf der Bestaetigungshaelfte.
 *
 * NEU gegenueber der Eichung (alles in der Registrierung festgelegt):
 *   - Kosten je Umlauf und Gefaess: CFD gehebelt K + F * Kalendernaechte (URTEIL),
 *     CFD ungehebelt K, Kassa 0,06 (ANNAHME) - beides nur nachrichtlich.
 *   - Placebo in derselben Blickzeile: zufaelliger Korb gleicher Groesse, Saat 20260902,
 *     dazu 200 Ziehungen als Rauschboden.
 *   - Positivkontrolle: Ausstiegskurs jedes Korbwerts x 1,02, analytisches Soll.
 *   - W0: Reproduktion der Eichung (+1,537 Pp, 79 Perioden).
 *   - Letzte Kerze je Reihe weg (#85); Delisting im Fenster -> letzter vorhandener Schluss.
 *   - Pruefung der Ueberlebensverzerrung auf dem Verschwundenen-Fenster (nachrichtlich).
 *
 * Aufruf:
 *   node messen.js --waechter    nur Kontrollen (W0, Placebo, Positivkontrolle, Daten)
 *   node messen.js --lauf        Kontrollen erneut, dann Urteil; Rohdaten nach lauf-*.json
 */
var fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var ARCHIV = process.env.MD_ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var WP = require(path.join(REPO, 'studien', 'messmaschine', 'strategien', 'wertpapierart.js'));

/* Eingefrorene Parameter - App "(geprueft)", momentum.js. NICHT variieren. */
var RUECKBLICK = 231, LUECKE = 21, HALTEN = 63, ANTEIL = 0.10;
var MINDEST_WERTE = 100;
var SCHNITT = '2006-08-14';
var MERKMAL_START = RUECKBLICK + LUECKE;         /* 252: erster Index, an dem das Merkmal existiert */

/* Kosten (wiki/kosten.md), alle in Prozentpunkten je Umlauf. */
var K = 0.110;            /* Runde, vorlaeufig - Freigabeschwelle unerfuellt */
var F = 0.0247;           /* Finanzierung je Kalendernacht, CFD gehebelt */
var KASSA = 0.06;         /* ANNAHME - nicht gemessen, kein Broker-Konto */

/* Schwellen. Familie momentum: 4 Maschinen-Varianten + dieser Lauf = 5 Tests. */
var T_FAM = 2.5758, Z_NOM = 1.959964, Z80 = 0.8416212;

/* Kontrollen. */
var SEED = 20260902, PLACEBO_ZIEHUNGEN = 200, IMPLANTAT = 0.02;
var EICHUNG = { brutto: 1.537, perioden: 79, toleranz: 0.05 };

var arg = {};
process.argv.slice(2).forEach(function (a) { var m = /^--([a-z0-9]+)=?(.*)$/.exec(a); if (m) arg[m[1]] = m[2] || true; });
var MODUS = arg.lauf ? 'lauf' : (arg.waechter ? 'waechter' : null);
if (!MODUS) { console.error('Bitte --waechter oder --lauf angeben.'); process.exit(2); }

/* ---------- Hilfen ---------- */
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
function statistik(werte) {
  var n = werte.length; if (n < 3) return null;
  var m = mittel(werte), v = 0;
  for (var i = 0; i < n; i++) v += (werte[i] - m) * (werte[i] - m);
  v /= (n - 1);
  var se = Math.sqrt(v / n);
  return { n: n, mittel: m, sd: Math.sqrt(v), se: se, t: se > 0 ? m / se : null,
           obereGrenze95: m + Z_NOM * se, untereGrenze95: m - Z_NOM * se,
           obereGrenzeFam: m + T_FAM * se, delta80: (Z_NOM + Z80) * se, delta80Fam: (T_FAM + Z80) * se };
}
function pp(x, k) { return x == null || isNaN(x) ? '-' : ((x >= 0 ? '+' : '') + x.toFixed(k == null ? 3 : k)); }
function fx(x, k) { return x == null || isNaN(x) ? '-' : x.toFixed(k == null ? 2 : k); }
function kalendernaechte(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length ? s[s.length >> 1] : NaN; }
/* Groesster Index i mit tage[i] <= tag (ISO-Strings vergleichen lexikografisch richtig). */
function letzterIndexBis(tage, tag) {
  var lo = 0, hi = tage.length - 1, best = -1;
  while (lo <= hi) { var m = (lo + hi) >> 1; if (tage[m] <= tag) { best = m; lo = m + 1; } else hi = m - 1; }
  return best;
}
function reiheKaputt(b) {
  var maxKurs = 0;
  for (var i = 0; i < b.length; i++) {
    var c = b[i][1]; if (!(c > 0)) continue;
    if (c > maxKurs) maxKurs = c;
    if (i > 0 && b[i - 1][1] > 0) { var r = c / b[i - 1][1] - 1; if (r > 4 || r < -0.8) return 'Sprung'; }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function fingerabdruck(ordner, praefix) {
  var n = 0, maxMtime = 0, summe = 0, dateien;
  try { dateien = fs.readdirSync(ordner); } catch (e) { return { fehler: String(e.code || e) }; }
  dateien.forEach(function (f) {
    if (praefix && f.indexOf(praefix) !== 0) return;
    if (f.slice(-5) !== '.json') return;
    var st; try { st = fs.statSync(path.join(ordner, f)); } catch (e) { return; }
    n++; summe += st.size; if (st.mtimeMs > maxMtime) maxMtime = st.mtimeMs;
  });
  return { dateien: n, bytes: summe, juengsteSchreibzeit: maxMtime };
}
function gleich(a, b) { return a && b && !a.fehler && !b.fehler && a.dateien === b.dateien && a.bytes === b.bytes && a.juengsteSchreibzeit === b.juengsteSchreibzeit; }

/* ---------- Datenwaechter ---------- */
function wachhund() {
  var r = cp.spawnSync(process.execPath, [path.join(REPO, 'tools', 'archiv-wachhund.js'), 'archiv1d'], { encoding: 'utf8', timeout: 300000 });
  var erste = String(r.stdout || '').split('\n')[0] || '';
  var m = /Rueckstand (\d+) Handelstag/.exec(erste);
  var rueckstand = m ? Number(m[1]) : (r.status === 0 ? 0 : null);
  console.log('[Wachhund archiv1d] Exit ' + r.status + ' - ' + erste.trim());
  return { exit: r.status, rueckstand: rueckstand, zeile: erste.trim() };
}

/* ---------- Laden ---------- */
/* Jede Reihe: { b: Balken, tage: ISO-Tage, idx: Map(tag -> i) }. Letzte Kerze weg (#85). */
function bereite(sym, b, quelle, delistet) {
  if (!b || !b.length) return null;
  if (delistet) { var cut = letzterIndexBis(b.map(function (k) { return tagVon(k[0]); }), delistet); b = b.slice(0, cut + 1); }
  b = b.slice(0, b.length - 1);                                     /* #85 */
  if (b.length < 2) return null;
  if (reiheKaputt(b)) return 'kaputt';
  var tage = new Array(b.length), idx = new Map();
  for (var i = 0; i < b.length; i++) { tage[i] = tagVon(b[i][0]); idx.set(tage[i], i); }
  return { sym: sym, b: b, tage: tage, idx: idx, quelle: quelle };
}
function ladeUeberlebende() {
  var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1d_.+\.json$/.test(f); });
  var U = {}, z = { dateien: dateien.length, keineAktie: 0, zuKurz: 0, kaputt: 0, genutzt: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) { z.keineAktie++; return; }
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j && (j.series || j.bars);
    if (!b || b.length < MERKMAL_START + HALTEN + 10) { z.zuKurz++; return; }
    var r = bereite(sym, b, 'archiv1d', null);
    if (r === 'kaputt') { z.kaputt++; return; }
    if (!r) { z.zuKurz++; return; }
    U[sym] = r; z.genutzt++;
  });
  return { reihen: U, zaehl: z };
}
function ladeVerschwundene() {
  var ordner = path.join(MASSIVE, 'tagesdaten');
  var dateien; try { dateien = fs.readdirSync(ordner).filter(function (f) { return f.slice(-5) === '.json'; }); } catch (e) { return { reihen: {}, zaehl: { fehler: String(e.code || e) } }; }
  var V = {}, z = { dateien: dateien.length, keineAktie: 0, zuKurz: 0, kaputt: 0, genutzt: 0, mitDelisting: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(0, -5);
    if (!WP.istAktie(sym)) { z.keineAktie++; return; }
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')); } catch (e) { return; }
    var b = j && (j.series || j.bars);
    var r = bereite(sym, b, 'massive', j.delistet || null);
    if (r === 'kaputt') { z.kaputt++; return; }
    if (!r || r.b.length < 20) { z.zuKurz++; return; }
    if (j.delistet) z.mitDelisting++;
    r.delistet = j.delistet || null;
    V[sym] = r; z.genutzt++;
  });
  return { reihen: V, zaehl: z };
}

/* ---------- Eine Periode ---------- */
/* Liefert je zulaessigem Wert Merkmal, Folgerendite (Ausstieg: Schluss an endTag, sonst
 * letzter vorhandener Schluss in (startTag, endTag]), Liquiditaet und Herkunft. */
function periode(reihen, syms, startTag, endTag) {
  var kand = [];
  for (var si = 0; si < syms.length; si++) {
    var R = reihen[syms[si]], b = R.b;
    var i = R.idx.get(startTag);
    if (i == null) continue;
    var von = i - MERKMAL_START, bis = i - LUECKE;
    if (von < 0) continue;
    var a = b[von][1], m2 = b[bis][1], p0 = b[i][1];
    if (!(a > 0) || !(m2 > 0) || !(p0 > 0)) continue;
    var iE = R.idx.get(endTag), ausstiegFrueh = false;
    if (iE == null) { iE = letzterIndexBis(R.tage, endTag); if (iE <= i) continue; ausstiegFrueh = true; }
    var p1 = b[iE][1];
    if (!(p1 > 0)) continue;
    /* Liquiditaet: Median Schluss x Stueck ueber die 20 Balken bis i (nur fuer das Profil). */
    var ums = [];
    for (var q = Math.max(0, i - 19); q <= i; q++) ums.push((b[q][1] || 0) * (b[q][2] || 0));
    kand.push({ sym: R.sym, staerke: m2 / a - 1, folge: p1 / p0 - 1, p0: p0, p1: p1,
                quelle: R.quelle, frueh: ausstiegFrueh, umsatz: median(ums) });
  }
  return kand;
}
function korbBilden(kand) {
  kand.sort(function (x, y) { return y.staerke - x.staerke; });
  var n = Math.max(1, Math.round(kand.length * ANTEIL));
  return kand.slice(0, n);
}
function ueberschuss(korb, kand) {
  var mK = mittel(korb.map(function (k) { return k.folge; }));
  var mA = mittel(kand.map(function (k) { return k.folge; }));
  return { korb: mK, markt: mA, brutto: (mK - mA) * 100 };
}

/* Alle Perioden einer Rasterlage ueber die gemeinsame Zeitachse. */
function laufe(reihen, syms, TAGE, phase, opts) {
  opts = opts || {};
  var out = [], vorKorb = null;
  for (var t = MERKMAL_START + phase; t + HALTEN < TAGE.length; t += HALTEN) {
    var startTag = TAGE[t], endTag = TAGE[t + HALTEN];
    var kand = periode(reihen, syms, startTag, endTag);
    if (kand.length < MINDEST_WERTE) continue;
    var korb = korbBilden(kand);
    var u = ueberschuss(korb, kand);
    var naechte = kalendernaechte(startTag, endTag);
    var P = { tag: startTag, ende: endTag, hf: startTag < SCHNITT ? 'entdeckung' : 'bestaetigung',
              n: kand.length, korbN: korb.length, brutto: u.brutto, korbRendite: u.korb * 100, marktRendite: u.markt * 100,
              naechte: naechte, kostenCfd: K + F * naechte };
    P.nettoCfd = P.brutto - P.kostenCfd; P.nettoUng = P.brutto - K; P.nettoKassa = P.brutto - KASSA;
    if (opts.detail) {
      var kset = {}; korb.forEach(function (k) { kset[k.sym] = 1; });
      P.umschlagGehalten = vorKorb ? korb.filter(function (k) { return vorKorb[k.sym]; }).length / korb.length : null;
      vorKorb = kset;
      var l1 = 0, l2 = 0, l3 = 0; korb.forEach(function (k) { if (k.umsatz >= 1e9) l1++; if (k.umsatz >= 1e8) l2++; if (k.umsatz < 5e6) l3++; });
      P.liq = { ge1Mrd: l1 / korb.length, ge100Mio: l2 / korb.length, unter5Mio: l3 / korb.length };
      P.fruehAusstiege = korb.filter(function (k) { return k.frueh; }).length;
      /* Positivkontrolle: Ausstiegskurs jedes Korbwerts x (1 + IMPLANTAT), analytisches Soll. */
      var korbImpl = korb.map(function (k) { return { folge: (k.p1 * (1 + IMPLANTAT)) / k.p0 - 1 }; });
      var restImpl = kand.filter(function (k) { return !kset[k.sym]; }).map(function (k) { return { folge: k.folge }; });
      var uI = ueberschuss(korbImpl, korbImpl.concat(restImpl));
      P.implantat = { brutto: uI.brutto, nettoCfd: uI.brutto - P.kostenCfd,
                      sollNaeherung: IMPLANTAT * 100 * (1 - korb.length / kand.length),
                      sollExakt: IMPLANTAT * 100 * (1 + u.korb) * (1 - korb.length / kand.length) };
      /* Herkunft (nur fuer die Vereinigungs-Arme): Verschwundene im Universum und im Korb. */
      var nV = kand.filter(function (k) { return k.quelle === 'massive'; }).length;
      var nVk = korb.filter(function (k) { return k.quelle === 'massive'; }).length;
      P.verschwundene = { imUniversum: nV, imKorb: nVk, anteilUniversum: nV / kand.length, anteilKorb: nVk / korb.length,
                          delistetImFenster: kand.filter(function (k) { return k.quelle === 'massive' && k.frueh; }).length };
      if (nV > 0) {
        var fV = mittel(kand.filter(function (k) { return k.quelle === 'massive'; }).map(function (k) { return k.folge; }));
        var fS = mittel(kand.filter(function (k) { return k.quelle !== 'massive'; }).map(function (k) { return k.folge; }));
        P.verschwundene.weg3Analogon63 = (fV - fS) * 100;
      }
      P.folgen = kand.map(function (k) { return k.folge; });     /* fuer den Placebo-Rauschboden */
    }
    out.push(P);
  }
  return out;
}

/* Placebo: je Periode ein zufaelliger Korb gleicher Groesse aus denselben Kandidaten - kein
 * Kursbezug, richtige Antwort null. Zieht aus P.folgen; braucht opts.detail. */
function placebo(perioden, seed) {
  var rnd = mulberry32(seed);
  return perioden.map(function (P) {
    var f = P.folgen, n = f.length, k = P.korbN, idx = new Array(n);
    for (var i = 0; i < n; i++) idx[i] = i;
    for (var j = 0; j < k; j++) { var r = j + Math.floor(rnd() * (n - j)); var tmp = idx[j]; idx[j] = idx[r]; idx[r] = tmp; }
    var s = 0; for (var q = 0; q < k; q++) s += f[idx[q]];
    return (s / k - mittel(f)) * 100;
  });
}

/* ---------- Urteil nach §5 ---------- */
function urteil(brutto, netto, huerde) {
  if (netto.mittel > 0 && netto.t >= T_FAM) return 'JA';
  if (brutto.obereGrenze95 < huerde) return 'NEIN';
  if (brutto.delta80 > huerde) return 'nicht messbar';
  return 'nicht entscheidbar';
}

/* ================= Ablauf ================= */
console.log('== Monats-Momentum messen ==  Modus ' + MODUS + '  Saat ' + SEED + '  Familie 5 Tests, |t| >= ' + T_FAM);
console.log('Rueckblick ' + RUECKBLICK + ' Luecke ' + LUECKE + ' Halten ' + HALTEN + ' Anteil ' + (ANTEIL * 100) + ' %  Schnitt ' + SCHNITT + '  Phase 0');
console.log('Kosten: CFD gehebelt K ' + K + ' + F ' + F + ' x Naechte | ungehebelt K | Kassa ' + KASSA + ' (ANNAHME)\n');
if (!WP.klassifizierungDa()) { console.error('ABBRUCH: Wertpapierart-Klassifizierung fehlt.'); process.exit(2); }
var wh = wachhund();
if (wh.exit === 2 || wh.rueckstand == null || wh.rueckstand >= 2) { console.error('ABBRUCH: Wachhund - Archiv nicht pruefbar oder >= 2 Tage zurueck.'); process.exit(2); }
if (wh.rueckstand === 1) console.log('  Hinweis: 1 Handelstag Rueckstand - fuer 63-Tage-Perioden unerheblich, wird im Ergebnis vermerkt.');

console.log('\nLade Ueberlebende (archiv1d) ...');
var fpVor = fingerabdruck(ARCHIV, 'bars_1d_');
var UE = ladeUeberlebende();
var fpNach = fingerabdruck(ARCHIV, 'bars_1d_');
if (!gleich(fpVor, fpNach)) { console.error('STABILITAETSRISS: Archiv hat sich waehrend des Lesens geaendert. Lauf NICHT MESSBAR.'); process.exit(3); }
var symsS = Object.keys(UE.reihen);
console.log('  ' + JSON.stringify(UE.zaehl) + '  Fingerabdruck unveraendert (' + fpVor.dateien + ' Dateien)');

/* Gemeinsame Zeitachse aus den Ueberlebenden - dieselbe Konstruktion wie in der Eichung. */
var achse = {};
symsS.forEach(function (s) { UE.reihen[s].tage.forEach(function (d) { achse[d] = 1; }); });
var TAGE = Object.keys(achse).sort();
console.log('  Zeitachse ' + TAGE.length + ' Handelstage, ' + TAGE[0] + ' bis ' + TAGE[TAGE.length - 1]);

/* ---------- Phase 0, beide Haelften, mit Detail ---------- */
var alle0 = laufe(UE.reihen, symsS, TAGE, 0, { detail: true });
var best = alle0.filter(function (P) { return P.hf === 'bestaetigung'; });
var entd = alle0.filter(function (P) { return P.hf === 'entdeckung'; });
var stB = statistik(best.map(function (P) { return P.brutto; }));
if (!stB) { console.error('Zu wenige Perioden.'); process.exit(1); }

/* ---------- W0 Reproduktion der Eichung ---------- */
console.log('\n-- W0 Reproduktion der Eichung (Bestaetigung, Phase 0, brutto) --');
var w0abw = Math.abs(stB.mittel - EICHUNG.brutto);
var w0ok = w0abw <= EICHUNG.toleranz && stB.n === EICHUNG.perioden;
console.log('  Eichung +' + EICHUNG.brutto.toFixed(3) + ' Pp / ' + EICHUNG.perioden + ' Perioden   hier ' + pp(stB.mittel) + ' Pp / ' + stB.n + ' Perioden   Abweichung ' + w0abw.toFixed(3) + '  -> ' + (w0ok ? 'BESTANDEN' : 'VERFEHLT'));
var fruehe = best.reduce(function (s, P) { return s + P.fruehAusstiege; }, 0);
console.log('  Delisting-Ausstiege im Korb (Bestaetigung): ' + fruehe + '  (Eichung uebersprang solche Werte)');

/* ---------- Placebo ---------- */
console.log('\n-- Placebo (zufaelliger Korb, kein Kursbezug, Soll null) --');
var plac = placebo(best, SEED);
var stP = statistik(plac);
var stPnet = statistik(plac.map(function (x, i) { return x - best[i].kostenCfd; }));
var rauschboden = [];
for (var z = 1; z <= PLACEBO_ZIEHUNGEN; z++) { var s2 = statistik(placebo(best, SEED + z)); rauschboden.push({ mittel: s2.mittel, t: s2.t }); }
var sdRB = statistik(rauschboden.map(function (r) { return r.mittel; })).sd;
/* Registriertes Kriterium (§6): sd der Placebo-Mittel gegen se des KANDIDATEN. Im Waechterlauf
 * gefallen (0,247) - und zwar, weil es falsch gebaut war: ein Zufallskorb traegt keine
 * Faktor-Exposition, der Momentum-Korb schon (Nachtrag 1). Wird weiter ausgewiesen. */
var verhRB = sdRB / stB.se;
/* Korrigiertes Kriterium (Nachtrag 1): parametrischer se der Placebo-Reihe gegen empirische
 * sd der Placebo-Mittel - dieselbe Rechnung, die dem Kandidaten seinen se gibt, muss beim
 * Placebo die Wahrheit treffen. */
var verhEigen = stP.se / sdRB;
var rbUeber = rauschboden.filter(function (r) { return Math.abs(r.t) >= T_FAM; }).length;
var placOkRegistriert = Math.abs(stP.t) < T_FAM && verhRB >= 0.7 && verhRB <= 1.4;
var placOk = Math.abs(stP.t) < T_FAM && verhEigen >= 0.7 && verhEigen <= 1.4;
console.log('  Placebo brutto ' + pp(stP.mittel) + ' Pp   se ' + fx(stP.se, 3) + '   t ' + fx(stP.t) + '   (netto CFD ' + pp(stPnet.mittel) + ')   Streuung je Periode ' + fx(stP.sd, 3) + ' gegen Kandidat ' + fx(stB.sd, 3) + ' Pp');
console.log('  Rauschboden: sd der ' + PLACEBO_ZIEHUNGEN + ' Placebo-Mittel ' + fx(sdRB, 3) + ' Pp   |t| >= ' + T_FAM + ' in ' + rbUeber + ' von ' + PLACEBO_ZIEHUNGEN + ' (Erwartung bei 78 Freiheitsgraden ~2,4)');
console.log('  Kriterium registriert (sd Placebo-Mittel / se Kandidat): ' + fx(verhRB, 3) + '  -> ' + (placOkRegistriert ? 'bestanden' : 'GEFALLEN - Nachtrag 1: Faktorstreuung, kein Werkzeugfehler'));
console.log('  Kriterium korrigiert (se Placebo / sd Placebo-Mittel):   ' + fx(verhEigen, 3) + '  -> ' + (placOk ? 'BESTANDEN' : 'VERFEHLT'));

/* ---------- Positivkontrolle ---------- */
console.log('\n-- Positivkontrolle (Ausstiegskurs jedes Korbwerts x ' + (1 + IMPLANTAT) + ') --');
var implB = statistik(best.map(function (P) { return P.implantat.brutto; }));
var implN = statistik(best.map(function (P) { return P.implantat.nettoCfd; }));
var sollN = mittel(best.map(function (P) { return P.implantat.sollNaeherung; }));
var sollE = mittel(best.map(function (P) { return P.implantat.sollExakt; }));
var gefunden = implB.mittel - stB.mittel, gefundenNetto = implN.mittel - mittel(best.map(function (P) { return P.nettoCfd; }));
var posVerh = gefunden / sollE;
var posOk = posVerh >= 0.95 && posVerh <= 1.05 && Math.abs(gefundenNetto - gefunden) < 1e-9;
console.log('  Soll (registrierte Naeherung 2,000 x (1 - Korb/Alle)) ' + pp(sollN) + ' Pp   Soll exakt fuer x1,02 ' + pp(sollE) + ' Pp');
console.log('  gefunden brutto ' + pp(gefunden) + ' Pp   netto ' + pp(gefundenNetto) + ' Pp   Verhaeltnis zu exakt ' + fx(posVerh, 4) + '  -> ' + (posOk ? 'BESTANDEN' : 'VERFEHLT'));

var kontrollen = { w0: { ok: w0ok, hier: stB.mittel, n: stB.n, abweichung: w0abw, delistingAusstiege: fruehe },
                   placebo: { ok: placOk, okRegistriert: placOkRegistriert, mittel: stP.mittel, se: stP.se, sd: stP.sd, t: stP.t, nettoCfd: stPnet.mittel, rauschbodenSd: sdRB,
                              verhaeltnisRegistriert: verhRB, verhaeltnisKorrigiert: verhEigen, ueberSchwelle: rbUeber, ziehungen: PLACEBO_ZIEHUNGEN },
                   positiv: { ok: posOk, sollNaeherung: sollN, sollExakt: sollE, gefunden: gefunden, gefundenNetto: gefundenNetto, verhaeltnis: posVerh },
                   wachhund: wh, fingerabdruck: fpVor, klassifizierung: true };
var alleOk = w0ok && placOk && posOk;
console.log('\nKONTROLLEN: ' + (alleOk ? 'ALLE BESTANDEN' : 'MINDESTENS EINE VERFEHLT - kein Urteil'));

if (MODUS === 'waechter') {
  fs.writeFileSync(path.join(HIER, 'waechter-' + new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json'), JSON.stringify({ modus: 'waechter', kontrollen: kontrollen, zaehl: UE.zaehl, zeitachse: { n: TAGE.length, von: TAGE[0], bis: TAGE[TAGE.length - 1] } }, null, 1));
  console.log('Waechter-Datei geschrieben. Kein Urteil in diesem Modus.');
  process.exit(alleOk ? 0 : 1);
}
if (!alleOk) { console.error('ABBRUCH: Kontrolle verfehlt, kein Urteil.'); process.exit(1); }

/* ================= LAUF: Urteil ================= */
function gefaess(perioden, feld, huerde) {
  var stBr = statistik(perioden.map(function (P) { return P.brutto; }));
  var stNe = statistik(perioden.map(function (P) { return P[feld]; }));
  return { brutto: stBr, netto: stNe, huerde: huerde, urteil: urteil(stBr, stNe, huerde) };
}
var naechteMittel = mittel(best.map(function (P) { return P.naechte; }));
var huerdeCfd = K + F * naechteMittel;
var G = { cfd: gefaess(best, 'nettoCfd', huerdeCfd), ungehebelt: gefaess(best, 'nettoUng', K), kassa: gefaess(best, 'nettoKassa', KASSA) };

console.log('\n================ URTEIL (Bestaetigung ' + best[0].tag + ' bis ' + best[best.length - 1].ende + ', Phase 0, ' + stB.n + ' unabhaengige Perioden) ================');
console.log('  brutto ' + pp(stB.mittel) + ' Pp je Umlauf   sd ' + fx(stB.sd, 3) + '   se ' + fx(stB.se, 3) + '   t ' + fx(stB.t) + '   delta80 ' + fx(stB.delta80, 3) + ' (Familie ' + fx(stB.delta80Fam, 3) + ')');
console.log('  95-%-Band brutto [' + pp(stB.untereGrenze95) + ', ' + pp(stB.obereGrenze95) + ']   Obergrenze bei 2,576: ' + pp(stB.obereGrenzeFam));
console.log('  Kalendernaechte je Periode: Mittel ' + fx(naechteMittel, 1) + ', min ' + Math.min.apply(null, best.map(function (P) { return P.naechte; })) + ', max ' + Math.max.apply(null, best.map(function (P) { return P.naechte; })));
function zeile(name, g, etikett) {
  console.log('  ' + name + ': Huerde ' + fx(g.huerde, 3) + '  netto ' + pp(g.netto.mittel) + ' Pp  se ' + fx(g.netto.se, 3) + '  t_netto ' + fx(g.netto.t) + '  Obergrenze brutto ' + pp(g.brutto.obereGrenze95) + '  Obergrenze netto ' + pp(g.netto.obereGrenze95) + '  -> ' + g.urteil + (etikett ? '  [' + etikett + ']' : ''));
}
zeile('CFD gehebelt   (URTEIL)      ', G.cfd, '');
zeile('CFD ungehebelt (nachrichtl.) ', G.ungehebelt, 'kein Urteil');
zeile('Kassa-Aktie    (nachrichtl.) ', G.kassa, 'ANNAHME 0,06 - nicht gemessen');
console.log('  Placebo in derselben Zeile: brutto ' + pp(stP.mittel) + ' Pp, t ' + fx(stP.t) + '; netto CFD ' + pp(stPnet.mittel));

/* ---------- Nachrichtlich ---------- */
console.log('\n-- Nachrichtlich: Aeren, Phase 0 --');
function aera(name, per) {
  if (per.length < 3) { console.log('  ' + name + ': ' + per.length + ' Perioden'); return null; }
  var b = statistik(per.map(function (P) { return P.brutto; })), nC = statistik(per.map(function (P) { return P.nettoCfd; })), nK = statistik(per.map(function (P) { return P.nettoKassa; }));
  console.log('  ' + name + ': ' + b.n + ' Perioden  brutto ' + pp(b.mittel) + ' (se ' + fx(b.se, 3) + ', t ' + fx(b.t) + ')  netto CFD ' + pp(nC.mittel) + ' (t ' + fx(nC.t) + ')  netto Kassa ' + pp(nK.mittel) + ' (t ' + fx(nK.t) + ')  Obergrenze brutto ' + pp(b.obereGrenze95));
  return { n: b.n, brutto: b, nettoCfd: nC, nettoKassa: nK };
}
var aeren = { entdeckung: aera('Entdeckung  ', entd), bestaetigung: aera('Bestaetigung', best), gesamt: aera('Gesamt      ', alle0) };
var jahrzehnte = {};
alle0.forEach(function (P) { var j = P.tag.slice(0, 3) + '0er'; (jahrzehnte[j] || (jahrzehnte[j] = [])).push(P); });
Object.keys(jahrzehnte).sort().forEach(function (j) { aeren[j] = aera(j + '       ', jahrzehnte[j]); });

console.log('\n-- Nachrichtlich: Umschlag und Liquiditaetsprofil des Korbs (Bestaetigung) --');
var umschl = best.filter(function (P) { return P.umschlagGehalten != null; }).map(function (P) { return P.umschlagGehalten; });
var liq = { ge1Mrd: mittel(best.map(function (P) { return P.liq.ge1Mrd; })), ge100Mio: mittel(best.map(function (P) { return P.liq.ge100Mio; })), unter5Mio: mittel(best.map(function (P) { return P.liq.unter5Mio; })) };
var korbGroesse = mittel(best.map(function (P) { return P.korbN; })), breite = mittel(best.map(function (P) { return P.n; }));
console.log('  Korb im Mittel ' + fx(korbGroesse, 0) + ' von ' + fx(breite, 0) + ' Werten; gehalten aus der Vorperiode ' + fx(100 * mittel(umschl), 1) + ' %  -> effektives K bei Teil-Umschlag ' + fx(K * (1 - mittel(umschl)), 3) + ' Pp');
console.log('  Korbwerte mit Median-Tagesumsatz >= 1 Mrd $: ' + fx(100 * liq.ge1Mrd, 1) + ' %   >= 100 Mio $: ' + fx(100 * liq.ge100Mio, 1) + ' %   < 5 Mio $: ' + fx(100 * liq.unter5Mio, 1) + ' %');

console.log('\n-- Nachrichtlich: alle 63 Rasterlagen (Bestaetigung) - Streubild, KEINE Tests --');
var lagen = [];
for (var ph = 0; ph < HALTEN; ph++) {
  var per = laufe(UE.reihen, symsS, TAGE, ph).filter(function (P) { return P.hf === 'bestaetigung'; });
  var b2 = statistik(per.map(function (P) { return P.brutto; })), n2 = statistik(per.map(function (P) { return P.nettoCfd; })), k2 = statistik(per.map(function (P) { return P.nettoKassa; }));
  if (b2 && n2) lagen.push({ phase: ph, n: b2.n, brutto: b2.mittel, se: b2.se, t: b2.t, obereGrenze95: b2.obereGrenze95, nettoCfd: n2.mittel, tNettoCfd: n2.t, nettoKassa: k2.mittel, tNettoKassa: k2.t });
}
function spann(feld, k) { var v = lagen.map(function (l) { return l[feld]; }).sort(function (a, b) { return a - b; }); return 'min ' + pp(v[0], k) + '  Median ' + pp(v[v.length >> 1], k) + '  max ' + pp(v[v.length - 1], k); }
console.log('  brutto:      ' + spann('brutto'));
console.log('  t brutto:    ' + spann('t', 2));
console.log('  netto CFD:   ' + spann('nettoCfd'));
console.log('  t netto CFD: ' + spann('tNettoCfd', 2) + '   Lagen mit t_netto >= ' + T_FAM + ': ' + lagen.filter(function (l) { return l.tNettoCfd >= T_FAM; }).length + ' von ' + lagen.length);
console.log('  Obergrenze brutto: ' + spann('obereGrenze95'));
console.log('  t netto Kassa (Annahme): ' + spann('tNettoKassa', 2) + '   >= ' + T_FAM + ': ' + lagen.filter(function (l) { return l.tNettoKassa >= T_FAM; }).length + '   >= 1,96: ' + lagen.filter(function (l) { return l.tNettoKassa >= Z_NOM; }).length);

/* ---------- §7 Ueberlebensverzerrung: Verschwundenen-Fenster ---------- */
console.log('\n-- §7 Ueberlebensverzerrung: Ueberlebende allein gegen Vereinigung im Verschwundenen-Fenster (nachrichtlich) --');
var VE = ladeVerschwundene();
var symsV = Object.keys(VE.reihen);
console.log('  Verschwundene: ' + JSON.stringify(VE.zaehl));
var s7 = null;
if (symsV.length) {
  var reihenU = {}; symsS.forEach(function (s) { reihenU[s] = UE.reihen[s]; }); symsV.forEach(function (s) { reihenU['V:' + s] = VE.reihen[s]; });
  var symsU = Object.keys(reihenU);
  var vereinigung0 = laufe(reihenU, symsU, TAGE, 0, { detail: true });
  var vergleich = [];
  vereinigung0.forEach(function (PU) {
    if (!PU.verschwundene || PU.verschwundene.imUniversum === 0) return;
    var PS = null; for (var q = 0; q < alle0.length; q++) if (alle0[q].tag === PU.tag) PS = alle0[q];
    if (!PS) return;
    vergleich.push({ tag: PU.tag, ende: PU.ende, nUnion: PU.n, nV: PU.verschwundene.imUniversum, anteilUniversum: PU.verschwundene.anteilUniversum,
                     korbN: PU.korbN, nVkorb: PU.verschwundene.imKorb, anteilKorb: PU.verschwundene.anteilKorb, delistetImFenster: PU.verschwundene.delistetImFenster,
                     bruttoS: PS.brutto, bruttoU: PU.brutto, delta: PU.brutto - PS.brutto, weg3Analogon63: PU.verschwundene.weg3Analogon63 });
  });
  vergleich.forEach(function (v) {
    console.log('  ' + v.tag + '..' + v.ende + ': Universum ' + v.nUnion + ' (V ' + v.nV + ' = ' + fx(100 * v.anteilUniversum, 1) + ' %)  Korb ' + v.korbN + ' (V ' + v.nVkorb + ' = ' + fx(100 * v.anteilKorb, 1) + ' %)  delistet im Fenster ' + v.delistetImFenster +
      '  brutto S ' + pp(v.bruttoS) + '  U ' + pp(v.bruttoU) + '  Delta ' + pp(v.delta) + ' Pp  Weg-3-Analogon 63 T (V-S) ' + pp(v.weg3Analogon63) + ' Pp');
  });
  /* Alle 63 Lagen im Fenster, nur Punkt 1 (Korb-Anteil gegen Universumsanteil). */
  var aU = [], aK = [], lagenMitV = 0;
  for (var ph2 = 0; ph2 < HALTEN; ph2++) {
    laufe(reihenU, symsU, TAGE, ph2, { detail: true }).forEach(function (P) {
      if (P.verschwundene && P.verschwundene.imUniversum > 0) { aU.push(P.verschwundene.anteilUniversum); aK.push(P.verschwundene.anteilKorb); lagenMitV++; }
    });
  }
  console.log('  Alle 63 Lagen, ' + lagenMitV + ' Perioden mit Verschwundenen: Anteil im Universum ' + fx(100 * mittel(aU), 2) + ' %  im Korb ' + fx(100 * mittel(aK), 2) + ' %  (Verhaeltnis ' + fx(mittel(aK) / mittel(aU), 2) + ')');
  s7 = { perioden: vergleich, alleLagen: { perioden: lagenMitV, anteilUniversum: mittel(aU), anteilKorb: mittel(aK) }, zaehl: VE.zaehl };
} else console.log('  KEINE Verschwundenen-Reihen gefunden - §7 nicht messbar.');

/* ---------- Rohdaten ---------- */
var stempel = new Date().toISOString();
var out = { studie: 'vorregistrierung-2026-09-02-momentum-messung', modus: 'lauf', zeit: stempel, saat: SEED,
  parameter: { rueckblick: RUECKBLICK, luecke: LUECKE, halten: HALTEN, anteil: ANTEIL, mindestWerte: MINDEST_WERTE, schnitt: SCHNITT, phase: 0 },
  kosten: { K: K, F: F, kassaAnnahme: KASSA, naechteMittel: naechteMittel, huerdeCfd: huerdeCfd },
  schwellen: { familie: T_FAM, tests: 5, nominal: Z_NOM, z80: Z80 },
  daten: { archiv: ARCHIV, zaehl: UE.zaehl, zeitachse: { n: TAGE.length, von: TAGE[0], bis: TAGE[TAGE.length - 1] }, wachhund: wh, fingerabdruck: fpVor },
  kontrollen: kontrollen,
  urteil: { cfd: G.cfd, ungehebelt: G.ungehebelt, kassa: G.kassa, bruttoBestaetigung: stB },
  aeren: aeren, umschlagGehalten: mittel(umschl), liquiditaet: liq, korbGroesse: korbGroesse, breite: breite,
  rasterlagen: lagen, ueberlebensverzerrung: s7,
  perioden: alle0.map(function (P) { var Q = {}; Object.keys(P).forEach(function (k) { if (k !== 'folgen') Q[k] = P[k]; }); return Q; }),
  placeboJePeriode: plac };
var datei = path.join(HIER, 'lauf-' + stempel.replace(/[:T]/g, '-').slice(0, 16) + '.json');
fs.writeFileSync(datei, JSON.stringify(out, null, 1));
console.log('\nRohdaten: ' + path.basename(datei));
