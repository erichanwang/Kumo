# Changelog

## v0.0.1 — 🎉 THE FIRST WORKING BUILD

**Holy shit it finally works.**

After countless hours of fighting kuromoji, zlibjs, ES modules, Vite plugins, Chrome extension manifests, TypeScript configs, and the fundamental laws of JavaScript module resolution — this extension can finally parse Japanese text and show you what words mean.

### What works

- **Japanese text parsing** via kuromoji morphological analyzer (the zlibjs `.call(this)` → `.call(globalThis)` fix was the final boss)
- **Word lookup popup** — hover/click a word, see its definition
- **Furigana toggle** (`Alt+J`) — show/hide readings above kanji
- **Save words** to your word bank (`Alt+S`)
- **Mark known** words (`Alt+K`)
- **Mine sentences** (`Alt+M`)
- **SRS** (Spaced Repetition System) for review
- **Kanji reference** viewer
- **Stats** tracking your progress
- **Sentence bank** with mined sentences
- **Quiz** mode
- **Backup/restore** your data

### Technical debt (the stuff we know is rough)

- Dictionary loading is slow on first page visit (kuromoji loads multi-MB JSON dictionaries)
- No loading indicator while dictionaries load
- Popup UI is functional but not beautiful
- Error handling could be more graceful
- Test coverage is minimal
- No CI/CD pipeline for releases
- The zlibjs fix is held together with a string replacement in a Vite plugin

### What's next

Polish. Performance. Design. Tests. Making this thing actually delightful to use.

---

*Built with blood, sweat, tears, and way too much time in vite.config.ts.*
