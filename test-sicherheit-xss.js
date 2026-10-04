'use strict';
/* Sicherheitspruefung 2026-10, Fund 2 (Bericht 02-electron-haertung, F3 und F10):
 * Fremdtext darf nicht als HTML in der Oberflaeche landen.
 *
 * Geprueft wird VERHALTEN, nicht nur Textmarken: die betroffenen Funktionen werden
 * aus dem Quelltext geschnitten und mit boesartigen Eingaben gefuettert - einem
 * Basiswert-Namen mit <img>, einer Waehrung mit <a href>, einem ' fuer Attribute.
 *
 * SICHERHEIT_QUELLE=<ordner> laesst denselben Test gegen eine andere Fassung der
 * Dateien laufen (z. B. die alte aus `git show HEAD:...`) - damit ist belegt, dass
 * er die Luecke ueberhaupt sieht. Ohne die Variable gilt das Repo-Verzeichnis. */
var fs = require('fs');
var path = require('path');

var QUELLE = process.env.SICHERHEIT_QUELLE ? path.resolve(process.env.SICHERHEIT_QUELLE) : __dirname;
var fehler = 0, gut = 0;
function ok(bed, text, info) {
  if (bed) { gut++; console.log('  ✅ ' + text); }
  else { fehler++; console.log('  ❌ ' + text + (info !== undefined ? '  → ' + String(info).slice(0, 300) : '')); }
}
function lies(datei) { return fs.readFileSync(path.join(QUELLE, datei), 'utf8'); }
/* Textausschnitt von `von` bis vor `bis`. Fehlt eine Marke, wird das laut - ein
 * indexOf von -1 darf nicht still bis zum Dateiende durchschneiden (CLAUDE.md). */
function ausschnitt(text, von, bis, datei) {
  var a = text.indexOf(von);
  if (a < 0) throw new Error('Marke fehlt in ' + datei + ': ' + von);
  var b = text.indexOf(bis, a + von.length);
  if (b < 0) throw new Error('Endmarke fehlt in ' + datei + ': ' + bis);
  return text.slice(a, b);
}
function versuch(name, fn) {
  try { fn(); } catch (e) { ok(false, name + ' – Aufbau gescheitert', e && e.message); }
}

var BOESER_NAME = 'CALL<img src=x onerror=alert(1)>';
var BOESE_WAEHRUNG = '<a href=https://evil.example>EUR</a>';
function ohneMarkup(html) { return !/<img|<a /i.test(html); }

console.log('Sicherheit: HTML-Injektion (Quelle: ' + QUELLE + ')');

/* ---------- 1) U.esc aus app-shell.js: die echte Zeile, nicht eine Kopie ---------- */
var esc = null;
versuch('U.esc', function () {
  var as = lies('app-shell.js');
  var zeile = ausschnitt(as, 'esc: function (s) {', '\n', 'app-shell.js');
  esc = new Function('return ' + zeile.slice('esc: '.length).replace(/,\s*$/, ''))();
});
if (esc) {
  console.log('\n1) U.esc');
  ok(esc("'") === '&#39;', "U.esc(\"'\") ergibt &#39;", esc("'"));
  ok(esc("' onmouseover=alert(1) '").indexOf("'") < 0, 'U.esc laesst kein rohes \' durch (Attribut in einfachen Anfuehrungszeichen)', esc("' onmouseover=alert(1) '"));
  ok(esc('<b>"&') === '&lt;b&gt;&quot;&amp;', 'U.esc escapt weiter & < > "', esc('<b>"&'));
  ok(esc(null) === '' && esc(undefined) === '', 'U.esc macht aus null/undefined weiter den leeren Text');
}
var U = {
  esc: esc || function (s) { return String(s); },
  nf2: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
};

/* ---------- 2) Schein-Finder: Kennung und Waehrung ---------- */
var WKN = null;
versuch('wkn.js laden', function () { WKN = require(path.join(QUELLE, 'wkn.js')); });

var SF = null;
versuch('Schein-Finder-Ausschnitt', function () {
  var sf = lies('scheinfinder.js');
  var src = ausschnitt(sf, '  function kennung(k) {', '  function nameZu(', 'scheinfinder.js') +
    ausschnitt(sf, '  function abweichungText(k, s) {', '  function wahlLesenAusDOM(', 'scheinfinder.js') +
    ausschnitt(sf, '  var STUFENTEXT = ', '  var SPALTENTIP = ', 'scheinfinder.js');
  SF = new Function('window', 'U', 'BW_NAME', 'BASIS', 'RASTER', 'WKN_TREFFER', 'wknZelle',
    src + '\nreturn { kennung: kennung, echteBlock: echteBlock, zelle: zelle };');
});
if (SF) {
  console.log('\n2) Schein-Finder (onvista-Daten)');
  var k = { dir: 'call', strike: 200, ratio: 0.1, restTage: 30, stufe: 3, stufenGruende: [], spreadPct: 1 };
  var basis = { sym: 'AAPL', spot: 200, iv: 0.3, stand: Date.UTC(2026, 9, 4) };
  var mitKern = { WKN: { kern: WKN || {} } };
  [['mit wkn.js', mitKern], ['Notform ohne wkn.js', {}]].forEach(function (fall) {
    var f = SF(fall[1], U, BOESER_NAME, basis, [k], {}, function () { return ''; });
    var zelle = f.zelle(k, 'kennung', 0);
    ok(ohneMarkup(zelle) && zelle.indexOf('&lt;IMG') >= 0,
       'Kennungszelle (' + fall[0] + '): boeser Basiswert-Name erscheint als Text, nicht als <img>', zelle);
  });
  var schein = {
    wkn: 'AB1234', isin: 'DE000AB12345', name: 'X', emittent: 'Bank', strike: 200, faellig: Date.UTC(2026, 10, 1),
    restTage: 28, ratio: 0.1, geld: 1, brief: 1.1, waehrung: BOESE_WAEHRUNG, stand: Date.UTC(2026, 9, 4),
    spanneGesamtPct: 2, iv: 30, passt: true, kursFraglich: false
  };
  var f2 = SF(mitKern, U, 'APPLE', basis, [k], { 0: { status: 'ok', scheine: [schein] } }, function () { return ''; });
  var block = f2.echteBlock(0);
  ok(ohneMarkup(block) && block.indexOf('&lt;a href') >= 0,
     'Kurszelle: boese Waehrung erscheint als Text, nicht als Link', block.slice(block.indexOf('1,00 / 1,10'), block.indexOf('1,00 / 1,10') + 80));

  /* Die aufgeklappte Zeile (insertAdjacentHTML im Klick-Handler) laesst sich ohne DOM
   * nicht laufen lassen. Dort genuegt die Gegenprobe am Quelltext: kein Aufruf von
   * kennung(k) ausserhalb von U.esc(...) - ausser der Definition selbst. */
  var sfText = lies('scheinfinder.js');
  var alleAufrufe = sfText.split('kennung(k)').length - 1;
  var escAufrufe = sfText.split('U.esc(kennung(k))').length - 1;
  ok(alleAufrufe >= 3 && escAufrufe === alleAufrufe - 1,
     'Schein-Finder: jeder Aufruf von kennung(k) ausser der Definition steht in U.esc(...)',
     alleAufrufe + ' Aufrufe, ' + escAufrufe + ' escapt');
}

/* ---------- 3) wkn.js: schon am Eingang saeubern (zweite Wand) ---------- */
if (WKN) {
  console.log('\n3) wkn.js (Eingang der onvista-Antwort)');
  var bw = WKN.basiswertWaehlen([{ entityType: 'STOCK', entityValue: '1', name: 'Apple<img src=x onerror=alert(1)>', homeSymbol: 'AAPL' }], 'AAPL', null);
  ok(bw && !/[<>"']/.test(bw.name) && bw.name.indexOf('Apple') === 0,
     'Basiswert-Name kommt ohne < > " \' aus wkn.js', bw && bw.name);
  var bw2 = WKN.basiswertWaehlen([{ entityType: 'STOCK', entityValue: '2', name: 'AT&T Inc.', homeSymbol: 'T' }], 'T', null);
  ok(bw2 && bw2.name === 'AT&T Inc.', 'Gegenprobe: ein harmloser Name mit & bleibt unveraendert', bw2 && bw2.name);
  var roh2 = function (cur) {
    return { list: [{ instrument: { wkn: 'AB1234' }, strikeAbs: 200, dateMaturity: '2026-11-01', quote: { bid: 1, ask: 1.1, isoCurrency: cur } }] };
  };
  var n1 = WKN.normalisiere(roh2(BOESE_WAEHRUNG), Date.UTC(2026, 9, 4));
  ok(n1.length === 1 && !n1[0].waehrung, 'isoCurrency mit Markup wird verworfen', n1[0] && n1[0].waehrung);
  var n2 = WKN.normalisiere(roh2('EUR'), Date.UTC(2026, 9, 4));
  ok(n2.length === 1 && n2[0].waehrung === 'EUR', 'Gegenprobe: EUR bleibt EUR', n2[0] && n2[0].waehrung);
}

/* ---------- 4) Rueckfaelle in marktui.js / marktkarteui.js ---------- */
console.log('\n4) Rueckfall-esc ohne U.esc');
['marktui.js', 'marktkarteui.js'].forEach(function (datei) {
  versuch(datei, function () {
    var t = lies(datei);
    var zeile = ausschnitt(t, '  function esc(x) {', '\n', datei);
    var mach = new Function('window', 'U', zeile + '\nreturn esc;');
    var ohne = mach({}, {})(BOESER_NAME);
    ok(ohne.indexOf('<') < 0, datei + ': fehlt U.esc, kommt Fremdtext NICHT roh heraus', ohne);
    var mit = mach({ U: U }, {})(BOESER_NAME);
    ok(mit === U.esc(BOESER_NAME), datei + ': ist window.U.esc da, wird damit escapt', mit);
  });
});

/* ---------- 5) depot.js: Datum der Messung ---------- */
console.log('\n5) depot.js');
versuch('depot.js', function () {
  var d = lies('depot.js');
  ok(d.indexOf('"<br>Messung vom " + kante.datum') < 0 && d.indexOf('"<br>Messung vom " + U.esc(kante.datum)') >= 0,
     'depot.js: kante.datum geht nur durch U.esc ins HTML');
});

console.log('\n' + (fehler ? '❌ ' + fehler + ' Fehlschlag/Fehlschläge, ' : '✅ ') + gut + ' bestanden');
process.exit(fehler ? 1 : 0);
