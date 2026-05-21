// API-based dictionary lookup for Kumo
// Fetches definitions from Jisho.org API with local caching
// Falls back gracefully when offline or API is unavailable

export interface ApiDictEntry {
  word: string
  reading: string
  altReadings: string[]   // alternate readings for the same word (e.g. 上手 → うわて, かみて)
  definitions: string[]
  jlpt: string | null
  pos: string[]
  isName: boolean
  _cachedAt?: number
}

// In-memory cache to avoid repeated storage reads
const cache = new Map<string, ApiDictEntry>()
const CACHE_PREFIX = 'kumo_dict_'

// Rate limiting: max 1 request per 200ms to be nice to Jisho
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 200

interface JishoResult {
  slug: string
  is_common: boolean | null
  japanese: Array<{
    word: string
    reading: string
  }>
  senses: Array<{
    english_definitions: string[]
    parts_of_speech: string[]
    tags: string[]
  }>
  jlpt: string[]
}

let apiLookupsPaused = false

/** Pause/resume remote API lookups (for offline mode). */
export function setApiLookupsPaused(paused: boolean): void {
  apiLookupsPaused = paused
}

export async function lookupWordWithApi(word: string): Promise<ApiDictEntry | null> {
  // If API lookups are paused (offline mode), skip entirely
  if (apiLookupsPaused) return null

  // Check memory cache first
  if (cache.has(word)) return cache.get(word)!

  // Check storage cache
  const storageKey = CACHE_PREFIX + word
  try {
    const stored = await chrome.storage.local.get(storageKey)
    if (stored[storageKey]) {
      const entry = stored[storageKey] as ApiDictEntry
      cache.set(word, entry)
      return entry
    }
  } catch {
    // Storage error — skip cache
  }

  // Rate limiting
  const now = Date.now()
  const timeSinceLast = now - lastRequestTime
  if (timeSinceLast < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLast))
  }
  lastRequestTime = Date.now()

  try {
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`
    const data = await fetchWithCorsProxy(url)
    const result = parseJishoResponse(data, word)
    if (!result) return null

    // Cache in memory and storage
    cache.set(word, result)
    try {
      // Only cache if storage isn't full — set a TTL of 7 days
      await chrome.storage.local.set({
        [storageKey]: { ...result, _cachedAt: Date.now() }
      })
    } catch {
      // Storage full or quota exceeded — memory cache is enough for this session
    }

    return result
  } catch (e) {
    console.debug('Kumo: API lookup failed for', word, e)
    return null
  }
}

/**
 * Fetch from Jisho API, routing through the background service worker for CORS.
 * Falls back to direct fetch if running outside an extension context.
 */
async function fetchWithCorsProxy(url: string): Promise<any> {
  // If we have chrome.runtime, try routing through background worker
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'FETCH_DICT',
        url
      })
      if (result?.error) throw new Error(result.error)
      return result?.data || null
    } catch (e) {
      // If background proxy fails, try direct fetch as fallback
      console.debug('Kumo: Background proxy failed, trying direct fetch:', e)
    }
  }

  // Direct fetch fallback (works in popup pages, may not work in content scripts)
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) return null
  return await response.json()
}

function parseJishoResponse(data: any, word: string): ApiDictEntry | null {
  if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
    return null
  }

  // Find the best matching result
  const results = data.data as JishoResult[]

  // Prefer result where the word matches exactly
  let bestResult: JishoResult | null = null
  for (const r of results) {
    const jp = r.japanese?.[0]
    if (jp?.word === word || jp?.reading === word) {
      bestResult = r
      break
    }
  }
  if (!bestResult) {
    bestResult = results[0]
  }

  const japaneseEntries = bestResult.japanese || []
  const jp = japaneseEntries[0]
  if (!jp) return null

  // Collect alternate readings from Jisho's japanese array (e.g. 上手 → うわて, かみて)
  const altReadings: string[] = []
  const primaryReading = jp.reading || ''
  for (let i = 1; i < japaneseEntries.length; i++) {
    const alt = japaneseEntries[i].reading
    if (alt && alt !== primaryReading && !altReadings.includes(alt)) {
      altReadings.push(alt)
    }
  }

  // Collect definitions from all senses
  const definitions: string[] = []
  const posTags: string[] = []
  for (const sense of bestResult.senses || []) {
    for (const def of sense.english_definitions || []) {
      if (!definitions.includes(def)) {
        definitions.push(def)
      }
    }
    for (const pos of sense.parts_of_speech || []) {
      if (!posTags.includes(pos)) {
        posTags.push(pos)
      }
    }
  }

  // JLPT level
  const jlptLevels = bestResult.jlpt || []
  const jlpt = jlptLevels.length > 0
    ? jlptLevels[0].replace('jlpt-', '').toUpperCase()
    : null

  const isName = posTags.some(p =>
    p.includes('proper noun') || p.includes('name') || p.includes(' surname')
  )

  return {
    word: jp.word || word,
    reading: primaryReading,
    altReadings,
    definitions: definitions.slice(0, 5),
    jlpt,
    pos: posTags.slice(0, 3),
    isName
  }
}

// Bulk cache cleanup — remove old entries
export async function cleanDictCache(): Promise<void> {
  try {
    const all = await chrome.storage.local.get(null)
    const prefixLen = CACHE_PREFIX.length
    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

    for (const key of Object.keys(all)) {
      if (key.startsWith(CACHE_PREFIX)) {
        const entry = all[key] as any
        if (entry._cachedAt && now - entry._cachedAt > SEVEN_DAYS) {
          await chrome.storage.local.remove(key)
          cache.delete(key.slice(prefixLen))
        }
      }
    }
  } catch {
    // Best-effort cleanup
  }
}

// Clear all cached dictionary data
export async function clearDictCache(): Promise<void> {
  try {
    const all = await chrome.storage.local.get(null)
    const keys = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX))
    if (keys.length > 0) {
      await chrome.storage.local.remove(keys)
    }
    cache.clear()
  } catch {
    // Best-effort
  }
}
