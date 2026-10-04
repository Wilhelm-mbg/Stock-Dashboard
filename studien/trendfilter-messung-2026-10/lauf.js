'use strict';
/* Trendfilter-Messung: DER EINE LAUF (REGEL.md §9.2). Aufruf aus der Repo-Wurzel:
 *   node studien/trendfilter-messung-2026-10/lauf.js [--daten <ordner>] [--aus <datei>]
 * Prueft zuerst die Rohdaten gegen pruefsummen.json (kanonischer Auszug; bricht bei Abweichung ab), rechnet dann alle drei Regeln
 * mit kern.messeRegel (Fenster A und B mit allen Starttagen, Placebo, nachrichtliche Lesarten N1-N5, Zusatz 2003-2026 mit
 * Gesamtlauf) und schreibt ergebnis.json. Keine Parameter, keine Auswahl: was hier steht, ist die gesiegelte Regel. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var childProcess = require('child_process');
var K = require('./kern.js');
var L = require('./laden.js');

function argWert(name, vorgabe) {
  var i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe;
}
var ORDNER = path.resolve(argWert('--daten', path.join(__dirname, 'daten')));
var AUS = path.resolve(argWert('--aus', path.join(__dirname, 'ergebnis.json')));
var REGELN = ['R1', 'R2', 'R3'];

function shaDatei(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function git(args) { try { return childProcess.execFileSync('git', args, { cwd: __dirname, encoding: 'utf8' }).trim(); } catch (e) { return null; } }

function rohPruefen() {
  /* --kunst: Probelauf auf Kunstdaten (Pruefung der Leitung, kein Ergebnis) - dann gibt es keine Pruefsummen. */
  if (process.argv.indexOf('--kunst') >= 0) return { kunst: true };
  var soll = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  var aus = {};
  L.KUERZEL.forEach(function (sym) {
    var b = L.beschreibe(sym, fs.readFileSync(path.join(ORDNER, sym + '.json'), 'utf8'));
    if (b.shaKanonisch !== soll.reihen[sym].shaKanonisch) throw new Error(sym + ': kanonischer Auszug weicht von pruefsummen.json ab');
    aus[sym] = { shaKanonisch: b.shaKanonisch, shaRoh: b.shaRoh, rohGleich: b.shaRoh === soll.reihen[sym].shaRoh };
  });
  return { abgerufenUtc: soll.abgerufenUtc, reihen: aus };
}

/** Signal-Rechengroessen an den Tagen, an denen sich das Ziel aendert (2016-12-01 bis Ende), Hauptlesart - fuer den Abgleich. */
function signalWechsel(D, def, opt) {
  var z = def.signal(D, opt);
  var aus = [];
  for (var i = 1; i < D.n; i++) {
    if (D.tage[i] < '2016-12-01') continue;
    if (z[i] !== z[i - 1]) aus.push({ ausfuehrung: D.tage[i], signaltag: D.tage[i - 1], von: z[i - 1], nach: z[i] });
  }
  var det = typeof def.details === 'function' ? def.details(D, opt) : [];
  var jeTag = {};
  det.forEach(function (x) { jeTag[x.tag] = x; });
  aus.forEach(function (w) { if (jeTag[w.signaltag]) w.rechengroessen = jeTag[w.signaltag]; });
  return aus;
}

function datenZaehlung(D) {
  var z = D.zaehlung;
  var aus = { exTagVerschoben: z.exTagVerschoben, exTagAusserhalb: z.exTagAusserhalb.length, luecken: {}, zeilenOhneSpyTag: {} };
  Object.keys(z.luecken).forEach(function (sym) {
    var l = z.luecken[sym];
    aus.luecken[sym] = { gesamt: l.length, ab2003: l.filter(function (t) { return t >= '2003-01-01'; }).length,
      inFensternAB: l.filter(function (t) { return t >= '2016-01-01'; }), };
    aus.zeilenOhneSpyTag[sym] = z.zeilenOhneSpyTag[sym].length;
  });
  return aus;
}

function rund(x, s) { var f = Math.pow(10, s); return Math.round(x * f) / f; }

function haupt() {
  var t0 = Date.now();
  var pruef = rohPruefen();
  var D = K.ladeDaten(ORDNER);
  var defs = {};
  REGELN.forEach(function (r) { defs[r] = require('./regel-' + r + '.js'); });
  var zieleErsatz = REGELN.map(function (r) { return defs[r].signal(D, Object.assign({}, K.ERSATZ)); });
  var ersterZusatz = K.ersterZusatzTag(D, zieleErsatz);
  if (ersterZusatz < 0) throw new Error('kein erster Zusatz-Tag');
  var ergebnis = {
    kennung: 'trendfilter-messung-2026-10/v1',
    siegel: '6f9d06f',
    lauf: {
      zeitLokal: new Date().toString(), zeitUtc: new Date().toISOString(), node: process.version,
      gitHead: git(['rev-parse', '--short', 'HEAD']), gitSauberImOrdner: git(['status', '--porcelain', '--', '.']) === '',
      code: {}
    },
    daten: { pruefsummen: pruef, kalender: { erster: D.tage[0], letzter: D.tage[D.n - 1], tage: D.n }, zaehlung: datenZaehlung(D) },
    lesarten: [
      'L1 Bargeld vor dem Erstkauf als Pseudo-Reihe BAR (Kurs 1, ohne Kosten); der Erstkauf ist kein Wechsel.',
      'L2 Kosten: Verkauf Erloes = Volumen - 0,002 x Volumen; Kauf Volumen = Erloes / 1,002.',
      'L3 Wechsel ohne jeden Kurs wird auf den naechsten Tag verschoben und gezaehlt.',
      'L4 Ausschuettung nach Reihe und Stueck zum Schluss des Vortags, angelegt nach dem Handel des Tages zum Schluss.',
      'L5 Der 15.09.2026 ist kein Monatsende (September 2026 abgeschnitten).',
      'L6 Quantile im Rangverfahren: Wert an Stelle ceil(p x N).'
    ],
    zusatzErsterTag: D.tage[ersterZusatz],
    regeln: {},
    korrekturen: []
  };
  ['kern.js', 'laden.js', 'lauf.js', 'regel-R1.js', 'regel-R2.js', 'regel-R3.js'].forEach(function (f) {
    ergebnis.lauf.code[f] = shaDatei(path.join(__dirname, f));
  });
  REGELN.forEach(function (r) {
    var t = Date.now();
    var m = K.messeRegel(D, defs[r], { zusatzErsterTag: ersterZusatz });
    m.signalWechselHaupt = signalWechsel(D, defs[r], Object.assign({}, K.HAUPT));
    ergebnis.regeln[r] = m;
    console.log(r + ' ' + m.titel + ': ' + m.urteil.satz + ' (' + ((Date.now() - t) / 1000).toFixed(1) + ' s)');
    ['A', 'B'].forEach(function (f) {
      var x = m.fenster[f];
      console.log('  ' + f + ': k=0 Regel ' + x.k0.regel.endwertCent + ' SPY ' + x.k0.spy.endwertCent + ' Abstand ' + x.k0.abstandPp.toFixed(2) +
        ' Pp, Wechsel ' + x.k0.wechsel + ', vorn ' + x.starttage.vorn + '/' + x.starttage.anzahl + ', Median ' + x.starttage.median.toFixed(2) +
        ', Rueckschlag ' + (x.k0.regel.maxRueckschlag * 100).toFixed(1) + ' % / SPY ' + (x.k0.spy.maxRueckschlag * 100).toFixed(1) +
        ' %, Placebo Median ' + x.placebo.abstandMedian.toFixed(2) + ', ueber Regel ' + x.placebo.mehrAlsRegel + '/' + x.placebo.laeufe);
    });
    var zz = m.zusatz.zusammen;
    console.log('  Zusatz: ' + zz.fenster + ' Fenster ab ' + m.zusatz.ersterTag + ', vorn ' + zz.vorn + ' (' + (zz.anteilVorn * 100).toFixed(1) + ' %), Median ' + zz.abstandMedian.toFixed(2) + ' Pp');
  });
  /* Die Liste der rund 4.500 Zusatzfenster je Regel steht kompakt in einer eigenen Datei neben ergebnis.json. */
  var listen = { felder: null, regeln: {} };
  REGELN.forEach(function (r) {
    listen.felder = ergebnis.regeln[r].zusatz.fensterListeFelder;
    listen.regeln[r] = ergebnis.regeln[r].zusatz.fensterListe;
    delete ergebnis.regeln[r].zusatz.fensterListe;
  });
  var ausListen = AUS.replace(/ergebnis([^/\\]*)\.json$/, 'zusatz-fenster$1.json');
  if (ausListen === AUS) ausListen = AUS + '.zusatz-fenster.json';
  ergebnis.zusatzFensterDatei = path.basename(ausListen);
  ergebnis.lauf.dauerSekunden = (Date.now() - t0) / 1000;
  fs.writeFileSync(AUS, JSON.stringify(ergebnis, function (k, v) { return (typeof v === 'number' && !Number.isInteger(v)) ? rund(v, 10) : v; }, 1) + '\n');
  fs.writeFileSync(ausListen, '{"felder":' + JSON.stringify(listen.felder) + ',"regeln":{\n' + REGELN.map(function (r) {
    return JSON.stringify(r) + ':[\n' + listen.regeln[r].map(function (x) { return JSON.stringify(x); }).join(',\n') + '\n]';
  }).join(',\n') + '\n}}\n');
  console.log('geschrieben: ' + AUS + ' und ' + ausListen + ' (' + ergebnis.lauf.dauerSekunden.toFixed(1) + ' s)');
}

if (require.main === module) haupt();
module.exports = { rohPruefen: rohPruefen };
