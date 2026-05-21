import { useState, useEffect, useRef } from 'react'

interface Competitor {
  name: string
  icon: string
  features: { label: string; yes: boolean; partial?: boolean }[]
}

const competitors: Competitor[] = [
  {
    name: 'Yomitan',
    icon: '📖',
    features: [
      { label: 'Furigana on webpages', yes: true },
      { label: 'Hover popup definitions', yes: true },
      { label: 'YouTube integration', yes: false },
      { label: 'Progress tracking', yes: false },
      { label: 'Word bank', yes: true, partial: true },
      { label: 'Simple one-click install', yes: false },
      { label: 'Modern UI', yes: false }
    ]
  },
  {
    name: 'Language Reactor',
    icon: '🎬',
    features: [
      { label: 'Furigana on webpages', yes: false },
      { label: 'Hover popup definitions', yes: true },
      { label: 'YouTube integration', yes: true },
      { label: 'Progress tracking', yes: true, partial: true },
      { label: 'Word bank', yes: true },
      { label: 'Simple one-click install', yes: true },
      { label: 'Free tier quality', yes: false }
    ]
  },
  {
    name: 'Kumo',
    icon: '☁️',
    features: [
      { label: 'Furigana on webpages', yes: true },
      { label: 'Hover popup definitions', yes: true },
      { label: 'YouTube integration', yes: true },
      { label: 'Progress tracking', yes: true },
      { label: 'Word bank', yes: true },
      { label: 'Simple one-click install', yes: true },
      { label: 'Modern UI', yes: true }
    ]
  }
]

const Comparison = () => {
  const [visible, setVisible] = useState(false)
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
    <section ref={ref} className="comparison">
      <div className="container">
        <div className="comparison-header">
          <span className="section-label">Why Kumo</span>
          <h2 className="section-title">The best of everything, in one extension</h2>
          <p className="section-subtitle">
            Existing tools each solve one piece of the puzzle. Kumo brings it all together.
          </p>
        </div>

        <div className={`comparison-table-wrapper ${visible ? 'comparison-visible' : ''}`}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {competitors.map(c => (
                  <th key={c.name} className={c.name === 'Kumo' ? 'col-kumo' : ''}>
                    <span className="comp-icon">{c.icon}</span>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitors[0].features.map((_, i) => {
                const label = competitors[0].features[i].label
                return (
                  <tr key={label}>
                    <td className="comp-label">{label}</td>
                    {competitors.map(c => {
                      const f = c.features[i]
                      return (
                        <td key={c.name} className={c.name === 'Kumo' ? 'col-kumo' : ''}>
                          {f.yes ? (
                            <span className={`comp-check ${f.partial ? 'comp-partial' : ''}`}>
                              {f.partial ? '◐' : '✓'}
                            </span>
                          ) : (
                            <span className="comp-x">✕</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .comparison {
          padding: 100px 0;
        }
        .comparison-header {
          text-align: center;
          margin-bottom: 50px;
        }
        .comparison-header .section-subtitle {
          margin: 0 auto;
        }
        .comparison-table-wrapper {
          overflow-x: auto;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }
        .comparison-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .comparison-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 14px;
        }
        .comparison-table thead th {
          padding: 16px 20px;
          font-weight: 600;
          text-align: center;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
        }
        .comparison-table thead th.col-kumo {
          color: var(--accent-light);
        }
        .comp-icon {
          margin-right: 6px;
        }
        .comparison-table tbody td {
          padding: 14px 20px;
          text-align: center;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .comparison-table tbody td.comp-label {
          text-align: left;
          color: var(--text-primary);
          font-weight: 500;
        }
        .comparison-table tbody td.col-kumo {
          background: rgba(58, 111, 245, 0.03);
        }
        .comp-check {
          color: var(--green);
          font-size: 18px;
        }
        .comp-partial {
          color: var(--yellow);
        }
        .comp-x {
          color: var(--text-muted);
          font-size: 16px;
        }
        @media (max-width: 640px) {
          .comparison-table thead th,
          .comparison-table tbody td {
            padding: 10px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  )
}

export default Comparison
