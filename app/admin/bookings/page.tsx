'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BarChart } from '@/components/admin/charts/BarChart'
import { LineChart } from '@/components/admin/charts/LineChart'
import { 
  Search, Filter, Download, Calendar as CalendarIcon, 
  CheckSquare, Square, TrendingUp, DollarSign, 
  Clock, XCircle, CheckCircle2, AlertCircle,
  FileSpreadsheet, FileText, Grid3x3, List
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  bookingDate: string
  bookingTime: string
  status: string
  totalAmount: number
  subtotal: number
  serviceFee: number
  tax: number
  durationHours: number
  specialInstructions?: string
  createdAt: string
  customer?: {
    id: string
    name: string
    email: string
  }
  provider?: {
    id: string
    businessName: string
    userId: string
  }
  service?: {
    id: string
    name: string
    category: string
  }
  address?: {
    id: string
    streetAddress: string
    city: string
    state: string
  }
}

interface Analytics {
  metrics: {
    totalBookings: number
    completedBookings: number
    pendingBookings: number
    cancelledBookings: number
    confirmedBookings: number
    totalRevenue: number
    averageBookingValue: number
    completionRate: number
    cancellationRate: number
  }
  bookingsByStatus: Record<string, number>
  bookingsByDate: Record<string, number>
  revenueByDate: Record<string, number>
  bookingsByCategory: Record<string, number>
  topProviders: Array<{ providerId: string; count: number }>
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [bulkActionDialog, setBulkActionDialog] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkNotes, setBulkNotes] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadBookings()
    loadAnalytics()
  }, [page, statusFilter, startDate, endDate, customerFilter, providerFilter, serviceFilter])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (customerFilter) params.append('customerId', customerFilter)
      if (providerFilter) params.append('providerId', providerFilter)
      if (serviceFilter) params.append('serviceId', serviceFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/admin/bookings/analytics?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings

    const query = searchQuery.toLowerCase()
    return bookings.filter((booking) => {
      return (
        booking.id.toLowerCase().includes(query) ||
        booking.customer?.name.toLowerCase().includes(query) ||
        booking.customer?.email.toLowerCase().includes(query) ||
        booking.provider?.businessName.toLowerCase().includes(query) ||
        booking.service?.name.toLowerCase().includes(query)
      )
    })
  }, [bookings, searchQuery])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(new Set(filteredBookings.map((b) => b.id)))
    } else {
      setSelectedBookings(new Set())
    }
  }

  const handleSelectBooking = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedBookings)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedBookings(newSelected)
  }

  const handleBulkAction = async () => {
    if (selectedBookings.size === 0 || !bulkStatus) return

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: Array.from(selectedBookings),
          status: bulkStatus,
          notes: bulkNotes || undefined,
        }),
      })

      if (res.ok) {
        setBulkActionDialog(false)
        setSelectedBookings(new Set())
        setBulkStatus('')
        setBulkNotes('')
        loadBookings()
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to update bookings')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Booking ID',
      'Date',
      'Time',
      'Customer',
      'Provider',
      'Service',
      'Status',
      'Amount',
      'Created At',
    ]

    const rows = filteredBookings.map((booking) => [
      booking.id,
      booking.bookingDate,
      booking.bookingTime,
      booking.customer?.name || '',
      booking.provider?.businessName || '',
      booking.service?.name || '',
      booking.status,
      booking.totalAmount.toFixed(2),
      booking.createdAt,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; className: string }> = {
      completed: { variant: 'secondary', className: 'bg-green-50 text-green-700 border-green-200' },
      confirmed: { variant: 'default', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      pending: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      cancelled: { variant: 'outline', className: 'bg-red-50 text-red-700 border-red-200' },
      'in-progress': { variant: 'default', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    }

    const config = variants[status] || { variant: 'outline' as const, className: '' }

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  const analyticsData = analytics ? {
    bookingsByDate: Object.entries(analytics.bookingsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30), // Last 30 days
    revenueByDate: Object.entries(analytics.revenueByDate)
      .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30),
    bookingsByStatus: Object.entries(analytics.bookingsByStatus)
      .map(([status, count]) => ({ status, count })),
    bookingsByCategory: Object.entries(analytics.bookingsByCategory)
      .map(([category, count]) => ({ category, count })),
  } : null

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
            <p className="text-muted-foreground">Monitor and manage all platform bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'table' ? 'calendar' : 'table')}
            >
              {viewMode === 'table' ? <CalendarIcon className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
              {viewMode === 'table' ? 'Calendar View' : 'Table View'}
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Bookings</div>
                  <div className="text-3xl font-bold">{analytics.metrics.totalBookings}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold">${analytics.metrics.totalRevenue.toFixed(2)}</div>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                  <div className="text-3xl font-bold">{analytics.metrics.completionRate.toFixed(1)}%</div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Avg Booking Value</div>
                  <div className="text-3xl font-bold">${analytics.metrics.averageBookingValue.toFixed(2)}</div>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setStartDate('')
                    setEndDate('')
                    setCustomerFilter('')
                    setProviderFilter('')
                    setServiceFilter('')
                    setSearchQuery('')
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer ID</Label>
                  <Input
                    placeholder="Customer ID"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider ID</Label>
                  <Input
                    placeholder="Provider ID"
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Bulk Actions */}
            {selectedBookings.size > 0 && (
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkActionDialog(true)}
                    >
                      Bulk Update Status
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBookings(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Bookings Table */}
            {viewMode === 'table' && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <Checkbox
                            checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Booking ID</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Provider</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Service</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Date & Time</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Loading bookings...
                          </td>
                        </tr>
                      ) : filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                            No bookings found.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-muted/30">
                            <td className="px-6 py-4">
                              <Checkbox
                                checked={selectedBookings.has(booking.id)}
                                onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">{booking.id.slice(0, 8)}...</td>
                            <td className="px-6 py-4 text-sm">
                              <div>{booking.customer?.name || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">{booking.customer?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{booking.provider?.businessName || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm">{booking.service?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm">
                              {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
                              <br />
                              <span className="text-muted-foreground">{booking.bookingTime}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">${booking.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">{getStatusBadge(booking.status)}</td>
                            <td className="px-6 py-4 text-sm">
                              <Button variant="ghost" size="sm">View Details</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} bookings
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Calendar view shows bookings by date. Click on a date to see bookings for that day.
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const today = new Date()
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                      const startDate = new Date(firstDay)
                      startDate.setDate(startDate.getDate() - startDate.getDay())
                      
                      const days: JSX.Element[] = []
                      const currentDate = new Date(startDate)
                      
                      for (let i = 0; i < 42; i++) {
                        const dateStr = format(currentDate, 'yyyy-MM-dd')
                        const dayBookings = filteredBookings.filter(
                          (b) => b.bookingDate === dateStr
                        )
                        const isCurrentMonth = currentDate.getMonth() === today.getMonth()
                        const isToday = dateStr === format(today, 'yyyy-MM-dd')
                        
                        days.push(
                          <div
                            key={dateStr}
                            className={cn(
                              'min-h-[80px] p-2 border rounded-lg',
                              !isCurrentMonth && 'opacity-40',
                              isToday && 'border-primary border-2 bg-primary/5'
                            )}
                          >
                            <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>
                              {currentDate.getDate()}
                            </div>
                            {dayBookings.length > 0 && (
                              <div className="space-y-1">
                                {dayBookings.slice(0, 2).map((booking) => (
                                  <div
                                    key={booking.id}
                                    className="text-xs p-1 bg-muted rounded truncate"
                                    title={`${booking.customer?.name || 'N/A'} - ${booking.service?.name || 'N/A'}`}
                                  >
                                    {booking.customer?.name || 'N/A'}
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
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics && analyticsData && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Bookings Trend (Last 30 Days)</h3>
                    <LineChart
                      data={analyticsData.bookingsByDate}
                      xKey="date"
                      yKey="count"
                      height={300}
                    />
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
                    <LineChart
                      data={analyticsData.revenueByDate}
                      xKey="date"
                      yKey="revenue"
                      height={300}
                      color="#10b981"
                    />
                  </Card>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
                    <BarChart
                      data={analyticsData.bookingsByStatus}
                      xKey="status"
                      yKey="count"
                      height={300}
                    />
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Bookings by Category</h3>
                    <BarChart
                      data={analyticsData.bookingsByCategory}
                      xKey="category"
                      yKey="count"
                      height={300}
                      color="#8b5cf6"
                    />
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedBookings.size} selected booking{selectedBookings.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Add notes about this update..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction} disabled={!bulkStatus}>
              Update {selectedBookings.size} Booking{selectedBookings.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
