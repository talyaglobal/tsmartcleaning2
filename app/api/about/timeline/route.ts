import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get company timeline for About page
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const { data: timeline, error } = await supabase
      .from('company_timeline')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false, nullsFirst: false })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[About Timeline] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch timeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({ timeline: timeline || [] })
  } catch (error) {
    console.error('[About Timeline] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

