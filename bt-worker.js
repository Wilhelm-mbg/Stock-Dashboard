'use strict';
/* Backtest-Worker: rechnet Backtests in eigenem Thread, damit die Oberfläche flüssig bleibt.
   Datensatz-Cache: Die Kurskarte wird je Worker EINMAL übertragen und danach nur noch per
   Kennung referenziert. Vorher wurde sie mit JEDEM Auftrag serialisiert - beim 36er-Raster
   des Feinschliffs auf einem vollen 90-Tage-Archiv wären das Gigabytes an Kopierarbeit,
   die die Nacht-Messung von Minuten auf Stunden gestreckt hätten. */
importScripts('quant.js');
var karten = {};
self.onmessage = function (e) {
  var m = e.data;
  // Lebenszeichen: sofort und ohne Rechenarbeit beantworten.
  if (m.ping) { self.postMessage({ pong: 1 }); return; }
  if (m.evict) { delete karten[m.evict]; return; }
  try {
    if (m.map) karten[m.mapId] = m.map;
    var histMap = m.map || karten[m.mapId];
    if (!histMap) throw new Error('Datensatz ' + m.mapId + ' nicht im Worker-Cache');
    var Q = self.Quant;
    var res = m.fn === 'daily' ? Q.backtest(histMap, m.opts) : Q.backtestIntraday(histMap, m.opts);
    self.postMessage({ id: m.id, ok: true, res: res });
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, msg: String((err && err.message) || err) });
  }
};
