import { useState, useEffect, useRef } from 'react'

interface Feature {
  icon: string
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: '📖',
    title: 'Progressive Furigana',
    description: 'Kumo adds hiragana readings above every kanji — but the magic is in its progressive learning. Known words stay hidden until hover. New words glow bright. Toggle furigana on/off per JLPT level or entirely with a single keypress (Alt+J). You control what you see.',
    color: '#3a6ff5'
  },
  {
    icon: '💬',
    title: 'Instant Hover Definitions',
    description: 'Hover any word to see its reading, English definition, JLPT level, and part of speech. Save it to your word bank or mark it as known in one click. Zero alt-tabbing required.',
    color: '#8b5cf6'
  },
  {
    icon: '🔒',
    title: 'Fully Offline Mode',
    description: "All core dictionary data runs locally on your device. No internet required after install for basic furigana and definitions. Enable Offline Mode in settings to disable Jisho.org enriched-definition lookups for fully offline operation, maximum privacy, and zero latency.",
    color: '#10b981'
  },
  {
    icon: '▶️',
    title: 'YouTube Caption Integration',
    description: 'Kumo hooks into YouTube\'s native caption system and adds furigana to Japanese subtitles in real time. Hover over caption words for instant definitions without pausing.',
    color: '#f43f5e'
  },
  {
    icon: '📊',
    title: 'Kanji Progress Tracking',
    description: 'See your JLPT progress at a glance. N5 through N1 progress bars show exactly how many kanji you\'ve mastered. Watch your knowledge grow over time — from your first 10 kanji to the full 2,136 jōyō set.',
    color: '#f59e0b'
  },
  {
    icon: '🎨',
    title: 'Customizable Experience',
    description: 'Pick your own furigana color, toggle romaji display, auto-pause on unknown words, and more. Kumo adapts to your learning style — not the other way around.',
    color: '#6366f1'
  }
]

const Features = () => {
  const [visible, setVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" ref={ref} className="features">
      <div className="container">
        <div className="features-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">Progressively learn Japanese at your own pace</h2>
          <p className="section-subtitle">
            Toggle furigana per JLPT level. Known words fade away. New ones glow bright. Kumo grows with you — not the other way around.
          </p>
        </div>

        <div className={`features-grid ${visible ? 'features-visible' : ''}`}>
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`feature-card ${hoveredIndex !== null && hoveredIndex !== i ? 'feature-dimmed' : ''}`}
              style={{ animationDelay: `${i * 0.08}s`, transitionDelay: `${i * 0.02}s` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="feature-icon"
                style={{
                  background: `${feature.color}15`,
                  color: feature.color,
                  borderColor: `${feature.color}30`
                }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .features {
          padding: 100px 0;
          background: var(--bg-secondary);
        }
        .features-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .features-header .section-subtitle {
          margin: 0 auto;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }
        .features-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px 24px;
          transition: all var(--transition);
          animation: fadeUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .features-visible .feature-card {
          animation: fadeUp 0.5s ease-out forwards;
        }
        .feature-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-strong);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .feature-dimmed {
          opacity: 0.6;
          transform: scale(0.98);
          filter: saturate(0.5);
        }
        .feature-icon {
          width: 48px; height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid;
          font-size: 22px;
          margin-bottom: 18px;
        }
        .feature-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .feature-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .features {
            padding: 60px 0;
          }
        }
      `}</style>
    </section>
  )
}

export default Features
