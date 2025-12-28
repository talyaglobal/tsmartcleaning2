import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendBookingEmail } from '@/lib/emails/booking/send'
import { computePrice } from '@/lib/pricing'

type Interval = { start: number; end: number }
const parseTimeToMinutes = (t: string) => {
  const [hh, mm] = t.split(':').map((s) => parseInt(s, 10))
  return hh * 60 + (isNaN(mm) ? 0 : mm)
}
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end

/**
 * Reschedule a booking to a new date and/or time
 * POST /api/bookings/[id]/reschedule
 * Body: { date: string (YYYY-MM-DD), time: string (HH:MM), durationHours?: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    
    const body = await request.json()
    const { date, time, durationHours } = body

    if (!date || !time) {
      return NextResponse.json(
        { error: 'date and time are required' },
        { status: 400 }
      )
    }

    // Validate date and time formats
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
    const isValidTime = /^\d{2}:\d{2}$/.test(String(time))
    if (!isValidDate || !isValidTime) {
      return NextResponse.json({ error: 'Invalid date or time format' }, { status: 400 })
    }

    // Reject past times (for same-day bookings)
    const todayIso = new Date().toISOString().slice(0, 10)
    if (date === todayIso) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (parseTimeToMinutes(time) < currentMinutes) {
        return NextResponse.json({ error: 'Requested time is in the past' }, { status: 409 })
      }
    }

    // Fetch existing booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, services(*)')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      console.error('[reschedule] Fetch booking error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
    }

    // Check if booking can be rescheduled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot reschedule a cancelled booking' }, { status: 400 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Cannot reschedule a completed booking' }, { status: 400 })
    }

    if (booking.status === 'in-progress') {
      return NextResponse.json({ error: 'Cannot reschedule a booking that is in progress' }, { status: 400 })
    }

    const duration = durationHours || booking.duration_hours || 2
    const providerId = booking.provider_id

    // If booking has a provider, check their availability
    if (providerId) {
      // Get provider's existing bookings for the new date
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_time, duration_hours, status')
        .eq('tenant_id', tenantId)
        .eq('provider_id', providerId)
        .eq('booking_date', date)
        .neq('id', id) // Exclude current booking
        .not('status', 'eq', 'cancelled')

      if (bookingsError) {
        console.error('[reschedule] Fetch existing bookings error:', bookingsError)
        return NextResponse.json({ error: 'Failed to check provider availability' }, { status: 500 })
      }

      // Check for time slot conflicts
      const requestedStart = parseTimeToMinutes(time)
      const requested: Interval = { start: requestedStart, end: requestedStart + duration * 60 }

      const hasConflict = (existingBookings || []).some((b: any) => {
        const existingStart = parseTimeToMinutes(b.booking_time)
        const existingEnd = existingStart + (Number(b.duration_hours) || 0) * 60
        const existing: Interval = { start: existingStart, end: existingEnd }
        return overlaps(requested, existing)
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Provider is not available at the requested time' },
          { status: 409 }
        )
      }
    }

    // Recalculate pricing if needed (in case of date change affecting pricing)
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services
    const basePrice = Number(service?.base_price || booking.subtotal || 0)
    
    const pricing = computePrice({
      basePrice,
      addonsTotal: 0,
      demandIndex: 0,
      utilization: 1,
      distanceKm: 0,
      month: new Date(date).getMonth() + 1,
      leadHours: Math.max(1, Math.round((new Date(`${date}T${time}`).getTime() - Date.now()) / (1000 * 60 * 60))),
      jobsInCart: 1,
      recurring: null,
      serviceFeePct: 0.1
    })

    // Update booking
    const updateData: any = {
      booking_date: date,
      booking_time: time,
      duration_hours: duration,
      subtotal: pricing.subtotalBeforeFees,
      service_fee: pricing.serviceFee,
      tax: pricing.tax,
      total_amount: pricing.total,
      updated_at: new Date().toISOString(),
    }

    // If status was confirmed, keep it confirmed. Otherwise, set to pending for re-confirmation
    if (booking.status !== 'confirmed') {
      updateData.status = 'pending'
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[reschedule] Update booking error:', updateError)
      return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 })
    }

    // Send confirmation email
    sendBookingEmail(request, id, updatedBooking.status === 'confirmed' ? 'confirmed' : 'confirmation').catch((error) => {
      console.error('[reschedule] Failed to send booking email:', error)
    })

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking rescheduled successfully',
    })
  } catch (error: any) {
    console.error('[reschedule] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

