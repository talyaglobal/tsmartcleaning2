"use client"

import Link from 'next/link'
import { useState } from 'react'
import { BrandLogoClient as BrandLogo } from '@/components/BrandLogoClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Menu, X, Star, CreditCard, Sparkles, Shield, Clock3, Gift, Trophy, Phone, ArrowRight, DollarSign, Users, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

export default function TSmartCardPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [amount, setAmount] = useState<number>(150)
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'custom'>('biweekly')
  const [customPerYear, setCustomPerYear] = useState<number>(12)
  const [plan, setPlan] = useState<'basic' | 'card' | 'pro' | 'elite'>('card')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')

  const ordersPerYear = (() => {
    switch (frequency) {
      case 'weekly': return 52
      case 'biweekly': return 26
      case 'monthly': return 12
      case 'custom': return Math.max(0, customPerYear)
    }
  })()

  const discountByPlan: Record<typeof plan, number> = {
    basic: 0,
    card: 0.10,
    pro: 0.15,
    elite: 0.20,
  }
  const perksByPlan: Record<typeof plan, string[]> = {
    basic: ['Standard booking', '0% discount'],
    card: ['10% discount', 'Priority booking'],
    pro: ['15% discount', 'Free rescheduling', '1 free upgrade/quarter', 'Dedicated support', 'No booking fees'],
    elite: ['20% discount', 'Unlimited rescheduling', 'Monthly free upgrade', 'Concierge service', 'Same-day availability', 'Premium cleaners only'],
  }
  const planAnnualCost = (() => {
    if (plan === 'basic') return 0
    if (plan === 'card') return 99
    if (plan === 'pro') return billing === 'yearly' ? 190 : 19 * 12
    if (plan === 'elite') return billing === 'yearly' ? 490 : 49 * 12
    return 0
  })()

  const discountRate = discountByPlan[plan]
  const annualWithout = amount * ordersPerYear
  const annualDiscount = annualWithout * discountRate
  const annualWith = Math.max(0, annualWithout - annualDiscount)
  const netSavings = Math.max(0, Math.round((annualDiscount - planAnnualCost) * 100) / 100)
  const breakEvenOrders = Math.ceil(planAnnualCost / (amount * discountRate || 1))
  const progressToBreakEven = Math.min(100, Math.round((Math.min(ordersPerYear, breakEvenOrders) / breakEvenOrders) * 100))
  const planLabel = plan === 'card' ? 'tSmartCard' : plan === 'pro' ? 'tSmartPro' : plan === 'elite' ? 'tSmartElite' : 'tSmartBasic'
  const features = {
    priorityBooking: plan === 'card' || plan === 'pro' || plan === 'elite',
    freeRescheduling: plan === 'pro' || plan === 'elite',
    upgradeLabel: plan === 'elite' ? 'Monthly free upgrade' : plan === 'pro' ? '1 free upgrade/quarter' : null,
    dedicatedSupport: plan === 'pro' || plan === 'elite',
    noBookingFees: plan === 'pro' || plan === 'elite',
    unlimitedRescheduling: plan === 'elite',
    conciergeService: plan === 'elite',
    sameDayAvailability: plan === 'elite',
    premiumCleanersOnly: plan === 'elite',
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/marketing" className="text-sm hover:text-primary transition-colors">Home</Link>
            <Link href="/customer/book" className="text-sm hover:text-primary transition-colors">Book</Link>
            <Link href="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link>
            <Link
              href="/tsmartcard"
              className="text-sm font-semibold px-3 py-1.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                tSmartCard
                <Badge className="ml-1 bg-white/15 text-white hover:bg-white/20">Save 10%</Badge>
              </span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <Link href="/customer/book">Get started</Link>
            </Button>
            <button
              aria-label="Toggle menu"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 grid gap-2">
              <Link href="/marketing" className="py-2">Home</Link>
              <Link href="/customer/book" className="py-2">Book</Link>
              <Link href="/pricing" className="py-2">Pricing</Link>
              <Link
                href="/tsmartcard"
                className="py-2 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 text-white inline-flex items-center justify-between px-3"
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  tSmartCard
                </span>
                <Badge className="bg-white/15 text-white">Save 10%</Badge>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 inline-flex items-center gap-1 bg-amber-500 text-white">
                <Star className="h-3.5 w-3.5" />
                Premium Membership
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
                One Card. Endless Savings.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Join tSmartCard and save 10% on every cleaning service for an entire year.
                Just $99 unlocks premium benefits and exclusive perks.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/signup">
                    <CreditCard className="h-4 w-4" />
                    Get Your tSmartCard Now – $99/year
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#calculator">See How Much You'll Save</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  30-day money-back guarantee
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Instant digital access
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-2xl ring-1 ring-white/20 p-6 md:p-8">
                <div className="flex items-center justify-between text-white/90">
                  <span className="font-semibold">tSmartCleaning</span>
                  <span className="text-xs">PREMIUM</span>
                </div>
                <div className="mt-8 text-white">
                  <div className="text-2xl font-semibold">tSmartCard</div>
                  <div className="text-xs opacity-80">PREMIUM MEMBER</div>
                </div>
                <div className="absolute -bottom-10 -right-10 hidden md:block blur-2xl opacity-40">
                  <div className="w-64 h-64 rounded-full bg-purple-500/40" />
                </div>
                <div className="mt-10 text-white/90">
                  <div className="text-sm tracking-widest">•••• •••• •••• 1234</div>
                  <div className="text-[10px] opacity-80 mt-1">VALID THRU 12/25</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">$99/YEAR</div>
              <div className="text-xs text-muted-foreground">One payment</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">10% OFF</div>
              <div className="text-xs text-muted-foreground">Every order</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">UNLIMITED</div>
              <div className="text-xs text-muted-foreground">Use all year</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Membership plans */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Choose Your Membership</h2>
            <p className="mt-2 text-muted-foreground">Pick the level that matches how often you book and the perks you want.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* tSmartBasic */}
            <Card className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">tSmartBasic</div>
                  <div className="text-xs text-muted-foreground mt-0.5">$0/mo</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Standard booking</li>
                <li className="inline-flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> 0% discount</li>
              </ul>
              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup?plan=basic">Continue with Basic</Link>
                </Button>
              </div>
            </Card>
            {/* tSmartCard (current) */}
            <Card className="p-5 ring-1 ring-indigo-500/30 relative flex flex-col">
              <Badge className="absolute -top-2 right-3 bg-indigo-600 text-white">Current</Badge>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold inline-flex items-center gap-1">
                    tSmartCard <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">$99/yr</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> 10% discount</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Priority booking</li>
              </ul>
              <div className="mt-6">
                <Button className="w-full" asChild>
                  <Link href="/signup?plan=tsmartcard">Get tSmartCard – $99/yr</Link>
                </Button>
              </div>
            </Card>
            {/* tSmartPro */}
            <Card className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">tSmartPro</div>
                  <div className="text-xs text-muted-foreground mt-0.5">$19/mo or $190/yr</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> 15% discount</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Free rescheduling</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> 1 free upgrade/quarter</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Dedicated support</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> No booking fees</li>
              </ul>
              <div className="mt-6">
                <Button className="w-full" asChild>
                  <Link href="/signup?plan=pro">Upgrade to Pro</Link>
                </Button>
              </div>
            </Card>
            {/* tSmartElite */}
            <Card className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold inline-flex items-center gap-1">
                    tSmartElite <Star className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">$49/mo or $490/yr</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> 20% discount</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Unlimited rescheduling</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Monthly free upgrade</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Concierge service</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Same-day availability</li>
                <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Premium cleaners only</li>
              </ul>
              <div className="mt-6">
                <Button className="w-full" asChild>
                  <Link href="/signup?plan=elite">Go Elite</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Calculator placeholder */}
      <section id="calculator" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">See Your Savings in Action</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your typical spend and how often you book to estimate your annual savings.
            </p>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-6 max-w-4xl">
            <Card className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium">Membership plan</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">tSmartBasic (0%)</SelectItem>
                        <SelectItem value="card">tSmartCard (10% off)</SelectItem>
                        <SelectItem value="pro">tSmartPro (15% off)</SelectItem>
                        <SelectItem value="elite">tSmartElite (20% off)</SelectItem>
                      </SelectContent>
                    </Select>
                    {(plan === 'pro' || plan === 'elite') && (
                      <Select value={billing} onValueChange={(v: any) => setBilling(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Billing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Membership cost: ${planAnnualCost}/year
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Average spend per cleaning ($)</label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">How often do you book?</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly (52 / year)</SelectItem>
                        <SelectItem value="biweekly">2x per month (26 / year)</SelectItem>
                        <SelectItem value="monthly">Monthly (12 / year)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {frequency === 'custom' && (
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={customPerYear}
                        onChange={(e) => setCustomPerYear(Math.max(0, Number(e.target.value)))}
                        placeholder="Times per year"
                      />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Calculating with {ordersPerYear} bookings per year
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Break-even progress</div>
                  <Progress value={progressToBreakEven} />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {plan === 'basic' || discountRate === 0
                      ? 'No membership selected—no break-even.'
                      : <>Membership pays for itself after about <span className="font-medium">{isFinite(breakEvenOrders) ? breakEvenOrders : 0}</span> orders.</>}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Without membership</div>
                  <div className="text-base font-semibold">${annualWithout.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    With {plan === 'basic' ? 'membership (0% off)' : (plan === 'card' ? 'tSmartCard' : plan === 'pro' ? 'tSmartPro' : 'tSmartElite')} ({Math.round(discountRate * 100)}% off)
                  </div>
                  <div className="text-base font-semibold">${annualWith.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Membership cost</div>
                  <div className="text-base font-semibold">-${planAnnualCost}</div>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <div className="text-sm font-medium">Your total savings</div>
                  <div className={`text-lg font-bold ${netSavings > 0 ? 'text-green-600' : ''}`}>
                    ${netSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="mt-2 grid gap-3">
                  <Button asChild>
                    <Link href={`/signup?plan=${plan}`}>Join {plan === 'card' ? 'tSmartCard' : plan === 'pro' ? 'tSmartPro' : plan === 'elite' ? 'tSmartElite' : 'tSmartBasic'}</Link>
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Perks included:
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {perksByPlan[plan].map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">More Than Just Savings</h2>
          <p className="mt-2 text-muted-foreground">tSmartCard members enjoy exclusive perks and VIP treatment.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div className="font-semibold">10% Off Everything</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Every cleaning service, every time. No blackout dates.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-primary" />
                <div className="font-semibold">Priority Booking</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">First access to popular time slots.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-primary" />
                <div className="font-semibold">Free Upgrades</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Random complimentary service upgrades throughout the year.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div className="font-semibold">Birthday Bonus</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Free cleaning credit during your birthday month (up to $150).</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <div className="font-semibold">Member-Only Pricing</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Exclusive deals on add-ons and seasonal specials.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div className="font-semibold">VIP Support</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Priority response from our dedicated support team.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Card Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Premium Membership, Premium Card</h2>
              <p className="mt-2 text-muted-foreground">
                Choose from elegant designs—show off your premium status with a sleek card and instant digital access.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Custom design options</li>
                <li className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Secure, unique member number</li>
                <li className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Physical + digital card</li>
              </ul>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/signup">Select Your Design</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl ring-1 ring-white/20" />
              <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-700 shadow-xl ring-1 ring-white/10" />
              <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 shadow-xl ring-1 ring-white/10" />
              <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Getting Started is Easy</h2>
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold">1. Purchase</div>
              <p className="mt-1 text-sm text-muted-foreground">Pay $99 once and pick your design.</p>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold">2. Receive</div>
              <p className="mt-1 text-sm text-muted-foreground">Instant digital access. Physical card ships in 5–7 days.</p>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold">3. Save</div>
              <p className="mt-1 text-sm text-muted-foreground">10% auto-applied at checkout—no codes needed.</p>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold">4. Enjoy</div>
              <p className="mt-1 text-sm text-muted-foreground">VIP benefits, upgrades, and priority booking.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials & Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Hear From Our Premium Members</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="text-amber-500">★★★★★</div>
              <p className="mt-3 text-sm">“I book 2x per month and saved over $200 in my first year. No-brainer.”</p>
              <div className="mt-3 text-xs text-muted-foreground">— Jennifer, Toronto • Saved $312</div>
            </Card>
            <Card className="p-5">
              <div className="text-amber-500">★★★★★</div>
              <p className="mt-3 text-sm">“Priority booking is a game-changer. I always get the slots I want.”</p>
              <div className="mt-3 text-xs text-muted-foreground">— Michael, LA • Saved $456 + upgrades</div>
            </Card>
            <Card className="p-5">
              <div className="text-amber-500">★★★★★</div>
              <p className="mt-3 text-sm">“Referred 3 friends and earned $75 credits. Love the card design too.”</p>
              <div className="mt-3 text-xs text-muted-foreground">— Sarah, Vancouver • Saved $289</div>
            </Card>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">25,000+</div>
              <div className="text-xs text-muted-foreground">Active Members</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">$2.3M+</div>
              <div className="text-xs text-muted-foreground">Total Savings</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">4.9/5</div>
              <div className="text-xs text-muted-foreground">Average Rating</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm font-semibold">94%</div>
              <div className="text-xs text-muted-foreground">Renewal Rate</div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="font-semibold">How quickly does the card pay for itself?</div>
              <p className="mt-2 text-sm text-muted-foreground">Most members break even within 3–5 cleanings depending on spend.</p>
            </Card>
            <Card className="p-5">
              <div className="font-semibold">Can family use my discount?</div>
              <p className="mt-2 text-sm text-muted-foreground">Yes, bookings under your account and address benefit from your discount.</p>
            </Card>
            <Card className="p-5">
              <div className="font-semibold">Does it stack with promotions?</div>
              <p className="mt-2 text-sm text-muted-foreground">Generally yes—member rate applies to regular pricing; some promo exceptions may apply.</p>
            </Card>
            <Card className="p-5">
              <div className="font-semibold">Money-back guarantee?</div>
              <p className="mt-2 text-sm text-muted-foreground">Try it risk-free with our 30-day money-back guarantee.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{planLabel} vs. Pay Per Clean</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold">Without Card</div>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Annual Fee: $0</li>
                <li>• Per Clean: ${amount}</li>
                <li>• Discount: 0%</li>
                <li>• Priority Booking: ✗</li>
                <li>• Free Rescheduling: ✗</li>
                <li>• Free Upgrades: ✗</li>
                <li>• Dedicated Support: ✗</li>
                <li>• No Booking Fees: ✗</li>
                <li>• Unlimited Rescheduling: ✗</li>
                <li>• Concierge Service: ✗</li>
                <li>• Same-day Availability: ✗</li>
                <li>• Premium Cleaners Only: ✗</li>
              </ul>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold">With {planLabel}</div>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Annual Fee: ${planAnnualCost}</li>
                <li>• Per Clean: ${(amount * (1 - discountRate)).toFixed(0)} ({Math.round(discountRate * 100)}% off)</li>
                <li>• Priority Booking: {features.priorityBooking ? '✓' : '✗'}</li>
                <li>• Free Rescheduling: {features.freeRescheduling ? '✓' : '✗'}</li>
                <li>• Free Upgrades: {features.upgradeLabel ? `✓ (${features.upgradeLabel})` : '✗'}</li>
                <li>• Dedicated Support: {features.dedicatedSupport ? '✓' : '✗'}</li>
                <li>• No Booking Fees: {features.noBookingFees ? '✓' : '✗'}</li>
                <li>• Unlimited Rescheduling: {features.unlimitedRescheduling ? '✓' : '✗'}</li>
                <li>• Concierge Service: {features.conciergeService ? '✓' : '✗'}</li>
                <li>• Same-day Availability: {features.sameDayAvailability ? '✓' : '✗'}</li>
                <li>• Premium Cleaners Only: {features.premiumCleanersOnly ? '✓' : '✗'}</li>
              </ul>
            </Card>
          </div>
          <div className="mt-6">
            <Button asChild>
              <Link href={`/signup?plan=${plan}`} className="inline-flex items-center gap-2">
                Join {planLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to Start Saving?</h3>
          <p className="mt-2 text-muted-foreground">Join thousands of smart cleaners unlocking premium benefits today.</p>
          <div className="mt-6">
            <Button size="lg" asChild>
              <Link href="/signup">Get Your tSmartCard Now – $99/year</Link>
            </Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            ✓ 30-day money-back guarantee • ✓ Instant digital access • ✓ Physical card ships in 5 days
          </div>
        </div>
      </section>
    </div>
  )
}


