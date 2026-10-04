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
    .replace(/#\d+(?:[.,]\d+)*/g, ' ');
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
  var g = glatt(text), re = new RegExp('(^|[^\\d.,])' + z.replace(/[.]/g, '\\.') + '(?![\\d]|[.,]\\d)');
  return re.test(g);
}

var UEBERHOLT = /[ÜüUu]berholt|veraltet|zur[üu]ckgewiesen|zur[üu]ckgenommen|nicht mehr g[üu]ltig|alte[rn]? (Messung|Beleg|Zahl)|vor der (Zeitzonen-)?Korrektur|line-through|<s>|<del>|text-decoration/;

/* ---------------- Pruefung je Fundstelle ---------------- */

function pruefe(e, korpus) {
  var quelle = lies(e.datei);
  if (quelle == null) return [true, 'Quelldatei ' + e.datei + ' fehlt'];
  var fund = zeileMit(quelle, e.wortlaut);
  if (!fund) return [true, 'Wortlaut steht nicht mehr in ' + e.datei + ' (Text geaendert?) - "' + kurz(e.wortlaut) + '"'];
  var wo = e.datei + ':' + fund.zeile;
  var zOben = zahlen(quelle.substr(fund.stelle, e.wortlaut.length));    // aus der Quelldatei gelesen
  var beleg = null;
  if (e.beleg && e.beleg.datei) {
    var bt = lies(e.beleg.datei);
    if (bt == null) return [true, wo + ': Belegdatei ' + e.beleg.datei + ' fehlt'];
    beleg = zeileMit(bt, e.beleg.marke);
    if (!beleg) return [true, wo + ': Belegstelle steht nicht mehr in ' + e.beleg.datei + ' - "' + kurz(e.beleg.marke) + '"'];
    beleg.ort = e.beleg.datei + ':' + beleg.zeile;
  }
  var zBeleg = beleg ? zahlen(beleg.text) : [];

  if (e.klasse === 'a') {
    if (!beleg) return [true, wo + ' (a): keine Belegstelle angegeben'];
    var fehlt = zOben.filter(function (z) { return !tokenIn(beleg.text, z); });
    if (fehlt.length) return [true, wo + ' (a, laut Liste "stimmt"): ' + fehlt.join(', ') + ' steht nicht in ' + beleg.ort + ' (dort: ' + (zBeleg.join(', ') || '-') + ')'];
    return [false, wo + ' (a): ' + (zOben.length ? zOben.join(', ') + ' = ' + beleg.ort : 'Urteil ohne Zahl, Belegstelle ' + beleg.ort + ' vorhanden')];
  }

  if (e.klasse === 'b') {
    var a = Math.max(0, fund.stelle - 1500), umfeld = quelle.slice(a, fund.stelle + e.wortlaut.length + 300);
    var m = umfeld.match(UEBERHOLT);
    if (!m) return [true, wo + ' (b, laut Liste "als ueberholt gekennzeichnet"): kein Ueberholt-Vermerk im Umfeld gefunden - ' + (zOben.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' steht ungekennzeichnet'];
    return [false, wo + ' (b): ' + (zOben.join(', ') || 'Urteil') + ' steht unter dem Vermerk "' + m[0] + '"' + (beleg ? ', Beleg ' + beleg.ort : '')];
  }

  if (e.klasse === 'c') {
    if (!beleg) return [true, wo + ' (c): Oberflaeche ' + (zOben.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' - heutiger Stand: ' + (e.belegsagt || '?')];
    var anders = zOben.filter(function (z) { return !tokenIn(beleg.text, z); });
    if (zOben.length && !anders.length) return [false, wo + ' (c, laut Liste "veraltet"): alle Zahlen ' + zOben.join(', ') + ' stehen inzwischen so in ' + beleg.ort + ' - Einordnung pruefen'];
    return [true, wo + ' (c): Oberflaeche ' + (anders.join(', ') || '"' + kurz(e.wortlaut) + '"') + ' | Belegstand ' + beleg.ort + ': ' + (zBeleg.join(', ') || kurz(beleg.text)) +
      (e.belegsagt ? ' (' + e.belegsagt + ')' : '')];
  }

  if (e.klasse === 'd') {
    if (!zOben.length) return [true, wo + ' (d): Urteil ohne Beleg - "' + kurz(e.wortlaut) + '"'];
    var ohne = zOben.filter(function (z) { return !korpus.some(function (k) { return tokenIn(k[1], z); }); });
    if (!ohne.length) {
      var wo2 = zOben.map(function (z) { var k = korpus.filter(function (k) { return tokenIn(k[1], z); })[0]; return z + ' (' + k[0] + ')'; });
      return [false, wo + ' (d, laut Liste "ohne Beleg"): jede Zahl kommt im Belegkorpus vor - ' + wo2.join(', ') + ' - Zusammenhang von Hand pruefen'];
    }
    return [true, wo + ' (d): ' + ohne.join(', ') + ' steht weder in belegstand.md noch in kosten.md noch in einer ERGEBNIS.md' +
      (ohne.length < zOben.length ? ' (die uebrigen ' + zOben.filter(function (z) { return ohne.indexOf(z) === -1; }).join(', ') + ' schon)' : '')];
  }
  return [true, wo + ': unbekannte Klasse "' + e.klasse + '"'];
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
