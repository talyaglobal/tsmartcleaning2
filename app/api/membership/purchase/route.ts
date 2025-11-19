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

    const { tier, paymentIntentId, designType } = await request.json()

    if (!tier || !TIER_CONFIG[tier as keyof typeof TIER_CONFIG]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Check if user already has an active membership
    const { data: existingCard } = await supabase
      .from('membership_cards')
      .select('id, status, expiration_date')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingCard && existingCard.status === 'active') {
      const expirationDate = new Date(existingCard.expiration_date)
      const now = new Date()
      if (expirationDate > now) {
        return NextResponse.json({ 
          error: 'You already have an active membership',
          existingCard 
        }, { status: 400 })
      }
    }

    const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
    
    // Generate card number and activation code
    const { data: cardNumberData } = await supabase.rpc('generate_card_number')
    const cardNumber = cardNumberData || `TSC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
    
    const { data: maskedData } = await supabase.rpc('generate_masked_card_number', { card_num: cardNumber })
    const cardNumberMasked = maskedData || `•••• •••• •••• ${cardNumber.slice(-4)}`
    
    // Generate activation code (6-digit random)
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Generate referral code from user name or email
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'USER'
    const { data: referralCodeData } = await supabase.rpc('generate_referral_code', { user_name: userName })
    const referralCode = referralCodeData || `${userName.toUpperCase().slice(0, 10)}${new Date().getFullYear()}`

    // Calculate expiration date (1 year from now)
    const purchaseDate = new Date()
    const expirationDate = new Date(purchaseDate)
    expirationDate.setFullYear(expirationDate.getFullYear() + 1)

    // Create membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        card_number: cardNumber,
        card_number_masked: cardNumberMasked,
        design_type: designType || 'purple',
        tier: tier,
        discount_percentage: tierConfig.discount,
        annual_cost: tierConfig.cost,
        status: 'pending',
        is_activated: false,
        activation_code: activationCode,
        purchase_date: purchaseDate.toISOString(),
        expiration_date: expirationDate.toISOString(),
        auto_renew: true,
        referral_code: referralCode,
      })
      .select()
      .single()

    if (cardError) {
      console.error('[membership] Error creating card:', cardError)
      return NextResponse.json({ error: 'Failed to create membership card' }, { status: 500 })
    }

    // Create purchase transaction
    const { error: transactionError } = await supabase
      .from('membership_transactions')
      .insert({
        membership_card_id: card.id,
        user_id: user.id,
        transaction_type: 'purchase',
        amount: tierConfig.cost,
        currency: 'USD',
        stripe_payment_intent_id: paymentIntentId || null,
        payment_status: paymentIntentId ? 'completed' : 'pending',
        metadata: {
          tier,
          design_type: designType || 'purple',
        },
      })

    if (transactionError) {
      console.error('[membership] Error creating transaction:', transactionError)
      // Don't fail the request, card is already created
    }

    // TODO: Send welcome email with activation code

    return NextResponse.json({
      card,
      activationCode, // In production, send via email instead
      message: 'Membership card created successfully',
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

