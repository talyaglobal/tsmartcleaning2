import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get press/media mentions for About page
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const { data: pressMentions, error } = await supabase
      .from('press_mentions')
      .select('*')
      .order('published_date', { ascending: false, nullsFirst: false })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[About Press] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch press mentions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pressMentions: pressMentions || [] })
  } catch (error) {
    console.error('[About Press] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

