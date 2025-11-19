import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

// Get user notifications
export const GET = withAuth(
  async (request: NextRequest, { user, supabase, tenantId }) => {
    try {
      const { searchParams } = new URL(request.url)
      const requestedUserId = searchParams.get('userId')
      
      // If userId is provided, verify the authenticated user owns it (unless admin)
      const userId = requestedUserId || user.id
      const isAdmin = isAdminRole(user.role)
      
      if (!isAdmin && userId !== user.id) {
        return NextResponse.json(
          { error: 'You can only view your own notifications' },
          { status: 403 }
        )
      }

      const resolvedTenantId = tenantId || resolveTenantFromRequest(request)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] notifications GET supabase error:', error)
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
    }

    return NextResponse.json({
      notifications: data ?? [],
    })
  } catch (error) {
    console.error('[v0] Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
)

// Mark notification as read
export const PATCH = withAuth(
  async (request: NextRequest, { user, supabase, tenantId }) => {
    try {
      const { notificationId } = await request.json()

      if (!notificationId) {
        return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
      }

      const resolvedTenantId = tenantId || resolveTenantFromRequest(request)
      
      // Verify user owns the notification
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single()
      
      if (fetchError || !notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      
      const isAdmin = isAdminRole(user.role)
      if (!isAdmin && notification.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only update your own notifications' },
          { status: 403 }
        )
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

    return NextResponse.json({
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('[v0] Update notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
)
