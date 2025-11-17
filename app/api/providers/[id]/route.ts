import { NextRequest, NextResponse } from 'next/server'
import { logAuditEventFromRequest } from '@/lib/audit'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get provider profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { data, error } = await supabase
      .from('provider_profiles')
      .select(
        `
        *,
        users:profiles!provider_profiles_user_id_fkey(*),
        reviews:reviews(rating, comment)
      `
      )
      .eq('user_id', id)
      .single()

    if (error) {
      console.error('[v0] provider GET supabase error:', error)
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const ratingArray = (data as any)?.reviews || []
    const avgRating =
      ratingArray.length > 0
        ? Math.round(
            (ratingArray.reduce((s: number, r: any) => s + (r?.rating || 0), 0) / ratingArray.length) * 10
          ) / 10
        : null

    return NextResponse.json({
      provider: {
        ...data,
        rating: avgRating,
        reviews_count: ratingArray.length,
      },
    })
  } catch (error) {
    console.error('[v0] Get provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update provider profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json()

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { data, error } = await supabase
      .from('provider_profiles')
      .update(updates)
      .eq('user_id', id)
      .select()
      .single()

    await logAuditEventFromRequest(request, {
      action: 'update_provider',
      resource: 'provider_profile',
      resourceId: id,
      metadata: { updates },
    })
    if (error) {
      console.error('[v0] provider PATCH supabase error:', error)
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
    }
    return NextResponse.json({ provider: data, message: 'Provider profile updated successfully' })
  } catch (error) {
    console.error('[v0] Update provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
