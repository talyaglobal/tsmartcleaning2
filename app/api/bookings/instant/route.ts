import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { computePrice } from '@/lib/pricing'
import { requireTenantId } from '@/lib/tenant'
import { recordUsageEvent } from '@/lib/usage'

type Interval = { start: number; end: number }
const parseTimeToMinutes = (t: string) => {
  const [hh, mm] = t.split(':').map((s) => parseInt(s, 10))
  return hh * 60 + (isNaN(mm) ? 0 : mm)
}
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end

// Instant booking endpoint:
// Input JSON:
// {
//   customerId: string,
//   serviceId: string,
//   date: string (YYYY-MM-DD),
//   time: string (HH:MM 24h),
//   durationHours?: number (default 2),
//   addressId: string,
//   notes?: string
// }
// Behavior: Finds an available provider and creates a confirmed booking immediately.
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const body = await request.json().catch(() => ({}))
    const {
      customerId,
      serviceId,
      date,
      time,
      durationHours: rawDuration,
      addressId,
      notes,
    } = body

    if (!customerId || !serviceId || !date || !time || !addressId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    const durationHours = Math.max(1, Math.min(8, Number(rawDuration || 2)))

    const supabase = createServerSupabase(tenantId)

    // 1) Candidate providers
    const { data: providersData, error: providersError } = await supabase
      .from('provider_profiles')
      .select('id, availability_status')
      .eq('tenant_id', tenantId)
    if (providersError) {
      console.error('[instant] providers error:', providersError)
      return NextResponse.json({ error: 'Failed to get providers' }, { status: 500 })
    }
    const candidateProviderIds = (providersData || [])
      .filter((p: any) => p.availability_status === 'available')
      .map((p: any) => p.id)
      .filter((id: string) => !!id)

    if (candidateProviderIds.length === 0) {
      return NextResponse.json({ error: 'No providers available' }, { status: 409 })
    }

    // 2) Existing bookings for that date
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('provider_id, booking_time, duration_hours, status')
      .eq('tenant_id', tenantId)
      .eq('booking_date', date)
      .in('provider_id', candidateProviderIds)
      .not('status', 'eq', 'cancelled')
    if (bookingsError) {
      console.error('[instant] bookings error:', bookingsError)
      return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 })
    }

    // 3) Build provider busy map
    const providerBusyMap: Record<string, Interval[]> = {}
    for (const b of bookingsData || []) {
      const startMin = parseTimeToMinutes(b.booking_time as string)
      const dur = Number(b.duration_hours || 0)
      const endMin = startMin + Math.round(dur * 60)
      if (!providerBusyMap[b.provider_id as string]) providerBusyMap[b.provider_id as string] = []
      providerBusyMap[b.provider_id as string].push({ start: startMin, end: endMin })
    }

    // 4) Find a free provider for requested slot
    const requestedStart = parseTimeToMinutes(time as string)
    const requested: Interval = { start: requestedStart, end: requestedStart + durationHours * 60 }
    const freeProviderId = candidateProviderIds.find((pid) => {
      const busy = providerBusyMap[pid] || []
      return !busy.some((bi) => overlaps(requested, bi))
    })

    if (!freeProviderId) {
      return NextResponse.json({ error: 'Requested time not available' }, { status: 409 })
    }

    // 5) Compute price
    const { data: serviceRow } = await supabase
      .from('services')
      .select('base_price')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single()

    const basePrice = Number(serviceRow?.base_price || 0)
    const pricing = computePrice({
      basePrice,
      addonsTotal: 0,
      demandIndex: 0, // Could be inferred from availability/utilization in future
      utilization: 1,
      distanceKm: 0,
      month: new Date(date).getMonth() + 1,
      leadHours: 1, // instant → treat as last-minute
      jobsInCart: 1,
      recurring: null,
      serviceFeePct: 0.1
    })

    // 6) Create confirmed booking
    const { data: created, error: createError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        provider_id: freeProviderId,
        service_id: serviceId,
        address_id: addressId,
        booking_date: date,
        booking_time: time,
        special_instructions: notes ?? null,
        duration_hours: durationHours,
        subtotal: pricing.subtotalBeforeFees,
        service_fee: pricing.serviceFee,
        tax: pricing.tax,
        total_amount: pricing.total,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[instant] create error:', createError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Best-effort usage metering
    recordUsageEvent({
      tenantId,
      resource: 'booking',
      quantity: 1,
      metadata: { booking_id: created.id, source: 'instant' },
    }).catch(() => {})

    return NextResponse.json({
      booking: created,
      message: 'Instant booking confirmed',
    })
  } catch (error) {
    console.error('[instant] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


