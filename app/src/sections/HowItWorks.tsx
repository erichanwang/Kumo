import { useState, useEffect, useRef } from 'react'

const steps = [
  {
    step: '01',
    title: 'Install the Extension',
    description: 'Add Kumo to Chrome from the Chrome Web Store. One click, no configuration needed. Works on Windows, Mac, and Linux.',
    icon: '🧩'
  },
  {
    step: '02',
    title: 'Browse Any Japanese Site',
    description: 'Open NHK News Easy, Wikipedia JP, Twitter, or any Japanese webpage. Furigana appears automatically within seconds.',
    icon: '🌐'
  },
  {
    step: '03',
    title: 'Hover to Learn',
    description: 'Hover over any kanji or word to see its reading, meaning, and JLPT level. Save it or mark it as known — all from the popup.',
    icon: '✨'
  },
  {
    step: '04',
    title: 'Watch YouTube with Furigana',
    description: 'Open any Japanese YouTube video with captions enabled. Kumo adds furigana to every caption line in real time.',
    icon: '▶️'
  }
]

const HowItWorks = () => {
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
    <section id="how-it-works" ref={ref} className="how">
      <div className="container">
        <div className="how-header">
          <span className="section-label">How It Works</span>
          <h2 className="section-title">Get started in under 60 seconds</h2>
          <p className="section-subtitle">
            No accounts. No setup wizards. No dictionary files to download. Just install and start reading.
          </p>
        </div>

        <div className={`how-steps ${visible ? 'how-visible' : ''}`}>
          {steps.map((step, i) => (
            <div
              key={step.step}
              className="how-step"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="how-step-number">{step.step}</div>
              <div className="how-step-icon">{step.icon}</div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.description}</p>
              {i < steps.length - 1 && <div className="how-connector" />}
            </div>
          ))}
        </div>

        <div className={`how-demo ${visible ? 'how-visible' : ''}`}>
          <div className="how-demo-window">
            <div className="how-demo-dots">
              <span /><span /><span />
            </div>
            <img
              src="/example_nge.png"
              alt="Kumo extension in action — furigana and popup definitions on a Japanese Wikipedia page about Neon Genesis Evangelion"
              className="how-demo-img"
              loading="lazy"
            />
          </div>
          <p className="how-demo-caption">Kumo in action on a Wikipedia article about Neon Genesis Evangelion</p>
        </div>
      </div>

      <style>{`
        .how {
          padding: 100px 0;
          position: relative;
          overflow: hidden;
        }
        .how-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .how-header .section-subtitle {
          margin: 0 auto;
        }
        .how-steps {
          display: flex;
          gap: 0;
          position: relative;
          justify-content: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }
        .how-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .how-step {
          flex: 1;
          max-width: 240px;
          text-align: center;
          position: relative;
          padding: 0 16px;
          animation: fadeUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .how-visible .how-step {
          animation: fadeUp 0.5s ease-out forwards;
        }
        .how-step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .how-step-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }
        .how-step-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .how-step-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .how-connector {
          position: absolute;
          top: 50%;
          right: -8px;
          width: 20px;
          height: 1px;
          background: var(--border-strong);
          transform: translateY(-50%);
        }
        @media (max-width: 768px) {
          .how-steps {
            flex-direction: column;
            align-items: center;
            gap: 32px;
          }
          .how-step {
            max-width: 100%;
          }
          .how-connector {
            display: none;
          }
          .how-demo {
            margin-top: 48px;
          }
        }

        .how-demo {
          margin-top: 72px;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease 0.3s;
        }
        .how-demo.how-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .how-demo-window {
          display: inline-block;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          max-width: 100%;
        }
        .how-demo-dots {
          display: flex;
          gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .how-demo-dots span {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #444;
        }
        .how-demo-dots span:nth-child(1) { background: #ff5f56; }
        .how-demo-dots span:nth-child(2) { background: #ffbd2e; }
        .how-demo-dots span:nth-child(3) { background: #27c93f; }
        .how-demo-img {
          display: block;
          width: 100%;
          height: auto;
        }
        .how-demo-caption {
          margin-top: 16px;
          font-size: 13px;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </section>
  )
}

export default HowItWorks
