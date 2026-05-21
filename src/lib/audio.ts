// Audio pronunciation using Web Speech API
// Provides native Japanese text-to-speech for words

let cachedVoices: SpeechSynthesisVoice[] = []
let voicesLoaded = false

export async function getJapaneseVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!('speechSynthesis' in window)) return null

  if (!voicesLoaded) {
    await new Promise<void>((resolve) => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        cachedVoices = voices
        voicesLoaded = true
        resolve()
      } else {
        speechSynthesis.onvoiceschanged = () => {
          cachedVoices = speechSynthesis.getVoices()
          voicesLoaded = true
          resolve()
        }
      }
    })
  }

  // Prefer native Japanese voices, then fall back to any Japanese-capable voice
  const jaVoice = cachedVoices.find(v => v.lang === 'ja-JP' && v.localService)
    || cachedVoices.find(v => v.lang === 'ja-JP')
    || cachedVoices.find(v => v.lang.startsWith('ja'))

  return jaVoice || null
}

export async function speakJapanese(text: string, rate: number = 0.85): Promise<void> {
  if (!('speechSynthesis' in window)) return

  // Cancel any ongoing speech
  speechSynthesis.cancel()

  const voice = await getJapaneseVoice()
  if (!voice) {
    console.warn('Kumo: No Japanese voice available')
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.rate = rate
  utterance.pitch = 1.0
  utterance.lang = 'ja-JP'

  speechSynthesis.speak(utterance)
}

export function createSpeakButton(
  word: string,
  className: string = 'kumo-speak-btn'
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = className
  btn.innerHTML = '🔊'
  btn.title = 'Pronounce'
  btn.setAttribute('aria-label', `Pronounce ${word}`)
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    speakJapanese(word)
  })
  return btn
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}

// --- Click/Tap Sound Effects ---

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  } catch {
    return null
  }
}

/** Play a short, subtle tick/click sound for action feedback. */
export function playClickSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  // Short blip: high frequency, quick decay
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

/** Play the custom click sound file (click.mp3) for popup open.
 *  Uses a singleton Audio element — preloaded once, reused to avoid
 *  memory accumulation and overlapping sounds on rapid hovers. */
let clickAudio: HTMLAudioElement | null = null

export function playClickAudio(): void {
  try {
    if (!clickAudio) {
      clickAudio = new Audio(chrome.runtime.getURL('click.mp3'))
      clickAudio.volume = 0.3
      clickAudio.preload = 'auto'
    }
    // Reset and replay on rapid triggers
    clickAudio.currentTime = 0
    clickAudio.play().catch(() => {/* autoplay may be blocked, ignore */})
  } catch {
    // Fallback to Web Audio synthesized sound
    playClickSound()
  }
}

/** Play a brighter success chime for save/star actions. */
export function playSuccessSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.setValueAtTime(1100, now + 0.06)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.1, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.start(now)
  osc.stop(now + 0.2)
}
