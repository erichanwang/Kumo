import { describe, it, expect, vi } from 'vitest'

// Mock the dictionary data before importing
vi.mock('../data/jmdict.json', () => ({
  default: {
    '食べる': { reading: 'たべる', definitions: ['to eat'], jlpt: 'N5' },
    '飲む': { reading: 'のむ', definitions: ['to drink'], jlpt: 'N5' },
    '漢字': { reading: 'かんじ', definitions: ['Chinese character', 'kanji'], jlpt: 'N4' }
  }
}))

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  }
})

import { lookupWord, lookupWordBatch, getDefinitionSummary } from '../lib/dictionary'

describe('lookupWord', () => {
  it('finds existing word by exact match', () => {
    const result = lookupWord('食べる')
    expect(result).not.toBeNull()
    expect(result!.reading).toBe('たべる')
    expect(result!.definitions).toContain('to eat')
  })

  it('returns null for unknown word', () => {
    const result = lookupWord('存在しない')
    expect(result).toBeNull()
  })
})

describe('lookupWordBatch', () => {
  it('looks up multiple words', () => {
    const result = lookupWordBatch(['食べる', '飲む', 'unknown'])
    expect(result.has('食べる')).toBe(true)
    expect(result.has('飲む')).toBe(true)
    expect(result.has('unknown')).toBe(false)
  })
})

describe('getDefinitionSummary', () => {
  it('returns comma-joined definitions', () => {
    const entry = { reading: 'かんじ', definitions: ['Chinese character', 'kanji'], jlpt: 'N4' }
    expect(getDefinitionSummary(entry)).toBe('Chinese character, kanji')
  })

  it('returns empty for empty definitions', () => {
    const entry = { reading: '', definitions: [], jlpt: null }
    expect(getDefinitionSummary(entry)).toBe('')
  })
})
