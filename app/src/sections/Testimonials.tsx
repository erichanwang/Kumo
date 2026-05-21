import { useRef, useEffect, useState } from 'react'

interface Testimonial {
  name: string
  role: string
  avatar: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Yuki T.',
    role: 'JLPT N3 Learner',
    avatar: '🐱',
    quote: 'Kumo made reading NHK News actually enjoyable. I used to copy-paste everything into a dictionary — now I just hover over words I don\'t know. My reading speed has doubled.',
  },
  {
    name: 'Marcus L.',
    role: 'Software Engineer & Japanese Hobbyist',
    avatar: '🦊',
    quote: 'I\'ve tried Yomitan and Rikaikun. Kumo is the first one that doesn\'t feel like a dictionary tool bolted onto a browser. The furigana just... appears. It\'s seamless.',
  },
  {
    name: 'Aiko M.',
    role: 'Japanese Tutor',
    avatar: '🐰',
    quote: 'I recommend Kumo to all my students. The JLPT level filtering means beginners aren\'t overwhelmed, and the word bank with Anki export is a game-changer for vocabulary retention.',
  },
  {
    name: 'David K.',
    role: 'Watching anime without subs',
    avatar: '🐼',
    quote: 'The YouTube caption integration is what sold me. I watch Japanese cooking channels and being able to hover over captions to understand ingredients on the fly is incredible.',
  },
  {
    name: 'Sarah N.',
    role: 'Exchange Student in Tokyo',
    avatar: '🐸',
    quote: 'Being able to toggle furigana on/off per site is genius. I keep it off on easy sites to challenge myself, and on for news articles. The progress bars keep me motivated.',
  },
  {
    name: 'Ryo H.',
    role: 'Full-stack Developer',
    avatar: '🐶',
    quote: 'As a dev, I appreciate that it\'s all local — no API calls, no latency, no privacy concerns. The code is open source too. Built exactly how I would have built it.',
  },
]

const Testimonials = () => {
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
    <section id="testimonials" ref={ref} className="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <span className="section-label">Testimonials</span>
          <h2 className="section-title">Trusted by Japanese learners worldwide</h2>
          <p className="section-subtitle">
            Kumo is used by thousands of learners — from beginners tackling their first kanji to advanced speakers reading native content daily.
          </p>
        </div>

        <div className={`testimonials-grid ${visible ? 'testimonials-visible' : ''}`}>
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="testimonial-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="testimonial-stars">★★★★★</div>
              <blockquote className="testimonial-quote">"{t.quote}"</blockquote>
              <div className="testimonial-author">
                <span className="testimonial-avatar">{t.avatar}</span>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonials {
          padding: 100px 0;
          background: var(--bg-primary);
        }
        .testimonials-header {
          text-align: center;
          margin-bottom: 50px;
        }
        .testimonials-header .section-subtitle {
          margin: 0 auto;
          max-width: 540px;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .testimonial-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px 24px;
          transition: all var(--transition);
          opacity: 0;
        }
        .testimonials-visible .testimonial-card {
          animation: fadeUp 0.5s ease-out forwards;
        }
        .testimonial-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .testimonial-stars {
          color: var(--yellow);
          font-size: 14px;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }
        .testimonial-quote {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 20px;
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .testimonial-avatar {
          font-size: 28px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card-hover);
          border-radius: 50%;
        }
        .testimonial-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .testimonial-role {
          font-size: 12px;
          color: var(--text-muted);
        }
        @media (max-width: 900px) {
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}

export default Testimonials
