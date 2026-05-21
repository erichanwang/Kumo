// Anki .apkg export module for Kumo
// Creates Anki-compatible CSV/TSV files with optional media references

import type { WordEntry } from './storage'

export type AnkiExportFormat = 'basic' | 'reversed' | 'cloze'

export interface AnkiNote {
  guid: string
  fields: string[]
  tags: string[]
  model?: string
}

export function wordEntriesToAnkiNotes(
  entries: [string, WordEntry][],
  format: AnkiExportFormat = 'basic'
): AnkiNote[] {
  return entries.map(([word, entry]) => {
    const reading = entry.reading || ''
    const definition = entry.definitions.join('<br>') || ''
    const jlpt = entry.jlpt ? `kumo::${entry.jlpt}` : 'kumo'
    const tags = [jlpt, entry.known ? 'kumo::known' : 'kumo::learning']
    if (entry.starred) tags.push('kumo::starred')

    switch (format) {
      case 'basic':
        return {
          guid: `kumo-${word}`,
          fields: [
            word,                                          // Front
            `${reading}<br><br>${definition}`,             // Back
          ],
          tags
        }
      case 'reversed':
        return {
          guid: `kumo-rev-${word}`,
          fields: [
            `${reading}<br><br>${definition}`,             // Front (reading+def)
            word,                                          // Back (kanji)
          ],
          tags
        }
      case 'cloze':
        return {
          guid: `kumo-cloze-${word}`,
          fields: [
            `{{c1::${word}}} [${reading}]`,               // Text with cloze
            definition,                                    // Extra
          ],
          tags
        }
    }
  })
}

export function generateAnkiCSV(notes: AnkiNote[], includeHeader: boolean = true): string {
  const lines: string[] = []

  if (includeHeader) {
    lines.push('#separator:tab')
    lines.push('#html:true')
    lines.push('#tags column:3')
    lines.push('#guid column:1')
    lines.push('')
  }

  for (const note of notes) {
    const row = [note.guid, ...note.fields, note.tags.join(' ')]
    lines.push(row.join('\t'))
  }

  return lines.join('\n')
}

export function downloadAnkiFile(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
