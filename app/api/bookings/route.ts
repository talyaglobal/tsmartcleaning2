import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { computePrice } from '@/lib/pricing'
import { recordUsageEvent } from '@/lib/usage'
import { sendBookingEmail } from '@/lib/emails/booking/send'
import { withAuth } from '@/lib/auth/rbac'
import { UserRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateQueryParams, validateRequestBody, RequestSchemas, ValidationSchemas } from '@/lib/api/validation'
import { z } from 'zod'

// Get all bookings for the authenticated user
export const GET = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      const tenantId = resolveTenantFromRequest(request) || null
      // Validate query parameters
      const querySchema = z.object({
        role: z.string().optional(),
      })
      
      const validation = validateQueryParams(request, querySchema)
      if (!validation.success) {
        return validation.response
      }
      
      const role = validation.data.role || 'customer'

      // Determine which column to filter by based on user role
      let query = supabase
        .from('bookings')
        .select('*')
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      // Filter by user's role - customers see their bookings, providers see their assigned bookings
      if (user.role === UserRole.CLEANING_LADY || user.role === UserRole.AMBASSADOR || role === 'provider') {
        query = query.eq('provider_id', user.id)
      } else {
        query = query.eq('customer_id', user.id)
      }

      const { data, error } = await query
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        return handleApiError('bookings', error, { userId: user.id, tenantId })
      }

      return NextResponse.json({ bookings: data ?? [] })
    } catch (error) {
      return handleApiError('bookings', error)
    }
  }
)

// Create a new booking
export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      const tenantId = resolveTenantFromRequest(request)
      if (!tenantId) {
        return ApiErrors.badRequest('Tenant context is required')
      }
      
      // Validate request body
      const bookingSchema = RequestSchemas.createBooking.extend({
        customerId: ValidationSchemas.uuid.optional(),
      })
      
      const validation = await validateRequestBody(request, bookingSchema)
      if (!validation.success) {
        return validation.response
      }
      
      const { customerId, serviceId, date, time, addressId, notes } = validation.data

      // Verify customerId matches authenticated user (unless user is admin)
      const isAdmin = [UserRole.ROOT_ADMIN, UserRole.PARTNER_ADMIN, UserRole.TSMART_TEAM, UserRole.CLEANING_COMPANY].includes(user.role)
      const finalCustomerId = customerId || user.id

      if (!isAdmin && finalCustomerId !== user.id) {
        return ApiErrors.forbidden('You can only create bookings for yourself')
      }
      
      // Validate date/time and avoid past times for same day
      const todayIso = new Date().toISOString().slice(0, 10)
      if (date === todayIso) {
        const [hh, mm] = String(time).split(':').map((s) => parseInt(s, 10))
        const requestedMinutes = hh * 60 + (isNaN(mm) ? 0 : mm)
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        if (requestedMinutes < currentMinutes) {
          return ApiErrors.conflict('Requested time is in the past')
        }
      }

      // Fetch base price for the service
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
        .eq('user_id', finalCustomerId)
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

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          tenant_id: tenantId,
          customer_id: finalCustomerId,
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
        logError('bookings', error, { operation: 'create_booking', userId: user.id, tenantId })
        return ApiErrors.databaseError('Failed to create booking')
      }

      // Award gamification points for job posting (async, don't block)
      try {
        const { processGamificationUpdates } = await import('@/lib/gamification/integration')
        await processGamificationUpdates(
          {
            supabase,
            userId: finalCustomerId,
            userType: 'company', // Companies post jobs
            tenantId,
          },
          'job_posted',
          { jobId: data.id }
        )
      } catch (gamificationError) {
        // Don't fail the booking if gamification fails
        console.error('[bookings] Gamification error:', gamificationError)
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
            booking_id: data.id,
            user_id: finalCustomerId,
            order_date: new Date(date + 'T' + time).toISOString(),
            service_name: service?.name || 'Cleaning Service',
            original_amount: originalAmount,
            discount_amount: membershipDiscount,
            final_amount: finalAmount,
            benefit_type: 'discount',
            metadata: {
              discount_percentage: membershipDiscountPercentage,
              booking_id: data.id,
            },
          }).catch((error) => {
            logError('membership', error, { operation: 'record_usage', bookingId: data.id })
          })

        // Update membership card statistics
        // First fetch current values, then update
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
              logError('membership', error, { operation: 'update_card_stats', membershipCardId })
            })
        }
      }

      // Best-effort usage metering
      recordUsageEvent({
        tenantId,
        resource: 'booking',
        quantity: 1,
        metadata: { booking_id: data.id, source: 'standard' },
      }).catch(() => {})

      // Send confirmation email (best-effort, don't fail the request if email fails)
      sendBookingEmail(request, data.id, 'confirmation').catch((error) => {
        logError('bookings', error, { operation: 'send_confirmation_email', bookingId: data.id })
      })

      return NextResponse.json({ booking: data, message: 'Booking created successfully' })
    } catch (error) {
      return handleApiError('bookings', error, { operation: 'create_booking', userId: user.id })
    }
  }
)
