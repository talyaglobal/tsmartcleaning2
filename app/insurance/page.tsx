"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { BrandLogoClient } from '@/components/BrandLogoClient'

export default function InsurancePage() {
  return (
    <div className="min-h-screen">
      {/* Local header for landing page context */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <BrandLogoClient />
            <span className="hidden sm:inline-flex text-xs text-muted-foreground">CleanGuard Protection</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#who" className="text-sm hover:text-primary transition-colors">Who it’s for</Link>
            <Link href="#coverage" className="text-sm hover:text-primary transition-colors">What’s covered</Link>
            <Link href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link>
            <Link href="#claims" className="text-sm hover:text-primary transition-colors">Claims</Link>
            <Link href="#faq" className="text-sm hover:text-primary transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <Link href="#pricing">Get Protected</Link>
            </Button>
          </div>
        </div>
      </header>

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
            <div className="aspect-[3/2] rounded-xl bg-muted overflow-hidden">
              <img
                src="/tsmartcleaning.webflow/images/390d4b90-ab8f-4298-bb01-24aad70695c5.avif"
                alt="Protected cleaning"
                className="h-full w-full object-cover"
                loading="lazy"
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

      {/* PRICING */}
      <section id="pricing" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Level of Protection</h2>
            <p className="text-muted-foreground mt-2">All plans include basic damage coverage. Upgrade for complete peace of mind.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <PriceTier title="Basic" emoji="🛡️" monthly="$9.99/mo" annual="$95.90/yr" rows={[
              ['Property Damage', 'Up to $5K'],
              ['Theft Protection', '✗'],
              ['Liability', '$50K'],
              ['Key Coverage', '$200'],
              ['Cancellation', '✗'],
              ['Emergency Cleans', '✗'],
              ['Deductible', '$100'],
            ]} cta="Select Basic" />
            <PriceTier title="Premium" emoji="🏆" badge="MOST POPULAR" monthly="$19.99/mo" annual="$191.90/yr" rows={[
              ['Property Damage', 'Up to $25K'],
              ['Theft Protection', 'Up to $10K'],
              ['Liability', '$500K'],
              ['Key Coverage', '$500 + 1 re‑key'],
              ['Cancellation', '48h guarantee'],
              ['Emergency Cleans', '1 per year'],
              ['Deductible', '$50'],
            ]} cta="Select Premium" highlight />
            <PriceTier title="Ultimate" emoji="💎" monthly="$34.99/mo" annual="$335.90/yr" rows={[
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
  title,
  emoji,
  badge,
  monthly,
  annual,
  rows,
  cta,
  highlight,
}: {
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
      <Button className="mt-6" asChild><Link href="/signup">{cta}</Link></Button>
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
  { q: 'Are there exclusions?', a: 'We don’t cover intentional damage, normal wear and tear, pre‑existing damage, or items over plan thresholds unless registered.' },
  { q: 'How many claims per year?', a: 'No hard limit; coverage limits apply per incident and annually for theft.' },
  { q: 'What’s the deductible?', a: 'Basic $100 · Premium $50 · Ultimate $0.' },
  { q: 'Can I change plans?', a: 'Upgrade anytime (pay difference) or change at renewal.' },
]


