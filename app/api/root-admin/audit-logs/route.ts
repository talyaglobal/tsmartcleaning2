import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const resourceId = searchParams.get('resourceId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createServerSupabase(null)

    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        resource,
        resource_id,
        metadata,
        created_at,
        user_id,
        ip,
        user_agent,
        users:user_id(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (resource) {
      query = query.eq('resource', resource)
    }

    if (resourceId) {
      query = query.eq('resource_id', resourceId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('[root-admin] Fetch audit logs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    // Transform the data to include user info
    const transformedLogs = logs?.map((log: any) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resource_id,
      metadata: log.metadata,
      created_at: log.created_at,
      timestamp: log.created_at,
      actor: log.users?.full_name || log.users?.email || 'System',
      userId: log.user_id,
      ip: log.ip,
      userAgent: log.user_agent,
      payload: log.metadata,
      reason: log.metadata?.reason || null,
    })) || []

    return NextResponse.json({ logs: transformedLogs })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Fetch audit logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

