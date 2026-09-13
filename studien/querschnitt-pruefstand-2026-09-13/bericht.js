'use strict';
/* BERICHT - aus kontrollen.json und panel/_stand.json das ERGEBNIS.md.
 *
 * Aufruf: node bericht.js --aus <ordner> [--kontrollen <datei>] [--ziel ERGEBNIS.md]
 *
 * Der Dateiname sagt, WOHER die Zahlen kommen: mit --kunst im Kontrollbericht heisst die Zieldatei
 * ERGEBNIS-KUNST.md (Fehlerform "Trockenlauf, der aussieht wie ein Befund").
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

function z(x, n) { return (x == null || !(x === x)) ? '—' : x.toFixed(n === undefined ? 4 : n); }
function pz(x, n) { return (x == null || !(x === x)) ? '—' : (x >= 0 ? '+' : '') + x.toFixed(n === undefined ? 4 : n); }

function haupt() {
  var a = { aus: 'voll', kontrollen: null, ziel: null };
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--aus') a.aus = process.argv[++i];
    else if (process.argv[i] === '--kontrollen') a.kontrollen = process.argv[++i];
    else if (process.argv[i] === '--ziel') a.ziel = process.argv[++i];
  }
  var kPfad = a.kontrollen || path.join(a.aus, 'kontrollen.json');
  var B = JSON.parse(fs.readFileSync(kPfad, 'utf8'));
  var stand = JSON.parse(fs.readFileSync(path.join(a.aus, 'panel', '_stand.json'), 'utf8'));
  var ziel = a.ziel || (B.kunst ? 'ERGEBNIS-KUNST.md' : 'ERGEBNIS.md');
  var o = [];
  var kunstWarnung = B.kunst ? '\n> **ACHTUNG: Diese Zahlen stammen vom KUNSTPANEL, nicht vom Markt.** Sie sagen etwas über den\n> Prüfrahmen und nichts über die Wirklichkeit.\n' : '';

  o.push('# Ergebnis — Querschnitts-Prüfstand, Teil 1' + (B.kunst ? ' (KUNSTSATZ)' : ''));
  o.push('');
  o.push('Erzeugt ' + new Date().toISOString() + ' von `bericht.js` aus `' + path.basename(kPfad) + '`.');
  o.push('Vorregistrierung: `VORREGISTRIERUNG.md` (erster Commit, vor jeder Zahl). Konfiguration `' + B.kennung + '`.');
  o.push('**Teil 1 baut keine Strategie und belegt keine Kante.** Alles Simulation mit virtuellem Kapital,');
  o.push('keine Anlageberatung.' + kunstWarnung);
  o.push('');

  /* ---------- Urteil ---------- */
  o.push('## Urteil');
  o.push('');
  o.push('| Kontrolle | Schranke (vorab) | Ergebnis | Urteil |');
  o.push('|---|---|---|---|');
  if (B.leck) o.push('| **Leck-Sperrklinke** | Leck-Probe meldet > 0, saubere Probe 0 | ' + B.leck.verstoesseLeck + ' / ' + B.leck.verstoesseSauber + ' | ' + (B.leck.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  if (B.laeufe.orakel) {
    var ow = B.laeufe.orakel['orakelTag/woche'], om = B.laeufe.orakel['orakelTag/monat'], op = B.laeufe.orakel['orakelPeriode/woche'];
    o.push('| **Orakel** (Rendite von morgen) | ≥ ' + K.ORAKEL_MIN_PP + ' Pp je Periode, Mittel/sd ≥ ' + K.ORAKEL_MIN_SD + ', t ≥ ' + K.ORAKEL_T_BODEN + ' | Woche ' + pz(ow.brutto.mittel, 3) + ' Pp (t ' + z(ow.brutto.t, 1) + '), Monat ' + pz(om.brutto.mittel, 3) + ' Pp (t ' + z(om.brutto.t, 1) + ') | ' + (B.orakelBestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
    o.push('| **Orakel**, Perioden-Fassung | ≥ ' + K.ORAKEL_H_MIN_PP_WOCHE + ' Pp je Woche | ' + pz(op.brutto.mittel, 3) + ' Pp (t ' + z(op.brutto.t, 1) + ') | — |');
  }
  if (B.laeufe.zufall) K.FREQUENZEN.forEach(function (F) {
    var e = B.laeufe.zufall[F.key]; if (!e) return;
    o.push('| **Zufall** (' + F.name + ') | \\|Mittel der ' + K.ZUFALL_ZIEHUNGEN + '\\| < ' + e.schranke + ' Pp; ≤ ' + K.ZUFALL_MAX_FEHLER + ' Ziehungen mit \\|t\\| ≥ 3 | ' + pz(e.mittelBrutto, 4) + ' Pp brutto, ' + pz(e.mittelNettoPlusKosten, 4) + ' Pp netto+Kosten, ' + e.fehlerEinzelnT + ' Ziehungen | ' + (e.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  });
  if (B.laeufe.momentum) {
    var mm = B.laeufe.momentum['monat/haupt'];
    if (mm) o.push('| **Momentum 12-1** (monatlich) | *kein Tor*, Erwartung positiv | brutto ' + pz(mm.brutto.mittel, 4) + ' Pp (t ' + z(mm.brutto.t, 2) + '), netto ' + pz(mm.netto.mittel, 4) + ' Pp | — |');
  }
  o.push('');
  o.push(B.bestanden ? '**Alle Kontrollen bestanden.** Der Rahmen darf in Teil 2 einen Nullbefund erzeugen.'
    : '**NICHT BESTANDEN.** ' + B.befunde.map(function (x) { return '\n- ' + x; }).join(''));
  o.push('');

  /* ---------- Tafel ---------- */
  o.push('## 1. Die Datentafel');
  o.push('');
  o.push('| Größe | Wert |');
  o.push('|---|---|');
  o.push('| Zeilen (Handelstag × Reihe) | **' + stand.zeilen.toLocaleString('de-DE') + '** |');
  o.push('| Reihen | ' + stand.symbole.length + ' (davon ' + stand.symbole.filter(function (s) { return s.referenz; }).length + ' Referenz) |');
  o.push('| Zeitraum | ' + (stand.jahre.length ? stand.jahre[0].jahr : '?') + ' bis ' + stand.letzterVollTag + ' |');
  o.push('| letzter vollständiger Handelstag | ' + stand.letzterVollTag + ' (Nachtrag 1) |');
  o.push('| unvollständige Tage am Rand | ' + (stand.unvollstaendigeTage || []).length + (stand.unvollstaendigeTage && stand.unvollstaendigeTage.length ? ' (' + stand.unvollstaendigeTage.map(function (x) { return x.tag + ': ' + x.zeilen + ' statt ~' + x.median5; }).join('; ') + ')' : '') + ' |');
  var zz = stand.zaehler || {};
  o.push('| gelesene Archivdateien | ' + (zz.dateien || 0).toLocaleString('de-DE') + ' |');
  o.push('| gelesene Bytes | ' + ((zz.bytes || 0) / 1e9).toFixed(1) + ' GB |');
  o.push('| geprüfte Minutenkerzen | ' + ((zz.kerzenGesehen || 0) / 1e9).toFixed(3) + ' Mrd |');
  o.push('| Dateien mit fremder Quelle (nicht SIP) | **' + (zz.dateienNichtRein || 0) + '** |');
  o.push('| Stempelkerzen (Form: O=H=T=C und Umsatz 0) | ' + (zz.stempelkerzen || 0).toLocaleString('de-DE') + ' von ' + (zz.kerzenGesehen || 0).toLocaleString('de-DE') + ' geprüften |');
  o.push('| Stempeltage (alle regulären Kerzen Stempel) | ' + (zz.stempeltage || 0).toLocaleString('de-DE') + ' von ' + stand.zeilen.toLocaleString('de-DE') + ' Tagen |');
  o.push('| Reihen-Lücken (Tag fehlt mitten in der Reihe) | ' + (zz.luecken || 0).toLocaleString('de-DE') + ' |');
  o.push('| ausgeschlossene Wertpapierarten | ' + JSON.stringify(stand.ausgeschlosseneArten) + ' |');
  o.push('');
  o.push('### Ersatzregel für den Tagesschluss, je Jahr');
  o.push('');
  o.push('Der Tagesschluss ist die **Eröffnung der Kerze mit dem ET-Stempel des Kalenderschlusses** (§1.3).');
  o.push('Fehlt sie, greift die Ersatzregel (Schluss der letzten regulären Kerze). So oft:');
  o.push('');
  o.push('| Jahr | Tageszeilen | Schluss-Ersatz | Anteil | Eröffnungs-Ersatz | Anteil |');
  o.push('|---|---|---|---|---|---|');
  var jahre = Object.keys(zz.tageJeJahr || {}).map(Number).sort(function (x, y) { return x - y; });
  var sumT = 0, sumS = 0, sumE = 0;
  jahre.forEach(function (j) {
    var t = zz.tageJeJahr[j] || 0, s = (zz.schlussErsatz || {})[j] || 0, e = (zz.eroeffnungErsatz || {})[j] || 0;
    sumT += t; sumS += s; sumE += e;
    o.push('| ' + j + ' | ' + t.toLocaleString('de-DE') + ' | ' + s.toLocaleString('de-DE') + ' | ' + (100 * s / Math.max(1, t)).toFixed(2) + ' % | ' + e.toLocaleString('de-DE') + ' | ' + (100 * e / Math.max(1, t)).toFixed(2) + ' % |');
  });
  o.push('| **gesamt** | **' + sumT.toLocaleString('de-DE') + '** | **' + sumS.toLocaleString('de-DE') + '** | **' + (100 * sumS / Math.max(1, sumT)).toFixed(2) + ' %** | **' + sumE.toLocaleString('de-DE') + '** | **' + (100 * sumE / Math.max(1, sumT)).toFixed(2) + ' %** |');
  o.push('');
  o.push('> **Ausschüttungen sind NICHT enthalten.** Das Archiv ist `adjustment=raw`, die bereinigte Kopie wendet');
  o.push('> Splits und gemessene Abspaltungen an, ausdrücklich keine Dividenden. In der Hauptgröße');
  o.push('> (Dezil minus Universum) kürzt sich eine gleich große Ausschüttung heraus; übrig bleibt die');
  o.push('> **Differenz** der Dividendenrendite zwischen Dezil und Universum. Sie ist **nicht gemessen**.');
  o.push('');

  /* ---------- Kontrollen im Einzelnen ---------- */
  if (B.laeufe.orakel) {
    o.push('## 2. Orakel — die Verrohrungsprobe');
    o.push('');
    o.push('| Fassung | Frequenz | n | Universum | Dezil | Umschlag | brutto (Pp) | netto (Pp) | t | Mittel/sd |');
    o.push('|---|---|---|---|---|---|---|---|---|---|');
    Object.keys(B.laeufe.orakel).forEach(function (k) {
      var r = B.laeufe.orakel[k], teil = k.split('/');
      o.push('| ' + teil[0] + ' | ' + teil[1] + ' | ' + r.perioden + ' | ' + z(r.universumMittel, 0) + ' | ' + z(r.dezilMittel, 0) + ' | ' + z(100 * r.umschlagMittel, 1) + ' % | ' + pz(r.brutto.mittel, 3) + ' | ' + pz(r.netto.mittel, 3) + ' | ' + z(r.brutto.t, 1) + ' | ' + z(r.mittelDurchSd, 2) + ' |');
    });
    o.push('');
    var ow2 = B.laeufe.orakel['orakelTag/woche'];
    o.push('Das gefallene Kriterium `t ≥ 20` (Nachtrag 4) steht der Vollständigkeit halber daneben: '
      + Object.keys(B.laeufe.orakel).filter(function (k) { return k.indexOf('orakelTag') === 0; })
        .map(function (k) { return k + ' → ' + (B.laeufe.orakel[k].altesKriteriumT20 ? 'gehalten' : 'gefallen'); }).join(', ') + '.');
    o.push('');
  }

  if (B.laeufe.zufall) {
    o.push('## 3. Zufall — muss null sein');
    o.push('');
    K.FREQUENZEN.forEach(function (F) {
      var e = B.laeufe.zufall[F.key]; if (!e) return;
      o.push('**' + F.name + '**, ' + K.ZUFALL_ZIEHUNGEN + ' Ziehungen, n = ' + e.einzeln[0].n + ' Perioden je Ziehung.');
      o.push('');
      o.push('| Ziehung | brutto (Pp) | se | t | netto (Pp) | Kosten (Pp) | Umschlag |');
      o.push('|---|---|---|---|---|---|---|');
      e.einzeln.forEach(function (x) {
        o.push('| ' + x.ziehung + ' | ' + pz(x.brutto, 4) + ' | ' + z(x.se, 4) + ' | ' + pz(x.t, 2) + ' | ' + pz(x.netto, 4) + ' | ' + z(x.kosten, 4) + ' | ' + z(100 * x.umschlag, 1) + ' % |');
      });
      o.push('| **Mittel** | **' + pz(e.mittelBrutto, 4) + '** | ' + z(e.seDesMittels, 4) + ' | | **' + pz(e.mittelNettoPlusKosten, 4) + '** (netto+Kosten) | | |');
      o.push('');
      o.push('Schranke ' + e.schranke + ' Pp = **' + z(e.schrankeInSeDesMittels, 1) + ' se** des Mittels. '
        + 'Ziehungen mit \\|t\\| ≥ ' + K.ZUFALL_T_EINZELN + ': **' + e.fehlerEinzelnT + '** von ' + K.ZUFALL_ZIEHUNGEN + '. '
        + 'Das in Nachtrag 4 **gefallene** Einzelkriterium (Pp je Ziehung) hätte ' + e.gefallenesKriteriumPpEinzeln + ' Ziehungen verworfen.');
      o.push('');
    });
  }

  if (B.laeufe.momentum) {
    o.push('## 4. Momentum 12-1 — Erwartung positiv, **kein Tor**');
    o.push('');
    o.push('| Frequenz / Ausbuchung | n | Universum | Umschlag | Kosten (Pp) | brutto (Pp) | t | netto (Pp) | t | Tote |');
    o.push('|---|---|---|---|---|---|---|---|---|---|');
    Object.keys(B.laeufe.momentum).forEach(function (k) {
      var r = B.laeufe.momentum[k];
      o.push('| ' + k + ' | ' + r.perioden + ' | ' + z(r.universumMittel, 0) + ' | ' + z(100 * r.umschlagMittel, 1) + ' % | ' + z(r.kostenMittel, 4) + ' | ' + pz(r.brutto.mittel, 4) + ' | ' + z(r.brutto.t, 2) + ' | ' + pz(r.netto.mittel, 4) + ' | ' + z(r.netto.t, 2) + ' | ' + (r.zaehler.tote || 0) + ' |');
    });
    o.push('');
    var m0 = B.laeufe.momentum['monat/haupt'];
    if (m0) {
      o.push('### Jahresscheiben (monatlich, Hauptzahl, netto)');
      o.push('');
      o.push('| Jahr | n | Mittel (Pp) | se | t | |');
      o.push('|---|---|---|---|---|---|');
      m0.jahre.netto.forEach(function (j) {
        o.push('| ' + j.jahr + ' | ' + j.n + ' | ' + pz(j.mittel, 4) + ' | ' + z(j.se, 4) + ' | ' + z(j.t, 2) + ' | ' + (j.duenn ? 'zu dünn' : '') + ' |');
      });
      var sum = m0.jahre.netto.reduce(function (s, j) { return s + j.n; }, 0);
      o.push('| **gesamt** | **' + sum + '** | **' + pz(m0.netto.mittel, 4) + '** | ' + z(m0.netto.se, 4) + ' | ' + z(m0.netto.t, 2) + ' | Jahresscheiben addieren sich |');
      o.push('');
      o.push('### Aktualität und Regime (monatlich, netto, nachrichtlich)');
      o.push('');
      o.push('| Schnitt | n | Mittel (Pp) | se | t |');
      o.push('|---|---|---|---|---|');
      o.push('| letzte ' + K.AKTUELL_TAGE + ' Handelstage (ab ' + m0.aktuell.netto.abTag + ') | ' + m0.aktuell.netto.n + ' | ' + pz(m0.aktuell.netto.mittel, 4) + ' | ' + z(m0.aktuell.netto.se, 4) + ' | ' + z(m0.aktuell.netto.t, 2) + ' |');
      o.push('| SPY über EMA200 | ' + m0.regime.ueberEMA200.n + ' | ' + pz(m0.regime.ueberEMA200.mittel, 4) + ' | ' + z(m0.regime.ueberEMA200.se, 4) + ' | ' + z(m0.regime.ueberEMA200.t, 2) + ' |');
      o.push('| SPY unter EMA200 | ' + m0.regime.unterEMA200.n + ' | ' + pz(m0.regime.unterEMA200.mittel, 4) + ' | ' + z(m0.regime.unterEMA200.se, 4) + ' | ' + z(m0.regime.unterEMA200.t, 2) + ' |');
      o.push('');
      o.push('### se: Perioden gegen Tagesreihe');
      o.push('');
      o.push('| Größe | se (Perioden, naiv) | se (Tage, naiv) | se (Tage, Hansen-Hodrick, Lag ' + m0.lag + ') | se (Tage, Newey-West) | Marke |');
      o.push('|---|---|---|---|---|---|');
      o.push('| brutto | ' + z(m0.brutto.se, 5) + ' | ' + z(m0.brutto.tagSeNaiv, 5) + ' | ' + z(m0.brutto.tagSeHH, 5) + ' | ' + z(m0.brutto.tagSeNW, 5) + ' | ' + (m0.brutto.marke || '—') + ' |');
      o.push('| netto | ' + z(m0.netto.se, 5) + ' | ' + z(m0.netto.tagSeNaiv, 5) + ' | ' + z(m0.netto.tagSeHH, 5) + ' | ' + z(m0.netto.tagSeNW, 5) + ' | ' + (m0.netto.marke || '—') + ' |');
      o.push('');
      o.push('### Empfindlichkeit gegen die Ausbuchungsregel (§3.6)');
      o.push('');
      o.push('| Variante | brutto (Pp) | netto (Pp) | Differenz zur Hauptzahl |');
      o.push('|---|---|---|---|');
      K.EMPFINDLICHKEIT.forEach(function (E) {
        var r = B.laeufe.momentum['monat/' + E.key]; if (!r) return;
        o.push('| ' + E.name + ' | ' + pz(r.brutto.mittel, 4) + ' | ' + pz(r.netto.mittel, 4) + ' | ' + pz(r.netto.mittel - m0.netto.mittel, 4) + ' |');
      });
      o.push('');
      var oc = B.laeufe.momentum['monat/ohneCentBoden'];
      if (oc) o.push('Empfindlichkeit gegen den **Cent-Boden** (§2.1, registrierte Variante): ohne ihn umfasst das Universum '
        + z(oc.universumMittel, 0) + ' statt ' + z(m0.universumMittel, 0) + ' Papiere, brutto ' + pz(oc.brutto.mittel, 4)
        + ' Pp statt ' + pz(m0.brutto.mittel, 4) + ' Pp.');
      o.push('');
      o.push('**Tote im gehaltenen Dezil:** ' + (m0.zaehler.tote || 0) + ' Fälle über ' + m0.perioden + ' Perioden, davon '
        + (m0.zaehler.toteTotalverlust || 0) + ' mit Totalverlust. ' +
        ((m0.zaehler.tote || 0) < 3 * m0.perioden / 100 ? 'Die Ausbuchungsannahme ist damit weitgehend folgenlos — auch das ist ein Befund.' : ''));
      o.push('');
    }
  }

  /* ---------- Universum ---------- */
  var ref = (B.laeufe.momentum && B.laeufe.momentum['monat/haupt']) || (B.laeufe.orakel && B.laeufe.orakel['orakelTag/woche']);
  if (ref) {
    o.push('## 5. Universum — was wegfällt und warum');
    o.push('');
    o.push('Summiert über alle Umschichtungstage des Laufs `' + (ref.rang || '?') + '`:');
    o.push('');
    o.push('| Grund | Fälle |');
    o.push('|---|---|');
    Object.keys(ref.zaehler.verworfen).forEach(function (k) { o.push('| ' + k + ' | ' + ref.zaehler.verworfen[k].toLocaleString('de-DE') + ' |');});
    o.push('| **im Universum** | **' + (ref.zaehler.universumSumme || 0).toLocaleString('de-DE') + '** |');
    o.push('');
    o.push('Mindestkurs aus dem Cent-Boden: **' + K.mindestKurs(2).toFixed(2) + ' $** (Klasse 250–1000) und **'
      + K.mindestKurs(3).toFixed(2) + ' $** (ab 1000). Perioden unter ' + K.MIN_UNIVERSUM + ' Papieren: '
      + (ref.zaehler.zuKlein || 0) + '.');
    o.push('');
  }

  o.push('## 6. Was Teil 1 **nicht** sagt');
  o.push('');
  o.push('- Keine Kante ist belegt. Momentum 12-1 ist eine Verrohrungskontrolle mit Vorzeichenerwartung,');
  o.push('  kein Kandidat — ohne Vorregistrierung als Strategie, ohne Bonferroni, ohne Urteil.');
  o.push('- Die Dividendenlücke (§1.4) ist benannt, nicht gemessen.');
  o.push('- Long-Short steht nur als Diagnose; es verlangt Wertpapierleihe und ist im Projekt gesperrt.');
  o.push('');
  fs.writeFileSync(path.join(__dirname, ziel), o.join('\n'));
  process.stdout.write('geschrieben: ' + ziel + ' (' + o.length + ' Zeilen)\n');
}

if (require.main === module) haupt();
