'use strict';
/* PANELDATEN - taegliche Querschnitts-Tafel aus dem Alpaca-Minutenarchiv (VORREGISTRIERUNG §1).
 *
 * Eine Zeile je (ET-Handelstag, Reihe). Je Reihe werden ALLE Jahresdateien in einem Zug gelesen, damit
 * Rendite und Umsatzklasse ueber Jahresgrenzen hinweg stimmen (Fehlerform: Fenster endet an der Datei).
 *
 * Aufruf:
 *   node --max-old-space-size=4096 paneldaten.js --aus <ordner> [--teil k/n] [--max N] [--reihen A B ...]
 *   node paneldaten.js --aus <ordner> --vereinen
 * v2.2 (Auftrag Nr. 67): dieselben Aufrufe mit --luecken (Teile UND Vereinen) und --aus voll-v22; --bis <tag> deckelt einen
 * Bau ohne --luecken auf einen Datenstand (Rueckwaerts-Probe gegen v2.1). Siehe MODUS unten.
 *
 * Ergebnis je Teil: <aus>/teil-<k>/<jahr>.bin (Spalten, siehe SPALTEN), <aus>/teil-<k>/_teil.json (Zaehler).
 * Nach --vereinen: <aus>/panel/<jahr>.bin + <aus>/panel/_stand.json.
 *
 * NUR LESEN auf E:. Keine Sperre, kein Netz. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var LP = require('./lesen-panel.js');
var TR = require('./kuerzelwechsel.js');

/* ---------- Bau-Modus (v2.2, Auftrag Nr. 67, 03.10.2026) ---------- */
/* OHNE --luecken baut dieses Modul unveraendert v2.1 (Kennung K.PANEL_KENNUNG) - an einer Teilmenge bitgleich geprueft
 * (pruefung-v22.js). MIT --luecken: Kennung K.PANEL_KENNUNG_V22, und jede Luecke > K.LUECKE_TRENN_TAGE Kalendertage zwischen
 * zwei aufeinanderfolgenden Tageszeilen einer Reihe beginnt eine neue Reihe (deterministische Liste luecken-trennungen.json,
 * kuerzelwechsel.js). bisTag deckelt den Bau auf den Datenstand, aus dem die Liste stammt: das Archiv waechst weiter (die
 * 2026er Dateien wurden am 03.10.2026 fortgeschrieben), und eine Liste aus dem Panel bis 2026-09-15 sagt nichts ueber Luecken,
 * die spaeter entstehen. */
var MODUS = { kennung: K.PANEL_KENNUNG, luecken: null, bisTag: null };
function modus(opt) {
  if (opt && opt.luecken) {
    var LU = TR.lueckenLaden();
    if (opt.bisTag && opt.bisTag !== LU.bisTag) throw new Error('--bis ' + opt.bisTag + ' widerspricht dem Stand der Luecken-Liste (' + LU.bisTag + ')');
    MODUS = { kennung: K.PANEL_KENNUNG_V22, luecken: LU, bisTag: LU.bisTag };
  } else MODUS = { kennung: K.PANEL_KENNUNG, luecken: null, bisTag: (opt && opt.bisTag) || null };
  SYM = null;
  return MODUS;
}

/* ---------- Spaltenformat ---------- */
/* v2 (18.09.2026): `faktor` = roh / bereinigt ueber alle EIGENEN Splits der Quelle (lesen-panel.js eigeneSplits) - in
 * v1 stand hier nur der Kopf-Faktor der bereinigten Kopie, und Reihen OHNE Kopie (GE, AMC, DD, XRX: wegen einer
 * Abspaltung ohne Kursfaktor) trugen ihre Splits roh. `rendite` ist die Rendite der BEREINIGTEN Reihe. */
var SPALTEN = [
  { name: 'sym', typ: 'u16' }, { name: 'tag', typ: 'u16' }, { name: 'marken', typ: 'u8' }, { name: 'klasse', typ: 'i8' },
  { name: 'kerzen', typ: 'u16' }, { name: 'rohSchluss', typ: 'f64' }, { name: 'rohEroeffnung', typ: 'f64' },
  { name: 'faktor', typ: 'f64' }, { name: 'rendite', typ: 'f32' }, { name: 'renditeOC', typ: 'f32' },
  { name: 'umsatzReg', typ: 'f32' }, { name: 'umsatzAuktion', typ: 'f32' },
];
var TYP = { u8: Uint8Array, i8: Int8Array, u16: Uint16Array, f32: Float32Array, f64: Float64Array };
function leer(n) { var o = {}; SPALTEN.forEach(function (s) { o[s.name] = new TYP[s.typ](n); }); o.n = n; return o; }
function schreibeBlock(pfad, sp, n, kopfExtra) {
  var kopf = Buffer.from(JSON.stringify(Object.assign({ kennung: MODUS.kennung, n: n, spalten: SPALTEN }, kopfExtra || {})), 'utf8');
  var len = Buffer.alloc(4); len.writeUInt32LE(kopf.length, 0);
  var teile = [len, kopf];
  SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
}
function leseBlock(pfad, kennung) {
  var buf = fs.readFileSync(pfad);
  var kl = buf.readUInt32LE(0);
  var kopf = JSON.parse(buf.slice(4, 4 + kl).toString('utf8'));
  var soll = kennung || MODUS.kennung;
  if (kopf.kennung !== soll) throw new Error('Panelkennung passt nicht: ' + kopf.kennung + ' statt ' + soll + ' (' + pfad + ')');
  var off = 4 + kl, n = kopf.n, sp = { n: n, kopf: kopf };
  SPALTEN.forEach(function (s) {
    var C = TYP[s.typ], by = n * C.BYTES_PER_ELEMENT;
    sp[s.name] = new C(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + by));
    off += by;
  });
  if (off !== buf.length) throw new Error('Panel-Datei ' + pfad + ': ' + (buf.length - off) + ' Bytes Rest - Format passt nicht');
  return sp;
}

/* ---------- Argumente ---------- */
function argumente(argv) {
  var a = { aus: null, teil: null, max: 0, reihen: null, vereinen: false, checkpoint: 50, neu: false, luecken: false, bis: null };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--teil') { var p = String(argv[++i]).split('/'); a.teil = { k: +p[0], n: +p[1] }; }
    else if (x === '--max') a.max = +argv[++i];
    else if (x === '--checkpoint') a.checkpoint = +argv[++i];
    else if (x === '--neu') a.neu = true;
    else if (x === '--vereinen') a.vereinen = true;
    else if (x === '--luecken') a.luecken = true;
    else if (x === '--bis') a.bis = argv[++i];
    else if (x === '--reihen') { a.reihen = []; while (i + 1 < argv.length && String(argv[i + 1]).slice(0, 2) !== '--') String(argv[++i]).split(',').forEach(function (s) { if (s) a.reihen.push(s); }); }
  }
  return a;
}

/* ---------- Symboltabelle: deterministisch aus reihen() + Referenzreihen ---------- */
var SYM = null;
function symbole() {
  if (SYM) return SYM;
  var R = LP.reihen().slice();
  var m = LP.meta();
  K.REFERENZ.forEach(function (r) {
    if (R.some(function (x) { return x.reihe === r; })) return;
    var e = m.lebenszeit[r];
    if (!e) throw new Error('Referenzreihe ' + r + ' fehlt in _lebenszeit.json - Regime und Pruefung 6 waeren blind. Abbruch.');
    R.push({ reihe: r, ordner: LP.ordnerFuer(r), lebend: 1, jahre: (e.jahre || []).slice().sort(), gruppe: 'referenz', art: 'ETF', schnittMs: null, abMs: null, referenz: true });
  });
  /* KUERZELWECHSEL (v2, 18.09.2026): je entschiedener Trennung (kuerzelwechsel-kandidaten.json, Luecke >=
   * K.WECHSEL_MIN_LUECKE_TAGE) eine Nachfolge-Reihe S~2 fuer die Balken ab dem Wechseltag - die alte Reihe endet
   * davor (lebt 0, Ende-Grund kuerzel-neu-vergeben), die neue beginnt mit 0 Vortagen. Deterministisch aus der Datei,
   * damit alle Teile dieselbe Symboltabelle bauen. */
  var W = TR.laden();
  var vorhanden = {}; R.forEach(function (x) { vorhanden[x.reihe] = x; });
  Object.keys(W.trennungen).sort().forEach(function (reihe) {
    var t = W.trennungen[reihe], base = vorhanden[reihe];
    if (!base) return;
    var name = t.basis + '~2'; if (vorhanden[name]) name = t.basis + '~3';
    base.trennung = { tag: t.tag, letzterVor: t.letzterVor, luecke: t.luecke, regel: t.regel, datum: t.datum,
      old_symbol: t.old_symbol, new_symbol: t.new_symbol, nachfolger: name };
    base.lebendVorTrennung = base.lebend; base.lebend = 0;
    var neu = { reihe: name, ordner: base.ordner, lebend: base.lebendVorTrennung, jahre: base.jahre, gruppe: base.gruppe,
      art: base.art, schnittMs: base.schnittMs, abMs: base.abMs, referenz: false, vorgaenger: reihe, wechsel: base.trennung };
    R.push(neu); vorhanden[name] = neu;
  });
  /* LUECKEN-TRENNUNG (v2.2): je Eintrag der Liste eine weitere Reihe fuer die Zeilen ab dem ersten Tag nach der Luecke. Gebaut
   * wird weiter die Reihe mit den Dateien (bauReihe); ihre Schnitte (Kuerzelwechsel aus v2.1 UND Luecken) liegen in Tagesfolge
   * in `schnitte`. Nur der letzte Abschnitt kann noch leben; `endet` nennt je Abschnitt den Schnitt, der ihn beendet. */
  if (MODUS.luecken) {
    var jeBau = {};
    MODUS.luecken.trennungen.forEach(function (t) { (jeBau[t.bauReihe] = jeBau[t.bauReihe] || []).push(t); });
    Object.keys(jeBau).sort().forEach(function (bau) {
      var base = vorhanden[bau];
      if (!base) throw new Error('Luecken-Trennung fuer unbekannte Reihe ' + bau + ' - Liste passt nicht zum Archiv. Abbruch.');
      var schnitte = base.trennung ? [base.trennung] : [];
      jeBau[bau].forEach(function (t) {
        if (vorhanden[t.nachfolger]) throw new Error('Reihenname ' + t.nachfolger + ' doppelt. Abbruch.');
        var lu = { art: 'luecke', tag: t.tag, letzterVor: t.letzterVor, tage: t.tage, reiheV21: t.reihe, vorAbschnitt: t.vorAbschnitt, nachfolger: t.nachfolger };
        var neuL = { reihe: t.nachfolger, ordner: base.ordner, lebend: 0, jahre: base.jahre, gruppe: base.gruppe, art: base.art,
          schnittMs: base.schnittMs, abMs: base.abMs, referenz: false, vorgaenger: bau, luecke: lu };
        R.push(neuL); vorhanden[t.nachfolger] = neuL; schnitte.push(lu);
      });
      schnitte.sort(function (a, b) { return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0; });
      for (var q = 1; q < schnitte.length; q++) if (schnitte[q].tag === schnitte[q - 1].tag) throw new Error('zwei Schnitte am selben Tag in ' + bau + '. Abbruch.');
      var lebt = base.lebendVorTrennung !== undefined ? base.lebendVorTrennung : base.lebend;
      var abschnitte = [base].concat(schnitte.map(function (s) { return vorhanden[s.nachfolger]; }));
      abschnitte.forEach(function (r, k) {
        r.lebend = k === abschnitte.length - 1 ? lebt : 0; r.endet = k < schnitte.length ? schnitte[k] : null;
        if (k) r.vorAbschnitt = abschnitte[k - 1].reihe;
        if (r.luecke && r.luecke.vorAbschnitt !== r.vorAbschnitt) throw new Error('Abschnittsfolge von ' + bau + ' passt nicht zur Liste (' + r.reihe + '). Abbruch.');
      });
      base.schnitte = schnitte;
    });
  }
  R.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  if (R.length > 65535) throw new Error('mehr als 65535 Reihen - Uint16 fuer sym reicht nicht');
  var idx = {}; R.forEach(function (r, i) { r.idx = i; idx[r.reihe] = i; });
  R.forEach(function (r) { if (r.trennung) r.trennung.idx = idx[r.trennung.nachfolger]; });
  R.forEach(function (r) { (r.schnitte || []).forEach(function (s) { s.idx = idx[s.nachfolger]; }); });
  SYM = { liste: R, idx: idx, referenz: K.REFERENZ.slice(), ausgeschlossen: LP.reihen().ausgeschlossen, trennungen: W };
  return SYM;
}

/* ---------- Massnahmen-Naehe (eigener Kalender, §1.6 Bit 3) ---------- */
function massnahmeNahTage(R, angewandtJeJahr, kal) {
  var unklar = LP.unklareAbspaltungen(), basis = R.reihe.replace(/~2$/, ''), aus = new Set();
  var mm = LP.massnahmenFuer(R);
  mm.forEach(function (m) {
    var jahr = +String(m.ex).slice(0, 4);
    var ang = angewandtJeJahr[jahr];
    var greift = !ang || !ang.set.has(m.art + '|' + m.ex) || (m.art === 'spin_offs' && unklar.has(basis + '|' + m.ex));
    if (!greift) return;
    var i = kal.idx[m.ex];
    if (i === undefined) { for (var q = 0; q < kal.tage.length; q++) if (kal.tage[q] > m.ex) { i = q; break; } }
    if (i === undefined) return;
    for (var d = Math.max(0, i - K.MASSNAHMEN_FENSTER_TAGE); d <= Math.min(kal.tage.length - 1, i + K.MASSNAHMEN_FENSTER_TAGE); d++) aus.add(kal.tage[d]);
  });
  return aus;
}

/* ---------- Median ueber ein gleitendes Fenster ---------- */
function median(arr) { var a = arr.slice().sort(function (x, y) { return x - y; }); var n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : 0.5 * (a[n / 2 - 1] + a[n / 2])) : NaN; }

/* ---------- Eine Reihe ueber alle Jahre ---------- */
function reiheBauen(R, kal, z) {
  var jahre = (R.jahre || []).filter(function (y) { return y >= 2016; }).sort(function (a, b) { return a - b; });
  var tage = [], angewandtJeJahr = {}, quelleReinJeJahr = {};
  for (var yi = 0; yi < jahre.length; yi++) {
    var jr = LP.ladeJahr(R, jahre[yi], kal);
    if (!jr.ok) { z.dateiFehler[jr.grund] = (z.dateiFehler[jr.grund] || 0) + 1; continue; }
    z.dateien++; z.bytes += jr.bytes; z.kerzenGesehen += jr.zaehler.kerzenGesehen; z.stempelkerzen += jr.zaehler.stempelkerzen;
    angewandtJeJahr[jahre[yi]] = { set: jr.angewandt, quelle: jr.quelle };
    quelleReinJeJahr[jahre[yi]] = jr.quelleRein;
    if (!jr.quelleRein) z.dateienNichtRein++;
    for (var i = 0; i < jr.tage.length; i++) tage.push(jr.tage[i]);
  }
  if (!tage.length) return null;
  tage.sort(function (a, b) { return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0; });
  /* Doppelte Tage (Jahresueberlappung) koennen es nicht geben - Sicherheitsnetz mit Zaehler. */
  var sauber = [];
  for (var q = 0; q < tage.length; q++) { if (q && tage[q].tag === tage[q - 1].tag) { z.doppelteTage++; continue; } sauber.push(tage[q]); }
  tage = sauber;
  /* DECKEL (--bis oder Stand der Luecken-Liste): Tage nach dem Stand werden nicht gebaut - der Bau bleibt auf dem Datenstand von
   * v2.1, und der letzte Tag der Reihe traegt LETZTER_TAG wie dort. Ohne Deckel unveraendert. */
  if (MODUS.bisTag) { tage = tage.filter(function (t) { return t.tag <= MODUS.bisTag; }); if (!tage.length) return null; }

  /* SPLIT-SPERRE (v2.1): eigene Splits nur mit Sprung in der Rohreihe; Tagesfaktor daraus neu zusammensetzen. */
  var sp = splitSperre(tage, LP.eigeneSplits(R), R.reihe);
  z.splitAkzeptiert += sp.akzeptiert.length; z.splitAbgelehnt += sp.abgelehnt.length;
  sp.abgelehnt.forEach(function (e) { if (z.splitAbgelehntListe.length < 500) z.splitAbgelehntListe.push(e); });
  for (var t2 = 0; t2 < tage.length; t2++) {
    var T2 = tage[t2], b = T2.bSpin == null ? 1 : T2.bSpin;
    for (var s2 = 0; s2 < sp.akzeptiert.length; s2++) if (sp.akzeptiert[s2].ex > T2.tag) b *= sp.akzeptiert[s2].faktor;
    T2.bFaktor = b;
  }
  var nah = massnahmeNahTage(R, angewandtJeJahr, kal);
  return zeilenAus(tage, R, kal, z, nah, quelleReinJeJahr);
}

/* ---------- Split-Sperre (rein, testbar) ---------- */
/** tage aufsteigend mit {tag, dateiSchluss, faktor}; eigene = [{ex, faktor}] (Quelle). Ein Split gilt, wenn die Rohreihe
 *  (dateiSchluss x Kopf-Faktor) vom letzten Tag vor dem Ex-Tag zum ersten Tag ab dem Ex-Tag mindestens
 *  K.SPLIT_SPERRE_ANTEIL des erwarteten log-Sprungs -ln(faktor) zeigt. Kleine Faktoren (|ln| < K.SPLIT_SPERRE_MIN_LOG)
 *  und Splits ohne Tag davor oder danach (nicht pruefbar, nicht verzerrend) gelten immer. */
function splitSperre(tage, eigene, reihe) {
  var akzeptiert = [], abgelehnt = [];
  (eigene || []).forEach(function (e) {
    var soll = -Math.log(e.faktor);
    if (!(Math.abs(soll) >= K.SPLIT_SPERRE_MIN_LOG)) { akzeptiert.push(e); return; }
    var iT = -1; for (var q = 0; q < tage.length; q++) if (tage[q].tag >= e.ex) { iT = q; break; }
    if (iT <= 0) { akzeptiert.push(e); return; }
    var rT = tage[iT].dateiSchluss * tage[iT].faktor, rV = tage[iT - 1].dateiSchluss * tage[iT - 1].faktor;
    if (!(rT > 0 && rV > 0)) { akzeptiert.push(e); return; }
    var ist = Math.log(rT / rV);
    if (Math.abs(ist - soll) <= (1 - K.SPLIT_SPERRE_ANTEIL) * Math.abs(soll)) akzeptiert.push(e);
    else abgelehnt.push({ reihe: reihe, ex: e.ex, art: e.art, faktor: e.faktor, rohVerhaeltnis: rT / rV, erwartet: 1 / e.faktor, tagVor: tage[iT - 1].tag, tagAb: tage[iT].tag });
  });
  return { akzeptiert: akzeptiert, abgelehnt: abgelehnt };
}

/* ---------- Tageszeilen einer Reihe (rein, ohne Platte - test.js prueft Roundtrip und Trennung hieran) ---------- */
/** tage: aufsteigend, je Tag {tag, dateiSchluss, dateiEroeffnung, faktor (Kopf: roh = datei x faktor),
 *  bFaktor (roh / bereinigt), umsatzReg, umsatzAuktion, kerzen, schlussErsatz, eroeffnungErsatz, dichteOk, stempelTag}.
 *  R.idx ist die Reihe; R.trennung (falls gesetzt) gibt die Zeilen ab R.trennung.tag der Reihe R.trennung.idx. */
function zeilenAus(tage, R, kal, z, nah, quelleReinJeJahr) {
  var umsatzFenster = [], zeilen = [], symIdx = R.idx, start = 0;
  /* Schnitte in Tagesfolge: v2.1 kennt hoechstens einen (R.trennung, Kuerzelwechsel), v2.2 dazu die Luecken (R.schnitte). */
  var schnitte = R.schnitte || (R.trennung ? [R.trennung] : []), sk = 0;
  quelleReinJeJahr = quelleReinJeJahr || {};
  for (var d = 0; d < tage.length; d++) {
    var T = tage[d], jahr = +T.tag.slice(0, 4);
    /* KUERZELWECHSEL (v2): ab dem entschiedenen Tag gehoeren die Zeilen dem Nachfolger. Die alte Reihe endet mit
     * LETZTER_TAG davor, der Nachfolger beginnt ohne Vortag (keine Rendite, leeres Umsatzfenster, 0 Vortage). */
    /* v2.2: dasselbe an jeder Luecke der Liste (art 'luecke') - der Abschnitt davor endet mit LETZTER_TAG, der neue beginnt ohne
     * Vortag: keine Rendite ueber die Luecke, Umsatzfenster und Klasse laufen je Reihe. Keine Zeile geht verloren. */
    if (sk < schnitte.length && T.tag >= schnitte[sk].tag) {
      var tr = schnitte[sk++];
      if (T.tag !== tr.tag || !zeilen.length || zeilen[zeilen.length - 1].tagText !== tr.letzterVor) z.trennungAbweichung++;
      if (zeilen.length) zeilen[zeilen.length - 1].marken |= K.M_LETZTER_TAG;
      symIdx = tr.idx; start = d; umsatzFenster = [];
      if (tr.art === 'luecke') z.lueckenTrennungen = (z.lueckenTrennungen || 0) + 1; else z.trennungen++;
    }
    var marken = 0;
    if (quelleReinJeJahr[jahr]) marken |= K.M_QUELLE_REIN;
    if (T.schlussErsatz) marken |= K.M_SCHLUSS_ERSATZ;
    if (T.dichteOk) marken |= K.M_DICHTE_OK;
    if (nah.has(T.tag)) marken |= K.M_MASSNAHME_NAH;
    if (T.stempelTag) { marken |= K.M_STEMPEL_TAG; z.stempeltage++; }
    if (T.eroeffnungErsatz) marken |= K.M_EROEFFNUNG_ERSATZ;
    if (d === tage.length - 1) marken |= K.M_LETZTER_TAG;
    if (T.schlussErsatz) z.schlussErsatz[jahr] = (z.schlussErsatz[jahr] || 0) + 1;
    if (T.eroeffnungErsatz) z.eroeffnungErsatz[jahr] = (z.eroeffnungErsatz[jahr] || 0) + 1;
    z.tageJeJahr[jahr] = (z.tageJeJahr[jahr] || 0) + 1;

    /* Rendite (BEREINIGT, §1.4, Fassung v2): roh = datei x Kopf-Faktor, bereinigt = roh / bFaktor. Die v1-Annahme
     * "die Dateikurse SIND die bereinigte Reihe" galt nur fuer Reihen mit Kopie; ohne Kopie (GE, AMC, DD, XRX) blieb
     * der Split roh, und mit fremdem unit_split im Kopf (PANW) war die Kopie selbst falsch. Gerechnet als
     * datei x (faktor / bFaktor), damit Tage ohne Unterschied (faktor == bFaktor) BITGLEICH zu v1 bleiben.
     * Vortag ist der VORTAG DER REIHE im Panel; Luecken werden ueberbrueckt, aber gezaehlt. */
    var rendite = NaN;
    if (d > start) {
      var V = tage[d - 1];
      var bT = T.dateiSchluss * (T.faktor / T.bFaktor), bV = V.dateiSchluss * (V.faktor / V.bFaktor);
      if (bV > 0 && bT > 0) rendite = 100 * (bT / bV - 1);
      var abstand = kal.idx[T.tag] - kal.idx[V.tag];
      if (abstand > 1) z.luecken++;
      /* Gegenprobe im Bau (v2.2): eine Luecke ueber der Schwelle, die NICHT getrennt wurde, darf es nicht geben (Soll 0). */
      if (MODUS.luecken && (Date.parse(T.tag) - Date.parse(V.tag)) / 86400000 > K.LUECKE_TRENN_TAGE) z.lueckenUngetrennt = (z.lueckenUngetrennt || 0) + 1;
    }
    if (!(rendite === rendite)) marken |= K.M_KEINE_RENDITE;
    /* Eroeffnung -> Schluss desselben Tages: Faktor kuerzt sich, roh und bereinigt sind gleich. */
    var renditeOC = (T.dateiEroeffnung > 0) ? 100 * (T.dateiSchluss / T.dateiEroeffnung - 1) : NaN;
    /* ROHE Kurse (§1.4): jede PREIS-Aussage - Cent-Boden, Mindestkurs - rechnet hiermit. */
    var rohSchluss = T.dateiSchluss * T.faktor, rohEroeffnung = T.dateiEroeffnung * T.faktor;

    /* Umsatzklasse (§1.5): Median der letzten 60 Tage VOR diesem Tag, mindestens 40 davon vorhanden. */
    var klasse = -1;
    if (umsatzFenster.length >= K.UMSATZ_MIN_TAGE) klasse = K.klasseIndex(median(umsatzFenster));
    umsatzFenster.push(T.umsatzReg + T.umsatzAuktion);
    if (umsatzFenster.length > K.UMSATZ_FENSTER) umsatzFenster.shift();

    zeilen.push({ tag: kal.idx[T.tag], tagText: T.tag, symIdx: symIdx, jahr: jahr, marken: marken, klasse: klasse, kerzen: Math.min(65535, T.kerzen),
      rohSchluss: rohSchluss, rohEroeffnung: rohEroeffnung, faktor: T.bFaktor, rendite: rendite, renditeOC: renditeOC,
      umsatzReg: T.umsatzReg, umsatzAuktion: T.umsatzAuktion });
  }
  return zeilen;
}

/* ---------- Hauptlauf eines Teils ---------- */
function lauf(a) {
  var kal = K.kalender();
  var S = symbole();
  var alle = S.liste;
  var meine = alle.filter(function (r, i) {
    if (a.reihen) return a.reihen.indexOf(r.reihe) !== -1;
    return !a.teil || (i % a.teil.n) === a.teil.k;
  });
  if (a.max) meine = meine.slice(0, a.max);
  var ordner = path.join(a.aus, 'teil-' + (a.teil ? a.teil.k : 0));
  fs.mkdirSync(ordner, { recursive: true });
  /* Anhaengen statt Schreibstrom: der Strom materialisierte die Datei nie, und der einzige Laufnachweis
   * war die umgeleitete Standardausgabe. Ein Lauf muss auf der Platte sichtbar sein, waehrend er laeuft. */
  var logPfad = path.join(ordner, '_lauf.log');
  function sag(s) { var z = new Date().toISOString() + ' ' + s; try { fs.appendFileSync(logPfad, z + '\n'); } catch (e) { /* Ordner weg: Ausgabe reicht */ } process.stdout.write(z + '\n'); }
  sag('START Teil ' + (a.teil ? a.teil.k + '/' + a.teil.n : 'ganz') + ' | Reihen ' + meine.length + ' | Kennung ' + K.KONFIG_KENNUNG +
    (MODUS.luecken || MODUS.bisTag ? ' | Panel ' + MODUS.kennung + ' | Deckel ' + MODUS.bisTag + (MODUS.luecken ? ' | Luecken-Trennungen ' + MODUS.luecken.trennungen.length : '') : ''));

  var z = { reihen: 0, zeilen: 0, dateien: 0, bytes: 0, kerzenGesehen: 0, stempelkerzen: 0, stempeltage: 0,
    dateiFehler: {}, dateienNichtRein: 0, doppelteTage: 0, luecken: 0,
    schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, ohneZeilen: 0,
    trennungen: 0, trennungAbweichung: 0, nachfolgerUebersprungen: 0, splitAkzeptiert: 0, splitAbgelehnt: 0, splitAbgelehntListe: [] };
  if (MODUS.luecken) { z.lueckenTrennungen = 0; z.lueckenUngetrennt = 0; }
  var jeJahr = {};                                            // jahr -> {sp, n, cap}

  /* FORTSETZBARKEIT. Der erste Vollauf wurde nach 11 Minuten still getoetet (die Prozesse sterben mit der
   * Sitzung, die sie gestartet hat - bekannte Falle), und weil nichts geschrieben war, war alles weg.
   * Jetzt: alle `checkpoint` Reihen werden die Jahresbloecke UND _fortschritt.json geschrieben; ein
   * Neustart ohne --neu liest beides und ueberspringt, was schon drin ist. */
  var fortPfad = path.join(ordner, '_fortschritt.json'), erledigt = {};
  /* v2.2: ein Teilordner gehoert zu genau einer Panel-Fassung und einem Deckel - nie still mit der anderen fortsetzen (der
   * Leseversuch unten wuerde die fremden Bloecke verwerfen und von vorn ueberschreiben). */
  if (!a.neu && fs.existsSync(fortPfad)) {
    var fk = null; try { fk = JSON.parse(fs.readFileSync(fortPfad, 'utf8')); } catch (e0) { fk = null; }
    if (fk && ((fk.panel || K.PANEL_KENNUNG) !== MODUS.kennung || (fk.bisTag || null) !== MODUS.bisTag))
      throw new Error('Teilordner ' + ordner + ' wurde als ' + (fk.panel || K.PANEL_KENNUNG) + ' (Deckel ' + (fk.bisTag || '-') + ') begonnen, dieser Aufruf baut ' + MODUS.kennung + ' (Deckel ' + (MODUS.bisTag || '-') + '). Abbruch.');
  }
  if (!a.neu && fs.existsSync(fortPfad)) {
    try {
      var fj = JSON.parse(fs.readFileSync(fortPfad, 'utf8'));
      if (fj.kennung === K.KONFIG_KENNUNG) {
        erledigt = fj.erledigt || {};
        Object.keys(fj.zaehler || {}).forEach(function (kk) { z[kk] = fj.zaehler[kk]; });
        fs.readdirSync(ordner).filter(function (f) { return /^\d{4}\.bin$/.test(f); }).forEach(function (f) {
          var b = leseBlock(path.join(ordner, f)), jahr = f.slice(0, 4);
          var e = jeJahr[jahr] = { cap: Math.max(4096, b.n), n: b.n, sp: leer(Math.max(4096, b.n)) };
          SPALTEN.forEach(function (s) { e.sp[s.name].set(b[s.name].subarray(0, b.n)); });
        });
      }
    } catch (e) { erledigt = {}; jeJahr = {}; }
  }
  function checkpoint() {
    Object.keys(jeJahr).forEach(function (j) { schreibeBlock(path.join(ordner, j + '.bin'), jeJahr[j].sp, jeJahr[j].n, { jahr: +j, teil: a.teil ? a.teil.k : 0 }); });
    var tmp = fortPfad + '.tmp';
    var fo = { kennung: K.KONFIG_KENNUNG, stand: new Date().toISOString(), erledigt: erledigt, zaehler: z };
    if (MODUS.luecken || MODUS.bisTag) { fo.panel = MODUS.kennung; fo.bisTag = MODUS.bisTag; }
    fs.writeFileSync(tmp, JSON.stringify(fo));
    fs.renameSync(tmp, fortPfad);
  }
  function anhaenge(jahr, symIdx, r) {
    var e = jeJahr[jahr];
    if (!e) e = jeJahr[jahr] = { cap: 4096, n: 0, sp: leer(4096) };
    if (e.n >= e.cap) { var neu = leer(e.cap * 2); SPALTEN.forEach(function (s) { neu[s.name].set(e.sp[s.name]); }); e.cap *= 2; e.sp = neu; }
    var i = e.n++;
    e.sp.sym[i] = symIdx; e.sp.tag[i] = r.tag; e.sp.marken[i] = r.marken; e.sp.klasse[i] = r.klasse;
    e.sp.kerzen[i] = r.kerzen; e.sp.rohSchluss[i] = r.rohSchluss; e.sp.rohEroeffnung[i] = r.rohEroeffnung;
    e.sp.faktor[i] = r.faktor; e.sp.rendite[i] = r.rendite; e.sp.renditeOC[i] = r.renditeOC;
    e.sp.umsatzReg[i] = r.umsatzReg; e.sp.umsatzAuktion[i] = r.umsatzAuktion;
  }

  var t0 = Date.now(), schonDa = Object.keys(erledigt).length, seitCp = 0, bytesVorher = z.bytes;
  if (schonDa) sag('Fortsetzung: ' + schonDa + ' Reihen schon erledigt, ' + z.zeilen + ' Zeilen im Block');
  for (var i = 0; i < meine.length; i++) {
    var R = meine[i];
    if (erledigt[R.reihe] !== undefined) continue;
    /* Nachfolge-Reihen (S~2 aus einer Trennung) haben keine eigenen Dateien: ihre Zeilen schreibt die Vorgaenger-Reihe. */
    if (R.vorgaenger) { z.nachfolgerUebersprungen++; erledigt[R.reihe] = 0; continue; }
    var zeilen = null;
    try { zeilen = reiheBauen(R, kal, z); }
    catch (e) { z.dateiFehler['AUSNAHME ' + R.reihe + ': ' + e.message] = 1; sag('FEHLER ' + R.reihe + ': ' + e.message); erledigt[R.reihe] = -1; continue; }
    z.reihen++;
    if (!zeilen || !zeilen.length) { z.ohneZeilen++; erledigt[R.reihe] = 0; seitCp++; }
    else {
      for (var q = 0; q < zeilen.length; q++) { anhaenge(zeilen[q].jahr, zeilen[q].symIdx, zeilen[q]); z.zeilen++; }
      erledigt[R.reihe] = zeilen.length; seitCp++;
    }
    if (seitCp >= a.checkpoint) {
      seitCp = 0; checkpoint();
      var dt = (Date.now() - t0) / 1000, fertig = Object.keys(erledigt).length;
      sag(fertig + '/' + meine.length + ' | Zeilen ' + z.zeilen + ' | ' + (z.bytes / 1e9).toFixed(1) + ' GB | ' + dt.toFixed(0) + ' s | ' + ((z.bytes - bytesVorher) / 1e6 / dt).toFixed(1) + ' MB/s | Rest ~' + ((dt / Math.max(1, fertig - schonDa)) * (meine.length - fertig) / 60).toFixed(0) + ' min');
    }
  }
  checkpoint();
  z.sekunden = (Date.now() - t0) / 1000;
  z.jahre = Object.keys(jeJahr).map(function (j) { return { jahr: +j, n: jeJahr[j].n }; }).sort(function (x, y) { return x.jahr - y.jahr; });
  fs.writeFileSync(path.join(ordner, '_teil.json'), JSON.stringify(z, null, 1));
  sag('FERTIG | Reihen ' + z.reihen + ' | Zeilen ' + z.zeilen + ' | ' + z.sekunden.toFixed(0) + ' s');

}

/* ---------- Vereinen ---------- */
function vereinen(a) {
  var kal = K.kalender(), S = symbole();
  var teile = fs.readdirSync(a.aus).filter(function (d) { return /^teil-\d+$/.test(d); }).sort();
  if (!teile.length) throw new Error('keine Teilordner unter ' + a.aus);
  var panel = path.join(a.aus, 'panel');
  /* v2.2: ein vorhandenes Panel einer ANDEREN Fassung wird nie ueberschrieben (voll/panel ist v2.1 und bleibt es). */
  var standAlt = path.join(panel, '_stand.json');
  if (fs.existsSync(standAlt) && JSON.parse(fs.readFileSync(standAlt, 'utf8')).kennung !== MODUS.kennung) throw new Error('In ' + panel + ' liegt ein Panel anderer Kennung - dieser Aufruf vereint ' + MODUS.kennung + '. Abbruch.');
  fs.mkdirSync(panel, { recursive: true });
  var jeSym = MODUS.luecken ? {} : null;                       // v2.2: erster/letzter Tag und Zeilenzahl je Reihe (Reihentafel)
  var gesamt = { kennung: MODUS.kennung, konfig: K.KONFIG_KENNUNG, stand: new Date().toISOString(),
    teile: teile.length, zeilen: 0, jahre: [], zeilenJeTag: {}, zaehler: {} };
  /* Zaehler der Teile addieren */
  var addiere = function (ziel, q) { Object.keys(q).forEach(function (k) { if (typeof q[k] === 'number') ziel[k] = (ziel[k] || 0) + q[k]; else if (q[k] && typeof q[k] === 'object' && !Array.isArray(q[k])) { ziel[k] = ziel[k] || {}; addiere(ziel[k], q[k]); } }); };
  var abgelehnt = [];
  teile.forEach(function (t) {
    var p = path.join(a.aus, t, '_teil.json');
    if (fs.existsSync(p)) { var tj = JSON.parse(fs.readFileSync(p, 'utf8')); addiere(gesamt.zaehler, tj); abgelehnt = abgelehnt.concat(tj.splitAbgelehntListe || []); }
  });
  gesamt.zaehler.splitAbgelehntListe = abgelehnt.sort(function (x, y) { return x.reihe < y.reihe ? -1 : x.reihe > y.reihe ? 1 : x.ex < y.ex ? -1 : 1; });
  var jahre = {};
  teile.forEach(function (t) {
    fs.readdirSync(path.join(a.aus, t)).filter(function (f) { return /^\d{4}\.bin$/.test(f); }).forEach(function (f) {
      (jahre[f.slice(0, 4)] = jahre[f.slice(0, 4)] || []).push(path.join(a.aus, t, f));
    });
  });
  Object.keys(jahre).sort().forEach(function (j) {
    /* NICHT `map(leseBlock)`: seit v2 hat leseBlock einen zweiten Parameter (Kennung), und map reicht den Index durch
     * ("Panelkennung passt nicht: ... statt 1", 18.09.2026, erster Vereinen-Lauf). */
    var bloecke = jahre[j].map(function (p) { return leseBlock(p); }), n = 0;
    bloecke.forEach(function (b) { n += b.n; });
    var sp = leer(n), off = 0;
    bloecke.forEach(function (b) { SPALTEN.forEach(function (s) { sp[s.name].set(b[s.name].subarray(0, b.n), off); }); off += b.n; });
    /* nach (tag, sym) sortieren - der Pruefstand liest tageweise */
    var ord = new Uint32Array(n); for (var i = 0; i < n; i++) ord[i] = i;
    var tg = sp.tag, sy = sp.sym;
    var ordA = Array.prototype.slice.call(ord);
    ordA.sort(function (x, y) { return tg[x] - tg[y] || sy[x] - sy[y]; });
    var neu = leer(n);
    for (var q = 0; q < n; q++) { var src = ordA[q]; SPALTEN.forEach(function (s) { neu[s.name][q] = sp[s.name][src]; }); }
    schreibeBlock(path.join(panel, j + '.bin'), neu, n, { jahr: +j });
    gesamt.zeilen += n; gesamt.jahre.push({ jahr: +j, n: n });
    for (var w = 0; w < n; w++) gesamt.zeilenJeTag[neu.tag[w]] = (gesamt.zeilenJeTag[neu.tag[w]] || 0) + 1;
    if (jeSym) for (var w2 = 0; w2 < n; w2++) { var js = jeSym[neu.sym[w2]] || (jeSym[neu.sym[w2]] = { von: neu.tag[w2], bis: neu.tag[w2], n: 0 }); js.bis = neu.tag[w2]; js.n++; }
    process.stdout.write('vereint ' + j + ': ' + n + ' Zeilen aus ' + bloecke.length + ' Teilen\n');
  });
  gesamt.jahre.sort(function (x, y) { return x.jahr - y.jahr; });
  /* Letzter VOLLSTAENDIGER Handelstag (NACHTRAG 1): der letzte Tag, dessen Zeilenzahl mindestens 80 % des
   * Medians der fuenf vorhergehenden Handelstage erreicht. Alles danach faellt aus dem Panel. */
  var tagIdx = Object.keys(gesamt.zeilenJeTag).map(Number).sort(function (x, y) { return x - y; });
  var letzterVoll = null, wegTage = [];
  for (var i2 = tagIdx.length - 1; i2 >= 5; i2--) {
    var vor = []; for (var v = 1; v <= 5; v++) vor.push(gesamt.zeilenJeTag[tagIdx[i2 - v]] || 0);
    vor.sort(function (x, y) { return x - y; });
    var med = vor[2];
    if ((gesamt.zeilenJeTag[tagIdx[i2]] || 0) >= 0.8 * med) { letzterVoll = tagIdx[i2]; break; }
    wegTage.push({ tag: kal.tage[tagIdx[i2]], zeilen: gesamt.zeilenJeTag[tagIdx[i2]], median5: med });
  }
  gesamt.letzterVollTagIdx = letzterVoll;
  gesamt.letzterVollTag = letzterVoll == null ? null : kal.tage[letzterVoll];
  gesamt.unvollstaendigeTage = wegTage.reverse();
  gesamt.symbole = S.liste.map(function (r) {
    /* Der Ende-Grund der Grundstudie beschreibt die LETZTEN Balken des Kuerzels - nach einer Trennung also den
     * Nachfolger (HCP: Uebernahme HashiCorp 2025 gehoert zu HCP~2); die alte Reihe endet mit kuerzel-neu-vergeben. */
    var g = K.gruende().karte[r.vorgaenger || r.reihe] || null;
    var e = { reihe: r.reihe, ordner: r.ordner, lebend: r.lebend, art: r.art || null, referenz: !!r.referenz,
      ende_grund: g ? g.grund : null, ende_datum: g ? g.datum : null };
    if (r.trennung) { e.lebend = 0; e.ende_grund = K.ENDE_GRUND_KUERZEL; e.ende_datum = r.trennung.letzterVor; e.kuerzelwechsel = r.trennung; }
    if (r.vorgaenger) { e.vorgaenger = r.vorgaenger; e.kuerzelwechsel = r.wechsel; }
    /* v2.2: Abschnitte eines Kuerzels mit Luecken-Trennung. Der Abschnitt nach einer Luecke nennt seinen Vorgaenger-Abschnitt und
     * die Luecke; wer an einem Schnitt endet, traegt dessen Grund und Datum (Luecke: K.ENDE_GRUND_LUECKE, Kuerzelwechsel wie v2.1);
     * der letzte Abschnitt erbt Leben und Ende-Grund der Grundstudie. */
    if (MODUS.luecken && r.endet !== undefined) {
      if (r.vorAbschnitt) e.vorgaenger = r.vorAbschnitt;         // Abschnitt davor in Zeitfolge (GIG~2 folgt in v2.2 auf GIG~3)
      if (r.luecke) { e.luecke = r.luecke; delete e.kuerzelwechsel; }
      if (r.endet) {
        e.lebend = 0; e.ende_datum = r.endet.letzterVor;
        if (r.endet.art === 'luecke') { e.ende_grund = K.ENDE_GRUND_LUECKE; if (!r.wechsel) delete e.kuerzelwechsel; }
        else { e.ende_grund = K.ENDE_GRUND_KUERZEL; e.kuerzelwechsel = r.endet; }
      } else { e.lebend = r.lebend; e.ende_grund = g ? g.grund : null; e.ende_datum = g ? g.datum : null; if (!r.wechsel) delete e.kuerzelwechsel; }
    }
    return e;
  });
  gesamt.kuerzelwechsel = { kennung: S.trennungen.kennung, entschiedenAus: S.trennungen.entschiedenAus, n: Object.keys(S.trennungen.trennungen).length,
    minLuecke: K.WECHSEL_MIN_LUECKE_TAGE, trennungenGebaut: gesamt.zaehler.trennungen || 0, abweichungen: gesamt.zaehler.trennungAbweichung || 0 };
  if (MODUS.luecken) {
    gesamt.luecken = { kennung: MODUS.luecken.kennung, entschiedenAus: MODUS.luecken.entschiedenAus, schwelleKalendertage: K.LUECKE_TRENN_TAGE,
      bisTag: MODUS.bisTag, n: MODUS.luecken.trennungen.length, trennungenGebaut: gesamt.zaehler.lueckenTrennungen || 0,
      ungetrennt: gesamt.zaehler.lueckenUngetrennt || 0, zeilenWechselnSoll: MODUS.luecken.zaehler.zeilenWechseln };
    var tafel = TR.reihenAbschnitte(gesamt.symbole, jeSym, kal, gesamt.kennung), tp = path.join(a.aus, 'reihen-abschnitte.json');
    fs.writeFileSync(tp + '.tmp', JSON.stringify(tafel, null, 1)); fs.renameSync(tp + '.tmp', tp);
    process.stdout.write('Reihentafel: ' + JSON.stringify(tafel.zaehler) + ' -> ' + tp + '\n');
  }
  gesamt.tage = kal.tage;
  gesamt.ausgeschlosseneArten = S.ausgeschlossen;
  gesamt.gruendeKennung = K.gruende().kennung;
  fs.writeFileSync(path.join(panel, '_stand.json'), JSON.stringify(gesamt));
  process.stdout.write('PANEL FERTIG: ' + gesamt.zeilen + ' Zeilen, letzter vollstaendiger Handelstag ' + gesamt.letzterVollTag + ', ' + wegTage.length + ' unvollstaendige Tage am Rand\n');
}

/* ---------- Panel lesen (fuer pruefstand.js und test.js) ---------- */
/** opt.ordner: anderer Panelordner (z. B. voll/panel-v1), opt.kennung: dessen Kennung (K.PANEL_KENNUNG_V1) - nur fuer
 *  den Vergleich vorher/nachher; ohne opt liest es <aus>/panel mit der aktuellen Kennung. */
function ladePanel(aus, opt) {
  var panel = (opt && opt.ordner) || path.join(aus, 'panel'), kn = opt && opt.kennung;
  var stand = JSON.parse(fs.readFileSync(path.join(panel, '_stand.json'), 'utf8'));
  /* v2.2: ohne ausdrueckliche Kennung gilt die des Standes, wenn sie eine lesbare Fassung ist - der ORDNER waehlt das Panel
   * (voll/ = v2.1, voll-v22/ = v2.2). Fuer voll/ aendert das nichts: dort steht K.PANEL_KENNUNG. */
  if (!kn && K.PANEL_KENNUNGEN_LESBAR.indexOf(stand.kennung) !== -1) kn = stand.kennung;
  var jahre = {};
  stand.jahre.forEach(function (j) { jahre[j.jahr] = leseBlock(path.join(panel, j.jahr + '.bin'), kn); });
  return { stand: stand, jahre: jahre };
}

if (require.main === module) {
  var a = argumente(process.argv.slice(2));
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  modus({ luecken: a.luecken, bisTag: a.bis });
  if (a.luecken && path.basename(path.resolve(a.aus)) === 'voll') { process.stderr.write('--luecken baut v2.2 und schreibt nie nach voll/ (v2.1)\n'); process.exit(2); }
  fs.mkdirSync(a.aus, { recursive: true });
  if (a.vereinen) vereinen(a); else lauf(a);
}

module.exports = { SPALTEN: SPALTEN, leer: leer, schreibeBlock: schreibeBlock, leseBlock: leseBlock,
  symbole: symbole, modus: modus, reiheBauen: reiheBauen, zeilenAus: zeilenAus, splitSperre: splitSperre, ladePanel: ladePanel, median: median, argumente: argumente, vereinen: vereinen };
