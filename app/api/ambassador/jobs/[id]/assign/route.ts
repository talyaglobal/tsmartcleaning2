import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = requireTenantId(request)
    const { providerId } = await request.json()

    // providerId can be null/undefined to unassign a job
    const supabase = createServerSupabase()
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ provider_id: providerId || null })
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Assign job error:', error)
      return NextResponse.json({ error: 'Failed to assign job' }, { status: 500 })
    }

    return NextResponse.json({ 
      booking: data, 
      message: providerId ? 'Job assigned successfully' : 'Job unassigned successfully' 
    })
  } catch (error) {
    console.error('[v0] Assign job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

