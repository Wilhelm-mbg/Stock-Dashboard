'use strict';
/* TEIL 2 - Laeufer fuer die vier vorregistrierten Rangfunktionen und die Periodenreihe des Momentums.
 *
 * Aufruf:  node --max-old-space-size=6144 kandidaten.js --aus <ordner>
 *                 [--nur leck,momentum,kandidaten] [--bericht <datei.json>]
 *
 * Schreibt SOFORT nach jedem Teilergebnis auf die Platte (Vorgabe <aus>/kandidaten.json) und die
 * Momentum-Periodenreihe zusaetzlich nach <aus>/momentum-perioden.json (die braucht der Aussen-Pruefstein).
 *
 * Es wird NICHTS repariert: faellt eine Kontrolle, steht das im Bericht und der Lauf laeuft nicht weiter,
 * als ob nichts waere. Die Tore (§T2.4) werden hier NICHT entschieden - das tut urteil-teil2.js, weil
 * Tor T-1 vom Aussen-Pruefstein abhaengt.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. Nur Lesezugriff.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var KO = require('./kontrollen.js');

function args(argv) {
  var a = { aus: null, nur: null, bericht: null };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--nur') a.nur = String(argv[++i]).split(',');
    else if (x === '--bericht') a.bericht = argv[++i];
  }
  return a;
}
function will(a, n) { return !a.nur || a.nur.indexOf(n) !== -1; }

function haupt() {
  var a = args(process.argv.slice(2));
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  var berichtPfad = a.bericht || path.join(a.aus, 'kandidaten.json');
  var momPfad = path.join(a.aus, 'momentum-perioden.json');
  var t0 = Date.now();
  function sag(s) { process.stdout.write(s + '\n'); }

  sag('Tafel laden aus ' + a.aus + ' ...');
  var T = PR.Tafel(a.aus);
  var regime = PR.spyRegime(T);
  sag('Tafel: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, bis ' + T.kal.tage[T.maxTag] + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');

  var B = { kennung: K.KONFIG_KENNUNG_TEIL2, panel: T.stand.kennung, kunst: !!T.stand.kunst,
    stand: new Date().toISOString(), letzterTag: T.kal.tage[T.maxTag], zeilen: T.g.n, reihen: T.nSym,
    testzahl: K.TESTZAHL, bonferroniT: K.BONFERRONI_T, befunde: [], laeufe: {} };
  function sichern() { fs.writeFileSync(berichtPfad + '.tmp', JSON.stringify(B, null, 1)); fs.renameSync(berichtPfad + '.tmp', berichtPfad); }
  sichern();

  /* ---------- (0) Leck-Sperrklinke: lebt sie in DIESEM Lauf? ---------- */
  if (will(a, 'leck')) {
    var lp = PR.lauf(T, RF.leckProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
    var sp = PR.lauf(T, RF.sauberProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
    B.leck = { verstoesseLeck: lp.verstoesse, verstoesseSauber: sp.verstoesse,
      bestanden: lp.verstoesse > 0 && lp.ungueltig === true && sp.verstoesse === 0 && sp.ungueltig === false };
    if (!B.leck.bestanden) B.befunde.push('LECK-PROBE GEFALLEN in Teil 2: ' + lp.verstoesse + ' / ' + sp.verstoesse);
    sag('Leck-Probe: ' + lp.verstoesse + ' (Leck) / ' + sp.verstoesse + ' (sauber) => ' + (B.leck.bestanden ? 'bestanden' : 'GEFALLEN'));
    sichern();
  }

  /* ---------- (1) Momentum monatlich, diesmal MIT Periodenreihe (§T2.1) ---------- */
  if (will(a, 'momentum')) {
    var rm = KO.fahre(T, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', regime: regime });
    B.laeufe['momentum-12-1/monat'] = rm;
    var mom = { kennung: K.KONFIG_KENNUNG_TEIL2, panel: T.stand.kennung, rang: rm.rang, freq: 'monat',
      stand: new Date().toISOString(), letzterTag: T.kal.tage[T.maxTag],
      n: rm.perioden, bruttoMittel: rm.brutto.mittel, nettoMittel: rm.netto.mittel,
      perioden: rm.perioden_reihe };
    fs.writeFileSync(momPfad + '.tmp', JSON.stringify(mom, null, 1)); fs.renameSync(momPfad + '.tmp', momPfad);
    sag('Momentum monat: n ' + rm.perioden + ', brutto ' + rm.brutto.mittel.toFixed(4) + ' Pp, Periodenreihe '
      + rm.perioden_reihe.length + ' Eintraege ' + rm.perioden_reihe[0].monat + ' .. '
      + rm.perioden_reihe[rm.perioden_reihe.length - 1].monat + ' -> ' + momPfad);
    /* Gegenprobe zur Vorregistrierung (T2-P3/T2-P4): Summe und Eindeutigkeit der Monate. */
    var s = 0, mon = {}, dop = 0;
    rm.perioden_reihe.forEach(function (p) { s += p.netto; if (mon[p.monat]) dop++; mon[p.monat] = 1; });
    var abw = Math.abs(s / rm.perioden_reihe.length - rm.netto.mittel);
    B.periodenreihePruefung = { n: rm.perioden_reihe.length, erwartet: rm.perioden, doppelteMonate: dop, mittelAbweichung: abw };
    if (dop > 0 || abw > 1e-9 || rm.perioden_reihe.length !== rm.perioden) B.befunde.push('PERIODENREIHE FEHLERHAFT: n ' + rm.perioden_reihe.length + '/' + rm.perioden + ', doppelte Monate ' + dop + ', Mittelabweichung ' + abw);
    sichern();
  }

  /* ---------- (2) Die acht vorregistrierten Zeilen ---------- */
  if (will(a, 'kandidaten')) {
    B.kandidaten = {};
    RF.KANDIDATEN.forEach(function (fn) {
      K.FREQUENZEN.forEach(function (F) {
        var t1 = Date.now();
        var schluessel = fn.$name + '/' + F.key;
        var r = KO.fahre(T, fn, { freq: F.key, empfindlichkeit: 'haupt', regime: regime });
        r.kandidat = fn.$kandidat;
        /* Empfindlichkeit gegen die Ausbuchungsregel (Tor T-7) und gegen die Eroeffnungs-Huerde (T-8). */
        var varianten = {};
        ['streng', 'milde'].forEach(function (e) {
          var v = KO.fahre(T, fn, { freq: F.key, empfindlichkeit: e, regime: regime });
          varianten[e] = { brutto: v.brutto.mittel, netto: v.netto.mittel, t: v.netto.t, tote: v.zaehler.tote };
        });
        var ve = KO.fahre(T, fn, { freq: F.key, empfindlichkeit: 'haupt', huerdeFenster: 'eroeffnung', regime: regime });
        varianten.eroeffnungsHuerde = { brutto: ve.brutto.mittel, netto: ve.netto.mittel, t: ve.netto.t, kosten: ve.kostenMittel };
        r.varianten = varianten;
        r.sekunden = (Date.now() - t1) / 1000;
        B.kandidaten[schluessel] = r;
        sag(schluessel + ': brutto ' + r.brutto.mittel.toFixed(4) + ' Pp (t ' + (r.brutto.t == null ? '-' : r.brutto.t.toFixed(2))
          + '), netto ' + r.netto.mittel.toFixed(4) + ' Pp (t ' + (r.netto.t == null ? '-' : r.netto.t.toFixed(2))
          + '), n ' + r.perioden + ', Umschlag ' + (100 * r.umschlagMittel).toFixed(1) + ' %, Kosten '
          + r.kostenMittel.toFixed(4) + ' Pp, Tote ' + r.zaehler.tote + ', Verstoesse ' + r.verstoesse
          + ' (' + r.sekunden.toFixed(0) + ' s)');
        if (r.verstoesse > 0) B.befunde.push('LECK im Lauf ' + schluessel + ': ' + r.verstoesse + ' Verstoesse - Lauf UNGUELTIG');
        sichern();
      });
    });
  }

  B.sekunden = (Date.now() - t0) / 1000;
  sichern();
  sag('\n' + (B.befunde.length ? 'BEFUNDE:\n- ' + B.befunde.join('\n- ') : 'keine Befunde im Laeufer (Tore entscheidet urteil-teil2.js)'));
  sag('Bericht: ' + berichtPfad + ' (' + B.sekunden.toFixed(0) + ' s)');
}

if (require.main === module) haupt();
