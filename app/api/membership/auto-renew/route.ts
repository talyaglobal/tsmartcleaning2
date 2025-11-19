import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

/**
 * POST /api/membership/auto-renew
 * Toggles auto-renewal setting for a membership card
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

    const { cardId, autoRenew } = await request.json()

    if (!cardId || typeof autoRenew !== 'boolean') {
      return NextResponse.json(
        { error: 'Card ID and autoRenew boolean are required' },
        { status: 400 }
      )
    }

    // Fetch and update membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const { data: updatedCard, error: updateError } = await supabase
      .from('membership_cards')
      .update({
        auto_renew: autoRenew,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single()

    if (updateError) {
      console.error('[membership] Error updating auto-renewal:', updateError)
      return NextResponse.json({ error: 'Failed to update auto-renewal setting' }, { status: 500 })
    }

    return NextResponse.json({
      card: updatedCard,
      message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'} successfully`,
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
 * GET /api/membership/auto-renew/process
 * Background job endpoint to process auto-renewals for expired or expiring cards
 * This should be called by a cron job or scheduled task
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is an internal/admin request (add proper auth check in production)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)

    const now = new Date()
    const expirationThreshold = new Date(now)
    expirationThreshold.setDate(expirationThreshold.getDate() + 7) // 7 days before expiration

    // Find cards eligible for auto-renewal
    const { data: eligibleCards, error: fetchError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('auto_renew', true)
      .eq('status', 'active')
      .lte('expiration_date', expirationThreshold.toISOString())
      .gte('expiration_date', now.toISOString()) // Not yet expired

    if (fetchError) {
      console.error('[membership] Error fetching cards for auto-renewal:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
    }

    const renewalResults = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each eligible card
    for (const card of eligibleCards || []) {
      renewalResults.processed++
      
      try {
        // Check for active payment method (in production, check Stripe subscription)
        // For now, we'll just update the expiration date
        // In production, this should:
        // 1. Charge the payment method on file
        // 2. Create a renewal transaction
        // 3. Extend expiration date
        // 4. Send confirmation email

        const expirationDate = new Date(card.expiration_date)
        const newExpirationDate = new Date(expirationDate)
        newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1)

        const { error: updateError } = await supabase
          .from('membership_cards')
          .update({
            expiration_date: newExpirationDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', card.id)

        if (updateError) {
          renewalResults.failed++
          renewalResults.errors.push(`Card ${card.id}: ${updateError.message}`)
        } else {
          renewalResults.succeeded++

          // Create renewal transaction (without payment for now - needs Stripe integration)
          await supabase
            .from('membership_transactions')
            .insert({
              membership_card_id: card.id,
              user_id: card.user_id,
              transaction_type: 'renewal',
              amount: Number(card.annual_cost || 0),
              currency: 'USD',
              payment_status: 'pending', // In production, update after successful payment
              metadata: {
                auto_renewed: true,
                previous_expiration: card.expiration_date,
                new_expiration: newExpirationDate.toISOString(),
              },
            })
            .catch((error) => {
              console.error(`[membership] Error creating renewal transaction for card ${card.id}:`, error)
            })

          // TODO: Send renewal confirmation email
        }
      } catch (error) {
        renewalResults.failed++
        renewalResults.errors.push(`Card ${card.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: 'Auto-renewal processing completed',
      results: renewalResults,
    })
  } catch (error) {
    console.error('[membership] Error processing auto-renewals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

