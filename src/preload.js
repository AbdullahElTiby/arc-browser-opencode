const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  // Password
  passwordIsSet: () => ipcRenderer.invoke('password-is-set'),
  passwordSet: (password) => ipcRenderer.invoke('password-set', password),
  passwordVerify: (password) => ipcRenderer.invoke('password-verify', password),
  passwordRemove: () => ipcRenderer.invoke('password-remove'),

  // opencode
  opencodeCheck: () => ipcRenderer.invoke('opencode-check'),
  opencodeStream: (payload) => ipcRenderer.send('opencode-stream', payload),
  onChunk: (cb) => ipcRenderer.on('opencode-chunk', (_, data) => cb(data)),
  onDone:  (cb) => ipcRenderer.on('opencode-done',  (_, data) => cb(data)),
  removeChunkListeners: () => {
    ipcRenderer.removeAllListeners('opencode-chunk');
    ipcRenderer.removeAllListeners('opencode-done');
  },
});
