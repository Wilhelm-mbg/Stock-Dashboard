'use strict';
/* Schritt 3 der Fundamentaltafel: aus den Quartals-Auszuegen (auszug.js) die Tafel je Filing bauen - punkt-in-zeit.
 *
 * Regeln (Auftrag 16.09.2026, §1):
 *  - Nur 10-K/10-Q-Familie (auch /A und Uebergangsberichte 10-KT/10-QT) der Panel-CIKs; 20-F/40-F werden gezaehlt
 *    (fundamentaltafel/_auslaend.json), nicht aufgenommen. Plausibilitaet: filed >= period, sonst verworfen und gezaehlt.
 *  - ERSTE VEROEFFENTLICHUNG GILT: je (cik, tag, ddate, qtrs) bleibt der Wert des Filings mit dem kleinsten Rang
 *    (Rang = Reihenfolge nach filed, accepted, adsh ueber ALLE Quartale). Ein spaeteres Filing mit anderem Wert wird als
 *    Neudarstellung gezaehlt (fundamentaltafel/_neudarstellungen.json), nie uebernommen.
 *  - Je Filing zaehlt nur, was zu seinem Rang bekannt ist: jeder Fakt hat den Rang seiner Erstveroeffentlichung, und
 *    fakt() liefert ihn nur, wenn dieser Rang <= Rang des Filings ist. So sind auch die Vergleichszahlen frueherer
 *    Quartale, die erst ein spaeteres Filing nachtraegt, fuer die frueheren Filings unsichtbar.
 *  - Quartalsfluss je Stichtag D: direkt (qtrs 1); sonst abgeleitet mit DEMSELBEN Tag: Jahr (qtrs 4) minus drei
 *    Vorquartale (Auftrag), Jahr minus 9-Monats-YTD, YTD-Differenzen. Jeder Weg wird je Quartal markiert
 *    (wege: d direkt, j Jahr-3Q, y Jahr-YTD3, 2 YTD2-Q1, 3 YTD3-YTD2, 4 YTD3-2Q, - Luecke).
 *  - 4-Quartals-Summen ueber die vier Stichtage D0..D3 (Monatsende, je 3 Monate zurueck) nur, wenn alle vier da sind;
 *    "vor" = D4..D7. Fundamental-Momentum = netto4Q/Vermoegen(D0) - netto4Q_vor/Vermoegen(D4) (Novy-Marx 2015).
 *
 * v1.1 (Auftrag Nr. 60 vom 22.09.2026 §2 und Nachtrag Runde 2, Entscheide 1-3) - vier Datenkorrekturen, Reihenfolge im Bau:
 *  0. ZUORDNUNG (2b), vor allem anderen, fuer jede Reihe mit sicherheit schwach/mittel/stark (tabelle bleibt ungeprueft):
 *     Marktname der Reihe aus der Polygon-Referenzliste (massive/verschwundene.json: name, cik) gegen JEDEN Namen, den die
 *     CIK je in den sub-Auszuegen trug. Polygon-CIK = zugeordnete CIK => bestaetigt ohne Namensvergleich; sonst passt ein
 *     Name (Jaccard der normalisierten Token >= 0,5 oder erstes Token gleich, >= 6 Zeichen und nicht generisch) =>
 *     bestaetigt (Marke polygonCikAnders, wenn Polygon eine andere CIK nennt); sonst verworfen (cik null, Grund mit
 *     beiden CIKs). Verworfene CIKs bekommen keine Tafelzeilen, ausser eine andere Reihe traegt dieselbe CIK bestaetigt.
 *  1. EINHEIT (2c), vor dem Einfuegen in den Faktenspeicher: der eigene Assets-Wert eines Filings (qtrs 0, ddate = period)
 *     gegen beide Nachbar-Filings der CIK um mehr als Faktor 100 in derselben Richtung - oder am Reihenende ein Einbruch
 *     unter 1/100 gegen den Vorgaenger UND den CIK-Median - macht das Filing einheitenverdaechtig; ohne Assets dieselbe
 *     Pruefung mit der Umsatz-Gruppe. Nur der verdaechtige Fakt (das ausloesende Paar Tag/ddate/qtrs) wird ausgelassen;
 *     Marke einheit 'verdacht' + einheitFakt. Vor-Boersengang-Huellen (Sprung nur gegen den Vorgaenger) bleiben, gezaehlt.
 *  2. AKTIEN-SKALA (2a), nach aktienzahl(f), je CIK: Mehrheitsgroesse m = Median(log10 aktien) ueber alle Filings mit
 *     Aktienzahl; |log10 aktien - m| < 1,25 = Mehrheit, sonst Abweichler. CIK-Faktor F aus der Mehrheit: q_med =
 *     Median(Marktwert/Vermoegen) ueber Mehrheits-Filings mit Panel-Kurs (unbereinigter Schluss am letzten Handelstag
 *     <= filed, bis 10 Handelstage zurueck) und Vermoegen >= 1 Mio $; q_med < 0,01 => F = 1000^k mit dem kleinsten
 *     k in {1,2}, fuer das q_med * F >= 0,01 (sonst F = 1, skalaUnklar); ohne Mehrheits-Kurs F = 1, ohneAnker; kein
 *     Abwaertszweig. F gilt fuer alle Mehrheits-Filings, auch ohne Kurs. Abweichler: k = round((m + log10 F - l)/3),
 *     x 1000^k, nur wenn danach |l' - (m + log10 F)| < 1,25, sonst unveraendert + abweichlerUnklar. Waechter je Filing
 *     (Kurs und Vermoegen >= 1 Mio $): Marktwert/Vermoegen < 1e-4 oder > 1e4 => aktien null, verworfen. Verbleibende
 *     Spruenge > 30 zwischen Nachbar-Filings werden gezaehlt und gelistet (Reverse-Split-Wanderer sind Fund, kein Fehler).
 *  3. VORJAHRESBESTAND AUS DER HUELLE (2d): liegt Assets an einem der Vorjahres-Stichtage D4..D7 um mehr als Faktor
 *     1000 vom Vermoegen D0 entfernt, werden vermoegenVor (bei D4) und summe4q.*Vor null (damit roaVor, fm,
 *     umsatzWachstum); marken.d4 = 'huelle'.
 * Alle Vergleiche auf log10, auf 6 Stellen gerundet; Median = unteres mittleres Element; feste Token-Sortierung;
 * Handproben mit fnv-Saat. Liest zusaetzlich (nur lesend, kein Netz): das Tages-Panel des Querschnitts-Pruefstands
 * (v2.1, T.g.rohSchluss) und ~/Downloads/Markt-Dashboard-Daten/massive/verschwundene.json.
 *
 * Schreibt (fundamentaltafel/, nicht ins Repo): tafel-<jahr>.jsonl (Jahr = filed-Jahr, eine JSON-Zeile je Filing in
 * Rangordnung, ohne Zeitstempel - bitgleich reproduzierbar), _reihen.json (mit pruefung/grund je Reihe), _auslaend.json,
 * _neudarstellungen.json, _bau.json (Zaehler aller Korrekturen unter v11, Hashes). Aufruf: node --max-old-space-size=6144 bauen.js
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var crypto = require('crypto');
var readline = require('readline');
var L = require('./fsds-lesen.js');
var Z = require('./zuordnung.js');

var AUSZUG = path.join(L.WURZEL, 'auszug');
var ZIEL = path.join(__dirname, 'fundamentaltafel');
for (var ai = 2; ai < process.argv.length; ai++) {
  if (process.argv[ai] === '--ziel') ZIEL = process.argv[++ai];          /* Determinismus-Probe: Zweitbau in einen anderen Ordner */
  else if (process.argv[ai] === '--auszug') AUSZUG = process.argv[++ai];
}
var KENNUNG = 'fundamentaltafel-2026-09-16/v1.1';
var PRUEFSTAND = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var MASSIVE_NAMEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'verschwundene.json');
var FLUESSE = ['umsatz', 'netto', 'operativ', 'umsatzkosten', 'fue'];
var SUMMEN = ['umsatz', 'netto', 'operativ'];
var WEG_CODE = { direkt: 'd', 'jahr-3q': 'j', 'jahr-ytd3': 'y', ytd2: '2', ytd3: '3', 'ytd3-2q': '4' };
/* v1.1 Schwellen (Auftrag §2 / Nachtrag Runde 2) */
var JACCARD_MIN = 0.5, TOKEN_MIN = 6;
var EINHEIT_LOG = 2 /* Faktor 100 */, D4_LOG = 3 /* Faktor 1000 */, SPRUNG_LOG = Math.log10(30);
var MEHRHEIT_BAND = 1.25, ANKER_LOG = -2 /* q_med < 0,01 */, ANKER_VERMOEGEN_MIN = 1e6, WAECHTER_LOG = 4 /* 1e-4 .. 1e4 */, KURS_RUECKSCHRITT = 10;
/* Sicherungen der Runde 2 (Werkzeug-Chat, im Bericht als Abweichung ausgewiesen): kein Emittent hat mehr Stueck als Apple
 * (1,5e10) - eine Korrektur, die darueber fuehrt, ist falsch (SPN: Mehrheit 1,5e8 richtig, Anker aus der Insolvenzphase);
 * Sprung-Einordnung nach dem Quotienten Marktwert/Vermoegen: [1e-3, 1e3] plausibel */
var STUECK_MAX = 2e10, PLAUSIBEL_LOG = 3;

/* ---------- Datumsrechnung auf Monatsenden (FSDS rundet period/ddate auf das Monatsende) ---------- */
function monatsEnde(j, m) { while (m < 1) { m += 12; j--; } while (m > 12) { m -= 12; j++; } return j * 10000 + m * 100 + new Date(Date.UTC(j, m, 0)).getUTCDate(); }
function zurueck(yyyymmdd, quartale) { var j = Math.floor(yyyymmdd / 10000), m = Math.floor(yyyymmdd / 100) % 100; return monatsEnde(j, m - 3 * quartale); }
function iso(n) { var s = String(n); return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8); }

function tsv(datei, jeZeile) {
  return new Promise(function (ok, nein) {
    var rl = readline.createInterface({ input: fs.createReadStream(datei, { encoding: 'utf8' }), crlfDelay: Infinity });
    var kopf = null, n = 0;
    rl.on('line', function (z) { if (!kopf) { kopf = z.split('\t'); return; } if (!z) return; var f = z.split('\t'), o = {}; for (var i = 0; i < kopf.length; i++) o[kopf[i]] = f[i] === undefined ? '' : f[i]; n++; jeZeile(o, n); });
    rl.on('close', function () { ok(n); }); rl.on('error', nein);
  });
}
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(datei)).digest('hex'); }
function zaehl(o, k) { o[k] = (o[k] || 0) + 1; }
/* Determinismus: log10 auf 6 Stellen; Median = bei gerader Zahl das untere mittlere Element */
function log6(v) { return Math.round(Math.log10(v) * 1e6) / 1e6; }
function medianUnten(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; }
function fnv1a(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Namensvergleich (2b): Kleinschreibung, Klammern und SEC-Zusaetze weg, Polygon-Wertpapierzusaetze weg, Satzzeichen weg,
 * Rechtsformen/Fuellwoerter weg, Token < 2 Zeichen weg; Mengenvergleich mit fester Sortierung, erstes Token in Namensreihenfolge ---------- */
var FUELL = {};
('inc corp corporation co company ltd limited plc holdings holding group the trust lp llc nv sa ag incorporated ' +
 'common stock stk shares share class ordinary ord depositary depository receipts receipt adr ads adss sponsored spnsrd rep repstg representing each ' +
 'when issued ex distribution warrant warrants unit units right rights preferred pfd pft series ser new com cl of and de ' +
 'subordinate voting redeemable convertible mandatory cumulative').split(' ').forEach(function (w) { FUELL[w] = 1; });
var GENERISCH = {};
('american bank bancorp first united national general global capital financial energy china atlas pacific western southern northern eastern ' +
 'international industries technologies therapeutics pharmaceuticals acquisition holdings').split(' ').forEach(function (w) { GENERISCH[w] = 1; });
function tokens(name) {
  var s = String(name || '').toLowerCase()
    .replace(/\([^)]*\)/g, ' ')                        /* (DE), (Switzerland), (each representing ...) */
    .replace(/\/[^/]*\//g, ' ')                        /* SEC-Zusaetze wie /MD/, /DE/ */
    .replace(/\beach representing\b[\s\S]*$/, ' ')
    .replace(/\bunits? (representing|repstg)\b[\s\S]*$/, ' ')
    .replace(/\b(limited partner(ship)? interests?|of beneficial interest|american depositary|ex[- ]distribution|when issued)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ');
  var seen = {}, aus = [];
  s.split(' ').forEach(function (w) { if (w.length >= 2 && !FUELL[w] && !seen[w]) { seen[w] = 1; aus.push(w); } });
  return aus;
}
function namenVergleich(markt, registrant) {
  var a = tokens(markt), b = tokens(registrant);
  if (!a.length || !b.length) return { ok: false, jaccard: null, erstesToken: false, nurErstesToken: false, leer: true };
  var sa = a.slice().sort(), sb = b.slice().sort(), i = 0, j = 0, schnitt = 0;
  while (i < sa.length && j < sb.length) { if (sa[i] === sb[j]) { schnitt++; i++; j++; } else if (sa[i] < sb[j]) i++; else j++; }
  var jaccard = schnitt / (sa.length + sb.length - schnitt);
  var erstes = a[0] === b[0] && a[0].length >= TOKEN_MIN && !GENERISCH[a[0]];
  return { ok: jaccard >= JACCARD_MIN || erstes, jaccard: Math.round(jaccard * 1000) / 1000, erstesToken: erstes, nurErstesToken: erstes && jaccard < JACCARD_MIN, leer: false };
}

async function main() {
  var t0 = Date.now();
  if (!fs.existsSync(ZIEL)) fs.mkdirSync(ZIEL, { recursive: true });
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var quartale = fs.readdirSync(AUSZUG).filter(function (f) { return /^\d{4}q[1-4]-num\.tsv$/.test(f); }).map(function (f) { return f.slice(0, 6); }).sort();

  /* ---------- 0) Vorlauf ueber sub: alle periodischen Berichte im Speicher, alle Registrantennamen je CIK ---------- */
  var subJeQuartal = {}, nameJeCik = {}, panelCikRoh = {};
  panel.reihen.forEach(function (r) { if (r.cik) panelCikRoh[+r.cik] = 1; });
  for (var qi = 0; qi < quartale.length; qi++) {
    var qs = subJeQuartal[quartale[qi]] = [];
    await tsv(path.join(AUSZUG, quartale[qi] + '-sub.tsv'), function (s) {
      var art = Z.FORM_ART[s.form]; if (!art) return;
      qs.push(s);
      var cik = parseInt(s.cik, 10); if (!panelCikRoh[cik]) return;
      var e = nameJeCik[cik] = nameJeCik[cik] || { juengst: null, namen: {}, usStandard: 0 };
      if (Z.US_STANDARD[art]) e.usStandard++;
      if (s.name) e.namen[s.name] = 1;
      var j = e.juengst;
      if (!j || +s.filed > j.filed || (+s.filed === j.filed && (s.accepted > j.accepted || (s.accepted === j.accepted && s.adsh > j.adsh)))) e.juengst = { filed: +s.filed, accepted: s.accepted, adsh: s.adsh, name: s.name, form: s.form };
    });
  }
  console.log('Vorlauf sub:', Object.keys(nameJeCik).length, 'Panel-CIKs mit Filing, in', Math.round((Date.now() - t0) / 1000), 's');

  /* ---------- 2b) Zuordnung pruefen: Polygon-CIK als Zeuge, sonst Marktname gegen jeden Namen der CIK ---------- */
  var massive = JSON.parse(fs.readFileSync(MASSIVE_NAMEN, 'utf8'));
  var marktname = {};
  massive.eintraege.forEach(function (e) { if (e.sym && e.name && !marktname[e.sym]) marktname[e.sym] = { name: e.name, cik: e.cik ? parseInt(e.cik, 10) : null }; });
  var zu = { quelleMarktname: 'Markt-Dashboard-Daten/massive/verschwundene.json (Polygon reference tickers active=false, Stand ' + massive.stand + '), Felder name und cik; die EDGAR-Volltextzuordnung der Studie verschwundene-gruende-2026-09-12 suchte mit dem Kuerzel (edgar-lauf.js ftsKuerzel), ihr Feld name ist der gefundene Registrant und damit nicht unabhaengig; panel.json reihen[].name wurde nicht benutzt',
    regel: 'Polygon-CIK = CIK => bestaetigt; sonst ein Name der CIK (alle Namen aus sub.txt) mit Jaccard(Token) >= ' + JACCARD_MIN + ' oder erstem Token gleich, >= ' + TOKEN_MIN + ' Zeichen und nicht generisch => bestaetigt; sonst verworfen. Geprueft: schwach, mittel, stark; tabelle bleibt.',
    fuellwoerter: Object.keys(FUELL).join(' '), generisch: Object.keys(GENERISCH).join(' '),
    jeStufe: {}, ohneCik: 0, ohneMarktname: 0, ohneRegistrant: 0, leerNachNormalisierung: 0, verworfenTop30: [], handproben20: [], nurErstesToken: { n: 0, beispiele: [] },
    polygonCik: { verglichen: 0, gleich: 0, anders: 0, ohne: 0, bestaetigtPolygonOhneName: 0, bestaetigtNameTrotzAnders: 0, verworfenMitAnders: 0, verworfenOhnePolygonCik: 0 } };
  function stufe(s) { return zu.jeStufe[s] = zu.jeStufe[s] || { reihen: 0, bestaetigt: 0, bestaetigtPolygonCik: 0, bestaetigtName: 0, polygonCikAnders: 0, verworfen: 0, ungeprueft: 0 }; }
  var reihenJeCik = {}, reihenMeta = {}, ohneCik = 0, verworfen = [], bestaetigtAnders = [];
  panel.reihen.forEach(function (r) {
    var cik = r.cik ? +r.cik : null, s = r.sicherheit || null;
    var meta = reihenMeta[r.reihe] = { basis: r.basis, cik: cik, sicherheit: s, lebend: r.lebend, erster: r.erster, letzter: r.letzter, pruefung: null };
    if (!cik) { ohneCik++; zu.ohneCik++; return; }
    var st = stufe(s); st.reihen++;
    var m = marktname[r.reihe] || marktname[r.basis] || null, reg = nameJeCik[cik];
    if (s === 'tabelle') { meta.pruefung = 'tabelle'; }
    else if (!m) { meta.pruefung = 'ungeprueft'; meta.ungeprueft = true; st.ungeprueft++; zu.ohneMarktname++; }
    else if (!reg) { meta.pruefung = 'ungeprueft'; meta.ungeprueft = true; meta.grund = 'kein Filing der CIK im Auszug'; st.ungeprueft++; zu.ohneRegistrant++; }
    else {
      var namen = Object.keys(reg.namen).sort(), treffer = null, leer = 0, bestes = { jaccard: -1, name: null };
      namen.forEach(function (n) { var v = namenVergleich(m.name, n); if (v.leer) { leer++; return; } if (v.ok && !treffer) treffer = { name: n, v: v }; if (v.jaccard > bestes.jaccard) bestes = { jaccard: v.jaccard, name: n }; });
      var polyGleich = m.cik !== null && m.cik === cik, polyAnders = m.cik !== null && m.cik !== cik;
      if (m.cik === null) zu.polygonCik.ohne++; else { zu.polygonCik.verglichen++; if (polyGleich) zu.polygonCik.gleich++; else zu.polygonCik.anders++; }
      meta.marktname = m.name; meta.registrant = reg.juengst.name; meta.polygonCik = m.cik;
      if (polyGleich) {
        meta.pruefung = 'bestaetigt'; meta.weg = 'polygonCik'; meta.namePasst = !!treffer; st.bestaetigt++; st.bestaetigtPolygonCik++;
        if (!treffer) zu.polygonCik.bestaetigtPolygonOhneName++;
      } else if (treffer) {
        meta.pruefung = 'bestaetigt'; meta.weg = 'name'; meta.passenderName = treffer.name; meta.jaccard = treffer.v.jaccard; st.bestaetigt++; st.bestaetigtName++;
        if (polyAnders) { meta.polygonCikAnders = true; st.polygonCikAnders++; zu.polygonCik.bestaetigtNameTrotzAnders++; bestaetigtAnders.push({ reihe: r.reihe, sicherheit: s, marktname: m.name, passenderName: treffer.name, registrant: reg.juengst.name, cik: cik, polygonCik: m.cik, jaccard: treffer.v.jaccard }); }
        if (treffer.v.nurErstesToken) { zu.nurErstesToken.n++; if (zu.nurErstesToken.beispiele.length < 30) zu.nurErstesToken.beispiele.push({ reihe: r.reihe, sicherheit: s, marktname: m.name, passenderName: treffer.name, cik: cik, jaccard: treffer.v.jaccard }); }
      } else if (leer === namen.length) { meta.pruefung = 'ungeprueft'; meta.ungeprueft = true; meta.grund = 'Name leer nach Normalisierung'; st.ungeprueft++; zu.leerNachNormalisierung++; }
      else {
        meta.pruefung = 'verworfen'; meta.sicherheit = 'verworfen'; meta.cik = null; st.verworfen++;
        meta.grund = 'Name: ' + reg.juengst.name + (namen.length > 1 ? ' (+' + (namen.length - 1) + ' fruehere Namen)' : '') + ' ≠ ' + m.name + (polyAnders ? '; Polygon-CIK ' + m.cik + ' ≠ ' + cik : '');
        if (polyAnders) zu.polygonCik.verworfenMitAnders++; else zu.polygonCik.verworfenOhnePolygonCik++;
        verworfen.push({ reihe: r.reihe, sicherheit: s, marktname: m.name, registrant: reg.juengst.name, namenDerCik: namen.length, bestesJaccard: bestes.jaccard, bestesName: bestes.name, cik: cik, polygonCik: m.cik, filings: reg.usStandard });
        return;   /* keine Reihe fuer diese CIK aus dieser Zeile */
      }
    }
    (reihenJeCik[cik] = reihenJeCik[cik] || []).push(r.reihe);
  });
  Object.keys(reihenJeCik).forEach(function (c) { reihenJeCik[c].sort(); });
  verworfen.sort(function (a, b) { return b.filings - a.filings || (a.reihe < b.reihe ? -1 : 1); });
  zu.verworfenTop30 = verworfen.slice(0, 30);
  zu.verworfenGesamt = verworfen.length;
  /* 20 Zufalls-Handproben bestaetigter Zuordnungen mit polygonCikAnders, feste Saat fnv('v11-handproben') */
  bestaetigtAnders.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var zufall = mulberry32(fnv1a('v11-handproben')), topf = bestaetigtAnders.slice();
  while (zu.handproben20.length < 20 && topf.length) zu.handproben20.push(topf.splice(Math.floor(zufall() * topf.length), 1)[0]);
  zu.ciksMitReihe = Object.keys(reihenJeCik).length;
  var verworfeneCiks = {}; verworfen.forEach(function (f) { if (!reihenJeCik[f.cik]) verworfeneCiks[f.cik] = 1; });
  zu.ciksOhneReiheDurchVerwerfen = Object.keys(verworfeneCiks).length;
  console.log('Zuordnung:', JSON.stringify(zu.jeStufe), 'verworfen', verworfen.length, 'CIKs ohne Reihe', zu.ciksOhneReiheDurchVerwerfen, 'Polygon', JSON.stringify(zu.polygonCik));

  var z = { kennung: KENNUNG, quartale: quartale, panelReihen: panel.reihen.length, panelOhneCik: ohneCik, panelCiks: Object.keys(reihenJeCik).length,
    filings: { alleRegistranten: 0, usStandardAlle: 0, auslaendAlle: 0, panelUsStandard: 0, panelAuslaend: 0, filedVorPeriod: 0, periodUngueltig: 0, doppelteAdsh: 0, jeForm: {}, jeQuartal: {} },
    fakten: { zeilen: 0, uomFalsch: 0, zinsNichtFinanz: 0, qtrsUngueltig: 0, wertUngueltig: 0, einheitVerdachtUebersprungen: 0, eingefuegt: 0, wiederholtGleich: 0, neudarstellungen: 0, doppelImFiling: 0, rangUmkehr: 0, neuJeGruppe: {}, neuJeSpaeterForm: {} },
    quartalsgrenzen: { verletzt: 0 }, zeilen: { gesamt: 0, jeJahr: {} }, wege: {}, luecken: {}, roh: {}, abgeleitet: { summe4qNetto: 0, fm: 0, umsatzWachstum: 0, roa: 0 },
    v11: { zuordnung: zu, einheit: null, aktienSkala: null, d4: null } };

  /* ---------- A) Filings ---------- */
  var filings = [], adshGesehen = {}, auslaend = {};
  for (qi = 0; qi < quartale.length; qi++) {
    var q = quartale[qi], jq = { alle: 0, usStandard: 0, auslaend: 0, panelUsStandard: 0, panelAuslaend: 0, filedMin: null, filedMax: null };
    subJeQuartal[q].forEach(function (s) {
      var art = Z.FORM_ART[s.form];
      jq.alle++; z.filings.alleRegistranten++;
      var cik = parseInt(s.cik, 10), imPanel = !!reihenJeCik[cik];
      z.filings.jeForm[s.form] = (z.filings.jeForm[s.form] || 0) + 1;
      if (!Z.US_STANDARD[art]) {
        jq.auslaend++; z.filings.auslaendAlle++;
        if (imPanel) { jq.panelAuslaend++; z.filings.panelAuslaend++; (auslaend[cik] = auslaend[cik] || []).push({ form: s.form, period: /^\d{8}$/.test(s.period) ? iso(s.period) : null, filed: iso(s.filed), adsh: s.adsh }); }
        return;
      }
      jq.usStandard++; z.filings.usStandardAlle++;
      if (!imPanel) return;
      if (!/^\d{8}$/.test(s.period) || !/^\d{8}$/.test(s.filed)) { z.filings.periodUngueltig++; return; }
      var period = +s.period, filed = +s.filed;
      if (filed < period) { z.filings.filedVorPeriod++; return; }
      if (adshGesehen[s.adsh]) { z.filings.doppelteAdsh++; return; }
      adshGesehen[s.adsh] = 1;
      jq.panelUsStandard++; z.filings.panelUsStandard++;
      if (jq.filedMin === null || filed < jq.filedMin) jq.filedMin = filed;
      if (jq.filedMax === null || filed > jq.filedMax) jq.filedMax = filed;
      filings.push({ adsh: s.adsh, cik: cik, sic: parseInt(s.sic, 10) || null, form: s.form, art: art, period: period, filed: filed, accepted: (s.accepted || '').slice(0, 16), fy: s.fy, fp: s.fp, q: q, prevrpt: s.prevrpt, afs: s.afs });
    });
    z.filings.jeQuartal[q] = jq;
  }
  subJeQuartal = null;
  filings.sort(function (a, b) { return a.filed - b.filed || (a.accepted < b.accepted ? -1 : a.accepted > b.accepted ? 1 : 0) || (a.adsh < b.adsh ? -1 : 1); });
  var rangVon = {};
  filings.forEach(function (f, i) { f.rang = i; rangVon[f.adsh] = i; });
  for (qi = 1; qi < quartale.length; qi++) { var a = z.filings.jeQuartal[quartale[qi - 1]], b = z.filings.jeQuartal[quartale[qi]]; if (a.filedMax !== null && b.filedMin !== null && b.filedMin <= a.filedMax) z.quartalsgrenzen.verletzt++; }
  console.log('Filings Panel US-Standard:', filings.length, 'auslaend:', z.filings.panelAuslaend, 'in', Math.round((Date.now() - t0) / 1000), 's');

  /* ---------- 2c) Vorlauf ueber num: eigener Assets-/Umsatzwert je Filing, Einheitenverdacht ---------- */
  var eigen = new Array(filings.length);
  for (qi = 0; qi < quartale.length; qi++) {
    await tsv(path.join(AUSZUG, quartale[qi] + '-num.tsv'), function (n) {
      var r = rangVon[n.adsh]; if (r === undefined || n.uom !== 'USD' || +n.ddate !== filings[r].period) return;
      var f = filings[r], e = eigen[r] = eigen[r] || { assets: null, umsatz: null, umsatzTag: null, umsatzPrio: 99 };
      if (n.tag === 'Assets') { if (n.qtrs === '0' && e.assets === null) { var v = parseFloat(n.value); if (isFinite(v)) e.assets = v; } return; }
      if (Z.TAG_GRUPPE[n.tag] !== 'umsatz' || +n.qtrs !== (Z.JAHRESFORM[f.art] ? 4 : 1)) return;
      if (Z.NUR_FINANZ[n.tag] && !Z.istFinanz(f.sic)) return;
      var p = Z.TAG_PRIO[n.tag]; if (p < e.umsatzPrio) { var u = parseFloat(n.value); if (isFinite(u)) { e.umsatz = u; e.umsatzTag = n.tag; e.umsatzPrio = p; } }
    });
  }
  var ei = { regel: 'eigener Wert des Filings (Assets qtrs 0 bzw. Umsatz-Gruppe qtrs Sollquartal, ddate = period, USD) gegen beide Nachbar-Filings der CIK > Faktor 100 in derselben Richtung; am Reihenende Einbruch < 1/100 gegen den Vorgaenger UND den CIK-Median; nur der ausloesende Fakt wird ausgelassen',
    verdacht: 0, verdachtAssets: 0, verdachtUmsatz: 0, jeGrund: {}, einseitig: 0, ohneNachbar: 0, ohnePruefung: 0, faelle: [] };
  var verdacht = {}, verdachtFakt = {};
  var jeCik = {}; filings.forEach(function (f, i) { (jeCik[f.cik] = jeCik[f.cik] || []).push(i); });
  Object.keys(jeCik).forEach(function (c) {
    var idx = jeCik[c];   /* in Rangordnung (filings ist sortiert) */
    ['assets', 'umsatz'].forEach(function (feld) {
      var reihe = idx.filter(function (i) { return eigen[i] && eigen[i][feld] > 0; });   /* Nachbarn: alle Filings der CIK mit diesem Wert */
      var logs = reihe.map(function (i) { return log6(eigen[i][feld]); }), med = medianUnten(logs);
      reihe.forEach(function (i, k) {
        if (feld === 'umsatz' && eigen[i].assets > 0) return;   /* Umsatz nur pruefen, wenn Assets fehlt */
        var l = logs[k], dv = k > 0 ? l - logs[k - 1] : null, dn = k < logs.length - 1 ? l - logs[k + 1] : null, ist = false, grund = null;
        if (dv === null && dn === null) { ei.ohneNachbar++; return; }
        if (dv !== null && dn !== null) { if (Math.abs(dv) > EINHEIT_LOG && Math.abs(dn) > EINHEIT_LOG && (dv > 0) === (dn > 0)) { ist = true; grund = 'beide Nachbarn'; } }
        else if (dn === null && dv < -EINHEIT_LOG && l - med < -EINHEIT_LOG) { ist = true; grund = 'Reihenende + Median'; }
        if (dv !== null && Math.abs(dv) > EINHEIT_LOG && !ist) ei.einseitig++;
        if (!ist) return;
        var f = filings[i], tag = feld === 'assets' ? 'Assets' : eigen[i].umsatzTag, qtrs = feld === 'assets' ? 0 : (Z.JAHRESFORM[f.art] ? 4 : 1);
        verdacht[f.adsh] = { tag: tag, k: f.period * 10 + qtrs };
        /* der Fakt ist das Paar (Tag, ddate, qtrs) dieser CIK: dieselbe falsche Zahl steht oft schon als Vergleichszahl in einem
         * frueher eingereichten Filing (BRAC/FRBN/DUET: 10-K/A nach dem naechsten 10-Q) - auch die wird ausgelassen, spaetere
         * Neudarstellungen bleiben */
        verdachtFakt[f.cik + '|' + tag + '|' + (f.period * 10 + qtrs)] = f.rang;
        ei.verdacht++; if (feld === 'assets') ei.verdachtAssets++; else ei.verdachtUmsatz++; zaehl(ei.jeGrund, grund);
        ei.faelle.push({ adsh: f.adsh, cik: f.cik, sym: reihenJeCik[f.cik], form: f.form, period: iso(f.period), filed: iso(f.filed), tag: tag, wert: eigen[i][feld], vorher: k > 0 ? eigen[reihe[k - 1]][feld] : null, nachher: k < reihe.length - 1 ? eigen[reihe[k + 1]][feld] : null, medianCik: Math.round(Math.pow(10, med)), grund: grund });
      });
    });
    idx.forEach(function (i) { if (!eigen[i] || (!(eigen[i].assets > 0) && !(eigen[i].umsatz > 0))) ei.ohnePruefung++; });
  });
  ei.faelle.sort(function (a, b) { return a.filed < b.filed ? -1 : a.filed > b.filed ? 1 : a.adsh < b.adsh ? -1 : 1; });
  z.v11.einheit = ei;
  console.log('Einheit: verdaechtig', ei.verdacht, JSON.stringify(ei.jeGrund), 'einseitig', ei.einseitig, 'ohne Pruefung', ei.ohnePruefung, 'in', Math.round((Date.now() - t0) / 1000), 's');

  /* ---------- B) Fakten: erste Veroeffentlichung gilt (der ausloesende Fakt eines verdaechtigen Filings wird uebersprungen) ---------- */
  var store = new Map();   // cik -> Map(tag -> Map(ddate*10+qtrs -> {v, r, n, s, lv, lr}))
  var neu = [];
  function eintrag(cik, tag, k, anlegen) {
    var c = store.get(cik); if (!c) { if (!anlegen) return null; c = new Map(); store.set(cik, c); }
    var t = c.get(tag); if (!t) { if (!anlegen) return null; t = new Map(); c.set(tag, t); }
    var e = t.get(k); if (!e && anlegen) { e = { v: null, r: -1, n: 0, s: 0 }; t.set(k, e); }
    return e || null;
  }
  for (qi = 0; qi < quartale.length; qi++) {
    var qn = quartale[qi], zeilen = [];
    await tsv(path.join(AUSZUG, qn + '-num.tsv'), function (n, nr) {
      var r = rangVon[n.adsh]; if (r === undefined) return;
      z.fakten.zeilen++;
      var g = Z.TAG_GRUPPE[n.tag];
      if (n.uom !== Z.GRUPPEN[g].uom) { z.fakten.uomFalsch++; return; }
      var f = filings[r];
      if (Z.NUR_FINANZ[n.tag] && !Z.istFinanz(f.sic)) { z.fakten.zinsNichtFinanz++; return; }
      var qtrs = parseInt(n.qtrs, 10);
      if (!(qtrs >= 0 && qtrs <= 4) || !/^\d{8}$/.test(n.ddate)) { z.fakten.qtrsUngueltig++; return; }
      var k = (+n.ddate) * 10 + qtrs, vd = verdacht[n.adsh];
      if (vd && vd.tag === n.tag && vd.k === k) { z.fakten.einheitVerdachtUebersprungen++; return; }
      var vr = verdachtFakt[f.cik + '|' + n.tag + '|' + k];
      if (vr !== undefined && r < vr) { z.fakten.einheitVerdachtFruehereGleicheFakten = (z.fakten.einheitVerdachtFruehereGleicheFakten || 0) + 1; return; }
      var v = parseFloat(n.value);
      if (!isFinite(v)) { z.fakten.wertUngueltig++; return; }
      zeilen.push({ r: r, nr: nr, cik: f.cik, tag: n.tag, k: k, v: v });
    });
    zeilen.sort(function (a, b) { return a.r - b.r || a.nr - b.nr; });
    zeilen.forEach(function (x) {
      var e = eintrag(x.cik, x.tag, x.k, true);
      if (e.r < 0) { e.v = x.v; e.r = x.r; z.fakten.eingefuegt++; return; }
      if (e.r === x.r) { if (Math.abs(e.v - x.v) > 1e-6 * Math.max(1, Math.abs(e.v))) z.fakten.doppelImFiling++; return; }
      if (x.r < e.r) { z.fakten.rangUmkehr++; /* darf nicht vorkommen (Quartale in filed-Ordnung); gezaehlt, nicht behandelt */ return; }
      if (Math.abs(e.v - x.v) <= 1e-6 * Math.max(1, Math.abs(e.v))) { e.s++; z.fakten.wiederholtGleich++; return; }
      e.n++; e.lv = x.v; e.lr = x.r; z.fakten.neudarstellungen++;
      var g = Z.TAG_GRUPPE[x.tag]; z.fakten.neuJeGruppe[g] = (z.fakten.neuJeGruppe[g] || 0) + 1;
      var sf = filings[x.r].art; z.fakten.neuJeSpaeterForm[sf] = (z.fakten.neuJeSpaeterForm[sf] || 0) + 1;
      neu.push({ cik: x.cik, tag: x.tag, ddate: iso(Math.floor(x.k / 10)), qtrs: x.k % 10, erst: { wert: e.v, adsh: filings[e.r].adsh, form: filings[e.r].form, filed: iso(filings[e.r].filed) }, spaeter: { wert: x.v, adsh: filings[x.r].adsh, form: filings[x.r].form, filed: iso(filings[x.r].filed) } });
    });
    console.log(qn, 'Fakten', zeilen.length, 'Store', z.fakten.eingefuegt, 'Neudarstellungen', z.fakten.neudarstellungen, Math.round((Date.now() - t0) / 1000), 's');
  }
  fs.writeFileSync(path.join(ZIEL, '_neudarstellungen.json'), JSON.stringify({ kennung: KENNUNG, n: neu.length, faelle: neu }));

  /* ---------- C) je Filing ableiten ---------- */
  function fakt(cik, tag, ddate, qtrs, rang) { var e = eintrag(cik, tag, ddate * 10 + qtrs, false); return e && e.r <= rang ? e : null; }
  function wert(cik, tag, ddate, qtrs, rang) { var e = fakt(cik, tag, ddate, qtrs, rang); return e ? e.v : null; }
  function quartalswert(cik, tags, D, rang) {
    var i, t, v, a, b, c, d;
    for (i = 0; i < tags.length; i++) { t = tags[i]; v = wert(cik, t, D, 1, rang); if (v !== null) return { v: v, tag: t, weg: 'direkt' }; }
    var D1 = zurueck(D, 1), D2 = zurueck(D, 2), D3 = zurueck(D, 3);
    for (i = 0; i < tags.length; i++) {
      t = tags[i];
      a = wert(cik, t, D, 4, rang);
      if (a !== null) {
        b = wert(cik, t, D1, 1, rang); c = wert(cik, t, D2, 1, rang); d = wert(cik, t, D3, 1, rang);
        if (b !== null && c !== null && d !== null) return { v: a - b - c - d, tag: t, weg: 'jahr-3q' };
        b = wert(cik, t, D1, 3, rang); if (b !== null) return { v: a - b, tag: t, weg: 'jahr-ytd3' };
      }
      a = wert(cik, t, D, 2, rang);
      if (a !== null) { b = wert(cik, t, D1, 1, rang); if (b !== null) return { v: a - b, tag: t, weg: 'ytd2' }; }
      a = wert(cik, t, D, 3, rang);
      if (a !== null) {
        b = wert(cik, t, D1, 2, rang); if (b !== null) return { v: a - b, tag: t, weg: 'ytd3' };
        b = wert(cik, t, D1, 1, rang); c = wert(cik, t, D2, 1, rang); if (b !== null && c !== null) return { v: a - b - c, tag: t, weg: 'ytd3-2q' };
      }
    }
    return null;
  }
  function erster(cik, tags, D, qtrs, rang) { for (var i = 0; i < tags.length; i++) { var e = fakt(cik, tags[i], D, qtrs, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r }; } return null; }
  function aktienzahl(f) {
    var cik = f.cik, rang = f.rang, tags = Z.GRUPPEN.aktien.tags, sollQ = Z.JAHRESFORM[f.art] ? 4 : 1;
    /* Deckblatt-Zahl (dei): Bestand mit ddate zwischen Stichtag und Einreichung */
    var c = store.get(cik), tm = c && c.get('EntityCommonStockSharesOutstanding');
    if (tm) { var best = null; tm.forEach(function (e, k) { var dd = Math.floor(k / 10); if (k % 10 === 0 && dd >= f.period && dd <= f.filed && e.r <= rang && (!best || dd > best.dd)) best = { v: e.v, dd: dd, r: e.r }; }); if (best) return { v: best.v, tag: tags[0], i: 0, r: best.r }; }
    var e = fakt(cik, 'CommonStockSharesOutstanding', f.period, 0, rang); if (e) return { v: e.v, tag: tags[1], i: 1, r: e.r };
    for (var i = 2; i <= 3; i++) {
      e = fakt(cik, tags[i], f.period, sollQ, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r };
      for (var qq = 1; qq <= 4; qq++) { e = fakt(cik, tags[i], f.period, qq, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r }; }
    }
    e = fakt(cik, 'CommonStockSharesIssued', f.period, 0, rang); if (e) return { v: e.v, tag: tags[4], i: 4, r: e.r };
    return null;
  }

  /* ---------- 2a) Aktien-Skala je CIK: Mehrheit, CIK-Faktor F, Abweichler, Waechter ---------- */
  var PR = require(path.join(PRUEFSTAND, 'pruefstand.js'));
  var T = PR.Tafel(path.join(PRUEFSTAND, 'voll'));
  function tagBis(isoTag) { var lo = 0, hi = T.maxTag + 1, tage = T.kal.tage; while (lo < hi) { var m = (lo + hi) >> 1; if (tage[m] <= isoTag) lo = m + 1; else hi = m; } return lo - 1; }
  function kursAm(cik, filedIso) {   /* erstes Kuerzel der Reihe, das am letzten Handelstag <= filed (bis 10 Handelstage zurueck) einen Kurs hat */
    var syms = reihenJeCik[cik] || [], t0 = tagBis(filedIso); if (t0 < 0) return null;
    for (var i = 0; i < syms.length; i++) {
      var si = T.symIdx[syms[i]]; if (si === undefined) si = T.symIdx[syms[i].replace(/~2$/, '')]; if (si === undefined) continue;
      for (var t = t0; t > t0 - KURS_RUECKSCHRITT && t >= 0; t--) { var zl = T.zeileVon(si, t); if (zl >= 0 && T.g.rohSchluss[zl] > 0) return { kurs: T.g.rohSchluss[zl], sym: syms[i], tag: T.kal.tage[t] }; }
    }
    return null;
  }
  var ak = new Array(filings.length), aktienKorr = new Array(filings.length), skalaMarke = new Array(filings.length), vermoegenD0 = new Array(filings.length), kursVon = new Array(filings.length);
  var as = { regel: 'Mehrheit |log10 aktien - m| < ' + MEHRHEIT_BAND + '; F aus Median(Marktwert/Vermoegen) der Mehrheit mit Kurs und Vermoegen >= 1 Mio $, q_med < 0,01 => 1000^k (k in {1,2}), kein Abwaertszweig; Abweichler x 1000^round((m + log10 F - l)/3) nur wenn danach im Band; Waechter 1e-4 .. 1e4',
    ciksMitAktien: 0, mehrheitZeilen: 0, abweichlerZeilen: 0, nichtPositiv: 0, ohneKurs: 0, ohneVermoegen: 0,
    faktorCik: { ciks: 0, zeilen: 0, zeilenOhneKurs: 0, je: {}, liste: [] }, skalaUnklar: { ciks: 0, zeilen: 0, liste: [] }, ohneAnker: { ciks: 0, zeilen: 0 },
    abweichler: { angeglichen: 0, kNull: 0, unklar: 0, kAusserhalb: 0, beiOhneAnker: 0, ankerWiderspricht: 0, ueberDeckel: 0, jeK: {}, abstandZu3k: { unter05: 0, bis1: 0, ueber1: 0 }, ueber1Beispiele: [], unklarJeCikTop: [] },
    waechter: { verworfen: 0, beispiele: [] }, quotientNachher: {}, spruengeVor30: 0, spruengeNach30: 0, spruengeNachJeArt: { beideOhneMarke: 0, mitUnklar: 0, mitAngleichung: 0, sonst: 0 },
    spruengeNachQuotient: { beidePlausibel: 0, eineSeiteUnplausibel: 0, ohneQuotient: 0, fehlerBeispiele: [] }, spruengeNachTop30: [], wanderer: { n: 0, liste: [] } };
  as.skalaUnklar.ueberDeckel = 0;
  var unklarJeCik = {};
  filings.forEach(function (f, i) {
    ak[i] = aktienzahl(f);
    var ev = fakt(f.cik, 'Assets', f.period, 0, f.rang); vermoegenD0[i] = ev ? ev.v : null;
    if (ak[i] && ak[i].v > 0) { kursVon[i] = kursAm(f.cik, iso(f.filed)); if (!kursVon[i]) as.ohneKurs++; if (!(vermoegenD0[i] > 0)) as.ohneVermoegen++; }
  });
  Object.keys(jeCik).forEach(function (c) {
    var rows = jeCik[c].filter(function (i) { var a = ak[i]; if (!a) return false; if (!(a.v > 0)) { as.nichtPositiv++; return false; } return true; });
    if (!rows.length) return;
    as.ciksMitAktien++;
    var ls = {}; rows.forEach(function (i) { ls[i] = log6(ak[i].v); });
    var m = medianUnten(rows.map(function (i) { return ls[i]; }));
    var mehrheit = rows.filter(function (i) { return Math.abs(ls[i] - m) < MEHRHEIT_BAND; }), abweichler = rows.filter(function (i) { return Math.abs(ls[i] - m) >= MEHRHEIT_BAND; });
    as.mehrheitZeilen += mehrheit.length; as.abweichlerZeilen += abweichler.length;
    /* CIK-Faktor F aus der Mehrheit */
    var qs = mehrheit.filter(function (i) { return kursVon[i] && vermoegenD0[i] >= ANKER_VERMOEGEN_MIN; }).map(function (i) { return log6(ak[i].v * kursVon[i].kurs / vermoegenD0[i]); });
    var F = 1, logF = 0, lq = null, unklar = false, unklarGrund = null, ohneAnker = qs.length === 0;
    if (!ohneAnker) {
      lq = medianUnten(qs);
      if (lq < ANKER_LOG) {
        var kk = lq + 3 >= ANKER_LOG ? 1 : lq + 6 >= ANKER_LOG ? 2 : 0;
        if (!kk) { unklar = true; unklarGrund = 'auch 1e6 reicht nicht'; }
        else if (Math.pow(10, m) * Math.pow(1000, kk) > STUECK_MAX) { unklar = true; unklarGrund = 'Mehrheit x F ueber ' + STUECK_MAX + ' Stueck'; as.skalaUnklar.ueberDeckel++; }
        else { F = Math.pow(1000, kk); logF = 3 * kk; }
      }
    }
    if (F !== 1) { as.faktorCik.ciks++; zaehl(as.faktorCik.je, String(F)); as.faktorCik.liste.push({ cik: +c, sym: reihenJeCik[c], faktor: F, quotientMehrheit: Math.pow(10, lq), mehrheitLog10: m, mehrheit: mehrheit.length, mitAnker: qs.length, abweichler: abweichler.length }); }
    if (unklar) { as.skalaUnklar.ciks++; as.skalaUnklar.liste.push({ cik: +c, sym: reihenJeCik[c], grund: unklarGrund, quotientMehrheit: Math.pow(10, lq), mehrheitLog10: m, mehrheit: mehrheit.length, mitAnker: qs.length }); }
    if (ohneAnker) as.ohneAnker.ciks++;
    mehrheit.forEach(function (i) {
      if (F !== 1) { aktienKorr[i] = ak[i].v * F; skalaMarke[i] = { faktorCik: F }; as.faktorCik.zeilen++; if (!kursVon[i]) as.faktorCik.zeilenOhneKurs++; }
      else if (unklar) { skalaMarke[i] = { skalaUnklar: true, quotientMehrheit: Math.pow(10, lq) }; as.skalaUnklar.zeilen++; }
      else if (ohneAnker) { skalaMarke[i] = { ohneAnker: true }; as.ohneAnker.zeilen++; }
    });
    abweichler.forEach(function (i) {
      var l = ls[i], d = m + logF - l, k = Math.round(d / 3), faktor = Math.pow(1000, k), lNeu = log6(ak[i].v * faktor);
      /* k bleibt wie in §2a auf {-2..2} begrenzt: Huellen-Platzhalter ("1 Aktie") wuerden sonst x 1e9 (4 Faelle, Runde 2) */
      if (k > 2 || k < -2) { skalaMarke[i] = { faktorCik: F, abweichlerUnklar: true, kAusserhalb: k }; as.abweichler.unklar++; as.abweichler.kAusserhalb++; zaehl(unklarJeCik, c); return; }
      /* Sicherung: ohne Anker ist nicht zu wissen, welcher Cluster stimmt (AVP: Mehrheit 101,34 in Millionen ohne Kurs, die
       * richtigen 4,3e8 wurden in Runde 2 zuerst auf 433 gedrueckt) - dann keine Angleichung */
      if (k !== 0 && ohneAnker) { skalaMarke[i] = { faktorCik: F, ohneAnker: true, abweichlerUnklar: true }; as.abweichler.unklar++; as.abweichler.beiOhneAnker++; zaehl(unklarJeCik, c); return; }
      /* Sicherung: ein Abweichler mit eigenem Kurs wird nur angeglichen, wenn sein Quotient dadurch naeher an 1 rueckt (ein echter
       * Reverse-Split hat vorher einen plausiblen Quotienten und wuerde sonst um 1000 verschoben); Deckel wie bei F */
      if (k !== 0 && kursVon[i] && vermoegenD0[i] >= ANKER_VERMOEGEN_MIN) { var q0 = log6(ak[i].v * kursVon[i].kurs / vermoegenD0[i]); if (Math.abs(q0 + 3 * k) >= Math.abs(q0)) { skalaMarke[i] = { faktorCik: F, abweichlerUnklar: true, ankerWiderspricht: true }; as.abweichler.unklar++; as.abweichler.ankerWiderspricht++; zaehl(unklarJeCik, c); return; } }
      if (k > 0 && ak[i].v * faktor > STUECK_MAX) { skalaMarke[i] = { faktorCik: F, abweichlerUnklar: true, ueberDeckel: true }; as.abweichler.unklar++; as.abweichler.ueberDeckel++; zaehl(unklarJeCik, c); return; }
      if (Math.abs(lNeu - (m + logF)) < MEHRHEIT_BAND) {
        aktienKorr[i] = ak[i].v * faktor; skalaMarke[i] = { faktorCik: F, faktorAbweichler: faktor };
        if (k === 0) as.abweichler.kNull++; else as.abweichler.angeglichen++;
        zaehl(as.abweichler.jeK, String(k));
        var ab = Math.abs(d - 3 * k); if (ab < 0.5) as.abweichler.abstandZu3k.unter05++; else if (ab < 1) as.abweichler.abstandZu3k.bis1++; else { as.abweichler.abstandZu3k.ueber1++; if (as.abweichler.ueber1Beispiele.length < 30) as.abweichler.ueber1Beispiele.push({ adsh: filings[i].adsh, sym: reihenJeCik[c], filed: iso(filings[i].filed), tag: ak[i].tag, roh: ak[i].v, korrigiert: aktienKorr[i], mehrheitLog10: m + logF, abstand: Math.round(ab * 100) / 100 }); }
      } else { skalaMarke[i] = { faktorCik: F, abweichlerUnklar: true }; as.abweichler.unklar++; zaehl(unklarJeCik, c); }
    });
  });
  /* CIKs mit den meisten unklaren Abweichlern: dort liegt die Mehrheit auf einem Reverse-Split-Cluster (NBR, HOV) */
  as.abweichler.unklarJeCikTop = Object.keys(unklarJeCik).map(function (c) { return { cik: +c, sym: reihenJeCik[c], unklar: unklarJeCik[c], zeilen: jeCik[c].length }; }).sort(function (a, b) { return b.unklar - a.unklar || a.cik - b.cik; }).slice(0, 25);
  /* Waechter je Filing und Quotientenverteilung nach der Korrektur */
  filings.forEach(function (f, i) {
    var a = ak[i]; if (!a || !(a.v > 0)) return;
    var v = aktienKorr[i] !== undefined ? aktienKorr[i] : a.v;
    if (!kursVon[i] || !(vermoegenD0[i] >= ANKER_VERMOEGEN_MIN)) return;
    var q = v * kursVon[i].kurs / vermoegenD0[i], lq = log6(q);
    zaehl(as.quotientNachher, 'log10 ' + Math.floor(lq));
    if (skalaMarke[i]) skalaMarke[i].quotient = q;
    if (lq < -WAECHTER_LOG || lq > WAECHTER_LOG) {
      var alt = skalaMarke[i] || {}, marke = { verworfen: true, quotient: q };
      if (alt.faktorCik && alt.faktorCik !== 1) marke.faktorCik = alt.faktorCik; if (alt.faktorAbweichler) marke.faktorAbweichler = alt.faktorAbweichler;
      aktienKorr[i] = null; skalaMarke[i] = marke; as.waechter.verworfen++;
      if (as.waechter.beispiele.length < 30) as.waechter.beispiele.push({ adsh: f.adsh, sym: reihenJeCik[f.cik], filed: iso(f.filed), tag: a.tag, aktienVorher: v, kurs: kursVon[i].kurs, vermoegen: vermoegenD0[i], quotient: q });
    }
  });
  /* Spruenge > Faktor 30 zwischen Nachbar-Filings derselben CIK, vor (roh) und nach der Korrektur - Befund, keine Korrektur */
  var spruenge = [];
  function quotientVon(i, v) { return kursVon[i] && vermoegenD0[i] >= ANKER_VERMOEGEN_MIN ? log6(v * kursVon[i].kurs / vermoegenD0[i]) : null; }
  Object.keys(jeCik).forEach(function (c) {
    var vorher = null, nachher = null, vI = null;
    jeCik[c].forEach(function (i) {
      var a = ak[i]; if (!a || !(a.v > 0)) return;
      if (vorher !== null && Math.abs(log6(a.v) - log6(vorher)) > SPRUNG_LOG) as.spruengeVor30++;
      vorher = a.v;
      var n = aktienKorr[i] !== undefined ? aktienKorr[i] : a.v; if (!(n > 0)) return;
      if (nachher !== null) {
        var d = Math.abs(log6(n) - log6(nachher));
        if (d > SPRUNG_LOG) {
          as.spruengeNach30++;
          var s = { cik: +c, sym: reihenJeCik[c], von: { adsh: filings[vI].adsh, filed: iso(filings[vI].filed), aktien: nachher, marke: skalaMarke[vI] || null }, nach: { adsh: filings[i].adsh, filed: iso(filings[i].filed), aktien: n, marke: skalaMarke[i] || null }, faktor: Math.round(Math.pow(10, d)) };
          spruenge.push(s);
          /* Einordnung ueber den Aussenanker: ist eine Seite unplausibel (Quotient ausserhalb [1e-3, 1e3]), ist der Sprung ein Fehler */
          var qa = quotientVon(vI, nachher), qb = quotientVon(i, n);
          if (qa === null && qb === null) as.spruengeNachQuotient.ohneQuotient++;
          else if ((qa !== null && Math.abs(qa) > PLAUSIBEL_LOG) || (qb !== null && Math.abs(qb) > PLAUSIBEL_LOG)) { as.spruengeNachQuotient.eineSeiteUnplausibel++; s.fehler = true; s.quotienten = [qa === null ? null : Math.pow(10, qa), qb === null ? null : Math.pow(10, qb)]; if (as.spruengeNachQuotient.fehlerBeispiele.length < 40) as.spruengeNachQuotient.fehlerBeispiele.push(s); }
          else as.spruengeNachQuotient.beidePlausibel++;
          var ma = skalaMarke[vI], mb = skalaMarke[i], ohne = function (x) { return !x || x.ohneAnker || (x.faktorCik && !x.faktorAbweichler && !x.abweichlerUnklar); };
          if ((ma && ma.faktorAbweichler && ma.faktorAbweichler !== 1) || (mb && mb.faktorAbweichler && mb.faktorAbweichler !== 1)) as.spruengeNachJeArt.mitAngleichung++;
          else if ((ma && ma.abweichlerUnklar) || (mb && mb.abweichlerUnklar)) as.spruengeNachJeArt.mitUnklar++;
          else if (ohne(ma) && ohne(mb)) { as.spruengeNachJeArt.beideOhneMarke++; as.wanderer.n++; if (as.wanderer.liste.length < 40) as.wanderer.liste.push(s); }
          else as.spruengeNachJeArt.sonst++;
        }
      }
      nachher = n; vI = i;
    });
  });
  spruenge.sort(function (a, b) { return b.faktor - a.faktor || (a.nach.adsh < b.nach.adsh ? -1 : 1); });
  as.spruengeNachTop30 = spruenge.slice(0, 30);
  as.faktorCik.liste.sort(function (a, b) { return a.cik - b.cik; }); as.skalaUnklar.liste.sort(function (a, b) { return a.cik - b.cik; });
  z.v11.aktienSkala = as;
  console.log('Aktien-Skala: F!=1 CIKs', as.faktorCik.ciks, 'Zeilen', as.faktorCik.zeilen, 'skalaUnklar', as.skalaUnklar.ciks, 'ohneAnker', as.ohneAnker.ciks, 'Abweichler', JSON.stringify(as.abweichler.jeK), 'unklar', as.abweichler.unklar, 'Waechter', as.waechter.verworfen, 'Spruenge>30 vor/nach', as.spruengeVor30, as.spruengeNach30, 'in', Math.round((Date.now() - t0) / 1000), 's');

  FLUESSE.forEach(function (g) { z.roh[g] = 0; }); ['vermoegen', 'eigenkapital', 'aktien'].forEach(function (g) { z.roh[g] = 0; });
  z.roh.tags = {}; z.roh.eigenkapitalFallback = 0; z.roh.nettoFallback = 0; z.roh.aktienJeTag = {};
  SUMMEN.forEach(function (g) { z.wege[g] = {}; z.luecken[g] = { summe4q: 0, summe4qVor: 0, jeQuartal: [0, 0, 0, 0, 0, 0, 0, 0] }; });
  var d4 = { regel: 'Assets an D4..D7 gegen Vermoegen D0 ausserhalb [1e-3, 1e3] => vermoegenVor (nur bei D4) und summe4q.*Vor null', huelle: 0, huelleD4: 0, huelleNurD5bisD7: 0, beispiele: [] };

  var stroeme = {}, aktJahr = null, out = null, hashes = {};
  function oeffneJahr(j) { if (out) out.end(); aktJahr = j; out = fs.createWriteStream(path.join(ZIEL, 'tafel-' + j + '.jsonl.teil')); stroeme[j] = out; }
  var puffer = [];
  for (var fi = 0; fi < filings.length; fi++) {
    var f = filings[fi], cik = f.cik, rang = f.rang, P = f.period, sollQ = Z.JAHRESFORM[f.art] ? 4 : 1;
    var roh = {}, rohTags = {}, erstVonFrueher = 0;
    FLUESSE.forEach(function (g) { var e = erster(cik, Z.GRUPPEN[g].tags, P, sollQ, rang); roh[g] = e ? e.v : null; rohTags[g] = e ? e.tag : null; if (e) { z.roh[g]++; zaehl(z.roh.tags, e.tag); if (e.r < rang) erstVonFrueher++; } });
    if (rohTags.netto && rohTags.netto !== 'NetIncomeLoss') z.roh.nettoFallback++;
    var ev = fakt(cik, 'Assets', P, 0, rang); roh.vermoegen = ev ? ev.v : null; if (ev) { z.roh.vermoegen++; if (ev.r < rang) erstVonFrueher++; }
    var ek = erster(cik, Z.GRUPPEN.eigenkapital.tags, P, 0, rang); roh.eigenkapital = ek ? ek.v : null; rohTags.eigenkapital = ek ? ek.tag : null; if (ek) { z.roh.eigenkapital++; if (ek.i > 0) z.roh.eigenkapitalFallback++; if (ek.r < rang) erstVonFrueher++; }
    var akf = ak[fi], aktien = akf ? (aktienKorr[fi] !== undefined ? aktienKorr[fi] : akf.v) : null;
    if (aktien === null) akf = null;   /* Waechter hat verworfen: Wert, Tag und Fallback-Marke weg wie bei "keine Aktienzahl" */
    roh.aktien = aktien; rohTags.aktien = akf ? akf.tag : null; if (akf) { z.roh.aktien++; zaehl(z.roh.aktienJeTag, akf.tag); if (akf.r < rang) erstVonFrueher++; }

    var quartaleW = {}, wege = {}, qTags = {}, summe = {}, luecken = {};
    SUMMEN.forEach(function (g) {
      var vs = [], code = '', tags = {}, n0 = 0, n4 = 0;
      for (var k = 0; k < 8; k++) {
        var qw = quartalswert(cik, Z.GRUPPEN[g].tags, zurueck(P, k), rang);
        vs.push(qw ? qw.v : null); code += qw ? WEG_CODE[qw.weg] : '-';
        if (qw) { tags[qw.tag] = 1; zaehl(z.wege[g], qw.weg); if (k < 4) n0++; else n4++; } else { z.luecken[g].jeQuartal[k]++; }
      }
      quartaleW[g] = vs; wege[g] = code; qTags[g] = Object.keys(tags).sort();
      summe[g] = n0 === 4 ? vs[0] + vs[1] + vs[2] + vs[3] : null;
      summe[g + 'Vor'] = n4 === 4 ? vs[4] + vs[5] + vs[6] + vs[7] : null;
      luecken[g] = 8 - n0 - n4;
    });
    var A0 = roh.vermoegen, A4 = wert(cik, 'Assets', zurueck(P, 4), 0, rang);
    /* 2d: Vorjahresbestand aus der Huelle */
    var huelle = false, huelleD4 = false;
    if (A0 > 0) for (var hk = 4; hk <= 7; hk++) { var Ak = hk === 4 ? A4 : wert(cik, 'Assets', zurueck(P, hk), 0, rang); if (Ak > 0 && Math.abs(log6(Ak) - log6(A0)) > D4_LOG) { huelle = true; if (hk === 4) huelleD4 = true; } }
    if (huelle) {
      d4.huelle++; if (huelleD4) { d4.huelleD4++; } else d4.huelleNurD5bisD7++;
      if (d4.beispiele.length < 20) d4.beispiele.push({ adsh: f.adsh, sym: reihenJeCik[cik], form: f.form, period: iso(P), filed: iso(f.filed), vermoegen: A0, vermoegenVor: A4, nurD5bisD7: !huelleD4 });
      if (huelleD4) A4 = null;
      SUMMEN.forEach(function (g) { summe[g + 'Vor'] = null; });
    }
    SUMMEN.forEach(function (g) { if (summe[g] === null) z.luecken[g].summe4q++; if (summe[g + 'Vor'] === null) z.luecken[g].summe4qVor++; });
    var roa = (summe.netto !== null && A0 > 0) ? summe.netto / A0 : null;
    var roaVor = (summe.nettoVor !== null && A4 > 0) ? summe.nettoVor / A4 : null;
    var fm = (roa !== null && roaVor !== null) ? roa - roaVor : null;
    var uw = (summe.umsatz !== null && summe.umsatzVor > 0) ? summe.umsatz / summe.umsatzVor - 1 : null;
    if (summe.netto !== null) z.abgeleitet.summe4qNetto++; if (roa !== null) z.abgeleitet.roa++; if (fm !== null) z.abgeleitet.fm++; if (uw !== null) z.abgeleitet.umsatzWachstum++;

    var vd = verdacht[f.adsh];
    var zeile = { sym: reihenJeCik[cik], cik: cik, sic: f.sic, sektor: Z.sektorVonSic(f.sic), form: f.form, period: iso(P), filed: iso(f.filed), accepted: f.accepted, fy: f.fy, fp: f.fp, q: f.q, adsh: f.adsh,
      roh: { umsatz: roh.umsatz, netto: roh.netto, operativ: roh.operativ, umsatzkosten: roh.umsatzkosten, fue: roh.fue, vermoegen: roh.vermoegen, eigenkapital: roh.eigenkapital, aktien: roh.aktien, qtrs: sollQ },
      rohTags: { umsatz: rohTags.umsatz, netto: rohTags.netto, operativ: rohTags.operativ, umsatzkosten: rohTags.umsatzkosten, fue: rohTags.fue, eigenkapital: rohTags.eigenkapital, aktien: rohTags.aktien },
      quartale: quartaleW, wege: wege, quartalsTags: qTags,
      summe4q: summe, vermoegenVor: A4,
      abgeleitet: { roa: roa, roaVor: roaVor, fm: fm, umsatzWachstum: uw },
      marken: { luecken: luecken, erstVonFrueher: erstVonFrueher, nettoFallback: rohTags.netto && rohTags.netto !== 'NetIncomeLoss' ? 1 : 0, eigenkapitalFallback: ek && ek.i > 0 ? ek.i : 0, aktienFallback: akf ? akf.i : null,
        aktienSkala: skalaMarke[fi] || null, einheit: vd ? 'verdacht' : null, einheitFakt: vd ? vd.tag : null, d4: huelle ? 'huelle' : null } };
    var jahr = String(Math.floor(f.filed / 10000));
    if (jahr !== aktJahr) { if (out && puffer.length) { out.write(puffer.join('\n') + '\n'); puffer = []; } oeffneJahr(jahr); }
    puffer.push(JSON.stringify(zeile));
    if (puffer.length >= 2000) { out.write(puffer.join('\n') + '\n'); puffer = []; }
    z.zeilen.gesamt++; zaehl(z.zeilen.jeJahr, jahr);
  }
  if (out && puffer.length) out.write(puffer.join('\n') + '\n');
  await Promise.all(Object.keys(stroeme).map(function (j) { return new Promise(function (ok) { stroeme[j].on('finish', ok); if (stroeme[j] !== out) ok(); else out.end(); }); }));
  Object.keys(stroeme).forEach(function (j) { fs.renameSync(path.join(ZIEL, 'tafel-' + j + '.jsonl.teil'), path.join(ZIEL, 'tafel-' + j + '.jsonl')); });
  z.v11.d4 = d4;
  console.log('D4 Huelle:', d4.huelle, '(D4', d4.huelleD4 + ', nur D5-D7', d4.huelleNurD5bisD7 + ')');

  fs.writeFileSync(path.join(ZIEL, '_reihen.json'), JSON.stringify({ kennung: KENNUNG, reihen: reihenMeta, ciks: reihenJeCik }));
  fs.writeFileSync(path.join(ZIEL, '_auslaend.json'), JSON.stringify({ kennung: KENNUNG, ciks: auslaend }));
  fs.readdirSync(ZIEL).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f) || f === '_reihen.json' || f === '_auslaend.json' || f === '_neudarstellungen.json'; }).sort().forEach(function (f) { hashes[f] = { sha256: sha(path.join(ZIEL, f)), bytes: fs.statSync(path.join(ZIEL, f)).size }; });
  z.hashes = hashes; z.sekunden = Math.round((Date.now() - t0) / 1000); z.stand = new Date().toISOString();
  fs.writeFileSync(path.join(ZIEL, '_bau.json'), JSON.stringify(z, null, 1));
  console.log(JSON.stringify({ filings: z.filings.panelUsStandard, zeilen: z.zeilen, fakten: { eingefuegt: z.fakten.eingefuegt, neudarstellungen: z.fakten.neudarstellungen, rangUmkehr: z.fakten.rangUmkehr, einheitVerdachtUebersprungen: z.fakten.einheitVerdachtUebersprungen }, quartalsgrenzen: z.quartalsgrenzen, abgeleitet: z.abgeleitet, sekunden: z.sekunden }, null, 1));
}
main().catch(function (e) { console.error(e); process.exit(1); });
