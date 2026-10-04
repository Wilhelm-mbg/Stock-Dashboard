'use strict';
/* Live gegen Messung - Ergebnis-Drift, Teil 3: Anzeige und Texte der App gegen die Messung Nr. 88
 * (studien/vorregistrierung-2026-10-04-ergebnis-drift/: ERGEBNIS.md, ergebnis.json, VORREGISTRIERUNG.md).
 *
 * Vertrag: module.exports = function (Z) -> [{ nr, titel, lauf }]. Z.WURZEL = Repo-Wurzel (alles wird von dort
 * gelesen, PRUEF_WURZEL-faehig), Z.zeile(abweichung, text) druckt GENAU EINE Zeile je Test.
 * Zahlen der Messung kommen per JSON.parse aus ergebnis.json bzw. per Textmarke aus den .md-Dateien - nie
 * abgeschrieben. Eine Textmarke, die nicht trifft (indexOf == -1), wirft: das ist ein Testdefekt, kein Befund.
 * Fenster-Module laufen in einer vm-Sandbox (sandbox/uhr aus pruefberichte/live-gegen-messung-momentum.test.js).
 * Kein Netz, kein Electron. Simulation mit virtuellem Kapital, keine Anlageberatung.
 *
 * Aufruf aus der Repo-Wurzel:  node pruefberichte/live-gegen-messung-drift/teil-3-anzeige.tests.js [T3]
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

module.exports = function (Z) {
  var W = Z.WURZEL;
  var MESS = 'studien/vorregistrierung-2026-10-04-ergebnis-drift/';
  var TAG = 86400000;

  function lies(rel) { return fs.readFileSync(path.join(W, rel), 'utf8'); }
  function json() { return JSON.parse(lies(MESS + 'ergebnis.json')); }
  /** Ausschnitt von der Marke a bis zur Marke b (b nach a). Fehlt eine: Testdefekt. */
  function block(text, a, b, wo) {
    var i = text.indexOf(a);
    if (i === -1) throw new Error('Testdefekt: Marke "' + a + '" fehlt in ' + wo);
    var j = text.indexOf(b, i + a.length);
    if (j === -1) throw new Error('Testdefekt: Endmarke "' + b + '" fehlt in ' + wo);
    return text.slice(i, j);
  }
  function muss(text, marke, wo) {
    if (text.indexOf(marke) === -1) throw new Error('Testdefekt: Marke "' + marke + '" fehlt in ' + wo);
  }
  function zeileVon(rel, marke) {
    var z = lies(rel).split('\n');
    for (var i = 0; i < z.length; i++) if (z[i].indexOf(marke) !== -1) return rel + ':' + (i + 1);
    throw new Error('Testdefekt: Marke "' + marke + '" fehlt in ' + rel);
  }
  function de1(x) { return x.toFixed(1).replace('.', ','); }
  function de2(x) { return x.toFixed(2).replace('.', ','); }
  /** Das Urteil und das Tor der Messung - aus ergebnis.json und ERGEBNIS.md. */
  function messUrteil() {
    var j = json(), md = lies(MESS + 'ERGEBNIS.md');
    var m = /Tor t ≥ (\d+,\d+)/.exec(md);
    if (!m) throw new Error('Testdefekt: Tor nicht in ERGEBNIS.md');
    return { j: j, urteil: j.urteil.urteil, tor: Number(m[1].replace(',', '.')), h60: j.stufe1.H60, h20: j.stufe1.H20, s2: j.stufe2 };
  }

  /* ---- Sandbox (wie live-gegen-messung-momentum.test.js) ---- */
  function uhr(jetzt) {
    var Uh = function (x) { return arguments.length ? new Date(x) : new Date(Uh.jetzt); };
    Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
    return Uh;
  }
  function sandbox(dateien, win, jetzt) {
    var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; },
      querySelectorAll: function () { return []; }, createElement: function () { return {}; } };
    var ctx = {
      window: win, document: doc, console: console, __Uhr: uhr(jetzt),
      setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; },
      setInterval: function () { return 0; }
    };
    win.document = doc;
    vm.createContext(ctx);
    dateien.forEach(function (d) {
      vm.runInContext('(function (Date) {' + fs.readFileSync(path.join(W, d), 'utf8') + '\n})(__Uhr);', ctx, { filename: d });
    });
    win.__uhr = ctx.__Uhr;
    return win;
  }
  function warte() { return new Promise(function (r) { setImmediate(function () { setImmediate(r); }); }); }
  var U_ATTRAPPE = {
    statuszeile: function () { return null; },
    esc: function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
    d: function (t) { return new Date(t).toISOString().slice(0, 10); }, dt: function (t) { return new Date(t).toISOString(); },
    money: function (x) { return Math.round(x) + ' $'; },
    signTxt: function (v, suf) { return (v >= 0 ? '+' : '') + v + (suf || ''); },
    pz1: function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',') + ' %'; },
    kachel: function (label, wert) { return '<div class="kachel">' + label + ': ' + wert + '</div>'; }
  };

  return [
    /* ------------------------------------------------------------------ T1 */
    { nr: 'T1', titel: 'Sichtbarer Messkasten im Drift-Panel (index.html) gegen das Urteil der Messung', lauf: async function () {
      var M = messUrteil();
      var html = lies('index.html');
      var kasten = block(html, 'data-mess="Ergebnis-Drift-Messung', '</div>', 'index.html');
      var alt = /\+(\d+,\d+) % p\. a\. bei t = (\d+,\d+)/.exec(kasten);
      var nennt88 = kasten.indexOf(de1(M.s2.buchGesamt)) !== -1 || kasten.indexOf(M.urteil) !== -1;
      var ab = !!alt && !nennt88;
      Z.zeile(ab, ab
        ? zeileVon('index.html', 'Gemessen ab 2015') + ' zeigt "Gemessen ab 2015: +' + alt[1] + ' % p. a. bei t = ' + alt[2] +
          '" (marktneutral, 21.08.2026, vor der Zeitzonen-Korrektur) - die Messung Nr. 88 sagt "' + M.urteil + '" (t A ' + de2(M.h60.t.A) +
          ', B netto ' + de2(M.h60.t.Bnetto) + ', Tor ' + de1(M.tor) + ') und Buch +' + de1(M.s2.buchGesamt) + ' %; der Kasten nennt sie nicht'
        : 'Messkasten im Drift-Panel nennt keine alte Rendite oder nennt die Messung Nr. 88');
    } },

    /* ------------------------------------------------------------------ T2 */
    { nr: 'T2', titel: 'Erklaerfenster regeln.mf.drift (app-shell.js): "Was gemessen ist", Fuenftel, beide Beine', lauf: async function () {
      var M = messUrteil();
      var reg = lies(MESS + 'VORREGISTRIERUNG.md');
      muss(reg, 'oberstes Zehntel', 'VORREGISTRIERUNG.md');
      muss(reg, 'nur die Kaufseite handelt', 'VORREGISTRIERUNG.md');
      var b = block(lies('app-shell.js'), "'regeln.mf.drift': {", 'fuss:', 'app-shell.js');
      var teile = [];
      var iG = b.indexOf('Was gemessen ist');
      var alt = iG === -1 ? null : /\+(\d+,\d+) % p\. a\. bei t = (\d+,\d+)/.exec(b.slice(iG).replace(/<\/?b>/g, ''));
      if (alt) teile.push('"Was gemessen ist ... +' + alt[1] + ' % p. a. bei t = ' + alt[2] + '" statt Urteil "' + M.urteil + '"');
      if (b.indexOf('oberste Fünftel') !== -1 || b.indexOf('oberstes Fünftel') !== -1) teile.push('"oberstes Fünftel" - gemessen ist das oberste Zehntel (≥ 90. Perzentil, 63 Handelstage Vergleichsmenge)');
      if (/beide Beine/.test(b)) teile.push('"es braucht beide Beine - long allein ist überwiegend Marktbeta" - gemessen ist nur die Kaufseite: gegen alle Melder B − M +' +
        de2(M.h60.BM) + ' Pp (t ' + de2(M.h60.t.BM) + '), Buch gegen SPY +' + de1(M.s2.buchGesamt) + ' gegen +' + de1(M.s2.spyGesamt) + ' %');
      var ab = teile.length > 0;
      Z.zeile(ab, ab ? zeileVon('app-shell.js', '<b>Was gemessen ist.</b> 20.356') + ' Erklärfenster Ergebnis-Drift: ' + teile.join('; ') +
        '; Nr. 88 kommt im Fenster nicht vor' : 'Erklärfenster regeln.mf.drift stimmt mit der Messung Nr. 88 überein');
    } },

    /* ------------------------------------------------------------------ T3 */
    { nr: 'T3', titel: 'Erklaerfenster vermoegen.buecher: "Ergebnis-Drift nach Zeitzonen-Korrektur 8,44 statt 14,07 % p.a."', lauf: async function () {
      var M = messUrteil();
      var b = block(lies('app-shell.js'), "'vermoegen.buecher': {", 'fuss:', 'app-shell.js');
      var m = /Ergebnis-Drift nach Zeitzonen-Korrektur (\d+,\d+) statt (\d+,\d+) % p\.a\./.exec(b);
      var halten = b.indexOf('beide halten über die volle Historie') !== -1;
      var nennt88 = b.indexOf(de1(M.s2.buchGesamt)) !== -1 || b.indexOf(M.urteil) !== -1;
      var ab = !!m && !nennt88;
      Z.zeile(ab, ab
        ? zeileVon('app-shell.js', 'Ergebnis-Drift nach Zeitzonen-Korrektur') + ' zeigt am Bestand "' + m[0] + '"' +
          (halten ? ' und "beide halten über die volle Historie"' : '') + ' (Stand 23.08.2026, marktneutraler Rohlauf) - die Messung Nr. 88: Stufe 1 "' +
          M.urteil + '", Buch +' + de1(M.s2.buchGesamt) + ' % gegen SPY +' + de1(M.s2.spyGesamt) + ' %, ' + M.s2.zufall.ueberDemBuch + ' von ' + M.s2.zufall.buecher + ' Zufallsbüchern darüber'
        : 'vermoegen.buecher nennt keine überholte Drift-Rendite');
    } },

    /* ------------------------------------------------------------------ T4 */
    { nr: 'T4', titel: 'Stufe-1-Urteil der Messung Nr. 88 ("nicht entscheidbar") an den Stellen des Drift-Buchs', lauf: async function () {
      var M = messUrteil();
      var s = block(lies('strategien.js'), "key: 'drift',", "schalter: 'drift'", 'strategien.js');
      var r = block(lies('studienurteile.js'), "'drift': [", ']\n  };', 'studienurteile.js');
      var tAlt = /t = 1,7–2,0/.test(s);
      /* "1,97" allein trifft in strategien.js den Meldesprung "1,97 %" der Kontrollmessung - deshalb mit "t " davor */
      var marken = ['t ' + de2(M.h60.t.Bnetto), 't = ' + de2(M.h60.t.Bnetto), 't ' + de2(M.h60.t.A), 't = ' + de2(M.h60.t.A), '+' + de2(M.h60.Bnetto) + ' Pp'];
      var nenntS = marken.some(function (x) { return s.indexOf(x) !== -1; }) || /nicht entscheidbar[^']*(Nr\. 88|04\.10\.2026)/.test(s);
      var nenntR = r.indexOf(M.urteil) !== -1;
      var ab = !nenntS && !nenntR;
      Z.zeile(ab, ab
        ? 'Belegstand und Stand-Chip des Drift-Buchs (' + zeileVon('strategien.js', 'KONTROLLMESSUNG 23.08.2026: drift.js') + '/' +
          zeileVon('strategien.js', 'Neumessung offen; Stand 04.10.2026') + ') zeigen ' + (tAlt ? '"t = 1,7–2,0: nicht entscheidbar" (Kontrollmessung 23.08.)' : 'keine Zahl der Nr. 88') +
          (/\+10,44 % p\. a\. bei t = 3,04/.test(s) ? ' und "+10,44 % p. a. bei t = 3,04"' : '') + '; das Urteil der Messung Nr. 88 (Stufe 1 "' + M.urteil + '", A t ' + de2(M.h60.t.A) + ', B netto +' + de2(M.h60.Bnetto) +
          ' Pp t ' + de2(M.h60.t.Bnetto) + ') steht weder dort noch in der Rückblick-Zeile (studienurteile.js) - die App nennt nur Stufe 2'
        : 'das Stufe-1-Urteil der Messung Nr. 88 steht am Drift-Buch');
    } },

    /* ------------------------------------------------------------------ T5 */
    { nr: 'T5', titel: 'Drift-Panel "Neu rechnen" (driftui.js): marktneutrale Rendite und "ueberzufaellig (t >= 2)"', lauf: async function () {
      var M = messUrteil();
      var tProbe = M.h20.t.A;   // ein t aus der Messung, das unter dem Tor liegt (Urteil "nicht entscheidbar")
      if (!(tProbe >= 2 && tProbe < M.tor)) throw new Error('Testdefekt: Probe-t ' + tProbe + ' liegt nicht zwischen 2 und dem Tor');
      var jetzt = Date.UTC(2026, 9, 5, 18, 0);
      var roh = {}, termine = {};
      for (var i = 0; i < 40; i++) { roh['W' + i] = [[jetzt - TAG, 100, 1e6, 100]]; termine['W' + i] = [['2026-08-01T12:00:00Z']]; }
      var erg = { innerHTML: '' }, heute = { innerHTML: '' };
      var win = {
        U: U_ATTRAPPE, __el: { drErgebnis: erg, drHeute: heute },
        MF: { tagesdatenLesen: async function () { return { roh: roh }; } },
        api: { storeGet: async function (k) {
          if (k === 'drift_markt') return { at: jetzt, reihe: [[jetzt - TAG, 400]], roh: [[jetzt - TAG, 400]] };
          if (k === 'drift_termine') return { at: jetzt, sym: termine };
          return null;
        }, storeSet: async function () { } },
        Drift: { STANDARD: require(path.join(W, 'drift.js')).STANDARD,
          durchlauf: function () { return { tWert: Math.round(tProbe * 100) / 100, proJahr: 5, positiveMonate: 60, verlauf: new Array(60), offenSchnitt: 10, positionen: 500, monate: ['2021-09', '2026-09'] }; },
          heute: function () { return { offen: [], faellig: [], halten: 60 }; } },
        Kurse: { hole: async function () { return null; }, reihe: function (b) { return b; } }
      };
      sandbox(['driftui.js'], win, jetzt);
      await win.DriftUI.rechne();
      var h = erg.innerHTML;
      muss(h, 't-Wert', 'drErgebnis');
      var marktneutral = h.indexOf('(marktneutral)') !== -1;
      var ueber = h.indexOf('überzufällig (t ≥ 2)') !== -1 && h.indexOf('nicht überzufällig') === -1;
      var ab = ueber || marktneutral;
      Z.zeile(ab, ab
        ? zeileVon('driftui.js', "Ertrag p. a. (marktneutral)") + '/' + zeileVon('driftui.js', "überzufällig (t ≥ 2)") + ' zeigt eine "Ertrag p. a. (marktneutral)"-Kachel (Long-Short, nicht gemessen in Nr. 88)' +
          (ueber ? ' und nennt t = ' + de2(tProbe) + ' "überzufällig (t ≥ 2)" - die Messung legt das Tor bei t ≥ ' + de1(M.tor) + ' und urteilt bei diesem t "' + M.urteil + '"' : '') +
          '; die Rechnung läuft auf dem Universum der App (Überlebende), ohne Hinweis auf Nr. 88'
        : 'driftui.js zeigt keine marktneutrale Rendite als Messung und kein Urteil unter dem Tor');
    } },

    /* ------------------------------------------------------------------ T6 */
    { nr: 'T6', titel: 'Parameterfelder drHalten/drAnteil/drFenster/drKosten: "(geprueft)" gegen die gemessene Regel', lauf: async function () {
      var reg = lies(MESS + 'VORREGISTRIERUNG.md');
      var zehntel = /oberstes Zehntel = Wert ≥ (\d+)\. Perzentil/.exec(reg);
      var vgl = /Vergleichsmenge sind die Überraschungen aller Ereignisse mit Einstiegstag in den (\d+) Handelstagen/.exec(reg);
      var kosten = /Kosten je Umlauf \*\*([\d,]+) \/ ([\d,]+) \/ ([\d,]+) Pp\*\*/.exec(reg);
      if (!zehntel || !vgl || !kosten) throw new Error('Testdefekt: Regelmarken in VORREGISTRIERUNG.md');
      var S = require(path.join(W, 'drift.js')).STANDARD;
      var html = lies('index.html');
      var feld = block(html, '<select id="drAnteil"', '</select>', 'index.html');
      var fenst = block(html, '<select id="drFenster"', '</select>', 'index.html');
      var teile = [];
      var anteilMess = 1 - Number(zehntel[1]) / 100;
      if (Math.abs(S.anteil - anteilMess) > 1e-9) {
        var opt = new RegExp('value="' + String(S.anteil).replace('.', '\\.') + '0?"[^>]*>([^<]*)<').exec(feld);
        teile.push('Anteil ' + (opt ? '"' + opt[1] + '"' : S.anteil) + ' - gemessen ' + Math.round(anteilMess * 100) + ' % (oberstes Zehntel)');
      }
      if (S.fenster !== Number(vgl[1])) {
        var o2 = new RegExp('value="' + S.fenster + '"[^>]*>([^<]*)<').exec(fenst);
        teile.push('Vergleichsfenster ' + (o2 ? '"' + o2[1] + '"' : S.fenster) + ' - gemessen ' + vgl[1] + ' Handelstage');
      }
      teile.push('Kosten ' + S.kostenBp + ' Bp je Seite - gemessen ' + kosten[1] + ' / ' + kosten[2] + ' / ' + kosten[3] + ' Pp je Umlauf nach Klasse');
      var tip = /erst ab rund 60 Tagen trägt er/.test(html);
      var geprueft = feld.indexOf('(geprüft)') !== -1 || fenst.indexOf('(geprüft)') !== -1;
      var ab = geprueft && teile.length > 1;
      Z.zeile(ab, ab
        ? zeileVon('index.html', '20 % (geprüft)') + ', ' + zeileVon('index.html', '120 Tage (geprüft)') + ' und driftui.js konfigZeigen ("aus der gemessenen Konfiguration") nennen Drift.STANDARD "geprüft": ' +
          teile.join('; ') + (tip ? '; Tooltip "erst ab rund 60 Tagen trägt er" - bei 60 Tagen urteilt Nr. 88 "nicht entscheidbar"' : '')
        : 'Parameterfelder entsprechen der gemessenen Regel');
    } },

    /* ------------------------------------------------------------------ T7 */
    { nr: 'T7', titel: 'Gegenprobe: RUECKBLICK.drift (studienurteile.js) gegen ergebnis.json', lauf: async function () {
      var M = messUrteil(), s = M.s2;
      var win = sandbox(['studienurteile.js'], {}, Date.now());
      var SU = win.StudienUrteile;
      var e = SU.rueckblicke('drift');
      if (e.length !== 1) throw new Error('Testdefekt: ' + e.length + ' Drift-Rückblicke');
      var z = e[0].zahlen, r1 = function (x) { return Math.round(x * 10) / 10; };
      var p = [['kennung', e[0].kennung, M.j.kennung], ['buchGesamt', z.buchGesamt, r1(s.buchGesamt)], ['spyGesamt', z.spyGesamt, r1(s.spyGesamt)],
        ['schlaegt', z.schlaegt, s.schlaegt], ['zufallUeber', z.zufallUeber, s.zufall.ueberDemBuch], ['zufallBuecher', z.zufallBuecher, s.zufall.buecher],
        ['vorwaertstest', z.vorwaertstest, s.vorwaertstestAngezeigt], ['rueckschlagBuch', z.rueckschlagBuch, r1(s.rueckschlagBuch)],
        ['rueckschlagSpy', z.rueckschlagSpy, r1(s.rueckschlagSpy)], ['plaetze', /\((\d+) Plätze/.exec(e[0].korb) && Number(/\((\d+) Plätze/.exec(e[0].korb)[1]), s.plaetzeMax]];
      var rot = p.filter(function (x) { return x[1] !== x[2]; }).map(function (x) { return x[0] + ' ' + x[1] + ' statt ' + x[2]; });
      var t = SU.rueckblickText(e[0]);
      ['+' + de1(r1(s.buchGesamt)) + ' %', '+' + de1(r1(s.spyGesamt)) + ' %', s.zufall.ueberDemBuch + ' von ' + s.zufall.buecher, 'kein Vorwärtstest angezeigt', 'nur Kaufseite'].forEach(function (m) {
        if (t.indexOf(m) === -1) rot.push('"' + m + '" fehlt in der Zeile');
      });
      Z.zeile(rot.length > 0, rot.length ? 'RUECKBLICK.drift weicht ab: ' + rot.join('; ')
        : 'RUECKBLICK.drift (studienurteile.js:164) trägt ' + p.length + ' Felder wie ergebnis.json (Buch +' + de1(r1(s.buchGesamt)) + ' %, SPY +' + de1(r1(s.spyGesamt)) +
          ' %, ' + s.zufall.ueberDemBuch + '/' + s.zufall.buecher + ', kein Vorwärtstest) und sagt "nur Kaufseite – nicht die Regel dieses Buchs"');
    } },

    /* ------------------------------------------------------------------ T8 */
    { nr: 'T8', titel: 'Gegenprobe: BUCH_SATZ steht an jeder Stelle, die die Drift-Rueckblick-Zeile zeigt', lauf: async function () {
      var jetzt = Date.UTC(2026, 9, 5, 18, 0);
      var karte = { innerHTML: '' }, karteM = { innerHTML: '' };
      var d = { driftAn: true, momentumAn: true, mfVerlauf: [],
        driftBuch: { name: 'drift', start: 100000, cash: 100000, positionen: [], trades: [], angelegt: jetzt - 10 * TAG },
        mfBuch: { name: 'momentum', start: 100000, cash: 100000, positionen: [], trades: [], angelegt: jetzt - 10 * TAG } };
      var win = sandbox(['studienurteile.js', 'mfdepot.js'], {
        U: U_ATTRAPPE, Massstab: require(path.join(W, 'massstab.js')), MFHandel: require(path.join(W, 'mfhandel.js')),
        api: { storeGet: async function () { return null; } }, __el: { buchDriftKopf: karte, buchMomentumKopf: karteM },
        __D: function () { return d; }, __save: function () { }
      }, jetzt);
      await warte();
      win.MFDepot.karten();
      var SU = win.StudienUrteile, satz = SU.buchSatz('drift'), zeile = SU.rueckblickText(SU.rueckblicke('drift')[0]);
      if (!satz) throw new Error('Testdefekt: kein BUCH_SATZ drift');
      var esc = U_ATTRAPPE.esc;
      var inKarte = karte.innerHTML.indexOf(esc(zeile)) !== -1, satzKarte = karte.innerHTML.indexOf(esc(satz)) !== -1;
      /* strategien.js: die Funktion rueckblickZeilen herausloesen und mit derselben Attrappe laufen lassen */
      var src = lies('strategien.js');
      var f = /\n  function rueckblickZeilen\(kette\) \{[\s\S]*?\n  \}\n/.exec(src);
      if (!f) throw new Error('Testdefekt: rueckblickZeilen nicht gefunden');
      var rz = new Function('window', 'U', f[0] + '\nreturn rueckblickZeilen;')({ StudienUrteile: SU }, U_ATTRAPPE);
      var drift = block(src, "key: 'drift',", "schalter: 'drift'", 'strategien.js');
      var keys = /messKeys: \[([^\]]*)\]/.exec(drift);
      var kette = keys ? keys[1].split(',').map(function (x) { return x.trim().replace(/'/g, ''); }) : [];
      var h = rz(kette);
      var inAntwort = h.indexOf(esc(zeile)) !== -1, satzAntwort = h.indexOf(esc(satz)) !== -1;
      var ab = !(inKarte && satzKarte && inAntwort && satzAntwort);
      Z.zeile(ab, ab ? 'BUCH_SATZ fehlt: Karte Zeile ' + inKarte + '/Satz ' + satzKarte + ', Antwort-Seite Zeile ' + inAntwort + '/Satz ' + satzAntwort
        : 'Karte des Drift-Buchs (mfdepot.js:791-794) und Antwort-Seite (strategien.js:410) zeigen die Rückblick-Zeile je mit dem Satz "' + satz.slice(0, 60) + '…"');
    } },

    /* ------------------------------------------------------------------ T9 */
    { nr: 'T9', titel: 'Gegenprobe: Karte "Gegen den Markt" misst Buch gegen SPY als Gesamtertrag ab dem Start des Buchs (wie die Messung)', lauf: async function () {
      var M = messUrteil();
      var reg = lies(MESS + 'VORREGISTRIERUNG.md');
      muss(reg, 'Gesamtertrag mit Ausschüttungen', 'VORREGISTRIERUNG.md');
      var startMess = M.s2.buchEnde / (1 + M.s2.buchGesamt / 100);
      var t0 = Date.UTC(2026, 8, 1, 13, 30), jetzt = t0 + 6 * TAG + 6 * 3600000;
      var roh = [], ber = [], verlauf = [];
      for (var i = 0; i < 6; i++) {
        var t = t0 + i * TAG, k = 600 + i;
        roh.push([t, k]); ber.push([t, k * (i < 3 ? 0.99 : 1)]);   // Ausschuettung mit Ex-Tag i = 3: die bereinigte Reihe davor tiefer
        verlauf.push({ t: t + 9 * 3600000, tag: new Date(t).toISOString().slice(0, 10), drift: 100000 + i * 100, spy: k, spyT: t, startD: 100000 });
      }
      var d = { driftAn: true, momentumAn: false, mfVerlauf: verlauf,
        driftBuch: { name: 'drift', start: 100000, cash: 100000, positionen: [], trades: [], angelegt: verlauf[0].t } };
      var win = sandbox(['studienurteile.js', 'mfdepot.js'], {
        U: U_ATTRAPPE, Massstab: require(path.join(W, 'massstab.js')), MFHandel: require(path.join(W, 'mfhandel.js')),
        api: { storeGet: async function (k) { return k === 'drift_markt' ? { at: jetzt, reihe: ber, roh: roh } : null; } }, __el: {},
        __D: function () { return d; }, __save: function () { }
      }, jetzt);
      await warte();
      var v = win.MFDepot.vergleich('drift');
      var Ms = require(path.join(W, 'massstab.js'));
      var soll = (605 / (600 * 0.99) - 1) * 100;
      var ok = v && v.ok && v.marktArt === 'gesamt' && v.buchAusschuettungen === true && v.abStart === true &&
        Math.abs(v.marktPct - soll) < 1e-9 && Math.abs(d.driftBuch.start - startMess) < 0.01;
      Z.zeile(!ok, ok
        ? 'Karte des Drift-Buchs: SPY als Gesamtertrag (' + v.marktPct.toFixed(3) + ' % = Soll mit Ausschüttung), Buch bucht Ausschüttungen, Vergleich ab Anlage des Buchs mit ' +
          Math.round(d.driftBuch.start) + ' $ wie die Messung (' + Math.round(startMess) + ' $) - Hinweis "' + Ms.hinweis(v).slice(0, 70) + '…"; anderer Zeitraum als der Rückblick, das steht im Datum'
        : 'Vergleich weicht ab: ' + JSON.stringify(v && { ok: v.ok, art: v.marktArt, aus: v.buchAusschuettungen, abStart: v.abStart, markt: v.marktPct, soll: soll, start: d.driftBuch.start }));
    } },

    /* ------------------------------------------------------------------ T10 */
    { nr: 'T10', titel: 'Gegenprobe: Bestand kennzeichnet einen Leerverkauf des Drift-Buchs als "(short)"', lauf: async function () {
      var bu = lies('bestandui.js'), dp = lies('depot.js');
      var mt = (/\n  function mittelText\(m\) \{[\s\S]*?\n  \}/.exec(bu) || [])[0];
      if (!mt) throw new Error('Testdefekt: mittelText nicht gefunden');
      var mf = /mittelfrist: function \(sym\) \{([\s\S]*?)\n    \},/.exec(dp);
      if (!mf) throw new Error('Testdefekt: DepotAPI.mittelfrist nicht gefunden');
      var mittelText = new Function(mt + '\nreturn mittelText;')();
      var mittelfrist = new Function('D', 'sym', mf[1]);
      var D = { mfBuch: { positionen: [] }, driftBuch: { positionen: [{ sym: 'AAA', richtung: -1 }, { sym: 'BBB', richtung: 1 }] } };
      var a = mittelText(mittelfrist(D, 'AAA')).txt, b = mittelText(mittelfrist(D, 'BBB')).txt;
      var ok = a === 'Ergebnis-Drift hält (short)' && b === 'Ergebnis-Drift hält';
      Z.zeile(!ok, ok ? 'Bestand (bestandui.js:67, depot.js:4628): Leerverkauf "' + a + '", Kauf "' + b + '" - Kennzeichnung stimmt (die Messung hat keine Shorts; das sagt BUCH_SATZ an Karte und Antwort-Seite, nicht im Bestand)'
        : 'Short-Kennzeichnung falsch: "' + a + '" / "' + b + '"');
    } },

    /* ------------------------------------------------------------------ T11 */
    { nr: 'T11', titel: 'Journal Reihenende (mfhandel.js reihenendeJournal) bei einem Leerverkauf des Drift-Buchs', lauf: async function () {
      var reg = lies(MESS + 'VORREGISTRIERUNG.md');
      muss(reg, 'Insolvenz und Zwangs-Delisting = Totalverlust', 'VORREGISTRIERUNG.md');
      muss(reg, 'nur die Kaufseite handelt', 'VORREGISTRIERUNG.md');
      var MH = require(path.join(W, 'mfhandel.js'));
      var x = { sym: 'KURZ', letzterTag: '2026-09-01', kurs: 10, stueck: 100, richtung: -1, gutschrift: 100 * (2 * 50 - 10), tage: 5 };
      var txt = MH.reihenendeJournal('drift', x).txt;
      var bei0 = 100 * (2 * 50 - 0);
      var ab = txt.indexOf('hätte die Messung 0 gebucht') !== -1;
      Z.zeile(ab, ab
        ? zeileVon('mfhandel.js', 'hätte die Messung 0 gebucht') + ' schreibt beim Leerverkauf ' + x.sym + ' "wäre es eine Insolvenz, hätte die Messung 0 gebucht" - die Messung Nr. 88 hat keine Leerverkäufe, und bei Kurs 0 bekäme der Short ' +
          bei0 + ' $ statt ' + x.gutschrift + ' $ (Gewinn, nicht Totalverlust)'
        : 'Journalzeile beim Leerverkauf ohne falschen Messungsbezug');
    } },

    /* ------------------------------------------------------------------ T12 */
    { nr: 'T12', titel: 'Journal des Drift-Abgleichs: "jünger als 5 Handelstage" gegen den Einstieg der Messung', lauf: async function () {
      var reg = lies(MESS + 'VORREGISTRIERUNG.md');
      muss(reg, 'Kauf zur Eröffnung des Einstiegstags', 'VORREGISTRIERUNG.md');
      var src = lies('mfdepot.js');
      var t = block(src, "txt: 'Ergebnis-Drift-Depot abgeglichen.", '(getanD.verworfen', 'mfdepot.js');
      var m = /jünger als (\d+) Handelstage/.exec(t);
      var MH = require(path.join(W, 'mfhandel.js'));
      /* Wirkung pruefen: ein 3 Handelstage altes Signal wird eroeffnet */
      var buch = { cash: 100000, positionen: [], trades: [] };
      var g = MH.driftAbgleich(buch, { offen: [{ sym: 'SPAET', richtung: 'kaufen', seitTagen: 3, ueberraschung: 1 }] }, { SPAET: 50 }, Date.UTC(2026, 9, 5), {});
      var ab = !!m && Number(m[1]) > 0 && g.eroeffnet === 1;
      Z.zeile(ab, ab
        ? zeileVon('mfdepot.js', 'Neue Signale nur, wenn jünger als') + ' begründet im Journal "Neue Signale nur, wenn jünger als ' + m[1] + ' Handelstage – ein 40 Tage altes Signal hat den Großteil seiner Wirkung hinter sich"; das Buch eröffnet ein 3 Tage altes Signal - die Messung kauft nur zur Eröffnung des Einstiegstags, die "Wirkung" nach Tagen ist nicht gemessen'
        : 'Journalbegründung passt zum Einstieg der Messung');
    } },

    /* ------------------------------------------------------------------ T13 */
    { nr: 'T13', titel: 'Kopfkommentare drift.js / mfdepot.js gegen die Messung (Regel D2)', lauf: async function () {
      var M = messUrteil();
      var dr = block(lies('drift.js'), '/* =', '*/', 'drift.js'), mf = block(lies('mfdepot.js'), '/* =', '*/', 'mfdepot.js');
      var teile = [];
      if (/\+10,44 % p\. a\.\s+t = 3,04/.test(dr)) teile.push('drift.js:17 "+10,44 % p. a. t = 3,04" als GEMESSEN');
      if (/BEIDE Beine/.test(dr)) teile.push('drift.js:30 "Es braucht BEIDE Beine" (gemessen ist nur die Kaufseite, B − M t ' + de2(M.h60.t.BM) + ')');
      if (/t = 1,7-2,0/.test(mf)) teile.push('mfdepot.js:13 "t = 1,7-2,0: nicht entscheidbar" (Nr. 88: A t ' + de2(M.h60.t.A) + ', B netto t ' + de2(M.h60.t.Bnetto) + ')');
      Z.zeile(teile.length > 0, teile.length ? 'Kopfkommentare tragen überholte Belege: ' + teile.join('; ') : 'Kopfkommentare ohne überholte Zahlen');
    } },

    /* ------------------------------------------------------------------ T14 */
    { nr: 'T14', titel: 'wiki/belegstand.md Tabelle "Nicht entscheidbar": Zeile Ergebnis-Drift-Buch gegen den eigenen Abschnitt Nr. 88', lauf: async function () {
      var M = messUrteil();
      var w = lies('wiki/belegstand.md');
      muss(w, '## Ergebnis-Drift tagesgenau', 'wiki/belegstand.md');
      var z = /\n\| Ergebnis-Drift-Buch \| ([^|]*) \| ([^|]*) \|/.exec(w);
      if (!z) throw new Error('Testdefekt: Tabellenzeile Ergebnis-Drift-Buch fehlt');
      var nennt = z[1].indexOf(de2(M.h60.t.Bnetto)) !== -1 || z[2].indexOf('vorregistrierung-2026-10-04-ergebnis-drift') !== -1;
      Z.zeile(!nennt, !nennt
        ? zeileVon('wiki/belegstand.md', '| Ergebnis-Drift-Buch |') + ' sagt "' + z[1].trim() + '" mit Fundstelle "' + z[2].trim() + '" - der Abschnitt "Ergebnis-Drift tagesgenau" derselben Datei: A t ' +
          de2(M.h60.t.A) + ', B netto t ' + de2(M.h60.t.Bnetto) + ', Fundstelle ' + MESS
        : 'Tabellenzeile nennt die Messung Nr. 88');
    } }
  ];
};

if (require.main === module) {
  var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');
  var Z = { WURZEL: WURZEL, zeile: function (ab, text) { console.log((ab ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + text); } };
  var nur = process.argv[2];
  (async function () {
    var liste = module.exports(Z);
    for (var i = 0; i < liste.length; i++) {
      var t = liste[i];
      if (nur && t.nr !== nur) continue;
      process.stdout.write(t.nr + ' ' + t.titel + '\n  ');
      try { await t.lauf(); } catch (e) { console.log('TESTDEFEKT: ' + (e && e.stack || e)); process.exitCode = 1; }
    }
  })();
}
