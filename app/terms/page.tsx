'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Printer, Menu, History, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo'

// Terms configuration - update these when terms change
const TERMS_CONFIG = {
  version: '1.0',
  lastUpdated: new Date('2025-01-15'), // Update this date when terms are modified
  versionHistory: [
    {
      version: '1.0',
      date: new Date('2025-01-15'),
      changes: [
        'Initial Terms of Service published',
        'Established user account requirements',
        'Defined booking and payment terms',
        'Outlined provider obligations',
        'Set forth liability limitations',
      ],
    },
  ],
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Get last updated string
function getLastUpdatedString(): string {
  return formatDate(TERMS_CONFIG.lastUpdated)
}

const sections = [
  { id: 'agreement', title: 'Agreement to Terms' },
  { id: 'services', title: 'Services Description' },
  { id: 'user-accounts', title: 'User Accounts' },
  { id: 'booking-payments', title: 'Booking and Payments' },
  { id: 'provider-terms', title: 'Provider Terms' },
  { id: 'prohibited', title: 'Prohibited Conduct' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'disclaimers', title: 'Disclaimers' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'termination', title: 'Termination' },
  { id: 'changes', title: 'Changes to Terms' },
  { id: 'version-history', title: 'Version History' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'contact', title: 'Contact Information' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]')
      const scrollPosition = window.scrollY + 200

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionHeight = section.clientHeight
        const sectionId = section.getAttribute('id')

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || '')
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide non-essential elements */
          .no-print {
            display: none !important;
          }

          /* Print-specific styles */
          body {
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
          }

          .print-container {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }

          /* Page breaks */
          section {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }

          h2 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-size: 18pt;
            border-bottom: 2px solid #000;
            padding-bottom: 0.25em;
          }

          h3 {
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-size: 14pt;
          }

          /* Links */
          a {
            color: #000;
            text-decoration: underline;
          }

          /* Lists */
          ul, ol {
            margin: 0.5em 0;
            padding-left: 1.5em;
          }

          li {
            margin: 0.25em 0;
          }

          /* Footer */
          footer {
            margin-top: 2em;
            padding-top: 1em;
            border-top: 1px solid #000;
            font-size: 10pt;
          }

          /* Print header */
          @page {
            margin: 2cm;
            @top-center {
              content: "Terms of Service - TSmartCleaning";
              font-size: 10pt;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10pt;
            }
          }

          /* Table of contents for print */
          .print-toc {
            display: block !important;
            page-break-after: always;
            break-after: page;
            margin-bottom: 2em;
          }

          .print-toc h2 {
            font-size: 16pt;
            margin-bottom: 1em;
          }

          .print-toc ul {
            list-style: none;
            padding-left: 0;
          }

          .print-toc li {
            margin: 0.5em 0;
            padding-left: 1em;
            text-indent: -1em;
          }

          .print-toc a {
            text-decoration: none;
            color: #000;
          }

          .print-toc a::after {
            content: leader('.') ' ' target-counter(attr(href), page);
          }
        }
      `}} />

      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Terms of Service', url: '/terms' },
        ])}
      />

      <div className="min-h-screen">
        {/* Content */}
        <div className="container mx-auto px-4 py-20 max-w-4xl print-container">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: {getLastUpdatedString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Version {TERMS_CONFIG.version}</p>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* Table of Contents - Sticky on desktop */}
          <div className="sticky top-4 z-10 mb-12 no-print">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Menu className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Table of Contents</h2>
              </div>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left text-sm transition-colors py-2 px-2 rounded-md ${
                      activeSection === section.id
                        ? 'text-foreground font-medium bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className={`h-3 w-3 transition-transform ${activeSection === section.id ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{section.title}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Print-only Table of Contents */}
          <div className="print-toc hidden">
            <h2>Table of Contents</h2>
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section id="agreement">
            <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using TSmartCleaning's platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section id="services">
            <h2 className="text-2xl font-bold mb-4">Services Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              TSmartCleaning operates as a marketplace connecting customers seeking cleaning services with independent service providers. We do not directly provide cleaning services but facilitate connections between parties.
            </p>
          </section>

          <section id="user-accounts">
            <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">Registration</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use certain features, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6">Account Types</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We offer different account types:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Customer Accounts:</strong> For individuals or businesses seeking cleaning services</li>
              <li><strong>Provider Accounts:</strong> For verified cleaning professionals offering services</li>
              <li><strong>Admin Accounts:</strong> For platform administrators</li>
            </ul>
          </section>

          <section id="booking-payments">
            <h2 className="text-2xl font-bold mb-4">Booking and Payments</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">Booking Process</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you book a service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You enter into a direct agreement with the service provider</li>
              <li>TSmartCleaning facilitates the transaction but is not a party to the service agreement</li>
              <li>Cancellation policies apply as stated at the time of booking</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6">Payment Terms</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Payments are processed securely through our platform</li>
              <li>TSmartCleaning charges a service fee (commission) on each transaction</li>
              <li>Refunds are subject to our refund policy</li>
              <li>All prices are in USD unless otherwise stated</li>
            </ul>
          </section>

          <section id="provider-terms">
            <h2 className="text-2xl font-bold mb-4">Provider Terms</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">Provider Obligations</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Service providers agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate service descriptions and pricing</li>
              <li>Maintain required licenses, insurance, and certifications</li>
              <li>Deliver services professionally and on time</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Handle customer data responsibly and securely</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6">Background Checks</h3>
            <p className="text-muted-foreground leading-relaxed">
              All providers undergo background verification. However, TSmartCleaning does not guarantee provider performance and is not responsible for their actions.
            </p>
          </section>

          <section id="prohibited">
            <h2 className="text-2xl font-bold mb-4">Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful code or malware</li>
              <li>Engage in fraudulent activities</li>
              <li>Harass or abuse other users</li>
              <li>Attempt to circumvent platform fees</li>
              <li>Use automated systems to access the platform</li>
            </ul>
          </section>

          <section id="intellectual-property">
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The platform, including all content, features, and functionality, is owned by TSmartCleaning and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section id="disclaimers">
            <h2 className="text-2xl font-bold mb-4">Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our platform is provided "as is" without warranties of any kind. We disclaim all warranties, express or implied, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Accuracy or reliability of information</li>
              <li>Uninterrupted or error-free service</li>
              <li>Quality of services provided by third parties</li>
            </ul>
          </section>

          <section id="liability">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, TSmartCleaning shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or services obtained through it.
            </p>
          </section>

          <section id="indemnification">
            <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold TSmartCleaning harmless from any claims, damages, losses, or expenses arising from your use of the platform or violation of these terms.
            </p>
          </section>

          <section id="termination">
            <h2 className="text-2xl font-bold mb-4">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section id="version-history">
            <h2 className="text-2xl font-bold mb-4">Version History</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              This section documents all changes made to these Terms of Service. We recommend reviewing this history to stay informed about updates.
            </p>
            <div className="space-y-6">
              {TERMS_CONFIG.versionHistory.map((version, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Version {version.version}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(version.date)}
                      </p>
                    </div>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    {version.changes.map((change, changeIdx) => (
                      <li key={changeIdx}>{change}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
              <strong>Note:</strong> For significant changes, we will notify users via email or platform notification at least 30 days before the changes take effect.
            </div>
          </section>

          <section id="governing-law">
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Email: legal@tsmartcleaning.com<br />
              Address: 123 Cleaning Street, San Francisco, CA 94105
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 no-print">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TSmartCleaning. All rights reserved.</p>
          <p className="mt-2">Last updated: {getLastUpdatedString()} | Version {TERMS_CONFIG.version}</p>
        </div>
      </footer>
    </div>
    </>
  )
}
