const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

let win;

// Only real web links are ever handed to the user's default browser.
const isWebUrl = (url) => /^https?:\/\//i.test(url);
const openInBrowser = (url) => { if (isWebUrl(url)) shell.openExternal(url); };

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    show: false,
    icon: path.join(__dirname, '..', 'build', 'icon-512.png'),
    backgroundColor: '#0b1220',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Links like "Connect on Facebook" open in the user's own browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openInBrowser(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (isWebUrl(url)) {
      event.preventDefault();
      openInBrowser(url);
    }
  });

  const sendState = () => win && !win.isDestroyed() &&
    win.webContents.send('window:maximized', win.isMaximized());
  win.on('maximize', sendState);
  win.on('unmaximize', sendState);
  win.webContents.on('did-finish-load', sendState);
}

ipcMain.on('window:minimize', () => win && win.minimize());
ipcMain.on('window:toggle-maximize', () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window:close', () => win && win.close());
ipcMain.on('app:open-external', (_e, url) => openInBrowser(String(url)));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(createWindow);
}
app.on('window-all-closed', () => app.quit());
