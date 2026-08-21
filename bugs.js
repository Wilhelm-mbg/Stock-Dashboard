'use strict';
/* ================= Fehler melden =================
 *
 * Zwei Wege, wie ein Fehler hier ankommt:
 *
 *  1. VON HAND. Ein Feld, in das man schreibt, was nicht stimmt — auch Kosmetik.
 *     "Der Text läuft aus dem Kasten" ist eine gültige Meldung.
 *
 *  2. VON SELBST. Jeder JavaScript-Fehler wird im Hintergrund mitgeschnitten und der
 *     nächsten Meldung beigelegt. Das ist der wertvollere Teil: Was still im Hintergrund
 *     abstürzt, merkt man beim Benutzen oft gar nicht — man sieht nur, dass etwas fehlt.
 *     Genau solche Fehler haben in diesem Projekt schon Wochen gekostet (der Worker-Pool,
 *     der sich selbst abschaltete, fiel nur auf, weil ein Backtest zu lange dauerte).
 *
 * Die Meldungen landen als JSON im Daten-Ordner. Von dort liest sie ein geplanter
 * Auftrag, bewertet sie und schreibt seinen Befund zurück — der Status unten kommt
 * aus derselben Datei.
 */
(function () {
  var U = window.U;
  var FEHLER = [];          // im Hintergrund mitgeschnitten, höchstens 20

  function merke(art, nachricht, quelle, zeile, stapel) {
    try {
      FEHLER.push({
        at: new Date().toISOString(), art: art,
        nachricht: String(nachricht || '').slice(0, 500),
        quelle: String(quelle || '').split('/').pop().slice(0, 80),
        zeile: zeile || null,
        stapel: String(stapel || '').split('\n').slice(0, 4).join(' | ').slice(0, 500)
      });
      if (FEHLER.length > 20) FEHLER.shift();
      var z = document.getElementById('bugFehlerZahl');
      if (z) {
        z.textContent = FEHLER.length
          ? FEHLER.length + ' Fehler automatisch mitgeschnitten – sie werden der Meldung beigelegt.'
          : '';
      }
    } catch (e) { /* Der Mitschnitt darf nie selbst etwas kaputt machen */ }
  }

  window.addEventListener('error', function (e) {
    merke('fehler', e.message, e.filename, e.lineno, e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    merke('versprechen', r && (r.message || r), '', null, r && r.stack);
  });

  /* Welcher Tab ist gerade offen? Das ist bei einer Meldung fast immer die erste
     Rückfrage, also wird sie gleich mitbeantwortet. */
  function offenerTab() {
    var t = document.querySelector('.tab.active, .tab:not([style*="display: none"])');
    var b = document.querySelector('nav button.active, .tabs button.active');
    return (b && b.textContent.trim()) || (t && t.id) || null;
  }

  function statusText(m) {
    if (m.status === 'behoben') return { txt: 'behoben', farbe: 'var(--up)' };
    if (m.status === 'abgelehnt') return { txt: 'nicht behoben', farbe: 'var(--muted)' };
    if (m.status === 'geprueft') return { txt: 'geprüft, eingeplant', farbe: 'var(--warn)' };
    return { txt: 'offen', farbe: 'var(--ink-2)' };
  }

  async function zeigeListe() {
    var el = document.getElementById('bugListe');
    if (!el || !window.api.bugList) return;
    var r = await window.api.bugList();
    var ms = (r && r.meldungen) || [];
    if (!ms.length) {
      el.innerHTML = '<div class="empty" style="padding:8px 0;">Noch nichts gemeldet.</div>';
      return;
    }
    var offen = ms.filter(function (m) { return m.status === 'offen'; }).length;
    var behoben = ms.filter(function (m) { return m.status === 'behoben'; }).length;
    el.innerHTML =
      '<div style="font-size:11.5px; color:var(--muted); margin-bottom:6px;">' +
        ms.length + ' Meldungen · ' + offen + ' offen · ' + behoben + ' behoben</div>' +
      '<div style="max-height:280px; overflow:auto;">' +
      ms.slice(0, 40).map(function (m) {
        var st = statusText(m);
        return '<div style="border-left:3px solid ' + st.farbe + '; padding:6px 10px; margin-bottom:6px; background:var(--panel);">' +
          '<div style="font-size:12.5px;">' + U.esc(m.text.slice(0, 220)) + (m.text.length > 220 ? ' …' : '') + '</div>' +
          '<div style="font-size:11px; color:var(--muted); margin-top:3px;">' +
            new Date(m.gemeldet).toLocaleString('de-DE') + ' · ' + U.esc(m.art) + ' · ' + U.esc(m.schwere) +
            (m.bereich ? ' · ' + U.esc(m.bereich) : '') +
            ' · <b style="color:' + st.farbe + ';">' + st.txt + '</b>' +
            ((m.fehlerprotokoll || []).length ? ' · ' + m.fehlerprotokoll.length + ' Fehler beigelegt' : '') +
          '</div>' +
          (m.bewertung ? '<div style="font-size:11.5px; color:var(--ink-2); margin-top:4px; padding-top:4px; border-top:1px solid var(--grid);">' +
            U.esc(m.bewertung) + '</div>' : '') +
        '</div>';
      }).join('') + '</div>';
  }

  async function senden() {
    var t = document.getElementById('bugText');
    var st = document.getElementById('bugStatus');
    if (!t || !window.api.bugReport) return;
    var text = t.value.trim();
    if (!text) { st.textContent = 'Bitte kurz beschreiben, was nicht stimmt.'; return; }
    st.textContent = 'Wird gespeichert …';
    var r = await window.api.bugReport({
      text: text,
      art: (document.getElementById('bugArt') || {}).value || 'sonstiges',
      schwere: (document.getElementById('bugSchwere') || {}).value || 'aergerlich',
      bereich: offenerTab(),
      fenster: window.innerWidth + '×' + window.innerHeight,
      fehler: FEHLER
    });
    if (r && r.ok) {
      t.value = '';
      FEHLER.length = 0;
      var z = document.getElementById('bugFehlerZahl');
      if (z) z.textContent = '';
      st.textContent = 'Gemeldet. Die Meldung liegt im Daten-Ordner und wird beim nächsten Prüflauf bewertet.';
      zeigeListe();
    } else {
      st.textContent = 'Nicht gespeichert: ' + ((r && r.msg) || 'unbekannter Fehler');
    }
  }

  function bereit() {
    var b = document.getElementById('bugSendBtn');
    if (b) b.addEventListener('click', senden);
    var a = document.getElementById('bugAktualisierenBtn');
    if (a) a.addEventListener('click', zeigeListe);
    // Strg+Enter im Textfeld schickt ab – wer gerade tippt, will nicht zur Maus greifen
    var t = document.getElementById('bugText');
    if (t) t.addEventListener('keydown', function (e) { if (e.ctrlKey && e.key === 'Enter') senden(); });
    zeigeListe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.Bugs = { merke: merke, liste: zeigeListe, fehlerListe: function () { return FEHLER.slice(); } };
})();
