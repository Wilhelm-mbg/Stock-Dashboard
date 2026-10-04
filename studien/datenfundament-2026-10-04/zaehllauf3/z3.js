'use strict';
/* Z3 - gemeinsame Orte und reine Regeln des DRITTEN Zaehllaufs der Gruende-Tafel (Auftrag Nr. 90, 04.10.2026).
 *
 * Baut auf ../gemeinsam.js (Nr. 79) und den Arbeitsdateien aus ../phase2/ (Nr. 86) auf - per require bzw. nur lesend.
 * Geschrieben wird NUR in diesen Ordner (studien/datenfundament-2026-10-04/zaehllauf3/). Nichts auf E:, keine Tafel,
 * kein Panel. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');

var HIER = __dirname;
var P2 = path.join(G.HIER, 'phase2');                                              // Arbeitsdateien des zweiten Laufs (nur lesen)
var POLYGON_NEU = path.join(G.DATEN, 'massive', 'verschwundene-2026-10-04.json');   // V1: die NEUE Abgangsliste (nur lesen)
var MASSN_NACHTRAG = G.ARCHIV + '/alpaca-massnahmen-nachtrag-2026-10';              // V8: Nachtrag (nur lesen)
var KENNUNG = 'datenfundament-2026-10-04/zaehllauf3 (KEINE Tafel)';
var MAX_ANFRAGEN = 3000;                                                            // Auftrag 3: hoechstens 3.000 EDGAR-Anfragen im Ganzen
var ANFRAGEN = path.join(HIER, 'edgar-anfragen.json');

function schreibe(name, obj) { var p = path.join(HIER, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }
function lies(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }

/** Die neue Polygon-Liste, je Kuerzel alle Eintraege - gleiche Form wie G.polygon(). */
var POLY = null;
function polygonNeu() {
  if (POLY) return POLY;
  var j = G.json(POLYGON_NEU), je = {};
  (j.eintraege || []).forEach(function (e) { (je[e.sym] = je[e.sym] || []).push({ bis: e.bis || null, name: e.name || null, cik: e.cik || null }); });
  POLY = { stand: j.stand, abruftag: j.abruftag || null, n: (j.eintraege || []).length, je: je };
  return POLY;
}

/* ---------- V1: Namensprobe (wortgleich der Vergleich aus ../phase2/t4-auswerten.js, Zeilen 44-56 und 129-133) ---------- */
function nameKern(s) {
  return String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\b(THE|INC|INCORPORATED|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|PLC|LLC|LP|NV|SA|AG|SE|HOLDINGS?|GROUP|COMMON|STOCK|SHARES?|ORDINARY|CLASS|A|B|C|NEW|DE|MD|NY|CA|TRUST|AMERICAN|DEPOSITARY|ADS|ADR|EACH|REPRESENTING|PAR|VALUE|OF|AND)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function nameAehnlich(a, b) {
  var x = nameKern(a), y = nameKern(b);
  if (!x || !y) return false;
  if (x === y || x.indexOf(y) === 0 || y.indexOf(x) === 0) return true;
  var p = x.split(' ')[0], q = y.split(' ')[0];
  if (p.length >= 4 && p === q) return true;
  return x.replace(/ /g, '').slice(0, 6) === y.replace(/ /g, '').slice(0, 6);
}
/** Passt der Auszug S (EDGAR: name, frueher, tickers) zum Polygon-Eintrag?
 *  'passt' | 'frueher' (nur ein frueherer Name passt) | 'kuerzel' (nur das Kuerzel steht bei EDGAR) | 'nichts' | 'ohne-auszug' */
function namensprobe(S, polygonName, basis) {
  if (!S || S.fehlt) return 'ohne-auszug';
  if (nameAehnlich(S.name, polygonName)) return 'passt';
  if ((S.frueher || []).some(function (f) { return nameAehnlich(f, polygonName); })) return 'frueher';
  var tk = (S.tickers || []).map(function (t) { return String(t).toUpperCase().replace(/\./g, '-'); });
  if (tk.indexOf(basis) !== -1) return 'kuerzel';
  return 'nichts';
}

/* ---------- Zaehler der EDGAR-Anfragen ueber alle Skripte dieses Ordners (Obergrenze MAX_ANFRAGEN) ---------- */
function anfragenStand() { return lies(ANFRAGEN) || { obergrenze: MAX_ANFRAGEN, gesamt: 0, laeufe: [] }; }
function anfragenBuchen(skript, n, mehr) {
  var j = anfragenStand();
  if (!n) return j.gesamt;
  j.gesamt += n;
  j.laeufe.push(Object.assign({ skript: skript, anfragen: n, stand: new Date().toISOString() }, mehr || {}));
  schreibe('edgar-anfragen.json', j);
  return j.gesamt;
}

/** Kursband des letzten Kurses (Auftrag 2.4). */
function band(k) { return k == null ? 'ohne Kurs' : k < 1 ? 'unter 1' : k < 5 ? '1-5' : k < 8 ? '5-8' : k <= 13 ? '8-13' : 'ueber 13'; }

module.exports = { HIER: HIER, P2: P2, POLYGON_NEU: POLYGON_NEU, MASSN_NACHTRAG: MASSN_NACHTRAG, KENNUNG: KENNUNG, MAX_ANFRAGEN: MAX_ANFRAGEN,
  schreibe: schreibe, lies: lies, polygonNeu: polygonNeu, nameKern: nameKern, nameAehnlich: nameAehnlich, namensprobe: namensprobe,
  anfragenStand: anfragenStand, anfragenBuchen: anfragenBuchen, band: band };
