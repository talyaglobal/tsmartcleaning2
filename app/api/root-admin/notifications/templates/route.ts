import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'email' | 'sms' | 'push' | 'in_app'

    const supabase = createServerSupabase(null)
    
    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('[v0] Get notification templates error:', error)
      return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Get notification templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

export const POST = withRootAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, type, subject, body: templateBody } = body

    if (!name || !type || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        name,
        type,
        subject,
        body: templateBody,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create notification template error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template: data, message: 'Template created successfully' })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Create notification template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

