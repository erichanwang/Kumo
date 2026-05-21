import { useState, useEffect, type FormEvent } from 'react'
import Navbar from '../components/Navbar'

export default function Contact() {
  const [, setRender] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    const handlePop = () => setRender(n => n + 1)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    console.log('Contact submission:', formData)
    setSubmitted(true)
  }

  return (
    <div className="app subpage">
      <style>{`
        .contact-page {
          max-width: 560px;
          margin: 120px auto 80px;
          padding: 0 24px;
        }
        .contact-page h1 {
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .contact-subtitle {
          color: #888;
          font-size: 16px;
          margin-bottom: 40px;
        }
        .contact-form {
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 16px;
          padding: 32px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          color: #aaa;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          background: #0f0f1a;
          border: 1px solid #2a2a3e;
          border-radius: 8px;
          color: #e0e0e0;
          font-size: 15px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #e8a000;
        }
        .form-group textarea {
          min-height: 120px;
          resize: vertical;
        }
        .contact-submit {
          width: 100%;
          padding: 14px;
          background: #e8a000;
          color: #000;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .contact-submit:hover {
          background: #d49000;
          transform: translateY(-1px);
        }
        .contact-success {
          text-align: center;
          padding: 48px 24px;
        }
        .contact-success .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .contact-success h2 {
          color: #00c878;
          font-size: 24px;
          margin-bottom: 8px;
        }
        .contact-success p {
          color: #999;
          font-size: 15px;
        }
        .contact-links {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
        }
        .contact-link {
          padding: 10px 20px;
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 8px;
          color: #e8a000;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .contact-link:hover {
          border-color: #e8a000;
          background: #252545;
        }
      `}</style>
      <Navbar scrolled={true} />
      <div className="contact-page">
        <h1>💬 Contact Us</h1>
        <p className="contact-subtitle">Questions, feedback, or bug reports? We'd love to hear from you.</p>

        {submitted ? (
          <div className="contact-success">
            <div className="success-icon">📬</div>
            <h2>Message Sent!</h2>
            <p>Thanks for reaching out. We'll get back to you soon.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                required
              />
            </div>
            <button type="submit" className="contact-submit">Send Message</button>
          </form>
        )}

        <div className="contact-links">
          <a href="https://github.com/erichanwang/Kumo" target="_blank" rel="noopener noreferrer" className="contact-link">🐙 GitHub</a>
          <a href="/docs" className="contact-link">📖 Docs</a>
          <a href="/blog" className="contact-link">📝 Blog</a>
        </div>
      </div>
    </div>
  )
}
