'use strict';
/* M2 bis M6 - Zeit, Zuordnung, Ueberraschung (nur ob vorhanden), blinde Zaehlung, blinde Aufloesung.
 *
 *   node --max-old-space-size=6144 rechnen.js      (nach auszug.js und zeitpruefung.js)
 *
 * Liest: meldungen-202.tsv, zeitpruefung.json, Bilanz-Tafel v1.1 (ueber ihren Leser), Panel v2.2 (voll-v22/, ueber den Pruefstand).
 * Schreibt: zaehlungen.json (M2-M5), aufloesung.json (M6), handprobe-auswahl.json (30 Meldungen fuer die Handprobe).
 *
 * BLIND (§2, §5.7): die Ueberraschung wird je Meldung nur als ja/nein gefuehrt (hatUeberraschung). Ihr Wert verlaesst die
 * Funktion `ueberraschungen` nicht in Richtung Ertrag: M6 (aufloesung.js) bekommt nur Einstiegstag, Quartal und bereinigten
 * Ertrag und wirft bei jedem weiteren Feld. Kein Ertrag wird nach Vorzeichen, Groesse oder Zehntel der Ueberraschung gebildet.
 * Nur lesen ausser den drei Ergebnisdateien im Studienordner. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var Zt = require('./zeit.js');
var ZU = require('./zuordnung.js');
var UE = require('./ueberraschung.js');
var AZ = require('./auszug.js');
var AU = require('./aufloesung.js');
var AB = require('./abruf.js');
var PK = require(path.join(K.PRUEFSTAND, 'konfig.js'));
var PS = require(path.join(K.PRUEFSTAND, 'pruefstand.js'));
var F = require(path.join(K.FUNDAMENTAL, 'fundamental-lesen.js'));

function plus(o, k, n) { o[k] = (o[k] || 0) + (n === undefined ? 1 : n); }
function sag(s) { process.stdout.write(new Date().toISOString() + ' ' + s + '\n'); }
function quantile(werte, ps) {
  var a = werte.slice().sort(function (x, y) { return x - y; }), aus = {};
  ps.forEach(function (p) { aus['p' + Math.round(p * 100)] = a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; });
  return aus;
}

/* Ertrag Eroeffnung(E) -> Eroeffnung(E+H) fuer alle Horizonte, in Pp; Konvention wie `halte` im Pruefstand (Tagesrenditen aus
 * den Renditespalten, Luecke = kein Ertrag, Reihenende = einmalige Buchung: -100 % bei Insolvenz/Zwangs-Delisting, sonst 0). */
function ertraege(T, zl, E, HOR, aus) {
  var g = T.g, s = g.sym[zl], ende = T.symStart[s + 1], q = T.symStart[s] + T.posInReihe[zl] + 1;
  var oc = g.renditeOC[zl], acc = (oc === oc) ? 1 + oc / 100 : 1, hi = 0, lebt = true, maxH = HOR[HOR.length - 1];
  for (var d = E + 1; d <= E + maxH && hi < HOR.length && d <= T.maxTag; d++) {
    var zl2 = (q < ende && g.tag[T.symZeilen[q]] === d) ? T.symZeilen[q] : -1, istEnde = (d === E + HOR[hi]);
    if (zl2 < 0) {
      if (lebt && q >= ende) { if (PK.TOTALVERLUST_GRUENDE[T.endeGrund[s]]) acc = 0; lebt = false; }
      if (istEnde) aus[hi++] = 100 * (acc - 1);
      continue;
    }
    var cc = g.rendite[zl2], oc2 = g.renditeOC[zl2];
    if (istEnde) aus[hi++] = 100 * (acc * ((cc === cc && oc2 === oc2) ? (1 + cc / 100) / (1 + oc2 / 100) : 1) - 1);
    if (cc === cc) acc *= 1 + cc / 100;
    q++;
  }
  for (; hi < HOR.length; hi++) aus[hi] = NaN;
}

/* Warum eine Reihe am Stichtag NICHT im Universum ist - dieselbe Pruefreihenfolge wie `universum` im Pruefstand. */
function grundNichtImUniversum(T, s, tag) {
  var i = T.zeileVon(s, tag), g = T.g;
  if (i < 0) return 'keineZeileAmStichtag';
  var kl = g.klasse[i];
  if (K.KLASSEN_ALLE.indexOf(kl) === -1) return 'klasseUnter5Mio';
  var kg = kl >= 1 ? ' (Klasse 50-250 und hoeher)' : ' (Klasse 5-50)';
  if (!(g.marken[i] & PK.M_QUELLE_REIN)) return 'quelle' + kg;
  if (!PK.centBodenOk(g.rohSchluss[i], kl)) return 'centBoden' + kg;
  if (T.posInReihe[i] < PK.MIN_VORTAGE) return 'unter250Vortage' + kg;
  if (g.marken[i] & PK.M_STEMPEL_TAG) return 'stempelTag' + kg;
  if (g.marken[i] & PK.M_MASSNAHME_NAH) return 'massnahmeNah' + kg;
  if (!(g.marken[i] & PK.M_DICHTE_OK)) return 'dichteUnter80Prozent' + kg;
  return 'keineEroeffnungAmEinstiegstag' + kg;
}

function main() {
  var t0 = Date.now();
  var zp = JSON.parse(fs.readFileSync(path.join(__dirname, 'zeitpruefung.json'), 'utf8'));
  if (zp.lesart !== 'utc' && zp.lesart !== 'ort') throw new Error('Zeitpruefung ohne Lesart - anhalten und melden');
  var meld = AZ.lies();
  sag('Meldungen 2.02: ' + meld.length + ', Lesart der Annahmezeit: ' + zp.lesart);
  var FT = F.oeffne(K.TAFEL, { maxAlterTage: null });
  sag('Bilanz-Tafel ' + FT.kennung + ': ' + FT.zeilen + ' Zeilen, ' + FT.ciks + ' CIKs');
  var T = PS.Tafel(K.PANEL_AUS), g = T.g, kal = T.kal;
  sag('Panel ' + T.stand.kennung + ': ' + g.n + ' Zeilen, ' + T.nSym + ' Reihen, letzter Tag ' + kal.tage[T.maxTag]);
  var Z = { stand: new Date().toISOString(), lesart: zp.lesart, panel: T.stand.kennung, tafel: FT.kennung, letzterPanelTag: kal.tage[T.maxTag] };

  /* ---------- Firma -> Reihen des Panels (ueber den Leser der Tafel, wie die Mehrfaktor-Studie) ---------- */
  var segmente = {}, s;
  for (s = 0; s < T.nSym; s++) plus(segmente, T.symName[s].replace(/~\d+$/, ''));
  var reihenVon = {}, getrennt = new Uint8Array(T.nSym), ersterTag = new Int32Array(T.nSym).fill(-1), letzterTag = new Int32Array(T.nSym).fill(-1);
  var zr = { reihen: T.nSym, mitCik: 0, getrennteReihen: 0 };
  for (s = 0; s < T.nSym; s++) {
    if (T.symStart[s + 1] > T.symStart[s]) { ersterTag[s] = g.tag[T.symZeilen[T.symStart[s]]]; letzterTag[s] = g.tag[T.letzteZeile(s)]; }
    if (segmente[T.symName[s].replace(/~\d+$/, '')] > 1) { getrennt[s] = 1; zr.getrennteReihen++; }
    if (T.stand.symbole[s].referenz) continue;
    var c = FT.cikVon(T.symName[s]);
    if (!c) continue;
    zr.mitCik++;
    (reihenVon[c] = reihenVon[c] || []).push(s);
  }
  Z.reihen = zr;

  /* ---------- M2 Zeit, M3 Zuordnung, M4 Ueberraschung (ja/nein) ---------- */
  var jeCik = {};
  meld.forEach(function (m) { (jeCik[m.cik] = jeCik[m.cik] || []).push(m); });
  var M2 = { alle: 0, ohneZeit: 0, jeJahr: {}, knappVorBeginn0900bis0930: 0, einstiegAusserhalbKalender: 0 };
  var M3 = { meldungen8K: 0, form8KA: 0, vor: 0, vorHaupt: 0, vorWeitere: 0, berichtZuerst: 0, berichtZuerstHaupt: 0, ohne: 0, gleichesFiled: 0, firmenOhneTafelzeilen: 0,
    abstandHaupt: { amMeldetag: 0, tage1bis5: 0, tage6bis30: 0, ueber30: 0 }, amMeldetagBerichtVorMeldung: 0, amMeldetagOhneUhrzeit: 0,
    zeilenErstberichte2016plus: 0, zeilenMitHauptmeldung: 0 };
  var M4 = { hauptmeldungen: 0, mitUeberraschung: 0, quartalFehlt: 0, sdNull: 0, mitWegY: 0, jeJahr: {} };
  var abstandListe = [], nachPeriodeListe = [], kandidaten = [];
  Object.keys(FT.meta.ciks).forEach(function (cik) {
    var ml = (jeCik[cik] || []).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.t < b.t ? -1 : 1; });
    var syms = FT.meta.ciks[cik] || [], zeilen = syms.length ? FT.alleFilings(syms[0]) : [];
    if (!zeilen.length) M3.firmenOhneTafelzeilen++;
    var zu = ZU.ordneZu(zeilen, ml, { maxTageNachPeriode: K.ZUORDNUNG_MAX_TAGE_NACH_PERIODE });
    zeilen.forEach(function (z) { if (ZU.ERSTBERICHT.test(z.form) && z.filed >= K.VON) M3.zeilenErstberichte2016plus++; });
    ml.forEach(function (m, i) {
      var a = zu[i], jahr = m.d.slice(0, 4);
      if (m.f !== '8-K') { M3.form8KA++; return; }
      M3.meldungen8K++;
      /* M2: Zeit */
      var ny = Zt.nyZeit(m.t, zp.lesart), tz = null, E = -1;
      M2.alle++;
      if (!ny) M2.ohneZeit++;
      else {
        tz = Zt.tageszeit(ny, kal, K.HANDELSBEGINN_SEK); E = Zt.einstiegstag(ny, kal, K.HANDELSBEGINN_SEK);
        var j2 = M2.jeJahr[jahr] || (M2.jeJahr[jahr] = { vor: 0, im: 0, nach: 0, frei: 0 });
        j2[tz]++;
        if (tz === 'vor' && ny.sek >= 9 * 3600) M2.knappVorBeginn0900bis0930++;
        if (E < 0) M2.einstiegAusserhalbKalender++;
      }
      /* M3: Zuordnung */
      if (a.art === 'ohne') { M3.ohne++; return; }
      if (a.art === 'bericht-zuerst') { M3.berichtZuerst++; if (a.haupt) M3.berichtZuerstHaupt++; return; }
      M3.vor++;
      if (a.gleichesFiled) M3.gleichesFiled++;
      if (!a.haupt) { M3.vorWeitere++; return; }
      M3.vorHaupt++; M3.zeilenMitHauptmeldung++;
      var zeile = zeilen[a.zeile];
      abstandListe.push(a.abstand); nachPeriodeListe.push(a.nachPeriode);
      if (a.abstand === 0) {
        M3.abstandHaupt.amMeldetag++;
        var acc = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/.exec(zeile.accepted || '');
        if (!acc || !ny) M3.amMeldetagOhneUhrzeit++;
        else if (acc[1] < ny.datum || (acc[1] === ny.datum && (+acc[2]) * 3600 + (+acc[3]) * 60 + 59 < ny.sek)) M3.amMeldetagBerichtVorMeldung++;
      } else if (a.abstand <= 5) M3.abstandHaupt.tage1bis5++;
      else if (a.abstand <= 30) M3.abstandHaupt.tage6bis30++;
      else M3.abstandHaupt.ueber30++;
      /* M4: Ueberraschung - nur ob vorhanden; der Wert bleibt in diesem Block */
      M4.hauptmeldungen++;
      var u = UE.ausZeile(zeile), j4 = M4.jeJahr[jahr] || (M4.jeJahr[jahr] = { hauptmeldungen: 0, mitUeberraschung: 0 });
      j4.hauptmeldungen++;
      if (u.grund === 'quartalFehlt') M4.quartalFehlt++;
      else if (u.grund === 'sdNull') M4.sdNull++;
      else {
        M4.mitUeberraschung++; j4.mitUeberraschung++;
        if (typeof (zeile.wege && zeile.wege.netto) === 'string' && zeile.wege.netto.indexOf('y') !== -1) M4.mitWegY++;
      }
      kandidaten.push({ cik: +cik, a: m.a, d: m.d, t: m.t, items: m.i, ny: ny, tz: tz, E: E, jahr: jahr, hatUeberraschung: u.grund === 'ok',
        zeileAdsh: zeile.adsh, zeileForm: zeile.form, zeilePeriod: zeile.period, zeileFiled: zeile.filed, abstand: a.abstand });
    });
  });
  M3.abstandQuantile = quantile(abstandListe, [0.05, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]);
  M3.nachPeriodeQuantile = quantile(nachPeriodeListe, [0.05, 0.25, 0.5, 0.75, 0.95, 0.99]);
  Z.M2 = M2; Z.M3 = M3; Z.M4 = M4;
  sag('M3: Hauptmeldungen ' + M3.vorHaupt + ', mit Ueberraschung ' + M4.mitUeberraschung);

  /* ---------- M5: Reihe, Universum, Klasse am Stichtag (= letzter Handelstag vor dem Einstiegstag) ---------- */
  var M5 = { kandidaten: kandidaten.length, ohneEinstiegstag: 0, einstiegNachPanelEnde: 0, einstiegAmErstenKalendertag: 0,
    keineReiheZurFirma: 0, ohneZeile: { nachDemAbgang: 0, vorDemErstenBalken: 0, luecke: 0 }, mehrdeutigGetrennteReihe: 0, mehrereLinien: 0,
    nichtImUniversum: {}, doppeltReiheTag: 0, imUniversum: 0, imUniversumMitUeberraschung: 0,
    jeJahrKlasse: {}, jeKlasse: {}, jeTageszeit: {}, jeJahrTageszeit: {}, verschwunden: {}, };
  FT = null;                                                   /* die Tafel wird ab hier nicht mehr gebraucht */
  var HOR = K.HORIZONTE, nH = HOR.length, nK = PK.KLASSEN.length;
  var jeE = {};
  kandidaten.forEach(function (k) {
    if (k.E < 0) { M5.ohneEinstiegstag++; return; }
    if (k.E > T.maxTag) { M5.einstiegNachPanelEnde++; return; }
    if (k.E < 1) { M5.einstiegAmErstenKalendertag++; return; }
    var rl = reihenVon[k.cik] || [];
    if (!rl.length) { M5.keineReiheZurFirma++; return; }
    var mit = rl.filter(function (x) { return T.zeileVon(x, k.E) >= 0; });
    if (!mit.length) {
      if (rl.every(function (x) { return letzterTag[x] >= 0 && letzterTag[x] < k.E; })) M5.ohneZeile.nachDemAbgang++;
      else if (rl.every(function (x) { return ersterTag[x] > k.E; })) M5.ohneZeile.vorDemErstenBalken++;
      else M5.ohneZeile.luecke++;
      return;
    }
    var klar = mit.filter(function (x) { return !getrennt[x]; });
    if (!klar.length) { M5.mehrdeutigGetrennteReihe++; return; }
    (jeE[k.E] = jeE[k.E] || []).push({ k: k, klar: klar });
  });
  /* je Einstiegstag: Universum am Stichtag (Vortag), Ereignisse, und - blind - der um das Klassen-Tagesmittel bereinigte Ertrag */
  var ereignisse = [], gesehen = {}, puffer = new Float64Array(nH);
  var abn = HOR.map(function () { return []; }), endet = HOR.map(function () { return 0; }), totalverlust = HOR.map(function () { return 0; });
  Object.keys(jeE).map(Number).sort(function (a, b) { return a - b; }).forEach(function (E) {
    var U = PS.universum(T, E - 1, { klassen: K.KLASSEN_ALLE }), map = new Map();
    if (U.aTag !== E) throw new Error('Ausfuehrungstag ' + U.aTag + ' ungleich Einstiegstag ' + E);
    U.liste.forEach(function (e) { map.set(e.sym, e); });
    var heute = [];
    jeE[E].forEach(function (c) {
      var k = c.k, drin = c.klar.filter(function (x) { return map.has(x); });
      if (!drin.length) { plus(M5.nichtImUniversum, grundNichtImUniversum(T, c.klar[0], E - 1)); return; }
      if (drin.length > 1) {
        M5.mehrereLinien++;
        drin.sort(function (x, y) { return g.umsatz[map.get(y).zeile] - g.umsatz[map.get(x).zeile]; });   /* die umsatzstaerkste Linie am Stichtag */
      }
      var e = map.get(drin[0]), key = drin[0] + '|' + E;
      if (gesehen[key]) { M5.doppeltReiheTag++; return; }
      gesehen[key] = 1;
      M5.imUniversum++;
      var lebend = T.stand.symbole[drin[0]].lebend ? 'lebend' : 'verschwunden', kn = PK.KLASSEN[e.klasse].name;
      if (!k.hatUeberraschung) return;
      M5.imUniversumMitUeberraschung++;
      plus(M5.jeKlasse, kn); plus(M5.jeTageszeit, k.tz); plus(M5.verschwunden, lebend);
      var jk = M5.jeJahrKlasse[k.jahr] || (M5.jeJahrKlasse[k.jahr] = {}); plus(jk, kn);
      var jt = M5.jeJahrTageszeit[k.jahr] || (M5.jeJahrTageszeit[k.jahr] = {}); plus(jt, k.tz);
      heute.push({ k: k, sym: drin[0], zeileE: e.naechste, klasse: e.klasse, E: E, verschwunden: lebend === 'verschwunden' });
    });
    if (!heute.length) return;
    var sum = new Float64Array(nK * nH), cnt = new Int32Array(nK * nH), h;
    for (var m = 0; m < U.liste.length; m++) {
      var mem = U.liste[m];
      ertraege(T, mem.naechste, E, HOR, puffer);
      for (h = 0; h < nH; h++) if (puffer[h] === puffer[h]) { sum[mem.klasse * nH + h] += puffer[h]; cnt[mem.klasse * nH + h]++; }
    }
    heute.forEach(function (e) {
      ertraege(T, e.zeileE, E, HOR, puffer);
      for (h = 0; h < nH; h++) {
        var ok = puffer[h] === puffer[h] && cnt[e.klasse * nH + h] > 0;
        abn[h].push(ok ? puffer[h] - sum[e.klasse * nH + h] / cnt[e.klasse * nH + h] : NaN);
        if (ok && letzterTag[e.sym] < E + HOR[h]) { endet[h]++; if (puffer[h] <= -99.999) totalverlust[h]++; }
      }
      ereignisse.push(e);
    });
  });
  /* Ballung: Ereignisse je Einstiegstag (Hauptklassen) */
  var haupt = ereignisse.filter(function (e) { return K.KLASSEN_HAUPT.indexOf(e.klasse) !== -1; });
  var jeTag = {}; haupt.forEach(function (e) { plus(jeTag, e.E); });
  var tagZahlen = Object.keys(jeTag).map(function (t) { return jeTag[t]; }).sort(function (a, b) { return b - a; });
  var top10 = tagZahlen.slice(0, Math.ceil(tagZahlen.length / 10)).reduce(function (a, b) { return a + b; }, 0);
  var jeMonat = {}; haupt.forEach(function (e) { plus(jeMonat, kal.tage[e.E].slice(5, 7)); });
  M5.hauptklassen = { ereignisse: haupt.length, verschwunden: haupt.filter(function (e) { return e.verschwunden; }).length,
    einstiegstage: tagZahlen.length, handelstageImFenster: T.maxTag + 1, maxJeTag: tagZahlen[0], jeTagQuantile: quantile(tagZahlen, [0.1, 0.25, 0.5, 0.75, 0.9, 0.99]),
    anteilEreignisseInVollsten10ProzentTagen: top10 / haupt.length, jeMonat: jeMonat,
    firmen: Object.keys(haupt.reduce(function (o, e) { o[e.k.cik] = 1; return o; }, {})).length };
  Z.M5 = M5;
  sag('M5: im Universum mit Ueberraschung ' + ereignisse.length + ', Hauptklassen ' + haupt.length);

  /* Handprobe: 30 Meldungen, Zufall mit festem Startwert, aus den Ereignissen der Hauptklassen */
  var rnd = AU.zufallsquelle(K.ZUFALL_START + 7), wahl = [], pool = haupt.slice();
  while (wahl.length < 30 && pool.length) wahl.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  fs.writeFileSync(path.join(__dirname, 'handprobe-auswahl.json'), JSON.stringify(wahl.map(function (e) {
    return { cik: e.k.cik, reihe: T.symName[e.sym], akzession: e.k.a, filingDate: e.k.d, annahme: e.k.t, annahmeNY: e.k.ny.datum + ' ' + e.k.ny.zeit, tageszeit: e.k.tz,
      einstiegstag: kal.tage[e.E], items: e.k.items, zeileForm: e.k.zeileForm, zeilePeriod: e.k.zeilePeriod, zeileFiled: e.k.zeileFiled, abstandTage: e.k.abstand };
  }), null, 1));
  fs.writeFileSync(path.join(__dirname, 'zaehlungen.json'), JSON.stringify(Z, null, 1));

  /* ---------- M6: Aufloesung (blind) - die bereinigten Ertraege stehen aus der Schleife oben in abn[h] ---------- */
  var M6 = { horizonte: HOR, zufallLaeufe: K.ZUFALL_LAEUFE, startwert: K.ZUFALL_START, faktor: K.MDE_FAKTOR, zeilen: [], endetVorHorizont: {} };
  HOR.forEach(function (H, h) { M6.endetVorHorizont['H' + H] = { reiheEndetVorher: endet[h], davonTotalverlust: totalverlust[h] }; });
  sag('M6: bereinigte Ertraege gebildet (' + Math.round((Date.now() - t0) / 1000) + ' s)');

  var tagArr = Int32Array.from(ereignisse.map(function (e) { return e.E; }));
  var quArr = Int32Array.from(ereignisse.map(function (e) { var d = kal.tage[e.E]; return (+d.slice(0, 4)) * 4 + Math.floor(((+d.slice(5, 7)) - 1) / 3); }));
  var teilmengen = [
    { name: 'Hauptklassen 2016-2026', f: function (e) { return K.KLASSEN_HAUPT.indexOf(e.klasse) !== -1; }, voll: true },
    { name: 'Hauptklassen 2016-2020', f: function (e) { return K.KLASSEN_HAUPT.indexOf(e.klasse) !== -1 && e.k.jahr <= '2020'; } },
    { name: 'Hauptklassen 2021-2026', f: function (e) { return K.KLASSEN_HAUPT.indexOf(e.klasse) !== -1 && e.k.jahr >= '2021'; } },
  ].concat(K.KLASSEN_ALLE.map(function (kl) { return { name: 'Klasse ' + PK.KLASSEN[kl].name + ' 2016-2026', klasse: kl, f: function (e) { return e.klasse === kl; } }; }));
  teilmengen.forEach(function (tm) {
    HOR.forEach(function (H, h) {
      var a = new Float64Array(ereignisse.length);
      for (var i = 0; i < ereignisse.length; i++) a[i] = tm.f(ereignisse[i]) ? abn[h][i] : NaN;
      var ev = { tag: tagArr, quartal: quArr, abn: a };
      var st = AU.streuung(ev), zf = AU.zufall(ev, { laeufe: K.ZUFALL_LAEUFE, start: K.ZUFALL_START + h, lag: H - 1 });
      var zeile = { teilmenge: tm.name, H: H, n: st.n, einstiegstage: st.tage, sd: st.sd, naivAbstand: st.naivAbstand, naivOben: st.naivOben,
        seAbstandTag: zf.seAbstandTag, seAbstandPool: zf.seAbstandPool, seObenTag: zf.seObenTag, seObenPool: zf.seObenPool,
        nwAbstandTag: zf.nwAbstandTag, nwObenTag: zf.nwObenTag, tageObenMittel: zf.tageObenMittel, ereignisseOben: zf.ereignisseOben,
        mdeAbstandTag: K.MDE_FAKTOR * zf.seAbstandTag, mdeAbstandTagReihe: K.MDE_FAKTOR * zf.nwAbstandTag, mdeAbstandPool: K.MDE_FAKTOR * zf.seAbstandPool,
        mdeObenTagZufall: K.MDE_FAKTOR * zf.seObenTag, mdeObenTagReihe: K.MDE_FAKTOR * zf.nwObenTag, mdeObenPool: K.MDE_FAKTOR * zf.seObenPool };
      if (tm.voll) {
        var ic = AU.gleicherTag(ev);
        zeile.gleicherTag = { rho: ic.rho, jeTagMittel: ic.jeTagMittel, jeTagGewichtet: ic.jeTagGewichtet, faktorVolleBallung: ic.faktorVolleBallung };
        var zt = AU.zufall(ev, { laeufe: K.ZUFALL_LAEUFE, start: K.ZUFALL_START + 100 + h, lag: H - 1, jeTag: true });
        zeile.zuteilungJeTag = { seAbstandTag: zt.seAbstandTag, seObenTag: zt.seObenTag, mdeAbstandTag: K.MDE_FAKTOR * zt.seAbstandTag, mdeObenTag: K.MDE_FAKTOR * zt.seObenTag };
        var gs = { tag: tagArr, quartal: quArr, abn: AU.stutze(a, 0.01) }, st2 = AU.streuung(gs), zg = AU.zufall(gs, { laeufe: K.ZUFALL_LAEUFE, start: K.ZUFALL_START + h, lag: H - 1 });
        zeile.gestutzt1Prozent = { sd: st2.sd, seAbstandTag: zg.seAbstandTag, seObenTag: zg.seObenTag, nwObenTag: zg.nwObenTag, mdeAbstandTag: K.MDE_FAKTOR * zg.seAbstandTag, mdeObenTagReihe: K.MDE_FAKTOR * zg.nwObenTag };
        /* Kunstfall: ein Abstand in Hoehe der Mindest-Effektgroesse wird eingepflanzt und muss in rund 80 % der Laeufe t >= 2 erreichen */
        var pf = AU.zufall(ev, { laeufe: K.ZUFALL_LAEUFE, start: K.ZUFALL_START + h, lag: H - 1, pflanze: K.MDE_FAKTOR * zf.seAbstandTag / 2 });
        zeile.kunstfall = { eingepflanzterAbstand: K.MDE_FAKTOR * zf.seAbstandTag, anteilTAbstandUeber2: pf.anteilTAbstandUeber2 };
      }
      if (tm.klasse !== undefined) { zeile.kostenUmlaufMitte = PK.KLASSEN[tm.klasse].huerde; zeile.kostenUmlaufEroeffnung = PK.KLASSEN[tm.klasse].huerdeEroeffnung; }
      M6.zeilen.push(zeile);
      sag('M6 ' + tm.name + ' H' + H + ': n ' + st.n + ', sd ' + st.sd.toFixed(2) + ', MDE Abstand ' + zeile.mdeAbstandTag.toFixed(2) + ', MDE oben (Reihe) ' + zeile.mdeObenTagReihe.toFixed(2));
    });
  });
  M6.kosten = PK.KLASSEN.map(function (k) { return { klasse: k.name, umlaufMitte: k.huerde, umlaufEroeffnung: k.huerdeEroeffnung }; });
  M6.sekunden = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(__dirname, 'aufloesung.json'), JSON.stringify(M6, null, 1));
  sag('FERTIG in ' + M6.sekunden + ' s');
}

module.exports = { ertraege: ertraege, grundNichtImUniversum: grundNichtImUniversum, cik10: AB.cik10 };
if (require.main === module) main();
