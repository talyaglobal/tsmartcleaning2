'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Calendar, Clock, Users, Award } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface AnalyticsData {
  spending: {
    totalSpent: number
    monthlySpending: Array<{ month: string; amount: number }>
  }
  savingsCalculator: {
    estimatedPerJobSavings: number
    estimatedAnnualJobs: number
    estimatedAnnualSavings: number
  }
  serviceHistory: {
    recentBookings: Array<{
      id: string
      date: string
      time: string
      status: string
      total: number
    }>
  }
  preferredCleaners: Array<{ providerId: string; jobs: number }>
  peakUsageTimes: Array<{ hour: string; count: number }>
  roiOnMembership: {
    estimatedAnnualSavings: number
    membershipAnnualCost: number
    estimatedNetBenefit: number
  }
}

export default function CustomerAnalyticsPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadAnalytics()
    }
  }, [userId])

  const loadAnalytics = async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/customers/${userId}/analytics`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">No analytics data available</div>
        </div>
      </div>
    )
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatHour = (hour: string) => {
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${displayHour}:00 ${period}`
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights into your cleaning service usage</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              ${analytics.spending.totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Last 6 months</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Est. Annual Savings</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${analytics.savingsCalculator.estimatedAnnualSavings.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">With membership</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Preferred Cleaners</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{analytics.preferredCleaners.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Top providers</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Net Benefit</div>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-3xl font-bold ${
              analytics.roiOnMembership.estimatedNetBenefit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${analytics.roiOnMembership.estimatedNetBenefit.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Annual ROI</div>
          </Card>
        </div>

        {/* Monthly Spending Chart */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Monthly Spending</h2>
          {analytics.spending.monthlySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.spending.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  labelFormatter={(label) => formatMonth(label)}
                />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No spending data available
            </div>
          )}
        </Card>

        {/* Peak Usage Times */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Peak Usage Times</h2>
          {analytics.peakUsageTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.peakUsageTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={formatHour}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value} bookings`}
                  labelFormatter={(label) => formatHour(label)}
                />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No usage time data available
            </div>
          )}
        </Card>

        {/* Savings Calculator */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Savings Calculator</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Per Job Savings</div>
              <div className="text-2xl font-bold">
                ${analytics.savingsCalculator.estimatedPerJobSavings}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Est. Annual Jobs</div>
              <div className="text-2xl font-bold">
                {analytics.savingsCalculator.estimatedAnnualJobs}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Est. Annual Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.savingsCalculator.estimatedAnnualSavings.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        {/* ROI on Membership */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Membership ROI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Est. Annual Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.roiOnMembership.estimatedAnnualSavings.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Membership Cost</div>
              <div className="text-2xl font-bold">
                ${analytics.roiOnMembership.membershipAnnualCost.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Net Benefit</div>
              <div className={`text-2xl font-bold ${
                analytics.roiOnMembership.estimatedNetBenefit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${analytics.roiOnMembership.estimatedNetBenefit.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Service History</h2>
          {analytics.serviceHistory.recentBookings.length > 0 ? (
            <div className="space-y-3">
              {analytics.serviceHistory.recentBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                    <div className="font-semibold">${booking.total.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No recent bookings
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

