import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, scope, version, ip, userAgent } = body ?? {}
    if (!userId || !scope || !version) {
      return NextResponse.json(
        { error: 'userId, scope and version are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { error } = await supabase.from('consents').insert({
      user_id: userId,
      scope,
      version,
      ip: ip ?? null,
      user_agent: userAgent ?? null,
    })
    if (error) {
      console.error('[verification:consent] supabase error:', error)
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 })
    }

    await logAuditEventFromRequest(request, {
      action: 'record_consent',
      resource: 'consent',
      resourceId: userId,
      metadata: { scope, version },
    })
    return NextResponse.json({ message: 'Consent recorded' })
  } catch (err) {
    console.error('[verification:consent] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


