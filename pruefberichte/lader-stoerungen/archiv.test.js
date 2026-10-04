'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026), Lader archiv.js (Stand 61dca2c).
 *
 * archiv.js ist das Renderer-Kursarchiv: fuege() mischt jeden Abruf (Intraday-Scan, Messlauf,
 * Capital-Rueckfall, Krypto-Sammler, 1m-Nachtsammlung) nach Zeitstempel in EINE Serie je
 * Intervall/Symbol, raeumt mit ohneStempel() Quote-Stempel ab, kappt nach TAGE_MAX relativ zu
 * Date.now() und schreibt gedrosselt ueber window.api.storeSet in den Electron-Store. Gelesen wird
 * die Serie u. a. vom Intraday-Scanner (depot.js rechnet Signale auf archS.slice(-800)).
 *
 * Geprueft (Katalog-Nummern): S1 leere Antwort; S2 Quote-Stempel/laufende Kerze (Normalfall, Morgen,
 * 1m, Schlussstempel); S4 Kuerzel-Neuvergabe; S6 Quellenmischung (cap-Bereich, CFD-Rueckfall 60m,
 * Split); S7 abgemeldete Reihe; S8 Zeitumstellung; S9-S11 Feiertag/Halbtag/Aussetzung; dazu
 * Kurs 0/NaN/negativ, TAGE_MAX bei falscher Uhr, Speicher-Drossel, Flush-Wettlauf.
 * S3 (Tagesbalken) und S5 (Zwilling) treffen nicht zu - Begruendung im Bericht archiv.md.
 *
 * Der Store-Teil laeuft als Fenster-Modul in H.sandbox: window.api ist eine Attrappe im Speicher,
 * die Lese- und Schreibvorgaenge ZAEHLT; Date ist je Test eine feste Uhr (nie die echte - archiv.js
 * kappt nach TAGE_MAX relativ zu Date.now()). Kein Netz, keine Platte.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/lader-stoerungen/archiv.test.js          alle AR-Tests
 *   node pruefberichte/lader-stoerungen/archiv.test.js AR-3     nur AR-3
 * Alles Simulation, keine Anlageberatung.
 */
var H = require('./hilfen.js');   /* zuerst: Netz-, Schreibsperre, Datenordner */
var Ar = H.lade('archiv.js');

var MIN = 60000, TAG = 86400000;

/* ---------------- Hilfen (lokal; siehe "Wuensche an hilfen.js" im Bericht) ---------------- */

function utc(j, m, t, h, mi, s) { return Date.UTC(j, m - 1, t, h || 0, mi || 0, s || 0); }
function kurz(ms) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
function Z(datei, anker) { return datei + ':' + H.zeileVon(datei, anker); }
function r2(x) { return Math.round(x * 100) / 100; }

/** Kerzen [t, schluss, umsatz, hoch, tief] eines US-Handelstags in UTC (Yahoo-Raster: 60m auf :30).
 *  o: winter (Oeffnung 14:30 statt 13:30 UTC), halbtag (210 statt 390 Min), preis, vol,
 *     luecke [vonMs, bisMs) (Kursaussetzung: keine Kerzen). */
function sitzung(j, m, t, iv, o) {
  o = o || {};
  var step = parseInt(iv, 10) * MIN, auf = utc(j, m, t, o.winter ? 14 : 13, 30);
  var ende = auf + (o.halbtag ? 210 : 390) * MIN, out = [], i = 0;
  for (var x = auf; x < ende; x += step, i++) {
    if (o.luecke && x >= o.luecke[0] && x < o.luecke[1]) continue;
    var c = r2((o.preis || 100) + (i % 7) * 0.1);
    out.push([x, c, o.vol != null ? o.vol : 1000, r2(c + 0.05), r2(c - 0.05)]);
  }
  return out;
}
/** Yahoo-Quote-Stempel: aktueller Kurs, Umsatz 0, Hoch = Tief = Schluss. */
function stempel(t, preis) { return [t, preis, 0, preis, preis]; }
function stempelForm(b) { return b.length >= 5 && b[2] === 0 && b[3] === b[4] && b[4] === b[1]; }
function letzte(bars) { return bars[bars.length - 1]; }
/** Werktage Mo-Fr zwischen zwei UTC-Mitternachten (einschliesslich), als [j, m, t]. */
function werktage(von, bis) {
  var aus = [];
  for (var x = von; x <= bis; x += TAG) {
    var d = new Date(x), w = d.getUTCDay();
    if (w > 0 && w < 6) aus.push([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]);
  }
  return aus;
}
/** US-Winterzeit 2026: bis 08.03. und ab 01.11. (erster Sonntag im November). */
function winter2026(j, m, t) { var x = utc(j, m, t); return x < utc(2026, 3, 8) || x >= utc(2026, 11, 1); }
function sitzungen(von, bis, iv, o) {
  var out = [];
  werktage(von, bis).forEach(function (d) {
    out = out.concat(sitzung(d[0], d[1], d[2], iv, Object.assign({ winter: winter2026(d[0], d[1], d[2]) }, o || {})));
  });
  return out;
}

/** archiv.js als Fenster-Modul in der Sandbox; window.api = zaehlende Store-Attrappe (wie speicher()
 *  im Stilvorbild). store wird geteilt - ein zweites neuesArchiv auf demselben store ist ein Neustart. */
function neuesArchiv(jetzt, store) {
  store = store || {};
  var st = { get: 0, schreib: 0, schluessel: [], beimSchreiben: null };
  function kopie(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  var win = {
    api: {
      storeGet: function (k) { st.get++; return Promise.resolve(kopie(store[k])); },
      storeSet: async function (k, v) {
        st.schreib++; st.schluessel.push(k);
        var abzug = kopie(v);                       /* IPC: der Datensatz ist beim Aufruf festgelegt */
        if (st.beimSchreiben) { var f = st.beimSchreiben; st.beimSchreiben = null; await f(k); }
        store[k] = abzug;
        return { ok: true };
      }
    }
  };
  H.sandbox(['archiv.js'], win, jetzt);
  if (!win.Archiv || typeof win.Archiv.fuege !== 'function') throw new Error('archiv.js: window.Archiv fehlt in der Sandbox');
  return { A: win.Archiv, K: win.ArchivKern, st: st, store: store, uhr: win.__uhr };
}

/* Fundstellen im App-Code (Anker gegen Inhalt; wirft, wenn der Anker fehlt oder mehrdeutig ist). */
function Zeilen() {
  return {
    fuegeLeer: Z('archiv.js', 'if (!bars || bars.length < 2) return;'),
    mische: Z('archiv.js', "(neu || []).forEach(function (b) { if (b && b.length >= 2) byT[b[0]] = b; });"),
    regel1: Z('archiv.js', 'if (b[0] % 60000 !== 0) continue;'),
    regel1b: Z('archiv.js', 'if (!aufRaster(b) && quoteStempel(b)) continue;'),
    weit: Z('archiv.js', 'if (b[0] - letzt[0] >= min) { out.push(b); continue; }'),
    regel2: Z('archiv.js', 'if (bR) out[out.length - 1] = b;'),
    phase: Z('archiv.js', 'var phase = rasterPhase(bars, step);'),
    kappe: Z('archiv.js', 'var cut = (nowMs || Date.now()) - (maxTage || MAX_TAGE) * 86400000;'),
    fuegeKern: Z('archiv.js', 'e.series = kappeTage(ohneStempel(mischeBars(e.series, bars), barMin), fensterFuer(iv));'),
    cap: Z('archiv.js', "if (quelle === 'cap') {"),
    dvt: Z('archiv.js', 'if (b[2] && !ausCfd(b[0], bereiche))'),
    drossel: Z('archiv.js', 'if (!force && now - e.letzterFlush < FLUSH_MIN * 60000) continue;'),
    dirtyAus: Z('archiv.js', 'e.dirty = false; e.letzterFlush = now;'),
    schluessel: Z('archiv.js', 'function key(iv, sym)'),
    scanArchiv: Z('depot.js', "if (archS && archS.length > bars.length) bars = archS.slice(-800);"),
    scanTor: Z('depot.js', "if ((cfg.mode === 'rsi2seit' || cfg.mode === 'kapitulation' || cfg.kapiZusatz) && sigBars.length < 261) {"),
    scanCap: Z('depot.js', "f.source === 'capital' ? 'cap' : null);"),
    capSitzung: Z('depot.js', 'var sess = bars.filter(function (b) { return window.Backfill.istSitzung(b[0]); });'),
    unplausibel: Z('depot.js', 'if (r > 4 || r < -0.8) return true;'),
    labDv: Z('depot.js', 'dv = (fdL && fdL.dollarVolDay != null) ? fdL.dollarVolDay : window.Archiv.dollarVolTag(serie, berL);'),
    labFilter: Z('depot.js', 'if (!cfg.minDollarVol || dv == null || dv >= cfg.minDollarVol * 1e6) mapL[sy] = serie;'),
    abdeckung: Z('depot.js', "var d1 = await window.Archiv.abdeckung('1m', syms);"),
    capPreis: Z('capital.js', 'var mid = c.ask != null ? (c.bid + c.ask) / 2 : c.bid;')
  };
}

/* ---------------- Die Tests ---------------- */

var tests = [

  /* AR-1 - S1: HTTP 200 mit leerem Inhalt. Soll (aus der Stoerung): eine leere oder fast leere Antwort
   * aendert den Bestand nicht, loest keinen Schreibvorgang aus und wird nicht als Daten verbucht. */
  { id: 'AR-1', stoerung: 'S1 leere Antwort (0 Kerzen, null, nur der Quote-Stempel) an fuege()', bewertung: '-',
    lauf: async function (H) {
      var L = Zeilen();
      var bestand = sitzung(2026, 10, 2, '5m');
      var a = neuesArchiv(utc(2026, 10, 5, 13, 47, 13), { bars_5m_AAA: { series: bestand, updatedAt: 1 } });
      await a.A.fuege('5m', 'AAA', []);
      await a.A.fuege('5m', 'AAA', null);
      await a.A.fuege('5m', 'AAA', [stempel(utc(2026, 10, 5, 13, 47, 13), 101.5)]);
      await a.A.speichere(true);
      var schreibLeer = a.st.schreib;
      var nLeer = (await a.A.serie('5m', 'AAA')).length;
      /* Positivkontrolle: dieselbe Strecke mit einer echten Antwort schreibt - die Attrappe zaehlt. */
      var heute = sitzung(2026, 10, 5, '5m').slice(0, 3);
      await a.A.fuege('5m', 'AAA', heute.concat([stempel(utc(2026, 10, 5, 13, 47, 13), 101.5)]));
      await a.A.speichere(true);
      H.betreten(a.st.get >= 1 && a.st.schreib === schreibLeer + 1, 'Store-Attrappe gelesen und nach echter Antwort beschrieben');
      var gespeichert = a.store.bars_5m_AAA.series;
      var stempelImStore = gespeichert.filter(function (b) { return b[0] % MIN !== 0; }).length;
      var abw = schreibLeer !== 0 || nLeer !== bestand.length || gespeichert.length !== bestand.length + 3 || stempelImStore !== 0;
      return { abweichung: abw, text: 'leer/null/nur Stempel: fuege kehrt vor dem Laden zurueck (' + L.fuegeLeer + '), ' +
        schreibLeer + ' Schreibvorgaenge (Soll 0), Bestand ' + nLeer + '/' + bestand.length + ' behalten; echte Antwort danach +' +
        (gespeichert.length - bestand.length) + ' Kerzen, Stempel ' + stempelImStore + '. Nebenbefund C: fuege gibt keine Zahl neuer Kerzen zurueck' };
    } },

  /* AR-2 - S2 Normalfall: laufende Kerze + krummer Quote-Stempel; der naechste Abruf bringt die fertige
   * Kerze. Dazu der Morgen (erster Abruf nach der Nachtluecke) und 1m (Stempel 30 s nach der letzten
   * Minute; Stempel genau auf der vollen Minute, den erst die echte Kerze ersetzt).
   * Soll: kein Stempel bleibt, die fertige Fassung gewinnt gegen die laufende (neu vor alt). */
  { id: 'AR-2', stoerung: 'S2 Quote-Stempel + laufende Kerze im Handel (5m, 1m, Morgen nach Nachtluecke)', bewertung: '-',
    lauf: async function (H) {
      var L = Zeilen();
      /* 5m: Bestand Freitag 02.10., Montag 05.10. zwei Abrufe. */
      var a = neuesArchiv(utc(2026, 10, 5, 13, 47, 27), { bars_5m_AAA: { series: sitzung(2026, 10, 2, '5m') } });
      var heute = sitzung(2026, 10, 5, '5m');
      var lauf40 = [heute[2][0], 100.55, 300, 100.6, 100.5];                       /* 13:40 halb fertig */
      await a.A.fuege('5m', 'AAA', heute.slice(0, 2).concat([lauf40, stempel(utc(2026, 10, 5, 13, 47, 27), 100.58)]));
      a.uhr.jetzt = utc(2026, 10, 5, 13, 52, 5);
      var lauf45 = [heute[3][0], 100.7, 200, 100.8, 100.6];
      await a.A.fuege('5m', 'AAA', heute.slice(0, 3).concat([lauf45, stempel(utc(2026, 10, 5, 13, 52, 5), 100.72)]));
      var s5 = await a.A.serie('5m', 'AAA');
      var k40 = s5.filter(function (b) { return b[0] === heute[2][0]; })[0];
      var ok5 = s5.length === 78 + 4 && s5.every(function (b) { return b[0] % MIN === 0; }) &&
        k40 && k40[1] === heute[2][1] && k40[2] === heute[2][2];
      /* 1m: Freitag 19:59:30 (Stempel 30 s nach der letzten Minute), Montag 13:30:40 (Morgen),
       * 13:32:00 (Stempel AUF der vollen Minute), 13:33:10 (echte 13:32-Kerze kommt). */
      var b1 = neuesArchiv(utc(2026, 10, 2, 19, 59, 30), {});
      var fr = [[utc(2026, 10, 2, 19, 57), 100, 900, 100.1, 99.9], [utc(2026, 10, 2, 19, 58), 100.1, 800, 100.2, 100],
        [utc(2026, 10, 2, 19, 59), 100.2, 400, 100.25, 100.1]];
      await b1.A.fuege('1m', 'BBB', fr.concat([stempel(utc(2026, 10, 2, 19, 59, 30), 100.22)]));
      b1.uhr.jetzt = utc(2026, 10, 5, 13, 30, 40);
      await b1.A.fuege('1m', 'BBB', fr.concat([[utc(2026, 10, 5, 13, 30), 101, 5000, 101.2, 100.9], stempel(utc(2026, 10, 5, 13, 30, 40), 101.05)]));
      b1.uhr.jetzt = utc(2026, 10, 5, 13, 32, 0);
      var m30 = [utc(2026, 10, 5, 13, 30), 101.1, 9000, 101.3, 100.9], m31lauf = [utc(2026, 10, 5, 13, 31), 101.2, 100, 101.25, 101.15];
      await b1.A.fuege('1m', 'BBB', fr.concat([m30, m31lauf, stempel(utc(2026, 10, 5, 13, 32, 0), 101.22)]));
      var zwischen = (await b1.A.serie('1m', 'BBB')).filter(function (b) { return b[0] === utc(2026, 10, 5, 13, 32) && stempelForm(b); }).length;
      b1.uhr.jetzt = utc(2026, 10, 5, 13, 33, 10);
      var m31 = [utc(2026, 10, 5, 13, 31), 101.3, 700, 101.4, 101.1], m32 = [utc(2026, 10, 5, 13, 32), 101.35, 500, 101.4, 101.3];
      await b1.A.fuege('1m', 'BBB', fr.concat([m30, m31, m32, stempel(utc(2026, 10, 5, 13, 33, 10), 101.36)]));
      await b1.A.speichere(true); await a.A.speichere(true);
      var s1 = b1.store.bars_1m_BBB.series;
      /* Positivkontrolle: der Stempel auf der vollen Minute war zwischenzeitlich drin (Ersetzungsweg betreten),
       * und beide Attrappen wurden beschrieben. */
      H.betreten(zwischen === 1 && b1.st.schreib > 0 && a.st.schreib > 0, 'Stempel auf voller Minute erst behalten, dann ersetzt; Store beschrieben');
      var k32 = s1.filter(function (b) { return b[0] === m32[0]; })[0];
      var ok1 = s1.length === 6 && !s1.some(stempelForm) && s1.every(function (b) { return b[0] % MIN === 0; }) &&
        k32 && k32[2] === 500 && s1.filter(function (b) { return b[0] === m31[0]; })[0][2] === 700;
      return { abweichung: !(ok5 && ok1), text: '5m: Stempel 13:47:27/13:52:05 verworfen (Regel 1, ' + L.regel1 + '), laufende 13:40 durch die fertige ersetzt (neu gewinnt, ' +
        L.mische + '), ' + s5.length + ' Kerzen (Soll 82); 1m: Stempel 19:59:30 und Morgen-Stempel 13:30:40 verworfen, Stempel 13:32:00 auf dem Raster ' +
        'blieb bis zur echten 13:32-Kerze und wurde von ihr ersetzt; ' + s1.length + ' Kerzen (Soll 6), Stempelform im Store ' + s1.filter(stempelForm).length };
    } },

  /* AR-3 - S2 Rand "Stempel nach der Schlusskerze": Nach Handelsschluss haengt Yahoo den Quote-Stempel
   * mit der Schlusszeit an (Umsatz 0, H=T=S) - 20:00:00 UTC im Sommer, 21:00:00 im Winter, 18:00:00 am
   * Halbtag. Soll: nicht uebernehmen (wiki/archiv-zusammenfuehrung.md Abschnitt 6 Grundregel: "Quote-Kerzen nach
   * Sitzungsschluss (Kalender, nicht 20:00) werden nicht uebernommen"; Befund R3: Store 65/79/53/0). */
  { id: 'AR-3', stoerung: 'S2 Quote-Stempel genau zur Schlusszeit (Sommer 20:00, Winter 21:00, Halbtag 18:00 UTC)', bewertung: 'B',
    lauf: async function (H) {
      var L = Zeilen();
      var faelle = [
        { tag: [2026, 10, 2], o: {}, schluss: utc(2026, 10, 2, 20) },
        { tag: [2026, 11, 2], o: { winter: true }, schluss: utc(2026, 11, 2, 21) },
        { tag: [2026, 11, 27], o: { winter: true, halbtag: true }, schluss: utc(2026, 11, 27, 18) }
      ];
      var a = neuesArchiv(utc(2026, 12, 1, 12), {});
      var ivs = ['1m', '5m', '15m', '60m'], behalten = {};
      for (var i = 0; i < ivs.length; i++) {
        for (var f = 0; f < faelle.length; f++) {
          var F = faelle[f];
          var bars = sitzung(F.tag[0], F.tag[1], F.tag[2], ivs[i], F.o);
          await a.A.fuege(ivs[i], 'CCC', bars.concat([stempel(F.schluss, letzte(bars)[1])]));
        }
      }
      await a.A.speichere(true);
      ivs.forEach(function (iv) {
        var s = a.store['bars_' + iv + '_CCC'].series;
        behalten[iv] = s.filter(function (b) { return faelle.some(function (F) { return F.schluss === b[0]; }) && stempelForm(b); }).length;
      });
      /* Positivkontrolle: auf 60m greift Regel 1b (neben dem Raster :30) - der Weg ist derselbe, nur das Raster
       * entscheidet; und der Store wurde fuer alle vier Intervalle beschrieben. */
      H.betreten(behalten['60m'] === 0 && a.st.schreib === 4, '60m-Schlussstempel verworfen, vier Reihen geschrieben');
      var falsch = behalten['1m'] + behalten['5m'] + behalten['15m'];
      return { abweichung: falsch > 0, text: 'Schlussstempel dauerhaft im Store: 1m ' + behalten['1m'] + '/3, 5m ' + behalten['5m'] + '/3, 15m ' +
        behalten['15m'] + '/3, 60m ' + behalten['60m'] + '/3 (Soll ueberall 0). Regel 1b verwirft nur NEBEN dem Raster (' + L.regel1b +
        '); auf 1m/5m/15m liegt die Schlusszeit AUF dem Raster und gilt als eigene Kerze (' + L.weit + '); kein spaeterer Abruf ersetzt sie' };
    } },

  /* AR-4 - S4 Kuerzel-Neuvergabe: dasselbe Kuerzel traegt nach einer Pause eine andere Firma.
   * Soll: die neue Reihe wird nicht stumm an die alte gehaengt (Bruchmarke, Schnitt oder Trennung). */
  { id: 'AR-4', stoerung: 'S4 Kuerzel-Neuvergabe: neue Firma unter altem Kuerzel (60m)', bewertung: 'A',
    lauf: async function (H) {
      var L = Zeilen();
      var alt = sitzungen(utc(2026, 1, 5), utc(2026, 3, 31), '60m', { preis: 50, vol: 2e6 });   /* Firma 1, abgemeldet 31.03. */
      var a = neuesArchiv(utc(2026, 3, 31, 21), {});
      await a.A.fuege('60m', 'XYZ', alt);
      await a.A.speichere(true);
      /* Neustart Monate spaeter: Firma 2 unter XYZ, Yahoo-Fenster 1mo wie im Scan. */
      var b = neuesArchiv(utc(2026, 10, 1, 21), a.store);
      var neu = sitzungen(utc(2026, 9, 1), utc(2026, 9, 30), '60m', { preis: 12, vol: 3e5 });
      await b.A.fuege('60m', 'XYZ', neu);
      await b.A.speichere(true);
      var s = await b.A.serie('60m', 'XYZ'), ber = await b.A.bereiche('60m', 'XYZ');
      H.betreten(b.st.get >= 1 && b.st.schreib === 1 && b.store.bars_60m_XYZ.series.length === s.length, 'Bestand geladen, Mischung geschrieben');
      var altDrin = s.filter(function (x) { return x[0] < neu[0][0]; }).length;
      var fenster = s.slice(-800), altImFenster = fenster.filter(function (x) { return x[0] < neu[0][0]; }).length;
      var sprung = neu[0][1] / alt[alt.length - 1][1] - 1;
      return { abweichung: altDrin > 0 && ber.length === 0, text: 'neue Firma (' + neu.length + ' Kerzen um 12) an alte (' + altDrin +
        ' Kerzen um 50) gehaengt, Luecke ' + Math.round((neu[0][0] - letzte(alt)[0]) / TAG) + ' Tage, Sprung ' + Math.round(sprung * 100) +
        ' %, keine Bruchmarke (Bereiche ' + ber.length + '); Soll: Trennung. Scan-Fenster slice(-800) traegt ' + altImFenster +
        ' alte Kerzen (' + L.scanArchiv + '); allein haette die neue Reihe das 261er-Tor nicht bestanden (' + L.scanTor +
        '); reiheUnplausibel faengt erst < -80 % (' + L.unplausibel + '); Mischung nur nach Zeitstempel (' + L.fuegeKern + ')' };
    } },

  /* AR-5 - S6 Quellenmischung, Kennzeichnung: CFD-Kerzen (Capital-Backfill, 'cap') werden spaeter von
   * Yahoo-Kerzen derselben Stempel ersetzt. Soll: dollarVolTag rechnet mit den Yahoo-Umsaetzen, denn die
   * Kerzen SIND jetzt Yahoo-Kerzen (wiki R2: "capBereiche heisst war einmal CFD"). */
  { id: 'AR-5', stoerung: 'S6 cap-Bereich bleibt, nachdem Yahoo die CFD-Kerzen ersetzt hat (dollarVolTag)', bewertung: 'B',
    lauf: async function (H) {
      var L = Zeilen();
      var a = neuesArchiv(utc(2026, 10, 3, 12), {});
      var yahoo = sitzung(2026, 10, 1, '5m', { vol: 1e5 }).concat(sitzung(2026, 10, 2, '5m', { vol: 1e5 }));
      var cfd = yahoo.map(function (b) { return [b[0], r2(b[1] + 0.02), 3]; });       /* Capital: [t, mid, vol], Umsatz ~1/500 */
      await a.A.fuege('5m', 'DDD', cfd, 'cap');                                       /* capBackfill */
      await a.A.fuege('5m', 'DDD', yahoo);                                            /* Messlauf, frisch von Yahoo */
      await a.A.speichere(true);
      var s = await a.A.serie('5m', 'DDD'), ber = await a.A.bereiche('5m', 'DDD');
      var alleYahoo = s.length === yahoo.length && s.every(function (b) { return b.length === 5 && b[2] === 1e5; });
      H.betreten(alleYahoo && ber.length === 1 && a.st.schreib === 1, 'Yahoo hat alle CFD-Stempel ersetzt, Bereich gesetzt, geschrieben');
      var ist = a.A.dollarVolTag(s, ber), soll = a.A.dollarVolTag(s, []);
      return { abweichung: ist !== soll, text: 'alle ' + s.length + ' Kerzen sind nach dem Ersetzen Yahoo-Kerzen, der Bereich ' + kurz(ber[0][0]) + '..' +
        kurz(ber[0][1]) + ' bleibt; dollarVolTag = ' + ist + ' (Soll ' + Math.round(soll / 1e6) + ' Mio $/Tag) - die guten Umsaetze werden uebersprungen (' +
        L.dvt + '); null heisst im Messlauf "nicht filtern" (' + L.labDv + ', ' + L.labFilter + ')' };
    } },

  /* AR-6 - S6 Quellenmischung, CFD-Rueckfall im 60m-Scan: Yahoo faellt aus, CapAPI.prices liefert
   * Capital-Stundenkerzen fast rund um die Uhr auf :00 (Aktien-Raster :30), ohne Sitzungsfilter.
   * Soll: die Yahoo-Kerzen bleiben, und die Aktienreihe nimmt keine Kerzen ausserhalb der Sitzung auf
   * (capBackfill filtert dafuer eigens mit istSitzung). */
  { id: 'AR-6', stoerung: 'S6 CFD-Rueckfall 60m: Randstunden und gekippte Rasterphase', bewertung: 'A',
    lauf: async function (H) {
      var L = Zeilen();
      function cfdTage(von, bis) {
        var out = [];
        werktage(von, bis).forEach(function (d) {
          for (var h = 8; h <= 23; h++) out.push([utc(d[0], d[1], d[2], h), r2(100 + h * 0.01), 40]);
        });
        return out;
      }
      function inSitzung(t) { var m = (t % TAG) / MIN; return m >= 13 * 60 + 30 && m < 20 * 60; }
      async function fall(vonYahoo) {
        var a = neuesArchiv(utc(2026, 10, 2, 21), {});
        var y = sitzungen(vonYahoo, utc(2026, 10, 2), '60m');
        await a.A.fuege('60m', 'EEE', y);
        await a.A.fuege('60m', 'EEE', cfdTage(utc(2026, 9, 28), utc(2026, 10, 2)), 'cap');   /* Scan-Rueckfall */
        await a.A.speichere(true);
        var s = await a.A.serie('60m', 'EEE'), ber = await a.A.bereiche('60m', 'EEE');
        var yLetzte5 = y.filter(function (b) { return b[0] >= utc(2026, 9, 28); });
        var yDa = yLetzte5.filter(function (b) { return s.some(function (x) { return x[0] === b[0] && x.length === 5; }); }).length;
        var rand = s.filter(function (x) { return !inSitzung(x[0]); }).length;
        return { yDa: yDa, yN: yLetzte5.length, rand: rand, ber: ber.length, schreib: a.st.schreib, phase: a.K.rasterPhase(s, 3600000) / MIN };
      }
      var kurzF = await fall(utc(2026, 9, 28));      /* neue Reihe: nur 5 Tage Yahoo */
      var langF = await fall(utc(2026, 8, 24));      /* 30 Tage Yahoo-Bestand */
      H.betreten(kurzF.ber === 1 && langF.ber === 1 && kurzF.schreib === 1 && langF.schreib === 1, 'cap-Bereich gesetzt und geschrieben (beide Faelle)');
      var abw = kurzF.yDa < kurzF.yN || kurzF.rand > 0 || langF.yDa < langF.yN || langF.rand > 0;
      return { abweichung: abw, text: 'kurze Yahoo-Basis: gelernte Phase kippt auf :' + ('0' + kurzF.phase).slice(-2) + ' (' + L.phase + '), Regel 2 loescht ' +
        (kurzF.yN - kurzF.yDa) + '/' + kurzF.yN + ' Yahoo-Kerzen (' + L.regel2 + '), ' + kurzF.rand + ' Kerzen ausserhalb der Sitzung; lange Basis: Yahoo ' +
        langF.yDa + '/' + langF.yN + ' bleibt, aber ' + langF.rand + ' CFD-Randstunden (08-12, 21-23 UTC) bleiben in der Aktienreihe. Soll: Yahoo ' +
        'vollstaendig, 0 Randstunden (capBackfill filtert, ' + L.capSitzung + '; Scan-Rueckfall nicht, ' + L.scanCap + '); der Scan rechnet darauf (' + L.scanArchiv + ')' };
    } },

  /* AR-7 - S6 bereinigt/roh: Yahoo-Intraday ist rueckwirkend split-bereinigt. Der Bestand wurde vor dem
   * Split gesammelt (alte Skala), der Abruf danach liefert dieselben Stempel auf neuer Skala.
   * Soll: kein Kurssprung, wo der Markt keinen gemacht hat (Altteil umskalieren oder Mischung verweigern/
   * kennzeichnen - der konstante Faktor an gemeinsamen Stempeln ist die Signatur). */
  { id: 'AR-7', stoerung: 'S6 Split: rueckwirkend bereinigter Abruf ueber unbereinigtem Bestand (60m)', bewertung: 'A',
    lauf: async function (H) {
      var L = Zeilen();
      var alt = sitzungen(utc(2026, 8, 3), utc(2026, 9, 25), '60m', { preis: 400 });           /* vor dem Split gesammelt */
      var a = neuesArchiv(utc(2026, 10, 2, 21), { bars_60m_SPL: { series: alt } });
      var fensterAb = utc(2026, 9, 2);                                                         /* range=1mo */
      var vorSplitBereinigt = alt.filter(function (b) { return b[0] >= fensterAb; })
        .map(function (b) { return [b[0], b[1] / 4, b[2], b[3] / 4, b[4] / 4]; });
      var nachSplit = sitzungen(utc(2026, 9, 28), utc(2026, 10, 2), '60m', { preis: 100.1 });   /* Split 4:1, ex 28.09. */
      await a.A.fuege('60m', 'SPL', vorSplitBereinigt.concat(nachSplit));
      await a.A.speichere(true);
      var s = a.store.bars_60m_SPL.series;
      var gemeinsam = vorSplitBereinigt.length;
      var faktoren = vorSplitBereinigt.map(function (b) {
        var o = alt.filter(function (x) { return x[0] === b[0]; })[0]; return o ? b[1] / o[1] : null;
      });
      var konstant = faktoren.every(function (f) { return f != null && Math.abs(f - 0.25) < 1e-9; });
      H.betreten(gemeinsam > 0 && konstant && a.st.schreib === 1, 'gemeinsame Stempel mit konstantem Faktor 0,25 ersetzt und geschrieben');
      var groesster = { r: 0, t: 0 };
      for (var i = 1; i < s.length; i++) {
        var r = s[i][1] / s[i - 1][1] - 1;
        if (Math.abs(r) > Math.abs(groesster.r)) groesster = { r: r, t: s[i][0] };
      }
      var amSplit = s.filter(function (b) { return b[0] >= utc(2026, 9, 25, 19) && b[0] <= utc(2026, 9, 28, 14); });
      var splitSprung = amSplit.length >= 2 ? amSplit[amSplit.length - 1][1] / amSplit[0][1] - 1 : null;
      return { abweichung: Math.abs(groesster.r) > 0.5, text: gemeinsam + ' gemeinsame Stempel, alle mit Faktor 0,25 - neu gewinnt stumm (' + L.mische +
        '); groesster Sprung ' + Math.round(groesster.r * 100) + ' % am ' + kurz(groesster.t) + ' (Fenstergrenze, kein Ereignis), am echten Split-Tag ' +
        Math.round(splitSprung * 100) + ' %. Soll: kein Sprung. reiheUnplausibel faengt -75 % nicht (' + L.unplausibel + '); Scan rechnet auf der Reihe (' + L.scanArchiv + ')' };
    } },

  /* AR-8 - S7 abgemeldete Reihe: die Reihe hat am Fr 02.10. aufgehoert, jeder spaetere Abruf haengt eine
   * flache Kerze (Umsatz 0, aktueller Kurs) an. Unterscheider ist NICHT die Form, sondern ob die Reihe
   * aufgehoert hat (letzter Umsatz mindestens einen Tag aelter). Soll: keine Phantomkerzen, Abdeckung 2 Tage. */
  { id: 'AR-8', stoerung: 'S7 abgemeldete Reihe sammelt flache Abrufkerzen (1m)', bewertung: 'B',
    lauf: async function (H) {
      var L = Zeilen();
      var bestand = sitzung(2026, 10, 1, '1m').concat(sitzung(2026, 10, 2, '1m'));
      var a = neuesArchiv(utc(2026, 10, 5, 22, 14), { bars_1m_ALT: { series: bestand } });
      var schluss = letzte(bestand)[1];
      var abrufe = [utc(2026, 10, 5, 22, 14, 0), utc(2026, 10, 6, 22, 15, 0), utc(2026, 10, 7, 22, 16, 0), utc(2026, 10, 8, 22, 17, 31)];
      for (var i = 0; i < abrufe.length; i++) {
        a.uhr.jetzt = abrufe[i];
        await a.A.fuege('1m', 'ALT', sitzung(2026, 10, 2, '1m').concat([stempel(abrufe[i], schluss)]));   /* Nachtsammlung, btRange 7d */
      }
      await a.A.speichere(true);
      var s = a.store.bars_1m_ALT.series;
      var phantome = s.filter(function (b) { return b[0] > letzte(bestand)[0]; });
      var krummWeg = !s.some(function (b) { return b[0] === abrufe[3]; });
      H.betreten(krummWeg && a.st.schreib === 1, 'krummer Abrufstempel verworfen (Regel 1), Reihe geschrieben');
      var tage = a.K.tageVon(s).length, abd = await a.A.abdeckung('1m', ['ALT']);
      return { abweichung: phantome.length > 0, text: phantome.length + ' Phantomkerzen nach dem letzten Handel (' + phantome.map(function (b) { return kurz(b[0]); }).join(', ') +
        '), Abdeckung ' + abd.tageMin + ' Tage statt 2 (tageVon ' + tage + '). ohneStempel prueft Sekunde und Raster, nie ob die Reihe aufgehoert hat (' +
        L.regel1 + ', ' + L.weit + '); nur der krumme Stempel 22:17:31 faellt. Abdeckung geht in den Analyse-Export (' + L.abdeckung + ')' };
    } },

  /* AR-9 - S8 Zeitumstellung: Ende der US-Sommerzeit am 01.11.2026. 60m-Kerzen springen von 13:30-19:30
   * auf 14:30-20:30 UTC, der Schluss von 20:00 auf 21:00. Soll: Rasterphase bleibt :30, alle echten Kerzen
   * bleiben, die Stempel fallen, Tagesgrenzen stimmen. */
  { id: 'AR-9', stoerung: 'S8 Sommer-/Winterzeit (60m-Raster :30, Schluss 20:00 -> 21:00 UTC)', bewertung: '-',
    lauf: async function (H) {
      var a = neuesArchiv(utc(2026, 11, 3, 22), {});
      var tage = [[2026, 10, 29], [2026, 10, 30], [2026, 11, 2], [2026, 11, 3]], n60 = 0, n5 = 0;
      for (var i = 0; i < tage.length; i++) {
        var d = tage[i], w = winter2026(d[0], d[1], d[2]);
        var k60 = sitzung(d[0], d[1], d[2], '60m', { winter: w }), k5 = sitzung(d[0], d[1], d[2], '5m', { winter: w });
        var schluss = utc(d[0], d[1], d[2], w ? 21 : 20);
        n60 += k60.length; n5 += k5.length;
        await a.A.fuege('60m', 'DST', k60.concat([stempel(schluss, letzte(k60)[1])]));                 /* off-Raster, Regel 1b */
        await a.A.fuege('5m', 'DST', k5.concat([stempel(schluss + 17000, letzte(k5)[1])]));              /* krumm, Regel 1 */
      }
      await a.A.speichere(true);
      var s60 = a.store.bars_60m_DST.series, s5 = a.store.bars_5m_DST.series;
      H.betreten(a.st.schreib === 2 && n60 === 28 && n5 === 312, 'beide Reihen geschrieben, Erwartung 28/312');
      var phase = a.K.rasterPhase(s60, 3600000) / MIN;
      var ok = s60.length === n60 && s5.length === n5 && phase === 30 && !s60.some(stempelForm) && !s5.some(stempelForm) &&
        a.K.tageVon(s60).length === 4 && a.K.tageVon(s5).length === 4;
      return { abweichung: !ok, text: '60m ' + s60.length + '/' + n60 + ', 5m ' + s5.length + '/' + n5 + ' Kerzen ueber den Wechsel, Phase :' + phase +
        ', Stempel 20:00/21:00 verworfen, je 4 UTC-Tage - der Wechsel um eine Stunde ist ein Vielfaches jeder Kerzenlaenge und aendert weder Raster noch Abstaende' };
    } },

  /* AR-10 - S9/S10/S11: Feiertag (Thanksgiving 26.11.), Halbtag (27.11., Schluss 18:00 UTC), Kursaussetzung
   * (30.11., 16:00-17:00 UTC keine Kerzen, davor vier flache Kerzen ohne Umsatz auf dem Raster).
   * Soll: Abdeckung 3 Tage, die umsatzlosen Raster-Kerzen bleiben (Umsatz ist der falsche Unterscheider),
   * dollarVolTag = Summe Kurs x Umsatz / Tage mit Umsatz. */
  { id: 'AR-10', stoerung: 'S9-S11 Feiertag, Halbtag, Kursaussetzung (5m): Abdeckung, Luecken, dollarVolTag', bewertung: '-',
    lauf: async function (H) {
      var a = neuesArchiv(utc(2026, 12, 1, 12), {});
      var mi = sitzung(2026, 11, 25, '5m', { winter: true });
      var halb = sitzung(2026, 11, 27, '5m', { winter: true, halbtag: true });
      var mo = sitzung(2026, 11, 30, '5m', { winter: true, luecke: [utc(2026, 11, 30, 16), utc(2026, 11, 30, 17)] });
      var flach = [utc(2026, 11, 30, 15, 40), utc(2026, 11, 30, 15, 45), utc(2026, 11, 30, 15, 50), utc(2026, 11, 30, 15, 55)];
      mo = mo.map(function (b) { return flach.indexOf(b[0]) >= 0 ? [b[0], 100.2, 0, 100.2, 100.2] : b; });
      await a.A.fuege('5m', 'FEI', mi.concat([stempel(utc(2026, 11, 25, 21, 0, 12), 100.3)]));
      await a.A.fuege('5m', 'FEI', halb.concat([stempel(utc(2026, 11, 27, 18, 0, 9), 100.3)]));
      await a.A.fuege('5m', 'FEI', mo.concat([stempel(utc(2026, 11, 30, 21, 0, 21), 100.3)]));
      await a.A.speichere(true);
      var s = await a.A.serie('5m', 'FEI'), abd = await a.A.abdeckung('5m', ['FEI']);
      H.betreten(abd.symbole === 1 && a.st.schreib === 1, 'Reihe in der Abdeckung gezaehlt (> 50 Kerzen), geschrieben');
      var alle = mi.concat(halb, mo), summe = 0;
      alle.forEach(function (b) { if (b[2]) summe += b[2] * b[1]; });
      var dvSoll = summe / 3, dvIst = a.A.dollarVolTag(s, []);
      var flachDa = flach.filter(function (t) { return s.some(function (b) { return b[0] === t; }); }).length;
      var ok = s.length === alle.length && abd.tageMin === 3 && flachDa === 4 && Math.abs(dvIst - dvSoll) < 1e-6;
      return { abweichung: !ok, text: s.length + '/' + alle.length + ' Kerzen (Halbtag ' + halb.length + ', Montag mit Aussetzung ' + mo.length + '), Abdeckung ' +
        abd.tageMin + ' Tage (Soll 3, Feiertag fehlt zu Recht), umsatzlose Raster-Kerzen ' + flachDa + '/4 behalten, dollarVolTag ' + Math.round(dvIst) +
        ' (Soll ' + Math.round(dvSoll) + ')' };
    } },

  /* AR-11 - Kurs 0 / NaN / negativ / null und Hoch < Tief im Zulauf. Soll: das dauerhafte Archiv nimmt keine
   * Nicht-Kurse auf (dieselbe Regel wie kurse.js kursOk: endlich und > 0) und keine Kerze mit Hoch < Tief
   * (kurse.js tauscht). Heute filtert der Yahoo-Weg vorab; capital.js laesst bid 0 durch. */
  { id: 'AR-11', stoerung: 'Kurs 0/NaN/negativ/null und Hoch < Tief an fuege()', bewertung: 'A',
    lauf: async function (H) {
      var L = Zeilen();
      var a = neuesArchiv(utc(2026, 10, 5, 20, 30), {});
      var t = sitzung(2026, 10, 5, '5m');
      var kaputt = {};
      kaputt[t[10][0]] = [t[10][0], 0, 1000, 100.1, 99.9];
      kaputt[t[20][0]] = [t[20][0], NaN, 1000, NaN, NaN];
      kaputt[t[30][0]] = [t[30][0], -5, 1000, 100.1, 99.9];
      kaputt[t[40][0]] = [t[40][0], 100, 1000, 99, 101];
      kaputt[t[50][0]] = [t[50][0], null, 1000, 100.1, 99.9];
      await a.A.fuege('5m', 'NUL', t.map(function (b) { return kaputt[b[0]] || b; }));
      await a.A.speichere(true);
      var s = a.store.bars_5m_NUL.series;
      H.betreten(a.st.schreib === 1 && s.length > 50, 'Reihe geschrieben');
      var drin = Object.keys(kaputt).map(Number).map(function (k) { return s.filter(function (b) { return b[0] === k; })[0]; }).filter(Boolean);
      var nichtKurs = drin.filter(function (b) { return !(typeof b[1] === 'number' && isFinite(b[1]) && b[1] > 0); }).length;
      var hochUnterTief = drin.filter(function (b) { return b.length >= 5 && b[3] < b[4]; }).length;
      return { abweichung: nichtKurs > 0 || hochUnterTief > 0, text: 'von 5 kaputten Kerzen stehen ' + drin.length + ' im Store: Schluss ' +
        drin.map(function (b) { return JSON.stringify(b[1]); }).join('/') + ' (NaN wird durch schlank() zu 0), Hoch<Tief ' + hochUnterTief +
        '; Soll 0. fuege prueft nur die Laenge (' + L.mische + '); Zulauf: Yahoo vorgefiltert, Capital-Rueckfall laesst bid 0 durch (' + L.capPreis +
        '); der Scan rechnet auf der Reihe (' + L.scanArchiv + ')' };
    } },

  /* AR-12 - TAGE_MAX gegen die Wanduhr: der Rechner steht ein Jahr vor (05.10.2027). Soll: eine Kappung
   * darf den Bestand nicht nach einer Uhr verwerfen, die den Daten widerspricht (Bezug = juengste Kerze,
   * oder Abbruch bei Uhr weit vor den Daten). 1m ist nicht nachladbar (Yahoo 7 Tage). */
  { id: 'AR-12', stoerung: 'TAGE_MAX-Kappung bei falscher Rechneruhr (+1 Jahr)', bewertung: 'B',
    lauf: async function (H) {
      var L = Zeilen();
      var bestand = sitzungen(utc(2026, 9, 28), utc(2026, 10, 2), '1m');
      var frisch = sitzung(2026, 10, 5, '1m');
      async function lauf(uhr) {
        var a = neuesArchiv(uhr, { bars_1m_UHR: { series: bestand.slice() } });
        await a.A.fuege('1m', 'UHR', frisch);
        await a.A.speichere(true);
        return { n: a.store.bars_1m_UHR.series.length, schreib: a.st.schreib };
      }
      var richtig = await lauf(utc(2026, 10, 5, 21));
      var falsch = await lauf(utc(2027, 10, 5, 21));
      H.betreten(richtig.schreib === 1 && falsch.schreib === 1 && richtig.n === bestand.length + frisch.length, 'beide Laeufe geschrieben, richtige Uhr behaelt alles');
      return { abweichung: falsch.n < richtig.n, text: 'richtige Uhr: ' + richtig.n + ' Kerzen; Uhr +1 Jahr: ' + falsch.n + ' Kerzen - Bestand UND frischer Abruf verworfen und so ' +
        'in den Store geschrieben (Kappung ' + Ar.TAGE_MAX['1m'] + ' Tage relativ zu Date.now(), ' + L.kappe + ', aufgerufen ohne Bezugszeit in ' + L.fuegeKern + '). Soll: ' + richtig.n };
    } },

  /* AR-13 - Speicher-Drossel: speichere(false) schreibt hoechstens alle 10 Minuten. Absturz drei Minuten nach
   * dem letzten Schreiben. Soll: der Verlust bleibt auf die Drosselzeit begrenzt und der naechste Abruf
   * desselben Fensters (Scan 5m: range 5d) fuellt ihn wieder auf. */
  { id: 'AR-13', stoerung: 'Speicher-Drossel (10 Min) und Absturz', bewertung: '-',
    lauf: async function (H) {
      var L = Zeilen();
      var heute = sitzung(2026, 10, 5, '5m');
      var a = neuesArchiv(utc(2026, 10, 5, 14, 0, 0), {});
      await a.A.fuege('5m', 'DRS', heute.slice(0, 6));                      /* 13:30-13:55 */
      await a.A.speichere(false);
      var nachErstem = a.st.schreib;
      a.uhr.jetzt = utc(2026, 10, 5, 14, 3, 0);
      await a.A.fuege('5m', 'DRS', heute.slice(0, 7));                      /* + 14:00 */
      await a.A.speichere(false);
      var nachZweitem = a.st.schreib;
      /* Absturz: neue Instanz auf demselben Store. */
      var b = neuesArchiv(utc(2026, 10, 5, 14, 6, 0), a.store);
      var nachStart = (await b.A.serie('5m', 'DRS')).length;
      await b.A.fuege('5m', 'DRS', heute.slice(0, 8));                      /* erster Scan nach dem Start */
      await b.A.speichere(false);
      H.betreten(nachErstem === 1 && nachZweitem === 1, 'Drossel hat den zweiten Schreibvorgang zurueckgehalten (' + L.drossel + ')');
      var wieder = b.store.bars_5m_DRS.series.length;
      return { abweichung: !(nachStart === 6 && wieder === 8), text: 'zweites speichere(false) nach 3 Min zurueckgehalten (' + L.drossel + '), nach Absturz ' + nachStart +
        ' statt 7 Kerzen, erster Scan nach dem Start bringt das Fenster zurueck: ' + wieder + '/8 im Store; Verlust begrenzt auf <10 Min nachladbarer Kerzen' };
    } },

  /* AR-14 - Flush-Wettlauf: waehrend speichere() auf storeSet wartet (IPC), mischt ein Scan neue Kerzen in
   * dieselbe Reihe. Soll: die Reihe bleibt als geaendert markiert und der naechste speichere() schreibt sie. */
  { id: 'AR-14', stoerung: 'Speichern: fuege() waehrend eines laufenden storeSet', bewertung: 'C',
    lauf: async function (H) {
      var L = Zeilen();
      var heute = sitzung(2026, 10, 5, '5m');
      var a = neuesArchiv(utc(2026, 10, 5, 14, 30), {});
      await a.A.fuege('5m', 'WET', heute.slice(0, 10));
      var hakenLief = false;
      a.st.beimSchreiben = async function () { hakenLief = true; await a.A.fuege('5m', 'WET', heute.slice(0, 12)); };
      await a.A.speichere(true);
      var imSpeicher = (await a.A.serie('5m', 'WET')).length;
      await a.A.speichere(true);                                                  /* naechster Flush */
      var b = neuesArchiv(utc(2026, 10, 5, 14, 40), a.store);                     /* Neustart */
      var nachStart = (await b.A.serie('5m', 'WET')).length;
      H.betreten(hakenLief && imSpeicher === 12 && a.st.schreib >= 1, 'fuege lief waehrend storeSet und hat die Reihe im Speicher verlaengert');
      return { abweichung: nachStart < imSpeicher, text: 'im Speicher ' + imSpeicher + ' Kerzen, Schreibvorgaenge ' + a.st.schreib + ' (Soll 2), nach Neustart ' + nachStart +
        ' (Soll ' + imSpeicher + '): dirty wird nach dem await geloescht, obwohl die Reihe sich waehrenddessen geaendert hat (' + L.dirtyAus +
        '); heilt erst beim naechsten fuege derselben Reihe' };
    } }
];

module.exports = { lader: 'archiv.js', tests: tests };

H.allein(module);
