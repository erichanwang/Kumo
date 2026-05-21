// Japanese number reading generator for Kumo
// When kuromoji parses a word like 四月 as しがつ, this module
// generates alternative readings like よんげつ to help learners.

// ── Kanji numeral → on'yomi / kun'yomi readings ──

interface NumeralReadings {
  on: string[]      // standard on'yomi (音読み) — first is most common
  kun: string[]     // kun'yomi / alternative (訓読み・常用) — first is most common
}

const NUMERALS: Record<string, NumeralReadings> = {
  '〇': { on: ['れい'],   kun: ['ゼロ', 'まる'] },
  '零': { on: ['れい'],   kun: ['ゼロ'] },
  '一': { on: ['いち'],   kun: ['ひと', 'いっ'] },
  '二': { on: ['に'],     kun: ['ふた'] },
  '三': { on: ['さん'],   kun: ['み'] },
  '四': { on: ['し'],     kun: ['よん', 'よ'] },
  '五': { on: ['ご'],     kun: ['いつ'] },
  '六': { on: ['ろく'],   kun: ['む', 'ろっ'] },
  '七': { on: ['しち'],   kun: ['なな'] },
  '八': { on: ['はち'],   kun: ['や', 'はっ'] },
  '九': { on: ['く', 'きゅう'], kun: ['ここの'] },
  '十': { on: ['じゅう'], kun: ['とお', 'じゅっ'] },
  '百': { on: ['ひゃく'], kun: [] },
  '千': { on: ['せん'],   kun: [] },
  '万': { on: ['まん'],   kun: [] },
  '億': { on: ['おく'],   kun: [] },
  '兆': { on: ['ちょう'], kun: [] },
}

// ── Sound changes when a numeral precedes a multiplier (百, 千) ──

const MULTIPLIER_SOUND_CHANGES: Record<string, Record<string, string>> = {
  // 百: rendaku (h→b) after 三, gemination + rendaku after 六/八
  'ひゃく': {
    'さん': 'びゃく',
    'ろく': 'ぴゃく',
    'はち': 'ぴゃく',
    'なな': 'ひゃく', // stays — no change
  },
  // 千: rendaku (s→z) after 三, gemination after 八
  'せん': {
    'さん': 'ぜん',
    'はち': 'せん', // はっせん handled via gemination below
  },
}

/** Geminate a numeral reading before certain following sounds.
 *  e.g. ろく→ろっ before p/b, じゅう→じゅっ before p/b, いち→いっ before s */
function geminateNumeral(reading: string, nextSound: string): string {
  // Match hiragana p/b sounds (ぱぴぷぺぽ / ばびぶべぼ) + Latin p/b
  if (/^[ぱぴぷぺぽばびぶべぼpb]/.test(nextSound)) {
    if (reading === 'ろく') return 'ろっ'
    if (reading === 'はち') return 'はっ'
    if (reading === 'じゅう') return 'じゅっ'
    if (reading === 'じゅっ') return 'じゅっ' // already geminated
    if (reading === 'いっ') return 'いっ'
    if (reading === 'ろっ') return 'ろっ'
    if (reading === 'はっ') return 'はっ'
  }
  // Match hiragana s sounds (さしすせそ) + Latin s
  if (/^[さしすせそs]/.test(nextSound)) {
    if (reading === 'いち') return 'いっ'
    if (reading === 'はち') return 'はっ'
  }
  return reading
}

/** Apply rendaku / gemination between two adjacent kana readings.
 *  Handles: さん+ひゃく→さんびゃく, ろく+ひゃく→ろっぴゃく, etc. */
function joinWithSoundChange(prev: string, next: string): string {
  // 1. Apply multiplier sound changes (rendaku on 百/千)
  let resolvedNext = next
  if (MULTIPLIER_SOUND_CHANGES[next]) {
    const changed = MULTIPLIER_SOUND_CHANGES[next][prev]
    if (changed) resolvedNext = changed
  }

  // 2. Geminate numeral before p/b/s sounds
  const resolvedPrev = geminateNumeral(prev, resolvedNext)

  return resolvedPrev + resolvedNext
}

// ── Counter kanji → readings (with context-dependent variants) ──

interface CounterReadings {
  /** Default reading */
  default: string
  /** Sound-change rules: which preceding numeral readings trigger which variant */
  variants?: Record<string, { triggers: string[]; reading: string }>
}

const COUNTERS: Record<string, CounterReadings> = {
  '月': {
    default: 'げつ',
    variants: {
      'がつ': { triggers: ['し', 'く', 'ご', 'しち', 'はち', 'じゅう'], reading: 'がつ' },
    },
  },
  '日': { default: 'にち' },
  '時': { default: 'じ' },
  '分': {
    default: 'ふん',
    variants: {
      'ぷん': { triggers: ['いっ', 'ろっ', 'はっ', 'じゅっ', 'さん', 'よん', 'なん'], reading: 'ぷん' },
    },
  },
  '秒': { default: 'びょう' },
  '年': { default: 'ねん' },
  '回': { default: 'かい' },
  '冊': { default: 'さつ' },
  '枚': { default: 'まい' },
  '本': {
    default: 'ほん',
    variants: {
      'ぼん': { triggers: ['さん', 'なん'], reading: 'ぼん' },
      'ぽん': { triggers: ['いっ', 'ろっ', 'はっ', 'じゅっ'], reading: 'ぽん' },
    },
  },
  '匹': {
    default: 'ひき',
    variants: {
      'びき': { triggers: ['さん', 'なん'], reading: 'びき' },
      'ぴき': { triggers: ['いっ', 'ろっ', 'はっ', 'じゅっ'], reading: 'ぴき' },
    },
  },
  '人': { default: 'にん' },
  '歳': { default: 'さい' },
  '階': { default: 'かい' },
  '円': { default: 'えん' },
  '個': { default: 'こ' },
  '台': { default: 'だい' },
  '頭': {
    default: 'とう',
    variants: {
      'どう': { triggers: ['さん', 'なん'], reading: 'どう' },
    },
  },
  '杯': {
    default: 'はい',
    variants: {
      'ばい': { triggers: ['さん', 'なん'], reading: 'ばい' },
      'ぱい': { triggers: ['いっ', 'ろっ', 'はっ', 'じゅっ'], reading: 'ぱい' },
    },
  },
}

// ── Parse a word into numeral(s) + counter ──

interface ParsedNumber {
  numerals: string[]       // list of numeral kanji in order
  counter: string | null   // trailing counter kanji, if any
}

function parseNumberWord(word: string): ParsedNumber | null {
  let i = 0
  const numerals: string[] = []
  const multipliers = new Set(['十', '百', '千', '万', '億', '兆'])

  while (i < word.length) {
    // Try multi-char: [numeral][multiplier] like 二十, 三百
    if (i + 1 < word.length) {
      const pair = word.slice(i, i + 2)
      if (multipliers.has(pair[1]) && NUMERALS[pair[0]]) {
        numerals.push(pair[0])
        numerals.push(pair[1])
        i += 2
        continue
      }
    }

    const ch = word[i]
    if (NUMERALS[ch]) {
      numerals.push(ch)
      i++
    } else if (COUNTERS[ch]) {
      return { numerals, counter: ch }
    } else {
      break
    }
  }

  // Check if trailing char is a counter we missed
  if (numerals.length > 0) {
    const last = word[word.length - 1]
    if (COUNTERS[last] && !numerals.includes(last)) {
      return { numerals, counter: last }
    }
  }

  return numerals.length > 0 ? { numerals, counter: null } : null
}

// ── Generate alternative readings ──

/** Get the geminated form of a numeral reading, if applicable.
 *  e.g. ろく→ろっ, じゅう→じゅっ, はち→はっ, いち→いっ */
function tryGeminate(reading: string): string | null {
  switch (reading) {
    case 'ろく': return 'ろっ'
    case 'じゅう': return 'じゅっ'
    case 'はち': return 'はっ'
    case 'いち': return 'いっ'
    default: return null
  }
}

/** Get the counter reading taking into account the preceding numeral reading.
 *  Also checks the geminated form of the numeral (e.g. ろく→ろっ) for
 *  counter variant triggers like 本→ぽん (trigger: ろっ). */
function counterToReading(counterKanji: string, prevReading: string): string {
  const entry = COUNTERS[counterKanji]
  if (!entry) return counterKanji

  const geminated = tryGeminate(prevReading)

  if (entry.variants) {
    for (const [reading, rule] of Object.entries(entry.variants)) {
      for (const trigger of rule.triggers) {
        if (prevReading.endsWith(trigger)) return reading
        if (geminated && geminated.endsWith(trigger)) return reading
      }
    }
  }

  return entry.default
}

/** Compose numeral kanji into an on'yomi reading with multiplier sound changes. */
function composeOnReading(numerals: string[]): string {
  let result = ''
  for (let i = 0; i < numerals.length; i++) {
    const on = NUMERALS[numerals[i]]?.on[0] || numerals[i]
    if (result.length === 0) {
      result = on
    } else {
      result = joinWithSoundChange(result, on)
    }
  }
  return result
}

/** Compose numeral kanji into a kun'yomi reading, replacing on'd numerals with
 *  their most-common kun form and applying multiplier sound changes. */
function composeKunReading(numerals: string[]): string {
  let result = ''
  for (let i = 0; i < numerals.length; i++) {
    const kun = NUMERALS[numerals[i]]?.kun[0] || NUMERALS[numerals[i]]?.on[0] || numerals[i]
    if (result.length === 0) {
      result = kun
    } else {
      result = joinWithSoundChange(result, kun)
    }
  }
  return result
}

/**
 * Generate alternative readings for a word containing kanji numerals.
 * Uses only the most-common on/kun variants — no cartesian noise.
 * The primary reading (from kuromoji/dict) is excluded from results.
 */
export function generateNumberAltReadings(word: string, primaryReading: string): string[] {
  if (!word || word.length < 2) return []

  const parsed = parseNumberWord(word)
  if (!parsed || parsed.numerals.length === 0) return []

  const results = new Set<string>()

  if (parsed.counter) {
    // Strategy 1: All-on'yomi (may differ from kuromoji's lexicalized reading)
    // e.g. 四月 → kuromoji gives しがつ, on'yomi would be しげつ (four months)
    const onReading = composeOnReading(parsed.numerals)
    const counterReading = counterToReading(parsed.counter, onReading)
    const fullOn = joinWithSoundChange(onReading, counterReading)
    if (fullOn && fullOn !== primaryReading) results.add(fullOn)

    // If counter has variant readings, try those too
    // e.g. 月: default=げつ, variant がつ after し/く/ご...
    const entry = COUNTERS[parsed.counter]
    if (entry?.variants) {
      for (const [varReading, rule] of Object.entries(entry.variants)) {
        for (const trigger of rule.triggers) {
          if (onReading.endsWith(trigger)) {
            const fullVar = joinWithSoundChange(onReading, varReading)
            if (fullVar && fullVar !== primaryReading && fullVar !== fullOn) {
              results.add(fullVar)
            }
            break // one match per variant is enough
          }
        }
      }
    }

    // Strategy 2: Kun'yomi numerals (most-common variant only)
    // e.g. 四月 → よんげつ (four months / alt April reading)
    const kunReading = composeKunReading(parsed.numerals)
    const counterKun = counterToReading(parsed.counter, kunReading)
    const fullKun = joinWithSoundChange(kunReading, counterKun)
    if (fullKun && fullKun !== primaryReading && fullKun !== fullOn) results.add(fullKun)

    // Also try kun with counter variants
    if (entry?.variants) {
      for (const [varReading, rule] of Object.entries(entry.variants)) {
        for (const trigger of rule.triggers) {
          if (kunReading.endsWith(trigger)) {
            const fullVar = joinWithSoundChange(kunReading, varReading)
            if (fullVar && fullVar !== primaryReading && fullVar !== fullKun) {
              results.add(fullVar)
            }
            break
          }
        }
      }
    }
  } else {
    // No counter — numeral compound (e.g. 二十, 三百五十)
    const onReading = composeOnReading(parsed.numerals)
    if (onReading && onReading !== primaryReading) results.add(onReading)

    const kunReading = composeKunReading(parsed.numerals)
    if (kunReading && kunReading !== primaryReading && kunReading !== onReading) results.add(kunReading)
  }

  return Array.from(results).slice(0, 4)
}

/** Check if a word contains any kanji numerals. */
export function containsNumerals(word: string): boolean {
  for (const ch of word) {
    if (NUMERALS[ch]) return true
  }
  return false
}

// ── Exported helpers for furigana token merging ──

const NUMERAL_KEYS = new Set(Object.keys(NUMERALS))
const COUNTER_KEYS = new Set(Object.keys(COUNTERS))

/** Check if a single character is a kanji numeral (一, 二, 三, …, 十, 百, 千, etc.) */
export function isNumeralChar(ch: string): boolean {
  return NUMERAL_KEYS.has(ch)
}

/** Check if a single character is a counter kanji (人, 年, 月, 日, 時, 分, 回, etc.) */
export function isCounterChar(ch: string): boolean {
  return COUNTER_KEYS.has(ch)
}

/**
 * Special irregular readings for numeral+counter compounds
 * that can't be derived from regular sound-change rules.
 */
const SPECIAL_COUNTER_READINGS: Record<string, string> = {
  '一人': 'ひとり',
  '二人': 'ふたり',
  '二十歳': 'はたち',
  '一日': 'ついたち',
  '二日': 'ふつか',
  '三日': 'みっか',
  '四日': 'よっか',
  '五日': 'いつか',
  '六日': 'むいか',
  '七日': 'なのか',
  '八日': 'ようか',
  '九日': 'ここのか',
  '十日': 'とおか',
  '十四日': 'じゅうよっか',
  '二十日': 'はつか',
  '二十四日': 'にじゅうよっか',
}

/** Check if a string contains only ASCII Arabic digits. */
export function isArabicDigits(s: string): boolean {
  if (!s || s.length === 0) return false
  return /^[0-9]+$/.test(s)
}

/**
 * Convert an Arabic digit to its Japanese reading in a year/date context.
 * Uses the preferred readings for 4 (よん), 7 (なな), 9 (きゅう).
 */
function arabicDigitToJapanese(digit: number, position: number): string {
  if (digit === 0) return ''

  const placeNames = ['', 'じゅう', 'ひゃく', 'せん', 'まん', 'じゅうまん', 'ひゃくまん']

  // Digit readings in year context (avoid し, しち, く)
  const digitReadings: Record<number, string> = {
    1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご',
    6: 'ろく', 7: 'なな', 8: 'はち', 9: 'きゅう',
  }

  const digitReading = digitReadings[digit] || ''
  const placeReading = placeNames[position] || ''

  if (!digitReading) return ''

  // Special: 100 and 1000 drop the いち prefix
  if (digit === 1 && position >= 2) {
    return placeReading
  }

  return digitReading + placeReading
}

/**
 * Convert an Arabic numeral string to Japanese reading.
 * e.g. "2024" → "にせんにじゅうよん"
 * Handles numbers up to 9999 (enough for years).
 */
export function arabicToJapaneseReading(numStr: string): string {
  // Trim leading zeros
  const cleaned = numStr.replace(/^0+/, '')
  if (cleaned === '') return 'ぜろ'

  const len = cleaned.length
  if (len > 4) {
    // For numbers > 9999, just read each digit for simplicity
    const digitReadings: Record<string, string> = {
      '0': 'ぜろ', '1': 'いち', '2': 'に', '3': 'さん', '4': 'よん',
      '5': 'ご', '6': 'ろく', '7': 'なな', '8': 'はち', '9': 'きゅう',
    }
    return [...cleaned].map(d => digitReadings[d] || d).join(' ')
  }

  const parts: string[] = []
  for (let i = 0; i < len; i++) {
    const digit = parseInt(cleaned[i])
    const position = len - 1 - i // ones=0, tens=1, hundreds=2, thousands=3
    const reading = arabicDigitToJapanese(digit, position)
    if (reading) parts.push(reading)
  }

  return parts.join('')
}

/**
 * Resolve the reading for a numeral+counter compound word.
 * e.g. 一人→ひとり, 二人→ふたり, 三人→さんにん, 四年→よねん, 六本→ろっぽん
 * Also handles Arabic numeral years: 2024年→にせんにじゅうよねん
 * Returns the hiragana reading, or null if the word can't be parsed.
 */
export function resolveCounterCompound(word: string): string | null {
  if (SPECIAL_COUNTER_READINGS[word]) {
    return SPECIAL_COUNTER_READINGS[word]
  }

  const parsed = parseNumberWord(word)
  if (!parsed) return null

  if (parsed.counter) {
    // Use kun'yomi for numerals (more natural for counters in everyday use)
    const kunReading = composeKunReading(parsed.numerals)
    const counterReading = counterToReading(parsed.counter, kunReading)
    const resolved = joinWithSoundChange(kunReading, counterReading)

    // Filter out cases where the resolution doesn't improve on kuromoji
    if (!resolved || resolved === word) return null

    return resolved
  }

  // Pure numeral compound (no counter) — return on'yomi reading
  // e.g. 二十→にじゅう, 三百五十→さんびゃくごじゅう
  const onReading = composeOnReading(parsed.numerals)
  return onReading || null
}

/**
 * Resolve the reading for an Arabic digit + counter compound (e.g. "2024年").
 * Returns the hiragana reading or null if not applicable.
 * Handles counter sound changes via counterToReading (e.g. 4分→よんぷん).
 */
export function resolveArabicCounterCompound(digits: string, counterKanji: string): string | null {
  const counterEntry = COUNTERS[counterKanji]
  if (!counterEntry) return null

  const numberReading = arabicToJapaneseReading(digits)
  if (!numberReading) return null

  // Use counterToReading for proper variant handling (よん→ぷん, etc.)
  const counterReading = counterToReading(counterKanji, numberReading)

  // For 年 (year), append the specific year suffix ねん
  // e.g. 2024年 → にせんにじゅうよねん
  if (counterKanji === '年') {
    return numberReading + 'ねん'
  }

  return numberReading + counterReading
}
