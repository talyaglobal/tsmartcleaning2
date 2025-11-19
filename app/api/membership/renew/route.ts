import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

const TIER_CONFIG = {
  premium: { discount: 10, cost: 99, name: 'Premium' },
  pro: { discount: 15, cost: 149, name: 'Pro' },
  elite: { discount: 20, cost: 199, name: 'Elite' },
}

/**
 * POST /api/membership/renew
 * Renews an existing membership card
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

    const { cardId, paymentIntentId, autoRenew } = await request.json()

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      )
    }

    // Fetch membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const tierConfig = TIER_CONFIG[card.tier as keyof typeof TIER_CONFIG]
    if (!tierConfig) {
      return NextResponse.json({ error: 'Invalid card tier' }, { status: 400 })
    }

    // Calculate new expiration date
    const now = new Date()
    const currentExpiration = new Date(card.expiration_date)
    
    // If card is already expired, start renewal from today
    // Otherwise, extend from current expiration date
    const renewalStartDate = currentExpiration > now ? currentExpiration : now
    const newExpirationDate = new Date(renewalStartDate)
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1)

    // Update membership card
    const { data: updatedCard, error: updateError } = await supabase
      .from('membership_cards')
      .update({
        status: 'active',
        is_activated: true, // Auto-activate on renewal
        expiration_date: newExpirationDate.toISOString(),
        auto_renew: autoRenew !== undefined ? autoRenew : card.auto_renew,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single()

    if (updateError) {
      console.error('[membership] Error renewing card:', updateError)
      return NextResponse.json({ error: 'Failed to renew membership' }, { status: 500 })
    }

    // Create renewal transaction
    const { error: transactionError } = await supabase
      .from('membership_transactions')
      .insert({
        membership_card_id: cardId,
        user_id: user.id,
        transaction_type: 'renewal',
        amount: tierConfig.cost,
        currency: 'USD',
        stripe_payment_intent_id: paymentIntentId || null,
        payment_status: paymentIntentId ? 'completed' : 'pending',
        metadata: {
          tier: card.tier,
          previous_expiration: card.expiration_date,
          new_expiration: newExpirationDate.toISOString(),
          auto_renew: autoRenew !== undefined ? autoRenew : card.auto_renew,
        },
      })

    if (transactionError) {
      console.error('[membership] Error creating renewal transaction:', transactionError)
      // Don't fail the request, card is already renewed
    }

    // TODO: Send renewal confirmation email

    return NextResponse.json({
      card: updatedCard,
      message: 'Membership renewed successfully',
      renewalCost: tierConfig.cost,
      newExpirationDate: newExpirationDate.toISOString(),
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/membership/renew
 * Checks if a membership card is eligible for renewal and returns renewal information
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

    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      )
    }

    // Fetch membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const tierConfig = TIER_CONFIG[card.tier as keyof typeof TIER_CONFIG]
    if (!tierConfig) {
      return NextResponse.json({ error: 'Invalid card tier' }, { status: 400 })
    }

    // Calculate renewal eligibility
    const expirationDate = new Date(card.expiration_date)
    const now = new Date()
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 24))
    const isExpired = expirationDate <= now
    const canRenew = isExpired || daysUntilExpiration <= 30 // Can renew up to 30 days before expiration

    // Calculate new expiration date
    const renewalStartDate = expirationDate > now ? expirationDate : now
    const newExpirationDate = new Date(renewalStartDate)
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1)

    return NextResponse.json({
      eligible: canRenew,
      isExpired,
      daysUntilExpiration: Math.max(0, daysUntilExpiration),
      currentExpiration: card.expiration_date,
      newExpirationDate: newExpirationDate.toISOString(),
      renewalCost: tierConfig.cost,
      tier: card.tier,
      autoRenew: card.auto_renew,
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

