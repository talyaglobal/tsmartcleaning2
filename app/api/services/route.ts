import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const supabase = createServerSupabase()
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
    
    // Filter by category if provided
    if (category === 'residential') {
      // Residential services: residential, deep, move, post-construction, window, carpet, eco-friendly
      query = query.in('category', ['residential', 'deep', 'move', 'post-construction', 'window', 'carpet', 'eco-friendly'])
    } else if (category === 'commercial') {
      // Commercial services: commercial and related categories
      query = query.in('category', ['commercial', 'post-construction', 'window', 'carpet', 'eco-friendly'])
    }
    
    const { data, error } = await query.order('name', { ascending: true })

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
