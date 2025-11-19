import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Get all bookings for admin with filters
export const GET = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const providerId = searchParams.get('providerId')
    const serviceId = searchParams.get('serviceId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = authSupabase || createServerSupabase(tenantId)

    // Build query with joins for customer, provider, and service info
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:users!bookings_customer_id_fkey(id, full_name, email),
        provider:provider_profiles!bookings_provider_id_fkey(id, business_name, user_id),
        service:services(id, name, category),
        address:addresses(id, street_address, city, state)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('booking_date', startDate)
    }

    if (endDate) {
      query = query.lte('booking_date', endDate)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    // Search in customer name, provider name, or service name
    if (search) {
      // Note: Full-text search would require a different approach
      // For now, we'll filter client-side or use ILIKE if needed
    }

    // Order by date and time
    query = query
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .order('created_at', { ascending: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[admin/bookings] get error:', error)
      return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
    }

    // Transform data for easier consumption
    const bookings = (data || []).map((booking: any) => ({
      id: booking.id,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      status: booking.status,
      totalAmount: booking.total_amount,
      subtotal: booking.subtotal,
      serviceFee: booking.service_fee,
      tax: booking.tax,
      durationHours: booking.duration_hours,
      specialInstructions: booking.special_instructions,
      createdAt: booking.created_at,
      customer: booking.customer ? {
        id: booking.customer.id,
        name: booking.customer.full_name,
        email: booking.customer.email,
      } : null,
      provider: booking.provider ? {
        id: booking.provider.id,
        businessName: booking.provider.business_name,
        userId: booking.provider.user_id,
      } : null,
      service: booking.service ? {
        id: booking.service.id,
        name: booking.service.name,
        category: booking.service.category,
      } : null,
      address: booking.address ? {
        id: booking.address.id,
        streetAddress: booking.address.street_address,
        city: booking.address.city,
        state: booking.address.state,
      } : null,
    }))

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
    } catch (error) {
      console.error('[admin/bookings] error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

// Bulk update bookings
export const PATCH = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { bookingIds, status, notes } = await request.json()

      if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return NextResponse.json({ error: 'bookingIds array is required' }, { status: 400 })
      }

      if (!status) {
        return NextResponse.json({ error: 'status is required' }, { status: 400 })
      }

      const supabase = authSupabase || createServerSupabase(tenantId)

    const updateData: any = { status }
    if (notes) {
      updateData.admin_notes = notes
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .in('id', bookingIds)
      .eq('tenant_id', tenantId)
      .select()

    if (error) {
      console.error('[admin/bookings] bulk update error:', error)
      return NextResponse.json({ error: 'Failed to update bookings' }, { status: 500 })
    }

      return NextResponse.json({
        message: `Successfully updated ${data?.length || 0} bookings`,
        updated: data?.length || 0,
      })
    } catch (error) {
      console.error('[admin/bookings] error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

