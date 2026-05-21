// Progress tracking for Kumo
// Streaks, daily goals, reading speed, and session stats

export interface DailyStats {
  date: string                   // YYYY-MM-DD
  wordsLookedUp: number
  wordsSaved: number
  wordsMarkedKnown: number
  srsReviewsCompleted: number
  srsReviewsCorrect: number
  sentencesMined: number
  charactersRead: number
  pagesVisited: string[]         // unique domains
  timeSpentSeconds: number
}

export interface Progress {
  dailyStats: Record<string, DailyStats>    // date -> stats
  streakStart: string | null                // YYYY-MM-DD of first day in current streak
  streakEnd: string | null                  // YYYY-MM-DD of last day in current streak
  longestStreak: number
  totalWordsLearned: number
  totalReviewsDone: number
  readingSpeedWpm: number                   // words per minute (rolling average)
  sessions: SessionRecord[]
}

export interface SessionRecord {
  startTime: number
  endTime: number
  pagesVisited: string[]
  wordsLookedUp: number
  charactersRead: number
}

const DEFAULT_PROGRESS: Progress = {
  dailyStats: {},
  streakStart: null,
  streakEnd: null,
  longestStreak: 0,
  totalWordsLearned: 0,
  totalReviewsDone: 0,
  readingSpeedWpm: 0,
  sessions: []
}

// --- Storage ---

export async function loadProgress(): Promise<Progress> {
  const result = await chrome.storage.local.get('progress')
  return { ...DEFAULT_PROGRESS, ...result.progress }
}

export async function saveProgress(progress: Progress): Promise<void> {
  await chrome.storage.local.set({ progress })
}

// --- In-memory session tracking (not persisted until end) ---

let currentSession: SessionRecord | null = null
let sessionStartTime: number = Date.now()
let sessionCharsRead: number = 0
let sessionWordsLookedUp: number = 0
let sessionPages: Set<string> = new Set()

export function startSession(): void {
  sessionStartTime = Date.now()
  sessionCharsRead = 0
  sessionWordsLookedUp = 0
  sessionPages.clear()
  const domain = getCurrentDomain()
  if (domain) trackPageVisit(domain)
}

export function trackPageVisit(domain: string): void {
  sessionPages.add(domain)
}

export function trackCharactersRead(count: number): void {
  sessionCharsRead += count
}

export function trackWordLookup(): void {
  sessionWordsLookedUp++
}

export async function endSession(): Promise<SessionRecord> {
  const record: SessionRecord = {
    startTime: sessionStartTime,
    endTime: Date.now(),
    pagesVisited: [...sessionPages],
    wordsLookedUp: sessionWordsLookedUp,
    charactersRead: sessionCharsRead
  }

  const progress = await loadProgress()
  progress.sessions.push(record)
  // Keep only last 50 sessions
  if (progress.sessions.length > 50) {
    progress.sessions = progress.sessions.slice(-50)
  }
  await saveProgress(progress)

  // Reset
  startSession()

  return record
}

export function getSessionStats(): { charsRead: number; wordsLookedUp: number; pages: string[]; elapsedMs: number } {
  return {
    charsRead: sessionCharsRead,
    wordsLookedUp: sessionWordsLookedUp,
    pages: [...sessionPages],
    elapsedMs: Date.now() - sessionStartTime
  }
}

// --- Daily tracking ---

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function recordDailyEvent(event: {
  type: 'wordsLookedUp' | 'wordsSaved' | 'wordsMarkedKnown' | 'srsReviewsCompleted' | 'srsReviewsCorrect' | 'sentencesMined' | 'charactersRead'
  count?: number
}): Promise<void> {
  const progress = await loadProgress()
  const key = todayKey()
  const count = event.count ?? 1

  if (!progress.dailyStats[key]) {
    progress.dailyStats[key] = createEmptyDailyStats(key)
  }

  switch (event.type) {
    case 'wordsLookedUp': progress.dailyStats[key].wordsLookedUp += count; break
    case 'wordsSaved': progress.dailyStats[key].wordsSaved += count; break
    case 'wordsMarkedKnown': progress.dailyStats[key].wordsMarkedKnown += count; break
    case 'srsReviewsCompleted': progress.dailyStats[key].srsReviewsCompleted += count; break
    case 'srsReviewsCorrect': progress.dailyStats[key].srsReviewsCorrect += count; break
    case 'sentencesMined': progress.dailyStats[key].sentencesMined += count; break
    case 'charactersRead': progress.dailyStats[key].charactersRead += count; break
  }

  // Track pages visited
  const domain = getCurrentDomain()
  if (domain && !progress.dailyStats[key].pagesVisited.includes(domain)) {
    progress.dailyStats[key].pagesVisited.push(domain)
  }

  await saveProgress(progress)
}

export async function updateStreak(): Promise<void> {
  const progress = await loadProgress()
  const today = todayKey()
  const yesterday = yesterdayKey()

  if (progress.streakEnd === today) return // Already recorded today

  if (progress.streakEnd === yesterday || progress.streakEnd === null) {
    // Continuing or starting streak
    if (!progress.streakStart) {
      progress.streakStart = today
    }
    progress.streakEnd = today
    const streakLength = getStreakLength(progress.streakStart, today)
    if (streakLength > progress.longestStreak) {
      progress.longestStreak = streakLength
    }
  } else {
    // Streak broken — start new
    progress.streakStart = today
    progress.streakEnd = today
  }

  await saveProgress(progress)
}

export function getStreakLength(start: string, end: string): number {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function createEmptyDailyStats(date: string): DailyStats {
  return {
    date,
    wordsLookedUp: 0,
    wordsSaved: 0,
    wordsMarkedKnown: 0,
    srsReviewsCompleted: 0,
    srsReviewsCorrect: 0,
    sentencesMined: 0,
    charactersRead: 0,
    pagesVisited: [],
    timeSpentSeconds: 0
  }
}

// --- Reading speed ---

export async function updateReadingSpeed(charactersRead: number, timeMs: number): Promise<void> {
  const progress = await loadProgress()
  // Convert characters to approximate words (Japanese: ~1.5 chars per word)
  const wordsRead = charactersRead / 1.5
  const minutes = timeMs / 60000
  if (minutes < 0.1) return // Not enough data

  const newWpm = wordsRead / minutes

  // Rolling average (80% old, 20% new)
  progress.readingSpeedWpm = progress.readingSpeedWpm
    ? Math.round(progress.readingSpeedWpm * 0.8 + newWpm * 0.2)
    : Math.round(newWpm)

  await saveProgress(progress)
}

// --- Totals ---

export async function incrementTotalWordsLearned(): Promise<void> {
  const progress = await loadProgress()
  progress.totalWordsLearned++
  await saveProgress(progress)
}

export async function incrementTotalReviewsDone(): Promise<void> {
  const progress = await loadProgress()
  progress.totalReviewsDone++
  await saveProgress(progress)
}

// --- Get today's stats ---

export async function getTodayStats(): Promise<DailyStats | null> {
  const progress = await loadProgress()
  return progress.dailyStats[todayKey()] || null
}

export async function getCurrentStreak(): Promise<number> {
  const progress = await loadProgress()
  if (!progress.streakStart || !progress.streakEnd) return 0
  return getStreakLength(progress.streakStart, progress.streakEnd)
}

function getCurrentDomain(): string | null {
  try {
    return window.location.hostname || null
  } catch {
    return null
  }
}
