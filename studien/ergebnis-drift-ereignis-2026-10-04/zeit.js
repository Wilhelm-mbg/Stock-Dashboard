'use strict';
/* Zeit: Annahmezeit der SEC -> New Yorker Ortszeit -> Tageszeit -> Einstiegstag (Auftrag M2, §5.2).
 *
 * Zwei Lesarten des Felds `acceptanceDateTime` der Einreichungslisten (Form "2024-01-31T21:05:23.000Z"):
 *   'utc'  - die Kennzeichnung "Z" stimmt: umrechnen nach America/New_York mit der Sommer-/Winterzeit des Tages
 *            (Intl.DateTimeFormat, kein fester Versatz).
 *   'ort'  - die Ziffern SIND schon New Yorker Ortszeit, das "Z" waere eine falsche Kennzeichnung.
 * Welche gilt, entscheidet NICHT dieser Code, sondern die Zeitpruefung an zehn Meldungen gegen <ACCEPTANCE-DATETIME>
 * im Kopf der Einreichung (zeitpruefung.js); das Ergebnis steht in zeitpruefung.json und wird von dort gelesen.
 *
 * Kalender: { tage: [ISO...] aufsteigend, idx: {ISO: i}, close: {ISO: {open, close}} } - die Form von K.kalender() des Pruefstands.
 */
var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

var FORM = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/;

function sek(h, m, s) { return (+h) * 3600 + (+m) * 60 + (+s); }

/** Weltzeit-Text -> New Yorker Ortszeit {datum, zeit, sek}; null, wenn der Text nicht die erwartete Form hat. */
function nyAusUtc(text) {
  if (!FORM.test(String(text))) return null;
  var ms = Date.parse(text);
  if (!isFinite(ms)) return null;
  var p = {};
  NY.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  return { datum: p.year + '-' + p.month + '-' + p.day, zeit: p.hour + ':' + p.minute + ':' + p.second, sek: sek(p.hour, p.minute, p.second) };
}

/** Die Ziffern des Texts als Ortszeit gelesen (Lesart 'ort'). */
function nyAusZiffern(text) {
  var m = FORM.exec(String(text));
  if (!m) return null;
  return { datum: m[1] + '-' + m[2] + '-' + m[3], zeit: m[4] + ':' + m[5] + ':' + m[6], sek: sek(m[4], m[5], m[6]) };
}

function nyZeit(text, lesart) {
  if (lesart === 'utc') return nyAusUtc(text);
  if (lesart === 'ort') return nyAusZiffern(text);
  throw new Error('Lesart muss utc oder ort sein: ' + lesart);
}

/** Kopf einer Einreichung: <ACCEPTANCE-DATETIME>JJJJMMTThhmmss (New Yorker Ortszeit) -> {datum, zeit, sek}. */
function nyAusKopf(text) {
  var m = /<ACCEPTANCE-DATETIME>\s*(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(String(text));
  if (!m) return null;
  return { datum: m[1] + '-' + m[2] + '-' + m[3], zeit: m[4] + ':' + m[5] + ':' + m[6], sek: sek(m[4], m[5], m[6]) };
}

/** Index des ersten Kalendertags >= datum (binaer); kal.tage.length, wenn keiner. */
function ersterTagAb(kal, datum) {
  var lo = 0, hi = kal.tage.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (kal.tage[m] < datum) lo = m + 1; else hi = m; }
  return lo;
}

function schlussSek(kal, datum) {
  var c = kal.close && kal.close[datum] && kal.close[datum].close;
  var m = /^(\d{2}):(\d{2})$/.exec(c || '');
  return m ? sek(m[1], m[2], 0) : 16 * 3600;
}

/** Tageszeit der Meldung: 'vor' (vor 09:30:00), 'im' (09:30:00 bis vor Handelsschluss), 'nach' (ab Handelsschluss, 16:00:00
 *  bzw. 13:00:00 an verkuerzten Tagen), 'frei' (kein Handelstag). Die Grenzen sind halboffen: 09:30:00 ist 'im', 16:00:00 ist 'nach'. */
function tageszeit(ny, kal, handelsbeginnSek) {
  if (!(ny.datum in kal.idx)) return 'frei';
  if (ny.sek < handelsbeginnSek) return 'vor';
  if (ny.sek < schlussSek(kal, ny.datum)) return 'im';
  return 'nach';
}

/** Einstiegstag = Index des ersten Handelstags, an dessen EROEFFNUNG die Meldung schon bekannt war:
 *  vor 09:30:00 an einem Handelstag -> derselbe Tag; sonst der naechste Handelstag. -1, wenn der Kalender endet. */
function einstiegstag(ny, kal, handelsbeginnSek) {
  var i = ersterTagAb(kal, ny.datum);
  if (i >= kal.tage.length) return -1;
  if (kal.tage[i] === ny.datum && ny.sek >= handelsbeginnSek) i++;
  return i < kal.tage.length ? i : -1;
}

module.exports = { nyAusUtc: nyAusUtc, nyAusZiffern: nyAusZiffern, nyZeit: nyZeit, nyAusKopf: nyAusKopf,
  ersterTagAb: ersterTagAb, tageszeit: tageszeit, einstiegstag: einstiegstag, schlussSek: schlussSek, FORM: FORM };
