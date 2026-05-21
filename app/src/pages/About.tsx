import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

export default function About() {
  const [, setRender] = useState(0)

  useEffect(() => {
    const handlePop = () => setRender(n => n + 1)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return (
    <div className="app subpage">
      <style>{`
        .about-page {
          max-width: 720px;
          margin: 120px auto 80px;
          padding: 0 24px;
        }
        .about-page h1 {
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .about-subtitle {
          color: #888;
          font-size: 16px;
          margin-bottom: 40px;
        }
        .about-section {
          margin-bottom: 40px;
        }
        .about-section h2 {
          font-size: 22px;
          color: #e8a000;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .about-section p {
          color: #ccc;
          font-size: 15px;
          line-height: 1.8;
        }
        .about-values {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        .value-card {
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .value-card .value-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .value-card h3 {
          font-size: 16px;
          color: #fff;
          margin-bottom: 6px;
        }
        .value-card p {
          font-size: 13px;
          color: #888;
          line-height: 1.5;
        }
        .about-credits {
          margin-top: 40px;
          padding: 24px;
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 12px;
        }
        .about-credits h3 {
          color: #fff;
          margin-bottom: 8px;
        }
        .about-credits p {
          font-size: 14px;
          color: #999;
          line-height: 1.6;
        }
      `}</style>
      <Navbar scrolled={true} />
      <div className="about-page">
        <h1>☁️ About Kumo</h1>
        <p className="about-subtitle">Japanese, everywhere you read.</p>

        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Kumo was built to make every piece of Japanese text on the internet a learning opportunity.
            Instead of copying words into a dictionary or alt-tabbing to another app, Kumo brings
            the dictionary to you — furigana readings, instant definitions, and spaced repetition,
            all without leaving the page.
          </p>
        </div>

        <div className="about-section">
          <h2>Why "Kumo"?</h2>
          <p>
            Kumo (雲) means "cloud" in Japanese. Like a cloud floating above the text, Kumo adds
            a lightweight layer of learning support above every webpage. It also evokes the image
            of being "above" the kanji — understanding what you read without friction.
          </p>
        </div>

        <div className="about-section">
          <h2>What We Value</h2>
          <div className="about-values">
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>Core features run entirely offline. Account features are opt-in. Jisho.org dictionary lookups can be disabled in settings. Your data stays on your device by default.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>Speed</h3>
              <p>Local dictionary lookups in under 100ms. Furigana appears as you read.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>Focus</h3>
              <p>One thing, done well: Japanese reading support. No bloat, no feature creep.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Open Data</h3>
              <p>Built on JMdict and KanjiDic2 — free, open-source Japanese dictionaries.</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Built With</h2>
          <p>
            Kumo is built with TypeScript, React, Vite, and the CRXJS Chrome extension framework.
            Japanese parsing is powered by Kuromoji.js, with dictionary data from JMdict and KanjiDic2.
            The SRS system implements the SM-2 spaced repetition algorithm.
          </p>
        </div>

        <div className="about-credits">
          <h3>🙏 Credits & Attribution</h3>
          <p>
            Dictionary data from <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noopener noreferrer" style={{ color: '#e8a000' }}>JMdict</a> and <a href="https://www.edrdg.org/kanjidic/kanjidic2.xml" target="_blank" rel="noopener noreferrer" style={{ color: '#e8a000' }}>KanjiDic2</a> — both maintained by the Electronic Dictionary Research and Development Group. Japanese morphological analysis via <a href="https://github.com/takuyaa/kuromoji.js" target="_blank" rel="noopener noreferrer" style={{ color: '#e8a000' }}>Kuromoji.js</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
