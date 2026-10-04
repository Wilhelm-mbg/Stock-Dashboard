'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026): Kleinsttests fuer den Lader kurse.js.
 *
 * LADER: kurse.js (Stand 61dca2c) - zerlege(text, o) und baueLader(api, warte).hole/holeRoh/holeViele.
 * kurse.js speichert selbst nichts; was es liefert, legen die Aufrufer ab. Die Tests laufen deshalb
 * mit dem ECHTEN Lader (baueLader auf einer zaehlenden Attrappe von api.fetchText, die nachgebaute
 * Yahoo-Antworten liefert) bis in die Aufrufer, die ein Buch speisen:
 *   mittelfrist.js ladeUniversum -> mf_tagesdaten / mf_bezug / mf_ereignisse (Speicher-Attrappe)
 *   mfdepot.js takt -> eroeffnung() -> Kaeufe des Momentum-Buchs (d.mfBuch)
 *   mfhandel.js faelligkeit / reihenendeAusbuchen / schluesseAm auf dem abgelegten Bestand.
 * Die Fenster-Module laufen in H.sandbox (vm) auf fester Uhr; kein Modul schreibt auf die Platte
 * (Speicher ist eine Attrappe im Arbeitsspeicher), es gibt also keinen Zielordner zu pruefen.
 *
 * STOERUNGEN: S1 (KU-1), S2 (KU-2, KU-4, KU-5), S3+S8 (KU-3), S9 (KU-6), S6 (KU-7, KU-8), S7 (KU-9),
 * S4 (KU-10), S11 + Kurs 0/negativ + Hoch<Tief (KU-11), S12 (KU-12), meta.symbol (KU-13),
 * doppelte/unsortierte Stempel (KU-14). S5, S10 treffen kurse.js nicht (Bericht kurse.md).
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/lader-stoerungen/kurse.test.js          alle KU-Tests
 *   node pruefberichte/lader-stoerungen/kurse.test.js KU-3     nur KU-3
 * Bericht: pruefberichte/lader-stoerungen/kurse.md. Alles Simulation. Keine Anlageberatung.
 */
var H = require('./hilfen.js');   /* zuerst: Netz-, Schreibsperre, Datenordner */
var K = H.lade('kurse.js');
var MH = H.lade('mfhandel.js');
var Ms = H.lade('massstab.js');
var MOM = H.lade('momentum.js');
var LIQ = H.lade('liquide.js');

/* ---------------- Kalender (New York, ohne Feiertage) ---------------- */
function nSonntag(y, m, n) { var w = new Date(Date.UTC(y, m, 1)).getUTCDay(); return (w === 0 ? 1 : 8 - w) + 7 * (n - 1); }
/** US-Sommerzeit: zweiter Sonntag im Maerz bis erster Sonntag im November. */
function sommer(y, m, d) { var t = Date.UTC(y, m, d); return t >= Date.UTC(y, 2, nSonntag(y, 2, 2)) && t < Date.UTC(y, 10, nSonntag(y, 10, 1)); }
/** Zeitstempel (ms UTC) der Uhrzeit hh:mm:ss in New York am Tag 'JJJJ-MM-TT'. */
function ny(tag, hh, mm, ss) {
  var y = +tag.slice(0, 4), m = +tag.slice(5, 7) - 1, d = +tag.slice(8, 10);
  return Date.UTC(y, m, d, hh + (sommer(y, m, d) ? 4 : 5), mm || 0, ss || 0);
}
function tagPlus(tag, n) { return new Date(Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10); }
function werktag(tag) { var w = new Date(tag + 'T12:00:00Z').getUTCDay(); return w !== 0 && w !== 6; }
/** n Werktage, der letzte ist endTag. */
function werktageBis(endTag, n) { var aus = [], t = endTag; while (aus.length < n) { if (werktag(t)) aus.unshift(t); t = tagPlus(t, -1); } return aus; }
/** Werktage strikt nach a bis einschliesslich b. */
function werktageZwischen(a, b) { var aus = []; for (var t = tagPlus(a, 1); t <= b; t = tagPlus(t, 1)) if (werktag(t)) aus.push(t); return aus; }
/** Tagesbalken wie bei Yahoo: Stempel der Eroeffnung (09:30 New York). */
function stempel(tag) { return ny(tag, 9, 30); }

/* ---------------- Kunstmarkt ---------------- */
function universum() {
  var src = H.quelle('mittelfrist.js');
  var m = /var UNIVERSUM = \(\s*([\s\S]*?)\s*\)\.split/.exec(src);
  var text = m[1].split('\n').map(function (z) { var q = /'([^']*)'/.exec(z); return q ? q[1] : ''; }).join('');
  return text.split(/\s+/).filter(Boolean);
}
var NAMEN = universum();
/** Kursweg mit fester Staerke Kurs(i-21)/Kurs(i-252)-1 (wie live-gegen-messung-momentum.test.js). */
function kursweg(n, staerke) { var aus = []; for (var j = 0; j < n; j++) aus.push(100 * Math.pow(1 + staerke, (j - (n - 1 - 21)) / 231)); return aus; }
/** Bestand-Zeilen [t, schluss, stueck, adjclose] je Wert, Staerken als feste Permutation. 3 Mio Stueck = liquide. */
function kunstmarkt(tage) {
  var ts = tage.map(stempel), roh = {};
  NAMEN.forEach(function (s, k) {
    var w = kursweg(ts.length, 0.05 + 0.004 * ((k * 37) % NAMEN.length));
    roh[s] = ts.map(function (t, j) { return [t, w[j], 3e6, w[j]]; });
  });
  var spy = ts.map(function (t, j) { return [t, 400 + j * 0.1, 8e7, 400 + j * 0.1]; });
  return { tage: tage, ts: ts, roh: roh, spy: spy };
}
/** Yahoo-Kerzen [tSek, o, h, l, c, v, adj] aus Bestand-Zeilen. */
function kerzenAus(zeilen) { return zeilen.map(function (r) { var c = r[1]; return [r[0] / 1000, c * 0.998, c * 1.01, c * 0.99, c, r[2], r[3] != null ? r[3] : c]; }); }
function antwortText(sym, kerzen, o) { return H.yahooChart(kerzen, Object.assign({ sym: sym, gmtoffset: -18000 }, o || {})); }
/** Die Quote-Stempel-Kerze: flach o=h=l=c, Umsatz 0. */
function stempelKerze(tMs, kurs) { return [tMs / 1000, kurs, kurs, kurs, kurs, 0, kurs]; }

/* ---------------- Attrappen ---------------- */
/** api.fetchText-Attrappe: antwort(sym, vonMs, bisMs) -> Text (HTTP 200) | {ok,status,body} | null (404). Zaehlt je Symbol. */
function attrappe(antwort) {
  var z = { n: 0, je: {}, urls: [] };
  z.api = {
    fetchText: async function (u) {
      z.n++; z.urls.push(u);
      var sym = decodeURIComponent(/\/chart\/([^?]+)\?/.exec(u)[1]);
      z.je[sym] = (z.je[sym] || 0) + 1;
      var p1 = /period1=(\d+)/.exec(u), p2 = /period2=(\d+)/.exec(u);
      var r = antwort(sym, p1 ? Number(p1[1]) * 1000 : null, p2 ? Number(p2[1]) * 1000 : null);
      if (r == null) return { ok: false, status: 404, body: '' };
      return typeof r === 'string' ? { ok: true, status: 200, body: r } : r;
    }
  };
  return z;
}
/** window.Kurse wie im Fenster (kurse.js Z. 305-312): baueLader + zerlege/reihe/kursOk/ereignisseAb. */
function kurseAus(api) {
  var L = K.baueLader(api, function () { return Promise.resolve(); });
  L.zerlege = K.zerlege; L.reihe = K.reihe; L.kursOk = K.kursOk; L.ereignisseAb = K.ereignisseAb;
  return L;
}
function speicher(anfang) {
  var s = anfang || {};
  function kopie(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  return { daten: s, api: { storeGet: async function (n) { return kopie(s[n]); }, storeSet: async function (n, v) { s[n] = kopie(v); return { ok: true }; } } };
}
/** Bestand ablegen wie mittelfrist.js tagesdatenSchreiben (Teile, mf_ereignisse, mf_bezug, Index zuletzt). */
function tagesdatenAblegen(st, roh, at, spy) {
  var syms = Object.keys(roh).sort(), teile = Math.max(1, Math.ceil(syms.length / 25));
  for (var t = 0; t < teile; t++) {
    var stueck = {};
    syms.slice(t * 25, (t + 1) * 25).forEach(function (s) { stueck[s] = roh[s]; });
    st.daten['mf_tagesdaten_teil_' + t] = { roh: stueck };
  }
  st.daten.mf_ereignisse = { at: at, sym: {} };
  st.daten.mf_bezug = { at: at, sym: 'SPY', reihe: spy };
  st.daten.mf_tagesdaten_index = { at: at, weg: [], teile: teile };
}
var STATUS = [];
var U_ATTRAPPE = {
  statuszeile: function (ziel, text) { STATUS.push(String(ziel) + ': ' + text); return null; },
  esc: String, d: String, dt: String, money: String, signTxt: String, pz1: String, nf2: { format: String }
};
function mfSandbox(st, kurse, jetzt) {
  return H.sandbox(['mittelfrist.js'], { U: U_ATTRAPPE, Momentum: MOM, Liquide: LIQ, MFHandel: MH, api: st.api, Kurse: kurse }, jetzt);
}
/** Ein Ladevorgang von mittelfrist.js (ladeUniversum) mit dem echten Kurs-Lader auf nachgebauten Antworten. */
async function ladeLauf(jetzt, antwort, vorher) {
  /* Auch das globale Date (Node-Module wie kurse.js/mfhandel.js) steht auf jetzt - nie die echte Uhr. */
  return H.mitUhr(jetzt, async function () {
    var st = speicher({});
    if (vorher) vorher(st);
    var z = attrappe(antwort);
    var mf = mfSandbox(st, kurseAus(z.api), jetzt);
    STATUS = [];
    await mf.MF.ladeUniversum();
    var g = await mf.MF.tagesdatenLesen();
    return { st: st, z: z, g: g, status: STATUS.slice() };
  });
}
function buchMit(positionen, letztesT) {
  return { name: 'momentum', start: 100000, cash: 0, positionen: positionen, trades: [], angelegt: letztesT - 30 * 86400000,
    letztesRebalanceT: letztesT, konfig: MH.buchKonfig(), konfigSeit: letztesT, liquideSeit: letztesT, korbVerlauf: [] };
}
function mfdepotSandbox(st, d, MF, kurse, jetzt) {
  var karte = { innerHTML: '' };
  var win = H.sandbox(['mfdepot.js'], {
    U: U_ATTRAPPE, api: st.api, MF: MF, MFHandel: MH, Massstab: Ms, __el: { buchMomentumKopf: karte }, Kurse: kurse,
    __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); }
  }, jetzt);
  win.__karte = karte;
  return win;
}
/** Der Takt des Momentum-Buchs (mfdepot.js) mit faelliger Umschichtung: Bestand bis stichtag, geladen um standAt;
 *  heute(sym, letzterSchluss) liefert die Yahoo-Kerzen fuer den Abruf von eroeffnung() (period1 = 00:00 New York). */
async function umschichtLauf(jetzt, stichtag, standAt, heute) {
  return H.mitUhr(jetzt, function () { return umschichtLaufUhr(jetzt, stichtag, standAt, heute); });
}
async function umschichtLaufUhr(jetzt, stichtag, standAt, heute) {
  var m = kunstmarkt(werktageBis(stichtag, 300));
  var st = speicher({ drift_markt: { at: jetzt - 3600000, reihe: m.spy.map(function (b) { return [b[0], b[3]]; }) } });
  tagesdatenAblegen(st, m.roh, standAt, m.spy);
  var d = { momentumAn: true, mfBuch: buchMit([], m.ts[m.ts.length - 80]), mfVerlauf: [] };
  d.mfBuch.cash = 100000;
  var z = attrappe(function (sym, von) {
    var zeilen = sym === 'SPY' ? m.spy : m.roh[sym];
    if (!zeilen || von == null) return null;
    return antwortText(sym, heute(sym, zeilen[zeilen.length - 1][1]));
  });
  var mf = mfSandbox(st, kurseAus(attrappe(function () { return null; }).api), jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, kurseAus(z.api), jetzt);
  STATUS = [];
  await dep.MFDepot.takt();
  var fehler = STATUS.filter(function (t) { return /Fehler/.test(t); });
  if (fehler.length) throw new Error('Takt meldet Fehler: ' + fehler.join(' | '));
  return { d: d, z: z, m: m, karte: dep.__karte.innerHTML };
}
/** Positionen, deren Einstand Kurs x 1,002 (20 Bp Kauf) fuer den Kurs kursVon(sym) ist. */
function gekauftZu(d, kursVon) { return d.mfBuch.positionen.filter(function (p) { return Math.abs(p.einstand - kursVon(p.sym) * 1.002) < 1e-6; }); }
function tageIn(reihe, tag) { return (reihe || []).filter(function (b) { return MH.nyTag(b[0]) === tag; }).length; }
function zahl(x, n) { return Number(x).toFixed(n == null ? 2 : n).replace('.', ','); }

/* ---------------- Die Tests ---------------- */
var TESTS = [];

/* KU-1 - S1: HTTP 200 mit leerem Inhalt (vier Formen, je zwei Werte). Bestand vom Montag liegt, der Dienstag wird
 * nachgeladen. Soll (aus der Stoerung): "leer" heisst nicht "gibt es nicht" - die acht Werte behalten ihre alte Reihe
 * unveraendert, stehen auf weg, nichts wird fortgeschrieben oder gekuerzt. */
TESTS.push({
  id: 'KU-1', stoerung: 'S1 HTTP 200 leer (result null / ohne timestamp / leerer Koerper / result [])', bewertung: '-',
  lauf: async function (H) {
    var alt = kunstmarkt(werktageBis('2026-11-23', 300)), neu = kunstmarkt(werktageBis('2026-11-24', 300));
    var formen = [
      ['result null', '{"chart":{"result":null,"error":null}}'],
      ['ohne timestamp', JSON.stringify({ chart: { result: [{ meta: { symbol: 'X', currency: 'USD' }, indicators: { quote: [{}] } }], error: null } })],
      ['leerer Koerper', ''],
      ['result []', '{"chart":{"result":[],"error":null}}']
    ];
    var leer = {}, leerSyms = NAMEN.slice(40, 48);
    leerSyms.forEach(function (s, i) { leer[s] = formen[i % 4][1]; });
    var r = await ladeLauf(ny('2026-11-24', 16, 30), function (sym) {
      if (leer[sym] != null) return leer[sym];
      return antwortText(sym, kerzenAus(sym === 'SPY' ? neu.spy : neu.roh[sym]));
    }, function (st) { tagesdatenAblegen(st, alt.roh, ny('2026-11-23', 16, 20), alt.spy); });
    /* Positivkontrolle: jede leere Form wurde abgerufen und vom echten zerlege() als leer gelesen */
    H.betreten(leerSyms.every(function (s) { return r.z.je[s] >= 1; }), 'leere Antworten nie abgerufen');
    var zl = formen.map(function (f) { var x = K.zerlege(f[1], { bereinigt: true, mitRoh: true }); return x === null ? 'null' : 'bars ' + x.bars.length; });
    H.betreten(zl.every(function (x) { return x === 'null' || x === 'bars 0'; }), 'zerlege las die Formen nicht als leer: ' + zl.join(','));
    var unveraendert = leerSyms.filter(function (s) { return JSON.stringify(r.g.roh[s]) === JSON.stringify(alt.roh[s]); });
    var aufWeg = leerSyms.filter(function (s) { return r.g.weg.indexOf(s) >= 0; });
    var andereNeu = NAMEN.filter(function (s) { return !leer[s] && r.g.roh[s] && tageIn(r.g.roh[s], '2026-11-24') === 1; }).length;
    var behaltenGemeldet = r.status.some(function (t) { return /alten Reihe behalten/.test(t) && leerSyms.every(function (s) { return t.indexOf(s) >= 0; }); });
    var ok = unveraendert.length === 8 && aufWeg.length === 8 && andereNeu === NAMEN.length - 8 && behaltenGemeldet;
    return { abweichung: !ok, text: '8 Werte mit HTTP 200 ohne Kerzen (' + formen.map(function (f, i) { return f[0] + ' -> ' + zl[i]; }).join(', ') +
      '): ' + unveraendert.length + '/8 behalten ihre alte Reihe unveraendert, ' + aufWeg.length + '/8 auf weg, ' + andereNeu + ' andere Werte mit Dienstag; ' +
      'Statuszeile nennt sie "mit ihrer alten Reihe behalten": ' + (behaltenGemeldet ? 'ja' : 'nein') + '. hole() liefert fuer "result null" dasselbe null wie fuer ' +
      'einen Netzfehler (kurse.js:' + H.zeileVon('kurse.js', 'if (!res || !res.ok) return null;') + ', :' + H.zeileVon('kurse.js', 'if (!r) return null;') +
      ') - der Aufrufer behandelt beides gleich (mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'if (!kd || !kd.bars || !kd.roh) return null;') + ').' };
  }
});

/* KU-2 - S2: Quote-Stempel-Kerze in der Tagesantwort nach dem Schluss (Di 24.11.2026 16:30 New York): der Tagesbalken
 * Di (Stempel 09:30) UND dahinter die flache Kerze Di 16:00 (o=h=l=c, Umsatz 0). Soll: ein Balken je Handelstag im
 * Bestand (die Stempel-Kerze ist kein Handelstag). Folge im Buch: die Faelligkeit zaehlt Balken der SPY-Reihe
 * (mfhandel.js balkenNach) - ein doppelter Tag macht die Umschichtung einen Handelstag zu frueh faellig. */
TESTS.push({
  id: 'KU-2', stoerung: 'S2 Quote-Stempel-Kerze hinter dem Tagesbalken (nach Schluss)', bewertung: 'A',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-24', 300)), tStempel = ny('2026-11-24', 16, 0);
    function antwort(mitStempel) {
      return function (sym) {
        var z = sym === 'SPY' ? m.spy : m.roh[sym]; if (!z) return null;
        var k = kerzenAus(z); if (mitStempel) k.push(stempelKerze(tStempel, z[z.length - 1][1]));
        return antwortText(sym, k);
      };
    }
    var jetzt = ny('2026-11-24', 16, 30);
    var x = await ladeLauf(jetzt, antwort(true)), gp = await ladeLauf(jetzt, antwort(false));
    H.betreten(x.z.je.SPY >= 1 && x.g && x.g.bezug && gp.g && gp.g.bezug, 'Ladevorgang lief nicht bis zum Bestand');
    var probe = K.zerlege(antwort(true)('SPY'), { bereinigt: true, mitRoh: true, von: 0, bis: jetzt });
    H.betreten(probe.bars.length === 301 && probe.bars[300][0] === tStempel, 'Stempel-Kerze kam nicht durch zerlege');
    var dWert = tageIn(x.g.roh[NAMEN[0]], '2026-11-24'), dSpy = tageIn(x.g.bezug.reihe, '2026-11-24');
    /* Faelligkeit am Mittwoch 10:00 (Bestand gilt noch als frisch): letzte Ausfuehrung so, dass sauber 61 Balken liegen */
    var mi = ny('2026-11-25', 10, 0), sauber = gp.g.bezug.reihe, tagJ = MH.nyTag(sauber[sauber.length - 62][0]);
    var fS = MH.faelligkeit(sauber, tagJ, 63, mi), fX = MH.faelligkeit(x.g.bezug.reihe, tagJ, 63, mi);
    var frisch = MH.bestandFrisch(x.g.at, mi);
    var ok = dWert === 1 && dSpy === 1 && fX.faellig === fS.faellig;
    return { abweichung: !ok, text: 'Abruf Di 16:30 NY mit Stempel-Kerze Di 16:00 (flach, Umsatz 0): Bestand fuehrt den 24.11. ' + dWert + 'x (' + NAMEN[0] +
      ') und in mf_bezug (SPY) ' + dSpy + 'x (Soll 1); Bestand am Mi 10:00 frisch: ' + frisch + ' -> Faelligkeit nach letzter Ausfuehrung ' + tagJ +
      ': ' + fX.tageSeit + ' Balken, faellig=' + fX.faellig + ' (ohne Stempel-Kerze ' + fS.tageSeit + ', faellig=' + fS.faellig + '). Weg: kurse.js:' +
      H.zeileVon('kurse.js', 'bars.push([ts[i] * 1000, c, vo, hi, lo, op]);') + ' -> mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') +
      ' (ohneLaufendenBalken laesst nach 16:15 alles durch, mfhandel.js:' + H.zeileVon('mfhandel.js', 'if (nowMs >= nyZeit(heute, SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1])) return reihe;') +
      ') -> mfhandel.js:' + H.zeileVon('mfhandel.js', 'r.tageSeit = balkenNach(spyReihe, letzteAusfuehrungTag, heute);') + '.' };
  }
});

/* KU-3 - S3 + S8: laufender Tagesbalken waehrend der Sitzung, am ersten Montag nach der Umstellung auf Winterzeit
 * (Mo 02.11.2026 12:00 New York). Freitag traegt den Stempel 13:30 UTC, der laufende Montag 14:30 UTC, meta.gmtoffset
 * ist schon -18000. Soll: der laufende Balken kommt nicht in den Bestand; die fertigen Stempel bleiben unverschoben. */
TESTS.push({
  id: 'KU-3', stoerung: 'S3 laufender Tagesbalken + S8 Zeitumstellung', bewertung: '-',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-10-30', 300)), tMo = stempel('2026-11-02'), tFr = stempel('2026-10-30');
    var jetzt = ny('2026-11-02', 12, 0);
    function antwort(sym) {
      var z = sym === 'SPY' ? m.spy : m.roh[sym]; if (!z) return null;
      var k = kerzenAus(z), c = z[z.length - 1][1] * 1.02;
      k.push([tMo / 1000, c * 0.99, c * 1.005, c * 0.985, c, 1e6, c]);           // laufend: Kurs von jetzt, Teilumsatz
      return antwortText(sym, k, { gmtoffset: -18000 });
    }
    var r = await ladeLauf(jetzt, antwort);
    var probe = K.zerlege(antwort('SPY'), { bereinigt: true, von: 0, bis: jetzt });
    H.betreten(r.z.je.SPY >= 1 && probe.bars[probe.bars.length - 1][0] === tMo && r.g && r.g.bezug, 'laufender Balken kam nicht beim Lader an');
    var w = r.g.roh[NAMEN[0]], letzter = w[w.length - 1][0], spyLetzter = r.g.bezug.reihe[r.g.bezug.reihe.length - 1][0];
    var ok = letzter === tFr && spyLetzter === tFr && tageIn(w, '2026-11-02') === 0 && new Date(tFr).getUTCHours() === 13 && new Date(tMo).getUTCHours() === 14;
    return { abweichung: !ok, text: 'Abruf Mo 02.11. 12:00 NY (erster Wintertag, laufender Balken 14:30 UTC): letzter Balken im Bestand ' +
      new Date(letzter).toISOString().slice(0, 16) + ' (' + NAMEN[0] + '), SPY ' + new Date(spyLetzter).toISOString().slice(0, 16) +
      ' (Soll: Fr 30.10. 13:30 UTC, unverschoben); zerlege rechnet nicht mit gmtoffset (Stempel absolut, kurse.js:' +
      H.zeileVon('kurse.js', 'bars.push([ts[i] * 1000, c, vo, hi, lo, op]);') + '), den laufenden Balken schneidet mittelfrist.js:' +
      H.zeileVon('mittelfrist.js', 'reihe = window.MFHandel.ohneLaufendenBalken(reihe, Date.now());') + ' (New-Yorker Tag, nicht UTC).' };
  }
});

/* KU-4 - S2 am Ausfuehrungskurs: Umschichtung Di 24.11.2026 10:00 New York. Die Tagesantwort (period1 = 00:00 New York)
 * traegt den laufenden Balken (Stempel 09:30, Eroeffnung O = 1,03 x Vortagesschluss, Kurs jetzt 1,05 x) und dahinter
 * die Quote-Stempel-Kerze 09:59:47 (flach 1,05 x, Umsatz 0). Soll (REGEL 1.3, mfdepot.js eroeffnung): Kauf zur
 * Eroeffnung O, nie zum laufenden Kurs. */
function heuteNormal(tag, ohneEroeffnung) {
  return function (sym, L) {
    var o = L * 1.03, c = L * 1.05, eroeff = (ohneEroeffnung && sym !== 'SPY') ? null : o;
    return [[stempel(tag) / 1000, eroeff, c * 1.002, o * 0.998, c, 5e5, c]].concat(ohneEroeffnung === 'ohneStempel' ? [] : [stempelKerze(ny(tag, 9, 59, 47), c)]);
  };
}
TESTS.push({
  id: 'KU-4', stoerung: 'S2 Stempel-Kerze am Ausfuehrungstag (laufender Balken mit Eroeffnung)', bewertung: '-',
  lauf: async function (H) {
    var r = await umschichtLauf(ny('2026-11-24', 10, 0), '2026-11-23', ny('2026-11-23', 16, 20), heuteNormal('2026-11-24', false));
    var L = function (s) { var z = r.m.roh[s]; return z[z.length - 1][1]; };
    var pos = r.d.mfBuch.positionen;
    H.betreten(r.z.je.SPY >= 1 && pos.length > 0, 'eroeffnung() nie gerufen oder nichts gekauft');
    var zurO = gekauftZu(r.d, function (s) { return L(s) * 1.03; }), zurC = gekauftZu(r.d, function (s) { return L(s) * 1.05; });
    return { abweichung: !(zurO.length === pos.length && zurC.length === 0), text: pos.length + ' Kaeufe des Momentum-Buchs: ' + zurO.length + ' zur Eroeffnung O, ' +
      zurC.length + ' zum Kurs der Stempel-Kerze (Soll: alle zu O). eroeffnung() nimmt den FRUEHESTEN Balken des Tages mit Eroeffnung (mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'if (b[0] >= von && b[0] < bis && b[5] > 0 && (!best || b[0] < best[0])) best = b;') + ') - die Stempel-Kerze liegt dahinter.' };
  }
});

/* KU-5 - S2 + S11 am Ausfuehrungskurs: wie KU-4, aber der laufende Balken der Werte traegt keine Eroeffnung (open null -
 * eine null-Zelle wie bei S11). offenRoh laesst sie leer (kurse.js), damit eroeffnung() "keine Eroeffnung" sieht. Soll
 * (mfdepot.js A4: "ohne Eroeffnung null - nie der Schluss, nie der laufende Kurs"): kein Kauf, der Auftrag bleibt offen.
 * Gegenprobe ohne Stempel-Kerze. */
TESTS.push({
  id: 'KU-5', stoerung: 'S2+S11 Stempel-Kerze, laufender Balken ohne Eroeffnung', bewertung: 'A',
  lauf: async function (H) {
    var jetzt = ny('2026-11-24', 10, 0);
    var x = await umschichtLauf(jetzt, '2026-11-23', ny('2026-11-23', 16, 20), heuteNormal('2026-11-24', true));
    var gp = await umschichtLauf(jetzt, '2026-11-23', ny('2026-11-23', 16, 20), heuteNormal('2026-11-24', 'ohneStempel'));
    var L = function (s) { var z = x.m.roh[s]; return z[z.length - 1][1]; };
    H.betreten(x.z.n > 1 && gp.z.n > 1, 'eroeffnung() fuer die Werte nie gerufen');
    var probe = K.zerlege(antwortText('AAPL', heuteNormal('2026-11-24', true)('AAPL', 100)), { bereinigt: false, offenRoh: true, von: ny('2026-11-24', 0, 0), bis: jetzt });
    H.betreten(probe.bars.length === 2 && probe.bars[0][5] === null && probe.bars[1][5] === 105, 'offenRoh/Stempel-Kerze nicht wie erwartet zerlegt');
    var zurC = gekauftZu(x.d, function (s) { return L(s) * 1.05; });
    var gpOffen = gp.d.mfBuch.offen ? 'offen' : 'nicht offen';
    return { abweichung: zurC.length > 0, text: 'laufender Balken ohne Eroeffnung + Stempel-Kerze 09:59:47: ' + x.d.mfBuch.positionen.length + ' Kaeufe, davon ' + zurC.length +
      ' zum laufenden Kurs (1,05 x Vortagesschluss, der Kurs der Stempel-Kerze; Soll 0 - keine Eroeffnung bekannt). Gegenprobe ohne Stempel-Kerze: ' +
      gp.d.mfBuch.positionen.length + ' Kaeufe, Auftraege ' + gpOffen + '. Die flache Kerze traegt o = Kurs von jetzt (kurse.js:' +
      H.zeileVon('kurse.js', "var op = kursOk(ops[i]) ? ops[i] : (o.offenRoh ? null : c);") + ' behaelt ihn), eroeffnung() nimmt sie als Eroeffnung (mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'if (b[0] >= von && b[0] < bis && b[5] > 0 && (!best || b[0] < best[0])) best = b;') + ') -> MH.fuehreAus (mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'var nM = MH.fuehreAus(d.mfBuch, plan, now, 20, { kleinstAnteil: KONFIG.kleinstAnteil });') + ').' };
  }
});

/* KU-6 - S9: Boersenfeiertag (Do 26.11.2026, Thanksgiving) 10:00 New York, Umschichtung faellig. Die App fuehrt keinen
 * Kalender: "heute Handelstag?" sagt der SPY-Balken mit heutigem Datum (mfdepot.js). Die Antwort fuer heute traegt nur
 * die Quote-Stempel-Kerze mit dem Abrufzeitpunkt (09:59:47, flach = Mittwochsschluss, Umsatz 0). Soll: kein Handel am
 * Feiertag. Gegenprobe: dieselbe Kerze mit dem Stempel des letzten Schlusses (Mi 16:00) - die faellt aus dem Fenster. */
TESTS.push({
  id: 'KU-6', stoerung: 'S9 Feiertag mit Stempel-Kerze des Tages', bewertung: 'A',
  lauf: async function (H) {
    var jetzt = ny('2026-11-26', 10, 0), stand = ny('2026-11-25', 16, 20);
    var x = await umschichtLauf(jetzt, '2026-11-25', stand, function (sym, L) { return [stempelKerze(ny('2026-11-26', 9, 59, 47), L)]; });
    var gp = await umschichtLauf(jetzt, '2026-11-25', stand, function (sym, L) { return [stempelKerze(ny('2026-11-25', 16, 0), L)]; });
    H.betreten(x.z.je.SPY >= 1 && gp.z.je.SPY >= 1, 'Handelstag-Pruefung ueber SPY nie gerufen');
    var L = function (s) { var z = x.m.roh[s]; return z[z.length - 1][1]; };
    var zuL = gekauftZu(x.d, L);
    var gpGrund = /kein Handelstag/.test(gp.karte) || /keinen Tagesbalken/.test(gp.karte);
    return { abweichung: x.d.mfBuch.positionen.length > 0, text: 'Thanksgiving 10:00 NY, nur Stempel-Kerze mit heutigem Stempel: ' + x.d.mfBuch.positionen.length +
      ' Kaeufe (' + zuL.length + ' zum Mittwochsschluss als "Eroeffnung"), letzteAusfuehrungTag ' + (x.d.mfBuch.letzteAusfuehrungTag || '-') +
      ' (Soll: kein Handel). Gegenprobe Stempel Mi 16:00: ' + gp.d.mfBuch.positionen.length + ' Kaeufe, Grund auf der Karte: ' + (gpGrund ? 'ja' : 'nein') +
      '. Weg: kurse.js:' + H.zeileVon('kurse.js', 'bars = bars.filter(function (b) { return b[0] >= o.von && b[0] <= o.bis; });') +
      ' laesst die Kerze im Fenster durch -> mfdepot.js:' + H.zeileVon('mfdepot.js', "var spyF = await eroeffnung(MH, 'SPY', heute, now);") + ' (Handelstag) -> MH.fuehreAus.' };
  }
});

/** Antwort fuer einen Ladevorgang: alle Werte normal aus m, Sonderfaelle sonder[sym](zeilen) liefern den Text selbst. */
function marktAntwort(m, sonder) {
  return function (sym) {
    var z = sym === 'SPY' ? m.spy : m.roh[sym];
    if (sonder && sonder[sym]) return sonder[sym](z);
    return z ? antwortText(sym, kerzenAus(z)) : null;
  };
}
/** Ein Wert mit Ausschuettungen: adjclose liegt vor dem Ex-Tag (Index n-100) 3 % unter close. */
function mitAusschuettung(zeilen) { var n = zeilen.length; return zeilen.map(function (r, j) { return [r[0], r[1], r[2], j < n - 100 ? r[1] * 0.97 : r[1]]; }); }

/* KU-7 - S6: bereinigt verlangt, adjclose fehlt in der Antwort ganz. mittelfrist.js fragt bereinigt + mitRoh und legt
 * adjclose als vierte Spalte ab (Leser: Drift-Rechnung driftui.js, Rechnung des Mittelfrist-Tabs). Soll: eine rohe
 * Reihe wird nicht still als bereinigte abgelegt - verworfen, gekennzeichnet oder gemeldet. kurse.js setzt feld='close'. */
TESTS.push({
  id: 'KU-7', stoerung: 'S6 adjclose fehlt (bereinigt verlangt)', bewertung: 'B',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-23', 300)), sym = 'KO', echt = mitAusschuettung(m.roh[sym]);
    function ohneAdj(zeilen) { var j = JSON.parse(antwortText(sym, kerzenAus(zeilen))); delete j.chart.result[0].indicators.adjclose; return JSON.stringify(j); }
    var jetzt = ny('2026-11-23', 16, 30);
    var x = await ladeLauf(jetzt, marktAntwort(m, { KO: function () { return ohneAdj(echt); } }));
    var gp = await ladeLauf(jetzt, marktAntwort(m, { KO: function () { return antwortText(sym, kerzenAus(echt)); } }));
    var probe = K.zerlege(ohneAdj(echt), { bereinigt: true, mitRoh: true });
    H.betreten(x.z.je.KO >= 1 && probe.feld === 'close' && x.g.roh.KO && gp.g.roh.KO, 'Weg ohne adjclose nicht betreten');
    var falsch = x.g.roh.KO.filter(function (b, j) { return Math.abs(b[3] - echt[j][3]) > 1e-9; }).length;
    var gpFalsch = gp.g.roh.KO.filter(function (b, j) { return Math.abs(b[3] - echt[j][3]) > 1e-9; }).length;
    var gemeldet = x.status.some(function (t) { return /KO/.test(t); });
    return { abweichung: falsch > 0 && !gemeldet, text: 'KO ohne adjclose: zerlege meldet feld=' + probe.feld + ', abgelegt werden ' + x.g.roh.KO.length + ' Zeilen, ' + falsch +
      ' davon mit close statt adjclose in Spalte 4 (Gegenprobe mit adjclose: ' + gpFalsch + '), Statuszeile nennt KO: ' + (gemeldet ? 'ja' : 'nein') +
      '. kurse.js:' + H.zeileVon('kurse.js', "if (adj.adjclose && adj.adjclose.length) { schluss = adj.adjclose; feld = 'adjclose'; }") +
      ' faellt still auf close, kein Aufrufer liest kd.feld; mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') +
      ' -> driftui.js:' + H.zeileVon('driftui.js', 'aus[s] = g.roh[s].map(function (b) { return b.length >= 4 && b[3] > 0 ? [b[0], b[3], b[2]] : b; });') +
      ' (Drift-Rechnung, Tab) und mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'a[i] = b[3] > 0 ? b[3] : b[1]; });') + '; das Drift-BUCH liest Spalte 1.' };
  }
});

/* KU-8 - S6/S11: adjclose an zwei Tagen null, close dort gueltig (u. a. am juengsten Tag Mo 23.11.). Spalte 1 des
 * Bestands (close) handelt und bewertet das Buch. Soll: die Zeilen bleiben (close ist brauchbar), nur Spalte 4 fehlt. */
TESTS.push({
  id: 'KU-8', stoerung: 'S6 adjclose teilweise null (close gueltig)', bewertung: 'A',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-23', 300)), sym = 'KO', n = m.roh[sym].length;
    var k = kerzenAus(m.roh[sym]); k[n - 1][6] = null; k[n - 50][6] = null;
    var jetzt = ny('2026-11-23', 16, 30);
    var x = await ladeLauf(jetzt, marktAntwort(m, { KO: function () { return antwortText(sym, k); } }));
    var probe = K.zerlege(antwortText(sym, k), { bereinigt: true, mitRoh: true });
    H.betreten(x.z.je.KO >= 1 && probe.verworfen === 2 && x.g.roh.KO, 'adjclose-null-Weg nicht betreten');
    var montag = tageIn(x.g.roh.KO, '2026-11-23');
    var preis = MH.schluesseAm(x.g.roh, '2026-11-23').preise.KO, soll = m.roh[sym][n - 1][1], vortag = m.roh[sym][n - 2][1];
    return { abweichung: montag !== 1 || Math.abs(preis - soll) > 1e-9, text: 'KO mit adjclose null an 2 Tagen (close gueltig): zerlege verwirft ' + probe.verworfen +
      ' Zeilen, Bestand ' + x.g.roh.KO.length + ' statt ' + n + ' Zeilen, Mo 23.11. ' + montag + 'x; Schluss am 23.11. fuer Bewertung/Rangfolge ' + zahl(preis, 4) +
      ' (Soll close Mo ' + zahl(soll, 4) + ', geliefert wird der Vortag ' + zahl(vortag, 4) + '). kurse.js:' + H.zeileVon('kurse.js', 'if (!kursOk(c)) { verworfen++; continue; }') +
      ' prueft den BEREINIGTEN Schluss -> mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') + ' -> mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'var s = MH.schluesseAm(daten.roh, x.tag);') + ' (Tagespunkt) und MH.rohBis/momentumZiel (mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'var ziel = MH.momentumZiel(MH.rohBis(daten.roh, st.stichtag), { nowMs: st.stichtagT });') + ').' };
  }
});

/* KU-9 - S7: abgemeldete Reihe (HES) - letzter Handel Mi 11.11.2026, danach fuellt Yahoo null-Zeilen bis heute und haengt
 * die flache Quote-Stempel-Kerze (Mi 25.11. 16:00, letzter Kurs, Umsatz 0) an. Abruf Mi 25.11. 16:30 New York. Soll
 * (REGEL 1.4; Unterscheider ist, ob die Reihe aufgehoert hat, nicht die Form): eine gehaltene Position wird ausgebucht
 * (zehn Handelstage ohne Handel >= fuenf). Gegenprobe: dieselbe Antwort ohne Stempel-Kerze. */
TESTS.push({
  id: 'KU-9', stoerung: 'S7 abgemeldete Reihe mit Phantom-Kerze', bewertung: 'A',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-25', 300)), sym = 'HES', ende = '2026-11-11';
    var lebend = m.roh[sym].filter(function (r) { return r[0] <= stempel(ende); }), letzterKurs = lebend[lebend.length - 1][1];
    var nullTage = werktageZwischen(ende, '2026-11-25').map(function (t) { return [stempel(t) / 1000, null, null, null, null, null, null]; });
    function hes(mitStempel) { return function () { return antwortText(sym, kerzenAus(lebend).concat(nullTage).concat(mitStempel ? [stempelKerze(ny('2026-11-25', 16, 0), letzterKurs)] : [])); }; }
    var jetzt = ny('2026-11-25', 16, 30);
    var x = await ladeLauf(jetzt, marktAntwort(m, { HES: hes(true) })), gp = await ladeLauf(jetzt, marktAntwort(m, { HES: hes(false) }));
    H.betreten(x.z.je.HES >= 1 && x.g.roh.HES && gp.g.roh.HES && x.g.bezug, 'HES nicht geladen');
    function buch() { return { cash: 0, positionen: [{ sym: 'HES', stueck: 100, einstand: 90, seit: stempel('2026-09-01') }], trades: [] }; }
    var bx = buch(), bg = buch();
    var ax = MH.reihenendeAusbuchen(bx, x.g.roh, x.g.bezug.reihe, jetzt), ag = MH.reihenendeAusbuchen(bg, gp.g.roh, gp.g.bezug.reihe, jetzt);
    var letzter = x.g.roh.HES[x.g.roh.HES.length - 1];
    return { abweichung: ax.length === 0, text: 'HES ohne Handel seit 11.11. (10 Handelstage): letzter Balken im Bestand ' + MH.nyTag(letzter[0]) + ' (Umsatz ' + letzter[2] +
      ') -> Reihenende ' + (ax.length ? 'ausgebucht' : 'NICHT ausgebucht, Position bleibt (' + bx.positionen.length + ')') + '; Gegenprobe ohne Stempel-Kerze: ' +
      (ag.length ? 'ausgebucht zu ' + zahl(ag[0].kurs) + ' $ nach ' + ag[0].tage + ' Tagen' : 'nicht ausgebucht') + '. Jeder Abruf erneuert die Phantom-Kerze, die Reihe endet nie. ' +
      'Weg: kurse.js:' + H.zeileVon('kurse.js', 'bars.push([ts[i] * 1000, c, vo, hi, lo, op]);') + ' -> mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') +
      ' -> mfhandel.js:' + H.zeileVon('mfhandel.js', 'var letzter = r[r.length - 1], tag = nyTag(letzter[0]);') + ' (letzter Balken, Umsatz egal) via mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'MH.reihenendeAusbuchen(x[1], daten.roh, daten.bezug, now)') + '.' };
  }
});

/* KU-10 - S4: Kuerzel neu vergeben. Im Bestand (Mo 23.11.) fuehrt PSX die alte Firma (~50 $); seit dem Abruf Di 24.11.
 * liefert Yahoo unter PSX die Geschichte einer anderen Firma (~200 $, dieselben Tage, lange Reihe). Das Buch haelt
 * 100 PSX (Einstand 50 $). Soll: die Neuvergabe faellt auf (an allen 299 gemeinsamen Tagen weicht der Schluss um den
 * Faktor ~4 ab, ohne Split-Ereignis) - die alte Reihe wird nicht still ersetzt, oder es wird gemeldet. */
TESTS.push({
  id: 'KU-10', stoerung: 'S4 Kuerzel-Neuvergabe', bewertung: 'A',
  lauf: async function (H) {
    var alt = kunstmarkt(werktageBis('2026-11-23', 300)), neu = kunstmarkt(werktageBis('2026-11-24', 300)), sym = 'PSX';
    alt.roh[sym] = alt.roh[sym].map(function (r, j) { var c = 50 + 0.01 * j; return [r[0], c, 3e6, c]; });
    var fremd = neu.roh[sym].map(function (r, j) { var c = 200 + 0.02 * j; return [r[0], c, 2e6, c]; });
    var x = await ladeLauf(ny('2026-11-24', 16, 30), marktAntwort(neu, { PSX: function () { return antwortText(sym, kerzenAus(fremd)); } }),
      function (st) { tagesdatenAblegen(st, alt.roh, ny('2026-11-23', 16, 20), alt.spy); });
    H.betreten(x.z.je.PSX >= 1 && x.g.roh.PSX, 'PSX nicht nachgeladen');
    var gemeinsam = 0, abw = 0, altMap = {};
    alt.roh[sym].forEach(function (r) { altMap[r[0]] = r[1]; });
    x.g.roh.PSX.forEach(function (r) { if (altMap[r[0]] != null) { gemeinsam++; if (Math.abs(r[1] / altMap[r[0]] - 1) > 0.5) abw++; } });
    var pos = { sym: sym, stueck: 100, einstand: 50, seit: stempel('2026-09-01') };
    var preis = MH.schluesseAm(x.g.roh, '2026-11-24').preise.PSX, wert = MH.bewerte({ cash: 0, positionen: [pos] }, { PSX: preis }).wert;
    var gemeldet = x.status.some(function (t) { return /PSX/.test(t); });
    var ersetzt = abw > 0;
    return { abweichung: ersetzt && !gemeldet, text: 'PSX neu vergeben: Bestand nach dem Abruf ' + (ersetzt ? 'durch die fremde Reihe ERSETZT' : 'unveraendert') + ' (' + abw + ' von ' + gemeinsam +
      ' gemeinsamen Tagen weichen > 50 % ab), Statuszeile nennt PSX: ' + (gemeldet ? 'ja' : 'nein') + '; die Position (100 Stueck, Einstand 50 $) steht zu ' + zahl(preis) + ' $ = ' +
      zahl(wert, 0) + ' $ im Buch. kurse.js vergleicht nichts mit dem Bestand (kein Zustand), mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'else if (r) { neu[liste[i]] = r.reihe;') +
      ' ersetzt die Reihe ganz -> mfdepot.js:' + H.zeileVon('mfdepot.js', 'var s = MH.schluesseAm(daten.roh, x.tag);') + ' -> MH.bewerte (mfdepot.js:' +
      H.zeileVon('mfdepot.js', 'var bwM = d.mfBuch ? MH.bewerte({ cash: MH.bargeldAm(d.mfBuch, x.t), positionen: d.mfBuch.positionen }, s.preise) : null;') + ').' };
  }
});

/* KU-11 - S11 und Zeilenfehler in einer Tagesantwort: null-Zeile (Kursaussetzung), Schluss 0, Schluss negativ, Hoch < Tief,
 * Umsatz null bei gueltigem Kurs, Aussetzungs-Kerze (Umsatz 0, o=h=l=c = Vorkurs). Soll: unbrauchbare Schluesse verwerfen
 * UND mitzaehlen; vertauschtes Hoch/Tief richten; die Aussetzungs-Kerze behalten; "Umsatz unbekannt" (null) nicht als
 * "kein Handel" (0) ablegen - die Quelle kennt drei Zustaende (v>0 gehandelt, v=0 kein Handel, v=null keine Daten). */
TESTS.push({
  id: 'KU-11', stoerung: 'S11 null-Zeilen, Kurs 0/negativ, Hoch<Tief, Umsatz null', bewertung: 'C',
  lauf: async function (H) {
    var tage = werktageBis('2026-11-24', 8), t = tage.map(stempel);
    var k = [
      [t[0] / 1000, 100, 101, 99, 100, 1e6], [t[1] / 1000, null, null, null, null, null], [t[2] / 1000, 100, 101, 99, 0, 1e6],
      [t[3] / 1000, 100, 101, 99, -5, 1e6], [t[4] / 1000, 100, 95, 105, 100, 1e6], [t[5] / 1000, 100, 101, 99, 100.5, null],
      [t[6] / 1000, 100.5, 100.5, 100.5, 100.5, 0], [t[7] / 1000, 101, 102, 100, 101.5, 1e6]
    ];
    var z = attrappe(function () { return antwortText('TEST', k); });
    var kd = await kurseAus(z.api).hole('TEST', { von: 0, bis: ny('2026-11-24', 17, 0), interval: '1d', bereinigt: false });
    H.betreten(z.n === 1 && kd && kd.gesamt === 8, 'hole() nicht durchlaufen');
    var nach = {}; kd.bars.forEach(function (b) { nach[b[0]] = b; });
    var verwerfenOk = kd.verworfen === 3 && kd.bars.length === 5 && !nach[t[1]] && !nach[t[2]] && !nach[t[3]];
    var tauschOk = nach[t[4]] && nach[t[4]][3] === 105 && nach[t[4]][4] === 95;
    var aussetzungOk = nach[t[6]] && nach[t[6]][2] === 0 && nach[t[6]][1] === 100.5;
    var umsatzNull = nach[t[5]] ? nach[t[5]][2] : 'fehlt';
    return { abweichung: !(verwerfenOk && tauschOk && aussetzungOk && umsatzNull !== 0), text: 'verworfen ' + kd.verworfen + ' von ' + kd.gesamt + ' (null, 0, negativ) ' +
      (verwerfenOk ? 'und mitgezaehlt' : 'FALSCH') + '; Hoch<Tief ' + (tauschOk ? 'getauscht' : 'NICHT getauscht') + '; Aussetzungs-Kerze ' + (aussetzungOk ? 'behalten' : 'FEHLT') +
      '; Umsatz null wird zu ' + JSON.stringify(umsatzNull) + ' - nicht mehr von der Aussetzungs-Kerze (echte 0) und der Stempel-Kerze zu unterscheiden (kurse.js:' +
      H.zeileVon('kurse.js', "var vo = (typeof vols[i] === 'number' && isFinite(vols[i])) ? vols[i] : 0;") + '; Leser der Stueckzahl: mittelfrist.js Spalte 3 -> liquide.js Korbfilter).' };
  }
});

/* KU-12 - S12: Kapitalmassnahmen ohne Kurs. Fenster 01.09.-24.11.2026: Ausschuettung an einem Tag mit null-Zeile,
 * Split 2:1 an einem Samstag (kein Balken), Ausschuettung nur mit Schluessel (ohne date), "Split" 1:1, Betrag 0,
 * je eine Ausschuettung vor und nach dem Fenster. Soll: die echten Ereignisse ohne Balken bleiben (sie sind geschehen);
 * 1:1, Betrag 0 und Fensterfremde fallen weg; ereignisseAb schneidet an der Grenze. */
TESTS.push({
  id: 'KU-12', stoerung: 'S12 Ereignisse ohne Kurs (Wochenende, null-Zeile, ausserhalb)', bewertung: '-',
  lauf: async function (H) {
    var von = ny('2026-09-01', 0, 0), bis = ny('2026-11-24', 17, 0);
    var tage = werktageZwischen('2026-08-31', '2026-11-24'), k = kerzenAus(tage.map(function (t, j) { return [stempel(t), 50 + j * 0.1, 1e6, 50 + j * 0.1]; }));
    var iNull = 20; k[iNull] = [k[iNull][0], null, null, null, null, null, null];
    var tNull = k[iNull][0], tSa = ny('2026-10-17', 9, 30) / 1000, tKey = stempel('2026-10-05') / 1000;
    var tVor = stempel('2026-08-14') / 1000, tNach = stempel('2026-11-30') / 1000, t11 = stempel('2026-11-02') / 1000, t0 = stempel('2026-11-09') / 1000;
    var ev = { dividends: {}, splits: {} };
    ev.dividends[tNull] = { amount: 0.25, date: tNull }; ev.dividends[tKey] = { amount: 0.3 }; ev.dividends[t0] = { amount: 0, date: t0 };
    ev.dividends[tVor] = { amount: 0.2, date: tVor }; ev.dividends[tNach] = { amount: 0.2, date: tNach };
    ev.splits[tSa] = { date: tSa, numerator: 2, denominator: 1, splitRatio: '2:1' }; ev.splits[t11] = { date: t11, numerator: 1, denominator: 1, splitRatio: '1:1' };
    var z = attrappe(function () { return antwortText('TEST', k, { ereignisse: ev }); });
    var kd = await kurseAus(z.api).hole('TEST', { von: von, bis: bis, interval: '1d', bereinigt: true, mitRoh: true, ereignisse: true });
    var urlMitEreignissen = z.n === 1 && /events=div%2Csplits/.test(z.urls[0]);
    H.betreten(urlMitEreignissen && kd && kd.ereignisse, 'Ereignis-Abruf nicht betreten');
    var e = kd.ereignisse;
    var divT = e.div.map(function (d) { return d[0] / 1000; }), splT = e.split.map(function (s) { return s[0] / 1000; });
    var ok = divT.length === 2 && divT[0] === tNull && divT[1] === tKey && splT.length === 1 && splT[0] === tSa && e.split[0][1] === 2;
    var ab = K.ereignisseAb(e, stempel('2026-10-10'));
    var abOk = ab.div.length === 0 && ab.split.length === 1;
    var nullBalken = kd.bars.some(function (b) { return b[0] === tNull * 1000; });
    return { abweichung: !(ok && abOk), text: 'behalten: Ausschuettungen ' + divT.map(function (x) { return MH.nyTag(x * 1000); }).join(', ') + ' (null-Zeile - Balken im Bestand: ' +
      (nullBalken ? 'ja' : 'nein') + ' -, nur Schluessel), Split ' + splT.map(function (x) { return MH.nyTag(x * 1000); }).join(', ') + ' (Samstag); weg: 1:1, Betrag 0, vor/nach dem Fenster' +
      '; ereignisseAb(10.10.) -> ' + ab.div.length + ' Ausschuettungen, ' + ab.split.length + ' Split. ' + (ok && abOk ? 'Wie Soll' : 'ANDERS als Soll') + ' (kurse.js:' +
      H.zeileVon('kurse.js', 'function ereignisseAus(ev, o) {') + '-' + H.zeileVon('kurse.js', 'function ereignisseAb(e, abMs) {') + ').' };
  }
});

/* KU-13 - Weitere: meta.symbol passt nicht zur Anfrage. Unter PSX antwortet die Quelle mit meta.symbol 'XYZQ' und
 * dessen Kursen (~300 $). Soll: der Lader verwirft oder kennzeichnet eine Antwort fuer ein anderes Kuerzel. */
TESTS.push({
  id: 'KU-13', stoerung: 'Weitere: meta.symbol ungleich angefragt', bewertung: 'A',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-23', 300)), sym = 'PSX';
    var fremd = m.roh[sym].map(function (r, j) { var c = 300 + 0.03 * j; return [r[0], c, 1e6, c]; });
    var x = await ladeLauf(ny('2026-11-23', 16, 30), marktAntwort(m, { PSX: function () { return antwortText('XYZQ', kerzenAus(fremd)); } }));
    var kd = K.zerlege(antwortText('XYZQ', kerzenAus(fremd)), { bereinigt: true, mitRoh: true });
    H.betreten(x.z.je.PSX >= 1 && kd.meta.symbol === 'XYZQ', 'Abruf mit fremdem meta.symbol nicht betreten');
    var abgelegt = x.g.roh.PSX ? x.g.roh.PSX[x.g.roh.PSX.length - 1][1] : null;
    var gemeldet = x.status.some(function (t) { return /PSX|XYZQ/.test(t); });
    return { abweichung: abgelegt != null && !gemeldet, text: 'Antwort auf PSX mit meta.symbol XYZQ: ' + (abgelegt != null ? 'unter PSX abgelegt, letzter Schluss ' + zahl(abgelegt) + ' $' : 'verworfen') +
      ', Statuszeile: ' + (gemeldet ? 'gemeldet' : 'nichts') + '. kurse.js reicht meta nur durch (kurse.js:' + H.zeileVon('kurse.js', 'var ergebnis = { bars: bars, meta: r.meta || {}, verworfen: verworfen, gesamt: ts.length,') +
      '), hole() vergleicht nicht mit sym (kurse.js:' + H.zeileVon('kurse.js', 'return zerlege(res.body, o);') + ') -> mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') +
      ' -> Buch wie KU-10.' };
  }
});

/* KU-14 - Weitere: doppelte und unsortierte Stempel. In der Antwort fuer AAPL stehen die letzten zwei Tage vertauscht
 * (Di vor Mo) und ein Tag doppelt (gleicher Stempel, anderer Schluss). Die Leser des Bestands suchen binaer
 * (mfhandel.js indexVor: "Reihe aufsteigend"). Soll: aufsteigend und je Stempel einmal abgelegt - oder verworfen. */
TESTS.push({
  id: 'KU-14', stoerung: 'Weitere: doppelte/unsortierte Stempel', bewertung: 'A',
  lauf: async function (H) {
    var m = kunstmarkt(werktageBis('2026-11-24', 300)), sym = 'AAPL', k = kerzenAus(m.roh[sym]), n = k.length;
    var tausch = k[n - 1]; k[n - 1] = k[n - 2]; k[n - 2] = tausch;                     // Di vor Mo
    var dopp = k[n - 30].slice(); dopp[4] = dopp[4] * 1.1; k.splice(n - 29, 0, dopp);   // gleicher Stempel, anderer Schluss
    var x = await ladeLauf(ny('2026-11-24', 16, 30), marktAntwort(m, { AAPL: function () { return antwortText(sym, k); } }));
    H.betreten(x.z.je.AAPL >= 1 && x.g.roh.AAPL, 'AAPL nicht geladen');
    var r = x.g.roh.AAPL, absteigend = 0, doppelt = 0;
    for (var i = 1; i < r.length; i++) { if (r[i][0] < r[i - 1][0]) absteigend++; if (r[i][0] === r[i - 1][0]) doppelt++; }
    var preis = MH.schluesseAm(x.g.roh, '2026-11-24').preise.AAPL, soll = m.roh[sym][n - 1][1], mo = m.roh[sym][n - 2][1];
    return { abweichung: absteigend > 0 || doppelt > 0, text: 'AAPL abgelegt mit ' + absteigend + ' Ruecksprung(en) und ' + doppelt + ' doppeltem Stempel; Schluss am 24.11. fuer das Buch ' +
      zahl(preis, 4) + ' (Soll Di ' + zahl(soll, 4) + ', geliefert Mo ' + zahl(mo, 4) + '). zerlege sortiert und entdoppelt nicht (kurse.js:' + H.zeileVon('kurse.js', 'for (var i = 0; i < ts.length; i++) {') +
      '-' + H.zeileVon('kurse.js', 'bars.push([ts[i] * 1000, c, vo, hi, lo, op]);') + ') -> mittelfrist.js:' + H.zeileVon('mittelfrist.js', 'reihe.push([b[0], r[1], b[2], b[1]]);') +
      ' -> mfhandel.js:' + H.zeileVon('mfhandel.js', 'function indexVor(reihe, grenze) {') + ' (binaere Suche).' };
  }
});

module.exports = { lader: 'kurse.js', tests: TESTS };

H.allein(module);
