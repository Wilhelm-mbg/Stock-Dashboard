'use strict';
/* KOMBINATION - Auftrag Nr. 62 (23.09.2026): der EINE registrierte Kombinationslauf der Mehrfaktor-Studie (Runde 1b).
 * Grundlage: VORREGISTRIERUNG-KOMBINATION.md, Status REGISTRIERT (Wilhelm 23.09.2026 22:16, Siegel-Commit 71f8da3):
 * §5 Kombination, §6 Vorpruefung (V1 bestanden, V2 mit dem registrierten Schaetzer gefallen), §7 Urteil, §10 K-P1..K-P8, §11 Nachtraege.
 *
 * Ablauf (Auftrag §1, Reihenfolge §1a.5):
 *   1. Zellen laden: zellen/<feld>.json der sieben Signale (momentum, schwankung, bewertung, ertragskraft, investition, sue, fue)
 *      und der zwei Kontrollen (groesse, verschuldung). NICHT dabei: umkehr, bewertung-ep, ertragskraft-roa, fue-marktwert.
 *      Aus den Feldzellen werden nur Format, Klinken und Nullpunkt gelesen (K-P1..K-P4), keine IC- oder Dezilwerte.
 *   2. K-P1..K-P5 pruefen -> pruefung/kombination-pruefungen.json, Teil "vorDemLauf" mit Zeitstempel. Faellt eine, endet der
 *      Prozess mit Befund (Exit 1): kein Lauf, keine Reparatur, keine Abwandlung (Auftrag §0).
 *   3. EIN Aufruf Z.kombiniere(zellen, SIGNALE, null, { kontrollen: KONTROLLEN }) - Gewichte fehlend = 1 - und danach EIN Aufruf
 *      Z.zelleAusKombination(komb, { definition, quellen }). Die Kombination laeuft als Zelle "kombination" (der Name, den die
 *      Maschine in zelleAusKombination vergibt) durch dieselbe Maschine wie jedes Feld: Einzelmessung mit IC und Dezil, Orakel,
 *      Placebo Symbole, Zufall x12, Leck-Klinke; Placebo Versatz entfaellt (ohneVersatz). Die Maschine schreibt selbst
 *      zellen/kombination.json, zellen/kombination-nullpunkt.json, zellen/kombination-bericht.md (Standardziel KONST.ZELLEN).
 *   4. K-P6..K-P8 aus den Zahlen der Kombinationszelle -> Teil "nachDemLauf" derselben Pruefdatei. K-P6 wird aus
 *      einzelmessung.aufgefuellt gelesen (Zaehlweise der Maschine: ein Dezilmitglied zaehlt, wenn mindestens ein Feld fehlte), der
 *      Nenner aus der Periodenreihe des Nullpunkts (Dezilgroesse k je Signaltag) - keine eigene Dezilbildung (Auftrag §1a.2).
 *      Kontrollgroessen (§5): die Maschine weist die Mitglieder des Dezils oben nicht aus (die Zelle traegt je Signaltag nur Werte,
 *      der Nullpunkt je Periode nur Zaehler); berichtet wird deshalb die Rangkorrelation Kombinationswert <-> Kontrollrang je
 *      Signaltag (Z.ic, dieselbe Rangfunktion) als NAEHERUNG, gemittelt ueber die Signaltage - nur Bericht, kein Tor.
 *   5. Urteil WOERTLICH nach §7 aus einzelmessung.ic der Kombinationszelle; ERGEBNIS-KOMBINATION.md aus denselben Zahlen.
 * Schritt 1 (Urteil): keine Option, kein zweiter Lauf. Aufruf aus dem Studienordner:
 *   node --max-old-space-size=6144 kombination.js
 * Schritt 2 (Rueckhaltefenster, §8, vom PM NACH dem Urteil geoeffnet, 23.09.2026): `--rueckhalte` liest die mit
 *   `zelle.js --feld ... --rueckhalte --ziel zellen-rueckhalte` neu gebauten Zellen aus zellen-rueckhalte/ (116 Signaltage, rueckhalte
 *   true), baut die Kombination EINMAL dorthin, schreibt pruefung/kombination-pruefungen-rueckhalte.json und haengt an
 *   ERGEBNIS-KOMBINATION.md den Abschnitt 10 an: die 24 Signaltage ab RUECKHALTE_AB als eigene Reihe (IC je Signaltag, Mittel, sd,
 *   se, t, MDE80; Dezil oben - Universum netto derselben Monate aus der Periodenreihe des Nullpunkts, gegen das Maschinenmittel
 *   gegengeprueft), Gesamtreihe nachrichtlich, Einordnung WOERTLICH nach §8 ("bestaetigt" = gleiches Vorzeichen des mittleren IC
 *   wie im Rechenfenster, sonst "widerspricht"). Kein §7-Urteil in diesem Modus; die versiegelten Zellen in zellen/ und die
 *   Pruefdatei des Schritts 1 bleiben unangetastet.
 *   node --max-old-space-size=6144 kombination.js --rueckhalte
 */
var fs = require('fs'), path = require('path'), cp = require('child_process');
var Z = require('./zelle.js');

var RH = process.argv.indexOf('--rueckhalte') >= 0;                 /* Schritt 2 (§8): Rueckhaltefenster geoeffnet, eigener Ordner */
var ORDNER = __dirname, REPO = path.resolve(ORDNER, '..', '..');
var ZELLEN = path.join(ORDNER, RH ? 'zellen-rueckhalte' : 'zellen'), PRUEF = path.join(ORDNER, 'pruefung');
var DATEI_PRUEF = path.join(PRUEF, RH ? 'kombination-pruefungen-rueckhalte.json' : 'kombination-pruefungen.json'), DATEI_VORPRUEF = path.join(PRUEF, 'vorpruefung-kombination.json');
var DATEI_ERGEBNIS = path.join(ORDNER, 'ERGEBNIS-KOMBINATION.md');
var SIGNALE = ['momentum', 'schwankung', 'bewertung', 'ertragskraft', 'investition', 'sue', 'fue'];
var KONTROLLEN = ['groesse', 'verschuldung'];
var NICHT_ENTHALTEN = ['umkehr', 'bewertung-ep', 'ertragskraft-roa', 'fue-marktwert'];
var PANEL = ['momentum', 'schwankung'];                   /* Panelzellen: tafelKennung null; alle anderen sind Bilanzzellen */
var KENNUNG_ZELLE = 'mehrfaktor-2026-09-22/zelle/v1.1', TAFEL = 'fundamentaltafel-2026-09-16/v1.1', SIGNALTAGE = RH ? 116 : 92;   /* 92 + 24 Rueckhalte-Signaltage */
var T_SCHWELLE = 3, KP6_MAX = 0.5;
var ALLE = SIGNALE.concat(KONTROLLEN);

function jetzt() { return new Date().toISOString(); }
function de(x, n) { return (x == null || x !== x) ? '—' : Number(x).toFixed(n == null ? 4 : n).replace('.', ','); }
function pz(x, n) { return (x == null || x !== x) ? '—' : de(100 * x, n == null ? 1 : n) + ' %'; }
function ja(b) { return b ? '✓' : '✗'; }
function git(args) { try { return cp.execSync('git ' + args, { cwd: REPO, encoding: 'utf8' }).trim(); } catch (e) { return null; } }
function schreibe(pfad, obj) { fs.writeFileSync(pfad + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(pfad + '.tmp', pfad); }
function befund(text, pruef) {
  pruef.befund = text; schreibe(DATEI_PRUEF, pruef);
  process.stdout.write('BEFUND (kein Lauf, Auftrag §0): ' + text + '\n'); process.exit(1);
}

/* ---------- 1. Zellen laden ---------- */
var zellen = {};
ALLE.forEach(function (f) { zellen[f] = JSON.parse(fs.readFileSync(path.join(ZELLEN, f + '.json'), 'utf8')); });

/* ---------- 2. K-P1..K-P5 vor dem Lauf ---------- */
var ref = zellen[SIGNALE[0]], refTage = ref.signaltage.map(function (s) { return s.tag; });
var kp1 = { name: 'K-P1 Kennung zelle/v1.1, rueckhalte false, 92 Signaltage, gleiche Signaltage und Universen, tafelKennung je Zellenart', bestanden: true, zellen: {} };
ALLE.forEach(function (f) {
  var z = zellen[f], m = [], tage = (z.signaltage || []).map(function (s) { return s.tag; });
  if (z.kennung !== KENNUNG_ZELLE) m.push('kennung ' + z.kennung);
  if (z.rueckhalte !== RH) m.push('rueckhalte ' + JSON.stringify(z.rueckhalte) + ' statt ' + RH);
  if (z.signaltageZahl !== SIGNALTAGE) m.push('signaltageZahl ' + z.signaltageZahl);
  if (tage.length !== SIGNALTAGE) m.push('signaltage ' + tage.length);
  if (tage.join(',') !== refTage.join(',')) m.push('Signaltage weichen von ' + SIGNALE[0] + ' ab');
  var uniAb = 0, uniSumme = 0;
  (z.signaltage || []).forEach(function (s, i) {
    var a = Object.keys(s.werte).sort(), b = Object.keys(ref.signaltage[i].werte).sort(); uniSumme += a.length;
    if (a.length !== b.length || a.some(function (x, q) { return x !== b[q]; })) uniAb++;
  });
  if (uniAb) m.push('Universum weicht an ' + uniAb + ' Signaltagen ab');
  var sollTafel = PANEL.indexOf(f) >= 0 ? null : TAFEL;
  if ((z.tafelKennung || null) !== sollTafel) m.push('tafelKennung ' + JSON.stringify(z.tafelKennung || null) + ' statt ' + JSON.stringify(sollTafel));
  kp1.zellen[f] = { kennung: z.kennung, stand: z.stand, rueckhalte: z.rueckhalte, signaltageZahl: z.signaltageZahl, erster: tage[0], letzter: tage[tage.length - 1],
    universumMittel: tage.length ? uniSumme / tage.length : null, tafelKennung: z.tafelKennung || null, maengel: m };
  if (m.length) kp1.bestanden = false;
});
var kp2 = { name: 'K-P2 kein kunst-Eintrag', bestanden: true, kunst: {} };
ALLE.forEach(function (f) { kp2.kunst[f] = zellen[f].kunst || null; if (zellen[f].kunst) kp2.bestanden = false; });
var kp3 = { name: 'K-P3 Gewichte genau 1 fuer die sieben Signale, Kontrollen genau groesse+verschuldung, umkehr (und die nachrichtlichen Zellen) nicht enthalten',
  signale: SIGNALE.slice(), gewichteAufruf: null, kontrollen: KONTROLLEN.slice(), nichtEnthalten: NICHT_ENTHALTEN.slice(),
  gewichteWirksam: null, kontrollenWirksam: null,
  bestanden: SIGNALE.length === 7 && KONTROLLEN.join(',') === 'groesse,verschuldung' && NICHT_ENTHALTEN.every(function (f) { return ALLE.indexOf(f) < 0; }) };
var kp4 = { name: 'K-P4 Nullpunkt je Zelle: Orakel, Placebo Symbole, Zufall, Leck bestanden (Placebo Versatz nur notiert)', bestanden: true, zellen: {} };
ALLE.forEach(function (f) {
  var np = zellen[f].nullpunkt || {}, pl = np.placebo || {};
  var ok = !!(np.orakel && np.orakel.bestanden && pl.symbole && pl.symbole.bestanden && pl.zufall && pl.zufall.bestanden && np.leck && np.leck.bestanden);
  kp4.zellen[f] = { orakel: !!(np.orakel && np.orakel.bestanden), orakelIc: (np.orakel && np.orakel.ic) ? np.orakel.ic.bestanden : null,
    placeboSymbole: !!(pl.symbole && pl.symbole.bestanden), zufall: !!(pl.zufall && pl.zufall.bestanden), leck: !!(np.leck && np.leck.bestanden),
    versatzNotiert: pl.versatz ? pl.versatz.bestanden : null, bestanden: ok };
  if (!ok) kp4.bestanden = false;
});
var kp5 = { name: 'K-P5 Vorpruefung §6 als Datei VOR dem Lauf (Commit 83a3981), V1/V2 uebernommen', bestanden: false }, vp = null;
try { vp = JSON.parse(fs.readFileSync(DATEI_VORPRUEF, 'utf8')); } catch (e) { kp5.fehler = String(e.message); }
if (vp) {
  var stempelVor = jetzt();
  kp5.datei = 'pruefung/vorpruefung-kombination.json'; kp5.kennung = vp.kennung; kp5.stand = vp.stand; kp5.geprueftAm = stempelVor;
  kp5.gitCommit = git('log -1 --format="%h %ci" -- studien/mehrfaktor-2026-09-22/pruefung/vorpruefung-kombination.json');
  kp5.standVorDemLauf = typeof vp.stand === 'string' && vp.stand < stempelVor;
  kp5.V1 = vp.V1; kp5.V2 = vp.V2; kp5.erwartungIc = vp.erwartungIc; kp5.icBoden = vp.icBoden; kp5.seIcMedian = vp.seIcMedian;
  kp5.mde80IcSchaetzung = vp.mde80IcSchaetzung; kp5.umschlagMittel = vp.umschlagMittel; kp5.kosten = vp.kosten;
  kp5.v2Gefallen = !(vp.V2 && (vp.V2.bestandenObereGrenze || vp.V2.bestandenUntereGrenze));
  kp5.bestanden = !!(kp5.standVorDemLauf && vp.V1 && typeof vp.V1.bestanden === 'boolean' && vp.V2 && typeof vp.V2.bestandenObereGrenze === 'boolean');
}
var pruef = { kennung: 'mehrfaktor-2026-09-22/kombination-pruefungen/v1', auftrag: 'Nr. 62 (23.09.2026), Studien-Chat',
  vorregistrierung: 'VORREGISTRIERUNG-KOMBINATION.md, REGISTRIERT 23.09.2026 22:16, Siegel 71f8da3', repoHeadVorDemLauf: git('rev-parse --short HEAD'), node: process.version,
  vorDemLauf: { stand: jetzt(), 'K-P1': kp1, 'K-P2': kp2, 'K-P3': kp3, 'K-P4': kp4, 'K-P5': kp5,
    bestanden: kp1.bestanden && kp2.bestanden && kp3.bestanden && kp4.bestanden && kp5.bestanden } };
fs.mkdirSync(PRUEF, { recursive: true }); schreibe(DATEI_PRUEF, pruef);
if (!pruef.vorDemLauf.bestanden) befund('K-P1..K-P5 nicht bestanden: ' + JSON.stringify({ 'K-P1': kp1.bestanden, 'K-P2': kp2.bestanden, 'K-P3': kp3.bestanden, 'K-P4': kp4.bestanden, 'K-P5': kp5.bestanden }), pruef);

/* ---------- 3. Der eine Lauf ---------- */
var start = jetzt(), t0 = Date.now();
var komb = Z.kombiniere(zellen, SIGNALE, null, { kontrollen: KONTROLLEN });
kp3.gewichteWirksam = komb.gewichte; kp3.kontrollenWirksam = komb.kontrollen;
kp3.bestanden = kp3.bestanden && Object.keys(komb.gewichte).length === 7 && SIGNALE.every(function (f) { return komb.gewichte[f] === 1; }) && komb.kontrollen.join(',') === 'groesse,verschuldung' && komb.rueckhalte === RH;
if (!kp3.bestanden) befund('K-P3 nach kombiniere nicht bestanden: ' + JSON.stringify({ gewichte: komb.gewichte, kontrollen: komb.kontrollen, rueckhalte: komb.rueckhalte }), pruef);
var definition = 'Gleichgewichtete Rangkombination nach VORREGISTRIERUNG-KOMBINATION.md §5 (REGISTRIERT 23.09.2026 22:16, Siegel 71f8da3; Auftrag Nr. 62): '
  + 'Kombinationsrang = Summe w_f R_f / Summe w_f über ' + komb.felder.join(', ') + ' (Gewichte ' + JSON.stringify(komb.gewichte) + '); fehlendes Feld = mittlerer Rang (n+1)/2, '
  + 'Auffüllungen je Dezil gezählt; Kontrollen nur berichtet: ' + komb.kontrollen.join(', ') + '. Teststatistik: mittlerer Rang-IC über die Signaltage (Nachtrag 3); '
  + 'Dezil oben, Long-Short, Dezil unten, Jahresscheiben, Regime sind Diagnose.';
var quellen = komb.quellen.map(function (q) { return 'zellen/' + q.feld + '.json (' + q.kennung + ', Stand ' + q.stand + ', Tafel ' + (q.tafelKennung || 'nicht benutzt') + (q.kunst ? ', KUNST ' + q.kunst : '') + ')'; });
var r = Z.zelleAusKombination(komb, { definition: definition, quellen: quellen, ziel: ZELLEN });
var sekunden = (Date.now() - t0) / 1000, rssMB = process.memoryUsage().rss / 1048576;
var zelle = r.zelle, em = zelle.einzelmessung, np = zelle.nullpunkt, pl = np.placebo || {}, icS = em.ic || {};

/* ---------- 4. K-P6, Kontrollgroessen, Urteil, K-P7/K-P8 ---------- */
var perioden = (r.nullpunkt && r.nullpunkt.einzelmessungPerioden) || null, obenSumme, untenSumme = null, maxAnteilTag = null, nenner;
if (perioden && perioden.length && perioden[0].k != null) {
  obenSumme = 0; untenSumme = 0; maxAnteilTag = 0;
  perioden.forEach(function (p) { obenSumme += p.k; untenSumme += p.kKurz || 0; if (p.k > 0 && p.aufgefuellt) maxAnteilTag = Math.max(maxAnteilTag, p.aufgefuellt.oben / p.k); });
  nenner = 'Summe der Dezilgroessen k je Periode aus kombination-nullpunkt.json einzelmessungPerioden (Maschine)';
} else { obenSumme = em.perioden * em.dezilMittel; nenner = 'perioden x dezilMittel (Naeherung, Periodenreihe nicht gefunden)'; }
var anteilJeFeld = {}; SIGNALE.forEach(function (f) { anteilJeFeld[f] = komb.zaehler.symbolTage ? komb.zaehler.auffuellungen[f] / komb.zaehler.symbolTage : null; });
var kp6 = { name: 'K-P6 Auffuellungen je Feld und je Dezil ausgewiesen; Anteil aufgefuellter Mitglieder im Dezil oben < 50 %',
  jeFeld: komb.zaehler.auffuellungen, anteilJeFeld: anteilJeFeld, gesamtFeldAuffuellungen: komb.zaehler.gesamt, symbolTage: komb.zaehler.symbolTage,
  jeDezil: em.aufgefuellt, mitgliederDezilOben: obenSumme, mitgliederDezilUnten: untenSumme, nenner: nenner,
  anteilOben: obenSumme > 0 ? em.aufgefuellt.oben / obenSumme : null, anteilUnten: untenSumme > 0 ? em.aufgefuellt.unten / untenSumme : null, maxAnteilObenJeSignaltag: maxAnteilTag,
  zaehlweise: 'Maschine (zelle.js lauf): ein Dezilmitglied zaehlt als aufgefuellt, wenn mindestens ein Feld fehlte; je Feld: Auffuellungen ueber alle Mitglied-Monate (kombiniere.zaehler)',
  jeFeldJeDezil: 'von der Maschine nicht ausgewiesen (nur Summe je Dezil und Summe je Feld); keine eigene Dezilbildung (Auftrag §1a.2)', schwelle: KP6_MAX };
kp6.bestanden = kp6.anteilOben != null && kp6.anteilOben < KP6_MAX;

var kontrollen = {};
KONTROLLEN.forEach(function (f) {
  var reihe = [], abd = 0;
  komb.signaltage.forEach(function (s) {
    var namen = Object.keys(s.werte), x = [], y = [];
    namen.forEach(function (nm) { x.push(s.werte[nm]); var k = s.kontrollen[f][nm]; y.push(k == null ? NaN : k); });
    var e = Z.ic(x, y); reihe.push({ tag: s.tag, rho: e.ic, n: e.n }); abd += namen.length ? e.n / namen.length : 0;
  });
  var g = reihe.filter(function (e) { return e.rho != null; }), n = g.length, m = null, sd = null;
  if (n) { m = g.reduce(function (a, e) { return a + e.rho; }, 0) / n; sd = n > 1 ? Math.sqrt(g.reduce(function (a, e) { return a + (e.rho - m) * (e.rho - m); }, 0) / (n - 1)) : null; }
  kontrollen[f] = { mittel: m, sd: sd, se: sd == null ? null : sd / Math.sqrt(n), t: (sd && m != null) ? m / (sd / Math.sqrt(n)) : null, n: n,
    min: n ? Math.min.apply(null, g.map(function (e) { return e.rho; })) : null, max: n ? Math.max.apply(null, g.map(function (e) { return e.rho; })) : null,
    abdeckungMittel: komb.signaltage.length ? abd / komb.signaltage.length : null, monate: reihe };
});
var kontrollHinweis = 'NAEHERUNG (Auftrag §1.5): Spearman-Rangkorrelation zwischen Kombinationswert und Kontrollrang je Signaltag ueber die Mitglieder mit Kontrollwert (Z.ic der Maschine), Mittel ueber die Signaltage. rho > 0: hohe Kombinationsraenge gehen mit hohem Kontrollrang einher (gross bzw. verschuldet). Der mittlere Kontrollrang der Dezilmitglieder ist nicht berichtbar, weil die Maschine die Dezilmitglieder nicht ausweist. Nur Bericht, kein Tor.';

var bed = {
  a: { text: 'Nullpunkt der Kombinationszelle (Orakel: Dezil-Schranken und IC = 1; Placebo Symbole; Zufall; Klinke) und alle neun Feldzellen (K-P4)',
    orakel: !!np.orakel.bestanden, orakelIc: np.orakel.ic ? np.orakel.ic.bestanden : null, orakelIcMittel: np.orakel.ic ? np.orakel.ic.mittel : null,
    placeboSymbole: !!(pl.symbole && pl.symbole.bestanden), zufall: !!(pl.zufall && pl.zufall.bestanden), leck: !!(np.leck && np.leck.bestanden), feldzellenKP4: kp4.bestanden },
  b: { text: 'Vorpruefung §6 dokumentiert (K-P5, Datei vor dem Lauf)', stand: kp5.stand, erfuellt: kp5.bestanden },
  c: { text: 'IC Mittel >= MDE80 (2,8016 x se)', mittel: icS.mittel, mde80: icS.mde80, erfuellt: icS.mittel != null && icS.mde80 != null && icS.mittel >= icS.mde80 },
  d: { text: 't >= 3', t: icS.t, schwelle: T_SCHWELLE, erfuellt: icS.t != null && icS.t >= T_SCHWELLE },
  e: { text: 'letzte 12 Signaltage des Laufs im Mittel >= 0', mittel: icS.letzte12 ? icS.letzte12.mittel : null, n: icS.letzte12 ? icS.letzte12.n : null,
    erfuellt: !!(icS.letzte12 && icS.letzte12.mittel != null && icS.letzte12.mittel >= 0) } };
bed.a.erfuellt = !!(bed.a.orakel && bed.a.orakelIc && bed.a.placeboSymbole && bed.a.zufall && bed.a.leck && bed.a.feldzellenKP4);
var alleErfuellt = ['a', 'b', 'c', 'd', 'e'].every(function (k) { return bed[k].erfuellt; });
var urteil = alleErfuellt ? 'Information belegt' : 'nicht entscheidbar unterhalb von IC ' + de(icS.mde80, 4);
if (RH) urteil = 'Rückhaltelauf nach §8 — kein §7-Urteil (das Urteil des Rechenfensters steht in §12); Einordnung siehe Abschnitt Rückhaltefenster';
var monateMitIc = (icS.monate || []).filter(function (e) { return e.ic != null; }), l12 = monateMitIc.slice(-12);
var fensterL12 = l12.length ? l12[0].tag + ' … ' + l12[l12.length - 1].tag : null;
var kp7 = { name: 'K-P7 Urteil folgt §7 aus den eigenen Zahlen des IC; Satzform; Dezil netto berichtet, nicht beurteilt; Kennungen', urteil: urteil, bedingungen: bed,
  v2GefallenVorDemLauf: kp5.v2Gefallen, satzform: alleErfuellt ? '„Information belegt"' : '„nicht entscheidbar unterhalb von IC <MDE80 des Laufs>" (§6.3a, weil V2 vor dem Lauf gefallen war)',
  letzte12Fenster: fensterL12, kennungKombinationszelle: zelle.kennung, tafelKennungKombinationszelle: zelle.tafelKennung || null, kennungKombination: komb.kennung,
  maschinenBefund: (bed.a.orakel && bed.a.orakelIc && bed.a.placeboSymbole && bed.a.zufall && bed.a.leck) ? null : 'Nullpunkt der Kombinationszelle nicht bestanden - Befund an den PM',
  bestanden: true };
var kp8 = { name: 'K-P8 Rueckhaltereihe erst nach dem Urteil (eigene Datei, Flagge in der Kennung) - hier kein Rueckhaltelauf', rueckhalteZelle: zelle.rueckhalte, rueckhalteKombination: komb.rueckhalte,
  signaltageZahl: zelle.signaltageZahl, letzterSignaltag: zelle.signaltage[zelle.signaltage.length - 1].tag, modus: RH ? 'Rueckhaltelauf (§8, vom PM geoeffnet, eigener Ordner zellen-rueckhalte/)' : 'Rechenfenster',
  bestanden: zelle.rueckhalte === RH && komb.rueckhalte === RH && zelle.signaltageZahl === SIGNALTAGE };

/* ---------- 4b. Rueckhaltereihe (§8, nur --rueckhalte): die Signaltage ab RUECKHALTE_AB als eigene Reihe ---------- */
var rh = null;
if (RH) {
  var AB = Z.KONST.RUECKHALTE_AB, versiegelt = JSON.parse(fs.readFileSync(path.join(ORDNER, 'zellen', 'kombination.json'), 'utf8')).einzelmessung;
  var stat = function (arr) {
    var n = arr.length, m = n ? arr.reduce(function (a, v) { return a + v; }, 0) / n : null;
    var sd = n > 1 ? Math.sqrt(arr.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (n - 1)) : null, se = sd == null ? null : sd / Math.sqrt(n);
    return { n: n, mittel: m, sd: sd, se: se, t: (se && m != null) ? m / se : null, mde80: se == null ? null : Z.KONST.MDE_FAKTOR * se };
  };
  var icAlle = (icS.monate || []).filter(function (e) { return e.ic != null; }), icRH = icAlle.filter(function (e) { return e.tag >= AB; }), icVor = icAlle.filter(function (e) { return e.tag < AB; });
  var perAlle = perioden || [], perRH = perAlle.filter(function (p) { return p.signaltag >= AB; }), perVor = perAlle.filter(function (p) { return p.signaltag < AB; });
  var reihe = perRH.map(function (p) { var e = icRH.filter(function (x) { return x.tag === p.signaltag; })[0]; return { tag: p.signaltag, ic: e ? e.ic : null, n: e ? e.n : null, dezilNetto: p.netto, dezilBrutto: p.brutto, k: p.k, nUni: p.nUni }; });
  var icStatRH = stat(icRH.map(function (e) { return e.ic; })), vorIc = stat(icVor.map(function (e) { return e.ic; })), vorNetto = stat(perVor.map(function (p) { return p.netto; })), alleNetto = stat(perAlle.map(function (p) { return p.netto; }));
  rh = { ab: AB, fenster: reihe.length ? reihe[0].tag + ' … ' + reihe[reihe.length - 1].tag : null, signaltage: reihe.length,
    ic: icStatRH, dezilNetto: stat(perRH.map(function (p) { return p.netto; })), dezilBrutto: stat(perRH.map(function (p) { return p.brutto; })), reihe: reihe,
    rechenfenster: { quelle: 'zellen/kombination.json (versiegelter Lauf Schritt 1, 92 Signaltage)', icMittel: versiegelt.ic.mittel, dezilNettoMittel: versiegelt.dezilUni.netto.mittel },
    gegenprobe: { hinweis: 'Die Monate vor ' + AB + ' dieses Laufs gegen die versiegelte Zelle (Soll identisch) und die Periodenreihe des Nullpunkts gegen das Maschinenmittel dezilUni.netto (Soll 0)',
      n: vorIc.n, icMittelDieserLauf: vorIc.mittel, icAbweichung: vorIc.mittel == null ? null : vorIc.mittel - versiegelt.ic.mittel,
      dezilNettoDieserLauf: vorNetto.mittel, dezilNettoAbweichung: vorNetto.mittel == null ? null : vorNetto.mittel - versiegelt.dezilUni.netto.mittel,
      periodenreiheGegenMaschine: (alleNetto.mittel == null || !em.dezilUni) ? null : alleNetto.mittel - em.dezilUni.netto.mittel },
    gesamt: { ic: { n: icS.n, mittel: icS.mittel, sd: icS.sd, se: icS.se, t: icS.t, mde80: icS.mde80, letzte12: icS.letzte12 }, dezilNetto: em.dezilUni && em.dezilUni.netto },
    einordnung: (icStatRH.mittel != null && versiegelt.ic.mittel != null) ? (((icStatRH.mittel > 0) === (versiegelt.ic.mittel > 0)) ? 'bestätigt' : 'widerspricht') : null,
    regel: '§8: gleiches Vorzeichen des mittleren IC der Rueckhaltereihe wie im Rechenfenster = "bestaetigt", sonst "widerspricht"; keine Anpassung, keine Deutung darueber hinaus' };
}

var rel = function (p) { return p ? path.relative(ORDNER, p).replace(/\\/g, '/') : null; };
pruef.lauf = { start: start, ende: jetzt(), sekundenProzess: sekunden, rssMBProzess: rssMB, maschine: zelle.lauf, feld: zelle.feld, kennung: zelle.kennung, panel: zelle.panel,
  tafelKennung: zelle.tafelKennung || null, rueckhalte: zelle.rueckhalte, signaltageZahl: zelle.signaltageZahl, klassen: zelle.klassen,
  dateien: r.dateien ? { zelle: rel(r.dateien.zelle), nullpunkt: rel(r.dateien.nullpunkt), bericht: rel(r.dateien.bericht) } : null };
pruef.nachDemLauf = { stand: jetzt(), modus: RH ? 'rueckhalte (§8)' : 'rechenfenster', rueckhalte: rh, 'K-P6': kp6, kontrollgroessen: { hinweis: kontrollHinweis, groesse: kontrollen.groesse, verschuldung: kontrollen.verschuldung },
  urteil: { satz: urteil, alleBedingungen: alleErfuellt, paragraph: '§7 der Vorregistrierung (Fassung nach Nachtrag 3)' }, 'K-P7': kp7, 'K-P8': kp8,
  bestanden: kp6.bestanden && kp7.bestanden && kp8.bestanden };
schreibe(DATEI_PRUEF, pruef);

/* ---------- 5. ERGEBNIS-KOMBINATION.md aus den Zahlen der Zelle ---------- */
var L = []; function zeile(s) { L.push(s == null ? '' : s); }
function kz(name, k) { k = k || {}; return '| ' + name + ' | ' + (k.n == null ? '—' : k.n) + ' | ' + de(k.mittel, 3) + ' | ' + de(k.se, 3) + ' | ' + de(k.t, 2) + ' | ' + de(k.tHH, 2) + ' | ' + de(k.mde80, 3) + ' | ' + (k.marke == null ? '—' : k.marke) + ' |'; }
var datumLauf = start.slice(0, 10);
zeile('# Ergebnis — Mehrfaktor-Kombination, Runde 1b (Auftrag Nr. 62, Lauf ' + datumLauf + ')');
zeile();
zeile('**Urteil nach §7 der Vorregistrierung (wörtlich): ' + urteil + '.**' + (alleErfuellt ? '' : ' Satzform nach §6.3a, weil Tor V2 vor dem Lauf mit dem registrierten Schätzer gefallen war (Schätzung MDE₈₀(IC) ' + de(kp5.mde80IcSchaetzung, 4) + '); MDE₈₀ des Laufs = 2,8016 × se aus `zellen/kombination.json`.'));
zeile();
zeile('Ein Lauf, Testzahl 1, kein Rückhaltefenster (`rueckhalte: ' + zelle.rueckhalte + '`). Zelle `' + zelle.feld + '` (' + zelle.kennung + '), Panel `' + ((zelle.panel && zelle.panel.kennung) || zelle.panel) + '`, Tafel `' + (zelle.tafelKennung || '—') + '`, ' + zelle.signaltageZahl + ' Signaltage ' + zelle.signaltage[0].tag + ' … ' + zelle.signaltage[zelle.signaltage.length - 1].tag + '. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.');
zeile();
zeile('| §7 | Bedingung | Zahl | |');
zeile('|---|---|---|---|');
zeile('| (a) | Nullpunkt Kombinationszelle + neun Feldzellen | Orakel ' + ja(bed.a.orakel) + ', Orakel-IC ' + ja(bed.a.orakelIc) + ' (' + de(bed.a.orakelIcMittel, 4) + '), Placebo Symbole ' + ja(bed.a.placeboSymbole) + ', Zufall ' + ja(bed.a.zufall) + ', Klinke ' + ja(bed.a.leck) + ', K-P4 ' + ja(bed.a.feldzellenKP4) + ' | ' + ja(bed.a.erfuellt) + ' |');
zeile('| (b) | Vorprüfung dokumentiert | `pruefung/vorpruefung-kombination.json`, Stand ' + kp5.stand + ' | ' + ja(bed.b.erfuellt) + ' |');
zeile('| (c) | IC Mittel ≥ MDE₈₀ | ' + de(icS.mittel, 4) + ' gegen ' + de(icS.mde80, 4) + ' | ' + ja(bed.c.erfuellt) + ' |');
zeile('| (d) | t ≥ 3 | ' + de(icS.t, 2) + ' | ' + ja(bed.d.erfuellt) + ' |');
zeile('| (e) | letzte 12 Signaltage im Mittel ≥ 0 | ' + de(bed.e.mittel, 4) + ' (n ' + bed.e.n + ', ' + (fensterL12 || '—') + ') | ' + ja(bed.e.erfuellt) + ' |');
zeile();
zeile('## 1. IC — der eine Test (`einzelmessung.ic`)');
zeile();
zeile('| n | Mittel | sd | se | t | MDE₈₀ (2,8016 × se) | Signaltage ohne IC |');
zeile('|---|---|---|---|---|---|---|');
zeile('| ' + icS.n + ' | ' + de(icS.mittel, 4) + ' | ' + de(icS.sd, 4) + ' | ' + de(icS.se, 4) + ' | ' + de(icS.t, 2) + ' | ' + de(icS.mde80, 4) + ' | ' + (icS.ohneIc == null ? '—' : icS.ohneIc) + ' |');
zeile();
zeile('Letzte 12 Signaltage (' + (fensterL12 || '—') + '): n ' + (icS.letzte12 ? icS.letzte12.n : '—') + ', Mittel ' + de(icS.letzte12 ? icS.letzte12.mittel : null, 4) + '.');
zeile();
zeile('| Jahresscheibe | n | IC Mittel |');
zeile('|---|---|---|');
Object.keys(icS.jahre || {}).forEach(function (j) { zeile('| ' + j + ' | ' + icS.jahre[j].n + ' | ' + de(icS.jahre[j].mittel, 4) + ' |'); });
zeile();
zeile('## 2. Nullpunkt der Kombinationszelle (`zellen/kombination-nullpunkt.json`)');
zeile();
var o = np.orakel || {}, oi = o.ic || {}, ps = pl.symbole || {}, psi = ps.ic || {}, zu = pl.zufall || {}, zui = zu.ic || {}, le = np.leck || {}, lk = le.klinke || {}, ll = le.leser || {};
zeile('- **Orakel** ' + ja(o.bestanden) + ': Dezil − Universum brutto ' + de(o.brutto, 2) + ' / netto ' + de(o.netto, 2) + ' Pp, t ' + de(o.t, 1) + ', Mittel/sd ' + de(o.mittelDurchSd, 2) + ', Long-Short brutto ' + de(o.longShort && o.longShort.brutto, 2) + ' Pp (Schranken: Dezil ≥ ' + de(o.schranke && o.schranke.minPp, 0) + ' Pp, L-S ≥ ' + de(o.schranke && o.schranke.longShortMinPp, 0) + ' Pp, t ≥ ' + de(o.schranke && o.schranke.tBoden, 0) + '); **IC ' + de(oi.mittel, 4) + '** (min ' + de(oi.min, 4) + ', max ' + de(oi.max, 4) + ', Toleranz ' + (oi.toleranz == null ? '—' : oi.toleranz) + ') ' + ja(oi.bestanden) + '; IC des Dezil-Orakels nachrichtlich ' + de(o.icDezilOrakel && o.icDezilOrakel.mittel, 4) + '.');
zeile('- **Placebo Symbole** ' + ja(ps.bestanden) + ': Dezil netto ' + de(ps.netto, 3) + ' Pp, t ' + de(ps.t, 2) + ' (Dezil ' + ja(ps.dezilBestanden) + '); IC ' + de(psi.mittel, 4) + ', t ' + de(psi.t, 2) + ' ' + ja(psi.bestanden) + '.');
zeile('- **Zufall ×' + (zu.ziehungen == null ? '—' : zu.ziehungen) + '** ' + ja(zu.bestanden) + ': Dezil brutto ' + de(zu.mittelBrutto, 3) + ' / netto+Kosten ' + de(zu.mittelNettoPlusKosten, 3) + ' Pp, Ziehungen mit |t| über Schranke ' + (zu.fehlerEinzelnT == null ? '—' : zu.fehlerEinzelnT) + ', se je Ziehung ' + de(zu.seEinzelnMittel, 3) + ', MDE₈₀-Boden ' + de(zu.mdeBoden, 3) + ' Pp, Umschlag ' + pz(zu.umschlagMittel) + ' (Dezil ' + ja(zu.dezilBestanden) + '); IC Mittel ' + de(zui.mittel, 4) + ', se je Ziehung ' + de(zui.seEinzelnMittel, 4) + ', MDE₈₀-Boden(IC) ' + de(zui.mdeBoden, 4) + ', Ausreißer ' + (zui.fehlerEinzelnT == null ? '—' : zui.fehlerEinzelnT) + ' ' + ja(zui.bestanden) + '.');
zeile('- **Leck-Klinke** ' + ja(le.bestanden) + ': Verstöße Hauptlauf ' + (lk.verstoesseHauptlauf == null ? '—' : lk.verstoesseHauptlauf) + ', Positivkontrolle ' + JSON.stringify(lk.positivkontrolle == null ? null : lk.positivkontrolle) + '; Bilanzleser geöffnet ' + JSON.stringify(ll.geoeffnet == null ? null : ll.geoeffnet) + ', Zugriffe ' + (ll.zugriffe == null ? '—' : ll.zugriffe) + ', Verstöße ' + (ll.verstoesse == null ? '—' : ll.verstoesse) + '.');
zeile('- **Placebo Versatz:** entfällt für die Kombination (`ohneVersatz`, gehört in die Feldzellen); Maschine: ' + (pl.versatz ? JSON.stringify(pl.versatz).slice(0, 200) : 'nicht geführt') + '.');
zeile('- Nullpunkt gesamt: ' + ja(np.bestanden) + (np.regel ? ' — Regel: ' + np.regel : '') + '.');
zeile();
zeile('## 3. Dezil-Diagnose — berichtet, nicht beurteilt (Pp je Monatsperiode)');
zeile();
zeile('| Größe | n | Mittel | se | t | t_HH | MDE₈₀ | Marke |');
zeile('|---|---|---|---|---|---|---|---|');
zeile(kz('Dezil oben − Universum brutto', em.dezilUni && em.dezilUni.brutto)); zeile(kz('Dezil oben − Universum **netto**', em.dezilUni && em.dezilUni.netto));
zeile(kz('Long-Short brutto', em.longShort && em.longShort.brutto)); zeile(kz('Long-Short netto', em.longShort && em.longShort.netto));
zeile();
var du = em.dezilUnten || {}, duW = function (v) { return (v && typeof v === 'object') ? v.mittel : v; };   /* die Maschine fuehrt fuer das Dezil unten nur Mittel */
zeile('Dezil unten − Universum: brutto ' + de(duW(du.brutto), 3) + ' / netto ' + de(duW(du.netto), 3) + ' Pp (die Maschine führt für das Dezil unten nur die Mittel, keine se).');
zeile();
zeile('Umschlag Dezil ' + pz(em.umschlag && em.umschlag.dezil) + ' / Universum ' + pz(em.umschlag && em.umschlag.universum) + '; Kosten Dezil ' + de(em.kosten && em.kosten.dezil, 3) + ' / Universum ' + de(em.kosten && em.kosten.universum, 3) + ' Pp je Monat. Perioden ' + em.perioden + ', Universum im Mittel ' + de(em.universumMittel, 1) + ', Dezil oben ' + de(em.dezilMittel, 1) + ', Dezil unten ' + de(em.dezilUnten && em.dezilUnten.dezilMittel, 1) + ', Mitglieder mit Wert ' + de(em.mitWertMittel, 1) + '.');
zeile();
zeile('| Jahresscheibe (netto) | n | Mittel | se | t | MDE₈₀ | dünn |');
zeile('|---|---|---|---|---|---|---|');
((em.jahre && em.jahre.netto) || []).forEach(function (j) { zeile('| ' + j.jahr + ' | ' + j.n + ' | ' + de(j.mittel, 3) + ' | ' + de(j.se, 3) + ' | ' + de(j.t, 2) + ' | ' + de(j.mde80, 3) + ' | ' + (j.duenn ? 'ja' : 'nein') + ' |'); });
zeile();
var ak = (em.aktuell && em.aktuell.netto) || {}, rg = em.regime || {};
zeile('Letzte 250 Tage (netto, ab ' + (ak.abTag || '—') + '): n ' + (ak.n == null ? '—' : ak.n) + ', Mittel ' + de(ak.mittel, 3) + ', se ' + de(ak.se, 3) + ', t ' + de(ak.t, 2) + ', MDE₈₀ ' + de(ak.mde80, 3) + '.');
zeile('Regime: SPY unter EMA200 n ' + (rg.unterEMA200 ? rg.unterEMA200.n : '—') + ', Mittel ' + de(rg.unterEMA200 && rg.unterEMA200.mittel, 3) + ' (t ' + de(rg.unterEMA200 && rg.unterEMA200.t, 2) + '); über EMA200 n ' + (rg.ueberEMA200 ? rg.ueberEMA200.n : '—') + ', Mittel ' + de(rg.ueberEMA200 && rg.ueberEMA200.mittel, 3) + ' (t ' + de(rg.ueberEMA200 && rg.ueberEMA200.t, 2) + '); ohne Regime ' + JSON.stringify(rg.ohneRegime == null ? null : rg.ohneRegime) + '.');
zeile();
zeile('## 4. Kontrollgrößen (§5) — Näherung, nur Bericht');
zeile();
zeile(kontrollHinweis);
zeile();
zeile('| Kontrolle | ρ Mittel | sd | se | t | n Signaltage | min | max | Abdeckung |');
zeile('|---|---|---|---|---|---|---|---|---|');
KONTROLLEN.forEach(function (f) { var k = kontrollen[f]; zeile('| ' + f + ' | ' + de(k.mittel, 4) + ' | ' + de(k.sd, 4) + ' | ' + de(k.se, 4) + ' | ' + de(k.t, 2) + ' | ' + k.n + ' | ' + de(k.min, 4) + ' | ' + de(k.max, 4) + ' | ' + pz(k.abdeckungMittel) + ' |'); });
zeile();
zeile('## 5. Auffüllungen (K-P6 ' + ja(kp6.bestanden) + ')');
zeile();
zeile('Je Feld (fehlender Wert = mittlerer Rang, über ' + komb.zaehler.symbolTage + ' Mitglied-Monate; `kombiniere.zaehler`):');
zeile();
zeile('| Feld | Auffüllungen | Anteil |');
zeile('|---|---|---|');
SIGNALE.forEach(function (f) { zeile('| ' + f + ' | ' + komb.zaehler.auffuellungen[f] + ' | ' + pz(anteilJeFeld[f]) + ' |'); });
zeile();
zeile('Je Dezil (`einzelmessung.aufgefuellt`, Zählweise der Maschine: Mitglied mit mindestens einem fehlenden Feld): Dezil oben ' + em.aufgefuellt.oben + ' von ' + de(obenSumme, 0) + ' Mitglied-Monaten = **' + pz(kp6.anteilOben) + '** (Schwelle < 50 %; Höchstwert an einem Signaltag ' + pz(maxAnteilTag) + '); Dezil unten ' + em.aufgefuellt.unten + ' von ' + de(untenSumme, 0) + ' = ' + pz(kp6.anteilUnten) + '. Nenner: ' + nenner + '. Je Feld **und** je Dezil weist die Maschine nicht aus; keine eigene Dezilbildung (Auftrag §1a.2).');
zeile();
zeile('## 6. Vorprüfung §6 (K-P5, `pruefung/vorpruefung-kombination.json`, Stand ' + kp5.stand + ', Commit ' + (kp5.gitCommit || '—') + ')');
zeile();
zeile('- V1 (Kosten): mittlerer Dezil-Umschlag der sieben Feldzellen ' + pz(kp5.umschlagMittel) + ' ⇒ Kosten ' + de(kp5.kosten, 3) + ' Pp je Monat gegen Kante/2 ' + de(vp.V1 && vp.V1.kanteHalbe && vp.V1.kanteHalbe[0], 2) + '–' + de(vp.V1 && vp.V1.kanteHalbe && vp.V1.kanteHalbe[1], 2) + ' Pp — ' + (vp.V1 && vp.V1.bestanden ? 'bestanden' : 'gefallen') + '.');
zeile('- V2 (IC): Median se(IC) ' + de(kp5.seIcMedian, 4) + ' (Faktor ' + de(vp.V2 && vp.V2.faktorZumBoden, 1) + ' über dem Kunstfeld-Boden ' + de(kp5.icBoden && kp5.icBoden.se, 4) + ') ⇒ Schätzung MDE₈₀(IC) ' + de(kp5.mde80IcSchaetzung, 4) + ' gegen erwarteten IC ' + de(kp5.erwartungIc && kp5.erwartungIc[0], 2) + '–' + de(kp5.erwartungIc && kp5.erwartungIc[1], 2) + ' — ' + (kp5.v2Gefallen ? 'gefallen (obere und untere Grenze)' : 'bestanden') + '. MDE₈₀(IC) des Laufs: ' + de(icS.mde80, 4) + '.');
zeile();
zeile('## 7. Zähler, Abdeckung, Datenfunde');
zeile();
zeile('- Zähler der Einzelmessung: `' + JSON.stringify(em.zaehler) + '`.');
zeile('- Abdeckung gesamt: `' + JSON.stringify(zelle.abdeckung && zelle.abdeckung.gesamt) + '`.');
zeile('- Datenfunde nach Vorregistrierung §11 Nachtrag 2 (nicht in diesem Lauf gemessen, dort beziffert): Panel v2.1 klebt bei 101 Reihen zwei Notierungen zusammen (57 Mitglied-Monate von 69.969, 13 Symbole); die Fundamentaltafel trägt 15 isolierte Einheitenfehler bei 13 CIKs. Entscheid dort: Kombination auf v2.1 und Tafel v1.1 gerechnet, Fund ausgewiesen.');
zeile();
zeile('## 8. Lauf');
zeile();
zeile('- Maschine: `' + JSON.stringify(zelle.lauf) + '`; Prozess gesamt ' + de(sekunden, 1) + ' s, RSS ' + de(rssMB, 0) + ' MB, Node ' + process.version + '.');
zeile('- Aufrufe: `Z.kombiniere(zellen, [' + SIGNALE.join(', ') + '], null, { kontrollen: [groesse, verschuldung] })` → Gewichte ' + JSON.stringify(komb.gewichte) + '; `Z.zelleAusKombination(komb, { definition, quellen })` → Zelle `' + zelle.feld + '`.');
zeile('- Dateien der Maschine: `' + (pruef.lauf.dateien ? pruef.lauf.dateien.zelle + '`, `' + pruef.lauf.dateien.nullpunkt + '`, `' + pruef.lauf.dateien.bericht : '—') + '`; Prüfungen: `pruefung/kombination-pruefungen.json`; Skript: `kombination.js`.');
zeile('- Repo-Stand vor dem Lauf: HEAD `' + (pruef.repoHeadVorDemLauf || '—') + '`, Siegel der Vorregistrierung `71f8da3`. Commit des Laufs: der Commit, der diese Datei einführt (`git log -1 -- studien/mehrfaktor-2026-09-22/zellen/kombination.json`; Hash in der Übergabe).');
zeile();
zeile('## 9. Prüfungen K-P1–K-P8');
zeile();
zeile('| Prüfung | | Kern |');
zeile('|---|---|---|');
zeile('| K-P1 | ' + ja(kp1.bestanden) + ' | neun Zellen ' + KENNUNG_ZELLE + ', rueckhalte false, 92 Signaltage ' + refTage[0] + ' … ' + refTage[refTage.length - 1] + ', Universen identisch, Tafel ' + TAFEL + ' bei sieben Bilanzzellen, null bei momentum/schwankung |');
zeile('| K-P2 | ' + ja(kp2.bestanden) + ' | kein kunst |');
zeile('| K-P3 | ' + ja(kp3.bestanden) + ' | Gewichte ' + JSON.stringify(komb.gewichte) + ', Kontrollen ' + komb.kontrollen.join(', ') + ', umkehr nicht enthalten |');
zeile('| K-P4 | ' + ja(kp4.bestanden) + ' | Nullpunkt aller neun Zellen bestanden (Versatz notiert: ' + ALLE.map(function (f) { return f + ' ' + ja(kp4.zellen[f].versatzNotiert); }).join(', ') + ') |');
zeile('| K-P5 | ' + ja(kp5.bestanden) + ' | Datei Stand ' + kp5.stand + ' vor dem Lauf (' + start + '), V1 bestanden, V2 gefallen |');
zeile('| K-P6 | ' + ja(kp6.bestanden) + ' | Anteil aufgefüllter Mitglieder im Dezil oben ' + pz(kp6.anteilOben) + ' |');
zeile('| K-P7 | ' + ja(kp7.bestanden) + ' | Urteil aus IC Mittel ' + de(icS.mittel, 4) + ', MDE₈₀ ' + de(icS.mde80, 4) + ', t ' + de(icS.t, 2) + ', letzte 12 ' + de(bed.e.mittel, 4) + '; Kennung ' + zelle.kennung + ', Tafel ' + (zelle.tafelKennung || '—') + (kp7.maschinenBefund ? '; **' + kp7.maschinenBefund + '**' : '') + ' |');
zeile('| K-P8 | ' + ja(kp8.bestanden) + ' | kein Rückhaltelauf, rueckhalte false, letzter Signaltag ' + kp8.letzterSignaltag + ' |');
zeile();
zeile('*Geschrieben von `kombination.js` am ' + pruef.nachDemLauf.stand + ' aus `zellen/kombination.json` und `zellen/kombination-nullpunkt.json`; nichts abgetippt, was die Maschine nicht schreibt. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.*');
if (!RH) fs.writeFileSync(DATEI_ERGEBNIS, L.join('\n') + '\n');
else {
  /* Abschnitt 10 vor die Fusszeile des Berichts aus Schritt 1 setzen; ein schon vorhandener Abschnitt 10 wird ersetzt */
  var R = [], marke = '## 10. Rückhaltefenster (§8, vom Lauf geschrieben, ' + datumLauf + ')', rz = function (s) { R.push(s == null ? '' : s); };
  var vz = function (x) { return x == null ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '0'); };
  var st = function (name, k) { k = k || {}; return '| ' + name + ' | ' + (k.n == null ? '—' : k.n) + ' | ' + de(k.mittel, 4) + ' | ' + de(k.sd, 4) + ' | ' + de(k.se, 4) + ' | ' + de(k.t, 2) + ' | ' + de(k.mde80, 4) + ' |'; };
  rz(marke); rz();
  rz('**Einordnung nach §8 (wörtlich): „' + rh.einordnung + '"** — mittlerer IC der ' + rh.signaltage + ' Rückhalte-Signaltage ' + rh.fenster + ' = ' + de(rh.ic.mittel, 4) + ' (Vorzeichen ' + vz(rh.ic.mittel) + ') gegen ' + de(rh.rechenfenster.icMittel, 4) + ' (Vorzeichen ' + vz(rh.rechenfenster.icMittel) + ') im Rechenfenster (§12). Regel: gleiches Vorzeichen = „bestätigt", sonst „widerspricht"; keine Anpassung, kein zweiter Lauf, keine Deutung darüber hinaus. Zellen: `zellen-rueckhalte/` (13 Feldzellen und `kombination`, `rueckhalte: true`, ' + zelle.signaltageZahl + ' Signaltage ' + zelle.signaltage[0].tag + ' … ' + zelle.signaltage[zelle.signaltage.length - 1].tag + '); die versiegelten Zellen in `zellen/` sind unangetastet. Prüfdatei `pruefung/kombination-pruefungen-rueckhalte.json`.');
  rz();
  rz('| Reihe | n | Mittel | sd | se | t | MDE₈₀ |'); rz('|---|---|---|---|---|---|---|');
  rz(st('**IC, Rückhaltefenster**', rh.ic)); rz(st('Dezil oben − Universum netto, Rückhaltefenster (Pp)', rh.dezilNetto)); rz(st('Dezil oben − Universum brutto, Rückhaltefenster (Pp)', rh.dezilBrutto));
  rz(st('IC, Gesamtreihe ' + rh.gesamt.ic.n + ' Signaltage (nachrichtlich)', rh.gesamt.ic)); rz(st('Dezil oben − Universum netto, Gesamtreihe (Pp, nachrichtlich)', rh.gesamt.dezilNetto));
  rz();
  rz('Gesamtreihe, letzte 12 Signaltage: n ' + (rh.gesamt.ic.letzte12 ? rh.gesamt.ic.letzte12.n : '—') + ', IC Mittel ' + de(rh.gesamt.ic.letzte12 && rh.gesamt.ic.letzte12.mittel, 4) + '.');
  rz();
  rz('| Signaltag | IC | Paare | Dezil netto Pp | Dezil brutto Pp | Dezil k | Universum |'); rz('|---|---|---|---|---|---|---|');
  rh.reihe.forEach(function (e) { rz('| ' + e.tag + ' | ' + de(e.ic, 4) + ' | ' + (e.n == null ? '—' : e.n) + ' | ' + de(e.dezilNetto, 3) + ' | ' + de(e.dezilBrutto, 3) + ' | ' + e.k + ' | ' + e.nUni + ' |'); });
  rz();
  rz('Gegenproben: die ' + rh.gegenprobe.n + ' Monate vor ' + rh.ab + ' dieses Laufs gegen die versiegelte 92-Monats-Zelle — IC Mittel ' + de(rh.gegenprobe.icMittelDieserLauf, 6) + ' (Abweichung ' + de(rh.gegenprobe.icAbweichung, 6) + '), Dezil netto ' + de(rh.gegenprobe.dezilNettoDieserLauf, 6) + ' Pp (Abweichung ' + de(rh.gegenprobe.dezilNettoAbweichung, 6) + '); Periodenreihe des Nullpunkts gegen `einzelmessung.dezilUni.netto.mittel` der Maschine: Abweichung ' + de(rh.gegenprobe.periodenreiheGegenMaschine, 9) + '.');
  rz('Nullpunkt der Kombinationszelle (' + zelle.signaltageZahl + ' Signaltage): Orakel ' + ja(bed.a.orakel) + ' (IC ' + de(bed.a.orakelIcMittel, 4) + ' ' + ja(bed.a.orakelIc) + '), Placebo Symbole ' + ja(bed.a.placeboSymbole) + ', Zufall ' + ja(bed.a.zufall) + ', Klinke ' + ja(bed.a.leck) + '; Feldzellen K-P4 ' + ja(kp4.bestanden) + '. Prüfungen: ' + [kp1, kp2, kp3, kp4, kp5, kp6, kp7, kp8].map(function (k, i) { return 'K-P' + (i + 1) + ' ' + ja(k.bestanden); }).join(', ') + ' (K-P6 Anteil Dezil oben ' + pz(kp6.anteilOben) + ').');
  rz('Lauf: `' + JSON.stringify(zelle.lauf) + '`, Prozess ' + de(sekunden, 1) + ' s, RSS ' + de(rssMB, 0) + ' MB. Dateien: `zellen-rueckhalte/kombination.json`, `zellen-rueckhalte/kombination-nullpunkt.json`, `zellen-rueckhalte/kombination-bericht.md`.');
  var alt = fs.existsSync(DATEI_ERGEBNIS) ? fs.readFileSync(DATEI_ERGEBNIS, 'utf8') : '', iF = alt.lastIndexOf('*Geschrieben von'), iM = alt.indexOf(marke);
  var kopf = alt.slice(0, iM >= 0 ? iM : (iF >= 0 ? iF : alt.length)), fuss = iF >= 0 ? alt.slice(iF) : '';
  fs.writeFileSync(DATEI_ERGEBNIS, kopf.replace(/\s*$/, '\n\n') + R.join('\n') + '\n\n' + fuss);
}

/* ---------- 6. Kurzausgabe ---------- */
process.stdout.write([
  'Urteil (§7): ' + urteil,
  '(a) Nullpunkt ' + ja(bed.a.erfuellt) + ' [Orakel ' + ja(bed.a.orakel) + ' IC ' + ja(bed.a.orakelIc) + ' Symbole ' + ja(bed.a.placeboSymbole) + ' Zufall ' + ja(bed.a.zufall) + ' Klinke ' + ja(bed.a.leck) + ' K-P4 ' + ja(kp4.bestanden) + ']',
  '(b) Vorpruefung ' + ja(bed.b.erfuellt) + ' | (c) IC ' + de(icS.mittel, 4) + ' >= MDE80 ' + de(icS.mde80, 4) + ' ' + ja(bed.c.erfuellt) + ' | (d) t ' + de(icS.t, 2) + ' ' + ja(bed.d.erfuellt) + ' | (e) letzte 12 ' + de(bed.e.mittel, 4) + ' ' + ja(bed.e.erfuellt),
  'IC: n ' + icS.n + ', se ' + de(icS.se, 4) + ', sd ' + de(icS.sd, 4) + '; Dezil oben netto ' + de(em.dezilUni && em.dezilUni.netto && em.dezilUni.netto.mittel, 3) + ' Pp (se ' + de(em.dezilUni && em.dezilUni.netto && em.dezilUni.netto.se, 3) + ', MDE80 ' + de(em.dezilUni && em.dezilUni.netto && em.dezilUni.netto.mde80, 3) + ')',
  'K-P1..K-P8: ' + [kp1, kp2, kp3, kp4, kp5, kp6, kp7, kp8].map(function (k, i) { return 'K-P' + (i + 1) + ' ' + ja(k.bestanden); }).join(', ') + '; Auffuellung Dezil oben ' + pz(kp6.anteilOben),
  'Kontrollen rho: groesse ' + de(kontrollen.groesse.mittel, 3) + ', verschuldung ' + de(kontrollen.verschuldung.mittel, 3),
  'Lauf: ' + de(sekunden, 1) + ' s, RSS ' + de(rssMB, 0) + ' MB; Dateien ' + (pruef.lauf.dateien ? pruef.lauf.dateien.zelle : '—') + ', ' + path.basename(DATEI_PRUEF) + ', ' + path.basename(DATEI_ERGEBNIS)
].join('\n') + '\n');
if (RH) process.stdout.write('Rueckhalte (§8): ' + rh.einordnung + ' - IC ' + rh.signaltage + ' Signaltage ' + rh.fenster + ': Mittel ' + de(rh.ic.mittel, 4) + ', sd ' + de(rh.ic.sd, 4) + ', se ' + de(rh.ic.se, 4) + ', t ' + de(rh.ic.t, 2) + ', MDE80 ' + de(rh.ic.mde80, 4)
  + ' | Dezil netto: Mittel ' + de(rh.dezilNetto.mittel, 3) + ', se ' + de(rh.dezilNetto.se, 3) + ', t ' + de(rh.dezilNetto.t, 2) + ', MDE80 ' + de(rh.dezilNetto.mde80, 3) + ' | Rechenfenster IC ' + de(rh.rechenfenster.icMittel, 4)
  + ' | Gegenprobe IC-Abw. ' + de(rh.gegenprobe.icAbweichung, 6) + ', Dezil-Abw. ' + de(rh.gegenprobe.dezilNettoAbweichung, 6) + ', Periodenreihe-Abw. ' + de(rh.gegenprobe.periodenreiheGegenMaschine, 9) + '\n');
