import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type } = body ?? {}
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId and type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('verifications')
      .upsert({ user_id: userId, type, status: 'pending' }, { onConflict: 'user_id,type' })

    if (error) {
      console.error('[verification:refresh] supabase error:', error)
      return NextResponse.json({ error: 'Failed to refresh verification' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification refresh requested' })
  } catch (err) {
    console.error('[verification:refresh] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


