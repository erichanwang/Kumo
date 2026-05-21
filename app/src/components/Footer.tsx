import { useLanguage } from '../contexts/LanguageContext'
import { useGitHubTimestamp } from '../hooks/useGitHubTimestamp'

declare const __WEBSITE_BUILD_TIME__: string
declare const __EXTENSION_LAST_UPDATED__: string
declare const __EXTENSION_VERSION__: string

const Footer = () => {
  const { t } = useLanguage()
  const { liveDate, loading } = useGitHubTimestamp()
  const extensionDate = liveDate || __EXTENSION_LAST_UPDATED__

  return (
  <footer className="footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <span className="footer-logo">☁️ Kumo</span>
        <p className="footer-tagline">{t('footer_tagline')}</p>
        <p className="footer-copy">© {new Date().getFullYear()} Eric Han Wang. All rights reserved.</p>
        <div className="footer-updated">
          <p className="footer-updated-item">🌐 {t('footer_website_updated')}: {__WEBSITE_BUILD_TIME__}</p>
          <p className="footer-updated-item">
            🧩 {t('footer_extension_updated')}: {extensionDate}
            {loading && <span className="footer-loading"> …</span>}
          </p>
          <p className="footer-updated-item">📦 {t('footer_version')}: v{__EXTENSION_VERSION__}</p>
        </div>
      </div>
      <div className="footer-col">
        <h4>{t('footer_product')}</h4>
        <a href="#features">{t('footer_features')}</a>
        <a href="#pricing">{t('footer_pricing')}</a>
        <a href="#how-it-works">{t('footer_how_it_works')}</a>
        <a href="/download">{t('footer_download')}</a>
        <a href="/changelog">{t('footer_changelog')}</a>
      </div>
      <div className="footer-col">
        <h4>{t('footer_resources')}</h4>
        <a href="/docs">{t('footer_docs')}</a>
        <a href="/blog">{t('footer_blog')}</a>
        <a href="/about">{t('footer_about')}</a>
        <a href="/contact">{t('footer_contact')}</a>
        <a href="/privacy">{t('footer_privacy')}</a>
        <a href="/terms">{t('footer_terms')}</a>
        <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noopener">{t('footer_jmdict')}</a>
      </div>
      <div className="footer-col">
        <h4>{t('footer_connect')}</h4>
        <a href="https://github.com/erichanwang/Kumo" target="_blank" rel="noopener">{t('footer_github')}</a>
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener">{t('footer_webstore')}</a>
        <a href="#email-capture">{t('footer_notified')}</a>
      </div>
    </div>

    <style>{`
      .footer {
        background: var(--bg-secondary);
        border-top: 1px solid var(--border);
        padding: 64px 0 32px;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 48px;
      }
      .footer-logo {
        font-size: 22px;
        font-weight: 700;
      }
      .footer-tagline {
        color: var(--text-secondary);
        font-size: 14px;
        margin-top: 8px;
        margin-bottom: 4px;
      }
      .footer-copy {
        color: var(--text-muted);
        font-size: 12px;
        margin-top: 16px;
      }
      .footer-updated {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .footer-updated-item {
        color: var(--text-muted);
        font-size: 11px;
        margin: 2px 0;
      }
      .footer-loading {
        animation: kl-pulse 1.5s ease-in-out infinite;
      }
      @keyframes kl-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .footer-col h4 {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-muted);
        margin-bottom: 16px;
      }
      .footer-col a {
        display: block;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 14px;
        padding: 4px 0;
        transition: color var(--transition);
      }
      .footer-col a:hover {
        color: var(--text-primary);
      }
      @media (max-width: 768px) {
        .footer-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }
    `}</style>
  </footer>
  )
}

export default Footer
