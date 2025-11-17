import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
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

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
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
