/* Nachbau der Electron-Bruecke `window.api` fuer den Betrieb im normalen Browser.
 *
 * Die Oberflaeche spricht ausschliesslich ueber `window.api` mit dem Hauptprozess
 * (siehe preload.js). Wer index.html ohne Electron oeffnet, bekommt ohne diesen
 * Nachbau eine tote Seite: jeder Kursabruf wirft `undefined is not a function`.
 *
 * Zwei Betriebsarten:
 *   live      – fetchText geht ueber die Node-Bindung `__nodeFetchText`, also
 *               echte Abrufe mit denselben Hosts wie main.js. Fuer Treiber und
 *               Aufzeichnung.
 *   schnapp   – fetchText beantwortet aus `window.__SNAPSHOT`, einer Aufzeichnung
 *               frueherer Antworten. Fuer die Einzeldatei, die ohne Netz laeuft.
 *
 * Die Funktion wird an zwei Stellen benutzt: Playwright serialisiert sie fuer
 * addInitScript, der Buendler schreibt ihren Quelltext in die HTML-Datei. Deshalb
 * darf sie nichts ausserhalb ihres eigenen Rumpfes verwenden.
 */
export function apiShim(opts) {
  var modus = (opts && opts.modus) || 'live';
  var speicher = (opts && opts.speicher) || 'ram';
  var mem = {};

  function ausSchnappschuss(url) {
    var s = window.__SNAPSHOT || {};
    if (s[url]) return s[url];
    // Yahoo haengt an Chart-Abrufe wechselnde Zeitstempel (period1/period2). Ohne
    // diese Naeherung waere nach dem Aufnahmetag jeder Chart leer.
    var basis = url.split('?')[0];
    var kandidaten = Object.keys(s);
    for (var i = 0; i < kandidaten.length; i++) {
      if (kandidaten[i].split('?')[0] === basis) {
        var a = new URLSearchParams(url.split('?')[1] || '');
        var b = new URLSearchParams(kandidaten[i].split('?')[1] || '');
        if (a.get('interval') === b.get('interval') && a.get('range') === b.get('range')) return s[kandidaten[i]];
      }
    }
    return { ok: false, status: 0, body: 'Nicht im Schnappschuss – diese Ansicht braucht einen frischen Abruf.' };
  }

  function holen(url) {
    if (modus !== 'schnapp') return window.__nodeFetchText(url);
    // Der Schnappschuss wird beim Laden erst entpackt; die Oberflaeche fragt aber
    // sofort nach Kursen. Ohne dieses Warten kaeme die erste Welle ins Leere.
    var bereit = window.__SNAPSHOT_READY || Promise.resolve();
    return bereit.then(function () { return ausSchnappschuss(url); });
  }

  function lesen(name) {
    if (speicher !== 'lokal') return mem[name] === undefined ? null : mem[name];
    try {
      var roh = localStorage.getItem('md:' + name);
      return roh === null ? null : JSON.parse(roh);
    } catch (e) { return mem[name] === undefined ? null : mem[name]; }
  }

  function schreiben(name, wert) {
    mem[name] = wert;
    if (speicher !== 'lokal') return { ok: true };
    try { localStorage.setItem('md:' + name, JSON.stringify(wert)); } catch (e) { /* Speicher voll oder gesperrt */ }
    return { ok: true };
  }

  var aus = function (was) { return { ok: false, status: 0, body: was + ' steht im Browser nicht zur Verfuegung.' }; };

  window.api = {
    fetchText: holen,
    earningsFetch: function () { return Promise.resolve(aus('Ergebnistermine')); },
    bugReport: function () { return Promise.resolve({ ok: true }); },
    bugList: function () { return Promise.resolve([]); },
    bugMarkSent: function () { return Promise.resolve({ ok: true }); },
    bugSync: function () { return Promise.resolve({ ok: true }); },
    diagnoseConfig: function () { return Promise.resolve({ ok: false }); },
    diagnoseSend: function () { return Promise.resolve({ ok: false }); },
    storeGet: function (n) { return Promise.resolve(lesen(n)); },
    storeSet: function (n, v) { return Promise.resolve(schreiben(n, v)); },
    setTrayMode: function () {},
    capFetch: function () { return Promise.resolve(aus('Capital.com')); },
    ollamaFetch: function () { return Promise.resolve(aus('Ollama')); },
    appVersion: function () { return Promise.resolve((opts && opts.version) || 'Browser'); },
    exportAnalysis: function () { return Promise.resolve(aus('Der Analyse-Export')); },
    readRecommendation: function () { return Promise.resolve(null); },
    readReport: function () { return Promise.resolve(null); },
    readSpekulationen: function () { return Promise.resolve(null); },
    readProtokolle: function () { return Promise.resolve(null); },
    writeStrategie: function () { return Promise.resolve({ ok: true }); },
    readInsider: function () { return Promise.resolve(null); },
    setAutostart: function () { return Promise.resolve({ ok: true }); },
    getAutostart: function () { return Promise.resolve(false); },
    openExternal: function (url) { try { window.open(url, '_blank', 'noopener'); } catch (e) { /* gesperrt */ } return Promise.resolve({ ok: true }); },
    updateState: function () { return Promise.resolve({ status: 'idle' }); },
    updateCheck: function () { return Promise.resolve({ ok: true }); },
    updateInstall: function () { return Promise.resolve({ ok: true }); },
    updateSetAuto: function () { return Promise.resolve({ ok: true }); },
    onUpdate: function () {}
  };
}
