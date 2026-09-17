'use strict';
/* Schritt 1 der Fundamentaltafel: je Quartal den Auszug aus sub.txt und num.txt ziehen.
 *
 * Aus sub.txt: alle periodischen Berichte ALLER Registranten (10-K/10-Q-Familie in die Tafel, 20-F/40-F nur zum Zaehlen).
 * Aus num.txt: fuer diese Einreichungen die Zeilen der Zieltags (zuordnung.js), nur Konzernwert (segments leer,
 * coreg leer), ALLE Stichtage (ddate) und Dauern (qtrs) - die Vergleichszahlen frueherer Quartale braucht der Bau fuer
 * die 4-Quartals-Summen und die Neudarstellungs-Zaehlung. Einheit (uom) bleibt stehen, Fremdwaehrung filtert der Bau.
 *
 * Schreibt nach E:/Markt-Dashboard-Archiv/edgar-fsds/auszug/<q>-sub.tsv, <q>-num.tsv (Tab, Kopfzeile, Dateireihenfolge
 * der Quelle - deterministisch) und <q>-auszug.json (Zaehler). Erst .teil, dann umbenannt.
 * Aufruf: node auszug.js [--neu] [--quartale 2016q1,2016q2]
 */
var fs = require('fs');
var path = require('path');
var L = require('./fsds-lesen.js');
var Z = require('./zuordnung.js');

var AUSZUG = path.join(L.WURZEL, 'auszug');
/* instance = Name der XBRL-Instanz (z. B. amd-20240330_htm.xml): traegt den ECHTEN Periodenstichtag, den FSDS in
 * `period` auf das Monatsende rundet - damit laesst sich der Anteil der Rundung messen. */
var SUB_FELDER = ['adsh', 'cik', 'name', 'sic', 'form', 'period', 'fy', 'fp', 'filed', 'accepted', 'prevrpt', 'afs', 'fye', 'countryba', 'instance'];
var NUM_FELDER = ['adsh', 'tag', 'version', 'ddate', 'qtrs', 'uom', 'value'];

function groesse(p) { try { return fs.statSync(p).size; } catch (e) { return -1; } }

async function quartal(q) {
  var t0 = Date.now();
  var subZiel = path.join(AUSZUG, q + '-sub.tsv'), numZiel = path.join(AUSZUG, q + '-num.tsv');
  var formen = {}, adsh = {}, nSub = 0, nBehalten = 0;
  var subZeilen = [SUB_FELDER.join('\t')];
  await L.tabelle(q, 'sub', function (s) {
    nSub++;
    var art = Z.FORM_ART[s.form];
    if (!art) return;
    formen[s.form] = (formen[s.form] || 0) + 1;
    adsh[s.adsh] = 1; nBehalten++;
    subZeilen.push(SUB_FELDER.map(function (f) { return (s[f] || '').replace(/[\t\r\n]/g, ' '); }).join('\t'));
  });
  fs.writeFileSync(subZiel + '.teil', subZeilen.join('\n') + '\n');
  fs.renameSync(subZiel + '.teil', subZiel);

  var out = fs.createWriteStream(numZiel + '.teil');
  out.write(NUM_FELDER.join('\t') + '\n');
  var nNum = 0, nZiel = 0, nSegment = 0, puffer = [], uoms = {};
  var nNumGesamt = await L.tabelle(q, 'num', function (n) {
    nNum++;
    if (!Z.TAG_GRUPPE[n.tag] || !adsh[n.adsh]) return;
    if (n.segments || n.coreg) { nSegment++; return; }
    nZiel++;
    uoms[n.uom] = (uoms[n.uom] || 0) + 1;
    puffer.push([n.adsh, n.tag, n.version, n.ddate, n.qtrs, n.uom, n.value].join('\t'));
    if (puffer.length >= 5000) { out.write(puffer.join('\n') + '\n'); puffer = []; }
  });
  if (puffer.length) out.write(puffer.join('\n') + '\n');
  await new Promise(function (ok, nein) { out.on('finish', ok); out.on('error', nein); out.end(); });
  fs.renameSync(numZiel + '.teil', numZiel);
  var stand = { quartal: q, subZeilen: nSub, periodisch: nBehalten, formen: formen, numZeilen: nNumGesamt, zielzeilen: nZiel, segmentzeilenVerworfen: nSegment,
    uom: uoms, subBytes: groesse(subZiel), numBytes: groesse(numZiel), quelleSubBytes: groesse(L.pfad(q, 'sub')), quelleNumBytes: groesse(L.pfad(q, 'num')), sekunden: Math.round((Date.now() - t0) / 10) / 100 };
  fs.writeFileSync(path.join(AUSZUG, q + '-auszug.json'), JSON.stringify(stand, null, 1));
  console.log(q, 'periodisch', nBehalten, 'zielzeilen', nZiel, 'von', nNumGesamt, 'in', stand.sekunden, 's');
  return stand;
}

async function main() {
  var neu = false, nur = null;
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--neu') neu = true;
    else if (process.argv[i] === '--quartale') nur = process.argv[++i].split(',');
    else if (process.argv[i] === '--ziel') AUSZUG = process.argv[++i];   /* fuer die Determinismus-Probe: Zweitauszug in einen anderen Ordner */
  }
  if (!fs.existsSync(AUSZUG)) fs.mkdirSync(AUSZUG, { recursive: true });
  var qs = L.quartale().filter(function (q) { return !nur || nur.indexOf(q) >= 0; });
  for (var k = 0; k < qs.length; k++) {
    var q = qs[k];
    if (groesse(L.pfad(q, 'num')) <= 0) { console.log(q, 'num.txt fehlt - uebersprungen'); continue; }
    if (!neu && groesse(path.join(AUSZUG, q + '-num.tsv')) > 0 && groesse(path.join(AUSZUG, q + '-sub.tsv')) > 0) { console.log(q, 'Auszug vorhanden'); continue; }
    await quartal(q);
  }
}
main().catch(function (e) { console.error(e); process.exit(1); });
