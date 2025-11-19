import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight, CheckCircle2, ShieldCheck, Star, TrendingUp, Users, Clock, Award } from 'lucide-react'
import { BrandLogoClient } from '@/components/BrandLogoClient'
import { ScrollAnimation, WebflowSection, WebflowButton, WebflowCard } from '@/components/webflow'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Solving the Cleaning Industry\'s Labor Crisis',
  description: 'The first integrated platform connecting cleaning companies with pre-vetted immigrant women cleaners. Recruit, manage, and scale all in one app.',
  path: '/marketing',
  type: 'website',
  keywords: ['cleaning platform', 'labor crisis', 'immigrant women cleaners', 'cleaning company management', 'recruitment platform', 'cleaning services technology'],
})

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Marketing', url: '/marketing' },
          ]),
          generateServiceSchema({
            name: 'Cleaning Platform for Companies',
            description: 'The first integrated platform connecting cleaning companies with pre-vetted immigrant women cleaners. Recruit, manage, and scale all in one app.',
            provider: {
              name: 'tSmartCleaning',
              url: 'https://tsmartcleaning.com',
            },
            areaServed: 'US',
            serviceType: 'Business Platform',
          }),
        ]}
      />

      {/* Hero */}
      <WebflowSection variant="secondary" className="padding_none">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-hero-fade-in">
            <h1 className="heading_h1 mb-6">
              <span className="block">Solving the Cleaning Industry&apos;s Labor Crisis</span>
              <span className="block mt-2">Recruit, Manage,</span>
              <span className="block">and Scale</span>
              <span className="block">All in One App</span>
            </h1>
            <p className="paragraph_large text-color_secondary mb-8">
              The first integrated platform connecting cleaning companies with pre-vetted immigrant women cleaners, powered by a comprehensive Super App for all operational needs.
            </p>
            <div className="button-group">
              <WebflowButton href="/contact">
                For Companies <ArrowRight className="ml-2 h-4 w-4" />
              </WebflowButton>
              <WebflowButton variant="secondary" href="/customer/book">
                Book now
              </WebflowButton>
            </div>
          </div>
          <div className="w-full animate-hero-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="aspect-[3/2] rounded-xl bg-muted overflow-hidden relative">
              <Image
                src="/tsmartcleaning.webflow/images/7a3b972a-7300-4e52-89de-c27861f06954.avif"
                alt="image of cleaning team in action"
                fill
                className="object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </WebflowSection>

      {/* Stats Section */}
      <WebflowSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-align_center">
          <ScrollAnimation delay={0}>
            <div className="heading_h2 mb-2">10K+</div>
            <div className="paragraph_small text-color_secondary">Active Cleaners</div>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <div className="heading_h2 mb-2">50K+</div>
            <div className="paragraph_small text-color_secondary">Jobs Completed</div>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <div className="heading_h2 mb-2">4.8★</div>
            <div className="paragraph_small text-color_secondary">Average Rating</div>
          </ScrollAnimation>
          <ScrollAnimation delay={300}>
            <div className="heading_h2 mb-2">500+</div>
            <div className="paragraph_small text-color_secondary">Companies</div>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Logos */}
      <WebflowSection>
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <div>
            <h3 className="heading_h4 mb-2">Trusted by top US companies</h3>
            <p className="paragraph_small text-color_secondary">
              Leading businesses rely on our platform to simplify cleaning management and ensure quality results. See how we support property managers and teams nationwide.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 opacity-80">
            <LogoBlock />
            <LogoBlock />
            <LogoBlock />
          </div>
        </div>
      </WebflowSection>

      {/* Tabs: Booking, Customer advantages, Role management */}
      <WebflowSection variant="secondary">
        <Tabs defaultValue="booking" className="w-full">
          <TabsList className="grid md:grid-cols-3 w-full">
            <TabsTrigger value="booking">Booking made simple</TabsTrigger>
            <TabsTrigger value="customer">Customer advantages</TabsTrigger>
            <TabsTrigger value="roles">Role management</TabsTrigger>
          </TabsList>
          <TabsContent value="booking" className="mt-8">
            <div className="text-align_center mb-6">
              <h3 className="heading_h2">Fast, mobile-first booking flow</h3>
            </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted relative">
                <Image
                  src="/tsmartcleaning.webflow/images/352ced84-a541-4c36-99c3-c6e27bc3de97.avif"
                  alt="image of cleaning team in action"
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
            <TabsContent value="customer" className="mt-8">
              <div className="text-align_center mb-6">
                <h3 className="heading_h2">Convenient features for every user</h3>
              </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted relative">
                <Image
                  src="/tsmartcleaning.webflow/images/d6989f71-4481-4421-abd6-d68ad5f8ad32.avif"
                  alt="Customer portal"
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
            <TabsContent value="roles" className="mt-8">
              <div className="text-align_center mb-6">
                <h3 className="heading_h2">Access for all team types</h3>
              </div>
              <div className="aspect-[16/9] sm:aspect-[24/10] rounded-xl overflow-hidden bg-muted relative">
                <Image
                  src="/tsmartcleaning.webflow/images/32e6fded-cf63-4632-9931-c029148376c6.avif"
                  alt="Role management"
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </TabsContent>
          </Tabs>
      </WebflowSection>

      {/* Feature cards aligned to roles */}
      <WebflowSection>
        <div className="text-align_center max-w-2xl mx-auto mb-12">
          <p className="paragraph_small text-color_secondary">Platform features for every role</p>
          <h2 className="heading_h2 mt-2">Powerful tools for seamless cleaning</h2>
          <p className="paragraph_large text-color_secondary mt-3">
            Manage bookings, payments, and reports with a unified platform. Designed for customers, providers, and operations—mobile-first and built for efficiency.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ScrollAnimation delay={0}>
            <WebflowCard className="overflow-hidden">
              <div className="aspect-[3/2] relative">
                <Image src="/tsmartcleaning.webflow/images/f1391699-4969-4947-9296-172c397c3c10.avif" alt="Customer portal" fill className="object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="heading_h4 mb-2">Easy online booking</h3>
                <p className="paragraph_small text-color_secondary mb-4">
                  Choose services, extras, and times. See real-time availability and get instant confirmation.
                </p>
                <WebflowButton variant="secondary" href="/customer/book">Book</WebflowButton>
              </div>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard className="overflow-hidden">
              <div className="aspect-[3/2] relative">
                <Image src="/tsmartcleaning.webflow/images/4c820c83-5b85-4c23-9842-bf8d5f377039.avif" alt="Provider portal" fill className="object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="heading_h4 mb-2">Flexible scheduling</h3>
                <p className="paragraph_small text-color_secondary mb-4">
                  Set your availability, sync calendars, and manage job applications from any device.
                </p>
                <WebflowButton variant="secondary" href="/provider">Details</WebflowButton>
              </div>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard className="overflow-hidden">
              <div className="aspect-[3/2] relative">
                <Image src="/tsmartcleaning.webflow/images/a6a55cc7-c2e6-4edb-be65-0e1733ecf1f1.avif" alt="Dispatcher tools" fill className="object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="heading_h4 mb-2">Real-time job board</h3>
                <p className="paragraph_small text-color_secondary mb-4">
                  View open jobs, filter by status, and assign providers with one click.
                </p>
                <WebflowButton variant="secondary" href="/admin/bookings">Browse</WebflowButton>
              </div>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={300}>
            <WebflowCard className="overflow-hidden">
              <div className="aspect-[3/2] relative">
                <Image src="/tsmartcleaning.webflow/images/ac05d457-20c9-44cc-86bf-4cdc773efbba.avif" alt="Reporting" fill className="object-cover" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="heading_h4 mb-2">Automated reporting</h3>
                <p className="paragraph_small text-color_secondary mb-4">
                  Create PDF reports with photos, timesheets, and notes. Share or export securely.
                </p>
                <WebflowButton variant="secondary" href="/admin/reports">Export</WebflowButton>
              </div>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* For Landlords & Property Managers */}
      <WebflowSection id="property-managers">
        <div className="text-align_center max-w-2xl mx-auto mb-10">
          <Badge className="mb-3" variant="secondary">Property Ops</Badge>
          <h2 className="heading_h2">For landlords & property managers</h2>
          <p className="paragraph_large text-color_secondary mt-3">
            Streamline turnovers, standardize quality, and keep every unit on schedule—at scale.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <WebflowCard>
            <h3 className="heading_h5 mb-4">Turnovers & coordination</h3>
            <ul className="space-y-3 paragraph_small">
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
          </WebflowCard>
          <WebflowCard>
            <h3 className="heading_h5 mb-4">Operate at portfolio scale</h3>
            <ul className="space-y-3 paragraph_small">
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
          </WebflowCard>
        </div>
        <div className="text-align_center mt-8">
          <WebflowButton href="/contact">Talk to sales</WebflowButton>
        </div>
      </WebflowSection>

      {/* Enterprise solutions */}
      <WebflowSection id="enterprise" variant="secondary">
        <div className="text-align_center max-w-3xl mx-auto mb-12">
          <Badge className="mb-3" variant="secondary">Enterprise</Badge>
          <h2 className="heading_h2">Enterprise cleaning solutions</h2>
          <p className="paragraph_large text-color_secondary mt-3">
            Built for offices and multi-location operations with corporate billing, SLAs, and dedicated account management.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <WebflowCard>
            <h3 className="heading_h5 mb-4">Contracts & SLAs</h3>
            <ul className="space-y-3 paragraph_small">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Office cleaning contracts</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>SLA guarantees</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>24/7 commercial service</span></li>
            </ul>
          </WebflowCard>
          <WebflowCard>
            <h3 className="heading_h5 mb-4">Scale & integration</h3>
            <ul className="space-y-3 paragraph_small">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Multi-location management</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Facility management integration</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Dedicated account managers</span></li>
            </ul>
          </WebflowCard>
          <WebflowCard>
            <h3 className="heading_h5 mb-4">Commercial pricing</h3>
            <ul className="space-y-3 paragraph_small">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Corporate billing</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>Volume discounts</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /><span>POs, cost centers, Net 30/45</span></li>
            </ul>
          </WebflowCard>
        </div>
        <div className="text-align_center mt-10">
          <div className="button-group">
            <WebflowButton href="/contact">Contact sales</WebflowButton>
            <WebflowButton variant="secondary" href="#pricing">See enterprise pricing</WebflowButton>
          </div>
        </div>
      </WebflowSection>

      {/* Pricing */}
      <WebflowSection id="pricing" variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2">Simple, transparent plans</h2>
          <p className="paragraph_large text-color_secondary mt-2">
            Choose a plan that fits your needs.
          </p>
        </div>
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-6">
          <PriceCard title="Free" price="$0" subtitle="No charge, no contract" features={['Online booking','Standard support','Booking history','Basic cleaning options']} cta="Start free" />
          <PriceCard title="Basic" price="$9" subtitle="Per month" features={['Reschedule anytime','Priority support','Save payment info','Loyalty points']} cta="Choose plan" />
          <PriceCard title="Team" price="$19" subtitle="Per month" features={['Team management','Multi-property tools','Download reports','Custom alerts']} cta="Select plan" />
          <PriceCard title="Business" price="$29" subtitle="Per month" features={['Admin controls','Integrations','Analytics','Onboarding help']} cta="Get plan" />
          <WebflowCard className="flex flex-col justify-between">
            <div>
              <h3 className="heading_h4 mb-2">Enterprise</h3>
              <p className="paragraph_small text-color_secondary">Custom plans for large teams.</p>
            </div>
            <div className="mt-6">
              <WebflowButton className="w-full" href="/contact">Contact</WebflowButton>
            </div>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* CTA band with image */}
      <WebflowSection>
        <div className="text-align_center max-w-3xl mx-auto mb-8">
          <h2 className="heading_h1">Book cleaning in minutes</h2>
          <p className="paragraph_large text-color_secondary mt-3">
            Fast, reliable cleaning for homes and businesses. Schedule your service online and get matched with trusted professionals—no hassle, no waiting.
          </p>
          <div className="mt-6 button-group">
            <WebflowButton href="/customer/book">Get started</WebflowButton>
            <WebflowButton variant="secondary" href="/for-providers">Become a provider</WebflowButton>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden relative aspect-[16/9]">
          <Image
            src="/tsmartcleaning.webflow/images/390d4b90-ab8f-4298-bb01-24aad70695c5.avif"
            alt="Freshly cleaned carpet showing professional cleaning results"
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      </WebflowSection>

      {/* Testimonials Section */}
      <WebflowSection variant="secondary">
        <div className="text-align_center max-w-2xl mx-auto mb-12">
          <h2 className="heading_h2 mb-3">What our customers say</h2>
          <p className="paragraph_large text-color_secondary">
            Real feedback from property managers, business owners, and cleaning professionals who use our platform.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <WebflowCard>
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="paragraph_small text-color_secondary mb-4">
              "Managing multiple properties is easier with this platform. Fast scheduling, transparent pricing, and dedicated support help us deliver consistent results for every unit."
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/tsmartcleaning.webflow/images/1aaf9adb-f0e9-4075-8049-83594a4795ee.avif" />
                <AvatarFallback>JE</AvatarFallback>
              </Avatar>
              <div>
                <div className="paragraph_small font-medium">Jordan Ellis</div>
                <div className="paragraph_small text-color_secondary">Property Manager, Skyline Realty</div>
              </div>
            </div>
          </WebflowCard>
          <WebflowCard>
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="paragraph_small text-color_secondary mb-4">
              "The automated reporting feature saves us hours every week. We can generate professional PDFs with photos and timesheets in seconds, and our clients love the transparency."
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <div>
                <div className="paragraph_small font-medium">Sarah Martinez</div>
                <div className="paragraph_small text-color_secondary">Operations Director, CleanCo Services</div>
              </div>
            </div>
          </WebflowCard>
          <WebflowCard>
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="paragraph_small text-color_secondary mb-4">
              "As a cleaning professional, I love how easy it is to set my availability and get matched with jobs. The mobile app makes everything seamless, and payments are always on time."
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div>
                <div className="paragraph_small font-medium">Maria Rodriguez</div>
                <div className="paragraph_small text-color_secondary">Independent Cleaner</div>
              </div>
            </div>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* Case Studies Section */}
      <WebflowSection>
        <div className="text-align_center max-w-2xl mx-auto mb-12">
          <Badge className="mb-3" variant="secondary">Success Stories</Badge>
          <h2 className="heading_h2 mb-3">Real results from real companies</h2>
          <p className="paragraph_large text-color_secondary">
            See how businesses like yours have transformed their cleaning operations with our platform.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <WebflowCard className="overflow-hidden">
            <div className="aspect-[16/9] bg-muted relative">
              <Image
                src="/tsmartcleaning.webflow/images/7a3b972a-7300-4e52-89de-c27861f06954.avif"
                alt="Property management case study"
                fill
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <Badge variant="outline" className="mb-3">Property Management</Badge>
              <h3 className="heading_h4 mb-2">50% reduction in turnover time</h3>
              <p className="paragraph_small text-color_secondary mb-4">
                A regional property management company with 200+ units reduced their average turnover cleaning time from 5 days to 2.5 days by using our automated scheduling and quality control features.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="heading_h3 text-primary">50%</div>
                  <div className="paragraph_small text-color_secondary">Faster Turnovers</div>
                </div>
                <div>
                  <div className="heading_h3 text-primary">$40K</div>
                  <div className="paragraph_small text-color_secondary">Annual Savings</div>
                </div>
              </div>
              <WebflowButton variant="secondary" href="/contact">Learn more</WebflowButton>
            </div>
          </WebflowCard>
          <WebflowCard className="overflow-hidden">
            <div className="aspect-[16/9] bg-muted relative">
              <Image
                src="/tsmartcleaning.webflow/images/352ced84-a541-4c36-99c3-c6e27bc3de97.avif"
                alt="Enterprise case study"
                fill
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <Badge variant="outline" className="mb-3">Enterprise</Badge>
              <h3 className="heading_h4 mb-2">Scaling to 15 locations seamlessly</h3>
              <p className="paragraph_small text-color_secondary mb-4">
                A national office cleaning company expanded from 3 to 15 locations in 8 months using our multi-location management tools, standardized quality processes, and dedicated account management.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="heading_h3 text-primary">5x</div>
                  <div className="paragraph_small text-color_secondary">Growth</div>
                </div>
                <div>
                  <div className="heading_h3 text-primary">95%</div>
                  <div className="paragraph_small text-color_secondary">Client Retention</div>
                </div>
              </div>
              <WebflowButton variant="secondary" href="/contact">Learn more</WebflowButton>
            </div>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* Benefits Section */}
      <WebflowSection variant="secondary">
        <div className="text-align_center max-w-2xl mx-auto mb-12">
          <h2 className="heading_h2 mb-3">Why choose our platform</h2>
          <p className="paragraph_large text-color_secondary">
            Built for the modern cleaning industry with features that matter.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Pre-vetted professionals</h3>
            <p className="paragraph_small text-color_secondary">
              All cleaners are background-checked, trained, and verified. We connect you with qualified professionals you can trust.
            </p>
          </WebflowCard>
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Save time on operations</h3>
            <p className="paragraph_small text-color_secondary">
              Automate scheduling, reporting, and payments. Focus on growing your business while we handle the operational overhead.
            </p>
          </WebflowCard>
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Scale with confidence</h3>
            <p className="paragraph_small text-color_secondary">
              From single properties to enterprise portfolios, our platform grows with you. Multi-location management and dedicated support included.
            </p>
          </WebflowCard>
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Insurance & compliance</h3>
            <p className="paragraph_small text-color_secondary">
              Built-in insurance options and compliance tools ensure you're protected and meet all regulatory requirements.
            </p>
          </WebflowCard>
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Quality guaranteed</h3>
            <p className="paragraph_small text-color_secondary">
              Our quality control system includes photo verification, inspection reports, and customer feedback to ensure consistent results.
            </p>
          </WebflowCard>
          <WebflowCard>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <h3 className="heading_h5 mb-2">Easy integration</h3>
            <p className="paragraph_small text-color_secondary">
              Connect with property management software, accounting systems, and other tools you already use. APIs available for custom integrations.
            </p>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* CTA Section - Mid Page */}
      <WebflowSection variant="inverse">
        <div className="text-align_center max-w-2xl mx-auto">
          <h2 className="heading_h2 mb-4 on-inverse">Ready to transform your cleaning operations?</h2>
          <p className="paragraph_large mb-6 text-color_inverse-secondary">
            Join hundreds of companies already using our platform to streamline their cleaning management.
          </p>
          <div className="button-group">
            <WebflowButton variant="secondary" href="/contact">Schedule a demo</WebflowButton>
            <WebflowButton variant="secondary" href="/customer/book">Start booking</WebflowButton>
          </div>
        </div>
      </WebflowSection>

      {/* FAQ */}
      <WebflowSection id="faq">
        <div className="text-align_center mb-10">
          <h2 className="heading_h2">Frequently asked questions</h2>
          <p className="paragraph_large text-color_secondary mt-2">Quick answers about booking, service, and support.</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="divide-y rounded-lg border bg-background">
            <FaqItem q="How can I schedule a cleaning?" a="Book online by choosing your service, selecting a date, and confirming your details. Our team will take care of the rest." />
            <FaqItem q="Which locations do you cover?" a="We serve multiple US cities. Enter your zip code during booking to check if we operate in your area." />
            <FaqItem q="Is rescheduling or cancellation possible?" a="You can reschedule or cancel through your account dashboard. Please review our policy for details on timing and fees." />
            <FaqItem q="Who provides the cleaning services?" a="Our professionals are background-checked, trained, and experienced. We work with both employees and vetted freelancers." />
          </div>
        </div>
      </WebflowSection>

      {/* Final CTA Section */}
      <WebflowSection>
        <WebflowCard className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-2">
          <div className="text-align_center max-w-2xl mx-auto">
            <h2 className="heading_h2 mb-4">Start your free trial today</h2>
            <p className="paragraph_large text-color_secondary mb-6">
              No credit card required. Get started in minutes and see how our platform can transform your cleaning operations.
            </p>
            <div className="button-group">
              <WebflowButton href="/signup">Sign up free</WebflowButton>
              <WebflowButton variant="secondary" href="/contact">Talk to sales</WebflowButton>
            </div>
            <p className="paragraph_small text-color_secondary mt-4">
              14-day free trial • Cancel anytime • No setup fees
            </p>
          </div>
        </WebflowCard>
      </WebflowSection>

      {/* Contact */}
      <WebflowSection id="contact" variant="secondary">
        <div className="mb-10">
          <p className="paragraph_small text-color_secondary">Get in touch</p>
          <h2 className="heading_h2">Contact our team today</h2>
          <p className="paragraph_large text-color_secondary">We&apos;re here to answer your questions.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <ContactCard title="Email" desc="Message us for quick support." href="#" label="email@website.com" />
          <ContactCard title="Phone" desc="Call us Mon–Fri, 8am–5pm." href="#" label="+1 (555) 000-0000" />
          <ContactCard title="Office" desc="Visit us during office hours." href="#" label="101 Web Lane, SF, CA" />
          <ContactCard title="Storefront" desc="Walk in for assistance." href="#" label="101 Web Lane, SF, CA" />
        </div>
      </WebflowSection>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <BrandLogoClient />
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
    <WebflowCard className="flex flex-col">
      <div className="mb-4">
        <h4 className="heading_h4">{props.title}</h4>
        <div className="mt-2">
          <span className="heading_h2">{props.price}</span>
          {props.subtitle && <span className="paragraph_small text-color_secondary ml-1">{props.subtitle}</span>}
        </div>
      </div>
      <ul className="space-y-2 mb-6">
        {props.features.map((f) => (
          <li key={f} className="flex items-center gap-2 paragraph_small">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <WebflowButton className="mt-auto w-full" href="/signup">{props.cta}</WebflowButton>
    </WebflowCard>
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
    <WebflowCard>
      <h4 className="heading_h5 mb-1">{title}</h4>
      <p className="paragraph_small text-color_secondary mb-3">{desc}</p>
      <Link href={href} className="text-link hover:underline">{label}</Link>
    </WebflowCard>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="text-sm text-muted-foreground">
      <Link href={href} className="hover:text-foreground transition-colors">{children}</Link>
    </div>
  )
}

