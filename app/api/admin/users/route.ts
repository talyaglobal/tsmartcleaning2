import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = createServerSupabase()
    // TODO: Verify admin privileges from auth (skipped for now)
    let query = supabase.from('users').select('*', { count: 'exact' })
    if (role) {
      query = query.eq('role', role)
    }
    const from = (page - 1) * limit
    const to = page * limit - 1
    const { data, error, count } = await query.range(from, to).order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error('[v0] admin users: supabase error', error)
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('[v0] Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
