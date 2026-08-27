'use strict';
/* ZAEHLWERKZEUG des Strategie-Tueftlers - Machbarkeits-/Bestandszaehlung, KEINE Messung.
 * Stufe 1: NULL Netzabrufe. Reines Lesen von Platte.
 *
 * Frage: Entsorgt die Quelle die Historie abgemeldeter Firmen schneller, als ihr
 * rollendes 730-Tage-Fenster es erklaert?
 *
 * Der Zeuge ist NICHT eine zweite Quelle, sondern DIESELBE Quelle zu einem
 * zweiten Zeitpunkt:
 *     massive-sicherung-2026-08-27/tagesdaten   Abruf 23.08. ~17:21  (5 Felder)
 *     massive/tagesdaten                        Abruf 27.08. ~13:41  (6 Felder)
 * Beides sind Vollabrufe derselben Schnittstelle. Die Differenz am VORDERRAND
 * ist damit genau das, was die Quelle in vier Tagen weggeworfen hat.
 *
 * Warum das sauber ist: eine zweite Quelle waere ein Konventions-Streit
 * (Anpassung, Boersenzuordnung, Kuerzel-Wechsel). Zwei Abrufe DERSELBEN Quelle
 * haben dieselben Konventionen - uebrig bleibt die Zeit.
 *
 * ⚠ Die Falle, gegen die hier ausdruecklich geprueft wird: der Vollauf laeuft
 * noch und hat nicht alle 1.164 Reihen erneuert. Eine nicht erneuerte Datei ist
 * BYTEGLEICH mit der Sicherung und wuerde als "kein Verfall" durchgehen -
 * das waere ein Nullbefund aus fehlender Messung, nicht aus fehlendem Effekt.
 * Erkennungsmerkmal: erneuert = 6 Felder je Kerze (Eroeffnungskurs), nicht
 * erneuert = 5. Zusaetzlich wird der Abrufstempel verglichen.
 *
 * Was hier NICHT ausgegeben wird: irgendein Kurs- oder Ertragsmittelwert.
 */
var fs = require('fs');
var path = require('path');

var BASIS = process.env.DATEN || 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten';
var ALT = path.join(BASIS, 'massive-sicherung-2026-08-27', 'tagesdaten');
var NEU = path.join(BASIS, 'massive', 'tagesdaten');
var TAG = 86400000;

function tag(ms) { return new Date(ms).toISOString().slice(0, 10); }
function lies(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function med(a) {
  if (!a.length) return NaN;
  var b = a.slice().sort(function (x, y) { return x - y; });
  return b[Math.floor(b.length / 2)];
}

var dateien = fs.readdirSync(ALT).filter(function (f) { return /\.json$/.test(f); });

var z = {
  gesamt: dateien.length,
  fehltNeu: 0,
  nichtErneuert: 0,          // 5 Felder -> Vollauf war noch nicht dran
  erneuert: 0,
  leerAlt: 0, leerNeu: 0,
};
var faelle = [];
var abstaendeVorderkante = [];
var positivGewachsen = 0, hinterkanteGewachsen = 0;

dateien.forEach(function (f) {
  var a = lies(path.join(ALT, f));
  var b = lies(path.join(NEU, f));
  if (!a || !Array.isArray(a.series)) { return; }
  if (!b || !Array.isArray(b.series)) { z.fehltNeu++; return; }
  if (!a.series.length) { z.leerAlt++; return; }
  if (!b.series.length) { z.leerNeu++; return; }

  var felderNeu = b.series[0].length;
  if (felderNeu < 6) { z.nichtErneuert++; return; }   // nicht vergleichbar, siehe Kopf
  z.erneuert++;

  var vorneAlt = a.series[0][0], vorneNeu = b.series[0][0];
  var hintenAlt = a.series[a.series.length - 1][0], hintenNeu = b.series[b.series.length - 1][0];

  /* Vorderkante: wieviele KALENDERTAGE ist der erste verfuegbare Tag nach vorne
   * gewandert? Das rollende Fenster erklaert genau den Abstand der beiden
   * Abrufe (hier 4 Kalendertage). Alles darueber ist Entsorgung. */
  var wanderung = Math.round((vorneNeu - vorneAlt) / TAG);
  abstaendeVorderkante.push(wanderung);
  if (wanderung < 0) positivGewachsen++;
  if (hintenNeu > hintenAlt) hinterkanteGewachsen++;

  faelle.push({
    sym: f.replace(/\.json$/, ''),
    delistet: b.delistet || null,
    kerzenAlt: a.series.length, kerzenNeu: b.series.length,
    vonAlt: tag(vorneAlt), vonNeu: tag(vorneNeu),
    bisAlt: tag(hintenAlt), bisNeu: tag(hintenNeu),
    wanderungTage: wanderung,
    verlustKerzen: a.series.length - b.series.length,
  });
});

/* Abstand der beiden Abrufe in Kalendertagen - aus den Daten, nicht angenommen. */
var stempelAlt = [], stempelNeu = [];
dateien.slice(0, 200).forEach(function (f) {
  var a = lies(path.join(ALT, f)), b = lies(path.join(NEU, f));
  if (a && a.stand) stempelAlt.push(Date.parse(a.stand));
  if (b && b.stand && b.series && b.series[0] && b.series[0].length >= 6) stempelNeu.push(Date.parse(b.stand));
});
var abrufAbstandTage = (stempelAlt.length && stempelNeu.length)
  ? Math.round((med(stempelNeu) - med(stempelAlt)) / TAG * 10) / 10 : null;

/* Einteilung. Die Schwelle ist der gemessene Abrufabstand plus zwei Tage Luft
 * (Wochenende/Feiertag verschiebt den ersten HANDELSTAG im Fenster). */
var schwelle = Math.ceil((abrufAbstandTage || 4)) + 2;
var gruppen = { gewachsen: 0, unveraendert: 0, fensterRollt: 0, entsorgt: 0 };
faelle.forEach(function (x) {
  if (x.wanderungTage < 0) gruppen.gewachsen++;
  else if (x.wanderungTage === 0) gruppen.unveraendert++;
  else if (x.wanderungTage <= schwelle) gruppen.fensterRollt++;
  else gruppen.entsorgt++;
});

var entsorgte = faelle.filter(function (x) { return x.wanderungTage > schwelle; })
  .sort(function (p, q) { return q.wanderungTage - p.wanderungTage; });

var bericht = {
  hinweis: 'Stufe 1: NULL Netzabrufe. Nur Anzahlen und Zeitspannen. Kein Kurs- oder Ertragsmittelwert.',
  frage: 'Entsorgt die Quelle Historie abgemeldeter Firmen schneller, als ihr rollendes Fenster es erklaert?',
  zeuge: 'DIESELBE Quelle zu zwei Zeitpunkten (Sicherung 23.08. gegen Abruf 27.08.) - keine zweite Quelle, keine Konventionsfrage.',
  abrufAbstandTage: abrufAbstandTage,
  schwelleTage: schwelle,
  bestand: z,
  einteilung: gruppen,
  positivkontrolle: {
    hinterkanteGewachsen: hinterkanteGewachsen,
    vorderkanteGewachsen: positivGewachsen,
    erwartung: 'Waere BEIDES null, faende der Vergleich grundsaetzlich keine Veraenderung und der Nullbefund kaeme aus dem Werkzeug, nicht aus der Welt.',
  },
  wanderungVorderkante_Tage: {
    median: med(abstaendeVorderkante),
    min: Math.min.apply(null, abstaendeVorderkante),
    max: Math.max.apply(null, abstaendeVorderkante),
  },
  entsorgte_top30: entsorgte.slice(0, 30),
  entsorgte_gesamt: entsorgte.length,
  verloreneKerzenSumme: entsorgte.reduce(function (s, x) { return s + Math.max(0, x.verlustKerzen); }, 0),
};
console.log(JSON.stringify(bericht, null, 2));
