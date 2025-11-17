import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { computePrice } from '@/lib/pricing'
import { requireTenantId } from '@/lib/tenant'
import { recordUsageEvent } from '@/lib/usage'

// Get all bookings for a user
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq(role === 'provider' ? 'provider_id' : 'customer_id', userId)
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get bookings supabase error:', error)
      return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings: data ?? [] })
  } catch (error) {
    console.error('[v0] Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new booking
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const body = await request.json()
    const { customerId, serviceId, date, time, addressId, notes } = body

    if (!customerId || !serviceId || !date || !time || !addressId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    // Validate date/time and avoid past times for same day
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
    const isValidTime = /^\d{2}:\d{2}$/.test(String(time))
    if (!isValidDate || !isValidTime) {
      return NextResponse.json({ error: 'Invalid date or time format' }, { status: 400 })
    }
    const todayIso = new Date().toISOString().slice(0, 10)
    if (date === todayIso) {
      const [hh, mm] = String(time).split(':').map((s) => parseInt(s, 10))
      const requestedMinutes = hh * 60 + (isNaN(mm) ? 0 : mm)
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (requestedMinutes < currentMinutes) {
        return NextResponse.json({ error: 'Requested time is in the past' }, { status: 409 })
      }
    }

    const supabase = createServerSupabase()

    // Fetch base price for the service
    const { data: serviceRow } = await supabase
      .from('services')
      .select('base_price')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single()

    const basePrice = Number(serviceRow?.base_price || 0)

    // Compute server-side pricing (minimal inputs; extend as needed)
    const pricing = computePrice({
      basePrice,
      addonsTotal: 0,
      demandIndex: 0,
      utilization: 1,
      distanceKm: 0,
      month: new Date(date).getMonth() + 1,
      leadHours: 999,
      jobsInCart: 1,
      recurring: null,
      serviceFeePct: 0.1
    })

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        service_id: serviceId,
        address_id: addressId,
        booking_date: date,
        booking_time: time,
        special_instructions: notes ?? null,
        duration_hours: 1,
        subtotal: pricing.subtotalBeforeFees,
        service_fee: pricing.serviceFee,
        tax: pricing.tax,
        total_amount: pricing.total,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create booking supabase error:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Best-effort usage metering
    recordUsageEvent({
      tenantId,
      resource: 'booking',
      quantity: 1,
      metadata: { booking_id: data.id, source: 'standard' },
    }).catch(() => {})

    return NextResponse.json({ booking: data, message: 'Booking created successfully' })
  } catch (error) {
    console.error('[v0] Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
