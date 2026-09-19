'use strict';
/* Baustein 3 (Auftrag Nr. 44 / 44b): Auswertung der Tageszaehler -> ABDECKUNG.md + auswertung.json.
 * (0) Luecken der Quelle: fehlende 15-min-Dateien nach Uhrzeit (UTC) und Monat, Anteil US-Handelszeit 13:30-20:00 UTC, je Jahr
 * (a) Abdeckung je Klasse und Monat (Anteil Symbole mit >= 1 / >= 5 / >= 20 Artikeln), je Stufe, mit und OHNE Medienfirmen
 * (b) Artikel je Symbol-Monat: Median, P10, P90 je Klasse (mit und ohne Null-Monate)
 * (c) Fehlerquote der Zuordnung aus den von Hand gepruefen Stichproben (pruefung-*.json, Urteile vom Chat, nicht von einem Modell)
 * (d) Ton je Klasse: Mittel, sd, Anteil negativ, Anteil uebersetzt - mit und ohne Medienfirmen   (e) 2018 gegen 2025
 * (f) Urteil je Klasse (>= 80 % mit >= 5/Monat, Namensfehler <= 10 %), dazu was ein Tagesdesign mit der erreichten Abdeckung noch traegt
 *
 * Aufruf:  node auswerten.js [--aus voll]                       -> ABDECKUNG.md, auswertung.json
 *          node auswerten.js --stichprobe <name> [--je 34] [--klasse] [--tag T] [--von A --bis B] [--aus voll]
 *              -> pruefung-<name>.json: je Monat (oder je Tag/Klasse) die `je` Treffer mit kleinstem u je Stufe (gleichverteilt),
 *                 Urteil-Feld leer; danach von Hand fuellen: "urteil": "richtig" | "falsch" | "verdacht" [, "grund": "..."]
 * Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var HIER = __dirname;
var STUFEN = ['voll', 'kurz'], KLASSEN = [1, 2, 3], SCHWELLEN = [1, 5, 20];

/* Medien-, Plattform- und Boersenfirmen (Handliste). Regel: der Firmenname steht in Nachrichtentexten ueberwiegend als
 * QUELLE/ZITAT (Nachrichtenmedium), als VEROEFFENTLICHUNGSORT (soziale/Streaming-Plattform: "posted on Twitter", "on Netflix",
 * Pinterest-Knopf) oder als HANDELSPLATZ/INDEX/RATING (Nasdaq-Listing "NASDAQ:XYZ", "Nasdaq fiel 1 %", S&P 500, Moody's-Rating) -
 * die Nennung ist dann keine Firmen-Nachricht. Kern der Liste sind die Symbole, deren Handpruefung ueberwiegend "verdacht"
 * ergab (NDAQ, TWTR, NYT, PINS; auswertung.json -> fehler.*.jeSymbol); der Rest sind gleichartige Namen im Panel (Analogie,
 * nicht gemessen). DISCA/DISCK: Treffer stammen aus dem Seitenfuss "A Warner Bros. Discovery Company" (Handpruefung: alle falsch).
 * Eine Branchenregel (sektorVonSic) trennt das nicht: SIC-Division "Services" mischt Medien mit Software und Handel. */
var MEDIEN = ['NFLX', 'TWTR', 'NDAQ', 'NYT', 'PINS', 'META', 'SNAP', 'GOOG', 'GOOGL', 'SPOT', 'ROKU', 'NWSA', 'FOXA', 'FOX', 'VIAB', 'CBS', 'WBD', 'DISCA', 'DISCK', 'TWX', 'ICE', 'CME', 'CBOE', 'SPGI', 'MCO'];
var US_VON = 1330, US_BIS = 2000;                       // US-Handelszeit in UTC (13:30 <= t < 20:00), 26 von 96 Rasterplaetzen

function argumente(a) { var o = {}; for (var i = 0; i < a.length; i++) if (a[i].slice(0, 2) === '--') { var k = a[i].slice(2); if (i + 1 < a.length && a[i + 1].slice(0, 2) !== '--') o[k] = a[++i]; else o[k] = true; } return o; }
function quantil(sortiert, q) { if (!sortiert.length) return null; var p = (sortiert.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return +(sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (p - lo)).toFixed(1); }
function pz(x, n) { return n ? (100 * x / n).toFixed(1) + ' %' : '-'; }
function median(l) { var s = l.slice().sort(function (x, y) { return x - y; }); return s.length ? quantil(s, 0.5) : null; }
function istUsZeit(hhmm) { var t = parseInt(hhmm, 10); return t >= US_VON && t < US_BIS; }

function ladeTage(aus, von, bis, tag) {
  var d = path.join(aus, 'tage');
  return fs.readdirSync(d).filter(function (f) { return /^\d{4}-\d{2}-\d{2}\.json$/.test(f); }).map(function (f) { return f.slice(0, 10); })
    .filter(function (t) { return (!von || t >= von) && (!bis || t <= bis) && (!tag || t === tag); }).sort()
    .map(function (t) { return JSON.parse(fs.readFileSync(path.join(d, t + '.json'), 'utf8')); });
}

/* ---------- Stichprobe zum Pruefen anlegen ---------- */
function stichprobeAnlegen(a, aus, karte) {
  var tage = ladeTage(aus, a.von, a.bis, a.tag), je = parseInt(a.je, 10) || 34, gruppen = {};
  tage.forEach(function (T) {
    STUFEN.forEach(function (st) {
      var r = T.stichprobe[st]; if (!r) return;
      var listen = Array.isArray(r) ? { 0: r } : r;
      Object.keys(listen).forEach(function (kl) {
        listen[kl].forEach(function (x) {
          var g = (a.klasse ? 'k' + (x.klasse || kl) : T.tag.slice(0, 7)) + '|' + st;
          (gruppen[g] = gruppen[g] || []).push(x);
        });
      });
    });
  });
  var aus2 = [];
  Object.keys(gruppen).sort().forEach(function (g) {
    gruppen[g].sort(function (x, y) { return x.u - y.u; }).slice(0, je).forEach(function (x) {
      var k = karte.karte[x.sym] || {};
      aus2.push({ gruppe: g, sym: x.sym, klasse: x.klasse || null, name: k.voll, kurz: k.kurz, stufe: x.stufe, tag: x.tag, org: x.org, quelle: x.quelle, dok: x.dok, ton: x.ton, uebersetzt: x.uebersetzt, urteil: null });
    });
  });
  var p = path.join(HIER, 'pruefung-' + a.stichprobe + '.json');
  fs.writeFileSync(p, JSON.stringify({ kennung: 'gdelt-abdeckung-2026-09-19/pruefung/v1', stand: new Date().toISOString(), tage: tage.length, je: je, regel: 'urteil richtig = der Organisationstext meint die Firma des Symbols (Produktnennungen wie Netflix-Serie zaehlen als Firma); falsch = anderer Name (Person, Ort, Wort, Zeitung, andere Firma, Visum); verdacht = Name stimmt, aber die Firma ist Medium/Handelsplatz/Plattform, nicht Gegenstand (Nasdaq-Listing/Index, zitierte New York Times, posted on Twitter) - aus dem Organisationstext nicht entscheidbar, nach Quelle und URL vermutet', eintraege: aus2 }, null, 1));
  process.stdout.write(p + ': ' + aus2.length + ' Eintraege in ' + Object.keys(gruppen).length + ' Gruppen\n');
}

/* ---------- Hauptauswertung ---------- */
function auswerten(a, aus, karte) {
  var tage = ladeTage(aus, a.von, a.bis, null);
  if (!tage.length) throw new Error('keine Tagesdateien unter ' + aus);
  var M = {};                                           // monat -> sym -> stufe -> [n, ts, tq, neg, uebersetzt]
  var gesamt = { tage: 0, dateien: 0, fehlend: 0, fehler: 0, zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, bytesZip: 0, bytesCsv: 0, dauerS: 0, treffer: { voll: 0, kurz: 0 } };
  var tageJeMonat = {}, luecken = {};                   // luecken[jahr] = { uhrzeit: {}, monat: {}, tageMitLuecke, fehlend, dateien, usZeit }
  tage.forEach(function (T) {
    var z = T.zaehler, m = T.tag.slice(0, 7), jahr = T.tag.slice(0, 4);
    tageJeMonat[m] = (tageJeMonat[m] || 0) + 1;
    gesamt.tage++; gesamt.dateien += z.gefunden; gesamt.fehlend += z.fehlend; gesamt.fehler += z.fehler.length; gesamt.zeilen += z.zeilen; gesamt.falscheFeldzahl += z.falscheFeldzahl;
    gesamt.mitOrganisation += z.mitOrganisation; gesamt.bytesZip += z.bytesZip; gesamt.bytesCsv += z.bytesCsv; gesamt.dauerS += T.dauerS; gesamt.treffer.voll += z.treffer.voll; gesamt.treffer.kurz += z.treffer.kurz;
    var L = luecken[jahr] || (luecken[jahr] = { uhrzeit: {}, monat: {}, wochentag: {}, tage: 0, tageMitLuecke: 0, dateienSoll: 0, fehlend: 0, usZeit: 0, maxJeTag: 0 });
    L.tage++; L.dateienSoll += z.dateien; L.fehlend += z.fehlend; if (z.fehlend) L.tageMitLuecke++; if (z.fehlend > L.maxJeTag) L.maxJeTag = z.fehlend;
    L.monat[m] = (L.monat[m] || 0) + z.fehlend;
    if (z.fehlend >= 24) (L.ausfalltage = L.ausfalltage || []).push(T.tag.slice(5) + ':' + z.fehlend);   // Tage mit >= 6 h Luecke (Block-Ausfall, keine Streuung)
    var wt = new Date(T.tag + 'T12:00:00Z').getUTCDay(); L.wochentag[wt] = (L.wochentag[wt] || 0) + z.fehlend;
    z.fehlendUhrzeiten.forEach(function (u) { L.uhrzeit[u] = (L.uhrzeit[u] || 0) + 1; if (istUsZeit(u)) L.usZeit++; });
    var mm = M[m] || (M[m] = {});
    Object.keys(T.symbole).forEach(function (s) {
      var q = mm[s] || (mm[s] = { voll: [0, 0, 0, 0, 0], kurz: [0, 0, 0, 0, 0] });
      STUFEN.forEach(function (st) { for (var i = 0; i < 5; i++) q[st][i] += T.symbole[s][st][i]; });
    });
  });
  var monate = Object.keys(M).sort();
  /* (0) Luecken: systematisch (feste Uhrzeiten) oder Streuung? Erwartung bei Streuung: je Rasterplatz fehlend/96, US-Anteil 26/96 */
  Object.keys(luecken).forEach(function (jahr) {
    var L = luecken[jahr], plaetze = Object.keys(L.uhrzeit).sort(function (x, y) { return L.uhrzeit[y] - L.uhrzeit[x]; });
    var werte = plaetze.map(function (u) { return L.uhrzeit[u]; }), mittel = L.fehlend / 96;
    var sq = 0; for (var h = 0; h < 96; h++) { var u = ('0' + Math.floor(h / 4)).slice(-2) + ('0' + (h % 4) * 15).slice(-2); var v = L.uhrzeit[u] || 0; sq += (v - mittel) * (v - mittel); }
    L.plaetzeMitLuecke = plaetze.length; L.top12 = plaetze.slice(0, 12).map(function (u) { return u + ':' + L.uhrzeit[u]; });
    L.maxJePlatz = werte.length ? werte[0] : 0; L.erwartungJePlatz = +mittel.toFixed(1);
    L.top12Anteil = L.fehlend ? +(werte.slice(0, 12).reduce(function (x, y) { return x + y; }, 0) / L.fehlend).toFixed(3) : null;   // Streuung: 12/96 = 0,125
    L.variationskoeffizient = mittel ? +(Math.sqrt(sq / 96) / mittel).toFixed(2) : null;                                                  // Poisson-Streuung: 1/sqrt(mittel)
    L.poissonVk = mittel ? +(1 / Math.sqrt(mittel)).toFixed(2) : null;
    L.usZeitAnteil = L.fehlend ? +(L.usZeit / L.fehlend).toFixed(3) : null;                                                                // Streuung: 26/96 = 0,271
    L.usZeitFehlendAnteil = +(L.usZeit / (L.tage * 26)).toFixed(4);                                                                         // Anteil der US-Handelszeit-Dateien, der fehlt
    L.fehlendAnteil = +(L.fehlend / L.dateienSoll).toFixed(4);
    delete L.uhrzeit;                                    // Rohzaehler je Platz bleiben in luecken.uhrzeitRoh
  });

  /* (a)+(b)+(d) je Monat, Klasse, Stufe, Variante (alle / ohneMedien) */
  var abdeckung = {}, verteilung = {}, ton = {}, VARIANTEN = ['alle', 'ohneMedien'];
  var medienImPanel = MEDIEN.filter(function (s) { return karte.karte[s]; });
  monate.forEach(function (m) {
    var jahr = m.slice(0, 4), feld = jahr < '2020' ? 'klasse2018' : 'klasse2025';
    KLASSEN.forEach(function (kl) {
      VARIANTEN.forEach(function (va) {
        var syms = Object.keys(karte.karte).filter(function (s) { return karte.karte[s][feld] === kl && (va === 'alle' || MEDIEN.indexOf(s) < 0); });
        STUFEN.forEach(function (st) {
          var key = m + '|' + kl + '|' + st + '|' + va, n = { symbole: syms.length, mitName: syms.filter(function (s) { return karte.karte[s].voll; }).length, mitKurz: syms.filter(function (s) { return karte.karte[s].kurz; }).length };
          var werte = syms.map(function (s) { return M[m][s] ? M[m][s][st][0] : 0; });
          SCHWELLEN.forEach(function (sw) { n['ab' + sw] = werte.filter(function (x) { return x >= sw; }).length; });
          abdeckung[key] = n;
          var sortiert = werte.slice().sort(function (x, y) { return x - y; }), positiv = sortiert.filter(function (x) { return x > 0; });
          verteilung[key] = { median: quantil(sortiert, 0.5), p10: quantil(sortiert, 0.1), p90: quantil(sortiert, 0.9), medianPositiv: quantil(positiv, 0.5), p10Positiv: quantil(positiv, 0.1), p90Positiv: quantil(positiv, 0.9), summe: werte.reduce(function (x, y) { return x + y; }, 0) };
          var tn = 0, ts = 0, tq = 0, neg = 0, ue = 0;
          syms.forEach(function (s) { var q = M[m][s] && M[m][s][st]; if (q) { tn += q[0]; ts += q[1]; tq += q[2]; neg += q[3]; ue += q[4]; } });
          var mittel = tn ? ts / tn : null;
          ton[key] = { n: tn, mittel: mittel === null ? null : +mittel.toFixed(3), sd: tn > 1 ? +Math.sqrt(Math.max(0, tq / tn - mittel * mittel)).toFixed(3) : null, anteilNegativ: tn ? +(neg / tn).toFixed(3) : null, anteilUebersetzt: tn ? +(ue / tn).toFixed(3) : null };
        });
      });
    });
  });
  /* Trefferanteil der Medienfirmen und Spitzenreiter je Jahr (Stufe voll) */
  var spitze = {};
  ['2025', '2018'].forEach(function (jahr) {
    var S = {}, ges = 0, med = 0;
    monate.filter(function (m) { return m.slice(0, 4) === jahr; }).forEach(function (m) { Object.keys(M[m]).forEach(function (s) { var n = M[m][s].voll[0]; S[s] = (S[s] || 0) + n; ges += n; if (MEDIEN.indexOf(s) >= 0) med += n; }); });
    if (!ges) return;
    spitze[jahr] = { trefferVoll: ges, medienTreffer: med, medienAnteil: +(med / ges).toFixed(3), top10: Object.keys(S).sort(function (x, y) { return S[y] - S[x]; }).slice(0, 10).map(function (s) { return s + ':' + S[s]; }) };
  });

  /* (c) Fehlerquote aus pruefung-*.json (Urteile von Hand); dazu je Symbol die Verdachtsquote (Grundlage der Medienliste) */
  var fehler = {};
  fs.readdirSync(HIER).filter(function (f) { return /^pruefung-.*\.json$/.test(f); }).sort().forEach(function (f) {
    var P = JSON.parse(fs.readFileSync(path.join(HIER, f), 'utf8')), name = f.replace(/^pruefung-|\.json$/g, '');
    var je = {}, jeSym = {};
    P.eintraege.forEach(function (e) {
      if (!e.urteil) return;
      var kk = karte.karte[e.sym] || {}, kl = (e.tag < '2020' ? kk.klasse2018 : kk.klasse2025) || 'ausserhalb';   // Klasse des Jahres; Symbole ohne Klasse im Jahr (TWTR, DISCA/DISCK 2025) zaehlen als "ausserhalb", nicht in eine Klasse
      var ys = jeSym[e.sym] || (jeSym[e.sym] = { n: 0, falsch: 0, verdacht: 0 }); ys.n++; if (e.urteil === 'falsch') ys.falsch++; if (e.urteil === 'verdacht') ys.verdacht++;
      [e.stufe + '|' + kl, e.stufe + '|alle'].forEach(function (k) {
        var q = je[k] || (je[k] = { n: 0, falsch: 0, verdacht: 0, beispiele: [], verdachtBeispiele: [], falschNamen: {}, verdachtNamen: {} });
        q.n++;
        if (e.urteil === 'falsch') { q.falsch++; q.falschNamen[e.sym] = (q.falschNamen[e.sym] || 0) + 1; if (q.beispiele.length < 6) q.beispiele.push(e.sym + ' <- "' + e.org.replace(/,\d+$/, '') + '"' + (e.grund ? ' (' + e.grund + ')' : '')); }
        if (e.urteil === 'verdacht') { q.verdacht++; q.verdachtNamen[e.sym] = (q.verdachtNamen[e.sym] || 0) + 1; if (q.verdachtBeispiele.length < 3) q.verdachtBeispiele.push(e.sym + ' <- "' + e.org.replace(/,\d+$/, '') + '"'); }
      });
    });
    var offen = P.eintraege.filter(function (e) { return !e.urteil; }).length;
    var verdaechtig = Object.keys(jeSym).filter(function (s) { return jeSym[s].n >= 5 && jeSym[s].verdacht >= jeSym[s].n / 2; }).map(function (s) { return s + ':' + jeSym[s].verdacht + '/' + jeSym[s].n; });
    fehler[name] = { eintraege: P.eintraege.length, offen: offen, je: je, jeSymbol: jeSym, ueberwiegendVerdacht: verdaechtig };
  });

  /* (f) Urteil je Klasse: Median ueber die Monate (Anteil >= 5 Artikel), getrennt 2025 / 2018 und alle / ohneMedien; Fehlerquote aus dem Vollauf-Pruefsatz */
  var urteil = {};
  ['2025', '2018'].forEach(function (jahr) {
    var ms = monate.filter(function (m) { return m.slice(0, 4) === jahr; }); if (!ms.length) return;
    KLASSEN.forEach(function (kl) {
      STUFEN.forEach(function (st) {
        VARIANTEN.forEach(function (va) {
          var anteile = ms.map(function (m) { var n = abdeckung[m + '|' + kl + '|' + st + '|' + va]; return n.symbole ? 100 * n.ab5 / n.symbole : 0; });
          var pr = fehler['vollauf-' + jahr] || fehler['vollauf-2025'] || fehler['vorlauf'];
          var fq = pr && pr.je[st + '|' + kl] ? pr.je[st + '|' + kl] : null;
          var fqP = fq && fq.n ? 100 * fq.falsch / fq.n : null, vdP = fq && fq.n ? 100 * fq.verdacht / fq.n : null;
          var med = median(anteile);
          urteil[jahr + '|' + kl + '|' + st + '|' + va] = { monate: ms.length, anteilAb5Median: med, anteilAb5Min: Math.min.apply(null, anteile).toFixed(1), fehlerquote: fqP === null ? null : +fqP.toFixed(1), verdachtquote: vdP === null ? null : +vdP.toFixed(1), fehlerN: fq ? fq.n : 0,
            traegt: med !== null && med >= 80 && fqP !== null && fqP <= 10, grund: med === null ? 'keine Daten' : (med < 80 ? 'Abdeckung ' + med + ' % < 80 %' : (fqP === null ? 'Fehlerquote nicht gemessen' : (fqP > 10 ? 'Fehlerquote ' + fqP.toFixed(1) + ' % > 10 %' : 'ok'))) };
        });
      });
    });
  });
  /* Was ein Tagesdesign mit der erreichten Abdeckung noch traegt: Symbole je Klasse (ohne Medien), die in >= 10 von 12 Monaten 2025
   * >= 5 Artikel haben; Auflösungsfaktor sqrt(N/n) gegen die volle Klasse (Querschnitt schrumpft), zusaetzlich zu MACHBARKEIT.md §7 (x2-4). */
  var teilmenge = {};
  ['2025', '2018'].forEach(function (jahr) {
    var ms = monate.filter(function (m) { return m.slice(0, 4) === jahr; }); if (!ms.length) return;
    var feld = jahr < '2020' ? 'klasse2018' : 'klasse2025', noetig = Math.ceil(ms.length * 10 / 12);
    KLASSEN.forEach(function (kl) {
      var syms = Object.keys(karte.karte).filter(function (s) { return karte.karte[s][feld] === kl && MEDIEN.indexOf(s) < 0; });
      STUFEN.forEach(function (st) {
        var stabil = syms.filter(function (s) { return ms.filter(function (m) { return M[m][s] && M[m][s][st][0] >= 5; }).length >= noetig; });
        teilmenge[jahr + '|' + kl + '|' + st] = { symbole: syms.length, stabilAb5: stabil.length, anteil: syms.length ? +(100 * stabil.length / syms.length).toFixed(1) : null, monateNoetig: noetig, faktorMde: stabil.length ? +Math.sqrt(syms.length / stabil.length).toFixed(2) : null, beispiele: stabil.slice(0, 12) };
      });
    });
  });

  var J = { kennung: 'gdelt-abdeckung-2026-09-19/auswertung/v2', stand: new Date().toISOString(), karte: karte.kennung, zaehlKennung: tage[0].kennung, medien: { regel: 'Handliste: Nachrichtenmedium (Quelle/Zitat), Plattform (Veroeffentlichungsort) oder Boerse/Index/Rating (Handelsplatz); Kern = Symbole mit ueberwiegend Verdacht in der Handpruefung, Rest Analogie', liste: MEDIEN, imPanel: medienImPanel }, gesamt: gesamt, monate: monate, tageJeMonat: tageJeMonat, luecken: luecken, spitze: spitze, abdeckung: abdeckung, verteilung: verteilung, ton: ton, fehler: fehler, urteil: urteil, teilmenge: teilmenge };
  fs.writeFileSync(path.join(HIER, 'auswertung.json'), JSON.stringify(J, null, 1));

  /* ---------- ABDECKUNG.md ---------- */
  var L = [];
  L.push('# GDELT-Abdeckungsprobe — Ergebnis (Auftrag Nr. 44 / 44b)', '', 'Stand ' + J.stand.slice(0, 16).replace('T', ' ') + ' UTC · Karte `' + karte.kennung + '` (' + Object.keys(karte.karte).length + ' Symbole, ' + karte.zaehler.ohneNamen + ' ohne Namen) · Zaehler `' + J.zaehlKennung + '` · Auswertung `' + J.kennung + '`', '',
    '**Datenmenge:** ' + gesamt.tage + ' Tage, ' + gesamt.dateien + ' Dateien gefunden, ' + gesamt.fehlend + ' fehlend (404), ' + gesamt.fehler + ' Fehler; ' + (gesamt.bytesZip / 1073741824).toFixed(1) + ' GB gezippt / ' + (gesamt.bytesCsv / 1073741824).toFixed(1) + ' GB entpackt im Fluss; ' + gesamt.zeilen.toLocaleString('de-DE') + ' Artikelzeilen (' + gesamt.falscheFeldzahl + ' mit falscher Feldzahl, ' + pz(gesamt.mitOrganisation, gesamt.zeilen) + ' mit Organisation); Treffer voll ' + gesamt.treffer.voll.toLocaleString('de-DE') + ', kurz ' + gesamt.treffer.kurz.toLocaleString('de-DE') + '; Rechenzeit ' + (gesamt.dauerS / 3600).toFixed(1) + ' Prozess-Stunden.', '');
  L.push('## (0) Luecken der Quelle — fehlende 15-min-Dateien (HTTP 404) nach Uhrzeit UTC und Monat', '');
  L.push('| Jahr | Tage | fehlend / Soll | Tage mit Luecke | max je Tag | Rasterplaetze mit Luecke (von 96) | max je Platz (Erwartung bei Streuung) | Anteil der 12 haeufigsten Plaetze (Streuung 12,5 %) | VK ueber 96 Plaetze (Poisson) | Anteil in US-Handelszeit 13:30–20:00 (Streuung 27,1 %) | fehlende US-Handelszeit-Dateien |', '|---|---|---|---|---|---|---|---|---|---|---|');
  Object.keys(luecken).sort().reverse().forEach(function (jahr) { var l = luecken[jahr]; L.push('| ' + jahr + ' | ' + l.tage + ' | ' + l.fehlend + ' / ' + l.dateienSoll + ' (' + pz(l.fehlend, l.dateienSoll) + ') | ' + l.tageMitLuecke + ' (' + pz(l.tageMitLuecke, l.tage) + ') | ' + l.maxJeTag + ' | ' + l.plaetzeMitLuecke + ' | ' + l.maxJePlatz + ' (' + l.erwartungJePlatz + ') | ' + (l.top12Anteil === null ? '-' : (100 * l.top12Anteil).toFixed(1) + ' %') + ' | ' + l.variationskoeffizient + ' (' + l.poissonVk + ') | ' + (l.usZeitAnteil === null ? '-' : (100 * l.usZeitAnteil).toFixed(1) + ' %') + ' | ' + (100 * l.usZeitFehlendAnteil).toFixed(2) + ' % |'); });
  L.push('');
  Object.keys(luecken).sort().reverse().forEach(function (jahr) { var l = luecken[jahr]; L.push('- **' + jahr + '** haeufigste Plaetze: ' + l.top12.join(', ') + '. Je Monat: ' + Object.keys(l.monat).sort().map(function (m) { return m.slice(5) + ':' + l.monat[m]; }).join(', ') + '. Je Wochentag (0 = So): ' + [0, 1, 2, 3, 4, 5, 6].map(function (w) { return w + ':' + (l.wochentag[w] || 0); }).join(', ') + '. **Ausfalltage (>= 24 Dateien = >= 6 h fehlen):** ' + ((l.ausfalltage || []).join(', ') || 'keine') + '.'); });
  L.push('', '_Lesart: liegt der Anteil der 12 haeufigsten Plaetze nahe 12,5 % und der VK nahe dem Poisson-Wert, sind die Luecken Streuung, keine festen Uhrzeiten._', '');
  L.push('## (a) Abdeckung je Klasse und Monat — Anteil der Symbole mit >= 1 / >= 5 / >= 20 Artikeln', '', 'Medienfirmen (' + medienImPanel.length + ' im Panel: ' + medienImPanel.join(', ') + '): ' + Object.keys(spitze).map(function (j) { return j + ' ' + (100 * spitze[j].medienAnteil).toFixed(1) + ' % der voll-Treffer (Spitze ' + spitze[j].top10.slice(0, 6).join(', ') + ')'; }).join('; ') + '.', '');
  VARIANTEN.forEach(function (va) {
    STUFEN.forEach(function (st) {
      L.push('### Stufe „' + st + '" — ' + (va === 'alle' ? 'alle Symbole' : 'OHNE Medien-/Plattform-/Boersenfirmen'), '', '| Monat | Tage | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl + ' (n) | >=1 | >=5 | >=20'; }).join(' | ') + ' |', '|---|---|' + KLASSEN.map(function () { return '---|---|---|---'; }).join('|') + '|');
      monate.forEach(function (m) {
        L.push('| ' + m + ' | ' + tageJeMonat[m] + ' | ' + KLASSEN.map(function (kl) { var n = abdeckung[m + '|' + kl + '|' + st + '|' + va]; return n.symbole + ' | ' + pz(n.ab1, n.symbole) + ' | ' + pz(n.ab5, n.symbole) + ' | ' + pz(n.ab20, n.symbole); }).join(' | ') + ' |');
      });
      L.push('');
    });
  });
  L.push('## (b) Artikel je Symbol-Monat — Median / P10 / P90 (alle Symbol-Monate; in Klammern nur Monate mit >= 1 Artikel), ohne Medienfirmen', '');
  STUFEN.forEach(function (st) {
    L.push('### Stufe „' + st + '"', '', '| Monat | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
    monate.forEach(function (m) {
      L.push('| ' + m + ' | ' + KLASSEN.map(function (kl) { var v = verteilung[m + '|' + kl + '|' + st + '|ohneMedien']; return v.median + ' / ' + v.p10 + ' / ' + v.p90 + ' (' + v.medianPositiv + ' / ' + v.p10Positiv + ' / ' + v.p90Positiv + ')'; }).join(' | ') + ' |');
    });
    L.push('');
  });
  L.push('## (c) Fehlerquote der Zuordnung — von Hand geprueft (Organisationstext, Quelle, URL gegen Firma), kein Modell', '', '_Die Stichprobe zieht je Monat und Stufe die Treffer mit kleinstem Zufallswert, also **artikelgewichtet**: Symbole mit vielen Treffern (NDAQ, TWTR, NFLX, NYT) stehen entsprechend oft darin._', '');
  Object.keys(fehler).forEach(function (name) {
    var F = fehler[name];
    L.push('### Pruefsatz `pruefung-' + name + '.json` — ' + F.eintraege + ' Eintraege, ' + F.offen + ' ungeprueft; ueberwiegend Verdacht (>= 5 Eintraege): ' + (F.ueberwiegendVerdacht.join(', ') || 'keins'), '', '| Stufe | Klasse | n | falsch (Name) | Quote | Namen der Fehler | Beispiele | Verdacht Medium/Handelsplatz/Plattform | Namen des Verdachts |', '|---|---|---|---|---|---|---|---|---|');
    Object.keys(F.je).sort().forEach(function (k) { var q = F.je[k], t = k.split('|'); function nm(o) { return Object.keys(o).sort(function (x, y) { return o[y] - o[x]; }).map(function (s) { return s + ' ' + o[s]; }).join(', '); } L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + q.n + ' | ' + q.falsch + ' | ' + pz(q.falsch, q.n) + ' | ' + nm(q.falschNamen) + ' | ' + q.beispiele.join('; ') + ' | ' + q.verdacht + ' (' + pz(q.verdacht, q.n) + ') | ' + nm(q.verdachtNamen) + ' |'); });
    L.push('');
  });
  L.push('## (d) Ton je Klasse (Mittel / sd / Anteil negativ / Anteil uebersetzt), ueber alle Monate — alle Symbole und ohne Medienfirmen', '');
  L.push('| Jahr | Stufe | Variante | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|---|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
  ['2025', '2018'].forEach(function (jahr) {
    STUFEN.forEach(function (st) {
      VARIANTEN.forEach(function (va) {
        var zeile = KLASSEN.map(function (kl) {
          var n = 0, s = 0, q = 0, neg = 0, ue = 0;
          monate.filter(function (m) { return m.slice(0, 4) === jahr; }).forEach(function (m) { var t = ton[m + '|' + kl + '|' + st + '|' + va]; if (t.n) { n += t.n; s += t.mittel * t.n; q += (t.sd * t.sd + t.mittel * t.mittel) * t.n; neg += t.anteilNegativ * t.n; ue += t.anteilUebersetzt * t.n; } });
          if (!n) return '-';
          var mi = s / n; return mi.toFixed(2) + ' / ' + Math.sqrt(Math.max(0, q / n - mi * mi)).toFixed(2) + ' / ' + pz(neg, n) + ' / ' + pz(ue, n) + ' (n ' + n.toLocaleString('de-DE') + ')';
        });
        if (zeile.some(function (x) { return x !== '-'; })) L.push('| ' + jahr + ' | ' + st + ' | ' + va + ' | ' + zeile.join(' | ') + ' |');
      });
    });
  });
  L.push('', '## (e) 2018 gegen 2025 — Median ueber die Monate: Anteil Symbole mit >= 5 Artikeln (ohne Medienfirmen; in Klammern alle)', '');
  L.push('| Jahr | Stufe | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
  ['2025', '2018'].forEach(function (jahr) { STUFEN.forEach(function (st) { var z = KLASSEN.map(function (kl) { var u = urteil[jahr + '|' + kl + '|' + st + '|ohneMedien'], ua = urteil[jahr + '|' + kl + '|' + st + '|alle']; return u ? u.anteilAb5Median + ' % (alle ' + ua.anteilAb5Median + ' %; min ' + u.anteilAb5Min + ' %, ' + u.monate + ' Mon.)' : '-'; }); if (z.some(function (x) { return x !== '-'; })) L.push('| ' + jahr + ' | ' + st + ' | ' + z.join(' | ') + ' |'); }); });
  L.push('', '## (f) Urteil je Klasse — traegt GDELT ein Tagesdesign? (>= 80 % der Symbole mit >= 5 Artikeln je Monat UND Namensfehler <= 10 %)', '');
  L.push('| Jahr | Klasse | Stufe | Variante | Abdeckung >=5 (Median) | Namensfehler (n) | Verdacht | Urteil | Grund |', '|---|---|---|---|---|---|---|---|---|');
  Object.keys(urteil).forEach(function (k) { var u = urteil[k], t = k.split('|'); L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + t[2] + ' | ' + t[3] + ' | ' + u.anteilAb5Median + ' % | ' + (u.fehlerquote === null ? '-' : u.fehlerquote + ' % (' + u.fehlerN + ')') + ' | ' + (u.verdachtquote === null ? '-' : u.verdachtquote + ' %') + ' | ' + (u.traegt ? '**JA**' : 'NEIN') + ' | ' + u.grund + ' |'); });
  L.push('', '### Was ein Tagesdesign mit der erreichten Abdeckung noch traegt — Symbole ohne Medienfirmen mit >= 5 Artikeln in >= 10 von 12 Monaten (2018: 3 von 3)', '');
  L.push('| Jahr | Klasse | Stufe | Symbole | davon stabil >= 5 | Anteil | Faktor auf die MDE (sqrt N/n, zusaetzlich zu MACHBARKEIT.md §7 x2–4) | Beispiele |', '|---|---|---|---|---|---|---|---|');
  Object.keys(teilmenge).forEach(function (k) { var u = teilmenge[k], t = k.split('|'); L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + t[2] + ' | ' + u.symbole + ' | ' + u.stabilAb5 + ' | ' + u.anteil + ' % | ' + u.faktorMde + ' | ' + u.beispiele.join(' ') + ' |'); });
  L.push('', '_Zaehlung: `gkg-zaehlen.js` (Spalte 15 V2EnhancedOrganizations, Spalte 16 V1.5Tone; ein Artikel je Symbol und Stufe einmal). Klassen: 1 = 50–250, 2 = 250–1.000, 3 = ab 1.000 Mio $ Tagesumsatz (Panel v2.1, Stichtag 2025-01-02 bzw. 2018-01-02). Medienliste: `MEDIEN` in `auswerten.js` (Regel im Kommentar). Quelle: GDELT Project, https://www.gdeltproject.org/ — Simulation, keine Anlageberatung._', '');
  fs.writeFileSync(path.join(HIER, 'ABDECKUNG.md'), L.join('\n'));
  process.stdout.write('ABDECKUNG.md: ' + monate.length + ' Monate, ' + gesamt.tage + ' Tage, Urteile: ' + Object.keys(urteil).filter(function (k) { return /ohneMedien$/.test(k); }).map(function (k) { return k.replace('|ohneMedien', '') + '=' + (urteil[k].traegt ? 'JA' : 'nein'); }).join(' ') + '\n');
}

if (require.main === module) {
  var a = argumente(process.argv.slice(2)), aus = path.resolve(HIER, a.aus || 'voll');
  var karte = JSON.parse(fs.readFileSync(path.join(HIER, 'namenskarte.json'), 'utf8'));
  if (a.stichprobe) stichprobeAnlegen(a, aus, karte); else auswerten(a, aus, karte);
}
module.exports = { quantil: quantil, ladeTage: ladeTage, MEDIEN: MEDIEN, istUsZeit: istUsZeit };
