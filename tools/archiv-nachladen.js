'use strict';
/* ================= NAECHTLICHES NACHLADEN DER KURSARCHIVE =================
 *
 * Ein Befehl fuer die geplante Aufgabe: beide Archive nachziehen, danach pruefen, und
 * bei einem Befund NICHT schweigen. Seit dem 27.08. pflegt der Lauf danach auch die
 * Abmeldeliste (tools/abmeldungen-pflegen.js) - aber nur bei benutzbarem Archiv.
 *
 * WARUM ES DIESE DATEI GIBT statt drei Zeilen in der Aufgabe. Das Verhalten im
 * Alarmfall ist der wichtigste Teil, und was in einer Aufgabenzeile steht, laesst sich
 * nicht erproben. Am 26.08.2026 stand das Archiv zwei Tage still, weil ein Lauf, der
 * nichts dazulernt, von aussen aussieht wie ein gesunder Lauf. Eine Aufgabe, deren
 * Alarmweg nie ausprobiert wurde, waere derselbe Fehler in neuer Kleidung.
 *
 * DAUER: rund 97 Minuten JE ARCHIV, zusammen etwa 3 Stunden 20. Das ist kein
 * Einstellungsproblem, sondern die Bauart: der abgefragte Zeitraum steht je Intervall
 * fest (730 Tage bzw. 40 Jahre), einen inkrementellen Modus gibt es nicht. Ein Lauf,
 * der einen einzigen Tag nachholt, kostet genauso viel wie der erste.
 *
 * WAEHREND DES LAUFS setzt das Abrufwerkzeug eine Sperre im Archivordner. Wer in dieser
 * Zeit misst, misst auf einem GEMISCHTEN Archiv - halb neu, halb alt -, und das sieht
 * gesund aus. Der Wachhund antwortet dann mit Exit 2 statt mit einem Urteil.
 *
 * Aufruf:
 *   node tools/archiv-nachladen.js                nachladen und pruefen
 *   node tools/archiv-nachladen.js --nurpruefen   nur pruefen (fuer die Erprobung)
 *
 * Exit 0: beide Archive frisch. Liegt dabei eine VERWAISTE Sperre, wird trotzdem eine
 *         Hinweisdatei geschrieben - dann ist zwar das Archiv in Ordnung, aber ein
 *         frueherer Lauf ist gestorben, und das darf nicht nur auf einer Konsole
 *         stehen, die nachts niemand liest.
 * Exit 1: Rueckstand ab zwei Handelstagen - Alarmdatei geschrieben.
 * Exit 2: nicht pruefbar (Ordner fehlt, Sperre liegt) - Alarmdatei geschrieben.
 *
 * Der Alarm landet als datierte Datei im Datenordner der App:
 *     <Downloads>/Markt-Dashboard-Daten/archiv-alarm-JJJJ-MM-TT.txt
 * Von dort liest ihn der Projekt-Manager bei seinem naechsten Durchgang und meldet ihn
 * Wilhelm im Klartext. Bewusst kein Issue und keine Anzeige in der App: so entsteht kein
 * zweites System, und der Weg endet bei einem Menschen statt in einer Liste.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');
var Wachhund = require('./archiv-wachhund.js');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var WURZEL = path.join(__dirname, '..');
var nurPruefen = process.argv.indexOf('--nurpruefen') !== -1;

function jetztText() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function sagen(z) { console.log(z); ZEILEN.push(z); }
var ZEILEN = [];

function hole(intervall) {
  sagen('[' + jetztText() + '] ' + intervall + ' nachladen ...');
  var r = cp.spawnSync(process.execPath,
    [path.join(WURZEL, 'tools', 'yahoo-60m-holen.js'), 'alle', '--aktualisieren'],
    { cwd: WURZEL, encoding: 'utf8', env: Object.assign({}, process.env, { MD_INTERVALL: intervall }),
      maxBuffer: 64 * 1024 * 1024 });
  /* Nur die letzten Zeilen ins Protokoll - der Lauf druckt eine Zeile je Wert. */
  var aus = String(r.stdout || '').trim().split('\n').slice(-6).join('\n');
  sagen(aus);
  if (r.status !== 0) sagen('  ACHTUNG: Abruf endete mit Code ' + r.status);
  return r.status === 0;
}

var abrufOk = true;
if (!nurPruefen) {
  abrufOk = hole('60m') && abrufOk;
  abrufOk = hole('1d') && abrufOk;
} else {
  sagen('[' + jetztText() + '] nur pruefen, kein Abruf.');
}

/* ---------- Die Abnahme ---------- */
var schlimm = 0, unpruefbar = 0, verwaist = 0;
['archiv60m', 'archiv1d'].forEach(function (nm) {
  var b = Wachhund.pruefe(Wachhund.ordnerVon(nm) || nm, {});
  sagen(Wachhund.textZu(b));
  if (b.gesperrt || b.grund) unpruefbar++;
  else if (!b.ok) schlimm++;
  if (b.verwaisteSperre) verwaist++;
});

var code = schlimm ? 1 : (unpruefbar ? 2 : 0);
if (!abrufOk && code === 0) code = 2;   // Abruf gescheitert, Archiv zufaellig noch frisch

/* ---------- Die Abmeldeliste (PM-Entscheid 27.08.: der Nachtlauf faehrt sie,
 * keine Nachtrolle - Rollen koennen ausfallen, dieser Lauf fasst das Archiv
 * ohnehin an). NUR bei benutzbarem Archiv: auf einem haengenden Stand saehe
 * jede Reihe stillstehend aus, und die Liste wuerde Unsinn lernen. Befunde
 * (neue Abmeldung, gedrehter Befund, Wiederauferstehung) landen als datierte
 * Datei im Datenordner - derselbe Leseweg wie die Archiv-Alarme, denn ein
 * Befund, der nur auf einer Nacht-Konsole steht, findet keinen Leser. ---------- */
if (code === 0 && !nurPruefen) {
  sagen('[' + jetztText() + '] Abmeldeliste pflegen ...');
  var ab = cp.spawnSync(process.execPath,
    [path.join(WURZEL, 'tools', 'abmeldungen-pflegen.js'), '--schreiben'],
    { cwd: WURZEL, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  var abAus = String(ab.stdout || '').trim();
  var wichtig = abAus.split('\n').filter(function (z) {
    return /NEU seit der letzten Fahrt|BEFUND GEDREHT|WIEDER UNAUFFAELLIG/.test(z);
  });
  sagen(abAus.split('\n').slice(-3).join('\n'));
  if (ab.status !== 0) wichtig.push('Die Pflege endete mit Code ' + ab.status +
    ' - Deckel angeschlagen oder Fehler, von Hand ansehen: node tools/abmeldungen-pflegen.js');
  if (wichtig.length) {
    var zielAb = path.join(DATEN, 'abmeldungen-' + new Date().toISOString().slice(0, 10) + '.txt');
    try {
      fs.mkdirSync(DATEN, { recursive: true });
      fs.writeFileSync(zielAb, 'ABMELDUNGEN  ' + jetztText() + '\n' + wichtig.join('\n') + '\n\n' + abAus + '\n', 'utf8');
      sagen('Abmelde-Hinweis geschrieben: ' + zielAb);
    } catch (e) { sagen('Abmelde-Hinweis NICHT schreibbar: ' + (e && e.message)); }
  }
} else if (code !== 0) {
  sagen('Abmeldeliste NICHT gepflegt - das Archiv ist nicht benutzbar, die Liste wuerde Unsinn lernen.');
}

/* EINE VERWAISTE SPERRE IST EIGENS MELDENSWERT, auch wenn das Archiv frisch ist:
 * irgendwo ist ein Nachladelauf gestorben. Der Rueckgabewert bleibt trotzdem 0 - er
 * beantwortet die Frage "ist das Archiv benutzbar", und das ist es. Die Datei wird
 * aber geschrieben, sonst faende der Absturz gar keinen Leser. Genau diese Luecke war
 * beim Erproben am 26.08.2026 uebrig: Rueckstand null, Exit 0, und der abgestuerzte
 * Lauf stand nur auf einer Konsole, die nachts niemand liest. */
if (code !== 0 || verwaist) {
  /* SCHWEIGEN WAERE DER FEHLER VON HEUTE IN NEUER KLEIDUNG. Die Datei traegt das Datum,
   * damit ein Alarm von gestern nicht wie einer von heute aussieht. */
  var ziel = path.join(DATEN, 'archiv-alarm-' + new Date().toISOString().slice(0, 10) + '.txt');
  var kopf = (code === 0 ? 'ARCHIV-HINWEIS' : 'ARCHIV-ALARM') + '  ' + jetztText() + '  (Code ' + code + ')\n' +
    (code === 1 ? 'Ein Archiv steht mindestens zwei Handelstage zurueck.\n'
     : code === 2 ? 'Ein Archiv liess sich nicht pruefen - Ordner fehlt, Sperre liegt, oder der Abruf scheiterte.\n'
     : 'Die Archive sind frisch, ABER: ein frueherer Nachladelauf ist abgestuerzt und hat seine Sperre liegengelassen.\n') +
    'Nachziehen von Hand:  node tools/archiv-nachladen.js\n\n';
  try {
    fs.mkdirSync(DATEN, { recursive: true });
    fs.writeFileSync(ziel, kopf + ZEILEN.join('\n') + '\n', 'utf8');
    console.log('\n' + (code === 0 ? 'Hinweis' : 'Alarm') + ' geschrieben: ' + ziel);
  } catch (e) {
    console.error('\nAlarmdatei NICHT schreibbar (' + (e && e.message) + ') - der Befund steht nur hier.');
  }
} else {
  console.log('\nBeide Archive frisch. Kein Alarm.');
}
process.exit(code);
