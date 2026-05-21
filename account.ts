// Account page logic for Kumo
// Handles login, signup, plan display, and subscription management

import {
  initAuth,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInWithGoogle,
  handleAuthRedirect,
  getUser,
  isLoggedIn,
  onAuthStateChange,
} from './src/lib/auth'
import { refreshTier, getTierSync, getPlanSummary, updateSettings } from './src/lib/subscription'
import { getSettings, getAuthState, setAuthState } from './src/lib/storage'

const CHECKOUT_URL = 'https://kumo.app/pricing' // Update to your actual checkout URL

document.addEventListener('DOMContentLoaded', async () => {
  // First, check if this is an OAuth redirect (URL has #access_token or #error)
  const hash = window.location.hash
  if (hash && (hash.includes('access_token') || hash.includes('error'))) {
    await handleAuthRedirect()
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  await initAuth()
  const settings = await getSettings()
  updateSettings(settings)

  // Listen for auth state changes
  onAuthStateChange((session) => {
    renderView()
  })

  renderView()
  bindEvents()
})

function renderView(): void {
  document.getElementById('account-loading')!.style.display = 'none'

  if (isLoggedIn()) {
    showLoggedInView()
  } else {
    showLoggedOutView()
  }
}

function showLoggedOutView(): void {
  document.getElementById('account-logged-out')!.style.display = 'block'
  document.getElementById('account-logged-in')!.style.display = 'none'
}

async function showLoggedInView(): Promise<void> {
  document.getElementById('account-logged-out')!.style.display = 'none'
  document.getElementById('account-logged-in')!.style.display = 'block'

  const user = getUser()
  const emailEl = document.getElementById('account-email')
  if (emailEl && user?.email) {
    emailEl.textContent = user.email
  }

  // Fetch and display plan info
  const tier = await refreshTier()
  const planEl = document.getElementById('account-plan')
  if (planEl) {
    planEl.textContent = tier === 'pro' ? 'Pro Plan' : 'Free Plan'
  }

  const summary = getPlanSummary()
  setText('plan-wordbank', summary.wordBankLimit)
  setText('plan-subtitle', summary.subtitleLimit)
  setText('plan-srs', summary.srsLimit)

  // Show upgrade button only for free users
  const upgradeBtn = document.getElementById('btn-upgrade')
  if (upgradeBtn) {
    upgradeBtn.style.display = tier === 'pro' ? 'none' : 'block'
  }
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}

function bindEvents(): void {
  // Tab switching
  document.querySelectorAll('.kl-account-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.kl-account-tab').forEach(t => t.classList.remove('kl-account-tab-active'))
      tab.classList.add('kl-account-tab-active')
      const tabName = (tab as HTMLElement).dataset.tab
      document.getElementById('form-login')!.style.display = tabName === 'login' ? 'flex' : 'none'
      document.getElementById('form-signup')!.style.display = tabName === 'signup' ? 'flex' : 'none'
    })
  })

  // Login form
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = (document.getElementById('login-email') as HTMLInputElement).value
    const password = (document.getElementById('login-password') as HTMLInputElement).value
    const errorEl = document.getElementById('login-error')!

    errorEl.style.display = 'none'
    const result = await signInWithEmail(email, password || undefined)
    if (result.error) {
      errorEl.textContent = result.error
      errorEl.style.display = 'block'
    } else if (!password) {
      // Magic link sent
      errorEl.style.color = '#4caf50'
      errorEl.textContent = 'Check your email for a magic link!'
      errorEl.style.display = 'block'
    }
  })

  // Signup form
  document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = (document.getElementById('signup-email') as HTMLInputElement).value
    const password = (document.getElementById('signup-password') as HTMLInputElement).value
    const errorEl = document.getElementById('signup-error')!

    errorEl.style.display = 'none'
    const result = await signUpWithEmail(email, password)
    if (result.error) {
      errorEl.textContent = result.error
      errorEl.style.display = 'block'
    } else {
      errorEl.style.color = '#4caf50'
      errorEl.textContent = 'Account created! Check your email to confirm.'
      errorEl.style.display = 'block'
    }
  })

  // Google sign-in
  document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
    await signInWithGoogle()
  })

  // Sign out
  document.getElementById('btn-signout')?.addEventListener('click', async () => {
    await signOut()
    renderView()
  })

  // Upgrade to Pro
  document.getElementById('btn-upgrade')?.addEventListener('click', () => {
    chrome.tabs.create({ url: CHECKOUT_URL })
  })

  // Refresh plan
  document.getElementById('btn-refresh-plan')?.addEventListener('click', async () => {
    showLoggedInView()
  })
}
