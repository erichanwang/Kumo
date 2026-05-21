// Subscription & Feature Gate System for Kumo
// The extension checks against Supabase for the user's tier,
// enforces limits locally, and caches results briefly.
//
// Tiers:
//   free - Word bank: 1000 entries, Subtitle furigana: 100 words/session, SRS: 10 cards/day
//   pro  - Unlimited everything
//
// Pricing (from app/src/sections/Pricing.tsx):
//   Weekly:   $0.99
//   Monthly:  $2.99
//   Yearly:   $24.99 ($2.08/mo)

import { getSupabaseClient, isLoggedIn, getSession } from './auth'
import type { Settings } from './storage'

// --- Limits ---
export const LIMITS = {
  free: {
    wordBankMax: 1000,
    subtitleWordsPerSession: 100,
    srsCardsPerDay: 10,
    sentenceMining: false,
    ankiExport: false,
  },
  pro: {
    wordBankMax: Infinity,
    subtitleWordsPerSession: Infinity,
    srsCardsPerDay: Infinity,
    sentenceMining: true,
    ankiExport: true,
  },
} as const

// --- In-memory cache ---
let cachedTier: 'free' | 'pro' = 'free'
let cachedSubtitleWordsUsed = 0
let tierLastFetched = 0
const TIER_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let settingsRef: Settings | null = null

/** Initialize with current settings. */
export function initSubscription(settings: Settings): void {
  settingsRef = settings
}

/** Update settings reference (called on storage changes). */
export function updateSettings(settings: Settings): void {
  settingsRef = settings
}

/** Reset subtitle word counter (called when captions are refreshed or session starts). */
export function resetSubtitleWordCounter(): void {
  cachedSubtitleWordsUsed = 0
}

/** Increment subtitle word counter. */
export function incrementSubtitleWordCount(n = 1): void {
  cachedSubtitleWordsUsed += n
}

/**
 * Fetch the current user's subscription tier from Supabase.
 * Caches for TIER_CACHE_TTL_MS to avoid excessive API calls.
 */
async function fetchTier(): Promise<'free' | 'pro'> {
  const now = Date.now()
  if (now - tierLastFetched < TIER_CACHE_TTL_MS && isLoggedIn()) {
    return cachedTier
  }

  // Not logged in = free
  if (!isLoggedIn()) {
    cachedTier = 'free'
    tierLastFetched = now
    return 'free'
  }

  try {
    const supabase = getSupabaseClient()
    const session = getSession()
    if (!session) {
      cachedTier = 'free'
      tierLastFetched = now
      return 'free'
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.debug('Kumo: Failed to fetch subscription tier:', error.message)
      // On error, keep the current cached value, or default to free
      if (!tierLastFetched) cachedTier = 'free'
    } else if (data?.subscription_tier === 'pro') {
      cachedTier = 'pro'
    } else {
      cachedTier = 'free'
    }
  } catch (e) {
    console.debug('Kumo: Error fetching subscription tier:', e)
    if (!tierLastFetched) cachedTier = 'free'
  }

  tierLastFetched = now
  return cachedTier
}

/**
 * Get the current tier (sync, from cache or last fetch).
 * If cache is stale and user is logged in, triggers a background refresh.
 */
export function getTierSync(): 'free' | 'pro' {
  // If cache is stale and user is logged in, fire-and-forget a refresh
  if (isLoggedIn() && Date.now() - tierLastFetched > TIER_CACHE_TTL_MS) {
    fetchTier().catch(() => {})
  }
  return cachedTier
}

/** Force refresh the tier from the server. */
export async function refreshTier(): Promise<'free' | 'pro'> {
  tierLastFetched = 0
  return fetchTier()
}

/** Get the current effective limit for a given resource. */
export function getLimit(resource: keyof typeof LIMITS.free): number {
  const tier = getTierSync()
  return LIMITS[tier][resource] as number
}

/** Get boolean feature availability. */
export function hasFeature(feature: keyof typeof LIMITS.free): boolean {
  const tier = getTierSync()
  return !!LIMITS[tier][feature]
}

// --- Feature check helpers ---

export function isWordBankFull(currentSize: number): boolean {
  return currentSize >= getLimit('wordBankMax')
}

export function canShowSubtitleFurigana(): boolean {
  if (getTierSync() === 'pro') return true
  // Offline mode bypasses the subtitle limit (no API lookups = less value from captions)
  if (settingsRef?.offlineMode) return true
  return cachedSubtitleWordsUsed < getLimit('subtitleWordsPerSession')
}

export function canAddSrsCard(currentCardsToday: number): boolean {
  return currentCardsToday < getLimit('srsCardsPerDay')
}

export function canMineSentence(): boolean {
  return hasFeature('sentenceMining')
}

export function canExportAnki(): boolean {
  return hasFeature('ankiExport')
}

/**
 * Get a human-readable description of the current plan limits.
 * Used for the popup plan display.
 */
export function getPlanSummary(): { name: string; wordBankLimit: string; subtitleLimit: string; srsLimit: string; features: string[] } {
  const tier = getTierSync()
  if (tier === 'pro') {
    return {
      name: 'Pro',
      wordBankLimit: 'Unlimited',
      subtitleLimit: 'Unlimited',
      srsLimit: 'Unlimited',
      features: ['Unlimited word bank', 'Unlimited subtitle furigana', 'SRS flashcards', 'Sentence mining', 'Anki export', 'Priority support'],
    }
  }
  return {
    name: 'Free',
    wordBankLimit: `${LIMITS.free.wordBankMax.toLocaleString()} entries`,
    subtitleLimit: `${LIMITS.free.subtitleWordsPerSession} words/session`,
    srsLimit: `${LIMITS.free.srsCardsPerDay} cards/day`,
    features: ['Basic furigana', 'Hover popup definitions', 'Limited SRS', 'JLPT progress', 'CSV export'],
  }
}
