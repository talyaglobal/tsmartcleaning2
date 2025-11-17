import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Clock, Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export default function ContactPage() {
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

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Have questions about our services? We're here to help you find the perfect cleaning solution.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <select
                      id="serviceType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select a service</option>
                      <option value="residential">Residential Cleaning</option>
                      <option value="commercial">Commercial Cleaning</option>
                      <option value="specialized">Specialized Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your cleaning needs..."
                      rows={5}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-muted-foreground">support@tsmartcleaning.com</p>
                        <p className="text-muted-foreground">sales@tsmartcleaning.com</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <p className="text-muted-foreground">+1 (800) 555-0123</p>
                        <p className="text-sm text-muted-foreground">Mon-Fri 8am - 8pm EST</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Office</h3>
                        <p className="text-muted-foreground">123 Business Ave, Suite 100</p>
                        <p className="text-muted-foreground">Boston, MA 02101</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Business Hours</h3>
                        <p className="text-muted-foreground">Monday - Friday: 8am - 8pm</p>
                        <p className="text-muted-foreground">Saturday: 9am - 5pm</p>
                        <p className="text-muted-foreground">Sunday: Closed</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <Card className="p-6 bg-primary text-primary-foreground">
                <h3 className="text-xl font-bold mb-2">Enterprise Solutions</h3>
                <p className="mb-4 opacity-90">
                  Looking for large-scale commercial cleaning services? Our dedicated team can create a custom solution for your business.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/signup">Request a Quote</Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">How quickly can I book a cleaning service?</h3>
                <p className="text-muted-foreground">
                  You can book a service in minutes! Many of our providers offer same-day or next-day availability.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Are your cleaning professionals insured?</h3>
                <p className="text-muted-foreground">
                  Yes, all our cleaning professionals are fully insured and background-checked for your safety and peace of mind.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">What if I'm not satisfied with the service?</h3>
                <p className="text-muted-foreground">
                  We offer a 100% satisfaction guarantee. If you're not happy with the service, contact us within 24 hours and we'll make it right.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Do I need to provide cleaning supplies?</h3>
                <p className="text-muted-foreground">
                  No, our professionals bring their own supplies and equipment. However, if you have specific products you'd like us to use, just let us know!
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">TSmartCleaning</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional cleaning services made simple.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#services" className="hover:text-foreground transition-colors">Residential Cleaning</Link></li>
                <li><Link href="/#services" className="hover:text-foreground transition-colors">Commercial Cleaning</Link></li>
                <li><Link href="/#services" className="hover:text-foreground transition-colors">Specialized Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/provider-signup" className="hover:text-foreground transition-colors">Become a Provider</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
