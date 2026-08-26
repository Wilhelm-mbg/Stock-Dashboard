'use strict';
/* ================= WACHHUND FUER DIE KURSARCHIVE =================
 *
 * WOZU. Am 26.08.2026 stand das Stundenarchiv zwei Tage still, ohne dass es jemand
 * merkte - und zwar aus einem Grund, der von aussen wie Gesundheit aussieht:
 * `node tools/yahoo-60m-holen.js alle` ueberspringt jeden Wert, den es schon hat,
 * meldet "schon geholt: 2916 ... Nichts zu tun." und geht mit Erfolg aus. Wer neue
 * Kerzen wollte, brauchte --aktualisieren; ohne den Schalter lernt der Lauf nichts
 * dazu und sagt es auch nicht.
 * Ein Lauf, der nichts dazulernt, sieht von aussen aus wie ein gesunder Lauf. Genau
 * diese Klasse Fehler soll hier auffliegen.
 *
 * WAS GEPRUEFT WIRD. Wie alt ist die JUENGSTE Kerze des Archivs, gemessen am letzten
 * abgeschlossenen Handelstag? Nicht "wann wurde die Datei geschrieben" - das war die
 * Falle: am 26.08. um 00:49 wurden alle 2.887 Dateien neu geschrieben (von der
 * Teilkerzen-Bereinigung) und trugen trotzdem nur Daten bis zum 24.08.
 *
 * FEIERTAGE KENNT DIESES WERKZEUG NICHT. Ein Rueckstand von EINEM Handelstag kann
 * ein Feiertag sein; deshalb wird dort gewarnt, aber nicht Alarm geschlagen. Ab zwei
 * Tagen ist es kein Feiertag mehr. Wer es genauer will, braucht einen Kalender - und
 * der waere eine eigene Entscheidung, keine Reparatur.
 *
 * Aufruf:
 *   node tools/archiv-wachhund.js                 beide Archive (60m und 1d)
 *   node tools/archiv-wachhund.js archiv60m       nur eines
 *   node tools/archiv-wachhund.js --stichprobe 200
 *
 * Exit 0: frisch.  Exit 1: Rueckstand ab zwei Handelstagen.
 * Exit 2: nicht pruefbar - Ordner fehlt, oder es wird GERADE GESCHRIEBEN. Der zweite
 *         Fall ist der wichtige: waehrend eines Nachladelaufs ist das Archiv gemischt,
 *         und ein Rueckstand waere dann eine Aussage ueber den Zeitpunkt der Frage,
 *         nicht ueber das Archiv.
 */
var fs = require('fs');
var path = require('path');
var Quelle = require('../kerzenquelle.js');


/* Dieselbe Kette wie das Abrufwerkzeug und die App - sie steht in kerzenquelle.js.
 * Vorher suchte dieser Waechter je Intervall einen eigenen Zeiger, das Werkzeug legte
 * die Intervalle NEBEN den 60m-Ordner. Fuer 60m und 1d gibt es Zeiger, also fiel es
 * nicht auf; fuer 1m/5m/15m gibt es keine - der Waechter haette am falschen Ort
 * nachgesehen und ein leeres Archiv gemeldet, waehrend die Daten anderswo lagen. */
function ordnerVon(name) { return Quelle.ordnerVon(name); }

/* Der letzte Handelstag, der ABGESCHLOSSEN ist. Die US-Sitzung endet um 20:00 UTC;
 * eine halbe Stunde Zuschlag, weil Yahoo die Schlusskerze nicht in derselben Sekunde
 * hat. Samstag und Sonntag zaehlen nie. */
function letzterAbgeschlossenerHandelstag(jetzt) {
  var d = new Date(jetzt.getTime());
  var heuteFertig = d.getUTCHours() > 20 || (d.getUTCHours() === 20 && d.getUTCMinutes() >= 30);
  if (!heuteFertig) d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* Handelstage zwischen zwei Datumsangaben - Wochenenden ausgenommen, Feiertage nicht
 * bekannt. Die Zahl ist damit eine OBERGRENZE des echten Rueckstands. */
function handelstageDazwischen(vonTag, bisTag) {
  var a = new Date(vonTag + 'T00:00:00Z'), b = new Date(bisTag + 'T00:00:00Z');
  var n = 0;
  while (a < b) {
    a.setUTCDate(a.getUTCDate() + 1);
    if (a.getUTCDay() !== 0 && a.getUTCDay() !== 6) n++;
  }
  return n;
}

/* ---------- SPERRE: hier wird gerade geschrieben ----------
 * Ein Nachladelauf braucht rund 97 Minuten JE ARCHIV - der Bereich ist je Intervall
 * fest verdrahtet (730d bzw. 40y), einen inkrementellen Modus gibt es nicht. Waehrend
 * dieser Zeit ist das Archiv nicht kaputt, sondern GEMISCHT: ein Teil auf dem neuen
 * Stand, ein Teil auf dem alten. Genau das sieht von aussen gesund aus, und genau
 * darum geht es hier - wer um 03:15 darauf misst, misst auf wanderndem Grund.
 * Deshalb: nicht auf die Uhr vertrauen, sondern fragen.
 *
 * DIE SPERRE MUSS EINEN ABSTURZ UEBERLEBEN KOENNEN. Stirbt der Abruf hart, bliebe sie
 * liegen und der Wachhund sagte fuer immer "wird gerade geschrieben" - die Stille von
 * heute in ihrer dritten Verkleidung. Sie traegt deshalb einen Zeitstempel und gilt
 * nach VERWAIST_STUNDEN als verwaist. Verwaist heisst NICHT "alles gut": es wird
 * eigens gemeldet, denn ein abgestuerzter Lauf ist selbst ein Befund.
 * Geloescht wird sie hier nicht - ein Wachhund raeumt nicht auf, er bellt. Der
 * naechste Lauf ueberschreibt sie. */
/* Das alles steht seit dem 26.08.2026 in kerzenquelle.js, weil die App die Sperre
 * genauso setzen muss und tools/ nicht mit ausgeliefert wird. Hier stand es bis
 * dahin ein zweites Mal - zwei Fassungen derselben Regel sind zwei Gelegenheiten,
 * dass eine davon still veraltet. */
var VERWAIST_STUNDEN = Quelle.VERWAIST_STUNDEN;
var sperrePfad = Quelle.sperrePfad;
var sperreLesen = Quelle.sperreLesen;
var sperreSetzen = Quelle.sperreSetzen;
var sperreLoesen = Quelle.sperreLoesen;

function juengsteKerze(datei) {
  try {
    var j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    var s = j.series || j.bars || [];
    if (!s.length) return null;
    return new Date(s[s.length - 1][0]).toISOString().slice(0, 10);
  } catch (e) { return null; }
}

/** Prueft einen Archivordner. Gibt einen Befund zurueck statt zu drucken - so kann
 *  das Abrufwerkzeug denselben Befund am Ende SEINES Laufs melden, ohne die Logik
 *  ein zweites Mal zu haben. Zwei Rechnungen fuer dieselbe Frage waeren die naechste
 *  Stelle, an der eine still falsch wird. */
function pruefe(ordner, opt) {
  opt = opt || {};
  var jetzt = opt.jetzt || new Date();
  if (!fs.existsSync(ordner)) return { ok: false, grund: 'Ordner fehlt: ' + ordner, ordner: ordner };
  /* Erst fragen, ob gerade geschrieben wird. Ein Rueckstand waehrend des Schreibens
   * ist keine Aussage ueber das Archiv, sondern ueber den Zeitpunkt der Frage. */
  var sp = sperreLesen(ordner, jetzt);
  if (sp.aktiv) {
    return { ok: false, gesperrt: true, ordner: ordner, seit: sp.start, was: sp.was,
      grund: 'wird gerade geschrieben (seit ' + sp.start + ', ' + sp.alterStunden.toFixed(1) + ' h)' };
  }
  var dateien = fs.readdirSync(ordner).filter(function (f) { return /^bars_.*\.json$/.test(f); });
  if (!dateien.length) return { ok: false, grund: 'keine Kursdateien in ' + ordner, ordner: ordner };
  /* Gleichmaessige Stichprobe statt der ersten N - die ersten sind alphabetisch und
   * damit womoeglich alle aus einem Nachladelauf. */
  var n = opt.stichprobe && opt.stichprobe < dateien.length ? opt.stichprobe : dateien.length;
  var schritt = Math.max(1, Math.floor(dateien.length / n));
  var tage = {}, gelesen = 0, unlesbar = 0, nachzuegler = [];
  var sollFuerNachzuegler = letzterAbgeschlossenerHandelstag(jetzt);
  for (var i = 0; i < dateien.length; i += schritt) {
    var t = juengsteKerze(path.join(ordner, dateien[i]));
    if (!t) { unlesbar++; continue; }
    tage[t] = (tage[t] || 0) + 1; gelesen++;
    /* WER genau zurueckhaengt, nicht nur wie viele. Zehn namentlich genannte Reihen
     * sind handlungsfaehig, ein Prozentsatz ist es nicht - und genau daran ist am
     * 26.08.2026 eine falsche Delisting-Liste entstanden: fuenf Reihen standen im
     * Archiv still, wurden aber als "verschwunden" gelesen. */
    if (t < sollFuerNachzuegler) {
      nachzuegler.push({ sym: dateien[i].replace(/^bars_[^_]+_/, '').replace(/\.json$/, ''),
        tag: t, tageZurueck: handelstageDazwischen(t, sollFuerNachzuegler) });
    }
  }
  nachzuegler.sort(function (a, b) { return a.tageZurueck - b.tageZurueck; });
  if (!gelesen) return { ok: false, grund: 'keine Datei lesbar', ordner: ordner };
  /* Der HAEUFIGSTE juengste Tag, nicht der spaeteste: ein einzelner frisch
   * nachgeladener Wert soll das Archiv nicht gesund aussehen lassen. Genau so ist
   * der Fehler entstanden - 69 Werte waren aktuell, 2.847 nicht. */
  var haeufigster = Object.keys(tage).sort(function (a, b) { return tage[b] - tage[a]; })[0];
  var spaetester = Object.keys(tage).sort()[Object.keys(tage).length - 1];
  var soll = letzterAbgeschlossenerHandelstag(jetzt);
  var rueckstand = handelstageDazwischen(haeufigster, soll);
  return {
    ok: rueckstand < 2, ordner: ordner, dateien: dateien.length, gelesen: gelesen, unlesbar: unlesbar,
    /* JA ODER NEIN, nicht "wie alt". Bis zum 26.08.2026 stand hier das Alter in
     * Stunden - solange eine Sperre erst nach sechs Stunden verwaisen konnte, war
     * das nie null. Seit sie auch verwaist, wenn ihr Prozess tot ist, kann sie es:
     * eine gerade gestorbene rundete auf 0,0 - und 0 ist falsy. Der Melder haette
     * geschwiegen, und archiv-nachladen.js haette sie nicht gezaehlt. Genau die
     * Sorte Fehler, gegen die dieses Werkzeug gebaut ist. */
    verwaisteSperre: sp.verwaist === true,
    verwaistStunden: sp.verwaist && sp.alterStunden != null ? Math.round(sp.alterStunden * 10) / 10 : null,
    verwaistWarum: sp.verwaist ? (sp.grundVerwaist || null) : null,
    juengsterTagHaeufig: haeufigster, juengsterTagSpaetester: spaetester,
    /* "Auf Stand" heisst nicht "genau am Solltag", sondern "nicht dahinter". Sonst
     * meldet ein Archiv, das den heutigen (noch laufenden) Tag schon enthaelt, 0 % -
     * gemessen und korrigiert am 26.08.2026 an einem frisch geholten Wegwerf-Archiv. */
    anteilAufStand: Object.keys(tage).reduce(function (a, t) { return a + (t >= soll ? tage[t] : 0); }, 0) / gelesen,
    sollTag: soll, rueckstandHandelstage: rueckstand,
    nachzuegler: nachzuegler, vollstaendig: n >= dateien.length,
    verteilung: tage
  };
}

/* NIE AUF 100 AUFRUNDEN, WENN ES NICHT 100 IST. Am 26.08.2026 meldete dieses Werkzeug
 * "2.965 von 2.965, 100 % auf Stand", waehrend ZEHN Reihen zurueckhingen - 99,6627 %
 * wurde von Math.round zu 100. Gezaehlt wurde richtig, die Anzeige nahm die Wahrheit
 * weg. Und zwar in der Sicherung, die genau gegen stilles Veralten gebaut wurde.
 * Die Luecke ist dann ueber eine falsche Delisting-Liste aufgefallen statt hier.
 * Jetzt: abgerundet auf eine Nachkommastelle, und "100 %" steht nur, wenn wirklich
 * jede gepruefte Reihe auf Stand ist. */
function anteilText(b) {
  var n = b.nachzuegler ? b.nachzuegler.length : 0;
  if (!n) return '100 %';
  var p = Math.floor(b.anteilAufStand * 1000) / 10;
  return p.toFixed(1).replace('.', ',') + ' %';
}

function textZu(b) {
  if (b.gesperrt) return path.basename(b.ordner) + ': WIRD GERADE GESCHRIEBEN - ' + b.grund +
    '\n  Kein Urteil ueber den Stand: das Archiv ist in diesem Moment gemischt.';
  if (b.grund) return 'NICHT PRUEFBAR: ' + b.grund;
  var z = path.basename(b.ordner) + ': juengste Kerze ' + b.juengsterTagHaeufig +
    ', letzter abgeschlossener Handelstag ' + b.sollTag +
    ' -> Rueckstand ' + b.rueckstandHandelstage + ' Handelstag(e)' +
    '  [' + b.gelesen + ' von ' + b.dateien + ' geprueft, ' + anteilText(b) + ' auf Stand]';
  if (b.rueckstandHandelstage >= 2) z += '\n  ALARM: Das Archiv steht still. Ein Lauf ohne --aktualisieren holt NICHTS nach -' +
    '\n         er meldet "Nichts zu tun" und geht mit Erfolg aus.';
  else if (b.rueckstandHandelstage === 1) z += '\n  Hinweis: ein Handelstag Rueckstand - kann ein Feiertag sein, dieses Werkzeug kennt keine.';
  /* WER haengt zurueck? Der haeufigste Tag ist die richtige Kennzahl fuer das Ganze,
   * aber er sagt nichts ueber die Ausreisser. Ein Name mit Datum ist handlungsfaehig.
   * WICHTIG: eine stillstehende Reihe ist nicht automatisch ein Fehler - ein Papier,
   * das wirklich vom Markt ist, steht zu Recht still. Der Unterschied liegt im ALTER:
   * ein paar Handelstage sind verdaechtig, zwei Jahre sind plausibel. Deshalb steht
   * der Abstand dabei und nicht nur der Name. */
  if (b.nachzuegler && b.nachzuegler.length) {
    var kurz = b.nachzuegler.filter(function (x) { return x.tageZurueck <= 10; });
    z += '\n  ' + b.nachzuegler.length + ' Reihe(n) haengen zurueck' +
      (b.vollstaendig ? '' : ' (nur in der Stichprobe gesehen - es koennen mehr sein)') + ':';
    b.nachzuegler.slice(0, 12).forEach(function (x) {
      z += '\n      ' + x.sym + '  ' + x.tag + '  (' + x.tageZurueck +
        ' Handelstag' + (x.tageZurueck === 1 ? '' : 'e') + ')';
    });
    if (b.nachzuegler.length > 12) z += '\n      (+' + (b.nachzuegler.length - 12) + ' weitere)';
    if (kurz.length) {
      z += '\n    Davon ' + kurz.length + ' erst seit hoechstens 10 Handelstagen - das sind die' +
        '\n    verdaechtigen: ein frisch stillstehender Wert ist eher ein Abruffehler als' +
        '\n    ein Delisting. Wer sie als "verschwunden" fuehrt, wirft sie aus dem Universum.';
    }
  }
  /* Eine liegengebliebene Sperre ist selbst ein Befund: da ist ein Lauf gestorben. */
  if (b.verwaisteSperre) z += '\n  VERWAISTE SPERRE: ein Nachladelauf hat sie vor ' +
    (b.verwaistStunden == null ? 'unbekannter Zeit' : b.verwaistStunden + ' h') +
    ' gesetzt und nie aufgeraeumt' +
    /* Steht der Grund dabei, ist es keine Vermutung mehr: dann wurde nachgesehen,
     * ob es den Schreiber ueberhaupt noch gibt. */
    (b.verwaistWarum ? ' (' + b.verwaistWarum + ')' : ' - er ist vermutlich abgestuerzt') +
    '. Der Stand oben gilt trotzdem.';
  return z;
}

module.exports = { pruefe: pruefe, textZu: textZu, letzterAbgeschlossenerHandelstag: letzterAbgeschlossenerHandelstag,
  handelstageDazwischen: handelstageDazwischen, ordnerVon: ordnerVon,
  sperreSetzen: sperreSetzen, sperreLoesen: sperreLoesen, sperreLesen: sperreLesen,
  VERWAIST_STUNDEN: VERWAIST_STUNDEN };

if (require.main === module) {
  var args = process.argv.slice(2);
  var stich = 0;
  var si = args.indexOf('--stichprobe');
  if (si !== -1) { stich = parseInt(args[si + 1], 10) || 0; args.splice(si, 2); }
  var namen = args.length ? args : ['archiv60m', 'archiv1d'];
  var schlimm = 0, unpruefbar = 0;
  namen.forEach(function (nm) {
    var b = pruefe(ordnerVon(nm) || nm, { stichprobe: stich });
    console.log(textZu(b));
    if (b.gesperrt || b.grund) unpruefbar++;
    else if (!b.ok) schlimm++;
  });
  process.exit(schlimm ? 1 : (unpruefbar ? 2 : 0));
}
