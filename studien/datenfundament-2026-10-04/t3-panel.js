'use strict';
/* T3 - Wirkung von T1/T2 auf das Panel v2.2; dazu aus demselben Ladevorgang T4 (Luecken, die der Minuten-Leser nicht
 * kennt) und die Pausen-Statistik fuer die Wahl von X in T1. NUR ZAEHLEN - das Panel wird gelesen, nie geschrieben.
 *
 * Aufruf:  node --max-old-space-size=6144 t3-panel.js
 * Liest:   voll-v22/ (ueber PR.Tafel), voll/ (v2.1, nur fuer die Klasse ueber die Luecke hinweg in T4),
 *          t1-reihen.json, t1-leser-veraltet.json, t2-gruende-neu.json (wenn vorhanden), reihen-abschnitte.json
 * Schreibt: t3-zahlen.json, t3-reihen.json, t1-pausen.json, t4-zahlen.json, t4-luecken.json, teile/t3.md, teile/t4.md
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');
var PR = require(path.join(G.PRUEFSTAND, 'pruefstand.js'));
var K = require(path.join(G.PRUEFSTAND, 'konfig.js'));

var LETZTE_ZEILEN = 250;                                    // Klaerung 4: letzte 250 Zeilen der Reihe
var T4_ZEILEN = 38;                                         // Klaerung 5: 38 Panel-Tage ~ 261 Stundenkerzen
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

/** Reine Zaehlregel T3: neuer Stand des LETZTEN Abschnitts einer Leser-Reihe.
 *  alt: {lebend, ende_grund, ende_datum}; leser: {lebendNeu}; t2: Zeile aus t2-gruende-neu.json oder null. */
function neuerStand(alt, leser, t2, x) {
  var neu = { lebend: alt.lebend, ende_grund: alt.ende_grund, ende_datum: alt.ende_datum };
  if (leser) neu.lebend = leser.lebendNeu;
  var gilt = t2 && !(t2.neu && t2.lebend_ab_x != null && t2.lebend_ab_x <= x);   // neue Zeile zaehlt nur, wenn die Reihe bei X nicht lebt
  if (gilt) { neu.ende_grund = t2.grund; neu.ende_datum = t2.datum; }
  return neu;
}
function totalverlust(grund, liste) { return !!(grund && liste.indexOf(grund) !== -1); }

function main() {
  var X = G.X_TROCKENLAUF;
  var t1 = G.json(path.join(G.HIER, 't1-reihen.json')), sp = {}; t1.spalten.forEach(function (s, i) { sp[s] = i; });
  var leserJeOrdner = {};
  t1.reihen.forEach(function (r) {
    leserJeOrdner[r[sp.ordner]] = { reihe: r[sp.reihe], lebendAlt: r[sp.lebendAlt], erloschen: r[sp.erloschen], letzterTagesbalken: r[sp.letzterTagesbalken],
      letzterMinutentag: r[sp.letzterMinutentag], abstand: r[sp.abstand], lebendNeu: r[sp['lebendX' + X]], lebendX: { 0: r[sp.lebendX0], 5: r[sp.lebendX5], 10: r[sp.lebendX10], 20: r[sp.lebendX20] },
      gruppeEnde: r[sp.gruppeEnde], polygonBis: r[sp.polygonBis] };
  });
  var veraltet = {}; G.json(path.join(G.HIER, 't1-leser-veraltet.json')).reihen.forEach(function (v) { veraltet[v.reihe] = v; });
  var t2Pfad = path.join(G.HIER, 't2-gruende-neu.json'), t2Je = {}, t2Da = fs.existsSync(t2Pfad), t2Offen = null;
  if (t2Da) { var t2 = G.json(t2Pfad); t2Offen = t2.offen; t2.reihen.forEach(function (z) { t2Je[z.reihe] = z; }); }

  var t0 = Date.now();
  var T = PR.Tafel(path.join(G.PRUEFSTAND, 'voll-v22'));
  var g = T.g, sym = T.stand.symbole, panelEnde = T.kal.tage[T.maxTag];
  console.log('Panel v2.2 geladen:', fmt(g.n), 'Zeilen,', sym.length, 'Reihen, Ende', panelEnde, '(' + Math.round((Date.now() - t0) / 1000) + ' s)');

  /* ---- je Panel-Reihe: Zeilen, Rand, Klassen in den letzten 250 Zeilen, Pausen ---- */
  var info = sym.map(function (s, i) {
    var a = T.symStart[i], b = T.symStart[i + 1], n = b - a;
    var o = { idx: i, reihe: s.reihe, ordner: s.ordner, referenz: !!s.referenz, zeilen: n, von: null, bis: null, bisTag: -1, k123: 0, k23: 0, maxKlasse: -1 };
    if (!n) return o;
    o.von = T.kal.tage[g.tag[T.symZeilen[a]]]; o.bisTag = g.tag[T.symZeilen[b - 1]]; o.bis = T.kal.tage[o.bisTag];
    for (var q = Math.max(a, b - LETZTE_ZEILEN); q < b; q++) {
      var kl = g.klasse[T.symZeilen[q]];
      if (kl >= 1 && kl <= 3) o.k123++;
      if (kl >= 2 && kl <= 3) o.k23++;
      if (kl > o.maxKlasse) o.maxKlasse = kl;
    }
    return o;
  });

  /* ---- letzter Abschnitt je Ordner ---- */
  var jeOrdner = {};
  info.forEach(function (o) { if (!o.referenz) (jeOrdner[o.ordner] = jeOrdner[o.ordner] || []).push(o); });
  Object.keys(jeOrdner).forEach(function (ord) {
    var l = jeOrdner[ord], mitZeilen = l.filter(function (o) { return o.zeilen > 0; });
    var letzter = (mitZeilen.length ? mitZeilen : l).slice().sort(function (p, q) { return q.bisTag - p.bisTag; })[0];
    l.forEach(function (o) { o.letzterAbschnitt = o === letzter ? 1 : 0; o.abschnitteImOrdner = l.length; });
  });

  /* ---- Stand alt gegen neu ---- */
  var Z = { stand: null, panel: T.stand.kennung, panelEnde: panelEnde, x: X, t2Vorhanden: t2Da, t2Offen: t2Offen, reihen: sym.length,
    reihenOhneReferenz: info.filter(function (o) { return !o.referenz; }).length, lebendAlt: 0, ohneLeserReihe: 0 };
  var HAUPT = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === 'haupt'; })[0].totalverlust;
  var STRENG = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === 'streng'; })[0].totalverlust;
  var geaendert = [];
  info.forEach(function (o) {
    if (o.referenz) return;
    var s = sym[o.idx], alt = { lebend: s.lebend, ende_grund: s.ende_grund, ende_datum: s.ende_datum };
    if (alt.lebend) Z.lebendAlt++;
    var leser = leserJeOrdner[o.ordner];
    if (!leser) { Z.ohneLeserReihe++; return; }
    o.leser = leser.reihe;
    if (!o.letzterAbschnitt) return;                         // Abschnitte vor einem Schnitt behalten ihren Stand
    var neu = neuerStand(alt, leser, t2Je[leser.reihe] || null, X);
    var d = { lebend: alt.lebend !== neu.lebend, grund: alt.ende_grund !== neu.ende_grund, datum: alt.ende_datum !== neu.ende_datum };
    if (!d.lebend && !d.grund && !d.datum) return;
    var z2 = t2Je[leser.reihe] || null;
    geaendert.push({ reihe: o.reihe, leserReihe: leser.reihe, zeilen: o.zeilen, letztePanelzeile: o.bis, letzterMinutentag: leser.letzterMinutentag,
      letzterTagesbalken: leser.letzterTagesbalken, alt: alt, neu: neu, aendert: d, k123: o.k123, k23: o.k23, maxKlasse: o.maxKlasse,
      tvHauptAlt: totalverlust(alt.ende_grund, HAUPT), tvHauptNeu: totalverlust(neu.ende_grund, HAUPT),
      tvStrengAlt: totalverlust(alt.ende_grund, STRENG), tvStrengNeu: totalverlust(neu.ende_grund, STRENG),
      belegNeu: z2 ? z2.beleg : null, quelleNeu: z2 ? z2.quelle : null, neuInTafel: z2 ? z2.neu : null });
  });
  function zaehl(f) { return geaendert.filter(f).length; }
  Z.andererStand = { gesamt: geaendert.length, lebend: zaehl(function (c) { return c.aendert.lebend; }), grund: zaehl(function (c) { return c.aendert.grund; }),
    datum: zaehl(function (c) { return c.aendert.datum; }), nurDatum: zaehl(function (c) { return c.aendert.datum && !c.aendert.grund && !c.aendert.lebend; }) };
  Z.klasse123 = { gesamt: zaehl(function (c) { return c.k123 > 0; }), lebend: zaehl(function (c) { return c.aendert.lebend && c.k123 > 0; }),
    grund: zaehl(function (c) { return c.aendert.grund && c.k123 > 0; }), datum: zaehl(function (c) { return c.aendert.datum && c.k123 > 0; }),
    klasse23: zaehl(function (c) { return c.k23 > 0; }), grundKlasse23: zaehl(function (c) { return c.aendert.grund && c.k23 > 0; }) };
  function tv(a, n, f) { return { kommtHinzu: zaehl(function (c) { return !c[a] && c[n] && f(c); }), faelltWeg: zaehl(function (c) { return c[a] && !c[n] && f(c); }) }; }
  function alle() { return true; } function k123(c) { return c.k123 > 0; } function k23(c) { return c.k23 > 0; }
  Z.totalverlust = { haupt: { alle: tv('tvHauptAlt', 'tvHauptNeu', alle), klasse123: tv('tvHauptAlt', 'tvHauptNeu', k123), klasse23: tv('tvHauptAlt', 'tvHauptNeu', k23) },
    streng: { alle: tv('tvStrengAlt', 'tvStrengNeu', alle), klasse123: tv('tvStrengAlt', 'tvStrengNeu', k123), klasse23: tv('tvStrengAlt', 'tvStrengNeu', k23) },
    listen: { haupt: HAUPT, streng: STRENG } };
  var matrix = {};
  geaendert.forEach(function (c) { if (!c.aendert.grund) return; var k = String(c.alt.ende_grund) + ' -> ' + String(c.neu.ende_grund); matrix[k] = (matrix[k] || 0) + 1; });
  Z.grundMatrix = matrix;

  /* ---- Zahlen des PM ---- */
  function tageVor(o) { return o.bis ? G.tageZwischen(o.bis, panelEnde) : null; }
  var lebendFrueh = info.filter(function (o) { return !o.referenz && sym[o.idx].lebend === 1 && o.zeilen > 0 && tageVor(o) > 30; });
  Z.pm45 = { behauptet: 45, gezaehlt: lebendFrueh.length, davonOhneGrund: lebendFrueh.filter(function (o) { return !sym[o.idx].ende_grund; }).length };
  var die39 = t1.reihen.filter(function (r) { return r[sp.lebendAlt] === 1; }).map(function (r) { return leserJeOrdner[r[sp.ordner]]; });
  /* die 39 des PM: lebend (alt), letzter Minutentag LAUT LEBENSZEIT-TAFEL mehr als 30 Tage vor LEBEND_AB - aus t1-wechsel X=10 sind es die mit Nachleben */
  var w10 = G.json(path.join(G.HIER, 't1-wechsel.json')).jeX[String(X)].lebendZuAbgegangen;
  var pm39 = w10.filter(function (z) { return z.lmtLebenszeit && G.tageZwischen(z.lmtLebenszeit, G.LEBEND_AB) > 30; }).map(function (z) { return z.reihe; });
  var jeLeser = {}; info.forEach(function (o) { if (o.leser && o.letzterAbschnitt) jeLeser[o.leser] = o; });
  var p39 = pm39.map(function (r) { return jeLeser[r]; }).filter(Boolean);
  Z.pm39ImPanel = { leserReihenImWechselX10: pm39.length, imPanelGefunden: p39.length, lebend1OhneGrund: p39.filter(function (o) { return sym[o.idx].lebend === 1 && !sym[o.idx].ende_grund; }).length,
    alsAbschnitt: p39.filter(function (o) { return o.abschnitteImOrdner > 1; }).map(function (o) { return o.reihe; }),
    klasse123InLetzten250: p39.filter(function (o) { return o.k123 > 0; }).length, maxKlasse: p39.reduce(function (a, o) { a[o.maxKlasse] = (a[o.maxKlasse] || 0) + 1; return a; }, {}) };
  void die39;

  /* ---- Panelrand: Reihen, die im Panel vor dessen Ende aufhoeren, obwohl sie als lebend gelten ---- */
  var rand = { lebendImPanel: 0, letzteZeileAmEnde: 0, davor: 0, ursachen: { 'veraltete bereinigte Kopie': 0, 'Abgang nach neuer Regel': 0, 'Minuten enden vor dem Panel-Ende (lebt nach neuer Regel)': 0, 'handelt nicht jeden Tag (Minuten nach dem Panel-Ende vorhanden)': 0 }, k123: {}, liste: [] };
  info.forEach(function (o) {
    if (o.referenz || !o.zeilen || sym[o.idx].lebend !== 1) return;
    rand.lebendImPanel++;
    if (o.bisTag === T.maxTag) { rand.letzteZeileAmEnde++; return; }
    rand.davor++;
    var leser = leserJeOrdner[o.ordner], u;
    if (leser && veraltet[leser.reihe] && veraltet[leser.reihe].leserEnde <= o.bis) u = 'veraltete bereinigte Kopie';
    else if (leser && leser.lebendNeu === 0) u = 'Abgang nach neuer Regel';
    else if (leser && leser.letzterMinutentag <= panelEnde) u = 'Minuten enden vor dem Panel-Ende (lebt nach neuer Regel)';
    else u = 'handelt nicht jeden Tag (Minuten nach dem Panel-Ende vorhanden)';
    rand.ursachen[u]++; if (o.k123 > 0) rand.k123[u] = (rand.k123[u] || 0) + 1;
    rand.liste.push({ reihe: o.reihe, letztePanelzeile: o.bis, handelstageVorEnde: T.maxTag - o.bisTag, ursache: u, k123: o.k123, k23: o.k23, letzterMinutentag: leser ? leser.letzterMinutentag : null });
  });
  Z.panelrand = { lebendImPanel: rand.lebendImPanel, letzteZeileAmEnde: rand.letzteZeileAmEnde, davor: rand.davor, ursachen: rand.ursachen, davonKlasse123: rand.k123 };

  /* ---- Pausen (fuer X in T1): wie oft waere eine weiterlaufende Reihe an einem Tag faelschlich "abgegangen"? ---- */
  var fenVon = T.maxTag - 249, fenBis = T.maxTag, P = { fensterTage: 250, von: T.kal.tage[fenVon], bis: T.kal.tage[fenBis], jeX: {} };
  var xs = [0, 1, 2, 3, 5, 10, 20, 40];
  xs.forEach(function (x) { P.jeX[x] = { pausenImFenster: 0, reihenMitPause: 0, falschTotReihentage: 0, falschTotReihentageK123: 0, pausenK123: 0 }; });
  var laengste = [];
  info.forEach(function (o) {
    if (o.referenz || o.zeilen < 2) return;
    var a = T.symStart[o.idx], b = T.symStart[o.idx + 1], hat = {};
    for (var q = a; q < b - 1; q++) {
      var z1 = T.symZeilen[q], ta = g.tag[z1], tb = g.tag[T.symZeilen[q + 1]], p = tb - ta - 1;
      if (p < 1 || tb < fenVon || ta > fenBis) continue;
      var kl = g.klasse[z1], k = kl >= 1 && kl <= 3;
      xs.forEach(function (x) {
        if (p <= x) return;
        var von = Math.max(ta + x + 1, fenVon), bis = Math.min(tb - 1, fenBis), tageF = Math.max(0, bis - von + 1);
        if (!tageF) return;
        var e = P.jeX[x]; e.pausenImFenster++; e.falschTotReihentage += tageF;
        if (k) { e.pausenK123++; e.falschTotReihentageK123 += tageF; }
        if (!hat[x]) { hat[x] = 1; e.reihenMitPause++; }
      });
      if (p > 10) laengste.push({ reihe: o.reihe, von: T.kal.tage[ta], bis: T.kal.tage[tb], handelstageOhneZeile: p, klasseDavor: kl });
    }
  });
  xs.forEach(function (x) { var e = P.jeX[x]; e.falschTotJeTag = Math.round(1000 * e.falschTotReihentage / 250) / 1000; e.falschTotJeTagK123 = Math.round(1000 * e.falschTotReihentageK123 / 250) / 1000; });
  laengste.sort(function (p, q) { return q.handelstageOhneZeile - p.handelstageOhneZeile || (p.reihe < q.reihe ? -1 : 1); });
  P.pausenUeber10Handelstage = laengste.length;
  /* echte Enden im selben Fenster: letzte Zeile im Fenster, aber vor dem Panel-Ende, und nach neuer Regel abgegangen */
  P.echteEndenImFenster = info.filter(function (o) { var l = leserJeOrdner[o.ordner]; return !o.referenz && o.zeilen && o.letzterAbschnitt && o.bisTag >= fenVon && o.bisTag < fenBis && l && l.lebendNeu === 0; }).length;

  /* ---- T4: die ersten 38 Panel-Tage nach jeder Luecke / jedem Kuerzelwechsel ---- */
  var RA = G.json(path.join(G.PRUEFSTAND, 'voll-v22', 'reihen-abschnitte.json'));
  var t4 = [], merk = [];
  Object.keys(RA.kuerzel).sort().forEach(function (basis) {
    var ab = RA.kuerzel[basis];
    if (ab.length < 2) return;
    ab.forEach(function (s) {
      if (s.beginn === 'reihenanfang') return;
      var i = T.symIdx[s.reihe], a = T.symStart[i], b = T.symStart[i + 1], n = Math.min(T4_ZEILEN, b - a);
      var e = { basis: basis, reihe: s.reihe, beginn: s.beginn, ersterTag: s.von, letzterTagVor: s.letzterTagVor || null, lueckeKalendertage: s.lueckeKalendertage || null,
        reiheV21: s.reiheV21, zeilenAbschnitt: b - a, zeilenGezaehlt: n, klasseV22_123: 0, klasseV21_123: 0, klasseV21_23: 0, klasseNachAnlauf: null,
        minutenLeserTrennt: s.beginn === 'archiv-zweite-reihe' ? 1 : 0, dasselbePapier: s.dasselbePapierWieVorgaenger || null };
      for (var q = a; q < a + n; q++) { var kl = g.klasse[T.symZeilen[q]]; if (kl >= 1 && kl <= 3) e.klasseV22_123++; merk.push({ e: e, reiheV21: s.reiheV21, tag: g.tag[T.symZeilen[q]] }); }
      if (b - a > 40) e.klasseNachAnlauf = g.klasse[T.symZeilen[a + 40]];
      t4.push(e);
    });
  });

  /* v2.1 nur fuer die Klasse, die eine Studie OHNE Trennung an diesen Tagen gesehen haette */
  T = null; g = null;
  var T21 = PR.Tafel(path.join(G.PRUEFSTAND, 'voll'));
  var fehlt21 = 0;
  merk.forEach(function (m) {
    var i = T21.symIdx[m.reiheV21], z = i === undefined ? -1 : T21.zeileVon(i, m.tag);
    if (z < 0) { fehlt21++; return; }
    var kl = T21.g.klasse[z];
    if (kl >= 1 && kl <= 3) m.e.klasseV21_123++;
    if (kl >= 2 && kl <= 3) m.e.klasseV21_23++;
  });
  var betroffen = t4.filter(function (e) { return !e.minutenLeserTrennt; });
  var Z4 = { stand: null, zeilenJeLuecke: T4_ZEILEN, basisKuerzelMitMehrAlsEinemAbschnitt: Object.keys(RA.kuerzel).filter(function (b) { return RA.kuerzel[b].length > 1; }).length,
    abschnittsAnfaenge: t4.length, jeBeginn: t4.reduce(function (a, e) { a[e.beginn] = (a[e.beginn] || 0) + 1; return a; }, {}),
    vomMinutenLeserGetrennt: t4.length - betroffen.length, betroffeneAnfaenge: betroffen.length,
    betroffeneBasisKuerzel: Object.keys(betroffen.reduce(function (a, e) { a[e.basis] = 1; return a; }, {})).length,
    panelTage: betroffen.reduce(function (a, e) { return a + e.zeilenGezaehlt; }, 0),
    davonKlasse123inV21: betroffen.reduce(function (a, e) { return a + e.klasseV21_123; }, 0),
    davonKlasse23inV21: betroffen.reduce(function (a, e) { return a + e.klasseV21_23; }, 0),
    davonKlasse123inV22: betroffen.reduce(function (a, e) { return a + e.klasseV22_123; }, 0),
    anfaengeMitKlasse123inV21: betroffen.filter(function (e) { return e.klasseV21_123 > 0; }).length,
    anfaengeMitWenigerAls38Zeilen: betroffen.filter(function (e) { return e.zeilenGezaehlt < T4_ZEILEN; }).length,
    zeilenOhneV21Treffer: fehlt21,
    klasseNachAnlauf: betroffen.reduce(function (a, e) { var k = String(e.klasseNachAnlauf); a[k] = (a[k] || 0) + 1; return a; }, {}) };

  /* ---- schreiben ---- */
  Z.stand = Z4.stand = new Date().toISOString();
  G.schreibe('t3-zahlen.json', Z);
  geaendert.sort(function (p, q) { return (q.k123 - p.k123) || (p.reihe < q.reihe ? -1 : 1); });
  G.schreibe('t3-reihen.json', { stand: Z.stand, x: X, hinweis: 'Panel-Reihen, deren Stand (lebend, ende_grund, ende_datum) nach T1/T2 anders waere. k123/k23 = Zeilen in Klasse 1-3 bzw. 2-3 unter den letzten 250.', reihen: geaendert,
    panelrand: rand.liste.sort(function (p, q) { return q.handelstageVorEnde - p.handelstageVorEnde || (p.reihe < q.reihe ? -1 : 1); }) });
  G.schreibe('t1-pausen.json', { stand: Z.stand, panel: Z.panel, hinweis: 'Pause = Handelstage ohne Panelzeile zwischen zwei Zeilen derselben Reihe (v2.2: nie ueber 90 Kalendertage). falschTot = Reihen-Tage im Fenster, an denen die Regel "mehr als X Handelstage ohne Minuten = abgegangen" eine weiterlaufende Reihe fuer abgegangen gehalten haette.',
    zahlen: P, laengste: laengste.slice(0, 200) });
  G.schreibe('t4-zahlen.json', Z4);
  G.schreibe('t4-luecken.json', { stand: Z4.stand, hinweis: 'Jeder Abschnittsanfang nach einer Luecke > 90 Kalendertage oder einem Kuerzelwechsel. klasseV21 = Klasse derselben Tage im Panel v2.1 (ohne Trennung, Umsatzfenster ueber die Luecke hinweg).', anfaenge: t4 });

  /* ---- Textteile ---- */
  var M = [];
  function kopf3() { return '| Panel-Reihe | letzte Panelzeile | letzter Minutentag | lebend alt -> neu | Grund alt -> neu | Datum alt -> neu | Zeilen K1-3 (letzte 250) |\n|---|---|---|---|---|---|---|'; }
  function z3(c) { return '| ' + [c.reihe, c.letztePanelzeile, c.letzterMinutentag, c.alt.lebend + ' -> ' + c.neu.lebend, String(c.alt.ende_grund) + ' -> ' + String(c.neu.ende_grund), String(c.alt.ende_datum) + ' -> ' + String(c.neu.ende_datum), c.k123].join(' | ') + ' |'; }
  M.push('### T3 - Panel-Reihen mit anderem Stand: die 30 mit den meisten Zeilen in Klasse 1-3 (letzte 250 Zeilen)', '', kopf3());
  geaendert.slice(0, 30).forEach(function (c) { M.push(z3(c)); });
  M.push('', '### T3 - dieselbe Menge: 20 zufaellig gezogene (Saat `t3-stand`)', '', kopf3());
  G.ziehe(geaendert, 20, 't3-stand', function (c) { return c.reihe; }).forEach(function (c) { M.push(z3(c)); });
  fs.writeFileSync(path.join(G.HIER, 'teile', 't3.md'), M.join('\n') + '\n');
  var M4 = [];
  function kopf4() { return '| Abschnitt | Beginn | erster Tag | letzter Tag davor | Luecke (Kalendertage) | Zeilen gezaehlt | davon K1-3 (v2.1) | Klasse nach Anlauf | dasselbe Papier |\n|---|---|---|---|---|---|---|---|---|'; }
  function z4(e) { return '| ' + [e.reihe, e.beginn, e.ersterTag, e.letzterTagVor || '-', e.lueckeKalendertage == null ? '-' : e.lueckeKalendertage, e.zeilenGezaehlt, e.klasseV21_123, e.klasseNachAnlauf == null ? '-' : e.klasseNachAnlauf, e.dasselbePapier || '-'].join(' | ') + ' |'; }
  M4.push('### T4 - die 30 Abschnittsanfaenge mit den meisten Tagen in Klasse 1-3 (Panel v2.1, ueber die Luecke gerechnet)', '', kopf4());
  betroffen.slice().sort(function (p, q) { return q.klasseV21_123 - p.klasseV21_123 || (q.lueckeKalendertage || 0) - (p.lueckeKalendertage || 0) || (p.reihe < q.reihe ? -1 : 1); }).slice(0, 30).forEach(function (e) { M4.push(z4(e)); });
  M4.push('', '### T4 - 20 zufaellig gezogene Abschnittsanfaenge (Saat `t4-luecken`)', '', kopf4());
  G.ziehe(betroffen, 20, 't4-luecken', function (e) { return e.reihe; }).forEach(function (e) { M4.push(z4(e)); });
  fs.writeFileSync(path.join(G.HIER, 'teile', 't4.md'), M4.join('\n') + '\n');

  console.log('T3 anderer Stand:', JSON.stringify(Z.andererStand), '| Klasse 1-3:', JSON.stringify(Z.klasse123));
  console.log('T3 Totalverlust:', JSON.stringify(Z.totalverlust.haupt), JSON.stringify(Z.totalverlust.streng));
  console.log('T3 Matrix:', JSON.stringify(Z.grundMatrix));
  console.log('T3 PM 45:', JSON.stringify(Z.pm45), '| PM 39 im Panel:', JSON.stringify(Z.pm39ImPanel));
  console.log('T3 Panelrand:', JSON.stringify(Z.panelrand));
  console.log('T1 Pausen:', JSON.stringify(P.jeX), 'echte Enden im Fenster', P.echteEndenImFenster, 'Pausen > 10:', P.pausenUeber10Handelstage);
  console.log('T4:', JSON.stringify(Z4));
}

module.exports = { neuerStand: neuerStand, totalverlust: totalverlust };
if (require.main === module) main();
