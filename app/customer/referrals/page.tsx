'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Copy, Check, Gift, Share2, Mail, MessageSquare } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import { format } from 'date-fns'

interface ReferralData {
  referralCode: string | null
  referralCount: number
  referralCredits: number
  referrals: Array<{
    id: string
    referee_id: string
    status: string
    rewarded_at: string | null
    created_at: string
    referee?: {
      email: string
      full_name: string
    }
  }>
  referralLink: string | null
}

export default function CustomerReferralsPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userId) {
      loadReferralData()
    }
  }, [userId])

  const loadReferralData = async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/customers/${userId}/referrals`)
      const data = await response.json()
      setReferralData(data)
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferral = async () => {
    if (!referralData?.referralLink) return

    const shareData = {
      title: 'Join tSmartCleaning',
      text: 'Get $20 off your first cleaning service! Use my referral link:',
      url: referralData.referralLink,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyToClipboard(referralData.referralLink)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading referral data...</div>
        </div>
      </div>
    )
  }

  if (!referralData) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              You need an active membership card to participate in the referral program.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!referralData.referralCode) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Referral Code</h2>
            <p className="text-muted-foreground mb-6">
              You need an active membership card to get a referral code. Purchase a membership to start referring friends!
            </p>
            <Button asChild>
              <a href="/tsmartcard">Get Membership</a>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const completedReferrals = referralData.referrals.filter(r => r.status === 'completed')
  const pendingReferrals = referralData.referrals.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Referrals</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{referralData.referralCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Friends invited</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Completed</div>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {completedReferrals.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Signed up & booked</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Referral Credits</div>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              ${referralData.referralCredits.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Earned credits</div>
          </Card>
        </div>

        {/* Referral Code & Link */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralData.referralCode}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(referralData.referralCode!)}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Referral Link</label>
              <div className="flex gap-2">
                <Input
                  value={referralData.referralLink || ''}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(referralData.referralLink!)}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button onClick={shareReferral}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Share Your Code</h3>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code or link with friends and family
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">They Sign Up</h3>
              <p className="text-sm text-muted-foreground">
                Your friend signs up using your code and books their first service
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">You Both Earn</h3>
              <p className="text-sm text-muted-foreground">
                You earn 500 points, they earn 200 points when they complete their first booking
              </p>
            </div>
          </div>
        </Card>

        {/* Referral History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Referral History</h2>
          {referralData.referrals.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet. Start sharing your code to earn rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralData.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {referral.status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {referral.referee?.full_name || referral.referee?.email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={referral.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {referral.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                    {referral.status === 'completed' && referral.rewarded_at && (
                      <div className="text-sm text-muted-foreground">
                        Rewarded {format(new Date(referral.rewarded_at), 'MMM d')}
                      </div>
                    )}
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

