import { describe, it, expect, vi } from 'vitest'
import { extractSentenceContext, generateId } from '../lib/sentences'

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  }
})

describe('extractSentenceContext', () => {
  function createMockElement(html: string, targetSelector: string): HTMLElement {
    document.body.innerHTML = html
    const target = document.body.querySelector(targetSelector)
    return target as HTMLElement
  }

  it('extracts sentence around a target word in a paragraph', () => {
    const el = createMockElement(
      '<p>今日は天気がいいですね。明日も晴れるでしょう。</p>',
      'p'
    )
    // Target "天気" which starts at index 3
    // Override the target word in the function call
    const result = extractSentenceContext(el, '天気')
    expect(result).not.toBeNull()
    expect(result!.sentence).toBe('今日は天気がいいですね。')
    expect(result!.targetWord).toBe('天気')
    expect(result!.targetPosition).toBe(3)
  })

  it('walks up to find block element', () => {
    const el = createMockElement(
      '<div><p>日本語を<span id="target">勉強</span>しています。頑張ります。</p></div>',
      '#target'
    )
    const result = extractSentenceContext(el, '勉強')
    expect(result).not.toBeNull()
    expect(result!.sentence).toContain('勉強')
  })

  it('returns null for empty text', () => {
    const el = createMockElement('<p></p>', 'p')
    const result = extractSentenceContext(el, 'test')
    expect(result).toBeNull()
  })

  it('returns null when target word not found', () => {
    const el = createMockElement('<p>Hello world.</p>', 'p')
    const result = extractSentenceContext(el, 'nonexistent')
    expect(result).toBeNull()
  })

  it('handles mixed Japanese and English sentence boundaries', () => {
    const el = createMockElement(
      '<p>私はKumoを使っています。It helps me learn Japanese!</p>',
      'p'
    )
    const result = extractSentenceContext(el, 'Kumo')
    expect(result).not.toBeNull()
    expect(result!.sentence).toContain('Kumo')
  })

  it('handles multiple sentence boundaries', () => {
    const el = createMockElement(
      '<p>こんにちは！今日の天気は？本当に暑いですね。</p>',
      'p'
    )
    const result = extractSentenceContext(el, '天気')
    expect(result).not.toBeNull()
    expect(result!.sentence).toBe('今日の天気は？')
  })
})

describe('generateId', () => {
  it('generates a unique string', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('generates non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })
})
