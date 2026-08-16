'use strict';
/* App-Shell: Tabs, Modals, Einstellungen, gemeinsame Helfer */
(function () {
  var U = {
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
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
  var SETTINGS = { apiKey: '', model: 'claude-sonnet-4-5', tray: false, capKey: '', capId: '', capPass: '', capEnabled: false, ollamaUrl: '', ollamaModel: '', kiVeto: false, kiProvider: '', kiRules: '', updateRepo: '' };
  window.getSettings = function () { return SETTINGS; };
  window.api.storeGet('settings').then(function (s) {
    if (s) SETTINGS = Object.assign(SETTINGS, s);
    if (window.api.setTrayMode) window.api.setTrayMode(!!SETTINGS.tray);
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
    if (added) window.api.storeSet('settings', SETTINGS);
    return added;
  };

  document.getElementById('settingsBtn').addEventListener('click', function () {
    document.getElementById('setApiKey').value = SETTINGS.apiKey || '';
    document.getElementById('setModel').value = SETTINGS.model || 'claude-sonnet-4-5';
    document.getElementById('setTray').checked = !!SETTINGS.tray;
    document.getElementById('setCapKey').value = SETTINGS.capKey || '';
    document.getElementById('setCapId').value = SETTINGS.capId || '';
    document.getElementById('setCapPass').value = SETTINGS.capPass || '';
    document.getElementById('setCapEnabled').checked = !!SETTINGS.capEnabled;
    document.getElementById('setOllamaUrl').value = SETTINGS.ollamaUrl || '';
    document.getElementById('setKiVeto').checked = !!SETTINGS.kiVeto;
    document.getElementById('setKiProvider').value = SETTINGS.kiProvider || '';
    document.getElementById('setKiRules').value = SETTINGS.kiRules || '';
    document.getElementById('setUpdateRepo').value = SETTINGS.updateRepo || 'Wilhelm-mbg/Stock-Dashboard';
    if (window.api.getAutostart) window.api.getAutostart().then(function (r) { document.getElementById('setAutostart').checked = !!(r && r.on); });
    document.getElementById('setUpdateStatus').textContent = '';
    var ms = document.getElementById('setOllamaModel');
    if (SETTINGS.ollamaModel && !Array.prototype.some.call(ms.options, function (o) { return o.value === SETTINGS.ollamaModel; })) {
      var o0 = document.createElement('option'); o0.value = SETTINGS.ollamaModel; o0.textContent = SETTINGS.ollamaModel; ms.appendChild(o0);
    }
    ms.value = SETTINGS.ollamaModel || '';
    document.getElementById('setStatus').textContent = '';
    window.openModal('setModalBg');
  });

  // Ollama-Modelle laden
  document.getElementById('ollamaRefreshBtn').addEventListener('click', function () {
    var st = document.getElementById('ollamaStatus');
    SETTINGS.ollamaUrl = document.getElementById('setOllamaUrl').value.trim();
    st.textContent = 'Suche Ollama …';
    window.LocalKI.models().then(function (r) {
      if (!r.ok) { st.textContent = '❌ ' + r.msg + ' – läuft Ollama? (ollama.com installieren, App starten)'; return; }
      var ms2 = document.getElementById('setOllamaModel');
      ms2.innerHTML = '';
      r.models.forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = m; ms2.appendChild(o); });
      if (r.models.length) { ms2.value = SETTINGS.ollamaModel && r.models.indexOf(SETTINGS.ollamaModel) !== -1 ? SETTINGS.ollamaModel : r.models[0]; st.textContent = '✅ Ollama läuft · ' + r.models.length + ' Modell(e) gefunden.'; }
      else st.textContent = '⚠ Ollama läuft, aber kein Modell installiert – z. B.: ollama pull qwen2.5:7b';
    });
  });
  // Update-Check über GitHub-Releases
  function cmpVer(a, b) {
    var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
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
        st.innerHTML = '🔔 Version ' + U.esc(tag) + ' verfügbar (installiert: ' + U.esc(cur) + ').' + (asset ? ' <a href="#" id="updDl">Download im Browser öffnen</a>' : ' (kein .exe-Anhang im Release)');
        var dl = document.getElementById('updDl');
        if (dl) dl.addEventListener('click', function (e) { e.preventDefault(); window.api.openExternal(asset.browser_download_url); });
      } else st.textContent = '✅ Aktuell (installiert: ' + cur + ', neueste: ' + tag + ').';
    } catch (e) { st.textContent = 'Antwort unlesbar.'; }
  });

  document.getElementById('setSaveBtn').addEventListener('click', function () {
    SETTINGS.apiKey = document.getElementById('setApiKey').value.trim();
    SETTINGS.model = document.getElementById('setModel').value;
    SETTINGS.tray = document.getElementById('setTray').checked;
    if (window.api.setTrayMode) window.api.setTrayMode(SETTINGS.tray);
    SETTINGS.capKey = document.getElementById('setCapKey').value.trim();
    SETTINGS.capId = document.getElementById('setCapId').value.trim();
    SETTINGS.capPass = document.getElementById('setCapPass').value;
    SETTINGS.capEnabled = document.getElementById('setCapEnabled').checked;
    SETTINGS.ollamaUrl = document.getElementById('setOllamaUrl').value.trim();
    SETTINGS.ollamaModel = document.getElementById('setOllamaModel').value;
    SETTINGS.kiVeto = document.getElementById('setKiVeto').checked;
    SETTINGS.kiProvider = document.getElementById('setKiProvider').value;
    SETTINGS.kiRules = document.getElementById('setKiRules').value.trim().slice(0, 1200);
    SETTINGS.updateRepo = document.getElementById('setUpdateRepo').value.trim();
    var au = document.getElementById('setAutostart').checked;
    if (window.api.setAutostart) window.api.setAutostart(au);
    if (au && window.api.setTrayMode) { SETTINGS.tray = true; document.getElementById('setTray').checked = true; window.api.setTrayMode(true); }
    window.api.storeSet('settings', SETTINGS).then(function () {
      document.getElementById('setStatus').textContent = 'Gespeichert.';
      document.dispatchEvent(new CustomEvent('settings-saved'));
    });
  });
})();
