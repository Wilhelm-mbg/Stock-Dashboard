'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
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
  setTrayMode: (v) => ipcRenderer.send('tray-mode', !!v),
  capFetch: (method, url, headers, body) => ipcRenderer.invoke('cap-fetch', method, url, headers, body),
  ollamaFetch: (method, url, body) => ipcRenderer.invoke('ollama-fetch', method, url, body),
  appVersion: () => ipcRenderer.invoke('app-version'),
  exportAnalysis: (payload) => ipcRenderer.invoke('export-analysis', payload),
  readRecommendation: () => ipcRenderer.invoke('read-recommendation'),
  readReport: () => ipcRenderer.invoke('read-report'),
  readSpekulationen: () => ipcRenderer.invoke('read-spekulationen'),
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
