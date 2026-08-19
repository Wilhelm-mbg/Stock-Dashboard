'use strict';
/* Lokale KI über Ollama (läuft komplett auf deinem PC, keine Cloud, keine Kosten).
   Genutzt als Trade-Prüfinstanz (Veto/Boost) und optional für Analysen. */
(function () {
  function base() {
    var s = window.getSettings();
    return (s.ollamaUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
  }
  function model() { return window.getSettings().ollamaModel || ''; }
  /** Manche lokale Modelle (z. B. Qwen) fallen ins Chinesische zurück – solche
   *  Begründungen sind für Wilhelm unlesbar und fliegen raus. */
  function nurDeutsch(txt, ersatz) {
    var t = String(txt || '');
    return /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t) ? (ersatz || 'Begründung nicht auf Deutsch – verworfen') : t;
  }
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

    /** Regime-Entscheidung: Welches Setup passt zur aktuellen Marktlage?
     *  Bekommt ausschließlich gemessene Fakten, keine Meinungen. Antwortet mit einem
     *  von vier Kandidaten. Die App prüft die Antwort danach gegen eine Whitelist. */
    decideSetup: async function (fakten) {
      var userRules = (window.getSettings().kiRules || '').trim();
      var prompt = 'Du bist ein nüchterner Markt-Analyst für ein SIMULIERTES Intraday-Depot. ' +
        'Wähle anhand der gemessenen Marktlage GENAU EIN Handels-Setup für die nächste Stunde. ' +
        'Antworte AUSSCHLIESSLICH auf DEUTSCH (niemals Chinesisch oder Englisch) und AUSSCHLIESSLICH mit gültigem JSON, exakt so: ' +
        '{"setup":"ausbruch" oder "umkehr","ausloeser":"kreuzung" oder "range" oder "ueberdehnung" oder "welle",' +
        '"zeitrahmen":"1m" oder "5m","trendfilter":true oder false,"kanal":true oder false,' +
        '"begruendung":"max. 20 Wörter auf Deutsch, nenne die entscheidende Kennzahl"}.\n\n' +
        'DIE VIER KANDIDATEN:\n' +
        '- ausbruch/kreuzung: Kurs durchbricht die Leitlinie und läuft weiter. Passt, wenn der Markt RICHTUNG hat ' +
        '(trendAnteilPct deutlich über 65 oder unter 35) und die Werte weit von ihrer Leitlinie weg sind.\n' +
        '- ausbruch/range: Ausbruch aus der Eröffnungsspanne. Nur sinnvoll früh am Tag ' +
        '(minutenSeitEroeffnung bis 150) und bei erhöhter Vola.\n' +
        '- umkehr/ueberdehnung: Kauf gegen die Übertreibung, Ziel ist die Rückkehr zur Leitlinie. ' +
        'Passt, wenn mittleresAbsZ hoch ist (über 1,5) UND der Markt KEINE klare Richtung hat.\n' +
        '- umkehr/welle: Kauf am Wellental. Passt nur, wenn mittlererWellenScore über 50 liegt – sonst gibt es kein Wellenmuster.\n\n' +
        'REGELN:\n' +
        '1. Trendmarkt (trendAnteilPct 70 oder mehr, oder 30 oder weniger) → niemals umkehr. Einer fahrenden Straßenbahn läuft man nicht hinterher.\n' +
        '2. mittlererWellenScore unter 45 → niemals umkehr/welle. Ohne Wellen kein Wellenreiten.\n' +
        '3. kanalAnteilPct unter 20 → kanal auf false. Ohne belastbare Kanäle bringt der Kanalfilter nichts.\n' +
        '4. trendfilter im Zweifel true: lieber weniger Trades als Trades gegen den Trend.\n' +
        '5. zeitrahmen 5m, wenn vola1mPct hoch ist (über 0,15) – 1-Minuten-Signale sind dann überwiegend Rauschen.\n' +
        '6. letzteWalkForward zeigt gemessene Ergebnisse aus der Vergangenheit. Weiche nur davon ab, wenn die ' +
        'aktuelle Marktlage klar dagegen spricht, und nenne den Grund.\n' +
        '7. Im Zweifel: ausbruch/kreuzung mit trendfilter true. Das ist die konservative Vorgabe.\n' +
        (userRules ? '\nZUSÄTZLICHE REGELN DES NUTZERS (haben Vorrang, außer sie erhöhen das Risiko):\n' + userRules.slice(0, 1200) + '\n' : '') +
        '\nGEMESSENE MARKTLAGE:\n' + JSON.stringify(fakten);
      var res = await window.api.ollamaFetch('POST', base() + '/api/chat', {
        model: model(), stream: false, format: 'json',
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.1, num_predict: 250 }
      });
      if (!res.ok) return { ok: false, msg: res.body };
      try {
        var j = JSON.parse(JSON.parse(res.body).message.content);
        return {
          ok: true,
          setup: String(j.setup || '').toLowerCase(),
          ausloeser: String(j.ausloeser || '').toLowerCase(),
          zeitrahmen: String(j.zeitrahmen || '').toLowerCase(),
          trendfilter: j.trendfilter === true || String(j.trendfilter) === 'true',
          kanal: j.kanal === true || String(j.kanal) === 'true',
          begruendung: nurDeutsch(String(j.begruendung || '')).slice(0, 160)
        };
      } catch (e3) { return { ok: false, msg: 'JSON unlesbar' }; }
    },

    /** Trade-Prüfung: {ok, entscheidung 'ja'|'nein', groesse, begruendung} */
    decide: async function (ctx) {
      var userRules = (window.getSettings().kiRules || '').trim();
      var prompt = 'Du bist ein strenger, nüchterner Trading-Risk-Manager für ein SIMULIERTES Optionsschein-Depot (Intraday, gehebelt). ' +
        'Deine einzige Aufgabe: den geplanten Trade freigeben oder ablehnen. ' +
        'Antworte AUSSCHLIESSLICH auf DEUTSCH (niemals Chinesisch oder Englisch) und AUSSCHLIESSLICH mit gültigem JSON, exakt so: ' +
        '{"entscheidung":"ja" oder "nein","groesse":0.5 oder 1.0 oder 1.5,"begruendung":"max. 15 Wörter auf Deutsch"}.\n\n' +
        'PRÜFREGELN – gehe sie der Reihe nach durch:\n' +
        '1. Richtung widerspricht trendEMA100 oder der Trendkanal-Steigung → nein.\n' +
        '2. kostenCheck: typischeBewegungPct unter dem 1,5-fachen von noetigPct → nein (Kosten fressen den Vorteil).\n' +
        '3. eventIn24h ist ein wichtiges Makro-Event (FOMC, CPI, NFP) → nein.\n' +
        '4. tagesPnlPct unter −3 UND tradesHeute mindestens 3 → nein (nie Verlusten hinterherhandeln). ' +
        'Bei weniger als 3 eigenen Trades heute ist der Tageswert nicht aussagekräftig – dann ignoriere Regel 4.\n' +
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
        return { ok: true, entscheidung: e, groesse: g, begruendung: nurDeutsch(String(j.begruendung || '')).slice(0, 140) };
      } catch (e2) { return { ok: false, msg: 'JSON unlesbar' }; }
    }
  };

  /** Einheitlicher LLM-Zugang: ausschließlich das LOKALE Modell (Ollama) – keine API-Kosten. */
  window.LLM = {
    provider: function () { return model() ? 'ollama' : null; },
    ask: async function (prompt, maxTokens) {
      return this.provider() ? await window.LocalKI.ask(prompt, maxTokens) : null;
    }
  };
})();
