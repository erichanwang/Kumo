// Build-time script to process JMdict XML into compact JSON
// Run: npx tsx scripts/process-jmdict.ts
//
// Downloads JMdict-e.xml from edrdg.org (if not already downloaded),
// parses it, and outputs src/data/jmdict.json
//
// Target output size: ~8MB (common words only for MVP)

import * as fs from 'fs'
import * as path from 'path'

const DICT_URL = 'https://www.edrdg.org/jmdict/j_jmdict.html'
// Note: The actual download URL for the XML file is:
// http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz (compressed)
// or http://ftp.edrdg.org/pub/Nihongo/JMdict_e (uncompressed)
// For simplicity, this script expects a local JMdict_e.xml file

interface JmdictEntry {
  kanji: string
  reading: string
  definitions: string[]
  pos: string
}

async function processJMdict(): Promise<void> {
  const xmlPath = path.resolve('scripts', 'JMdict_e.xml')
  const outputPath = path.resolve('src', 'data', 'jmdict.json')

  if (!fs.existsSync(xmlPath)) {
    console.error('JMdict_e.xml not found at', xmlPath)
    console.error('Download from http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz')
    console.error('Extract and place as scripts/JMdict_e.xml')
    process.exit(1)
  }

  console.log('Reading JMdict XML...')
  const xml = fs.readFileSync(xmlPath, 'utf-8')

  console.log('Parsing entries...')
  const entries = parseJMdictXML(xml)

  console.log(`Parsed ${Object.keys(entries).length} entries`)

  // Ensure data directory exists
  const dataDir = path.resolve('src', 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  console.log('Writing JSON...')
  fs.writeFileSync(outputPath, JSON.stringify(entries), 'utf-8')

  const stats = fs.statSync(outputPath)
  console.log(`Written to ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
}

function parseJMdictXML(xml: string): Record<string, JmdictEntry> {
  const result: Record<string, JmdictEntry> = {}

  // Simple tag-based parsing to avoid heavy XML libraries
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entryXml = entryMatch[1]

    // Extract kanji forms
    const kebRegex = /<keb>([^<]+)<\/keb>/g
    let kebMatch

    // Extract reading
    const rebMatch = entryXml.match(/<reb>([^<]+)<\/reb>/)
    let reading = rebMatch ? rebMatch[1] : ''

    // Extract definitions
    const glossRegex = /<gloss[^>]*>([^<]+)<\/gloss>/g
    const definitions: string[] = []
    let glossMatch
    while ((glossMatch = glossRegex.exec(entryXml)) !== null) {
      definitions.push(glossMatch[1])
      if (definitions.length >= 3) break
    }

    // Extract part of speech
    const posMatch = entryXml.match(/<pos>([^<]+)<\/pos>/)
    const pos = posMatch ? posMatch[1] : ''

    if (definitions.length === 0) continue

    // Use the first kanji form, or fall back to reading
    const firstKebMatch = entryXml.match(/<keb>([^<]+)<\/keb>/)
    const word = firstKebMatch ? firstKebMatch[1] : reading

    if (!word) continue

    result[word] = {
      kanji: word,
      reading: reading ? reading : word,
      definitions: definitions.slice(0, 3),
      pos
    }
  }

  return result
}

processJMdict().catch(console.error)
