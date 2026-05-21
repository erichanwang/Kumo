// Furigana injection module for Kumo
// Handles DOM manipulation to add ruby tags with furigana readings

import { tokenize, hasKanji, katakanaToHiragana, containsJapanese, Token } from './parser'
import { isKnownSync } from '../lib/storage'
import { lookupWord, lookupName } from '../lib/dictionary'
import { hiraganaToRomaji } from '../lib/romaji'
import { isNumeralChar, isCounterChar, resolveCounterCompound, isArabicDigits, resolveArabicCounterCompound } from '../lib/numbers'

/** Module-level flag for katakana furigana — off by default.
 *  Updated via setKatakanaFuriganaEnabled() from index.ts message handler. */
let showKatakanaFurigana = false

/** Module-level flag for romaji furigana — when true, all rt text shows romaji instead of hiragana. */
let furiganaRomajiEnabled = false

/** Module-level flag for hiding furigana on known words. */
let hideKnownFurigana = false

/** Module-level flag for showing furigana on kanji numerals (一, 二, 三, etc.). */
let showNumberFurigana = true

export function setKatakanaFuriganaEnabled(enabled: boolean): void {
  showKatakanaFurigana = enabled
}

/** Toggle furigana between hiragana and romaji display.
 *  Updates all existing ruby tags on the page. New ruby elements created
 *  afterward will pick up the current setting from the module flag. */
export function setFuriganaRomaji(enabled: boolean): void {
  furiganaRomajiEnabled = enabled
  applyFuriganaRomaji()
}

/** Sync the romaji display to the current module flag.
 *  Called immediately after toggle and also after re-processing page content
 *  so newly created ruby elements get the correct reading. */
export function applyFuriganaRomaji(): void {
  document.querySelectorAll('ruby.kanjilens-ruby').forEach(ruby => {
    const rt = ruby.querySelector('rt')
    if (!rt) return
    if (furiganaRomajiEnabled) {
      // Use kanji-only romaji (data-rt-romaji) for split words, fall back to full romaji
      const romaji = ruby.getAttribute('data-rt-romaji') || ruby.getAttribute('data-romaji')
      if (romaji) {
        rt.textContent = applyRtTruncation(romaji, ruby)
      } else {
        // Fallback for elements created before these attributes were stored
        const hiraganaReading = ruby.getAttribute('data-rt-reading') || ruby.getAttribute('data-reading')
        if (hiraganaReading) {
          const roma = hiraganaToRomaji(hiraganaReading)
          ruby.setAttribute('data-rt-romaji', roma)
          rt.textContent = applyRtTruncation(roma, ruby)
        }
      }
    } else {
      // Restore original hiragana reading (kanji-only for split words)
      const hiraganaReading = ruby.getAttribute('data-rt-reading') || ruby.getAttribute('data-reading')
      if (hiraganaReading) {
        rt.textContent = applyRtTruncation(hiraganaReading, ruby)
      }
    }
  })
}

/** Check if a string is entirely katakana. */
export function isKatakanaOnly(text: string): boolean {
  return /^[\u30A0-\u30FFー]+$/.test(text)
}

/**
 * Set the furigana ruby font size by updating the CSS variable.
 * Values: 'small' → 0.3em, 'medium' → 0.4em, 'large' → 0.5em
 */
const FURIGANA_SIZE_MAP: Record<string, string> = {
  small: '0.3em',
  medium: '0.4em',
  large: '0.5em',
}

export function setFuriganaSize(size: 'small' | 'medium' | 'large'): void {
  const em = FURIGANA_SIZE_MAP[size] || '0.4em'
  document.documentElement.style.setProperty('--kumo-furigana-size', em)
}

export function setShowNumberFurigana(enabled: boolean): void {
  showNumberFurigana = enabled
}

export function setHideKnownFurigana(enabled: boolean): void {
  hideKnownFurigana = enabled
  // Update existing known-word rubies to show/hide rt
  document.querySelectorAll('ruby.kanjilens-ruby[data-known="true"]').forEach(ruby => {
    const rt = ruby.querySelector('rt')
    if (!rt) return
    if (enabled) {
      rt.style.display = 'none'
    } else {
      rt.style.display = ''
      rt.style.removeProperty('display')
    }
  })
}

/** Truncate an rt reading string if it exceeds the stored max length for the ruby element. */
function applyRtTruncation(text: string, ruby: Element): string {
  const maxStr = ruby.getAttribute('data-kl-maxrt')
  if (!maxStr) return text
  const maxLen = parseInt(maxStr, 10)
  if (isNaN(maxLen) || text.length <= maxLen) return text
  return text.slice(0, maxLen) + '\u2026'
}

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE',
  'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME', 'RUBY', 'RT', 'RB', 'RP'
])

// Tags that typically serve as structural/layout containers (not text containers).
// We skip patching these because overflow/line-height changes would break their layout.
const LAYOUT_TAGS = new Set([
  'BODY', 'HTML', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE',
  'HEADER', 'FOOTER', 'NAV', 'TABLE', 'THEAD', 'TBODY', 'TR',
  'UL', 'OL', 'DL', 'FORM', 'FIELDSET', 'FIGURE',
])

/**
 * Walk up from a container where ruby tags were just injected and fix any
 * ancestor containers that would clip the <rt> furigana text.
 *
 * Ruby <rt> elements render above the text baseline. If an ancestor has
 * overflow: hidden/clip or a tight line-height (< 1.6), the furigana gets
 * cut off. This is especially common on YouTube, Twitter, and news sites.
 *
 * We walk up to 5 levels, stopping at structural/layout containers (BODY,
 * SECTION, NAV, etc.) since patching those would break page layout.
 * Each fixed container is marked with data-kl-room to avoid redundant
 * getComputedStyle calls (which force synchronous reflow).
 */
export function fixContainerClipping(startEl: Element): void {
  const MAX_LEVELS = 5
  let el: Element | null = startEl
  for (let level = 0; level < MAX_LEVELS && el; level++) {
    // Stop at layout containers — patching them would break page structure
    if (LAYOUT_TAGS.has(el.tagName) || el === document.body || el === document.documentElement) return

    // Skip containers we've already patched, but keep walking up
    if (el.hasAttribute('data-kl-room')) {
      el = el.parentElement
      continue
    }
    el.setAttribute('data-kl-room', 'true')

    const style = getComputedStyle(el)

    // Fix overflow: hidden / clip so <rt> isn't cut off
    const overflowY = style.overflowY
    const overflow = style.overflow
    if (overflowY === 'hidden' || overflowY === 'clip' || overflow === 'hidden' || overflow === 'clip') {
      ;(el as HTMLElement).style.setProperty('overflow-y', 'visible', 'important')
      ;(el as HTMLElement).style.setProperty('overflow', 'visible', 'important')
    }

    // Fix tight line-height so there's vertical room for <rt>
    const lineHeight = style.lineHeight
    if (lineHeight && lineHeight !== 'normal') {
      const lh = parseFloat(lineHeight)
      if (!isNaN(lh) && lh > 0 && lh < 1.15) {
        ;(el as HTMLElement).style.setProperty('line-height', '1.22', 'important')
      }
    }

    el = el.parentElement
  }
}

export function processNode(node: Element): void {
  if (SKIP_TAGS.has(node.tagName)) return
  if (node.hasAttribute?.('data-kl-processed')) return
  if (node.classList?.contains('kanjilens-popup')) return
  if (node.classList?.contains('kanjilens-ruby')) return

  try {
    node.setAttribute('data-kl-processed', 'true')

    const textNodes = getTextNodes(node)
    for (const textNode of textNodes) {
      const text = textNode.textContent || ''
      if (!containsJapanese(text)) continue

      const rawTokens = tokenize(text)
      if (rawTokens.length === 0) continue

      // Merge adjacent numeral + counter tokens (e.g. 一+人→一人)
      // Kuromoji often splits these into separate tokens, losing compounds
      // like 一人(ひとり) and 二人(ふたり).
      const tokens = mergeNumberCompounds(rawTokens)

      const parent = textNode.parentNode
      if (!parent) continue

      for (let i = 0; i < tokens.length; i++) {
        parent.insertBefore(wrapWithFurigana(tokens[i]), textNode)
      }

      parent.removeChild(textNode)

      // Fix container clipping so <rt> furigana isn't cut off.
      // Only needed when ruby elements (with <rt>) were actually created.
      if (parent.querySelector('.kanjilens-ruby')) {
        fixContainerClipping(parent as Element)
      }
    }
  } catch (e) {
    // Defensive: never break the host page
    console.debug('Kumo: Error processing node', e)
  }
}

function getTextNodes(element: Element): Text[] {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Text): number {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT
        if (parent.hasAttribute?.('data-kl-processed')) return NodeFilter.FILTER_SKIP
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }
  return nodes
}

/** Check if all characters in a string are kanji numerals. */
export function isAllNumerals(s: string): boolean {
  if (!s) return false
  for (const ch of s) {
    if (!isNumeralChar(ch)) return false
  }
  return true
}

/**
 * Merge adjacent numeral + counter tokens into single compound tokens.
 * Kuromoji tokenizes e.g. 一人 as [一(いち), 人(にん)] instead of [一人(ひとり)].
 * This function detects these patterns and merges them with correct readings.
 * Also handles Arabic numerals + counters: 2024年 → にせんにじゅうよねん
 */
function mergeNumberCompounds(tokens: Token[]): Token[] {
  const result: Token[] = []
  let i = 0
  while (i < tokens.length) {
    const current = tokens[i]
    const next = tokens[i + 1]

    if (
      next &&
      current.surface_form &&
      next.surface_form &&
      next.surface_form.length === 1 &&
      isCounterChar(next.surface_form)
    ) {
      const numeralForm = current.surface_form
      const isKanjiNumerals = isAllNumerals(numeralForm)
      const isArabicNumerals = isArabicDigits(numeralForm)

      if (isKanjiNumerals || isArabicNumerals) {
        const combined = numeralForm + next.surface_form

        // 1. Try dictionary lookup first (entries that exist in jmdict)
        const dictEntry = lookupWord(combined)
        if (dictEntry) {
          result.push(makeMergedToken(combined, dictEntry.reading, current.word_position))
          i += 2
          continue
        }

        if (isKanjiNumerals) {
          // 2. Try number compound resolution (handles 一人→ひとり, 二人→ふたり, etc.)
          const compoundReading = resolveCounterCompound(combined)
          if (compoundReading) {
            result.push(makeMergedToken(combined, compoundReading, current.word_position))
            i += 2
            continue
          }
        } else if (isArabicNumerals) {
          // 3. Arabic numeral + counter (e.g. 2024年)
          const arabicReading = resolveArabicCounterCompound(numeralForm, next.surface_form)
          if (arabicReading) {
            result.push(makeMergedToken(combined, arabicReading, current.word_position))
            i += 2
            continue
          }
        }
      }
    }

    result.push(current)
    i++
  }
  return result
}

/** Create a merged pseudo-token from a kanji numeral + counter compound. */
function makeMergedToken(surface: string, reading: string, position: number): Token {
  return {
    surface_form: surface,
    reading: reading,
    pos: '名詞',
    pos_detail_1: '',
    pos_detail_2: '',
    basic_form: surface,
    word_type: '',
    word_position: position,
  }
}

/** Check if a character is a CJK kanji (U+4E00–U+9FFF). */
function isKanjiChar(ch: string): boolean {
  return /^[\u4e00-\u9fff]$/.test(ch)
}

/** Count leading non-kanji (kana) characters in a string. */
function countLeadingKana(s: string): number {
  let count = 0
  for (const ch of s) {
    if (!isKanjiChar(ch)) count++
    else break
  }
  return count
}

/** Count trailing non-kanji (kana) characters in a string. */
function countTrailingKana(s: string): number {
  let count = 0
  for (let i = s.length - 1; i >= 0; i--) {
    if (!isKanjiChar(s[i])) count++
    else break
  }
  return count
}

/** Wrap a kana-only token in a hoverable span so the Kumo Card popup can trigger on it. */
function createKanaSpan(surface: string, reading: string | undefined, dictForm?: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = 'kanjilens-kana'
  span.textContent = surface
  span.setAttribute('data-word', dictForm || surface)
  if (reading) {
    span.setAttribute('data-reading', katakanaToHiragana(reading))
  }
  return span
}

export function wrapWithFurigana(token: Token): HTMLElement | Text {
  const surface = token.surface_form
  const reading = token.reading

  // Show furigana for: (a) words with kanji, OR (b) katakana words when toggle is on
  // Skip pure kanji numerals (一, 二, 三, etc.) when number furigana is off.
  // Numeral+counter compounds like 一人, 二人 are NOT pure numerals and still get furigana.
  if (!showNumberFurigana && isAllNumerals(surface)) {
    return createKanaSpan(surface, reading, token.basic_form || surface)
  }

  const shouldFurigana = hasKanji(surface) || (showKatakanaFurigana && isKatakanaOnly(surface))
  if (!shouldFurigana || !reading) {
    // Wrap in a hoverable span so non-kanji words are also searchable via the Kumo Card
    return createKanaSpan(surface, reading, token.basic_form || surface)
  }

  const hiraganaReading = katakanaToHiragana(reading)
  const dictForm = token.basic_form || surface
  const known = isKnownSync(dictForm)

  // ── Name detection & reading ──
  // Check names.json for a curated reading (most common one).
  // This overrides kuromoji's reading which may be on'yomi (e.g. 田中→でんちゅう).
  const nameEntry = lookupName(dictForm)
  const isName = nameEntry !== null || token.pos_detail_1 === '固有名詞'
  // Only personal names (surname/person) get the red 'approximate' warning style.
  // Places and "other" types use the standard furigana color.
  const isPersonalName = nameEntry !== null && (nameEntry.type === 'surname' || nameEntry.type === 'person')

  let effectiveReading = hiraganaReading
  let nameReadingType = ''
  if (nameEntry) {
    // Use the names.json reading (most common) as the primary reading
    effectiveReading = katakanaToHiragana(nameEntry.reading.replace(/ /g, ''))
    nameReadingType = nameEntry.type
  }

  // ── Split-verb token fix ──
  // When Kuromoji splits a verb like 告げる into 告 + げる (two tokens),
  // the kanji token's surface is all kanji but the reading only covers the
  // stem (e.g. つ instead of つげ). Detect this via the dictForm's trailing
  // kana and fill in the missing portion from the JMdict reading.
  // Skip this when nameEntry exists — names.json already has correct readings.
  const dictFormTrailingKana = countTrailingKana(dictForm)
  if (!nameEntry && dictFormTrailingKana > 0 && countTrailingKana(surface) === 0 && hasKanji(surface)) {
    const dictEntry = lookupWord(dictForm)
    if (dictEntry) {
      const fullReading = katakanaToHiragana(dictEntry.reading)
      if (fullReading.length > dictFormTrailingKana) {
        effectiveReading = fullReading.slice(0, fullReading.length - dictFormTrailingKana)
      }
    }
  }

  // ── Okurigana split ──
  // Only the kanji portion of the word gets furigana; trailing/leading kana
  // (okurigana for verbs/adjectives, honorific prefixes like お/ご) stay as
  // plain text inside the ruby so the popup still covers the full word.
  const leadingKana = countLeadingKana(surface)
  const trailingKana = countTrailingKana(surface)
  const kanjiPart = surface.slice(leadingKana, surface.length - trailingKana)
  const needsSplit = kanjiPart.length > 0 && (leadingKana > 0 || trailingKana > 0)

  // The kanji-only reading (used for the rt text)
  const kanjiReading = needsSplit
    ? effectiveReading.slice(leadingKana, effectiveReading.length - trailingKana)
    : effectiveReading

  // Guard: if the split produced an empty reading, fall back to no split
  const useSplit = needsSplit && kanjiReading.length > 0

  const ruby = document.createElement('ruby')
  ruby.className = 'kanjilens-ruby'
  if (known) ruby.setAttribute('data-known', 'true')
  if (hideKnownFurigana && known) {
    ruby.setAttribute('data-hide-furigana', 'true')
  }
  ruby.setAttribute('data-word', dictForm)
  // data-reading / data-romaji always hold the FULL word reading (for popup)
  ruby.setAttribute('data-reading', effectiveReading)
  const romajiReading = hiraganaToRomaji(effectiveReading)
  ruby.setAttribute('data-romaji', romajiReading)
  // Store kanji-only readings for the rt (used by romaji toggle and re-renders)
  if (useSplit) {
    ruby.setAttribute('data-rt-reading', kanjiReading)
    ruby.setAttribute('data-rt-romaji', hiraganaToRomaji(kanjiReading))
  }

  // Store part-of-speech info for popup — set for names from either source
  if (isName) {
    ruby.setAttribute('data-pos', '固有名詞')
    ruby.setAttribute('data-pos-detail', nameReadingType || token.pos_detail_2 || '')
  }

  // ── Build the ruby content ──
  // Leading kana (e.g. お in お茶) → plain text before rb
  if (useSplit && leadingKana > 0) {
    ruby.appendChild(document.createTextNode(surface.slice(0, leadingKana)))
  }

  const rb = document.createElement('rb')
  rb.textContent = useSplit ? kanjiPart : surface
  ruby.appendChild(rb)

  const rt = document.createElement('rt')
  const displayReading = furiganaRomajiEnabled
    ? hiraganaToRomaji(kanjiReading)
    : kanjiReading

  // Truncate long readings that would visually overflow the kanji width.
  // Append ellipsis when the reading is significantly longer than the kanji.
  const maxReadingLen = Math.max(kanjiPart.length * 2, 4)
  ruby.setAttribute('data-kl-maxrt', String(maxReadingLen))
  rt.textContent = displayReading.length > maxReadingLen
    ? displayReading.slice(0, maxReadingLen) + '\u2026'
    : displayReading

  // Only personal names get the red warning style.
  // Other names (places, "other" type) use standard colour.
  if (isPersonalName) {
    rt.className = 'kanjilens-rt-name'
  } else {
    rt.className = known ? 'kanjilens-rt-known' : 'kanjilens-rt-new'
    // When hide-known-furigana is on, hide the rt for known words
    if (hideKnownFurigana && known) {
      rt.style.display = 'none'
    }
  }
  ruby.appendChild(rt)

  // Trailing kana (okurigana e.g. べる in 食べる) → plain text after rt
  if (useSplit && trailingKana > 0) {
    ruby.appendChild(document.createTextNode(surface.slice(surface.length - trailingKana)))
  }

  return ruby
}

// Batch processing with requestIdleCallback for performance
// Prioritizes visible nodes first to avoid jank on large pages
const BATCH_SIZE = 10
const MAX_NODES_PER_PAGE = 500
let pendingNodes: Element[] = []
let batchTimer: number | null = null
let totalProcessedThisPage = 0

export function processNodeBatch(node: Element): void {
  // Don't keep queuing if we've already processed a ton
  if (totalProcessedThisPage >= MAX_NODES_PER_PAGE) {
    return
  }
  pendingNodes.push(node)
  if (!batchTimer) {
    batchTimer = requestIdleCallback(processBatch, { timeout: 300 })
  }
}

function processBatch(deadline: IdleDeadline): void {
  // Pause if tab is hidden (user isn't looking)
  if (document.visibilityState === 'hidden') {
    if (pendingNodes.length > 0) {
      batchTimer = requestIdleCallback(processBatch, { timeout: 1000 })
    } else {
      batchTimer = null
    }
    return
  }

  let processed = 0
  while (pendingNodes.length > 0 && totalProcessedThisPage < MAX_NODES_PER_PAGE) {
    // Stop if we're out of idle time and have done at least one
    if (processed > 0 && deadline.timeRemaining() < 1) break

    const node = pendingNodes.shift()!
    processNode(node)
    processed++
    totalProcessedThisPage++
  }

  if (pendingNodes.length > 0 && totalProcessedThisPage < MAX_NODES_PER_PAGE) {
    batchTimer = requestIdleCallback(processBatch, { timeout: 300 })
  } else {
    batchTimer = null
    if (totalProcessedThisPage >= MAX_NODES_PER_PAGE && pendingNodes.length > 0) {
      console.debug(`Kumo: Reached max processed nodes (${MAX_NODES_PER_PAGE}), deferring ${pendingNodes.length} remaining nodes`)
    }
  }
}

// Reset page counter on navigation
// Using pagehide instead of beforeunload — pagehide is not blocked by
// Permissions-Policy: unload=() which some sites set to deter scrapers
window.addEventListener('pagehide', () => {
  totalProcessedThisPage = 0
  pendingNodes = []
  if (batchTimer !== null) {
    cancelIdleCallback(batchTimer)
    batchTimer = null
  }
})
