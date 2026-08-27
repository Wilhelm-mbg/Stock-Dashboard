'use strict';
/* DIE ABMELDELISTE PFLEGEN - damit der naechste Fall von selbst auffaellt.
 *
 * SEIT DEM 27.08.2026 IST DAS HIER NUR NOCH DIE HUELLE. Die Regeln - Handelsende
 * aus dem Umsatz, Kalender vom Zeugen, Stummel-Test, die vier Befunde - wohnen in
 * abmeldungen.js in der Wurzel. Der Grund: die Pflege soll auch in der App laufen,
 * und tools/ wird nicht ausgeliefert (package.json build.files kennt nur *.js aus
 * der Wurzel). Ein Aufruf von dort waere ins Leere gelaufen, und zwar still.
 * Zwei Fassungen derselben Regel waeren zwei Wahrheiten; dieses Werkzeug und die
 * App rechnen deshalb mit demselben Code. Dasselbe Muster wie kerzenquelle.js.
 *
 * Was hier bleibt, ist das, was ein BEFEHL braucht und die App nicht: der
 * Quellabruf ueber das Netz, die Ausgabe fuer Menschen und die Entscheidung, ob
 * geschrieben wird.
 *
 * Der Anlass (27.08.2026): TWO hoerte am 24.08. auf zu handeln und fiel nur als
 * Nebenbefund einer fremden Zaehlung auf. Die einzige Liste im Haus war ein
 * Schnappschuss der Schnittstelle, und ihr Datum war das LISTENdatum, nicht das
 * Handelsende: AVB steht dort mit 18.08., die letzte echte Kerze traegt den 14.08.
 *
 * Aufruf:  node tools/abmeldungen-pflegen.js             (zaehlen und anzeigen)
 *          node tools/abmeldungen-pflegen.js --schreiben (Ablage aktualisieren)
 * Ablage:  <Downloads>/Markt-Dashboard-Daten/massive/abmeldungen.json */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');
var A = require('../abmeldungen.js');
var Q = require('../kerzenquelle.js');

Q.datenOrdnerSetzen(path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten'));

var SCHNAPPSCHUSS = path.join(Q.datenOrdnerSetzen(), 'massive', 'verschwundene.json');
var SCHREIBEN = process.argv.indexOf('--schreiben') !== -1;

/* 10 Jahre statt 1 Monat: dieselbe Antwort traegt dann BEIDE Auskuenfte - ob nach
 * dem Handelsende noch Umsatz kam UND wie tief die Quelle die Historie ueberhaupt
 * noch fuehrt (der Stummel-Test braucht die Tiefe). */
function holeQuelle(sym) {
  return new Promise(function (resolve) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?range=10y&interval=1d&includePrePost=false';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var buf = '';
      res.on('data', function (d) { buf += d; });
      res.on('end', function () {
        if (res.statusCode !== 200) return resolve({ ok: false, grund: 'HTTP ' + res.statusCode });
        var j;
        try { j = JSON.parse(buf).chart.result[0]; } catch (e) { return resolve({ ok: false, grund: 'unlesbar' }); }
        var ts = (j && j.timestamp) || [];
        var vol = (j && j.indicators.quote[0] && j.indicators.quote[0].volume) || [];
        var kerzen = [];
        for (var i = 0; i < ts.length; i++) kerzen.push({ zeit: ts[i] * 1000, umsatz: vol[i] || 0 });
        resolve({ ok: true, kerzen: kerzen });
      });
    }).on('error', function (e) { resolve({ ok: false, grund: String(e.message) }); });
  });
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

(async function () {
  var gelesen = A.reihenLesen();
  /* LEER IST KEIN BEFUND. "0 Abmeldungen" und "nichts zu durchsuchen" sind von
   * aussen ununterscheidbar - und die Verwechslung macht aus "wir wissen nichts"
   * ein "alles in Ordnung". */
  if (gelesen.leer) {
    console.error('Kein Tagesarchiv zu durchsuchen - es wird NICHTS gepflegt und nichts behauptet.');
    console.error('  ' + gelesen.grund);
    process.exit(2);
  }
  console.log('Tagesarchiv: ' + Object.keys(gelesen.reihen).length + ' Reihen (' + gelesen.ordner + ').');

  var kal = A.zeugenKalender();
  if (kal.leer) { console.error(kal.grund); process.exit(2); }
  console.log('Kalender-Zeuge: ' + kal.zeuge + ', juengster Handelstag ' + kal.juengster + '.');

  var auff = A.auffaellige(gelesen.reihen, kal.tage);
  console.log('Auffaellig (Handelsende >= ' + A.RUECKSTAND_AB + ' Handelstage zurueck): ' + auff.length + '\n');
  if (auff.length > A.QUELLE_HOECHSTENS) {
    console.error('Das sind zu viele fuer Abmeldungen (' + auff.length + ' > ' + A.QUELLE_HOECHSTENS + ') - ' +
      'so viele Reihen melden sich nicht gleichzeitig ab. Das sieht nach einem Archiv- oder ' +
      'Nachladeproblem aus; erst DAS klaeren, dann wiederkommen. Es wird nichts geschrieben.');
    process.exit(1);
  }

  /* Schnappschuss der Schnittstelle nur zum Abgleich lesen (nie schreiben). */
  var listeBis = {};
  try {
    (JSON.parse(fs.readFileSync(SCHNAPPSCHUSS, 'utf8')).eintraege || []).forEach(function (e) {
      if (e.sym && e.bis) listeBis[e.sym] = e.bis;
    });
  } catch (e) { /* ohne Schnappschuss geht es auch - dann bleibt die Spalte leer */ }

  for (var i = 0; i < auff.length; i++) {
    var a = auff[i];
    var q = await holeQuelle(a.sym);
    await schlaf(350);
    a.listeBis = listeBis[a.sym] || null;
    a.quelleGeprueftAm = kal.juengster;
    var b = A.befundAusQuelle(a, gelesen.reihen[a.sym], q);
    a.befund = b.befund;
    a.quelleDetail = b.detail;
    a.quelleKerzen = b.quelleKerzen != null ? b.quelleKerzen : null;
    a.quelleErsteTag = b.quelleErsteTag || null;
  }

  var vorher = A.ablageLesen();
  var v = A.veraenderung(auff, (vorher && vorher.eintraege) || []);

  console.log('Sym     Handelsende  Rueckst.  Stempel  Liste-bis    Befund');
  auff.forEach(function (a) {
    console.log(a.sym.padEnd(8) + a.handelsende + '   ' + String(a.rueckstand).padStart(4) + '     ' +
      String(a.stempelSchwanz).padStart(4) + '    ' + String(a.listeBis || '-').padEnd(11) + '  ' +
      a.befund + '  [' + a.quelleDetail + ']' + (v.neu.indexOf(a.sym) !== -1 ? '  << NEU' : ''));
  });
  if (v.neu.length) console.log('\nNEU seit der letzten Fahrt: ' + v.neu.join(', '));
  if (v.gedreht.length) console.log('BEFUND GEDREHT: ' + v.gedreht.join('; '));
  if (v.wieder.length) console.log('\n!!! FRUEHER ABGEMELDET, JETZT WIEDER UNAUFFAELLIG: ' + v.wieder.join(', ') +
    ' - eine Abmeldung kehrt nicht zurueck; das Archiv oder die fruehere Einstufung stimmt nicht.');

  if (!SCHREIBEN) { console.log('\n(Nur gezaehlt. Schreiben mit --schreiben.)'); return; }
  var ziel = A.ablageSchreiben({
    stand: new Date().toISOString(),
    hinweis: 'Handelsende = letzte Kerze mit Umsatz im Tagesarchiv, NIE das Listendatum der Schnittstelle. ' +
      'Gepflegt ueber abmeldungen.js; der Schnappschuss massive/verschwundene.json bleibt unberuehrt.',
    kalenderZeuge: kal.zeuge,
    juengsterHandelstag: kal.juengster,
    eintraege: auff
  });
  console.log('\nGeschrieben: ' + ziel + ' (' + auff.length + ' Eintraege).');
})();
