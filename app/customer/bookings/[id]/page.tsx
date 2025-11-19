'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, Phone, Mail, X, CalendarIcon as CalendarIconLucide, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createAnonSupabase } from '@/lib/supabase'

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  status: string
  payment_status: string
  total_amount: number
  subtotal: number
  service_fee: number
  tax: number
  duration_hours: number
  special_instructions?: string
  cancellation_reason?: string
  cancelled_at?: string
  service?: { name: string; description?: string }
  address?: { street_address: string; apt_suite?: string; city: string; state: string; zip_code: string }
  provider?: { business_name: string; rating?: number; phone?: string; email?: string }
  customer?: { full_name: string; email: string; phone?: string }
  is_recurring_instance?: boolean
  recurring_booking_id?: string
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  const loadBooking = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/bookings/${bookingId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load booking')
      }
      const data = await res.json()
      setBooking(data.booking)
    } catch (err: any) {
      setError(err.message || 'Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTimes = async (date: string) => {
    if (!booking || !date) return
    try {
      const res = await fetch(`/api/bookings/availability?date=${date}&providerId=${booking.provider?.business_name || ''}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableTimes(data.availableSlots?.map((s: any) => s.time) || [])
      }
    } catch (err) {
      console.error('Failed to load available times:', err)
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    try {
      setProcessing(true)
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_reason: cancellationReason || undefined,
          process_refund: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }

      const data = await res.json()
      setSuccessMessage(data.refundProcessed 
        ? 'Booking cancelled and refund processed successfully' 
        : 'Booking cancelled successfully')
      setShowCancelDialog(false)
      setCancellationReason('')
      await loadBooking()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking')
    } finally {
      setProcessing(false)
    }
  }

  const handleReschedule = async () => {
    if (!booking || !rescheduleDate || !rescheduleTime) return
    try {
      setProcessing(true)
      const dateStr = format(rescheduleDate, 'yyyy-MM-dd')
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: rescheduleTime,
          durationHours: booking.duration_hours,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reschedule booking')
      }

      setSuccessMessage('Booking rescheduled successfully')
      setShowRescheduleDialog(false)
      setRescheduleDate(undefined)
      setRescheduleTime('')
      await loadBooking()
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule booking')
    } finally {
      setProcessing(false)
    }
  }

  const canCancel = booking && !['cancelled', 'completed'].includes(booking.status)
  const canReschedule = booking && !['cancelled', 'completed', 'in-progress'].includes(booking.status)

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="text-center">Loading booking details...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="text-center text-destructive">
              {error || 'Booking not found'}
            </div>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/customer')}>Back to Dashboard</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
  const isPast = bookingDateTime < new Date()

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName="User" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <p className="text-muted-foreground">Manage your booking</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/customer')}>
              Back to Dashboard
            </Button>
          </div>

          {successMessage && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span>{successMessage}</span>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Booking Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{booking.service?.name || 'Service'}</h2>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      booking.status === 'confirmed' ? 'default' :
                      booking.status === 'completed' ? 'outline' :
                      booking.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {booking.status}
                  </Badge>
                  {booking.is_recurring_instance && (
                    <Badge variant="secondary">Recurring</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${Number(booking.total_amount || 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>

            {/* Action Buttons */}
            {canCancel && (
              <div className="flex gap-2 mt-4">
                {canReschedule && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRescheduleDialog(true)
                      if (rescheduleDate) {
                        loadAvailableTimes(format(rescheduleDate, 'yyyy-MM-dd'))
                      }
                    }}
                  >
                    Reschedule
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </Card>

          {/* Booking Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Booking Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {format(bookingDateTime, 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-medium">
                      {format(bookingDateTime, 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">
                      {Number(booking.duration_hours || 0)} {Number(booking.duration_hours || 0) === 1 ? 'hour' : 'hours'}
                    </div>
                  </div>
                </div>
                {booking.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">
                        {booking.address.street_address}
                        {booking.address.apt_suite && `, ${booking.address.apt_suite}`}
                        <br />
                        {booking.address.city}, {booking.address.state} {booking.address.zip_code}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Provider Information</h3>
              {booking.provider ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Provider</div>
                      <div className="font-medium">{booking.provider.business_name}</div>
                    </div>
                  </div>
                  {booking.provider.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <span className="font-medium">{Number(booking.provider.rating).toFixed(1)} ⭐</span>
                    </div>
                  )}
                  {booking.provider.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{booking.provider.phone}</div>
                      </div>
                    </div>
                  )}
                  {booking.provider.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{booking.provider.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">Provider will be assigned</div>
              )}
            </Card>
          </div>

          {/* Special Instructions */}
          {booking.special_instructions && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Special Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{booking.special_instructions}</p>
            </Card>
          )}

          {/* Cancellation Info */}
          {booking.status === 'cancelled' && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold mb-4 text-red-900">Cancellation Details</h3>
              {booking.cancellation_reason && (
                <div className="mb-2">
                  <div className="text-sm text-muted-foreground mb-1">Reason</div>
                  <div className="font-medium">{booking.cancellation_reason}</div>
                </div>
              )}
              {booking.cancelled_at && (
                <div className="text-sm text-muted-foreground">
                  Cancelled on {format(new Date(booking.cancelled_at), 'MMMM d, yyyy h:mm a')}
                </div>
              )}
            </Card>
          )}

          {/* Pricing Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${Number(booking.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-medium">${Number(booking.service_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${Number(booking.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${Number(booking.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Payment Status: <Badge variant="outline">{booking.payment_status}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? 
              {booking && booking.payment_status === 'paid' && (
                <span className="block mt-2 text-sm">
                  A refund will be processed based on the cancellation policy:
                  <ul className="list-disc list-inside mt-1">
                    <li>More than 24 hours before: Full refund</li>
                    <li>Less than 24 hours before: 50% refund</li>
                  </ul>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCancelDialog(false)
              setCancellationReason('')
            }}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={processing}>
              {processing ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Select a new date and time for your booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !rescheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIconLucide className="mr-2 h-4 w-4" />
                    {rescheduleDate ? format(rescheduleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={(date) => {
                      setRescheduleDate(date)
                      if (date) {
                        loadAvailableTimes(format(date, 'yyyy-MM-dd'))
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {rescheduleDate && (
              <div>
                <Label>New Time</Label>
                <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => {
                        const [hours, minutes] = time.split(':')
                        const date = new Date()
                        date.setHours(parseInt(hours), parseInt(minutes))
                        return (
                          <SelectItem key={time} value={time}>
                            {format(date, 'h:mm a')}
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="" disabled>No available times</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableTimes.length === 0 && rescheduleDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading available times...
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRescheduleDialog(false)
              setRescheduleDate(undefined)
              setRescheduleTime('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleReschedule} 
              disabled={processing || !rescheduleDate || !rescheduleTime}
            >
              {processing ? 'Rescheduling...' : 'Reschedule Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

