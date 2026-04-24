# Nocturnal Curator

A Chrome extension for Grok Imagine automations. Features a side panel interface for browsing templates, creating content, and managing generation history.

## Features

- **Templates** — Browse and select from preset content templates
- **Create** — Generate images/videos with custom prompts and settings
- **History** — View recent generations

## Tech Stack

- Vue 3 (Composition API)
- Tailwind CSS v4
- Vite (build tooling)
- Chrome Extension MV3

## Project Structure

```
├── src/
│   ├── App.vue        # main Vue component
│   ├── main.js        # Vue app entry point
│   └── styles.css     # Tailwind theme and base styles
├── sidepanel.html     # extension side panel (Vite entry point)
├── background.js      # service worker
├── content.js        # content script (injected into grok.com)
├── manifest.json     # extension manifest
└── vite.config.js    # Vite configuration
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts a Vite dev server. Note: Hot Module Replacement (HMR) requires a dev server running — the side panel won't auto-reload without it.

## Building

```bash
npm run build
```

Outputs production build to `dist/`. Run this after any code changes, then reload the extension at `chrome://extensions`.

## Loading the Extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Reload** on the extension card after each build
4. Click the extension icon in the browser toolbar to open the side panel

## Debugging

- **Side panel content** — Right-click extension icon → Inspect popup
- **Service worker logs** — `chrome://extensions` → click **"service worker"** link under the extension
- **Content script** — Open `grok.com` → DevTools → Console
