import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const PATCH = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { verified } = await request.json()

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'verified must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    const { data, error } = await supabase
      .from('companies')
      .update({ verified })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Update company verification error:', error)
      return NextResponse.json({ error: 'Failed to update company verification' }, { status: 500 })
    }

    return NextResponse.json({ company: data, message: 'Company verification updated' })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Update company verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

