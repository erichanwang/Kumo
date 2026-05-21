// Content script entry point for Kumo
// Initializes all subsystems when injected into a page

import { initParser, containsJapanese } from './parser'
import { processNodeBatch, setKatakanaFuriganaEnabled, setFuriganaRomaji, applyFuriganaRomaji, isKatakanaOnly, setHideKnownFurigana, setFuriganaSize, setShowNumberFurigana, isAllNumerals } from './furigana'
import { initPopupSystem } from './popup'
import { initObserver, disconnectObserver } from './observer'
import { initYouTubeIntegration, disableYouTubeIntegration, setAutoPause } from './youtube'
import { initDualSubtitles, disableDualSubtitles } from './dual-subs'
import { refreshKnownCache, getSettings, saveSettings, isKnownSync, Settings } from '../lib/storage'
import { injectStyles, removeStyles, updateFuriganaColor } from './styles'
import { setApiLookupsPaused } from '../lib/api-dictionary'
import { initKeyboardShortcuts } from './keyboard'
import { startSession, endSession, trackPageVisit, updateStreak } from '../lib/progress'
import { shouldShowOnboarding, createOnboardingHTML, injectOnboardingStyles, initOnboarding } from './onboarding'

async function init(): Promise<void> {
  const settings = await getSettings()
  if (!settings.furiganaEnabled) return

  // ── Phase 1: Critical path — furigana must appear ASAP ──
  injectStyles()
  await refreshKnownCache()

  // Apply all visual preferences immediately
  setKatakanaFuriganaEnabled(settings.showKatakanaFurigana)
  setFuriganaRomaji(settings.showRomaji)
  setHideKnownFurigana(settings.hideKnownFurigana)
  setShowNumberFurigana(settings.showNumberFurigana)
  setApiLookupsPaused(settings.offlineMode)
  setFuriganaSize(settings.furiganaSize || 'medium')
  document.documentElement.style.setProperty('--kumo-card-opacity', String(settings.cardOpacity ?? 1.0))

  // Initialize the parser (Kuromoji) — show a loading indicator
  showLoadingBadge()
  await initParser()
  hideLoadingBadge()

  // Process existing page content immediately
  if (containsJapanese(document.body.textContent || '')) {
    processNodeBatch(document.body)
  }

  // Watch for new content
  initObserver()

  // ── Phase 2: Deferred — non-critical subsystems ──
  // Defer everything that doesn't affect whether furigana appears so the
  // page renders with readings visible as fast as possible.
  setTimeout(() => {
    initPopupSystem()
    initKeyboardShortcuts()

    // Video caption integration
    if (settings.youtubeEnabled) {
      initYouTubeIntegration()
    }

    // First-run onboarding
    shouldShowOnboarding().then(show => {
      if (show) {
        injectOnboardingStyles()
        document.body.insertAdjacentHTML('beforeend', createOnboardingHTML())
        initOnboarding()
      }
    }).catch(() => {})

    // Session tracking
    startSession()
    trackPageVisit(window.location.hostname)
    updateStreak().catch(() => {})
  }, 0)

  // Listen for storage changes (e.g., showRomaji toggled in popup without a message)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue) {
      const oldVal = (changes.settings.oldValue as Settings | undefined)?.showRomaji
      const newVal = (changes.settings.newValue as Settings).showRomaji
      if (oldVal !== newVal) setFuriganaRomaji(newVal)
    }
  })

  // Listen for settings changes from popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'TOGGLE_FURIGANA': {
          const enabled = message.enabled
          if (enabled) {
            injectStyles()
            await refreshKnownCache()
            initObserver()
            if (containsJapanese(document.body.textContent || '')) {
              processNodeBatch(document.body)
            }
          } else {
            disconnectObserver()
            removeAllFurigana()
            removeStyles()
          }
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_YOUTUBE': {
          if (message.enabled) {
            initYouTubeIntegration()
          } else {
            disableYouTubeIntegration()
          }
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_AUTO_PAUSE': {
          setAutoPause(message.enabled)
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_DUAL_SUBS': {
          if (message.enabled) {
            initDualSubtitles()
          } else {
            disableDualSubtitles()
          }
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_ROMAJI': {
      setFuriganaRomaji(message.enabled)
      sendResponse({ success: true })
      break
    }        case 'TOGGLE_NUMBER_FURIGANA': {
          setShowNumberFurigana(message.enabled)
          // Remove existing numeral-only rubies to prevent duplication on re-process
          document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
            const surface = ruby.querySelector('rb')?.textContent || ''
            if (isAllNumerals(surface)) {
              const textNode = document.createTextNode(surface)
              ruby.parentNode?.replaceChild(textNode, ruby)
            }
          })
          // Strip processed markers so numerals in those containers get re-evaluated
          document.querySelectorAll('[data-kl-processed]').forEach(el => {
            el.removeAttribute('data-kl-processed')
          })
          if (containsJapanese(document.body.textContent || '')) {
            processNodeBatch(document.body)
          }
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_KATAKANA_FURIGANA': {
          setKatakanaFuriganaEnabled(message.enabled)
          // Re-process if furigana is currently visible so katakana appears/disappears
          if (message.enabled) {
            if (containsJapanese(document.body.textContent || '')) {
              // Strip existing processed markers so nodes get re-evaluated
              document.querySelectorAll('[data-kl-processed]').forEach(el => {
                el.removeAttribute('data-kl-processed')
              })
              processNodeBatch(document.body)
            }
          } else {
            // Remove katakana-only ruby tags (keep kanji ones)
            document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
              const word = ruby.getAttribute('data-word') || ''
              if (isKatakanaOnly(word)) {
                const rb = ruby.querySelector('rb')
                if (rb) {
                  const textNode = document.createTextNode(rb.textContent || '')
                  ruby.parentNode?.replaceChild(textNode, ruby)
                }
              }
            })
          }
          sendResponse({ success: true })
          break
        }
        case 'REFRESH_KNOWN_CACHE': {
          await refreshKnownCache()
          refreshRubyStyles()
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_HIDE_KNOWN': {
          setHideKnownFurigana(message.enabled)
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_OFFLINE': {
          setApiLookupsPaused(message.enabled)
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_AUDIO': {
          // Audio playback is handled in the content popup module.
          // The setting is saved in storage; the content popup listens
          // to storage changes to pick up the new value.
          sendResponse({ success: true })
          break
        }
        case 'TOGGLE_POPUP_CARD': {
          // Handled in content/popup.ts via storage listener
          sendResponse({ success: true })
          break
        }
        case 'UPDATE_FURIGANA_COLOR': {
          updateFuriganaColor(message.color || '#e8a000')
          sendResponse({ success: true })
          break
        }
        case 'UPDATE_FURIGANA_SIZE': {
          setFuriganaSize(message.size || 'medium')
          sendResponse({ success: true })
          break
        }
        case 'UPDATE_CARD_OPACITY': {
          document.documentElement.style.setProperty('--kumo-card-opacity', String(message.opacity ?? 0.50))
          sendResponse({ success: true })
          break
        }
        case 'UPDATE_SRS_DAY_LIMIT': {
          // SRS daily limit is read from storage in the SRS page
          sendResponse({ success: true })
          break
        }
        case 'RESET_SETTINGS': {
          // Reload all settings from storage and re-apply
          const resetSettings = await getSettings()
          setFuriganaRomaji(resetSettings.showRomaji)
          setKatakanaFuriganaEnabled(resetSettings.showKatakanaFurigana)
          setHideKnownFurigana(resetSettings.hideKnownFurigana)
          setApiLookupsPaused(resetSettings.offlineMode)
          setFuriganaSize(resetSettings.furiganaSize || 'medium')
          setShowNumberFurigana(resetSettings.showNumberFurigana)
          updateFuriganaColor(resetSettings.furiganaColor || '#e8a000')
          document.documentElement.style.setProperty('--kumo-card-opacity', String(resetSettings.cardOpacity ?? 1.0))
          sendResponse({ success: true })
          break
        }
        default:
          sendResponse({ success: false, error: 'Unknown message' })
      }
    })()
    return true // Keep message channel open for async cases
  })
}

function removeAllFurigana(): void {
  // Remove all ruby tags and restore text
  document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
    const rb = ruby.querySelector('rb')
    if (rb) {
      const textNode = document.createTextNode(rb.textContent || '')
      ruby.parentNode?.replaceChild(textNode, ruby)
    }
  })
  // Remove data attributes
  document.querySelectorAll('[data-kl-processed]').forEach(el => {
    el.removeAttribute('data-kl-processed')
  })
}

function refreshRubyStyles(): void {
  document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
    const word = ruby.getAttribute('data-word') || ''
    const rt = ruby.querySelector('rt')
    if (rt && word) {
      rt.className = isKnownSync(word) ? 'kanjilens-rt-known' : 'kanjilens-rt-new'
    }
  })
}



// --- Loading Badge ---

let loadingBadge: HTMLElement | null = null

function showLoadingBadge(): void {
  if (document.getElementById('kumo-loading-badge')) return
  const badge = document.createElement('div')
  badge.id = 'kumo-loading-badge'
  badge.innerHTML = '<span class="kumo-loading-dot"></span> Kumo: Loading dictionaries…'
  badge.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(26, 26, 46, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #ccc;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-family: -apple-system, 'Segoe UI', 'Hiragino Sans', sans-serif;
    z-index: 2147483647;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    animation: kumo-badge-fadein 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  `
  document.body.appendChild(badge)
  loadingBadge = badge

  // Add ghost/shimmer animation keyframe if not already present
  if (!document.getElementById('kumo-loading-keyframes')) {
    const kf = document.createElement('style')
    kf.id = 'kumo-loading-keyframes'
    kf.textContent = `
      @keyframes kumo-badge-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes kumo-dot-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
      .kumo-loading-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #e8a000;
        animation: kumo-dot-pulse 1.2s ease-in-out infinite;
      }
    `
    document.head.appendChild(kf)
  }
}

function hideLoadingBadge(): void {
  if (loadingBadge) {
    loadingBadge.style.opacity = '0'
    loadingBadge.style.transition = 'opacity 0.4s'
    setTimeout(() => {
      loadingBadge?.remove()
      loadingBadge = null
    }, 400)
  }
}

// Track session end on page unload
// Using pagehide instead of beforeunload — pagehide is not blocked by
// Permissions-Policy: unload=() which some sites set to deter scrapers
window.addEventListener('pagehide', () => {
  disableYouTubeIntegration()
  endSession().catch(() => {})
})

// Track visibility changes for session time
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    endSession().catch(() => {})
  } else {
    startSession()
  }
})

init()