import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)

    // Check if referral code exists in membership_cards table
    const { data: membershipCard, error } = await supabase
      .from('membership_cards')
      .select('id, user_id, referral_code, status')
      .eq('referral_code', referralCode.trim().toUpperCase())
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('[v0] Referral code validation error:', error)
      return NextResponse.json(
        { error: 'Failed to validate referral code' },
        { status: 500 }
      )
    }

    if (!membershipCard) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      referrerId: membershipCard.user_id,
    })
  } catch (error) {
    console.error('[v0] Referral code validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

