const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url),
  copyText: (text) => ipcRenderer.send('app:copy-text', text),
  onCopyScreen: (cb) => {
    ipcRenderer.on('app:copy-screen', cb);
    return () => ipcRenderer.removeListener('app:copy-screen', cb);
  },
  onMaximizedChange: (cb) => {
    const handler = (_e, value) => cb(value);
    ipcRenderer.on('window:maximized', handler);
    return () => ipcRenderer.removeListener('window:maximized', handler);
  }
});
