"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function MarketingPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              <span className="block">Solving the Cleaning Industry&apos;s Labor Crisis</span>
              <span className="block mt-2">Recruit, Manage,</span>
              <span className="block">and Scale</span>
              <span className="block">All in One App</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              The first integrated platform connecting cleaning companies with pre-vetted immigrant women cleaners, powered by a comprehensive Super App for all operational needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-black" asChild>
                <Link href="/contact">
                  For Companies <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/customer/book">
                  Book now
                </Link>
              </Button>
            </div>
          </div>
          <div className="w-full">
            <div className="aspect-[3/2] rounded-xl bg-muted overflow-hidden">
              <img
                src="/tsmartcleaning.webflow/images/7a3b972a-7300-4e52-89de-c27861f06954.avif"
                alt="image of cleaning team in action"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <div>
              <h3 className="text-xl font-semibold mb-2">Trusted by top US companies</h3>
              <p className="text-muted-foreground">
                Leading businesses rely on our platform to simplify cleaning management and ensure quality results. See how we support property managers and teams nationwide.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 opacity-80">
              <LogoBlock />
              <LogoBlock />
              <LogoBlock />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs: Booking, Customer advantages, Role management */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid md:grid-cols-3 w-full">
              <TabsTrigger value="booking">Booking made simple</TabsTrigger>
              <TabsTrigger value="customer">Customer advantages</TabsTrigger>
              <TabsTrigger value="roles">Role management</TabsTrigger>
            </TabsList>
            <TabsContent value="booking" className="mt-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold">Fast, mobile-first booking flow</h3>
              </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted">
                <img
                  src="/tsmartcleaning.webflow/images/352ced84-a541-4c36-99c3-c6e27bc3de97.avif"
                  alt="image of cleaning team in action"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
            <TabsContent value="customer" className="mt-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold">Convenient features for every user</h3>
              </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted">
                <img
                  src="/tsmartcleaning.webflow/images/d6989f71-4481-4421-abd6-d68ad5f8ad32.avif"
                  alt="Customer portal"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
            <TabsContent value="roles" className="mt-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold">Access for all team types</h3>
              </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted">
                <img
                  src="/tsmartcleaning.webflow/images/32e6fded-cf63-4632-9931-c029148376c6.avif"
                  alt="Role management"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Feature cards aligned to roles */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm text-muted-foreground">Platform features for every role</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Powerful tools for seamless cleaning</h2>
            <p className="text-muted-foreground mt-3">
              Manage bookings, payments, and reports with a unified platform. Designed for customers, providers, and operations—mobile-first and built for efficiency.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="aspect-[3/2]">
                <img src="/tsmartcleaning.webflow/images/f1391699-4969-4947-9296-172c397c3c10.avif" alt="Customer portal" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Easy online booking</h3>
                <p className="text-muted-foreground mb-4">
                  Choose services, extras, and times. See real-time availability and get instant confirmation.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/customer/book">Book</Link>
                </Button>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-[3/2]">
                <img src="/tsmartcleaning.webflow/images/4c820c83-5b85-4c23-9842-bf8d5f377039.avif" alt="Provider portal" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Flexible scheduling</h3>
                <p className="text-muted-foreground mb-4">
                  Set your availability, sync calendars, and manage job applications from any device.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/provider">Details</Link>
                </Button>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-[3/2]">
                <img src="/tsmartcleaning.webflow/images/a6a55cc7-c2e6-4edb-be65-0e1733ecf1f1.avif" alt="Dispatcher tools" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Real-time job board</h3>
                <p className="text-muted-foreground mb-4">
                  View open jobs, filter by status, and assign providers with one click.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/admin/bookings">Browse</Link>
                </Button>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-[3/2]">
                <img src="/tsmartcleaning.webflow/images/ac05d457-20c9-44cc-86bf-4cdc773efbba.avif" alt="Reporting" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Automated reporting</h3>
                <p className="text-muted-foreground mb-4">
                  Create PDF reports with photos, timesheets, and notes. Share or export securely.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/admin/reports">Export</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* For Landlords & Property Managers */}
      <section id="property-managers" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge className="mb-3" variant="secondary">Property Ops</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">For landlords & property managers</h2>
            <p className="text-muted-foreground mt-3">
              Streamline turnovers, standardize quality, and keep every unit on schedule—at scale.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Turnovers & coordination</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Automated turnover cleaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Inspection reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Tenant move-in/out coordination</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Damage documentation</span>
                </li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Operate at portfolio scale</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Multi-property management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Maintenance scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Integration with property software (AppFolio, Buildium)</span>
                </li>
              </ul>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Enterprise solutions */}
      <section id="enterprise" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3" variant="secondary">Enterprise</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Enterprise cleaning solutions</h2>
            <p className="text-muted-foreground mt-3">
              Built for offices and multi-location operations with corporate billing, SLAs, and dedicated account management.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contracts & SLAs</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Office cleaning contracts</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>SLA guarantees</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>24/7 commercial service</span></li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Scale & integration</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Multi-location management</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Facility management integration</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Dedicated account managers</span></li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Commercial pricing</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Corporate billing</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Volume discounts</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>POs, cost centers, Net 30/45</span></li>
              </ul>
            </Card>
          </div>
          <div className="text-center mt-10">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact">Contact sales</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">See enterprise pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent plans</h2>
            <p className="text-muted-foreground mt-2">
              Choose a plan that fits your needs.
            </p>
          </div>
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-6">
            <PriceCard title="Free" price="$0" subtitle="No charge, no contract" features={['Online booking','Standard support','Booking history','Basic cleaning options']} cta="Start free" />
            <PriceCard title="Basic" price="$9" subtitle="Per month" features={['Reschedule anytime','Priority support','Save payment info','Loyalty points']} cta="Choose plan" />
            <PriceCard title="Team" price="$19" subtitle="Per month" features={['Team management','Multi-property tools','Download reports','Custom alerts']} cta="Select plan" />
            <PriceCard title="Business" price="$29" subtitle="Per month" features={['Admin controls','Integrations','Analytics','Onboarding help']} cta="Get plan" />
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-muted-foreground">Custom plans for large teams.</p>
              </div>
              <div className="mt-6">
                <Button className="w-full" asChild>
                  <Link href="/contact">Contact</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA band with image */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl md:text-5xl font-bold">Book cleaning in minutes</h2>
            <p className="text-lg text-muted-foreground mt-3">
              Fast, reliable cleaning for homes and businesses. Schedule your service online and get matched with trusted professionals—no hassle, no waiting.
            </p>
            <div className="mt-6">
              <Button size="lg" className="text-black" asChild>
                <Link href="/customer/book">Get started</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden">
            <img
              src="/tsmartcleaning.webflow/images/390d4b90-ab8f-4298-bb01-24aad70695c5.avif"
              alt="image of a freshly cleaned carpet"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Testimonial blurb */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold mb-3">Property managers trust our platform</h3>
            <p className="text-muted-foreground">
              Managing multiple properties is easier with our streamlined cleaning platform. Fast scheduling, transparent pricing, and dedicated support help you deliver consistent results for every unit—saving you time and reducing hassle.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/tsmartcleaning.webflow/images/1aaf9adb-f0e9-4075-8049-83594a4795ee.avif" />
              <AvatarFallback>JE</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">Jordan Ellis</div>
              <div className="text-muted-foreground">Property Manager, Skyline Realty</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
            <p className="text-muted-foreground mt-2">Quick answers about booking, service, and support.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="divide-y rounded-lg border bg-background">
              <FaqItem q="How can I schedule a cleaning?" a="Book online by choosing your service, selecting a date, and confirming your details. Our team will take care of the rest." />
              <FaqItem q="Which locations do you cover?" a="We serve multiple US cities. Enter your zip code during booking to check if we operate in your area." />
              <FaqItem q="Is rescheduling or cancellation possible?" a="You can reschedule or cancel through your account dashboard. Please review our policy for details on timing and fees." />
              <FaqItem q="Who provides the cleaning services?" a="Our professionals are background-checked, trained, and experienced. We work with both employees and vetted freelancers." />
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <p className="text-sm text-muted-foreground">Get in touch</p>
            <h2 className="text-3xl md:text-4xl font-bold">Contact our team today</h2>
            <p className="text-muted-foreground">We&apos;re here to answer your questions.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <ContactCard title="Email" desc="Message us for quick support." href="#" label="email@website.com" />
            <ContactCard title="Phone" desc="Call us Mon–Fri, 8am–5pm." href="#" label="+1 (555) 000-0000" />
            <ContactCard title="Office" desc="Visit us during office hours." href="#" label="101 Web Lane, SF, CA" />
            <ContactCard title="Storefront" desc="Walk in for assistance." href="#" label="101 Web Lane, SF, CA" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <BrandLogo />
              <ul className="flex gap-3 mt-6 text-muted-foreground text-sm">
                <li><Link href="#" className="hover:text-foreground transition-colors">Facebook</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">X</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">YouTube</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-muted-foreground">Services</h4>
              <FooterLink href="#">Home</FooterLink>
              <FooterLink href="#">Pricing</FooterLink>
              <FooterLink href="#">FAQ</FooterLink>
              <FooterLink href="#">Blog</FooterLink>
              <FooterLink href="#">Contact</FooterLink>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-muted-foreground">Providers</h4>
              <FooterLink href="#">Signup</FooterLink>
              <FooterLink href="#">Dashboard</FooterLink>
              <FooterLink href="#">Jobs</FooterLink>
              <FooterLink href="#">Reports</FooterLink>
              <FooterLink href="#">Support</FooterLink>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-muted-foreground">Company</h4>
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#">Careers</FooterLink>
              <FooterLink href="#">Terms</FooterLink>
              <FooterLink href="#">Privacy</FooterLink>
              <FooterLink href="#">Press</FooterLink>
            </div>
            <div className="md:col-span-1 col-span-full" />
          </div>
          <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <div>All rights reserved © 2025 tsmartcleaning</div>
            <ul className="flex gap-4 mt-3 md:mt-0">
              <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PlanCard({
  title,
  emoji,
  price,
  bullets,
  href,
  highlight,
}: {
  title: string
  emoji: string
  price: string
  bullets: string[]
  href: string
  highlight?: boolean
}) {
  return (
    <Link href={href} className={`block rounded-lg border p-4 hover:shadow-md transition-shadow ${highlight ? 'border-primary' : ''}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-semibold">{emoji} {title}</div>
        <div className="text-sm text-muted-foreground">{price}</div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {bullets.map((b) => <li key={b}>• {b}</li>)}
      </ul>
      <div className="mt-3 text-sm font-medium text-primary">Learn More</div>
    </Link>
  )
}

function LogoBlock() {
  return (
    <div className="h-10 rounded bg-muted/60" />
  )
}

function PriceCard(props: { title: string; price: string; subtitle: string; features: string[]; cta: string }) {
  return (
    <Card className="p-6 flex flex-col">
      <div className="mb-4">
        <h4 className="text-xl font-semibold">{props.title}</h4>
        <div className="mt-2">
          <span className="text-3xl font-bold">{props.price}</span>
          {props.subtitle && <span className="text-muted-foreground ml-1">{props.subtitle}</span>}
        </div>
      </div>
      <ul className="space-y-2 mb-6">
        {props.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-auto w-full" asChild>
        <Link href="/signup">{props.cta}</Link>
      </Button>
    </Card>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  // Using a simple custom disclosure to avoid extra styles; Radix primitive is already imported if needed.
  return (
    <details className="group p-4">
      <summary className="cursor-pointer list-none flex items-center justify-between">
        <span className="font-medium">{q}</span>
        <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="pt-3 text-sm text-muted-foreground">{a}</div>
    </details>
  )
}

function ContactCard({ title, desc, href, label }: { title: string; desc: string; href: string; label: string }) {
  return (
    <Card className="p-6">
      <h4 className="text-lg font-semibold mb-1">{title}</h4>
      <p className="text-muted-foreground mb-3">{desc}</p>
      <Link href={href} className="text-primary hover:underline">{label}</Link>
    </Card>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="text-sm text-muted-foreground">
      <Link href={href} className="hover:text-foreground transition-colors">{children}</Link>
    </div>
  )
}

