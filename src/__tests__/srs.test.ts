import { describe, it, expect, vi } from 'vitest'
import {
  createSrsCard,
  processReview,
  isDue,
  getDueCards,
  getSrsStats,
  getNextReviewTime
} from '../lib/srs'

// Mock chrome.storage.local for storage helper tests
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  }
})

describe('createSrsCard', () => {
  it('creates a card with correct defaults', () => {
    const card = createSrsCard('食べる', 'たべる', ['to eat'], 'N5')
    expect(card.word).toBe('食べる')
    expect(card.reading).toBe('たべる')
    expect(card.definitions).toEqual(['to eat'])
    expect(card.jlpt).toBe('N5')
    expect(card.easeFactor).toBe(2.5)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)
    expect(card.dueCount).toBe(0)
  })

  it('creates a card with null JLPT', () => {
    const card = createSrsCard('漢字', 'かんじ', ['kanji', 'Chinese character'], null)
    expect(card.jlpt).toBeNull()
  })
})

describe('processReview', () => {
  it('resets on quality < 3 (forgotten)', () => {
    const card = createSrsCard('猫', 'ねこ', ['cat'], 'N5')
    const result = processReview(card, 0)
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeLessThan(2.5)
    expect(result.nextReview).toBeGreaterThan(result.lastReview)
  })

  it('schedules 1 day after first correct answer (quality >= 3)', () => {
    const card = createSrsCard('犬', 'いぬ', ['dog'], 'N5')
    const result = processReview(card, 4)
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('schedules 6 days after second correct answer', () => {
    const card = { ...createSrsCard('本', 'ほん', ['book'], 'N5'), repetitions: 1, interval: 1 }
    const result = processReview(card, 4)
    expect(result.repetitions).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('multiplies interval by ease factor for subsequent reviews', () => {
    const card = { ...createSrsCard('水', 'みず', ['water'], 'N5'), repetitions: 2, interval: 6, easeFactor: 2.5 }
    const result = processReview(card, 5)
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(15) // 6 * 2.5 = 15
  })

  it('never drops ease factor below 1.3', () => {
    const card = { ...createSrsCard('空', 'そら', ['sky'], 'N5'), easeFactor: 1.3, interval: 1, repetitions: 1 }
    const result = processReview(card, 0)
    expect(result.easeFactor).toBe(1.3)
  })

  it('increments dueCount on failure', () => {
    const card = createSrsCard('花', 'はな', ['flower'], 'N5')
    const result = processReview(card, 1)
    expect(result.dueCount).toBe(1)
  })

  it('resets dueCount on success', () => {
    const card = { ...createSrsCard('雨', 'あめ', ['rain'], 'N5'), dueCount: 3 }
    const result = processReview(card, 4)
    expect(result.dueCount).toBe(0)
  })
})

describe('isDue', () => {
  it('returns true for past-due cards', () => {
    const card = { ...createSrsCard('test', '', [], null), nextReview: Date.now() - 1000 }
    expect(isDue(card)).toBe(true)
  })

  it('returns false for future-due cards', () => {
    const card = { ...createSrsCard('test', '', [], null), nextReview: Date.now() + 86400000 }
    expect(isDue(card)).toBe(false)
  })

  it('returns true for exactly-now cards', () => {
    const card = { ...createSrsCard('test', '', [], null), nextReview: Date.now() }
    expect(isDue(card)).toBe(true)
  })
})

describe('getDueCards', () => {
  it('filters and sorts due cards by dueCount then nextReview', () => {
    const cards = [
      { ...createSrsCard('a', '', [], null), nextReview: Date.now() + 10000, dueCount: 0 },
      { ...createSrsCard('b', '', [], null), nextReview: Date.now() - 1000, dueCount: 5 },
      { ...createSrsCard('c', '', [], null), nextReview: Date.now() - 2000, dueCount: 1 },
      { ...createSrsCard('d', '', [], null), nextReview: Date.now() - 500, dueCount: 5 }
    ]
    const due = getDueCards(cards)
    expect(due.length).toBe(3)
    // Highest dueCount first: b (5), d (5), c (1)
    expect(due[0].word).toBe('b')
    expect(due[1].word).toBe('d')
    expect(due[2].word).toBe('c')
  })
})

describe('getSrsStats', () => {
  it('computes correct stats', () => {
    const cards = [
      { ...createSrsCard('a', '', [], null), nextReview: Date.now() - 1, repetitions: 0 },
      { ...createSrsCard('b', '', [], null), nextReview: Date.now() + 10000, repetitions: 5 },
      { ...createSrsCard('c', '', [], null), nextReview: Date.now() - 1, repetitions: 6 },
      { ...createSrsCard('d', '', [], null), nextReview: Date.now() + 10000, repetitions: 0 }
    ]
    const stats = getSrsStats(cards)
    expect(stats.total).toBe(4)
    expect(stats.due).toBe(2)
    expect(stats.new).toBe(2)
    expect(stats.mastered).toBe(2)
  })
})

describe('getNextReviewTime', () => {
  it('returns "Now" for due cards', () => {
    const card = { ...createSrsCard('x', '', [], null), nextReview: Date.now() - 1000 }
    expect(getNextReviewTime(card)).toBe('Now')
  })

  it('returns hours for less than a day', () => {
    const card = { ...createSrsCard('x', '', [], null), nextReview: Date.now() + 3 * 3600000 }
    expect(getNextReviewTime(card)).toMatch(/^\d+h$/)
  })

  it('returns days for more than a day', () => {
    const card = { ...createSrsCard('x', '', [], null), nextReview: Date.now() + 5 * 86400000 }
    expect(getNextReviewTime(card)).toMatch(/^\d+d$/)
  })
})
