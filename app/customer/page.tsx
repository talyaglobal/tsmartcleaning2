import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Star, Plus, Heart, Award, TrendingUp, BookOpen, MessageSquare, Settings, CreditCard, Sparkles, Repeat, CheckSquare, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase'
import { ShieldCheck } from 'lucide-react'
import EmptyState from '@/components/admin/EmptyState'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import { Progress } from '@/components/ui/progress'

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const supabase = createServerSupabase()
  const customerId = searchParams?.userId
  
  // Fetch all dashboard data in parallel
  let upcomingRaw: any[] = []
  let recentRaw: any[] = []
  let stats = {
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    savedProviders: 0,
  }
  let favoriteCleaners: any[] = []
  let loyaltyAccount: any = null
  let addressData: Record<string, any> = {}
  
  try {
    // Fetch bookings with more details
    const [{ data: upcoming }, { data: recent }, { data: allBookings }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, total_amount, service:service_id(name), address_id, provider_id, provider:provider_id(business_name, rating)')
        .modify((q) => (customerId ? q.eq('customer_id', customerId) : q))
        .in('status', ['pending', 'confirmed', 'in-progress'])
        .order('booking_date', { ascending: true })
        .limit(10),
      supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, total_amount, service:service_id(name), provider_id, provider:provider_id(business_name, rating), review:reviews(rating)')
        .modify((q) => (customerId ? q.eq('customer_id', customerId) : q))
        .eq('status', 'completed')
        .order('booking_date', { ascending: false })
        .limit(5),
      supabase
        .from('bookings')
        .select('status, total_amount')
        .modify((q) => (customerId ? q.eq('customer_id', customerId) : q)),
    ])
    
    upcomingRaw = upcoming ?? []
    recentRaw = recent ?? []
    
    // Calculate statistics
    const active = (allBookings ?? []).filter((b: any) => ['pending', 'confirmed', 'in-progress'].includes(b.status))
    const completed = (allBookings ?? []).filter((b: any) => b.status === 'completed')
    const totalSpent = completed.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0)
    
    stats = {
      activeBookings: active.length,
      completedBookings: completed.length,
      totalSpent,
      savedProviders: 0, // Will be updated below
    }
    
    // Fetch addresses for bookings
    const addressIds = [...new Set([...upcomingRaw, ...recentRaw].map((b: any) => b.address_id).filter(Boolean))]
    if (addressIds.length > 0) {
      const { data: addresses } = await supabase
        .from('addresses')
        .select('id, street_address, city, state')
        .in('id', addressIds)
      
      if (addresses) {
        addresses.forEach((addr: any) => {
          addressData[addr.id] = `${addr.street_address}, ${addr.city}, ${addr.state}`
        })
      }
    }
    
    // Fetch favorite cleaners with provider details
    if (customerId) {
      const { data: favorites } = await supabase
        .from('favorite_cleaners')
        .select('provider_id, provider:provider_id(id, business_name, rating, total_reviews, is_verified, availability_status)')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      favoriteCleaners = (favorites ?? []).map((f: any) => ({
        id: f.provider_id,
        name: f.provider?.business_name || 'Unknown',
        rating: Number(f.provider?.rating || 0),
        reviews: f.provider?.total_reviews || 0,
        verified: f.provider?.is_verified || false,
        available: f.provider?.availability_status === 'available',
      }))
      
      stats.savedProviders = favoriteCleaners.length
      
      // Fetch loyalty account
      try {
        await supabase.rpc('ensure_loyalty_account', { p_user_id: customerId })
        const { data: loyalty } = await supabase
          .from('loyalty_accounts')
          .select('*')
          .eq('user_id', customerId)
          .single()
        
        if (loyalty) {
          const thresholds = { Bronze: 0, Silver: 1000, Gold: 5000, Platinum: 15000 }
          const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']
          const currentTierIndex = tierOrder.indexOf(loyalty.tier)
          const nextTier = currentTierIndex < tierOrder.length - 1 ? tierOrder[currentTierIndex + 1] : 'Platinum'
          const nextThreshold = thresholds[nextTier as keyof typeof thresholds]
          const progressToNext = loyalty.tier === 'Platinum' 
            ? 1 
            : Math.max(0, Math.min(1, (loyalty.tier_points_12m || 0) / nextThreshold))
          
          loyaltyAccount = {
            ...loyalty,
            nextTier,
            nextThreshold,
            progressToNext,
          }
        }
      } catch (err) {
        console.error('Error fetching loyalty account:', err)
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  }

  const upcomingBookings = upcomingRaw.map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    provider: b.provider?.business_name || 'Provider',
    date: b.booking_date,
    time: b.booking_time,
    location: addressData[b.address_id] || '',
    status: b.status,
    price: `$${Number(b.total_amount || 0).toFixed(2)}`,
  }))

  const recentBookings = recentRaw.map((b: any) => ({
    id: b.id,
    service: b.service?.name || 'Service',
    provider: b.provider?.business_name || 'Provider',
    date: b.booking_date,
    time: b.booking_time,
    status: b.status,
    rating: b.review?.[0]?.rating || null,
    price: `$${Number(b.total_amount || 0).toFixed(2)}`,
  }))
  
  // Group upcoming bookings by date for calendar view
  const bookingsByDate: Record<string, any[]> = {}
  upcomingBookings.forEach((booking) => {
    const date = booking.date
    if (!bookingsByDate[date]) {
      bookingsByDate[date] = []
    }
    bookingsByDate[date].push(booking)
  })

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
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Bookings</div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{stats.activeBookings}</div>
            <div className="text-xs text-muted-foreground mt-1">Upcoming & in progress</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Completed</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{stats.completedBookings}</div>
            <div className="text-xs text-muted-foreground mt-1">Total bookings</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">${stats.totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Saved Providers</div>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{stats.savedProviders}</div>
            <div className="text-xs text-muted-foreground mt-1">Favorite cleaners</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/book">
                <Plus className="h-5 w-5" />
                <span>Book Service</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/bookings">
                <Calendar className="h-5 w-5" />
                <span>My Bookings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href={`/customer/checklists${customerId ? `?userId=${customerId}` : ''}`}>
                <CheckSquare className="h-5 w-5" />
                <span>Checklists</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href={`/customer/analytics${customerId ? `?userId=${customerId}` : ''}`}>
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href={`/customer/loyalty${customerId ? `?userId=${customerId}` : ''}`}>
                <Sparkles className="h-5 w-5" />
                <span>Loyalty</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href={`/customer/referrals${customerId ? `?userId=${customerId}` : ''}`}>
                <Users className="h-5 w-5" />
                <span>Referrals</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/profile">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/messages">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Loyalty Points Display */}
        {loyaltyAccount && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-bold">Loyalty Rewards</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Earn points with every booking</p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {loyaltyAccount.tier} Member
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Points Balance</span>
                    <span className="text-2xl font-bold text-purple-600">{loyaltyAccount.points_balance?.toLocaleString() || 0}</span>
                  </div>
                  {loyaltyAccount.tier !== 'Platinum' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress to {loyaltyAccount.nextTier}</span>
                        <span>{loyaltyAccount.tier_points_12m || 0} / {loyaltyAccount.nextThreshold}</span>
                      </div>
                      <Progress value={loyaltyAccount.progressToNext * 100} className="h-2" />
                    </div>
                  )}
                </div>
                {loyaltyAccount.streak_count > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span>Booking Streak: {loyaltyAccount.streak_count} bookings</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/customer/loyalty${customerId ? `?userId=${customerId}` : ''}`}>View Details</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/customer/tsmartcard">View Rewards</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Favorite Cleaners */}
        {favoriteCleaners.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Favorite Cleaners</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/find-cleaners">View All</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteCleaners.map((cleaner) => (
                <Card key={cleaner.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{cleaner.name}</h3>
                        {cleaner.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{cleaner.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({cleaner.reviews} reviews)</span>
                      </div>
                    </div>
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cleaner.available ? "default" : "secondary"} className="text-xs">
                      {cleaner.available ? "Available" : "Busy"}
                    </Badge>
                    <Button asChild variant="outline" size="sm" className="ml-auto">
                      <Link href={`/cleaners/${cleaner.id}`}>Book</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Bookings Calendar & List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No upcoming bookings"
                subtitle="When you book a service, your upcoming bookings will appear here."
                actions={
                  <Button asChild size="sm">
                    <Link href="/customer/book">Book a Service</Link>
                  </Button>
                }
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Calendar View */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const today = new Date()
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                    const startDate = new Date(firstDay)
                    startDate.setDate(startDate.getDate() - startDate.getDay())
                    
                    const days: JSX.Element[] = []
                    const currentDate = new Date(startDate)
                    const endDate = new Date(lastDay)
                    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
                    
                    while (currentDate <= endDate) {
                      const dateStr = currentDate.toISOString().split('T')[0]
                      const isCurrentMonth = currentDate.getMonth() === today.getMonth()
                      const isToday = dateStr === today.toISOString().split('T')[0]
                      const dayBookings = bookingsByDate[dateStr] || []
                      
                      days.push(
                        <div
                          key={dateStr}
                          className={`min-h-[60px] p-2 border rounded-md ${
                            isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                          } ${isToday ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className={`text-xs mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {currentDate.getDate()}
                          </div>
                          {dayBookings.length > 0 && (
                            <div className="space-y-1">
                              {dayBookings.slice(0, 2).map((booking) => (
                                <div
                                  key={booking.id}
                                  className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded truncate"
                                  title={booking.service}
                                >
                                  {booking.service}
                                </div>
                              ))}
                              {dayBookings.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayBookings.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                      currentDate.setDate(currentDate.getDate() + 1)
                    }
                    return days
                  })()}
                </div>
              </Card>

              {/* List View */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upcoming Bookings List</h3>
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{booking.service}</h3>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {booking.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>{booking.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/bookings/${booking.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings Widget */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/bookings">View All</Link>
            </Button>
          </div>
          {recentBookings.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No recent activity"
                subtitle="Your completed bookings and recent activity will show here."
                actions={
                  <Button asChild size="sm">
                    <Link href="/customer/book">Book Your First Service</Link>
                  </Button>
                }
                fullHeight
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{booking.service}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{booking.provider}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          {booking.time && (
                            <>
                              <span className="mx-1">•</span>
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{booking.time}</span>
                            </>
                          )}
                        </div>
                        {booking.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < booking.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-xs">Your Rating: {booking.rating}/5</span>
                          </div>
                        )}
                        {!booking.rating && (
                          <div className="text-xs text-muted-foreground italic">
                            No rating yet
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-2xl font-bold">{booking.price}</div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/customer/book?provider=${booking.provider}`}>Book Again</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/customer/bookings/${booking.id}`}>View Details</Link>
                        </Button>
                        {!booking.rating && (
                          <Button size="sm" asChild>
                            <Link href={`/customer/bookings/${booking.id}/review`}>Leave Review</Link>
                          </Button>
                        )}
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
