import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Returns time slots with at least one available provider for the given date.
// Optional: durationHours (defaults to 2), serviceId (unused in v1), providerId (to get per-provider slots)
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const providerId = searchParams.get('providerId')
    const durationParam = searchParams.get('durationHours')
    const durationHours = Math.max(1, Math.min(8, Number(durationParam || 2)))

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // 1) Determine candidate providers (online/available)
    const { data: providersData, error: providersError } = await supabase
      .from('provider_profiles')
      .select('id, availability_status')
      .eq('tenant_id', tenantId)
    if (providersError) {
      console.error('[availability] providers error:', providersError)
      return NextResponse.json({ error: 'Failed to get providers' }, { status: 500 })
    }
    const candidateProviderIds = (providersData || [])
      .filter((p: any) => p.availability_status === 'available')
      .map((p: any) => p.id)
      .filter((id: string) => !!id)

    const scopedProviderIds = providerId
      ? candidateProviderIds.filter((id) => id === providerId)
      : candidateProviderIds

    if (scopedProviderIds.length === 0) {
      return NextResponse.json({ date, slots: [] })
    }

    // 2) Fetch bookings on that date for these providers
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('provider_id, booking_time, duration_hours, status')
      .eq('tenant_id', tenantId)
      .eq('booking_date', date)
      .in('provider_id', scopedProviderIds)
      .not('status', 'eq', 'cancelled')
    if (bookingsError) {
      console.error('[availability] bookings error:', bookingsError)
      return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 })
    }

    // 3) Build day slots (09:00-17:00 start times, hourly granularity)
    const toTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const workingStartHour = 9
    const workingEndHour = 17 // last start time can be 17 - duration
    const slotStarts: string[] = []
    for (let h = workingStartHour; h <= workingEndHour - durationHours; h++) {
      slotStarts.push(toTime(h, 0))
    }

    type Interval = { start: number; end: number }
    const parseTimeToMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map((s) => parseInt(s, 10))
      return hh * 60 + (isNaN(mm) ? 0 : mm)
    }
    const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end

    // 4) Build provider schedule for quick overlap checks
    const providerBusyMap: Record<string, Interval[]> = {}
    for (const b of bookingsData || []) {
      const startMin = parseTimeToMinutes(b.booking_time as string)
      const dur = Number(b.duration_hours || 0)
      const endMin = startMin + Math.round(dur * 60)
      if (!providerBusyMap[b.provider_id as string]) providerBusyMap[b.provider_id as string] = []
      providerBusyMap[b.provider_id as string].push({ start: startMin, end: endMin })
    }

    // 5) For each slot, check if at least one provider is free
    const availableSlots: { time: string; availableProviders: number }[] = []
    // If querying for today, filter out past start times
    const todayIso = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (const start of slotStarts) {
      const startMin = parseTimeToMinutes(start)
      if (date === todayIso && startMin < currentMinutes) {
        continue
      }
      const interval: Interval = { start: startMin, end: startMin + durationHours * 60 }
      let freeProviders = 0
      for (const pid of scopedProviderIds) {
        const busy = providerBusyMap[pid] || []
        const isFree = !busy.some((bi) => overlaps(interval, bi))
        if (isFree) freeProviders++
      }
      if (freeProviders > 0) {
        availableSlots.push({ time: start, availableProviders: freeProviders })
      }
    }

    return NextResponse.json({ date, durationHours, slots: availableSlots })
  } catch (error) {
    console.error('[v0] Get availability error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Placeholder: provider self-managed availability (not used for instant booking v1)
export async function POST(request: NextRequest) {
  try {
    const _ = await request.json().catch(() => ({}))
    return NextResponse.json({
      message: 'Availability updated successfully',
    })
  } catch (error) {
    console.error('[v0] Update availability error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
