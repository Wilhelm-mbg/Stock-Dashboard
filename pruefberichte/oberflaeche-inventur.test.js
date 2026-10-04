'use strict';
/* Pruefbericht "Oberflaechen-Inventur" (Oktober 2026): ein Kleinsttest je Fundstelle.
 *
 * Grundlage sind die Fundlisten pruefberichte/oberflaeche-inventur/*.json (je Dateigruppe eine, geschrieben bei der
 * Inventur auf dem Zweig pruefung/oberflaeche-inventur). Je Fundstelle steht dort die Quelldatei, der Wortlaut (eine
 * exakte Teilzeichenkette), die Klasse a-d und - wo es eine gibt - die Belegstelle (Datei + exakte Teilzeichenkette).
 *
 * Der Test schreibt KEINE Zahl ab. Er sucht den Wortlaut in der Quelldatei, liest die Zahlen dort heraus und haelt
 * sie gegen die Zahlen, die er an der genannten Belegstelle (bzw. im ganzen Belegkorpus) liest:
 *   a  (stimmt ueberein)  jede Zahl der Fundstelle steht in der Zeile der Belegstelle      -> "kein Unterschied"
 *   b  (als ueberholt gekennzeichnet) in der Naehe steht ein Ueberholt-Vermerk            -> "kein Unterschied"
 *   c  (veraltet)  die Zahlen der Fundstelle fehlen in der Zeile des heutigen Belegs       -> "ZEIGT ABWEICHUNG"
 *   d  (ohne Beleg) die Zahlen der Fundstelle fehlen im ganzen Belegkorpus                 -> "ZEIGT ABWEICHUNG"
 * Faellt eine Pruefung anders aus als die Klasse erwartet (a ohne Treffer, d doch im Korpus, Wortlaut nicht mehr in der
 * Datei), meldet die Zeile das ausdruecklich - dann ist die Einordnung oder der Text weitergezogen.
 * Belegkorpus: wiki/belegstand.md, wiki/kosten.md (von belegstand.md als Quelle der Huerden genannt) und alle
 * studien/**\/ERGEBNIS*.md.
 *
 * Jede Fundstelle druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...". Am Ende eine Summe.
 * Reines Node, kein Netz. Nicht in `npm test` eingehaengt.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/oberflaeche-inventur.test.js            alle Fundstellen
 *   node pruefberichte/oberflaeche-inventur.test.js c          nur Klasse c (a|b|c|d)
 *   node pruefberichte/oberflaeche-inventur.test.js g2         nur Gruppen, deren Name so beginnt
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..');
var LISTEN = path.join(__dirname, 'oberflaeche-inventur');

/* ---------------- Hilfen ---------------- */

var cache = {};
function lies(rel) {
  if (!(rel in cache)) {
    var p = path.join(WURZEL, rel);
    cache[rel] = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  }
  return cache[rel];
}

/** Alle studien/**\/ERGEBNIS*.md, relativ zur Wurzel. */
function ergebnisDateien() {
  var aus = [];
  (function lauf(dir) {
    fs.readdirSync(path.join(WURZEL, dir), { withFileTypes: true }).forEach(function (e) {
      var rel = dir + '/' + e.name;
      if (e.isDirectory()) { if (e.name !== 'node_modules') lauf(rel); }
      else if (/^ERGEBNIS.*\.md$/.test(e.name)) aus.push(rel);
    });
  })('studien');
  return aus;
}

/** Text vereinheitlichen: Minuszeichen, Entities, Escapes, geschuetzte Leerzeichen. */
function glatt(s) {
  return s
    .replace(/\\u2212|&minus;|&#8722;|−|–|‒/g, '-')
    .replace(/\\u00a0|\\u202f|\\u2009|&nbsp;|&thinsp;|&#8239;|&#160;|[    ]/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** Zahlen einer Textstelle: ohne Vorzeichen, als Zeichenkette ("10,44", "20.356"). Namen mit Ziffern fallen weg. */
function zahlen(s) {
  var t = glatt(s)
    .replace(/S&(amp;)?P\s*500/g, ' ')
    .replace(/\b(EMA|SMA|RSI|Nr\.?|v|V|K|H|W|E|B|t)\s?=?\s?(?=\d)/g, function (m, w) {
      return (w === 't' || w === 'H') ? m : ' #';               // t- und H-Werte bleiben Zahlen
    })
    .replace(/#\d+(?:[.,]\d+)*/g, ' ')
    .replace(/\b\d{1,2}\.\d{1,2}\.(\d{4})?(?!\d)/g, ' ');          // Datumsangaben sind keine Messwerte
  var m = t.match(/\d+(?:[.,]\d+)*/g) || [];
  return m.filter(function (z) { return z.length > 1 || /[.,]/.test(z); })   // einzelne Ziffern sind zu unscharf
    .map(function (z) { return z.replace(/[.,]$/, ''); });
}

/** Die ganze Zeile einer Datei, in der die Teilzeichenkette steht (oder null). */
function zeileMit(text, teil) {
  var i = text.indexOf(teil);
  if (i === -1) return null;
  var a = text.lastIndexOf('\n', i) + 1, e = text.indexOf('\n', i + teil.length);
  return { zeile: text.slice(0, i).split('\n').length, text: text.slice(a, e === -1 ? text.length : e), stelle: i };
}

/** Steht die Zahl als ganzes Token im Text? (5,4 darf nicht in 15,48 gefunden werden) */
function tokenIn(text, z) {
  return muster(z).test(glatt(text));
}
/** Muster fuer eine Zahl; ein einzelnes Trennzeichen mit 1-2 Nachkommastellen gilt als Dezimalpunkt oder -komma
 *  (JS-Quelltext schreibt 0.10, der Belegstand 0,10). */
function muster(z, einheit) {
  var k = z.replace(/[.]/g, '\\.');
  if (/^\d+[.,]\d{1,2}$/.test(z) || /^\d+[.,]\d{4,}$/.test(z)) k = z.replace(/[.,]/, '[.,]');
  return new RegExp('(^|[^\\d.,])' + k + '(?![\\d]|[.,]\\d)' + (einheit ? '\\s?' + einheit.replace(/[.]/g, '\\.').replace(/ /g, '\\s?') : ''));
}
/** Zahlen mit ihrer Einheit (fuer die Suche im Korpus: "96 %" statt "96"). */
function zahlenMitEinheit(s) {
  return zahlen(s).map(function (z) {
    var m = glatt(s).match(new RegExp(z.replace(/[.]/g, '\\.') + '\\s?(%|Pp|Prozentpunkte|Basispunkte|p\\. ?a\\.|Jahre|Werte|Signale)'));
    return [z, m ? m[1].replace('Prozentpunkte', 'Pp') : ''];
  });
}

var UEBERHOLT = /[ÜüUu]berholt|veraltet|zur[üu]ckgewiesen|zur[üu]ckgenommen|nicht mehr g[üu]ltig|alte[rn]? (Messung|Beleg|Zahl)|vor der (Zeitzonen-)?Korrektur|vor dieser Kontrolle|belegeKopf|line-through|<s>|<del>|text-decoration/i;

/* ---------------- Pruefung je Fundstelle ---------------- */

function pruefe(e, korpus) {
  var quelle = lies(e.datei);
  if (quelle == null) return [true, 'Quelldatei ' + e.datei + ' fehlt'];
  var fund = zeileMit(quelle, e.wortlaut);
  if (!fund) return [true, 'Wortlaut steht nicht mehr in ' + e.datei + ' (Text geaendert?) - "' + kurz(e.wortlaut) + '"'];
  var wo = e.datei + ':' + fund.zeile;
  var zOben = e.nurUrteil ? [] : zahlen(quelle.substr(fund.stelle, e.wortlaut.length));    // aus der Quelldatei gelesen
  // nurUrteil: die Ziffern der Fundstelle sind Schwellen/Parameter des Codes (0.5, 60m, H=26), kein Messwert - geprueft wird das Urteil
  var beleg = null;
  if (e.beleg && e.beleg.datei) {
    var bt = lies(e.beleg.datei);
    if (bt == null) return [true, wo + ': Belegdatei ' + e.beleg.datei + ' fehlt'];
    beleg = zeileMit(bt, e.beleg.marke);
    if (!beleg) return [true, wo + ': Belegstelle steht nicht mehr in ' + e.beleg.datei + ' - "' + kurz(e.beleg.marke) + '"'];
    beleg.ort = e.beleg.datei + ':' + beleg.zeile;
    beleg.umfeld = belegUmfeld(bt, beleg.zeile);
  }
  var zBeleg = beleg ? zahlen(beleg.text) : [];

  if (e.klasse === 'a') {
    if (!beleg) return [true, wo + ' (a): keine Belegstelle angegeben'];
    var fehlt = zOben.filter(function (z) { return !zahlDa(beleg.umfeld, z); });
    if (fehlt.length) return [true, wo + ' (a, laut Liste "stimmt"): ' + fehlt.join(', ') + ' steht nicht in ' + beleg.ort + ' (dort: ' + (zBeleg.join(', ') || '-') + ')'];
    return [false, wo + ' (a): ' + (zOben.length ? zOben.join(', ') + ' = ' + beleg.ort : 'Urteil ohne Zahl, Belegstelle ' + beleg.ort + ' vorhanden')];
  }

  if (e.klasse === 'b') {
    var a = Math.max(0, fund.stelle - 1500), umfeld = quelle.slice(a, fund.stelle + e.wortlaut.length + 300);
    var m = umfeld.match(UEBERHOLT) || kopfImFeld(quelle, fund.stelle);
    if (!m) return [true, wo + ' (b, laut Liste "als ueberholt gekennzeichnet"): kein Ueberholt-Vermerk im Umfeld gefunden - ' + (zOben.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' steht ungekennzeichnet'];
    return [false, wo + ' (b): ' + (zOben.join(', ') || 'Urteil') + ' steht unter dem Vermerk "' + m[0] + '"' + (beleg ? ', Beleg ' + beleg.ort : '')];
  }

  if (e.klasse === 'c') {
    if (!beleg) return [true, wo + ' (c): Oberflaeche ' + (zOben.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' - heutiger Stand: ' + (e.belegsagt || '?')];
    var anders = zOben.filter(function (z) { return !zahlDa(beleg.umfeld, z); });
    if (zOben.length && !anders.length) {
      if (/~~|[ÜüUu]berholt|Annahme/.test(beleg.text)) return [true, wo + ' (c): ' + zOben.join(', ') + ' steht in ' + beleg.ort + ' nur noch als ueberholt bzw. Annahme' + (e.belegsagt ? ' (' + e.belegsagt + ')' : '')];
      return [true, wo + ' (c): Zahlen ' + zOben.join(', ') + ' stimmen mit ' + beleg.ort + ', das Urteil im Wortlaut nicht - "' + kurz(e.wortlaut) + '"' + (e.belegsagt ? ' | Belegstand: ' + e.belegsagt : '')];
    }
    return [true, wo + ' (c): Oberflaeche ' + (anders.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' | Belegstand ' + beleg.ort + ': ' + (zBeleg.join(', ') || kurz(beleg.text)) +
      (e.belegsagt ? ' (' + e.belegsagt + ')' : '')];
  }

  if (e.klasse === 'd') {
    if (!zOben.length) return [true, wo + ' (d): Urteil ohne Beleg - "' + kurz(e.wortlaut) + '"'];
    // Beleg heisst: alle Zahlen der Fundstelle (mit ihrer Einheit, wo eine steht) liegen im Korpus dicht beisammen
    // (hoechstens 300 Zeichen). Eine einzelne "1,5" oder "2015" steht irgendwo immer.
    var ze = zahlenMitEinheit(quelle.substr(fund.stelle, e.wortlaut.length)), gemeinsam = null;
    // dazu mindestens ein Inhaltswort der Fundstelle (ab 7 Buchstaben) im selben Fenster - sonst ist es eine fremde Zahl
    var woerter = (glatt(e.wortlaut).match(/[A-Za-zÄÖÜäöüß]{7,}/g) || []).filter(function (w) { return !/^(gemessen|Prozent|Prozentpunkte|zwischen|gegenüber|Handelstage|Strategie)$/i.test(w); });
    korpus.some(function (k) {
      var g = glatt(k[1]), m0, re0 = new RegExp(muster(ze[0][0], ze[0][1]).source, 'g');
      while ((m0 = re0.exec(g))) {
        var fenster = g.slice(Math.max(0, m0.index - 300), m0.index + 300);
        if (ze.every(function (x) { return muster(x[0], x[1]).test(fenster); }) &&
            (!woerter.length || woerter.some(function (w) { return fenster.indexOf(w) !== -1; }))) {
          gemeinsam = k[0] + ':' + g.slice(0, m0.index).split('\n').length; return true;
        }
      }
      return false;
    });
    var zt = ze.map(function (x) { return x[0] + (x[1] ? ' ' + x[1] : ''); });
    // eine einzelne unscharfe Zahl (weniger als drei tragende Ziffern: "96 %", "1,0") findet sich immer irgendwo
    if (gemeinsam && ze.length === 1 && ze[0][0].replace(/[.,]/g, '').replace(/^0+/, '').length < 3) gemeinsam = null;
    if (gemeinsam) return [false, wo + ' (d, laut Liste "ohne Beleg"): ' + zt.join(', ') + ' stehen mit einem Stichwort der Fundstelle beisammen in ' + gemeinsam + ' - Einordnung pruefen'];
    var ohne = ze.filter(function (x) { return !korpus.some(function (k) { return muster(x[0], x[1]).test(glatt(k[1])); }); })
      .map(function (x) { return x[0] + (x[1] ? ' ' + x[1] : ''); });
    return [true, wo + ' (d): ' + zt.join(', ') + ' stehen weder in belegstand.md noch in kosten.md noch in einer ERGEBNIS.md beisammen' +
      (ohne.length ? '; ' + ohne.join(', ') + ' kommt dort ueberhaupt nicht vor' : '; jede fuer sich kommt irgendwo vor (anderer Zusammenhang)')];
  }
  return [true, wo + ': unbekannte Klasse "' + e.klasse + '"'];
}

/** strategien.js: der Kopf "Überholt: …" wird zur Laufzeit vor den Beleg gesetzt, der mit belegeUeberholt.ab beginnt
 *  (strategien.js, Auftrag Nr. 91). Eine Fundstelle steht darunter, wenn dieser Beleg im selben Feld vor ihr steht. */
function kopfImFeld(quelle, stelle) {
  var re = /belegeUeberholt:\s*\{\s*ab:\s*'([^']+)'/g, m;
  while ((m = re.exec(quelle))) {
    var i = quelle.lastIndexOf(m[1], stelle);
    if (i !== -1 && i <= stelle && i > quelle.lastIndexOf('beleg: [', stelle) && !/\n\s*\],/.test(quelle.slice(i, stelle))) return ['Überholt-Kopf (belegeUeberholt.ab)'];
  }
  return null;
}

/** Steht z in text - genau oder als gerundete Fassung einer laengeren Zahl dort (-0,024 -> -0,02; 0,649 -> 0,65)? */
function zahlDa(text, z) {
  if (tokenIn(text, z)) return true;
  var d = /[.,](\d{1,2})$/.exec(z);
  if (!d) return false;
  var stellen = d[1].length, wert = Number(z.replace(',', '.'));
  return zahlen(text).some(function (y) {
    if (!/^\d+[.,]\d+$/.test(y)) return false;
    var nachk = y.split(/[.,]/)[1].length;
    return nachk > stellen && Math.abs(Number(y.replace(',', '.')) - wert) <= 0.5 * Math.pow(10, -stellen) + 1e-9;
  });
}
/** Die Belegzeile samt der Tabelle darueber (Kopfzeilen tragen Nenner wie "von 63"). */
function belegUmfeld(bt, zeile) {
  var l = bt.split('\n'), i = zeile - 1, aus = [l[i]];
  if (/^\s*\|/.test(l[i])) for (var j = i - 1; j >= 0 && /^\s*\|/.test(l[j]); j--) aus.unshift(l[j]);
  return aus.join('\n');
}

function kurz(s) { s = String(s).replace(/\s+/g, ' '); return s.length > 90 ? s.slice(0, 87) + '...' : s; }

/* ---------------- Ablauf ---------------- */
(function () {
  var filter = process.argv[2] || '';
  var korpus = ['wiki/belegstand.md', 'wiki/kosten.md'].concat(ergebnisDateien())
    .map(function (f) { return [f, lies(f)]; }).filter(function (k) { return k[1] != null; });
  var listen = fs.existsSync(LISTEN) ? fs.readdirSync(LISTEN).filter(function (f) { return /\.json$/.test(f); }).sort() : [];
  if (!listen.length) { console.log('TEST DEFEKT: keine Fundlisten unter ' + LISTEN); process.exitCode = 1; return; }
  var summe = { a: [0, 0], b: [0, 0], c: [0, 0], d: [0, 0] }, nr = 0;
  listen.forEach(function (f) {
    var gruppe = f.replace(/\.json$/, ''), liste;
    if (/^[a-d]$/.test(filter) === false && filter && gruppe.indexOf(filter) !== 0) return;
    try { liste = JSON.parse(fs.readFileSync(path.join(LISTEN, f), 'utf8')); }
    catch (err) { console.log('[' + gruppe + '] TEST DEFEKT: ' + err.message); process.exitCode = 1; return; }
    liste.forEach(function (e, i) {
      if (/^[a-d]$/.test(filter) && e.klasse !== filter) return;
      nr++;
      var r;
      try { r = pruefe(e, korpus); } catch (err) { r = [true, 'TEST DEFEKT: ' + (err && err.stack || err)]; process.exitCode = 1; }
      if (summe[e.klasse]) summe[e.klasse][r[0] ? 1 : 0]++;
      console.log('[' + gruppe + ' ' + (i + 1) + '] ' + (r[0] ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + r[1]);
    });
  });
  console.log('Summe: ' + nr + ' Fundstellen - ' + Object.keys(summe).map(function (k) {
    return k + ' ' + (summe[k][0] + summe[k][1]) + ' (' + summe[k][1] + ' Abweichung, ' + summe[k][0] + ' kein Unterschied)';
  }).join('; '));
})();
