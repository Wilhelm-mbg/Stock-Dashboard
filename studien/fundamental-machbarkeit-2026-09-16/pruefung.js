'use strict';
/* Schritt 4: Gegenproben gegen EDGAR selbst (frei, User-Agent mit Kontakt, hier 4 Anfragen/s, Deckel 10/s).
 *
 *  A) Fuenf Firmen je Quartal (eine je Umsatzklasse, bevorzugt sichere CIK-Zuordnung, Kern vorhanden): Umsatz und
 *     Gesamtvermoegen aus dem FSDS gegen die XBRL-API der SEC (companyconcept: je Tag alle je gemeldeten Werte mit
 *     Akzession, Stichtag, Formular und Einreichungsdatum). Gleiche Akzession => Wert, Stichtag, filed muessen stimmen.
 *     Das ist die zweite Aufbereitung derselben Einreichung durch die SEC, nicht dieselbe Tabelle.
 *  B) Neudarstellungen UEBER die Zeit (was zwei einzelne Quartale nicht sehen): fuer dieselben Firmen je (start, end)
 *     die Zahl verschiedener Werte ueber alle Filings, die diesen Zeitraum je berichtet haben.
 *  C) Unabhaengige Deckungszaehlung: die "frames"-API (alle Registranten mit Assets zum Stichtag CY2019Q1I bzw.
 *     CY2024Q1I) gegen die Panelreihen, die im FSDS ein Filing mit diesem Stichtag und Assets haben.
 *
 * Schreibt: pruefung.json. Cache der Antworten unter E:/Markt-Dashboard-Archiv/edgar-fsds/api-cache/.
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var zlib = require('zlib');

var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var RATE = 4;
var CACHE = 'E:/Markt-Dashboard-Archiv/edgar-fsds/api-cache';
if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
var fenster = [];
function takt() { return new Promise(function (ok) { (function v() { var t = Date.now(); fenster = fenster.filter(function (x) { return t - x < 1000; }); if (fenster.length < RATE) { fenster.push(t); return ok(); } setTimeout(v, 100); })(); }); }
var ANFRAGEN = 0;
function hole(url) {
  var name = path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^A-Za-z0-9._-]/g, '_'));
  if (fs.existsSync(name)) return Promise.resolve(JSON.parse(fs.readFileSync(name, 'utf8')));
  return takt().then(function () {
    return new Promise(function (ok, nein) {
      ANFRAGEN++;
      var req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Accept': 'application/json' } }, function (res) {
        var strom = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
        var teile = [];
        strom.on('data', function (d) { teile.push(d); });
        strom.on('end', function () {
          var txt = Buffer.concat(teile).toString('utf8');
          if (res.statusCode !== 200) return ok({ fehler: 'HTTP ' + res.statusCode });
          try { var j = JSON.parse(txt); fs.writeFileSync(name, txt); ok(j); } catch (e) { ok({ fehler: 'kein JSON' }); }
        });
        strom.on('error', nein);
      });
      req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); });
      req.on('error', nein);
    });
  });
}
function cik10(c) { return ('0000000000' + c).slice(-10); }
function concept(cik, tag) { return hole('https://data.sec.gov/api/xbrl/companyconcept/CIK' + cik10(cik) + '/us-gaap/' + tag + '.json'); }

var KLASSEN_REIHE = ['ab1000', '250-1000', '50-250', '5-50', 'unter5'];
var RANG = { tabelle: 0, stark: 1, mittel: 2, schwach: 3 };

async function main() {
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var deck = JSON.parse(fs.readFileSync(path.join(__dirname, 'deckung-reihen.json'), 'utf8'));
  var aus = { stand: new Date().toISOString(), kennung: 'fundamental-machbarkeit-2026-09-16/pruefung/v1', A: {}, B: {}, C: {} };
  var qs = Object.keys(panel.quartale);
  for (var qi = 0; qi < qs.length; qi++) {
    var qn = qs[qi], reihen = deck.reihen[qn];
    /* A) Auswahl: je Klasse die alphabetisch erste Reihe mit Kern und bester Zuordnung, ohne 20-F */
    var wahl = [];
    KLASSEN_REIHE.forEach(function (k) {
      var kand = reihen.filter(function (r) { return r.klasse === k && r.kern && r.filings.some(function (f) { return /^10-[KQ]$/.test(f.form); }); });
      kand.sort(function (a, b) { return (RANG[a.sicherheit] - RANG[b.sicherheit]) || (a.reihe < b.reihe ? -1 : 1); });
      if (kand.length) wahl.push(kand[0]);
    });
    var ergA = [], ergB = [];
    for (var i = 0; i < wahl.length; i++) {
      var r = wahl[i];
      var f = r.filings.filter(function (x) { return /^10-[KQ]$/.test(x.form); })[0];
      var werte = {};
      f.hat.forEach(function (h) { var m = h.match(/^(\w+):(\w+)=(.*)$/); if (m) werte[m[1]] = { tag: m[2], wert: +m[3] }; });
      var pruef = { reihe: r.reihe, cik: r.cik, klasse: r.klasse, sicherheit: r.sicherheit, adsh: f.adsh, form: f.form, period: f.period, filed: f.filed, felder: [] };
      var gruppen = ['umsatz', 'vermoegen'];
      for (var g = 0; g < gruppen.length; g++) {
        var w = werte[gruppen[g]]; if (!w) continue;
        var j = await concept(r.cik, w.tag);
        var feld = { gruppe: gruppen[g], tag: w.tag, fsds: w.wert, api: null, apiFiled: null, apiEnd: null, apiForm: null, stimmt: null };
        if (j && j.units) {
          var einheiten = Object.keys(j.units), alle = [];
          einheiten.forEach(function (u) { j.units[u].forEach(function (x) { x.uom = u; alle.push(x); }); });
          /* FSDS rundet period/ddate auf das Monatsende (Apple: 30.03. -> 31.03.); die API traegt den echten Stichtag.
           * Deshalb Toleranz +-7 Tage; die Abweichung wird als apiEnd ausgewiesen. */
          var treffer = alle.filter(function (x) { return x.accn === f.adsh && Math.abs(Date.parse(x.end) - Date.parse(f.period)) <= 7 * 86400000 && (x.start === undefined || gruppen[g] === 'umsatz'); });
          /* beim Umsatz die Dauer waehlen, die zum Formular passt (10-K Jahr, 10-Q das Quartal = kuerzeste Dauer) */
          if (gruppen[g] === 'umsatz' && treffer.length > 1) treffer.sort(function (a, b) { return (Date.parse(b.start) - Date.parse(a.start)); });
          if (gruppen[g] === 'umsatz' && f.form === '10-K') treffer.sort(function (a, b) { return (Date.parse(a.start) - Date.parse(b.start)); });
          var t = treffer[0];
          if (t) { feld.api = t.val; feld.apiFiled = t.filed; feld.apiEnd = t.end; feld.apiStart = t.start || null; feld.apiForm = t.form; feld.stimmt = (Math.abs(t.val - w.wert) <= 1e-6 * Math.max(1, Math.abs(w.wert)) && t.filed === f.filed) ? 1 : 0; }
          else feld.stimmt = 0;
          /* B) Neudarstellung ueber die Zeit: je (start,end) verschiedene Werte ueber alle Filings */
          var gr = {};
          alle.forEach(function (x) { var k = (x.start || '') + '..' + x.end + '|' + x.uom; (gr[k] = gr[k] || []).push(x); });
          var nZeitraum = 0, nMehrfach = 0, nVerschieden = 0, bsp = null;
          Object.keys(gr).forEach(function (k) {
            nZeitraum++;
            var xs = gr[k]; if (xs.length < 2) return;
            nMehrfach++;
            var v0 = xs[0].val;
            if (xs.some(function (x) { return Math.abs(x.val - v0) > 1e-6 * Math.max(1, Math.abs(v0)); })) {
              nVerschieden++;
              if (!bsp) bsp = { zeitraum: k, filings: xs.map(function (x) { return x.form + ' ' + x.filed + ' ' + x.val; }) };
            }
          });
          ergB.push({ reihe: r.reihe, tag: w.tag, zeitraeume: nZeitraum, mehrfachBerichtet: nMehrfach, verschieden: nVerschieden, beispiel: bsp });
        } else feld.api = j && j.fehler ? j.fehler : 'leer';
        pruef.felder.push(feld);
      }
      ergA.push(pruef);
    }
    aus.A[qn] = ergA; aus.B[qn] = ergB;

    /* C) frames: Assets zum Stichtag des letzten Kalenderquartals VOR dem Pruefquartal */
    var frame = 'CY' + qn.slice(0, 4) + 'Q1I', stich = qn.slice(0, 4) + '-03-31';
    var fr = await hole('https://data.sec.gov/api/xbrl/frames/us-gaap/Assets/USD/' + frame + '.json');
    var frameCiks = {};
    (fr.data || []).forEach(function (d) { frameCiks[String(d.cik)] = d; });
    var aktivCiks = {};
    panel.reihen.forEach(function (r) { if (r.cik && r.q[qn].aktiv) aktivCiks[r.cik] = r.reihe; });
    var imFrame = Object.keys(aktivCiks).filter(function (c) { return frameCiks[c]; });
    var fsdsStich = {};
    reihen.forEach(function (r) { if (r.cik && r.filings.some(function (f) { return f.period === stich && f.hat.some(function (h) { return h.indexOf('vermoegen:') === 0; }); })) fsdsStich[r.cik] = 1; });
    var beide = imFrame.filter(function (c) { return fsdsStich[c]; }).length;
    var nurFrame = imFrame.filter(function (c) { return !fsdsStich[c]; });
    var nurFsds = Object.keys(fsdsStich).filter(function (c) { return !frameCiks[c]; });
    /* nur-Frame: hat der Frame-Wert eine Akzession aus einem SPAETEREN Quartal (z. B. Vergleichszahl im naechsten 10-K)? */
    /* Zerlegung der Nur-Frame-Faelle: (1) Frame-Wert aus einer SPAETEREN Einreichung (Vergleichszahl im naechsten
     * 10-K - im Quartal noch nicht oeffentlich, der Frame ist nicht punkt-in-zeit), (2) im FSDS-Quartal gibt es ein
     * Filing, aber mit anderem Stichtag (abweichendes Geschaeftsjahr, der Frame nimmt den naechstliegenden Zeitraum),
     * (3) im Quartal gar kein periodisches Filing im FSDS. */
    var mitFilingImQ = {};
    reihen.forEach(function (r) { if (r.cik && r.filings.length) mitFilingImQ[r.cik] = 1; });
    /* Der Frame traegt kein filed-Feld, nur die Akzession; deren Stellen 12-13 sind das Einreichungsjahr.
     * "spaeter" = Akzession aus einem SPAETEREN Jahr als das Pruefquartal (Untergrenze: spaetere Quartale desselben
     * Jahres sind so nicht erkennbar). */
    var jahr = parseInt(qn.slice(2, 4), 10);
    var spaeter = 0, andererStichtag = 0, keinFiling = 0;
    nurFrame.forEach(function (c) {
      var a = frameCiks[c].accn || '', jj = parseInt(a.slice(11, 13), 10);
      if (jj > jahr) spaeter++; else if (mitFilingImQ[c]) andererStichtag++; else keinFiling++;
    });
    aus.C[qn] = { frame: frame, stichtag: stich, frameRegistranten: (fr.data || []).length, panelCiksAktiv: Object.keys(aktivCiks).length, panelCiksImFrame: imFrame.length,
      fsdsCiksMitAssetsAmStichtag: Object.keys(fsdsStich).length, beide: beide, nurFrame: nurFrame.length, nurFrameSpaeterEingereicht: spaeter, nurFrameAndererStichtag: andererStichtag, nurFrameKeinFiling: keinFiling, nurFsds: nurFsds.length,
      nurFsdsBeispiele: nurFsds.slice(0, 5).map(function (c) { return aktivCiks[c] + '/' + c; }), nurFrameBeispiele: nurFrame.slice(0, 5).map(function (c) { return aktivCiks[c] + '/' + c + ' ' + (frameCiks[c].accn || '') + ' ' + (frameCiks[c].filed || ''); }) };
    console.log(qn, 'A:', ergA.map(function (p) { return p.reihe + ' ' + p.form + ' ' + p.felder.map(function (f) { return f.gruppe + (f.stimmt ? ' OK' : ' ABWEICHUNG(' + f.fsds + ' vs ' + f.api + ' filed ' + f.apiFiled + ')'); }).join(','); }).join(' | '));
    console.log(qn, 'B:', ergB.map(function (b) { return b.reihe + ':' + b.tag.slice(0, 12) + ' ' + b.verschieden + '/' + b.mehrfachBerichtet; }).join(' | '));
    console.log(qn, 'C:', JSON.stringify(aus.C[qn]));
  }
  aus.anfragen = ANFRAGEN;
  fs.writeFileSync(path.join(__dirname, 'pruefung.json'), JSON.stringify(aus, null, 1));
  console.log('Anfragen an EDGAR:', ANFRAGEN);
}
main().catch(function (e) { console.error(e); process.exit(1); });
