'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Award, TrendingUp, Clock, Gift, Star } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import { format } from 'date-fns'

interface LoyaltyBalance {
  points: number
  tier: string
  tierPoints12m: number
  tierBonus: number
  streakCount: number
  lastBookingAt: string | null
  progressToNext: number
  nextTier: string
  nextThreshold: number
}

interface LoyaltyTransaction {
  id: string
  delta_points: number
  source_type: string
  source_id: string | null
  metadata: any
  created_at: string
}

export default function CustomerLoyaltyPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadLoyaltyData()
    }
  }, [userId])

  const loadLoyaltyData = async () => {
    if (!userId) return
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch(`/api/loyalty/balance?user_id=${userId}`),
        fetch(`/api/loyalty/transactions?user_id=${userId}&limit=50`),
      ])
      
      const balanceData = await balanceRes.json()
      const transactionsData = await transactionsRes.json()
      
      setBalance(balanceData)
      setTransactions(transactionsData.transactions || [])
    } catch (error) {
      console.error('Error loading loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-gradient-to-r from-purple-600 to-pink-600'
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500'
      case 'Silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-600'
      default:
        return 'bg-gradient-to-r from-amber-600 to-amber-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return <Star className="h-6 w-6" />
      case 'Gold':
        return <Award className="h-6 w-6" />
      case 'Silver':
        return <TrendingUp className="h-6 w-6" />
      default:
        return <Sparkles className="h-6 w-6" />
    }
  }

  const formatSourceType = (sourceType: string) => {
    const types: Record<string, string> = {
      earn: 'Booking',
      redemption: 'Redemption',
      refund: 'Refund',
      referral: 'Referral',
      milestone: 'Milestone',
      badge: 'Badge',
      adjustment: 'Adjustment',
    }
    return types[sourceType] || sourceType
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading loyalty data...</div>
        </div>
      </div>
    )
  }

  if (!balance) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">No loyalty account found</div>
        </div>
      </div>
    )
  }

  const thresholds = {
    Bronze: 0,
    Silver: 1000,
    Gold: 5000,
    Platinum: 15000,
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Loyalty Rewards</h1>
          <p className="text-muted-foreground">Track your points, tier progress, and rewards</p>
        </div>

        {/* Tier Card */}
        <Card className={`p-8 mb-8 text-white ${getTierColor(balance.tier)}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getTierIcon(balance.tier)}
                <h2 className="text-3xl font-bold">{balance.tier} Member</h2>
              </div>
              <p className="text-white/90">
                {balance.tierBonus * 100}% bonus on all bookings
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/20 text-white border-white/30">
              {balance.points.toLocaleString()} Points
            </Badge>
          </div>

          {balance.tier !== 'Platinum' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to {balance.nextTier}</span>
                <span>
                  {balance.tierPoints12m.toLocaleString()} / {balance.nextThreshold.toLocaleString()} points
                </span>
              </div>
              <Progress value={balance.progressToNext * 100} className="h-3 bg-white/20" />
              <p className="text-sm text-white/80">
                {Math.max(0, balance.nextThreshold - balance.tierPoints12m).toLocaleString()} points until {balance.nextTier}
              </p>
            </div>
          )}
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Points Balance</div>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{balance.points.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Available to redeem</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">12-Month Points</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{balance.tierPoints12m.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">For tier calculation</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Booking Streak</div>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{balance.streakCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {balance.streakCount >= 2 ? 'Streak bonus active!' : 'Keep booking to build streak'}
            </div>
          </Card>
        </div>

        {/* Tier Benefits */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tier Benefits</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {['Bronze', 'Silver', 'Gold', 'Platinum'].map((tier) => {
              const isCurrentTier = tier === balance.tier
              const isUnlocked = thresholds[tier as keyof typeof thresholds] <= balance.tierPoints12m
              
              return (
                <div
                  key={tier}
                  className={`p-4 border-2 rounded-lg ${
                    isCurrentTier
                      ? 'border-primary bg-primary/5'
                      : isUnlocked
                      ? 'border-green-200 bg-green-50'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{tier}</h3>
                    {isCurrentTier && <Badge variant="default">Current</Badge>}
                    {isUnlocked && !isCurrentTier && (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {tier === 'Bronze' && '0 points'}
                    {tier === 'Silver' && '1,000 points'}
                    {tier === 'Gold' && '5,000 points'}
                    {tier === 'Platinum' && '15,000 points'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tier === 'Bronze' && 'Base tier'}
                    {tier === 'Silver' && '10% bonus'}
                    {tier === 'Gold' && '20% bonus'}
                    {tier === 'Platinum' && '30% bonus'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No transactions yet. Start booking to earn points!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                >
                  <div className="flex items-center gap-4">
                    {transaction.delta_points > 0 ? (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {formatSourceType(transaction.source_type)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                      {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(transaction.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.delta_points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.delta_points > 0 ? '+' : ''}
                    {transaction.delta_points.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

