// MutationObserver module for Kumo
// Watches for dynamically added content and processes Japanese text

import { processNodeBatch } from './furigana'
import { containsJapanese } from './parser'

let observer: MutationObserver | null = null

export function initObserver(): void {
  if (observer) return

  observer = new MutationObserver((mutations) => {
    try {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue

          const el = node as Element

          // Skip our own injected elements
          if (el.classList?.contains('kanjilens-popup')) continue
          if (el.classList?.contains('kanjilens-ruby')) continue
          if (el.classList?.contains('kanjilens-kana')) continue
          if (el.hasAttribute?.('data-kl-processed')) continue

          // Skip certain tag types
          const tagName = el.tagName
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'RUBY', 'RT', 'RB', 'RP'].includes(tagName)) continue

          if (containsJapanese(el.textContent || '')) {
            processNodeBatch(el)
          }
        }
      }
    } catch (e) {
      console.debug('Kumo: Error in MutationObserver callback', e)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

export function disconnectObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}
