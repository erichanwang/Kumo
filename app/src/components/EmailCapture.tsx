import { useState } from 'react'

const EmailCapture = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      // Log to console for now; replace with real API endpoint later
      console.log('[Kumo Waitlist] New signup:', email.trim(), new Date().toISOString())
      setStatus('submitted')
    }
  }

  return (
    <section id="email-capture" className="email-capture">
      <div className="container">
        <div className="email-inner">
          <div className="email-content">
            <span className="section-label">Stay Updated</span>
            <h2 className="email-title">Get notified when Kumo launches</h2>
            <p className="email-desc">
              Be the first to know when Kumo hits the Chrome Web Store.
              No spam, just launch updates and feature announcements.
            </p>
          </div>

          {status === 'submitted' ? (
            <div className="email-success">
              <span className="email-success-icon">🎉</span>
              <p>You're on the list! We'll email you when Kumo launches.</p>
            </div>
          ) : (
            <form className="email-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-input"
              />
              <button type="submit" className="btn btn-primary email-btn">
                Notify Me
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .email-capture {
          padding: 80px 0;
          background: linear-gradient(135deg, rgba(58, 111, 245, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .email-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
        }
        .email-content {
          flex: 1;
        }
        .email-title {
          font-size: clamp(22px, 3vw, 32px);
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .email-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .email-form {
          display: flex;
          gap: 10px;
          flex: 1;
          max-width: 420px;
        }
        .email-input {
          flex: 1;
          padding: 14px 18px;
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color var(--transition);
        }
        .email-input:focus {
          border-color: var(--accent);
        }
        .email-input::placeholder {
          color: var(--text-muted);
        }
        .email-btn {
          padding: 14px 24px;
          white-space: nowrap;
        }
        .email-success {
          flex: 1;
          max-width: 420px;
          background: rgba(76, 175, 80, 0.08);
          border: 1px solid rgba(76, 175, 80, 0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .email-success-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .email-success p {
          font-size: 14px;
          color: var(--green);
          font-weight: 500;
        }
        @media (max-width: 640px) {
          .email-inner {
            flex-direction: column;
            text-align: center;
          }
          .email-form {
            flex-direction: column;
            max-width: 100%;
          }
        }
      `}</style>
    </section>
  )
}

export default EmailCapture
