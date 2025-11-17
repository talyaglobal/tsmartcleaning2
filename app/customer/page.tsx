import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Star, Plus } from 'lucide-react'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase'
import { ShieldCheck } from 'lucide-react'
import EmptyState from '@/components/admin/EmptyState'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const supabase = createServerSupabase()
  const customerId = searchParams?.userId
  let upcomingRaw: any[] | null = null
  let recentRaw: any[] | null = null
  try {
    const [{ data: upcoming }, { data: recent }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, total_amount, service:service_id(name)')
        .modify((q) => (customerId ? q.eq('customer_id', customerId) : q))
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .limit(5),
      supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount, service:service_id(name)')
        .modify((q) => (customerId ? q.eq('customer_id', customerId) : q))
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

  const upcomingBookings = (upcomingRaw ?? []).map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    provider: 'Provider',
    date: b.booking_date,
    time: b.booking_time,
    location: '',
    status: b.status,
    price: `$${Number(b.total_amount || 0)}`,
  }))

  const recentBookings = (recentRaw ?? []).map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    provider: 'Provider',
    date: b.booking_date,
    status: b.status,
    rating: 5,
    price: `$${Number(b.total_amount || 0)}`,
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">Manage your cleaning services and bookings</p>
          </div>
          <Button size="lg" asChild>
            <Link href="/customer/book">
              <Plus className="mr-2 h-4 w-4" />
              Book a Service
            </Link>
          </Button>
        </div>

        {/* Insurance Status (MVP - assumes no insurance) */}
        <div className="mb-8">
          <Card className="p-6 border-amber-200 bg-amber-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <div className="font-semibold">Your home isn’t fully protected</div>
                  <div className="text-sm text-muted-foreground">
                    You’re an annual member but don’t have insurance protection. Add CleanGuard Protection today.
                  </div>
                  <div className="text-xs mt-2 text-amber-700">Recommended for you: Premium Plan ($19.99/mo)</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild><Link href="/insurance#pricing">Add Protection Now</Link></Button>
                <Button variant="outline" asChild><Link href="/insurance">Learn More</Link></Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Active Bookings</div>
            <div className="text-3xl font-bold">2</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Completed</div>
            <div className="text-3xl font-bold">12</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
            <div className="text-3xl font-bold">$1,248</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Saved Providers</div>
            <div className="text-3xl font-bold">3</div>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No upcoming bookings"
                description="When you book a service, your upcoming bookings will appear here."
                action={
                  <Button asChild size="sm">
                    <Link href="/customer/book">Book a Service</Link>
                  </Button>
                }
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{booking.service}</h3>
                        <Badge variant="secondary">{booking.status}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold">{booking.price}</div>
                      <div className="text-sm text-muted-foreground">{booking.provider}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="outline" size="sm">Cancel</Button>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          {recentBookings.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No recent activity"
                description="Your completed bookings and recent activity will show here."
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{booking.service}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>{booking.provider}</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: booking.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="ml-1">Your Rating</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold">{booking.price}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Book Again</Button>
                        <Button variant="outline" size="sm">View Receipt</Button>
                      </div>
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
