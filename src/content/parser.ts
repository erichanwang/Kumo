// Japanese text parser for Kumo
// Wraps Kuromoji.js with lazy loading and tokenization helpers

import kuromoji from 'kuromoji'

let tokenizerReady = false
let tokenizerInstance: any = null
let initAttempted = false
const pendingQueue: (() => void)[] = []

const DIC_LOAD_TIMEOUT_MS = 15000 // 15 second timeout for dictionary loading

export async function initParser(): Promise<void> {
  // Avoid repeated initialization attempts that spam errors
  if (initAttempted) return
  initAttempted = true

  return new Promise((resolve) => {
    try {
      console.log('Kumo: kuromoji module resolved:', typeof kuromoji, kuromoji ? Object.keys(kuromoji).slice(0, 10) : 'null/undefined')
      if (!kuromoji || typeof kuromoji.builder !== 'function') {
        console.warn('Kumo: kuromoji builder not available — parser disabled. ' +
          'Extension will work without furigana/reading features.')
        resolve()
        return
      }

      const dicPath = chrome.runtime.getURL('dict/')
      console.log('Kumo: Loading parser dictionaries from', dicPath)

      // Timeout guard: if dictionary loading hangs, don't block the extension forever
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        console.warn('Kumo: Parser dictionary loading timed out after ' +
          `${DIC_LOAD_TIMEOUT_MS / 1000}s. Parser disabled.`)
        resolve()
      }, DIC_LOAD_TIMEOUT_MS)

      const builder = kuromoji.builder({ dicPath })

      if (!builder || typeof builder.build !== 'function') {
        clearTimeout(timeout)
        console.warn('Kumo: kuromoji builder.build not callable — parser disabled.')
        resolve()
        return
      }

      builder.build((err: any, tokenizer: any) => {
        // Prevent double-resolve
        if (timedOut) return
        clearTimeout(timeout)

        if (err) {
          console.error('Kumo: Parser dictionary load failed:', err?.message || err)
          console.warn('Kumo: Extension will run without furigana/reading features.')
          resolve()
          return
        }

        if (!tokenizer || typeof tokenizer.tokenize !== 'function') {
          console.warn('Kumo: Parser tokenizer is invalid — parser disabled.')
          resolve()
          return
        }

        tokenizerInstance = tokenizer
        tokenizerReady = true
        console.log('Kumo: Parser initialized successfully')

        // Flush pending callbacks
        pendingQueue.forEach(fn => {
          try { fn() } catch (e) { /* ignore */ }
        })
        pendingQueue.length = 0
        resolve()
      })

    } catch (e) {
      console.error('Kumo: Parser initialization crashed:', e)
      console.warn('Kumo: Extension will continue without parser features.')
      resolve()
    }
  })
}

export function isParserReady(): boolean {
  return tokenizerReady
}

export function onParserReady(fn: () => void): void {
  if (tokenizerReady) {
    // Already ready — invoke immediately but don't block
    try { fn() } catch (e) { console.warn('Kumo: onParserReady callback error:', e) }
  } else {
    pendingQueue.push(fn)
  }
}

export interface Token {
  surface_form: string
  reading: string | undefined
  pos: string
  pos_detail_1: string
  pos_detail_2: string
  basic_form: string
  word_type: string
  word_position: number
}

export function tokenize(text: string): Token[] {
  if (!tokenizerReady || !tokenizerInstance) return []
  try {
    const rawTokens = tokenizerInstance.tokenize(text)
    if (!rawTokens || !Array.isArray(rawTokens)) return []
    return rawTokens.map((t: any) => ({
      surface_form: t.surface_form,
      reading: t.reading,
      pos: t.pos,
      pos_detail_1: t.pos_detail_1 || '',
      pos_detail_2: t.pos_detail_2 || '',
      basic_form: t.basic_form,
      word_type: t.word_type,
      word_position: t.word_position
    }))
  } catch (e) {
    console.warn('Kumo: Tokenization error:', e)
    return []
  }
}

export function containsJapanese(text: string): boolean {
  return /[\u3000-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
}

export function hasKanji(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}
