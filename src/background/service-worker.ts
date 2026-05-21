import type { Settings } from '../lib/storage'
import { setupContextMenu } from './context-menu'
import { startBadgeUpdater, updateBadge } from './badge'
import { initAuth, getSupabaseClient } from '../lib/auth'

export {}; // Make this a module

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

chrome.runtime.onInstalled.addListener(() => {
  console.log('Kumo: Extension installed')
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS })
    }
  })
  // Setup context menu and badge
  setupContextMenu()
  startBadgeUpdater()
})

// Initialize auth on startup
initAuth().catch(() => {})

// Listen for keyboard shortcut commands
chrome.commands?.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  switch (command) {
    case 'toggle-furigana':
      chrome.tabs.sendMessage(tab.id, { type: 'CMD_TOGGLE_FURIGANA' }).catch(() => {})
      break
    case 'mark-known':
      chrome.tabs.sendMessage(tab.id, { type: 'CMD_MARK_KNOWN' }).catch(() => {})
      break
    case 'save-word':
      chrome.tabs.sendMessage(tab.id, { type: 'CMD_SAVE_WORD' }).catch(() => {})
      break
    case 'mine-sentence':
      chrome.tabs.sendMessage(tab.id, { type: 'CMD_MINE_SENTENCE' }).catch(() => {})
      break
  }
})

// Message handlers for popup <-> content script communication
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_WORD_BANK_SIZE':
      chrome.storage.local.get('wordBank', (result) => {
        const bank = result.wordBank ?? {}
        sendResponse({ count: Object.keys(bank).length })
      })
      return true // async response

    case 'GET_KNOWN_COUNT':
      chrome.storage.local.get('wordBank', (result) => {
        const bank = result.wordBank ?? {}
        const knownCount = Object.values(bank).filter((e: any) => e.known).length
        sendResponse({ count: knownCount })
      })
      return true

    case 'GET_STREAK':
      chrome.storage.local.get('progress', (result) => {
        const progress = result.progress
        if (!progress || !progress.streakStart || !progress.streakEnd) {
          sendResponse({ streak: 0, longestStreak: 0 })
          return
        }
        const streakLen = getStreakLen(progress.streakStart, progress.streakEnd)
        sendResponse({ streak: streakLen, longestStreak: progress.longestStreak || 0 })
      })
      return true

    case 'GET_TODAY_STATS':
      chrome.storage.local.get('progress', (result) => {
        const progress = result.progress
        const today = new Date().toISOString().slice(0, 10)
        const todayStats = progress?.dailyStats?.[today]
        sendResponse({
          wordsLookedUp: todayStats?.wordsLookedUp || 0,
          wordsSaved: todayStats?.wordsSaved || 0,
          wordsMarkedKnown: todayStats?.wordsMarkedKnown || 0,
          sentencesMined: todayStats?.sentencesMined || 0,
          srsReviews: todayStats?.srsReviewsCompleted || 0
        })
      })
      return true

    case 'GET_SRS_STATS':
      chrome.storage.local.get('srsCards', (result) => {
        const cards = result.srsCards ?? []
        const due = cards.filter((c: any) => Date.now() >= c.nextReview).length
        const total = cards.length
        const mastered = cards.filter((c: any) => c.repetitions >= 5).length
        sendResponse({ total, due, mastered })
      })
      return true

    case 'FETCH_DICT':
      // Proxy dictionary API requests to bypass CORS
      fetch(message.url)
        .then(res => res.json())
        .then(data => sendResponse({ data }))
        .catch(err => sendResponse({ error: err.message }))
      return true // async response

    case 'OPEN_SRS_REVIEW':
      chrome.tabs.create({ url: chrome.runtime.getURL('srs.html') })
      sendResponse({ success: true })
      return false

    case 'OPEN_KANJI':
      chrome.tabs.create({ url: chrome.runtime.getURL('kanji.html') })
      sendResponse({ success: true })
      return false

    case 'BADGE_UPDATE':
      updateBadge()
      sendResponse({ success: true })
      return false

    default:
      sendResponse({ error: 'Unknown message type' })
      return false
  }
})

// Initialize context menu and badge on load
setupContextMenu()
startBadgeUpdater()

function getStreakLen(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}


