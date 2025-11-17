import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Expect Authorization: Bearer <access_token>
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createAnonSupabase(tenantId)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
