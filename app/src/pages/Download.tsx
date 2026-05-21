import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

export default function Download() {
  const [, setRender] = useState(0)

  useEffect(() => {
    const handlePop = () => setRender(n => n + 1)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return (
    <div className="app subpage">
      <style>{`
        .download-page {
          max-width: 720px;
          margin: 120px auto 80px;
          padding: 0 24px;
          text-align: center;
        }
        .download-page h1 {
          font-size: 40px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 16px;
        }
        .download-page .subtitle {
          color: #888;
          font-size: 18px;
          margin-bottom: 48px;
        }
        .download-steps {
          text-align: left;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .download-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e8a000;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          flex-shrink: 0;
        }
        .step-content h3 {
          color: #fff;
          font-size: 17px;
          margin-bottom: 6px;
        }
        .step-content p {
          color: #999;
          font-size: 14px;
          line-height: 1.6;
        }
        .step-content code {
          background: #1a1a2e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 13px;
          color: #e8a000;
        }
        .download-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: #e8a000;
          color: #000;
          font-size: 18px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }
        .download-cta:hover {
          background: #d49000;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232,160,0,0.3);
        }
        .download-alt {
          margin-top: 12px;
          font-size: 14px;
          color: #666;
        }
        .download-alt a {
          color: #e8a000;
          text-decoration: none;
        }
      `}</style>
      <Navbar scrolled={true} />
      <div className="download-page">
        <h1>📦 Install Kumo</h1>
        <p className="subtitle">Get started in under a minute.</p>

        <div className="download-steps">
          <div className="download-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Download the extension</h3>
              <p>Get Kumo from the Chrome Web Store or build it yourself from the GitHub repository.</p>
            </div>
          </div>
          <div className="download-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Pin to toolbar</h3>
              <p>Click the puzzle icon in Chrome's toolbar and pin Kumo for quick access.</p>
            </div>
          </div>
          <div className="download-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Browse Japanese content</h3>
              <p>Visit any Japanese website, YouTube video, or Twitter feed — furigana appears automatically!</p>
            </div>
          </div>
          <div className="download-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Customize</h3>
              <p>Click the Kumo icon to toggle features, or use <code>Alt+J</code> to toggle furigana on any page.</p>
            </div>
          </div>
        </div>

        <a
          href="https://github.com/erichanwang/Kumo"
          target="_blank"
          rel="noopener noreferrer"
          className="download-cta"
        >
          <span>⬇</span> Get Kumo
        </a>
        <p className="download-alt">
          Or <a href="https://github.com/erichanwang/Kumo" target="_blank" rel="noopener noreferrer">build from source</a>
        </p>
      </div>
    </div>
  )
}
