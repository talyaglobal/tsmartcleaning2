import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

// Get user activity logs
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase },
    { params }: { params: { userId: string } }
  ) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')

      const supabase = authSupabase || createServerSupabase()
    
    const from = (page - 1) * limit
    const to = page * limit - 1
    
    // Get audit logs for this user
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', params.userId)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] admin user activity: supabase error', error)
      return NextResponse.json({ error: 'Failed to load activity logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: data ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('[v0] Get user activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
},
  {
    requireAdmin: true,
  }
)

