'use strict';
/* TEIL 2 - DIE BEOBACHTUNGSDICHTE ZAEHLEN.
 *
 * WAS ERSETZT WIRD: Die Empfehlung vom 01.09. schaetzt 20,6 % aus 12 Tagen, von denen
 * die Haelfte auf EINEM Tag liegt. Das ist kein Schaetzer, das ist eine Anekdote mit
 * Nachkommastelle - und die Empfehlung sagt das selbst.
 *
 * ANORDNUNG, VOR DEM ERSTEN ABRUF FESTGELEGT:
 *   Saat 20260901 · 30 Symbole · 20 zufaellige Handelstage aus dem erreichbaren Fenster.
 *   Gezaehlt wird (a) an wie vielen Symbol-Tagen ueberhaupt eine Meldung existiert und
 *   (b) wie viele davon Q.sentiment() auf einen Score != 0 bringt.
 *
 * WARUM JE TAG UND NICHT JE SYMBOL-TAG ABGEFRAGT WIRD: 30 x 20 = 600 Einzelabrufe
 * waeren bei 13 s Abstand 2,2 Stunden. Der Nachrichten-Endpunkt kann aber einen ganzen
 * TAG ueber alle Ticker liefern (jeder Treffer traegt sein tickers-Feld); die Zuordnung
 * zu unseren 30 Symbolen passiert dann hier, ohne weiteren Abruf. Aus 600 Abrufen
 * werden 20 (plus Blaetterseiten).
 *
 * KEINE KURSE. Aus archiv1d wird AUSSCHLIESSLICH das Zeitstempel-Feld gelesen, um zu
 * wissen, welche Kalendertage Handelstage sind - kein Kurs, kein Volumen, kein Ertrag.
 * Ein Kalender ist keine Messung, aber der Unterschied gehoert benannt.
 *
 * TRUNKIERUNG IST EIN BEFUND: Bricht das Blaettern ab, ist die Zaehlung fuer diesen Tag
 * eine UNTERGRENZE und wird als solche ausgewiesen - nicht stillschweigend mitgemittelt.
 */
var https = require('https');
var fs = require('fs');
var path = require('path');
var M = require('../../tools/massive.js');
var Q = require('../../quant.js');

var SAAT = 20260901;
var N_SYM = 30, N_TAGE = 20;
var RUECKBLICK_TAGE = 2;      // Fenster je Stichtag: T-2 bis Handelsschluss T
var MAX_SEITEN = 6;

var KEY = M.schluessel();
function sicher(s) {
  s = String(s);
  s = s.split(KEY).join('<SCHLUESSEL>');
  if (KEY.length > 12) s = s.split(KEY.slice(0, 12)).join('<SCHLUESSEL>');
  return s;
}
function sage(x) { console.log(sicher(x)); }

function rng(s) { var a = s >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var letzter = 0;
async function abruf(pfad) {
  var seit = Date.now() - letzter;
  if (seit < M.ABSTAND_MS) await warte(M.ABSTAND_MS - seit);
  letzter = Date.now();
  return new Promise(function (res) {
    var u = new URL(pfad.indexOf('http') === 0 ? pfad : 'https://' + M.HOST + pfad);
    https.get({ host: u.host, path: u.pathname + u.search,
      headers: { Authorization: 'Bearer ' + KEY, Accept: 'application/json', 'User-Agent': 'markt-dashboard' },
      timeout: 30000 }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        var j = null; try { j = JSON.parse(b); } catch (e) { /* Text */ }
        res({ status: r.statusCode, j: j, treffer: j && j.results ? j.results.length : null,
              weiter: (j && j.next_url) || null, fehler: j && (j.error || j.message) || null });
      });
    }).on('error', function (e) { res({ status: 0, fehler: String(e.message) }); });
  });
}

/* ---- Handelstage: NUR die Zeitstempel aus archiv1d ---- */
function handelstage() {
  var f = 'E:/Markt-Dashboard-Archiv/archiv1d/bars_1d_AAPL.json';
  var ser = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  var raus = [];
  for (var i = 0; i < ser.length; i++) raus.push(new Date(ser[i][0]).toISOString().slice(0, 10));
  return raus;   // nur Feld 0. Kein Kurs verlassen diese Funktion.
}
function usSommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function schlussMs(tag) {
  var p = tag.split('-');
  var probe = Date.UTC(+p[0], +p[1] - 1, +p[2], 16);
  return Date.UTC(+p[0], +p[1] - 1, +p[2], usSommer(probe) ? 20 : 21, 0, 0);
}

(async function () {
  var fensterVon = process.argv[2] || '2024-09-03';   // erreichbares Fenster, aus Phase A/B
  sage('== Dichte-Zaehlung ==  Saat ' + SAAT + '  ' + N_SYM + ' Symbole x ' + N_TAGE + ' Handelstage');
  sage('Fenster ab ' + fensterVon + '   Rueckblick je Stichtag ' + RUECKBLICK_TAGE + ' Tage');

  /* Symbole: Zufallsziehung aus dem 1d-Archiv. UEBERLEBENDE - das ist eine
   * Verzerrung und wird als solche berichtet, nicht wegdiskutiert. */
  var alle = fs.readdirSync('E:/Markt-Dashboard-Archiv/archiv1d')
    .filter(function (f) { return /^bars_1d_/.test(f); })
    .map(function (f) { return f.replace(/bars_1d_|\.json/g, ''); }).sort();
  var r = rng(SAAT), syms = [];
  var kopie = alle.slice();
  while (syms.length < N_SYM && kopie.length) syms.push(kopie.splice(Math.floor(r() * kopie.length), 1)[0]);
  sage('Symbole: ' + syms.join(' '));

  var ht = handelstage().filter(function (t) { return t >= fensterVon; });
  /* Der jueng­ste Tag faellt weg: sein Nachrichtenfenster koennte noch wachsen. */
  ht = ht.slice(0, -1);
  var tage = [];
  var kopie2 = ht.slice();
  while (tage.length < N_TAGE && kopie2.length) tage.push(kopie2.splice(Math.floor(r() * kopie2.length), 1)[0]);
  tage.sort();
  sage('Handelstage (' + ht.length + ' zur Wahl): ' + tage.join(' '));
  sage('');

  /* ZWEITE SCHICHT, VOR DEM LAUF FESTGELEGT (nicht nachtraeglich gesucht):
   * Die 20,6 % der Empfehlung stammen aus unserem eigenen News-Archiv - und das
   * enthaelt 16 Grosswerte plus XOM. Ein Zufallszug aus 2.965 Archivnamen misst
   * etwas anderes. Beide Schichten laufen deshalb MIT DENSELBEN Abrufen mit; die
   * Frage "welches Universum braucht die Messung" ist genau der Unterschied.
   * Ein Tagesabruf liefert den ganzen Markt, beide Schichten kosten dasselbe. */
  var GROSS = ['AAPL', 'AMD', 'AMZN', 'ARM', 'ASML', 'AVGO', 'GOOG', 'GOOGL', 'INTC',
               'META', 'MSFT', 'MU', 'NVDA', 'QCOM', 'TSLA', 'TSM', 'XOM'];
  sage('Vergleichsschicht (unser bisheriges News-Archiv): ' + GROSS.length + ' Grosswerte');
  var symSatz = {}; syms.forEach(function (s) { symSatz[s] = 1; });
  GROSS.forEach(function (s) { symSatz[s] = 1; });
  var zeilen = [], truncTage = [];
  for (var i = 0; i < tage.length; i++) {
    var T = tage[i];
    var von = new Date(Date.parse(T + 'T00:00:00Z') - RUECKBLICK_TAGE * 86400000).toISOString().slice(0, 10);
    var cut = schlussMs(T);
    var pfad = '/v2/reference/news?published_utc.gte=' + von + '&published_utc.lte=' +
      new Date(cut).toISOString() + '&limit=1000&order=desc&sort=published_utc';
    var jeSym = {}, seiten = 0, gesamt = 0, abgeschnitten = false, status = null;
    var url = pfad;
    while (url && seiten < MAX_SEITEN) {
      var res = await abruf(url);
      status = res.status;
      if (res.status !== 200) { sage('  ' + T + ': HTTP ' + res.status + ' ' + sicher(String(res.fehler)).slice(0, 90)); break; }
      (res.j.results || []).forEach(function (a) {
        gesamt++;
        var t = Date.parse(a.published_utc);
        if (!(t <= cut)) return;                       // Look-ahead-Riegel
        (a.tickers || []).forEach(function (tk) {
          if (!symSatz[tk]) return;
          (jeSym[tk] = jeSym[tk] || []).push({ t: t, title: a.title || '' });
        });
      });
      seiten++;
      url = res.weiter;
      if (url && seiten >= MAX_SEITEN) abgeschnitten = true;
    }
    if (abgeschnitten) truncTage.push(T);
    function zaehle(liste) {
      var m = 0, s0 = 0;
      liste.forEach(function (s) {
        var items = (jeSym[s] || []).sort(function (a, b) { return a.t - b.t; }).slice(-12);
        if (!items.length) return;
        m++;
        if (Q.sentiment(items, cut).score !== 0) s0++;
      });
      return { mit: m, score: s0 };
    }
    var zz = zaehle(syms), zg = zaehle(GROSS);
    zeilen.push({ tag: T, status: status, artikelGesamt: gesamt, seiten: seiten,
      abgeschnitten: abgeschnitten, mitMeldung: zz.mit, mitScore: zz.score,
      grossMitMeldung: zg.mit, grossMitScore: zg.score });
    sage('  ' + T + '  HTTP ' + status + '  Artikel ' + String(gesamt).padStart(4) +
      ' (' + seiten + ' S.' + (abgeschnitten ? ', ABGESCHNITTEN' : '') + ')   ' +
      'Zufall ' + String(zz.mit).padStart(2) + '/' + N_SYM + ' (Score ' + String(zz.score).padStart(2) + ')' +
      '   Grosswerte ' + String(zg.mit).padStart(2) + '/' + GROSS.length + ' (Score ' + String(zg.score).padStart(2) + ')');
  }

  var nGut = zeilen.filter(function (z) { return z.status === 200 && !z.abgeschnitten; });
  function fasse(felderM, felderS, n) {
    var m = nGut.reduce(function (a, b) { return a + b[felderM]; }, 0);
    var s = nGut.reduce(function (a, b) { return a + b[felderS]; }, 0);
    var nenner = nGut.length * n;
    return { mit: m, score: s, nenner: nenner, aM: m / nenner, aS: s / nenner };
  }
  var zufall = fasse('mitMeldung', 'mitScore', N_SYM);
  var gross = fasse('grossMitMeldung', 'grossMitScore', GROSS.length);
  sage('');
  sage('Auswertbare Tage: ' + nGut.length + '/' + tage.length +
       (truncTage.length ? '  (abgeschnitten: ' + truncTage.join(',') + ')' : ''));
  [['ZUFALLSZUG aus 2.965 Archivnamen', zufall], ['GROSSWERTE (unser bisheriges Archiv)', gross]].forEach(function (p) {
    sage('');
    sage(p[0] + ' - ' + p[1].nenner + ' Symbol-Tage:');
    sage('  mit mindestens einer Meldung: ' + String(p[1].mit).padStart(4) + '  = ' + (100 * p[1].aM).toFixed(1) + ' %');
    sage('  davon Score != 0:             ' + String(p[1].score).padStart(4) + '  = ' + (100 * p[1].aS).toFixed(1) + ' % aller Symbol-Tage');
  });
  sage('');
  sage('Die Empfehlung vom 01.09. hatte 20,6 % geschaetzt - aus 12 Tagen Grosswerte.');
  fs.writeFileSync(path.join(__dirname, 'dichte.json'), sicher(JSON.stringify({
    saat: SAAT, symbole: syms, grosswerte: GROSS, tage: tage, rueckblickTage: RUECKBLICK_TAGE,
    zeilen: zeilen, auswertbar: nGut.length, zufall: zufall, gross: gross
  }, null, 1)));
  sage('dichte.json geschrieben.');
})();
