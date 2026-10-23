'use strict';
/* PAPIER-MITSCHRIFT "letzte halbe Stunde" auf dem Nasdaq-100 (Auftrag Nr. 121-2b C, 23.10.2026) - kostenlos, nur aus dem vorhandenen Archiv.
 * KEIN Urteil, KEIN Kandidat, KEIN Handel (Hausregel CLAUDE.md: Tageszeitregel - unter 1.000 Bestaetigungs-Signaltagen nicht in die Muehle).
 *
 * Je Handelstag die Rendite Eroeffnung der 15:30-Kerze -> Eroeffnung der 16:00-Kerze (QQQ, E:/Markt-Dashboard-Archiv/alpaca1m/QQQ/<Jahr>.json, Alpaca SIP
 * adjustment=raw; Zeitstempel Millisekunden UTC - geprueft wie pruefstrasse/daten/qqq-bauen.js; Zeitzone New York nach nyVersatzStunden der Nr. 122).
 *   - fehlt die 16:00-Kerze: Schluss der letzten Kerze vor 16:00, NUR wenn sie >= 15:58 liegt, sonst Luecke;
 *   - fehlt die 15:30-Kerze: Luecke;
 *   - Halbtag (Kalender alpaca1m/_kalender.json close 13:00): ausgewiesen, ausgeschlossen;
 *   - Vollstaendigkeit: Kerzen 15:30-15:59 (Soll 30), unter 28 -> "unvollstaendig", ausgewiesen, ausgeschlossen.
 * Ausgabe <Daten>/papier/letzte-halbe-stunde.json (je Tag: datum, rendite (Pp), kerzen, status) und letzte-halbe-stunde.md (Tage, Mittel, se Hansen-Hodrick
 * Lag 1, t, MDE80, Summe, nachrichtlich nach der Index-Huerde der Kostenregel, Verteilung je Jahr). IDEMPOTENT UND ANHAENGEND: vorhandene Tage bleiben
 * unveraendert, neue werden ergaenzt, die Datei wird sortiert neu geschrieben. Endet am letzten Tag der Jahresdateien und sagt es (_live.jsonl der
 * laufenden Sitzung wird NICHT gelesen - unvollstaendige Tage).
 *   node tools/papier-letzte-halbe-stunde.js [--archiv E:/Markt-Dashboard-Archiv] [--aus <Daten>/papier]
 * NUR LESEN auf dem Archiv. Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var os = require('os');
var QB = require('../pruefstrasse/daten/qqq-bauen.js');

var SOLL_KERZEN = 30, MIN_KERZEN = 28, START_MIN = 15 * 60 + 30, ENDE_MIN = 16 * 60, SPAET_MIN = 15 * 60 + 58;
var KOPF = 'Papier-Mitschrift — kein Urteil, kein Kandidat, kein Handel; Hausregel CLAUDE.md: Tageszeitregel';

/** Tage aus Kerzen ([ms, schluss, umsatz, hoch, tief, eroeffnung]) und Kalender { datum: { open, close } }. */
function tageAus(kerzen, kal) {
  var je = {};
  kerzen.forEach(function (b) {
    var z = QB.nyZeit(b[0]), k = kal[z.datum]; if (!k) return;
    var t = je[z.datum] || (je[z.datum] = { halb: k.close !== '16:00', o1530: NaN, o1600: NaN, letzt: NaN, letztMin: -1, n: 0 });
    if (z.min === START_MIN) t.o1530 = b[5];
    if (z.min === ENDE_MIN) t.o1600 = b[5];
    if (z.min >= START_MIN && z.min < ENDE_MIN) { t.n++; if (z.min > t.letztMin) { t.letztMin = z.min; t.letzt = b[1]; } }
  });
  return Object.keys(je).sort().map(function (d) {
    var t = je[d], st = 'ok', r = null, ende = null;
    if (t.halb) st = 'halbtag';
    else if (!(t.o1530 > 0)) st = 'luecke-1530';
    else if (t.o1600 > 0) ende = t.o1600;
    else if (t.letztMin >= SPAET_MIN && t.letzt > 0) { ende = t.letzt; st = 'ok-1558'; }
    else st = 'luecke-1600';
    if ((st === 'ok' || st === 'ok-1558') && t.n < MIN_KERZEN) st = 'unvollstaendig';
    if (st === 'ok' || st === 'ok-1558') r = (ende / t.o1530 - 1) * 100;
    return { datum: d, rendite: r, kerzen: t.n, status: st };
  });
}
function gezaehlt(x) { return x.status === 'ok' || x.status === 'ok-1558'; }

/** Vorhandene Tage behalten, neue anhaengen, sortiert (idempotent). */
function zusammen(alt, neu) {
  var je = {}; (alt || []).forEach(function (x) { je[x.datum] = x; });
  var dazu = 0; neu.forEach(function (x) { if (!je[x.datum]) { je[x.datum] = x; dazu++; } });
  return { tage: Object.keys(je).sort().map(function (d) { return je[d]; }), neu: dazu };
}

/** Kennzahlen (Pp je Tag): Mittel, se Hansen-Hodrick Lag 1 (= naiv mit n im Nenner der Varianz), t, MDE80 = 2,8016 se, Summe; je Jahr. */
function kennzahlen(tage, huerdePp) {
  var x = tage.filter(gezaehlt).map(function (t) { return t.rendite; }), n = x.length, su = 0, q = 0;
  x.forEach(function (v) { su += v; });
  var m = n ? su / n : null; x.forEach(function (v) { q += (v - m) * (v - m); });
  var se = n > 1 ? Math.sqrt(q / n / n) : null, jahre = {};
  tage.forEach(function (t) { var j = t.datum.slice(0, 4), a = jahre[j] || (jahre[j] = { jahr: j, tage: 0, summe: 0, positiv: 0, ausgeschlossen: 0 }); if (gezaehlt(t)) { a.tage++; a.summe += t.rendite; if (t.rendite > 0) a.positiv++; } else a.ausgeschlossen++; });
  var st = {}; tage.forEach(function (t) { st[t.status] = (st[t.status] || 0) + 1; });
  return { tage: n, mittel: m, se: se, t: se ? m / se : null, mde80: se != null ? 2.8016 * se : null, summe: su, nachHuerde: m != null ? m - huerdePp : null, huerdePp: huerdePp,
    jahre: Object.keys(jahre).sort().map(function (j) { var a = jahre[j]; a.mittel = a.tage ? a.summe / a.tage : null; return a; }), status: st };
}

function de(x, n) { return x == null ? '–' : (x < 0 ? '−' : '') + Math.abs(x).toFixed(n == null ? 4 : n).replace('.', ','); }
function bericht(E) {
  var k = E.kennzahlen, o = ['# ' + KOPF, '', 'QQQ (Nasdaq-100), Rendite Eröffnung der 15:30-Kerze → Eröffnung der 16:00-Kerze je Handelstag, aus `alpaca1m/QQQ` (Alpaca SIP, roh). Stand ' + E.stand + '.',
    '**Endet am letzten Archivtag ' + E.letzterArchivtag + '** (Jahresdateien; die laufende Tagesablage `_live.jsonl` wird nicht gelesen). Erster Tag ' + E.ersterTag + '.', '',
    '| Größe | Wert |', '|---|---|',
    '| Tage gezählt | ' + k.tage + ' |', '| Mittel je Tag | ' + de(k.mittel) + ' Pp |', '| se (Hansen-Hodrick, Lag 1) | ' + de(k.se) + ' Pp |', '| t | ' + de(k.t, 2) + ' |', '| MDE80 (2,8016 × se) | ' + de(k.mde80) + ' Pp |',
    '| Summe (kumuliert, einfach) | ' + de(k.summe, 2) + ' Pp |', '| nachrichtlich nach Index-Hürde (Kassa, ' + de(k.huerdePp) + ' Pp je Umlauf; ' + E.huerdeMarke + ') | ' + de(k.nachHuerde) + ' Pp je Tag |',
    '| ausgeschlossen | ' + Object.keys(k.status).filter(function (s) { return s !== 'ok' && s !== 'ok-1558'; }).map(function (s) { return s + ' ' + k.status[s]; }).join(', ') + ' |', '',
    '| Jahr | Tage | Mittel (Pp) | Summe (Pp) | positiv | ausgeschlossen |', '|---|---|---|---|---|---|'];
  k.jahre.forEach(function (j) { o.push('| ' + j.jahr + ' | ' + j.tage + ' | ' + de(j.mittel) + ' | ' + de(j.summe, 2) + ' | ' + j.positiv + ' | ' + j.ausgeschlossen + ' |'); });
  o.push(''); o.push('Regeln: fehlt die 16:00-Kerze, zählt der Schluss der letzten Kerze vor 16:00 nur ab 15:58 (Status ok-1558); Halbtage (Schluss 13:00) und Tage mit unter ' + MIN_KERZEN + ' von ' + SOLL_KERZEN + ' Kerzen 15:30–15:59 sind ausgewiesen und ausgeschlossen. Idempotent: vorhandene Tage bleiben unverändert. Simulation, keine Anlageberatung.');
  return o.join('\n') + '\n';
}

/** Ein Lauf: Archiv lesen, an vorhandene Datei anhaengen, beide Dateien schreiben. opt: { archiv, aus, kerzen, kalender, stand } (kerzen/kalender nur Tests). */
function lauf(opt) {
  opt = opt || {};
  var aus = opt.aus, kerzen = opt.kerzen, kal = opt.kalender;
  if (!kerzen) {
    var ord = path.join(opt.archiv, 'alpaca1m', 'QQQ');
    kerzen = [];
    fs.readdirSync(ord).filter(function (f) { return /^\d{4}\.json$/.test(f); }).sort().forEach(function (f) {
      var D = JSON.parse(fs.readFileSync(path.join(ord, f), 'utf8'));
      if (D.felder !== QB.FELDER) throw new Error('KLINKE: Feldfolge ' + D.felder + ' in ' + f);
      QB.zeitPruefen(D.series, f);
      for (var i = 0; i < D.series.length; i++) kerzen.push(D.series[i]);
    });
    kal = JSON.parse(fs.readFileSync(path.join(opt.archiv, 'alpaca1m', '_kalender.json'), 'utf8')).tage;
  }
  fs.mkdirSync(aus, { recursive: true });
  var dj = path.join(aus, 'letzte-halbe-stunde.json'), alt = fs.existsSync(dj) ? JSON.parse(fs.readFileSync(dj, 'utf8')) : null;
  var neu = tageAus(kerzen, kal), Z = zusammen(alt && alt.tage, neu);
  var KO = require('../pruefstrasse/kosten.js'), h = KO.huerdeUmlauf('index', 'kassa', require('../pruefstrasse/konfig.js').POSITION_USD, 400);
  var E = { kennung: 'papier/letzte-halbe-stunde/v1', kopf: KOPF, stand: opt.stand || new Date().toISOString(), quelle: 'alpaca1m/QQQ/<Jahr>.json (roh), Kalender alpaca1m/_kalender.json',
    ersterTag: Z.tage.length ? Z.tage[0].datum : null, letzterArchivtag: Z.tage.length ? Z.tage[Z.tage.length - 1].datum : null, neuDiesmal: Z.neu, huerdeMarke: h.marke,
    kennzahlen: kennzahlen(Z.tage, h.gesamtPp), tage: Z.tage };
  var alterInhalt = alt ? JSON.stringify(alt.tage) : null;
  if (alterInhalt !== JSON.stringify(Z.tage) || !fs.existsSync(path.join(aus, 'letzte-halbe-stunde.md'))) {
    fs.writeFileSync(dj + '.tmp', JSON.stringify(E, null, 1) + '\n'); fs.renameSync(dj + '.tmp', dj);
    fs.writeFileSync(path.join(aus, 'letzte-halbe-stunde.md'), bericht(E));
  }
  return E;
}

module.exports = { tageAus: tageAus, zusammen: zusammen, kennzahlen: kennzahlen, bericht: bericht, lauf: lauf, KOPF: KOPF };

if (require.main === module) {
  var arg = function (n, v) { var i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
  var E = lauf({ archiv: arg('--archiv', 'E:/Markt-Dashboard-Archiv'), aus: arg('--aus', path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'papier')) });
  var k = E.kennzahlen;
  console.log('letzte halbe Stunde QQQ: ' + k.tage + ' Tage ' + E.ersterTag + '..' + E.letzterArchivtag + ' (neu ' + E.neuDiesmal + '), Mittel ' + de(k.mittel) + ' Pp, se ' + de(k.se) + ', t ' + de(k.t, 2) + ', MDE80 ' + de(k.mde80) + ', Summe ' + de(k.summe, 2) + ', Status ' + JSON.stringify(k.status));
}
