const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

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
