'use strict';
/* ================= Testvergleich: ist der volle Lauf derselbe geblieben? =================
 *
 * Gegenprobe fuer Umbauten an test-v6.js, die an keiner Pruefung etwas aendern sollen
 * (z. B. der Abschnitts-Laeufer, tools/testlaeufer.js). Verglichen wird die Ausgabe
 * zweier voller Laeufe - "vorher" und "nachher":
 *
 *   node test-v6.js > vorher-1.txt ; node test-v6.js > vorher-2.txt   (alter Stand)
 *   node test-v6.js > nachher.txt                                      (neuer Stand)
 *   node tools/testvergleich.js vorher-1.txt nachher.txt --rauschen vorher-2.txt [vorher-3.txt ...]
 *
 * Zwei Laeufe DESSELBEN Stands sind nicht zeichengleich, und das ist kein Fehler:
 *   - Zufallsordner (fs.mkdtemp: ...\Temp\sammler-test-DwAPki\...) heissen jedes Mal anders,
 *   - einige Pruefungen haengen Messwerte an (Laufzeit in ms, Prozessnummer, Zufallszahlen),
 *   - asynchrone Abschnitte schreiben verschraenkt, die Reihenfolge am Ende wechselt.
 * Was davon Rauschen ist, wird nicht geraten, sondern GEMESSEN: Mit --rauschen gilt nur
 * als Rauschen, was sich zwischen zwei Laeufen des ALTEN Stands unterscheidet:
 *   - Zufallsordner werden immer zu ...-XXXXXX,
 *   - der Anhang "  [...]" einer Pruefung wird nur dort ausgeblendet, wo er schon
 *     zwischen vorher-1 und vorher-2 wechselte,
 *   - die Reihenfolge muss bis zur ersten Stelle gleich sein, an der sich vorher-1 und
 *     vorher-2 in der Reihenfolge unterscheiden; danach zaehlt die Menge der Zeilen.
 * Ohne --rauschen wird nur der Zufallsordner ausgeblendet und streng verglichen.
 *
 * Rueckgabewert 0 = gleich (bis auf gemessenes Rauschen), 1 = verschieden, 2 = Aufruf. */
const fs = require('fs');

/* Zufallsordner aus fs.mkdtemp: Praefix mit Bindestrich, dann sechs Zeichen. */
function ordnerNormal(zeile) {
  if (!/Temp|tmp/i.test(zeile)) return zeile;
  return zeile.replace(/((?:\\\\|\\|\/)[\w.]+(?:-[\w.]+)*-)[A-Za-z0-9]{6}(?=\\\\|\\|\/|"|'|\]|\s|$)/g, '$1XXXXXX');
}

/* "  ✅ name  [anhang]" -> { name, anhang }. Nur der LETZTE Anhang am Zeilenende zaehlt. */
function zerlegen(zeile) {
  const m = /^(.*?)  \[(.*)\]$/.exec(zeile);
  return m ? { name: m[1], anhang: m[2] } : { name: zeile, anhang: null };
}

function zeilen(text) { return String(text).replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n').map(ordnerNormal); }

/* Namen, deren Anhang zwischen zwei Laeufen desselben Stands wechselt. */
function wechselndeAnhaenge(a, b) {
  const nachName = function (zs) {
    const m = new Map();
    zs.forEach(function (z) {
      const t = zerlegen(z);
      if (t.anhang === null) return;
      if (!m.has(t.name)) m.set(t.name, []);
      m.get(t.name).push(t.anhang);
    });
    return m;
  };
  const ma = nachName(a), mb = nachName(b);
  const wechselnd = new Set();
  ma.forEach(function (liste, name) {
    const andere = mb.get(name) || [];
    if (liste.slice().sort().join('\u0000') !== andere.slice().sort().join('\u0000')) wechselnd.add(name);
  });
  mb.forEach(function (liste, name) { if (!ma.has(name)) wechselnd.add(name); });
  return wechselnd;
}

function maske(zs, wechselnd) {
  return zs.map(function (z) {
    const t = zerlegen(z);
    return t.anhang !== null && wechselnd.has(t.name) ? t.name + '  [~]' : z;
  });
}

function zaehle(zs) {
  const m = new Map();
  zs.forEach(function (z) { m.set(z, (m.get(z) || 0) + 1); });
  return m;
}

function ersteAbweichung(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

/* Der Vergleich. Liefert { gleich, ... } mit Begruendung. */
function vergleichen(vorherText, nachherText, rauschTexte) {
  const v = zeilen(vorherText), n = zeilen(nachherText);
  /* rauschTexte: ein Text oder eine Liste weiterer Laeufe des ALTEN Stands. */
  const rs = (rauschTexte === undefined || rauschTexte === null ? [] : [].concat(rauschTexte)).map(zeilen);
  const wechselnd = new Set();
  rs.forEach(function (r) { wechselndeAnhaenge(v, r).forEach(function (x) { wechselnd.add(x); }); });
  const vm = maske(v, wechselnd), nm = maske(n, wechselnd);
  /* Ab wo darf die Reihenfolge wechseln? Dort, wo sie es schon zwischen den alten
   * Laeufen tat (frueheste Stelle) - ohne Rauschmessung nirgends. */
  let frei = -1;
  rs.forEach(function (r) {
    const f = ersteAbweichung(vm, maske(r, wechselnd));
    if (f >= 0 && (frei < 0 || f < frei)) frei = f;
  });
  const bis = frei < 0 ? Math.max(vm.length, nm.length) : frei;
  const ordnung = ersteAbweichung(vm.slice(0, bis), nm.slice(0, bis));
  const za = zaehle(vm), zb = zaehle(nm);
  const nurVorher = [], nurNachher = [];
  za.forEach(function (k, z) { const d = k - (zb.get(z) || 0); for (let i = 0; i < d; i++) nurVorher.push(z); });
  zb.forEach(function (k, z) { const d = k - (za.get(z) || 0); for (let i = 0; i < d; i++) nurNachher.push(z); });
  const haken = function (zs) { return zs.filter(function (z) { return /✅/.test(z); }).length; };
  const kreuze = function (zs) { return zs.filter(function (z) { return /❌/.test(z); }).length; };
  return {
    gleich: ordnung < 0 && !nurVorher.length && !nurNachher.length,
    zeilenVorher: v.length, zeilenNachher: n.length,
    hakenVorher: haken(v), hakenNachher: haken(n), kreuzeVorher: kreuze(v), kreuzeNachher: kreuze(n),
    ausgeblendet: Array.from(wechselnd), reihenfolgeFreiAb: frei < 0 ? null : frei + 1,
    ersteOrdnungsabweichung: ordnung < 0 ? null : ordnung + 1,
    nurVorher: nurVorher, nurNachher: nurNachher
  };
}

function bericht(e) {
  const z = [];
  z.push('Zeilen ' + e.zeilenVorher + ' / ' + e.zeilenNachher + ', Pruefungen gruen ' + e.hakenVorher + ' / ' + e.hakenNachher +
    ', rot ' + e.kreuzeVorher + ' / ' + e.kreuzeNachher);
  z.push('Anhang ausgeblendet (wechselt schon zwischen zwei alten Laeufen): ' + e.ausgeblendet.length + ' Pruefungen');
  e.ausgeblendet.forEach(function (n) { z.push('    ' + n.trim().slice(0, 110)); });
  z.push('Reihenfolge streng verglichen bis Zeile ' + (e.reihenfolgeFreiAb ? e.reihenfolgeFreiAb - 1 : 'Ende') +
    (e.ersteOrdnungsabweichung ? ' - ABWEICHUNG ab Zeile ' + e.ersteOrdnungsabweichung : ' - gleich'));
  z.push('Nur vorher: ' + e.nurVorher.length + ', nur nachher: ' + e.nurNachher.length);
  e.nurVorher.slice(0, 20).forEach(function (l) { z.push('  - ' + l.slice(0, 160)); });
  e.nurNachher.slice(0, 20).forEach(function (l) { z.push('  + ' + l.slice(0, 160)); });
  z.push(e.gleich ? 'ERGEBNIS: gleich (bis auf gemessenes Rauschen)' : 'ERGEBNIS: VERSCHIEDEN');
  return z.join('\n');
}

module.exports = { ordnerNormal: ordnerNormal, zerlegen: zerlegen, vergleichen: vergleichen, bericht: bericht };

if (require.main === module) {
  /* <vorher> <nachher> [--rauschen <vorher-2> [<vorher-3> ...]] */
  const a = process.argv.slice(2);
  const i = a.indexOf('--rauschen');
  const dateien = i < 0 ? a : a.slice(0, i);
  const rausch = i < 0 ? [] : a.slice(i + 1);
  if (dateien.length !== 2 || (i > -1 && !rausch.length)) {
    console.error('Aufruf: node tools/testvergleich.js <vorher> <nachher> [--rauschen <vorher-2> ...]');
    process.exit(2);
  }
  const lies = function (p) { return fs.readFileSync(p, 'utf8'); };
  const e = vergleichen(lies(dateien[0]), lies(dateien[1]), rausch.map(lies));
  console.log(bericht(e));
  process.exit(e.gleich ? 0 : 1);
}
