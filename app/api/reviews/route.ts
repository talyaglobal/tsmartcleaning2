import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors, logError } from '@/lib/api/errors'
import { validateQueryParams, ValidationSchemas } from '@/lib/api/validation'
import { z } from 'zod'

// Get reviews
export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    if (!tenantId) {
      return ApiErrors.badRequest('Tenant context is required')
    }
    
    // Validate query parameters
    const querySchema = z.object({
      providerId: ValidationSchemas.uuid,
    })
    
    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }
    
    const { providerId } = validation.data

    const supabase = createServerSupabase(tenantId)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) {
      logError('reviews', error, { operation: 'fetch_reviews' })
      return ApiErrors.internalError('Failed to load reviews')
    }

    return NextResponse.json({ reviews: data ?? [] })
  } catch (error) {
    return handleApiError('reviews', error)
  }
}

// Create a review
export const POST = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null }
  ) => {
    try {
    const tenantId = auth.tenantId || resolveTenantFromRequest(request)
    if (!tenantId) {
      return ApiErrors.badRequest('Tenant context is required')
    }

    const body = await request.json().catch(() => ({}))
    const { bookingId, providerId, rating, comment } = body

    if (!bookingId || !providerId || !rating) {
      return ApiErrors.badRequest('Missing required fields: bookingId, providerId, and rating are required')
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return ApiErrors.badRequest('Rating must be a number between 1 and 5')
    }

    // Verify user owns the booking (unless admin)
    const isAdmin = isAdminRole(auth.user.role)
    const { data: booking } = await auth.supabase
      .from('bookings')
      .select('customer_id, provider_id, status')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .single()

    if (!booking) {
      return ApiErrors.notFound('Booking not found')
    }

    // Only the customer who made the booking can create a review (or admin)
    if (!isAdmin && booking.customer_id !== auth.user.id) {
      return ApiErrors.forbidden('You can only review bookings you made')
    }

    // Verify booking is completed (unless admin)
    if (!isAdmin && booking.status !== 'completed') {
      return ApiErrors.forbidden('You can only review completed bookings')
    }

    // Verify provider matches booking (unless admin)
    if (!isAdmin && booking.provider_id !== providerId) {
      return ApiErrors.badRequest('Provider ID does not match the booking')
    }

    // Check if review already exists
    const { data: existingReview } = await auth.supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('customer_id', auth.user.id)
      .single()

    if (existingReview) {
      return ApiErrors.conflict('You have already reviewed this booking')
    }

    const { data, error } = await auth.supabase
      .from('reviews')
      .insert({ 
        tenant_id: tenantId, 
        booking_id: bookingId, 
        provider_id: providerId, 
        customer_id: auth.user.id,
        rating, 
        comment 
      })
      .select()
      .single()

    if (error) {
      logError('reviews', error, { operation: 'create_review' })
      return ApiErrors.internalError('Failed to create review')
    }

    return NextResponse.json({ review: data, message: 'Review created successfully' })
  } catch (error) {
    logError('reviews', error)
    return ApiErrors.internalError('An unexpected error occurred')
  }
  }
)
