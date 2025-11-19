import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Get booking analytics
export const GET = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { searchParams } = new URL(request.url)
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const supabase = authSupabase || createServerSupabase()

    // Build base query
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)

    if (startDate) {
      query = query.gte('booking_date', startDate)
    }

    if (endDate) {
      query = query.lte('booking_date', endDate)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('[admin/bookings/analytics] error:', error)
      return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
    }

    const allBookings = bookings || []

    // Calculate metrics
    const totalBookings = allBookings.length
    const completedBookings = allBookings.filter((b: any) => b.status === 'completed').length
    const pendingBookings = allBookings.filter((b: any) => b.status === 'pending').length
    const cancelledBookings = allBookings.filter((b: any) => b.status === 'cancelled').length
    const confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed').length

    const totalRevenue = allBookings
      .filter((b: any) => b.status === 'completed')
      .reduce((sum: number, b: any) => sum + (Number(b.total_amount) || 0), 0)

    const averageBookingValue = completedBookings > 0
      ? totalRevenue / completedBookings
      : 0

    // Bookings by status
    const bookingsByStatus = {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    }

    // Bookings by date (for trend chart)
    const bookingsByDate: Record<string, number> = {}
    allBookings.forEach((booking: any) => {
      const date = booking.booking_date
      bookingsByDate[date] = (bookingsByDate[date] || 0) + 1
    })

    // Revenue by date
    const revenueByDate: Record<string, number> = {}
    allBookings
      .filter((b: any) => b.status === 'completed')
      .forEach((booking: any) => {
        const date = booking.booking_date
        revenueByDate[date] = (revenueByDate[date] || 0) + (Number(booking.total_amount) || 0)
      })

    // Bookings by service category
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, category')
      .eq('tenant_id', tenantId)

    const serviceCategoryMap = new Map(
      (servicesData || []).map((s: any) => [s.id, s.category])
    )

    const bookingsByCategory: Record<string, number> = {}
    allBookings.forEach((booking: any) => {
      const category = serviceCategoryMap.get(booking.service_id) || 'unknown'
      bookingsByCategory[category] = (bookingsByCategory[category] || 0) + 1
    })

    // Top providers by bookings
    const providerBookings: Record<string, number> = {}
    allBookings.forEach((booking: any) => {
      if (booking.provider_id) {
        providerBookings[booking.provider_id] = (providerBookings[booking.provider_id] || 0) + 1
      }
    })

    const topProviders = Object.entries(providerBookings)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([providerId, count]) => ({ providerId, count }))

    return NextResponse.json({
      metrics: {
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        confirmedBookings,
        totalRevenue,
        averageBookingValue,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      },
      bookingsByStatus,
      bookingsByDate,
      revenueByDate,
      bookingsByCategory,
      topProviders,
    })
  } catch (error) {
    console.error('[admin/bookings/analytics] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

