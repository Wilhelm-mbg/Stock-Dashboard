'use strict';
/* Schritt 3: aus Massnahmen-Archiv + EDGAR-Einreichungen eine Kategorie je Reihe.
 *
 * ERSTER TREFFER GEWINNT - dadurch sind die Kategorien disjunkt, ohne dass eine
 * Reihe zweimal gezaehlt werden kann. Die Reihenfolge ist inhaltlich begruendet:
 *  1 umbenennung-ticker  Das Kuerzel ist weg, das Unternehmen nicht. Muss VOR allem
 *                        anderen stehen, sonst zaehlt eine Umbenennung als Todesfall.
 *  2 uebernahme          Bar geflossenes Geld ist der haerteste Beleg, den es gibt:
 *                        der Satz steht im Massnahmen-Archiv der Handelsquelle.
 *  3 fusion-aktientausch  desgleichen ohne Bar.
 *  4 insolvenz           8-K Item 1.03 ist die Pflichtmeldung fuer Chapter 7/11.
 *  5 uebernahme (EDGAR)  8-K Item 2.01 (Vollzug) zusammen mit einem Fusionsprospekt.
 *  6 spac-ende           Ruecknahme/Aufloesung einer Mantelgesellschaft.
 *  7 zwangs-delisting    8-K Item 3.01 (Boersenregel verletzt) ohne Uebernahme.
 *  8 freiwillig          Formular 15/25 ohne 3.01: Rueckzug aus eigenem Antrieb.
 *  9 unbekannt
 *
 * WANN EDGAR ZAEHLT: die Zuordnung Kuerzel->CIK ist eine Schaetzung (Volltextsuche).
 * Sie wird nur benutzt, wenn sie BESTAETIGT ist - entweder weil das Kuerzel im Namen
 * des Registranten steht ("stark"), oder weil dieser Registrant im Zeitfenster ein
 * Abmelde-Signal eingereicht hat (25/15/3.01/1.03/2.01). Ohne Bestaetigung bleibt
 * EDGAR aussen vor; die Reihe faellt dann auf das Massnahmen-Archiv oder auf
 * "unbekannt" zurueck. Lieber eine Luecke als eine falsche Firma.
 */
var fs = require('fs');
var path = require('path');

var SUB = path.join(__dirname, 'edgar', 'cik');
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

function main() {
  var V = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene.json'), 'utf8'));
  var Z = JSON.parse(fs.readFileSync(path.join(__dirname, 'edgar-zuordnung.json'), 'utf8'));
  var zuord = Z.zuordnung || {};
  var lz = JSON.parse(fs.readFileSync('E:/Markt-Dashboard-Archiv/alpaca1m/_lebenszeit.json', 'utf8')).werte || {};
  var lebendAb = ms(V.lebendAb);
  /* Kuerzel, die heute noch Balken liefern - Ziel einer Umbenennung muss darunter sein
   * oder selbst spaeter verschwunden (Kette). Beides zaehlt als "lebt weiter". */
  var hatBalken = {};
  Object.keys(lz).forEach(function (r) { if (lz[r] && lz[r].balken > 0) hatBalken[r.replace(/~2$/, '')] = lz[r].letzter; });

  var subCache = {};
  function sub(cik) {
    if (subCache[cik] !== undefined) return subCache[cik];
    var p = path.join(SUB, cik + '.json');
    try { subCache[cik] = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { subCache[cik] = null; }
    return subCache[cik];
  }

  var tafel = [], zaehler = {}, wegZ = {};
  V.reihen.forEach(function (R) {
    var z = zuord[R.reihe] || {};
    var S = z.cik ? sub(z.cik) : null;
    if (S && S.fehlt) S = null;
    var f = fenster(S, R.letzterBalken);
    var bestaetigt = !!(S && (z.sicherheit === 'stark' || f.endsignal || f.i301 || f.i103 || f.i201));
    if (!bestaetigt) { f = leer(); }
    var E = R.massnahmeEnde;
    var u = urteil(R, E, f, S, bestaetigt, hatBalken, lebendAb);
    u.reihe = R.reihe; u.ordner = R.ordner; u.art = R.art; u.gruppe = R.gruppe;
    u.letzter_balken = R.letzterBalken;
    u.letzter_kurs_archiv = R.letzterKursArchiv;
    u.cik = bestaetigt ? z.cik : null;
    u.firma = bestaetigt && S ? S.name : null;
    u.zuordnungsweg = z.weg || null;
    u.aufschlag_pp = (u.preis_je_aktie != null && R.letzterKursArchiv > 0)
      ? Math.round(((u.preis_je_aktie - R.letzterKursArchiv) / R.letzterKursArchiv) * 1000000) / 10000 : null;
    tafel.push(u);
    zaehler[u.grund] = (zaehler[u.grund] || 0) + 1;
    wegZ[u.beleg] = (wegZ[u.beleg] || 0) + 1;
  });

  var out = { kennung: 'verschwundene-gruende-2026-09-12/v1', stand: new Date().toISOString(),
    lebendAb: V.lebendAb, fenster: { vorTage: VOR, nachTage: NACH },
    edgar: { anfragen: Z.anfragen || null, fehler: Z.fehler || null, sekunden: Z.sekunden || null, rate: Z.rate || null, rateMax: Z.rateMax || null },
    zaehler: zaehler, belegarten: wegZ, n: tafel.length, reihen: tafel };
  fs.writeFileSync(path.join(__dirname, 'verschwundene-gruende.json'), JSON.stringify(out));
  console.log(JSON.stringify(zaehler, null, 1));
  console.log('Belegarten', JSON.stringify(wegZ));
  console.log('unbekannt-Anteil', (100 * (zaehler.unbekannt || 0) / tafel.length).toFixed(1) + ' %');
}

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

module.exports = { fenster: fenster, urteil: urteil, VOR: VOR, NACH: NACH };
if (require.main === module) main();
