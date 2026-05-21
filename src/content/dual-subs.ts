// Dual subtitle overlay for Kumo
// Watches Netflix captions and renders them in a custom subtitle bar
// below the video, giving learners a consistent furigana-enabled reading experience.

import { processNodeBatch } from './furigana'
import { containsJapanese } from './parser'

/** CSS selectors that Netflix uses for caption/subtitle containers */
const NETFLIX_CAPTION_CONTAINERS = [
  '.player-timedtext',
  '.player-timedtext-text-container',
  '.player-timedtext > span',
  // Netflix shadow-dom-like selectors (inside the nested player divs)
  '.watch-video--player-view video + div span',
  '.watch-video--player-view div[class*="TimedText"]',
]

/** Fallback polling interval (ms) to catch captions MutationObserver might miss.
 *  Netflix often re-renders its player DOM entirely, which can bypass observers. */
const POLL_INTERVAL_MS = 3000
let pollTimer: ReturnType<typeof setTimeout> | null = null

/** Start fallback polling for Netflix caption updates. */
function startPolling(): void {
  if (pollTimer) return
  const poll = () => {
    if (!isActive) { pollTimer = null; return }
    try {
      const text = extractCaptionText()
      if (text) {
        updateSubtitleBar(text)
      } else {
        // Try re-watching captions if the container was replaced
        if (captionObserver && subBar && subBar.style.opacity === '0') {
          const newContainer = findCaptionContainer()
          if (newContainer && captionObserver) {
            captionObserver.disconnect()
            captionObserver.observe(newContainer, {
              childList: true, subtree: true, characterData: true,
            })
          }
        }
      }
    } catch { /* ignore polling errors */ }
    pollTimer = setTimeout(poll, POLL_INTERVAL_MS)
  }
  pollTimer = setTimeout(poll, POLL_INTERVAL_MS)
}

function stopPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}


let subBar: HTMLElement | null = null
let captionObserver: MutationObserver | null = null
let bodyObserver: MutationObserver | null = null
let isActive = false
let activeVideo: HTMLVideoElement | null = null

export function initDualSubtitles(): void {
  if (isActive) return
  isActive = true

  // Try to find the video element immediately
  activeVideo = document.querySelector('video')
  if (activeVideo) {
    createSubtitleBar()
    watchCaptions()
  } else {
    // Wait for video to appear
    bodyObserver = new MutationObserver(() => {
      const video = document.querySelector('video')
      if (video) {
        activeVideo = video
        bodyObserver?.disconnect()
        bodyObserver = null
        createSubtitleBar()
        watchCaptions()
      }
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })
  }
}

export function disableDualSubtitles(): void {
  isActive = false
  activeVideo = null
  destroySubtitleBar()
  stopPolling()
  if (captionObserver) {
    captionObserver.disconnect()
    captionObserver = null
  }
  if (bodyObserver) {
    bodyObserver.disconnect()
    bodyObserver = null
  }
}

export function isDualSubActive(): boolean {
  return isActive
}

function createSubtitleBar(): void {
  if (subBar) return
  subBar = document.createElement('div')
  subBar.id = 'kumo-dual-sub-bar'
  subBar.style.cssText = `
    position: fixed;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90vw;
    padding: 12px 24px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #fff;
    font-size: 22px;
    font-family: 'Hiragino Sans', 'Noto Sans CJK', system-ui, sans-serif;
    line-height: 1.6;
    text-align: center;
    z-index: 2147483646;
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
    opacity: 0;
  `
  subBar.innerHTML = '<span class="kumo-sub-text"></span>'
  document.body.appendChild(subBar)
}

function destroySubtitleBar(): void {
  if (subBar) {
    subBar.remove()
    subBar = null
  }
}

// Keep a reference to the currently observed container
let currentCaptionContainer: Element | null = null

function watchCaptions(): void {
  if (!subBar) return

  // Strategy: watch for Netflix caption elements appearing in the DOM.
  // Netflix renders captions inside .player-timedtext containers.
  // We also watch the video's parent container for any Japanese text.

  const target = findCaptionContainer() || document.body

  captionObserver = new MutationObserver((mutations) => {
    if (!isActive || !subBar) return

    // Handle characterData: clear stale processed markers so
    // captions that update in-place get fresh furigana.
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const target = mutation.target as Text | null
        const parent = target?.parentElement
        if (parent) {
          parent.removeAttribute('data-kl-caption')
          // Also clear on the overall caption container
          for (const sel of NETFLIX_CAPTION_CONTAINERS) {
            const container = parent.closest?.(sel)
            if (container) {
              container.querySelectorAll?.('[data-kl-caption]').forEach(el => {
                el.removeAttribute('data-kl-caption')
              })
              break
            }
          }
        }
      }
    }

    try {
      const text = extractCaptionText()
      if (text && containsJapanese(text)) {
        updateSubtitleBar(text)
      } else if (!text) {
        hideSubtitleBar()
      }
    } catch (e) {
      console.debug('Kumo: Error in dual-sub caption observer', e)
    }
  })

  currentCaptionContainer = target

  captionObserver.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  // Initial scan
  const initialText = extractCaptionText()
  if (initialText && containsJapanese(initialText)) {
    updateSubtitleBar(initialText)
  }

  // Start fallback polling for platforms like Netflix that rebuild DOM
  startPolling()
}

/** Find a Netflix caption container in the DOM. */
function findCaptionContainer(): Element | null {
  for (const selector of NETFLIX_CAPTION_CONTAINERS) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  // Fallback: look near the video element
  if (activeVideo?.parentElement) {
    let target: Element | null = activeVideo.parentElement
    for (let i = 0; i < 5 && target; i++) {
      const timedText = target.querySelector('.player-timedtext')
      if (timedText) return timedText
      target = target.parentElement
    }
  }
  return null
}

/** Extract the current caption text from Netflix DOM. */
function extractCaptionText(): string {
  for (const selector of NETFLIX_CAPTION_CONTAINERS) {
    const container = document.querySelector(selector)
    if (container && container.textContent?.trim()) {
      return container.textContent.trim()
    }
  }
  return ''
}

function updateSubtitleBar(text: string): void {
  if (!subBar) return
  const span = subBar.querySelector('.kumo-sub-text')
  if (!span) return

  // Don't re-render if the text hasn't changed
  if ((span as HTMLElement).dataset.lastText === text) return
  ;(span as HTMLElement).dataset.lastText = text

  // Clear and re-populate so furigana can be injected
  span.textContent = text
  subBar.style.opacity = '1'

  // Inject furigana into the subtitle text
  processNodeBatch(span as HTMLElement)
}

function hideSubtitleBar(): void {
  if (subBar) {
    subBar.style.opacity = '0'
  }
}
