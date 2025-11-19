import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = createServerSupabase(null)
    
    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        status,
        recipients,
        sent_at,
        scheduled_for,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[v0] Get root admin notifications error:', error)
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Get root admin notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

export const POST = withRootAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { title, message, type, recipients, scheduled_for } = body

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, and type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        recipients: recipients || 0,
        status: scheduled_for ? 'scheduled' : 'draft',
        scheduled_for: scheduled_for || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create root admin notification error:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification: data, message: 'Notification created successfully' })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Create root admin notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

