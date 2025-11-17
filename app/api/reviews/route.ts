import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Get reviews
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get reviews supabase error:', error)
      return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: data ?? [] })
  } catch (error) {
    console.error('[v0] Get reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a review
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { bookingId, providerId, rating, comment } = await request.json()

    if (!bookingId || !providerId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('reviews')
      .insert({ tenant_id: tenantId, booking_id: bookingId, provider_id: providerId, rating, comment })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create review supabase error:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({ review: data, message: 'Review created successfully' })
  } catch (error) {
    console.error('[v0] Create review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
