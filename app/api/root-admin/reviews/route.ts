import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const rating = searchParams.get('rating')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createServerSupabase(null)

    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        status,
        flagged_reason,
        created_at,
        updated_at,
        booking_id,
        customer:users!reviews_customer_id_fkey(id, full_name, email),
        provider:provider_profiles!reviews_provider_id_fkey(id, business_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (rating) {
      query = query.eq('rating', parseInt(rating, 10))
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('[root-admin] Fetch reviews error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedReviews = reviews?.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      status: (review.status || 'pending') as 'pending' | 'approved' | 'flagged' | 'rejected',
      customer_name: review.customer?.full_name || 'Unknown',
      provider_name: review.provider?.business_name || 'Unknown',
      created_at: review.created_at,
      flagged_reason: review.flagged_reason || null,
    })) || []

    return NextResponse.json({ reviews: transformedReviews })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Fetch reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

