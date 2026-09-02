'use strict';
/* ================= Zugang zur Alpaca-Kurstafel — die EINZIGE Stelle =================
 *
 * Warum es diese Datei gibt: Der Zugang liegt ausschliesslich in Wilhelms Umgebung. Kein
 * Skript dieser Studie darf ihn ausgeben, in eine Datei schreiben, in eine Adresse haengen
 * oder an eine Fehlermeldung heften. Damit das PRUEFBAR ist, statt nur behauptet, sind die
 * beiden Umgebungsnamen in genau EINER Datei genannt — dieser. Alle anderen Dateien der
 * Studie rufen kopfzeilen() und verdecken() auf und kennen die Namen gar nicht.
 *
 * Die Klinke in test-v6.js prueft daraufhin zwei Dinge, und zwar an der VERWENDUNG, nicht
 * am Text (wiki/fehlerformen.md, "Testmarken-Falle"):
 *   (a) Struktur: ausserhalb dieser Datei liest kein Skript der Studie process.env.
 *   (b) Verhalten: ein Lauf mit erfundenen Zugangswerten gegen einen Server, der die
 *       Kopfzeilen zurueckspiegelt, darf die Werte in KEINER Ausgabe und in KEINER
 *       geschriebenen Datei hinterlassen. Das ist der eigentliche Test — er faellt auch
 *       dann, wenn jemand die Struktur umgeht.
 *
 * verdecken() ist die Notbremse fuer den boesen Fall: Antwortruempfe und Fehlertexte
 * fremder Server koennen Kopfzeilen enthalten. Vorbild: ohneGeheimnis() in alpaca.js.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var E = process.env;
var ZUGANG = { id: typeof E.ALPACA_KEY === 'string' ? E.ALPACA_KEY : '',
               geheim: typeof E.ALPACA_SECRET === 'string' ? E.ALPACA_SECRET : '' };

/** Sind beide Werte gesetzt? Sagt NUR ja/nein, nie was drinsteht. */
function vorhanden() { return !!(ZUGANG.id && ZUGANG.geheim); }

/** Welcher der beiden fehlt — als Name, damit die Anleitung brauchbar ist. Der Name
 *  einer Umgebungsvariablen ist kein Geheimnis, ihr Inhalt ist eines. */
function fehlend() {
  var f = [];
  if (!ZUGANG.id) f.push('ALPACA_KEY');
  if (!ZUGANG.geheim) f.push('ALPACA_SECRET');
  return f;
}

/** Die Kopfzeilen fuer data.alpaca.markets. Wandert direkt in fetch(), sonst nirgends. */
function kopfzeilen() {
  return { 'APCA-API-KEY-ID': ZUGANG.id, 'APCA-API-SECRET-KEY': ZUGANG.geheim };
}

/** Jeder Text, der die Studie verlaesst — Bildschirm wie Datei —, laeuft hier durch.
 *  Kurze Werte (< 4 Zeichen) werden bewusst NICHT ersetzt: sie kaemen als Teilzeichenkette
 *  ueberall vor und wuerden die Ausgabe unlesbar machen; ein echter Alpaca-Zugang ist
 *  20 Zeichen lang. */
function verdecken(text) {
  var t = String(text == null ? '' : text);
  if (ZUGANG.id && ZUGANG.id.length >= 4) t = t.split(ZUGANG.id).join('[Zugang]');
  if (ZUGANG.geheim && ZUGANG.geheim.length >= 4) t = t.split(ZUGANG.geheim).join('[Geheimnis]');
  return t;
}

/** Nur fuer den Selbsttest: Zugangswerte erfinden, um die Verdeckung zu pruefen.
 *  Aendert nichts an der Umgebung und laesst sich nicht rueckgaengig machen — der
 *  Selbsttest laeuft in einem eigenen Prozess. */
function testZugangSetzen(id, geheim) { ZUGANG.id = String(id || ''); ZUGANG.geheim = String(geheim || ''); }

module.exports = { vorhanden: vorhanden, fehlend: fehlend, kopfzeilen: kopfzeilen,
                   verdecken: verdecken, testZugangSetzen: testZugangSetzen };
