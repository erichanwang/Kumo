# Kumo — Read Japanese Anywhere with Automatic Furigana & Dictionary Lookups

**TL;DR:** Free Chrome extension that adds furigana above every kanji on any Japanese webpage — hover for instant definitions, save words to a word bank, and study with SRS. Works on YouTube captions and Netflix too.

---

## The Problem

You're trying to read Japanese online — a news article, a tweet, a Wikipedia page. But every other kanji stops you cold. You copy-paste into a dictionary. You lose your reading flow. You give up.

## What Kumo Does

**[Kumo](https://kumoapp.net)** (雲 = "cloud") is a Chrome extension that floats above Japanese text like a cloud, giving you furigana readings and instant definitions without breaking your reading flow.

### Core Features

📖 **Automatic Furigana** — Hiragana readings appear above every kanji within 1-2 seconds of page load. Works on any site: NHK News Easy, Wikipedia JP, Twitter/X, blogs, manga sites — anywhere with Japanese text.

💬 **Instant Hover Dictionary** — Hover any word for its reading, English definitions, JLPT level, and kanji breakdown (on'yomi, kun'yomi). Save to your word bank or mark as known in one click. Zero alt-tabbing to Jisho.org.

▶️ **YouTube Caption Integration** — Kumo fetches Japanese captions via YouTube's API and overlays them in a clean, readable bar below the video — with full furigana on every word. Hover caption words just like on any webpage. Perfect for immersion learning. Also works on Netflix.

🧠 **SRS Flashcards (Pro)** — Saved words go into a spaced repetition system with 5-level grading (Again → Perfect). Review them in the built-in flashcard mode without needing Anki.

📊 **Kanji Progress Tracking** — See your JLPT N5→N1 progress at a glance. Watch your known kanji count grow from your first 10 to the full 2,136 jōyō set.

✍️ **Sentence Mining (Pro)** — Capture example sentences with `Alt+M` and save them with the source URL for context-based review.

🎯 **Progressive Furigana** — Known words show furigana in gray (hidden until hover). Unknown words glow gold. You control what you see — toggle furigana per JLPT level or entirely with `Alt+J`.

🌐 **Offline-First, Not Offline-Only** — Core dictionary lookups (JMdict, KanjiDic2) run 100% locally with no internet needed. Optional Jisho.org enriched definitions and YouTube transcript fetching use network requests. Enable Offline Mode in settings to disable all network calls for maximum privacy.

📤 **Export** — Free tier supports CSV export. Pro adds Anki-compatible export (basic, reversed, cloze formats).

## Why Not Just Use Yomitan / Rikaikun / 10ten?

Those are great tools. Here's what Kumo does differently:

| Feature | Kumo | Yomitan | Rikaikun |
|---------|------|---------|----------|
| Furigana on EVERY kanji (progressive) | ✅ | ❌ (one word at a time) | ❌ |
| YouTube caption overlay | ✅ | ❌ | ❌ |
| Netflix subtitle bar | ✅ | ❌ | ❌ |
| Built-in SRS | ✅ | ❌ (needs Anki) | ❌ |
| Word bank with export | ✅ | ✅ | ❌ |
| Kanji progress tracking (N5–N1) | ✅ | ❌ | ❌ |
| Sentence mining | ✅ | ✅ (via AnkiConnect) | ❌ |
| Name recognition | ✅ | ✅ | ❌ |
| Romaji display toggle | ✅ | ❌ | ❌ |
| Install & go (no setup) | ✅ | ❌ (load dictionaries) | ✅ |

Kumo is designed to be **zero-config** — install from the Chrome Web Store and it just works. No dictionary files to download, no Anki setup, no manual configuration.

## How to Get Started

1. Install from the [Chrome Web Store](https://chrome.google.com/webstore)
2. Go to any Japanese website (try [NHK News Easy](https://www3.nhk.or.jp/news/easy/))
3. Furigana appears automatically within 2 seconds
4. Hover any word → dictionary popup
5. `Alt+S` to save, `Alt+K` to mark known, `Alt+J` to toggle furigana

**YouTube:** Open any Japanese video with captions → Kumo overlays furigana in a bar below the video. Hover words while watching.

**Netflix:** Enable Japanese subtitles → Kumo mirrors them in a clean overlay bar with full furigana.

## What It Looks Like

The website has a demo screenshot showing Kumo in action on a Japanese Wikipedia article about Neon Genesis Evangelion, with furigana, the popup dictionary, and the YouTube overlay bar all visible — [kumoapp.net](https://kumoapp.net)

## Is It Free?

The core features (furigana, hover dictionary, YouTube integration, word bank up to 200 entries, kanji tracking, CSV export) are **completely free**.

**Pro tier** adds: unlimited word bank entries, advanced SRS, Anki export (basic/reversed/cloze), sentence mining, and YouTube auto-pause.

## Privacy

Core dictionary lookups run locally on your device using bundled data — no text from web pages is ever sent to external servers. Optional features (Jisho.org enriched definitions, YouTube transcript fetching) make network requests, which can be disabled via Offline Mode in settings. No analytics, no tracking. Free tier requires no account; Pro tier uses email for optional sync and billing.

---

**I built this because I was tired of copy-pasting every third word into Jisho.org while trying to read Japanese online.** If you're learning Japanese, especially at the intermediate stage where you know some kanji but not enough to read fluently — Kumo is designed exactly for you.

Happy to answer questions in the comments! よろしくお願いします 🙇

---

*[Kumo](https://kumoapp.net) | [GitHub](https://github.com/erichanwang/Kumo) | Chrome Web Store*

---

## FAQ (from previous threads)

**Q: Does it slow down pages?**
A: No. Processing runs during browser idle time via `requestIdleCallback`. The parser loads lazily. Typical overhead is imperceptible.

**Q: How's the parsing accuracy?**
A: Kuromoji.js is solid for standard Japanese text. Informal text, slang, and uncommon compounds may not tokenize perfectly. Name readings are marked in red as "approximate."

**Q: Firefox?**
A: Chrome-only right now. Firefox support is on the roadmap.

**Q: Can I export to Anki?**
A: Yes — the Pro tier supports CSV and Anki-compatible export formats (basic, reversed, cloze).

**Q: Does it work with vertical text?**
A: Not yet — Kumo processes horizontal text only.

**Q: How does it compare to Language Reactor?**
A: Language Reactor is great for Netflix specifically. Kumo works on every webpage — news, Twitter, blogs, Wikipedia — not just video captions. Kumo also has the word bank, SRS, and kanji tracking built in.
