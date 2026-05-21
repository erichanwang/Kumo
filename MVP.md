# MVP.md — Kumo

## What We're Building First

A Chrome extension (Manifest V3) that parses Japanese text on any webpage, injects furigana, shows hover popups with definitions, and integrates with YouTube captions. Word bank stored in Chrome storage. No backend, no accounts, no API calls — everything runs locally.

---

## Stack

- **Extension**: Chrome Manifest V3
- **Language**: TypeScript
- **Bundler**: Vite + CRXJS plugin (best for Chrome extensions)
- **Japanese parser**: Kuromoji.js (morphological analyzer — tokenizes Japanese text)
- **Dictionary**: JMdict (bundled as local JSON, pre-processed)
- **Kanji data**: KanjiDic2 (bundled as local JSON)
- **Storage**: Chrome Storage API (local + sync)
- **UI**: Vanilla CSS (no framework — keep bundle small)
- **YouTube integration**: Content script with MutationObserver on caption DOM

---

## File Structure

```
/kanjilens
  /src
    /background
      service-worker.ts          (background service worker)
    /content
      index.ts                   (main content script — injected on all pages)
      parser.ts                  (Japanese text detection + tokenization)
      furigana.ts                (DOM manipulation — inject ruby tags)
      popup.ts                   (hover popup creation + positioning)
      youtube.ts                 (YouTube caption hook)
      observer.ts                (MutationObserver for dynamic content)
    /popup
      popup.html                 (toolbar popup UI)
      popup.ts                   (popup logic)
      popup.css
    /wordbank
      wordbank.html              (full word bank page)
      wordbank.ts
      wordbank.css
    /lib
      dictionary.ts              (JMdict lookup functions)
      kanji.ts                   (KanjiDic2 lookup functions)
      storage.ts                 (Chrome storage wrapper)
      kuromoji-wrapper.ts        (lazy-load + init kuromoji)
    /data
      jmdict.json                (pre-processed JMdict — trimmed for size)
      kanjidic.json              (pre-processed KanjiDic2)
      jlpt-lists.json            (JLPT N5-N1 kanji lists)
  /public
    icon16.png
    icon48.png
    icon128.png
  manifest.json
  vite.config.ts
  tsconfig.json
```

---

## Pages & Entry Points

### 1. Content Script (injected on all pages)
- Scans page for Japanese text nodes
- Tokenizes with Kuromoji.js
- Wraps kanji/words in `<ruby>` tags with furigana
- Attaches hover listeners for popup
- Runs MutationObserver for dynamically loaded content
- On YouTube: activates YouTube-specific caption hook

### 2. Toolbar Popup (`popup.html`)
Small popup when clicking extension icon:
- Toggle: Furigana on/off
- Toggle: YouTube integration on/off
- Toggle: Auto-pause on unknown word (YouTube)
- Stats: X kanji known, X words saved
- JLPT progress mini-bars (N5 → N1)
- Button: Open Word Bank

### 3. Word Bank Page (`wordbank.html`)
Full-page tab opened from popup:
- Table of all saved words: kanji, reading, meaning, JLPT, date saved, source
- Filter by: JLPT level, known/unknown, date range
- Search bar
- Mark as known / remove buttons
- Export to CSV button (Pro placeholder for Anki)

---

## Core Modules

### parser.ts
```typescript
import { Tokenizer, TokenizerBuilder } from 'kuromoji'

let tokenizer: Tokenizer | null = null

export async function initParser(): Promise<void> {
  return new Promise((resolve, reject) => {
    TokenizerBuilder.build({ dicPath: '/dict' }, (err, built) => {
      if (err) reject(err)
      tokenizer = built
      resolve()
    })
  })
}

export interface Token {
  surface_form: string      // the actual text
  reading: string           // katakana reading
  pos: string               // part of speech
  basic_form: string        // dictionary form
}

export function tokenize(text: string): Token[] {
  if (!tokenizer) throw new Error('Parser not initialized')
  return tokenizer.tokenize(text)
}

export function containsJapanese(text: string): boolean {
  return /[\u3000-\u9fff\uff00-\uffef]/.test(text)
}

export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}
```

### furigana.ts
```typescript
import { Token, katakanaToHiragana } from './parser'
import { isKnown } from '../lib/storage'

export function wrapWithFurigana(token: Token): HTMLElement | Text {
  const hasKanji = /[\u4e00-\u9fff]/.test(token.surface_form)
  if (!hasKanji || !token.reading) {
    return document.createTextNode(token.surface_form)
  }

  const reading = katakanaToHiragana(token.reading)
  const known = isKnown(token.basic_form)

  const ruby = document.createElement('ruby')
  ruby.className = 'kanjilens-ruby'
  ruby.dataset.word = token.basic_form
  ruby.dataset.reading = reading

  const rb = document.createElement('rb')
  rb.textContent = token.surface_form

  const rt = document.createElement('rt')
  rt.textContent = reading
  rt.className = known ? 'kanjilens-rt-known' : 'kanjilens-rt-new'

  ruby.appendChild(rb)
  ruby.appendChild(rt)
  return ruby
}
```

### popup.ts (hover popup)
```typescript
export function createPopup(word: string, reading: string, entry: DictEntry): HTMLElement {
  const popup = document.createElement('div')
  popup.className = 'kanjilens-popup'
  popup.innerHTML = `
    <div class="kl-popup-header">
      <span class="kl-word">${word}</span>
      <span class="kl-reading">${reading}</span>
      <span class="kl-jlpt kl-jlpt-${entry.jlpt}">JLPT ${entry.jlpt ?? '?'}</span>
    </div>
    <div class="kl-definitions">
      ${entry.definitions.slice(0, 3).map(d => `<div class="kl-def">• ${d}</div>`).join('')}
    </div>
    <div class="kl-actions">
      <button class="kl-btn kl-save" data-word="${word}">⭐ Save</button>
      <button class="kl-btn kl-known" data-word="${word}">✓ I know this</button>
    </div>
  `
  return popup
}
```

### youtube.ts
```typescript
export function initYouTubeIntegration(): void {
  // Watch for YouTube caption container to appear
  const observer = new MutationObserver(() => {
    const captionWindow = document.querySelector('.ytp-caption-window-container')
    if (captionWindow && !captionWindow.dataset.klProcessed) {
      captionWindow.dataset.klProcessed = 'true'
      hookCaptions(captionWindow)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function hookCaptions(container: Element): void {
  const captionObserver = new MutationObserver(() => {
    const captionSegments = container.querySelectorAll('.ytp-caption-segment')
    captionSegments.forEach(segment => {
      if (!segment.dataset.klProcessed && containsJapanese(segment.textContent || '')) {
        segment.dataset.klProcessed = 'true'
        processCaptionSegment(segment as HTMLElement)
      }
    })
  })
  captionObserver.observe(container, { childList: true, subtree: true })
}
```

### storage.ts
```typescript
export interface WordEntry {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  savedAt: number
  sourceUrl: string
  known: boolean
  starred: boolean
  seenCount: number
}

export async function saveWord(entry: WordEntry): Promise<void> {
  const bank = await getWordBank()
  bank[entry.word] = entry
  await chrome.storage.local.set({ wordBank: bank })
}

export async function getWordBank(): Promise<Record<string, WordEntry>> {
  const result = await chrome.storage.local.get('wordBank')
  return result.wordBank ?? {}
}

export async function markKnown(word: string): Promise<void> {
  const bank = await getWordBank()
  if (bank[word]) {
    bank[word].known = true
    await chrome.storage.local.set({ wordBank: bank })
  }
}

export function isKnown(word: string): boolean {
  // Sync check from cached known set (updated on load)
  return knownCache.has(word)
}

let knownCache = new Set<string>()
export async function refreshKnownCache(): Promise<void> {
  const bank = await getWordBank()
  knownCache = new Set(Object.values(bank).filter(e => e.known).map(e => e.word))
}
```

---

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "Kumo",
  "version": "0.1.0",
  "description": "Read Japanese anywhere. Learn as you go.",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "web_accessible_resources": [
    {
      "resources": ["dict/*", "data/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

## Data Processing (pre-build scripts)

JMdict and KanjiDic2 are large XML files. Pre-process them into compact JSON:

```typescript
// scripts/process-jmdict.ts
// Run once at build time, not at runtime
// Output: src/data/jmdict.json
// Format: { "word": { definitions: [], reading: "", jlpt: "N3" } }
```

Target sizes after processing:
- `jmdict.json`: ~8MB (trimmed to common words only for MVP, full version for Pro)
- `kanjidic.json`: ~2MB
- Kuromoji dict files: ~10MB (loaded lazily)

---

## CSS (injected styles)

```css
/* Injected into every page */
.kanjilens-ruby {
  ruby-position: over;
  cursor: pointer;
  position: relative;
}
.kanjilens-ruby rt.kanjilens-rt-new {
  font-size: 0.6em;
  color: #e8a000;
  font-family: sans-serif;
}
.kanjilens-ruby rt.kanjilens-rt-known {
  font-size: 0.6em;
  color: transparent; /* hidden until hover */
}
.kanjilens-ruby:hover rt.kanjilens-rt-known {
  color: #999;
}
.kanjilens-popup {
  position: fixed;
  z-index: 999999;
  background: #1a1a2e;
  color: #eee;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 300px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  font-family: sans-serif;
  font-size: 14px;
}
```

---

## MVP Checklist

- [ ] Project setup with Vite + CRXJS + TypeScript
- [ ] JMdict + KanjiDic2 pre-processing scripts
- [ ] Kuromoji.js lazy-loading working
- [ ] `containsJapanese()` text detection
- [ ] Furigana injection on static pages
- [ ] MutationObserver for dynamic content (Twitter, news sites)
- [ ] Hover popup with reading + definition + JLPT
- [ ] Save to word bank button working
- [ ] Mark as known button working
- [ ] Known words: furigana hidden by default
- [ ] Chrome storage save/load working
- [ ] Toolbar popup with toggles + stats
- [ ] Word bank page with table + filter
- [ ] YouTube caption hook working
- [ ] Furigana on YouTube captions
- [ ] Hover popup on YouTube captions
- [ ] Toggle: furigana on/off (persists across sessions)
- [ ] Extension loads without errors on Chrome
- [ ] Tested on: Wikipedia JP, NHK Web Easy, YouTube JP, Twitter/X JP

---

## What We Are NOT Building in MVP

- SRS / flashcard mode
- Anki export
- Sentence mining with audio
- Pro tier / payments
- User accounts
- cv2 / screenshot OCR
- Firefox port
- Native desktop app
- Romaji display (hiragana only)