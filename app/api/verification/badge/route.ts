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
          { error: 'You can only view your own verification badge' },
          { status: 403 }
        )
      }

      const { data, error } = await supabase
        .from('verifications')
        .select('type,status,expires_at')
        .eq('user_id', userId)

      if (error) {
        console.error('[verification:badge] supabase error:', error)
        return NextResponse.json({ error: 'Failed to load badge' }, { status: 500 })
      }

      const byType = Object.fromEntries((data ?? []).map((r: any) => [r.type, r]))
      const identityOk =
        byType['government_id']?.status === 'passed' &&
        byType['face']?.status === 'passed'
      const insuranceOk =
        byType['insurance']?.status === 'passed' &&
        new Date(byType['insurance']?.expires_at ?? 0).getTime() > Date.now()

      return NextResponse.json({
        identityVerified: !!identityOk,
        insuranceValid: !!insuranceOk,
        verifications: data ?? [],
      })
    } catch (err) {
      console.error('[verification:badge] error:', err)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)


