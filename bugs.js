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

  /* Titel und Issue-Koerper aus einem GESPEICHERTEN Eintrag bauen - dieselbe Funktion
     fuer den Sofortversand und den Nachversand beim Start, damit beide Wege identisch
     aussehen. Die Meldungs-ID reist mit: nur so lassen sich Doppelgaenger erkennen,
     falls eine Meldung erst per Browser und spaeter noch einmal automatisch ankommt. */
  function issueVon(m, installId) {
    var titel = 'Fehler (' + (m.art || 'sonstiges') + '): ' +
      m.text.slice(0, 70).replace(/\s+/g, ' ') + (m.text.length > 70 ? ' …' : '');
    var koerper = '**Meldung**\n\n' + m.text + '\n\n' +
      '| | |\n|---|---|\n' +
      '| Art | ' + (m.art || '?') + ' |\n' +
      '| Schwere | ' + (m.schwere || '?') + ' |\n' +
      '| Bereich | ' + (m.bereich || '?') + ' |\n' +
      '| Version | ' + ((m.umgebung && m.umgebung.version) || '?') + ' |\n' +
      '| Fenster | ' + ((m.umgebung && m.umgebung.fenster) || '?') + ' |\n' +
      '| Installation | ' + (installId || 'unbekannt') + ' |\n' +
      '| Meldungs-ID | ' + m.id + ' |\n' +
      '| Gemeldet | ' + m.gemeldet + ' |\n' +
      ((m.fehlerprotokoll || []).length
        ? '\n**Automatisch mitgeschnittene Fehler**\n\n```json\n' + JSON.stringify(m.fehlerprotokoll.slice(-10), null, 1) + '\n```\n'
        : '');
    return { titel: titel, koerper: koerper };
  }

  async function installId() {
    try { var d = (await window.api.storeGet('diagnose')) || {}; return d.installId || null; }
    catch (e) { return null; }
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
      var z = document.getElementById('bugFehlerZahl');
      if (z) z.textContent = '';
      /* Zusaetzlich ans Projekt senden - als GitHub-Issue, derselbe Transport wie die
       * Diagnose. Der Formulartext sagt das vorher an; das Absenden ist die Zustimmung.
       * Ohne diesen Weg laege die Meldung nur auf dem Rechner des Melders, und die
       * Auswertung erfuehre nie davon - genau so ist es beim allerersten Tester
       * passiert. Die lokale Datei bleibt parallel bestehen (eigener Prueflauf). */
      st.textContent = 'Lokal gespeichert – wird ans Projekt gesendet …';
      try {
        // Den frisch gespeicherten Eintrag aus der Datei holen, damit der Issue-Text
        // exakt dem entspricht, was ein Nachversand spaeter auch senden wuerde.
        var liste = await window.api.bugList();
        var mNeu = ((liste && liste.meldungen) || []).find(function (x) { return x.id === r.id; });
        var inst = await installId();
        var iss = issueVon(mNeu || { id: r.id, text: text, art: '?', gemeldet: '?' }, inst);
        var cfg = await window.api.diagnoseConfig();
        if (cfg && cfg.auto) {
          var rs = await window.api.diagnoseSend(iss.titel, iss.koerper, 'bug');
          if (rs && rs.ok && window.api.bugMarkSent) await window.api.bugMarkSent(r.id);
          st.textContent = rs && rs.ok
            ? 'Gemeldet – danke! Die Meldung ist beim Projekt angekommen und liegt zusätzlich lokal.'
            : 'Lokal gespeichert. Versand ans Projekt fehlgeschlagen (' + ((rs && rs.msg) || '?') + ') – die Meldung wird beim nächsten Start automatisch nachgesendet.';
        } else {
          /* Kein Token: vorbefuellte Issue-Seite im Browser. Der Koerper muss hier eng
             gedeckelt sein - eine zu lange Adresse quittiert GitHub mit einer leeren
             Fehlerseite, und die Meldung wirkt abgeschickt, ist es aber nicht. Vermutlich
             sind genau so zwei der ersten drei Tester-Meldungen verloren gegangen. */
          var url = 'https://github.com/' + (cfg && cfg.repo || 'Wilhelm-mbg/Stock-Dashboard') +
            '/issues/new?labels=bug&title=' + encodeURIComponent(iss.titel) + '&body=' + encodeURIComponent(iss.koerper.slice(0, 3000));
          window.api.openExternal(url);
          /* WARUM der Browser-Weg? Bisher stand hier nur, DASS er benutzt wird -
           * dadurch wirkte er wie ein sporadischer Fehler (Issue #39). Der Grund
           * steht im Hauptprozess bereit und gehoert hierher. */
          var grund = (cfg && cfg.grund) || '';
          st.textContent = 'Lokal gespeichert. Im Browser hat sich die Meldung ans Projekt geöffnet – bitte dort kurz prüfen und auf „Submit new issue“ klicken. Ohne diesen Klick bleibt die Meldung nur auf diesem Rechner.' +
            (grund && grund !== 'ok' ? ' (Grund für den Browser-Weg: ' + grund + ' – dieser Installation fehlt der Sende-Schlüssel; das nächste Update bringt ihn mit.)' : '');
        }
      } catch (eS) {
        st.textContent = 'Lokal gespeichert. Versand ans Projekt nicht möglich (' + (eS.message || eS) + ') – die Meldung wird beim nächsten Start automatisch nachgesendet.';
      }
      FEHLER.length = 0;
      zeigeListe();
    } else {
      st.textContent = 'Nicht gespeichert: ' + ((r && r.msg) || 'unbekannter Fehler');
    }
  }

  /* ---- Nachversand beim Start ----
   * Alles, was lokal liegt und das Projekt nie erreicht hat, wird nachgeschickt,
   * sobald der Token-Weg funktioniert. Nur der Token-Weg: beim Start ungefragt
   * Browser-Tabs zu oeffnen waere aufdringlich, und ob im Browser wirklich
   * abgeschickt wurde, laesst sich ohnehin nicht feststellen. Meldungen, die per
   * Browser ankamen UND nachgesendet werden, erkennt die Auswertung an der
   * Meldungs-ID und schliesst den Doppelgaenger. */
  async function nachversand() {
    try {
      if (!window.api.bugList || !window.api.bugMarkSent) return;
      var cfg = await window.api.diagnoseConfig();
      if (!cfg || !cfg.auto) return;
      var r = await window.api.bugList();
      var offen = ((r && r.meldungen) || []).filter(function (m) { return m && !m.uebermittelt; });
      if (!offen.length) return;
      /* VOR dem Senden pruefen, ob die Meldung schon als Issue existiert. Der
       * Browser-Weg kann seinen Erfolg nicht melden (der Submit-Klick passiert
       * ausserhalb der App) - beim ersten Tester hat der Nachversand deshalb
       * sechs bereits eingereichte Meldungen erneut angelegt (#18-#23). Die
       * Meldungs-ID steht in jedem Issue-Koerper; was dort schon auftaucht,
       * wird nur noch als uebermittelt vermerkt, nie erneut gesendet. */
      try {
        var cfgR = await window.api.diagnoseConfig();
        var repoR = (cfgR && cfgR.repo) || 'Wilhelm-mbg/Stock-Dashboard';
        var resR = await window.api.fetchText('https://api.github.com/repos/' + repoR + '/issues?state=all&per_page=100&sort=created&direction=desc');
        if (resR && resR.ok) {
          var koerperAlle = JSON.parse(resR.body).map(function (i2) { return i2.body || ''; }).join('\n');
          var rest = [];
          for (var v = 0; v < offen.length; v++) {
            if (koerperAlle.indexOf('| ' + offen[v].id + ' |') >= 0) {
              await window.api.bugMarkSent(offen[v].id);   // kam schon an (z. B. per Browser)
            } else rest.push(offen[v]);
          }
          offen = rest;
        }
      } catch (eD) { /* ohne Netz lieber gar nicht nachsenden als doppelt */ return; }
      if (!offen.length) { zeigeListe(); return; }
      var inst = await installId();
      var geschafft = 0;
      for (var i = 0; i < offen.length && i < 10; i++) {   // Deckel gegen Endlos-Fluten
        var iss = issueVon(offen[i], inst);
        var rs = await window.api.diagnoseSend(iss.titel, iss.koerper + '\n_Nachversand beim Start – lag bisher nur lokal._\n', 'bug');
        if (rs && rs.ok) { await window.api.bugMarkSent(offen[i].id); geschafft++; }
        else break;                                        // Sendeweg kaputt: nicht weiter haemmern
      }
      if (geschafft) {
        var st = document.getElementById('bugStatus');
        if (st) st.textContent = geschafft + ' ältere Meldung' + (geschafft > 1 ? 'en' : '') + ' ans Projekt nachgesendet.';
        zeigeListe();
      }
    } catch (e) { /* Nachversand darf den Start nie stoeren */ }
  }

  /* ---- Status-Abgleich mit dem Projekt ----
   * Was mit einer Meldung passiert, entscheidet sich im Projekt (GitHub-Issue).
   * Ohne Rueckkanal stuende hier ewig "offen", selbst wenn der Fix laengst
   * ausgeliefert ist - genau das hat der erste Tester gesehen. Der Abgleich
   * liest die oeffentlichen Issues (kein Token noetig) und zieht den lokalen
   * Status nach: geschlossen/erledigt -> behoben, geschlossen/nicht geplant ->
   * abgelehnt, Rueckfrage oder Antwort -> geprueft. Zuordnung ueber die
   * Meldungs-ID im Issue-Text; aeltere Meldungen ohne ID ueber den Titel. */
  async function statusAbgleich() {
    try {
      if (!window.api.bugList || !window.api.bugSync) return;
      var r = await window.api.bugList();
      var offen = ((r && r.meldungen) || []).filter(function (m) {
        return m && m.status !== 'behoben' && m.status !== 'abgelehnt';
      });
      if (!offen.length) return;
      var cfg = await window.api.diagnoseConfig();
      var repo = (cfg && cfg.repo) || 'Wilhelm-mbg/Stock-Dashboard';
      var res = await window.api.fetchText('https://api.github.com/repos/' + repo + '/issues?state=all&per_page=100&sort=created&direction=desc');
      if (!res || !res.ok) return;
      var issues = JSON.parse(res.body);
      if (!Array.isArray(issues)) return;
      var updates = [];
      offen.forEach(function (m) {
        var titel = 'Fehler (' + (m.art || 'sonstiges') + '): ' +
          m.text.slice(0, 70).replace(/\s+/g, ' ') + (m.text.length > 70 ? ' …' : '');
        var iss = null;
        for (var i = 0; i < issues.length && !iss; i++) {
          if ((issues[i].body || '').indexOf('| ' + m.id + ' |') >= 0) iss = issues[i];
        }
        for (var k = 0; k < issues.length && !iss; k++) {
          if (issues[k].title === titel) iss = issues[k];
        }
        if (!iss) return;
        var neu = null, grund = null;
        if (iss.state === 'closed') {
          if (iss.state_reason === 'not_planned') {
            neu = 'abgelehnt'; grund = 'Im Projekt geprüft und nicht eingeplant – Begründung steht in Issue #' + iss.number + '.';
          } else {
            neu = 'behoben'; grund = 'Im Projekt behoben (Issue #' + iss.number + ') – das Update kommt automatisch beim nächsten Start.';
          }
        } else if ((iss.labels || []).some(function (l) { return l && l.name === 'frage'; })) {
          neu = 'geprueft'; grund = 'Rückfrage im Projekt (Issue #' + iss.number + ') – ein Blick dorthin hilft weiter.';
        } else if (iss.comments > 0) {
          neu = 'geprueft'; grund = 'Im Projekt gesichtet (Issue #' + iss.number + ').';
        }
        if (neu && neu !== m.status) updates.push({ id: m.id, status: neu, bewertung: grund });
      });
      if (updates.length) {
        var ok = await window.api.bugSync(updates);
        if (ok && ok.ok && ok.n) zeigeListe();
      }
    } catch (e) { /* Abgleich ist Komfort - er darf nie etwas kaputt machen */ }
  }

  function bereit() {
    var b = document.getElementById('bugSendBtn');
    if (b) b.addEventListener('click', senden);
    var a = document.getElementById('bugAktualisierenBtn');
    if (a) a.addEventListener('click', function () { zeigeListe(); statusAbgleich(); });
    // Strg+Enter im Textfeld schickt ab – wer gerade tippt, will nicht zur Maus greifen
    var t = document.getElementById('bugText');
    if (t) t.addEventListener('keydown', function (e) { if (e.ctrlKey && e.key === 'Enter') senden(); });
    zeigeListe();
    // Kurz nach dem Start liegengebliebene Meldungen nachschicken - nicht sofort,
    // damit der Start selbst nicht auf das Netz wartet. Danach den Status mit dem
    // Projekt abgleichen (erst NACH dem Nachversand, damit frisch angelegte Issues
    // gleich mitzaehlen).
    setTimeout(nachversand, 15000);
    setTimeout(statusAbgleich, 25000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.Bugs = { merke: merke, liste: zeigeListe, fehlerListe: function () { return FEHLER.slice(); } };
})();
