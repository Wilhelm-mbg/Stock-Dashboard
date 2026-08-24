'use strict';
/* WIE VIEL VOM MARKT SIEHT DIE APP EIGENTLICH?
 *
 * Drei Fragen, drei Messungen:
 *   1. Welchen Anteil des handelbaren Marktes deckt das Archiv ab - nach Zahl der
 *      Werte UND nach Umsatz? Ein Archiv mit 191 von 3.263 Werten kann trotzdem
 *      die Haelfte des Geldes abdecken, wenn es die richtigen sind.
 *   2. Welche grossen Werte FEHLEN? Das ist die konkrete Luecke.
 *   3. Welche FELDER fehlen je Kerze? Das Archiv speichert [Zeit, Schluss, Umsatz,
 *      Hoch, Tief] - fuenf Werte. Die Quellen liefern mehr.
 *
 * Grundlage ist das Punkt-in-Zeit-Universum (tools/universum-punkt-in-zeit.js),
 * also die Liquiditaet VON DAMALS - nicht von heute. Sonst misst man mit, wer
 * ueberlebt hat.
 *
 * Aufruf: node tools/abdeckung-pruefen.js
 * Es wird nichts geaendert.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var STORE = process.env.MD_STORE || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');

function zahl(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

/* Was liegt im Archiv? */
var imArchiv = {};
fs.readdirSync(STORE).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
  .forEach(function (f) { imArchiv[f.slice(9, -5)] = 1; });
var nArchiv = Object.keys(imArchiv).filter(function (s) { return s.indexOf('-USD') === -1; }).length;

/* Das Universum von damals. */
var uniDat = fs.existsSync(MASSIVE) ? fs.readdirSync(MASSIVE).filter(function (f) { return f.indexOf('universum-') === 0; }) : [];
if (!uniDat.length) { console.error('Kein Punkt-in-Zeit-Universum. Erst: node tools/universum-punkt-in-zeit.js'); process.exit(2); }
var U = JSON.parse(fs.readFileSync(path.join(MASSIVE, uniDat[0]), 'utf8'));
var werte = (U.werte || []).slice().sort(function (a, b) { return b.umsatzMio - a.umsatzMio; });

console.log('ABDECKUNG  ·  Archiv gegen den Markt von ' + U.stichtag);
console.log('='.repeat(76));
console.log('\nArchiv: ' + nArchiv + ' Aktien.  Universum von damals: ' + zahl(werte.length) +
  ' Werte ueber ' + U.schwelleMio + ' Mio $ Tagesumsatz.\n');

/* --- 1) Abdeckung nach Rang --- */
console.log('1) WIE VIEL DECKT DAS ARCHIV AB?\n');
console.log('   Rang nach Umsatz    im Archiv    Anteil der Werte    Anteil des Umsatzes');
[50, 100, 200, 500, 1000, werte.length].forEach(function (n) {
  var top = werte.slice(0, n);
  var drin = top.filter(function (x) { return imArchiv[x.sym]; });
  var umsGes = top.reduce(function (a, x) { return a + x.umsatzMio; }, 0);
  var umsDrin = drin.reduce(function (a, x) { return a + x.umsatzMio; }, 0);
  console.log('   Top ' + String(n).padEnd(16) + String(drin.length).padStart(9) +
    (100 * drin.length / n).toFixed(1).padStart(17) + ' %' +
    (100 * umsDrin / umsGes).toFixed(1).padStart(19) + ' %');
});

/* --- 2) Was fehlt --- */
console.log('\n2) DIE GROESSTEN FEHLENDEN WERTE\n');
var fehlt = werte.filter(function (x) { return !imArchiv[x.sym]; });
console.log('   ' + zahl(fehlt.length) + ' der ' + zahl(werte.length) + ' Werte fehlen im Archiv.');
console.log('   Die 30 groessten davon (Median-Tagesumsatz in Mio $):\n');
for (var r = 0; r < 30 && r < fehlt.length; r += 5) {
  console.log('   ' + fehlt.slice(r, r + 5).map(function (x) {
    return (x.sym + ' ' + Math.round(x.umsatzMio)).padEnd(14);
  }).join(''));
}
/* Und umgekehrt: was liegt im Archiv, das damals gar nicht liquide war? */
var imUni = {};
werte.forEach(function (x) { imUni[x.sym] = 1; });
var ueberzaehlig = Object.keys(imArchiv).filter(function (s) {
  return s.indexOf('-USD') === -1 && s.indexOf('.DE') === -1 && !imUni[s];
});
console.log('\n   Umgekehrt: ' + ueberzaehlig.length + ' Archivwerte stehen NICHT im Universum von damals');
if (ueberzaehlig.length) console.log('   (' + ueberzaehlig.slice(0, 12).join(' ') + (ueberzaehlig.length > 12 ? ' …' : '') + ')');

/* --- 3) Welche Felder fehlen --- */
console.log('\n3) WELCHE FELDER FEHLEN JE KERZE?\n');
var bsp = null;
try { bsp = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_AAPL.json'), 'utf8')).series[0]; } catch (e) { }
console.log('   Archiv speichert je Kerze ' + (bsp ? bsp.length : '?') + ' Werte:');
console.log('     [Zeitstempel, Schlusskurs, Umsatz, Hoch, Tief]');
console.log('\n   Was die Quellen ausserdem liefern:');
console.log('     ERÖFFNUNGSKURS   Yahoo: ja (wird verworfen)   Massive: ja (o)');
console.log('     VWAP             Yahoo: nein                  Massive: ja (vw)');
console.log('     Zahl der Trades  Yahoo: nein                  Massive: ja (n)');
console.log('     bereinigt        Yahoo: adjclose (verworfen)  Massive: adjusted=true');
console.log('\n   Der Eroeffnungskurs ist die spuerbare Luecke. Ohne ihn muss jede');
console.log('   Ausstiegsregel den Schluss der VORKERZE als Naeherung fuer den ersten');
console.log('   handelbaren Kurs nehmen (messmaschine.js, fuehreAus). Bei einer');
console.log('   Uebernachtluecke ist das genau der Kurs, den es nicht mehr gibt.');

/* Wie oft faellt das ins Gewicht? Uebernachtluecken zaehlen. */
var luecken = 0, kerzen = 0, gross = 0;
Object.keys(imArchiv).filter(function (s) { return s.indexOf('-USD') === -1; }).slice(0, 40).forEach(function (sym) {
  try {
    var s = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_' + sym + '.json'), 'utf8')).series || [];
    for (var i = 1; i < s.length; i++) {
      kerzen++;
      var vor = new Date(s[i - 1][0]).getUTCDate(), jetzt = new Date(s[i][0]).getUTCDate();
      if (vor !== jetzt) {
        luecken++;
        var spr = Math.abs(s[i][1] / s[i - 1][1] - 1);
        if (spr > 0.01) gross++;
      }
    }
  } catch (e) { }
});
if (kerzen) {
  console.log('\n   Gemessen auf 40 Werten: ' + zahl(luecken) + ' Uebernachtluecken in ' + zahl(kerzen) + ' Kerzen (' +
    (100 * luecken / kerzen).toFixed(1) + ' %),');
  console.log('   davon ' + zahl(gross) + ' mit ueber 1 % Sprung (' + (100 * gross / Math.max(1, luecken)).toFixed(1) +
    ' % der Luecken). Genau dort ist die Naeherung falsch.');
}

console.log('\n' + '='.repeat(76));
console.log('Fertig. Es wurde nichts geaendert.');
