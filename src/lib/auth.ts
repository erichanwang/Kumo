// Supabase Auth integration for Kumo Chrome Extension
// Uses chrome.storage.local for session persistence (MV3 compatible)
// The content script reads auth state via chrome.storage, not directly

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════════════════
// Polyfill localStorage for MV3 service worker contexts.
// Supabase's GoTrue library internally references localStorage via BOTH
// method calls (localStorage.getItem) AND bracket notation
// (localStorage['sb-...-auth-token']) even when a custom storage adapter
// is provided. In MV3 service workers, localStorage is undefined and
// accessing it throws: "Cannot read properties of undefined (reading ...)"
// ══════════════════════════════════════════════════════════════════════
if (typeof localStorage === 'undefined') {
  const memoryStore = new Map<string, string>()
  ;(globalThis as any).localStorage = new Proxy({} as Storage, {
    get(_target: any, prop: string) {
      if (prop === 'getItem') return (k: string) => memoryStore.get(k) ?? null
      if (prop === 'setItem') return (k: string, v: string) => { memoryStore.set(k, v) }
      if (prop === 'removeItem') return (k: string) => { memoryStore.delete(k) }
      if (prop === 'key') return (i: number) => Array.from(memoryStore.keys())[i] ?? null
      if (prop === 'clear') return () => { memoryStore.clear() }
      if (prop === 'length') return memoryStore.size
      // Bracket-notation access: localStorage['sb-...-auth-token']
      if (typeof prop === 'string') return memoryStore.get(prop) ?? null
      return undefined
    },
    set(_target: any, prop: string, value: any) {
      if (typeof prop === 'string') memoryStore.set(prop, String(value))
      return true
    },
    deleteProperty(_target: any, prop: string) {
      if (typeof prop === 'string') memoryStore.delete(prop)
      return true
    },
    has(_target: any, prop: string) {
      return typeof prop === 'string' && memoryStore.has(prop)
    },
    ownKeys() {
      return Array.from(memoryStore.keys())
    },
  } as typeof localStorage)
}

// These must be set via your Supabase project dashboard.
// In production, bundle as build-time env vars and configure in Supabase.
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

// Supabase client instance (lazy-initialized)
let supabaseInstance: SupabaseClient | null = null

// In-memory cache for quick checks (avoid chrome.storage reads on every hover)
let cachedSession: Session | null = null
let cachedUser: User | null = null
let cachedTier: 'free' | 'pro' | 'loading' = 'loading'

// Callbacks for when auth state changes (popup listens to these)
type AuthCallback = (session: Session | null) => void
const authListeners: Set<AuthCallback> = new Set()

export function onAuthStateChange(cb: AuthCallback): () => void {
  authListeners.add(cb)
  return () => authListeners.delete(cb)
}

function notifyListeners(session: Session | null): void {
  for (const cb of authListeners) cb(session)
}

/**
 * Get or create the Supabase client.
 * Uses chrome.storage.local as a storage adapter so sessions survive
 * popup closes and service worker restarts.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: async (key: string): Promise<string | null> => {
          return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
              resolve(result[key] ?? null)
            })
          })
        },
        setItem: async (key: string, value: string): Promise<void> => {
          await chrome.storage.local.set({ [key]: value })
        },
        removeItem: async (key: string): Promise<void> => {
          await chrome.storage.local.remove(key)
        },
      },
    },
  })

  return supabaseInstance
}

/** Initialize auth: restore session from storage and listen for changes. */
export async function initAuth(): Promise<void> {
  const supabase = getSupabaseClient()

  // Try to restore existing session
  const { data: { session } } = await supabase.auth.getSession()
  cachedSession = session
  cachedUser = session?.user ?? null

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    cachedSession = session
    cachedUser = session?.user ?? null
    notifyListeners(session)

    // Broadcast to other extension contexts (popup, content scripts)
    chrome.storage.local.set({
      kumoAuthState: {
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        isLoggedIn: !!session,
        updatedAt: Date.now(),
      }
    }).catch(() => {})
  })
}

/** Sign in with email/password or magic link. */
export async function signInWithEmail(email: string, password?: string): Promise<{ error?: string }> {
  const supabase = getSupabaseClient()

  if (password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
  } else {
    // Magic link
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return { error: error.message }
  }
  return {}
}

/** Sign up with email/password. */
export async function signUpWithEmail(email: string, password: string): Promise<{ error?: string }> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return {}
}

/** Sign out. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()
  cachedSession = null
  cachedUser = null
  cachedTier = 'free'
  await chrome.storage.local.remove([
    'supabase.auth.token',
    'kumoAuthState',
  ])
  notifyListeners(null)
}

/** Get the cached user (sync, no storage read). */
export function getUser(): User | null {
  return cachedUser
}

/** Get the cached session (sync, no storage read). */
export function getSession(): Session | null {
  return cachedSession
}

/** Check if user is logged in (sync, from cache). */
export function isLoggedIn(): boolean {
  return !!cachedSession
}

// --- Redirect-based sign-in (for account page that opens in a tab) ---

export function getRedirectUrl(): string {
  return chrome.runtime.getURL('account.html')
}

/** Sign in with Google (uses chrome.identity for OAuth in MV3). */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = getSupabaseClient()
  const redirectUrl = getRedirectUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) return { error: error.message }
  if (data.url) {
    // Open the OAuth URL in a new tab
    await chrome.tabs.create({ url: data.url })
  }
  return {}
}

/**
 * Handle the OAuth redirect on the account page.
 * Call this when the account page loads to extract the session from URL hash.
 */
export async function handleAuthRedirect(): Promise<{ error?: string }> {
  const supabase = getSupabaseClient()

  // supabase-js detects session in URL automatically if detectSessionInUrl is true
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return { error: error.message }
  if (session) {
    cachedSession = session
    cachedUser = session.user
    notifyListeners(session)
  }
  return {}
}
