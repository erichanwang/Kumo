// Keyboard shortcut handler for Kumo
// Toggle furigana, mark known, save words from keyboard

import { getSettings, saveSettings, markKnown, saveWord } from '../lib/storage'
import { lookupWord } from '../lib/dictionary'
import { disconnectObserver } from './observer'
import { initObserver } from './observer'
import { containsJapanese } from './parser'
import { processNodeBatch } from './furigana'
import { playClickSound } from '../lib/audio'

interface ShortcutState {
  lastHoveredWord: string
  lastHoveredReading: string
}

const state: ShortcutState = {
  lastHoveredWord: '',
  lastHoveredReading: ''
}

export function initKeyboardShortcuts(): void {
  // Track the last hovered word for shortcuts
  document.addEventListener('mouseover', (e) => {
    const target = e.target as Element
    const el = target.closest?.('.kanjilens-ruby') || target.closest?.('.kanjilens-kana')
    if (el) {
      state.lastHoveredWord = el.getAttribute('data-word') || ''
      state.lastHoveredReading = el.getAttribute('data-reading') || ''
    }
  }, true)

  // Main keyboard shortcut handler
  // NOTE: Alt+J/K/S/R shortcuts are registered as chrome.commands in manifest.json.
  // The background service worker dispatches CMD_* messages for those.
  // The keydown handler below is kept for mine-sentence (Alt+M) which needs
  // direct DOM access, and as a fallback for when the content script loads
  // before chrome.commands are ready.
  // To avoid double-firing, we check if the action was already handled by CMD_* message.
  document.addEventListener('keydown', async (e: KeyboardEvent) => {
    // Alt+M: Mine sentence (not a chrome.command — needs direct DOM access)
    if (e.altKey && e.key === 'm') {
      e.preventDefault()
      // This is handled by the sentence mining system
      // Dispatch a custom event that sentence.ts listens to
      if (state.lastHoveredWord) {
        const target = document.querySelector(
          `ruby.kanjilens-ruby[data-word="${CSS.escape(state.lastHoveredWord)}"]`
        )
        if (target) {
          document.dispatchEvent(new CustomEvent('kumo-mine-sentence', {
            detail: { word: state.lastHoveredWord, element: target }
          }))
        }
      }
    }

    // Alt+R: Open SRS review — handled by chrome.commands, no local handler needed
  })

  console.log('Kumo: Keyboard shortcuts initialized (Alt+J/K/S/M/R)')

  // Listen for background command dispatches
  // Background service worker sends these when chrome.commands fire
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'CMD_TOGGLE_FURIGANA':
        toggleFurigana()
        break
      case 'CMD_MARK_KNOWN':
        markLastHoveredKnown()
        break
      case 'CMD_SAVE_WORD':
        saveLastHoveredWord()
        break
    }
  })
}

async function toggleFurigana(): Promise<void> {
  const settings = await getSettings()
  settings.furiganaEnabled = !settings.furiganaEnabled
  await saveSettings(settings)

  if (settings.furiganaEnabled) {
    initObserver()
    if (containsJapanese(document.body.textContent || '')) {
      processNodeBatch(document.body)
    }
  } else {
    disconnectObserver()
    removeAllFuriganaLocal()
  }
}

async function markLastHoveredKnown(): Promise<void> {
  if (!state.lastHoveredWord) return
  const dictEntry = lookupWord(state.lastHoveredWord)
  await markKnown(state.lastHoveredWord, {
    reading: dictEntry?.reading || state.lastHoveredReading,
    definitions: dictEntry?.definitions || [],
    jlpt: dictEntry?.jlpt || null
  })
  playClickSound()
  updateRubyStyles(state.lastHoveredWord, true)
}

async function saveLastHoveredWord(): Promise<void> {
  if (!state.lastHoveredWord) return
  const dictEntry = lookupWord(state.lastHoveredWord)
  await saveWord({
    word: state.lastHoveredWord,
    reading: dictEntry?.reading || state.lastHoveredReading,
    definitions: dictEntry?.definitions || [],
    jlpt: dictEntry?.jlpt || null,
    savedAt: Date.now(),
    sourceUrl: window.location.href,
    known: false,
    starred: true,
    seenCount: 1
  })
  playClickSound()
}

// Reuse removeAllFurigana from index.ts via dynamic import to avoid duplication
// The inline definition is kept as a fallback for when index.ts hasn't initialized
function removeAllFuriganaLocal(): void {
  document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
    const rb = ruby.querySelector('rb')
    if (rb) {
      const textNode = document.createTextNode(rb.textContent || '')
      ruby.parentNode?.replaceChild(textNode, ruby)
    }
  })
  document.querySelectorAll('[data-kl-processed]').forEach(el => {
    el.removeAttribute('data-kl-processed')
  })
}

function updateRubyStyles(word: string, known: boolean): void {
  document.querySelectorAll(`ruby.kanjilens-ruby[data-word="${CSS.escape(word)}"] rt`).forEach(rt => {
    rt.className = known ? 'kanjilens-rt-known' : 'kanjilens-rt-new'
  })
}

