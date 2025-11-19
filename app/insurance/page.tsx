"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, ShieldCheck, Calculator, Compare, Check, X } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'

export default function InsurancePage() {
  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Insurance', url: '/insurance' },
          ]),
          generateServiceSchema({
            name: 'CleanGuard Protection',
            description: 'Comprehensive insurance coverage for cleaning services with up to $100K property damage protection, theft coverage, and liability protection.',
            provider: {
              name: 'tSmartCleaning',
              url: 'https://tsmartcleaning.com',
            },
            areaServed: 'US',
            serviceType: 'Insurance Service',
          }),
        ]}
      />
      <div className="min-h-screen">

      {/* HERO */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-3">
              <ShieldCheck className="h-4 w-4" /> CleanGuard Protection
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Clean with Complete Confidence</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Comprehensive insurance for your home, belongings, and peace of mind. Available exclusively for annual members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild><Link href="#pricing">See Protection Plans</Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="/customer">Already a member? Add Insurance</Link></Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
              <ValueProp icon="🛡️" title="Up to $100K" subtitle="Coverage" />
              <ValueProp icon="⚡" title="Zero Hassle" subtitle="Claims" />
              <ValueProp icon="✅" title="Same-Day" subtitle="Response" />
            </div>
          </div>
          <div className="w-full">
            <div className="aspect-[3/2] rounded-xl bg-muted overflow-hidden relative">
              <Image
                src="/tsmartcleaning.webflow/images/390d4b90-ab8f-4298-bb01-24aad70695c5.avif"
                alt="Protected cleaning"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHO */}
      <section id="who" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">Is CleanGuard Protection Right for You?</h2>
            <p className="text-muted-foreground mt-3">Perfect for annual members on fixed weekly schedules.</p>
          </div>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'You have an annual membership',
              'You have valuable belongings or antiques',
              'You have recurring service (1x+ per week)',
              'You want complete peace of mind',
              'You value protection over saving pennies',
              'You have irreplaceable items in your home',
            ].map((t) => (
              <Card key={t} className="p-4 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </Card>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg border bg-secondary/40 text-sm">
            <strong>Required:</strong> Annual membership with fixed weekly service schedule. Plan guidance:
            <div className="mt-2 grid sm:grid-cols-3 gap-2">
              <div className="text-xs text-muted-foreground bg-background rounded p-2 border">1x/week: Basic or Premium</div>
              <div className="text-xs text-muted-foreground bg-background rounded p-2 border">2x/week: Premium or Ultimate</div>
              <div className="text-xs text-muted-foreground bg-background rounded p-2 border">3x+/week: Premium or Ultimate (recommended)</div>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section id="coverage" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Comprehensive Protection, Clearly Explained</h2>
            <p className="text-muted-foreground mt-2">Eight categories of coverage tailored for cleaning scenarios.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <CoverageCard title="Property Damage Protection" emoji="🏠" bullets={[
              'Accidental damage to furniture, floors, walls',
              'Damage to fixtures and appliances',
              'Breakage of decorative items',
            ]} limits={[ 'Basic: Up to $5,000', 'Premium: Up to $25,000', 'Ultimate: Up to $100,000' ]} />
            <CoverageCard title="Theft & Loss Protection" emoji="🔐" bullets={[
              'Theft by staff; mysterious disappearance',
              'Identity theft; unauthorized access',
            ]} limits={[ 'Premium: Up to $10,000/yr', 'Ultimate: Up to $50,000/yr' ]} />
            <CoverageCard title="Extended Liability" emoji="💼" bullets={[
              'Bodily injury; third‑party liability',
              'Legal defense; medical payments',
            ]} limits={[ 'Basic: $50,000', 'Premium: $500,000', 'Ultimate: $2,000,000' ]} />
            <CoverageCard title="Key Replacement & Re‑keying" emoji="🔑" bullets={[
              'Lost keys; re‑keying; smart lock reprogramming',
            ]} limits={[ 'Basic: $200/incident', 'Premium: $500 + 1 re‑key/yr', 'Ultimate: $1,000 + 2 re‑keys/yr' ]} />
            <CoverageCard title="Cancellation Protection" emoji="📅" bullets={[
              'Emergency replacement; no‑show protection',
            ]} limits={[ 'Premium: 48h replacement', 'Ultimate: Same‑day replacement' ]} />
            <CoverageCard title="Service Guarantee Enhancement" emoji="⭐" bullets={[
              'Extended satisfaction guarantee; priority support',
            ]} limits={[ 'Basic: 24h', 'Premium: 48h', 'Ultimate: 72h + manager' ]} />
            <CoverageCard title="Emergency Cleaning Coverage" emoji="🚨" bullets={[
              'Unexpected emergencies; post‑incident cleaning',
            ]} limits={[ 'Premium: 1 per year', 'Ultimate: 4 per year' ]} />
            <CoverageCard title="High‑Value Item Registry" emoji="💎" bullets={[
              'Register up to 20 items; photo documentation',
            ]} limits={[ 'Ultimate only' ]} />
          </div>
        </div>
      </section>

      {/* PRICING CALCULATOR */}
      <section id="calculator" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-2">
              <Calculator className="h-8 w-8" /> Pricing Calculator
            </h2>
            <p className="text-muted-foreground mt-2">Calculate your savings with annual billing</p>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* PLAN COMPARISON TABLE */}
      <section id="comparison" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-2">
              <Compare className="h-8 w-8" /> Compare All Plans
            </h2>
            <p className="text-muted-foreground mt-2">Side-by-side comparison of all coverage options</p>
          </div>
          <PlanComparisonTable />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Level of Protection</h2>
            <p className="text-muted-foreground mt-2">All plans include basic damage coverage. Upgrade for complete peace of mind.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="#comparison">View Detailed Comparison Table</Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <PriceTier planCode="basic" title="Basic" emoji="🛡️" monthly="$9.99/mo" annual="$95.90/yr" rows={[
              ['Property Damage', 'Up to $5K'],
              ['Theft Protection', '✗'],
              ['Liability', '$50K'],
              ['Key Coverage', '$200'],
              ['Cancellation', '✗'],
              ['Emergency Cleans', '✗'],
              ['Deductible', '$100'],
            ]} cta="Select Basic" />
            <PriceTier planCode="premium" title="Premium" emoji="🏆" badge="MOST POPULAR" monthly="$19.99/mo" annual="$191.90/yr" rows={[
              ['Property Damage', 'Up to $25K'],
              ['Theft Protection', 'Up to $10K'],
              ['Liability', '$500K'],
              ['Key Coverage', '$500 + 1 re‑key'],
              ['Cancellation', '48h guarantee'],
              ['Emergency Cleans', '1 per year'],
              ['Deductible', '$50'],
            ]} cta="Select Premium" highlight />
            <PriceTier planCode="ultimate" title="Ultimate" emoji="💎" monthly="$34.99/mo" annual="$335.90/yr" rows={[
              ['Property Damage', 'Up to $100K'],
              ['Theft Protection', 'Up to $50K'],
              ['Liability', '$2M'],
              ['Key Coverage', '$1K + 2 re‑keys'],
              ['Cancellation', 'Same‑day'],
              ['Emergency Cleans', '4 per year'],
              ['Deductible', '$0'],
            ]} cta="Select Ultimate" />
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4 space-y-1">
            <div>All plans require active annual cleaning membership.</div>
            <div>30‑day money‑back guarantee. Cancel anytime; prorated refund available.</div>
          </div>
        </div>
      </section>

      {/* CLAIMS */}
      <section id="claims" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Filing a Claim is Simple and Fast</h2>
            <p className="text-muted-foreground mt-2">Report, document, review, resolve — most within days.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              ['Report Incident', 'Call hotline or submit online — 24/7. Response within 2 hours.'],
              ['Document', 'Upload photos, receipts, and details.'],
              ['Review', 'Adjuster assigned; typically 3–7 business days.'],
              ['Resolution', 'Direct deposit or repair arranged.'],
            ].map(([t, d]) => (
              <Card key={t} className="p-5">
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-muted-foreground mt-2">{d}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">What Our Members Say</h2>
            <p className="text-muted-foreground mt-2">Real experiences from satisfied customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Testimonial quote="Ultimate Plan is worth every penny — claim approved same day." author="Jennifer K., Toronto" detail="$3,800 antique mirror" />
            <Testimonial quote="Premium covered full re‑keying — saved us $600 and stress." author="Michael R., Los Angeles" detail="Key replacement" />
            <Testimonial quote="Claims process was smooth and serious — fully compensated." author="Sarah M., Vancouver" detail="$8,000 jewelry theft" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="divide-y rounded-lg border bg-background">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span className="font-medium">{f.q}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="pt-3 text-sm text-muted-foreground">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold">Ready for Complete Protection?</h2>
          <p className="text-muted-foreground mt-3">Join 10,000+ members who clean with confidence.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild><Link href="/signup">Get Annual Membership + Insurance</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="#pricing">Add Insurance to My Account</Link></Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Questions? Call 1‑800‑XXX‑XXXX (Mon–Fri 8AM–8PM EST)</div>
        </div>
      </section>
      </div>
    </>
  )
}

function ValueProp({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-2xl">{icon}</div>
      <div className="font-semibold mt-1">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  )
}

function CoverageCard({
  title,
  emoji,
  bullets,
  limits,
}: {
  title: string
  emoji: string
  bullets: string[]
  limits: string[]
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{emoji} {title}</h3>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {bullets.map((b) => <li key={b}>• {b}</li>)}
      </ul>
      <div className="mt-4 text-sm">
        <span className="font-medium">Coverage:</span> {limits.join(' · ')}
      </div>
    </Card>
  )
}

function PriceTier({
  planCode,
  title,
  emoji,
  badge,
  monthly,
  annual,
  rows,
  cta,
  highlight,
}: {
  planCode: string
  title: string
  emoji: string
  badge?: string
  monthly: string
  annual: string
  rows: [string, string][]
  cta: string
  highlight?: boolean
}) {
  return (
    <Card className={`p-6 flex flex-col ${highlight ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{emoji} {title}</h3>
        {badge && <span className="text-[10px] px-2 py-1 rounded-full bg-primary text-primary-foreground">{badge}</span>}
      </div>
      <div className="mt-3 text-muted-foreground text-sm">Monthly: <span className="text-foreground font-medium">{monthly}</span></div>
      <div className="text-muted-foreground text-sm">Annual (Save 20%): <span className="text-foreground font-medium">{annual}</span></div>
      <div className="mt-4 border-t pt-4">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b last:border-b-0">
                <td className="py-2 text-muted-foreground">{k}</td>
                <td className="py-2 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PlanSelectionDialog planCode={planCode} planName={title} monthly={monthly} annual={annual}>
        <Button className="mt-6 w-full">{cta}</Button>
      </PlanSelectionDialog>
    </Card>
  )
}

function Testimonial({ quote, author, detail }: { quote: string; author: string; detail: string }) {
  return (
    <Card className="p-6">
      <div className="text-lg">“{quote}”</div>
      <div className="mt-3 text-sm text-muted-foreground">{author}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </Card>
  )
}

const FAQ = [
  { q: 'Do I need this if you already have insurance?', a: 'Standard service includes basic coverage, but CleanGuard adds higher limits, theft coverage, key replacement, emergency services, and faster claims.' },
  { q: 'Can I add insurance after I start my membership?', a: 'Yes. Existing annual members can add protection anytime. Coverage begins upon approval and payment.' },
  { q: 'What if I cancel my cleaning membership?', a: 'Insurance is valid with active service. If you cancel, your policy is prorated and refunded for the unused portion.' },
  { q: 'Are there exclusions?', a: 'We don\'t cover intentional damage, normal wear and tear, pre-existing damage, or items over plan thresholds unless registered.' },
  { q: 'How many claims per year?', a: 'No hard limit; coverage limits apply per incident and annually for theft.' },
  { q: 'What\'s the deductible?', a: 'Basic $100 · Premium $50 · Ultimate $0.' },
  { q: 'Can I change plans?', a: 'Upgrade anytime (pay difference) or change at renewal.' },
]

// Pricing Calculator Component
function PricingCalculator() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'ultimate'>('premium')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  
  const plans = {
    basic: { monthly: 9.99, annual: 95.90 },
    premium: { monthly: 19.99, annual: 191.90 },
    ultimate: { monthly: 34.99, annual: 335.90 },
  }
  
  const selectedPrice = plans[selectedPlan][billingCycle]
  const monthlyEquivalent = billingCycle === 'annual' ? selectedPrice / 12 : selectedPrice
  const annualTotal = billingCycle === 'annual' ? selectedPrice : plans[selectedPlan].monthly * 12
  const savings = billingCycle === 'annual' ? (plans[selectedPlan].monthly * 12) - selectedPrice : 0
  
  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Plan</label>
          <div className="grid grid-cols-3 gap-2">
            {(['basic', 'premium', 'ultimate'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedPlan === plan
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Billing Cycle</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Price per {billingCycle === 'monthly' ? 'month' : 'year'}</span>
            <span className="text-2xl font-bold">${selectedPrice.toFixed(2)}</span>
          </div>
          {billingCycle === 'annual' && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Monthly equivalent</span>
                <span className="font-medium">${monthlyEquivalent.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>You save</span>
                <span className="font-bold">${savings.toFixed(2)}/year</span>
              </div>
            </>
          )}
          {billingCycle === 'monthly' && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Annual total</span>
              <span className="font-medium">${annualTotal.toFixed(2)}/year</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Plan Comparison Table Component
function PlanComparisonTable() {
  const comparisonData = [
    { feature: 'Property Damage Coverage', basic: '$5,000', premium: '$25,000', ultimate: '$100,000' },
    { feature: 'Theft & Loss Protection', basic: '✗', premium: '$10,000/yr', ultimate: '$50,000/yr' },
    { feature: 'Liability Coverage', basic: '$50,000', premium: '$500,000', ultimate: '$2,000,000' },
    { feature: 'Key Replacement', basic: '$200/incident', premium: '$500 + 1 re-key/yr', ultimate: '$1,000 + 2 re-keys/yr' },
    { feature: 'Cancellation Protection', basic: '✗', premium: '48h replacement', ultimate: 'Same-day replacement' },
    { feature: 'Service Guarantee', basic: '24h', premium: '48h', ultimate: '72h + manager' },
    { feature: 'Emergency Cleaning', basic: '✗', premium: '1 per year', ultimate: '4 per year' },
    { feature: 'High-Value Item Registry', basic: '✗', premium: '✗', ultimate: 'Up to 20 items' },
    { feature: 'Deductible', basic: '$100', premium: '$50', ultimate: '$0' },
    { feature: 'Monthly Price', basic: '$9.99', premium: '$19.99', ultimate: '$34.99' },
    { feature: 'Annual Price', basic: '$95.90', premium: '$191.90', ultimate: '$335.90' },
  ]
  
  return (
    <Card className="p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold">Feature</th>
            <th className="text-center py-3 px-4 font-semibold">Basic 🛡️</th>
            <th className="text-center py-3 px-4 font-semibold">Premium 🏆</th>
            <th className="text-center py-3 px-4 font-semibold">Ultimate 💎</th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((row, idx) => (
            <tr key={idx} className="border-b last:border-b-0">
              <td className="py-3 px-4 text-muted-foreground">{row.feature}</td>
              <td className="py-3 px-4 text-center">{row.basic}</td>
              <td className="py-3 px-4 text-center font-medium">{row.premium}</td>
              <td className="py-3 px-4 text-center font-medium">{row.ultimate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// Plan Selection Dialog Component
function PlanSelectionDialog({
  planCode,
  planName,
  monthly,
  annual,
  children,
}: {
  planCode: string
  planName: string
  monthly: string
  annual: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null)
    })
  }, [])
  
  const handleSelect = async () => {
    if (!userId) {
      window.location.href = `/signup?redirect=/insurance&plan=${planCode}`
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/insurance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_code: planCode,
          billing_cycle: billingCycle,
        }),
      })
      
      if (response.ok) {
        window.location.href = '/customer/insurance'
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to select plan. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select {planName} Plan</DialogTitle>
          <DialogDescription>
            Choose your billing cycle and complete your selection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                Monthly
                <div className="text-xs text-muted-foreground mt-1">{monthly}</div>
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                Annual
                <div className="text-xs text-muted-foreground mt-1">{annual}</div>
                <div className="text-xs text-green-600 mt-1">Save 20%</div>
              </button>
            </div>
          </div>
          
          {!userId && (
            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              You'll need to sign up or log in to complete your selection.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : userId ? 'Confirm Selection' : 'Sign Up to Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


