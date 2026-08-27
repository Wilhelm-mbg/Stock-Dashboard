'use strict';
/* Analytiker 27.08.2026: Splits-Abrufe fuer die Einzelsprung-Reihen (dritte
 * Kandidatenmenge, PM-Budget ~275 Calls). Ablage GETRENNT von der
 * vorregistrierten Menge: studien/analytiker/2026-08-27/einzelspruenge/<SYM>.json,
 * gleiches Format, abgedeckt: ['split'] (Dividenden bewusst nicht - eine
 * Bardividende erzeugt keinen Faktor-2-Sprung, und das Budget ist begrenzt).
 * Reihen, deren Ereignisse schon in der Eich-/29er-Menge liegen, werden NICHT
 * erneut abgerufen (Verweis im hinweis-Feld). Zuerst ein gezielter
 * Ticker-Events-Abruf QXO fuer die Rolle Berechnungen. NUR LESEN. */
var fs = require('fs'), path = require('path');
var M = require(path.join(__dirname, '..', '..', '..', 'tools', 'massive.js'));
var ZIEL = path.join(__dirname, 'einzelspruenge');
var FREMD = path.join(__dirname, '..', '..', 'vorregistrierung-2026-08-27-skalenfehler', 'ereignisse');
fs.mkdirSync(ZIEL, { recursive: true });
var KONVENTION = 'faktor bei art=split: Kursfaktor am Ausfuehrungstag = split_from/split_to (Reverse 4:1 -> 4; Forward 1:4 -> 0.25). datum: execution_date.';
var liste = require('./einzelspruenge-liste.json');
var syms = Object.keys(liste).sort();

(async function () {
  var key = M.schluessel();

  /* 1) QXO-Ticker-Events fuer c4 (Trennfall-Zeuge) */
  try {
    var q = await M.hole('/vX/reference/tickers/QXO/events', key);
    var r = q.results || q;
    fs.writeFileSync(path.join(__dirname, 'qxo-ticker-events.json'), JSON.stringify(r, null, 1));
    console.log('QXO Ticker-Events: ' + JSON.stringify(r).slice(0, 300));
  } catch (e) { console.log('QXO Ticker-Events FEHLER: ' + e.message); }

  /* 2) Splits je Einzelsprung-Reihe */
  var geholt = 0, uebernommen = 0, fehler = 0;
  for (var i = 0; i < syms.length; i++) {
    var sym = syms[i];
    if (fs.existsSync(path.join(ZIEL, sym + '.json'))) { uebernommen++; continue; }
    var fremd = path.join(FREMD, sym + '.json');
    if (fs.existsSync(fremd)) {
      /* Ereignisse liegen schon aus der Eich-/29er-Menge - verweisen statt doppeln */
      uebernommen++;
      continue;
    }
    try {
      var j = await M.hole('/v3/reference/splits?ticker=' + sym + '&limit=1000', key);
      var res = (j.results || []).map(function (s) { return { datum: s.execution_date, art: 'split', faktor: s.split_from / s.split_to }; });
      fs.writeFileSync(path.join(ZIEL, sym + '.json'), JSON.stringify({
        sym: sym, ereignisse: res,
        quelle: 'Massive REST /v3/reference/splits (Bearer, Gratis-Stufe)',
        abgerufen: new Date().toISOString(),
        abgedeckt: ['split'],
        konvention: KONVENTION,
        hinweis: 'Dritte Kandidatenmenge (Einzelspruenge ohne Rueckkehr, PM-Budget 27.08.); Dividenden bewusst nicht abgerufen.',
      }, null, 1));
      geholt++;
      if (geholt % 10 === 0) console.log(geholt + ' geholt, ' + uebernommen + ' uebernommen (' + (i + 1) + '/' + syms.length + ')');
    } catch (e) { fehler++; console.log(sym + ': FEHLER ' + String(e.message).slice(0, 120)); }
  }
  console.log('FERTIG: ' + geholt + ' geholt, ' + uebernommen + ' aus vorhandenen Mengen, ' + fehler + ' Fehler, gesamt ' + syms.length);
})().catch(function (e) { console.log('ABBRUCH: ' + e.message); process.exit(1); });
