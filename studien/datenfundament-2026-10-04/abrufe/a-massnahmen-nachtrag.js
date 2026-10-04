'use strict';
/* MASSNAHMEN-NACHTRAG BEI ALPACA (Auftrag Nr. 89, Teil A, 04.10.2026)
 *
 *   a-massnahmen-nachtrag.cmd --probe      EIN Abruf ohne Symbol-Angabe, nur Zaehlungen
 *   a-massnahmen-nachtrag.cmd --holen      der ganze Zeitraum, seitenweise, in den NEUEN Ordner
 *   node a-massnahmen-nachtrag.js --pruefen   ohne Netz: Zaehlungen gegen den alten Ordner
 *
 * WARUM EIN EIGENES SKRIPT. Das Massnahmen-Archiv (alpaca-massnahmen/<SYM>.json) endet am
 * 03.09.2026. tools/alpaca-vollsammlung.js --massnahmen schriebe die alten Dateien neu und
 * beginnt fest im Jahr 2016 - es wird deshalb NICHT gestartet. Dieses Skript holt nur den
 * Zeitraum ab 01.09.2026 und schreibt nur in den neuen Ordner
 * alpaca-massnahmen-nachtrag-2026-10/. Zusammengefuehrt wird hier nichts (Phase 2b).
 *
 * DER ABRUF ist nach dem Muster von hole() im Werkzeug gebaut (dort Zeilen 150-194, nicht
 * exportiert): derselbe Takt (RATE_JE_MIN, exportiert), dieselbe Wiederholung bei 429 und
 * 5xx. Die Adresse folgt massnahmenEines() (dort Zeilen 644-661), nur ohne den Teil
 * symbols= - die Quelle liefert dann alle Werte seitenweise.
 *
 * ZUGANG: nur ueber schluessel.js der Spannen-Studie (kopfzeilen(), verdecken()). Diese
 * Datei kennt die Umgebungsnamen nicht. Der Zugang steht nur in den Kopfzeilen der Anfrage,
 * nie in der Adresse. Ausgegeben wird nie eine Adresse, nie ein Kopf, nie ein Antwortrumpf -
 * Fehler nur als Statuscode und Zahl.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..', '..');
var V = require(path.join(REPO, 'tools', 'alpaca-vollsammlung.js'));   /* nur RATE_JE_MIN, ordnerName, faktorenAus, datumAus */
var S = require(path.join(REPO, 'studien', 'vorregistrierung-2026-09-02-spannen-historisch', 'schluessel.js'));

var DATEN1 = 'https://data.alpaca.markets/v1';                        /* wie im Werkzeug, Zeile 70 */
/* Woertlich aus tools/alpaca-vollsammlung.js, Zeilen 100-102 (dort nicht exportiert). */
var MASSNAHME_ARTEN = ['reverse_split', 'forward_split', 'unit_split', 'cash_dividend', 'stock_dividend',
  'spin_off', 'cash_merger', 'stock_merger', 'stock_and_cash_merger', 'redemption',
  'name_change', 'worthless_removal', 'rights_distribution'].join(',');
var VERSUCHE = 5;                                                     /* wie im Werkzeug, Zeile 74 */
var SEITEN_DECKEL = 300;
var VON = '2026-09-01';
var ALT_BIS = '2026-09-03';                                           /* Stand des alten Ordners */
var ALT = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen';             /* wird NUR gelesen */
var NEU = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen-nachtrag-2026-10';
var HIER = __dirname;
var LOG = path.join(HIER, 'a-lauf.log');
var BENANNT = ['BURU', 'DBRG', 'GBTG', 'CSAN', 'APGE', 'CRNX', 'HLX', 'LEG', 'TWO'];

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function protokoll(zeile) {
  try { fs.appendFileSync(LOG, S.verdecken(new Date().toISOString() + '  ' + zeile) + '\n'); } catch (e) { /* kein Protokoll haelt den Lauf nicht an */ }
}
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function zwei(n) { return (n < 10 ? '0' : '') + n; }
function tagLokal(ms) { var d = new Date(ms); return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()); }
function atomar(p, text) { fs.writeFileSync(p + '.tmp', text); fs.renameSync(p + '.tmp', p); }
function arg(name) {
  var treffer = null;
  process.argv.slice(2).forEach(function (a) { if (a === '--' + name) treffer = true; else if (a.indexOf('--' + name + '=') === 0) treffer = a.slice(name.length + 3); });
  return treffer;
}

/* ================= Takt und Abruf (Muster: hole() im Werkzeug) ================= */
var marken = [];
async function marke() {
  for (;;) {
    var jetzt = Date.now();
    while (marken.length && jetzt - marken[0] > 60000) marken.shift();
    if (marken.length < V.RATE_JE_MIN) { marken.push(jetzt); return; }
    await pause(Math.max(20, 60000 - (jetzt - marken[0]) + 5));
  }
}
var Z = { abrufe: 0, wiederholt: 0, fehler: {} };
function fehlerZaehlen(art) { Z.fehler[art] = (Z.fehler[art] || 0) + 1; }
/** Ein Abruf. Gibt NUR den Statuscode und - bei 200 - die gelesenen Daten zurueck; ein
 *  Fehlerrumpf verlaesst diese Funktion nicht. */
async function hole(url) {
  var letzter = 0;
  for (var v = 1; v <= VERSUCHE; v++) {
    await marke();
    Z.abrufe++;
    var res, text;
    try {
      res = await globalThis.fetch(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(90000) });
      text = await res.text();
    } catch (e) {
      fehlerZaehlen('netz');
      if (v === VERSUCHE) return { status: 0, daten: null };
      Z.wiederholt++; await pause(1000 * v); continue;
    }
    letzter = res.status;
    if (res.status === 429) {
      fehlerZaehlen('429');
      var warte = Number(res.headers.get('retry-after'));
      Z.wiederholt++;
      await pause(isFinite(warte) && warte > 0 ? warte * 1000 : 2000 * v);
      continue;
    }
    if (res.status >= 500) {
      fehlerZaehlen('http' + res.status);
      if (v === VERSUCHE) return { status: res.status, daten: null };
      Z.wiederholt++; await pause(1000 * v); continue;
    }
    if (res.status !== 200) { fehlerZaehlen('http' + res.status); return { status: res.status, daten: null }; }
    var daten = null;
    try { daten = JSON.parse(text); } catch (e2) { daten = null; }
    return { status: 200, daten: daten };
  }
  return { status: letzter, daten: null };
}
/** Die Adresse nach massnahmenEines() - ohne Symbol-Angabe liefert die Quelle alle Werte. */
function adresse(symbole, bis, token) {
  return DATEN1 + '/corporate-actions?' + (symbole ? 'symbols=' + encodeURIComponent(symbole) + '&' : '') + 'types=' + MASSNAHME_ARTEN +
    '&start=' + VON + '&end=' + bis + '&limit=1000' + (token ? '&page_token=' + encodeURIComponent(token) : '');
}
/** Die Saetze einer Antwortseite, mit _art wie im alten Ordner. */
function saetzeAus(daten) {
  var aus = [], ca = daten && daten.corporate_actions;
  if (ca && typeof ca === 'object') {
    Object.keys(ca).forEach(function (art) {
      if (Array.isArray(ca[art])) ca[art].forEach(function (e) { aus.push(Object.assign({ _art: art }, e)); });
    });
  }
  return aus;
}
/** Alle Kuerzel, die ein Satz nennt. GEMESSEN am alten Ordner (a-zahlen.json, zuordnungAlt): die
 *  Abfrage je Symbol lieferte einen Satz, sobald das Kuerzel in IRGENDEINEM Symbolfeld steht
 *  (symbol, old_/new_, source_, acquirer_/acquiree_). Dieselbe Regel legt hier die Dateien an. */
function symboleAus(e) {
  var aus = [];
  Object.keys(e).forEach(function (k) {
    if (/(^|_)symbol$/.test(k) && typeof e[k] === 'string' && e[k] && aus.indexOf(e[k]) === -1) aus.push(e[k]);
  });
  return aus;
}
function jeArtZaehlen(saetze) { var z = {}; saetze.forEach(function (e) { z[e._art] = (z[e._art] || 0) + 1; }); return z; }
function spanne(saetze, feld) {
  var min = null, max = null;
  saetze.forEach(function (e) { var d = typeof feld === 'function' ? feld(e) : e[feld]; if (!d) return; if (!min || d < min) min = d; if (!max || d > max) max = d; });
  return { min: min, max: max };
}
/** Beweis, dass der alte Ordner nicht angefasst wurde: Zahl der Dateien und juengste Aenderung. */
function ordnerStand(p) {
  var n = 0, juengste = 0, bytes = 0;
  fs.readdirSync(p).forEach(function (f) { var st = fs.statSync(path.join(p, f)); n++; bytes += st.size; if (st.mtimeMs > juengste) juengste = st.mtimeMs; });
  return { dateien: n, bytes: bytes, juengsteAenderung: new Date(juengste).toISOString() };
}

/* ================= --probe: EIN Abruf ohne Symbol-Angabe ================= */
async function probe(bis) {
  if (!S.vorhanden()) { sag('Kein Zugang in der Umgebung (es fehlt: ' + S.fehlend().join(', ') + ') - ueber die .cmd starten.'); return 2; }
  var r = await hole(adresse(null, bis, null));
  var aus = { stand: new Date().toISOString(), von: VON, bis: bis, abrufe: Z.abrufe, status: r.status };
  if (r.status === 200) {
    var s = saetzeAus(r.daten), sym = {};
    s.forEach(function (e) { symboleAus(e).forEach(function (x) { sym[x] = 1; }); });
    aus.saetze = s.length; aus.jeArt = jeArtZaehlen(s); aus.symbole = Object.keys(sym).length;
    aus.folgeseite = !!(r.daten && r.daten.next_page_token);
    aus.process_date = spanne(s, 'process_date'); aus.datum = spanne(s, V.datumAus);
  }
  atomar(path.join(HIER, 'a-probe.json'), JSON.stringify(aus, null, 1));
  protokoll('Probe ohne Symbol-Angabe: HTTP ' + r.status + (r.status === 200 ? ', ' + aus.saetze + ' Saetze, ' + aus.symbole + ' Symbole, Folgeseite ' + (aus.folgeseite ? 'ja' : 'nein') : ''));
  sag('Probe: ' + JSON.stringify(aus));
  return r.status === 200 ? 0 : 3;
}

/* ================= --holen: der ganze Zeitraum, seitenweise ================= */
async function holen(bis) {
  if (!S.vorhanden()) { sag('Kein Zugang in der Umgebung (es fehlt: ' + S.fehlend().join(', ') + ') - ueber die .cmd starten.'); return 2; }
  var fertig = path.join(NEU, '_nachtrag.json');
  if (fs.existsSync(fertig) && !arg('neu')) { sag('Der Nachtrag liegt vollstaendig (' + fertig + ') - nichts zu tun. Erneut holen nur mit --neu.'); return 0; }
  var altVor = ordnerStand(ALT), beginn = Date.now();
  var alle = [], gesehen = {}, doppelt = 0, token = null, seiten = 0;
  do {
    var r = await hole(adresse(null, bis, token));
    if (r.status !== 200) {
      protokoll('Holen abgebrochen: HTTP ' + r.status + ' auf Seite ' + (seiten + 1) + ', nichts geschrieben');
      sag('Abbruch: HTTP ' + r.status + ' auf Seite ' + (seiten + 1) + ' - nichts geschrieben.');
      return 3;
    }
    seiten++;
    saetzeAus(r.daten).forEach(function (e) {
      var k = e._art + '|' + (e.id || JSON.stringify(e));
      if (gesehen[k]) { doppelt++; return; }
      gesehen[k] = 1; alle.push(e);
    });
    token = r.daten ? r.daten.next_page_token : null;
    if (seiten % 5 === 0) sag('  Seite ' + seiten + ': zusammen ' + alle.length + ' Saetze');
  } while (token && seiten < SEITEN_DECKEL);
  if (token) { sag('Abbruch: Seitendeckel ' + SEITEN_DECKEL + ' erreicht - nichts geschrieben.'); return 4; }

  /* Zuordnung je Kuerzel und der Beweis, dass die Dateinamen eindeutig sind (Windows
   * unterscheidet Gross- und Kleinschreibung nicht). */
  var jeSym = {}, ohneSymbol = 0;
  alle.forEach(function (e) {
    var liste = symboleAus(e);
    if (!liste.length) ohneSymbol++;
    liste.forEach(function (x) { (jeSym[x] = jeSym[x] || []).push(e); });
  });
  var symbole = Object.keys(jeSym).sort(), namen = {}, doppeltName = [];
  symbole.forEach(function (x) {
    var k = V.ordnerName(x).toUpperCase();
    if (namen[k]) doppeltName.push(namen[k] + ' und ' + x); else namen[k] = x;
  });
  if (doppeltName.length) { sag('Abbruch: ' + doppeltName.length + ' Dateinamen nicht eindeutig - nichts geschrieben.'); return 5; }

  fs.mkdirSync(NEU, { recursive: true });
  var stand = new Date().toISOString(), abruftag = tagLokal(Date.now()), bytes = 0;
  symbole.forEach(function (x) {
    var f = V.faktorenAus(jeSym[x], null);
    var text = JSON.stringify({ sym: x, stand: stand, quelle: 'alpaca v1 corporate-actions', von: VON, bis: bis, abruftag: abruftag,
      abrufart: 'Nachtrag ohne Symbol-Angabe, seitenweise; ein Satz steht bei jedem Kuerzel, das er nennt',
      saetze: jeSym[x], anwendbar: f.anwendbar, ohneFaktor: f.ohneFaktor });
    bytes += Buffer.byteLength(text);
    atomar(path.join(NEU, V.ordnerName(x) + '.json'), text);
  });
  var altNach = ordnerStand(ALT);
  var kopf = { stand: stand, abruftag: abruftag, quelle: 'alpaca v1 corporate-actions', von: VON, bis: bis,
    abrufart: 'ohne Symbol-Angabe, seitenweise (limit 1000)', arten: MASSNAHME_ARTEN.split(','),
    abrufe: Z.abrufe, seiten: seiten, wiederholt: Z.wiederholt, fehler: Z.fehler, dauerSekunden: Math.round((Date.now() - beginn) / 1000),
    saetze: alle.length, doppeltVerworfen: doppelt, ohneSymbol: ohneSymbol, saetzeJeArt: jeArtZaehlen(alle),
    process_date: spanne(alle, 'process_date'), datum: spanne(alle, V.datumAus),
    dateien: symbole.length, bytes: bytes,
    zuordnung: 'Ein Satz steht in der Datei jedes Kuerzels, das er in einem Symbolfeld nennt - wie die Abfrage je Symbol im alten Ordner.',
    hinweis: 'Nachtrag, NICHT mit alpaca-massnahmen/ zusammengefuehrt (Phase 2b). Der alte Ordner wurde nur gelesen.',
    alterOrdnerVorher: altVor, alterOrdnerNachher: altNach, symbole: symbole };
  atomar(fertig, JSON.stringify(kopf, null, 1));
  protokoll('Holen: ' + Z.abrufe + ' Abrufe, ' + seiten + ' Seiten, ' + alle.length + ' Saetze, ' + symbole.length + ' Dateien, ' + bytes + ' Bytes, Fehler ' + JSON.stringify(Z.fehler));
  sag('Geholt: ' + Z.abrufe + ' Abrufe, ' + seiten + ' Seiten, ' + alle.length + ' Saetze (doppelt verworfen ' + doppelt + '), ' + symbole.length + ' Dateien, ' + bytes + ' Bytes, ' + kopf.dauerSekunden + ' s');
  sag('Je Art: ' + JSON.stringify(kopf.saetzeJeArt));
  sag('process_date ' + JSON.stringify(kopf.process_date) + '  Datum ' + JSON.stringify(kopf.datum));
  sag('Alter Ordner unveraendert: ' + (JSON.stringify(altVor) === JSON.stringify(altNach) ? 'ja' : 'NEIN') + ' ' + JSON.stringify(altNach));
  return 0;
}

/* ================= --pruefen: ohne Netz ================= */
function kanon(e) { var o = {}; Object.keys(e).sort().forEach(function (k) { o[k] = e[k]; }); return JSON.stringify(o); }
function kurzSatz(e) {
  var o = { art: e._art, datum: V.datumAus(e), process_date: e.process_date || null };
  ['symbol', 'old_symbol', 'new_symbol', 'source_symbol', 'acquirer_symbol', 'acquiree_symbol', 'rate', 'old_rate', 'new_rate',
    'cash_rate', 'acquirer_rate', 'acquiree_rate', 'source_rate', 'special'].forEach(function (k) { if (e[k] != null && e[k] !== '') o[k] = e[k]; });
  return o;
}
/** Alle Dateien eines Massnahmen-Ordners: ruft je Satz fn(dateiSym, satz). */
function ordnerLesen(p, fn) {
  var n = 0;
  fs.readdirSync(p).forEach(function (f) {
    if (!/\.json$/.test(f) || f.charAt(0) === '_') return;
    var j;
    try { j = JSON.parse(fs.readFileSync(path.join(p, f), 'utf8')); } catch (e) { return; }
    if (!j || !j.sym || !Array.isArray(j.saetze)) return;
    n++;
    j.saetze.forEach(function (s) { fn(String(j.sym), s); });
  });
  return n;
}
function pruefen() {
  var kopf = JSON.parse(fs.readFileSync(path.join(NEU, '_nachtrag.json'), 'utf8'));
  var AUS = { stand: new Date().toISOString(), von: kopf.von, bis: kopf.bis, abruftag: kopf.abruftag,
    abruf: { abrufe: kopf.abrufe, seiten: kopf.seiten, wiederholt: kopf.wiederholt, fehler: kopf.fehler, dauerSekunden: kopf.dauerSekunden,
      saetze: kopf.saetze, saetzeJeArt: kopf.saetzeJeArt, dateien: kopf.dateien, bytes: kopf.bytes, process_date: kopf.process_date, datum: kopf.datum } };

  /* Nachtrag lesen */
  var neu = {}, neuEindeutig = {}, neuDateien = {};
  var nNeu = ordnerLesen(NEU, function (sym, s) { neu[sym + '|' + s._art + '|' + s.id] = s; neuEindeutig[s._art + '|' + s.id] = s; neuDateien[sym] = 1; });
  AUS.nachtragGelesen = { dateien: nNeu, saetzeInDateien: Object.keys(neu).length, saetzeEindeutig: Object.keys(neuEindeutig).length };

  /* Alter Ordner: was er ab dem 01.09.2026 fuehrt, und welches Feld das Kuerzel der Datei traegt */
  var alt = {}, altDateien = {}, zuordnung = {};
  var nAlt = ordnerLesen(ALT, function (sym, s) {
    altDateien[sym] = 1;
    var basis = sym.replace(/~2$/, ''), z = zuordnung[s._art] = zuordnung[s._art] || { saetze: 0, keinFeld: 0 }, traf = 0;
    z.saetze++;
    Object.keys(s).forEach(function (k) { if (/(^|_)symbol$/.test(k) && s[k] === basis) { z[k] = (z[k] || 0) + 1; traf++; } });
    if (!traf) z.keinFeld++;
    var d = V.datumAus(s);
    if ((d && d >= VON) || (s.process_date && s.process_date >= VON)) alt[sym + '|' + s._art + '|' + s.id] = s;
  });
  AUS.zuordnungAlt = { dateien: nAlt, jeArt: zuordnung };

  /* Warum ein Satz des alten Ordners im Nachtrag fehlt. Die Quelle filtert den Zeitraum nach
   * process_date (gemessen: alle 6.624 Saetze liegen dort im Fenster, der Massnahmentag nicht) -
   * ein Satz mit Ex-Tag im Fenster und Verarbeitungstag danach kommt deshalb nicht mit. */
  var neuNachTag = {};
  Object.keys(neu).forEach(function (k) { var s = neu[k]; neuNachTag[k.split('|')[0] + '|' + s._art + '|' + V.datumAus(s)] = 1; });
  function grundFehlt(k, s) {
    if (s.process_date && s.process_date > kopf.bis) return 'Verarbeitungstag nach dem Abrufende';
    if (s.process_date && s.process_date < VON) return 'Verarbeitungstag vor dem Abrufbeginn';
    if (neuNachTag[k.split('|')[0] + '|' + s._art + '|' + V.datumAus(s)]) return 'im Fenster, unter anderer Kennung vorhanden';
    return 'im Fenster, von der Quelle nicht mehr geliefert';
  }
  function felderAnders(a, b) {
    var felder = [];
    Object.keys(Object.assign({}, a, b)).forEach(function (f) { if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) felder.push(f); });
    return felder;
  }
  function jeGrund(liste) { var g = {}; liste.forEach(function (x) { g[x.grund] = (g[x.grund] || 0) + 1; }); return g; }

  /* (a) 01.-03.09.2026: dieselben Saetze? Einmal nach dem Massnahmentag, einmal nach process_date. */
  function vergleich(feld) {
    function imFenster(s) { var d = feld === 'datum' ? V.datumAus(s) : s.process_date; return !!d && d >= VON && d <= ALT_BIS; }
    var v = { alt: 0, nachtrag: 0, gleich: 0, inhaltAnders: [], nurAlt: [], nurNachtragImAltenBestand: [], nurNachtragSymbolOhneAlteDatei: 0 };
    Object.keys(alt).forEach(function (k) {
      if (!imFenster(alt[k])) return;
      v.alt++;
      if (!neu[k]) { v.nurAlt.push(Object.assign({ datei: k.split('|')[0], grund: grundFehlt(k, alt[k]) }, kurzSatz(alt[k]))); return; }
      if (kanon(alt[k]) === kanon(neu[k])) v.gleich++;
      else v.inhaltAnders.push({ datei: k.split('|')[0], art: alt[k]._art, datum: V.datumAus(alt[k]), felder: felderAnders(alt[k], neu[k]) });
    });
    v.nurAltJeGrund = jeGrund(v.nurAlt);
    Object.keys(neu).forEach(function (k) {
      if (!imFenster(neu[k])) return;
      var sym = k.split('|')[0];
      if (altDateien[sym]) { v.nachtrag++; if (!alt[k]) v.nurNachtragImAltenBestand.push(Object.assign({ datei: sym }, kurzSatz(neu[k]))); }
      else v.nurNachtragSymbolOhneAlteDatei++;
    });
    return v;
  }
  AUS.a_fenster_0109_0309 = { nachMassnahmentag: vergleich('datum'), nachProcessDate: vergleich('process') };

  /* Zusatz: was der alte Ordner fuer die Zeit NACH seinem Stand schon angekuendigt fuehrte (Abfrage bis 31.12.) */
  var vorab = { altAb0409BisEnde: 0, imNachtragGleich: 0, imNachtragAnders: 0, andersJeFeld: {}, fehltImNachtrag: [], altNachEnde: 0 };
  Object.keys(alt).forEach(function (k) {
    var d = V.datumAus(alt[k]);
    if (!d || d <= ALT_BIS) return;
    if (d > kopf.bis) { vorab.altNachEnde++; return; }
    vorab.altAb0409BisEnde++;
    if (!neu[k]) vorab.fehltImNachtrag.push(Object.assign({ datei: k.split('|')[0], grund: grundFehlt(k, alt[k]) }, kurzSatz(alt[k])));
    else if (kanon(alt[k]) === kanon(neu[k])) vorab.imNachtragGleich++;
    else { vorab.imNachtragAnders++; felderAnders(alt[k], neu[k]).forEach(function (f) { vorab.andersJeFeld[f] = (vorab.andersJeFeld[f] || 0) + 1; }); }
  });
  vorab.fehltImNachtragZahl = vorab.fehltImNachtrag.length; vorab.fehltJeGrund = jeGrund(vorab.fehltImNachtrag);
  vorab.fehltJeArt = {}; vorab.fehltImNachtrag.forEach(function (x) { vorab.fehltJeArt[x.art] = (vorab.fehltJeArt[x.art] || 0) + 1; });
  vorab.fehltImFenster = vorab.fehltImNachtrag.filter(function (x) { return /^im Fenster/.test(x.grund); }).slice(0, 30);
  vorab.fehltImNachtrag = vorab.fehltImNachtrag.slice(0, 30);
  AUS.vorabImAltenOrdner = vorab;

  /* Wie weit Ex-Tag und Verarbeitungstag im Nachtrag auseinanderliegen - das Mass dafuer, was ein
   * Abruf "bis gestern" an Ausschuettungen mit Ex-Tag im Fenster noch nicht liefern kann. */
  var lage = {};
  Object.keys(neuEindeutig).forEach(function (k) {
    var s = neuEindeutig[k], d = V.datumAus(s), z = lage[s._art] = lage[s._art] || { gleich: 0, verarbeitungSpaeter: 0, verarbeitungFrueher: 0, exVorAbrufbeginn: 0 };
    if (!d || !s.process_date) return;
    if (d === s.process_date) z.gleich++; else if (s.process_date > d) z.verarbeitungSpaeter++; else z.verarbeitungFrueher++;
    if (d < VON) z.exVorAbrufbeginn++;
  });
  AUS.exTagGegenVerarbeitungstag = lage;

  /* (b) Zaehlungen ab 04.09.2026 - jeder Satz einmal (eindeutig nach Art und Kennung) */
  var ab = Object.keys(neuEindeutig).map(function (k) { return neuEindeutig[k]; }).filter(function (s) { var d = V.datumAus(s); return d && d > ALT_BIS; });
  var z = jeArtZaehlen(ab);
  function n(a) { return z[a] || 0; }
  AUS.b_ab_0409 = { saetze: ab.length, jeArt: z,
    splitsVorwaerts: n('forward_splits'), splitsRueckwaerts: n('reverse_splits'), splitsEinheiten: n('unit_splits'),
    ausschuettungenBar: n('cash_dividends'), ausschuettungenAktien: n('stock_dividends'),
    uebernahmen: n('cash_mergers') + n('stock_mergers') + n('stock_and_cash_mergers'),
    uebernahmenJeArt: { bar: n('cash_mergers'), aktien: n('stock_mergers'), aktienUndBar: n('stock_and_cash_mergers') },
    umbenennungen: n('name_changes'), abspaltungen: n('spin_offs'), ruecknahmen: n('redemptions'),
    wertlosAusgebucht: n('worthless_removals'), bezugsrechte: n('rights_distributions') };

  /* (c) lebende Aktienreihen (X = 10) mit Split seit 04.09.2026 */
  var T = JSON.parse(fs.readFileSync(path.join(HIER, '..', 't1-reihen.json'), 'utf8'));
  var iReihe = T.spalten.indexOf('reihe'), iLeb = T.spalten.indexOf('lebendX10'), lebend = {}, alleReihen = {};
  T.reihen.forEach(function (r) { var b = String(r[iReihe]).replace(/~2$/, ''); alleReihen[b] = 1; if (r[iLeb] === 1) lebend[b] = r[iReihe]; });
  var splits = [], aktDiv = [], lebendMit = {}, reihenMit = {};
  ab.forEach(function (s) {
    symboleAus(s).forEach(function (x) {
      if (alleReihen[x]) reihenMit[s._art] = (reihenMit[s._art] || 0) + 1;
      if (!lebend[x]) return;
      lebendMit[s._art] = (lebendMit[s._art] || 0) + 1;
      if (/split/.test(s._art)) splits.push({ reihe: lebend[x], art: s._art, ex: V.datumAus(s), old_rate: s.old_rate, new_rate: s.new_rate, faktor: V.faktorAus(s) });
      if (s._art === 'stock_dividends') aktDiv.push({ reihe: lebend[x], ex: V.datumAus(s), rate: s.rate });
    });
  });
  splits.sort(function (p, q) { return p.ex < q.ex ? -1 : p.ex > q.ex ? 1 : p.reihe < q.reihe ? -1 : 1; });
  AUS.c_lebendeReihen = { lebendX10: Object.keys(lebend).length, splitsSeit0409: splits.length, splits: splits, aktienDividenden: aktDiv,
    saetzeJeArtBeiLebenden: lebendMit, saetzeJeArtBeiAllenAktienreihen: reihenMit };

  /* (d) die benannten Kuerzel: alles, was der Nachtrag zu ihnen fuehrt */
  AUS.d_benannt = {};
  BENANNT.forEach(function (x) {
    var liste = [];
    Object.keys(neu).forEach(function (k) { if (k.split('|')[0] === x) liste.push(kurzSatz(neu[k])); });
    liste.sort(function (p, q) { return String(p.datum) < String(q.datum) ? -1 : 1; });
    AUS.d_benannt[x] = { datei: !!neuDateien[x], saetze: liste };
  });

  atomar(path.join(HIER, 'a-zahlen.json'), JSON.stringify(AUS, null, 1));
  var A1 = AUS.a_fenster_0109_0309.nachMassnahmentag, A2 = AUS.a_fenster_0109_0309.nachProcessDate;
  [['Massnahmentag', A1], ['process_date', A2]].forEach(function (p) {
    sag('(a) 01.-03.09. nach ' + p[0] + ': alt ' + p[1].alt + ', Nachtrag ' + p[1].nachtrag + ', gleich ' + p[1].gleich + ', Inhalt anders ' + p[1].inhaltAnders.length +
      ', nur alt ' + p[1].nurAlt.length + ', nur Nachtrag ' + p[1].nurNachtragImAltenBestand.length + ' (dazu ' + p[1].nurNachtragSymbolOhneAlteDatei + ' bei Kuerzeln ohne alte Datei)');
  });
  sag('    nur alt (Massnahmentag): ' + JSON.stringify(A1.nurAlt) + '  Inhalt anders: ' + JSON.stringify(A1.inhaltAnders));
  sag('    nur alt (process_date): ' + JSON.stringify(A2.nurAlt));
  sag('    vorab im alten Ordner (04.09. bis ' + kopf.bis + '): ' + vorab.altAb0409BisEnde + ', im Nachtrag gleich ' + vorab.imNachtragGleich + ', anders ' + vorab.imNachtragAnders +
    ' ' + JSON.stringify(vorab.andersJeFeld) + ', fehlt ' + vorab.fehltImNachtragZahl + ' ' + JSON.stringify(vorab.fehltJeGrund) + ' ' + JSON.stringify(vorab.fehltJeArt) +
    '; alt nach dem ' + kopf.bis + ': ' + vorab.altNachEnde);
  sag('    fehlt im Fenster: ' + JSON.stringify(vorab.fehltImFenster));
  sag('    Ex-Tag gegen Verarbeitungstag: ' + JSON.stringify(lage));
  sag('(b) ab 04.09.: ' + JSON.stringify(AUS.b_ab_0409));
  sag('(c) lebende Reihen ' + AUS.c_lebendeReihen.lebendX10 + ', Splits ' + splits.length + ': ' + JSON.stringify(splits));
  sag('    Aktiendividenden bei Lebenden: ' + JSON.stringify(aktDiv) + '  je Art bei Lebenden: ' + JSON.stringify(lebendMit));
  sag('(d) ' + JSON.stringify(AUS.d_benannt));
  return 0;
}

async function main() {
  var bis = arg('bis') || tagLokal(Date.now() - 86400000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(bis)) || bis < VON) { sag('Ungueltiges --bis.'); return 9; }
  if (arg('probe')) return probe(bis);
  if (arg('holen')) return holen(bis);
  if (arg('pruefen')) return pruefen();
  sag('Kein Modus gewaehlt: --probe | --holen | --pruefen (siehe Kopf der Datei).');
  return 1;
}
if (require.main === module) {
  main().then(function (rc) { process.exitCode = rc; }).catch(function (e) {
    /* Nur die Meldung, durch die Verdeckung - kein Stapel, keine Adresse. */
    process.stdout.write(S.verdecken('Fehler: ' + String(e && e.message || e).slice(0, 200)) + '\n');
    process.exitCode = 1;
  });
}
module.exports = { adresse: adresse, saetzeAus: saetzeAus, symboleAus: symboleAus, MASSNAHME_ARTEN: MASSNAHME_ARTEN, VON: VON, NEU: NEU, ALT: ALT };
