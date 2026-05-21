# INSTRUCTIONS.md — Kumo (Agent Guide)

## What You Are Building

A Chrome extension (Manifest V3) called **Kumo** that adds furigana, hover popups, and a word bank to any Japanese text on the web, with native YouTube caption integration. Read PRD.md and MVP.md fully before writing any code.

---

## Rules

1. **No external API calls at runtime.** All dictionary lookups happen from locally bundled JSON files. No pinging any server when the user hovers over a word.
2. **Never block the main thread.** Kuromoji.js is heavy — always initialize it lazily in a Web Worker or after page load. Never block rendering.
3. **Never break pages.** The content script must be defensive — wrap all DOM manipulation in try/catch, never throw errors that could break the host page.
4. **MutationObserver discipline.** Disconnect observers when not needed. Never create infinite loops where injecting furigana triggers another observation.
5. **Manifest V3 only.** No background pages. Use service workers. No `eval()`. No remote code.

---

## Step-by-Step Build Order

### Step 1: Project Setup

```bash
npm create vite@latest kanjilens -- --template vanilla-ts
cd kanjilens
npm install -D @crxjs/vite-plugin
npm install kuromoji
npm install -D @types/chrome
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
        wordbank: 'wordbank.html'
      }
    }
  }
})
```

---

### Step 2: Process Dictionary Data

Before writing any extension code, run the data processing scripts. These run once at build time and produce the JSON files the extension uses at runtime.

**scripts/process-jmdict.ts**:
- Download JMdict from https://www.edrdg.org/jmdict/j_jmdict.html
- Parse the XML
- Extract: word (kanji form), reading (hiragana), English definitions (first 3 only), JLPT level
- Output format:
```json
{
  "食べる": {
    "reading": "たべる",
    "definitions": ["to eat", "to live on"],
    "jlpt": "N5",
    "pos": "verb"
  }
}
```
- Target output size: under 10MB

**scripts/process-kanjidic.ts**:
- Download KanjiDic2 from https://www.edrdg.org/kanjidic/kanjidic2.xml
- Extract: kanji character, on/kun readings, meanings, JLPT level, stroke count
- Output format:
```json
{
  "食": {
    "on": ["ショク", "ジキ"],
    "kun": ["た.べる", "く.う"],
    "meanings": ["eat", "food"],
    "jlpt": "N5",
    "strokes": 9
  }
}
```

Run both scripts before proceeding:
```bash
npx ts-node scripts/process-jmdict.ts
npx ts-node scripts/process-kanjidic.ts
```

---

### Step 3: Storage Layer (`src/lib/storage.ts`)

Build this first — everything else depends on it.

Implement these functions:
- `saveWord(entry: WordEntry): Promise<void>`
- `getWordBank(): Promise<Record<string, WordEntry>>`
- `markKnown(word: string): Promise<void>`
- `isKnownSync(word: string): boolean` — sync, uses in-memory cache
- `refreshKnownCache(): Promise<void>` — call on content script init
- `getSettings(): Promise<Settings>`
- `saveSettings(settings: Settings): Promise<void>`

Settings interface:
```typescript
interface Settings {
  furiganaEnabled: boolean
  youtubeEnabled: boolean
  autoPauseOnUnknown: boolean
  showRomaji: boolean
}
```

---

### Step 4: Dictionary Lookup (`src/lib/dictionary.ts`)

```typescript
import jmdict from '../data/jmdict.json'
import kanjidic from '../data/kanjidic.json'

export interface DictEntry {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  pos: string
}

export function lookupWord(word: string): DictEntry | null {
  const entry = (jmdict as any)[word]
  if (!entry) return null
  return { word, ...entry }
}

export function lookupKanji(kanji: string): KanjiEntry | null {
  return (kanjidic as any)[kanji] ?? null
}
```

---

### Step 5: Japanese Parser (`src/content/parser.ts`)

Kuromoji must load lazily. It takes 1-2 seconds to initialize and must not block page render.

```typescript
let tokenizerReady = false
let tokenizerInstance: any = null
const queue: (() => void)[] = []

export async function initParser(): Promise<void> {
  return new Promise((resolve) => {
    const kuromoji = (window as any).kuromoji // loaded via web_accessible_resources
    kuromoji.builder({ dicPath: chrome.runtime.getURL('dict/') }).build((err: any, tokenizer: any) => {
      if (err) { console.error('Kumo: parser init failed', err); return }
      tokenizerInstance = tokenizer
      tokenizerReady = true
      queue.forEach(fn => fn())
      resolve()
    })
  })
}

export function tokenize(text: string): any[] {
  if (!tokenizerReady || !tokenizerInstance) return []
  return tokenizerInstance.tokenize(text)
}

export function containsJapanese(text: string): boolean {
  return /[\u3000-\u9fff]/.test(text)
}
```

---

### Step 6: Furigana Injection (`src/content/furigana.ts`)

Critical rules for DOM manipulation:
- Never modify text nodes directly — clone and replace
- Skip nodes inside `<script>`, `<style>`, `<textarea>`, `<input>`, `<code>`
- Skip nodes that already have `.kanjilens-ruby` class (already processed)
- Mark processed nodes with `data-kl-processed="true"` to avoid double processing
- Process in batches of 50 nodes using `requestIdleCallback` to avoid jank

```typescript
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT'])

export function processNode(node: Element): void {
  if (SKIP_TAGS.has(node.tagName)) return
  if (node.dataset.klProcessed) return

  const textNodes = getTextNodes(node)
  textNodes.forEach(textNode => {
    if (!containsJapanese(textNode.textContent || '')) return
    const tokens = tokenize(textNode.textContent || '')
    const fragment = document.createDocumentFragment()
    tokens.forEach(token => {
      fragment.appendChild(wrapWithFurigana(token))
    })
    textNode.parentNode?.replaceChild(fragment, textNode)
  })
  node.dataset.klProcessed = 'true'
}
```

---

### Step 7: Hover Popup (`src/content/popup.ts`)

- Create ONE popup element, reuse it (don't create a new one per word)
- Position it above the hovered word, flip to below if near top of viewport
- Hide on mouseleave with a 200ms delay (so user can move mouse into popup)
- Dismiss on scroll or click outside

```typescript
let popupEl: HTMLElement | null = null

export function initPopupSystem(): void {
  popupEl = document.createElement('div')
  popupEl.className = 'kanjilens-popup'
  popupEl.style.display = 'none'
  document.body.appendChild(popupEl)

  // Event delegation — listen on document for ruby hovers
  document.addEventListener('mouseover', (e) => {
    const ruby = (e.target as Element).closest('.kanjilens-ruby')
    if (ruby) showPopup(ruby as HTMLElement)
  })
  document.addEventListener('mouseout', (e) => {
    const ruby = (e.target as Element).closest('.kanjilens-ruby')
    if (ruby) scheduleHide()
  })
}
```

---

### Step 8: Main Content Script (`src/content/index.ts`)

```typescript
import { initParser, containsJapanese } from './parser'
import { initPopupSystem } from './popup'
import { initObserver } from './observer'
import { initYouTubeIntegration } from './youtube'
import { refreshKnownCache, getSettings } from '../lib/storage'
import { injectStyles } from './styles'

async function init() {
  const settings = await getSettings()
  if (!settings.furiganaEnabled) return

  injectStyles()
  await refreshKnownCache()
  initPopupSystem()
  await initParser()

  // Process existing page content
  processNode(document.body)

  // Watch for new content
  initObserver()

  // YouTube-specific integration
  if (window.location.hostname === 'www.youtube.com' && settings.youtubeEnabled) {
    initYouTubeIntegration()
  }
}

init()
```

---

### Step 9: MutationObserver (`src/content/observer.ts`)

```typescript
export function initObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element
          // Skip if it's our own injected popup
          if (el.classList.contains('kanjilens-popup')) continue
          if (containsJapanese(el.textContent || '')) {
            // Debounce processing
            requestIdleCallback(() => processNode(el))
          }
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}
```

---

### Step 10: YouTube Integration (`src/content/youtube.ts`)

YouTube's DOM structure changes frequently. The selector to watch is `.ytp-caption-segment`. Hook it with a MutationObserver.

```typescript
export function initYouTubeIntegration(): void {
  let captionObserver: MutationObserver | null = null

  // Wait for caption container to appear
  const bodyObserver = new MutationObserver(() => {
    const container = document.querySelector('.ytp-caption-window-container')
    if (container && !container.getAttribute('data-kl')) {
      container.setAttribute('data-kl', 'true')
      captionObserver = new MutationObserver(() => {
        document.querySelectorAll('.ytp-caption-segment:not([data-kl])').forEach(seg => {
          seg.setAttribute('data-kl', 'true')
          if (containsJapanese(seg.textContent || '')) {
            processNode(seg as HTMLElement)
          }
        })
      })
      captionObserver.observe(container, { childList: true, subtree: true })
    }
  })

  bodyObserver.observe(document.body, { childList: true, subtree: true })
}
```

---

### Step 11: Toolbar Popup (`popup.html` + `popup.ts`)

Simple HTML popup with:
- Toggle switches for furigana and YouTube integration
- Stats pulled from Chrome storage
- JLPT progress bars (% of N5/N4/N3 kanji marked known)
- "Open Word Bank" button that opens `wordbank.html` in a new tab

---

### Step 12: Word Bank Page (`wordbank.html` + `wordbank.ts`)

Full-page UI:
- Load all entries from Chrome storage
- Render as a sortable table
- Filter controls: JLPT level dropdown, known/unknown toggle, search input
- Each row: kanji, reading, definitions, JLPT badge, date saved, source URL, known toggle, star toggle, delete button
- Export to CSV button

---

## Testing Checklist

Test on these specific pages:

| Page | What to Test |
|------|-------------|
| https://www3.nhk.or.jp/news/easy/ | Furigana on body text |
| https://ja.wikipedia.org | Furigana on article text |
| https://twitter.com (JP tweets) | MutationObserver on dynamic content |
| https://www.youtube.com (JP video with captions) | Caption hook |
| Any YouTube video | Make sure extension doesn't break EN captions |

---

## Common Pitfalls

- **Infinite loop**: MutationObserver fires when you inject ruby tags. Always check `data-kl-processed` before processing a node.
- **YouTube caption selector breaks**: If `.ytp-caption-segment` stops working, inspect YouTube's DOM and update the selector. Add a fallback selector `.ytp-caption-window-bottom`.
- **Kuromoji dict path**: In MV3, use `chrome.runtime.getURL('dict/')` not a relative path. The dict folder must be in `web_accessible_resources`.
- **Popup z-index wars**: Some sites use very high z-index. Set popup to `z-index: 2147483647` (max int).
- **Ruby tag line height**: Injecting ruby tags increases line height and can break page layouts. Add `ruby { line-height: 1.8; }` and test on dense pages.
- **Storage quota**: Chrome local storage limit is 10MB. Word bank entries are small but warn users if they approach the free tier limit of 200 entries.

---

## Definition of Done

Kumo MVP is done when:
1. Furigana appears on NHK Web Easy within 2 seconds of page load
2. Hovering a word shows popup with reading + definition within 100ms
3. Save and "I know this" buttons work and persist across browser restarts
4. YouTube JP captions show furigana in real time
5. Toggling furigana off in popup immediately hides all furigana
6. Word bank page loads and shows all saved entries
7. Extension passes Chrome Web Store review requirements (no remote code, proper permissions)
8. No console errors on any of the test pages listed above