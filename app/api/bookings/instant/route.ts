import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { computePrice } from '@/lib/pricing'
import { requireTenantId } from '@/lib/tenant'
import { recordUsageEvent } from '@/lib/usage'
import { sendBookingEmail } from '@/lib/emails/booking/send'

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

    // Check for active membership card to apply discount
    let membershipDiscount = 0
    let membershipCardId: string | null = null
    let membershipDiscountPercentage = 0

    const { data: membershipCard } = await supabase
      .from('membership_cards')
      .select('id, discount_percentage')
      .eq('user_id', customerId) // Assuming customerId maps to user_id
      .eq('status', 'active')
      .eq('is_activated', true)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (membershipCard) {
      membershipCardId = membershipCard.id
      membershipDiscountPercentage = Number(membershipCard.discount_percentage || 0)
    }

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

    // Apply membership discount to subtotal before fees
    if (membershipDiscountPercentage > 0) {
      membershipDiscount = (pricing.subtotalBeforeFees * membershipDiscountPercentage) / 100
      pricing.subtotalBeforeFees = Math.max(0, pricing.subtotalBeforeFees - membershipDiscount)
      
      // Recalculate service fee and tax based on discounted subtotal
      pricing.serviceFee = Math.round(pricing.subtotalBeforeFees * 0.1 * 100) / 100
      const taxBase = pricing.subtotalBeforeFees + pricing.serviceFee
      pricing.tax = Math.round(taxBase * 0.13 * 100) / 100 // Assuming 13% tax rate
      pricing.total = Math.round((pricing.subtotalBeforeFees + pricing.serviceFee + pricing.tax) * 100) / 100
    }

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

    // Record membership usage if discount was applied
    if (membershipCardId && membershipDiscount > 0) {
      // Get service name for usage tracking
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', serviceId)
        .single()

      const originalAmount = pricing.subtotalBeforeFees + membershipDiscount + pricing.serviceFee + pricing.tax
      const finalAmount = pricing.total

      await supabase
        .from('membership_usage')
        .insert({
          membership_card_id: membershipCardId,
          booking_id: created.id,
          user_id: customerId,
          order_date: new Date(date + 'T' + time).toISOString(),
          service_name: service?.name || 'Cleaning Service',
          original_amount: originalAmount,
          discount_amount: membershipDiscount,
          final_amount: finalAmount,
          benefit_type: 'discount',
          metadata: {
            discount_percentage: membershipDiscountPercentage,
            booking_id: created.id,
            source: 'instant',
          },
        }).catch((error) => {
          console.error('[membership] Error recording usage:', error)
        })

      // Update membership card statistics
      const { data: currentCard } = await supabase
        .from('membership_cards')
        .select('total_savings, order_count')
        .eq('id', membershipCardId)
        .single()

      if (currentCard) {
        const newTotalSavings = Number(currentCard.total_savings || 0) + membershipDiscount
        const newOrderCount = (currentCard.order_count || 0) + 1

        await supabase
          .from('membership_cards')
          .update({
            total_savings: newTotalSavings,
            order_count: newOrderCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', membershipCardId)
          .catch((error) => {
            console.error('[membership] Error updating card stats:', error)
          })
      }
    }

    // Best-effort usage metering
    recordUsageEvent({
      tenantId,
      resource: 'booking',
      quantity: 1,
      metadata: { booking_id: created.id, source: 'instant' },
    }).catch(() => {})

    // Send confirmed email (instant bookings are already confirmed)
    sendBookingEmail(request, created.id, 'confirmed').catch((error) => {
      console.error('[instant] Failed to send booking confirmed email:', error)
    })

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


