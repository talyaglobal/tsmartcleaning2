import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'
import { withAuth } from '@/lib/auth/rbac'

// Update single user
export const PATCH = withAuth(
  async (
    request: NextRequest,
    auth: { supabase: any, user: any, tenantId: string | null },
    context?: { params: { userId: string } }
  ) => {
    try {
      if (!context?.params?.userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      const { userId } = context.params
      const body = await request.json()
      const { role, isActive } = body

      const supabase = auth.supabase || createServerSupabase()
      const updates: Record<string, any> = {}
      
      if (role !== undefined) {
        updates.role = role
      }
      if (isActive !== undefined) {
        updates.is_active = isActive
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('[v0] admin user update: supabase error', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }

      // Log audit event
      await logAuditEventFromRequest(request, {
        action: 'update_user',
        resource: 'user',
        resourceId: userId,
        metadata: updates,
      })

      return NextResponse.json({ success: true, user: data })
    } catch (error) {
      console.error('[v0] Update user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAdmin: true }
)

