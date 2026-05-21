// Vocabulary Quiz for Kumo
// Multiple choice quiz testing reading/meaning recognition from saved words

import { getWordBank, type WordEntry } from './src/lib/storage'

interface QuizQuestion {
  word: string
  reading: string
  definitions: string[]
  jlpt: string | null
  prompt: string
  answer: string
  options: string[]
  correctIndex: number
}

let questions: QuizQuestion[] = []
let currentQuestion = 0
let correctCount = 0
let totalAnswered = 0
let quizActive = false
let selectedLevels = new Set<string>()
let wrongWords: { word: string; answer: string }[] = []
let allEntriesMap = new Map<string, WordEntry>()

document.addEventListener('DOMContentLoaded', () => {
  bindEvents()
})

function bindEvents(): void {
  document.getElementById('btn-back')?.addEventListener('click', () => window.close())
  document.getElementById('btn-start-quiz')?.addEventListener('click', startQuiz)
  document.getElementById('btn-next')?.addEventListener('click', nextQuestion)
  document.getElementById('btn-retry')?.addEventListener('click', retryQuiz)
  document.getElementById('btn-back-setup')?.addEventListener('click', showSetup)
}

async function startQuiz(): Promise<void> {
  // Get selected levels
  selectedLevels.clear()
  document.querySelectorAll<HTMLInputElement>('#qz-levels input:checked').forEach(cb => {
    selectedLevels.add(cb.value)
  })

  if (selectedLevels.size === 0) {
    setText('qz-setup-hint', '⚠️ Select at least one JLPT level to start!')
    return
  }

  // Get question type
  const typeEl = document.querySelector<HTMLInputElement>('input[name="qz-type"]:checked')
  const type = typeEl?.value || 'reading'

  // Get question count
  const countEl = document.getElementById('qz-count') as HTMLSelectElement
  const maxQuestions = parseInt(countEl.value)

  // Load words from bank and build entry map
  const bank = await getWordBank()
  allEntriesMap = new Map(Object.entries(bank))

  const entries = Object.entries(bank).filter(([_, e]) =>
    selectedLevels.has(e.jlpt || '') && e.definitions.length > 0
  )

  if (entries.length === 0) {
    setText('qz-setup-hint', '⚠️ No words found for the selected JLPT levels! Save some words first.')
    return
  }

  if (entries.length < 4) {
    setText('qz-setup-hint', '⚠️ Need at least 4 words for a quiz. Save more words or select more levels!')
    return
  }

  // Limit questions
  const quizEntries = maxQuestions > 0
    ? shuffleArray(entries).slice(0, maxQuestions)
    : shuffleArray(entries)

  // Generate questions
  questions = quizEntries.map(([word, entry]) => {
    return generateQuestion(word, entry, entries, type)
  })

  // Reset state
  currentQuestion = 0
  correctCount = 0
  totalAnswered = 0
  wrongWords = []

  // Show quiz screen
  showQuizScreen()
  renderQuestion()
}

function generateQuestion(
  word: string,
  entry: WordEntry,
  allEntries: [string, WordEntry][],
  type: string
): QuizQuestion {
  // Pick 3 distractors from other words
  const distractors = shuffleArray(
    allEntries.filter(([w]) => w !== word)
  ).slice(0, 3).map(([w]) => w)

  // Create options with correct answer placed randomly
  const options = shuffleArray([word, ...distractors])
  const correctIndex = options.indexOf(word)

  if (type === 'reading') {
    return {
      word,
      reading: entry.reading,
      definitions: entry.definitions,
      jlpt: entry.jlpt,
      prompt: entry.reading || word,
      answer: word,
      options,
      correctIndex
    }
  } else {
    const def = entry.definitions[0] || word
    return {
      word,
      reading: entry.reading,
      definitions: entry.definitions,
      jlpt: entry.jlpt,
      prompt: def,
      answer: word,
      options,
      correctIndex
    }
  }
}

function showQuizScreen(): void {
  document.getElementById('qz-setup')?.classList.add('hidden')
  document.getElementById('qz-quiz')?.classList.remove('hidden')
  document.getElementById('qz-results')?.classList.add('hidden')
  document.getElementById('qz-feedback')?.classList.add('hidden')
}

function renderQuestion(): void {
  if (currentQuestion >= questions.length) {
    showResults()
    return
  }

  const q = questions[currentQuestion]
  quizActive = true

  // Update progress
  const pct = (currentQuestion / questions.length) * 100
  const fillEl = document.getElementById('qz-progress-fill')
  if (fillEl) fillEl.style.width = `${pct}%`

  // Update score
  updateScoreDisplay()

  // Question text
  const typeEl = document.querySelector<HTMLInputElement>('input[name="qz-type"]:checked')
  const type = typeEl?.value || 'reading'
  setText('qz-question-label', type === 'reading'
    ? `What word matches the reading "${q.prompt}"?`
    : `Which word means: "${q.prompt}"?`
  )
  setText('qz-question-text', q.prompt)

  // Options
  const optionsEl = document.getElementById('qz-options')
  if (!optionsEl) return

  optionsEl.innerHTML = q.options.map((opt, i) => {
    const entry = allEntriesMap.get(opt)
    const display = entry
      ? `${opt} (${entry.reading})`
      : opt
    return `<button class="qz-option-btn" data-index="${i}">${display}</button>`
  }).join('')

  // Bind option clicks
  optionsEl.querySelectorAll('.qz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!quizActive) return
      const idx = parseInt((btn as HTMLElement).dataset.index || '0')
      handleAnswer(idx)
    })
  })

  // Hide feedback
  document.getElementById('qz-feedback')?.classList.add('hidden')
}

function handleAnswer(selectedIndex: number): void {
  quizActive = false
  totalAnswered++

  const q = questions[currentQuestion]
  const correct = selectedIndex === q.correctIndex

  if (correct) {
    correctCount++
  } else {
    wrongWords.push({
      word: q.word,
      answer: q.options[q.correctIndex]
    })
  }

  // Highlight correct/wrong
  const options = document.querySelectorAll('.qz-option-btn')
  options.forEach((btn, i) => {
    (btn as HTMLButtonElement).disabled = true
    if (i === q.correctIndex) btn.classList.add('correct')
    if (i === selectedIndex && !correct) btn.classList.add('wrong')
  })

  // Show feedback
  const feedbackEl = document.getElementById('qz-feedback')
  if (!feedbackEl) return

  feedbackEl.classList.remove('hidden')
  setText('qz-feedback-icon', correct ? '✅' : '❌')
  setText('qz-feedback-text', correct ? 'Correct!' : 'Not quite')
  setText('qz-feedback-detail', correct
    ? `${q.word} — ${q.definitions.slice(0, 2).join(', ')}`
    : `"${q.word}" (${q.reading}) — ${q.definitions.slice(0, 2).join(', ')}`
  )

  updateScoreDisplay()
}

function updateScoreDisplay(): void {
  setText('qz-score-display', `${correctCount} / ${totalAnswered}`)
  const pctScore = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
  setText('qz-pct-display', `${pctScore}%`)
}

function nextQuestion(): void {
  currentQuestion++
  renderQuestion()
}

function showResults(): void {
  document.getElementById('qz-quiz')?.classList.add('hidden')
  document.getElementById('qz-results')?.classList.remove('hidden')

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0

  setText('qz-result-correct', correctCount)
  setText('qz-result-total', totalAnswered)
  setText('qz-result-accuracy', `${accuracy}%`)

  // Animate results bar
  setTimeout(() => {
    const fillEl = document.getElementById('qz-results-fill')
    if (fillEl) fillEl.style.width = `${accuracy}%`
  }, 100)

  // Show review of wrong words
  const reviewEl = document.getElementById('qz-results-review')
  if (!reviewEl) return

  if (wrongWords.length === 0) {
    reviewEl.innerHTML = '<p style="color:var(--kumo-text-secondary);font-size:14px">🎉 Perfect score! All answers correct!</p>'
  } else {
    reviewEl.innerHTML = '<p style="color:var(--kumo-text-muted);font-size:12px;margin-bottom:8px">Words to review:</p>' +
      wrongWords.map(w =>
        `<div class="qz-review-item">
          <span class="qz-review-icon">📖</span>
          <span class="qz-review-word">${w.word}</span>
          <span class="qz-review-answer">→ ${w.answer}</span>
        </div>`
      ).join('')
  }
}

function retryQuiz(): void {
  document.getElementById('qz-results')?.classList.add('hidden')
  startQuiz()
}

function showSetup(): void {
  document.getElementById('qz-quiz')?.classList.add('hidden')
  document.getElementById('qz-results')?.classList.add('hidden')
  document.getElementById('qz-setup')?.classList.remove('hidden')
  setText('qz-setup-hint', 'Choose settings above and start your quiz!')
}

// --- Helpers ---

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function setText(id: string, value: string | number): void {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}
