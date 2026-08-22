'use strict';
/* STUDIEN-DEFINITION "vwap-Abstand" (kein eigenstaendiges Live-Signal!).
   In der App ist VWAP nur eine Leitlinien-Option (lineType 'vwap') fuer signalCross /
   reversionSignal / pullbackSignal / waveQuality (quant.js:791/888/934). Live laeuft
   lineType 'ema' (depot.json: lineType "ema", mode "rsi2seit").
   Zwei Varianten, beide mit den App-Funktionen gerechnet:
     'abstand' = Q.reversionSignal(bars,'vwap',period,zThr): Abstand zur Tages-VWAP
                 ueberdehnt (zentrierter z-Score ueber die letzten 80 Bars) UND letzte
                 Kerze dreht zurueck  -> call (unter VWAP) / put (ueber VWAP)
     'kreuz'   = Q.signalCross(bars,'vwap',period,confirmBps): Schluss kreuzt VWAP mit
                 Bestaetigung confirmBps -> call (up) / put (down)
   Live-Standardparameter aus D.intraday: period 20, confirmBps 15, zThr = zOf(15) = 2.0 */
var Q = require('../../../quant.js');

var DEFAULTS = { variante: 'abstand', period: 20, confirmBps: 15, zThr: 2.0 };

function vwapSignal(bars, ci, params) {
  var p = Object.assign({}, DEFAULTS, params || {});
  var b = bars.slice(0, ci + 1);            // Praefix: nichts nach ci ist sichtbar
  if (b.length < 2 || b[0].length < 3) return null;   // ohne Volumen gibt es keine VWAP
  var s;
  if (p.variante === 'kreuz') {
    s = Q.signalCross(b, 'vwap', p.period, p.confirmBps);
    return s.crossed === 'up' ? { dir: +1 } : s.crossed === 'down' ? { dir: -1 } : null;
  }
  s = Q.reversionSignal(b, 'vwap', p.period, p.zThr);
  return s.signal === 'call' ? { dir: +1 } : s.signal === 'put' ? { dir: -1 } : null;
}

module.exports = { vwapSignal: vwapSignal, DEFAULTS: DEFAULTS };
