# 🎬 Kumo Subtitle Strips — Guide

Kumo adds a **custom subtitle strip overlay** to video platforms (YouTube, Netflix, and any site with `<video>` elements) that displays Japanese captions with full furigana readings and hover dictionary support. This gives you consistent, readable subtitles with instant word lookups — no matter how the host site styles its captions.

---

## What Are Subtitle Strips?

A **subtitle strip** is a semi-transparent bar that appears near the bottom of the video, showing the current Japanese caption line with furigana over every kanji. Hover any word for an instant dictionary popup. It's like having built-in training wheels for every Japanese video you watch.

The strip mirrors the native captions in a consistent, readable format, giving you:

- **Furigana** on every kanji — readings above each character
- **Hover popups** — definitions, JLPT levels, kanji breakdowns
- **Save & mark known** — build your word bank while watching
- **Consistent styling** — same readable font regardless of the platform's caption design
- **Auto-pause** — optionally pause the video when an unknown word appears

---

## Supported Platforms

| Platform | Mode | How It Works |
|----------|------|--------------|
| **YouTube** | Transcript overlay | Fetches caption data via YouTube's Innertube API, syncs with video time, and renders in a custom overlay bar |
| **YouTube** (fallback) | DOM caption hook | Watches `.ytp-caption-segment` elements and injects furigana directly on the native captions |
| **Netflix** | Dual subtitle bar | Detects Japanese caption text via Netflix's player DOM and mirrors it in a custom overlay bar below the video |

---

## YouTube Transcript Overlay

### How It Works

1. When you open a YouTube video with Japanese captions, Kumo fetches the full caption transcript via YouTube's internal API
2. A semi-transparent overlay bar appears below the video
3. As the video plays, the current caption line appears in the bar — **with furigana**
4. Hover over any word for an instant dictionary popup

### Why It's Better Than Native Captions

| Native YouTube Captions | Kumo Transcript Overlay |
|--------------------------|------------------------|
| Styled by YouTube (often tiny, hard to read) | Large, clear font in a dark bar |
| No furigana | Furigana on every kanji |
| No dictionary | Hover for definitions, JLPT level, save |
| Hard to read at speed | Auto-pause option for unknown words |
| Blocks video content | Overlays below the video player |

### Troubleshooting

- **Overlay doesn't appear:** Make sure the video has Japanese captions (auto-generated or manual). Click the CC button on YouTube to enable captions first.
- **Wrong language:** Kumo only activates for Japanese captions. If the captions are in another language, the overlay won't appear.
- **Captions fall out of sync:** Refresh the page. Kumo syncs to the video's current time via `requestAnimationFrame`.
- **Overlay blocked by an ad blocker:** The Innertube API call may be blocked. Try disabling your ad blocker for YouTube, or Kumo will fall back to the DOM-based caption hook.

---

## Netflix Dual Subtitle Bar

### How It Works

1. Kumo watches for Japanese caption text appearing near the Netflix player
2. When Japanese captions are detected, a custom overlay bar appears near the bottom of the screen
3. The bar displays the current caption line with furigana and hover support
4. The bar fades out when no Japanese captions are on screen

### Performance Notes

- Netflix's player DOM changes frequently. Kumo uses both a `MutationObserver` and a 3-second polling fallback to catch caption updates
- If captions suddenly stop appearing in the overlay, Kumo will re-attach to the new caption container within ~3 seconds

---

## Keyboard Shortcuts While Watching

| Shortcut | Action |
|----------|--------|
| `Alt+J` | Toggle furigana on/off across the entire page (including the overlay) |
| `Alt+S` | Save the last hovered word to your word bank |
| `Alt+K` | Mark the last hovered word as known |
| `Alt+M` | Mine the current sentence (saves the full caption line with the video URL) |

---

## Auto-Pause

Enable **Auto-pause on Unknown** in the extension popup settings to automatically pause the video when a word you haven't marked as known appears in the captions.

- A toast notification ("⏸ Paused for unknown word") appears for 2.5 seconds
- Press play to continue — the video won't auto-resume so you have time to look up the word
- Works on both YouTube (transcript overlay mode) and Netflix (dual subtitle bar mode)

---

## Enabling / Disabling

1. Click the Kumo ☁️ icon in your Chrome toolbar
2. Toggle **YouTube Integration** on/off (auto-detects YouTube and enables transcript overlay)
3. Toggle **Dual Subtitles** on/off (must be manually enabled — enables the Netflix subtitle bar)
4. Toggle **Auto-pause on Unknown** on/off

> **Note:** Both YouTube Integration and Dual Subtitles must be explicitly enabled in settings. They are off by default. Settings persist across browser restarts.

---

## Known Limitations

- **YouTube captions must be enabled** (CC button) for the transcript API to return data
- **Netflix subtitle timing** drifts by ~200-500ms due to polling — use YouTube for the tightest sync
- **Some video sites block content scripts** — if the overlay never appears, the site may be preventing extension injection
- **Auto-generated captions** (ASR) are less accurate than human-made captions, but Kumo handles both
- **Dual subtitle bar** on Netflix uses `pointer-events: none` so it doesn't block video controls. Hover on individual ruby words still triggers the Kumo Card popup

---

## Technical Details

<details>
<summary>Click to expand — implementation overview</summary>

**Files involved:**

- `src/content/youtube-transcript.ts` — Fetches Japanese caption tracks from YouTube's Innertube API, parses the XML transcript, and provides time-synced caption segments
- `src/content/youtube.ts` — Orchestrates the YouTube integration: transcript overlay creation, `requestAnimationFrame` time sync, DOM-based fallback, auto-pause, and SPA navigation detection
- `src/content/dual-subs.ts` — Netflix/generic video dual subtitle bar: DOM detection, caption text extraction, overlay rendering with furigana injection

**Overlay lifecycle:**

1. **YouTube:** `initTranscriptOverlay()` → `fetchJapaneseTranscript()` → `createTranscriptOverlay()` → `startTranscriptSync()` (rAF loop checking `video.currentTime`)
2. **Netflix:** `initProximityBased()` → `watchVideoProximity()` → `MutationObserver` on player container → text extracted and rendered via `updateSubtitleBar()`
3. **Teardown:** `disableYouTubeIntegration()` and `disableDualSubtitles()` clean up observers, overlays, and cached data

**YouTube SPA navigation:** YouTube is a single-page app. Kumo monitors the URL every 2 seconds for video ID changes and re-initializes the transcript overlay when the user navigates to a new video.

</details>
