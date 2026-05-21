# PRD — Kumo

## Overview

**Kumo** is a Chrome extension for Japanese learners that turns any webpage — including YouTube — into an interactive study environment. It adds furigana above kanji, shows definitions on hover, tracks your known/unknown kanji, and integrates natively with YouTube captions for vocabulary building.

The goal: make every Japanese text you encounter on the internet a learning opportunity, with zero friction.

---

## Problem

Japanese learners spend hours on Japanese websites, YouTube, Twitter, and news sites but have to constantly alt-tab to Jisho, Google Translate, or Anki. Existing tools like Yomichan/Yomitan are powerful but dated, hard to set up, and not designed around a modern learning workflow. Nothing has a great YouTube-native integration. Nothing tracks your kanji knowledge in a clean, satisfying way.

Kumo is the tool that should exist for the current generation of learners.

---

## Target Users

- **Primary**: Intermediate Japanese learners (N4–N2 level) who consume Japanese content online
- **Secondary**: Beginners who want immersion support from day one
- **Tertiary**: Advanced learners who want a clean vocab tracking layer

---

## Core Value Proposition

> "Read Japanese anywhere. Learn as you go."

---

## Competitive Landscape

| Tool | Weakness |
|------|----------|
| Yomitan | Complex setup, no YouTube integration, no progress tracking |
| Language Reactor | Video-only, no general web support, expensive |
| Google Translate | No learning layer, no kanji tracking |
| Anki | Flashcards only, not immersion-based |

Kumo combines the best of all of these into one clean, modern extension.

---

## Goals

### MVP Goals
- Furigana overlay on any Japanese text on any webpage
- Hover popup with reading, meaning, JLPT level, stroke count
- Star/save kanji and vocab to personal word bank
- Known kanji toggle (mark as known, hide furigana for known kanji)
- YouTube caption integration: furigana + hover on captions in real time
- Local word bank stored in Chrome storage

### Post-MVP Goals
- Spaced repetition flashcard mode (built-in Anki-style)
- Sentence mining from YouTube (save full sentence + audio clip)
- Export word bank to Anki deck
- Kumo Pro: advanced stats, unlimited word bank, sentence mining
- Reading speed tracker
- Kanji drawing practice
- Native desktop app (Electron/Tauri) with cv2 text recognition
- Firefox extension port

---

## Features

### 1. Furigana Overlay
- Detects Japanese text on any webpage automatically
- Injects furigana (hiragana reading) above kanji using ruby tags
- Toggle on/off via toolbar icon or keyboard shortcut (`Alt+J`)
- Known kanji: furigana hidden by default (can be revealed on hover)
- New kanji: furigana always shown

### 2. Hover Popup
Hovering over any kanji or word shows a popup with:
- Word/kanji reading (hiragana + romaji)
- English definition(s)
- JLPT level badge (N5–N1)
- Part of speech
- Example sentence
- "I know this" / "Save to word bank" buttons

### 3. Word Bank
- Personal list of saved kanji and vocabulary
- Each entry: word, reading, meaning, date saved, source URL, times seen
- Filter by JLPT level, known/unknown, date added
- Export to CSV or Anki deck (Pro)
- Stored locally in Chrome storage (synced with Chrome account)

### 4. Known Kanji System
- Mark kanji/words as known
- Known items: furigana hidden, popup still available on hover
- Progress bar showing % of JLPT N5/N4/N3/N2/N1 kanji known
- Satisfying visual feedback when marking things known

### 5. YouTube Caption Integration
- Detects YouTube pages automatically
- Hooks into YouTube's caption system
- Adds furigana above Japanese captions in real time
- Hover over caption words for popup definition
- "Save sentence" button on each caption line (Pro)
- Auto-pause when hovering over unknown word (toggle)

### 6. Extension Popup Dashboard
Clicking the toolbar icon shows:
- Total kanji known
- Words saved this week
- Current JLPT level progress bars
- Quick toggle: furigana on/off, YouTube integration on/off
- Link to full word bank

---

## Freemium Model

### Free Tier
- Furigana on all webpages
- Hover popups
- Word bank up to 200 entries
- YouTube caption furigana
- Known kanji tracking

### Pro Tier (~$5/month or $40/year)
- Unlimited word bank
- Sentence mining from YouTube (save sentence + audio)
- Anki export
- Advanced stats and streaks
- Priority dictionary lookups
- Ad-free (if ads ever added)

---

## Data Sources

- **Dictionary**: JMdict (free, open source Japanese-English dictionary — the same one Jisho uses)
- **Kanji data**: KanjiDic2 (free, open source)
- **Furigana parsing**: Kuromoji.js (Japanese morphological analyzer, runs in browser)
- **JLPT levels**: JMdict + community JLPT lists

All dictionary data runs locally in the extension. No API calls for lookups.

---

## Out of Scope for MVP

- Flashcard / SRS mode
- Anki export
- Sentence mining with audio
- cv2 / OCR text recognition
- Firefox port
- Native desktop app
- User accounts / cloud sync (Chrome sync only)
- Monetization implementation (build audience first)

---

## Success Metrics

- 1,000 Chrome Web Store installs in first month
- 4.5+ star rating
- 200 Pro conversions in first 3 months
- Featured in r/LearnJapanese or Tofugu

---

## Risks

- **Kuromoji.js bundle size**: The Japanese parser is large (~10MB). Must lazy-load it.
- **YouTube DOM changes**: YouTube updates their player frequently. Caption hook may break and need maintenance.
- **JMdict licensing**: JMdict is free for use but requires attribution. Must credit in extension.
- **Performance**: Parsing every text node on a page can be slow. Must use mutation observers carefully and throttle parsing.