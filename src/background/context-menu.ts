// Right-click context menu handler for Kumo
// Adds "Add to Kumo" / "Mark as Known" options on selected text

import { lookupWord } from '../lib/dictionary'
import { saveWord, markKnown } from '../lib/storage'
import { addToSrs } from '../lib/srs'
import { recordDailyEvent } from '../lib/progress'

export interface ContextMenuInfo {
  menuItemId: string | number
  selectionText: string
}

export function setupContextMenu(): void {
  if (!chrome.contextMenus) return

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'kumo-save-word',
      title: 'Add "%s" to Kumo Word Bank',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'kumo-mark-known',
      title: 'Mark "%s" as Known',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'kumo-add-srs',
      title: 'Add "%s" to SRS Review',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'kumo-open-kanji',
      title: 'Look up "%s" in Kanji Details',
      contexts: ['selection']
    })
  })

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const text = info.selectionText?.trim()
    if (!text || !tab?.id) return

    switch (info.menuItemId) {
      case 'kumo-save-word': {
        const entry = lookupWord(text)
        await saveWord({
          word: text,
          reading: entry?.reading || '',
          definitions: entry?.definitions || [],
          jlpt: entry?.jlpt || null,
          savedAt: Date.now(),
          sourceUrl: tab.url || '',
          known: false,
          starred: false,
          seenCount: 1
        })
        chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_KNOWN_CACHE' }).catch(() => {})
        break
      }
      case 'kumo-mark-known': {
        const entry = lookupWord(text)
        await markKnown(text, { reading: entry?.reading, definitions: entry?.definitions, jlpt: entry?.jlpt })
        await recordDailyEvent({ type: 'wordsMarkedKnown' })
        chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_KNOWN_CACHE' }).catch(() => {})
        break
      }
      case 'kumo-add-srs': {
        const entry = lookupWord(text)
        const reading = entry?.reading || ''
        const defs = entry?.definitions || []
        const jlpt = entry?.jlpt || null
        await addToSrs(text, reading, defs, jlpt)
        break
      }
      case 'kumo-open-kanji': {
        chrome.tabs.create({ url: chrome.runtime.getURL(`kanji.html#${encodeURIComponent(text)}`) })
        break
      }
    }
  })
}
