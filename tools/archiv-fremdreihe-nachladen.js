'use strict';
/* Fremde Kursreihen im Archiv finden und per Yahoo ersetzen.
 * Befund vom 22.08.2026 (WBD, Warner Bros Discovery).
 *
 * WAS WAR: bars_5m_WBD.json hatte am 19.08.2026 nur 16 Kerzen statt 78 - und die 16
 * waren nicht etwa duenne WBD-Daten, sondern ein ANDERER Wert. Die Kette:
 *
 *   1. WBD kommt nur ueber den Nasdaq-100-Pool ins Mess-Universum. Diese 45 Werte
 *      landeten ausschliesslich per Capital-CFD-Backfill im Archiv (massenBackfill in
 *      depot.js holt 15m/5m/1m - deshalb hat keiner von ihnen eine 60m-Reihe).
 *   2. CapAPI.epicFor sucht das Capital-Epic zum Symbol. Findet es kein Epic, das
 *      WOERTLICH so heisst, nimmt es den ersten SHARES-Treffer der Suche - ohne zu
 *      pruefen, ob das dieselbe Gesellschaft ist. Fuer 'WBD' war das WBDIT, fuer 'EA'
 *      war es EAT. Der Treffer wandert in cap_epics.json und gilt von da an.
 *   3. WBDIT notiert bei ~2,22 statt ~28,50 und handelt nach EUROPAEISCHER Zeit. Der
 *      US-Sitzungsfilter des Backfills (13:30-20:00 UTC) laesst davon nur die
 *      Ueberschneidung 13:30-15:25 UTC uebrig - daher die 16-24 Kerzen je Tag.
 *
 * Die Luecke war also nur das Symptom. Der Schaden ist, dass in der Messbasis unter
 * dem Namen WBD die Kurse eines fremden Wertes stehen. Bei EA faellt das nicht einmal
 * durch die Kerzenzahl auf: EAT ist US-notiert und liefert brav 78 Kerzen am Tag.
 *
 * WAS DIESES WERKZEUG TUT: Es vergleicht jede Archivkerze mit der Yahoo-Kerze zum
 * GLEICHEN Zeitstempel. Weicht der Kurs im Median staerker ab als die Schwelle
 * (Vorgabe 2 %), ist die Reihe fremd - dann wird sie nicht ergaenzt, sondern ERSETZT.
 * Mischen waere hier das Schlimmste: eine Reihe, die zwischen zwei Kursniveaus springt.
 * Liegt die Abweichung unter der Schwelle, wird nur gemischt (Luecken auffuellen).
 *
 * EINE ABWEICHUNG IST NICHT IMMER EIN FREMDER WERT. Bei MNST stimmte das Epic, aber
 * Capital liefert die Historie UNbereinigt ueber einen 2:1-Split hinweg, waehrend Yahoo
 * bereinigt: 3978 Kerzen lagen exakt um Faktor 2,0000 daneben, ab dem 11.08.2026 exakt
 * auf 1 - in der Archivreihe stand damit ein Kurssprung von -50,2 %, den es nie gab.
 * So etwas wird UMGERECHNET, nicht verworfen. Der Unterschied ist teuer: Wegwerfen
 * haette die 1m-Reihe von 62 auf 7 Tage gestutzt (weiter reicht Yahoo dort nicht), und
 * 60+ Tage 1m sind genau das, wofuer der Backfill gebaut wurde. Erkannt wird ein Split
 * nur, wenn er eindeutig ist: ein zusammenhaengender Block auf EINEM Faktor, danach
 * ausschliesslich Tage auf 1. Sonst gilt die Reihe als fremd.
 *
 * Aufruf (aus dem Projektordner):
 *   node tools/archiv-fremdreihe-nachladen.js --pruefe-alle    Pruefbericht ueber alle Reihen (5m, liest nur)
 *   node tools/archiv-fremdreihe-nachladen.js                  Trockenlauf fuer WBD
 *   node tools/archiv-fremdreihe-nachladen.js --schreiben      WBD-Reihen ersetzen
 *   node tools/archiv-fremdreihe-nachladen.js --symbol EA      anderer Wert
 *   ... --auch-60m         legt die Stundenreihe an (WBD hat keine - wie seine 44 Pool-Nachbarn)
 *   ... --schwelle 5       Abweichungsschwelle in Prozent
 *   ... --epic-loeschen    entfernt den falschen cap_epics-Eintrag gleich mit
 *
 * Die App MUSS beendet sein: Sie haelt die Reihen im Speicher und schreibt sie alle
 * 10 Minuten zurueck - ein Flush waehrend des Laufs macht die Korrektur zunichte. Das
 * Werkzeug prueft vor jedem Schreiben die mtime und ueberspringt die Datei, wenn die
 * App dazwischengeschrieben hat (Meldung am Ende).
 *
 * WICHTIG danach: solange cap_epics.json 'WBD' auf 'WBDIT' zeigt, holt der naechste
 * Backfill die fremden Kerzen wieder (er fragt alles VOR dem fruehesten Archivstempel
 * ab - bei 1m sind das ueber 80 Tage). --epic-loeschen entfernt den Eintrag; die
 * dauerhafte Loesung ist eine Pruefung in CapAPI.epicFor. */

const fs = require('fs');
const path = require('path');
const https = require('https');
const A = require('../archiv.js');

const STORE = process.env.MD_STORE ||
  path.join(process.env.APPDATA || path.join(process.env.HOME || '', 'AppData', 'Roaming'), 'markt-dashboard', 'store');

function flag(n) { return process.argv.indexOf(n) !== -1; }
function wert(n, vorgabe) { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe; }

const SCHREIBEN = flag('--schreiben');
const AUCH60 = flag('--auch-60m');
const ALLE = flag('--pruefe-alle');
const EPIC_LOESCHEN = flag('--epic-loeschen');
const SYMBOL = wert('--symbol', 'WBD');
const SCHWELLE = parseFloat(wert('--schwelle', '2')) / 100;

/* Dieselben Fenster wie INTERVAL_CFG.btRange in depot.js - das MESS-Fenster, nicht das
 * Live-Fenster. 1m gibt Yahoo hoechstens 7 Tage; mehr ist dort nicht zu holen. */
const IV = {
  '1m':  { barMin: 1,  range: '7d'   },
  '5m':  { barMin: 5,  range: '60d'  },
  '15m': { barMin: 15, range: '60d'  },
  '60m': { barMin: 60, range: '730d' }
};
/* 5m zuerst, 1m zuletzt - und das ist keine Kosmetik: Yahoo gibt 1m nur 7 Tage her,
 * ein aelterer Split liegt dort komplett ausserhalb des Vergleichsfensters. Erst wenn
 * er auf 5m oder 15m BELEGT ist, kann die 1m-Reihe ihn uebernehmen. */
const REIHEN = AUCH60 ? ['5m', '15m', '60m', '1m'] : ['5m', '15m', '1m'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/* Unter so wenig gemeinsamen Kerzen ist der Median kein Urteil - dann wird nur
 * gemischt, nie verworfen. Lieber eine fremde Reihe stehen lassen als eine echte
 * wegen einer Handvoll Ausreisser loeschen. */
const MIN_UEBERLAPP = 20;

function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function holen(url) {
  return new Promise(function (resolve) {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json,*/*' }, timeout: 20000 }, function (res) {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { d += c; });
      res.on('end', function () { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode || 0, body: d }); });
    });
    req.on('timeout', function () { req.destroy(); resolve({ ok: false, status: 0, body: 'Timeout' }); });
    req.on('error', function (e) { resolve({ ok: false, status: 0, body: String(e.message || e) }); });
  });
}

/* Kerzen von Yahoo - Feldbelegung identisch zu depot.js fetchIntradayYahoo:
 * [t, close, volumen, hoch, tief]. */
async function yahoo(sym, iv) {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
    '?range=' + IV[iv].range + '&interval=' + iv;
  let res = await holen(url);
  if (!res.ok && res.status === 429) { await warte(5000); res = await holen(url); }
  if (!res.ok) return { fehler: 'HTTP ' + res.status };
  try {
    const j = JSON.parse(res.body);
    if (j.chart && j.chart.error) return { fehler: String(j.chart.error.description || j.chart.error.code) };
    const r = j.chart.result[0];
    const q = r.indicators.quote[0];
    const ts = r.timestamp || [], cl = q.close || [], vo = q.volume || [], hi = q.high || [], lo = q.low || [];
    const out = [];
    for (let i = 0; i < ts.length; i++) {
      if (cl[i] == null) continue;
      out.push([ts[i] * 1000, cl[i], vo[i] || 0, hi[i] == null ? cl[i] : hi[i], lo[i] == null ? cl[i] : lo[i]]);
    }
    return { series: out, waehrung: r.meta && r.meta.currency, boerse: r.meta && r.meta.exchangeName };
  } catch (e) { return { fehler: 'Antwort unlesbar' }; }
}

/** Median der relativen Kursabweichung auf den GEMEINSAMEN Zeitstempeln.
 *  Nur der Schlusskurs zaehlt: Hoch und Tief unterscheiden sich zwischen Boerse und
 *  CFD auch bei richtiger Zuordnung, der Schluss nicht nennenswert (nachgemessen an
 *  XEL und SIRI: Median unter 0,11 %). */
function abweichung(alt, neu) {
  const y = {};
  neu.forEach(function (b) { y[b[0]] = b[1]; });
  const rel = [];
  (alt || []).forEach(function (b) {
    const k = y[b[0]];
    if (k == null || !k) return;
    rel.push(Math.abs(b[1] - k) / Math.abs(k));
  });
  rel.sort(function (a, b) { return a - b; });
  return { n: rel.length, median: rel.length ? rel[rel.length >> 1] : null };
}

/** Verhaeltnis Archiv/Yahoo je Handelstag (Median). Ein Kurs-Split zeigt sich hier als
 *  sauberer Stufensprung: alle Tage vor dem Stichtag auf demselben Faktor, alle danach
 *  auf 1. Genau das lag am 23.08.2026 bei MNST vor - Capital liefert die Historie
 *  UNbereinigt, Yahoo bereinigt, und in der Archivreihe stand am 11.08.2026 ein
 *  Kurssprung von -50,2 %, den es nie gegeben hat. */
function tagesVerhaeltnis(alt, neu) {
  const y = {};
  neu.forEach(function (b) { y[b[0]] = b[1]; });
  const proTag = {};
  (alt || []).forEach(function (b) {
    const k = y[b[0]];
    if (k == null || !k) return;
    const d = new Date(b[0]).toISOString().slice(0, 10);
    (proTag[d] = proTag[d] || []).push(b[1] / k);
  });
  const out = [];
  Object.keys(proTag).sort().forEach(function (d) {
    const a = proTag[d].sort(function (x, z) { return x - z; });
    out.push({ tag: d, q: a[a.length >> 1], n: a.length });
  });
  return out;
}

/** Aus den Tagesverhaeltnissen einen Split lesen - aber nur, wenn er EINDEUTIG ist:
 *  ein zusammenhaengender Block am Anfang auf einem einzigen Faktor, danach
 *  ausschliesslich Tage auf 1, beides je Tag mit hoechstens 1 % Streuung. Alles
 *  andere ist kein Split, sondern ein fremder Wert - und der wird ersetzt, nicht
 *  umgerechnet. Ein falsch erkannter Split waere schlimmer als gar keiner: er
 *  schriebe plausibel aussehende, frei erfundene Kurse ins Archiv. */
function erkenneSplit(vh) {
  if (vh.length < 10) return null;
  const eins = function (q) { return Math.abs(q - 1) <= 0.01; };
  let i = 0;
  while (i < vh.length && !eins(vh[i].q)) i++;
  if (i === 0 || i === vh.length) return null;                    // kein Vorher- oder kein Nachher-Block
  for (let j = i; j < vh.length; j++) if (!eins(vh[j].q)) return null;   // ab dem Stichtag muss ALLES passen
  const vorher = vh.slice(0, i).map(function (v) { return v.q; });
  const f = vorher.slice().sort(function (a, b) { return a - b; })[vorher.length >> 1];
  if (eins(f) || !(f > 0)) return null;
  for (let k = 0; k < vorher.length; k++) if (Math.abs(vorher[k] / f - 1) > 0.01) return null;  // ein Faktor, keine Drift
  return { faktor: f, abTag: vh[i].tag, tageVorher: i, tageNachher: vh.length - i };
}

/** Kerzen vor dem Stichtag auf das bereinigte Niveau bringen. Das Volumen bleibt, wie
 *  es ist: das sind Capital-Ticks, keine Stueckzahlen - ein Split-Faktor darauf waere
 *  eine erfundene Zahl. */
function splitKorrigiert(bars, faktor, abMs) {
  return (bars || []).map(function (b) {
    if (b[0] >= abMs) return b;
    const o = [b[0], b[1] / faktor, b[2]];
    if (b.length >= 5) { o.push(b[3] / faktor, b[4] / faktor); }
    return o;
  });
}

/** Fehlende Rasterkerzen zwischen erster und letzter Kerze je Handelstag. */
function luecken(bars, step) {
  const proTag = {};
  (bars || []).forEach(function (b) {
    const d = new Date(b[0]).toISOString().slice(0, 10);
    (proTag[d] = proTag[d] || []).push(b[0]);
  });
  let fehlt = 0;
  Object.keys(proTag).forEach(function (d) {
    const ts = proTag[d];
    const von = Math.min.apply(null, ts), bis = Math.max.apply(null, ts);
    fehlt += Math.max(0, Math.floor((bis - von) / step) + 1 - ts.length);
  });
  return fehlt;
}

function tage(bars) {
  const s = {};
  (bars || []).forEach(function (b) { s[new Date(b[0]).toISOString().slice(0, 10)] = 1; });
  return Object.keys(s).sort();
}

const BACKUP_DIR = path.join(STORE, '..', 'backup-fremdreihe-' + new Date().toISOString().slice(0, 10));
function sichere(datei) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ziel = path.join(BACKUP_DIR, path.basename(datei));
  if (!fs.existsSync(ziel)) fs.copyFileSync(datei, ziel);   // nie eine Sicherung ueberschreiben
}

function lies(datei) {
  try { return { mtime: fs.statSync(datei).mtimeMs, st: JSON.parse(fs.readFileSync(datei, 'utf8')) }; }
  catch (e) { return null; }
}

/* ---------------- Pruefbericht ueber alle Reihen ---------------- */
async function pruefeAlle() {
  const syms = fs.readdirSync(STORE)
    .filter(function (f) { return /^bars_5m_.+\.json$/.test(f); })
    .map(function (f) { return f.slice(8, -5); })
    .sort();
  console.log('Pruefbericht: ' + syms.length + ' Reihen auf 5m gegen Yahoo (liest nur, aendert nichts).');
  console.log('Schwelle: Median-Kursabweichung ueber ' + (SCHWELLE * 100).toFixed(1) + ' % = fremde Reihe.');
  console.log('');
  const verdaechtig = [], unpruefbar = [];
  for (let i = 0; i < syms.length; i++) {
    const sym = syms[i];
    const d = lies(path.join(STORE, 'bars_5m_' + sym + '.json'));
    if (!d || !d.st.series || !d.st.series.length) { unpruefbar.push(sym + ': Datei leer oder unlesbar'); continue; }
    const r = await yahoo(sym, '5m');
    await warte(300);
    if (r.fehler) { unpruefbar.push(sym + ': Yahoo ' + r.fehler); continue; }
    const ab = abweichung(d.st.series, r.series);
    if (ab.n < MIN_UEBERLAPP) { unpruefbar.push(sym + ': nur ' + ab.n + ' gemeinsame Kerzen'); continue; }
    if (ab.median > SCHWELLE) {
      const s = erkenneSplit(tagesVerhaeltnis(d.st.series, r.series));
      verdaechtig.push({ sym: sym, median: ab.median, n: ab.n, split: s });
      console.log('  ' + (s ? 'SPLIT' : 'FREMD') + '  ' + sym.padEnd(10) + 'Median-Abweichung ' + (ab.median * 100).toFixed(2).padStart(8) + ' %   (' + ab.n + ' gemeinsame Kerzen)' +
        (s ? '   Faktor ' + s.faktor.toFixed(4) + ' vor ' + s.abTag : ''));
    }
    if ((i + 1) % 25 === 0) console.error('   ... ' + (i + 1) + '/' + syms.length + ' geprueft');
  }
  console.log('');
  console.log('---------------------------------------------------------------');
  console.log('Auffaellige Reihen: ' + verdaechtig.length + ' von ' + syms.length);
  verdaechtig.forEach(function (v) {
    console.log('   ' + v.sym.padEnd(8) + (v.median * 100).toFixed(2).padStart(7) + ' %   ' +
      (v.split ? 'Split, Faktor ' + v.split.faktor.toFixed(4) + ' vor ' + v.split.abTag + ' (umrechenbar)' : 'fremder Wert (ersetzen)'));
  });
  if (unpruefbar.length) {
    console.log('Nicht pruefbar: ' + unpruefbar.length);
    unpruefbar.slice(0, 40).forEach(function (u) { console.log('   ' + u); });
    if (unpruefbar.length > 40) console.log('   ... und ' + (unpruefbar.length - 40) + ' weitere');
  }
  console.log('');
  console.log('Nicht pruefbar heisst NICHT sauber: wo Yahoo nichts liefert, kann auch nichts');
  console.log('verglichen werden. Bei EA etwa endet die Yahoo-Reihe am 04.08.2026, das Archiv');
  console.log('fuehrt danach weiter Kerzen - die koennen von dort nicht mehr kommen.');
}

/* ---------------- Eine Reihe instandsetzen ---------------- */
async function reparieren(sym) {
  console.log('Store:  ' + STORE);
  console.log('Symbol: ' + sym);
  console.log('Modus:  ' + (SCHREIBEN ? 'SCHREIBEN' : 'Trockenlauf (nichts wird geaendert)'));
  if (SCHREIBEN) console.log('Sicherung: ' + BACKUP_DIR);
  console.log('Schwelle: Median-Kursabweichung ueber ' + (SCHWELLE * 100).toFixed(1) + ' % = Reihe wird ERSETZT statt gemischt.');
  console.log('');

  const bilanz = { geschrieben: 0, kollision: [], fehler: [], ersetzt: 0, gemischt: 0, umgerechnet: 0 };
  /* Beides auf einem breiten Zeitrahmen nachgewiesen und fuer die schmalen nutzbar:
   * Alle Reihen eines Symbols stammen aus derselben Quelle. Ist dort ein Split oder ein
   * fremder Wert BELEGT, gilt das auch fuer den Zeitrahmen, dessen Yahoo-Fenster zu kurz
   * zum Nachpruefen ist - sonst bleibt ausgerechnet die tiefste Reihe die falsche. */
  let splitBelegt = null, fremdBelegt = null;

  for (const iv of REIHEN) {
    const step = IV[iv].barMin * 60000;
    const datei = path.join(STORE, 'bars_' + iv + '_' + sym + '.json');
    const da = lies(datei);
    const alt = (da && da.st && da.st.series) || [];
    console.log('=== ' + iv + ' ===' + (da ? '' : '   (keine Datei - wird neu angelegt)'));

    const r = await yahoo(sym, iv);
    await warte(300);
    if (r.fehler) { console.log('  Yahoo-Abruf fehlgeschlagen: ' + r.fehler); bilanz.fehler.push(iv + ': ' + r.fehler); console.log(''); continue; }
    const frisch = A.ohneStempel(r.series, IV[iv].barMin);
    const tAlt = tage(alt), tY = tage(frisch);
    console.log('  Archiv: ' + String(alt.length).padStart(6) + ' Kerzen, ' + String(tAlt.length).padStart(3) + ' Tage' +
      (tAlt.length ? '  ' + tAlt[0] + ' .. ' + tAlt[tAlt.length - 1] : ''));
    console.log('  Yahoo:  ' + String(frisch.length).padStart(6) + ' Kerzen, ' + String(tY.length).padStart(3) + ' Tage' +
      (tY.length ? '  ' + tY[0] + ' .. ' + tY[tY.length - 1] : '') + '   (' + (r.waehrung || '?') + ' / ' + (r.boerse || '?') + ')');

    const ab = abweichung(alt, frisch);
    const vh = alt.length ? tagesVerhaeltnis(alt, frisch) : [];

    /* Kann DIESE Reihe den Split ueberhaupt selbst sehen? Nur, wenn Yahoo hier Tage VOR
     * dem Stichtag abdeckt. Bei 1m reicht Yahoo 7 Tage zurueck: der ganze unbereinigte
     * Teil liegt davor, der Vergleich trifft nur den bereits bereinigten Rest - und
     * meldet zufrieden "passt", waehrend 55 Tage weiter um Faktor 2 danebenliegen.
     * Deshalb zaehlt hier der Nachweis vom breiteren Zeitrahmen. */
    function erbeSplit() {
      if (!splitBelegt || !alt.length || alt[0][0] >= splitBelegt.abMs) return false;
      const selbstSichtbar = vh.some(function (v) { return v.tag < splitBelegt.abTag; });
      return !selbstSichtbar;
    }
    function meldeErbe() {
      console.log('          Yahoo deckt hier keinen Tag vor dem Stichtag ab - der auf ' + splitBelegt.woher +
        ' belegte Split (Faktor ' + splitBelegt.faktor.toFixed(4) + ' vor ' + splitBelegt.abTag + ') wird UEBERNOMMEN.');
    }

    let fremd = false, split = null, fremdGeerbt = false;
    if (!alt.length) {
      console.log('  Urteil: leer - die Yahoo-Reihe wird uebernommen.');
    } else if (ab.n < MIN_UEBERLAPP) {
      console.log('  Urteil: nur ' + ab.n + ' gemeinsame Zeitstempel - kein eigenes Urteil moeglich.');
      if (fremdBelegt) {
        /* Auf einem anderen Zeitrahmen ist die Quelle als fremd BELEGT. Alle Reihen eines
         * Symbols kommen aus demselben Epic - also ist auch diese fremd, selbst wenn Yahoo
         * hier nichts zum Gegenhalten liefert. Bei EA blieben sonst 21.792 Brinker-Kerzen
         * unter dem Namen EA stehen, nur weil Yahoo fuer den delisteten Wert keine
         * 1-Minuten-Historie mehr hat. */
        fremd = true; fremdGeerbt = true;
        console.log('          Auf ' + fremdBelegt.woher + ' ist die Quelle als fremd BELEGT (' +
          (fremdBelegt.median * 100).toFixed(2) + ' % auf ' + fremdBelegt.n + ' Kerzen) - dieselbe Quelle, also faellt der Bestand hier mit.');
      } else if (erbeSplit()) { split = splitBelegt; meldeErbe(); }
      else console.log('          Es wird nur GEMISCHT.');
    } else if (ab.median > SCHWELLE) {
      const s = erkenneSplit(vh);
      if (s) {
        split = { faktor: s.faktor, abTag: s.abTag, abMs: Date.parse(s.abTag + 'T00:00:00Z'), woher: iv };
        if (!splitBelegt) splitBelegt = split;
        console.log('  Urteil: SPLIT - ' + s.tageVorher + ' Tage liegen exakt um Faktor ' + s.faktor.toFixed(4) +
          ' daneben, ab ' + s.abTag + ' passen ' + s.tageNachher + ' Tage genau.');
        console.log('          Capital liefert die Historie unbereinigt. Der Bestand wird UMGERECHNET statt verworfen - das haelt die Tiefe.');
      } else {
        fremd = true;
        if (!fremdBelegt) fremdBelegt = { woher: iv, median: ab.median, n: ab.n };
        console.log('  Urteil: FREMD - Median-Kursabweichung ' + (ab.median * 100).toFixed(2) + ' % auf ' + ab.n +
          ' gemeinsamen Kerzen, und kein sauberer Split dahinter. Der Bestand wird VERWORFEN.');
      }
    } else {
      console.log('  Urteil: passt (Median-Abweichung ' + (ab.median * 100).toFixed(3) + ' % auf ' + ab.n + ' Kerzen).');
      if (erbeSplit()) { split = splitBelegt; meldeErbe(); }
      else console.log('          Es wird GEMISCHT.');
    }

    const basis = split ? splitKorrigiert(alt, split.faktor, split.abMs) : alt;
    const neu = fremd
      ? A.kappeTage(frisch, A.fensterFuer(iv))
      : A.kappeTage(A.ohneStempel(A.mischeBars(basis, frisch), IV[iv].barMin), A.fensterFuer(iv));
    const tN = tage(neu);
    console.log('  Ergebnis: ' + String(neu.length).padStart(6) + ' Kerzen, ' + String(tN.length).padStart(3) + ' Tage' +
      (tN.length ? '  ' + tN[0] + ' .. ' + tN[tN.length - 1] : '') +
      '   Luecken ' + luecken(alt, step) + ' -> ' + luecken(neu, step));
    if (fremd) {
      const verloren = tAlt.filter(function (d) { return tN.indexOf(d) === -1; });
      bilanz.ersetzt++;
      console.log('  Verworfen: ' + alt.length + ' fremde Kerzen' +
        (verloren.length ? ', darunter ' + verloren.length + ' Tage ohne Yahoo-Ersatz (' + verloren[0] + ' .. ' + verloren[verloren.length - 1] + ')' : ''));
    } else if (split) {
      const betroffen = alt.filter(function (b) { return b[0] < split.abMs; }).length;
      bilanz.umgerechnet++;
      console.log('  Umgerechnet: ' + betroffen + ' Kerzen vor ' + split.abTag + ' durch ' + split.faktor.toFixed(4) +
        ' geteilt (Volumen unveraendert - Capital-Ticks sind keine Stueckzahlen).');
    } else { bilanz.gemischt++; }

    if (SCHREIBEN) {
      /* Eine leere Reihe ist normalerweise ein Zeichen, dass etwas schiefging - ausser
       * beim geerbten Fremdbefund: dort IST die ehrliche Antwort "es gibt hier nichts".
       * Die Reihe bleibt als leere Datei stehen (die Sicherung hat den alten Inhalt),
       * damit der Wert aus den Messungen faellt, statt sie mit fremden Kursen zu fuettern. */
      if (neu.length < 2 && !fremdGeerbt) { console.log('  NICHT geschrieben: das Ergebnis waere leer.'); console.log(''); continue; }
      if (neu.length < 2) console.log('  Die Reihe wird GELEERT - fuer diesen Wert gibt Yahoo auf ' + iv + ' nichts her.');
      // Race mit der laufenden App: hat sie die Datei zwischenzeitlich geflusht,
      // waere unsere Fassung veraltet - dann lieber ueberspringen.
      if (da) {
        let jetzt;
        try { jetzt = fs.statSync(datei).mtimeMs; } catch (e) { jetzt = da.mtime; }
        if (jetzt !== da.mtime) {
          bilanz.kollision.push(path.basename(datei));
          console.log('  NICHT geschrieben: die App hat die Datei waehrenddessen angefasst.');
          console.log('');
          continue;
        }
        sichere(datei);
      }
      const wertNeu = { series: A.schlank(neu), updatedAt: Date.now() };
      // capBereiche kennzeichnen CFD-Kerzen. In einer ersetzten Reihe steht keine
      // einzige mehr - die Kennzeichnung waere dann schlicht falsch.
      if (!fremd && da && da.st.capBereiche && da.st.capBereiche.length) wertNeu.capBereiche = da.st.capBereiche;
      const tmp = datei + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(wertNeu));
      fs.renameSync(tmp, datei);
      bilanz.geschrieben++;
      console.log('  geschrieben.');
    }
    console.log('');
  }

  if (EPIC_LOESCHEN) {
    const ep = path.join(STORE, 'cap_epics.json');
    const d = lies(ep);
    if (d && d.st && d.st[sym]) {
      console.log('cap_epics: ' + sym + ' -> ' + d.st[sym] + (SCHREIBEN ? '   wird entfernt.' : '   wuerde entfernt (Trockenlauf).'));
      if (SCHREIBEN) {
        sichere(ep);
        delete d.st[sym];
        fs.writeFileSync(ep + '.tmp', JSON.stringify(d.st));
        fs.renameSync(ep + '.tmp', ep);
      }
    } else { console.log('cap_epics: kein Eintrag fuer ' + sym + '.'); }
    console.log('');
  }

  console.log('---------------------------------------------------------------');
  console.log('Reihen ersetzt (fremd):  ' + bilanz.ersetzt);
  console.log('Reihen split-korrigiert: ' + bilanz.umgerechnet);
  console.log('Reihen gemischt:         ' + bilanz.gemischt);
  console.log('Dateien geschrieben:     ' + bilanz.geschrieben + (SCHREIBEN ? '' : '  (Trockenlauf)'));
  if (bilanz.kollision.length) {
    console.log('Uebersprungen, weil die App dazwischengeschrieben hat: ' + bilanz.kollision.join(', '));
    console.log('   -> App beenden und den Lauf wiederholen.');
  }
  if (bilanz.fehler.length) { console.log('Fehler:'); bilanz.fehler.forEach(function (f) { console.log('   ' + f); }); }
  if (bilanz.ersetzt && !EPIC_LOESCHEN) {
    console.log('');
    console.log('ACHTUNG: cap_epics.json zeigt ' + sym + ' weiterhin auf das Capital-Epic, das die');
    console.log('fremden Kerzen geliefert hat. Der naechste Backfill fuellt sie wieder ein.');
    console.log('   -> Lauf mit --epic-loeschen wiederholen und CapAPI.epicFor absichern.');
  }
}

async function main() {
  if (!fs.existsSync(STORE)) { console.error('Store nicht gefunden: ' + STORE); process.exit(1); }
  if (ALLE) return pruefeAlle();
  return reparieren(SYMBOL);
}

main();
