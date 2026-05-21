// Kanji detail page logic for Kumo
// Shows kanji readings, meanings, radicals, stroke info, JLPT/grade/frequency

import { lookupKanji, type KanjiEntry, getRadicalInfo } from './src/lib/dictionary'
import { addToSrs } from './src/lib/srs'
import { saveWord } from './src/lib/storage'
import { speakJapanese } from './src/lib/audio'
import { loadTheme, applyThemeColors } from './src/lib/theme'
import { getLocale, detectLocale, setLocale, populateI18n, t } from './src/lib/i18n'

let currentKanji: KanjiEntry | null = null

document.addEventListener('DOMContentLoaded', async () => {
  // Theme
  const theme = await loadTheme()
  applyThemeColors(theme)

  // i18n
  const locale = detectLocale()
  setLocale(locale)
  populateI18n()

  bindEvents()

  // Auto-load kanji from URL hash fragment (e.g., kanji.html#食)
  const hash = window.location.hash.slice(1)
  if (hash) {
    const decoded = decodeURIComponent(hash).trim()
    if (decoded.length === 1) {
      const input = document.getElementById('kanji-input') as HTMLInputElement
      if (input) {
        input.value = decoded
        loadKanji(decoded)
      }
    }
  }
})

function bindEvents(): void {
  document.getElementById('btn-back')?.addEventListener('click', () => window.close())
  document.getElementById('btn-pronounce')?.addEventListener('click', () => {
    if (currentKanji && currentKanji.on.length > 0) {
      speakJapanese(currentKanji.on[0])
    } else if (currentKanji) {
      speakJapanese(currentKanji.kanji)
    }
  })
  document.getElementById('btn-add-srs')?.addEventListener('click', async () => {
    if (currentKanji) {
      await addToSrs(
        currentKanji.kanji,
        currentKanji.on[0] || currentKanji.kun[0] || '',
        currentKanji.meanings,
        currentKanji.jlpt
      )
      const btn = document.getElementById('btn-add-srs')
      if (btn) {
        btn.textContent = '✓ Added to SRS'
        setTimeout(() => { btn.textContent = '🔄 Add to SRS' }, 2000)
      }
    }
  })
  document.getElementById('btn-save')?.addEventListener('click', async () => {
    if (currentKanji) {
      await saveWord({
        word: currentKanji.kanji,
        reading: currentKanji.on[0] || currentKanji.kun[0] || '',
        definitions: currentKanji.meanings,
        jlpt: currentKanji.jlpt,
        savedAt: Date.now(),
        sourceUrl: '',
        known: false,
        starred: true,
        seenCount: 1
      })
      const btn = document.getElementById('btn-save')
      if (btn) {
        btn.textContent = '✓ Saved'
        setTimeout(() => { btn.textContent = '⭐ Save to Word Bank' }, 2000)
      }
    }
  })

  // Search input
  document.getElementById('kanji-input')?.addEventListener('input', (e) => {
    const char = (e.target as HTMLInputElement).value.trim()
    if (char.length === 1) {
      loadKanji(char)
    }
  })
}

function loadKanji(kanji: string): void {
  const result = lookupKanji(kanji)
  const emptyEl = document.getElementById('kanji-empty')!
  const detailEl = document.getElementById('kanji-detail')!

  if (!result) {
    emptyEl.classList.remove('hidden')
    detailEl.classList.add('hidden')
    currentKanji = null
    return
  }

  currentKanji = result
  emptyEl.classList.add('hidden')
  detailEl.classList.remove('hidden')

  // Display kanji
  document.getElementById('kanji-display')!.textContent = kanji

  // Stats
  setText('stat-strokes', result.strokes || '–')
  setText('stat-jlpt', result.jlpt || '–')
  setText('stat-grade', '–')
  setText('stat-freq', '–')

  // On'yomi (use 'on' from KanjiEntry)
  document.getElementById('onyomi-list')!.innerHTML = result.on.length > 0
    ? result.on.map(r => `<span class="kanji-reading-tag">${r}</span>`).join('')
    : '<span style="color:var(--kumo-text-muted)">None</span>'

  // Kun'yomi (use 'kun' from KanjiEntry)
  document.getElementById('kunyomi-list')!.innerHTML = result.kun.length > 0
    ? result.kun.map(r => `<span class="kanji-reading-tag">${r}</span>`).join('')
    : '<span style="color:var(--kumo-text-muted)">None</span>'

  // Meanings
  document.getElementById('meanings-list')!.textContent = result.meanings.join(' · ')

  // Radical
  const radicalInfo = getRadicalInfo(kanji)
  if (radicalInfo) {
    document.getElementById('radical-info')!.innerHTML = `
      <span class="radical-char">${radicalInfo.radical}</span>
      <span class="radical-name">${radicalInfo.name || ''}</span>
    `
  } else {
    document.getElementById('radical-info')!.innerHTML = '<span style="color:var(--kumo-text-muted)">Unknown</span>'
  }
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}
