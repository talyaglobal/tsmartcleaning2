import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

const TIER_CONFIG = {
  premium: { discount: 10, cost: 99, name: 'Premium' },
  pro: { discount: 15, cost: 149, name: 'Pro' },
  elite: { discount: 20, cost: 199, name: 'Elite' },
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)
    
    // Get user from session
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

    const { newTier, cardId } = await request.json()

    if (!newTier || !cardId) {
      return NextResponse.json(
        { error: 'New tier and card ID are required' },
        { status: 400 }
      )
    }

    if (!TIER_CONFIG[newTier as keyof typeof TIER_CONFIG]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Fetch current membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const currentTier = card.tier as keyof typeof TIER_CONFIG
    if (currentTier === newTier) {
      return NextResponse.json({ error: 'Already on this tier' }, { status: 400 })
    }

    // Check if upgrading (not downgrading)
    const tierOrder = ['premium', 'pro', 'elite']
    const currentIndex = tierOrder.indexOf(currentTier)
    const newIndex = tierOrder.indexOf(newTier)
    
    if (newIndex < currentIndex) {
      return NextResponse.json({ error: 'Downgrades must be done through support' }, { status: 400 })
    }

    const tierConfig = TIER_CONFIG[newTier as keyof typeof TIER_CONFIG]
    const upgradeCost = tierConfig.cost - TIER_CONFIG[currentTier].cost

    // Calculate prorated cost based on remaining days
    const expirationDate = new Date(card.expiration_date)
    const now = new Date()
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const daysTotal = 365
    const proratedCost = Math.round((upgradeCost * daysRemaining) / daysTotal)

    // Update card tier
    const { data: updatedCard, error: updateError } = await supabase
      .from('membership_cards')
      .update({
        tier: newTier,
        discount_percentage: tierConfig.discount,
        annual_cost: tierConfig.cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single()

    if (updateError) {
      console.error('[membership] Error upgrading card:', updateError)
      return NextResponse.json({ error: 'Failed to upgrade card' }, { status: 500 })
    }

    // Create upgrade transaction
    await supabase
      .from('membership_transactions')
      .insert({
        membership_card_id: cardId,
        user_id: user.id,
        transaction_type: 'upgrade',
        amount: proratedCost,
        payment_status: 'pending', // In production, integrate with Stripe
        metadata: {
          from_tier: currentTier,
          to_tier: newTier,
          prorated_cost: proratedCost,
          days_remaining: daysRemaining,
        },
      })

    return NextResponse.json({
      card: updatedCard,
      upgradeCost: proratedCost,
      message: 'Upgrade initiated successfully',
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

