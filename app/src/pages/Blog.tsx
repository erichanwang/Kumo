import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  tags: string[]
  readTime: string
  image?: string
}

const POSTS: BlogPost[] = [
  {
    slug: 'how-kumo-works',
    title: 'How Kumo Processes Japanese Text in Real-Time',
    excerpt: 'A deep dive into the technical architecture behind Kumo: from Kuromoji tokenization to furigana injection in the DOM.',
    date: '2025-03-01',
    author: 'Eric Wang',
    tags: ['technical', 'architecture'],
    readTime: '8 min'
  },
  {
    slug: 'spaced-repetition-japanese',
    title: 'Why Spaced Repetition Is the Best Way to Learn Japanese Vocabulary',
    excerpt: 'The science behind SM-2, the forgetting curve, and how Kumo\'s SRS system helps you retain kanji and vocabulary long-term.',
    date: '2025-02-15',
    author: 'Eric Wang',
    tags: ['learning', 'srs'],
    readTime: '6 min'
  },
  {
    slug: 'youtube-japanese-learning',
    title: 'Learn Japanese Through YouTube: A Complete Guide',
    excerpt: 'How to use Kumo\'s YouTube subtitle integration to turn your favorite Japanese videos into immersive learning experiences.',
    date: '2025-02-01',
    author: 'Eric Wang',
    tags: ['tutorial', 'youtube'],
    readTime: '5 min'
  },
  {
    slug: 'jlpt-reading-strategies',
    title: '5 Reading Strategies to Pass the JLPT',
    excerpt: 'Proven techniques for tackling the reading section of the JLPT, from N5 to N1. Including how Kumo can help.',
    date: '2025-01-20',
    author: 'Eric Wang',
    tags: ['jlpt', 'strategies'],
    readTime: '7 min'
  },
  {
    slug: 'furigana-history',
    title: 'The History and Purpose of Furigana in Japanese Writing',
    excerpt: 'From Edo-period woodblock prints to modern manga — why furigana exists and how it facilitates Japanese literacy.',
    date: '2025-01-05',
    author: 'Eric Wang',
    tags: ['culture', 'history'],
    readTime: '5 min'
  }
]

export default Blog

function Blog() {
  return (
    <div className="page">
      <Navbar scrolled={true} />
      <main style={{ paddingTop: 100 }}>
        <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 12,
            background: 'linear-gradient(180deg, #fff 0%, #a0a0b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Blog
          </h1>
          <p style={{ color: '#a0a0b8', fontSize: 18, marginBottom: 48, lineHeight: 1.7 }}>
            Stories, tutorials, and deep dives about Japanese language learning and the technology behind Kumo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {POSTS.map(post => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                onClick={e => {
                  e.preventDefault()
                  // In a real app, use router; here we navigate
                  window.location.href = `/blog/${post.slug}`
                }}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  background: '#141428',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 32,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: 'rgba(58, 111, 245, 0.1)',
                      color: '#5b8af7',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f0f0f5',
                  marginBottom: 8,
                  lineHeight: 1.35
                }}>
                  {post.title}
                </h2>

                <p style={{ color: '#a0a0b8', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#666680', fontSize: 13 }}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime} read</span>
                  <span>·</span>
                  <span>{post.author}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
