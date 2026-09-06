'use strict';
/* DAS ALPACA-MINUTENARCHIV - EINE Schreibroutine fuer Werkzeug und App (06.09.2026).
 *
 * Bis zum 06.09.2026 wusste nur tools/alpaca-vollsammlung.js, wie ein Symbol-Jahr
 * unter alpaca1m/<ORDNER>/<JAHR>.json aussieht: Format 2 aus kerzenquelle.js, dazu
 * `sitzungen` (Bereiche vor/regulaer/nach/ausserhalb aus dem Kalender der Quelle) und
 * `jahr`. Seit dem Live-Sammler schreibt auch die App in dieses Archiv, und der
 * naechtliche Nachlauf (--nachholen) ebenfalls. Drei Schreiber mit je einer eigenen
 * Vorstellung vom Format waeren drei Wahrheiten - deshalb steht das Format hier,
 * genau einmal, und tools/ wird nicht ausgeliefert, also liegt die Datei in der Wurzel.
 *
 * WAS DIESE DATEI NICHT TUT: sie holt nichts aus dem Netz, sie kennt keinen Schluessel,
 * sie nimmt keine Sperre von sich aus (die Aufrufer teilen sich die Sperre aus
 * kerzenquelle.js auf dem Ordner alpaca1m/), und sie loescht nie eine Kerze.
 *
 * DAS ARCHIV IST ADDITIV. Eine Jahresdatei waechst nur am Ende:
 *   - eine Kerze, deren Stempel schon in der Datei steht, wird NIE ueberschrieben;
 *   - eine Kerze, die aelter ist als die juengste der Datei, wird nicht eingefuegt
 *     (der Anhang ist ein Anhang, kein Einsortieren - wer Luecken fuellen will,
 *     schreibt die Datei neu, und das tut kein Aufrufer von hier);
 *   - eine NEUE Datei entsteht atomar (Temp-Datei, dann umbenannt); ein ANHANG geht
 *     seit dem 07.09.2026 an Ort und Stelle, mit einem Reparaturjournal davor. Ein
 *     Absturz mittendrin ist damit nicht folgenlos, aber vollstaendig zuruecknehmbar
 *     (siehe "DAS REPARATURJOURNAL" weiter unten).
 *
 * WARUM ANHAENGEN STATT NEU SCHREIBEN. AAPL/2026.json traegt im September 133.770
 * Kerzen auf 6,7 MB. Der Live-Sammler haengt alle fuenf Minuten an rund 500 solcher
 * Dateien an. Die Datei jedes Mal zu lesen, zu zerlegen, zu erweitern und neu zu
 * serialisieren kostete ~100 ms Rechenzeit im Hauptprozess JE DATEI - 50 s je Runde,
 * in der die Oberflaeche auf jede Auskunft warten muesste. Der Anhang liest nur den
 * Schwanz (~100 KB) und schreibt die neuen Kerzen dahinter - an Ort und Stelle. Der
 * Kopf der Datei (quellen.bis, stand) wird ebenfalls an Ort und Stelle ueberschrieben,
 * und zwar nur die zwei betroffenen Spannen: beide Felder sind gleich lang wie vorher
 * (13-stellige Millisekunden, 24 Zeichen ISO-Zeit), sonst wird verweigert. Geschrieben
 * werden je Anhang also Journal + zwei Spannen + neuer Schwanz - nicht die Datei.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KQ = require('./kerzenquelle.js');

/* ================= Orte ================= */

/** Die Wurzel des Alpaca-Archivs: neben den Yahoo-Archiven (archiv60m-Zeiger), also
 *  kein fester Laufwerksbuchstabe. MD_ALPACA_WURZEL gewinnt (Werkzeuge, Proben). */
function wurzel() {
  if (process.env.MD_ALPACA_WURZEL) return process.env.MD_ALPACA_WURZEL;
  return path.dirname(KQ.ordnerVon('60m'));
}
function rohOrdner() { return path.join(wurzel(), 'alpaca1m'); }
function bereinigtOrdner() { return path.join(wurzel(), 'alpaca1m-bereinigt'); }
function massnahmenOrdner() { return path.join(wurzel(), 'alpaca-massnahmen'); }
/* Die Meta-Dateien im Rohordner. Sie sind KEINE Jahresdateien - wer den Ordner
 * abzaehlt (Manifest, Lueckenliste), laesst alles mit fuehrendem Unterstrich aus. */
var META = {
  fortschritt: '_fortschritt.json', lebenszeit: '_lebenszeit.json', symbole: '_symbole.json',
  kalender: '_kalender.json', protokoll: '_lauf.log', manifest: '_manifest.json', luecken: '_luecken.json',
};
function metaPfad(roh, was) { return path.join(roh, META[was]); }

/* ================= Kuerzel -> Ordnername =================
 *
 * Der Ordnername ist NICHT einfach das Kuerzel. Drei Fallen (tools/alpaca-vollsammlung.js,
 * gefunden vor dem ersten geschriebenen Byte): CON/PRN/AUX/NUL/COM1-9/LPT1-9 sind unter
 * Windows Geraetenamen; HIW und HIw sind zwei Wertpapiere, deren Ordner auf einem
 * Dateisystem ohne Gross-/Kleinschreibung zusammenfielen; ein Kuerzel, das auf einen
 * Punkt endet, waere unzulaessig. Regel: was nicht rein aus Grossbuchstaben, Ziffern und
 * Punkten besteht oder ein Geraetename ist, bekommt einen Kurzstempel seines EXAKTEN
 * Namens. Die vollstaendige Abbildung fuehrt _symbole.json (`ordner`); die Wahrheit
 * steht ohnehin als `sym` im Datei-Rumpf. */
var GERAET = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
function kurzstempel(s) {
  return require('crypto').createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 6);
}
function ordnerName(sym) {
  var s = String(sym);
  var reihe = s.replace(/~2$/, ''), zweite = s !== reihe;
  var sauber = /^[A-Z0-9.]+$/.test(reihe) && !GERAET.test(reihe) && !/\.$/.test(reihe);
  var name = sauber ? reihe : reihe.replace(/[^A-Za-z0-9.]/g, '_') + '_' + kurzstempel(reihe);
  return zweite ? name + '~2' : name;
}
/* Die Abbildung aus _symbole.json, gemerkt je Aenderungszeit der Datei. Ohne Datei gilt
 * die Regel oben - fuer alles ausser CON und den drei Kollisionen ist das dasselbe. */
var ABBILDUNG = { pfad: null, mtime: 0, ordner: {} };
function abbildung(roh) {
  var p = metaPfad(roh, 'symbole');
  var mtime = 0;
  try { mtime = fs.statSync(p).mtimeMs; } catch (e) { mtime = 0; }
  if (ABBILDUNG.pfad !== p || ABBILDUNG.mtime !== mtime) {
    var ord = {};
    if (mtime) {
      try {
        var j = JSON.parse(fs.readFileSync(p, 'utf8'));
        ord = (j && (j.ordner || j.ab)) || {};
      } catch (e) { ord = {}; }
    }
    ABBILDUNG = { pfad: p, mtime: mtime, ordner: ord };
  }
  return ABBILDUNG.ordner;
}
function ordnerFuer(roh, sym) {
  return abbildung(roh)[sym] || ordnerName(sym);
}
function jahrDatei(roh, sym, jahr) {
  return path.join(roh, ordnerFuer(roh, sym), jahr + '.json');
}
/* KUERZEL-WIEDERVERWENDUNG: liefert die Quelle heute Balken fuer "AAC", gehoeren sie dem
 * HEUTIGEN Traeger des Kuerzels. Hat die Lebenszeit (Phase L der Vollsammlung) eine
 * zweite Reihe "AAC~2" erkannt, ist das die laufende Reihe - und nur dorthin darf ein
 * frischer Balken. In die Datei des erloschenen Traegers geschrieben, staenden zwei
 * Unternehmen in einer Reihe, still. Die Lebenszeit-Datei wird je Aenderungszeit
 * gemerkt, wie die Abbildung der Ordnernamen. */
var LEBENSZEIT = { pfad: null, mtime: 0, werte: {}, stand: null };
/** Die ganze Lebenszeit-Datei { stand, werte } - `stand` sagt, wie alt die Auskunft
 *  ist, und daran misst der Live-Sammler, welche Reihe erloschen ist (livesammler.js
 *  gefuehrteReihen). Ohne Datei: { stand: null, werte: {} }. */
function lebenszeitDatei(roh) {
  var p = metaPfad(roh, 'lebenszeit');
  var mtime = 0;
  try { mtime = fs.statSync(p).mtimeMs; } catch (e) { mtime = 0; }
  if (LEBENSZEIT.pfad !== p || LEBENSZEIT.mtime !== mtime) {
    var werte = {}, stand = null;
    if (mtime) {
      try {
        var j = JSON.parse(fs.readFileSync(p, 'utf8')) || {};
        werte = j.werte || {};
        stand = j.stand || null;
      } catch (e) { werte = {}; stand = null; }
    }
    LEBENSZEIT = { pfad: p, mtime: mtime, werte: werte, stand: stand };
  }
  return { stand: LEBENSZEIT.stand, werte: LEBENSZEIT.werte };
}
function lebenszeitLesen(roh) {
  return lebenszeitDatei(roh).werte;
}
function reiheFuer(roh, sym) {
  var lz = lebenszeitLesen(roh);
  return lz[sym + '~2'] ? sym + '~2' : sym;
}
/** Der juengste Stempel einer Reihe: aus der Jahresdatei des laufenden Jahres, sonst
 *  aus der des Vorjahres (Januar), sonst null. Nur der Schwanz wird gelesen. */
function letzterStempelReihe(roh, reihe, jahr) {
  for (var j = jahr; j >= jahr - 1; j--) {
    var p = jahrDatei(roh, reihe, j);
    if (!fs.existsSync(p)) continue;
    var b = schwanzBefund(p);
    if (b.ok && b.letzterStempel != null) return b.letzterStempel;
    /* Liegt ein Journal, ist der Stand dieser Reihe unbekannt - dann NICHT auf das
     * Vorjahr ausweichen: dessen Stempel waere aelter und der Aufrufer hielte ihn
     * fuer den Stand der Reihe. Lieber gar keine Auskunft. */
    if (b.journal) return null;
  }
  return null;
}
/** Eine Zeile ins Laufprotokoll des Rohordners - dasselbe Protokoll wie die Vollsammlung. */
function protokoll(roh, zeile) {
  try {
    fs.mkdirSync(roh, { recursive: true });
    fs.appendFileSync(metaPfad(roh, 'protokoll'), new Date().toISOString() + '  ' + zeile + '\n');
    return true;
  } catch (e) { return false; }
}

/* ================= Zeit: New York ================= */
var NY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});
function nyTeile(ms) {
  var t = {};
  NY.formatToParts(new Date(ms)).forEach(function (p) { t[p.type] = p.value; });
  return { j: +t.year, m: +t.month, d: +t.day, h: (+t.hour) % 24, min: +t.minute };
}
/** UTC-Millisekunden fuer eine Wanduhrzeit in New York (Sommerzeit ueber Intl). */
function nyNachUtc(j, m, d, h, min) {
  var guess = Date.UTC(j, m - 1, d, h, min);
  for (var i = 0; i < 2; i++) {
    var p = nyTeile(guess);
    var wand = Date.UTC(p.j, p.m - 1, p.d, p.h, p.min);
    var soll = Date.UTC(j, m - 1, d, h, min);
    if (wand === soll) return guess;
    guess += soll - wand;
  }
  return guess;
}
var NY_TAG = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
function etTag(ms) { return NY_TAG.format(new Date(ms)); }
/** Die Grenzen eines Sammeljahres - die ET-Grenze, nicht die UTC-Grenze: mit
 *  UTC-Mitternacht fielen die Nachboersen-Balken des 31.12. (ET-Abend = 1.1. UTC) in
 *  ZWEI Jahresdateien. Die Grenzen stossen genau aneinander: bis(j) + 1 === von(j+1). */
function jahrGrenzen(jahr) {
  return { von: nyNachUtc(jahr, 1, 1, 0, 0), bis: nyNachUtc(jahr + 1, 1, 1, 0, 0) - 1 };
}
/** In welche Jahresdatei gehoert dieser Stempel (ET-Jahr). */
function jahrVon(ms) { return Number(etTag(ms).slice(0, 4)); }

/* ================= Balken der Quelle ================= */
/** Alpaca-Balken -> Archivkerze [t, schluss, umsatz, hoch, tief, eroeffnung]. */
function kerzeAus(b) {
  var t = Date.parse(b && b.t);
  if (!isFinite(t) || new Date(t).getUTCSeconds() !== 0) return null;
  if (!KQ.kursOk(b.c) || !KQ.kursOk(b.h) || !KQ.kursOk(b.l) || !KQ.kursOk(b.o)) return null;
  var v = typeof b.v === 'number' && isFinite(b.v) && b.v >= 0 ? b.v : 0;
  return [t, b.c, v, b.h, b.l, b.o];
}
/** Die iex-Falle (wiki/datenquellen.md): eine Schnittstelle, die lieber irgendetwas
 *  antwortet als nichts. Was ausserhalb des ANGEFRAGTEN Zeitraums liegt, faellt raus. */
function imZeitraum(kerzen, von, bis) {
  var drin = [], draussen = 0;
  kerzen.forEach(function (k) { if (k[0] >= von && k[0] <= bis) drin.push(k); else draussen++; });
  return { drin: drin, draussen: draussen };
}

/* ================= Sitzungen aus dem Kalender der Quelle ================= */
/** Sitzung je Kerze aus dem Kalender der Quelle - nicht aus "09:30 bis 16:00" im Kopf.
 *  Halbtage stehen im Kalender mit ihrem eigenen close. 'ausserhalb' ist die BENANNTE
 *  Abweichung: ein Balken an einem Tag, den der Kalender nicht als Handelstag fuehrt -
 *  er wird behalten, benannt und gezaehlt, nicht weggeworfen und nicht 'regulaer' genannt. */
function sitzungJeKerze(kerzen, kal) {
  var grenzen = {};
  kal = kal || {};
  function fuer(tagEt) {
    if (grenzen[tagEt] !== undefined) return grenzen[tagEt];
    var e = kal[tagEt];
    if (!e || !e.open || !e.close) return (grenzen[tagEt] = null);
    var p = tagEt.split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
    return (grenzen[tagEt] = { auf: nyNachUtc(p[0], p[1], p[2], o[0], o[1]), zu: nyNachUtc(p[0], p[1], p[2], c[0], c[1]) });
  }
  return kerzen.map(function (k) {
    var g = fuer(etTag(k[0]));
    if (!g) return 'ausserhalb';
    if (k[0] < g.auf) return 'vor';
    if (k[0] >= g.zu) return 'nach';
    return 'regulaer';
  });
}
/** Aus "jede Kerze hat eine Sitzung" wieder Bereiche machen - dieselbe Verdichtung wie
 *  bei den Quellen, damit die Huelle nicht so lang wird wie die Reihe. */
function sitzungenVerdichten(serie, jeKerze) {
  return sitzungenAnhaengen([], serie, jeKerze);
}
/** Neue Kerzen an vorhandene Bereiche anhaengen - WOERTLICH dieselbe Regel wie beim
 *  Verdichten einer ganzen Reihe (Bereich = Lauf gleicher Sitzung), damit eine Datei
 *  nach zehn Anhaengen genauso aussieht wie nach einem Vollauf. */
function sitzungenAnhaengen(alt, serie, jeKerze) {
  var aus = (alt || []).map(function (b) { return { von: b.von, bis: b.bis, sitzung: b.sitzung }; });
  for (var i = 0; i < serie.length; i++) {
    var s = jeKerze[i], l = aus[aus.length - 1];
    if (l && l.sitzung === s) { l.bis = serie[i][0]; continue; }
    aus.push({ von: serie[i][0], bis: serie[i][0], sitzung: s });
  }
  return aus;
}
function sitzungenZaehlen(jeKerze) {
  var z = { regulaer: 0, vor: 0, nach: 0, ausserhalb: 0 };
  (jeKerze || []).forEach(function (s) { z[s] = (z[s] || 0) + 1; });
  return z;
}

/* ================= Kalender-Datei ================= */
function kalenderLesen(roh) {
  try { return JSON.parse(fs.readFileSync(metaPfad(roh, 'kalender'), 'utf8')); } catch (e) { return null; }
}
/** Deckt der gelesene Kalender diesen ET-Tag ab? Nur dann taugt er fuer die Sitzung. */
function kalenderDeckt(kal, tagEt) {
  return !!(kal && kal.tage && kal.von && kal.bis && kal.von <= tagEt && tagEt <= kal.bis);
}
function kalenderSchreiben(roh, obj) {
  atomarSchreiben(metaPfad(roh, 'kalender'), JSON.stringify(obj));
}

/* ================= Fortschritt ================= */
function fortschrittLesen(roh) {
  try { return JSON.parse(fs.readFileSync(metaPfad(roh, 'fortschritt'), 'utf8')); }
  catch (e) { return { begonnen: new Date().toISOString(), erledigt: {}, laufend: {}, leer: {}, abrufe: 0, wiederholt: 0, fehler: {}, kerzen: 0, bytes: 0 }; }
}
function fortschrittSchreiben(roh, F) {
  F.zuletzt = new Date().toISOString();
  atomarSchreiben(metaPfad(roh, 'fortschritt'), JSON.stringify(F));
}

/* ================= Sperre: geteilt zwischen App und Werkzeug ================= */
/* Die Sperre liegt auf dem Ordner alpaca1m/ und ist die aus kerzenquelle.js - mit
 * Prozessnummer, Rechnername und Verwaisungsfrist. Wer sie hat, schreibt; der andere
 * wartet (Live-Sammler: laesst die Runde aus; Nachlauf: wartet, bis sie frei ist). */
function sperreLesen(roh, jetzt) { return KQ.sperreLesen(roh, jetzt); }
function sperreSetzen(roh, was) { return KQ.sperreSetzen(roh, was); }
function sperreLoesen(roh) { return KQ.sperreLoesen(roh); }

/* ================= Atomar schreiben ================= */
function atomarSchreiben(pfad, text) {
  fs.mkdirSync(path.dirname(pfad), { recursive: true });
  var tmp = pfad + '.tmp-schreiben';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, pfad);
}

/* ================= DAS REPARATURJOURNAL (07.09.2026) =================
 *
 * Der Anhang schrieb bis heute in eine KOPIE der Jahresdatei und benannte sie um.
 * Das ist unbestreitbar sicher und kostet je Runde so viel Schreiblast, wie alle
 * beruehrten Dateien zusammen wiegen: bei 500 Werten ~1,9 GB alle fuenf Minuten, bei
 * allen gefuehrten Werten das Sechsfache - auf einer Festplatte (E: ist keine SSD)
 * ist das die Grenze. Deshalb schreibt der Anhang jetzt AN ORT UND STELLE, und die
 * Absturzsicherung liegt in einem Journal daneben.
 *
 * DIE REGEL: das Journal steht VOLLSTAENDIG auf der Platte (fsync), bevor am ersten
 * Datenbyte etwas geaendert wird. Es traegt die alten Bytes JEDER Stelle, die gleich
 * anders wird - die zwei Kopf-Spannen (quellen, stand) und den alten Schwanz ab
 * `schnitt` - und die alte Dateilaenge. Damit ist der Zustand VOR dem Anhang aus dem
 * Journal allein wiederherstellbar, byteidentisch.
 *
 * DREI ZUSTAENDE nach einem Absturz:
 *   - kein Journal            -> die Datei ist unberuehrt oder fertig. Nichts zu tun.
 *   - Journal unvollstaendig  -> es fiel vor dem ersten Datenbyte; die Datei ist
 *                                unberuehrt. Das Journal faellt weg, sonst nichts.
 *   - Journal vollstaendig    -> die Datei kann zerrissen sein. Kuerzen auf die alte
 *                                Laenge, Stuecke zurueckschreiben, fsync, Journal weg.
 *
 * WER REPARIERT: nur ein Schreiber unter der Sperre - jahrSchreiben zu Beginn, und
 * als Durchgang der Nachlauf, das Holen der Vollsammlung. Ein LESER repariert nie
 * (er haelt keine Sperre); er sieht das Journal, meldet ok:false und der Viewer
 * faellt auf das App-Archiv zurueck. Die Datei liegt eine Runde lang zerrissen -
 * das ist der Preis, und er ist bezahlbar, weil das Archiv additiv ist: kein Byte
 * geht verloren, es wird nur spaeter angehaengt. */
var JOURNAL_SUFFIX = '.journal';
function journalPfad(pfad) { return pfad + JOURNAL_SUFFIX; }
function sha256(buf) { return require('crypto').createHash('sha256').update(buf).digest('hex'); }
/** Ein Stueck einer Datei lesen - ohne sie ganz zu lesen. */
function teilLesen(pfad, pos, laenge) {
  var fd = fs.openSync(pfad, 'r');
  try {
    var buf = Buffer.alloc(laenge);
    var n = fs.readSync(fd, buf, 0, laenge, pos);
    return n === laenge ? buf : buf.slice(0, n);
  } finally { fs.closeSync(fd); }
}
/** Das Journal schreiben und auf die Platte zwingen. Aufbau: eine Kopfzeile JSON,
 *  ein Zeilenumbruch, dann die alten Bytes der Stuecke hintereinander. Die Kopfzeile
 *  traegt Laenge und Pruefsumme der Nutzlast - ein halb geschriebenes Journal ist
 *  daran erkennbar und bedeutet: die Datei wurde noch nicht angefasst.
 *  stuecke: [{ pos, alt: Buffer }] - Rueckgabe: geschriebene Bytes. */
function journalSchreiben(pfad, laenge, schnitt, stuecke) {
  var nutzlast = Buffer.concat(stuecke.map(function (s) { return s.alt; }));
  var kopf = JSON.stringify({ v: 1, datei: path.basename(pfad), laenge: laenge, schnitt: schnitt,
    stuecke: stuecke.map(function (s) { return { pos: s.pos, len: s.alt.length }; }),
    nutzlast: nutzlast.length, sha256: sha256(nutzlast), stand: new Date().toISOString() });
  var kopfBuf = Buffer.from(kopf + '\n', 'utf8');
  var fd = fs.openSync(journalPfad(pfad), 'w');
  try {
    fs.writeSync(fd, kopfBuf, 0, kopfBuf.length, 0);
    if (nutzlast.length) fs.writeSync(fd, nutzlast, 0, nutzlast.length, kopfBuf.length);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  return kopfBuf.length + nutzlast.length;
}
/** Ein Journal lesen und pruefen. { ok:false, grund } heisst: unvollstaendig oder
 *  unlesbar - und damit: die Datei wurde nicht angefasst. */
function journalLesen(jp) {
  var roh;
  try { roh = fs.readFileSync(jp); } catch (e) { return { ok: false, grund: 'Journal nicht lesbar: ' + (e && e.message) }; }
  var nl = roh.indexOf(0x0a);
  if (nl < 0) return { ok: false, grund: 'Journal ohne Kopfzeile - unvollstaendig' };
  var k;
  try { k = JSON.parse(roh.slice(0, nl).toString('utf8')); } catch (e) { return { ok: false, grund: 'Journal-Kopf nicht lesbar' }; }
  if (!k || k.v !== 1 || !Array.isArray(k.stuecke) || typeof k.laenge !== 'number') return { ok: false, grund: 'Journal-Kopf unbekannter Form' };
  var nutz = roh.slice(nl + 1);
  if (nutz.length !== k.nutzlast) return { ok: false, grund: 'Journal unvollstaendig (' + nutz.length + ' von ' + k.nutzlast + ' Bytes)' };
  if (sha256(nutz) !== k.sha256) return { ok: false, grund: 'Journal-Nutzlast passt nicht zur Pruefsumme' };
  var stuecke = [], ab = 0;
  for (var i = 0; i < k.stuecke.length; i++) {
    var s = k.stuecke[i];
    if (typeof s.pos !== 'number' || typeof s.len !== 'number' || ab + s.len > nutz.length) return { ok: false, grund: 'Journal: Stueck ' + i + ' passt nicht' };
    stuecke.push({ pos: s.pos, bytes: nutz.slice(ab, ab + s.len) });
    ab += s.len;
  }
  return { ok: true, kopf: k, stuecke: stuecke };
}
/** Liegt zu dieser Jahresdatei ein Journal, wird der Zustand VOR dem Anhang
 *  wiederhergestellt. Nur unter der Sperre aufrufen. */
function journalReparieren(pfad) {
  var jp = journalPfad(pfad);
  if (!fs.existsSync(jp)) return { ok: true, repariert: false };
  var j = journalLesen(jp);
  if (!j.ok) {
    /* Ein unvollstaendiges Journal fiel VOR dem ersten Datenbyte - die Datei ist
     * unberuehrt. Es faellt weg, damit der naechste Anhang nicht daran haengen bleibt. */
    try { fs.unlinkSync(jp); } catch (e) { /* dann liegt es beim naechsten Mal wieder an */ }
    return { ok: true, repariert: false, unvollstaendig: true, grund: j.grund };
  }
  var fd;
  try { fd = fs.openSync(pfad, 'r+'); }
  catch (e) { return { ok: false, grund: 'Datei zum Reparieren nicht zu oeffnen: ' + (e && e.message) }; }
  try {
    fs.ftruncateSync(fd, j.kopf.laenge);
    for (var i = 0; i < j.stuecke.length; i++) {
      var s = j.stuecke[i];
      if (s.bytes.length) fs.writeSync(fd, s.bytes, 0, s.bytes.length, s.pos);
    }
    fs.fsyncSync(fd);
  } catch (e) {
    return { ok: false, grund: 'Reparatur misslang: ' + (e && e.message) };
  } finally { fs.closeSync(fd); }
  fs.unlinkSync(jp);
  return { ok: true, repariert: true, laenge: j.kopf.laenge, stuecke: j.stuecke.length };
}
/** Alle liegenden Journale eines Rohordners finden - fuer --pruefen (Befund) und
 *  fuer den Durchgang vor einem Lauf. Meta-Dateien (fuehrender Unterstrich) fallen aus. */
function journaleFinden(roh) {
  var aus = [];
  var ordner;
  try { ordner = fs.readdirSync(roh); } catch (e) { return aus; }
  ordner.forEach(function (o) {
    if (o.charAt(0) === '_') return;
    var voll = path.join(roh, o);
    try { if (!fs.statSync(voll).isDirectory()) return; } catch (e) { return; }
    var namen;
    try { namen = fs.readdirSync(voll); } catch (e) { return; }
    namen.forEach(function (n) {
      if (/^\d{4}\.json\.journal$/.test(n)) aus.push(o + '/' + n);
    });
  });
  return aus.sort();
}
/** Ein Durchgang ueber den ganzen Rohordner: jedes liegende Journal zurueckspielen.
 *  Nur unter der Sperre aufrufen (Nachlauf, Vollsammlung). */
function journaleReparieren(roh) {
  var aus = { gefunden: 0, repariert: [], unvollstaendig: [], fehler: [] };
  journaleFinden(roh).forEach(function (rel) {
    aus.gefunden++;
    var pfad = path.join(roh, rel.slice(0, -JOURNAL_SUFFIX.length));
    var r = journalReparieren(pfad);
    if (!r.ok) aus.fehler.push(rel + ': ' + r.grund);
    else if (r.repariert) aus.repariert.push(rel);
    else aus.unvollstaendig.push(rel);
  });
  return aus;
}

/* ================= Den Schwanz einer Jahresdatei lesen ================= */
var MARKE = Buffer.from('],"sitzungen":');
var SCHWANZ_BYTES = 96 * 1024;
function schwanzLesen(pfad, bytes) {
  var fd = fs.openSync(pfad, 'r');
  try {
    var size = fs.fstatSync(fd).size;
    var len = Math.min(size, bytes);
    var buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    return { buf: buf, size: size };
  } finally { fs.closeSync(fd); }
}
/** Was am Ende der Datei steht: der juengste Stempel, die Sitzungsbereiche, das Jahr
 *  und die Byte-Stelle, an der die Reihe endet (dort wird angehaengt). Findet sich die
 *  Marke im Schwanz nicht, wird mehr gelesen - bis zur ganzen Datei. Eine Datei, die
 *  nicht so aussieht wie beschrieben, bekommt {ok:false, grund} und wird NICHT
 *  angefasst: raten waere hier der Weg, eine Reihe zu verstuemmeln.
 *
 *  LIEGT EIN JOURNAL, ist die Datei moeglicherweise zerrissen: der Befund ist dann
 *  {ok:false, journal:true}, und zwar fuer JEDEN Leser - der Viewer faellt darauf
 *  auf das App-Archiv zurueck, ohne die Datei anzufassen. Nur das Gegenlesen des
 *  Anhangs selbst geht mit { ohneJournal: true } daran vorbei; dort liegt das
 *  Journal mit Absicht noch, weil es erst nach dem Gegenlesen faellt. */
function schwanzBefund(pfad, bytes, opt) {
  if (!(opt && opt.ohneJournal) && fs.existsSync(journalPfad(pfad))) {
    return { ok: false, journal: true, grund: 'Reparaturjournal liegt - die Datei ist moeglicherweise zerrissen' };
  }
  bytes = bytes || SCHWANZ_BYTES;
  for (;;) {
    var s;
    try { s = schwanzLesen(pfad, bytes); } catch (e) { return { ok: false, grund: 'nicht lesbar: ' + (e && e.message) }; }
    var buf = s.buf, size = s.size;
    var idx = buf.lastIndexOf(MARKE);
    var kIdx = -1, leer = false;
    if (idx > 0) {
      leer = buf[idx - 1] === 0x5b;   /* '[' - die Reihe ist leer */
      if (!leer) kIdx = buf.lastIndexOf('[', idx - 1);
    }
    if (idx < 0 || (!leer && kIdx < 0)) {
      if (bytes >= size) return { ok: false, grund: 'Marke "sitzungen" oder letzte Kerze nicht gefunden - nicht das Format des Alpaca-Archivs' };
      bytes = Math.min(size, bytes * 4);
      continue;
    }
    var meta;
    try { meta = JSON.parse('{' + buf.slice(idx + 2).toString('utf8')); }
    catch (e) { return { ok: false, grund: 'Schwanz der Datei nicht lesbar (sitzungen/jahr)' }; }
    var letzter = null;
    if (!leer) {
      try { letzter = JSON.parse(buf.slice(kIdx, idx).toString('utf8'))[0]; }
      catch (e) { return { ok: false, grund: 'letzte Kerze nicht lesbar' }; }
      if (typeof letzter !== 'number' || !isFinite(letzter)) return { ok: false, grund: 'letzte Kerze ohne Zahl-Stempel' };
    }
    return { ok: true, letzterStempel: letzter, leer: leer, sitzungen: Array.isArray(meta.sitzungen) ? meta.sitzungen : [],
      jahr: meta.jahr, schnitt: size - buf.length + idx, groesse: size };
  }
}
/** Nur der juengste Stempel einer Jahresdatei - oder null, wenn es sie nicht gibt. */
function letzterStempel(pfad) {
  if (!fs.existsSync(pfad)) return null;
  var b = schwanzBefund(pfad);
  return b.ok ? b.letzterStempel : null;
}

/* ================= Den Kopf an Ort und Stelle nachfuehren ================= */
var KOPF_BYTES = 64 * 1024;
/** Liefert den nachgefuehrten Kopfpuffer UND die Spannen, die sich darin geaendert
 *  haben: je { pos, alt, neu } mit gleicher Laenge (quellen und stand werden nur
 *  gleich lang ersetzt, sonst wird verweigert). Der Anhang an Ort und Stelle schreibt
 *  nur diese Spannen - nicht die ganzen 64 KB - und legt die alten Bytes ins Journal. */
function kopfNachfuehren(pfad, size, neuBis, stand) {
  var fd = fs.openSync(pfad, 'r');
  var buf;
  try {
    var len = Math.min(size, KOPF_BYTES);
    buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, 0);
  } finally { fs.closeSync(fd); }
  var altKopf = Buffer.from(buf);        /* die Bytes, BEVOR etwas ersetzt wird */
  var spannen = [];
  var qi = buf.indexOf('"quellen":[');
  if (qi < 0) return { ok: false, grund: 'Kopf ohne quellen' };
  var qa = qi + '"quellen":'.length;
  var qe = buf.indexOf(']', qa);
  if (qe < 0) return { ok: false, grund: 'Kopf: quellen nicht abgeschlossen' };
  var arr;
  try { arr = JSON.parse(buf.slice(qa, qe + 1).toString('utf8')); } catch (e) { return { ok: false, grund: 'Kopf: quellen nicht lesbar' }; }
  var letzte = null;
  for (var i = arr.length - 1; i >= 0; i--) if (arr[i] && arr[i].quelle === 'alpaca') { letzte = arr[i]; break; }
  if (!letzte) return { ok: false, grund: 'Kopf: kein Quellenbereich alpaca' };
  if (neuBis > letzte.bis) letzte.bis = neuBis;
  var neuText = JSON.stringify(arr);
  if (Buffer.byteLength(neuText, 'utf8') !== qe + 1 - qa) return { ok: false, grund: 'Kopf: quellen liesse sich nicht gleich lang ersetzen' };
  buf.write(neuText, qa, 'utf8');
  spannen.push({ pos: qa, alt: altKopf.slice(qa, qe + 1), neu: Buffer.from(neuText, 'utf8') });
  var si = buf.indexOf('"stand":"');
  if (si >= 0) {
    var sa = si + '"stand":"'.length;
    var se = buf.indexOf('"', sa);
    if (se - sa === stand.length) {
      buf.write(stand, sa, 'utf8');
      spannen.push({ pos: sa, alt: altKopf.slice(sa, se), neu: Buffer.from(stand, 'utf8') });
    } else return { ok: false, grund: 'Kopf: stand liesse sich nicht gleich lang ersetzen' };
  }
  return { ok: true, buf: buf, spannen: spannen };
}

/* ================= DIE Schreibroutine ================= */
var QUELLE_TEXT = 'alpaca v2 stocks/bars, timeframe=1Min, feed=sip, adjustment=raw';

function kerzenPruefen(kerzen, jahr) {
  if (!Array.isArray(kerzen)) return 'kerzen ist keine Liste';
  var g = jahrGrenzen(jahr);
  for (var i = 0; i < kerzen.length; i++) {
    var k = kerzen[i];
    if (!Array.isArray(k) || k.length !== 6 || typeof k[0] !== 'number' || !isFinite(k[0])) return 'Kerze ' + i + ' hat nicht die Form ' + KQ.FELDER;
    if (k[0] < g.von || k[0] > g.bis) return 'Kerze ' + i + ' (' + new Date(k[0]).toISOString() + ') gehoert nicht ins Jahr ' + jahr;
  }
  return null;
}

/** Ein Symbol-Jahr schreiben oder anhaengen.
 *
 *  ordner   der Ordner des Werts (<roh>/<ORDNERNAME>), Aufrufer waehlt die Wurzel
 *  sym      das Kuerzel, wie es in den Rumpf gehoert (die Wahrheit, nicht der Ordnername)
 *  jahr     das ET-Jahr der Datei; jede Kerze muss hineinfallen, sonst wird verweigert
 *  kerzen   [t, schluss, umsatz, hoch, tief, eroeffnung], beliebige Reihenfolge
 *  kal      { 'YYYY-MM-DD': {open, close} } - der Kalender der Quelle
 *  opt      { herkunft }  Text fuer den Kopf einer NEUEN Datei
 *           { abbruchBei } NUR fuer den Test: 'nach-journal' | 'im-schwanz' |
 *                          'vor-journal-loeschen' - wirft dort, wie ein Absturz
 *
 *  Rueckgabe { ok, geschrieben, art:'neu'|'anhang', neu, uebersprungen, letzterStempel,
 *             bytes, pfad, sitzungenZaehler, geschriebenBytes, ms } oder { ok:false, grund }.
 *  `bytes` ist die GROESSE der Datei danach, `geschriebenBytes` die tatsaechlich
 *  geschriebene Menge (Journal + Kopf-Spannen + Schwanz) - die zwei Zahlen liegen beim
 *  Anhang um Groessenordnungen auseinander, und die zweite ist die Last auf der Platte.
 *  Nichts wird geschrieben, wenn keine Kerze neuer ist als der Bestand. */
function jahrSchreiben(ordner, sym, jahr, kerzen, kal, opt) {
  opt = opt || {};
  var t0 = Date.now();
  var fehler = kerzenPruefen(kerzen, jahr);
  if (fehler) return { ok: false, grund: fehler };
  if (!kal || typeof kal !== 'object') return { ok: false, grund: 'ohne Kalender keine Sitzung - nichts geschrieben' };
  /* Sortieren und Doppelte im Eingang selbst wegnehmen (erste gewinnt). */
  var karte = {};
  kerzen.forEach(function (k) { if (karte[k[0]] === undefined) karte[k[0]] = k; });
  var reihe = Object.keys(karte).map(Number).sort(function (a, b) { return a - b; }).map(function (t) { return karte[t]; });
  var pfad = path.join(ordner, jahr + '.json');
  var stand = new Date().toISOString();

  /* Ein Journal aus einem abgebrochenen Anhang wird ZUERST zurueckgespielt - hier,
   * unter der Sperre des Aufrufers, also ohne zweiten Schreiber. Erst danach sagt
   * der Schwanzbefund die Wahrheit ueber den Bestand. */
  var rep = journalReparieren(pfad);
  if (!rep.ok) return { ok: false, grund: 'Reparaturjournal liess sich nicht zurueckspielen: ' + rep.grund, pfad: pfad };

  if (!fs.existsSync(pfad)) {
    if (!reihe.length) return { ok: true, geschrieben: false, art: 'neu', neu: 0, uebersprungen: kerzen.length - reihe.length, letzterStempel: null, pfad: pfad };
    var sitz = sitzungJeKerze(reihe, kal);
    var h = KQ.satz(sym, '1m', reihe, {
      quellen: [{ von: reihe[0][0], bis: reihe[reihe.length - 1][0], quelle: 'alpaca' }],
      waehrung: 'USD',
      quelle: QUELLE_TEXT + (opt.herkunft ? ' (' + opt.herkunft + ')' : ''),
    });
    /* satz() baut die Huelle mit festem Feldsatz; `sitzungen` und `jahr` kommen
     * dahinter - so hat es die Vollsammlung von Anfang an geschrieben. */
    h.sitzungen = sitzungenVerdichten(reihe, sitz);
    h.jahr = jahr;
    var text = JSON.stringify(h);
    atomarSchreiben(pfad, text);
    return { ok: true, geschrieben: true, art: 'neu', neu: reihe.length, uebersprungen: kerzen.length - reihe.length,
      letzterStempel: reihe[reihe.length - 1][0], bytes: text.length, pfad: pfad, sitzungenZaehler: sitzungenZaehlen(sitz),
      geschriebenBytes: Buffer.byteLength(text, 'utf8'), ms: Date.now() - t0 };
  }

  var b = schwanzBefund(pfad);
  if (!b.ok) return { ok: false, grund: b.grund, pfad: pfad };
  if (b.jahr !== undefined && b.jahr !== jahr) return { ok: false, grund: 'Datei traegt Jahr ' + b.jahr + ', verlangt ' + jahr, pfad: pfad };
  var neu = b.leer ? reihe : reihe.filter(function (k) { return k[0] > b.letzterStempel; });
  var uebersprungen = kerzen.length - neu.length;
  if (!neu.length) return { ok: true, geschrieben: false, art: 'anhang', neu: 0, uebersprungen: uebersprungen, letzterStempel: b.letzterStempel, pfad: pfad,
    geschriebenBytes: 0, ms: Date.now() - t0 };
  var sitzNeu = sitzungJeKerze(neu, kal);
  var bereiche = sitzungenAnhaengen(b.sitzungen, neu, sitzNeu);
  var kopf = kopfNachfuehren(pfad, b.groesse, neu[neu.length - 1][0], stand);
  if (!kopf.ok) return { ok: false, grund: kopf.grund, pfad: pfad };
  var schwanz = (b.leer ? '' : ',') + neu.map(function (k) { return JSON.stringify(k); }).join(',') +
    '],"sitzungen":' + JSON.stringify(bereiche) + ',"jahr":' + jahr + '}';
  var schwanzBuf = Buffer.from(schwanz, 'utf8');

  /* 1) JOURNAL VOR DEN DATEN. Alles, was gleich anders wird, wird vorher gesichert:
   *    die zwei Kopf-Spannen und der alte Schwanz ab `schnitt`. fsync, dann erst Daten. */
  var stuecke = kopf.spannen.map(function (s) { return { pos: s.pos, alt: s.alt }; })
    .concat([{ pos: b.schnitt, alt: teilLesen(pfad, b.schnitt, b.groesse - b.schnitt) }]);
  var journalBytes = journalSchreiben(pfad, b.groesse, b.schnitt, stuecke);
  /* Abbruch-Haken: NUR aus dem Test erreichbar (opt.abbruchBei). Ein Wurf hier ist
   * ein Absturz mitten im Anhang - genau der Fall, fuer den das Journal da ist. */
  if (opt.abbruchBei === 'nach-journal') throw new Error('Abbruch-Probe: nach-journal');

  /* 2) DIE DATEN, an Ort und Stelle: nur die Kopf-Spannen (nicht die 64 KB), der neue
   *    Schwanz ab `schnitt`, dann die Laenge setzen und fsync. */
  var kopfBytes = 0;
  var fd = fs.openSync(pfad, 'r+');
  try {
    kopf.spannen.forEach(function (s) { fs.writeSync(fd, s.neu, 0, s.neu.length, s.pos); kopfBytes += s.neu.length; });
    if (opt.abbruchBei === 'im-schwanz') {
      var halb = Math.max(1, Math.floor(schwanzBuf.length / 2));
      fs.writeSync(fd, schwanzBuf, 0, halb, b.schnitt);
      fs.fsyncSync(fd);
      throw new Error('Abbruch-Probe: im-schwanz');
    }
    fs.writeSync(fd, schwanzBuf, 0, schwanzBuf.length, b.schnitt);
    fs.ftruncateSync(fd, b.schnitt + schwanzBuf.length);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }

  /* 3) Gegenlesen, BEVOR das Journal faellt: der Schwanz muss sich lesen lassen wie
   *    der einer frisch geschriebenen Datei. Sonst wird zurueckgespielt. */
  var probe = schwanzBefund(pfad, undefined, { ohneJournal: true });
  if (!probe.ok || probe.letzterStempel !== neu[neu.length - 1][0]) {
    var zurueck = journalReparieren(pfad);
    return { ok: false, pfad: pfad, grund: 'Anhang liess sich nicht gegenlesen: ' + (probe.grund || 'anderer Stempel') +
      (zurueck.repariert ? ' - der Stand vor dem Anhang ist zurueckgespielt' : ' - das Journal blieb liegen: ' + (zurueck.grund || '?')) };
  }
  if (opt.abbruchBei === 'vor-journal-loeschen') throw new Error('Abbruch-Probe: vor-journal-loeschen');
  fs.unlinkSync(journalPfad(pfad));
  return { ok: true, geschrieben: true, art: 'anhang', neu: neu.length, uebersprungen: uebersprungen,
    letzterStempel: neu[neu.length - 1][0], bytes: b.schnitt + schwanzBuf.length, pfad: pfad,
    sitzungenZaehler: sitzungenZaehlen(sitzNeu),
    geschriebenBytes: journalBytes + kopfBytes + schwanzBuf.length, ms: Date.now() - t0 };
}

module.exports = {
  wurzel: wurzel, rohOrdner: rohOrdner, bereinigtOrdner: bereinigtOrdner, massnahmenOrdner: massnahmenOrdner,
  META: META, metaPfad: metaPfad,
  GERAET: GERAET, kurzstempel: kurzstempel, ordnerName: ordnerName, ordnerFuer: ordnerFuer, abbildung: abbildung, jahrDatei: jahrDatei,
  lebenszeitLesen: lebenszeitLesen, lebenszeitDatei: lebenszeitDatei, reiheFuer: reiheFuer, letzterStempelReihe: letzterStempelReihe, protokoll: protokoll,
  nyTeile: nyTeile, nyNachUtc: nyNachUtc, etTag: etTag, jahrGrenzen: jahrGrenzen, jahrVon: jahrVon,
  kerzeAus: kerzeAus, imZeitraum: imZeitraum,
  sitzungJeKerze: sitzungJeKerze, sitzungenVerdichten: sitzungenVerdichten, sitzungenAnhaengen: sitzungenAnhaengen, sitzungenZaehlen: sitzungenZaehlen,
  kalenderLesen: kalenderLesen, kalenderDeckt: kalenderDeckt, kalenderSchreiben: kalenderSchreiben,
  fortschrittLesen: fortschrittLesen, fortschrittSchreiben: fortschrittSchreiben,
  sperreLesen: sperreLesen, sperreSetzen: sperreSetzen, sperreLoesen: sperreLoesen,
  atomarSchreiben: atomarSchreiben, schwanzBefund: schwanzBefund, letzterStempel: letzterStempel,
  /* kopfNachfuehren ist exportiert, damit test-v6.js Abschnitt 85 die ALTE
   * Kopier-Routine als Pruef-Referenz nachbauen kann, ohne die Kopf-Rechnung zu
   * verdoppeln - verglichen wird der Schreibweg, nicht der Inhalt des Kopfes. */
  kopfNachfuehren: kopfNachfuehren,
  JOURNAL_SUFFIX: JOURNAL_SUFFIX, journalPfad: journalPfad, journalLesen: journalLesen,
  journalReparieren: journalReparieren, journaleFinden: journaleFinden, journaleReparieren: journaleReparieren,
  QUELLE_TEXT: QUELLE_TEXT, jahrSchreiben: jahrSchreiben,
};
