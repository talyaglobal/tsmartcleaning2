import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'
import { withAuth } from '@/lib/auth/rbac'
import { UserRole } from '@/lib/auth/roles'

// Get all users (admin only)
export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role')
      const search = searchParams.get('search')
      const status = searchParams.get('status')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')

      let query = supabase.from('users').select('*', { count: 'exact' })
      
      if (role) {
        query = query.eq('role', role)
      }
      
      if (status) {
        // Check if is_active column exists by trying to filter
        // If column doesn't exist, this will be ignored in the query
        if (status === 'active') {
          query = query.eq('is_active', true)
        } else if (status === 'inactive') {
          query = query.eq('is_active', false)
        }
      }
      
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
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
  },
  {
    requireAdmin: true,
  }
)

// Update user role or status (bulk operations)
export const PATCH = withAuth(
  async (request: NextRequest, { supabase, user }) => {
    try {
      const body = await request.json()
      const { userIds, role, isActive } = body

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'userIds array is required' }, { status: 400 })
      }

      // Only root admin and tsmart_team can change roles
      if (role !== undefined && user.role !== UserRole.ROOT_ADMIN && user.role !== UserRole.TSMART_TEAM) {
        return NextResponse.json(
          { error: 'Only root admin and tSmart team can change user roles' },
          { status: 403 }
        )
      }

      const updates: Record<string, any> = {}
      
      if (role !== undefined) {
        updates.role = role
      }
      // Only update is_active if the column exists in the schema
      // This will fail gracefully if the column doesn't exist
      if (isActive !== undefined) {
        updates.is_active = isActive
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .in('id', userIds)
        .select()

      if (error) {
        console.error('[v0] admin users update: supabase error', error)
        return NextResponse.json({ error: 'Failed to update users' }, { status: 500 })
      }

      // Log audit event
      await logAuditEventFromRequest(request, {
        action: 'bulk_update_users',
        resource: 'user',
        resourceId: userIds.join(','),
        metadata: { updates, count: userIds.length },
      })

      return NextResponse.json({ 
        success: true, 
        updated: data?.length || 0,
        users: data 
      })
    } catch (error) {
      console.error('[v0] Update users error:', error)
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
