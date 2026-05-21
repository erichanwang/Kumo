// i18n system for Kumo extension
// Supports en (English) and ja (Japanese) with extensible structure

export type Locale = 'en' | 'ja'

export interface TranslationDict {
  // Popup
  popup_title: string
  popup_furigana: string
  popup_youtube: string
  popup_auto_pause: string
  popup_show_romaji: string
  popup_streak: string
  popup_longest_streak: string
  popup_today: string
  popup_words_looked_up: string
  popup_words_saved: string
  popup_sentences_mined: string
  popup_srs: string
  popup_srs_due: string
  popup_srs_total: string
  popup_srs_mastered: string
  popup_open_srs: string
  popup_open_wordbank: string
  popup_jlpt_progress: string

  // Word Bank
  wb_title: string
  wb_search: string
  wb_filter_jlpt: string
  wb_filter_known: string
  wb_filter_starred: string
  wb_all: string
  wb_known: string
  wb_unknown: string
  wb_starred: string
  wb_export_csv: string
  wb_export_anki: string
  wb_export_json: string
  wb_word: string
  wb_reading: string
  wb_definitions: string
  wb_jlpt: string
  wb_saved_at: string
  wb_actions: string
  wb_no_entries: string
  wb_add_srs: string
  wb_delete: string
  wb_mark_known: string
  wb_mark_learning: string

  // SRS
  srs_title: string
  srs_due: string
  srs_mastered: string
  srs_show_answer: string
  srs_new_card: string
  srs_interval: string
  srs_again: string
  srs_hard: string
  srs_good: string
  srs_easy: string
  srs_perfect: string
  srs_session_complete: string
  srs_total: string
  srs_correct: string
  srs_accuracy: string
  srs_back_home: string
  srs_open_wordbank: string
  srs_no_due: string
  srs_no_due_msg: string

  // Keyboard
  kb_furigana_toggle: string
  kb_mark_known: string
  kb_save_word: string
  kb_mine_sentence: string
  kb_srs_review: string

  // Common
  common_loading: string
  common_error: string
  common_yes: string
  common_no: string
  common_cancel: string
  common_save: string
  common_close: string
  common_back: string
}

const en: TranslationDict = {
  popup_title: 'Kumo',
  popup_furigana: 'Furigana',
  popup_youtube: 'YouTube Subtitles',
  popup_auto_pause: 'Auto-Pause',
  popup_show_romaji: 'Show Rōmaji',
  popup_streak: 'Streak',
  popup_longest_streak: 'Best',
  popup_today: 'Today',
  popup_words_looked_up: 'Looked up',
  popup_words_saved: 'Saved',
  popup_sentences_mined: 'Mined',
  popup_srs: 'SRS',
  popup_srs_due: 'Due',
  popup_srs_total: 'Total',
  popup_srs_mastered: 'Mastered',
  popup_open_srs: 'Review',
  popup_open_wordbank: 'Word Bank',
  popup_jlpt_progress: 'JLPT Progress',

  wb_title: 'Word Bank',
  wb_search: 'Search...',
  wb_filter_jlpt: 'JLPT',
  wb_filter_known: 'Status',
  wb_filter_starred: 'Starred',
  wb_all: 'All',
  wb_known: 'Known',
  wb_unknown: 'Learning',
  wb_starred: '⭐ Starred',
  wb_export_csv: 'CSV',
  wb_export_anki: 'Anki',
  wb_export_json: 'JSON',
  wb_word: 'Word',
  wb_reading: 'Reading',
  wb_definitions: 'Definitions',
  wb_jlpt: 'JLPT',
  wb_saved_at: 'Saved',
  wb_actions: '',
  wb_no_entries: 'No matching entries.',
  wb_add_srs: 'Add to SRS',
  wb_delete: 'Delete',
  wb_mark_known: 'Mark as known',
  wb_mark_learning: 'Mark as learning',

  srs_title: 'SRS Review',
  srs_due: 'due',
  srs_mastered: 'mastered',
  srs_show_answer: 'Show Answer (Space)',
  srs_new_card: 'New card',
  srs_interval: 'Interval',
  srs_again: 'Again (1)',
  srs_hard: 'Hard (2)',
  srs_good: 'Good (3)',
  srs_easy: 'Easy (4)',
  srs_perfect: 'Perfect (5)',
  srs_session_complete: 'Session Complete!',
  srs_total: 'Total',
  srs_correct: 'Correct',
  srs_accuracy: 'Accuracy',
  srs_back_home: 'Back to Popup',
  srs_open_wordbank: 'Word Bank',
  srs_no_due: 'All caught up! 🎉',
  srs_no_due_msg: 'No cards are due for review. Add words from your Word Bank or mark new words as you read.',

  kb_furigana_toggle: 'Toggle Furigana',
  kb_mark_known: 'Mark as Known',
  kb_save_word: 'Save Word',
  kb_mine_sentence: 'Mine Sentence',
  kb_srs_review: 'SRS Review',

  common_loading: 'Loading...',
  common_error: 'Error',
  common_yes: 'Yes',
  common_no: 'No',
  common_cancel: 'Cancel',
  common_save: 'Save',
  common_close: 'Close',
  common_back: 'Back'
}

const ja: TranslationDict = {
  popup_title: 'クモ',
  popup_furigana: 'ふりがな',
  popup_youtube: 'YouTube字幕',
  popup_auto_pause: '自動停止',
  popup_show_romaji: 'ローマ字表示',
  popup_streak: '連続日数',
  popup_longest_streak: '最高',
  popup_today: '今日',
  popup_words_looked_up: '調べた単語',
  popup_words_saved: '保存済み',
  popup_sentences_mined: '例文',
  popup_srs: 'SRS',
  popup_srs_due: '復習待ち',
  popup_srs_total: '総数',
  popup_srs_mastered: 'マスター',
  popup_open_srs: '復習する',
  popup_open_wordbank: '単語帳',
  popup_jlpt_progress: 'JLPT進捗',

  wb_title: '単語帳',
  wb_search: '検索...',
  wb_filter_jlpt: 'JLPT',
  wb_filter_known: '状態',
  wb_filter_starred: '⭐',
  wb_all: '全て',
  wb_known: '既知',
  wb_unknown: '学習中',
  wb_starred: '⭐ スター付き',
  wb_export_csv: 'CSV',
  wb_export_anki: 'Anki',
  wb_export_json: 'JSON',
  wb_word: '単語',
  wb_reading: '読み',
  wb_definitions: '意味',
  wb_jlpt: 'JLPT',
  wb_saved_at: '保存日',
  wb_actions: '',
  wb_no_entries: '該当する単語がありません。',
  wb_add_srs: 'SRSに追加',
  wb_delete: '削除',
  wb_mark_known: '既知にする',
  wb_mark_learning: '学習中にする',

  srs_title: 'SRS復習',
  srs_due: '復習待ち',
  srs_mastered: 'マスター済み',
  srs_show_answer: '答えを表示 (Space)',
  srs_new_card: '新規カード',
  srs_interval: '間隔',
  srs_again: 'もう一度 (1)',
  srs_hard: '難しい (2)',
  srs_good: '普通 (3)',
  srs_easy: '簡単 (4)',
  srs_perfect: '完璧 (5)',
  srs_session_complete: 'セッション完了！',
  srs_total: '合計',
  srs_correct: '正解',
  srs_accuracy: '正解率',
  srs_back_home: 'ポップアップに戻る',
  srs_open_wordbank: '単語帳',
  srs_no_due: 'おめでとう！🎉',
  srs_no_due_msg: '復習待ちのカードはありません。単語帳から単語を追加するか、読書中に新しい単語をマークしてください。',

  kb_furigana_toggle: 'ふりがな切り替え',
  kb_mark_known: '既知にする',
  kb_save_word: '単語を保存',
  kb_mine_sentence: '例文を保存',
  kb_srs_review: 'SRS復習',

  common_loading: '読み込み中...',
  common_error: 'エラー',
  common_yes: 'はい',
  common_no: 'いいえ',
  common_cancel: 'キャンセル',
  common_save: '保存',
  common_close: '閉じる',
  common_back: '戻る'
}

const translations: Record<Locale, TranslationDict> = { en, ja }

let currentLocale: Locale = 'en'

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: keyof TranslationDict): string {
  return translations[currentLocale][key] ?? key
}

export function detectLocale(): Locale {
  const navLang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return navLang.startsWith('ja') ? 'ja' : 'en'
}

export function populateI18n(root: Document | HTMLElement = document): void {
  const elements = root.querySelectorAll('[data-i18n]')
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n') as keyof TranslationDict
    if (key) {
      el.textContent = t(key)
    }
  })

  // Placeholder attributes
  const placeholders = root.querySelectorAll('[data-i18n-placeholder]')
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as keyof TranslationDict
    if (key) {
      ;(el as HTMLInputElement).placeholder = t(key)
    }
  })

  // Title attributes
  const titles = root.querySelectorAll('[data-i18n-title]')
  titles.forEach(el => {
    const key = el.getAttribute('data-i18n-title') as keyof TranslationDict
    if (key) {
      el.setAttribute('title', t(key))
    }
  })
}
