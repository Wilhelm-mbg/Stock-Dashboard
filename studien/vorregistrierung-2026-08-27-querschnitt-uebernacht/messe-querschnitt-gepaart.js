'use strict';
/* GEPAARTER ENDPUNKT der drei Uebernacht-Entwuerfe - Werkzeug zur ANMELDUNG.md
 * in diesem Ordner (27.08.2026, PM-Entscheid).
 *
 * Gemessen wird je Handelstag die Differenz
 *     d_t = Mittel(rUN der AUSWAHL) - Mittel(rUN des RESTS der Zugelassenen)
 * mit rUN = Eroeffnung(t+1)/Schluss(t) - 1 (das Nachtbein, Zweig N). Gegen den
 * REST, nicht gegen den ganzen Querschnitt - der enthaelt die Auswahl (ANMELDUNG 1).
 *
 * VORRANGREGEL (ANMELDUNG 2): dieser Endpunkt darf ein NEIN tragen, er darf
 * NIEMALS ein JA erzeugen. Ueber JA entscheidet ausschliesslich das Niveau
 * (A7-Protokoll der Messmaschine). NEIN-Familie 12, z_krit 2,8653 (die strengere
 * Fassung, ANMELDUNG 3); die 1,96er-Grenze wird nachrichtlich mit ausgewiesen.
 *
 * Auswahl und Zulassung kommen aus den STRATEGIEDATEIEN der Maschine (_merkmal),
 * kein Nachbau - die Falle "der Pruefstand prueft, was er nachbilden kann" ist
 * aktenkundig. Der Bestaetigungsschnitt ist derselbe wie B5 der Maschine (Haelfte
 * der Handelstage des Universums).
 *
 * PLACEBO (ANMELDUNG 5): je Tag dieselbe Auswahlbreite wie der Kandidat, gezogen
 * ohne jeden Kurs- und Umsatzbezug (Kunstrang), 5 Ziehungen mit verschiedenen
 * Startzahlen, in Zeit und Symbolwahl gewuerfelt. Ausgewiesen wird der STILANTEIL
 * sigma_gepaart(Kandidat)/sigma_gepaart(Placebo) - NICHT als Schaerfe oder Guete.
 *
 * Nebenbei laeuft die Eroeffnungsbereinigungs-Pruefung (Gatter 1 glockendruck /
 * Gatter 2 nachtstoss): (a) Eroeffnungen ausserhalb des eigenen Tagesbandes,
 * (b) Sprungpaare (Nacht- und Tagbein springen gegenlaeufig > 40 % bei normalem
 * Tag-zu-Tag-Verhaeltnis - die Signatur ungleich bereinigter Eroeffnungen).
 *
 * Aufruf: node messe-querschnitt-gepaart.js <glockendruck-nacht|nachtstoss-umkehr|abgabedruck-nacht>
 * Extremwerte |rUN| > 25 Pp werden ausgeworfen und gezaehlt (Konvention der
 * Zaehlwerkzeuge, auf denen die angemeldeten sigma-Werte beruhen). */
var fs = require('fs'), path = require('path'), os = require('os');

var KANDIDAT = process.argv[2];
var STRATEGIEN = {
  'glockendruck-nacht': '../messmaschine/strategien/glockendruck-nacht-n.js',
  'nachtstoss-umkehr': '../messmaschine/strategien/nachtstoss-umkehr-n.js',
  'abgabedruck-nacht': '../messmaschine/strategien/abgabedruck-nacht-n.js',
};
if (!STRATEGIEN[KANDIDAT]) {
  console.error('Aufruf: node messe-querschnitt-gepaart.js <' + Object.keys(STRATEGIEN).join('|') + '>');
  process.exit(2);
}
var S = require(path.join(__dirname, STRATEGIEN[KANDIDAT]));
var WP = require(path.join(__dirname, '..', 'messmaschine', 'strategien', 'wertpapierart.js'));

var ARCHIV = process.env.MD_ARCHIV1D || (function () {
  try {
    return fs.readFileSync(path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'archiv1d-pfad.txt'), 'utf8').replace(/^\uFEFF/, '').trim();
  } catch (e) { return 'E:/Markt-Dashboard-Archiv/archiv1d'; }
})();

var VORLAUF = 261;                 // wie VERFAHREN.mindestKerzenVorlauf der Maschine
var BREITE_MIN = 20;
var EXTREM = 0.25;                 // |rUN| > 25 Pp: Auswurf (Zaehlwerkzeug-Konvention)
var Z_NEIN = 2.8653, Z_NACHR = 1.959964, Z80 = 0.8416212;
var SEEDS = [20260901, 20260902, 20260903, 20260904, 20260905];
var GATE_ABGABEDRUCK = KANDIDAT === 'abgabedruck-nacht';   // Auswahl braucht merkmal > 0

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
/* F1 der Maschine, wortgleich (messmaschine.js reiheKaputt). */
function reiheKaputt(bars) {
  var maxKurs = 0;
  for (var i = 0; i < bars.length; i++) {
    var c = bars[i][1];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) { var v = bars[i - 1][1]; if (v > 0 && c > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) return 'Sprung'; } }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
function statistik(a) {
  var n = a.length;
  if (n < 2) return { n: n, mittel: n ? a[0] : null, sd: null, se: null, t: null };
  var m = mittel(a), s = 0;
  for (var i = 0; i < n; i++) { var d = a[i] - m; s += d * d; }
  var sd = Math.sqrt(s / (n - 1)), se = sd / Math.sqrt(n);
  return { n: n, mittel: m, sd: sd, se: se, t: se > 0 ? m / se : null };
}
function pp(x, d) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d)); }

/* ---------- Universum laden (wie die Maschine: istAktie, F1) ---------- */
console.log('== messe-querschnitt-gepaart ==  Kandidat ' + KANDIDAT + '  Archiv ' + ARCHIV);
var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var alleTage = {};
var proTag = new Map();            // tag -> { merk: [], run: [] }
var zaehl = { reihen: 0, verworfen: 0, beob: 0, extrem: 0, bandVerletzt: 0, sprungpaare: 0 };

dateien.forEach(function (f) {
  var sym = f.slice(8, -5);
  if (!WP.istAktie(sym)) return;
  var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { zaehl.verworfen++; return; }
  var b = j.series || [];
  if (!b.length) { zaehl.verworfen++; return; }
  if (reiheKaputt(b)) { zaehl.verworfen++; return; }
  zaehl.reihen++;
  for (var q = 0; q < b.length; q++) alleTage[tagVon(b[q][0])] = 1;   // B5-Schnitt wie die Maschine
  for (var i = VORLAUF; i < b.length; i++) {
    var w = null;
    try { w = S._merkmal(b, i); } catch (e) { w = null; }
    if (w == null || !isFinite(w)) continue;                 // nicht zugelassen
    var c = b[i][1], o1 = b[i + 1][5];                       // Zulassung garantiert o(i+1) > 0
    var rUN = o1 / c - 1;
    if (Math.abs(rUN) > EXTREM) { zaehl.extrem++; continue; }
    zaehl.beob++;
    /* Bereinigungs-Pruefung auf der Ausstiegskerze: Eroeffnung im eigenen Tagesband? */
    var h1 = b[i + 1][3], l1 = b[i + 1][4];
    if (h1 > 0 && l1 > 0 && (o1 > h1 * 1.000001 || o1 < l1 * 0.999999)) zaehl.bandVerletzt++;
    /* Sprungpaar: Nachtbein und Tagbein springen gegenlaeufig > 40 %, der Tag-zu-Tag-
     * Schritt bleibt normal - Signatur ungleich bereinigter Eroeffnungen. */
    var c1 = b[i + 1][1];
    if (c1 > 0) {
      var lr1 = Math.log(o1 / c), lr2 = Math.log(c1 / o1);
      if (Math.abs(lr1) > 0.3365 && Math.abs(lr2) > 0.3365 && lr1 * lr2 < 0 && Math.abs(lr1 + lr2) < 0.0953) zaehl.sprungpaare++;
    }
    var t = tagVon(b[i][0]);
    var z = proTag.get(t); if (!z) { z = { merk: [], run: [] }; proTag.set(t, z); }
    z.merk.push(w); z.run.push(rUN);
  }
});

var tage = Object.keys(alleTage).sort();
var schnittTag = tage[Math.floor(tage.length * 0.5)];
console.log('Reihen ' + zaehl.reihen + ' (verworfen ' + zaehl.verworfen + ')  Beobachtungen ' + zaehl.beob +
  '  Extremwerte ' + zaehl.extrem + '  Schnitt ' + schnittTag);
console.log('Bereinigungs-Pruefung: Eroeffnung ausserhalb des Tagesbandes ' + zaehl.bandVerletzt +
  ' (' + (100 * zaehl.bandVerletzt / Math.max(1, zaehl.beob)).toFixed(4) + ' %), Sprungpaare ' + zaehl.sprungpaare +
  ' (' + (100 * zaehl.sprungpaare / Math.max(1, zaehl.beob)).toFixed(4) + ' %)');

/* ---------- je Tag: Auswahl, Rest, Placebo-Ziehungen ---------- */
var dKand = { entdeckung: [], bestaetigung: [] };
var dPlac = SEEDS.map(function () { return { entdeckung: [], bestaetigung: [] }; });
var rngs = SEEDS.map(function (s) { return mulberry32(s); });
var tageMitPaar = 0, tageOhneAuswahl = 0, breiteSumme = 0, auswahlSumme = 0;

Array.from(proTag.keys()).sort().forEach(function (t) {
  var z = proTag.get(t), m = z.merk.length;
  if (m < BREITE_MIN) return;
  var k = Math.floor(0.2 * (m - 1)) + 1;                     // ein Fuenftel, wie der Maschinen-Rang
  var idx = [];
  for (var q = 0; q < m; q++) idx.push(q);
  var sel;
  if (GATE_ABGABEDRUCK) {
    /* hoechste U unter den Gatter-Faellen (merkmal > 0), gedeckelt auf k */
    var kand = idx.filter(function (q2) { return z.merk[q2] > 0; });
    kand.sort(function (a, b) { return z.merk[b] - z.merk[a]; });
    sel = kand.slice(0, k);
  } else {
    idx.sort(function (a, b) { return z.merk[a] - z.merk[b]; });
    sel = idx.slice(0, k);                                   // unterstes Quintil
  }
  if (!sel.length || m - sel.length < 1) { tageOhneAuswahl++; return; }
  var im = {}; sel.forEach(function (q3) { im[q3] = 1; });
  var sS = 0, sR = 0, nR = 0;
  for (var q4 = 0; q4 < m; q4++) { if (im[q4]) sS += z.run[q4]; else { sR += z.run[q4]; nR++; } }
  var hf = t < schnittTag ? 'entdeckung' : 'bestaetigung';
  dKand[hf].push(sS / sel.length - sR / nR);
  tageMitPaar++; breiteSumme += m; auswahlSumme += sel.length;
  /* Placebo: dieselbe Breite, Kunstrang ohne jede Information - Teil-Fisher-Yates. */
  var kP = sel.length;
  for (var zi = 0; zi < SEEDS.length; zi++) {
    var rnd = rngs[zi], pool = idx.slice();
    for (var a = 0; a < kP; a++) {
      var b2 = a + Math.floor(rnd() * (m - a));
      var tmp = pool[a]; pool[a] = pool[b2]; pool[b2] = tmp;
    }
    var sP = 0, sRP = 0, nRP = 0, imP = {};
    for (var a2 = 0; a2 < kP; a2++) imP[pool[a2]] = 1;
    for (var q5 = 0; q5 < m; q5++) { if (imP[q5]) sP += z.run[q5]; else { sRP += z.run[q5]; nRP++; } }
    dPlac[zi][hf].push(sP / kP - sRP / nRP);
  }
});

console.log('Paartage ' + tageMitPaar + ' (ohne Auswahl ' + tageOhneAuswahl + ')  Breite/Tag ' +
  (breiteSumme / Math.max(1, tageMitPaar)).toFixed(1) + '  Auswahl/Tag ' + (auswahlSumme / Math.max(1, tageMitPaar)).toFixed(1));

function bericht(name, reihe) {
  var st = statistik(reihe);
  if (st.n < 2) { console.log(name + ': zu wenige Tage (' + st.n + ')'); return st; }
  st.grenzeStreng = st.mittel + Z_NEIN * st.se;              // NEIN-Familie 12
  st.grenzeNachrichtlich = st.mittel + Z_NACHR * st.se;
  st.delta80Nein = (Z_NEIN + Z80) * st.se;
  console.log(name + ': N ' + st.n + '  d ' + pp(st.mittel) + ' Pp  sd ' + pp(st.sd) + '  se ' + pp(st.se) +
    '  t ' + (st.t == null ? '-' : st.t.toFixed(2)) +
    '  obere Grenze (z 2,8653) ' + pp(st.grenzeStreng) + ' Pp  (z 1,96: ' + pp(st.grenzeNachrichtlich) + ')');
  return st;
}

console.log('\n-- KANDIDAT ' + KANDIDAT + ' (gepaart, Nachtbein) --');
var kB = bericht('Bestaetigung', dKand.bestaetigung);
var kE = bericht('Entdeckung  ', dKand.entdeckung);
console.log('\n-- PLACEBO (5 Ziehungen, gleiche Bauform, null Information) --');
var pB = dPlac.map(function (d, zi) { return bericht('Ziehung ' + (zi + 1) + ' Best.', d.bestaetigung); });
var sdsP = pB.map(function (s) { return s.sd; }).filter(function (x) { return x != null; });
var sdPmittel = mittel(sdsP);
var stil = (kB.sd != null && sdPmittel > 0) ? kB.sd / sdPmittel : null;
console.log('\nPlacebo-sd-Band (Bestaetigung): ' + pp(Math.min.apply(null, sdsP)) + ' .. ' + pp(Math.max.apply(null, sdsP)) +
  ' Pp  Mittel ' + pp(sdPmittel) + ' Pp');
console.log('STILANTEIL sigma_gepaart(Kandidat)/sigma_gepaart(Placebo) = ' + (stil == null ? '-' : stil.toFixed(3)) +
  '  (misst Marktzug-Kuerzung und Stil, NICHT Guete)');

var aus = {
  gemessenAm: new Date().toISOString(), kandidat: KANDIDAT, archiv: ARCHIV,
  vorlauf: VORLAUF, breiteMin: BREITE_MIN, extremGrenze: EXTREM, seeds: SEEDS,
  schnittTag: schnittTag, zaehl: zaehl,
  tageMitPaar: tageMitPaar, breiteJeTag: breiteSumme / Math.max(1, tageMitPaar),
  auswahlJeTag: auswahlSumme / Math.max(1, tageMitPaar),
  kandidatBestaetigung: kB, kandidatEntdeckung: kE,
  placeboBestaetigung: pB, placeboSdMittel: sdPmittel, stilanteil: stil,
  regeln: { neinFamilie: 12, zKritNein: Z_NEIN, jaVerboten: 'Der gepaarte Endpunkt darf NIEMALS ein JA erzeugen (ANMELDUNG 2).' },
};
var ziel = path.join(__dirname, 'gepaart-' + KANDIDAT + '-' + new Date().toISOString().slice(0, 10) + '.json');
fs.writeFileSync(ziel, JSON.stringify(aus, null, 1));
console.log('\n' + ziel + ' geschrieben. NICHTS an Archiven geaendert.');
