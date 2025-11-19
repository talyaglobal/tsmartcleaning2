'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { 
  Calendar as CalendarIcon, Clock, MapPin, Users, Star, Filter, 
  MessageSquare, FileText, CheckCircle2, XCircle, AlertCircle, 
  X, Send, Search, Grid3x3, List
} from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  status: string
  total_amount: number
  service?: { name: string }
  customer?: { id: string; email?: string; full_name?: string }
  address?: { street_address: string; city: string; state: string; zip_code: string }
  special_instructions?: string
  notes?: string
  provider_id?: string
  customer_id?: string
}

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedTab, setSelectedTab] = useState('all')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date }>({})
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    loadUserAndBookings()
  }, [])

  const loadUserAndBookings = async () => {
    try {
      const supabase = createAnonSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      if (user?.id) {
        await loadBookings(user.id)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBookings = async (providerUserId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(
        `${baseUrl}/api/bookings?role=provider&userId=${encodeURIComponent(providerUserId)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        await loadBookings(userId!)
        alert(`Booking ${newStatus} successfully`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update booking status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update booking status')
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedBooking) return

    setSavingNotes(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (res.ok) {
        await loadBookings(userId!)
        setShowNotesModal(false)
        alert('Notes saved successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedBooking || !message.trim()) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          recipientEmail: selectedBooking.customer?.email,
        }),
      })

      if (res.ok) {
        setMessage('')
        setShowMessageModal(false)
        alert('Message sent successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const openNotesModal = async (booking: Booking) => {
    setSelectedBooking(booking)
    setNotes(booking.notes || booking.special_instructions || '')
    
    // Load latest notes
    try {
      const res = await fetch(`/api/bookings/${booking.id}/notes`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || '')
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    }
    
    setShowNotesModal(true)
  }

  const openMessageModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setMessage('')
    setShowMessageModal(true)
  }

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    // Date filter
    if (dateFilter.from) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= dateFilter.from!
      })
    }
    if (dateFilter.to) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate <= dateFilter.to!
      })
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(b => b.service?.name === serviceFilter)
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b => 
        b.service?.name?.toLowerCase().includes(query) ||
        b.customer?.full_name?.toLowerCase().includes(query) ||
        b.address?.street_address?.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query)
      )
    }

    // Tab filter
    if (selectedTab === 'pending') {
      filtered = filtered.filter(b => b.status === 'pending')
    } else if (selectedTab === 'upcoming') {
      filtered = filtered.filter(b => ['confirmed', 'in-progress'].includes(b.status))
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(b => b.status === 'completed')
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time}`)
      const dateB = new Date(`${b.booking_date}T${b.booking_time}`)
      return dateA.getTime() - dateB.getTime()
    })
  }, [bookings, statusFilter, dateFilter, serviceFilter, searchQuery, selectedTab])

  // Get unique services for filter
  const services = useMemo(() => {
    const serviceSet = new Set<string>()
    bookings.forEach(b => {
      if (b.service?.name) {
        serviceSet.add(b.service.name)
      }
    })
    return Array.from(serviceSet).sort()
  }, [bookings])

  // Group bookings by date for calendar view
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}
    filteredBookings.forEach(booking => {
      const date = booking.booking_date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(booking)
    })
    return grouped
  }, [filteredBookings])

  // Get dates with bookings for calendar
  const datesWithBookings = useMemo(() => {
    return Object.keys(bookingsByDate).map(date => new Date(date))
  }, [bookingsByDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="provider" userName="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const upcomingCount = bookings.filter(b => ['confirmed', 'in-progress'].includes(b.status)).length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName="Provider" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Manage Bookings</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
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
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={dateFilter.from ? format(dateFilter.from, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={dateFilter.to ? format(dateFilter.to, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
            />
          </div>
        </Card>

        {viewMode === 'list' ? (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">
                Pending <Badge className="ml-2" variant="secondary">{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming <Badge className="ml-2" variant="secondary">{upcomingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No bookings found</p>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStatusUpdate={updateBookingStatus}
                    onOpenNotes={() => openNotesModal(booking)}
                    onOpenMessage={() => openMessageModal(booking)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <CalendarView 
            bookingsByDate={bookingsByDate} 
            onBookingClick={(booking) => {
              setSelectedBooking(booking)
              setViewMode('list')
              setSelectedTab('all')
            }} 
          />
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Booking Notes</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNotesModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Booking #{selectedBooking.id.slice(0, 8)}
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this booking..."
                  className="min-h-32"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Send Message to Customer</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowMessageModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  To: {selectedBooking.customer?.full_name || selectedBooking.customer?.email || 'Customer'}
                </p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-32"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={sendingMessage || !message.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  onStatusUpdate,
  onOpenNotes,
  onOpenMessage,
}: {
  booking: Booking
  onStatusUpdate: (id: string, status: string) => void
  onOpenNotes: () => void
  onOpenMessage: () => void
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM dd, yyyy')
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold">{booking.service?.name || 'Service'}</h3>
            <Badge className={statusColors[booking.status] || ''}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Customer: {booking.customer?.full_name || booking.customer?.email || 'N/A'}</span>
            </div>
            {booking.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {booking.address.street_address}, {booking.address.city}, {booking.address.state}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(booking.booking_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(booking.booking_time)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-3">
          <div className="text-2xl font-bold text-green-600">
            ${Number(booking.total_amount || 0).toFixed(2)}
          </div>
          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate(booking.id, 'cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate(booking.id, 'confirmed')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(booking.id, 'in-progress')}
              >
                Start Job
              </Button>
            )}
            {booking.status === 'in-progress' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(booking.id, 'completed')}
              >
                Complete Job
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onOpenMessage}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenNotes}>
              <FileText className="h-4 w-4 mr-1" />
              Notes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CalendarView({
  bookingsByDate,
  onBookingClick,
}: {
  bookingsByDate: Record<string, Booking[]>
  onBookingClick: (booking: Booking) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const bookingsForSelectedDate = bookingsByDate[selectedDateStr] || []
  
  // Get dates with bookings for calendar highlighting
  const datesWithBookings = Object.keys(bookingsByDate).map(date => new Date(date))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Select Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            hasBookings: datesWithBookings,
          }}
          modifiersClassNames={{
            hasBookings: 'bg-primary/20 text-primary font-semibold',
          }}
        />
      </Card>
      <div className="lg:col-span-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM dd, yyyy') : 'Select a date'}
          </h3>
          {bookingsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No bookings for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingsForSelectedDate.map((booking) => (
                <Card
                  key={booking.id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onBookingClick(booking)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{booking.service?.name || 'Service'}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(`${booking.booking_date}T${booking.booking_time}`), 'h:mm a')}
                      </div>
                    </div>
                    <Badge>{booking.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
