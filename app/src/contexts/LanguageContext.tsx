import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Language, type Translations, translations, detectLanguage } from '../i18n'

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: keyof Translations) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'kumo-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    // Check localStorage first, then browser preference, default to EN
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'ja' || stored === 'en') return stored
    } catch { /* ignore */ }
    return detectLanguage()
  })

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: keyof Translations): string => {
    return translations[lang][key] ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useT(): (key: keyof Translations) => string {
  return useLanguage().t
}
