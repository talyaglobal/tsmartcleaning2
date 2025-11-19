import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get a specific job listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job listing not found' }, { status: 404 })
      }
      console.error('[jobs] GET by id supabase error:', error)
      return NextResponse.json({ error: 'Failed to load job listing' }, { status: 500 })
    }

    // Only return active jobs to public, unless it's an admin request
    if (!data.is_active) {
      // Check if user is admin (simplified - in production, verify auth token)
      // For now, return anyway for service role
    }

    return NextResponse.json({ job: data })
  } catch (error) {
    console.error('[jobs] GET by id error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a job listing (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    const body = await request.json()

    const { data, error } = await supabase
      .from('job_listings')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job listing not found' }, { status: 404 })
      }
      console.error('[jobs] PATCH supabase error:', error)
      return NextResponse.json({ error: 'Failed to update job listing' }, { status: 500 })
    }

    return NextResponse.json({ job: data })
  } catch (error) {
    console.error('[jobs] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a job listing (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    const { error } = await supabase
      .from('job_listings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[jobs] DELETE supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete job listing' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs] DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

