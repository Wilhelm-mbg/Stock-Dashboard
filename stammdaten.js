'use strict';
/* STAMMDATEN aus der SEC: Branche und Aktienanzahl - der gemeinsame Kern.
 *
 * WARUM DIESE DATEI. Es gab die Rechnung zweimal: einmal im Werkzeug unter tools/,
 * einmal haette sie in die App gemusst. Zwei Kopien derselben Tabelle sind in diesem
 * Projekt schon mehrfach auseinandergelaufen (kursOk, RISK_FREE, die Sitzungslaenge),
 * und die Faltung SIC -> Sektor ist genau die Sorte Tabelle, die still verrutscht.
 * Deshalb hier einmal, ohne DOM, ohne Netz, ohne Zustand - der Abruf wird
 * HINEINGEREICHT. Damit laeuft die Datei in Node und ist wirklich pruefbar.
 *
 * WAS TATSACHE IST UND WAS SETZUNG:
 *   Tatsache  - CIK, Name, SIC-Code, SIC-Text, Aktienanzahl, Meldezeitraum.
 *   Setzung   - die Zuordnung SIC -> Sektor. SIC ist eine Behoerdensystematik von
 *               1987; "Technologie" kommt darin nicht vor. Apple ist 3571
 *               "Electronic Computers", amtlich also VERARBEITENDES GEWERBE. Die
 *               Tabelle faltet die Zweisteller zu brauchbaren Sektoren - eine
 *               Entscheidung, keine Messung, und sie steht offen da.
 * Beides landet in der Ausgabe: der rohe SIC UND der abgeleitete Sektor. */
(function (root) {

  /* Die SEC deckelt auf zehn Abrufe je Sekunde und verlangt einen Absender mit
   * Kontakt. Beides wortgleich zu tools/edgar.js - dieselbe Behoerde. */
  var KOPF = { 'User-Agent': 'Markt-Dashboard (wilhelm.gms@gmail.com)', 'Accept-Encoding': 'gzip, deflate' };
  var PAUSE = 130;

  /* Weisse Fahne fuer veraltete Zahlen. Fords juengste Meldung dieses Konzepts stammt
   * von 2011 - eine plausible, fuenfzehn Jahre alte Zahl, aus der eine falsche
   * Marktkapitalisierung geworden waere, die niemandem auffaellt. */
  var MAX_ALTER_TAGE = 550;

  /* SIC -> Sektor. Beispiele, damit die Entscheidung nachpruefbar ist statt behauptet:
   *   35 Industrial Machinery & Computers -> Technologie   (Apple 3571)
   *   36 Electronic & Other Electric Equipment -> Technologie   (Nvidia 3674)
   *   73 Business Services -> Technologie   (Microsoft 7372, Alphabet 7370)
   *   37 Transportation Equipment -> Industrie   (Ford 3711, Boeing 3721) */
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
    Basiskonsum: [1, 2, 7, 8, 9, 20, 21, 22, 54, 58],
    Sonstige: [55555]
  };
  var SIC2_SEKTOR = {};
  Object.keys(SEKTOR_NACH_SIC2).forEach(function (s) {
    SEKTOR_NACH_SIC2[s].forEach(function (n) { SIC2_SEKTOR[n] = s; });
  });

  /* ZWEI GRUPPEN VERTRAGEN DEN ZWEISTELLER NICHT. Aufgefallen an Procter & Gamble:
   *   28 "Chemicals" enthaelt 2834 (Pfizer, Arzneimittel) UND 2844 (P&G, Koerperpflege)
   *   38 "Instruments" enthaelt 3841 (Medizingeraete) neben 3827 (Messtechnik)
   * Deshalb fuer genau diese beiden der Dreisteller. Ueberall sonst reicht der
   * Zweisteller; vierhundert Klassen von Hand zu sortieren macht die Karte nicht besser. */
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

  function cik10(cik) { return String(cik).replace(/\D/g, '').padStart(10, '0'); }

  /* Die Adressen stehen HIER fest und werden nicht von aussen gereicht. Das ist
   * dieselbe Haltung wie beim Yahoo-Kalender in main.js: ein allgemeiner
   * Durchreicher waere eine offene Tuer. */
  var URL = {
    tickers: function () { return 'https://www.sec.gov/files/company_tickers.json'; },
    rahmen: function (tax, konzept, q) {
      return 'https://data.sec.gov/api/xbrl/frames/' + tax + '/' + konzept + '/shares/' + q + '.json';
    },
    submissions: function (cik) { return 'https://data.sec.gov/submissions/CIK' + cik10(cik) + '.json'; },
    facts: function (cik) { return 'https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik10(cik) + '.json'; }
  };

  /** Welche Quartals-Momentaufnahmen kommen in Frage? Die juengsten zuerst - deshalb
   *  rueckwaerts, statt zu raten. "I" heisst instantaneous: ein Stichtagswert. */
  function quartalsKennungen(jetzt) {
    var d = new Date(jetzt == null ? Date.now() : jetzt);
    var out = [], j = d.getUTCFullYear(), q = Math.floor(d.getUTCMonth() / 3) + 1;
    for (var k = 0; k < 6; k++) {
      out.push('CY' + j + 'Q' + q + 'I');
      q--; if (q < 1) { q = 4; j--; }
    }
    return out;
  }

  /** Aus einem Sammelabruf die Stueckzahlen uebernehmen - nur wo noch nichts steht.
   *  Gibt zurueck, wie viele NEU dazugekommen sind. */
  function ausRahmen(rahmen, marke, aktien, quelleVon) {
    var n = 0;
    ((rahmen && rahmen.data) || []).forEach(function (x) {
      if (x && x.cik != null && x.val > 0 && aktien[x.cik] == null) {
        aktien[x.cik] = x.val; quelleVon[x.cik] = marke; n++;
      }
    });
    return n;
  }

  /** Die Stueckzahl aus den Einzelmeldungen einer Firma.
   *  Nimmt den juengsten Stichtag und ADDIERT alle Gattungen an diesem Tag - die
   *  Marktkapitalisierung ist die Summe ueber alle Gattungen, nicht eine davon.
   *  Gibt null zurueck, wenn nichts da ist; { zuAlt: '2011-04-28' }, wenn der
   *  juengste Wert die Altersgrenze reisst. Verschweigen waere hier das Schlimmste:
   *  eine veraltete Zahl faellt nicht auf, eine fehlende schon. */
  function ausFacts(facts, jetzt) {
    var best = null;
    var f = (facts && facts.facts) || {};
    Object.keys(f).forEach(function (tax) {
      ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding'].forEach(function (name) {
        var k = f[tax][name];
        if (!k || !k.units || !k.units.shares) return;
        var u = k.units.shares.filter(function (x) { return x.val > 0 && x.end; });
        if (!u.length) return;
        var letzt = u.reduce(function (a, x) { return x.end > a ? x.end : a; }, '');
        var summe = u.filter(function (x) { return x.end === letzt; })
          .reduce(function (a, x) { return a + x.val; }, 0);
        if (!best || letzt > best.end) best = { end: letzt, val: summe, konzept: tax + '/' + name };
      });
    });
    if (!best) return null;
    var grenze = (jetzt == null ? Date.now() : jetzt) - MAX_ALTER_TAGE * 86400000;
    if (Date.parse(best.end + 'T00:00:00Z') < grenze) return { zuAlt: best.end };
    return best;
  }

  /** Auslaendischer Emittent? Wer 20-F/40-F/6-K einreicht, ist ein Foreign Private
   *  Issuer; sein US-Papier ist meist ein ADR, das MEHRERE Stammaktien buendelt. Die
   *  SEC meldet die Stammaktien - mal ADR-Kurs gerechnet ergibt das eine um den
   *  Buendelfaktor zu grosse Firma. Nachgemessen am 25.08.2026: TSM kam so auf das
   *  5,3-Fache der handgepflegten Zahl. Das Verhaeltnis steht NICHT in den SEC-Daten,
   *  deshalb wird nur markiert, nicht geraten. */
  function istAuslaender(submissions) {
    var formen = (submissions && submissions.filings && submissions.filings.recent &&
      submissions.filings.recent.form) || [];
    return formen.some(function (f) { return f === '20-F' || f === '40-F' || f === '6-K'; });
  }

  /** Yahoo schreibt Aktienklassen mit Bindestrich (BRK-B), die SEC mit Punkt (BRK.B).
   *  Ohne das faellt genau die Sorte Wert heraus, die man am ehesten sucht. */
  function secName(sym, bekannt) { return bekannt[sym] ? sym : String(sym).replace(/-/g, '.'); }

  /** Ticker -> CIK und Name aus company_tickers.json. */
  function tickerTabelle(j) {
    var cikVon = {}, nameVon = {};
    Object.keys(j || {}).forEach(function (k) {
      var e = j[k];
      if (e && e.ticker) { cikVon[e.ticker] = e.cik_str; nameVon[e.ticker] = e.title; }
    });
    return { cikVon: cikVon, nameVon: nameVon };
  }

  /** Der Sammelteil: drei Abrufe, danach steht die Stueckzahl fuer tausende Firmen.
   *  holeJson wird hineingereicht - diese Datei kennt kein Netz.
   *  Rueckgabe { cikVon, nameVon, aktien, quelleVon, zeitraum }. */
  async function basis(holeJson, jetzt) {
    var tick = await holeJson(URL.tickers());
    if (!tick) throw new Error('company_tickers.json nicht erreichbar');
    var t = tickerTabelle(tick);
    var aktien = {}, quelleVon = {}, zeitraum = null, stufe1 = 0, stufe2 = 0;
    var qs = quartalsKennungen(jetzt);
    for (var i = 0; i < qs.length; i++) {
      var fr1 = await holeJson(URL.rahmen('dei', 'EntityCommonStockSharesOutstanding', qs[i]));
      if (!fr1 || !Array.isArray(fr1.data) || fr1.data.length < 500) continue;
      stufe1 = ausRahmen(fr1, 'dei/' + qs[i], aktien, quelleVon);
      zeitraum = qs[i];
      /* Stufe 2 ist derselbe Abruf auf dem us-gaap-Konzept. Ohne sie fehlt GOOGL:
       * Wer mehrere Aktiengattungen hat, taggt sie mit einer Achse, die der
       * dei-Sammelabruf nicht aufloest. */
      var fr2 = await holeJson(URL.rahmen('us-gaap', 'CommonStockSharesOutstanding', qs[i]));
      if (fr2 && Array.isArray(fr2.data)) stufe2 = ausRahmen(fr2, 'us-gaap/' + qs[i], aktien, quelleVon);
      break;
    }
    return { cikVon: t.cikVon, nameVon: t.nameVon, aktien: aktien, quelleVon: quelleVon,
      zeitraum: zeitraum, stufe1: stufe1, stufe2: stufe2 };
  }

  /** Branche je Firma - ein Abruf, aber nur fuer die noch unbekannten. Die Branche
   *  aendert sich praktisch nie; was einmal da ist, bleibt.
   *  melde(fertig, gesamt) wird durchgereicht, damit ein Fortschritt sichtbar ist. */
  async function branchen(holeJson, warte, syms, b, bekannt, melde) {
    var neu = 0, fehl = 0;
    var offen = syms.filter(function (s) { return !(bekannt[s] && bekannt[s].sic); });
    for (var i = 0; i < offen.length; i++) {
      var sym = offen[i];
      var cik = b.cikVon[secName(sym, b.cikVon)];
      if (!cik) { fehl++; continue; }
      var j = await holeJson(URL.submissions(cik));
      if (warte) await warte(PAUSE);
      if (!j || !j.sic) { fehl++; continue; }
      bekannt[sym] = {
        cik: cik, name: j.name || b.nameVon[secName(sym, b.cikVon)] || sym,
        sic: Number(j.sic), sicText: j.sicDescription || '',
        sektor: sektorVon(j.sic),
        boerse: (j.exchanges || [])[0] || ''
      };
      if (istAuslaender(j)) bekannt[sym].auslaender = true;
      neu++;
      if (melde) melde(i + 1, offen.length);
    }
    return { neu: neu, fehl: fehl, offen: offen.length };
  }

  /** Stueckzahlen anheften; was der Sammelabruf nicht hatte, einzeln nachholen. */
  async function stueckzahlen(holeJson, warte, syms, b, bekannt, jetzt, melde) {
    var mit = 0, einzeln = 0, zuAlt = 0, luecken = [];
    syms.forEach(function (sym) {
      var e = bekannt[sym];
      if (!e) return;
      if (b.aktien[e.cik] > 0) { e.aktien = b.aktien[e.cik]; e.aktienStand = b.quelleVon[e.cik]; mit++; }
      else luecken.push(sym);
    });
    for (var i = 0; i < luecken.length; i++) {
      var e2 = bekannt[luecken[i]];
      var cf = await holeJson(URL.facts(e2.cik));
      if (warte) await warte(PAUSE);
      var r = ausFacts(cf, jetzt);
      if (melde) melde(i + 1, luecken.length);
      if (!r) continue;
      if (r.zuAlt) { zuAlt++; e2.aktienVeraltet = r.zuAlt; continue; }
      e2.aktien = r.val; e2.aktienStand = r.konzept + '@' + r.end;
      mit++; einzeln++;
    }
    return { mit: mit, einzeln: einzeln, zuAlt: zuAlt, luecken: luecken.length };
  }

  var Stammdaten = {
    KOPF: KOPF, PAUSE: PAUSE, MAX_ALTER_TAGE: MAX_ALTER_TAGE, URL: URL,
    SEKTOR_NACH_SIC2: SEKTOR_NACH_SIC2, SIC3_SEKTOR: SIC3_SEKTOR,
    sektorVon: sektorVon, quartalsKennungen: quartalsKennungen, cik10: cik10,
    ausRahmen: ausRahmen, ausFacts: ausFacts, istAuslaender: istAuslaender,
    tickerTabelle: tickerTabelle, secName: secName,
    basis: basis, branchen: branchen, stueckzahlen: stueckzahlen
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Stammdaten; return; }
  root.Stammdaten = Stammdaten;
})(typeof window !== 'undefined' ? window : globalThis);
