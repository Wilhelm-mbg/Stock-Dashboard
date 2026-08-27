'use strict';
/* ================= Echte Handelskosten und Spannen (Capital.com-Demo) =================
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
  var D = null;

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
    m.runden.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    if (m.runden.length > 300) m.runden = m.runden.slice(0, 300);
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
      var depotAlt = (D && D.kostenMessung && Array.isArray(D.kostenMessung.runden)) ? D.kostenMessung.runden : [];
      MESSUNG = messungMischen(v, frueh, depotAlt);
      if (frueh.length || depotAlt.length) messungSchreiben();
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
      at: Date.now(), sym: p.sym, dir: p.dir, basis: !!p.basis,
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
  async function kostenRundeMessen(sym, marktlage) {
    if (RUNDE_LAEUFT) {
      /* Auch dieser Ausgang wird vermerkt: ein Versuch, dessen Ausgang niemand
       * nachlesen kann, ist kein Messgeschirr - das galt fuer die fruehe Sperre
       * am 25.08. und gilt fuer diese genauso. */
      var gSperre = 'Es läuft bereits eine Messrunde.';
      kostenVersuchNeu(sym, false, gSperre);
      return { ok: false, grund: gSperre };
    }
    RUNDE_LAEUFT = true;
    try { return await kostenRundeKern(sym, marktlage); }
    finally { RUNDE_LAEUFT = false; }
  }
  async function kostenRundeKern(sym, marktlage) {
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
  if (typeof window !== 'undefined') window.__kostenRundeMessen = kostenRundeMessen;

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
  function kostenStreuung(runden) {
    var tage = {}, lagen = {}, ohneLage = 0, n = 0;
    (runden || []).forEach(function (x) {
      if (x.krypto) return;
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
        .filter(function (x) { return !!x.krypto === nurKrypto; })
        .map(function (x) { return x.runde; })
        .filter(function (v) { return v != null && isFinite(v); });
    }
    function med(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
    var r = werte(false);
    var k = werte(true);
    if (!r.length && !k.length) return null;
    var aus = { n: r.length, annahmePct: 0.10,
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
  /** Der Stand fuer die Anzeige - der Automat endet nie stillschweigend. */
  function automatStand() {
    var s = kostenStreuung(kostenRunden());
    var fertig = automatFertig();
    return { an: !(D && D.kostenAutomat === false), fertig: fertig, streuung: s,
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
  function heuteSchonGemessen(tag) {
    var r = kostenRunden();
    for (var i = 0; i < r.length; i++) {
      if (r[i].krypto) continue;
      if (new Date(r[i].at).toISOString().slice(0, 10) === tag) return true;
    }
    return false;
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
    probe: mitFrischemD(spannenProbe),
    tagFestschreiben: mitFrischemD(spannenTagFestschreiben)
  };
})();
