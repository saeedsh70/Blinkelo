'use strict';
// The in-game bar only receives numbers and reports its own size; it can't ask the main process for anything else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gamebar', {
  on(channel, cb) {
    if (!['gamebar:data', 'gamebar:config'].includes(channel)) return () => {};
    const fn = (_e, payload) => cb(payload);
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  size(w, h) { ipcRenderer.send('gamebar:size', w, h); },
});
