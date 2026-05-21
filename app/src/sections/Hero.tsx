import { useEffect, useState, useRef, useCallback, useMemo } from 'react'

const FLOATING_KANJI = ['語', '学', '読', '書', '日', '本', '漢', '字', '文', '化', '言', '葉', '空', '海', '風', '月', '花', '鳥', '山', '川', '森', '林', '桜', '雪', '雨', '雲', '星', '光', '時', '春', '秋', '夢', '友', '愛', '心']

interface KanjiParticle {
  id: number
  char: string
  left: number
  delay: number
  duration: number
  fontSize: number
  opacity: number
}

/** Generate stable kanji particles once — never re-randomized on re-render. */
function createKanjiParticles(): KanjiParticle[] {
  return FLOATING_KANJI.map((char, i) => ({
    id: i,
    char,
    left: Math.random() * 100,
    delay: Math.random() * 8,         // 0–8s start delay
    duration: 10 + Math.random() * 10, // 10–20s fall time
    fontSize: 14 + Math.random() * 18,
    opacity: 0.06 + Math.random() * 0.08,
  }))
}

const VERBS = ['Read', 'Understand', 'Master', 'Explore', 'Speak', 'Learn']

interface KanjiReading {
  kanji: string
  on: string[]
  kun: string[]
  nanori: string[]
}

interface HoverWord {
  word: string
  reading: string
  defs: string[]
  jlpt: string
  onReadings?: string[]
  kunReadings?: string[]
  nanoriReadings?: string[]
  altReadings?: string[]
  componentKanji?: KanjiReading[]
}

interface ExampleSentence {
  html: string
  words: Record<string, HoverWord>
}

const EXAMPLE_SENTENCES: ExampleSentence[] = [
  {
    html: '私<ruby class="preview-ruby" data-wid="wa">は<rt>わ</rt></ruby>日本<ruby class="preview-ruby" data-wid="go">語<rt>ご</rt></ruby>を<ruby class="preview-ruby" data-wid="benkyou">勉<rt>べん</rt>強<rt>きょう</rt></ruby>しています。',
    words: {
      wa: { word: '私', reading: 'わたし', defs: ['I', 'me'], jlpt: 'N5',
        onReadings: ['シ'], kunReadings: ['わたし', 'わたくし'], nanoriReadings: [] },
      go: { word: '日本語', reading: 'にほんご', defs: ['Japanese (language)'], jlpt: 'N5',
        altReadings: ['にっぽんご'],
        componentKanji: [
          { kanji: '日', on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'], nanori: [] },
          { kanji: '本', on: ['ホン'], kun: ['もと'], nanori: [] },
          { kanji: '語', on: ['ゴ'], kun: ['かた.る'], nanori: [] },
        ] },
      benkyou: { word: '勉強', reading: 'べんきょう', defs: ['to study', 'to learn'], jlpt: 'N5',
        componentKanji: [
          { kanji: '勉', on: ['ベン'], kun: ['つと.める'], nanori: [] },
          { kanji: '強', on: ['キョウ', 'ゴウ'], kun: ['つよ.い', 'し.いる'], nanori: [] },
        ] },
    },
  },
  {
    html: '<ruby class="preview-ruby" data-wid="utsuku">美<rt>うつく</rt></ruby>しい<ruby class="preview-ruby" data-wid="sakura">桜<rt>さくら</rt></ruby>が<ruby class="preview-ruby" data-wid="mankai">満開<rt>まんかい</rt></ruby>です。',
    words: {
      utsuku: { word: '美しい', reading: 'うつくしい', defs: ['beautiful', 'lovely'], jlpt: 'N5',
        onReadings: ['ビ', 'ミ'], kunReadings: ['うつく.しい'], nanoriReadings: [] },
      sakura: { word: '桜', reading: 'さくら', defs: ['cherry blossom', 'sakura'], jlpt: 'N4',
        onReadings: ['オウ'], kunReadings: ['さくら'], nanoriReadings: ['さ', 'ろう'] },
      mankai: { word: '満開', reading: 'まんかい', defs: ['full bloom', 'in full flower'], jlpt: 'N3',
        componentKanji: [
          { kanji: '満', on: ['マン'], kun: ['み.ちる', 'み.たす'], nanori: [] },
          { kanji: '開', on: ['カイ'], kun: ['ひら.く', 'あ.ける', 'ひら.ける'], nanori: [] },
        ] },
    },
  },
  {
    html: '<ruby class="preview-ruby" data-wid="ashita">明日<rt>あした</rt></ruby>までに<ruby class="preview-ruby" data-wid="shukudai">宿題<rt>しゅくだい</rt></ruby>を<ruby class="preview-ruby" data-wid="teishutsu">提出<rt>ていしゅつ</rt></ruby>してください。',
    words: {
      ashita: { word: '明日', reading: 'あした', defs: ['tomorrow'], jlpt: 'N5',
        altReadings: ['あす', 'みょうにち'],
        componentKanji: [
          { kanji: '明', on: ['メイ', 'ミョウ'], kun: ['あ.かり', 'あか.るい', 'あき.らか'], nanori: [] },
          { kanji: '日', on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'], nanori: [] },
        ] },
      shukudai: { word: '宿題', reading: 'しゅくだい', defs: ['homework', 'assignment'], jlpt: 'N4',
        componentKanji: [
          { kanji: '宿', on: ['シュク'], kun: ['やど', 'やど.る'], nanori: [] },
          { kanji: '題', on: ['ダイ'], kun: [], nanori: [] },
        ] },
      teishutsu: { word: '提出', reading: 'ていしゅつ', defs: ['submission', 'to submit'], jlpt: 'N3',
        componentKanji: [
          { kanji: '提', on: ['テイ'], kun: ['さ.げる'], nanori: [] },
          { kanji: '出', on: ['シュツ', 'スイ'], kun: ['で.る', 'だ.す'], nanori: [] },
        ] },
    },
  },
  {
    html: 'この<ruby class="preview-ruby" data-wid="eiga">映画<rt>えいが</rt></ruby>は<ruby class="preview-ruby" data-wid="hontou">本当<rt>ほんとう</rt></ruby>に<ruby class="preview-ruby" data-wid="kandouteki">感動的<rt>かんどうてき</rt></ruby>でした。',
    words: {
      eiga: { word: '映画', reading: 'えいが', defs: ['movie', 'film'], jlpt: 'N5',
        componentKanji: [
          { kanji: '映', on: ['エイ'], kun: ['うつ.る', 'うつ.す', 'は.える'], nanori: [] },
          { kanji: '画', on: ['ガ', 'カク'], kun: ['えが.く'], nanori: [] },
        ] },
      hontou: { word: '本当', reading: 'ほんとう', defs: ['really', 'truly'], jlpt: 'N5',
        componentKanji: [
          { kanji: '本', on: ['ホン'], kun: ['もと'], nanori: [] },
          { kanji: '当', on: ['トウ'], kun: ['あ.たる', 'あ.てる'], nanori: [] },
        ] },
      kandouteki: { word: '感動的', reading: 'かんどうてき', defs: ['touching', 'moving', 'impressive'], jlpt: 'N2',
        componentKanji: [
          { kanji: '感', on: ['カン'], kun: [], nanori: [] },
          { kanji: '動', on: ['ドウ'], kun: ['うご.く', 'うご.かす'], nanori: [] },
          { kanji: '的', on: ['テキ'], kun: ['まと'], nanori: [] },
        ] },
    },
  },
  {
    html: '<ruby class="preview-ruby" data-wid="tenki">天気<rt>てんき</rt></ruby>がいいから<ruby class="preview-ruby" data-wid="sanpo">散歩<rt>さんぽ</rt></ruby>しましょう。',
    words: {
      tenki: { word: '天気', reading: 'てんき', defs: ['weather'], jlpt: 'N5',
        componentKanji: [
          { kanji: '天', on: ['テン'], kun: ['あめ', 'あま'], nanori: [] },
          { kanji: '気', on: ['キ', 'ケ'], kun: [], nanori: [] },
        ] },
      sanpo: { word: '散歩', reading: 'さんぽ', defs: ['walk', 'stroll'], jlpt: 'N4',
        componentKanji: [
          { kanji: '散', on: ['サン'], kun: ['ち.る', 'ち.らす'], nanori: [] },
          { kanji: '歩', on: ['ホ', 'ブ'], kun: ['ある.く', 'あゆ.む'], nanori: [] },
        ] },
    },
  },
]

const Hero = () => {
  const [mounted, setMounted] = useState(false)
  const [verbIndex, setVerbIndex] = useState(0)
  const [verbExiting, setVerbExiting] = useState(false)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [hoveredWord, setHoveredWord] = useState<HoverWord | null>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const [showMore, setShowMore] = useState(false)
  const sentenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const sentenceRef = useRef<HTMLDivElement>(null)
  const hoveredWordRef = useRef<HoverWord | null>(null)

  // Stable kanji particles — generated once, never re-randomized on re-render
  const kanjiParticles = useMemo(() => createKanjiParticles(), [])

  useEffect(() => setMounted(true), [])

  // Rotating action verb (2s interval, with exit animation)
  useEffect(() => {
    const interval = setInterval(() => {
      setVerbExiting(true)
      setTimeout(() => {
        setVerbIndex(i => (i + 1) % VERBS.length)
        setVerbExiting(false)
      }, 250)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Navigate to a specific sentence
  const goToSentence = useCallback((idx: number) => {
    const clamped = ((idx % EXAMPLE_SENTENCES.length) + EXAMPLE_SENTENCES.length) % EXAMPLE_SENTENCES.length
    setSentenceIndex(clamped)
    setHoveredWord(null)
    hoveredWordRef.current = null
    setShowMore(false)
  }, [])

  // Auto-rotate example sentences every 5 seconds
  const resetSentenceTimer = useCallback(() => {
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current)
    sentenceTimerRef.current = setInterval(() => {
      setSentenceIndex(prev => (prev + 1) % EXAMPLE_SENTENCES.length)
      setHoveredWord(null)
      hoveredWordRef.current = null
      setShowMore(false)
    }, 5000)
  }, [])

  useEffect(() => {
    resetSentenceTimer()
    return () => { if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current) }
  }, [resetSentenceTimer])

  // Attach hover listeners to ruby elements after sentence HTML renders
  useEffect(() => {
    const sentenceEl = sentenceRef.current
    if (!sentenceEl) return

    const currentData = EXAMPLE_SENTENCES[sentenceIndex]

    const handleMouseEnter = (e: MouseEvent) => {
      const ruby = (e.target as HTMLElement).closest<HTMLElement>('[data-wid]')
      if (!ruby) return
      const wid = ruby.getAttribute('data-wid')
      if (!wid || !currentData.words[wid]) return

      const rect = ruby.getBoundingClientRect()
      const viewportW = window.innerWidth

      setHoveredWord(currentData.words[wid])
      hoveredWordRef.current = currentData.words[wid]
      // Position popup to the right of the word, or left if too close to edge
      const bodyEl = sentenceEl.parentElement
      const bodyRect = bodyEl?.getBoundingClientRect()
      const popupW = 200
      let left = rect.right + 12
      if (left + popupW > viewportW - 16) {
        left = rect.left - popupW - 12
      }
      const top = rect.top - (bodyRect?.top ?? 0) - 8
      setPopupStyle({
        position: 'absolute',
        left: `${left - (bodyRect?.left ?? 0)}px`,
        top: `${top}px`,
      })
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const ruby = (e.target as HTMLElement).closest<HTMLElement>('[data-wid]')
      if (!ruby) return
      setHoveredWord(null)
      hoveredWordRef.current = null
      setShowMore(false)
    }

    const rubies = sentenceEl.querySelectorAll<HTMLElement>('[data-wid]')
    rubies.forEach(r => {
      r.addEventListener('mouseenter', handleMouseEnter)
      r.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      rubies.forEach(r => {
        r.removeEventListener('mouseenter', handleMouseEnter)
        r.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [sentenceIndex])

  // Scroll navigation on the preview
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (hoveredWordRef.current) return // don't navigate when Kumo Card is visible
      if (e.deltaY > 0) {
        goToSentence(sentenceIndex + 1)
      } else {
        goToSentence(sentenceIndex - 1)
      }
      resetSentenceTimer()
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [sentenceIndex, goToSentence, resetSentenceTimer])

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        {kanjiParticles.map((p) => (
          <span
            key={p.id}
            className="hero-floating-kanji"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              fontSize: `${p.fontSize}px`,
              '--kanji-opacity': p.opacity,
            } as React.CSSProperties}
          >
            {p.char}
          </span>
        ))}
      </div>

      <div className={`container hero-content ${mounted ? 'fade-up' : ''}`}>
        <div className="hero-badge">
          <span className="badge-dot" />
          Chrome Extension — Manifest V3
          <span className="hero-alpha-badge">ALPHA</span>
        </div>

        <h1 className="hero-title">
          <span className={`hero-verb ${verbExiting ? 'hero-verb-exit' : ''}`} key={VERBS[verbIndex]}>
            {VERBS[verbIndex]}
          </span>{' '}
          Japanese
          <br />
          <span className="hero-title-gradient">Everywhere.</span>
        </h1>

        <p className="hero-subtitle">
          Kumo adds furigana, instant definitions, and a personal word bank to
          every Japanese text on the web — including YouTube captions. Toggle readings on/off as you learn. Works fully offline. Zero friction, zero setup.
        </p>

        <div className="hero-ctas">
          <a href="#pricing" className="btn btn-primary btn-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Add to Chrome — Free
          </a>
          <a href="#how-it-works" className="btn btn-outline btn-lg">
            See How It Works
          </a>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">Progressive</span>
            <span className="hero-stat-label">Learning</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">100%</span>
            <span className="hero-stat-label">Offline Ready</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">&lt;2s</span>
            <span className="hero-stat-label">Setup Time</span>
          </div>
        </div>
      </div>

      <div className={`hero-preview ${mounted ? 'fade-up' : ''}`} ref={previewRef}>
        <div className="preview-window">
          <div className="preview-dots">
            <span /><span /><span />
          </div>
          <div className="preview-body" style={{ position: 'relative' }}>
            <div
              className="preview-jp"
              key={sentenceIndex}
              ref={sentenceRef}
              dangerouslySetInnerHTML={{ __html: EXAMPLE_SENTENCES[sentenceIndex].html }}
            />
            {!hoveredWord && (
              <div className="preview-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Hover over a word
              </div>
            )}
            {hoveredWord && (
              <div className="preview-popup preview-popup-hover" style={popupStyle} key={hoveredWord.word}>
                <div className="preview-popup-word">{hoveredWord.word}</div>
                <div className="preview-popup-reading">{hoveredWord.reading}
                  {hoveredWord.altReadings && hoveredWord.altReadings.length > 0 && (
                    <span className="preview-popup-alt"> (also: {hoveredWord.altReadings.join(', ')})</span>
                  )}
                </div>
                <div className="preview-popup-badge" data-jlpt={hoveredWord.jlpt}>JLPT {hoveredWord.jlpt}</div>
                {hoveredWord.defs.length > 0 && (
                  <div className="preview-popup-defs">{hoveredWord.defs.join(', ')}</div>
                )}
                {showMore && (
                  <>
                    {(hoveredWord.componentKanji && hoveredWord.componentKanji.length > 0) && (
                      <div className="preview-comp-section">
                        <div className="preview-comp-heading">Kanji breakdown</div>
                        {hoveredWord.componentKanji.map(k => {
                          const onStr = k.on.length > 0 ? k.on.join(', ') : ''
                          const kunStr = k.kun.length > 0 ? k.kun.map(ku => ku.replace(/\./g, '')).join(', ') : ''
                          const nanoriStr = k.nanori.length > 0 ? k.nanori.join(', ') : ''
                          const readings = [onStr, kunStr, nanoriStr].filter(Boolean).join(' · ')
                          return (
                            <div className="preview-comp-kanji" key={k.kanji}>
                              <span className="preview-comp-kanji-char">{k.kanji}</span>
                              <span className="preview-comp-kanji-readings">{readings}</span>
                              <span className="preview-comp-kanji-labels">
                                {k.on.length > 0 && <span>on</span>}
                                {k.kun.length > 0 && <span>kun</span>}
                                {k.nanori.length > 0 && <span className="preview-label-nanori">nanori</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {(hoveredWord.onReadings && hoveredWord.onReadings.length > 0) && (
                      <div className="preview-kanji-row">
                        <span className="preview-kanji-label">On:</span> {hoveredWord.onReadings.join(', ')}
                      </div>
                    )}
                    {(hoveredWord.kunReadings && hoveredWord.kunReadings.length > 0) && (
                      <div className="preview-kanji-row">
                        <span className="preview-kanji-label">Kun:</span> {hoveredWord.kunReadings.map(k => k.replace(/\./g, '')).join(', ')}
                      </div>
                    )}
                    {(hoveredWord.nanoriReadings && hoveredWord.nanoriReadings.length > 0) && (
                      <div className="preview-kanji-row preview-kanji-nanori">
                        <span className="preview-kanji-label">Nanori:</span> {hoveredWord.nanoriReadings.join(', ')}
                      </div>
                    )}
                  </>
                )}
                <div className="preview-popup-btns">
                  <span className="preview-btn-save">⭐ Save</span>
                  <span className="preview-btn-known">✓ I know this</span>
                  {(hoveredWord.componentKanji?.length || hoveredWord.onReadings?.length || hoveredWord.kunReadings?.length || hoveredWord.nanoriReadings?.length) && (
                    <button
                      className={`preview-btn-more ${showMore ? 'preview-btn-more-active' : ''}`}
                      onClick={() => setShowMore(s => !s)}
                      aria-expanded={showMore}
                      aria-label={showMore ? 'Hide kanji readings' : 'Show kanji readings'}
                    >
                      ⋯ {showMore ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="preview-sentence-dots">
          {EXAMPLE_SENTENCES.map((_, i) => (
            <button
              key={i}
              className={`preview-dot ${i === sentenceIndex ? 'active' : ''}`}
              onClick={() => { goToSentence(i); resetSentenceTimer() }}
              aria-label={`Example ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          padding: 140px 0 100px;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
        }
        .hero-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #3a6ff5, transparent);
          top: -100px; left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #8b5cf6, transparent);
          top: 20%; right: -80px;
          animation: float 6s ease-in-out infinite 2s;
        }
        .hero-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #ec4899, transparent);
          bottom: -80px; left: 30%;
          animation: float 10s ease-in-out infinite 4s;
        }
        .hero-floating-kanji {
          position: absolute;
          top: -5%;
          font-weight: 900;
          color: #fff;
          pointer-events: none;
          animation: float-kanji linear infinite;
          user-select: none;
        }
        @keyframes float-kanji {
          0% { transform: translateY(-30vh) rotate(0deg); opacity: 0; }
          3% { opacity: var(--kanji-opacity, 0.1); }
          97% { opacity: var(--kanji-opacity, 0.1); }
          100% { transform: translateY(130vh) rotate(720deg); opacity: 0; }
        }
        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 720px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 24px;
          border: 1px solid var(--border-strong);
          background: rgba(255,255,255,0.03);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 28px;
          backdrop-filter: blur(4px);
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .hero-alpha-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 152, 0, 0.15);
          color: #ffb74d;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }
        .hero-title {
          font-size: clamp(40px, 8vw, 72px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
          color: var(--text-primary);
        }
        .hero-title-gradient {
          background: var(--gradient-hero);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          max-width: 560px;
          margin: 0 auto 36px;
          line-height: 1.7;
        }
        .hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }
        .btn-lg {
          padding: 16px 32px;
          font-size: 16px;
          border-radius: 14px;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hero-stat-label {
          font-size: 13px;
          color: var(--text-muted);
        }
        .hero-preview {
          position: relative;
          z-index: 1;
          margin-top: 60px;
          width: 100%;
          max-width: 680px;
          padding: 0 24px;
        }
        .preview-window {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .preview-dots {
          display: flex;
          gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .preview-dots span {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #444;
        }
        .preview-dots span:nth-child(1) { background: #ff5f56; }
        .preview-dots span:nth-child(2) { background: #ffbd2e; }
        .preview-dots span:nth-child(3) { background: #27c93f; }
        .preview-body {
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .preview-ruby {
          ruby-position: over;
          cursor: pointer;
        }
        .preview-ruby rt {
          font-size: 0.5em;
          color: #e8a000;
          font-family: 'Inter', sans-serif;
        }
        .preview-popup {
          background: rgba(26, 26, 46, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12px;
          min-width: 170px;
          max-width: 210px;
          max-height: 280px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.45);
        }
        .preview-popup-word {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }
        .preview-popup-reading {
          color: #e8a000;
          font-size: 11px;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .preview-popup-badge {
          display: inline-block;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          color: #fff;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }
        .preview-popup-badge[data-jlpt="N5"] { background: #4caf50; }
        .preview-popup-badge[data-jlpt="N4"] { background: #8bc34a; }
        .preview-popup-badge[data-jlpt="N3"] { background: #ffc107; color: #000; }
        .preview-popup-badge[data-jlpt="N2"] { background: #ff9800; }
        .preview-popup-badge[data-jlpt="N1"] { background: #f44336; }
        .preview-popup-live {
          transition: opacity 0.3s ease;
        }
        .preview-popup-hover {
          position: absolute;
          z-index: 10;
          pointer-events: auto;
          animation: popup-appear 0.15s ease-out forwards;
          opacity: 0;
        }
        @keyframes popup-appear {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .preview-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          position: absolute;
          bottom: 8px;
          right: 12px;
        }
        .preview-popup-defs {
          color: #ccc;
          font-size: 11px;
          padding: 2px 0;
          margin-bottom: 2px;
          line-height: 1.4;
        }
        .preview-popup-alt {
          color: #888;
          font-size: 10px;
          font-style: italic;
        }
        .preview-kanji-row {
          font-size: 10px;
          color: #aaa;
          padding: 1px 0;
        }
        .preview-kanji-label {
          color: #777;
          font-weight: 600;
          margin-right: 4px;
        }
        .preview-kanji-nanori {
          color: #e57373;
        }
        .preview-comp-section {
          margin: 4px 0;
          padding: 6px 8px;
          background: rgba(255,255,255,0.04);
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .preview-comp-heading {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #666;
          margin-bottom: 4px;
        }
        .preview-comp-kanji {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 1px 0;
        }
        .preview-comp-kanji-char {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          min-width: 20px;
        }
        .preview-comp-kanji-readings {
          color: #aaa;
          font-size: 10px;
          flex: 1;
        }
        .preview-comp-kanji-labels {
          display: flex;
          gap: 3px;
          flex-shrink: 0;
        }
        .preview-comp-kanji-labels span {
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(255,255,255,0.08);
          color: #888;
        }
        .preview-comp-kanji-labels .preview-label-nanori {
          background: rgba(229, 115, 115, 0.2);
          color: #ef9a9a;
        }
        .preview-popup-btns {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.08);
          pointer-events: auto;
        }

        .preview-btn-save, .preview-btn-known {
          padding: 4px 10px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 10px;
          color: #ccc;
          font-weight: 500;
          transition: all 0.15s ease;
          cursor: default;
        }
        .preview-btn-more {
          margin-left: auto;
          padding: 4px 10px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 10px;
          color: #888;
          background: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .preview-btn-more:hover {
          border-color: rgba(255,255,255,0.2);
          color: #ccc;
          background: rgba(255,255,255,0.04);
        }
        .preview-btn-more:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .preview-btn-more-active {
          border-color: rgba(58, 111, 245, 0.35);
          color: #8eb8f5;
          background: rgba(58, 111, 245, 0.1);
        }
        /* Rotating verb animation */
        .hero-verb {
          display: inline-block;
          width: 11ch;
          animation: verb-enter 0.25s ease-out;
        }
        .hero-verb-exit {
          animation: verb-exit 0.25s ease-in forwards;
        }
        @keyframes verb-enter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes verb-exit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-12px); }
        }
        /* Sentence navigation dots */
        .preview-sentence-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }
        .preview-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent;
          cursor: pointer;
          transition: all 0.25s ease;
          padding: 0;
        }
        .preview-dot.active {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .preview-dot:hover:not(.active) {
          border-color: rgba(255,255,255,0.35);
        }
        .preview-jp {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 24px;
          color: var(--text-primary);
          line-height: 2;
          animation: sentence-fade 0.35s ease-out;
        }
        @keyframes sentence-fade {
          from { opacity: 0.4; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .hero { padding: 100px 0 60px; }
          .hero-preview { margin-top: 40px; }
          .hero-stats { gap: 20px; }
          .preview-body { flex-direction: column; gap: 20px; }
        }
      `}</style>
    </section>
  )
}

export default Hero
