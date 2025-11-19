import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    const status = searchParams.get('status')

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    let query = supabase
      .from('placements')
      .select(`
        id,
        candidate_id,
        company_id,
        job_title,
        status,
        start_date,
        end_date,
        placement_fee,
        hourly_rate,
        hours_per_week,
        notes,
        created_at,
        users:candidate_id (
          full_name,
          email
        ),
        companies:company_id (
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('agency_id', agencyId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: placements, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get placements error:', error)
      return NextResponse.json({ error: 'Failed to load placements' }, { status: 500 })
    }

    const formattedPlacements = (placements || []).map((placement: any) => ({
      id: placement.id,
      candidateId: placement.candidate_id,
      candidateName: placement.users?.full_name || 'Unknown',
      companyId: placement.company_id,
      companyName: placement.companies?.name || 'Unknown Company',
      jobTitle: placement.job_title || 'N/A',
      status: placement.status || 'pending',
      startDate: placement.start_date || '',
      endDate: placement.end_date || undefined,
      placementFee: Number(placement.placement_fee || 0),
      hourlyRate: placement.hourly_rate ? Number(placement.hourly_rate) : undefined,
      hoursPerWeek: placement.hours_per_week || undefined,
      notes: placement.notes || undefined,
    }))

    return NextResponse.json({ placements: formattedPlacements })
  } catch (error) {
    console.error('[v0] Get placements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const body = await request.json()
    const { agencyId, candidateId, companyId, jobTitle, startDate, placementFee, hourlyRate, hoursPerWeek, notes } = body

    if (!agencyId || !candidateId || !companyId || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const { data, error } = await supabase
      .from('placements')
      .insert({
        tenant_id: tenantId,
        agency_id: agencyId,
        candidate_id: candidateId,
        company_id: companyId,
        job_title: jobTitle,
        status: 'pending',
        start_date: startDate || null,
        placement_fee: placementFee || 0,
        hourly_rate: hourlyRate || null,
        hours_per_week: hoursPerWeek || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create placement error:', error)
      return NextResponse.json({ error: 'Failed to create placement' }, { status: 500 })
    }

    return NextResponse.json({ placement: data, message: 'Placement created successfully' })
  } catch (error) {
    console.error('[v0] Create placement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

