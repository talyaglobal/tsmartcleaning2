'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface AnalyticsData {
  summary: {
    totalEvents: number
    uniqueUsers: number
    uniqueSessions: number
    totalConversions: number
    totalConversionValue: number
  }
  eventCountsByCategory: Record<string, number>
  topEvents: Array<{ name: string; count: number }>
  timeSeries: Array<{ date: string; count: number }>
  period: {
    startDate: string
    endDate: string
  }
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date().toISOString()

      const response = await fetch(`/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">No analytics data available</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track user behavior, conversions, and platform performance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded ${period === '7d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded ${period === '30d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('90d')}
            className={`px-4 py-2 rounded ${period === '90d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Events</div>
          <div className="text-2xl font-bold mt-1">{data.summary.totalEvents.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Unique Users</div>
          <div className="text-2xl font-bold mt-1">{data.summary.uniqueUsers.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Unique Sessions</div>
          <div className="text-2xl font-bold mt-1">{data.summary.uniqueSessions.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Conversions</div>
          <div className="text-2xl font-bold mt-1">{data.summary.totalConversions.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Conversion Value</div>
          <div className="text-2xl font-bold mt-1">
            ${data.summary.totalConversionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Events Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timeSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Events" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Event Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Events by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(data.eventCountsByCategory).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Events</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topEvents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

