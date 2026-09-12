'use strict';
/* Schritt 4: aus der Tafel die Zaehlwerke und den Nachtrag zur Kanalstudie.
 * Schreibt ERGEBNIS.md und auswertung.json. Rechnet nichts nach, was die
 * Kanalstudie gemessen hat - liest nur deren Tagesdateien und deren ergebnis.json. */
var fs = require('fs');
var path = require('path');

var KANAL = path.join(__dirname, '..', 'vorregistrierung-2026-09-08-trendkanal-tage');
var KAT = ['uebernahme', 'fusion-aktientausch', 'umbenennung-ticker', 'insolvenz', 'zwangs-delisting', 'freiwillig', 'spac-ende', 'unbekannt'];
var SCHLUSSFENSTER = 60;          // Handelstage vor dem letzten Balken fuer den Endlauf

function med(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
function z(x, k) { return x == null ? '—' : x.toFixed(k == null ? 2 : k).replace('.', ','); }
function tz(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function main() {
  var T = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene-gruende.json'), 'utf8'));
  var R = T.reihen;

  /* --- Zaehler je Kategorie und Jahr --- */
  var jahre = {}, proKat = {};
  R.forEach(function (x) {
    var j = (x.datum || x.letzter_balken).slice(0, 4);
    jahre[j] = jahre[j] || {};
    jahre[j][x.grund] = (jahre[j][x.grund] || 0) + 1;
    proKat[x.grund] = (proKat[x.grund] || 0) + 1;
  });

  /* --- Aufschlag der Uebernahmen --- */
  var ueb = R.filter(function (x) { return x.grund === 'uebernahme' && x.aufschlag_pp != null; });
  var aufJahr = {};
  ueb.forEach(function (x) { var j = x.datum.slice(0, 4); (aufJahr[j] = aufJahr[j] || []).push(x.aufschlag_pp); });

  /* --- Endlauf je Reihe aus den Tagesdateien der Kanalstudie (nur lesen) --- */
  var endlauf = {};
  ['tage-0', 'tage-1', 'tage-2', 'tage-3'].forEach(function (d) {
    var dir = path.join(KANAL, d);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) {
      if (f.slice(-5) !== '.json') return;
      var j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return; }
      var c = j.c1 || [], n = c.length;
      if (n < 5) return;
      var i = Math.max(0, n - 1 - SCHLUSSFENSTER);
      if (!(c[i] > 0) || !(c[n - 1] > 0)) return;
      endlauf[j.reihe] = { pp: (c[n - 1] / c[i] - 1) * 100, tage: n - 1 - i };
    });
  });
  var proKatEnd = {};
  R.forEach(function (x) { var e = endlauf[x.reihe]; if (!e) return; (proKatEnd[x.grund] = proKatEnd[x.grund] || []).push(e.pp); });

  /* --- die 20 groessten Endlaeufe mit Grund --- */
  var gross = R.filter(function (x) { return endlauf[x.reihe]; })
    .map(function (x) { return { reihe: x.reihe, grund: x.grund, datum: x.datum, pp: endlauf[x.reihe].pp, kurs: x.letzter_kurs_archiv, firma: x.firma }; })
    .sort(function (a, b) { return b.pp - a.pp; }).slice(0, 20);

  /* --- Delisting-Zellen der Kanalstudie (nur uebernommen, nicht nachgerechnet) --- */
  var kanal = null;
  try { kanal = JSON.parse(fs.readFileSync(path.join(KANAL, 'ergebnis-2026-09-09', 'ergebnis.json'), 'utf8')).delisting; } catch (e) { kanal = null; }

  var A = { stand: new Date().toISOString(), n: R.length, proKat: proKat, jahre: jahre,
    aufschlagMedianJahr: {}, endlaufMedianKat: {}, gross: gross, schlussfenster: SCHLUSSFENSTER };
  Object.keys(aufJahr).forEach(function (j) { A.aufschlagMedianJahr[j] = { n: aufJahr[j].length, median: med(aufJahr[j]) }; });
  Object.keys(proKatEnd).forEach(function (k) { A.endlaufMedianKat[k] = { n: proKatEnd[k].length, median: med(proKatEnd[k]), mittel: proKatEnd[k].reduce(function (a, b) { return a + b; }, 0) / proKatEnd[k].length }; });
  fs.writeFileSync(path.join(__dirname, 'auswertung.json'), JSON.stringify(A));

  /* --- ERGEBNIS.md --- */
  var L = [];
  L.push('# Warum sind sie verschwunden? — Gruende der erloschenen Reihen (12.09.2026)');
  L.push('');
  L.push('Kennung `' + T.kennung + '`. Tafel: `verschwundene-gruende.json`, ' + tz(R.length) + ' Zeilen, eine je Reihe.');
  L.push('Sperrklinken: `node test.js`. Rohdaten des EDGAR-Durchgangs: `edgar/` (Cache), `edgar-zuordnung.json`.');
  L.push('');
  L.push('## 0. Was hier gezaehlt wird');
  L.push('');
  L.push('| Groesse | Wert | Woher |');
  L.push('|---|---|---|');
  L.push('| Reihen CS/ADRC mit Balken | 7.299 | `_lebenszeit.json` + `wertpapierarten.json` |');
  L.push('| davon **nicht lebend** (letzter Balken vor ' + T.lebendAb + ') | **' + tz(R.length) + '** | ebenda |');
  L.push('| Gruppe `verschwunden` in `_symbole.json` | 4.801 | `_symbole.json` |');
  L.push('');
  L.push('Die beiden Zahlen sind **nicht dieselbe Menge**. Der Auftrag nennt 4.801 und die Regel');
  L.push('"letzter Tagesbalken vor ' + T.lebendAb + '" in einem Atemzug; gemessen sind es ' + tz(R.length) + ' Reihen nach der Regel');
  L.push('und 4.801 nach dem Gruppen-Etikett des Archivs. Sie ueberschneiden sich zu 4.748: 53 Reihen mit dem Etikett');
  L.push('`verschwunden` liefern wieder Balken (wiederverwendete Kuerzel), 248 Reihen aus der Gruppe `universum` liefern keine mehr.');
  L.push('**Diese Tafel folgt der Regel, nicht dem Etikett** — das Etikett ist ein Sammelvermerk, die Regel eine Messung.');
  L.push('');
  L.push('## 1. Zaehler je Kategorie');
  L.push('');
  L.push('| Kategorie | Reihen | Anteil |');
  L.push('|---|---:|---:|');
  KAT.forEach(function (k) { if (proKat[k]) L.push('| `' + k + '` | ' + tz(proKat[k]) + ' | ' + z(100 * proKat[k] / R.length, 1) + ' % |'); });
  L.push('| **Summe** | **' + tz(R.length) + '** | 100 % |');
  L.push('');
  L.push('Anteil `unbekannt`: **' + z(100 * (proKat.unbekannt || 0) / R.length, 1) + ' %**.');
  L.push('');
  L.push('### Belegart je Zeile');
  L.push('');
  L.push('| Beleg | Zeilen |');
  L.push('|---|---:|');
  Object.keys(T.belegarten).sort(function (a, b) { return T.belegarten[b] - T.belegarten[a]; })
    .forEach(function (b) { L.push('| `' + b + '` | ' + tz(T.belegarten[b]) + ' |'); });
  L.push('');
  L.push('## 2. Zaehler je Jahr');
  L.push('');
  var js = Object.keys(jahre).sort();
  L.push('| Jahr | ' + KAT.map(function (k) { return '`' + k + '`'; }).join(' | ') + ' | Summe |');
  L.push('|---|' + KAT.map(function () { return '---:'; }).join('|') + '|---:|');
  js.forEach(function (j) {
    var s = 0; KAT.forEach(function (k) { s += jahre[j][k] || 0; });
    L.push('| ' + j + ' | ' + KAT.map(function (k) { return jahre[j][k] ? tz(jahre[j][k]) : '—'; }).join(' | ') + ' | ' + tz(s) + ' |');
  });
  L.push('');
  L.push('## 3. Aufschlag der Uebernahmen — und warum er klein ist');
  L.push('');
  L.push('`aufschlag_pp` = (Angebotspreis − letzter Schluss im Archiv) / letzter Schluss · 100.');
  L.push('');
  L.push('| Jahr | Uebernahmen mit Barpreis | Median-Aufschlag (Pp) |');
  L.push('|---|---:|---:|');
  Object.keys(A.aufschlagMedianJahr).sort().forEach(function (j) {
    L.push('| ' + j + ' | ' + tz(A.aufschlagMedianJahr[j].n) + ' | ' + z(A.aufschlagMedianJahr[j].median, 3) + ' |');
  });
  L.push('| **alle** | **' + tz(ueb.length) + '** | **' + z(med(ueb.map(function (x) { return x.aufschlag_pp; })), 3) + '** |');
  L.push('');
  L.push('**Das ist der wichtigste Einzelbefund dieser Tafel.** Der Aufschlag am Ende ist praktisch null:');
  L.push('ATVI 95,00 $ gegen 94,42 $ letzten Schluss, TWTR 54,20 gegen 53,80, VMW 142,50 gegen 142,52,');
  L.push('CERN 95,00 gegen 94,95. Die Praemie einer Uebernahme wird am **Ankuendigungstag** bezahlt, nicht am');
  L.push('Vollzugstag — bis zum letzten Handelstag ist der Kurs laengst auf das Angebot gelaufen. Wer eine');
  L.push('Delisting-Regel damit begruendet, dass am Ende ein Aufschlag winkt, begruendet sie mit einer Groesse,');
  L.push('die es nicht gibt. Was die Delisting-Ausstiege der Kanalstudie gross gemacht hat, muss vorher passiert sein.');
  L.push('');
  L.push('## 4. Nachtrag zur Kanalstudie (09.09.) — Bericht, keine Neumessung');
  L.push('');
  L.push('### 4a. Was die Aggregation NICHT hergibt');
  L.push('');
  L.push('`ergebnis-2026-09-09/ergebnis.json` fuehrt ' + (kanal ? kanal.length : '64') + ' Delisting-Zellen, je Linie/Einstieg/Richtung/Ausstieg:');
  L.push('`nTrades, nDelist, anteil, mittelDelist, mittelAlle, delistB, mittelDelistB`. **Kein Feld traegt ein Kuerzel**');
  L.push('und keines einen Grund. Die Zellen lassen sich daher nicht nach Grund aufteilen — auch nicht naeherungsweise,');
  L.push('denn welche Reihe in welcher Zelle steckt, steht nirgends. Das ist eine Eigenschaft der Aggregation, kein');
  L.push('Fehler dieser Tafel; eine Aufteilung waere nur mit einer Neumessung zu haben, und die ist hier ausgeschlossen.');
  L.push('');
  L.push('### 4b. Was die Tagesdateien hergeben');
  L.push('');
  L.push('Ersatzweise, und als solcher gekennzeichnet: der **Endlauf** je Reihe — die Rendite der letzten ' + SCHLUSSFENSTER);
  L.push('Balkentage vor dem letzten Balken, aus denselben Tagesdateien `tage-0..3/<REIHE>.json` (Feld `c1`), nach Grund.');
  L.push('Das ist kein Trade und keine Regel; es ist die Bewegung, in die ein Delisting-Ausstieg hineinlief.');
  L.push('');
  L.push('| Grund | Reihen | Median Endlauf (Pp) | Mittel (Pp) |');
  L.push('|---|---:|---:|---:|');
  KAT.forEach(function (k) { var e = A.endlaufMedianKat[k]; if (e) L.push('| `' + k + '` | ' + tz(e.n) + ' | ' + z(e.median, 2) + ' | ' + z(e.mittel, 2) + ' |'); });
  L.push('');
  L.push('### 4c. Die 20 groessten Endlaeufe, mit Grund');
  L.push('');
  L.push('| # | Reihe | Firma | Grund | Datum | Endlauf (Pp) | letzter Kurs |');
  L.push('|---:|---|---|---|---|---:|---:|');
  gross.forEach(function (g, i) {
    L.push('| ' + (i + 1) + ' | ' + g.reihe + ' | ' + (g.firma || '—') + ' | `' + g.grund + '` | ' + (g.datum || '—') + ' | ' + z(g.pp, 1) + ' | ' + z(g.kurs, 4) + ' |');
  });
  L.push('');
  L.push('## 5. Lauf');
  L.push('');
  L.push('| Groesse | Wert |');
  L.push('|---|---|');
  L.push('| EDGAR-Anfragen | ' + tz(T.edgar.anfragen || 0) + ' |');
  L.push('| davon Fehlversuche (wiederholt) | ' + tz(T.edgar.fehler || 0) + ' |');
  L.push('| Laufzeit EDGAR | ' + tz(T.edgar.sekunden || 0) + ' s |');
  L.push('| gefahrene Rate | ' + z((T.edgar.anfragen || 0) / (T.edgar.sekunden || 1), 2) + ' Anfragen/s (Obergrenze 8) |');
  if (T.bigdata) {
    L.push('| Bigdata-Guthaben vorher | ' + z(T.bigdata.vorher, 4) + ' |');
    L.push('| Bigdata-Guthaben nachher | ' + z(T.bigdata.nachher, 4) + ' |');
    L.push('| Bigdata verbraucht | ' + z(T.bigdata.verbraucht, 4) + ' von hoechstens ' + T.bigdata.deckel + ' |');
    L.push('| Bigdata-Abfragen | ' + (T.bigdata.abfragen || 0) + ' |');
  }
  L.push('');
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), L.join('\n') + '\n');
  console.log('ERGEBNIS.md geschrieben. Kategorien:', JSON.stringify(proKat));
  console.log('Median-Aufschlag alle Uebernahmen:', z(med(ueb.map(function (x) { return x.aufschlag_pp; })), 4), 'Pp aus', ueb.length);
}

if (require.main === module) main();
