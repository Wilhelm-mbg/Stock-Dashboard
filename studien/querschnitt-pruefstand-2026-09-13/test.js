'use strict';
/* PRUEFUNGEN des Querschnitts-Pruefstands (VORREGISTRIERUNG §4).
 *
 * Aufruf: node --max-old-space-size=6144 test.js [--aus <panelordner>] [--kunst <kunstordner>] [--nur N,M]
 *
 * Jede Pruefung sagt, WAS sie prueft und WORAN sie scheitern wuerde. Wo eine Null auch aus Untaetigkeit
 * entstehen koennte, steht eine Positivkontrolle daneben - ein Pruefling, der nie feuert, besteht jeden
 * Leertest.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var LP = require('./lesen-panel.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var ST = require('./statistik.js');
var KP = require('./kunstpanel.js');

var A = { aus: 'voll', kunst: 'kunst', nur: null };
for (var i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--aus') A.aus = process.argv[++i];
  else if (process.argv[i] === '--kunst') A.kunst = process.argv[++i];
  else if (process.argv[i] === '--nur') A.nur = String(process.argv[++i]).split(',').map(Number);
}

var ERG = [], NR = 0;
function abschnitt(nr, titel, fn) {
  if (A.nur && A.nur.indexOf(nr) === -1) return;
  NR = nr;
  var e = { nr: nr, titel: titel, pruefungen: [], rot: 0, fehler: null };
  ERG.push(e);
  process.stdout.write('\n== ' + nr + '. ' + titel + '\n');
  try { fn(function (ok, text, extra) {
    e.pruefungen.push({ ok: !!ok, text: text, extra: extra });
    if (!ok) e.rot++;
    process.stdout.write('   ' + (ok ? 'ok  ' : 'ROT ') + text + (extra === undefined ? '' : '  [' + extra + ']') + '\n');
  }); }
  catch (err) { e.fehler = err.message + '\n' + err.stack; e.rot++; process.stdout.write('   ROT AUSNAHME: ' + err.message + '\n'); }
}

function panelDa(ordner) { return fs.existsSync(path.join(ordner, 'panel', '_stand.json')); }
var TK = null, TV = null;
function tafelKunst() { if (!TK) TK = PR.Tafel(A.kunst); return TK; }
function tafelVoll() { if (!TV) TV = PR.Tafel(A.aus); return TV; }

/* =======================================================================================
 * 1  Panel gegen das Archiv-Manifest
 * ======================================================================================= */
abschnitt(1, 'Panel-Zeilenzahl gegen die Archivdateien (Manifest)', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel unter ' + A.aus + ' - Pruefung uebersprungen');
  var T = tafelVoll();
  var M = JSON.parse(fs.readFileSync(path.join(K.ORTE.roh(), '_manifest.json'), 'utf8'));
  var symOrdner = {}; T.stand.symbole.forEach(function (s) { symOrdner[s.ordner] = s; });
  var sollTage = 0, dateien = 0;
  Object.keys(M.eintraege).forEach(function (k) {
    var e = M.eintraege[k], ord = k.split('/')[0];
    if (!symOrdner[ord] || e.jahr < 2016) return;
    sollTage += e.tage || 0; dateien++;
  });
  var ist = T.g.n;
  pr(dateien > 40000, 'Archivdateien der Panelreihen: ' + dateien, 'erwartet > 40.000');
  /* Das Panel schneidet am letzten vollstaendigen Handelstag und am Lebenszeit-/Kalenderfilter -
   * es kann also nur WENIGER Zeilen haben als das Manifest Tage zaehlt, nie mehr. */
  pr(ist <= sollTage, 'Panelzeilen ' + ist + ' <= Manifest-Tage ' + sollTage, 'Verhaeltnis ' + (ist / sollTage).toFixed(4));
  pr(ist / sollTage > 0.90, 'Panel deckt ' + (100 * ist / sollTage).toFixed(1) + ' % der Manifest-Tage', 'unter 90 % waere ein stiller Verlust');
});

/* =======================================================================================
 * 2  Stichprobe von 20 Reihen von Hand nachgerechnet - UNABHAENGIGER zweiter Leseweg
 * ======================================================================================= */
abschnitt(2, 'Stichprobe 20 Reihen: Schluss, Eroeffnung, Rendite, Umsatz gegen die Minutendateien', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel - uebersprungen');
  var T = tafelVoll(), kal = T.kal;
  /* Zweiter Leseweg: rohe Datei, eigene Tagesbildung, KEIN lesen-panel.js. */
  function handRechnung(ordner, basis, jahr, tagEt) {
    var pB = path.join(K.ORTE.bereinigt(), ordner, jahr + '.json');
    var pfad = fs.existsSync(pB) ? pB : path.join(K.ORTE.roh(), ordner, jahr + '.json');
    if (!fs.existsSync(pfad)) return null;
    var j = JSON.parse(fs.readFileSync(pfad, 'utf8'));
    var sitz = (j.sitzungen || []).slice().sort(function (a, b) { return a.von - b.von; });
    var soll = (kal.close[tagEt] && kal.close[tagEt].close) || '16:00';
    var uhr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false });
    var reg = [], auk = null, umsReg = 0, umsAuk = 0;
    j.series.forEach(function (k) {
      if (new Date(k[0]).toISOString().slice(0, 10) !== tagEt) return;
      if (!(k[1] > 0) || !(k[5] > 0)) return;
      var typ = null;
      for (var q = 0; q < sitz.length; q++) if (k[0] >= sitz[q].von && k[0] <= sitz[q].bis) { typ = sitz[q].sitzung; break; }
      if (typ === 'regulaer') { reg.push(k); umsReg += k[1] * k[2]; }
      var u = uhr.format(new Date(k[0]));
      if (u === soll || u === soll.replace(/^0/, '')) { auk = k; umsAuk += k[1] * k[2]; }
    });
    if (!reg.length) return null;
    /* Kopf-Faktor unabhaengig aus dem Kopf: roh = datei x f */
    var f = 1, mm = j.massnahmen;
    if (Array.isArray(mm)) mm.forEach(function (m) { var ex = m.ex_date || m.ex || m.datum; if (m.faktor > 0 && ex > tagEt) f *= m.faktor; });
    /* Bereinigungsfaktor (v2) unabhaengig: eigene Splits der Massnahmendatei (forward/reverse mit symbol == Reihe,
     * unit_splits nur old == new == Reihe) mit Ex-Tag NACH dem Tag, mal Abspaltungsfaktoren aus dem Kopf. Die Split-Sperre
     * (v2.1) rechnet der Aufrufer an der Tafel nach (Rohkurse der Reihe um den Ex-Tag): hier nur die Kandidaten. */
    var fb = 1, eigene = [];
    try {
      var mj = JSON.parse(fs.readFileSync(path.join(K.ORTE.massnahmen(), String(ordner).replace(/~2$/, '') + '.json'), 'utf8'));
      (mj.saetze || []).forEach(function (s) {
        var art = String(s._art || ''), ex = s.ex_date || s.effective_date || s.process_date;
        var eigen = ((art === 'forward_splits' || art === 'reverse_splits') && String(s.symbol || '') === basis) ||
                    (art === 'unit_splits' && String(s.old_symbol || '') === basis && String(s.new_symbol || '') === basis);
        if (!eigen || !ex || !(ex > tagEt)) return;
        var alt = Number(s.old_rate), neu = Number(s.new_rate);
        if (alt > 0 && neu > 0 && Math.abs(neu / alt - 1) >= 1e-9) eigene.push({ ex: ex, faktor: neu / alt });
      });
    } catch (e) { /* keine Massnahmendatei: keine eigenen Splits */ }
    if (Array.isArray(mm)) mm.forEach(function (m) { var ex = m.ex_date || m.ex || m.datum; if (/spin/.test(String(m._art || m.art || '')) && m.faktor > 0 && ex > tagEt) fb *= m.faktor; });
    return { dateiSchluss: auk ? auk[5] : reg[reg.length - 1][1], dateiEroeffnung: reg[0][5],
      rohSchluss: (auk ? auk[5] : reg[reg.length - 1][1]) * f, rohEroeffnung: reg[0][5] * f,
      umsatz: umsReg + umsAuk, kerzen: reg.length, faktor: f, bSpin: fb, eigene: eigene, ersatz: auk ? 0 : 1 };
  }
  /* Split-Sperre unabhaengig an der Tafel: Rohschluss der Reihe am letzten Tag vor und ersten Tag ab dem Ex-Tag. */
  function sperreAnTafel(sym, e) {
    var soll = -Math.log(e.faktor);
    if (!(Math.abs(soll) >= K.SPLIT_SPERRE_MIN_LOG)) return true;
    var exIdx = kal.idx[e.ex]; if (exIdx === undefined) { for (var q = 0; q < kal.tage.length; q++) if (kal.tage[q] >= e.ex) { exIdx = q; break; } }
    if (exIdx === undefined) return true;
    var a = T.symStart[sym], b = T.symStart[sym + 1], vor = -1, ab = -1;
    for (var p = a; p < b; p++) { var zz = T.symZeilen[p]; if (T.g.tag[zz] < exIdx) vor = zz; else { ab = zz; break; } }
    if (vor < 0 || ab < 0) return true;
    var ist = Math.log(T.g.rohSchluss[ab] / T.g.rohSchluss[vor]);
    return Math.abs(ist - soll) <= (1 - K.SPLIT_SPERRE_ANTEIL) * Math.abs(soll);
  }
  /* 20 Reihen: die 10 umsatzstaerksten und 10 zufaellige (deterministisch). */
  var kandidaten = [];
  var letzterTag = T.maxTag;
  for (var q = T.tagVon[letzterTag]; q < T.tagBis[letzterTag]; q++) kandidaten.push({ sym: T.g.sym[q], u: T.g.umsatz[q] });
  kandidaten.sort(function (a, b) { return b.u - a.u; });
  var wahl = kandidaten.slice(0, 10).map(function (x) { return x.sym; });
  var rnd = ST.mulberry32(ST.fnv('stichprobe-20'));
  var alle = []; for (var s = 0; s < T.nSym; s++) if (T.symStart[s + 1] - T.symStart[s] > 500) alle.push(s);
  for (var w = 0; w < 10; w++) wahl.push(alle[Math.floor(rnd() * alle.length)]);
  var geprueft = 0, abw = [];
  wahl.forEach(function (sym) {
    var start = T.symStart[sym], ende = T.symStart[sym + 1];
    if (ende - start < 30) return;
    /* drei Tage je Reihe: erster, mittlerer, letzter */
    [start, Math.floor((start + ende) / 2), ende - 1].forEach(function (pos) {
      var z = T.symZeilen[pos], tagEt = kal.tage[T.g.tag[z]], jahr = +tagEt.slice(0, 4);
      var ordner = T.stand.symbole[sym].ordner, basis = T.stand.symbole[sym].reihe.replace(/~[23]$/, '');
      var h = handRechnung(ordner, basis, jahr, tagEt);
      if (!h) return;
      geprueft++;
      var fb = h.bSpin; h.eigene.forEach(function (e) { if (sperreAnTafel(sym, e)) fb *= e.faktor; });
      h.bFaktor = fb;
      var dS = Math.abs(h.rohSchluss - T.g.rohSchluss[z]) / Math.max(1e-9, h.rohSchluss);
      var dO = Math.abs(h.rohEroeffnung - (T.g.bEroeffnung[z] * h.bFaktor)) / Math.max(1e-9, h.rohEroeffnung);
      var dU = Math.abs(h.umsatz - T.g.umsatz[z]) / Math.max(1, h.umsatz);
      if (dS > 1e-9 || dO > 1e-6 || dU > 1e-6) abw.push(T.stand.symbole[sym].reihe + ' ' + tagEt + ' dS ' + dS.toExponential(2) + ' dO ' + dO.toExponential(2) + ' dU ' + dU.toExponential(2));
    });
  });
  pr(geprueft >= 40, 'Handrechnungen ausgefuehrt: ' + geprueft, 'Positivkontrolle: eine Null hier waere ein toter Test');
  pr(abw.length === 0, 'Abweichungen Schluss/Eroeffnung/Umsatz: ' + abw.length, abw.slice(0, 3).join(' | '));
});

/* =======================================================================================
 * 3  Splitfaktoren an bekannten Faellen
 * ======================================================================================= */
abschnitt(3, 'Splitfaktoren: COKE 2016 roh 180,40 $ (nicht 18,04), MNST-Split 2026 Faktor 2', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel - uebersprungen');
  var T = tafelVoll(), kal = T.kal;
  function hole(sym, tag) { var s = T.symIdx[sym]; if (s === undefined) return null; var z = T.zeileVon(s, kal.idx[tag]); return z < 0 ? null : z; }
  var z1 = hole('COKE', '2016-01-04');
  pr(z1 != null, 'COKE 2016-01-04 im Panel');
  if (z1 != null) {
    var o = T.g.bEroeffnung[z1] * (T.g.rohSchluss[z1] / T.g.bSchluss[z1]);
    pr(Math.abs(o - 180.40) < 0.005, 'COKE 2016-01-04 rohe Eroeffnung ' + o.toFixed(4) + ' $', 'Soll 180,40 - der bekannte Fall');
    pr(Math.abs(T.g.bEroeffnung[z1] - 18.04) < 0.005, 'COKE 2016-01-04 bereinigte Eroeffnung ' + T.g.bEroeffnung[z1].toFixed(4) + ' $', 'Soll 18,04 - beide Skalen muessen stimmen');
  }
  var za = hole('MNST', '2026-08-10'), zb = hole('MNST', '2026-08-11');
  pr(za != null && zb != null, 'MNST um den Split 2026-08-11 im Panel');
  if (za != null && zb != null) {
    var fa = T.g.rohSchluss[za] / T.g.bSchluss[za], fb = T.g.rohSchluss[zb] / T.g.bSchluss[zb];
    pr(Math.abs(fa / fb - 2) < 1e-6, 'MNST Faktorsprung ' + (fa / fb).toFixed(6), 'Soll genau 2,000000');
    var r = T.g.rendite[zb];
    pr(Math.abs(r) < 5, 'MNST Rendite am Ex-Tag ' + r.toFixed(4) + ' Pp', 'ein Sprung von -50 Pp waere die nicht angewandte Bereinigung');
  }
});

/* =======================================================================================
 * 4  Dollarumsatz-Invarianz roh <-> bereinigt
 * ======================================================================================= */
abschnitt(4, 'Dollarumsatz ist gegen die Bereinigung invariant (an Reihen MIT Massnahme)', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel - uebersprungen');
  var T = tafelVoll(), kal = T.kal, mit = [], ohneFaktor = 0;
  for (var s = 0; s < T.nSym; s++) {
    var start = T.symStart[s]; if (T.symStart[s + 1] - start < 300) continue;
    var z = T.symZeilen[start];
    var f = T.g.rohSchluss[z] / T.g.bSchluss[z];
    if (f > 1.5) mit.push({ s: s, f: f, z: z }); else ohneFaktor++;
    if (mit.length >= 6) break;
  }
  pr(mit.length > 0, 'Reihen mit Bereinigungsfaktor > 1,5 gefunden: ' + mit.length, 'Positivkontrolle - ohne sie prueft der Abschnitt nichts');
  var fehler = 0;
  mit.forEach(function (m) {
    var ordner = T.stand.symbole[m.s].ordner, tagEt = kal.tage[T.g.tag[m.z]], jahr = +tagEt.slice(0, 4);
    var pB = path.join(K.ORTE.bereinigt(), ordner, jahr + '.json'), pR = path.join(K.ORTE.roh(), ordner, jahr + '.json');
    if (!fs.existsSync(pB) || !fs.existsSync(pR)) return;
    var jb = JSON.parse(fs.readFileSync(pB, 'utf8')), jr = JSON.parse(fs.readFileSync(pR, 'utf8'));
    function ums(j) { var u = 0; j.series.forEach(function (k) { if (new Date(k[0]).toISOString().slice(0, 10) === tagEt) u += k[1] * k[2]; }); return u; }
    var ub = ums(jb), ur = ums(jr);
    var d = Math.abs(ub - ur) / Math.max(1, ur);
    if (d > 1e-6) { fehler++; process.stdout.write('      ' + T.stand.symbole[m.s].reihe + ' ' + tagEt + ' roh ' + ur.toFixed(0) + ' bereinigt ' + ub.toFixed(0) + '\n'); }
  });
  pr(fehler === 0, 'Umsatz roh gegen bereinigt: ' + fehler + ' Abweichungen', 'Kurs geteilt x Stueck malgenommen = unveraendert');
});

/* =======================================================================================
 * 5  Universum an drei Stichtagen punkt-in-Zeit gegen eine unabhaengige Rechnung
 * ======================================================================================= */
abschnitt(5, 'Universum an drei Stichtagen gegen eine unabhaengige Rechnung (Rohpanel gelesen)', function (pr) {
  var T = panelDa(A.aus) ? tafelVoll() : tafelKunst();
  var kal = T.kal;
  var tage = [Math.floor(T.maxTag * 0.3), Math.floor(T.maxTag * 0.6), T.maxTag - 30].filter(function (t) { return T.tagVon[t] >= 0; });
  var gleich = 0, ungleich = [];
  tage.forEach(function (t) {
    var U = PR.universum(T, t);
    /* Unabhaengige Rechnung: direkt aus den flachen Spalten, eigene Schleife, eigene Bedingungen. */
    var eigen = [];
    var aTag = null; for (var tt = t + 1; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) { aTag = tt; break; }
    for (var i = T.tagVon[t]; i < T.tagBis[t]; i++) {
      var sym = T.g.sym[i];
      if (T.stand.symbole[sym].referenz) continue;
      var kl = T.g.klasse[i];
      if (kl !== 2 && kl !== 3) continue;
      if ((T.g.marken[i] & K.M_QUELLE_REIN) === 0) continue;
      if (100 * 0.005 / T.g.rohSchluss[i] > K.KLASSEN[kl].huerde) continue;
      var vorher = 0;
      for (var q = T.symStart[sym]; q < T.symStart[sym + 1]; q++) { if (T.g.tag[T.symZeilen[q]] < t) vorher++; }
      if (vorher < 250) continue;
      if (T.g.marken[i] & K.M_STEMPEL_TAG) continue;
      if (T.g.marken[i] & K.M_MASSNAHME_NAH) continue;
      if ((T.g.marken[i] & K.M_DICHTE_OK) === 0) continue;
      var zn = T.zeileVon(sym, aTag);
      if (zn < 0 || !(T.g.bEroeffnung[zn] > 0)) continue;
      eigen.push(sym);
    }
    var a1 = U.liste.map(function (x) { return x.sym; }).sort(function (a, b) { return a - b; }).join(',');
    var a2 = eigen.sort(function (a, b) { return a - b; }).join(',');
    if (a1 === a2) gleich++; else ungleich.push(kal.tage[t] + ': Rahmen ' + U.liste.length + ' vs. eigen ' + eigen.length);
    process.stdout.write('      ' + kal.tage[t] + ': ' + U.liste.length + ' Papiere, verworfen ' + JSON.stringify(U.verworfen) + '\n');
  });
  pr(gleich === tage.length, 'Universum an ' + tage.length + ' Stichtagen identisch: ' + gleich, ungleich.join(' | '));
  /* Positivkontrolle: ohne Cent-Boden muss das Universum GROESSER sein - sonst prueft der Schnitt nichts. */
  var t0 = tage[0];
  var mit = PR.universum(T, t0).liste.length, ohne = PR.universum(T, t0, { ohneCentBoden: true }).liste.length;
  pr(ohne >= mit, 'ohne Cent-Boden ' + ohne + ' >= mit ' + mit, 'Positivkontrolle des Schnitts');
});

/* =======================================================================================
 * 6  Gleichgewichtetes Universum gegen SPY aus demselben Archiv
 * ======================================================================================= */
abschnitt(6, 'Gleichgewichtetes Universum gegen SPY: Korrelation der Tagesrenditen', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel - uebersprungen (Kunst-SPY traegt die Frage nicht)');
  var T = tafelVoll();
  var L = PR.lauf(T, RF.zufallFabrik('spy-vergleich'), { freq: 'woche', empfindlichkeit: 'haupt' });
  var B = PR.bewerte(T, L, {});
  var uni = B.tagesreihen.uni;
  var s = T.symIdx['SPY'], spy = {};
  for (var q = T.symStart[s]; q < T.symStart[s + 1]; q++) { var z = T.symZeilen[q]; spy[T.g.tag[z]] = T.g.rendite[z]; }
  var x = [], y = [];
  uni.forEach(function (e) { var r = spy[e.tag]; if (r === r && e.brutto === e.brutto) { x.push(e.brutto); y.push(r); } });
  function korr(a, b) {
    var n = a.length, ma = 0, mb = 0; for (var i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    var sab = 0, sa = 0, sb = 0;
    for (var j = 0; j < n; j++) { var da = a[j] - ma, db = b[j] - mb; sab += da * db; sa += da * da; sb += db * db; }
    return sab / Math.sqrt(sa * sb);
  }
  var r = korr(x, y);
  pr(x.length > 1000, 'gemeinsame Tage: ' + x.length);
  pr(r >= 0.90, 'Korrelation gleichgewichtetes Universum / SPY = ' + r.toFixed(4), 'Schranke 0,90 - GLEICHHEIT der Mittel waere falsch (SPY ist kapitalgewichtet, 500 Werte)');
  /* Positivkontrolle: um einen Tag versetzt muss die Korrelation zusammenbrechen. */
  var x2 = [], y2 = [];
  uni.forEach(function (e) { var rr = spy[e.tag + 1]; if (rr === rr && e.brutto === e.brutto) { x2.push(e.brutto); y2.push(rr); } });
  var r2 = korr(x2, y2);
  pr(Math.abs(r2) < 0.3, 'um einen Tag versetzt: ' + r2.toFixed(4), 'Positivkontrolle - bleibt sie hoch, misst der Test die Datumszuordnung nicht');
});

/* =======================================================================================
 * 7 + 8  Umschlag und Kosten von Hand
 * ======================================================================================= */
abschnitt(7, 'Umschlag und Kostenabzug von Hand an EINER Umschichtung', function (pr) {
  var T = panelDa(A.aus) ? tafelVoll() : tafelKunst();
  var tage = PR.signaltage(T, 'woche');
  var t = tage[Math.floor(tage.length / 2)];
  var alt = {}, neu = {};
  var U = PR.universum(T, t).liste;
  /* Kunstfall mit ausgeschriebenen Gewichten: 4 Papiere raus, 4 rein, 6 bleiben. */
  var syms = U.slice(0, 10).map(function (e) { return e.sym; });
  var raus = U.slice(10, 14).map(function (e) { return e.sym; });
  syms.forEach(function (s) { neu[s] = 0.1; });
  syms.slice(0, 6).forEach(function (s) { alt[s] = 0.1; });
  raus.forEach(function (s) { alt[s] = 0.1; });
  var uk = PR.umschlagKosten(T, alt, neu, t);
  /* Von Hand: 4 Positionen zu je 0,1 raus, 4 zu je 0,1 rein, 6 unveraendert.
   * Umschlag = 0,5 * (4*0,1 + 4*0,1) = 0,4. */
  pr(Math.abs(uk.umschlag - 0.4) < 1e-12, 'Umschlag ' + uk.umschlag.toFixed(6), 'von Hand 0,5 * (4*0,1 + 4*0,1) = 0,400000');
  var handKosten = 0;
  [].concat(raus, syms.slice(6)).forEach(function (s) {
    var z = T.zeileVon(s, t); var kl = z >= 0 ? T.g.klasse[z] : 3; if (kl < 0) kl = 3;
    handKosten += 0.5 * 0.1 * K.KLASSEN[kl].huerde;
  });
  pr(Math.abs(uk.kosten - handKosten) < 1e-12, 'Kosten ' + uk.kosten.toFixed(8) + ' Pp', 'von Hand ' + handKosten.toFixed(8) + ' Pp');
  /* Ein voller Umlauf (rein und wieder raus) kostet genau EINE Huerde. */
  var einer = U[0].sym, zz = T.zeileVon(einer, t), kl0 = zz >= 0 ? T.g.klasse[zz] : 3;
  var rein = PR.umschlagKosten(T, {}, (function () { var o = {}; o[einer] = 1; return o; })(), t);
  var wieder = PR.umschlagKosten(T, (function () { var o = {}; o[einer] = 1; return o; })(), {}, t);
  pr(Math.abs(rein.kosten + wieder.kosten - K.KLASSEN[kl0].huerde) < 1e-12,
    'voller Umlauf kostet ' + (rein.kosten + wieder.kosten).toFixed(6) + ' Pp', 'Huerde der Klasse ' + K.KLASSEN[kl0].name + ' = ' + K.KLASSEN[kl0].huerde);
});

/* =======================================================================================
 * 9  se der Portfolioreihe gegen eine unabhaengige Rechnung + Kunstsatz mit BEKANNTER Autokorrelation
 * ======================================================================================= */
abschnitt(9, 'se: unabhaengige Rechnung und ein Satz, an dem HH und naiv verschieden ausfallen MUESSEN', function (pr) {
  /* (a) unabhaengige Rechnung der naiven se */
  var rnd = ST.mulberry32(ST.fnv('se-test'));
  var w = []; for (var i = 0; i < 500; i++) w.push(2 * (rnd() - 0.5));
  var m = ST.periodenMomente(w);
  var mu = w.reduce(function (a, b) { return a + b; }, 0) / w.length;
  var q = w.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0);
  var seHand = Math.sqrt(q / (w.length - 1)) / Math.sqrt(w.length);
  pr(Math.abs(m.seNaiv - seHand) < 1e-12, 'naive se ' + m.seNaiv.toFixed(10) + ' gegen Handrechnung ' + seHand.toFixed(10));
  /* (b) POSITIVKONTROLLE: AR(1)-Satz mit rho = 0,6 - HH muss deutlich groesser sein als naiv.
   *     Ein Test, in dem HH = naiv herauskommt, prueft die Ueberlappungsrechnung nicht. */
  var rho = 0.6, x = 0, paare = [];
  for (var t2 = 0; t2 < 4000; t2++) { x = rho * x + (rnd() - 0.5); paare.push({ t: t2, x: x }); }
  var mm = ST.momente(paare, 10);
  var erwartet = Math.sqrt((1 + rho) / (1 - rho));                      /* langfristige Varianz / kurzfristige */
  var verhaeltnis = mm.seHH / mm.seNaiv;
  pr(verhaeltnis > 1.5, 'HH/naiv = ' + verhaeltnis.toFixed(3) + ' bei rho = 0,6', 'theoretisch ~' + erwartet.toFixed(2) + ' - ohne diesen Fall prueft der Abschnitt nichts');
  pr(Math.abs(verhaeltnis / erwartet - 1) < 0.25, 'HH trifft die Theorie auf ' + (100 * Math.abs(verhaeltnis / erwartet - 1)).toFixed(1) + ' % genau');
  /* (c) weisses Rauschen: HH darf NICHT wesentlich abweichen */
  var paare2 = []; for (var t3 = 0; t3 < 4000; t3++) paare2.push({ t: t3, x: rnd() - 0.5 });
  var m2 = ST.momente(paare2, 10);
  pr(Math.abs(m2.seHH / m2.seNaiv - 1) < 0.12, 'weisses Rauschen: HH/naiv = ' + (m2.seHH / m2.seNaiv).toFixed(3), 'Gegenprobe zu (b)');
});

/* =======================================================================================
 * 10  Die drei Kontrollen am Kunstsatz gegen ihre Schranken
 * ======================================================================================= */
abschnitt(10, 'Die drei Kontrollen am Kunstsatz (Maschine mit bekannter Antwort)', function (pr) {
  if (!panelDa(A.kunst)) return pr(false, 'kein Kunstpanel unter ' + A.kunst);
  var T = tafelKunst(), regime = PR.spyRegime(T);
  var KO = require('./kontrollen.js');
  var o = KO.fahre(T, RF.orakelTag, { freq: 'woche', orakel: true, empfindlichkeit: 'haupt', regime: regime });
  pr(o.brutto.mittel >= K.ORAKEL_MIN_PP, 'Orakel(Tag) Woche brutto ' + o.brutto.mittel.toFixed(3) + ' Pp', 'Schranke ' + K.ORAKEL_MIN_PP);
  pr(o.brutto.mittel / o.brutto.sd >= K.ORAKEL_MIN_SD, 'Orakel Mittel/sd ' + (o.brutto.mittel / o.brutto.sd).toFixed(2), 'Schranke ' + K.ORAKEL_MIN_SD + ' (Nachtrag 4)');
  var op = KO.fahre(T, RF.orakelPeriode, { freq: 'woche', orakel: true, empfindlichkeit: 'haupt', regime: regime });
  pr(op.brutto.mittel >= K.ORAKEL_H_MIN_PP_WOCHE, 'Orakel(Periode) Woche brutto ' + op.brutto.mittel.toFixed(3) + ' Pp', 'Schranke ' + K.ORAKEL_H_MIN_PP_WOCHE);
  var zf = KO.fahre(T, RF.zufallFabrik('test-zufall'), { freq: 'woche', empfindlichkeit: 'haupt', regime: regime });
  pr(Math.abs(zf.brutto.t) < K.ZUFALL_T_EINZELN, 'Zufall Woche |t| = ' + Math.abs(zf.brutto.t).toFixed(2), 'Schranke ' + K.ZUFALL_T_EINZELN);
  /* POSITIVKONTROLLE des Rahmens auf eine KLEINE Kante - die Groessenordnung, um die es in Teil 2 geht.
   * Ein Rahmen, der nur das Orakel findet, taugt hier nichts.
   * Die Kante ist exakt vorhersagbar: die Rangfunktion liefert theta_s, das Long-Dezil verdient
   * KANTE_PP * (theta_long - theta_uni) je HANDELSTAG gegen das Universum. Der Sollwert wird aus den
   * TATSAECHLICH gehaltenen Mitgliedern gerechnet, nicht aus der Normalverteilungs-Faustzahl - damit
   * traegt die Vorhersage die Auswahl des Cent-Bodens mit. */
  function thetaRang(sicht, liste, TT) {
    var aus = new Float64Array(liste.length);
    for (var i2 = 0; i2 < liste.length; i2++) aus[i2] = KP.theta(TT.symName[liste[i2].sym]);
    return aus;
  }
  thetaRang.$name = 'kunst-kante-theta';
  var LL = PR.lauf(T, thetaRang, { freq: 'woche', empfindlichkeit: 'haupt' });
  var BB = PR.bewerte(T, LL, { regime: regime });
  /* KANTE_AB ist ein Kalenderdatum, kein Handelstag (2020-01-01 ist ein Feiertag) - der Index muss der
   * erste Handelstag ab diesem Datum sein. `kal.idx[Feiertag]` ist undefined, und jeder Vergleich mit
   * undefined ist falsch: die Filter liessen NICHTS durch, n war 0 und drei Pruefungen wurden NaN. */
  var kanteAbTag = null;
  for (var ki = 0; ki < T.kal.tage.length; ki++) if (T.kal.tage[ki] >= KP.KANTE_AB) { kanteAbTag = ki; break; }
  pr(kanteAbTag != null, 'Kantenbeginn ' + KP.KANTE_AB + ' liegt bei Kalenderindex ' + kanteAbTag + ' (' + T.kal.tage[kanteAbTag] + ')');
  function sollUndIst(nurAb) {
    var soll = 0, ist = 0, n = 0;
    LL.perioden.forEach(function (p) {
      if (nurAb ? !(p.t >= kanteAbTag) : !(p.t < kanteAbTag)) return;
      var tl = 0; p.long.mitglieder.forEach(function (s) { tl += KP.theta(T.symName[s]); }); tl /= p.long.mitglieder.length;
      var tu = 0; p.uni.mitglieder.forEach(function (s) { tu += KP.theta(T.symName[s]); }); tu /= p.uni.mitglieder.length;
      soll += KP.KANTE_PP * (tl - tu) * p.long.tage.length;
      n++;
    });
    BB.haupt.perioden.forEach(function (e) { if (nurAb ? e.t >= kanteAbTag : e.t < kanteAbTag) ist += e.brutto; });
    return { soll: n ? soll / n : NaN, ist: n ? ist / n : NaN, n: n };
  }
  var ab = sollUndIst(true), vor = sollUndIst(false);
  pr(ab.n > 100 && vor.n > 100, 'Perioden mit Kante ' + ab.n + ', ohne Kante ' + vor.n, 'beide Faelle muessen im Satz sein');
  pr(ab.soll > 0.2, 'Soll-Kante ab 2020 (aus den gehaltenen Mitgliedern) ' + ab.soll.toFixed(4) + ' Pp je Woche', 'Positivkontrolle - ein Soll nahe null pruefte nichts');
  pr(Math.abs(ab.ist - ab.soll) < 0.25 * ab.soll + 0.12, 'gemessen ' + ab.ist.toFixed(4) + ' Pp je Woche gegen Soll ' + ab.soll.toFixed(4), 'Abweichung ' + (ab.ist - ab.soll).toFixed(4) + ' Pp');
  pr(Math.abs(vor.ist) < 0.12, 'vor 2020 (dort gibt es keine Kante): ' + vor.ist.toFixed(4) + ' Pp', 'Gegenprobe - waere sie hier auch gross, misst der Rahmen theta statt der Kante');
});

/* =======================================================================================
 * 11  Leck-Probe und ihre Umkehrung
 * ======================================================================================= */
abschnitt(11, 'Leck-Sperrklinke: meldet das Leck UND laesst die saubere Rangfunktion in Ruhe', function (pr) {
  var T = panelDa(A.aus) ? tafelVoll() : tafelKunst();
  var lp = PR.lauf(T, RF.leckProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
  pr(lp.verstoesse > 0, 'Leck-Probe: ' + lp.verstoesse + ' Verstoesse gemeldet', 'null waere eine kaputte Klinke');
  pr(lp.ungueltig === true, 'Lauf als UNGUELTIG markiert');
  pr(lp.beispiele.length > 0, 'Klinke nennt Beispiele: ' + (lp.beispiele[0] || '-'));
  var sp = PR.lauf(T, RF.sauberProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
  pr(sp.verstoesse === 0, 'saubere Rangfunktion: ' + sp.verstoesse + ' Verstoesse', 'Gegenprobe - eine Klinke, die immer meldet, meldet nichts');
  pr(sp.ungueltig === false, 'sauberer Lauf ist gueltig');
  /* Das Orakel darf NUR mit Schluessel in die Zukunft sehen. */
  var ohne = PR.lauf(T, RF.orakelTag, { freq: 'woche', empfindlichkeit: 'haupt' });
  pr(ohne.verstoesse > 0 && ohne.ungueltig === true, 'Orakel OHNE Schluessel wird gemeldet: ' + ohne.verstoesse + ' Verstoesse');
  var mit = PR.lauf(T, RF.orakelTag, { freq: 'woche', empfindlichkeit: 'haupt', orakel: true });
  pr(mit.verstoesse === 0 && mit.ungueltig === false, 'Orakel MIT Schluessel: ' + mit.verstoesse + ' Verstoesse, gueltig');
});

/* =======================================================================================
 * 12  Jahresscheiben addieren sich zum Gesamtzeitraum
 * ======================================================================================= */
abschnitt(12, 'Jahresscheiben addieren sich zum Gesamtzeitraum', function (pr) {
  var T = panelDa(A.aus) ? tafelVoll() : tafelKunst();
  var KO = require('./kontrollen.js');
  var r = KO.fahre(T, RF.zufallFabrik('jahr-test'), { freq: 'woche', empfindlichkeit: 'haupt', regime: PR.spyRegime(T) });
  var summe = r.jahre.brutto.reduce(function (s, j) { return s + j.n; }, 0);
  pr(summe === r.brutto.n, 'Perioden in Jahresscheiben ' + summe + ' = Gesamt ' + r.brutto.n);
  var gew = r.jahre.brutto.reduce(function (s, j) { return s + j.mittel * j.n; }, 0) / summe;
  pr(Math.abs(gew - r.brutto.mittel) < 1e-9, 'gewichtetes Mittel der Jahre ' + gew.toFixed(10) + ' = Gesamtmittel ' + r.brutto.mittel.toFixed(10));
  var reg = r.regime;
  pr(reg.ueberEMA200.n + reg.unterEMA200.n + reg.ohneRegime === r.brutto.n,
    'Regimeschnitt ' + reg.ueberEMA200.n + ' + ' + reg.unterEMA200.n + ' + ' + reg.ohneRegime + ' = ' + r.brutto.n);
});

/* =======================================================================================
 * 13  Kein Universumskriterium liest die Zielgroesse
 * ======================================================================================= */
abschnitt(13, 'Sperrklinke: kein Universumskriterium liest `rendite` (Ausschluss auf die Zielgroesse)', function (pr) {
  var quelle = fs.readFileSync(path.join(__dirname, 'pruefstand.js'), 'utf8');
  var von = quelle.indexOf('function universum(');
  var bis = quelle.indexOf('\n}', von);
  var koerper = quelle.slice(von, bis);
  /* Kommentare weg - die Klinke soll die VERWENDUNG treffen, nicht ihren erklaerenden Text
   * (Fehlerform "Sperrklinke frisst ihren Kommentar"). */
  var ohneKommentar = koerper.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  var treffer = ohneKommentar.match(/\.rendite|\.renditeOC/g) || [];
  pr(treffer.length === 0, 'Zugriffe auf rendite/renditeOC im Universumsfilter: ' + treffer.length, treffer.join(' '));
  /* Positivkontrolle der Klinke selbst: sie MUSS an einem Text anschlagen, der den Zugriff enthaelt. */
  var kunst = 'function universum(T, tag) { if (g.rendite[i] > 0) return; }';
  var kt = (kunst.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.rendite|\.renditeOC/g) || []).length;
  pr(kt === 1, 'Positivkontrolle: die Klinke findet einen eingebauten Zugriff (' + kt + ')');
  /* Und die Marken, auf die gefiltert wird, sind reine Datenqualitaet. */
  var erlaubt = ['M_QUELLE_REIN', 'M_STEMPEL_TAG', 'M_MASSNAHME_NAH', 'M_DICHTE_OK'];
  var benutzt = (ohneKommentar.match(/K\.M_[A-Z_]+/g) || []).map(function (s) { return s.slice(2); });
  var fremd = benutzt.filter(function (m) { return erlaubt.indexOf(m) === -1; });
  pr(fremd.length === 0, 'nur Datenqualitaets-Marken im Filter: ' + benutzt.join(',') , fremd.join(','));
});

/* =======================================================================================
 * 14  Faktor-Roundtrip je Richtung (v2): konstruierte Reihe mit 1:4 und 4:1, bereinigte Rendite am Split-Tag = 0
 * ======================================================================================= */
abschnitt(14, 'Faktor-Roundtrip (v2): Rueckwaerts 1:4 und Vorwaerts 4:1 auf konstruierten Tagen, Rendite am Split-Tag 0', function (pr) {
  var kal = K.kalender();
  /* Tage aus dem echten Kalender, damit kal.idx greift; Kurse konstruiert. Rohdatei (Kopf-Faktor 1), Split am Tag 3. */
  var tage = kal.tage.slice(100, 106);
  function bau(kursVor, kursNach, bFaktorVor) {
    return tage.map(function (t, i) {
      var vor = i < 3;
      return { tag: t, dateiSchluss: vor ? kursVor : kursNach, dateiEroeffnung: vor ? kursVor : kursNach, faktor: 1, bFaktor: vor ? bFaktorVor : 1,
        umsatzReg: 1e6, umsatzAuktion: 0, kerzen: 390, schlussErsatz: 0, eroeffnungErsatz: 0, dichteOk: 1, stempelTag: 0 };
    });
  }
  var z = { luecken: 0, stempeltage: 0, schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, trennungen: 0, trennungAbweichung: 0 };
  /* Rueckwaerts 1:4: roh 10 -> 40, Quelle old_rate 4, new_rate 1 => faktor 0,25; bereinigt davor 10/0,25 = 40. */
  var rw = P.zeilenAus(bau(10, 40, 0.25), { idx: 0 }, kal, z, new Set());
  pr(Math.abs(rw[3].rendite) < 1e-6, 'Rueckwaerts 1:4 (roh 10 -> 40, bFaktor 0,25): Rendite am Split-Tag ' + rw[3].rendite.toExponential(2) + ' %', 'Soll 0');
  pr(Math.abs(rw[2].rohSchluss - 10) < 1e-12 && Math.abs(rw[2].faktor - 0.25) < 1e-12, 'roh davor bleibt 10 $, Spalte faktor 0,25 (roh/bereinigt)', 'Cent-Boden rechnet roh');
  var rwRoh = 100 * (40 / 10 - 1);
  pr(Math.abs(rwRoh - 300) < 1e-9, 'Positivkontrolle: ohne Faktor waere es +300 %', rwRoh.toFixed(1));
  /* Vorwaerts 4:1: roh 100 -> 25, Quelle old 1, new 4 => faktor 4; bereinigt davor 100/4 = 25. */
  var vw = P.zeilenAus(bau(100, 25, 4), { idx: 0 }, kal, z, new Set());
  pr(Math.abs(vw[3].rendite) < 1e-6, 'Vorwaerts 4:1 (roh 100 -> 25, bFaktor 4): Rendite am Split-Tag ' + vw[3].rendite.toExponential(2) + ' %', 'Soll 0');
  /* Kopie mit angewandtem Split (Kopf-Faktor 4 == bFaktor 4): datei x (4/4) ist BITGLEICH datei - v1-Zeilen bleiben. */
  var kp = bau(25, 25, 4); kp.forEach(function (t, i) { if (i < 3) t.faktor = 4; });
  var kz = P.zeilenAus(kp, { idx: 0 }, kal, z, new Set());
  pr(kz[3].rendite === 0 && kz[2].rohSchluss === 100, 'Kopie (Kopf 4, eigen 4): Rendite exakt 0, roh 100 $ - bitgleich zu v1', kz[3].rendite + ' / ' + kz[2].rohSchluss);
  /* Fremder unit_split im Kopf (PANW/CYBR 2,2005): Kopf-Faktor 2,2005, eigen 1 => bereinigt = roh, kein Sprung. */
  var fr = bau(100, 100, 1); fr.forEach(function (t, i) { if (i < 3) { t.faktor = 2.2005; t.dateiSchluss = 100 / 2.2005; t.dateiEroeffnung = t.dateiSchluss; } });
  var fz = P.zeilenAus(fr, { idx: 0 }, kal, z, new Set());
  pr(Math.abs(fz[3].rendite) < 1e-9, 'fremder unit_split im Kopf (2,2005), nicht eigen: Rendite am Tag ' + fz[3].rendite.toExponential(2) + ' % (v1: +120 %)', 'Soll 0');
  /* Split-Sperre (v2.1): Quellsatz ohne Sprung in der Rohreihe wird abgelehnt (HON 2:1 bei Rohverhaeltnis 0,985), mit Sprung
   * angenommen (GE 1:8 bei 7,76), kleiner Faktor (Stockdividende 1,03) immer angenommen. */
  var hon = P.splitSperre(bau(100, 98.5, 1), [{ ex: tage[3], faktor: 0.5, art: 'reverse_splits' }], 'HON');
  pr(hon.abgelehnt.length === 1 && hon.akzeptiert.length === 0, 'Sperre: reverse 2:1 ohne Sprung (roh 100 -> 98,5) abgelehnt', JSON.stringify(hon.abgelehnt[0]));
  var ge = P.splitSperre(bau(12.95, 100.6, 1), [{ ex: tage[3], faktor: 0.125, art: 'reverse_splits' }], 'GE');
  pr(ge.akzeptiert.length === 1 && ge.abgelehnt.length === 0, 'Sperre: reverse 1:8 mit Sprung (roh 12,95 -> 100,6) angenommen');
  var sd = P.splitSperre(bau(100, 99, 1), [{ ex: tage[3], faktor: 1.03, art: 'forward_splits' }], 'SD');
  pr(sd.akzeptiert.length === 1, 'Sperre: Faktor 1,03 (Stockdividende) trotz Rausch immer angenommen');
});

/* =======================================================================================
 * 15  Kuerzelwechsel (v2): Trennung am Wechseltag - alte Reihe endet, Nachfolger beginnt ohne Vortag
 * ======================================================================================= */
abschnitt(15, 'Kuerzelwechsel (v2): konstruierte Reihe mit Trennung - LETZTER_TAG davor, KEINE_RENDITE danach, eigene Reihe', function (pr) {
  var kal = K.kalender();
  var tage = kal.tage.slice(200, 204).concat(kal.tage.slice(800, 804));   // Luecke von ~600 Handelstagen
  var T = tage.map(function (t, i) { return { tag: t, dateiSchluss: i < 4 ? 30 : 80, dateiEroeffnung: i < 4 ? 30 : 80, faktor: 1, bFaktor: 1,
    umsatzReg: 1e6, umsatzAuktion: 0, kerzen: 390, schlussErsatz: 0, eroeffnungErsatz: 0, dichteOk: 1, stempelTag: 0 }; });
  var z = { luecken: 0, stempeltage: 0, schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, trennungen: 0, trennungAbweichung: 0 };
  var R = { idx: 5, trennung: { tag: tage[4], letzterVor: tage[3], idx: 9 } };
  var zl = P.zeilenAus(T, R, kal, z, new Set());
  pr(zl.length === 8 && z.trennungen === 1 && z.trennungAbweichung === 0, 'eine Trennung, keine Abweichung, 8 Zeilen', JSON.stringify({ tr: z.trennungen, abw: z.trennungAbweichung, n: zl.length }));
  pr(zl.slice(0, 4).every(function (r) { return r.symIdx === 5; }) && zl.slice(4).every(function (r) { return r.symIdx === 9; }), 'Zeilen 1-4 Reihe 5, Zeilen 5-8 Nachfolger 9');
  pr((zl[3].marken & K.M_LETZTER_TAG) !== 0 && (zl[7].marken & K.M_LETZTER_TAG) !== 0, 'LETZTER_TAG auf dem letzten Tag der alten Reihe UND am Reihenende');
  pr((zl[4].marken & K.M_KEINE_RENDITE) !== 0 && !(zl[4].rendite === zl[4].rendite), 'erster Tag des Nachfolgers ohne Rendite (v1: +166,7 % von 30 auf 80)');
  pr(zl[4].klasse === -1 && zl[5].klasse === -1, 'Umsatzfenster beginnt neu: Klasse -1 am Anfang des Nachfolgers');
  var ohne = P.zeilenAus(T, { idx: 5 }, kal, z, new Set());
  pr(Math.abs(ohne[4].rendite - 100 * (80 / 30 - 1)) < 1e-4, 'Positivkontrolle: ohne Trennung +' + ohne[4].rendite.toFixed(1) + ' % ueber die Luecke');
  /* Abweichung wird gezaehlt, wenn der entschiedene Tag nicht der erste Tag ab dem Wechsel ist. */
  var z2 = { luecken: 0, stempeltage: 0, schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, trennungen: 0, trennungAbweichung: 0 };
  P.zeilenAus(T, { idx: 5, trennung: { tag: tage[5], letzterVor: tage[3], idx: 9 } }, kal, z2, new Set());
  pr(z2.trennungAbweichung === 1, 'Zaehler: entschiedener Tag ungleich erstem Tag ab Wechsel wird als Abweichung gezaehlt', z2.trennungAbweichung);
});

/* =======================================================================================
 * 16  Am echten Panel (v2): bekannte Artefakte weg, bekannte echte Spruenge da
 * ======================================================================================= */
abschnitt(16, 'Echtes Panel (v2): GE 02.08.2021 und AMC 24.08.2023 bereinigt (|r| < 20 %), GME 27.01.2021 bleibt (> 100 %), HCP getrennt', function (pr) {
  if (!panelDa(A.aus)) return pr(false, 'kein Panel - uebersprungen');
  var T = tafelVoll();
  function r(reihe, tag) { var s = T.symIdx[reihe]; if (s === undefined) return null; var z = T.zeileVon(s, T.kal.idx[tag]); return z < 0 ? null : T.g.rendite[z]; }
  var ge = r('GE', '2021-08-02'), amc = r('AMC', '2023-08-24'), gme = r('GME', '2021-01-27'), panw = r('PANW', '2026-02-11'), hon = r('HON', '2026-06-29');
  pr(ge != null && Math.abs(ge) < 20, 'GE 2021-08-02 (Rueckwaerts 1:8): Rendite ' + (ge == null ? 'fehlt' : ge.toFixed(2) + ' %'), 'v1: +675,6 %');
  /* AMC: roh 1,96 x 10 = 19,60 -> 14,37 ist der echte Kurssturz am Tag der APE-Umwandlung (-26,7 %); Artefakt war +633 %. */
  pr(amc != null && amc < 0 && amc > -40, 'AMC 2023-08-24 (Rueckwaerts 1:10): Rendite ' + (amc == null ? 'fehlt' : amc.toFixed(2) + ' %') + ' - echter Kurssturz, kein Artefakt', 'v1: +633,2 %');
  pr(hon == null || Math.abs(hon) < 20, 'HON 2026-06-29 (Quellsatz reverse 2:1 OHNE Sprung in der Rohreihe, Sperre): Rendite ' + (hon == null ? 'fehlt' : hon.toFixed(2) + ' %'), 'ohne Sperre -50,8 %');
  pr(panw == null || Math.abs(panw) < 20, 'PANW 2026-02-11 (fremder unit_split CYBR im Kopf): Rendite ' + (panw == null ? 'fehlt' : panw.toFixed(2) + ' %'), 'v1: +119,7 %');
  pr(gme != null && gme > 100, 'Positivkontrolle GME 2021-01-27 (echt): Rendite ' + (gme == null ? 'fehlt' : gme.toFixed(2) + ' %'), 'v1: +137,7 %');
  var alt = T.symIdx['HCP'], neu = T.symIdx['HCP~2'];
  pr(alt !== undefined && neu !== undefined, 'HCP getrennt: Reihen HCP und HCP~2 vorhanden', JSON.stringify({ alt: alt, neu: neu }));
  if (alt !== undefined && neu !== undefined) {
    var sa = T.stand.symbole[alt], sn = T.stand.symbole[neu];
    pr(sa.ende_grund === K.ENDE_GRUND_KUERZEL && sa.lebend === 0 && sn.vorgaenger === 'HCP', 'HCP endet mit ' + sa.ende_grund + ' am ' + sa.ende_datum + ', HCP~2 (' + sn.ende_grund + ' ' + sn.ende_datum + ') folgt');
    var e = T.symStart[neu] < T.symStart[neu + 1] ? T.symZeilen[T.symStart[neu]] : -1;
    pr(e >= 0 && (T.g.marken[e] & K.M_KEINE_RENDITE) !== 0 && T.posInReihe[e] === 0, 'erste Zeile von HCP~2 (' + (e >= 0 ? T.kal.tage[T.g.tag[e]] : '-') + ') ohne Rendite, Vortage 0');
  }
});

/* =======================================================================================
 * 17  Luecken-Trennung (v2.2, Auftrag Nr. 67): mehrere Schnitte je Reihe; Liste gegen den Trockenlauf
 * ======================================================================================= */
abschnitt(17, 'Luecken-Trennung (v2.2): konstruierte Reihe mit Luecke, Kuerzelwechsel, Luecke - vier Reihen, keine Zeile verloren; Liste = Trockenlauf', function (pr) {
  var kal = K.kalender();
  /* A: 45 Tage, 3 Mrd $ Umsatz | LUECKE | B: 70 Tage, 100 Mio $ | Kuerzelwechsel | C: 3 Tage | LUECKE | D: 2 Tage */
  var bloecke = [[200, 45, 3e9, 30], [600, 70, 1e8, 80], [700, 3, 1e8, 50], [1100, 2, 1e8, 20]], T = [], grenzen = [];
  bloecke.forEach(function (b) { grenzen.push(T.length); kal.tage.slice(b[0], b[0] + b[1]).forEach(function (t) { T.push({ tag: t, dateiSchluss: b[3], dateiEroeffnung: b[3], faktor: 1, bFaktor: 1,
    umsatzReg: b[2], umsatzAuktion: 0, kerzen: 390, schlussErsatz: 0, eroeffnungErsatz: 0, dichteOk: 1, stempelTag: 0 }); }); });
  function schnitt(k, idx, art) { var s = { tag: T[grenzen[k]].tag, letzterVor: T[grenzen[k] - 1].tag, idx: idx }; if (art) s.art = art; return s; }
  function zNeu() { return { luecken: 0, stempeltage: 0, schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, trennungen: 0, trennungAbweichung: 0 }; }
  var z = zNeu();
  var zl = P.zeilenAus(T, { idx: 5, schnitte: [schnitt(1, 11, 'luecke'), schnitt(2, 12), schnitt(3, 13, 'luecke')] }, kal, z, new Set());
  pr(zl.length === T.length && z.lueckenTrennungen === 2 && z.trennungen === 1 && z.trennungAbweichung === 0, 'keine Zeile verloren (' + zl.length + ' von ' + T.length + '), zwei Luecken-Trennungen, ein Kuerzelwechsel, keine Abweichung', JSON.stringify({ lu: z.lueckenTrennungen, tr: z.trennungen, abw: z.trennungAbweichung }));
  var soll = [5, 11, 12, 13], okSym = true, okErste = true, okLetzte = true;
  grenzen.forEach(function (g0, k) {
    var ende = k + 1 < grenzen.length ? grenzen[k + 1] : T.length;
    for (var i2 = g0; i2 < ende; i2++) if (zl[i2].symIdx !== soll[k]) okSym = false;
    if ((zl[g0].rendite === zl[g0].rendite) || !(zl[g0].marken & K.M_KEINE_RENDITE)) okErste = false;
    if (!(zl[ende - 1].marken & K.M_LETZTER_TAG)) okLetzte = false;
  });
  pr(okSym, 'jeder Abschnitt liegt in seiner Reihe (5, 11, 12, 13)');
  pr(okErste, 'erste Zeile jedes Abschnitts ohne Rendite (KEINE_RENDITE)');
  pr(okLetzte, 'letzte Zeile jedes Abschnitts traegt LETZTER_TAG');
  var kA = K.klasseIndex(3e9), kB = K.klasseIndex(1e8), g1 = grenzen[1];
  pr(kA !== kB && kB !== -1 && zl[g1 - 1].klasse === kA && zl[g1].klasse === -1 && zl[g1 + K.UMSATZ_MIN_TAGE - 1].klasse === -1 && zl[g1 + K.UMSATZ_MIN_TAGE].klasse === kB,
    'Klasse laeuft je Reihe: vor der Luecke ' + kA + ', danach ' + K.UMSATZ_MIN_TAGE + ' Zeilen -1, dann ' + kB + ' aus dem eigenen Fenster');
  /* Gegenprobe: ohne Schnitte klebt die Reihe - Rendite ueber die Luecke, Klasse aus dem Fenster des alten Papiers. */
  var kleb = P.zeilenAus(T, { idx: 5 }, kal, zNeu(), new Set());
  pr(Math.abs(kleb[g1].rendite - 100 * (80 / 30 - 1)) < 1e-4 && kleb[g1].klasse === kA && kleb.every(function (r) { return r.symIdx === 5; }),
    'Gegenprobe ohne Schnitte: +' + kleb[g1].rendite.toFixed(1) + ' % ueber die Luecke, Klasse ' + kleb[g1].klasse + ' aus dem alten Fenster');
  var z3 = zNeu();
  P.zeilenAus(T, { idx: 5, schnitte: [{ art: 'luecke', tag: T[g1].tag, letzterVor: T[g1 - 2].tag, idx: 11 }] }, kal, z3, new Set());
  pr(z3.trennungAbweichung === 1, 'Zaehler: letzter Tag vor der Luecke ungleich der Liste wird als Abweichung gezaehlt', z3.trennungAbweichung);
  /* Liste gegen den Trockenlauf (Auftrag Nr. 67 §1a.2/3): dieselben Reihen und Tage, Zeilenwechsel vorab exakt, Nummern ab ~3. */
  var lp = path.join(__dirname, 'luecken-trennungen.json'), kp = path.join(__dirname, 'luecken-kandidaten.json');
  if (!fs.existsSync(lp) || !fs.existsSync(kp)) return pr(false, 'luecken-trennungen.json oder luecken-kandidaten.json fehlt');
  var LT = JSON.parse(fs.readFileSync(lp, 'utf8')), KA = JSON.parse(fs.readFileSync(kp, 'utf8'));
  var la = LT.trennungen.map(function (t) { return t.reihe + '@' + t.letzterVor + '>' + t.tag; }).sort(), lb = KA.kandidaten.map(function (k) { return k.reihe + '@' + k.letzterVor + '>' + k.ersterNach; }).sort();
  var wechsel = 0; KA.kandidaten.forEach(function (k) { if (k.lueckeNrDerReihe === 1) wechsel += k.zeilenNach; });
  pr(la.length === 141 && LT.zaehler.reihen === 140 && la.join() === lb.join(), 'Liste: 141 Trennungen in 140 Reihen, dieselben Reihen und Tage wie der Trockenlauf', la.length + ' / ' + LT.zaehler.reihen);
  pr(LT.zaehler.zeilenWechseln === wechsel && wechsel === 95150, 'Zeilen, die die Reihe wechseln: Liste ' + LT.zaehler.zeilenWechseln + ' = aus dem Trockenlauf gerechnet ' + wechsel + ' (Soll 95.150)');
  var ab3 = Object.keys(LT.zaehler.nummerAb3).sort(), mit4 = ab3.filter(function (b3) { return LT.zaehler.nummerAb3[b3].length > 1; });
  pr(ab3.join() === 'AAC,CPAA,GIG,HYAC,ISRL,LCA,LEXEB' && mit4.join() === 'GIG,HYAC', 'Nummern ab ~3 bei sieben Kuerzeln (' + ab3.join(', ') + '), ~4 bei ' + mit4.join(', '));
  var namen = {}, doppelt = 0; LT.trennungen.forEach(function (t) { if (namen[t.nachfolger]) doppelt++; namen[t.nachfolger] = 1; });
  pr(doppelt === 0 && LT.schwelleKalendertage === K.LUECKE_TRENN_TAGE && K.LUECKE_TRENN_TAGE === 90, 'jeder Nachfolgername genau einmal; Schwelle ' + LT.schwelleKalendertage + ' Kalendertage = K.LUECKE_TRENN_TAGE');
});

/* =======================================================================================
 * Abschluss
 * ======================================================================================= */
var rot = ERG.reduce(function (s, e) { return s + e.rot; }, 0);
var n = ERG.reduce(function (s, e) { return s + e.pruefungen.length; }, 0);
process.stdout.write('\n===== ' + n + ' Pruefungen, ' + rot + ' rot =====\n');
fs.writeFileSync(path.join(__dirname, 'test-lauf.json'), JSON.stringify({ stand: new Date().toISOString(), aus: A.aus, kunst: A.kunst, n: n, rot: rot, abschnitte: ERG }, null, 1));
process.exit(rot > 0 ? 1 : 0);
