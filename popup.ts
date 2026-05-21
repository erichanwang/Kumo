// Toolbar popup logic for Kumo
// Handles toggle controls, stats display, streaks, and communication

import { getSettings, saveSettings, getWordBank, getAuthState } from './src/lib/storage'
import { loadSrsCards, getSrsStats } from './src/lib/srs'
import { loadTheme as getTheme, saveTheme as setTheme } from './src/lib/theme'
import { getPlanSummary } from './src/lib/subscription'
import { initAuth, isLoggedIn, signOut } from './src/lib/auth'

interface Settings {
  furiganaEnabled: boolean
  youtubeEnabled: boolean
  autoPauseOnUnknown: boolean
  showRomaji: boolean
  showKatakanaFurigana: boolean
  showNumberFurigana: boolean
  dualSubtitleEnabled: boolean
  furiganaColor: string
  hideKnownFurigana: boolean
  offlineMode: boolean
  autoPlayAudio: boolean
  cardOpacity: number
  showPopupCard: boolean
  furiganaSize: 'small' | 'medium' | 'large'
  srsCardsPerDay: number
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings()
  const theme = await getTheme()
  loadSettings(settings)
  loadTheme(theme)
  await loadAuthState()
  await loadStats()
  await loadStreak()
  await loadTodayStats()
  await loadSrsStats()
  bindEvents()
})

function loadSettings(settings: Settings): void {
  const furiganaToggle = document.getElementById('toggle-furigana') as HTMLInputElement
  const youtubeToggle = document.getElementById('toggle-youtube') as HTMLInputElement
  const autoPauseToggle = document.getElementById('toggle-auto-pause') as HTMLInputElement
  const romajiToggle = document.getElementById('toggle-romaji') as HTMLInputElement
  const katakanaToggle = document.getElementById('toggle-katakana-furigana') as HTMLInputElement
  const dualSubToggle = document.getElementById('toggle-dual-subs') as HTMLInputElement
  const hideKnownToggle = document.getElementById('toggle-hide-known') as HTMLInputElement
  const offlineToggle = document.getElementById('toggle-offline') as HTMLInputElement
  const colorPicker = document.getElementById('furigana-color') as HTMLInputElement

  if (furiganaToggle) furiganaToggle.checked = settings.furiganaEnabled
  if (youtubeToggle) youtubeToggle.checked = settings.youtubeEnabled
  if (autoPauseToggle) autoPauseToggle.checked = settings.autoPauseOnUnknown
  if (romajiToggle) romajiToggle.checked = settings.showRomaji
  if (katakanaToggle) katakanaToggle.checked = settings.showKatakanaFurigana

  // Number furigana toggle
  const numberFuriganaToggle = document.getElementById('toggle-number-furigana') as HTMLInputElement
  if (numberFuriganaToggle) numberFuriganaToggle.checked = settings.showNumberFurigana

  if (dualSubToggle) dualSubToggle.checked = settings.dualSubtitleEnabled
  if (hideKnownToggle) hideKnownToggle.checked = settings.hideKnownFurigana
  if (offlineToggle) offlineToggle.checked = settings.offlineMode
  if (colorPicker) colorPicker.value = settings.furiganaColor || '#e8a000'

  // Auto-play audio
  const audioToggle = document.getElementById('toggle-audio') as HTMLInputElement
  if (audioToggle) audioToggle.checked = settings.autoPlayAudio

  // Show popup card
  const popupCardToggle = document.getElementById('toggle-popup-card') as HTMLInputElement
  if (popupCardToggle) popupCardToggle.checked = settings.showPopupCard

  // Furigana size
  const sizeRadios = document.querySelectorAll<HTMLInputElement>('input[name="furigana-size"]')
  for (const radio of sizeRadios) {
    if (radio.value === settings.furiganaSize) radio.checked = true
  }

  // Card opacity slider
  const opacitySlider = document.getElementById('slider-opacity') as HTMLInputElement
  if (opacitySlider) opacitySlider.value = String(Math.round(settings.cardOpacity * 100))

  // SRS cards per day
  const srsDayEl = document.getElementById('srs-cards-day')
  if (srsDayEl) srsDayEl.textContent = String(settings.srsCardsPerDay)
}

function loadTheme(theme: string): void {
  const toggle = document.getElementById('toggle-theme') as HTMLInputElement
  if (toggle) toggle.checked = theme === 'light'
  document.body.classList.toggle('kumo-light', theme === 'light')
}

async function loadStats(): Promise<void> {
  const bank = await getWordBank()
  const entries = Object.values(bank)

  const savedEl = document.getElementById('stat-saved')
  if (savedEl) savedEl.textContent = String(entries.length)

  const knownCount = entries.filter(e => e.known).length
  const knownEl = document.getElementById('stat-known')
  if (knownEl) knownEl.textContent = String(knownCount)

  const jlptTotals: Record<string, number> = {
    'N5': 103, 'N4': 181, 'N3': 365, 'N2': 372, 'N1': 347
  }
  for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    const upperLevel = level.toUpperCase()
    const knownInLevel = entries.filter(e => e.jlpt === upperLevel && e.known).length
    const total = jlptTotals[upperLevel] || 1
    const pct = Math.round((knownInLevel / total) * 100)

    const barEl = document.getElementById(`bar-${level}`)
    const pctEl = document.getElementById(`pct-${level}`)
    if (barEl) barEl.style.width = `${Math.min(pct, 100)}%`
    if (pctEl) pctEl.textContent = `${pct}%`
  }
}

async function loadStreak(): Promise<void> {
  try {
    const streak = await chrome.runtime.sendMessage({ type: 'GET_STREAK' })
    const streakEl = document.getElementById('stat-streak')
    if (streakEl) streakEl.textContent = String(streak.streak || 0)
  } catch {}
}

async function loadTodayStats(): Promise<void> {
  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_TODAY_STATS' })
    const lookedUpEl = document.getElementById('stat-today-looked')
    const savedEl = document.getElementById('stat-today-saved')
    const minedEl = document.getElementById('stat-today-mined')
    if (lookedUpEl) lookedUpEl.textContent = String(stats.wordsLookedUp || 0)
    if (savedEl) savedEl.textContent = String(stats.wordsSaved || 0)
    if (minedEl) minedEl.textContent = String(stats.sentencesMined || 0)
  } catch {}
}

async function loadSrsStats(): Promise<void> {
  try {
    const cards = await loadSrsCards()
    const stats = getSrsStats(cards)
    // Update both the Quick Review and Progress sections
    setText('stat-srs-due-quick', stats.due)
    setText('stat-srs-total-quick', stats.total)
    setText('stat-srs-due', stats.due)
    setText('stat-srs-total', stats.total)
  } catch {}
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}

function openPage(page: string): void {
  chrome.tabs.create({ url: chrome.runtime.getURL(page) })
}

function bindEvents(): void {
  // Toggles
  document.getElementById('toggle-furigana')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-furigana') as HTMLInputElement
    const settings = await getSettings()
    settings.furiganaEnabled = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_FURIGANA', { enabled: el.checked })
  })
  document.getElementById('toggle-youtube')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-youtube') as HTMLInputElement
    const settings = await getSettings()
    settings.youtubeEnabled = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_YOUTUBE', { enabled: el.checked })
  })
  document.getElementById('toggle-auto-pause')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-auto-pause') as HTMLInputElement
    const settings = await getSettings()
    settings.autoPauseOnUnknown = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_AUTO_PAUSE', { enabled: el.checked })
  })
  document.getElementById('toggle-romaji')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-romaji') as HTMLInputElement
    const settings = await getSettings()
    settings.showRomaji = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_ROMAJI', { enabled: el.checked })
  })
  document.getElementById('toggle-number-furigana')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-number-furigana') as HTMLInputElement
    const settings = await getSettings()
    settings.showNumberFurigana = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_NUMBER_FURIGANA', { enabled: el.checked })
  })

  document.getElementById('toggle-katakana-furigana')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-katakana-furigana') as HTMLInputElement
    const settings = await getSettings()
    settings.showKatakanaFurigana = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_KATAKANA_FURIGANA', { enabled: el.checked })
  })
  document.getElementById('toggle-dual-subs')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-dual-subs') as HTMLInputElement
    const settings = await getSettings()
    settings.dualSubtitleEnabled = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_DUAL_SUBS', { enabled: el.checked })
  })

  // Furigana color picker
  document.getElementById('furigana-color')?.addEventListener('input', async () => {
    const el = document.getElementById('furigana-color') as HTMLInputElement
    const settings = await getSettings()
    settings.furiganaColor = el.value
    await saveSettings(settings)
    await notifyContentScript('UPDATE_FURIGANA_COLOR', { color: el.value })
  })

  // Auto-play audio toggle
  document.getElementById('toggle-audio')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-audio') as HTMLInputElement
    const settings = await getSettings()
    settings.autoPlayAudio = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_AUDIO', { enabled: el.checked })
  })

  // Show popup card toggle
  document.getElementById('toggle-popup-card')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-popup-card') as HTMLInputElement
    const settings = await getSettings()
    settings.showPopupCard = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_POPUP_CARD', { enabled: el.checked })
  })

  // Hide known furigana toggle
  document.getElementById('toggle-hide-known')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-hide-known') as HTMLInputElement
    const settings = await getSettings()
    settings.hideKnownFurigana = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_HIDE_KNOWN', { enabled: el.checked })
  })

  // Offline mode toggle
  document.getElementById('toggle-offline')?.addEventListener('change', async () => {
    const el = document.getElementById('toggle-offline') as HTMLInputElement
    const settings = await getSettings()
    settings.offlineMode = el.checked
    await saveSettings(settings)
    await notifyContentScript('TOGGLE_OFFLINE', { enabled: el.checked })
  })

  // Furigana size radio buttons
  document.querySelectorAll('input[name="furigana-size"]').forEach(radio => {
    radio.addEventListener('change', async () => {
      const checked = document.querySelector<HTMLInputElement>('input[name="furigana-size"]:checked')
      if (!checked) return
      const settings = await getSettings()
      settings.furiganaSize = checked.value as 'small' | 'medium' | 'large'
      await saveSettings(settings)
      await notifyContentScript('UPDATE_FURIGANA_SIZE', { size: checked.value })
    })
  })

  // Card opacity slider
  document.getElementById('slider-opacity')?.addEventListener('input', async () => {
    const el = document.getElementById('slider-opacity') as HTMLInputElement
    const settings = await getSettings()
    settings.cardOpacity = parseInt(el.value) / 100
    await saveSettings(settings)
    await notifyContentScript('UPDATE_CARD_OPACITY', { opacity: settings.cardOpacity })
  })

  // SRS cards per day
  document.getElementById('num-srs-inc')?.addEventListener('click', async () => {
    const settings = await getSettings()
    settings.srsCardsPerDay = Math.min(settings.srsCardsPerDay + 5, 200)
    await saveSettings(settings)
    const el = document.getElementById('srs-cards-day')
    if (el) el.textContent = String(settings.srsCardsPerDay)
    await notifyContentScript('UPDATE_SRS_DAY_LIMIT', { limit: settings.srsCardsPerDay })
  })
  document.getElementById('num-srs-dec')?.addEventListener('click', async () => {
    const settings = await getSettings()
    settings.srsCardsPerDay = Math.max(settings.srsCardsPerDay - 5, 5)
    await saveSettings(settings)
    const el = document.getElementById('srs-cards-day')
    if (el) el.textContent = String(settings.srsCardsPerDay)
    await notifyContentScript('UPDATE_SRS_DAY_LIMIT', { limit: settings.srsCardsPerDay })
  })

  // Reset to defaults
  document.getElementById('btn-reset')?.addEventListener('click', async () => {
    const defaultSettings: Settings = {
      furiganaEnabled: true,
      youtubeEnabled: true,
      autoPauseOnUnknown: false,
      showRomaji: false,
      showKatakanaFurigana: false,
      showNumberFurigana: true,
      dualSubtitleEnabled: false,
      furiganaColor: '#e8a000',
      hideKnownFurigana: false,
      offlineMode: false,
      autoPlayAudio: true,
      cardOpacity: 1.0,
      showPopupCard: true,
      furiganaSize: 'medium',
      srsCardsPerDay: 20
    }
    await saveSettings(defaultSettings)
    loadSettings(defaultSettings)
    await notifyContentScript('RESET_SETTINGS', {})
  })

  // Theme toggle
  document.getElementById('toggle-theme')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked
    await setTheme(checked ? 'light' : 'dark')
    loadTheme(checked ? 'light' : 'dark')
  })

  // Navigation buttons
  document.getElementById('btn-wordbank')?.addEventListener('click', () => openPage('wordbank.html'))
  document.getElementById('btn-srs')?.addEventListener('click', () => openPage('srs.html'))
  document.getElementById('btn-quiz')?.addEventListener('click', () => openPage('quiz.html'))
  document.getElementById('btn-dashboard')?.addEventListener('click', () => openPage('stats.html'))
  document.getElementById('btn-sentences')?.addEventListener('click', () => openPage('sentences.html'))
  document.getElementById('btn-backup')?.addEventListener('click', () => openPage('backup.html'))
  document.getElementById('btn-open-srs')?.addEventListener('click', () => openPage('srs.html'))
  document.getElementById('btn-account')?.addEventListener('click', () => openPage('account.html'))
}

// --- Auth ---

async function loadAuthState(): Promise<void> {
  // Initialize auth if not already
  try { await initAuth() } catch {}

  const authState = await getAuthState()
  const loggedIn = authState.isLoggedIn

  // Update plan badge
  const planBadge = document.getElementById('plan-badge')
  if (planBadge) {
    const tier = authState.tier === 'loading'
      ? (isLoggedIn() ? 'Pro' : 'Free')
      : (authState.tier === 'pro' ? 'Pro' : 'Free')
    planBadge.textContent = loggedIn ? `✦ ${tier}` : 'Free'
    planBadge.className = `kl-plan-badge ${loggedIn && tier === 'Pro' ? 'kl-plan-pro' : 'kl-plan-free'}`
  }

  // Update tagline
  const tagline = document.getElementById('auth-tagline')
  if (tagline) {
    if (loggedIn && authState.email) {
      tagline.textContent = `Signed in as ${authState.email}`
    } else {
      tagline.textContent = 'Read Japanese anywhere'
    }
  }
}

async function handleLogout(): Promise<void> {
  await signOut()
  // Refresh popup state
  await loadAuthState()
}

async function notifyContentScript(type: string, data: Record<string, unknown>): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type, ...data }).catch(() => {})
  } catch {}
}
