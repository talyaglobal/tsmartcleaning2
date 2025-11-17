import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all services
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Get services supabase error:', error)
      return NextResponse.json({ error: 'Failed to load services' }, { status: 500 })
    }

    return NextResponse.json({ services: data ?? [] })
  } catch (error) {
    console.error('[v0] Get services error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
