'use strict';
/* WELCHE REIHEN STEHEN STILL - und warum. Die Kernlogik der Abmeldeliste.
 *
 * WARUM SIE HIER WOHNT UND NICHT MEHR IN tools/. Bis zum 27.08.2026 war das ganze
 * Werkzeug eine Datei unter tools/. Als die Pflege in die App wandern sollte, fiel
 * auf: tools/ wird nicht ausgeliefert (package.json build.files kennt nur *.js aus
 * der Wurzel). In der installierten App gibt es die Datei schlicht nicht - der
 * Aufruf waere ins Leere gelaufen, und zwar STILL: keine Meldung, keine Pflege,
 * eine Liste die nie waechst. Dieselbe Bauform wie das fehlende wertpapierart.js
 * im Paket, nur andersherum entdeckt.
 *
 * GETEILTER CODE, KEIN NACHBAU. Das Muster ist kerzenquelle.js: die Regel wohnt in
 * der Wurzel, das Werkzeug in tools/ ist eine duenne Huelle darum. Zwei Fassungen
 * derselben Regel waeren zwei Wahrheiten - und genau das hat dieses Projekt schon
 * einmal Tage gekostet.
 *
 * DER ARCHIVPFAD KOMMT AUS DER GEMEINSAMEN REGEL, nicht aus einer Konstanten. Das
 * Werkzeug hatte 'E:/Markt-Dashboard-Archiv/archiv1d' fest verdrahtet; auf einem
 * fremden Rechner (Felix hat kein E:) waere das ins Nichts gezeigt. Q.ordnerVon
 * beantwortet dieselbe Frage fuer alle - mit Zeigerdatei, sonst neben dem
 * 60m-Ordner.
 *
 * WAS SIE BEANTWORTET: Eine Reihe steht still, wenn ihre letzte Kerze MIT UMSATZ
 * mehrere Handelstage zurueckliegt. Nachlaufende Stempelkerzen (eingefrorener
 * Schluss, Umsatz 0) zaehlen NICHT als Handel - sonst gilt eine Reihe als frisch,
 * die seit Wochen nicht gehandelt wurde. Ob dahinter eine Abmeldung steckt oder
 * ein haengendes Archiv, entscheidet erst der frische Quellabruf.
 *
 * LEERER DATENORDNER IST KEIN BEFUND. Findet sich kein Archiv, meldet dieses Modul
 * ausdruecklich 'kein-archiv' und NICHT "0 Abmeldungen": "nichts gefunden" und
 * "nichts zu durchsuchen" sind von aussen ununterscheidbar, und die Verwechslung
 * macht aus "wir wissen nichts" ein "alles in Ordnung". */
var fs = require('fs');
var path = require('path');
var KQ = require('./kerzenquelle.js');

var RUECKSTAND_AB = 2;          // Zeugen-Handelstage, ab denen eine Reihe auffaellig ist
var QUELLE_HOECHSTENS = 40;     // mehr Auffaellige deuten auf ein Archivproblem, nicht auf Abmeldungen
var ZEUGEN = ['SPY', 'QQQ', 'AAPL'];

/* Die vier Befunde. Sie sind die Schnittstelle zum Waechter, der sie gruppiert -
 * ein fuenfter Wert braucht die Absprache (test-v6 haelt die Zahl fest). */
var BEFUNDE = ['abgemeldet-bestaetigt', 'abruffehler', 'quelle-leer', 'historie-zurueckgesetzt'];

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/** Handelsende, Stempel-Schwanz und Umfang einer Reihe. */
function befundVon(series) {
  var stempel = 0, ende = null;
  for (var i = series.length - 1; i >= 0; i--) {
    if ((series[i][2] || 0) > 0) { ende = series[i][0]; break; }
    stempel++;
  }
  return { handelsende: ende, stempelSchwanz: stempel,
           letzteKerze: series.length ? series[series.length - 1][0] : null,
           kerzen: series.length, ersteMs: series.length ? series[0][0] : null };
}

function dateien(ordner) {
  var out = [];
  var eintraege;
  try { eintraege = fs.readdirSync(ordner, { withFileTypes: true }); } catch (e) { return out; }
  eintraege.forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (/^bars_1d_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}

/** Alle Tagesreihen lesen. Gibt { reihen, ordner } oder { leer: true, grund }. */
function reihenLesen(ordner) {
  ordner = ordner || KQ.ordnerVon('1d');
  if (!fs.existsSync(ordner)) {
    return { leer: true, ordner: ordner, grund: 'Der Ordner ' + ordner + ' gibt es nicht.' };
  }
  var alle = dateien(ordner);
  if (!alle.length) {
    return { leer: true, ordner: ordner, grund: 'Im Tagesarchiv liegt keine einzige Reihe (' + ordner + ').' };
  }
  var reihen = {};
  alle.forEach(function (f) {
    var j;
    try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
    if (!Array.isArray(j.series) || !j.series.length) return;
    var sym = path.basename(f).replace(/^bars_1d_/, '').replace(/\.json$/, '');
    reihen[sym] = befundVon(j.series);
    reihen[sym].istEtf = f.indexOf(path.sep + 'etf' + path.sep) !== -1 || f.indexOf('/etf/') !== -1;
  });
  if (!Object.keys(reihen).length) {
    return { leer: true, ordner: ordner, grund: 'Es liegen Dateien, aber keine lesbare Reihe darin.' };
  }
  return { reihen: reihen, ordner: ordner, dateien: alle.length };
}

/** Der Kalender kommt vom liquidesten Zeugen: seine Handelstage SIND der Kalender,
 *  ohne Feiertagswissen, das veralten koennte. */
function zeugenKalender(ordner) {
  ordner = ordner || KQ.ordnerVon('1d');
  var gefunden = null;
  ZEUGEN.some(function (z) {
    var kand = [path.join(ordner, 'etf', 'bars_1d_' + z + '.json'), path.join(ordner, 'bars_1d_' + z + '.json')];
    return kand.some(function (k) { if (fs.existsSync(k)) { gefunden = { datei: k, sym: z }; return true; } return false; });
  });
  if (!gefunden) return { leer: true, grund: 'Kein Kalender-Zeuge (' + ZEUGEN.join('/') + ') im Archiv.' };
  var tage;
  try {
    tage = JSON.parse(fs.readFileSync(gefunden.datei, 'utf8')).series
      .filter(function (k) { return (k[2] || 0) > 0; })
      .map(function (k) { return tagVon(k[0]); });
  } catch (e) { return { leer: true, grund: 'Der Kalender-Zeuge ist unlesbar: ' + (e && e.message) }; }
  if (!tage.length) return { leer: true, grund: 'Der Kalender-Zeuge hat keine Kerze mit Umsatz.' };
  return { tage: tage, juengster: tage[tage.length - 1], zeuge: path.basename(gefunden.datei) };
}

/** Welche Reihen stehen still? Rein rechnend, ohne Netz. */
function auffaellige(reihen, kalenderTage) {
  var aus = [];
  Object.keys(reihen).forEach(function (sym) {
    var r = reihen[sym];
    if (r.handelsende == null) return;
    var tag = tagVon(r.handelsende);
    var n = 0;
    for (var i = kalenderTage.length - 1; i >= 0 && kalenderTage[i] > tag; i--) n++;
    if (n >= RUECKSTAND_AB) {
      aus.push({ sym: sym, handelsende: tag, rueckstand: n, stempelSchwanz: r.stempelSchwanz, istEtf: !!r.istEtf });
    }
  });
  aus.sort(function (a, b) { return a.handelsende < b.handelsende ? -1 : 1; });
  return aus;
}

/** Der Stummel-Test: fuehrt die Quelle nur noch einen Bruchteil der Historie, deren
 *  Anfang weit NACH unserem liegt, ist unser Archiv die einzige Kopie - dann ist
 *  nicht nachladen die Antwort, sondern schuetzen. Die Grenzen sind bewusst grob:
 *  gemeint ist der klare Fall (AVB: 30 Kerzen gegen 8.166), nicht die Grauzone. */
function istStummel(quelleKerzen, quelleErsteMs, unsereKerzen, unsereErsteMs) {
  return quelleKerzen > 0 && quelleKerzen < 100 && (unsereKerzen || 0) >= 1000 &&
    unsereErsteMs != null && quelleErsteMs > unsereErsteMs + 365 * 86400000;
}

/** Aus einer Quellantwort den Befund einer auffaelligen Reihe bestimmen. */
function befundAusQuelle(eintrag, reihe, quelle) {
  if (!quelle || !quelle.ok) return { befund: 'quelle-leer', detail: (quelle && quelle.grund) || 'Quelle nicht lesbar' };
  var frischer = null;
  (quelle.kerzen || []).forEach(function (k) {
    if ((k.umsatz || 0) > 0 && tagVon(k.zeit) > eintrag.handelsende) frischer = tagVon(k.zeit);
  });
  var n = (quelle.kerzen || []).length;
  var ersteMs = n ? quelle.kerzen[0].zeit : null;
  if (istStummel(n, ersteMs, reihe && reihe.kerzen, reihe && reihe.ersteMs)) {
    return { befund: 'historie-zurueckgesetzt', quelleKerzen: n, quelleErsteTag: ersteMs ? tagVon(ersteMs) : null,
      detail: 'Quelle fuehrt nur noch ' + n + (n === 1 ? ' Kerze' : ' Kerzen') +
        (ersteMs ? ' ab ' + tagVon(ersteMs) : '') + ', das Archiv haelt ' + (reihe ? reihe.kerzen : '?') +
        ' - NICHT nachladen, das Archiv ist die einzige Kopie' + (frischer ? '; Quelle zeigt Handel bis ' + frischer : '') };
  }
  if (frischer) {
    return { befund: 'abruffehler', quelleKerzen: n, quelleErsteTag: ersteMs ? tagVon(ersteMs) : null,
      detail: 'Quelle handelt bis ' + frischer + ' - das Archiv haengt, nachladen!' };
  }
  return { befund: 'abgemeldet-bestaetigt', quelleKerzen: n, quelleErsteTag: ersteMs ? tagVon(ersteMs) : null,
    detail: 'Quelle liefert nach dem Handelsende keinen Umsatz mehr' };
}

/** Die gepflegte Liste gegen die vorige halten. */
function veraenderung(neuListe, vorherListe) {
  var vorher = {};
  (vorherListe || []).forEach(function (e) { vorher[e.sym] = e; });
  var neu = [], gedreht = [], wieder = [];
  neuListe.forEach(function (a) {
    if (!vorher[a.sym]) neu.push(a.sym);
    else if (vorher[a.sym].befund !== a.befund) gedreht.push(a.sym + ' (' + vorher[a.sym].befund + ' -> ' + a.befund + ')');
  });
  Object.keys(vorher).forEach(function (sym) {
    var nochDa = neuListe.some(function (a) { return a.sym === sym; });
    if (!nochDa && vorher[sym].befund === 'abgemeldet-bestaetigt') wieder.push(sym);
  });
  return { neu: neu, gedreht: gedreht, wieder: wieder };
}

function ablagePfad() {
  return path.join(KQ.datenOrdnerSetzen(), 'massive', 'abmeldungen.json');
}
function ablageLesen() {
  try { return JSON.parse(fs.readFileSync(ablagePfad(), 'utf8')); } catch (e) { return null; }
}
function ablageSchreiben(inhalt) {
  var ziel = ablagePfad();
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, JSON.stringify(inhalt, null, 1));
  return ziel;
}

module.exports = {
  RUECKSTAND_AB: RUECKSTAND_AB, QUELLE_HOECHSTENS: QUELLE_HOECHSTENS, BEFUNDE: BEFUNDE,
  befundVon: befundVon, reihenLesen: reihenLesen, zeugenKalender: zeugenKalender,
  auffaellige: auffaellige, istStummel: istStummel, befundAusQuelle: befundAusQuelle,
  veraenderung: veraenderung, tagVon: tagVon,
  ablagePfad: ablagePfad, ablageLesen: ablageLesen, ablageSchreiben: ablageSchreiben,
};
