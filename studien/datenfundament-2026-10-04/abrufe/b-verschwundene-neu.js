'use strict';
/* LISTE DER BOERSENABGAENGE NEU HOLEN (Auftrag Nr. 89, Teil B, 04.10.2026)
 *
 *   node b-verschwundene-neu.js --probe     EIN Abruf (eine Seite), nur Statuscode und Zaehlung
 *   node b-verschwundene-neu.js --holen     alle Seiten in die NEUE Datei verschwundene-2026-10-04.json
 *   node b-verschwundene-neu.js --pruefen   ohne Netz: Zaehlungen gegen die alte Liste
 *
 * WARUM EIN EIGENES SKRIPT. tools/massive-verschwundene.js schreibt immer nach
 * massive/verschwundene.json - es ueberschriebe die Liste vom 23.08.2026 und wird deshalb NICHT
 * gestartet. Dieses Skript nimmt aus tools/massive.js Zugang, Takt und Seitenabruf (schluessel,
 * hole, alleSeiten, ablage), schreibt dieselben Felder wie das Werkzeug, aber in eine neue Datei.
 * Die alte Liste und universum-2024-09-02*.json werden nur gelesen (Pruefsumme vorher/nachher).
 *
 * SCHLUESSEL: den liest nur das Werkzeug; er steht in der Kopfzeile der Anfrage. Dieses Skript gibt
 * nie eine Adresse und nie einen Fehlertext der Quelle aus - Fehler nur als Statuscode.
 *
 * KEIN KAUF: antwortet der Probeabruf mit 401, 402, 403 oder einem Tarifhinweis, endet Teil B.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var M = require('../../../tools/massive.js');
var G = require('../gemeinsam.js');                 /* nur tageZwischen und ABGANG_NACH_TAGE (Regel des Trockenlaufs) */

var HIER = __dirname;
var PFAD = '/v3/reference/tickers?active=false&market=stocks&limit=1000';   /* wie tools/massive-verschwundene.js, Zeile 33 */
var MAX_SEITEN = 60;                                /* alte Liste: 24 Seiten */
var ZIELNAME = 'verschwundene-2026-10-04.json';
var ALTNAME = 'verschwundene.json';
var BENANNT = ['DBRG', 'GBTG', 'CSAN', 'APGE', 'CRNX', 'HLX', 'LEG', 'TWO'];
var LOG = path.join(HIER, 'b-lauf.log');

function protokoll(zeile) { try { fs.appendFileSync(LOG, new Date().toISOString() + '  ' + zeile + '\n'); } catch (e) { /* ohne Protokoll weiter */ } }
function arg(name) { return process.argv.slice(2).indexOf('--' + name) !== -1; }
function zwei(n) { return (n < 10 ? '0' : '') + n; }
function heute() { var d = new Date(); return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()); }
function atomar(p, text) { fs.writeFileSync(p + '.tmp', text); fs.renameSync(p + '.tmp', p); }
/** Aus einer Fehlermeldung des Werkzeugs NUR den Statuscode - der Text selbst wird nie ausgegeben. */
function statusAus(e) { var m = /HTTP (\d{3})/.exec(String(e && e.message)); return m ? Number(m[1]) : 0; }
function tarifHinweis(e) { return /plan|upgrade|subscription|entitle|not authorized|pricing|tier/i.test(String(e && e.message)); }
function dateiStand(p) {
  if (!fs.existsSync(p)) return null;
  var st = fs.statSync(p);
  return { bytes: st.size, geaendert: new Date(st.mtimeMs).toISOString(), sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') };
}
function bestand() {
  var ord = M.ablage(), aus = {};
  fs.readdirSync(ord).forEach(function (f) { if (f === ALTNAME || /^universum-2024-09-02/.test(f)) aus[f] = dateiStand(path.join(ord, f)); });
  return aus;
}
function schluessel() { try { return M.schluessel(); } catch (e) { return null; } }

/* ================= --probe ================= */
async function probe() {
  var key = schluessel();
  if (!key) { console.log('Kein Schluessel: das Werkzeug findet keinen. Teil B endet.'); return 2; }
  var aus = { stand: new Date().toISOString(), abrufe: 1 };
  try {
    var j = await M.hole(PFAD, key);
    aus.status = 200; aus.eintraege = (j.results || []).length; aus.folgeseite = !!j.next_url;
    aus.rumpfStatus = typeof j.status === 'string' ? j.status.slice(0, 12) : null;
  } catch (e) { aus.status = statusAus(e); aus.tarifHinweis = tarifHinweis(e); }
  aus.urteil = aus.status === 200 ? 'geht ohne Kosten' : ([401, 402, 403].indexOf(aus.status) !== -1 || aus.tarifHinweis ? 'geht nicht ohne Kosten - Teil B endet' : 'Fehler, kein Tarifhinweis');
  atomar(path.join(HIER, 'b-probe.json'), JSON.stringify(aus, null, 1));
  protokoll('Probe: HTTP ' + aus.status + (aus.status === 200 ? ', ' + aus.eintraege + ' Eintraege, Folgeseite ' + (aus.folgeseite ? 'ja' : 'nein') : '') + ' - ' + aus.urteil);
  console.log('Probe: ' + JSON.stringify(aus));
  return aus.status === 200 ? 0 : 3;
}

/* ================= --holen ================= */
async function holen() {
  var key = schluessel();
  if (!key) { console.log('Kein Schluessel: das Werkzeug findet keinen.'); return 2; }
  var ziel = path.join(M.ablage(), ZIELNAME);
  if (fs.existsSync(ziel) && !arg('neu')) { console.log('Die neue Datei liegt schon - nichts zu tun. Erneut holen nur mit --neu.'); return 0; }
  var vorher = bestand(), beginn = Date.now(), r;
  try {
    r = await M.alleSeiten(PFAD, key, MAX_SEITEN, function (seite, n, gesamt) { if (seite % 5 === 0) console.log('   Seite ' + seite + ': zusammen ' + gesamt); });
  } catch (e) {
    protokoll('Holen abgebrochen: HTTP ' + statusAus(e) + ', nichts geschrieben');
    console.log('Abbruch: HTTP ' + statusAus(e) + ' - nichts geschrieben.');
    return 3;
  }
  /* Dieselben Felder und derselbe Filter wie tools/massive-verschwundene.js (Zeilen 44-54). */
  var liste = r.eintraege.map(function (t) {
    return { sym: t.ticker, name: t.name || null, boerse: t.primary_exchange || null,
      art: t.type || null, waehrung: t.currency_name || null,
      von: t.list_date || null, bis: t.delisted_utc ? String(t.delisted_utc).slice(0, 10) : null,
      cik: t.cik || null };
  }).filter(function (t) { return t.sym; });
  var relevant = liste.filter(function (t) { return t.art === 'CS' || t.art === 'ADRC'; });
  var text = JSON.stringify({
    stand: new Date().toISOString(),
    quelle: M.HOST + '/v3/reference/tickers?active=false&market=stocks',
    seiten: r.seiten, abgebrochen: r.abgebrochen,
    gesamt: liste.length, aktienartig: relevant.length,
    hinweis: 'Nicht mehr aktiv gehandelte Ticker. "bis" ist das Delisting-Datum, sofern die Quelle es fuehrt. ' +
             'Diese Liste dient dazu, die Ueberlebensverzerrung des Kursarchivs zu MESSEN - sie ist selbst keine Handelsliste.',
    abruftag: heute(),
    nachtrag: 'Neu geholt am ' + heute() + ' (Auftrag Nr. 89). Die Liste vom 23.08.2026 steht unveraendert in ' + ALTNAME + '.',
    eintraege: relevant,
  }, null, 1);
  atomar(ziel, text);
  var nachher = bestand(), dauer = Math.round((Date.now() - beginn) / 1000);
  var lauf = { stand: new Date().toISOString(), seiten: r.seiten, abgebrochen: r.abgebrochen, gesamt: liste.length, aktienartig: relevant.length,
    dauerSekunden: dauer, bytes: Buffer.byteLength(text), altesUnveraendert: JSON.stringify(vorher) === JSON.stringify(nachher), bestandVorher: vorher, bestandNachher: nachher };
  atomar(path.join(HIER, 'b-lauf.json'), JSON.stringify(lauf, null, 1));
  protokoll('Holen: ' + r.seiten + ' Seiten, ' + liste.length + ' Ticker, ' + relevant.length + ' aktienartig, ' + dauer + ' s, abgebrochen ' + r.abgebrochen);
  console.log('Geholt: ' + r.seiten + ' Seiten, ' + liste.length + ' Ticker, ' + relevant.length + ' aktienartig, ' + lauf.bytes + ' Bytes, ' + dauer + ' s, abgebrochen ' + r.abgebrochen);
  console.log('Alte Dateien unveraendert: ' + (lauf.altesUnveraendert ? 'ja' : 'NEIN') + ' (' + Object.keys(nachher).join(', ') + ')');
  return r.abgebrochen ? 4 : 0;
}

/* ================= --pruefen ================= */
function pruefen() {
  var ord = M.ablage();
  var alt = JSON.parse(fs.readFileSync(path.join(ord, ALTNAME), 'utf8'));
  var neu = JSON.parse(fs.readFileSync(path.join(ord, ZIELNAME), 'utf8'));
  var lauf = JSON.parse(fs.readFileSync(path.join(HIER, 'b-lauf.json'), 'utf8'));
  var altLetztes = null;
  alt.eintraege.forEach(function (e) { if (e.bis && (!altLetztes || e.bis > altLetztes)) altLetztes = e.bis; });
  var AUS = { stand: new Date().toISOString(),
    alt: { stand: alt.stand, seiten: alt.seiten, gesamt: alt.gesamt, aktienartig: alt.aktienartig, letztesBis: altLetztes },
    neu: { stand: neu.stand, seiten: neu.seiten, abgebrochen: neu.abgebrochen, gesamt: neu.gesamt, aktienartig: neu.aktienartig, bytes: lauf.bytes, dauerSekunden: lauf.dauerSekunden },
    altesUnveraendert: lauf.altesUnveraendert };

  /* (a) jeder alte Eintrag mit demselben Kuerzel und demselben Abgangsdatum in der neuen Liste? */
  var neuJe = {}, frei = {}, altFrei = {};
  neu.eintraege.forEach(function (e) { (neuJe[e.sym] = neuJe[e.sym] || []).push(e); var k = e.sym + '|' + e.bis; frei[k] = (frei[k] || 0) + 1; });
  var gleich = 0, abw = [], altZahl = {};
  alt.eintraege.forEach(function (e) { altZahl[e.sym] = (altZahl[e.sym] || 0) + 1; });
  alt.eintraege.forEach(function (e) {
    var k = e.sym + '|' + e.bis; altFrei[k] = (altFrei[k] || 0) + 1;
    if (frei[k] > 0) { frei[k]--; gleich++; return; }
    /* Die alte Liste fuehrte 25 Kuerzel zweimal (gleiches oder um einen Tag versetztes Datum); steht eines
     * davon jetzt einmal in der neuen, ist das kein geaendertes Datum, sondern ein aufgeloester Doppeleintrag. */
    var art = !neuJe[e.sym] ? 'Kuerzel fehlt in der neuen Liste (wieder aktiv oder neu vergeben)'
      : altZahl[e.sym] > neuJe[e.sym].length ? 'alte Liste fuehrte das Kuerzel doppelt, neue einmal' : 'anderes Abgangsdatum';
    abw.push({ sym: e.sym, bisAlt: e.bis, art: art, bisNeu: neuJe[e.sym] ? neuJe[e.sym].map(function (x) { return x.bis; }) : null });
  });
  AUS.kuerzelMehrfach = { alt: Object.keys(altZahl).filter(function (s) { return altZahl[s] > 1; }).length,
    neu: Object.keys(neuJe).filter(function (s) { return neuJe[s].length > 1; }).length };
  var abwJeArt = {}; abw.forEach(function (x) { abwJeArt[x.art] = (abwJeArt[x.art] || 0) + 1; });
  AUS.a_altInNeu = { altEintraege: alt.eintraege.length, gleich: gleich, abweichungen: abw.length, jeArt: abwJeArt, namentlich: abw.slice(0, 30) };

  /* (b) neue Eintraege: nach dem Stand der alten Liste, und nachgetragene mit aelterem Datum */
  var nach = [], nachgetragen = 0, ohneDatumNeu = 0;
  neu.eintraege.forEach(function (e) {
    var k = e.sym + '|' + e.bis;
    if (altFrei[k] > 0) { altFrei[k]--; return; }
    if (!e.bis) ohneDatumNeu++;
    else if (e.bis > altLetztes) nach.push({ sym: e.sym, bis: e.bis, art: e.art, boerse: e.boerse });
    else nachgetragen++;
  });
  nach.sort(function (p, q) { return p.bis < q.bis ? -1 : p.bis > q.bis ? 1 : p.sym < q.sym ? -1 : 1; });
  var jeMonat = {}; nach.forEach(function (x) { jeMonat[x.bis.slice(0, 7)] = (jeMonat[x.bis.slice(0, 7)] || 0) + 1; });
  AUS.b_neu = { nachDemAltenStand: nach.length, altesLetztesBis: altLetztes, neuesLetztesBis: nach.length ? nach[nach.length - 1].bis : null, jeMonat: jeMonat,
    nachgetragenMitAelteremDatum: nachgetragen, neuOhneDatum: ohneDatumNeu, liste: nach };

  /* (c) die benannten Kuerzel */
  AUS.c_benannt = {};
  BENANNT.forEach(function (x) { AUS.c_benannt[x] = (neuJe[x] || []).map(function (e) { return e.bis; }); });

  /* (d) die 57 Wechsler (X = 10): Abgangsdatum 0..15 Kalendertage nach dem letzten Minutentag - Regel aus gemeinsam.js */
  var W = JSON.parse(fs.readFileSync(path.join(HIER, '..', 't1-wechsel.json'), 'utf8')).jeX['10'].lebendZuAbgegangen;
  var altJe = {}; alt.eintraege.forEach(function (e) { (altJe[e.sym] = altJe[e.sym] || []).push(e); });
  function treffer(je, w) {
    var basis = String(w.reihe).replace(/~2$/, ''), best = null;
    (je[basis] || je[basis.replace(/-/g, '.')] || []).forEach(function (e) {
      if (!e.bis) return;
      var diff = G.tageZwischen(w.letzterMinutentag, e.bis);
      if (diff >= 0 && diff <= G.ABGANG_NACH_TAGE && (!best || diff < best.diff)) best = { bis: e.bis, diff: diff };
    });
    return best;
  }
  var mitAlt = 0, mitNeu = 0, hinzu = [], ohne = [];
  W.forEach(function (w) {
    var a = treffer(altJe, w), n = treffer(neuJe, w);
    if (a) mitAlt++;
    if (n) mitNeu++;
    if (n && !a) hinzu.push({ reihe: w.reihe, letzterMinutentag: w.letzterMinutentag, bis: n.bis, diff: n.diff });
    if (!n) ohne.push({ reihe: w.reihe, letzterMinutentag: w.letzterMinutentag, gruppeEnde: w.gruppeEnde });
  });
  AUS.d_wechsler = { wechsler: W.length, mitAbgangsdatumAlt: mitAlt, mitAbgangsdatumNeu: mitNeu, neuHinzu: hinzu, weiterOhne: ohne };

  atomar(path.join(HIER, 'b-zahlen.json'), JSON.stringify(AUS, null, 1));
  console.log('neu: ' + JSON.stringify(AUS.neu) + '  alt: ' + JSON.stringify(AUS.alt));
  console.log('(a) ' + alt.eintraege.length + ' alte Eintraege, gleich ' + gleich + ', Abweichungen ' + abw.length + ' ' + JSON.stringify(abwJeArt) + ': ' +
    abw.slice(0, 30).map(function (x) { return x.sym + ' ' + x.bisAlt + '->' + (x.bisNeu ? x.bisNeu.join('/') : 'fehlt'); }).join(', '));
  console.log('(b) nach dem ' + altLetztes + ': ' + nach.length + ' ' + JSON.stringify(jeMonat) + ', letztes ' + AUS.b_neu.neuesLetztesBis + '; nachgetragen mit aelterem Datum ' + nachgetragen + ', neu ohne Datum ' + ohneDatumNeu);
  console.log('    ' + nach.map(function (x) { return x.sym + ' ' + x.bis.slice(5); }).join(', '));
  console.log('(c) ' + JSON.stringify(AUS.c_benannt));
  console.log('(d) ' + JSON.stringify(AUS.d_wechsler));
  return 0;
}

async function main() {
  if (arg('probe')) return probe();
  if (arg('holen')) return holen();
  if (arg('pruefen')) return pruefen();
  console.log('Kein Modus gewaehlt: --probe | --holen | --pruefen (siehe Kopf der Datei).');
  return 1;
}
if (require.main === module) {
  main().then(function (rc) { process.exitCode = rc; }).catch(function (e) {
    /* Nie den Text einer Quellenantwort: nur der Statuscode, sonst die Art des Fehlers. */
    console.log('Fehler: ' + (arg('pruefen') ? String(e && e.message).slice(0, 200) : statusAus(e) ? 'HTTP ' + statusAus(e) : String(e && e.name || 'unbekannt')));
    process.exitCode = 1;
  });
}
