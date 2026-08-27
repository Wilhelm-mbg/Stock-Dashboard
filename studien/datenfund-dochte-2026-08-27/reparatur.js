'use strict';
/* ⚠⚠ STAND 27.08. ~02:00: NICHT SCHARF FAHREN. Die Reparatur ist vom PM VOLL
 * angehalten — offen ist nicht die Form, sondern die PRAEMISSE (Populationsfrage:
 * die P-WEG-Kerzen sind mutmasslich echte Nachhandels-Kerzen; Mechanik am
 * Quell-Abruf belegt, 233/234 AH-Kerzen mit Volumen 0 und echter Spanne).
 *
 * ZWEI OFFENE MESSPUNKTE — die Zahlen unten sind STICHPROBEN-ZWISCHENSTAENDE,
 * nicht geklaerte Lage; nicht als Beleg zitieren:
 * 1. 1d-Tagesbalken-Probe (jede 5. Reihe): ~76 % der "reparierbaren" Dochte
 *    innerhalb des Tagesbalkens, ~8,8 % echte Phantome. ABER: die Aufschluesselung
 *    HALBTAG vs. NORMALTAG steht aus — der Ursprungsfall (AAPL 03.07.2025,
 *    Halbtag, Tief 201,25 gegen Tagestief 211,81) ist ersichtlich KEIN echtes
 *    Extrem. "76 % ueber alle Tage" und "5 % an den sieben Halbtagen" waeren
 *    voellig verschiedene Lagen.
 * 2. Populationszaehlung 60m (population-60m.js) laeuft erst nach Sperrfall.
 * 3. QS-Strukturbefund (40/40, halbtagsschluss.js): an Halbtagen liefert die
 *    Quelle die LETZTE HALBE SITZUNGSSTUNDE samt Schlussauktion LEER. Die
 *    "Tagesspanne aus Umsatz-Kerzen", gegen die P-WEG prueft, entsteht dort
 *    also aus 3 statt 3,5 Stunden - sie ist systematisch ZU ENG, und die
 *    P-WEG-Treffermenge damit systematisch ZU GROSS. Eigenschaft der Daten,
 *    kein Code-Fehler - aber jede kuenftige Trefferdefinition muss sie kennen.
 *
 * ENDSTAND DER NACHT (QS, drei Tests mit Normaltag-Kontrolle, ~03:1x):
 * Die Halbtage sind NICHT verdorben. Tiefe isolierte Dochte sind eine
 * Eigenschaft von Nachhandelsdaten ueberhaupt (Normaltag-Kontrolle: gleiche
 * Gestalt, 50 % vs. 62,5 % Bestaetigung); ein Kriterium, das echten AH-Handel
 * von einem Artefakt trennt, gibt es aus den Kerzen allein nicht. Die Halbtage
 * sind nur die Tage, an denen AH-Daten ueberhaupt ins Archiv gelangten. WIE,
 * ist BEOBACHTET, nicht erklaert (QS-Messung, 4 Tagestypen): Normaltage
 * verwerfen den GESAMTEN Nachhandel korrekt; Halbtage behalten GENAU EINE
 * AH-Kerze (die erste) und verwerfen die drei folgenden; die leere
 * Sitzungs-Restkerze (16:30/17:30) wird verworfen. Die frueher genannte
 * Ursache "Filter greift eine Stunde zu weit" ist WIDERLEGT - sie saehe
 * Normaltage genauso lecken. Die Regel IST identifiziert und gemessen (30/30
 * Halbtags- und 6/6 Normaltags-Schnappschuesse): DIE QUELLE liefert im
 * Nicht-prePost-Strom an Halbtagen genau eine Kerze nach Sitzungsende mit, an
 * Normaltagen keine - das Archiv kopiert den Quellstrom 1:1; einen Filter, der
 * historische AH-Kerzen verwerfen koennte, gibt es im Sammelpfad nicht
 * (fertigeKerze prueft nur das unfertige Ende). Kleiner
 * eigener Quell-Lieferfehler daneben: identische Hoch/Tief-Paare in
 * aufeinanderfolgenden AH-Stunden (selten, tagestyp-unabhaengig).
 * DIE REPARATURFRAGE IST DAMIT ENDGUELTIG KEINE WERTE-FRAGE, SONDERN DIE
 * POPULATIONSFRAGE: gehoeren Nachhandelsdaten ins 60m-Archiv? Entscheid liegt
 * bei Wilhelm; dieses Werkzeug bleibt unscharf, bis er gefallen ist. ⚠⚠ */
/* ================= Datenfund 1: Phantom-Dochte ENTFERNEN =================
 *
 * SCHREIBT ins 60m-Archiv - einziges schreibendes Werkzeug dieses Vorhabens.
 * Die Loeschmenge ist WOERTLICH die P-WEG-Definition der QS-Abnahme
 * (qs-audit-2026-08-26/werkzeuge/phantom-abnahme.js, erheben()):
 *   umsatz === 0
 *   UND zeit !== 2026-08-25T20:00Z          (S1: offizieller Schlusskurs, bleibt)
 *   UND der Tag hat >= 2 Umsatz-Kerzen      (sonst keine Vergleichsspanne: bleibt)
 *   UND (hoch > Tageshoch ODER tief < Tagestief der Umsatz-Kerzen)
 * Alles andere (S2 Nullumsatz mit Spanne ~66.619, S3 flach in der Reihe ~410,
 * S4 Umsatz > 0) bleibt unangetastet.
 *
 * VIER SICHERUNGEN, alle hart:
 *   1. Verweigert bei aktiver Archiv-Sperre (_laeuft.json, wie die Abnahme).
 *   2. Verweigert ohne Basiszaehlung (phantom-basis.json) - Reihenfolge ist
 *      Nachladen -> --basis -> DIESES SKRIPT -> --pruefen.
 *   3. A6-VORPRUEFUNG: die eigene Trefferzahl muss EXAKT der Basiszaehlung
 *      entsprechen, BEVOR die erste Datei geschrieben wird. Weicht sie ab, hat
 *      sich das Archiv seit der Basis geaendert - Abbruch, nichts geschrieben.
 *   4. Jede zu aendernde Datei wird vorher unveraendert in den Backup-Ordner
 *      kopiert - die Loeschung ist vollstaendig umkehrbar.
 *
 * ZWEI REPARATURFORMEN (QS-Befund 27.08. ~03:0x: die Phantom-Kerze traegt ein
 * kaputtes Tief, aber oft einen BRAUCHBAREN Schluss - bei AAPL 2025-07-03 liegt
 * er NAEHER am 1d-Tagesschluss als die letzte regulaere Kerze; Loeschen wuerfe
 * das Richtige mit dem Falschen weg, dieselbe Struktur wie #96):
 *   --form=loeschen   P-WEG-Kerzen entfernen (urspruengliches Raster; nach dem
 *                     1d-Befund vom 27.08. ~03:3x praktisch vom Tisch - 21,7 %
 *                     der Treffer tragen EXAKT den offiziellen Tagesschluss, an
 *                     Halbtagen IST die 17/18-Uhr-Kerze die Schlussauktion)
 *   --form=flach      1d-Vorschlag: hoch := max(eroeffnung, schluss),
 *                     tief := min(eroeffnung, schluss) - eine Nullumsatz-Kerze
 *                     hat keine gehandelte Spanne; Docht verschwindet VOLLSTAENDIG,
 *                     Schlusskurs bleibt, OHLC-Invariante haelt. MUSS formgleich
 *                     mit der Einlese-Regel in kerzenquelle.js sein (1d baut dort).
 *   --form=kappen     MINIMALER Eingriff (QS-Abstimmung 27.08. ~03:2x):
 *                       hoch := min(hoch, Tageshoch)
 *                       tief := max(tief, Tagestief)
 *                     der Umsatz-Kerzen; nie aufweiten; zeit/schluss/umsatz/
 *                     eroeffnung UNVERAENDERT (A3 Fassung 3, inkl. OHLC-
 *                     Invariante). Die engere Zusatzschranke max/min(eroeffnung,
 *                     schluss) hat die QS selbst zurueckgezogen - sie waere eine
 *                     ungemessene Vermutung; sie steht als OFFENE FRAGE bei ihr
 *                     ("darf eine Nullumsatz-Kerze ueberhaupt eine Spanne haben"),
 *                     nicht als Anforderung hier.
 *
 * EIGENER FUND statt stiller Reparatur (QS-Auflage): P-WEG-Kerzen, deren
 * Eroeffnung oder Schluss SELBST ausserhalb der Tagesspanne liegen, werden in
 * KEINER Form angefasst - dort ist mehr kaputt als Hoch/Tief, und eine Kappung
 * wuerde es zudecken. Sie werden gezaehlt, mit Kennungen in eine Funddatei
 * geschrieben und gemeldet; die Abnahme muss diese Restmenge kennen.
 * Welche Form laeuft, entscheidet die QS-Messung ab ~03:45 (wie oft traegt der
 * Phantom-Schluss?). Der Probelauf zaehlt formunabhaengig und weist zusaetzlich
 * aus, wie oft eroeffnung/schluss der P-WEG-Kerzen AUSSERHALB der Tagesspanne
 * liegen - dort waere eine gekappte Kerze in sich inkonsistent (hoch < eroeffnung),
 * das muss die Abnahme vorher wissen.
 *
 * Aufruf: node reparatur.js [--form=kappen|--form=loeschen] [--wirklich|--rueckspielprobe]
 * Ohne --wirklich: Probelauf, zaehlt und schreibt NICHTS. --wirklich verlangt --form.
 * --rueckspielprobe (PM-Auflage a, VOR --wirklich): fuehrt den kompletten
 * Sicherungs-Weg an EINER echten Archivdatei vor - Archiv -> Backup ->
 * Wiederherstellungs-Ziel - und prueft Byte-Gleichheit per Hash. Das Archiv
 * selbst wird dabei nur GELESEN. Umkehrbarkeit ist die Bedingung der
 * Loeschfreigabe, nicht ein Extra. */
var fs = require('fs'), path = require('path');
/* PRUEFSTAND-MODUS (QS-Angebot): mit QS_ARCHIV zeigt alles auf das Miniatur-
 * Archiv des QS-Pruefstands - dann ist auch die Naht zwischen diesem Skript und
 * der Abnahme geprueft, nicht nur jede Seite fuer sich. Die Naht-Klinke gegen
 * kerzenquelle.js wird NUR in diesem Modus ausgesetzt (das Miniatur-Archiv hat
 * keine Einlese-Regel); fuer das echte Archiv gilt sie immer. */
var PRUEFSTAND = process.env.QS_ARCHIV || null;
var D = PRUEFSTAND || 'E:/Markt-Dashboard-Archiv/archiv60m';
var BASIS = process.env.QS_BASIS || 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/qs-audit-2026-08-26/werkzeuge/phantom-basis.json';
var BACKUP = PRUEFSTAND ? path.join(PRUEFSTAND, '..', 'backup-pruefstand') : 'E:/Markt-Dashboard-Archiv/backup-phantom-2026-08-27';
var PLATZ = Date.parse('2026-08-25T20:00:00.000Z');
var HALBTAGE = ['2023-11-24', '2024-07-03', '2024-11-29', '2024-12-24', '2025-07-03', '2025-11-28', '2025-12-24'];
var VERWAIST_STUNDEN = 6;
var wirklich = process.argv.indexOf('--wirklich') !== -1;
var form = null;
process.argv.forEach(function (a) { var m = /^--form=(kappen|loeschen|flach)$/.exec(a); if (m) form = m[1]; });
if (wirklich && !form) { console.error('ABBRUCH: --wirklich verlangt --form=kappen, --form=flach oder --form=loeschen (Formentscheid des PM nach QS-Messung abwarten). Nichts geaendert.'); process.exit(2); }

function sperreAktiv(ordner) {
  var p = path.join(ordner, '_laeuft.json');
  if (!fs.existsSync(p)) return null;
  var j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
  var start = Date.parse(j.start);
  if (!isFinite(start)) return null;
  if ((Date.now() - start) / 3600000 >= VERWAIST_STUNDEN) return null;
  if (j.pid) { try { process.kill(j.pid, 0); } catch (e) { return null; } }
  return j;
}
function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && e.name !== path.basename(BACKUP)) out = out.concat(dateien(p));
    else if (/^bars_60m_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}

var crypto = require('crypto');
function md5(p) { return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex'); }

/* --rueckspielprobe: der Sicherungs-Weg, an einer echten Datei vorgefuehrt. */
if (process.argv.indexOf('--rueckspielprobe') !== -1) {
  var probeDatei = dateien(D)[0];
  if (!probeDatei) { console.error('Keine Archivdatei gefunden.'); process.exit(2); }
  var probeBackup = path.join(BACKUP, '_rueckspielprobe', path.basename(probeDatei));
  var probeZiel = path.join(BACKUP, '_rueckspielprobe', 'wiederhergestellt_' + path.basename(probeDatei));
  fs.mkdirSync(path.dirname(probeBackup), { recursive: true });
  fs.copyFileSync(probeDatei, probeBackup);      // Archiv -> Backup (wie die Reparatur es tut)
  fs.copyFileSync(probeBackup, probeZiel);       // Backup -> Wiederherstellung (der Rueckweg)
  var h1 = md5(probeDatei), h2 = md5(probeBackup), h3 = md5(probeZiel);
  console.log('Rueckspielprobe an: ' + path.basename(probeDatei));
  console.log('  Original          md5 ' + h1);
  console.log('  Backup            md5 ' + h2);
  console.log('  Wiederhergestellt md5 ' + h3);
  console.log(h1 === h2 && h2 === h3
    ? 'BESTANDEN: der Weg Archiv -> Backup -> Wiederherstellung ist bytegleich. Loeschung ist umkehrbar.'
    : 'DURCHGEFALLEN: Hashes weichen ab - NICHT loeschen, erst den Kopierweg klaeren.');
  process.exit(h1 === h2 && h2 === h3 ? 0 : 1);
}

var sp = sperreAktiv(D);
if (sp) { console.error('ABBRUCH: archiv60m wird gerade geschrieben (PID ' + sp.pid + ', "' + sp.was + '"). Nichts geaendert.'); process.exit(2); }
if (!fs.existsSync(BASIS)) { console.error('ABBRUCH: keine Basiszaehlung (' + BASIS + '). Reihenfolge: Nachladen -> phantom-abnahme.js --basis -> reparatur.js. Nichts geaendert.'); process.exit(2); }
/* NAHT-KLINKE (PM-Auflage 27.08. ~03:4x, verbindlich): Archiv-Reparatur und
 * Einlese-Regel MUESSEN dieselbe Form tragen - sonst behandelt der naechste
 * Nachlade-Lauf dieselben Kerzen anders als das reparierte Archiv, und im
 * Archiv steht zweierlei ohne Merkmal zum Auseinanderhalten (der Zwei-Quellen-
 * Schaden in neu). Konvention mit markt-dashboard-1d: kerzenquelle.js traegt
 * eine Zeile  PHANTOM_FORM = 'flach'|'kappen'  - gelesen, nie geschrieben. */
if (wirklich && PRUEFSTAND) {
  console.log('Pruefstand-Modus (QS_ARCHIV): Naht-Klinke ausgesetzt - gilt NIE fuer das echte Archiv.');
}
if (wirklich && !PRUEFSTAND) {
  var kq = '';
  try { kq = fs.readFileSync(path.join(__dirname, '..', '..', 'kerzenquelle.js'), 'utf8'); } catch (e) { kq = ''; }
  var mF = /PHANTOM_FORM\s*=\s*'(\w+)'/.exec(kq);
  if (!mF) { console.error('ABBRUCH (Naht-Klinke): kerzenquelle.js traegt keine PHANTOM_FORM-Marke - die Einlese-Regel ist noch nicht (erkennbar) auf eine Form festgelegt. Nichts geaendert.'); process.exit(2); }
  if (mF[1] !== form) { console.error('ABBRUCH (Naht-Klinke): Einlese-Regel in kerzenquelle.js ist auf "' + mF[1] + '" festgelegt, dieser Lauf verlangt "' + form + '". Formgleichheit ist Pflicht. Nichts geaendert.'); process.exit(2); }
  console.log('Naht-Klinke: kerzenquelle.js traegt PHANTOM_FORM=' + mF[1] + ' - formgleich, weiter.');
}
/* Datierte Basis-Kopie (PM, Frage 3): worauf abgenommen wurde, bleibt beweisbar. */
var basisKopie = path.join(__dirname, 'phantom-basis-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json');
fs.copyFileSync(BASIS, basisKopie);
console.log('Basis-Kopie: ' + path.basename(basisKopie) + ' (md5 ' + md5(BASIS) + ')');
var basis = JSON.parse(fs.readFileSync(BASIS, 'utf8'));
var basisWeg = basis && basis.wegP ? Object.keys(basis.wegP).length : (basis && basis.wegPAnzahl != null ? basis.wegPAnzahl : null);
if (basisWeg == null) { console.error('ABBRUCH: Basiszaehlung ohne wegP-Zahl - Format unbekannt, nichts geaendert.'); process.exit(2); }

/* Durchgang 1: NUR ZAEHLEN (immer). Erst wenn die Zahl exakt der Basis
 * entspricht, folgt Durchgang 2 (schreiben, nur mit --wirklich). */
var plan = [];      // {datei, treffer:[{i, hi, lo}]}
var proHalbtag = {}, proTagSonst = {}, reihenMitTreffer = 0, treffer = 0, ocAusserhalb = 0, ocBeispiele = [], ocKennungen = [];
dateien(D).forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s)) return;
  var tage = {};
  s.forEach(function (k, i) {
    var d = new Date(k[0]).toISOString().slice(0, 10);
    (tage[d] = tage[d] || []).push(i);
  });
  var raus = [];
  Object.keys(tage).forEach(function (d) {
    var idx = tage[d], mitU = idx.filter(function (i) { return s[i][2] > 0; });
    if (mitU.length < 2) return;
    var hi = Math.max.apply(null, mitU.map(function (i) { return s[i][3]; }));
    var lo = Math.min.apply(null, mitU.map(function (i) { return s[i][4]; }));
    idx.forEach(function (i) {
      var x = s[i];
      if (x[2] > 0) return;
      if (x[0] === PLATZ) return;
      if (x[3] > hi || x[4] < lo) {
        /* KLASSE R, zwei Gruende (QS-Pruefstand-Fund 27.08.): (a) Eroeffnung/
         * Schluss selbst ausserhalb der Tagesspanne; (b) die OHLC-Invariante ist
         * SCHON VOR der Reparatur verletzt (tief > min(o,c) oder max(o,c) > hoch)
         * - sonst lastet die Abnahme einen Altschaden dem Reparateur an. Beide
         * werden in keiner Form angefasst - nur gezaehlt und ausgewiesen. */
        var o9 = x[5] != null ? x[5] : x[1];
        var vorherSchief = !(x[4] <= Math.min(o9, x[1]) && Math.max(o9, x[1]) <= x[3]);
        var oc = o9 > hi || o9 < lo || x[1] > hi || x[1] < lo || vorherSchief;
        raus.push({ i: i, hi: hi, lo: lo, oc: oc });
        if (HALBTAGE.indexOf(d) >= 0) proHalbtag[d] = (proHalbtag[d] || 0) + 1;
        else proTagSonst[d] = (proTagSonst[d] || 0) + 1;
        if (oc) {
          ocAusserhalb++;
          ocKennungen.push({ datei: path.basename(f), tag: d, zeit: x[0], o: o9, c: x[1], spanne: [lo, hi] });
          if (ocBeispiele.length < 6) ocBeispiele.push(path.basename(f) + ' ' + d + ' o=' + o9 + ' c=' + x[1] + ' Spanne ' + lo + '-' + hi);
        }
      }
    });
  });
  if (raus.length) { plan.push({ datei: f, treffer: raus }); reihenMitTreffer++; treffer += raus.length; }
});

console.log('Loeschplan: ' + treffer + ' Kerzen in ' + reihenMitTreffer + ' Reihen.');
console.log('Basiszaehlung (wegP): ' + basisWeg);
console.log('An den sieben Halbtagen: ' + JSON.stringify(proHalbtag));
var sonst = Object.keys(proTagSonst).length;
console.log('An ' + sonst + ' weiteren Tagen: ' + Object.keys(proTagSonst).sort().slice(0, 10).map(function (d) { return d + '=' + proTagSonst[d]; }).join(' ') + (sonst > 10 ? ' ...' : ''));
console.log('Kappen-Konsistenz: Eroeffnung/Schluss AUSSERHALB der Spanne bei ' + ocAusserhalb + ' von ' + treffer + ' Treffern.');
ocBeispiele.forEach(function (b) { console.log('   ' + b); });
if (treffer !== basisWeg) {
  console.error('ABBRUCH (A6-Vorpruefung): Planzahl ' + treffer + ' != Basis ' + basisWeg + ' - das Archiv hat sich seit der Basiszaehlung geaendert. NICHTS geschrieben. Basis neu erheben.');
  process.exit(2);
}
if (!wirklich) { console.log('Probelauf (ohne --wirklich): nichts geschrieben. Planzahl == Basis, bereit fuer beide Formen.'); process.exit(0); }

fs.mkdirSync(BACKUP, { recursive: true });
var geschrieben = 0, entfernt = 0, gekappt = 0, ausgelassen = 0;
plan.forEach(function (p) {
  var behandelbar = p.treffer.filter(function (t) { return !t.oc; });
  ausgelassen += p.treffer.length - behandelbar.length;
  if (!behandelbar.length) return;                      // nur eigene Funde: Datei unangetastet
  var ziel = path.join(BACKUP, path.relative(D, p.datei));
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.copyFileSync(p.datei, ziel);                       // Sicherung VOR der Aenderung
  var j = JSON.parse(fs.readFileSync(p.datei, 'utf8'));
  if (form === 'loeschen') {
    var set = {}; behandelbar.forEach(function (t) { set[t.i] = 1; });
    var vorher = j.series.length;
    j.series = j.series.filter(function (k, i) { return !set[i]; });
    entfernt += vorher - j.series.length;
  } else if (form === 'flach') {
    behandelbar.forEach(function (t) {
      var k = j.series[t.i];
      var o = k[5] != null ? k[5] : k[1];
      /* Keine gehandelte Spanne ohne Umsatz: Docht vollstaendig weg, o/c bleiben. */
      k[3] = Math.max(o, k[1]);
      k[4] = Math.min(o, k[1]);
      gekappt++;
    });
  } else {
    behandelbar.forEach(function (t) {
      var k = j.series[t.i];
      /* Minimaler Eingriff: nur die nachweislich falschen Werte, nur nach innen. */
      k[3] = Math.min(k[3], t.hi);
      k[4] = Math.max(k[4], t.lo);
      gekappt++;
    });
  }
  fs.writeFileSync(p.datei, JSON.stringify(j));
  geschrieben++;
});
console.log('GESCHRIEBEN (' + form + '): ' + geschrieben + ' Dateien, ' +
  (form === 'loeschen' ? entfernt + ' Kerzen entfernt' : gekappt + ' Kerzen gekappt') +
  ' von ' + treffer + ' P-WEG; ' + ausgelassen + ' als EIGENER FUND unangetastet (o/c ausserhalb).');
/* Klasse R IMMER ausweisen, auch bei null (A3 Fassung 3: ein fehlender Ausweis
 * laesst die Abnahme durchfallen - sonst ist "leer" von "niemand hat nachgesehen"
 * nicht zu unterscheiden). */
var fundDatei = path.join(__dirname, 'klasse-r-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json');
fs.writeFileSync(fundDatei, JSON.stringify({ klasseR: ocKennungen.length, kennungen: ocKennungen }, null, 1));
console.log('Klasse-R-Ausweis (o/c ausserhalb, NICHT repariert): ' + ocKennungen.length + ' -> ' + fundDatei);
console.log('Backup unter: ' + BACKUP);
console.log('Jetzt: node phantom-abnahme.js --pruefen  (Abnahme muss zur Form passen - A3 neu bei kappen, Restmenge o/c kennen)');
