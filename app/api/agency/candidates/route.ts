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
    
    // Get workers from agency_workers table
    let query = supabase
      .from('agency_workers')
      .select(`
        id,
        user_id,
        status,
        skills,
        languages,
        work_authorization_status,
        availability_status,
        notes,
        last_contact_date,
        created_at,
        users:user_id (
          id,
          full_name,
          email,
          phone,
          city,
          state,
          created_at
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('agency_id', agencyId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: workers, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get candidates error:', error)
      return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
    }

    // Format the response
    const candidatesWithDetails = (workers || []).map((worker: any) => {
      const user = worker.users || {}
      return {
        id: worker.user_id || worker.id,
        name: user.full_name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        status: worker.status as 'active' | 'placed' | 'training' | 'inactive' | 'on_hold',
        skills: worker.skills || [],
        languages: worker.languages || [],
        workAuthorizationStatus: worker.work_authorization_status,
        availabilityStatus: worker.availability_status,
        location: [user.city, user.state].filter(Boolean).join(', ') || undefined,
        joinedDate: worker.created_at ? new Date(worker.created_at).toISOString().split('T')[0] : '',
        lastContact: worker.last_contact_date || undefined,
        notes: worker.notes || undefined,
      }
    })

    return NextResponse.json({ candidates: candidatesWithDetails })
  } catch (error) {
    console.error('[v0] Get candidates error:', error)
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
    const { agencyId, userId, status, skills, languages, workAuthorizationStatus, notes } = body

    if (!agencyId || !userId) {
      return NextResponse.json(
        { error: 'agencyId and userId are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const { data, error } = await supabase
      .from('agency_workers')
      .insert({
        tenant_id: tenantId,
        agency_id: agencyId,
        user_id: userId,
        status: status || 'active',
        skills: skills || [],
        languages: languages || [],
        work_authorization_status: workAuthorizationStatus || null,
        notes: notes || null,
      })
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          phone,
          city,
          state
        )
      `)
      .single()

    if (error) {
      console.error('[v0] Create candidate error:', error)
      return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
    }

    const user = (data as any).users || {}
    const formattedCandidate = {
      id: data.user_id,
      name: user.full_name || 'Unknown',
      email: user.email || '',
      phone: user.phone || '',
      status: data.status,
      skills: data.skills || [],
      languages: data.languages || [],
      location: [user.city, user.state].filter(Boolean).join(', ') || undefined,
      joinedDate: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '',
    }

    return NextResponse.json({ candidate: formattedCandidate, message: 'Candidate added successfully' })
  } catch (error) {
    console.error('[v0] Create candidate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
