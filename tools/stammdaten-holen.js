'use strict';
/* STAMMDATEN: Branche und Aktienanzahl je Boersenkuerzel - aus der SEC.
 *
 * WOZU. Fuer eine Marktuebersicht nach Art einer Kachelkarte braucht man drei Dinge
 * je Wert: die Tagesveraenderung (hat die App live), die Groesse des Unternehmens
 * (hatte sie nur fuer sechzehn handgepflegte Werte) und die Branche (hatte sie gar
 * nicht). Dieses Werkzeug holt die beiden fehlenden.
 *
 * WARUM DIE SEC UND NICHT DIE MASSIVE-SCHNITTSTELLE. Massive hat beides, aber nur am
 * Detail-Endpunkt - ein Abruf je Wert. Die Basis-Stufe erlaubt fuenf Abrufe je Minute;
 * dreitausend Werte waeren elf Stunden. Die SEC deckelt bei zehn Abrufen je SEKUNDE,
 * kostet nichts und braucht keinen Schluessel. Vor allem aber:
 *
 *   Die Aktienanzahl gibt es dort fuer ALLE Firmen in EINEM Abruf.
 *   /api/xbrl/frames/dei/EntityCommonStockSharesOutstanding/shares/CY2026Q2I.json
 *   -> rund 4.400 Firmen, je CIK die zuletzt gemeldete Stueckzahl.
 *
 * Die Branche braucht einen Abruf je Firma (submissions/CIK…json), aber sie aendert
 * sich praktisch nie: Was einmal geholt ist, wird beim naechsten Lauf uebersprungen.
 *
 * WAS HIER TATSACHE IST UND WAS SETZUNG:
 *   Tatsache  - CIK, Name, SIC-Code, SIC-Text, Aktienanzahl, Meldezeitraum.
 *   Setzung   - die Zuordnung SIC -> Sektor weiter unten. SIC ist eine Behoerden-
 *               systematik von 1987; "Technologie" kommt darin nicht vor. Apple ist
 *               3571 "Electronic Computers", also amtlich ein VERARBEITENDES GEWERBE.
 *               Wer danach gruppiert, bekommt Apple, Ford und Procter & Gamble in
 *               denselben Block. Die Tabelle unten faltet die Zweisteller deshalb zu
 *               brauchbaren Sektoren - das ist eine Entscheidung, keine Messung, und
 *               sie steht offen da, damit man sie aendern kann.
 * Beides landet in der Datei: der rohe SIC-Code UND der abgeleitete Sektor. Wer die
 * Faltung anders will, rechnet sie neu, ohne noch einmal bei der SEC zu fragen.
 *
 * KEIN APP-CODE. Liegt unter tools/, wird nur von Hand aufgerufen. Die App liest
 * spaeter nur die fertige Datei - sie fragt nie selbst bei der SEC an.
 *
 * Aufruf:
 *   node tools/stammdaten-holen.js                 alle Werte des 60m-Archivs
 *   node tools/stammdaten-holen.js AAPL,MSFT,NVDA  nur diese
 *   node tools/stammdaten-holen.js --alle          alles, was die SEC kennt
 * Ablage: <Datenordner>/markt/stammdaten.json
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');
var zlib = require('zlib');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var ZIEL = path.join(DATEN, 'markt');
var DATEI = path.join(ZIEL, 'stammdaten.json');

/* Die SEC verlangt einen Absender mit Kontakt und deckelt auf zehn Abrufe je Sekunde.
 * Wortgleich zu tools/edgar.js - dieselbe Behoerde, dieselben Regeln. */
var KOPF = { 'User-Agent': 'Markt-Dashboard (wilhelm.gms@gmail.com)', 'Accept-Encoding': 'gzip, deflate' };
var PAUSE = 130;

/* ---------------------------------------------------------------------------
 * SIC -> Sektor. SETZUNG, keine Tatsache. Gefaltet wird ueber den Zweisteller,
 * weil der Viersteller rund 400 Klassen hat und die Division (Ein-/Zweisteller-
 * Bereiche der Behoerde) mit "Manufacturing" die halbe Boerse in einen Topf wirft.
 *
 * Die Grenzen sind so gezogen, dass die Bloecke ungefaehr dem entsprechen, was ein
 * Mensch beim Wort "Sektor" erwartet - nicht dem, was 1987 gemeint war. Beispiele,
 * damit die Entscheidung nachpruefbar ist statt nur behauptet:
 *   35 Industrial Machinery & Computers -> Technologie   (Apple 3571, Dell 3571)
 *   36 Electronic & Other Electric Equipment -> Technologie   (Nvidia 3674, Intel 3674)
 *   73 Business Services -> Technologie   (Microsoft 7372, Alphabet 7370)
 *   283 Drugs -> Gesundheit, 284 Soap & Cosmetics -> Basiskonsum (siehe SIC3 unten)
 *   37 Transportation Equipment -> Industrie   (Ford 3711, Boeing 3721)
 * Wer 28 lieber bei "Chemie" haette, aendert eine Zeile. Der rohe SIC steht in der
 * Datei, es geht also nichts verloren. */
var SEKTOR_NACH_SIC2 = {
  Technologie: [35, 36, 38, 73, 78],
  Gesundheit: [28, 80, 83, 84],
  Finanzen: [60, 61, 62, 63, 64, 67],
  Immobilien: [65],
  Energie: [13, 29, 46],
  Rohstoffe: [10, 12, 14, 26, 30, 32, 33, 34],
  Industrie: [15, 16, 17, 24, 25, 37, 39, 40, 41, 42, 44, 45, 47, 76, 87],
  Versorger: [49],
  Telekommunikation: [48],
  'Zyklischer Konsum': [23, 27, 31, 50, 51, 52, 53, 55, 56, 57, 59, 70, 72, 75, 79],
  'Basiskonsum': [1, 2, 7, 8, 9, 20, 21, 22, 54, 58],
  Sonstige: [55555]
};
var SIC2_SEKTOR = {};
Object.keys(SEKTOR_NACH_SIC2).forEach(function (s) {
  SEKTOR_NACH_SIC2[s].forEach(function (n) { SIC2_SEKTOR[n] = s; });
});

/* ZWEI GRUPPEN VERTRAGEN DEN ZWEISTELLER NICHT. Aufgefallen an Procter & Gamble:
 *   28 "Chemicals & Allied Products" enthaelt 2834 (Pfizer, Arzneimittel) UND
 *   2844 (P&G, Koerperpflege) - Gesundheit und Basiskonsum im selben Zweisteller.
 *   38 "Instruments" enthaelt 3841 (Medizingeraete) neben 3827 (Messtechnik).
 * Deshalb fuer genau diese beiden Gruppen der Dreisteller. Ueberall sonst reicht der
 * Zweisteller; ihn flaechendeckend zu verfeinern hiesse, vierhundert Klassen von Hand
 * zu sortieren, ohne dass es die Karte besser macht. */
var SIC3_SEKTOR = {
  280: 'Rohstoffe', 281: 'Rohstoffe', 282: 'Rohstoffe',
  283: 'Gesundheit',
  284: 'Basiskonsum',
  285: 'Rohstoffe', 286: 'Rohstoffe', 287: 'Rohstoffe', 289: 'Rohstoffe',
  384: 'Gesundheit'
};
function sektorVon(sic) {
  var d = Math.floor(Number(sic) / 10);
  if (SIC3_SEKTOR[d]) return SIC3_SEKTOR[d];
  var n = Math.floor(Number(sic) / 100);
  return SIC2_SEKTOR[n] || 'Sonstige';
}

// ---------------------------------------------------------------------------
function warte(ms) { return new Promise(function (w) { setTimeout(w, ms); }); }

function hole(url) {
  return new Promise(function (fertig) {
    var req = https.get(url, { headers: KOPF, timeout: 30000 }, function (res) {
      if (res.statusCode !== 200) { res.resume(); return fertig(null); }
      var teile = [], strom = res;
      var enc = String(res.headers['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') strom = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') strom = res.pipe(zlib.createInflate());
      strom.on('data', function (c) { teile.push(c); });
      strom.on('end', function () { fertig(Buffer.concat(teile).toString('utf8')); });
      strom.on('error', function () { fertig(null); });
    });
    req.on('timeout', function () { req.destroy(); fertig(null); });
    req.on('error', function () { fertig(null); });
  });
}
async function holeJson(url) {
  var t = await hole(url);
  if (!t) return null;
  try { return JSON.parse(t); } catch (e) { return null; }
}

/** Welche Quartals-Momentaufnahme? Die juengste, die schon gemeldet ist - deshalb
 *  rueckwaerts suchen statt raten. "I" heisst instantaneous: ein Stichtagswert. */
function quartalsKennungen(jetzt) {
  var d = new Date(jetzt);
  var out = [];
  var j = d.getUTCFullYear(), q = Math.floor(d.getUTCMonth() / 3) + 1;
  for (var k = 0; k < 6; k++) {
    out.push('CY' + j + 'Q' + q + 'I');
    q--; if (q < 1) { q = 4; j--; }
  }
  return out;
}

/** Die Werte des 60m-Archivs - dieselbe Ordner-Konvention wie ueberall sonst. */
function archivOrdner() {
  if (process.env.MD_ARCHIV60M) return process.env.MD_ARCHIV60M;
  try {
    var p = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^﻿/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei */ }
  return path.join(DATEN, 'archiv60m');
}
function werteAusArchiv() {
  var o = archivOrdner();
  try {
    return fs.readdirSync(o)
      .filter(function (f) { return /^bars_60m_.+\.json$/.test(f); })
      .map(function (f) { return f.slice('bars_60m_'.length, -5); });
  } catch (e) { return []; }
}

/** Der letzte bekannte Schlusskurs aus dem Archiv - NUR als Startwert fuer die
 *  Rangfolge der Karte.
 *
 *  Warum ueberhaupt: Die Karte will die groessten Werte zuerst zeigen, kennt aber vor
 *  dem ersten Abruf keine Kurse. Ohne Anhaltspunkt muesste sie entweder alle
 *  zweitausend Werte abrufen, bevor sie das erste Kaestchen zeichnen kann, oder eine
 *  willkuerliche Auswahl treffen.
 *
 *  Dieser Kurs wird in der App SOFORT durch den Live-Kurs ersetzt. Er steht deshalb
 *  mit seinem Datum in der Datei - eine Zahl ohne Datum wuerde frueher oder spaeter
 *  fuer aktuell gehalten. */
function letzterKursAus(sym) {
  var p = path.join(archivOrdner(), 'bars_60m_' + sym + '.json');
  try {
    var j = JSON.parse(fs.readFileSync(p, 'utf8'));
    var s = j && j.series;
    if (!s || !s.length) return null;
    var b = s[s.length - 1];
    if (!(b && b[1] > 0)) return null;
    return { kurs: b[1], stand: new Date(b[0]).toISOString().slice(0, 10) };
  } catch (e) { return null; }
}

// ===========================================================================
(async function () {
  var arg = process.argv[2] || '';
  console.log('Stammdaten aus der SEC  ·  ' + new Date().toLocaleString('de-DE'));
  console.log('='.repeat(74));

  /* Was schon da ist, wird nicht neu geholt. Die Branche eines Unternehmens aendert
   * sich praktisch nie; die Aktienanzahl schon, die kommt aber ohnehin gesammelt. */
  var alt = { werte: {} };
  try { alt = JSON.parse(fs.readFileSync(DATEI, 'utf8')); } catch (e) { /* erster Lauf */ }
  var bekannt = alt.werte || {};

  // ---- 1) Kuerzel -> CIK (ein Abruf fuer alle) ----
  var tick = await holeJson('https://www.sec.gov/files/company_tickers.json');
  if (!tick) { console.error('company_tickers.json nicht erreichbar - Abbruch.'); process.exit(1); }
  var cikVon = {}, nameVon = {};
  Object.keys(tick).forEach(function (k) {
    var e = tick[k];
    if (e && e.ticker) { cikVon[e.ticker] = e.cik_str; nameVon[e.ticker] = e.title; }
  });
  console.log('1) Kuerzel der SEC bekannt: ' + Object.keys(cikVon).length);

  // ---- 2) Welche Werte wollen wir? ----
  var wunsch;
  if (arg === '--alle') wunsch = Object.keys(cikVon);
  else if (arg) wunsch = arg.split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
  else {
    wunsch = werteAusArchiv();
    console.log('   Universum aus dem 60m-Archiv: ' + wunsch.length + ' Reihen  (' + archivOrdner() + ')');
    if (!wunsch.length) {
      console.log('   Kein Archiv gefunden. Entweder Kuerzel uebergeben oder --alle benutzen.');
      process.exit(1);
    }
  }
  /* Yahoo schreibt Aktienklassen mit Bindestrich (BRK-B), die SEC mit Punkt (BRK.B).
   * Ohne diese Zeile faellt genau die Sorte Wert heraus, die man am ehesten sucht. */
  function secName(sym) { return cikVon[sym] ? sym : sym.replace(/-/g, '.'); }
  var ohneCik = [];
  var liste = wunsch.filter(function (s) {
    if (cikVon[secName(s)]) return true;
    ohneCik.push(s); return false;
  });
  console.log('2) davon bei der SEC gefuehrt: ' + liste.length + ', ohne Eintrag: ' + ohneCik.length);
  if (ohneCik.length) {
    console.log('   ohne Eintrag sind meist ETFs, Fonds und auslaendische Papiere, z. B.: ' +
      ohneCik.slice(0, 12).join(' ') + (ohneCik.length > 12 ? ' …' : ''));
  }

  /* ---- 3) Aktienanzahl: drei Stufen, weil eine nicht reicht ----
   * Nachgemessen am 25.08.2026 an 25 Werten quer durch die Sektoren:
   *   Stufe 1 allein liess NVDA, GOOGL, META, TSM, ASML, ARM, F, NEE und PLD offen -
   *   also ausgerechnet die groessten. Der Grund ist nicht Zufall:
   *     - Wer ein verschobenes Geschaeftsjahr hat (NVDA endet im Januar), faellt aus
   *       dem Kalenderquartal heraus, das die Sammelabfrage adressiert.
   *     - Wer mehrere Aktiengattungen hat (GOOGL, META), taggt sie mit einer Achse,
   *       die die Sammelabfrage nicht aufloest.
   *   Stufe 2 ist dieselbe Abfrage auf dem us-gaap-Konzept - sie holt GOOGL und rund
   *   3.500 weitere. Stufe 3 fragt nur noch die Reste einzeln.
   *
   * ALTERSGRENZE. Fords juengste Meldung dieses Konzepts stammt von 2011 - eine
   * Zahl, die plausibel aussieht und fuenfzehn Jahre alt ist. Ohne Grenze waere
   * daraus eine falsche Marktkapitalisierung geworden, und zwar eine, die niemandem
   * auffaellt. Alles aelter als 550 Tage gilt deshalb als NICHT vorhanden. */
  var MAX_ALTER_TAGE = 550;
  var aktien = {}, quelleVon = {}, zeitraum = null;

  function ausRahmen(fr, marke) {
    var n = 0;
    (fr.data || []).forEach(function (x) {
      if (x.cik != null && x.val > 0 && aktien[x.cik] == null) {
        aktien[x.cik] = x.val; quelleVon[x.cik] = marke; n++;
      }
    });
    return n;
  }
  for (var qk of quartalsKennungen(Date.now())) {
    var fr1 = await holeJson('https://data.sec.gov/api/xbrl/frames/dei/EntityCommonStockSharesOutstanding/shares/' + qk + '.json');
    await warte(PAUSE);
    if (!fr1 || !Array.isArray(fr1.data) || fr1.data.length < 500) continue;
    console.log('3) Aktienanzahl, Stufe 1 (dei, Sammelabruf ' + qk + '): ' + ausRahmen(fr1, 'dei/' + qk) + ' Firmen');
    zeitraum = qk;
    var fr2 = await holeJson('https://data.sec.gov/api/xbrl/frames/us-gaap/CommonStockSharesOutstanding/shares/' + qk + '.json');
    await warte(PAUSE);
    if (fr2 && Array.isArray(fr2.data)) {
      console.log('   Stufe 2 (us-gaap, Sammelabruf): ' + ausRahmen(fr2, 'us-gaap/' + qk) + ' weitere');
    }
    break;
  }
  if (!zeitraum) console.log('3) Aktienanzahl: kein Quartal lieferte Daten - die Karte bliebe ohne Groessen.');

  // ---- 4) Branche je Firma - nur fuer die noch unbekannten ----
  var neu = 0, fehl = 0;
  var offen = liste.filter(function (s) { return !(bekannt[s] && bekannt[s].sic); });
  console.log('4) Branche: ' + offen.length + ' neu zu holen, ' + (liste.length - offen.length) + ' schon bekannt');
  if (offen.length > 400) {
    console.log('   Das dauert rund ' + Math.ceil(offen.length * PAUSE / 60000) + ' Minuten (zehn Abrufe je Sekunde sind das Limit der SEC).');
  }
  for (var i = 0; i < offen.length; i++) {
    var sym = offen[i];
    var cik = cikVon[secName(sym)];
    var j = await holeJson('https://data.sec.gov/submissions/CIK' + String(cik).padStart(10, '0') + '.json');
    await warte(PAUSE);
    if (!j || !j.sic) { fehl++; continue; }
    /* AUSLAENDISCHER EMITTENT? Das entscheidet, ob die Stueckzahl ueberhaupt zum
     * gehandelten Papier passt. Wer 20-F oder 40-F einreicht, ist ein Foreign Private
     * Issuer; sein US-Papier ist meist ein ADR, das MEHRERE Stammaktien buendelt.
     * Die SEC meldet die Stammaktien - mal ADR-Kurs gerechnet ergibt das eine um den
     * Buendelfaktor zu grosse Firma. Nachgemessen am 25.08.2026: TSM kam so auf das
     * 5,3-Fache der handgepflegten Zahl.
     * Das Buendelverhaeltnis steht NICHT in den SEC-Daten. Deshalb wird hier nur
     * markiert, nicht geraten - die Karte muss selbst entscheiden, ob sie solche
     * Werte weglaesst oder eine gepflegte Zahl benutzt.
     * Geprueft wird an den zuletzt eingereichten Formularen; ein eigener Abruf ist
     * dafuer nicht noetig, sie stehen in derselben Antwort. */
    var formen = (j.filings && j.filings.recent && j.filings.recent.form) || [];
    var auslaender = formen.some(function (f) { return f === '20-F' || f === '40-F' || f === '6-K'; });
    bekannt[sym] = {
      cik: cik, name: j.name || nameVon[secName(sym)] || sym,
      sic: Number(j.sic), sicText: j.sicDescription || '',
      sektor: sektorVon(j.sic),
      boerse: (j.exchanges || [])[0] || ''
    };
    if (auslaender) bekannt[sym].auslaender = true;
    neu++;
    if (neu % 100 === 0) console.log('   … ' + neu + ' von ' + offen.length);
  }
  console.log('   neu geholt: ' + neu + ', ohne Branchenangabe: ' + fehl);

  // ---- 5) Aktienanzahl anheften, Reste einzeln nachholen ----
  var mitAktien = 0, einzeln = 0, zuAlt = 0;
  var luecken = [];
  liste.forEach(function (sym) {
    var e = bekannt[sym];
    if (!e) return;
    if (aktien[e.cik] > 0) { e.aktien = aktien[e.cik]; e.aktienStand = quelleVon[e.cik]; mitAktien++; }
    else luecken.push(sym);
  });
  if (luecken.length) {
    console.log('   Stufe 3: ' + luecken.length + ' Reste einzeln (verschobenes Geschaeftsjahr, mehrere Gattungen)');
  }
  var grenze = Date.now() - MAX_ALTER_TAGE * 86400000;
  for (var li = 0; li < luecken.length; li++) {
    var sym3 = luecken[li];
    var e3 = bekannt[sym3];
    var cf = await holeJson('https://data.sec.gov/api/xbrl/companyfacts/CIK' + String(e3.cik).padStart(10, '0') + '.json');
    await warte(PAUSE);
    if (!cf || !cf.facts) continue;
    var best = null;
    Object.keys(cf.facts).forEach(function (tax) {
      ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding'].forEach(function (name) {
        var k = cf.facts[tax][name];
        if (!k || !k.units || !k.units.shares) return;
        var u = k.units.shares.filter(function (x) { return x.val > 0 && x.end; });
        if (!u.length) return;
        var letzt = u.reduce(function (a, x) { return x.end > a ? x.end : a; }, '');
        /* Mehrere Gattungen zum selben Stichtag werden ADDIERT - die
         * Marktkapitalisierung ist die Summe ueber alle Gattungen, nicht eine davon. */
        var summe = u.filter(function (x) { return x.end === letzt; })
          .reduce(function (a, x) { return a + x.val; }, 0);
        if (!best || letzt > best.end) best = { end: letzt, val: summe, konzept: tax + '/' + name };
      });
    });
    if (!best) continue;
    if (Date.parse(best.end + 'T00:00:00Z') < grenze) {
      /* Sichtbar machen, nicht verschweigen: eine veraltete Zahl ist schlimmer als
       * gar keine, weil sie nicht auffaellt. */
      zuAlt++;
      e3.aktienVeraltet = best.end;
      continue;
    }
    e3.aktien = best.val; e3.aktienStand = best.konzept + '@' + best.end;
    mitAktien++; einzeln++;
  }
  if (luecken.length) {
    console.log('   davon einzeln gefunden: ' + einzeln + ', wegen Alter verworfen: ' + zuAlt +
      ', gar nicht getaggt: ' + (luecken.length - einzeln - zuAlt));
  }

  /* ---- 5b) Startkurs aus dem Archiv, falls vorhanden ----
   * Nur wenn das Archiv da ist; mit einer uebergebenen Kuerzelliste laeuft das
   * Werkzeug auch ohne. Die Karte kommt dann ohne Rangfolge aus und holt eben alles. */
  if (!arg || arg === '--alle') {
    var mitKurs = 0;
    liste.forEach(function (sym) {
      var e = bekannt[sym];
      if (!e || !(e.aktien > 0)) return;
      var lk = letzterKursAus(sym);
      if (lk) { e.startKurs = lk.kurs; e.startKursStand = lk.stand; mitKurs++; }
    });
    if (mitKurs) console.log('5) Startkurs aus dem Archiv fuer ' + mitKurs + ' Werte (nur zur Rangfolge, die App ersetzt ihn sofort)');
  }

  // ---- 6) Ablegen ----
  fs.mkdirSync(ZIEL, { recursive: true });
  var raus = {
    stand: new Date().toISOString(),
    quelle: 'SEC EDGAR (company_tickers, xbrl/frames, submissions)',
    hinweis: 'sic und sicText sind Tatsachen der Behoerde. sektor ist eine Faltung der ' +
      'Zweisteller in tools/stammdaten-holen.js - eine Entscheidung, keine Messung.',
    aktienStand: zeitraum,
    werte: bekannt
  };
  fs.writeFileSync(DATEI, JSON.stringify(raus, null, 1));

  // ---- 7) Was ist dabei herausgekommen? ----
  console.log('\n' + '='.repeat(74));
  var proSektor = {};
  liste.forEach(function (s) {
    var e = bekannt[s]; if (!e) return;
    if (!proSektor[e.sektor]) proSektor[e.sektor] = { n: 0, mitAktien: 0 };
    proSektor[e.sektor].n++;
    if (e.aktien > 0) proSektor[e.sektor].mitAktien++;
  });
  console.log('ABDECKUNG\n');
  Object.keys(proSektor).sort(function (a, b) { return proSektor[b].n - proSektor[a].n; })
    .forEach(function (s) {
      console.log('   ' + s.padEnd(20) + String(proSektor[s].n).padStart(5) + ' Werte, davon ' +
        proSektor[s].mitAktien + ' mit Aktienanzahl');
    });
  console.log('\n   Gesamt: ' + liste.length + ' Werte, ' + mitAktien + ' mit Groesse (' +
    (liste.length ? Math.round(mitAktien / liste.length * 100) : 0) + ' %)');
  var adr = liste.filter(function (s2) { return bekannt[s2] && bekannt[s2].auslaender && bekannt[s2].aktien > 0; });
  if (adr.length) {
    console.log('\n   AUSLAENDISCHE EMITTENTEN (20-F/40-F/6-K) - ' + adr.length + ' Stueck:');
    console.log('   ' + adr.join(', '));
    console.log('   Ihre Stueckzahl sind STAMMAKTIEN. Gehandelt wird meist ein ADR, das mehrere');
    console.log('   davon buendelt - das Verhaeltnis steht nicht in den SEC-Daten. Mal ADR-Kurs');
    console.log('   gerechnet ergibt das eine zu grosse Firma. Die Karte muss sie weglassen oder');
    console.log('   eine gepflegte Zahl benutzen; deshalb sind sie in der Datei markiert.');
  }
  var ohneGroesse = liste.filter(function (s2) { return bekannt[s2] && !(bekannt[s2].aktien > 0); });
  if (ohneGroesse.length) {
    console.log('\n   OHNE GROESSE - diese Werte koennen auf einer Flaechenkarte nicht erscheinen:');
    console.log('   ' + ohneGroesse.map(function (s2) {
      return s2 + (bekannt[s2].aktienVeraltet ? ' (nur ' + bekannt[s2].aktienVeraltet + ', zu alt)' : '');
    }).join(', '));
    console.log('   Grund ist fast immer: die Firma taggt die Stueckzahl gar nicht in XBRL');
    console.log('   (mehrere Aktiengattungen) oder es ist ein auslaendischer Emittent mit 20-F.');
    console.log('   Fuer solche Faelle braucht die App eine gepflegte Ersatzzahl - so wie heute');
    console.log('   schon fuer die sechzehn Werte der Kachelliste.');
  }
  console.log('   Abgelegt: ' + DATEI);
  console.log('\n   Die Marktkapitalisierung wird NICHT hier gerechnet - sie ist Kurs mal');
  console.log('   Aktienanzahl und entsteht in der App bei jeder Aktualisierung neu.');
})();
