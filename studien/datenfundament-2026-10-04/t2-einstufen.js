'use strict';
/* T2, Schritt 3 - KOPIE von studien/verschwundene-gruende-2026-09-12/einstufen.js fuer den Trockenlauf (Auftrag Nr. 79).
 *
 * Das Original und seine Tafel bleiben unangetastet. Die Einstufungslogik (ms, tage, imFenster, leer, fenster, akz,
 * urteil) ist WOERTLICH uebernommen - test.js vergleicht den Quelltext dieser Funktionen mit dem Original. Geaendert
 * ist nur der Rahmen:
 *   - gelesen werden die Arbeitsdateien DIESES Ordners (t2-verschwundene.json mit dem letzten MINUTENTAG als Anker,
 *     t2-edgar-zuordnung.json), nicht die der Originalstudie;
 *   - Einreichungen je Firma: erst der Cache dieses Ordners (edgar/cik), dann der der Originalstudie (nur lesen);
 *   - die Zeilen-Zusammenstellung aus main() steht als Funktion stufeEin(), damit t2-edgar.js sie fuer den zweiten
 *     Durchgang benutzen kann;
 *   - geschrieben wird t2-gruende-neu.json in DIESEN Ordner, je Zeile mit dem alten Stand daneben.
 *
 * ERSTER TREFFER GEWINNT - die Kategorien und ihre Reihenfolge sind die des Originals (siehe dort).
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

var SUB_EIGEN = path.join(__dirname, 'edgar', 'cik');
var SUB_ALT = path.join(G.GRUENDE, 'edgar', 'cik');
var TAG = 86400000;
var VOR = 550, NACH = 300;                       // Fenster um den letzten Balken, in Tagen
var ENDSIGNAL = /^(25|25-NSE|25\/A|15|15-12B|15-12G|15-15D)$/;
var FUSIONSBELEG = /^(DEFM14A|PREM14A|SC 14D9|SC 13E3|S-4)$/;

function ms(iso) { return Date.parse(iso + 'T00:00:00Z'); }
function tage(a, b) { return Math.round((ms(a) - ms(b)) / TAG); }
/* Eine Kapitalmassnahme, die den Handel beendet, liegt NIE lange nach dem letzten
 * Balken - Median 1 bis 2 Tage (Probe ueber alle 4.996 Reihen). Nach hinten daher
 * hart 30 Tage, wie es die Pruefliste des Auftrags verlangt; nach vorn grosszuegig,
 * weil ein Kuerzel schon Wochen vor dem Vollzug ausgesetzt sein kann. */
function imFenster(ex, letzterBalken, vor) { var d = tage(ex, letzterBalken); return d >= -vor && d <= 30; }

function leer() { return { endsignal: null, i301: null, i103: null, i201: null, fusionsbeleg: null, f25: null, f15: null }; }

/* Die Einreichungen im Fenster, je Sorte die dem letzten Balken naechste. */
function fenster(S, letzterBalken) {
  var a = leer();
  if (!S || !S.einreichungen) return a;
  function naeher(alt, e) { return !alt || Math.abs(tage(e.d, letzterBalken)) < Math.abs(tage(alt.d, letzterBalken)) ? { d: e.d, a: e.a, f: e.f } : alt; }
  S.einreichungen.forEach(function (e) {
    var dt = tage(e.d, letzterBalken);
    if (dt < -VOR || dt > NACH) return;
    if (ENDSIGNAL.test(e.f)) { a.endsignal = naeher(a.endsignal, e); if (/^25/.test(e.f)) a.f25 = naeher(a.f25, e); else a.f15 = naeher(a.f15, e); }
    if (FUSIONSBELEG.test(e.f)) a.fusionsbeleg = naeher(a.fusionsbeleg, e);
    if (/^8-K/.test(e.f)) {
      var it = ',' + (e.it || '') + ',';
      if (it.indexOf(',3.01,') >= 0) a.i301 = naeher(a.i301, e);
      if (it.indexOf(',1.03,') >= 0) a.i103 = naeher(a.i103, e);
      if (it.indexOf(',2.01,') >= 0) a.i201 = naeher(a.i201, e);
    }
  });
  return a;
}

function akz(x) { return x ? 'EDGAR:' + x.a + ' (' + x.f + ' ' + x.d + ')' : null; }

function urteil(R, E, f, S, bestaetigt, hatBalken, lebendAb) {
  var q = 'alpaca-massnahmen:' + (E && E.id ? E.id : '-');
  /* 1 Umbenennung: das Massnahmen-Archiv nennt das neue Kuerzel; es muss im Archiv
   *   Balken haben, die NACH dem letzten Balken dieser Reihe liegen. Sonst ist die
   *   "Umbenennung" nur eine Buchung ohne Nachfolger und zaehlt nicht. */
  /* 0 Das Q am Ende. Die Boerse haengt einem Kuerzel ein Q an, wenn die Gesellschaft
   *   im Insolvenzverfahren steht (ACOR->ACORQ, AMRS->AMRSQ, APPH->APPHQ, WE->WEWKQ).
   *   Im Massnahmen-Archiv steht das als "name_changes" - also als Umbenennung. Ohne
   *   diese Regel wuerden 153 Insolvenzen als harmloser Kuerzelwechsel gezaehlt, und
   *   zwar genau die, die den Ertrag einer Delisting-Regel nach unten ziehen. */
  if (E && E.art === 'name_changes' && E.neuesKuerzel && /^[A-Z]{2,4}Q$/.test(String(E.neuesKuerzel))
      && String(E.neuesKuerzel) !== R.basis && imFenster(E.ex, R.letzterBalken, 60)) {
    var i103imFenster = f.i103 && imFenster(f.i103.d, R.letzterBalken, 550);
    return { grund: 'insolvenz', datum: i103imFenster ? f.i103.d : E.ex, quelle: i103imFenster ? akz(f.i103) : q,
      beleg: i103imFenster ? 'q-kuerzel+edgar-8K-1.03' : 'q-kuerzel', preis_je_aktie: null, nachfolger: E.neuesKuerzel };
  }
  if (E && E.art === 'name_changes' && imFenster(E.ex, R.letzterBalken, 60)) {
    var neu = E.neuesKuerzel ? String(E.neuesKuerzel).replace(/\./g, '-') : null;
    /* 991 von 1.520 Nachfolgern haben im Archiv KEINE Balken - fast durchweg Kuerzel
     * auf -F/-Y, also der Gang an den Freiverkehr (AAMC->AAMCF, ABB->ABBNY, AAU->AAUAF).
     * Das ist trotzdem eine Umbenennung und kein Todesfall: der Aktionaer behielt ein
     * handelbares Papier. Die Unterscheidung "im Archiv / nicht im Archiv" wird als
     * Feld mitgefuehrt, damit eine spaetere Studie sie trennen kann, ohne zu raten. */
    if (neu && neu !== R.basis) {
      return { grund: 'umbenennung-ticker', datum: E.ex, quelle: q, beleg: 'alpaca-name_changes', preis_je_aktie: null,
        nachfolger: E.neuesKuerzel, nachfolger_im_archiv: (hatBalken[neu] && hatBalken[neu] > ms(R.letzterBalken)) ? 1 : 0 };
    }
  }
  if (E && (E.art === 'cash_mergers' || E.art === 'stock_and_cash_mergers') && imFenster(E.ex, R.letzterBalken, 90)) {
    return { grund: 'uebernahme', datum: E.ex, quelle: q, beleg: 'alpaca-' + E.art, preis_je_aktie: (E.art === 'cash_mergers' ? E.rate : null),
      edgar_beleg: akz(f.i201) || akz(f.fusionsbeleg) || akz(f.f25) };
  }
  if (E && E.art === 'stock_mergers' && imFenster(E.ex, R.letzterBalken, 90)) {
    return { grund: 'fusion-aktientausch', datum: E.ex, quelle: q, beleg: 'alpaca-stock_mergers', preis_je_aktie: null, edgar_beleg: akz(f.i201) || akz(f.f25) };
  }
  if (f.i103) return { grund: 'insolvenz', datum: f.i103.d, quelle: akz(f.i103), beleg: 'edgar-8K-1.03', preis_je_aktie: null };
  /* Der Vollzug ist ein Ereignis, kein Formular: auch hier hoechstens 30 Tage nach dem
   * letzten Balken. Ein 2.01 drei Monate spaeter gehoert zu einem anderen Vorgang. */
  if (f.i201 && f.fusionsbeleg && imFenster(f.i201.d, R.letzterBalken, VOR)) {
    return { grund: 'uebernahme', datum: f.i201.d, quelle: akz(f.i201), beleg: 'edgar-8K-2.01+prospekt', preis_je_aktie: null, zusatz: akz(f.fusionsbeleg) };
  }
  if (E && E.art === 'redemptions' && imFenster(E.ex, R.letzterBalken, 90)) {
    var mantel = S && /acquisition (corp|co\b|company|holdings)/i.test(S.name || '');
    return { grund: mantel ? 'spac-ende' : 'freiwillig', datum: E.ex, quelle: q, beleg: 'alpaca-redemptions', preis_je_aktie: null };
  }
  if (S && /acquisition (corp|co\b|company|holdings)/i.test(S.name || '') && (f.f15 || f.f25) && !f.i201) {
    return { grund: 'spac-ende', datum: (f.f25 || f.f15).d, quelle: akz(f.f25 || f.f15), beleg: 'edgar-mantel+abmeldung', preis_je_aktie: null };
  }
  if (E && E.art === 'worthless_removals' && imFenster(E.ex, R.letzterBalken, 180)) {
    return { grund: f.i301 ? 'zwangs-delisting' : 'insolvenz', datum: E.ex, quelle: q, beleg: 'alpaca-worthless_removals', preis_je_aktie: null };
  }
  if (f.i301) return { grund: 'zwangs-delisting', datum: f.i301.d, quelle: akz(f.i301), beleg: 'edgar-8K-3.01', preis_je_aktie: null };
  if (f.f25 || f.f15) return { grund: 'freiwillig', datum: (f.f25 || f.f15).d, quelle: akz(f.f25 || f.f15), beleg: 'edgar-' + (f.f25 ? 'formular25' : 'formular15'), preis_je_aktie: null };
  return { grund: 'unbekannt', datum: null, quelle: null, beleg: bestaetigt ? 'edgar-ohne-signal' : (E ? 'massnahme-passt-nicht' : 'nichts'), preis_je_aktie: null };
}

/** Eine Zeile der Tafel - der Rumpf der Schleife aus main() des Originals, unveraendert in der Logik.
 *  R: Reihe aus t2-verschwundene.json, z: Zuordnung Kuerzel->CIK, S: Einreichungen dieser CIK (oder null). */
function stufeEin(R, z, S, hatBalken, lebendAb, bdFunde) {
  z = z || {};
  if (S && S.fehlt) S = null;
  var f = fenster(S, R.letzterBalken);
  var bestaetigt = !!(S && (z.sicherheit === 'stark' || f.endsignal || f.i301 || f.i103 || f.i201));
  if (!bestaetigt) { f = leer(); }
  var E = R.massnahmeEnde;
  var u = urteil(R, E, f, S, bestaetigt, hatBalken, lebendAb);
  if (u.grund === 'unbekannt' && bdFunde && bdFunde[R.reihe]) {
    var b = bdFunde[R.reihe];
    u = { grund: b.grund, datum: b.datum, quelle: b.quelle, beleg: 'bigdata', preis_je_aktie: (b.preis_je_aktie == null ? null : b.preis_je_aktie),
      nachfolger: b.nachfolger || null, belegtext: b.text || null };
  }
  u.reihe = R.reihe; u.ordner = R.ordner; u.art = R.art; u.gruppe = R.gruppe;
  u.letzter_balken = R.letzterBalken;
  u.letzter_kurs_archiv = R.letzterKursArchiv;
  u.cik = bestaetigt ? z.cik : null;
  u.firma = bestaetigt && S ? S.name : null;
  u.zuordnungsweg = z.weg || null;
  u.aufschlag_pp = (u.preis_je_aktie != null && R.letzterKursArchiv > 0)
    ? Math.round(((u.preis_je_aktie - R.letzterKursArchiv) / R.letzterKursArchiv) * 1000000) / 10000 : null;
  return u;
}

/** Einreichungen einer CIK: eigener Cache vor dem der Originalstudie. */
var subCache = {};
function sub(cik) {
  if (subCache[cik] !== undefined) return subCache[cik];
  var aus = null;
  [SUB_EIGEN, SUB_ALT].some(function (d) {
    var p = path.join(d, cik + '.json');
    if (!fs.existsSync(p)) return false;
    try { aus = JSON.parse(fs.readFileSync(p, 'utf8')); return true; } catch (e) { return false; }
  });
  return (subCache[cik] = aus);
}
function hatBalkenKarte() {
  /* Kuerzel, die heute noch Balken liefern - wie im Original aus den Tagesbalken der Lebenszeit-Tafel (nicht geaendert:
   * das Feld speist nur die Auskunft `nachfolger_im_archiv`, nicht den Grund). */
  var lz = G.lebenszeit().werte, hatBalken = {};
  Object.keys(lz).forEach(function (r) { if (lz[r] && lz[r].balken > 0) hatBalken[r.replace(/~2$/, '')] = lz[r].letzter; });
  return hatBalken;
}
function bigdataFunde() {
  try { return JSON.parse(fs.readFileSync(path.join(G.GRUENDE, 'bigdata-ergebnis.json'), 'utf8')).funde || {}; } catch (e) { return {}; }
}

function main() {
  var V = G.json(path.join(__dirname, 't2-verschwundene.json'));
  var Z = G.json(path.join(__dirname, 't2-edgar-zuordnung.json'));
  var zuord = Z.zuordnung || {};
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')), alt = {};
  T.reihen.forEach(function (x) { alt[x.reihe] = x; });
  var hatBalken = hatBalkenKarte(), bd = bigdataFunde(), lebendAb = ms(V.lebendAb);
  var tafel = [], zaehler = {}, wegZ = {}, offen = 0;
  V.reihen.forEach(function (R) {
    var z = zuord[R.reihe];
    if (!z || !z.fertig) { offen++; return; }
    var S = z.cik ? sub(z.cik) : null;
    var u = stufeEin(R, z, S, hatBalken, lebendAb, bd);
    u.letzter_balken_alt = R.letzterBalkenAlt; u.anker_diff_tage = R.ankerDiffTage; u.neu = R.neu; u.lebend_ab_x = R.lebendAbX;
    var a = alt[R.reihe];
    u.alt = a ? { grund: a.grund, datum: a.datum, quelle: a.quelle, beleg: a.beleg, cik: a.cik, firma: a.firma, zuordnungsweg: a.zuordnungsweg, preis_je_aktie: a.preis_je_aktie } : null;
    tafel.push(u);
    zaehler[u.grund] = (zaehler[u.grund] || 0) + 1;
    wegZ[u.beleg] = (wegZ[u.beleg] || 0) + 1;
  });
  var out = { kennung: 'datenfundament-2026-10-04/trockenlauf-t2 (KEINE Tafel - nur die neu eingestuften Zeilen)', stand: new Date().toISOString(),
    anker: 'letzter Minutentag (Manifest ' + G.manifest().stand + ')', lebendRegel: V.regel, xTrockenlauf: V.xTrockenlauf,
    fenster: { vorTage: VOR, nachTage: NACH }, edgar: Z.zaehler || null, offen: offen, zaehler: zaehler, belegarten: wegZ, n: tafel.length, reihen: tafel };
  G.schreibe('t2-gruende-neu.json', out);
  console.log('eingestuft', tafel.length, 'offen', offen);
  console.log(JSON.stringify(zaehler));
  console.log('Belegarten', JSON.stringify(wegZ));
}

module.exports = { fenster: fenster, urteil: urteil, stufeEin: stufeEin, sub: sub, hatBalkenKarte: hatBalkenKarte, bigdataFunde: bigdataFunde, VOR: VOR, NACH: NACH, ms: ms };
if (require.main === module) main();
