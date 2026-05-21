// Theme system for Kumo extension pages
// Manages dark/light mode with CSS custom properties

export type Theme = 'dark' | 'light'

interface ThemeColors {
  bg: string
  bgCard: string
  bgInput: string
  border: string
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  accentHover: string
  success: string
  warning: string
  danger: string
  knownColor: string
  unknownColor: string
  shadow: string
}

const darkTheme: ThemeColors = {
  bg: '#0f0f1e',
  bgCard: '#141428',
  bgInput: '#1a1a35',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f5',
  textSecondary: '#a0a0b8',
  textMuted: '#666680',
  accent: '#3a6ff5',
  accentHover: '#5b8af7',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  knownColor: '#4caf50',
  unknownColor: '#ff9800',
  shadow: '0 4px 24px rgba(0,0,0,0.3)'
}

const lightTheme: ThemeColors = {
  bg: '#fafafc',
  bgCard: '#ffffff',
  bgInput: '#f0f0f5',
  border: 'rgba(0,0,0,0.1)',
  text: '#1a1a2e',
  textSecondary: '#555570',
  textMuted: '#8888a0',
  accent: '#3a6ff5',
  accentHover: '#2955e0',
  success: '#2e7d32',
  warning: '#e65100',
  danger: '#c62828',
  knownColor: '#2e7d32',
  unknownColor: '#e65100',
  shadow: '0 4px 24px rgba(0,0,0,0.08)'
}

export function applyThemeColors(theme: Theme, root: HTMLElement = document.documentElement): void {
  const colors = theme === 'dark' ? darkTheme : lightTheme

  root.style.setProperty('--kumo-bg', colors.bg)
  root.style.setProperty('--kumo-bg-card', colors.bgCard)
  root.style.setProperty('--kumo-bg-input', colors.bgInput)
  root.style.setProperty('--kumo-border', colors.border)
  root.style.setProperty('--kumo-text', colors.text)
  root.style.setProperty('--kumo-text-secondary', colors.textSecondary)
  root.style.setProperty('--kumo-text-muted', colors.textMuted)
  root.style.setProperty('--kumo-accent', colors.accent)
  root.style.setProperty('--kumo-accent-hover', colors.accentHover)
  root.style.setProperty('--kumo-success', colors.success)
  root.style.setProperty('--kumo-warning', colors.warning)
  root.style.setProperty('--kumo-danger', colors.danger)
  root.style.setProperty('--kumo-known', colors.knownColor)
  root.style.setProperty('--kumo-unknown', colors.unknownColor)
  root.style.setProperty('--kumo-shadow', colors.shadow)
}

export async function loadTheme(): Promise<Theme> {
  try {
    const result = await chrome.storage.local.get('theme')
    if (result.theme) return result.theme as Theme
    // No theme saved yet — detect from system preference
    return detectSystemTheme()
  } catch {
    return detectSystemTheme()
  }
}

/** Detect the user's system color scheme preference. */
export function detectSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

export async function saveTheme(theme: Theme): Promise<void> {
  await chrome.storage.local.set({ theme })
  applyThemeColors(theme)
}
