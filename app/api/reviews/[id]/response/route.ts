import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Provider responds to a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { response } = await request.json()

    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      )
    }

    if (response.length > 1000) {
      return NextResponse.json(
        { error: 'Response must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Get the review to verify it exists and get provider_id
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, provider_id, response')
      .eq('id', params.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if response already exists
    if (review.response) {
      return NextResponse.json(
        { error: 'Response already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Update review with provider response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: response.trim(),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[review-response] update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to add response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Response added successfully'
    })
  } catch (error) {
    console.error('[review-response] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update existing response
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { response } = await request.json()

    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      )
    }

    if (response.length > 1000) {
      return NextResponse.json(
        { error: 'Response must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Verify review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', params.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: response.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[review-response] update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Response updated successfully'
    })
  } catch (error) {
    console.error('[review-response] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete response
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Verify review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', params.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Remove response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: null,
        responded_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[review-response] delete error:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Response deleted successfully'
    })
  } catch (error) {
    console.error('[review-response] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

