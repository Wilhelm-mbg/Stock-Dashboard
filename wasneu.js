'use strict';
/* ================= Was ist neu =================
 *
 * Struktur-Audit Punkt 8 (25.08.2026): Die Release-Notizen werden je Vorhaben
 * ausdruecklich fuer Anwender geschrieben ("was sich fuer ihn aendert") und landen
 * im GitHub-Release - aber nach dem Auto-Update zeigte die App nirgends, was sich
 * geaendert hat. Das Material war da, nur der Ausgang fehlte.
 *
 * Ablauf: Beim Start wird die laufende Version mit der zuletzt gezeigten verglichen
 * (Store-Schluessel 'wasNeu'). Ist sie neuer, holt das Modul den Beschreibungstext
 * des Releases v<version> (nur lesend, api.github.com steht in der Host-Whitelist)
 * und zeigt ihn einmalig im Dialog. Eine Erstinstallation sieht nichts - sie hat
 * kein "vorher". Im Quellcode-Betrieb gibt es zur laufenden Version meist kein
 * Release; dann wird still gemerkt statt gezeigt.
 *
 * Das Modul darf nie stoeren: jeder Fehler endet leise, der Handel und die Kurse
 * haengen an nichts hiervon. */
(function () {
  var U = window.U;

  function merken(version) {
    try { return window.api.storeSet('wasNeu', { version: version, am: Date.now() }); }
    catch (e) { return null; }
  }

  function zeigen(version, mdText, hinweis) {
    var titel = document.getElementById('wasNeuTitle');
    var body = document.getElementById('wasNeuBody');
    if (!titel || !body) return;
    titel.textContent = 'Was ist neu in Version ' + version;
    body.innerHTML = mdText
      ? U.md(mdText)
      : '<p style="color:var(--muted);">' + U.esc(hinweis || 'Kein Beschreibungstext gefunden.') + '</p>';
    if (window.openModal) window.openModal('wasNeuModalBg');
    else { var bg = document.getElementById('wasNeuModalBg'); if (bg) bg.classList.add('open'); }
  }

  /** manuell=true: Aufruf ueber den Knopf in den Einstellungen - zeigt auch dann
   *  etwas an, wenn es nichts Neues gibt (die Notizen der laufenden Version). */
  async function pruefen(manuell) {
    try {
      if (!window.api || !window.api.updateState || !window.api.storeGet) return;
      var st = await window.api.updateState();
      var version = st && st.current;
      if (!version) return;
      var gemerkt = null;
      try { gemerkt = await window.api.storeGet('wasNeu'); } catch (e) { gemerkt = null; }
      var letzte = gemerkt && gemerkt.version;
      if (!manuell) {
        /* Erstinstallation: kein "vorher", also nichts zeigen - nur den Stand setzen,
         * damit das NAECHSTE Update eines wird. */
        if (!letzte) { merken(version); return; }
        if (letzte === version) return;
      }
      if (!st.repo) {
        if (manuell) zeigen(version, null, 'Kein Release-Repo konfiguriert – ohne Veröffentlichungsquelle gibt es keine Notizen.');
        return;
      }
      var r = await window.api.fetchText('https://api.github.com/repos/' + st.repo + '/releases/tags/v' + version);
      if (!r || !r.ok) {
        /* Kein Release zu dieser Version - im Quellcode-Betrieb der Normalfall.
         * Still merken, sonst fragt der Start taeglich dieselbe 404 ab. */
        if (manuell) zeigen(version, null, 'Zu Version ' + version + ' liegt kein veröffentlichtes Release vor (läuft die App aus dem Quellcode?).');
        else if (r && r.status === 404) merken(version);
        return;
      }
      var rel = null;
      try { rel = JSON.parse(r.body); } catch (e) { rel = null; }
      var text = rel && rel.body ? String(rel.body) : '';
      zeigen(version, text || null, text ? null : 'Das Release trägt keinen Beschreibungstext.');
      if (!manuell) merken(version);
    } catch (e) { /* still - siehe Kopfkommentar */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* Nach den Startabrufen, nicht vor ihnen - der Dialog ist das Unwichtigste am Start. */
    setTimeout(function () { pruefen(false); }, 6000);
    var b = document.getElementById('wasNeuZeigenBtn');
    if (b) b.addEventListener('click', function () { pruefen(true); });
  });
})();
