'use strict';
/* PANELDATEN - taegliche Querschnitts-Tafel aus dem Alpaca-Minutenarchiv (VORREGISTRIERUNG §1).
 *
 * Eine Zeile je (ET-Handelstag, Reihe). Je Reihe werden ALLE Jahresdateien in einem Zug gelesen, damit
 * Rendite und Umsatzklasse ueber Jahresgrenzen hinweg stimmen (Fehlerform: Fenster endet an der Datei).
 *
 * Aufruf:
 *   node --max-old-space-size=4096 paneldaten.js --aus <ordner> [--teil k/n] [--max N] [--reihen A B ...]
 *   node paneldaten.js --aus <ordner> --vereinen
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

/* ---------- Spaltenformat ---------- */
var SPALTEN = [
  { name: 'sym', typ: 'u16' }, { name: 'tag', typ: 'u16' }, { name: 'marken', typ: 'u8' }, { name: 'klasse', typ: 'i8' },
  { name: 'kerzen', typ: 'u16' }, { name: 'rohSchluss', typ: 'f64' }, { name: 'rohEroeffnung', typ: 'f64' },
  { name: 'faktor', typ: 'f64' }, { name: 'rendite', typ: 'f32' }, { name: 'renditeOC', typ: 'f32' },
  { name: 'umsatzReg', typ: 'f32' }, { name: 'umsatzAuktion', typ: 'f32' },
];
var TYP = { u8: Uint8Array, i8: Int8Array, u16: Uint16Array, f32: Float32Array, f64: Float64Array };
function leer(n) { var o = {}; SPALTEN.forEach(function (s) { o[s.name] = new TYP[s.typ](n); }); o.n = n; return o; }
function schreibeBlock(pfad, sp, n, kopfExtra) {
  var kopf = Buffer.from(JSON.stringify(Object.assign({ kennung: K.PANEL_KENNUNG, n: n, spalten: SPALTEN }, kopfExtra || {})), 'utf8');
  var len = Buffer.alloc(4); len.writeUInt32LE(kopf.length, 0);
  var teile = [len, kopf];
  SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
}
function leseBlock(pfad) {
  var buf = fs.readFileSync(pfad);
  var kl = buf.readUInt32LE(0);
  var kopf = JSON.parse(buf.slice(4, 4 + kl).toString('utf8'));
  if (kopf.kennung !== K.PANEL_KENNUNG) throw new Error('Panelkennung passt nicht: ' + kopf.kennung + ' statt ' + K.PANEL_KENNUNG + ' (' + pfad + ')');
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
  var a = { aus: null, teil: null, max: 0, reihen: null, vereinen: false, checkpoint: 50, neu: false };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--teil') { var p = String(argv[++i]).split('/'); a.teil = { k: +p[0], n: +p[1] }; }
    else if (x === '--max') a.max = +argv[++i];
    else if (x === '--checkpoint') a.checkpoint = +argv[++i];
    else if (x === '--neu') a.neu = true;
    else if (x === '--vereinen') a.vereinen = true;
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
  R.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  if (R.length > 65535) throw new Error('mehr als 65535 Reihen - Uint16 fuer sym reicht nicht');
  var idx = {}; R.forEach(function (r, i) { r.idx = i; idx[r.reihe] = i; });
  SYM = { liste: R, idx: idx, referenz: K.REFERENZ.slice(), ausgeschlossen: LP.reihen().ausgeschlossen };
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

  var nah = massnahmeNahTage(R, angewandtJeJahr, kal);
  var umsatzFenster = [], zeilen = [];
  for (var d = 0; d < tage.length; d++) {
    var T = tage[d], jahr = +T.tag.slice(0, 4);
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

    /* Rendite (BEREINIGT, §1.4): die Dateikurse SIND die bereinigte Reihe - jede Jahresdatei ist auf die
     * heutige Skala bereinigt, die Reihe ist ueber Jahresgrenzen stetig. Nicht durch `faktor` teilen: das
     * waere eine zweite Bereinigung und erzeugte am Ex-Tag genau den Sprung, den die Bereinigung entfernt.
     * Vortag ist der VORTAG DER REIHE im Panel; Luecken werden ueberbrueckt, aber gezaehlt. */
    var rendite = NaN;
    if (d > 0) {
      var V = tage[d - 1];
      if (V.dateiSchluss > 0 && T.dateiSchluss > 0) rendite = 100 * (T.dateiSchluss / V.dateiSchluss - 1);
      var abstand = kal.idx[T.tag] - kal.idx[V.tag];
      if (abstand > 1) z.luecken++;
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

    zeilen.push({ tag: kal.idx[T.tag], jahr: jahr, marken: marken, klasse: klasse, kerzen: Math.min(65535, T.kerzen),
      rohSchluss: rohSchluss, rohEroeffnung: rohEroeffnung, faktor: T.faktor, rendite: rendite, renditeOC: renditeOC,
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
  sag('START Teil ' + (a.teil ? a.teil.k + '/' + a.teil.n : 'ganz') + ' | Reihen ' + meine.length + ' | Kennung ' + K.KONFIG_KENNUNG);

  var z = { reihen: 0, zeilen: 0, dateien: 0, bytes: 0, kerzenGesehen: 0, stempelkerzen: 0, stempeltage: 0,
    dateiFehler: {}, dateienNichtRein: 0, doppelteTage: 0, luecken: 0,
    schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, ohneZeilen: 0 };
  var jeJahr = {};                                            // jahr -> {sp, n, cap}

  /* FORTSETZBARKEIT. Der erste Vollauf wurde nach 11 Minuten still getoetet (die Prozesse sterben mit der
   * Sitzung, die sie gestartet hat - bekannte Falle), und weil nichts geschrieben war, war alles weg.
   * Jetzt: alle `checkpoint` Reihen werden die Jahresbloecke UND _fortschritt.json geschrieben; ein
   * Neustart ohne --neu liest beides und ueberspringt, was schon drin ist. */
  var fortPfad = path.join(ordner, '_fortschritt.json'), erledigt = {};
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
    fs.writeFileSync(tmp, JSON.stringify({ kennung: K.KONFIG_KENNUNG, stand: new Date().toISOString(), erledigt: erledigt, zaehler: z }));
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
    var zeilen = null;
    try { zeilen = reiheBauen(R, kal, z); }
    catch (e) { z.dateiFehler['AUSNAHME ' + R.reihe + ': ' + e.message] = 1; sag('FEHLER ' + R.reihe + ': ' + e.message); erledigt[R.reihe] = -1; continue; }
    z.reihen++;
    if (!zeilen || !zeilen.length) { z.ohneZeilen++; erledigt[R.reihe] = 0; seitCp++; }
    else {
      for (var q = 0; q < zeilen.length; q++) { anhaenge(zeilen[q].jahr, R.idx, zeilen[q]); z.zeilen++; }
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
  fs.mkdirSync(panel, { recursive: true });
  var gesamt = { kennung: K.PANEL_KENNUNG, konfig: K.KONFIG_KENNUNG, stand: new Date().toISOString(),
    teile: teile.length, zeilen: 0, jahre: [], zeilenJeTag: {}, zaehler: {} };
  /* Zaehler der Teile addieren */
  var addiere = function (ziel, q) { Object.keys(q).forEach(function (k) { if (typeof q[k] === 'number') ziel[k] = (ziel[k] || 0) + q[k]; else if (q[k] && typeof q[k] === 'object' && !Array.isArray(q[k])) { ziel[k] = ziel[k] || {}; addiere(ziel[k], q[k]); } }); };
  teile.forEach(function (t) {
    var p = path.join(a.aus, t, '_teil.json');
    if (fs.existsSync(p)) addiere(gesamt.zaehler, JSON.parse(fs.readFileSync(p, 'utf8')));
  });
  var jahre = {};
  teile.forEach(function (t) {
    fs.readdirSync(path.join(a.aus, t)).filter(function (f) { return /^\d{4}\.bin$/.test(f); }).forEach(function (f) {
      (jahre[f.slice(0, 4)] = jahre[f.slice(0, 4)] || []).push(path.join(a.aus, t, f));
    });
  });
  Object.keys(jahre).sort().forEach(function (j) {
    var bloecke = jahre[j].map(leseBlock), n = 0;
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
    var g = K.gruende().karte[r.reihe] || null;
    return { reihe: r.reihe, ordner: r.ordner, lebend: r.lebend, art: r.art || null, referenz: !!r.referenz,
      ende_grund: g ? g.grund : null, ende_datum: g ? g.datum : null };
  });
  gesamt.tage = kal.tage;
  gesamt.ausgeschlosseneArten = S.ausgeschlossen;
  gesamt.gruendeKennung = K.gruende().kennung;
  fs.writeFileSync(path.join(panel, '_stand.json'), JSON.stringify(gesamt));
  process.stdout.write('PANEL FERTIG: ' + gesamt.zeilen + ' Zeilen, letzter vollstaendiger Handelstag ' + gesamt.letzterVollTag + ', ' + wegTage.length + ' unvollstaendige Tage am Rand\n');
}

/* ---------- Panel lesen (fuer pruefstand.js und test.js) ---------- */
function ladePanel(aus) {
  var panel = path.join(aus, 'panel');
  var stand = JSON.parse(fs.readFileSync(path.join(panel, '_stand.json'), 'utf8'));
  var jahre = {};
  stand.jahre.forEach(function (j) { jahre[j.jahr] = leseBlock(path.join(panel, j.jahr + '.bin')); });
  return { stand: stand, jahre: jahre };
}

if (require.main === module) {
  var a = argumente(process.argv.slice(2));
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  fs.mkdirSync(a.aus, { recursive: true });
  if (a.vereinen) vereinen(a); else lauf(a);
}

module.exports = { SPALTEN: SPALTEN, leer: leer, schreibeBlock: schreibeBlock, leseBlock: leseBlock,
  symbole: symbole, reiheBauen: reiheBauen, ladePanel: ladePanel, median: median, argumente: argumente, vereinen: vereinen };
