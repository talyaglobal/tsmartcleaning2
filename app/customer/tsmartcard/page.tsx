"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, Wallet, CreditCard, CheckCircle2, TrendingUp, Trophy, Gift, Calendar, Phone, Settings } from 'lucide-react'

export default function TSmartCardMemberDashboard() {
  // Placeholder data; wire to real data sources later
  const member = {
    name: 'Jennifer',
    status: 'Active',
    cardNumberMasked: '•••• •••• •••• 1234',
    validThru: '12/25',
    memberSince: 'Jan 15, 2024',
    renewalDate: 'Jan 15, 2025',
    autoRenew: true,
    referralCode: 'JENNIFER2024',
    physicalCard: { shipped: true, delivered: true, tracking: 'TRACK123456' },
  }
  const savings = {
    totalSaved: 312,
    orders: 18,
    cardCost: 99,
    netBenefit: 213,
    breakEvenOrders: 7,
  }
  const benefits = useMemo(
    () => [
      { label: '10% Discount on Every Order', active: true },
      { label: 'Priority Booking Access', active: true, meta: 'Used 12 times this year' },
      { label: 'Birthday Bonus Cleaning', active: true, meta: 'Available in: December 2024' },
      { label: 'Free Upgrades', active: true, meta: 'Received: 2 • Value: $380' },
      { label: 'Referral Rewards', active: true, meta: 'Friends: 3 • Credits: $75' },
      { label: 'Bonus Credits', active: true, meta: 'Balance: $45' },
    ],
    []
  )

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">tSmartCard Member Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {member.name}! Manage your premium membership and track your savings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Digital Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Your Digital Card</div>
              <Badge variant="default">{member.status}</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="relative">
                <div className="aspect-[85/54] rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-2xl ring-1 ring-white/20 p-6 md:p-8 text-white">
                  <div className="flex items-center justify-between text-white/90">
                    <span className="font-semibold">tSmartCleaning</span>
                    <span className="text-xs">PREMIUM</span>
                  </div>
                  <div className="mt-8">
                    <div className="text-2xl font-semibold">tSmartCard</div>
                    <div className="text-xs opacity-80">PREMIUM MEMBER</div>
                  </div>
                  <div className="mt-10">
                    <div className="text-sm tracking-widest">{member.cardNumberMasked}</div>
                    <div className="text-[10px] opacity-80 mt-1">VALID THRU {member.validThru}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full gap-2">
                    <Wallet className="h-4 w-4" />
                    Add to Apple Wallet
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <CreditCard className="h-4 w-4" />
                    Add to Google Pay
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Image
                  </Button>
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <Link href="/contact">Request Physical</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Savings Tracker */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Your Savings This Year
              </div>
              <div className="text-xs text-muted-foreground">Card paid for itself after {savings.breakEvenOrders} orders</div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <Stat label="Total Saved" value={`$${savings.totalSaved}`} />
              <Stat label="Orders Placed" value={`${savings.orders}`} />
              <Stat label="Card Cost" value={`$${savings.cardCost}`} />
              <Stat label="Net Benefit" value={`+$${savings.netBenefit}`} positive />
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Progress to next $100 saved</div>
              <Progress value={Math.min(100, (savings.totalSaved % 100) / 100 * 100)} />
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/reports">View Detailed Savings Report</Link>
              </Button>
            </div>
          </Card>

          {/* Orders with savings */}
          <Card className="p-6">
            <div className="font-semibold mb-4">Recent Orders</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { date: 'Nov 15', service: 'Deep Clean', regular: 180, paid: 162, saved: 18 },
                { date: 'Nov 01', service: 'Standard', regular: 120, paid: 108, saved: 12 },
                { date: 'Oct 18', service: 'Move-Out', regular: 250, paid: 225, saved: 25 },
                { date: 'Oct 04', service: 'Standard', regular: 120, paid: 108, saved: 12 },
              ].map((o) => (
                <div key={`${o.date}-${o.service}`} className="rounded-md border p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{o.date}</div>
                    <div className="text-muted-foreground">{o.service}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Regular</div>
                      <div className="font-medium">${o.regular}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">You Paid</div>
                      <div className="font-medium">${o.paid}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Saved</div>
                      <div className="font-medium text-green-600">-${o.saved}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/customer">View All Orders</Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Meta and controls */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="font-semibold mb-3">Membership Status</div>
            <div className="grid gap-2 text-sm">
              <Row label="Member Since" value={member.memberSince} />
              <Row label="Card Number" value="TSC-2024-012345" />
              <Row label="Renewal Date" value={member.renewalDate} />
              <Row label="Status" value="Active & Current" />
              <Row label="Auto-Renew" value={member.autoRenew ? 'ON' : 'OFF'} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline">Renew Now</Button>
              <Button variant="outline" asChild>
                <Link href="/settings/billing">Manage Auto-Renewal</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3">Your Exclusive Benefits</div>
            <div className="grid gap-2 text-sm">
              {benefits.map(b => (
                <div key={b.label} className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{b.label}</span>
                  </div>
                  {b.meta ? <span className="text-xs text-muted-foreground">{b.meta}</span> : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3">Share & Earn</div>
            <div className="text-sm">
              Your referral code:
              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-semibold">{member.referralCode}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline">Copy Code</Button>
              <Button variant="outline" asChild>
                <Link href="/share">Share Link</Link>
              </Button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Earn $25 per friend who becomes a member.
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3">Physical Card</div>
            <div className="grid gap-2 text-sm">
              <Row label="Status" value={member.physicalCard.delivered ? 'Delivered ✓' : member.physicalCard.shipped ? 'Shipped' : 'Preparing'} />
              <Row label="Tracking" value="View Tracking" href={`/tracking/${member.physicalCard.tracking}`} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline">Order New Card</Button>
              <Button variant="outline">Change Design</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3 inline-flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </div>
            <div className="grid gap-2 text-sm">
              <Row label="Payment Method" value="Visa •••• 1234" href="/settings/billing" />
              <Row label="Shipping Address" value="123 Main St, Toronto ON" href="/settings/address" />
              <Row label="Email Preferences" value="Manage Preferences" href="/settings/notifications" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3 inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              VIP Support
            </div>
            <div className="text-sm">
              <div>Phone: 1-800-XXX-XXXX</div>
              <div>Email: vip@tsmartcleaning.com</div>
              <Button variant="outline" className="mt-3" asChild>
                <Link href="/support">Live Chat</Link>
              </Button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Common Questions:
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>How do I use my birthday bonus?</li>
                <li>When do I get free upgrades?</li>
                <li>How do referrals work?</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${positive ? 'text-green-600' : ''}`}>{value}</div>
    </div>
  )
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground">{label}</div>
      {href ? (
        <Link href={href} className="font-medium underline underline-offset-2 text-sm">
          {value}
        </Link>
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  )
}


