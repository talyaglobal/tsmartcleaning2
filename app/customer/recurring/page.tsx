'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Repeat, Pause, Play, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createAnonSupabase } from '@/lib/supabase'

interface RecurringBooking {
  id: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
  booking_time: string
  duration_hours: number
  total_amount: number
  status: 'active' | 'paused' | 'cancelled'
  start_date: string
  end_date?: string
  next_booking_date?: string
  special_instructions?: string
  service?: { name: string }
  address?: { street_address: string; apt_suite?: string; city: string; state: string; zip_code: string }
  provider?: { business_name: string; rating?: number }
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function RecurringBookingsPage() {
  const router = useRouter()
  const [recurringBookings, setRecurringBookings] = useState<RecurringBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    booking: RecurringBooking | null
    action: 'pause' | 'cancel' | 'resume' | null
  }>({ open: false, booking: null, action: null })
  const [processing, setProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadUserId()
  }, [])

  useEffect(() => {
    if (userId) {
      loadRecurringBookings()
    }
  }, [userId])

  const loadUserId = async () => {
    try {
      const supabase = createAnonSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        setError('Please log in to view your recurring bookings')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user')
      setLoading(false)
    }
  }

  const loadRecurringBookings = async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/bookings/recurring?userId=${encodeURIComponent(userId)}&role=customer`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load recurring bookings')
      }
      const data = await res.json()
      setRecurringBookings(data.recurringBookings || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load recurring bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionDialog.booking || !actionDialog.action) return

    try {
      setProcessing(true)
      const booking = actionDialog.booking

      if (actionDialog.action === 'cancel') {
        const res = await fetch(`/api/bookings/recurring/${booking.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to cancel recurring booking')
        }

        setSuccessMessage('Recurring booking cancelled successfully')
      } else if (actionDialog.action === 'pause') {
        const res = await fetch(`/api/bookings/recurring/${booking.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause' }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to pause recurring booking')
        }

        setSuccessMessage('Recurring booking paused successfully')
      } else if (actionDialog.action === 'resume') {
        const res = await fetch(`/api/bookings/recurring/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to resume recurring booking')
        }

        setSuccessMessage('Recurring booking resumed successfully')
      }

      setActionDialog({ open: false, booking: null, action: null })
      await loadRecurringBookings()
    } catch (err: any) {
      setError(err.message || 'Failed to perform action')
    } finally {
      setProcessing(false)
    }
  }

  const getFrequencyLabel = (booking: RecurringBooking) => {
    if (booking.frequency === 'weekly') {
      return `Every ${DAYS_OF_WEEK[booking.day_of_week || 0]}`
    } else if (booking.frequency === 'biweekly') {
      return `Every other ${DAYS_OF_WEEK[booking.day_of_week || 0]}`
    } else {
      return `Monthly on day ${booking.day_of_month || 1}`
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="text-center">Loading recurring bookings...</div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName="User" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Recurring Bookings</h1>
              <p className="text-muted-foreground">Manage your recurring cleaning services</p>
            </div>
            <Button onClick={() => router.push('/customer/book')}>
              Create Recurring Booking
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

          {recurringBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recurring Bookings</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any recurring bookings yet. Create one to schedule regular cleaning services.
              </p>
              <Button onClick={() => router.push('/customer/book')}>
                Create Recurring Booking
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {recurringBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {booking.service?.name || 'Cleaning Service'}
                        </h3>
                        <Badge
                          variant={
                            booking.status === 'active' ? 'default' :
                            booking.status === 'paused' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Repeat className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-sm text-muted-foreground">Frequency</div>
                            <div className="font-medium">{getFrequencyLabel(booking)}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-sm text-muted-foreground">Time</div>
                            <div className="font-medium">{formatTime(booking.booking_time)}</div>
                          </div>
                        </div>
                        {booking.next_booking_date && (
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="text-sm text-muted-foreground">Next Booking</div>
                              <div className="font-medium">
                                {format(new Date(booking.next_booking_date), 'MMMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 mt-0.5" />
                          <div>
                            <div className="text-sm text-muted-foreground">Price per Visit</div>
                            <div className="font-medium">${Number(booking.total_amount || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        {booking.address && (
                          <div className="flex items-start gap-3 md:col-span-2">
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
                      {booking.special_instructions && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground mb-1">Special Instructions</div>
                          <div className="text-sm">{booking.special_instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {booking.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionDialog({ open: true, booking, action: 'pause' })}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setActionDialog({ open: true, booking, action: 'cancel' })}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionDialog({ open: true, booking, action: 'resume' })}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, booking: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'cancel' && 'Cancel Recurring Booking'}
              {actionDialog.action === 'pause' && 'Pause Recurring Booking'}
              {actionDialog.action === 'resume' && 'Resume Recurring Booking'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'cancel' && (
                'Are you sure you want to cancel this recurring booking? This will stop all future bookings. Existing confirmed bookings will remain scheduled.'
              )}
              {actionDialog.action === 'pause' && (
                'Are you sure you want to pause this recurring booking? You can resume it later. Existing confirmed bookings will remain scheduled.'
              )}
              {actionDialog.action === 'resume' && (
                'Resume this recurring booking? Future bookings will be scheduled according to the frequency pattern.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, booking: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'cancel' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

