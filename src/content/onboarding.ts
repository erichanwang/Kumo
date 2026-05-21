// Onboarding tutorial for first-time Kumo users
// Shows a step-by-step guide overlay on first install

export interface OnboardingStep {
  title: string
  description: string
  highlightSelector?: string
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Kumo! ☁️',
    description: 'Kumo helps you read Japanese by adding furigana (reading hints) and popup definitions to kanji and words. Let\'s get started!'
  },
  {
    title: 'Hover for Definitions',
    description: 'Hover your mouse over any Japanese word with furigana to see its reading, definitions, and JLPT level. Try it on any Japanese website!'
  },
  {
    title: 'Mark Words as Known',
    description: 'Press Alt+K (or right-click → "Mark as Known") on a word to remember it. Known words will show in green, new ones in orange.'
  },
  {
    title: 'Build Your Word Bank',
    description: 'Press Alt+S to save words to your Word Bank. You can review, export, and study them later. Open the popup to see your progress!'
  },
  {
    title: 'SRS Flashcards',
    description: 'Press Alt+R to launch the SRS review. Kumo uses a spaced repetition system (SM-2) to help you remember words long-term.'
  },
  {
    title: 'YouTube Subtitles',
    description: 'Kumo can process YouTube captions in real-time! Enable "YouTube Subtitles" in the popup and watch with furigana on any Japanese video.'
  },
  {
    title: 'Keyboard Shortcuts',
    description: 'Alt+J: Toggle Furigana | Alt+K: Mark Known | Alt+S: Save Word | Alt+M: Mine Sentence | Alt+R: SRS Review'
  }
]

export async function shouldShowOnboarding(): Promise<boolean> {
  const result = await chrome.storage.local.get('onboardingCompleted')
  return !result.onboardingCompleted
}

export async function markOnboardingCompleted(): Promise<void> {
  await chrome.storage.local.set({ onboardingCompleted: true })
}

export function createOnboardingHTML(): string {
  return `
    <div id="kumo-onboarding-overlay">
      <div id="kumo-onboarding-modal">
        <div id="kumo-onboarding-content">
          <div class="kumo-onboarding-logo">☁️ Kumo</div>
          <div id="kumo-onboarding-steps">
            ${STEPS.map((step, i) => `
              <div class="kumo-onboarding-step ${i === 0 ? 'active' : ''}" data-step="${i}">
                <h2>${step.title}</h2>
                <p>${step.description}</p>
              </div>
            `).join('')}
          </div>
          <div class="kumo-onboarding-dots">
            ${STEPS.map((_, i) => `
              <span class="kumo-onboarding-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></span>
            `).join('')}
          </div>
          <div class="kumo-onboarding-actions">
            <button id="kumo-onboarding-prev" class="kumo-onboarding-btn secondary" disabled>← Back</button>
            <span class="kumo-onboarding-counter">1 / ${STEPS.length}</span>
            <button id="kumo-onboarding-next" class="kumo-onboarding-btn primary">Next →</button>
          </div>
          <button id="kumo-onboarding-skip" class="kumo-onboarding-skip">Skip tutorial</button>
        </div>
      </div>
    </div>
  `
}

export function injectOnboardingStyles(): void {
  const style = document.createElement('style')
  style.id = 'kumo-onboarding-styles'
  style.textContent = `
    #kumo-onboarding-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: kumo-fadein 0.3s ease-out;
    }
    #kumo-onboarding-modal {
      background: #141428;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: kumo-scalein 0.3s ease-out;
    }
    #kumo-onboarding-content {
      padding: 40px 36px;
      text-align: center;
    }
    .kumo-onboarding-logo {
      font-size: 28px;
      font-weight: 800;
      color: #f0f0f5;
      margin-bottom: 32px;
    }
    .kumo-onboarding-step {
      display: none;
      min-height: 120px;
    }
    .kumo-onboarding-step.active {
      display: block;
    }
    .kumo-onboarding-step h2 {
      font-size: 20px;
      font-weight: 700;
      color: #f0f0f5;
      margin-bottom: 12px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .kumo-onboarding-step p {
      font-size: 14px;
      color: #a0a0b8;
      line-height: 1.7;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .kumo-onboarding-dots {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 24px 0;
    }
    .kumo-onboarding-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      transition: background 0.2s;
    }
    .kumo-onboarding-dot.active {
      background: #3a6ff5;
    }
    .kumo-onboarding-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kumo-onboarding-btn {
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
      transition: all 0.15s;
    }
    .kumo-onboarding-btn.primary {
      background: linear-gradient(135deg, #3a6ff5, #5b4ff5);
      color: #fff;
      flex: 1;
    }
    .kumo-onboarding-btn.secondary {
      background: rgba(255,255,255,0.06);
      color: #a0a0b8;
      flex: 1;
    }
    .kumo-onboarding-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .kumo-onboarding-counter {
      font-size: 12px;
      color: #666680;
      min-width: 48px;
      text-align: center;
    }
    .kumo-onboarding-skip {
      display: block;
      margin: 20px auto 0;
      background: none;
      border: none;
      color: #666680;
      font-size: 12px;
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .kumo-onboarding-skip:hover { color: #a0a0b8; }
    @keyframes kumo-scalein {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `
  document.head.appendChild(style)
}

export function initOnboarding(): void {
  const prev = document.getElementById('kumo-onboarding-prev')
  const next = document.getElementById('kumo-onboarding-next')
  const skip = document.getElementById('kumo-onboarding-skip')
  const overlay = document.getElementById('kumo-onboarding-overlay')
  const counter = document.querySelector('.kumo-onboarding-counter')
  const dots = document.querySelectorAll('.kumo-onboarding-dot')

  let currentStep = 0

  function showStep(step: number): void {
    document.querySelectorAll('.kumo-onboarding-step').forEach((s, i) => {
      s.classList.toggle('active', i === step)
    })
    dots.forEach((d, i) => { d.classList.toggle('active', i === step) })
    if (counter) counter.textContent = `${step + 1} / ${STEPS.length}`
    if (prev) (prev as HTMLButtonElement).disabled = step === 0
    if (next) {
      next.textContent = step === STEPS.length - 1 ? 'Get Started →' : 'Next →'
    }
    currentStep = step
  }

  prev?.addEventListener('click', () => showStep(currentStep - 1))
  next?.addEventListener('click', async () => {
    if (currentStep < STEPS.length - 1) {
      showStep(currentStep + 1)
    } else {
      await markOnboardingCompleted()
      overlay?.remove()
      document.getElementById('kumo-onboarding-styles')?.remove()
    }
  })
  skip?.addEventListener('click', async () => {
    await markOnboardingCompleted()
    overlay?.remove()
    document.getElementById('kumo-onboarding-styles')?.remove()
  })
}
