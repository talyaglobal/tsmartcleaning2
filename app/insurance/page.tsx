"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, ShieldCheck, Calculator, GitCompare, Check, X } from 'lucide-react'
import { WebflowSection, WebflowButton, WebflowCard } from '@/components/webflow'
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
      <WebflowSection variant="secondary" className="padding_none">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 paragraph_small text-primary font-medium mb-3">
              <ShieldCheck className="h-4 w-4" /> CleanGuard Protection
            </div>
            <h1 className="heading_h1 mb-6">Clean with Complete Confidence</h1>
            <p className="paragraph_large text-color_secondary mb-8">
              Comprehensive insurance for your home, belongings, and peace of mind. Available exclusively for annual members.
            </p>
            <div className="button-group">
              <WebflowButton href="#pricing">See Protection Plans</WebflowButton>
              <WebflowButton variant="secondary" href="/customer">Already a member? Add Insurance</WebflowButton>
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
      </WebflowSection>

      {/* WHO */}
      <WebflowSection id="who">
        <div className="max-w-2xl">
          <h2 className="heading_h2">Is CleanGuard Protection Right for You?</h2>
          <p className="paragraph_small text-color_secondary mt-3">Perfect for annual members on fixed weekly schedules.</p>
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
            <WebflowCard key={t} bodySize="small">
              <div className="flex items-center gap-2 paragraph_small">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </div>
            </WebflowCard>
          ))}
        </div>
        <div className="mt-6">
          <WebflowCard variant="secondary">
            <p className="paragraph_small"><strong>Required:</strong> Annual membership with fixed weekly service schedule. Plan guidance:</p>
            <div className="mt-2 grid sm:grid-cols-3 gap-2">
              <div className="paragraph_small text-color_secondary bg-background rounded p-2 border">1x/week: Basic or Premium</div>
              <div className="paragraph_small text-color_secondary bg-background rounded p-2 border">2x/week: Premium or Ultimate</div>
              <div className="paragraph_small text-color_secondary bg-background rounded p-2 border">3x+/week: Premium or Ultimate (recommended)</div>
            </div>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* COVERAGE */}
      <WebflowSection id="coverage" variant="secondary">
        <div className="text-align_center max-w-3xl mx-auto mb-10">
          <h2 className="heading_h2">Comprehensive Protection, Clearly Explained</h2>
          <p className="paragraph_small text-color_secondary mt-2">Eight categories of coverage tailored for cleaning scenarios.</p>
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
            <CoverageCard title="Key Replacement & Re-keying" emoji="🔑" bullets={[
              'Lost keys; re-keying; smart lock reprogramming',
            ]} limits={[ 'Basic: $200/incident', 'Premium: $500 + 1 re-key/yr', 'Ultimate: $1,000 + 2 re-keys/yr' ]} />
            <CoverageCard title="Cancellation Protection" emoji="📅" bullets={[
              'Emergency replacement; no‑show protection',
            ]} limits={[ 'Premium: 48h replacement', 'Ultimate: Same‑day replacement' ]} />
            <CoverageCard title="Service Guarantee Enhancement" emoji="⭐" bullets={[
              'Extended satisfaction guarantee; priority support',
            ]} limits={[ 'Basic: 24h', 'Premium: 48h', 'Ultimate: 72h + manager' ]} />
            <CoverageCard title="Emergency Cleaning Coverage" emoji="🚨" bullets={[
              'Unexpected emergencies; post-incident cleaning',
            ]} limits={[ 'Premium: 1 per year', 'Ultimate: 4 per year' ]} />
            <CoverageCard title="High‑Value Item Registry" emoji="💎" bullets={[
              'Register up to 20 items; photo documentation',
            ]} limits={[ 'Ultimate only' ]} />
          </div>
        </div>
      </WebflowSection>

      {/* PRICING CALCULATOR */}
      <WebflowSection id="calculator">
        <div className="text-align_center mb-10">
          <h2 className="heading_h2 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8" /> Pricing Calculator
          </h2>
          <p className="paragraph_small text-color_secondary mt-2">Calculate your savings with annual billing</p>
        </div>
        <PricingCalculator />
      </WebflowSection>

      {/* PLAN COMPARISON TABLE */}
      <WebflowSection id="comparison" variant="secondary">
        <div className="text-align_center mb-10">
          <h2 className="heading_h2 flex items-center justify-center gap-2">
            <GitCompare className="h-8 w-8" /> Compare All Plans
          </h2>
          <p className="paragraph_small text-color_secondary mt-2">Side-by-side comparison of all coverage options</p>
        </div>
        <PlanComparisonTable />
      </WebflowSection>

      {/* PRICING */}
      <WebflowSection id="pricing">
        <div className="text-align_center mb-10">
          <h2 className="heading_h2">Choose Your Level of Protection</h2>
          <p className="paragraph_small text-color_secondary mt-2">All plans include basic damage coverage. Upgrade for complete peace of mind.</p>
          <WebflowButton variant="secondary" className="mt-4" href="#comparison">View Detailed Comparison Table</WebflowButton>
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
          <div className="text-center paragraph_small text-muted-foreground mt-4 space-y-1">
            <div>All plans require active annual cleaning membership.</div>
            <div>30‑day money‑back guarantee. Cancel anytime; prorated refund available.</div>
          </div>
        </div>
      </section>

      {/* CLAIMS */}
      <WebflowSection id="claims" variant="secondary">
        <div className="text-align_center max-w-2xl mx-auto mb-10">
          <h2 className="heading_h2">Filing a Claim is Simple and Fast</h2>
          <p className="paragraph_small text-color_secondary mt-2">Report, document, review, resolve — most within days.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ['Report Incident', 'Call hotline or submit online — 24/7. Response within 2 hours.'],
            ['Document', 'Upload photos, receipts, and details.'],
            ['Review', 'Adjuster assigned; typically 3–7 business days.'],
            ['Resolution', 'Direct deposit or repair arranged.'],
          ].map(([t, d]) => (
            <WebflowCard key={t}>
              <div className="heading_h5">{t}</div>
              <div className="paragraph_small text-color_secondary mt-2">{d}</div>
            </WebflowCard>
          ))}
        </div>
      </WebflowSection>

      {/* TESTIMONIALS */}
      <WebflowSection>
        <div className="text-align_center mb-10">
          <h2 className="heading_h2">What Our Members Say</h2>
          <p className="paragraph_small text-color_secondary mt-2">Real experiences from satisfied customers</p>
        </div>
          <div className="grid md:grid-cols-3 gap-6">
        <Testimonial quote="Ultimate Plan is worth every penny — claim approved same day." author="Jennifer K., Toronto" detail="$3,800 antique mirror" />
        <Testimonial quote="Premium covered full re‑keying — saved us $600 and stress." author="Michael R., Los Angeles" detail="Key replacement" />
        <Testimonial quote="Claims process was smooth and serious — fully compensated." author="Sarah M., Vancouver" detail="$8,000 jewelry theft" />
        </div>
      </WebflowSection>

      {/* FAQ */}
      <WebflowSection id="faq" variant="secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading_h2 text-align_center mb-8">Frequently Asked Questions</h2>
          <div className="divide-y rounded-lg border bg-background">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span className="font-medium">{f.q}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="pt-3 paragraph_small text-muted-foreground">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </WebflowSection>

      {/* FINAL CTA */}
      <WebflowSection variant="inverse">
        <div className="text-align_center max-w-2xl mx-auto">
          <h2 className="heading_h1">Ready for Complete Protection?</h2>
          <p className="paragraph_large text-color_inverse-secondary mt-3">Join 10,000+ members who clean with confidence.</p>
          <div className="mt-6 button-group">
            <WebflowButton variant="secondary" href="/signup">Get Annual Membership + Insurance</WebflowButton>
            <WebflowButton variant="secondary" href="#pricing">Add Insurance to My Account</WebflowButton>
          </div>
          <div className="mt-4 paragraph_small text-color_inverse-secondary">Questions? Call 1‑800‑XXX‑XXXX (Mon–Fri 8AM–8PM EST)</div>
        </div>
      </WebflowSection>
      </div>
    </>
  )
}

function ValueProp({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
      <div className="rounded-lg border bg-background p-4">
      <div className="paragraph_xlarge">{icon}</div>
      <div className="font-light mt-1">{title}</div>
      <div className="paragraph_small text-muted-foreground">{subtitle}</div>
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
    <WebflowCard>
      <div className="flex items-center justify-between">
        <h3 className="heading_h5">{emoji} {title}</h3>
      </div>
      <ul className="mt-3 space-y-1 paragraph_small text-color_secondary">
        {bullets.map((b) => <li key={b}>• {b}</li>)}
      </ul>
      <div className="mt-4 paragraph_small">
        <span className="font-medium">Coverage:</span> {limits.join(' · ')}
      </div>
    </WebflowCard>
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
    <WebflowCard className={`flex flex-col ${highlight ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="heading_h4">{emoji} {title}</h3>
        {badge && <span className="paragraph_small px-2 py-1 rounded-full bg-primary text-primary-foreground">{badge}</span>}
      </div>
      <div className="mt-3 text-color_secondary paragraph_small">Monthly: <span className="text-foreground font-medium">{monthly}</span></div>
      <div className="text-color_secondary paragraph_small">Annual (Save 20%): <span className="text-foreground font-medium">{annual}</span></div>
      <div className="mt-4 border-t pt-4">
        <table className="w-full paragraph_small">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b last:border-b-0">
                <td className="py-2 text-color_secondary">{k}</td>
                <td className="py-2 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PlanSelectionDialog planCode={planCode} planName={title} monthly={monthly} annual={annual}>
        <WebflowButton className="mt-6 w-full">{cta}</WebflowButton>
      </PlanSelectionDialog>
    </WebflowCard>
  )
}

function Testimonial({ quote, author, detail }: { quote: string; author: string; detail: string }) {
  return (
    <WebflowCard>
      <div className="paragraph_large">"{quote}"</div>
      <div className="mt-3 paragraph_small text-color_secondary">{author}</div>
      <div className="paragraph_small text-color_secondary">{detail}</div>
    </WebflowCard>
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
    <WebflowCard className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <label className="paragraph_small font-medium mb-2 block">Select Plan</label>
          <div className="grid grid-cols-3 gap-2">
            {(['basic', 'premium', 'ultimate'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 rounded-lg border paragraph_small font-medium transition-colors ${
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
          <label className="paragraph_small font-medium mb-2 block">Billing Cycle</label>
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
            <span className="paragraph_xxlarge font-bold">${selectedPrice.toFixed(2)}</span>
          </div>
          {billingCycle === 'annual' && (
            <>
              <div className="flex justify-between items-center paragraph_small">
                <span className="text-muted-foreground">Monthly equivalent</span>
                <span className="font-medium">${monthlyEquivalent.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between items-center paragraph_small text-green-600">
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
    </WebflowCard>
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
    <WebflowCard className="overflow-x-auto">
      <table className="w-full paragraph_small">
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
    </WebflowCard>
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
            <label className="paragraph_small font-medium mb-2 block">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`p-3 rounded-lg border paragraph_small font-medium transition-colors ${
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
                className={`p-3 rounded-lg border paragraph_small font-medium transition-colors ${
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
            <div className="p-3 rounded-lg bg-muted paragraph_small text-muted-foreground">
              You'll need to sign up or log in to complete your selection.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <WebflowButton variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </WebflowButton>
          <WebflowButton onClick={handleSelect} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : userId ? 'Confirm Selection' : 'Sign Up to Continue'}
          </WebflowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


