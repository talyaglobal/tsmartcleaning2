import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // If client passes refresh token and access token, revoke refresh token
    const { refresh_token: refreshToken } = await request.json().catch(() => ({}))
    if (refreshToken) {
      const tenantId = resolveTenantFromRequest(request)
      const supabase = createAnonSupabase(tenantId)
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {})
      // Note: Without cookie store, just acknowledge; client should clear local session
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
