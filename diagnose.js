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
   *  meta: {version, plattform, electron, installId} */
  function baueDiagnose(einstellungen, depot, fehler, meta) {
    einstellungen = einstellungen || {};
    depot = depot || {};
    var d = {
      art: 'diagnose', version: meta.version || '?', plattform: meta.plattform || '?',
      electron: meta.electron || '?', installId: meta.installId || '?',
      stand: new Date().toISOString(),

      // Welche Funktionen sind an? (Nutzungsbild, keine Inhalte)
      nutzung: {
        intradayAn: !!(depot.intraday && depot.intraday.enabled),
        modus: depot.intraday ? depot.intraday.mode : null,
        instrument: depot.intraday ? (depot.intraday.instrument || 'schein') : null,
        kryptoHandeln: !!(depot.intraday && depot.intraday.kryptoHandeln),
        schattenImmer: !(depot.intraday && depot.intraday.schattenImmer === false),
        momentumAn: !!depot.momentumAn,
        driftAn: !!depot.driftAn,
        maxRisikostufe: depot.maxRisikostufe || 5,
        kiVeto: !!einstellungen.kiVeto,
        rechenstand: depot.rechenstand != null ? depot.rechenstand : null
      },

      // Aggregierte Kennzahlen des VIRTUELLEN Depots — Summen und Quoten, nie
      // einzelne Trades, nie Symbole. Genau das, was die Auswertung braucht, um zu
      // sehen, ob Strategien draußen so laufen wie in der Messung.
      kennzahlen: (function () {
        var trades = (depot.trades || []).filter(function (t) { return t && t.status === 'closed'; });
        var gew = trades.filter(function (t) { return t.pnl > 0; });
        var pnl = trades.reduce(function (a, t) { return a + (t.pnl || 0); }, 0);
        return {
          tradesGesamt: trades.length,
          trefferquote: trades.length ? Math.round(100 * gew.length / trades.length) : null,
          pnlGesamt: Math.round(pnl * 100) / 100,
          positionenOffen: (depot.positions || []).length,
          schattenAbgeschlossen: (depot.schatten || []).filter(function (x) { return x.status === 'closed'; }).length,
          mfBuchWert: depot.mfBuch ? Math.round(((depot.mfBuch.cash || 0)) * 100) / 100 : null,
          verlaufPunkte: (depot.mfVerlauf || []).length
        };
      })(),

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
    return baueDiagnose(s, D() || {}, window.Bugs && window.Bugs.fehlerListe ? window.Bugs.fehlerListe() : [],
      { version: ver, plattform: navigator.platform, electron: (navigator.userAgent.match(/Electron\/([\d.]+)/) || [])[1] || '?', installId: z.installId });
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
    '  • Programmversion, Betriebssystem, eine zufällige Installations-Kennung\n' +
    '  • welche Funktionen an sind (Strategien, Modus, Instrument)\n' +
    '  • Summen-Kennzahlen des virtuellen Depots (Trades gesamt, Trefferquote, Ergebnis)\n' +
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
