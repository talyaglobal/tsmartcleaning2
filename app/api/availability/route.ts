import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateQueryParams, validateRequestBody, RequestSchemas } from '@/lib/api/validation'

// Returns time slots with at least one available provider for the given date.
// Optional: durationHours (defaults to 2), serviceId (unused in v1), providerId (to get per-provider slots)
export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    
    // Validate query parameters
    const validation = validateQueryParams(request, RequestSchemas.availabilityQuery)
    if (!validation.success) {
      return validation.response
    }
    
    const { date, dates, providerId, durationHours: durationParam } = validation.data
    const durationHours = Math.max(1, Math.min(8, durationParam || 2))

    const supabase = createServerSupabase(tenantId || undefined)

    // Support fetching availability for a specific provider (for provider dashboard)
    if (providerId && dates) {
      // Fetch existing availability for provider
      const dateArray = dates.split(',').filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      if (dateArray.length > 0) {
        let availabilityQuery = supabase
          .from('availability')
          .select('date, time_slots')
          .eq('provider_id', providerId)
          .in('date', dateArray)
        
        if (tenantId) {
          availabilityQuery = availabilityQuery.eq('tenant_id', tenantId)
        }
        
        const { data: availabilityData, error: availError } = await availabilityQuery
        
        if (availError) {
          return handleApiError('availability', availError, { providerId, tenantId })
        }
        
        return NextResponse.json({
          availability: availabilityData || []
        })
      }
    }

    if (!date) {
      return ApiErrors.badRequest('date is required')
    }

    // 1) Determine candidate providers (online/available)
    let providersQuery = supabase
      .from('provider_profiles')
      .select('id, availability_status')
    
    if (tenantId) {
      providersQuery = providersQuery.eq('tenant_id', tenantId)
    }
    
    const { data: providersData, error: providersError } = await providersQuery
    if (providersError) {
      return handleApiError('availability', providersError, { date, tenantId })
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
    let bookingsQuery = supabase
      .from('bookings')
      .select('provider_id, booking_time, duration_hours, status')
      .eq('booking_date', date)
      .in('provider_id', scopedProviderIds)
      .not('status', 'eq', 'cancelled')
    
    if (tenantId) {
      bookingsQuery = bookingsQuery.eq('tenant_id', tenantId)
    }
    
    const { data: bookingsData, error: bookingsError } = await bookingsQuery
    if (bookingsError) {
      return handleApiError('availability', bookingsError, { date, tenantId })
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
    return handleApiError('availability', error)
  }
}

// Provider self-managed availability
export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    
    // Validate request body
    const validation = await validateRequestBody(request, RequestSchemas.updateAvailability)
    if (!validation.success) {
      return validation.response
    }
    
    const { providerId, availability } = validation.data

    const supabase = createServerSupabase(tenantId || undefined)

    // Verify provider exists
    let providerQuery = supabase
      .from('provider_profiles')
      .select('id')
      .eq('id', providerId)
      .single()
    
    if (tenantId) {
      providerQuery = providerQuery.eq('tenant_id', tenantId)
    }
    
    const { data: provider, error: providerError } = await providerQuery

    if (providerError || !provider) {
      return ApiErrors.notFound('Provider not found')
    }

    // Upsert availability records
    const availabilityRecords = availability.map((avail: { date: string; time_slots: string[] }) => ({
      provider_id: providerId,
      date: avail.date,
      time_slots: avail.time_slots || [],
      tenant_id: tenantId,
    }))

    // Delete existing availability for these dates
    const dates = availabilityRecords.map((a: any) => a.date)
    if (dates.length > 0) {
      let deleteQuery = supabase
        .from('availability')
        .delete()
        .eq('provider_id', providerId)
        .in('date', dates)
      
      if (tenantId) {
        deleteQuery = deleteQuery.eq('tenant_id', tenantId)
      }
      
      await deleteQuery
    }

    // Insert new availability
    if (availabilityRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('availability')
        .insert(availabilityRecords)

      if (insertError) {
        return handleApiError('availability', insertError, { providerId, tenantId })
      }
    }

    return NextResponse.json({
      message: 'Availability updated successfully',
    })
  } catch (error) {
    return handleApiError('availability', error)
  }
}
