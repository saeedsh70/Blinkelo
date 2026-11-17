'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const CHANNELS = ['helper', 'settings', 'hover', 'clipboard', 'stats', 'demo', 'accent', 'toggleDashboard', 'phone', 'weather', 'shortcuts', 'widgets', 'tasks', 'reminder', 'shelfChanged', 'backdrop', 'subs', 'dragDone', 'gaming', 'gameSummary', 'gamingLibrary'];
const INVOKE = ['settings:get', 'settings:set', 'accent:get', 'icon:forExe', 'image:data', 'shelf:get', 'shelf:add',
  'shelf:remove', 'shelf:clear', 'shelf:open', 'shelf:reveal', 'clipboard:history', 'clipboard:write', 'clipboard:clear', 'action',
  'shortcuts:get', 'shortcuts:launch', 'shortcuts:addPaths', 'weather:get', 'weather:refresh', 'phone:get', 'phone:cmd',
  'widgets:get', 'widgets:refresh', 'tasks:get', 'tasks:add', 'tasks:update', 'tasks:remove', 'tasks:clearDone', 'backdrop:get', 'subs:get', 'subs:cmd', 'gaming:get', 'gaming:cmd'];

contextBridge.exposeInMainWorld('island', {
  platform: process.platform,
  on(channel, cb) {
    if (!CHANNELS.includes(channel)) return () => {};
    const fn = (_e, payload) => cb(payload);
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  helper(name, ...args) { ipcRenderer.send('helper:send', name, args); },
  invoke(name, ...args) {
    if (!INVOKE.includes(name)) return Promise.reject(new Error('not allowed'));
    return ipcRenderer.invoke(name, ...args);
  },
  phone(name, args) { return ipcRenderer.invoke('phone:cmd', name, args); },
  setRects(rects) { ipcRenderer.send('island:rects', rects); },
  setInteractive(on) { ipcRenderer.send('island:interactive', on); },
  hit() { ipcRenderer.send('island:hit'); },
  diag(info) { ipcRenderer.send('island:diag', info); },
  drag(phase) { ipcRenderer.send('island:drag', phase); },
  setFocus(on) { ipcRenderer.send('island:focus', on); },
  attention(ms, kind) { ipcRenderer.send('island:attention', ms, kind); },
  stats(on) { ipcRenderer.send('island:stats', on); },
  startDrag(path) { ipcRenderer.send('shelf:drag', path); },
  subsDrag() { ipcRenderer.send('subs:drag'); },
  subs(name, args) { return ipcRenderer.invoke('subs:cmd', name, args); },
  gaming(name, args) { return ipcRenderer.invoke('gaming:cmd', name, args); },
  pathForFile(file) { try { return webUtils.getPathForFile(file); } catch (_) { return ''; } },
  log(...parts) { ipcRenderer.send('log', ...parts); },
});
