import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminBookingsPage() {
  // Placeholder: Admin list all bookings API not implemented yet; show empty list
  const bookings: any[] = []
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const stats = await fetch(`${baseUrl}/api/admin/stats`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => ({} as any))

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
            <p className="text-muted-foreground">Monitor and manage all platform bookings</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." className="pl-9" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Bookings</div>
            <div className="text-3xl font-bold">{stats?.bookingsCount ?? 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Active Today</div>
            <div className="text-3xl font-bold">{stats?.activeToday ?? 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Pending</div>
            <div className="text-3xl font-bold">{stats?.pendingCount ?? 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Disputes</div>
            <div className="text-3xl font-bold">{stats?.disputesCount ?? 0}</div>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Booking ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Provider</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Service</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Commission</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">{booking.id}</td>
                    <td className="px-6 py-4 text-sm">{booking.customer}</td>
                    <td className="px-6 py-4 text-sm">{booking.provider}</td>
                    <td className="px-6 py-4 text-sm">{booking.service}</td>
                    <td className="px-6 py-4 text-sm">
                      {booking.date}<br />
                      <span className="text-muted-foreground">{booking.time}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{booking.amount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{booking.commission}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        variant={
                          booking.status === 'completed' ? 'secondary' :
                          booking.status === 'confirmed' ? 'default' :
                          'outline'
                        }
                        className={
                          booking.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          ''
                        }
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No bookings to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
