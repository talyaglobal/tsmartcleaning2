import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, role, referralCode } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)

    // Ensure user profile exists
    const { error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role: role || 'customer',
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('[v0] Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Handle referral code if provided
    if (referralCode) {
      try {
        const { data: membershipCard } = await supabase
          .from('membership_cards')
          .select('user_id')
          .eq('referral_code', referralCode.trim().toUpperCase())
          .eq('status', 'active')
          .maybeSingle()

        if (membershipCard) {
          await supabase
            .from('referrals')
            .insert({
              referrer_id: membershipCard.user_id,
              referee_id: userId,
              status: 'pending',
              tenant_id: tenantId,
            })
        }
      } catch (err) {
        console.error('[v0] Referral creation error:', err)
        // Don't fail the request if referral creation fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Complete social signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

