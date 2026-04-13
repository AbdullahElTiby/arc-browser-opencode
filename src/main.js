const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  Menu.setApplicationMenu(null);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Window controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// ── opencode detection ───────────────────────────────────────────────────────
ipcMain.handle('opencode-check', async () => {
  const candidates = [
    'opencode',
    path.join(os.homedir(), '.local', 'bin', 'opencode'),
    path.join(os.homedir(), '.bun', 'bin', 'opencode'),
    '/usr/local/bin/opencode',
    '/usr/bin/opencode',
  ];
  return new Promise(resolve => {
    let tried = 0;
    for (const p of candidates) {
      exec(`"${p}" --version 2>/dev/null || "${p}" --help 2>/dev/null | head -1`, { timeout: 4000 }, (err, stdout) => {
        tried++;
        if (!err && stdout.trim()) {
          resolve({ found: true, version: stdout.trim().split('\n')[0], bin: p });
        } else if (tried === candidates.length) {
          resolve({ found: false });
        }
      });
    }
  });
});

// ── opencode streaming chat ──────────────────────────────────────────────────
ipcMain.on('opencode-stream', (event, { prompt, pageContent, mode, opencodebin }) => {
  const bin = opencodebin || 'opencode';

  let fullPrompt = prompt;
  if (pageContent && mode !== 'general') {
    const ctx = pageContent.slice(0, 10000);
    if (mode === 'summarize') {
      fullPrompt = `Summarize the following webpage content clearly and concisely:\n\n${ctx}`;
    } else if (mode === 'fillform') {
      fullPrompt = `The user wants to fill a form on this page. Webpage content:\n\n${ctx}\n\nUser request: ${prompt}\n\nProvide the exact values to fill in each form field, one per line as "field: value".`;
    } else if (mode === 'execjs') {
      fullPrompt = `Generate JavaScript code to run in a browser console to accomplish this task on the current page.\n\nPage content:\n${ctx}\n\nTask: ${prompt}\n\nReturn ONLY the JavaScript code, no explanation.`;
    } else {
      fullPrompt = `You are a browser AI assistant. The user is viewing a webpage.\n\nPAGE CONTENT:\n${ctx}\n\nUSER QUESTION: ${prompt}`;
    }
  }

  const proc = spawn(bin, ['run', fullPrompt], {
    env: { ...process.env },
    shell: true,
  });

  proc.stdout.on('data', d => {
    event.sender.send('opencode-chunk', { chunk: d.toString() });
  });
  proc.stderr.on('data', d => {
    const s = d.toString();
    // Skip spinner/progress characters
    if (!/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.test(s)) {
      event.sender.send('opencode-chunk', { chunk: s, isErr: false });
    }
  });
  proc.on('close', (code) => {
    event.sender.send('opencode-done', { code });
  });
  proc.on('error', err => {
    event.sender.send('opencode-done', { error: err.message });
  });
});

// ── Web security bypass ──────────────────────────────────────────────────────
app.on('web-contents-created', (_, wc) => {
  wc.session.setPermissionRequestHandler((_, _p, cb) => cb(true));
  wc.on('will-attach-webview', (ev, webPreferences) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.webSecurity = false;
  });
});

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const h = { ...details.responseHeaders };
    delete h['x-frame-options'];
    delete h['X-Frame-Options'];
    delete h['content-security-policy'];
    delete h['Content-Security-Policy'];
    delete h['content-security-policy-report-only'];
    callback({ responseHeaders: h });
  });
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
