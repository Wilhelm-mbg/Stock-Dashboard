'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026): Kleinsttests fuer livesammler.js (Praefix LS).
 *
 * Lader: livesammler.js, Stand 61dca2c - die Live-Runde. Alle fuenf Minuten holt sie die
 * FERTIGEN Alpaca-1m-Balken (SIP, adjustment=raw) der Live-Menge, sichtet sie und gibt sie an
 * den Schreiber, den main.js hereinreicht (liveablage.anhaengen -> alpaca1m/<ORD>/_live.jsonl).
 * Dieselben Bausteine abrufplan/urlFuer/sichten/nachJahren nutzt der naechtliche Nachlauf
 * (tools/alpaca-vollsammlung.js --nachholen) fuer die Jahresdateien unter alpaca1m/.
 *
 * Stoerungen: S1 (200 leer, endloser Token), S2 (laufende Minute, Raster, Uhr vor + 403),
 * S3 (ET-Tag/-Jahr an Silvester), S4 (Kuerzel-Neuvergabe), S6 (Split-Tag: bereinigt + roh),
 * S7 (erloschene Reihen), S8 (Sommerzeit), S9 (Feiertage, Sonderschliessung), S10 (Halbtage),
 * S11 (Kursaussetzung), weitere (Fenster/fremdes Symbol, Hoch < Tief, Seitenueberlappung).
 * S5 und S12 treffen auf die Live-Runde nicht zu - Begruendung in livesammler.md.
 *
 * Alles nachgebaut: Quelle (fetch), Stempel, Kalender. Die Uhr kommt ueber das jetzt-Argument
 * der Runde (feste Zeitpunkte im Okt.-Dez. 2026), nie von Date.now. Geschrieben wird nur in
 * Tests LS-5 und LS-15 - mit der echten liveablage.js in einen H.tempOrdner (zugesichert).
 * main.js wird nur gelesen (Datei:Zeile ueber Inhaltsanker), nicht geladen.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/lader-stoerungen/livesammler.test.js          alle LS-Tests
 *   node pruefberichte/lader-stoerungen/livesammler.test.js LS-4     nur einer
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var H = require('./hilfen.js');
var LS = H.lade('livesammler.js');
var A = H.lade('alpacaarchiv.js');
var LA = H.lade('liveablage.js');

/* ---------------- Hilfen dieser Datei ---------------- */
var MIN = 60000;
/** UTC-ms fuer eine New Yorker Wanduhrzeit (ueber dieselbe Regel wie die App). */
function et(j, m, d, h, mi, s) { return A.nyNachUtc(j, m, d, h, mi) + (s || 0) * 1000; }
function iso(ms) { return new Date(ms).toISOString(); }
/** hh:mm ET - nur fuer die Texte. */
function hm(ms) {
  var p = A.nyTeile(ms);
  return (p.h < 10 ? '0' : '') + p.h + ':' + (p.min < 10 ? '0' : '') + p.min;
}
function Z(datei, anker) { return datei + ':' + H.zeileVon(datei, anker); }
function fest(ms) { return function () { return ms; }; }
/** Ein Alpaca-Balken (v2/stocks/bars). */
function balken(t, c, x) { return Object.assign({ t: iso(t), o: c, h: c + 0.2, l: c - 0.2, c: c, v: 100, n: 3, vw: c }, x || {}); }
/** Je Minute in [von, bis] ein Balken, ausser ohne(t). */
function minutenBalken(von, bis, preis, ohne) {
  var l = [];
  for (var t = von; t <= bis; t += MIN) if (!ohne || !ohne(t)) l.push(balken(t, preis));
  return l;
}
/** Kalender wie main.js ihn hereinreicht (kal.tage: { 'YYYY-MM-DD': {open, close} }). */
function kal(tage, close) {
  var k = {};
  tage.forEach(function (d) { k[d] = { open: '09:30', close: close || '16:00' }; });
  return k;
}
/** Die Teile einer Abruf-Adresse (urlFuer). */
function teile(url) {
  var o = {};
  url.split('?')[1].split('&').forEach(function (p) { var i = p.indexOf('='); o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
  return { symbole: o.symbols.split(','), start: Date.parse(o.start), ende: o.end ? Date.parse(o.end) : null, token: o.page_token || null };
}
/** Die nachgebaute Quelle: zaehlt jede Anfrage und je Symbol. antwort(teile) -> {status, body}
 *  oder ein Objekt, das als JSON mit Status 200 geht. */
function quelle(antwort) {
  var z = { n: 0, urls: [], symbole: {} };
  z.f = async function (url) {
    z.n++; z.urls.push(url);
    var t = teile(url);
    t.symbole.forEach(function (s) { z.symbole[s] = (z.symbole[s] || 0) + 1; });
    var r = antwort(t, z.n);
    return (r && typeof r.status === 'number') ? r : { status: 200, body: JSON.stringify(r) };
  };
  return z;
}
/** Eine Quelle, die je Symbol aus einer festen Reihe liefert - im angefragten Fenster, und nie
 *  juenger als rand (falls gesetzt). Symbole ohne Balken fehlen im Objekt (wie bei Alpaca). */
function markt(jeSym, rand) {
  return function (t) {
    var bars = {};
    t.symbole.forEach(function (s) {
      var bis = t.ende != null ? t.ende : Infinity;
      if (rand != null) bis = Math.min(bis, rand);
      var l = (jeSym[s] || []).filter(function (b) { var x = Date.parse(b.t); return x >= t.start && x <= bis; });
      if (l.length) bars[s] = l;
    });
    return { bars: bars, next_page_token: null };
  };
}
/** Schreib-Attrappe in der Form von liveablage.anhaengen. */
function schreiber() {
  var z = { n: 0, je: {}, jahre: [] };
  z.f = function (sym, jahr, kerzen) {
    z.n++; z.jahre.push(jahr);
    z.je[sym] = (z.je[sym] || []).concat(kerzen);
    return { ok: true, geschrieben: true, neu: kerzen.length, letzterStempel: kerzen[kerzen.length - 1][0] };
  };
  return z;
}
/** Der echte Schreibweg der App, nachgebaut wie main.js liveRunde (schreiben: reiheAus ->
 *  ordnerAus -> liveablage.anhaengen) - nur im Wegwerf-Ordner. */
function schreiberEcht(roh, heute, lzWerte, abb) {
  var ablage = { tagJe: {} };
  var z = { n: 0, args: [], pfade: {} };
  z.f = async function (sym, jahr, kerzen) {
    z.n++; z.args.push({ sym: sym, jahr: jahr, n: kerzen.length });
    var reihe = A.reiheAus(lzWerte || {}, sym);
    var pfad = LA.pfadFuer(roh, A.ordnerAus(abb || {}, reihe));
    if (!H.imTmp(pfad)) throw new Error('Schreibziel liegt nicht im Wegwerf-Ordner: ' + pfad);
    z.pfade[sym] = pfad;
    return LA.anhaengen(pfad, reihe, heute, kerzen, ablage);
  };
  return z;
}
/** MD_ALPACA_WURZEL fuer die Dauer von fn auf einen eigenen Wegwerf-Ordner. */
async function mitAlpacaWurzel(name, fn) {
  var alt = process.env.MD_ALPACA_WURZEL;
  process.env.MD_ALPACA_WURZEL = H.tempOrdner(name);
  try {
    var roh = A.rohOrdner();
    if (!H.imTmp(roh)) throw new Error('alpaca1m liegt nicht im Wegwerf-Ordner: ' + roh);
    return await fn(roh);
  } finally { process.env.MD_ALPACA_WURZEL = alt; }
}
function leereNeu() { return { tag: null, sitzung: null, je: {}, gesehen: {} }; }
function runde(o) { return LS.runde(Object.assign({ an: true, schluessel: true, leere: leereNeu() }, o)); }
/** Mehrere Runden hintereinander; der Stand je Wert wird wie in main.js (abschluss) aus
 *  erg.jeWert[sym].stempel fortgeschrieben, der Leer-Zustand bleibt ueber die Runden. */
async function runden(zeiten, o) {
  var aus = [];
  for (var i = 0; i < zeiten.length; i++) {
    var erg = await LS.runde({ werte: o.werte, jetzt: fest(zeiten[i]), an: true, schluessel: true, kalender: o.kalender,
      leere: o.leere, block: o.block, fetch: o.fetch, schreiben: o.schreiben,
      stempel: function (s) { return o.stand[s] != null ? o.stand[s] : null; } });
    Object.keys(erg.jeWert).forEach(function (s) { o.stand[s] = erg.jeWert[s].stempel; });
    aus.push(erg);
  }
  return aus;
}
/** n Zeitpunkte im Fuenf-Minuten-Takt ab von. */
function takt(von, n) { var l = []; for (var i = 0; i < n; i++) l.push(von + i * 5 * MIN); return l; }
function pruefe(liste) { return liste.filter(function (x) { return x[1] !== x[2]; }).map(function (x) { return x[0] + ' ist ' + x[1] + ' statt ' + x[2]; }); }

/* ---------------- Die Tests ---------------- */
var TAG = '2026-10-06';   /* ein gewoehnlicher Dienstag */

module.exports = { lader: 'livesammler.js', tests: [

  /* ======================= S1: 200 mit leerem Inhalt ======================= */
  { id: 'LS-1', stoerung: 'S1 HTTP 200 leer: bars {}, bars null, ohne bars, leerer Koerper; ein Symbol fehlt im Block', bewertung: '-',
    lauf: async function (H) {
      var K = kal([TAG]);
      var J = et(2026, 10, 6, 11, 0), st0 = et(2026, 10, 6, 10, 40);
      var formen = [
        ['bars {}', '{"bars":{},"next_page_token":null}'],
        ['bars null', '{"bars":null,"next_page_token":null}'],
        ['ohne bars', '{"next_page_token":null}'],
        ['leerer Koerper', '']
      ];
      var falsch = [], abrufe = 0;
      for (let i = 0; i < formen.length; i++) {
        let f = formen[i];
        let q = quelle(function () { return { status: 200, body: f[1] }; });
        let s = schreiber(), leere = leereNeu();
        let erg = await runde({ werte: ['AAPL', 'MSFT'], jetzt: fest(J), kalender: K, leere: leere,
          stempel: function () { return st0; }, fetch: q.f, schreiben: s.f });
        abrufe += q.n;
        let stempelBleibt = f[0] === 'leerer Koerper' ? (!erg.jeWert.AAPL && !erg.jeWert.MSFT)
          : (erg.jeWert.AAPL.stempel === st0 && erg.jeWert.MSFT.stempel === st0);
        let leerUnberuehrt = !leere.je.AAPL && !leere.je.MSFT;
        let gemeldet = /Quelle ohne einen einzigen Balken|unlesbar/.test(erg.fehler || '');
        if (s.n || !stempelBleibt || !leerUnberuehrt || !gemeldet) {
          falsch.push(f[0] + ' (geschrieben ' + s.n + ', Stempel bleibt ' + stempelBleibt + ', Leer ' + JSON.stringify(leere.je) + ', gemeldet ' + gemeldet + ')');
        }
      }
      /* Ein Symbol fehlt im Block: AAPL liefert, MSFT nicht - vier Runden regulaer, dann der
       * Sitzungswechsel (Runde 16:21 ET, Grenze 16:05 = nachboerslich). */
      var aapl = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 19, 59), 230);
      var q2 = quelle(markt({ AAPL: aapl }));
      var o = { werte: ['AAPL', 'MSFT'], kalender: K, leere: leereNeu(), stand: { AAPL: st0, MSFT: st0 }, fetch: q2.f, schreiben: schreiber().f };
      var r = await runden(takt(J, 4), o);
      await runden([et(2026, 10, 6, 16, 21)], o);
      var tt = teile(q2.urls[q2.urls.length - 1]);
      var einzel = pruefe([
        ['MSFT-Stempel', o.stand.MSFT === st0, true],
        ['ruht nach 3 leeren Runden', r[2].ruhend === 0 && r[3].ruhend === 1, true],
        ['nach Sitzungswechsel ab altem Stempel gefragt', tt.symbole.indexOf('MSFT') >= 0 && tt.start === st0 + MIN, true]
      ]);
      falsch = falsch.concat(einzel);
      H.betreten(abrufe >= 4 && q2.n >= 5 && o.stand.AAPL > st0, 'leere Antworten und Einzelsymbol-Runden');
      return { abweichung: falsch.length > 0,
        text: falsch.length ? 'falsch: ' + falsch.join('; ')
          : 'vier leere Formen: nichts geschrieben, Stempel bleibt, Leer-Zaehler unberuehrt, Meldung "Quelle ohne einen einzigen Balken"/"unlesbar" (' +
            Z('livesammler.js', 'var quellenLeer = rohBalken === 0;') + '); fehlendes Einzelsymbol: Stempel bleibt, ruht nach 3 Runden nur bis zum Sitzungswechsel und holt dann ab dem alten Stempel nach (' +
            Z('livesammler.js', "if (opt.sitzung !== undefined && leere.sitzung !== opt.sitzung)") + ')' };
    } },

  { id: 'LS-2', stoerung: 'S1 next_page_token ohne bars (stets derselbe Token)', bewertung: 'C',
    lauf: async function (H) {
      var K = kal([TAG]), J = et(2026, 10, 6, 11, 0);
      var msft = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 15, 59), 410);
      var q = quelle(function (t) {
        if (t.symbole.indexOf('AAPL') >= 0) return { bars: {}, next_page_token: 'IMMER-DERSELBE' };
        return markt({ MSFT: msft })(t);
      });
      /* block 1: je Wert ein Block; AAPL (juengerer Start) kommt zuerst. */
      var o = { werte: ['AAPL', 'MSFT'], kalender: K, leere: leereNeu(), block: 1, fetch: q.f, schreiben: schreiber().f,
        stand: { AAPL: et(2026, 10, 6, 10, 40), MSFT: et(2026, 10, 6, 10, 30) } };
      var r = await runden([J, J + 5 * MIN], o);
      var msftAbrufe = q.symbole.MSFT || 0;
      H.betreten(q.n >= 2 * LS.DECKEL_JE_RUNDE && r[0].bloecke === 2, 'Seitenfolge mit Token, zwei Bloecke im Plan');
      var meldung = (r[0].fehler || '') + ' ' + (r[1].fehler || '');
      var benannt = /token|Seite/i.test(meldung);
      return { abweichung: msftAbrufe === 0 && !benannt,
        text: 'leere Seite mit stets demselben next_page_token: Block AAPL verbraucht je Runde den ganzen Deckel (' + r[0].anfragen + ' + ' + r[1].anfragen +
          ' Anfragen), Block MSFT in 2 Runden ' + msftAbrufe + '-mal gefragt (Stempel steht bei ' + hm(o.stand.MSFT) + '), gemeldet nur "' + r[0].grund +
          '"; Soll: leere Seite/wiederholter Token = Quellenfehler, Block beenden, benennen, naechster Block (' +
          Z('livesammler.js', 'token = daten.next_page_token || null;') + ', ' + Z('livesammler.js', 'if (erg.anfragen >= deckel) { erg.deckel = true;') + ')' };
    } },

  /* ======================= S2: unfertige Kerze ======================= */
  { id: 'LS-3', stoerung: 'S2 laufende Minute (juenger als Grenze) und Stempel nicht auf der Minute', bewertung: '-',
    lauf: async function (H) {
      var J = et(2026, 10, 6, 11, 0), st0 = et(2026, 10, 6, 10, 40), g = LS.fertigGrenze(J);
      var l = minutenBalken(et(2026, 10, 6, 10, 41), et(2026, 10, 6, 10, 46), 230)
        .concat([balken(et(2026, 10, 6, 10, 43, 30), 231), balken(et(2026, 10, 6, 10, 42) + 500, 232)]);
      /* Die Quelle haelt sich NICHT an end - sie liefert, was sie hat. */
      var q = quelle(function () { return { bars: { AAPL: l }, next_page_token: null }; });
      var s = schreiber();
      var erg = await runde({ werte: ['AAPL'], jetzt: fest(J), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: q.f, schreiben: s.f });
      H.betreten(q.n === 1 && s.n === 1, 'Runde mit Abruf und Schreiben');
      var ist = (s.je.AAPL || []).map(function (k) { return hm(k[0]); }).join(',');
      var soll = ['10:41', '10:42', '10:43', '10:44'].join(',');
      return { abweichung: ist !== soll,
        text: 'Quelle liefert 10:45/10:46 (juenger als Grenze ' + hm(g) + ') und Stempel mit :30 s und .500 ms: geschrieben ' + ist + ' (Soll ' + soll + '), verworfen laufend ' +
          erg.verworfen.laufend + ', form ' + erg.verworfen.form + ' (' + Z('livesammler.js', 'if (k[0] > block.ende) { verworfen.laufend++; return; }') + ', ' +
          Z('alpacaarchiv.js', 'if (!isFinite(t) || t % 60000 !== 0) return null;') + ')' };
    } },

  { id: 'LS-4', stoerung: 'S2 App-Uhr 2 min vor: 403 auf end, Runde laesst end weg, angeschnittene Minute gilt als fertig', bewertung: 'B',
    lauf: async function (H) {
      /* Die Quelle (Gratisstufe) sieht 15 min zurueck: echte Zeit 11:00:30 ET -> Rand 10:45:30.
       * Gemessen (livesammler.js-Kopf zu urlFuer): end = jetzt-14 min -> 403. Ohne end liefert
       * sie bis zum Rand; die Minute 10:45 ist dort erst 30 s alt (Umsatz 7 als Merkmal).
       * ANNAHME des Nachbaus: die Quelle reicht den angeschnittenen Rand-Balken heraus. */
      var echt = et(2026, 10, 6, 11, 0, 30), rand = echt - 15 * MIN, randMin = Math.floor(rand / MIN) * MIN;
      var aapl = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 11, 0), 230);
      function antwort(t) {
        if (t.ende != null && t.ende > rand) return { status: 403, body: '{"message":"subscription does not permit querying recent SIP data"}' };
        var bis = t.ende != null ? t.ende : rand;
        var l = aapl.filter(function (b) { var x = Date.parse(b.t); return x >= t.start && x <= bis; })
          .map(function (b) { return Date.parse(b.t) === randMin ? Object.assign({}, b, { v: 7, c: 229.1 }) : b; });
        return { bars: { AAPL: l }, next_page_token: null };
      }
      var st0 = et(2026, 10, 6, 10, 40);
      var qA = quelle(antwort), sA = schreiber();
      var ergA = await runde({ werte: ['AAPL'], jetzt: fest(echt + 2 * MIN), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: qA.f, schreiben: sA.f });
      var qB = quelle(antwort), sB = schreiber();
      await runde({ werte: ['AAPL'], jetzt: fest(echt), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: qB.f, schreiben: sB.f });
      H.betreten(qA.n === 2 && ergA.ohneEnd === true && sA.n === 1, '403-Zweig mit Wiederholung ohne end');
      var angeschnitten = (sA.je.AAPL || []).filter(function (k) { return k[0] === randMin; })[0];
      var kontrolleBis = (sB.je.AAPL || []).length ? hm(sB.je.AAPL[sB.je.AAPL.length - 1][0]) : '-';
      return { abweichung: !!angeschnitten,
        text: 'end=' + hm(LS.fertigGrenze(echt + 2 * MIN)) + ' -> 403, Runde wiederholt ohne end und merkt es fuer die Sitzung (' +
          Z('livesammler.js', 'if (r.status === 403 && !ohneEnd && !ohneEndVersucht)') + ', ' + Z('main.js', 'if (erg.ohneEnd) LIVE.ohneEnd = true;') +
          '); die Grenze kommt weiter aus der falschen Uhr, also wird die Rand-Minute ' + hm(randMin) + (angeschnitten ? ' mit Umsatz ' + angeschnitten[2] + ' (angeschnitten) als fertig geschrieben' : ' verworfen') +
          ' - mit richtiger Uhr endet es bei ' + kontrolleBis + '. Soll: 403 auf end heisst Uhr/Verzug stimmt nicht - Grenze zurueckziehen, nicht end weglassen' };
    } },

  /* ======================= S3: ET-Tag / Jahr ======================= */
  { id: 'LS-5', stoerung: 'S3 Tages-/Jahresgrenze: Silvester-Nachboerse (ET 2026, UTC schon 2027)', bewertung: '-',
    lauf: async function (H) {
      return mitAlpacaWurzel('ls5', async function (roh) {
        var J = et(2026, 12, 31, 20, 16), heute = A.etTag(J);
        var f = LS.sitzungsfenster(J);
        var aapl = minutenBalken(et(2026, 12, 31, 19, 50), et(2026, 12, 31, 19, 59), 250);
        var q = quelle(markt({ AAPL: aapl }));
        var s = schreiberEcht(roh, heute, {}, {});
        var erg = await runde({ werte: ['AAPL'], jetzt: fest(J), kalender: kal(['2026-12-31']),
          stempel: function () { return et(2026, 12, 31, 19, 54); }, fetch: q.f, schreiben: s.f });
        var gelesen = LA.lesenSync(s.pfade.AAPL || LA.pfadFuer(roh, 'AAPL'), heute);
        H.betreten(q.n === 1 && s.n === 1, 'Nachlese-Runde mit echtem Schreibweg');
        var letzte = et(2026, 12, 31, 19, 59);
        var falsch = pruefe([
          ['Fenster offen (Nachlese)', f.offen && f.nachlese, true],
          ['Jahr der Jahresdatei', s.args.map(function (a) { return a.jahr; }).join(','), '2026'],
          ['Tag der Ablage', heute, '2026-12-31'],
          ['UTC-Jahr der letzten Kerze', new Date(letzte).getUTCFullYear(), 2027],
          ['Kerzen in der Ablage', gelesen.ok ? gelesen.kerzen.length : -1, 5],
          ['uebersprungen (anderer Tag)', erg.uebersprungen, 0]
        ]);
        return { abweichung: falsch.length > 0,
          text: falsch.length ? 'falsch: ' + falsch.join('; ')
            : '31.12. 19:55-19:59 ET (UTC 01.01.2027): Runde 20:16 ET laeuft als Nachlese, Kerzen gehen in Jahr 2026 und die Ablage vom 2026-12-31, nichts uebersprungen (' +
              Z('livesammler.js', 'var j = A.jahrVon(k[0]);') + ', ' + Z('alpacaarchiv.js', 'function jahrVon(ms)') + ')' };
      });
    } },

  /* ======================= S4: Kuerzel-Neuvergabe ======================= */
  { id: 'LS-6', stoerung: 'S4 Kuerzel-Neuvergabe: erloschenes Kuerzel aus Watchlist liefert wieder Minuten', bewertung: 'B',
    lauf: async function (H) {
      /* Lebenszeit-Datei (Stand 05.10.): OLDX hatte den letzten Tagesbalken am 01.07. (erloschen),
       * AAC ist wiederverwendet (laufende Reihe AAC~2). OLDX steht noch in der Watchlist. Heute
       * gehoert das Kuerzel einer neuen Firma (Kurs 12 statt zuletzt 85). */
      var lz = { stand: '2026-10-05T06:00:00.000Z', werte: {
        AAPL: { jahre: [2025, 2026], letzter: Date.UTC(2026, 9, 2) },
        OLDX: { jahre: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026], letzter: Date.UTC(2026, 6, 1) },
        AAC: { jahre: [2019, 2020], letzter: Date.UTC(2020, 5, 1), wiederverwendet: true },
        'AAC~2': { jahre: [2025, 2026], letzter: Date.UTC(2026, 9, 2) } } };
      var gef = LS.gefuehrteReihen(lz);
      var menge = LS.liveMenge({ universum: gef, watch: ['OLDX'] });
      var J = et(2026, 10, 6, 11, 0), von = et(2026, 10, 6, 9, 30), bis = et(2026, 10, 6, 10, 44);
      var q = quelle(markt({ AAPL: minutenBalken(von, bis, 230), AAC: minutenBalken(von, bis, 8), OLDX: minutenBalken(von, bis, 12) }));
      var s = schreiber();
      var erg = await runde({ werte: menge, jetzt: fest(J), kalender: kal([TAG]), stempel: function () { return et(2026, 10, 6, 9, 29); }, fetch: q.f, schreiben: s.f });
      H.betreten(q.n >= 1 && s.je.OLDX && s.je.OLDX.length > 0, 'OLDX ueber die Watchlist in der Runde');
      var kontrolle = pruefe([
        ['gefuehrte Reihen', gef.join(','), 'AAC,AAPL'],
        ['AAC -> laufende Reihe', A.reiheAus(lz.werte, 'AAC'), 'AAC~2']
      ]);
      var reihe = A.reiheAus(lz.werte, 'OLDX'), ordner = A.ordnerAus({}, reihe);
      var still = !erg.fehler && reihe === 'OLDX';
      return { abweichung: still || kontrolle.length > 0,
        text: (kontrolle.length ? 'Kontrolle falsch: ' + kontrolle.join('; ') + '; ' : 'AAC~2 und Erloeschen-Filter richtig; ') +
          'OLDX (laut Lebenszeit seit 01.07. erloschen) kommt ueber die Watchlist in die Menge (' + Z('livesammler.js', 'nimm(teile.universum); nimm(teile.watch);') +
          '), liefert ' + s.je.OLDX.length + ' Minuten zu 12 statt 85 und wird ohne Meldung an die Reihe "' + reihe + '" im Ordner ' + ordner + '/ gehaengt (' +
          Z('main.js', 'const reihe = AlpacaArchiv.reiheAus(lzWerte, sym);') + '); der Viewer fuehrt sie mit der alten Geschichte zusammen (' + Z('liveablage.js', 'function zusammenfuehren(') +
          '). Soll: erloschene Reihe, die wieder liefert = Verdacht auf Neuvergabe, nicht anhaengen oder melden' };
    } },

  /* ======================= S6: bereinigt / roh am Split-Tag ======================= */
  { id: 'LS-7', stoerung: 'S6 Split am Tag X: bereinigte Jahresdatei + rohe Tagesablage in einer Reihe', bewertung: 'B',
    lauf: async function (H) {
      var url = LS.urlFuer({ symbole: ['XYZ'], start: et(2026, 10, 6, 9, 30), ende: et(2026, 10, 6, 9, 40) }, null);
      /* Vortag in alpaca1m-bereinigt (Stand der letzten Ableitung, Skala 100), heute nach
       * einem 1:10-Split roh aus der Tagesablage (Skala 10). */
      var jahrK = minutenBalken(et(2026, 10, 5, 15, 50), et(2026, 10, 5, 15, 59), 100).map(A.kerzeAus);
      var tagK = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 9, 39), 10).map(A.kerzeAus);
      var z = LA.zusammenfuehren(jahrK, tagK);
      H.betreten(z.ausTag === 10 && z.ausJahr === 10, 'Zusammenfuehren mit Tagesablage');
      var sprung = jahrK[jahrK.length - 1][1] / tagK[0][1];
      var gewarnt = Object.keys(z).some(function (k) { return /warn|skala|sprung|split|faktor/i.test(k); });
      return { abweichung: sprung > 5 && !gewarnt && /adjustment=raw/.test(url),
        text: 'Live holt roh (' + Z('livesammler.js', "'&limit=' + SEITE + '&feed=sip&adjustment=raw&sort=asc'") + '); der 1m-Viewer nimmt alpaca1m-bereinigt, wenn es sie gibt (' +
          Z('main.js', "let datei = path.join(wurzel, 'alpaca1m-bereinigt', ord, j + '.json');") + '), und haengt die rohe Tagesablage an (' + Z('liveablage.js', 'function zusammenfuehren(') +
          '): am Split-Tag Sprung x' + sprung.toFixed(1) + ' in einer Reihe, ohne Hinweis, Etikett bleibt "alpaca-bereinigt" (' + Z('main.js', "if (!ablage) ablage = 'alpaca-roh';") +
          ') - bis die bereinigte Kopie neu abgeleitet ist. Soll: rohe Tagesablage nur an rohe Jahresdatei, oder Faktor anwenden/benennen' };
    } },

  /* ======================= S7: erloschene Reihen ======================= */
  { id: 'LS-8', stoerung: 'S7 erloschene Reihe in der Live-Menge: wird jede Runde gefragt, ruht nie', bewertung: 'C',
    lauf: async function (H) {
      /* GONE ist abgegangen, aber die Lebenszeit kennt Tagesbalken bis 02.10. (Alpaca-Tagesbalken
       * leben nach dem Abgang weiter) - so kommt sie durch den 30-Tage-Filter. Minuten liefert
       * die Quelle fuer GONE keine. Zehn aktive Werte liefern jede Minute. */
      var aktiv = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'];
      var lz = { stand: '2026-10-05T06:00:00.000Z', werte: { GONE: { jahre: [2025, 2026], letzter: Date.UTC(2026, 9, 2) } } };
      var jeSym = {};
      aktiv.forEach(function (s) {
        lz.werte[s] = { jahre: [2025, 2026], letzter: Date.UTC(2026, 9, 2) };
        jeSym[s] = minutenBalken(et(2026, 10, 6, 4, 0), et(2026, 10, 6, 19, 59), 50).concat(minutenBalken(et(2026, 10, 7, 4, 0), et(2026, 10, 7, 19, 59), 51));
      });
      var werte = LS.liveMenge({ universum: LS.gefuehrteReihen(lz) });
      var q = quelle(markt(jeSym));
      var o = { werte: werte, kalender: kal([TAG, '2026-10-07']), leere: leereNeu(), stand: {}, fetch: q.f, schreiben: schreiber().f };
      aktiv.forEach(function (s) { o.stand[s] = et(2026, 10, 6, 9, 59); });
      var abschnitte = [['regulaer', takt(et(2026, 10, 6, 10, 21), 12)], ['nach', takt(et(2026, 10, 6, 16, 21), 12)], ['vor', takt(et(2026, 10, 7, 4, 21), 12)]];
      var bericht = [], gefragtGesamt = 0, rundenGesamt = 0, anfragen = 0, leerMeldungen = 0, ruhendMax = 0;
      for (var a = 0; a < abschnitte.length; a++) {
        if (abschnitte[a][0] === 'vor') o.stand = {};          /* neuer ET-Tag: Stempel verfallen (liveablage.standFuerTag) */
        var gefragt = 0;
        for (var i = 0; i < abschnitte[a][1].length; i++) {
          var vorher = q.symbole.GONE || 0;
          var r = (await runden([abschnitte[a][1][i]], o))[0];
          if ((q.symbole.GONE || 0) > vorher) gefragt++;
          anfragen += r.anfragen; leerMeldungen += r.quellenLeer; ruhendMax = Math.max(ruhendMax, r.ruhend);
        }
        gefragtGesamt += gefragt; rundenGesamt += abschnitte[a][1].length;
        bericht.push(abschnitte[a][0] + ' ' + gefragt + '/' + abschnitte[a][1].length);
      }
      H.betreten(werte.indexOf('GONE') >= 0 && rundenGesamt === 36 && q.n > 0, 'GONE in der Menge, 36 Runden');
      return { abweichung: gefragtGesamt > 3 * LS.LEER_MAX,
        text: 'GONE gefragt in ' + bericht.join(', ') + ' Runden, ruhend nie (max ' + ruhendMax + '); ' + anfragen + ' Anfragen fuer 36 Runden, ' + leerMeldungen +
          '-mal "Quelle ohne einen einzigen Balken" als Fehler im Panel. Grund: der eigene Block von GONE ist ganz leer und zaehlt deshalb nicht (' +
          Z('livesammler.js', 'else if (!quellenLeer && (plan.zaehltLeere || plan.leere.gesehen[sym])) {') + '); Kommentar verspricht "kostet hoechstens LEER_MAX Runden" (' +
          Z('livesammler.js', 'durchrutscht, kostet hoechstens LEER_MAX Runden') + '). Soll: erloschene Reihe ruht nach LEER_MAX Runden und wird benannt' };
    } },

  /* ======================= S8: Sommerzeit ======================= */
  { id: 'LS-9', stoerung: 'S8 Sommerzeit-Wechsel 08.03.2026 / 01.11.2026: Fenster, Start, Sitzungsminuten', bewertung: '-',
    lauf: async function (H) {
      function z(ms) { var f = LS.sitzungsfenster(ms); return (f.offen ? 'offen' : 'zu') + '/' + f.zustand + (f.nachlese ? '/nachlese' : ''); }
      var K = kal(['2026-03-06', '2026-03-09', '2026-10-30', '2026-11-02']);
      var tfN = LS.tagesfenster('2026-11-02', K), tfO = LS.tagesfenster('2026-10-30', K);
      /* Feste UTC-Zahlen, unabhaengig von nyNachUtc: Maerz 9. = EDT (UTC-4), Maerz 6. = EST (UTC-5),
       * 30.10. = EDT, 02.11. = EST. */
      var falsch = pruefe([
        ['Mo 09.03. 09:46 EDT', z(Date.UTC(2026, 2, 9, 13, 46)), 'offen/regulaer'],
        ['Mo 09.03. 09:45 EDT', z(Date.UTC(2026, 2, 9, 13, 45)), 'offen/vorboerslich'],
        ['Fr 06.03. 09:46 EST', z(Date.UTC(2026, 2, 6, 14, 46)), 'offen/regulaer'],
        ['Mo 02.11. 09:46 EST', z(Date.UTC(2026, 10, 2, 14, 46)), 'offen/regulaer'],
        ['Mo 02.11. 08:46 EST', z(Date.UTC(2026, 10, 2, 13, 46)), 'offen/vorboerslich'],
        ['Mo 02.11. 04:16 EST', z(Date.UTC(2026, 10, 2, 9, 16)), 'offen/vorboerslich'],
        ['Mo 02.11. 04:15 EST', z(Date.UTC(2026, 10, 2, 9, 15)), 'zu/geschlossen'],
        ['Fr 30.10. 20:16 EDT', z(Date.UTC(2026, 9, 31, 0, 16)), 'offen/geschlossen/nachlese'],
        ['Fr 30.10. 20:22 EDT', z(Date.UTC(2026, 9, 31, 0, 22)), 'zu/geschlossen'],
        ['So 01.11. 12:00 UTC', z(Date.UTC(2026, 10, 1, 12, 0)), 'zu/geschlossen'],
        ['startFuer ohne Stempel 02.11.', LS.startFuer(null, Date.UTC(2026, 10, 2, 15, 0)), Date.UTC(2026, 10, 2, 5, 0)],
        ['startFuer ohne Stempel 09.03.', LS.startFuer(null, Date.UTC(2026, 2, 9, 15, 0)), Date.UTC(2026, 2, 9, 4, 0)],
        ['tagesfenster 02.11. auf', tfN && tfN.auf, Date.UTC(2026, 10, 2, 9, 0)],
        ['tagesfenster 02.11. zu', tfN && tfN.zu, Date.UTC(2026, 10, 3, 1, 0)],
        ['tagesfenster 30.10. zu', tfO && tfO.zu, Date.UTC(2026, 9, 31, 0, 0)],
        ['Sitzungsminuten Fr 19:59 EST -> Mo 09:00 EDT', LS.sitzungsminuten(Date.UTC(2026, 2, 7, 0, 59), Date.UTC(2026, 2, 9, 13, 0), K), 302],
        ['Sitzungsminuten Fr 19:59 EDT -> Mo 09:00 EST', LS.sitzungsminuten(Date.UTC(2026, 9, 30, 23, 59), Date.UTC(2026, 10, 2, 14, 0), K), 302],
        ['Ende nach 2 Sitzungsminuten ab Fr 19:59 EDT', LS.endeNachSitzungsminuten(Date.UTC(2026, 9, 30, 23, 59), 2, K), Date.UTC(2026, 10, 2, 9, 0)]
      ]);
      H.betreten(tfN !== null && tfO !== null, 'Kalendertage gefunden');
      return { abweichung: falsch.length > 0,
        text: falsch.length ? 'falsch: ' + falsch.join('; ')
          : '18 Pruefpunkte an beiden Wechseln (Fenster, Nachlese 20:16-20:21, startFuer Mitternacht ET, Kalenderfenster 04:00-20:00, Sitzungsminuten ueber das Wechselwochenende) stimmen - alles ueber Intl (' +
            Z('livesammler.js', 'var ny = Plan.newYork(ms);') + ', ' + Z('alpacaarchiv.js', 'function nyNachUtc(j, m, d, h, min)') + ')' };
    } },

  /* ======================= S9: Feiertage ======================= */
  { id: 'LS-10', stoerung: 'S9 Feiertage 26.11./25.12.2026 und Sonderschliessung, die nur der Quellkalender kennt', bewertung: 'C',
    lauf: async function (H) {
      /* (a) regulaere Feiertage: die Runde darf gar nicht erst fragen. */
      var K = kal(['2026-10-06', '2026-10-08', '2026-11-25', '2026-11-27']);
      K['2026-11-27'].close = '13:00';
      var qa = quelle(function () { return { bars: {}, next_page_token: null }; });
      var ra = await runde({ werte: ['AAPL'], jetzt: fest(Date.UTC(2026, 10, 26, 15, 16)), kalender: K, stempel: function () { return null; }, fetch: qa.f, schreiben: schreiber().f });
      var fW = LS.sitzungsfenster(Date.UTC(2026, 11, 25, 15, 16));
      var a = pruefe([
        ['Thanksgiving 10:16 ET: Runde', /ausserhalb der Sitzung.*kein Handelstag/.test(ra.grund || '') && qa.n === 0, true],
        ['Weihnachten 10:16 ET: Fenster', fW.offen, false],
        ['Sitzungsminuten Mi 19:59 -> Fr 09:00 ueber Thanksgiving', LS.sitzungsminuten(Date.UTC(2026, 10, 26, 0, 59), Date.UTC(2026, 10, 27, 14, 0), K), 302]
      ]);
      /* (b) Mittwoch 07.10.2026 als ausserplanmaessige Schliessung (wie 09.01.2025): der
       * Quellkalender (o.kalender) fuehrt den Tag nicht, boerse.js kennt ihn nicht. */
      var qb = quelle(function () { return { bars: {}, next_page_token: null }; });
      var rb = await runde({ werte: ['AAPL', 'MSFT'], jetzt: fest(et(2026, 10, 7, 10, 16)), kalender: K, stempel: function () { return null; }, fetch: qb.f, schreiben: schreiber().f });
      H.betreten(/ausserhalb/.test(ra.grund || '') && qb.n >= 1, 'Feiertagsrunde abgewiesen, Sondertag-Runde gelaufen');
      var b = rb.gelaufen && qb.n > 0;
      return { abweichung: a.length > 0 || b,
        text: (a.length ? 'Feiertage falsch: ' + a.join('; ') : 'Thanksgiving/Weihnachten: keine Anfrage, Sitzungsminuten ohne Feiertag (' + Z('livesammler.js', 'var laenge = Boerse.sitzungsMinuten(etMittag);') + ')') +
          '; Sonderschliessung (Tag fehlt im Quellkalender, den die Runde in der Hand hat): Runde laeuft trotzdem, ' + qb.n + ' Anfrage(n), Panel-Fehler "' + (rb.fehler || '') +
          '" - jede Runde des Tages (' + Z('livesammler.js', 'function zustandUm(ms)') + ' fragt nur boerse.js). Soll: Tag ohne Eintrag im Quellkalender = keine Sitzung' };
    } },

  /* ======================= S10: Halbtage ======================= */
  { id: 'LS-11', stoerung: 'S10 Halbtage 27.11./24.12.2026: Schluss 13:00, Nachboerse bis 17:00', bewertung: '-',
    lauf: async function (H) {
      function z(ms) { var f = LS.sitzungsfenster(ms); return (f.offen ? 'offen' : 'zu') + '/' + f.zustand + (f.nachlese ? '/nachlese' : ''); }
      var K = kal(['2026-11-27', '2026-11-30', '2026-12-24'], '16:00');
      K['2026-11-27'].close = '13:00'; K['2026-12-24'].close = '13:00';
      var tf = LS.tagesfenster('2026-11-27', K);
      var J = Date.UTC(2026, 10, 27, 18, 30);   /* 13:30 EST */
      var plan = LS.abrufplan(['AAPL'], { AAPL: Date.UTC(2026, 10, 27, 18, 0) }, J, { sitzung: LS.sitzungsfenster(J).zustand, leere: leereNeu() });
      var falsch = pruefe([
        ['27.11. 13:15 EST', z(Date.UTC(2026, 10, 27, 18, 15)), 'offen/regulaer'],
        ['27.11. 13:16 EST', z(Date.UTC(2026, 10, 27, 18, 16)), 'offen/nachboerslich'],
        ['27.11. 17:16 EST', z(Date.UTC(2026, 10, 27, 22, 16)), 'offen/geschlossen/nachlese'],
        ['27.11. 17:21 EST', z(Date.UTC(2026, 10, 27, 22, 21)), 'zu/geschlossen'],
        ['24.12. 13:16 EST', z(Date.UTC(2026, 11, 24, 18, 16)), 'offen/nachboerslich'],
        ['24.12. 17:22 EST', z(Date.UTC(2026, 11, 24, 22, 22)), 'zu/geschlossen'],
        ['tagesfenster 27.11. zu (17:00 EST)', tf && tf.zu, Date.UTC(2026, 10, 27, 22, 0)],
        ['Sitzungsminuten 27.11. 04:00-17:59', LS.sitzungsminuten(Date.UTC(2026, 10, 27, 9, 0), Date.UTC(2026, 10, 27, 22, 59), K), 780],
        ['Ende nach 2 Sitzungsminuten ab 16:59', LS.endeNachSitzungsminuten(Date.UTC(2026, 10, 27, 21, 59), 2, K), Date.UTC(2026, 10, 30, 9, 0)],
        ['Leere zaehlt 13:30 (nachboerslich)', plan.zaehltLeere, false]
      ]);
      H.betreten(tf !== null && plan.bloecke.length === 1, 'Halbtag im Kalender, Plan gebaut');
      return { abweichung: falsch.length > 0,
        text: falsch.length ? 'falsch: ' + falsch.join('; ')
          : '10 Pruefpunkte: regulaer bis 12:59, nachboerslich ab 13:00, Nachlese bis 17:20, zu ab 17:21, Kalenderfenster bis 17:00, Leere zaehlt ab 13:00 nicht (' +
            Z('livesammler.js', 'var zaehltLeere = opt.sitzung === undefined') + ', ' + Z('boerse.js', 'return halbtagAn(ms) ? HALB : VOLL;') + ')' };
    } },

  /* ======================= S11: Kursaussetzung ======================= */
  { id: 'LS-12', stoerung: 'S11 Kursaussetzung 10:00-10:39 im regulaeren Handel', bewertung: 'C',
    lauf: async function (H) {
      var K = kal([TAG]);
      var halt = function (t) { return t >= et(2026, 10, 6, 10, 0) && t < et(2026, 10, 6, 10, 40); };
      var aapl = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 19, 59), 230, halt);
      var msft = minutenBalken(et(2026, 10, 6, 9, 30), et(2026, 10, 6, 19, 59), 410);
      var q = quelle(markt({ AAPL: aapl, MSFT: msft }));
      var o = { werte: ['AAPL', 'MSFT'], kalender: K, leere: leereNeu(), fetch: q.f, schreiben: schreiber().f,
        stand: { AAPL: et(2026, 10, 6, 9, 59), MSFT: et(2026, 10, 6, 9, 59) } };
      var zeiten = takt(et(2026, 10, 6, 10, 21), 12).concat([et(2026, 10, 6, 16, 21)]);   /* 10:21 ... 11:16, dann 16:21 */
      var ersteMitNachHalt = null, gefragtRegulaer = 0;
      for (var i = 0; i < zeiten.length; i++) {
        var vorher = q.symbole.AAPL || 0;
        await runden([zeiten[i]], o);
        if (i < 12 && (q.symbole.AAPL || 0) > vorher) gefragtRegulaer++;
        if (ersteMitNachHalt == null && o.stand.AAPL >= et(2026, 10, 6, 10, 40)) ersteMitNachHalt = zeiten[i];
      }
      H.betreten(gefragtRegulaer >= 3 && q.n >= 13, 'Runden ueber Aussetzung und Sitzungswechsel');
      /* Soll: die Minute 10:40 ist ab der Runde 10:56 fertig - spaetestens eine Runde danach im Stand. */
      var verspaetet = ersteMitNachHalt == null || ersteMitNachHalt > et(2026, 10, 6, 11, 1);
      return { abweichung: verspaetet,
        text: 'AAPL nach 3 leeren Runden (10:21-10:31) ruhend; ab 10:56 liefert die Quelle wieder, gefragt wird AAPL im regulaeren Handel nur ' + gefragtRegulaer +
          'x in 12 Runden, die erste Minute nach der Aussetzung kommt erst in der Runde ' + (ersteMitNachHalt ? hm(ersteMitNachHalt) : 'nie') + ' ET (Sitzungswechsel) - verspaetet, nicht verloren (Stand danach ' +
          hm(o.stand.AAPL) + ') (' + Z('livesammler.js', 'if ((leere.je[sym] || 0) >= LEER_MAX) { ruhend.push(sym); return; }') + '). Soll: nach Aussetzungsende in der naechsten Runde wieder dabei' };
    } },

  /* ======================= weitere ======================= */
  { id: 'LS-13', stoerung: 'weitere: Antwort ausserhalb des Fensters (iex-Falle) und fremdes Symbol im Block', bewertung: '-',
    lauf: async function (H) {
      var J = et(2026, 10, 6, 11, 0), st0 = et(2026, 10, 6, 10, 40);
      var l = [balken(Date.UTC(2020, 2, 2, 14, 30), 70), balken(et(2026, 10, 5, 15, 59), 228)].concat(minutenBalken(et(2026, 10, 6, 10, 41), et(2026, 10, 6, 10, 44), 230));
      var q = quelle(function () { return { bars: { AAPL: l, ZZZZ: minutenBalken(et(2026, 10, 6, 10, 41), et(2026, 10, 6, 10, 43), 5) }, next_page_token: null }; });
      var s = schreiber();
      var erg = await runde({ werte: ['AAPL'], jetzt: fest(J), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: q.f, schreiben: s.f });
      H.betreten(q.n === 1 && s.n >= 1, 'Runde mit Abruf und Schreiben');
      var ist = Object.keys(s.je).join(',') + ':' + (s.je.AAPL || []).map(function (k) { return hm(k[0]); }).join(',');
      var soll = 'AAPL:10:41,10:42,10:43,10:44';
      return { abweichung: ist !== soll || erg.verworfen.alt !== 2 || erg.verworfen.fremd !== 3,
        text: 'Quelle liefert AAPL-Balken von 2020 und vom Vortag sowie ZZZZ (nicht angefragt): geschrieben ' + ist + ' (Soll ' + soll + '), verworfen alt ' + erg.verworfen.alt +
          ', fremd ' + erg.verworfen.fremd + ' (' + Z('livesammler.js', 'if (k[0] < start) { verworfen.alt++; return; }') + ', ' + Z('livesammler.js', 'if (!drin[sym]) { verworfen.fremd') + ')' };
    } },

  { id: 'LS-14', stoerung: 'weitere: Kurs 0 / null, Hoch < Tief, Schluss ausserhalb [Tief, Hoch]', bewertung: 'B',
    lauf: async function (H) {
      var J = et(2026, 10, 6, 11, 0), st0 = et(2026, 10, 6, 10, 40);
      var l = [
        balken(et(2026, 10, 6, 10, 41), 230, { c: 0 }),
        balken(et(2026, 10, 6, 10, 42), 230, { c: null }),
        balken(et(2026, 10, 6, 10, 43), 230, { h: 229, l: 231 }),             /* Hoch < Tief */
        balken(et(2026, 10, 6, 10, 44), 230, { c: 260, h: 230.2, l: 229.8 })  /* Schluss ueber dem Hoch */
      ];
      var q = quelle(function () { return { bars: { AAPL: l }, next_page_token: null }; });
      var s = schreiber();
      var erg = await runde({ werte: ['AAPL'], jetzt: fest(J), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: q.f, schreiben: s.f });
      H.betreten(q.n === 1 && erg.verworfen.form >= 1, 'Sichten mit Formpruefung');
      var durch = (s.je.AAPL || []).map(function (k) { return hm(k[0]) + '(S ' + k[1] + ' H ' + k[3] + ' T ' + k[4] + ')'; });
      return { abweichung: durch.length > 0,
        text: 'Kurs 0 und null verworfen (form ' + erg.verworfen.form + '), aber ' + durch.length + ' unmoegliche Balken geschrieben: ' + durch.join(', ') + ' - kerzeAus prueft nur Kurs > 0 (' +
          Z('alpacaarchiv.js', 'if (!KQ.kursOk(b.c) || !KQ.kursOk(b.h) || !KQ.kursOk(b.l) || !KQ.kursOk(b.o)) return null;') + '); derselbe Weg schreibt nachts die Jahresdatei (' +
          Z('tools/alpaca-vollsammlung.js', 'var g = Live.sichten(bars, block, plan.startJe);') + ', kerzenPruefen prueft nur Form/Jahr). Soll: Tief <= min(Eroeffnung, Schluss) und max(Eroeffnung, Schluss) <= Hoch, sonst form' };
    } },

  { id: 'LS-15', stoerung: 'weitere: Seitenumbruch mit Ueberlappung (doppelter Stempel, zweite Fassung anders)', bewertung: 'C',
    lauf: async function (H) {
      return mitAlpacaWurzel('ls15', async function (roh) {
        var J = et(2026, 10, 6, 11, 0), heute = A.etTag(J), st0 = et(2026, 10, 6, 10, 40);
        var q = quelle(function (t) {
          if (!t.token) return { bars: { AAPL: minutenBalken(et(2026, 10, 6, 10, 41), et(2026, 10, 6, 10, 43), 230) }, next_page_token: 'SEITE2' };
          return { bars: { AAPL: [balken(et(2026, 10, 6, 10, 43), 239), balken(et(2026, 10, 6, 10, 44), 230)] }, next_page_token: null };
        });
        var s = schreiberEcht(roh, heute, {}, {});
        var erg = await runde({ werte: ['AAPL'], jetzt: fest(J), kalender: kal([TAG]), stempel: function () { return st0; }, fetch: q.f, schreiben: s.f });
        var pfad = s.pfade.AAPL;
        H.betreten(q.n === 2 && s.n === 1 && pfad && H.imTmp(pfad), 'zwei Seiten, echter Schreibweg im Wegwerf-Ordner');
        var zeilen = require('fs').readFileSync(pfad, 'utf8').split('\n').filter(Boolean).length - 1;
        var gelesen = LA.lesenSync(pfad, heute);
        var sieger = gelesen.kerzen.filter(function (k) { return k[0] === et(2026, 10, 6, 10, 43); })[0];
        return { abweichung: erg.kerzen !== 4 || zeilen !== 4,
          text: '10:43 kommt auf beiden Seiten (230 / 239): Runde zaehlt ' + erg.kerzen + ' neue Kerzen (Soll 4), die Tagesablage traegt ' + zeilen + ' Zeilen; erst der Leser wirft ' +
            gelesen.verworfen.doppelt + ' Doppel weg und zeigt still die erste Fassung (Schluss ' + (sieger ? sieger[1] : '-') + ') (' +
            Z('livesammler.js', 'bars[sym] = (bars[sym] || []).concat(liste);') + ', ' + Z('liveablage.js', 'if (da[k[0]]) { aus.verworfen.doppelt++; continue; }') +
            '). Soll: Doppel vor dem Schreiben entfernen, abweichende Fassungen benennen' };
      });
    } }
] };

H.allein(module);
