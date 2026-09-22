'use strict';
/* Feld `sue` - Gewinnueberraschung (Mehrfaktor-Studie, Auftrag Nr. 56 vom 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md §4 Zeile 8,
 * Entscheid §9 (5), Nachtrag §11 (1); Vorlage §6). Rolle: Signal, Gewicht 1. Hoeher = besser.
 *
 *   SUE = (netto D0 - netto D4) / sd(netto D0 ... D7),   sd = Stichproben-sd mit n-1 = 7
 *
 * Quelle: Fundamentaltafel ueber sicht.fundamentalAm(sym, sicht.iso) - juengstes 10-K/10-Q mit `filed` STRIKT VOR dem Signaltag
 * (Klinke des Lesers, Aktualitaets-Tor 456 Tage), Feld quartale.netto = [D0 ... D7]: D0 = juengstes Quartal des Filings (period),
 * D4 = Vorjahresquartal, je Stichtag drei Monate zurueck (FUNDAMENTALTAFEL.md §1 "Quartalsfluss je Stichtag"). Das Signal
 * entsteht am `filed`, nie am `period` - gegenueber der 8-K-Vorabmeldung Wochen zu spaet, nie zu frueh (wird gezaehlt, nicht
 * repariert). Wege mit Marke `y` (Jahr - YTD3, f.wege.netto = acht Zeichen, eines je Stichtag) sind erlaubt und werden gezaehlt.
 *
 * null (nie 0, kein Ersatzwert): keine Panelzeile am Signaltag (z < 0), kein Filing im Tor, quartale.netto fehlt oder hat
 * weniger als acht Eintraege, eines der acht Quartale null/nicht endlich, sd = 0 (acht gleiche Quartale). Nichts gekappt,
 * nichts winsorisiert: |SUE| > 5 ist ein Wert (Vorlage §6, Auftrag §1a.7).
 *
 * Zaehler (Auftrag §1a.6): zaehlen nur, aendern keinen Wert. Sie laufen ueber ALLE Aufrufe der Maschine (Hauptlauf + Placebo
 * Versatz + weitere Kontrollen) und werden je Durchlauf und Tag (sicht.iso) gefuehrt: ein neuer Durchlauf beginnt, wenn das Datum
 * gegenueber dem vorigen Aufruf zurueckspringt (der Versatz +21 Handelstage trifft in 29 von 92 Faellen einen Signaltag, darum
 * reicht der Tag allein nicht). Ausgabe beim Prozessende als Zeilen `ZAEHLER-SUE <durchlauf> <tag> <json>` auf stdout.
 * Keine Module (kein fs, kein Pruefstand).
 *
 * NUR LESEN ueber `sicht`. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */

var JE_TAG = {};                                              /* "<durchlauf>|<sicht.iso>" -> Zaehler */
var LETZTER = null, DURCHLAUF = 0;

function zaehler(tag) {
  if (LETZTER === null || tag < LETZTER) DURCHLAUF++;         /* Datum springt zurueck: neuer Durchlauf der Maschine */
  LETZTER = tag;
  var k = DURCHLAUF + '|' + tag, c = JE_TAG[k];
  if (!c) c = JE_TAG[k] = { aufrufe: 0, keineZeile: 0, keinFiling: 0, quartalFehlt: 0, sdNull: 0, werte: 0,
                            mitY: 0, yQuartale: 0, tagUngleichIso: 0, formen: {}, abstand: {} };
  return c;
}

function sue(q) {                                             /* q = acht endliche Zahlen; Rueckgabe Zahl oder null (sd = 0) */
  var s = 0, i;
  for (i = 0; i < 8; i++) s += q[i];
  var m = s / 8, ss = 0;
  for (i = 0; i < 8; i++) ss += (q[i] - m) * (q[i] - m);
  var sd = Math.sqrt(ss / 7);                                 /* Stichproben-sd, n-1 = 7 (Entscheid §9 (5)) */
  if (!(sd > 0)) return null;
  var w = (q[0] - q[4]) / sd;
  return (typeof w === 'number' && isFinite(w)) ? w : null;
}

module.exports = {
  feld: 'sue',
  definition: '(quartale.netto[0] − quartale.netto[4]) / sd(quartale.netto[0…7], Stichproben-sd n−1) des jüngsten 10-K/10-Q mit filed strikt vor dem Signaltag (Tor 456 Tage); Verhältnis (standardisierte Gewinnüberraschung), höher = besser; null bei fehlendem Filing, fehlendem Quartal oder sd = 0',
  quellen: ['Fundamentaltafel fundamentaltafel-2026-09-16/v1 (quartale.netto D0…D7, wege.netto, über sicht.fundamentalAm)',
            'Panel querschnitt-pruefstand-2026-09-13/panel/v2 (nur sicht.zeileAm: Zeile am Signaltag vorhanden)'],
  zaehler: JE_TAG,
  werte: function (sym, tag, sicht) {                          /* sym: Kuerzel, tag: ISO-Signaltag, sicht: Pruefstand-Sicht */
    var c = zaehler(sicht.iso);
    c.aufrufe++;
    if (tag !== sicht.iso) c.tagUngleichIso++;
    var z = sicht.zeileAm(sym);                                /* Panelzeile am Signaltag; -1 = keine => null */
    if (z < 0) { c.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);               /* genau EIN Bilanzzugriff, mit Klinke (filed < Signaltag) */
    if (!f) { c.keinFiling++; return null; }
    var q = f.quartale && f.quartale.netto;
    if (!q || q.length < 8) { c.quartalFehlt++; return null; }
    for (var i = 0; i < 8; i++) {
      if (typeof q[i] !== 'number' || !isFinite(q[i])) { c.quartalFehlt++; return null; }
    }
    var w = sue(q);
    if (w === null) { c.sdNull++; return null; }
    /* ab hier nur Zaehler ueber genutzte Filings */
    c.werte++;
    var wege = f.wege && f.wege.netto;
    if (typeof wege === 'string') {
      var y = 0;
      for (var k = 0; k < wege.length; k++) if (wege.charAt(k) === 'y') y++;
      if (y > 0) c.mitY++;
      c.yQuartale += y;
    }
    var form = String(f.form);
    c.formen[form] = (c.formen[form] || 0) + 1;
    var d = Math.round((Date.parse(sicht.iso) - Date.parse(f.filed)) / 86400000);   /* Kalendertage filed -> Signaltag (> 0) */
    c.abstand[d] = (c.abstand[d] || 0) + 1;
    return w;
  },
};

process.on('exit', function () {                              /* Zaehler ausgeben; stdout beim Lauf in eine Datei umleiten */
  var ks = Object.keys(JE_TAG).sort();
  for (var i = 0; i < ks.length; i++) process.stdout.write('ZAEHLER-SUE ' + ks[i].replace('|', ' ') + ' ' + JSON.stringify(JE_TAG[ks[i]]) + '\n');
});
