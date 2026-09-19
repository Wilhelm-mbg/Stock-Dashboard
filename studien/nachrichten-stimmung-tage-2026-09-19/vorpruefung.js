'use strict';
/* Nachrichten-Stimmung, Tagesdesign (Nr. 45, 19.09.2026): Vorprüfung der Auflösung OHNE Stimmung.
 *
 * Frage (Auftrag §1.8): Welche Auflösung (MDE80 in Pp je Halteperiode) hat eine TÄGLICHE Querschnittsmessung
 * „Dezil gegen Universum" (und „Dezil oben gegen unten") auf dem Panel v2.1 in den Klassen 2 und 3 (250-1000 /
 * ab1000 Mio $ Tagesumsatz), getrennt und gepoolt, bei Haltedauern 1 / 3 / 5 Handelstage, Signaltag = jeder
 * Handelstag 2017-01 … 2026-08? Ohne Stimmung: die Paar-Standardabweichung eines ZUFALLS-Dezils (Nullpunkt, Mittel
 * ≈ 0) gegen das Universum, se nach Hansen-Hodrick (Rechteck, Lag H−1, `momente(…, H)` der Maschine, Zeitindex =
 * laufende Handelstagsnummer). Das Ergebnis ist ein BODEN (MACHBARKEIT.md §7): ein echtes Dezil trägt Faktorneigung,
 * realistische Spanne ×2–4 — die Tafel weist ×1/×2/×4 aus.
 *
 * Haltekonvention hier: die der Maschine (`halte`: Eröffnung(a) → Eröffnung(aEnde), a = nächster Handelstag nach t,
 * aEnde = H-ter Panel-Handelstag nach a). Das registrierte Design steigt zum Schluss von t ein (VORREGISTRIERUNG §4);
 * die Periode ist gleich lang, nur um eine Nacht versetzt — für die Streuung ohne Belang, für den Einstieg nachrichtlich
 * mitgeführt (§4 „Eröffnung t+1").
 *
 * NUR LESEN am Panel (Tafel('voll'), Kennung panel/v2). Keine Stimmung, kein Netz, kein Modell, kein Datenbau.
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 *
 * Aufruf (aus der Repo-Wurzel):
 *   node --max-old-space-size=6144 studien/nachrichten-stimmung-tage-2026-09-19/vorpruefung.js [--von 2017-01-01] [--bis 2026-08-31]
 * Schreibt vorpruefung.json in den Studienordner.
 */
var fs = require('fs'), path = require('path');
var Q = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var PR = require(path.join(Q, 'pruefstand.js')), K = require(path.join(Q, 'konfig.js')), ST = require(path.join(Q, 'statistik.js'));
var KONST = require(path.join(__dirname, 'konstanten.js'));

var H_LISTE = KONST.HALTEDAUERN, ZIEHUNGEN = 5, SAAT = KONST.SAAT_VORPRUEFUNG, KL = KONST.KLASSEN, MIN_N = KONST.MIN_UNIVERSUM_JE_TAG;
var GRUPPEN = ['2', '3', '23'];
var arg = {}; process.argv.slice(2).forEach(function (a, i, L) { if (a.slice(0, 2) === '--') arg[a.slice(2)] = L[i + 1]; });
var VON = arg.von || KONST.FENSTER_VON, BIS = arg.bis || KONST.FENSTER_BIS;

function sag(s) { process.stdout.write(s + '\n'); }
function periodenEnde(T, a, n) { var k = 0; for (var d = a + 1; d <= T.maxTag; d++) { if (T.tagVon[d] < 0) continue; k++; if (k === n) return d; } return null; }
function mischen(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
function mittel(xs) { var m = 0; xs.forEach(function (x) { m += x; }); return xs.length ? m / xs.length : null; }

var t0 = Date.now();
var T = PR.Tafel(path.join(Q, 'voll'));
sag('Tafel geladen: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, Kennung ' + T.stand.kennung + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
var totalverlust = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (g) { totalverlust[g] = true; });

/* Laufende Handelstagsnummer je Kalenderindex — Zeitindex für Hansen-Hodrick (Lag in Handelstagen, nicht Kalendertagen). */
var ordinal = {}, nr = 0;
for (var tt = 0; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) ordinal[tt] = nr++;

var reihen = { 2: [], 3: [], 23: [] }, zaehler = { signaltage: 0, ohneUniversum: 0, ohneEnde: 0, duenn: { 2: 0, 3: 0, 23: 0 } };
for (var t = 0; t <= T.maxTag; t++) {
  if (T.tagVon[t] < 0) continue;
  var iso = T.kal.tage[t];
  if (iso < VON || iso > BIS) continue;
  zaehler.signaltage++;
  var u = PR.universum(T, t, { klassen: KL });
  if (!u.liste.length) { zaehler.ohneUniversum++; continue; }
  var a = u.aTag, enden = {}, fehlt = false;
  H_LISTE.forEach(function (H) { enden[H] = periodenEnde(T, a, H); if (enden[H] === null) fehlt = true; });
  if (fehlt) { zaehler.ohneEnde++; continue; }
  var byK = { 2: [], 3: [] }; u.liste.forEach(function (e) { byK[e.klasse].push(e); });
  byK[23] = u.liste;
  function korb(L, aE) { var z = { tote: 0, toteTotalverlust: 0, luecken: 0 }; return PR.halte(T, L, a, aE, totalverlust, z).periode; }
  GRUPPEN.forEach(function (k) {
    var L = byK[k];
    if (L.length < MIN_N) { zaehler.duenn[k]++; return; }
    var d = Math.max(2, Math.round(L.length / 10)), eintrag = { t: ordinal[t], iso: iso, n: L.length, d: d, uni: {}, dezil: {}, ls: {} };
    var perms = [];
    for (var j = 0; j < ZIEHUNGEN; j++) perms.push(mischen(L.slice(), ST.mulberry32(ST.fnv(SAAT + '|' + k + '|' + iso + '|' + j))));
    H_LISTE.forEach(function (H) {
      var aE = enden[H], uni = korb(L, aE), dez = [], ls = [];
      perms.forEach(function (perm) {
        var rTop = korb(perm.slice(0, d), aE), rBot = korb(perm.slice(perm.length - d), aE);
        dez.push(rTop - uni); ls.push(rTop - rBot);
      });
      eintrag.uni[H] = uni; eintrag.dezil[H] = dez; eintrag.ls[H] = ls;
    });
    reihen[k].push(eintrag);
  });
}
sag('Signaltage ' + zaehler.signaltage + ', ohne Universum ' + zaehler.ohneUniversum + ', ohne Periodenende ' + zaehler.ohneEnde + ', dünn ' + JSON.stringify(zaehler.duenn) + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

/* ---------- Zusammenfassung je Gruppe × Haltedauer × Portfolio: HH-se je Ziehung, Mittel über Ziehungen ---------- */
function fasse(P, feld, H) {
  if (P.length < 30) return { n: P.length, duenn: true };
  var sds = [], mws = [], seHH = [], seNaiv = [], tNull = [];
  for (var j = 0; j < ZIEHUNGEN; j++) {
    var m = ST.momente(P.map(function (p) { return { t: p.t, x: p[feld][H][j] }; }), H);
    sds.push(m.sd); mws.push(m.mittel); seHH.push(m.se); seNaiv.push(m.seNaiv); tNull.push(m.t);
  }
  var se = mittel(seHH), mde = K.MDE_FAKTOR * se;
  return { n: P.length, sd: mittel(sds), mittel: mittel(mws), se: se, seNaiv: mittel(seNaiv), faktorHH: se / mittel(seNaiv),
    tNullMax: Math.max.apply(null, tNull.map(Math.abs)), mde80: mde, mde80x2: 2 * mde, mde80x4: 4 * mde,
    mde80Bonf: KONST.MDE_FAKTOR_T3 * se, nMittel: mittel(P.map(function (p) { return p.n; })), dMittel: mittel(P.map(function (p) { return p.d; })) };
}
function huerde(k, P) {
  if (k !== '23') return K.huerdeVon(+k);
  /* gepoolt: Mischhürde nach mittlerem Klassenanteil — Kl. 2 zählt n2, Kl. 3 n3, aus den getrennten Reihen desselben Tags */
  var n2 = {}, n3 = {}; reihen[2].forEach(function (p) { n2[p.iso] = p.n; }); reihen[3].forEach(function (p) { n3[p.iso] = p.n; });
  var s = 0, w = 0; P.forEach(function (p) { var a2 = n2[p.iso] || 0, a3 = n3[p.iso] || 0; if (a2 + a3) { s += (a2 * K.huerdeVon(2) + a3 * K.huerdeVon(3)) / (a2 + a3); w++; } });
  return w ? s / w : null;
}
var tafel = {}, letzterTag = null;
GRUPPEN.forEach(function (k) { reihen[k].forEach(function (p) { if (!letzterTag || p.iso > letzterTag) letzterTag = p.iso; }); });
GRUPPEN.forEach(function (k) {
  var P = reihen[k], hu = huerde(k, P);
  tafel[k] = { tage: P.length, huerdeJeUmlauf: hu, haltedauer: {}, jeJahr: {}, letzte250: {} };
  H_LISTE.forEach(function (H) {
    var z = { dezilUni: fasse(P, 'dezil', H), ls: fasse(P, 'ls', H) };
    /* Nötige Bruttokante je Periode = Kosten des Dezils je Umlauf (Long-Uni: 1 Umlauf, Universum ≈ 0 Umschlag; L-S: 2 Umläufe) */
    z.noetigBruttoLongUni = hu; z.noetigBruttoLS = 2 * hu;
    tafel[k].haltedauer[H] = z;
  });
  var jahre = {}; P.forEach(function (p) { var j = p.iso.slice(0, 4); (jahre[j] = jahre[j] || []).push(p); });
  Object.keys(jahre).forEach(function (j) { tafel[k].jeJahr[j] = { tage: jahre[j].length, nMittel: mittel(jahre[j].map(function (p) { return p.n; })), dezilUni1: fasse(jahre[j], 'dezil', 1) }; });
  var P250 = P.slice(-250); tafel[k].letzte250 = { von: P250.length ? P250[0].iso : null, bis: letzterTag, dezilUni: {} };
  H_LISTE.forEach(function (H) { tafel[k].letzte250.dezilUni[H] = fasse(P250, 'dezil', H); });
});

var aus = { kennung: KONST.KENNUNG_VORPRUEFUNG, panel: T.stand.kennung, panelStand: T.stand.stand, stand: new Date().toISOString(),
  fenster: [VON, BIS], haltedauern: H_LISTE, ziehungen: ZIEHUNGEN, saat: SAAT, klassen: KL, mdeFaktor: K.MDE_FAKTOR, mdeFaktorT3: KONST.MDE_FAKTOR_T3,
  haltekonvention: 'halte(): Eroeffnung(a) -> Eroeffnung(aEnde), a = naechster Handelstag nach t, aEnde = H-ter Panel-Handelstag nach a',
  zaehler: zaehler, tafel: tafel, dauerS: (Date.now() - t0) / 1000 };
fs.writeFileSync(path.join(__dirname, 'vorpruefung.json'), JSON.stringify(aus, null, 1));

function f3(x) { return x == null ? '-' : x.toFixed(3); }
sag('\nGruppe | H | Tage | n/Tag | Dezil | sd | se_HH | HH/naiv | Mittel | MDE80 ×1 | ×2 | ×4 | Hürde Long-Uni | Hürde L-S | MDE80 L-S');
GRUPPEN.forEach(function (k) {
  H_LISTE.forEach(function (H) {
    var z = tafel[k].haltedauer[H], d = z.dezilUni; if (d.duenn) { sag(k + ' | ' + H + ' | dünn'); return; }
    sag(k + ' | ' + H + ' | ' + d.n + ' | ' + d.nMittel.toFixed(0) + ' | ' + d.dMittel.toFixed(0) + ' | ' + f3(d.sd) + ' | ' + f3(d.se) + ' | ' + d.faktorHH.toFixed(2) + ' | ' + f3(d.mittel) + ' | ' + f3(d.mde80) + ' | ' + f3(d.mde80x2) + ' | ' + f3(d.mde80x4) + ' | ' + f3(z.noetigBruttoLongUni) + ' | ' + f3(z.noetigBruttoLS) + ' | ' + f3(z.ls.mde80));
  });
});
sag('Dauer ' + aus.dauerS.toFixed(0) + ' s');
