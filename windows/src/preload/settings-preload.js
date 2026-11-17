'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('islandSettings', {
  platform: process.platform,
  get: () => ipcRenderer.invoke('settings:get'),
  set: (patch) => ipcRenderer.invoke('settings:set', patch),
  setLanguage: (code) => ipcRenderer.invoke('settings:language', code),
  reset: () => ipcRenderer.invoke('settings:reset'),
  status: () => ipcRenderer.invoke('status:get'),
  displays: () => ipcRenderer.invoke('displays:get'),
  accent: () => ipcRenderer.invoke('accent:get'),
  backdrop: () => ipcRenderer.invoke('backdrop:get'),
  test: (kind) => ipcRenderer.invoke('test', kind),
  restartHelper: () => ipcRenderer.invoke('helper:restart'),
  openLogs: () => ipcRenderer.invoke('logs:open'),
  action: (name, arg) => ipcRenderer.invoke('action', name, arg),
  quit: () => ipcRenderer.invoke('app:quit'),
  shortcuts: {
    get: () => ipcRenderer.invoke('shortcuts:get'),
    installed: (force) => ipcRenderer.invoke('shortcuts:installed', force),
    icon: (item) => ipcRenderer.invoke('shortcuts:icon', item),
    add: (item) => ipcRenderer.invoke('shortcuts:add', item),
    remove: (id) => ipcRenderer.invoke('shortcuts:remove', id),
    move: (id, dir) => ipcRenderer.invoke('shortcuts:move', id, dir),
    browse: () => ipcRenderer.invoke('shortcuts:browse'),
    launch: (id) => ipcRenderer.invoke('shortcuts:launch', id),
    addKey: (item) => ipcRenderer.invoke('shortcuts:addKey', item),
    update: (id, patch) => ipcRenderer.invoke('shortcuts:update', id, patch),
  },
  widgets: {
    get: () => ipcRenderer.invoke('widgets:get'),
    catalog: () => ipcRenderer.invoke('widgets:catalog'),
    refresh: (kind) => ipcRenderer.invoke('widgets:refresh', kind),
    testFeed: (url) => ipcRenderer.invoke('widgets:testFeed', url),
  },
  weather: {
    search: (q) => ipcRenderer.invoke('weather:search', q),
    get: () => ipcRenderer.invoke('weather:get'),
    refresh: () => ipcRenderer.invoke('weather:refresh'),
  },
  phone: {
    get: () => ipcRenderer.invoke('phone:get'),
    cmd: (name, args) => ipcRenderer.invoke('phone:cmd', name, args),
  },
  subs: {
    get: () => ipcRenderer.invoke('subs:get'),
    cmd: (name, args) => ipcRenderer.invoke('subs:cmd', name, args),
  },
  gaming: {
    get: () => ipcRenderer.invoke('gaming:get'),
    cmd: (name, args) => ipcRenderer.invoke('gaming:cmd', name, args),
  },
  on(channel, cb) {
    if (!['status', 'settings', 'settings:tab', 'phone', 'weather', 'shortcuts', 'widgets', 'backdrop', 'subs', 'gaming', 'gamingLibrary'].includes(channel)) return () => {};
    const fn = (_e, payload) => cb(payload);
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
});
