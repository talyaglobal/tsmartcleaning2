'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Award, Users } from 'lucide-react'

type BadgeDistributionData = {
  badges: Array<{
    id: string
    name: string
    code: string
    user_type: 'company' | 'cleaner'
    icon?: string
  }>
  distribution: Record<string, number>
  statistics: {
    totalBadges: number
    totalEarned: number
    averageEarned: number
  }
  topBadges: Array<{
    badgeId: string
    badgeName: string
    count: number
  }>
}

type BadgeDistributionProps = {
  data: BadgeDistributionData
}

export function BadgeDistribution({ data }: BadgeDistributionProps) {
  const { badges, distribution, statistics, topBadges } = data

  // Calculate distribution by user type
  const companyBadges = badges.filter((b) => b.user_type === 'company')
  const cleanerBadges = badges.filter((b) => b.user_type === 'cleaner')

  const companyEarned = companyBadges.reduce(
    (sum, badge) => sum + (distribution[badge.id] || 0),
    0
  )
  const cleanerEarned = cleanerBadges.reduce(
    (sum, badge) => sum + (distribution[badge.id] || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{statistics.totalBadges}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{statistics.totalEarned}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Average Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{statistics.averageEarned.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Earn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">
                {statistics.totalBadges > 0
                  ? ((statistics.totalEarned / statistics.totalBadges) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution by User Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Badges:</span>
                <span className="font-semibold">{companyBadges.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Earned:</span>
                <span className="font-semibold">{companyEarned}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Average per Badge:</span>
                <span className="font-semibold">
                  {companyBadges.length > 0
                    ? (companyEarned / companyBadges.length).toFixed(1)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleaner Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Badges:</span>
                <span className="font-semibold">{cleanerBadges.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Earned:</span>
                <span className="font-semibold">{cleanerEarned}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Average per Badge:</span>
                <span className="font-semibold">
                  {cleanerBadges.length > 0
                    ? (cleanerEarned / cleanerBadges.length).toFixed(1)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Top Badges by Earn Count</CardTitle>
        </CardHeader>
        <CardContent>
          {topBadges.length > 0 ? (
            <div className="space-y-3">
              {topBadges.map((badge, index) => {
                const badgeData = badges.find((b) => b.id === badge.badgeId)
                return (
                  <div key={badge.badgeId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{badgeData?.icon || '🏆'}</div>
                      <div>
                        <div className="font-medium">{badge.badgeName}</div>
                        <div className="text-sm text-slate-500">
                          {badgeData?.user_type === 'company' ? 'Company' : 'Cleaner'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{badge.count}</div>
                      <div className="text-xs text-slate-500">earned</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No badges earned yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

