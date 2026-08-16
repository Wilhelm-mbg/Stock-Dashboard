'use strict';
/* Lokale KI über Ollama (läuft komplett auf deinem PC, keine Cloud, keine Kosten).
   Genutzt als Trade-Prüfinstanz (Veto/Boost) und optional für Analysen. */
(function () {
  function base() {
    var s = window.getSettings();
    return (s.ollamaUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
  }
  function model() { return window.getSettings().ollamaModel || ''; }
  function vetoOn() { var s = window.getSettings(); return !!(s.kiVeto && model()); }

  window.LocalKI = {
    vetoEnabled: vetoOn,
    model: model,

    /** Verfügbare Modelle abfragen (prüft zugleich, ob Ollama läuft) */
    models: async function () {
      var res = await window.api.ollamaFetch('GET', base() + '/api/tags', null);
      if (!res.ok) return { ok: false, msg: 'Ollama nicht erreichbar (' + res.body + ')', models: [] };
      try {
        var list = (JSON.parse(res.body).models || []).map(function (m) { return m.name; });
        return { ok: true, models: list };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar', models: [] }; }
    },

    /** Freitext-Anfrage (für Analyse/Retro über lokales Modell) */
    ask: async function (prompt, maxTokens) {
      var res = await window.api.ollamaFetch('POST', base() + '/api/chat', {
        model: model(), stream: false,
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.3, num_predict: maxTokens || 1200 }
      });
      if (!res.ok) return null;
      try { return JSON.parse(res.body).message.content; } catch (e) { return null; }
    },

    /** Trade-Prüfung: {ok, entscheidung 'ja'|'nein', groesse, begruendung} */
    decide: async function (ctx) {
      var userRules = (window.getSettings().kiRules || '').trim();
      var prompt = 'Du bist ein strenger, nüchterner Trading-Risk-Manager für ein SIMULIERTES Optionsschein-Depot (Intraday, gehebelt). ' +
        'Deine einzige Aufgabe: den geplanten Trade freigeben oder ablehnen. ' +
        'Antworte AUSSCHLIESSLICH mit gültigem JSON, exakt so: ' +
        '{"entscheidung":"ja" oder "nein","groesse":0.5 oder 1.0 oder 1.5,"begruendung":"max. 15 Wörter auf Deutsch"}.\n\n' +
        'PRÜFREGELN – gehe sie der Reihe nach durch:\n' +
        '1. Richtung widerspricht trendEMA100 oder der Trendkanal-Steigung → nein.\n' +
        '2. kostenCheck: typischeBewegungPct unter dem 1,5-fachen von noetigPct → nein (Kosten fressen den Vorteil).\n' +
        '3. eventIn24h ist ein wichtiges Makro-Event (FOMC, CPI, NFP) → nein.\n' +
        '4. tagesPnlPct unter −3 → nein (nie Verlusten hinterherhandeln).\n' +
        '5. zScore extrem (Betrag über 3,5) → eher Absturz/Nachricht als Welle → nein.\n' +
        '6. letzteBewegungenPct zeigen einen einseitigen Sturz ohne Stabilisierung → nein.\n' +
        '7. wellenScore unter 65 oder trendkanal.positionImKanal nicht nahe am Rand → groesse höchstens 1.0.\n' +
        '8. Nur wenn ALLES sauber ist (wellenScore ≥ 75, Kanalposition am Rand, Kosten locker gedeckt, Trend klar) → ja mit groesse 1.5.\n' +
        'Merksatz: Wer nicht weiß, was er tut, muss wissen, wann er nichts tut. Im Zweifel IMMER: nein.\n' +
        (userRules ? '\nZUSÄTZLICHE REGELN DES NUTZERS (haben Vorrang, außer sie erhöhen das Risiko):\n' + userRules.slice(0, 1200) + '\n' : '') +
        '\nTRADE-KONTEXT:\n' + JSON.stringify(ctx);
      var res = await window.api.ollamaFetch('POST', base() + '/api/chat', {
        model: model(), stream: false, format: 'json',
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.1, num_predict: 200 }
      });
      if (!res.ok) return { ok: false, msg: res.body };
      try {
        var j = JSON.parse(JSON.parse(res.body).message.content);
        var e = String(j.entscheidung || '').toLowerCase() === 'ja' ? 'ja' : 'nein';
        var g = parseFloat(j.groesse);
        if (!(g === 0.5 || g === 1.0 || g === 1.5)) g = 1.0;
        return { ok: true, entscheidung: e, groesse: g, begruendung: String(j.begruendung || '').slice(0, 140) };
      } catch (e2) { return { ok: false, msg: 'JSON unlesbar' }; }
    }
  };

  /** Einheitlicher LLM-Zugang: bevorzugt je nach Einstellung Anthropic-API oder lokales Modell */
  window.LLM = {
    provider: function () {
      var s = window.getSettings();
      if (s.kiProvider === 'ollama' && model()) return 'ollama';
      if (s.apiKey) return 'anthropic';
      if (model()) return 'ollama';
      return null;
    },
    ask: async function (prompt, maxTokens) {
      var p = this.provider();
      if (p === 'ollama') return await window.LocalKI.ask(prompt, maxTokens);
      if (p === 'anthropic') {
        var s = window.getSettings();
        var res = await window.api.postJson('https://api.anthropic.com/v1/messages', {
          'x-api-key': s.apiKey, 'anthropic-version': '2023-06-01'
        }, { model: s.model || 'claude-sonnet-4-5', max_tokens: maxTokens || 1800, messages: [{ role: 'user', content: prompt }] });
        if (!res.ok) return null;
        try { return JSON.parse(res.body).content.map(function (b) { return b.text || ''; }).join('\n'); } catch (e) { return null; }
      }
      return null;
    }
  };
})();
