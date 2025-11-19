import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'open'

    const supabase = createServerSupabase()
    
    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('[v0] Get job postings error:', error)
      // If table doesn't exist, return empty array
      return NextResponse.json({ jobs: [] })
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error('[v0] Get job postings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

