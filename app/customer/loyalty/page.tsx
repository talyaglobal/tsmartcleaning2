'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Award, TrendingUp, Clock, Gift, Star, Trophy, Users, Copy, CheckCircle2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
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

interface Achievement {
  id: string
  code: string
  name: string
  bonus_points: number
  once_per_user: boolean
  earned: boolean
  awardedAt: string | null
}

interface ReferralData {
  referralCode: string
  referralsAsReferrer: Array<{
    id: string
    referrer_id: string
    referee_id: string
    status: string
    rewarded_at: string | null
    created_at: string
  }>
  referralsAsReferee: Array<{
    id: string
    referrer_id: string
    referee_id: string
    status: string
    rewarded_at: string | null
    created_at: string
  }>
  stats: {
    totalReferrals: number
    completedReferrals: number
    pendingReferrals: number
  }
}

export default function CustomerLoyaltyPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userId) {
      loadLoyaltyData()
    }
  }, [userId])

  const loadLoyaltyData = async () => {
    if (!userId) return
    try {
      const [balanceRes, transactionsRes, achievementsRes, referralsRes] = await Promise.all([
        fetch(`/api/loyalty/balance?user_id=${userId}`),
        fetch(`/api/loyalty/transactions?user_id=${userId}&limit=50`),
        fetch(`/api/loyalty/achievements?user_id=${userId}`),
        fetch(`/api/loyalty/referrals?user_id=${userId}`),
      ])
      
      const balanceData = await balanceRes.json()
      const transactionsData = await transactionsRes.json()
      const achievementsData = await achievementsRes.json()
      const referralsData = await referralsRes.json()
      
      setBalance(balanceData)
      setTransactions(transactionsData.transactions || [])
      setAchievements(achievementsData.achievements || [])
      setReferralData(referralsData)
    } catch (error) {
      console.error('Error loading loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = async () => {
    if (!referralData?.referralCode) return
    try {
      await navigator.clipboard.writeText(referralData.referralCode)
      setCopied(true)
      toast.success('Referral code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferralCode = async () => {
    if (!referralData?.referralCode) return
    const shareText = `Join me on TSmart Cleaning! Use my referral code: ${referralData.referralCode}`
    const shareUrl = `${window.location.origin}/signup?ref=${referralData.referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TSmart Cleaning',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copying
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast.success('Referral link copied to clipboard')
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

        {/* Tabs for different sections */}
        <Tabs defaultValue="transactions" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
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
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Achievements & Badges</h2>
              {achievements.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No achievements available yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border-2 rounded-lg ${
                        achievement.earned
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {achievement.earned ? (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Award className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold">{achievement.name}</h3>
                        </div>
                        {achievement.earned && (
                          <Badge variant="default" className="bg-yellow-500">
                            Earned
                          </Badge>
                        )}
                      </div>
                      {achievement.bonus_points > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          +{achievement.bonus_points} bonus points
                        </div>
                      )}
                      {achievement.earned && achievement.awardedAt && (
                        <div className="text-xs text-muted-foreground">
                          Earned {format(new Date(achievement.awardedAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <div className="space-y-6">
              {/* Referral Code Card */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      value={referralData?.referralCode || ''}
                      readOnly
                      className="font-mono text-lg"
                    />
                  </div>
                  <Button onClick={copyReferralCode} variant="outline" size="icon">
                    {copied ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                  <Button onClick={shareReferralCode} variant="default">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share your referral code with friends! You'll both earn bonus points when they sign up and complete their first booking.
                </p>
              </Card>

              {/* Referral Stats */}
              {referralData && (
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Total Referrals</div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold">{referralData.stats.totalReferrals}</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {referralData.stats.completedReferrals}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Pending</div>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {referralData.stats.pendingReferrals}
                    </div>
                  </Card>
                </div>
              )}

              {/* Referral History */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Referral History</h2>
                {referralData && referralData.referralsAsReferrer.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    No referrals yet. Share your code to get started!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralData?.referralsAsReferrer.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              Referred user {referral.referee_id.substring(0, 8)}...
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {format(new Date(referral.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            referral.status === 'completed'
                              ? 'default'
                              : referral.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {referral.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

