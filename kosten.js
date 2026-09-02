'use strict';
/* ========= Echte Handelskosten und Spannen (Capital.com-Demo CFD + Alpaca-Paper Aktie) =========
 *
 * Seit 02.09.2026 zwei GEFAESSE (Wilhelms Entscheid, wiki/entscheide.md): das Capital.com-Demo
 * misst CFD-Runden, das Alpaca-Paper-Konto echte US-Aktien. Jede Runde traegt gefaess:
 * 'capital' | 'alpaca'; Bilanz und Anzeige trennen sie, die Aktienhuerde (0,06 Pp) wird
 * NUR an Alpaca-Runden geprueft, die CFD-Huerde (0,10 %) nur an Capital-Runden.
 *
 * Stufe E des Struktur-Plans, Block 6: WOERTLICH aus depot.js umgezogen - die
 * Kostenrunden-Messung, die Spannen-Erfassung (Quote-Proben, Kerzen-Erfassung,
 * Tagesbilanz) und ihre Bilanzen. Gemessen wird, was ein Umlauf wirklich kostet -
 * die Zahl, an der fast jede Studie haengt.
 *
 * depot.js behaelt Aliase (spanneStempeln, kostenMessungNeu, ...) - der Handelspfad
 * (openTrade/closeTrade/intradayScan) bleibt dadurch woertlich unveraendert.
 * istKrypto bleibt ausdruecklich beim Handelsmodul: zwoelf Aufrufstellen im
 * Handelspfad, und die Funktion existierte schon einmal doppelt - eine zweite
 * Fassung darf nie wieder entstehen. Der Depot-Zustand kommt als GETTER (D wird beim
 * Depot-Reset neu zugewiesen); HEALTH ist eine stabile Referenz und kommt einmalig.
 * Die Sitzungs-Timer der Spannen-Messung bleiben beim Scheduler in init(). */
(function () {
  /* Von depot.js hereingereicht (verkabeln). */
  var holeDepot = null, save = null, melde = null, universe = null,
      istKrypto = null, HEALTH = null, marktlageLesen = null;
  /* Fuer das Aktien-Gefaess: die Werte, die die App heute handeln wuerde, die
   * Tagesdaten des Mittelfrist-Tabs (Schluss x Stueck) und der Kurslader. */
  var kandidatenAlpaca = null, mfTagesdaten = null, kurseHolen = null;
  var D = null;

  /* ===== Umsatzklassen der Aktien-Kostenmessung (Wiedervorlage 02.09.2026, BERICHT §2.3) =====
   * EINE Stelle, NOMINAL in $ Median-Tagesumsatz - Schluss x Stueck ueber 20 Balken, die
   * Umsatzregel des Hauses aus liquide.js (nicht neu erfunden). 'ab1000' ist die Kontrolle
   * mit Anschluss an die Capital-Messung (dort ausnahmslos >= 1,6 Mrd $). Unter 5 Mio $
   * gibt es keine Klasse: dort laesst keine Regel des Hauses ein Signal zu. */
  var UMSATZ_KLASSEN = [
    { name: '5-50',     von: 5e6,   bis: 50e6 },
    { name: '50-250',   von: 50e6,  bis: 250e6 },
    { name: '250-1000', von: 250e6, bis: 1e9 },
    { name: 'ab1000',   von: 1e9,   bis: Infinity }
  ];
  var KLASSE_MINDEST = 10;      // Runden je Klasse, Ziel der Messung (BERICHT §2.3: je >= 10)
  var ALP_ZIEL_USD = 200;       // Gegenwert je Runde; Stueckzahl ganzzahlig, mindestens 1
  var ALP_ANNAHME_PCT = 0.06;   // die Aktien-Kostenannahme, die hier ersetzt werden soll (Pp je Umlauf)
  function umsatzKlasse(medianUsd) {
    if (!(medianUsd >= 0) || !isFinite(medianUsd)) return null;
    for (var i = 0; i < UMSATZ_KLASSEN.length; i++) {
      if (medianUsd >= UMSATZ_KLASSEN[i].von && medianUsd < UMSATZ_KLASSEN[i].bis) return UMSATZ_KLASSEN[i].name;
    }
    return null;
  }
  function istAlpaca(r) { return !!r && r.gefaess === 'alpaca'; }
  function gefaessVon(r) { return (r && r.gefaess) || 'capital'; }

  /* ============ Reset-festes Nebenlager der Messreihe (Wilhelms Entscheid 27.08.) ============
   * Die Kostenrunden lagen im Depot-Store und wurden von jedem Depot-Reset mit
   * abgetrennt: am 27.08. standen 38 gesicherte Runden neben EINER im aktiven
   * Store, und wer die Auswertung anfasste, rechnete auf der einen - ohne
   * Fehlermeldung, die Datenbasis war nur still weg. Die Reihe wohnt jetzt im
   * eigenen Store 'kostenmessung' (eigene Datei, atomar geschrieben, rotierend
   * gesichert), den der Reset-Knopf nie anfasst. Die geretteten 38 vom 25.08.
   * bleiben unangetastet in der Sicherung - Archivmaterial, kein Rueckspielen
   * (die App laeuft und schreibt; ausserdem waere die Schwelle mit einem
   * Ein-Tages-Bestand ohnehin nicht erfuellt). Mitgenommen wird beim ersten
   * Laden nur, was der AKTIVE Depot-Store noch traegt, rein lesend und ohne
   * Dubletten. Das Versuchs-Protokoll (kostenVersuche, rollierend 30) bleibt
   * bewusst beim Depot: Diagnose, kein Beleg. */
  var MESSUNG = null;
  var messungLadenP = null;
  function messungMischen(geladen, frueh, depotAlt) {
    var m = (geladen && Array.isArray(geladen.runden)) ? geladen : { seit: Date.now(), runden: [] };
    var da = {};
    m.runden.forEach(function (r) { da[r.at + '|' + r.sym] = 1; });
    [frueh, depotAlt].forEach(function (liste) {
      (liste || []).forEach(function (r) {
        var k = r.at + '|' + r.sym;
        if (!da[k]) { da[k] = 1; m.runden.push(r); }
      });
    });
    /* Migration 02.09.2026: Runden aus der Zeit vor dem zweiten Gefaess stammen alle
     * vom Capital.com-Demo - sie tragen das Feld jetzt ausdruecklich. Die Zahl geht als
     * Merkmal am Ergebnis mit (der Lader liest und loescht es), damit diese Funktion
     * fuer sich allein lauffaehig bleibt - test-v6 fuehrt sie herausgeloest aus. */
    var nachgetragen = 0;
    m.runden.forEach(function (r) { if (!r.gefaess) { r.gefaess = 'capital'; nachgetragen++; } });
    if (!Array.isArray(m.verworfen)) m.verworfen = [];
    if (m.uebernacht === undefined) m.uebernacht = null;
    m.runden.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    if (m.runden.length > 300) m.runden = m.runden.slice(0, 300);
    m.nachgetragen = nachgetragen;
    return m;
  }
  function messungHolen() {
    if (messungLadenP) return messungLadenP;
    if (!(window.api && window.api.storeGet)) {
      if (!MESSUNG) MESSUNG = { seit: Date.now(), runden: [] };
      messungLadenP = Promise.resolve(MESSUNG);
      return messungLadenP;
    }
    messungLadenP = window.api.storeGet('kostenmessung').then(function (v) {
      var frueh = MESSUNG ? MESSUNG.runden : [];
      /* Das Depot kommt hier ueber holeDepot(), NICHT aus dem Modul-D. Das Modul-D fuellt
       * allein mitFrischemD() an den oeffentlichen Einstiegen; verkabeln() ruft messungHolen()
       * aber schon davor, und danach steht messungLadenP - der Lauf findet also nie wieder
       * statt. Wer hier D liest, liest beim einzigen Lauf immer null: der Migrationspfad
       * besteht, feuert nie und meldet dabei keine Null, sondern gar nichts ("Nullbefund vom
       * toten Werkzeug", wiki/fehlerformen.md; gefunden 03.09.2026, drei echte Runden aus
       * depot.json lagen still da). Geaendert ist damit allein die HERKUNFT des Depots, keine
       * Rechenregel - was uebernommen wird, entscheidet unveraendert messungMischen(). */
      var dJetzt = D;
      try { if (holeDepot) dJetzt = holeDepot(); } catch (eD) { dJetzt = D; }
      var depotAlt = (dJetzt && dJetzt.kostenMessung && Array.isArray(dJetzt.kostenMessung.runden)) ? dJetzt.kostenMessung.runden : [];
      MESSUNG = messungMischen(v, frueh, depotAlt);
      var nachgetragen = MESSUNG.nachgetragen || 0;
      delete MESSUNG.nachgetragen;
      if (frueh.length || depotAlt.length || nachgetragen) messungSchreiben();
      return MESSUNG;
    }).catch(function () {
      if (!MESSUNG) MESSUNG = { seit: Date.now(), runden: [] };
      return MESSUNG;
    });
    return messungLadenP;
  }
  function messungSchreiben() {
    try { if (window.api && window.api.storeSet) window.api.storeSet('kostenmessung', MESSUNG); }
    catch (e) { /* der Wert bleibt im Speicher; der naechste Eintrag schreibt erneut */ }
  }
  function rundeAblegen(eintrag) {
    if (!MESSUNG) { MESSUNG = { seit: Date.now(), runden: [] }; messungHolen(); }
    MESSUNG.runden.unshift(eintrag);
    if (MESSUNG.runden.length > 300) MESSUNG.runden = MESSUNG.runden.slice(0, 300);
    messungSchreiben();
  }
  /** Verworfene Runden - Teilfuellung, Zeitlimit, Auktion ohne Fuellung. Kein Beleg,
   *  aber ein Protokoll: ohne das stuende nach einem Tag mit fuenf Teilfuellungen NICHTS
   *  in den Daten, und niemand koennte nachlesen, warum die Klasse leer blieb. */
  function verworfenAblegen(eintrag) {
    if (!MESSUNG) { MESSUNG = { seit: Date.now(), runden: [] }; messungHolen(); }
    if (!Array.isArray(MESSUNG.verworfen)) MESSUNG.verworfen = [];
    MESSUNG.verworfen.unshift(eintrag);
    if (MESSUNG.verworfen.length > 100) MESSUNG.verworfen = MESSUNG.verworfen.slice(0, 100);
    messungSchreiben();
  }
  /** Die Runden fuer Bilanz, Streuung und Anzeige - aus dem Nebenlager. Solange
   *  es noch nicht geladen ist, traegt der alte Depot-Ort ueber (nur lesend). */
  function kostenRunden() {
    if (!MESSUNG) {
      messungHolen();
      return (D && D.kostenMessung && D.kostenMessung.runden) || [];
    }
    return MESSUNG.runden;
  }

  /* ================= Echte Handelskosten (Capital.com-Demo) =================
   * Alle Studien dieses Projekts rechnen mit der ANNAHME 0,10 % je Runde. Die
   * Demo-Anbindung ist die einzige Stelle mit echten Ausfuehrungen - bisher warf
   * sie den Fuellkurs weg (Inventur 22.08.2026). Jetzt wird je Trade gemessen,
   * was Ein- und Ausstieg WIRKLICH gekostet haben, und gegen die Annahme gestellt.
   * Reine Messung: die Studien bleiben unveraendert, bis genug Runden vorliegen. */
  function kostenMessungNeu(p) {
    if (p.capSlipOpen == null || p.capSlipClose == null) return;   // erst vollstaendige Runden zaehlen
    rundeAblegen({
      at: Date.now(), sym: p.sym, dir: p.dir, basis: !!p.basis, gefaess: 'capital',
      /* Ohne dieses Feld zaehlte eine gespiegelte Krypto-Runde als Aktie -
       * dieselbe Verwechslung, die den Zaehler am 27.08. 22 Krypto-Runden
       * als Basiswerte fuehren liess. */
      krypto: istKrypto ? !!istKrypto(p.sym) : false,
      slipOpen: Math.round(p.capSlipOpen * 1e6) / 1e6,
      slipClose: Math.round(p.capSlipClose * 1e6) / 1e6,
      runde: Math.round((p.capSlipOpen + p.capSlipClose) * 1e6) / 1e6
    });
  }
  /** Warum die Spiegelung aufs Demo-Konto scheiterte - dauerhaft, nicht nur im
   *  Arbeitsspeicher. HEALTH.capFail zaehlt mit, ist aber beim naechsten Start weg,
   *  und der Grund wurde bisher weggeworfen. Ohne gespiegelte Positionen gibt es
   *  keine echten Ausfuehrungen, ohne die keine Messung der echten Handelskosten -
   *  und die entscheidet ueber fast jede Studie. Ein Fehlschlag, den niemand sieht,
   *  wird nicht behoben. */
  function capFehlerNeu(sym, r) {
    if (!D) return;
    if (!D.capFehler) D.capFehler = [];
    D.capFehler.unshift({
      at: Date.now(), sym: sym,
      msg: String((r && (r.msg || r.error)) || 'ohne Angabe').slice(0, 200)
    });
    if (D.capFehler.length > 50) D.capFehler = D.capFehler.slice(0, 50);
  }

  /** Die Spanne eines Wertes JETZT - Median der juengsten Proben aus den letzten 45
   *  Minuten. Ein einzelner Abruf kann eine hektische Sekunde erwischen; der Median
   *  ueber mehrere Proben ist die ehrlichere Zahl. Gibt null, wenn nichts vorliegt -
   *  dann wird auch nichts behauptet. */
  function spanneJetzt(sym) {
    var sp = D && D.spannen;
    if (!sp || !sp.proben || !sp.proben.length) return null;
    var grenze = Date.now() - 45 * 60000;
    var w = [];
    for (var i = 0; i < sp.proben.length; i++) {
      var p = sp.proben[i];
      if (p.at < grenze) break;              // Puffer ist absteigend sortiert
      if (p.sym === sym) w.push(p.spreadPct);
    }
    if (!w.length) return null;
    w.sort(function (a, b) { return a - b; });
    return w[Math.floor(w.length / 2)];
  }

  /** Die notierte Spanne an einen Trade heften - beim Oeffnen und beim Schliessen.
   *
   *  WARUM NICHT ueber die Demo-Spiegelung: kostenMessungNeu misst den echten
   *  Schlupf, feuert aber nur bei gespiegelten Positionen. Am 25.08.2026 hatte keine
   *  einzige offene Position eine capDealId, die Messung stand auf 0 Runden. Diese
   *  Aufzeichnung haengt an nichts ausser der laufenden Spannen-Probe und faellt
   *  deshalb immer an. Sie ist die halbe Rechnung, nicht die ganze - der Schlupf
   *  zwischen Anzeige und Ausfuehrung bleibt ungemessen, solange nicht gespiegelt
   *  wird. Das gehoert bei jeder Auswertung dazugesagt. */
  function spanneStempeln(tr, phase) {
    if (!tr || !tr.sym) return;
    var s = spanneJetzt(tr.sym);
    if (s == null) return;
    var pct = Math.round(s * 1e6) / 1e6;
    if (phase === 'open') tr.spanneAuf = pct;
    else {
      tr.spanneZu = pct;
      if (tr.spanneAuf != null) tr.spanneRunde = Math.round((tr.spanneAuf + pct) * 1e6) / 1e6;
    }
  }

  /** Bilanz der gemessenen Geld-Brief-Spannen. Erst je Wert den Median (eine
   *  hektische Minute soll ein Symbol nicht praegen), dann ueber die Werte - so
   *  zaehlt jeder Wert gleich, nicht der am haeufigsten abgefragte. */
  function spannenBilanz() {
    var sp = D && D.spannen;
    if (!sp || !sp.proben || sp.proben.length < 10) return null;
    var jeSym = {};
    sp.proben.forEach(function (p) { (jeSym[p.sym] = jeSym[p.sym] || []).push(p.spreadPct); });
    var med = function (a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; };
    var symMed = Object.keys(jeSym).map(function (s) { return med(jeSym[s]); });
    if (symMed.length < 3) return null;
    var alle = symMed.slice().sort(function (a, b) { return a - b; });
    return {
      proben: sp.proben.length, werte: symMed.length,
      medianPct: med(symMed) * 100,
      engstesPct: alle[0] * 100,
      weitestesPct: alle[alle.length - 1] * 100,
      annahmePct: 0.10, seit: sp.seit
    };
  }
  if (typeof window !== 'undefined') window.__spannenBilanz = spannenBilanz;

  /** Tagesmediane der Geld-Brief-Spanne aus Archiv-Kerzen in D.spannen.tage falten.
   *
   *  Woher: capital.js/pricesRange haengt die Spanne je Kerze an Element [5]. Der
   *  Backfill holt diese Kerzen ohnehin - die Spanne kostet keinen Abruf extra, sie
   *  wurde bis zum 25.08.2026 nur weggeworfen.
   *
   *  WARUM GETRENNT GEFUEHRT: Die Live-Proben (spannenProbe, alle 8 Minuten) sind
   *  Quote-Schnappschuesse, diese hier sind Kerzenschluss-Bid/Ask. Beide von
   *  Capital.com, beide auf denselben Epics - aber NICHT dieselbe Messung. Deshalb
   *  traegt ein aus Kerzen gewonnener Tag die Kennung q:"kerze", und er ueberschreibt
   *  NIE einen aus Live-Proben gewonnenen. Beides in einen Topf zu werfen waere
   *  "Zwei Quellen in einer Reihe" ein zweites Mal - diesmal in der Zahl, an der die
   *  Kostenhuerde jeder Studie haengt.
   *
   *  Erwartet SITZUNGSGEFILTERTE Kerzen. Capital liefert an Feiertagen und nach dem
   *  Halbtagsschluss weiter Bars; deren Spanne ist weit und misst nichts, was ein
   *  Handelssignal je zahlen wuerde. */
  function spannenAusKerzen(sym, bars) {
    if (!D || !sym || !bars || !bars.length) return 0;
    /* EIN FEHLER, DER KEINEN FEHLER ERZEUGT, war hier die eigentliche Gefahr.
     * Faellt die Verdrahtung weg - etwa weil archiv.js nicht mehr im Paket liegt -,
     * sammelte diese Funktion lautlos nichts: kein Wurf, kein roter Test, nur eine
     * Messreihe, die leer bleibt und erst auffaellt, wenn jemand sie vermisst.
     * Genau so ist hier schon einmal ein ganzes Modul aus dem Installationspaket
     * gefallen und erst beim Anwender aufgefallen.
     *
     * Ein Wurf waere trotzdem falsch: er wuerde den naechtlichen Backfill abbrechen,
     * der ausser der Spanne auch das Kursarchiv fuellt. Also zaehlen und EINMAL
     * melden - dasselbe Muster wie HEALTH.saveFail. */
    if (!window.Archiv || typeof window.Archiv.spannenJeTag !== 'function') {
      HEALTH.spannenVerdrahtung = (HEALTH.spannenVerdrahtung || 0) + 1;
      if (HEALTH.spannenVerdrahtung === 1) {
        melde('Spannen-Erfassung ausgefallen',
          'archiv.js/spannenJeTag ist nicht erreichbar. Die Geld-Brief-Spanne wird nicht mehr ' +
          'mitgeschrieben - die Kostenannahme von 0,10 % bleibt damit unbelegt. Das Kursarchiv ' +
          'selbst fuellt sich weiter.');
      }
      return 0;
    }
    var jeTag = window.Archiv.spannenJeTag(bars);
    var tage = Object.keys(jeTag);
    /* Kerzen kamen an, aber keine trug eine Spanne. Das ist NICHT dasselbe wie "keine
     * Kerzen": dann liefert die Quelle ihr ask-Feld nicht mehr, und jede weitere Runde
     * waere vergebens, ohne dass es irgendwo auffiele.
     *
     * Erst ab der fuenften Runde IN FOLGE gemeldet: ein einzelner Wert ohne Briefkurs
     * ist ein Einzelfall, kein Befund. Jeder Erfolg setzt den Zaehler zurueck - gemeldet
     * wird nur, was anhaelt. */
    if (!tage.length) {
      HEALTH.spannenOhneFeld = (HEALTH.spannenOhneFeld || 0) + 1;
      if (HEALTH.spannenOhneFeld === 5) {
        melde('Kerzen ohne Geld-Brief-Spanne',
          'Fuenf Abrufe in Folge lieferten Kerzen, aber keine Briefkurse (zuletzt ' + sym +
          ', ' + bars.length + ' Kerzen). Die Spannen-Historie waechst dadurch nicht weiter.');
      }
      return 0;
    }
    HEALTH.spannenOhneFeld = 0;
    if (!D.spannen) D.spannen = { proben: [], seit: Date.now() };
    if (!D.spannen.tage) D.spannen.tage = {};
    var neu = 0;
    for (var i = 0; i < tage.length; i++) {
      var tag = D.spannen.tage[tage[i]] = D.spannen.tage[tage[i]] || {};
      var da = tag[sym];
      if (da && da.q !== 'kerze') continue;          // die Live-Messung hat Vorrang
      tag[sym] = { n: jeTag[tage[i]].n, med: jeTag[tage[i]].med, q: 'kerze' };
      neu++;
    }
    HEALTH.spannenTage = (HEALTH.spannenTage || 0) + neu;
    return neu;
  }

  /** Was die Kerzen-Historie ueber die Spanne sagt - getrennt von der Live-Messung.
   *  Erst je Wert den Median ueber alle Tage, dann die Verteilung ueber die Werte:
   *  ein Wert mit vielen Tagen soll die Aussage nicht dominieren.
   *
   *  "streuung" ist die Zahl, wegen der das hier steht: das Verhaeltnis des weitesten
   *  zum engsten Wert. Es stand bisher als geschaetzte 1,35 in den Studien. */
  function spannenHistorie() {
    var sp = D && D.spannen;
    if (!sp || !sp.tage) return null;
    var jeSym = {}, tage = 0;
    Object.keys(sp.tage).forEach(function (d) {
      var tag = sp.tage[d], drin = false;
      Object.keys(tag).forEach(function (sy) {
        var e = tag[sy];
        if (!e || e.q !== 'kerze' || !isFinite(e.med)) return;
        (jeSym[sy] = jeSym[sy] || []).push(e.med); drin = true;
      });
      if (drin) tage++;
    });
    var syms = Object.keys(jeSym);
    if (syms.length < 3 || tage < 2) return null;
    function med(a) { var x = a.slice().sort(function (p, q) { return p - q; }); return x[Math.floor(x.length / 2)]; }
    var symMed = syms.map(function (sy) { return med(jeSym[sy]); }).sort(function (a, b) { return a - b; });
    return {
      tage: tage, werte: syms.length,
      medianPct: med(symMed) * 100,
      engstesPct: symMed[0] * 100,
      weitestesPct: symMed[symMed.length - 1] * 100,
      streuung: symMed[0] > 0 ? symMed[symMed.length - 1] / symMed[0] : null
    };
  }
  if (typeof window !== 'undefined') window.__spannenHistorie = spannenHistorie;

  /** EINE Messrunde: kleinste Position oeffnen, sofort schliessen, beide
   *  Ausfuehrungskurse gegen die Mitte halten. Das misst, was ein Umlauf WIRKLICH
   *  kostet - Spanne plus Schlupf - ohne auf ein Signal zu warten.
   *
   *  Warum es das gibt: Die Messung aus echten Trades stand am 25.08.2026 auf 0
   *  Runden und waere dort geblieben. Die Stunden-Strategie spiegelt nicht, und der
   *  Intraday-Arm ist seit dem 23.08. vom Edge-Waechter pausiert. Der Schutz
   *  verhindert genau die Messung, die ueber ihn entscheiden wuerde. Die Kostenfrage
   *  hat mit der Strategie aber gar nichts zu tun - also wird sie getrennt gemessen.
   *
   *  Setzt ECHTE Orders auf dem Demo-Konto ab. Wird nur von Hand ausgeloest. */

  /** Jeder Versuch einer Messrunde - auch der, der an einer Sperre endet.
   *  Ohne das steht nach einem Klick unter Umstaenden NICHTS in den Daten, und der
   *  Grund lebt nur in einer Statuszeile, die beim naechsten Neuzeichnen weg ist.
   *  Genau daran war am 25.08.2026 nicht nachvollziehbar, warum ein Klick nichts
   *  bewirkt hat. */
  function kostenVersuchNeu(sym, ok, grund) {
    if (!D) return;
    if (!D.kostenVersuche) D.kostenVersuche = [];
    D.kostenVersuche.unshift({ at: Date.now(), sym: sym || null, ok: !!ok,
      grund: String(grund || '').slice(0, 200) });
    if (D.kostenVersuche.length > 30) D.kostenVersuche = D.kostenVersuche.slice(0, 30);
    save();
  }

  /* marktlage kommt vom Aufrufer (der Knopf in depot.js liest den validierten
   * R-TREND-Anker ab, bevor er misst) und wird der Runde mitgegeben - nur so
   * kann die Freigabeschwelle oben aus den DATEN zaehlen, ob verschiedene
   * Marktlagen gemessen wurden, statt es sich zusichern zu lassen. Runden aus
   * der Zeit davor tragen das Feld nicht und zaehlen als "nicht erfasst". */
  var RUNDE_LAEUFT = false;
  /** Eine Runde zur Zeit - fuer Knopf UND Automat dieselbe Sperre. Sie sitzt
   *  hier und nicht beim Aufrufer: eine Sperre je Aufrufer waere genau die
   *  Bauform, bei der zwei Wege gleichzeitig eine echte Order absetzen.
   *  Dasselbe Muster wie die Release-Sperre: Kern in try/finally. */
  async function kostenRundeMessen(sym, marktlage, gefaess) {
    if (RUNDE_LAEUFT) {
      /* Auch dieser Ausgang wird vermerkt: ein Versuch, dessen Ausgang niemand
       * nachlesen kann, ist kein Messgeschirr - das galt fuer die fruehe Sperre
       * am 25.08. und gilt fuer diese genauso. */
      var gSperre = 'Es läuft bereits eine Messrunde.';
      kostenVersuchNeu(sym, false, gSperre);
      return { ok: false, grund: gSperre };
    }
    RUNDE_LAEUFT = true;
    try { return await kostenRundeKern(sym, marktlage, gefaess); }
    finally { RUNDE_LAEUFT = false; }
  }
  async function kostenRundeKern(sym, marktlage, gefaess) {
    /* Die Weiche: dasselbe Messgeschirr, dieselbe Sperre, ein anderes Gefaess. */
    if (gefaess === 'alpaca') return await alpacaRundeKern(sym, marktlage);
    if (!(window.CapAPI && window.CapAPI.enabled() && window.CapAPI.quote)) {
      var g1 = 'Capital.com-Demo ist nicht verbunden.';
      kostenVersuchNeu(sym, false, g1);
      return { ok: false, grund: g1 };
    }
    /* Die Boersen-Sperre gilt fuer Aktien. Krypto handelt rund um die Uhr - dort
     * waere sie schlicht falsch und haette das Messgeschirr nachts gesperrt. */
    var krypto = istKrypto(sym);
    if (!krypto && !(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen())) {
      var g2 = 'Die Boerse ist zu - eine Aktien-Runde jetzt misst nichts Brauchbares. ' +
        'Krypto (BTCUSD, ETHUSD) geht rund um die Uhr.';
      kostenVersuchNeu(sym, false, g2);
      return { ok: false, grund: g2 };
    }
    /* Die notierte Spanne VOR der Order: nur so laesst sich hinterher trennen, was
     * Spanne war und was Schlupf. Ohne sie waere die Runde nur eine Zahl. */
    var vor = null;
    try { vor = await window.CapAPI.quote(sym); } catch (eQ) { vor = null; }
    if (!vor || !(vor.mid > 0)) {
      /* Der Grund steckt in capital.js (lastPriceError) - ohne ihn sucht man im Nebel. */
      var g3 = 'Kein Kurs fuer ' + sym + '.' +
        (window.CapAPI.lastPriceError ? ' ' + (window.CapAPI.lastPriceError() || '') : '');
      kostenVersuchNeu(sym, false, g3);
      return { ok: false, grund: g3 };
    }

    /* Die Groesse folgt dem GEGENWERT, nicht der Stueckzahl. Fest 0,1 Einheiten
     * hiess bei ETH (~3.000 $) rund 300 $ und bei BTC (~100.000 $) rund 10.000 $ -
     * am 25.08.2026 lehnte das Demo-Konto BTC deshalb mit RC_NOT_ENOUGH_MARGIN ab.
     * Gemessen wird der PREIS, nicht die Position; jede Einheit mehr erhoeht nur das
     * Risiko einer Ablehnung. */
    var ZIEL_USD = 200;
    var groesse = Math.max(0.001, Math.round((ZIEL_USD / vor.mid) * 1000) / 1000);
    var auf = null, versuche = 0;
    while (versuche < 3) {
      versuche++;
      try { auf = await window.CapAPI.openPosition(sym, 'call', groesse, null, null); }
      catch (eO) { auf = { ok: false, msg: String(eO && eO.message || eO) }; }
      if (auf && auf.ok) break;
      /* Nur bei zu wenig Sicherheit kleiner werden - jeder andere Grund bliebe auch
       * bei halber Groesse derselbe, und ein blindes Nachfassen verschleierte ihn. */
      var margin = /MARGIN/i.test(String((auf && auf.msg) || ''));
      if (!margin || groesse <= 0.001) break;
      groesse = Math.max(0.001, Math.round((groesse / 2) * 1000) / 1000);
    }
    if (!auf || !auf.ok) {
      capFehlerNeu(sym, auf || { msg: 'ohne Antwort' });
      var g4 = 'Oeffnen abgelehnt: ' + ((auf && auf.msg) || 'ohne Angabe') +
        (versuche > 1 ? ' (auch mit kleinerer Position, zuletzt ' + groesse + ')' : '');
      kostenVersuchNeu(sym, false, g4);
      return { ok: false, grund: g4 };
    }
    /* Sofort wieder zu. Zwischen Auf und Zu soll moeglichst nichts passieren -
     * gemessen werden die Kosten, nicht die Marktbewegung. */
    var zu = null;
    try { zu = await window.CapAPI.closePosition(auf.dealId); }
    catch (eC) { zu = { ok: false, msg: String(eC && eC.message || eC) }; }
    if (!zu || !zu.ok) {
      return { ok: false, grund: 'ACHTUNG: geoeffnet, aber Schliessen fehlgeschlagen (' +
        ((zu && zu.msg) || 'ohne Angabe') + '). Position bitte bei Capital.com von Hand pruefen.',
        offenGeblieben: auf.dealId };
    }
    if (auf.fill == null || zu.fill == null) {
      var g5 = 'Runde lief, aber ohne Ausfuehrungskurse - nichts zu messen.';
      kostenVersuchNeu(sym, false, g5);
      return { ok: false, grund: g5 };
    }
    /* Kauf ueber der Mitte, Verkauf darunter: beides zusammen ist der Umlauf. */
    var aufKosten = auf.fill / vor.mid - 1;
    var zuKosten = 1 - zu.fill / vor.mid;
    var runde = aufKosten + zuKosten;
    rundeAblegen({
      at: Date.now(), sym: sym, dir: 'call', basis: true, quelle: 'messrunde', krypto: krypto,
      gefaess: 'capital',
      marktlage: marktlage || null,
      groesse: groesse,
      slipOpen: Math.round(aufKosten * 1e6) / 1e6,
      slipClose: Math.round(zuKosten * 1e6) / 1e6,
      runde: Math.round(runde * 1e6) / 1e6,
      notiert: vor.spreadPct != null ? Math.round(vor.spreadPct * 1e6) / 1e6 : null
    });
    kostenVersuchNeu(sym, true, 'Umlauf ' + (runde * 100).toFixed(4) + ' %');
    /* C5, gefunden am 25.08.2026: Hier stand `spreadPct * 200` - doppelt gezaehlt.
     *
     * aufKosten und zuKosten werden BEIDE gegen vor.mid gemessen (siehe oben), jede Seite
     * kostet also rund die halbe Spanne, und `runde` ist der volle Umlauf. vor.spreadPct =
     * (offer - bid) / mid ist ebenfalls schon der volle Umlauf - wer zum Brief kauft und
     * zum Geld verkauft, zahlt diese Spanne genau einmal. Die vergleichbare Zahl ist
     * deshalb spreadPct * 100.
     *
     * Mit * 200 stand die notierte Spanne doppelt so hoch wie der gemessene Umlauf, und
     * die Anzeige "Rest ist Schlupf" wurde regelmaessig negativ - der Schlupf sah aus, als
     * gaebe die Ausfuehrung Geld zurueck.
     *
     * WICHTIG: Daraus folgt NICHT, dass die Kostenhuerde von 0,10 % zu hoch waere. Die
     * Huerde stuetzt sich auf spannenBilanz(), und die rechnet seit jeher mit * 100, also
     * richtig. Fuer das tatsaechliche Archivuniversum zeigen die eigenen Ablehnungen sogar
     * in die Gegenrichtung (leerbuch-tageskerzen: Roll-Schaetzer ~0,93 Pp je Umlauf;
     * innertags-abgabedruck: 3,97 Pp Mindest-Tick). Korrigiert wird eine ANZEIGE, nicht
     * die Huerde. */
    return { ok: true, sym: sym, rundePct: runde * 100,
             /* * 100, nicht * 200: aufKosten und zuKosten oben werden BEIDE gegen mid
                gemessen, `runde` ist also schon der volle Umlauf - und spreadPct =
                (offer-bid)/mid ist es ebenfalls. Mit * 200 stand die notierte Spanne
                doppelt so hoch wie der gemessene Umlauf, und die Anzeige "Rest ist
                Schlupf" wurde regelmaessig negativ. Die Huerde 0,10 % bleibt, wo sie
                war; korrigiert ist eine Anzeige, nicht die Annahme. */             notiertPct: vor.spreadPct != null ? vor.spreadPct * 100 : null };
  }
  /* ================= Das Aktien-Gefaess: eine Runde auf dem Alpaca-Paper-Konto =================
   * Marktorder, Stueckzahl ganzzahlig max(1, floor(200 $ / mid)), sofort die Gegenorder.
   * Gemessen wird wie bei Capital: beide Fills gegen die Mitte VOR der Order.
   *
   * TEILFUELLUNG VERWIRFT. Alpaca fuellt im Paper ~10 % der Orders absichtlich zufaellig
   * nur teilweise - das ist ein Simulationsartefakt, keine Marktinformation. Der Rest wird
   * storniert, die Position glattgestellt (macht alpaca.js), die Runde landet NICHT in den
   * Belegen, sondern mit Grund 'Teilfuellung' bei den verworfenen. Dasselbe beim Zeitlimit.
   *
   * PLACEBO: ohne Kurs (quote null) wird keine Order abgesetzt und nichts abgelegt. */
  async function umsatzInfo(sym, gegenwertUsd) {
    var median = null;
    try { median = await umsatzMedian(sym); } catch (e) { median = null; }
    return { median: median, klasse: umsatzKlasse(median),
             anteil: (median > 0 && gegenwertUsd > 0) ? Math.round(gegenwertUsd / median * 1e8) / 1e8 : null };
  }
  async function alpacaRundeKern(sym, marktlage) {
    var A = window.AlpAPI;
    if (!(A && A.enabled() && A.quote)) {
      var a1 = 'Alpaca-Paper ist nicht verbunden.';
      kostenVersuchNeu(sym, false, a1);
      return { ok: false, grund: a1, gefaess: 'alpaca' };
    }
    if (istKrypto && istKrypto(sym)) {
      var a2 = 'Alpaca-Paper misst hier nur Aktien - Krypto laeuft ueber das Capital.com-Demo.';
      kostenVersuchNeu(sym, false, a2);
      return { ok: false, grund: a2, gefaess: 'alpaca' };
    }
    if (!(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen())) {
      var a3 = 'Die Boerse ist zu - eine Aktien-Runde jetzt misst nichts Brauchbares.';
      kostenVersuchNeu(sym, false, a3);
      return { ok: false, grund: a3, gefaess: 'alpaca' };
    }
    var vor = null;
    try { vor = await A.quote(sym); } catch (eQ) { vor = null; }
    if (!vor || !(vor.mid > 0)) {
      var a4 = 'Kein Kurs fuer ' + sym + '.' + (A.lastPriceError ? ' ' + (A.lastPriceError() || '') : '');
      kostenVersuchNeu(sym, false, a4);
      return { ok: false, grund: a4, gefaess: 'alpaca' };
    }
    var stueck = Math.max(1, Math.floor(ALP_ZIEL_USD / vor.mid));
    var gegenwert = Math.round(stueck * vor.mid * 100) / 100;
    var ums = await umsatzInfo(sym, gegenwert);
    var auf = null;
    try { auf = await A.openPosition(sym, 'call', stueck); }
    catch (eO) { auf = { ok: false, msg: String(eO && eO.message || eO) }; }
    if (!auf || !auf.ok) {
      if (auf && auf.teilfuellung) {
        verworfenAblegen({ at: Date.now(), sym: sym, gefaess: 'alpaca', seite: 'kauf', grund: 'Teilfüllung',
          stueck: stueck, gefuellt: auf.gefuellt, glatt: !!(auf.glatt && auf.glatt.ok), umsatzKlasse: ums.klasse });
        var a5 = 'Teilfüllung beim Kauf (' + auf.gefuellt + ' von ' + stueck + ') – Runde verworfen' +
          ((auf.glatt && auf.glatt.ok) ? ', Rest glattgestellt.'
            : '. ACHTUNG: Glattstellen fehlgeschlagen – Position bei Alpaca von Hand pruefen.');
        kostenVersuchNeu(sym, false, a5);
        return { ok: false, grund: a5, gefaess: 'alpaca', teilfuellung: true };
      }
      var a6 = 'Oeffnen abgelehnt: ' + ((auf && auf.msg) || 'ohne Angabe');
      kostenVersuchNeu(sym, false, a6);
      return { ok: false, grund: a6, gefaess: 'alpaca' };
    }
    var zu = null;
    try { zu = await A.closePosition(auf.dealId); }
    catch (eC) { zu = { ok: false, msg: String(eC && eC.message || eC) }; }
    if (!zu || !zu.ok) {
      if (zu && zu.teilfuellung) {
        verworfenAblegen({ at: Date.now(), sym: sym, gefaess: 'alpaca', seite: 'verkauf', grund: 'Teilfüllung',
          stueck: stueck, gefuellt: zu.gefuellt, glatt: !!(zu.glatt && zu.glatt.ok), umsatzKlasse: ums.klasse });
        var a7 = 'Teilfüllung beim Verkauf (' + zu.gefuellt + ' von ' + stueck + ') – Runde verworfen' +
          ((zu.glatt && zu.glatt.ok) ? ', Rest glattgestellt.'
            : '. ACHTUNG: Glattstellen fehlgeschlagen – Position bei Alpaca von Hand pruefen.');
        kostenVersuchNeu(sym, false, a7);
        return { ok: false, grund: a7, gefaess: 'alpaca', teilfuellung: true };
      }
      var a8 = 'ACHTUNG: gekauft, aber Verkauf fehlgeschlagen (' + ((zu && zu.msg) || 'ohne Angabe') +
        '). Position bitte bei Alpaca von Hand pruefen.';
      kostenVersuchNeu(sym, false, a8);
      return { ok: false, grund: a8, gefaess: 'alpaca', offenGeblieben: auf.dealId };
    }
    if (auf.fill == null || zu.fill == null) {
      var a9 = 'Runde lief, aber ohne Ausfuehrungskurse - nichts zu messen.';
      kostenVersuchNeu(sym, false, a9);
      return { ok: false, grund: a9, gefaess: 'alpaca' };
    }
    var aufK = auf.fill / vor.mid - 1;
    var zuK = 1 - zu.fill / vor.mid;
    var umlauf = aufK + zuK;
    rundeAblegen({
      at: Date.now(), sym: sym, dir: 'call', basis: true, quelle: 'messrunde', krypto: false,
      gefaess: 'alpaca', uebernacht: false, auktion: null,
      marktlage: marktlage || null,
      stueck: stueck, gegenwertUsd: gegenwert,
      umsatzMedianUsd: ums.median != null ? Math.round(ums.median) : null,
      umsatzKlasse: ums.klasse, anteilUmsatz: ums.anteil,
      fillAuf: auf.fill, fillZu: zu.fill, mid: vor.mid,
      slipOpen: Math.round(aufK * 1e6) / 1e6,
      slipClose: Math.round(zuK * 1e6) / 1e6,
      runde: Math.round(umlauf * 1e6) / 1e6,
      notiert: vor.spreadPct != null ? Math.round(vor.spreadPct * 1e6) / 1e6 : null
    });
    kostenVersuchNeu(sym, true, 'Alpaca: Umlauf ' + (umlauf * 100).toFixed(4) + ' %' +
      (ums.klasse ? ' · Klasse ' + ums.klasse + ' Mio $' : ' · ohne Umsatzklasse'));
    return { ok: true, sym: sym, gefaess: 'alpaca', rundePct: umlauf * 100, stueck: stueck,
             umsatzKlasse: ums.klasse,
             notiertPct: vor.spreadPct != null ? vor.spreadPct * 100 : null };
  }
  if (typeof window !== 'undefined') window.__kostenRundeMessen = kostenRundeMessen;

  /* ===== Tagesumsatz je Wert: Median ueber 20 Balken von Schluss x Stueck (liquide.js) =====
   * Quelle zuerst die Tagesdaten des Mittelfrist-Tabs (ein Lader, eine Wahrheit), sonst
   * der Kurslader (1d, 3 Monate). Je Wert und Tag einmal - die Symbolwahl fragt viele. */
  var MF_ROH = { at: 0, roh: null };
  var KLASSEN_CACHE = {};
  async function mfRoh() {
    if (MF_ROH.roh && Date.now() - MF_ROH.at < 30 * 60000) return MF_ROH.roh;
    var roh = null;
    try { roh = mfTagesdaten ? await mfTagesdaten() : null; } catch (e) { roh = null; }
    MF_ROH = { at: Date.now(), roh: roh || {} };
    return MF_ROH.roh;
  }
  async function tagesreihe(sym) {
    var roh = await mfRoh();
    if (roh && roh[sym] && roh[sym].length >= 5) return roh[sym];
    if (!kurseHolen) return null;
    var kd = null;
    try { kd = await kurseHolen(sym, { range: '3mo', interval: '1d', bereinigt: false }); } catch (e) { kd = null; }
    if (!kd || !kd.bars || !kd.bars.length) return null;
    return kd.bars.map(function (b) { return [b[0], b[1], b[2]]; });
  }
  async function umsatzMedian(sym) {
    var tag = new Date().toISOString().slice(0, 10);
    var c = KLASSEN_CACHE[sym];
    if (c && c.tag === tag) return c.median;
    var Li = window.Liquide;
    var median = null;
    if (Li) {
      var bars = await tagesreihe(sym);
      if (bars && Li.hatUmsatz(bars)) {
        var u = Li.medianUmsatz(bars);
        median = isFinite(u) ? u : null;
      }
    }
    KLASSEN_CACHE[sym] = { tag: tag, median: median };
    return median;
  }

  /* ===== Symbolwahl "Aktien - der Reihe nach" fuer das Aktien-Gefaess =====
   * Aus den Werten, die die App heute tatsaechlich handeln wuerde (Momentum-Korb und
   * Intraday-Signalliste, hereingereicht aus depot.js). Bevorzugt die Umsatzklasse mit
   * den wenigsten Runden; fehlt eine Klasse in der Signalliste, wird sie aus dem
   * eingefrorenen Universum (universum-2024-09-02.json, NUR LESEN) ergaenzt - dessen
   * Umsatz ist zwei Jahre alt und dient nur als Vorauswahl, zugelassen wird, was HEUTE
   * in der Klasse liegt. */
  var ALP_TAKT = {}, ALP_UNIV_TAKT = {}, UNIVERSUM = null;
  function alpacaJeKlasse(runden) {
    var z = {};
    UMSATZ_KLASSEN.forEach(function (k) { z[k.name] = 0; });
    (runden || []).forEach(function (r) {
      if (!istAlpaca(r) || r.uebernacht) return;
      if (r.runde == null || !isFinite(r.runde)) return;
      if (z[r.umsatzKlasse] != null) z[r.umsatzKlasse]++;
    });
    return z;
  }
  async function universumEingefroren() {
    if (UNIVERSUM) return UNIVERSUM;
    var u = null;
    try { u = (window.api && window.api.universumEingefroren) ? await window.api.universumEingefroren() : null; } catch (e) { u = null; }
    UNIVERSUM = (u && u.ok && Array.isArray(u.werte)) ? u.werte : [];
    return UNIVERSUM;
  }
  async function ergaenzungAusUniversum(klasse) {
    var kl = UMSATZ_KLASSEN.filter(function (k) { return k.name === klasse; })[0];
    if (!kl) return [];
    var werte = await universumEingefroren();
    var hinweis = werte.filter(function (w) {
      var usd = w.umsatzMio * 1e6;
      return usd >= kl.von && usd < kl.bis && !(istKrypto && istKrypto(w.sym)) && /^[A-Z][A-Z0-9.-]{0,5}$/.test(w.sym);
    }).map(function (w) { return w.sym; });
    if (!hinweis.length) return [];
    /* Hoechstens zwoelf Pruefungen je Aufruf - der Rest kommt beim naechsten Mal dran. */
    var start = ALP_UNIV_TAKT[klasse] || 0, geprueft = 0, out = [];
    for (var i = 0; i < hinweis.length && geprueft < 12 && out.length < 3; i++) {
      var sym = hinweis[(start + i) % hinweis.length];
      geprueft++;
      var m = null;
      try { m = await umsatzMedian(sym); } catch (e) { m = null; }
      if (umsatzKlasse(m) === klasse) out.push(sym);
    }
    ALP_UNIV_TAKT[klasse] = start + geprueft;
    return out;
  }
  async function naechstesAlpacaSymbol() {
    var kand = { momentum: [], intraday: [] };
    try { kand = (kandidatenAlpaca ? kandidatenAlpaca() : null) || kand; } catch (e) { /* leer */ }
    var gesehen = {}, liste = [];
    [].concat(kand.momentum || [], kand.intraday || []).forEach(function (s) {
      if (typeof s !== 'string' || gesehen[s]) return;
      if (istKrypto && istKrypto(s)) return;
      gesehen[s] = 1; liste.push(s);
    });
    var zaehl = alpacaJeKlasse(kostenRunden());
    var reihenfolge = UMSATZ_KLASSEN.map(function (k) { return k.name; })
      .sort(function (a, b) { return zaehl[a] - zaehl[b]; });
    var jeKlasse = {};
    for (var i = 0; i < liste.length; i++) {
      var m = null;
      try { m = await umsatzMedian(liste[i]); } catch (e) { m = null; }
      var k = umsatzKlasse(m);
      if (k) (jeKlasse[k] = jeKlasse[k] || []).push(liste[i]);
    }
    for (var j = 0; j < reihenfolge.length; j++) {
      var name = reihenfolge[j], quelle = 'signalliste';
      var pool = jeKlasse[name] || [];
      if (!pool.length) { pool = await ergaenzungAusUniversum(name); quelle = 'universum-2024-09-02'; }
      if (!pool.length) continue;
      var n = ALP_TAKT[name] || 0;
      ALP_TAKT[name] = n + 1;
      return { sym: pool[n % pool.length], klasse: name, quelle: quelle, runden: zaehl[name] };
    }
    return null;
  }

  /* ================= Die Uebernacht-Runde (BERICHT §2.3, Punkt 3) =================
   * Kauf in der Schlussauktion (time_in_force 'cls'), Verkauf zur Folgeeroeffnung ('opg').
   * Beide Fills werden ZUSAETZLICH gegen den offiziellen Schluss bzw. die offizielle
   * Eroeffnung aus den Tageskerzen gehalten - so laesst sich Auktions-Schlupf von der
   * Spanne trennen. Nie mehr als EINE offene Uebernacht-Position; der Zustand wohnt im
   * Nebenlager (MESSUNG.uebernacht), weil zwischen Kauf und Verkauf ein Neustart liegen
   * kann. Lehnt der Paper-Endpunkt cls/opg ab, faellt die Runde auf Marktorders 15:58 /
   * 09:31 ET zurueck und traegt auktion: false. */
  var AUTOMAT_ALP = { tag: null, zielMin: null, gemessenAm: null, letzterGrund: null,
                      clsAbgelehnt: false, opgAbgelehnt: false, uebernachtTag: null, nachtragAt: 0 };
  function isoTag(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function uhr(jetzt) {
    var sm = (window.Boerse && window.Boerse.sitzungsMinuten) ? window.Boerse.sitzungsMinuten(jetzt) : 390;
    var m = (window.Quant && window.Quant.minutenSeitOeffnung) ? window.Quant.minutenSeitOeffnung(jetzt) : null;
    return { sm: sm, m: m, tag: isoTag(jetzt) };
  }
  async function offizielleKurse(sym, kaufTag, verkaufTag) {
    var out = { schluss: null, eroeffnung: null };
    if (!kurseHolen) return out;
    var kd = null;
    try { kd = await kurseHolen(sym, { range: '1mo', interval: '1d', bereinigt: false, offenRoh: true }); } catch (e) { kd = null; }
    if (!kd || !kd.bars) return out;
    kd.bars.forEach(function (b) {
      var t = isoTag(b[0]);
      if (t === kaufTag && b[1] > 0) out.schluss = b[1];
      if (t === verkaufTag && b[5] > 0) out.eroeffnung = b[5];
    });
    return out;
  }
  async function uebernachtAbschliessen(st, verkaufFill, verkaufFillT) {
    var verkaufTag = st.verkaufTag || isoTag(Date.now());
    var off = await offizielleKurse(st.sym, st.kaufTag, verkaufTag);
    var sS = (off.schluss > 0 && st.kaufFill > 0) ? st.kaufFill / off.schluss - 1 : null;
    var sE = (off.eroeffnung > 0 && verkaufFill > 0) ? 1 - verkaufFill / off.eroeffnung : null;
    var umlauf = (sS != null && sE != null) ? sS + sE : null;
    rundeAblegen({
      at: Date.now(), sym: st.sym, dir: 'call', basis: true, quelle: 'messrunde', krypto: false,
      gefaess: 'alpaca', uebernacht: true, auktion: !!st.auktion,
      marktlage: st.marktlage || null,
      stueck: st.stueck, gegenwertUsd: st.gegenwertUsd,
      umsatzMedianUsd: st.umsatzMedianUsd, umsatzKlasse: st.umsatzKlasse, anteilUmsatz: st.anteilUmsatz,
      kaufTag: st.kaufTag, verkaufTag: verkaufTag,
      kaufFill: st.kaufFill, kaufFillT: st.kaufFillT || null,
      verkaufFill: verkaufFill, verkaufFillT: verkaufFillT || null,
      schluss: off.schluss, eroeffnung: off.eroeffnung,
      schlupfSchluss: sS != null ? Math.round(sS * 1e6) / 1e6 : null,
      schlupfEroeffnung: sE != null ? Math.round(sE * 1e6) / 1e6 : null,
      runde: umlauf != null ? Math.round(umlauf * 1e6) / 1e6 : null,
      offiziellFehlt: umlauf == null,
      notiert: st.notiert != null ? st.notiert : null, mid: st.vorMid || null
    });
    kostenVersuchNeu(st.sym, true, 'Alpaca Übernacht' + (st.auktion ? ' (Auktion)' : ' (Markt 15:58/09:31)') + ': ' +
      (umlauf != null ? 'Schlupf gegen Schluss/Eröffnung ' + (umlauf * 100).toFixed(4) + ' %'
        : 'Fills liegen vor, offizieller Schluss/Eröffnung wird nachgetragen'));
    MESSUNG.uebernacht = null;
    messungSchreiben();
  }
  /** Fehlende offizielle Kurse nachtragen - hoechstens einmal je Stunde, nur juengere Runden. */
  async function uebernachtNachtragen() {
    if (Date.now() - AUTOMAT_ALP.nachtragAt < 3600000) return;
    AUTOMAT_ALP.nachtragAt = Date.now();
    var r = kostenRunden();
    for (var i = 0; i < r.length; i++) {
      var x = r[i];
      if (!istAlpaca(x) || !x.uebernacht || !x.offiziellFehlt) continue;
      if (Date.now() - x.at > 5 * 86400000) continue;
      var off = await offizielleKurse(x.sym, x.kaufTag, x.verkaufTag);
      if (!(off.schluss > 0 && off.eroeffnung > 0)) continue;
      x.schluss = off.schluss; x.eroeffnung = off.eroeffnung;
      x.schlupfSchluss = Math.round((x.kaufFill / off.schluss - 1) * 1e6) / 1e6;
      x.schlupfEroeffnung = Math.round((1 - x.verkaufFill / off.eroeffnung) * 1e6) / 1e6;
      x.runde = Math.round((x.schlupfSchluss + x.schlupfEroeffnung) * 1e6) / 1e6;
      x.offiziellFehlt = false;
      messungSchreiben();
    }
  }
  async function uebernachtNachsehen(jetzt) {
    var A = window.AlpAPI;
    if (!(A && A.enabled())) return;
    if (!MESSUNG) { await messungHolen(); if (!MESSUNG) return; }
    var u = uhr(jetzt), st = MESSUNG.uebernacht;
    if (!st) {
      /* Kauf-Fenster: nur an vollen Handelstagen. Auktion 15:44-15:49 ET; Markt-Rueckfall
       * 15:58-15:59 ET, nur wenn 'cls' abgelehnt wurde. Ein Versuch je Tag. */
      if (u.sm !== 390 || u.m == null || RUNDE_LAEUFT) return;
      if (AUTOMAT_ALP.uebernachtTag === u.tag || MESSUNG.uebernachtZuletzt === u.tag) return;
      var auktion = !AUTOMAT_ALP.clsAbgelehnt;
      if (auktion && !(u.m >= 374 && u.m <= 379)) return;
      if (!auktion && !(u.m >= 388 && u.m <= 389)) return;
      AUTOMAT_ALP.uebernachtTag = u.tag;
      MESSUNG.uebernachtZuletzt = u.tag;
      var wahl = await naechstesAlpacaSymbol();
      if (!wahl) { AUTOMAT_ALP.letzterGrund = 'Übernacht: kein Kandidat'; messungSchreiben(); return; }
      var vor = null;
      try { vor = await A.quote(wahl.sym); } catch (e) { vor = null; }
      if (!vor || !(vor.mid > 0)) {
        kostenVersuchNeu(wahl.sym, false, 'Übernacht: kein Kurs.' + (A.lastPriceError ? ' ' + (A.lastPriceError() || '') : ''));
        messungSchreiben(); return;
      }
      var stueck = Math.max(1, Math.floor(ALP_ZIEL_USD / vor.mid));
      var gegenwert = Math.round(stueck * vor.mid * 100) / 100;
      var ums = await umsatzInfo(wahl.sym, gegenwert);
      var lage = null;
      try { if (marktlageLesen) { var auf9 = await marktlageLesen(); lage = auf9 === true ? 'trend-auf' : auf9 === false ? 'trend-ab' : null; } } catch (e) { lage = null; }
      var basis = { sym: wahl.sym, stueck: stueck, gegenwertUsd: gegenwert, kaufTag: u.tag, at: jetzt,
        vorMid: vor.mid, notiert: vor.spreadPct != null ? Math.round(vor.spreadPct * 1e6) / 1e6 : null,
        umsatzMedianUsd: ums.median != null ? Math.round(ums.median) : null, umsatzKlasse: ums.klasse,
        anteilUmsatz: ums.anteil, marktlage: lage, quelle: wahl.quelle };
      RUNDE_LAEUFT = true;
      try {
        if (auktion) {
          var o = await A.auktionsOrder(wahl.sym, 'buy', stueck, 'cls');
          if (!o.ok) {
            if (o.tifAbgelehnt) {
              AUTOMAT_ALP.clsAbgelehnt = true;
              if (HEALTH) HEALTH.alpAuktionAbgelehnt = (HEALTH.alpAuktionAbgelehnt || 0) + 1;
              if (melde && HEALTH && HEALTH.alpAuktionAbgelehnt === 1) {
                melde('Alpaca lehnt Auktionsorders ab',
                  'Der Paper-Endpunkt hat eine Schlussauktions-Order (cls) abgelehnt. Die Übernacht-Runde ' +
                  'fällt auf Marktorders 15:58 / 09:31 ET zurück und wird als auktion: false protokolliert.');
              }
            }
            kostenVersuchNeu(wahl.sym, false, 'Übernacht-Kauf (cls) abgelehnt: ' + o.msg);
            return;
          }
          MESSUNG.uebernacht = Object.assign(basis, { phase: 'kauf-offen', auktion: true, orderId: o.orderId });
          kostenVersuchNeu(wahl.sym, true, 'Übernacht-Kauf in der Schlussauktion abgesetzt (' + stueck + ' Stück).');
        } else {
          var r = await A.openPosition(wahl.sym, 'call', stueck);
          if (!r || !r.ok) {
            if (r && r.teilfuellung) {
              verworfenAblegen({ at: Date.now(), sym: wahl.sym, gefaess: 'alpaca', seite: 'kauf', uebernacht: true,
                grund: 'Teilfüllung', stueck: stueck, gefuellt: r.gefuellt, glatt: !!(r.glatt && r.glatt.ok), umsatzKlasse: ums.klasse });
            }
            kostenVersuchNeu(wahl.sym, false, 'Übernacht-Kauf (Markt 15:58) nicht gefüllt: ' + ((r && r.msg) || 'ohne Angabe'));
            return;
          }
          MESSUNG.uebernacht = Object.assign(basis, { phase: 'gehalten', auktion: false, kaufFill: r.fill,
            kaufFillT: r.fillT || null, stueck: r.stueck || stueck });
          kostenVersuchNeu(wahl.sym, true, 'Übernacht-Kauf zum Markt 15:58 ET gefüllt (' + stueck + ' Stück).');
        }
      } finally { RUNDE_LAEUFT = false; messungSchreiben(); }
      return;
    }
    if (st.phase === 'kauf-offen') {
      /* Erst nach dem Schluss nachsehen - die Auktion fuellt um 16:00 ET. */
      if (u.tag === st.kaufTag && !(u.m != null && u.m >= u.sm + 1)) return;
      var ko = await A.orderStand(st.orderId);
      if (!ko.ok) return;
      if (ko.status === 'filled') {
        st.phase = 'gehalten'; st.kaufFill = ko.fill; st.kaufFillT = ko.fillT || Date.now();
        if (ko.gefuellt > 0) st.stueck = ko.gefuellt;
        messungSchreiben(); return;
      }
      if (ko.endgueltig) {
        if (ko.gefuellt > 0) {
          /* Teilweise gefuellt und storniert: die Stuecke liegen ueber Nacht auf dem Konto.
           * Zur naechsten Sitzung glattstellen, Runde verwerfen. */
          st.phase = 'abbruch'; st.stueck = ko.gefuellt; st.abbruchGrund = 'Teilfüllung';
        } else {
          verworfenAblegen({ at: Date.now(), sym: st.sym, gefaess: 'alpaca', seite: 'kauf', uebernacht: true,
            grund: 'nicht gefüllt (' + ko.status + ')', stueck: st.stueck, gefuellt: 0, umsatzKlasse: st.umsatzKlasse });
          kostenVersuchNeu(st.sym, false, 'Übernacht-Kauf in der Auktion nicht gefüllt (' + ko.status + ') – verworfen.');
          MESSUNG.uebernacht = null;
        }
        messungSchreiben(); return;
      }
      /* Am Folgetag noch offen: das war keine Auktion mehr - weg damit. */
      if (u.tag !== st.kaufTag && u.m != null && u.m >= 0) { await A.stornieren(st.orderId); }
      return;
    }
    if (st.phase === 'abbruch') {
      if (!(u.sm && u.m != null && u.m >= 1 && u.m < u.sm - 5)) return;
      var g = await A.glattstellen(st.sym);
      if (!g.ok) { AUTOMAT_ALP.letzterGrund = 'Übernacht-Abbruch: Glattstellen ' + st.sym + ' fehlgeschlagen – bei Alpaca von Hand pruefen.'; return; }
      verworfenAblegen({ at: Date.now(), sym: st.sym, gefaess: 'alpaca', seite: 'kauf', uebernacht: true,
        grund: st.abbruchGrund || 'Teilfüllung', stueck: st.stueck, gefuellt: st.stueck, glatt: true, umsatzKlasse: st.umsatzKlasse });
      kostenVersuchNeu(st.sym, false, 'Übernacht-Runde verworfen (' + (st.abbruchGrund || 'Teilfüllung') + '), Position glattgestellt.');
      MESSUNG.uebernacht = null; messungSchreiben(); return;
    }
    if (st.phase === 'gehalten') {
      if (u.tag === st.kaufTag || !u.sm || u.m == null) return;      // erst am naechsten Handelstag
      var auktionV = !!st.auktion && !AUTOMAT_ALP.opgAbgelehnt;
      if (auktionV) {
        if (!(u.m >= -90 && u.m <= -4)) return;                        // 08:00-09:26 ET
        var ov = await A.auktionsOrder(st.sym, 'sell', st.stueck, 'opg');
        if (!ov.ok) {
          if (ov.tifAbgelehnt) { AUTOMAT_ALP.opgAbgelehnt = true; st.auktion = false; messungSchreiben(); }
          kostenVersuchNeu(st.sym, false, 'Übernacht-Verkauf (opg) abgelehnt: ' + ov.msg);
          return;
        }
        st.phase = 'verkauf-offen'; st.verkaufOrderId = ov.orderId; st.verkaufTag = u.tag;
        messungSchreiben(); return;
      }
      /* Markt-Rueckfall 09:31 ET; wer das Fenster verpasst hat (App war aus), verkauft
       * beim naechsten Blick innerhalb der Sitzung - spaeter als geplant, aber nicht nie. */
      if (!(u.m >= 1 && u.m < u.sm - 5) || RUNDE_LAEUFT) return;
      RUNDE_LAEUFT = true;
      try {
        var rv = await A.closePosition(null, { sym: st.sym, stueck: st.stueck });
        if (rv && rv.ok) { st.verkaufTag = u.tag; st.auktion = false; await uebernachtAbschliessen(st, rv.fill, rv.fillT); return; }
        if (rv && rv.teilfuellung) {
          verworfenAblegen({ at: Date.now(), sym: st.sym, gefaess: 'alpaca', seite: 'verkauf', uebernacht: true,
            grund: 'Teilfüllung', stueck: st.stueck, gefuellt: rv.gefuellt, glatt: !!(rv.glatt && rv.glatt.ok), umsatzKlasse: st.umsatzKlasse });
          kostenVersuchNeu(st.sym, false, 'Übernacht-Verkauf: Teilfüllung – Runde verworfen' +
            ((rv.glatt && rv.glatt.ok) ? ', Rest glattgestellt.' : '. ACHTUNG: Glattstellen fehlgeschlagen – bei Alpaca von Hand pruefen.'));
          if (rv.glatt && rv.glatt.ok) MESSUNG.uebernacht = null;
          return;
        }
        AUTOMAT_ALP.letzterGrund = 'Übernacht-Verkauf ' + st.sym + ' fehlgeschlagen: ' + ((rv && rv.msg) || 'ohne Angabe');
      } finally { RUNDE_LAEUFT = false; messungSchreiben(); }
      return;
    }
    if (st.phase === 'verkauf-offen') {
      if (!(u.m != null && u.m >= 1)) return;
      var vo = await A.orderStand(st.verkaufOrderId);
      if (!vo.ok) return;
      if (vo.status === 'filled') { await uebernachtAbschliessen(st, vo.fill, vo.fillT); return; }
      if (vo.endgueltig) {
        var g2 = await A.glattstellen(st.sym);
        verworfenAblegen({ at: Date.now(), sym: st.sym, gefaess: 'alpaca', seite: 'verkauf', uebernacht: true,
          grund: vo.gefuellt > 0 ? 'Teilfüllung' : 'nicht gefüllt (' + vo.status + ')', stueck: st.stueck,
          gefuellt: vo.gefuellt, glatt: !!g2.ok, umsatzKlasse: st.umsatzKlasse });
        kostenVersuchNeu(st.sym, false, 'Übernacht-Verkauf in der Eröffnungsauktion ' +
          (vo.gefuellt > 0 ? 'nur teilweise' : 'nicht') + ' gefüllt – Runde verworfen' +
          (g2.ok ? ', glattgestellt.' : '. ACHTUNG: Glattstellen fehlgeschlagen – bei Alpaca von Hand pruefen.'));
        if (g2.ok) MESSUNG.uebernacht = null;
        messungSchreiben(); return;
      }
      if (u.m > 10) await A.stornieren(st.verkaufOrderId);   // die Auktion ist vorbei; der naechste Blick raeumt auf
    }
  }

  /* ===== Wilhelms Freigabeschwelle (27.08.2026) - eine Zaehlregel, kein Automat =====
   * Ersetzt ">= 20 Aktienrunden" (Strang-A-Vorregistrierung, Nachtrag 16): die
   * Freigabe verlangt Runden ueber VERSCHIEDENE TAGE UND MARKTLAGEN. Eine
   * Rundenzahl steht hier absichtlich nicht mehr: 16 Werte entstanden am
   * 25.08. um 13:31 als Klickfolge in zwei Minuten - eine Schwelle, die eine
   * Klickfolge erfuellt, prueft die Ausdauer des Klickenden, nicht die Kosten.
   * Gezaehlt wird ueber das Feld krypto, NICHT ueber basis: basis heisst
   * Basiswert (Gegensatz: Schein) und zaehlt Krypto mit - wer es als
   * Aktienzaehler liest, haelt 38 fuer erreicht, wo 16 stehen (QS-Abgleich
   * 27.08.: krypto-Feld gegen die Kuerzel-Ableitung, null Abweichungen).
   * "Verschiedene" ist als sprachliches Minimum hinterlegt (mindestens zwei
   * Tage UND mindestens zwei erfasste Marktlagen); ob MEHR verlangt wird,
   * entscheidet Wilhelm am Zahlenstand, nicht diese Funktion.
   * VORBEHALT, dokumentiert und bewusst KEINE Bedingung (Wilhelm hat die
   * Breiten-Fassung ausdruecklich nicht gewaehlt): der Broker fuehrt nur die
   * liquidesten Werte, alle bisherigen Runden sind Mega-Caps - die
   * Zusammensetzung bleibt schief, auch wenn die Schwelle erfuellt ist. */
  function kostenStreuung(runden, gefaess) {
    var tage = {}, lagen = {}, ohneLage = 0, n = 0;
    var g = gefaess || 'capital';
    (runden || []).forEach(function (x) {
      if (x.krypto) return;
      /* Ohne Feld = Capital (Runden von vor dem 02.09.2026). Absichtlich ohne Helfer:
       * test-v6 loest diese Funktion einzeln heraus und fuehrt sie aus. */
      if (((x && x.gefaess) || 'capital') !== g) return;
      if (x.uebernacht) return;
      if (x.runde == null || !isFinite(x.runde)) return;
      n++;
      tage[new Date(x.at).toISOString().slice(0, 10)] = 1;
      if (x.marktlage) lagen[x.marktlage] = (lagen[x.marktlage] || 0) + 1; else ohneLage++;
    });
    var t = Object.keys(tage).sort(), l = Object.keys(lagen).sort();
    /* jeLage ist ADDITIV und aendert 'erfuellt' nicht: die Freigabe-Zaehlregel
     * bleibt Wort fuer Wort, wie sie vorgelegt wurde. Die Zahl je Lage braucht
     * der Messautomat fuer seine Abschaltbedingung - und sie an zwei Stellen
     * zu zaehlen waere die Bauform, aus der zwei Wahrheiten entstehen. */
    return { runden: n, tage: t.length, tageListe: t,
             marktlagen: l.length, marktlagenListe: l, jeLage: lagen,
             rundenOhneMarktlage: ohneLage,
             erfuellt: t.length >= 2 && l.length >= 2 };
  }

  /** Bilanz der echten Kosten - Median statt Mittel, ein Ausreisser soll nicht dominieren. */
  function kostenBilanz() {
    var runden = kostenRunden();
    if (!runden.length) return null;
    /* Krypto NICHT mitzaehlen: Die Spanne auf BTC sagt nichts ueber die Spanne auf
     * MSFT, und die Annahme 0,10 %, gegen die hier geprueft wird, stammt aus den
     * Aktien-Studien. Eine einzige BTC-Runde wuerde den Median verschieben, an dem
     * fast jede Studie haengt - unsichtbar. Zwei Quellen in einer Reihe haben hier
     * schon einmal Schaden angerichtet; das passiert nicht noch einmal. */
    function werte(nurKrypto) {
      return runden
        .filter(function (x) { return !istAlpaca(x); })
        .filter(function (x) { return !!x.krypto === nurKrypto; })
        .map(function (x) { return x.runde; })
        .filter(function (v) { return v != null && isFinite(v); });
    }
    function med(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
    var r = werte(false);
    var k = werte(true);
    if (!r.length && !k.length) return null;
    var aus = { n: r.length, annahmePct: 0.10, gefaess: 'capital',
                seit: (MESSUNG && MESSUNG.seit) || (D && D.kostenMessung && D.kostenMessung.seit) || null,
                kryptoN: k.length, kryptoMedianPct: k.length ? med(k) * 100 : null,
                streuung: kostenStreuung(runden) };
    if (r.length) {
      aus.medianPct = med(r) * 100;
      aus.mittelPct = r.reduce(function (a, b) { return a + b; }, 0) / r.length * 100;
    }
    return aus;
  }
  if (typeof window !== 'undefined') window.__kostenBilanz = kostenBilanz;

  /** Bilanz des Aktien-Gefaesses - NUR Alpaca-Runden, gegen die Aktienannahme 0,06 Pp.
   *  Intraday-Runden (Spanne + Schlupf gegen die Mitte) und Uebernacht-Runden
   *  (Auktions-Schlupf gegen offiziellen Schluss/Eroeffnung) messen Verschiedenes und
   *  werden getrennt ausgewiesen, je Umsatzklasse gezaehlt. */
  function alpacaBilanz() {
    var runden = kostenRunden().filter(istAlpaca);
    if (!runden.length && !(MESSUNG && MESSUNG.verworfen && MESSUNG.verworfen.length)) return null;
    function fin(v) { return v != null && isFinite(v); }
    function med(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
    var intra = runden.filter(function (r) { return !r.uebernacht && fin(r.runde); });
    var nacht = runden.filter(function (r) { return r.uebernacht && fin(r.runde); });
    var jeKlasse = {};
    UMSATZ_KLASSEN.forEach(function (k) { jeKlasse[k.name] = { n: 0, medianPct: null, werte: [] }; });
    intra.forEach(function (r) { var k = jeKlasse[r.umsatzKlasse]; if (k) { k.n++; k.werte.push(r.runde); } });
    Object.keys(jeKlasse).forEach(function (k) {
      var w = jeKlasse[k].werte; jeKlasse[k].medianPct = w.length ? med(w) * 100 : null; delete jeKlasse[k].werte;
    });
    var verworfen = (MESSUNG && MESSUNG.verworfen) || [];
    var iw = intra.map(function (r) { return r.runde; }), nw = nacht.map(function (r) { return r.runde; });
    return {
      gefaess: 'alpaca', annahmePct: ALP_ANNAHME_PCT,
      n: intra.length, medianPct: iw.length ? med(iw) * 100 : null,
      mittelPct: iw.length ? iw.reduce(function (a, b) { return a + b; }, 0) / iw.length * 100 : null,
      ohneKlasse: intra.filter(function (r) { return !r.umsatzKlasse; }).length,
      jeKlasse: jeKlasse, klasseMindest: KLASSE_MINDEST,
      uebernachtN: nacht.length, uebernachtMedianPct: nw.length ? med(nw) * 100 : null,
      uebernachtAuktionN: nacht.filter(function (r) { return r.auktion; }).length,
      uebernachtOffen: runden.filter(function (r) { return r.uebernacht && r.offiziellFehlt; }).length,
      verworfen: verworfen.filter(function (v) { return v.gefaess === 'alpaca'; }).length,
      teilfuellungen: verworfen.filter(function (v) { return v.gefaess === 'alpaca' && v.grund === 'Teilfüllung'; }).length,
      streuung: kostenStreuung(runden, 'alpaca')
    };
  }
  if (typeof window !== 'undefined') window.__alpacaBilanz = alpacaBilanz;

  /* ================= Der Messautomat (Wilhelms Auftrag 27.08.2026) =================
   *
   * WARUM ES IHN GIBT. Die Freigabeschwelle verlangt Runden ueber verschiedene
   * TAGE und MARKTLAGEN. Durch Klicken ist das praktisch nicht erreichbar - man
   * muesste an vielen verschiedenen Tagen daran denken, und der einzige Versuch
   * ergab 16 Runden in einer Minute. Der Automat ist deshalb nicht Bequemlichkeit,
   * sondern die Voraussetzung dafuer, dass die Schwelle je erfuellt werden kann.
   *
   * EINE RUNDE JE HANDELSTAG, nicht mehr. Jede Runde ist eine ECHTE Order auf dem
   * Demo-Konto (200 $, sofort wieder geschlossen). Zwei Runden am selben Tag
   * bringen der Schwelle null zusaetzlichen Fortschritt und kosten die doppelte
   * Order - deshalb eine.
   *
   * DER ZEITPUNKT WIRD JE TAG NEU GEWUERFELT. Die 16 vorhandenen Runden stehen
   * ausnahmslos auf 13:31-13:32 UTC - der ersten Minute nach US-Eroeffnung und
   * damit der Tageszeit mit der systematisch weitesten Spanne. Ein fester Takt
   * wuerde diese Verzerrung nur ordentlicher wiederholen.
   *
   * ABSCHALTEN: Schwelle erfuellt UND mindestens LAGE_MINDEST Runden JE erfasster
   * Lage (Wilhelms Entscheid). Die Schwelle allein genuegt ausdruecklich NICHT -
   * sie ist eine MINDESTbedingung fuer die Freigabe; als alleiniges Stoppsignal
   * waere sie eine Obergrenze, und im unguenstigen Fall stuende die zweite Lage
   * mit einer einzigen Messung da (30 zu 1). */
  var LAGE_MINDEST = 10;   // Runden je Lage, bevor der Automat sich abstellt - Wilhelms Zahl, hier zu aendern
  var AUTOMAT = { tag: null, zielMin: null, gemessenAm: null, letzterGrund: null };
  var automatTakt = 0;

  /** Fertig = Schwelle erfuellt UND jede erfasste Lage traegt genug Runden. */
  function automatFertig() {
    var s = kostenStreuung(kostenRunden());
    if (!s.erfuellt) return false;
    var lagen = s.jeLage || {};
    var namen = Object.keys(lagen);
    if (!namen.length) return false;
    for (var i = 0; i < namen.length; i++) if (lagen[namen[i]] < LAGE_MINDEST) return false;
    return true;
  }
  /** Fertig fuer das Aktien-Gefaess: jede Umsatzklasse traegt KLASSE_MINDEST Runden UND die
   *  Freigabeschwelle (verschiedene Tage und Marktlagen) ist auf Alpaca-Runden erfuellt. */
  function alpacaFertig() {
    var z = alpacaJeKlasse(kostenRunden());
    for (var i = 0; i < UMSATZ_KLASSEN.length; i++) if (z[UMSATZ_KLASSEN[i].name] < KLASSE_MINDEST) return false;
    return kostenStreuung(kostenRunden(), 'alpaca').erfuellt;
  }
  function alpacaStand() {
    var A = window.AlpAPI;
    var ue = MESSUNG && MESSUNG.uebernacht;
    return { an: !(D && D.kostenAutomatAlpaca === false), verbunden: !!(A && A.enabled()),
             fertig: alpacaFertig(), jeKlasse: alpacaJeKlasse(kostenRunden()), klasseMindest: KLASSE_MINDEST,
             zielMin: AUTOMAT_ALP.zielMin, gemessenAm: AUTOMAT_ALP.gemessenAm, letzterGrund: AUTOMAT_ALP.letzterGrund,
             clsAbgelehnt: AUTOMAT_ALP.clsAbgelehnt, opgAbgelehnt: AUTOMAT_ALP.opgAbgelehnt,
             uebernacht: ue ? { phase: ue.phase, sym: ue.sym, stueck: ue.stueck, seit: ue.at, auktion: !!ue.auktion } : null };
  }
  /** Der Stand fuer die Anzeige - der Automat endet nie stillschweigend. */
  function automatStand() {
    var s = kostenStreuung(kostenRunden());
    var fertig = automatFertig();
    return { an: !(D && D.kostenAutomat === false), fertig: fertig, streuung: s, alpaca: alpacaStand(),
             lageMindest: LAGE_MINDEST, zielMin: AUTOMAT.zielMin,
             gemessenAm: AUTOMAT.gemessenAm, letzterGrund: AUTOMAT.letzterGrund,
             meldung: fertig
               ? 'Schwelle erfüllt, Messung eingestellt: ' + s.runden + ' Runden über ' + s.tage +
                 ' Tage und ' + s.marktlagen + ' Marktlagen, jede mit mindestens ' + LAGE_MINDEST + ' Runden.'
               : null };
  }
  function zielMinuteWuerfeln(jetzt) {
    var sm = (window.Boerse && window.Boerse.sitzungsMinuten) ? window.Boerse.sitzungsMinuten(jetzt) : 390;
    if (!sm) return null;                       // kein Handelstag
    /* Nicht in den ersten Minuten (dort ist die Spanne am weitesten und die
     * bisherige Stichprobe klebt ohnehin dort) und nicht in den letzten 20 -
     * eine Runde braucht Zeit zum Oeffnen UND Schliessen. */
    var von = 10, bis = Math.max(von + 1, sm - 20);
    return von + Math.floor(Math.random() * (bis - von));
  }
  /** Steht fuer diesen Tag schon eine Aktien-Runde in den DATEN? Das Merkmal im
   *  Arbeitsspeicher allein genuegt nicht: nach einem App-Neustart waere es leer,
   *  und aus "eine Runde je Handelstag" wuerde "eine je Programmstart". Eine von
   *  Hand geklickte Runde zaehlt ausdruecklich mit - der Tag ist gemessen, egal
   *  wer ausgeloest hat. */
  function heuteSchonGemessen(tag, gefaess) {
    var r = kostenRunden(), g = gefaess || 'capital';
    for (var i = 0; i < r.length; i++) {
      if (r[i].krypto) continue;
      if (((r[i] && r[i].gefaess) || 'capital') !== g) continue;
      if (r[i].uebernacht) continue;
      if (new Date(r[i].at).toISOString().slice(0, 10) === tag) return true;
    }
    return false;
  }
  /** Der Alpaca-Takt des Automaten: gleicher Wuerfel, nur US-Sitzung, eine Runde je
   *  Handelstag - und nie gleichzeitig mit Capital (RUNDE_LAEUFT). Abschaltbar ueber
   *  D.kostenAutomatAlpaca === false, sichtbar in alpacaStand(). */
  async function automatAlpacaNachsehen() {
    if (!D || D.kostenAutomatAlpaca === false) return;
    if (!(window.AlpAPI && window.AlpAPI.enabled())) return;
    var jetzt = Date.now();
    try { await uebernachtNachsehen(jetzt); }
    catch (e) { AUTOMAT_ALP.letzterGrund = 'Übernacht: ' + String((e && e.message) || e); }
    try { await uebernachtNachtragen(); } catch (e) { /* naechste Stunde */ }
    if (RUNDE_LAEUFT) return;
    if (alpacaFertig()) return;
    var tag = isoTag(jetzt);
    if (AUTOMAT_ALP.tag !== tag) { AUTOMAT_ALP.tag = tag; AUTOMAT_ALP.zielMin = zielMinuteWuerfeln(jetzt); }
    if (AUTOMAT_ALP.zielMin == null) return;
    if (AUTOMAT_ALP.gemessenAm === tag) return;
    if (heuteSchonGemessen(tag, 'alpaca')) return;
    if (!(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen())) return;
    var m = (window.Quant && window.Quant.minutenSeitOeffnung) ? window.Quant.minutenSeitOeffnung(jetzt) : null;
    if (m == null || m < AUTOMAT_ALP.zielMin) return;
    AUTOMAT_ALP.gemessenAm = tag;
    var wahl = await naechstesAlpacaSymbol();
    if (!wahl) { AUTOMAT_ALP.letzterGrund = 'kein Kandidat mit Umsatzklasse gefunden'; return; }
    var lage = null;
    try {
      if (marktlageLesen) { var auf = await marktlageLesen(); lage = auf === true ? 'trend-auf' : auf === false ? 'trend-ab' : null; }
    } catch (e) { lage = null; }
    var r = null;
    try { r = await kostenRundeMessen(wahl.sym, lage, 'alpaca'); }
    catch (e) { r = { ok: false, grund: String((e && e.message) || e) }; }
    AUTOMAT_ALP.letzterGrund = wahl.sym + ' (' + wahl.klasse + ' Mio $, ' + wahl.quelle + '): ' +
      ((r && r.ok) ? 'Umlauf ' + (r.rundePct != null ? r.rundePct.toFixed(3) : '?') + ' %'
        : ((r && r.grund) || 'Die Runde lief nicht durch.'));
  }
  function naechstesAktiensymbol() {
    var liste = [];
    try { liste = (universe ? universe() : []) || []; } catch (e) { liste = []; }
    liste = liste.filter(function (s) { return typeof s === 'string' && !(istKrypto && istKrypto(s)); });
    if (!liste.length) return null;
    var s = liste[automatTakt % liste.length];
    automatTakt++;
    return s;
  }
  /** Der Blick auf die Uhr. Setzt selbst keine Order ab, wenn irgendetwas fehlt. */
  async function automatNachsehen() {
    /* Erst das Aktien-Gefaess (Uebernacht-Zustand und Tagesrunde), dann Capital - nacheinander,
     * beide ueber dieselbe Sperre. Ein Fehler auf der einen Seite haelt die andere nicht auf. */
    try { await automatAlpacaNachsehen(); } catch (e) { AUTOMAT_ALP.letzterGrund = String((e && e.message) || e); }
    if (!D || D.kostenAutomat === false) return;
    if (RUNDE_LAEUFT) return;
    if (automatFertig()) return;               // fertig: nichts mehr, die Anzeige sagt es
    var jetzt = Date.now();
    var tag = new Date(jetzt).toISOString().slice(0, 10);
    if (AUTOMAT.tag !== tag) { AUTOMAT.tag = tag; AUTOMAT.zielMin = zielMinuteWuerfeln(jetzt); }
    if (AUTOMAT.zielMin == null) return;       // kein Handelstag
    if (AUTOMAT.gemessenAm === tag) return;    // in dieser Sitzung schon versucht
    if (heuteSchonGemessen(tag)) return;       // und die Daten sagen dasselbe ueber Neustarts hinweg
    if (!(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen())) return;
    var m = (window.Quant && window.Quant.minutenSeitOeffnung) ? window.Quant.minutenSeitOeffnung(jetzt) : null;
    if (m == null || m < AUTOMAT.zielMin) return;
    var sym = naechstesAktiensymbol();
    if (!sym) return;
    /* Der Tag gilt als verbraucht, BEVOR gemessen wird: sonst versucht es ein
     * Fehlschlag in der naechsten Minute erneut, und aus einer Runde je Tag
     * wird Dauerfeuer echter Orders. */
    AUTOMAT.gemessenAm = tag;
    var lage = null;
    try {
      if (marktlageLesen) {
        var auf = await marktlageLesen();
        lage = auf === true ? 'trend-auf' : auf === false ? 'trend-ab' : null;
      }
    } catch (e) { lage = null; }
    var r = null;
    try { r = await kostenRundeMessen(sym, lage); }
    catch (e) { r = { ok: false, grund: String((e && e.message) || e) }; }
    AUTOMAT.letzterGrund = (r && r.ok)
      ? sym + ': Umlauf ' + (r.rundePct != null ? r.rundePct.toFixed(3) : '?') + ' %'
      : sym + ': ' + ((r && r.grund) || 'Die Runde lief nicht durch.');
  }

    /* ===== Spannen-Messung (22.08.2026) =====
     * Capital.com liefert Geld- UND Briefkurs. Deren Abstand IST die Kostenhuerde
     * einer Runde: gekauft wird zum Brief, verkauft zum Geld - wer ein- und
     * aussteigt, zahlt die Spanne einmal. Damit ist die Zahl, an der fast jede
     * Studie haengt (Annahme 0,10 %), in EINER Handelssitzung messbar statt in
     * Wochen: die Fill-Messung braucht ~20 abgeschlossene Runden, diese hier
     * braucht nur Kurse.
     * Schonend: sechs Werte je Takt im Wechsel, nur bei offener Boerse. */
    var spannenTakt = 0;
    async function spannenProbe() {
      if (!(window.CapAPI && window.CapAPI.enabled() && window.CapAPI.quote)) return;
      if (!(window.Dash && window.Dash.marketOpen())) return;
      var syms = universe();
      if (!syms.length) return;
      var teil = [];
      for (var i = 0; i < 6 && i < syms.length; i++) teil.push(syms[(spannenTakt * 6 + i) % syms.length]);
      spannenTakt++;
      if (!D.spannen) D.spannen = { proben: [], seit: Date.now() };
      for (var j = 0; j < teil.length; j++) {
        try {
          var q = await window.CapAPI.quote(teil[j]);
          if (q && q.spreadPct != null && isFinite(q.spreadPct) && q.spreadPct >= 0 && q.spreadPct < 0.2) {
            D.spannen.proben.unshift({ at: Date.now(), sym: teil[j], spreadPct: Math.round(q.spreadPct * 1e6) / 1e6 });
          }
        } catch (eQ) { /* eine Absage kippt die Messung nicht */ }
      }
      /* Der Ringpuffer haelt rund 16 Handelstage. Bevor der aelteste Tag lautlos
       * herausfaellt, wird er als Median je Wert festgeschrieben - 15 Zahlen am Tag,
       * die bleiben. Ohne das waere weder "haelt die Annahme ueber Wochen?" noch
       * "ist die enge Haelfte dauerhaft enger?" jemals zu beantworten. */
      spannenTagFestschreiben();
      if (D.spannen.proben.length > 4000) D.spannen.proben = D.spannen.proben.slice(0, 4000);
      save();
    }
    /** Je Tag und Wert einen Median festhalten. Laeuft nach jeder Probenrunde; der
     *  laufende Tag wird dabei ueberschrieben, fertige Tage bleiben unberuehrt. */
    function spannenTagFestschreiben() {
      var sp = D && D.spannen;
      if (!sp || !sp.proben || !sp.proben.length) return;
      if (!sp.tage) sp.tage = {};
      var heute = new Date().toISOString().slice(0, 10);
      var jeSym = {};
      for (var i = 0; i < sp.proben.length; i++) {
        var p = sp.proben[i];
        if (new Date(p.at).toISOString().slice(0, 10) !== heute) continue;
        (jeSym[p.sym] = jeSym[p.sym] || []).push(p.spreadPct);
      }
      var tag = {};
      Object.keys(jeSym).forEach(function (s) {
        var a = jeSym[s].sort(function (x, y) { return x - y; });
        tag[s] = { n: a.length, med: Math.round(a[Math.floor(a.length / 2)] * 1e6) / 1e6 };
      });
      if (Object.keys(tag).length) sp.tage[heute] = tag;
      /* Sehr grosszuegig aufraeumen: 15 Werte je Tag sind wenige hundert Bytes.
       * Wer hier zu frueh loescht, loescht genau die Historie, fuer die das da ist. */
      var alt = Date.now() - 5 * 365 * 86400000;
      Object.keys(sp.tage).forEach(function (k) {
        if (new Date(k + 'T00:00:00Z').getTime() < alt) delete sp.tage[k];
      });
    }


  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (Depot-Reset weist D neu zu). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  function verkabeln(deps) {
    holeDepot = deps.depot;
    save = deps.save;
    melde = deps.melde;
    universe = deps.universe;
    istKrypto = deps.istKrypto;
    HEALTH = deps.HEALTH;
    /* Der Regime-Anker wohnt im Handelsmodul (validiert, t=3,2) und wird
     * hereingereicht statt nachgebaut - der Automat soll dieselbe Marktlage
     * stempeln wie der Knopf. */
    marktlageLesen = deps.marktlage || null;
    /* Aktien-Gefaess: Kandidaten (Momentum-Korb + Intraday-Signalliste), Tagesdaten
     * mit Stueckzahlen und der Kurslader - alles hereingereicht, nichts nachgebaut. */
    kandidatenAlpaca = deps.kandidatenAlpaca || null;
    mfTagesdaten = deps.mfTagesdaten || null;
    kurseHolen = deps.kurse || null;
    /* Das Nebenlager frueh laden - dann steht die Reihe, bevor die erste
     * Bilanz gezeichnet oder die erste Runde geschrieben wird. */
    messungHolen();
  }

  window.Kosten = {
    verkabeln: verkabeln,
    kostenMessungNeu: mitFrischemD(kostenMessungNeu),
    capFehlerNeu: mitFrischemD(capFehlerNeu),
    spanneStempeln: mitFrischemD(spanneStempeln),
    spannenBilanz: mitFrischemD(spannenBilanz),
    spannenAusKerzen: mitFrischemD(spannenAusKerzen),
    spannenHistorie: mitFrischemD(spannenHistorie),
    kostenRundeMessen: mitFrischemD(kostenRundeMessen),
    kostenBilanz: mitFrischemD(kostenBilanz),
    kostenStreuung: kostenStreuung,   /* rein rechnend, braucht kein frisches D */
    kostenRunden: mitFrischemD(kostenRunden),
    automatNachsehen: mitFrischemD(automatNachsehen),
    automatStand: mitFrischemD(automatStand),
    /* Aktien-Gefaess (Alpaca-Paper) */
    alpacaBilanz: mitFrischemD(alpacaBilanz),
    alpacaStand: mitFrischemD(alpacaStand),
    naechstesAlpacaSymbol: mitFrischemD(naechstesAlpacaSymbol),
    verworfene: function () { return (MESSUNG && MESSUNG.verworfen) || []; },
    UMSATZ_KLASSEN: UMSATZ_KLASSEN, umsatzKlasse: umsatzKlasse, KLASSE_MINDEST: KLASSE_MINDEST,
    probe: mitFrischemD(spannenProbe),
    tagFestschreiben: mitFrischemD(spannenTagFestschreiben)
  };
})();
