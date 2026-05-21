import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import './Legal.css'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-collection', label: 'Data We Process' },
  { id: 'local-storage', label: 'What Stays on Device' },
  { id: 'accounts-billing', label: 'Accounts & Billing' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'choices', label: 'Your Choices' },
  { id: 'children', label: 'Children\u2019s Privacy' },
  { id: 'contact', label: 'Contact' },
  { id: 'changes', label: 'Changes' },
]

const Privacy = () => {
  const [active, setActive] = useState('overview')

  return (
    <div className="app">
      <Navbar scrolled={true} />
      <div className="legal-page">
        <div className="container">
          <div className="legal-layout">
            <aside className="legal-sidebar">
              <h3>Privacy Policy</h3>
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
              <h1>Kumo — Privacy Policy</h1>
              <p className="legal-date"><em>Last updated: June 3, 2026</em></p>

              <section id="overview">
                <h2>Overview</h2>
                <p>Kumo is a Chrome extension and website for Japanese learners. The extension is designed to process Japanese text locally in your browser whenever possible. This policy explains what stays on your device, what may be sent to service providers when you use optional account or paid features, and how to contact us.</p>
              </section>

              <section id="data-collection">
                <h2>Data We Process</h2>
                <p><strong>Core dictionary lookups and furigana generation run locally in the extension.</strong> Kumo does not send the page text you hover over or annotate to our servers for dictionary lookup.</p>
                <ul>
                  <li><strong>Page text.</strong> The extension reads text from pages you visit so it can identify Japanese text and display furigana or dictionary popups. That text is processed in your browser.</li>
                  <li><strong>Dictionary lookups.</strong> Kumo may send individual words to Jisho.org&rsquo;s public API for enriched definitions and JLPT classification. These requests do not include any page-context or browsing data beyond the word being looked up. You can disable this in settings by enabling Offline Mode.</li>
                  <li><strong>Learning data.</strong> Saved words, known words, sentence-mining entries, SRS progress, quiz history, stats, and settings are stored through Chrome storage on your device unless you use an optional sync/account feature that clearly says it stores data with a service provider.</li>
                  <li><strong>Progress tracking.</strong> Kumo tracks local usage statistics such as daily word lookups, streak counts, and the domain names of pages you visit. This data is stored on your device only and is used to display your learning progress. It is never sent to any server.</li>
                  <li><strong>No browsing telemetry.</strong> We do not sell your data, run behavioral advertising, or intentionally collect a history of pages you read.</li>
                </ul>
              </section>

              <section id="local-storage">
                <h2>What Stays on Your Device</h2>
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Where</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Word bank entries</td>
                      <td>Chrome Local Storage</td>
                      <td>Save words you&rsquo;ve picked up</td>
                    </tr>
                    <tr>
                      <td>Known kanji list</td>
                      <td>Chrome Local Storage</td>
                      <td>Track your learning progress</td>
                    </tr>
                    <tr>
                      <td>Sentences, SRS progress, stats, quiz data</td>
                      <td>Chrome Local Storage</td>
                      <td>Power learning and review features</td>
                    </tr>
                    <tr>
                      <td>Settings (toggles, visual preferences)</td>
                      <td>Chrome Sync Storage</td>
                      <td>Sync preferences across devices</td>
                    </tr>
                  </tbody>
                </table>
                <p>Chrome storage may be synced by Chrome if browser sync is enabled for your Google account. That sync is controlled by Chrome, not Kumo.</p>
              </section>

              <section id="accounts-billing">
                <h2>Accounts & Billing</h2>
                <p>Kumo may offer optional account and paid-plan features. If you choose to create an account or purchase a subscription, the following data may be processed by service providers:</p>
                <ul>
                  <li><strong>Supabase.</strong> Used for authentication and subscription profile records, such as your email address, user ID, plan tier, subscription status, and Stripe customer/subscription identifiers.</li>
                  <li><strong>Stripe.</strong> Used for checkout, subscription billing, invoices, tax, fraud prevention, and payment compliance. Kumo does not receive or store your full card number.</li>
                  <li><strong>Email providers.</strong> Authentication emails, account notices, or support replies may be sent to the email address you provide.</li>
                </ul>
                <p>You can use core local extension features without creating an account unless a specific feature is marked as requiring sign-in or a paid plan.</p>
              </section>

              <section id="permissions">
                <h2>Permissions</h2>
                <p>Kumo requests the following Chrome permissions:</p>
                <ul>
                  <li><strong><code>storage</code></strong> &mdash; To save your word bank, settings, and learning data locally.</li>
                  <li><strong><code>activeTab</code></strong> &mdash; To read page content on the current tab so Kumo can identify Japanese text and apply furigana.</li>
                  <li><strong><code>contextMenus</code></strong> &mdash; To provide right-click extension actions for saving and marking words.</li>
                  <li><strong><code>host permissions</code></strong> (<code>https://jisho.org/*</code>) &mdash; To fetch enriched dictionary definitions from the Jisho.org public API.</li>
                </ul>
                <p>Kumo injects a content script on all URLs (<code>&lt;all_urls&gt;</code>) to add furigana to Japanese text. This script does not send data anywhere &mdash; it only reads page text to identify Japanese characters and overlays furigana. Dictionary lookups to Jisho.org are made from the background service worker or extension pages, not from the content script.</p>
              </section>

              <section id="third-party">
                <h2>Third-Party Services</h2>
                <p>Kumo uses the following resources and services:</p>
                <ul>
                  <li><strong>Kuromoji</strong> (Apache 2.0) &mdash; Japanese morphological analyzer, runs locally</li>
                  <li><strong>JMdict</strong> (CC BY-SA 4.0) &mdash; Dictionary data from the Electronic Dictionary Research and Development Group</li>
                  <li><strong>KanjiDic2</strong> (CC BY-SA 4.0) &mdash; Kanji dictionary data</li>
                  <li><strong>ENAMDICT</strong> (CC BY-SA) &mdash; Japanese name dictionary data</li>
                  <li><strong>Jisho.org</strong> &mdash; Public dictionary API used for enriched word definitions and JLPT classification. Individual words you hover over or look up are sent to Jisho.org. You can disable this in settings by enabling Offline Mode.</li>
                  <li><strong>YouTube</strong> &mdash; When Kumo&rsquo;s YouTube caption integration is enabled, the extension may contact YouTube&rsquo;s Innertube API and caption-track servers to fetch Japanese subtitle data for the video you are watching.</li>
                  <li><strong>Supabase</strong> &mdash; Optional account authentication and subscription profile storage</li>
                  <li><strong>Stripe</strong> &mdash; Optional payment processing and subscription billing</li>
                  <li><strong>GitHub</strong> &mdash; The website may fetch public repository metadata, such as the latest extension update time</li>
                </ul>
                <p>Bundled dictionary resources run locally in the extension. Optional account, billing, and website metadata features may contact the listed service providers.</p>
              </section>

              <section id="choices">
                <h2>Your Choices</h2>
                <ul>
                  <li>You can uninstall Kumo at any time from Chrome&rsquo;s extension settings.</li>
                  <li>You can export, import, or delete local learning data using Kumo&rsquo;s backup and restore tools where available.</li>
                  <li>You can sign out of optional account features from the Account page.</li>
                  <li>You can contact us to request help with account or billing data associated with your email address.</li>
                </ul>
              </section>

              <section id="children">
                <h2>Children&rsquo;s Privacy</h2>
                <p>Kumo is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If we learn that a child under 13 has provided personal information through an account, we will delete it. If you believe a child under 13 has created an account or provided personal information, please contact us at <a href="mailto:privacy@kumo.app">privacy@kumo.app</a>.</p>
              </section>

              <section id="contact">
                <h2>Contact</h2>
                <p>For questions about privacy, email us at <a href="mailto:privacy@kumo.app">privacy@kumo.app</a> or open an issue on <a href="https://github.com/erichanwang/Kumo" target="_blank" rel="noopener">GitHub</a>.</p>
              </section>

              <section id="changes">
                <h2>Changes</h2>
                <p>We may update this policy as Kumo changes. When we make material changes, we will update the date above and publish the revised policy on the website.</p>
              </section>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Privacy
