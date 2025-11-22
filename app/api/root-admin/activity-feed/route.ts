import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

interface ActivityItem {
  id: string
  type: 'booking_created' | 'booking_completed' | 'cleaner_joined' | 'company_verified' | 'payment_received' | 'review_submitted'
  title: string
  description: string
  timestamp: string
  userId?: string
  userName?: string
  amount?: number
  rating?: number
  metadata?: Record<string, any>
}

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServerSupabase(null)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const activities: ActivityItem[] = []

    // Fetch recent bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        total_amount,
        service_type,
        created_at,
        updated_at,
        user_id,
        cleaner_id,
        profiles!bookings_user_id_fkey(first_name, last_name),
        cleaner:profiles!bookings_cleaner_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    bookings?.forEach(booking => {
      // Booking created
      activities.push({
        id: `booking_${booking.id}`,
        type: 'booking_created',
        title: 'New Booking Created',
        description: `Booking #${booking.id} created for ${booking.service_type || 'cleaning service'}`,
        timestamp: booking.created_at,
        userId: booking.user_id,
        userName: booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : undefined,
        amount: booking.total_amount,
        metadata: { bookingId: booking.id }
      })

      // Booking completed (if status is completed and there's an update timestamp)
      if (booking.status === 'completed' && booking.updated_at !== booking.created_at) {
        activities.push({
          id: `booking_completed_${booking.id}`,
          type: 'booking_completed',
          title: 'Booking Completed',
          description: `Booking #${booking.id} has been completed`,
          timestamp: booking.updated_at,
          userId: booking.cleaner_id,
          userName: booking.cleaner ? `${booking.cleaner.first_name} ${booking.cleaner.last_name}` : undefined,
          amount: booking.total_amount,
          metadata: { bookingId: booking.id }
        })
      }
    })

    // Fetch recent cleaner registrations
    const { data: cleaners } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .eq('role', 'cleaner')
      .order('created_at', { ascending: false })
      .limit(10)

    cleaners?.forEach(cleaner => {
      activities.push({
        id: `cleaner_${cleaner.id}`,
        type: 'cleaner_joined',
        title: 'New Cleaner Joined',
        description: `${cleaner.first_name} ${cleaner.last_name} joined as a cleaner`,
        timestamp: cleaner.created_at,
        userId: cleaner.id,
        userName: `${cleaner.first_name} ${cleaner.last_name}`,
        metadata: { profileId: cleaner.id }
      })
    })

    // Fetch recent company verifications
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, verified, created_at, updated_at')
      .eq('verified', true)
      .order('updated_at', { ascending: false })
      .limit(10)

    companies?.forEach(company => {
      activities.push({
        id: `company_verified_${company.id}`,
        type: 'company_verified',
        title: 'Company Verified',
        description: `${company.name} has been verified`,
        timestamp: company.updated_at,
        metadata: { companyId: company.id }
      })
    })

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        created_at,
        booking_id,
        bookings!inner(id)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    reviews?.forEach(review => {
      activities.push({
        id: `review_${review.id}`,
        type: 'review_submitted',
        title: 'New Review Submitted',
        description: `${review.rating}-star review for booking #${review.booking_id}`,
        timestamp: review.created_at,
        rating: review.rating,
        metadata: { reviewId: review.id, bookingId: review.booking_id }
      })
    })

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit)

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        total: activities.length,
        limit,
        offset,
        hasMore: offset + limit < activities.length
      }
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Activity feed fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})