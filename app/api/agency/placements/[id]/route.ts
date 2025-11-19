import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = requireTenantId(request)
    const body = await request.json()
    const { status, endDate, notes } = body

    if (!status && !endDate && !notes) {
      return NextResponse.json(
        { error: 'At least one field (status, endDate, notes) is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const updateData: any = {}
    if (status) updateData.status = status
    if (endDate !== undefined) updateData.end_date = endDate || null
    if (notes !== undefined) updateData.notes = notes || null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('placements')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        id,
        candidate_id,
        company_id,
        job_title,
        status,
        start_date,
        end_date,
        placement_fee,
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
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
      }
      console.error('[v0] Update placement error:', error)
      return NextResponse.json({ error: 'Failed to update placement' }, { status: 500 })
    }

    const formattedPlacement = {
      id: data.id,
      candidateId: data.candidate_id,
      candidateName: (data as any).users?.full_name || 'Unknown',
      companyId: data.company_id,
      companyName: (data as any).companies?.name || 'Unknown Company',
      jobTitle: data.job_title || 'N/A',
      status: data.status || 'pending',
      startDate: data.start_date || '',
      endDate: data.end_date || undefined,
      placementFee: Number(data.placement_fee || 0),
      notes: data.notes || undefined,
    }

    return NextResponse.json({ 
      placement: formattedPlacement, 
      message: 'Placement updated successfully' 
    })
  } catch (error) {
    console.error('[v0] Update placement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

