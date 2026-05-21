import { useState, useEffect } from 'react'

interface Page {
  slug: string
  title: string
  content: string
}

const pages: Page[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    content: `## Installing Kumo

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) and search for "Kumo"
2. Click **Add to Chrome** → **Add Extension**
3. The Kumo icon ☁️ will appear in your toolbar

## First Use

Navigate to any Japanese website. Kumo automatically detects Japanese text and adds furigana within 2 seconds.

**Try these pages:**
- [NHK News Easy](https://www3.nhk.or.jp/news/easy/) — simplified news
- [Wikipedia JP](https://ja.wikipedia.org) — encyclopedia articles
- [Twitter/X](https://twitter.com) — social media posts

## Controls

- **Click the Kumo icon** in your toolbar to open settings
- **Toggle Furigana** off to hide all readings instantly
- **Toggle YouTube** off to disable caption furigana
- **Alt+J** toggles furigana on/off from your keyboard`
  },
  {
    slug: 'features',
    title: 'Features',
    content: `## Furigana Overlay

Kumo uses Kuromoji.js to analyze Japanese text and injects ruby tags with hiragana readings above every kanji.

- **Known kanji**: furigana hidden (shown on hover)
- **Unknown kanji**: furigana always visible in gold

## Hover Popup

Hover over any word to see:
- Reading in hiragana
- English definitions
- JLPT level badge
- Part of speech
- **⭐ Save** button — adds to your word bank
- **✓ I know this** — marks as known

## Word Bank

Your personal vocabulary list with:
- All saved words with readings and definitions
- Filter by JLPT level (N5–N1)
- Search by word, reading, or definition
- Export to CSV
- Mark as known / delete

## YouTube Integration

Kumo hooks into YouTube's caption system:
- Adds furigana to Japanese captions in real time
- Hover caption words for definitions
- Auto-pause when hovering unknown words (optional)`
  },
  {
    slug: 'word-bank',
    title: 'Word Bank',
    content: `## Managing Your Word Bank

Access your word bank by clicking the Kumo toolbar icon → **📚 Open Word Bank**.

### Saving Words

Hover over any word on any webpage → click **⭐ Save** in the popup. The word is added to your word bank with:
- Word (kanji form)
- Reading (hiragana)
- Definitions (from JMdict)
- JLPT level
- Source URL
- Date saved

### Marking Known

Click **✓ I know this** in the popup to mark a word as known. Known words show furigana in gray (hidden until hover).

### Filtering & Search

Use the filter dropdowns to browse by:
- JLPT level (N5–N1)
- Known vs Learning status
- Starred items
- Text search across word, reading, and definitions

### Export

Click **Export CSV** to download your word bank. Compatible with Excel, Google Sheets, and Anki.`
  },
  {
    slug: 'youtube',
    title: 'YouTube Setup',
    content: `## Using Kumo with YouTube

### Requirements

- YouTube video with **Japanese captions** enabled
- Captions must be **auto-generated (Japanese)** or **uploaded Japanese subtitles**

### How It Works

1. Open any YouTube video with Japanese captions
2. Enable captions (CC button)
3. Kumo automatically detects the captions and adds furigana
4. Hover over any word in the captions for a definition popup
5. Mark words as known right from the video

### Auto-Pause

Enable **Auto-pause on Unknown** in the popup settings to pause the video when you hover over an unknown word. Great for:
- Watching at your own pace
- Looking up words without missing content
- Active listening practice

### Known Issue

YouTube occasionally changes their DOM structure. If furigana stops appearing on captions:
1. Refresh the page
2. Toggle YouTube integration off/on in the popup
3. Update Kumo to the latest version`
  },
  {
    slug: 'privacy',
    title: 'Privacy & Data',
    content: `## Privacy Policy

### What Kumo Collects

**Nothing.** Kumo runs entirely on your device.

- All dictionary lookups use locally bundled files
- Your word bank is stored in Chrome's local storage
- No text from webpages ever leaves your device
- No analytics, no tracking, no servers

### Data Storage

- Word bank: Chrome local storage (~200 entries free, unlimited on Pro)
- Settings: Chrome local storage
- Sync: Uses Chrome account sync if enabled

### Clearing Data

To delete all Kumo data:
1. Right-click the Kumo toolbar icon
2. Click **Manage Extension**
3. Click **Clear Data** (or uninstall)

### Dictionary Attribution

Kumo uses:
- **JMdict** — Electronic Dictionary Research and Development Group
- **KanjiDic2** — Electronic Dictionary Research and Development Group
- **Kuromoji.js** — Japanese morphological analyzer

These are free, open-source resources. No API calls are made to any server.`
  },
  {
    slug: 'faq',
    title: 'FAQ',
    content: `## Frequently Asked Questions

### Does Kumo work offline?
Yes. All dictionary data is bundled with the extension. No internet required after install.

### Is it free?
The Free tier includes all core features: furigana, hover popups, YouTube integration, word bank (200 entries). Pro adds unlimited entries, sentence mining, and Anki export.

### Does it work with other languages?
No. Kumo is designed specifically for Japanese. The morphological analyzer (Kuromoji) only handles Japanese text.

### Will Kumo slow down my pages?
No. Kumo processes text in batches using idle callbacks to avoid blocking the main thread. The parser loads lazily after page load.

### Can I use it on Firefox?
Firefox support is on the roadmap but not yet available. Kumo is Chrome-only for the MVP.

### How does it compare to Yomitan?
Kumo is simpler to install (one click from the store), has native YouTube integration, and tracks your kanji knowledge. Yomitan has more advanced dictionary configuration but requires manual setup.`
  }
]

function getSlugFromHash(): string {
  const hash = window.location.hash.slice(1)
  if (hash && pages.some(p => p.slug === hash)) {
    return hash
  }
  return 'getting-started'
}

export default function Docs() {
  const [activePage, setActivePage] = useState(getSlugFromHash)

  // Sync URL hash when page changes
  const navigateTo = (slug: string) => {
    setActivePage(slug)
    window.history.replaceState(null, '', `/docs#${slug}`)
  }

  // Listen for hash changes (back/forward navigation, or links like /docs#privacy)
  useEffect(() => {
    const onHashChange = () => {
      setActivePage(getSlugFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const currentPage = pages.find(p => p.slug === activePage) || pages[0]

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <a href="/" className="docs-back">← Back to Kumo</a>
        <nav className="docs-nav">
          {pages.map(page => (
            <button
              key={page.slug}
              className={`docs-nav-item ${activePage === page.slug ? 'docs-nav-active' : ''}`}
              onClick={() => navigateTo(page.slug)}
            >
              {page.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="docs-content">
        <h1 className="docs-page-title">{currentPage.title}</h1>
        <div
          className="docs-markdown"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(currentPage.content) }}
        />
      </main>

      <style>{`
        .docs-layout {
          display: flex;
          min-height: calc(100vh - 80px);
          background: var(--bg-primary);
        }
        .docs-sidebar {
          width: 240px;
          padding: 32px 20px;
          border-right: 1px solid var(--border);
          background: var(--bg-secondary);
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .docs-back {
          display: inline-block;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 13px;
          margin-bottom: 24px;
          transition: color var(--transition);
        }
        .docs-back:hover {
          color: var(--text-primary);
        }
        .docs-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .docs-nav-item {
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition);
          font-family: inherit;
        }
        .docs-nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }
        .docs-nav-active {
          background: rgba(58, 111, 245, 0.12) !important;
          color: var(--accent-light) !important;
          font-weight: 500;
        }
        .docs-content {
          flex: 1;
          padding: 40px 48px;
          max-width: 760px;
        }
        .docs-page-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 28px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .docs-markdown h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 32px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .docs-markdown h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 24px 0 8px;
        }
        .docs-markdown p {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: 16px;
        }
        .docs-markdown ul, .docs-markdown ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .docs-markdown li {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          padding: 4px 0;
        }
        .docs-markdown code {
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 13px;
          color: var(--accent-light);
        }
        .docs-markdown a {
          color: var(--accent-light);
          text-decoration: none;
        }
        .docs-markdown a:hover {
          text-decoration: underline;
        }
        .docs-markdown strong {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .docs-layout {
            flex-direction: column;
          }
          .docs-sidebar {
            width: 100%;
            height: auto;
            position: static;
            padding: 16px 20px;
          }
          .docs-content {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  )
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
}
