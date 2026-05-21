// SRS Review page for Kumo
// Flashcard-style spaced repetition with SM-2 algorithm, JLPT filtering, and batch study

import { loadSrsCards, saveSrsCards, processReview, getDueCards, getSrsStats, type SrsCard } from './src/lib/srs'
import { recordDailyEvent, incrementTotalReviewsDone } from './src/lib/progress'

let allCards: SrsCard[] = []
let reviewCards: SrsCard[] = []
let currentIndex = 0
let sessionCorrect = 0
let sessionTotal = 0
let isShowingBack = false
let studyMode: 'due' | 'all' = 'due'
let selectedJlpt = new Set<string>()

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndPrepareCards()
  bindEvents()
})

async function loadAndPrepareCards(): Promise<void> {
  allCards = await loadSrsCards()
  updateStats()

  if (allCards.length === 0) {
    showEmpty('No cards yet! Add words from the Word Bank.')
    return
  }

  // Setup JLPT filter options
  setupJlptFilter()

  // Default: study due cards
  setStudyMode('due')
}

function setupJlptFilter(): void {
  const container = document.getElementById('srs-jlpt-filter')
  if (!container) return

  const levels = new Set<string>()
  allCards.forEach(c => { if (c.jlpt) levels.add(c.jlpt) })

  if (levels.size === 0) {
    container.style.display = 'none'
    return
  }

  container.style.display = 'flex'
  container.innerHTML = '<span class="srs-filter-label">JLPT:</span>' +
    [...levels].sort().map(level => {
      const count = allCards.filter(c => c.jlpt === level).length
      const due = allCards.filter(c => c.jlpt === level && isDueDate(c)).length
      return `<label class="srs-jlpt-chip srs-chip-${level.toLowerCase()}" data-level="${level}">
        <input type="checkbox" value="${level}" checked />
        <span>${level}</span>
        <span class="srs-chip-count">${due}/${count}</span>
      </label>`
    }).join('')

  // Default: all levels selected
  selectedJlpt = new Set([...levels])

  // Bind chip clicks
  container.querySelectorAll('.srs-jlpt-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const cb = chip.querySelector('input')
      if (cb) cb.checked = !cb.checked
      cb?.dispatchEvent(new Event('change'))
    })

    chip.querySelector('input')?.addEventListener('change', () => {
      selectedJlpt.clear()
      container.querySelectorAll('.srs-jlpt-chip input:checked').forEach(cb => {
        selectedJlpt.add((cb as HTMLInputElement).value)
      })
      setStudyMode(studyMode)
    })
  })
}

function isDueDate(card: SrsCard): boolean {
  return Date.now() >= card.nextReview
}

function setStudyMode(mode: 'due' | 'all'): void {
  studyMode = mode

  let cards: SrsCard[]
  if (mode === 'due') {
    cards = getDueCards(allCards)
  } else {
    cards = [...allCards].sort((a, b) => b.dueCount - a.dueCount || a.nextReview - b.nextReview)
  }

  // Filter by selected JLPT levels
  if (selectedJlpt.size > 0) {
    cards = cards.filter(c => !c.jlpt || selectedJlpt.has(c.jlpt))
  }

  reviewCards = cards
  currentIndex = 0
  sessionCorrect = 0
  sessionTotal = 0

  updateStats()

  if (reviewCards.length === 0) {
    showEmpty(mode === 'due'
      ? 'No cards due for this JLPT level! 🎉\nTry switching to "Study All" mode.'
      : 'No cards found for this JLPT level.')
    return
  }

  showReview()
  showCard()
}

function showEmpty(message: string): void {
  document.getElementById('srs-empty')?.classList.remove('hidden')
  document.getElementById('srs-review')?.classList.add('hidden')
  document.getElementById('srs-summary')?.classList.add('hidden')
  document.getElementById('srs-mode-toggle')?.classList.remove('hidden')

  const emptyEl = document.getElementById('srs-empty')
  if (emptyEl) {
    emptyEl.innerHTML = `<p>${message.replace(/\n/g, '</p><p class="srs-empty-sub">')}</p>
      <button class="srs-btn srs-btn-secondary" id="btn-wordbank" style="margin-top:16px">📚 Go to Word Bank</button>`
    emptyEl.querySelector('#btn-wordbank')?.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('wordbank.html') })
    })
  }
}

function showReview(): void {
  document.getElementById('srs-empty')?.classList.add('hidden')
  document.getElementById('srs-review')?.classList.remove('hidden')
  document.getElementById('srs-summary')?.classList.add('hidden')
}

function updateStats(): void {
  const stats = getSrsStats(allCards)
  setText('srs-due-count', `${stats.due} due`)
  setText('srs-mastered-count', `${stats.mastered} mastered`)
}

function showCard(): void {
  if (currentIndex >= reviewCards.length) {
    showSummary()
    return
  }

  const card = reviewCards[currentIndex]
  isShowingBack = false

  document.getElementById('srs-front')?.classList.remove('hidden')
  document.getElementById('srs-back')?.classList.add('hidden')
  document.getElementById('srs-actions-front')?.classList.remove('hidden')
  document.getElementById('srs-actions-back')?.classList.add('hidden')

  setText('srs-word-display', card.word)
  setText('srs-reading-display', card.reading)
  document.getElementById('srs-defs-display')!.innerHTML = card.definitions
    .slice(0, 5)
    .map(d => `<div class="srs-def-item">${d}</div>`)
    .join('')

  const jlptBadge = document.getElementById('srs-jlpt-badge')!
  if (card.jlpt) {
    jlptBadge.textContent = card.jlpt
    jlptBadge.className = `srs-jlpt-badge ${card.jlpt.toLowerCase()}`
  } else {
    jlptBadge.textContent = ''
    jlptBadge.className = 'srs-jlpt-badge'
  }

  // Card info
  const intervalDays = Math.round(card.interval)
  setText('srs-interval-display', card.repetitions === 0 ? 'New card' : `Interval: ${intervalDays}d`)
  setText('srs-ease-display', `Ease: ${card.easeFactor.toFixed(2)}x`)
  const stageMap = ['New', 'Learning', 'Learning', 'Learning', 'Growing', 'Mature']
  const stageIndex = Math.min(card.repetitions, 5)
  setText('srs-stage-display', `Stage: ${stageMap[stageIndex]}`)

  if (card.lastReview > 0) {
    const diffMs = card.nextReview - Date.now()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    setText('srs-nextreview-display', diffHours <= 0 ? 'Due now' : diffDays > 0 ? `Next: ${diffDays}d` : `Next: ${diffHours}h`)
  } else {
    setText('srs-nextreview-display', 'Due now')
  }
  setText('srs-reps-display', `Reviews: ${card.repetitions}`)

  // Study mode badge
  setText('srs-mode-badge', studyMode === 'all' ? '📚 All Cards' : '⏰ Due Only')

  updateProgress()
}

function showAnswer(): void {
  isShowingBack = true
  document.getElementById('srs-front')!.classList.add('hidden')
  document.getElementById('srs-back')!.classList.remove('hidden')
  document.getElementById('srs-actions-front')!.classList.add('hidden')
  document.getElementById('srs-actions-back')!.classList.remove('hidden')
}

async function rateCard(quality: number): Promise<void> {
  const card = reviewCards[currentIndex]
  const updated = processReview(card, quality)

  const idx = allCards.findIndex(c => c.word === updated.word)
  if (idx >= 0) allCards[idx] = updated
  await saveSrsCards(allCards)

  sessionTotal++
  if (quality >= 3) sessionCorrect++
  await recordDailyEvent({ type: 'srsReviewsCompleted' })
  if (quality >= 3) await recordDailyEvent({ type: 'srsReviewsCorrect' })
  await incrementTotalReviewsDone()

  currentIndex++
  updateStats()
  showCard()
}

function showSummary(): void {
  document.getElementById('srs-review')!.classList.add('hidden')
  document.getElementById('srs-summary')!.classList.remove('hidden')
  document.getElementById('srs-mode-toggle')?.classList.add('hidden')

  setText('srs-summary-total', sessionTotal)
  setText('srs-summary-correct', sessionCorrect)
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
  setText('srs-summary-accuracy', `${accuracy}%`)
}

function updateProgress(): void {
  const total = reviewCards.length
  const done = currentIndex
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const fillEl = document.getElementById('srs-progress-fill')
  if (fillEl) fillEl.style.width = `${pct}%`
  setText('srs-progress-text', `${done} / ${total}`)
}

function bindEvents(): void {
  document.getElementById('btn-show-answer')?.addEventListener('click', showAnswer)

  document.querySelectorAll('.srs-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const quality = Number((btn as HTMLElement).dataset.quality)
      rateCard(quality)
    })
  })

  document.getElementById('btn-back-home')?.addEventListener('click', () => window.close())
  document.getElementById('btn-wordbank')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('wordbank.html') })
  })

  // Study mode toggle
  const modeBtns = document.querySelectorAll('.srs-mode-btn')
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      setStudyMode((btn as HTMLElement).dataset.mode as 'due' | 'all')
    })
  })

  // Retry (back to SRS after summary)
  document.getElementById('btn-retry')?.addEventListener('click', () => {
    document.getElementById('srs-summary')?.classList.add('hidden')
    document.getElementById('srs-mode-toggle')?.classList.remove('hidden')
    setStudyMode(studyMode)
  })

  // Dashboard link
  document.getElementById('btn-dashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('stats.html') })
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!isShowingBack) showAnswer()
    }
    if (isShowingBack) {
      switch (e.key) {
        case '1': rateCard(0); break
        case '2': rateCard(1); break
        case '3': rateCard(3); break
        case '4': rateCard(4); break
        case '5': rateCard(5); break
      }
    }
  })
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}
