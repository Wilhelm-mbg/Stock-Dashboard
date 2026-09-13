'use strict';
/* KUNSTPANEL - eine Tafel mit BEKANNTER Antwort, im echten Panelformat (VORREGISTRIERUNG §4).
 *
 * Warum: der Pruefrahmen darf nicht erst am echten Panel zum ersten Mal laufen. Ein Rahmen, der auf
 * erfundenen Daten das Orakel nicht findet, findet es auch auf echten nicht - und ein Nullbefund von einem
 * Rahmen, der nie etwas gefunden hat, ist wertlos (Fehlerform "Nullbefund vom toten Werkzeug").
 *
 * Der Satz enthaelt AUSDRUECKLICH die Faelle, die die Proben behaupten (Fehlerform "Die Kunst-Reihe war
 * eine Gerade"):
 *   - 300 Reihen mit Querschnittsstreuung ~2 Pp je Tag, dazu ein Markt-Faktor (gemeinsame Tage!),
 *   - eine EINGEPFLANZTE, EXAKT VORHERSAGBARE Kante: jede Reihe traegt ein festes theta_s und driftet ab
 *     2020 taeglich um 0,05 Pp x theta_s,
 *   - Umsaetze so, dass beide Universumsklassen und beide Cent-Boden-Seiten besetzt sind,
 *   - 12 Reihen, die mitten im Satz sterben, mit allen vier Ausbuchungsgruenden,
 *   - eine Reihe mit Luecken, eine mit fehlender Schlussauktionskerze, eine unter dem Cent-Boden,
 *   - SPY als Referenzreihe mit einem Regimewechsel.
 * Dazu ein Kunst-Kalender aus dem echten Kalender (damit Wochen- und Monatsgrenzen echt sind).
 *
 * Schreibt nach <aus>/panel/. Nichts davon geht in einen Ergebnisbericht - die Datei heisst so, wie die
 * Zahlen herkommen (Fehlerform "Trockenlauf, der aussieht wie ein Befund").
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var ST = require('./statistik.js');

var N_REIHEN = 300;
/* Die eingepflanzte Kante (§4 Pruefung 10): jede Reihe traegt einen FESTEN, verborgenen Wert theta_s
 * (standardnormal, deterministisch aus dem Kuerzel), und ab KANTE_AB driftet sie taeglich um
 * KANTE_PP * theta_s. Eine Rangfunktion, die theta_s liefert, muss dann genau
 * KANTE_PP * (theta des Long-Dezils - theta des Universums) * Handelstage je Periode verdienen - eine
 * Vorhersage auf die zweite Stelle, nicht ein "ungefaehr positiv".
 * Frueher stand hier "gerade Kuerzelnummer": untauglich, weil das Dezil dann immer dieselben 17 Reihen
 * war UND die Nummer ueber den Umsatz mit der Umsatzklasse und dem Cent-Boden verkoppelt war. */
var KANTE_AB = '2020-01-01', KANTE_PP = 0.05;
function theta(name) {
  var r = ST.mulberry32(ST.fnv('kunst-theta|' + name));
  var u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
var TOTE = [
  { i: 10, tag: '2018-06-15', grund: 'insolvenz' }, { i: 11, tag: '2018-06-15', grund: 'zwangs-delisting' },
  { i: 12, tag: '2019-03-20', grund: 'uebernahme' }, { i: 13, tag: '2019-03-20', grund: 'unbekannt' },
  { i: 14, tag: '2021-09-10', grund: 'insolvenz' }, { i: 15, tag: '2021-09-10', grund: 'fusion-aktientausch' },
  { i: 16, tag: '2022-04-11', grund: 'zwangs-delisting' }, { i: 17, tag: '2022-04-11', grund: 'freiwillig' },
  { i: 18, tag: '2023-07-05', grund: 'insolvenz' }, { i: 19, tag: '2023-07-05', grund: 'spac-ende' },
  { i: 20, tag: '2024-02-02', grund: 'umbenennung-ticker' }, { i: 21, tag: '2024-02-02', grund: null },
];
var LUECKEN_REIHE = 30, ERSATZ_REIHE = 31, CENT_REIHE = 32, KLEIN_REIHE = 33;

function bauen(aus, opt) {
  opt = opt || {};
  var kal = K.kalender();
  var von = kal.idx[opt.von || '2016-01-04'], bis = kal.idx[opt.bis || '2026-06-30'];
  if (von == null || bis == null) throw new Error('Kunstpanel: Kalendergrenzen fehlen');
  /* KANTE_AB ist ein KALENDERDATUM, kein Handelstag: 2020-01-01 ist ein Feiertag, `kal.idx` kennt ihn
   * nicht, und `tg >= undefined` ist IMMER falsch - die Kante wurde dadurch nie eingepflanzt, und die
   * Positivkontrolle mass brav null. Gefunden hat es die Positivkontrolle selbst, nicht der Verdacht. */
  var kanteAb = null;
  for (var ka = 0; ka < kal.tage.length; ka++) if (kal.tage[ka] >= KANTE_AB) { kanteAb = ka; break; }
  if (kanteAb == null) throw new Error('Kunstpanel: kein Handelstag ab ' + KANTE_AB);
  var namen = []; for (var i = 0; i < N_REIHEN; i++) namen.push('K' + String(i).padStart(3, '0'));
  namen.push('SPY');
  var spyIdx = N_REIHEN;
  var toteVon = {}; TOTE.forEach(function (x) { toteVon[x.i] = x; });

  var rnd = ST.mulberry32(ST.fnv('kunstpanel-2026-09-13'));
  function normal() { var u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* Marktfaktor je Tag - erzeugt die Korrelation ueber gemeinsame Tage, die eine echte Tafel hat. */
  var markt = {}; for (var t = von; t <= bis; t++) markt[t] = 0.8 * normal();

  var kurs = new Float64Array(N_REIHEN + 1), umsatz = new Float64Array(N_REIHEN + 1), lebt = [];
  for (var s = 0; s <= N_REIHEN; s++) {
    kurs[s] = (s === spyIdx) ? 200 : (s === CENT_REIHE ? 3.0 : (5 + 60 * rnd()));
    /* Umsatz: Haelfte in ab1000, Haelfte in 250-1000, ein paar darunter */
    umsatz[s] = (s === spyIdx) ? 3e10 : (s === KLEIN_REIHE ? 2e7 : (s % 2 === 0 ? 2e9 + 1e9 * rnd() : 3e8 + 4e8 * rnd()));
    lebt[s] = true;
  }
  if (CENT_REIHE < N_REIHEN) umsatz[CENT_REIHE] = 2e9;                  /* liquide, aber unter dem Cent-Boden */

  var jeJahr = {};
  function zeile(jahr, r) {
    var e = jeJahr[jahr]; if (!e) e = jeJahr[jahr] = { cap: 4096, n: 0, sp: P.leer(4096) };
    if (e.n >= e.cap) { var neu = P.leer(e.cap * 2); P.SPALTEN.forEach(function (c) { neu[c.name].set(e.sp[c.name]); }); e.cap *= 2; e.sp = neu; }
    var i2 = e.n++;
    P.SPALTEN.forEach(function (c) { e.sp[c.name][i2] = r[c.name]; });
  }

  var vorSchluss = {}, nTageJeReihe = {};
  for (var tg = von; tg <= bis; tg++) {
    var datum = kal.tage[tg], jahr = +datum.slice(0, 4);
    for (var sy = 0; sy <= N_REIHEN; sy++) {
      if (!lebt[sy]) continue;
      var tot = toteVon[sy];
      if (tot && datum > tot.tag) { lebt[sy] = false; continue; }
      if (sy === LUECKEN_REIHE && (tg % 37 === 0)) continue;             /* echte Luecken */
      /* Der Tag zerfaellt in Nacht (Schluss -> Eroeffnung) und Sitzung (Eroeffnung -> Schluss) - wie in der
       * Wirklichkeit, wo der GROESSERE Teil der Tagesstreuung im Tagesverlauf sitzt (Nacht ~1,0 Pp,
       * Sitzung ~1,8 Pp). Das ist kein Zierrat: das Orakel rangiert nach der Sitzungsrendite des
       * Ausfuehrungstags, und ein Kunstsatz mit winziger Sitzungsstreuung enthielte den Fall nicht, den
       * die Probe behauptet (Fehlerform "Die Kunst-Reihe war eine Gerade"). */
      var nacht = (sy === spyIdx) ? 0.3 * normal() : 1.0 * normal();
      var sitzung = (sy === spyIdx) ? 0.6 * normal() : 1.8 * normal();
      var kante = (sy !== spyIdx && tg >= kanteAb) ? KANTE_PP * theta(namen[sy]) : 0;
      var oc = markt[tg] + sitzung + kante;                             /* Eroeffnung -> Schluss */
      var alt = kurs[sy];
      var eroeff = alt * (1 + nacht / 100);
      kurs[sy] = eroeff * (1 + oc / 100);
      var r = 100 * (kurs[sy] / alt - 1);
      var cc = (vorSchluss[sy] > 0) ? 100 * (kurs[sy] / vorSchluss[sy] - 1) : NaN;
      var marken = K.M_QUELLE_REIN | K.M_DICHTE_OK;
      if (sy === ERSATZ_REIHE && tg % 11 === 0) marken |= K.M_SCHLUSS_ERSATZ;
      if (!(cc === cc)) marken |= K.M_KEINE_RENDITE;
      var u = umsatz[sy] * (0.8 + 0.4 * rnd());
      nTageJeReihe[sy] = (nTageJeReihe[sy] || 0) + 1;
      var klasse = (nTageJeReihe[sy] > K.UMSATZ_MIN_TAGE) ? K.klasseIndex(umsatz[sy]) : -1;
      var letzterTag = (tot && datum === tot.tag) || (tg === bis);
      zeile(jahr, { sym: sy, tag: tg, marken: marken | (letzterTag ? K.M_LETZTER_TAG : 0), klasse: klasse,
        kerzen: 390, rohSchluss: kurs[sy], rohEroeffnung: eroeff, faktor: 1,
        rendite: cc, renditeOC: oc, umsatzReg: 0.9 * u, umsatzAuktion: 0.1 * u });
      vorSchluss[sy] = kurs[sy];
    }
  }

  var panel = path.join(aus, 'panel');
  fs.mkdirSync(panel, { recursive: true });
  var stand = { kennung: K.PANEL_KENNUNG, konfig: K.KONFIG_KENNUNG, kunst: true, stand: new Date().toISOString(),
    zeilen: 0, jahre: [], zeilenJeTag: {}, teile: 1, zaehler: { kunst: true },
    symbole: namen.map(function (nme, i3) {
      var tot = toteVon[i3];
      return { reihe: nme, ordner: nme, lebend: tot ? 0 : 1, art: nme === 'SPY' ? 'ETF' : 'CS', referenz: nme === 'SPY',
        ende_grund: tot ? tot.grund : null, ende_datum: tot ? tot.tag : null };
    }),
    tage: kal.tage, ausgeschlosseneArten: {}, gruendeKennung: 'kunst',
    kanteAb: KANTE_AB, kantePp: KANTE_PP, tote: TOTE };
  Object.keys(jeJahr).sort().forEach(function (j) {
    var e = jeJahr[j];
    P.schreibeBlock(path.join(panel, j + '.bin'), e.sp, e.n, { jahr: +j });
    stand.zeilen += e.n; stand.jahre.push({ jahr: +j, n: e.n });
    for (var w = 0; w < e.n; w++) stand.zeilenJeTag[e.sp.tag[w]] = (stand.zeilenJeTag[e.sp.tag[w]] || 0) + 1;
  });
  stand.jahre.sort(function (a, b) { return a.jahr - b.jahr; });
  stand.letzterVollTagIdx = bis; stand.letzterVollTag = kal.tage[bis]; stand.unvollstaendigeTage = [];
  fs.writeFileSync(path.join(panel, '_stand.json'), JSON.stringify(stand));
  return stand;
}

if (require.main === module) {
  var aus = process.argv[2] || 'kunst';
  fs.mkdirSync(aus, { recursive: true });
  var st = bauen(aus);
  process.stdout.write('Kunstpanel: ' + st.zeilen + ' Zeilen, ' + st.symbole.length + ' Reihen, ' + st.jahre.length + ' Jahre, Kante ' + KANTE_PP + ' x theta_s je Tag ab ' + KANTE_AB + '\n');
}

module.exports = { bauen: bauen, theta: theta, N_REIHEN: N_REIHEN, KANTE_AB: KANTE_AB, KANTE_PP: KANTE_PP, TOTE: TOTE,
  LUECKEN_REIHE: LUECKEN_REIHE, ERSATZ_REIHE: ERSATZ_REIHE, CENT_REIHE: CENT_REIHE, KLEIN_REIHE: KLEIN_REIHE };
