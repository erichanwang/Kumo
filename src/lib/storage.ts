// Storage layer for Kumo
// Wraps Chrome Storage API with typed helpers and in-memory caching

export interface WordEntry {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  savedAt: number
  sourceUrl: string
  known: boolean
  starred: boolean
  seenCount: number
}

export interface Settings {
  furiganaEnabled: boolean
  youtubeEnabled: boolean
  autoPauseOnUnknown: boolean
  showRomaji: boolean
  showKatakanaFurigana: boolean
  dualSubtitleEnabled: boolean
  furiganaColor: string
  hideKnownFurigana: boolean
  offlineMode: boolean
  autoPlayAudio: boolean
  /** Opacity of the hover card background (0.0–1.0) */
  cardOpacity: number
  /** Whether the hover popup card appears on hover */
  showPopupCard: boolean
  /** Furigana ruby text size: 'small' | 'medium' | 'large' */
  furiganaSize: 'small' | 'medium' | 'large'
  /** Show furigana readings above kanji numerals (一, 二, 三, etc.) */
  showNumberFurigana: boolean
  /** Daily SRS review limit */
  srsCardsPerDay: number
}

// --- Word Bank ---

export async function saveWord(entry: WordEntry): Promise<void> {
  const bank = await getWordBank()
  bank[entry.word] = entry
  await chrome.storage.local.set({ wordBank: bank })
  // Update cache
  if (entry.known) knownCache.add(entry.word)
}

export async function getWordBank(): Promise<Record<string, WordEntry>> {
  const result = await chrome.storage.local.get('wordBank')
  return result.wordBank ?? {}
}

export async function removeWord(word: string): Promise<void> {
  const bank = await getWordBank()
  delete bank[word]
  knownCache.delete(word)
  await chrome.storage.local.set({ wordBank: bank })
}

export async function markKnown(word: string, dictInfo?: { reading?: string; definitions?: string[]; jlpt?: string | null }): Promise<void> {
  const bank = await getWordBank()
  const entry = bank[word]
  if (entry) {
    entry.known = true
    knownCache.add(word)
    await chrome.storage.local.set({ wordBank: bank })
  } else {
    // Word not in bank yet — save it with provided dict info
    await saveWord({
      word,
      reading: dictInfo?.reading || '',
      definitions: dictInfo?.definitions || [],
      jlpt: dictInfo?.jlpt || null,
      savedAt: Date.now(),
      sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      known: true,
      starred: false,
      seenCount: 1
    })
  }
}

/** Remove a word from the known set without deleting it from the word bank. */
export async function unmarkKnown(word: string): Promise<void> {
  const bank = await getWordBank()
  const entry = bank[word]
  if (entry) {
    entry.known = false
    knownCache.delete(word)
    await chrome.storage.local.set({ wordBank: bank })
  }
  // If word isn't in bank, there's nothing to unmark
}

/** Check if a word exists in the word bank at all. */
export async function isInWordBank(word: string): Promise<boolean> {
  const bank = await getWordBank()
  return word in bank
}

export async function markStarred(word: string, starred: boolean): Promise<void> {
  const bank = await getWordBank()
  const entry = bank[word]
  if (entry) {
    entry.starred = starred
    await chrome.storage.local.set({ wordBank: bank })
  }
}

export async function incrementSeenCount(word: string): Promise<void> {
  const bank = await getWordBank()
  const entry = bank[word]
  if (entry) {
    entry.seenCount = (entry.seenCount || 0) + 1
    await chrome.storage.local.set({ wordBank: bank })
  }
}

// --- Known Cache (sync, in-memory) ---

let knownCache = new Set<string>()

export function isKnownSync(word: string): boolean {
  return knownCache.has(word)
}

export async function refreshKnownCache(): Promise<void> {
  const bank = await getWordBank()
  knownCache = new Set(
    Object.entries(bank)
      .filter(([, entry]) => entry.known)
      .map(([word]) => word)
  )
}

// --- Settings ---

const DEFAULT_SETTINGS: Settings = {
  furiganaEnabled: true,
  youtubeEnabled: true,
  autoPauseOnUnknown: false,
  showRomaji: false,
  showKatakanaFurigana: false,
  dualSubtitleEnabled: false,
  furiganaColor: '#e8a000',
  hideKnownFurigana: false,
  offlineMode: false,
  autoPlayAudio: true,
  cardOpacity: 1.0,
  showPopupCard: true,
  furiganaSize: 'medium',
  showNumberFurigana: true,
  srsCardsPerDay: 20
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings')
  return { ...DEFAULT_SETTINGS, ...result.settings }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings })
}

// --- SRS / Sentence / Progress types re-exported for convenience ---
// Primary definitions live in their respective modules

export type { SrsCard } from './srs'
export type { SavedSentence } from './sentences'
export type { DailyStats, Progress as ProgressData, SessionRecord } from './progress'

// --- Auth / Subscription State ---

export interface AuthState {
  userId: string | null
  email: string | null
  isLoggedIn: boolean
  updatedAt: number
  tier: 'free' | 'pro' | 'loading'
}

export const DEFAULT_AUTH_STATE: AuthState = {
  userId: null,
  email: null,
  isLoggedIn: false,
  updatedAt: 0,
  tier: 'free',
}

export async function getAuthState(): Promise<AuthState> {
  const result = await chrome.storage.local.get('kumoAuthState')
  return result.kumoAuthState ?? DEFAULT_AUTH_STATE
}

export async function setAuthState(state: AuthState): Promise<void> {
  await chrome.storage.local.set({ kumoAuthState: state })
}
