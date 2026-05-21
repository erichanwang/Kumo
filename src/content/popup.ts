// Kumo Card — hover-based word definition card system for Kumo
// Creates and manages a single reusable card element for word definitions

import { lookupWord, lookupKanji, lookupName, getNameReadingsForKanji, DictEntry, KanjiEntry, katakanaToHiragana } from '../lib/dictionary'
import { lookupWordWithApi, ApiDictEntry } from '../lib/api-dictionary'
import { isKnownSync, saveWord, markKnown, unmarkKnown, incrementSeenCount, getSettings, Settings } from '../lib/storage'
import { recordDailyEvent } from '../lib/progress'
import { extractSentenceContext, saveSentence } from '../lib/sentences'
import { addToSrs } from '../lib/srs'
import { trackWordLookup } from '../lib/progress'
import { playClickSound, playSuccessSound, playClickAudio, speakJapanese, isSpeechSupported } from '../lib/audio'
import { generateNumberAltReadings, containsNumerals } from '../lib/numbers'
import { hiraganaToRomaji } from '../lib/romaji'

/** Get a clean page title, stripping platform suffixes (YouTube, Netflix, etc.). */
function getCleanPageTitle(): string {
  const title = document.title
  const hostname = window.location.hostname
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return title.replace(/\s*-\s+YouTube\s*$/, '').trim()
  }
  if (hostname.includes('netflix.com')) {
    return title.replace(/\s*\|\s+Netflix\s*$/, '').trim()
  }
  return title
}

let popupEl: HTMLElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null
let currentWord: string = ''
let currentReading: string = ''
let showRomajiEnabled = false
let offlineModeEnabled = false
let autoPlayAudioEnabled = false
let showPopupCardEnabled = true
let cardOpacity = 1.0

// Timing constants for better hover UX
const SHOW_DELAY_MS = 300   // Delay before popup appears (prevents flash on accidental hover)
const HIDE_DELAY_MS = 500   // Delay before popup hides (gives time to reach popup with mouse)

export async function initPopupSystem(): Promise<void> {
  if (popupEl) return

  // Cache settings
  const settings = await getSettings()
  showRomajiEnabled = settings.showRomaji
  offlineModeEnabled = settings.offlineMode
  autoPlayAudioEnabled = settings.autoPlayAudio !== false // default on
  showPopupCardEnabled = settings.showPopupCard !== false
  cardOpacity = settings.cardOpacity ?? 1.0

  // Apply card opacity immediately
  document.documentElement.style.setProperty('--kumo-card-opacity', String(cardOpacity))

  popupEl = document.createElement('div')
  popupEl.className = 'kanjilens-popup'
  popupEl.style.display = 'none'
  popupEl.innerHTML = '<div class="kl-popup-content"></div>'
  document.body.appendChild(popupEl)

  // Show popup on hover
  popupEl.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  })

  popupEl.addEventListener('mouseleave', () => {
    scheduleHide()
  })

  // Event delegation for mouseover on ruby elements
  document.addEventListener('mouseover', onRubyHover, true)
  document.addEventListener('mouseout', onRubyOut, true)
  document.addEventListener('scroll', onScroll, true)

  // Listen for settings changes (e.g., toggles from popup)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      const newSettings = changes.settings.newValue as Settings | undefined
      if (newSettings) {
        showRomajiEnabled = newSettings.showRomaji
        offlineModeEnabled = newSettings.offlineMode
        autoPlayAudioEnabled = newSettings.autoPlayAudio !== false
        showPopupCardEnabled = newSettings.showPopupCard !== false
        cardOpacity = newSettings.cardOpacity ?? 1.0
        document.documentElement.style.setProperty('--kumo-card-opacity', String(cardOpacity))
      }
    }
  })
}

function onRubyHover(e: MouseEvent): void {
  const target = e.target as Element
  const el = target.closest?.('.kanjilens-ruby') || target.closest?.('.kanjilens-kana')
  if (!el) return

  // If popup card is disabled, don't show it
  if (!showPopupCardEnabled) {
    return
  }

  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  const word = el.getAttribute('data-word') || ''
  const reading = el.getAttribute('data-reading') || ''
  const posType = el.getAttribute('data-pos') || ''
  const posDetail = el.getAttribute('data-pos-detail') || ''

  if (word === currentWord) {
    return
  }

  // Add a brief delay before showing to prevent flash on fast sweeping
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  showTimer = setTimeout(() => {
    showPopup(el as HTMLElement, word, reading, posType, posDetail)
    showTimer = null
  }, SHOW_DELAY_MS)
}

function onRubyOut(e: MouseEvent): void {
  const target = e.target as Element
  const el = target.closest?.('.kanjilens-ruby') || target.closest?.('.kanjilens-kana')
  if (!el) return

  // Don't hide if mouse moved to another ruby/kana element or to the popup itself.
  // Without this check, mouseout bubbling from child elements inside the ruby
  // (e.g. moving from <rb> to <rt>) would trigger scheduleHide, and onRubyHover
  // would return early (same currentWord), leaving the hide timer to fire after 500ms.
  const related = e.relatedTarget
  if (related && typeof (related as Element).closest === 'function') {
    const relatedEl = related as Element
    if (relatedEl.closest('.kanjilens-ruby') || relatedEl.closest('.kanjilens-kana') || relatedEl.closest('.kanjilens-popup')) {
      return
    }
  }

  scheduleHide()
}

function showPopup(anchor: HTMLElement, word: string, reading: string, posType?: string, posDetail?: string): void {
  if (!popupEl) return
  currentWord = word
  currentReading = reading

  // Check if this is a proper noun (name) from kuromoji
  const isProperNoun = posType === '固有名詞'
  const nameType = isProperNoun ? getNameTypeLabel(posDetail || '') : null

  // Lookup the word locally
  let dictEntry = lookupWord(word)
  const kanjiEntry = word.length === 1 ? lookupKanji(word) : null
  const nameEntry = lookupName(word)

  // For words with multiple kanji, build component kanji entries
  const componentKanji: KanjiEntry[] = []
  if (word.length > 1) {
    for (const ch of word) {
      if (/[\u4E00-\u9FFF]/.test(ch)) {
        const k = lookupKanji(ch)
        if (k) componentKanji.push(k)
      }
    }
  }

  // For katakana-only words (loanwords), try hiragana conversion
  const isKatakanaOnly = /^[\u30A1-\u30FF]+$/.test(word)
  if (!dictEntry && isKatakanaOnly) {
    const hiraganaForm = katakanaToHiragana(word)
    dictEntry = lookupWord(hiraganaForm)
  }

  // Generate number-based alternative readings (e.g. 四月→よんげつ)
  const numberAltReadings: string[] = containsNumerals(word)
    ? generateNumberAltReadings(word, reading)
    : []

  const content = popupEl.querySelector('.kl-popup-content')
  if (!content) return

  // For proper nouns without a local dict entry, show name info
  if (isProperNoun && !dictEntry) {
    content.innerHTML = buildNamePopupHTML(word, reading, nameType, nameEntry)
  } else if (dictEntry || kanjiEntry) {
    content.innerHTML = buildPopupHTML(word, reading, dictEntry, kanjiEntry, nameType, componentKanji, numberAltReadings, [])
  } else if (reading) {
    content.innerHTML = buildBasicPopupHTML(word, reading)
  } else {
    return // Nothing to show
  }

  // Bind button handlers
  bindPopupButtons(word, reading)

  // Position popup
  positionPopup(anchor)

  popupEl.style.display = 'block'

  // Play click sound when popup opens
  playClickAudio()

  // Auto-play audio for the word on hover (uses Web Speech API)
  if (autoPlayAudioEnabled && isSpeechSupported()) {
    const pronounceWord = reading || dictEntry?.reading || ''
    if (pronounceWord) {
      speakJapanese(pronounceWord).catch(() => {/* ignore */})
    }
  }

  // Increment seen count
  incrementSeenCount(word).catch(() => {})
  trackWordLookup()
  recordDailyEvent({ type: 'wordsLookedUp' }).catch(() => {})

  // Async API lookup for better definitions (non-blocking)
  // Only do this if offline mode is not enabled
  if (!offlineModeEnabled) {
    // Show a subtle loading indicator immediately
    if (!dictEntry) {
      const loadingEl = content.querySelector('.kl-api-loading')
      if (!loadingEl) {
        const loadDiv = document.createElement('div')
        loadDiv.className = 'kl-api-loading'
        loadDiv.textContent = 'Searching Jisho.org...'
        content.appendChild(loadDiv)
      }
    }
    lookupWordWithApi(word).then(apiEntry => {
      if (!apiEntry || !popupEl || currentWord !== word) return
      updatePopupWithApiData(apiEntry)
    }).catch(() => {/* ignore */})
  }
}

/** Get a simple label for a proper noun type from kuromoji POS detail. */
function getNameTypeLabel(detail: string): string | null {
  switch (detail) {
    case '姓': return 'Surname'
    case '名': return 'Given Name'
    case '人名': return 'Name'
    case '地名': return 'Place'
    case '組織名': case '会社名': case '団体名': return 'Organization'
    default: return 'Name'
  }
}

/** Build popup HTML for a proper noun (name) without a dictionary entry. */
function buildNamePopupHTML(word: string, reading: string, nameType: string | null, nameEntry?: { reading: string; type: string; meaning: string } | null): string {
  const known = isKnownSync(word)
  const displayType = nameType === 'Surname' ? 'Surname' : (nameType || 'Name')
  const typeLabel = `<span class="kl-proper-noun-badge">${displayType}</span>`

  return `<div class="kl-popup-header">
    <span class="kl-word">${word}</span>
    <span class="kl-reading">${reading}</span>
    ${typeLabel}
  </div>
  <div class="kl-name-notice">
    This is a ${displayType.toLowerCase()}. Add a custom definition below.
  </div>
  <div class="kl-name-input-row">
    <input class="kl-name-input" type="text" placeholder="Enter a description (e.g. 'Japanese surname')" />
    <button class="kl-btn kl-name-save-btn" data-action="save-name">Save</button>
  </div>
  <div class="kl-status-row">
    ${known ? '<span class="kl-status-badge kl-status-known">✓ Known</span>' : ''}
  </div>
  <div class="kl-actions">
    <button class="kl-btn kl-save" data-action="save">⭐ Save</button>
    <button class="kl-btn ${known ? 'kl-known-active' : 'kl-known'}" data-action="known">✓ ${known ? 'Known' : 'I know this'}</button>
  </div>  ${known ? `<div class="kl-actions-secondary">
    <button class="kl-btn kl-unmark" data-action="unmark">↩ Unmark known</button>
  </div>` : ''}
`
}

function buildBasicPopupHTML(word: string, reading: string): string {
  const known = isKnownSync(word)
  return `<div class="kl-popup-header">
    <span class="kl-word">${word}</span>
    <span class="kl-reading">${reading}</span>
  </div>
  <div class="kl-status-row">
    ${known ? '<span class="kl-status-badge kl-status-known">✓ Known</span>' : ''}
  </div>
  <div class="kl-actions">
    <button class="kl-btn kl-save" data-action="save">⭐ Save</button>
    <button class="kl-btn ${known ? 'kl-known-active' : 'kl-known'}" data-action="known">✓ ${known ? 'Known' : 'I know this'}</button>
  </div>  ${known ? `<div class="kl-actions-secondary">
    <button class="kl-btn kl-unmark" data-action="unmark">↩ Unmark known</button>
  </div>` : ''}
`
}

function buildPopupHTML(
  word: string,
  reading: string,
  dictEntry: DictEntry | null,
  kanjiEntry: KanjiEntry | null,
  nameType?: string | null,
  componentKanji?: KanjiEntry[],
  numberAltReadings?: string[],
  altReadings?: string[]
): string {
  const jlpt = dictEntry?.jlpt || kanjiEntry?.jlpt || null
  const known = isKnownSync(word)
  const displayReading = reading || dictEntry?.reading || ''

  const romaji = showRomajiEnabled ? hiraganaToRomaji(displayReading) : ''

  let html = `<div class="kl-popup-header">
    <span class="kl-word">${word}</span>
    <span class="kl-reading">${displayReading}</span>
    ${romaji ? `<span class="kl-romaji">(${romaji})</span>` : ''}
    ${jlpt ? `<span class="kl-jlpt kl-jlpt-${jlpt.toLowerCase()}">JLPT ${jlpt}</span>` : ''}
    ${nameType ? `<span class="kl-proper-noun-badge">${nameType}</span>` : ''}
  </div>`

  // Number-based alternative readings (e.g. 四月 → also: よんげつ, しげつ)
  if (numberAltReadings && numberAltReadings.length > 0) {
    html += `<div class="kl-number-alt-readings">
      <span class="kl-label">Alt:</span> ${numberAltReadings.join(', ')}
    </div>`
  }

  // Alternate readings from Jisho API (e.g. 上手 → うわて, かみて)
  if (altReadings && altReadings.length > 0) {
    html += `<div class="kl-alt-readings">
      <span class="kl-label">Also read as:</span>
      ${altReadings.filter(r => r !== reading).join(', ')}
    </div>`
  }

  if (dictEntry) {
    html += `<div class="kl-definitions">
      ${dictEntry.definitions.slice(0, 3).map((d: string) => d).join(', ')}
    </div>`
  }

  // Single kanji entry: show on/kun/nanori readings
  if (kanjiEntry) {
    if (kanjiEntry.on.length > 0) {
      html += `<div class="kl-kanji-readings">
        <span class="kl-label">On:</span> ${kanjiEntry.on.slice(0, 3).join(', ')}
      </div>`
    }
    if (kanjiEntry.kun.length > 0) {
      html += `<div class="kl-kanji-readings">
        <span class="kl-label">Kun:</span> ${kanjiEntry.kun.slice(0, 3).map(k => k.replace(/\./g, '')).join(', ')}
      </div>`
    }
    if (kanjiEntry.nanori.length > 0) {
      html += `<div class="kl-kanji-readings">
        <span class="kl-label">Nanori:</span> <span class="kl-name-reading">${kanjiEntry.nanori.join(', ')}</span>
      </div>`
    }
    if (kanjiEntry.strokes) {
      html += `<div class="kl-kanji-readings">
        <span class="kl-label">Strokes:</span> ${kanjiEntry.strokes}
      </div>`
    }
  }

  // Component kanji readings for multi-kanji words (compact, in red for name readings)
  if (componentKanji && componentKanji.length > 0) {
    const parts = componentKanji.map(k => {
      const onStr = k.on.length > 0 ? k.on.join(', ') : ''
      const kunStr = k.kun.length > 0 ? k.kun.map(ku => ku.replace(/\./g, '')).join(', ') : ''
      const nanoriStr = k.nanori.length > 0 ? k.nanori.join(', ') : ''
      const allReadings = [onStr, kunStr, nanoriStr].filter(Boolean).join(' · ')
      return `<div class="kl-comp-kanji">
        <span class="kl-word">${k.kanji}</span>
        ${allReadings ? `<span class="kl-name-reading">${allReadings}</span>` : ''}
      </div>`
    }).join('')
    html += `<div class="kl-reading-section">
      <span class="kl-label">Kanji readings:</span>
      ${parts}
    </div>`
  }

  // Word status row — shown when word has history
  html += `<div class="kl-status-row">
    ${known ? '<span class="kl-status-badge kl-status-known">✓ Known</span>' : ''}
  </div>`

  // Primary actions row
  html += `<div class="kl-actions">
    <button class="kl-btn kl-save" data-action="save">⭐ Save</button>
    <button class="kl-btn kl-srs" data-action="srs">🔄 Study</button>
    <button class="kl-btn ${known ? 'kl-known-active' : 'kl-known'}" data-action="known">✓ ${known ? 'Known' : 'I know this'}</button>
    <button class="kl-btn kl-sentence" data-action="sentence">📝 Mine</button>
  </div>`

  // Utility actions row — unmark (only shown when known)
  html += known ? `<div class="kl-actions-secondary">
    <button class="kl-btn kl-unmark" data-action="unmark">↩ Unmark known</button>
  </div>` : ''

  return html
}

function bindPopupButtons(word: string, reading: string): void {
  if (!popupEl) return

  popupEl.querySelector('[data-action="save"]')?.addEventListener('click', async () => {
    const dictEntry = lookupWord(word)
    await saveWord({
      word,
      reading: dictEntry?.reading || reading,
      definitions: dictEntry?.definitions || [],
      jlpt: dictEntry?.jlpt || null,
      savedAt: Date.now(),
      sourceUrl: window.location.href,
      known: false,
      starred: true,
      seenCount: 1
    })
    // Show feedback
    playSuccessSound()
    const btn = popupEl?.querySelector('[data-action="save"]')
    if (btn) btn.textContent = '⭐ Saved!'
    setTimeout(() => {
      if (btn) btn.textContent = '⭐ Save'
    }, 1500)
  })

  popupEl.querySelector('[data-action="save-name"]')?.addEventListener('click', async () => {
    const input = popupEl?.querySelector('.kl-name-input') as HTMLInputElement
    const description = input?.value?.trim() || ''
    await saveWord({
      word,
      reading,
      definitions: description ? [description] : ['(proper noun)'],
      jlpt: null,
      savedAt: Date.now(),
      sourceUrl: window.location.href,
      known: false,
      starred: true,
      seenCount: 1
    })
    playSuccessSound()
    const btn = popupEl?.querySelector('[data-action="save-name"]')
    if (btn) btn.textContent = '✅ Saved!'
    setTimeout(() => {
      if (btn) btn.textContent = 'Save'
    }, 2000)
  })

  // Enter key in name input saves immediately
  popupEl.querySelector('.kl-name-input')?.addEventListener('keydown', async (e: Event) => {
    const ke = e as KeyboardEvent
    if (ke.key === 'Enter') {
      e.preventDefault()
      const input = e.currentTarget as HTMLInputElement
      const desc = input.value.trim() || '(proper noun)'
      await saveWord({
        word,
        reading,
        definitions: [desc],
        jlpt: null,
        savedAt: Date.now(),
        sourceUrl: window.location.href,
        known: false,
        starred: true,
        seenCount: 1
      })
      playSuccessSound()
      const btn = popupEl?.querySelector('[data-action="save-name"]')
      if (btn) btn.textContent = '✅ Saved!'
      setTimeout(() => {
        if (btn) btn.textContent = 'Save'
      }, 2000)
    }
  })

  popupEl.querySelector('[data-action="srs"]')?.addEventListener('click', async () => {
    const dictEntry = lookupWord(word)
    await addToSrs(
      word,
      dictEntry?.reading || reading,
      dictEntry?.definitions || [],
      dictEntry?.jlpt || null
    )
    playClickSound()
    const btn = popupEl?.querySelector('[data-action="srs"]')
    if (btn) btn.textContent = '🔄 Added!'
    setTimeout(() => {
      if (btn) btn.textContent = '🔄 Study'
    }, 1500)
  })

  popupEl.querySelector('[data-action="known"]')?.addEventListener('click', async () => {
    const dictEntry = lookupWord(word)
    await markKnown(word, {
      reading: dictEntry?.reading || reading,
      definitions: dictEntry?.definitions || [],
      jlpt: dictEntry?.jlpt || null
    })
    await recordDailyEvent({ type: 'wordsMarkedKnown' })
    playClickSound()
    updateKnownStatus(word, true)
    popupEl!.style.display = 'none'
    currentWord = ''
  })

  popupEl.querySelector('[data-action="unmark"]')?.addEventListener('click', async () => {
    await unmarkKnown(word)
    updateKnownStatus(word, false)
    const btn = popupEl?.querySelector('[data-action="unmark"]')
    if (btn) btn.textContent = '↩ Unmarked!'
    setTimeout(() => {
      // Lightweight re-render — refreshes popup HTML without firing analytics
      if (currentWord === word) {
        reRenderPopup(word, currentReading)
      }
    }, 500)
  })

  popupEl.querySelector('[data-action="sentence"]')?.addEventListener('click', async () => {
    if (!word) return
    // Find the ruby element on the page
    const rubyEl = document.querySelector(`ruby.kanjilens-ruby[data-word="${CSS.escape(word)}"]`)
    if (!rubyEl) return
    const ctx = extractSentenceContext(rubyEl as HTMLElement, word)
    if (ctx) {
      await saveSentence({
        sentence: ctx.sentence,
        translation: '',
        targetWord: ctx.targetWord,
        targetReading: reading,
        sourceUrl: window.location.href,
        sourceTitle: getCleanPageTitle(),
        savedAt: Date.now(),
        tags: [],
        notes: ''
      })
      playClickSound()
      await recordDailyEvent({ type: 'sentencesMined' })
      const btn = popupEl?.querySelector('[data-action="sentence"]')
      if (btn) btn.textContent = '📝 Done!'
      setTimeout(() => {
        if (btn) btn.textContent = '📝 Mine'
      }, 1500)
    } else {
      const btn = popupEl?.querySelector('[data-action="sentence"]')
      if (btn) btn.textContent = '⚠ No context'
      setTimeout(() => {
        if (btn) btn.textContent = '📝 Mine'
      }, 1500)
    }
  })
}

/** Re-render the popup silently (no analytics, no API calls). */
function reRenderPopup(word: string, reading: string): void {
  if (!popupEl) return
  const content = popupEl.querySelector('.kl-popup-content')
  if (!content) return

  const dictEntry = lookupWord(word)
  const kanjiEntry = word.length === 1 ? lookupKanji(word) : null

  // Check if this word is a proper noun (name)
  const rubyEl = document.querySelector(`ruby.kanjilens-ruby[data-word="${CSS.escape(word)}"]`)
  const posType = rubyEl?.getAttribute('data-pos') || ''
  const isProperNoun = posType === '固有名詞'

  const nameEntry = lookupName(word)
  if (isProperNoun && !dictEntry) {
    const posDetail = rubyEl?.getAttribute('data-pos-detail') || ''
    const nameType = getNameTypeLabel(posDetail)
    content.innerHTML = buildNamePopupHTML(word, reading, nameType, nameEntry)
  } else if (dictEntry || kanjiEntry) {
    const posDetail = rubyEl?.getAttribute('data-pos-detail') || ''
    const nameType = getNameTypeLabel(posDetail)
    // Build component kanji for multi-kanji words
    const compKanji: KanjiEntry[] = []
    if (word.length > 1) {
      for (const ch of word) {
        if (/[\u4E00-\u9FFF]/.test(ch)) {
          const k = lookupKanji(ch)
          if (k) compKanji.push(k)
        }
      }
    }
    const numAltReadings = containsNumerals(word)
      ? generateNumberAltReadings(word, reading)
      : []
    content.innerHTML = buildPopupHTML(word, reading, dictEntry, kanjiEntry, nameType, compKanji, numAltReadings, [])
  } else if (reading) {
    content.innerHTML = buildBasicPopupHTML(word, reading)
  }

  bindPopupButtons(word, reading)
}

function updateKnownStatus(word: string, known: boolean): void {
  document.querySelectorAll(`ruby.kanjilens-ruby[data-word="${CSS.escape(word)}"] rt`).forEach(rt => {
    rt.className = known ? 'kanjilens-rt-known' : 'kanjilens-rt-new'
  })
}

function positionPopup(anchor: HTMLElement): void {
  if (!popupEl) return

  // Temporarily show off-screen to measure the popup's actual dimensions.
  // getBoundingClientRect returns zero for display:none elements.
  popupEl.style.visibility = 'hidden'
  popupEl.style.display = 'block'
  popupEl.style.left = '-9999px'
  popupEl.style.top = '-9999px'

  const popupRect = popupEl.getBoundingClientRect()
  const popupWidth = Math.min(popupRect.width, 520)
  const popupHeight = popupRect.height

  // Reset visibility; display will be set to 'block' by the caller
  popupEl.style.visibility = ''

  const anchorRect = anchor.getBoundingClientRect()
  const MARGIN = 10   // minimum px from viewport edges
  const GAP = 6       // gap between anchor and popup

  // ── Vertical positioning ──
  // Preferred: above the anchor. If not enough room, try below.
  // If neither side has enough room, pick the side with more space.
  const spaceAbove = anchorRect.top - MARGIN
  const spaceBelow = window.innerHeight - anchorRect.bottom - MARGIN

  let top: number
  if (popupHeight + GAP <= spaceAbove) {
    // Plenty of room above — place above
    top = anchorRect.top - popupHeight - GAP
  } else if (popupHeight + GAP <= spaceBelow) {
    // Not enough above, but plenty below — place below
    top = anchorRect.bottom + GAP
  } else if (spaceAbove >= spaceBelow) {
    // Both sides tight — place on the side with more room
    top = Math.max(MARGIN, anchorRect.top - popupHeight - GAP)
  } else {
    top = Math.min(window.innerHeight - popupHeight - MARGIN, anchorRect.bottom + GAP)
  }

  // ── Horizontal positioning ──
  // Center on the anchor, but keep fully within the viewport.
  // Prefer aligning with the anchor's left edge when close to the right viewport edge.
  const centerLeft = anchorRect.left + anchorRect.width / 2 - popupWidth / 2
  let left = Math.max(MARGIN, Math.min(centerLeft, window.innerWidth - popupWidth - MARGIN))

  popupEl.style.left = `${left}px`
  popupEl.style.top = `${top}px`
}

/** Update the popup with data fetched from the API (called after initial render). */
function updatePopupWithApiData(apiEntry: ApiDictEntry): void {
  if (!popupEl || currentWord !== apiEntry.word) return

  const content = popupEl.querySelector('.kl-popup-content')
  if (!content) return

  // Remove loading indicator
  const loadingEl = content.querySelector('.kl-api-loading')
  if (loadingEl) loadingEl.remove()

  // Remove any existing API-sourced definitions before re-inserting
  const existingApiDefs = content.querySelector('.kl-api-defs')
  if (existingApiDefs) existingApiDefs.remove()
  const existingApiSource = content.querySelector('.kl-api-source')
  if (existingApiSource) existingApiSource.remove()

  // Get existing local definitions to avoid duplicates
  const existingDefs = new Set<string>()
  content.querySelectorAll('.kl-def').forEach(el => {
    const text = el.textContent?.trim()
    if (text) existingDefs.add(text)
  })

  // Filter out definitions that already appear locally
  const newDefs = apiEntry.definitions.filter(d => !existingDefs.has(d))

  if (newDefs.length > 0) {
    const defsHtml = `<div class="kl-definitions kl-api-defs">
        ${newDefs.map((d: string) => d).join(', ')}
      </div>
      <div class="kl-api-source">via Jisho.org</div>`

    // Insert after the existing definitions or after the header
    const existingDefsContainer = content.querySelector('.kl-definitions:not(.kl-api-defs)')
    const insertAfter = existingDefsContainer || content.querySelector('.kl-popup-header')

    if (insertAfter) {
      const defWrapper = document.createElement('div')
      defWrapper.innerHTML = defsHtml
      insertAfter.after(defWrapper.firstElementChild!)
    }
  }

  // Inject alternate readings from the API, if any
  if (apiEntry.altReadings && apiEntry.altReadings.length > 0) {
    // Remove any existing alt readings from a previous API update
    const existingAlt = content.querySelector('.kl-alt-readings')
    if (existingAlt) existingAlt.remove()

    const altHtml = `<div class="kl-alt-readings kl-api-defs">
      <span class="kl-label">Also read as:</span>
      ${apiEntry.altReadings.filter(r => r !== (currentReading || apiEntry.reading)).join(', ')}
    </div>`

    // Insert after the header or number alt readings
    const insertAfter = content.querySelector('.kl-number-alt-readings') || content.querySelector('.kl-popup-header')
    if (insertAfter) {
      const altWrapper = document.createElement('div')
      altWrapper.innerHTML = altHtml
      insertAfter.after(altWrapper.firstElementChild!)
    }
  }
}

function scheduleHide(): void {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hidePopup()
  }, HIDE_DELAY_MS)
}

function onScroll(e: Event): void {
  // Don't hide if the scroll happened inside the popup card itself.
  // The popup content is scrollable (overflow-y: auto) and scrolling
  // inside it shouldn't dismiss the card.
  if (popupEl && popupEl.contains(e.target as Node)) {
    return
  }
  hidePopupImmediately()
}

function hidePopupImmediately(): void {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
  hidePopup()
}

function hidePopup(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (popupEl) {
    popupEl.style.display = 'none'
    currentWord = ''
  }
}
