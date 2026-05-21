// Badge updater for Kumo extension
// Shows due SRS card count on the extension icon

import { getDueCards, type SrsCard } from '../lib/srs'

export async function updateBadge(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('srsCards')
    const cards: SrsCard[] = result.srsCards ?? []
    const due = getDueCards(cards)

    if (due.length > 0) {
      chrome.action.setBadgeText({ text: String(due.length) })
      chrome.action.setBadgeBackgroundColor({ color: '#f44336' })
      chrome.action.setBadgeTextColor({ color: '#ffffff' })
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  } catch {
    // Storage might not be ready
  }
}

// Update badge periodically (every 5 minutes)
export function startBadgeUpdater(): void {
  updateBadge()
  setInterval(updateBadge, 5 * 60 * 1000)
}
