import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Milestone {
  version: string
  date: string
  title: string
  items: string[]
  status: 'completed' | 'in-progress' | 'planned'
}

const ROADMAP: Milestone[] = [
  {
    version: 'v0.1.0',
    date: 'Q1 2025',
    title: 'MVP Launch',
    status: 'completed',
    items: [
      'Chrome Extension with furigana injection',
      'Kuromoji-based Japanese text parsing',
      'Hover popups with definitions and JLPT levels',
      'Word Bank with search, filters, and CSV export',
      'YouTube subtitle integration',
      'Landing page with documentation'
    ]
  },
  {
    version: 'v0.2.0',
    date: 'Q2 2025',
    title: 'Learning System',
    status: 'in-progress',
    items: [
      'SM-2 Spaced Repetition System (SRS)',
      'Sentence mining with context extraction',
      'Progress tracking with streaks and daily stats',
      'Keyboard shortcuts (Alt+J/K/S/M/R)',
      'Kanji detail pages with readings and radicals',
      'Audio pronunciation via Web Speech API'
    ]
  },
  {
    version: 'v0.3.0',
    date: 'Q2 2025',
    title: 'Smart Learning',
    status: 'planned',
    items: [
      'AI-powered word difficulty estimation',
      'Personalized reading recommendations',
      'Grammar pattern detection and highlighting',
      'Reading speed tracking and goals',
      'Custom study decks with priority scheduling'
    ]
  },
  {
    version: 'v0.4.0',
    date: 'Q3 2025',
    title: 'Community & Sync',
    status: 'planned',
    items: [
      'Cloud sync across Chrome profiles',
      'Public shared word lists and study decks',
      'Leaderboards and weekly challenges',
      'Community-curated reading materials by JLPT level',
      'Firefox and Edge browser support'
    ]
  },
  {
    version: 'v0.5.0',
    date: 'Q3 2025',
    title: 'Mobile & Beyond',
    status: 'planned',
    items: [
      'Progressive Web App with offline reading mode',
      'iOS Safari extension',
      'EPUB/PDF reading with inline furigana',
      'News feed with difficulty-filtered articles',
      'API for third-party integrations'
    ]
  },
  {
    version: 'v1.0.0',
    date: 'Q4 2025',
    title: 'Full Release',
    status: 'planned',
    items: [
      'Chrome Web Store featured launch',
      'Premium tier with advanced analytics',
      'Team/classroom accounts for educators',
      'Full localization: English, Japanese, Chinese, Korean',
      'Performance optimizations for large pages'
    ]
  }
]

const STATUS_COLORS: Record<string, string> = {
  completed: '#4caf50',
  'in-progress': '#3a6ff5',
  planned: '#666680'
}

function Roadmap() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="page">
      <Navbar scrolled={true} />
      <main style={{ paddingTop: 100 }}>
        <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 12,
            background: 'linear-gradient(180deg, #fff 0%, #a0a0b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Roadmap
          </h1>
          <p style={{ color: '#a0a0b8', fontSize: 18, marginBottom: 48, lineHeight: 1.7 }}>
            The journey from MVP to a full-featured Japanese reading companion.
            See what's coming next.
          </p>

          <div style={{ position: 'relative', paddingLeft: 40 }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: 15,
              top: 8,
              bottom: 8,
              width: 2,
              background: 'rgba(255,255,255,0.08)'
            }} />

            {ROADMAP.map((milestone, i) => (
              <div key={milestone.version} style={{
                position: 'relative',
                marginBottom: i < ROADMAP.length - 1 ? 48 : 0,
                paddingLeft: 24
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: -14,
                  top: 6,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: STATUS_COLORS[milestone.status],
                  boxShadow: `0 0 12px ${STATUS_COLORS[milestone.status]}40`,
                  border: '2px solid #080812'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `${STATUS_COLORS[milestone.status]}20`,
                    color: STATUS_COLORS[milestone.status],
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}>
                    {milestone.status}
                  </span>
                  <span style={{ color: '#666680', fontSize: 13 }}>{milestone.version}</span>
                  <span style={{ color: '#666680', fontSize: 13 }}>{milestone.date}</span>
                </div>

                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f0f0f5',
                  marginBottom: 12
                }}>
                  {milestone.title}
                </h3>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {milestone.items.map(item => (
                    <li key={item} style={{
                      fontSize: 14,
                      color: '#a0a0b8',
                      paddingLeft: 16,
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: 10,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#666680'
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default Roadmap
