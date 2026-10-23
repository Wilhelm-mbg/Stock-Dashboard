'use strict';
/* Auftrag Nr. 122 (23.10.2026): Kostenmodell je Rundlauf fuer das Momentum-Buch - Spanne je Umsatzklasse (Kassa / Eroeffnung)
 * plus IBKR-Gebuehr fuer US-Aktien (IBKR Ireland, Fixed und Tiered). Alle Zahlen mit Fundstelle in quellen.md.
 * Dieses Modul liefert (a) die Kostenfunktion je Handel fuer rechnen.js und (b) die Tabelle je Klasse x Positionsgroesse.
 *   node studien/momentum-wiedervorlage-2026-10-23/kosten.js            (Tabelle auf die Konsole und nach kosten.json) */
var fs = require('fs');
var path = require('path');

/* ---------- Spanne je Umsatzklasse (Pp je UMLAUF = volle notierte Spanne (ap-bp)/mid; je Seite die Haelfte) ----------
 * mitte ab 2021: wiki/kosten.md "Kassa-Huerde je Umsatzklasse und Jahr" (studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md)
 * Eroeffnungsfaktor: studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js KLASSEN (eroeffnung/mitte, alle Jahre gepoolt) */
var KLASSEN = [
  { name: '5-50', von: 5e6, bis: 50e6, kassa: 0.1569, faktor: 2.68, kurs: 35.67 },
  { name: '50-250', von: 50e6, bis: 250e6, kassa: 0.0854, faktor: 2.46, kurs: 68.47 },
  { name: '250-1000', von: 250e6, bis: 1e9, kassa: 0.0647, faktor: 2.07, kurs: 110.34 },
  { name: 'ab1000', von: 1e9, bis: Infinity, kassa: 0.0449, faktor: 1.81, kurs: 170.87 },
];
/* unter 5 Mio $ Median-Umsatz gibt es keine Messung: dort gilt die Spanne der Klasse 5-50 (vorsichtig nach unten offen, gezaehlt) */
KLASSEN.forEach(function (k) { k.eroeffnung = k.kassa * k.faktor; });
function klasseVon(umsatzMedianUsd) {
  for (var i = KLASSEN.length - 1; i >= 0; i--) if (umsatzMedianUsd >= KLASSEN[i].von) return i;
  return 0;
}

/* ---------- IBKR Ireland, US-Aktien (quellen.md: interactivebrokers.ie/en/pricing/commissions-stocks.php, abgerufen 23.10.2026) ---------- */
var IBKR = {
  fixed: { jeStueck: 0.005, min: 1.00, maxAnteil: 0.01 },
  tiered: { jeStueck: 0.0035, min: 0.35, maxAnteil: 0.005,           /* Fussnote: "Tiered commissions will be capped at 0.5% of trade value" */
    boerse: 0.0030,                                                    /* NASDAQ/NYSE Entnahme von Liquiditaet je Stueck (INETstkfee.php) - Markt-Order */
    clearing: 0.00020,                                                 /* NSCC, DTC je Stueck */
    nysePass: 0.000175, finraPass: 0.00056 },                          /* Pass-Through je Provision */
  sec: 0.0000206,                                                      /* SEC Transaction Fee x Verkaufswert */
  taf: 0.0,                                                            /* FINRA TAF: USD 0.00 je verkauftem Stueck (Gebuehrenpause 01.10.-31.12.2026) */
  cat: 0.000003,                                                       /* FINRA CAT je Stueck, beide Seiten */
  fx: { anteil: 0.00002, min: 2.00 },                                  /* Devisen 0,20 Bp x Wert, mindestens 2 USD (commissions-spot-currencies.php) */
};
var EURUSD = 1.1205;                                                   /* EZB-Referenzkurs 22.10.2026 */

/** IBKR-Gebuehr einer Order in USD. modell 'fixed' | 'tiered'; seite 'kauf' | 'verkauf'; stueck = echte Stueckzahl (roher Kurs). */
function ibkrGebuehr(modell, seite, stueck, kursRoh) {
  if (!(stueck > 0)) return 0;
  var wert = stueck * kursRoh, m = IBKR[modell], prov;
  prov = Math.min(Math.max(m.jeStueck * stueck, m.min), m.maxAnteil * wert);
  var extra = IBKR.cat * stueck + (seite === 'verkauf' ? IBKR.sec * wert + IBKR.taf * stueck : 0);
  if (modell === 'tiered') extra += (m.boerse + m.clearing) * stueck + prov * (m.nysePass + m.finraPass);
  return prov + extra;
}

/** Kosten einer Seite als Anteil des Handelswerts: halbe Spanne der Klasse (Lage 'kassa' | 'eroeffnung') + IBKR-Gebuehr / Wert. */
function anteilSeite(klasse, lage, modell, seite, wertUsd, kursRoh) {
  var k = KLASSEN[klasse], spanne = (lage === 'eroeffnung' ? k.eroeffnung : k.kassa) / 100 / 2;
  var geb = modell ? ibkrGebuehr(modell, seite, wertUsd / kursRoh, kursRoh) / wertUsd : 0;
  return { spanne: spanne, gebuehr: geb, summe: spanne + geb };
}

/* ---------- Positionsgroessen: Kapital / 19 Plaetze (Zielzahl des Korbs 187, MH.buchKonfig) ---------- */
var PLAETZE = 19;
var KAPITAL = [
  { name: '100.000 $ (Startsumme der Rueckblicke)', usd: 100000 },
  { name: '50.000 €', usd: 50000 * EURUSD },
  { name: '10.000 €', usd: 10000 * EURUSD },
];

function tabelle() {
  var zeilen = [];
  KAPITAL.forEach(function (kap) {
    var pos = kap.usd / PLAETZE;
    KLASSEN.forEach(function (k, i) {
      ['kassa', 'eroeffnung'].forEach(function (lage) {
        ['fixed', 'tiered'].forEach(function (modell) {
          var a = anteilSeite(i, lage, modell, 'kauf', pos, k.kurs), v = anteilSeite(i, lage, modell, 'verkauf', pos, k.kurs);
          zeilen.push({ kapital: kap.name, positionUsd: pos, klasse: k.name, kurs: k.kurs, lage: lage, modell: modell,
            spannePp: (a.spanne + v.spanne) * 100, gebuehrPp: (a.gebuehr + v.gebuehr) * 100, rundlaufPp: (a.summe + v.summe) * 100,
            gebuehrKaufUsd: ibkrGebuehr(modell, 'kauf', pos / k.kurs, k.kurs), gebuehrVerkaufUsd: ibkrGebuehr(modell, 'verkauf', pos / k.kurs, k.kurs) });
        });
      });
    });
  });
  var fx = KAPITAL.map(function (kap) { var g = Math.max(IBKR.fx.min, IBKR.fx.anteil * kap.usd); return { kapital: kap.name, usd: kap.usd, gebuehrUsd: g, pp: g / kap.usd * 100 }; });
  return { alt: { bpJeSeite: 20, rundlaufPp: 0.40 }, zeilen: zeilen, umtauschEinmalig: fx, eurusd: EURUSD, plaetze: PLAETZE };
}

function de(x, n) { return x.toFixed(n).replace('.', ','); }
function text(t) {
  var Z = ['| Kapital (Position = Kapital / 19) | Klasse (Kurs) | Lage | Spanne | IBKR Fixed | **Summe Fixed** | IBKR Tiered | **Summe Tiered** |', '|---|---|---|---|---|---|---|---|'];
  for (var i = 0; i < t.zeilen.length; i += 2) {
    var f = t.zeilen[i], ti = t.zeilen[i + 1];
    Z.push('| ' + f.kapital + ' (' + de(f.positionUsd, 0) + ' $) | ' + f.klasse + ' (' + de(f.kurs, 2) + ' $) | ' + f.lage + ' | ' + de(f.spannePp, 3) + ' | ' + de(f.gebuehrPp, 3) + ' | **' + de(f.rundlaufPp, 3) +
      '** | ' + de(ti.gebuehrPp, 3) + ' | **' + de(ti.rundlaufPp, 3) + '** |');
  }
  return Z.join('\n');
}

module.exports = { KLASSEN: KLASSEN, klasseVon: klasseVon, IBKR: IBKR, EURUSD: EURUSD, ibkrGebuehr: ibkrGebuehr, anteilSeite: anteilSeite, PLAETZE: PLAETZE, KAPITAL: KAPITAL, tabelle: tabelle, text: text };

if (require.main === module) {
  var t = tabelle();
  fs.writeFileSync(path.join(__dirname, 'kosten.json'), JSON.stringify(t, null, 1));
  console.log(text(t));
  t.umtauschEinmalig.forEach(function (x) { console.log('Umtausch EUR->USD einmalig ' + x.kapital + ': ' + de(x.gebuehrUsd, 2) + ' $ = ' + de(x.pp, 4) + ' Pp'); });
}
