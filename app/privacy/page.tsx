import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              TSmartCleaning ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
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

          <section>
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

          <section>
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

          <section>
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
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

          <section>
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to improve your experience on our platform. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
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
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
