// Sentence Bank page for Kumo
// View, search, filter, and manage mined sentences

import { loadSentences, deleteSentence, updateSentence, type SavedSentence } from './src/lib/sentences'

let allSentences: SavedSentence[] = []

document.addEventListener('DOMContentLoaded', async () => {
  await loadAll()
  bindEvents()
})

async function loadAll(): Promise<void> {
  allSentences = await loadSentences()
  populateTagFilter()
  renderList()
  updateCount()
}

function populateTagFilter(): void {
  const select = document.getElementById('filter-tag') as HTMLSelectElement
  if (!select) return

  const tags = new Set<string>()
  for (const s of allSentences) {
    for (const tag of s.tags) tags.add(tag)
  }

  select.innerHTML = '<option value="">All Tags</option>' +
    [...tags].sort().map(t => `<option value="${escapeAttr(t)}">${t}</option>`).join('')
}

function getFilteredSentences(): SavedSentence[] {
  const searchTerm = (document.getElementById('search-input') as HTMLInputElement)?.value?.toLowerCase() || ''
  const tagFilter = (document.getElementById('filter-tag') as HTMLSelectElement)?.value || ''

  return allSentences.filter(s => {
    if (searchTerm && !s.sentence.toLowerCase().includes(searchTerm) &&
        !s.targetWord.toLowerCase().includes(searchTerm)) {
      return false
    }
    if (tagFilter && !s.tags.includes(tagFilter)) return false
    return true
  })
}

function renderList(): void {
  const container = document.getElementById('sent-list')
  if (!container) return

  const filtered = getFilteredSentences()

  if (filtered.length === 0) {
    container.innerHTML = '<div class="sent-empty">No sentences match your search. Try a different query!</div>'
    return
  }

  container.innerHTML = filtered.map(s => {
    const date = new Date(s.savedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    // Highlight the target word in the sentence
    const highlightedSentence = highlightTargetWord(s.sentence, s.targetWord)

    return `
      <div class="sent-card" data-id="${escapeAttr(s.id)}">
        <div class="sent-card-header">
          <div>
            <span class="sent-card-target">${escapeHtml(s.targetWord)}</span>
            <span class="sent-card-reading">${escapeHtml(s.targetReading)}</span>
          </div>
          <div class="sent-card-tags">
            ${s.tags.map(t => `<span class="sent-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="sent-card-text">${highlightedSentence}</div>
        ${s.translation ? `<div class="sent-card-translation">📖 ${escapeHtml(s.translation)}</div>` : ''}
        ${s.notes ? `<div class="sent-card-notes">💬 "${escapeHtml(s.notes)}"</div>` : ''}
        <div class="sent-card-footer">
          <span class="sent-card-source" title="${escapeAttr(s.sourceUrl)}">${escapeHtml(s.sourceTitle || s.sourceUrl || 'Unknown source')} · ${date}</span>
          <div class="sent-card-actions">
            <button class="sent-action-btn add-note" data-id="${escapeAttr(s.id)}">✏️ Note</button>
            <button class="sent-action-btn delete" data-id="${escapeAttr(s.id)}">🗑 Delete</button>
          </div>
        </div>
      </div>
    `
  }).join('')

  // Bind card actions
  container.querySelectorAll('.add-note').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id || ''
      const sent = allSentences.find(s => s.id === id)
      if (!sent) return
      const note = prompt('Add a note:', sent.notes || '')
      if (note !== null) {
        await updateSentence(id, { notes: note })
        allSentences = await loadSentences()
        renderList()
      }
    })
  })

  container.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id || ''
      const sent = allSentences.find(s => s.id === id)
      if (sent && confirm(`Delete this sentence?`)) {
        await deleteSentence(id)
        allSentences = await loadSentences()
        updateCount()
        renderList()
        populateTagFilter()
      }
    })
  })
}

function highlightTargetWord(sentence: string, targetWord: string): string {
  const escaped = escapeHtml(sentence)
  const target = escapeHtml(targetWord)
  const regex = new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<strong style="color:#ff9800;font-weight:700">$1</strong>')
}

function updateCount(): void {
  const el = document.getElementById('sent-count')
  if (el) el.textContent = `${allSentences.length} sentence${allSentences.length !== 1 ? 's' : ''}`
}

function bindEvents(): void {
  document.getElementById('btn-back')?.addEventListener('click', () => window.close())
  document.getElementById('search-input')?.addEventListener('input', renderList)
  document.getElementById('filter-tag')?.addEventListener('change', renderList)

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const data = JSON.stringify(allSentences, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kumo-sentences-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
