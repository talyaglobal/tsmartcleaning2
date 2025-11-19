'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Star, 
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  overview: {
    totalBookings: number
    completedBookings: number
    cancelledBookings: number
    totalEarnings: number
    averageRating: number
    totalReviews: number
    completionRate: number
    onTimeRate: number
    responseTime: number // in hours
  }
  bookings: {
    byStatus: { status: string; count: number }[]
    byMonth: { month: string; count: number; earnings: number }[]
    byDayOfWeek: { day: string; count: number }[]
    byService: { service: string; count: number; earnings: number }[]
  }
  performance: {
    ratings: { month: string; rating: number; count: number }[]
    completionRates: { month: string; rate: number }[]
    responseTimes: { month: string; hours: number }[]
  }
  trends: {
    bookingsGrowth: number
    earningsGrowth: number
    ratingTrend: number
  }
}

interface ProviderAnalyticsProps {
  providerId: string
  userId: string
}

export function ProviderAnalytics({ providerId, userId }: ProviderAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [providerId, dateRange])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        providerId,
        dateRange
      })
      const res = await fetch(`/api/providers/${providerId}/analytics?${params.toString()}`)
      if (res.ok) {
        const analyticsData = await res.json()
        setData(analyticsData)
      } else {
        // Fallback to mock data structure if API doesn't exist yet
        setData(getMockData())
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setData(getMockData())
    } finally {
      setLoading(false)
    }
  }

  function getMockData(): AnalyticsData {
    return {
      overview: {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        completionRate: 0,
        onTimeRate: 0,
        responseTime: 0
      },
      bookings: {
        byStatus: [],
        byMonth: [],
        byDayOfWeek: [],
        byService: []
      },
      performance: {
        ratings: [],
        completionRates: [],
        responseTimes: []
      },
      trends: {
        bookingsGrowth: 0,
        earningsGrowth: 0,
        ratingTrend: 0
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading analytics...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">No analytics data available</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookingsChartData = data.bookings.byMonth.map(m => ({
    month: new Date(m.month).toLocaleDateString('en-US', { month: 'short' }),
    bookings: m.count,
    earnings: m.earnings
  }))

  const performanceChartData = data.performance.ratings.map(r => ({
    month: new Date(r.month).toLocaleDateString('en-US', { month: 'short' }),
    rating: r.rating,
    reviews: r.count
  }))

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your performance and growth</p>
        </div>
        <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{data.overview.totalBookings}</div>
            <div className="flex items-center gap-1 text-sm">
              {data.trends.bookingsGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+{data.trends.bookingsGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{data.trends.bookingsGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">${data.overview.totalEarnings.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-sm">
              {data.trends.earningsGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+{data.trends.earningsGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{data.trends.earningsGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1 flex items-center gap-2">
              {data.overview.averageRating > 0 ? data.overview.averageRating.toFixed(1) : 'N/A'}
              {data.overview.averageRating > 0 && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.overview.totalReviews} {data.overview.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{data.overview.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {data.overview.completedBookings} of {data.overview.totalBookings} completed
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          {/* Bookings Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings & Earnings Over Time</CardTitle>
              <CardDescription>Track your booking volume and earnings trends</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bookingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#0088FE" 
                      fill="#0088FE"
                      fillOpacity={0.6}
                      name="Bookings"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#00C49F" 
                      fill="#00C49F"
                      fillOpacity={0.6}
                      name="Earnings ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No booking data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings by Day of Week */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Day of Week</CardTitle>
                <CardDescription>Your busiest days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.bookings.byDayOfWeek.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.bookings.byDayOfWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Status</CardTitle>
                <CardDescription>Current booking distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.bookings.byStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {status.status === 'cancelled' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {status.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                        <span className="text-sm font-medium capitalize">{status.status}</span>
                      </div>
                      <span className="text-sm font-semibold">{status.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Rating Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Trends</CardTitle>
              <CardDescription>How your ratings have changed over time</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#FFBB28" 
                      strokeWidth={2}
                      name="Average Rating"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reviews" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Review Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{data.overview.completionRate.toFixed(1)}%</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.overview.completionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{data.overview.onTimeRate.toFixed(1)}%</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.overview.onTimeRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {data.overview.responseTime > 0 ? `${data.overview.responseTime.toFixed(1)}h` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Time to respond to bookings</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings by Service</CardTitle>
              <CardDescription>Which services generate the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {data.bookings.byService.length > 0 ? (
                <div className="space-y-4">
                  {data.bookings.byService.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{service.service || 'Other'}</div>
                        <div className="text-sm text-muted-foreground">{service.count} bookings</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">${service.earnings.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(service.earnings / service.count).toFixed(2)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No service data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

