import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get office locations for About page
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const { data: locations, error } = await supabase
      .from('office_locations')
      .select('*')
      .order('is_headquarters', { ascending: false })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[About Locations] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ locations: locations || [] })
  } catch (error) {
    console.error('[About Locations] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

