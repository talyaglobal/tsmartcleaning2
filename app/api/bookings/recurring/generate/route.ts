import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendBookingEmail } from '@/lib/emails/booking/send'

/**
 * Generate upcoming booking instances for active recurring bookings
 * This should be run periodically (e.g., daily via cron) to create future booking instances
 * POST /api/bookings/recurring/generate
 * Body: { daysAhead?: number } (default: 30)
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    
    const body = await request.json().catch(() => ({}))
    const daysAhead = body.daysAhead || 30

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)
    const endDateStr = endDate.toISOString().split('T')[0]

    // Find all active recurring bookings that need instances generated
    const { data: recurringBookings, error: fetchError } = await supabase
      .from('recurring_bookings')
      .select('*')
      .eq('status', 'active')
      .not('next_booking_date', 'is', null)
      .lte('next_booking_date', endDateStr)
      .or(`end_date.is.null,end_date.gte.${endDateStr}`)

    if (fetchError) {
      console.error('[recurring-generate] Fetch recurring bookings error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch recurring bookings' }, { status: 500 })
    }

    if (!recurringBookings || recurringBookings.length === 0) {
      return NextResponse.json({
        processed: 0,
        created: 0,
        message: 'No recurring bookings need instances generated',
      })
    }

    let created = 0
    let errors = 0

    for (const recurring of recurringBookings) {
      try {
        // Check if booking instance already exists for next_booking_date
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('recurring_booking_id', recurring.id)
          .eq('booking_date', recurring.next_booking_date)
          .limit(1)
          .single()

        if (existing) {
          // Instance already exists, calculate next date and update recurring booking
          const { data: nextDateResult } = await supabase.rpc('calculate_next_recurring_date', {
            p_frequency: recurring.frequency,
            p_start_date: recurring.start_date,
            p_day_of_week: recurring.day_of_week || null,
            p_day_of_month: recurring.day_of_month || null,
            p_current_date: recurring.next_booking_date,
          })

          if (nextDateResult) {
            await supabase
              .from('recurring_bookings')
              .update({ next_booking_date: nextDateResult })
              .eq('id', recurring.id)
          }
          continue
        }

        // Create booking instance
        const { data: booking, error: createError } = await supabase
          .from('bookings')
          .insert({
            tenant_id: recurring.tenant_id,
            customer_id: recurring.customer_id,
            provider_id: recurring.provider_id || null,
            service_id: recurring.service_id,
            address_id: recurring.address_id,
            booking_date: recurring.next_booking_date,
            booking_time: recurring.booking_time,
            duration_hours: recurring.duration_hours,
            special_instructions: recurring.special_instructions || null,
            subtotal: recurring.subtotal,
            service_fee: recurring.service_fee,
            tax: recurring.tax,
            total_amount: recurring.total_amount,
            recurring_booking_id: recurring.id,
            is_recurring_instance: true,
            status: 'pending',
          })
          .select()
          .single()

        if (createError) {
          console.error(`[recurring-generate] Failed to create booking for recurring ${recurring.id}:`, createError)
          errors++
          continue
        }

        // Calculate next booking date
        const { data: nextDateResult } = await supabase.rpc('calculate_next_recurring_date', {
          p_frequency: recurring.frequency,
          p_start_date: recurring.start_date,
          p_day_of_week: recurring.day_of_week || null,
          p_day_of_month: recurring.day_of_month || null,
          p_current_date: recurring.next_booking_date,
        })

        // Update recurring booking with next date
        if (nextDateResult) {
          await supabase
            .from('recurring_bookings')
            .update({ next_booking_date: nextDateResult })
            .eq('id', recurring.id)
        } else {
          // No more dates, mark as cancelled
          await supabase
            .from('recurring_bookings')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('id', recurring.id)
        }

        // Send confirmation email
        sendBookingEmail(request, booking.id, 'confirmation').catch((error) => {
          console.error(`[recurring-generate] Failed to send email for booking ${booking.id}:`, error)
        })

        created++
      } catch (error) {
        console.error(`[recurring-generate] Error processing recurring booking ${recurring.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      processed: recurringBookings.length,
      created,
      errors,
      message: `Generated ${created} booking instances from ${recurringBookings.length} recurring bookings`,
    })
  } catch (error: any) {
    console.error('[recurring-generate] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

