'use strict';
/* DIE GLOCKE ALS WAV - damit man sie vor dem Release hoeren kann (05.09.2026).
 *
 * Rechnet den Plan aus markt/glocke.js offline aus und schreibt eine WAV-Datei.
 * Dieselbe Rechnung wie im Renderer, nur ohne Web Audio: Sinus-Teiltoene mit
 * abklingender Huellkurve, gefiltertes Rauschen fuer die Hammerschlaege, ein
 * Meister-Gain mit Ein- und Ausblenden. Wer hier etwas anders macht als
 * renderer.js glockeTon(), hoert nicht, was die App spielt - deshalb steht jede
 * Zahl im Plan und keine hier.
 *
 * ES ENTSTEHT KEINE DATEI IM PAKET: das Ziel liegt ausserhalb des Repos
 * (Vorgabe: ../Markt-Dashboard-Daten/uebergabe/nyse-glocke-2026-09-05/), und
 * tools/ wird ohnehin nicht ausgeliefert.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node tools/glocke-wav.js
 *   node tools/glocke-wav.js --ziel "C:/.../ordner" --saat 20260905
 */
var fs = require('fs');
var path = require('path');
var G = require('../markt/glocke.js');

var RATE = 44100;

function arg(name, vorgabe) {
  var i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe;
}

/** Den Plan in Abtastwerte rechnen. Rueckgabe: Float32Array, Spitzenwert. */
function rechnen(p) {
  var n = Math.ceil(p.gesamt * RATE) + RATE;      /* eine Sekunde Luft am Ende */
  var buf = new Float64Array(n);

  /* 1) Die Anschlaege: je Teilton eine abklingende Sinusschwingung. */
  p.anschlaege.forEach(function (an) {
    an.teile.forEach(function (teil) {
      var ab = Math.round(an.t * RATE);
      var len = Math.min(n - ab, Math.ceil(teil.abkling * 6 * RATE));
      var w = 2 * Math.PI * teil.f / RATE;
      for (var i = 0; i < len; i++) {
        buf[ab + i] += teil.a * Math.exp(-i / (teil.abkling * RATE)) * Math.sin(w * i);
      }
    });
  });

  /* 2) Der Nachhall: steht, solange geklingelt wird, und verklingt danach. */
  p.nachhall.teile.forEach(function (teil) {
    var w = 2 * Math.PI * teil.f / RATE;
    var halt = Math.round(p.dauer * RATE);
    var ende = Math.min(n, Math.round(p.nachhall.dauer * RATE) + Math.ceil(p.nachhall.abkling * 6 * RATE));
    for (var i = 0; i < ende; i++) {
      var h = i <= halt ? 1 : Math.exp(-(i - halt) / (p.nachhall.abkling * RATE));
      var ein = Math.min(1, i / (p.huelle.ein * RATE));
      buf[i] += teil.a * h * ein * Math.sin(w * i);
    }
  });

  /* 3) Die Hammerschlaege: Rauschen durch einen einpoligen Tiefpass (dumpfes Holz)
   *    plus ein tiefer Koerper. Das Rauschen ist deterministisch - dieselbe Saat
   *    gibt dieselbe Datei. */
  var z = G.saatZufall(4711);
  p.hammer.forEach(function (ha) {
    var ab = Math.round(ha.t * RATE);
    var len = Math.min(n - ab, Math.ceil(ha.dauer * RATE));
    var k = Math.exp(-2 * Math.PI * ha.tiefpass / RATE);   /* einpoliger Tiefpass */
    var y = 0;
    for (var i = 0; i < len; i++) {
      y = k * y + (1 - k) * (z() * 2 - 1);
      buf[ab + i] += ha.a * y * Math.exp(-i / (ha.dauer * 0.35 * RATE)) * 3;
    }
    var w = 2 * Math.PI * ha.koerper.f / RATE;
    var lenK = Math.min(n - ab, Math.ceil(ha.koerper.abkling * 6 * RATE));
    for (var j = 0; j < lenK; j++) {
      buf[ab + j] += ha.koerper.a * Math.exp(-j / (ha.koerper.abkling * RATE)) * Math.sin(w * j);
    }
  });

  /* 4) Meister-Gain mit Ein- und Ausblenden. */
  var ausAb = Math.round((p.gesamt - p.huelle.aus) * RATE);
  var spitze = 0;
  for (var i = 0; i < n; i++) {
    var g = p.meister;
    if (i < p.huelle.ein * RATE) g *= i / (p.huelle.ein * RATE);
    if (i > ausAb) g *= Math.max(0, 1 - (i - ausAb) / (p.huelle.aus * RATE));
    buf[i] *= g;
    if (Math.abs(buf[i]) > spitze) spitze = Math.abs(buf[i]);
  }
  return { werte: buf, spitze: spitze };
}

/** WAV, 16 Bit, ein Kanal. */
function wavSchreiben(pfad, werte) {
  var n = werte.length;
  var kopf = Buffer.alloc(44);
  kopf.write('RIFF', 0); kopf.writeUInt32LE(36 + n * 2, 4); kopf.write('WAVE', 8);
  kopf.write('fmt ', 12); kopf.writeUInt32LE(16, 16); kopf.writeUInt16LE(1, 20);
  kopf.writeUInt16LE(1, 22); kopf.writeUInt32LE(RATE, 24); kopf.writeUInt32LE(RATE * 2, 28);
  kopf.writeUInt16LE(2, 32); kopf.writeUInt16LE(16, 34);
  kopf.write('data', 36); kopf.writeUInt32LE(n * 2, 40);
  var daten = Buffer.alloc(n * 2);
  for (var i = 0; i < n; i++) {
    var v = Math.max(-1, Math.min(1, werte[i]));
    daten.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  fs.mkdirSync(path.dirname(pfad), { recursive: true });
  fs.writeFileSync(pfad, Buffer.concat([kopf, daten]));
}

var ziel = arg('--ziel', path.join(__dirname, '..', '..', 'Markt-Dashboard-Daten', 'uebergabe', 'nyse-glocke-2026-09-05'));
var saat = Number(arg('--saat', '20260905')) || 20260905;
var laut = arg('--lautstaerke', 'mittel');
['oeffnung', 'schluss'].forEach(function (ev) {
  var p = G.plan(ev, { lautstaerke: laut, zufall: G.saatZufall(saat) });
  var r = rechnen(p);
  var datei = path.join(ziel, ev + '.wav');
  wavSchreiben(datei, r.werte);
  console.log(ev + ': ' + p.anschlaege.length + ' Anschlaege (' + p.schlaegeJeSekunde.toFixed(1) + '/s), ' +
    p.hammer.length + ' Hammerschlaege, ' + p.gesamt.toFixed(2) + ' s, Lautstaerke ' + p.lautstaerke +
    ', Spitze gerechnet ' + r.spitze.toFixed(3) + ' (Schranke im Plan ' + (p.spitze * p.meister).toFixed(3) + ')');
  console.log('  -> ' + datei + '  (' + (fs.statSync(datei).size / 1024).toFixed(0) + ' KB)');
});
