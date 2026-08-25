'use strict';
const { contextBridge, ipcRenderer } = require('electron');

/* Das Farbthema kommt als Startargument des Fensters, nicht ueber IPC: thema.js muss
 * es im <head> lesen koennen, also SYNCHRON, bevor der Rumpf geparst wird.
 * Nur die zwei erlaubten Werte kommen durch - was hier ankommt, faerbt die ganze
 * Oberflaeche, und dafuer wird nichts durchgereicht, was nicht gepruefft ist. */
function startThemaAusArgv() {
  try {
    for (var i = 0; i < process.argv.length; i++) {
      var m = /^--startthema=(light|dark)$/.exec(process.argv[i]);
      if (m) return m[1];
    }
  } catch (e) { /* ohne Argument bleibt es beim Thema aus dem <html>-Tag */ }
  return null;
}

contextBridge.exposeInMainWorld('api', {
  startThema: startThemaAusArgv(),
  fetchText: (url) => ipcRenderer.invoke('fetch-text', url),
  // Ergebnistermine: nur ein Kuerzel geht raus, Ziel und Anfragekoerper stehen im Hauptprozess fest.
  earningsFetch: (symbol) => ipcRenderer.invoke('earnings-fetch', symbol),
  bugReport: (m) => ipcRenderer.invoke('bug-report', m),
  bugList: () => ipcRenderer.invoke('bug-list'),
  bugMarkSent: (id) => ipcRenderer.invoke('bug-mark-sent', id),
  bugSync: (updates) => ipcRenderer.invoke('bug-sync', updates),
  diagnoseConfig: () => ipcRenderer.invoke('diagnose-config'),
  diagnoseSend: (titel, body, label) => ipcRenderer.invoke('diagnose-send', titel, body, label),
  storeGet: (name) => ipcRenderer.invoke('store-get', name),
  storeSet: (name, value) => ipcRenderer.invoke('store-set', name, value),
  storeDefekte: () => ipcRenderer.invoke('store-defekte'),
  marktStammdaten: () => ipcRenderer.invoke('markt-stammdaten'),
  marktWertpapierarten: () => ipcRenderer.invoke('markt-wertpapierarten'),
  marktSecBasis: () => ipcRenderer.invoke('markt-sec-basis'),
  marktSecBranchen: (syms) => ipcRenderer.invoke('markt-sec-branchen', syms),
  onMarktSecFortschritt: (cb) => ipcRenderer.on('markt-sec-fortschritt', (_ev, d) => cb(d)),
  messStrategien: () => ipcRenderer.invoke('mess-strategien'),
  messLauf: (key) => ipcRenderer.invoke('mess-lauf', key),
  messAbbrechen: () => ipcRenderer.invoke('mess-abbrechen'),
  onMessFortschritt: (cb) => ipcRenderer.on('mess-fortschritt', (_ev, d) => cb(d)),
  setTrayMode: (v) => ipcRenderer.send('tray-mode', !!v),
  capFetch: (method, url, headers, body) => ipcRenderer.invoke('cap-fetch', method, url, headers, body),
  yahooQuotes: (syms) => ipcRenderer.invoke('yahoo-quotes', syms),
  appVersion: () => ipcRenderer.invoke('app-version'),
  exportAnalysis: (payload) => ipcRenderer.invoke('export-analysis', payload),
  readRecommendation: () => ipcRenderer.invoke('read-recommendation'),
  readReport: () => ipcRenderer.invoke('read-report'),
  readSpekulationen: () => ipcRenderer.invoke('read-spekulationen'),
  readProtokolle: () => ipcRenderer.invoke('read-protokolle'),
  writeStrategie: (key, quelltext) => ipcRenderer.invoke('write-strategie', key, quelltext),
  readInsider: () => ipcRenderer.invoke('read-insider'),
  setAutostart: (v) => ipcRenderer.invoke('set-autostart', v),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  updateState: () => ipcRenderer.invoke('update-state'),
  updateCheck: () => ipcRenderer.invoke('update-check'),
  updateInstall: () => ipcRenderer.invoke('update-install'),
  updateSetAuto: (on) => ipcRenderer.invoke('update-set-auto', on),
  onUpdate: (cb) => ipcRenderer.on('update-state', (_ev, st) => cb(st))
});
