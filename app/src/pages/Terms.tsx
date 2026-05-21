import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import './Legal.css'

const SECTIONS = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'service', label: 'Service' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'usage', label: 'Usage' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'attribution', label: 'Attribution' },
  { id: 'termination', label: 'Termination' },
  { id: 'contact', label: 'Contact' },
]

const Terms = () => {
  const [active, setActive] = useState('acceptance')

  return (
    <div className="app">
      <Navbar scrolled={true} />
      <div className="legal-page">
        <div className="container">
          <div className="legal-layout">
            <aside className="legal-sidebar">
              <h3>Terms of Service</h3>
              <nav>
                {SECTIONS.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={active === s.id ? 'active' : ''}
                    onClick={() => setActive(s.id)}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </aside>
            <main className="legal-content">
              <h1>Kumo — Terms of Service</h1>
              <p className="legal-date"><em>Last updated: June 3, 2026</em></p>

              <section id="acceptance">
                <h2>Acceptance</h2>
                <p>By installing, accessing, or using Kumo, including the Chrome extension and website, you agree to these terms and the Privacy Policy. If you do not agree, do not use Kumo.</p>
              </section>

              <section id="service">
                <h2>Service</h2>
                <p>Kumo helps Japanese learners read web content by adding furigana, dictionary lookups, word-bank tools, and study features. Kumo may change, add, or remove features over time, including free and paid-plan limits.</p>
              </section>

              <section id="accounts">
                <h2>Accounts</h2>
                <ul>
                  <li>Core local extension features may be available without an account.</li>
                  <li>Some sync, subscription, or Pro features may require an account.</li>
                  <li>You are responsible for keeping your login credentials secure and for activity under your account.</li>
                  <li>You must provide accurate account and billing information when using paid features.</li>
                </ul>
              </section>

              <section id="subscriptions">
                <h2>Subscriptions and Billing</h2>
                <ul>
                  <li>Paid Kumo plans are billed through Stripe or another disclosed payment processor.</li>
                  <li>Subscription prices, billing intervals, included features, and limits are shown at checkout or on the pricing page.</li>
                  <li>Subscriptions renew automatically unless canceled before the renewal date.</li>
                  <li>Refunds, cancellations, and billing changes are handled according to the checkout terms shown at purchase and applicable law.</li>
                  <li>We may change paid-plan features or prices prospectively. Existing subscribers will receive any required notice before material billing changes take effect.</li>
                </ul>
              </section>

              <section id="usage">
                <h2>Usage</h2>
                <ul>
                  <li>Kumo is a tool for adding furigana and dictionary lookups to Japanese text on web pages.</li>
                  <li>You may use Kumo for personal, educational, or commercial purposes.</li>
                  <li>You may not use Kumo to violate laws, infringe intellectual property rights, interfere with websites, bypass access controls, reverse engineer paid features, or abuse Kumo&rsquo;s infrastructure.</li>
                  <li>You are responsible for how you use Kumo on third-party websites and for complying with those websites&rsquo; terms.</li>
                </ul>
              </section>

              <section id="ownership">
                <h2>Ownership</h2>
                <p>Kumo is private software. Except for rights expressly granted to you through the Chrome Web Store, these terms, or a separate written agreement, all rights in Kumo are reserved. Third-party open-source libraries and dictionary datasets remain subject to their own licenses and attribution requirements.</p>
              </section>

              <section id="disclaimer">
                <h2>Disclaimer</h2>
                <p><strong>KUMO IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW.</strong></p>
                <p>Kumo:</p>
                <ul>
                  <li>May misread, mistranslate, or misparse Japanese text, names, captions, or informal language</li>
                  <li>May not work correctly on all websites, including websites that change their DOM or restrict extension behavior</li>
                  <li>May produce study suggestions that require your own judgment and verification</li>
                  <li>Is not a substitute for professional translation, legal, medical, financial, immigration, academic, or other expert advice</li>
                </ul>
                <p>To the maximum extent permitted by law, Kumo and its operators are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of data, revenue, profits, goodwill, or business opportunities arising from use of Kumo.</p>
              </section>

              <section id="attribution">
                <h2>Dictionary Data Attribution</h2>
                <p>Kumo includes dictionary data from:</p>
                <ul>
                  <li><strong>JMdict</strong> &mdash; &copy; Electronic Dictionary Research and Development Group, used under CC BY-SA 4.0</li>
                  <li><strong>KanjiDic2</strong> &mdash; &copy; Jim Breen and the Electronic Dictionary Research and Development Group, used under CC BY-SA 4.0</li>
                  <li><strong>ENAMDICT</strong> &mdash; Electronic Dictionary Research and Development Group name dictionary data, used under its applicable license terms</li>
                </ul>
                <p>These resources are bundled for offline dictionary lookup functionality.</p>
                <p>Kumo may also fetch enriched definitions from Jisho.org&rsquo;s public API when a word is looked up, as described in the Privacy Policy.</p>
              </section>

              <section id="termination">
                <h2>Termination</h2>
                <p>You may stop using Kumo at any time by uninstalling the extension and canceling any paid subscription. We may suspend or terminate access to account-based or paid features if you violate these terms, create risk for other users, or create legal or security risk for Kumo.</p>
              </section>

              <section id="contact">
                <h2>Contact</h2>
                <p>Questions? <a href="mailto:terms@kumo.app">terms@kumo.app</a> or <a href="https://github.com/erichanwang/Kumo" target="_blank" rel="noopener">GitHub Issues</a>.</p>
              </section>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Terms
