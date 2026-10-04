'use strict';
/* ZAEHLLAUF 3, Schritt 1 - KOPIE von ../phase2/t4-universum.js fuer den DRITTEN Zaehllauf der Gruende-Tafel (Auftrag Nr. 90).
 *
 * Das Original aus Nr. 86 bleibt unangetastet. Gegenueber dem Original:
 *   V1 - Polygon-Liste: die NEUE Datei massive/verschwundene-2026-10-04.json (nur lesen). Die Regel polygonFirma() selbst
 *        ist unveraendert (Eintrag MIT CIK, hoechstens 45 Tage vom Anker, der naechste). Dazu je Reihe ALLE Eintraege des
 *        Kuerzels (`polygonEintraege`, fuer V5 iii) und die Zaehlung, wo der Eintrag ein anderer ist als im zweiten Lauf.
 *   V8 - je Reihe ALLE Ende-Massnahmen der Datei des Kuerzels (`endeMassnahmen`): alter Ordner UND Nachtrag (gleiche `id`:
 *        der Nachtrag gilt; ein Satz ohne `id` ist ein eigener Satz und wird gezaehlt), je Satz die ROLLE der Reihe
 *        (abgebend / aufnehmend / fremd; Punkt und Bindestrich im Kuerzel gleichgesetzt). Die Einstufung prueft sie ohne
 *        Plattenzugriff. `massnahmeEnde` (die juengste der Datei, wie bisher) bleibt daneben stehen - fuer den Vergleich.
 *
 * Liest NUR (auch auf E:). Schreibt: z3-verschwundene.json in DIESEN Ordner. Es entsteht keine Tafel.
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('../phase2/p2.js');                           // nur lebenszeitMinuten() - gelesen wird, geschrieben nichts
var Z3 = require('./z3.js');

var KANAL = path.join(G.REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage');
var POLYGON_TAGE = 45;                                      // R-a / V1

/* letzter Schlusskurs aus den Tagesdateien der Kanalstudie - wie im Original */
function schlussVon(reihe) {
  for (var d = 0; d < 4; d++) {
    var p = path.join(KANAL, 'tage-' + d, reihe + '.json');
    if (!fs.existsSync(p)) continue;
    try { var j = JSON.parse(fs.readFileSync(p, 'utf8')), n = (j.c1 || []).length; if (n) return { c1: j.c1[n - 1], c3: j.c3[n - 1] }; } catch (e) { return null; }
  }
  return null;
}

/** R-a, reine Regel (unveraendert): der Eintrag MIT CIK, dessen Abgangsdatum dem Anker am naechsten liegt - hoechstens
 *  `maxTage` Kalendertage davor oder danach. Sonst null. */
function polygonFirma(eintraege, anker, maxTage) {
  var best = null;
  (eintraege || []).forEach(function (p) {
    if (!p || !p.bis || !p.cik) return;
    var d = G.tageZwischen(anker, p.bis);
    if (Math.abs(d) <= maxTage && (!best || Math.abs(d) < Math.abs(best.tage))) best = { cik: p.cik, name: p.name || null, bis: p.bis, tage: d };
  });
  return best;
}

/* ---------- V8: alle Ende-Massnahmen, mit Rolle ---------- */
function kz(s) { return String(s == null ? '' : s).toUpperCase().replace(/\./g, '-'); }
/** Rolle der Reihe in einem Satz: abgebend = old_symbol (Umbenennung), acquiree_symbol (Uebernahme), symbol (Ruecknahme,
 *  Ausbuchung); aufnehmend = new_symbol / acquirer_symbol; sonst fremd. */
function rolle(s, basis) {
  var b = kz(basis), fusion = /_mergers$/.test(s._art), um = s._art === 'name_changes';
  var ab = um ? s.old_symbol : fusion ? s.acquiree_symbol : s.symbol;
  var auf = um ? s.new_symbol : fusion ? s.acquirer_symbol : null;
  if (ab != null && ab !== '' && kz(ab) === b) return 'abgebend';
  if (auf != null && auf !== '' && kz(auf) === b) return 'aufnehmend';
  return 'fremd';
}
/** Reine Regel: die Ende-Massnahmen aus den Satzlisten beider Ordner, aufsteigend nach Tag. Gleiche `id`: der Nachtrag
 *  ersetzt den alten Satz; ein Satz ohne `id` bleibt ein eigener Satz. Der Tag wie im Original (ex_date, sonst
 *  process_date, sonst effective_date). */
function endeMassnahmen(alt, nachtrag, basis) {
  var je = {}, aus = [];
  function nimm(s, woher) {
    if (G.ENDE_ARTEN.indexOf(s._art) === -1) return;
    var ex = s.ex_date || s.process_date || s.effective_date;
    if (!ex) return;
    var m = { art: s._art, ex: ex, id: s.id || null, rate: (s.rate != null ? s.rate : null), neuesKuerzel: s.new_symbol || s.acquirer_symbol || null, rolle: rolle(s, basis), woher: woher };
    if (m.id && je[m.id] !== undefined) { m.woher = woher === 'nachtrag' ? 'nachtrag-ersetzt-alt' : woher; aus[je[m.id]] = m; return; }
    if (m.id) je[m.id] = aus.length;
    aus.push(m);
  }
  (alt || []).forEach(function (s) { nimm(s, 'alt'); });
  (nachtrag || []).forEach(function (s) { nimm(s, 'nachtrag'); });
  return aus.sort(function (a, b) { return a.ex < b.ex ? -1 : a.ex > b.ex ? 1 : 0; });
}
function saetzeAus(ordnerPfad, ordner) { var j = Z3.lies(path.join(ordnerPfad, ordner.replace(/~2$/, '') + '.json')); return (j && j.saetze) || []; }

function main() {
  var L = P.lebenszeitMinuten(), R = G.reihen(), poly = Z3.polygonNeu();
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')), tafelJe = {};
  T.reihen.forEach(function (z) { tafelJe[z.reihe] = z; });
  var sy = G.symbole(), ordnerK = sy.ordner || {}, gruppeK = sy.gruppe || {};
  var lauf2 = {}; G.json(path.join(Z3.P2, 't4-verschwundene.json')).reihen.forEach(function (r) { lauf2[r.reihe] = r; });

  var zaehler = { aktien: R.reihen.length, tafelAlt: T.reihen.length, nichtLebend: 0, davonInAlterTafel: 0, neu: 0, alteZeilenJetztLebend: 0,
    ankerWechseltUeber3Tage: 0, mitPolygonFirma: 0, ohnePolygonFirma: 0, ohneLetztenKurs: 0, ankerAbweichungZuNr79: 0,
    nichtImZweitenLauf: 0, ankerAndersAlsLauf2: 0, kursAndersAlsLauf2: 0, juengsteMassnahmeAndersAlsLauf2: 0,
    polygonEintragAnders: 0, polygonEintragAndersReihen: [], endeSaetze: 0, endeSaetzeOhneId: 0, endeSaetzeAusNachtrag: 0, nachtragErsetztAlt: 0, reihenMitEndeSatz: 0, jeRolle: {}, jeArt: {} };
  var aus = [], muster = {};
  R.reihen.forEach(function (r) {
    var w = L.werte[r.reihe];
    if (!w || !w.aktie) throw new Error('Reihe fehlt in lebenszeit-minuten.json: ' + r.reihe);
    if (w.letzterMinutentag !== r.letzterMinutentag) zaehler.ankerAbweichungZuNr79++;
    var z = tafelJe[r.reihe] || null;
    if (w.lebend === 1) { if (z) zaehler.alteZeilenJetztLebend++; return; }
    zaehler.nichtLebend++; if (z) zaehler.davonInAlterTafel++; else zaehler.neu++;
    var basis = r.basis, ordner = ordnerK[basis] || basis;
    var m = G.massnahmen(ordner), s = schlussVon(r.reihe);
    var roh = saetzeAus(G.MASSN, ordner);
    roh.forEach(function (x) { if (G.ENDE_ARTEN.indexOf(x._art) !== -1 && !muster[x._art]) muster[x._art] = Object.keys(x).join(' '); });
    var em = endeMassnahmen(roh, saetzeAus(Z3.MASSN_NACHTRAG, ordner), basis);          // V8
    zaehler.endeSaetze += em.length; if (em.length) zaehler.reihenMitEndeSatz++;
    em.forEach(function (x) { if (!x.id) zaehler.endeSaetzeOhneId++; if (x.woher === 'nachtrag') zaehler.endeSaetzeAusNachtrag++; if (x.woher === 'nachtrag-ersetzt-alt') zaehler.nachtragErsetztAlt++;
      zaehler.jeRolle[x.rolle] = (zaehler.jeRolle[x.rolle] || 0) + 1; zaehler.jeArt[x.art] = (zaehler.jeArt[x.art] || 0) + 1; });
    var wch = z ? G.ankerWechsel(z.letzter_balken, w.letzterMinutentag) : { diff: null, wechselt: true };
    if (z && wch.wechselt) zaehler.ankerWechseltUeber3Tage++;
    if (!s) zaehler.ohneLetztenKurs++;
    var pe = (poly.je[basis] || poly.je[basis.replace(/-/g, '.')] || []).slice().sort(function (a, b) { return String(a.bis) < String(b.bis) ? -1 : 1; });   // V1: neue Liste
    var pf = polygonFirma(pe, w.letzterMinutentag, POLYGON_TAGE);
    if (pf) zaehler.mitPolygonFirma++; else zaehler.ohnePolygonFirma++;
    var l2 = lauf2[r.reihe];
    if (!l2) zaehler.nichtImZweitenLauf++;
    else {
      if (l2.letzterBalken !== w.letzterMinutentag) zaehler.ankerAndersAlsLauf2++;
      if ((l2.letzterKursArchiv == null ? null : l2.letzterKursArchiv) !== (s ? s.c1 : null)) zaehler.kursAndersAlsLauf2++;
      if (JSON.stringify(l2.massnahmeEnde || null) !== JSON.stringify(m.ende || null)) zaehler.juengsteMassnahmeAndersAlsLauf2++;
      var a2 = l2.polygonFirma || null;
      if ((a2 ? a2.cik + '|' + a2.bis : '-') !== (pf ? pf.cik + '|' + pf.bis : '-')) { zaehler.polygonEintragAnders++; zaehler.polygonEintragAndersReihen.push({ reihe: r.reihe, lauf2: a2 ? a2.cik + ' ' + a2.bis : null, lauf3: pf ? pf.cik + ' ' + pf.bis : null }); }
    }
    aus.push({
      reihe: r.reihe, basis: basis, ordner: ordner, art: r.art,
      gruppe: gruppeK[basis] || 'unbekannt',
      letzterBalken: w.letzterMinutentag,                     // Anker = letzter Minutentag
      letzterBalkenAlt: z ? z.letzter_balken : null,
      letzterTagesbalken: r.letzterTagesbalken,
      ankerDiffTage: wch.diff, ankerWechselt: z ? (wch.wechselt ? 1 : 0) : null, neu: z ? 0 : 1,
      lebendAlt: r.lebendAlt,
      erloschenerTraeger: r.erloschen ? 1 : 0,
      kuerzelWiederverwendet: !!(G.lebenszeit().werte[r.reihe] && G.lebenszeit().werte[r.reihe].wiederverwendet),
      cusip: m.cusip || null,
      massnahmeEnde: m.ende,                                  // die juengste der Datei (wie im zweiten Lauf) - nur noch fuer V8 = aus und den Vergleich
      endeMassnahmen: em,                                     // V8
      barpreis: m.barpreis,
      letzterKursArchiv: s ? s.c1 : null,
      letzterKursC3: s ? s.c3 : null,
      polygon: pe.map(function (x) { return x.bis; }).filter(Boolean),
      polygonEintraege: pe,                                   // V5 iii
      polygonFirma: pf
    });
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var out = { kennung: Z3.KENNUNG, stand: new Date().toISOString(), regel: L.regel, ende: L.endeDesArchivs, lebenszeitKennung: L.kennung, manifestStand: L.manifestStand,
    xLebend: L.xHandelstage, ankerSchwelleTage: G.ANKER_SCHWELLE_TAGE, lebendAb: G.LEBEND_AB, polygonTage: POLYGON_TAGE,
    polygonDatei: path.basename(Z3.POLYGON_NEU), polygonStand: poly.stand, massnahmenOrdner: [G.MASSN, Z3.MASSN_NACHTRAG], felderJeArt: muster, zaehler: zaehler, reihen: aus };
  Z3.schreibe('z3-verschwundene.json', out);
  var kurz = Object.assign({}, zaehler); kurz.polygonEintragAndersReihen = zaehler.polygonEintragAndersReihen.map(function (x) { return x.reihe; }).join(' ');
  console.log(JSON.stringify(kurz, null, 1));
  console.log('Felder je Art:', JSON.stringify(muster));
}

module.exports = { polygonFirma: polygonFirma, POLYGON_TAGE: POLYGON_TAGE, rolle: rolle, endeMassnahmen: endeMassnahmen, kz: kz };
if (require.main === module) main();
