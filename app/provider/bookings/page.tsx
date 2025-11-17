import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, Users, Star } from 'lucide-react'

export default async function ProviderBookingsPage({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const providerId = searchParams?.userId
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  let bookings: any[] = []
  if (providerId) {
    const res = await fetch(
      `${baseUrl}/api/bookings?role=provider&userId=${encodeURIComponent(providerId)}`,
      { cache: 'no-store' }
    ).then((r) => r.json()).catch(() => ({ bookings: [] }))
    bookings = res.bookings || []
  }
  const pendingBookings: any[] = []
  const upcomingBookings: any[] = []
  const completedBookings: any[] = []

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName="Sarah Johnson" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Manage Bookings</h1>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending <Badge className="ml-2" variant="secondary">{pendingBookings.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming <Badge className="ml-2" variant="secondary">{upcomingBookings.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{booking.service}</h3>
                      <Badge variant="outline">New Request</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Customer: {booking.customer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="text-2xl font-bold text-green-600">{booking.earnings}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Decline</Button>
                      <Button size="sm">Accept Job</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{booking.service}</h3>
                      <Badge variant="secondary">Confirmed</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Customer: {booking.customer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="text-2xl font-bold text-green-600">{booking.earnings}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Contact Customer</Button>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.service}</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div>Customer: {booking.customer}</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: booking.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    {booking.review && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm italic">"{booking.review}"</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="text-2xl font-bold text-green-600">{booking.earnings}</div>
                    <Button variant="outline" size="sm">View Receipt</Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
