'use strict';
/* M3 - jede 8-K-Meldung mit Punkt 2.02 der Zeile der Bilanz-Tafel zuordnen, deren Zahlen sie bekanntgibt.
 *
 * REGEL (Vorschlag dieser Machbarkeit; alle Daten sind SEC-Einreichungsdaten `filingDate` bzw. `filed`):
 *  1. Kandidaten-Zeilen: nur Erstberichte 10-K, 10-Q, 10-KT, 10-QT (keine /A - eine Berichtigung gibt nichts bekannt).
 *     Kandidaten-Meldungen: nur Form "8-K" (keine 8-K/A).
 *  2. VORWAERTS: Zeilen mit  period < d  und  d <= filed  und  d - period <= maxTageNachPeriode  (d = Datum der Meldung).
 *     Die Zeile mit dem naechstliegenden `filed` gewinnt (bei gleichem `filed` die mit dem juengeren `period`).
 *     -> art 'vor' (Meldung vor oder am Tag des Berichts).
 *  3. Sonst RUECKWAERTS: Zeilen mit  filed < d <= filed + maxTageNachBericht  und  period < d ; die juengste gewinnt.
 *     -> art 'bericht-zuerst' (der Bericht lag schon vor; die Meldung ist NICHT die erste Veroeffentlichung der Zahl).
 *  4. Sonst art 'ohne' (kein Partner).
 *  5. Je Zeile genau EINE Hauptmeldung: unter den 'vor'-Meldungen die mit dem spaetesten Datum (am naechsten am Bericht),
 *     bei gleichem Datum die frueheste Annahmezeit. Alle anderen 'vor'-Meldungen derselben Zeile sind 'weitere'
 *     (vorlaeufige Zahlen, Nachtraege) - sie werden gezaehlt, nicht benutzt. Hat eine Zeile nur 'bericht-zuerst'-Meldungen,
 *     ist die frueheste davon ihre Hauptmeldung (wird gezaehlt, geht aber nicht in die Ereignisse ein).
 *
 * Warum die SPAETESTE Meldung vor dem Bericht und nicht die erste: eine fruehere 2.02-Meldung im selben Fenster ist oft eine
 * Vorabmeldung (Umsatzspanne, vorlaeufige Zahlen). Das Nettoergebnis des Quartals, aus dem die Ueberraschung gebildet wird,
 * stand dort noch nicht - ein Einstieg nach der Vorabmeldung mit dieser Zahl waere ein Blick in die Zukunft. Die Regel steigt
 * im Zweifel zu spaet ein, nie zu frueh.
 *
 * Dieses Modul kennt keine Kurse und keine Ertraege.
 */
var ERSTBERICHT = /^10-(K|Q|KT|QT)$/;

function tage(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }

/**
 * zeilen:    Tafelzeilen EINER Firma, je {form, period, filed} (weitere Felder egal)
 * meldungen: 2.02-Meldungen DERSELBEN Firma, je {d: filingDate, t: Annahmezeit (Text, nur fuer die Reihenfolge), f: form}
 * Ergebnis:  Array gleicher Laenge wie meldungen, je {zeile: Index in zeilen oder -1, art: 'vor'|'bericht-zuerst'|'ohne'|'form',
 *            abstand: Kalendertage Meldung -> filed (>= 0 bei 'vor', < 0 bei 'bericht-zuerst'), nachPeriode: Tage period -> Meldung,
 *            haupt: bool, gleichesFiled: bool}
 */
function ordneZu(zeilen, meldungen, opt) {
  opt = opt || {};
  var maxP = opt.maxTageNachPeriode === undefined ? 150 : opt.maxTageNachPeriode;
  var maxB = opt.maxTageNachBericht === undefined ? 5 : opt.maxTageNachBericht;
  var kand = [];
  zeilen.forEach(function (z, i) { if (ERSTBERICHT.test(z.form) && z.period && z.filed) kand.push(i); });
  var aus = meldungen.map(function (m) {
    if (m.f !== '8-K') return { zeile: -1, art: 'form', abstand: null, nachPeriode: null, haupt: false, gleichesFiled: false };
    var best = -1, gleich = false, k, z;
    for (k = 0; k < kand.length; k++) {
      z = zeilen[kand[k]];
      if (!(z.period < m.d) || !(m.d <= z.filed) || tage(z.period, m.d) > maxP) continue;
      if (best < 0 || z.filed < zeilen[best].filed) { best = kand[k]; gleich = false; }
      else if (z.filed === zeilen[best].filed) { gleich = true; if (z.period > zeilen[best].period) best = kand[k]; }
    }
    if (best >= 0) return { zeile: best, art: 'vor', abstand: tage(m.d, zeilen[best].filed), nachPeriode: tage(zeilen[best].period, m.d), haupt: false, gleichesFiled: gleich };
    for (k = 0; k < kand.length; k++) {
      z = zeilen[kand[k]];
      if (!(z.filed < m.d) || tage(z.filed, m.d) > maxB || !(z.period < m.d)) continue;
      if (best < 0 || z.filed > zeilen[best].filed || (z.filed === zeilen[best].filed && z.period > zeilen[best].period)) best = kand[k];
    }
    if (best >= 0) return { zeile: best, art: 'bericht-zuerst', abstand: -tage(zeilen[best].filed, m.d), nachPeriode: tage(zeilen[best].period, m.d), haupt: false, gleichesFiled: false };
    return { zeile: -1, art: 'ohne', abstand: null, nachPeriode: null, haupt: false, gleichesFiled: false };
  });
  /* Hauptmeldung je Zeile */
  var jeZeile = {};
  aus.forEach(function (a, i) { if (a.zeile >= 0) (jeZeile[a.zeile] = jeZeile[a.zeile] || []).push(i); });
  Object.keys(jeZeile).forEach(function (zi) {
    var l = jeZeile[zi], vor = l.filter(function (i) { return aus[i].art === 'vor'; });
    var h;
    if (vor.length) {
      h = vor.reduce(function (b, i) {
        var mb = meldungen[b], mi = meldungen[i];
        if (mi.d > mb.d) return i;
        if (mi.d === mb.d && String(mi.t || '') < String(mb.t || '')) return i;
        return b;
      });
    } else {
      h = l.reduce(function (b, i) {
        var mb = meldungen[b], mi = meldungen[i];
        if (mi.d < mb.d) return i;
        if (mi.d === mb.d && String(mi.t || '') < String(mb.t || '')) return i;
        return b;
      });
    }
    aus[h].haupt = true;
  });
  return aus;
}

module.exports = { ordneZu: ordneZu, tage: tage, ERSTBERICHT: ERSTBERICHT };
