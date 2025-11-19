import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const ambassadorId = searchParams.get('ambassadorId')
    const period = searchParams.get('period') || '30' // days

    if (!ambassadorId) {
      return NextResponse.json(
        { error: 'ambassadorId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get all team members (cleaners)
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'cleaner')

    const performance = await Promise.all(
      (teamMembers || []).map(async (member) => {
        // Get completed jobs in period
        const { count: jobsCompleted } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)
          .eq('status', 'completed')
          .gte('booking_date', daysAgo.toISOString().split('T')[0])

        // Get total jobs assigned in period
        const { count: totalJobs } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)
          .gte('booking_date', daysAgo.toISOString().split('T')[0])

        const completionRate = totalJobs && totalJobs > 0
          ? Math.round((jobsCompleted || 0) / totalJobs * 100)
          : 0

        // Get average rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)

        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0

        // Calculate hours worked
        const { data: bookings } = await supabase
          .from('bookings')
          .select('duration_hours')
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)
          .eq('status', 'completed')
          .gte('booking_date', daysAgo.toISOString().split('T')[0])

        const hoursWorked = bookings
          ? bookings.reduce((sum, b) => sum + (b.duration_hours || 0), 0)
          : 0

        // Calculate on-time rate (jobs that started on time)
        // This is a simplified calculation - you might want to track actual start times
        const onTimeRate = 95 // Placeholder - would need actual start time tracking

        return {
          memberId: member.id,
          memberName: member.full_name || 'Unknown',
          jobsCompleted: jobsCompleted || 0,
          completionRate,
          averageRating: Math.round(avgRating * 10) / 10,
          hoursWorked,
          onTimeRate,
        }
      })
    )

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('[v0] Get performance metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

