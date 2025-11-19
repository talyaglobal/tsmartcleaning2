"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Download, Wallet, CreditCard, CheckCircle2, TrendingUp, Trophy, Gift, 
  Calendar, Phone, Settings, AlertCircle, Sparkles, ArrowUp, X, Copy,
  Clock, DollarSign, ShoppingBag, Zap
} from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'

interface MembershipCard {
  id: string
  card_number: string
  card_number_masked: string
  tier: 'premium' | 'pro' | 'elite'
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended'
  is_activated: boolean
  discount_percentage: number
  annual_cost: number
  purchase_date: string
  expiration_date: string
  auto_renew: boolean
  referral_code: string
  total_savings: number
  order_count: number
  referral_count: number
  referral_credits: number
  bonus_credits: number
  birthday_bonus_used: boolean
  physical_card_shipped: boolean
  physical_card_delivered: boolean
  tracking_number?: string
  daysUntilRenewal?: number
  needsRenewal?: boolean
  isExpired?: boolean
}

interface UsageItem {
  id: string
  order_date: string
  service_name: string
  original_amount: number
  discount_amount: number
  final_amount: number
  benefit_type: string
}

export default function TSmartCardMemberDashboard() {
  const [card, setCard] = useState<MembershipCard | null>(null)
  const [usage, setUsage] = useState<UsageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [activating, setActivating] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createAnonSupabase()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (!authUser) {
        setLoading(false)
        return
      }

      // Get session token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setLoading(false)
        return
      }

      // Fetch membership card data
      const cardRes = await fetch('/api/membership/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const cardData = await cardRes.json()

      if (cardData.card) {
        setCard(cardData.card)
        
        // Show activation modal if card is not activated
        if (!cardData.card.is_activated && cardData.card.status === 'pending') {
          setShowActivationModal(true)
        }

        // Fetch usage data
        const usageRes = await fetch('/api/membership/usage', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        const usageData = await usageRes.json()
        setUsage(usageData.usage || [])
      }
    } catch (error) {
      console.error('Error loading membership data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!card || !activationCode.trim()) return

    setActivating(true)
    try {
      const supabase = createAnonSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      const res = await fetch('/api/membership/activate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationCode: activationCode.trim(),
          cardId: card.id,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCard(data.card)
        setShowActivationModal(false)
        setActivationCode('')
        // Reload data
        loadData()
      } else {
        alert(data.error || 'Failed to activate card')
      }
    } catch (error) {
      console.error('Error activating card:', error)
      alert('Failed to activate card')
    } finally {
      setActivating(false)
    }
  }

  const handleUpgrade = async (newTier: 'pro' | 'elite') => {
    if (!card) return

    try {
      const supabase = createAnonSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      const res = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newTier,
          cardId: card.id,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCard(data.card)
        setShowUpgradeModal(false)
        alert(`Upgrade to ${newTier.toUpperCase()} initiated! Cost: $${data.upgradeCost}`)
        loadData()
      } else {
        alert(data.error || 'Failed to upgrade')
      }
    } catch (error) {
      console.error('Error upgrading card:', error)
      alert('Failed to upgrade')
    }
  }

  const handleRenew = async () => {
    if (!card) return

    try {
      const supabase = createAnonSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      // First check renewal eligibility
      const checkRes = await fetch(`/api/membership/renew?cardId=${card.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const checkData = await checkRes.json()

      if (!checkRes.ok || !checkData.eligible) {
        alert(checkData.error || 'Card is not eligible for renewal yet')
        return
      }

      // Confirm renewal
      const confirmRenewal = confirm(
        `Renew your ${card.tier.toUpperCase()} membership for $${checkData.renewalCost}? ` +
        `Your membership will be extended until ${new Date(checkData.newExpirationDate).toLocaleDateString()}.`
      )

      if (!confirmRenewal) return

      // Process renewal (in production, this should include Stripe payment)
      const res = await fetch('/api/membership/renew', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: card.id,
          autoRenew: card.auto_renew,
          // paymentIntentId: '...', // In production, process payment first
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCard(data.card)
        setShowUpgradeModal(false)
        alert(`Membership renewed successfully! Your new expiration date is ${new Date(data.newExpirationDate).toLocaleDateString()}.`)
        loadData()
      } else {
        alert(data.error || 'Failed to renew membership')
      }
    } catch (error) {
      console.error('Error renewing membership:', error)
      alert('Failed to renew membership')
    }
  }

  const handleToggleAutoRenew = async (enabled: boolean) => {
    if (!card) return

    try {
      const supabase = createAnonSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      const res = await fetch('/api/membership/auto-renew', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: card.id,
          autoRenew: enabled,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCard(data.card)
        alert(`Auto-renewal ${enabled ? 'enabled' : 'disabled'} successfully`)
        loadData()
      } else {
        alert(data.error || 'Failed to update auto-renewal setting')
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error)
      alert('Failed to update auto-renewal setting')
    }
  }

  const copyReferralCode = () => {
    if (card?.referral_code) {
      navigator.clipboard.writeText(card.referral_code)
      alert('Referral code copied!')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Calculate derived values
  const savings = useMemo(() => {
    if (!card) return { totalSaved: 0, orders: 0, cardCost: 0, netBenefit: 0, breakEvenOrders: 0 }
    
    const totalSaved = Number(card.total_savings || 0)
    const orders = card.order_count || 0
    const cardCost = Number(card.annual_cost || 0)
    const netBenefit = totalSaved - cardCost
    const breakEvenOrders = cardCost > 0 && card.discount_percentage > 0 
      ? Math.ceil(cardCost / (100 * (card.discount_percentage / 100))) 
      : 0

    return { totalSaved, orders, cardCost, netBenefit, breakEvenOrders }
  }, [card])

  const benefits = useMemo(() => {
    if (!card) return []
    
    const tierBenefits: Record<string, any[]> = {
      premium: [
        { label: `${card.discount_percentage}% Discount on Every Order`, active: true },
        { label: 'Priority Booking Access', active: true, meta: `Used ${card.order_count} times` },
        { label: 'Birthday Bonus Cleaning', active: !card.birthday_bonus_used, meta: card.birthday_bonus_used ? 'Used this year' : 'Available on your birthday' },
        { label: 'Referral Rewards', active: true, meta: `Friends: ${card.referral_count} • Credits: ${formatCurrency(card.referral_credits)}` },
        { label: 'Bonus Credits', active: card.bonus_credits > 0, meta: `Balance: ${formatCurrency(card.bonus_credits)}` },
      ],
      pro: [
        { label: `${card.discount_percentage}% Discount on Every Order`, active: true },
        { label: 'Priority Booking Access', active: true },
        { label: 'Free Rescheduling', active: true },
        { label: '1 Free Upgrade/Quarter', active: true },
        { label: 'Dedicated Support', active: true },
        { label: 'No Booking Fees', active: true },
      ],
      elite: [
        { label: `${card.discount_percentage}% Discount on Every Order`, active: true },
        { label: 'Unlimited Rescheduling', active: true },
        { label: 'Monthly Free Upgrade', active: true },
        { label: 'Concierge Service', active: true },
        { label: 'Same-Day Availability', active: true },
        { label: 'Premium Cleaners Only', active: true },
      ],
    }

    return tierBenefits[card.tier] || tierBenefits.premium
  }, [card])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No Membership Card Found</h2>
          <p className="text-muted-foreground mb-4">You don't have a tSmartCard membership yet.</p>
          <Button asChild>
            <Link href="/tsmartcard">Get Your tSmartCard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const tierColors: Record<string, string> = {
    premium: 'from-indigo-500 to-purple-600',
    pro: 'from-blue-500 to-cyan-600',
    elite: 'from-amber-500 to-orange-600',
  }

  const tierLabels: Record<string, string> = {
    premium: 'PREMIUM',
    pro: 'PRO',
    elite: 'ELITE',
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Renewal Reminder Banner */}
      {card.needsRenewal && !card.isExpired && (
        <Card className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-100">
                  Renewal Reminder
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Your membership expires in {card.daysUntilRenewal} days. {card.auto_renew ? 'Auto-renewal is enabled.' : 'Enable auto-renewal to continue enjoying benefits.'}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRenew}>
              Renew Now
            </Button>
          </div>
        </Card>
      )}

      {card.isExpired && (
        <Card className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-semibold text-red-900 dark:text-red-100">
                  Membership Expired
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Your membership has expired. Renew now to continue enjoying benefits.
                </div>
              </div>
            </div>
            <Button size="sm" onClick={handleRenew}>
              Renew Now
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">tSmartCard Member Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}! Manage your premium membership and track your savings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Digital Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Your Digital Card</div>
              <div className="flex items-center gap-2">
                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                  {card.status}
                </Badge>
                {!card.is_activated && (
                  <Badge variant="outline" className="text-amber-600">
                    Not Activated
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="relative">
                <div className={`aspect-[85/54] rounded-2xl bg-gradient-to-tr ${tierColors[card.tier] || tierColors.premium} shadow-2xl ring-1 ring-white/20 p-6 md:p-8 text-white`}>
                  <div className="flex items-center justify-between text-white/90">
                    <span className="font-semibold">tSmartCleaning</span>
                    <span className="text-xs">{tierLabels[card.tier] || 'PREMIUM'}</span>
                  </div>
                  <div className="mt-8">
                    <div className="text-2xl font-semibold">tSmartCard</div>
                    <div className="text-xs opacity-80">{tierLabels[card.tier] || 'PREMIUM'} MEMBER</div>
                  </div>
                  <div className="mt-10">
                    <div className="text-sm tracking-widest">{card.card_number_masked}</div>
                    <div className="text-[10px] opacity-80 mt-1">
                      VALID THRU {new Date(card.expiration_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {!card.is_activated && (
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setShowActivationModal(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Activate Card
                  </Button>
                )}
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
              {savings.breakEvenOrders > 0 && (
                <div className="text-xs text-muted-foreground">
                  Card paid for itself after {savings.breakEvenOrders} orders
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <Stat label="Total Saved" value={formatCurrency(savings.totalSaved)} />
              <Stat label="Orders Placed" value={`${savings.orders}`} />
              <Stat label="Card Cost" value={formatCurrency(savings.cardCost)} />
              <Stat label="Net Benefit" value={formatCurrency(savings.netBenefit)} positive={savings.netBenefit > 0} />
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Progress to next $100 saved</div>
              <Progress value={Math.min(100, (savings.totalSaved % 100) / 100 * 100)} />
            </div>
          </Card>

          {/* Usage Tracking */}
          <Card className="p-6">
            <div className="font-semibold mb-4 inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Usage Tracking
            </div>
            {usage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No usage data yet. Start booking to see your savings!</p>
              </div>
            ) : (
              <Tabs defaultValue="recent">
                <TabsList>
                  <TabsTrigger value="recent">Recent Orders</TabsTrigger>
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="recent" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {usage.slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-md border p-4 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{formatDate(item.order_date)}</div>
                          <Badge variant="outline" className="text-xs">
                            {item.benefit_type || 'discount'}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mb-2">{item.service_name || 'Service'}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-xs text-muted-foreground">Original</div>
                            <div className="font-medium">{formatCurrency(item.original_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">You Paid</div>
                            <div className="font-medium">{formatCurrency(item.final_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Saved</div>
                            <div className="font-medium text-green-600">
                              -{formatCurrency(item.discount_amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {usage.map((item) => (
                      <div key={item.id} className="rounded-md border p-4 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{formatDate(item.order_date)}</div>
                          <Badge variant="outline" className="text-xs">
                            {item.benefit_type || 'discount'}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mb-2">{item.service_name || 'Service'}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-xs text-muted-foreground">Original</div>
                            <div className="font-medium">{formatCurrency(item.original_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">You Paid</div>
                            <div className="font-medium">{formatCurrency(item.final_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Saved</div>
                            <div className="font-medium text-green-600">
                              -{formatCurrency(item.discount_amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/customer">View All Bookings</Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Meta and controls */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="font-semibold mb-3">Membership Status</div>
            <div className="grid gap-2 text-sm">
              <Row label="Member Since" value={formatDate(card.purchase_date)} />
              <Row label="Card Number" value={card.card_number} />
              <Row label="Renewal Date" value={formatDate(card.expiration_date)} />
              <Row label="Status" value={card.status.charAt(0).toUpperCase() + card.status.slice(1)} />
              <Row label="Auto-Renew" value={card.auto_renew ? 'ON' : 'OFF'} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => card.isExpired ? handleRenew() : setShowUpgradeModal(true)}>
                {card.isExpired ? 'Renew Now' : 'Upgrade'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleToggleAutoRenew(!card.auto_renew)}
              >
                {card.auto_renew ? 'Disable' : 'Enable'} Auto-Renewal
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-3">Your Exclusive Benefits</div>
            <div className="grid gap-2 text-sm">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${b.active ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className={b.active ? '' : 'text-muted-foreground'}>{b.label}</span>
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
              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                {card.referral_code}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copyReferralCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
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
              <Row 
                label="Status" 
                value={card.physical_card_delivered ? 'Delivered ✓' : card.physical_card_shipped ? 'Shipped' : 'Preparing'} 
              />
              {card.tracking_number && (
                <Row 
                  label="Tracking" 
                  value="View Tracking" 
                  href={`/tracking/${card.tracking_number}`} 
                />
              )}
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
          </Card>
        </div>
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Activate Your tSmartCard</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowActivationModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your activation code to activate your membership card. You should have received this code via email.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Activation Code</label>
                <Input
                  type="text"
                  placeholder="Enter activation code"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleActivate}
                  disabled={activating || !activationCode.trim()}
                >
                  {activating ? 'Activating...' : 'Activate Card'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowActivationModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upgrade Your Membership</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUpgradeModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Choose a higher tier to unlock more benefits and savings.
            </p>
            <div className="grid gap-4">
              {card.tier !== 'pro' && (
                <Card className="p-4 border-2">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">Pro Tier</div>
                      <div className="text-sm text-muted-foreground">$149/year • 15% discount</div>
                    </div>
                    <Badge>Upgrade</Badge>
                  </div>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>✓ 15% discount on every order</li>
                    <li>✓ Free rescheduling</li>
                    <li>✓ 1 free upgrade per quarter</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ No booking fees</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade('pro')}
                  >
                    Upgrade to Pro
                  </Button>
                </Card>
              )}
              {card.tier !== 'elite' && (
                <Card className="p-4 border-2 border-amber-200 dark:border-amber-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">Elite Tier</div>
                      <div className="text-sm text-muted-foreground">$199/year • 20% discount</div>
                    </div>
                    <Badge className="bg-amber-600">Best Value</Badge>
                  </div>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>✓ 20% discount on every order</li>
                    <li>✓ Unlimited rescheduling</li>
                    <li>✓ Monthly free upgrade</li>
                    <li>✓ Concierge service</li>
                    <li>✓ Same-day availability</li>
                    <li>✓ Premium cleaners only</li>
                  </ul>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    onClick={() => handleUpgrade('elite')}
                  >
                    Upgrade to Elite
                  </Button>
                </Card>
              )}
              {card.tier === 'elite' && (
                <div className="text-center py-4 text-muted-foreground">
                  You're already on the highest tier!
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
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
