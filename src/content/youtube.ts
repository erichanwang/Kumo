// Multi-platform caption integration for Kumo
// Hooks into video caption systems (YouTube, Netflix, etc.) to add furigana in real time.
//
// Strategy per platform:
//   YouTube  → Transcript API (custom overlay) first, DOM MutationObserver fallback
//   Netflix  → Proximity-based DOM detection + dual subtitle bar
//   Others   → Generic DOM MutationObserver

import { processNodeBatch } from './furigana'
import { containsJapanese } from './parser'
import { getSettings, isKnownSync } from '../lib/storage'
import { initDualSubtitles, disableDualSubtitles } from './dual-subs'
import {
  fetchJapaneseTranscript,
  clearTranscriptCache,
  isYouTubeWatchPage,
  getYouTubeVideoId,
  getCaptionAtTime,
  type TranscriptResult,
} from './youtube-transcript'

// --- Platform Definitions ---

interface CaptionPlatform {
  name: string
  hostnames: string[]
  /** CSS selectors for the caption container element */
  containerSelectors: string[]
  /** CSS selectors for individual caption segments inside the container */
  captionSelectors: string[]
}

const PLATFORMS: CaptionPlatform[] = [
  {
    name: 'YouTube',
    hostnames: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
    containerSelectors: [
      '.ytp-caption-window-container',
    ],
    captionSelectors: [
      '.ytp-caption-segment',
      '.caption-visual-line span',
      '.ytp-caption-window-bottom span',
      '.captions-text span',
    ],
  },
  {
    name: 'Netflix',
    hostnames: ['netflix.com', 'www.netflix.com'],
    containerSelectors: [
      // Netflix renders captions inside the player container — we detect
      // Japanese text near the <video> element via MutationObserver
    ],
    captionSelectors: [
      // Netflix uses dynamic class names; we use a proximity-based fallback
    ],
  },
]

// --- Internal State ---

let captionObserver: MutationObserver | null = null
let bodyObserver: MutationObserver | null = null
let videoObserver: MutationObserver | null = null
let isActive = false
let autoPauseEnabled = false
let activeVideo: HTMLVideoElement | null = null
let activePlatform: CaptionPlatform | null = null

// ── Transcript overlay state (YouTube primary mode) ──
let transcriptOverlay: HTMLElement | null = null
let transcriptData: TranscriptResult | null = null
let transcriptSyncRafId: number | null = null
let transcriptLastText: string = ''
let transcriptFetchAttempted = false

/** Detect which caption platform matches the current page. */
function detectPlatform(): CaptionPlatform | null {
  const hostname = window.location.hostname
  return PLATFORMS.find(p => p.hostnames.some(h => hostname.includes(h))) || null
}

export async function initYouTubeIntegration(): Promise<void> {
  const platform = detectPlatform()
  if (!platform) return

  const settings = await getSettings()
  if (!settings.youtubeEnabled) return

  isActive = true
  autoPauseEnabled = settings.autoPauseOnUnknown
  activePlatform = platform

  // Find the video element for auto-pause and time sync
  activeVideo = document.querySelector('video')

  console.debug(`Kumo: Initializing YouTube integration for platform: ${platform.name}`)

  // ── YouTube: try transcript API first ──
  if (platform.name === 'YouTube' && isYouTubeWatchPage()) {
    startUrlMonitoring()
    console.debug('Kumo: Attempting to load YouTube transcript overlay')
    const transcriptLoaded = await initTranscriptOverlay()
    if (transcriptLoaded) {
      // Transcript mode active — custom overlay handles everything
      console.debug('Kumo: YouTube transcript overlay loaded successfully')
      return
    }
    // Transcript failed or no data — fall through to DOM-based
    console.debug('Kumo: YouTube transcript overlay failed, falling back to DOM-based caption detection')
    initSelectorBased(platform)
    return
  }

  // Strategy depends on platform
  if (platform.containerSelectors.length > 0) {
    // Platform has known container selectors (e.g. YouTube fallback)
    console.debug('Kumo: Using selector-based caption detection for platform:', platform.name)
    initSelectorBased(platform)
  } else {
    // Platform uses dynamic DOM (e.g. Netflix) — use proximity-based detection
    console.debug('Kumo: Using proximity-based caption detection for platform:', platform.name)
    initProximityBased()

    // Also start dual subtitle overlay if enabled
    if (settings.dualSubtitleEnabled) {
      console.debug('Kumo: Initializing dual subtitles')
      initDualSubtitles()
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// Transcript Overlay — Primary YouTube mode
// ══════════════════════════════════════════════════════════════════════

/** Initialize the transcript overlay: fetch transcript and set up sync. */
async function initTranscriptOverlay(): Promise<boolean> {
  if (transcriptFetchAttempted) return transcriptData !== null
  transcriptFetchAttempted = true

  try {
    transcriptData = await fetchJapaneseTranscript()
  } catch (e) {
    console.debug('Kumo: Transcript fetch error:', e)
    transcriptData = null
  }

  if (!transcriptData || transcriptData.segments.length === 0) {
    return false
  }

  console.log(`Kumo: Loaded ${transcriptData.segments.length} Japanese caption segments via transcript API (${transcriptData.trackKind})`)

  createTranscriptOverlay()
  startTranscriptSync()
  return true
}

/** Create the custom caption overlay bar positioned below the video. */
function createTranscriptOverlay(): void {
  if (transcriptOverlay) return

  transcriptOverlay = document.createElement('div')
  transcriptOverlay.id = 'kumo-transcript-overlay'
  transcriptOverlay.style.cssText = `
    position: fixed;
    bottom: 12%;
    left: 50%;
    transform: translateX(-50%);
    max-width: 88vw;
    padding: 14px 28px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    color: #fff;
    font-size: 22px;
    font-family: 'Hiragino Sans', 'Noto Sans CJK', system-ui, -apple-system, sans-serif;
    line-height: 1.7;
    text-align: center;
    z-index: 2147483646;
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5);
    transition: opacity 0.25s ease;
    opacity: 0;
  `
  transcriptOverlay.innerHTML = '<span class="kumo-transcript-text"></span>'
  document.body.appendChild(transcriptOverlay)

  // Pointer events are kept 'none' on the overlay bar so it doesn't block
  // video controls underneath. Individual ruby elements get pointer-events: auto
  // via the injected stylesheet (#kumo-transcript-overlay .kanjilens-ruby) so
  // the Kumo Card popup still appears when hovering a word in the overlay.
}

/** Start synchronizing the transcript overlay with video playback time. */
function startTranscriptSync(): void {
  if (transcriptSyncRafId !== null) return
  if (!activeVideo || !transcriptData) return

  const video = activeVideo

  const sync = () => {
    if (!isActive || !transcriptOverlay || !transcriptData) {
      transcriptSyncRafId = null
      return
    }

    const currentTimeMs = video.currentTime * 1000
    const caption = getCaptionAtTime(transcriptData, currentTimeMs)

    if (caption && caption !== transcriptLastText) {
      transcriptLastText = caption
      updateOverlayText(caption)
    } else if (!caption && transcriptLastText) {
      // No caption at this time — fade out after a short delay
      transcriptLastText = ''
      hideOverlayText()
    }

    transcriptSyncRafId = requestAnimationFrame(sync)
  }

  transcriptSyncRafId = requestAnimationFrame(sync)
}

/** Update the overlay with new caption text and inject furigana. */
function updateOverlayText(text: string): void {
  if (!transcriptOverlay) return

  const span = transcriptOverlay.querySelector('.kumo-transcript-text') as HTMLElement
  if (!span) return

  // Don't re-process if text is identical
  if ((span.dataset.lastText || '') === text) return
  span.dataset.lastText = text

  // Clear and set new text
  span.textContent = text
  transcriptOverlay.style.opacity = '1'

  // Inject furigana into the overlay text
  try {
    processNodeBatch(span)
  } catch (e) {
    console.debug('Kumo: Error processing transcript overlay text', e)
  }

  // Check for unknown words (auto-pause)
  if (autoPauseEnabled && activeVideo && !activeVideo.paused) {
    if (checkForUnknownWord(text)) {
      activeVideo.pause()
      showAutoPauseToast(span)
    }
  }
}

/** Fade out the overlay when no caption is active. */
function hideOverlayText(): void {
  if (transcriptOverlay) {
    transcriptOverlay.style.opacity = '0'
  }
}

/** Clean up transcript overlay resources. */
function destroyTranscriptOverlay(): void {
  if (transcriptSyncRafId !== null) {
    cancelAnimationFrame(transcriptSyncRafId)
    transcriptSyncRafId = null
  }
  if (transcriptOverlay) {
    transcriptOverlay.remove()
    transcriptOverlay = null
  }
  transcriptData = null
  transcriptFetchAttempted = false
  transcriptLastText = ''
  clearTranscriptCache()
}

// ══════════════════════════════════════════════════════════════════════
// DOM-based caption detection — Fallback for when transcript API fails
// ══════════════════════════════════════════════════════════════════════

/** Platform with known container selectors: watch for the container, then hook captions. */
function initSelectorBased(platform: CaptionPlatform): void {
  bodyObserver = new MutationObserver(() => {
    for (const selector of platform.containerSelectors) {
      const container = document.querySelector(selector)
      if (container && !container.getAttribute('data-kl-captions')) {
        container.setAttribute('data-kl-captions', 'true')
        hookCaptionContainer(container, platform.captionSelectors)
        return
      }
    }
  })

  bodyObserver.observe(document.body, { childList: true, subtree: true })

  // Also check immediately
  for (const selector of platform.containerSelectors) {
    const existing = document.querySelector(selector)
    if (existing && !existing.getAttribute('data-kl-captions')) {
      existing.setAttribute('data-kl-captions', 'true')
      hookCaptionContainer(existing, platform.captionSelectors)
      return
    }
  }
}

/** Platform with dynamic DOM (Netflix, etc.): watch for Japanese text near the video element. */
function initProximityBased(): void {
  if (!activeVideo) {
    // Video element not found yet — watch for it
    bodyObserver = new MutationObserver(() => {
      const video = document.querySelector('video')
      if (video) {
        activeVideo = video
        bodyObserver?.disconnect()
        watchVideoProximity(video)
      }
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })
    return
  }

  watchVideoProximity(activeVideo)
}

/** Watch the area around a video element for Japanese text appearing (captions). */
function watchVideoProximity(video: HTMLVideoElement): void {
  // Find the video player's container: walk up past simple wrappers,
  // looking for an element with a significant number of children (the player UI).
  // On Netflix, the video is typically inside a player container 2-4 levels up.
  let target: Element | null = video.parentElement
  for (let i = 0; i < 6 && target; i++) {
    // A player container usually has many child elements (controls, overlays, captions)
    if (target.children.length >= 3 || target.querySelectorAll('span, div').length > 10) break
    target = target.parentElement
  }
  // Fallback: if we reached the top without finding a good container,
  // use the closest ancestor that isn't body
  if (!target || target === document.body || target === document.documentElement) {
    target = video.parentElement || document.body
  }

  captionObserver = new MutationObserver((mutations) => {
    if (!isActive) return

    // Handle characterData mutations: clear data-kl-caption so
    // elements whose text changed get re-processed with fresh furigana.
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const target = mutation.target as Text | null
        const parent = target?.parentElement
        if (parent) {
          parent.removeAttribute('data-kl-caption')
        }
      }
    }

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          if (el.hasAttribute('data-kl-caption')) continue
          if (!containsJapanese(el.textContent || '')) continue

          // Process only the leaf-level caption spans — NOT the container.
          // This avoids double-processing since processNodeBatch(el) on the
          // container would walk all children anyway.
          const textSpans = el.querySelectorAll('span')
          let anyProcessed = false
          for (const span of textSpans) {
            if (span.hasAttribute('data-kl-caption')) continue
            if (containsJapanese(span.textContent || '')) {
              span.setAttribute('data-kl-caption', 'true')
              try {
                processNodeBatch(span as HTMLElement)
                handleAutoPause(span as HTMLElement)
              } catch (e) {
                console.debug('Kumo: Error processing proximity caption', e)
              }
              anyProcessed = true
            }
          }
          // If no child spans had Japanese (maybe it's a bare text element),
          // process the element itself
          if (!anyProcessed) {
            el.setAttribute('data-kl-caption', 'true')
            try {
              processNodeBatch(el)
              handleAutoPause(el)
            } catch (e) {
              console.debug('Kumo: Error processing proximity caption', e)
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement
          if (parent && !parent.hasAttribute('data-kl-caption')
              && containsJapanese(node.textContent || '')) {
            parent.setAttribute('data-kl-caption', 'true')
            try {
              processNodeBatch(parent)
              handleAutoPause(parent)
            } catch (e) {
              console.debug('Kumo: Error processing proximity caption text', e)
            }
          }
        }
      }
    }
  })

  captionObserver.observe(target, { childList: true, subtree: true, characterData: true })

  // Also scan existing text (with a safety cap)
  scanExistingInContainer(target)
}

/** Scan an existing container for Japanese text to process immediately.
 *  Safety-capped to prevent freezing the page on large containers. */
function scanExistingInContainer(container: Element): void {
  // Cap at 300 text nodes to avoid expensive full-page walks
  const MAX_TEXT_NODES = 300
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const toProcess = new Set<Element>()
  let node: Text | null
  let scanned = 0
  while ((node = walker.nextNode() as Text | null) && scanned < MAX_TEXT_NODES) {
    scanned++
    if (containsJapanese(node.textContent || '')) {
      const parent = node.parentElement
      if (parent && !parent.hasAttribute('data-kl-caption')) {
        toProcess.add(parent)
      }
    }
  }
  for (const el of toProcess) {
    el.setAttribute('data-kl-caption', 'true')
    processNodeBatch(el)
  }
}

function hookCaptionContainer(container: Element, captionSelectors: string[]): void {
  captionObserver = new MutationObserver((mutations) => {
    if (!isActive) return

    // First pass: clear data-kl-caption on elements whose text changed
    // This ensures furigana is re-applied when captions update in-place.
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const target = mutation.target as Text | null
        const parent = target?.parentElement
        if (parent) {
          parent.removeAttribute('data-kl-caption')
          // Also clear on any parent caption-node to force full re-process
          const captionNode = parent.closest?.(captionSelectors.join(','))
          if (captionNode) captionNode.removeAttribute('data-kl-caption')
        }
      } else if (mutation.type === 'childList') {
        // If old nodes are removed, their children might have data-kl-caption
        // that will be stale — re-process newly added nodes
        for (const removed of mutation.removedNodes) {
          if (removed.nodeType === Node.ELEMENT_NODE) {
            (removed as Element).querySelectorAll?.('[data-kl-caption]').forEach(el => {
              el.removeAttribute('data-kl-caption')
            })
          }
        }
      }
    }

    for (const selector of captionSelectors) {
      const segments = container.querySelectorAll(selector)
      for (const segment of segments) {
        const el = segment as HTMLElement
        if (el.hasAttribute('data-kl-caption')) continue
        el.setAttribute('data-kl-caption', 'true')

        if (containsJapanese(el.textContent || '')) {
          try {
            processNodeBatch(el)
            handleAutoPause(el)
          } catch (e) {
            console.debug('Kumo: Error processing caption segment', e)
          }
        }
      }
    }
  })

  captionObserver.observe(container, { childList: true, subtree: true, characterData: true })
}

function handleAutoPause(el: HTMLElement): void {
  if (autoPauseEnabled && activeVideo && !activeVideo.paused) {
    const hasUnknownWord = checkForUnknownWord(el.textContent || '')
    if (hasUnknownWord) {
      activeVideo.pause()
      showAutoPauseToast(el)
    }
  }
}

export function disableYouTubeIntegration(): void {
  isActive = false
  autoPauseEnabled = false
  activeVideo = null
  activePlatform = null
  disableDualSubtitles()
  destroyTranscriptOverlay()
  stopUrlMonitoring()
  if (captionObserver) {
    captionObserver.disconnect()
    captionObserver = null
  }
  if (bodyObserver) {
    bodyObserver.disconnect()
    bodyObserver = null
  }
  if (videoObserver) {
    videoObserver.disconnect()
    videoObserver = null
  }
}

/** Check if integration is active on any supported platform. */
export function isYouTubeActive(): boolean {
  return isActive
}

/** Get the active platform name (for UI display). */
export function getActivePlatformName(): string {
  return activePlatform?.name || ''
}

function checkForUnknownWord(text: string): boolean {
  // Quick check: any kanji-containing word that isn't marked as known
  const words = text.match(/[\u4e00-\u9fff]+/g)
  if (!words) return false
  return words.some(w => {
    // Check if any kanji in the word is unknown
    return [...w].some(c => !isKnownSync(c) && !isKnownSync(w))
  })
}

let autoPauseToast: HTMLElement | null = null

function showAutoPauseToast(element: Element): void {
  if (autoPauseToast) autoPauseToast.remove()

  autoPauseToast = document.createElement('div')
  autoPauseToast.className = 'kumo-autopause-toast'
  autoPauseToast.textContent = '⏸ Paused for unknown word'
  autoPauseToast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(232, 160, 0, 0.9);
    color: #000;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-family: system-ui, sans-serif;
    z-index: 2147483647;
    pointer-events: none;
    animation: kumo-fadein 0.3s ease-out;
  `
  document.body.appendChild(autoPauseToast)

  setTimeout(() => {
    autoPauseToast?.remove()
    autoPauseToast = null
  }, 2500)
}

export async function setAutoPause(enabled: boolean): Promise<void> {
  autoPauseEnabled = enabled
  if (!enabled && activeVideo?.paused) {
    // Don't auto-resume — user might want to study the word
  }
}

// ── YouTube SPA navigation detection ──
// YouTube is a single-page app: navigating between videos doesn't reload the page,
// so we need to watch for URL changes to reset the transcript cache and re-init.

let lastVideoId: string | null = null
let urlCheckInterval: ReturnType<typeof setInterval> | null = null

function startUrlMonitoring(): void {
  if (urlCheckInterval) return
  lastVideoId = getYouTubeVideoId()
  urlCheckInterval = setInterval(checkVideoChange, 2000)
}

function stopUrlMonitoring(): void {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval)
    urlCheckInterval = null
  }
}

function checkVideoChange(): void {
  const currentId = getYouTubeVideoId()
  if (currentId && currentId !== lastVideoId) {
    const capturedId = currentId
    lastVideoId = capturedId
    if (isActive && activePlatform?.name === 'YouTube') {
      clearTranscriptCache()
      transcriptFetchAttempted = false
      destroyTranscriptOverlay()
      // Re-trigger transcript overlay for the new video
      if (isYouTubeWatchPage()) {
        initTranscriptOverlay().then(loaded => {
          // Guard: only apply if we're still on the same video
          if (lastVideoId !== capturedId) return
          if (!loaded && activePlatform) {
            initSelectorBased(activePlatform)
          }
        })
      }
    }
  }
}
