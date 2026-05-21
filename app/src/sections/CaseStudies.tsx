import { useEffect, useRef } from 'react'

const CASES = [
  {
    name: 'Sarah Chen',
    role: 'JLPT N3 Student',
    avatar: '👩‍🎓',
    quote: 'Kumo made reading NHK News articles feel natural. I went from looking up every 3rd word to reading fluently in 2 months.',
    stats: { learned: 847, streak: 94, speed: '2.3x' },
    color: '#3a6ff5'
  },
  {
    name: 'Marcus Williams',
    role: 'Software Engineer in Tokyo',
    avatar: '👨‍💻',
    quote: 'I use Kumo daily for reading Japanese documentation and Slack messages. The YouTube subtitle integration is a game-changer for watching tech talks.',
    stats: { learned: 1203, streak: 156, speed: '1.8x' },
    color: '#8b5cf6'
  },
  {
    name: 'Yuki Tanaka',
    role: 'Heritage Learner',
    avatar: '👩‍👧',
    quote: 'As someone who grew up speaking but not reading Japanese, Kumo helped me finally bridge the gap. The SRS system keeps me consistent.',
    stats: { learned: 621, streak: 48, speed: '3.1x' },
    color: '#ec4899'
  }
]

function CaseStudies() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.15 })

    cardRefs.current.forEach(ref => ref && observer.observe(ref))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      padding: '100px 24px',
      maxWidth: 1100,
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span className="section-label">Case Studies</span>
        <h2 className="section-title">Real learners, real results</h2>
        <p className="section-subtitle" style={{ margin: '0 auto' }}>
          See how Japanese learners at different levels use Kumo to level up their reading.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24
      }}>
        {CASES.map((cs, i) => (
          <div
            key={cs.name}
            ref={el => { cardRefs.current[i] = el }}
            style={{
              background: '#141428',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 32,
              opacity: 0,
              transform: 'translateY(24px)',
              transition: 'all 0.5s ease-out',
              transitionDelay: `${i * 100}ms`
            }}
            className="case-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${cs.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}>
                {cs.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f0f0f5', fontSize: 15 }}>{cs.name}</div>
                <div style={{ color: '#a0a0b8', fontSize: 13 }}>{cs.role}</div>
              </div>
            </div>

            <blockquote style={{
              color: '#a0a0b8',
              fontSize: 14,
              lineHeight: 1.8,
              margin: '0 0 24px',
              borderLeft: `3px solid ${cs.color}`,
              paddingLeft: 16,
              fontStyle: 'italic'
            }}>
              "{cs.quote}"
            </blockquote>

            <div style={{
              display: 'flex',
              gap: 16,
              padding: '16px 0 0',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: cs.color }}>{cs.stats.learned}</div>
                <div style={{ fontSize: 11, color: '#666680' }}>Words Learned</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f5' }}>{cs.stats.streak} 🔥</div>
                <div style={{ fontSize: 11, color: '#666680' }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#4caf50' }}>{cs.stats.speed}</div>
                <div style={{ fontSize: 11, color: '#666680' }}>Reading Speed ↑</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .case-card.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  )
}

export default CaseStudies
