import { useState, useEffect, useRef } from 'react'

interface Plan {
  name: string
  price: string
  annualPrice: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
  popular: boolean
}

type BillingPeriod = 'weekly' | 'monthly' | 'yearly'

const proPrices: Record<BillingPeriod, { price: string; period: string; annualPrice: string }> = {
  weekly: { price: '$0.99', period: '/ week', annualPrice: '' },
  monthly: { price: '$2.99', period: '/ month', annualPrice: '' },
  yearly: { price: '$24.99', period: '/ year', annualPrice: '$2.08/mo' },
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    annualPrice: '',
    period: 'forever',
    description: 'Everything you need to start reading Japanese online.',
    features: [
      'Progressive furigana (toggle by JLPT)',
      'Hover popup definitions',
      'Fully offline dictionary',
      'Word bank (up to 200 entries)',
      'YouTube caption furigana',
      'Known kanji tracking',
      'JLPT progress bars',
      'Export to CSV',
      'Chrome sync'
    ],
    cta: 'Coming to Chrome Web Store',
    ctaHref: '#',
    popular: false
  },
  {
    name: 'Pro',
    price: '', // overridden by billing toggle
    annualPrice: '',
    period: '',
    description: 'For serious learners who want unlimited everything.',
    features: [
      'Everything in Free, plus:',
      'Unlimited word bank entries',
      'Lock-in offline mode (zero APIs)',
      'Sentence mining from YouTube',
      'Save audio clips with sentences',
      'Anki flashcard export',
      'Advanced stats & streaks',
      'Spaced repetition (SRS) mode',
      'Priority support'
    ],
    cta: 'Join Waitlist',
    ctaHref: '#',
    popular: true
  }
]

const Pricing = () => {
  const [visible, setVisible] = useState(false)
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const currentProPrice = proPrices[billing]

  return (
    <section id="pricing" ref={ref} className="pricing">
      <div className="container">
        <div className="pricing-header">
          <span className="section-label">Pricing</span>
          <h2 className="section-title">Start free, go Pro when you're ready</h2>
          <p className="section-subtitle">
            The free tier has everything you need. Pro is for learners who want unlimited vocabulary, sentence mining, and advanced features.
          </p>
        </div>

        <div className={`pricing-billing-toggle ${visible ? 'pricing-visible' : ''}`}>
          <button
            className={`billing-option ${billing === 'weekly' ? 'billing-active' : ''}`}
            onClick={() => setBilling('weekly')}
          >
            Weekly
            <span className="billing-price">{proPrices.weekly.price}</span>
          </button>
          <button
            className={`billing-option ${billing === 'monthly' ? 'billing-active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
            <span className="billing-price">{proPrices.monthly.price}</span>
          </button>
          <button
            className={`billing-option ${billing === 'yearly' ? 'billing-active' : ''}`}
            onClick={() => setBilling('yearly')}
          >
            Yearly
            <span className="billing-price">{proPrices.yearly.price}</span>
            <span className="billing-save">Save 30%</span>
          </button>
        </div>

        <div className={`pricing-grid ${visible ? 'pricing-visible' : ''}`}>
          {plans.map((plan, i) => {
            const isPro = plan.name === 'Pro'
            const price = isPro ? currentProPrice.price : plan.price
            const period = isPro ? currentProPrice.period : plan.period
            const annualPrice = isPro ? currentProPrice.annualPrice : plan.annualPrice

            return (
              <div
                key={plan.name}
                className={`pricing-card ${plan.popular ? 'pricing-popular' : ''}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {plan.popular && <div className="pricing-badge">Most Popular</div>}
                <div className="pricing-plan-name">{plan.name}</div>
                <div className="pricing-plan-price">
                  <span className="price-amount">{price}</span>
                  <span className="price-period">{period}</span>
                  {annualPrice && (
                    <div className="price-annual">{annualPrice}</div>
                  )}
                </div>
                <p className="pricing-plan-desc">{plan.description}</p>
                <ul className="pricing-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`}
                  {...(plan.ctaHref === '#' ? {
                    onClick: (e: React.MouseEvent) => {
                      if (plan.popular) {
                        e.preventDefault()
                        alert('Waitlist coming soon! Sign up for updates on our Chrome Web Store page.')
                      }
                    }
                  } : {})}
                >
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .pricing {
          padding: 100px 0;
          background: var(--bg-secondary);
        }
        .pricing-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .pricing-header .section-subtitle {
          margin: 0 auto;
        }
        .pricing-billing-toggle {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-bottom: 36px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          max-width: 370px;
          margin-left: auto;
          margin-right: auto;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.6s ease;
        }
        .pricing-billing-toggle.pricing-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .billing-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 8px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          position: relative;
        }
        .billing-option:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
        }
        .billing-active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        .billing-active:hover {
          background: var(--accent);
          color: #fff;
        }
        .billing-price {
          font-size: 16px;
          font-weight: 800;
        }
        .billing-save {
          font-size: 10px;
          font-weight: 700;
          color: var(--green);
          background: rgba(34,197,94,0.12);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .billing-active .billing-save {
          color: #bbf7d0;
          background: rgba(255,255,255,0.2);
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }
        .pricing-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .pricing-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 36px 28px;
          position: relative;
          transition: all var(--transition);
          animation: fadeUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .pricing-visible .pricing-card {
          animation: fadeUp 0.5s ease-out forwards;
        }
        .pricing-popular {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent-glow);
        }
        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gradient-primary);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 24px;
        }
        .pricing-plan-name {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .pricing-plan-price {
          margin-bottom: 16px;
        }
        .price-amount {
          font-size: 40px;
          font-weight: 800;
        }
        .price-period {
          font-size: 16px;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .price-annual {
          font-size: 12px;
          color: var(--green);
          font-weight: 500;
          margin-top: 4px;
        }
        .pricing-plan-desc {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .pricing-features {
          list-style: none;
          margin-bottom: 28px;
        }
        .pricing-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .pricing-features li svg {
          color: var(--green);
          flex-shrink: 0;
        }
        .btn-full {
          width: 100%;
          justify-content: center;
          text-align: center;
        }
        @media (max-width: 640px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
          .pricing-billing-toggle {
            max-width: 100%;
            margin-left: 16px;
            margin-right: 16px;
          }
        }
      `}</style>
    </section>
  )
}

export default Pricing
