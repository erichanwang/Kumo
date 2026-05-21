import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStreakLength } from '../lib/progress'

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  }
})

describe('getStreakLength', () => {
  it('returns 1 for same day', () => {
    expect(getStreakLength('2024-01-15', '2024-01-15')).toBe(1)
  })

  it('returns correct length for multiple days', () => {
    expect(getStreakLength('2024-01-10', '2024-01-15')).toBe(6)
  })

  it('handles month boundaries', () => {
    expect(getStreakLength('2024-01-28', '2024-02-03')).toBe(7)
  })

  it('handles year boundaries', () => {
    expect(getStreakLength('2023-12-28', '2024-01-05')).toBe(9)
  })
})

describe('streak logic properties', () => {
  it('streak length is always positive', () => {
    const len = getStreakLength('2024-01-01', '2024-12-31')
    expect(len).toBeGreaterThan(0)
  })

  it('longest streak is at most 366', () => {
    const len = getStreakLength('2024-01-01', '2024-12-31')
    expect(len).toBeLessThanOrEqual(366)
  })
})
