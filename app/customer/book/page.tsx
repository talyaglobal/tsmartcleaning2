import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { BookingFlow } from '@/components/booking/booking-flow'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function BookServicePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Book a Service</h1>
            <p className="text-muted-foreground">Choose your service and schedule your cleaning</p>
          </div>
          
          <BookingFlow />

          {/* Insurance Upsell (MVP) */}
          <div className="mt-10">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-2">
                    <ShieldCheck className="h-4 w-4" /> Add CleanGuard Protection
                  </div>
                  <h3 className="text-xl font-semibold">Protect your home & belongings</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on your selection, we recommend Premium protection. Upgrade for higher limits and faster claims.
                  </p>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <UpsellPlan
                      title="🏆 Premium"
                      price="$19.99/mo"
                      bullets={['Up to $25K coverage','Theft coverage','Priority claims','$50 deductible']}
                      recommended
                    />
                    <UpsellPlan
                      title="💎 Ultimate"
                      price="$34.99/mo"
                      bullets={['Up to $100K coverage','Zero deductible','Same-day emergency','High-value registry']}
                    />
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    💡 96% of annual members add insurance protection
                  </div>
                </div>
                <div className="hidden sm:flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/insurance#pricing">Compare All Plans</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="#">Continue Without Insurance</Link>
                  </Button>
                </div>
              </div>
              <div className="sm:hidden mt-4 flex gap-2">
                <Button className="flex-1" asChild>
                  <Link href="/insurance#pricing">Compare Plans</Link>
                </Button>
                <Button className="flex-1" variant="outline" asChild>
                  <Link href="#">Skip</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpsellPlan({
  title,
  price,
  bullets,
  recommended,
}: {
  title: string
  price: string
  bullets: string[]
  recommended?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${recommended ? 'border-primary' : ''}`}>
      <div className="flex items-baseline justify-between">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{price}</div>
      </div>
      <ul className="mt-2 text-sm text-muted-foreground space-y-1">
        {bullets.map((b) => <li key={b}>• {b}</li>)}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" name="insurance-plan" className="accent-[var(--color-primary)]" />
          Select
        </label>
        {recommended && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Recommended</span>}
      </div>
    </div>
  )
}
