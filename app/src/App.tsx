import { useState, useEffect, Suspense, lazy, type ComponentType } from 'react'
import { LanguageProvider } from './contexts/LanguageContext'
import Navbar from './components/Navbar'
import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Pricing from './sections/Pricing'
import Comparison from './sections/Comparison'
import Testimonials from './sections/Testimonials'
import CaseStudies from './sections/CaseStudies'
import FAQ from './sections/FAQ'
import EmailCapture from './components/EmailCapture'
import Footer from './components/Footer'

// Lazy-loaded page components for code-splitting
const Docs = lazy(() => import('./pages/Docs'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Changelog = lazy(() => import('./pages/Changelog'))
const Download = lazy(() => import('./pages/Download'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Roadmap = lazy(() => import('./pages/Roadmap'))

const PageLoader = () => (
  <div style={{ padding: '120px 0 80px', minHeight: '100vh' }}>
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
    </div>
  </div>
)

const PAGE_MAP: Record<string, { component: ComponentType<any>; title: string }> = {
  docs: { component: Docs, title: 'Documentation' },
  blog: { component: Blog, title: 'Blog' },
  terms: { component: Terms, title: 'Terms of Service' },
  privacy: { component: Privacy, title: 'Privacy Policy' },
  changelog: { component: Changelog, title: 'Changelog' },
  download: { component: Download, title: 'Download' },
  about: { component: About, title: 'About' },
  contact: { component: Contact, title: 'Contact' },
  roadmap: { component: Roadmap, title: 'Roadmap' },
}

function getPage() {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  // Handle individual blog posts: /blog/:slug
  if (path.startsWith('blog/')) {
    const slug = path.replace('blog/', '')
    return { component: BlogPost, title: 'Blog', slug }
  }
  return PAGE_MAP[path] || null
}

function App() {
  const [scrolled, setScrolled] = useState(false)
  const page = getPage()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Handle hash navigation for anchor links
    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href === '#') return
      e.preventDefault()
      const id = href.slice(1)
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    document.addEventListener('click', handleHashClick)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleHashClick)
    }
  }, [])

  // Render subpages (docs, blog, terms, privacy, etc.)
  if (page) {
    // Blog posts get a slug prop
    if ('slug' in page && page.slug) {
      const Comp = page.component as ComponentType<{ slug: string }>
      return (
        <LanguageProvider>
          <div className="app">
            <Suspense fallback={<PageLoader />}>
              <Comp slug={page.slug} />
            </Suspense>
          </div>
        </LanguageProvider>
      )
    }
    const Comp = page.component as ComponentType
    return (
      <LanguageProvider>
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Comp />
          </Suspense>
        </div>
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <div className="app">
        <Navbar scrolled={scrolled} />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <Pricing />
          <Comparison />
          <Testimonials />
          <CaseStudies />
          <FAQ />
          <EmailCapture />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  )
}

export default App
