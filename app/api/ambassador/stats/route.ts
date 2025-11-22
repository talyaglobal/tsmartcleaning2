import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

// Get ambassador statistics (admin or ambassador access)
export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const ambassadorId = searchParams.get('ambassadorId')

      if (!ambassadorId) {
        return NextResponse.json(
          { error: 'ambassadorId is required' },
          { status: 400 }
        )
      }

      // Get team size (cleaners associated with this ambassador)
      // Note: This assumes cleaners are associated with ambassadors through company_id or similar
      // Adjust the query based on your actual schema
      const { count: teamSize } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'cleaner')
      // If there's a direct relationship, add: .eq('ambassador_id', ambassadorId)

      // Get jobs managed by team members (all bookings assigned to cleaners in this ambassador's team)
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'cleaner')
      // If there's a direct relationship, add: .eq('ambassador_id', ambassadorId)

      const teamMemberIds = (teamMembers || []).map(m => m.id)
      
      let jobsManaged = 0
      let completedJobs = 0
      let totalRating = 0
      let ratingCount = 0

      if (teamMemberIds.length > 0) {
        // Get all bookings for team members
        const { count: totalJobs } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('provider_id', teamMemberIds)

        jobsManaged = totalJobs || 0

        // Get completed jobs
        const { count: completed } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('provider_id', teamMemberIds)
          .eq('status', 'completed')

        completedJobs = completed || 0

        // Get average rating from reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('provider_id', teamMemberIds)

        if (reviews && reviews.length > 0) {
          totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
          ratingCount = reviews.length
        }
      }

      const completionRate = jobsManaged > 0
        ? Math.round((completedJobs / jobsManaged) * 100)
        : 0

      const averageRating = ratingCount > 0
        ? Math.round((totalRating / ratingCount) * 10) / 10
        : 0

      return NextResponse.json({
        teamSize: teamSize || 0,
        jobsManaged,
        completionRate,
        averageRating,
      })
    } catch (error) {
      console.error('[v0] Get ambassador stats error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

