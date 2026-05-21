# Kumo: Read Japanese Anywhere

**Kumo** (雲, "cloud") is a Chrome extension that adds furigana, dictionary lookups, and spaced-repetition learning to every Japanese text on the web, including YouTube captions. Hover over any word to see definitions, save words to your word bank, and study them with SRS flashcards.

> *"Like a cloud floating above the text, Kumo adds a layer of understanding without getting in the way."*

---

## Architecture

Kumo is two projects in one monorepo:

| Project | Directory | Description |
|---------|-----------|-------------|
| **Chrome Extension** | `/` (root) | Manifest v3 extension. Content scripts inject furigana and popups; a service worker handles background tasks. |
| **Marketing Website** | `/app` | React + Vite landing page at [kumoapp.net](https://kumoapp.net). Includes docs, blog, pricing, and a Japanese (日本語) language toggle. |

---

## Features

### Extension
- **Furigana Overlay**: Automatically adds hiragana readings above kanji on any Japanese webpage. Toggle on/off with `Alt+J`.
- **Hover Dictionary**: Hover any word to see definitions, readings, JLPT level, and kanji breakdowns (on'yomi, kun'yomi, nanori).
- **Name Recognition**: Detects proper nouns (surnames, places, organizations) and cross-references a built-in name database. Name readings are shown in red to indicate they're approximate.
- **YouTube Integration**: Furigana on Japanese YouTube captions in real time. Hover caption words for instant definitions.
- **Word Bank**: Save words with a click (`Alt+S`). Filter by JLPT level, known/learning status, or starred. Export to CSV, Anki, or JSON.
- **SRS (Spaced Repetition)**: Add words to flashcard review. Five-level grading system (Again → Perfect) with adaptive intervals.
- **Sentence Mining**: Capture example sentences (`Alt+M`) with source URLs for context-based learning.
- **Kanji Reference**: Standalone kanji viewer with stroke counts, on/kun/nanori readings, and meanings.
- **Quiz Mode**: Test your knowledge with multiple-choice quizzes drawn from your word bank.
- **Stats Dashboard**: Track daily streaks, words looked up, words saved, sentences mined, and SRS progress.
- **Backup & Restore**: Export/import all your data as JSON.
- **Dark Theme**: Respects your system preference and the host page's color scheme.

### Website
- **Landing Page**: Features, how-it-works, pricing, testimonials, FAQ.
- **Blog**: Articles about Japanese learning and Kumo's technology.
- **Documentation**: Full user guide.
- **Japanese Mode**: Toggle the entire site UI between English and Japanese (日本語). Language preference persists across sessions.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+J` | Toggle furigana on/off |
| `Alt+K` | Mark last hovered word as known |
| `Alt+S` | Save last hovered word to word bank |
| `Alt+M` | Mine sentence for last hovered word |

> You can remap these in `chrome://extensions/shortcuts`.

---

## Tech Stack

### Extension
- **TypeScript**: Strict mode, ES2020 target
- **Vite** + `@crxjs/vite-plugin`, Build tooling with custom IIFE content script plugin
- **Kuromoji.js**: Japanese morphological analyzer (tokenization + POS tagging)
- **JMdict**: 180,000+ Japanese-English dictionary entries (preprocessed to JSON)
- **KanjiDic2**: 13,000+ kanji with readings, meanings, and stroke counts
- **ENAMDICT**: Japanese name dictionary (~740,000 entries, preprocessed)
- **Vitest**: Unit tests for dictionary, progress, SRS, and sentences modules

### Website
- **React 19** + TypeScript, SPA with hash-based routing
- **Vite 8**: Build tooling with custom build-info plugin
- **Vitest** + Testing Library, Component tests
- **Vercel**: Hosting with SPA rewrites
- **GitHub API**: Live extension timestamp in the footer

---

## Project Structure

```
Kumo/
├── manifest.json              # Chrome extension manifest v3
├── package.json               # Extension dependencies & scripts
├── vite.config.ts             # Vite config (zlibjs fix + IIFE plugin)
├── tsconfig.json              # TypeScript config
├── vitest.config.ts           # Test config
│
├── src/                       # Extension source
│   ├── background/            # Service worker
│   │   ├── service-worker.ts  # Main background script
│   │   ├── badge.ts           # Extension badge management
│   │   └── context-menu.ts    # Right-click context menus
│   │
│   ├── content/               # Content scripts (injected into pages)
│   │   ├── index.ts           # Entry point
│   │   ├── parser.ts          # Kuromoji tokenizer wrapper
│   │   ├── furigana.ts        # Furigana injection & batch processing
│   │   ├── popup.ts           # Hover popup system
│   │   ├── styles.ts          # Injected CSS
│   │   ├── observer.ts        # DOM mutation observer
│   │   ├── keyboard.ts        # Keyboard shortcut handler
│   │   ├── youtube.ts         # YouTube caption integration
│   │   └── onboarding.ts      # First-run onboarding
│   │
│   ├── lib/                   # Shared library modules
│   │   ├── dictionary.ts      # JMdict/KanjiDic2/names lookup
│   │   ├── api-dictionary.ts  # Jisho.org API fallback
│   │   ├── storage.ts         # chrome.storage wrapper
│   │   ├── srs.ts             # Spaced repetition logic
│   │   ├── sentences.ts       # Sentence mining
│   │   ├── progress.ts        # Stats & streak tracking
│   │   ├── i18n.ts            # Extension i18n (EN/JA)
│   │   ├── anki-export.ts     # Anki deck export
│   │   ├── audio.ts           # Audio playback
│   │   └── theme.ts           # Dark/light theme
│   │
│   ├── data/                  # Preprocessed dictionary data
│   │   ├── jmdict.json        # Word dictionary
│   │   ├── kanjidic.json      # Kanji dictionary
│   │   └── names.json         # Name dictionary
│   │
│   └── __tests__/             # Extension unit tests
│
├── scripts/                   # Dictionary preprocessing
│   ├── process-jmdict.ts      # JMdict XML → JSON
│   └── process-kanjidic.ts    # KanjiDic2 XML → JSON
│
├── test/                      # Manual test infrastructure
│   ├── test-page.html         # Test page with Japanese text
│   ├── server.js              # Local test server
│   └── load-extension.bat     # Windows extension loader
│
├── *.html / *.css / *.ts      # Extension sub-pages
│   ├── popup.*                # Extension toolbar popup
│   ├── wordbank.*             # Word bank page
│   ├── srs.*                  # SRS review page
│   ├── kanji.*                # Kanji reference page
│   ├── stats.*                # Stats dashboard
│   ├── sentences.*            # Sentence bank
│   ├── quiz.*                 # Quiz mode
│   └── backup.*               # Backup/restore
│
└── app/                       # Marketing website
    ├── package.json
    ├── vite.config.ts          # Build with version injection
    ├── vercel.json             # Moved to root vercel.json
    ├── index.html
    └── src/
        ├── App.tsx             # Root component + routing
        ├── i18n.ts             # Website i18n (EN/JA)
        ├── index.css           # Global styles
        ├── main.tsx            # Entry point
        ├── components/         # Navbar, Footer, EmailCapture
        ├── contexts/           # LanguageContext
        ├── hooks/              # useGitHubTimestamp
        ├── pages/              # Docs, Blog, About, Contact, etc.
        ├── sections/           # Hero, Features, Pricing, FAQ, etc.
        └── __tests__/          # Component tests
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **Chrome** or any Chromium-based browser
- **Git** with LFS (for large dictionary files, if applicable)

### Extension Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` directory

# Run tests
npx vitest run
```

### Website Development

```bash
cd app
npm install
npm run dev          # → http://localhost:5173
npm run build        # Production build → app/dist/
```

### Dictionary Processing

The preprocessed dictionaries (`src/data/*.json`) are committed to the repo. If you need to regenerate them from source XML:

```bash
# Download JMdict_e.xml and kanjidic2.xml to scripts/
npm run process-dicts
```

---

## Build System Details

The extension build uses a custom Vite setup to work around several challenges:

### zlib.js Fix
Kuromoji depends on `zlibjs` for decompressing dictionary files. The zlib.js IIFE uses `.call(this)` which breaks in Vite's ESM strict mode (`this` is `undefined`). A custom Vite plugin replaces `.call(this)` with `.call(globalThis)` and adds a named export so Kuromoji's `require()` can access `Zlib.Gunzip`.

### Content Script IIFE
The `@crxjs/vite-plugin` generates a dynamic import loader with hashed filenames (`index.ts-loader-XXXX.js` → `import("assets/index.ts-YYYY.js")`). This breaks when Chrome's module cache is cleared, producing `ERR_FILE_NOT_FOUND`. A custom `closeBundle` plugin rebuilds the content script as a standalone IIFE with a fixed filename (`content.js`), eliminating dynamic imports entirely.

### Website Build Info
The website's `vite.config.ts` injects three build-time constants:
- `__WEBSITE_BUILD_TIME__`, Current date
- `__EXTENSION_LAST_UPDATED__`, Last git commit date for `manifest.json`
- `__EXTENSION_VERSION__`, Version from `manifest.json`

At runtime, the footer fetches the latest extension commit date from the GitHub API (cached in `sessionStorage` for 1 hour), falling back to the build-time date.

---

## Data Sources

| Source | Purpose | License |
|--------|---------|---------|
| [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) | Japanese-English dictionary (~180k entries) | CC-BY-SA |
| [KanjiDic2](https://www.edrdg.org/kanjidic/kanjidic2.xml) | Kanji readings and meanings (~13k kanji) | CC-BY-SA |
| [ENAMDICT](https://www.edrdg.org/enamdict/enamdict_doc.html) | Japanese name dictionary (~740k entries) | CC-BY-SA |
| [Kuromoji.js](https://github.com/takuyaa/kuromoji.js) | Japanese morphological analyzer | Apache 2.0 |
| [Jisho.org](https://jisho.org) | Online dictionary API (fallback) | - |

All dictionary data is preprocessed at build time and bundled with the extension. No network requests are made for dictionary lookups (except for the optional Jisho.org API fallback when a word isn't found locally).

---

## Testing

```bash
# Extension tests
npx vitest run

# Website tests
cd app && npx vitest run

# Type checking
npx tsc --noEmit          # Extension
cd app && npx tsc -b      # Website
```

---

## Deployment

### Extension
1. Build: `npm run build`
2. Zip `dist/` and upload to Chrome Web Store Developer Dashboard

### Website
The website deploys automatically via Vercel on push to `main`. The root `vercel.json` redirects Vercel to build from the `app/` directory.

```bash
# Manual deploy
cd app
vercel --prod
```

---

## Known Issues

- **Dictionary loading** is slow on first page visit (Kuromoji loads multi-MB JSON dictionaries). A loading indicator has been added, but initial load can take 1-3 seconds.
- **Kuromoji parsing accuracy** varies, informal text, slang, and uncommon kanji compounds may not tokenize correctly.
- **Name readings** derived from the names database are approximate. The UI marks them in red with a " approx" warning.
- **GitHub API rate limiting**: the live extension timestamp on the website is cached in `sessionStorage` for 1 hour to stay within unauthenticated rate limits (60 req/hr).

---

## License

This project is private. All rights reserved.

### Third-Party Attribution
Dictionary data is provided by the Electronic Dictionary Research and Development Group (EDRDG) under Creative Commons Attribution-ShareAlike licenses. See [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) and [KanjiDic2](https://www.edrdg.org/kanjidic/kanjidic2.xml) for details.

---

<p align="center">
  <sub>Built with blood, sweat, tears, and way too much time in vite.config.ts.</sub>
</p>
