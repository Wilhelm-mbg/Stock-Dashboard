'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026), Teil sammelrunde.js (Praefix SR).
 *
 * LADER: sammelrunde.js - ein Blick auf die Uhr (Reihenfolge, Deckel, Stillstandsbremse) -
 *        dazu die Faelligkeit, die er nutzt: sammelplan.js (lage, offeneSymbole, istFaellig,
 *        faellig) und aus kerzenquelle.js letzterAbgeschlossenerHandelstag, letzterTagVon,
 *        tagIstNach, standEintrag, fensterLuecke, juengsteKerzeVon, archivUeberblick.
 * STAND: 61dca2c.
 * STOERUNGEN: S1 (200 leer), S2/S7 (Stempelkerze, abgemeldete Reihe), S3 (Tagesbalken-Stempel),
 *        S4 (Kuerzel-Neuvergabe), S8 (Zeitzone), S9 (Feiertag), S10 (Halbtag), S11 (Kursaussetzung),
 *        dazu das rollende Intraday-Fenster (fensterLuecke). Bericht: sammelrunde.md daneben.
 * AUFRUF (Repo-Wurzel): node pruefberichte/lader-stoerungen/sammelrunde.test.js
 *
 * WIE: Plan und Archiv sind ECHT (sammelplan.js, kerzenquelle.js gegen einen Wegwerf-Datenordner).
 * Der Lauf ist entweder der ECHTE KQ.sammle (wie main.js sammelLauf, Abstand 0) mit einer
 * nachgebauten Yahoo-Antwort - https.get wird nur fuer die Dauer des Tests durch eine Attrappe
 * ersetzt, die zaehlt und nie ins Netz geht - oder eine zaehlende Attrappe, wo nur die Frage
 * "wird gelaufen?" zaehlt. Die Uhr steht fest (H.mitUhr + o.jetzt), nie die echte.
 * Wo 531 Werte > Deckel 300 nachgestellt werden muessen, wird NUR DECKEL_JE_LAUF auf 1 gesenkt
 * (Kopie des echten Plans); alle Funktionen bleiben die echten.
 *
 * Alles Simulation, keine Anlageberatung.
 */
var H = require('./hilfen.js');
var Runde = H.lade('sammelrunde.js');
var KQ = H.lade('kerzenquelle.js');
var Plan = H.lade('sammelplan.js');
var Boerse = H.lade('boerse.js');
var fs = require('fs');
var path = require('path');
var https = require('https');
var EventEmitter = require('events');

/* ---------------- Hilfen dieses Teils ---------------- */

function ms(iso) { return Date.parse(iso); }
function tagVonMs(t) { return new Date(t).toISOString().slice(0, 10); }

/* n Tageskerzen an Werktagen bis einschliesslich bisTag, Stempel 13:30 UTC (Sitzungsbeginn, wie
 * Yahoo), Format fuer H.yahooChart: [tSek, o, h, l, c, v]. */
function tagesKerzen(bisTag, n, preis, umsatz) {
  var aus = [], d = new Date(bisTag + 'T13:30:00Z');
  while (aus.length < n) {
    var wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) aus.unshift([d.getTime() / 1000, preis, preis * 1.01, preis * 0.99, preis, umsatz == null ? 100000 : umsatz]);
    d = new Date(d.getTime() - 86400000);
  }
  return aus;
}
/* Stundenkerzen (13:30..19:30 UTC, 7 je Werktag) ueber `tage` Werktage bis bisTag. */
function stundenKerzen(bisTag, tage, preis) {
  var aus = [];
  tagesKerzen(bisTag, tage, preis).forEach(function (k) {
    for (var h = 0; h < 7; h++) aus.push([k[0] + h * 3600, preis, preis * 1.002, preis * 0.998, preis, 5000]);
  });
  return aus;
}
var ANTWORT_404 = '{"chart":{"result":null,"error":{"code":"Not Found","description":"No data found, symbol may be delisted"}}}';

/* https.get fuer die Dauer eines Tests durch eine zaehlende Attrappe ersetzen. kerzenquelle.js
 * (hole) liest https.get zur Laufzeit ueber das Modulobjekt. antwort(sym, intervall) ->
 * { status, body }. Zurueck kommt eine Funktion, die die vorherige (gesperrte) Fassung
 * wiederherstellt. */
function quelleErsetzen(antwort, abrufe) {
  var vorher = https.get;
  https.get = function (url, opt, cb) {
    var m = /\/chart\/([^?]+)\?range=([^&]+)&interval=(.+)$/.exec(String(url));
    var sym = m ? decodeURIComponent(m[1]) : '?', iv = m ? m[3] : '?';
    abrufe.push(sym + '@' + iv);
    var a = antwort(sym, iv) || { status: 404, body: ANTWORT_404 };
    var req = new EventEmitter();
    req.setTimeout = function () { return req; };
    req.destroy = function () { };
    setImmediate(function () {
      var res = new EventEmitter(); res.statusCode = a.status;
      cb(res);
      setImmediate(function () { if (a.body) res.emit('data', a.body); res.emit('end'); });
    });
    return req;
  };
  return function () { https.get = vorher; };
}
function wieOft(abrufe, sym) { return abrufe.filter(function (a) { return a.indexOf(sym + '@') === 0; }).length; }

/* Frischer Datenordner im Wegwerf-Ordner; alle Archivordner muessen darin liegen (sonst wirft der
 * Test, bevor etwas geschrieben wird). staende: { iv: { SYM: eintrag } }. Die 31 ETFs, die
 * symboleFuer IMMER dazunimmt, stehen mit einem Zukunftstag im Stand, damit sie nicht mitlaufen. */
function umgebung(name, staende) {
  var d = H.tempOrdner(name);
  KQ.datenOrdnerSetzen(d);
  Plan.ERLAUBTE_INTERVALLE.forEach(function (iv) {
    var o = KQ.ordnerVon(iv);
    if (!H.imTmp(o)) throw new Error('Archivordner ' + iv + ' liegt nicht im Wegwerf-Ordner: ' + o);
  });
  Object.keys(staende || {}).forEach(function (iv) {
    var o = KQ.ordnerVon(iv);
    fs.mkdirSync(o, { recursive: true });
    var st = { fertig: {}, ohne: {} };
    KQ.ETFS.forEach(function (e) { st.fertig[e] = { bisTag: '2099-12-31', am: '2026-01-01', kerzen: 1 }; });
    Object.keys(staende[iv]).forEach(function (s) { st.fertig[s] = staende[iv][s]; });
    if (!KQ.standSchreiben(o, st)) throw new Error('stand.json nicht geschrieben: ' + o);
  });
  return d;
}

/* Sammel-Einstellungen: nur die genannten Intervalle an, je eine eigene Liste. */
function einst(je) {
  var roh = { an: true, universum: 'NIEMAND,', universen: {}, intervalle: { '1m': 0, '5m': 0, '15m': 0, '60m': 0, '1d': 0 } };
  Object.keys(je).forEach(function (iv) { roh.intervalle[iv] = je[iv][0]; roh.universen[iv] = je[iv][1]; });
  return Plan.einstellungen(roh);
}

/* Der Lauf wie main.js sammelLauf (main.js:1485): echter KQ.sammle, Ergebnis in derselben Form. */
function echterLauf(protokoll) {
  return async function (iv, syms) {
    var eintrag = { iv: iv, syms: syms.slice(), t: Date.now(), erg: null };
    protokoll.push(eintrag);
    try {
      var e = await KQ.sammle({ intervall: iv, symbole: syms, abstandMs: 0, was: 'Probe ' + iv });
      eintrag.erg = { intervall: iv, ok: e.ok, leer: e.leer, verarbeitet: e.verarbeitet,
        leerVersucht: e.leerVersucht, abgebrochen: e.abgebrochen, grund: e.grund, abgeschnitten: e.abgeschnitten };
      return { ok: true, ergebnis: eintrag.erg };
    } catch (x) { return { ok: false, grund: String((x && x.message) || x) }; }
  };
}
/* Ein Lauf, der nur zaehlt (fuer Tests, in denen die Frage nur "wird gelaufen?" lautet). */
function zaehlLauf(protokoll) {
  return async function (iv, syms) {
    protokoll.push({ iv: iv, syms: syms.slice(), t: Date.now() });
    return { ok: true, ergebnis: { verarbeitet: syms.length, leerVersucht: 0, abgebrochen: false } };
  };
}

/* Ein Blick auf die Uhr zur festen Zeit t (globale Uhr UND o.jetzt). */
function blick(t, o) {
  return H.mitUhr(t, function () {
    return Runde.runde(Object.assign({ jetzt: function () { return t; } }, o));
  });
}
function stillstandsFunk(funk) { return funk.args.filter(function (a) { return a[1] && a[1].art === 'stillstand'; }).length; }
function stand(iv) { return KQ.standLesen(KQ.ordnerVon(iv)); }
function offen(iv, e, t) { return H.mitUhr(t, function () { return Plan.offeneSymbole(iv, e, t).dran; }); }

/* Datei:Zeile per Inhaltsanker (Stand 61dca2c). */
function Z(datei, anker) { return datei + ':' + H.zeileVon(datei, anker); }

/* ---------------- Tests ---------------- */

var tests = [];

/* SR-1  S1: HTTP 200 mit leerem Inhalt fuer Werte, die schon im Stand stehen. */
tests.push({
  id: 'SR-1', stoerung: 'S1 HTTP 200 leer (wenige Werte mit Bestand)', bewertung: 'C',
  lauf: async function (H) {
    var tote = ['LEERA', 'LEERB', 'LEERC'];
    var st = {}; tote.forEach(function (s) { st[s] = { bisTag: '2026-08-14', am: '2026-08-20', kerzen: 450 }; });
    umgebung('sr1', { '1d': st });
    var e = einst({ '1d': [1, tote.join(',')] });
    var abrufe = [], laeufe = [], funk = H.zaehler(), zustand = {};
    var zurueck = quelleErsetzen(function () { return { status: 200, body: H.yahooChart([]) }; }, abrufe);
    try {
      var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: zustand };
      await blick(ms('2026-10-06T22:00:00Z'), o);
      await blick(ms('2026-10-06T22:20:00Z'), o);
      await blick(ms('2026-10-06T22:40:00Z'), o);
    } finally { zurueck(); }
    H.betreten(abrufe.length >= 3 && laeufe.length >= 1, 'Runde lief nicht ueber die leeren Werte');
    var s = stand('1d');
    var nochFaellig = offen('1d', e, ms('2026-10-06T23:00:00Z'));
    var versucht = tote.filter(function (x) { return s.fertig[x] && s.fertig[x].versucht; }).length;
    var imOhne = tote.filter(function (x) { return s.ohne && s.ohne[x]; }).length;
    var abw = laeufe.length > 2 || stillstandsFunk(funk) === 0 || nochFaellig.length > 0;
    return { abweichung: abw, text: '3 Werte mit Bestand, Quelle antwortet 200 ohne Kerzen, 3 Blicke: ' + laeufe.length +
      ' Laeufe / ' + abrufe.length + ' Abrufe, Stillstand-Funk ' + stillstandsFunk(funk) + ', versucht gesetzt ' + versucht +
      '/3, danach noch faellig ' + nochFaellig.length + '/3 (nur stand.ohne beschrieben: ' + imOhne + '/3, das offeneSymbole ' +
      'fuer Werte mit fertig-Eintrag nie liest). Soll: leer versucht (ruht abstandTage) oder Bremse nach Lauf 2 mit Meldung. ' +
      'Grund: leere Antwort geht als Fehler (' + Z('kerzenquelle.js', "if (serie.length < mindest) return { fehler: 'nur ' + serie.length + ' Kerzen' };") +
      ') in stand.ohne (' + Z('kerzenquelle.js', 'stand.ohne[sym] = { grund: r.fehler, am: heuteTag() };') + '), fertig bleibt alt (' +
      Z('sammelplan.js', 'var f = stand.fertig && stand.fertig[sym];') + '); ohneFortschritt zaehlt nur leerVersucht (' +
      Z('sammelrunde.js', 'return !!(erg && erg.verarbeitet > 0 && erg.leerVersucht >= erg.verarbeitet);') + ')' };
  }
});

/* SR-2  S1/S7 am Kopf der Schlange: acht tote Werte (404 bzw. 200 leer) vor lebenden. */
tests.push({
  id: 'SR-2', stoerung: 'S1/S7 tote Werte am Kopf (>= 8): Abbruch beendet die Runde', bewertung: 'B',
  lauf: async function (H) {
    var tote = ['TOTA', 'TOTB', 'TOTC', 'TOTD', 'TOTE', 'TOTF', 'TOTG', 'TOTH'];
    var st60 = {}, st1d = {};
    tote.forEach(function (s) { st60[s] = { bisTag: '2026-08-14', am: '2026-08-20', kerzen: 1200 }; });
    st60.LEBA = { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 1200 };
    st60.LEBB = { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 1200 };
    st1d.TAGA = { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 450 };
    st1d.TAGB = { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 450 };
    umgebung('sr2', { '60m': st60, '1d': st1d });
    /* Reihenfolge wie im Universum (nach Umsatz): ein lebender Wert vorn, dann acht tote, dann
     * wieder ein lebender. Nach dem ersten Blick stehen die toten am Kopf. */
    var e = einst({ '60m': [1, ['LEBA'].concat(tote, ['LEBB']).join(',')], '1d': [1, 'TAGA,TAGB'] });
    var abrufe = [], laeufe = [], funk = H.zaehler(), zustand = {};
    var stunde = H.yahooChart(stundenKerzen('2026-10-06', 32, 40), { interval: '60m' });
    var tag = H.yahooChart(tagesKerzen('2026-10-06', 420, 40));
    var zurueck = quelleErsetzen(function (sym, iv) {
      if (/^TOT[A-D]$/.test(sym)) return { status: 404, body: ANTWORT_404 };
      if (/^TOT/.test(sym)) return { status: 200, body: H.yahooChart([]) };
      return { status: 200, body: iv === '60m' ? stunde : tag };
    }, abrufe);
    var ergs = [];
    try {
      var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: zustand };
      ergs.push(await blick(ms('2026-10-06T22:00:00Z'), o));
      ergs.push(await blick(ms('2026-10-06T22:20:00Z'), o));
      ergs.push(await blick(ms('2026-10-06T22:40:00Z'), o));
    } finally { zurueck(); }
    var l60 = laeufe.filter(function (l) { return l.iv === '60m'; }).length;
    var l1d = laeufe.filter(function (l) { return l.iv === '1d'; }).length;
    H.betreten(l60 >= 1 && wieOft(abrufe, 'TOTA') >= 1 && wieOft(abrufe, 'LEBA') >= 1, '60m-Lauf ueber tote und lebende Werte nicht betreten');
    var ab = laeufe.filter(function (l) { return l.iv === '60m' && l.erg && l.erg.abgebrochen; });
    var lv = laeufe.reduce(function (a, l) { return a + ((l.erg && l.erg.leerVersucht) || 0); }, 0);
    var abw = l1d === 0 || wieOft(abrufe, 'LEBB') === 0;
    return { abweichung: abw, text: '3 Blicke, 60m = [LEBA, 8 tote (4x 404, 4x 200 leer), LEBB], 1d = [TAGA, TAGB]: 60m-Laeufe ' + l60 +
      ', davon abgebrochen ' + ab.length + ' ("' + String((ab[0] && ab[0].erg.grund) || '').slice(0, 28) + '..."), leerVersucht ' + lv + '; LEBA ' + wieOft(abrufe, 'LEBA') +
      'x geholt, LEBB ' + wieOft(abrufe, 'LEBB') + 'x, 1d-Laeufe ' + l1d + ', Stillstand-Funk ' + stillstandsFunk(funk) +
      '. Soll: tote Werte halten weder den Rest des Intervalls noch die folgenden Intervalle auf. Ist: Abbruchbremse "Netz weg" (' +
      Z('kerzenquelle.js', 'if (bremse && inFolge >= bremse) {') + ') feuert auf acht tote Werte, die Runde bricht ab (' +
      Z('sammelrunde.js', 'if (!r || !r.ok || (r.ergebnis && r.ergebnis.abgebrochen)) break;') + '), und weil die toten faellig bleiben ' +
      '(SR-1), steht ab dem 2. Blick alles dahinter still - auch archiv1d' };
  }
});

/* SR-3  S11 Kursaussetzung (und S1-Gegenprobe "200 mit Reihe ohne neuen Tag"). */
tests.push({
  id: 'SR-3', stoerung: 'S11 Kursaussetzung: Reihe ohne den neuen Tag', bewertung: '-',
  lauf: async function (H) {
    umgebung('sr3', { '1d': { HALT: { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 450 } } });
    var e = einst({ '1d': [1, 'HALT,'] });
    var abrufe = [], laeufe = [], funk = H.zaehler(), zustand = {};
    var bis = '2026-10-05';
    var zurueck = quelleErsetzen(function () { return { status: 200, body: H.yahooChart(tagesKerzen(bis, 450, 30)) }; }, abrufe);
    var s1, f2, s3;
    try {
      var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: zustand };
      await blick(ms('2026-10-06T22:00:00Z'), o);           /* Di: ganztaegig ausgesetzt, Quelle endet Mo */
      s1 = stand('1d').fertig.HALT;
      await blick(ms('2026-10-06T22:20:00Z'), o);           /* derselbe Abend: darf nicht noch einmal fragen */
      f2 = laeufe.length;
      bis = '2026-10-07';
      await blick(ms('2026-10-07T22:00:00Z'), o);           /* Mi: wieder gehandelt */
      s3 = stand('1d').fertig.HALT;
    } finally { zurueck(); }
    H.betreten(laeufe.length >= 1 && s1 && s1.versucht, 'leerer Versuch nicht gebucht');
    var abw = !(s1.bisTag === '2026-10-05' && s1.versucht && f2 === 1 && laeufe.length === 2 && s3.bisTag === '2026-10-07' && !s3.versucht);
    return { abweichung: abw, text: 'Di ausgesetzt: bisTag ' + s1.bisTag + ', versucht ' + s1.versucht + ', zweiter Blick am Abend ' +
      (f2 === 1 ? 'fragt nicht' : 'fragt erneut') + '; Mi gehandelt: gefragt, bisTag ' + s3.bisTag + (s3.versucht ? ' (versucht ' + s3.versucht + ')' : '') +
      ', Laeufe gesamt ' + laeufe.length + '. Soll: weder ewig faellig noch aufgegeben - so ist es (' +
      Z('kerzenquelle.js', 'if (vorher && vorher.bisTag && !tagIstNach(neuBis, vorher.bisTag)) e.versucht = heute;') + ', ' +
      Z('sammelplan.js', "var seitVersuch = tageSeit(eintrag.versucht, Date.parse(sollTag + 'T00:00:00Z'));") + ')' };
  }
});

/* SR-4  S2/S7 Stempelkerze: abgemeldete Reihe bekommt je Abruf eine flache Kerze mit heutigem Datum. */
tests.push({
  id: 'SR-4', stoerung: 'S2/S7 flache Stempelkerze haelt eine erloschene Reihe "auf Stand"', bewertung: 'B',
  lauf: async function (H) {
    umgebung('sr4', { '1d': {
      AVB: { bisTag: '2026-08-14', am: '2026-08-20', kerzen: 450 },
      LEB: { bisTag: '2026-10-05', am: '2026-10-05', kerzen: 450 } } });
    var e = einst({ '1d': [1, 'AVB,LEB'] });
    var abrufe = [], laeufe = [], funk = H.zaehler(), zustand = {};
    var heute = '2026-10-06';
    var zurueck = quelleErsetzen(function (sym) {
      if (sym === 'AVB') {
        /* letzter Handel 14.08.; dahinter die Quote-Stempelkerze des Abrufs: flach, Umsatz 0, 20:00:00 UTC */
        var st = [ms(heute + 'T20:00:00Z') / 1000, 48, 48, 48, 48, 0];
        return { status: 200, body: H.yahooChart(tagesKerzen('2026-08-14', 450, 50).concat([st])) };
      }
      return { status: 200, body: H.yahooChart(tagesKerzen(heute, 450, 30)) };
    }, abrufe);
    var a1, lage2;
    try {
      var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: zustand };
      await blick(ms('2026-10-06T22:00:00Z'), o);
      a1 = stand('1d').fertig.AVB;
      heute = '2026-10-07';
      await blick(ms('2026-10-07T22:00:00Z'), o);
      lage2 = H.mitUhr(ms('2026-10-07T23:00:00Z'), function () { return Plan.lage(e, ms('2026-10-07T23:00:00Z')); })
        .filter(function (z) { return z.intervall === '1d'; })[0];
    } finally { zurueck(); }
    var s = stand('1d');
    H.betreten(wieOft(abrufe, 'AVB') >= 1 && s.fertig.LEB.bisTag === '2026-10-07', 'Fortschrittsweg (LEB) oder AVB-Abruf nicht betreten');
    var h = KQ.huelleLesen(KQ.dateiFuer('AVB', '1d', KQ.ordnerVon('1d')));
    var phantom = (h.series || []).filter(function (k) { return k[0] > ms('2026-08-15T00:00:00Z'); });
    var ohneUmsatz = phantom.filter(function (k) { return !k[2]; }).length;
    var abw = a1.bisTag !== '2026-08-14' || !a1.versucht || s.fertig.AVB.bisTag !== '2026-08-14';
    return { abweichung: abw, text: 'AVB (letzter Handel 14.08.) bekommt je Abruf eine flache 20:00:00-Kerze (Umsatz 0): nach Di bisTag ' + a1.bisTag +
      (a1.versucht ? ' versucht ' + a1.versucht : ' ohne versucht') + ', nach Mi ' + s.fertig.AVB.bisTag + '; Archiv traegt ' + phantom.length +
      ' Tage nach dem 14.08. (' + ohneUmsatz + ' ohne Umsatz); Karte: "' + String(lage2 && lage2.grund).slice(0, 40) + '...", leer versucht ' +
      (lage2 ? lage2.leerVersucht : '?') + '. Soll: Kerze ohne Umsatz hinter dem letzten Handel ist kein Fortschritt -> bisTag 14.08. + versucht. ' +
      'Grund: bisTag = Stempel der letzten Kerze, gleich welcher Umsatz (' +
      Z('kerzenquelle.js', 'return new Date(serie[serie.length - 1][0]).toISOString().slice(0, 10);') + ')' };
  }
});

/* SR-5  S3 Tagesbalken-Stempel = Eroeffnung: Lauf beginnt vor 09:30 NY und laeuft in die Sitzung. */
tests.push({
  id: 'SR-5', stoerung: 'S3 unfertiger heutiger Tagesbalken (Lauf laeuft in die Sitzung)', bewertung: '-',
  lauf: async function (H) {
    var start = ms('2026-10-06T13:25:00Z'), mitten = ms('2026-10-06T13:31:00Z');
    function variante(mitPeriode) {
      umgebung('sr5' + (mitPeriode ? 'a' : 'b'), { '1d': { VOR: { bisTag: '2026-10-02', am: '2026-10-02', kerzen: 450 } } });
      var e = einst({ '1d': [1, 'VOR,'] });
      var abrufe = [], laeufe = [], funk = H.zaehler();
      var k = tagesKerzen('2026-10-05', 450, 30).concat([[ms('2026-10-06T13:30:00Z') / 1000, 30, 30.2, 29.9, 30.1, 4000]]);
      var meta = mitPeriode ? { currentTradingPeriod: { regular: { start: ms('2026-10-06T13:30:00Z') / 1000, end: ms('2026-10-06T20:00:00Z') / 1000 } } } : {};
      var zurueck = quelleErsetzen(function () { return { status: 200, body: H.yahooChart(k, { meta: meta }) }; }, abrufe);
      /* Die Runde entscheidet um 09:25 NY (vor der Eroeffnung, ruhig); der Abruf selbst passiert
       * um 09:31 NY - so laeuft ein gedeckelter Lauf von 300 Werten (6 min) in die Sitzung. */
      return H.mitUhr(mitten, function () {
        return Runde.runde({ plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: {},
          jetzt: function () { return start; } });
      }).then(function () {
        zurueck();
        var s = stand('1d').fertig.VOR;
        var abends = offen('1d', e, ms('2026-10-06T22:00:00Z'));
        return { laeufe: laeufe.length, bisTag: s.bisTag, abends: abends.indexOf('VOR') >= 0 };
      }, function (x) { zurueck(); throw x; });
    }
    var a = await variante(true), b = await variante(false);
    H.betreten(a.laeufe === 1 && b.laeufe === 1, 'Lauf vor der Eroeffnung nicht gestartet');
    var abw = !(a.bisTag === '2026-10-05' && a.abends);
    return { abweichung: abw, text: 'Lauf startet 09:25 NY, Abruf 09:31 NY mit laufendem Balken (Stempel 13:30Z): mit currentTradingPeriod bisTag ' + a.bisTag +
      ', abends wieder faellig ' + (a.abends ? 'ja' : 'nein') + ' -> Schluss wird geholt. Grenze: OHNE currentTradingPeriod bisTag ' + b.bisTag +
      ', abends faellig ' + (b.abends ? 'ja' : 'nein') + ' (fertigeKerze nimmt den Balken dann an, ' +
      Z('kerzenquelle.js', 'return reg && tsMs === reg.start * 1000 ? jetzt >= reg.end * 1000 : true;') + '); die Runde prueft "Markt offen" nur je Lauf, nicht je Wert (' +
      Z('sammelrunde.js', 'var jetztFaellig = Plan.faellig(z.intervall, u, einst, jetzt(), offen);') + ')' };
  }
});

/* SR-6  S8 Zeitzonen-Wechsel: letzterAbgeschlossenerHandelstag um die Umstellungen. */
tests.push({
  id: 'SR-6', stoerung: 'S8 Zeitzone: 20:30 UTC als Tagesende im Winter', bewertung: 'C',
  lauf: async function (H) {
    /* Soll aus der Stoerung, nicht aus dem Code: ein Tag ist abgeschlossen ab 16:30 New York
     * (Schluss 16:00 plus die halbe Stunde Zuschlag, die die Regel selbst nennt), sonst gilt der
     * vorige Werktag. Feiertage bleiben hier aussen vor (SR-7). */
    function sollTag(t) {
      var ny = Plan.newYork(t);
      var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
      var d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
      if (ny.wochenende || ny.minutenSeitMitternacht < 16 * 60 + 30) d.setUTCDate(d.getUTCDate() - 1);
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    var zeiten = [
      ['2026-11-03T20:45:00Z', 'Di nach US-Umstellung, 15:45 NY'],
      ['2026-12-08T20:50:00Z', 'Di im Winter, 15:50 NY'],
      ['2026-03-09T20:45:00Z', 'Mo nach US-Umstellung 08.03., 16:45 NY'],
      ['2026-03-23T20:45:00Z', 'versetzte Wochen (EU Winter, US Sommer), 16:45 NY'],
      ['2026-10-27T20:45:00Z', 'versetzte Woche Herbst (EU Winter, US Sommer), 16:45 NY'],
      ['2026-11-04T00:30:00Z', 'Abruf 01:30 MEZ = 19:30 NY'],
      ['2026-10-07T23:30:00Z', 'Abruf 01:30 MESZ = 19:30 NY'],
    ];
    var falsch = [];
    zeiten.forEach(function (z) {
      var ist = KQ.letzterAbgeschlossenerHandelstag(new Date(ms(z[0])));
      var soll = sollTag(ms(z[0]));
      if (ist !== soll) falsch.push(z[1] + ': ' + ist + ' statt ' + soll);
    });
    /* Und was die Runde daraus macht: im falschen Fenster darf nicht gelaufen werden. */
    umgebung('sr6', { '1d': { WIN: { bisTag: '2026-10-30', am: '2026-10-30', kerzen: 450 } } });
    var e = einst({ '1d': [1, 'WIN,'] });
    var laeufe = [], funk = H.zaehler();
    var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: zaehlLauf(laeufe), funk: funk.f, stillstand: {} };
    var t1 = ms('2026-11-03T20:45:00Z');
    await blick(t1, o);
    var imFenster = laeufe.length;
    var zeile1 = H.mitUhr(t1, function () { return Plan.lage(e, t1); }).filter(function (z) { return z.intervall === '1d'; })[0];
    await blick(ms('2026-11-03T21:35:00Z'), o);
    H.betreten(laeufe.length === imFenster + 1, 'Positivkontrolle: nach 16:30 NY kein Lauf');
    var grund = String(zeile1.grund || '');
    return { abweichung: falsch.length > 0, text: (falsch.length ? falsch.join('; ') : 'alle Zeiten richtig') +
      '. Runde im Fenster: ' + imFenster + ' Laeufe (' + grund.slice(0, 50) + '...) - faellig() faengt es ueber Intl-New-York ab. ' +
      'Grund: feste 20:30 UTC (' + Z('kerzenquelle.js', 'var heuteFertig = d.getUTCHours() > 20') + '), im Winter schliesst die Boerse 21:00 UTC; ' +
      'Folge nur in der Anzeige (offene Werte, main.js archivAbdeckung zaehlt den laufenden Tag 30 min zu frueh)' };
  }
});

/* SR-7  S9 Boersenfeiertag (Thanksgiving 26.11.2026) - und der Tag danach (Halbtag 27.11.). */
tests.push({
  id: 'SR-7', stoerung: 'S9 Feiertag gilt als abgeschlossener Handelstag', bewertung: 'B',
  lauf: async function (H) {
    var PlanD1 = Object.assign({}, Plan, { DECKEL_JE_LAUF: 1 });   /* 3.263 Werte > 300 mit zwei Werten nachgestellt */
    umgebung('sr7', { '1d': {
      AAA: { bisTag: '2026-11-25', am: '2026-11-25', kerzen: 450 },
      BBB: { bisTag: '2026-11-25', am: '2026-11-25', kerzen: 450 } } });
    var e = einst({ '1d': [1, 'AAA,BBB'] });
    var abrufe = [], laeufe = [], funk = H.zaehler(), zustand = {};
    var bis = '2026-11-25';
    var zurueck = quelleErsetzen(function () {
      var k = tagesKerzen('2026-11-25', 450, 30);
      if (bis === '2026-11-27') k.push([ms('2026-11-27T14:30:00Z') / 1000, 30, 30.2, 29.9, 30.1, 50000]);
      return { status: 200, body: H.yahooChart(k) };
    }, abrufe);
    var nachBlick = [];
    try {
      var o = { plan: PlanD1, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: zustand };
      await blick(ms('2026-11-26T22:00:00Z'), o); nachBlick.push(laeufe.length);   /* Do Feiertag, 17:00 NY */
      await blick(ms('2026-11-27T00:30:00Z'), o); nachBlick.push(laeufe.length);   /* Do Feiertag, 19:30 NY = Fr UTC */
      bis = '2026-11-27';
      await blick(ms('2026-11-27T21:35:00Z'), o); nachBlick.push(laeufe.length);   /* Fr Halbtag, 16:35 NY */
    } finally { zurueck(); }
    /* Wann ist BBB wieder dran? Fr-Abend, Sa, Mo-Abend - echte offeneSymbole. */
    var bbbDran = ['2026-11-27T22:00:00Z', '2026-11-28T15:00:00Z', '2026-11-30T21:35:00Z'].map(function (t) {
      return t.slice(5, 10) + ' ' + (offen('1d', e, ms(t)).indexOf('BBB') >= 0 ? 'ja' : 'nein');
    });
    var wer = laeufe.map(function (l) { return new Date(l.t).toISOString().slice(5, 16) + 'Z ' + l.syms.join('+') + ' (versucht ' +
      ((l.erg && l.erg.leerVersucht) ? 'ja' : 'nein') + ')'; });
    var feiertagIstHandelstag = Boerse.istHandelstag(ms('2026-11-26T15:00:00Z'));
    H.betreten(laeufe.length >= 2 && feiertagIstHandelstag === false, 'Feiertagslauf nicht betreten oder boerse.js kennt den Feiertag nicht');
    var freitag = laeufe.filter(function (l) { return tagVonMs(l.t) === '2026-11-27' && l.t > ms('2026-11-27T12:00:00Z'); })
      .reduce(function (a, l) { return a.concat(l.syms); }, []);
    var abw = nachBlick[1] > 0 || freitag.indexOf('BBB') < 0;
    return { abweichung: abw, text: 'Laeufe ' + wer.join(', ') + ' (boerse.js: 26.11. kein Handelstag). Am Feiertag liefen ' + nachBlick[1] +
      ' Laeufe ohne moeglichen Fortschritt; BBB lief nach 00:00 UTC -> versucht = ' + stand('1d').fertig.BBB.versucht +
      ' (UTC-Tag), BBB wieder dran: ' + bbbDran.join(', ') + ' -> der Fr-Balken kommt fuer BBB erst Mo. Soll: Feiertag ist kein abgeschlossener Tag (kein Lauf), Fr-Balken fuer alle am Fr. Grund: ' +
      Z('kerzenquelle.js', 'var heuteFertig = d.getUTCHours() > 20') + ' kennt keine Feiertage, versucht = heuteTag() in UTC (' +
      Z('kerzenquelle.js', 'stand.fertig[sym] = standEintrag(vorher, r.serie, ohneO, heuteTag());') + ')' };
  }
});

/* SR-8  S10 halber Handelstag (24.12.2026, Schluss 13:00 NY). */
tests.push({
  id: 'SR-8', stoerung: 'S10 Halbtag: Tag gilt erst ab 16:30 NY als fertig', bewertung: '-',
  lauf: async function (H) {
    umgebung('sr8', { '1d': { HALB: { bisTag: '2026-12-23', am: '2026-12-23', kerzen: 450 } } });
    var e = einst({ '1d': [1, 'HALB,'] });
    var laeufe = [], funk = H.zaehler();
    var o = { plan: Plan, kerzen: KQ, einstellungen: e, lauf: zaehlLauf(laeufe), funk: funk.f, stillstand: {} };
    var halb = Boerse.sitzungsMinuten(ms('2026-12-24T15:00:00Z'));
    await blick(ms('2026-12-24T19:00:00Z'), o);   /* 14:00 NY, Boerse seit 13:00 zu */
    var frueh = laeufe.length;
    await blick(ms('2026-12-24T21:35:00Z'), o);   /* 16:35 NY */
    H.betreten(laeufe.length === frueh + 1, 'Positivkontrolle: nach 16:30 NY kein Lauf');
    return { abweichung: false, text: '24.12. (boerse.js: ' + halb + ' Sitzungsminuten): um 14:00 NY ' + frueh + ' Laeufe (Tag noch nicht als fertig gezaehlt), ' +
      'um 16:35 NY ' + (laeufe.length - frueh) + ' Lauf. Soll erfuellt in der harmlosen Richtung: 3,5 h verzoegert, nie ausgelassen ' +
      '(sammelplan.js:144-148 sagt es selbst). Am 25.12. (Feiertag) greift SR-7' };
  }
});

/* SR-9  S4 Kuerzel-Neuvergabe: Bremse und stand.json je Kuerzel. */
tests.push({
  id: 'SR-9', stoerung: 'S4 Kuerzel neu vergeben: Stand der alten Firma bewertet die neue', bewertung: 'C',
  lauf: async function (H) {
    /* Teil 1: Bremse. Der gemerkte Stillstand haengt an der Menge, nicht am Intervall. */
    var z = { '1d': { schluessel: Runde.laufSchluessel(['ALT', 'B']), male: 2, gemeldet: true } };
    var gleich = Runde.stillstandGemeldet(z, '1d', ['B', 'ALT']);
    var umbenannt = Runde.stillstandGemeldet(z, '1d', ['NEU', 'B']);
    /* Teil 2: stand.json. XYZ gehoerte bis 30.06.2023 Firma 1; die Quelle liefert jetzt Firma 2 (seit Dez. 2024). */
    umgebung('sr9', { '1d': { XYZ: { bisTag: '2023-06-30', am: '2023-07-01', kerzen: 5000 } } });
    var e = einst({ '1d': [1, 'XYZ,'] });
    var abrufe = [], laeufe = [], funk = H.zaehler();
    var neu = tagesKerzen('2026-10-06', 450, 12);
    var zurueck = quelleErsetzen(function () { return { status: 200, body: H.yahooChart(neu) }; }, abrufe);
    var r;
    try {
      r = await blick(ms('2026-10-06T22:00:00Z'), { plan: Plan, kerzen: KQ, einstellungen: e, lauf: echterLauf(laeufe), funk: funk.f, stillstand: {} });
    } finally { zurueck(); }
    H.betreten(wieOft(abrufe, 'XYZ') === 1 && laeufe.length === 1, 'Abruf XYZ nicht betreten');
    var s = stand('1d').fertig.XYZ;
    var erste = tagVonMs(neu[0][0] * 1000);
    var hinweise = funk.args.filter(function (a) { return a[1] && a[1].art !== 'start'; }).length;
    var abw = !gleich || umbenannt || (s.bisTag === '2026-10-06' && !s.versucht && hinweise === 0);
    return { abweichung: abw, text: 'Bremse: dieselbe Menge umsortiert ' + (gleich ? 'erkannt' : 'NICHT erkannt') + ', umbenannte Menge ' +
      (umbenannt ? 'faelschlich gesperrt' : 'wieder gefragt') + ' (richtig; der Zustand lebt nur im Speicher, main.js:1541). stand.json: alter Eintrag ' +
      'bisTag 2023-06-30, Antwort beginnt ' + erste + ' -> gebucht als Fortschritt bis ' + s.bisTag + (s.versucht ? '' : ' ohne versucht') +
      ', Hinweise an die Karte ' + hinweise + '. Soll: eine Antwort, die erst nach dem gemerkten bisTag beginnt (range=40y), ist keine Fortsetzung -> melden. ' +
      'Grund: ' + Z('kerzenquelle.js', 'function standEintrag(vorher, serie, ohneEroeffnung, heute) {') + ' vergleicht nur den letzten Tag. ' +
      'Das Zusammenlegen zweier Firmen in EINER Datei prueft der kerzenquelle-Teil' };
  }
});

/* SR-10  Rollendes Intraday-Fenster: fensterLuecke misst das Archiv an seiner JUENGSTEN Reihe. */
tests.push({
  id: 'SR-10', stoerung: 'Fenster 1m: Dringlichkeit am juengsten statt am aeltesten faelligen Wert', bewertung: 'B',
  lauf: async function (H) {
    var PlanD1 = Object.assign({}, Plan, { DECKEL_JE_LAUF: 1 });   /* 531 Werte (top500 + ETFs) > 300 mit zwei Werten nachgestellt */
    var alt = ms('2026-09-29T17:00:00Z');
    umgebung('sr10', { '1m': {
      MINA: { bisTag: '2026-09-29', am: '2026-09-29', kerzen: 2000 },
      MINB: { bisTag: '2026-09-29', am: '2026-09-29', kerzen: 2000 } } });
    var ord = KQ.ordnerVon('1m');
    function datei(sym, letzte) {
      fs.writeFileSync(path.join(ord, 'bars_1m_' + sym + '.json'), JSON.stringify({ sym: sym, series: [[letzte - 60000, 10, 1, 10, 10, 10], [letzte, 10, 1, 10, 10, 10]] }));
    }
    datei('MINA', alt); datei('MINB', alt);
    var e = einst({ '1m': [1, 'MINA,MINB'] });
    var laeufe = [], funk = H.zaehler(), zustand = {};
    /* Der Lauf als Attrappe, die schreibt wie ein gelungener Lauf: juengste Kerze = jetzt - 1 min. */
    var lauf = async function (iv, syms) {
      laeufe.push({ iv: iv, syms: syms.slice(), t: Date.now() });
      var st = KQ.standLesen(ord);
      syms.forEach(function (s) { datei(s, Date.now() - 60000); st.fertig[s] = { bisTag: tagVonMs(Date.now()), am: tagVonMs(Date.now()), kerzen: 2600 }; });
      KQ.standSchreiben(ord, st);
      return { ok: true, ergebnis: { verarbeitet: syms.length, leerVersucht: 0, abgebrochen: false } };
    };
    var o = { plan: PlanD1, kerzen: KQ, einstellungen: e, lauf: lauf, funk: funk.f, stillstand: zustand };
    await blick(ms('2026-10-06T15:00:00Z'), o);             /* 11:00 NY, Markt offen, Fenster 6,9 von 7 Tagen */
    var nach1 = laeufe.length;
    var t2 = ms('2026-10-06T15:20:00Z');
    await blick(t2, o);
    var nach2 = laeufe.length;
    var zeile2 = H.mitUhr(t2, function () { return Plan.lage(e, t2); }).filter(function (z) { return z.intervall === '1m'; })[0];
    var t3 = ms('2026-10-06T20:35:00Z');
    var zeile3 = H.mitUhr(t3, function () { return Plan.lage(e, t3); }).filter(function (z) { return z.intervall === '1m'; })[0];
    var eigen = KQ.fensterLuecke('1m', alt, t3);
    H.betreten(nach1 === 1 && laeufe[0].syms[0] === 'MINA', 'Aufholen fuer den ersten Wert nicht betreten');
    var abw = nach2 === nach1;
    return { abweichung: abw, text: 'Beide Werte 6,9 Tage im 7-Tage-Fenster: Blick 1 holt MINA (aufholen), Blick 2 (20 min spaeter, Markt offen) ' +
      (nach2 === nach1 ? 'holt MINB NICHT' : 'holt MINB') + ' (Karte: "' + String(zeile2.grund || '').slice(0, 45) + '...", Fenster laut Karte ' +
      (zeile2.fensterTage && zeile2.juengsteMs ? ((t2 - zeile2.juengsteMs) / 86400000).toFixed(2) : '?') + ' Tage, MINB selbst ' +
      KQ.fensterLuecke('1m', alt, t2).tageAus.toFixed(2) + '), denn die Luecke wird an der ' +
      'juengsten Kerze des Archivs gemessen (' + Z('kerzenquelle.js', 'if (t != null && (erg.juengsteMs == null || t > erg.juengsteMs)) erg.juengsteMs = t;') + ', ' +
      Z('sammelplan.js', 'var luecke = Q.fensterLuecke(intervall, ueberblick.juengsteMs, jetzt);') + '). Um 16:35 NY ist MINB ' + eigen.tageAus.toFixed(2) +
      ' Tage alt (fensterLuecke selbst: verloren ' + eigen.verloren + ', ' + (eigen.luecke * 24).toFixed(1) + ' h weg), die Karte sagt verloren ' + zeile3.verloren +
      '. Soll: aufholen, sobald EIN faelliger Wert 75 % des Fensters erreicht; Verlust je Wert melden' };
  }
});

/* Nachbarn im gemeinsamen Laeufer nicht stoeren: der Datenordner von kerzenquelle.js ist
 * Modulzustand und kommt nach jedem Test zurueck (https.get stellt jeder Test selbst zurueck). */
tests.forEach(function (t) {
  var f = t.lauf;
  t.lauf = async function (H) {
    var vorher = KQ.datenOrdner();
    try { return await f(H); } finally { KQ.datenOrdnerSetzen(vorher); }
  };
});

module.exports = { lader: 'sammelrunde.js', tests: tests };
H.allein(module);
