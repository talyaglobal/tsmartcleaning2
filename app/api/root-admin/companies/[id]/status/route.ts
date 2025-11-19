import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const PATCH = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { status, reason } = await request.json()

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, inactive, or suspended' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[root-admin] Update company status error:', error)
      return NextResponse.json(
        { error: 'Failed to update company status' },
        { status: 500 }
      )
    }

    // TODO: Log audit trail with reason if provided
    // await logAuditEvent({
    //   entity_type: 'company',
    //   entity_id: params.id,
    //   action: 'status_update',
    //   old_value: data.status,
    //   new_value: status,
    //   reason
    // })

    return NextResponse.json({ 
      company: data, 
      message: `Company status updated to ${status}` 
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Update company status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

