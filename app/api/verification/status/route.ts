import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const GET = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const requestedUserId = searchParams.get('userId')
      
      // If userId is provided, verify the authenticated user owns it (unless admin)
      const userId = requestedUserId || user.id
      const isAdmin = isAdminRole(user.role)
      
      if (!isAdmin && userId !== user.id) {
        return NextResponse.json(
          { error: 'You can only view your own verification status' },
          { status: 403 }
        )
      }

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
)


