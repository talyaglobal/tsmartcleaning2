import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, DollarSign, TrendingUp, Users, Star, CheckCircle2, AlertCircle, Zap, Settings, MessageSquare, BarChart3 } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase'
import EmptyState from '@/components/admin/EmptyState'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import Link from 'next/link'
import { ProviderAvailabilityManager } from '@/components/providers/ProviderAvailabilityManager'
import { UpcomingJobsCalendar } from '@/components/providers/UpcomingJobsCalendar'
import { RatingReviewSummary } from '@/components/providers/RatingReviewSummary'

export default async function ProviderDashboard({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const supabase = createServerSupabase()
  const providerId = searchParams?.userId

  // Fetch provider profile data
  let providerProfile: any = null
  let totalEarnings = 0
  let thisMonthEarnings = 0
  let lastMonthEarnings = 0
  let activeJobsCount = 0
  let completedJobsCount = 0
  let upcomingRaw: any[] = []
  let recentRaw: any[] = []
  let reviews: any[] = []
  let performanceMetrics = {
    completionRate: 0,
    onTimeRate: 0,
    avgRating: 0,
    totalReviews: 0,
  }

  try {
    // Get provider profile
    if (providerId) {
      const { data: profile } = await supabase
        .from('provider_profiles')
        .select('*, users:profiles!provider_profiles_user_id_fkey(full_name)')
        .eq('user_id', providerId)
        .single()
      providerProfile = profile
    }

    // Get provider profile ID for bookings query
    const profileId = providerProfile?.id

    if (profileId) {
        // Fetch bookings
        const [{ data: upcoming }, { data: recent }, { data: allBookings }] = await Promise.all([
          supabase
            .from('bookings')
            .select(`
              id, 
              booking_date, 
              booking_time, 
              status, 
              total_amount, 
              service:service_id(name),
              customer:customer_id(id),
              address:address_id(street_address, city, state, zip_code)
            `)
            .eq('provider_id', profileId)
            .in('status', ['pending', 'confirmed'])
            .order('booking_date', { ascending: true })
            .limit(10),
          supabase
            .from('bookings')
            .select(`
              id, 
              booking_date, 
              status, 
              total_amount, 
              service:service_id(name),
              customer:customer_id(id),
              reviews:reviews(rating, comment, created_at)
            `)
            .eq('provider_id', profileId)
            .eq('status', 'completed')
            .order('booking_date', { ascending: false })
            .limit(5),
          supabase
            .from('bookings')
            .select('id, status, booking_date, total_amount')
            .eq('provider_id', profileId),
        ])

        upcomingRaw = upcoming ?? []
        recentRaw = recent ?? []

        // Calculate job counts
        activeJobsCount = (allBookings ?? []).filter((b: any) => 
          ['pending', 'confirmed', 'in-progress'].includes(b.status)
        ).length
        completedJobsCount = (allBookings ?? []).filter((b: any) => 
          b.status === 'completed'
        ).length

        // Calculate performance metrics
        const completed = (allBookings ?? []).filter((b: any) => b.status === 'completed')
        const total = allBookings?.length || 1
        performanceMetrics.completionRate = Math.round((completed.length / total) * 100)

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('rating, comment, created_at, booking:bookings(id)')
          .eq('provider_id', profileId)
          .order('created_at', { ascending: false })
          .limit(5)

        reviews = reviewsData ?? []

        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
          performanceMetrics.avgRating = Math.round(avgRating * 10) / 10
          performanceMetrics.totalReviews = reviews.length
        } else if (providerProfile?.rating) {
          performanceMetrics.avgRating = Number(providerProfile.rating) || 0
          performanceMetrics.totalReviews = providerProfile.total_reviews || 0
        }

        // Fetch earnings from transactions
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
        try {
          const res = await fetch(
            `${baseUrl}/api/transactions?role=provider&userId=${encodeURIComponent(providerId)}`,
            { cache: 'no-store' }
          ).then((r) => r.json()).catch(() => ({ transactions: [] }))

          const transactions = res.transactions || []
          totalEarnings = transactions.reduce((s: number, t: any) => s + Number(t.amount || 0), 0)

          const now = new Date()
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

          thisMonthEarnings = transactions
            .filter((t: any) => new Date(t.created_at) >= thisMonthStart)
            .reduce((s: number, t: any) => s + Number(t.amount || 0), 0)

          lastMonthEarnings = transactions
            .filter((t: any) => {
              const date = new Date(t.created_at)
              return date >= lastMonthStart && date <= lastMonthEnd
            })
            .reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
        } catch (error) {
          // Fallback to provider profile earnings if transactions API fails
          totalEarnings = Number(providerProfile?.total_earnings || 0)
        }
    }
  } catch (error) {
    console.error('Error fetching provider data:', error)
  }

  const earningsGrowth = lastMonthEarnings > 0 
    ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : 0

  const upcomingJobs = upcomingRaw.map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    customerId: b.customer?.id || '',
    date: b.booking_date,
    time: b.booking_time,
    location: b.address 
      ? `${b.address.street_address}, ${b.address.city}, ${b.address.state} ${b.address.zip_code}`
      : 'Location not specified',
    status: b.status,
    earnings: Number(b.total_amount || 0),
  }))

  const recentJobs = recentRaw.map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    customerId: b.customer?.id || '',
    date: b.booking_date,
    status: b.status,
    rating: b.reviews?.[0]?.rating || null,
    review: b.reviews?.[0]?.comment || null,
    earnings: Number(b.total_amount || 0),
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="provider" userName={providerProfile?.users?.full_name || "Provider"} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and track your earnings</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/provider/bookings">
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                    <Calendar className="h-5 w-5" />
                    <span>View All Bookings</span>
                  </Button>
                </Link>
                <Link href="/provider/earnings">
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                    <DollarSign className="h-5 w-5" />
                    <span>View Earnings</span>
                  </Button>
                </Link>
                <Link href={`/provider/analytics?userId=${providerId}`}>
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                    <BarChart3 className="h-5 w-5" />
                    <span>Analytics</span>
                  </Button>
                </Link>
                <Link href="/provider/profile">
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                    <Settings className="h-5 w-5" />
                    <span>Edit Profile</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Earnings</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">${totalEarnings.toFixed(2)}</div>
            {earningsGrowth !== 0 && (
              <div className={`text-xs flex items-center gap-1 ${earningsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 ${earningsGrowth < 0 ? 'rotate-180' : ''}`} />
                <span>{earningsGrowth > 0 ? '+' : ''}{earningsGrowth}% from last month</span>
              </div>
            )}
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Jobs</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{activeJobsCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {upcomingRaw.length} upcoming
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Completed Jobs</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{completedJobsCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.completionRate}% completion rate
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold flex items-center gap-2">
              {performanceMetrics.avgRating > 0 ? performanceMetrics.avgRating.toFixed(1) : 'N/A'}
              {performanceMetrics.avgRating > 0 && (
                <span className="text-base text-muted-foreground">/ 5.0</span>
              )}
            </div>
            {performanceMetrics.totalReviews > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {performanceMetrics.totalReviews} {performanceMetrics.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            )}
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Completion Rate</div>
                  <div className="text-3xl font-bold mb-2">{performanceMetrics.completionRate}%</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${performanceMetrics.completionRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">On-Time Rate</div>
                  <div className="text-3xl font-bold mb-2">{performanceMetrics.onTimeRate}%</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${performanceMetrics.onTimeRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">This Month Earnings</div>
                  <div className="text-3xl font-bold text-green-600">${thisMonthEarnings.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lastMonthEarnings > 0 && (
                      <span>
                        Last month: ${lastMonthEarnings.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Jobs Calendar */}
          <div className="lg:col-span-2">
            <UpcomingJobsCalendar jobs={upcomingJobs} providerId={providerProfile?.id} />
          </div>

          {/* Rating & Review Summary */}
          <div>
            <RatingReviewSummary 
              rating={performanceMetrics.avgRating}
              totalReviews={performanceMetrics.totalReviews}
              recentReviews={reviews}
            />
          </div>
        </div>

        {/* Availability Management */}
        <div className="mb-8">
          <ProviderAvailabilityManager providerId={providerProfile?.id} />
        </div>

        {/* Upcoming Jobs List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Upcoming Jobs</h2>
            <Link href="/provider/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {upcomingJobs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No upcoming jobs"
                subtitle="When you accept or get assigned a job, it will appear here."
                actions={<Button size="sm" variant="outline">Browse Requests</Button>}
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.slice(0, 5).map((job) => (
                <Card key={job.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{job.service}</h3>
                        <Badge variant={job.status === 'confirmed' ? 'secondary' : 'outline'}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{new Date(job.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{job.time || 'Time TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold text-green-600">${job.earnings.toFixed(2)}</div>
                      <div className="flex gap-2">
                        {job.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm">Decline</Button>
                            <Button size="sm">Accept</Button>
                          </>
                        )}
                        {job.status === 'confirmed' && (
                          <>
                            <Button variant="outline" size="sm">Contact</Button>
                            <Link href={`/provider/bookings?bookingId=${job.id}`}>
                              <Button size="sm">View Details</Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed Jobs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Completed Jobs</h2>
          {recentJobs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No recent jobs"
                subtitle="You haven't completed any jobs yet. Completed jobs will show here."
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Card key={job.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{job.service}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {job.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(job.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        {job.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < job.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                            <span className="ml-1">({job.rating}/5)</span>
                          </div>
                        )}
                        {job.review && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-md">
                            <p className="text-sm italic">"{job.review}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold text-green-600">${job.earnings.toFixed(2)}</div>
                      <Button variant="outline" size="sm">View Receipt</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
