import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, referralCode } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabaseAuth = createAnonSupabase(tenantId)
    
    // Validate referral code if provided
    let referrerId: string | null = null
    if (referralCode) {
      const supabase = createServerSupabase(tenantId)
      const { data: membershipCard } = await supabase
        .from('membership_cards')
        .select('user_id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .eq('status', 'active')
        .maybeSingle()
      
      if (membershipCard) {
        referrerId = membershipCard.user_id
      }
    }

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: name, 
          role: role || 'customer',
          referral_code: referralCode || null,
        },
        emailRedirectTo: `${request.headers.get('origin') || ''}/auth/callback`,
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

    // Create referral record if referral code was provided and valid
    if (referrerId && data.user.id) {
      try {
        await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referee_id: data.user.id,
            status: 'pending',
            tenant_id: tenantId,
          })
      } catch (err) {
        // Log but don't fail signup if referral creation fails
        console.error('[v0] Failed to create referral record:', err)
      }
    }

    return NextResponse.json({
      user: data.user,
      message: 'User created successfully',
      requiresEmailVerification: !data.session, // Supabase returns session only if email confirmation is disabled
    })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
