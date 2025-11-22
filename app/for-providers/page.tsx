import Link from 'next/link'
import { WebflowSection, WebflowButton, WebflowCard, ScrollAnimation } from '@/components/webflow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DollarSign, Calendar, TrendingUp, Shield, Users, CheckCircle2, ArrowRight, Star, Award, Clock, MapPin, CreditCard, MessageSquare, BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateServiceSchema, generateFAQSchema } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const metadata: Metadata = generateSEOMetadata({
  title: 'For Providers — Join tSmartCleaning and Grow Your Cleaning Business',
  description: 'Join 2,500+ successful cleaning providers. Keep 85% of every booking, set your own rates, and access thousands of customers. Start earning today.',
  path: '/for-providers',
  keywords: ['become a cleaner', 'cleaning provider', 'join as provider', 'cleaning business', 'cleaning jobs', 'provider signup'],
})

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'For Providers', url: '/for-providers' },
          ]),
          generateServiceSchema({
            name: 'Cleaning Provider Platform',
            description: 'Join tSmartCleaning as a cleaning provider. Set your own rates, keep 85% of every booking, and access thousands of customers.',
            serviceType: 'Cleaning Service Provider Platform',
          }),
          generateFAQSchema([
            {
              question: 'How much do I get paid?',
              answer: 'You keep 85% of every booking. For example, if a customer pays $200, you earn $170. There are no upfront costs or monthly fees. The platform fee covers payment processing, insurance, customer support, and marketing.',
            },
            {
              question: 'When do I get paid?',
              answer: 'We process payouts weekly via direct deposit. Payments are typically available in your account every Tuesday. There\'s a minimum payout threshold of $25.',
            },
            {
              question: 'Can I set my own rates?',
              answer: 'Yes! You have full control over your pricing. Set rates that work for your experience level and market. You can adjust your rates at any time in your provider dashboard.',
            },
            {
              question: 'How quickly can I start getting bookings?',
              answer: 'After completing your profile and background check (typically 24-48 hours), you can start receiving booking requests immediately. Most providers get their first booking within the first week.',
            },
            {
              question: 'Do I need insurance?',
              answer: 'No, you don\'t need your own insurance. All services booked through TSmartCleaning are covered by our comprehensive insurance policy. This is included at no additional cost to you.',
            },
            {
              question: 'Can I work part-time or full-time?',
              answer: 'Absolutely! You have complete flexibility. Set your availability to match your schedule. Many providers start part-time and transition to full-time as their business grows.',
            },
            {
              question: 'What areas do you serve?',
              answer: 'We\'re expanding across the United States. During signup, you can see if we\'re operating in your area. If not, you can join our waitlist to be notified when we launch in your city.',
            },
            {
              question: 'What if I need to cancel a booking?',
              answer: 'You can cancel bookings through your dashboard. We understand that emergencies happen. However, frequent cancellations may affect your provider rating, so we recommend canceling only when necessary.',
            },
          ]),
        ]}
      />

      {/* Hero Section */}
      <WebflowSection variant="default" className="padding_none">
        <div className="text-align_center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Join 2,500+ Successful Providers
          </div>
          <h1 className="heading_h1 mb-6">
            Grow Your Cleaning Business with TSmartCleaning
          </h1>
          <p className="paragraph_large text-color_secondary mb-8">
            Connect with thousands of customers, manage your bookings effortlessly, and increase your revenue with our trusted platform.
          </p>
          <div className="button-group">
            <WebflowButton href="/provider-signup">
              Start Earning Today <ArrowRight className="ml-2 h-4 w-4" />
            </WebflowButton>
            <WebflowButton variant="secondary" href="/contact">Talk to Sales</WebflowButton>
          </div>
        </div>
      </WebflowSection>

      {/* Enhanced Benefits */}
      <WebflowSection>
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Why Join TSmartCleaning?</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Everything you need to build and scale your cleaning business
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <DollarSign className="h-10 w-10 text-primary mb-4" />
              <h3 className="heading_h4 mb-2">Earn More</h3>
              <p className="paragraph_small text-color_secondary mb-4">
                Set your own rates and keep 85% of every booking. No hidden fees or surprises.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Weekly payouts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Transparent pricing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Bonus opportunities</span>
                </li>
              </ul>
            </WebflowCard>
          </ScrollAnimation>

          <ScrollAnimation delay={100}>
            <WebflowCard>
              <Calendar className="h-10 w-10 text-primary mb-4" />
              <h3 className="heading_h4 mb-2">Flexible Schedule</h3>
              <p className="paragraph_small text-color_secondary mb-4">
                Work when you want. Set your availability and accept bookings that fit your schedule.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Set your own hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Choose your service area</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Accept or decline jobs</span>
                </li>
              </ul>
            </WebflowCard>
          </ScrollAnimation>

          <ScrollAnimation delay={200}>
            <WebflowCard>
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <h3 className="heading_h4 mb-2">Grow Your Business</h3>
              <p className="paragraph_small text-color_secondary mb-4">
                Access thousands of customers actively looking for cleaning services in your area.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Steady stream of customers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Build your reputation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="paragraph_small text-color_secondary">Marketing support</span>
                </li>
              </ul>
            </WebflowCard>
          </ScrollAnimation>
        </div>

        {/* Additional Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Insurance & Protection</h3>
              <p className="paragraph_small text-color_secondary">
                Comprehensive insurance coverage for all services. Work with confidence knowing you're protected.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Fast Payments</h3>
              <p className="paragraph_small text-color_secondary">
                Get paid weekly via direct deposit. No waiting, no delays. Your earnings are processed automatically.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Choose Your Area</h3>
              <p className="paragraph_small text-color_secondary">
                Work in neighborhoods you know. Set your service radius and only accept jobs in your preferred areas.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Direct Communication</h3>
              <p className="paragraph_small text-color_secondary">
                Chat directly with customers through our secure messaging system. Coordinate details and build relationships.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Performance Insights</h3>
              <p className="paragraph_small text-color_secondary">
                Track your earnings, ratings, and booking trends. Use data to optimize your schedule and maximize income.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="heading_h5 mb-2">Build Your Reputation</h3>
              <p className="paragraph_small text-color_secondary">
                Earn reviews and ratings from satisfied customers. Top-rated providers get priority access to premium bookings.
              </p>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* How It Works */}
      <WebflowSection variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Getting Started Is Easy</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            From signup to your first booking in just 3 steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ScrollAnimation delay={0} className="text-align_center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="heading_h4 mb-2">Sign Up & Verify</h3>
            <p className="paragraph_small text-color_secondary">
              Create your profile, complete background check, and get verified within 24-48 hours.
            </p>
          </ScrollAnimation>
          <ScrollAnimation delay={100} className="text-align_center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="heading_h4 mb-2">Set Your Availability</h3>
            <p className="paragraph_small text-color_secondary">
              Choose your service area, set your rates, and define when you're available to work.
            </p>
          </ScrollAnimation>
          <ScrollAnimation delay={200} className="text-align_center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="heading_h4 mb-2">Start Getting Bookings</h3>
            <p className="paragraph_small text-color_secondary">
              Receive booking requests, accept jobs, and start earning with full platform support.
            </p>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Pricing Information */}
      <WebflowSection variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Simple, Transparent Pricing</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Keep more of what you earn with our straightforward fee structure
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <WebflowCard className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="heading_h1 text-primary mb-2">85%</div>
                <p className="heading_h3 mb-4">You Keep</p>
                <p className="paragraph_small text-color_secondary mb-6">
                  Set your own rates and keep 85% of every booking. The platform fee covers payment processing, insurance, customer support, and marketing.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="paragraph_small font-medium">No upfront costs</div>
                      <div className="paragraph_small text-color_secondary">Free to join, no monthly fees</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="paragraph_small font-medium">Weekly payouts</div>
                      <div className="paragraph_small text-color_secondary">Get paid every week via direct deposit</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="paragraph_small font-medium">Transparent fees</div>
                      <div className="paragraph_small text-color_secondary">See exactly what you'll earn before accepting</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="heading_h5 mb-4">Example Earnings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="paragraph_small text-color_secondary">Booking Total</span>
                    <span className="paragraph_small font-medium">$200.00</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="paragraph_small text-color_secondary">Platform Fee (15%)</span>
                    <span className="paragraph_small text-color_secondary">-$30.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="paragraph_small font-medium">Your Earnings</span>
                    <span className="heading_h4 text-primary">$170.00</span>
                  </div>
                </div>
                <p className="paragraph_small text-color_secondary mt-4">
                  * Processing fees may apply. Minimum payout threshold: $25
                </p>
              </div>
            </div>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* Success Stories */}
      <WebflowSection>
        <div className="text-align_center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            Success Stories
          </div>
          <h2 className="heading_h2 mb-4">Real Providers, Real Results</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            See how cleaning professionals are growing their businesses with TSmartCleaning
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="paragraph_small text-color_secondary mb-4">
                "I've been using TSmartCleaning for 8 months and my income has doubled. The platform makes it so easy to find customers and manage bookings. I love setting my own rates and keeping 85% of every job."
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <div>
                  <div className="paragraph_small font-medium">Maria Rodriguez</div>
                  <div className="paragraph_small text-color_secondary">Independent Cleaner, Los Angeles</div>
                  <div className="paragraph_small text-color_secondary mt-1">$4,200/month average</div>
                </div>
              </div>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="paragraph_small text-color_secondary mb-4">
                "The weekly payouts are a game-changer. I used to wait weeks for payment from other platforms. Now I get paid every Tuesday like clockwork. The customer support is also excellent."
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="paragraph_small font-medium">James Smith</div>
                  <div className="paragraph_small text-color_secondary">Cleaning Team Lead, Chicago</div>
                  <div className="paragraph_small text-color_secondary mt-1">$6,500/month average</div>
                </div>
              </div>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="paragraph_small text-color_secondary mb-4">
                "I started part-time and now I'm full-time thanks to TSmartCleaning. The steady stream of bookings and flexible schedule let me build my business at my own pace. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>LC</AvatarFallback>
                </Avatar>
                <div>
                  <div className="paragraph_small font-medium">Lisa Chen</div>
                  <div className="paragraph_small text-color_secondary">Full-Time Cleaner, New York</div>
                  <div className="paragraph_small text-color_secondary mt-1">$5,800/month average</div>
                </div>
              </div>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Features */}
      <WebflowSection variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Provider Tools & Support</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Everything you need to succeed
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Insurance Coverage</h3>
              <p className="paragraph_small text-color_secondary">
                All services are covered by our comprehensive insurance policy for your protection and peace of mind.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">24/7 Support</h3>
              <p className="paragraph_small text-color_secondary">
                Our dedicated provider support team is always available to help you with any questions or issues.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <Calendar className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Smart Scheduling</h3>
              <p className="paragraph_small text-color_secondary">
                Intuitive calendar and booking management system helps you optimize your schedule and maximize earnings.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Business Analytics</h3>
              <p className="paragraph_small text-color_secondary">
                Track your earnings, review performance metrics, and get insights to grow your business.
              </p>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* FAQ Section */}
      <WebflowSection>
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Frequently Asked Questions</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Everything you need to know about becoming a provider
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="divide-y rounded-lg border bg-background">
            <FaqItem 
              q="How much do I get paid?" 
              a="You keep 85% of every booking. For example, if a customer pays $200, you earn $170. There are no upfront costs or monthly fees. The platform fee covers payment processing, insurance, customer support, and marketing." 
            />
            <FaqItem 
              q="When do I get paid?" 
              a="We process payouts weekly via direct deposit. Payments are typically available in your account every Tuesday. There's a minimum payout threshold of $25." 
            />
            <FaqItem 
              q="Can I set my own rates?" 
              a="Yes! You have full control over your pricing. Set rates that work for your experience level and market. You can adjust your rates at any time in your provider dashboard." 
            />
            <FaqItem 
              q="How quickly can I start getting bookings?" 
              a="After completing your profile and background check (typically 24-48 hours), you can start receiving booking requests immediately. Most providers get their first booking within the first week." 
            />
            <FaqItem 
              q="Do I need insurance?" 
              a="No, you don't need your own insurance. All services booked through TSmartCleaning are covered by our comprehensive insurance policy. This is included at no additional cost to you." 
            />
            <FaqItem 
              q="Can I work part-time or full-time?" 
              a="Absolutely! You have complete flexibility. Set your availability to match your schedule. Many providers start part-time and transition to full-time as their business grows." 
            />
            <FaqItem 
              q="What areas do you serve?" 
              a="We're expanding across the United States. During signup, you can see if we're operating in your area. If not, you can join our waitlist to be notified when we launch in your city." 
            />
            <FaqItem 
              q="What if I need to cancel a booking?" 
              a="You can cancel bookings through your dashboard. We understand that emergencies happen. However, frequent cancellations may affect your provider rating, so we recommend canceling only when necessary." 
            />
          </div>
        </div>
      </WebflowSection>

      {/* Enhanced CTA */}
      <WebflowSection variant="inverse">
        <div className="text-align_center">
          <h2 className="heading_h2 mb-4 on-inverse">Ready to Start Earning?</h2>
          <p className="paragraph_large mb-8 text-color_inverse-secondary max-w-2xl mx-auto">
            Join thousands of successful cleaning professionals on TSmartCleaning today. Get started in minutes and receive your first booking within days.
          </p>
          <div className="button-group mb-6">
            <WebflowButton variant="secondary" href="/provider-signup">
              Sign Up as Provider <ArrowRight className="ml-2 h-4 w-4" />
            </WebflowButton>
            <WebflowButton variant="secondary" href="/contact">Talk to Sales</WebflowButton>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 paragraph_small text-color_inverse-secondary opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>No monthly fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Keep 85% of earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Weekly payouts</span>
            </div>
          </div>
        </div>
      </WebflowSection>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-align_center paragraph_small text-color_secondary">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-4">
      <summary className="cursor-pointer list-none flex items-center justify-between">
        <span className="paragraph_small font-medium">{q}</span>
        <span className="text-color_secondary transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="pt-3 paragraph_small text-color_secondary">{a}</div>
    </details>
  )
}

