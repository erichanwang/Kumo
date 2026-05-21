// Data Manager for Kumo
// Full backup/restore of all user data: word bank, SRS cards, sentences, settings, progress

interface KumoBackup {
  version: string
  exportedAt: string
  data: {
    wordBank?: Record<string, unknown>
    srsCards?: unknown[]
    sentences?: unknown[]
    settings?: Record<string, unknown>
    progress?: Record<string, unknown>
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadExportStats()
  await loadStorageUsage()
  bindEvents()
})

async function loadExportStats(): Promise<void> {
  const stats = await computeBackupStats()
  setText('bu-export-words', stats.wordCount)
  setText('bu-export-srs', stats.srsCount)
  setText('bu-export-sentences', stats.sentenceCount)
  setText('bu-export-days', stats.progressDays)
}

async function loadStorageUsage(): Promise<void> {
  const usage = await getStorageUsage()

  const totalBytes = usage.words + usage.srs + usage.sentences + usage.progress || 1

  const pct = (bytes: number) => Math.round((bytes / totalBytes) * 100)

  setText('bu-storage-words', formatBytes(usage.words))
  setStorageBar('bu-storage-words-bar', pct(usage.words))

  setText('bu-storage-srs', formatBytes(usage.srs))
  setStorageBar('bu-storage-srs-bar', pct(usage.srs))

  setText('bu-storage-sentences', formatBytes(usage.sentences))
  setStorageBar('bu-storage-sentences-bar', pct(usage.sentences))

  setText('bu-storage-progress', formatBytes(usage.progress))
  setStorageBar('bu-storage-progress-bar', pct(usage.progress))

  setText('bu-storage-total', formatBytes(totalBytes))
}

function setStorageBar(id: string, pct: number): void {
  const el = document.getElementById(id)
  if (el) el.style.width = `${pct}%`
}

function bindEvents(): void {
  document.getElementById('btn-back')?.addEventListener('click', () => window.close())
  document.getElementById('btn-export')?.addEventListener('click', exportAllData)
  document.getElementById('btn-import')?.addEventListener('click', importBackup)
}

async function exportAllData(): Promise<void> {
  try {
    const [wordBank, srsCards, sentences, settings, progress] = await Promise.all([
      chrome.storage.local.get('wordBank'),
      chrome.storage.local.get('srsCards'),
      chrome.storage.local.get('sentences'),
      chrome.storage.local.get('settings'),
      chrome.storage.local.get('progress'),
    ])

    const backup: KumoBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        wordBank: wordBank.wordBank,
        srsCards: srsCards.srsCards,
        sentences: sentences.sentences,
        settings: settings.settings,
        progress: progress.progress,
      }
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob(['\uFEFF' + json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kumo-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('Failed to export data: ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
}

async function importBackup(): Promise<void> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    const resultEl = document.getElementById('bu-import-result')
    if (!resultEl) return

    try {
      const text = await file.text()
      const backup: KumoBackup = JSON.parse(text)

      // Validate
      if (!backup.version || !backup.data) {
        showImportResult(resultEl, 'error', 'Invalid backup file format. Expected a Kumo backup JSON.')
        return
      }

      let importedCount = 0
      let skippedCount = 0

      // Import word bank (merge)
      if (backup.data.wordBank) {
        const existing = await chrome.storage.local.get('wordBank')
        const merged = { ...existing.wordBank }
        for (const [word, entry] of Object.entries(backup.data.wordBank)) {
          if (!merged[word]) {
            merged[word] = entry
            importedCount++
          } else {
            skippedCount++
          }
        }
        await chrome.storage.local.set({ wordBank: merged })
      }

      // Import SRS cards (merge - no duplicates by word)
      if (backup.data.srsCards && Array.isArray(backup.data.srsCards)) {
        const existing = await chrome.storage.local.get('srsCards')
        const cards = (backup.data.srsCards || []) as Array<{ word: string }>
        const existingWords = new Set((existing.srsCards || []).map((c: { word: string }) => c.word))
        const newCards = cards.filter((c: { word: string }) => !existingWords.has(c.word))
        await chrome.storage.local.set({
          srsCards: [...(existing.srsCards || []), ...newCards]
        })
        importedCount += newCards.length
        skippedCount += backup.data.srsCards.length - newCards.length
      }

      // Import sentences (merge - no duplicates by id)
      if (backup.data.sentences && Array.isArray(backup.data.sentences)) {
        const existing = await chrome.storage.local.get('sentences')
        const sents = (backup.data.sentences || []) as Array<{ id: string }>
        const existingIds = new Set((existing.sentences || []).map((s: { id: string }) => s.id))
        const newSentences = sents.filter((s: { id: string }) => !existingIds.has(s.id))
        await chrome.storage.local.set({
          sentences: [...(existing.sentences || []), ...newSentences]
        })
        importedCount += newSentences.length
        skippedCount += backup.data.sentences.length - newSentences.length
      }

      // Import settings (always overwrite)
      if (backup.data.settings) {
        await chrome.storage.local.set({ settings: backup.data.settings })
        importedCount++
      }

      // Import progress (merge daily stats, keep longest streak)
      if (backup.data.progress) {
        const existing = await chrome.storage.local.get('progress')
        const merged = existing.progress || {}
        // Merge daily stats
        if (backup.data.progress.dailyStats) {
          merged.dailyStats = {
            ...backup.data.progress.dailyStats,
            ...(merged.dailyStats || {})
          }
        }
        // Keep the higher values for totals
        for (const key of ['longestStreak', 'totalWordsLearned', 'totalReviewsDone'] as const) {
          if (typeof backup.data.progress[key] === 'number') {
            merged[key] = Math.max(merged[key] || 0, backup.data.progress[key])
          }
        }
        // Only import sessions if existing has none
        if (!merged.sessions || merged.sessions.length === 0) {
          merged.sessions = backup.data.progress.sessions || []
        }
        await chrome.storage.local.set({ progress: merged })
        importedCount++
      }

      showImportResult(resultEl, 'success',
        `✅ Import complete! Imported ${importedCount} item(s) (${skippedCount} duplicate(s) skipped). Refreshing stats...`
      )

      // Refresh UI
      await loadExportStats()
      await loadStorageUsage()
    } catch (e) {
      showImportResult(resultEl, 'error',
        'Failed to import: ' + (e instanceof Error ? e.message : 'Invalid JSON file')
      )
    }
  })
  input.click()
}

function showImportResult(el: HTMLElement, type: 'success' | 'error', message: string): void {
  el.className = `bu-import-result ${type}`
  el.textContent = message
  el.classList.remove('hidden')
  setTimeout(() => {
    el.classList.add('hidden')
  }, 8000)
}

// --- Helpers ---

interface BackupStats {
  wordCount: number
  srsCount: number
  sentenceCount: number
  progressDays: number
}

async function computeBackupStats(): Promise<BackupStats> {
  const [wordBank, srsCards, sentences, progress] = await Promise.all([
    chrome.storage.local.get('wordBank'),
    chrome.storage.local.get('srsCards'),
    chrome.storage.local.get('sentences'),
    chrome.storage.local.get('progress'),
  ])

  return {
    wordCount: wordBank.wordBank ? Object.keys(wordBank.wordBank).length : 0,
    srsCount: srsCards.srsCards ? srsCards.srsCards.length : 0,
    sentenceCount: sentences.sentences ? sentences.sentences.length : 0,
    progressDays: progress.progress?.dailyStats ? Object.keys(progress.progress.dailyStats).length : 0,
  }
}

interface StorageUsage {
  words: number
  srs: number
  sentences: number
  progress: number
}

async function getStorageUsage(): Promise<StorageUsage> {
  const all = await chrome.storage.local.get(null)
  const size = (key: string) => {
    const val = all[key]
    if (!val) return 0
    return new TextEncoder().encode(JSON.stringify(val)).length
  }

  return {
    words: size('wordBank'),
    srs: size('srsCards'),
    sentences: size('sentences'),
    progress: size('progress'),
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}
