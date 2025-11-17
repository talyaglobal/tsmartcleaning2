import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'

export default function TermsPage() {
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using TSmartCleaning's platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Services Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              TSmartCleaning operates as a marketplace connecting customers seeking cleaning services with independent service providers. We do not directly provide cleaning services but facilitate connections between parties.
            </p>
          </section>

          <section>
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

          <section>
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

          <section>
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

          <section>
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

          <section>
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The platform, including all content, features, and functionality, is owned by TSmartCleaning and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section>
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

          <section>
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, TSmartCleaning shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or services obtained through it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold TSmartCleaning harmless from any claims, damages, losses, or expenses arising from your use of the platform or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.
            </p>
          </section>

          <section>
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
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
