// Build-time script to process KanjiDic2 XML into compact JSON
// Run: npx tsx scripts/process-kanjidic.ts
//
// Downloads kanjidic2.xml from edrdg.org (if not already downloaded),
// parses it, and outputs src/data/kanjidic.json

import * as fs from 'fs'
import * as path from 'path'

interface KanjidicEntry {
  on: string[]
  kun: string[]
  meanings: string[]
  jlpt: string | null
  strokes: number
}

async function processKanjidic(): Promise<void> {
  const xmlPath = path.resolve('scripts', 'kanjidic2.xml')
  const outputPath = path.resolve('src', 'data', 'kanjidic.json')

  if (!fs.existsSync(xmlPath)) {
    console.error('kanjidic2.xml not found at', xmlPath)
    console.error('Download from https://www.edrdg.org/kanjidic/kanjidic2.xml')
    console.error('Place as scripts/kanjidic2.xml')
    process.exit(1)
  }

  console.log('Reading KanjiDic2 XML...')
  const xml = fs.readFileSync(xmlPath, 'utf-8')

  console.log('Parsing entries...')
  const entries = parseKanjidicXML(xml)

  console.log(`Parsed ${Object.keys(entries).length} kanji entries`)

  const dataDir = path.resolve('src', 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  console.log('Writing JSON...')
  fs.writeFileSync(outputPath, JSON.stringify(entries), 'utf-8')

  const stats = fs.statSync(outputPath)
  console.log(`Written to ${outputPath} (${(stats.size / 1024).toFixed(2)} KB)`)
}

function parseKanjidicXML(xml: string): Record<string, KanjidicEntry> {
  const result: Record<string, KanjidicEntry> = {}

  const charRegex = /<character>([\s\S]*?)<\/character>/g
  let charMatch

  while ((charMatch = charRegex.exec(xml)) !== null) {
    const charXml = charMatch[1]

    // Extract literal (kanji)
    const litMatch = charXml.match(/<literal>([^<]+)<\/literal>/)
    if (!litMatch) continue
    const kanji = litMatch[1]

    // Extract stroke count
    const strokesMatch = charXml.match(/<stroke_count>(\d+)<\/stroke_count>/)
    const strokes = strokesMatch ? parseInt(strokesMatch[1]) : 0

    // Extract on readings
    const onRegex = /<reading r_type="ja_on">([^<]+)<\/reading>/g
    const on: string[] = []
    let onMatch
    while ((onMatch = onRegex.exec(charXml)) !== null) {
      on.push(onMatch[1])
    }

    // Extract kun readings
    const kunRegex = /<reading r_type="ja_kun">([^<]+)<\/reading>/g
    const kun: string[] = []
    let kunMatch
    while ((kunMatch = kunRegex.exec(charXml)) !== null) {
      kun.push(kunMatch[1])
    }

    // Extract meanings
    const meaningRegex = /<meaning[^>]*>([^<]+)<\/meaning>/g
    const meanings: string[] = []
    let meaningMatch
    while ((meaningMatch = meaningRegex.exec(charXml)) !== null) {
      meanings.push(meaningMatch[1])
    }

    // JLPT level from misc info
    const jlptMatch = charXml.match(/<jlpt>(\d+)<\/jlpt>/)
    const jlpt = jlptMatch ? `N${jlptMatch[1]}` : null

    result[kanji] = { on, kun, meanings, jlpt, strokes }
  }

  return result
}

processKanjidic().catch(console.error)
