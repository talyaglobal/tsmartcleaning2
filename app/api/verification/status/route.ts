import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })

    if (error) {
      console.error('[verification:status] supabase error:', error)
      return NextResponse.json({ error: 'Failed to load status' }, { status: 500 })
    }

    // Aggregate minimal summary
    const summary = (data ?? []).reduce<Record<string, string>>((acc, row: any) => {
      acc[row.type] = row.status
      return acc
    }, {})

    return NextResponse.json({ verifications: data ?? [], summary })
  } catch (err) {
    console.error('[verification:status] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


