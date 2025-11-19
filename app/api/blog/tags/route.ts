import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all blog tags
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Get blog tags error:', error)
      return NextResponse.json(
        { error: 'Failed to load tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error) {
    console.error('[v0] Get blog tags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

