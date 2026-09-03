'use strict';
/* MIGRATION: Renderer-Store (Sicherung) -> Dateisammlung (Stufe Z1).
 *
 *   node tools/archiv-migration.js <store-sicherung> <archiv-wurzel> --zaehlen   [--intervall 5m] [--symbole A,B]
 *   node tools/archiv-migration.js <store-sicherung> <archiv-wurzel> --schreiben [--intervall 5m] [--symbole A,B]
 *   node tools/archiv-migration.js <store-sicherung> <archiv-wurzel> --aequivalenz
 *   node tools/archiv-migration.js --kontrolle
 *
 *   store-sicherung  die KOPIE des Stores (tools/store-sichern.js, mit manifest.json) -
 *                    NIE der lebende Store. Der wird weder gelesen noch geschrieben.
 *   archiv-wurzel    der Ordner, unter dem archiv1m/ archiv5m/ archiv15m/ archiv60m/ liegen
 *                    (E:/Markt-Dashboard-Archiv). Hier wird GESCHRIEBEN - aber nur mit
 *                    --schreiben, nur ueber kerzenquelle.js zusammenfuehren()/satz(), nie
 *                    daran vorbei, und nur unter der Sammler-Sperre _laeuft.json.
 *
 * DIE REGEL JE KERZE - woertlich nach wiki/archiv-zusammenfuehrung.md Paragraph 6
 * (Wilhelms Entscheide 03.09.2026), in dieser Reihenfolge geprueft:
 *   gemeinsam          derselbe Stempel liegt in der Datei  -> die Datei gewinnt, nichts geschrieben
 *   laufend            Stempel + Dauer > updatedAt des Stores -> nicht (die Kerze lief noch, #85)
 *   unvollstaendig     Store-Kerze mit drei Feldern (ohne Hoch/Tief) -> nicht; siehe unten
 *   quote-nach-schluss Umsatz 0, hoch = tief = schluss, Stempel am oder nach dem
 *                      Sitzungsschluss LAUT KALENDER (boerse.js: Feiertage, Halbtage 13:00 ET,
 *                      Sommerzeit ueber America/New_York) -> nicht (Entscheid 1)
 *   cap                Stempel innerhalb capBereiche -> NICHT (Entscheid 2: verwerfen, aus Alpaca neu holen)
 *   ausserhalb-gitter  Stempel nicht auf dem Gitter des Intervalls -> nicht (das Raster
 *                      wuerde ihn beim Schreiben ohnehin entfernen; er wird hier GEZAEHLT)
 *   uebernehmen        alles andere: als Quelle 'yahoo', abgeleitet 'vergleich-z0',
 *                      Kerze [t, schluss, umsatz, hoch, tief, null] - die Eroeffnung kennt
 *                      der Store nicht, und null ist keine erfundene Zahl
 *   Symbol             Datei-Schreibweise; '-' -> '.' nur bei GENAU EINEM Treffer (BRK-B -> BRK.B);
 *                      mehrdeutig -> die ganze Reihe bleibt liegen und steht im Bericht
 *   Krypto (-USD)      archiv<iv>/krypto/, gleiches Format; die Kalenderregel gilt dort nicht
 *                      (Krypto hat keinen Sitzungsschluss)
 *   keine Datei        die Reihe wird NEU angelegt (EA, CCEP, CSGP, FAST, NET, Krypto) -
 *                      der Store ist dort die einzige Kopie
 *
 * WARUM 'unvollstaendig' NICHT UEBERNOMMEN WIRD: eine Kerze ohne Hoch und Tief waere im
 * Archiv eine Kerze mit null in [3] und [4]; jeder Leser, der Spannen, Kanaele oder
 * Stopps rechnet, nimmt dort Zahlen an. Sie werden gezaehlt und ausgewiesen (Abweichung).
 *
 * ZAEHLEN VOR SCHREIBEN. --zaehlen rechnet die ganze Migration im Speicher durch -
 * einschliesslich zusammenfuehren(), also einschliesslich des Rasters - und schreibt
 * nichts als den Bericht. Er zeigt auch, was das Raster von der VORHANDENEN Datei
 * entfernen wuerde (verlustDatei) und was von der Uebernahme (verlustNeu). Beides ist
 * die Zahl, an der Befund R5 haengt.
 *
 * VORBEDINGUNG R5 (wiki/archiv-zusammenfuehrung.md Paragraph 6, letzter Absatz): der
 * Rasterfilter darf auf 1m/5m/15m die volle Stunde mitten am Tag nicht mehr loeschen.
 * --schreiben prueft das am VERHALTEN von kerzenquelle.js (r5Behoben) und verweigert
 * sonst - ohne die Korrektur wuerde der Lauf die uebernommenen Kerzen und die :00-Kerzen
 * der 15m-Datei loeschen, und der naechste Sammellauf taete es erneut.
 *
 * POSITIVKONTROLLE (--kontrolle) laeuft vor jedem Zaehlen und Schreiben. Ein Werkzeug,
 * das nie 'uebernehmen' sagt, besteht jeden Trockenlauf (wiki/fehlerformen.md,
 * Nullbefund vom toten Werkzeug).
 *
 * AEQUIVALENZTEST (--aequivalenz): fuer alle Reihen der Sicherung mit Datei-Gegenstueck
 * auf allen gemeinsamen Stempeln ausser dem letzten des Stores:
 * signifikant(Datei, 7) === Store (Umsatz: Math.round). Abweichungen nach Grund:
 * cap (Stempel in capBereiche) / ppm (<= 1 ppm) / nachkorrektur (der Rest).
 */
var fs = require('fs');
var path = require('path');
var KQ = require('../kerzenquelle.js');
var Boerse = require('../boerse.js');
var V = require('./archiv-vergleich.js');

var INTERVALLE = ['1m', '5m', '15m', '60m'];
var DAUER_MS = { '1m': 60000, '5m': 300000, '15m': 900000, '60m': 3600000 };
var GRUENDE = ['gemeinsam', 'laufend', 'unvollstaendig', 'quote-nach-schluss', 'cap', 'ausserhalb-gitter', 'uebernehmen', 'defekt'];
var PPM = 1e-6;
var QUELLE_TEXT = 'renderer-store, Sicherung 2026-09-03, Z1-Migration (Quelle je Kerze: yahoo, abgeleitet vergleich-z0)';

/* ---------------------------------------------------------------- New York */
var NY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});
function nyTeile(ms) {
  var t = {};
  NY.formatToParts(new Date(ms)).forEach(function (p) { t[p.type] = p.value; });
  return { j: +t.year, m: +t.month, d: +t.day, h: (+t.hour) % 24, min: +t.minute };
}
/** UTC-Millisekunden fuer eine Wanduhrzeit in New York (Sommerzeit ueber Intl). */
function nyNachUtc(j, m, d, h, min) {
  var guess = Date.UTC(j, m - 1, d, h, min);
  for (var i = 0; i < 2; i++) {
    var p = nyTeile(guess);
    var wand = Date.UTC(p.j, p.m - 1, p.d, p.h, p.min);
    var soll = Date.UTC(j, m - 1, d, h, min);
    if (wand === soll) return guess;
    guess += soll - wand;
  }
  return guess;
}
/** Sitzungsschluss (UTC ms) des Handelstages, in den der Stempel faellt - oder null,
 *  wenn an diesem ET-Kalendertag nicht gehandelt wird (Wochenende, Feiertag). */
function sitzungsschluss(ms) {
  var p = nyTeile(ms);
  var tag = Date.UTC(p.j, p.m - 1, p.d);           /* boerse.js rechnet in UTC-Datumsteilen des ET-Tags */
  if (!Boerse.istHandelstag(tag)) return null;
  var halb = !!Boerse.halbtagAn(tag);
  return nyNachUtc(p.j, p.m, p.d, halb ? 13 : 16, 0);
}
function stempelkerze(b) { return (b[2] || 0) === 0 && b[3] === b[4] && b[3] === b[1]; }
function inBereichen(ts, bereiche) {
  for (var i = 0; i < bereiche.length; i++) if (ts >= bereiche[i][0] && ts <= bereiche[i][1]) return true;
  return false;
}

/* ---------------------------------------------------- R5: ist das Raster korrigiert? */
/** Prueft am VERHALTEN, ob rasterFilter() die volle Stunde mitten am Tag auf 1m/5m/15m
 *  stehen laesst. Einspeisbar, damit die Kontrolle beide Antworten sehen kann. */
function r5Behoben(filter) {
  filter = filter || KQ.rasterFilter;
  var t0 = Date.parse('2026-08-26T13:30:00Z');
  var tag = [];
  for (var i = 0; i < 78; i++) tag.push([t0 + i * 300000, 1, 100, 1, 1, 1]);   /* 13:30 .. 19:55 */
  tag.push([Date.parse('2026-08-26T20:00:00Z'), 1, 0, 1, 1, 1]);              /* Schluss */
  var nach = filter(tag, '5m');
  var vollesStunden = nach.filter(function (k) { return new Date(k[0]).getUTCMinutes() === 0 && k[0] < Date.parse('2026-08-26T20:00:00Z'); }).length;
  var min1 = filter([[Date.parse('2026-08-26T14:00:00Z'), 1, 1, 1, 1, 1], [Date.parse('2026-08-26T14:01:00Z'), 1, 1, 1, 1, 1]], '1m').length;
  var min15 = filter([[Date.parse('2026-08-26T15:00:00Z'), 1, 1, 1, 1, 1], [Date.parse('2026-08-26T15:15:00Z'), 1, 1, 1, 1, 1]], '15m').length;
  /* Auf 60m bleibt die Regel: 15:00 mitten am Tag ist ein Stempel, nicht Gitter. */
  var h60 = filter([[Date.parse('2026-08-26T14:30:00Z'), 1, 1, 1, 1, 1], [Date.parse('2026-08-26T15:00:00Z'), 1, 0, 1, 1, 1], [Date.parse('2026-08-26T15:30:00Z'), 1, 1, 1, 1, 1]], '60m').length;
  return vollesStunden === 6 && min1 === 2 && min15 === 2 && h60 === 2;
}

/* ------------------------------------------------------- die Regel je Kerze */
/** store: { series, updatedAt, capBereiche }; dateiStempel: Object mit Stempeln der
 *  Datei; iv; krypto: Kalenderregel aus. Rein, ohne Dateizugriff. */
function einordnen(store, dateiStempel, iv, krypto) {
  var dauer = DAUER_MS[iv] || 0;
  var cap = store.capBereiche || [];
  var zaehl = {}, neu = [], beispiele = {};
  GRUENDE.forEach(function (g) { zaehl[g] = 0; });
  var quoteAm = 0, quoteNach = 0;
  function merke(g, b) {
    zaehl[g]++;
    if (!beispiele[g]) beispiele[g] = new Date(b[0]).toISOString();
  }
  store.series.forEach(function (b) {
    var ts = b && b[0];
    if (!Array.isArray(b) || typeof ts !== 'number' || !isFinite(ts) || b.length < 3) { zaehl.defekt++; return; }
    if (dateiStempel[ts]) { merke('gemeinsam', b); return; }
    if (dauer && store.updatedAt != null && ts + dauer > store.updatedAt) { merke('laufend', b); return; }
    if (b.length < 5 || typeof b[3] !== 'number' || typeof b[4] !== 'number') { merke('unvollstaendig', b); return; }
    if (!krypto && stempelkerze(b)) {
      var zu = sitzungsschluss(ts);
      if (zu == null || ts >= zu) {
        merke('quote-nach-schluss', b);
        if (zu != null && ts === zu) quoteAm++; else quoteNach++;
        return;
      }
    }
    if (inBereichen(ts, cap)) { merke('cap', b); return; }
    if (!KQ.aufGitter(ts, iv)) { merke('ausserhalb-gitter', b); return; }
    merke('uebernehmen', b);
    neu.push([ts, b[1], b[2], b[3], b[4], null]);
  });
  return { zaehl: zaehl, neu: neu, beispiele: beispiele, quoteAmSchluss: quoteAm, quoteNachSchluss: quoteNach };
}

/** Die Vereinigung im Speicher - genau so, wie --schreiben sie auf die Platte bringt.
 *  Liefert das Ergebnis von zusammenfuehren() plus die Verluste durch das Raster. */
function vereinige(huelle, neu, iv) {
  var alt = huelle ? huelle.series : [];
  var v = KQ.zusammenfuehren(alt, neu, iv, {
    quellenAlt: huelle ? huelle.quellen : [], quelleNeu: 'yahoo', abgeleitetNeu: 'vergleich-z0',
  });
  var drin = {};
  v.serie.forEach(function (k) { drin[k[0]] = 1; });
  var verlustDatei = 0, verlustNeu = 0;
  alt.forEach(function (k) { if (!drin[k[0]]) verlustDatei++; });
  neu.forEach(function (k) { if (!drin[k[0]]) verlustNeu++; });
  return { v: v, verlustDatei: verlustDatei, verlustNeu: verlustNeu, dazu: v.serie.length - alt.length };
}

/* ---------------------------------------------------------- Dateizugriff */
function ladeStore(p) {
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { series: j.series || [], updatedAt: j.updatedAt != null ? j.updatedAt : null, capBereiche: j.capBereiche || [] };
}
function storeNamen(sicherung, iv) {
  var pre = 'bars_' + iv + '_';
  return fs.readdirSync(sicherung).filter(function (n) { return n.indexOf(pre) === 0 && /\.json$/.test(n); })
    .map(function (n) { return n.slice(pre.length, -5); }).sort();
}
/** Wohin gehoert die Reihe? { pfad, art, sym, neu } - art wie in archiv-vergleich.js
 *  (direkt / ersetzt:NAME / keine / mehrdeutig:...). Krypto immer nach krypto/. */
function zielFuer(wurzel, iv, sym) {
  var ordner = path.join(wurzel, 'archiv' + iv);
  if (KQ.istKryptoSym(sym)) {
    var pk = KQ.dateiFuer(sym, iv, ordner);
    return { pfad: pk, art: fs.existsSync(pk) ? 'direkt' : 'keine', sym: sym, neu: !fs.existsSync(pk), krypto: true };
  }
  var d = V.dateiFuer(wurzel, iv, sym);
  if (d.pfad) return { pfad: d.pfad, art: d.art, sym: d.art.indexOf('ersetzt:') === 0 ? d.art.slice(8) : sym, neu: false, krypto: false };
  if (d.art === 'keine') return { pfad: KQ.dateiFuer(sym, iv, ordner), art: 'keine', sym: sym, neu: true, krypto: false };
  return { pfad: null, art: d.art, sym: sym, neu: false, krypto: false };
}
function atomarSchreiben(pfad, text) {
  fs.mkdirSync(path.dirname(pfad), { recursive: true });
  var tmp = pfad + '.tmp-migration';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, pfad);
}
function imSammelfenster(jetzt) {
  var d = new Date(jetzt || Date.now());
  var m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return m >= 21 * 60 + 30 && m < 23 * 60;
}

/* ---------------------------------------------------------------- der Lauf */
function lauf(sicherung, wurzel, opt) {
  opt = opt || {};
  var schreiben = !!opt.schreiben;
  var ivs = opt.intervall ? [opt.intervall] : INTERVALLE;
  var nurSym = opt.symbole ? opt.symbole.reduce(function (o, s) { o[s] = 1; return o; }, {}) : null;
  var erg = { erzeugt: new Date().toISOString(), modus: schreiben ? 'schreiben' : 'zaehlen', sicherung: sicherung, wurzel: wurzel,
    r5Behoben: r5Behoben(), intervalle: {}, mehrdeutig: [], neueDateien: [], geschrieben: 0, unveraendert: 0, fehler: [] };
  ivs.forEach(function (iv) {
    var ordner = path.join(wurzel, 'archiv' + iv);
    var I = { reihen: 0, uebersprungen: 0, zaehl: {}, quoteAmSchluss: 0, quoteNachSchluss: 0, verlustDatei: 0, verlustNeu: 0, dazu: 0,
      neueDateien: 0, krypto: 0, geschrieben: 0, unveraendert: 0, jeReihe: [] };
    GRUENDE.forEach(function (g) { I.zaehl[g] = 0; });
    var gesperrt = false;
    if (schreiben) {
      var sp = KQ.sperreLesen(ordner);
      if (sp.aktiv) { erg.fehler.push(iv + ': ' + ordner + ' wird gerade geschrieben (' + (sp.was || '?') + ', seit ' + sp.start + ') - nicht angefasst'); erg.intervalle[iv] = I; return; }
      fs.mkdirSync(ordner, { recursive: true });
      gesperrt = KQ.sperreSetzen(ordner, 'Z1-Migration ' + iv + ' aus Store-Sicherung');
    }
    var begonnen = new Date().toISOString();
    try {
      storeNamen(sicherung, iv).forEach(function (sym) {
        if (nurSym && !nurSym[sym]) return;
        I.reihen++;
        var ziel = zielFuer(wurzel, iv, sym);
        if (!ziel.pfad) { I.uebersprungen++; erg.mehrdeutig.push(iv + ' ' + sym + ' (' + ziel.art + ')'); return; }
        var st = ladeStore(path.join(sicherung, 'bars_' + iv + '_' + sym + '.json'));
        var huelle = ziel.neu ? null : KQ.huelleLesen(ziel.pfad);
        if (!ziel.neu && !huelle) { I.uebersprungen++; erg.fehler.push(iv + ' ' + sym + ': Datei unlesbar - ' + ziel.pfad); return; }
        var dateiStempel = {};
        (huelle ? huelle.series : []).forEach(function (k) { dateiStempel[k[0]] = 1; });
        var e = einordnen(st, dateiStempel, iv, ziel.krypto);
        GRUENDE.forEach(function (g) { I.zaehl[g] += e.zaehl[g]; });
        I.quoteAmSchluss += e.quoteAmSchluss; I.quoteNachSchluss += e.quoteNachSchluss;
        if (ziel.krypto) I.krypto++;
        var r = { sym: sym, ziel: ziel.sym, art: ziel.art, neuDatei: ziel.neu, store: st.series.length, datei: huelle ? huelle.series.length : 0,
          zaehl: e.zaehl, beispiele: e.beispiele };
        if (e.neu.length || (huelle && huelle.format === 1 && schreiben && opt.formatHeben)) {
          var u = vereinige(huelle, e.neu, iv);
          r.verlustDatei = u.verlustDatei; r.verlustNeu = u.verlustNeu; r.dazu = u.dazu; r.quellen = u.v.quellen.length;
          I.verlustDatei += u.verlustDatei; I.verlustNeu += u.verlustNeu; I.dazu += u.dazu;
          if (ziel.neu) { I.neueDateien++; erg.neueDateien.push(iv + ' ' + ziel.sym + ' (' + e.neu.length + ' Kerzen)'); }
          if (schreiben) {
            var geaendert = u.dazu !== 0 || u.verlustDatei !== 0 || ziel.neu || (huelle && huelle.format !== KQ.FORMAT);
            if (geaendert) {
              var meta = { quellen: u.v.quellen,
                waehrung: huelle ? huelle.waehrung : undefined, boerse: huelle ? huelle.boerse : undefined,
                quelle: huelle && huelle.quelle ? huelle.quelle : QUELLE_TEXT,
                spannen: huelle ? huelle.spannen : undefined };
              atomarSchreiben(ziel.pfad, JSON.stringify(KQ.satz(ziel.sym, iv, u.v.serie, meta)));
              I.geschrieben++; erg.geschrieben++; r.geschrieben = true;
            } else { I.unveraendert++; erg.unveraendert++; }
          }
        } else if (schreiben) { I.unveraendert++; erg.unveraendert++; }
        I.jeReihe.push(r);
      });
    } finally {
      if (gesperrt) {
        KQ.sperreLoesen(ordner);
        KQ.laufProtokoll(ordner, [begonnen, new Date().toISOString(), iv, 'Z1-Migration', 'reihen=' + I.reihen,
          'uebernommen=' + I.zaehl.uebernehmen, 'geschrieben=' + I.geschrieben, 'verlustDatei=' + I.verlustDatei,
          'pid=' + process.pid].join('  '));
      }
    }
    erg.intervalle[iv] = I;
  });
  return erg;
}

/* --------------------------------------------------------- Aequivalenztest */
var FELDER = { schluss: 1, umsatz: 2, hoch: 3, tief: 4 };
function relAbw(s, f) { if (s === f) return 0; var m = Math.max(Math.abs(s), Math.abs(f)); return m > 0 ? Math.abs(s - f) / m : 0; }
/** Rein: store { series, capBereiche }, datei { series }. Alle gemeinsamen Stempel ausser
 *  dem letzten des Stores. Je Feld: gleichRoh / gleichNachRundung / cap / ppm / nachkorrektur. */
function aequivalenz(store, datei) {
  var F = {};
  datei.series.forEach(function (b) { F[b[0]] = b; });
  var letzte = store.series.length ? store.series[store.series.length - 1][0] : null;
  var cap = store.capBereiche || [];
  var aus = { gemeinsam: 0, nurStore: 0, felder: {} };
  Object.keys(FELDER).forEach(function (f) { aus.felder[f] = { n: 0, gleichRoh: 0, gleichNachRundung: 0, cap: 0, ppm: 0, nachkorrektur: 0, maxNachkorrektur: 0 }; });
  store.series.forEach(function (b) {
    var ts = b[0];
    if (ts === letzte) return;
    var f = F[ts];
    if (!f) { aus.nurStore++; return; }
    aus.gemeinsam++;
    var innen = inBereichen(ts, cap);
    Object.keys(FELDER).forEach(function (name) {
      var i = FELDER[name], s = b[i], v = f[i];
      if (typeof s !== 'number' || typeof v !== 'number') return;
      var x = aus.felder[name]; x.n++;
      if (s === v) { x.gleichRoh++; return; }
      var r = name === 'umsatz' ? Math.round(v) : V.signifikant(v, 7);
      if (s === r) { x.gleichNachRundung++; return; }
      if (innen) { x.cap++; return; }
      var a = relAbw(s, v);
      if (a <= PPM) { x.ppm++; return; }
      x.nachkorrektur++;
      if (a > x.maxNachkorrektur) x.maxNachkorrektur = a;
    });
  });
  return aus;
}
function aequivalenzLauf(sicherung, wurzel, opt) {
  opt = opt || {};
  var ivs = opt.intervall ? [opt.intervall] : INTERVALLE;
  var erg = { erzeugt: new Date().toISOString(), modus: 'aequivalenz', sicherung: sicherung, wurzel: wurzel, intervalle: {} };
  ivs.forEach(function (iv) {
    var I = { reihen: 0, mitDatei: 0, gemeinsam: 0, nurStore: 0, felder: {}, schlimmste: [] };
    Object.keys(FELDER).forEach(function (f) { I.felder[f] = { n: 0, gleichRoh: 0, gleichNachRundung: 0, cap: 0, ppm: 0, nachkorrektur: 0, maxNachkorrektur: 0 }; });
    storeNamen(sicherung, iv).forEach(function (sym) {
      I.reihen++;
      var ziel = zielFuer(wurzel, iv, sym);
      if (!ziel.pfad || ziel.neu) return;
      var huelle = KQ.huelleLesen(ziel.pfad);
      if (!huelle) return;
      I.mitDatei++;
      var st = ladeStore(path.join(sicherung, 'bars_' + iv + '_' + sym + '.json'));
      var a = aequivalenz(st, { series: huelle.series });
      I.gemeinsam += a.gemeinsam; I.nurStore += a.nurStore;
      var nk = 0;
      Object.keys(FELDER).forEach(function (f) {
        var x = I.felder[f], y = a.felder[f];
        ['n', 'gleichRoh', 'gleichNachRundung', 'cap', 'ppm', 'nachkorrektur'].forEach(function (k) { x[k] += y[k]; });
        if (y.maxNachkorrektur > x.maxNachkorrektur) x.maxNachkorrektur = y.maxNachkorrektur;
        nk += y.nachkorrektur;
      });
      if (nk) I.schlimmste.push([sym, nk]);
    });
    I.schlimmste.sort(function (a, b) { return b[1] - a[1]; });
    I.schlimmste = I.schlimmste.slice(0, 5);
    erg.intervalle[iv] = I;
  });
  return erg;
}

/* ------------------------------------------------------------- Markdown */
function markdown(erg) {
  var z = [];
  z.push('Erzeugt ' + erg.erzeugt + ' mit `node tools/archiv-migration.js`, Modus **' + erg.modus + '**' +
    (erg.r5Behoben != null ? ', Rasterfilter R5 ' + (erg.r5Behoben ? 'behoben' : '**NICHT behoben**') : '') + '.');
  z.push('');
  if (erg.modus === 'aequivalenz') {
    z.push('| Intervall | Reihen | mit Datei | gemeinsame Stempel (ohne letzten) | nur Store | Feld | n | gleich roh | gleich nach Rundung | cap | ≤ 1 ppm | Nachkorrektur | max. Nachkorrektur |');
    z.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    Object.keys(erg.intervalle).forEach(function (iv) {
      var I = erg.intervalle[iv];
      Object.keys(I.felder).forEach(function (f, i) {
        var x = I.felder[f];
        z.push('| ' + (i ? '' : iv) + ' | ' + (i ? '' : I.reihen) + ' | ' + (i ? '' : I.mitDatei) + ' | ' + (i ? '' : I.gemeinsam) + ' | ' + (i ? '' : I.nurStore) +
          ' | ' + f + ' | ' + x.n + ' | ' + x.gleichRoh + ' | ' + x.gleichNachRundung + ' | ' + x.cap + ' | ' + x.ppm + ' | ' + x.nachkorrektur +
          ' | ' + (x.maxNachkorrektur * 100).toFixed(3) + ' % |');
      });
      if (I.schlimmste.length) z.push('| | | | | | *meiste Nachkorrekturen* | ' + I.schlimmste.map(function (s) { return s[0] + ' ' + s[1]; }).join(', ') + ' | | | | | | |');
    });
    return z.join('\n');
  }
  z.push('| Intervall | Reihen | uebersprungen | ' + GRUENDE.join(' | ') + ' | quote am Schluss / danach | neue Dateien | Krypto | dazu | Verlust Datei (Raster) | Verlust Uebernahme (Raster) | geschrieben | unveraendert |');
  z.push('|---|---|---|' + GRUENDE.map(function () { return '---|'; }).join('') + '---|---|---|---|---|---|---|---|');
  Object.keys(erg.intervalle).forEach(function (iv) {
    var I = erg.intervalle[iv];
    z.push('| ' + iv + ' | ' + I.reihen + ' | ' + I.uebersprungen + ' | ' + GRUENDE.map(function (g) { return I.zaehl[g]; }).join(' | ') +
      ' | ' + I.quoteAmSchluss + ' / ' + I.quoteNachSchluss + ' | ' + I.neueDateien + ' | ' + I.krypto + ' | ' + I.dazu + ' | ' + I.verlustDatei + ' | ' + I.verlustNeu +
      ' | ' + I.geschrieben + ' | ' + I.unveraendert + ' |');
  });
  if (erg.mehrdeutig.length) { z.push(''); z.push('Mehrdeutig, liegen gelassen: ' + erg.mehrdeutig.join(', ')); }
  if (erg.neueDateien.length) { z.push(''); z.push('Neue Dateien (' + erg.neueDateien.length + '): ' + erg.neueDateien.slice(0, 40).join(', ') + (erg.neueDateien.length > 40 ? ', …' : '')); }
  if (erg.fehler.length) { z.push(''); z.push('FEHLER: ' + erg.fehler.join(' | ')); }
  return z.join('\n');
}

/* ------------------------------------------------------------- Kontrolle */
function kontrolle() {
  var fehler = [];
  function pruefe(bed, was, ist) { if (!bed) fehler.push(was); console.log((bed ? '  ok   ' : '  FEHL ') + was + (ist !== undefined ? '  →  ' + JSON.stringify(ist) : '')); }
  var t0 = Date.UTC(2026, 7, 3, 13, 30), dauer = DAUER_MS['5m'];
  var roh = [];
  /* Kurse mit voller Gleitkomma-Breite, damit die 7-Stellen-Rundung wirklich etwas aendert
   * und der Zweig 'gleich nach Rundung' nachweislich durchlaufen wird. */
  for (var i = 0; i < 400; i++) { var kk = 100 * (1 + i * 0.0123456789); roh.push([t0 + Math.floor(i / 78) * 86400000 + (i % 78) * dauer, kk, 1000 + i, kk * 1.0051234567, kk * 0.9951234567, kk]); }
  var storeAlle = V.schlank(roh);
  var stempel = {};
  roh.forEach(function (b) { stempel[b[0]] = 1; });
  var spaeter = roh[roh.length - 1][0] + 1e9;
  var zukunft = Date.parse('2027-01-01T00:00:00Z');   /* fuer Kerzen mit echten Daten: nichts davon 'laeuft noch' */

  console.log('Kontrolle A: Store ⊂ Datei');
  var A = einordnen({ series: storeAlle, updatedAt: spaeter, capBereiche: [] }, stempel, '5m', false);
  pruefe(A.zaehl.gemeinsam === 400 && A.zaehl.uebernehmen === 0 && A.neu.length === 0, 'A: 400 gemeinsam, 0 uebernehmen', A.zaehl);

  console.log('Kontrolle B: sechs Kerzen nur im Store, ausserhalb cap, mit Umsatz, auf dem Gitter');
  var ohne = {}; Object.keys(stempel).forEach(function (k) { ohne[k] = 1; });
  [10, 11, 12, 100, 101, 102].forEach(function (i) { delete ohne[roh[i][0]]; });
  var B = einordnen({ series: storeAlle, updatedAt: spaeter, capBereiche: [] }, ohne, '5m', false);
  pruefe(B.zaehl.uebernehmen === 6 && B.zaehl.gemeinsam === 394 && B.neu.length === 6 && B.neu[0].length === 6 && B.neu[0][5] === null,
    'B: genau 6 uebernehmen, sechs Felder, [5] = null', [B.zaehl.uebernehmen, B.neu[0]]);
  /* Eine Format-1-Datei: series ohne quellen - quellenLesen() macht daraus den Bestand. */
  var dateiB = { series: roh.filter(function (b) { return ohne[b[0]]; }), format: 1 };
  dateiB.quellen = KQ.quellenLesen(dateiB);
  var uB = vereinige(dateiB, B.neu, '5m');
  /* Was das Raster von der Datei nimmt, haengt an R5: die alte Regel loescht jede volle
   * Stunde mitten am Tag (hier: alle :00 der Datei ausser dem Tagesletzten), die
   * korrigierte nichts. Die Kontrolle verlangt, dass das Werkzeug GENAU diese Zahl
   * sieht - so kann sie vor und nach der Korrektur bestehen, ohne sie zu verschweigen. */
  var spaetesteJeTag = {};
  dateiB.series.forEach(function (k) { var t = new Date(k[0]).toISOString().slice(0, 10); if (spaetesteJeTag[t] == null || k[0] > spaetesteJeTag[t]) spaetesteJeTag[t] = k[0]; });
  var r5Verlust = dateiB.series.filter(function (k) { var d = new Date(k[0]); return d.getUTCMinutes() === 0 && spaetesteJeTag[d.toISOString().slice(0, 10)] !== k[0]; }).length;
  var sollVerlust = r5Behoben() ? 0 : r5Verlust;
  pruefe(uB.verlustDatei === sollVerlust && uB.dazu === 6 - sollVerlust && uB.v.serie.length === 400 - sollVerlust && r5Verlust > 0,
    'B: die Vereinigung bringt 6 dazu; das Raster nimmt der Datei ' + sollVerlust + ' (R5 ' + (r5Behoben() ? 'behoben' : 'nicht behoben: alle :00 mitten am Tag, ' + r5Verlust) + ')',
    [uB.dazu, uB.verlustDatei, uB.verlustNeu]);
  var qB = uB.v.quellen;
  pruefe(qB.length === 5 && qB.every(function (b) { return b.quelle === 'yahoo'; }) &&
    qB.filter(function (b) { return b.abgeleitet === 'vergleich-z0'; }).length === 2 &&
    qB.filter(function (b) { return b.abgeleitet === 'bestand'; }).length === 3,
    'B: quellen = Bestand / vergleich-z0 / Bestand / vergleich-z0 / Bestand (5 Bereiche, verdichtet)', qB.map(function (b) { return b.abgeleitet; }));
  var hB = KQ.satz('X', '5m', uB.v.serie, { quellen: qB });
  pruefe(hB.format === 2 && KQ.ohneQuelle(hB.series, hB.quellen) === 0, 'B: die Huelle geht durch satz() - Format 2, jede Kerze mit Quelle');

  console.log('Kontrolle C: dieselben sechs INNERHALB capBereiche');
  var C = einordnen({ series: storeAlle, updatedAt: spaeter, capBereiche: [[roh[10][0], roh[12][0]], [roh[100][0], roh[102][0]]] }, ohne, '5m', false);
  pruefe(C.zaehl.cap === 6 && C.zaehl.uebernehmen === 0, 'C: 6 cap, 0 uebernehmen - Entscheid 2', C.zaehl);
  var C2 = einordnen({ series: storeAlle, updatedAt: spaeter, capBereiche: [[roh[10][0], roh[12][0]]] }, ohne, '5m', false);
  pruefe(C2.zaehl.cap === 3 && C2.zaehl.uebernehmen === 3, 'C ohne zweite Marke: 3 cap, 3 uebernehmen - die Trennung ist keine Tautologie', C2.zaehl);

  console.log('Kontrolle D: laufende Kerze und unvollstaendige Kerze');
  var laufend = [roh[399][0] + dauer, 130, 100, 131, 129];
  var D = einordnen({ series: storeAlle.concat([laufend]), updatedAt: laufend[0] + 60000, capBereiche: [] }, stempel, '5m', false);
  pruefe(D.zaehl.laufend === 1 && D.zaehl.uebernehmen === 0, 'D: die Kerze, deren Eimer bei updatedAt noch offen war, wird nicht uebernommen', D.zaehl);
  var drei = [roh[399][0] + dauer, 130, 100];
  var D2 = einordnen({ series: storeAlle.concat([drei]), updatedAt: spaeter, capBereiche: [] }, stempel, '5m', false);
  pruefe(D2.zaehl.unvollstaendig === 1 && D2.zaehl.uebernehmen === 0, 'D: eine Drei-Feld-Kerze (ohne Hoch/Tief) wird gezaehlt, nicht uebernommen', D2.zaehl);

  console.log('Kontrolle E: Quote-Kerzen nach Sitzungsschluss laut Kalender');
  function q(iso, umsatz) { var t = Date.parse(iso); return [t, 50, umsatz, 50, 50]; }
  var E = einordnen({ series: [
    q('2026-08-26T20:00:00Z', 0),      /* Sommerzeit: 16:00 ET = Schluss, flach, ohne Umsatz -> Quote */
    q('2026-08-26T20:00:00Z', 0).map(function (x, i) { return i === 0 ? x + 300000 : x; }), /* 20:05 -> Quote */
    q('2026-08-26T19:55:00Z', 0),      /* vor dem Schluss, flach -> uebernehmen (leere Kerze, kein Quote) */
    q('2026-08-26T20:00:00Z', 5000).map(function (x, i) { return i === 0 ? x + 600000 : x; }), /* 20:10 MIT Umsatz -> uebernehmen */
    q('2026-01-15T20:00:00Z', 0),      /* Winterzeit: 15:00 ET, VOR dem Schluss -> uebernehmen */
    q('2026-01-15T21:00:00Z', 0),      /* Winterzeit: 16:00 ET = Schluss -> Quote */
    q('2025-11-28T18:00:00Z', 0),      /* Halbtag nach Thanksgiving: 13:00 EST = Schluss -> Quote */
    q('2025-11-28T17:55:00Z', 0),      /* Halbtag, 12:55 EST -> uebernehmen */
    q('2026-08-29T14:00:00Z', 0),      /* Samstag, flach -> Quote (kein Handelstag) */
  ], updatedAt: zukunft, capBereiche: [] }, {}, '5m', false);
  pruefe(E.zaehl['quote-nach-schluss'] === 5 && E.zaehl.uebernehmen === 4 && E.quoteAmSchluss === 3 && E.quoteNachSchluss === 2,
    'E: 5 Quote-Kerzen (3 am Schluss, 2 danach), 4 uebernommen - Sommerzeit, Winterzeit, Halbtag, Wochenende', [E.zaehl, E.quoteAmSchluss, E.quoteNachSchluss]);
  pruefe(sitzungsschluss(Date.parse('2026-08-26T15:00:00Z')) === Date.parse('2026-08-26T20:00:00Z') &&
    sitzungsschluss(Date.parse('2026-01-15T15:00:00Z')) === Date.parse('2026-01-15T21:00:00Z') &&
    sitzungsschluss(Date.parse('2025-11-28T15:00:00Z')) === Date.parse('2025-11-28T18:00:00Z') &&
    sitzungsschluss(Date.parse('2026-07-03T15:00:00Z')) === null,
    'E: Sitzungsschluss 20:00 (EDT), 21:00 (EST), 18:00 (Halbtag EST), null am Feiertag 03.07.2026');
  var EK = einordnen({ series: [q('2026-08-29T14:00:00Z', 0)], updatedAt: zukunft, capBereiche: [] }, {}, '5m', true);
  pruefe(EK.zaehl.uebernehmen === 1, 'E: fuer Krypto gilt die Kalenderregel nicht (Samstag, flach -> uebernehmen)', EK.zaehl);

  console.log('Kontrolle F: Gitter und Symbolnamen');
  var F = einordnen({ series: [[Date.parse('2026-08-26T15:12:00Z'), 1, 10, 1, 1]], updatedAt: zukunft, capBereiche: [] }, {}, '60m', false);
  pruefe(F.zaehl['ausserhalb-gitter'] === 1, 'F: ein krummer Stempel wird gezaehlt, nicht uebernommen', F.zaehl);
  var tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'migration-kontrolle-'));
  fs.mkdirSync(path.join(tmp, 'archiv5m', 'etf'), { recursive: true });
  var huelleX = KQ.satz('BRK.B', '5m', roh.slice(0, 5), { quellen: [{ von: roh[0][0], bis: roh[4][0], quelle: 'yahoo' }] });
  fs.writeFileSync(path.join(tmp, 'archiv5m', 'bars_5m_BRK.B.json'), JSON.stringify(huelleX));
  var zB = zielFuer(tmp, '5m', 'BRK-B');
  pruefe(zB.pfad && zB.art === 'ersetzt:BRK.B' && zB.sym === 'BRK.B' && !zB.neu, 'F: BRK-B findet genau eine Datei BRK.B und schreibt unter deren Namen', zB.art);
  fs.writeFileSync(path.join(tmp, 'archiv5m', 'etf', 'bars_5m_BRK.B.json'), JSON.stringify(huelleX));
  var zB2 = zielFuer(tmp, '5m', 'BRK-B');
  pruefe(!zB2.pfad && /^mehrdeutig/.test(zB2.art), 'F: mit zwei Treffern (Wurzel und etf/) ist es mehrdeutig - die Reihe bleibt liegen', zB2.art);
  var zK = zielFuer(tmp, '5m', 'BTC-USD');
  pruefe(zK.krypto && zK.neu && /archiv5m[\\/]krypto[\\/]bars_5m_BTC-USD\.json$/.test(zK.pfad), 'F: Krypto landet unter archiv5m/krypto/ als neue Datei', zK.pfad);
  var zN = zielFuer(tmp, '5m', 'EA');
  pruefe(zN.neu && /archiv5m[\\/]bars_5m_EA\.json$/.test(zN.pfad), 'F: eine Reihe ohne Datei wird neu angelegt', zN.pfad);
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('Kontrolle G: der R5-Fuehler unterscheidet beide Zustaende');
  var kaputt = function (serie, iv) {
    /* Nachbau der Regel vom 27.08.: Minute 0 nur als spaeteste Kerze des Tages, egal welches Intervall. */
    var sp = {}; serie.forEach(function (k) { var t = new Date(k[0]).toISOString().slice(0, 10); if (sp[t] == null || k[0] > sp[t]) sp[t] = k[0]; });
    return serie.filter(function (k) { if (!KQ.aufGitter(k[0], iv)) return false; var d = new Date(k[0]); if (d.getUTCMinutes() !== 0) return true; return sp[d.toISOString().slice(0, 10)] === k[0]; });
  };
  var heil = function (serie, iv) {
    if (iv !== '60m') return serie.filter(function (k) { return KQ.aufGitter(k[0], iv); });
    return kaputt(serie, iv);
  };
  pruefe(r5Behoben(kaputt) === false && r5Behoben(heil) === true, 'G: r5Behoben() sagt nein zur alten Regel und ja zur korrigierten',
    [r5Behoben(kaputt), r5Behoben(heil)]);
  console.log('  Stand von kerzenquelle.js: R5 ' + (r5Behoben() ? 'behoben' : 'NICHT behoben - --schreiben wird verweigert'));

  console.log('Kontrolle H: Aequivalenztest auf Kunstpaar');
  var stH = V.schlank(roh);
  stH[50] = stH[50].slice(); stH[50][1] = stH[50][1] * (1 + 1e-5);       /* 10 ppm -> nachkorrektur */
  stH[60] = stH[60].slice(); stH[60][2] = stH[60][2] * 500;              /* im cap-Bereich -> cap */
  var H = aequivalenz({ series: stH, capBereiche: [[roh[60][0], roh[60][0]]] }, { series: roh });
  pruefe(H.gemeinsam === 399 && H.felder.schluss.nachkorrektur === 1 && H.felder.umsatz.cap === 1 &&
    H.felder.schluss.gleichNachRundung + H.felder.schluss.gleichRoh === 398 && H.felder.schluss.gleichNachRundung > 300 &&
    H.felder.hoch.gleichRoh + H.felder.hoch.gleichNachRundung === 399 && H.felder.umsatz.gleichRoh === 398,
    'H: 399 gemeinsam (der letzte Stempel ausgenommen), 1 Nachkorrektur, 1 cap, der Rest gleich - ueberwiegend erst nach Rundung (Zweig durchlaufen)',
    [H.gemeinsam, H.felder.schluss, H.felder.umsatz]);

  console.log(fehler.length ? '\nKONTROLLE NICHT BESTANDEN: ' + fehler.length + ' Fehler' : '\nKontrolle bestanden (A–H).');
  return fehler.length === 0;
}

/* ----------------------------------------------------------------- main */
function arg(name, std) { var i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : std; }
if (require.main === module) {
  if (process.argv.indexOf('--kontrolle') >= 0) { process.exit(kontrolle() ? 0 : 1); }
  var sicherung = process.argv[2], wurzel = process.argv[3];
  var schreiben = process.argv.indexOf('--schreiben') >= 0;
  var zaehlen = process.argv.indexOf('--zaehlen') >= 0;
  var aeq = process.argv.indexOf('--aequivalenz') >= 0;
  if (!sicherung || !wurzel || sicherung.charAt(0) === '-' || (!schreiben && !zaehlen && !aeq)) {
    console.error('Aufruf: node tools/archiv-migration.js <store-sicherung> <archiv-wurzel> --zaehlen|--schreiben|--aequivalenz [--intervall 5m] [--symbole A,B] [--aus x.json] [--md x.md]  |  --kontrolle');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(sicherung, 'manifest.json'))) {
    console.error('Keine manifest.json in ' + sicherung + ' - das ist keine Store-Sicherung. Der lebende Store wird nicht angefasst.');
    process.exit(2);
  }
  if (/AppData[\\/]Roaming/i.test(sicherung)) { console.error('Das ist der lebende Store. Nein.'); process.exit(2); }
  if (!kontrolle()) { console.error('Ohne bestandene Kontrolle kein Lauf.'); process.exit(1); }
  var opt = { intervall: arg('--intervall', null), symbole: arg('--symbole', null) ? arg('--symbole', '').split(',') : null, schreiben: schreiben };
  if (schreiben) {
    if (!r5Behoben()) { console.error('\nVERWEIGERT: rasterFilter() in kerzenquelle.js loescht auf 1m/5m/15m noch die volle Stunde mitten am Tag (Befund R5). Erst die Korrektur, dann --schreiben.'); process.exit(1); }
    if (imSammelfenster()) { console.error('\nVERWEIGERT: 21:30–23:00 UTC ist das Sammelfenster der App. Spaeter starten.'); process.exit(1); }
  }
  var erg = aeq ? aequivalenzLauf(sicherung, wurzel, opt) : lauf(sicherung, wurzel, opt);
  erg.kontrolle = 'bestanden (A–H) vor dem Lauf';
  var md = markdown(erg);
  var aus = arg('--aus', null), mdPfad = arg('--md', null);
  if (aus) fs.writeFileSync(aus, JSON.stringify(erg, null, 1));
  if (mdPfad) fs.writeFileSync(mdPfad, md + '\n');
  console.log('\n' + md);
  if (erg.fehler && erg.fehler.length) process.exit(1);
}

module.exports = { einordnen: einordnen, vereinige: vereinige, aequivalenz: aequivalenz, sitzungsschluss: sitzungsschluss,
  nyNachUtc: nyNachUtc, r5Behoben: r5Behoben, zielFuer: zielFuer, kontrolle: kontrolle, lauf: lauf, aequivalenzLauf: aequivalenzLauf,
  markdown: markdown, imSammelfenster: imSammelfenster, atomarSchreiben: atomarSchreiben, ladeStore: ladeStore, GRUENDE: GRUENDE };
