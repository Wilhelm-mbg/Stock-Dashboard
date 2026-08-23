'use strict';
/* App-Shell: Tabs, Modals, Einstellungen, gemeinsame Helfer */
(function () {
  var U = {
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
    // Nur echte Web-Links ins DOM lassen: Feed-URLs kommen von außen. javascript:-Links
    // blockiert zwar schon die CSP, aber ein Link, der nichts tut, ist besser als einer,
    // der sich allein auf die CSP verlässt.
    safeUrl: function (u) {
      try { var x = new URL(String(u)); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '#'; }
      catch (e) { return '#'; }
    },
    nf2: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    nf0: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }),
    money: function (v) { return U.nf2.format(v) + ' $'; },
    dt: function (ms) { return new Date(ms).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' Uhr'; },
    d: function (ms) { return new Date(ms).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }); },
    signCls: function (v) { return v > 0 ? 'pos' : (v < 0 ? 'neg' : ''); },
    signTxt: function (v, unit) { return (v > 0 ? '+' : '') + U.nf2.format(v) + (unit || ''); },
    // Mini-Markdown (Überschriften, Listen, fett) für die KI-Analyse
    md: function (txt) {
      var lines = String(txt).split(/\r?\n/), out = [], inList = false;
      function fmtInline(s) {
        return U.esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
      }
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (/^\s*[-*•]\s+/.test(l)) {
          if (!inList) { out.push('<ul>'); inList = true; }
          out.push('<li>' + fmtInline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>');
          continue;
        }
        if (inList) { out.push('</ul>'); inList = false; }
        if (/^\s*#{1,4}\s+/.test(l)) out.push('<h4>' + fmtInline(l.replace(/^\s*#{1,4}\s+/, '')) + '</h4>');
        else if (l.trim() === '') out.push('');
        else out.push('<p>' + fmtInline(l) + '</p>');
      }
      if (inList) out.push('</ul>');
      return out.join('\n');
    }
  };
  window.U = U;

  // ---- Tabs ----
  var tabs = document.querySelectorAll('nav.tabs button');
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); });
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      b.classList.add('active');
      document.getElementById('tab-' + b.getAttribute('data-tab')).classList.add('active');
      document.dispatchEvent(new CustomEvent('tab-changed', { detail: b.getAttribute('data-tab') }));
    });
  });

  // ---- Modals ----
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { document.getElementById(b.getAttribute('data-close')).classList.remove('open'); });
  });
  document.querySelectorAll('.modal-bg').forEach(function (bg) {
    bg.addEventListener('click', function (e) { if (e.target === bg) bg.classList.remove('open'); });
  });
  window.openModal = function (id) { document.getElementById(id).classList.add('open'); };

  // ---- Einstellungen ----
  var SETTINGS = { tray: false, capKey: '', capId: '', capPass: '', capEnabled: false, ollamaUrl: '', ollamaModel: '', kiVeto: false, kiProvider: '', kiRules: '', updateRepo: '' };
  window.getSettings = function () { return SETTINGS; };
  var settingsGeladen = false; // Schreiben vor dem Laden würde die gespeicherten Werte überschreiben
  var geheimBehalten = {};     // Felder, deren gespeicherter Wert nicht entschlüsselbar war:
                               // im Dialog leer anzeigen, beim Speichern aber UNANGETASTET lassen
  window.api.storeGet('settings').then(function (s) {
    if (s) {
      ['capKey', 'capId', 'capPass'].forEach(function (k) {
        if (s[k] && typeof s[k] !== 'string') { geheimBehalten[k] = true; s[k] = ''; }
      });
      SETTINGS = Object.assign(SETTINGS, s);
    }
    settingsGeladen = true;
    // Kostenpflichtige API abgeschafft: einen evtl. noch gespeicherten Key einmalig
    // von der Platte löschen – KI läuft ausschließlich lokal über Ollama.
    if (SETTINGS.apiKey || SETTINGS.model) {
      delete SETTINGS.apiKey; delete SETTINGS.model;
      window.api.storeSet('settings', SETTINGS);
    }
    if (window.api.setTrayMode) window.api.setTrayMode(!!SETTINGS.tray);
  }).catch(function (e) {
    // Ein Ladefehler darf das Speichern nicht fuer immer blockieren - dann lieber mit
    // Standardwerten arbeiten und den Fehler sichtbar machen.
    settingsGeladen = true;
    var st0 = document.getElementById('setStatus');
    if (st0) st0.textContent = 'Einstellungen konnten nicht geladen werden (' + (e && e.message ? e.message : e) + ') - es gelten Standardwerte.';
  });

  // Lernschleife: neue Regeln an die KI-Prüfregeln anhängen (Duplikate überspringen)
  window.appendKiRules = function (lines) {
    var existing = (SETTINGS.kiRules || '').split(/\r?\n/).map(function (l) { return l.replace(/^[-•]\s*/, '').trim(); }).filter(Boolean);
    var added = 0;
    (lines || []).forEach(function (l) {
      var clean = String(l).trim();
      if (!clean || existing.indexOf(clean) !== -1) return;
      SETTINGS.kiRules = ((SETTINGS.kiRules || '').trim() + '\n- ' + clean).trim().slice(0, 1200);
      existing.push(clean);
      added++;
    });
    if (added && settingsGeladen) window.api.storeSet('settings', SETTINGS);
    // vor dem Laden nur im Speicher anhängen – der nächste reguläre Save persistiert es
    return added;
  };

  document.getElementById('settingsBtn').addEventListener('click', function () {
    document.getElementById('setTray').checked = !!SETTINGS.tray;
    ['setCapKey', 'setCapId', 'setCapPass'].forEach(function (id, i3) {
      var feld = ['capKey', 'capId', 'capPass'][i3];
      var el3 = document.getElementById(id);
      el3.value = SETTINGS[feld] || '';
      el3.placeholder = geheimBehalten[feld] ? 'gespeichert - leer lassen = unverändert' : '';
    });
    document.getElementById('setCapEnabled').checked = !!SETTINGS.capEnabled;
    document.getElementById('setUpdateRepo').value = SETTINGS.updateRepo || 'Wilhelm-mbg/Stock-Dashboard';
    if (window.api.getAutostart) window.api.getAutostart().then(function (r) { document.getElementById('setAutostart').checked = !!(r && r.on); });
    document.getElementById('setUpdateStatus').textContent = '';
    var auEl = document.getElementById('setAutoUpdate');
    if (auEl) {
      auEl.checked = SETTINGS.autoUpdate !== false;
      if (window.api.updateState) window.api.updateState().then(updRender);
    }
    document.getElementById('setStatus').textContent = '';
    window.openModal('setModalBg');
  });

  /* Capital.com-Verbindung testen (Issue #41). Prueft der Reihe nach, damit man
   * SIEHT, woran es haengt - "geht nicht" ist keine brauchbare Fehlermeldung.
   * Nimmt die Werte aus den Feldern, ohne sie zu speichern: erst testen, dann
   * bewusst sichern. Die Zugangsdaten verlassen dabei nur den Weg zum Demo-Host. */
  var capTestBtn = document.getElementById('capTestBtn');
  if (capTestBtn) capTestBtn.addEventListener('click', async function () {
    var st = document.getElementById('capTestStatus');
    var det = document.getElementById('capTestDetail');
    var key = (document.getElementById('setCapKey').value || '').trim();
    var id = (document.getElementById('setCapId').value || '').trim();
    var pass = (document.getElementById('setCapPass').value || '').trim();
    // Leere Felder koennen "gespeichert, unveraendert" bedeuten - dann die abgelegten nehmen
    if (!key && SETTINGS.capKey) key = SETTINGS.capKey;
    if (!id && SETTINGS.capId) id = SETTINGS.capId;
    if (!pass && SETTINGS.capPass) pass = SETTINGS.capPass;
    det.style.display = 'none'; det.textContent = '';
    var fehlt = [];
    if (!key) fehlt.push('API-Schlüssel');
    if (!id) fehlt.push('Konto-Kennung');
    if (!pass) fehlt.push('API-Passwort');
    if (fehlt.length) { st.textContent = 'Es fehlt noch: ' + fehlt.join(', ') + '.'; return; }
    capTestBtn.disabled = true;
    st.textContent = 'Melde mich beim Demo-Server an …';
    try {
      var BASE = 'https://demo-api-capital.backend-capital.com/api/v1';
      var res = await window.api.capFetch('POST', BASE + '/session', { 'X-CAP-API-KEY': key }, { identifier: id, password: pass });
      if (!(res.ok && res.headers && res.headers.cst)) {
        var code = '';
        try { code = JSON.parse(res.body).errorCode || ''; } catch (e) { }
        st.textContent = 'Anmeldung fehlgeschlagen (HTTP ' + res.status + (code ? ', ' + code : '') + ').';
        det.style.display = '';
        det.textContent = code.indexOf('api-key') !== -1 || res.status === 403
          ? 'Der API-Schlüssel wird abgelehnt. Prüfe, ob er für das DEMO-Konto erstellt wurde – Live- und Demo-Schlüssel sind verschieden.'
          : code.indexOf('credentials') !== -1 || res.status === 401
            ? 'Kennung oder API-Passwort passen nicht. Das API-Passwort ist das, das du beim Erstellen des Schlüssels vergeben hast – nicht dein Konto-Passwort.'
            : 'Antwort des Servers: ' + String(res.body || '').slice(0, 200);
        return;
      }
      st.textContent = 'Angemeldet · frage Konto ab …';
      var acc = await window.api.capFetch('GET', BASE + '/accounts',
        { 'X-CAP-API-KEY': key, 'CST': res.headers.cst, 'X-SECURITY-TOKEN': res.headers['x-security-token'] }, null);
      if (!acc.ok) { st.textContent = 'Angemeldet, aber Kontoabfrage fehlgeschlagen (HTTP ' + acc.status + ').'; return; }
      var a0 = JSON.parse(acc.body).accounts[0];
      st.textContent = '✓ Verbunden · ' + a0.accountName + ' · Guthaben ' + a0.balance.balance + ' ' + a0.currency;
      det.style.display = '';
      det.textContent = 'Der Test hat nichts gespeichert. Zum dauerhaften Verbinden unten „Speichern" klicken und das Häkchen ' +
        '„Intraday-Signale zusätzlich auf dem Demo-Konto ausführen" setzen – dann misst die App an jedem gespiegelten Trade die echten Handelskosten.';
    } catch (e) {
      st.textContent = 'Test fehlgeschlagen: ' + ((e && e.message) || e);
    } finally {
      capTestBtn.disabled = false;
    }
  });

  // Ollama-Modelle laden
  /* ================= Automatische Updates ================= */
  function updRender(st) {
    var el = document.getElementById('setUpdAutoStatus');
    var ib = document.getElementById('setUpdInstallBtn');
    if (!el || !st) return;
    if (st.packaged === false) {
      el.textContent = 'Läuft aus dem Quellcode – automatische Updates gibt es nur in der installierten Version.';
      if (ib) ib.style.display = 'none';
      return;
    }
    var txt = {
      idle: 'Noch nicht geprüft.',
      checking: 'Suche nach Updates …',
      current: '' + (st.msg || 'Aktuell'),
      available: '' + (st.msg || 'Update gefunden'),
      downloading: '' + (st.msg || 'Lade …'),
      ready: '' + (st.msg || 'Update bereit'),
      error: '' + (st.msg || 'Fehler')
    }[st.state] || (st.msg || '');
    el.textContent = txt;
    if (ib) ib.style.display = st.state === 'ready' ? '' : 'none';
  }
  if (window.api.onUpdate) window.api.onUpdate(updRender);
  (function () {
    var nowBtn = document.getElementById('setUpdNowBtn');
    var insBtn = document.getElementById('setUpdInstallBtn');
    var chk = document.getElementById('setAutoUpdate');
    if (!nowBtn) return;
    nowBtn.addEventListener('click', async function () {
      document.getElementById('setUpdAutoStatus').textContent = 'Suche nach Updates …';
      var r = await window.api.updateCheck();
      if (r && !r.ok) document.getElementById('setUpdAutoStatus').textContent = '' + (r.msg || 'Update-Prüfung fehlgeschlagen');
    });
    insBtn.addEventListener('click', async function () {
      var r = await window.api.updateInstall();
      if (r && !r.ok) document.getElementById('setUpdAutoStatus').textContent = '' + (r.msg || 'Installation nicht möglich');
    });
    chk.addEventListener('change', function () {
      SETTINGS.autoUpdate = chk.checked;
      window.api.storeSet('settings', SETTINGS);
      if (window.api.updateSetAuto) window.api.updateSetAuto(chk.checked);
    });
  })();

  // Update-Check über GitHub-Releases
  function cmpVer(a, b) {
    // parseInt statt Number: "7.19.0-beta" ergab als Zahl NaN, die Differenz war NaN und
    // damit falsy – eine neuere Vorabversion galt dadurch als "gleich" und wurde nie gemeldet.
    function teile(v) {
      return String(v).split('.').map(function (t) { var n = parseInt(t, 10); return isNaN(n) ? 0 : n; });
    }
    var x = teile(a), y = teile(b);
    for (var i = 0; i < 3; i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
    return 0;
  }
  document.getElementById('setUpdateBtn').addEventListener('click', async function () {
    var st = document.getElementById('setUpdateStatus');
    var repo = document.getElementById('setUpdateRepo').value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/+$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { st.textContent = 'Bitte im Format nutzer/repo angeben (z. B. wilhelm/markt-dashboard).'; return; }
    SETTINGS.updateRepo = repo;
    window.api.storeSet('settings', SETTINGS);
    st.textContent = 'Prüfe …';
    var cur = await window.api.appVersion();
    var res = await window.api.fetchText('https://api.github.com/repos/' + repo + '/releases/latest');
    if (!res.ok) { st.textContent = 'Nicht erreichbar (HTTP ' + res.status + ') – existiert das Repo und hat es ein veröffentlichtes Release?'; return; }
    try {
      var j = JSON.parse(res.body);
      var tag = String(j.tag_name || '').replace(/^v/i, '');
      if (!tag) { st.textContent = 'Kein Release gefunden.'; return; }
      if (cmpVer(tag, cur) > 0) {
        var asset = (j.assets || []).filter(function (a) { return /\.exe$/i.test(a.name || ''); })[0];
        st.innerHTML = 'Version ' + U.esc(tag) + ' verfügbar (installiert: ' + U.esc(cur) + ').' + (asset ? ' <a href="#" id="updDl">Download im Browser öffnen</a>' : ' (kein .exe-Anhang im Release)');
        var dl = document.getElementById('updDl');
        if (dl) dl.addEventListener('click', function (e) { e.preventDefault(); window.api.openExternal(asset.browser_download_url); });
      } else st.textContent = 'Aktuell (installiert: ' + cur + ', neueste: ' + tag + ').';
    } catch (e) { st.textContent = 'Antwort unlesbar.'; }
  });

  document.getElementById('setSaveBtn').addEventListener('click', function () {
    try {
    // Speichern, bevor der Store geladen ist, würde die gespeicherten Werte mit leeren
    // Formularfeldern überschreiben. Der Wächter existierte schon, galt aber nur für die
    // KI-Regeln – hier fehlte er.
    if (!settingsGeladen) {
      document.getElementById('setStatus').textContent = 'Einstellungen werden noch geladen – bitte einen Moment und erneut speichern.';
      return;
    }
    SETTINGS.tray = document.getElementById('setTray').checked;
    if (window.api.setTrayMode) window.api.setTrayMode(SETTINGS.tray);
    ['capKey', 'capId', 'capPass'].forEach(function (feld, i4) {
      var wert4 = document.getElementById(['setCapKey', 'setCapId', 'setCapPass'][i4]).value;
      if (feld !== 'capPass') wert4 = wert4.trim();
      // Leeres Feld bei nicht entschlüsselbarem Bestand heißt "behalten", nicht "löschen"
      SETTINGS[feld] = (wert4 === '' && geheimBehalten[feld]) ? { __keep: true } : wert4;
      if (wert4 !== '') geheimBehalten[feld] = false;
    });
    SETTINGS.capEnabled = document.getElementById('setCapEnabled').checked;
    // Gleiche Formatprüfung wie beim Prüf-Knopf – vorher landete hier auch Unsinn im Store.
    var repoNeu = document.getElementById('setUpdateRepo').value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/+$/, '');
    if (repoNeu && !/^[\w.-]+\/[\w.-]+$/.test(repoNeu)) {
      document.getElementById('setStatus').textContent = 'Update-Repo bitte als nutzer/repo angeben – nicht gespeichert.';
      return;
    }
    SETTINGS.updateRepo = repoNeu;
    SETTINGS.autoUpdate = document.getElementById('setAutoUpdate').checked;
    if (window.api.updateSetAuto) window.api.updateSetAuto(SETTINGS.autoUpdate);
    var au = document.getElementById('setAutostart').checked;
    /* Autostart ist die einzige Einstellung, die NICHT im Store liegt, sondern in der
       Windows-Registry. Sie kann fehlschlagen, ohne dass eine Ausnahme fliegt – etwa
       wenn eine Gruppenrichtlinie sie verbietet. Vorher lief das ins Leere: gemeldet
       wurde "Gespeichert.", der Haken sprang beim nächsten Öffnen wieder heraus, und
       niemand erfuhr warum. Jetzt wird das Ergebnis geprüft und der Haken auf den
       tatsächlichen Zustand zurückgesetzt. */
    if (window.api.setAutostart) {
      window.api.setAutostart(au).then(function (r) {
        if (r && r.ok) return;
        var box = document.getElementById('setAutostart');
        if (box) box.checked = !!(r && r.on);
        var st = document.getElementById('setStatus');
        if (st) st.textContent = 'Autostart nicht gesetzt: ' + ((r && r.msg) || 'unbekannter Fehler') +
          ' Alle übrigen Einstellungen wurden gespeichert.';
      });
    }
    if (au && window.api.setTrayMode) { SETTINGS.tray = true; document.getElementById('setTray').checked = true; window.api.setTrayMode(true); }
    /* Das Sentinel {__keep:true} muss MIT gespeichert werden, darf aber nicht im
     * Arbeitsspeicher stehenbleiben: Ein Objekt ist wahrheitswertig, und capital.js
     * schliesst aus einem gesetzten capKey/capId/capPass auf eine eingerichtete
     * Verbindung. Nach dem Schreiben steht hier deshalb derselbe Zustand wie nach
     * einem Neustart - Feld leer, Merkung in geheimBehalten (vgl. Ladepfad oben). */
    var schreiben = window.api.storeSet('settings', SETTINGS);
    ['capKey', 'capId', 'capPass'].forEach(function (k9) {
      if (SETTINGS[k9] && typeof SETTINGS[k9] !== 'string') { geheimBehalten[k9] = true; SETTINGS[k9] = ''; }
    });
    schreiben.then(function (res) {
      // Nie wieder "Gespeichert." anzeigen, wenn nichts geschrieben wurde: das Ergebnis
      // des Schreibvorgangs entscheidet ueber die Meldung.
      var ok = res === true || (res && res.ok);
      document.getElementById('setStatus').textContent = ok
        ? 'Gespeichert.'
        : 'FEHLER beim Speichern: ' + ((res && res.msg) || 'unbekannt') + ' - Einstellungen wurden NICHT gesichert.';
      if (ok) document.dispatchEvent(new CustomEvent('settings-saved'));
    }, function (e) {
      document.getElementById('setStatus').textContent = 'FEHLER beim Speichern: ' + (e && e.message ? e.message : e);
    });
    } catch (eSave) {
      // Eine Ausnahme im Handler starb frueher STILL - der Nutzer sah einfach nichts.
      document.getElementById('setStatus').textContent = 'FEHLER beim Speichern: ' + (eSave && eSave.message ? eSave.message : eSave);
    }
  });
})();
