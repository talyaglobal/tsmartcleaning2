import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createAnonSupabase(tenantId)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: data.user,
    })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
