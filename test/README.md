# Kumo — Local Testing Guide

## Quick Start

```bash
# 1. Build the extension
npm run build

# 2. Start the test server
npm run test:server

# 3. Open http://localhost:3456 in Chrome
```

## Windows Quick Load

```bash
npm run build
npm run test:load
```

This opens Chrome with the extension pre-loaded (via `--load-extension` flag)
and the test page at `http://localhost:3456`.

## Manual Load (All Platforms)

1. Run `npm run build` to build the extension into `dist/`
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `dist/` folder
5. Navigate to `http://localhost:3456` (or open `test/test-page.html` directly)

## What to Test

| Feature | Expected Behavior | How to Verify |
|---------|-------------------|---------------|
| Furigana injection | Ruby text appears above all kanji on the page | Look at any Japanese text on test page |
| Hover popup | Popup shows reading + definition on hover | Hover over a word like 勉強 or 気象庁 |
| Save to word bank | Clicking ⭐ adds word to storage | Check popup → Word Bank |
| Toggle furigana | Turning off in extension popup removes furigana | Click extension icon → toggle |
| YouTube captions | Furigana appears on `.ytp-caption-segment` | See mock caption area on test page |
| Word Bank page | Shows saved words with search/filter | Click "Word Bank" from extension popup |

## Test Page Sections

The test page at `test/test-page.html` contains:

1. **News Article** — NHK-style Japanese paragraphs (JLPT N3~N1 vocabulary)
2. **Various Sentences** — Daily conversation examples (JLPT N5~N4)
3. **Word List** — Isolated vocabulary for testing word-by-word furigana
4. **YouTube Captions** — Mock `.ytp-caption-segment` containers
5. **Instructions** — Built-in checklist at the bottom of the page

## Notes

- The test server is a simple Node.js HTTP server (no dependencies beyond Node.js built-ins)
- Kuromoji dictionary files load asynchronously; furigana may take 1–3 seconds to appear on first load
- The extension only activates on pages with Japanese text (CJK characters)
- If furigana doesn't appear, check the extension's console via `chrome://extensions` → "Inspect views: content script"
