import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface BlogPostProps { slug: string }

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  tags: string[]
  readTime: string
  htmlContent: string
}

const FULL_POSTS: Record<string, Post> = {
  'how-kumo-works': {
    slug: 'how-kumo-works',
    title: 'How Kumo Processes Japanese Text in Real-Time',
    excerpt: 'A deep dive into the technical architecture behind Kumo.',
    date: '2025-03-01',
    author: 'Eric Wang',
    tags: ['technical', 'architecture'],
    readTime: '8 min',
    htmlContent: `
      <p>Kumo is a Chrome extension that transforms how you read Japanese online. But how does it actually work under the hood? Let's dive into the technical architecture.</p>
      <h2>The Pipeline</h2>
      <p>When you visit a Japanese webpage, Kumo processes the text through a multi-stage pipeline:</p>
      <ol>
        <li><strong>Detection</strong> — Kumo checks if the page contains Japanese characters using Unicode range matching. If no Japanese is detected, it stays dormant to save resources.</li>
        <li><strong>Tokenization</strong> — Using <a href="https://github.com/takuyaa/kuromoji.js" target="_blank">Kuromoji.js</a>, the page text is broken into individual tokens (words) with readings, part-of-speech, and dictionary forms.</li>
        <li><strong>Furigana Injection</strong> — For unknown words (not in the known cache), Kumo wraps the text in HTML5 <code>&lt;ruby&gt;</code> elements with <code>&lt;rt&gt;</code> reading annotations.</li>
        <li><strong>Popup System</strong> — Hovering over any ruby element shows a detailed popup with definitions, JLPT level, and action buttons.</li>
      </ol>
      <h2>Performance Considerations</h2>
      <p>Processing large pages can be resource-intensive. Kumo uses several optimizations:</p>
      <ul>
        <li><strong>MutationObserver</strong> — Instead of reprocessing the entire page, Kumo watches for DOM changes and only processes new nodes.</li>
        <li><strong>Batch Processing</strong> — Text nodes are processed in chunks using requestIdleCallback to avoid blocking the main thread.</li>
        <li><strong>Known Cache</strong> — Words you mark as "known" are cached in memory, so they don't get furigana on subsequent pages.</li>
      </ul>
      <h2>Dictionary Integration</h2>
      <p>Kumo ships with pre-processed JMdict and KanjiDic2 data, covering over 15,000 words and 6,000 kanji. The data is stored as JSON for fast lookups.</p>
      <p>The full processing pipeline typically completes in under 2 seconds for a standard news article.</p>
    `
  },
  'spaced-repetition-japanese': {
    slug: 'spaced-repetition-japanese',
    title: 'Why Spaced Repetition Is the Best Way to Learn Japanese Vocabulary',
    excerpt: 'The science behind SM-2 and how Kumo helps you retain vocabulary.',
    date: '2025-02-15',
    author: 'Eric Wang',
    tags: ['learning', 'srs'],
    readTime: '6 min',
    htmlContent: `
      <h2>The Forgetting Curve</h2>
      <p>In 1885, Hermann Ebbinghaus discovered that memory decays exponentially over time. Without review, you forget about 50% of new information within an hour, and 70% within a day.</p>
      <p>But there's good news: each time you successfully recall something, the forgetting curve flattens. This is the foundation of spaced repetition.</p>
      <h2>How SM-2 Works</h2>
      <p>Kumo uses the SM-2 algorithm (SuperMemo 2), which adjusts review intervals based on your performance:</p>
      <ul>
        <li><strong>Quality 0-2:</strong> You forgot the word → interval resets to 10 minutes</li>
        <li><strong>Quality 3:</strong> Correct with difficulty → interval increases modestly</li>
        <li><strong>Quality 4-5:</strong> Easy recall → interval multiplies by ease factor (≥ 2.5×)</li>
      </ul>
      <p>After 5+ successful reviews, intervals can stretch to months — meaning you truly know the word.</p>
      <h2>Why It Works for Japanese</h2>
      <p>Japanese vocabulary is particularly well-suited to SRS because:</p>
      <ol>
        <li><strong>Kanji are discrete units</strong> — Each kanji has specific readings and meanings that can be tested independently.</li>
        <li><strong>Context matters</strong> — Kumo saves sentence context with each word, providing natural usage examples during review.</li>
        <li><strong>JLPT levels provide structure</strong> — You can focus on words at your level and gradually expand.</li>
      </ol>
    `
  },
  'youtube-japanese-learning': {
    slug: 'youtube-japanese-learning',
    title: 'Learn Japanese Through YouTube: A Complete Guide',
    excerpt: 'How to use Kumo\'s YouTube subtitle integration.',
    date: '2025-02-01',
    author: 'Eric Wang',
    tags: ['tutorial', 'youtube'],
    readTime: '5 min',
    htmlContent: `
      <h2>Why YouTube?</h2>
      <p>YouTube is a goldmine for Japanese learners. You get native-speed audio, visual context, and (with Kumo) real-time furigana on subtitles. It's like having a personal tutor highlighting every word.</p>
      <h2>Getting Started</h2>
      <ol>
        <li><strong>Find a video with Japanese captions</strong> — Look for videos that have "Japanese" or "日本語" auto-generated or manual captions.</li>
        <li><strong>Enable captions</strong> — Click the CC button on YouTube.</li>
        <li><strong>Open Kumo popup</strong> — Click the Kumo extension icon and ensure "YouTube Subtitles" is toggled on.</li>
        <li><strong>Watch and learn!</strong> — Furigana will appear above kanji in the subtitle text.</li>
      </ol>
      <h2>Recommended Channels</h2>
      <ul>
        <li><strong>NHK News</strong> — Clear, standard Japanese with accurate captions</li>
        <li><strong>Japanese Ammo with Misa</strong> — Grammar-focused content with dual subtitles</li>
        <li><strong>Onomappu</strong> — Onomatopoeia-focused channel, great for vocabulary</li>
        <li><strong>もしもしゆうすけ</strong> — Natural conversation practice</li>
      </ul>
      <h2>Pro Tips</h2>
      <ul>
        <li>Enable "Auto-Pause" in Kumo to pause when an unknown word appears</li>
        <li>Press Alt+S to save words you want to review later</li>
        <li>Use 0.75× playback speed for difficult content</li>
      </ul>
    `
  }
}

function BlogPost({ slug }: BlogPostProps) {
  const post = FULL_POSTS[slug]

  if (!post) {
    return (
      <div className="page">
        <Navbar scrolled={true} />
        <main style={{ paddingTop: 100, padding: '80px 24px', textAlign: 'center', minHeight: '60vh' }}>
          <h1 style={{ color: '#f0f0f5' }}>Post not found</h1>
          <p style={{ color: '#a0a0b8' }}>The blog post you're looking for doesn't exist.</p>
          <a href="/blog" style={{ color: '#3a6ff5', marginTop: 16, display: 'inline-block' }}>← Back to Blog</a>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar scrolled={true} />
      <main style={{ paddingTop: 100 }}>
        <article style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '80px 24px'
        }}>
          <a href="/blog" style={{
            color: '#5b8af7',
            fontSize: 14,
            textDecoration: 'none',
            marginBottom: 24,
            display: 'inline-block'
          }}>
            ← Back to Blog
          </a>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: 6,
                background: 'rgba(58,111,245,0.1)',
                color: '#5b8af7',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>{tag}</span>
            ))}
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 12,
            background: 'linear-gradient(180deg, #fff 0%, #a0a0b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.3
          }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, color: '#666680', fontSize: 13 }}>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime} read</span>
            <span>·</span>
            <span>{post.author}</span>
          </div>

          <div
            style={{ color: '#a0a0b8', fontSize: 16, lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPost
