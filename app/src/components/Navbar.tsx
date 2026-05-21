import { useState, type FC, useEffect, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

interface NavbarProps {
  scrolled: boolean
}

const Navbar: FC<NavbarProps> = ({ scrolled }) => {
  const { lang, setLang, t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMenu = useCallback(() => setMobileOpen(false), [])

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <a href="#" className="navbar-logo" onClick={closeMenu}>
          ☁️ <span>Kumo</span>
        </a>
        <nav className={`navbar-links ${mobileOpen ? 'navbar-links-open' : ''}`}>
          <a href="#features" onClick={closeMenu}>{t('nav_features')}</a>
          <a href="#how-it-works" onClick={closeMenu}>{t('nav_how_it_works')}</a>
          <a href="#pricing" onClick={closeMenu}>{t('nav_pricing')}</a>
          <a href="#testimonials" onClick={closeMenu}>{t('nav_testimonials')}</a>
          <a href="#faq" onClick={closeMenu}>{t('nav_faq')}</a>
          <a href="/docs" onClick={closeMenu}>{t('nav_docs')}</a>
          <a href="/blog" onClick={closeMenu}>{t('nav_blog')}</a>
          <a href="/download" onClick={closeMenu}>{t('nav_download')}</a>
          {/* Language toggle */}
          <div className="navbar-lang-toggle">
            <button
              className={`navbar-lang-btn ${lang === 'en' ? 'navbar-lang-active' : ''}`}
              onClick={() => setLang('en')}
              aria-label="Switch to English"
            >EN</button>
            <span className="navbar-lang-sep">/</span>
            <button
              className={`navbar-lang-btn ${lang === 'ja' ? 'navbar-lang-active' : ''}`}
              onClick={() => setLang('ja')}
              aria-label="日本語に切り替え"
            >日本語</button>
          </div>
          <div className="navbar-mobile-cta">
            <a href="#pricing" className="btn btn-primary" onClick={closeMenu}>
              {t('nav_cta')}
            </a>
          </div>
        </nav>

        <div className="navbar-right">
          {/* Language toggle (desktop) */}
          <div className="navbar-lang-toggle navbar-lang-desktop">
            <button
              className={`navbar-lang-btn ${lang === 'en' ? 'navbar-lang-active' : ''}`}
              onClick={() => setLang('en')}
              aria-label="Switch to English"
            >EN</button>
            <span className="navbar-lang-sep">/</span>
            <button
              className={`navbar-lang-btn ${lang === 'ja' ? 'navbar-lang-active' : ''}`}
              onClick={() => setLang('ja')}
              aria-label="日本語に切り替え"
            >日本語</button>
          </div>
          <div className="navbar-cta">
            <a href="#pricing" className="btn btn-primary btn-sm">
              {t('nav_cta')}
            </a>
          </div>
          <button
            className={`navbar-hamburger ${mobileOpen ? 'hamburger-open' : ''}`}
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {mobileOpen && <div className="navbar-overlay" onClick={closeMenu} />}

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 0;
          transition: all 0.3s ease;
        }
        .navbar-scrolled {
          background: rgba(8, 8, 18, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 700;
          text-decoration: none;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .navbar-links {
          display: flex;
          gap: 32px;
        }
        .navbar-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color var(--transition);
        }
        .navbar-links a:hover {
          color: var(--text-primary);
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-sm {
          padding: 9px 20px;
          font-size: 13px;
          border-radius: 10px;
        }

        /* Hamburger */
        .navbar-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          gap: 4px;
          padding: 6px;
          transition: all 0.2s;
        }
        .navbar-hamburger:hover {
          border-color: var(--text-muted);
        }
        .navbar-hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: all 0.25s ease;
        }
        .hamburger-open span:nth-child(1) {
          transform: rotate(45deg) translate(4px, 4px);
        }
        .hamburger-open span:nth-child(2) {
          opacity: 0;
        }
        .hamburger-open span:nth-child(3) {
          transform: rotate(-45deg) translate(4px, -4px);
        }

        .navbar-mobile-cta {
          display: none;
        }

        /* Language toggle */
        .navbar-lang-toggle {
          display: none;
          align-items: center;
          gap: 2px;
        }
        .navbar-lang-desktop {
          display: flex;
        }
        .navbar-lang-btn {
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .navbar-lang-btn:hover {
          color: var(--text-primary);
          border-color: var(--border);
        }
        .navbar-lang-active {
          color: var(--text-primary);
          border-color: rgba(232, 160, 0, 0.4);
          background: rgba(232, 160, 0, 0.08);
        }
        .navbar-lang-sep {
          color: var(--text-muted);
          font-size: 11px;
          user-select: none;
        }

        /* Overlay */
        .navbar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar-lang-desktop {
            display: none;
          }
          .navbar-lang-toggle {
            display: flex;
            padding: 12px 16px;
            margin-bottom: 6px;
          }
          .navbar-links {
            position: fixed;
            top: 0;
            right: -280px;
            width: 280px;
            height: 100vh;
            background: rgba(12, 12, 24, 0.98);
            backdrop-filter: blur(24px);
            flex-direction: column;
            padding: 80px 24px 32px;
            gap: 6px;
            transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 101;
            border-left: 1px solid var(--border);
            overflow-y: auto;
          }
          .navbar-links-open {
            right: 0;
          }
          .navbar-links a {
            display: block;
            padding: 12px 16px;
            font-size: 16px;
            border-radius: 8px;
            transition: background 0.15s;
          }
          .navbar-links a:hover {
            background: rgba(255,255,255,0.04);
          }
          .navbar-hamburger {
            display: flex;
          }
          .navbar-cta {
            display: none;
          }
          .navbar-mobile-cta {
            display: block;
            margin-top: 16px;
            padding: 12px 16px 0;
            border-top: 1px solid var(--border);
          }
          .navbar-mobile-cta .btn {
            width: 100%;
            text-align: center;
          }
          .navbar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99;
          }
        }
      `}</style>
    </header>
  )
}

export default Navbar
