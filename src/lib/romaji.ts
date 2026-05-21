// Romaji conversion module for Kumo
// Shared by content script popup (Kumo Card) and furigana system

import { katakanaToHiragana } from './dictionary'

// Hiragana → Romaji conversion table
const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o',
  'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
  'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','を':'wo','ん':'n',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja','じゅ':'ju','じょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  'っ':'','ー':'-','。':'.','、':',',
}

/** Convert hiragana (or katakana) to romaji.
 *  Handles sokuon (っ/ッ = gemination), youon (きゃ etc.), and basic kana. */
export function hiraganaToRomaji(kana: string): string {
  if (!kana) return ''
  // Convert katakana to hiragana first so we only need one lookup table
  const hiragana = katakanaToHiragana(kana)
  let result = ''
  let i = 0
  let geminate = false // true when previous char was っ, next consonant doubles

  while (i < hiragana.length) {
    const ch = hiragana[i]

    // Handle っ (sokuon / gemination marker) — set flag, skip char
    if (ch === 'っ') {
      geminate = true
      i++
      continue
    }

    // Try two-char match first (for youon like きゃ, しゅ, ちょ)
    let roma = ''
    if (i + 1 < hiragana.length) {
      const two = hiragana.slice(i, i + 2)
      if (HIRAGANA_TO_ROMAJI[two]) {
        roma = HIRAGANA_TO_ROMAJI[two]
        i += 2
      }
    }

    // Fall back to single-char match
    if (!roma) {
      roma = HIRAGANA_TO_ROMAJI[ch] || ch
      i++
    }

    // Apply gemination: double the first consonant of the romaji
    if (geminate && roma) {
      // e.g. 'ta' → 'tta', 'sha' → 'ssha', 'kyu' → 'kkyu'
      roma = roma[0] + roma
      geminate = false
    }

    result += roma
  }

  return result
}
