'use strict';
/* Playwright-Smoke-Test: App laden mit gemocktem window.api, JS-Fehler sammeln,
   neue Kanal-Elemente prüfen, Wellenreiter-Modus + Kanal-Schalter durchklicken. */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // window.api mocken (Preload-Bridge existiert im Browser nicht)
  await page.addInitScript(() => {
    const today = new Date().toISOString().slice(0, 10);
    const nowS = Date.now();
    const seedTrades = [];
    for (let i = 0; i < 12; i++) {
      const alt = i < 6;
      seedTrades.push({ id: 100 + i, sym: 'AAA', dir: 'call', status: 'closed', strategy: 'intraday',
        openT: nowS - (alt ? 5 : 1) * 86400000, closeT: nowS - (alt ? 5 : 1) * 86400000 + 600000,
        entry: 1, exit: 1, qty: 10, cost: 10, orderFee: 1, strike: 100, expiry: nowS + 20 * 86400000,
        pnl: alt ? -3 : 6, why: 'Test-Exit', reason: 'Test', scenario: 'Test', sources: { intraday: 1 } });
    }
    seedTrades.push({ id: 900, sym: 'ZZZ', dir: 'call', status: 'open', strategy: 'intraday',
      openT: nowS - 4 * 86400000, entry: 0.5, qty: 100, cost: 50, orderFee: 1, strike: 100,
      expiry: nowS + 10 * 86400000, iv: 0.4, reason: 'Verwaister Test-Trade', scenario: 'Test' });
    seedTrades.push({ id: 901, sym: 'YYY', dir: 'put', status: 'open', strategy: 'hourly',
      openT: nowS - 5 * 86400000, entry: 0, qty: 0, cost: 25, strike: 0, expiry: 0, reason: 'Kaputt', scenario: 'Test' });
    const store = { depot: {
      messStart: 0,   // Messschnitt liegt in der Vergangenheit -> Seed-Trades zählen mit
      patience: { [today]: { 'KI-Veto': 3, 'Event-Blackout': 2, 'Kosten-Check: Bewegung deckt Kosten nicht': 5 } },
      trades: seedTrades,
      positions: [],
      tuneLog: [{ id: 'x1', at: nowS - 3 * 86400000, applied: ['period → 50'], txt: 'Testanpassung',
        konfigVorher: { period: 20 }, konfigNachher: { period: 50 } }]
    } };
    // Deterministische Yahoo-Chart-Mock-Antwort
    function chartBody(interval) {
      const now = Math.floor(Date.now() / 1000);
      const step = interval === '1d' ? 86400 : 300;
      const n = interval === '1d' ? 320 : 400;
      const ts = [], closes = [], vols = [];
      for (let i = 0; i < n; i++) {
        ts.push(now - (n - i) * step);
        closes.push(100 + 8 * Math.sin(i / 25) + i * 0.02);
        vols.push(1500000);
      }
      return JSON.stringify({ chart: { result: [{ meta: { regularMarketPrice: closes[n - 1], previousClose: closes[n - 2], currency: 'USD' }, timestamp: ts, indicators: { quote: [{ close: closes, volume: vols }] } }] } });
    }
    window.api = {
      fetchText: async (url) => {
        if (url.indexOf('/v8/finance/chart/') !== -1) {
          const m = url.match(/interval=([a-z0-9]+)/);
          return { ok: true, status: 200, body: chartBody(m ? m[1] : '1d') };
        }
        if (url.indexOf('news.google.com') !== -1 || url.indexOf('feeds.finance') !== -1) {
          return { ok: true, status: 200, body: '<rss><channel><item><title>Testmeldung: Aktie übertrifft Erwartungen</title><link>https://example.com</link><pubDate>' + new Date().toUTCString() + '</pubDate></item></channel></rss>' };
        }
        if (url.indexOf('/v1/finance/search') !== -1) return { ok: true, status: 200, body: JSON.stringify({ quotes: [] }) };
        if (url.indexOf('api.github.com') !== -1) return { ok: true, status: 200, body: JSON.stringify({ tag_name: 'v9.9.9', assets: [{ name: 'Markt-Dashboard-Setup.exe', browser_download_url: 'https://github.com/x/y/releases/download/v9.9.9/Markt-Dashboard-Setup.exe' }] }) };
        return { ok: false, status: 403, body: '' };
      },
      postJson: async () => ({ ok: false, status: 401, body: '{}' }),
      capFetch: async () => ({ ok: false, status: 0, body: '{}', headers: {} }),
      ollamaFetch: async () => ({ ok: false, status: 0, body: '{}' }),
      storeGet: async (k) => store[k] || null,
      storeSet: async (k, v) => { store[k] = v; return true; },
      setTrayMode: () => {},
      appVersion: async () => '6.2.0',
      openExternal: async () => true,
      exportAnalysis: async (payload) => { window.__lastExport = payload; return { ok: true, dir: 'C:\\Users\\Test\\Downloads\\Markt-Dashboard-Daten' }; },
      readRecommendation: async () => ({ ok: false }),
      setAutostart: async () => ({ ok: true, on: true }),
      getAutostart: async () => ({ ok: true, on: false }),
      readReport: async () => ({ ok: true, mtime: Date.now(), body: '# Analyse-Bericht\n\nTestinhalt aus dem Daten-Ordner.\n\n## HISTORIE\n\n- 2026-08-16 | Nacht-Audit | keine Änderung' }),
      updateState: async () => ({ packaged: true, current: '6.2.0', state: 'idle', version: null, pct: 0, msg: '' }),
      updateCheck: async () => { window.__updCb && window.__updCb({ packaged: true, state: 'ready', version: '9.9.9', pct: 100, msg: 'Version 9.9.9 ist heruntergeladen – wird beim nächsten Beenden eingespielt.' }); return { ok: true }; },
      updateInstall: async () => { window.__updInstalled = true; return { ok: true }; },
      updateSetAuto: async (on) => { window.__updAuto = on; return { ok: true, on: on }; },
      onUpdate: (cb) => { window.__updCb = cb; }
    };
  });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(2500);

  // Optionsscheine-Tab öffnen und zur Strategie-Ansicht wechseln
  await page.click('nav.tabs button[data-tab="depot"]');
  await page.waitForTimeout(500);
  await page.click('#depotPills button[data-sub="strategien"]');
  await page.waitForTimeout(500);

  const results = [];
  function check(name, cond) { results.push((cond ? '✅ ' : '❌ ') + name); if (!cond) process.exitCode = 1; }

  // Kanal-Schalter vorhanden & standardmäßig an
  const chVisible = await page.locator('#idChannel').count();
  check('Kanal-Schalter #idChannel existiert', chVisible === 1);
  check('Kanal standardmäßig AN', await page.locator('#idChannel').isChecked());

  // Setup „Umkehr" mit Auslöser „Wellental" über die neuen Bedienelemente wählen
  check('Setup-Pillen vorhanden', await page.locator('#idSetupPills button').count() === 2);
  await page.click('#idSetupPills button[data-setup="umkehr"]');
  await page.waitForTimeout(400);
  check('Umkehr-Setup aktiv', await page.locator('#idSetupPills button[data-setup="umkehr"]').evaluate(el => el.classList.contains('active')));
  const trigOpts = await page.locator('#idTrigger option').count();
  check('Umkehr hat zwei Auslöser', trigOpts === 2);
  await page.selectOption('#idTrigger', 'welle');
  await page.waitForTimeout(400);
  check('Auslöser Wellental → interner Modus wave', (await page.locator('#idMode').inputValue()) === 'wave');
  const depSetup = await page.evaluate(async () => (await window.api.storeGet('depot')).intraday);
  check('Setup wird gespeichert', depSetup.setup === 'umkehr' && depSetup.trigger === 'welle' && depSetup.mode === 'wave');
  check('Ausstieg-Feld nur beim Ausbruch sichtbar', !(await page.locator('#lblExit').isVisible()));

  // Kanal-Schalter togglen (Knob klicken, Checkbox ist opacity 0)
  await page.locator('#idChannel').locator('xpath=following-sibling::span[1]').click();
  await page.waitForTimeout(300);
  const offNow = !(await page.locator('#idChannel').isChecked());
  check('Kanal-Schalter lässt sich ausschalten', offNow);
  const saved1 = await page.evaluate(async () => (await window.api.storeGet('depot')).intraday.channel);
  check('Einstellung wird gespeichert (channel=false)', saved1 === false);
  await page.locator('#idChannel').locator('xpath=following-sibling::span[1]').click();
  await page.waitForTimeout(300);
  const saved2 = await page.evaluate(async () => (await window.api.storeGet('depot')).intraday.channel);
  check('Wieder einschalten (channel=true)', saved2 === true);

  // Labor-Beschreibung erwähnt die neue Variante (Auswertung-Ansicht)
  await page.click('#depotPills button[data-sub="auswertung"]');
  await page.waitForTimeout(400);
  const labTxt = (await page.locator('#tab-depot').innerText()).replace(/ /g, ' ');
  check('Labor nennt die beiden Setups', labTxt.indexOf('Ausbruch') !== -1 && labTxt.indexOf('Umkehr') !== -1);

  // Quant im Seitenkontext: Kanalfunktion da & konsistent
  const q = await page.evaluate(() => {
    const closes = [];
    for (let i = 0; i < 200; i++) closes.push(100 + 0.5 * i + (i % 2 ? -1 : 1));
    const ch = window.Quant.regressionChannel(closes, 120);
    return ch ? { pos: ch.pos, steep: ch.steep } : null;
  });
  check('Quant.regressionChannel im Renderer verfügbar', !!q);

  // Geduld-Bilanz rendert die gesäten Daten (wir sind bereits in der Auswertung-Ansicht)
  await page.waitForTimeout(600);
  const patTxt = await page.locator('#patience').innerText();
  check('Geduld-Bilanz zeigt Gründe', patTxt.indexOf('KI-Veto') !== -1 && patTxt.indexOf('5×') !== -1);
  check('Geduld-Bilanz zeigt Gesamtzahl', patTxt.indexOf('10') !== -1);

  // Wochenreport: Kostolany-Zitat + Geduld-Abschnitt
  await page.click('#weeklyBtn');
  await page.waitForTimeout(1500);
  const repTxt = await page.locator('#aiBody').innerText();
  check('Wochenreport zitiert Kostolany', repTxt.indexOf('Kostolany') !== -1);
  check('Wochenreport enthält Geduld-Bilanz', repTxt.indexOf('Geduld-Bilanz') !== -1 && repTxt.indexOf('10 Signale bewusst verworfen') !== -1);
  await page.locator('#aiModalBg [data-close]').first().click();
  await page.waitForTimeout(300);

  // Einstellungen: eigenes KI-Regelfeld speichert
  await page.click('#settingsBtn');
  await page.waitForTimeout(300);
  await page.fill('#setKiRules', 'Keine Trades in TSLA. Bei Hebel über 25 immer nein.');
  await page.click('#setSaveBtn');
  await page.waitForTimeout(400);
  const kiRules = await page.evaluate(async () => (await window.api.storeGet('settings')).kiRules);
  check('Eigene KI-Regeln werden gespeichert', kiRules && kiRules.indexOf('TSLA') !== -1);

  // decide() hängt die Nutzer-Regeln an den Prompt an
  const promptSent = await page.evaluate(async () => {
    let captured = null;
    const orig = window.api.ollamaFetch;
    window.api.ollamaFetch = async (m, u, b) => { captured = b; return { ok: true, status: 200, body: JSON.stringify({ message: { content: '{"entscheidung":"nein","groesse":1.0,"begruendung":"Test"}' } }) }; };
    await window.LocalKI.decide({ symbol: 'TEST' });
    window.api.ollamaFetch = orig;
    return captured ? captured.messages[0].content : '';
  });
  check('Prompt enthält eingebaute Prüfregeln', promptSent.indexOf('PRÜFREGELN') !== -1);
  check('Prompt enthält Nutzer-Regeln', promptSent.indexOf('ZUSÄTZLICHE REGELN') !== -1 && promptSent.indexOf('TSLA') !== -1);
  check('Prompt enthält Kostolany-Merksatz', promptSent.indexOf('wann er nichts tut') !== -1);
  await page.locator('#setModalBg [data-close]').first().click();

  // v6: neue Bedienelemente vorhanden
  await page.click('#depotPills button[data-sub="strategien"]');
  await page.waitForTimeout(300);
  check('Eröffnungs-Range als Auslöser wählbar', await page.evaluate(async () => {
    document.querySelector('#idSetupPills button[data-setup="ausbruch"]').click();
    await new Promise(r => setTimeout(r, 200));
    return Array.from(document.querySelectorAll('#idTrigger option')).some(o => o.value === 'range');
  }));
  check('auto-Stop im Dropdown', await page.locator('#idScalpSL option[value="auto"]').count() === 1);
  check('Sizing-Auswahl da', await page.locator('#idSizing').count() === 1);
  check('MTF-Schalter da (an)', await page.locator('#idMtf').isChecked());
  check('Screener-Schalter da (aus)', !(await page.locator('#idScreener').isChecked()));
  check('Screener-Button da', await page.locator('#screenBtn').count() === 1);
  await page.selectOption('#idSizing', '0.5');
  await page.selectOption('#idScalpSL', 'auto');
  await page.waitForTimeout(300);
  const dep2 = await page.evaluate(async () => (await window.api.storeGet('depot')).intraday);
  check('Sizing + auto-SL gespeichert', dep2.sizing === '0.5' && dep2.scalpSL === 'auto');

  // Update-Check (gemockte GitHub-Antwort v9.9.9)
  await page.click('#settingsBtn');
  await page.waitForTimeout(300);
  await page.fill('#setUpdateRepo', 'wilhelm/markt-dashboard');
  await page.click('#setUpdateBtn');
  await page.waitForTimeout(600);
  const updTxt = await page.locator('#setUpdateStatus').innerText();
  check('Update-Check findet v9.9.9', updTxt.indexOf('9.9.9') !== -1 && updTxt.indexOf('verfügbar') !== -1);
  await page.locator('#setModalBg [data-close]').first().click();
  await page.waitForTimeout(200);

  // Lernschleife: appendKiRules dedupliziert
  const addRes = await page.evaluate(() => {
    const a1 = window.appendKiRules(['Keine TSLA Puts.', 'Keine NVDA Calls.']);
    const a2 = window.appendKiRules(['Keine TSLA Puts.']);
    return { a1, a2, rules: window.getSettings().kiRules };
  });
  check('appendKiRules fügt hinzu + dedupliziert', addRes.a1 === 2 && addRes.a2 === 0 && addRes.rules.indexOf('NVDA') !== -1);

  // v7.1: Reparatur verwaister Trades
  await page.click('#depotPills button[data-sub="depot"]');
  await page.waitForTimeout(600);
  const repTxt3 = await page.locator('#positionsPanel').innerText();
  check('Reparatur-Hinweis erscheint', repTxt3.indexOf('Buchhaltung repariert') !== -1);
  const repState = await page.evaluate(async () => {
    const dep = await window.api.storeGet('depot');
    const t900 = dep.trades.find(t => t.id === 900), t901 = dep.trades.find(t => t.id === 901);
    return { inPos: dep.positions.some(p => p.id === 900), t901closed: t901 && t901.status === 'closed', note: !!dep.repairNote };
  });
  check('Vollständiger Trade zurück in Positionen', repState.inPos);
  check('Kaputter Datensatz sauber abgeschrieben', repState.t901closed);
  check('Reparatur wird gespeichert', repState.note);

  // v7: Signal-Chart, Live-Monitor, Symbol-Sperre, Filter-Nutzen, Autostart
  await page.click('#depotPills button[data-sub="strategien"]');
  await page.waitForTimeout(400);
  check('Signal-Chart-Auswahl gefüllt', await page.locator('#scSym option').count() > 5);
  check('Live-Monitor vorhanden', (await page.locator('#sigMonitor').innerText()).indexOf('Noch kein Scan') !== -1);
  check('Symbol-Sperren-Anzeige vorhanden', (await page.locator('#symBlocks').innerText()).indexOf('Keine gesperrten') !== -1);
  await page.click('#scBtn');
  await page.waitForTimeout(2500);
  const scPaths = await page.locator('#scChart path').count();
  check('Signal-Chart zeichnet Linien', scPaths >= 2);
  check('Signal-Chart-Info gefüllt', (await page.locator('#scInfo').innerText()).indexOf('Leitlinie') !== -1);
  await page.click('#depotPills button[data-sub="auswertung"]');
  await page.waitForTimeout(300);
  check('Filter-Nutzen-Knopf vorhanden', await page.locator('#filterBtn').count() === 1);
  await page.click('#settingsBtn');
  await page.waitForTimeout(300);
  check('Autostart-Schalter vorhanden', await page.locator('#setAutostart').count() === 1);
  await page.locator('#setModalBg [data-close]').first().click();
  await page.waitForTimeout(300);

  // Auto-Tuning-Verlauf: Panel listet und bewertet die Änderung
  await page.click('#depotPills button[data-sub="auswertung"]');
  await page.waitForTimeout(700);
  const tuneTxt2 = await page.locator('#tuneLog').innerText();
  check('Tuning-Verlauf listet Änderung', tuneTxt2.indexOf('period → 50') !== -1);
  check('Tuning-Verlauf bewertet Wirkung', /wirkt|schadet|neutral|zu wenig Daten/.test(tuneTxt2));
  check('Tuning-Verlauf zeigt Rang', tuneTxt2.indexOf('#1') !== -1);
  check('Rückgängig-Knopf vorhanden', await page.locator('[data-undo]').count() > 0);

  // Bericht-Anzeige
  await page.click('#reportShowBtn');
  await page.waitForTimeout(700);
  const repTxt2 = await page.locator('#aiBody').innerText();
  check('Analyse-Bericht wird angezeigt', repTxt2.indexOf('Testinhalt aus dem Daten-Ordner') !== -1);
  await page.locator('#aiModalBg [data-close]').first().click();
  await page.waitForTimeout(300);

  // Analyse-Zentrale: Panel + Leerzustand vorhanden
  check('Zentrale-Button vorhanden', await page.locator('#centralBtn').count() === 1);
  const centTxt = await page.locator('#centralResult').innerText();
  check('Zentrale zeigt Leerzustand', centTxt.indexOf('Noch keine Analyse') !== -1);

  // Messschnitt: Altbestand bleibt sichtbar, zählt aber nicht mehr mit
  const messTest = await page.evaluate(async () => {
    const d = await window.api.storeGet('depot');
    return { messStart: d.messStart, legacy: (d.trades||[]).filter(t=>t.legacy).length, total: (d.trades||[]).length };
  });
  check('Messschnitt vorhanden', messTest.messStart !== undefined);
  check('Seed-Trades zählen mit (Schnitt in der Vergangenheit)', messTest.legacy === 0);

  // Regime-Automatik: Bedienelemente, Whitelist-Prüfung, Rückfallregel
  check('Regime-Schalter vorhanden', await page.locator('#aoRegime').count() === 1);
  check('Regime standardmäßig an', await page.locator('#aoRegime').isChecked());
  check('Regime-Knopf vorhanden', await page.locator('#regimeBtn').count() === 1);
  const regTxt = await page.locator('#regimeStatus').innerText();
  check('Regime-Status zeigt Leerzustand', regTxt.indexOf('Noch kein Durchlauf') !== -1);
  check('Hinweis an der Strategie-Karte', (await page.locator('#regimeHint').innerText()).indexOf('automatisch gesetzt') !== -1);
  await page.click('#regimeBtn');
  await page.waitForTimeout(6000);
  const regTxt2 = await page.locator('#regimeStatus').innerText();
  check('Regime-Durchlauf liefert eine Entscheidung', /Quelle:/.test(regTxt2));
  check('Ohne lokales Modell greift die feste Regel', /Regel/.test(regTxt2));
  check('Regime nennt die gemessenen Zahlen', /Trendanteil/.test(regTxt2));
  const cfgAfter = await page.evaluate(async () => (await window.api.storeGet('depot')).regime);
  check('Regime-Entscheidung wird gespeichert', !!cfgAfter && cfgAfter.ok === true && !!cfgAfter.fakten);
  check('Nur erlaubte Setups', ['ausbruch','umkehr'].indexOf(cfgAfter.wahl.setup) !== -1);
  check('Nur erlaubte Zeitrahmen', ['1m','5m'].indexOf(cfgAfter.wahl.zeitrahmen) !== -1);

  // Automatische Updates: Schalter, Prüfung, Installations-Knopf
  await page.click('#settingsBtn');
  await page.waitForTimeout(400);
  check('Auto-Update: Schalter vorhanden', await page.locator('#setAutoUpdate').count() === 1);
  check('Auto-Update: Standard ist an', await page.locator('#setAutoUpdate').isChecked());
  await page.click('#setUpdNowBtn');
  await page.waitForTimeout(400);
  const updAutoTxt = await page.locator('#setUpdAutoStatus').innerText();
  check('Auto-Update: meldet fertiges Update', updAutoTxt.indexOf('9.9.9') !== -1);
  check('Auto-Update: Installations-Knopf erscheint', await page.locator('#setUpdInstallBtn').isVisible());
  await page.click('#setUpdInstallBtn');
  await page.waitForTimeout(300);
  check('Auto-Update: Installation wird ausgelöst', await page.evaluate(() => window.__updInstalled === true));
  await page.locator('#setModalBg [data-close]').first().click();
  await page.waitForTimeout(300);
  await page.click('nav.tabs button[data-tab="depot"]');
  await page.waitForTimeout(300);
  await page.click('#depotPills button[data-sub="auswertung"]');
  await page.waitForTimeout(400);

  // Selbst-Optimierung: Bedienelemente + Status
  check('Selbst-Optimierung: Schalter vorhanden', await page.locator('#aoOn').count() === 1);
  check('Selbst-Optimierung: Takt-Auswahl vorhanden', await page.locator('#aoEvery').count() === 1);
  check('Selbst-Optimierung: Robustheits-Schalter vorhanden', await page.locator('#aoRobust').count() === 1);
  check('Selbst-Optimierung: Sofort-Knopf vorhanden', await page.locator('#aoBtn').count() === 1);
  const aoTxt = await page.locator('#autoOptStatus').innerText();
  check('Selbst-Optimierung: Status zeigt nächsten Lauf', aoTxt.indexOf('Nächster Durchlauf') !== -1 || aoTxt.indexOf('Noch kein Durchlauf') !== -1);
  await page.selectOption('#aoEvery', '24');
  await page.waitForTimeout(200);
  const aoSaved = await page.evaluate(async () => (await window.api.storeGet('depot')).autoOpt);
  check('Selbst-Optimierung: Takt wird gespeichert', !!aoSaved && aoSaved.everyH === 24);

  // Analyse-Export: Button vorhanden, Payload ohne Zugangsdaten
  await page.click('#depotPills button[data-sub="auswertung"]');
  await page.waitForTimeout(300);
  check('Export-Button vorhanden', await page.locator('#exportDataBtn').count() === 1);
  await page.click('#exportDataBtn');
  await page.waitForTimeout(500);
  const exp = await page.evaluate(() => {
    const p = window.__lastExport;
    if (!p) return null;
    const txt = JSON.stringify(p.json);
    return { hasTrades: Array.isArray(p.json.trades), hasCsv: typeof p.csv === 'string' && p.csv.indexOf('Symbol') !== -1, leaks: /apiKey|capKey|capPass|kiRules/i.test(txt),
      health: !!(p.json.gesundheit && typeof p.json.gesundheit.scansGesamt === 'number'), kurse: !!(p.kurse && p.kurse.bars && p.kurse.tages), journal: Array.isArray(p.json.experimentJournal), kontext: p.json.marktkontext !== undefined };
  });
  check('Export enthält Gesundheitsdaten', !!exp && exp.health);
  check('Export enthält Kursdaten-Block', !!exp && exp.kurse);
  check('Export enthält Experiment-Journal', !!exp && exp.journal);
  check('Export enthält Trades + CSV', !!exp && exp.hasTrades && exp.hasCsv);
  check('Export enthält KEINE Zugangsdaten', !!exp && !exp.leaks);
  const expStatus = await page.locator('#reportStatus').innerText();
  check('Export-Status zeigt Zielordner', expStatus.indexOf('Markt-Dashboard-Daten') !== -1);

  // Screenshot für die Doku
  await page.screenshot({ path: 'smoke-optionsscheine.png', fullPage: false });

  console.log(results.join('\n'));
  console.log(errors.length ? '❌ JS-Fehler:\n' + errors.join('\n') : '✅ JS-Fehler: keine');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
