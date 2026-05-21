// Word Bank page logic for Kumo
// Renders saved word entries in a filterable, sortable table
// Supports CSV export, Anki export, SRS integration, dictionary lookup, and batch operations

import { getWordBank, removeWord, markKnown, markStarred, WordEntry } from './src/lib/storage'
import { addToSrs, loadSrsCards } from './src/lib/srs'
import { wordEntriesToAnkiNotes, generateAnkiCSV, AnkiExportFormat } from './src/lib/anki-export'
import { lookupWord } from './src/lib/dictionary'
import { isWordBankFull, canExportAnki, canAddSrsCard } from './src/lib/subscription'

let allEntries: [string, WordEntry][] = []
let batchMode = false
let selectedBatch = new Set<string>()
let selectedWord: string | null = null

document.addEventListener('DOMContentLoaded', async () => {
  await loadEntries()
  bindEvents()
  renderTable()
})

async function loadEntries(): Promise<void> {
  const bank = await getWordBank()
  allEntries = Object.entries(bank).sort((a, b) => b[1].savedAt - a[1].savedAt)
}

function getFilteredEntries(): [string, WordEntry][] {
  const searchTerm = (document.getElementById('search-input') as HTMLInputElement)?.value?.toLowerCase() || ''
  const jlptFilter = (document.getElementById('filter-jlpt') as HTMLSelectElement)?.value || ''
  const knownFilter = (document.getElementById('filter-known') as HTMLSelectElement)?.value || ''
  const starredFilter = (document.getElementById('filter-starred') as HTMLSelectElement)?.value || ''

  return allEntries.filter(([word, entry]) => {
    if (searchTerm && !word.toLowerCase().includes(searchTerm) &&
        !entry.reading.toLowerCase().includes(searchTerm) &&
        !entry.definitions.some((d: string) => d.toLowerCase().includes(searchTerm))) {
      return false
    }
    if (jlptFilter && entry.jlpt !== jlptFilter) return false
    if (knownFilter === 'known' && !entry.known) return false
    if (knownFilter === 'unknown' && entry.known) return false
    if (starredFilter === 'starred' && !entry.starred) return false
    return true
  })
}

function renderTable(): void {
  const tbody = document.getElementById('wordbank-tbody')
  if (!tbody) return

  const filtered = getFilteredEntries()
  const countEl = document.getElementById('entry-count')
  if (countEl) countEl.textContent = `${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="wb-empty"><td colspan="8">No matching entries.</td></tr>`
    return
  }

  tbody.innerHTML = filtered.map(([word, entry]) => {
    const date = new Date(entry.savedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
    const def = entry.definitions.slice(0, 2).join(', ') || '—'
    const jlpt = entry.jlpt ? `<span class="wb-jlpt-badge ${entry.jlpt.toLowerCase()}">${entry.jlpt}</span>` : '—'
    const checked = selectedBatch.has(word) ? 'checked' : ''

    return `
      <tr class="${entry.known ? 'wb-known' : ''} ${entry.starred ? 'wb-starred' : ''} ${selectedWord === word ? 'wb-selected' : ''}"
          data-word="${escapeAttr(word)}">
        ${batchMode ? `<td class="col-check"><input type="checkbox" class="batch-check" data-word="${escapeAttr(word)}" ${checked} /></td>` : ''}
        <td class="col-word">
          <span class="wb-word-text">${word}</span>
          ${entry.starred ? '<span class="wb-star">⭐</span>' : ''}
        </td>
        <td class="col-reading">${entry.reading || '—'}</td>
        <td class="col-def" title="${entry.definitions.join(', ')}">${def}</td>
        <td class="col-jlpt">${jlpt}</td>
        <td class="col-date">${date}</td>
        <td class="col-actions">
          <button class="wb-action-btn known-toggle" data-word="${escapeAttr(word)}" title="${entry.known ? 'Mark as learning' : 'Mark as known'}">
            ${entry.known ? '✓' : '○'}
          </button>
          <button class="wb-action-btn star-toggle" data-word="${escapeAttr(word)}" title="${entry.starred ? 'Unstar' : 'Star'}">
            ${entry.starred ? '⭐' : '☆'}
          </button>
          <button class="wb-action-btn srs-add" data-word="${escapeAttr(word)}" data-reading="${escapeAttr(entry.reading || '')}" data-defs="${escapeAttr(entry.definitions.join(';'))}" data-jlpt="${escapeAttr(entry.jlpt || '')}" title="Add to SRS">🔄</button>
          <button class="wb-action-btn info-btn" data-word="${escapeAttr(word)}" title="Dictionary Info">ℹ️</button>
          <button class="wb-action-btn delete-btn" data-word="${escapeAttr(word)}" title="Delete">🗑</button>
        </td>
      </tr>
    `
  }).join('')

  // Bind row clicks for selection (inner detail panel)
  tbody.querySelectorAll('tr[data-word]').forEach(row => {
    row.addEventListener('dblclick', async () => {
      const word = (row as HTMLElement).dataset.word || ''
      await showWordDetail(word)
    })
  })

  // Bind actions
  tbody.querySelectorAll('.known-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const word = (btn as HTMLElement).dataset.word || ''
      const entry = allEntries.find(([w]) => w === word)?.[1]
      if (entry) {
        await markKnown(word)
        await loadEntries()
        renderTable()
      }
    })
  })

  tbody.querySelectorAll('.star-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const word = (btn as HTMLElement).dataset.word || ''
      const entry = allEntries.find(([w]) => w === word)?.[1]
      if (entry) {
        await markStarred(word, !entry.starred)
        await loadEntries()
        renderTable()
      }
    })
  })

  tbody.querySelectorAll('.srs-add').forEach(btn => {
    btn.addEventListener('click', async () => {
      const el = btn as HTMLElement
      const word = el.dataset.word || ''
      const reading = el.dataset.reading || ''
      const defs = (el.dataset.defs || '').split(';').filter(d => d)
      const jlpt = el.dataset.jlpt || null
      await addToSrs(word, reading, defs, jlpt || null)
      el.textContent = '✓'
      setTimeout(() => { el.textContent = '🔄' }, 1500)
    })
  })

  tbody.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const word = (btn as HTMLElement).dataset.word || ''
      await showWordDetail(word)
    })
  })

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const word = (btn as HTMLElement).dataset.word || ''
      if (confirm(`Delete "${word}" from your word bank?`)) {
        await removeWord(word)
        selectedBatch.delete(word)
        await loadEntries()
        renderTable()
      }
    })
  })

  // Batch checkboxes
  tbody.querySelectorAll('.batch-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const word = (cb as HTMLElement).dataset.word || ''
      if ((cb as HTMLInputElement).checked) {
        selectedBatch.add(word)
      } else {
        selectedBatch.delete(word)
      }
      updateBatchControls()
    })
  })
}

// --- Word Detail Panel ---

async function showWordDetail(word: string): Promise<void> {
  selectedWord = word
  renderTable()

  const entry = allEntries.find(([w]) => w === word)?.[1]
  if (!entry) return

  const panel = document.getElementById('word-detail')
  const overlay = document.getElementById('detail-overlay')
  if (!panel || !overlay) return

  // Look up in dictionary for more info
  const dictEntry = lookupWord(word)
  const isFromDict = !!dictEntry

  panel.innerHTML = `
    <div class="wd-header">
      <div>
        <span class="wd-word">${word}</span>
        <span class="wd-reading">${entry.reading}</span>
        ${entry.jlpt ? `<span class="wb-jlpt-badge ${entry.jlpt.toLowerCase()}">${entry.jlpt}</span>` : ''}
      </div>
      <button class="wd-close" id="wd-close">✕</button>
    </div>

    <div class="wd-defs">
      <div class="wd-section-title">Definitions</div>
      ${entry.definitions.map(d => `<div class="wd-def">• ${d}</div>`).join('')}
    </div>

    <div class="wd-meta">
      <div class="wd-meta-item"><span>Saved</span><span>${new Date(entry.savedAt).toLocaleDateString()}</span></div>
      <div class="wd-meta-item"><span>Known</span><span>${entry.known ? '✅ Yes' : '○ No'}</span></div>
      <div class="wd-meta-item"><span>Starred</span><span>${entry.starred ? '⭐ Yes' : '☆ No'}</span></div>
      <div class="wd-meta-item"><span>Times Seen</span><span>${entry.seenCount}</span></div>
      ${entry.sourceUrl ? `<div class="wd-meta-item"><span>Source</span><span style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${entry.sourceUrl}</span></div>` : ''}
    </div>

    <div class="wd-actions">
      <button class="wd-action-btn" id="wd-add-srs">🔄 Add to SRS</button>
      <button class="wd-action-btn" id="wd-toggle-known">${entry.known ? '○ Mark Learning' : '✓ Mark Known'}</button>
      <button class="wd-action-btn" id="wd-open-kanji">🔤 Kanji Info</button>
      <button class="wd-action-btn" id="wd-save-sentence">📝 Mine Sentence</button>
    </div>
  `

  panel.classList.remove('hidden')
  overlay.classList.remove('hidden')

  // Bind detail actions
  document.getElementById('wd-close')?.addEventListener('click', closeDetail)
  overlay.addEventListener('click', closeDetail)

  document.getElementById('wd-add-srs')?.addEventListener('click', async () => {
    await addToSrs(word, entry.reading, entry.definitions, entry.jlpt)
    showToast('✅ Added to SRS!')
  })

  document.getElementById('wd-toggle-known')?.addEventListener('click', async () => {
    await markKnown(word)
    showToast(entry.known ? 'Marked as learning' : '✅ Marked as known!')
    await loadEntries()
    renderTable()
  })

  document.getElementById('wd-open-kanji')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('kanji.html') })
  })

  document.getElementById('wd-save-sentence')?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'MINE_SENTENCE', word }).catch(() => {})
      } else {
        showToast('⚠️ Open a Japanese page first to mine sentences')
      }
    } catch {
      showToast('⚠️ Open a Japanese page to mine sentences')
    }
  })
}

function closeDetail(): void {
  selectedWord = null
  document.getElementById('word-detail')?.classList.add('hidden')
  document.getElementById('detail-overlay')?.classList.add('hidden')
  renderTable()
}

// --- Toast ---

function showToast(message: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = message
  el.classList.remove('hidden')
  el.classList.add('toast-show')
  setTimeout(() => {
    el.classList.remove('toast-show')
    el.classList.add('hidden')
  }, 2500)
}

// --- Batch Operations ---

function updateBatchControls(): void {
  const countEl = document.getElementById('batch-count')
  if (countEl) countEl.textContent = `${selectedBatch.size} selected`

  const actionsEl = document.getElementById('batch-actions')
  if (actionsEl) {
    actionsEl.style.display = selectedBatch.size > 0 ? 'flex' : 'none'
  }
}

async function executeBatch(action: 'srs' | 'known' | 'delete' | 'star'): Promise<void> {
  if (selectedBatch.size === 0) return

  const words = [...selectedBatch]

  switch (action) {
    case 'srs': {
      let count = 0
      for (const word of words) {
        const entry = allEntries.find(([w]) => w === word)?.[1]
        if (entry) {
          // Check SRS daily limit
          const cards = await loadSrsCards()
          const todayDueCount = cards.filter(c => c.nextReview <= Date.now()).length
          if (!canAddSrsCard(todayDueCount)) {
            showToast('⚠️ SRS daily limit reached (Free: 10/day). Upgrade to Pro for unlimited.')
            break
          }
          await addToSrs(word, entry.reading, entry.definitions, entry.jlpt)
          count++
        }
      }
      showToast(`✅ Added ${count} word(s) to SRS!`)
      break
    }
    case 'known': {
      for (const word of words) {
        await markKnown(word)
      }
      showToast(`✅ Marked ${words.length} word(s) as known!`)
      break
    }
    case 'delete': {
      if (confirm(`Delete ${words.length} selected word(s)?`)) {
        for (const word of words) {
          await removeWord(word)
        }
        showToast(`🗑 Deleted ${words.length} word(s)`)
      }
      break
    }
    case 'star': {
      for (const word of words) {
        const entry = allEntries.find(([w]) => w === word)?.[1]
        if (entry) {
          await markStarred(word, !entry.starred)
        }
      }
      showToast(`⭐ Toggled star on ${words.length} word(s)`)
      break
    }
  }

  selectedBatch.clear()
  await loadEntries()
  renderTable()
  updateBatchControls()
}

function bindEvents(): void {
  document.getElementById('search-input')?.addEventListener('input', renderTable)
  document.getElementById('filter-jlpt')?.addEventListener('change', renderTable)
  document.getElementById('filter-known')?.addEventListener('change', renderTable)
  document.getElementById('filter-starred')?.addEventListener('change', renderTable)

  document.getElementById('btn-back')?.addEventListener('click', () => window.close())

  document.getElementById('btn-export')?.addEventListener('click', exportCSV)
  document.getElementById('btn-anki')?.addEventListener('click', () => {
    if (!canExportAnki()) {
      showToast('⚠️ Anki export requires Kumo Pro — go to Account to upgrade')
      return
    }
    const format = (document.getElementById('anki-format') as HTMLSelectElement)?.value as AnkiExportFormat || 'basic'
    exportAnki(format)
  })
  document.getElementById('btn-export-json')?.addEventListener('click', exportJSON)
  document.getElementById('btn-import-json')?.addEventListener('click', importJSON)

  // Batch mode toggle
  document.getElementById('btn-batch')?.addEventListener('click', () => {
    batchMode = !batchMode
    if (!batchMode) {
      selectedBatch.clear()
      updateBatchControls()
    }
    const btn = document.getElementById('btn-batch')
    if (btn) btn.textContent = batchMode ? '✕ Exit Batch' : '☑ Batch'
    renderTable()
  })

  // Batch actions
  document.getElementById('batch-srs')?.addEventListener('click', () => executeBatch('srs'))
  document.getElementById('batch-known')?.addEventListener('click', () => executeBatch('known'))
  document.getElementById('batch-star')?.addEventListener('click', () => executeBatch('star'))
  document.getElementById('batch-delete')?.addEventListener('click', () => executeBatch('delete'))

  // Export all data (open backup page)
  document.getElementById('btn-backup')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('backup.html') })
  })

  // Open quiz
  document.getElementById('btn-quiz')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('quiz.html') })
  })
}

function importJSON(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const imported = JSON.parse(text)

      // Handle both backup format and simple word bank format
      const data = imported.data?.wordBank || imported

      if (typeof data === 'object' && !Array.isArray(data)) {
        const bank = await getWordBank()
        let count = 0
        for (const [word, entry] of Object.entries(data)) {
          if (!bank[word] && typeof entry === 'object' && entry !== null) {
            bank[word] = entry as WordEntry
            count++
          }
        }
        await chrome.storage.local.set({ wordBank: bank })
        alert(`Imported ${count} new word(s)!`)
      } else if (Array.isArray(imported)) {
        const bank = await getWordBank()
        let count = 0
        for (const entry of imported) {
          if (entry?.word && !bank[entry.word]) {
            bank[entry.word] = {
              word: entry.word, reading: entry.reading || '',
              definitions: entry.definitions || [], jlpt: entry.jlpt || null,
              savedAt: entry.savedAt || Date.now(), sourceUrl: entry.sourceUrl || '',
              known: entry.known || false, starred: entry.starred || false, seenCount: entry.seenCount || 0
            }
            count++
          }
        }
        await chrome.storage.local.set({ wordBank: bank })
        alert(`Imported ${count} new word(s)!`)
      } else {
        alert('Invalid format.')
      }

      await loadEntries()
      renderTable()
    } catch {
      alert('Failed to import. Check the file format.')
    }
  })
  input.click()
}

function exportCSV(): void {
  const filtered = getFilteredEntries()
  const headers = ['Word', 'Reading', 'Definitions', 'JLPT', 'Known', 'Starred', 'Saved At', 'Source URL']
  const rows = filtered.map(([word, entry]) => [
    word, entry.reading, `"${entry.definitions.join('; ')}"`,
    entry.jlpt || '', entry.known ? 'Yes' : 'No',
    entry.starred ? 'Yes' : 'No', new Date(entry.savedAt).toISOString(), entry.sourceUrl
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadBlob(csv, `kumo-wordbank-${today()}.csv`, 'text/csv;charset=utf-8')
}

function exportAnki(format: AnkiExportFormat = 'basic'): void {
  const filtered = getFilteredEntries()
  const notes = wordEntriesToAnkiNotes(filtered, format)
  const csv = generateAnkiCSV(notes, true)
  const labels: Record<AnkiExportFormat, string> = { basic: 'basic', reversed: 'reversed', cloze: 'cloze' }
  downloadBlob(csv, `kumo-anki-${labels[format]}-${today()}.csv`, 'text/csv;charset=utf-8')
}

function exportJSON(): void {
  const filtered = getFilteredEntries()
  const data = Object.fromEntries(filtered)
  downloadBlob(JSON.stringify(data, null, 2), `kumo-wordbank-${today()}.json`, 'application/json')
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
