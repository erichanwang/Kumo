import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

const changelog: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2025-01-20',
    changes: [
      'Initial release of Kumo',
      'Furigana overlay on any Japanese text on any webpage',
      'Hover popup with reading, definition, JLPT level, stroke count',
      'Word bank: save/star words, mark as known',
      'YouTube caption integration with real-time furigana',
      'Keyboard shortcuts: Alt+J/K/S/M/R',
      'SRS spaced repetition flashcard system (SM-2)',
      'Sentence mining from webpages',
      'Anki-compatible CSV export',
      'Streak tracking and daily goals',
      'Auto-pause on unknown words (YouTube)',
      'Romaji display option',
      'Dark theme UI throughout',
    ]
  }
]

export default function Changelog() {
  const [, setRender] = useState(0)

  useEffect(() => {
    const handlePop = () => setRender(n => n + 1)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return (
    <div className="app subpage">
      <style>{`
        .changelog-page {
          max-width: 720px;
          margin: 120px auto 80px;
          padding: 0 24px;
        }
        .changelog-page h1 {
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .changelog-subtitle {
          color: #888;
          margin-bottom: 48px;
          font-size: 16px;
        }
        .changelog-entry {
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .changelog-version {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .changelog-version h2 {
          font-size: 20px;
          color: #e8a000;
          font-weight: 700;
        }
        .changelog-date {
          font-size: 14px;
          color: #666;
        }
        .changelog-changes {
          list-style: none;
          padding: 0;
        }
        .changelog-changes li {
          padding: 6px 0;
          color: #ccc;
          font-size: 15px;
          border-bottom: 1px solid #1a1a2e;
        }
        .changelog-changes li::before {
          content: '✦ ';
          color: #e8a000;
        }
      `}</style>
      <Navbar scrolled={true} />
      <div className="changelog-page">
        <h1>📋 Changelog</h1>
        <p className="changelog-subtitle">Every update, documented.</p>
        {changelog.map(entry => (
          <div key={entry.version} className="changelog-entry">
            <div className="changelog-version">
              <h2>v{entry.version}</h2>
              <span className="changelog-date">{entry.date}</span>
            </div>
            <ul className="changelog-changes">
              {entry.changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
