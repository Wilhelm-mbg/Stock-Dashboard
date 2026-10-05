'use strict';
/* ================= Mittelfrist-Depot: Verdrahtung =================
 *
 * Führt die zwei Mittelfrist-Strategien als echte (virtuelle) Bücher:
 *   MOMENTUM   stärkstes Zehntel, Rebalancing alle 63 Handelstage, 20 Bp je Seite
 *   DRIFT      Ergebnis-Drift, 60 Handelstage je Position, long UND short, 10 Bp
 *
 * ACHTUNG, Stand 25.08.2026: Hier stand "die zwei BELEGTEN Mittelfrist-Strategien".
 * Das stimmt nicht mehr und stimmte seit dem 24.08. nicht. Momentum ist an B10
 * gestorben (Newey-West ueber 63 ueberlappende Kerzen: t 4,74 -> 0,74, Urteil "nicht
 * entscheidbar, alle vier Varianten", siehe studien/messmaschine/ERGEBNIS-2026-08-24-
 * momentum.md). Die Ergebnis-Drift weist strategien.js selbst als "im zurueckgehaltenen
 * Zeitraum t = 1,7-2,0: nicht entscheidbar" aus.
 * Beide sind NICHT WIDERLEGT, aber UNBELEGT. Die Buecher laufen weiter - sie sind
 * Simulation und sammeln Vorwaertsdaten; nur ist das kein Beleg, und dieser Kommentar
 * darf nicht wieder einen behaupten (Regel D2: der Beleg steht im Protokoll, nie im Code).
 *
 * Die Schalter im Strategien-Tab (D.momentumAn / D.driftAn) bekommen hiermit erstmals
 * Wirkung: An heißt, das Buch handelt selbsttätig. Aus heißt, es wird nur gerechnet
 * und erinnert („Rebalancing fällig“), gehandelt wird nichts.
 *
 * Die Logik steht in mfhandel.js (rein, in Node getestet) — hier nur Laden, Takt,
 * Anzeige. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
(function () {
  var U = window.U;
  var LAEUFT = false;
  /* Gleiches Startkapital wie das Intraday-Depot (depot.js, START_CAPITAL).
   * Zwei verschiedene Startkapitalien in einer Anwendung waeren genau die Art
   * Doppelzahl, die hier schon mehrfach zu falschen Prozentangaben gefuehrt hat. */
  var START_KAPITAL = 100000;

  function D() { return window.__D ? window.__D() : null; }
  function speichern() { if (window.__save) window.__save(); }
  function el(id) { return document.getElementById(id); }

  /* ---------------- Daten ---------------- */
  async function ladeKurse() {
    // Liest ueber den Teile-Speicher des Mittelfrist-Tabs (ein Lader, eine Wahrheit)
    var g = window.MF && window.MF.tagesdatenLesen ? await window.MF.tagesdatenLesen() : await window.api.storeGet('mf_tagesdaten');
    if (!g || !g.roh) return null;
    /* barZeit: je Wert der Zeitstempel des Balkens, aus dem der Kurs stammt. Die Buchung
     * der Splits und Ausschuettungen (MFHandel.bucheMassnahmen, Auftrag Nr. 87) haengt daran:
     * gebucht wird ein Ereignis erst, wenn der gespeicherte Kurs den Ex-Tag schon enthaelt. */
    var preise = {}, juengster = 0, barZeit = {};
    Object.keys(g.roh).forEach(function (s) {
      var r = g.roh[s];
      if (r && r.length) { preise[s] = r[r.length - 1][1]; barZeit[s] = r[r.length - 1][0]; if (r[r.length - 1][0] > juengster) juengster = r[r.length - 1][0]; }
    });
    /* Die Ereignisse aus demselben Abruf (Bestand mf_ereignisse, mittelfrist.js schreibt ihn
     * vor dem Index der Tagesdaten). Fehlt er - vor dem ersten Laden nach dem Update -,
     * wird nichts gebucht. */
    var er = await window.api.storeGet('mf_ereignisse');
    /* Auftrag Nr. 93: SPY aus DEMSELBEN Bestand (mf_bezug, gleicher Stand at) - an ihr zaehlen
     * Faelligkeit (A6) und Reihenende (A2), aus ihr kommt der Marktstand des Tagespunkts (A5).
     * spalte4: traegt der Bestand die vierte Spalte (adjclose)? Ohne sie und ohne SPY ist er von
     * vor Nr. 93 und wird einmal neu geladen. preise ist Spalte 1 (close, ohne Ausschuettungen). */
    var spalte4 = Object.keys(g.roh).some(function (s) { var r = g.roh[s]; return r && r.length && r[r.length - 1].length >= 4; });
    return { roh: g.roh, preise: preise, stand: g.at || 0, juengster: juengster, barZeit: barZeit, ereignisse: (er && er.sym) || null,
      bezug: g.bezug && g.bezug.reihe && g.bezug.reihe.length ? g.bezug.reihe : null, spalte4: spalte4 };
  }
  /* Die BEREINIGTE SPY-Reihe (Bestand drift_markt, geschrieben von driftui.js), wie
   * der letzte Lesevorgang sie fand. Seit Auftrag Nr. 81 ist sie der Markt des
   * Massstabs fuer ALLE drei Buecher: vergleich() unten reicht sie an massstab.js,
   * depot.js holt sie fuer das Intraday-Depot ueber MFDepot.markt(). Gelesen wird beim
   * Start und bei jedem Takt; gezeichnet wird synchron aus diesem Merker.
   * Seit Auftrag Nr. 91 fuehrt der Merker beide Reihen desselben Abrufs: MARKT (bereinigt)
   * und MARKT_ROH (unbereinigt, dieselben Balken). Aus beiden rechnet massstab.js den
   * Faktor der Ausschuettungen je Balken; der Marktstand selbst kommt aus dem Punkt. */
  var MARKT = null;
  var MARKT_ROH = null;
  async function ladeMarkt() {
    var c = await window.api.storeGet('drift_markt');
    MARKT = c && c.reihe ? c.reihe : null;
    MARKT_ROH = MARKT && c.roh ? c.roh : null;
    return MARKT;
  }

  /* Kurse frisch halten: älter als 26 Stunden -> den Lader des Mittelfrist-Tabs
   * anstoßen. Ohne das markiert das Depot auf eingefrorenen Kursen - und ein
   * eingefrorener Wert sieht im fallenden Markt fälschlich stabil aus. */
  var ladeAngestossen = 0;
  /* Seit Auftrag Nr. 93 (A4) frisch GEGEN DIE UHR: geladen nach dem Schluss (16:15 New York)
   * des juengsten Werktags, dessen Schluss feststehen muss (MFHandel.bestandFrisch) - nicht
   * "juenger als 26 Stunden". Ein Bestand vom Vormittag traegt den Schluss des Tages nicht. */
  function bestandFrisch(stand) {
    var MH = window.MFHandel;
    return MH && MH.bestandFrisch ? MH.bestandFrisch(stand, Date.now()) : Date.now() - stand < 26 * 3600000;
  }
  function kurseFrischHalten(stand) {
    if (bestandFrisch(stand)) return;
    nachladen();
  }
  /** Den Lader anstossen - hoechstens einmal je Stunde (mittelfrist.js sperrt nach einem
   *  unvollstaendigen Abruf selbst eine Stunde, A1). */
  function nachladen() {
    if (Date.now() - ladeAngestossen < 3600000) return;
    ladeAngestossen = Date.now();
    if (window.MF && window.MF.ladeUniversum) window.MF.ladeUniversum();
  }

  /* ---------------- Bücher ---------------- */
  function buchInit(name) {
    var b = { name: name, start: START_KAPITAL, cash: START_KAPITAL, positionen: [], trades: [],
      angelegt: Date.now(), letztesRebalanceT: 0 };
    /* Ein NEUES Momentum-Buch startet gleich mit der gemessenen Konfiguration - eine
     * "Umstellung" gibt es nur fuer Buecher, die schon vorher liefen. */
    if (name === 'momentum' && window.MFHandel && window.MFHandel.buchKonfig) {
      b.konfig = window.MFHandel.buchKonfig(); b.konfigSeit = b.angelegt; b.liquideSeit = null; b.korbVerlauf = [];
    }
    return b;
  }

  /* ---- Buch = Messung (Wilhelms Entscheid 02.09.2026) ----
   * Die Konfiguration des Momentum-Buchs kommt aus momentum.js + liquide.js
   * (MFHandel.buchKonfig). Das Buch merkt sich, womit es rechnet; weicht die gemerkte
   * Konfiguration von der gelesenen ab - beim ersten Takt nach dem Update fehlt sie
   * ganz -, ist das eine HANDLUNG und bekommt eine Journalzeile mit alter und neuer
   * Konfiguration. Gehandelt wird dabei NICHTS: die neue Regel greift bei der naechsten
   * regulaeren Umschichtung; Positionen ausserhalb des liquiden Korbs werden dort
   * verkauft, nicht sofort. */
  var KONFIG_FELDER = ['rueckblick', 'luecke', 'halten', 'anteil', 'mindestWerte', 'umsatzMin', 'umsatzFenster', 'kleinstAnteil'];
  /* Regel K (Feld kleinstAnteil, Auftrag Nr. 87): ein Buch, das sich seine Konfiguration vor
   * Nr. 87 gemerkt hat, traegt das Feld nicht - das heisst AUS, also 0. */
  function kleinstWert(k) { return k && k.kleinstAnteil > 0 ? k.kleinstAnteil : 0; }
  function feldGleich(a, b, k) { return k === 'kleinstAnteil' ? kleinstWert(a) === kleinstWert(b) : a[k] === b[k]; }
  function konfigGleich(a, b) {
    if (!a || !b) return false;
    return KONFIG_FELDER.every(function (k) { return feldGleich(a, b, k); });
  }
  function kleinstText(k) {
    var w = kleinstWert(k);
    return w > 0 ? 'Regel K gegen Kleinstpositionen an (unter ' + String(Math.round(w * 1000) / 10).replace('.', ',') + ' % des Platzwerts kein Kauf, kein gehaltener Bestand)'
      : 'Regel K gegen Kleinstpositionen aus';
  }
  function konfigText(k) {
    return 'Rückblick ' + k.rueckblick + ', Lücke ' + k.luecke + ', Halten ' + k.halten + ' Handelstage, stärkste ' +
      Math.round(k.anteil * 100) + ' %, mindestens ' + k.mindestWerte + ' zulässige Werte, Korb nur Median-Tagesumsatz ≥ ' +
      Math.round(k.umsatzMin / 1e6) + ' Mio $ (Schluss × Stück über ' + k.umsatzFenster + ' Balken bis zum Stichtag, Punkt-in-Zeit, vor der Rangbildung), ' +
      kleinstText(k);
  }
  function umstellungPruefen(d, KONFIG, now) {
    if (konfigGleich(d.mfBuch.konfig, KONFIG)) return false;
    if (!d.tuneLog) d.tuneLog = [];
    /* NUR Regel K hat sich geaendert (Auftrag Nr. 87): eigene Journalzeile, und der Beginn des
     * Vorwaertstests bleibt stehen. Der Korb ist derselbe - liquideSeit und korbVerlauf
     * zurueckzusetzen hiesse, den Vorwaertstest neu zu beginnen, obwohl sich an Korb und
     * Rangfolge nichts geaendert hat. Jede andere Abweichung laeuft weiter unten wie bisher. */
    var andere = !d.mfBuch.konfig ? ['alle'] : KONFIG_FELDER.filter(function (k) {
      return k !== 'kleinstAnteil' && !feldGleich(d.mfBuch.konfig, KONFIG, k);
    });
    if (!andere.length) {
      var altK = kleinstWert(d.mfBuch.konfig), neuK = kleinstWert(KONFIG);
      var pz = String(Math.round(neuK * 1000) / 10).replace('.', ',');
      /* Auftrag Nr. 95 (C5): die Stufe in Worten („aus" / „5 % des Platzwerts"), nicht der
       * Feldname kleinstAnteil mit „0 (aus) → 0,05". */
      var stufe = function (x) { return x > 0 ? String(Math.round(x * 1000) / 10).replace('.', ',') + ' % des Platzwerts' : 'aus'; };
      d.tuneLog.unshift({ id: 'mfkonfig-' + now, at: now, quelle: 'umstellung',
        applied: ['Momentum-Buch: Regel K gegen Kleinstpositionen ' + (neuK > 0 ? 'eingeschaltet' : 'ausgeschaltet') +
          ' (' + stufe(altK) + ' → ' + stufe(neuK) + ')'],
        txt: 'Geändert hat sich eine Einstellung: Regel K gegen Kleinstpositionen, alt ' + stufe(altK) + ' → neu ' + stufe(neuK) + '. ' +
          (neuK > 0
            ? 'Die Regel: ein Kauf, der mangels Bargeld unter ' + pz + ' % des Platzwerts (Depotwert / Zahl der Zielwerte) fiele, wird nicht ' +
              'ausgeführt; ein Bestand unter dieser Grenze gilt nicht als gehalten – er wird verkauft und, wenn der Wert Ziel ist, voll neu gekauft. '
            : 'Ohne die Regel werden Käufe wieder bis auf 0,0001 Stück verkleinert, und ein solcher Rest gilt als gehalten. ') +
          'Greift ab der nächsten regulären Umschichtung; bis dahin wird nichts gehandelt. Korb, Rangfolge und der Beginn des ' +
          'Vorwärtstests bleiben, wie sie sind. Simulation mit virtuellem Kapital, keine Anlageberatung.' });
      d.mfBuch.konfig = KONFIG;
      d.mfBuch.kleinstSeit = now;
      return true;
    }
    var altTxt = d.mfBuch.konfig ? konfigText(d.mfBuch.konfig)
      : 'Rückblick 231, Lücke 21, Halten 63 Handelstage, stärkste 10 %, mindestens 25 Werte, KEIN Umsatzfilter (breiter Korb, alle geladenen Werte)';
    d.tuneLog.unshift({ id: 'mfkonfig-' + now, at: now, quelle: 'umstellung',
      applied: ['Momentum-Buch: Konfiguration → gemessene liquide Fassung (Studie 02.09.2026)'],
      txt: 'Alt: ' + altTxt + '. Neu: ' + konfigText(KONFIG) + '. Greift bei der nächsten regulären Umschichtung; ' +
        'Positionen außerhalb des liquiden Korbs werden dort verkauft, nicht sofort. Ab der ersten Umschichtung auf dem ' +
        'liquiden Korb ist jede weitere eine Out-of-Sample-Beobachtung – für sich kein Beleg. Simulation mit virtuellem Kapital, keine Anlageberatung.' });
    d.mfBuch.konfig = KONFIG;
    d.mfBuch.konfigSeit = now;
    d.mfBuch.liquideSeit = null;
    d.mfBuch.korbVerlauf = [];
    return true;
  }

  /* ---- Splits und Ausschuettungen buchen (Auftrag Nr. 87) ----
   * Fuer BEIDE Buecher, unabhaengig von den Schaltern momentumAn / driftAn: eine
   * Kapitalmassnahme ist Buchfuehrung, keine Handelsentscheidung. Gerechnet wird in
   * MFHandel.bucheMassnahmen (rein, in Node getestet); hier nur der Aufruf und je Takt und
   * Buch hoechstens EINE Journalzeile - nur, wenn gebucht (oder ein Split neu gesperrt)
   * wurde. Rueckgabe: true, wenn gespeichert werden muss. */
  /* Runde 2 (Nr. 108, M7, Test 27): ein Bestand, der WAEHREND der Sitzung des Ex-Tags eines Splits geladen wurde,
   * traegt den Balken des Ex-Tags nicht (laufender Balken, abgeschnitten), aber die Vergangenheit kommt aus
   * demselben Abruf schon geteilt, und das Split-Ereignis mit dem Stempel des Ex-Tags steht im Bestand. Ohne
   * Buchung stand Stueck (alt) gegen Kurs (geteilt): der Tagespunkt hielt den halben Wert fest. Solche Splits
   * (Ex-Tag = New-Yorker Tag des Ladevorgangs, nach dem juengsten Balken, nicht nach dem Laden) werden VOR den
   * uebrigen Massnahmen gebucht - nur Splits (Regel 3/5), Ausschuettungen weiter erst mit dem Balken des Ex-Tags
   * (REGEL Teil C.3). Kennung 'split:' + t wie immer: der Abend bucht ihn nicht noch einmal.
   * Rueckgabe { SYM: Ex-Tag-Stempel } oder null. */
  function splitsDesLadetags(MH, daten) {
    var er = daten.ereignisse, stand = daten.stand, aus = null;
    if (!er || !(stand > 0)) return null;
    var tagStand = MH.nyTag(stand);
    Object.keys(er).forEach(function (s) {
      var bz = (daten.barZeit || {})[s];
      ((er[s] && er[s].split) || []).forEach(function (x) {
        if (x[0] > (bz || 0) && x[0] <= stand && MH.nyTag(x[0]) === tagStand) { if (!aus) aus = {}; aus[s] = Math.max(aus[s] || 0, x[0]); }
      });
    });
    return aus;
  }
  function massnahmenBuchen(MH, d, daten, now) {
    var geaendert = false, ladetag = splitsDesLadetags(MH, daten);
    [['momentum', d.mfBuch], ['drift', d.driftBuch]].forEach(function (x) {
      if (!x[1]) return;
      var vor = ladetag ? MH.bucheMassnahmen(x[1], daten.ereignisse, ladetag, now, { nurSplits: true }) : null;
      var res = MH.bucheMassnahmen(x[1], daten.ereignisse, daten.barZeit, now);
      if (vor) { res.buchungen = vor.buchungen.concat(res.buchungen); res.gesperrt = vor.gesperrt.concat(res.gesperrt); }
      var zeile = MH.massnahmenJournal(x[0], res, now);
      if (!zeile) return;
      if (!d.tuneLog) d.tuneLog = [];
      d.tuneLog.unshift({ id: 'mfmass-' + x[0] + '-' + now, at: now, quelle: 'automatik', applied: zeile.applied, txt: zeile.txt });
      geaendert = true;
    });
    return geaendert;
  }

  /* ================= Live gleich Messung (Auftrag Nr. 93, 04.10.2026) =================
   * Die reinen Regeln stehen in mfhandel.js (Uhr in New York, Faelligkeit, Reihenende,
   * Schluesse eines Tages); hier nur, was Bestand, Netz und Journal braucht. */

  /** A2 - Reihenende in beiden Buechern buchen, je ausgebuchter Position eine Journalzeile.
   *  Wie die Kapitalmassnahmen unabhaengig von den Schaltern: die Messung bucht eine
   *  verschwundene Reihe aus, ohne zu fragen. Rueckgabe: true, wenn gespeichert werden muss. */
  function reihenendeBuchen(MH, d, daten, now) {
    var geaendert = false;
    [['momentum', d.mfBuch], ['drift', d.driftBuch]].forEach(function (x) {
      if (!x[1]) return;
      MH.reihenendeAusbuchen(x[1], daten.roh, daten.bezug, now).forEach(function (r) {
        var z = MH.reihenendeJournal(x[0], r);
        if (!d.tuneLog) d.tuneLog = [];
        d.tuneLog.unshift({ id: 'mfende-' + x[0] + '-' + r.sym + '-' + now, at: now, quelle: 'automatik', applied: z.applied, txt: z.txt });
        geaendert = true;
      });
    });
    return geaendert;
  }

  /** A5 - der Tagespunkt des Verlaufs: EIN Punkt je abgeschlossenem Handelstag X (Schluessel:
   *  das New-Yorker Datum X, nicht der UTC-Tag des Takts), geschrieben, sobald der Bestand X
   *  enthaelt. Buch zu den Schluessen von X (ohne X-Balken: der letzte Schluss davor), spy =
   *  Schluss von SPY an X aus DEMSELBEN Bestand, spyT = buchT = Stempel dieses Balkens. Die Regel
   *  von Nr. 91 (Marktwert = spy × f) bleibt; sie bekommt jetzt gleich alte Werte.
   *  Bestehende Punkte bleiben, wie sie sind (ein alter Punkt ohne tag gilt fuer seinen
   *  New-Yorker Schreibtag). Hat das Momentum-Buch NACH X umgeschichtet, laesst sich sein Stand
   *  an X nicht mehr bilden - dann kein Punkt fuer X. Aufgerufen VOR jedem Handel des Takts.
   *  Rueckgabe: der neue Punkt oder null. */
  function tagespunkt(MH, d, daten, now) {
    var x = MH.punktTag(daten.bezug, now);
    if (!x) return null;
    if (!d.mfVerlauf) d.mfVerlauf = [];
    var v = d.mfVerlauf, lp = v.length ? v[v.length - 1] : null;
    var lpTag = lp ? (lp.tag || MH.nyTag(lp.t)) : null;
    if (lpTag && x.tag <= lpTag) return null;
    if (d.mfBuch && d.mfBuch.letzteAusfuehrungTag && d.mfBuch.letzteAusfuehrungTag > x.tag) return null;
    var s = MH.schluesseAm(daten.roh, x.tag);
    /* Bargeld an X: eine Ausschuettung mit Ex-Tag NACH X ist schon gebucht, der Schluss von X
     * enthaelt sie noch - sie gehoert nicht in den Wert von X (MFHandel.bargeldAm). */
    var bwM = d.mfBuch ? MH.bewerte({ cash: MH.bargeldAm(d.mfBuch, x.t), positionen: d.mfBuch.positionen }, s.preise) : null;
    var bwD = d.driftBuch ? MH.bewerteDrift({ cash: MH.bargeldAm(d.driftBuch, x.t), positionen: d.driftBuch.positionen }, s.preise) : null;
    /* Startkapital MITSCHREIBEN, nicht spaeter erraten: Das Cockpit rechnete den
     * Prozentstand frueher gegen eine fest verdrahtete 10000 und zeigte fuer ein
     * unberuehrtes Buch +900 %. Steht der Bezugswert im Punkt selbst, bleibt auch
     * ein alter Verlauf nach einer spaeteren Kapitalaenderung richtig lesbar. */
    var p = { t: x.t, tag: x.tag, momentum: bwM ? bwM.wert : null, drift: bwD ? bwD.wert : null, spy: x.kurs, spyT: x.t, buchT: x.t,
      startM: d.mfBuch ? d.mfBuch.start : START_KAPITAL, startD: d.driftBuch ? d.driftBuch.start : null };
    v.push(p);
    if (v.length > 750) d.mfVerlauf = v.slice(-750);
    return p;
  }

  /** A4 - Fuellkurs: die Eroeffnung des Tagesbalkens vom Ausfuehrungstag (heute, New York),
   *  ein kleiner Abruf je Wert. Ohne Eroeffnung null - nie der Schluss, nie der laufende Kurs
   *  (offenRoh: fehlt sie, faellt sie nicht still auf den Schluss).
   *  Generalprobe 23.11., Fund 1: derselbe Abruf bringt die Kapitalmassnahmen des Tages mit (f.ereignisse
   *  = { div, split }, Fenster ab Mitternacht New York) - splitsHeuteBuchen bucht die Splits vor dem Handel. */
  function fuellkurs(kd, von, bis) {
    var best = null;
    ((kd && kd.bars) || []).forEach(function (b) { if (b[0] >= von && b[0] < bis && b[5] > 0 && (!best || b[0] < best[0])) best = b; });
    return best ? { kurs: best[5], t: best[0] } : null;
  }
  async function eroeffnung(MH, sym, heute, now) {
    try {
      var von = MH.nyZeit(heute, 0, 0), bis = MH.nyZeit(MH.tagPlus(heute, 1), 0, 0);
      var kd = await window.Kurse.hole(sym, { von: von, bis: now, interval: '1d', bereinigt: false, offenRoh: true, ereignisse: true });
      var f = fuellkurs(kd, von, bis);
      if (f && kd.ereignisse) f.ereignisse = kd.ereignisse;
      return f;
    } catch (e) { return null; }
  }

  /** Generalprobe 23.11., Fund 1 (M-02, D-02, H-c2): Splits mit Ex-Tag = Ausfuehrungstag im Momentum-Buch buchen,
   *  BEVOR zur Eroeffnung dieses Tages geplant oder nachgefasst wird (MFHandel.splitsAmAusfuehrungstag) - sonst
   *  traefe die Eroeffnung in neuer Stueckelung auf die alte Stueckzahl. Eine Journalzeile wie massnahmenBuchen,
   *  nur wenn gebucht (oder ein Split neu gesperrt) wurde. Rueckgabe: true, wenn gespeichert werden muss. */
  function splitsHeuteBuchen(MH, d, ereignisse, barZeit, now) {
    var zeile = MH.massnahmenJournal('momentum', MH.splitsAmAusfuehrungstag(d.mfBuch, ereignisse, barZeit, now), now);
    if (!zeile) return false;
    if (!d.tuneLog) d.tuneLog = [];
    d.tuneLog.unshift({ id: 'mfmass-momentum-heute-' + now, at: now, quelle: 'automatik', applied: zeile.applied, txt: zeile.txt });
    return true;
  }

  /** A4 - darf HEUTE umgeschichtet werden, und zu welchen Kursen? Wie in der Messung: Rangfolge
   *  auf den Schluessen des Stichtags (letzter Handelstag vor heute), gehandelt zur Eroeffnung
   *  des Ausfuehrungstags (rueckblick.js Z. 181-192). Gilt fuer den Takt UND fuer den Knopf.
   *  Rueckgabe { ok, hinweis } - ok: dazu ziel (momentumZiel am Stichtag), preise (Eroeffnungen),
   *  barZeit (Stempel der Balken des Ausfuehrungstags), stichtag, heute. */
  async function ausfuehrungVorbereiten(MH, d, daten, fl, now) {
    var heute = MH.nyTag(now);
    if (!daten.bezug) { nachladen(); return { ok: false, hinweis: 'Marktreihe (SPY) fehlt im Bestand – Nachladen angestoßen; nicht umgeschichtet.' }; }
    if (fl.veraltet) { nachladen(); return { ok: false, hinweis: 'Marktreihe veraltet seit ' + MH.datumDe(fl.letzterMarktTag) + ' – Nachladen angestoßen; nicht umgeschichtet.' }; }
    if (!MH.istWerktag(heute)) return { ok: false, hinweis: 'Umschichtung fällig – am nächsten Handelstag nach Börsenöffnung (heute kein Handelstag).' };
    if (now < MH.nyZeit(heute, MH.HANDEL_AB[0], MH.HANDEL_AB[1])) return { ok: false, hinweis: 'Umschichtung heute nach Börsenöffnung' };
    var st = MH.stichtagPruefen(daten.roh, daten.bezug, daten.stand, heute);
    if (!st.ok) { nachladen(); return { ok: false, hinweis: 'Umschichtung fällig, aber Tageskurse nicht frisch genug (' + st.grund + ') – Nachladen angestoßen; kein Handel.' }; }
    /* Runde 2 (Nr. 108, M9): Zeitstempel des Tages wie die Messung (REGEL Teil C.2) - MH.zielAmStichtag, momentumZiel unveraendert. */
    var ziel = MH.zielAmStichtag(daten.roh, st.stichtag);
    if (ziel.zuWenig) return { ok: false, hinweis: 'Umschichtung fällig, aber am Stichtag ' + MH.datumDe(st.stichtag) + ' unter ' + MH.buchKonfig().mindestWerte + ' zulässigen Werten – kein Korb; neuer Versuch beim nächsten Takt.' };
    /* Heute ein Handelstag? Das sagt der Balken von SPY mit heutigem Datum - einen Kalender
     * fuehrt die App nicht. Erst SPY, dann die Werte: an einem Feiertag bleibt es bei einem Abruf. */
    var spyF = await eroeffnung(MH, 'SPY', heute, now);
    if (!spyF) return { ok: false, hinweis: 'Umschichtung fällig, aber für SPY gibt es keinen Tagesbalken vom ' + MH.datumDe(heute) + ' – heute kein Handelstag (oder die Quelle antwortet nicht); kein Handel.' };
    var syms = ziel.ziel.slice();
    (d.mfBuch.positionen || []).forEach(function (p) { if (syms.indexOf(p.sym) < 0) syms.push(p.sym); });
    var preise = {}, barZeit = {}, ereignisse = {};
    for (var i = 0; i < syms.length; i++) {
      var f = await eroeffnung(MH, syms[i], heute, now);
      if (f) { preise[syms[i]] = f.kurs; barZeit[syms[i]] = f.t; if (f.ereignisse) ereignisse[syms[i]] = f.ereignisse; }
      await new Promise(function (w) { setTimeout(w, 90); });   // Tempo wie der Lader
    }
    /* Generalprobe 23.11., Fund 7 (D-08): ausser SPY hat kein Ziel und keine Position eine Eroeffnung - das ist die Quelle,
     * nicht der Markt (im Panel hat ein Ausfuehrungstag Zeilen). Nicht umgeschichtet, nichts gemerkt; neuer Versuch wie bei zuWenig. */
    if (!Object.keys(preise).length) return { ok: false, hinweis: 'Umschichtung fällig, aber außer SPY hat um ' + MH.nyUhr(now) + ' New York kein Wert eine Eröffnung vom ' +
      MH.datumDe(heute) + ' (die Quelle antwortet nicht) – nicht umgeschichtet; neuer Versuch beim nächsten Takt.' };
    /* Generalprobe 23.11., Fund 2 (D-04, D-05, H-b2): fehlt einer gehaltenen, handelnden Position die Eroeffnung noch,
     * waere der Platzwert zu klein. Bis 16:00 New York warten (gehandelt wird ohnehin zur Eroeffnung dieses Tages). */
    var warten = MH.eroeffnungAbwarten(d.mfBuch.positionen, preise, daten.roh, st.stichtag, now);
    if (warten.length) return { ok: false, hinweis: 'Umschichtung fällig, aber um ' + MH.nyUhr(now) + ' New York fehlt noch die Eröffnung gehaltener Werte (' +
      warten.slice(0, 6).join(', ') + (warten.length > 6 ? ' …' : '') + ') – nichts gehandelt; neuer Versuch beim nächsten Takt, gehandelt wird zur Eröffnung dieses Tages.' };
    return { ok: true, ziel: ziel, preise: preise, barZeit: barZeit, ereignisse: ereignisse, stichtag: st.stichtag, heute: heute };
  }

  /** Auftrag Nr. 94 - die offenen Auftraege der Umschichtung von heute (d.mfBuch.offen, Regeln in
   *  mfhandel.js): bis 16:00 New York holt jeder Takt fuer sie die Eroeffnung DIESES Tages - mit derselben
   *  Funktion eroeffnung, nie ein spaeterer Kurs - und fuehrt aus, was jetzt einen Kurs hat (erst Verkaeufe,
   *  dann Kaeufe nach rang, Kosten und Regel K wie bei der Umschichtung). Danach, oder an einem spaeteren Tag,
   *  wird offen geloescht und eine Zeile nennt die liegen gebliebenen. Nachgefasst wird nur, solange das Buch
   *  selbst handelt (Schalter "handelt selbst"); beendet wird immer. Rueckgabe: true, wenn gespeichert werden muss. */
  async function offenNachfassen(MH, d, now, kleinstAnteil) {
    var b = d.mfBuch, o = b && b.offen;
    if (!o) return false;
    if (!d.tuneLog) d.tuneLog = [];
    var ende = MH.offenBeenden(b, now);
    if (ende) {
      var zE = MH.offenEndeJournal(ende, now);
      d.tuneLog.unshift({ id: 'mfoffen-ende-' + now, at: now, quelle: 'automatik', applied: zE.applied, txt: zE.txt });
      return true;
    }
    if (!d.momentumAn) return false;
    var syms = MH.offenWerte(o), preise = {}, barZeit = {}, ereignisse = {};
    for (var i = 0; i < syms.length; i++) {
      var f = await eroeffnung(MH, syms[i], o.tag, now);
      if (f) { preise[syms[i]] = f.kurs; barZeit[syms[i]] = f.t; if (f.ereignisse) ereignisse[syms[i]] = f.ereignisse; }
      await new Promise(function (w) { setTimeout(w, 90); });   // Tempo wie der Lader
    }
    var split = splitsHeuteBuchen(MH, d, ereignisse, barZeit, now);   // Generalprobe 23.11., Fund 1: vor dem Verkauf zur Eroeffnung
    var vorher = (b.positionen || []).slice();
    var res = MH.nachfassen(b, preise, barZeit, now, 20, { kleinstAnteil: kleinstAnteil });   // 20 Bp je Seite wie die Umschichtung
    MH.anspruecheVormerken(b, vorher, barZeit, now);                  // Generalprobe 23.11., Fund 5: Anspruch der verkauften (REGEL C.3)
    var z = MH.nachfassenJournal(res, now);
    if (z) d.tuneLog.unshift({ id: 'mfnach-' + now, at: now, quelle: 'automatik', applied: z.applied, txt: z.txt });
    /* Auftrag Nr. 95 (B4): ein Kauf, der seine Eroeffnung hatte und am Bargeld scheiterte, traegt
     * das fuer die Zeile am Ende (offenEndeJournal nennt die Kaeufe nach Grund). Nur ein Merker
     * fuer den Text - nachfassen() liest ihn nicht; gespeichert wird, damit er einen Neustart
     * uebersteht. */
    var neuMerker = false;
    if (b.offen && res.wartet.length) {
      b.offen.kaeufe.forEach(function (k) { if (res.wartet.indexOf(k.sym) >= 0 && !k.bargeld) { k.bargeld = true; neuMerker = true; } });
    }
    return res.geaendert || neuMerker || split;
  }

  async function takt(manuell) {
    if (LAEUFT) return;
    var d = D();
    if (!d) return;
    LAEUFT = true;
    try {
      var daten = await ladeKurse();
      var markt = await ladeMarkt();
      /* Generalprobe 23.11., Fund D-09: das Momentum-Buch rechnet seit Nr. 93 auf den Tagesdaten
       * und ihrer SPY-Reihe (mf_bezug); drift_markt brauchen nur das Drift-Buch und der Massstab.
       * Fehlt drift_markt, laeuft das Momentum-Buch weiter, das Drift-Buch setzt aus (unten).
       * Ohne beide Marktreihen (Bestand von vor Nr. 93 und kein drift_markt) bleibt es beim Halt. */
      if (!daten || (!markt && !daten.bezug)) {
        /* Erststart-Luecke aus der ersten externen Diagnose (mfBuchWert: null): Frische
         * Installationen haben keine Tagesdaten, und der Erstladevorgang von 193 Werten
         * wartete auf einen Knopfdruck, von dem niemand wusste. Jetzt stoesst er sich
         * selbst an - hoechstens einmal je Stunde, mit sichtbarem Status. */
        if (window.MF && window.MF.ladeUniversum && Date.now() - ladeAngestossen > 3600000) {
          ladeAngestossen = Date.now();
          zeige(null, null, null, 'Erster Start: Tageskurse für 193 Werte werden geladen (einmalig, ein paar Minuten) …');
          try { await window.MF.ladeUniversum(); } catch (eL) { }
          daten = await ladeKurse();
          markt = markt || await ladeMarkt();
        }
        /* Der Verweis zeigte auf die Pille, auf der dieser Text selbst steht. Genannt
           wird deshalb der Knopf, der die Daten wirklich holt - wörtlich so, wie er
           beschriftet ist (#mfLadenBtn, gleiches Pillen-Panel, weiter oben). */
        if (!daten || (!markt && !daten.bezug)) { zeige(null, null, null, 'Keine Tagesdaten – erst oben „Daten holen und rechnen“.'); return; }
      }
      kurseFrischHalten(daten.stand);
      /* Bestand von vor Auftrag Nr. 87: Tagesdaten da, aber kein Schluessel mf_ereignisse. Der
       * Lader erkennt das und laedt einmalig neu - er muss nur angestossen werden, hoechstens
       * einmal je Stunde. Bis dahin wird nichts gebucht (ohne Ereignisse geschieht nichts). */
      if (!daten.ereignisse && window.MF && window.MF.ladeUniversum && Date.now() - ladeAngestossen > 3600000) {
        ladeAngestossen = Date.now();
        window.MF.ladeUniversum();
      }
      /* Ebenso ein Bestand von vor Auftrag Nr. 93: ohne vierte Spalte oder ohne SPY. */
      if (!daten.bezug || !daten.spalte4) nachladen();
      var MH = window.MFHandel, Dr = window.Drift;
      var now = Date.now();

      /* ---- Momentum-Buch ---- */
      if (!d.mfBuch) d.mfBuch = buchInit('momentum');
      var KONFIG = MH.buchKonfig();
      if (umstellungPruefen(d, KONFIG, now)) speichern();
      /* Splits und Ausschuettungen: nach dem Laden, VOR dem Planen, fuer beide Buecher -
       * der Plan soll die Stueckzahl nach dem Split und das Bargeld nach der Gutschrift sehen. */
      if (massnahmenBuchen(MH, d, daten, now)) speichern();
      /* A6: gemerkt wird der AUSFUEHRUNGSTAG (New York, 'JJJJ-MM-TT'), nicht die Uhrzeit. Fuer ein
       * Buch von vor Nr. 93 ist es der New-Yorker Tag von letztesRebalanceT (laufendes Buch:
       * 25.08.2026); letztesRebalanceT bleibt als Zeitstempel daneben stehen. */
      if (!d.mfBuch.letzteAusfuehrungTag && d.mfBuch.letztesRebalanceT) { d.mfBuch.letzteAusfuehrungTag = MH.nyTag(d.mfBuch.letztesRebalanceT); speichern(); }
      /* Gezaehlt an der SPY-Reihe AUS DEMSELBEN BESTAND. Ist sie mehr als drei Werktage hinter der
       * Uhr, gibt es kein "nicht faellig": faellig ist dann null, die Karte sagt es, der Takt laedt nach. */
      var fl = MH.faelligkeit(daten.bezug, d.mfBuch.letzteAusfuehrungTag, KONFIG.halten, now);
      var hinweisM = null;
      if (!daten.bezug) hinweisM = 'Marktreihe (SPY) fehlt im Bestand – Nachladen angestoßen; ob die Umschichtung fällig ist, ist offen.';
      else if (fl.veraltet) { nachladen(); hinweisM = 'Marktreihe veraltet seit ' + MH.datumDe(fl.letzterMarktTag) + ' – Nachladen angestoßen; ob die Umschichtung fällig ist, ist offen.'; }
      /* A2: Reihenende in beiden Buechern - nur mit einer Marktreihe, die nicht veraltet ist. */
      if (daten.bezug && !fl.veraltet && reihenendeBuchen(MH, d, daten, now)) speichern();
      /* A5: der Tagespunkt - VOR jedem Handel dieses Takts (sein Buch ist das Buch am Schluss von X).
       * Generalprobe 23.11., Fund D-03: ist X heute (Takt nach 16:15) und wird heute zur Eroeffnung
       * umgeschichtet, gehoert in den Punkt das Buch NACH diesem Handel - er wird dann erst nach dem
       * Handelsblock geschrieben; kommt der Handel in diesem Takt nicht zustande, schreibt ihn ein
       * spaeterer Takt. */
      var punktNachHandel = !!daten.bezug && ((fl.faellig === true && d.momentumAn) || manuell === 'momentum') &&
        (MH.punktTag(daten.bezug, now) || {}).tag === MH.nyTag(now);
      if (daten.bezug && !punktNachHandel && tagespunkt(MH, d, daten, now)) speichern();
      /* Nr. 94: offene Auftraege der Umschichtung von heute zur Eroeffnung dieses Tages nachfassen - oder beenden. */
      if (d.mfBuch.offen && await offenNachfassen(MH, d, now, KONFIG.kleinstAnteil)) speichern();
      var faellig = fl.faellig === true;
      var ziel = MH.momentumZiel(daten.roh, { nowMs: daten.juengster || now });
      /* Gespeicherte Tagesdaten ohne Stueckzahlen (Bestand von vor dem Korbfilter): der
       * Lader des Mittelfrist-Tabs erkennt das und laedt neu - er muss nur angestossen
       * werden, hoechstens einmal je Stunde. Bis dahin bildet das Buch keinen Korb. */
      if (ziel.korb && ziel.korb.ohneUmsatz > 0 && ziel.korb.ohneUmsatz * 2 >= ziel.korb.geprueft &&
          window.MF && window.MF.ladeUniversum && Date.now() - ladeAngestossen > 3600000) {
        ladeAngestossen = Date.now();
        window.MF.ladeUniversum();
      }
      /* Regel K (Auftrag Nr. 87): der Schalter aus der Konfiguration des Buchs geht an BEIDE
       * Planungen und an die Ausfuehrung - K2 sitzt im Plan, K1 in der Ausfuehrung. */
      var plan = ziel.zuWenig ? null : MH.planeUmschichtung(ziel.ziel, d.mfBuch, daten.preise, { kleinstAnteil: KONFIG.kleinstAnteil });
      if ((faellig && d.momentumAn) || manuell === 'momentum') {
        /* A4: Rangfolge auf den Schluessen des Stichtags, gehandelt zur Eroeffnung des
         * Ausfuehrungstags - auch der Knopf. Geht es heute (noch) nicht, steht der Grund auf der
         * Karte, und gehandelt wird nichts. */
        var ausf = await ausfuehrungVorbereiten(MH, d, daten, fl, now);
        if (!ausf.ok) hinweisM = ausf.hinweis;
        else {
          var zielA = ausf.ziel;
          splitsHeuteBuchen(MH, d, ausf.ereignisse, ausf.barZeit, now);   // Generalprobe 23.11., Fund 1: Split vom Ausfuehrungstag vor dem Plan (gespeichert wird unten)
          var vorherM = (d.mfBuch.positionen || []).slice();              // Generalprobe 23.11., Fund 5: fuer anspruecheVormerken unten
          plan = MH.planeUmschichtung(zielA.ziel, d.mfBuch, ausf.preise, { kleinstAnteil: KONFIG.kleinstAnteil });
          var nM = MH.fuehreAus(d.mfBuch, plan, now, 20, { kleinstAnteil: KONFIG.kleinstAnteil });
          MH.stempleKursT(d.mfBuch, ausf.barZeit, now);   // neue Positionen: Balken des Ausfuehrungstags, zu dessen Eroeffnung gekauft wurde
          /* Nr. 94: fehlt fuer einen geplanten Kauf oder Verkauf die Eroeffnung, merkt sich das Buch die offenen
           * Auftraege des Tages (die naechsten Takte fassen bis 16:00 New York nach). Nur der Takt - der Knopf
           * "jetzt umschichten" aendert nichts an offen; seine fehlenden Werte bleiben wie bisher liegen. */
          var offenNeu = manuell === 'momentum' ? null : MH.offeneAuftraege(zielA.ziel, plan, ausf.heute);
          if (offenNeu) d.mfBuch.offen = offenNeu;
          /* Generalprobe 23.11., Fund 5 (M-01, D-01, H-c1): zur Eroeffnung verkaufte Positionen behalten ihren Anspruch auf
           * Ausschuettungen bis zum Verkaufstag (REGEL C.3); gebucht wird nach dem Laden (bucheMassnahmen, Regel 7). */
          MH.anspruecheVormerken(d.mfBuch, vorherM, ausf.barZeit, now);
          var offenSyms = MH.offenWerte(offenNeu);
          var fehltRest = plan.fehltKurs.filter(function (s) { return offenSyms.indexOf(s) < 0; });
          /* Gezaehlt wird, was WIRKLICH lief: fuehreAus setzt o.stueck eines nicht ausgefuehrten
           * Kaufs auf 0 (kein Bargeld mehr, oder nach dem Verkleinern unter der Grenze von
           * Regel K1). plan.kaufen.length waere die Zahl der GEPLANTEN Kaeufe. */
          var gekauftM = plan.kaufen.filter(function (o) { return o.stueck > 0; }).length;
          var ausgefallenM = plan.kaufen.length - gekauftM;
          var kleinstM = (plan.kleinst || []).length;
          var spaet = manuell === 'momentum' ? 0 : (fl.verspaetung || 0);
          /* Runde 2 (Nr. 108, Test 32): der wahre Grund einer Verspaetung. Stand am faelligen Tag oder danach ein Grund
           * auf der Karte (d.mfBuch.aufschub, unten gemerkt - etwa "Marktreihe (SPY) fehlt im Bestand"), nennt das
           * Journal DEN, nicht pauschal "die App lief nicht". Faellig war der halten-te SPY-Balken nach der letzten
           * Umschichtung (MH.faelligkeit). */
          var faelligTag = null, aufschub = d.mfBuch.aufschub || null;
          if (spaet && daten.bezug && d.mfBuch.letzteAusfuehrungTag) {
            var nachLetzter = daten.bezug.filter(function (b) { return MH.nyTag(b[0]) > d.mfBuch.letzteAusfuehrungTag; });
            if (nachLetzter.length >= KONFIG.halten) faelligTag = MH.nyTag(nachLetzter[KONFIG.halten - 1][0]);
          }
          var spaetGrund = spaet && aufschub && faelligTag && aufschub.tag >= faelligTag
            ? 'am fälligen Tag ' + MH.datumDe(faelligTag) + ' oder danach kein Handel; zuletzt am ' + MH.datumDe(aufschub.tag) + ': ' + String(aufschub.grund).replace(/\.\s*$/, '')
            : 'am fälligen Tag kam nach Börsenöffnung keine Umschichtung zustande – die App lief nicht oder bekam keine Eröffnungskurse';
          delete d.mfBuch.aufschub;
          d.mfBuch.letztesRebalanceT = now;
          d.mfBuch.letzteAusfuehrungTag = ausf.heute;
          /* Die Faelligkeit neu ab DIESEM Ausfuehrungstag - sonst nennt die Karte bis zum naechsten
           * Takt noch die alte Zaehlung ("nach 0 weiteren Handelstagen", Abnahme Nr. 93). */
          fl = MH.faelligkeit(daten.bezug, d.mfBuch.letzteAusfuehrungTag, KONFIG.halten, now);
          /* Erste Umschichtung auf dem liquiden Korb = Beginn des Vorwaertstests; die
           * Korbgroesse je Umschichtung weist die Drift der nominalen Schwelle
           * NACHRICHTLICH aus (wiki/fehlerformen.md) - behoben wird sie nicht. */
          if (!d.mfBuch.liquideSeit) d.mfBuch.liquideSeit = now;
          if (!d.mfBuch.korbVerlauf) d.mfBuch.korbVerlauf = [];
          d.mfBuch.korbVerlauf.push({ t: now, zulaessig: zielA.korb.zulaessig, geprueft: zielA.korb.geprueft, ziel: zielA.ziel.length });
          if (d.mfBuch.korbVerlauf.length > 120) d.mfBuch.korbVerlauf = d.mfBuch.korbVerlauf.slice(-120);
          if (!d.tuneLog) d.tuneLog = [];
          d.tuneLog.unshift({ id: 'mfrebal-' + now, at: now, quelle: manuell === 'momentum' ? 'hand' : 'automatik',
            applied: ['Momentum-Rebalancing: ' + nM + ' Orders'],
            txt: 'Momentum-Depot umgeschichtet: ' + (nM - gekauftM) + ' Verkäufe, ' + gekauftM +
              ' Käufe auf das stärkste Zehntel (' + zielA.ziel.length + ' Werte). Ausführungstag ' + MH.datumDe(ausf.heute) +
              ', Rangfolge auf den Schlusskursen des Stichtags ' + MH.datumDe(ausf.stichtag) + ', gehandelt zur Eröffnung' +
              (spaet ? ' – ' + spaet + (spaet === 1 ? ' Handelstag' : ' Handelstage') + ' verspätet (' + spaetGrund + ')' : '') +
              '. Kosten 20 Bp je Seite.' +
              (ausgefallenM ? ' ' + ausgefallenM + (ausgefallenM === 1 ? ' Kauf' : ' Käufe') + ' mangels Bargeld nicht ausgeführt.' : '') +
              (kleinstM ? ' ' + kleinstM + (kleinstM === 1 ? ' Kleinstbestand' : ' Kleinstbestände') + ' aufgelöst.' : '') +
              ' Korb: ' + zielA.korb.zulaessig + ' von ' + zielA.korb.geprueft + ' Werten zulässig (Median-Tagesumsatz ≥ ' +
              Math.round(zielA.korb.umsatzMin / 1e6) + ' Mio $ über ' + zielA.korb.fenster + ' Balken).' +
              (zielA.uebersprungen.length ? ' Nicht im Korb oder ohne frische Kurse: ' + zielA.uebersprungen.slice(0, 6).join(', ') + (zielA.uebersprungen.length > 6 ? ' …' : '') : '') +
              MH.offenText(offenNeu, now) +
              (fehltRest.length ? ' Ohne Eröffnungskurs nicht handelbar (Ziel nicht gekauft, Position bis zur nächsten Umschichtung gehalten): ' +
                fehltRest.slice(0, 6).join(', ') + (fehltRest.length > 6 ? ' …' : '') : '') });
          speichern();
          plan = MH.planeUmschichtung(ziel.ziel, d.mfBuch, daten.preise, { kleinstAnteil: KONFIG.kleinstAnteil });   // frisch für die Anzeige
          faellig = false;
        }
      }
      /* Runde 2 (Nr. 108, Test 32): an einem Handelstag nach Boersenoeffnung den Grund merken, warum nicht umgeschichtet
       * wurde (oder die Faelligkeit offen ist) - eine spaetere, verspaetete Umschichtung nennt ihn im Journal. */
      var heuteM = MH.nyTag(now);
      if (hinweisM && d.momentumAn && MH.istWerktag(heuteM) && now >= MH.nyZeit(heuteM, MH.HANDEL_AB[0], MH.HANDEL_AB[1]) &&
          (!d.mfBuch.aufschub || d.mfBuch.aufschub.tag !== heuteM || d.mfBuch.aufschub.grund !== hinweisM)) {
        d.mfBuch.aufschub = { tag: heuteM, grund: hinweisM };
        speichern();
      }
      /* D-03: der aufgeschobene Punkt von heute - nur, wenn heute umgeschichtet wurde. */
      if (punktNachHandel && d.mfBuch.letzteAusfuehrungTag === MH.nyTag(now) && tagespunkt(MH, d, daten, now)) speichern();

      /* ---- Drift-Buch ---- */
      var driftInfo = null;
      var termine = await window.api.storeGet('drift_termine');
      if (termine && termine.sym && markt) {                   // ohne drift_markt kein Drift-Abgleich (D-09)
        var kurseD = {}, termD = {};
        Object.keys(daten.roh).forEach(function (s) {
          if (termine.sym[s] && termine.sym[s].length) { kurseD[s] = daten.roh[s]; termD[s] = termine.sym[s]; }
        });
        if (Object.keys(termD).length >= 20) {
          if (!d.driftBuch) d.driftBuch = buchInit('drift');
          var heute = Dr.heute(kurseD, termD, markt);
          var getanD;
          if (d.driftAn || manuell === 'drift') {
            getanD = MH.driftAbgleich(d.driftBuch, heute, daten.preise, now, {});
            MH.stempleKursT(d.driftBuch, daten.barZeit, now);   // neue Positionen: Balken, zu dessen Kurs eroeffnet wurde
            /* NUR HANDLUNGEN ins Journal (Wilhelms Entscheid 31.08.2026): "42 verworfen"
             * ist das Ergebnis einer Pruefung, keine Handlung. Der alte Zustand schrieb
             * bei jedem Halbstunden-Takt eine Zeile "0 eroeffnet, 0 geschlossen, 42
             * verworfen" und begrub darunter die echten Aenderungen. Ein Lauf ohne
             * Eroeffnung/Schliessung setzt jetzt nur den Pruef-Stempel (unten); die
             * Verworfenen stehen weiter live in der Drift-Karte und - wenn wirklich
             * gehandelt wurde - im txt des Handlungs-Eintrags. */
            if (getanD.geschlossen || getanD.eroeffnet) {
              if (!d.tuneLog) d.tuneLog = [];
              d.tuneLog.unshift({ id: 'driftab-' + now, at: now, quelle: manuell === 'drift' ? 'hand' : 'automatik',
                applied: ['Drift-Abgleich: ' + getanD.eroeffnet + ' eröffnet, ' + getanD.geschlossen + ' geschlossen' +
                  (getanD.verworfen.length ? ', ' + getanD.verworfen.length + ' verworfen' : '')],
                txt: 'Ergebnis-Drift-Depot abgeglichen. Neue Signale nur, wenn jünger als 5 Handelstage – ' +
                  'ein 40 Tage altes Signal hat den Großteil seiner Wirkung hinter sich.' +
                  (getanD.verworfen.length ? ' Erkannt, aber nicht gehandelt: ' + verworfenKurz(getanD.verworfen) : '') });
              speichern();
            }
          } else {
            // Automatik aus: trotzdem erheben, was das Buch täte. Der Prüf-Modus rechnet
            // auf einer Kopie und fasst das echte Buch nicht an.
            getanD = MH.driftAbgleich(d.driftBuch, heute, daten.preise, now, { nurPruefen: true });
          }
          driftInfo = { heute: heute, werte: Object.keys(termD).length, verworfen: getanD.verworfen };
        }
      }

      /* ---- Stand des Takts fuer den Vergleich mit dem Markt ---- */
      /* Der Tagespunkt ist oben geschrieben (A5, tagespunkt). Hier nur der Stand DIESES Takts
       * (verlaufMitStand haengt ihn im Speicher an, nie im Bestand): Buch zu den juengsten
       * Schluessen des Bestands, Markt = juengster SPY-Schluss DESSELBEN Bestands, spyT = Stempel
       * dieses Balkens (massstab.js sucht ueber ihn den Faktor der Ausschuettungen, Nr. 91). Ein
       * Bestand ohne SPY (von vor Nr. 93, bis zum ersten Laden): wie bisher die Marktreihe. */
      var spyQ = daten.bezug || markt;
      var spy = spyQ.length ? spyQ[spyQ.length - 1][1] : null;
      var spyT = spyQ.length ? spyQ[spyQ.length - 1][0] : null;
      STAND.spy = spy;   // derselbe Marktstand fuer den Stand des letzten Takts (verlaufMitStand)
      STAND.spyT = spyT;
      var bwM = MH.bewerte(d.mfBuch, daten.preise);
      var bwD = d.driftBuch ? MH.bewerteDrift(d.driftBuch, daten.preise) : null;

      /* Pruef-Stempel: jeder durchgelaufene Takt haelt fest, DASS geprueft wurde -
       * als Feld im Store, nicht als Journalzeile. Das Journal baut daraus die eine
       * Statuszeile "zuletzt geprueft ... / keine Aenderung seit ...". Der Stempel
       * wird mit dem naechsten ohnehin faelligen speichern() persistent; ein eigener
       * Schreibvorgang je Takt waere dafuer zu teuer. */
      if (!d.pruefStand) d.pruefStand = {};
      d.pruefStand.buecher = now;
      zeige({ ziel: ziel, plan: plan, faellig: faellig, bewertung: bwM, hinweis: hinweisM, fl: fl }, driftInfo && d.driftBuch
        ? { info: driftInfo, bewertung: bwD } : null, daten, null);
    } catch (e) {
      zeige(null, null, null, 'Fehler: ' + (e.message || e));
    } finally { LAEUFT = false; }
  }

  /* ---------------- Anzeige ---------------- */

  /** Kurzfassung der verworfenen Signale für den Protokoll-Eintrag: nach Grund
   *  gebündelt, damit aus 30 Einzelzeilen ein lesbarer Satz wird. */
  function verworfenKurz(liste) {
    var nachGrund = {}, reihenfolge = [];
    liste.forEach(function (v) {
      // Zahlen aus dem Grund nehmen, sonst zählt jedes Signalalter als eigener Grund
      var g = String(v.grund).replace(/\d+/g, 'n');
      if (nachGrund[g] == null) { nachGrund[g] = 0; reihenfolge.push(g); }
      nachGrund[g]++;
    });
    return reihenfolge.map(function (g) { return nachGrund[g] + '× ' + g; }).join('; ') + '.';
  }

  /** „Erkannt, aber nicht gehandelt“ – jedes Signal, das das Modell sah und das Buch
   *  NICHT nahm, mit Grund. Vorher verschwanden diese Fälle spurlos: Im Fenster stand
   *  „Signale offen laut Modell: 12“ neben drei Positionen, und nirgends war
   *  nachvollziehbar, woran die neun anderen scheiterten. Reine Anzeige – sie ändert
   *  nichts am Handel. */
  function verworfenTabelle(liste, titel, mitRichtung) {
    if (!liste || !liste.length) return '';
    var zeigen = liste.slice(0, 40);
    return '<details class="how" style="margin-top:8px;"><summary>' + U.esc(titel) + ' (' + liste.length + ')</summary>' +
      '<table class="tbl"><thead><tr><th>Wert</th>' + (mitRichtung ? '<th>Richtung</th>' : '') +
      '<th>Grund</th></tr></thead><tbody>' +
      zeigen.map(function (v) {
        return '<tr><td>' + U.esc(v.sym) + '</td>' +
          (mitRichtung ? '<td>' + (v.richtung == null ? '–' : (v.richtung > 0 ? '▲ long' : '▼ short')) + '</td>' : '') +
          '<td>' + U.esc(v.grund) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (liste.length > zeigen.length ? '<div class="hinweis">… und ' + (liste.length - zeigen.length) + ' weitere.</div>' : '') +
      '</details>';
  }

  function posTabelle(buch, preise, mitRichtung) {
    if (!buch.positionen.length) return '<div class="empty" style="padding:6px 0;">Keine Positionen.</div>';
    return '<table class="tbl"><thead><tr><th>Wert</th>' + (mitRichtung ? '<th>Richtung</th>' : '') +
      '<th style="text-align:right;">Stück</th><th style="text-align:right;">Einstand</th>' +
      '<th style="text-align:right;">Kurs</th><th style="text-align:right;">±</th></tr></thead><tbody>' +
      buch.positionen.map(function (p) {
        var k = preise[p.sym];
        var pnlPct = k > 0 ? ((p.richtung != null && p.richtung < 0 ? (2 * p.einstand - k) : k) / p.einstand - 1) * 100 : null;
        return '<tr><td>' + U.esc(p.sym) + '</td>' +
          (mitRichtung ? '<td>' + (p.richtung > 0 ? '▲ long' : '▼ short') + '</td>' : '') +
          '<td style="text-align:right;">' + p.stueck + '</td>' +
          '<td style="text-align:right;">' + U.nf2.format(p.einstand) + '</td>' +
          '<td style="text-align:right;">' + (k > 0 ? U.nf2.format(k) : '–') + '</td>' +
          '<td style="text-align:right;" class="' + (pnlPct >= 0 ? 'pos' : 'neg') + '">' +
          (pnlPct == null ? '–' : U.signTxt(Math.round(pnlPct * 10) / 10, ' %')) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  /* ---- Die Buecher-Karten oben im Bestand (Oberflaeche Stufe 2, 03.09.2026) ----
   *
   * LETZTER BEWERTETER STAND je Buch. Die Karte hat genau EINEN Schreiber (diese
   * Datei) und zwei Ausloeser: takt(), sobald eine Bewertung vorliegt, und
   * depot.js render() bei jedem Zeichnen des Bestands. Ohne diesen Merker wuerde
   * render() die frische Bewertung mit dem taeglichen Verlaufspunkt ueberschreiben -
   * dieselbe Zahl an zwei Orten, verschieden alt.
   * Hier wird NICHTS nachgerechnet: abgelegt wird nur, was takt() ohnehin gerechnet
   * hat (MFHandel.bewerte / bewerteDrift). */
  var STAND = { momentum: null, drift: null, spy: null, spyT: null };

  /* ---- Der Massstab (Auftrag Nr. 73, 04.10.2026) ----
   * Der Verlauf, wie ihn Kopf, Karte und Buecher-Verlauf lesen: die Tagespunkte aus
   * d.mfVerlauf, dazu - wenn der Takt seither neu bewertet hat - der Stand des letzten
   * Takts als juengster Punkt (nur im Speicher, nie im Bestand). So nennen alle drei
   * Stellen dieselbe Zahl; vorher stand im Kopf der Tagespunkt und auf der Karte die
   * frische Bewertung. Ein Buch geht nur mit dem Stand DIESES Takts in den Punkt. */
  function verlaufMitStand() {
    var d = D();
    var v = (d && d.mfVerlauf) ? d.mfVerlauf.slice() : [];
    var sM = standVon('momentum', d), sD = standVon('drift', d);
    var at = Math.max(sM ? sM.at : 0, sD ? sD.at : 0);
    if (!at || (v.length && v[v.length - 1].t >= at)) return v;
    var mOk = sM && at - sM.at < 5000, dOk = sD && at - sD.at < 5000;
    v.push({ t: at, momentum: mOk ? sM.wert : null, drift: dOk ? sD.wert : null, spy: STAND.spy, spyT: STAND.spyT,
      startM: mOk ? sM.start : null, startD: dOk ? sD.start : null });
    return v;
  }
  /* Runde 2 (Nr. 108, Test 22): ein Stand gilt nur fuer DAS Buch, das ihn hatte (Merkmal angelegt, gesetzt in zeige()).
   * Nach "Alle Buecher zuruecksetzen" zeigten Karte und Kopf bis zum naechsten Takt den Wert des geloeschten Buchs.
   * Ein Stand ohne das Merkmal (Feld fehlt) gilt wie bisher. */
  function standVon(name, d) {
    var s = STAND[name], buch = d ? (name === 'momentum' ? d.mfBuch : d.driftBuch) : null;
    if (!s) return null;
    if (!('angelegt' in s)) return s;
    return buch && s.angelegt === buch.angelegt ? s : null;
  }
  /** Buch gegen den S&P 500 ueber denselben Zeitraum - gerechnet in massstab.js,
   *  hier nur mit den Daten des Buchs versorgt. name = 'momentum' | 'drift'.
   *  Seit Auftrag Nr. 91 (punktKurs): der Marktwert eines Punkts ist der Stand, den die
   *  App beim Bewerten des Buchs sah (im Punkt abgelegt), mal dem Faktor der
   *  Ausschuettungen aus den zwei Reihen des Merkers (MARKT, MARKT_ROH) - nicht mehr ein
   *  spaeter nachgeschlagener Balken. Die zwei Buecher buchen seit Nr. 87 Ausschuettungen
   *  (buchAusschuettungen) - das sagt der Hinweis. */
  /*  Seit Auftrag Nr. 95 (C1): verlauf (optional) - ein Ausschnitt der Tagespunkte, etwa die
   *  Woche im Wochenbericht (berichte.js). Dann rechnet derselbe Massstab mit denselben
   *  Optionen ueber diese Punkte; ohne verlauf wie bisher ueber den Verlauf samt Stand. */
  /*  Runde 2 (Nr. 108, F9): beim MOMENTUM-Buch beginnt "Gegen den Markt" (Karte, Kopf, Buecher-Verlauf) mit
   *  der ersten Umschichtung nach der gemessenen liquiden Regel (b.liquideSeit) - so starten Buch und SPY in
   *  der Messung (REGEL §1.6/§1.8: am selben ersten Ausfuehrungstag). Bezug ist der letzte Tagespunkt VOR
   *  diesem Ausfuehrungstag (der Schluss des Stichtags); ohne einen solchen Punkt (Buch am Tag der ersten
   *  Umschichtung angelegt) der ganze Verlauf wie bisher. Solange es diese Umschichtung nicht gibt, steht
   *  keine Zahl da, sondern der Satz (grund 'vor-liquide', voraussichtlich = Tag der naechsten
   *  Umschichtung, wenn bekannt) - bis Nr. 108 las die Zeile vor allem die alte, breite Regel.
   *  Ein Ausschnitt (verlauf, Wochenbericht) bleibt, wie er ist. */
  function vergleich(name, verlauf) {
    var d = D();
    if (!d || !window.Massstab) return null;
    var buch = name === 'momentum' ? d.mfBuch : d.driftBuch;
    var an = name === 'momentum' ? !!d.momentumAn : !!d.driftAn;
    var ab = !verlauf && name === 'momentum' && buch && an ? abLiquide(buch, verlaufMitStand()) : null;   // Runde 2 (F9)
    var r = window.Massstab.vergleich(verlauf || (ab && ab.verlauf) || verlaufMitStand(), name, name === 'momentum' ? 'startM' : 'startD', {
      an: an,
      start: buch ? buch.start : null, angelegt: buch && !(ab && ab.geschnitten) ? buch.angelegt : null,
      punktKurs: true, marktRoh: MARKT_ROH, buchAusschuettungen: true, markt: MARKT });
    if (!(ab && ab.vor)) return r;
    var st = standVon('momentum', d), MH = window.MFHandel;
    var tag = st && st.noch != null && typeof naechsteUmschichtung === 'function' ? naechsteUmschichtung(st.noch, st.at) : null;
    return window.Massstab.vorLiquide(r, tag && MH ? MH.datumDe(tag) : null);
  }
  /** F9: { vor: true } ohne liquide Umschichtung; sonst { verlauf } ab dem letzten Tagespunkt vor dem Tag von liquideSeit
   *  (geschnitten: der Bezug ist dieser Punkt, nicht die Anlage) oder der ganze Verlauf, wenn es davor keinen Punkt gibt. */
  function abLiquide(buch, v) {
    var MH = window.MFHandel;
    if (!buch.liquideSeit) return { vor: true };
    if (!MH) return { verlauf: v };
    var liqTag = MH.nyTag(buch.liquideSeit), j = -1;
    for (var i = 0; i < v.length; i++) if ((v[i].tag || MH.nyTag(v[i].t)) < liqTag) j = i;
    return j < 0 ? { verlauf: v } : { verlauf: v.slice(j), geschnitten: true };
  }

  /* A5 (Auftrag Nr. 93): der erste Punkt des laufenden Buchs (Kauf 25.08.2026 mitten in der
   * Sitzung, Markt vom Schluss des Vortags) bekommt keinen nachtraeglichen Wert - die Karte nennt
   * die Versetzung in einem Satz. Erkannt am Punkt selbst: ein Punkt ohne tag stammt von vor Nr. 93. */
  function ersterPunktSatz(d) {
    var v = d && d.mfVerlauf;
    if (!(v && v.length && !v[0].tag)) return null;
    return 'Der erste Punkt (' + U.d(v[0].t) + ') stellt das Buch mitten in der Sitzung gegen den Markt vom letzten Schluss davor; ' +
      'seit Auftrag Nr. 93 gehören Buch und Markt eines Tagespunkts zum selben Handelsschluss.';
  }

  function letzterPunkt(d) {
    var v = d && d.mfVerlauf;
    return (v && v.length) ? v[v.length - 1] : null;
  }

  /** Alles, was auf einer Buch-Karte steht - aus Daten, nie aus Text.
   *  quelle 'live'    = aus der Bewertung des letzten Takts,
   *  quelle 'verlauf' = aus dem juengsten Punkt in d.mfVerlauf. Der wird nur EINMAL
   *                     JE TAG geschrieben, deshalb steht sein Datum auf der Karte.
   *  Fehlt beides, bleibt wert null - die Karte schreibt dann einen Strich samt Grund
   *  und erfindet keine Zahl. */
  function buchKarteDaten(name) {
    var d = D();
    if (!d) return null;
    var buch = name === 'momentum' ? d.mfBuch : d.driftBuch;
    var an = name === 'momentum' ? !!d.momentumAn : !!d.driftAn;
    var s = standVon(name, d), lp = letzterPunkt(d);
    var wert = null, start = null, quelle = null, standT = null;
    if (s) { wert = s.wert; start = s.start; quelle = 'live'; standT = s.at; }
    else if (lp && lp[name] != null) {
      wert = lp[name];
      /* Startkapital aus dem Punkt selbst, sonst aus dem Buch - nie eine feste Zahl.
       * Genau hier stand im Cockpit einmal 10000, waehrend die Buecher mit 100000
       * laufen: ein unberuehrtes Buch meldete dadurch +900 %. */
      start = (name === 'momentum' ? lp.startM : lp.startD) || (buch && buch.start) || null;
      quelle = 'verlauf'; standT = lp.t;
    }
    var trades = (buch && buch.trades) || [];
    return {
      name: name, an: an, buch: buch, wert: wert, start: start, quelle: quelle, standT: standT,
      positionen: (buch && buch.positionen) ? buch.positionen.length : null,
      faellig: s ? !!s.faellig : false,
      letzte: trades.length ? trades[trades.length - 1] : null,
      geprueft: (d.pruefStand && d.pruefStand.buecher) ? d.pruefStand.buecher : null,
      massstab: vergleich(name),
      /* Auftrag Nr. 93: Grund statt stillem "nicht faellig" (A4/A6), Handelstage bis zur naechsten
       * Umschichtung, Positionen ohne jede Kursreihe (A2), der Satz zum ersten Punkt (A5). */
      hinweis: s && s.hinweis ? s.hinweis : null, noch: s && s.noch != null ? s.noch : null,
      ohneKurs: s && s.ohneKurs ? s.ohneKurs : [], ersterSatz: ersterPunktSatz(d)
    };
  }

  function fakten(zeilen) {
    return '<dl class="buch-fakten">' + zeilen.map(function (z) {
      return '<dt>' + U.esc(z[0]) + '</dt><dd>' + z[1] + '</dd>';
    }).join('') + '</dl>';
  }

  /** Ein Strich MIT Grund. Eine Karte, die eine Zahl nicht hat, sagt warum; sie laesst
   *  das Feld nicht leer und setzt keine Null an die Stelle einer fehlenden Messung. */
  function ohne(grund) { return '–<span style="color:var(--muted);"> · ' + U.esc(grund) + '</span>'; }

  function handlungText(t) {
    if (!t) return ohne('noch keine Order');
    return U.d(t.t) + ' · ' + U.esc(t.art) + ' ' + U.esc(t.sym);
  }

  /* Der naechste Takt kommt aus dem Buch, nicht aus einem Kalender: faellig ist, was
   * MFHandel.rebalanceFaellig im letzten Durchlauf gesagt hat; sonst steht da, nach
   * wie vielen Handelstagen es soweit ist (b.konfig.halten - die gemessene
   * Konfiguration) und wann zuletzt umgeschichtet wurde. */
  /* Seit Auftrag Nr. 93: steht im Stand des Takts ein Grund, warum (noch) nicht umgeschichtet
   * wird ("Umschichtung heute nach Börsenöffnung", "Marktreihe veraltet seit …", Kurse nicht
   * frisch), steht DER da - nie still "nicht faellig". Sonst der Ausfuehrungstag der letzten
   * Umschichtung (New York) und wie viele Handelstage bis zur naechsten fehlen. */
  /* Auftrag Nr. 95 (C3): der TAG der naechsten Umschichtung, aus der Faelligkeit gerechnet, nie
   * fest. noch = Handelstage, die bis dahin fehlen (MFHandel.faelligkeit zaehlt nur Balken VOR
   * heute - heute zaehlt also mit, wenn heute gehandelt wird); umgeschichtet wird am Handelstag
   * danach. Handelstage aus dem Boersenkalender (boerse.js, Feiertage der NYSE). Ohne Kalender
   * oder ohne noch: null - dann steht nur die Zahl der Handelstage da. */
  function naechsteUmschichtung(noch, nowMs) {
    var MH = window.MFHandel, B = window.Boerse;
    if (!MH || !B || !B.istHandelstag || noch == null || !(nowMs > 0)) return null;
    var tag = MH.nyTag(nowMs), n = 0;
    for (var i = 0; i < 500; i++, tag = MH.tagPlus(tag, 1)) {
      if (!B.istHandelstag(Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10)))) continue;
      if (n === noch) return tag;
      n++;
    }
    return null;
  }
  function taktTextMomentum(k) {
    if (k.hinweis) return k.hinweis;
    if (k.faellig) return 'Umschichtung fällig';
    if (!k.buch || !k.buch.letztesRebalanceT) return 'erste Umschichtung steht aus';
    var h = k.buch.konfig ? k.buch.konfig.halten : null;
    var MH = window.MFHandel;
    var tag = k.buch.letzteAusfuehrungTag && MH ? MH.datumDe(k.buch.letzteAusfuehrungTag) : U.d(k.buch.letztesRebalanceT);
    var naechste = k.noch != null ? naechsteUmschichtung(k.noch, k.standT || Date.now()) : null;
    return (h ? 'Umschichtung alle ' + h + ' Handelstage · ' : '') + 'letzte ' + tag +
      (naechste ? ' · nächste am ' + MH.datumDe(naechste) + ' zur Eröffnung (nach ' + k.noch + ' weiteren Handelstagen)'
        : k.noch != null ? ' · nächste nach ' + k.noch + ' weiteren Handelstagen, zur Eröffnung' : '');
  }
  /* Das Drift-Buch hat keinen Umschichtungs-Rhythmus: es gleicht bei jedem Takt ab.
   * Was es ueber die Zeit sagt, ist deshalb der Pruef-Stempel aus d.pruefStand. */
  function taktTextDrift(k) {
    return (k.an ? 'Abgleich bei jedem Takt' : 'Automatik aus – es wird nur gerechnet') +
      (k.geprueft ? ' · zuletzt geprüft ' + U.dt(k.geprueft) : ' · noch nicht geprüft');
  }

  function karteHtml(k, taktTxt) {
    if (!k) return '';
    var pnl = (k.wert != null && k.start) ? k.wert - k.start : null;
    /* cls statt U.signCls: das Buch zeigt ein Ergebnis von genau 0 $ gruen. Welche der
     * beiden Anzeigen richtig ist, entscheidet nicht diese Karte - der Ausdruck ist
     * derselbe wie in der Kachelreihe, die hier bis zum 03.09.2026 stand. */
    var cls = pnl == null ? '' : (pnl >= 0 ? 'pos' : 'neg');
    var kopf = k.wert == null
      ? '<div class="buch-aus">' + (k.buch
          ? 'Noch kein Stand – der Takt hat dieses Buch noch nicht bewertet.'
          : 'Buch noch nicht angelegt – es entsteht beim ersten Takt.') + '</div>'
      : '<div class="buch-wert ' + cls + '">' + U.money(k.wert) + '</div>' +
        '<div class="buch-erg ' + cls + '">' + (pnl == null
          ? ohne('kein Startkapital im Verlauf')
          : U.signTxt(Math.round(pnl * 100) / 100, ' $') + ' · ' + U.pz1(window.Massstab.prozent(k.wert, k.start))) + '</div>' +
        (k.quelle === 'verlauf'
          ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">Stand vom ' +
            U.d(k.standT) + ' – der Takt hat seither nicht neu bewertet.</div>'
          : '');
    /* Der Massstab: Buch und S&P 500 ueber DENSELBEN Zeitraum, mit Datum. Fehlt der
     * Marktstand, steht der Grund da, keine Null. Der Hinweis zur Bauart des
     * Vergleichs steht wortgleich an jeder Stelle (Massstab.hinweis). */
    var M = window.Massstab, v = k.massstab;
    var gegen = U.esc(M.langText('Buch', v, U.pz1)) + (v && v.ok
      ? '<br><span style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(M.hinweis(v)) +
        (k.ersterSatz ? ' ' + U.esc(k.ersterSatz) : '') + '</span>' : '');
    /* Der Rueckblick (Auftrag Nr. 81): Wilhelms Regel hat zwei Stufen - Rueckblick ueber
     * fuenf Jahre, dann Vorwaertstest. Der Vorwaertstest ist die Zeile darueber; der
     * Rueckblick kommt aus dem Studienregister (jede Zahl dort gegen die Ergebnisdatei
     * gehalten), je Eintrag eine Zeile. Seit Auftrag Nr. 91 hat auch das Drift-Buch
     * einen (Schluessel 'drift' - eine andere Regel als die des Buchs, das steht im Satz). */
    var SU = window.StudienUrteile;
    var rueckSchluessel = { momentum: 'momentum-liquide', drift: 'drift' }[k.name];
    var rueck = (rueckSchluessel && SU && SU.rueckblicke) ? SU.rueckblicke(rueckSchluessel) : [];
    var zeilen = [['Gegen den Markt', gegen]];
    if (rueck.length) {
      /* Auftrag Nr. 95 (B5): der Satz zum Buch selbst (beim Drift-Buch: warum es trotz „kein
       * Vorwärtstest angezeigt" läuft) - aus studienurteile.js, einmal unter den Zeilen. */
      var buchSatz = SU.buchSatz ? SU.buchSatz(rueckSchluessel) : '';
      zeilen.push(['Rückblick', rueck.map(function (r) {
        return U.esc(SU.rueckblickText(r)) + '<br><span style="color:var(--muted); font-size:var(--fs-klein);">Fundstelle: ' + U.esc(r.quelle) + '</span>';
      }).join('<br>') + (buchSatz ? '<br>' + U.esc(buchSatz) : '')]);
    }
    /* A2 (Auftrag Nr. 93): eine Position ohne jede Kursreihe im Bestand steht zum Einstand im
     * Buchwert - das sagt die Karte als Warnung, nicht nur die Klappe darunter. */
    var oK = k.ohneKurs || [];
    if (oK.length) zeilen.push(['Warnung', '<span style="color:var(--warn);">' + U.esc(oK.join(', ')) + ' ohne Kursreihe im Bestand – zum Einstand bewertet</span>']);
    return kopf + fakten(zeilen.concat([
      ['Positionen', k.positionen == null ? ohne('Buch noch nicht angelegt') : String(k.positionen)],
      ['Status', k.an ? 'handelt selbst' : 'nur rechnen'],
      ['Nächster Takt', U.esc(taktTxt)],
      ['Zuletzt getan', handlungText(k.letzte)]
    ]));
  }

  /** Die zwei Buch-Karten oben im Bestand schreiben. depot.js render() ruft sie bei
   *  jedem Zeichnen mit auf, damit die Karten stehen, bevor der erste Takt durch ist. */
  function karten() {
    var m = buchKarteDaten('momentum');
    var dr = buchKarteDaten('drift');
    var eM = el('buchMomentumKopf');
    if (eM && m) eM.innerHTML = karteHtml(m, taktTextMomentum(m));
    var eD = el('buchDriftKopf');
    if (eD && dr) eD.innerHTML = karteHtml(dr, taktTextDrift(dr));
  }

  function zeige(mom, drift, daten, fehler) {
    /* Ein Fehler ist hier kein Zwischenstand: er ersetzt die Kursangabe und beendet die
     * Anzeige. Deshalb 'fehler' als Zustand - die Zeile wird eingefaerbt und faellt
     * beim naechsten erfolgreichen Durchlauf von selbst wieder auf ihre Grundfarbe.
     * #mfdStatus traegt class="hinweis"; der Inline-Stil ist leer, die Hilfe merkt sich
     * genau dieses '' und stellt es wieder her - die Klassenfarbe bleibt also.
     * Die Karten werden trotzdem geschrieben: sie leben dann vom letzten Verlaufspunkt
     * und sagen dazu, von wann er ist. */
    if (fehler) { U.statuszeile('mfdStatus', fehler, 'fehler'); karten(); return; }
    var d = D();
    if (daten) {
      U.statuszeile('mfdStatus', 'Kurse vom ' + new Date(daten.juengster).toLocaleDateString('de-DE') +
        (!bestandFrisch(daten.stand) ? ' – nicht nach dem letzten Börsenschluss geladen, Nachladen angestoßen' : '') + '.');
    }
    /* Ab hier die KLAPPE "Positionen im Detail": Korb und Konfiguration, der
     * Faelligkeits-Hinweis mit der Handlungsliste, die Positionstabelle und die
     * verworfenen Signale - alles wortgleich wie vorher. Die vier Kennzahlen, die
     * hier bis zum 03.09.2026 als Kachelreihe darueber standen, stehen jetzt auf der
     * Karte; gerechnet werden sie an derselben Stelle wie vorher. */
    if (mom) {
      var b = d.mfBuch, bw = mom.bewertung;
      STAND.momentum = { wert: bw.wert, start: b.start, angelegt: b.angelegt, faellig: !!mom.faellig, at: Date.now(),
        /* Auftrag Nr. 93: der Grund, warum (noch) nicht umgeschichtet wird (A4/A6), wie viele
         * Handelstage bis zur naechsten fehlen, und Positionen ohne jede Kursreihe (A2). */
        hinweis: mom.hinweis || null, noch: mom.fl && mom.fl.noch != null ? mom.fl.noch : null, ohneKurs: bw.ohneKurs.slice() };
      var eM = el('mfdMomentum');
      if (eM) {
        /* Korb und Konfiguration, wie das Buch sie WIRKLICH liest (Zahlen aus mom.ziel.korb
         * und b.konfig, nie aus einem Text hier). Die Korbgroesse je Umschichtung ist die
         * nachrichtliche Ausweisung der Schwellen-Drift. */
        var html = '';
        var kb = mom.ziel.korb;
        if (kb) {
          html += '<div style="font-size:var(--fs-neben); color:var(--muted); margin:6px 0;">' +
            'Korb: <b>' + kb.zulaessig + '</b> von ' + kb.geprueft + ' Werten zulässig (Median-Tagesumsatz ≥ ' +
            Math.round(kb.umsatzMin / 1e6) + ' Mio $ über ' + kb.fenster + ' Balken bis zum Stichtag, vor der Rangbildung)' +
            (kb.ohneUmsatz ? ' · ' + kb.ohneUmsatz + ' ohne Stückzahlen – Tagesdaten werden neu geladen' : '') +
            (mom.ziel.zuWenig ? ' · <b>unter ' + (b.konfig ? b.konfig.mindestWerte : '?') + ' zulässigen Werten – kein Korb</b>' : '') +
            '. Konfiguration wie gemessen (Studie 02.09.2026)' +
            (b.konfigSeit ? ' seit ' + new Date(b.konfigSeit).toLocaleDateString('de-DE') : '') +
            ' · Vorwärtstest ' + (b.liquideSeit ? 'seit ' + new Date(b.liquideSeit).toLocaleDateString('de-DE') : 'ab der nächsten Umschichtung') + '.' +
            (b.korbVerlauf && b.korbVerlauf.length
              ? '<br>Korbgröße je Umschichtung (nachrichtlich – die nominale Schwelle wandert mit dem Marktvolumen): ' +
                b.korbVerlauf.slice(-12).map(function (k) { return new Date(k.t).toLocaleDateString('de-DE') + ' ' + k.zulaessig + '/' + k.geprueft; }).join(', ')
              : '') +
            '</div>';
        }
        if (mom.faellig && mom.plan) {
          html += '<div style="font-size:var(--fs-text); margin:8px 0; padding:8px 10px; border-left:3px solid var(--warn);">' +
            '<b>Rebalancing fällig.</b> ' + (d.momentumAn ? (mom.hinweis ? U.esc(mom.hinweis) + '.' :
            'Wird beim nächsten Takt ausgeführt – Rangfolge auf den Schlusskursen des Vortags, gehandelt zur Eröffnung.') :
            'Automatik ist aus – Handlungsliste: ' +
            (mom.plan.verkaufen.length ? 'verkaufen ' + mom.plan.verkaufen.map(function (o) { return o.sym; }).join(', ') + '; ' : '') +
            (mom.plan.kaufen.length ? 'kaufen ' + mom.plan.kaufen.map(function (o) { return o.sym; }).join(', ') : '') +
            /* Regel K2: ein Kleinstbestand steht in BEIDEN Listen (verkaufen und, als Ziel, kaufen) -
               ohne diesen Satz saehe das wie ein Widerspruch aus. Ohne Schalter fehlt das Feld. */
            ((mom.plan.kleinst || []).length ? '; Kleinstbestand wird aufgelöst: ' + (mom.plan.kleinst || []).join(', ') : '')) + '</div>';
        }
        html += posTabelle(b, daten.preise, false);
        /* A2: eine Position wird zum letzten Schluss ihrer Reihe bewertet, nie zum Einstand -
         * ausser es gibt gar keine Reihe (dann mit Warnung). Eine Reihe ohne neuen Balken zaehlt
         * sichtbar bis zur Ausbuchung nach fuenf Handelstagen. */
        if (bw.ohneKurs.length) html += '<div class="hinweis" style="color:var(--warn);">Warnung – ohne jede Kursreihe im Bestand, deshalb zum Einstand bewertet: ' + bw.ohneKurs.join(', ') + '</div>';
        var stehen = daten.bezug ? b.positionen.filter(function (p) {
          var r = daten.roh[p.sym];
          return r && r.length && window.MFHandel.balkenNach(daten.bezug, window.MFHandel.nyTag(r[r.length - 1][0])) > 0;
        }).map(function (p) {
          var r = daten.roh[p.sym], tg = window.MFHandel.nyTag(r[r.length - 1][0]);
          return p.sym + ' (letzter Kurs ' + window.MFHandel.datumDe(tg) + ', seit ' + window.MFHandel.balkenNach(daten.bezug, tg) + ' Handelstagen ohne neuen)';
        }) : [];
        if (stehen.length) html += '<div class="hinweis">Zum letzten Schluss bewertet, weil kein neuer Kurs kam: ' + stehen.join(', ') +
          '. Nach ' + window.MFHandel.REIHENENDE_TAGE + ' Handelstagen ohne neuen Kurs wird die Position zum letzten Schluss ausgebucht (wie in der Messung).</div>';
        // Erkannt, aber nicht ins Depot genommen: Rangfolge-Ausschlüsse und Ziele ohne Kurs
        var vM = (mom.ziel.verworfen || []).slice();
        ((mom.plan && mom.plan.fehltKurs) || []).forEach(function (sy) {
          vM.push({ sym: sy, grund: 'im Ziel, aber ohne frischen Kurs – nicht handelbar' });
        });
        html += verworfenTabelle(vM, 'Erkannt, aber nicht ins Depot genommen', false);
        eM.innerHTML = html;
      }
    }
    var eD = el('mfdDrift');
    if (drift) {
      var bD = d.driftBuch, bwD = drift.bewertung;
      STAND.drift = { wert: bwD.wert, start: bD.start, angelegt: bD.angelegt, at: Date.now() };
      if (eD) {
        /* "Signale offen laut Modell" war bis zum 03.09.2026 eine Kachel. Sie gehoert
         * nicht auf die Karte (dort stehen die vier Groessen, die jedes Buch hat),
         * verschwindet aber nicht: sie steht hier ueber der Positionstabelle, neben
         * der Zahl der Werte, die das Buch ueberhaupt im Blick hat. */
        eD.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted); margin:6px 0;">' +
          'Signale offen laut Modell: <b>' + drift.info.heute.offen.length + '</b> · ' +
          drift.info.werte + ' Werte mit Ergebnisterminen im Blick.</div>' +
          posTabelle(bD, daten.preise, true) +
          verworfenTabelle(drift.info.verworfen, 'Erkannt, aber nicht gehandelt', true);
      }
    } else if (eD) {
      eD.innerHTML = '<div class="empty" style="padding:6px 0;">Zu wenige Werte mit Ergebnisterminen – der Hintergrund-Abruf füllt das Archiv laufend auf.</div>';
    }
    karten();
  }

  function bereit() {
    var b1 = el('mfdRebalanceBtn'), b2 = el('mfdDriftBtn'), b3 = el('mfdTaktBtn');
    /* Beide Knoepfe buchen auch dann echte Orders, wenn das Buch abgeschaltet ist -
     * takt() laesst 'manuell' den Schalter ausdruecklich uebersteuern. Die Karte
     * daneben zeigt in diesem Zustand aber "nur rechnen". Wer dort auf "jetzt
     * umschichten" drueckt, erwartet eine Vorschau und bekommt einen Handel. Also
     * einmal nachfragen - und nur dann, sonst waere es eine Klickbremse ohne Zweck. */
    function abgeschaltetOk(an, was) {
      var d = D();
      if (!d || d[an]) return true;
      return window.confirm(was + ' ist gerade abgeschaltet („nur rechnen“).\n\n' +
        'Der Knopf bucht trotzdem echte Orders im virtuellen Buch. Fortfahren?');
    }
    if (b1) b1.addEventListener('click', function () { if (abgeschaltetOk('momentumAn', 'Das Momentum-Buch')) takt('momentum'); });
    if (b2) b2.addEventListener('click', function () { if (abgeschaltetOk('driftAn', 'Das Drift-Buch')) takt('drift'); });
    if (b3) b3.addEventListener('click', function () { takt(); });
    /* Die Marktreihe gleich beim Start lesen (nur der Bestand, kein Abruf): sonst
     * stuende der Massstab bis zum ersten Takt als Kursertrag da und spraenge dann um. */
    ladeMarkt().then(function () { karten(); }).catch(function () { });
    setTimeout(function () { takt(); }, 12000);
    setInterval(function () { takt(); }, 30 * 60000);

    /* Drift-Termine im Hintergrund frisch halten (Punkt 3 der Liste): alle 6 Stunden
     * ein rollierender Block über den Kalender-Abruf des Drift-Tabs. Ohne das bleibt
     * „Was wäre heute offen?“ für immer leer, weil Yahoos tiefer Kalender der
     * Gegenwart um ein Jahr hinterherhinkt. */
    setInterval(function () {
      if (window.DriftUI && window.DriftUI.hintergrund) window.DriftUI.hintergrund();
    }, 6 * 3600000);
    setTimeout(function () {
      if (window.DriftUI && window.DriftUI.hintergrund) window.DriftUI.hintergrund();
    }, 90000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  /* karten() ist bewusst mit exportiert: depot.js render() zeichnet den Bestand,
   * und die zwei Buch-Karten gehoeren dazu. Der Schreiber bleibt trotzdem diese
   * Datei - render() bestellt nur, es formuliert nicht. */
  window.MFDepot = { takt: takt, karten: karten, vergleich: vergleich,
    /** Die bereinigte SPY-Reihe, wie sie zuletzt gelesen wurde (oder null) - DIE eine
     *  Marktreihe des Massstabs, auch fuer das Intraday-Depot (depot.js). */
    markt: function () { return MARKT; },
    /** Die UNBEREINIGTE SPY-Reihe desselben Abrufs (dieselben Balken wie markt()), oder
     *  null - Auftrag Nr. 91, fuer den Faktor der Ausschuettungen je Balken. */
    marktRoh: function () { return MARKT_ROH; } };
})();
