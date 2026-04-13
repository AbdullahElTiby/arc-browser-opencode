# Arc Browser — Electron + opencode AI

A real Chromium-powered desktop browser with a built-in opencode AI sidebar.

## Features

### Browser
- Real Chromium engine (Electron `<webview>`)
- Multi-tab browsing with back/forward history
- X-Frame-Options + CSP stripped — every site loads
- Address bar with Google search fallback
- DevTools per tab (F12)
- Frameless dark UI with macOS-style controls

### AI Sidebar (powered by opencode)
- **Ask page** — Ask anything about the current page content
- **Summarize** — One-click page summary
- **Fill form** — Describe what to fill; AI generates field values
- **Run JS** — Ask for JS; AI writes it + one-click execute on page
- **General** — Freeform chat with opencode

## Setup

### 1. Install opencode (required for AI features)
```bash
curl -fsSL https://opencode.ai/install | bash
```

### 2. Install & run the browser
```bash
npm install
npm start
```

### 3. Build distributable
```bash
npx electron-builder --linux   # AppImage
npx electron-builder --win     # Windows .exe
npx electron-builder --mac     # macOS .dmg
```

## Keyboard Shortcuts

| Shortcut       | Action            |
|----------------|-------------------|
| Ctrl+T         | New tab           |
| Ctrl+W         | Close tab         |
| Ctrl+L         | Focus URL bar     |
| Ctrl+Shift+A   | Toggle AI sidebar |
| Ctrl+1-9       | Switch tab        |
| F12            | DevTools          |

## How it works

- X-Frame-Options/CSP stripped via `session.webRequest.onHeadersReceived`
- opencode runs as `opencode run "<prompt>"` child process, streamed to UI
- Page content extracted from webview via `executeJavaScript`
- JS execution mode: opencode writes the code, one click runs it on the page
