import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Get all message templates
export const GET = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') // 'email', 'sms', 'whatsapp'
      const search = searchParams.get('search')

      const supabase = authSupabase || createServerSupabase()

    let query = supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[admin/message-templates] GET error:', error)
      return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
    }

      return NextResponse.json({ templates: data || [] })
    } catch (error) {
      console.error('[admin/message-templates] GET error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

// Create a new message template
export const POST = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { name, type, subject, content, variables } = await request.json()

      if (!name || !type || !content) {
        return NextResponse.json(
          { error: 'name, type, and content are required' },
          { status: 400 }
        )
      }

      if (!['email', 'sms', 'whatsapp'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }

      const supabase = authSupabase || createServerSupabase()

    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        name,
        type,
        subject: subject || null,
        content,
        variables: variables || [],
        is_active: true,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[admin/message-templates] POST error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

      return NextResponse.json({ template: data })
    } catch (error) {
      console.error('[admin/message-templates] POST error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

