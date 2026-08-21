'use strict';
/* ================= Diagnose-Versand =================
 *
 * Wer die App benutzt, kann Diagnosedaten an die zentrale Auswertung schicken —
 * als GitHub-Issue im Projekt-Repo, wo sie gesammelt und ausgewertet werden.
 *
 * DREI REGELN, die nicht verhandelbar sind:
 *
 * 1. NUR MIT EINWILLIGUNG. Beim ersten Start fragt die App einmal, mit vollständiger
 *    Liste dessen, was gesendet würde. Ohne Ja wird nichts gesendet, nie. Stille
 *    Telemetrie von fremden Rechnern wäre ein DSGVO-Verstoß und würde das Vertrauen
 *    in die App zerstören — ein Häkchen kostet nichts, ein Skandal alles.
 *
 * 2. WEISSE LISTE statt schwarzer. Gesendet wird ausschließlich, was unten in
 *    baueDiagnose() ausdrücklich aufgezählt ist. Niemals: Zugangsdaten, Watchlist,
 *    einzelne Positionen oder Symbole, KI-Regeln, Dateipfade. Ein Test in test-v6.js
 *    prüft das mit vergifteten Eingaben nach.
 *
 * 3. ANONYM. Eine zufällige Installations-Kennung statt Name/E-Mail — genug, um
 *    Meldungen derselben Installation zu gruppieren, zu wenig, um jemanden zu kennen.
 *
 * Transport: automatisch, wenn die App mit einer telemetrie.json gebaut wurde
 * (feingranulares GitHub-Token, nur Issues, nur ein Repo). Ohne Token öffnet der
 * Senden-Knopf ein vorausgefülltes GitHub-Issue im Browser — der Nutzer sieht alles
 * und schickt selbst ab.
 */
(function (root) {

  /** Reine Zusammenstellung — testbar in Node. Alles per WEISSER LISTE.
   *  meta: {version, plattform, electron, installId}
   *  extra: {health, zeitzone, sprache, termineWerte, tagesdatenStand, tagesdatenWerte} */
  function baueDiagnose(einstellungen, depot, fehler, meta, extra) {
    einstellungen = einstellungen || {};
    depot = depot || {};
    extra = extra || {};
    var h = extra.health || {};

    /** Ein Trade-Bündel zu Summen und Quoten eindampfen — nie einzelne Trades. */
    function summen(trades) {
      var gew = trades.filter(function (t) { return t.pnl > 0; });
      return {
        n: trades.length,
        treffer: trades.length ? Math.round(100 * gew.length / trades.length) : null,
        pnl: Math.round(trades.reduce(function (a, t) { return a + (t.pnl || 0); }, 0) * 100) / 100
      };
    }
    /** Ein Mittelfrist-Buch als Eckdaten — Zählwerte und Zeitpunkte, keine Symbole. */
    function buchEcken(b) {
      if (!b) return null;
      return {
        start: b.start, cash: Math.round((b.cash || 0) * 100) / 100,
        positionen: (b.positionen || []).length, trades: (b.trades || []).length,
        seit: b.angelegt || null, letztesRebalance: b.letztesRebalanceT || null
      };
    }
    var geschlossen = (depot.trades || []).filter(function (t) { return t && t.status === 'closed'; });
    var verlauf = depot.mfVerlauf || [];

    var d = {
      art: 'diagnose', version: meta.version || '?', plattform: meta.plattform || '?',
      electron: meta.electron || '?', installId: meta.installId || '?',
      stand: new Date().toISOString(),

      // Welche Funktionen sind an, und wie sind sie eingestellt? (Nutzungsbild, keine Inhalte)
      nutzung: {
        intradayAn: !!(depot.intraday && depot.intraday.enabled),
        modus: depot.intraday ? depot.intraday.mode : null,
        instrument: depot.intraday ? (depot.intraday.instrument || 'schein') : null,
        zeitrahmen: depot.intraday ? depot.intraday.interval : null,
        haltedauerMin: depot.intraday ? depot.intraday.scalpHold : null,
        profil: depot.intraday && (depot.intraday.instrument || 'schein') === 'schein' ? depot.intraday.profile : null,
        klumpenMax: depot.intraday && depot.intraday.klumpenMax != null ? depot.intraday.klumpenMax : 8,
        pool: (depot.intraday && depot.intraday.pool) || 'auto',
        kapiZusatz: !!(depot.intraday && depot.intraday.kapiZusatz),
        regimeZuteilung: !!(depot.intraday && depot.intraday.regimeZuteilung),
        kryptoHandeln: !!(depot.intraday && depot.intraday.kryptoHandeln),
        schattenImmer: !(depot.intraday && depot.intraday.schattenImmer === false),
        momentumAn: !!depot.momentumAn,
        driftAn: !!depot.driftAn,
        maxRisikostufe: depot.maxRisikostufe || 5,
        kiVeto: !!einstellungen.kiVeto,
        rechenstand: depot.rechenstand != null ? depot.rechenstand : null
      },

      /* Betriebsdaten für die Ferndiagnose. Die Zeitzone ist dabei die wichtigste
       * Einzelinformation: Die gesamte Handelszeit-Logik nimmt Berlin an — läuft die
       * App in einer anderen Zeitzone, erklärt das eine ganze Klasse scheinbarer
       * Fehler (Scans zur falschen Zeit, leere Tagesschluss-Fenster). */
      betrieb: {
        zeitzone: extra.zeitzone || null,
        sprache: extra.sprache || null,
        sendeweg: extra.sendeweg || null,
        laufzeitMin: h.startedAt ? Math.round((Date.now() - h.startedAt) / 60000) : null,
        scans: h.scans || 0, scanFehler: h.scanErrors || 0,
        abrufeOk: h.fetchOk || 0, abrufeFehl: h.fetchFail || 0,
        kiOk: h.kiOk || 0, kiFehl: h.kiFail || 0,
        killSwitch: h.killSwitch || 0, alteKurse: h.staleBars || 0, workerAusfaelle: h.workerFail || 0,
        /* Gesamtsummen ueber ALLE Sitzungen. Die Sitzungszaehler oben stehen kurz
         * nach dem Start immer bei null (die erste Tester-Diagnose kam nach einer
         * Minute Laufzeit - nichtssagend); erst die Summe zeigt, wie die
         * Installation wirklich lebt. Felder einzeln benannt: weisse Liste. */
        gesamt: extra.gesamt ? {
          seit: extra.gesamt.seit || null,
          sitzungen: extra.gesamt.sitzungen || 0,
          laufzeitMin: extra.gesamt.laufzeitMin || 0,
          scans: extra.gesamt.scans || 0, scanFehler: extra.gesamt.scanErrors || 0,
          abrufeOk: extra.gesamt.fetchOk || 0, abrufeFehl: extra.gesamt.fetchFail || 0,
          kiOk: extra.gesamt.kiOk || 0, kiFehl: extra.gesamt.kiFail || 0,
          killSwitch: extra.gesamt.killSwitch || 0, alteKurse: extra.gesamt.staleBars || 0,
          workerAusfaelle: extra.gesamt.workerFail || 0
        } : null
      },

      /* Der VORWÄRTSTEST — der wichtigste Evidenzkanal. Die Schatten-Bilanz sagt, ob
       * die Strategie draußen trägt, BEVOR Kapital im Spiel ist. Nur Aggregate je
       * Grund (n, Summe, gerettet, verhindert) plus der Konfigurations-Fingerabdruck,
       * damit die Auswertung Vergleichbares zusammenlegen kann. Keine Symbole. */
      vorwaertstest: {
        konfig: depot.schattenKonfig || null,
        offen: (depot.schatten || []).filter(function (x) { return x.status === 'open'; }).length,
        abgeschlossen: (depot.schatten || []).filter(function (x) { return x.status === 'closed'; }).length,
        bilanz: depot.schattenStat || {}
      },

      // Kennzahlen JE STRATEGIE getrennt — ein Topf über alles verwischt genau die
      // Frage, die die Auswertung stellt: Welche Strategie läuft draußen wie?
      kennzahlen: {
        intraday: summen(geschlossen.filter(function (t) { return t.strategy === 'intraday'; })),
        stunden: summen(geschlossen.filter(function (t) { return t.strategy === 'hourly'; })),
        altbestand: summen(geschlossen.filter(function (t) { return !t.strategy; })),
        basisTrades: geschlossen.filter(function (t) { return t.basis; }).length,
        positionenOffen: (depot.positions || []).length,
        /* Wie lange steht die aelteste offene Position schon? Der groesste je
         * gemessene Schaden (−3.719 $ auf dem Demo-Konto) kam nicht von schlechten
         * Signalen, sondern von tagelang UNBEAUFSICHTIGTEN Scheinen im Theta-Verfall.
         * Diese eine Zahl macht das Muster aus der Ferne sichtbar. */
        aeltesteOffeneStd: (depot.positions || []).reduce(function (a, p) {
          var std = p && p.openT ? Math.round((Date.now() - p.openT) / 3600000) : 0;
          return Math.max(a, std);
        }, 0) || 0,
        /* EINZELNE abgeschlossene Trades - das Herzstueck der Auswertung. Aggregate
         * sagen DASS gehandelt wurde; erst die Trade-Ebene zeigt WIE: Haltedauern,
         * Uhrzeiten, Ausstiegsgruende, Ergebnisverteilung. Bewusst OHNE Symbol
         * (das Versprechen der weissen Liste) - jedes Feld einzeln benannt,
         * gedeckelt auf die letzten 60. */
        einzelTrades: geschlossen.slice(0, 60).map(function (t) {
          var move = (t.entrySpot > 0 && t.exitSpot > 0)
            ? ((t.exitSpot / t.entrySpot - 1) * (t.dir === 'put' ? -1 : 1) * 100) : null;
          return {
            strategie: t.strategy || null,
            modus: t.modus || null,
            richtung: t.dir || null,
            basis: !!t.basis, krypto: !!t.krypto, uebernacht: !!t.uebernacht,
            eroeffnet: t.openT || null,
            geschlossen: t.closeT || null,
            haltedauerMin: (t.openT && t.closeT) ? Math.round((t.closeT - t.openT) / 60000) : null,
            pnl: typeof t.pnl === 'number' ? Math.round(t.pnl * 100) / 100 : null,
            bewegungPct: move != null ? Math.round(move * 100) / 100 : null,
            grund: t.why ? String(t.why).slice(0, 60) : null
          };
        })
      },

      /* Die Mittelfrist-Bücher mit BEWERTETEN Ständen aus dem Tagesverlauf.
       * Der frühere Wert war ein Bug: Er sendete nur den Kassenbestand — nach dem
       * ersten Rebalancing (Kasse ≈ 0) sah jedes Momentum-Buch wie ein Totalverlust
       * aus. Der Verlauf trägt die täglich MARKIERTEN Buchwerte samt SPY-Vergleich. */
      buecher: {
        momentum: buchEcken(depot.mfBuch),
        drift: buchEcken(depot.driftBuch),
        verlauf: verlauf.length ? {
          tage: verlauf.length,
          erster: verlauf[0],
          letzter: verlauf[verlauf.length - 1],
          /* Die komplette Tagesreihe (gedeckelt auf 90 Punkte): erst die Kurve
           * erlaubt Drawdown-, Volatilitaets- und SPY-Vergleichsrechnung - zwei
           * Eckpunkte koennen einen zwischenzeitlichen Einbruch komplett verstecken.
           * Nur Zahlen, keine Symbole. */
          reihe: verlauf.slice(-90).map(function (v) {
            return { t: v.t, momentum: v.momentum, drift: v.drift, spy: v.spy };
          })
        } : null
      },

      // Funktionieren die Datenleitungen beim Nutzer? Leere Leitungen erklären
      // "die Strategie tut nichts" ohne jeden Programmfehler.
      daten: {
        termineWerte: extra.termineWerte != null ? extra.termineWerte : null,
        tagesdatenStand: extra.tagesdatenStand || null,
        tagesdatenWerte: extra.tagesdatenWerte != null ? extra.tagesdatenWerte : null
      },

      // Automatisch mitgeschnittene Programmfehler — der wertvollste Teil: was still
      // abstürzt, merkt der Nutzer oft gar nicht. Quelle/Zeile ja, Pfade nein.
      fehler: (fehler || []).slice(-20)
    };
    return d;
  }

  /* ---------------- ab hier Browser-Verdrahtung ---------------- */
  if (typeof window === 'undefined') {
    module.exports = { baueDiagnose: baueDiagnose };
    return;
  }

  var U = window.U;
  var ZUSTAND = null;    // {einwilligung, installId, letzterVersand}

  function D() { return window.__D ? window.__D() : null; }

  async function zustand() {
    if (ZUSTAND) return ZUSTAND;
    var g = (await window.api.storeGet('diagnose')) || {};
    if (!g.installId) {
      // Zufaellige Kennung, einmal je Installation. Kein Name, keine E-Mail, keine
      // Hardware-Merkmale - nur genug, um Meldungen derselben Installation zu gruppieren.
      g.installId = 'inst-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
      await window.api.storeSet('diagnose', g);
    }
    ZUSTAND = g;
    return g;
  }
  async function speichere() { if (ZUSTAND) await window.api.storeSet('diagnose', ZUSTAND); }

  async function sammle() {
    var s = window.getSettings ? window.getSettings() : {};
    var z = await zustand();
    var ver = '?';
    try { ver = await window.api.appVersion(); } catch (e) { }
    // Zusatzdaten, die nicht am Depot-Objekt hängen: Gesundheit, Umgebung, Datenleitungen
    var extra = { health: null, zeitzone: null, sprache: null, termineWerte: null, tagesdatenStand: null, tagesdatenWerte: null };
    try { extra.health = window.__health ? window.__health() : null; } catch (e) { }
    // Gesamtzaehler ueber alle Sitzungen (frisch abgeglichen, siehe depot.js)
    try { extra.gesamt = window.__healthGesamt ? window.__healthGesamt() : null; } catch (e) { }
    // Der Sendeweg samt Grund - erklaert aus der Ferne, warum eine Installation im
    // Browser-Modus haengt, statt automatisch zu senden.
    try {
      var cfgS = await window.api.diagnoseConfig();
      extra.sendeweg = cfgS ? (cfgS.auto ? 'automatisch' : 'browser (' + (cfgS.grund || '?') + ')') : null;
    } catch (e) { }
    try { extra.zeitzone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { }
    try { extra.sprache = navigator.language; } catch (e) { }
    try {
      var ta = await window.api.storeGet('drift_termine');
      if (ta && ta.sym) extra.termineWerte = Object.keys(ta.sym).length;
    } catch (e) { }
    try {
      var td = window.MF && window.MF.tagesdatenLesen ? await window.MF.tagesdatenLesen() : await window.api.storeGet('mf_tagesdaten');
      if (td && td.roh) { extra.tagesdatenStand = td.at || null; extra.tagesdatenWerte = Object.keys(td.roh).length; }
    } catch (e) { }
    return baueDiagnose(s, D() || {}, window.Bugs && window.Bugs.fehlerListe ? window.Bugs.fehlerListe() : [],
      { version: ver, plattform: navigator.platform, electron: (navigator.userAgent.match(/Electron\/([\d.]+)/) || [])[1] || '?', installId: z.installId },
      extra);
  }

  async function senden(anlass) {
    var z = await zustand();
    if (z.einwilligung !== true) return { ok: false, msg: 'Keine Einwilligung.' };
    var cfg = await window.api.diagnoseConfig();
    var d = await sammle();
    var titel = 'Diagnose ' + d.installId + ' · v' + d.version + (anlass ? ' · ' + anlass : '');
    var body = '```json\n' + JSON.stringify(d, null, 1) + '\n```';
    if (cfg && cfg.auto) {
      var r = await window.api.diagnoseSend(titel, body);
      if (r && r.ok) { z.letzterVersand = Date.now(); await speichere(); }
      return r;
    }
    // Kein Token in diesem Build: vorausgefuelltes Issue im Browser - der Nutzer
    // sieht den kompletten Inhalt und schickt selbst ab.
    var url = 'https://github.com/' + (cfg && cfg.repo || 'Wilhelm-mbg/Stock-Dashboard') +
      '/issues/new?title=' + encodeURIComponent(titel) + '&labels=diagnose&body=' + encodeURIComponent(body.slice(0, 6000));
    window.api.openExternal(url);
    z.letzterVersand = Date.now(); await speichere();
    return { ok: true, browser: true };
  }

  var EINWILLIGUNGSTEXT =
    'Diagnosedaten teilen?\n\n' +
    'Die App kann anonyme Diagnosedaten an die zentrale Auswertung des Projekts senden ' +
    '(als GitHub-Issue, öffentlich einsehbar). Das hilft, Fehler zu finden und zu sehen, ' +
    'ob die Strategien draußen so laufen wie in der Messung.\n\n' +
    'Gesendet wird NUR:\n' +
    '  • Programmversion, Betriebssystem, Zeitzone, Sprache, eine zufällige Installations-Kennung\n' +
    '  • welche Funktionen an sind und wie sie eingestellt sind (Strategien, Modus, Instrument, Zeitrahmen)\n' +
    '  • Summen-Kennzahlen je Strategie (Anzahl Trades, Trefferquote, Ergebnis) und die\n' +
    '    Tagesstände der virtuellen Bücher samt Marktvergleich (komplette Tagesreihe)\n' +
    '  • einzelne abgeschlossene simulierte Trades OHNE Symbol: Zeitpunkte, Richtung,\n' +
    '    Haltedauer, Ergebnis, Ausstiegsgrund (höchstens die letzten 60), sowie das\n' +
    '    Alter der ältesten offenen Position\n' +
    '  • die Vorwärtstest-Bilanz des Schattenbuchs (nur Summen je Grund)\n' +
    '  • Betriebszähler (Scans, fehlgeschlagene Kursabrufe, Laufzeit) – je Sitzung und als\n' +
    '    Gesamtsumme über alle Sitzungen – und die Größe der lokalen Datenbestände\n' +
    '  • automatisch mitgeschnittene Programmfehler\n\n' +
    'NIEMALS gesendet werden: Zugangsdaten, Watchlist, einzelne Positionen oder Symbole, ' +
    'KI-Regeln, Namen, E-Mail. Die Wahl lässt sich jederzeit in den Einstellungen ändern.';

  function banner() {
    var b = document.createElement('div');
    b.id = 'diagBanner';
    b.style.cssText = 'position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:9999;' +
      'max-width:560px; background:var(--panel); border:1px solid var(--grid); border-radius:10px;' +
      'padding:14px 16px; box-shadow:0 6px 24px rgba(0,0,0,.35); font-size:12.5px; line-height:1.55;';
    b.innerHTML = '<div style="white-space:pre-wrap;">' + U.esc(EINWILLIGUNGSTEXT) + '</div>' +
      '<div style="display:flex; gap:8px; margin-top:10px; justify-content:flex-end;">' +
      '<button class="btn ghost" id="diagNein" type="button">Nein, nichts senden</button>' +
      '<button class="btn" id="diagJa" type="button">Ja, anonym teilen</button></div>';
    document.body.appendChild(b);
    document.getElementById('diagJa').addEventListener('click', async function () {
      ZUSTAND.einwilligung = true; await speichere(); b.remove(); senden('Erststart'); zeigeStatus();
    });
    document.getElementById('diagNein').addEventListener('click', async function () {
      ZUSTAND.einwilligung = false; await speichere(); b.remove(); zeigeStatus();
    });
  }

  async function zeigeStatus() {
    var e = document.getElementById('diagStatus');
    if (!e) return;
    var z = await zustand();
    var cfg = await window.api.diagnoseConfig();
    var box = document.getElementById('diagEinwilligung');
    if (box) box.checked = z.einwilligung === true;
    e.textContent = z.einwilligung === true
      ? 'Einwilligung erteilt · Kennung ' + z.installId +
        (z.letzterVersand ? ' · zuletzt gesendet ' + new Date(z.letzterVersand).toLocaleString('de-DE') : ' · noch nichts gesendet') +
        (cfg && cfg.auto ? ' · Versand: automatisch' : ' · Versand: über den Browser (kein Sende-Token in diesem Build)')
      : z.einwilligung === false ? 'Keine Einwilligung – es wird nichts gesendet.' : 'Noch nicht entschieden.';
  }

  async function bereit() {
    var z = await zustand();
    // Erststart-Frage: genau einmal, und nur wenn noch nie entschieden wurde
    if (z.einwilligung === undefined) setTimeout(banner, 4000);

    // Woechentlicher Versand, nur mit Einwilligung und nur im Auto-Build
    setTimeout(async function () {
      var cfg = await window.api.diagnoseConfig();
      if (z.einwilligung === true && cfg && cfg.auto && Date.now() - (z.letzterVersand || 0) > 7 * 86400000) {
        senden('wöchentlich');
      }
    }, 60000);

    var box = document.getElementById('diagEinwilligung');
    if (box) box.addEventListener('change', async function () {
      (await zustand()).einwilligung = box.checked; await speichere(); zeigeStatus();
    });
    var btn = document.getElementById('diagSendenBtn');
    if (btn) btn.addEventListener('click', async function () {
      var z2 = await zustand();
      if (z2.einwilligung !== true) { zeigeStatus(); return; }
      var r = await senden('von Hand');
      var e = document.getElementById('diagStatus');
      if (e && r) e.textContent = r.ok ? (r.browser ? 'Issue im Browser geöffnet – bitte dort absenden.' : 'Gesendet.') : 'Fehler: ' + (r.msg || '?');
    });
    var vor = document.getElementById('diagVorschauBtn');
    if (vor) vor.addEventListener('click', async function () {
      var e = document.getElementById('diagVorschau');
      if (!e) return;
      e.style.display = 'block';
      e.textContent = JSON.stringify(await sammle(), null, 1);
    });
    zeigeStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.Diagnose = { senden: senden, sammle: sammle, baueDiagnose: baueDiagnose };
})(typeof window !== 'undefined' ? window : globalThis);
