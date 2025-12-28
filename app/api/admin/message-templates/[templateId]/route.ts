import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Update a message template
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId },
    { params }: { params: Promise<{ templateId: string }> }
  ) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { templateId } = await params
      const updates = await request.json()

      const supabase = authSupabase || createServerSupabase()

    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error || !data) {
      console.error('[admin/message-templates/[id]] PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('[admin/message-templates/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

// Delete a message template
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId },
    { params }: { params: Promise<{ templateId: string }> }
  ) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { templateId } = await params

      const supabase = authSupabase || createServerSupabase()

    const { error } = await supabase.from('message_templates').delete().eq('id', templateId)

    if (error) {
      console.error('[admin/message-templates/[id]] DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/message-templates/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

