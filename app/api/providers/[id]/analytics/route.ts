import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30d'
    
    const providerId = id

    // Verify provider exists
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('id', providerId)
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(0) // All time
    }

    const startDateStr = startDate.toISOString().slice(0, 10)

    // Fetch bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        total_amount,
        service_id,
        created_at,
        completed_at
      `)
      .eq('provider_id', providerId)
      .gte('booking_date', startDateStr)
      .order('booking_date', { ascending: false })

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, created_at')
      .eq('provider_id', providerId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Fetch transactions for earnings
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at, booking_id')
      .eq('provider_id', providerId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Calculate overview metrics
    const totalBookings = bookings?.length || 0
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0
    const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
    
    const ratings = reviews?.map(r => r.rating) || []
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0
    const totalReviews = ratings.length

    const completionRate = totalBookings > 0
      ? (completedBookings / totalBookings) * 100
      : 0

    // Calculate on-time rate (bookings completed on or before scheduled time)
    const onTimeBookings = bookings?.filter(b => {
      if (b.status !== 'completed' || !b.completed_at || !b.booking_date || !b.booking_time) return false
      const scheduledDateTime = new Date(`${b.booking_date}T${b.booking_time}`)
      const completedDateTime = new Date(b.completed_at)
      return completedDateTime <= scheduledDateTime
    }).length || 0
    const onTimeRate = completedBookings > 0
      ? (onTimeBookings / completedBookings) * 100
      : 0

    // Calculate average response time (time from booking creation to provider acceptance)
    // This would require tracking when provider accepts, for now use a placeholder
    const responseTime = 0 // TODO: Calculate from booking acceptance timestamps

    // Bookings by status
    const statusCounts: Record<string, number> = {}
    bookings?.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
    })
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    // Bookings by month
    const byMonthMap: Record<string, { count: number; earnings: number }> = {}
    bookings?.forEach(b => {
      const date = new Date(b.booking_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      if (!byMonthMap[monthKey]) {
        byMonthMap[monthKey] = { count: 0, earnings: 0 }
      }
      byMonthMap[monthKey].count++
    })
    transactions?.forEach(t => {
      const date = new Date(t.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      if (byMonthMap[monthKey]) {
        byMonthMap[monthKey].earnings += Number(t.amount || 0)
      }
    })
    const byMonth = Object.entries(byMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        count: data.count,
        earnings: data.earnings
      }))

    // Bookings by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const byDayMap: Record<number, number> = {}
    bookings?.forEach(b => {
      const date = new Date(b.booking_date)
      const dayOfWeek = date.getDay()
      byDayMap[dayOfWeek] = (byDayMap[dayOfWeek] || 0) + 1
    })
    const byDayOfWeek = dayNames.map((day, index) => ({
      day,
      count: byDayMap[index] || 0
    }))

    // Bookings by service
    const serviceMap: Record<string, { count: number; earnings: number }> = {}
    bookings?.forEach(b => {
      const serviceKey = b.service_id || 'other'
      if (!serviceMap[serviceKey]) {
        serviceMap[serviceKey] = { count: 0, earnings: 0 }
      }
      serviceMap[serviceKey].count++
      serviceMap[serviceKey].earnings += Number(b.total_amount || 0)
    })
    const byService = Object.entries(serviceMap).map(([service, data]) => ({
      service,
      count: data.count,
      earnings: data.earnings
    }))

    // Performance metrics over time
    const performanceMap: Record<string, { rating: number; count: number; completionRate: number; responseTime: number }> = {}
    
    // Group reviews by month
    reviews?.forEach(r => {
      const date = new Date(r.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      if (!performanceMap[monthKey]) {
        performanceMap[monthKey] = { rating: 0, count: 0, completionRate: 0, responseTime: 0 }
      }
      performanceMap[monthKey].rating += r.rating
      performanceMap[monthKey].count++
    })

    // Calculate average ratings per month
    Object.keys(performanceMap).forEach(month => {
      if (performanceMap[month].count > 0) {
        performanceMap[month].rating = performanceMap[month].rating / performanceMap[month].count
      }
    })

    // Group bookings by month for completion rates
    const bookingsByMonth: Record<string, { total: number; completed: number }> = {}
    bookings?.forEach(b => {
      const date = new Date(b.booking_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      if (!bookingsByMonth[monthKey]) {
        bookingsByMonth[monthKey] = { total: 0, completed: 0 }
      }
      bookingsByMonth[monthKey].total++
      if (b.status === 'completed') {
        bookingsByMonth[monthKey].completed++
      }
    })

    Object.keys(performanceMap).forEach(month => {
      if (bookingsByMonth[month]) {
        performanceMap[month].completionRate = bookingsByMonth[month].total > 0
          ? (bookingsByMonth[month].completed / bookingsByMonth[month].total) * 100
          : 0
      }
    })

    const ratingsData = Object.entries(performanceMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rating: data.rating,
        count: data.count
      }))

    const completionRates = Object.entries(performanceMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rate: data.completionRate
      }))

    const responseTimes = Object.entries(performanceMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        hours: data.responseTime
      }))

    // Calculate trends (compare current period to previous period)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousStartDateStr = previousStartDate.toISOString().slice(0, 10)

    const { data: previousBookings } = await supabase
      .from('bookings')
      .select('id, total_amount')
      .eq('provider_id', providerId)
      .gte('booking_date', previousStartDateStr)
      .lt('booking_date', startDateStr)

    const { data: previousTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('provider_id', providerId)
      .eq('status', 'completed')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousBookingsCount = previousBookings?.length || 0
    const previousEarnings = previousTransactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0

    const bookingsGrowth = previousBookingsCount > 0
      ? ((totalBookings - previousBookingsCount) / previousBookingsCount) * 100
      : totalBookings > 0 ? 100 : 0

    const earningsGrowth = previousEarnings > 0
      ? ((totalEarnings - previousEarnings) / previousEarnings) * 100
      : totalEarnings > 0 ? 100 : 0

    // Rating trend (compare current period average to previous)
    const { data: previousReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('provider_id', providerId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousAvgRating = previousReviews && previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
      : 0

    const ratingTrend = previousAvgRating > 0
      ? averageRating - previousAvgRating
      : averageRating > 0 ? averageRating : 0

    const analytics = {
      overview: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalEarnings,
        averageRating,
        totalReviews,
        completionRate,
        onTimeRate,
        responseTime
      },
      bookings: {
        byStatus,
        byMonth,
        byDayOfWeek,
        byService
      },
      performance: {
        ratings: ratingsData,
        completionRates,
        responseTimes
      },
      trends: {
        bookingsGrowth,
        earningsGrowth,
        ratingTrend
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('[provider-analytics] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
