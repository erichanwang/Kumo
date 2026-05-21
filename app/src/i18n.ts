export type Language = 'en' | 'ja'

/** Translation keys for the Kumo website */
export interface Translations {
  // Navbar
  nav_features: string
  nav_how_it_works: string
  nav_pricing: string
  nav_testimonials: string
  nav_faq: string
  nav_docs: string
  nav_blog: string
  nav_download: string
  nav_cta: string

  // Footer
  footer_tagline: string
  footer_product: string
  footer_resources: string
  footer_connect: string
  footer_features: string
  footer_pricing: string
  footer_how_it_works: string
  footer_download: string
  footer_changelog: string
  footer_docs: string
  footer_blog: string
  footer_about: string
  footer_contact: string
  footer_privacy: string
  footer_terms: string
  footer_jmdict: string
  footer_github: string
  footer_webstore: string
  footer_notified: string
  footer_website_updated: string
  footer_extension_updated: string
  footer_version: string

  // Hero
  hero_title_line1: string
  hero_title_line2: string
  hero_subtitle: string
  hero_cta: string
  hero_secondary: string

  // Common
  lang_en: string
  lang_ja: string
}

const en: Translations = {
  nav_features: 'Features',
  nav_how_it_works: 'How It Works',
  nav_pricing: 'Pricing',
  nav_testimonials: 'Testimonials',
  nav_faq: 'FAQ',
  nav_docs: 'Docs',
  nav_blog: 'Blog',
  nav_download: 'Download',
  nav_cta: 'Get Kumo Free',

  footer_tagline: 'Read Japanese anywhere. Learn as you go.',
  footer_product: 'Product',
  footer_resources: 'Resources',
  footer_connect: 'Connect',
  footer_features: 'Features',
  footer_pricing: 'Pricing',
  footer_how_it_works: 'How It Works',
  footer_download: 'Download',
  footer_changelog: 'Changelog',
  footer_docs: 'Documentation',
  footer_blog: 'Blog',
  footer_about: 'About',
  footer_contact: 'Contact',
  footer_privacy: 'Privacy Policy',
  footer_terms: 'Terms of Service',
  footer_jmdict: 'JMdict Attribution',
  footer_github: 'GitHub',
  footer_webstore: 'Chrome Web Store',
  footer_notified: 'Get Notified',
  footer_website_updated: 'Website updated',
  footer_extension_updated: 'Extension updated',
  footer_version: 'Version',

  hero_title_line1: 'Read Japanese',
  hero_title_line2: 'Everywhere you browse.',
  hero_subtitle: 'Every Japanese text on the web — including YouTube captions. Toggle readings on/off as you learn. Works fully offline. Zero friction, zero setup.',
  hero_cta: 'Add to Chrome — Free',
  hero_secondary: 'See how it works',

  lang_en: 'EN',
  lang_ja: '日本語',
}

const ja: Translations = {
  nav_features: '機能',
  nav_how_it_works: '使い方',
  nav_pricing: '料金',
  nav_testimonials: '評判',
  nav_faq: 'FAQ',
  nav_docs: 'ドキュメント',
  nav_blog: 'ブログ',
  nav_download: 'ダウンロード',
  nav_cta: '無料ではじめる',

  footer_tagline: 'どこでも日本語を読もう。読みながら学ぼう。',
  footer_product: '製品',
  footer_resources: 'リソース',
  footer_connect: 'つながる',
  footer_features: '機能',
  footer_pricing: '料金',
  footer_how_it_works: '使い方',
  footer_download: 'ダウンロード',
  footer_changelog: '更新履歴',
  footer_docs: 'ドキュメント',
  footer_blog: 'ブログ',
  footer_about: 'について',
  footer_contact: 'お問い合わせ',
  footer_privacy: 'プライバシーポリシー',
  footer_terms: '利用規約',
  footer_jmdict: 'JMdictについて',
  footer_github: 'GitHub',
  footer_webstore: 'Chromeウェブストア',
  footer_notified: 'お知らせを受け取る',
  footer_website_updated: 'ウェブサイト更新日',
  footer_extension_updated: '拡張機能更新日',
  footer_version: 'バージョン',

  hero_title_line1: '日本語を読もう',
  hero_title_line2: 'どこでも、いつでも。',
  hero_subtitle: 'あらゆる日本語テキストにふりがなを。YouTube字幕にも対応。学習に合わせて読み方をオン/オフ。完全オフライン対応。面倒な設定不要。',
  hero_cta: 'Chromeに追加 — 無料',
  hero_secondary: '使い方を見る',

  lang_en: 'EN',
  lang_ja: '日本語',
}

export const translations: Record<Language, Translations> = { en, ja }

/** Detect browser language preference */
export function detectLanguage(): Language {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as any).userLanguage || ''
    if (lang.startsWith('ja')) return 'ja'
  }
  return 'en'
}
