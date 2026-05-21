// Sentence mining system for Kumo
// Captures sentence context around words for vocabulary building

export interface SavedSentence {
  id: string
  sentence: string
  translation: string       // manual or auto
  targetWord: string        // the word being studied
  targetReading: string
  sourceUrl: string
  sourceTitle: string
  savedAt: number
  tags: string[]
  notes: string
}

export interface SentenceContext {
  sentence: string
  targetWord: string
  targetPosition: number   // index of target word in sentence
}

// --- Sentence extraction ---

export function extractSentenceContext(
  element: HTMLElement,
  targetWord: string
): SentenceContext | null {
  // Walk up to find a containing block-level element
  let container: HTMLElement | null = element
  while (container && !isBlockElement(container)) {
    container = container.parentElement
  }

  if (!container) return null

  const fullText = container.textContent || ''
  const wordIndex = fullText.indexOf(targetWord)
  if (wordIndex === -1) return null

  // Extract the sentence containing the target word
  const sentence = extractSentence(fullText, wordIndex, targetWord.length)
  if (!sentence) return null

  return {
    sentence: sentence.trim(),
    targetWord,
    targetPosition: sentence.indexOf(targetWord)
  }
}

function extractSentence(text: string, targetStart: number, targetLen: number): string {
  // Find sentence boundaries (。！？.!?  around the target)
  const targetEnd = targetStart + targetLen

  let sentenceStart = 0
  let sentenceEnd = text.length

  // Look backwards for sentence boundary
  for (let i = targetStart - 1; i >= 0; i--) {
    if (isSentenceBoundary(text[i])) {
      sentenceStart = i + 1
      break
    }
  }

  // Look forwards for sentence boundary
  for (let i = targetEnd; i < text.length; i++) {
    if (isSentenceBoundary(text[i])) {
      sentenceEnd = i + 1
      break
    }
  }

  return text.slice(sentenceStart, sentenceEnd)
}

function isSentenceBoundary(ch: string): boolean {
  return '。！？.!?\n'.includes(ch)
}

function isBlockElement(el: Element): boolean {
  const blockTags = new Set([
    'P', 'DIV', 'SECTION', 'ARTICLE', 'LI', 'TD', 'BLOCKQUOTE',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FIGCAPTION'
  ])
  return blockTags.has(el.tagName)
}

// --- Storage ---

export async function loadSentences(): Promise<SavedSentence[]> {
  const result = await chrome.storage.local.get('sentences')
  return result.sentences ?? []
}

export async function saveSentence(entry: Omit<SavedSentence, 'id'>): Promise<SavedSentence> {
  const sentences = await loadSentences()
  const id = generateId()
  const full: SavedSentence = { ...entry, id }
  sentences.unshift(full)
  await chrome.storage.local.set({ sentences })
  return full
}

export async function deleteSentence(id: string): Promise<void> {
  const sentences = await loadSentences()
  await chrome.storage.local.set({ sentences: sentences.filter(s => s.id !== id) })
}

export async function updateSentence(id: string, updates: Partial<SavedSentence>): Promise<void> {
  const sentences = await loadSentences()
  const idx = sentences.findIndex(s => s.id === id)
  if (idx >= 0) {
    sentences[idx] = { ...sentences[idx], ...updates }
    await chrome.storage.local.set({ sentences })
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
