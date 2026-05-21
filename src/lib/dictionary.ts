// Dictionary lookup for Kumo
// Uses pre-processed JMdict and KanjiDic2 JSON data

import jmdictData from '../data/jmdict.json'
import kanjidicData from '../data/kanjidic.json'
import namesData from '../data/names.json'

// Type for the names database
type NameRecord = Record<string, {
  reading: string
  type: string
  meaning: string
}>

export interface DictEntry {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  pos: string
}

export interface KanjiEntry {
  kanji: string
  on: string[]
  kun: string[]
  nanori: string[]
  meanings: string[]
  jlpt: string | null
  strokes: number
}

type JmdictRecord = Record<string, {
  reading: string
  definitions: string[]
  jlpt?: string | null
  pos: string
}>

type KanjidicRecord = Record<string, {
  on: string[]
  kun: string[]
  nanori?: string[]
  meanings: string[]
  jlpt?: string | null
  strokes: number
}>

export function lookupWord(word: string): DictEntry | null {
  const data = jmdictData as JmdictRecord
  const entry = data[word]
  if (!entry) return null
  return {
    word,
    reading: entry.reading,
    definitions: entry.definitions,
    jlpt: entry.jlpt ?? null,
    pos: entry.pos
  }
}

export function lookupKanji(kanji: string): KanjiEntry | null {
  const data = kanjidicData as KanjidicRecord
  const entry = data[kanji]
  if (!entry) return null
  const nanori = getNameReadingsForKanji(kanji)
  return {
    kanji,
    on: entry.on,
    kun: entry.kun,
    nanori,
    meanings: entry.meanings,
    jlpt: entry.jlpt ?? null,
    strokes: entry.strokes
  }
}

export function getKunyomi(kunReadings: string[]): string {
  // Return the most common kun reading (first one, removing okurigana markers)
  if (kunReadings.length === 0) return ''
  return kunReadings[0].replace(/\./g, '')
}

export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

// Radical information for kanji (simplified lookup)
export function getRadicalInfo(kanji: string): { radical: string; name: string } | null {
  const entry = lookupKanji(kanji)
  if (!entry) return null
  // Return the first radical-like component (simplified)
  return {
    radical: kanji,
    name: entry.meanings[0] || ''
  }
}

export function getDefinitionSummary(entry: { definitions: string[] }): string {
  return entry.definitions.join(', ')
}

export function lookupWordBatch(words: string[]): Map<string, DictEntry> {
  const results = new Map<string, DictEntry>()
  for (const word of words) {
    const entry = lookupWord(word)
    if (entry) results.set(word, entry)
  }
  return results
}

// --- Name database lookup ---

export interface NameEntry {
  reading: string
  type: string
  meaning: string
}

/** Look up a name in the built-in name database. */
export function lookupName(word: string): NameEntry | null {
  const data = namesData as NameRecord
  const entry = data[word]
  if (!entry) return null
  return {
    reading: entry.reading,
    type: entry.type,
    meaning: entry.meaning
  }
}

/** Check if a word exists in the names database or if kuromoji flagged it as a proper noun. */
export function isProperNoun(word: string): boolean {
  const data = namesData as NameRecord
  return word in data
}

/** Get a display label for a name type from the names database. */
export function getNameTypeDisplayLabel(nameType: string): string {
  switch (nameType) {
    case 'surname': return 'Surname'
    case 'person': return 'Person'
    case 'place': return 'Place'
    case 'other': return 'Name'
    default: return 'Name'
  }
}

/**
 * Derive approximate nanori (name) readings for a kanji from the names database.
 * Searches all names containing this kanji and collects their readings.
 * These are approximations — treat as suggestions, not definitive readings.
 * Results are lazily cached at module level for performance.
 */
const nanoriCache = new Map<string, string[]>()
export function getNameReadingsForKanji(kanji: string): string[] {
  if (nanoriCache.has(kanji)) return nanoriCache.get(kanji)!
  const data = namesData as NameRecord
  const readings = new Set<string>()
  for (const [name, entry] of Object.entries(data)) {
    if (name.includes(kanji)) {
      readings.add(entry.reading)
    }
  }
  const result = Array.from(readings).slice(0, 5)
  nanoriCache.set(kanji, result)
  return result
}
