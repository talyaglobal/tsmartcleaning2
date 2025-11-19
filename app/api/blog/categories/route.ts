import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all blog categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Get blog categories error:', error)
      return NextResponse.json(
        { error: 'Failed to load categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('[v0] Get blog categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

