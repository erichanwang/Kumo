// Injected CSS styles for Kumo
// Injects furigana and popup styles into host pages

export function injectStyles(): void {
  if (document.getElementById('kanjilens-styles')) return

  // Read current furigana color from settings (sync read from storage)
  let furiganaColor = '#e8a000'
  try {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings?.furiganaColor) {
        furiganaColor = result.settings.furiganaColor
        updateFuriganaColor(furiganaColor)
      }
    })
  } catch { /* ignore */ }

  const style = document.createElement('style')
  style.id = 'kanjilens-styles'
  style.textContent = `
    /* Furigana ruby styling */
    .kanjilens-ruby {
      ruby-position: over;
      cursor: pointer;
      position: relative;
      line-height: 1;
      vertical-align: baseline;
    }

    .kanjilens-ruby rt {
      line-height: 0.55;
      margin: 0;
      padding: 0;
      transform: translateY(-0.12em);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* YouTube title container - allow expansion for furigana */
    ytd-video-primary-info-renderer #container {
      height: auto !important;
    }

    /* YouTube watch metadata container - allow expansion for furigana */
    ytd-watch-metadata {
      height: auto !important;
      min-height: 0 !important;
    }

    /* YouTube video info container - ensure it expands to fit furigana-expanded title */
    ytd-video-primary-info-renderer,
    ytd-video-secondary-info-renderer {
      height: auto !important;
      min-height: 0 !important;
    }

    /* Alternative: target the meta container that holds channel name/views */
    #meta {
      margin-top: 4px !important;
      height: auto !important;
      min-height: 0 !important;
    }

    /* YouTube titles use tight fixed-looking typography. Keep furigana readable
       without letting ruby annotation inflate or collapse the title block. */
    ytd-watch-metadata h1,
    ytd-video-primary-info-renderer h1,
    #title h1 {
      overflow: visible !important;
      line-height: 1.22 !important;
      /* Reduce base font size to accommodate larger furigana */
      font-size: 0.9em !important;
    }

    ytd-watch-metadata h1 .kanjilens-ruby,
    ytd-video-primary-info-renderer h1 .kanjilens-ruby,
    #title h1 .kanjilens-ruby {
      line-height: 1.02 !important;
    }

    ytd-watch-metadata h1 .kanjilens-ruby rt,
    ytd-video-primary-info-renderer h1 .kanjilens-ruby rt,
    #title h1 .kanjilens-ruby rt {
      font-size: 0.4em !important;
      line-height: 0.5 !important;
      transform: translateY(-0.09em);
    }

    /* Kana-only words — hoverable for Kumo Card, visually identical to plain text */
    .kanjilens-kana {
      cursor: pointer;
      position: relative;
    }

    /* Subtle highlight on hover to signal clickability */
    .kanjilens-kana:hover {
      background: rgba(232, 160, 0, 0.08);
      border-radius: 2px;
    }

    .kanjilens-ruby rt.kanjilens-rt-new {
      font-size: var(--kumo-furigana-size, 0.4em);
      color: var(--kumo-furigana-color, #e8a000);
      font-family: -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans CJK SC', sans-serif;
      font-weight: 500;
    }

    /* Name furigana — always visible in red since name readings are approximate */
    .kanjilens-ruby rt.kanjilens-rt-name {
      font-size: var(--kumo-furigana-size, 0.4em);
      color: #ff6b6b;
      font-family: -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans CJK SC', sans-serif;
      font-weight: 500;
    }

    .kanjilens-ruby rt.kanjilens-rt-known {
      font-size: var(--kumo-furigana-size, 0.4em);
      color: transparent;
      transition: color 0.15s ease;
    }

    .kanjilens-ruby:hover rt.kanjilens-rt-known {
      color: #999;
    }

    /* Kumo Card — glassmorphism hover card with word definitions */
    .kanjilens-popup {
      position: fixed;
      z-index: 2147483647;
      background: rgba(8, 8, 16, var(--kumo-card-opacity, 0.50));
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #eee;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 0;
      max-width: 520px;
      min-width: 220px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      font-family: -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans CJK SC', sans-serif;
      font-size: 13px;
      line-height: 1.35;
      pointer-events: auto;
      animation: kl-popup-in 0.15s ease-out;
    }

    @keyframes kl-popup-in {
      from {
        opacity: 0;
        transform: translateY(4px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .kl-popup-content {
      padding: 10px 14px;
      max-height: 180px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .kl-popup-header {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }

    .kl-word {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .kl-reading {
      font-size: 12px;
      color: #fff;
      font-weight: 400;
      white-space: nowrap;
    }

    .kl-romaji {
      font-size: 10px;
      color: #777;
      font-weight: 400;
      font-style: italic;
      white-space: nowrap;
    }

    .kl-jlpt {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kl-jlpt-n5 { background: #4caf50; color: #fff; }
    .kl-jlpt-n4 { background: #8bc34a; color: #fff; }
    .kl-jlpt-n3 { background: #ffc107; color: #333; }
    .kl-jlpt-n2 { background: #ff9800; color: #fff; }
    .kl-jlpt-n1 { background: #f44336; color: #fff; }

    .kl-definitions {
      margin-bottom: 6px;
    }

    /* Number-based alternative readings (e.g. 四月→よんげつ) */
    .kl-number-alt-readings {
      font-size: 11px;
      color: #81c784;
      padding: 3px 8px;
      margin-bottom: 4px;
      background: rgba(76, 175, 80, 0.06);
      border-radius: 4px;
      border-left: 2px solid rgba(76, 175, 80, 0.25);
    }

    .kl-number-alt-readings .kl-label {
      color: #66bb6a;
      font-weight: 700;
      margin-right: 4px;
    }

    /* Alternate word readings (e.g. 上手 → うわて, かみて) */
    .kl-alt-readings {
      font-size: 11px;
      color: #90caf9;
      padding: 3px 8px;
      margin-bottom: 4px;
      background: rgba(33, 150, 243, 0.06);
      border-radius: 4px;
      border-left: 2px solid rgba(33, 150, 243, 0.25);
    }

    .kl-alt-readings .kl-label {
      color: #64b5f6;
      font-weight: 700;
      margin-right: 4px;
    }

    .kl-def {
      color: #ccc;
      font-size: 12px;
      padding: 1px 0;
    }

    .kl-kanji-readings {
      font-size: 11px;
      color: #aaa;
      margin-bottom: 2px;
    }

    .kl-label {
      color: #888;
      font-weight: 600;
      margin-right: 4px;
    }

    .kl-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .kl-btn {
      flex: 1;
      padding: 5px 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      background: transparent;
      color: #ddd;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      white-space: nowrap;
    }

    .kl-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .kl-btn:active {
      transform: scale(0.97);
    }

    .kl-save:hover {
      border-color: #ffd700;
      color: #ffd700;
    }

    .kl-known:hover {
      border-color: #4caf50;
      color: #4caf50;
    }

    .kl-known-active {
      border-color: #4caf50;
      color: #4caf50;
      background: rgba(76, 175, 80, 0.08);
    }

    /* Proper noun (name) badge */
    .kl-proper-noun-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(156, 39, 176, 0.3);
      color: #ce93d8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid rgba(156, 39, 176, 0.3);
    }

    /* Name notice */
    .kl-name-notice {
      font-size: 11px;
      color: #aaa;
      padding: 4px 0;
      margin-bottom: 4px;
      font-style: italic;
    }

    /* Name input row */
    .kl-name-input-row {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;
    }

    .kl-name-input {
      flex: 1;
      padding: 5px 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .kl-name-input:focus {
      border-color: rgba(156, 39, 176, 0.5);
    }

    .kl-name-input::placeholder {
      color: #666;
    }

    .kl-name-save-btn {
      padding: 5px 12px;
      border: 1px solid rgba(156, 39, 176, 0.4);
      border-radius: 6px;
      background: rgba(156, 39, 176, 0.2);
      color: #ce93d8;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      flex-shrink: 0;
    }

    .kl-name-save-btn:hover {
      background: rgba(156, 39, 176, 0.35);
    }

    /* API source attribution */
    .kl-api-source {
      font-size: 10px;
      color: #666;
      text-align: right;
      margin-top: 2px;
      font-style: italic;
    }

    .kl-api-defs {
      animation: kl-popup-in 0.2s ease-out;
    }

    /* Loading indicator for API lookup */
    .kl-api-loading {
      font-size: 10px;
      color: #666;
      padding: 2px 0;
      font-style: italic;
      animation: kl-pulse 1.5s ease-in-out infinite;
    }

    @keyframes kl-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    /* Word status row */
    .kl-status-row {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }

    .kl-status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.3px;
    }

    .kl-status-known {
      background: rgba(76, 175, 80, 0.15);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.25);
    }

    /* Utility actions row (unmark) */
    .kl-actions-secondary {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }

    .kl-actions-secondary .kl-btn {
      font-size: 10px;
      padding: 3px 8px;
      flex: 1;
    }

    .kl-unmark:hover {
      border-color: #ff9800;
      color: #ffb74d;
    }

    /* Component kanji readings section */
    .kl-reading-section {
      margin-bottom: 4px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
      border-left: 2px solid rgba(255, 255, 255, 0.1);
    }

    .kl-comp-kanji {
      padding: 1px 0;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .kl-comp-kanji .kl-word {
      font-size: 15px;
      color: #fff;
      font-weight: 600;
      min-width: 18px;
    }

    .kl-comp-kanji .kl-name-reading {
      font-size: 11px;
      color: #ff8080;
    }

    /* Red name reading override for kanji readings (nanori = approximate) */
    .kl-kanji-readings .kl-name-reading {
      color: #ff8080;
    }

    /* Enable Kumo Card hover on ruby text inside the dual subtitle bar.
       The bar itself stays pointer-events: none so it doesn't block the video,
       but ruby elements need pointer events for the Kumo Card to appear. */
    #kumo-dual-sub-bar .kanjilens-ruby {
      pointer-events: auto;
    }

    /* Same for the transcript overlay (YouTube primary caption mode). */
    #kumo-transcript-overlay .kanjilens-ruby,
    #kumo-transcript-overlay .kanjilens-kana {
      pointer-events: auto;
    }

    #kumo-dual-sub-bar .kanjilens-kana {
      pointer-events: auto;
    }
  `

  document.head.appendChild(style)
}

export function removeStyles(): void {
  const style = document.getElementById('kanjilens-styles')
  if (style) {
    style.remove()
  }
  // Also remove the color variable
  document.documentElement.style.removeProperty('--kumo-furigana-color')
}

/** Dynamically update furigana reading color across all ruby elements. */
export function updateFuriganaColor(color: string): void {
  document.documentElement.style.setProperty('--kumo-furigana-color', color)
}