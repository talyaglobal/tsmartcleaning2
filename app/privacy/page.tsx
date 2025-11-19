'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Printer, Menu, History } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PRIVACY_POLICY_METADATA } from './metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo'

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Get formatted last updated date
const LAST_UPDATED = formatDate(PRIVACY_POLICY_METADATA.lastUpdated)
const VERSION = PRIVACY_POLICY_METADATA.currentVersion

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Information' },
  { id: 'information-sharing', title: 'Information Sharing' },
  { id: 'data-security', title: 'Data Security' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'version-history', title: 'Version History' },
  { id: 'changes', title: 'Changes to This Policy' },
  { id: 'contact', title: 'Contact Us' },
]

export default function PrivacyPage() {
  const [isPrintMode, setIsPrintMode] = useState(false)

  useEffect(() => {
    // Handle print
    const handleBeforePrint = () => setIsPrintMode(true)
    const handleAfterPrint = () => setIsPrintMode(false)
    
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white;
          }
          section {
            page-break-inside: avoid;
          }
          h2 {
            page-break-after: avoid;
          }
          h3 {
            page-break-after: avoid;
          }
          ul, ol {
            page-break-inside: avoid;
          }
          footer {
            page-break-inside: avoid;
          }
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}} />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' },
        ])}
      />
      <div className="min-h-screen">
        {/* Content */}
        <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            <p className="text-sm text-muted-foreground mt-1">Version {VERSION}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12 p-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Menu className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Table of Contents</h2>
          </div>
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors py-1"
              >
                {section.title}
              </button>
            ))}
          </nav>
        </Card>

        <div className="prose prose-gray max-w-none space-y-8">
          <section id="introduction">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              TSmartCleaning ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section id="information-collect">
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Name, email address, phone number, and address</li>
              <li>Payment information and billing details</li>
              <li>Profile information for service providers</li>
              <li>Booking and service history</li>
              <li>Communications with us and reviews</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6">Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you use our platform, we automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
              <li>Usage data and analytics</li>
              <li>Location information (with your permission)</li>
            </ul>
          </section>

          <section id="how-we-use">
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process bookings and payments</li>
              <li>Send you booking confirmations and updates</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section id="information-sharing">
            <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> When you book a service, we share necessary information with the provider</li>
              <li><strong>Payment Processors:</strong> To process transactions securely</li>
              <li><strong>Service Partners:</strong> Third parties that help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section id="data-security">
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section id="your-rights">
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section id="cookies">
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to improve your experience on our platform. You can control cookies through your browser settings.
            </p>
          </section>

          <section id="version-history" style={{ pageBreakInside: 'avoid' }}>
            <h2 className="text-2xl font-bold mb-4">Version History</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This section documents the history of changes to our privacy policy:
            </p>
            <div className="space-y-6 mt-6">
              {PRIVACY_POLICY_METADATA.versionHistory
                .slice()
                .reverse()
                .map((version, index) => (
                  <Card key={version.version} className="p-6" style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <History className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Version {version.version}</h3>
                          {index === 0 && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {formatDate(version.date)}
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          {version.changes.map((change, changeIndex) => (
                            <li key={changeIndex}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy or our privacy practices, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Email: privacy@tsmartcleaning.com<br />
              Address: 123 Cleaning Street, San Francisco, CA 94105
            </p>
          </section>
        </div>
      </div>

        {/* Footer */}
        <footer className="border-t py-8 bg-muted/30" style={{ pageBreakInside: 'avoid' }}>
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
            <p className="mt-2 hidden print:block">
              This document was printed on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} from tsmartcleaning.com/privacy
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
