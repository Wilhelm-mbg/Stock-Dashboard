'use strict';
/* Nachrichten-Stimmung, Tagesdesign — die REGISTRIERTE Messung (Studie Nr. 45, Auftrag Nr. 66, 03.10.2026).
 * Pflichtenheft: VORREGISTRIERUNG.md §2–§8 mit Nachträgen 1–3, Klärungen im Auftrag Nr. 66 §1a. Jede Zahl aus konstanten.js.
 *
 * Ablauf: Tagesdateien lesen -> je Handelstag t das Universum (Klassen 2+3 gepoolt = Urteilszelle; Klassen getrennt nachrichtlich,
 * ohne die Medienliste) -> ton/n über signal.js (tagesSignal, aenderung, rangJeTag — nichts nachgebaut) -> Portfolios Long-Uni und L-S
 * (§4) -> Rendite je Papier Schluss t bis Schluss t+H (Produkt der Panel-Tagesrenditen; Tote und Lücken nach der Regel von `halte`)
 * -> Kosten 2 × umschlagKosten je Portfolio-Seite (§5) -> netto -> momente(paare, H) (Hansen-Hodrick) -> Kontrollen §7 -> Tore §6.
 * Maschine des Prüfstands BENUTZT: universum, Sicht, halte, umschlagKosten, momente, fnv, mulberry32, huerdeVon.
 *
 * ZWEI STUFEN (Auftrag §1a.7): Stufe A (n, se_HH, MDE80, MDE80 an der Schwelle) wird für alle 12 Tests gerechnet und geschrieben,
 * bevor irgendeine Stufe B (Mittel) gerechnet wird. Das Mittel der Bestätigung wird nur gerechnet, wenn Tor 1 besteht.
 *
 * LESARTEN, vor dem Lauf festgelegt (stehen wörtlich im Protokoll, Feld `lesarten`): siehe LESARTEN unten.
 *
 * Aufruf (aus der Repo-Wurzel) — genau EIN Lauf auf den echten Tagesdateien:
 *   node --max-old-space-size=6144 studien/nachrichten-stimmung-tage-2026-09-19/messen.js --echt [--grund "Neustart nach …"]
 * Ohne --echt geschieht nichts (kein Probelauf mit echten Tönen). Kunstdaten: test-messen.js ruft messe() mit eigenem Leser.
 * Schreibt protokoll.json, ERGEBNIS.md und den Abschnitt 13 der VORREGISTRIERUNG.md. Nur lesen an Panel und Tagesdateien.
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
var Q = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var PR = require(path.join(Q, 'pruefstand.js')), K = require(path.join(Q, 'konfig.js')), ST = require(path.join(Q, 'statistik.js'));
var KONST = require(path.join(__dirname, 'konstanten.js')), S = require(path.join(__dirname, 'signal.js'));

var KENNUNG_MESSUNG = 'nachrichten-stimmung-tage-2026-09-19/messung/v1';
var TAGE_ORDNER = 'E:/Markt-Dashboard-Archiv/studien-zellen/gdelt-2017-2026/tage';
var H_URTEIL = KONST.HALTEDAUERN, H_NACHR = KONST.HALTEDAUER_NACHRICHTLICH, H_ALLE = H_URTEIL.concat([H_NACHR]);
var GROESSEN = ['G1', 'G2'], FELD = { G1: 'ton', G2: 'aend' }, PORTFOLIOS = ['longUni', 'ls'], GRUPPEN = ['23', '2', '3'];
var NULL_ZIEHUNGEN = 5, MIN_ARTIKEL_MONAT = 5, ABDECKUNG_MIN_PROZENT = 80;
var TESTS = [];
GROESSEN.forEach(function (G) { H_URTEIL.forEach(function (H) { PORTFOLIOS.forEach(function (pf) { TESTS.push({ key: G + '|' + H + '|' + pf, G: G, H: H, pf: pf }); }); }); });

var LESARTEN = [
  'Tagesdatei -> Signal: je Symbol n Artikel mit Stempel = letzterStempel und Ton = ton der Tageszeile an tagesSignal (Leck-Klinke und 3-Artikel-Schwelle wirken dort); der Ton des Signals ist der von tagesSignal zurückgegebene.',
  'Universum = universum(T, t, {klassen: [2, 3]}) ohne die 25 Kürzel der Medienliste (§2: sie fallen aus dem Universum); gelesen aus datenbau/namenskarte-v2.json.',
  'G2: die 20 letzten definierten Tages-Töne des Symbols sind Handelstage < t mit definiertem Ton, unabhängig von der Universumszugehörigkeit an jenen Tagen; Nicht-Handelstage gehen in kein Signal ein.',
  'Dezil = max(2, ceil(m/10)) nach dem Text von §4 (vorpruefung.js rundete kaufmännisch).',
  'Kosten = registrierte Formel 2 × umschlagKosten(T, w_{t-H}, w_t, t) je Portfolio-Seite (Long-Uni: Dezil + Universum; L-S: oben + unten); fehlt die Tranche t-H, gilt der Aufbau aus dem Leeren. Die Formel liegt bei Umschlag über 50 % über der im selben Absatz genannten Obergrenze (ein Umlauf je Seite); die Obergrenze steht je Test als `obergrenze` daneben, geurteilt wird mit der registrierten Formel.',
  'Urteil: Bedingungen 1 und 2 von §6 auf der ganzen Zelle UND (Urteil aus der Bestätigung) auf der Bestätigungshälfte; Entdeckung = Mittel netto der ungeraden Jahre (Jahr des Signaltags).',
  'Placebo 1: die Größe des Tages t + 21 Handelstage, dem Tag t zugeordnet, gelesen über Sicht mit Orakelschlüssel. Placebo 2: die Werte der Größe je Tag unter den definierten Symbolen permutiert, je Ziehung k ein Strom mulberry32(fnv(Saat#k)) in fester Reihenfolge (Tage aufsteigend, G1 vor G2).',
  'Orakel: Größe = Vorzeichen der künftigen H-Tage-Rendite (Sicht mit Schlüssel) auf dem definierten Universum von G1, durch dieselbe Rang- und Dezil-Strecke; Δ = oberstes minus unterstes Dezil.',
  'Nullpunkt: Zufallsdezil gegen Universum und oben gegen unten, 5 Ziehungen, Saat der Vorprüfung, in zwei Fassungen: `voll` (ganzes Universum) und `definiert` (Symbole mit definiertem Ton); Schranke |Mittel|/se < 3 in jeder Zelle. Kursloses Signal: Zufallsgröße auf dem ganzen Universum durch die Rang-Strecke.',
  'Vorprüfungstor: Paar-sd des Zufallsdezils (gepoolt, 3 Haltedauern × 2 Portfolios) im Verhältnis zu vorpruefung.json innerhalb [1/1,5; 1,5] — in BEIDEN Fassungen; Klassen getrennt nachrichtlich.',
  'Abdeckungstor: Rechnung wie Nr. 44 (studien/gdelt-abdeckung-2026-09-19/auswerten.js, Abschnitte (a) und (f); ABDECKUNG.md §e/§f): je Monat der Anteil der Klassenmitglieder mit >= 5 Artikeln (n + nSpaet, alle Kalendertage des Monats), je Jahr der Median über die Monate (lineares Quantil, eine Nachkommastelle), bestanden ab 80 %. Mitglieder = Universum am ersten Handelstag des Jahres (Stichtagsregel von Nr. 44), ohne Medienliste.'
];

function mittel(xs) { var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i]; return xs.length ? s / xs.length : null; }
function mischen(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
/* Quantil und Median wie auswerten.js der Nr. 44 (Zeilen 31–33): linear interpoliert, auf eine Nachkommastelle. */
function quantil(sortiert, q) { if (!sortiert.length) return null; var p = (sortiert.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return +(sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (p - lo)).toFixed(1); }
function median(l) { var s = l.slice().sort(function (x, y) { return x - y; }); return s.length ? quantil(s, 0.5) : null; }
function kalendertage(von, bis) { var aus = [], d = Date.parse(von + 'T00:00:00Z'), e = Date.parse(bis + 'T00:00:00Z'); for (; d <= e; d += 86400000) aus.push(new Date(d).toISOString().slice(0, 10)); return aus; }
function folgetagStempel(iso) { return new Date(Date.parse(iso + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10).replace(/-/g, '') + '150000'; }
function innerhalbFaktor(wert, bezug, faktor) { return wert > 0 && bezug > 0 && wert / bezug <= faktor && wert / bezug >= 1 / faktor; }

/** Universum der Studie: Klassen 2 und 3 punkt-in-Zeit aus dem Prüfstand, ohne die Medienliste (§2). */
function universumStudie(T, t, medien) {
  var u = PR.universum(T, t, { klassen: KONST.KLASSEN });
  return { aTag: u.aTag, liste: u.liste.filter(function (e) { return !medien[T.symName[e.sym]]; }) };
}

/** Rendite je Papier vom Schluss t bis zum Schluss des H-ten Handelstags danach: Produkt (1 + rendite/100) über die Folgetage (§4).
 *  Tote und Lücken nach der Regel von `halte` (pruefstand.js): Reihe zu Ende -> eine Buchung (Totalverlust-Grund: -100, sonst 0), danach
 *  Kasse; Lücke (Reihe kommt wieder) = 0 an dem Tag; NaN = 0. `zeile(sym, tag)` ist der Zugriff: T.zeileVon für die Zielgröße,
 *  sicht.zeile für das Orakel (Klinke des Prüfstands). hListe aufsteigend; Rückgabe je H die Rendite in Prozent oder null, wenn die
 *  Periode über das Panel hinausreicht. */
function schlussRenditen(T, zeile, sym, folge, hListe, totalverlust, z) {
  var g = T.g, f = 1, lebt = true, aus = [], hi = 0, hMax = hListe[hListe.length - 1];
  for (var i = 0; i < hMax; i++) {
    if (i >= folge.length) break;
    if (lebt) {
      var d = folge[i], zl = zeile(sym, d);
      if (zl < 0) {
        var letzte = T.letzteZeile(sym);
        if (letzte >= 0 && g.tag[letzte] < d) { var grund = T.endeGrund[sym]; if (grund && totalverlust[grund]) { f = 0; z.toteTotalverlust++; } z.tote++; lebt = false; }
        else z.luecken++;
      } else { var r = g.rendite[zl]; if (r === r) f *= 1 + r / 100; }
    }
    if (i + 1 === hListe[hi]) { aus.push(100 * (f - 1)); hi++; }
  }
  while (aus.length < hListe.length) aus.push(null);
  return aus;
}

/** Zugriff auf das Tagessignal eines Tages d unter der Klinke des Prüfstands: ohne Schlüssel zählt Sicht jeden Zugriff auf d > t und
 *  es kommt nichts zurück; mit Schlüssel (deklarierter Placebo) wird der Zugriff als Placebo-Zugriff gezählt. */
function signalVon(sicht, d, SIG, zaehler) {
  var vor = sicht.verstoesse();
  sicht.zeile(0, d);
  if (sicht.verstoesse() > vor) return null;
  if (d > sicht.tag) zaehler.placeboZugriffe++;
  return SIG[d] || null;
}

/** Rang je Tag (signal.js) -> oberstes/unterstes Dezil und definiertes Universum. vonName: Name -> Mitglied. */
function bildePortfolio(werte, vonName) {
  var rang = S.rangJeTag(werte), def = [];
  Object.keys(rang).forEach(function (n) { if (rang[n] !== null) def.push(n); });
  if (def.length < KONST.MIN_UNIVERSUM_JE_TAG) return { m: def.length, duenn: true };
  def.sort(function (a, b) { return rang[a] - rang[b]; });
  var d = Math.max(2, Math.ceil(def.length / 10)), mk = function (n) { return vonName[n]; };
  return { m: def.length, d: d, uni: def.map(mk), bot: def.slice(0, d).map(mk), top: def.slice(def.length - d).map(mk) };
}
function gewichte(L) { var w = {}; L.forEach(function (m) { w[m.sym] = 1 / L.length; }); return w; }

/** Tagesdateien -> Tagessignale je Handelstag (SIG[Kalenderindex]) und Artikel je Monat (Abdeckungstor). Wirft bei einem Leck. */
function baueSignale(T, leser, VON, BIS, isoZuIdx, zaehler) {
  var SIG = {}, hist = {}, artikelJeMonat = {}, kennungen = {};
  kalendertage(VON, BIS).forEach(function (iso) {
    var idx = isoZuIdx[iso], datei = leser(iso);
    if (!datei) { if (idx !== undefined) zaehler.handelstageOhneDatei.push(iso); return; }
    if (datei.tag !== iso || typeof datei.dateien !== 'number' || !datei.symbole) throw new Error('Tagesdatei ' + iso + ' hat nicht das Format aus gkg-tage.js');
    zaehler.tagesdateien++;
    kennungen[datei.kennung + ' · ' + datei.karte] = (kennungen[datei.kennung + ' · ' + datei.karte] || 0) + 1;
    var mon = artikelJeMonat[iso.slice(0, 7)] || (artikelJeMonat[iso.slice(0, 7)] = {});
    var namen = Object.keys(datei.symbole);
    namen.forEach(function (name) { var e = datei.symbole[name], a = mon[name] || (mon[name] = [0, 0]); a[0] += (e.n || 0) + (e.nSpaet || 0); a[1] += e.n || 0; });
    if (idx === undefined) return;                                  /* kein Handelstag: geht in kein Signal ein (Nachtrag 1 Punkt 3) */
    zaehler.tagesdateienAnHandelstagen++;
    var tag = { iso: iso, dateien: datei.dateien }, grund = S.tagUndefiniert(tag);
    if (grund) zaehler.handelstageUndefiniert[grund] = (zaehler.handelstageUndefiniert[grund] || 0) + 1;
    var sg = { grund: grund, ton: {}, aend: {}, n: {}, nSpaet: {} };
    namen.forEach(function (name) {
      var e = datei.symbole[name];
      sg.n[name] = e.n || 0; sg.nSpaet[name] = e.nSpaet || 0;
      if (!(e.n > 0)) return;                                       /* kein Artikel bis 16:00 ET: ton ist null (Nachtrag 1 Punkt 4) */
      var s = S.tagesSignal(new Array(e.n).fill({ stempel: e.letzterStempel, ton: e.ton }), tag);   /* wirft bei Stempel nach t */
      zaehler.tageszeilen++; zaehler.artikelBis16 += e.n;
      if (s.n !== e.n) zaehler.zeilenStempelNichtImSignal++;
      if (s.ton === null) return;
      if (Math.abs(s.ton - e.ton) > 1e-9 * Math.max(1, Math.abs(e.ton))) zaehler.tonAbweichung++;
      sg.ton[name] = s.ton;
      var h = hist[name] || (hist[name] = []), a = S.aenderung(s.ton, h);
      if (a !== null) sg.aend[name] = a;
      h.push(s.ton); if (h.length > KONST.GLEITFENSTER_TAGE) h.shift();
    });
    SIG[idx] = sg;
  });
  return { SIG: SIG, artikelJeMonat: artikelJeMonat, kennungen: kennungen };
}

/** Abdeckungstor nach der Rechnung von Nr. 44 (siehe LESARTEN). feld 0 = n + nSpaet (Tor), 1 = nur n bis 16:00 ET (nachrichtlich). */
function abdeckung(T, artikelJeMonat, stichtage, medien) {
  var aus = { regel: '>= ' + ABDECKUNG_MIN_PROZENT + ' % der Klassenmitglieder mit >= ' + MIN_ARTIKEL_MONAT + ' Artikeln je Monat, Median über die Monate des Jahres', jeJahrKlasse: {}, nichtMessbar: [], bestanden: true };
  Object.keys(stichtage).sort().forEach(function (jahr) {
    var u = universumStudie(T, stichtage[jahr], medien), monate = Object.keys(artikelJeMonat).filter(function (m) { return m.slice(0, 4) === jahr; }).sort();
    KONST.KLASSEN.forEach(function (kl) {
      var namen = u.liste.filter(function (e) { return e.klasse === kl; }).map(function (e) { return T.symName[e.sym]; });
      function anteile(feld) { return monate.map(function (m) { var ab = namen.filter(function (n) { return artikelJeMonat[m][n] && artikelJeMonat[m][n][feld] >= MIN_ARTIKEL_MONAT; }).length; return namen.length ? 100 * ab / namen.length : 0; }); }
      var a0 = anteile(0), med = median(a0), ok = med !== null && med >= ABDECKUNG_MIN_PROZENT;
      aus.jeJahrKlasse[jahr + '|' + kl] = { stichtag: T.kal.tage[stichtage[jahr]], mitglieder: namen.length, monate: monate.length, anteilAb5Median: med, anteilAb5Min: a0.length ? +Math.min.apply(null, a0).toFixed(1) : null, nurBis16Median: median(anteile(1)), bestanden: ok };
      if (!ok) { aus.bestanden = false; aus.nichtMessbar.push(jahr + ' Klasse ' + kl); }
    });
  });
  return aus;
}

/* ---------- Statistik in zwei Stufen ---------- */
function paare(P, feld) { return P.map(function (p) { return { t: p.t, x: feld === 'n' ? p.b - p.k : p.b }; }); }
/** Stufe A: n, se_HH, MDE80 — ohne das Mittel herauszugeben. Gerechnet auf der Netto-Reihe (das Urteil fällt netto). */
function stufeA(P, H) { var m = ST.momente(paare(P, 'n'), H); return { n: P.length, seHH: m.se, mde80: m.se == null ? null : KONST.MDE_FAKTOR * m.se, mde80Schwelle: m.se == null ? null : KONST.MDE_FAKTOR_T3 * m.se, hh0: !!m.hh0 }; }
/** Stufe B: die Mittel. Wird für gesperrte Zellen (Bestätigung ohne Tor 1) nie aufgerufen. */
function stufeB(P, H) {
  var mb = ST.momente(paare(P, 'b'), H), mn = ST.momente(paare(P, 'n'), H);
  return { mittelBrutto: mb.mittel, mittelNetto: mn.mittel, tHH: mn.t, tHHBrutto: mb.t, seHHBrutto: mb.se, paarSd: mn.sd, hh0: !!mn.hh0,
    kosten: mittel(P.map(function (p) { return p.k; })), umschlag: mittel(P.map(function (p) { return p.u; })), obergrenze: mittel(P.map(function (p) { return p.og; })) };
}
function teile(P) {
  var E = [], B = [], J = {};
  P.forEach(function (p) { var j = p.iso.slice(0, 4); (+j % 2 === 1 ? E : B).push(p); (J[j] = J[j] || []).push(p); });
  return { E: E, B: B, J: J, L: P.slice(-KONST.AKTUALITAET_TAGE) };
}
function stufeAVoll(P, H) {
  var t = teile(P), jahre = {};
  Object.keys(t.J).sort().forEach(function (j) { jahre[j] = stufeA(t.J[j], H); });
  return { gesamt: stufeA(P, H), entdeckung: stufeA(t.E, H), bestaetigung: stufeA(t.B, H), letzte250: stufeA(t.L, H), jahre: jahre };
}
function stufeBVoll(test, P, H) {
  var t = teile(P), A = test.stufeA;
  test.stufeB = stufeB(P, H);
  test.entdeckung = Object.assign({ jahre: 'ungerade', n: t.E.length }, stufeB(t.E, H));
  var schwelle = A.bestaetigung.mde80 == null ? null : 4 * A.bestaetigung.mde80;
  test.tor1 = { entdeckungNetto: test.entdeckung.mittelNetto, viermalBestaetigungsMde80: schwelle, bestanden: typeof test.entdeckung.mittelNetto === 'number' && schwelle !== null && test.entdeckung.mittelNetto >= schwelle };
  test.bestaetigung = test.tor1.bestanden
    ? Object.assign({ jahre: 'gerade', n: t.B.length, gerechnet: true }, stufeB(t.B, H))
    : { jahre: 'gerade', n: t.B.length, gerechnet: false, mittel: null, grund: 'Tor 1 nicht bestanden: Entdeckung ' + f4(test.entdeckung.mittelNetto) + ' Pp < 4 × Bestätigungs-MDE80 = ' + f4(schwelle) + ' Pp — das Mittel der Bestätigung wurde nicht gerechnet' };
  test.jahresscheiben = {};
  Object.keys(t.J).sort().forEach(function (j) { test.jahresscheiben[j] = Object.assign({}, A.jahre[j], stufeB(t.J[j], H)); });
  test.letzte250 = Object.assign({ von: t.L.length ? t.L[0].iso : null, bis: t.L.length ? t.L[t.L.length - 1].iso : null }, A.letzte250, stufeB(t.L, H));
}
function f4(x) { return x == null ? '-' : x.toFixed(4); }

/** Urteil wörtlich nach §6: `belegt` nur, wenn alle fünf Bedingungen und alle Tore gelten; sonst der MDE80-Satz. */
function urteilVon(bed, tore, mde80) {
  var alle = Object.keys(bed).every(function (k) { return bed[k] === true; }) && Object.keys(tore).every(function (k) { return tore[k] === true; });
  return alle ? 'belegt' : 'nicht belegt: nichts oberhalb von ' + (mde80 == null ? '?' : mde80.toFixed(3).replace('.', ',')) + ' Pp je Periode';
}

/** Die Messung. opt: { T (Tafel), tagesdatei(iso) -> Objekt|null, von, bis, vorpruefung, medien, sag, nachStufeA(teil), reihen } */
function messe(opt) {
  var T = opt.T, sag = opt.sag || function () {}, t0 = Date.now();
  var VON = opt.von || KONST.FENSTER_VON, BIS = opt.bis || KONST.FENSTER_BIS;
  var V = opt.vorpruefung || JSON.parse(fs.readFileSync(path.join(__dirname, 'vorpruefung.json'), 'utf8'));
  var medien = {}; (opt.medien || JSON.parse(fs.readFileSync(path.join(__dirname, 'datenbau', 'namenskarte-v2.json'), 'utf8')).medienAusgeschlossen.liste).forEach(function (s) { medien[s] = true; });
  var totalverlust = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (g) { totalverlust[g] = true; });
  var handelstage = [], ordinal = {}, isoZuIdx = {};
  for (var tt = 0; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) { ordinal[tt] = handelstage.length; handelstage.push(tt); isoZuIdx[T.kal.tage[tt]] = tt; }
  var signaltage = handelstage.filter(function (t) { var iso = T.kal.tage[t]; return iso >= VON && iso <= BIS; });
  var zaehler = { signaltage: signaltage.length, tagesdateien: 0, tagesdateienAnHandelstagen: 0, handelstageOhneDatei: [], handelstageUndefiniert: {}, tageszeilen: 0, artikelBis16: 0,
    zeilenStempelNichtImSignal: 0, tonAbweichung: 0, placeboZugriffe: 0, ohneUniversum: 0, ohnePeriodenende: {}, duenn: {}, placebo1Duenn: { G1: 0, G2: 0 }, nullpunktDuenn: {},
    renditen: { tote: 0, toteTotalverlust: 0, luecken: 0 }, halte: { tote: 0, toteTotalverlust: 0, luecken: 0 } };

  var bau = baueSignale(T, opt.tagesdatei, VON, BIS, isoZuIdx, zaehler), SIG = bau.SIG;
  sag('Signale gebaut: ' + zaehler.tagesdateien + ' Tagesdateien, ' + zaehler.tagesdateienAnHandelstagen + ' an Handelstagen, ' + zaehler.tageszeilen + ' Tageszeilen, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

  var reihen = {}, tranchen = {}, definiert = {}, jeJahr = {}, verstoesse = 0, beispiele = [], positiv = null, stichtage = {};
  function R(k) { return reihen[k] || (reihen[k] = []); }
  var rndP2 = {}; for (var kk = 1; kk <= KONST.PLACEBO_ZIEHUNGEN; kk++) rndP2[kk] = ST.mulberry32(ST.fnv(KONST.SAAT_VORPRUEFUNG + '#' + kk));
  var H_MAX = H_ALLE[H_ALLE.length - 1], zOrakel = { tote: 0, toteTotalverlust: 0, luecken: 0 };

  signaltage.forEach(function (t) {
    var iso = T.kal.tage[t], ord = ordinal[t], jahr = iso.slice(0, 4);
    if (!(jahr in stichtage)) stichtage[jahr] = t;
    var u = universumStudie(T, t, medien);
    if (!u.liste.length || u.aTag === null) { zaehler.ohneUniversum++; return; }
    var folge = handelstage.slice(ord + 1, ord + 2 + H_MAX);          /* H_MAX + 1 Folgetage: der letzte nur für halte (Eröffnung) */
    H_ALLE.forEach(function (H) { if (folge.length < H) zaehler.ohnePeriodenende[H] = (zaehler.ohnePeriodenende[H] || 0) + 1; });
    var mit = u.liste.map(function (e, i) { return { e: e, i: i, sym: e.sym, name: T.symName[e.sym], klasse: e.klasse }; });
    var ret = mit.map(function (m) { return schlussRenditen(T, T.zeileVon, m.sym, folge, H_ALLE, totalverlust, zaehler.renditen); });
    function korb(L, hi) { var s = 0; for (var q = 0; q < L.length; q++) s += ret[L[q].i][hi]; return s / L.length; }
    function nachName(L) { var o = {}; L.forEach(function (m) { o[m.name] = m; }); return o; }
    function werteAus(sgX, feld, L) { var w = {}; L.forEach(function (m) { var v = sgX && !sgX.grund ? sgX[feld][m.name] : undefined; w[m.name] = typeof v === 'number' ? v : null; }); return w; }
    function ent(m) { return m.e; }
    function bruttoPush(prefix, p) {
      if (!p || p.duenn) return false;
      H_URTEIL.forEach(function (H, hi) { if (folge.length < H) return; var rT = korb(p.top, hi); R(prefix + '|' + H + '|longUni').push({ t: ord, x: rT - korb(p.uni, hi) }); R(prefix + '|' + H + '|ls').push({ t: ord, x: rT - korb(p.bot, hi) }); });
      return true;
    }
    var gruppe = { '23': mit, '2': mit.filter(function (m) { return m.klasse === 2; }), '3': mit.filter(function (m) { return m.klasse === 3; }) };
    var L23 = gruppe['23'], vn23 = nachName(L23);
    var sicht = PR.Sicht(T, t, {}), sg = signalVon(sicht, t, SIG, zaehler);

    /* nachrichtlich je Jahr: Ton-Niveau, Artikelzahl, Anteil spät, Anteil definiert (gepooltes Universum) */
    var jj = jeJahr[jahr] || (jeJahr[jahr] = { tage: 0, mitglieder: 0, mitArtikel: 0, tonDefiniert: 0, tonSumme: 0, artikelBis16: 0, artikelSpaet: 0 });
    jj.tage++; jj.mitglieder += L23.length;
    if (sg) L23.forEach(function (m) { var n = sg.n[m.name] || 0, sp = sg.nSpaet[m.name] || 0; if (n + sp > 0) jj.mitArtikel++; jj.artikelBis16 += n; jj.artikelSpaet += sp; if (typeof sg.ton[m.name] === 'number' && !sg.grund) { jj.tonDefiniert++; jj.tonSumme += sg.ton[m.name]; } });

    /* ---- die zwei registrierten Größen: Portfolios, Renditen, Kosten ---- */
    var haupt = {};
    GROESSEN.forEach(function (G) {
      GRUPPEN.forEach(function (gr) {
        var L = gruppe[gr], p = bildePortfolio(werteAus(sg, FELD[G], L), nachName(L)), zk = G + '|' + gr;
        (definiert[zk] = definiert[zk] || []).push(p.m);
        if (p.duenn) { zaehler.duenn[zk] = (zaehler.duenn[zk] || 0) + 1; return; }
        if (gr === '23') haupt[G] = p;
        var w = { top: gewichte(p.top), bot: gewichte(p.bot), uni: gewichte(p.uni) }, tk = tranchen[zk] || (tranchen[zk] = {});
        var og = { top: 2 * PR.umschlagKosten(T, {}, w.top, t).kosten, bot: 2 * PR.umschlagKosten(T, {}, w.bot, t).kosten };   /* ein Umlauf je Seite */
        H_ALLE.forEach(function (H, hi) {
          if (folge.length < H || (gr !== '23' && H === H_NACHR)) return;
          var alt = tk[ord - H] || {};
          var kT = PR.umschlagKosten(T, alt.top, w.top, t), kB = PR.umschlagKosten(T, alt.bot, w.bot, t), kU = PR.umschlagKosten(T, alt.uni, w.uni, t);
          var rT = korb(p.top, hi), rB = korb(p.bot, hi), rU = korb(p.uni, hi);
          var lu = { t: ord, iso: iso, b: rT - rU, k: 2 * (kT.kosten + kU.kosten), u: kT.umschlag, og: og.top };
          var ls = { t: ord, iso: iso, b: rT - rB, k: 2 * (kT.kosten + kB.kosten), u: (kT.umschlag + kB.umschlag) / 2, og: og.top + og.bot };
          R(G + '|' + H + '|longUni|' + gr).push(lu); R(G + '|' + H + '|ls|' + gr).push(ls);
          if (gr === '23' && H !== H_NACHR && folge.length > H) {     /* nachrichtlich: Einstieg zur Eröffnung t+1 über halte */
            var a = folge[0], aE = folge[H];
            var hT = PR.halte(T, p.top.map(ent), a, aE, totalverlust, zaehler.halte).periode, hB = PR.halte(T, p.bot.map(ent), a, aE, totalverlust, zaehler.halte).periode, hU = PR.halte(T, p.uni.map(ent), a, aE, totalverlust, zaehler.halte).periode;
            R(G + '|' + H + '|longUni|eroeffnung').push({ t: ord, iso: iso, b: hT - hU, k: lu.k, u: lu.u, og: lu.og });
            R(G + '|' + H + '|ls|eroeffnung').push({ t: ord, iso: iso, b: hT - hB, k: ls.k, u: ls.u, og: ls.og });
          }
        });
        tk[ord] = w; delete tk[ord - H_MAX - 1];
      });
    });

    /* ---- Kontrollen §7 auf der Urteilszelle (gepoolt) ---- */
    /* Placebo 1 (Zukunft): die Größe des Tages t + 21 Handelstage, deklariert über Sicht mit Schlüssel */
    var d21 = handelstage[ord + KONST.PLACEBO_VERSATZ_TAGE], sichtP = PR.Sicht(T, t, { orakel: true });
    var sgP = d21 == null ? null : signalVon(sichtP, d21, SIG, zaehler);
    GROESSEN.forEach(function (G) { if (!bruttoPush('P1|' + G, bildePortfolio(werteAus(sgP, FELD[G], L23), vn23))) zaehler.placebo1Duenn[G]++; });
    /* Placebo 2 (Permutation): Werte der Größe unter den definierten Symbolen des Tages permutiert, 12 Ziehungen */
    GROESSEN.forEach(function (G) {
      var p0 = haupt[G]; if (!p0) return;
      var namen = p0.uni.map(function (m) { return m.name; }).sort(), w0 = werteAus(sg, FELD[G], L23), vals = namen.map(function (n) { return w0[n]; });
      for (var k = 1; k <= KONST.PLACEBO_ZIEHUNGEN; k++) {
        var gem = mischen(vals.slice(), rndP2[k]), w = {};
        namen.forEach(function (n, q) { w[n] = gem[q]; });
        bruttoPush('P2|' + k + '|' + G, bildePortfolio(w, vn23));
      }
    });
    /* Orakel: Vorzeichen der künftigen H-Tage-Rendite, gelesen über Sicht mit Schlüssel; Δ = oberstes − unterstes Dezil */
    if (haupt.G1) {
      var sichtO = PR.Sicht(T, t, { orakel: true }), rO = {};
      haupt.G1.uni.forEach(function (m) { rO[m.name] = schlussRenditen(T, sichtO.zeile, m.sym, folge, H_URTEIL, totalverlust, zOrakel); });
      H_URTEIL.forEach(function (H, hi) {
        if (folge.length < H) return;
        var w = {}; haupt.G1.uni.forEach(function (m) { var r = rO[m.name][hi]; w[m.name] = r > 0 ? 1 : r < 0 ? -1 : 0; });
        var p = bildePortfolio(w, vn23);
        R('OR|' + H).push({ t: ord, x: korb(p.top, hi) - korb(p.bot, hi) });
      });
    }
    /* Nullpunkt: Zufallsdezil gegen Universum, 5 Ziehungen, Saat der Vorprüfung — volles und definiertes Universum */
    GRUPPEN.forEach(function (gr) {
      [['voll', gruppe[gr]], ['definiert', sg && !sg.grund ? gruppe[gr].filter(function (m) { return typeof sg.ton[m.name] === 'number'; }) : []]].forEach(function (v) {
        var L = v[1], nk = v[0] + '|' + gr;
        if (L.length < KONST.MIN_UNIVERSUM_JE_TAG) { zaehler.nullpunktDuenn[nk] = (zaehler.nullpunktDuenn[nk] || 0) + 1; return; }
        var d = Math.max(2, Math.ceil(L.length / 10));
        for (var j = 0; j < NULL_ZIEHUNGEN; j++) {
          var perm = mischen(L.slice(), ST.mulberry32(ST.fnv(KONST.SAAT_VORPRUEFUNG + '|' + gr + '|' + iso + '|' + j + (v[0] === 'voll' ? '' : '|definiert'))));
          var top = perm.slice(0, d), bot = perm.slice(perm.length - d);
          H_URTEIL.forEach(function (H, hi) {
            if (folge.length < H) return;
            var rT = korb(top, hi);
            R('NP|' + nk + '|' + H + '|longUni|' + j).push({ t: ord, x: rT - korb(L, hi) }); R('NP|' + nk + '|' + H + '|ls|' + j).push({ t: ord, x: rT - korb(bot, hi) });
          });
        }
      });
    });
    /* Kursloses Signal: Zufallsgröße ohne Kurs- und Textbezug auf dem ganzen Universum, durch die Rang-Strecke */
    var rndK = ST.mulberry32(ST.fnv(KONST.KENNUNG + '|kurslos|' + iso)), wK = {};
    L23.map(function (m) { return m.name; }).sort().forEach(function (n) { wK[n] = rndK(); });
    bruttoPush('KL', bildePortfolio(wK, vn23));

    /* Positivkontrolle beider Klinken, einmal am ersten Signaltag mit Portfolio */
    if (!positiv && haupt.G1 && folge.length) {
      var s2 = PR.Sicht(T, t, {}), z2 = signalVon(s2, folge[0], SIG, { placeboZugriffe: 0 });
      var s3 = PR.Sicht(T, t, {}); schlussRenditen(T, s3.zeile, haupt.G1.uni[0].sym, folge, [1], totalverlust, { tote: 0, toteTotalverlust: 0, luecken: 0 });
      var geworfen = false;
      try { S.tagesSignal(new Array(KONST.MIN_ARTIKEL).fill({ stempel: folgetagStempel(iso), ton: 1 }), { iso: iso, dateien: 96 }); } catch (e) { geworfen = /Leck/.test(e.message); }
      positiv = { tag: iso, sichtTagesdateiFolgetag: { verstoesse: s2.verstoesse(), verweigert: z2 === null }, sichtPanelFolgetag: { verstoesse: s3.verstoesse() }, tagesSignalStempelFolgetag: { geworfen: geworfen } };
    }
    verstoesse += sicht.verstoesse(); sicht.beispiele().forEach(function (b) { if (beispiele.length < 5) beispiele.push(b); });
  });
  sag('Signaltage durchlaufen: ' + signaltage.length + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

  /* ---------- Zähler ---------- */
  zaehler.definierteSymboleJeTag = {};
  Object.keys(definiert).forEach(function (k) { var s = definiert[k].slice().sort(function (a, b) { return a - b; }); zaehler.definierteSymboleJeTag[k] = { tage: s.length, mittel: +mittel(s).toFixed(1), min: s[0], p5: quantil(s, 0.05), median: quantil(s, 0.5), max: s[s.length - 1] }; });
  zaehler.jeJahr = {};
  Object.keys(jeJahr).sort().forEach(function (j) { var x = jeJahr[j]; zaehler.jeJahr[j] = { signaltage: x.tage, mitgliederJeTag: +(x.mitglieder / x.tage).toFixed(1), definiertJeTag: +(x.tonDefiniert / x.tage).toFixed(1), anteilDefiniert: +(x.tonDefiniert / x.mitglieder).toFixed(4), anteilMitArtikel: +(x.mitArtikel / x.mitglieder).toFixed(4), tonMittel: x.tonDefiniert ? +(x.tonSumme / x.tonDefiniert).toFixed(4) : null, artikelBis16JeMitgliedTag: +(x.artikelBis16 / x.mitglieder).toFixed(2), anteilSpaet: x.artikelBis16 + x.artikelSpaet ? +(x.artikelSpaet / (x.artikelBis16 + x.artikelSpaet)).toFixed(4) : null }; });
  var undefTage = 0; Object.keys(zaehler.handelstageUndefiniert).forEach(function (g) { undefTage += zaehler.handelstageUndefiniert[g]; });
  zaehler.handelstageUndefiniertGesamt = undefTage;

  /* ---------- Stufe A: für alle 12 Tests, vor jedem Mittel ---------- */
  var ablauf = [], tests = {};
  TESTS.forEach(function (k) { tests[k.key] = { groesse: k.G, haltedauer: k.H, portfolio: k.pf, universum: 'Klassen 2+3 gepoolt', stufeA: stufeAVoll(R(k.key + '|23'), k.H) }; });
  ablauf.push('Stufe A fuer ' + Object.keys(tests).length + ' Tests gerechnet');
  var P = { kennung: KONST.KENNUNG, kennungMessung: KENNUNG_MESSUNG, panel: T.stand.kennung, panelStand: T.stand.stand, datenbau: bau.kennungen, vorpruefung: V.kennung,
    stand: new Date().toISOString(), stufe: 'A', fenster: [VON, BIS], haltedauern: H_URTEIL, haltedauerNachrichtlich: H_NACHR, klassen: KONST.KLASSEN, testzahl: TESTS.length,
    mdeFaktor: KONST.MDE_FAKTOR, mdeFaktorSchwelle: KONST.MDE_FAKTOR_T3, lesarten: LESARTEN, zaehler: zaehler, tests: tests };
  if (TESTS.length !== KONST.TESTZAHL) throw new Error('Testzahl ' + TESTS.length + ' ungleich registrierter Testzahl ' + KONST.TESTZAHL);
  if (opt.nachStufeA) opt.nachStufeA(P);
  ablauf.push('Stufe A geschrieben');

  /* ---------- Kontrollen §7 ---------- */
  var KO = {};
  KO.placebo1 = { bau: 'Größe des Tages t + ' + KONST.PLACEBO_VERSATZ_TAGE + ' Handelstage, eine Reihe', schranke: '|Mittel brutto| < ' + KONST.PLACEBO_SCHRANKE_MITTEL_PP + ' Pp und |t_HH| < ' + KONST.T_SCHWELLE, zellen: {}, bestanden: true };
  KO.placebo2 = { bau: 'Permutation je Tag, ' + KONST.PLACEBO_ZIEHUNGEN + ' Ziehungen', schranke: '|Mittel über ' + KONST.PLACEBO_ZIEHUNGEN + '| < ' + KONST.PLACEBO_SCHRANKE_MITTEL_PP + ' Pp; höchstens ' + KONST.PLACEBO_MAX_T3 + ' mit |t_HH| >= ' + KONST.T_SCHWELLE, zellen: {}, bestanden: true };
  TESTS.forEach(function (k) {
    var m = ST.momente(R('P1|' + k.key), k.H), ok = m.n > 1 && Math.abs(m.mittel) < KONST.PLACEBO_SCHRANKE_MITTEL_PP && Math.abs(m.t) < KONST.T_SCHWELLE;
    KO.placebo1.zellen[k.key] = { n: m.n, mittelBrutto: m.mittel, seHH: m.se, tHH: m.t, bestanden: ok }; if (!ok) KO.placebo1.bestanden = false;
    var mw = [], ts = [], nn = 0;
    for (var j = 1; j <= KONST.PLACEBO_ZIEHUNGEN; j++) { var mj = ST.momente(R('P2|' + j + '|' + k.key), k.H); mw.push(mj.mittel); ts.push(mj.t); nn = mj.n; }
    var mm = mittel(mw), t3 = ts.filter(function (x) { return Math.abs(x) >= KONST.T_SCHWELLE; }).length, ok2 = nn > 1 && Math.abs(mm) < KONST.PLACEBO_SCHRANKE_MITTEL_PP && t3 <= KONST.PLACEBO_MAX_T3;
    KO.placebo2.zellen[k.key] = { n: nn, mittelUeberZiehungen: mm, tMaxBetrag: Math.max.apply(null, ts.map(Math.abs)), anzahlTab3: t3, bestanden: ok2 }; if (!ok2) KO.placebo2.bestanden = false;
  });
  KO.orakel = { bau: 'Vorzeichen der künftigen H-Tage-Rendite, oberstes − unterstes Dezil', schranke: 'Δ brutto >= ' + H_URTEIL.map(function (H) { return KONST.ORAKEL_MIN_DELTA_PP[H]; }).join(' / ') + ' Pp (H ' + H_URTEIL.join('/') + '), t_HH >= ' + KONST.ORAKEL_MIN_T, zellen: {}, bestanden: true };
  H_URTEIL.forEach(function (H) { var m = ST.momente(R('OR|' + H), H), ok = m.n > 1 && m.mittel >= KONST.ORAKEL_MIN_DELTA_PP[H] && m.t >= KONST.ORAKEL_MIN_T; KO.orakel.zellen[H] = { n: m.n, mittelBrutto: m.mittel, seHH: m.se, tHH: m.t, schranke: KONST.ORAKEL_MIN_DELTA_PP[H], bestanden: ok }; if (!ok) KO.orakel.bestanden = false; });
  KO.nullpunkt = { bau: 'Zufallsdezil gegen Universum, ' + NULL_ZIEHUNGEN + ' Ziehungen', schranke: '|Mittel| / se < ' + KONST.NULLPUNKT_MAX_T + ' in jeder Zelle', zellen: {}, bestanden: true };
  var VT = { regel: 'Paar-sd des Zufallsdezils im Lauf / Paar-sd der Vorprüfung innerhalb [1/' + KONST.VORPRUEFUNG_TOLERANZ + '; ' + KONST.VORPRUEFUNG_TOLERANZ + '], gepoolt, beide Fassungen', zellen: {}, nachrichtlichKlassen: {}, bestanden: true };
  ['voll', 'definiert'].forEach(function (va) { GRUPPEN.forEach(function (gr) { H_URTEIL.forEach(function (H) { PORTFOLIOS.forEach(function (pf) {
    var sds = [], mws = [], ses = [], ts = [], n = 0;
    for (var j = 0; j < NULL_ZIEHUNGEN; j++) { var m = ST.momente(R('NP|' + va + '|' + gr + '|' + H + '|' + pf + '|' + j), H); if (m.n < 30) return; sds.push(m.sd); mws.push(m.mittel); ses.push(m.se); ts.push(Math.abs(m.t)); n = m.n; }
    var key = va + '|' + gr + '|' + H + '|' + pf, se = mittel(ses), ok = Math.abs(mittel(mws)) / se < KONST.NULLPUNKT_MAX_T;
    KO.nullpunkt.zellen[key] = { n: n, paarSd: mittel(sds), mittel: mittel(mws), seHH: se, verhaeltnis: Math.abs(mittel(mws)) / se, tMaxJeZiehung: Math.max.apply(null, ts), bestanden: ok }; if (!ok) KO.nullpunkt.bestanden = false;
    var ref = V.tafel[gr] && V.tafel[gr].haltedauer[H] ? V.tafel[gr].haltedauer[H][pf === 'longUni' ? 'dezilUni' : 'ls'].sd : null;
    var z = { paarSdLauf: mittel(sds), paarSdVorpruefung: ref, verhaeltnis: ref ? mittel(sds) / ref : null, bestanden: ref ? innerhalbFaktor(mittel(sds), ref, KONST.VORPRUEFUNG_TOLERANZ) : false };
    if (gr === '23') { VT.zellen[key] = z; if (!z.bestanden) VT.bestanden = false; } else VT.nachrichtlichKlassen[key] = z;
  }); }); }); });
  if (Object.keys(VT.zellen).length !== 2 * H_URTEIL.length * PORTFOLIOS.length) VT.bestanden = false;
  KO.kurslos = { bau: 'Zufallsgröße ohne Kurs- und Textbezug, ganzes Universum', schranke: '|Mittel| / se < ' + KONST.NULLPUNKT_MAX_T, zellen: {}, bestanden: true };
  H_URTEIL.forEach(function (H) { PORTFOLIOS.forEach(function (pf) { var m = ST.momente(R('KL|' + H + '|' + pf), H), ok = m.n > 1 && Math.abs(m.t) < KONST.NULLPUNKT_MAX_T; KO.kurslos.zellen[H + '|' + pf] = { n: m.n, mittelBrutto: m.mittel, seHH: m.se, tHH: m.t, bestanden: ok }; if (!ok) KO.kurslos.bestanden = false; }); });
  var posOk = !!positiv && positiv.sichtTagesdateiFolgetag.verstoesse > 0 && positiv.sichtTagesdateiFolgetag.verweigert && positiv.sichtPanelFolgetag.verstoesse > 0 && positiv.tagesSignalStempelFolgetag.geworfen;
  KO.leck = { schranke: 'Sicht ohne Schlüssel: 0 Verstöße im Hauptlauf; tagesSignal: kein Wurf im Hauptlauf; Positivkontrolle beider Klinken > 0', verstoesseSichtOhneSchluessel: verstoesse, beispiele: beispiele,
    tagesSignalWuerfeImHauptlauf: 0, placeboZugriffeMitSchluessel: zaehler.placeboZugriffe, positivkontrolle: positiv, positivkontrolleBestanden: posOk, bestanden: verstoesse === 0 && posOk };

  var AB = abdeckung(T, bau.artikelJeMonat, stichtage, medien);
  var tore = { orakel: KO.orakel.bestanden, placebo1: KO.placebo1.bestanden, placebo2: KO.placebo2.bestanden, leckKlinken: KO.leck.bestanden, nullpunkt: KO.nullpunkt.bestanden, kurslosesSignal: KO.kurslos.bestanden, abdeckungstor: AB.bestanden, vorpruefungstor: VT.bestanden };
  var gefallen = Object.keys(tore).filter(function (k) { return !tore[k]; });

  /* ---------- Stufe B und Urteile ---------- */
  ablauf.push('Stufe B begonnen');
  TESTS.forEach(function (k) {
    var te = tests[k.key]; stufeBVoll(te, R(k.key + '|23'), k.H);
    var A = te.stufeA, B = te.stufeB, be = te.bestaetigung;
    te.bestaetigt = te.tor1.bestanden && be.gerechnet && be.mittelNetto > 0 && be.mittelNetto >= A.bestaetigung.mde80 && be.tHH >= KONST.T_SCHWELLE;
    te.bedingungen = { b1NettoPositivUndAbMde80: B.mittelNetto > 0 && B.mittelNetto >= A.gesamt.mde80, b2tHHab3: B.tHH >= KONST.T_SCHWELLE, b3Tor1UndBestaetigung: te.bestaetigt,
      b4AktualitaetLetzte250NichtNegativ: typeof te.letzte250.mittelNetto === 'number' && te.letzte250.mittelNetto >= 0, b5ProtokollBestaetigtUndPlaceboBestanden: te.bestaetigt && KO.placebo1.bestanden && KO.placebo2.bestanden };
    te.kennzeichnung = gefallen.slice();
    te.belegt = urteilVon(te.bedingungen, tore, A.gesamt.mde80) === 'belegt';
    te.urteil = urteilVon(te.bedingungen, tore, A.gesamt.mde80);
  });
  ablauf.push('Stufe B fuer ' + TESTS.length + ' Tests gerechnet');

  /* ---------- nachrichtliche Zeilen (kein Urteil) ---------- */
  var NA = { klassenGetrennt: {}, haltedauer21: {}, einstiegEroeffnung: {} };
  function zeile(Pz, H) { return Pz.length < 30 ? { n: Pz.length, duenn: true } : Object.assign({}, stufeA(Pz, H), stufeB(Pz, H)); }
  ['2', '3'].forEach(function (gr) { TESTS.forEach(function (k) { NA.klassenGetrennt[k.key + '|Klasse ' + gr] = zeile(R(k.key + '|' + gr), k.H); }); });
  GROESSEN.forEach(function (G) { PORTFOLIOS.forEach(function (pf) { NA.haltedauer21[G + '|' + H_NACHR + '|' + pf] = zeile(R(G + '|' + H_NACHR + '|' + pf + '|23'), H_NACHR); }); });
  TESTS.forEach(function (k) { var z = zeile(R(k.key + '|eroeffnung'), k.H); if (!z.duenn) z.differenzBruttoZurHauptzeile = z.mittelBrutto - tests[k.key].stufeB.mittelBrutto; NA.einstiegEroeffnung[k.key] = z; });

  P.stand = new Date().toISOString(); P.stufe = 'B'; P.ablauf = ablauf; P.kontrollen = KO; P.abdeckung = AB; P.vorpruefungstor = VT; P.tore = tore; P.toreGefallen = gefallen; P.maschinentoreBestanden = tore.orakel && tore.placebo1 && tore.placebo2 && tore.leckKlinken;
  P.nachrichtlich = NA; P.dauerS = (Date.now() - t0) / 1000;
  if (opt.reihen) Object.defineProperty(P, 'reihen', { value: reihen, enumerable: false });
  return P;
}

/* ---------- ERGEBNIS.md und Abschnitt 13: nur aus dem Protokoll ---------- */
function z(x, n) { return x == null || x !== x ? '–' : x.toFixed(n == null ? 3 : n).replace('.', ','); }
function jn(b) { return b ? 'ja' : 'nein'; }
var PF_NAME = { longUni: 'Long-Uni', ls: 'L-S' };
function testName(k) { var t = k.split('|'); return t[0] + ' ' + (t[0] === 'G1' ? 'rangTon' : 'rangAend') + ' · H ' + t[1] + ' · ' + PF_NAME[t[2]] + (t[3] ? ' · ' + t[3] : ''); }
function urteilstafel(P) {
  var L = ['| Test | n | MDE₈₀ | MDE₈₀ (t ≥ 3) | Δ̄ brutto | Kosten | Δ̄ netto | se_HH | t_HH | Entdeckung netto | 4 × MDE₈₀ Best. | Tor 1 | Bestätigung netto | letzte 250 netto | Urteil |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  Object.keys(P.tests).forEach(function (k) {
    var t = P.tests[k], A = t.stufeA.gesamt, B = t.stufeB;
    L.push('| ' + testName(k) + ' | ' + A.n + ' | ' + z(A.mde80) + ' | ' + z(A.mde80Schwelle) + ' | ' + z(B.mittelBrutto) + ' | ' + z(B.kosten) + ' | ' + z(B.mittelNetto) + ' | ' + z(A.seHH) + ' | ' + z(B.tHH, 2) + ' | ' + z(t.tor1.entdeckungNetto) + ' | ' + z(t.tor1.viermalBestaetigungsMde80) + ' | ' + (t.tor1.bestanden ? 'bestanden' : 'gesperrt') + ' | ' + (t.bestaetigung.gerechnet ? z(t.bestaetigung.mittelNetto) : 'nicht gerechnet') + ' | ' + z(t.letzte250.mittelNetto) + ' | **' + t.urteil + '** |');
  });
  return L;
}
function ergebnisText(P) {
  var L = [], KO = Object.assign({}, P.kontrollen), Z = P.zaehler;      /* flache Kopie: das Protokoll bleibt unberührt */
  L.push('# ERGEBNIS — Nachrichten-Stimmung aus GDELT, Tagesdesign (Studie Nr. 45, Auftrag Nr. 66)', '');
  L.push('Kennung `' + P.kennung + '`, Messung `' + P.kennungMessung + '`, Panel `' + P.panel + '` (Stand ' + P.panelStand + '), Datenbau ' + Object.keys(P.datenbau).map(function (k) { return '`' + k + '` (' + P.datenbau[k] + ' Tagesdateien)'; }).join(', ') + '. Stand ' + P.stand + '.');
  L.push('Alle Zahlen dieser Datei stammen aus `protokoll.json` (von `messen.js` geschrieben); Pp je Halteperiode. Simulation mit virtuellem Kapital, keine Anlageberatung.', '');
  if (P.laeufe) L.push('Läufe: ' + P.laeufe.map(function (l) { return 'Nr. ' + l.nr + ' Start ' + l.start + ' (' + l.grund + ') — ' + l.status; }).join('; ') + '.' + (P.maschine ? ' Maschine: Commit `' + P.maschine.commit + '`' + (P.maschine.ordnerSauber ? '' : ' (Studienordner nicht sauber)') + ', Node ' + P.maschine.node + '.' : ''), '');
  L.push('## 1. Urteilstafel der 12 Tests (Klassen 2+3 gepoolt, Urteil wörtlich nach §6)', '');
  L = L.concat(urteilstafel(P));
  L.push('', 'MDE₈₀ = 2,8016 × se_HH und MDE₈₀ an der Schwelle = 3,8416 × se_HH stehen im Protokoll in Stufe A und wurden vor jedem Mittel gerechnet und geschrieben. Entdeckung = ungerade Jahre des Signaltags, Bestätigung = gerade Jahre.');
  L.push('Gefallene Kontrollen und Tore (Kennzeichnung aller zwölf Zeilen): ' + (P.toreGefallen.length ? '**' + P.toreGefallen.join(', ') + '** — die Zahlen stehen trotzdem da; das Urteil `belegt` ist damit ausgeschlossen (§7).' : 'keine.'), '');
  L.push('| Test | se_HH brutto | t_HH brutto | Umschlag je Periode | Kosten (registrierte Formel) | Obergrenze laut §5 (ein Umlauf je Seite) | Bedingung 1 | 2 | 3 | 4 | 5 |', '|---|---|---|---|---|---|---|---|---|---|---|');
  var bruttoUnterMde = 0, nettoNegativHalbeKosten = 0, groesstesBrutto = -Infinity;
  Object.keys(P.tests).forEach(function (k) { var t = P.tests[k]; if (t.stufeB.mittelBrutto < t.stufeA.gesamt.mde80) bruttoUnterMde++; if (t.stufeB.mittelBrutto - t.stufeB.kosten / 2 < 0) nettoNegativHalbeKosten++; groesstesBrutto = Math.max(groesstesBrutto, t.stufeB.mittelBrutto); });
  Object.keys(P.tests).forEach(function (k) { var t = P.tests[k], b = t.bedingungen; L.push('| ' + testName(k) + ' | ' + z(t.stufeB.seHHBrutto) + ' | ' + z(t.stufeB.tHHBrutto, 2) + ' | ' + z(t.stufeB.umschlag) + ' | ' + z(t.stufeB.kosten) + ' | ' + z(t.stufeB.obergrenze) + ' | ' + jn(b.b1NettoPositivUndAbMde80) + ' | ' + jn(b.b2tHHab3) + ' | ' + jn(b.b3Tor1UndBestaetigung) + ' | ' + jn(b.b4AktualitaetLetzte250NichtNegativ) + ' | ' + jn(b.b5ProtokollBestaetigtUndPlaceboBestanden) + ' |'); });
  L.push('', 't_HH in der Urteilstafel ist das t der Netto-Reihe (das Urteil fällt netto); se_HH brutto und t_HH brutto stehen hier daneben. In ' + bruttoUnterMde + ' von 12 Tests liegt schon Δ̄ brutto unter MDE₈₀ (größtes Δ̄ brutto ' + z(groesstesBrutto) + ' Pp); mit halben Kosten (1 × umschlagKosten je Seite, die Obergrenze-Lesart von §5) wäre Δ̄ netto in ' + nettoNegativHalbeKosten + ' von 12 Tests negativ — beides aus den Protokollzahlen gerechnet, kein weiterer Lauf.');
  L.push('', '## 2. Kontrollen (§7) — Schranke und Befund', '');
  L.push('| Kontrolle | Schranke | Befund | bestanden |', '|---|---|---|---|');
  function esc(s) { return String(s).replace(/\|/g, '\\|'); }
  ['placebo1', 'placebo2', 'orakel', 'nullpunkt', 'kurslos', 'leck'].forEach(function (k) { KO[k] = Object.assign({}, KO[k], { schranke: esc(KO[k].schranke) }); });
  var p1 = Object.keys(KO.placebo1.zellen).map(function (k) { return KO.placebo1.zellen[k]; }), p2 = Object.keys(KO.placebo2.zellen).map(function (k) { return KO.placebo2.zellen[k]; });
  function maxB(arr, f) { return Math.max.apply(null, arr.map(function (x) { return Math.abs(x[f]); })); }
  L.push('| Placebo 1 (Zukunft, t + 21) | ' + KO.placebo1.schranke + ' | 12 Zellen: größtes \\|Mittel\\| ' + z(maxB(p1, 'mittelBrutto')) + ' Pp, größtes \\|t_HH\\| ' + z(maxB(p1, 'tHH'), 2) + '; gefallen ' + p1.filter(function (x) { return !x.bestanden; }).length + ' von 12, davon allein über die Pp-Schranke (bei \\|t_HH\\| < 3) ' + p1.filter(function (x) { return !x.bestanden && Math.abs(x.tHH) < 3; }).length + ' | ' + jn(KO.placebo1.bestanden) + ' |');
  L.push('| Placebo 2 (Permutation, 12 Ziehungen) | ' + KO.placebo2.schranke + ' | 12 Zellen: größtes \\|Mittel über 12\\| ' + z(maxB(p2, 'mittelUeberZiehungen')) + ' Pp, höchste Zahl mit \\|t\\| ≥ 3: ' + Math.max.apply(null, p2.map(function (x) { return x.anzahlTab3; })) + '; gefallen ' + p2.filter(function (x) { return !x.bestanden; }).length + ' von 12 | ' + jn(KO.placebo2.bestanden) + ' |');
  L.push('| Orakel | ' + KO.orakel.schranke + ' | ' + Object.keys(KO.orakel.zellen).map(function (H) { var o = KO.orakel.zellen[H]; return 'H ' + H + ': ' + z(o.mittelBrutto, 2) + ' Pp, t ' + z(o.tHH, 1); }).join('; ') + ' | ' + jn(KO.orakel.bestanden) + ' |');
  var np = Object.keys(KO.nullpunkt.zellen).map(function (k) { return KO.nullpunkt.zellen[k]; });
  L.push('| Nullpunkt (Zufallsdezil) | ' + KO.nullpunkt.schranke + ' | ' + np.length + ' Zellen: größtes \\|Mittel\\|/se ' + z(maxB(np, 'verhaeltnis'), 2) + ' | ' + jn(KO.nullpunkt.bestanden) + ' |');
  var kl = Object.keys(KO.kurslos.zellen).map(function (k) { return KO.kurslos.zellen[k]; });
  L.push('| Kursloses Signal | ' + KO.kurslos.schranke + ' | 6 Zellen: größtes \\|t_HH\\| ' + z(maxB(kl, 'tHH'), 2) + ' | ' + jn(KO.kurslos.bestanden) + ' |');
  var pk = KO.leck.positivkontrolle || { sichtTagesdateiFolgetag: {}, sichtPanelFolgetag: {}, tagesSignalStempelFolgetag: {} };
  L.push('| Leck-Klinken | ' + KO.leck.schranke + ' | Sicht ohne Schlüssel: ' + KO.leck.verstoesseSichtOhneSchluessel + ' Verstöße; Positivkontrolle am ' + pk.tag + ': Tagesdatei t + 1 ' + pk.sichtTagesdateiFolgetag.verstoesse + ' gezählt, Panel t + 1 ' + pk.sichtPanelFolgetag.verstoesse + ' gezählt, tagesSignal mit Stempel t + 1 ' + (pk.tagesSignalStempelFolgetag.geworfen ? 'wirft' : 'wirft NICHT') + '; deklarierte Placebo-Zugriffe mit Schlüssel: ' + KO.leck.placeboZugriffeMitSchluessel + ' | ' + jn(KO.leck.bestanden) + ' |');
  L.push('', '### Kontrollen je Zelle', '', '| Zelle | Placebo 1: Mittel brutto | se_HH | t_HH | Placebo 2: Mittel über 12 | Zahl \\|t\\| ≥ 3 |', '|---|---|---|---|---|---|');
  Object.keys(KO.placebo1.zellen).forEach(function (k) { var a = KO.placebo1.zellen[k], b = KO.placebo2.zellen[k]; L.push('| ' + testName(k) + ' | ' + z(a.mittelBrutto, 4) + (a.bestanden ? '' : ' ⚑') + ' | ' + z(a.seHH, 4) + ' | ' + z(a.tHH, 2) + ' | ' + z(b.mittelUeberZiehungen, 4) + (b.bestanden ? '' : ' ⚑') + ' | ' + b.anzahlTab3 + ' |'); });
  L.push('', '⚑ = Schranke der Zelle verfehlt.', '');
  L.push('## 3. Tore (§6)', '');
  L.push('- **Maschinentore:** Orakel ' + jn(P.tore.orakel) + ', Placebo 1 ' + jn(P.tore.placebo1) + ', Placebo 2 ' + jn(P.tore.placebo2) + ', Leck-Klinken samt Positivkontrolle ' + jn(P.tore.leckKlinken) + '; weitere Kontrollen: Nullpunkt ' + jn(P.tore.nullpunkt) + ', kursloses Signal ' + jn(P.tore.kurslosesSignal) + '.' + (P.maschinentoreBestanden ? '' : ' **Mindestens ein Maschinentor ist gefallen: nach §6 gilt der Lauf damit als ungültig; die Zahlen stehen gekennzeichnet da (§7), das Urteil `belegt` ist ausgeschlossen.**'));
  L.push('- **Vorprüfungstor:** ' + (P.vorpruefungstor.bestanden ? 'bestanden' : '**gefallen**') + ' — ' + P.vorpruefungstor.regel + '.', '', '| Fassung · Haltedauer · Portfolio | Paar-sd im Lauf | Paar-sd Vorprüfung | Verhältnis | innerhalb |', '|---|---|---|---|---|');
  Object.keys(P.vorpruefungstor.zellen).forEach(function (k) { var v = P.vorpruefungstor.zellen[k], t = k.split('|'); L.push('| ' + t[0] + ' · H ' + t[2] + ' · ' + PF_NAME[t[3]] + ' | ' + z(v.paarSdLauf) + ' | ' + z(v.paarSdVorpruefung) + ' | ' + z(v.verhaeltnis, 2) + ' | ' + jn(v.bestanden) + ' |'); });
  L.push('', '- **Abdeckungstor:** ' + (P.abdeckung.bestanden ? 'bestanden' : '**gefallen** — nicht messbar: ' + P.abdeckung.nichtMessbar.join(', ')) + '. Regel: ' + P.abdeckung.regel + '. Fundstelle der Rechnung: `studien/gdelt-abdeckung-2026-09-19/auswerten.js` (Abschnitte (a) und (f), Funktionen `quantil`/`median`) und `ABDECKUNG.md` §e/§f; Mitglieder = Universum am ersten Handelstag des Jahres, Artikel = n + nSpaet.', '', '| Jahr | Klasse | Mitglieder | Monate | Anteil ≥ 5 Artikel (Median) | kleinster Monat | nur Artikel bis 16:00 ET (Median, nachrichtlich) | bestanden |', '|---|---|---|---|---|---|---|---|');
  Object.keys(P.abdeckung.jeJahrKlasse).forEach(function (k) { var a = P.abdeckung.jeJahrKlasse[k], t = k.split('|'); L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + a.mitglieder + ' | ' + a.monate + ' | ' + z(a.anteilAb5Median, 1) + ' % | ' + z(a.anteilAb5Min, 1) + ' % | ' + z(a.nurBis16Median, 1) + ' % | ' + jn(a.bestanden) + ' |'); });
  L.push('', '## 4. Zähler', '');
  L.push('- Signaltage (Handelstage im Fenster ' + P.fenster.join(' … ') + '): **' + Z.signaltage + '**; Tagesdateien gesamt ' + Z.tagesdateien + ', davon an Panel-Handelstagen ' + Z.tagesdateienAnHandelstagen + '; Handelstage ohne Datei ' + Z.handelstageOhneDatei.length + '; Handelstage undefiniert **' + Z.handelstageUndefiniertGesamt + '** (' + (Object.keys(Z.handelstageUndefiniert).map(function (g) { return g + ': ' + Z.handelstageUndefiniert[g]; }).join(', ') || 'keine') + ').');
  L.push('- Tageszeilen an Handelstagen ' + Z.tageszeilen + ' mit ' + Z.artikelBis16 + ' Artikeln bis 16:00 ET; Zeilen mit Stempel außerhalb des Signals ' + Z.zeilenStempelNichtImSignal + '; Ton-Abweichung Ablage gegen `tagesSignal` ' + Z.tonAbweichung + '.');
  L.push('- Tage unter 20 definierten Symbolen (fallen für die Größe weg; die undefinierten Handelstage sind darin enthalten): ' + (Object.keys(Z.duenn).map(function (k) { return k + ': ' + Z.duenn[k]; }).join(', ') || 'keine') + '. Signaltage ohne Periodenende: ' + (Object.keys(Z.ohnePeriodenende).map(function (h) { return 'H ' + h + ': ' + Z.ohnePeriodenende[h]; }).join(', ') || 'keine') + '.');
  L.push('- Renditen Schluss → Schluss: Tote ' + Z.renditen.tote + ' (davon Totalverlust ' + Z.renditen.toteTotalverlust + '), Lücken ' + Z.renditen.luecken + ' (gezählt über das 21-Tage-Fenster je Mitglied und Signaltag).', '');
  L.push('| Größe · Gruppe | Tage | definierte Symbole je Tag: Mittel | Minimum | P5 | Median | Maximum |', '|---|---|---|---|---|---|---|');
  Object.keys(Z.definierteSymboleJeTag).forEach(function (k) { var d = Z.definierteSymboleJeTag[k]; L.push('| ' + k.replace('|', ' · Gruppe ') + ' | ' + d.tage + ' | ' + z(d.mittel, 1) + ' | ' + d.min + ' | ' + z(d.p5, 1) + ' | ' + z(d.median, 1) + ' | ' + d.max + ' |'); });
  L.push('', '| Jahr | Signaltage | Mitglieder je Tag | definiert je Tag | Anteil definiert | Anteil mit Artikel | Ton-Niveau | Artikel bis 16:00 je Mitglied-Tag | Anteil spät |', '|---|---|---|---|---|---|---|---|---|');
  Object.keys(Z.jeJahr).forEach(function (j) { var y = Z.jeJahr[j]; L.push('| ' + j + ' | ' + y.signaltage + ' | ' + z(y.mitgliederJeTag, 1) + ' | ' + z(y.definiertJeTag, 1) + ' | ' + z(100 * y.anteilDefiniert, 1) + ' % | ' + z(100 * y.anteilMitArtikel, 1) + ' % | ' + z(y.tonMittel, 2) + ' | ' + z(y.artikelBis16JeMitgliedTag, 2) + ' | ' + z(100 * y.anteilSpaet, 1) + ' % |'); });
  L.push('', '## 5. Nachrichtliche Zeilen (tragen kein Urteil)', '', '### Jahresscheiben (Δ̄ netto je Kalenderjahr des Signaltags; in Klammern MDE₈₀)', '');
  var jahre = Object.keys(P.tests[Object.keys(P.tests)[0]].jahresscheiben);
  L.push('| Test | ' + jahre.join(' | ') + ' |', '|---|' + jahre.map(function () { return '---'; }).join('|') + '|');
  Object.keys(P.tests).forEach(function (k) { var js = P.tests[k].jahresscheiben; L.push('| ' + testName(k) + ' | ' + jahre.map(function (j) { return js[j] ? z(js[j].mittelNetto) + ' (' + z(js[j].mde80) + ')' : '–'; }).join(' | ') + ' |'); });
  function tafelNachr(titel, obj) {
    L.push('', '### ' + titel, '', '| Zelle | n | MDE₈₀ | Δ̄ brutto | Kosten | Δ̄ netto | t_HH |', '|---|---|---|---|---|---|---|');
    Object.keys(obj).forEach(function (k) { var x = obj[k]; L.push(x.duenn ? '| ' + testName(k) + ' | ' + x.n + ' | zu wenige Tage | | | | |' : '| ' + testName(k) + ' | ' + x.n + ' | ' + z(x.mde80) + ' | ' + z(x.mittelBrutto) + ' | ' + z(x.kosten) + ' | ' + z(x.mittelNetto) + ' | ' + z(x.tHH, 2) + ' |'); });
  }
  tafelNachr('Klassen getrennt', P.nachrichtlich.klassenGetrennt);
  tafelNachr('Haltedauer ' + P.haltedauerNachrichtlich + ' Handelstage (Brücke zur Machbarkeit)', P.nachrichtlich.haltedauer21);
  L.push('', '### Einstieg zur Eröffnung t + 1 (Haltekonvention der Maschine, `halte`: Eröffnung → Eröffnung)', '', '| Zelle | n | Δ̄ brutto | Differenz zur Hauptzeile (brutto) | Δ̄ netto | t_HH |', '|---|---|---|---|---|---|');
  Object.keys(P.nachrichtlich.einstiegEroeffnung).forEach(function (k) { var x = P.nachrichtlich.einstiegEroeffnung[k]; L.push('| ' + testName(k) + ' | ' + x.n + ' | ' + z(x.mittelBrutto) + ' | ' + z(x.differenzBruttoZurHauptzeile) + ' | ' + z(x.mittelNetto) + ' | ' + z(x.tHH, 2) + ' |'); });
  L.push('', '## 6. Lesarten (vor dem Lauf festgelegt, im Protokoll Feld `lesarten`)', '');
  P.lesarten.forEach(function (s, i) { L.push((i + 1) + '. ' + s); });
  L.push('', '## 7. Was die Tafel nicht weiß', '', 'Wie §11 der Vorregistrierung (Dividenden fehlen, Nebenerwähnungen, Sammelmeldungen, Crawl-Zeit ≥ Veröffentlichung). Dazu: das Mittel einer gesperrten Bestätigung ist nicht gerechnet, ließe sich aber aus dem Gesamtmittel, dem Entdeckungsmittel und den Jahresscheiben ableiten — die registrierte Tafel weist beides aus.', '');
  L.push('---', '', '*Geschrieben von `messen.js` aus `protokoll.json`. Simulation mit virtuellem Kapital, keine Anlageberatung. Quelle der Stimmungsdaten: GDELT Project, https://www.gdeltproject.org/.*', '');
  return L.join('\n');
}
function abschnitt13(P) {
  var L = ['', '---', '', '## 13. Ergebnis (vom Lauf geschrieben, ' + P.stand.slice(0, 10) + ')', ''];
  L.push('Lauf `' + P.kennungMessung + '` auf Panel `' + P.panel + '` und ' + P.zaehler.tagesdateien + ' Tagesdateien des Datenbaus; Maschine (messen.js, test-messen.js grün) Commit `' + (P.maschine ? P.maschine.commit : '?') + '`. Zahlen aus `protokoll.json`, vollständige Tafeln in `ERGEBNIS.md`. Pp je Halteperiode.', '');
  L = L.concat(urteilstafel(P));
  L.push('', 'Kontrollen und Tore: ' + Object.keys(P.tore).map(function (k) { return k + ' ' + (P.tore[k] ? 'bestanden' : '**gefallen**'); }).join(', ') + '. Signaltage ' + P.zaehler.signaltage + ', davon undefiniert ' + P.zaehler.handelstageUndefiniertGesamt + '.', '');
  return L.join('\n');
}
function pruefeWoerter(text, was) { if (/kante|handelbar|da ist nichts/i.test(text)) throw new Error(was + ' enthält ein Wort, das in keiner Ergebnisdatei stehen darf'); }

/* ---------- der eine Lauf auf den echten Tagesdateien ---------- */
function echterLeser() {
  var soll = {}, stat = { gelesen: 0, hashGleich: 0, ohneHash: 0 };
  fs.readFileSync(path.join(__dirname, 'datenbau', 'sha256', 'sha256-pc.txt'), 'utf8').split('\n').forEach(function (zl) { var m = /^([0-9a-f]{64}) [ *]tage\/(\d{4}-\d{2}-\d{2})\.json\s*$/.exec(zl); if (m) soll[m[2]] = m[1]; });
  function lies(iso) {
    var p = path.join(TAGE_ORDNER, iso + '.json');
    if (!fs.existsSync(p)) return null;
    var buf = fs.readFileSync(p), h = crypto.createHash('sha256').update(buf).digest('hex');
    stat.gelesen++;
    if (!soll[iso]) stat.ohneHash++; else if (soll[iso] !== h) throw new Error('Tagesdatei ' + iso + ' weicht von der Hashliste des Datenbaus ab'); else stat.hashGleich++;
    return JSON.parse(buf.toString('utf8'));
  }
  lies.stat = stat; return lies;
}
/** ERGEBNIS.md und Abschnitt 13 der Vorregistrierung — ausschließlich aus dem Protokoll (auch über --text, ohne neuen Lauf). */
function schreibeTexte(P) {
  var text = ergebnisText(P), a13 = abschnitt13(P);
  pruefeWoerter(text, 'ERGEBNIS.md'); pruefeWoerter(a13, 'Abschnitt 13'); pruefeWoerter(JSON.stringify(P), 'protokoll.json');
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), text);
  var vr = path.join(__dirname, 'VORREGISTRIERUNG.md'), alt = fs.readFileSync(vr, 'utf8'), marke = alt.indexOf('\n---\n\n## 13. Ergebnis');
  fs.writeFileSync(vr, (marke >= 0 ? alt.slice(0, marke) : alt.replace(/\s+$/, '')) + '\n' + a13);
}
function hauptlauf(grund) {
  var pfad = path.join(__dirname, 'protokoll.json'), wurzel = path.join(__dirname, '..', '..'), laeufe = [];
  function sag(s) { process.stdout.write(s + '\n'); }
  function schreibe(o) { fs.writeFileSync(pfad, JSON.stringify(o, null, 1)); }
  function git(a) { try { return cp.execSync('git ' + a, { cwd: wurzel, encoding: 'utf8' }).trim(); } catch (e) { return null; } }
  if (fs.existsSync(pfad)) { try { laeufe = JSON.parse(fs.readFileSync(pfad, 'utf8')).laeufe || []; } catch (e) { laeufe = [{ nr: 1, hinweis: 'früheres Protokoll unlesbar' }]; } }
  var lauf = { nr: laeufe.length + 1, start: new Date().toISOString(), grund: grund || 'der eine registrierte Lauf auf den echten Tagesdateien', status: 'läuft' };
  laeufe.push(lauf);
  var sha = {}; ['messen.js', 'signal.js', 'konstanten.js'].forEach(function (f) { sha[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, f))).digest('hex'); });
  var maschine = { commit: git('rev-parse --short HEAD'), ordnerSauber: git('status --porcelain -- studien/nachrichten-stimmung-tage-2026-09-19/messen.js studien/nachrichten-stimmung-tage-2026-09-19/signal.js studien/nachrichten-stimmung-tage-2026-09-19/konstanten.js') === '', node: process.version, sha256: sha };
  schreibe({ kennung: KONST.KENNUNG, kennungMessung: KENNUNG_MESSUNG, stufe: 'gestartet', laeufe: laeufe, maschine: maschine });
  try {
    var T = PR.Tafel(path.join(Q, 'voll'));
    sag('Tafel geladen: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, Kennung ' + T.stand.kennung);
    var leser = echterLeser();
    var P = messe({ T: T, tagesdatei: leser, sag: sag, nachStufeA: function (teil) { schreibe(Object.assign({}, teil, { laeufe: laeufe, maschine: maschine })); sag('Stufe A geschrieben (12 Tests), ' + new Date().toISOString()); } });
    lauf.ende = new Date().toISOString(); lauf.status = 'fertig';
    P.laeufe = laeufe; P.maschine = maschine; P.tagesdateienHashpruefung = leser.stat;
    schreibe(P);                                   /* erst das Protokoll (die Zahlen), dann die Texte daraus */
    try { schreibeTexte(P); } catch (e2) { process.stderr.write('Protokoll geschrieben, Texte NICHT: ' + e2.message + ' - nach Reparatur der Textfunktion mit --text neu schreiben (kein neuer Lauf)\n'); process.exit(3); }
    sag('\n' + urteilstafel(P).join('\n'));
    sag('\nTore: ' + JSON.stringify(P.tore) + '\nHashprüfung Tagesdateien: ' + JSON.stringify(leser.stat) + '\nDauer ' + P.dauerS.toFixed(0) + ' s');
  } catch (e) {
    lauf.ende = new Date().toISOString(); lauf.status = 'abbruch'; lauf.fehler = String(e && e.message || e);
    schreibe({ kennung: KONST.KENNUNG, kennungMessung: KENNUNG_MESSUNG, stufe: 'abgebrochen', laeufe: laeufe, maschine: maschine });
    process.stderr.write('ABBRUCH: ' + (e && e.stack || e) + '\n'); process.exit(1);
  }
}

module.exports = { messe: messe, universumStudie: universumStudie, abdeckung: abdeckung, schlussRenditen: schlussRenditen, signalVon: signalVon, bildePortfolio: bildePortfolio, urteilVon: urteilVon,
  innerhalbFaktor: innerhalbFaktor, stufeA: stufeA, stufeB: stufeB, ergebnisText: ergebnisText, abschnitt13: abschnitt13, pruefeWoerter: pruefeWoerter, TESTS: TESTS, LESARTEN: LESARTEN, KENNUNG_MESSUNG: KENNUNG_MESSUNG };

if (require.main === module) {
  var arg = {}; process.argv.slice(2).forEach(function (a, i, L) { if (a.slice(0, 2) === '--') arg[a.slice(2)] = L[i + 1] && L[i + 1].slice(0, 2) !== '--' ? L[i + 1] : true; });
  if (arg.text) { schreibeTexte(JSON.parse(fs.readFileSync(path.join(__dirname, 'protokoll.json'), 'utf8'))); process.stdout.write('ERGEBNIS.md und Abschnitt 13 aus protokoll.json neu geschrieben (kein Lauf).\n'); process.exit(0); }
  if (!arg.echt) { process.stdout.write('Kein Lauf ohne --echt (genau ein Lauf auf den echten Tagesdateien; Kunstdaten: test-messen.js).\n'); process.exit(2); }
  hauptlauf(typeof arg.grund === 'string' ? arg.grund : null);
}
