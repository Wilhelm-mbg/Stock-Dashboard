'use strict';
/* WORTLAUT - V2 des dritten Zaehllaufs (Auftrag Nr. 90): der Abschnitt zu Punkt 3.01 eines 8-K und seine Klasse.
 *
 * Reine Funktionen, kein Netz, keine Platte. Fassung 1 (Commit 1) = die Wortlisten des Auftrags (1.2, V2) woertlich und
 * eine Abschnittssuche vom Schreibtisch. FASSUNG 2 = die EINE Aenderung nach der Lernprobe (30 Reihen, Saat z3-lern):
 * Zusaetze in den drei Wortlisten (je eigens markiert), der Titel von 3.01 auch mit Tippfehlern, "Item" und Nummer in
 * zwei Zeilen. Danach wird nichts mehr geaendert - Fehler der Pruefprobe werden berichtet, nicht behoben.
 */
var FASSUNG = 2;

/* Die drei Wortlisten des Auftrags (ohne Ruecksicht auf Gross- und Kleinschreibung). */
var VOLLZUG = ['consummat(?:ion|ed)', 'effective time', 'completion of the (?:merger|acquisition|transaction|offer|arrangement)', 'closing of the (?:merger|transaction)',
  'became an? (?:direct |indirect )?(?:wholly[- ]owned )?subsidiary', 'merged with and into', '(?:merger|arrangement|scheme) (?:became|was) effective', 'accepted for (?:payment|purchase)',
  /* Fassung 2 (Lernprobe: CFCB, ADGE, CVRR) */ '(?:merger|acquisition|transaction|arrangement|amalgamation|business combination|offer) (?:had |has |was |were )?(?:been )?(?:closed|completed)',
  'converted into the right to receive', 'call right'];
var RUEGE = ['not in compliance', 'non-?compliance', 'deficien', 'fail(?:ed|ure|s)? to (?:satisfy|meet|comply|maintain|regain|file)', 'minimum bid', 'bid price',
  'delisting determination', 'staff determination', 'determined to (?:delist|commence)', 'hearings? panel', 'delinquen', 'commence (?:delisting )?proceedings',
  /* Fassung 2 (Lernprobe: EBET; im selben Satz muss die Abmeldung stehen - sonst wuerde RBCN, ein freiwilliger Rueckzug, zur Ruege) */
  'received (?:a |an |the |written |formal |deficiency |delisting )*(?:notice|notification|letter|determination|decision)s?[^.]{0,250}?(?:delist|suspend|cease)'];
var EIGEN = ['voluntar(?:y|ily)', 'transfer (?:of |the )?(?:its )?listing', 'plan of (?:complete )?(?:liquidation|dissolution)',
  /* Fassung 2 (Lernprobe: EQC, TLR) */ '(?:intends?|intention|intent|approved|authorized) (?:to )?(?:voluntarily )?(?:delist|the delisting|file (?:a |the )?form 25)'];

/* Der amtliche Titel von Punkt 3.01 traegt selbst "Failure to Satisfy" und "Transfer of Listing" - er wird vor der Suche
 * aus dem Abschnitt genommen, sonst waere jeder Abschnitt Ruege UND eigener Entschluss. */
/* Fassung 2: der Titel wird auch mit Tippfehlern erkannt (Lernprobe: "of Failure", "Continuing Listing", "Rule or Stand;"),
 * und "Item" und Nummer duerfen in zwei Zeilen stehen (Lernprobe: 5 von 30 ohne gefundenen Abschnitt). */
var TITEL_301 = /notice of delisting\W+(?:or|of|and)\W+failure to satisfy\W+an?\W+continu\w+\W+listing\W+(?:rule|standard)(?:\W+or\W+(?:standards?|stand|rules?))?(?:\W+(?:and\W+)?transfer of listing)?\.?/gi;
var KOPF = /(^|\n)[ \t]*Items?\b[\s.:]*(\d\.\d\d)/gi;
var UNTERSCHRIFT = /\n[ \t]*SIGNATURES?[ \t]*(?:\n|$)|pursuant to the requirements of the securities exchange act of 1934/i;
var KURZ = 160;                                             // ein Abschnitt mit weniger Text ist nur eine Ueberschrift (gestapelte Ueberschriften)

var NAMEN = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', mdash: '-', ndash: '-' };
function zeichen(n) { return n === 160 ? ' ' : (n >= 32 && n < 65536 ? String.fromCharCode(n) : ' '); }
/** Text eines Hauptdokuments ohne Auszeichnung: Bloecke werden Zeilen, Zellen bleiben in der Zeile. */
function ohneAuszeichnung(html) {
  var s = String(html || '');
  s = s.replace(/<(script|style|ix:header)\b[\s\S]*?<\/\1\s*>/gi, function () { return ' '; }).replace(/<!--[\s\S]*?-->/g, function () { return ' '; });
  s = s.replace(/<\s*\/?\s*(?:br|p|div|tr|h[1-6]|li|table|center|pre|page)\b[^>]*>/gi, function () { return '\n'; }).replace(/<[^>]*>/g, function () { return ' '; });
  s = s.replace(/&#x([0-9a-f]+);/gi, function (m, h) { return zeichen(parseInt(h, 16)); }).replace(/&#(\d+);/g, function (m, n) { return zeichen(Number(n)); })
    .replace(/&([a-z]+);/gi, function (m, n) { var k = n.toLowerCase(); return NAMEN[k] !== undefined ? NAMEN[k] : ' '; });
  s = s.replace(/[  -​ 　]/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―]/g, '-');
  return s.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim();
}
function glatt(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
/** Rest eines Abschnitts ohne Punkt-Nummern und ohne den amtlichen Titel von 3.01 - zum Messen, ob er Text traegt. */
function rumpf(s) { return glatt(glatt(s).replace(TITEL_301, function () { return ' '; }).replace(/\bItems?\b[ .:]*\d\.\d\d\.?/gi, function () { return ' '; })); }

/** Zerlegt den Text an den Punkt-Ueberschriften (Zeilenanfang "Item N.NN"). Eine Ueberschrift kann mehrere Punkte nennen.
 *  Ende = Unterschrift. Rueckgabe { teile: [{ nummern, von, bis }], ende }. */
function zerlege(text) {
  var t = String(text || ''), m, teile = [];
  KOPF.lastIndex = 0;
  while ((m = KOPF.exec(t))) {
    var von = m.index + (m[1] ? 1 : 0), nr = m.index + m[0].length - 4, ze = t.indexOf('\n', nr);
    if (ze < 0) ze = t.length;
    teile.push({ von: von, nummern: t.slice(nr, Math.min(ze, nr + 250)).match(/\b\d\.\d\d\b/g) || [] });
  }
  var erste = teile.length ? teile[0].von : 0, su = t.slice(erste).search(UNTERSCHRIFT), ende = su < 0 ? t.length : erste + su;
  teile = teile.filter(function (k) { return k.von < ende; });
  teile.forEach(function (k, i) { k.bis = i + 1 < teile.length ? teile[i + 1].von : ende; });
  return { teile: teile, ende: ende, text: t };
}
/** Der Abschnitt zu Punkt 3.01: von der Ueberschrift bis zur naechsten Punkt-Ueberschrift oder zur Unterschrift. Ist er
 *  nur eine Ueberschrift (gestapelt), zaehlt der folgende Text mit; verweist er auf einen anderen Punkt oder auf die
 *  Vorbemerkung, wird der verwiesene Abschnitt mitgelesen. { gefunden, text, verwiesen, gestapelt } */
function abschnitt(text) {
  var z = zerlege(text), t = z.text, i = -1;
  z.teile.forEach(function (k, n) { if (i < 0 && k.nummern.indexOf('3.01') !== -1) i = n; });
  if (i < 0) return { gefunden: false, text: '', verwiesen: [], gestapelt: 0 };
  var dabei = {}, stuecke = [], gestapelt = 0, j = i;
  dabei[i] = 1; stuecke.push(t.slice(z.teile[i].von, z.teile[i].bis));
  while (rumpf(stuecke.join(' ')).length < KURZ && j + 1 < z.teile.length && z.teile[j + 1].nummern.indexOf('9.01') === -1) {
    j++; dabei[j] = 1; gestapelt++; stuecke.push(t.slice(z.teile[j].von, z.teile[j].bis));
  }
  var eigen = glatt(stuecke.join(' ')), verwiesen = [], vm, vr = /\bItems?\b[ .:]*(\d\.\d\d)/gi;
  while ((vm = vr.exec(eigen))) {
    var nr = vm[1];
    if (nr === '3.01' || nr === '9.01' || verwiesen.indexOf(nr) !== -1) continue;
    z.teile.forEach(function (k, n) { if (!dabei[n] && k.nummern.indexOf(nr) !== -1) { dabei[n] = 1; stuecke.push(t.slice(k.von, k.bis)); if (verwiesen.indexOf(nr) === -1) verwiesen.push(nr); } });
  }
  if (/(introductory|explanatory) note/i.test(eigen)) {
    var vb = /(^|\n)[ \t]*(introductory|explanatory) note/i.exec(t);
    if (vb) { var ab = vb.index, bis = z.ende; z.teile.forEach(function (k) { if (k.von > ab && k.von < bis) bis = k.von; }); stuecke.push(t.slice(ab, bis)); verwiesen.push('Vorbemerkung'); }
  }
  return { gefunden: true, text: glatt(glatt(stuecke.join(' ')).replace(TITEL_301, function () { return ' '; })), verwiesen: verwiesen, gestapelt: gestapelt };
}

function treffer(s, liste) {
  var aus = { n: 0, pos: -1, muster: [] };
  liste.forEach(function (q) {
    var m = new RegExp(q, 'i').exec(s);
    if (!m) return;
    aus.n++; aus.muster.push(m[0].toLowerCase());
    if (aus.pos < 0 || m.index < aus.pos) aus.pos = m.index;
  });
  return aus;
}
/** Klasse des Textes einer Meldung: vollzug | ruege | mehrdeutig | eigener-entschluss | nichts.
 *  Auszug: hoechstens 300 Zeichen um den ersten Treffer, ohne Zeilenumbrueche. */
function klasse(text) {
  var a = abschnitt(text);
  if (!a.gefunden) return { klasse: 'nichts', abschnitt: 0, auszug: '', treffer: null, verwiesen: [], gestapelt: 0, zeichen: 0 };
  var s = a.text, v = treffer(s, VOLLZUG), r = treffer(s, RUEGE), e = treffer(s, EIGEN);
  var k = v.n && r.n ? 'mehrdeutig' : v.n ? 'vollzug' : r.n ? 'ruege' : e.n ? 'eigener-entschluss' : 'nichts';
  var pos = k === 'eigener-entschluss' ? e.pos : k === 'nichts' ? 0 : Math.min(v.n ? v.pos : Infinity, r.n ? r.pos : Infinity);
  var von = Math.max(0, pos - 110);
  return { klasse: k, abschnitt: 1, auszug: s.slice(von, von + 300), treffer: { vollzug: v.muster, ruege: r.muster, eigen: e.muster }, verwiesen: a.verwiesen, gestapelt: a.gestapelt, zeichen: s.length };
}

module.exports = { FASSUNG: FASSUNG, VOLLZUG: VOLLZUG, RUEGE: RUEGE, EIGEN: EIGEN, ohneAuszeichnung: ohneAuszeichnung, zerlege: zerlege, abschnitt: abschnitt, treffer: treffer, klasse: klasse };
