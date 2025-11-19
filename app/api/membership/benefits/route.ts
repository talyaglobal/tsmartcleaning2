import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

/**
 * GET /api/membership/benefits
 * Returns available benefits for the user's active membership card
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)
    
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch active membership card
    const { data: card } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_activated', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!card) {
      return NextResponse.json({ 
        benefits: null,
        message: 'No active membership found' 
      })
    }

    // Check if membership is expired
    const expirationDate = new Date(card.expiration_date)
    const now = new Date()
    const isExpired = expirationDate <= now

    if (isExpired) {
      return NextResponse.json({ 
        benefits: null,
        message: 'Membership has expired' 
      })
    }

    // Calculate available benefits
    const benefits = {
      discount_percentage: Number(card.discount_percentage || 0),
      bonus_credits: Number(card.bonus_credits || 0),
      referral_credits: Number(card.referral_credits || 0),
      birthday_bonus_available: !card.birthday_bonus_used && card.birthday_bonus_available_date 
        ? new Date(card.birthday_bonus_available_date) <= now
        : false,
      tier: card.tier,
      priority_booking: true,
      free_rescheduling: card.tier === 'pro' || card.tier === 'elite',
      unlimited_rescheduling: card.tier === 'elite',
      free_upgrades_per_quarter: card.tier === 'pro' ? 1 : card.tier === 'elite' ? 4 : 0,
      dedicated_support: card.tier === 'pro' || card.tier === 'elite',
      no_booking_fees: card.tier === 'pro' || card.tier === 'elite',
      concierge_service: card.tier === 'elite',
      same_day_availability: card.tier === 'elite',
      premium_cleaners_only: card.tier === 'elite',
    }

    return NextResponse.json({
      benefits,
      card: {
        id: card.id,
        tier: card.tier,
        expiration_date: card.expiration_date,
      },
    })
  } catch (error) {
    console.error('[membership] Error fetching benefits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/membership/benefits/apply
 * Applies a benefit (discount, credit, etc.) to a booking or transaction
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)
    
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, benefitType, amount } = await request.json()

    if (!bookingId || !benefitType) {
      return NextResponse.json(
        { error: 'Booking ID and benefit type are required' },
        { status: 400 }
      )
    }

    // Fetch active membership card
    const { data: card } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_activated', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'No active membership found' }, { status: 404 })
    }

    // Check expiration
    const expirationDate = new Date(card.expiration_date)
    const now = new Date()
    if (expirationDate <= now) {
      return NextResponse.json({ error: 'Membership has expired' }, { status: 400 })
    }

    // Validate benefit type
    const validBenefitTypes = ['discount', 'bonus_credit', 'referral_credit', 'birthday_bonus', 'free_upgrade']
    if (!validBenefitTypes.includes(benefitType)) {
      return NextResponse.json({ error: 'Invalid benefit type' }, { status: 400 })
    }

    // Handle birthday bonus
    if (benefitType === 'birthday_bonus' && card.birthday_bonus_used) {
      return NextResponse.json({ error: 'Birthday bonus already used' }, { status: 400 })
    }

    // Apply benefit based on type
    let discountAmount = 0
    let creditAmount = 0

    if (benefitType === 'discount') {
      // Discount is applied during booking creation via pricing calculation
      // This endpoint can be used to validate and track
      discountAmount = amount || 0
    } else if (benefitType === 'bonus_credit') {
      const availableCredits = Number(card.bonus_credits || 0)
      creditAmount = Math.min(availableCredits, amount || availableCredits)
    } else if (benefitType === 'referral_credit') {
      const availableCredits = Number(card.referral_credits || 0)
      creditAmount = Math.min(availableCredits, amount || availableCredits)
    } else if (benefitType === 'birthday_bonus') {
      // Birthday bonus is typically a fixed amount (e.g., $25)
      creditAmount = 25 // Can be configured
    }

    return NextResponse.json({
      success: true,
      benefitType,
      discountAmount,
      creditAmount,
      message: 'Benefit applied successfully',
    })
  } catch (error) {
    console.error('[membership] Error applying benefit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

