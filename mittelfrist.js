'use strict';
/* Oberfläche für die mittelfristige Querschnitts-Strategie.
 * Die Rechnung selbst steht in momentum.js (rein, in Node testbar) – hier wird nur
 * geholt, angezeigt und bedient. */
(function () {
  var M = window.Momentum, U = window.U;
  var DATEN = null;              // {syms, zeiten, map}
  var UNIVERSUM = (
    'AAPL MSFT AMZN GOOGL META NVDA TSLA AVGO ORCL CRM ADBE AMD INTC CSCO QCOM TXN IBM NOW INTU MU ' +
    'JPM BAC WFC GS MS C SCHW BLK AXP USB PNC COF BK SPGI CME ICE MMC AON ' +
    'JNJ UNH PFE ABBV MRK LLY TMO ABT DHR BMY AMGN GILD CVS CI ELV ISRG SYK BSX MDT ZTS ' +
    'XOM CVX COP SLB EOG PSX MPC VLO OXY WMB KMI HAL DVN HES ' +
    'PG KO PEP WMT COST MCD NKE SBUX TGT LOW HD DIS CMCSA VZ T TMUS CL KMB GIS ' +
    'CAT DE BA HON GE LMT RTX UNP UPS FDX MMM EMR ETN ITW PH CSX NSC WM ' +
    'LIN APD SHW ECL NEM FCX DOW DD PPG NEE DUK SO D AEP EXC SRE XEL ED PEG ' +
    'AMT PLD CCI EQIX SPG O PSA WELL AVB EQR ADP FI FIS GPN PAYX CTAS ROP FTV AME ' +
    'EBAY BKNG ABNB UBER DASH PYPL SHOP SNAP PINS SPOT NFLX ROKU F GM APTV BWA ' +
    'MAR HLT RCL CCL LVS WYNN MGM DAL UAL LUV ' +
    'PANW CRWD ZS OKTA NET DDOG SNOW MDB TEAM WDAY VEEV ADSK CDNS SNPS KLAC LRCX AMAT ASML TSM ARM'
  ).split(/\s+/).filter(Boolean);

  function stat(t, art) { U.statuszeile('mfStatus', t, art); }
  function opts() {
    var g = function (id) { return document.getElementById(id); };
    return {
      rueckblick: parseInt(g('mfRueck').value, 10),
      luecke: parseInt(g('mfLuecke').value, 10),
      halten: parseInt(g('mfHalten').value, 10),
      anteil: parseFloat(g('mfAnteil').value),
      kostenBp: parseInt(g('mfKosten').value, 10)
    };
  }

  var EREIGNIS_TAGE = 400;
  /* Auftrag Nr. 93 (F8, A7): abgelegt wird jede Reihe, die die Regel rangieren kann -
   * rueckblick + luecke + 1 = 253 Balken (mfhandel.js momentumZiel). Bis dahin stand hier
   * "mehr als 500": ein neu gelisteter Wert fehlte rund ein Jahr laenger als in der Messung. */
  var MIN_BALKEN = 253;
  /* Auftrag Nr. 93 (A5): SPY kommt im SELBEN Ladevorgang mit - als Bezugsreihe (Handelstage,
   * Faelligkeit, Reihenende, Marktstand des Tagespunkts), nicht gerangt. Sie liegt unter einem
   * eigenen Schluessel (mf_bezug), nicht unter den Werten: wer die Werte liest (Rangfolge,
   * Drift, Kosten, Diagnose), sieht sie nicht. */
  var BEZUG = 'SPY';
  /* Auftrag Nr. 93 (A1): Grenzen, ab denen ein neuer Ladevorgang den gespeicherten Bestand
   * ersetzt - mindestens 120 Werte und mindestens 95 % der zuvor gelieferten. */
  var MIN_GELIEFERT = 120, MIN_ANTEIL_PZ = 95, FEHLVERSUCH_PAUSE = 3600000;
  var FEHLVERSUCH = 0, LAEDT = null;

  /* Tageskerzen über den vollen verfügbaren Zeitraum. period1=0 statt range=max –
   * letzteres liefert bei Tageskerzen nur rund 170 Monatswerte. */
  async function holeTage(sym) {
    try {
      /* BEREINIGT und ROH aus EINEM Abruf (Auftrag Nr. 93, F3): die Messung rangiert, filtert
       * und bewertet auf Schlusskursen, die um Splits bereinigt sind, NICHT um Ausschuettungen
       * (REGEL §1.5 des Rueckblicks: das Panel fuehrt keine; die Ausschuettungen schreibt sie dem
       * Buch gut - die App seit Nr. 87 auch). Yahoos Feld close ist genau das (am NVDA-Split vom
       * 10.06.2024 kein Sprung, test-daten/yahoo-nvda-ereignisse.json); adjclose liegt zusaetzlich
       * um die Ausschuettungen darunter. Bis Nr. 93 stand adjclose in Spalte 1 - das Buch
       * rangierte mit Ausschuettungen und schrieb sie zugleich gut.
       * Die Zeile im Bestand: [t, close, stueck, adjclose] (Index 0 bis 3).
       *   [1] close    ("Spalte 1" des Auftrags) - Rangfolge, Korbfilter (Schluss x Stueck),
       *                Bewertung, Handel
       *   [2] stueck   - Korbfilter (liquide.js), Umsatzklasse (kosten.js)
       *   [3] adjclose ("Spalte 4" des Auftrags, die vierte Spalte) - nur fuer Leser, deren
       *                Messung mit Ausschuettungen rechnete (Uebergabe Nr. 93: driftui.js und die
       *                Rechnung des Mittelfrist-Tabs); fehlt sie (Bestand von vor Nr. 93), lesen
       *                sie [1]
       * Ein Balken ohne brauchbaren close faellt weg (Spalte 1 ist die gehandelte). */
      /* ereignisse: Ausschuettungen und Splits kommen im SELBEN Abruf mit (Auftrag Nr. 87) -
       * die zwei Mittelfrist-Buecher buchen sie (MFHandel.bucheMassnahmen). */
      var kd = await window.Kurse.hole(sym, { von: 0, bis: Date.now(), interval: '1d', bereinigt: true, mitRoh: true, ereignisse: true });
      if (!kd || !kd.bars || !kd.roh) return null;
      var reihe = [];
      for (var i = 0; i < kd.bars.length; i++) {
        var b = kd.bars[i], r = kd.roh[i];
        if (!r || r[0] !== b[0] || !(r[1] > 0)) continue;
        reihe.push([b[0], r[1], b[2], b[1]]);
      }
      /* Ein laufender Balken (heute in New York, vor 16:15) kommt nicht in den Bestand: sein Kurs
       * ist der von jetzt, sein Umsatz ein Teil des Tages (A4/A5: ein laufender Balken zaehlt nie). */
      reihe = window.MFHandel.ohneLaufendenBalken(reihe, Date.now());
      if (!(reihe.length >= MIN_BALKEN)) return null;
      /* Abgelegt werden nur die Ereignisse der letzten 400 Tage - gebucht wird, was seit dem
       * Kauf einer Position anfiel, nicht die Geschichte des Werts. */
      return { reihe: reihe, ereignisse: window.Kurse.ereignisseAb(kd.ereignisse, Date.now() - EREIGNIS_TAGE * 86400000) };
    } catch (e) { return null; }
  }

  /* ---- Tagesdaten-Speicher in Teilen ----
   * Frueher lag das komplette Archiv (38,5 MB) unter EINEM Schluessel: Jedes
   * Speichern schrieb den ganzen Klumpen neu, und ein Absturz mitten im
   * Schreiben haette das gesamte Archiv beschaedigt statt eines Teils. Jetzt:
   * Symbole alphabetisch in Teile zu je 25, dazu ein kleiner Index mit Stand
   * und Teilzahl. Der Index wird ZULETZT geschrieben - wer liest, sieht nur
   * vollstaendige Staende; fehlt ein Teil, greift der alte Schluessel. */
  var TEIL_GROESSE = 25;
  async function tagesdatenSchreiben(roh, weg, at, ereignisse, bezug) {
    var syms = Object.keys(roh).sort();
    var teile = Math.max(1, Math.ceil(syms.length / TEIL_GROESSE));
    for (var t = 0; t < teile; t++) {
      var stueck = {};
      syms.slice(t * TEIL_GROESSE, (t + 1) * TEIL_GROESSE).forEach(function (s) { stueck[s] = roh[s]; });
      await window.api.storeSet('mf_tagesdaten_teil_' + t, { roh: stueck });
    }
    /* Kapitalmassnahmen aus demselben Abruf (Auftrag Nr. 87): eigener Schluessel
     * mf_ereignisse { at, sym: { SYM: { div: [[tMs, betrag]], split: [[tMs, zaehler, nenner]] } } },
     * geschrieben NACH den Teilen und VOR dem Index - wer ueber den Index liest, sieht nur
     * vollstaendige Staende. Ohne das Argument (die Wanderung des alten Klumpens) bleibt
     * der Schluessel, wie er ist. */
    if (ereignisse) await window.api.storeSet('mf_ereignisse', { at: at || Date.now(), sym: ereignisse });
    /* Die Bezugsreihe (SPY, Auftrag Nr. 93) ebenso: nach den Teilen, vor dem Index, mit
     * demselben Stand at - tagesdatenLesen gibt sie nur zurueck, wenn ihr at zum Index passt. */
    if (bezug) await window.api.storeSet('mf_bezug', { at: at || Date.now(), sym: bezug.sym, reihe: bezug.reihe });
    await window.api.storeSet('mf_tagesdaten_index', { at: at || Date.now(), weg: weg || [], teile: teile });
    // Der alte Riesen-Schluessel wird zu einem kleinen Verweis - die 38 MB sind damit weg
    try { await window.api.storeSet('mf_tagesdaten', { ersetztDurch: 'mf_tagesdaten_index', at: at || Date.now() }); } catch (eM) { }
  }
  async function tagesdatenLesen() {
    var idx = await window.api.storeGet('mf_tagesdaten_index');
    if (idx && idx.teile) {
      var roh = {}, ok = true;
      for (var t = 0; t < idx.teile && ok; t++) {
        var teil = await window.api.storeGet('mf_tagesdaten_teil_' + t);
        if (!teil || !teil.roh) ok = false;
        else Object.keys(teil.roh).forEach(function (s) { roh[s] = teil.roh[s]; });
      }
      if (ok) {
        var bz = await window.api.storeGet('mf_bezug');
        return { at: idx.at, roh: roh, weg: idx.weg || [], quelle: 'teile',
          bezug: bz && bz.reihe && bz.at === idx.at ? { sym: bz.sym, reihe: bz.reihe } : null };
      }
    }
    var g = await window.api.storeGet('mf_tagesdaten');
    return (g && g.roh) ? { at: g.at, roh: g.roh, weg: g.weg || [], quelle: 'alt' } : null;
  }

  /** Tragen die gespeicherten Reihen Stueckzahlen (dritte Spalte)? Geprueft ueber
   *  liquide.js, damit hier dieselbe Definition gilt wie im Korbfilter des Buchs. */
  function hatStueck(roh) {
    var L = window.Liquide;
    if (!L || !roh) return false;
    return Object.keys(roh).some(function (s) { return L.hatUmsatz(roh[s]); });
  }

  /** Alle Werte holen und auf eine gemeinsame Zeitachse bringen.
   *  Ohne gemeinsame Achse vergleicht man Werte zu verschiedenen Zeitpunkten. */
  /** Hat der Bestand die vierte Spalte (adjclose, Auftrag Nr. 93)? Ein Bestand von davor nicht -
   *  er gilt nicht als frisch und wird einmal neu geladen (wie mf_ereignisse in Nr. 87). */
  function hatSpalte4(roh) {
    return !!roh && Object.keys(roh).some(function (s) { var r = roh[s]; return r && r.length && r[r.length - 1].length >= 4; });
  }

  /** Den Ladevorgang annehmen? (Auftrag Nr. 93, A1, rein.) Ein neuer Ladevorgang ersetzt den
   *  gespeicherten Bestand nur, wenn er fuer mindestens 120 Werte UND fuer mindestens 95 % der
   *  zuvor gelieferten Werte eine Reihe brachte; ohne gespeicherten Bestand (Erststart) gilt nur
   *  die 120. "Zuvor geliefert" sind die gespeicherten Werte, die NICHT auf weg stehen - ein Wert,
   *  der schon beim letzten Mal nur seine alte Reihe behielt, zaehlt nicht mit (sonst sammelten
   *  sich endgueltig verschwundene Werte im Nenner, bis kein Ladevorgang mehr durchkaeme). */
  function ladenAnnehmen(geliefert, gespeichert) {
    var vorher = 0;
    if (gespeichert && gespeichert.roh) {
      var wegAlt = gespeichert.weg || [];
      vorher = Object.keys(gespeichert.roh).filter(function (s) { return wegAlt.indexOf(s) < 0; }).length;
    }
    var ok = geliefert >= MIN_GELIEFERT && (!vorher || geliefert * 100 >= vorher * MIN_ANTEIL_PZ);
    return { ok: ok, geliefert: geliefert, vorher: vorher };
  }

  /** Alle Werte holen und auf eine gemeinsame Zeitachse bringen.
   *  Ohne gemeinsame Achse vergleicht man Werte zu verschiedenen Zeitpunkten.
   *  Laeuft schon ein Ladevorgang (Takt und Knopf gleichzeitig), bekommt der zweite Aufrufer
   *  dessen Ergebnis - zwei Lader hiessen doppelte Abrufe und zwei Schreiber. */
  function ladeUniversum() {
    if (LAEDT) return LAEDT;
    LAEDT = ladeUniversumEinmal();
    LAEDT.then(function () { LAEDT = null; }, function () { LAEDT = null; });
    return LAEDT;
  }
  async function ladeUniversumEinmal() {
    var roh = {}, fertig = 0;
    var gespeichert = await tagesdatenLesen();
    /* Gespeicherte Tagesdaten aus der Zeit vor dem Korbfilter tragen keine Stueckzahl.
     * Sie gelten nicht als frisch, sondern werden einmalig neu geladen - sonst staende
     * das Momentum-Buch mit "keine Stueckzahlen" still, bis der Bestand von allein
     * veraltet (20 Stunden), und niemand saehe, warum. */
    /* Dasselbe gilt seit Auftrag Nr. 87 fuer die Kapitalmassnahmen: ein Bestand aus der Zeit
     * davor hat keinen Schluessel mf_ereignisse. Er wird einmalig neu geladen - sonst
     * blieben Splits und Ausschuettungen bis zu 20 Stunden ungebucht. */
    var erAlt = await window.api.storeGet('mf_ereignisse');
    var ereignisseDa = !!erAlt;
    /* Frisch GEGEN DIE UHR (Auftrag Nr. 93, A4): geladen nach dem Schluss des juengsten Werktags,
     * dessen Schluss feststehen muss - nicht "juenger als 20 Stunden". Dazu die vierte Spalte
     * und die Bezugsreihe SPY (beide seit Nr. 93): ein Bestand ohne sie wird einmal neu geladen. */
    var frisch = gespeichert && window.MFHandel.bestandFrisch(gespeichert.at || 0, Date.now()) && hatStueck(gespeichert.roh) && ereignisseDa &&
      hatSpalte4(gespeichert.roh) && !!gespeichert.bezug;
    if (gespeichert && !frisch && gespeichert.roh && !hatStueck(gespeichert.roh)) {
      stat('Gespeicherte Tageskurse ohne Stückzahlen – lade neu, damit der Momentum-Korb nach Umsatz gefiltert werden kann …');
    } else if (gespeichert && !frisch && !ereignisseDa) {
      stat('Gespeicherte Tageskurse ohne Splits und Ausschüttungen – lade neu, damit die Bücher sie buchen können …');
    } else if (gespeichert && !frisch && (!hatSpalte4(gespeichert.roh) || !gespeichert.bezug)) {
      stat('Gespeicherte Tageskurse ohne vierte Spalte oder ohne Marktreihe SPY (Stand von vor der Umstellung, oder der SPY-Abruf scheiterte) – lade neu, damit die Rangfolge wie in der Messung rechnet …');
    }
    var gesperrt = !frisch && gespeichert && gespeichert.roh && Date.now() - FEHLVERSUCH < FEHLVERSUCH_PAUSE;
    if (frisch || gesperrt) {
      roh = gespeichert.roh;
      stat(gesperrt
        ? 'Der letzte Kursabruf war unvollständig – neuer Versuch frühestens eine Stunde danach; bis dahin gilt der gespeicherte Bestand vom ' +
          new Date(gespeichert.at).toLocaleString('de-DE') + '.'
        : 'Gespeicherte Daten von ' + new Date(gespeichert.at).toLocaleString('de-DE') + ' verwendet.');
      // Einmalige Wanderung: Liegt der Bestand noch im alten Klumpen-Format,
      // wird er beim ersten Lesen in Teile umgeschrieben.
      if (gespeichert.quelle === 'alt') await tagesdatenSchreiben(roh, gespeichert.weg, gespeichert.at);
    } else {
      var weg = [], ereignisse = {}, neu = {}, geliefert = 0, bezug = null;
      var liste = UNIVERSUM.concat([BEZUG]);
      for (var i = 0; i < liste.length; i++) {
        var r = await holeTage(liste[i]);
        if (r && liste[i] === BEZUG) bezug = { sym: BEZUG, reihe: r.reihe };
        else if (r) { neu[liste[i]] = r.reihe; ereignisse[liste[i]] = r.ereignisse; geliefert++; }
        else if (liste[i] !== BEZUG) weg.push(liste[i]);
        fertig++;
        if (fertig % 10 === 0) stat('Lade Tageskurse … ' + fertig + '/' + liste.length);
        await new Promise(function (w) { setTimeout(w, 90); });   // Quelle nicht überrennen
      }
      /* Auftrag Nr. 93 (F1, A1): der gespeicherte Bestand wird nur ersetzt, wenn der Abruf
       * GETRAGEN hat. Bis dahin wurde nach jedem Abruf geschrieben - ein Totalausfall (Rechner
       * wacht auf, das Netz ist noch nicht da) leerte den Bestand, das Buch stand zum Einstand
       * da, und der neue Stand "jetzt" galt 26 Stunden als frisch. */
      var urteil = ladenAnnehmen(geliefert, gespeichert);
      if (!urteil.ok) {
        FEHLVERSUCH = Date.now();
        roh = (gespeichert && gespeichert.roh) || {};
        stat('Kursabruf unvollständig: ' + geliefert + ' von ' + UNIVERSUM.length + ' Werten geliefert (nötig mindestens ' + MIN_GELIEFERT +
          (urteil.vorher ? ' und 95 % der ' + urteil.vorher + ' zuletzt gelieferten, also ' + Math.ceil(urteil.vorher * MIN_ANTEIL_PZ / 100) : '') + ') – ' +
          (gespeichert && gespeichert.roh ? 'der gespeicherte Bestand vom ' + new Date(gespeichert.at).toLocaleString('de-DE') + ' bleibt ganz stehen' : 'nichts gespeichert') +
          '. Neuer Versuch frühestens in einer Stunde.');
        return datenAus(roh);
      }
      /* Angenommen: ein Wert ohne Antwort behaelt seine ALTE Reihe (unveraendert - ihr letzter
       * Balken ist dann eben alt) samt seinen Ereignissen und steht auf weg. Ein Wert verschwindet
       * so nie still aus dem Bestand; haelt ihn ein Buch, bucht es ihn nach fuenf Handelstagen
       * ohne neuen Balken aus (A2, MFHandel.reihenendeAusbuchen).
       * SPY NICHT: ohne Antwort bleibt mf_bezug mit seinem ALTEN Stand stehen, tagesdatenLesen
       * liefert dann keinen Bezug, der Bestand gilt nicht als frisch, und der Takt stoesst das
       * Nachladen an. Die alte Reihe unter dem neuen Stand hiess einen Tag alte Marktreihe als
       * frisch: Faelligkeit, Stichtag und Tagespunkt einen Tag zurueck (Generalprobe 23.11., Fund D-06). */
      var altRoh = (gespeichert && gespeichert.roh) || {}, behalten = [];
      weg.forEach(function (s) {
        if (!altRoh[s]) return;
        neu[s] = altRoh[s]; behalten.push(s);
        if (erAlt && erAlt.sym && erAlt.sym[s]) ereignisse[s] = erAlt.sym[s];
      });
      roh = neu;
      await tagesdatenSchreiben(roh, weg, Date.now(), ereignisse, bezug);
      if (behalten.length) {
        stat(geliefert + ' von ' + UNIVERSUM.length + ' Werten geladen. Ohne Antwort, mit ihrer alten Reihe behalten: ' + behalten.join(', ') +
          '.' + (weg.length > behalten.length ? ' Nicht mehr abrufbar: ' + weg.filter(function (s) { return behalten.indexOf(s) < 0; }).join(', ') + '.' : ''));
        return datenAus(roh);
      }
      /* Ausgefallene Werte SICHTBAR machen, nicht still übergehen.
       *
       * Am 21.08.2026 lieferte Yahoo für BK, MMC, HES und FI nichts mehr – HES etwa ist
       * nach der Übernahme durch Chevron von der Börse. Bisher fielen solche Werte
       * wortlos aus der Liste, und das Universum bestand still aus lauter Überlebenden.
       * Genau diese Verzerrung frisst hier seit Monaten Messergebnisse: In der schwachen
       * Hälfte der Werte bleibt vom Ergebnis-Drift kaum etwas übrig, in der starken das
       * meiste. Wer nicht sieht, dass Werte verschwinden, hält sein Universum für
       * vollständig. */
      stat(Object.keys(roh).length + ' von ' + UNIVERSUM.length + ' Werten geladen.' +
        (weg.length ? '  Nicht mehr abrufbar: ' + weg.join(', ') +
          ' – vermutlich übernommen oder umbenannt. Das Universum besteht damit aus Überlebenden, ' +
          'was gemessene Vorsprünge nach oben verzerrt.' : ''));
    }
    return datenAus(roh);
  }
  /** Die gemeinsame Zeitachse fuer die Rechnung dieses Tabs (rechnen: Rangfolge und Durchlauf
   *  ueber die ganze Historie). Sie liest die VIERTE Spalte (adjclose, Index 3), sonst Spalte 1:
   *  ihre Messung - die alte Studie ueber 197 Werte gegen den Durchschnitt derselben Werte - lief
   *  auf dem bereinigten Kurs dieses Laders, also mit Ausschuettungen (Auftrag Nr. 93, A3; das
   *  Buch selbst liest Spalte 1). */
  function datenAus(roh) {
    var syms = Object.keys(roh);
    if (syms.length < 30) return null;
    var zaehler = {};
    syms.forEach(function (s) { roh[s].forEach(function (b) { zaehler[b[0]] = (zaehler[b[0]] || 0) + 1; }); });
    var zeiten = Object.keys(zaehler).map(Number).filter(function (t) { return zaehler[t] >= 30; }).sort(function (a, b) { return a - b; });
    var idx = {}; zeiten.forEach(function (t, i) { idx[t] = i; });
    var map = {};
    syms.forEach(function (s) {
      var a = new Array(zeiten.length).fill(null);
      roh[s].forEach(function (b) { var i = idx[b[0]]; if (i !== undefined) a[i] = b[3] > 0 ? b[3] : b[1]; });
      map[s] = a;
    });
    return { syms: syms, zeiten: zeiten, map: map };
  }

  function zeigeRang() {
    var el = document.getElementById('mfRang');
    if (!DATEN) { el.innerHTML = '<div class="empty">Noch keine Daten.</div>'; return; }
    var o = opts();
    var i = DATEN.zeiten.length - 1;
    var aus = M.auswahl(DATEN.map, i, o);
    var rang = M.rangfolge(DATEN.map, i, o);
    if (!aus || !rang) { el.innerHTML = '<div class="empty">Zu wenige Werte für eine Rangfolge.</div>'; return; }
    var stand = new Date(DATEN.zeiten[i]).toLocaleDateString('de-DE');
    el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:8px;">Stand ' + stand +
      ' · stärkste ' + Math.round(o.anteil * 100) + ' % von ' + rang.length + ' Werten · Rückblick ' +
      o.rueckblick + ' Tage ohne die letzten ' + o.luecke + '</div>' +
      '<table class="tbl"><thead><tr><th>#</th><th>Wert</th><th style="text-align:right;">Stärke</th></tr></thead><tbody>' +
      aus.map(function (x, k) {
        return '<tr><td>' + (k + 1) + '</td><td><b>' + U.esc(x.sym) + '</b></td><td style="text-align:right;" class="' +
          U.signCls(x.staerke) + '">' + U.signTxt(x.staerke * 100, ' %') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:8px;">Die Schwächsten zum Vergleich: ' +
      rang.slice(-5).map(function (x) { return U.esc(x.sym) + ' ' + Math.round(x.staerke * 100) + ' %'; }).join(', ') + '</div>';
  }

  /* Der PRUEFZEITRAUM ist die einzige ehrliche Zahl.
   * Die Parameter (Rueckblick 231, Luecke 21, Halten 63, staerkste 10 %) wurden auf
   * 1970-2004 ausgesucht. Wer sie danach auf demselben Zeitraum misst, misst sich
   * selbst - das Ergebnis ueber die ganze Historie sieht deshalb viel besser aus, als
   * es ist. Angezeigt wird deshalb zuerst 2005-2026, wo nichts mehr angepasst wurde;
   * die Gesamthistorie steht darunter, ausdruecklich als das gekennzeichnet, was sie
   * ist. */
  var PRUEFJAHR = 2005;
  function zeigeErgebnis() {
    var el = document.getElementById('mfErgebnis');
    if (!DATEN) { el.innerHTML = '<div class="empty">Noch keine Daten.</div>'; return; }
    var o = opts();
    var jahrVon = function (i) { return new Date(DATEN.zeiten[Math.min(i, DATEN.zeiten.length - 1)]).getFullYear(); };
    var startPruef = DATEN.zeiten.findIndex(function (t) { return new Date(t).getFullYear() >= PRUEFJAHR; });
    var d = M.durchlauf(DATEN.map, Object.assign({}, o, { start: Math.max(startPruef, o.rueckblick + o.luecke + 10), jahrVon: jahrVon }));
    var dAll = M.durchlauf(DATEN.map, Object.assign({}, o, { start: o.rueckblick + o.luecke + 10, jahrVon: jahrVon }));
    if (!d) { el.innerHTML = '<div class="empty">Zu wenige Daten für einen Durchlauf.</div>'; return; }
    var vorsprung = d.proJahr - d.marktProJahr;
    var jahre = Object.keys(d.jahre).map(Number).sort(function (a, b) { return a - b; });
    var besser = 0, vk = 1, vm = 1;
    var zeilen = jahre.map(function (j) {
      var rk = (d.jahre[j].depot / vk - 1) * 100, rm = (d.jahre[j].markt / vm - 1) * 100;
      vk = d.jahre[j].depot; vm = d.jahre[j].markt;
      if (rk > rm) besser++;
      return '<tr><td>' + j + '</td><td style="text-align:right;" class="' + U.signCls(rk) + '">' + U.signTxt(rk, ' %') +
        '</td><td style="text-align:right;" class="' + U.signCls(rm) + '">' + U.signTxt(rm, ' %') + '</td></tr>';
    });
    el.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">Rückrechnung ab ' + PRUEFJAHR +
        ' auf heute gelisteten Großwerten (nur Überlebende) – kein Prüfzeitraum im Sinne einer Bestätigung. Belegstand zum Monats-Momentum: <b>nicht entscheidbar</b>.</div>' +
      '<dl class="kv">' +
      '<dt>Depot</dt><dd><b>' + d.kapital.toFixed(1) + '×</b> (' + U.signTxt(d.proJahr, ' % p. a.') + ')</dd>' +
      '<dt>Marktdurchschnitt</dt><dd>' + d.markt.toFixed(1) + '× (' + U.signTxt(d.marktProJahr, ' % p. a.') + ')</dd>' +
      '<dt>Vorsprung</dt><dd class="' + U.signCls(vorsprung) + '"><b>' + U.signTxt(vorsprung, ' Prozentpunkte im Jahr') + '</b></dd>' +
      '<dt>Größter Rückschlag</dt><dd>' + d.rueckschlag.toFixed(0) + ' %</dd>' +
      '<dt>Umschichtungen</dt><dd>' + d.schritte + ' · je ' + Math.round(d.umschlag * 100) + ' % des Depots getauscht</dd>' +
      '<dt>Bessere Jahre</dt><dd>' + besser + ' von ' + jahre.length + '</dd>' +
      '</dl>' +
      (dAll ? '<div style="font-size:var(--fs-neben); color:var(--muted); border-top:1px solid var(--grid); padding-top:8px; margin-top:4px;">' +
        'Über die <b>gesamte</b> Historie ab ' + new Date(DATEN.zeiten[0]).getFullYear() + ': ' + dAll.kapital.toFixed(0) + '× (' +
        U.signTxt(dAll.proJahr, ' % p. a.') + ') gegen ' + dAll.markt.toFixed(0) + '× (' + U.signTxt(dAll.marktProJahr, ' % p. a.') + '). ' +
        'Auch diese Zahl rechnet nur auf heute gelisteten Werten (Überlebende) – sie taugt nicht als Beleg.</div>' : '') +
      '<div style="max-height:240px; overflow:auto; margin-top:8px;">' +
      '<table class="tbl"><thead><tr><th>Jahr</th><th style="text-align:right;">Depot</th><th style="text-align:right;">Markt</th></tr></thead><tbody>' +
      zeilen.join('') + '</tbody></table></div>';
  }

  async function rechnen() {
    var btn = document.getElementById('mfLadenBtn');
    btn.disabled = true;
    try {
      if (!DATEN) {
        stat('Lade Tageskurse …');
        DATEN = await ladeUniversum();
        if (!DATEN) { stat('Zu wenige Werte geladen – Quelle nicht erreichbar?'); return; }
      }
      stat(DATEN.syms.length + ' Werte · ' + DATEN.zeiten.length + ' Handelstage · rechne …');
      zeigeRang();
      zeigeErgebnis();
      stat(DATEN.syms.length + ' Werte · ' + DATEN.zeiten.length + ' Handelstage · ' +
        new Date(DATEN.zeiten[0]).getFullYear() + ' bis ' + new Date(DATEN.zeiten[DATEN.zeiten.length - 1]).getFullYear());
    } catch (e) {
      stat('Fehler: ' + (e && e.message ? e.message : e));
    } finally { btn.disabled = false; }
  }

  /* ---- Live = Messung (Oberflaeche Stufe 3, 03.09.2026) ----
   * Die vier Fenster-Felder waren frei waehlbar. Wer eines verstellte, rechnete eine
   * ANDERE Konfiguration als die, die das Momentum-Buch wirklich handelt - und sah das
   * Ergebnis unter derselben Ueberschrift. Die Felder bleiben im DOM (opts() liest sie
   * weiter, und die Kennungen sind Schnittstelle), sind aber gesperrt und werden hier
   * aus der Konfiguration des Buchs gefuellt: erst das, was im Buch steht
   * (D.mfBuch.konfig), sonst die gemessene Fassung aus MFHandel.buchKonfig(). Aus dem
   * Markup kommt keine dieser Zahlen.
   * AUSNAHME und bewusst so: die Kosten je Seite (#mfKosten). Sie stehen nicht in der
   * gemerkten Konfiguration, sondern als Zahl im Aufruf von MFHandel.fuehreAus in
   * mfdepot.js takt() - Handelscode, der in dieser Stufe nicht angefasst wird. Das Feld
   * behaelt deshalb seinen Markup-Wert; eine Sperrklinke in test-v6.js haelt ihn gegen
   * genau diese Zahl, damit die Anzeige nicht still von der Ausfuehrung abdriftet. */
  function konfigZeigen() {
    var k = null;
    var d = window.__D ? window.__D() : null;
    if (d && d.mfBuch && d.mfBuch.konfig) k = d.mfBuch.konfig;
    else if (window.MFHandel && window.MFHandel.buchKonfig) k = window.MFHandel.buchKonfig();
    if (!k) return;
    setzen('mfRueck', k.rueckblick);
    setzen('mfLuecke', k.luecke);
    setzen('mfHalten', k.halten);
    setzen('mfAnteil', k.anteil);
  }
  /* Ein Wert, den die Auswahlliste gar nicht kennt, wird NICHT stillschweigend
   * verschluckt: dann bekaeme das Feld den ersten Eintrag und zeigte etwas anderes,
   * als das Buch rechnet. Er wird als Eintrag ergaenzt und ausgewaehlt.
   * Verglichen wird als ZAHL, nicht als Text: das Feld schreibt "0.10", die
   * Konfiguration liefert 0.1 - als Text waeren das zwei verschiedene Werte, und die
   * Liste bekaeme einen zweiten Eintrag fuer dasselbe Zehntel. */
  function setzen(id, wert) {
    var e = document.getElementById(id);
    if (!e || wert == null) return;
    var treffer = Array.prototype.filter.call(e.options, function (o) {
      return o.value === String(wert) || (o.value !== '' && Number(o.value) === Number(wert));
    })[0];
    if (treffer) { e.value = treffer.value; return; }
    var o2 = document.createElement('option');
    o2.value = String(wert); o2.textContent = String(wert) + ' (aus der Konfiguration des Buchs)';
    e.appendChild(o2);
    e.value = o2.value;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('mfLadenBtn');
    if (btn) btn.addEventListener('click', rechnen);
    konfigZeigen();
    ['mfRueck', 'mfLuecke', 'mfHalten', 'mfAnteil', 'mfKosten'].forEach(function (id) {
      var e = document.getElementById(id);
      // Nach dem ersten Laden reicht Neurechnen - die Kurse sind schon da
      if (e) e.addEventListener('change', function () { if (DATEN) { zeigeRang(); zeigeErgebnis(); } });
    });
  });
  /* Beim Start ist das Depot noch nicht geladen; der Buch-Stand kommt erst danach.
   * Dasselbe Ereignis, das die Bestand-Karten zeichnet, holt die Felder nach. */
  document.addEventListener('tab-changed', konfigZeigen);
  /* Oberflaeche Stufe 4b (03.09.2026): Der Block wohnt jetzt als Klappe unter
   * Werkzeuge -> Betrieb. Die Shell meldet das AUFklappen als 'sub-changed' mit dem
   * Namen aus data-klappe (Muster aus Stufe 1) - dasselbe Ereignis, das frueher der
   * Pillenwechsel schickte. Der Reiterwechsel allein traegt nicht: wer schon auf
   * Werkzeuge steht und erst danach das Depot laedt, saehe sonst die Felder von vor
   * dem Laden. Geholt wird nichts, gelesen wird nur der Buch-Zustand. */
  document.addEventListener('sub-changed', function (ev) {
    if (ev.detail && ev.detail.sub === 'mittelfrist') konfigZeigen();
  });
  if (typeof window !== 'undefined') window.__mfRechnen = rechnen;
  // Nach aussen: das Mittelfrist-Depot (mfdepot.js) stoesst hierueber den taeglichen
  // Kursabruf an, statt den Lader zu duplizieren - zwei Lader hiessen zwei Wahrheiten.
  window.MF = { ladeUniversum: ladeUniversum, tagesdatenLesen: tagesdatenLesen,
    /* Auftrag Nr. 93 (A1): die Annahme-Regel, damit die Karte und die Tests sie lesen koennen */
    ladenAnnehmen: ladenAnnehmen, fehlversuch: function () { return FEHLVERSUCH; } };
})();
