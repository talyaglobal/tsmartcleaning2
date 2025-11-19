import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

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

    const { activationCode, cardId } = await request.json()

    if (!activationCode || !cardId) {
      return NextResponse.json(
        { error: 'Activation code and card ID are required' },
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

    if (card.is_activated) {
      return NextResponse.json({ error: 'Card is already activated' }, { status: 400 })
    }

    // Verify activation code (case-insensitive, trim whitespace)
    const providedCode = String(activationCode || '').trim().toUpperCase()
    const cardCode = card.activation_code ? String(card.activation_code).trim().toUpperCase() : null
    
    if (!cardCode) {
      // If no activation code is set, allow activation (for auto-activated cards)
      // This can happen if card was purchased directly without activation code flow
      console.warn('[membership] Card has no activation code, allowing activation')
    } else if (cardCode !== providedCode) {
      return NextResponse.json({ 
        error: 'Invalid activation code. Please check the code and try again.',
        hint: 'Activation codes are case-insensitive' 
      }, { status: 400 })
    }

    // Activate the card
    const { data: updatedCard, error: updateError } = await supabase
      .from('membership_cards')
      .update({
        is_activated: true,
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single()

    if (updateError) {
      console.error('[membership] Error activating card:', updateError)
      return NextResponse.json({ error: 'Failed to activate card' }, { status: 500 })
    }

    // Create activation transaction
    await supabase
      .from('membership_transactions')
      .insert({
        membership_card_id: cardId,
        user_id: user.id,
        transaction_type: 'activation',
        amount: 0,
        payment_status: 'completed',
      })

    return NextResponse.json({
      card: updatedCard,
      message: 'Card activated successfully',
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

