import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabaseAuth = createAnonSupabase(tenantId)
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: role || 'customer' },
      },
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Signup failed' },
        { status: 400 }
      )
    }

    // Ensure profile row in public.users
    const supabase = createServerSupabase(tenantId)
    const insertRes = await supabase
      .from('users')
      .upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name: name,
          role: role || 'customer',
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (insertRes.error) {
      console.error('[v0] Signup profile upsert error:', insertRes.error)
      return NextResponse.json(
        { error: 'User created, but profile setup failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: data.user,
      message: 'User created successfully',
    })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
