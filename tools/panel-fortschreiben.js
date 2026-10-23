'use strict';
/* PANEL-FORTSCHREIBUNG (Auftrag Nr. 123, 23.10.2026) - das Kurspanel der Pruefstrasse (v2.3) monatlich verlaengern.
 *
 *   node tools/panel-fortschreiben.js --trocken  [--monat YYYY-MM | --bis YYYY-MM-DD] [--stamm <ordner>]
 *   node tools/panel-fortschreiben.js --schreiben [dieselben]          (verlangt den Trockenlauf mit denselben Pruefsummen)
 *   node tools/panel-fortschreiben.js --pruefen-ordner <ordner>        (Pruefsummen eines geschriebenen Ordners nachrechnen)
 * Ohne --monat/--bis: der letzte Handelstag des Vormonats (bezogen auf den Stand des Minuten-Manifests).
 * Ohne --stamm: der juengste Ordner voll-v23f-YYYY-MM mit Fortschreibung, sonst voll-v23c (Bau 2c).
 * Rueckgabe: 0 fertig / nichts zu tun / schon gebaut, 1 Befund oder Fehler (nichts geschrieben), 2 Archiv noch nicht so weit (morgen wieder).
 *
 * WAS ES TUT (LIESMICH: tools/panel-fortschreiben-LIESMICH.md):
 *  - liest das Stamm-Panel (nur lesen) und je LEBENDER Reihe die Rohdatei(en) des Minutenarchivs ab dem Jahr des Stamm-Endes
 *    (E:/Markt-Dashboard-Archiv/alpaca1m, IMMER roh - die bereinigten Kopien enden 03.09./04.10.2026);
 *  - rechnet die Tage nach dem Stamm-Ende mit derselben Tagesbildung wie der Panelbau (lesen-panel.js ladeJahr, unveraendert,
 *    nur in diesem Prozess: Kopien-Ordner abgeschaltet, Fenster bis 2035) und denselben Zeilenregeln wie paneldaten.js zeilenAus;
 *  - prueft die Wiedergabe an den ueberlappenden Tagen (jede Zeile des Stamms im Jahr des Endes, Feld fuer Feld);
 *  - FAKTOR VORWAERTS VERANKERT (Entscheid PM 23.10.): faktor_t = faktor_L x Produkt(1 / f_s) ueber die angenommenen eigenen
 *    Splits s mit L < ex_s <= t (f = new_rate / old_rate, Split-Sperre wie paneldaten.js); alte Zeilen unveraendert, die
 *    bereinigte Reihe roh / faktor bleibt am Split stetig, `roh` bleibt roh;
 *  - haengt die neuen Zeilen an (alte Jahresbloecke byte-gleich kopiert; im laufenden Jahr bleiben alte Zeilen gleich bis auf
 *    zwei gezaehlte Marken: LETZTER_TAG am alten Ende faellt weg, MASSNAHME_NAH aus Massnahmen nach dem Stamm-Ende kommt dazu);
 *  - lebend nach der Regel von lebenszeit-minuten.js (letzter Minutentag hoechstens 10 Handelstage vor dem Archivende), Abgaenge
 *    mit Grund aus den Massnahmen (cash_mergers, ... ; sonst 'verstummt');
 *  - Kontrollen (Befund = Abbruch): Zeilen je Tag, Klassenverteilung, SPY gegen archiv1d, Vorgaenger-Doppel, Nachleben,
 *    alte Bloecke byte-gleich, Wiedergabe;
 *  - Kennung bleibt querschnitt-pruefstand-2026-09-13/panel/v2.3, Stand in `bau` (v2.3+YYYY-MM), Kalender aus
 *    alpaca1m/_kalender.json, danach tools/nyse-kalender.js.
 * Schreibt: Bericht nach Markt-Dashboard-Daten/panel-fortschreibung/, Ordner studien/querschnitt-pruefstand-2026-09-13/voll-v23f-YYYY-MM/
 * (git-ignoriert ueber voll-*), ueber <ziel>.tmp und Umbenennen. Auf E: nur lesen. Kein Netz. Simulation, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var crypto = require('crypto');

var REPO = path.join(__dirname, '..');
var PS = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(PS, 'konfig.js'));
var P = require(path.join(PS, 'paneldaten.js'));
var LP = require(path.join(PS, 'lesen-panel.js'));
var NYSE = require('./nyse-kalender.js');

var WERKZEUG = 'tools/panel-fortschreiben/v1';
var KENNUNG = K.PANEL_KENNUNG_V23;
var LEBEND_TAGE = 10;                       /* lebenszeit-minuten.js: lebend = letzter Minutentag <= 10 Handelstage vor Archivende */
var NACHLEBEN_TAGE = 5;                     /* Nachleben: Zeilen mehr als 5 Handelstage nach einer Ende-Massnahme = Befund */
var DOPPEL_MIN = 5;                         /* Vorgaenger-Doppel: >= 5 neue Tage mit gleichem Schluss und gleicher Kerzenzahl */
var SPRUNG_PP = 40;                         /* Trefferliste: |rendite| > 40 % an einer neuen Zeile */
var KLASSE_MAX_PP = 3;                      /* Klassenverteilung: Anteil je Klasse neu vs. 20 Tage davor, hoechstens 3 Pp Abstand */
var SPY_MEDIAN_PP = 0.02, SPY_MAX_PP = 0.3; /* SPY-Kreuzprobe gegen archiv1d (Yahoo): |Tagesrendite-Abstand| */
var ENDE_ARTEN = ['cash_mergers', 'stock_mergers', 'stock_and_cash_mergers', 'worthless_removals', 'redemptions', 'name_changes'];
/* Ende-Gruende (QS B5): Alpaca-Wortschatz -> Wortschatz des Panels v2.3 (pruefstrasse/tafel.js ABGANG_GRUPPEN); ende_alpaca behaelt die Art */
var GRUND_KARTE = { cash_mergers: 'uebernahme', stock_mergers: 'uebernahme', stock_and_cash_mergers: 'uebernahme', worthless_removals: 'insolvenz',
  name_changes: 'umbenennung-ticker', redemptions: 'rueckzahlung', verstummt: 'verstummt' };
var SPRUNG_MARKE_PP = 50;                   /* Marke `sprung` (QS B4b): |Tagesrendite| > 50 % an einer Zeile mit MASSNAHME_NAH (+-10 Tage um eine Massnahme, auch Abspaltung ohne Faktor) */
var ABGANG_NAEHE_TAGE = 10;                 /* Ende-Massnahme hoechstens 10 Handelstage vor dem Stamm-Ende zaehlt fuer den sofortigen Abgang (QS B2) */
var KORREKTUREN = path.join(__dirname, 'panel-fortschreiben-korrekturen.json');
var PANEL_SPERRE = path.join(REPO, 'pruefstrasse', '.panel.lock');
function ulp32(v) { v = Math.abs(Math.fround(v)); if (!v) return 1.5e-45; return Math.pow(2, Math.floor(Math.log2(v)) - 23); }
function lokalHeute() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); }
/** letzter Handelstag, fuer den die Rohdaten vorliegen: <= Ende des Minuten-Manifests und der Nachlauf lief nach Boersenschluss (QS B3) */
function letzterRohTag(kal, man) {
  for (var i = kal.tage.length - 1; i >= 0; i--) { var t = kal.tage[i]; if (t <= man.ende && Date.parse(man.stand) > Date.parse(t + 'T21:15:00Z')) return t; }
  return null;
}
var KALENDER_BIS = '2035-12-31';
var BERICHTE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'panel-fortschreibung');
var BITS_GLEICH = 0xff & ~(K.M_LETZTER_TAG | K.M_MASSNAHME_NAH);
var BITS_TAG = K.M_QUELLE_REIN | K.M_SCHLUSS_ERSATZ | K.M_DICHTE_OK | K.M_STEMPEL_TAG | K.M_EROEFFNUNG_ERSATZ;

/* ---------- kleine Helfer ---------- */
function sha(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function liesJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function etTag(ms) { return new Date(ms).toISOString().slice(0, 10); }   /* Regelzeit 09:30-16:00 ET = derselbe UTC-Tag (lesen.js tagVon) */
function basisVon(ordner) { return String(ordner).replace(/~\d+$/, ''); }
function f32(x) { return Math.fround(x); }
function gleichF(a, b) { return a === b || (a !== a && b !== b); }

/* ---------- Kalender: Quelle bis zu ihrem Ende, danach die NYSE-Regel ---------- */
function kalender(wurzel) {
  var j = liesJson(path.join(wurzel, 'alpaca1m', '_kalender.json'));
  var close = {}; Object.keys(j.tage).forEach(function (t) { close[t] = j.tage[t]; });
  var bisQ = Object.keys(close).sort().pop();
  var R = NYSE.tage(NYSE_nach(bisQ), KALENDER_BIS);
  Object.keys(R).forEach(function (t) { if (t > bisQ) close[t] = R[t]; });
  var tage = Object.keys(close).filter(function (t) { return t >= K.FENSTER_VON; }).sort(), idx = {};
  tage.forEach(function (t, i) { idx[t] = i; });
  return { tage: tage, idx: idx, close: close, quelleBis: bisQ };
}
function NYSE_nach(t) { return new Date(Date.parse(t + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10); }

/* ---------- Massnahmen (Stamm-Ordner + alle Nachtrag-Ordner, nur lesen) ---------- */
function massnahmenOrdner(wurzel) {
  var aus = [path.join(wurzel, 'alpaca-massnahmen')];
  fs.readdirSync(wurzel).filter(function (d) { return /^alpaca-massnahmen-nachtrag-\d{4}-\d{2}$/.test(d); }).sort()
    .forEach(function (d) { aus.push(path.join(wurzel, d)); });
  return aus.filter(function (d) { return fs.existsSync(d); });
}
var ANGEK = {};
function angekuendigt(ordner) {
  if (ANGEK[ordner]) return ANGEK[ordner];
  var p = path.join(ordner, '_angekuendigt.json'), je = {};
  if (fs.existsSync(p)) (liesJson(p).saetze || []).forEach(function (s) {
    ['symbol', 'old_symbol', 'new_symbol', 'acquiree_symbol', 'acquirer_symbol', 'source_symbol', 'new_symbol'].forEach(function (f) {
      if (s[f]) (je[s[f]] = je[s[f]] || []).push(s);
    });
  });
  return (ANGEK[ordner] = je);
}
/** alle Saetze zu einem Kuerzel aus allen Ordnern, ohne Doppel (Art + id). */
function saetzeFuer(ordnerListe, basis) {
  var gesehen = {}, aus = [];
  ordnerListe.forEach(function (o) {
    var liste = [];
    var p = path.join(o, basis + '.json');
    if (fs.existsSync(p)) { try { liste = liste.concat(liesJson(p).saetze || []); } catch (e) { /* zerrissene Datei: unten gezaehlt */ liste.fehler = true; } }
    liste = liste.concat(angekuendigt(o)[basis] || []);
    liste.forEach(function (s) { var k = s._art + '|' + (s.id || JSON.stringify(s)); if (gesehen[k]) return; gesehen[k] = 1; aus.push(s); });
  });
  return aus;
}
function exVon(s) { return s.ex_date || s.effective_date || s.process_date || null; }
/** eigene Splits wie lesen-panel.js eigeneSplits (dieselbe Regel, andere Quelle). */
function eigeneSplitsAus(saetze, basis) {
  var aus = [];
  saetze.forEach(function (s) {
    var art = String(s._art || ''); if (!/split/.test(art)) return;
    var eigen = (K.SPLIT_ARTEN_EIGEN.indexOf(art) !== -1 && String(s.symbol || '') === basis) ||
                (art === 'unit_splits' && String(s.old_symbol || '') === basis && String(s.new_symbol || '') === basis);
    if (!eigen) return;
    var ex = s.ex_date || s.effective_date || s.process_date; if (!ex) return;
    var alt = Number(s.old_rate), neu = Number(s.new_rate);
    if (!(isFinite(alt) && isFinite(neu) && alt > 0 && neu > 0)) return;
    var f = neu / alt; if (Math.abs(f - 1) < 1e-9) return;
    if (aus.some(function (x) { return x.ex === ex && x.faktor === f; })) return;
    aus.push({ art: art, ex: ex, faktor: f });
  });
  return aus.sort(function (a, b) { return a.ex < b.ex ? -1 : a.ex > b.ex ? 1 : 0; });
}
/** Ende-Massnahmen dieses Kuerzels (es verschwindet): Datum + Art. */
function endeAus(saetze, basis) {
  var aus = [];
  saetze.forEach(function (s) {
    var art = s._art; if (ENDE_ARTEN.indexOf(art) === -1) return;
    var trifft = (/mergers$/.test(art) && s.acquiree_symbol === basis) || (art === 'name_changes' && s.old_symbol === basis && s.new_symbol !== basis) ||
                 ((art === 'worthless_removals' || art === 'redemptions') && s.symbol === basis);
    var d = s.effective_date || s.ex_date || s.process_date;
    if (trifft && d) aus.push({ art: art, datum: d });
  });
  return aus.sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
}

/* ---------- Bloecke ---------- */
function blockPuffer(sp, n, jahr) {
  var kopf = Buffer.from(JSON.stringify(Object.assign({ kennung: KENNUNG, n: n, spalten: P.SPALTEN }, { jahr: jahr })), 'utf8');
  var len = Buffer.alloc(4); len.writeUInt32LE(kopf.length, 0);
  var teile = [len, kopf];
  P.SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  return Buffer.concat(teile);
}
function stammOrdnerWahl(ps) {
  var kand = fs.readdirSync(ps).filter(function (d) { return /^voll-v23f-\d{4}-\d{2}$/.test(d) && fs.existsSync(path.join(ps, d, 'panel', '_stand.json')); }).sort();
  return path.join(ps, kand.length ? kand[kand.length - 1] : 'voll-v23c');
}

/* ---------- Manifest: letzter Minutentag je Ordner, Archivende ---------- */
function manifestLesen(wurzel) {
  var m = liesJson(path.join(wurzel, 'alpaca1m', '_manifest.json')), letzt = {}, sym = {}, ende = null;
  Object.keys(m.eintraege).forEach(function (k) {
    var o = k.split('/')[0], e = m.eintraege[k];
    if (e.sym) sym[o] = e.sym;
    if (e.letzter == null) return;
    var t = etTag(e.letzter);
    if (!letzt[o] || t > letzt[o]) letzt[o] = t;
    if (!ende || t > ende) ende = t;
  });
  return { stand: m.stand, letzt: letzt, sym: sym, ende: ende };
}

/* ---------- SPY-Referenz aus archiv1d (Yahoo, Stempel = Eroeffnung des Tages) ---------- */
function spyReferenz(pfad) {
  if (!fs.existsSync(pfad)) return null;
  var j = liesJson(pfad), m = {};
  (j.series || []).forEach(function (b) { if (b && b[1] > 0) m[etTag(b[0])] = b[1]; });
  return m;
}

/* ================= Kern: rechnen, nichts schreiben ================= */
/** opt = { stamm (Ordner mit panel/), wurzel (Archivwurzel), deckel (YYYY-MM-DD, optional), spyPfad, jetzt } */
function rechnen(opt) {
  var wurzel = opt.wurzel, stammOrd = path.join(opt.stamm, 'panel');
  var S = liesJson(path.join(stammOrd, '_stand.json'));
  if (S.kennung !== KENNUNG) throw new Error('Stamm-Kennung ' + S.kennung + ' statt ' + KENNUNG);
  var L = S.letzterVollTag, kal = kalender(wurzel), man = manifestLesen(wurzel);
  /* Stamm-Tage muessen ein Anfangsstueck des Kalenders sein */
  for (var q = 0; q < S.tage.length; q++) if (S.tage[q] !== kal.tage[q]) throw new Error('Kalender passt nicht zum Stamm an Index ' + q + ': ' + S.tage[q] + ' / ' + kal.tage[q]);
  var heute = opt.heute || lokalHeute(), zielMonat = vormonatsEnde(kal, heute), roh = letzterRohTag(kal, man);
  var deckel = opt.deckel || zielMonat;
  if (kal.idx[deckel] === undefined) throw new Error('Deckel ' + deckel + ' ist kein Handelstag');
  var B = { werkzeug: WERKZEUG, stamm: { ordner: path.basename(opt.stamm), bau: S.bau, letzterVollTag: L, zeilen: S.zeilen },
    deckel: deckel, lauftag: heute, archiv: { manifestStand: man.stand, ende: man.ende, rohdatenBis: roh, kalenderQuelleBis: kal.quelleBis }, befunde: [], warnungen: [] };
  if (deckel <= L) { B.nichtsZuTun = 'Deckel ' + deckel + ' <= Stamm-Ende ' + L; return { B: B }; }
  /* Vorbedingung: das Archiv reicht ueber den Deckel, der Nachlauf lief nach dem Deckeltag */
  if (!(roh >= deckel)) {   /* QS B3: die Rohdaten muessen den Deckel tragen - sonst kein Lauf (nie ein Panel mit altem Monat) */
    B.nichtSoWeit = 'Rohdaten liegen bis ' + roh + ' vor (Minuten-Manifest Ende ' + man.ende + ', Stand ' + man.stand + ') - Deckel ' + deckel +
      (opt.deckel ? '' : ' (Vormonatsende zum Lauftag ' + heute + ')') + ' nicht erreicht: kein Lauf';
    return { B: B };
  }
  var jahrL = +L.slice(0, 4), jahrD = +deckel.slice(0, 4);
  var stammJahre = S.jahre.map(function (j) { return j.jahr; });
  /* Bloecke ab dem Jahr vor dem Stamm-Ende laden (Umsatzfenster ueber die Jahresgrenze) */
  var geladen = {};
  stammJahre.filter(function (j) { return j >= jahrL - 1; }).forEach(function (j) { geladen[j] = P.leseBlock(path.join(stammOrd, j + '.bin'), KENNUNG); });
  /* Nullprobe: der Stamm-Block des Jahres L, unveraendert serialisiert, ist die Datei selbst */
  var bufL = fs.readFileSync(path.join(stammOrd, jahrL + '.bin'));
  if (sha(blockPuffer(geladen[jahrL], geladen[jahrL].n, jahrL)) !== sha(bufL)) throw new Error('Nullprobe: Block ' + jahrL + ' laesst sich nicht byte-gleich wieder schreiben - Format anders');

  /* Zeilen je Reihe (nur lebende) aus den geladenen Bloecken */
  var nSym = S.symbole.length, lebend = [];
  S.symbole.forEach(function (s, i) { if (s.lebend === 1) lebend.push(i); });
  var istLebend = new Uint8Array(nSym); lebend.forEach(function (i) { istLebend[i] = 1; });
  var zeilen = {};                                         /* sym -> [{jahr, i}] aufsteigend */
  Object.keys(geladen).map(Number).sort().forEach(function (j) {
    var b = geladen[j];
    for (var i = 0; i < b.n; i++) { var s = b.sym[i]; if (!istLebend[s]) continue; (zeilen[s] = zeilen[s] || []).push({ j: j, i: i }); }
  });
  var MO = massnahmenOrdner(wurzel);
  B.massnahmenOrdner = MO.map(function (d) { return path.basename(d); });
  /* Korrekturen (QS B4a): bekannte fehlende Massnahmen, nur im neuen Panel; schon im Stamm angewandte werden nicht wiederholt */
  var KOR = opt.korrekturen || (fs.existsSync(KORREKTUREN) ? liesJson(KORREKTUREN).eintraege : []);
  var schonKor = ((S.fortschreibung && S.fortschreibung.korrekturen) || []).map(function (k) { return k.schluessel; });
  var korJe = {}; (KOR || []).forEach(function (k) { var sl = k.reihe + '|' + k.art + '|' + k.ex; if (schonKor.indexOf(sl) !== -1) return; (korJe[k.reihe] = korJe[k.reihe] || []).push(Object.assign({ schluessel: sl, faktor: Number(k.new_rate) / Number(k.old_rate) }, k)); });
  var korAngewandt = [], korZeilen = {};

  /* Lesen in diesem Prozess: immer roh, Fenster bis KALENDER_BIS (lesen-panel.js bleibt unveraendert) */
  var bereinigtAlt = K.ORTE.bereinigt, fensterAlt = K.FENSTER_BIS_MAX;
  K.ORTE.bereinigt = function () { return path.join(wurzel, '__keine-kopien__'); };
  K.FENSTER_BIS_MAX = KALENDER_BIS;
  var neu = [], W = { reihen: 0, tageGleich: 0, tageRundung: 0, tageUlp: 0, tageAnders: 0, tageFehlt: 0, korrekturAusgenommen: 0, listeUlp: [], listeAnders: [], rundungJeReihe: {}, reihenAnders: [] },
    splits = { neuAngenommen: [], neuAbgelehnt: [], vorStammEndeUnbekannt: [] }, abgaenge = [], nachleben = [], spruenge = [],
    bitsLetzt = [], nahNeu = {}, dateiFehler = [], fortgeschrieben = 0, unentschieden = [];
  try {
    lebend.forEach(function (s) {
      var sym = S.symbole[s], rows = zeilen[s] || [];
      if (opt.nurReihen && opt.nurReihen.indexOf(sym.reihe) === -1) return;
      if (!rows.length) { B.warnungen.push('lebend ohne Zeile im Jahr ' + (jahrL - 1) + '+: ' + sym.reihe); return; }
      var last = rows[rows.length - 1], bl = geladen[last.j], Ltag = S.tage[bl.tag[last.i]];
      var basis = basisVon(sym.ordner), R = { reihe: sym.reihe, ordner: sym.ordner, schnittMs: null, abMs: null };
      /* Tage aus den Rohdateien ab dem Jahr des Stamm-Endes der Reihe */
      var tage = [], quelleRein = {};
      for (var j = +Ltag.slice(0, 4); j <= jahrD; j++) {
        var jr = LP.ladeJahr(R, j, kal, { eigeneSplits: [] });
        if (!jr.ok) { if (j <= jahrL || jr.grund !== 'Datei fehlt') dateiFehler.push(sym.reihe + '/' + j + ': ' + jr.grund); continue; }
        quelleRein[j] = jr.quelleRein;
        jr.tage.forEach(function (t) { if (t.tag <= deckel) tage.push(t); });
      }
      W.reihen++;
      /* Wiedergabe an den Stamm-Tagen desselben Jahres: Feld fuer Feld */
      var proTag = {}; tage.forEach(function (t) { proTag[t.tag] = t; });
      var kor = korJe[sym.reihe] || [], korAb = null;
      kor.forEach(function (k) { if (k.ex <= Ltag && (!korAb || k.ex < korAb)) korAb = k.ex; });
      /* QS B1: JEDE Stamm-Zeile des eingelesenen Jahres, Feld fuer Feld; Kurse mit Toleranz 1e-9 (Rundung), Umsaetze bis 1 f32-ulp (gelistet),
       * alles andere und fehlende Tage = echte Abweichung -> Reihe nicht fortgeschrieben, Befund. Zeilen ab einer Korrektur sind ausgenommen (gemeldet). */
      var anders = 0, fenster = [], jahrLtag = +Ltag.slice(0, 4);
      rows.forEach(function (r) {
        var b = geladen[r.j], tg = S.tage[b.tag[r.i]], T = proTag[tg];
        var u = b.umsatzReg[r.i] + b.umsatzAuktion[r.i];
        if (korAb && tg >= korAb) { W.korrekturAusgenommen++; fenster.push(T ? T.umsatzReg + T.umsatzAuktion : u); if (fenster.length > K.UMSATZ_FENSTER) fenster.shift(); return; }
        if (T) {
          var rohS = T.dateiSchluss * T.faktor, rohE = T.dateiEroeffnung * T.faktor;
          var mk = 0; if (quelleRein[+tg.slice(0, 4)]) mk |= K.M_QUELLE_REIN; if (T.schlussErsatz) mk |= K.M_SCHLUSS_ERSATZ; if (T.dichteOk) mk |= K.M_DICHTE_OK;
          if (T.stempelTag) mk |= K.M_STEMPEL_TAG; if (T.eroeffnungErsatz) mk |= K.M_EROEFFNUNG_ERSATZ;
          var glK = b.kerzen[r.i] === Math.min(65535, T.kerzen), glM = (b.marken[r.i] & BITS_TAG) === mk;
          var uR = f32(T.umsatzReg), uA = f32(T.umsatzAuktion);
          var ulpR = b.umsatzReg[r.i] === uR ? 0 : (Math.abs(b.umsatzReg[r.i] - uR) <= ulp32(uR) ? 1 : 2);
          var ulpA = b.umsatzAuktion[r.i] === uA ? 0 : (Math.abs(b.umsatzAuktion[r.i] - uA) <= ulp32(uA) ? 1 : 2);
          var kursGleich = b.rohSchluss[r.i] === rohS && b.rohEroeffnung[r.i] === rohE;
          var kursRund = Math.abs(b.rohSchluss[r.i] / rohS - 1) < 1e-9 && Math.abs(b.rohEroeffnung[r.i] / rohE - 1) < 1e-9;
          if (!glK || !glM || ulpR === 2 || ulpA === 2 || !kursRund) {
            anders++; W.tageAnders++;
            if (W.listeAnders.length < 500) W.listeAnders.push({ reihe: sym.reihe, tag: tg, felder: [!glK && 'kerzen', !glM && 'marken', ulpR === 2 && 'umsatzReg', ulpA === 2 && 'umsatzAuktion', !kursRund && 'kurs'].filter(Boolean) });
          } else if (ulpR || ulpA) {
            W.tageUlp++; W.listeUlp.push({ reihe: sym.reihe, tag: tg, felder: [ulpR && 'umsatzReg', ulpA && 'umsatzAuktion'].filter(Boolean), stamm: ulpA ? b.umsatzAuktion[r.i] : b.umsatzReg[r.i], neu: ulpA ? uA : uR });
          } else if (kursGleich) W.tageGleich++;
          else { W.tageRundung++; W.rundungJeReihe[sym.reihe] = (W.rundungJeReihe[sym.reihe] || 0) + 1; }
          fenster.push(T.umsatzReg + T.umsatzAuktion);                      /* f64 wie im Bau */
        } else {
          if (+tg.slice(0, 4) >= jahrLtag) { anders++; W.tageFehlt++; if (W.listeAnders.length < 500) W.listeAnders.push({ reihe: sym.reihe, tag: tg, felder: ['Tag fehlt in der Rohdatei'] }); }
          fenster.push(u);
        }
        if (fenster.length > K.UMSATZ_FENSTER) fenster.shift();
      });
      if (anders) { W.reihenAnders.push(sym.reihe + ' (' + anders + ')'); return; }   /* nicht fortgeschrieben - Befund unten */

      /* Massnahmen: Splits nach dem Stamm-Ende (vorwaerts), Naehe-Marke, Ende */
      var saetze = saetzeFuer(MO, basis), eig = eigeneSplitsAus(saetze, basis);
      eig.forEach(function (e) { if (e.ex > S.tage[Math.max(0, S.tage.indexOf(Ltag) - 10)] && e.ex <= Ltag && !LP.eigeneSplits(R).some(function (x) { return x.ex === e.ex; }) && !kor.some(function (k) { return k.ex === e.ex; })) splits.vorStammEndeUnbekannt.push({ reihe: sym.reihe, ex: e.ex, faktor: e.faktor }); });
      kor.forEach(function (k) { if (k.ex > Ltag && !eig.some(function (e) { return e.ex === k.ex; })) eig.push({ art: k.art, ex: k.ex, faktor: k.faktor, korrektur: k.schluessel }); });
      var neuS = eig.filter(function (e) { return e.ex > Ltag && e.ex <= deckel; });
      var neuTage = tage.filter(function (t) { return t.tag > Ltag; });
      var Lb = geladen[last.j], Li = last.i, fL = Lb.faktor[Li];
      /* Korrektur im Stamm-Zeitraum (QS B4a): faktor ab dem Ex-Tag vorwaerts / f, Rendite am Ex-Tag neu, roh bleibt - nur im Jahr des Stamm-Endes */
      kor.filter(function (k) { return k.ex <= Ltag; }).forEach(function (k) {
        if (+k.ex.slice(0, 4) !== jahrL) { B.befunde.push('Korrektur ' + k.schluessel + ' traefe einen alten Jahresblock - nicht angewandt'); return; }
        var ab = rows.filter(function (r) { return r.j === jahrL && S.tage[geladen[r.j].tag[r.i]] >= k.ex; });
        var vor = rows.filter(function (r) { return S.tage[geladen[r.j].tag[r.i]] < k.ex; }).pop();
        if (!ab.length || !vor) { B.befunde.push('Korrektur ' + k.schluessel + ': keine Zeilen um den Ex-Tag'); return; }
        var b0 = geladen[ab[0].j], bv = geladen[vor.j];
        var spK = P.splitSperre([{ tag: S.tage[bv.tag[vor.i]], dateiSchluss: bv.rohSchluss[vor.i], faktor: 1 }, { tag: S.tage[b0.tag[ab[0].i]], dateiSchluss: b0.rohSchluss[ab[0].i], faktor: 1 }], [{ art: k.art, ex: k.ex, faktor: k.faktor }], sym.reihe);
        if (!spK.akzeptiert.length) { B.befunde.push('Korrektur ' + k.schluessel + ': Rohreihe zeigt keinen passenden Sprung (Split-Sperre)'); return; }
        var fVor = bv.faktor[vor.i], bVor = bv.rohSchluss[vor.i] / fVor, n0 = 0;
        ab.forEach(function (r, q3) {
          var b3 = geladen[r.j], nf = b3.faktor[r.i] / k.faktor, kz = { faktor: nf };
          if (q3 === 0) { var bt = b3.rohSchluss[r.i] / nf; kz.rendite = (bVor > 0 && bt > 0) ? 100 * (bt / bVor - 1) : NaN; }
          korZeilen[r.j + ':' + r.i] = kz; n0++;
        });
        fL = fL / k.faktor;
        korAngewandt.push({ schluessel: k.schluessel, reihe: sym.reihe, ex: k.ex, faktor: k.faktor, zeilen: n0, renditeExNeu: korZeilen[ab[0].j + ':' + ab[0].i].rendite, renditeExAlt: b0.rendite[ab[0].i], quelle: k.quelle });
      });
      var probe = [{ tag: Ltag, dateiSchluss: Lb.rohSchluss[Li], faktor: 1 }].concat(neuTage.map(function (t) { return { tag: t.tag, dateiSchluss: t.dateiSchluss * t.faktor, faktor: 1 }; }));
      var sp = P.splitSperre(probe, neuS, sym.reihe);
      sp.akzeptiert.forEach(function (e) { splits.neuAngenommen.push({ reihe: sym.reihe, ex: e.ex, faktor: e.faktor }); });
      sp.abgelehnt.forEach(function (e) { splits.neuAbgelehnt.push(e); });
      var nah = new Set();
      saetze.forEach(function (m) {
        if (K.MASSNAHMEN_ARTEN.indexOf(m._art) === -1) return;
        var ex = exVon(m); if (!ex || ex <= Ltag) return;
        if ((m.symbol || m.old_symbol || m.source_symbol) && [m.symbol, m.old_symbol, m.source_symbol, m.new_symbol].indexOf(basis) === -1) return;
        var i0 = kal.idx[ex]; if (i0 === undefined) { for (var q2 = 0; q2 < kal.tage.length; q2++) if (kal.tage[q2] > ex) { i0 = q2; break; } }
        if (i0 === undefined) return;
        for (var d = Math.max(0, i0 - K.MASSNAHMEN_FENSTER_TAGE); d <= Math.min(kal.tage.length - 1, i0 + K.MASSNAHMEN_FENSTER_TAGE); d++) nah.add(kal.tage[d]);
      });
      nahNeu[s] = nah;
      /* Zeilen */
      var vorher = proTag[Ltag] ? { b: proTag[Ltag].dateiSchluss * (proTag[Ltag].faktor / fL) } : { b: Lb.rohSchluss[Li] / fL };
      var meine = [];
      neuTage.forEach(function (T) {
        var f = fL; sp.akzeptiert.forEach(function (e) { if (e.ex <= T.tag) f = f / e.faktor; });
        var bT = T.dateiSchluss * (T.faktor / f), rendite = (vorher.b > 0 && bT > 0) ? 100 * (bT / vorher.b - 1) : NaN;
        var marken = 0, jahr = +T.tag.slice(0, 4);
        if (quelleRein[jahr]) marken |= K.M_QUELLE_REIN; if (T.schlussErsatz) marken |= K.M_SCHLUSS_ERSATZ; if (T.dichteOk) marken |= K.M_DICHTE_OK;
        if (nah.has(T.tag)) marken |= K.M_MASSNAHME_NAH; if (T.stempelTag) marken |= K.M_STEMPEL_TAG; if (T.eroeffnungErsatz) marken |= K.M_EROEFFNUNG_ERSATZ;
        if (!(rendite === rendite)) marken |= K.M_KEINE_RENDITE;
        var klasse = fenster.length >= K.UMSATZ_MIN_TAGE ? K.klasseIndex(P.median(fenster)) : -1;
        fenster.push(T.umsatzReg + T.umsatzAuktion); if (fenster.length > K.UMSATZ_FENSTER) fenster.shift();
        var z = { sym: s, tag: kal.idx[T.tag], tagText: T.tag, jahr: jahr, marken: marken, klasse: klasse, kerzen: Math.min(65535, T.kerzen),
          rohSchluss: T.dateiSchluss * T.faktor, rohEroeffnung: T.dateiEroeffnung * T.faktor, faktor: f, rendite: rendite,
          renditeOC: T.dateiEroeffnung > 0 ? 100 * (T.dateiSchluss / T.dateiEroeffnung - 1) : NaN, umsatzReg: T.umsatzReg, umsatzAuktion: T.umsatzAuktion };
        if (Math.abs(rendite) > SPRUNG_PP) spruenge.push({ reihe: sym.reihe, tag: T.tag, rendite: +rendite.toFixed(2) });
        meine.push(z); vorher = { b: bT };
      });
      if (meine.length) { meine[meine.length - 1].marken |= K.M_LETZTER_TAG; bitsLetzt.push(last); fortgeschrieben++; }
      meine.forEach(function (z) { neu.push(z); });
      /* lebend / Abgang (Regel lebenszeit-minuten.js) und Nachleben */
      var ende = endeAus(saetze, basis), letzterMin = man.letzt[sym.ordner];
      /* Bezug ist der DECKEL: wer nach dem Deckel verstummt, lebt in diesem Stand noch (sein Ende kommt mit dem naechsten Monat) */
      var lmD = letzterMin && letzterMin > deckel ? deckel : letzterMin;
      var still = lmD && kal.idx[lmD] !== undefined ? kal.idx[deckel] - kal.idx[lmD] : 1e9;
      var letzteZeile = meine.length ? meine[meine.length - 1].tagText : Ltag;
      /* QS B2: Abgang SOFORT bei einer Ende-Massnahme (Uebernahme, Fusion, Umbenennung, worthless) bis zum Deckel ohne Zeile danach;
       * sonst nach mehr als 10 stillen Handelstagen; 1-10 stille Tage ohne Massnahme = Trefferliste 'unentschieden' (bleibt lebend). */
      var iLetzt = kal.idx[letzteZeile], iL0 = kal.idx[Ltag];
      var sofort = ende.filter(function (e) {
        var iE = kal.idx[e.datum] !== undefined ? kal.idx[e.datum] : kal.tage.findIndex(function (t) { return t >= e.datum; });
        return e.datum <= deckel && iE >= iL0 - ABGANG_NAEHE_TAGE && iLetzt <= iE + 1;
      }).pop();
      if (sofort || still > LEBEND_TAGE) {
        var grund = sofort || ende.filter(function (e) { return e.datum <= NYSE_plus(kal, letzteZeile, 30) && kal.idx[e.datum] !== undefined && kal.idx[e.datum] >= iL0 - ABGANG_NAEHE_TAGE; }).pop();
        abgaenge.push({ s: s, reihe: sym.reihe, ende_datum: letzteZeile, ende_grund: GRUND_KARTE[grund ? grund.art : 'verstummt'] || 'sonstige', ende_alpaca: grund ? grund.art : null,
          grundDatum: grund ? grund.datum : null, letzterMinutentag: letzterMin || null, regel: sofort ? 'Ende-Massnahme' : 'mehr als ' + LEBEND_TAGE + ' Handelstage still' });
      } else if (still >= 1 && still <= LEBEND_TAGE) unentschieden.push(sym.reihe + ' (' + still + ' Tage still, letzter Minutentag ' + letzterMin + ')');
      ende.forEach(function (e) {
        if (e.datum <= Ltag || kal.idx[e.datum] === undefined && !kal.tage.some(function (t) { return t >= e.datum; })) return;
        var iE = kal.idx[e.datum] !== undefined ? kal.idx[e.datum] : kal.tage.findIndex(function (t) { return t >= e.datum; });
        var spaet = meine.filter(function (z) { return z.tag > iE + NACHLEBEN_TAGE; }).length;
        if (spaet) nachleben.push({ reihe: sym.reihe, art: e.art, datum: e.datum, zeilenDanach: spaet });
      });
    });
  } finally { K.ORTE.bereinigt = bereinigtAlt; K.FENSTER_BIS_MAX = fensterAlt; }

  /* ---------- neue Bloecke ---------- */
  neu.sort(function (a, b) { return a.tag - b.tag || a.sym - b.sym; });
  var letzterStammTag = S.letzterVollTagIdx;
  if (neu.length && neu[0].tag <= letzterStammTag) throw new Error('neue Zeile am/vor dem Stamm-Ende - Ordnung (tag, sym) waere verletzt');
  var bloecke = {}, bitsGeaendert = { letzterTagEntfernt: 0, massnahmeNahGesetzt: 0 };
  var bitsLetztSet = {}; bitsLetzt.forEach(function (r) { bitsLetztSet[r.j + ':' + r.i] = 1; });
  var alleJahre = stammJahre.slice(); for (var y = jahrL; y <= jahrD; y++) if (alleJahre.indexOf(y) === -1) alleJahre.push(y);
  alleJahre.sort();
  alleJahre.forEach(function (j) {
    var neuJ = neu.filter(function (z) { return z.jahr === j; });
    if (j < jahrL) { bloecke[j] = { kopie: true }; return; }
    var alt = geladen[j] || { n: 0 }, n = alt.n + neuJ.length, sp = P.leer(Math.max(1, n));
    for (var i = 0; i < alt.n; i++) {
      P.SPALTEN.forEach(function (c) { sp[c.name][i] = alt[c.name][i]; });
      var kz = korZeilen[j + ':' + i]; if (kz) { sp.faktor[i] = kz.faktor; if (kz.rendite !== undefined) sp.rendite[i] = kz.rendite; }
      var m = alt.marken[i];
      if (bitsLetztSet[j + ':' + i] && (m & K.M_LETZTER_TAG)) { m &= ~K.M_LETZTER_TAG; bitsGeaendert.letzterTagEntfernt++; }
      var nh = nahNeu[alt.sym[i]];
      if (nh && nh.has(S.tage[alt.tag[i]]) && !(m & K.M_MASSNAHME_NAH)) { m |= K.M_MASSNAHME_NAH; bitsGeaendert.massnahmeNahGesetzt++; }
      sp.marken[i] = m;
    }
    neuJ.forEach(function (z, k) {
      var i2 = alt.n + k;
      sp.sym[i2] = z.sym; sp.tag[i2] = z.tag; sp.marken[i2] = z.marken; sp.klasse[i2] = z.klasse; sp.kerzen[i2] = z.kerzen;
      sp.rohSchluss[i2] = z.rohSchluss; sp.rohEroeffnung[i2] = z.rohEroeffnung; sp.faktor[i2] = z.faktor; sp.rendite[i2] = z.rendite;
      sp.renditeOC[i2] = z.renditeOC; sp.umsatzReg[i2] = z.umsatzReg; sp.umsatzAuktion[i2] = z.umsatzAuktion;
    });
    bloecke[j] = { puffer: blockPuffer(sp, n, j), n: n, sp: sp, neu: neuJ.length };
  });

  /* ---------- Marke `sprung` (QS B4b): ueber ALLE Zeilen des neuen Panels; eigene Liste im Stand, weil die acht Markenbits belegt sind ---------- */
  var sprungZeilen = [], sprungNeu = 0, sprungBeispiele = [];
  alleJahre.forEach(function (j) {
    var b = bloecke[j].kopie ? P.leseBlock(path.join(stammOrd, j + '.bin'), KENNUNG) : bloecke[j].sp, n = bloecke[j].kopie ? b.n : bloecke[j].n;
    for (var i = 0; i < n; i++) {
      if (!(Math.abs(b.rendite[i]) > SPRUNG_MARKE_PP) || !(b.marken[i] & K.M_MASSNAHME_NAH)) continue;
      sprungZeilen.push([b.sym[i], b.tag[i]]);
      if (b.tag[i] > letzterStammTag) sprungNeu++;
      if (sprungBeispiele.length < 60) sprungBeispiele.push(S.symbole[b.sym[i]].reihe + ' ' + kal.tage[b.tag[i]] + ' ' + b.rendite[i].toFixed(1) + ' %');
    }
  });
  sprungZeilen.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });

  /* ---------- Stand ---------- */
  var T = JSON.parse(JSON.stringify(S));
  var bisJahr = jahrD + '-12-31';
  T.tage = kal.tage.filter(function (t) { return t <= bisJahr; });
  if (T.tage.length < S.tage.length) T.tage = S.tage.slice();
  var zjt = Object.assign({}, S.zeilenJeTag); neu.forEach(function (z) { zjt[z.tag] = (zjt[z.tag] || 0) + 1; });
  T.zeilenJeTag = zjt;
  var neueTagIdx = []; for (var ti = letzterStammTag + 1; ti <= kal.idx[deckel]; ti++) neueTagIdx.push(ti);
  /* letzter voller Tag: Regel aus paneldaten.js vereinen (>= 80 % des Medians der fuenf Vortage) */
  var letzterVoll = null, weg = [];
  for (var k2 = kal.idx[deckel]; k2 > letzterStammTag; k2--) {
    var med = P.median([1, 2, 3, 4, 5].map(function (d) { return zjt[k2 - d] || 0; }));
    if ((zjt[k2] || 0) >= 0.8 * med) { letzterVoll = k2; break; }
    weg.push({ tag: kal.tage[k2], zeilen: zjt[k2] || 0, median5: med });
  }
  if (letzterVoll === null) letzterVoll = letzterStammTag;
  T.letzterVollTagIdx = letzterVoll; T.letzterVollTag = kal.tage[letzterVoll]; T.unvollstaendigeTage = weg.reverse();
  T.jahre = alleJahre.map(function (j) { return { jahr: j, n: bloecke[j].kopie ? S.jahre.filter(function (x) { return x.jahr === j; })[0].n : bloecke[j].n }; });
  T.zeilen = T.jahre.reduce(function (a, j) { return a + j.n; }, 0);
  abgaenge.forEach(function (a) {
    var e = T.symbole[a.s]; e.lebend = 0; e.ende_grund = a.ende_grund; e.ende_datum = a.ende_datum; if (a.ende_alpaca) e.ende_alpaca = a.ende_alpaca;
    e.ende_quelle = WERKZEUG + ' (lebend-Regel lebenszeit-minuten: letzter Minutentag ' + a.letzterMinutentag + ', mehr als ' + LEBEND_TAGE + ' Handelstage vor dem Deckel ' + deckel + '; Regel: ' + a.regel + (a.grundDatum ? '; Massnahme ' + a.ende_alpaca + ' ' + a.grundDatum : '') + ')';
  });
  var monat = deckel.slice(0, 7);
  T.sprungZeilen = sprungZeilen;
  T.sprungRegel = '|rendite| > ' + SPRUNG_MARKE_PP + ' % an einer Zeile mit MASSNAHME_NAH (+-' + K.MASSNAHMEN_FENSTER_TAGE + ' Handelstage um eine Massnahme, auch Abspaltung ohne Faktor); [sym, tag]; pruefstrasse/tafel.js: kein Einstieg, Fenster darueber ohne Horizont';
  T.bau = 'v2.3+' + monat;
  T.stand = man.stand;                                    /* deterministisch: Stand der Quelle, nicht die Uhr */
  var shaBloecke = {};
  alleJahre.forEach(function (j) { shaBloecke[j] = bloecke[j].kopie ? sha(fs.readFileSync(path.join(stammOrd, j + '.bin'))) : sha(bloecke[j].puffer); });
  T.fortschreibung = { werkzeug: WERKZEUG, stamm: { ordner: path.basename(opt.stamm), bau: S.bau, letzterVollTag: L, stand: S.stand,
      sha256: (S.fortschreibung && S.fortschreibung.sha256) || null },
    deckel: deckel, manifestStand: man.stand, massnahmenOrdner: B.massnahmenOrdner, kalender: { quelleBis: kal.quelleBis, danach: NYSE.QUELLE },
    faktorRegel: 'vorwaerts verankert: faktor_t = faktor_L x Produkt(1/f_s), L < ex_s <= t, f = new_rate/old_rate (angenommene eigene Splits)',
    neueTage: neueTagIdx.length, neueZeilen: neu.length, abgaenge: abgaenge.length, splitsNeu: splits.neuAngenommen.length,
    bitsGeaendert: bitsGeaendert, sha256: shaBloecke, sprung: { zeilen: sprungZeilen.length, neu: sprungNeu },
    korrekturen: ((S.fortschreibung && S.fortschreibung.korrekturen) || []).concat(korAngewandt.map(function (k) { return { schluessel: k.schluessel, bau: 'v2.3+' + monat, zeilen: k.zeilen, quelle: k.quelle }; })),
    grundKarte: GRUND_KARTE,
    kette: ((S.fortschreibung && S.fortschreibung.kette) || []).concat([{ bau: T.bau, deckel: deckel, stamm: path.basename(opt.stamm) }]) };
  var standText = JSON.stringify(T);

  /* ---------- Kontrollen ---------- */
  var KO = {};
  /* K1 Zeilen je neuem Tag */
  var proTagN = neueTagIdx.map(function (ti2) { return { tag: kal.tage[ti2], zeilen: zjt[ti2] || 0 }; });
  KO.zeilenJeTag = { tage: proTagN, unvollstaendig: weg.length };
  /* dazu: jeder neue Tag traegt mindestens 80 % der Zeilen des letzten Stamm-Tages (ohne Teilmenge --reihen) */
  /* Soll je Tag = Zeilen am Stamm-Ende minus die Abgaenge, deren letzte Zeile vor diesem Tag liegt */
  var sollTag = zjt[letzterStammTag] || 0;
  proTagN.forEach(function (x) { x.soll = sollTag - abgaenge.filter(function (a) { return a.ende_datum < x.tag; }).length; });
  var duenn = proTagN.filter(function (x) { return x.zeilen < 0.8 * x.soll; });
  KO.zeilenJeTag.sollStammEnde = sollTag;
  if (!opt.nurReihen && duenn.length) B.befunde.push('Zeilen je Tag: ' + duenn.length + ' neue Tage unter 80 % des Solls (' + duenn.slice(0, 5).map(function (x) { return x.tag + ' ' + x.zeilen + '/' + x.soll; }).join(', ') + ')');
  if (weg.length) B.befunde.push('Zeilen je Tag: ' + weg.length + ' unvollstaendige Tage am Ende (' + weg.map(function (w) { return w.tag + ' ' + w.zeilen; }).join(', ') + ')');
  if (T.letzterVollTag !== deckel) B.befunde.push('letzter voller Tag ' + T.letzterVollTag + ' statt Deckel ' + deckel);
  /* K2 Klassenverteilung */
  function verteilung(zs) { var c = {}, n = 0; zs.forEach(function (k) { c[k] = (c[k] || 0) + 1; n++; }); Object.keys(c).forEach(function (k) { c[k] = n ? 100 * c[k] / n : 0; }); return c; }
  var vorK = [], bL = geladen[jahrL]; for (var i3 = 0; i3 < bL.n; i3++) if (bL.tag[i3] > letzterStammTag - 20 && istLebend[bL.sym[i3]]) vorK.push(bL.klasse[i3]);
  var vk = verteilung(vorK), nk = verteilung(neu.map(function (z) { return z.klasse; })), kmax = 0;
  Object.keys(Object.assign({}, vk, nk)).forEach(function (k) { kmax = Math.max(kmax, Math.abs((vk[k] || 0) - (nk[k] || 0))); });
  KO.klassen = { vorher20Tage: vk, neu: nk, maxAbstandPp: +kmax.toFixed(3) };
  KO.klassen.geprueft = !opt.nurReihen && vorK.length >= 2000;   /* unter 100 Reihen je Tag ist ein Anteil kein Mass */
  if (KO.klassen.geprueft && neu.length && kmax > KLASSE_MAX_PP) B.befunde.push('Klassenverteilung: ' + kmax.toFixed(2) + ' Pp Abstand (> ' + KLASSE_MAX_PP + ')');
  /* K3 SPY gegen archiv1d */
  var spyIdx = T.symbole.findIndex(function (x) { return x.reihe === 'SPY'; }), ref = spyReferenz(opt.spyPfad || [path.join(wurzel, 'archiv1d', 'bars_1d_SPY.json'), path.join(wurzel, 'archiv1d', 'etf', 'bars_1d_SPY.json')].filter(function (p) { return fs.existsSync(p); })[0] || 'fehlt');
  var spyNeu = neu.filter(function (z) { return z.sym === spyIdx; }), ab = [];
  if (ref) spyNeu.forEach(function (z) {
    var i4 = kal.tage.indexOf(z.tagText), vt = null; for (var v = i4 - 1; v >= 0; v--) if (ref[kal.tage[v]]) { vt = kal.tage[v]; break; }
    if (ref[z.tagText] && vt && z.rendite === z.rendite) ab.push(Math.abs(z.rendite - 100 * (ref[z.tagText] / ref[vt] - 1)));
  });
  ab.sort(function (a, b) { return a - b; });
  KO.spy = { neueZeilen: spyNeu.length, verglichen: ab.length, medianPp: ab.length ? +P.median(ab).toFixed(4) : null, maxPp: ab.length ? +ab[ab.length - 1].toFixed(4) : null };
  if (neu.length && (!ref || ab.length < spyNeu.length - 2 || !spyNeu.length)) B.befunde.push('SPY-Kreuzprobe: ' + (ref ? ab.length + ' von ' + spyNeu.length + ' neuen SPY-Tagen vergleichbar' : 'archiv1d/(etf/)bars_1d_SPY.json fehlt'));
  else if (ab.length && (KO.spy.medianPp > SPY_MEDIAN_PP || KO.spy.maxPp > SPY_MAX_PP)) B.befunde.push('SPY-Kreuzprobe: Median ' + KO.spy.medianPp + ' / Max ' + KO.spy.maxPp + ' Pp');
  /* K4 Vorgaenger-Doppel */
  var schl = {}, paare = {};
  neu.forEach(function (z) { var k = z.tag + '|' + z.rohSchluss + '|' + z.kerzen; (schl[k] = schl[k] || []).push(z.sym); });
  Object.keys(schl).forEach(function (k) { var l = schl[k]; if (l.length < 2) return; for (var a = 0; a < l.length; a++) for (var b2 = a + 1; b2 < l.length; b2++) { var pk = l[a] + '|' + l[b2]; paare[pk] = (paare[pk] || 0) + 1; } });
  KO.doppel = Object.keys(paare).filter(function (pk) { return paare[pk] >= DOPPEL_MIN; }).map(function (pk) { var x = pk.split('|'); return T.symbole[+x[0]].reihe + ' = ' + T.symbole[+x[1]].reihe + ' (' + paare[pk] + ' Tage)'; });
  if (KO.doppel.length) B.befunde.push('Vorgaenger-Doppel: ' + KO.doppel.join(', '));
  /* K5 Nachleben */
  KO.nachleben = nachleben;
  if (nachleben.length) B.befunde.push('Nachleben: ' + nachleben.map(function (x) { return x.reihe + ' ' + x.art + ' ' + x.datum + ' (' + x.zeilenDanach + ' Zeilen danach)'; }).join(', '));
  /* K6 Wiedergabe */
  KO.wiedergabe = W;
  if (W.reihenAnders.length) B.befunde.push('Wiedergabe: ' + W.reihenAnders.length + ' Reihen mit echter Abweichung (' + W.tageAnders + ' Zeilen, davon ' + W.tageFehlt + ' fehlende Tage): ' + W.reihenAnders.slice(0, 20).join(', '));
  if (W.tageUlp) B.warnungen.push('Wiedergabe: ' + W.tageUlp + ' Zeilen mit Umsatz 1 f32-ulp neben dem Stamm: ' + W.listeUlp.map(function (x) { return x.reihe + ' ' + x.tag + ' ' + x.felder.join('+'); }).join(', '));
  if (W.korrekturAusgenommen) B.warnungen.push('Wiedergabe: ' + W.korrekturAusgenommen + ' Stamm-Zeilen wegen Korrektur ausgenommen: ' + korAngewandt.map(function (k) { return k.schluessel + ' (' + k.zeilen + ' Zeilen)'; }).join(', '));
  KO.korrekturen = korAngewandt;
  KO.sprung = { zeilen: sprungZeilen.length, neu: sprungNeu, beispiele: sprungBeispiele };
  KO.unentschieden = unentschieden;
  if (unentschieden.length) B.warnungen.push('unentschieden (1-' + LEBEND_TAGE + ' Tage still, ohne Ende-Massnahme, bleiben lebend): ' + unentschieden.join(', '));
  if (dateiFehler.length) B.befunde.push('Dateien: ' + dateiFehler.length + ' nicht lesbar: ' + dateiFehler.slice(0, 10).join(', '));
  /* K7 alte Bloecke byte-gleich (Kopien: Pruefsumme der Stamm-Datei; beim Schreiben nachgerechnet) */
  var vorJahre = alleJahre.filter(function (j) { return j < jahrL; });
  KO.alteBloecke = { jahre: vorJahre, sha256: vorJahre.map(function (j) { return shaBloecke[j].slice(0, 12); }) };
  if (S.fortschreibung && S.fortschreibung.sha256) vorJahre.forEach(function (j) { if (S.fortschreibung.sha256[j] && S.fortschreibung.sha256[j] !== shaBloecke[j]) B.befunde.push('alter Block ' + j + ' nicht byte-gleich zum Stamm'); });
  /* Trefferlisten */
  KO.spruenge = spruenge; KO.splits = splits; KO.bitsGeaendert = bitsGeaendert;
  if (splits.neuAbgelehnt.length) B.warnungen.push('abgelehnte Splits (Rohreihe ohne Sprung): ' + splits.neuAbgelehnt.map(function (e) { return e.reihe + ' ' + e.ex; }).join(', '));
  if (splits.vorStammEndeUnbekannt.length) B.warnungen.push('Splits kurz vor dem Stamm-Ende, die der Stamm nicht kannte (nicht nachgetragen, alte Zeilen bleiben): ' + splits.vorStammEndeUnbekannt.map(function (e) { return e.reihe + ' ' + e.ex; }).join(', '));
  if (spruenge.length) B.warnungen.push(spruenge.length + ' neue Zeilen mit |Rendite| > ' + SPRUNG_PP + ' %');

  B.zahlen = { reihenLebendStamm: lebend.length, reihenFortgeschrieben: fortgeschrieben, neueTage: neueTagIdx.length, ersterNeuerTag: neueTagIdx.length ? kal.tage[neueTagIdx[0]] : null,
    neueZeilen: neu.length, zeilenGesamt: T.zeilen, abgaenge: abgaenge.map(function (a) { return a.reihe + ' ' + a.ende_datum + ' ' + a.ende_grund + (a.ende_alpaca ? ' (' + a.ende_alpaca + ')' : '') + ' [' + a.regel + ']'; }),
    lebendNeu: T.symbole.filter(function (x) { return x.lebend === 1; }).length, splitsNeuAngenommen: splits.neuAngenommen, letzterVollTag: T.letzterVollTag, bau: T.bau,
    sprungZeilen: sprungZeilen.length, sprungNeu: sprungNeu, korrekturen: korAngewandt.map(function (k) { return k.schluessel + ': ' + k.zeilen + ' Zeilen, Rendite Ex-Tag ' + (+k.renditeExAlt).toFixed(1) + ' -> ' + (+k.renditeExNeu).toFixed(2) + ' %'; }),
    wiedergabe: W.tageGleich + ' gleich, ' + W.tageRundung + ' Rundung, ' + W.tageUlp + ' ulp, ' + W.tageAnders + ' anders, ' + W.korrekturAusgenommen + ' ausgenommen' };
  B.kontrollen = KO;
  B.sha256 = { bloecke: shaBloecke, stand: sha(Buffer.from(standText, 'utf8')) };
  B.bestanden = B.befunde.length === 0;
  return { B: B, bloecke: bloecke, standText: standText, jahre: alleJahre, stammOrd: stammOrd, monat: monat };
}
function NYSE_plus(kal, t, n) { var i = kal.tage.findIndex(function (x) { return x >= t; }); return kal.tage[Math.min(kal.tage.length - 1, i + n)]; }
/** letzter Handelstag des Monats vor dem Manifest-Stand */
function vormonatsEnde(kal, stand) {
  var monat = String(stand).slice(0, 7), vor = null;
  kal.tage.forEach(function (t) { if (t.slice(0, 7) < monat) vor = t; });
  return vor;
}

/* ================= Schreiben ================= */
function schreiben(E, ziel, opt) {
  opt = opt || {};
  if (fs.existsSync(ziel)) throw new Error('Ziel ' + ziel + ' liegt schon - nichts ueberschrieben');
  /* QS B6: keine Panel-Sperre der Pruefstrasse, Platz >= 2 x Panelgroesse */
  var sperre = opt.sperre || PANEL_SPERRE;
  if (fs.existsSync(sperre)) throw new Error('Sperre ' + sperre + ' liegt (Laeufer liest das Panel) - nichts geschrieben');
  var groesse = 0; fs.readdirSync(E.stammOrd).forEach(function (f) { groesse += fs.statSync(path.join(E.stammOrd, f)).size; });
  var st = fs.statfsSync(path.dirname(ziel)), frei = st.bavail * st.bsize;
  if (frei < 2 * groesse * (opt.platzFaktor || 1)) throw new Error('Platz: ' + Math.round(frei / 1e6) + ' MB frei, noetig ' + Math.round(2 * groesse / 1e6) + ' MB - nichts geschrieben');
  var tmp = ziel + '.tmp';
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  var pan = path.join(tmp, 'panel'); fs.mkdirSync(pan, { recursive: true });
  E.jahre.forEach(function (j) {
    var p = path.join(pan, j + '.bin');
    if (E.bloecke[j].kopie) fs.copyFileSync(path.join(E.stammOrd, j + '.bin'), p); else fs.writeFileSync(p, E.bloecke[j].puffer);
    var h = sha(fs.readFileSync(p));
    if (h !== E.B.sha256.bloecke[j]) throw new Error('Pruefsumme ' + j + '.bin nach dem Schreiben anders');
  });
  fs.writeFileSync(path.join(pan, '_stand.json'), E.standText);
  fs.writeFileSync(path.join(tmp, '_lauf.json'), JSON.stringify({ werkzeug: WERKZEUG, geschrieben: new Date().toISOString(), bericht: E.B.zahlen, sha256: E.B.sha256 }, null, 1));
  fs.renameSync(tmp, ziel);
}
function pruefenOrdner(ordner) {
  var S = liesJson(path.join(ordner, 'panel', '_stand.json')), f = S.fortschreibung, aus = { ordner: ordner, bau: S.bau, kennung: S.kennung, fehler: [] };
  if (!f) { aus.fehler.push('kein Feld fortschreibung'); return aus; }
  Object.keys(f.sha256).forEach(function (j) { var p = path.join(ordner, 'panel', j + '.bin'); if (!fs.existsSync(p) || sha(fs.readFileSync(p)) !== f.sha256[j]) aus.fehler.push(j + '.bin Pruefsumme anders'); });
  var st = path.join(PS, f.stamm.ordner, 'panel');
  if (fs.existsSync(st)) Object.keys(f.sha256).forEach(function (j) { if (+j < +f.stamm.letzterVollTag.slice(0, 4)) { var ps = path.join(st, j + '.bin'); if (sha(fs.readFileSync(ps)) !== f.sha256[j]) aus.fehler.push(j + '.bin nicht byte-gleich zum Stamm ' + f.stamm.ordner); } });
  aus.gueltig = !aus.fehler.length;
  return aus;
}

/* ================= Aufruf ================= */
function arg(n) { var i = process.argv.indexOf('--' + n); return i === -1 ? null : (process.argv[i + 1] && process.argv[i + 1].slice(0, 2) !== '--' ? process.argv[i + 1] : true); }
function haupt() {
  if (arg('pruefen-ordner')) { var A = pruefenOrdner(path.resolve(arg('pruefen-ordner'))); console.log(JSON.stringify(A, null, 1)); return A.gueltig ? 0 : 1; }
  var trocken = !!arg('trocken'), schreib = !!arg('schreiben');
  if (trocken === schreib) { console.log('--trocken ODER --schreiben angeben'); return 1; }
  var wurzel = K.archivWurzel(), stamm = arg('stamm') ? path.resolve(PS, arg('stamm')) : stammOrdnerWahl(PS);
  var deckel = arg('bis') || null;
  if (!deckel && arg('monat')) { var kal0 = kalender(wurzel), mo = arg('monat'); kal0.tage.forEach(function (t) { if (t.slice(0, 7) === mo) deckel = t; }); }
  var t0 = Date.now();
  console.log(new Date().toISOString() + ' Fortschreibung ' + (trocken ? 'TROCKENLAUF' : 'SCHREIBEN') + ' | Stamm ' + path.basename(stamm) + ' | Deckel ' + (deckel || 'Vormonatsende'));
  var nur = arg('reihen') ? String(arg('reihen')).split(/[,;]/).filter(Boolean) : null;
  if (nur && schreib) { console.log('--reihen nur im Trockenlauf'); return 1; }
  var E = rechnen({ stamm: stamm, wurzel: wurzel, deckel: deckel, nurReihen: nur });
  var B = E.B; B.modus = trocken ? 'trocken' : 'schreiben'; B.laufzeitS = Math.round((Date.now() - t0) / 1000);
  if (B.nichtsZuTun) { console.log('Nichts zu tun: ' + B.nichtsZuTun); return 0; }
  if (B.nichtSoWeit) { console.log('Noch nicht: ' + B.nichtSoWeit); return 2; }
  var ziel = path.join(PS, 'voll-v23f-' + E.monat);
  fs.mkdirSync(BERICHTE, { recursive: true });
  var berichtPfad = path.join(BERICHTE, (trocken ? 'trocken-' : 'schreiben-') + B.deckel + '.json');
  fs.writeFileSync(berichtPfad, JSON.stringify(B, null, 1));
  console.log('Zahlen: ' + JSON.stringify(B.zahlen));
  console.log('Befunde: ' + (B.befunde.length ? B.befunde.join(' | ') : 'keine') + (B.warnungen.length ? ' | Warnungen: ' + B.warnungen.join(' | ') : ''));
  console.log('Bericht: ' + berichtPfad + ' (' + B.laufzeitS + ' s)');
  if (!B.bestanden) { console.log('ABBRUCH: Befund - nichts geschrieben'); return 1; }
  if (trocken) return 0;
  if (fs.existsSync(ziel)) {
    var V = pruefenOrdner(ziel), S2 = liesJson(path.join(ziel, 'panel', '_stand.json'));
    var gleich = V.gueltig && JSON.stringify(S2.fortschreibung.sha256) === JSON.stringify(B.sha256.bloecke);
    console.log('Ziel liegt schon (' + path.basename(ziel) + ') - ' + (gleich ? 'gleiche Pruefsummen, nichts zu tun' : 'ANDERE Pruefsummen - PM fragen'));
    return gleich ? 0 : 1;
  }
  /* zweiter Lauf gleich: der Trockenlauf zum selben Deckel muss dieselben Pruefsummen haben */
  var tp = path.join(BERICHTE, 'trocken-' + B.deckel + '.json');
  if (!fs.existsSync(tp)) { console.log('ABBRUCH: kein Trockenlauf ' + tp + ' - erst --trocken'); return 1; }
  var TB = liesJson(tp);
  if (JSON.stringify(TB.sha256) !== JSON.stringify(B.sha256) || TB.stamm.ordner !== B.stamm.ordner) { console.log('ABBRUCH: Trockenlauf hatte andere Pruefsummen (zweiter Lauf nicht gleich) - nichts geschrieben'); return 1; }
  schreiben(E, ziel);
  console.log('Geschrieben: ' + ziel + ' | bau ' + B.zahlen.bau + ' | ' + JSON.stringify(pruefenOrdner(ziel).gueltig ? 'Pruefsummen gueltig' : 'PRUEFSUMMEN UNGUELTIG'));
  return 0;
}
if (require.main === module) {
  var rc = 1;
  try { rc = haupt(); } catch (e) { console.log('FEHLER: ' + e.message); rc = 1; }
  process.exit(rc);
}
module.exports = { rechnen: rechnen, schreiben: schreiben, pruefenOrdner: pruefenOrdner, kalender: kalender, eigeneSplitsAus: eigeneSplitsAus,
  endeAus: endeAus, blockPuffer: blockPuffer, stammOrdnerWahl: stammOrdnerWahl, WERKZEUG: WERKZEUG, BERICHTE: BERICHTE };
