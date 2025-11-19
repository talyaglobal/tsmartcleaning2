import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

// Get job listings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const department = searchParams.get('department')
    const employmentType = searchParams.get('employmentType')
    const locationType = searchParams.get('locationType')
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    let query = supabase
      .from('job_listings')
      .select('*')
      .order('posted_at', { ascending: false })

    // Filter by active status unless explicitly including inactive
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (department) {
      query = query.eq('department', department)
    }

    if (employmentType) {
      query = query.eq('employment_type', employmentType)
    }

    if (locationType) {
      query = query.eq('location_type', locationType)
    }

    // Text search on title and description
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[jobs] GET supabase error:', error)
      return NextResponse.json({ error: 'Failed to load job listings' }, { status: 500 })
    }

    return NextResponse.json({
      jobs: data ?? [],
    })
  } catch (error) {
    console.error('[jobs] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new job listing (admin only)
export const POST = withAuth(
  { requireAdmin: true },
  async (request: NextRequest, auth) => {
    try {
      const tenantId = auth.tenantId || resolveTenantFromRequest(request)

      const body = await request.json()
      const {
        title,
        description,
        category,
        department,
        employment_type,
        location_type,
        location,
        salary_min,
        salary_max,
        salary_currency,
        salary_display,
        requirements,
        responsibilities,
        benefits,
        is_active,
        application_deadline,
        created_by,
      } = body

      // Validate required fields
      if (!title || !description || !category || !department || !employment_type || !location_type) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const { data, error } = await auth.supabase
        .from('job_listings')
        .insert({
          tenant_id: tenantId || null,
          title,
          description,
          category,
          department,
          employment_type,
          location_type,
          location: location || null,
          salary_min: salary_min || null,
          salary_max: salary_max || null,
          salary_currency: salary_currency || 'USD',
          salary_display: salary_display || null,
          requirements: requirements || [],
          responsibilities: responsibilities || [],
          benefits: benefits || [],
          is_active: is_active !== undefined ? is_active : true,
          application_deadline: application_deadline || null,
          created_by: created_by || auth.user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('[jobs] POST supabase error:', error)
        return NextResponse.json({ error: 'Failed to create job listing' }, { status: 500 })
      }

      return NextResponse.json({ job: data }, { status: 201 })
    } catch (error) {
      console.error('[jobs] POST error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

