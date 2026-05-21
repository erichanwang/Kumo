// Dashboard logic for Kumo
// Displays progress charts, SRS stats, JLPT distribution, streak heatmap, and today's activity

import { getWordBank, type WordEntry } from './src/lib/storage'
import { loadSrsCards, getSrsStats, getDueCards, getNextReviewTime } from './src/lib/srs'
import { loadProgress, getTodayStats, getStreakLength } from './src/lib/progress'

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData()
  bindEvents()
})

async function loadAllData(): Promise<void> {
  await loadOverviewStats()
  await loadJlptProgress()
  await loadStreakHeatmap()
  await loadSrsDonut()
  await loadTodayActivity()
  await loadRecentActivity()
}

// --- Overview Stats ---

async function loadOverviewStats(): Promise<void> {
  const bank = await getWordBank()
  const entries = Object.values(bank)
  const cards = await loadSrsCards()
  const dueCards = getDueCards(cards)
  const stats = getSrsStats(cards)
  const progress = await loadProgress()

  setText('stat-total-words', entries.length)
  setText('stat-known-words', entries.filter(e => e.known).length)
  setText('stat-srs-total', stats.total)
  setText('stat-srs-due', stats.due)
  setText('stat-mastered', stats.mastered)

  // Streak
  const streak = progress.streakStart && progress.streakEnd
    ? getStreakLength(progress.streakStart, progress.streakEnd)
    : 0
  setText('stat-streak', streak)
}

// --- JLPT Progress ---

async function loadJlptProgress(): Promise<void> {
  const bank = await getWordBank()
  const entries = Object.values(bank)

  const jlptTotals: Record<string, number> = { N5: 103, N4: 181, N3: 365, N2: 372, N1: 347 }

  for (const [level, total] of Object.entries(jlptTotals)) {
    const lower = level.toLowerCase()
    const knownCount = entries.filter(e => e.jlpt === level && e.known).length
    const allCount = entries.filter(e => e.jlpt === level).length
    const pct = Math.round((knownCount / total) * 100)

    const fillEl = document.getElementById(`jlpt-fill-${lower}`)
    const pctEl = document.getElementById(`jlpt-pct-${lower}`)
    const countEl = document.getElementById(`jlpt-count-${lower}`)
    if (fillEl) fillEl.style.width = `${Math.min(pct, 100)}%`
    if (pctEl) pctEl.textContent = `${pct}%`
    if (countEl) countEl.textContent = `${knownCount}/${total}`
  }
}

// --- Streak Heatmap (last 12 weeks) ---

async function loadStreakHeatmap(): Promise<void> {
  const progress = await loadProgress()
  const container = document.getElementById('streak-heatmap')
  if (!container) return

  const today = new Date()
  const totalDays = 84 // 12 weeks
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - totalDays + 1)

  // Build a map of date -> activity count
  const activityMap = new Map<string, number>()
  for (const [dateStr, stats] of Object.entries(progress.dailyStats)) {
    const totalActivity = stats.wordsLookedUp + stats.wordsSaved + stats.srsReviewsCompleted + stats.sentencesMined
    activityMap.set(dateStr, totalActivity)
  }

  // Generate heatmap grid by weeks
  let html = '<div class="heatmap-grid">'

  // Day labels on the left
  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']
  html += '<div class="heatmap-week">'
  for (const label of dayLabels) {
    html += `<div class="heatmap-label">${label}</div>`
  }
  html += '</div>'

  // Group into weeks (rows)
  for (let week = 0; week < 12; week++) {
    html += '<div class="heatmap-week">'
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayIndex = week * 7 + dayOfWeek
      const date = new Date(startDate)
      date.setDate(date.getDate() + dayIndex)
      const key = date.toISOString().slice(0, 10)

      const activity = activityMap.get(key) || 0
      const colorClass = getHeatmapColor(activity)
      const title = `${key}: ${activity} activities`

      html += `<div class="heatmap-cell ${colorClass}" title="${title}"></div>`
    }
    html += '</div>'
  }
  html += '</div>'

  // Month labels at the top
  let monthHtml = '<div class="heatmap-month">'
  let lastMonth = -1
  for (let day = 0; day < totalDays; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    const month = date.getMonth()
    if (month !== lastMonth && date.getDate() <= 7) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      monthHtml += `<span class="heatmap-month-label" style="width:${14 * 7 + 3 * 6}px">${monthNames[month]}</span>`
    }
    lastMonth = month
  }
  monthHtml += '</div>'

  container.innerHTML = monthHtml + html
}

function getHeatmapColor(activity: number): string {
  if (activity === 0) return 'cell-0'
  if (activity <= 3) return 'cell-low'
  if (activity <= 10) return 'cell-mid'
  if (activity <= 25) return 'cell-high'
  return 'cell-max'
}

// --- SRS Donut Chart ---

async function loadSrsDonut(): Promise<void> {
  const cards = await loadSrsCards()
  const stats = getSrsStats(cards)

  const total = stats.total || 1
  const duePct = (stats.due / total) * 100
  const masteredPct = (stats.mastered / total) * 100
  const newPct = (stats.new / total) * 100
  const learningPct = 100 - duePct - masteredPct - newPct

  setText('srs-donut-total', stats.total)
  setText('srs-legend-due', stats.due)
  setText('srs-legend-mastered', stats.mastered)
  setText('srs-legend-new', stats.new)
  setText('srs-legend-learning', Math.max(0, Math.round(learningPct * total / 100)))

  // Update SVG arcs (simplified visual)
  const dueArc = (duePct / 100) * 377
  const masteredArc = (masteredPct / 100) * 270

  const dueEl = document.getElementById('srs-donut-due')
  const masteredEl = document.getElementById('srs-donut-mastered')
  if (dueEl) dueEl.setAttribute('stroke-dasharray', `${dueArc} 377`)
  if (masteredEl) masteredEl.setAttribute('stroke-dasharray', `${masteredArc} 270`)
}

// --- Today's Activity ---

async function loadTodayActivity(): Promise<void> {
  const todayStats = await getTodayStats()

  if (todayStats) {
    setText('today-looked-up', todayStats.wordsLookedUp)
    setText('today-saved', todayStats.wordsSaved)
    setText('today-known', todayStats.wordsMarkedKnown)
    setText('today-srs', todayStats.srsReviewsCompleted)
    setText('today-mined', todayStats.sentencesMined)
  }
}

// --- Recent Activity ---

async function loadRecentActivity(): Promise<void> {
  const progress = await loadProgress()
  const container = document.getElementById('recent-activity')
  if (!container) return

  // Get the last 10 days of activity
  const days = Object.entries(progress.dailyStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)

  if (days.length === 0) {
    container.innerHTML = '<div class="activity-empty">No recent activity yet. Start browsing Japanese sites with Kumo!</div>'
    return
  }

  const items: { time: string; text: string }[] = []

  for (const [dateStr, stats] of days) {
    const date = new Date(dateStr + 'T00:00:00')
    const relative = getRelativeDate(date)

    if (stats.wordsLookedUp > 0) items.push({ time: relative, text: `🔍 Looked up ${stats.wordsLookedUp} word${stats.wordsLookedUp !== 1 ? 's' : ''}` })
    if (stats.wordsSaved > 0) items.push({ time: relative, text: `⭐ Saved ${stats.wordsSaved} word${stats.wordsSaved !== 1 ? 's' : ''}` })
    if (stats.wordsMarkedKnown > 0) items.push({ time: relative, text: `✅ Marked ${stats.wordsMarkedKnown} word${stats.wordsMarkedKnown !== 1 ? 's' : ''} as known` })
    if (stats.srsReviewsCompleted > 0) items.push({ time: relative, text: `🔄 Completed ${stats.srsReviewsCompleted} SRS review${stats.srsReviewsCompleted !== 1 ? 's' : ''}` })
    if (stats.sentencesMined > 0) items.push({ time: relative, text: `📝 Mined ${stats.sentencesMined} sentence${stats.sentencesMined !== 1 ? 's' : ''}` })
  }

  container.innerHTML = items.slice(0, 30).map(item =>
    `<div class="activity-item"><span>${item.text}</span><span class="activity-time">${item.time}</span></div>`
  ).join('')
}

function getRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// --- Navigation ---

function bindEvents(): void {
  document.getElementById('btn-back')?.addEventListener('click', () => window.close())
  document.getElementById('btn-refresh')?.addEventListener('click', async () => {
    await loadAllData()
  })

  document.getElementById('btn-open-srs')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('srs.html') })
  })
  document.getElementById('btn-open-wordbank')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('wordbank.html') })
  })

  document.getElementById('quick-srs')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('srs.html') })
  })
  document.getElementById('quick-wordbank')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('wordbank.html') })
  })
  document.getElementById('quick-kanji')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('kanji.html') })
  })
}

// --- Helpers ---

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}
