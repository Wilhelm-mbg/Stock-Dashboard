'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchText: (url) => ipcRenderer.invoke('fetch-text', url),
  postJson: (url, headers, body) => ipcRenderer.invoke('post-json', url, headers, body),
  storeGet: (name) => ipcRenderer.invoke('store-get', name),
  storeSet: (name, value) => ipcRenderer.invoke('store-set', name, value),
  setTrayMode: (v) => ipcRenderer.send('tray-mode', !!v),
  capFetch: (method, url, headers, body) => ipcRenderer.invoke('cap-fetch', method, url, headers, body),
  ollamaFetch: (method, url, body) => ipcRenderer.invoke('ollama-fetch', method, url, body),
  appVersion: () => ipcRenderer.invoke('app-version'),
  exportAnalysis: (payload) => ipcRenderer.invoke('export-analysis', payload),
  readRecommendation: () => ipcRenderer.invoke('read-recommendation'),
  readReport: () => ipcRenderer.invoke('read-report'),
  setAutostart: (v) => ipcRenderer.invoke('set-autostart', v),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
