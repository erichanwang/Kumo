import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

const faqs: FAQItem[] = [
  {
    q: 'How does progressive learning work?',
    a: 'Kumo tracks which words you mark as "known" and automatically hides furigana for them — they only appear on hover. Unknown words stay highlighted so you can focus on what you actually need to learn. You can also toggle furigana per JLPT level (N5 through N1) to gradually reduce visual aid as you improve.'
  },
  {
    q: 'Does Kumo work offline?',
    a: 'Yes! Kumo\'s entire dictionary is bundled locally. After install, it works 100% offline with zero API calls, zero latency, and zero data leaving your device. Pro users can lock into offline-only mode to disable all network requests permanently for maximum privacy.'
  },
  {
    q: 'What about YouTube?',
    a: 'Kumo hooks into YouTube\'s native caption system and adds furigana to Japanese subtitles in real time. You can also hover caption words for definitions. The auto-pause feature optionally pauses the video when you hover over an unknown word.'
  },
  {
    q: 'Is my data private?',
    a: 'Yes. All dictionary lookups happen locally using bundled dictionary files. Your word bank is stored in Chrome\'s local storage. Nothing is sent to any server. No accounts required.'
  },
  {
    q: 'What dictionary does Kumo use?',
    a: 'Kumo uses JMdict (the same dictionary Jisho.org uses) for word definitions and KanjiDic2 for kanji information. Both are free, open-source resources. JLPT level data comes from community-maintained lists.'
  },
  {
    q: 'How do I install it?',
    a: 'Kumo will be available on the Chrome Web Store. Search "Kumo" in the store or use the direct link. After installing, the extension icon appears in your toolbar. Click it to open settings or view your word bank.'
  },
  {
    q: 'Will there be a Firefox version?',
    a: 'Firefox support is on the post-MVP roadmap. Since Kumo uses Manifest V3, porting to Firefox will require some adjustments. We\'re focusing on Chrome first to ship faster.'
  },
  {
    q: 'What\'s the difference between Free and Pro?',
    a: 'Free includes furigana, hover popups, YouTube integration, and a word bank with up to 200 entries. Pro removes the 200-entry limit and adds sentence mining from YouTube, Anki export, SRS flashcards, and advanced stats.'
  }
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="faq">
      <div className="container">
        <div className="faq-header">
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Questions? Answers.</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${openIndex === i ? 'faq-open' : ''}`}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <svg
                  className={`faq-chevron ${openIndex === i ? 'rotated' : ''}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className={`faq-answer ${openIndex === i ? 'faq-answer-open' : ''}`}>
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .faq {
          padding: 100px 0;
          background: var(--bg-secondary);
        }
        .faq-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }
        .faq-item {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          margin-bottom: 10px;
          background: var(--bg-card);
          cursor: pointer;
          transition: all var(--transition);
          overflow: hidden;
        }
        .faq-item:hover {
          border-color: var(--border-strong);
        }
        .faq-open {
          border-color: var(--border-strong);
        }
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .faq-chevron {
          flex-shrink: 0;
          color: var(--text-muted);
          transition: transform 0.25s ease;
        }
        .faq-chevron.rotated {
          transform: rotate(180deg);
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .faq-answer-open {
          max-height: 300px;
        }
        .faq-answer p {
          padding: 0 20px 18px;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }
      `}</style>
    </section>
  )
}

export default FAQ
