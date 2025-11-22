'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Printer, Menu, History, ChevronRight, ArrowUp, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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
  const [activeSection, setActiveSection] = useState<string>('')
  const [readingProgress, setReadingProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [versionSearchQuery, setVersionSearchQuery] = useState('')
  const mainContentRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleScroll = () => {
      // Calculate reading progress
      if (mainContentRef.current) {
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        const scrollTop = window.scrollY
        const progress = (scrollTop / (documentHeight - windowHeight)) * 100
        setReadingProgress(Math.min(100, Math.max(0, progress)))
      }

      // Show/hide back to top button
      setShowBackToTop(window.scrollY > 500)

      // Track active section
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter version history based on search query
  const filteredVersions = PRIVACY_POLICY_METADATA.versionHistory.filter((version) => {
    if (!versionSearchQuery) return true
    const query = versionSearchQuery.toLowerCase()
    return (
      version.version.toLowerCase().includes(query) ||
      formatDate(version.date).toLowerCase().includes(query) ||
      version.changes.some((change) => change.toLowerCase().includes(query))
    )
  })

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
          }
          section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          h2 {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-size: 18pt;
            border-bottom: 2px solid #000;
            padding-bottom: 0.25em;
          }
          h3 {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-size: 14pt;
          }
          ul, ol {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          footer {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-top: 2em;
            padding-top: 1em;
            border-top: 1px solid #000;
            font-size: 10pt;
          }
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-toc {
            page-break-after: always;
            break-after: page;
            margin-bottom: 2em;
          }
          .print-toc h2 {
            font-size: 16pt;
            margin-bottom: 1em;
            border: none;
            padding: 0;
          }
          .print-toc ul {
            list-style: none;
            padding-left: 0;
          }
          .print-toc li {
            margin: 0.5em 0;
          }
          .print-toc a {
            text-decoration: none;
            color: #000;
          }
          .print-toc a::after {
            content: leader('.') ' ' target-counter(attr(href), page);
          }
          @page {
            margin: 2cm;
            @top-center {
              content: "Privacy Policy - TSmartCleaning";
              font-size: 10pt;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10pt;
            }
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

        {/* Reading Progress */}
        <div className="sticky top-0 z-50 mb-4 print:hidden bg-background/95 backdrop-blur-sm pb-2 pt-2">
          <Progress value={readingProgress} className="h-1" />
        </div>

        {/* Table of Contents - Sticky on desktop */}
        <div className="sticky top-4 z-10 mb-12 print:hidden">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5 text-primary" />
                Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Print-only Table of Contents */}
        <div className="hidden print:block mb-8 print-toc">
          <h2 className="text-2xl font-bold mb-4">Table of Contents</h2>
          <ul className="list-none space-y-2">
            {sections.map((section) => (
              <li key={section.id} className="text-sm">
                <a href={`#${section.id}`} className="text-foreground hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div ref={mainContentRef} className="prose prose-gray max-w-none space-y-8">
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
            <p className="text-muted-foreground leading-relaxed mb-6">
              This section documents the history of changes to our privacy policy. Use the search below to find specific versions or changes.
            </p>

            {/* Version Search */}
            <div className="mb-6 print:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search versions by number, date, or change description..."
                  value={versionSearchQuery}
                  onChange={(e) => setVersionSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {versionSearchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {filteredVersions.length} version{filteredVersions.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Version History Accordion */}
            <div className="space-y-4 mt-6">
              <Accordion type="single" collapsible defaultValue={PRIVACY_POLICY_METADATA.versionHistory[PRIVACY_POLICY_METADATA.versionHistory.length - 1]?.version} className="w-full">
                {filteredVersions
                  .slice()
                  .reverse()
                  .map((version, index) => (
                    <AccordionItem key={version.version} value={version.version} className="border rounded-lg px-4" style={{ pageBreakInside: 'avoid' }}>
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <History className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold">Version {version.version}</h3>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {formatDate(version.date)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {version.changes.length} change{version.changes.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="border-0 shadow-none bg-muted/30">
                          <CardContent className="pt-4">
                            <h4 className="font-semibold mb-3 text-sm">Changes in this version:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                              {version.changes.map((change, changeIndex) => (
                                <li key={changeIndex} className="leading-relaxed">{change}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>

              {filteredVersions.length === 0 && versionSearchQuery && (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No versions found matching "{versionSearchQuery}"</p>
                </Card>
              )}
            </div>

            <div className="mt-6 p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground print:block">
              <strong>Note:</strong> For significant changes, we notify users via email or platform notification at least 30 days before changes take effect.
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

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg print:hidden"
            size="icon"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        {/* Footer */}
        <footer className="border-t py-8 bg-muted/30" style={{ pageBreakInside: 'avoid' }}>
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} TSmartCleaning. All rights reserved.</p>
            <p className="mt-2 hidden print:block">
              This document was printed on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} from tsmartcleaning.com/privacy
            </p>
            <p className="mt-2 print:hidden">
              Last updated: {LAST_UPDATED} | Version {VERSION}
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

