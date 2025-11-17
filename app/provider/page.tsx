import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, DollarSign, TrendingUp, Users, Star } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase'
import EmptyState from '@/components/admin/EmptyState'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'

export default async function ProviderDashboard({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const supabase = createServerSupabase()
  const providerId = searchParams?.userId
  let upcomingRaw: any[] | null = null
  let recentRaw: any[] | null = null
  try {
    const [{ data: upcoming }, { data: recent }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, total_amount, service:service_id(name)')
        .modify((q) => (providerId ? q.eq('provider_id', providerId) : q))
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .limit(5),
      supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount, service:service_id(name)')
        .modify((q) => (providerId ? q.eq('provider_id', providerId) : q))
        .eq('status', 'completed')
        .order('booking_date', { ascending: false })
        .limit(5),
    ])
    upcomingRaw = upcoming ?? []
    recentRaw = recent ?? []
  } catch {
    upcomingRaw = []
    recentRaw = []
  }

  const upcomingJobs = (upcomingRaw ?? []).map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    customer: 'Customer',
    date: b.booking_date,
    time: b.booking_time,
    location: '',
    status: b.status,
    earnings: `$${Number(b.total_amount || 0)}`,
  }))

  const recentJobs = (recentRaw ?? []).map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    customer: 'Customer',
    date: b.booking_date,
    status: b.status,
    rating: 5,
    earnings: `$${Number(b.total_amount || 0)}`,
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="provider" userName="Provider" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and track your earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Earnings</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">$4,328</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12% from last month</span>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Jobs</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">2</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Completed Jobs</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">48</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold flex items-center gap-2">
              4.9
              <span className="text-base text-muted-foreground">/ 5.0</span>
            </div>
          </Card>
        </div>

        {/* Upcoming Jobs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Jobs</h2>
          {upcomingJobs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No upcoming jobs"
                description="When you accept or get assigned a job, it will appear here."
                action={<Button size="sm" variant="outline">Browse Requests</Button>}
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
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
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>Customer: {job.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{job.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{job.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold text-green-600">{job.earnings}</div>
                      <div className="flex gap-2">
                        {job.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm">Decline</Button>
                            <Button size="sm">Accept</Button>
                          </>
                        )}
                        {job.status === 'confirmed' && (
                          <>
                            <Button variant="outline" size="sm">Contact Customer</Button>
                            <Button size="sm">View Details</Button>
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

        {/* Recent Jobs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Completed Jobs</h2>
          {recentJobs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No recent jobs"
                description="You haven’t completed any jobs yet. Completed jobs will show here."
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
                        <div>Customer: {job.customer}</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{job.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: job.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="ml-1">Customer Rating</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold text-green-600">{job.earnings}</div>
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
