import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * Process a refund for a transaction
 * POST /api/transactions/[id]/refund
 * Body: { amount?: number, reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id
    const { amount, reason = 'requested_by_customer' } = await request.json().catch(() => ({}))

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Fetch transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*, bookings(*)')
      .eq('id', transactionId)
      .eq('transaction_type', 'payment')
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or not refundable' },
        { status: 404 }
      )
    }

    // Check if already refunded
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transaction already refunded' },
        { status: 400 }
      )
    }

    if (!transaction.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Transaction does not have a Stripe payment intent' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Calculate refund amount
    const refundAmount = amount
      ? Math.round(Number(amount) * 100) // Convert to cents
      : undefined // Full refund if not specified

    if (refundAmount && refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Create refund in Stripe
    let refund: Stripe.Refund
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: transaction.stripe_payment_intent_id,
        reason: reason as Stripe.RefundCreateParams.Reason,
      }

      if (refundAmount) {
        refundParams.amount = refundAmount
      }

      refund = await stripe.refunds.create(refundParams)
    } catch (error: any) {
      console.error('[refund] Stripe refund error:', error)
      return NextResponse.json(
        { error: `Refund failed: ${error.message}` },
        { status: 500 }
      )
    }

    // Create refund transaction record
    const refundAmountDecimal = refundAmount ? refundAmount / 100 : transaction.amount
    const { data: refundTransaction, error: refundTransactionError } = await supabase
      .from('transactions')
      .insert({
        booking_id: transaction.booking_id,
        customer_id: transaction.customer_id,
        provider_id: transaction.provider_id || null,
        amount: refundAmountDecimal,
        platform_fee: 0,
        provider_payout: 0,
        transaction_type: 'refund',
        payment_method: transaction.payment_method || 'card',
        stripe_payment_intent_id: transaction.stripe_payment_intent_id,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
      })
      .select()
      .single()

    if (refundTransactionError) {
      console.error('[refund] Error creating refund transaction record:', refundTransactionError)
      // Refund succeeded in Stripe but record failed - log but don't fail
    }

    // Update original transaction status
    if (refund.status === 'succeeded') {
      await supabase
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId)

      // Update booking if full refund
      if (!refundAmount || refundAmountDecimal >= transaction.amount) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'refunded',
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.booking_id)
      }
      // Note: For partial refunds, booking status remains 'paid' as per schema constraints
    }

    return NextResponse.json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason,
      },
      refundTransaction,
      message: 'Refund processed successfully',
    })
  } catch (error: any) {
    console.error('[refund] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

