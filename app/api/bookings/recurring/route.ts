import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { computePrice } from '@/lib/pricing'
import { sendBookingEmail } from '@/lib/emails/booking/send'
import { withAuth } from '@/lib/auth/rbac'
import { UserRole, isAdminRole } from '@/lib/auth/roles'

// Get all recurring bookings for a user
export const GET = withAuth(
  async (request: NextRequest, { user, supabase, tenantId: authTenantId }) => {
    try {
      const tenantId = authTenantId || requireTenantId(request)
      const { searchParams } = new URL(request.url)
      const requestedUserId = searchParams.get('userId')
      const role = searchParams.get('role') || 'customer'

      // If userId is provided, verify the authenticated user owns it (unless admin)
      const userId = requestedUserId || user.id
      const isAdmin = isAdminRole(user.role)
      
      if (!isAdmin && userId !== user.id) {
        return NextResponse.json(
          { error: 'You can only view your own recurring bookings' },
          { status: 403 }
        )
      }

      // Determine role based on user's actual role if not provided
      const userRole = role === 'provider' || 
        user.role === UserRole.CLEANING_LADY || 
        user.role === UserRole.AMBASSADOR 
        ? 'provider' 
        : 'customer'

      const { data, error } = await supabase
        .from('recurring_bookings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq(userRole === 'provider' ? 'provider_id' : 'customer_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
      console.error('[recurring] Get recurring bookings error:', error)
      return NextResponse.json({ error: 'Failed to load recurring bookings' }, { status: 500 })
    }

    return NextResponse.json({ recurringBookings: data ?? [] })
  } catch (error) {
    console.error('[recurring] Get recurring bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
)

// Create a new recurring booking
export const POST = withAuth(
  async (request: NextRequest, { user, supabase, tenantId: authTenantId }) => {
    try {
      const tenantId = authTenantId || requireTenantId(request)
      const body = await request.json()
      const {
        customerId,
      serviceId,
      addressId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      durationHours,
      startDate,
      endDate,
      notes,
      providerId,
    } = body

      if (!customerId || !serviceId || !addressId || !frequency || !time || !startDate) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }
      
      // Verify user owns the customerId (unless admin)
      const isAdmin = isAdminRole(user.role)
      if (!isAdmin && customerId !== user.id) {
        return NextResponse.json(
          { error: 'You can only create recurring bookings for your own account' },
          { status: 403 }
        )
      }

      // Validate frequency
      if (!['weekly', 'biweekly', 'monthly'].includes(frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency. Must be weekly, biweekly, or monthly' },
          { status: 400 }
        )
      }

      // Validate day_of_week for weekly/biweekly
      if ((frequency === 'weekly' || frequency === 'biweekly') && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
        return NextResponse.json(
          { error: 'dayOfWeek (0-6) is required for weekly/biweekly frequency' },
          { status: 400 }
        )
      }

      // Validate time format
      const isValidTime = /^\d{2}:\d{2}$/.test(String(time))
      if (!isValidTime) {
        return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
      }

      // Fetch base price for the service
      const { data: serviceRow } = await supabase
      .from('services')
      .select('base_price')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single()

      const basePrice = Number(serviceRow?.base_price || 0)

      // Compute pricing
      const pricing = computePrice({
      basePrice,
      addonsTotal: 0,
      demandIndex: 0,
      utilization: 1,
      distanceKm: 0,
      month: new Date(startDate).getMonth() + 1,
      leadHours: 999,
      jobsInCart: 1,
      recurring: frequency,
        serviceFeePct: 0.1
      })

      // Calculate next booking date
      const { data: nextDateResult } = await supabase.rpc('calculate_next_recurring_date', {
      p_frequency: frequency,
      p_start_date: startDate,
      p_day_of_week: dayOfWeek || null,
      p_day_of_month: dayOfMonth || null,
      p_current_date: startDate,
    })

      const nextBookingDate = nextDateResult || startDate

      // Create recurring booking
      const { data: recurringBooking, error: createError } = await supabase
      .from('recurring_bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        provider_id: providerId || null,
        service_id: serviceId,
        address_id: addressId,
        frequency,
        day_of_week: dayOfWeek || null,
        day_of_month: dayOfMonth || null,
        booking_time: time,
        duration_hours: durationHours || 2,
        subtotal: pricing.subtotalBeforeFees,
        service_fee: pricing.serviceFee,
        tax: pricing.tax,
        total_amount: pricing.total,
        start_date: startDate,
        end_date: endDate || null,
        next_booking_date: nextBookingDate,
        special_instructions: notes || null,
        status: 'active',
      })
        .select()
        .single()

      if (createError) {
        console.error('[recurring] Create recurring booking error:', createError)
        return NextResponse.json({ error: 'Failed to create recurring booking' }, { status: 500 })
      }

      // Create the first booking instance
      const { data: firstBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        provider_id: providerId || null,
        service_id: serviceId,
        address_id: addressId,
        booking_date: startDate,
        booking_time: time,
        duration_hours: durationHours || 2,
        special_instructions: notes || null,
        subtotal: pricing.subtotalBeforeFees,
        service_fee: pricing.serviceFee,
        tax: pricing.tax,
        total_amount: pricing.total,
        recurring_booking_id: recurringBooking.id,
        is_recurring_instance: true,
          status: 'pending',
        })
        .select()
        .single()

      if (bookingError) {
        console.error('[recurring] Create first booking instance error:', bookingError)
        // Continue even if first booking creation fails
      } else {
        // Send confirmation email for first booking
        sendBookingEmail(request, firstBooking.id, 'confirmation').catch((error) => {
          console.error('[recurring] Failed to send booking confirmation email:', error)
        })
      }

      return NextResponse.json({
        recurringBooking,
        firstBooking,
        message: 'Recurring booking created successfully',
      })
    } catch (error) {
      console.error('[recurring] Create recurring booking error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

