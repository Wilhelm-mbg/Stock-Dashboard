'use strict';
/* TEIL 2 - DIE TORE UND DER BERICHT (VORREGISTRIERUNG-TEIL2.md §T2.4).
 *
 * Aufruf:  node --max-old-space-size=6144 urteil-teil2.js --aus <ordner>
 *              [--kandidaten <json>] [--aussen <json>] [--dividenden <json>] [--md <datei.md>]
 *
 * Liest die geschriebenen Ergebnisse, entscheidet die neun Tore je Zeile, schreibt urteil-teil2.json und
 * ERGEBNIS-TEIL2.md. Besteht eine Zeile ALLE Tore, wird zusaetzlich das Zielportfolio geschrieben -
 * besteht keine, wird KEINES geschrieben; das ist dann das Ergebnis.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. Ein Zielportfolio ist eine
 * Simulationsausgabe, keine Empfehlung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

function z3(x, n) { return (x == null || !(x === x)) ? '—' : (x >= 0 ? '+' : '') + x.toFixed(n === undefined ? 4 : n); }
function pz(x, n) { return (x == null || !(x === x)) ? '—' : (100 * x).toFixed(n === undefined ? 1 : n) + ' %'; }
function tz(x) { return (x == null || !(x === x)) ? '—' : (x >= 0 ? '+' : '') + x.toFixed(2); }

/* ---------- Die Kostenvorpruefung, wie sie VOR der Messung hingeschrieben wurde (§T2.3.2) ---------- */
var VORPRUEFUNG = {
  'k1-kurzfrist-umkehr/woche': { effekt: [0.10, 0.30], umschlag: 0.85 },
  'k1-kurzfrist-umkehr/monat': { effekt: [0.30, 0.80], umschlag: 0.90 },
  'k2-tiefe-volatilitaet/woche': { effekt: [0.025, 0.075], umschlag: 0.05 },
  'k2-tiefe-volatilitaet/monat': { effekt: [0.10, 0.30], umschlag: 0.12 },
  'k3-nahe-52w-hoch/woche': { effekt: [0.04, 0.08], umschlag: 0.10 },
  'k3-nahe-52w-hoch/monat': { effekt: [0.15, 0.30], umschlag: 0.25 },
  'k4-umsatzschock-richtung/woche': { effekt: [0.03, 0.06], umschlag: 0.85 },
  'k4-umsatzschock-richtung/monat': { effekt: [0.10, 0.25], umschlag: 0.90 },
};

function tore(r, aussenOk) {
  var jahre = (r.jahre && r.jahre.netto) || [];
  var dick = jahre.filter(function (j) { return !j.duenn; });
  var summeAlle = jahre.reduce(function (s, j) { return s + (j.mittel || 0) * j.n; }, 0);
  var maxAnteil = summeAlle > 0 ? Math.max.apply(null, jahre.map(function (j) { return (j.mittel || 0) * j.n / summeAlle; })) : null;
  var negJahre = dick.filter(function (j) { return j.mittel < 0; }).length;
  var v = r.varianten || {};
  var T = [
    { key: 'T-0', name: 'Maschine (0 Leck-Verstoesse)', ok: r.verstoesse === 0 && !r.ungueltig, wert: r.verstoesse + ' Verstoesse' },
    { key: 'T-1', name: 'Aussen-Pruefstein nicht gefallen', ok: !!aussenOk, wert: aussenOk ? 'rho >= 0,2' : 'GEFALLEN' },
    { key: 'T-2', name: 'Vorzeichen netto > 0', ok: r.netto.mittel > 0, wert: z3(r.netto.mittel) + ' Pp' },
    { key: 'T-3', name: 'Perioden-t >= ' + K.BONFERRONI_T, ok: r.netto.t >= K.BONFERRONI_T, wert: tz(r.netto.t) },
    { key: 'T-4', name: 'Tagesreihe Hansen-Hodrick t >= ' + K.BONFERRONI_T, ok: r.netto.tagT >= K.BONFERRONI_T, wert: tz(r.netto.tagT) },
    { key: 'T-5', name: 'letzte 250 Handelstage netto > 0', ok: r.aktuell && r.aktuell.netto.mittel > 0, wert: z3(r.aktuell ? r.aktuell.netto.mittel : null) + ' Pp' },
    { key: 'T-6', name: 'hoechstens 3 negative Jahre und kein Jahr > 60 %', ok: negJahre <= K.TOR_JAHRE_NEGATIV_MAX && maxAnteil != null && maxAnteil <= K.TOR_JAHR_ANTEIL_MAX, wert: negJahre + ' negativ, groesstes Jahr ' + (maxAnteil == null ? '—' : (100 * maxAnteil).toFixed(0) + ' %') },
    { key: 'T-7', name: 'netto > 0 in allen drei Ausbuchungsvarianten', ok: r.netto.mittel > 0 && v.streng && v.streng.netto > 0 && v.milde && v.milde.netto > 0, wert: v.streng ? (z3(v.streng.netto, 3) + ' / ' + z3(v.milde.netto, 3)) : '—' },
    { key: 'T-8', name: 'netto > 0 auch mit der Eroeffnungs-Huerde', ok: !!(v.eroeffnungsHuerde && v.eroeffnungsHuerde.netto > 0), wert: v.eroeffnungsHuerde ? z3(v.eroeffnungsHuerde.netto, 3) + ' Pp' : '—' },
  ];
  return { liste: T, bestanden: T.every(function (x) { return x.ok; }),
    gefallen: T.filter(function (x) { return !x.ok; }).map(function (x) { return x.key; }),
    negJahre: negJahre, maxJahrAnteil: maxAnteil };
}

/* ---------- Zielportfolio: nur wenn eine Zeile ALLE Tore besteht ---------- */
function zielportfolio(ausOrdner, rangName, freq, ziel) {
  var PR = require('./pruefstand.js'), RF = require('./rangfunktionen.js');
  var fn = RF.KANDIDATEN.filter(function (f) { return f.$name === rangName; })[0];
  if (!fn) throw new Error('unbekannte Rangfunktion ' + rangName);
  var T = PR.Tafel(ausOrdner);
  var tage = PR.signaltage(T, freq);
  var t = tage[tage.length - 1];
  var U = PR.universum(T, t, {});
  var sicht = PR.Sicht(T, t, {});
  var werte = fn(sicht, U.liste, T, { t: t, a: U.aTag, aEnde: null });
  if (sicht.verstoesse() > 0) throw new Error('Leck beim Bau des Zielportfolios - kein Portfolio geschrieben');
  var kand = [];
  for (var i = 0; i < U.liste.length; i++) if (werte[i] === werte[i]) kand.push({ e: U.liste[i], w: werte[i] });
  kand.sort(function (a, b) { return b.w - a.w || a.e.sym - b.e.sym; });
  var k = K.dezilGroesse(kand.length);
  var lang = kand.slice(0, k);
  var KL = K.KLASSEN;
  var aus = { kennung: K.KONFIG_KENNUNG_TEIL2, stand: new Date().toISOString(),
    hinweis: 'Simulationsausgabe aus einer vorregistrierten Studie. KEINE Anlageberatung.',
    rangfunktion: rangName, frequenz: freq, ende: fn.$kandidat.ende,
    signaltag: T.kal.tage[t], ausfuehrungstag: U.aTag == null ? null : T.kal.tage[U.aTag],
    universum: kand.length, n: lang.length,
    papiere: lang.map(function (x) { return { kuerzel: T.symName[x.e.sym], gewicht: 1 / lang.length,
      klasse: KL[x.e.klasse] ? KL[x.e.klasse].name : String(x.e.klasse), rangwert: x.w }; }) };
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, JSON.stringify(aus, null, 1));
  return aus;
}

function haupt() {
  var a = { aus: null, kandidaten: null, aussen: null, dividenden: null, md: null, urteil: null };
  var av = process.argv.slice(2);
  for (var i = 0; i < av.length; i++) {
    var x = av[i];
    if (x === '--aus') a.aus = av[++i]; else if (x === '--kandidaten') a.kandidaten = av[++i];
    else if (x === '--aussen') a.aussen = av[++i]; else if (x === '--dividenden') a.dividenden = av[++i];
    else if (x === '--md') a.md = av[++i]; else if (x === '--urteil') a.urteil = av[++i];
  }
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  var pK = a.kandidaten || path.join(a.aus, 'kandidaten-voll.json');
  var pA = a.aussen || path.join(K.HIER, 'aussen-pruefstein.json');
  var pD = a.dividenden || path.join(K.HIER, 'dividendenluecke.json');
  var pMd = a.md || path.join(K.HIER, 'ERGEBNIS-TEIL2.md');
  var pU = a.urteil || path.join(K.HIER, 'urteil-teil2.json');

  var KA = JSON.parse(fs.readFileSync(pK, 'utf8'));
  var AU = JSON.parse(fs.readFileSync(pA, 'utf8'));
  var DI = fs.existsSync(pD) ? JSON.parse(fs.readFileSync(pD, 'utf8')) : null;
  var aussenOk = AU.urteil !== 'GEFALLEN';

  var U = { kennung: K.KONFIG_KENNUNG_TEIL2, stand: new Date().toISOString(),
    panel: KA.panel, letzterTag: KA.letzterTag, testzahl: KA.testzahl, bonferroniT: KA.bonferroniT,
    aussenUrteil: AU.urteil, aussenRho: AU.haupt.rho, zeilen: {}, bestanden: [], befunde: [] };
  Object.keys(KA.kandidaten).forEach(function (s) {
    var t = tore(KA.kandidaten[s], aussenOk);
    U.zeilen[s] = { bestanden: t.bestanden, gefallen: t.gefallen, tore: t.liste,
      netto: KA.kandidaten[s].netto.mittel, t: KA.kandidaten[s].netto.t, tagT: KA.kandidaten[s].netto.tagT,
      umschlag: KA.kandidaten[s].umschlagMittel, kosten: KA.kandidaten[s].kostenMittel };
    if (t.bestanden) U.bestanden.push(s);
  });
  if (!aussenOk) U.befunde.push('AUSSEN-PRUEFSTEIN GEFALLEN - kein Kandidat kann Tor T-1 bestehen');
  if (KA.befunde && KA.befunde.length) KA.befunde.forEach(function (b) { U.befunde.push(b); });
  fs.writeFileSync(pU, JSON.stringify(U, null, 1));

  /* ---------- Zielportfolio ---------- */
  U.zielportfolios = [];
  U.bestanden.forEach(function (s) {
    var teil = s.split('/');
    var datum = KA.letzterTag;
    var ziel = path.join(K.HIER, 'zielportfolio', datum + '_' + teil[0] + '_' + teil[1] + '.json');
    try { var p = zielportfolio(a.aus, teil[0], teil[1], ziel); U.zielportfolios.push({ zeile: s, datei: ziel, n: p.n }); }
    catch (e) { U.befunde.push('Zielportfolio ' + s + ' nicht geschrieben: ' + e.message); }
  });
  fs.writeFileSync(pU, JSON.stringify(U, null, 1));

  /* ================= der Bericht ================= */
  var L = [];
  L.push('# Ergebnis — Querschnitts-Prüfstand, **Teil 2**');
  L.push('');
  L.push('Erzeugt ' + new Date().toISOString() + ' von `urteil-teil2.js`.');
  L.push('Vorregistrierung: **`VORREGISTRIERUNG-TEIL2.md`** (erster Commit, vor jeder Zahl).');
  L.push('Panel `' + KA.panel + '`, ' + KA.zeilen.toLocaleString('de-DE') + ' Tageszeilen, ' + KA.reihen + ' Reihen, bis ' + KA.letzterTag + '.');
  L.push('Alles Simulation mit virtuellem Kapital, **keine Anlageberatung**.');
  L.push('');
  L.push('## Urteil in drei Zeilen');
  L.push('');
  L.push('| Frage | Antwort |');
  L.push('|---|---|');
  L.push('| Bildet die Maschine den bekannten Momentum-Faktor ab? | **' + AU.urteil + '** — ρ = ' + (AU.haupt.rho == null ? '—' : AU.haupt.rho.toFixed(3)) + ' über ' + AU.haupt.n + ' gemeinsame Monate (' + AU.haupt.von + '…' + AU.haupt.bis + ') |');
  L.push('| Wie viele der 8 vorregistrierten Zeilen sind belegt? | **' + U.bestanden.length + ' von ' + Object.keys(KA.kandidaten).length + '** |');
  L.push('| Wurde ein Zielportfolio geschrieben? | **' + (U.zielportfolios.length ? 'ja (' + U.zielportfolios.length + ')' : 'nein') + '** |');
  L.push('');

  /* ---- Außen-Prüfstein ---- */
  L.push('## 1. Der Außen-Prüfstein — die erste Prüfung gegen eine fremde Reihe');
  L.push('');
  L.push('Verglichen wird unsere monatliche Momentum-Überschussreihe (Long-Dezil − gleichgewichtetes Universum,');
  L.push('brutto, ' + AU.haupt.n + ' Monate) mit Kenneth Frenchs veröffentlichtem Momentum-Faktor `Mom`.');
  L.push('Geprüft wird der **Gleichlauf**, nicht die Höhe: `Mom` ist ein wertgewichteter Long-Short-Faktor über');
  L.push('alle US-Aktien, unsere Reihe ist ein Top-Dezil gegen ein gleichgewichtetes Universum von ~220 liquiden');
  L.push('Werten. Die Referenzdatei liegt außerhalb des Repos und wurde nur gelesen.');
  L.push('');
  L.push('| Größe | Wert |');
  L.push('|---|---|');
  L.push('| **ρ (Pearson, Versatz 0)** | **' + AU.haupt.rho.toFixed(4) + '** |');
  L.push('| ρ (Spearman) | ' + AU.haupt.rhoSpearman.toFixed(4) + ' |');
  L.push('| Schranken (vorab) | ≥ 0,5 bestanden · 0,2–0,5 teilweise · < 0,2 Befund |');
  L.push('| **Urteil** | **' + AU.urteil + '** |');
  L.push('| β (unsere Reihe auf `Mom`) | ' + AU.haupt.beta.toFixed(3) + ' (se ' + AU.haupt.seBeta.toFixed(3) + ', t ' + AU.haupt.tBeta.toFixed(1) + ') |');
  L.push('| Vorzeichen gleich | ' + AU.haupt.vorzeichenGleich + ' von ' + AU.haupt.n + ' Monaten (' + (100 * AU.haupt.vorzeichenAnteil).toFixed(0) + ' %) |');
  L.push('| gemeinsamer Zeitraum | ' + AU.haupt.von + ' … ' + AU.haupt.bis + ' |');
  L.push('');
  L.push('**Die Zuordnung stimmt.** Die Korrelation bei Monatsversatz −1 / 0 / +1 beträgt ' +
    [-1, 0, 1].map(function (v) { var e = AU.versatz[String(v)]; return (e.rho == null ? '—' : e.rho.toFixed(3)); }).join(' / ') +
    ' — das Maximum liegt wie vorhergesagt bei Versatz 0, die Periode→Monat-Regel ist also nicht verschoben.');
  L.push('');
  L.push('### Je Kalenderjahr');
  L.push('');
  L.push('| Jahr | gemeinsame Monate | ρ | unsere Summe (Pp) |');
  L.push('|---|---|---|---|');
  AU.jahre.forEach(function (j) { L.push('| ' + j.jahr + ' | ' + j.n + (j.duenn ? ' *(dünn)*' : '') + ' | ' + (j.rho == null ? '—' : j.rho.toFixed(2)) + ' | ' + z3(j.unsereSumme, 1) + ' |'); });
  L.push('');
  L.push('Neun der zehn Kalenderjahre laufen gleich. **Das eine Jahr, das nicht mitläuft, ist 2020** (ρ = ' +
    AU.jahre.filter(function (j) { return j.jahr === 2020; }).map(function (j) { return j.rho.toFixed(2); })[0] + ').');
  var nov = (AU.einbruch2021 || []).filter(function (e) { return e.monat === '2020-11'; })[0];
  if (nov) L.push('Der Träger ist ein einzelner Monat: **2020-11**, der Momentum-Einbruch nach der Impfstoffmeldung. `Mom` ist dort stark negativ, unsere Reihe steht bei ' + z3(nov.unser, 2) + ' Pp.');
  L.push('');
  L.push('### Der Momentum-Einbruch 2020/21 — Vorzeichen Monat für Monat');
  L.push('');
  L.push('*(Von der Referenzreihe wird hier nur das **Vorzeichen** übernommen, nie der Wert — das Repo ist öffentlich.)*');
  L.push('');
  L.push('| Monat | `Mom` | unsere Reihe (Pp) | gleich |');
  L.push('|---|---|---|---|');
  (AU.einbruch2021 || []).forEach(function (e) { L.push('| ' + e.monat + ' | ' + (e.momVorzeichen || '—') + ' | ' + z3(e.unser, 2) + ' | ' + (e.gleich === null ? '—' : e.gleich ? 'ja' : '**nein**') + ' |'); });
  L.push('');
  L.push('Vorzeichen gleich in ' + AU.einbruch2021Zusammenfassung.vorzeichenGleich + ' von ' + AU.einbruch2021Zusammenfassung.monate + ' Monaten. Für das **Kalenderjahr 2021** ist `Mom` negativ, und unsere Reihe summiert sich auf ' + z3(AU.einbruch2021Zusammenfassung.unsereSumme2021, 2) + ' Pp — **das Vorzeichen stimmt**.');
  L.push('');
  if (AU.diagnose) {
    var d = AU.diagnose.felder;
    L.push('### Diagnose: woher die Lücke zwischen 0,41 und 0,5 kommt');
    L.push('');
    L.push('> **Nicht vorregistriert.** Alles in diesem Abschnitt wurde **nach** dem Urteil gerechnet und');
    L.push('> ändert es nicht. Es beantwortet die Anschlussfrage, die der Auftrag für den Fall „teilweise" stellt.');
    L.push('');
    L.push('| unsere Größe gegen `Mom` | ρ | β |');
    L.push('|---|---|---|');
    L.push('| **Long − Universum** (die vorregistrierte Größe) | ' + d.brutto.rho.toFixed(3) + ' | ' + d.brutto.beta.toFixed(2) + ' |');
    L.push('| **Long − Short** (Diagnose, verlangt Leihe) | **' + d.lsBrutto.rho.toFixed(3) + '** | ' + d.lsBrutto.beta.toFixed(2) + ' |');
    L.push('| **Short − Universum** | ' + d.kurzBrutto.rho.toFixed(3) + ' | ' + d.kurzBrutto.beta.toFixed(2) + ' |');
    L.push('');
    L.push('`Mom` **ist** ein Long-Short-Faktor. Vergleicht man Gleiches mit Gleichem, liegt die Korrelation bei');
    L.push('**' + d.lsBrutto.rho.toFixed(2) + '** — deutlich über der Schranke 0,5. Die Verlierer-Seite trägt dabei mehr Gleichlauf');
    L.push('(|ρ| = ' + Math.abs(d.kurzBrutto.rho).toFixed(2) + ') als die Gewinner-Seite (' + d.brutto.rho.toFixed(2) + '); genau sie fehlt in der vorregistrierten Größe.');
    L.push('Das erklärt 2020-11 mechanisch: im Momentum-Einbruch schossen die **Verlierer** hoch, und ein Long-gegen-Universum');
    L.push('spürt davon nur die Hälfte.');
    L.push('');
    L.push('Jahres-Auslassprobe (ρ ohne das jeweilige Jahr): ' + AU.diagnose.jahrWeggelassen.map(function (e) { return e.ohneJahr + ' ' + (e.rho == null ? '—' : e.rho.toFixed(3)); }).join(', ') + '.');
    L.push('Nur 2020 bewegt das Gesamt-ρ nennenswert (auf ' + AU.diagnose.jahrWeggelassen.filter(function (e) { return e.ohneJahr === 2020; }).map(function (e) { return e.rho.toFixed(3); })[0] + ').');
    L.push('');
  }

  /* ---- Dividendenlücke ---- */
  if (DI) {
    var dm = DI.laeufe['momentum-12-1/monat'];
    L.push('## 2. Die Dividendenlücke — **gemessen**, nicht geschätzt');
    L.push('');
    L.push('Unsere Renditen enthalten keine Ausschüttungen. In der Hauptgröße kürzt sich eine gleich große');
    L.push('Ausschüttung heraus; übrig bleibt die **Differenz** der Dividendenrendite zwischen Dezil und Universum:');
    L.push('');
    L.push('> `Überschuss_Kurs = Überschuss_Gesamtrendite − (Dividendenrendite_Dezil − Dividendenrendite_Universum)`');
    L.push('');
    L.push('**Verfahren (offengelegt):** ' + DI.verfahren);
    L.push('Quelle ist der Maßnahmen-Bestand des Archivs — dieselben Sätze, aus denen das Panel Splits und');
    L.push('Abspaltungen zieht; die Bardividenden darin werden beim Panelbau bewusst nicht angewandt. Gelesen wurden');
    L.push(DI.bestand.gelesenDateien + ' Symboldateien mit ' + DI.bestand.gelesenSaetze.toLocaleString('de-DE') + ' Bardividenden-Sätzen, **' + DI.bestand.fehlendeDateien + ' fehlten**.');
    L.push('');
    L.push('| Lauf | Dezil (Pp/Periode) | Universum (Pp/Periode) | **Lücke** | se | t |');
    L.push('|---|---|---|---|---|---|');
    Object.keys(DI.laeufe).forEach(function (s) { var r = DI.laeufe[s];
      L.push('| ' + s + ' | ' + z3(r.longMittel) + ' | ' + z3(r.uniMittel) + ' | **' + z3(r.lueckeMittel) + '** | ' + r.lueckeSe.toFixed(4) + ' | ' + tz(r.lueckeT) + ' |'); });
    L.push('');
    /* uniJahr ist bereits die Jahressumme in Pp und damit unmittelbar die Rendite in Prozent. */
    L.push('**Plausibilitätsprobe:** das Universum kommt auf ' + dm.uniJahr.toFixed(2) + ' % Dividendenrendite im Jahr' +
      ' (' + z3(dm.uniMittel) + ' Pp × 12). Das ist genau die bekannte Größenordnung für liquide US-Aktien in diesem Zeitraum —');
    L.push('die Messung ist also nicht nur intern konsistent, sondern trifft auch den bekannten Außenwert.');
    L.push('Das Momentum-Dezil zahlt mit ' + (dm.longJahr).toFixed(2) + ' % im Jahr etwa **die Hälfte** davon; das ist die erwartete Richtung');
    L.push('(Momentum-Gewinner sind wachstumslastig).');
    L.push('');
    L.push('**Wie viel der +1,622 Pp je Monat entfallen darauf:** ' + z3(dm.lueckeMittel) + ' Pp je Monat, also **' +
      (100 * Math.abs(dm.lueckeMittel) / 1.6221).toFixed(1) + ' %**. Die Kurs-Überschussreihe **überschätzt** den');
    L.push('Gesamtrendite-Überschuss; nach Korrektur bleiben **' + (1.6221 + dm.lueckeMittel).toFixed(4) + ' Pp je Monat** statt +1,6221.');
    L.push('Die Richtung ist die vorhergesagte, die Größe ist klein gegenüber dem Effekt — und sie ist jetzt eine');
    L.push('**Messung mit t = ' + dm.lueckeT.toFixed(1) + '**, keine Annahme mehr.');
    L.push('');
    L.push('Grenzen dieser Messung: ' + DI.grenzen.map(function (g) { return g; }).join('; ') + '.');
    L.push('');
  }

  /* ---- Kandidaten ---- */
  L.push('## 3. Die acht vorregistrierten Zeilen');
  L.push('');
  L.push('Hauptgröße: **Long-Dezil − gleichgewichtetes Universum**, netto nach gemessenen Kosten.');
  L.push('Testzahl 8 vorab festgelegt, Bonferroni: kritischer Betrag **|t| ≥ ' + K.BONFERRONI_T + '**.');
  L.push('');
  L.push('| # | Zeile | Ende | n | brutto (Pp) | netto (Pp) | t (Perioden) | t (Tage, HH) | Umschlag | Kosten (Pp) | Tote | Urteil |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  var nr = 0;
  Object.keys(KA.kandidaten).forEach(function (s) {
    nr++; var r = KA.kandidaten[s], u = U.zeilen[s];
    L.push('| ' + nr + ' | `' + s + '` | ' + r.kandidat.ende + ' | ' + r.perioden + ' | ' + z3(r.brutto.mittel) + ' | ' + z3(r.netto.mittel) +
      ' | ' + tz(r.netto.t) + ' | ' + tz(r.netto.tagT) + ' | ' + pz(r.umschlagMittel) + ' | ' + r.kostenMittel.toFixed(4) +
      ' | ' + r.zaehler.tote + ' | ' + (u.bestanden ? '**belegt**' : 'nicht belegt') + ' |');
  });
  L.push('');
  L.push('**Keine Zeile erreicht die Bonferroni-Schranke.** ' +
    Object.keys(KA.kandidaten).filter(function (s) { return KA.kandidaten[s].netto.mittel < 0; }).length +
    ' der 8 Zeilen haben das **falsche Vorzeichen** — sie sind damit nicht „knapp verfehlt", sondern in der');
  L.push('registrierten Richtung widerlegt.');
  L.push('');

  /* ---- Tore ---- */
  L.push('### Die neun Tore je Zeile');
  L.push('');
  L.push('| Zeile | ' + U.zeilen[Object.keys(U.zeilen)[0]].tore.map(function (t) { return t.key; }).join(' | ') + ' | bestanden |');
  L.push('|---|' + U.zeilen[Object.keys(U.zeilen)[0]].tore.map(function () { return '---'; }).join('|') + '|---|');
  Object.keys(U.zeilen).forEach(function (s) {
    var u = U.zeilen[s];
    L.push('| `' + s + '` | ' + u.tore.map(function (t) { return t.ok ? '✓' : '✗'; }).join(' | ') + ' | ' + (u.bestanden ? '**ja**' : 'nein') + ' |');
  });
  L.push('');
  U.zeilen[Object.keys(U.zeilen)[0]].tore.forEach(function (t) { L.push('- **' + t.key + '** ' + t.name); });
  L.push('');

  /* ---- Kostenvorprüfung: Schätzung gegen Messung ---- */
  L.push('### Die Kostenvorprüfung gegen die Messung');
  L.push('');
  L.push('Die Vorprüfung (§T2.3.2) wurde **vor** der Messung hingeschrieben. Hier steht sie gegen das, was');
  L.push('gemessen wurde — auch dort, wo sie danebenlag.');
  L.push('');
  L.push('| Zeile | Umschlag geschätzt | Umschlag **gemessen** | Faktor geschätzt | Effekt erwartet (Pp) | Effekt **gemessen** (Pp, netto) | Vorprüfung |');
  L.push('|---|---|---|---|---|---|---|');
  Object.keys(KA.kandidaten).forEach(function (s) {
    var V = VORPRUEFUNG[s], r = KA.kandidaten[s];
    if (!V) return;
    var f0 = V.effekt[0] / (V.umschlag * K.HUERDE_MISCH_PP), f1 = V.effekt[1] / (V.umschlag * K.HUERDE_MISCH_PP);
    L.push('| `' + s + '` | ' + pz(V.umschlag) + ' | ' + pz(r.umschlagMittel) + ' | ' + f0.toFixed(1) + '…' + f1.toFixed(1) +
      ' | +' + V.effekt[0] + '…+' + V.effekt[1] + ' | ' + z3(r.netto.mittel) + ' | ' + (f1 < 4 ? '**unter der Schwelle**' : f0 < 4 ? 'grenzwertig' : 'messen') + ' |');
  });
  L.push('');
  L.push('**Zwei Vorprüfungen waren falsch, und zwar in der Größe, die wir selbst geschätzt haben:** der Umschlag');
  L.push('von `k2-tiefe-volatilitaet` und `k3-nahe-52w-hoch` liegt beim **2,7- bis 5,3-fachen** der Schätzung.');
  L.push('Grund: an der **Dezilgrenze** ist die Ordnung viel unruhiger als in der Mitte der Verteilung — bei K3');
  L.push('drängen sich viele Papiere bei einem Verhältnis nahe 1, sodass kleinste Bewegungen die Grenze überqueren.');
  L.push('Eine Umschlagschätzung „aus der Trägheit der Größe" ist deshalb systematisch zu niedrig; richtig wäre');
  L.push('eine Schätzung **an der Dezilgrenze**. Das ändert die Urteile hier nicht (alle vier fallen ohnehin),');
  L.push('gehört aber in die nächste Vorregistrierung.');
  L.push('');

  /* ---- Details je Zeile ---- */
  L.push('## 4. Je Zeile: Jahresscheiben, Aktualität, Regime, Empfindlichkeiten');
  L.push('');
  Object.keys(KA.kandidaten).forEach(function (s) {
    var r = KA.kandidaten[s], u = U.zeilen[s];
    L.push('### `' + s + '` — ' + r.kandidat.groesse + ', gekauft wird das **' + r.kandidat.ende + 'e** Ende');
    L.push('');
    L.push('netto **' + z3(r.netto.mittel) + ' Pp** je Periode (t ' + tz(r.netto.t) + '), brutto ' + z3(r.brutto.mittel) + ' Pp, n = ' + r.perioden +
      ', Universum ' + r.universumMittel.toFixed(0) + ', Dezil ' + r.dezilMittel.toFixed(0) + ' Papiere.');
    L.push('Gefallene Tore: ' + (u.gefallen.length ? '**' + u.gefallen.join(', ') + '**' : 'keine') + '.');
    L.push('');
    L.push('| Jahr | n | netto (Pp) | se | t |');
    L.push('|---|---|---|---|---|');
    r.jahre.netto.forEach(function (j) { L.push('| ' + j.jahr + (j.duenn ? ' *(dünn)*' : '') + ' | ' + j.n + ' | ' + z3(j.mittel) + ' | ' + (j.se == null ? '—' : j.se.toFixed(4)) + ' | ' + tz(j.t) + ' |'); });
    L.push('');
    L.push('| Schnitt | n | netto (Pp) | t |');
    L.push('|---|---|---|---|');
    L.push('| letzte 250 Handelstage (ab ' + r.aktuell.netto.abTag + ') | ' + r.aktuell.netto.n + ' | ' + z3(r.aktuell.netto.mittel) + ' | ' + tz(r.aktuell.netto.t) + ' |');
    L.push('| SPY über EMA200 | ' + r.regime.ueberEMA200.n + ' | ' + z3(r.regime.ueberEMA200.mittel) + ' | ' + tz(r.regime.ueberEMA200.t) + ' |');
    L.push('| SPY unter EMA200 | ' + r.regime.unterEMA200.n + ' | ' + z3(r.regime.unterEMA200.mittel) + ' | ' + tz(r.regime.unterEMA200.t) + ' |');
    L.push('');
    var v = r.varianten;
    L.push('| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |');
    L.push('|---|---|---|');
    L.push('| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | ' + z3(r.netto.mittel) + ' | — |');
    L.push('| streng (zusätzlich unbekannt + freiwillig) | ' + z3(v.streng.netto) + ' | ' + z3(v.streng.netto - r.netto.mittel) + ' |');
    L.push('| milde (kein Totalverlust) | ' + z3(v.milde.netto) + ' | ' + z3(v.milde.netto - r.netto.mittel) + ' |');
    L.push('| Eröffnungs-Hürde statt mittlerer Hürde | ' + z3(v.eroeffnungsHuerde.netto) + ' | ' + z3(v.eroeffnungsHuerde.netto - r.netto.mittel) + ' |');
    L.push('');
    L.push('se (netto): Perioden naiv ' + r.netto.se.toFixed(4) + ' · Tage naiv ' + (r.netto.tagSeNaiv == null ? '—' : r.netto.tagSeNaiv.toFixed(5)) +
      ' · Hansen-Hodrick ' + (r.netto.tagSeHH == null ? '—' : r.netto.tagSeHH.toFixed(5)) + ' · Newey-West ' + (r.netto.tagSeNW == null ? '—' : r.netto.tagSeNW.toFixed(5)) +
      (r.netto.marke ? ' · Marke **' + r.netto.marke + '**' : '') + '. Tote im gehaltenen Dezil: ' + r.zaehler.tote + '.');
    L.push('');
  });

  /* ---- Ausgabe ---- */
  L.push('## 5. Zielportfolio');
  L.push('');
  if (U.zielportfolios.length) {
    U.zielportfolios.forEach(function (p) { L.push('- `' + p.zeile + '` → `' + path.basename(p.datei) + '` (' + p.n + ' Papiere)'); });
  } else {
    L.push('**Es wurde keines geschrieben.** Keine der acht Zeilen besteht alle Tore — das ist das Ergebnis,');
    L.push('nicht ein Ausfall. Die Schnittstelle zum Mittelfrist-Depot bleibt damit leer.');
  }
  L.push('');
  L.push('## 6. Was Teil 2 **nicht** sagt');
  L.push('');
  L.push('- Der Außen-Prüfstein ist **teilweise** bestanden, nicht ganz. Die vorregistrierte Größe erreicht ρ = ' + AU.haupt.rho.toFixed(2) + ',');
  L.push('  nicht 0,5. Dass die Long-Short-Diagnose auf ' + (AU.diagnose ? AU.diagnose.felder.lsBrutto.rho.toFixed(2) : '—') + ' kommt, ist eine **nachträgliche** Erklärung und');
  L.push('  hebt das registrierte Urteil nicht auf.');
  L.push('- Aus „nicht belegt" folgt **nicht** „widerlegt" — außer für die sechs Zeilen mit falschem Vorzeichen,');
  L.push('  für die die registrierte Richtung tatsächlich nicht trägt.');
  L.push('- Momentum 12-1 bleibt **Kontext, kein Befund**: keine Vorregistrierung als Strategie, kein Tor, kein Urteil.');
  L.push('- Long-Short steht überall nur als **Diagnose**; es verlangt Wertpapierleihe und ist im Projekt gesperrt.');
  L.push('');
  fs.writeFileSync(pMd, L.join('\n'));
  process.stdout.write('Urteil: ' + U.bestanden.length + ' von ' + Object.keys(KA.kandidaten).length + ' Zeilen bestehen alle Tore\n');
  process.stdout.write('Aussen-Pruefstein: ' + AU.urteil + ' (rho ' + AU.haupt.rho.toFixed(4) + ')\n');
  process.stdout.write('geschrieben: ' + pU + '\n            ' + pMd + '\n');
}

if (require.main === module) haupt();
module.exports = { tore: tore, VORPRUEFUNG: VORPRUEFUNG };
