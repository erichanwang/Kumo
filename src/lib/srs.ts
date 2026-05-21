// SRS (Spaced Repetition System) for Kumo
// Implements SM-2 algorithm with Chrome storage persistence

export interface SrsCard {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  // SM-2 fields
  easeFactor: number      // starts at 2.5
  interval: number         // days until next review
  repetitions: number      // consecutive correct answers
  nextReview: number        // timestamp (ms) for next review
  lastReview: number        // timestamp (ms) of last review
  dueCount: number          // how many times it's been due (for prioritization)
}

export interface SrsReviewResult {
  card: SrsCard
  quality: number  // 0-5 SM-2 quality rating
}

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3

// Quality ratings:
// 0 = complete blackout
// 1 = incorrect, but upon seeing answer remembered
// 2 = incorrect, but answer seemed familiar
// 3 = correct with serious difficulty
// 4 = correct after hesitation
// 5 = perfect response

export function createSrsCard(word: string, reading: string, definitions: string[], jlpt: string | null): SrsCard {
  return {
    word,
    reading,
    definitions,
    jlpt,
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: 0,
    dueCount: 0
  }
}

export function processReview(card: SrsCard, quality: number): SrsCard {
  const now = Date.now()

  if (quality < 3) {
    // Forgotten — reset
    return {
      ...card,
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(MIN_EASE, card.easeFactor - 0.2),
      nextReview: now + minutesToMs(10), // review again in 10 min
      lastReview: now,
      dueCount: card.dueCount + 1
    }
  }

  // Correct answer — schedule next review
  let newInterval: number
  if (card.repetitions === 0) {
    newInterval = 1 // 1 day
  } else if (card.repetitions === 1) {
    newInterval = 6 // 6 days
  } else {
    newInterval = Math.round(card.interval * card.easeFactor)
  }

  const newEase = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const clampedEase = Math.max(MIN_EASE, newEase)

  return {
    ...card,
    easeFactor: clampedEase,
    interval: newInterval,
    repetitions: card.repetitions + 1,
    nextReview: now + daysToMs(newInterval),
    lastReview: now,
    dueCount: 0
  }
}

export function isDue(card: SrsCard): boolean {
  return Date.now() >= card.nextReview
}

export function getDueCards(cards: SrsCard[]): SrsCard[] {
  return cards
    .filter(c => isDue(c))
    .sort((a, b) => b.dueCount - a.dueCount || a.nextReview - b.nextReview)
}

export function getNextReviewTime(card: SrsCard): string {
  const diff = card.nextReview - Date.now()
  if (diff <= 0) return 'Now'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h`
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return `${days}d`
}

export function getSrsStats(cards: SrsCard[]): {
  total: number
  due: number
  new: number
  mastered: number
} {
  const due = cards.filter(c => isDue(c)).length
  const mastered = cards.filter(c => c.repetitions >= 5).length
  const newCards = cards.filter(c => c.repetitions === 0).length
  return { total: cards.length, due, new: newCards, mastered }
}

// Storage helpers
export async function loadSrsCards(): Promise<SrsCard[]> {
  const result = await chrome.storage.local.get('srsCards')
  return result.srsCards ?? []
}

export async function saveSrsCards(cards: SrsCard[]): Promise<void> {
  await chrome.storage.local.set({ srsCards: cards })
}

export async function addSrsCard(card: SrsCard): Promise<void> {
  const cards = await loadSrsCards()
  // Don't add duplicates
  if (!cards.find(c => c.word === card.word)) {
    cards.push(card)
    await saveSrsCards(cards)
  }
}

export async function updateSrsCard(updated: SrsCard): Promise<void> {
  const cards = await loadSrsCards()
  const idx = cards.findIndex(c => c.word === updated.word)
  if (idx >= 0) {
    cards[idx] = updated
    await saveSrsCards(cards)
  }
}

export async function removeSrsCard(word: string): Promise<void> {
  const cards = await loadSrsCards()
  await saveSrsCards(cards.filter(c => c.word !== word))
}

export async function addToSrs(
  word: string,
  reading: string,
  definitions: string[],
  jlpt: string | null
): Promise<void> {
  await addSrsCard(createSrsCard(word, reading, definitions, jlpt))
}

// --- Time helpers ---
function minutesToMs(min: number): number { return min * 60 * 1000 }
function daysToMs(days: number): number { return days * 24 * 60 * 60 * 1000 }
